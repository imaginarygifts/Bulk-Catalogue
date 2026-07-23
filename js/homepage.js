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