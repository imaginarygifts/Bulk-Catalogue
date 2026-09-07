/* ============================================================
   CART SIDEBAR
   Cart drawer + WhatsApp checkout

   IMPORTANT:
   - Uses the existing cart.js as the single cart source.
   - Keeps the existing cart sidebar UI/classes.
   - Saves cart orders in the same Firestore structure used by
     the normal checkout, including legacy top-level fields.
   - Uses a Firestore transaction for the order counter.
   ============================================================ */

import { db } from "./firebase.js";

import {
    doc,
    getDoc,
    addDoc,
    collection,
    runTransaction
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
    getCart,
    setCartItemQuantity,
    removeCartItem
} from "./cart.js";


/* ============================================================
   SITE SETTINGS
   ============================================================ */

let siteSettings = {
    companyName: "Imaginary Gifts",
    whatsapp: "",
    orderPrefix: "IG",
    websiteTitle: ""
};

let cartSidebar = null;
let cartOverlay = null;
let cartContent = null;
let cartSubtotalElement = null;
let cartShippingElement = null;
let cartTotalElement = null;
let cartWhatsAppFormOverlay = null;


/* ============================================================
   HELPERS
   ============================================================ */

function formatMoney(value) {
    return Number(value || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 2
    });
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
    return escapeHtml(value);
}

function getCartItems() {
    const items = getCart();
    return Array.isArray(items) ? items : [];
}

function getProductSnapshot(item) {
    return item?.productSnapshot || item?.product || {};
}

function getProductId(item) {
    return item?.productId || getProductSnapshot(item)?.id || "";
}

function getProductName(item) {
    return item?.name || getProductSnapshot(item)?.name || "Product";
}

function getCartItemImage(item) {
    return (
        item?.image ||
        item?.productSnapshot?.images?.[0] ||
        item?.product?.images?.[0] ||
        ""
    );
}

function getCartItemUnitPrice(item) {
    return Math.max(0, Number(item?.price || 0));
}

function getCartItemTotal(item) {
    return getCartItemUnitPrice(item) * Math.max(
        1,
        Number(item?.quantity || 1)
    );
}

function getVariantValue(value) {
    if (value === null || value === undefined) {
        return "";
    }

    if (typeof value === "object") {
        return String(
            value.name ??
            value.value ??
            value.label ??
            ""
        ).trim();
    }

    return String(value).trim();
}

function getColorValue(item) {
    return getVariantValue(item?.color);
}

function getSizeValue(item) {
    return getVariantValue(item?.size);
}


/* ============================================================
   CUSTOM OPTIONS
   ============================================================ */

function getCustomOptionEntries(item) {
    const product = getProductSnapshot(item);

    const customOptions = Array.isArray(
        product?.customOptions
    )
        ? product.customOptions
        : [];

    const optionValues =
        item?.optionValues || {};

    const optionPrices =
        item?.customOptionPrices ||
        item?.options ||
        {};

    const imageLinks =
        item?.imageLinks ||
        {};

    const keys = [
        ...new Set([
            ...Object.keys(optionValues),
            ...Object.keys(optionPrices),
            ...Object.keys(imageLinks)
        ])
    ];

    return keys
        .map(key => {

            const index = Number(key);

            const option =
                Number.isInteger(index)
                    ? customOptions[index]
                    : null;

            let value =
                optionValues[key];

            if (
                value === undefined ||
                value === null ||
                value === ""
            ) {
                value =
                    optionPrices[key];
            }

            if (
                value &&
                typeof value === "object"
            ) {
                value =
                    value.name ??
                    value.value ??
                    value.label ??
                    "";
            }

            value =
                String(value ?? "")
                    .trim();

            const image =
                imageLinks[key] ||
                null;

            if (!value && !image) {
                return null;
            }

            return {
                key,

                label:
                    String(
                        option?.label ||
                        `Option ${
                            Number.isInteger(index)
                                ? index + 1
                                : key
                        }`
                    ).trim(),

                value:
                    value ||
                    "Selected",

                imageLink:
                    image
            };
        })
        .filter(Boolean);
}


function getConfigurationHtml(item) {

    const color =
        getColorValue(item);

    const size =
        getSizeValue(item);

    const options =
        getCustomOptionEntries(item);

    let html = "";


    if (color) {

        html += `
            <div class="cart-item-option">
                <span>Color:</span>
                ${escapeHtml(color)}
            </div>
        `;
    }


    if (size) {

        html += `
            <div class="cart-item-option">
                <span>Size:</span>
                ${escapeHtml(size)}
            </div>
        `;
    }


    options.forEach(option => {

        html += `
            <div class="cart-item-option">
                <span>
                    ${escapeHtml(option.label)}:
                </span>

                ${escapeHtml(option.value)}
            </div>
        `;
    });


    return html;
}


/* ============================================================
   SHIPPING
   ============================================================ */

