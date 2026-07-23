/*==================================================
    YOUTUBE CAROUSEL COMPONENT
==================================================*/

import { createCarousel } from "./carousel.js";

export function renderYoutubeCarousel(container, section){

    const wrapper = document.createElement("section");

    wrapper.className = "youtube-carousel-section";

    wrapper.innerHTML = `

<div class="section-header">

    <div>

        <h2>

            ${section.title || "Watch Our Videos"}

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

    <div class="youtube-carousel">

    </div>

    <button class="carousel-arrow right">

        ❯

    </button>

</div>

`;

    container.appendChild(wrapper);

    const carousel =
        wrapper.querySelector(".youtube-carousel");

    const videos =
        section.videos || [];

    videos.forEach(video=>{

        carousel.appendChild(

            createVideoCard(video)

        );

    });

    createCarousel({

        container:carousel,

        leftButton:wrapper.querySelector(".left"),

        rightButton:wrapper.querySelector(".right"),

        autoPlay:section.autoPlay || false,

        interval:section.interval || 5000,

        scrollAmount:340

    });

}

/*==================================================
    VIDEO CARD
==================================================*/

function createVideoCard(video){

    const card =
        document.createElement("div");

    card.className =
        "youtube-card";

    const videoId =
        getVideoId(video.url);

    card.innerHTML = `

<div class="youtube-thumbnail">

<iframe

src="https://www.youtube.com/embed/${videoId}"

title="${video.title || ""}"

loading="lazy"

allowfullscreen>

</iframe>

</div>

<div class="youtube-content">

<h3>

${video.title || ""}

</h3>

${
video.description

?

`

<p>

${video.description}

</p>

`

:

""

}

</div>

`;

    return card;

}

/*==================================================
    EXTRACT VIDEO ID
==================================================*/

function getVideoId(url){

    if(!url) return "";

    const regExp =
        /^.*(?:youtu\\.be\\/|v\\/|u\\/\\w\\/|embed\\/|watch\\?v=|&v=)([^#&?]*).*/;

    const match =
        url.match(regExp);

    return match && match[1].length===11

        ? match[1]

        : "";

}