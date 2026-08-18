/* ==================================================
   COUPON ADMIN
   MOBILE FRIENDLY + PRODUCT SPECIFIC COUPONS
================================================== */

import { db } from "./firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    Timestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


/* ==================================================
   DOM
================================================== */

const listBox =
    document.getElementById("couponList");

const scopeSelect =
    document.getElementById("scope");


/* ==================================================
   GLOBAL STATE
================================================== */

let products = [];

let selectedProductIds = new Set();


/* ==================================================
   MOBILE / UI CSS
================================================== */

function injectCouponStyles() {

    if (
        document.getElementById(
            "couponAdminStyles"
        )
    ) {
        return;
    }


    const style =
        document.createElement("style");

    style.id =
        "couponAdminStyles";


    style.textContent = `

        /* ==========================================
           MAIN COUPON PAGE
        ========================================== */

        .coupon-page,
        #couponList {

            width: 100%;

            box-sizing: border-box;

        }


        /* ==========================================
           FORM
        ========================================== */

        #couponForm,
        .coupon-form {

            width: 100%;

            max-width: 900px;

            margin: 0 auto;

            box-sizing: border-box;

        }


        #couponForm input,
        #couponForm select,
        .coupon-form input,
        .coupon-form select {

            width: 100%;

            min-height: 46px;

            box-sizing: border-box;

            border-radius: 10px;

            padding: 12px 14px;

            font-size: 14px;

        }


        /* ==========================================
           PAYMENT MODES
        ========================================== */

        .coupon-payment-modes {

            display: grid;

            grid-template-columns:
                repeat(3, 1fr);

            gap: 10px;

            margin: 12px 0;

        }


        .coupon-payment-mode {

            display: flex;

            align-items: center;

            gap: 8px;

            padding: 12px;

            border-radius: 10px;

            border: 1px solid
                rgba(255,255,255,.10);

            background:
                rgba(255,255,255,.04);

            cursor: pointer;

        }


        .coupon-payment-mode input {

            width: auto !important;

            min-height: auto !important;

        }


        /* ==========================================
           PRODUCT PICKER
        ========================================== */

        #productSelectorBox {

            display: none;

            margin-top: 12px;

            padding: 14px;

            border-radius: 14px;

            background:
                rgba(255,255,255,.035);

            border: 1px solid
                rgba(255,255,255,.08);

            box-sizing: border-box;

        }


        #productSelectorBox.show {

            display: block;

        }


        .product-selector-title {

            font-size: 15px;

            font-weight: 700;

            margin-bottom: 10px;

        }


        #productSearch {

            width: 100%;

            min-height: 44px;

            padding: 11px 13px;

            box-sizing: border-box;

            border-radius: 10px;

            border: 1px solid
                rgba(255,255,255,.12);

            background:
                rgba(255,255,255,.06);

            color: inherit;

            outline: none;

        }


        .selected-product-count {

            margin-top: 10px;

            margin-bottom: 10px;

            font-size: 13px;

            opacity: .75;

        }


        #productList {

            display: grid;

            grid-template-columns:
                repeat(2, minmax(0, 1fr));

            gap: 10px;

            max-height: 360px;

            overflow-y: auto;

            padding-right: 2px;

        }


        /* ==========================================
           PRODUCT ITEM
        ========================================== */

        .coupon-product-item {

            display: flex;

            align-items: center;

            gap: 10px;

            padding: 10px;

            border-radius: 12px;

            border: 1px solid
                rgba(255,255,255,.08);

            background:
                rgba(255,255,255,.035);

            cursor: pointer;

            transition:
                .15s ease;

        }


        .coupon-product-item:hover {

            background:
                rgba(255,255,255,.07);

        }


        .coupon-product-item.selected {

            border-color:
                #00d9ff;

            background:
                rgba(0,217,255,.08);

        }


        .coupon-product-item input {

            width: auto !important;

            min-height: auto !important;

            flex-shrink: 0;

        }


        .coupon-product-image {

            width: 48px;

            height: 48px;

            border-radius: 8px;

            object-fit: cover;

            background: #222;

            flex-shrink: 0;

        }


        .coupon-product-info {

            min-width: 0;

            flex: 1;

        }


        .coupon-product-name {

            font-size: 13px;

            font-weight: 600;

            line-height: 1.3;

            overflow: hidden;

            text-overflow: ellipsis;

            display: -webkit-box;

            -webkit-line-clamp: 2;

            -webkit-box-orient: vertical;

        }


        .coupon-product-price {

            margin-top: 4px;

            font-size: 12px;

            opacity: .7;

        }


        /* ==========================================
           SELECT ALL
        ========================================== */

        .product-selector-actions {

            display: flex;

            gap: 8px;

            margin: 10px 0;

        }


        .product-selector-actions button {

            flex: 1;

            min-height: 40px;

            border: none;

            border-radius: 9px;

            cursor: pointer;

        }


        /* ==========================================
           COUPON CARDS
        ========================================== */

        .coupon-card {

            width: 100%;

            box-sizing: border-box;

            padding: 16px;

            margin-bottom: 12px;

            border-radius: 14px;

            background:
                #17181c;

            border: 1px solid
                rgba(255,255,255,.09);

            overflow: hidden;

        }


        .coupon-card-header {

            display: flex;

            align-items: flex-start;

            justify-content: space-between;

            gap: 12px;

        }


        .coupon-card-code {

            font-size: 17px;

            font-weight: 800;

            word-break: break-word;

        }


        .coupon-card-value {

            padding: 5px 9px;

            border-radius: 7px;

            background:
                rgba(0,217,255,.12);

            color:
                #00d9ff;

            font-size: 12px;

            font-weight: 700;

            white-space: nowrap;

        }


        .coupon-card-details {

            display: grid;

            grid-template-columns:
                repeat(2, 1fr);

            gap: 7px;

            margin-top: 12px;

            font-size: 13px;

            opacity: .82;

        }


        .coupon-detail {

            min-width: 0;

            word-break: break-word;

        }


        .coupon-products {

            margin-top: 12px;

            padding-top: 12px;

            border-top: 1px solid
                rgba(255,255,255,.07);

        }


        .coupon-products-title {

            font-size: 12px;

            opacity: .6;

            margin-bottom: 8px;

        }


        .coupon-product-tag {

            display: inline-block;

            margin: 3px;

            padding: 5px 8px;

            border-radius: 7px;

            background:
                rgba(255,255,255,.07);

            font-size: 11px;

        }


        .coupon-delete {

            width: 100%;

            min-height: 40px;

            margin-top: 14px;

            border: none;

            border-radius: 9px;

            background:
                #25262b;

            color: #fff;

            cursor: pointer;

        }


        .coupon-delete:hover {

            background:
                #d83a3a;

        }


        /* ==========================================
           MOBILE
        ========================================== */

        @media (max-width: 600px) {

            #couponForm,
            .coupon-form {

                padding:
                    0 12px;

            }


            .coupon-payment-modes {

                grid-template-columns:
                    1fr;

            }


            #productList {

                grid-template-columns:
                    1fr;

                max-height: 320px;

            }


            .coupon-card {

                padding: 14px;

                border-radius: 12px;

            }


            .coupon-card-details {

                grid-template-columns:
                    1fr;

            }


            .coupon-card-header {

                align-items:
                    flex-start;

            }


            .coupon-card-code {

                font-size: 16px;

            }


            #couponList {

                padding:
                    0 12px;

            }

        }

    `;


    document.head.appendChild(
        style
    );

}


