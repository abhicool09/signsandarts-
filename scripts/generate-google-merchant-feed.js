const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const site = 'https://signsandarts.in';
const outputPath = path.join(root, 'google-merchant-feed.xml');
const csvOutputPath = path.join(root, 'google-merchant-feed.csv');
const pixelProducts = require(path.join(root, 'pixel-led', 'products.json'));

const categories = {
  signage: 'Business & Industrial > Signage > Electric Signs > Lighted Signs',
  accessories: 'Electronics > Electronics Accessories > Power',
  pixel: 'Business & Industrial > Signage > Electric Signs > Lighted Signs',
};

function item({
  id,
  title,
  description,
  slug,
  image,
  additionalImages = [],
  price,
  brand = 'Signs and Arts',
  googleProductCategory = categories.signage,
  productType = 'LED Sign Boards',
  itemGroupId = '',
  size = '',
}) {
  return {
    id,
    title,
    description,
    link: `${site}/${slug}`,
    imageLink: `${site}/${image}`,
    additionalImages: additionalImages.map(imagePath => `${site}/${imagePath}`),
    availability: 'in_stock',
    price: `${Number(price).toFixed(2)} INR`,
    brand,
    condition: 'new',
    mpn: id,
    googleProductCategory,
    productType,
    itemGroupId,
    size,
  };
}

