/*==================================================
    HOMEPAGE
    MOBILE FIRST
==================================================*/

import { db } from "./firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


/*==================================================
    DOM
==================================================*/

const homepage =
    document.getElementById("homepage");

const loader =
    document.getElementById("homepageLoader");


/*==================================================
    INIT
==================================================*/

document.addEventListener(
    "DOMContentLoaded",
    loadHomepage
);


/*==================================================
    LOAD HOMEPAGE
==================================================*/

async function loadHomepage(){

    try{

        showLoader();

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "homepageSections"
                )
            );


        let sections =
            snapshot.docs.map(docSnap => ({

                id: docSnap.id,

                ...docSnap.data()

            }));


        /* ONLY PUBLISHED */

        sections =
            sections.filter(
                section =>
                    section.published !== false
            );


        /* SORT */

        sections.sort(
            (a,b) =>
                Number(a.order || 0) -
                Number(b.order || 0)
        );


        homepage.innerHTML = "";


        if(!sections.length){

            homepage.innerHTML = `

                <div class="homepage-empty">

                    <h2>Homepage</h2>

                    <p>
                        No sections have been published yet.
                    </p>

                </div>

            `;

            hideLoader();

            return;

        }


        for(const section of sections){

            await renderSection(
                homepage,
                section
            );

        }


        hideLoader();

    }

    catch(error){

        console.error(
            "Homepage loading error:",
            error
        );

        homepage.innerHTML = `

            <div class="homepage-error">

                <h2>
                    Unable to load homepage
                </h2>

                <p>
                    Please try again later.
                </p>

            </div>

        `;

        hideLoader();

    }

}


/*==================================================
    SECTION ROUTER
==================================================*/

async function renderSection(
    parent,
    section
){

    const wrapper =
        document.createElement("section");


    wrapper.className =
        "home-section";


    wrapper.classList.add(
        `home-section-${section.type}`
    );


    wrapper.dataset.sectionId =
        section.id;


    /* BACKGROUND */

    if(section.backgroundColor){

        wrapper.style.backgroundColor =
            section.backgroundColor;

    }


    switch(section.type){

        case "heading":

            renderHeading(
                wrapper,
                section
            );

            break;


        case "banner":

            renderBanner(
                wrapper,
                section
            );

            break;


        case "productCarousel":

            await renderProductCarousel(
                wrapper,
                section
            );

            break;


        case "imageCarousel":

            renderImageCarousel(
                wrapper,
                section
            );

            break;


        case "youtubeCarousel":

            renderYoutubeCarousel(
                wrapper,
                section
            );

            break;


        case "reviewCarousel":

            renderReviewCarousel(
                wrapper,
                section
            );

            break;


        case "spacer":

            renderSpacer(
                wrapper,
                section
            );

            break;


        default:

            console.warn(
                "Unknown homepage section:",
                section.type
            );

            return;

    }


    parent.appendChild(wrapper);

}


/*==================================================
    HEADING
==================================================*/

function renderHeading(
    container,
    section
){

    container.innerHTML = `

        <div class="home-container">

            <div class="heading-section">

                ${
                    section.badge
                    ?
                    `
                    <div class="heading-badge">

                        ${escapeHtml(
                            section.badge
                        )}

                    </div>
                    `
                    :
                    ""
                }


                ${
                    section.title
                    ?
                    `
                    <h2>

                        ${escapeHtml(
                            section.title
                        )}

                    </h2>
                    `
                    :
                    ""
                }


                ${
                    section.subtitle
                    ?
                    `
                    <p>

                        ${escapeHtml(
                            section.subtitle
                        )}

                    </p>
                    `
                    :
                    ""
                }

            </div>

        </div>

    `;

}


/*==================================================
    BANNER
==================================================*/

