/*==================================================
HOMEPAGE
MOBILE FIRST
==================================================*/

import { db } from "./firebase.js";

import {
    renderYoutubeCarousel
} from "./youtube-carousel.js";

import {
    collection,
    getDocs,
    query,
    where
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
            snapshot.docs.map(
                docSnap => ({

                    id:
                        docSnap.id,

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


        /*==================================================
        CLEAR HOMEPAGE
        ==================================================*/

        homepage.innerHTML = "";


        /*==================================================
        EMPTY HOMEPAGE
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
        RENDER SECTIONS
        ==================================================*/

        for(
            const section of sections
        ){

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
        document.createElement(
            "section"
        );


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

    if(
        section.backgroundColor
    ){

        wrapper.style.backgroundColor =
            section.backgroundColor;

    }


    /*==================================================
    SECTION TYPE
    ==================================================*/

    switch(
        section.type
    ){

        /*==============================================
        HEADING
        ==============================================*/

        case "heading":

            renderHeading(
                wrapper,
                section
            );

            break;


        /*==============================================
        BANNER
        ==============================================*/

        case "banner":

            renderBanner(
                wrapper,
                section
            );

            break;


        /*==============================================
        PRODUCT CAROUSEL
        ==============================================*/

        case "productCarousel":

            await renderProductCarousel(
                wrapper,
                section
            );

            break;


        /*==============================================
        IMAGE CAROUSEL
        ==============================================*/

        case "imageCarousel":

            renderImageCarousel(
                wrapper,
                section
            );

            break;


        /*==============================================
        YOUTUBE CAROUSEL
        ==============================================*/

        case "youtubeCarousel":

            renderYoutubeCarousel(
                wrapper,
                section
            );

            break;


        /*==============================================
        REVIEW CAROUSEL
        ==============================================*/

        case "reviewCarousel":

            await renderReviewCarousel(
                wrapper,
                section
            );

            break;


        /*==============================================
        SPACER
        ==============================================*/

        case "spacer":

            renderSpacer(
                wrapper,
                section
            );

            break;


        /*==============================================
        UNKNOWN
        ==============================================*/

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
        Boolean(
            section.title
        );


    const hasSubtitle =
        Boolean(
            section.subtitle
        );


    if(
        !hasTitle &&
        !hasSubtitle
    ){

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
        Array.isArray(
            section.slides
        )
        ?
        section.slides
        :
        [];


    if(
        !slides.length
    ){

        container.remove();

        return;

    }


    container.innerHTML = `

        <div class="home-container banner-container">

            <div class="home-banner">

                <div class="banner-track">

                    ${
                        slides.map(
                            (
                                slide,
                                index
                            ) => {

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


                                /*==================================
                                COMPLETE BANNER LINK
                                ==================================*/

                                if(
                                    slide.bannerLink
                                ){

                                    return `

                                        <div
                                            class="
                                                banner-slide
                                                ${
                                                    index === 0
                                                    ?
                                                    "active"
                                                    :
                                                    ""
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


                                /*==================================
                                NORMAL BANNER
                                ==================================*/

                                return `

                                    <div
                                        class="
                                            banner-slide
                                            ${
                                                index === 0
                                                ?
                                                "active"
                                                :
                                                ""
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
                                (
                                    _,
                                    index
                                ) => `

                                <button
                                    class="
                                        banner-dot
                                        ${
                                            index === 0
                                            ?
                                            "active"
                                            :
                                            ""
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


    if(
        slides.length <= 1
    ){

        return;

    }


    const dots =
        container.querySelectorAll(
            ".banner-dot"
        );


    let current =
        0;


    let timer =
        null;


    /*==================================================
    SHOW SLIDE
    ==================================================*/

    function showSlide(
        index
    ){

        current =
            (
                index +
                slides.length
            )
            %
            slides.length;


        slides.forEach(
            (
                slide,
                i
            ) => {

                slide.classList.toggle(
                    "active",
                    i === current
                );

            }
        );


        dots.forEach(
            (
                dot,
                i
            ) => {

                dot.classList.toggle(
                    "active",
                    i === current
                );

            }
        );

    }


    /*==================================================
    START
    ==================================================*/

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


    /*==================================================
    STOP
    ==================================================*/

    function stop(){

        if(
            timer
        ){

            clearInterval(
                timer
            );


            timer =
                null;

        }

    }


    /*==================================================
    NEXT
    ==================================================*/

    container
        .querySelector(
            ".banner-next"
        )
        ?.addEventListener(
            "click",
            () => {

                stop();


                showSlide(
                    current + 1
                );


                start();

            }
        );


    /*==================================================
    PREVIOUS
    ==================================================*/

    container
        .querySelector(
            ".banner-prev"
        )
        ?.addEventListener(
            "click",
            () => {

                stop();


                showSlide(
                    current - 1
                );


                start();

            }
        );


    /*==================================================
    DOTS
    ==================================================*/

    dots.forEach(
        dot => {

            dot.addEventListener(
                "click",
                () => {

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

                id:
                    docSnap.id,

                ...docSnap.data()

            })
        );


    /*==================================================
    CATEGORY FILTER
    ==================================================*/

    if(
        section.categoryId
    ){

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

                        )
                        ||
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

                        )
                        ||
                        (

                            product.subcategoryId ===
                            section.categoryId

                        )
                        ||
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
    TAG FILTER
    ==================================================*/

    if(
        Array.isArray(
            section.tags
        )
        &&
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
        Array.isArray(
            section.productIds
        )
        &&
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
    LATEST
    ==================================================*/

    if(
        section.filterType ===
        "latest"
    ){

        products.sort(
            (
                a,
                b
            ) =>
                getTimestamp(
                    b.createdAt
                )
                -
                getTimestamp(
                    a.createdAt
                )
        );

    }


    /*==================================================
    RANDOM
    ==================================================*/

    if(
        section.filterType ===
        "random"
    ){

        products.sort(
            () =>
                Math.random() -
                0.5
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

                    ${
                        products.map(
                            (
                                _,
                                index
                            ) => `

                            <span
                                class="${
                                    index === 0
                                    ?
                                    "active"
                                    :
                                    ""
                                }"
                            ></span>

                        `
                        ).join("")
                    }

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

    let discount =
        "";


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
                )
                *
                100
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
                                class="
                                    product-sale-price
                                "
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
                                class="
                                    product-old-price
                                "
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
PRODUCT IMAGE
==================================================*/

function getProductImage(
    product
){

    if(
        Array.isArray(
            product.images
        )
        &&
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


/*==================================================
PRODUCT PRICE
==================================================*/

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


/*==================================================
PRODUCT OLD PRICE
==================================================*/

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


/*==================================================
PRODUCT LINK
==================================================*/

function getProductLink(
    product
){

    if(
        product.link
    ){

        return product.link;

    }


    return `product.html?id=${encodeURIComponent(
        product.id
    )}`;

}


/*==================================================
PRODUCT TAGS
==================================================*/

function getProductTags(
    product
){

    let tags =
        [];


    if(
        Array.isArray(
            product.tags
        )
    ){

        tags.push(
            ...product.tags
        );

    }


    if(
        product.tag
    ){

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
        ?
        section.images
        :
        [];


    if(
        !images.length
    ){

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
                                            image.src ||
                                            ""
                                        )}"
                                        alt="${escapeAttribute(
                                            image.title ||
                                            ""
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


                            if(
                                image.link
                            ){

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

                ${
                    images.map(
                        (
                            _,
                            index
                        ) => `

                        <span
                            class="${
                                index === 0
                                ?
                                "active"
                                :
                                ""
                            }"
                        ></span>

                    `
                    ).join("")
                }

            </div>

        </div>

    `;


    initHorizontalCarousel(
        container,
        ".image-carousel"
    );

}


/*==================================================
REVIEW CAROUSEL

IMPORTANT:
This is the homepage REVIEW DISPLAY.

customer-review.js is NOT imported here
because customer-review.js is the REVIEW FORM.
==================================================*/

async function renderReviewCarousel(
    container,
    section
){

    try{

        /*==================================================
        LOAD REVIEWS
        ==================================================*/

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "reviews"
                )
            );


        let reviews =
            snapshot.docs.map(
                docSnap => ({

                    id:
                        docSnap.id,

                    ...docSnap.data()

                })
            );


        /*==================================================
        ONLY APPROVED + PUBLISHED
        ==================================================*/

        reviews =
            reviews.filter(
                review =>

                    review.approved === true
                    &&
                    review.published === true
                    &&
                    review.rejected !== true
            );


        /*==================================================
        NEWEST FIRST
        ==================================================*/

        reviews.sort(
            (
                a,
                b
            ) =>

                getTimestamp(
                    b.createdAt
                )
                -
                getTimestamp(
                    a.createdAt
                )
        );


        /*==================================================
        LIMIT
        ==================================================*/

        const limit =
            Number(
                section.limit ||
                10
            );


        reviews =
            reviews.slice(
                0,
                limit
            );


        console.log(
            "Published homepage reviews:",
            reviews
        );


        /*==================================================
        NO REVIEWS
        ==================================================*/

        if(
            !reviews.length
        ){

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


                <div class="review-carousel">

                    ${
                        reviews.map(
                            review => {

                                /*==================================
                                CUSTOMER NAME
                                ==================================*/

                                const name =
                                    review.customerName ||
                                    review.name ||
                                    "Customer";


                                /*==================================
                                CUSTOMER IMAGE
                                ==================================*/

                                const customerImage =
                                    review.customerPhoto ||
                                    review.customerImage ||
                                    review.image ||
                                    review.userPhoto ||
                                    "";


                                /*==================================
                                CUSTOMER PRODUCT PHOTO

                                DO NOT USE productImage
                                ==================================*/

                                const customerProductImage =
                                    review.customerProductImage ||
                                    review.reviewProductImage ||
                                    review.productPhoto ||
                                    "";


                                /*==================================
                                PRODUCT NAME
                                ==================================*/

                                const productName =
                                    review.productName ||
                                    review.product ||
                                    "";


                                /*==================================
                                REVIEW TEXT
                                ==================================*/

                                const reviewText =
                                    review.review ||
                                    review.text ||
                                    review.comment ||
                                    "";


                                /*==================================
                                RATING
                                ==================================*/

                                const rating =
                                    Number(
                                        review.rating ??
                                        review.stars ??
                                        5
                                    );


                                return `

                                    <article
                                        class="review-card"
                                    >


                                        <!-- CUSTOMER -->

                                        <div
                                            class="
                                                review-customer
                                            "
                                        >

                                            ${
                                                customerImage
                                                ?

                                                `

                                                <img
                                                    class="
                                                        review-avatar
                                                    "
                                                    src="${escapeAttribute(
                                                        customerImage
                                                    )}"
                                                    alt="${escapeAttribute(
                                                        name
                                                    )}"
                                                    loading="lazy"
                                                    onerror="
                                                        this.style.display='none';
                                                        this.nextElementSibling.style.display='flex';
                                                    "
                                                >

                                                <div
                                                    class="
                                                        review-avatar
                                                        review-avatar-empty
                                                    "
                                                    style="
                                                        display:none;
                                                    "
                                                >

                                                    ${escapeHtml(
                                                        name
                                                            .charAt(
                                                                0
                                                            )
                                                            .toUpperCase()
                                                    )}

                                                </div>

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
                                                        name
                                                            .charAt(
                                                                0
                                                            )
                                                            .toUpperCase()
                                                    )}

                                                </div>

                                                `
                                            }


                                            <div
                                                class="
                                                    review-customer-info
                                                "
                                            >

                                                <h3
                                                    class="review-name"
                                                >

                                                    ${escapeHtml(
                                                        name
                                                    )}

                                                </h3>


                                                <div
                                                    class="
                                                        review-stars
                                                    "
                                                >

                                                    ${renderStars(
                                                        rating
                                                    )}

                                                </div>

                                            </div>

                                        </div>


                                        <!-- REVIEW TEXT -->

                                        <p
                                            class="
                                                review-text
                                            "
                                        >

                                            ${escapeHtml(
                                                reviewText
                                            )}

                                        </p>


                                        <!-- CUSTOMER PRODUCT PHOTO -->

                                        ${
                                            customerProductImage
                                            ?

                                            `

                                            <div
                                                class="
                                                    review-product-image
                                                "
                                            >

                                                <img
                                                    src="${escapeAttribute(
                                                        customerProductImage
                                                    )}"
                                                    alt="Customer product photo"
                                                    loading="lazy"
                                                    onerror="
                                                        this.parentElement.style.display='none';
                                                    "
                                                >

                                            </div>

                                            `

                                            :

                                            ""
                                        }


                                        <!-- PRODUCT NAME -->

                                        ${
                                            productName
                                            ?

                                            `

                                            <div
                                                class="
                                                    review-product-name
                                                "
                                            >

                                                ${escapeHtml(
                                                    productName
                                                )}

                                            </div>

                                            `

                                            :

                                            ""
                                        }

                                    </article>

                                `;

                            }
                        ).join("")
                    }

                </div>


                ${
                    reviews.length > 1
                    ?

                    `

                    <div
                        class="
                            carousel-dots
                            review-dots
                        "
                    >

                        ${
                            reviews.map(
                                (
                                    _,
                                    index
                                ) => `

                                    <span
                                        class="${
                                            index === 0
                                            ?
                                            "active"
                                            :
                                            ""
                                        }"
                                    ></span>

                                `
                            ).join("")
                        }

                    </div>

                    `

                    :

                    ""
                }

            </div>

        `;


        initHorizontalCarousel(
            container,
            ".review-carousel"
        );

    }

    catch(error){

        console.error(
            "Review carousel error:",
            error
        );


        container.remove();

    }

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
                Number(
                    stars
                ) || 0
            )
        );


    return (
        "★".repeat(
            rating
        )
        +
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


    if(
        section.background
    ){

        container.style.background =
            section.background;

    }


    if(
        section.backgroundColor
    ){

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
        () => {

            updateCarouselDots(
                carousel,
                container
            );

        },
        {
            passive:true
        }
    );


    /*==================================================
    INITIAL DOT UPDATE
    ==================================================*/

    requestAnimationFrame(
        () => {

            updateCarouselDots(
                carousel,
                container
            );

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


    if(
        !dots.length
    ){

        return;

    }


    const max =
        carousel.scrollWidth -
        carousel.clientWidth;


    if(
        max <= 0
    ){

        return;

    }


    const progress =
        carousel.scrollLeft /
        max;


    const index =
        Math.round(
            progress *
            (
                dots.length -
                1
            )
        );


    dots.forEach(
        (
            dot,
            i
        ) => {

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

    if(
        !value
    ){

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


    /*==================================================
    SUPPORT FIRESTORE TIMESTAMP-LIKE OBJECTS
    ==================================================*/

    if(
        value.seconds !== undefined
    ){

        return (
            Number(
                value.seconds
            ) *
            1000
        )
        +
        Math.floor(
            Number(
                value.nanoseconds ||
                0
            ) /
            1000000
        );

    }


    /*==================================================
    SUPPORT DATE STRING
    ==================================================*/

    if(
        typeof value ===
        "string"
    ){

        const parsed =
            Date.parse(
                value
            );


        return Number.isNaN(
            parsed
        )
        ?
        0
        :
        parsed;

    }


    return 0;

}


/*==================================================
LOADER
==================================================*/

function showLoader(){

    if(
        loader
    ){

        loader.classList.remove(
            "hidden"
        );

    }

}


function hideLoader(){

    if(
        loader
    ){

        loader.classList.add(
            "hidden"
        );

    }

}


/*==================================================
ESCAPE HTML
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


/*==================================================
ESCAPE ATTRIBUTE
==================================================*/

function escapeAttribute(
    value
){

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
