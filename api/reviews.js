const crypto = require('crypto');
const { enforceRateLimit } = require('./_lib/rate-limit');
const { sendTwilioWhatsApp } = require('./_lib/whatsapp-alert');

const REVIEW_WINDOW_MS = 60 * 60 * 1000;
const REVIEW_LIMIT = 6;
const MAX_REVIEW_IMAGES = 5;
const MAX_IMAGE_BYTES = 1.6 * 1024 * 1024;
const REVIEW_BUCKET = process.env.SUPABASE_REVIEW_BUCKET || 'review-photos';

function supabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('Supabase review storage is not configured');
  return { url: url.replace(/\/$/, ''), key };
}

function headers(key, prefer) {
  const result = {
    'Content-Type': 'application/json',
    apikey: key,
    Authorization: `Bearer ${key}`,
  };
  if (prefer) result.Prefer = prefer;
  return result;
}

async function responseJson(response, operation) {
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      data = text;
    }
  }
  if (!response.ok) {
    const detail = typeof data === 'string' ? data : JSON.stringify(data || {});
    throw new Error(`${operation} failed (${response.status}): ${detail.slice(0, 300)}`);
  }
  return data;
}

function cleanText(value, limit) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit);
}

function parseImageData(value, index) {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/i.exec(String(value || ''));
  if (!match) throw new Error('Please upload JPG, PNG or WebP photos only.');

  const contentType = match[1].toLowerCase();
  const buffer = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
  if (!buffer.length) throw new Error(`Review photo ${index + 1} is empty.`);
  if (buffer.length > MAX_IMAGE_BYTES) throw new Error(`Review photo ${index + 1} is too large. Please upload a smaller image.`);

  const extension = contentType === 'image/jpeg' ? 'jpg' : contentType.split('/')[1];
  return { buffer, contentType, extension };
}

function parseReviewImages(payload) {
  const values = Array.isArray(payload.imagesData) && payload.imagesData.length
    ? payload.imagesData
    : [payload.imageData];
  const limited = values.filter(Boolean).slice(0, MAX_REVIEW_IMAGES);
  if (!limited.length) throw new Error('Please upload at least one sign photo.');
  return limited.map(parseImageData);
}

function objectUrl(baseUrl, bucket, path, isPublic) {
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  const prefix = isPublic ? 'object/public' : 'object';
  return `${baseUrl}/storage/v1/${prefix}/${encodeURIComponent(bucket)}/${encodedPath}`;
}

function isMissingBucketError(status, text) {
  return (status === 400 || status === 404) && /bucket not found|no such bucket/i.test(text || '');
}

async function ensureReviewBucket(baseUrl, key) {
  const response = await fetch(`${baseUrl}/storage/v1/bucket`, {
    method: 'POST',
    signal: AbortSignal.timeout(8000),
    headers: headers(key),
    body: JSON.stringify({
      id: REVIEW_BUCKET,
      name: REVIEW_BUCKET,
      public: true,
      file_size_limit: Math.floor(MAX_IMAGE_BYTES),
      allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp'],
    }),
  });
  const text = await response.text();
  if (!response.ok && !/already exists|duplicate/i.test(text || '')) {
    throw new Error(`Create review photo bucket failed (${response.status}): ${text.slice(0, 300)}`);
  }
}

async function uploadReviewObject(baseUrl, key, imagePath, image) {
  return fetch(objectUrl(baseUrl, REVIEW_BUCKET, imagePath, false), {
    method: 'PUT',
    signal: AbortSignal.timeout(12000),
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': image.contentType,
      'Cache-Control': '31536000',
      'x-upsert': 'false',
    },
    body: image.buffer,
  });
}

async function uploadReviewPhoto(baseUrl, key, image, index) {
  const imagePath = `pending/${Date.now()}-${index}-${crypto.randomBytes(8).toString('hex')}.${image.extension}`;
  let response = await uploadReviewObject(baseUrl, key, imagePath, image);
  let text = await response.text();

  if (!response.ok && isMissingBucketError(response.status, text)) {
    await ensureReviewBucket(baseUrl, key);
    response = await uploadReviewObject(baseUrl, key, imagePath, image);
    text = await response.text();
  }

  if (!response.ok) {
    throw new Error(`Upload review photo failed (${response.status}): ${text.slice(0, 300)}`);
  }

  return {
    imagePath,
    imageUrl: objectUrl(baseUrl, REVIEW_BUCKET, imagePath, true),
  };
}

