/* ============================================================
   CATALOGUE FRONTEND
   ============================================================

   Firestore:
   catalogues

   Features:
   - Load active catalogues
   - Colour selector
   - Size selector
   - Dynamic price
   - 3-column image gallery
   - All images visible
   - Image zoom/lightbox
   - Previous / next image
   - Linked product
   - Order Now
   ============================================================ */


import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    query,
    where,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


/* ============================================================
   STATE
   ============================================================ */

let catalogues = [];

let currentLightboxImages = [];

let currentLightboxIndex = 0;


/* ============================================================
   DOM
   ============================================================ */

const catalogueContainer =
    document.getElementById(
        "catalogueContainer"
    );


/* ============================================================
   FORMAT MONEY
   ============================================================ */

function formatMoney(value) {

    return Number(
        value || 0
    ).toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    );

}


/* ============================================================
   ESCAPE HTML
   ============================================================ */

function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* ============================================================
   ESCAPE ATTRIBUTE
   ============================================================ */

function escapeAttribute(value) {

    return escapeHtml(value);

}


/* ============================================================
   LOAD CATALOGUES
   ============================================================ */

async function loadCatalogues() {

    if (!catalogueContainer) {

        return;

    }


    try {

        let snap;


        try {

            const q =
                query(
                    collection(
                        db,
                        "catalogues"
                    ),
                    where(
                        "active",
                        "==",
                        true
                    ),
                    orderBy(
                        "order",
                        "asc"
                    )
                );

            snap =
                await getDocs(q);

        }
        catch (indexedQueryError) {

            console.warn(
                "Indexed catalogue query failed. Using fallback.",
                indexedQueryError
            );


            const q =
                query(
                    collection(
                        db,
                        "catalogues"
                    ),
                    where(
                        "active",
                        "==",
                        true
                    )
                );

            snap =
                await getDocs(q);

        }


        catalogues = [];


        snap.forEach(
            catalogueDoc => {

                catalogues.push({

                    id:
                        catalogueDoc.id,

                    ...catalogueDoc.data()

                });

            }
        );


        catalogues.sort(
            (
                a,
                b
            ) =>
                Number(
                    a.order || 0
                ) -
                Number(
                    b.order || 0
                )
        );


        renderCatalogues();

    }
    catch (error) {

        console.error(
            "Catalogue loading error:",
            error
        );


        catalogueContainer.innerHTML = `

            <div class="catalogue-error">

                <i class="fa-solid fa-circle-exclamation"></i>

                <h3>
                    Unable to load catalogue
                </h3>

                <p>
                    Please try again later.
                </p>

            </div>

        `;

    }

}


/* ============================================================
   RENDER ALL CATALOGUES
   ============================================================ */

function renderCatalogues() {

    if (!catalogueContainer) {

        return;

    }


    if (!catalogues.length) {

        catalogueContainer.innerHTML = `

            <div class="catalogue-empty">

                <i class="fa-regular fa-images"></i>

                <h3>
                    No catalogue available
                </h3>

                <p>
                    Please check again later.
                </p>

            </div>

        `;

        return;

    }


    catalogueContainer.innerHTML =
        catalogues
            .map(
                catalogue =>
                    createCatalogueHTML(
                        catalogue
                    )
            )
            .join("");


    bindCatalogueEvents();

}


/* ============================================================
   CREATE CATALOGUE HTML
   ============================================================ */

