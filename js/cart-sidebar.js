/* ============================================================
   CART SIDEBAR
   ============================================================

   Features:
   - Opens from #cartButton
   - Uses cart.js as the single cart system
   - Quantity + / -
   - Remove item
   - Subtotal
   - Shipping
   - Total
   - Checkout
   - WhatsApp customer details form
   - Complete multi-product WhatsApp order
   - Firestore order creation
   - Real-time cart synchronization

   Site Settings:
   settings/general

   orderButton:
   "buyNow"    -> normal checkout page
   "whatsapp"  -> customer form -> WhatsApp order

   ============================================================ */


import {
    getCart,
    setCartItemQuantity,
    removeCartItem
} from "./cart.js";


import {
    db
} from "./firebase.js";


import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    addDoc,
    collection
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


/* ============================================================
   CHECKOUT PAGE
   ============================================================ */

const CHECKOUT_PAGE = "order";


/* ============================================================
   SITE SETTINGS
   ============================================================ */

let siteSettings = {
    companyName: "Imaginary Gifts",
    whatsapp: "",
    orderPrefix: "IG",
    orderButton: "buyNow"
};


/* ============================================================
   FORMAT MONEY
   ============================================================ */

function formatMoney(value) {

    const number = Number(value || 0);

    return number.toLocaleString(
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

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* ============================================================
   ESCAPE ATTRIBUTE
   ============================================================ */

function escapeAttribute(value) {

    return escapeHtml(value);

}


/* ============================================================
   LOAD SITE SETTINGS
   ============================================================ */

async function loadSiteSettings() {

    try {

        const snap = await getDoc(
            doc(
                db,
                "settings",
                "general"
            )
        );


        if (snap.exists()) {

            siteSettings = {
                ...siteSettings,
                ...snap.data()
            };

        }

    }
    catch (error) {

        console.error(
            "Cart sidebar settings error:",
            error
        );

    }

}


/* ============================================================
   GET CART ITEM PRODUCT
   ============================================================ */

function getCartItemProduct(item) {

    return (
        item?.product ||
        item?.productSnapshot ||
        item?.productData ||
        {}
    );

}


/* ============================================================
   GET PRODUCT ID
   ============================================================ */

function getCartItemProductId(item) {

    return (
        item?.productId ||
        item?.product?.id ||
        item?.productSnapshot?.id ||
        item?.productData?.id ||
        ""
    );

}


/* ============================================================
   GET PRODUCT NAME
   ============================================================ */

function getCartItemProductName(item) {

    const product =
        getCartItemProduct(item);


    return (
        item?.name ||
        product?.name ||
        product?.title ||
        "Product"
    );

}


/* ============================================================
   GET CART ITEM UNIT PRICE
   ============================================================ */

function getCartItemUnitPrice(item) {

    const product =
        getCartItemProduct(item);


    /*
       cart.js normally stores the final selected
       configuration price in item.price.
    */

    if (
        item?.price !== undefined &&
        item?.price !== null
    ) {

        return Number(
            item.price || 0
        );

    }


    return Number(
        product?.salePrice ??
        product?.basePrice ??
        product?.price ??
        0
    );

}


/* ============================================================
   GET CART ITEM QUANTITY
   ============================================================ */

function getCartItemQuantity(item) {

    return Math.max(
        Number(
            item?.quantity ??
            item?.qty ??
            1
        ) || 1,
        1
    );

}


/* ============================================================
   GET CART ITEM TOTAL
   ============================================================ */

function getCartItemTotal(item) {

    return (
        getCartItemUnitPrice(item) *
        getCartItemQuantity(item)
    );

}


/* ============================================================
   GET CART ITEM IMAGE
   ============================================================ */

function getCartItemImage(item) {

    const product =
        getCartItemProduct(item);


    return (
        item?.image ||
        item?.imageUrl ||
        product?.images?.[0] ||
        ""
    );

}


/* ============================================================
   GET PRODUCT LINK
   ============================================================ */

function getProductLink(item) {

    const productId =
        getCartItemProductId(item);


    if (!productId) {

        return "";

    }


    try {

        return new URL(
            `product?id=${encodeURIComponent(productId)}`,
            window.location.origin + "/"
        ).href;

    }
    catch (error) {

        return (
            window.location.origin +
            `/product?id=${encodeURIComponent(productId)}`
        );

    }

}


/* ============================================================
   GET COLOR
   ============================================================ */

function getCartItemColor(item) {

    const color =
        item?.color;


    if (!color) {

        return "";

    }


    if (
        typeof color === "object"
    ) {

        return (
            color.name ||
            color.value ||
            color.title ||
            ""
        );

    }


    return String(color);

}


/* ============================================================
   GET SIZE
   ============================================================ */

function getCartItemSize(item) {

    const size =
        item?.size;


    if (!size) {

        return "";

    }


    if (
        typeof size === "object"
    ) {

        return (
            size.name ||
            size.value ||
            size.title ||
            ""
        );

    }


    return String(size);

}


/* ============================================================
   GET OPTIONS
   ============================================================ */

function getCartItemOptions(item) {

    const product =
        getCartItemProduct(item);


    const options =
        item?.options || {};


    const optionValues =
        item?.optionValues || {};


    const keys =
        new Set(
            [
                ...Object.keys(options),
                ...Object.keys(optionValues)
            ]
        );


    const result = [];


    keys.forEach(
        key => {

            const option =
                product?.customOptions?.[key];


            const label =
                option?.label ||
                `Option ${Number(key) + 1}`;


            const value =
                optionValues?.[key] ??
                options?.[key] ??
                "";


            if (
                value !== "" &&
                value !== null &&
                value !== undefined
            ) {

                result.push({
                    key,
                    label,
                    value,
                    image:
                        item?.imageLinks?.[key] ||
                        null
                });

            }

        }
    );


    return result;

}


/* ============================================================
   GET CONFIGURATION HTML
   ============================================================ */

function getConfigurationHtml(item) {

    const color =
        getCartItemColor(item);


    const size =
        getCartItemSize(item);


    const options =
        getCartItemOptions(item);


    let html = "";


    if (color) {

        html += `
            <div class="cart-item-option">
                Color: ${escapeHtml(color)}
            </div>
        `;

    }


    if (size) {

        html += `
            <div class="cart-item-option">
                Size: ${escapeHtml(size)}
            </div>
        `;

    }


    options.forEach(
        option => {

            html += `
                <div class="cart-item-option">
                    ${escapeHtml(option.label)}:
                    ${escapeHtml(option.value)}
                </div>
            `;

        }
    );


    return html;

}


/* ============================================================
   COMMON PRODUCT SHIPPING
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


    if (
        type === "common"
    ) {

        type =
            amount > 0
                ? "paid"
                : "free";

    }


    if (
        type !== "paid"
    ) {

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


/* ============================================================
   SELECTED SIZE SHIPPING
   ============================================================ */

function getSelectedSizeShipping(item) {

    const product =
        getCartItemProduct(item);


    const selectedSizeName =
        String(
            item?.size?.name ??
            item?.sizeName ??
            item?.size ??
            ""
        ).trim();


    if (!selectedSizeName) {

        return null;

    }


    const sizes =
        product?.variants?.sizes ||
        product?.sizes ||
        [];


    if (
        !Array.isArray(sizes)
    ) {

        return null;

    }


    const selected =
        sizes.find(
            size =>
                String(
                    size?.name || ""
                ).trim() ===
                selectedSizeName
        );


    if (!selected) {

        return null;

    }


    const type =
        String(
            selected.shippingType ??
            selected.shipping?.type ??
            "common"
        ).toLowerCase();


    const amount =
        Number(
            selected.shippingAmount ??
            selected.shipping?.amount ??
            0
        );


    if (
        type === "free"
    ) {

        return {
            type: "free",
            amount: 0
        };

    }


    if (
        type === "paid"
    ) {

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


/* ============================================================
   GET CART ITEM SHIPPING
   ============================================================ */

function getCartItemShipping(item) {

    const sizeShipping =
        getSelectedSizeShipping(item);


    const quantity =
        getCartItemQuantity(item);


    if (sizeShipping) {

        return (
            sizeShipping.amount *
            quantity
        );

    }


    const common =
        getCommonProductShipping(
            getCartItemProduct(item)
        );


    return (
        common.amount *
        quantity
    );

}


/* ============================================================
   CALCULATE CART TOTALS
   ============================================================ */

function calculateCartTotals(items) {

    let subtotal = 0;

    let shipping = 0;


    items.forEach(
        item => {

            subtotal +=
                getCartItemTotal(item);


            shipping +=
                getCartItemShipping(item);

        }
    );


    const total =
        subtotal +
        shipping;


    return {
        subtotal,
        shipping,
        total
    };

}


/* ============================================================
   UPDATE CART COUNT
   ============================================================ */

function updateCartCount() {

    const cartCount =
        document.getElementById(
            "cartCount"
        );


    if (!cartCount) {

        return;

    }


    const cart =
        getCart();


    const count =
        cart.reduce(
            (
                total,
                item
            ) => {

                return (
                    total +
                    getCartItemQuantity(item)
                );

            },
            0
        );


    cartCount.textContent =
        count;


    if (
        count > 0
    ) {

        cartCount.style.display =
            "flex";

    }
    else {

        cartCount.style.display =
            "none";

    }

}


/* ============================================================
   CREATE CART SIDEBAR
   ============================================================ */

function createCartSidebar() {

    if (
        document.getElementById(
            "cartSidebarOverlay"
        )
    ) {

        return;

    }


    const overlay =
        document.createElement(
            "div"
        );


    overlay.id =
        "cartSidebarOverlay";


    overlay.className =
        "cart-sidebar-overlay";


    overlay.innerHTML = `

        <aside
            id="cartSidebar"
            class="cart-sidebar"
            aria-label="Shopping Cart"
        >

            <div class="cart-sidebar-header">

                <div class="cart-sidebar-title">
                    <i class="fa-solid fa-cart-shopping"></i>
                    <span>Your Cart</span>
                </div>


                <button
                    type="button"
                    id="closeCartSidebarButton"
                    class="cart-sidebar-close"
                    aria-label="Close Cart"
                >
                    <i class="fa-solid fa-xmark"></i>
                </button>

            </div>


            <div
                id="cartSidebarItems"
                class="cart-sidebar-items"
            ></div>


            <div
                id="cartSidebarEmpty"
                class="cart-sidebar-empty"
                style="display:none;"
            >

                <i class="fa-solid fa-cart-shopping"></i>

                <h3>Your cart is empty</h3>

                <p>
                    Add products to your cart
                    to see them here.
                </p>

            </div>


            <div
                id="cartSidebarFooter"
                class="cart-sidebar-footer"
            >

                <div class="cart-price-row">

                    <span>
                        Subtotal
                    </span>

                    <strong id="cartSubtotal">
                        ₹0
                    </strong>

                </div>


                <div class="cart-price-row">

                    <span>
                        Shipping
                    </span>

                    <strong id="cartShipping">
                        FREE
                    </strong>

                </div>


                <div class="cart-total-row">

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

        </aside>

    `;


    document.body.appendChild(
        overlay
    );


    document
        .getElementById(
            "closeCartSidebarButton"
        )
        ?.addEventListener(
            "click",
            closeCartSidebar
        );


    overlay.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                overlay
            ) {

                closeCartSidebar();

            }

        }
    );


    document
        .getElementById(
            "cartCheckoutButton"
        )
        ?.addEventListener(
            "click",
            checkoutFromCart
        );


    renderCartSidebar();

}


/* ============================================================
   RENDER CART SIDEBAR
   ============================================================ */

function renderCartSidebar() {

    const container =
        document.getElementById(
            "cartSidebarItems"
        );


    const empty =
        document.getElementById(
            "cartSidebarEmpty"
        );


    const footer =
        document.getElementById(
            "cartSidebarFooter"
        );


    if (
        !container
    ) {

        return;

    }


    const items =
        getCart();


    updateCartCount();


    if (
        !items.length
    ) {

        container.innerHTML =
            "";


        if (empty) {

            empty.style.display =
                "flex";

        }


        if (footer) {

            footer.style.display =
                "none";

        }


        return;

    }


    if (empty) {

        empty.style.display =
            "none";

    }


    if (footer) {

        footer.style.display =
            "block";

    }


    container.innerHTML =
        items
            .map(
                (
                    item,
                    index
                ) => {

                    const image =
                        getCartItemImage(item);


                    const name =
                        getCartItemProductName(item);


                    const quantity =
                        getCartItemQuantity(item);


                    const unitPrice =
                        getCartItemUnitPrice(item);


                    const lineTotal =
                        getCartItemTotal(item);


                    const shipping =
                        getCartItemShipping(item);


                    const configuration =
                        getConfigurationHtml(item);


                    return `

                        <div
                            class="cart-sidebar-item"
                            data-cart-key="${escapeAttribute(
                                item.cartItemKey ||
                                item.id ||
                                ""
                            )}"
                        >

                            <div class="cart-item-image">

                                ${
                                    image
                                        ? `
                                            <img
                                                src="${escapeAttribute(image)}"
                                                alt="${escapeAttribute(name)}"
                                            >
                                        `
                                        : `
                                            <div class="cart-item-no-image">
                                                <i class="fa-regular fa-image"></i>
                                            </div>
                                        `
                                }

                            </div>


                            <div class="cart-item-info">

                                <div class="cart-item-top">

                                    <h4>
                                        ${escapeHtml(name)}
                                    </h4>


                                    <button
                                        type="button"
                                        class="cart-item-remove"
                                        data-action="remove"
                                        data-cart-key="${escapeAttribute(
                                            item.cartItemKey ||
                                            item.id ||
                                            ""
                                        )}"
                                        aria-label="Remove ${escapeAttribute(name)}"
                                    >
                                        <i class="fa-solid fa-trash"></i>
                                    </button>

                                </div>


                                <div class="cart-item-price">

                                    ₹${formatMoney(unitPrice)}

                                    ${
                                        quantity > 1
                                            ? `
                                                <span>
                                                    × ${quantity}
                                                </span>
                                            `
                                            : ""
                                    }

                                </div>


                                ${
                                    configuration
                                        ? `
                                            <div class="cart-item-configuration">
                                                ${configuration}
                                            </div>
                                        `
                                        : ""
                                }


                                <div class="cart-item-bottom">

                                    <div class="cart-quantity-control">

                                        <button
                                            type="button"
                                            class="cart-quantity-minus"
                                            data-action="decrease"
                                            data-cart-key="${escapeAttribute(
                                                item.cartItemKey ||
                                                item.id ||
                                                ""
                                            )}"
                                            aria-label="Decrease quantity"
                                        >
                                            −
                                        </button>


                                        <span class="cart-quantity-value">
                                            ${quantity}
                                        </span>


                                        <button
                                            type="button"
                                            class="cart-quantity-plus"
                                            data-action="increase"
                                            data-cart-key="${escapeAttribute(
                                                item.cartItemKey ||
                                                item.id ||
                                                ""
                                            )}"
                                            aria-label="Increase quantity"
                                        >
                                            +
                                        </button>

                                    </div>


                                    <strong class="cart-item-total">
                                        ₹${formatMoney(lineTotal)}
                                    </strong>

                                </div>


                                ${
                                    shipping > 0
                                        ? `
                                            <div class="cart-item-shipping">
                                                Shipping:
                                                ₹${formatMoney(shipping)}
                                            </div>
                                        `
                                        : `
                                            <div class="cart-item-shipping free">
                                                Free Shipping
                                            </div>
                                        `
                                }

                            </div>

                        </div>

                    `;

                }
            )
            .join("");


    const totals =
        calculateCartTotals(
            items
        );


    const subtotalElement =
        document.getElementById(
            "cartSubtotal"
        );


    const shippingElement =
        document.getElementById(
            "cartShipping"
        );


    const totalElement =
        document.getElementById(
            "cartTotal"
        );


    if (
        subtotalElement
    ) {

        subtotalElement.textContent =
            `₹${formatMoney(
                totals.subtotal
            )}`;

    }


    if (
        shippingElement
    ) {

        shippingElement.textContent =
            totals.shipping > 0
                ? `₹${formatMoney(
                    totals.shipping
                )}`
                : "FREE";

    }


    if (
        totalElement
    ) {

        totalElement.textContent =
            `₹${formatMoney(
                totals.total
            )}`;

    }


    container
        .querySelectorAll(
            "[data-action]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    handleCartAction
                );

            }
        );

}