function renderBanner(
    container,
    section
){

    const slides =
        Array.isArray(section.slides)
            ? section.slides
            : [];


    if(!slides.length){

        container.remove();

        return;

    }


    container.innerHTML = `

        <div class="home-container banner-container">

            <div class="home-banner">

                <div class="banner-track">

                    ${
                        slides.map(
                            (slide,index) => `

                            <div
                                class="
                                    banner-slide
                                    ${index === 0 ? "active" : ""}
                                "
                                data-index="${index}"
                            >

                                ${
                                    slide.image
                                    ?
                                    `
                                    <img
                                        src="${escapeAttribute(
                                            slide.image
                                        )}"
                                        alt="${escapeAttribute(
                                            slide.title || "Banner"
                                        )}"
                                    >
                                    `
                                    :
                                    `
                                    <div class="banner-no-image">
                                        Banner
                                    </div>
                                    `
                                }


                                ${
                                    slide.title ||
                                    slide.subtitle ||
                                    slide.buttonText
                                    ?
                                    `
                                    <div
                                        class="
                                            banner-content
                                            banner-content-${
                                                slide.buttonPosition ||
                                                "center"
                                            }
                                        "
                                    >

                                        ${
                                            slide.title
                                            ?
                                            `
                                            <h2>
                                                ${escapeHtml(
                                                    slide.title
                                                )}
                                            </h2>
                                            `
                                            :
                                            ""
                                        }


                                        ${
                                            slide.subtitle
                                            ?
                                            `
                                            <p>
                                                ${escapeHtml(
                                                    slide.subtitle
                                                )}
                                            </p>
                                            `
                                            :
                                            ""
                                        }


                                        ${
                                            slide.buttonText
                                            ?
                                            `
                                            <a
                                                class="banner-button"
                                                href="${escapeAttribute(
                                                    slide.buttonLink || "#"
                                                )}"
                                            >
                                                ${escapeHtml(
                                                    slide.buttonText
                                                )}
                                            </a>
                                            `
                                            :
                                            ""
                                        }

                                    </div>
                                    `
                                    :
                                    ""
                                }

                            </div>

                        `
                        ).join("")
                    }

                </div>


                ${
                    slides.length > 1
                    ?
                    `

                    <button
                        class="banner-prev"
                        type="button"
                        aria-label="Previous banner"
                    >
                        ‹
                    </button>

                    <button
                        class="banner-next"
                        type="button"
                        aria-label="Next banner"
                    >
                        ›
                    </button>

                    <div class="banner-dots">

                        ${
                            slides.map(
                                (_,index) => `

                                <button
                                    class="
                                        banner-dot
                                        ${
                                            index === 0
                                            ? "active"
                                            : ""
                                        }
                                    "
                                    data-index="${index}"
                                    type="button"
                                ></button>

                            `
                            ).join("")
                        }

                    </div>

                    `
                    :
                    ""
                }

            </div>

        </div>

    `;


    initBannerSlider(
        container,
        section
    );

}


/*==================================================
    BANNER SLIDER
==================================================*/

function initBannerSlider(
    container,
    section
){

    const slides =
        container.querySelectorAll(
            ".banner-slide"
        );


    if(slides.length <= 1){

        return;

    }


    const dots =
        container.querySelectorAll(
            ".banner-dot"
        );


    let current = 0;

    let timer = null;


    function showSlide(index){

        current =
            (index + slides.length) %
            slides.length;


        slides.forEach(
            (slide,i)=>{

                slide.classList.toggle(
                    "active",
                    i === current
                );

            }
        );


        dots.forEach(
            (dot,i)=>{

                dot.classList.toggle(
                    "active",
                    i === current
                );

            }
        );

    }


    function start(){

        if(section.autoPlay === false){

            return;

        }


        const interval =
            Number(
                section.interval || 5000
            );


        timer =
            setInterval(
                () => {

                    showSlide(
                        current + 1
                    );

                },
                interval
            );

    }


    function stop(){

        if(timer){

            clearInterval(timer);

            timer = null;

        }

    }


    container
        .querySelector(".banner-next")
        ?.addEventListener(
            "click",
            ()=>{

                stop();

                showSlide(
                    current + 1
                );

                start();

            }
        );


    container
        .querySelector(".banner-prev")
        ?.addEventListener(
            "click",
            ()=>{

                stop();

                showSlide(
                    current - 1
                );

                start();

            }
        );


    dots.forEach(
        dot=>{

            dot.addEventListener(
                "click",
                ()=>{

                    stop();

                    showSlide(
                        Number(
                            dot.dataset.index
                        )
                    );

                    start();

                }
            );

        }
    );


    start();

}