function createCatalogueHTML(
    catalogue
) {

    const colours =
        Array.isArray(
            catalogue.colours
        )
            ? catalogue.colours
            : [];


    const sizes =
        Array.isArray(
            catalogue.sizes
        )
            ? catalogue.sizes
            : [];


    const images =
        Array.isArray(
            catalogue.images
        )
            ? catalogue.images.filter(
                image =>
                    image?.imageUrl
            )
            : [];


    return `

        <section
            class="catalogue-section"
            data-catalogue-id="${escapeAttribute(
                catalogue.id
            )}"
        >

            <div class="catalogue-header">

                <h2>
                    ${escapeHtml(
                        catalogue.name ||
                        "Catalogue"
                    )}
                </h2>


                ${
                    catalogue.description
                        ? `
                            <p>
                                ${escapeHtml(
                                    catalogue.description
                                )}
                            </p>
                        `
                        : ""
                }

            </div>


            <div class="catalogue-options">

                ${
                    colours.length
                        ? `

                            <div class="catalogue-option-group">

                                <div class="catalogue-option-title">
                                    Colour
                                </div>

                                <div class="catalogue-colour-list">

                                    ${colours
                                        .map(
                                            (
                                                colour,
                                                index
                                            ) => `

                                                <button
                                                    type="button"
                                                    class="catalogue-colour-button ${
                                                        index === 0
                                                            ? "selected"
                                                            : ""
                                                    }"
                                                    data-colour-id="${escapeAttribute(
                                                        colour.id
                                                    )}"
                                                >
                                                    ${escapeHtml(
                                                        colour.name
                                                    )}
                                                </button>

                                            `
                                        )
                                        .join("")}

                                </div>

                            </div>

                        `
                        : ""
                }


                ${
                    sizes.length
                        ? `

                            <div class="catalogue-option-group">

                                <div class="catalogue-option-title">
                                    Size
                                </div>

                                <div class="catalogue-size-list">

                                    ${sizes
                                        .map(
                                            (
                                                size,
                                                index
                                            ) => `

                                                <button
                                                    type="button"
                                                    class="catalogue-size-button ${
                                                        index === 0
                                                            ? "selected"
                                                            : ""
                                                    }"
                                                    data-size-id="${escapeAttribute(
                                                        size.id
                                                    )}"
                                                >
                                                    ${escapeHtml(
                                                        size.name
                                                    )}
                                                </button>

                                            `
                                        )
                                        .join("")}

                                </div>

                            </div>

                        `
                        : ""
                }


                <div class="catalogue-price-box">

                    <span>
                        Price
                    </span>

                    <strong
                        class="catalogue-current-price"
                    >
                        ${getInitialPrice(
                            catalogue
                        )}
                    </strong>

                </div>

            </div>


            <div class="catalogue-gallery">

                ${
                    images.length
                        ? images
                            .map(
                                (
                                    image,
                                    index
                                ) => `

                                    <button
                                        type="button"
                                        class="catalogue-gallery-item"
                                        data-catalogue-id="${escapeAttribute(
                                            catalogue.id
                                        )}"
                                        data-image-index="${index}"
                                        aria-label="View image"
                                    >

                                        <img
                                            src="${escapeAttribute(
                                                image.imageUrl
                                            )}"
                                            alt="${escapeAttribute(
                                                image.alt ||
                                                catalogue.name
                                            )}"
                                            loading="lazy"
                                        >

                                    </button>

                                `
                            )
                            .join("")
                        : `

                            <div class="catalogue-gallery-empty">

                                <i class="fa-regular fa-image"></i>

                                <span>
                                    No images available
                                </span>

                            </div>

                        `
                }

            </div>

        </section>

    `;

}


/* ============================================================
   INITIAL PRICE
   ============================================================ */

function getInitialPrice(
    catalogue
) {

    const colours =
        Array.isArray(
            catalogue.colours
        )
            ? catalogue.colours
            : [];


    const sizes =
        Array.isArray(
            catalogue.sizes
        )
            ? catalogue.sizes
            : [];


    if (
        !sizes.length
    ) {

        return "₹0";

    }


    const colourId =
        colours[0]?.id || "";


    const size =
        sizes[0];


    const price =
        size?.prices?.[
            colourId
        ];


    if (
        price === undefined ||
        price === null ||
        price === ""
    ) {

        return "Price on request";

    }


    return `₹${formatMoney(price)}`;

}


/* ============================================================
   BIND EVENTS
   ============================================================ */

function bindCatalogueEvents() {

    document
        .querySelectorAll(
            ".catalogue-section"
        )
        .forEach(
            section => {

                const catalogueId =
                    section.dataset.catalogueId;


                const catalogue =
                    catalogues.find(
                        item =>
                            item.id ===
                            catalogueId
                    );


                if (!catalogue) {

                    return;

                }


                let selectedColour =
                    catalogue.colours?.[0]?.id ||
                    "";


                let selectedSize =
                    catalogue.sizes?.[0]?.id ||
                    "";


                /*
                   COLOUR
                */

                section
                    .querySelectorAll(
                        ".catalogue-colour-button"
                    )
                    .forEach(
                        button => {

                            button.addEventListener(
                                "click",
                                () => {

                                    section
                                        .querySelectorAll(
                                            ".catalogue-colour-button"
                                        )
                                        .forEach(
                                            item =>
                                                item.classList.remove(
                                                    "selected"
                                                )
                                        );


                                    button.classList.add(
                                        "selected"
                                    );


                                    selectedColour =
                                        button.dataset.colourId;


                                    updateCataloguePrice(
                                        section,
                                        catalogue,
                                        selectedColour,
                                        selectedSize
                                    );

                                }
                            );

                        }
                    );


                /*
                   SIZE
                */

                section
                    .querySelectorAll(
                        ".catalogue-size-button"
                    )
                    .forEach(
                        button => {

                            button.addEventListener(
                                "click",
                                () => {

                                    section
                                        .querySelectorAll(
                                            ".catalogue-size-button"
                                        )
                                        .forEach(
                                            item =>
                                                item.classList.remove(
                                                    "selected"
                                                )
                                        );


                                    button.classList.add(
                                        "selected"
                                    );


                                    selectedSize =
                                        button.dataset.sizeId;


                                    updateCataloguePrice(
                                        section,
                                        catalogue,
                                        selectedColour,
                                        selectedSize
                                    );

                                }
                            );

                        }
                    );


                /*
                   GALLERY
                */

                section
                    .querySelectorAll(
                        ".catalogue-gallery-item"
                    )
                    .forEach(
                        button => {

                            button.addEventListener(
                                "click",
                                () => {

                                    const index =
                                        Number(
                                            button.dataset.imageIndex
                                        );


                                    openLightbox(
                                        catalogue,
                                        index
                                    );

                                }
                            );

                        }
                    );

            }
        );

}