function getCommonProductShipping(product) {

    const shipping =
        product?.shipping || {};

    let type =
        shipping.type ??
        shipping.shippingType ??
        product?.shippingType ??
        "free";

    let amount =
        Number(
            shipping.amount ??
            shipping.shippingAmount ??
            product?.shippingAmount ??
            0
        );

    type =
        String(
            type || "free"
        ).toLowerCase();


    if (type === "common") {

        type =
            amount > 0
                ? "paid"
                : "free";
    }


    if (type !== "paid") {
        amount = 0;
    }


    return {
        type,

        amount:
            Math.max(
                0,
                amount
            )
    };
}


function getSelectedSizeShipping(item) {

    const product =
        getProductSnapshot(item);

    const selectedSizeName =
        getSizeValue(item);

    if (!selectedSizeName) {
        return null;
    }


    const sizes =
        product?.variants?.sizes ||
        product?.sizes ||
        [];

    if (!Array.isArray(sizes)) {
        return null;
    }


    const selectedSize =
        sizes.find(size =>
            String(
                size?.name || ""
            ).trim() ===
            selectedSizeName
        );


    if (!selectedSize) {
        return null;
    }


    const type =
        String(
            selectedSize.shippingType ??
            selectedSize.shipping?.type ??
            "common"
        ).toLowerCase();


    const amount =
        Number(
            selectedSize.shippingAmount ??
            selectedSize.shipping?.amount ??
            0
        );


    if (type === "free") {

        return {
            type: "free",
            amount: 0
        };
    }


    if (type === "paid") {

        return {
            type: "paid",

            amount:
                Math.max(
                    0,
                    amount
                )
        };
    }


    return null;
}


function getCartItemShipping(item) {

    const quantity =
        Math.max(
            1,
            Number(
                item?.quantity || 1
            )
        );


    const sizeShipping =
        getSelectedSizeShipping(item);


    if (sizeShipping) {

        return (
            sizeShipping.amount *
            quantity
        );
    }


    const commonShipping =
        getCommonProductShipping(
            getProductSnapshot(item)
        );


    return (
        commonShipping.amount *
        quantity
    );
}


function calculateCartTotals(
    items = getCartItems()
) {

    let subtotal = 0;
    let shipping = 0;


    items.forEach(item => {

        subtotal +=
            getCartItemTotal(item);

        shipping +=
            getCartItemShipping(item);
    });


    return {

        subtotal:
            Math.max(
                0,
                subtotal
            ),

        shipping:
            Math.max(
                0,
                shipping
            ),

        total:
            Math.max(
                0,
                subtotal + shipping
            )
    };
}


/* ============================================================
   CART COUNT
   ============================================================ */

function updateCartCount() {

    const element =
        document.getElementById(
            "cartCount"
        );

    if (!element) {
        return;
    }


    const count =
        getCartItems().reduce(
            (sum, item) =>
                sum +
                Math.max(
                    0,
                    Number(
                        item?.quantity || 0
                    )
                ),
            0
        );


    element.textContent =
        count > 99
            ? "99+"
            : String(count);


    element.style.display =
        count > 0
            ? "flex"
            : "none";
}


/* ============================================================
   CREATE CART SIDEBAR
   ============================================================ */

function createCartSidebar() {

    if (
        document.getElementById(
            "cartSidebar"
        )
    ) {

        cartSidebar =
            document.getElementById(
                "cartSidebar"
            );

        cartOverlay =
            document.getElementById(
                "cartSidebarOverlay"
            );

        cartContent =
            document.getElementById(
                "cartSidebarContent"
            );

        cartSubtotalElement =
            document.getElementById(
                "cartSubtotal"
            );

        cartShippingElement =
            document.getElementById(
                "cartShipping"
            );

        cartTotalElement =
            document.getElementById(
                "cartTotal"
            );

        return;
    }


    cartOverlay =
        document.createElement(
            "div"
        );

    cartOverlay.id =
        "cartSidebarOverlay";

    cartOverlay.className =
        "cart-sidebar-overlay";


    cartSidebar =
        document.createElement(
            "aside"
        );

    cartSidebar.id =
        "cartSidebar";

    cartSidebar.className =
        "cart-sidebar";

    cartSidebar.setAttribute(
        "aria-hidden",
        "true"
    );


    cartSidebar.innerHTML = `

        <div class="cart-sidebar-header">

            <div class="cart-sidebar-title">

                <i class="fa-solid fa-cart-shopping"></i>

                <span>Your Cart</span>

            </div>


            <button
                type="button"
                id="cartSidebarCloseButton"
                class="cart-sidebar-close"
                aria-label="Close cart"
            >
                <i class="fa-solid fa-xmark"></i>
            </button>

        </div>


        <div
            id="cartSidebarContent"
            class="cart-sidebar-content"
        ></div>


        <div class="cart-sidebar-footer">

            <div class="cart-summary-row">

                <span>
                    Subtotal
                </span>

                <strong id="cartSubtotal">
                    ₹0
                </strong>

            </div>


            <div class="cart-summary-row">

                <span>
                    Shipping
                </span>

                <strong id="cartShipping">
                    FREE
                </strong>

            </div>


            <div class="cart-summary-divider"></div>


            <div class="cart-summary-row cart-summary-total">

                <span>
                    Total
                </span>

                <strong id="cartTotal">
                    ₹0
                </strong>

            </div>


            <button
                type="button"
                id="cartCheckoutButton"
                class="cart-checkout-button"
            >

                <span>
                    Checkout
                </span>

                <i class="fa-solid fa-arrow-right"></i>

            </button>

        </div>
    `;


    document.body.appendChild(
        cartOverlay
    );

    document.body.appendChild(
        cartSidebar
    );


    cartContent =
        document.getElementById(
            "cartSidebarContent"
        );

    cartSubtotalElement =
        document.getElementById(
            "cartSubtotal"
        );

    cartShippingElement =
        document.getElementById(
            "cartShipping"
        );

    cartTotalElement =
        document.getElementById(
            "cartTotal"
        );


    document
        .getElementById(
            "cartSidebarCloseButton"
        )
        ?.addEventListener(
            "click",
            closeCartSidebar
        );


    cartOverlay.addEventListener(
        "click",
        closeCartSidebar
    );


    document
        .getElementById(
            "cartCheckoutButton"
        )
        ?.addEventListener(
            "click",
            checkoutFromCart
        );


    cartContent.addEventListener(
        "click",
        handleCartAction
    );
}


