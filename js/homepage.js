/*==================================================
    HOMEPAGE
==================================================*/

import { db } from "./firebase.js";

import {

    collection,
    getDocs,
    query,
    where,
    orderBy

} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { renderBanner } from "./components/banner.js";

import { renderHeading } from "./components/heading.js";

import { renderProductCarousel } from "./components/product-carousel.js";

import { renderImageCarousel } from "./components/image-carousel.js";

import { renderYoutubeCarousel } from "./components/youtube-carousel.js";

import { renderReviewCarousel } from "./components/review-carousel.js";

import { renderSpacer } from "./components/spacer.js";

/*==================================================
    ELEMENTS
==================================================*/

const homepage =
document.getElementById("homepage");

const scrollTopBtn =
document.getElementById("scrollTop");

/*==================================================
    DATA
==================================================*/

let homepageSections=[];

let products=[];

let categories=[];

let reviews=[];

/*==================================================
    INIT
==================================================*/

document.addEventListener(

    "DOMContentLoaded",

    initHomepage

);

/*==================================================
    INIT HOMEPAGE
==================================================*/

async function initHomepage(){

    try{

        showLoader();

        await Promise.all([

            loadHomepageSections(),

            loadProducts(),

            loadCategories(),

            loadReviews()

        ]);

        renderHomepage();

        initializeScrollButton();

    }

    catch(error){

        console.error(error);

        showError(error);

    }

    finally{

        hideLoader();

    }

}

/*==================================================
    LOAD HOMEPAGE SECTIONS
==================================================*/

async function loadHomepageSections(){

    const q=query(

        collection(

            db,

            "homepageSections"

        ),

        where(

            "published",

            "==",

            true

        ),

        orderBy("order")

    );

    const snapshot=

    await getDocs(q);

    homepageSections=

    snapshot.docs.map(doc=>({

        id:doc.id,

        ...doc.data()

    }));

}

/*==================================================
    LOAD PRODUCTS
==================================================*/

async function loadProducts(){

    const snapshot=

    await getDocs(

        collection(

            db,

            "products"

        )

    );

    products=

    snapshot.docs.map(doc=>({

        id:doc.id,

        ...doc.data()

    }));

}

/*==================================================
    LOAD CATEGORIES
==================================================*/

async function loadCategories(){

    const snapshot=

    await getDocs(

        collection(

            db,

            "categories"

        )

    );

    categories=

    snapshot.docs.map(doc=>({

        id:doc.id,

        ...doc.data()

    }));

}

/*==================================================
    LOAD REVIEWS
==================================================*/

async function loadReviews(){

    try{

        const snapshot=

        await getDocs(

            collection(

                db,

                "reviews"

            )

        );

        reviews=

        snapshot.docs.map(doc=>({

            id:doc.id,

            ...doc.data()

        }));

    }

    catch(error){

        reviews=[];

    }

}


/*==================================================
    RENDER HOMEPAGE
==================================================*/

async function renderHomepage(){

    homepage.innerHTML = "";

    if(homepageSections.length===0){

        showEmptyHomepage();

        return;

    }

    for(const section of homepageSections){

        await renderSection(section);

    }

}

/*==================================================
    RENDER SINGLE SECTION
==================================================*/

async function renderSection(section){

    switch(section.type){

        case "banner":

            renderBanner(

                homepage,

                section

            );

            break;

        case "heading":

            renderHeading(

                homepage,

                section

            );

            break;

        case "productCarousel":

            await renderProductCarousel(

                homepage,

                {

                    ...section,

                    products

                }

            );

            break;

        case "imageCarousel":

            renderImageCarousel(

                homepage,

                section

            );

            break;

        case "youtubeCarousel":

            renderYoutubeCarousel(

                homepage,

                section

            );

            break;

        case "reviewCarousel":

            renderReviewCarousel(

                homepage,

                {

                    ...section,

                    reviews

                }

            );

            break;

        case "spacer":

            renderSpacer(

                homepage,

                section

            );

            break;

        default:

            console.warn(

                "Unknown section:",

                section.type

            );

    }

}

/*==================================================
    EMPTY HOMEPAGE
==================================================*/

function showEmptyHomepage(){

    homepage.innerHTML = `

<div class="homepage-empty">

    <h2>

        Homepage is Empty

    </h2>

    <p>

        Add sections from the Homepage Builder.

    </p>

</div>

`;

}

/*==================================================
    ERROR
==================================================*/

function showError(error){

    homepage.innerHTML = `

<div class="homepage-error">

    <h2>

        Something went wrong

    </h2>

    <p>

        ${error.message}

    </p>

</div>

`;

}


/*==================================================
    LOADER
==================================================*/

function showLoader(){

    homepage.innerHTML = `

<div class="homepage-loader">

    <div class="loader-spinner"></div>

    <p>

        Loading Homepage...

    </p>

</div>

`;

}

function hideLoader(){

    const loader =

    homepage.querySelector(

        ".homepage-loader"

    );

    if(loader){

        loader.remove();

    }

}

/*==================================================
    SCROLL TO TOP
==================================================*/

function initializeScrollButton(){

    if(!scrollTopBtn) return;

    window.addEventListener(

        "scroll",

        ()=>{

            if(window.scrollY>400){

                scrollTopBtn.classList.add(

                    "show"

                );

            }

            else{

                scrollTopBtn.classList.remove(

                    "show"

                );

            }

        }

    );

    scrollTopBtn.addEventListener(

        "click",

        ()=>{

            window.scrollTo({

                top:0,

                behavior:"smooth"

            });

        }

    );

}

/*==================================================
    REFRESH HOMEPAGE
==================================================*/

export async function refreshHomepage(){

    await Promise.all([

        loadHomepageSections(),

        loadProducts(),

        loadCategories(),

        loadReviews()

    ]);

    renderHomepage();

}

/*==================================================
    GET PRODUCT
==================================================*/

export function getProduct(id){

    return products.find(

        product=>product.id===id

    );

}

/*==================================================
    GET CATEGORY
==================================================*/

export function getCategory(id){

    return categories.find(

        category=>category.id===id

    );

}

/*==================================================
    GET REVIEWS
==================================================*/

export function getReviews(){

    return reviews;

}

/*==================================================
    FORMAT PRICE
==================================================*/

export function money(price){

    if(price==null) return "₹0";

    return "₹"+

    Number(price).toLocaleString(

        "en-IN"

    );

}

/*==================================================
    DISCOUNT
==================================================*/

export function getDiscount(

    original,

    sale

){

    if(

        !original ||

        !sale ||

        sale>=original

    ){

        return 0;

    }

    return Math.round(

        (

            (original-sale)

            /

            original

        )*100

    );

}

/*==================================================
    EMPTY IMAGE
==================================================*/

export function placeholderImage(){

    return

    "assets/images/placeholder.png";

}

/*==================================================
    IS MOBILE
==================================================*/

export function isMobile(){

    return window.innerWidth<=768;

}

/*==================================================
    DEBOUNCE
==================================================*/

export function debounce(

    callback,

    delay=300

){

    let timer;

    return(...args)=>{

        clearTimeout(timer);

        timer=setTimeout(

            ()=>callback(...args),

            delay

        );

    };

}

/*==================================================
    LOG
==================================================*/

function log(){

    console.log(

        "Homepage Loaded"

    );

}

log();