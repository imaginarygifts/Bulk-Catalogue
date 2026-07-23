/*==================================================
    PREVIEW.JS
==================================================*/

export function renderHomepagePreview(container, sections) {

    container.innerHTML = "";

    sections.forEach(section => {

        const element = createSection(section);

        container.appendChild(element);

    });

}

/*==================================================
    CREATE SECTION
==================================================*/

function createSection(section) {

    switch (section.type) {

        case "banner":
            return bannerPreview(section);

        case "heading":
            return headingPreview(section);

        case "productCarousel":
            return productCarouselPreview(section);

        case "imageCarousel":
            return imageCarouselPreview(section);

        case "youtubeCarousel":
            return youtubeCarouselPreview(section);

        case "reviewCarousel":
            return reviewCarouselPreview(section);

        case "spacer":
            return spacerPreview(section);

        default:

            const div = document.createElement("div");

            div.className = "preview-section";

            div.innerHTML = `
                <div class="preview-title">
                    Unknown Section : ${section.type}
                </div>
            `;

            return div;

    }

}

/*==================================================
    BANNER
==================================================*/

function bannerPreview(section){

    const div = document.createElement("section");

    div.className="preview-banner";

    div.innerHTML=`

        <div class="preview-label">

            Banner

        </div>

        <img

        src="${section.desktopImage || ""}"

        class="preview-banner-image">

        <div class="preview-banner-content">

            <h2>

                ${section.heading || "Banner Heading"}

            </h2>

            <p>

                ${section.description || ""}

            </p>

            <button>

                ${section.buttonText || "Shop Now"}

            </button>

        </div>

    `;

    return div;

}

/*==================================================
    HEADING
==================================================*/

function headingPreview(section){

    const div=document.createElement("section");

    div.className="preview-heading";

    div.innerHTML=`

        <div class="preview-label">

            Heading

        </div>

        <h2>

            ${section.title || "Heading"}

        </h2>

        <p>

            ${section.subtitle || ""}

        </p>

    `;

    return div;

}

/*==================================================
    PRODUCT CAROUSEL
==================================================*/

function productCarouselPreview(section){

    const div=document.createElement("section");

    div.className="preview-products";

    div.innerHTML=`

        <div class="preview-label">

            Product Carousel

        </div>

        <h2>

            ${section.title || "Products"}

        </h2>

        <div class="preview-product-row">

            ${card()}

            ${card()}

            ${card()}

            ${card()}

        </div>

    `;

    return div;

}

function card(){

    return `

    <div class="preview-card">

        <div class="preview-image"></div>

        <div class="preview-name">

            Product

        </div>

        <div class="preview-price">

            ₹999

        </div>

    </div>

    `;

}

/*==================================================
    IMAGE CAROUSEL
==================================================*/

function imageCarouselPreview(section){

    const div=document.createElement("section");

    div.className="preview-images";

    div.innerHTML=`

        <div class="preview-label">

            Image Carousel

        </div>

        <div class="preview-image-row">

            <div class="preview-slide"></div>

            <div class="preview-slide"></div>

            <div class="preview-slide"></div>

        </div>

    `;

    return div;

}

/*==================================================
    YOUTUBE
==================================================*/

function youtubeCarouselPreview(section){

    const div=document.createElement("section");

    div.className="preview-youtube";

    div.innerHTML=`

        <div class="preview-label">

            Youtube Shorts

        </div>

        <div class="preview-video-row">

            <div class="preview-video"></div>

            <div class="preview-video"></div>

            <div class="preview-video"></div>

        </div>

    `;

    return div;

}

/*==================================================
    REVIEWS
==================================================*/

function reviewCarouselPreview(section){

    const div=document.createElement("section");

    div.className="preview-review";

    div.innerHTML=`

        <div class="preview-label">

            Reviews

        </div>

        <div class="preview-review-box">

            ★★★★★

            <br><br>

            Amazing Product

        </div>

    `;

    return div;

}

/*==================================================
    SPACER
==================================================*/

function spacerPreview(section){

    const div=document.createElement("div");

    div.style.height=

        (section.height || 40)+"px";

    div.style.background="#eee";

    div.style.margin="10px 0";

    return div;

}