/* ============================================================
   RENDER CART
   ============================================================ */

function renderCartSidebar() {

    createCartSidebar();


    const items =
        getCartItems();

    const totals =
        calculateCartTotals(
            items
        );


    updateCartCount();


    const checkoutButton =
        document.getElementById(
            "cartCheckoutButton"
        );


    if (!items.length) {

        cartContent.innerHTML = `

            <div class="cart-empty-state">

                <div class="cart-empty-icon">

                    <i class="fa-solid fa-cart-shopping"></i>

                </div>


                <h3>
                    Your cart is empty
                </h3>


                <p>
                    Add something you love and it will appear here.
                </p>

            </div>
        `;


        cartSubtotalElement.textContent =
            "₹0";

        cartShippingElement.textContent =
            "FREE";

        cartTotalElement.textContent =
            "₹0";


        if (checkoutButton) {
            checkoutButton.disabled =
                true;
        }

        return;
    }


    if (checkoutButton) {
        checkoutButton.disabled =
            false;
    }


    cartContent.innerHTML =
        items.map(item => {

            const key =
                String(
                    item?.cartItemKey ||
                    item?.id ||
                    ""
                );


            const quantity =
                Math.max(
                    1,
                    Number(
                        item?.quantity || 1
                    )
                );


            const image =
                getCartItemImage(item);


            const name =
                getProductName(item);


            const unitPrice =
                getCartItemUnitPrice(item);


            const lineTotal =
                getCartItemTotal(item);


            const shipping =
                getCartItemShipping(item);


            const configurationHtml =
                getConfigurationHtml(
                    item
                );


            return `

                <div
                    class="cart-item-card"
                    data-cart-key="${escapeAttribute(key)}"
                >

                    <div class="cart-item-main">


                        <div class="cart-item-image-wrap">

                            ${
                                image
                                    ? `

                                <img
                                    class="cart-item-image"
                                    src="${escapeAttribute(image)}"
                                    alt="${escapeAttribute(name)}"
                                    loading="lazy"
                                >

                            `
                                    : `

                                <div class="cart-item-image-placeholder">

                                    <i class="fa-solid fa-image"></i>

                                </div>

                            `
                            }

                        </div>


                        <div class="cart-item-info">


                            <div class="cart-item-name-row">

                                <h3 class="cart-item-name">

                                    ${escapeHtml(name)}

                                </h3>


                                <button
                                    type="button"
                                    class="cart-remove-button"
                                    data-action="remove"
                                    data-key="${escapeAttribute(key)}"
                                    aria-label="Remove ${escapeAttribute(name)}"
                                >

                                    <i class="fa-solid fa-trash"></i>

                                </button>

                            </div>


                            <div class="cart-item-price">

                                ₹${formatMoney(unitPrice)}

                            </div>


                            <div class="cart-item-configuration">

                                ${configurationHtml}

                            </div>


                            <div class="cart-item-bottom-row">


                                <div class="cart-quantity-control">


                                    <button
                                        type="button"
                                        class="cart-quantity-button"
                                        data-action="decrease"
                                        data-key="${escapeAttribute(key)}"
                                        aria-label="Decrease quantity"
                                    >
                                        −
                                    </button>


                                    <span class="cart-quantity-value">

                                        ${quantity}

                                    </span>


                                    <button
                                        type="button"
                                        class="cart-quantity-button"
                                        data-action="increase"
                                        data-key="${escapeAttribute(key)}"
                                        aria-label="Increase quantity"
                                    >
                                        +
                                    </button>


                                </div>


                                <strong class="cart-item-total">

                                    ₹${formatMoney(lineTotal)}

                                </strong>


                            </div>


                            <div class="cart-item-shipping">

                                ${
                                    shipping <= 0
                                        ? "Free Shipping"
                                        : `Shipping: ₹${formatMoney(shipping)}`
                                }

                            </div>


                        </div>

                    </div>

                </div>

            `;
        })
        .join("");


    cartSubtotalElement.textContent =
        `₹${formatMoney(
            totals.subtotal
        )}`;


    cartShippingElement.textContent =
        totals.shipping <= 0
            ? "FREE"
            : `₹${formatMoney(
                totals.shipping
            )}`;


    cartTotalElement.textContent =
        `₹${formatMoney(
            totals.total
        )}`;
}


