/*==================================================
    PRODUCT PAGE
==================================================*/

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


/*==================================================
    GLOBAL SITE SETTINGS
==================================================*/

/*
    Settings are stored in:

    settings
        └── general

    Fields:

    companyName
    whatsapp
    email
    logoUrl
    aboutUs
    contactUs
    terms
    privacyPolicy
    refundPolicy
    shippingPolicy
*/

let siteSettings = {

    companyName:
        "Imaginary Gifts",

    whatsapp:
        "",

    email:
        "",

    logoUrl:
        "",

    aboutUs:
        "",

    contactUs:
        "",

    terms:
        "",

    privacyPolicy:
        "",

    refundPolicy:
        "",

    shippingPolicy:
        ""

};


/*==================================================
    LOAD SITE SETTINGS
==================================================*/

async function loadSiteSettings(){

    try{

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


        if(
            snapshot.exists()
        ){

            siteSettings = {

                ...siteSettings,

                ...snapshot.data()

            };

        }


        console.log(
            "Site settings loaded:",
            siteSettings
        );

    }

    catch(error){

        console.error(
            "Unable to load site settings:",
            error
        );

    }

}


/*==================================================
    CONFIGURATION
==================================================*/

/*
    DO NOT PUT THE WHATSAPP NUMBER HERE.

    It now comes from:

    settings/general/whatsapp
*/


/*==================================================
    GLOBALS
==================================================*/

const id =
    new URLSearchParams(
        window.location.search
    ).get("id");


let product =
    null;


let finalPrice =
    0;


let relatedProducts =
    [];


let selected = {

    color:
        null,

    size:
        null,

    options:
        {},

    optionValues:
        {},

    imageLinks:
        {}

};


let searchQuery =
    "";


/*==================================================
    SIDEBAR
==================================================*/

window.toggleSidebar =
function(){

    document
        .getElementById(
            "sidebar"
        )
        ?.classList.toggle(
            "active"
        );


    document
        .getElementById(
            "overlay"
        )
        ?.classList.toggle(
            "active"
        );

};


/*==================================================
    VALIDATE REQUIRED SELECTIONS
==================================================*/

function validateRequiredSelections(){

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


    /*==============================================
        REQUIRED COLOR
    ==============================================*/

    if(
        product?.variants?.colors?.some(
            c => c.required
        )
    ){

        if(
            !selected.color
        ){

            errors.push(
                "Please select a color"
            );

        }

    }


    /*==============================================
        REQUIRED SIZE
    ==============================================*/

    if(
        product?.variants?.sizes?.some(
            s => s.required
        )
    ){

        if(
            !selected.size
        ){

            errors.push(
                "Please select a size"
            );

        }

    }


    /*==============================================
        REQUIRED CUSTOM OPTIONS
    ==============================================*/

    if(
        product?.customOptions?.length
    ){

        product.customOptions.forEach(
            (o,i) => {

                if(
                    !o.required
                ){

                    return;

                }


                /* TEXT / DROPDOWN */

                if(
                    o.type === "text" ||
                    o.type === "dropdown"
                ){

                    if(
                        !selected.optionValues[i]
                    ){

                        errors.push(
                            `Please fill ${o.label}`
                        );

                    }

                }


                /* CHECKBOX */

                if(
                    o.type === "checkbox"
                ){

                    if(
                        !selected.optionValues[i]
                    ){

                        errors.push(
                            `Please select ${o.label}`
                        );

                    }

                }


                /* IMAGE */

                if(
                    o.type === "image"
                ){

                    if(
                        !selected.imageLinks[i]
                    ){

                        errors.push(
                            `Please upload ${o.label}`
                        );

                    }

                }

            }
        );

    }


    return errors;

}


/*==================================================
    PAGE META
==================================================*/

function updatePageMeta(
    product
){

    const title =
        product.name ||
        siteSettings.companyName ||
        "Imaginary Gifts";


    const description =
        product.description ||
        "Check out this customized gift product";


    const image =
        product.images?.[0] ||
        "";


    const url =
        window.location.href;


    /*==============================================
        TITLE
    ==============================================*/

    document.title =
        title;


    /*==============================================
        META DESCRIPTION
    ==============================================*/

    let metaDesc =
        document.querySelector(
            'meta[name="description"]'
        );


    if(
        metaDesc
    ){

        metaDesc.setAttribute(
            "content",
            description
        );

    }


    /*==============================================
        OPEN GRAPH
    ==============================================*/

    document
        .querySelector(
            'meta[property="og:title"]'
        )
        ?.setAttribute(
            "content",
            title
        );


    document
        .querySelector(
            'meta[property="og:description"]'
        )
        ?.setAttribute(
            "content",
            description
        );


    document
        .querySelector(
            'meta[property="og:image"]'
        )
        ?.setAttribute(
            "content",
            image
        );


    document
        .querySelector(
            'meta[property="og:url"]'
        )
        ?.setAttribute(
            "content",
            url
        );

}


