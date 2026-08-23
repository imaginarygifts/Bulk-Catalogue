/* =========================================================
   COUPON ADMIN
   PRODUCT-SPECIFIC + FREE SHIPPING
   MOBILE FRIENDLY
   FIREBASE FIRESTORE
========================================================= */

import { db } from "./firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    Timestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


/* =========================================================
   DOM
========================================================= */

const listBox =
    document.getElementById("couponList");


const codeInput =
    document.getElementById("code");


const typeInput =
    document.getElementById("type");


const valueInput =
    document.getElementById("value");


const discountValueBox =
    document.getElementById(
        "discountValueBox"
    );


const minOrderInput =
    document.getElementById("minOrder");


const expiryInput =
    document.getElementById("expiry");


const freeShippingInput =
    document.getElementById(
        "freeShipping"
    );


const freeShippingBox =
    document.getElementById(
        "freeShippingBox"
    );


const scopeInput =
    document.getElementById("scope");


const stackRuleInput =
    document.getElementById(
        "stackRule"
    );


/* =========================================================
   PRODUCT SELECTOR
========================================================= */

const productSelectorBox =
    document.getElementById(
        "productSelector"
    );


const productSearchInput =
    document.getElementById(
        "productSearch"
    );


const selectAllProductsButton =
    document.getElementById(
        "selectAllProducts"
    );


const clearProductsButton =
    document.getElementById(
        "clearProducts"
    );


const selectedProductCount =
    document.getElementById(
        "selectedProductCount"
    );


const productListBox =
    document.getElementById(
        "productList"
    );


/* =========================================================
   STATE
========================================================= */

let allProducts = [];

let selectedProductIds = [];


/* =========================================================
   INITIALIZE
========================================================= */

async function initCouponAdmin() {

    try {

        setupCouponType();

        setupScopeChange();

        await loadProducts();

        await loadCoupons();

    }

    catch (error) {

        console.error(
            "Coupon admin initialization error:",
            error
        );

    }

}


/* =========================================================
   COUPON TYPE CHANGE
========================================================= */

function setupCouponType() {

    if (!typeInput) {

        return;

    }


    typeInput.addEventListener(
        "change",
        updateCouponTypeUI
    );


    updateCouponTypeUI();

}


/* =========================================================
   UPDATE COUPON TYPE UI
========================================================= */

function updateCouponTypeUI() {

    if (!typeInput) {

        return;

    }


    const type =
        typeInput.value;


    /* =====================================================
       FREE SHIPPING ONLY
    ===================================================== */

    if (
        type === "free_shipping"
    ) {

        /*
           Hide discount value.
        */

        if (discountValueBox) {

            discountValueBox.style.display =
                "none";

        }


        /*
           Automatically enable
           free shipping.
        */

        if (freeShippingInput) {

            freeShippingInput.checked =
                true;

        }


        /*
           Hide checkbox because
           it is already automatically
           enabled.
        */

        if (freeShippingBox) {

            freeShippingBox.style.display =
                "none";

        }

    }

    else {

        /*
           Show discount value.
        */

        if (discountValueBox) {

            discountValueBox.style.display =
                "block";

        }


        /*
           Show Free Shipping checkbox
           for Percent and Flat.
        */

        if (freeShippingBox) {

            freeShippingBox.style.display =
                "block";

        }

    }

}


/* =========================================================
   SCOPE CHANGE
========================================================= */

function setupScopeChange() {

    if (!scopeInput) {

        console.warn(
            "#scope not found."
        );

        return;

    }


    scopeInput.addEventListener(
        "change",
        () => {

            updateProductSelectorVisibility();

        }
    );


    updateProductSelectorVisibility();

}


/* =========================================================
   PRODUCT SELECTOR VISIBILITY
========================================================= */

function updateProductSelectorVisibility() {

    if (
        !productSelectorBox ||
        !scopeInput
    ) {

        return;

    }


    const scope =
        String(
            scopeInput.value || ""
        )
            .trim()
            .toLowerCase();


    if (
        scope === "product"
    ) {

        productSelectorBox.style.display =
            "block";


        renderProductList(
            productSearchInput?.value ||
            ""
        );

    }

    else {

        productSelectorBox.style.display =
            "none";

    }

}


/* =========================================================
   PRODUCT SEARCH
========================================================= */

if (productSearchInput) {

    productSearchInput.addEventListener(
        "input",
        () => {

            renderProductList(
                productSearchInput.value
            );

        }
    );

}


/* =========================================================
   SELECT ALL PRODUCTS
========================================================= */