/* ============================================================
   CART ACTIONS
   ============================================================ */

function handleCartAction(event) {

    const button =
        event.target.closest(
            "[data-action]"
        );


    if (!button) {
        return;
    }


    const action =
        button.dataset.action;

    const key =
        button.dataset.key;


    if (!key) {
        return;
    }


    const item =
        getCartItems().find(
            cartItem =>
                String(
                    cartItem?.cartItemKey ||
                    cartItem?.id ||
                    ""
                ) ===
                String(key)
        );


    if (!item) {
        return;
    }


    const currentQuantity =
        Math.max(
            1,
            Number(
                item.quantity || 1
            )
        );


    if (action === "increase") {

        setCartItemQuantity(
            key,
            currentQuantity + 1
        );
    }


    if (action === "decrease") {

        if (currentQuantity <= 1) {

            removeCartItem(
                key
            );

        } else {

            setCartItemQuantity(
                key,
                currentQuantity - 1
            );
        }
    }


    if (action === "remove") {

        removeCartItem(
            key
        );
    }


    renderCartSidebar();
}


/* ============================================================
   OPEN / CLOSE
   ============================================================ */

function openCartSidebar() {

    createCartSidebar();

    renderCartSidebar();


    document.body.classList.add(
        "cart-sidebar-open"
    );


    cartOverlay?.classList.add(
        "show"
    );


    cartSidebar?.classList.add(
        "open"
    );


    cartSidebar?.setAttribute(
        "aria-hidden",
        "false"
    );
}


function closeCartSidebar() {

    document.body.classList.remove(
        "cart-sidebar-open"
    );


    cartOverlay?.classList.remove(
        "show"
    );


    cartSidebar?.classList.remove(
        "open"
    );


    cartSidebar?.setAttribute(
        "aria-hidden",
        "true"
    );
}


/* ============================================================
   CART BUTTON
   ============================================================ */

function connectCartButton() {

    const button =
        document.getElementById(
            "cartButton"
        );


    if (
        !button ||
        button.dataset.cartSidebarConnected === "true"
    ) {
        return;
    }


    button.dataset.cartSidebarConnected =
        "true";


    button.addEventListener(
        "click",
        event => {

            event.preventDefault();

            event.stopPropagation();

            openCartSidebar();

        }
    );
}


/* ============================================================
   SITE SETTINGS
   ============================================================ */

async function loadSiteSettings() {

    try {

        const snapshot =
            await getDoc(
                doc(
                    db,
                    "settings",
                    "general"
                )
            );


        if (snapshot.exists()) {

            siteSettings = {

                ...siteSettings,

                ...snapshot.data()

            };
        }

    } catch (error) {

        console.error(
            "Cart site settings error:",
            error
        );
    }


    window.siteSettings =
        siteSettings;


    return siteSettings;
}


/* ============================================================
   ORDER NUMBER

   Uses a transaction so concurrent customers do not receive
   the same order number.
   ============================================================ */

async function generateOrderNumber() {

    const prefix =
        String(
            siteSettings.orderPrefix ||
            "IG"
        )
            .trim()
            .replace(
                /\s+/g,
                ""
            )
            .toUpperCase();


    if (!prefix) {

        throw new Error(
            "Order prefix is not configured in Site Settings."
        );
    }


    const counterRef =
        doc(
            db,
            "counters",
            "orders"
        );


    const nextNumber =
        await runTransaction(
            db,
            async transaction => {

                const snapshot =
                    await transaction.get(
                        counterRef
                    );


                let current =
                    1000;


                if (
                    snapshot.exists()
                ) {

                    current =
                        Number(
                            snapshot.data()
                                ?.current ||
                            1000
                        );
                }


                const next =
                    current + 1;


                transaction.set(
                    counterRef,
                    {
                        current: next
                    },
                    {
                        merge: true
                    }
                );


                return next;
            }
        );


    return `${prefix}-${nextNumber}`;
}