const staticItems = [
  item({
    id: 'sa-12v-5a-60w-led-adapter',
    title: '12V 5A 60W LED Adapter',
    description: 'Buy a Hilight 12V 5A 60W indoor power adapter for LED strips, LED modules, neon signs and CCTV, with a 2.1 x 5.5 mm centre-positive DC connector.',
    slug: '12v-5a-60w-led-adapter',
    image: '12v-5a-60w-led-adapter/image-1.webp',
    additionalImages: [
      '12v-5a-60w-led-adapter/image-2.webp',
      '12v-5a-60w-led-adapter/image-3.webp',
      '12v-5a-60w-led-adapter/image-4.webp',
    ],
    price: 371,
    googleProductCategory: categories.accessories,
    productType: 'Accessories',
  }),
  item({
    id: 'sa-bar-led-sign-board',
    title: 'Bar LED Sign Board 18x12 Single Sided Indoor',
    description: 'Buy Bar LED Sign Board 18x12 inch with multicolor LED bar mugs graphic. Single sided indoor board, plug and play, ideal for bars, restaurants, pubs and hotels.',
    slug: 'bar-led-sign-board',
    image: 'bar-led-sign-board/main.webp',
    additionalImages: [
      'bar-led-sign-board/lifestyle.webp',
      'bar-led-sign-board/size.webp',
      'bar-led-sign-board/features.webp',
    ],
    price: 2189,
    size: '18x12 inch',
  }),
  item({
    id: 'sa-clinic-led-sign-board-18x18',
    title: 'Clinic Sign Board - Clinic Plus LED Sign Board 18x18 inch',
    description: 'Buy Clinic Plus LED Sign Board 18x18 inch in red and white. Clinic LED sign board / clinic sign board for clinic entrances, doctor offices, hospitals and medical storefronts. Double-sided pixel LED cross sign with weatherproof iron frame, hook mounting and 230V plug-and-play power.',
    slug: 'clinic-led-sign-board',
    image: 'clinic-led-sign-board/main.webp',
    additionalImages: [
      'clinic-led-sign-board/size.webp',
      'clinic-led-sign-board/features.webp',
      'clinic-led-sign-board/lit.webp',
    ],
    price: 2689,
    itemGroupId: 'sa-clinic-led-sign-board',
    size: '18x18 inch',
  }),
  item({
    id: 'sa-clinic-led-sign-board-24x24',
    title: 'Clinic Sign Board - Clinic Plus LED Sign Board 24x24 inch',
    description: 'Buy Clinic Plus LED Sign Board 24x24 inch in red and white. Larger clinic LED sign board / clinic sign board for better road visibility at clinics, hospitals and doctor offices. Pixel LED lighting, weatherproof iron frame, hook mounting and 230V plug-and-play installation.',
    slug: 'clinic-led-sign-board',
    image: 'clinic-led-sign-board/main-24.webp',
    additionalImages: [
      'clinic-led-sign-board/perspective-24.webp',
      'clinic-led-sign-board/front-24.webp',
      'clinic-led-sign-board/features-24.webp',
    ],
    price: 5489,
    itemGroupId: 'sa-clinic-led-sign-board',
    size: '24x24 inch',
  }),
  item({
    id: 'sa-neuro-plus-led-sign-board-18x18',
    title: 'Neuro Plus LED Sign Board 18x18 inch',
    description: 'Buy Neuro Plus LED Sign Board 18x18 inch with red plus-style body, white NEURO lettering, bright pixel LEDs, iron frame, weatherproof build and plug-and-play installation for neurology clinics.',
    slug: 'neuro-plus-led-sign-board',
    image: 'neuro-plus-led-sign-board/main.webp',
    additionalImages: [
      'neuro-plus-led-sign-board/size.webp',
      'neuro-plus-led-sign-board/features.webp',
      'neuro-plus-led-sign-board/front.webp',
    ],
    price: 2689,
    itemGroupId: 'sa-neuro-plus-led-sign-board',
    size: '18x18 inch',
  }),
  item({
    id: 'sa-neuro-plus-led-sign-board-24x24',
    title: 'Neuro Plus LED Sign Board 24x24 inch',
    description: 'Buy Neuro Plus LED Sign Board 24x24 inch with the same red and white NEURO plus design in a larger size for better road visibility. Pixel LEDs, iron frame, weatherproof build and plug-and-play installation.',
    slug: 'neuro-plus-led-sign-board',
    image: 'neuro-plus-led-sign-board/main.webp',
    additionalImages: [
      'neuro-plus-led-sign-board/features.webp',
      'neuro-plus-led-sign-board/front.webp',
      'neuro-plus-led-sign-board/overview.webp',
    ],
    price: 5489,
    itemGroupId: 'sa-neuro-plus-led-sign-board',
    size: '24x24 inch',
  }),
  item({
    id: 'sa-clinic-medical-led-sign-board',
    title: 'Clinic Medical LED Sign Board',
    description: 'Buy Clinic Medical LED Sign Board 24x18 inch in green and red. Use for clinics, medical shops, drug stores and hospital entrances. Double-sided flashing pixel LED display with CLINIC and MEDICAL text, waterproof storefront-ready frame, wall mounting and plug-and-play power.',
    slug: 'clinic-medical-led-sign-board',
    image: 'clinic-medical-led-sign-board/main.webp',
    additionalImages: [
      'clinic-medical-led-sign-board/size.webp',
      'clinic-medical-led-sign-board/features.webp',
      'clinic-medical-led-sign-board/hook.webp',
    ],
    price: 6819,
    size: '24x18 inch',
  }),
  item({
    id: 'sa-computer-repair-led-sign-board',
    title: 'Computer Repair LED Sign Board 18x12 Single Sided Indoor',
    description: 'Buy Computer Repair LED Sign Board 18x12 inch for computer repair shops, laptop service centers and electronics counters. Single sided indoor board, plug and play.',
    slug: 'computer-repair-led-sign-board',
    image: 'computer-repair-led-sign-board/main.webp',
    additionalImages: [
      'computer-repair-led-sign-board/led-on-off.webp',
      'computer-repair-led-sign-board/features.webp',
      'computer-repair-led-sign-board/size.webp',
    ],
    price: 2189,
    size: '18x12 inch',
  }),
  item({
    id: 'sa-dental-led-sign-board',
    title: 'Dental LED Sign Board',
    description: 'Buy Dental LED Sign Board 24x18 inch with red tooth graphic and white DENTAL lettering. Double sided pixel LED board, waterproof and plug and play.',
    slug: 'dental-led-sign-board',
    image: 'dental-led-sign-board/main.webp',
    additionalImages: [
      'dental-led-sign-board/size.webp',
      'dental-led-sign-board/features.webp',
      'dental-led-sign-board/lit.webp',
    ],
    price: 5128,
    size: '24x18 inch',
  }),
  item({
    id: 'sa-dental-plus-led-sign-board-18x18',
    title: 'Dental Plus LED Sign Board 18x18 inch',
    description: 'Buy Dental Plus LED Sign Board 18x18 inch with red plus-style body, white DENTAL lettering, bright pixel LEDs, iron frame, weatherproof build and plug-and-play installation for dental clinics.',
    slug: 'dental-plus-led-sign-board',
    image: 'dental-plus-led-sign-board/main.webp',
    additionalImages: [
      'dental-plus-led-sign-board/size.webp',
      'dental-plus-led-sign-board/features.webp',
      'dental-plus-led-sign-board/front.webp',
    ],
    price: 2689,
    itemGroupId: 'sa-dental-plus-led-sign-board',
    size: '18x18 inch',
  }),
  item({
    id: 'sa-dental-plus-led-sign-board-24x24',
    title: 'Dental Plus LED Sign Board 24x24 inch',
    description: 'Buy Dental Plus LED Sign Board 24x24 inch with the same red and white dental plus design in a larger size for better road visibility. Pixel LEDs, iron frame, weatherproof build and plug-and-play installation.',
    slug: 'dental-plus-led-sign-board',
    image: 'dental-plus-led-sign-board/main.webp',
    additionalImages: [
      'dental-plus-led-sign-board/features.webp',
      'dental-plus-led-sign-board/front.webp',
      'dental-plus-led-sign-board/overview.webp',
    ],
    price: 5489,
    itemGroupId: 'sa-dental-plus-led-sign-board',
    size: '24x24 inch',
  }),
  item({
    id: 'sa-green-clinic-led-sign-board-18x18',
    title: 'Clinic LED Sign Board - Green Cross LED Board 18x18 inch',
    description: 'Buy Clinic LED Sign Board 18x18 inch in green. Green cross LED board / clinic sign board for clinic entrances, hospitals, doctor offices and roadside medical signage. Double-sided pixel LEDs, weatherproof iron frame, hook mounting, 230V plug-and-play power and pan-India delivery.',
    slug: 'green-clinic-led-sign-board',
    image: 'green-clinic-led-sign-board/main.webp',
    additionalImages: [
      'green-clinic-led-sign-board/size.webp',
      'green-clinic-led-sign-board/features.webp',
      'green-clinic-led-sign-board/perspective.webp',
    ],
    price: 2689,
    itemGroupId: 'sa-green-clinic-led-sign-board',
    size: '18x18 inch',
  }),
  item({
    id: 'sa-green-clinic-led-sign-board-24x24',
    title: 'Clinic LED Sign Board - Green Cross LED Board 24x24 inch',
    description: 'Buy Clinic LED Sign Board 24x24 inch in green. Larger green cross LED board / clinic sign board for better visibility outside clinics, hospitals and doctor offices. Weatherproof iron frame, hook mounting, 230V plug-and-play power, COD and pan-India delivery.',
    slug: 'green-clinic-led-sign-board',
    image: 'green-clinic-led-sign-board/main.webp',
    additionalImages: [
      'green-clinic-led-sign-board/size.webp',
      'green-clinic-led-sign-board/features.webp',
      'green-clinic-led-sign-board/perspective.webp',
    ],
    price: 5489,
    itemGroupId: 'sa-green-clinic-led-sign-board',
    size: '24x24 inch',
  }),
  item({
    id: 'sa-hair-salon-led-sign-board',
    title: 'Hair Salon LED Sign Board 18x12 Single Sided Indoor',
    description: 'Buy Hair Salon LED Sign Board 18x12 inch with white scissors graphic and red HAIR SALON lettering. Single sided indoor board for salons and grooming studios.',
    slug: 'hair-salon-led-sign-board',
    image: 'hair-salon-led-sign-board/main.webp',
    additionalImages: [
      'hair-salon-led-sign-board/led-on-off.webp',
      'hair-salon-led-sign-board/features.webp',
      'hair-salon-led-sign-board/size.webp',
    ],
    price: 2189,
    size: '18x12 inch',
  }),
  item({
    id: 'sa-led-dimmer-controller',
    title: 'Inline LED Dimmer Controller for Single Color LED Strips',
    description: 'Buy Signs and Arts mini inline LED dimmer controller for single-color 12V-24V DC LED strips. Mode, speed and brightness buttons with auto memory.',
    slug: 'led-dimmer-controller',
    image: 'led-dimmer-controller/main.webp',
    additionalImages: [
      'led-dimmer-controller/feed-clean.webp',
      'led-dimmer-controller/feed-detail.webp',
    ],
    price: 90,
    googleProductCategory: categories.accessories,
    productType: 'Accessories',
  }),
  item({
    id: 'sa-led-strip-remote-controller',
    title: 'LED Strip Remote Controller',
    description: 'Buy Signs and Arts mini RF remote controller for single-color 12V DC LED strip lights. Brightness, mode and speed controls, compatible with common LED strips.',
    slug: 'led-strip-remote-controller',
    image: 'led-strip-remote-controller/main.webp',
    additionalImages: [
      'led-strip-remote-controller/controller.webp',
      'led-strip-remote-controller/overview.webp',
      'led-strip-remote-controller/installation.webp',
    ],
    price: 339,
    googleProductCategory: categories.accessories,
    productType: 'Accessories',
  }),
  item({
    id: 'sa-love-neon-led-sign',
    title: 'Love Neon LED Sign',
    description: 'Buy Love Neon LED Sign in pink. Acrylic neon light for room decor, table decoration, gifts, night light, bar and hotel use. USB and battery powered.',
    slug: 'love-neon-led-sign',
    image: 'love-neon-led-sign/main.webp',
    additionalImages: [
      'love-neon-led-sign/size.webp',
      'love-neon-led-sign/features.webp',
      'love-neon-led-sign/lifestyle1.webp',
    ],
    price: 400,
  }),
  item({
    id: 'sa-medical-pharmacy-led-sign-board-18x18',
    title: 'Medical & Pharmacy LED Sign Board - Green Cross Plus 18x18 inch',
    description: 'Buy Medical & Pharmacy LED Sign Board 18x18 inch in green. Medical LED sign board / pharmacy LED sign board for medical stores, pharmacies, drug stores and clinic counters. Green cross LED board and medical cross light board style with flashing pixel LEDs, weatherproof iron frame and plug-and-play power.',
    slug: 'medical-pharmacy-led-sign-board',
    image: 'medical-pharmacy-led-sign-board/main.webp',
    additionalImages: [
      'medical-pharmacy-led-sign-board/size.webp',
      'medical-pharmacy-led-sign-board/features.webp',
      'medical-pharmacy-led-sign-board/led.webp',
    ],
    price: 2789,
    itemGroupId: 'sa-medical-pharmacy-led-sign-board',
    size: '18x18 inch',
  }),
  item({
    id: 'sa-medical-pharmacy-led-sign-board-24x24',
    title: 'Medical & Pharmacy LED Sign Board - Green Cross Plus 24x24 inch',
    description: 'Buy Medical & Pharmacy LED Sign Board 24x24 inch in green. Larger medical shop LED board and pharmacy sign board for medical shops, pharmacies, drug stores and roadside storefronts. Green cross LED board / medical cross light board style with flashing pixel LEDs, weatherproof iron frame and plug-and-play power.',
    slug: 'medical-pharmacy-led-sign-board',
    image: 'medical-pharmacy-led-sign-board/main-24.webp',
    additionalImages: [
      'medical-pharmacy-led-sign-board/perspective-24.webp',
      'medical-pharmacy-led-sign-board/front-24.webp',
      'medical-pharmacy-led-sign-board/features-24.webp',
    ],
    price: 5489,
    itemGroupId: 'sa-medical-pharmacy-led-sign-board',
    size: '24x24 inch',
  }),
  item({
    id: 'sa-medical-plus-led-sign-board-18x18',
    title: 'Medical Plus LED Sign Board - Medical Cross Light Board 18x18 inch',
    description: 'Buy Medical Plus LED Sign Board 18x18 inch in green for medical stores and pharmacies. Medical cross LED board / medical cross light board with plus symbol, medical shop LED board use, double-sided 9mm pixel LEDs, weatherproof iron frame, hook mounting and plug-and-play installation.',
    slug: 'medical-plus-led-sign-board',
    image: 'medical-plus-led-sign-board/main.webp',
    additionalImages: [
      'medical-plus-led-sign-board/size.webp',
      'medical-plus-led-sign-board/features.webp',
      'medical-plus-led-sign-board/led.webp',
    ],
    price: 2689,
    itemGroupId: 'sa-medical-plus-led-sign-board',
    size: '18x18 inch',
  }),
  item({
    id: 'sa-medical-plus-led-sign-board-24x24',
    title: 'Medical Plus LED Sign Board - Medical Cross Light Board 24x24 inch',
    description: 'Buy Medical Plus LED Sign Board 24x24 inch in green. Larger medical cross LED board / medical cross light board for high visibility outside medical shops, pharmacies and clinics. Fits medical shop LED board, plus sign medical store light and LED sign board for pharmacy needs.',
    slug: 'medical-plus-led-sign-board',
    image: 'medical-plus-led-sign-board/main-24.webp',
    additionalImages: [
      'medical-plus-led-sign-board/perspective-24.webp',
      'medical-plus-led-sign-board/front-24.webp',
      'medical-plus-led-sign-board/features-24.webp',
    ],
    price: 5489,
    itemGroupId: 'sa-medical-plus-led-sign-board',
    size: '24x24 inch',
  }),
  item({
    id: 'sa-medical-red-led-sign-board-18x18',
    title: 'Medical LED Sign Board - Medical Shop LED Board 18x18 inch',
    description: 'Buy Medical LED Sign Board 18x18 inch in red and green for medical shops, pharmacies, clinics and drug stores. Medical shop LED board with bright red MEDICAL letters, green pixel LED cross, double-sided display, weatherproof frame, hook mounting and plug-and-play power.',
    slug: 'medical-red-led-sign-board',
    image: 'medical-red-led-sign-board/main.webp',
    additionalImages: [
      'medical-red-led-sign-board/size.webp',
      'medical-red-led-sign-board/features.webp',
      'medical-red-led-sign-board/lit.webp',
    ],
    price: 2689,
    itemGroupId: 'sa-medical-red-led-sign-board',
    size: '18x18 inch',
  }),
  item({
    id: 'sa-medical-red-led-sign-board-24x24',
    title: 'Medical LED Sign Board - Medical Shop LED Board 24x24 inch',
    description: 'Buy Medical LED Sign Board 24x24 inch in red and green. Larger medical sign board LED / medical shop LED board for road visibility at pharmacies, clinics and drug stores. Bright red MEDICAL letters, green pixel LED cross, weatherproof frame, hook mounting and plug-and-play power.',
    slug: 'medical-red-led-sign-board',
    image: 'medical-red-led-sign-board/main.webp',
    additionalImages: [
      'medical-red-led-sign-board/size.webp',
      'medical-red-led-sign-board/features.webp',
      'medical-red-led-sign-board/lit.webp',
    ],
    price: 5489,
    itemGroupId: 'sa-medical-red-led-sign-board',
    size: '24x24 inch',
  }),
  item({
    id: 'sa-open-24-hours-led-sign-board',
    title: 'Open 24 Hours LED Sign Board 18x12 Single Sided Indoor',
    description: 'Buy Open 24 Hours LED Sign Board 18x12 inch with green OPEN text, red 24 HOURS lettering and white LED border. Single sided indoor board for shops and restaurants.',
    slug: 'open-24-hours-led-sign-board',
    image: 'open-24-hours-led-sign-board/main.webp',
    additionalImages: [
      'open-24-hours-led-sign-board/led-on-off.webp',
      'open-24-hours-led-sign-board/features.webp',
      'open-24-hours-led-sign-board/lifestyle.webp',
    ],
    price: 2189,
    size: '18x12 inch',
  }),
  item({
    id: 'sa-open-close-led-open-single',
    title: 'Open LED Sign Board 18x12 Single Sided Indoor',
    description: 'Buy Open LED Sign Board 18x12 inch for shops and retail stores. Bright green OPEN text with white border LEDs, plug and play, single sided indoor board.',
    slug: 'open-close-led-sign-board',
    image: 'open-close-led-sign-board/open-main.webp',
    additionalImages: [
      'open-close-led-sign-board/open-on-off.webp',
      'open-close-led-sign-board/open-features.webp',
      'open-close-led-sign-board/open-lifestyle.webp',
    ],
    price: 2189,
    itemGroupId: 'sa-open-close-led-sign-board',
    size: '18x12 inch',
  }),
  item({
    id: 'sa-open-close-led-close-single',
    title: 'Close LED Sign Board 18x12 Single Sided Indoor',
    description: 'Buy Close LED Sign Board 18x12 inch for shops and retail stores. Bright red CLOSE text with white border LEDs, plug and play, single sided indoor board.',
    slug: 'open-close-led-sign-board',
    image: 'open-close-led-sign-board/close-main.webp',
    additionalImages: [
      'open-close-led-sign-board/close-on-off.webp',
      'open-close-led-sign-board/close-features.webp',
      'open-close-led-sign-board/close-lifestyle.webp',
    ],
    price: 2189,
    itemGroupId: 'sa-open-close-led-sign-board',
    size: '18x12 inch',
  }),
  item({
    id: 'sa-open-close-led-combo',
    title: 'Open Close LED Sign Board Combo 18x12 Single Sided Indoor',
    description: 'Buy Open Close LED Sign Board combo for shops and retail stores. Includes Open and Close boards, plug and play, single sided indoor boards.',
    slug: 'open-close-led-sign-board',
    image: 'open-close-led-sign-board/open-main.webp',
    additionalImages: [
      'open-close-led-sign-board/close-main.webp',
      'open-close-led-sign-board/open-features.webp',
      'open-close-led-sign-board/close-features.webp',
    ],
    price: 3981,
    itemGroupId: 'sa-open-close-led-sign-board',
    size: '18x12 inch',
  }),
  item({
    id: 'sa-opticals-led-sign-board',
    title: 'Opticals LED Sign Board',
    description: 'Buy Opticals LED Sign Board 24x18 inch with red and white pixel LED OPTICALS lettering. Double sided, waterproof and plug and play for optical shops.',
    slug: 'opticals-led-sign-board',
    image: 'opticals-led-sign-board/main.webp',
    additionalImages: [
      'opticals-led-sign-board/size.webp',
      'opticals-led-sign-board/features.webp',
      'opticals-led-sign-board/front.webp',
    ],
    price: 6330,
    size: '24x18 inch',
  }),
  item({
    id: 'sa-optical-plus-led-sign-board-18x18',
    title: 'Optical Plus LED Sign Board 18x18 inch',
    description: 'Buy Optical Plus LED Sign Board 18x18 inch with red plus-style body, white OPTICAL lettering, bright pixel LEDs, iron frame, weatherproof build and plug-and-play installation for optical shops.',
    slug: 'optical-plus-led-sign-board',
    image: 'optical-plus-led-sign-board/main.webp',
    additionalImages: [
      'optical-plus-led-sign-board/size.webp',
      'optical-plus-led-sign-board/features.webp',
      'optical-plus-led-sign-board/front.webp',
    ],
    price: 2689,
    itemGroupId: 'sa-optical-plus-led-sign-board',
    size: '18x18 inch',
  }),
  item({
    id: 'sa-optical-plus-led-sign-board-24x24',
    title: 'Optical Plus LED Sign Board 24x24 inch',
    description: 'Buy Optical Plus LED Sign Board 24x24 inch with the same red and white optical plus design in a larger size for better road visibility. Pixel LEDs, iron frame, weatherproof build and plug-and-play installation.',
    slug: 'optical-plus-led-sign-board',
    image: 'optical-plus-led-sign-board/main.webp',
    additionalImages: [
      'optical-plus-led-sign-board/features.webp',
      'optical-plus-led-sign-board/front.webp',
      'optical-plus-led-sign-board/overview.webp',
    ],
    price: 5489,
    itemGroupId: 'sa-optical-plus-led-sign-board',
    size: '24x24 inch',
  }),
  item({
    id: 'sa-pan-shop-led-sign-board',
    title: 'PAN Shop LED Sign Board',
    description: 'Buy 18x12 inch double-sided PAN shop LED sign board with bright red and white pixel LEDs, directional arrows and wall-mountable outdoor-focused construction.',
    slug: 'pan-shop-led-sign-board',
    image: 'pan-shop-led-sign-board/image-1.webp',
    additionalImages: [
      'pan-shop-led-sign-board/image-2.webp',
      'pan-shop-led-sign-board/image-3.webp',
      'pan-shop-led-sign-board/image-4.webp',
    ],
    price: 2475,
    size: '18x12 inch',
  }),
  item({
    id: 'sa-pharmacy-plus-led-sign-18x18',
    title: 'Pharmacy LED Sign Board - Green Plus 18x18 inch',
    description: 'Buy Pharmacy Plus LED Sign Board 18x18 inch in green. Pharmacy LED sign board, pharmacy sign board and LED sign board for pharmacy with green cross LED board styling for medical stores, pharmacies and clinics.',
    slug: 'pharmacy-plus-led-sign',
    image: 'pharmacy-plus-led-sign/main.webp',
    additionalImages: [
      'pharmacy-plus-led-sign/size.webp',
      'pharmacy-plus-led-sign/features.webp',
      'pharmacy-plus-led-sign/front.webp',
    ],
    price: 2689,
    itemGroupId: 'sa-pharmacy-plus-led-sign',
    size: '18x18 inch',
  }),
  item({
    id: 'sa-pharmacy-plus-led-sign-24x24',
    title: 'Pharmacy LED Sign Board - Green Plus 24x24 inch',
    description: 'Buy Pharmacy Plus LED Sign Board 24x24 inch in green. Larger pharmacy LED sign board / pharmacy sign board and green cross LED board for medical stores, pharmacies and clinics.',
    slug: 'pharmacy-plus-led-sign',
    image: 'pharmacy-plus-led-sign/main-24.webp',
    additionalImages: [
      'pharmacy-plus-led-sign/perspective-24.webp',
      'pharmacy-plus-led-sign/front-24.webp',
      'pharmacy-plus-led-sign/features-24.webp',
    ],
    price: 5489,
    itemGroupId: 'sa-pharmacy-plus-led-sign',
    size: '24x24 inch',
  }),
  item({
    id: 'sa-rgb-pixel-led-controller',
    title: 'RGB Pixel LED Controller with 17-Key RF Remote',
    description: 'Buy Signs and Arts RGB addressable pixel LED controller with 17-key RF wireless remote for WS2811 and WS2812B pixel LED strips. DC 5-24V.',
    slug: 'rgb-pixel-led-controller',
    image: 'rgb-pixel-led-controller/main.webp',
    additionalImages: [
      'rgb-pixel-led-controller/img1.webp',
      'rgb-pixel-led-controller/feed-clean.webp',
      'rgb-pixel-led-controller/feed-detail.webp',
    ],
    price: 250,
    googleProductCategory: categories.accessories,
    productType: 'Accessories',
  }),
  item({
    id: 'sa-spa-open-led-sign-board',
    title: 'Spa Open LED Sign Board 18x12 Single Sided Indoor',
    description: 'Buy Spa Open LED Sign Board 18x12 inch with blue SPA text, green OPEN lettering and white oval border LEDs. Single sided indoor board for spas and salons.',
    slug: 'spa-open-led-sign-board',
    image: 'spa-open-led-sign-board/main.webp',
    additionalImages: [
      'spa-open-led-sign-board/led-on-off.webp',
      'spa-open-led-sign-board/features.webp',
      'spa-open-led-sign-board/size.webp',
    ],
    price: 2189,
    size: '18x12 inch',
  }),
  item({
    id: 'sa-tattoo-led-sign-board',
    title: 'Tattoo LED Sign Board 18x12 Single Sided Indoor',
    description: 'Buy Tattoo LED Sign Board 18x12 inch with bold red TATTOO text and white oval border LEDs. Single sided indoor board for tattoo studios and parlours.',
    slug: 'tattoo-led-sign-board',
    image: 'tattoo-led-sign-board/main.webp',
    additionalImages: [
      'tattoo-led-sign-board/led-on-off.webp',
      'tattoo-led-sign-board/features.webp',
      'tattoo-led-sign-board/lifestyle.webp',
    ],
    price: 2189,
    size: '18x12 inch',
  }),
  item({
    id: 'sa-xerox-store-led-sign-board',
    title: 'Xerox Store LED Sign Board',
    description: 'Buy Xerox Store LED Sign Board 18x12 inch with white and red lighting for xerox shops, print centers and copy shops. Plug and play storefront board.',
    slug: 'xerox-store-led-sign-board',
    image: 'xerox-store-led-sign-board/main.webp',
    additionalImages: [
      'xerox-store-led-sign-board/size.webp',
      'xerox-store-led-sign-board/features.webp',
      'xerox-store-led-sign-board/perspective.webp',
    ],
    price: 2178,
    size: '18x12 inch',
  }),
];

