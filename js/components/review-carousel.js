/*==================================================
    REVIEW CAROUSEL COMPONENT
==================================================*/

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { db } from "../firebase.js";

import { createCarousel } from "./carousel.js";

/*==================================================
    RENDER REVIEW CAROUSEL
==================================================*/

export async function renderReviewCarousel(container, section){

    const wrapper = document.createElement("section");

    wrapper.className = "review-carousel-section";

    wrapper.innerHTML = `

<div class="section-header">

    <div>

        <h2>

            ${section.title || "Customer Reviews"}

        </h2>

        <p>

            ${section.subtitle || ""}

        </p>

    </div>

</div>

<div class="carousel-wrapper">

    <button class="carousel-arrow left">

        ❮

    </button>

    <div class="review-carousel">

    </div>

    <button class="carousel-arrow right">

        ❯

    </button>

</div>

`;

    container.appendChild(wrapper);

    const carousel =
        wrapper.querySelector(".review-carousel");

    /*------------------------------------------
        USE REVIEWS FROM HOMEPAGE
    ------------------------------------------*/

    let reviews =
        section.reviews || [];

    /*------------------------------------------
        FALLBACK TO FIRESTORE
    ------------------------------------------*/

    if(reviews.length===0){

        reviews = await loadReviews();

    }

    /*------------------------------------------
        LIMIT
    ------------------------------------------*/

    reviews = reviews.slice(

        0,

        section.limit || 10

    );

    /*------------------------------------------
        RENDER
    ------------------------------------------*/

    reviews.forEach(review=>{

        carousel.appendChild(

            createReviewCard(review)

        );

    });

    createCarousel({

        container:carousel,

        leftButton:wrapper.querySelector(".left"),

        rightButton:wrapper.querySelector(".right"),

        autoPlay:section.autoPlay || true,

        interval:section.interval || 5000,

        scrollAmount:340

    });

}

/*==================================================
    REVIEW CARD
==================================================*/

function createReviewCard(review){

    const card =
        document.createElement("div");

    card.className =
        "review-card";

    card.innerHTML = `

<div class="review-header">

    <img

    src="${review.image || "assets/images/user.png"}"

    class="review-avatar"

    alt="${review.name || "Customer"}">

    <div>

        <h3>

            ${review.name || "Customer"}

        </h3>

        <div class="review-stars">

            ${renderStars(review.rating || 5)}

        </div>

    </div>

</div>

<p class="review-message">

    ${review.message || ""}

</p>

${
review.product

?

`

<div class="review-product">

${review.product}

</div>

`

:

""

}

`;

    return card;

}

/*==================================================
    STARS
==================================================*/

function renderStars(rating){

    let stars = "";

    for(let i=1;i<=5;i++){

        stars +=

        i<=rating

        ?

        "★"

        :

        "☆";

    }

    return stars;

}

/*==================================================
    LOAD REVIEWS (Fallback)
==================================================*/

async function loadReviews(){

    const snapshot = await getDocs(

        collection(

            db,

            "reviews"

        )

    );

    return snapshot.docs.map(doc=>({

        id:doc.id,

        ...doc.data()

    }));

}