/*==================================================
    LOAD PRODUCT
==================================================*/

async function loadProduct(){

    try{

        /*
            IMPORTANT:

            Load Settings FIRST.

            This ensures WhatsApp number and
            company name are available before
            the product page is used.
        */

        await loadSiteSettings();


        /*==========================================
            CHECK PRODUCT ID
        ==========================================*/

        if(!id){

            console.error(
                "Product ID missing."
            );

            return;

        }


        /*==========================================
            GET PRODUCT
        ==========================================*/

        const snap =
            await getDoc(
                doc(
                    db,
                    "products",
                    id
                )
            );


        if(
            !snap.exists()
        ){

            console.error(
                "Product not found."
            );

            return;

        }


        product =
            snap.data();


        /*==========================================
            FINAL PRICE
        ==========================================*/

        finalPrice =

            product.salePrice &&
            product.salePrice <
            product.basePrice

            ?

            product.salePrice

            :

            product.basePrice;


        /*==========================================
            META
        ==========================================*/

        updatePageMeta(
            product
        );


        /*==========================================
            SLIDER
        ==========================================*/

        renderSlider(
            product.images || []
        );


        /*==========================================
            RELATED PRODUCTS
        ==========================================*/

        await loadRelatedDesigns();


        /*==========================================
            RENDER
        ==========================================*/

        render();

    }

    catch(error){

        console.error(
            "Product loading error:",
            error
        );

    }

}


loadProduct();


/*==================================================
    LOAD RELATED DESIGNS
==================================================*/

async function loadRelatedDesigns(){

    relatedProducts = [];


    if(
        !product.relatedDesigns ||
        !product.relatedDesigns.length
    ){

        return;

    }


    const snap =
        await getDocs(
            collection(
                db,
                "products"
            )
        );


    snap.forEach(
        d => {

            if(
                product.relatedDesigns.includes(
                    d.id
                )
                ||
                d.id === id
            ){

                relatedProducts.push({

                    id:
                        d.id,

                    ...d.data()

                });

            }

        }
    );

}


/*==================================================
    RENDER PRODUCT
==================================================*/

function render(){

    const details =
        document.getElementById(
            "productDetails"
        );


    if(!details){

        return;

    }


    let discount =
        0;


    if(
        product.salePrice &&
        product.salePrice <
        product.basePrice
    ){

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


    /*==============================================
        PRICE HTML
    ==============================================*/

    let priceHTML = `

        <div class="price-wrap">

            ${
                product.salePrice &&
                product.salePrice <
                product.basePrice

                ?

                `

                <span class="sale">

                    ₹
                    <span id="price">
                        ${product.salePrice}
                    </span>

                </span>


                <span class="old">

                    ₹${product.basePrice}

                </span>

                `

                :

                `

                <span class="sale">

                    ₹
                    <span id="price">
                        ${product.basePrice}
                    </span>

                </span>

                `
            }

        </div>

    `;


    /*==============================================
        BADGES
    ==============================================*/

    let badgeHTML =
        "";


    if(
        discount > 0
    ){

        badgeHTML += `

            <span class="badge discount">

                -${discount}%

            </span>

        `;

    }


    if(
        product.inStock === false
    ){

        badgeHTML += `

            <span class="badge stock">

                Out of Stock

            </span>

        `;

    }


    /*==============================================
        PRODUCT HEADER
    ==============================================*/

    let html = `

        <div class="product-header">

            ${badgeHTML}

            <h2>

                ${escapeHtml(
                    product.name
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


    /*==============================================
        COLORS
    ==============================================*/

    if(
        product.variants?.colors?.length
    ){

        html += `

            <h4>
                Colors
            </h4>

            <div class="variant-row">

        `;


        product.variants.colors.forEach(
            (c,i) => {

                html += `

                    <button
                        class="btn-outline color-btn"
                        onclick="selectColor(${i})"
                    >

                        ${escapeHtml(
                            c.name
                        )}

                    </button>

                `;

            }
        );


        html += `

            </div>

        `;

    }


    /*==============================================
        SIZES
    ==============================================*/

    if(
        product.variants?.sizes?.length
    ){

        html += `

            <h4>
                Quantity
            </h4>

            <div class="variant-row">

        `;


        product.variants.sizes.forEach(
            (s,i) => {

                html += `

                    <button
                        class="btn-outline size-btn"
                        onclick="selectSize(${i})"
                    >

                        ${escapeHtml(
                            s.name
                        )}

                    </button>

                `;

            }
        );


        html += `

            </div>

        `;

    }


    /*==============================================
        RELATED DESIGNS
    ==============================================*/

    if(
        relatedProducts.length > 1
    ){

        html += `

            <div class="design-wrap">

                <h3>
                    You may also like
                </h3>


                <div class="design-row">

        `;


        relatedProducts.forEach(
            p => {

                const active =
                    p.name === product.name
                    ?
                    "active"
                    :
                    "";


                html += `

                    <div
                        class="
                            design-card
                            ${active}
                        "
                        onclick="goToDesign('${escapeAttribute(
                            p.id
                        )}')"
                    >

                        <img
                            src="${escapeAttribute(
                                p.images?.[0] ||
                                ""
                            )}"
                            alt="${escapeAttribute(
                                p.name ||
                                ""
                            )}"
                        >


                        <small>

                            ${escapeHtml(
                                p.name
                            )}

                        </small>


                        <div class="price">

                            ₹${
                                (
                                    p.salePrice &&
                                    p.salePrice <
                                    p.basePrice
                                )
                                ?
                                p.salePrice
                                :
                                p.basePrice
                            }

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