/* ============================================================
   WHATSAPP FORM
   ============================================================ */

function createCartWhatsAppForm() {

    if (
        document.getElementById(
            "cartWhatsAppFormOverlay"
        )
    ) {

        cartWhatsAppFormOverlay =
            document.getElementById(
                "cartWhatsAppFormOverlay"
            );

        return;
    }


    cartWhatsAppFormOverlay =
        document.createElement(
            "div"
        );


    cartWhatsAppFormOverlay.id =
        "cartWhatsAppFormOverlay";


    cartWhatsAppFormOverlay.className =
        "cart-whatsapp-form-overlay";


    cartWhatsAppFormOverlay.innerHTML = `

        <div
            class="cart-whatsapp-form-box"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cartWhatsAppFormTitle"
        >

            <div class="cart-whatsapp-form-header">

                <h2 id="cartWhatsAppFormTitle">

                    Checkout on WhatsApp

                </h2>


                <button
                    type="button"
                    id="cartWhatsAppCloseButton"
                    class="cart-whatsapp-close"
                    aria-label="Close"
                >

                    <i class="fa-solid fa-xmark"></i>

                </button>

            </div>


            <form id="cartWhatsAppForm">


                <div class="cart-form-field">

                    <label for="cartCustomerName">

                        Name
                        <span>*</span>

                    </label>


                    <input
                        id="cartCustomerName"
                        type="text"
                        placeholder="Enter Name"
                        autocomplete="name"
                        required
                    >

                </div>


                <div class="cart-form-field">

                    <label for="cartCustomerPhone">

                        Mobile Number
                        <span>*</span>

                    </label>


                    <input
                        id="cartCustomerPhone"
                        type="tel"
                        inputmode="numeric"
                        placeholder="Enter Mobile Number"
                        autocomplete="tel"
                        maxlength="10"
                        required
                    >

                </div>


                <div class="cart-form-field">

                    <label for="cartCustomerAddress">

                        Address
                        <span>*</span>

                    </label>


                    <textarea
                        id="cartCustomerAddress"
                        rows="3"
                        placeholder="Enter Full Address"
                        autocomplete="street-address"
                        required
                    ></textarea>

                </div>


                <div class="cart-form-field">

                    <label for="cartCustomerPincode">

                        Pincode
                        <span>*</span>

                    </label>


                    <input
                        id="cartCustomerPincode"
                        type="text"
                        inputmode="numeric"
                        placeholder="Enter 6-digit Pincode"
                        maxlength="6"
                        required
                    >

                </div>


                <button
                    type="submit"
                    id="cartWhatsAppSubmitButton"
                    class="cart-whatsapp-submit-button"
                >

                    <span>
                        Continue to WhatsApp
                    </span>

                    <i class="fa-brands fa-whatsapp"></i>

                </button>


            </form>

        </div>

    `;


    document.body.appendChild(
        cartWhatsAppFormOverlay
    );


    document
        .getElementById(
            "cartWhatsAppCloseButton"
        )
        ?.addEventListener(
            "click",
            closeCartWhatsAppForm
        );


    cartWhatsAppFormOverlay.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                cartWhatsAppFormOverlay
            ) {

                closeCartWhatsAppForm();
            }
        }
    );


    document
        .getElementById(
            "cartWhatsAppForm"
        )
        ?.addEventListener(
            "submit",
            submitCartWhatsAppForm
        );
}


function openCartWhatsAppForm() {

    createCartWhatsAppForm();


    cartWhatsAppFormOverlay?.classList.add(
        "show"
    );


    setTimeout(
        () => {

            document
                .getElementById(
                    "cartCustomerName"
                )
                ?.focus();

        },
        50
    );
}


function closeCartWhatsAppForm() {

    cartWhatsAppFormOverlay?.classList.remove(
        "show"
    );
}


function checkoutFromCart() {

    if (
        !getCartItems().length
    ) {
        return;
    }


    openCartWhatsAppForm();
}


/* ============================================================
   CUSTOMER FORM VALIDATION
   ============================================================ */

function getCustomerFormData() {

    const name =
        String(
            document
                .getElementById(
                    "cartCustomerName"
                )
                ?.value ||
            ""
        ).trim();


    const phone =
        String(
            document
                .getElementById(
                    "cartCustomerPhone"
                )
                ?.value ||
            ""
        ).replace(
            /\D/g,
            ""
        );


    const address =
        String(
            document
                .getElementById(
                    "cartCustomerAddress"
                )
                ?.value ||
            ""
        ).trim();


    const pincode =
        String(
            document
                .getElementById(
                    "cartCustomerPincode"
                )
                ?.value ||
            ""
        ).replace(
            /\D/g,
            ""
        );


    if (!name) {

        alert(
            "Please enter your name."
        );

        return null;
    }


    if (
        !/^[6-9]\d{9}$/.test(
            phone
        )
    ) {

        alert(
            "Please enter a valid 10-digit mobile number."
        );

        return null;
    }


    if (!address) {

        alert(
            "Please enter your address."
        );

        return null;
    }


    if (
        !/^\d{6}$/.test(
            pincode
        )
    ) {

        alert(
            "Please enter a valid 6-digit pincode."
        );

        return null;
    }


    return {
        name,
        phone,
        address,
        pincode
    };
}


