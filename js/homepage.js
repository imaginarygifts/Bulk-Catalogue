/*==================================================
    HOMEPAGE RENDERER
    MOBILE FIRST
==================================================*/

import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


/*==================================================
    DOM
==================================================*/

const homepage =
    document.getElementById("homepage");


/*==================================================
    STATE
==================================================*/

let homepageSections = [];

let products = [];

let currentBannerIntervals = [];


/*==================================================
    INIT
==================================================*/

document.addEventListener(
    "DOMContentLoaded",
    initHomepage
);


async function initHomepage(){

    if(!homepage){

        console.error(
            "Homepage container #homepage not found."
        );

        return;

    }

    showLoader();

    try{

        await loadHomepageSections();

        await loadProducts();

        renderHomepage();

        initializeCarousels();

    }

    catch(error){

        console.error(
            "Homepage loading error:",
            error
        );

        renderHomepageError();

    }

    hideLoader();

}


/*==================================================
    LOAD SECTIONS
==================================================*/

async function loadHomepageSections(){

    const q = query(

        collection(
            db,
            "homepageSections"
        ),

        orderBy("order")

    );

    const snapshot =
        await getDocs(q);

    homepageSections =
        snapshot.docs

        .map(doc => ({

            id:doc.id,

            ...doc.data()

        }))

        .filter(section =>
            section.published !== false
        );

}


/*==================================================
    LOAD PRODUCTS
==================================================*/

async function loadProducts(){

    try{

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "products"
                )
            );

        products =
            snapshot.docs.map(doc => ({

                id:doc.id,

                ...doc.data()

            }));

    }

    catch(error){

        console.error(
            "Products loading error:",
            error
        );

        products=[];

    }

}


/*==================================================
    RENDER HOMEPAGE
==================================================*/

function renderHomepage(){

    homepage.innerHTML="";

    if(!homepageSections.length){

        homepage.innerHTML = `

            <div class="homepage-empty">

                <h2>No Homepage Sections</h2>

                <p>
                    Add sections from the admin homepage builder.
                </p>

            </div>

        `;

        return;

    }


    homepageSections.forEach(section => {

        const element =
            renderSection(section);

        if(element){

            homepage.appendChild(element);

        }

    });

}


/*==================================================
    SECTION ROUTER
==================================================*/

function renderSection(section){

    switch(section.type){

        case "heading":

            return renderHeading(section);


        case "banner":

            return renderBanner(section);


        case "imageCarousel":

            return renderImageCarousel(section);


        case "productCarousel":

            return renderProductCarousel(section);


        case "youtubeCarousel":

            return renderYoutubeCarousel(section);


        case "reviewCarousel":

            return renderReviewCarousel(section);


        case "spacer":

            return renderSpacer(section);


        default:

            console.warn(
                "Unknown homepage section:",
                section.type
            );

            return null;

    }

}


/*==================================================
    COMMON SECTION STYLE
==================================================*/

function applySectionStyle(
    element,
    section
){

    if(section.backgroundColor){

        element.style.backgroundColor =
            section.backgroundColor;

    }

}


/*==================================================
    HEADING
==================================================*/

function renderHeading(section){

    const wrapper =
        createSectionWrapper(
            "heading",
            section
        );


    const container =
        createContainer();


    const content =
        document.createElement("div");

    content.className =
        "home-heading";


    if(section.badge){

        const badge =
            document.createElement("div");

        badge.className =
            "home-heading-badge";

        badge.textContent =
            section.badge;

        content.appendChild(badge);

    }


    const title =
        document.createElement("h2");

    title.textContent =
        section.title || "Heading";

    content.appendChild(title);


    if(section.subtitle){

        const subtitle =
            document.createElement("p");

        subtitle.textContent =
            section.subtitle;

        content.appendChild(subtitle);

    }


    container.appendChild(content);

    wrapper.appendChild(container);

    return wrapper;

}


/*==================================================
    BANNER
==================================================*/