/*==================================================
    DESIGN NAVIGATION
==================================================*/

window.goToDesign =
function(pid){

    location.href =
        `product?id=${encodeURIComponent(
            pid
        )}`;

};


/*==================================================
    SLIDER
==================================================*/

function renderSlider(
    images
){

    const slider =
        document.getElementById(
            "slider"
        );


    const dotsBox =
        document.getElementById(
            "sliderDots"
        );


    if(
        !slider ||
        !dotsBox
    ){

        return;

    }


    slider.innerHTML =
        "";


    dotsBox.innerHTML =
        "";


    images.forEach(
        (img,index) => {

            const image =
                document.createElement(
                    "img"
                );


            image.src =
                img;


            image.alt =
                product?.name ||
                "Product";


            slider.appendChild(
                image
            );


            const dot =
                document.createElement(
                    "span"
                );


            if(
                index === 0
            ){

                dot.classList.add(
                    "active"
                );

            }


            dotsBox.appendChild(
                dot
            );

        }
    );


    slider.addEventListener(
        "scroll",
        () => {

            const i =
                Math.round(
                    slider.scrollLeft /
                    slider.clientWidth
                );


            [
                ...dotsBox.children
            ].forEach(
                (d,idx) => {

                    d.classList.toggle(
                        "active",
                        idx === i
                    );

                }
            );

        }
    );

}


/*==================================================
    VARIANTS
==================================================*/

window.selectColor =
function(i){

    document
        .querySelectorAll(
            ".color-btn"
        )
        .forEach(
            b => {

                b.classList.remove(
                    "active"
                );

            }
        );


    document
        .querySelectorAll(
            ".color-btn"
        )[i]
        ?.classList.add(
            "active"
        );


    selected.color =
        product.variants.colors[i];


    recalcPrice();

};


window.selectSize =
function(i){

    document
        .querySelectorAll(
            ".size-btn"
        )
        .forEach(
            b => {

                b.classList.remove(
                    "active"
                );

            }
        );


    document
        .querySelectorAll(
            ".size-btn"
        )[i]
        ?.classList.add(
            "active"
        );


    selected.size =
        product.variants.sizes[i];


    recalcPrice();

};


/*==================================================
    CUSTOM OPTIONS
==================================================*/

window.addTextOption =
function(
    i,
    val
){

    if(!val){

        delete selected.options[i];

        delete selected.optionValues[i];

        recalcPrice();

        return;

    }


    selected.options[i] =
        product.customOptions[i].price;


    selected.optionValues[i] =
        val;


    recalcPrice();

};


window.toggleCheckbox =
function(
    i,
    checked
){

    if(checked){

        selected.options[i] =
            product.customOptions[i].price;


        selected.optionValues[i] =
            "Yes";

    }

    else{

        delete selected.options[i];

        delete selected.optionValues[i];

    }


    recalcPrice();

};