/* ==================================================
   CREATE PRODUCT SELECTOR
================================================== */

function createProductSelector() {

    if (
        document.getElementById(
            "productSelectorBox"
        )
    ) {
        return;
    }


    if (!scopeSelect) {
        return;
    }


    const box =
        document.createElement("div");

    box.id =
        "productSelectorBox";


    box.innerHTML = `

        <div class="product-selector-title">

            Select Products

        </div>


        <input
            type="search"
            id="productSearch"
            placeholder="Search products..."
            autocomplete="off"
        >


        <div
            class="selected-product-count"
            id="selectedProductCount"
        >

            0 products selected

        </div>


        <div class="product-selector-actions">

            <button
                type="button"
                id="selectAllProducts"
            >

                Select All

            </button>


            <button
                type="button"
                id="clearAllProducts"
            >

                Clear All

            </button>

        </div>


        <div id="productList">

            Loading products...

        </div>

    `;


    scopeSelect.insertAdjacentElement(
        "afterend",
        box
    );


    document
        .getElementById(
            "productSearch"
        )
        ?.addEventListener(
            "input",
            renderProductList
        );


    document
        .getElementById(
            "selectAllProducts"
        )
        ?.addEventListener(
            "click",
            selectAllProducts
        );


    document
        .getElementById(
            "clearAllProducts"
        )
        ?.addEventListener(
            "click",
            clearAllProducts
        );


    scopeSelect.addEventListener(
        "change",
        handleScopeChange
    );


    handleScopeChange();

}


