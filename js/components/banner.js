/*==================================================
    BANNER COMPONENT
==================================================*/

import { createCarousel } from "./carousel.js";

export function renderBanner(container, section) {

    const slides = section.slides || [];

    if (!slides.length) return;

    const banner = document.createElement("section");

    banner.className = "hero-banner";

    banner.innerHTML = `

<div class="banner-wrapper">

    <button class="carousel-arrow left">

        ❮

    </button>

    <div class="banner-track">

    </div>

    <button class="carousel-arrow right">

        ❯

    </button>

</div>

`;

    container.appendChild(banner);

    const track =
        banner.querySelector(".banner-track");

    slides.forEach(slide => {

        track.appendChild(

            createSlide(slide)

        );

    });

    createCarousel({

        container: track,

        leftButton: banner.querySelector(".left"),

        rightButton: banner.querySelector(".right"),

        autoPlay: true,

        interval: 5000,

        scrollAmount: banner.clientWidth

    });

}

/*==================================================
    BANNER SLIDE
==================================================*/

function createSlide(slide){

    const item = document.createElement("div");

    item.className = "banner-slide";

    item.innerHTML = `

<picture>

    ${
        slide.mobileImage

        ?

        `

<source

media="(max-width:768px)"

srcset="${slide.mobileImage}">

`

        :

        ""

    }

    <img

    src="${slide.desktopImage || slide.image || ""}"

    alt="${slide.heading || ""}"

    loading="lazy">

</picture>

<div class="banner-overlay">

    ${
        slide.heading

        ?

        `

<h2>

${slide.heading}

</h2>

`

        :

        ""

    }

    ${
        slide.description

        ?

        `

<p>

${slide.description}

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

href="${slide.buttonLink || "#"}"

class="banner-button">

${slide.buttonText}

</a>

`

        :

        ""

    }

</div>

`;

    return item;

}