/* ============================================================
   WHATSAPP PRODUCT BLOCK
   ============================================================ */

function buildWhatsAppProductBlock(
    item,
    index
) {

    const productId =
        getProductId(item);


    const productName =
        getProductName(item);


    const quantity =
        Math.max(
            1,
            Number(
                item?.quantity || 1
            )
        );


    const unitPrice =
        getCartItemUnitPrice(
            item
        );


    const productTotal =
        getCartItemTotal(
            item
        );


    const shipping =
        getCartItemShipping(
            item
        );


    const color =
        getColorValue(item);


    const size =
        getSizeValue(item);


    const options =
        getCustomOptionEntries(
            item
        );


    const productUrl =
        productId
            ? `${window.location.origin}/product?id=${encodeURIComponent(productId)}`
            : "";


    let block =
        `*${index + 1}. ${productName}*\n`;


    block +=
        `Quantity: ${quantity}\n`;


    block +=
        `Unit Price: ₹${formatMoney(unitPrice)}\n`;


    if (color) {

        block +=
            `Color: ${color}\n`;
    }


    if (size) {

        block +=
            `Size: ${size}\n`;
    }


    options.forEach(
        option => {

            block +=
                `${option.label}: ${option.value}\n`;


            if (option.imageLink) {

                block +=
                    `Image: ${option.imageLink}\n`;
            }
        }
    );


    block +=
        `Shipping: ${
            shipping <= 0
                ? "FREE"
                : `₹${formatMoney(shipping)}`
        }\n`;


    block +=
        `Product Total: ₹${formatMoney(productTotal)}\n`;


    if (productUrl) {

        block +=
            `Product Link: ${productUrl}\n`;
    }


    return block;
}


/* ============================================================
   WHATSAPP MESSAGE
   ============================================================ */

function buildCartWhatsAppMessage(
    customer,
    orderNumber,
    items,
    totals
) {

    const companyName =
        String(
            siteSettings.companyName ||
            "Imaginary Gifts"
        ).trim();


    let message =
        `*NEW ORDER — ${companyName}*\n`;


    message +=
        `*Order No:* ${orderNumber}\n\n`;


    message +=
        `*CUSTOMER DETAILS*\n`;


    message +=
        `Name: ${customer.name}\n`;


    message +=
        `Mobile: ${customer.phone}\n`;


    message +=
        `Address: ${customer.address}\n`;


    message +=
        `Pincode: ${customer.pincode}\n\n`;


    message +=
        `------------------------------\n`;


    message +=
        `*ORDER DETAILS*\n`;


    message +=
        `------------------------------\n\n`;


    items.forEach(
        (item, index) => {

            message +=
                buildWhatsAppProductBlock(
                    item,
                    index
                );


            message +=
                `\n------------------------------\n\n`;
        }
    );


    message +=
        `*PRICE BREAKDOWN*\n`;


    message +=
        `Subtotal: ₹${formatMoney(
            totals.subtotal
        )}\n`;


    message +=
        `Shipping: ${
            totals.shipping <= 0
                ? "FREE"
                : `₹${formatMoney(
                    totals.shipping
                )}`
        }\n`;


    message +=
        `*Grand Total: ₹${formatMoney(
            totals.total
        )}*\n\n`;


    message +=
        `Please confirm my order. Thank you!`;


    return message;
}


/* ============================================================
   BUILD FIRESTORE ORDER ITEMS

   IMPORTANT:
   The existing normal checkout stores each item with:
   productId
   productName
   productImage
   quantity
   variants
   customOptions
   lineSubtotal
   shipping

   We use the same structure here.
   ============================================================ */

