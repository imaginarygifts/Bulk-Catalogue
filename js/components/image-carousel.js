/*==================================================
    IMAGE CAROUSEL COMPONENT
==================================================*/

import { createCarousel } from "./carousel.js";

export function renderImageCarousel(container, section){

    const wrapper = document.createElement("section");

    wrapper.className = "image-carousel-section";

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

</div>

<div class="carousel-wrapper">

    <button class="carousel-arrow left">

        ❮

    </button>

    <div class="image-carousel-track">

    </div>

    <button class="carousel-arrow right">

        ❯

    </button>

</div>

`;

    container.appendChild(wrapper);

    const track =
        wrapper.querySelector(".image-carousel-track");

    const images =
        section.images || [];

    images.forEach(image=>{

        track.appendChild(

            createImageCard(image)

        );

    });

    createCarousel({

        container:track,

        leftButton:wrapper.querySelector(".left"),

        rightButton:wrapper.querySelector(".right"),

        autoPlay:section.autoPlay || false,

        interval:section.interval || 4000,

        scrollAmount:320

    });

}

/*==================================================
    IMAGE CARD
==================================================*/

function createImageCard(image){

    const card =
        document.createElement("div");

    card.className =
        "image-card";

    card.innerHTML = `

<img

src="${image.image || ""}"

loading="lazy"

alt="${image.title || ""}"

class="image-card-image">

${
image.title

?

`

<div class="image-card-overlay">

<h3>

${image.title}

</h3>

</div>

`

:

""

}

`;

    if(image.link){

        card.style.cursor="pointer";

        card.onclick=()=>{

            window.location.href=

            image.link;

        };

    }

    return card;

}