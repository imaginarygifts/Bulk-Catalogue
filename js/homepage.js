/*==================================================
    HOMEPAGE
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


        /*
            Only published sections
        */

        sections =
            sections.filter(
                section =>
                    section.published !== false
            );


        /*
            Sort by order
        */

        sections.sort(
            (a,b) =>
                Number(a.order || 0) -
                Number(b.order || 0)
        );


        homepage.innerHTML = "";


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


        /*
            Render sections one by one
        */

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


    /*
        Background color
    */

    if(section.backgroundColor){

        wrapper.style.backgroundColor =
            section.backgroundColor;

    }


    /*
        Section type
    */

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
    HEADING
==================================================*/

function renderHeading(
    container,
    section
){

    container.innerHTML = `

        <div class="home-container heading-section">

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
        section.slides || [];


    if(!slides.length){

        container.innerHTML = "";

        return;

    }


    container.innerHTML = `

        <div class="home-banner">

            <div class="banner-track">

                ${
                    slides.map(
                        (slide,index) => `

                        <div
                            class="banner-slide
                            ${index === 0 ? "active" : ""}"
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
                                        slide.title || ""
                                    )}"
                                >
                                `
                                :
                                ""
                            }


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
                    aria-label="Previous"
                >
                    ‹
                </button>

                <button
                    class="banner-next"
                    type="button"
                    aria-label="Next"
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
            (slide,i) => {

                slide.classList.toggle(
                    "active",
                    i === current
                );

            }
        );


        dots.forEach(
            (dot,i) => {

                dot.classList.toggle(
                    "active",
                    i === current
                );

            }
        );

    }


    function next(){

        showSlide(
            current + 1
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
                section.interval || 5000
            );


        timer =
            setInterval(
                next,
                interval
            );

    }


    function stop(){

        if(timer){

            clearInterval(timer);

            timer = null;

        }

    }


    const nextButton =
        container.querySelector(
            ".banner-next"
        );


    const prevButton =
        container.querySelector(
            ".banner-prev"
        );


    nextButton?.addEventListener(
        "click",
        () => {

            stop();

            next();

            start();

        }
    );


    prevButton?.addEventListener(
        "click",
        () => {

            stop();

            showSlide(
                current - 1
            );

            start();

        }
    );


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

                id: docSnap.id,

                ...docSnap.data()

            })
        );


    /*
        --------------------------------------------
        CATEGORY FILTER
        --------------------------------------------
    */

    if(section.categoryId){

        products =
            products.filter(
                product => {

                    /*
                        Main category
                    */

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


                    /*
                        Subcategory
                    */

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


                    /*
                        Fallback
                    */

                    return (

                        product.categoryId ===
                        section.categoryId

                    );

                }
            );

    }


    /*
        --------------------------------------------
        TAG FILTER
        --------------------------------------------
    */

    if(
        Array.isArray(section.tags) &&
        section.tags.length
    ){

        products =
            products.filter(
                product => {

                    const productTags =
                        getProductTags(
                            product
                        );


                    /*
                        Product must have
                        at least one selected tag
                    */

                    return section.tags.some(
                        selectedTag =>

                            productTags.includes(
                                String(
                                    selectedTag
                                ).toLowerCase()
                            )

                    );

                }
            );

    }


    /*
        --------------------------------------------
        SPECIFIC PRODUCT FILTER
        --------------------------------------------
    */

    if(
        Array.isArray(section.productIds) &&
        section.productIds.length
    ){

        const selectedIds =
            new Set(
                section.productIds
            );


        products =
            products.filter(
                product =>
                    selectedIds.has(
                        product.id
                    )
            );

    }


    /*
        --------------------------------------------
        LIMIT
        --------------------------------------------
    */

    const limit =
        Number(
            section.limit || 10
        );


    products =
        products.slice(
            0,
            limit
        );


    /*
        --------------------------------------------
        EMPTY
        --------------------------------------------
    */

    if(!products.length){

        container.innerHTML = `

            <div class="home-container">

                ${
                    section.title
                    ?
                    `
                    <div class="carousel-heading">

                        <div>

                            <h2>
                                ${escapeHtml(
                                    section.title
                                )}
                            </h2>

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

            </div>

        `;

        return;

    }


    /*
        --------------------------------------------
        HTML
        --------------------------------------------
    */

    container.innerHTML = `

        <div class="home-container">

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
                    <div class="product-price">

                        ₹${escapeHtml(
                            String(price)
                        )}

                    </div>
                    `
                    :
                    ""
                }

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


        if(first?.url){

            return first.url;

        }


        if(first?.src){

            return first.src;

        }

    }


    if(product.image){

        return product.image;

    }


    if(product.thumbnail){

        return product.thumbnail;

    }


    return "";

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


function getProductLink(
    product
){

    if(product.link){

        return product.link;

    }


    if(product.slug){

        return `product.html?id=${encodeURIComponent(
            product.id
        )}`;

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
        section.images || [];


    if(!images.length){

        return;

    }


    container.innerHTML = `

        <div class="home-container">

            ${
                section.title
                ?
                `
                <div class="carousel-heading">

                    <div>

                        <h2>
                            ${escapeHtml(
                                section.title
                            )}
                        </h2>

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
                        (image,index) => {

                            const content = `

                                <img
                                    src="${escapeAttribute(
                                        image.src || ""
                                    )}"
                                    alt="${escapeAttribute(
                                        image.title || ""
                                    )}"
                                    loading="lazy"
                                >

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
                                        class="image-carousel-item"
                                        href="${escapeAttribute(
                                            image.link
                                        )}"
                                    >

                                        ${content}

                                    </a>

                                `;

                            }


                            return `

                                <div
                                    class="image-carousel-item"
                                >

                                    ${content}

                                </div>

                            `;

                        }
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
    YOUTUBE CAROUSEL
==================================================*/

function renderYoutubeCarousel(
    container,
    section
){

    const videos =
        section.videos || [];


    if(!videos.length){

        return;

    }


    container.innerHTML = `

        <div class="home-container">

            ${
                section.title
                ?
                `
                <div class="carousel-heading">

                    <div>

                        <h2>
                            ${escapeHtml(
                                section.title
                            )}
                        </h2>

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
                        video => {

                            const embed =
                                getYoutubeEmbedUrl(
                                    video.url
                                );


                            if(!embed){

                                return "";

                            }


                            return `

                                <div
                                    class="youtube-item"
                                >

                                    <iframe
                                        src="${escapeAttribute(
                                            embed
                                        )}"
                                        title="${escapeAttribute(
                                            video.title ||
                                            "YouTube video"
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

