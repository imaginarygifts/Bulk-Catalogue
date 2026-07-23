/*==================================================
    PRODUCT CAROUSEL
==================================================*/

import { db } from "../firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { createProductCard } from "./product-card.js";

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

            ${section.title || "Products"}

        </h2>

        <p>

            ${section.subtitle || ""}

        </p>

    </div>

    ${
        section.showViewAll

        ?

        `<a

            href="${section.viewAllLink || "#"}"

            class="view-all-btn">

            View All

        </a>`

        :

        ""

    }

</div>

<div class="carousel-wrapper">

    <button

        class="carousel-arrow left">

        ❮

    </button>

    <div

        class="product-carousel">

    </div>

    <button

        class="carousel-arrow right">

        ❯

    </button>

</div>

`;

    container.appendChild(wrapper);

    const carousel =

    wrapper.querySelector(

        ".product-carousel"

    );

    const left =

    wrapper.querySelector(

        ".left"

    );

    const right =

    wrapper.querySelector(

        ".right"

    );

    let products =

    await loadProducts();

    products =

    filterProducts(

        products,

        section

    );

    if(section.limit){

        products =

        products.slice(

            0,

            section.limit

        );

    }

    products.forEach(product=>{

        carousel.appendChild(

            createProductCard(product)

        );

    });

    left.onclick=()=>{

        carousel.scrollBy({

            left:-350,

            behavior:"smooth"

        });

    };

    right.onclick=()=>{

        carousel.scrollBy({

            left:350,

            behavior:"smooth"

        });

    };

}

/*==================================================
    LOAD PRODUCTS
==================================================*/

async function loadProducts(){

    const snap=

    await getDocs(

        collection(

            db,

            "products"

        )

    );

    return snap.docs.map(doc=>({

        id:doc.id,

        ...doc.data()

    }));

}

/*==================================================
    FILTER
==================================================*/

function filterProducts(

    products,

    section

){

    switch(section.filterType){

        case "category":

            return products.filter(

                p=>

                p.categoryId===

                section.filterValue

            );

        case "subcategory":

            return products.filter(

                p=>

                p.subCategoryId===

                section.filterValue

            );

        case "tag":

            return products.filter(

                p=>

                Array.isArray(p.tags)

                &&

                p.tags.includes(

                    section.filterValue

                )

            );

        case "manual":

            return products.filter(

                p=>

                section.productIds?.includes(

                    p.id

                )

            );

        default:

            return products;

    }

}