const specialtyPlusProducts = [
  {
    slug: 'ent-led-sign-board',
    title: 'ENT LED Sign Board',
    description: 'Buy ENT LED Sign Board in red and white for ENT clinics, doctor offices and specialty consultation rooms. Double-sided pixel LED board with iron frame, weatherproof build and plug-and-play installation.',
  },
  {
    slug: 'doctor-led-sign-board',
    title: 'Doctor LED Sign Board',
    description: 'Buy Doctor LED Sign Board in red and white for doctor clinics, consultation rooms, family clinics and medical offices. Double-sided pixel LED board with iron frame, weatherproof build and plug-and-play installation.',
  },
  {
    slug: 'orthopedic-led-sign-board',
    title: 'Orthopedic LED Sign Board',
    description: 'Buy Orthopedic LED Sign Board in red and white for orthopedic clinics, bone specialists, hospitals and doctor offices. Double-sided pixel LED board with iron frame, weatherproof build and plug-and-play installation.',
  },
  {
    slug: 'emergency-led-sign-board',
    title: 'Emergency LED Sign Board',
    description: 'Buy Emergency LED Sign Board in red and white for hospitals, emergency entrances, clinics and 24-hour medical facilities. Double-sided pixel LED board with iron frame, weatherproof build and plug-and-play installation.',
  },
  {
    slug: 'hospital-led-sign-board',
    title: 'Hospital LED Sign Board',
    description: 'Buy Hospital LED Sign Board in red and white for hospitals, clinics, nursing homes and medical entrances. Double-sided pixel LED board with iron frame, weatherproof build and plug-and-play installation.',
  },
  {
    slug: 'homeo-led-sign-board',
    title: 'Homeo LED Sign Board',
    description: 'Buy Homeo LED Sign Board in red and white for homeopathy clinics, homeo doctors and alternative medicine clinics. Double-sided pixel LED board with iron frame, weatherproof build and plug-and-play installation.',
  },
];

