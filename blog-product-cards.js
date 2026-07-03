(function () {
  var PRODUCTS = {
    "12v-5a-60w-led-adapter": {
      name: "Hilight 12V 5A 60W Power Adapter",
      badge: "Adapter",
      price: "&#8377;371",
      image: "/12v-5a-60w-led-adapter/image-1.webp",
      url: "/12v-5a-60w-led-adapter/",
      copy: "Indoor 12V 5A power adapter for LED strips, pixel LEDs, modules and small neon signs."
    },
    "bar-led-sign-board": {
      name: "Bar LED Sign Board",
      badge: "Bar",
      price: "&#8377;2,189",
      image: "/bar-led-sign-board/main.webp",
      url: "/bar-led-sign-board/",
      copy: "Multicolor 18x12 inch LED bar sign for bars, restaurants and pubs."
    },
    "clinic-led-sign-board": {
      name: "Clinic Plus LED Sign Board",
      badge: "Clinic",
      price: "From &#8377;2,689",
      image: "/clinic-led-sign-board/main.webp",
      url: "/clinic-led-sign-board/",
      copy: "Red and white clinic plus board with pixel LEDs, weatherproof frame and size options."
    },
    "clinic-medical-led-sign-board": {
      name: "Clinic Medical LED Sign Board",
      badge: "Clinic",
      price: "&#8377;6,819",
      image: "/clinic-medical-led-sign-board/main.webp",
      url: "/clinic-medical-led-sign-board/",
      copy: "Green and red 24x18 inch storefront board for clinics, medical shops and drug stores."
    },
    "computer-repair-led-sign-board": {
      name: "Computer Repair LED Sign Board",
      badge: "Repair",
      price: "&#8377;2,189",
      image: "/computer-repair-led-sign-board/main.webp",
      url: "/computer-repair-led-sign-board/",
      copy: "Single-sided 18x12 inch LED sign for computer repair and laptop service shops."
    },
    "dental-led-sign-board": {
      name: "Dental LED Sign Board",
      badge: "Dental",
      price: "&#8377;5,128",
      image: "/dental-led-sign-board/main.webp",
      url: "/dental-led-sign-board/",
      copy: "Red and white 24x18 inch double-sided LED board for dental clinics."
    },
    "dental-plus-led-sign-board": {
      name: "Dental Plus LED Sign Board",
      badge: "Dental",
      price: "From &#8377;2,689",
      image: "/dental-plus-led-sign-board/main.webp",
      url: "/dental-plus-led-sign-board/",
      copy: "Red plus body with white DENTAL lettering, pixel LEDs and 18x18 or 24x24 sizes."
    },
    "doctor-led-sign-board": {
      name: "Doctor LED Sign Board",
      badge: "Doctor",
      price: "From &#8377;2,889",
      image: "/doctor-led-sign-board/main.webp",
      url: "/doctor-led-sign-board/",
      copy: "Double-sided red and white doctor board with weatherproof frame and size options."
    },
    "emergency-led-sign-board": {
      name: "Emergency LED Sign Board",
      badge: "Medical",
      price: "From &#8377;2,889",
      image: "/emergency-led-sign-board/main.webp",
      url: "/emergency-led-sign-board/",
      copy: "Red and white emergency LED board for hospitals, clinics and urgent-care entrances."
    },
    "ent-led-sign-board": {
      name: "ENT LED Sign Board",
      badge: "ENT",
      price: "From &#8377;2,889",
      image: "/ent-led-sign-board/main.webp",
      url: "/ent-led-sign-board/",
      copy: "Speciality clinic LED sign board for ENT practices with plug-and-play setup."
    },
    "green-clinic-led-sign-board": {
      name: "Green Clinic LED Sign Board",
      badge: "Clinic",
      price: "From &#8377;2,689",
      image: "/green-clinic-led-sign-board/main.webp",
      url: "/green-clinic-led-sign-board/",
      copy: "Green cross LED clinic board for doctor offices, hospitals and health clinics."
    },
    "hair-salon-led-sign-board": {
      name: "Hair Salon LED Sign Board",
      badge: "Salon",
      price: "&#8377;2,189",
      image: "/hair-salon-led-sign-board/main.webp",
      url: "/hair-salon-led-sign-board/",
      copy: "Red and white 18x12 inch LED sign for salons, parlours and grooming studios."
    },
    "homeo-led-sign-board": {
      name: "Homeo LED Sign Board",
      badge: "Homeo",
      price: "From &#8377;2,889",
      image: "/homeo-led-sign-board/main.webp",
      url: "/homeo-led-sign-board/",
      copy: "Double-sided red and white homeo board with pixel LEDs and weatherproof build."
    },
    "hospital-led-sign-board": {
      name: "Hospital LED Sign Board",
      badge: "Hospital",
      price: "From &#8377;2,889",
      image: "/hospital-led-sign-board/main.webp",
      url: "/hospital-led-sign-board/",
      copy: "Red and white hospital LED board in 18x18 and 24x24 inch size options."
    },
    "led-dimmer-controller": {
      name: "Inline LED Dimmer Controller",
      badge: "Dimmer",
      price: "&#8377;90",
      image: "/led-dimmer-controller/main.webp",
      url: "/led-dimmer-controller/",
      copy: "Mini inline controller for brightness, mode and speed control on single-colour LED strips."
    },
    "led-strip-remote-controller": {
      name: "Mini RF Remote Controller",
      badge: "Remote",
      price: "&#8377;339",
      image: "/led-strip-remote-controller/main.webp",
      url: "/led-strip-remote-controller/",
      copy: "Wireless dimmer and controller for compatible single-colour 12V LED strip lights."
    },
    "love-neon-led-sign": {
      name: "Love Neon LED Sign",
      badge: "Decor",
      price: "&#8377;400",
      image: "/love-neon-led-sign/main.webp",
      url: "/love-neon-led-sign/",
      copy: "Pink acrylic love neon light for room decor, gifts, tables and night lighting."
    },
    "medical-pharmacy-led-sign-board": {
      name: "Medical & Pharmacy LED Sign Board",
      badge: "Pharmacy",
      price: "From &#8377;2,789",
      image: "/medical-pharmacy-led-sign-board/main.webp",
      url: "/medical-pharmacy-led-sign-board/",
      copy: "Green cross plus LED board for medical stores, pharmacies and chemists."
    },
    "medical-plus-led-sign-board": {
      name: "Medical Plus LED Sign Board",
      badge: "Medical",
      price: "From &#8377;2,689",
      image: "/medical-plus-led-sign-board/main.webp",
      url: "/medical-plus-led-sign-board/",
      copy: "Green double-sided medical plus board for medical stores and pharmacies."
    },
    "medical-red-led-sign-board": {
      name: "Medical LED Sign Board",
      badge: "Medical",
      price: "From &#8377;2,689",
      image: "/medical-red-led-sign-board/main.webp",
      url: "/medical-red-led-sign-board/",
      copy: "Red MEDICAL letters with a green cross for medical shops, clinics and drug stores."
    },
    "neuro-plus-led-sign-board": {
      name: "Neuro Plus LED Sign Board",
      badge: "Neuro",
      price: "From &#8377;2,689",
      image: "/neuro-plus-led-sign-board/main.webp",
      url: "/neuro-plus-led-sign-board/",
      copy: "Red and white plus-style LED board for neuro clinics, available in two sizes."
    },
    "open-24-hours-led-sign-board": {
      name: "Open 24 Hours LED Sign Board",
      badge: "Retail",
      price: "&#8377;2,189",
      image: "/open-24-hours-led-sign-board/main.webp",
      url: "/open-24-hours-led-sign-board/",
      copy: "Green, red and white 18x12 inch LED sign for shops, cafes and retail stores."
    },
    "open-close-led-sign-board": {
      name: "Open Close LED Sign Board Combo",
      badge: "Retail",
      price: "From &#8377;2,189",
      image: "/open-close-led-sign-board/open-main.webp",
      url: "/open-close-led-sign-board/",
      copy: "Choose Open board, Close board or the Open + Close combo pack for retail stores."
    },
    "optical-plus-led-sign-board": {
      name: "Optical Plus LED Sign Board",
      badge: "Optical",
      price: "From &#8377;2,689",
      image: "/optical-plus-led-sign-board/main.webp",
      url: "/optical-plus-led-sign-board/",
      copy: "Red and white optical plus board with 18x18 and 24x24 inch size options."
    },
    "opticals-led-sign-board": {
      name: "Opticals LED Sign Board",
      badge: "Optical",
      price: "&#8377;6,330",
      image: "/opticals-led-sign-board/main.webp",
      url: "/opticals-led-sign-board/",
      copy: "Double-sided 24x18 inch optical shop board with glasses graphic and pixel LEDs."
    },
    "orthopedic-led-sign-board": {
      name: "Orthopedic LED Sign Board",
      badge: "Clinic",
      price: "From &#8377;2,889",
      image: "/orthopedic-led-sign-board/main.webp",
      url: "/orthopedic-led-sign-board/",
      copy: "Double-sided orthopedic clinic board with red and white LED lettering."
    },
    "pan-shop-led-sign-board": {
      name: "PAN Shop LED Sign Board",
      badge: "PAN Shop",
      price: "&#8377;2,475",
      image: "/pan-shop-led-sign-board/image-1.webp",
      url: "/pan-shop-led-sign-board/",
      copy: "18x12 inch double-sided PAN shop board with bright red and white pixel LEDs."
    },
    "pharmacy-plus-led-sign": {
      name: "Pharmacy Plus LED Sign Board",
      badge: "Pharmacy",
      price: "From &#8377;2,689",
      image: "/pharmacy-plus-led-sign/main.webp",
      url: "/pharmacy-plus-led-sign/",
      copy: "Green double-sided pharmacy plus sign board for medical stores and pharmacies."
    },
    "pixel-led": {
      name: "12V Pixel LED Collection",
      badge: "Pixel LED",
      price: "From &#8377;165",
      image: "/pixel-led/images/blue-3-inch-9mm-12v-pixel-3921.webp",
      url: "/pixel-led/",
      copy: "Single-colour 12V pixel LED strings for sign boards and decorative lighting."
    },
    "rgb-pixel-led-controller": {
      name: "RGB Pixel LED Controller",
      badge: "Controller",
      price: "&#8377;250",
      image: "/rgb-pixel-led-controller/main.webp",
      url: "/rgb-pixel-led-controller/",
      copy: "17-key RF remote controller for WS2811 and WS2812B RGB pixel LED strips."
    },
    "spa-open-led-sign-board": {
      name: "Spa Open LED Sign Board",
      badge: "Spa",
      price: "&#8377;2,189",
      image: "/spa-open-led-sign-board/main.webp",
      url: "/spa-open-led-sign-board/",
      copy: "Blue, green and white 18x12 inch LED sign for spas, salons and wellness centers."
    },
    "tattoo-led-sign-board": {
      name: "Tattoo LED Sign Board",
      badge: "Tattoo",
      price: "&#8377;2,189",
      image: "/tattoo-led-sign-board/main.webp",
      url: "/tattoo-led-sign-board/",
      copy: "Red and white 18x12 inch LED sign with bold TATTOO lettering."
    },
    "xerox-store-led-sign-board": {
      name: "Xerox Store LED Sign Board",
      badge: "Xerox",
      price: "&#8377;2,178",
      image: "/xerox-store-led-sign-board/main.webp",
      url: "/xerox-store-led-sign-board/",
      copy: "White and red 18x12 inch double-sided LED board for xerox and photocopy shops."
    }
  };

  function ensureStylesheet() {
    if (document.querySelector('link[href="/blog-product-cards.css"]')) return;
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/blog-product-cards.css";
    document.head.appendChild(link);
  }

  function productSlugFromHref(href) {
    if (!href) return "";
    try {
      var url = new URL(href, window.location.origin);
      if (url.origin !== window.location.origin) return "";
      var parts = url.pathname.split("/").filter(Boolean);
      if (parts.length !== 1) return "";
      return parts[0];
    } catch (error) {
      return "";
    }
  }

  function collectProductSlugs(main) {
    var seen = {};
    var slugs = [];
    var links = main.querySelectorAll('a[href]');
    links.forEach(function (link) {
      var slug = productSlugFromHref(link.getAttribute("href"));
      if (!slug || !PRODUCTS[slug] || seen[slug]) return;
      seen[slug] = true;
      slugs.push(slug);
    });
    return slugs;
  }

  function whatsappUrl(product) {
    return "https://wa.me/919392878946?text=" + encodeURIComponent("Hi, I want more info about " + product.name);
  }

  function createProductCard(product) {
    var card = document.createElement("article");
    card.className = "blog-product-card";

    var media = document.createElement("a");
    media.className = "blog-product-media";
    media.href = product.url;
    media.setAttribute("aria-label", "View " + product.name);

    var image = document.createElement("img");
    image.src = product.image;
    image.alt = product.name;
    image.loading = "lazy";
    image.decoding = "async";
    media.appendChild(image);

    var badge = document.createElement("span");
    badge.className = "blog-product-badge";
    badge.textContent = product.badge;
    media.appendChild(badge);

    var body = document.createElement("div");
    body.className = "blog-product-body";

    var title = document.createElement("h3");
    title.className = "blog-product-name";
    title.textContent = product.name;
    body.appendChild(title);

    var copy = document.createElement("p");
    copy.className = "blog-product-copy";
    copy.textContent = product.copy;
    body.appendChild(copy);

    var price = document.createElement("div");
    price.className = "blog-product-price";
    price.innerHTML = product.price;
    body.appendChild(price);

    var actions = document.createElement("div");
    actions.className = "blog-product-actions";

    var order = document.createElement("a");
    order.className = "blog-product-order";
    order.href = product.url;
    order.textContent = "Order on site";
    order.setAttribute("aria-label", "Order " + product.name + " on site");
    actions.appendChild(order);

    var whatsapp = document.createElement("a");
    whatsapp.className = "blog-product-whatsapp";
    whatsapp.href = whatsappUrl(product);
    whatsapp.target = "_blank";
    whatsapp.rel = "noopener";
    whatsapp.textContent = "WA";
    whatsapp.setAttribute("aria-label", "Ask about " + product.name + " on WhatsApp");
    actions.appendChild(whatsapp);

    card.appendChild(media);
    card.appendChild(body);
    card.appendChild(actions);
    return card;
  }

  function createSection(slugs) {
    var section = document.createElement("section");
    section.className = "blog-product-section";
    section.setAttribute("data-blog-product-cards", "");

    var title = document.createElement("h2");
    title.className = "blog-product-title";
    title.textContent = slugs.length === 1 ? "Order this product" : "Order products from this guide";
    section.appendChild(title);

    var grid = document.createElement("div");
    grid.className = "blog-product-grid";
    slugs.forEach(function (slug) {
      grid.appendChild(createProductCard(PRODUCTS[slug]));
    });
    section.appendChild(grid);
    return section;
  }

  function findRelatedHeading(main) {
    var headings = main.querySelectorAll("h2");
    for (var i = 0; i < headings.length; i += 1) {
      if (/related products/i.test(headings[i].textContent || "")) {
        return headings[i];
      }
    }
    return null;
  }

  function mountCards() {
    var main = document.querySelector("main");
    if (!main || main.querySelector("[data-blog-product-cards]")) return;

    var slugs = collectProductSlugs(main);
    if (!slugs.length) return;

    ensureStylesheet();
    var section = createSection(slugs);
    var relatedHeading = findRelatedHeading(main);
    if (relatedHeading) {
      main.insertBefore(section, relatedHeading);
      return;
    }

    var cta = main.querySelector(".cta");
    if (cta && cta.parentNode === main && cta.nextSibling) {
      main.insertBefore(section, cta.nextSibling);
      return;
    }
    main.appendChild(section);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountCards);
  } else {
    mountCards();
  }
}());