function buildOrderItems(items) {

    return items.map(
        item => {

            const product =
                getProductSnapshot(
                    item
                );


            const productId =
                getProductId(item);


            const productName =
                getProductName(item);


            const productImage =
                getCartItemImage(item);


            const quantity =
                Math.max(
                    1,
                    Number(
                        item?.quantity || 1
                    )
                );


            const lineTotal =
                getCartItemTotal(
                    item
                );


            const shipping =
                getCartItemShipping(
                    item
                );


            const optionValues =
                item?.optionValues ||
                {};


            const optionPrices =
                item?.customOptionPrices ||
                item?.options ||
                {};


            const imageLinks =
                item?.imageLinks ||
                {};


            const customOptions =
                Array.isArray(
                    product?.customOptions
                )
                    ? product.customOptions
                    : [];


            const optionKeys = [
                ...new Set([
                    ...Object.keys(
                        optionValues
                    ),

                    ...Object.keys(
                        optionPrices
                    ),

                    ...Object.keys(
                        imageLinks
                    )
                ])
            ];


            const normalizedCustomOptions =
                optionKeys
                    .map(
                        key => {

                            const index =
                                Number(
                                    key
                                );


                            const option =
                                Number.isInteger(
                                    index
                                )
                                    ? customOptions[
                                        index
                                    ]
                                    : null;


                            let value =
                                optionValues[
                                    key
                                ];


                            if (
                                value ===
                                    undefined ||
                                value ===
                                    null ||
                                value ===
                                    ""
                            ) {

                                value =
                                    optionPrices[
                                        key
                                    ];
                            }


                            if (
                                value &&
                                typeof value ===
                                    "object"
                            ) {

                                value =
                                    value.name ??
                                    value.value ??
                                    value.label ??
                                    "";
                            }


                            value =
                                String(
                                    value ??
                                    ""
                                ).trim();


                            const image =
                                imageLinks[
                                    key
                                ] ||
                                null;


                            if (
                                !value &&
                                !image
                            ) {

                                return null;
                            }


                            return {

                                label:
                                    String(
                                        option?.label ||
                                        `Option ${
                                            Number.isInteger(
                                                index
                                            )
                                                ? index + 1
                                                : key
                                        }`
                                    ).trim(),

                                value:
                                    value ||
                                    "Selected",

                                image

                            };
                        }
                    )
                    .filter(
                        Boolean
                    );


            return {

                cartItemKey:
                    item?.cartItemKey ||
                    null,


                productId:
                    productId ||
                    null,


                productName:
                    productName ||
                    "",


                productImage:
                    productImage ||
                    "",


                categoryId:
                    product?.categoryId ||
                    null,


                tags:
                    Array.isArray(
                        product?.tags
                    )
                        ? product.tags
                        : [],


                quantity,


                unitPrice:
                    getCartItemUnitPrice(
                        item
                    ),


                /*
                   IMPORTANT:
                   Normal checkout calls this
                   lineSubtotal.
                */

                lineSubtotal:
                    Number(
                        lineTotal
                    ),


                /*
                   Keep lineTotal too.
                */

                lineTotal:
                    Number(
                        lineTotal
                    ),


                variants: {

                    color:
                        item?.color ||
                        null,

                    size:
                        item?.size ||
                        null

                },


                /*
                   IMPORTANT:
                   Admin expects an ARRAY here,
                   not the raw options object.
                */

                customOptions:
                    normalizedCustomOptions,


                /*
                   Preserve raw cart configuration.
                */

                options:
                    item?.options ||
                    {},


                optionValues,


                customOptionPrices:
                    item?.customOptionPrices ||
                    Object.values(
                        item?.options ||
                        {}
                    ),


                imageLinks,


                shipping:
                    Number(
                        shipping
                    ),


                productLink:
                    productId

                        ? `${window.location.origin}/product?id=${encodeURIComponent(productId)}`

                        : ""

            };
        }
    );
}


/* ============================================================
   SAVE CART ORDER

   This is the main fix for the admin Orders page.
   ============================================================ */

async function saveCartOrder(
    customer,
    orderNumber,
    items,
    totals
) {

    const orderItems =
        buildOrderItems(
            items
        );


    /*
       The existing admin Order Details page
       still reads the old top-level product fields.

       Therefore we populate them from the
       first cart item.

       The complete cart is still stored
       inside order.items.
    */

    const firstItem =
        orderItems[0] ||
        null;


    const orderData = {

        orderNumber,


        /* ====================================================
           CUSTOMER
           ==================================================== */

        customer: {

            name:
                customer.name,

            phone:
                customer.phone,

            address:
                customer.address,

            pincode:
                customer.pincode

        },


        /* ====================================================
           LEGACY / ADMIN TOP-LEVEL FIELDS
           ==================================================== */

        productId:
            firstItem?.productId ||
            null,


        productName:
            firstItem?.productName ||
            "",


        productImage:
            firstItem?.productImage ||
            "",


        categoryId:
            firstItem?.categoryId ||
            null,


        tags:
            Array.isArray(
                firstItem?.tags
            )
                ? firstItem.tags
                : [],


        variants:
            firstItem?.variants ||
            {
                color: null,
                size: null
            },


        customOptions:
            firstItem?.customOptions ||
            [],


        productLink:
            firstItem?.productLink ||
            "",


        /* ====================================================
           COMPLETE CART
           ==================================================== */

        items:
            orderItems,


        /* ====================================================
           PRICING
           ==================================================== */

        pricing: {

            subTotal:
                Number(
                    totals.subtotal
                ),

            /*
               Keep lowercase alias too.
            */

            subtotal:
                Number(
                    totals.subtotal
                ),


            shipping:
                Number(
                    totals.shipping
                ),


            finalAmount:
                Number(
                    totals.total
                ),


            totalAmount:
                Number(
                    totals.total
                )

        },


        /* ====================================================
           PAYMENT
           ==================================================== */

        payment: {

            mode:
                "whatsapp",

            status:
                "pending",

            paymentId:
                null,

            paidAmount:
                0,

            balanceAmount:
                Number(
                    totals.total
                )

        },


        /* ====================================================
           ORDER META
           ==================================================== */

        orderStatus:
            "pending",


        source:
            "cart-whatsapp",


        companyName:
            siteSettings.companyName ||
            "Imaginary Gifts",


        orderPrefix:
            siteSettings.orderPrefix ||
            "IG",


        createdAt:
            Date.now()

    };


    const orderRef =
        await addDoc(
            collection(
                db,
                "orders"
            ),
            orderData
        );


    return orderRef.id;
}