const specialtyPlusItems = specialtyPlusProducts.flatMap(product => [
  item({
    id: `sa-${product.slug}-18x18`,
    title: `${product.title} 18x18 inch`,
    description: `${product.description} 18x18 inch size, COD and pan-India delivery.`,
    slug: `${product.slug}/`,
    image: `${product.slug}/main.webp`,
    additionalImages: [
      `${product.slug}/size.webp`,
      `${product.slug}/features.webp`,
      `${product.slug}/overview.webp`,
    ],
    price: 2889,
    itemGroupId: `sa-${product.slug}`,
    size: '18x18 inch',
  }),
  item({
    id: `sa-${product.slug}-24x24`,
    title: `${product.title} 24x24 inch`,
    description: `${product.description} 24x24 inch size for stronger roadside visibility, COD and pan-India delivery.`,
    slug: `${product.slug}/`,
    image: `${product.slug}/main.webp`,
    additionalImages: [
      `${product.slug}/features.webp`,
      `${product.slug}/overview.webp`,
      `${product.slug}/front.webp`,
    ].filter(imagePath => fs.existsSync(path.join(root, imagePath))),
    price: 5489,
    itemGroupId: `sa-${product.slug}`,
    size: '24x24 inch',
  }),
]);

function cleanPixelTitle(value, sourceId) {
  return `${String(value)
    .replace(/["']/g, '')
    .replace(/\s+-\s+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()} ${sourceId} LED`;
}