/* ============================================================
   UPDATE PRICE
   ============================================================ */

function updateCataloguePrice(
    section,
    catalogue,
    colourId,
    sizeId
) {

    const priceElement =
        section.querySelector(
            ".catalogue-current-price"
        );


    if (!priceElement) {

        return;

    }


    const size =
        catalogue.sizes?.find(
            item =>
                item.id ===
                sizeId
        );


    const price =
        size?.prices?.[
            colourId
        ];


    if (
        price === undefined ||
        price === null ||
        price === ""
    ) {

        priceElement.textContent =
            "Price on request";

        return;

    }


    priceElement.textContent =
        `₹${formatMoney(price)}`;

}


/* ============================================================
   LIGHTBOX
   ============================================================ */

function openLightbox(
    catalogue,
    index
) {

    currentLightboxImages =
        Array.isArray(
            catalogue.images
        )
            ? catalogue.images.filter(
                image =>
                    image?.imageUrl
            )
            : [];


    currentLightboxIndex =
        index;


    createLightbox();


    renderLightbox(
        catalogue
    );

}


/* ============================================================
   CREATE LIGHTBOX
   ============================================================ */

function createLightbox() {

    if (
        document.getElementById(
            "catalogueLightbox"
        )
    ) {

        return;

    }


    const overlay =
        document.createElement(
            "div"
        );


    overlay.id =
        "catalogueLightbox";


    overlay.className =
        "catalogue-lightbox";


    overlay.innerHTML = `

        <div
            class="catalogue-lightbox-inner"
            role="dialog"
            aria-modal="true"
        >

            <button
                type="button"
                class="catalogue-lightbox-close"
                id="catalogueLightboxClose"
                aria-label="Close"
            >
                <i class="fa-solid fa-xmark"></i>
            </button>


            <button
                type="button"
                class="catalogue-lightbox-prev"
                id="catalogueLightboxPrev"
                aria-label="Previous image"
            >
                <i class="fa-solid fa-chevron-left"></i>
            </button>


            <div class="catalogue-lightbox-image-wrap">

                <img
                    id="catalogueLightboxImage"
                    src=""
                    alt=""
                >

            </div>


            <button
                type="button"
                class="catalogue-lightbox-next"
                id="catalogueLightboxNext"
                aria-label="Next image"
            >
                <i class="fa-solid fa-chevron-right"></i>
            </button>


            <div
                id="catalogueLightboxInfo"
                class="catalogue-lightbox-info"
            ></div>


            <button
                type="button"
                id="catalogueLightboxOrder"
                class="catalogue-lightbox-order"
            >

                <i class="fa-solid fa-cart-shopping"></i>

                <span>
                    Order Now
                </span>

            </button>

        </div>

    `;


    document.body.appendChild(
        overlay
    );


    $("catalogueLightboxClose")
        ?.addEventListener(
            "click",
            closeLightbox
        );


    $("catalogueLightboxPrev")
        ?.addEventListener(
            "click",
            () => {

                changeLightboxImage(
                    -1
                );

            }
        );


    $("catalogueLightboxNext")
        ?.addEventListener(
            "click",
            () => {

                changeLightboxImage(
                    1
                );

            }
        );


    overlay.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                overlay
            ) {

                closeLightbox();

            }

        }
    );


    $("catalogueLightboxOrder")
        ?.addEventListener(
            "click",
            openLinkedProduct
        );

}


/* ============================================================
   RENDER LIGHTBOX
   ============================================================ */

