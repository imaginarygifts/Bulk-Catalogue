/* =========================================================
   COUPON ADMIN
   PRODUCT-SPECIFIC + MOBILE FRIENDLY VERSION
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

const minOrderInput =
    document.getElementById("minOrder");

const expiryInput =
    document.getElementById("expiry");

const scopeInput =
    document.getElementById("scope");

const stackRuleInput =
    document.getElementById("stackRule");


/* =========================================================
   STATE
========================================================= */

let allProducts = [];

let selectedProductIds = [];

let productSelectorBox = null;

let productSearchInput = null;

let productListBox = null;

let selectedProductCount = null;


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        createProductSelector();

        setupScopeChange();

        await loadProducts();

        await loadCoupons();

    }
);


/*
   Important:
   This also handles module scripts where DOMContentLoaded
   may already have fired.
*/

if (
    document.readyState === "interactive" ||
    document.readyState === "complete"
) {

    setTimeout(
        async () => {

            createProductSelector();

            setupScopeChange();

            await loadProducts();

            await loadCoupons();

        },
        0
    );

}


/* =========================================================
   CREATE PRODUCT SELECTOR
========================================================= */

function createProductSelector() {

    if (!scopeInput) {

        console.warn(
            "Coupon scope select #scope not found."
        );

        return;

    }


    /*
       Prevent duplicate selector
    */

    if (
        document.getElementById(
            "couponProductSelector"
        )
    ) {

        productSelectorBox =
            document.getElementById(
                "couponProductSelector"
            );

        productSearchInput =
            document.getElementById(
                "couponProductSearch"
            );

        productListBox =
            document.getElementById(
                "couponProductList"
            );

        selectedProductCount =
            document.getElementById(
                "couponSelectedProductCount"
            );

        return;

    }


    /* =====================================================
       MAIN WRAPPER
    ===================================================== */

    productSelectorBox =
        document.createElement("div");

    productSelectorBox.id =
        "couponProductSelector";

    productSelectorBox.className =
        "coupon-product-selector";


    /* =====================================================
       TITLE
    ===================================================== */

    const title =
        document.createElement("div");

    title.className =
        "coupon-product-title";

    title.innerText =
        "Select Products";


    /* =====================================================
       SEARCH
    ===================================================== */

    productSearchInput =
        document.createElement("input");

    productSearchInput.id =
        "couponProductSearch";

    productSearchInput.type =
        "search";

    productSearchInput.placeholder =
        "Search product...";

    productSearchInput.autocomplete =
        "off";


    productSearchInput.addEventListener(
        "input",
        () => {

            renderProductList(
                productSearchInput.value
            );

        }
    );


    /* =====================================================
       ACTION ROW
    ===================================================== */

    const actionRow =
        document.createElement("div");

    actionRow.className =
        "coupon-product-actions";


    const selectAllButton =
        document.createElement("button");

    selectAllButton.type =
        "button";

    selectAllButton.className =
        "coupon-small-button";

    selectAllButton.innerText =
        "Select All";


    selectAllButton.onclick =
        () => {

            const search =
                productSearchInput.value
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
                productSearchInput.value
            );

        };


    const clearButton =
        document.createElement("button");

    clearButton.type =
        "button";

    clearButton.className =
        "coupon-small-button";

    clearButton.innerText =
        "Clear";


    clearButton.onclick =
        () => {

            selectedProductIds = [];

            renderProductList(
                productSearchInput.value
            );

        };


    actionRow.appendChild(
        selectAllButton
    );

    actionRow.appendChild(
        clearButton
    );


    /* =====================================================
       COUNT
    ===================================================== */

    selectedProductCount =
        document.createElement("div");

    selectedProductCount.id =
        "couponSelectedProductCount";

    selectedProductCount.className =
        "coupon-selected-count";

    selectedProductCount.innerText =
        "0 products selected";


    /* =====================================================
       PRODUCT LIST
    ===================================================== */

    productListBox =
        document.createElement("div");

    productListBox.id =
        "couponProductList";

    productListBox.className =
        "coupon-product-list";


    /* =====================================================
       APPEND
    ===================================================== */

    productSelectorBox.appendChild(
        title
    );

    productSelectorBox.appendChild(
        productSearchInput
    );

    productSelectorBox.appendChild(
        actionRow
    );

    productSelectorBox.appendChild(
        selectedProductCount
    );

    productSelectorBox.appendChild(
        productListBox
    );


    /*
       Insert directly after scope select.
    */

    const parent =
        scopeInput.parentElement;


    if (parent) {

        parent.appendChild(
            productSelectorBox
        );

    }

    else {

        scopeInput.after(
            productSelectorBox
        );

    }


    /*
       Hidden initially
    */

    productSelectorBox.style.display =
        "none";

}


