/*==================================================
    BANNER COMPONENT
==================================================*/

export function renderBanner(container, section) {

    const banner = document.createElement("section");

    banner.className = "hero-banner";

    const slides = section.slides || [];

    if (slides.length === 0) {

        banner.innerHTML = `
            <div class="banner-empty">
                No Banner Added
            </div>
        `;

        container.appendChild(banner);
        return;
    }

    banner.innerHTML = `

        <div class="banner-slider">

            <div class="banner-track"></div>

            <button class="banner-arrow banner-prev">
                ❮
            </button>

            <button class="banner-arrow banner-next">
                ❯
            </button>

            <div class="banner-dots"></div>

        </div>

    `;

    container.appendChild(banner);

    const track = banner.querySelector(".banner-track");
    const dots = banner.querySelector(".banner-dots");

    slides.forEach((slide, index) => {

        const item = document.createElement("div");

        item.className = "banner-slide";

        item.innerHTML = `

            <img
                src="${slide.desktopImage || slide.image || ""}"
                alt="${slide.heading || ""}"
            >

            <div class="banner-content">

                <h2>
                    ${slide.heading || ""}
                </h2>

                <p>
                    ${slide.description || ""}
                </p>

                ${
                    slide.buttonText
                    ?
                    `<a
                        href="${slide.buttonLink || "#"}"
                        class="banner-button">

                        ${slide.buttonText}

                    </a>`
                    :
                    ""
                }

            </div>

        `;

        track.appendChild(item);

        const dot = document.createElement("span");

        dot.className = "banner-dot";

        dot.dataset.index = index;

        dots.appendChild(dot);

    });

    initializeBanner(banner);

}

/*==================================================
    SLIDER
==================================================*/

function initializeBanner(banner) {

    const track =
        banner.querySelector(".banner-track");

    const slides =
        banner.querySelectorAll(".banner-slide");

    const dots =
        banner.querySelectorAll(".banner-dot");

    const prev =
        banner.querySelector(".banner-prev");

    const next =
        banner.querySelector(".banner-next");

    let current = 0;

    function show(index) {

        if(index < 0)
            index = slides.length - 1;

        if(index >= slides.length)
            index = 0;

        current = index;

        track.style.transform =
            `translateX(-${current * 100}%)`;

        dots.forEach(dot =>
            dot.classList.remove("active")
        );

        dots[current]?.classList.add("active");

    }

    prev.onclick = () => {

        show(current - 1);

    };

    next.onclick = () => {

        show(current + 1);

    };

    dots.forEach(dot => {

        dot.onclick = () => {

            show(Number(dot.dataset.index));

        };

    });

    if(slides.length > 1){

        setInterval(() => {

            show(current + 1);

        },5000);

    }

    show(0);

}