function renderLightbox(
    catalogue
) {

    const image =
        currentLightboxImages[
            currentLightboxIndex
        ];


    if (!image) {

        return;

    }


    const imageElement =
        $("catalogueLightboxImage");


    if (imageElement) {

        imageElement.src =
            image.imageUrl;

        imageElement.alt =
            image.alt ||
            catalogue.name ||
            "Catalogue image";

    }


    const info =
        $("catalogueLightboxInfo");


    if (info) {

        info.innerHTML = `

            <strong>
                ${escapeHtml(
                    catalogue.name ||
                    ""
                )}
            </strong>

            ${
                image.alt
                    ? `
                        <span>
                            ${escapeHtml(
                                image.alt
                            )}
                        </span>
                    `
                    : ""
            }

        `;

    }


    const prev =
        $("catalogueLightboxPrev");


    const next =
        $("catalogueLightboxNext");


    if (prev) {

        prev.style.display =
            currentLightboxImages.length > 1
                ? "flex"
                : "none";

    }


    if (next) {

        next.style.display =
            currentLightboxImages.length > 1
                ? "flex"
                : "none";

    }


    const orderButton =
        $("catalogueLightboxOrder");


    if (orderButton) {

        orderButton.style.display =
            image.productId
                ? "flex"
                : "none";

    }


    const lightbox =
        $("catalogueLightbox");


    if (lightbox) {

        lightbox.classList.add(
            "open"
        );

        document.body.classList.add(
            "catalogue-lightbox-open"
        );

    }

}


/* ============================================================
   CHANGE IMAGE
   ============================================================ */

function changeLightboxImage(
    direction
) {

    if (
        !currentLightboxImages.length
    ) {

        return;

    }


    currentLightboxIndex +=
        direction;


    if (
        currentLightboxIndex < 0
    ) {

        currentLightboxIndex =
            currentLightboxImages.length - 1;

    }


    if (
        currentLightboxIndex >=
        currentLightboxImages.length
    ) {

        currentLightboxIndex =
            0;

    }


    const image =
        currentLightboxImages[
            currentLightboxIndex
        ];


    const info =
        $("catalogueLightboxInfo");


    if (info) {

        /*
           We don't have the catalogue object
           here, so only update image-related
           information.
        */

        info.innerHTML = `
            ${
                image?.alt
                    ? `
                        <span>
                            ${escapeHtml(
                                image.alt
                            )}
                        </span>
                    `
                    : ""
            }
        `;

    }


    const imageElement =
        $("catalogueLightboxImage");


    if (imageElement && image) {

        imageElement.src =
            image.imageUrl;

        imageElement.alt =
            image.alt ||
            "Catalogue image";

    }


    const orderButton =
        $("catalogueLightboxOrder");


    if (orderButton) {

        orderButton.style.display =
            image?.productId
                ? "flex"
                : "none";

    }

}


/* ============================================================
   OPEN LINKED PRODUCT
   ============================================================ */

function openLinkedProduct() {

    const image =
        currentLightboxImages[
            currentLightboxIndex
        ];


    if (
        !image?.productId
    ) {

        return;

    }


    const url =
        `product?id=${encodeURIComponent(
            image.productId
        )}`;


    window.location.href =
        url;

}


/* ============================================================
   CLOSE LIGHTBOX
   ============================================================ */

function closeLightbox() {

    const lightbox =
        document.getElementById(
            "catalogueLightbox"
        );


    if (!lightbox) {

        return;

    }


    lightbox.classList.remove(
        "open"
    );


    document.body.classList.remove(
        "catalogue-lightbox-open"
    );

}


/* ============================================================
   KEYBOARD
   ============================================================ */

document.addEventListener(
    "keydown",
    event => {

        const lightbox =
            document.getElementById(
                "catalogueLightbox"
            );


        if (
            !lightbox ||
            !lightbox.classList.contains(
                "open"
            )
        ) {

            return;

        }


        if (
            event.key ===
            "Escape"
        ) {

            closeLightbox();

        }


        if (
            event.key ===
            "ArrowLeft"
        ) {

            changeLightboxImage(
                -1
            );

        }


        if (
            event.key ===
            "ArrowRight"
        ) {

            changeLightboxImage(
                1
            );

        }

    }
);


/* ============================================================
   INITIALIZE
   ============================================================ */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        loadCatalogues,
        {
            once: true
        }
    );

}
else {

    loadCatalogues();

}


/* ============================================================
   GLOBALS
   ============================================================ */

window.openCatalogueLightbox =
    openLightbox;


window.closeCatalogueLightbox =
    closeLightbox;