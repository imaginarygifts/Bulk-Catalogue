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
    YOUTUBE IFRAME API
==================================================*/

let youtubeApiPromise = null;


function loadYouTubeAPI(){

    if(
        window.YT &&
        window.YT.Player
    ){

        return Promise.resolve(
            window.YT
        );

    }


    if(youtubeApiPromise){

        return youtubeApiPromise;

    }


    youtubeApiPromise =
        new Promise(
            resolve => {

                const previousCallback =
                    window.onYouTubeIframeAPIReady;


                window.onYouTubeIframeAPIReady =
                    () => {

                        if(
                            typeof previousCallback ===
                            "function"
                        ){

                            previousCallback();

                        }


                        resolve(
                            window.YT
                        );

                    };


                const existing =
                    document.querySelector(
                        'script[src="https://www.youtube.com/iframe_api"]'
                    );


                if(existing){

                    return;

                }


                const script =
                    document.createElement(
                        "script"
                    );


                script.src =
                    "https://www.youtube.com/iframe_api";


                script.async = true;


                document.head.appendChild(
                    script
                );

            }
        );


    return youtubeApiPromise;

}

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
            snapshot.docs.map(
                docSnap => ({

                    id: docSnap.id,

                    ...docSnap.data()

                })
            );


        /*==================================================
            ONLY PUBLISHED
        ==================================================*/

        sections =
            sections.filter(
                section =>
                    section.published !== false
            );


        /*==================================================
            SORT
        ==================================================*/

        sections.sort(
            (a,b) =>
                Number(a.order || 0) -
                Number(b.order || 0)
        );


        homepage.innerHTML = "";


        /*==================================================
            EMPTY
        ==================================================*/

        if(!sections.length){

            homepage.innerHTML = `

                <div class="homepage-empty">

                    <h2>
                        Homepage
                    </h2>

                    <p>
                        No sections have been published yet.
                    </p>

                </div>

            `;

            hideLoader();

            return;

        }


        /*==================================================
            RENDER
        ==================================================*/

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


    /*==================================================
        BACKGROUND COLOR
    ==================================================*/

    if(section.backgroundColor){

        wrapper.style.backgroundColor =
            section.backgroundColor;

    }


    /*==================================================
        SECTION TYPE
    ==================================================*/

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


    parent.appendChild(
        wrapper
    );

}


/*==================================================
    REUSABLE SECTION HEADING
==================================================*/