if (selectAllProductsButton) {

    selectAllProductsButton.addEventListener(
        "click",
        () => {

            const search =
                String(
                    productSearchInput?.value ||
                    ""
                )
                    .trim()
                    .toLowerCase();


            allProducts.forEach(
                product => {

                    const name =
                        String(
                            product.name ||
                            ""
                        )
                            .toLowerCase();


                    if (
                        !search ||
                        name.includes(search)
                    ) {

                        if (
                            !selectedProductIds.includes(
                                product.id
                            )
                        ) {

                            selectedProductIds.push(
                                product.id
                            );

                        }

                    }

                }
            );


            renderProductList(
                productSearchInput?.value ||
                ""
            );

        }
    );

}


/* =========================================================
   CLEAR PRODUCTS
========================================================= */

if (clearProductsButton) {

    clearProductsButton.addEventListener(
        "click",
        () => {

            selectedProductIds = [];


            renderProductList(
                productSearchInput?.value ||
                ""
            );

        }
    );

}


/* =========================================================
   LOAD PRODUCTS
========================================================= */

async function loadProducts() {

    if (!productListBox) {

        return;

    }


    productListBox.innerHTML = `

        <div class="coupon-loading-products">
            Loading products...
        </div>

    `;


    try {

        const snap =
            await getDocs(
                collection(
                    db,
                    "products"
                )
            );


        allProducts = [];


        snap.forEach(
            d => {

                const data =
                    d.data();


                allProducts.push({

                    id:
                        d.id,

                    ...data

                });

            }
        );


        allProducts.sort(
            (a, b) => {

                return String(
                    a.name || ""
                )
                    .localeCompare(
                        String(
                            b.name || ""
                        )
                    );

            }
        );


        renderProductList(
            productSearchInput?.value ||
            ""
        );

    }

    catch (error) {

        console.error(
            "Product loading error:",
            error
        );


        productListBox.innerHTML = `

            <div class="coupon-product-error">

                Unable to load products.

            </div>

        `;

    }

}


/* =========================================================
   RENDER PRODUCT LIST
========================================================= */

function renderProductList(
    searchText = ""
) {

    if (!productListBox) {

        return;

    }


    const search =
        String(
            searchText || ""
        )
            .trim()
            .toLowerCase();


    const filteredProducts =
        allProducts.filter(
            product => {

                const name =
                    String(
                        product.name ||
                        ""
                    )
                        .toLowerCase();


                return (
                    !search ||
                    name.includes(search)
                );

            }
        );


    productListBox.innerHTML =
        "";


    if (!allProducts.length) {

        productListBox.innerHTML = `

            <div class="coupon-no-products">

                No products available.

            </div>

        `;


        updateSelectedProductCount();

        return;

    }


    if (!filteredProducts.length) {

        productListBox.innerHTML = `

            <div class="coupon-no-products">

                No products found.

            </div>

        `;


        updateSelectedProductCount();

        return;

    }


    filteredProducts.forEach(
        product => {

            const row =
                document.createElement(
                    "label"
                );


            row.className =
                "product-row";


            const isSelected =
                selectedProductIds.includes(
                    product.id
                );


            if (isSelected) {

                row.classList.add(
                    "selected"
                );

            }


            /* Checkbox */

            const checkbox =
                document.createElement(
                    "input"
                );


            checkbox.type =
                "checkbox";


            checkbox.value =
                product.id;


            checkbox.checked =
                isSelected;


            checkbox.addEventListener(
                "change",
                () => {

                    if (
                        checkbox.checked
                    ) {

                        if (
                            !selectedProductIds.includes(
                                product.id
                            )
                        ) {

                            selectedProductIds.push(
                                product.id
                            );

                        }

                    }

                    else {

                        selectedProductIds =
                            selectedProductIds.filter(
                                id =>
                                    id !==
                                    product.id
                            );

                    }


                    row.classList.toggle(
                        "selected",
                        checkbox.checked
                    );


                    updateSelectedProductCount();

                }
            );


            /* Product image */

            const image =
                document.createElement(
                    "img"
                );


            image.className =
                "product-image";


            image.src =
                product.images?.[0] ||
                product.image ||
                "";


            image.alt =
                product.name ||
                "Product";


            image.loading =
                "lazy";


            image.onerror =
                () => {

                    image.style.display =
                        "none";

                };


            /* Product info */

            const info =
                document.createElement(
                    "div"
                );


            info.className =
                "product-info";


            const name =
                document.createElement(
                    "div"
                );


            name.className =
                "product-name";


            name.textContent =
                product.name ||
                "Unnamed Product";


            const price =
                document.createElement(
                    "div"
                );


            price.className =
                "product-price";


            const productPrice =
                Number(
                    product.salePrice ??
                    product.basePrice ??
                    0
                );


            price.textContent =
                productPrice > 0
                    ?
                    `₹${productPrice}`
                    :
                    "";


            info.appendChild(
                name
            );


            info.appendChild(
                price
            );


            row.appendChild(
                checkbox
            );


            row.appendChild(
                image
            );


            row.appendChild(
                info
            );


            productListBox.appendChild(
                row
            );

        }
    );


    updateSelectedProductCount();

}