function renderBanner(section){

    const wrapper =
        createSectionWrapper(
            "banner",
            section
        );


    const container =
        createContainer();


    const banner =
        document.createElement("div");

    banner.className =
        "home-banner";


    const track =
        document.createElement("div");

    track.className =
        "banner-track";


    const slides =
        Array.isArray(section.slides)
            ? section.slides
            : [];


    slides.forEach(
        (slide,index)=>{

            const slideElement =
                document.createElement("div");

            slideElement.className =
                "banner-slide";


            if(index===0){

                slideElement.classList.add(
                    "active"
                );

            }


            if(slide.image){

                const image =
                    document.createElement("img");

                image.src =
                    slide.image;

                image.alt =
                    slide.title || "Banner";

                image.loading =
                    index===0
                        ? "eager"
                        : "lazy";

                slideElement.appendChild(
                    image
                );

            }


            const hasContent =
                slide.title ||
                slide.subtitle ||
                slide.buttonText;


            if(hasContent){

                const content =
                    document.createElement("div");

                content.className =
                    "banner-content";


                const position =
                    slide.buttonPosition ||
                    "center";


                content.classList.add(
                    `banner-content-${position}`
                );


                if(slide.title){

                    const title =
                        document.createElement("h2");

                    title.textContent =
                        slide.title;

                    content.appendChild(
                        title
                    );

                }


                if(slide.subtitle){

                    const subtitle =
                        document.createElement("p");

                    subtitle.textContent =
                        slide.subtitle;

                    content.appendChild(
                        subtitle
                    );

                }


                if(
                    slide.buttonText &&
                    slide.buttonLink
                ){

                    const button =
                        document.createElement("a");

                    button.className =
                        "banner-button";

                    button.href =
                        slide.buttonLink;

                    button.textContent =
                        slide.buttonText;

                    content.appendChild(
                        button
                    );

                }


                slideElement.appendChild(
                    content
                );

            }


            track.appendChild(
                slideElement
            );

        }
    );


    banner.appendChild(track);


    if(slides.length > 1){

        const prev =
            document.createElement("button");

        prev.className =
            "banner-prev";

        prev.innerHTML =
            "&#10094;";

        prev.setAttribute(
            "aria-label",
            "Previous"
        );


        const next =
            document.createElement("button");

        next.className =
            "banner-next";

        next.innerHTML =
            "&#10095;";

        next.setAttribute(
            "aria-label",
            "Next"
        );


        banner.appendChild(prev);

        banner.appendChild(next);


        const dots =
            document.createElement("div");

        dots.className =
            "banner-dots";


        slides.forEach(
            (_,index)=>{

                const dot =
                    document.createElement("button");

                dot.className =
                    "banner-dot";

                if(index===0){

                    dot.classList.add(
                        "active"
                    );

                }

                dot.dataset.index =
                    index;

                dots.appendChild(dot);

            }
        );


        banner.appendChild(dots);


        setupBanner(
            banner,
            section
        );

    }


    container.appendChild(
        banner
    );

    wrapper.appendChild(
        container
    );

    return wrapper;

}


/*==================================================
    IMAGE CAROUSEL
==================================================*/

function renderImageCarousel(section){

    const wrapper =
        createSectionWrapper(
            "imageCarousel",
            section
        );


    const container =
        createContainer();


    addCarouselHeading(
        container,
        section
    );


    const carousel =
        document.createElement("div");

    carousel.className =
        "category-carousel";


    const images =
        Array.isArray(section.images)
            ? section.images
            : [];


    images.forEach(
        image=>{

            const item =
                document.createElement("div");

            item.className =
                "category-card";


            const imageWrapper =
                document.createElement("div");

            imageWrapper.className =
                "category-image";


            if(image.link){

                const link =
                    document.createElement("a");

                link.href =
                    image.link;


                const img =
                    createImage(
                        image.src,
                        image.title
                    );

                link.appendChild(img);

                imageWrapper.appendChild(link);

            }

            else{

                imageWrapper.appendChild(
                    createImage(
                        image.src,
                        image.title
                    )
                );

            }


            item.appendChild(
                imageWrapper
            );


            if(image.title){

                const title =
                    document.createElement("div");

                title.className =
                    "category-title";

                title.textContent =
                    image.title;

                item.appendChild(
                    title
                );

            }


            carousel.appendChild(
                item
            );

        }
    );


    container.appendChild(
        carousel
    );


    addCarouselDots(
        container,
        carousel,
        images.length
    );


    wrapper.appendChild(
        container
    );


    return wrapper;

}