function renderSectionHeading(
    section,
    className = "carousel-heading"
){

    const hasTitle =
        Boolean(section.title);


    const hasSubtitle =
        Boolean(section.subtitle);


    if(!hasTitle && !hasSubtitle){

        return "";

    }


    const titleColor =
        section.titleColor ||
        "#ffffff";


    const subtitleColor =
        section.subtitleColor ||
        "#aaaaaa";


    return `

        <div class="${className}">

            <div>

                ${
                    hasTitle
                    ?
                    `
                    <h2
                        style="
                            color:${escapeAttribute(
                                titleColor
                            )};
                        "
                    >
                        ${escapeHtml(
                            section.title
                        )}
                    </h2>
                    `
                    :
                    ""
                }


                ${
                    hasSubtitle
                    ?
                    `
                    <p
                        style="
                            color:${escapeAttribute(
                                subtitleColor
                            )};
                        "
                    >
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
                    <h2
                        style="
                            color:${escapeAttribute(
                                section.titleColor ||
                                "#ffffff"
                            )};
                        "
                    >

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
                    <p
                        style="
                            color:${escapeAttribute(
                                section.subtitleColor ||
                                "#aaaaaa"
                            )};
                        "
                    >

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
                            (slide,index) => {

                                const titleColor =
                                    section.titleColor ||
                                    slide.titleColor ||
                                    "#ffffff";


                                const subtitleColor =
                                    section.subtitleColor ||
                                    slide.subtitleColor ||
                                    "#ffffff";


                                const slideContent =
                                    slide.title ||
                                    slide.subtitle ||
                                    slide.buttonText;


                                const bannerImage =
                                    slide.image
                                    ?
                                    `
                                    <img
                                        src="${escapeAttribute(
                                            slide.image
                                        )}"
                                        alt="${escapeAttribute(
                                            slide.title ||
                                            "Banner"
                                        )}"
                                    >
                                    `
                                    :
                                    `
                                    <div class="banner-no-image">
                                        Banner
                                    </div>
                                    `;


                                const content =
                                    slideContent
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
                                            <h2
                                                style="
                                                    color:${escapeAttribute(
                                                        titleColor
                                                    )};
                                                "
                                            >
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
                                            <p
                                                style="
                                                    color:${escapeAttribute(
                                                        subtitleColor
                                                    )};
                                                "
                                            >
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
                                                    slide.buttonLink ||
                                                    "#"
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
                                    "";


                                /*
                                    Banner Link

                                    If bannerLink exists,
                                    the complete banner image/content
                                    becomes clickable.

                                    Button remains clickable separately.
                                */

                                if(slide.bannerLink){

                                    return `

                                        <div
                                            class="
                                                banner-slide
                                                ${
                                                    index === 0
                                                    ? "active"
                                                    : ""
                                                }
                                            "
                                            data-index="${index}"
                                        >

                                            <a
                                                class="banner-main-link"
                                                href="${escapeAttribute(
                                                    slide.bannerLink
                                                )}"
                                            >

                                                ${bannerImage}

                                                ${content}

                                            </a>

                                        </div>

                                    `;

                                }


                                return `

                                    <div
                                        class="
                                            banner-slide
                                            ${
                                                index === 0
                                                ? "active"
                                                : ""
                                            }
                                        "
                                        data-index="${index}"
                                    >

                                        ${bannerImage}

                                        ${content}

                                    </div>

                                `;

                            }
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

        if(
            section.autoPlay === false
        ){

            return;

        }


        const interval =
            Number(
                section.interval ||
                5000
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

            clearInterval(
                timer
            );

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


    /*==================================================
        CATEGORY
    ==================================================*/

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


    /*==================================================
        TAG
    ==================================================*/

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


    /*==================================================
        SPECIFIC PRODUCTS
    ==================================================*/

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
                    ids.has(
                        product.id
                    )
            );

    }


    /*==================================================
        FILTER TYPE
    ==================================================*/

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


    /*==================================================
        LIMIT
    ==================================================*/

    const limit =
        Number(
            section.limit ||
            10
        );


    products =
        products.slice(
            0,
            limit
        );


    /*==================================================
        HTML
    ==================================================*/

    container.innerHTML = `

        <div class="home-container">

            ${renderSectionHeading(
                section
            )}


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


    /*==================================================
        SALE PRICE
    ==================================================*/

    const salePrice =
        product.salePrice ??
        product.price ??
        product.pricing?.salePrice ??
        product.pricing?.price ??
        "";


    /*==================================================
        BASE PRICE
    ==================================================*/

    const basePrice =
        product.basePrice ??
        product.originalPrice ??
        product.mrp ??
        product.pricing?.basePrice ??
        product.pricing?.mrp ??
        "";


    /*==================================================
        DISCOUNT
    ==================================================*/

    let discount = "";


    if(
        basePrice !== "" &&
        salePrice !== "" &&
        Number(basePrice) >
        Number(salePrice)
    ){

        discount =
            Math.round(
                (
                    (
                        Number(basePrice) -
                        Number(salePrice)
                    )
                    /
                    Number(basePrice)
                ) * 100
            );

    }


    /*==================================================
        BESTSELLER
    ==================================================*/

    const bestseller =
        product.bestseller === true ||
        product.isBestseller === true ||
        product.bestSeller === true;


    return `

        <a
            class="product-card"
            href="${getProductLink(product)}"
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


                ${
                    discount
                    ?
                    `
                    <div class="product-discount">

                        -${discount}%

                    </div>
                    `
                    :
                    ""
                }


                ${
                    bestseller
                    ?
                    `
                    <div class="product-bestseller">

                        🔥 Bestseller

                    </div>
                    `
                    :
                    ""
                }


                <button
                    class="product-wishlist"
                    type="button"
                    onclick="
                        event.preventDefault();
                        event.stopPropagation();
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
                    salePrice !== "" ||
                    basePrice !== ""
                    ?
                    `
                    <div class="product-prices">

                        ${
                            salePrice !== ""
                            ?
                            `
                            <span
                                class="product-sale-price"
                            >
                                ₹${escapeHtml(
                                    String(
                                        salePrice
                                    )
                                )}
                            </span>
                            `
                            :
                            ""
                        }


                        ${
                            basePrice !== "" &&
                            Number(basePrice) >
                            Number(salePrice)
                            ?
                            `
                            <span
                                class="product-old-price"
                            >
                                ₹${escapeHtml(
                                    String(
                                        basePrice
                                    )
                                )}
                            </span>
                            `
                            :
                            ""
                        }

                    </div>
                    `
                    :
                    ""
                }


                <div class="product-button">

                    ${
                        product.customOptions ||
                        product.options ||
                        product.variants
                        ?
                        "SELECT OPTIONS"
                        :
                        "ADD TO CART"
                    }

                </div>

            </div>

        </a>

    `;

}


/*==================================================
    PRODUCT HELPERS
==================================================*/

function getProductImage(
    product
){

    if(
        Array.isArray(
            product.images
        ) &&
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


function getProductPrice(
    product
){

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


function getProductOldPrice(
    product
){

    return (
        product.comparePrice ??
        product.mrp ??
        product.originalPrice ??
        ""
    );

}


function getProductLink(
    product
){

    if(product.link){

        return product.link;

    }


    return `product.html?id=${encodeURIComponent(
        product.id
    )}`;

}


function getProductTags(
    product
){

    let tags = [];


    if(
        Array.isArray(
            product.tags
        )
    ){

        tags.push(
            ...product.tags
        );

    }


    if(product.tag){

        if(
            Array.isArray(
                product.tag
            )
        ){

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
        tag => {

            if(
                typeof tag ===
                "object"
            ){

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
        Array.isArray(
            section.images
        )
        ? section.images
        : [];


    if(!images.length){

        container.remove();

        return;

    }


    container.innerHTML = `

        <div class="home-container">

            ${renderSectionHeading(
                section
            )}


            <div class="image-carousel">

                ${
                    images.map(
                        image => {

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
                                    <div
                                        class="
                                            image-carousel-title
                                        "
                                    >

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


    /*==================================================
        REMOVE EMPTY SECTION
    ==================================================*/

    if(!videos.length){

        container.remove();

        return;

    }


    /*==================================================
        VALID VIDEOS
    ==================================================*/

    const validVideos =
        videos
            .map(video => {

                const videoId =
                    getYoutubeVideoId(
                        video.url
                    );


                if(!videoId){

                    return null;

                }


                return {

                    ...video,

                    videoId

                };

            })
            .filter(Boolean);


    if(!validVideos.length){

        container.remove();

        return;

    }


    /*==================================================
        HTML
    ==================================================*/

    container.innerHTML = `

        <div class="home-container">

            ${renderSectionHeading(
                section
            )}


            <div
                class="youtube-carousel"
                data-youtube-carousel
            >

                ${
                    validVideos.map(
                        video => {

                            const thumbnail =
                                getYoutubeThumbnail(
                                    video.videoId
                                );


                            return `

                                <div
                                    class="youtube-item"
                                    data-video-id="${escapeAttribute(
                                        video.videoId
                                    )}"
                                >

                                    <!-- THUMBNAIL -->

                                    <div
                                        class="youtube-thumbnail"
                                        style="
                                            background-image:url(
                                                '${escapeAttribute(
                                                    thumbnail
                                                )}'
                                            );
                                        "
                                        aria-label="Play video"
                                        role="button"
                                        tabindex="0"
                                    ></div>


                                    <!-- CUSTOM PLAY ICON -->

                                    <div
                                        class="youtube-play-indicator"
                                        aria-hidden="true"
                                    ></div>


                                </div>

                            `;

                        }
                    ).join("")
                }

            </div>


            <div class="carousel-dots">

                ${
                    validVideos.map(
                        (_,index) => `

                        <span
                            class="${
                                index === 0
                                ? "active"
                                : ""
                            }"
                        ></span>

                    `
                    ).join("")
                }

            </div>

        </div>

    `;


    initYoutubeCarousel(
        container,
        section
    );

}