/* =========================================================
   SELECTED PRODUCT COUNT
========================================================= */

function updateSelectedProductCount() {

    if (!selectedProductCount) {

        return;

    }


    const count =
        selectedProductIds.length;


    selectedProductCount.textContent =
        `${count} product${
            count === 1
                ? ""
                : "s"
        } selected`;

}


/* =========================================================
   SAVE COUPON
========================================================= */

window.saveCoupon =
async function () {

    try {

        /* =================================================
           BASIC VALUES
        ================================================= */

        const code =
            codeInput?.value
                ?.trim()
                .toUpperCase() ||
            "";


        const type =
            typeInput?.value ||
            "percent";


        /*
           Free shipping coupon has
           no discount value.
        */

        let value = 0;


        if (
            type !== "free_shipping"
        ) {

            value =
                Number(
                    valueInput?.value ||
                    0
                );

        }


        const minOrder =
            Number(
                minOrderInput?.value ||
                0
            );


        const expiryRaw =
            expiryInput?.value ||
            "";


        const scope =
            scopeInput?.value ||
            "global";


        const stackRule =
            stackRuleInput?.value ||
            "stack";


        /* =================================================
           FREE SHIPPING
        ================================================= */

        let freeShipping =
            false;


        if (
            type === "free_shipping"
        ) {

            freeShipping =
                true;

        }

        else {

            freeShipping =
                freeShippingInput?.checked ||
                false;

        }


        /* =================================================
           PAYMENT MODES
        ================================================= */

        const modes =
            [
                ...document.querySelectorAll(
                    ".payMode:checked"
                )
            ]
                .map(
                    checkbox =>
                        checkbox.value
                );


        /* =================================================
           VALIDATION
        ================================================= */

        if (!code) {

            alert(
                "Please enter coupon code."
            );


            codeInput?.focus();

            return;

        }


        /*
           Discount value is required
           only for Percent and Flat.
        */

        if (
            type !== "free_shipping" &&
            value <= 0
        ) {

            alert(
                "Please enter a valid discount value."
            );


            valueInput?.focus();

            return;

        }


        if (!expiryRaw) {

            alert(
                "Please select coupon expiry."
            );


            expiryInput?.focus();

            return;

        }


        if (!modes.length) {

            alert(
                "Please select at least one payment mode."
            );

            return;

        }


        /* =================================================
           PRODUCT-SPECIFIC VALIDATION
        ================================================= */

        if (
            scope === "product"
        ) {

            if (
                !selectedProductIds.length
            ) {

                alert(
                    "Please select at least one product."
                );

                return;

            }

        }


        /* =================================================
           PERCENT VALIDATION
        ================================================= */

        if (
            type === "percent" &&
            value > 100
        ) {

            alert(
                "Percentage discount cannot be more than 100%."
            );


            valueInput?.focus();

            return;

        }


        /* =================================================
           EXPIRY
        ================================================= */

        const expiry =
            new Date(
                expiryRaw
            );


        if (
            Number.isNaN(
                expiry.getTime()
            )
        ) {

            alert(
                "Please select a valid expiry date."
            );

            return;

        }


        /*
           Set expiry to end of selected date.

           Example:
           24 Aug → 24 Aug 11:59:59 PM
        */

        expiry.setHours(
            23,
            59,
            59,
            999
        );


        /* =================================================
           PRODUCT IDS
        ================================================= */

        const productIds =
            scope === "product"
                ?
                [
                    ...selectedProductIds
                ]
                :
                [];


        /* =================================================
           COUPON DATA
        ================================================= */

        const couponData = {

            code,

            /*
               percent
               flat
               free_shipping
            */

            type,

            /*
               0 for free shipping.
            */

            value,

            minOrder,

            expiry:
                Timestamp.fromDate(
                    expiry
                ),

            scope,

            productIds,

            allowedModes:
                modes,

            /*
               true if:
               - coupon type is free_shipping
               OR
               - checkbox is selected.
            */

            freeShipping,

            stackRule,

            createdAt:
                Date.now(),

            active:
                true

        };


        console.log(
            "Saving coupon:",
            couponData
        );


        /* =================================================
           FIRESTORE
        ================================================= */

        await addDoc(
            collection(
                db,
                "coupons"
            ),
            couponData
        );


        alert(
            "Coupon saved successfully."
        );


        /* =================================================
           RESET
        ================================================= */

        clearForm();


        /* =================================================
           RELOAD
        ================================================= */

        await loadCoupons();

    }

    catch (error) {

        console.error(
            "Coupon save error:",
            error
        );


        alert(
            "Error saving coupon: " +
            (
                error?.message ||
                "Unknown error"
            )
        );

    }

};