/*==================================================
    PRODUCT CAROUSEL
==================================================*/

function renderProductCarousel(section){

    const wrapper =
        createSectionWrapper(
            "productCarousel",
            section
        );


    const container =
        createContainer();


    addCarouselHeading(
        container,
        section
    );


    const carousel =
        document.createElement("div");

    carousel.className =
        "product-carousel";


    let filteredProducts =
        getFilteredProducts(
            section
        );


    const limit =
        Number(section.limit) || 10;


    filteredProducts =
        filteredProducts.slice(
            0,
            limit
        );


    filteredProducts.forEach(
        product=>{

            carousel.appendChild(
                createProductCard(
                    product
                )
            );

        }
    );


    container.appendChild(
        carousel
    );


    addCarouselDots(
        container,
        carousel,
        filteredProducts.length
    );


    wrapper.appendChild(
        container
    );


    return wrapper;

}


/*==================================================
    FILTER PRODUCTS
==================================================*/

function getFilteredProducts(section){

    let result =
        [...products];


    /* CATEGORY */

    if(section.categoryId){

        result =
            result.filter(
                product=>{

                    const categoryId =
                        product.categoryId ||
                        product.category ||
                        product.categoryID;

                    const subCategoryId =
                        product.subCategoryId ||
                        product.subcategoryId;


                    return (

                        categoryId ===
                        section.categoryId

                        ||

                        subCategoryId ===
                        section.categoryId

                    );

                }
            );

    }


    /* TAGS */

    if(
        Array.isArray(section.tags) &&
        section.tags.length
    ){

        result =
            result.filter(
                product=>{

                    const productTags =
                        product.tags || [];


                    return section.tags.some(
                        tag =>
                            productTags.includes(tag)
                    );

                }
            );

    }


    /* LATEST */

    if(
        section.filterType === "latest" ||
        !section.filterType
    ){

        result.sort(
            (a,b)=>
                getTime(b.createdAt)
                -
                getTime(a.createdAt)
        );

    }


    /* RANDOM */

    if(
        section.filterType === "random"
    ){

        result.sort(
            ()=>Math.random()-.5
        );

    }


    return result;

}


/*==================================================
    PRODUCT CARD
==================================================*/