/*==================================================
    YOUTUBE CAROUSEL CONTROLLER
==================================================*/

async function initYoutubeCarousel(
    container,
    section
){

    const carousel =
        container.querySelector(
            "[data-youtube-carousel]"
        );


    if(!carousel){

        return;

    }


    const slides =
        Array.from(
            carousel.querySelectorAll(
                ".youtube-item"
            )
        );


    if(!slides.length){

        return;

    }


    /*==================================================
        PLAYER STORAGE
    ==================================================*/

    const players =
        new Array(
            slides.length
        ).fill(null);


    const playerReady =
        new Array(
            slides.length
        ).fill(false);


    const pendingAutoPlay =
        new Array(
            slides.length
        ).fill(false);


    let activeIndex = -1;

    let scrollTimer = null;

    let readyCount = 0;

    let initialStarted = false;


    /*==================================================
        LOAD YOUTUBE API
    ==================================================*/

    try{

        await loadYouTubeAPI();

    }

    catch(error){

        console.error(
            "YouTube API failed:",
            error
        );

        return;

    }


    /*==================================================
        CREATE PLAYERS
    ==================================================*/

    slides.forEach(
        (slide,index) => {

            const videoId =
                slide.dataset.videoId;


            if(!videoId){

                return;

            }


            const iframe =
                document.createElement(
                    "iframe"
                );


            /*
                Keep iframe hidden until
                the video is actually activated.
            */

            iframe.style.display =
                "none";


            iframe.src =
                `https://www.youtube.com/embed/${encodeURIComponent(
                    videoId
                )}?enablejsapi=1&playsinline=1&controls=0&rel=0&autoplay=0&fs=0&iv_load_policy=3&disablekb=1&modestbranding=1`;


            iframe.title =
                "Product Video";


            iframe.setAttribute(
                "frameborder",
                "0"
            );


            iframe.setAttribute(
                "allow",
                "autoplay; encrypted-media; picture-in-picture"
            );


            iframe.setAttribute(
                "allowfullscreen",
                ""
            );


            slide.appendChild(
                iframe
            );


            /*==================================================
                CREATE PLAYER
            ==================================================*/

            const player =
                new YT.Player(
                    iframe,
                    {

                        events: {

                            /*======================================
                                READY
                            ======================================*/

                            onReady:
                                event => {

                                    players[index] =
                                        event.target;


                                    playerReady[index] =
                                        true;


                                    readyCount++;


                                    /*
                                        Keep every player muted
                                        initially.

                                        This allows autoplay on
                                        mobile browsers.
                                    */

                                    try{

                                        event.target.mute();

                                    }
                                    catch(error){}


                                    /*==================================
                                        START CENTER VIDEO
                                    ==================================*/

                                    if(
                                        !initialStarted &&
                                        readyCount ===
                                        slides.length
                                    ){

                                        initialStarted =
                                            true;


                                        const centerIndex =
                                            getCenterSlide();


                                        if(
                                            centerIndex >= 0
                                        ){

                                            playVideo(
                                                centerIndex,
                                                false
                                            );

                                        }

                                    }


                                    /*==================================
                                        PENDING CENTER AUTOPLAY
                                    ==================================*/

                                    if(
                                        pendingAutoPlay[index]
                                    ){

                                        pendingAutoPlay[index] =
                                            false;


                                        playVideo(
                                            index,
                                            false
                                        );

                                    }

                                },


                            /*======================================
                                STATE CHANGE
                            ======================================*/

                            onStateChange:
                                event => {

                                    if(
                                        event.data ===
                                        YT.PlayerState.ENDED
                                    ){

                                        resetVideo(
                                            index
                                        );

                                    }

                                },


                            /*======================================
                                ERROR
                            ======================================*/

                            onError:
                                event => {

                                    console.warn(
                                        "YouTube error:",
                                        event.data
                                    );


                                    resetVideo(
                                        index
                                    );

                                }

                        }

                    }
                );


            players[index] =
                player;

        }
    );


    /*==================================================
        PLAY VIDEO
    ==================================================*/

    function playVideo(
        index,
        userClick = false
    ){

        if(
            index < 0 ||
            index >= slides.length
        ){

            return;

        }


        /*
            Stop every other video.
        */

        slides.forEach(
            (_,i) => {

                if(i !== index){

                    resetVideo(
                        i
                    );

                }

            }
        );


        /*==================================================
            PLAYER NOT READY
        ==================================================*/

        if(
            !playerReady[index] ||
            !players[index]
        ){

            /*
                Remember that this video should
                start once YouTube is ready.
            */

            pendingAutoPlay[index] =
                true;


            activeIndex =
                index;


            return;

        }


        activateVideo(
            index,
            userClick
        );

    }


    /*==================================================
        ACTIVATE VIDEO
    ==================================================*/

    function activateVideo(
        index,
        userClick = false
    ){

        const player =
            players[index];


        const slide =
            slides[index];


        if(
            !player ||
            !slide
        ){

            pendingAutoPlay[index] =
                true;

            return;

        }


        /*==================================================
            STOP ALL OTHER PLAYERS
        ==================================================*/

        slides.forEach(
            (_,i) => {

                if(i === index){

                    return;

                }


                const otherPlayer =
                    players[i];


                if(
                    otherPlayer &&
                    playerReady[i]
                ){

                    try{

                        otherPlayer.pauseVideo();

                    }
                    catch(error){}

                }


                slides[i]
                    .classList
                    .remove(
                        "is-playing"
                    );


                const otherIframe =
                    slides[i]
                        .querySelector(
                            "iframe"
                        );


                if(otherIframe){

                    otherIframe.style.display =
                        "none";

                }

            }
        );


        activeIndex =
            index;


        slide.classList.add(
            "is-playing"
        );


        const iframe =
            slide.querySelector(
                "iframe"
            );


        if(iframe){

            iframe.style.display =
                "block";

        }


        updateYoutubeDots(
            carousel,
            index
        );


        /*==================================================
            CLICK
            USER CLICK = SOUND ON
        ==================================================*/

        if(userClick){

            try{

                player.unMute();

                player.setVolume(
                    100
                );

            }
            catch(error){

                console.warn(
                    "Unable to unmute:",
                    error
                );

            }

        }

        else{

            /*
                SWIPE / AUTO PLAY

                Must remain muted for mobile
                autoplay permission.
            */

            try{

                player.mute();

            }
            catch(error){}

        }


        /*==================================================
            PLAY
        ==================================================*/

        try{

            player.playVideo();

        }

        catch(error){

            console.warn(
                "Unable to play YouTube video:",
                error
            );

        }

    }


    /*==================================================
        RESET VIDEO
    ==================================================*/

    function resetVideo(
        index
    ){

        if(
            index < 0 ||
            index >= slides.length
        ){

            return;

        }


        pendingAutoPlay[index] =
            false;


        const player =
            players[index];


        if(
            player &&
            playerReady[index]
        ){

            try{

                player.pauseVideo();

            }
            catch(error){}

        }


        const slide =
            slides[index];


        slide.classList.remove(
            "is-playing"
        );


        const iframe =
            slide.querySelector(
                "iframe"
            );


        if(iframe){

            iframe.style.display =
                "none";

        }


        if(
            activeIndex === index
        ){

            activeIndex =
                -1;

        }

    }


    /*==================================================
        STOP ALL
    ==================================================*/

    function stopAll(){

        slides.forEach(
            (_,index) => {

                resetVideo(
                    index
                );

            }
        );

    }


    /*==================================================
        FIND VIDEO CLOSEST TO CAROUSEL CENTER
    ==================================================*/

    function getCenterSlide(){

        const carouselRect =
            carousel.getBoundingClientRect();


        const carouselCenter =
            carouselRect.left +
            (
                carouselRect.width /
                2
            );


        let closestIndex =
            -1;


        let closestDistance =
            Infinity;


        slides.forEach(
            (slide,index) => {

                const rect =
                    slide.getBoundingClientRect();


                const slideCenter =
                    rect.left +
                    (
                        rect.width /
                        2
                    );


                const distance =
                    Math.abs(
                        carouselCenter -
                        slideCenter
                    );


                if(
                    distance <
                    closestDistance
                ){

                    closestDistance =
                        distance;


                    closestIndex =
                        index;

                }

            }
        );


        return closestIndex;

    }


    /*==================================================
        HORIZONTAL SWIPE
    ==================================================*/

    carousel.addEventListener(
        "scroll",
        () => {

            /*
                Wait until the user's finger
                has finished moving.
            */

            clearTimeout(
                scrollTimer
            );


            /*
                Stop currently playing video
                immediately when carousel moves.
            */

            if(
                activeIndex >= 0
            ){

                const currentSlide =
                    slides[
                        activeIndex
                    ];


                if(currentSlide){

                    const rect =
                        currentSlide.getBoundingClientRect();


                    const carouselRect =
                        carousel.getBoundingClientRect();


                    const carouselCenter =
                        carouselRect.left +
                        (
                            carouselRect.width /
                            2
                        );


                    const currentCenter =
                        rect.left +
                        (
                            rect.width /
                            2
                        );


                    /*
                        If current video is moving
                        away from center, stop it.
                    */

                    if(
                        Math.abs(
                            currentCenter -
                            carouselCenter
                        ) >
                        rect.width * 0.35
                    ){

                        resetVideo(
                            activeIndex
                        );

                    }

                }

            }


            scrollTimer =
                setTimeout(
                    () => {

                        const centerIndex =
                            getCenterSlide();


                        if(
                            centerIndex < 0
                        ){

                            return;

                        }


                        /*
                            CENTER VIDEO AUTOPLAY

                            FALSE = keep muted
                            so mobile autoplay works.
                        */

                        playVideo(
                            centerIndex,
                            false
                        );

                    },
                    180
                );

        },
        {
            passive:true
        }
    );


    /*==================================================
        CLICK ANY VIDEO
    ==================================================*/

    carousel.addEventListener(
        "click",
        event => {

            const slide =
                event.target.closest(
                    ".youtube-item"
                );


            if(!slide){

                return;

            }


            const index =
                slides.indexOf(
                    slide
                );


            if(index < 0){

                return;

            }


            /*
                CLICK = USER GESTURE

                Therefore sound can be enabled.
            */

            playVideo(
                index,
                true
            );

        }
    );


    /*==================================================
        KEYBOARD
    ==================================================*/

    carousel.addEventListener(
        "keydown",
        event => {

            const thumbnail =
                event.target.closest(
                    ".youtube-thumbnail"
                );


            if(!thumbnail){

                return;

            }


            if(
                event.key !== "Enter" &&
                event.key !== " "
            ){

                return;

            }


            event.preventDefault();


            const slide =
                thumbnail.closest(
                    ".youtube-item"
                );


            if(!slide){

                return;

            }


            const index =
                slides.indexOf(
                    slide
                );


            if(index < 0){

                return;

            }


            playVideo(
                index,
                true
            );

        }
    );


    /*==================================================
        STOP WHEN CAROUSEL LEAVES SCREEN
    ==================================================*/

    const visibilityObserver =
        new IntersectionObserver(
            entries => {

                entries.forEach(
                    entry => {

                        if(
                            entry.target !==
                            carousel
                        ){

                            return;

                        }


                        if(
                            !entry.isIntersecting
                        ){

                            stopAll();

                        }

                    }
                );

            },
            {
                threshold:0.05
            }
        );


    visibilityObserver.observe(
        carousel
    );


    /*==================================================
        PAGE VISIBILITY
    ==================================================*/

    document.addEventListener(
        "visibilitychange",
        () => {

            if(
                document.hidden
            ){

                stopAll();

            }

        }
    );


    /*==================================================
        INITIAL CENTER VIDEO
    ==================================================*/

    /*
        In case all players were already ready
        before the ready events finished.
    */

    setTimeout(
        () => {

            if(
                initialStarted
            ){

                return;

            }


            const centerIndex =
                getCenterSlide();


            if(
                centerIndex >= 0
            ){

                playVideo(
                    centerIndex,
                    false
                );

            }

        },
        1500
    );

}

