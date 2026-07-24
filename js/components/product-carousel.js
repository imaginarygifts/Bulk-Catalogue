/*==================================================
    PRODUCT CAROUSEL COMPONENT
==================================================*/

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { db } from "../firebase.js";

import { createProductCard } from "./product-card.js";
import { createCarousel } from "./carousel.js";

/*==================================================
    RENDER PRODUCT CAROUSEL
==================================================*/

export async function renderProductCarousel(container, section){

    const wrapper = document.createElement("section");

    wrapper.className = "product-carousel-section";

    wrapper.innerHTML = `

<div class="section-header">

    <div>

        <h2>

            ${section.title || ""}

        </h2>

        <p>

            ${section.subtitle || ""}

        </p>

    </div>

    ${
        section.viewAllLink
        ?
        `
        <a
            href="${section.viewAllLink}"
            class="view-all-btn">

            View All

        </a>
        `
        :
        ""
    }

</div>

<div class="carousel-wrapper">

    <button class="carousel-arrow left">

        ❮

    </button>

    <div class="product-carousel">

    </div>

    <button class="carousel-arrow right">

        ❯

    </button>

</div>

`;

    container.appendChild(wrapper);

    const carousel =
        wrapper.querySelector(".product-carousel");

    /*------------------------------------------
        USE PRODUCTS PASSED FROM HOMEPAGE
    ------------------------------------------*/

    let products =
        section.products || [];

    /*------------------------------------------
        FALLBACK TO FIRESTORE
    ------------------------------------------*/

    if(products.length===0){

        products = await loadProducts();

    }

    /*------------------------------------------
        FILTER PRODUCTS
    ------------------------------------------*/

    products = filterProducts(

        products,

        section

    );

    /*------------------------------------------
        LIMIT
    ------------------------------------------*/

    products = products.slice(

        0,

        section.limit || 10

    );

    /*------------------------------------------
        RENDER
    ------------------------------------------*/

    products.forEach(product=>{

        carousel.appendChild(

            createProductCard(product)

        );

    });

    createCarousel({

        container:carousel,

        leftButton:wrapper.querySelector(".left"),

        rightButton:wrapper.querySelector(".right"),

        autoPlay:section.autoPlay || false,

        interval:section.interval || 5000,

        scrollAmount:320

    });

}

/*==================================================
    FILTER PRODUCTS
==================================================*/

function filterProducts(products, section){

    let filtered = [...products];

    /*------------------------------------------
        CATEGORY
    ------------------------------------------*/

    if(section.categoryId){

        if(section.categoryType==="main"){

            filtered = filtered.filter(product=>

                product.categoryId===section.categoryId

            );

        }

        else if(section.categoryType==="sub"){

            filtered = filtered.filter(product=>

                product.subCategoryId===section.categoryId

            );

        }

    }

    /*------------------------------------------
        TAGS
    ------------------------------------------*/

    if(section.tags?.length){

        filtered = filtered.filter(product=>

            section.tags.some(tag=>

                (product.tags || []).includes(tag)

            )

        );

    }

    /*------------------------------------------
        BESTSELLER
    ------------------------------------------*/

    if(section.filterType==="bestseller"){

        filtered = filtered.filter(product=>

            product.isBestseller

        );

    }

    /*------------------------------------------
        MANUAL
    ------------------------------------------*/

    if(section.filterType==="manual"){

        filtered = filtered.filter(product=>

            (section.productIds || []).includes(product.id)

        );

    }

    /*------------------------------------------
        LATEST
    ------------------------------------------*/

    if(section.filterType==="latest"){

        filtered.sort((a,b)=>

            (b.createdAt || 0) -

            (a.createdAt || 0)

        );

    }

    return filtered;

}

/*==================================================
    FALLBACK FIRESTORE LOAD
==================================================*/

async function loadProducts(){

    const snapshot = await getDocs(

        collection(

            db,

            "products"

        )

    );

    return snapshot.docs.map(doc=>({

        id:doc.id,

        ...doc.data()

    }));

}