/* ==================================================
   SCOPE CHANGE
================================================== */

function handleScopeChange() {

    const box =
        document.getElementById(
            "productSelectorBox"
        );


    if (!box) {
        return;
    }


    const isProductSpecific =
        scopeSelect?.value ===
        "product";


    if (
        isProductSpecific
    ) {

        box.classList.add(
            "show"
        );

        renderProductList();

    }

    else {

        box.classList.remove(
            "show"
        );

    }

}


/* ==================================================
   LOAD PRODUCTS
================================================== */

async function loadProducts() {

    try {

        const snap =
            await getDocs(
                collection(
                    db,
                    "products"
                )
            );


        products = [];


        snap.forEach(
            d => {

                const data =
                    d.data();


                products.push({

                    id:
                        d.id,

                    ...data

                });

            }
        );


        products.sort(
            (a, b) =>
                String(
                    a.name || ""
                ).localeCompare(
                    String(
                        b.name || ""
                    )
                )
        );


        renderProductList();

    }

    catch (error) {

        console.error(
            "Product loading error:",
            error
        );


        const list =
            document.getElementById(
                "productList"
            );


        if (list) {

            list.innerHTML = `

                <div style="
                    padding:15px;
                    text-align:center;
                    opacity:.7;
                ">

                    Unable to load products.

                </div>

            `;

        }

    }

}


/* ==================================================
   RENDER PRODUCTS
================================================== */

function renderProductList() {

    const list =
        document.getElementById(
            "productList"
        );


    if (!list) {
        return;
    }


    const search =
        String(
            document
                .getElementById(
                    "productSearch"
                )
                ?.value ||
                ""
        )
        .trim()
        .toLowerCase();


    const filtered =
        products.filter(
            product => {

                if (!search) {
                    return true;
                }


                const name =
                    String(
                        product.name ||
                        ""
                    )
                    .toLowerCase();


                const id =
                    String(
                        product.id ||
                        ""
                    )
                    .toLowerCase();


                return (
                    name.includes(search) ||
                    id.includes(search)
                );

            }
        );


    if (!filtered.length) {

        list.innerHTML = `

            <div style="
                padding:15px;
                text-align:center;
                opacity:.6;
            ">

                No products found.

            </div>

        `;


        updateSelectedCount();

        return;

    }


    list.innerHTML = "";


    filtered.forEach(
        product => {

            const selected =
                selectedProductIds.has(
                    product.id
                );


            const item =
                document.createElement(
                    "label"
                );


            item.className =
                "coupon-product-item" +
                (
                    selected
                        ?
                        " selected"
                        :
                        ""
                );


            const price =
                Number(
                    product.salePrice ||
                    product.basePrice ||
                    0
                );


            item.innerHTML = `

                <input
                    type="checkbox"
                    ${selected ? "checked" : ""}
                >


                <img
                    class="coupon-product-image"
                    src="${escapeAttribute(
                        product.images?.[0] ||
                        ""
                    )}"
                    alt="${escapeAttribute(
                        product.name ||
                        "Product"
                    )}"
                >


                <div class="coupon-product-info">

                    <div class="coupon-product-name">

                        ${escapeHtml(
                            product.name ||
                            "Unnamed Product"
                        )}

                    </div>


                    <div class="coupon-product-price">

                        ₹${price}

                    </div>

                </div>

            `;


            const checkbox =
                item.querySelector(
                    "input"
                );


            checkbox.addEventListener(
                "change",
                () => {

                    if (
                        checkbox.checked
                    ) {

                        selectedProductIds.add(
                            product.id
                        );

                    }

                    else {

                        selectedProductIds.delete(
                            product.id
                        );

                    }


                    item.classList.toggle(
                        "selected",
                        checkbox.checked
                    );


                    updateSelectedCount();

                }
            );


            list.appendChild(
                item
            );

        }
    );


    updateSelectedCount();

}