/* ============================================================
   SUBMIT WHATSAPP CHECKOUT
   ============================================================ */

async function submitCartWhatsAppForm(
    event
) {

    event.preventDefault();


    const customer =
        getCustomerFormData();


    if (!customer) {
        return;
    }


    const items =
        getCartItems();


    if (!items.length) {

        closeCartWhatsAppForm();

        renderCartSidebar();

        alert(
            "Your cart is empty."
        );

        return;
    }


    const submitButton =
        document.getElementById(
            "cartWhatsAppSubmitButton"
        );


    if (submitButton) {

        submitButton.disabled =
            true;


        submitButton.innerHTML = `

            <span>
                Creating Order...
            </span>

            <i class="fa-solid fa-spinner fa-spin"></i>

        `;
    }


    try {

        /*
           Load latest settings first.
        */

        await loadSiteSettings();


        /*
           Validate WhatsApp before creating
           the Firestore order.
        */

        const whatsappNumber =
            String(
                siteSettings.whatsapp ||
                ""
            ).replace(
                /\D/g,
                ""
            );


        if (!whatsappNumber) {

            throw new Error(
                "WhatsApp number is not configured in Site Settings."
            );
        }


        const totals =
            calculateCartTotals(
                items
            );


        /*
           Generate unique order number.
        */

        const orderNumber =
            await generateOrderNumber();


        /*
           Save corrected order structure.
        */

        await saveCartOrder(

            customer,

            orderNumber,

            items,

            totals

        );


        /*
           Build complete WhatsApp message.
        */

        const message =
            buildCartWhatsAppMessage(

                customer,

                orderNumber,

                items,

                totals

            );


        const whatsappUrl =
            `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                message
            )}`;


        /*
           Clear cart ONLY after the Firestore
           order has successfully been saved.
        */

        items.forEach(
            item => {

                const key =
                    item?.cartItemKey ||
                    item?.id;


                if (key) {

                    removeCartItem(
                        key
                    );
                }
            }
        );


        closeCartWhatsAppForm();

        closeCartSidebar();

        renderCartSidebar();


        /*
           Open WhatsApp.
        */

        window.location.href =
            whatsappUrl;

    }
    catch (error) {

        console.error(
            "Cart WhatsApp checkout failed:",
            error
        );


        alert(
            error?.message ||
            "Order failed. Please try again."
        );

    }
    finally {

        if (submitButton) {

            submitButton.disabled =
                false;


            submitButton.innerHTML = `

                <span>
                    Continue to WhatsApp
                </span>

                <i class="fa-brands fa-whatsapp"></i>

            `;
        }
    }
}


/* ============================================================
   CART UPDATED EVENT
   ============================================================ */

window.addEventListener(
    "cartUpdated",
    () => {

        updateCartCount();


        if (
            cartSidebar?.classList.contains(
                "open"
            )
        ) {

            renderCartSidebar();
        }

    }
);


/* ============================================================
   ESCAPE KEY
   ============================================================ */

window.addEventListener(
    "keydown",
    event => {

        if (
            event.key !==
            "Escape"
        ) {

            return;
        }


        closeCartWhatsAppForm();

        closeCartSidebar();

    }
);


/* ============================================================
   INIT
   ============================================================ */

function initCartSidebar() {

    createCartSidebar();

    createCartWhatsAppForm();

    connectCartButton();

    updateCartCount();


    /*
       Topbar markup may be inserted shortly
       after page load.
    */

    setTimeout(
        connectCartButton,
        100
    );


    setTimeout(
        connectCartButton,
        500
    );
}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(

        "DOMContentLoaded",

        initCartSidebar,

        {
            once: true
        }

    );

}
else {

    initCartSidebar();

}


/* ============================================================
   GLOBAL ACCESS
   ============================================================ */

window.openCartSidebar =
    openCartSidebar;

window.closeCartSidebar =
    closeCartSidebar;

window.renderCartSidebar =
    renderCartSidebar;