/* =========================================================
   SCOPE CHANGE
========================================================= */

function setupScopeChange() {

    if (!scopeInput) {

        return;

    }


    /*
       Avoid duplicate listener
    */

    if (
        scopeInput.dataset
            .couponListenerAttached ===
        "true"
    ) {

        updateProductSelectorVisibility();

        return;

    }


    scopeInput.dataset
        .couponListenerAttached =
        "true";


    scopeInput.addEventListener(
        "change",
        () => {

            updateProductSelectorVisibility();

        }
    );


    updateProductSelectorVisibility();

}


/* =========================================================
   SHOW / HIDE PRODUCT SELECTOR
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
            scopeInput.value ||
            ""
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
   LOAD PRODUCTS
========================================================= */

async function loadProducts() {

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


        /*
           Sort alphabetically
        */

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
            ""
        );


        console.log(
            "Coupon products loaded:",
            allProducts.length
        );

    }

    catch (error) {

        console.error(
            "Product loading error:",
            error
        );

        if (productListBox) {

            productListBox.innerHTML = `

                <div class="coupon-product-error">

                    Unable to load products.

                </div>

            `;

        }

    }

}


/* =========================================================
   RENDER PRODUCT LIST
========================================================= */

function renderProductList(
    searchText = ""
) {

    if (
        !productListBox
    ) {

        return;

    }


    const search =
        String(
            searchText ||
            ""
        )
            .trim()
            .toLowerCase();


    const filtered =
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


    if (
        !filtered.length
    ) {

        productListBox.innerHTML = `

            <div class="coupon-no-products">

                No products found.

            </div>

        `;


        updateSelectedCount();

        return;

    }


    filtered.forEach(
        product => {

            const row =
                document.createElement(
                    "label"
                );


            row.className =
                "coupon-product-row";


            if (
                selectedProductIds.includes(
                    product.id
                )
            ) {

                row.classList.add(
                    "selected"
                );

            }


            const checkbox =
                document.createElement(
                    "input"
                );


            checkbox.type =
                "checkbox";


            checkbox.checked =
                selectedProductIds.includes(
                    product.id
                );


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


                    updateSelectedCount();

                }
            );


            /* =================================================
               IMAGE
            ================================================= */

            const image =
                document.createElement(
                    "img"
                );


            image.className =
                "coupon-product-image";


            image.src =
                product.images?.[0] ||
                product.image ||
                "";


            image.alt =
                product.name ||
                "Product";


            image.onerror =
                () => {

                    image.style.display =
                        "none";

                };


            /* =================================================
               INFO
            ================================================= */

            const info =
                document.createElement(
                    "div"
                );


            info.className =
                "coupon-product-info";


            const name =
                document.createElement(
                    "div"
                );


            name.className =
                "coupon-product-name";


            name.innerText =
                product.name ||
                "Unnamed Product";


            const price =
                document.createElement(
                    "div"
                );


            price.className =
                "coupon-product-price";


            const productPrice =
                Number(
                    product.salePrice ??
                    product.basePrice ??
                    0
                );


            price.innerText =
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


    updateSelectedCount();

}


/* =========================================================
   SELECTED COUNT
========================================================= */