/*==================================================
    PRODUCT CAROUSEL
==================================================*/

async function renderProductCarousel(
    container,
    section
){

    const snapshot =
        await getDocs(
            collection(
                db,
                "products"
            )
        );


    let products =
        snapshot.docs.map(
            docSnap => ({

                id:docSnap.id,

                ...docSnap.data()

            })
        );


    /* CATEGORY */

    if(section.categoryId){

        products =
            products.filter(
                product => {

                    if(
                        section.categoryType ===
                        "main"
                    ){

                        return (

                            product.categoryId ===
                            section.categoryId

                        ) ||

                        (

                            product.category?.id ===
                            section.categoryId

                        );

                    }


                    if(
                        section.categoryType ===
                        "sub"
                    ){

                        return (

                            product.subCategoryId ===
                            section.categoryId

                        ) ||

                        (

                            product.subcategoryId ===
                            section.categoryId

                        ) ||

                        (

                            product.subCategory?.id ===
                            section.categoryId

                        );

                    }


                    return (

                        product.categoryId ===
                        section.categoryId

                    );

                }
            );

    }


    /* TAG */

    if(
        Array.isArray(section.tags) &&
        section.tags.length
    ){

        products =
            products.filter(
                product => {

                    const tags =
                        getProductTags(
                            product
                        );


                    return section.tags.some(
                        selectedTag =>
                            tags.includes(
                                String(
                                    selectedTag
                                ).toLowerCase()
                            )
                    );

                }
            );

    }


    /* SPECIFIC PRODUCTS */

    if(
        Array.isArray(section.productIds) &&
        section.productIds.length
    ){

        const ids =
            new Set(
                section.productIds
            );


        products =
            products.filter(
                product =>
                    ids.has(product.id)
            );

    }


    /* FILTER TYPE */

    if(
        section.filterType ===
        "latest"
    ){

        products.sort(
            (a,b)=>
                getTimestamp(
                    b.createdAt
                )
                -
                getTimestamp(
                    a.createdAt
                )
        );

    }


    if(
        section.filterType ===
        "random"
    ){

        products.sort(
            ()=>Math.random() - 0.5
        );

    }


    const limit =
        Number(
            section.limit || 10
        );


    products =
        products.slice(
            0,
            limit
        );


    container.innerHTML = `

        <div class="home-container">

            ${
                section.title ||
                section.subtitle
                ?
                `
                <div class="carousel-heading">

                    <div>

                        ${
                            section.title
                            ?
                            `
                            <h2>
                                ${escapeHtml(
                                    section.title
                                )}
                            </h2>
                            `
                            :
                            ""
                        }

                        ${
                            section.subtitle
                            ?
                            `
                            <p>
                                ${escapeHtml(
                                    section.subtitle
                                )}
                            </p>
                            `
                            :
                            ""
                        }

                    </div>


                    ${
                        section.viewAllLink
                        ?
                        `
                        <a
                            class="view-all"
                            href="${escapeAttribute(
                                section.viewAllLink
                            )}"
                        >
                            View All
                        </a>
                        `
                        :
                        ""
                    }

                </div>
                `
                :
                ""
            }


            ${
                products.length
                ?
                `
                <div class="product-carousel">

                    ${
                        products.map(
                            product =>
                                createProductCard(
                                    product
                                )
                        ).join("")
                    }

                </div>

                <div class="carousel-dots product-dots">

                    <span class="active"></span>
                    <span></span>
                    <span></span>

                </div>
                `
                :
                `
                <div class="carousel-empty">
                    No products found.
                </div>
                `
            }

        </div>

    `;


    initHorizontalCarousel(
        container,
        ".product-carousel"
    );

}


/*==================================================
    PRODUCT CARD
==================================================*/