/* ==================================================
   SELECT ALL
================================================== */

function selectAllProducts() {

    const search =
        String(
            document
                .getElementById(
                    "productSearch"
                )
                ?.value ||
                ""
        )
        .trim()
        .toLowerCase();


    products.forEach(
        product => {

            const name =
                String(
                    product.name ||
                    ""
                )
                .toLowerCase();


            const id =
                String(
                    product.id ||
                    ""
                )
                .toLowerCase();


            if (
                !search ||
                name.includes(search) ||
                id.includes(search)
            ) {

                selectedProductIds.add(
                    product.id
                );

            }

        }
    );


    renderProductList();

}


/* ==================================================
   CLEAR ALL
================================================== */

function clearAllProducts() {

    selectedProductIds.clear();

    renderProductList();

}


/* ==================================================
   SELECTED COUNT
================================================== */

function updateSelectedCount() {

    const count =
        document.getElementById(
            "selectedProductCount"
        );


    if (!count) {
        return;
    }


    const total =
        selectedProductIds.size;


    count.textContent =
        `${total} product${total === 1 ? "" : "s"} selected`;

}


/* ==================================================
   SAVE COUPON
================================================== */

window.saveCoupon =
async function () {

    const code =
        document
            .getElementById(
                "code"
            )
            ?.value
            .trim()
            .toUpperCase();


    const type =
        document
            .getElementById(
                "type"
            )
            ?.value;


    const value =
        Number(
            document
                .getElementById(
                    "value"
                )
                ?.value ||
                0
        );


    const minOrder =
        Number(
            document
                .getElementById(
                    "minOrder"
                )
                ?.value ||
                0
        );


    const expiryRaw =
        document
            .getElementById(
                "expiry"
            )
            ?.value;


    const scope =
        document
            .getElementById(
                "scope"
            )
            ?.value;


    const stackRule =
        document
            .getElementById(
                "stackRule"
            )
            ?.value;


    const modes =
        [
            ...document.querySelectorAll(
                ".payMode:checked"
            )
        ]
        .map(
            x => x.value
        );


    /* ==================================================
       BASIC VALIDATION
    ================================================== */

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
        value <= 0
    ) {

        alert(
            "Discount value must be greater than 0."
        );

        return;

    }


    /* ==================================================
       PAYMENT MODE
    ================================================== */

    if (
        !modes.length
    ) {

        alert(
            "Please select at least one payment mode."
        );

        return;

    }


    /* ==================================================
       PRODUCT VALIDATION
    ================================================== */

    let productIds = [];


    if (
        scope === "product"
    ) {

        productIds =
            [
                ...selectedProductIds
            ];


        if (
            !productIds.length
        ) {

            alert(
                "Please select at least one product for this coupon."
            );

            return;

        }

    }


    /* ==================================================
       EXPIRY
    ================================================== */

    const expiry =
        new Date(
            expiryRaw
        );


    if (
        isNaN(
            expiry.getTime()
        )
    ) {

        alert(
            "Please enter a valid expiry date."
        );

        return;

    }


    try {

        /* ==========================================
           SAVE
        ========================================== */

        await addDoc(
            collection(
                db,
                "coupons"
            ),
            {

                code,

                type,

                value,

                minOrder,

                expiry:
                    Timestamp.fromDate(
                        expiry
                    ),

                scope,

                /* IMPORTANT */

                productIds,

                allowedModes:
                    modes,

                stackRule,

                createdAt:
                    Date.now(),

                active:
                    true

            }
        );


        alert(
            "Coupon saved successfully."
        );


        clearForm();

        loadCoupons();

    }

    catch (err) {

        console.error(
            "Coupon save error:",
            err
        );


        alert(
            "Error: " +
            (
                err.message ||
                "Unable to save coupon."
            )
        );

    }

};


/* ==================================================
   LOAD COUPONS
================================================== */