const pixelItems = pixelProducts.map(product => item({
  id: `sa-${product.slug}`,
  title: cleanPixelTitle(product.name, product.sourceId),
  description: `Buy ${product.name} 12V pixel LED string with ${product.ledCount} LEDs, ${product.spacing} spacing, ${product.length} length, ${product.bulbSize} pixels and ${product.power} power for sign boards and decorative lighting.`,
  slug: `pixel-led/${product.slug}/`,
  image: `pixel-led/images/${product.slug}.webp`,
  additionalImages: [
    `pixel-led/images/feed/${product.slug}-clean.webp`,
    `pixel-led/images/feed/${product.slug}-detail.webp`,
  ],
  price: product.price,
  googleProductCategory: categories.pixel,
  productType: 'Pixel LEDs',
  size: product.spacing,
}));

const products = [...staticItems, ...specialtyPlusItems, ...pixelItems];

function escapeXml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function element(name, value, indent = 6) {
  if (value == null || value === '') return '';
  return `${' '.repeat(indent)}<${name}>${escapeXml(value)}</${name}>\n`;
}

function localPathFromUrl(url) {
  return path.join(root, new URL(url).pathname.replace(/^\/+/, ''));
}

function validate(productsToValidate) {
  const ids = new Set();
  for (const product of productsToValidate) {
    for (const field of ['id', 'title', 'description', 'link', 'imageLink', 'availability', 'price', 'brand', 'condition']) {
      if (!product[field]) throw new Error(`Missing ${field} for ${product.id || product.title}`);
    }
    if (ids.has(product.id)) throw new Error(`Duplicate product id: ${product.id}`);
    ids.add(product.id);
    if (!fs.existsSync(localPathFromUrl(product.imageLink))) {
      throw new Error(`Missing image file for ${product.id}: ${product.imageLink}`);
    }
    const linkPath = localPathFromUrl(product.link);
    const indexPath = product.link.endsWith('/')
      ? path.join(linkPath, 'index.html')
      : path.join(linkPath, 'index.html');
    if (!fs.existsSync(indexPath)) {
      throw new Error(`Missing product page for ${product.id}: ${product.link}`);
    }
  }
}