function createProductCard(
    product
){

    const image =
        getProductImage(
            product
        );


    const name =
        product.name ||
        product.title ||
        "Product";


    const price =
        getProductPrice(
            product
        );


    const oldPrice =
        getProductOldPrice(
            product
        );


    return `

        <a
            class="product-card"
            href="${getProductLink(
                product
            )}"
        >

            <div class="product-image">

                ${
                    image
                    ?
                    `
                    <img
                        src="${escapeAttribute(
                            image
                        )}"
                        alt="${escapeAttribute(
                            name
                        )}"
                        loading="lazy"
                    >
                    `
                    :
                    `
                    <div class="product-image-empty">
                        No Image
                    </div>
                    `
                }


                <button
                    class="product-wishlist"
                    type="button"
                    aria-label="Wishlist"
                    onclick="
                        event.preventDefault();
                        event.stopPropagation();
                        this.classList.toggle('active');
                    "
                >
                    ♡
                </button>

            </div>


            <div class="product-info">

                <h3>
                    ${escapeHtml(
                        name
                    )}
                </h3>


                ${
                    price !== ""
                    ?
                    `
                    <div class="product-prices">

                        ${
                            oldPrice !== ""
                            ?
                            `
                            <span class="product-old-price">
                                ₹${escapeHtml(
                                    String(oldPrice)
                                )}
                            </span>
                            `
                            :
                            ""
                        }

                        <strong>
                            ₹${escapeHtml(
                                String(price)
                            )}
                        </strong>

                    </div>
                    `
                    :
                    ""
                }


                <span class="product-button">

                    ${
                        product.variants ||
                        product.options
                        ?
                        "SELECT OPTIONS"
                        :
                        "ADD TO CART"
                    }

                </span>

            </div>

        </a>

    `;

}


/*==================================================
    PRODUCT HELPERS
==================================================*/

function getProductImage(product){

    if(
        Array.isArray(product.images) &&
        product.images.length
    ){

        const first =
            product.images[0];


        if(
            typeof first ===
            "string"
        ){

            return first;

        }


        return (
            first?.url ||
            first?.src ||
            ""
        );

    }


    return (
        product.image ||
        product.imageUrl ||
        product.thumbnail ||
        ""
    );

}


function getProductPrice(product){

    if(
        product.price !== undefined &&
        product.price !== null
    ){

        return product.price;

    }


    if(
        product.basePrice !== undefined &&
        product.basePrice !== null
    ){

        return product.basePrice;

    }


    if(
        product.pricing?.price !== undefined
    ){

        return product.pricing.price;

    }


    return "";

}


function getProductOldPrice(product){

    return (
        product.comparePrice ??
        product.mrp ??
        product.originalPrice ??
        ""
    );

}


function getProductLink(product){

    if(product.link){

        return product.link;

    }


    return `product.html?id=${encodeURIComponent(
        product.id
    )}`;

}


function getProductTags(product){

    let tags=[];


    if(Array.isArray(product.tags)){

        tags.push(
            ...product.tags
        );

    }


    if(product.tag){

        if(Array.isArray(product.tag)){

            tags.push(
                ...product.tag
            );

        }
        else{

            tags.push(
                product.tag
            );

        }

    }


    return tags.map(
        tag=>{

            if(typeof tag === "object"){

                return String(
                    tag.slug ||
                    tag.name ||
                    ""
                ).toLowerCase();

            }


            return String(
                tag
            ).toLowerCase();

        }
    );

}


/*==================================================
    IMAGE CAROUSEL
==================================================*/

function renderImageCarousel(
    container,
    section
){

    const images =
        Array.isArray(section.images)
            ? section.images
            : [];


    if(!images.length){

        container.remove();

        return;

    }


    container.innerHTML = `

        <div class="home-container">

            ${
                section.title ||
                section.subtitle
                ?
                `
                <div class="carousel-heading">

                    <div>

                        ${
                            section.title
                            ?
                            `
                            <h2>
                                ${escapeHtml(
                                    section.title
                                )}
                            </h2>
                            `
                            :
                            ""
                        }

                        ${
                            section.subtitle
                            ?
                            `
                            <p>
                                ${escapeHtml(
                                    section.subtitle
                                )}
                            </p>
                            `
                            :
                            ""
                        }

                    </div>

                </div>
                `
                :
                ""
            }


            <div class="image-carousel">

                ${
                    images.map(
                        image=>{

                            const html = `

                                <div class="image-box">

                                    <img
                                        src="${escapeAttribute(
                                            image.src || ""
                                        )}"
                                        alt="${escapeAttribute(
                                            image.title || ""
                                        )}"
                                        loading="lazy"
                                    >

                                </div>


                                ${
                                    image.title
                                    ?
                                    `
                                    <div class="image-carousel-title">

                                        ${escapeHtml(
                                            image.title
                                        )}

                                    </div>
                                    `
                                    :
                                    ""
                                }

                            `;


                            if(image.link){

                                return `

                                    <a
                                        class="
                                            image-carousel-item
                                        "
                                        href="${escapeAttribute(
                                            image.link
                                        )}"
                                    >

                                        ${html}

                                    </a>

                                `;

                            }


                            return `

                                <div
                                    class="
                                        image-carousel-item
                                    "
                                >

                                    ${html}

                                </div>

                            `;

                        }
                    ).join("")
                }

            </div>


            <div class="carousel-dots">

                <span class="active"></span>
                <span></span>
                <span></span>

            </div>

        </div>

    `;


    initHorizontalCarousel(
        container,
        ".image-carousel"
    );

}