function updateSelectedCount() {

    if (
        selectedProductCount
    ) {

        selectedProductCount.innerText =
            `${selectedProductIds.length} product${
                selectedProductIds.length === 1
                    ? ""
                    : "s"
            } selected`;

    }

}


/* =========================================================
   SAVE COUPON
========================================================= */

window.saveCoupon =
async function () {

    try {

        const code =
            codeInput?.value
                ?.trim()
                .toUpperCase() ||
            "";


        const type =
            typeInput?.value ||
            "percent";


        const value =
            Number(
                valueInput?.value ||
                0
            );


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


        /* =====================================================
           PAYMENT MODES
        ===================================================== */

        const modes =
            [
                ...document.querySelectorAll(
                    ".payMode:checked"
                )
            ]
                .map(
                    x =>
                        x.value
                );


        /* =====================================================
           VALIDATION
        ===================================================== */

        if (
            !code ||
            !value ||
            !expiryRaw
        ) {

            alert(
                "Please fill all required fields."
            );

            return;

        }


        if (
            value < 0
        ) {

            alert(
                "Discount value cannot be negative."
            );

            return;

        }


        if (
            !modes.length
        ) {

            alert(
                "Please select at least one payment mode."
            );

            return;

        }


        /* =====================================================
           PRODUCT SPECIFIC VALIDATION
        ===================================================== */

        if (
            scope === "product" &&
            !selectedProductIds.length
        ) {

            alert(
                "Please select at least one product for this coupon."
            );

            return;

        }


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


        /* =====================================================
           FIRESTORE DATA
        ===================================================== */

        const couponData = {

            code,

            type,

            value,

            minOrder,

            expiry:
                Timestamp.fromDate(
                    expiry
                ),

            scope,

            allowedModes:
                modes,

            stackRule,

            /*
               VERY IMPORTANT:
               Only store product IDs for
               product-specific coupons.
            */

            productIds:
                scope === "product"
                    ?
                    [...selectedProductIds]
                    :
                    [],

            createdAt:
                Date.now(),

            active:
                true

        };


        console.log(
            "Saving coupon:",
            couponData
        );


        /* =====================================================
           SAVE
        ===================================================== */

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


        clearForm();


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

        console.error(
            "Element #couponList not found."
        );

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


        /*
           Newest first
        */

        coupons.sort(
            (a, b) =>
                Number(
                    b.createdAt ||
                    0
                ) -
                Number(
                    a.createdAt ||
                    0
                )
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

                <b>Unable to load coupons.</b>

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
   RENDER COUPON
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


    const discountText =
        coupon.type === "percent"
            ?
            `${coupon.value}% OFF`
            :
            `₹${coupon.value} OFF`;


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
        productIds
            .map(
                id => {

                    const product =
                        allProducts.find(
                            p =>
                                p.id === id
                        );


                    return product?.name ||
                        id;

                }
            );


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

                        Products:

                    </div>

                    <div class="coupon-product-tags">

                        ${productNames
                            .map(
                                name => `

                                    <span class="coupon-product-tag">

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
                    <br>

                    <small>
                        No products assigned
                    </small>

                </div>

            `;

        }

    }


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
                    Expiry
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


    /*
       Reset payment modes
    */

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


    /*
       Reset scope
    */

    if (scopeInput) {

        scopeInput.value =
            "global";

    }


    /*
       Reset product selection
    */

    selectedProductIds =
        [];


    if (productSearchInput) {

        productSearchInput.value =
            "";

    }


    updateSelectedCount();

    updateProductSelectorVisibility();

    renderProductList(
        ""
    );

}


/* =========================================================
   FORMAT PAYMENT MODE
========================================================= */

function formatPaymentMode(
    mode
) {

    switch (
        String(
            mode ||
            ""
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
        value ??
        ""
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
   MANUAL GLOBAL START
========================================================= */

(async function startCouponAdmin() {

    try {

        createProductSelector();

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

})();