async function loadCoupons() {

    if (!listBox) {
        return;
    }


    listBox.innerHTML =
        "Loading...";


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

                <div style="
                    padding:20px;
                    text-align:center;
                    opacity:.6;
                ">

                    No coupons created yet.

                </div>

            `;

            return;

        }


        snap.forEach(
            d => {

                const c =
                    d.data();


                const exp =
                    c.expiry?.toDate

                        ?

                        c.expiry
                            .toDate()
                            .toLocaleDateString()

                        :

                        "N/A";


                const productIds =
                    Array.isArray(
                        c.productIds
                    )
                        ?
                        c.productIds
                        :
                        [];


                const productNames =
                    productIds
                        .map(
                            pid => {

                                const product =
                                    products.find(
                                        p =>
                                            p.id ===
                                            pid
                                    );


                                return product
                                    ?.name ||
                                    pid;

                            }
                        );


                const div =
                    document.createElement(
                        "div"
                    );


                div.className =
                    "coupon-card";


                const valueText =
                    c.type === "percent"

                        ?

                        `${c.value}% OFF`

                        :

                        `₹${c.value} OFF`;


                div.innerHTML = `

                    <div class="coupon-card-header">

                        <div class="coupon-card-code">

                            ${escapeHtml(
                                c.code ||
                                ""
                            )}

                        </div>


                        <div class="coupon-card-value">

                            ${escapeHtml(
                                valueText
                            )}

                        </div>

                    </div>


                    <div class="coupon-card-details">

                        <div class="coupon-detail">

                            <b>Min order:</b>
                            ₹${Number(
                                c.minOrder ||
                                0
                            )}

                        </div>


                        <div class="coupon-detail">

                            <b>Expiry:</b>
                            ${escapeHtml(
                                exp
                            )}

                        </div>


                        <div class="coupon-detail">

                            <b>Modes:</b>
                            ${escapeHtml(
                                (
                                    c.allowedModes ||
                                    []
                                ).join(", ") ||
                                "None"
                            )}

                        </div>


                        <div class="coupon-detail">

                            <b>Scope:</b>
                            ${escapeHtml(
                                c.scope ||
                                "global"
                            )}

                        </div>


                        <div class="coupon-detail">

                            <b>Rule:</b>
                            ${escapeHtml(
                                c.stackRule ||
                                "replace"
                            )}

                        </div>

                    </div>


                    ${
                        c.scope === "product"

                        ?

                        `

                        <div class="coupon-products">

                            <div class="coupon-products-title">

                                Applies to:

                            </div>


                            ${
                                productNames.length

                                ?

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

                                :

                                `

                                    <span
                                        style="opacity:.6;font-size:12px"
                                    >

                                        No products selected

                                    </span>

                                `
                            }

                        </div>

                        `

                        :

                        ""

                    }


                    <button
                        type="button"
                        class="coupon-delete"
                        onclick="deleteCoupon('${escapeAttribute(
                            d.id
                        )}')"
                    >

                        Delete Coupon

                    </button>

                `;


                listBox.appendChild(
                    div
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

            <div style="
                padding:20px;
                text-align:center;
                color:#ff7070;
            ">

                Unable to load coupons.

            </div>

        `;

    }

}


/* ==================================================
   DELETE COUPON
================================================== */

window.deleteCoupon =
async function (id) {

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


        loadCoupons();

    }

    catch (error) {

        console.error(
            "Coupon delete error:",
            error
        );


        alert(
            "Unable to delete coupon."
        );

    }

};


/* ==================================================
   CLEAR FORM
================================================== */

function clearForm() {

    document
        .getElementById(
            "code"
        )
        ?.value = "";


    document
        .getElementById(
            "value"
        )
        ?.value = "";


    document
        .getElementById(
            "minOrder"
        )
        ?.value = "";


    document
        .getElementById(
            "expiry"
        )
        ?.value = "";


    document
        .querySelectorAll(
            ".payMode"
        )
        .forEach(
            x => {

                x.checked =
                    false;

            }
        );


    /* RESET PRODUCTS */

    selectedProductIds.clear();


    const search =
        document.getElementById(
            "productSearch"
        );


    if (search) {

        search.value =
            "";

    }


    renderProductList();

}


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
   INIT
================================================== */

async function initCoupons() {

    injectCouponStyles();

    createProductSelector();

    /*
       Load products first so
       existing product-specific
       coupons can display names.
    */

    await loadProducts();

    await loadCoupons();

}


/* ==================================================
   START
================================================== */

initCoupons();