/*==================================================
    YOUTUBE CAROUSEL
==================================================*/

function renderYoutubeCarousel(
    container,
    section
){

    const videos =
        Array.isArray(section.videos)
            ? section.videos
            : [];


    if(!videos.length){

        container.remove();

        return;

    }


    container.innerHTML = `

        <div class="home-container">

            ${
                section.title ||
                section.subtitle
                ?
                `
                <div class="carousel-heading">

                    <div>

                        ${
                            section.title
                            ?
                            `
                            <h2>
                                ${escapeHtml(
                                    section.title
                                )}
                            </h2>
                            `
                            :
                            ""
                        }

                        ${
                            section.subtitle
                            ?
                            `
                            <p>
                                ${escapeHtml(
                                    section.subtitle
                                )}
                            </p>
                            `
                            :
                            ""
                        }

                    </div>

                </div>
                `
                :
                ""
            }


            <div class="youtube-carousel">

                ${
                    videos.map(
                        video=>{

                            const embed =
                                getYoutubeEmbedUrl(
                                    video.url
                                );


                            if(!embed){

                                return "";

                            }


                            return `

                                <div class="youtube-item">

                                    <iframe
                                        src="${escapeAttribute(
                                            embed
                                        )}"
                                        title="${escapeAttribute(
                                            video.title ||
                                            "YouTube Shorts"
                                        )}"
                                        loading="lazy"
                                        allow="
                                            accelerometer;
                                            autoplay;
                                            clipboard-write;
                                            encrypted-media;
                                            gyroscope;
                                            picture-in-picture;
                                            web-share
                                        "
                                        allowfullscreen
                                    ></iframe>

                                </div>

                            `;

                        }
                    ).join("")
                }

            </div>


            <div class="carousel-dots">

                <span class="active"></span>
                <span></span>
                <span></span>

            </div>

        </div>

    `;


    initHorizontalCarousel(
        container,
        ".youtube-carousel"
    );

}


/*==================================================
    YOUTUBE URL
==================================================*/

function getYoutubeEmbedUrl(url){

    if(!url){

        return "";

    }


    try{

        const parsed =
            new URL(url);


        if(
            parsed.pathname.startsWith(
                "/shorts/"
            )
        ){

            const id =
                parsed.pathname
                    .split("/shorts/")[1]
                    .split("/")[0];


            return id
                ? `https://www.youtube.com/embed/${id}`
                : "";

        }


        if(
            parsed.searchParams.get("v")
        ){

            return `https://www.youtube.com/embed/${
                parsed.searchParams.get("v")
            }`;

        }


        if(
            parsed.hostname === "youtu.be"
        ){

            const id =
                parsed.pathname.replace(
                    "/",
                    ""
                );


            return id
                ? `https://www.youtube.com/embed/${id}`
                : "";

        }

    }

    catch(error){

        console.warn(
            "Invalid YouTube URL:",
            url
        );

    }


    return "";

}


/*==================================================
    REVIEWS
==================================================*/