function createProductCard(product){

    const card =
        document.createElement("article");

    card.className =
        "product-card";


    const imageBox =
        document.createElement("div");

    imageBox.className =
        "product-card-image";


    const image =
        createImage(
            getProductImage(product),
            product.name ||
            product.title ||
            "Product"
        );


    imageBox.appendChild(
        image
    );


    /* FAVORITE */

    const favorite =
        document.createElement("button");

    favorite.className =
        "product-favorite";

    favorite.innerHTML =
        "♡";

    favorite.setAttribute(
        "aria-label",
        "Add to wishlist"
    );


    favorite.onclick =
        event=>{

            event.preventDefault();

            favorite.classList.toggle(
                "active"
            );

            favorite.innerHTML =
                favorite.classList.contains("active")
                    ? "♥"
                    : "♡";

        };


    imageBox.appendChild(
        favorite
    );


    card.appendChild(
        imageBox
    );


    const info =
        document.createElement("div");

    info.className =
        "product-card-info";


    const name =
        document.createElement("h3");

    name.textContent =
        product.name ||
        product.title ||
        "Product";


    info.appendChild(
        name
    );


    const pricing =
        getProductPricing(product);


    if(pricing){

        const priceBox =
            document.createElement("div");

        priceBox.className =
            "product-pricing";


        if(
            pricing.oldPrice &&
            pricing.oldPrice >
            pricing.price
        ){

            const oldPrice =
                document.createElement("span");

            oldPrice.className =
                "old-price";

            oldPrice.textContent =
                formatPrice(
                    pricing.oldPrice
                );

            priceBox.appendChild(
                oldPrice
            );

        }


        const price =
            document.createElement("strong");

        price.className =
            "current-price";

        price.textContent =
            formatPrice(
                pricing.price
            );

        priceBox.appendChild(
            price
        );


        info.appendChild(
            priceBox
        );

    }


    const button =
        document.createElement("button");

    button.className =
        "product-action";


    const hasVariants =
        product.variants ||
        product.options ||
        product.customOptions;


    button.textContent =
        hasVariants
            ? "SELECT OPTIONS"
            : "ADD TO CART";


    button.onclick =
        ()=>{

            if(product.url){

                window.location.href =
                    product.url;

                return;

            }

            if(product.slug){

                window.location.href =
                    `/product.html?slug=${encodeURIComponent(product.slug)}`;

                return;

            }

            if(product.id){

                window.location.href =
                    `/product.html?id=${encodeURIComponent(product.id)}`;

            }

        };


    info.appendChild(
        button
    );


    card.appendChild(
        info
    );


    return card;

}


/*==================================================
    YOUTUBE CAROUSEL
==================================================*/

function renderYoutubeCarousel(section){

    const wrapper =
        createSectionWrapper(
            "youtubeCarousel",
            section
        );


    const container =
        createContainer();


    addCarouselHeading(
        container,
        section
    );


    const carousel =
        document.createElement("div");

    carousel.className =
        "youtube-carousel";


    const videos =
        Array.isArray(section.videos)
            ? section.videos
            : [];


    videos.forEach(
        video=>{

            const item =
                document.createElement("div");

            item.className =
                "youtube-card";


            const iframe =
                document.createElement("iframe");


            iframe.src =
                getYoutubeEmbedUrl(
                    video.url
                );


            iframe.loading =
                "lazy";


            iframe.allow =
                "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";


            iframe.allowFullscreen =
                true;


            item.appendChild(
                iframe
            );


            carousel.appendChild(
                item
            );

        }
    );


    container.appendChild(
        carousel
    );


    addCarouselDots(
        container,
        carousel,
        videos.length
    );


    wrapper.appendChild(
        container
    );


    return wrapper;

}


/*==================================================
    YOUTUBE URL
==================================================*/

function getYoutubeEmbedUrl(url){

    if(!url) return "";

    try{

        const parsed =
            new URL(url);


        let id =
            parsed.searchParams.get("v");


        if(
            parsed.hostname.includes(
                "youtu.be"
            )
        ){

            id =
                parsed.pathname
                    .replace("/","");

        }


        if(
            parsed.pathname.includes(
                "/shorts/"
            )
        ){

            id =
                parsed.pathname
                    .split("/shorts/")[1]
                    ?.split("?")[0];

        }


        if(!id){

            return "";

        }


        return `https://www.youtube.com/embed/${id}?rel=0`;

    }

    catch{

        return "";

    }

}


/*==================================================
    REVIEW CAROUSEL
==================================================*/