function getYoutubeEmbedUrl(
    url
){

    if(!url){

        return "";

    }


    try{

        const parsed =
            new URL(url);


        /*
            Shorts
            /shorts/VIDEO_ID
        */

        if(
            parsed.pathname.startsWith(
                "/shorts/"
            )
        ){

            const id =
                parsed.pathname
                    .split("/shorts/")[1]
                    .split("/")[0];


            if(id){

                return `https://www.youtube.com/embed/${id}`;

            }

        }


        /*
            Normal watch URL
        */

        if(
            parsed.hostname.includes(
                "youtube.com"
            ) &&
            parsed.searchParams.get("v")
        ){

            return `https://www.youtube.com/embed/${
                parsed.searchParams.get("v")
            }`;

        }


        /*
            youtu.be
        */

        if(
            parsed.hostname ===
            "youtu.be"
        ){

            const id =
                parsed.pathname
                    .replace("/", "");


            if(id){

                return `https://www.youtube.com/embed/${id}`;

            }

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
    REVIEW CAROUSEL
==================================================*/

function renderReviewCarousel(
    container,
    section
){

    const reviews =
        section.reviews || [];


    if(!reviews.length){

        return;

    }


    const limit =
        Number(
            section.limit || 10
        );


    const visibleReviews =
        reviews.slice(
            0,
            limit
        );


    container.innerHTML = `

        <div class="home-container">

            ${
                section.title
                ?
                `
                <div class="carousel-heading">

                    <div>

                        <h2>
                            ${escapeHtml(
                                section.title
                            )}
                        </h2>

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
                    visibleReviews.map(
                        review => `

                        <div
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
                                        review.name || ""
                                    )}"
                                    loading="lazy"
                                >
                                `
                                :
                                ""
                            }


                            <div
                                class="review-stars"
                            >

                                ${renderStars(
                                    review.stars || 5
                                )}

                            </div>


                            ${
                                review.text
                                ?
                                `
                                <p
                                    class="review-text"
                                >
                                    ${escapeHtml(
                                        review.text
                                    )}
                                </p>
                                `
                                :
                                ""
                            }


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

                        </div>

                    `
                    ).join("")
                }

            </div>

        </div>

    `;


    initHorizontalCarousel(
        container,
        ".review-carousel"
    );

}


/*==================================================
    REVIEW STARS
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


    let html = "";


    for(
        let i = 1;
        i <= 5;
        i++
    ){

        html +=
            i <= rating
            ? "★"
            : "☆";

    }


    return html;

}


/*==================================================
    SPACER
==================================================*/

function renderSpacer(
    container,
    section
){

    container.className =
        "home-section home-section-spacer";


    container.style.height =
        `${Number(
            section.height || 40
        )}px`;


    /*
        Spacer's old background field
    */

    if(section.background){

        container.style.background =
            section.background;

    }


    /*
        New common background field
    */

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


    /*
        Native horizontal scrolling
        gives us a mobile-friendly
        carousel without another library.
    */

    carousel.style.overflowX =
        "auto";

    carousel.style.scrollBehavior =
        "smooth";

    carousel.style.webkitOverflowScrolling =
        "touch";

}


/*==================================================
    LOADER
==================================================*/

function showLoader(){

    if(!loader){

        return;

    }


    loader.classList.remove(
        "hidden"
    );

}


function hideLoader(){

    if(!loader){

        return;

    }


    loader.classList.add(
        "hidden"
    );

}


/*==================================================
    HTML ESCAPE
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
    EXPORTS
==================================================*/

export {
    loadHomepage,
    renderSection
};