async function uploadReviewPhotos(baseUrl, key, images) {
  const photos = [];
  for (const [index, image] of images.entries()) {
    photos.push(await uploadReviewPhoto(baseUrl, key, image, index));
  }
  return photos;
}

async function listApprovedReviews() {
  const { url, key } = supabaseConfig();
  const baseQuery = `${url}/rest/v1/customer_reviews?status=eq.approved&order=created_at.desc&limit=24`;
  const options = {
    signal: AbortSignal.timeout(8000),
    headers: headers(key),
  };

  try {
    const response = await fetch(
      `${baseQuery}&select=id,name,city,product,description,image_url,image_urls,created_at`,
      options
    );
    const rows = await responseJson(response, 'Load customer reviews');
    return Array.isArray(rows) ? rows : [];
  } catch (error) {
    if (!/image_urls|schema cache|column/i.test(error.message)) throw error;
    const fallback = await fetch(
      `${baseQuery}&select=id,name,city,product,description,image_url,created_at`,
      options
    );
    const rows = await responseJson(fallback, 'Load customer reviews');
    return Array.isArray(rows) ? rows : [];
  }
}

async function createPendingReview(payload) {
  const name = cleanText(payload.name, 80);
  const city = cleanText(payload.city, 80);
  const product = cleanText(payload.product, 120);
  const description = cleanText(payload.description, 700);

  if (name.length < 2) throw new Error('Please enter your name.');
  if (description.length < 10) throw new Error('Please write a short review description.');

  const images = parseReviewImages(payload);
  const { url, key } = supabaseConfig();
  const photos = await uploadReviewPhotos(url, key, images);
  const mainPhoto = photos[0];

  const row = {
    name,
    city,
    product,
    description,
    image_url: mainPhoto.imageUrl,
    image_path: mainPhoto.imagePath,
    image_urls: photos.map(photo => photo.imageUrl),
    image_paths: photos.map(photo => photo.imagePath),
    status: 'pending',
  };

  const response = await fetch(`${url}/rest/v1/customer_reviews`, {
    method: 'POST',
    signal: AbortSignal.timeout(8000),
    headers: headers(key, 'return=representation'),
    body: JSON.stringify(row),
  });
  if (!response.ok) {
    const text = await response.text();
    if (/image_urls|image_paths|schema cache|column/i.test(text)) {
      throw new Error('Multiple photo support needs the latest Supabase review SQL. Run the updated customer_reviews SQL, then try again.');
    }
    throw new Error(`Save customer review failed (${response.status}): ${text.slice(0, 300)}`);
  }
  const rows = await responseJson(response, 'Save customer review');
  const saved = Array.isArray(rows) && rows.length ? rows[0] : row;

  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_WHATSAPP_FROM && process.env.TWILIO_WHATSAPP_TO) {
    try {
      await sendTwilioWhatsApp(
        `NEW REVIEW WAITING\nName: ${name}\nProduct: ${product || 'Not specified'}\nCity: ${city || 'Not specified'}\nApprove it in Supabase customer_reviews.`
      );
    } catch (error) {
      console.error('Review WhatsApp alert failed:', error.message);
    }
  }

  return saved;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const reviews = await listApprovedReviews();
      return res.status(200).json({ reviews });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!enforceRateLimit(req, res, 'submit-review', REVIEW_LIMIT, REVIEW_WINDOW_MS)) return;

    const saved = await createPendingReview(req.body || {});
    return res.status(200).json({
      success: true,
      reviewId: saved.id || null,
      message: 'Thank you. Your review is waiting for approval.',
    });
  } catch (error) {
    console.error('Review API error:', error.message);
    return res.status(500).json({ error: error.message });
  }
};
