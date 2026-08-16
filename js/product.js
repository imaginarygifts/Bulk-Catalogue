/* ==================================================
   PRODUCT PAGE
   SITE SETTINGS CONNECTED VERSION
================================================== */

import {
    db,
    storage
} from "./firebase.js";

import {
    doc,
    getDoc,
    setDoc,
    getDocs,
    collection,
    updateDoc,
    addDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";


/* ==================================================
   SITE SETTINGS
================================================== */

let siteSettings = {

    companyName: "Imaginary Gifts",

    whatsapp: "",

    email: "",

    logoUrl: "",

    faviconUrl: "",

    websiteTitle: "",

    metaDescription: "",

    metaKeywords: "",

    aboutUs: "",

    contactUs: "",

    terms: "",

    privacyPolicy: "",

    refundPolicy: "",

    shippingPolicy: "",

    razorpayKeyId: "",

    orderPrefix: "IG"

};


/* ==================================================
   LOAD SITE SETTINGS
================================================== */

async function loadSiteSettings() {

    try {

        const settingsRef =
            doc(
                db,
                "settings",
                "general"
            );

        const snapshot =
            await getDoc(
                settingsRef
            );

        if (
            snapshot.exists()
        ) {

            siteSettings = {

                ...siteSettings,

                ...snapshot.data()

            };

        }

        console.log(
            "✅ Product site settings loaded",
            siteSettings
        );

        window.siteSettings =
            siteSettings;

        applySiteSettings();

    }

    catch (error) {

        console.error(
            "Site settings error:",
            error
        );

    }

}


/* ==================================================
   APPLY GENERAL SITE SETTINGS
================================================== */

function applySiteSettings() {

    const companyName =
        siteSettings.companyName ||
        "Imaginary Gifts";


    /* PAGE TITLE */

    if (
        siteSettings.websiteTitle
    ) {

        document.title =
            siteSettings.websiteTitle;

    }

    else {

        document.title =
            companyName;

    }


    /* LOGO */

    document
        .querySelectorAll(
            "[data-site-logo]"
        )
        .forEach(
            img => {

                if (
                    siteSettings.logoUrl
                ) {

                    img.src =
                        siteSettings.logoUrl;

                }

                img.alt =
                    companyName;

            }
        );


    /* COMPANY NAME */

    document
        .querySelectorAll(
            "[data-company-name]"
        )
        .forEach(
            el => {

                el.textContent =
                    companyName;

            }
        );


    /* FAVICON */

    if (
        siteSettings.faviconUrl
    ) {

        let favicon =
            document.querySelector(
                'link[rel="icon"]'
            );

        if (!favicon) {

            favicon =
                document.createElement(
                    "link"
                );

            favicon.rel =
                "icon";

            document.head.appendChild(
                favicon
            );

        }

        favicon.href =
            siteSettings.faviconUrl;

    }


    /* DEFAULT META DESCRIPTION */

    if (
        siteSettings.metaDescription
    ) {

        const meta =
            document.querySelector(
                'meta[name="description"]'
            );

        if (meta) {

            meta.content =
                siteSettings.metaDescription;

        }

    }

}


/* ==================================================
   URL
================================================== */

const id =
    new URLSearchParams(
        window.location.search
    ).get("id");


/* ==================================================
   GLOBALS
================================================== */

let product =
    null;


let finalPrice =
    0;


let relatedProducts =
    [];


let selected = {

    color: null,

    size: null,

    options: {},

    optionValues: {},

    imageLinks: {}

};


/* ==================================================
   ESCAPE HTML
================================================== */

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


/* ==================================================
   ESCAPE ATTRIBUTE
================================================== */

function escapeAttribute(value) {

    return escapeHtml(
        value
    );

}


/* ==================================================
   REQUIRED SELECTION VALIDATION
================================================== */

function validateRequiredSelections() {

    const errors = [];


    document
        .querySelectorAll(
            ".custom-input, .custom-select"
        )
        .forEach(
            el => {

                el.classList.remove(
                    "error"
                );

            }
        );


    /* COLOR */

    if (
        product?.variants?.colors?.some(
            c => c.required
        )
    ) {

        if (
            !selected.color
        ) {

            errors.push(
                "Please select a color"
            );

        }

    }


    /* SIZE */

    if (
        product?.variants?.sizes?.some(
            s => s.required
        )
    ) {

        if (
            !selected.size
        ) {

            errors.push(
                "Please select a size"
            );

        }

    }


    /* CUSTOM OPTIONS */

    if (
        product?.customOptions?.length
    ) {

        product.customOptions.forEach(
            (option, index) => {

                if (
                    !option.required
                ) {

                    return;

                }


                /* TEXT / DROPDOWN */

                if (
                    option.type === "text" ||
                    option.type === "dropdown"
                ) {

                    if (
                        !selected.optionValues[index]
                    ) {

                        errors.push(
                            `Please fill ${option.label}`
                        );

                    }

                }


                /* CHECKBOX */

                if (
                    option.type === "checkbox"
                ) {

                    if (
                        !selected.optionValues[index]
                    ) {

                        errors.push(
                            `Please select ${option.label}`
                        );

                    }

                }


                /* IMAGE */

                if (
                    option.type === "image"
                ) {

                    if (
                        !selected.imageLinks[index]
                    ) {

                        errors.push(
                            `Please upload ${option.label}`
                        );

                    }

                }

            }
        );

    }


    return errors;

}


/* ==================================================
   PRODUCT META
================================================== */

function updatePageMeta() {

    if (!product) {

        return;

    }


    const companyName =
        siteSettings.companyName ||
        "Imaginary Gifts";


    const title =
        product.seoTitle ||
        product.metaTitle ||
        product.name ||
        companyName;


    const description =
        product.seoDescription ||
        product.metaDescription ||
        product.description ||
        siteSettings.metaDescription ||
        `Buy ${product.name} from ${companyName}`;


    const image =
        product.images?.[0] ||
        siteSettings.logoUrl ||
        "";


    const url =
        window.location.href;


    /* TITLE */

    document.title =
        title;


    /* DESCRIPTION */

    let metaDesc =
        document.querySelector(
            'meta[name="description"]'
        );


    if (!metaDesc) {

        metaDesc =
            document.createElement(
                "meta"
            );

        metaDesc.name =
            "description";

        document.head.appendChild(
            metaDesc
        );

    }


    metaDesc.content =
        description;


    /* KEYWORDS */

    if (
        product.seoKeywords ||
        product.metaKeywords ||
        siteSettings.metaKeywords
    ) {

        let keywords =
            document.querySelector(
                'meta[name="keywords"]'
            );


        if (!keywords) {

            keywords =
                document.createElement(
                    "meta"
                );

            keywords.name =
                "keywords";

            document.head.appendChild(
                keywords
            );

        }


        keywords.content =
            product.seoKeywords ||
            product.metaKeywords ||
            siteSettings.metaKeywords;

    }


    /* OG TITLE */

    setMeta(
        "property",
        "og:title",
        title
    );


    /* OG DESCRIPTION */

    setMeta(
        "property",
        "og:description",
        description
    );


    /* OG IMAGE */

    setMeta(
        "property",
        "og:image",
        image
    );


    /* OG URL */

    setMeta(
        "property",
        "og:url",
        url
    );


    /* OG TYPE */

    setMeta(
        "property",
        "og:type",
        "product"
    );


    /* TWITTER TITLE */

    setMeta(
        "name",
        "twitter:title",
        title
    );


    /* TWITTER DESCRIPTION */

    setMeta(
        "name",
        "twitter:description",
        description
    );


    /* TWITTER IMAGE */

    setMeta(
        "name",
        "twitter:image",
        image
    );

}


/* ==================================================
   META HELPER
================================================== */

function setMeta(
    attribute,
    name,
    content
) {

    let meta =
        document.querySelector(
            `meta[${attribute}="${name}"]`
        );


    if (!meta) {

        meta =
            document.createElement(
                "meta"
            );

        meta.setAttribute(
            attribute,
            name
        );

        document.head.appendChild(
            meta
        );

    }


    meta.setAttribute(
        "content",
        content || ""
    );

}


/* ==================================================
   LOAD PRODUCT
================================================== */

async function loadProduct() {

    try {

        /* SETTINGS FIRST */

        await loadSiteSettings();


        /* PRODUCT ID */

        if (!id) {

            console.error(
                "❌ Product ID missing"
            );

            showProductError(
                "Product ID is missing."
            );

            return;

        }


        /* GET PRODUCT */

        const snap =
            await getDoc(
                doc(
                    db,
                    "products",
                    id
                )
            );


        if (
            !snap.exists()
        ) {

            console.error(
                "❌ Product not found"
            );

            showProductError(
                "Product not found."
            );

            return;

        }


        product = {

            id,

            ...snap.data()

        };


        /* FINAL PRICE */

        finalPrice =
            getBasePrice();


        /* META */

        updatePageMeta();


        /* SLIDER */

        renderSlider(
            product.images || []
        );


        /* RELATED */

        await loadRelatedDesigns();


        /* MAIN UI */

        render();


        console.log(
            "✅ Product loaded",
            product
        );

    }

    catch (error) {

        console.error(
            "❌ Product loading error:",
            error
        );

        showProductError(
            "Unable to load this product."
        );

    }

}


/* ==================================================
   PRODUCT ERROR
================================================== */

function showProductError(
    message
) {

    const details =
        document.getElementById(
            "productDetails"
        );


    if (!details) {

        return;

    }


    details.innerHTML = `

        <div class="product-error">

            ${escapeHtml(
                message
            )}

        </div>

    `;

}


/* ==================================================
   BASE PRICE
================================================== */

function getBasePrice() {

    if (!product) {

        return 0;

    }


    const base =
        Number(
            product.basePrice || 0
        );


    const sale =
        Number(
            product.salePrice || 0
        );


    if (
        sale > 0 &&
        sale < base
    ) {

        return sale;

    }


    return base;

}


/* ==================================================
   START LOAD
================================================== */

loadProduct();


/* ==================================================
   RELATED PRODUCTS
================================================== */

async function loadRelatedDesigns() {

    relatedProducts = [];


    if (
        !product.relatedDesigns ||
        !product.relatedDesigns.length
    ) {

        return;

    }


    try {

        const snap =
            await getDocs(
                collection(
                    db,
                    "products"
                )
            );


        snap.forEach(
            d => {

                if (
                    product.relatedDesigns.includes(
                        d.id
                    )
                    ||
                    d.id === id
                ) {

                    relatedProducts.push({

                        id:
                            d.id,

                        ...d.data()

                    });

                }

            }
        );

    }

    catch (error) {

        console.error(
            "Related products error:",
            error
        );

    }

}


/* ==================================================
   RENDER PRODUCT
================================================== */

function render() {

    const details =
        document.getElementById(
            "productDetails"
        );


    if (!details) {

        return;

    }


    let discount =
        0;


    if (
        product.salePrice &&
        product.salePrice <
        product.basePrice
    ) {

        discount =
            Math.round(
                (
                    (
                        product.basePrice -
                        product.salePrice
                    )
                    /
                    product.basePrice
                ) * 100
            );

    }


    /* ==================================================
       PRICE

       Sale price + old price are kept.
       Discount badge is removed.
    ================================================== */

    const priceHTML = `

        <div class="price-wrap">

            ${
                discount > 0

                ?

                `

                <span class="sale">

                    ₹<span id="price">

                        ${finalPrice}

                    </span>

                </span>


                <span class="old">

                    ₹${product.basePrice}

                </span>

                `

                :

                `

                <span class="sale">

                    ₹<span id="price">

                        ${finalPrice}

                    </span>

                </span>

                `

            }

        </div>

    `;


    



    /* ==================================================
       PRODUCT HEADER
    ================================================== */

    let html = `

        <div class="product-header">

            

            <h2>

                ${escapeHtml(
                    product.name ||
                    "Product"
                )}

            </h2>


            <p>

                ${escapeHtml(
                    product.description ||
                    ""
                )}

            </p>


            ${priceHTML}

        </div>

    `;


    /* ==================================================
       COLORS
    ================================================== */

    if (
        product.variants?.colors?.length
    ) {

        html += `

            <h4>
                Colors
            </h4>

            <div class="variant-row">

        `;


        product.variants.colors.forEach(
            (color, index) => {

                html += `

                    <button

                        type="button"

                        class="btn-outline color-btn"

                        onclick="
                            selectColor(${index})
                        "

                    >

                        ${escapeHtml(
                            color.name
                        )}

                    </button>

                `;

            }
        );


        html += `

            </div>

        `;

    }


    /* ==================================================
       SIZES
    ================================================== */

    if (
        product.variants?.sizes?.length
    ) {

        html += `

            <h4>
                Sizes
            </h4>

            <div class="variant-row">

        `;


        product.variants.sizes.forEach(
            (size, index) => {

                html += `

                    <button

                        type="button"

                        class="btn-outline size-btn"

                        onclick="
                            selectSize(${index})
                        "

                    >

                        ${escapeHtml(
                            size.name
                        )}

                    </button>

                `;

            }
        );


        html += `

            </div>

        `;

    }


    /* ==================================================
       RELATED DESIGNS
    ================================================== */

    if (
        relatedProducts.length > 1
    ) {

        html += `

            <div class="design-wrap">

                <h3>

                    You may also like

                </h3>


                <div class="design-row">

        `;


        relatedProducts.forEach(
            related => {

                const active =
                    related.id === id
                    ?
                    "active"
                    :
                    "";


                const relatedPrice =
                    related.salePrice &&
                    related.salePrice <
                    related.basePrice

                    ?

                    related.salePrice

                    :

                    related.basePrice;


                html += `

                    <div

                        class="
                            design-card
                            ${active}
                        "

                        onclick="
                            goToDesign(
                                '${escapeAttribute(
                                    related.id
                                )}'
                            )
                        "

                    >

                        <img

                            src="${escapeAttribute(
                                related.images?.[0] ||
                                ""
                            )}"

                            alt="${escapeAttribute(
                                related.name ||
                                ""
                            )}"

                            loading="lazy"

                        >


                        <small>

                            ${escapeHtml(
                                related.name ||
                                ""
                            )}

                        </small>


                        <div class="price">

                            ₹${relatedPrice}

                        </div>

                    </div>

                `;

            }
        );


        html += `

                </div>

            </div>

        `;

    }


    details.innerHTML =
        html;

}


/* ==================================================
   RELATED DESIGN NAVIGATION
================================================== */

window.goToDesign =
function(pid) {

    if (!pid) {

        return;

    }


    location.href =
        `product?id=${encodeURIComponent(
            pid
        )}`;

};


/* ==================================================
   PRODUCT SLIDER
================================================== */

function renderSlider(
    images
) {

    const slider =
        document.getElementById(
            "slider"
        );


    const dotsBox =
        document.getElementById(
            "sliderDots"
        );


    if (
        !slider ||
        !dotsBox
    ) {

        return;

    }


    slider.innerHTML =
        "";


    dotsBox.innerHTML =
        "";


    if (
        !images.length
    ) {

        return;

    }


    images.forEach(
        (img, index) => {

            const image =
                document.createElement(
                    "img"
                );


            image.src =
                img;


            image.alt =
                product?.name ||
                "Product";


            image.loading =
                "lazy";


            slider.appendChild(
                image
            );


            const dot =
                document.createElement(
                    "span"
                );


            if (
                index === 0
            ) {

                dot.classList.add(
                    "active"
                );

            }


            dotsBox.appendChild(
                dot
            );

        }
    );


    slider.onscroll =
    function() {

        const i =
            Math.round(
                slider.scrollLeft /
                slider.clientWidth
            );


        [
            ...dotsBox.children
        ].forEach(
            (dot, index) => {

                dot.classList.toggle(
                    "active",
                    index === i
                );

            }
        );

    };

}


/* ==================================================
   COLOR
================================================== */

window.selectColor =
function(index) {

    document
        .querySelectorAll(
            ".color-btn"
        )
        .forEach(
            button => {

                button.classList.remove(
                    "active"
                );

            }
        );


    const buttons =
        document.querySelectorAll(
            ".color-btn"
        );


    buttons[index]
        ?.classList.add(
            "active"
        );


    selected.color =
        product.variants.colors[index] ||
        null;


    recalcPrice();

};


/* ==================================================
   SIZE
================================================== */

window.selectSize =
function(index) {

    document
        .querySelectorAll(
            ".size-btn"
        )
        .forEach(
            button => {

                button.classList.remove(
                    "active"
                );

            }
        );


    const buttons =
        document.querySelectorAll(
            ".size-btn"
        );


    buttons[index]
        ?.classList.add(
            "active"
        );


    selected.size =
        product.variants.sizes[index] ||
        null;


    recalcPrice();

};


/* ==================================================
   TEXT OPTION
================================================== */

window.addTextOption =
function(
    index,
    value
) {

    if (!value) {

        delete selected.options[index];

        delete selected.optionValues[index];

        recalcPrice();

        return;

    }


    selected.options[index] =
        product.customOptions[index].price;


    selected.optionValues[index] =
        value;


    recalcPrice();

};


/* ==================================================
   CHECKBOX
================================================== */

window.toggleCheckbox =
function(
    index,
    checked
) {

    if (checked) {

        selected.options[index] =
            product.customOptions[index].price;


        selected.optionValues[index] =
            "Yes";

    }

    else {

        delete selected.options[index];

        delete selected.optionValues[index];

    }


    recalcPrice();

};


/* ==================================================
   DROPDOWN
================================================== */

window.addDropdownOption =
function(
    index,
    value
) {

    if (!value) {

        delete selected.options[index];

        delete selected.optionValues[index];

        recalcPrice();

        return;

    }


    selected.options[index] =
        product.customOptions[index].price;


    selected.optionValues[index] =
        value;


    recalcPrice();

};


/* ==================================================
   IMAGE UPLOAD
================================================== */

window.uploadCustomImage =
async function(
    index,
    file
) {

    if (!file) {

        return;

    }


    const status =
        document.getElementById(
            `uploadStatus${index}`
        );


    if (status) {

        status.innerHTML = `

            <div class="uploading">

                ⏳ Uploading

                <b>

                    ${escapeHtml(
                        file.name
                    )}

                </b>...

            </div>

        `;

    }


    try {

        const storageRef =
            ref(
                storage,
                `custom-images/${Date.now()}-${file.name}`
            );


        await uploadBytes(
            storageRef,
            file
        );


        const url =
            await getDownloadURL(
                storageRef
            );


        selected.options[index] =
            product.customOptions[index].price;


        selected.optionValues[index] =
            file.name;


        selected.imageLinks[index] =
            url;


        if (status) {

            status.innerHTML = `

                <div class="upload-success">

                    ✅ Uploaded Successfully

                    <br>

                    <small>

                        ${escapeHtml(
                            file.name
                        )}

                    </small>

                </div>

            `;

        }


        recalcPrice();

    }

    catch (error) {

        console.error(
            "Image upload error:",
            error
        );


        if (status) {

            status.innerHTML = `

                <div class="upload-error">

                    ❌ Upload Failed

                </div>

            `;

        }


        alert(
            error.message ||
            "Image upload failed."
        );

    }

};


/* ==================================================
   PRICE CALCULATION
================================================== */

function recalcPrice() {

    const base =
        getBasePrice();


    finalPrice =
        Number(
            base || 0
        );


    /* COLOR */

    if (
        selected.color
    ) {

        finalPrice +=
            Number(
                selected.color.price ||
                0
            );

    }


    /* SIZE */

    if (
        selected.size
    ) {

        finalPrice +=
            Number(
                selected.size.price ||
                0
            );

    }


    /* CUSTOM OPTIONS */

    Object
        .values(
            selected.options
        )
        .forEach(
            price => {

                finalPrice +=
                    Number(
                        price || 0
                    );

            }
        );


    /* PAGE PRICE */

    const pagePrice =
        document.getElementById(
            "price"
        );


    if (pagePrice) {

        pagePrice.innerText =
            finalPrice;

    }


    /* POPUP PRICE */

    const popupPrice =
        document.getElementById(
            "popupPrice"
        );


    if (popupPrice) {

        popupPrice.innerText =
            "₹" +
            finalPrice;

    }

}


/* ==================================================
   CUSTOMIZE POPUP
================================================== */

function renderCustomizePopup() {

    const container =
        document.getElementById(
            "customOptionsContainer"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    const popupPrice =
        document.getElementById(
            "popupPrice"
        );


    if (popupPrice) {

        popupPrice.innerText =
            "₹" +
            finalPrice;

    }


    if (
        !product.customOptions?.length
    ) {

        return;

    }


    product.customOptions.forEach(
        (option, index) => {

            const wrap =
                document.createElement(
                    "div"
                );


            wrap.className =
                "custom-option";


            /* LABEL */

            const label =
                document.createElement(
                    "label"
                );


            label.innerHTML =
                escapeHtml(
                    option.label
                ) +
                (
                    option.required
                    ?
                    ' <span style="color:red">*</span>'
                    :
                    ""
                );


            wrap.appendChild(
                label
            );


            /* TEXT */

            if (
                option.type === "text"
            ) {

                wrap.innerHTML += `

                    <input

                        type="text"

                        class="custom-input"

                        placeholder="${escapeAttribute(
                            option.label
                        )}"

                        value="${escapeAttribute(
                            selected.optionValues[index] ||
                            ""
                        )}"

                        oninput="
                            addTextOption(
                                ${index},
                                this.value
                            )
                        "

                    >

                `;

            }


            /* CHECKBOX */

            else if (
                option.type === "checkbox"
            ) {

                wrap.innerHTML += `

                    <div class="option-row">

                        <input

                            type="checkbox"

                            ${
                                selected.optionValues[index]
                                ?
                                "checked"
                                :
                                ""
                            }

                            onchange="
                                toggleCheckbox(
                                    ${index},
                                    this.checked
                                )
                            "

                        >

                        <span>

                            ${escapeHtml(
                                option.label
                            )}

                            ${
                                Number(
                                    option.price || 0
                                ) > 0

                                ?

                                `(+₹${escapeHtml(
                                    option.price
                                )})`

                                :

                                ""

                            }

                        </span>

                    </div>

                `;

            }


            /* DROPDOWN */

            else if (
                option.type === "dropdown"
            ) {

                let optionsHTML = `

                    <option value="">

                        Select
                        ${escapeHtml(
                            option.label
                        )}

                    </option>

                `;


                (
                    option.choices ||
                    []
                ).forEach(
                    choice => {

                        optionsHTML += `

                            <option

                                value="${escapeAttribute(
                                    choice
                                )}"

                                ${
                                    selected.optionValues[index] ===
                                    choice

                                    ?

                                    "selected"

                                    :

                                    ""
                                }

                            >

                                ${escapeHtml(
                                    choice
                                )}

                            </option>

                        `;

                    }
                );


                wrap.innerHTML += `

                    <select

                        class="custom-select"

                        onchange="
                            addDropdownOption(
                                ${index},
                                this.value
                            )
                        "

                    >

                        ${optionsHTML}

                    </select>

                `;

            }


            /* IMAGE */

            else if (
                option.type === "image"
            ) {

                wrap.innerHTML += `

                    <div class="upload-box">

                        <input

                            type="file"

                            accept="image/*"

                            onchange="
                                uploadCustomImage(
                                    ${index},
                                    this.files[0]
                                )
                            "

                        >


                        <small
                            id="uploadStatus${index}"
                        >

                            ${
                                selected.imageLinks[index]

                                ?

                                `

                                ✅
                                ${escapeHtml(
                                    selected.optionValues[index]
                                )}

                                `

                                :

                                ""

                            }

                        </small>

                    </div>

                `;

            }


            container.appendChild(
                wrap
            );

        }
    );


    recalcPrice();

}


/* ==================================================
   OPEN CUSTOMIZE
================================================== */

window.openCustomizePopup =
function() {

    renderCustomizePopup();


    document
        .getElementById(
            "customizeOverlay"
        )
        ?.classList.remove(
            "hidden"
        );

};


/* ==================================================
   CLOSE CUSTOMIZE
================================================== */

window.closeCustomizePopup =
function() {

    document
        .getElementById(
            "customizeOverlay"
        )
        ?.classList.add(
            "hidden"
        );

};


/* ==================================================
   NEXT TO ADDRESS
================================================== */

window.nextToAddress =
function() {

    const errors =
        validateRequiredSelections();


    if (
        errors.length
    ) {

        showErrorModal(
            errors
        );

        return;

    }


    closeCustomizePopup();


    document
        .getElementById(
            "waFormOverlay"
        )
        ?.classList.remove(
            "hidden"
        );

};


/* ==================================================
   BACK TO CUSTOMIZE
================================================== */

window.backToCustomize =
function() {

    document
        .getElementById(
            "waFormOverlay"
        )
        ?.classList.add(
            "hidden"
        );


    document
        .getElementById(
            "customizeOverlay"
        )
        ?.classList.remove(
            "hidden"
        );

};


/* ==================================================
   ORDER NOW / WHATSAPP
================================================== */

window.orderNow =
function() {

    renderCustomizePopup();


    document
        .getElementById(
            "customizeOverlay"
        )
        ?.classList.remove(
            "hidden"
        );

};


/* ==================================================
   WHATSAPP ORDER
================================================== */

window.submitWaOrder =
async function() {

    const name =
        document
            .getElementById(
                "custName"
            )
            ?.value
            .trim();


    const phone =
        document
            .getElementById(
                "custPhone"
            )
            ?.value
            .trim();


    const address =
        document
            .getElementById(
                "custAddress"
            )
            ?.value
            .trim();


    const pincode =
        document
            .getElementById(
                "custPincode"
            )
            ?.value
            .trim();


    /* VALIDATION */

    if (
        !name ||
        !phone ||
        !address ||
        !pincode
    ) {

        alert(
            "⚠ Please fill all customer details"
        );

        return;

    }


    if (
        !/^[6-9]\d{9}$/.test(
            phone
        )
    ) {

        alert(
            "⚠ Enter valid 10-digit mobile number"
        );

        return;

    }


    if (
        !/^\d{6}$/.test(
            pincode
        )
    ) {

        alert(
            "⚠ Enter valid 6-digit pincode"
        );

        return;

    }


    /* WHATSAPP FROM SITE SETTINGS */

    const whatsappNumber =
        String(
            siteSettings.whatsapp ||
            ""
        )
            .replace(
                /\D/g,
                ""
            );


    if (
        !whatsappNumber
    ) {

        alert(
            "WhatsApp number is not configured in Site Settings."
        );

        return;

    }


    try {

        /* ORDER NUMBER */

        const counterRef =
            doc(
                db,
                "counters",
                "orders"
            );


        const counterSnap =
            await getDoc(
                counterRef
            );


        let nextNumber =
            1001;


        if (
            counterSnap.exists()
        ) {

            nextNumber =
                (
                    counterSnap.data().current ||
                    1000
                ) + 1;


            await updateDoc(
                counterRef,
                {
                    current:
                        nextNumber
                }
            );

        }

        else {

            await setDoc(
                counterRef,
                {
                    current:
                        nextNumber
                }
            );

        }


        const prefix =
            String(
                siteSettings.orderPrefix ||
                "IG"
            )
                .replace(
                    /\s+/g,
                    ""
                )
                .toUpperCase();


        const orderNumber =
            `${prefix}-${nextNumber}`;


        /* SAVE ORDER */

        const orderData = {

            orderNumber,

            customer: {

                name,

                phone,

                address,

                pincode

            },


            productId:
                id,


            productName:
                product.name,


            productImage:
                product.images?.[0] ||
                "",


            categoryId:
                product.categoryId ||
                null,


            tags:
                product.tags ||
                [],


            variants: {

                color:
                    selected.color ||
                    null,

                size:
                    selected.size ||
                    null

            },


            customOptions:

                Object
                    .keys(
                        selected.optionValues ||
                        {}
                    )
                    .map(
                        index => ({

                            label:
                                product
                                    .customOptions?.[index]
                                    ?.label ||
                                "",


                            value:
                                selected
                                    .optionValues?.[index] ||
                                "",


                            image:
                                selected
                                    .imageLinks?.[index] ||
                                null

                        })
                    ),


            pricing: {

                finalAmount:
                    Number(
                        finalPrice
                    )

            },


            payment: {

                mode:
                    "whatsapp",

                status:
                    "pending",

                paidAmount:
                    0

            },


            orderStatus:
                "pending",


            source:
                "product-whatsapp",


            companyName:
                siteSettings.companyName ||
                "",


            productLink:
                location.href,


            createdAt:
                Date.now()

        };


        await addDoc(
            collection(
                db,
                "orders"
            ),
            orderData
        );


        /* WHATSAPP MESSAGE */

        const companyName =
            siteSettings.companyName ||
            "Imaginary Gifts";


        let message =
            `🛍 *New Order — ${companyName}*\n\n`;


        message +=
            `🧾 *Order No:* ${orderNumber}\n\n`;


        message +=
            `👤 *Name:* ${name}\n`;


        message +=
            `📞 *Mobile:* ${phone}\n`;


        message +=
            `🏠 *Address:* ${address}\n`;


        message +=
            `📮 *Pincode:* ${pincode}\n\n`;


        message +=
            `📦 *Product:* ${product.name}\n`;


        /* COLOR */

        if (
            selected.color
        ) {

            message +=
                `🎨 Color: ${selected.color.name}\n`;

        }


        /* SIZE */

        if (
            selected.size
        ) {

            message +=
                `📏 Size: ${selected.size.name}\n`;

        }


        /* OPTIONS */

        if (
            Object.keys(
                selected.optionValues
            ).length
        ) {

            message +=
                `\n⚙ *Options:*\n`;


            Object
                .keys(
                    selected.optionValues
                )
                .forEach(
                    index => {

                        const option =
                            product
                                .customOptions?.[index];


                        if (!option) {

                            return;

                        }


                        message +=
                            `- ${option.label}: ${selected.optionValues[index]}\n`;


                        if (
                            selected.imageLinks[index]
                        ) {

                            message +=
                                `  Image: ${selected.imageLinks[index]}\n`;

                        }

                    }
                );

        }


        /* TOTAL */

        message +=
            `\n💰 *Total:* ₹${finalPrice}\n`;


        /* PRODUCT LINK */

        message +=
            `🔗 Product Link:\n${location.href}`;


        /* WHATSAPP URL */

        const whatsappUrl =
            `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                message
            )}`;


        window.open(
            whatsappUrl,
            "_blank"
        );


        /* CLOSE FORM */

        document
            .getElementById(
                "waFormOverlay"
            )
            ?.classList.add(
                "hidden"
            );

    }

    catch (error) {

        console.error(
            "WhatsApp order error:",
            error
        );


        alert(
            "Order failed: " +
            (
                error.message ||
                "Unknown error"
            )
        );

    }

};


/* ==================================================
   CLOSE WHATSAPP FORM
================================================== */

window.closeWaForm =
function() {

    document
        .getElementById(
            "waFormOverlay"
        )
        ?.classList.add(
            "hidden"
        );

};


/* ==================================================
   BUY NOW
================================================== */

window.buyNow =
function() {

    /* VALIDATE */

    const errors =
        validateRequiredSelections();


    if (
        errors.length
    ) {

        showErrorModal(
            errors
        );

        return;

    }


    /* SAVE COMPLETE CHECKOUT DATA */

    const checkoutData = {

        product,

        finalPrice,

        color:
            selected.color,

        size:
            selected.size,

        options:
            selected.options,

        optionValues:
            selected.optionValues,

        imageLinks:
            selected.imageLinks,


        /* SITE SETTINGS */

        site: {

            companyName:
                siteSettings.companyName ||
                "",

            email:
                siteSettings.email ||
                "",

            logoUrl:
                siteSettings.logoUrl ||
                "",

            razorpayKeyId:
                siteSettings.razorpayKeyId ||
                ""

        }

    };


    localStorage.setItem(
        "checkoutData",
        JSON.stringify(
            checkoutData
        )
    );


    /* GO TO CHECKOUT */

    location.href =
        "order";

};


/* ==================================================
   ERROR MODAL
================================================== */

function showErrorModal(
    errors
) {

    const modal =
        document.getElementById(
            "errorModal"
        );


    const list =
        document.getElementById(
            "errorList"
        );


    if (
        !modal ||
        !list
    ) {

        alert(
            errors.join(
                "\n"
            )
        );

        return;

    }


    list.innerHTML =
        "";


    errors.forEach(
        error => {

            const li =
                document.createElement(
                    "li"
                );


            li.textContent =
                error;


            list.appendChild(
                li
            );

        }
    );


    modal.classList.remove(
        "hidden"
    );

}


/* ==================================================
   CLOSE ERROR
================================================== */

window.closeErrorModal =
function() {

    document
        .getElementById(
            "errorModal"
        )
        ?.classList.add(
            "hidden"
        );

};


/* ==================================================
   EXPORT
================================================== */

export {

    loadProduct,

    loadSiteSettings

};