/*==================================================
    GET YOUTUBE VIDEO ID
==================================================*/

function getYoutubeVideoId(
    url
){

    if(!url){

        return "";

    }


    const value =
        String(url).trim();


    /*
        Direct YouTube ID
        Example:
        dQw4w9WgXcQ
    */

    if(
        /^[a-zA-Z0-9_-]{11}$/.test(
            value
        )
    ){

        return value;

    }


    try{

        const parsed =
            new URL(value);


        const hostname =
            parsed.hostname
                .toLowerCase()
                .replace(
                    "www.",
                    ""
                );


        /*==================================================
            YOUTUBE SHORTS

            youtube.com/shorts/VIDEO_ID
        ==================================================*/

        if(
            hostname ===
            "youtube.com" &&
            parsed.pathname.startsWith(
                "/shorts/"
            )
        ){

            return parsed.pathname
                .split("/shorts/")[1]
                .split("/")[0]
                .split("?")[0];

        }


        /*==================================================
            NORMAL WATCH

            youtube.com/watch?v=VIDEO_ID
        ==================================================*/

        if(
            hostname ===
            "youtube.com"
        ){

            const id =
                parsed.searchParams.get(
                    "v"
                );


            if(id){

                return id;

            }

        }


        /*==================================================
            YOUTU.BE

            youtu.be/VIDEO_ID
        ==================================================*/

        if(
            hostname ===
            "youtu.be"
        ){

            return parsed.pathname
                .replace(
                    "/",
                    ""
                )
                .split("?")[0];

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
    YOUTUBE THUMBNAIL
==================================================*/

function getYoutubeThumbnail(
    videoId
){

    if(!videoId){

        return "";

    }


    /*
        maxresdefault is sometimes unavailable,
        so hqdefault is more reliable.
    */

    return `https://img.youtube.com/vi/${encodeURIComponent(
        videoId
    )}/hqdefault.jpg`;

}

/*==================================================
    YOUTUBE DOTS
==================================================*/

function updateYoutubeDots(
    carousel,
    index
){

    const container =
        carousel.closest(
            ".home-section"
        );


    if(!container){

        return;

    }


    const dots =
        container.querySelectorAll(
            ".carousel-dots span"
        );


    dots.forEach(
        (dot,i) => {

            dot.classList.toggle(
                "active",
                i === index
            );

        }
    );

}



/*==================================================
    REVIEWS
==================================================*/

function renderReviewCarousel(
    container,
    section
){

    const reviews =
        Array.isArray(
            section.reviews
        )
        ? section.reviews
        : [];


    if(!reviews.length){

        container.remove();

        return;

    }


    const limit =
        Number(
            section.limit ||
            10
        );


    const visible =
        reviews.slice(
            0,
            limit
        );


    container.innerHTML = `

        <div class="home-container">

            ${renderSectionHeading(
                section
            )}


            <div class="review-carousel">

                ${
                    visible.map(
                        review => `

                        <article
                            class="review-card"
                        >

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
                                        review.name ||
                                        "Customer"
                                    )}"
                                    loading="lazy"
                                >
                                `
                                :
                                `
                                <div
                                    class="
                                        review-avatar
                                        review-avatar-empty
                                    "
                                >
                                    ${escapeHtml(
                                        (
                                            review.name ||
                                            "C"
                                        )
                                        .charAt(0)
                                        .toUpperCase()
                                    )}
                                </div>
                                `
                            }


                            <div
                                class="review-stars"
                            >

                                ${renderStars(
                                    review.stars ||
                                    5
                                )}

                            </div>


                            <p
                                class="review-text"
                            >

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
                                <h3
                                    class="review-name"
                                >

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

function renderStars(
    stars
){

    const rating =
        Math.max(
            0,
            Math.min(
                5,
                Number(stars) || 0
            )
        );


    return (
        "★".repeat(
            rating
        ) +
        "☆".repeat(
            5 - rating
        )
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
            section.height ||
            40
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

function getTimestamp(
    value
){

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
        typeof value ===
        "number"
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

function escapeHtml(
    value
){

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


function escapeAttribute(
    value
){

    return escapeHtml(
        value
    );

}


/*==================================================
    SIDEBAR
==================================================*/

window.toggleSidebar =
function(){

    const sidebar =
        document.getElementById(
            "sidebar"
        );


    const overlay =
        document.getElementById(
            "overlay"
        );


    if(
        !sidebar ||
        !overlay
    ){

        return;

    }


    sidebar.classList.toggle(
        "open"
    );


    overlay.classList.toggle(
        "show"
    );

};


/*==================================================
    SEARCH
==================================================*/

window.openSearch =
function(){

    const search =
        document.getElementById(
            "searchOverlay"
        );


    const input =
        document.getElementById(
            "searchInput"
        );


    if(!search){

        return;

    }


    search.classList.add(
        "open"
    );


    setTimeout(
        ()=>{
            input?.focus();
        },
        100
    );

};


window.closeSearch =
function(){

    const search =
        document.getElementById(
            "searchOverlay"
        );


    if(!search){

        return;

    }


    search.classList.remove(
        "open"
    );

};


/*==================================================
    EXPORT
==================================================*/

export {

    loadHomepage,

    renderSection

};