function renderItem(product) {
  let xml = '    <item>\n';
  xml += element('g:id', product.id);
  xml += element('g:title', product.title);
  xml += element('g:description', product.description);
  xml += element('g:link', product.link);
  xml += element('g:image_link', product.imageLink);
  for (const image of product.additionalImages || []) {
    xml += element('g:additional_image_link', image);
  }
  xml += element('g:availability', product.availability);
  xml += element('g:price', product.price);
  xml += element('g:brand', product.brand);
  xml += element('g:condition', product.condition);
  xml += element('g:mpn', product.mpn);
  xml += element('g:google_product_category', product.googleProductCategory);
  xml += element('g:product_type', product.productType);
  xml += element('g:item_group_id', product.itemGroupId);
  xml += element('g:size', product.size);
  xml += '    </item>\n';
  return xml;
}

validate(products);

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Signs and Arts - LED Sign Boards</title>
    <link>${site}</link>
    <description>Ready-made LED sign boards, pixel LEDs and accessories from Signs and Arts, India.</description>
${products.map(renderItem).join('')}  </channel>
</rss>
`;

fs.writeFileSync(outputPath, xml, 'utf8');

function escapeCsv(value) {
  return `"${String(value == null ? '' : value).replace(/"/g, '""')}"`;
}

function renderCsv(productsToRender) {
  const headers = [
    'id',
    'title',
    'description',
    'link',
    'image_link',
    'additional_image_link',
    'additional_image_link',
    'additional_image_link',
    'availability',
    'price',
    'brand',
    'condition',
    'mpn',
    'google_product_category',
    'product_type',
    'item_group_id',
    'size',
  ];
  const rows = productsToRender.map(product => {
    const additionalImages = product.additionalImages || [];
    return [
      product.id,
      product.title,
      product.description,
      product.link,
      product.imageLink,
      additionalImages[0] || '',
      additionalImages[1] || '',
      additionalImages[2] || '',
      product.availability,
      product.price,
      product.brand,
      product.condition,
      product.mpn,
      product.googleProductCategory,
      product.productType,
      product.itemGroupId,
      product.size,
    ].map(escapeCsv).join(',');
  });
  return `${headers.join(',')}\n${rows.join('\n')}\n`;
}

fs.writeFileSync(csvOutputPath, renderCsv(products), 'utf8');
console.log(`Generated ${products.length} products in ${path.relative(root, outputPath)} and ${path.relative(root, csvOutputPath)}`);