function renderReviewCarousel(
    container,
    section
){

    const reviews =
        Array.isArray(section.reviews)
            ? section.reviews
            : [];


    if(!reviews.length){

        container.remove();

        return;

    }


    const limit =
        Number(
            section.limit || 10
        );


    const visible =
        reviews.slice(
            0,
            limit
        );


    container.innerHTML = `

        <div class="home-container">

            ${
                section.title ||
                section.subtitle
                ?
                `
                <div class="carousel-heading">

                    <div>

                        ${
                            section.title
                            ?
                            `
                            <h2>
                                ${escapeHtml(
                                    section.title
                                )}
                            </h2>
                            `
                            :
                            ""
                        }

                        ${
                            section.subtitle
                            ?
                            `
                            <p>
                                ${escapeHtml(
                                    section.subtitle
                                )}
                            </p>
                            `
                            :
                            ""
                        }

                    </div>

                </div>
                `
                :
                ""
            }


            <div class="review-carousel">

                ${
                    visible.map(
                        review=>`

                        <article class="review-card">

                            ${
                                review.image
                                ?
                                `
                                <img
                                    class="review-avatar"
                                    src="${escapeAttribute(
                                        review.image
                                    )}"
                                    alt="${escapeAttribute(
                                        review.name || "Customer"
                                    )}"
                                    loading="lazy"
                                >
                                `
                                :
                                `
                                <div class="review-avatar review-avatar-empty">
                                    ${escapeHtml(
                                        (review.name || "C")
                                            .charAt(0)
                                            .toUpperCase()
                                    )}
                                </div>
                                `
                            }


                            <div class="review-stars">

                                ${renderStars(
                                    review.stars || 5
                                )}

                            </div>


                            <p class="review-text">

                                ${escapeHtml(
                                    review.review ||
                                    review.text ||
                                    ""
                                )}

                            </p>


                            ${
                                review.name
                                ?
                                `
                                <h3 class="review-name">

                                    ${escapeHtml(
                                        review.name
                                    )}

                                </h3>
                                `
                                :
                                ""
                            }

                        </article>

                    `
                    ).join("")
                }

            </div>


            <div class="carousel-dots">

                <span class="active"></span>
                <span></span>
                <span></span>

            </div>

        </div>

    `;


    initHorizontalCarousel(
        container,
        ".review-carousel"
    );

}


/*==================================================
    STARS
==================================================*/

function renderStars(stars){

    const rating =
        Math.max(
            0,
            Math.min(
                5,
                Number(stars) || 0
            )
        );


    return (
        "★".repeat(rating) +
        "☆".repeat(5-rating)
    );

}


/*==================================================
    SPACER
==================================================*/

function renderSpacer(
    container,
    section
){

    container.style.height =
        `${Number(
            section.height || 40
        )}px`;


    if(section.background){

        container.style.background =
            section.background;

    }


    if(section.backgroundColor){

        container.style.backgroundColor =
            section.backgroundColor;

    }

}


/*==================================================
    HORIZONTAL CAROUSEL
==================================================*/

function initHorizontalCarousel(
    container,
    selector
){

    const carousel =
        container.querySelector(
            selector
        );


    if(!carousel){

        return;

    }


    carousel.addEventListener(
        "scroll",
        ()=>{

            updateCarouselDots(
                carousel,
                container
            );

        },
        {
            passive:true
        }
    );

}


/*==================================================
    CAROUSEL DOTS
==================================================*/

function updateCarouselDots(
    carousel,
    container
){

    const dots =
        container.querySelectorAll(
            ".carousel-dots span"
        );


    if(!dots.length){

        return;

    }


    const max =
        carousel.scrollWidth -
        carousel.clientWidth;


    if(max <= 0){

        return;

    }


    const progress =
        carousel.scrollLeft /
        max;


    const index =
        Math.round(
            progress *
            (dots.length - 1)
        );


    dots.forEach(
        (dot,i)=>{

            dot.classList.toggle(
                "active",
                i === index
            );

        }
    );

}


/*==================================================
    TIMESTAMP
==================================================*/

function getTimestamp(value){

    if(!value){

        return 0;

    }


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

    if(loader){

        loader.classList.remove(
            "hidden"
        );

    }

}


function hideLoader(){

    if(loader){

        loader.classList.add(
            "hidden"
        );

    }

}


/*==================================================
    ESCAPE
==================================================*/

function escapeHtml(value){

    return String(
        value ?? ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );

}


function escapeAttribute(value){

    return escapeHtml(
        value
    );

}


/*==================================================
    EXPORT
==================================================*/

export {

    loadHomepage,

    renderSection

};