function renderReviewCarousel(section){

    const wrapper =
        createSectionWrapper(
            "reviewCarousel",
            section
        );


    const container =
        createContainer();


    addCarouselHeading(
        container,
        section
    );


    const carousel =
        document.createElement("div");

    carousel.className =
        "review-carousel";


    const reviews =
        Array.isArray(section.reviews)
            ? section.reviews
            : [];


    const limit =
        Number(section.limit) || 10;


    reviews
        .slice(0,limit)
        .forEach(
            review=>{

                const card =
                    document.createElement("article");

                card.className =
                    "review-card";


                if(review.image){

                    const avatar =
                        createImage(
                            review.image,
                            review.name ||
                            "Customer"
                        );

                    avatar.className =
                        "review-avatar";

                    card.appendChild(
                        avatar
                    );

                }


                const stars =
                    document.createElement("div");

                stars.className =
                    "review-stars";


                const rating =
                    Math.max(
                        0,
                        Math.min(
                            5,
                            Number(
                                review.stars
                            ) || 5
                        )
                    );


                stars.textContent =
                    "★".repeat(rating) +
                    "☆".repeat(5-rating);


                card.appendChild(
                    stars
                );


                const text =
                    document.createElement("p");

                text.className =
                    "review-text";

                text.textContent =
                    review.review ||
                    "";


                card.appendChild(
                    text
                );


                if(review.name){

                    const name =
                        document.createElement("div");

                    name.className =
                        "review-name";

                    name.textContent =
                        review.name;

                    card.appendChild(
                        name
                    );

                }


                carousel.appendChild(
                    card
                );

            }
        );


    container.appendChild(
        carousel
    );


    addCarouselDots(
        container,
        carousel,
        reviews.length
    );


    wrapper.appendChild(
        container
    );


    return wrapper;

}


/*==================================================
    SPACER
==================================================*/

function renderSpacer(section){

    const wrapper =
        createSectionWrapper(
            "spacer",
            section
        );


    wrapper.style.height =
        `${Number(section.height) || 40}px`;


    return wrapper;

}


/*==================================================
    SECTION WRAPPER
==================================================*/

function createSectionWrapper(
    type,
    section
){

    const wrapper =
        document.createElement("section");


    wrapper.className =
        `home-section home-section-${type}`;


    applySectionStyle(
        wrapper,
        section
    );


    return wrapper;

}


/*==================================================
    CONTAINER
==================================================*/

function createContainer(){

    const container =
        document.createElement("div");

    container.className =
        "home-container";

    return container;

}


/*==================================================
    CAROUSEL HEADING
==================================================*/

function addCarouselHeading(
    container,
    section
){

    if(
        !section.title &&
        !section.subtitle
    ){

        return;

    }


    const heading =
        document.createElement("div");

    heading.className =
        "carousel-heading";


    const text =
        document.createElement("div");


    if(section.title){

        const title =
            document.createElement("h2");

        title.textContent =
            section.title;

        text.appendChild(
            title
        );

    }


    if(section.subtitle){

        const subtitle =
            document.createElement("p");

        subtitle.textContent =
            section.subtitle;

        text.appendChild(
            subtitle
        );

    }


    heading.appendChild(
        text
    );


    if(section.viewAllLink){

        const viewAll =
            document.createElement("a");

        viewAll.className =
            "view-all";

        viewAll.href =
            section.viewAllLink;

        viewAll.textContent =
            "View All";

        heading.appendChild(
            viewAll
        );

    }


    container.appendChild(
        heading
    );

}


/*==================================================
    CAROUSEL DOTS
==================================================*/

function addCarouselDots(
    container,
    carousel,
    count
){

    if(count <= 1) return;


    const dots =
        document.createElement("div");

    dots.className =
        "carousel-dots";


    const dotCount =
        Math.min(
            6,
            Math.max(
                2,
                Math.ceil(count / 3)
            )
        );


    for(
        let i=0;
        i<dotCount;
        i++
    ){

        const dot =
            document.createElement("span");

        if(i===0){

            dot.classList.add(
                "active"
            );

        }


        dots.appendChild(
            dot
        );

    }


    container.appendChild(
        dots
    );


    carousel.addEventListener(
        "scroll",
        ()=>{

            const max =
                carousel.scrollWidth -
                carousel.clientWidth;


            if(max <= 0) return;


            const position =
                carousel.scrollLeft /
                max;


            const index =
                Math.round(
                    position *
                    (dotCount-1)
                );


            [...dots.children]
                .forEach(
                    (dot,i)=>{

                        dot.classList.toggle(
                            "active",
                            i===index
                        );

                    }
                );

        }
    );

}