/* =========================================================
   LOAD COUPONS
========================================================= */

async function loadCoupons() {

    if (!listBox) {

        return;

    }


    listBox.innerHTML = `

        <div class="coupon-loading">

            Loading coupons...

        </div>

    `;


    try {

        const snap =
            await getDocs(
                collection(
                    db,
                    "coupons"
                )
            );


        listBox.innerHTML =
            "";


        if (
            snap.empty
        ) {

            listBox.innerHTML = `

                <div class="coupon-empty">

                    No coupons created yet.

                </div>

            `;

            return;

        }


        const coupons = [];


        snap.forEach(
            d => {

                coupons.push({

                    id:
                        d.id,

                    ...d.data()

                });

            }
        );


        coupons.sort(
            (a, b) => {

                return Number(
                    b.createdAt ||
                    0
                ) -
                Number(
                    a.createdAt ||
                    0
                );

            }
        );


        coupons.forEach(
            coupon => {

                renderCouponCard(
                    coupon
                );

            }
        );

    }

    catch (error) {

        console.error(
            "Coupon loading error:",
            error
        );


        listBox.innerHTML = `

            <div class="coupon-error">

                <b>
                    Unable to load coupons.
                </b>

                <small>
                    ${escapeHtml(
                        error?.message ||
                        ""
                    )}
                </small>

            </div>

        `;

    }

}


/* =========================================================
   RENDER COUPON CARD
========================================================= */

function renderCouponCard(
    coupon
) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "coupon-card";


    /* =====================================================
       EXPIRY
    ===================================================== */

    const expiry =
        coupon.expiry?.toDate
            ?
            coupon.expiry
                .toDate()
                .toLocaleDateString(
                    "en-IN"
                )
            :
            "N/A";


    /* =====================================================
       DISCOUNT TEXT
    ===================================================== */

    let discountText =
        "";


    if (
        coupon.type ===
        "free_shipping"
    ) {

        discountText =
            "FREE SHIPPING";

    }

    else if (
        coupon.type ===
        "percent"
    ) {

        discountText =
            `${coupon.value}% OFF`;

    }

    else {

        discountText =
            `₹${coupon.value} OFF`;

    }


    /* =====================================================
       SHIPPING TEXT
    ===================================================== */

    const shippingText =
        coupon.freeShipping
            ?
            " + Free Shipping"
            :
            "";


    /* =====================================================
       PAYMENT MODES
    ===================================================== */

    const modes =
        Array.isArray(
            coupon.allowedModes
        )
            ?
            coupon.allowedModes
                .map(
                    mode =>
                        formatPaymentMode(
                            mode
                        )
                )
                .join(", ")
            :
            "All";


    /* =====================================================
       PRODUCT IDS
    ===================================================== */

    const productIds =
        Array.isArray(
            coupon.productIds
        )
            ?
            coupon.productIds
            :
            [];


    /* =====================================================
       PRODUCT NAMES
    ===================================================== */

    const productNames =
        productIds.map(
            id => {

                const product =
                    allProducts.find(
                        item =>
                            item.id ===
                            id
                    );


                return product?.name ||
                    id;

            }
        );


    /* =====================================================
       PRODUCT HTML
    ===================================================== */

    let productHTML =
        "";


    if (
        coupon.scope ===
        "product"
    ) {

        if (
            productNames.length
        ) {

            productHTML = `

                <div class="coupon-products">

                    <div class="coupon-products-title">

                        Products

                    </div>


                    <div class="coupon-product-tags">

                        ${
                            productNames
                                .map(
                                    name => `

                                        <span
                                            class="coupon-product-tag"
                                        >

                                            ${escapeHtml(
                                                name
                                            )}

                                        </span>

                                    `
                                )
                                .join("")
                        }

                    </div>

                </div>

            `;

        }

        else {

            productHTML = `

                <div class="coupon-products warning">

                    Product-specific coupon

                    <small>
                        No products assigned
                    </small>

                </div>

            `;

        }

    }


    /* =====================================================
       SHIPPING BADGE
    ===================================================== */

    let shippingHTML =
        "";


    if (
        coupon.freeShipping
    ) {

        shippingHTML = `

            <div class="coupon-shipping-badge">

                🚚 Free Shipping

            </div>

        `;

    }


    /* =====================================================
       CARD
    ===================================================== */

    card.innerHTML = `

        <div class="coupon-card-top">

            <div>

                <div class="coupon-code">

                    ${escapeHtml(
                        coupon.code ||
                        ""
                    )}

                </div>


                <div class="coupon-discount">

                    ${escapeHtml(
                        discountText
                    )}

                    ${
                        shippingText
                    }

                </div>

            </div>


            <span class="coupon-status">

                ${
                    coupon.active
                        ?
                        "Active"
                        :
                        "Inactive"
                }

            </span>

        </div>


        ${shippingHTML}


        <div class="coupon-details">

            <div class="coupon-detail">

                <span>
                    Minimum Order
                </span>

                <b>
                    ₹${Number(
                        coupon.minOrder ||
                        0
                    )}
                </b>

            </div>


            <div class="coupon-detail">

                <span>
                    Coupon Expiry
                </span>

                <b>
                    ${escapeHtml(
                        expiry
                    )}
                </b>

            </div>


            <div class="coupon-detail">

                <span>
                    Payment Modes
                </span>

                <b>
                    ${escapeHtml(
                        modes
                    )}
                </b>

            </div>


            <div class="coupon-detail">

                <span>
                    Scope
                </span>

                <b>

                    ${
                        coupon.scope ===
                        "product"

                            ?

                            "Product Specific"

                            :

                            "Global"

                    }

                </b>

            </div>


            <div class="coupon-detail">

                <span>
                    Rule
                </span>

                <b>
                    ${escapeHtml(
                        coupon.stackRule ||
                        "stack"
                    )}
                </b>

            </div>

        </div>


        ${productHTML}


        <button
            type="button"
            class="coupon-delete"
            onclick="deleteCoupon('${escapeAttribute(
                coupon.id
            )}')"
        >

            Delete Coupon

        </button>

    `;


    listBox.appendChild(
        card
    );

}


