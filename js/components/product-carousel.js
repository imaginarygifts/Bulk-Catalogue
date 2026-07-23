/*==================================================
    PRODUCT CAROUSEL COMPONENT
==================================================*/

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "../firebase.js";

import { createProductCard } from "./product-card.js";
import { createCarousel } from "./carousel.js";

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

    const products =
        await loadProducts(section);

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
    LOAD PRODUCTS
==================================================*/

async function loadProducts(section){

    const snapshot =
        await getDocs(collection(db,"products"));

    let products =
        snapshot.docs.map(doc=>({

            id:doc.id,

            ...doc.data()

        }));

    switch(section.filterType){

        case "category":

            products = products.filter(product=>

                product.categoryId===section.categoryId

            );

            break;

        case "subcategory":

            products = products.filter(product=>

                product.subCategoryId===section.subCategoryId

            );

            break;

        case "tag":

            products = products.filter(product=>

                (product.tags || []).includes(section.tag)

            );

            break;

        case "manual":

            products = products.filter(product=>

                (section.productIds || []).includes(product.id)

            );

            break;

        case "latest":

            products.sort(

                (a,b)=>

                (b.createdAt?.seconds || 0)

                -

                (a.createdAt?.seconds || 0)

            );

            break;

        case "bestseller":

            products = products.filter(product=>

                product.isBestseller

            );

            break;

    }

    return products.slice(

        0,

        section.limit || 10

    );

}