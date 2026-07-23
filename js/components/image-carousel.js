/*==================================================
    IMAGE CAROUSEL
==================================================*/

export function renderImageCarousel(container, section){

    const carousel = document.createElement("section");

    carousel.className = "image-carousel-section";

    carousel.innerHTML = `

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

    <div class="image-carousel-wrapper">

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

    container.appendChild(carousel);

    const track =
        carousel.querySelector(".image-carousel-track");

    const left =
        carousel.querySelector(".left");

    const right =
        carousel.querySelector(".right");

    const slides =
        section.images || [];

    slides.forEach(image=>{

        track.appendChild(

            createImageCard(image)

        );

    });

    left.onclick=()=>{

        track.scrollBy({

            left:-350,

            behavior:"smooth"

        });

    };

    right.onclick=()=>{

        track.scrollBy({

            left:350,

            behavior:"smooth"

        });

    };

}

/*==================================================
    IMAGE CARD
==================================================*/

function createImageCard(image){

    const card = document.createElement("div");

    card.className="image-card";

    card.innerHTML=`

    <img

    src="${image.image}"

    loading="lazy"

    alt="${image.title || ""}">

    ${
        image.title

        ?

        `

        <div class="image-card-title">

            ${image.title}

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