/* =========================================================
   DELETE COUPON
========================================================= */

window.deleteCoupon =
async function(id) {

    if (
        !confirm(
            "Delete this coupon?"
        )
    ) {

        return;

    }


    try {

        await deleteDoc(
            doc(
                db,
                "coupons",
                id
            )
        );


        await loadCoupons();

    }

    catch (error) {

        console.error(
            "Delete coupon error:",
            error
        );


        alert(
            "Unable to delete coupon: " +
            (
                error?.message ||
                ""
            )
        );

    }

};


/* =========================================================
   CLEAR FORM
========================================================= */

function clearForm() {

    if (codeInput) {

        codeInput.value =
            "";

    }


    if (valueInput) {

        valueInput.value =
            "";

    }


    if (minOrderInput) {

        minOrderInput.value =
            "";

    }


    if (expiryInput) {

        expiryInput.value =
            "";

    }


    if (freeShippingInput) {

        freeShippingInput.checked =
            false;

    }


    /* Payment modes */

    document
        .querySelectorAll(
            ".payMode"
        )
        .forEach(
            checkbox => {

                checkbox.checked =
                    false;

            }
        );


    /* Scope */

    if (scopeInput) {

        scopeInput.value =
            "global";

    }


    /* Type */

    if (typeInput) {

        typeInput.value =
            "percent";

    }


    /* Products */

    selectedProductIds =
        [];


    if (productSearchInput) {

        productSearchInput.value =
            "";

    }


    updateSelectedProductCount();

    updateCouponTypeUI();

    updateProductSelectorVisibility();

    renderProductList(
        ""
    );

}


/* =========================================================
   PAYMENT MODE FORMAT
========================================================= */

function formatPaymentMode(
    mode
) {

    switch (
        String(
            mode || ""
        )
            .toLowerCase()
    ) {

        case "online":

            return "Online";


        case "cod":

            return "COD";


        case "advance":

            return "Advance";


        default:

            return mode ||
                "";

    }

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(
    value
) {

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


/* =========================================================
   ESCAPE ATTRIBUTE
========================================================= */

function escapeAttribute(
    value
) {

    return escapeHtml(
        value
    );

}


/* =========================================================
   START
========================================================= */

initCouponAdmin();