/* ============================================================
   HANDLE CART ACTION
   ============================================================ */

function handleCartAction(event) {

    const button =
        event.currentTarget;


    const action =
        button.dataset.action;


    const cartKey =
        button.dataset.cartKey;


    if (!cartKey) {

        return;

    }


    const items =
        getCart();


    const item =
        items.find(
            current =>
                String(
                    current.cartItemKey ||
                    current.id ||
                    ""
                ) ===
                String(cartKey)
        );


    if (!item) {

        return;

    }


    const quantity =
        getCartItemQuantity(item);


    if (
        action === "increase"
    ) {

        setCartItemQuantity(
            cartKey,
            quantity + 1
        );

    }


    if (
        action === "decrease"
    ) {

        setCartItemQuantity(
            cartKey,
            quantity - 1
        );

    }


    if (
        action === "remove"
    ) {

        removeCartItem(
            cartKey
        );

    }


    renderCartSidebar();

}


/* ============================================================
   OPEN CART SIDEBAR
   ============================================================ */

function openCartSidebar() {

    createCartSidebar();


    renderCartSidebar();


    const overlay =
        document.getElementById(
            "cartSidebarOverlay"
        );


    if (!overlay) {

        return;

    }


    overlay.classList.add(
        "open"
    );


    document.body.classList.add(
        "cart-sidebar-open"
    );

}