/*==================================================
    BANNER SETUP
==================================================*/

function setupBanner(
    banner,
    section
){

    const slides =
        [...banner.querySelectorAll(
            ".banner-slide"
        )];


    const dots =
        [...banner.querySelectorAll(
            ".banner-dot"
        )];


    const prev =
        banner.querySelector(
            ".banner-prev"
        );


    const next =
        banner.querySelector(
            ".banner-next"
        );


    let current=0;


    function show(index){

        current =
            (index + slides.length)
            % slides.length;


        slides.forEach(
            (slide,i)=>{

                slide.classList.toggle(
                    "active",
                    i===current
                );

            }
        );


        dots.forEach(
            (dot,i)=>{

                dot.classList.toggle(
                    "active",
                    i===current
                );

            }
        );

    }


    prev?.addEventListener(
        "click",
        ()=>show(current-1)
    );


    next?.addEventListener(
        "click",
        ()=>show(current+1)
    );


    dots.forEach(
        (dot,index)=>{

            dot.addEventListener(
                "click",
                ()=>show(index)
            );

        }
    );


    if(section.autoPlay !== false){

        const interval =
            Number(
                section.interval
            ) || 5000;


        const timer =
            setInterval(
                ()=>show(current+1),
                interval
            );


        currentBannerIntervals.push(
            timer
        );

    }

}


/*==================================================
    IMAGE HELPER
==================================================*/

function createImage(
    src,
    alt=""
){

    const image =
        document.createElement("img");


    image.src =
        src || "";


    image.alt =
        alt || "";


    image.loading =
        "lazy";


    image.onerror =
        ()=>{

            image.style.display =
                "none";

        };


    return image;

}


/*==================================================
    PRODUCT IMAGE
==================================================*/

function getProductImage(product){

    if(
        Array.isArray(product.images) &&
        product.images.length
    ){

        const first =
            product.images[0];


        if(typeof first === "string"){

            return first;

        }


        return first?.url ||
            first?.src ||
            "";

    }


    return (
        product.image ||
        product.imageUrl ||
        product.thumbnail ||
        ""
    );

}


/*==================================================
    PRODUCT PRICE
==================================================*/

function getProductPricing(product){

    const price =
        Number(
            product.salePrice ??
            product.finalPrice ??
            product.price ??
            0
        );


    if(!price){

        return null;

    }


    const oldPrice =
        Number(
            product.comparePrice ??
            product.mrp ??
            product.originalPrice ??
            0
        );


    return {

        price,

        oldPrice

    };

}


/*==================================================
    FORMAT PRICE
==================================================*/

function formatPrice(value){

    return "₹" +
        Number(value || 0)
            .toLocaleString(
                "en-IN",
                {
                    minimumFractionDigits:2,
                    maximumFractionDigits:2
                }
            );

}


/*==================================================
    TIMESTAMP
==================================================*/

function getTime(value){

    if(!value) return 0;


    if(
        typeof value.toMillis ===
        "function"
    ){

        return value.toMillis();

    }


    if(
        typeof value === "number"
    ){

        return value;

    }


    return 0;

}


/*==================================================
    LOADER
==================================================*/

function showLoader(){

    const loader =
        document.getElementById(
            "homepageLoader"
        );


    if(loader){

        loader.classList.remove(
            "hidden"
        );

    }

}


function hideLoader(){

    const loader =
        document.getElementById(
            "homepageLoader"
        );


    if(loader){

        loader.classList.add(
            "hidden"
        );

    }

}


/*==================================================
    ERROR
==================================================*/

function renderHomepageError(){

    homepage.innerHTML = `

        <div class="homepage-error">

            <h2>
                Unable to load homepage
            </h2>

            <p>
                Please refresh the page and try again.
            </p>

        </div>

    `;

}