window.addDropdownOption =
function(
    i,
    val
){

    if(!val){

        delete selected.options[i];

        delete selected.optionValues[i];

        recalcPrice();

        return;

    }


    selected.options[i] =
        product.customOptions[i].price;


    selected.optionValues[i] =
        val;


    recalcPrice();

};


/*==================================================
    IMAGE UPLOAD OPTION
==================================================*/

window.uploadCustomImage =
async function(
    i,
    file
){

    if(!file){

        return;

    }


    const status =
        document.getElementById(
            `uploadStatus${i}`
        );


    if(status){

        status.innerHTML = `

            <div class="uploading">

                ⏳ Uploading
                <b>${escapeHtml(
                    file.name
                )}</b>...

            </div>

        `;

    }


    try{

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


        selected.options[i] =
            product.customOptions[i].price;


        selected.optionValues[i] =
            file.name;


        selected.imageLinks[i] =
            url;


        if(status){

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

    catch(err){

        console.error(
            err
        );


        if(status){

            status.innerHTML = `

                <div class="upload-error">

                    ❌ Upload Failed

                </div>

            `;

        }


        alert(
            err.message
        );

    }

};


/*==================================================
    PRICE
==================================================*/

function recalcPrice(){

    const base =

        product.salePrice &&
        product.salePrice <
        product.basePrice

        ?

        product.salePrice

        :

        product.basePrice;


    finalPrice =
        Number(base || 0);


    /*==============================================
        COLOR PRICE
    ==============================================*/

    if(
        selected.color
    ){

        finalPrice +=
            Number(
                selected.color.price ||
                0
            );

    }


    /*==============================================
        SIZE PRICE
    ==============================================*/

    if(
        selected.size
    ){

        finalPrice +=
            Number(
                selected.size.price ||
                0
            );

    }


    /*==============================================
        CUSTOM OPTIONS
    ==============================================*/

    Object
        .values(
            selected.options
        )
        .forEach(
            price => {

                finalPrice +=
                    Number(
                        price ||
                        0
                    );

            }
        );


    /*==============================================
        PAGE PRICE
    ==============================================*/

    const pagePrice =
        document.getElementById(
            "price"
        );


    if(pagePrice){

        pagePrice.innerText =
            finalPrice;

    }


    /*==============================================
        POPUP PRICE
    ==============================================*/

    const popupPrice =
        document.getElementById(
            "popupPrice"
        );


    if(popupPrice){

        popupPrice.innerText =
            "₹" +
            finalPrice;

    }

}


/*==================================================
    NEXT TO ADDRESS
==================================================*/

window.nextToAddress =
function(){

    const errors =
        validateRequiredSelections();


    if(
        errors.length
    ){

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


/*==================================================
    BACK TO CUSTOMIZE
==================================================*/

window.backToCustomize =
function(){

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


/*==================================================
    CUSTOMIZE POPUP
==================================================*/

function renderCustomizePopup(){

    const container =
        document.getElementById(
            "customOptionsContainer"
        );


    if(!container){

        return;

    }


    container.innerHTML =
        "";


    /*==============================================
        POPUP PRICE
    ==============================================*/

    const popupPrice =
        document.getElementById(
            "popupPrice"
        );


    if(popupPrice){

        popupPrice.innerText =
            "₹" +
            finalPrice;

    }


    if(
        !product.customOptions?.length
    ){

        return;

    }


    product.customOptions.forEach(
        (o,i) => {

            const wrap =
                document.createElement(
                    "div"
                );


            wrap.style.marginBottom =
                "16px";


            /*==========================================
                LABEL
            ==========================================*/

            const label =
                document.createElement(
                    "label"
                );


            label.innerHTML =
                escapeHtml(
                    o.label
                ) +
                (
                    o.required
                    ?
                    ' <span style="color:red">*</span>'
                    :
                    ""
                );


            wrap.appendChild(
                label
            );


            /*==========================================
                TEXT
            ==========================================*/

            if(
                o.type === "text"
            ){

                wrap.innerHTML += `

                    <input
                        class="custom-input"
                        placeholder="${escapeAttribute(
                            o.label
                        )}"
                        value="${escapeAttribute(
                            selected.optionValues[i] ||
                            ""
                        )}"
                        oninput="
                            addTextOption(
                                ${i},
                                this.value
                            );

                            document
                                .getElementById(
                                    'popupPrice'
                                )
                                .innerText =
                                '₹' + finalPrice;
                        "
                    >

                `;

            }


            /*==========================================
                CHECKBOX
            ==========================================*/

            else if(
                o.type === "checkbox"
            ){

                wrap.innerHTML += `

                    <div class="option-row">

                        <input
                            type="checkbox"
                            ${
                                selected.optionValues[i]
                                ?
                                "checked"
                                :
                                ""
                            }
                            onchange="
                                toggleCheckbox(
                                    ${i},
                                    this.checked
                                )
                            "
                        >


                        <span>

                            ${escapeHtml(
                                o.label
                            )}

                            (+₹${escapeHtml(
                                o.price
                            )})

                        </span>

                    </div>

                `;

            }


            /*==========================================
                DROPDOWN
            ==========================================*/

            else if(
                o.type === "dropdown"
            ){

                let options = `

                    <option value="">

                        Select
                        ${escapeHtml(
                            o.label
                        )}

                    </option>

                `;


                (
                    o.choices ||
                    []
                ).forEach(
                    choice => {

                        options += `

                            <option

                                value="${escapeAttribute(
                                    choice
                                )}"

                                ${
                                    selected.optionValues[i] ===
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
                                ${i},
                                this.value
                            );

                            document
                                .getElementById(
                                    'popupPrice'
                                )
                                .innerText =
                                '₹' +
                                finalPrice;
                        "

                    >

                        ${options}

                    </select>

                `;

            }


            /*==========================================
                IMAGE
            ==========================================*/

            else if(
                o.type === "image"
            ){

                wrap.innerHTML += `

                    <div class="upload-box">

                        <input
                            type="file"
                            accept="image/*"
                            onchange="
                                uploadCustomImage(
                                    ${i},
                                    this.files[0]
                                )
                            "
                        >


                        <small
                            id="uploadStatus${i}"
                        >

                            ${
                                selected.imageLinks[i]

                                ?

                                `

                                ✅
                                ${escapeHtml(
                                    selected.optionValues[i]
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

}


/*==================================================
    OPEN CUSTOMIZE POPUP
==================================================*/

window.openCustomizePopup =
function(){

    renderCustomizePopup();


    document
        .getElementById(
            "customizeOverlay"
        )
        ?.classList.remove(
            "hidden"
        );

};


/*==================================================
    CLOSE CUSTOMIZE POPUP
==================================================*/

window.closeCustomizePopup =
function(){

    document
        .getElementById(
            "customizeOverlay"
        )
        ?.classList.add(
            "hidden"
        );

};


/*==================================================
    CONTINUE AFTER CUSTOMIZE
==================================================*/

window.continueAfterCustomize =
function(){

    const errors =
        validateRequiredSelections();


    if(
        errors.length
    ){

        alert(
            errors.join("\n")
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


/*==================================================
    ORDER NOW
==================================================*/

window.orderNow =
function(){

    renderCustomizePopup();


    document
        .getElementById(
            "customizeOverlay"
        )
        ?.classList.remove(
            "hidden"
        );

};


/*==================================================
    WHATSAPP ORDER
==================================================*/

window.submitWaOrder =
async function(){

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


    /*==============================================
        VALIDATION
    ==============================================*/

    if(
        !name ||
        !phone ||
        !address ||
        !pincode
    ){

        alert(
            "⚠ Please fill all customer details"
        );

        return;

    }


    if(
        !/^[6-9]\d{9}$/.test(
            phone
        )
    ){

        alert(
            "⚠ Enter valid 10-digit mobile number"
        );

        return;

    }


    if(
        !/^\d{6}$/.test(
            pincode
        )
    ){

        alert(
            "⚠ Enter valid 6-digit pincode"
        );

        return;

    }


    /*==============================================
        WHATSAPP SETTINGS CHECK
    ==============================================*/

    const whatsappNumber =
        String(
            siteSettings.whatsapp ||
            ""
        )
        .replace(
            /\D/g,
            ""
        );


    if(
        !whatsappNumber
    ){

        alert(
            "WhatsApp number is not configured in Settings."
        );

        console.error(
            "WhatsApp number missing from settings/general"
        );

        return;

    }


    try{

        /*==========================================
            ORDER NUMBER
        ==========================================*/

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


        if(
            counterSnap.exists()
        ){

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

        else{

            await setDoc(
                counterRef,
                {
                    current:
                        nextNumber
                }
            );

        }


        const orderNumber =
            `IG-${nextNumber}`;


        /*==========================================
            SAVE ORDER
        ==========================================*/

        const orderData = {

            orderNumber:


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
                        selected.options ||
                        {}
                    )
                    .map(
                        i => ({

                            label:
                                product
                                    .customOptions?.[i]
                                    ?.label ||
                                "",


                            value:
                                selected
                                    .optionValues?.[i] ||
                                "",


                            image:
                                selected
                                    .imageLinks?.[i] ||
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


        /*==========================================
            WHATSAPP MESSAGE
        ==========================================*/

        const companyName =
            siteSettings.companyName ||
            "Imaginary Gifts";


        let msg =
            `🛍 *New Order — ${companyName}*\n\n`;


        msg +=
            `🧾 *Order No:* ${orderNumber}\n\n`;


        msg +=
            `👤 *Name:* ${name}\n`;


        msg +=
            `📞 *Mobile:* ${phone}\n`;


        msg +=
            `🏠 *Address:* ${address}\n`;


        msg +=
            `📮 *Pincode:* ${pincode}\n\n`;


        msg +=
            `📦 *Product:* ${product.name}\n`;


        /*==========================================
            COLOR
        ==========================================*/

        if(
            selected.color
        ){

            msg +=
                `🎨 Color: ${selected.color.name}\n`;

        }


        /*==========================================
            SIZE
        ==========================================*/

        if(
            selected.size
        ){

            msg +=
                `📏 Size: ${selected.size.name}\n`;

        }


        /*==========================================
            CUSTOM OPTIONS
        ==========================================*/

        if(
            Object.keys(
                selected.optionValues
            ).length
        ){

            msg +=
                `\n⚙ Options:\n`;


            Object
                .keys(
                    selected.optionValues
                )
                .forEach(
                    i => {

                        const option =
                            product
                                .customOptions?.[i];


                        if(!option){

                            return;

                        }


                        msg +=
                            `- ${option.label}: ${selected.optionValues[i]}\n`;


                        if(
                            selected.imageLinks[i]
                        ){

                            msg +=
                                `  Image: ${selected.imageLinks[i]}\n`;

                        }

                    }
                );

        }


        /*==========================================
            TOTAL
        ==========================================*/

        msg +=
            `\n💰 *Total:* ₹${finalPrice}\n`;


        /*==========================================
            PRODUCT LINK
        ==========================================*/

        msg +=
            `🔗 Product Link:\n${location.href}`;


        /*==========================================
            WHATSAPP URL
        ==========================================*/

        const whatsappUrl =
            `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                msg
            )}`;


        /*==========================================
            OPEN WHATSAPP
        ==========================================*/

        window.open(
            whatsappUrl,
            "_blank"
        );


        /*==========================================
            CLOSE FORM
        ==========================================*/

        document
            .getElementById(
                "waFormOverlay"
            )
            ?.classList.add(
                "hidden"
            );

    }

    catch(err){

        console.error(
            "WhatsApp order error:",
            err
        );


        alert(
            "Order failed: " +
            (
                err?.message ||
                "Unknown error"
            )
        );

    }

};


/*==================================================
    CLOSE WHATSAPP FORM
==================================================*/

window.closeWaForm =
function(){

    document
        .getElementById(
            "waFormOverlay"
        )
        ?.classList.add(
            "hidden"
        );

};


/*==================================================
    BUY NOW
==================================================*/

window.buyNow =
function(){

    const errors =
        validateRequiredSelections();


    if(
        errors.length
    ){

        showErrorModal(
            errors
        );

        return;

    }


    const data = {

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
            selected.imageLinks

    };


    localStorage.setItem(
        "checkoutData",
        JSON.stringify(
            data
        )
    );


    location.href =
        "order";

};


/*==================================================
    ERROR MODAL
==================================================*/

function showErrorModal(
    errors
){

    const modal =
        document.getElementById(
            "errorModal"
        );


    const list =
        document.getElementById(
            "errorList"
        );


    if(
        !modal ||
        !list
    ){

        alert(
            errors.join("\n")
        );

        return;

    }


    list.innerHTML =
        "";


    errors.forEach(
        err => {

            const li =
                document.createElement(
                    "li"
                );


            li.innerText =
                err;


            list.appendChild(
                li
            );

        }
    );


    modal.classList.remove(
        "hidden"
    );

}


/*==================================================
    CLOSE ERROR MODAL
==================================================*/

window.closeErrorModal =
function(){

    document
        .getElementById(
            "errorModal"
        )
        ?.classList.add(
            "hidden"
        );

};


/*==================================================
    OPTIONAL GLOBAL SETTINGS ACCESS
==================================================*/

window.siteSettings =
    siteSettings;


/*==================================================
    EXPORT
==================================================*/

export {

    loadProduct,

    loadSiteSettings

};