/* ============================================================
   CLOSE CART SIDEBAR
   ============================================================ */

function closeCartSidebar() {

    const overlay =
        document.getElementById(
            "cartSidebarOverlay"
        );


    if (!overlay) {

        return;

    }


    overlay.classList.remove(
        "open"
    );


    document.body.classList.remove(
        "cart-sidebar-open"
    );

}


/* ============================================================
   CONNECT CART BUTTON
   ============================================================ */

function connectCartButton() {

    const cartButton =
        document.getElementById(
            "cartButton"
        );


    if (!cartButton) {

        return;

    }


    /*
       Prevent the old href="cart.html"
       from navigating away.
    */

    cartButton.addEventListener(
        "click",
        event => {

            event.preventDefault();

            openCartSidebar();

        }
    );

}


/* ============================================================
   CREATE CUSTOMER DETAILS FORM
   ============================================================ */

function createWhatsAppCustomerForm() {

    if (
        document.getElementById(
            "cartWhatsAppFormOverlay"
        )
    ) {

        return;

    }


    const overlay =
        document.createElement(
            "div"
        );


    overlay.id =
        "cartWhatsAppFormOverlay";


    overlay.className =
        "cart-whatsapp-form-overlay";


    overlay.innerHTML = `

        <div
            class="cart-whatsapp-form"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cartWhatsAppFormTitle"
        >

            <div class="cart-whatsapp-form-header">

                <div>

                    <h3 id="cartWhatsAppFormTitle">
                        Customer Details
                    </h3>

                    <p>
                        Enter your details to place the order on WhatsApp.
                    </p>

                </div>


                <button
                    type="button"
                    id="closeCartWhatsAppForm"
                    class="cart-whatsapp-close"
                    aria-label="Close"
                >
                    <i class="fa-solid fa-xmark"></i>
                </button>

            </div>


            <form id="cartWhatsAppCustomerForm">

                <div class="cart-form-group">

                    <label for="cartCustomerName">
                        Name
                    </label>

                    <input
                        type="text"
                        id="cartCustomerName"
                        name="name"
                        placeholder="Enter your name"
                        autocomplete="name"
                        required
                    >

                </div>


                <div class="cart-form-group">

                    <label for="cartCustomerPhone">
                        Mobile Number
                    </label>

                    <input
                        type="tel"
                        id="cartCustomerPhone"
                        name="phone"
                        placeholder="10-digit mobile number"
                        inputmode="numeric"
                        maxlength="10"
                        autocomplete="tel"
                        required
                    >

                </div>


                <div class="cart-form-group">

                    <label for="cartCustomerAddress">
                        Address
                    </label>

                    <textarea
                        id="cartCustomerAddress"
                        name="address"
                        placeholder="Enter complete delivery address"
                        rows="3"
                        autocomplete="street-address"
                        required
                    ></textarea>

                </div>


                <div class="cart-form-group">

                    <label for="cartCustomerPincode">
                        Pincode
                    </label>

                    <input
                        type="tel"
                        id="cartCustomerPincode"
                        name="pincode"
                        placeholder="6-digit pincode"
                        inputmode="numeric"
                        maxlength="6"
                        autocomplete="postal-code"
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
        overlay
    );


    document
        .getElementById(
            "closeCartWhatsAppForm"
        )
        ?.addEventListener(
            "click",
            closeWhatsAppCustomerForm
        );


    overlay.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                overlay
            ) {

                closeWhatsAppCustomerForm();

            }

        }
    );


    document
        .getElementById(
            "cartWhatsAppCustomerForm"
        )
        ?.addEventListener(
            "submit",
            submitCartWhatsAppOrder
        );

}


/* ============================================================
   OPEN CUSTOMER FORM
   ============================================================ */

function openWhatsAppCustomerForm() {

    createWhatsAppCustomerForm();


    const overlay =
        document.getElementById(
            "cartWhatsAppFormOverlay"
        );


    if (!overlay) {

        return;

    }


    overlay.classList.add(
        "open"
    );


    setTimeout(
        () => {

            document
                .getElementById(
                    "cartCustomerName"
                )
                ?.focus();

        },
        100
    );

}


/* ============================================================
   CLOSE CUSTOMER FORM
   ============================================================ */

function closeWhatsAppCustomerForm() {

    const overlay =
        document.getElementById(
            "cartWhatsAppFormOverlay"
        );


    if (!overlay) {

        return;

    }


    overlay.classList.remove(
        "open"
    );

}


/* ============================================================
   CHECKOUT FROM CART
   ============================================================ */

async function checkoutFromCart() {

    const items =
        getCart();


    if (
        !items.length
    ) {

        alert(
            "Your cart is empty."
        );

        return;

    }


    /*
       Reload settings before deciding
       which checkout mode to use.
    */

    await loadSiteSettings();


    const orderButton =
        String(
            siteSettings.orderButton ||
            "buyNow"
        ).trim().toLowerCase();


    /*
       WHATSAPP CHECKOUT
    */

    if (
        orderButton === "whatsapp"
    ) {

        const whatsappNumber =
            String(
                siteSettings.whatsapp ||
                ""
            ).replace(
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


        openWhatsAppCustomerForm();

        return;

    }


    /*
       NORMAL BUY NOW CHECKOUT
    */

    const checkoutData = {

        cart: items,

        items: items,

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


    location.href =
        CHECKOUT_PAGE;

}


/* ============================================================
   SUBMIT CART WHATSAPP ORDER
   ============================================================ */

async function submitCartWhatsAppOrder(
    event
) {

    event.preventDefault();


    const name =
        document
            .getElementById(
                "cartCustomerName"
            )
            ?.value
            .trim();


    const phone =
        document
            .getElementById(
                "cartCustomerPhone"
            )
            ?.value
            .trim();


    const address =
        document
            .getElementById(
                "cartCustomerAddress"
            )
            ?.value
            .trim();


    const pincode =
        document
            .getElementById(
                "cartCustomerPincode"
            )
            ?.value
            .trim();


    /*
       BASIC VALIDATION
    */

    if (
        !name ||
        !phone ||
        !address ||
        !pincode
    ) {

        alert(
            "⚠ Please fill all customer details."
        );

        return;

    }


    if (
        !/^[6-9]\d{9}$/.test(
            phone
        )
    ) {

        alert(
            "⚠ Enter a valid 10-digit mobile number."
        );

        return;

    }


    if (
        !/^\d{6}$/.test(
            pincode
        )
    ) {

        alert(
            "⚠ Enter a valid 6-digit pincode."
        );

        return;

    }


    const whatsappNumber =
        String(
            siteSettings.whatsapp ||
            ""
        ).replace(
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


    const items =
        getCart();


    if (
        !items.length
    ) {

        alert(
            "Your cart is empty."
        );

        closeWhatsAppCustomerForm();

        renderCartSidebar();

        return;

    }


    const submitButton =
        document.getElementById(
            "cartWhatsAppSubmitButton"
        );


    if (
        submitButton
    ) {

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

        /* =====================================================
           TOTALS
           ===================================================== */

        const totals =
            calculateCartTotals(
                items
            );


        /* =====================================================
           ORDER NUMBER
           ===================================================== */

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
                    Number(
                        counterSnap.data().current ||
                        1000
                    )
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


        /* =====================================================
           ORDER PREFIX
           ===================================================== */

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


        /* =====================================================
           BUILD ORDER ITEMS
           ===================================================== */

        const orderItems =
            items.map(
                item => {

                    const product =
                        getCartItemProduct(
                            item
                        );


                    const quantity =
                        getCartItemQuantity(
                            item
                        );


                    const unitPrice =
                        getCartItemUnitPrice(
                            item
                        );


                    const lineTotal =
                        getCartItemTotal(
                            item
                        );


                    const shipping =
                        getCartItemShipping(
                            item
                        );


                    const options =
                        getCartItemOptions(
                            item
                        );


                    return {

                        productId:
                            getCartItemProductId(
                                item
                            ),

                        productName:
                            getCartItemProductName(
                                item
                            ),

                        productImage:
                            getCartItemImage(
                                item
                            ),

                        productLink:
                            getProductLink(
                                item
                            ),

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

                        unitPrice,

                        lineTotal,

                        shipping,

                        color:
                            getCartItemColor(
                                item
                            ) || null,

                        size:
                            getCartItemSize(
                                item
                            ) || null,

                        options:
                            options.map(
                                option => ({

                                    label:
                                        option.label,

                                    value:
                                        option.value,

                                    image:
                                        option.image ||
                                        null

                                })
                            ),

                        cartItemKey:
                            item.cartItemKey ||
                            item.id ||
                            null

                    };

                }
            );


        /* =====================================================
           SAVE ORDER TO FIRESTORE
           ===================================================== */

        const orderData = {

            orderNumber,


            customer: {

                name,

                phone,

                address,

                pincode

            },


            items:
                orderItems,


            pricing: {

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
                "cart-whatsapp",


            companyName:
                siteSettings.companyName ||
                "Imaginary Gifts",


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


        /* =====================================================
           WHATSAPP MESSAGE
           ===================================================== */

        const companyName =
            siteSettings.companyName ||
            "Imaginary Gifts";


        let message =
            `🛍 *New Order — ${companyName}*\n\n`;


        message +=
            `🧾 *Order No:* ${orderNumber}\n\n`;


        /* =====================================================
           CUSTOMER DETAILS
           ===================================================== */

        message +=
            `👤 *Name:* ${name}\n`;


        message +=
            `📞 *Mobile:* ${phone}\n`;


        message +=
            `🏠 *Address:* ${address}\n`;


        message +=
            `📮 *Pincode:* ${pincode}\n\n`;


        /* =====================================================
           PRODUCTS
           ===================================================== */

        message +=
            `━━━━━━━━━━━━━━━━━━\n`;


        message +=
            `📦 *ORDER DETAILS*\n`;


        message +=
            `━━━━━━━━━━━━━━━━━━\n\n`;


        orderItems.forEach(
            (
                item,
                index
            ) => {

                message +=
                    `📦 *Product ${index + 1}:* ${item.productName}\n`;


                message +=
                    `🔢 *Quantity:* ${item.quantity}\n`;


                message +=
                    `💰 *Unit Price:* ₹${formatMoney(
                        item.unitPrice
                    )}\n`;


                /* COLOR */

                if (
                    item.color
                ) {

                    message +=
                        `🎨 *Color:* ${item.color}\n`;

                }


                /* SIZE */

                if (
                    item.size
                ) {

                    message +=
                        `📏 *Size:* ${item.size}\n`;

                }


                /* OPTIONS */

                if (
                    Array.isArray(
                        item.options
                    ) &&
                    item.options.length
                ) {

                    message +=
                        `⚙ *Options:*\n`;


                    item.options.forEach(
                        option => {

                            message +=
                                `• ${option.label}: ${option.value}\n`;

                        }
                    );

                }


                message +=
                    `🚚 *Shipping:* ${
                        item.shipping > 0
                            ? `₹${formatMoney(
                                item.shipping
                            )}`
                            : "FREE"
                    }\n`;


                message +=
                    `💵 *Product Total:* ₹${formatMoney(
                        item.lineTotal
                    )}\n`;


                if (
                    item.productLink
                ) {

                    message +=
                        `🔗 *Product Link:*\n${item.productLink}\n`;

                }


                message +=
                    `\n`;

            }
        );


        /* =====================================================
           PRICE BREAKDOWN
           ===================================================== */

        message +=
            `━━━━━━━━━━━━━━━━━━\n`;


        message +=
            `💰 *PRICE BREAKDOWN*\n`;


        message +=
            `━━━━━━━━━━━━━━━━━━\n\n`;


        message +=
            `🛒 *Subtotal:* ₹${formatMoney(
                totals.subtotal
            )}\n`;


        message +=
            `🚚 *Shipping:* ${
                totals.shipping > 0
                    ? `₹${formatMoney(
                        totals.shipping
                    )}`
                    : "FREE"
            }\n`;


        message +=
            `💳 *Grand Total:* ₹${formatMoney(
                totals.total
            )}\n\n`;


        message +=
            `━━━━━━━━━━━━━━━━━━\n`;


        message +=
            `🔖 *Order ID:* ${orderRef.id}\n`;


        message +=
            `🛍 *Order Source:* Cart / WhatsApp\n`;


        /* =====================================================
           WHATSAPP URL
           ===================================================== */

        const whatsappUrl =
            `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                message
            )}`;


        /* =====================================================
           CLOSE FORM
           ===================================================== */

        closeWhatsAppCustomerForm();


        /* =====================================================
           OPEN WHATSAPP
           ===================================================== */

        window.open(
            whatsappUrl,
            "_blank"
        );


        /* =====================================================
           RESTORE BUTTON
           ===================================================== */

        if (
            submitButton
        ) {

            submitButton.disabled =
                false;


            submitButton.innerHTML = `
                <span>
                    Continue to WhatsApp
                </span>

                <i class="fa-brands fa-whatsapp"></i>
            `;

        }


        /*
           Re-render cart.

           We intentionally DO NOT clear the cart here.
           This allows the customer to keep the order
           in the cart until the order is confirmed.
        */

        renderCartSidebar();

    }
    catch (error) {

        console.error(
            "Cart WhatsApp order error:",
            error
        );


        if (
            submitButton
        ) {

            submitButton.disabled =
                false;


            submitButton.innerHTML = `
                <span>
                    Continue to WhatsApp
                </span>

                <i class="fa-brands fa-whatsapp"></i>
            `;

        }


        alert(
            "Order failed: " +
            (
                error?.message ||
                "Unknown error"
            )
        );

    }

}


/* ============================================================
   CART UPDATED EVENT
   ============================================================ */

window.addEventListener(
    "cartUpdated",
    () => {

        updateCartCount();

        renderCartSidebar();

    }
);


/* ============================================================
   STORAGE EVENT
   ============================================================ */

window.addEventListener(
    "storage",
    event => {

        if (
            event.key === "storeCart"
        ) {

            updateCartCount();

            renderCartSidebar();

        }

    }
);


/* ============================================================
   ESC KEY
   ============================================================ */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key !== "Escape"
        ) {

            return;

        }


        closeCartSidebar();

        closeWhatsAppCustomerForm();

    }
);


/* ============================================================
   INITIALIZE
   ============================================================ */

async function initializeCartSidebar() {

    await loadSiteSettings();

    createCartSidebar();

    connectCartButton();

    updateCartCount();

    renderCartSidebar();

}


/* ============================================================
   INITIALIZE AFTER DOM
   ============================================================ */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeCartSidebar
    );

}
else {

    initializeCartSidebar();

}


/* ============================================================
   GLOBAL FUNCTIONS
   ============================================================ */

window.openCartSidebar =
    openCartSidebar;


window.closeCartSidebar =
    closeCartSidebar;


window.openWhatsAppCustomerForm =
    openWhatsAppCustomerForm;


window.closeWhatsAppCustomerForm =
    closeWhatsAppCustomerForm;


/* ============================================================
   EXPORTS
   ============================================================ */

export {

    openCartSidebar,

    closeCartSidebar,

    renderCartSidebar,

    updateCartCount

};