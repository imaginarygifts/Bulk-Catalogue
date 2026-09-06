/* ==================================================
   CART SIDEBAR
   SINGLE SOURCE OF TRUTH = cart.js
================================================== */

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
    getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


/* ==================================================
   SETTINGS
================================================== */

const CART_PAGE =
    "cart.html";

const ORDER_PAGE =
    "order";


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
   GET PRODUCT FROM CART ITEM
================================================== */

function getCartProduct(item) {

    const product = {
        ...(item.productSnapshot ||
            item.product ||
            {})
    };


    /*
     * Older cart items may have
     * productId only at root level.
     */

    if (
        !product.id &&
        item.productId
    ) {

        product.id =
            item.productId;

    }


    return product;

}


/* ==================================================
   GET PRODUCT IMAGE
================================================== */

function getProductImage(item) {

    if (
        item.image
    ) {

        return item.image;

    }


    if (
        Array.isArray(
            item.imageLinks
        ) &&
        item.imageLinks.length
    ) {

        return (
            item.imageLinks[0] ||
            ""
        );

    }


    const product =
        getCartProduct(item);


    if (
        Array.isArray(
            product.images
        ) &&
        product.images.length
    ) {

        const first =
            product.images[0];


        if (
            typeof first ===
            "string"
        ) {

            return first;

        }


        return (
            first?.url ||
            first?.src ||
            ""
        );

    }


    return (
        product.image ||
        product.imageUrl ||
        product.thumbnail ||
        ""
    );

}


/* ==================================================
   GET UNIT PRICE
================================================== */

function getUnitPrice(item) {

    if (
        item.price !==
        undefined &&
        item.price !==
        null
    ) {

        return Number(
            item.price
        ) || 0;

    }


    if (
        item.unitPrice !==
        undefined &&
        item.unitPrice !==
        null
    ) {

        return Number(
            item.unitPrice
        ) || 0;

    }


    const product =
        getCartProduct(item);


    if (
        product.salePrice !==
        undefined &&
        product.salePrice !==
        null &&
        product.salePrice !==
        ""
    ) {

        return Number(
            product.salePrice
        ) || 0;

    }


    if (
        product.basePrice !==
        undefined &&
        product.basePrice !==
        null
    ) {

        return Number(
            product.basePrice
        ) || 0;

    }


    return 0;

}


/* ==================================================
   GET QUANTITY
================================================== */

function getQuantity(item) {

    const quantity =
        Number(
            item.quantity
        );


    if (
        !Number.isFinite(
            quantity
        ) ||
        quantity < 1
    ) {

        return 1;

    }


    return quantity;

}


/* ==================================================
   GET SHIPPING
================================================== */

function getShippingForItem(item) {

    const product =
        getCartProduct(item);


    /*
     * COMMON SHIPPING SETTINGS
     */

    const shipping =
        product.shipping ||
        {};


    const shippingType =
        shipping.type ||
        shipping.shippingType ||
        product.shippingType ||
        "";


    let shippingAmount =
        Number(
            shipping.amount ??
            shipping.shippingAmount ??
            product.shippingAmount ??
            product.deliveryCharge ??
            0
        );


    if (
        !Number.isFinite(
            shippingAmount
        )
    ) {

        shippingAmount = 0;

    }


    /*
     * SIZE-SPECIFIC SHIPPING
     */

    const selectedSize =
        item.size ||
        "";


    const sizes =
        product.variants?.sizes;


    if (
        selectedSize &&
        Array.isArray(
            sizes
        )
    ) {

        const sizeItem =
            sizes.find(
                size =>
                    String(
                        size?.name ??
                        size?.label ??
                        size?.value ??
                        ""
                    ).trim()
                    ===
                    String(
                        selectedSize
                    ).trim()
            );


        if (
            sizeItem
        ) {

            const sizeShipping =
                sizeItem.shipping ||
                {};


            const sizeAmount =
                sizeShipping.amount ??
                sizeShipping.shippingAmount ??
                sizeItem.shippingAmount;


            if (
                sizeAmount !==
                undefined &&
                sizeAmount !==
                null &&
                sizeAmount !==
                ""
            ) {

                shippingAmount =
                    Number(
                        sizeAmount
                    ) || 0;

            }

        }

    }


    /*
     * FREE SHIPPING
     */

    if (
        shippingType ===
        "free"
    ) {

        return 0;

    }


    /*
     * Common alternative
     * values used by products.
     */

    if (
        shippingType ===
        "none" ||
        shippingType ===
        "noShipping"
    ) {

        return 0;

    }


    return Math.max(
        0,
        shippingAmount
    );

}


/* ==================================================
   GET CART TOTALS
================================================== */

function getCartTotals(cart) {

    let subtotal =
        0;

    let shipping =
        0;


    cart.forEach(
        item => {

            const quantity =
                getQuantity(item);


            const price =
                getUnitPrice(item);


            subtotal +=
                price *
                quantity;


            shipping +=
                getShippingForItem(
                    item
                );

        }
    );


    return {

        subtotal,

        shipping,

        total:
            subtotal +
            shipping

    };

}


/* ==================================================
   CREATE SIDEBAR
================================================== */

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


    overlay.innerHTML = `

        <aside
            class="cart-sidebar"
            id="cartSidebar"
            aria-label="Shopping Cart"
        >

            <div class="cart-sidebar-header">

                <div class="cart-sidebar-title">

                    <i class="fa-solid fa-cart-shopping"></i>

                    <span>
                        Your Cart
                    </span>

                </div>


                <button
                    type="button"
                    id="closeCartSidebar"
                    class="cart-sidebar-close"
                    aria-label="Close Cart"
                >
                    <i class="fa-solid fa-xmark"></i>
                </button>

            </div>


            <div
                class="cart-sidebar-body"
                id="cartSidebarBody"
            ></div>


            <div
                class="cart-sidebar-footer"
                id="cartSidebarFooter"
            ></div>

        </aside>

    `;


    document.body.appendChild(
        overlay
    );


    /*
     * CLOSE BUTTON
     */

    document
        .getElementById(
            "closeCartSidebar"
        )
        ?.addEventListener(
            "click",
            closeCartSidebar
        );


    /*
     * CLICK OUTSIDE
     */

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

}


/* ==================================================
   OPEN CART SIDEBAR
================================================== */

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


    /*
     * Force layout before
     * adding the show class.
     */

    requestAnimationFrame(
        () => {

            overlay.classList.add(
                "show"
            );

        }
    );


    document.body.classList.add(
        "cart-sidebar-open"
    );

}


/* ==================================================
   CLOSE CART SIDEBAR
================================================== */

function closeCartSidebar() {

    const overlay =
        document.getElementById(
            "cartSidebarOverlay"
        );


    if (!overlay) {

        return;

    }


    overlay.classList.remove(
        "show"
    );


    document.body.classList.remove(
        "cart-sidebar-open"
    );

}


/* ==================================================
   EMPTY CART
================================================== */

function renderEmptyCart() {

    const body =
        document.getElementById(
            "cartSidebarBody"
        );


    const footer =
        document.getElementById(
            "cartSidebarFooter"
        );


    if (body) {

        body.innerHTML = `

            <div class="cart-empty">

                <div class="cart-empty-icon">

                    <i class="fa-solid fa-cart-shopping"></i>

                </div>


                <h3>
                    Your cart is empty
                </h3>


                <p>
                    Add some products to your cart.
                </p>

            </div>

        `;

    }


    if (footer) {

        footer.innerHTML = "";

    }

}


/* ==================================================
   RENDER CART ITEM
================================================== */

function renderCartItem(
    item,
    index
) {

    const product =
        getCartProduct(item);


    const name =
        item.name ||
        product.name ||
        "Product";


    const image =
        getProductImage(item);


    const price =
        getUnitPrice(item);


    const quantity =
        getQuantity(item);


    const lineTotal =
        price *
        quantity;


    let optionsHtml =
        "";


    /*
     * COLOR
     */

    if (
        item.color
    ) {

        optionsHtml += `

            <div class="cart-item-option">

                <span>
                    Color:
                </span>

                <strong>
                    ${escapeHtml(
                        item.color
                    )}
                </strong>

            </div>

        `;

    }


    /*
     * SIZE
     */

    if (
        item.size
    ) {

        optionsHtml += `

            <div class="cart-item-option">

                <span>
                    Size:
                </span>

                <strong>
                    ${escapeHtml(
                        item.size
                    )}
                </strong>

            </div>

        `;

    }


    /*
     * CUSTOM OPTIONS
     */

    if (
        item.optionValues &&
        typeof item.optionValues ===
        "object"
    ) {

        Object.entries(
            item.optionValues
        ).forEach(
            ([key, value]) => {

                if (
                    value ===
                    undefined ||
                    value ===
                    null ||
                    value ===
                    ""
                ) {

                    return;

                }


                let label =
                    key;


                /*
                 * Try to find the
                 * original custom option label.
                 */

                if (
                    Array.isArray(
                        product.customOptions
                    )
                ) {

                    const numericIndex =
                        Number(key);


                    if (
                        Number.isInteger(
                            numericIndex
                        ) &&
                        product
                            .customOptions[
                                numericIndex
                            ]
                    ) {

                        label =
                            product
                                .customOptions[
                                    numericIndex
                                ]
                                .label ||
                            key;

                    }

                }


                optionsHtml += `

                    <div class="cart-item-option">

                        <span>
                            ${escapeHtml(
                                label
                            )}:
                        </span>

                        <strong>
                            ${escapeHtml(
                                String(value)
                            )}
                        </strong>

                    </div>

                `;

            }
        );

    }


    return `

        <div
            class="cart-sidebar-item"
            data-cart-key="${escapeHtml(
                item.cartItemKey ||
                ""
            )}"
        >

            <div class="cart-item-image-wrap">

                ${
                    image
                    ?
                    `
                    <img
                        class="cart-item-image"
                        src="${escapeHtml(
                            image
                        )}"
                        alt="${escapeHtml(
                            name
                        )}"
                        loading="lazy"
                    >
                    `
                    :
                    `
                    <div class="cart-item-image-placeholder">
                        <i class="fa-solid fa-image"></i>
                    </div>
                    `
                }

            </div>


            <div class="cart-item-content">

                <div class="cart-item-top">

                    <div class="cart-item-name">

                        ${escapeHtml(
                            name
                        )}

                    </div>


                    <button
                        type="button"
                        class="cart-item-remove"
                        data-remove-cart-item="${escapeHtml(
                            item.cartItemKey ||
                            ""
                        )}"
                        aria-label="Remove ${escapeHtml(
                            name
                        )}"
                    >

                        <i class="fa-solid fa-trash"></i>

                    </button>

                </div>


                ${
                    optionsHtml
                    ?
                    `
                    <div class="cart-item-options">
                        ${optionsHtml}
                    </div>
                    `
                    :
                    ""
                }


                <div class="cart-item-bottom">

                    <div class="cart-item-price">

                        ₹${price.toFixed(2)}

                    </div>


                    <div class="cart-item-quantity">

                        <button
                            type="button"
                            class="cart-quantity-btn"
                            data-cart-minus="${escapeHtml(
                                item.cartItemKey ||
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
                            class="cart-quantity-btn"
                            data-cart-plus="${escapeHtml(
                                item.cartItemKey ||
                                ""
                            )}"
                            aria-label="Increase quantity"
                        >
                            +
                        </button>

                    </div>


                    <div class="cart-item-line-total">

                        ₹${lineTotal.toFixed(2)}

                    </div>

                </div>

            </div>

        </div>

    `;

}


/* ==================================================
   RENDER CART SIDEBAR
================================================== */

function renderCartSidebar() {

    createCartSidebar();


    const body =
        document.getElementById(
            "cartSidebarBody"
        );


    const footer =
        document.getElementById(
            "cartSidebarFooter"
        );


    if (
        !body ||
        !footer
    ) {

        return;

    }


    const cart =
        getCart();


    if (
        !Array.isArray(
            cart
        ) ||
        !cart.length
    ) {

        renderEmptyCart();

        return;

    }


    /*
     * ITEMS
     */

    body.innerHTML =
        cart
            .map(
                (
                    item,
                    index
                ) =>
                    renderCartItem(
                        item,
                        index
                    )
            )
            .join("");


    /*
     * TOTALS
     */

    const totals =
        getCartTotals(
            cart
        );


    footer.innerHTML = `

        <div class="cart-price-summary">

            <div class="cart-price-row">

                <span>
                    Subtotal
                </span>

                <strong>
                    ₹${totals.subtotal.toFixed(2)}
                </strong>

            </div>


            <div class="cart-price-row">

                <span>
                    Shipping
                </span>

                <strong>

                    ${
                        totals.shipping <= 0
                        ?
                        "FREE"
                        :
                        `₹${totals.shipping.toFixed(2)}`
                    }

                </strong>

            </div>


            <div class="cart-price-row cart-total-row">

                <span>
                    Total
                </span>

                <strong>
                    ₹${totals.total.toFixed(2)}
                </strong>

            </div>

        </div>


        <div class="cart-sidebar-actions">

            <button
                type="button"
                class="cart-view-button"
                id="cartViewButton"
            >

                View Cart

            </button>


            <button
                type="button"
                class="cart-checkout-button"
                id="cartCheckoutButton"
            >

                Checkout

            </button>

        </div>

    `;


    /*
     * QUANTITY BUTTONS
     */

    body
        .querySelectorAll(
            "[data-cart-minus]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const key =
                            button.dataset
                                .cartMinus;


                        if (!key) {

                            return;

                        }


                        const latestCart =
                            getCart();


                        const item =
                            latestCart.find(
                                cartItem =>
                                    cartItem
                                        .cartItemKey
                                    ===
                                    key
                            );


                        if (!item) {

                            return;

                        }


                        const quantity =
                            getQuantity(
                                item
                            );


                        setCartItemQuantity(
                            key,
                            quantity - 1
                        );

                    }
                );

            }
        );


    body
        .querySelectorAll(
            "[data-cart-plus]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const key =
                            button.dataset
                                .cartPlus;


                        if (!key) {

                            return;

                        }


                        const latestCart =
                            getCart();


                        const item =
                            latestCart.find(
                                cartItem =>
                                    cartItem
                                        .cartItemKey
                                    ===
                                    key
                            );


                        if (!item) {

                            return;

                        }


                        const quantity =
                            getQuantity(
                                item
                            );


                        setCartItemQuantity(
                            key,
                            quantity + 1
                        );

                    }
                );

            }
        );


    /*
     * REMOVE BUTTONS
     */

    body
        .querySelectorAll(
            "[data-remove-cart-item]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const key =
                            button.dataset
                                .removeCartItem;


                        if (!key) {

                            return;

                        }


                        removeCartItem(
                            key
                        );

                    }
                );

            }
        );


    /*
     * VIEW CART
     */

    document
        .getElementById(
            "cartViewButton"
        )
        ?.addEventListener(
            "click",
            () => {

                window.location.href =
                    CART_PAGE;

            }
        );


    /*
     * CHECKOUT
     */

    document
        .getElementById(
            "cartCheckoutButton"
        )
        ?.addEventListener(
            "click",
            handleCheckout
        );

}


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

            return snapshot.data();

        }


        return {};

    }
    catch (
        error
    ) {

        console.error(
            "Cart sidebar settings error:",
            error
        );


        return {};

    }

}


/* ==================================================
   GET WHATSAPP NUMBER
================================================== */

function getWhatsAppNumber(
    settings
) {

    return String(
        settings.whatsapp ||
        ""
    )
        .replace(
            /\D/g,
            ""
        );

}


/* ==================================================
   BUILD WHATSAPP MESSAGE
================================================== */

function buildWhatsAppMessage(
    cart,
    totals,
    settings
) {

    const companyName =
        settings.companyName ||
        "Imaginary Gifts";


    let message =
        `🛍 *New Cart Order — ${companyName}*\n\n`;


    message +=
        `📦 *Order Summary*\n`;


    message +=
        `━━━━━━━━━━━━━━━━━━━━\n`;


    cart.forEach(
        (
            item,
            index
        ) => {

            const product =
                getCartProduct(
                    item
                );


            const name =
                item.name ||
                product.name ||
                "Product";


            const quantity =
                getQuantity(
                    item
                );


            const price =
                getUnitPrice(
                    item
                );


            const lineTotal =
                price *
                quantity;


            message +=
                `\n${index + 1}. *${name}*\n`;


            message +=
                `Quantity: ${quantity}\n`;


            message +=
                `Price: ₹${lineTotal.toFixed(2)}\n`;


            /*
             * COLOR
             */

            if (
                item.color
            ) {

                message +=
                    `Color: ${item.color}\n`;

            }


            /*
             * SIZE
             */

            if (
                item.size
            ) {

                message +=
                    `Size: ${item.size}\n`;

            }


            /*
             * CUSTOM OPTIONS
             */

            if (
                item.optionValues &&
                typeof item.optionValues ===
                "object"
            ) {

                Object.entries(
                    item.optionValues
                ).forEach(
                    (
                        [
                            key,
                            value
                        ]
                    ) => {

                        if (
                            value ===
                            undefined ||
                            value ===
                            null ||
                            value ===
                            ""
                        ) {

                            return;

                        }


                        let label =
                            key;


                        /*
                         * Use original custom
                         * option label if available.
                         */

                        if (
                            Array.isArray(
                                product.customOptions
                            )
                        ) {

                            const numericIndex =
                                Number(key);


                            if (
                                Number.isInteger(
                                    numericIndex
                                ) &&
                                product
                                    .customOptions[
                                        numericIndex
                                    ]
                            ) {

                                label =
                                    product
                                        .customOptions[
                                            numericIndex
                                        ]
                                        .label ||
                                    key;

                            }

                        }


                        message +=
                            `${label}: ${String(value)}\n`;

                    }
                );

            }

        }
    );


    message +=
        `\n━━━━━━━━━━━━━━━━━━━━\n`;


    message +=
        `Subtotal: ₹${totals.subtotal.toFixed(2)}\n`;


    message +=
        `Shipping: ${
            totals.shipping <= 0
            ?
            "FREE"
            :
            `₹${totals.shipping.toFixed(2)}`
        }\n`;


    message +=
        `*Total: ₹${totals.total.toFixed(2)}*\n`;


    message +=
        `\nPlease confirm my order and share the next steps.`;



    return message;

}


/* ==================================================
   CHECKOUT
================================================== */

async function handleCheckout() {

    /*
     * Always get the latest cart.
     */

    const cart =
        getCart();


    if (
        !Array.isArray(
            cart
        ) ||
        !cart.length
    ) {

        alert(
            "Your cart is empty."
        );

        return;

    }


    /*
     * Make sure every cart item
     * has a valid product ID.
     */

    const validCart =
        cart.filter(
            item => {

                const product =
                    getCartProduct(
                        item
                    );


                return Boolean(
                    product.id
                );

            }
        );


    if (
        !validCart.length
    ) {

        alert(
            "Your cart contains no valid products."
        );

        return;

    }


    /*
     * Load current settings.
     */

    const settings =
        await loadSiteSettings();


    /*
     * ==========================================
     * WHATSAPP CHECKOUT
     * ==========================================
     */

    if (
        settings.orderButton ===
        "whatsapp"
    ) {

        const whatsappNumber =
            getWhatsAppNumber(
                settings
            );


        if (
            !whatsappNumber
        ) {

            alert(
                "WhatsApp number is not configured in Site Settings."
            );

            return;

        }


        const totals =
            getCartTotals(
                validCart
            );


        const message =
            buildWhatsAppMessage(
                validCart,
                totals,
                settings
            );


        const whatsappUrl =
            `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                message
            )}`;


        /*
         * Close drawer first.
         */

        closeCartSidebar();


        /*
         * Directly open WhatsApp.
         *
         * NO order page.
         */

        window.location.href =
            whatsappUrl;


        return;

    }


    /*
     * ==========================================
     * NORMAL BUY NOW CHECKOUT
     * ==========================================
     */

    const checkoutItems =
        validCart
            .map(
                item => {

                    const product =
                        getCartProduct(
                            item
                        );


                    return {

                        product,

                        finalPrice:
                            Number(
                                item.price ||
                                0
                            ) *
                            Number(
                                item.quantity ||
                                1
                            ),

                        quantity:
                            Number(
                                item.quantity ||
                                1
                            ),

                        color:
                            item.color ||
                            "",

                        size:
                            item.size ||
                            "",

                        options:
                            item.options ||
                            {},

                        optionValues:
                            item.optionValues ||
                            {},

                        imageLinks:
                            item.imageLinks ||
                            [],

                        cartItemKey:
                            item.cartItemKey ||
                            ""

                    };

                }
            );


    if (
        !checkoutItems.length
    ) {

        alert(
            "Your cart contains no valid products."
        );

        return;

    }


    /*
     * Save checkout data
     * for order page.
     */

    localStorage.setItem(
        "checkoutData",
        JSON.stringify({
            items:
                checkoutItems
        })
    );


    /*
     * Close sidebar.
     */

    closeCartSidebar();


    /*
     * Go to order page.
     */

    window.location.href =
        ORDER_PAGE;

}


/* ==================================================
   CART ICON
================================================== */

function connectCartButton() {

    const button =
        document.getElementById(
            "cartButton"
        );


    if (!button) {

        return;

    }


    /*
     * Avoid attaching the
     * same listener multiple times.
     */

    if (
        button.dataset
            .cartSidebarConnected ===
        "true"
    ) {

        return;

    }


    button.dataset
        .cartSidebarConnected =
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


/* ==================================================
   CART UPDATED EVENT
================================================== */

window.addEventListener(
    "cartUpdated",
    () => {

        /*
         * Update the sidebar only
         * if it currently exists.
         */

        if (
            document.getElementById(
                "cartSidebarOverlay"
            )
        ) {

            renderCartSidebar();

        }

    }
);


/* ==================================================
   STORAGE EVENT
================================================== */

window.addEventListener(
    "storage",
    event => {

        if (
            event.key ===
            "storeCart"
        ) {

            if (
                document.getElementById(
                    "cartSidebarOverlay"
                )
            ) {

                renderCartSidebar();

            }

        }

    }
);


/* ==================================================
   ESCAPE KEY
================================================== */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Escape"
        ) {

            closeCartSidebar();

        }

    }
);


/* ==================================================
   INITIALIZE
================================================== */

function initializeCartSidebar() {

    createCartSidebar();

    connectCartButton();

}


/* ==================================================
   DOM READY
================================================== */

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


/* ==================================================
   GLOBAL FUNCTIONS
================================================== */

window.openCartSidebar =
    openCartSidebar;


window.closeCartSidebar =
    closeCartSidebar;


window.renderCartSidebar =
    renderCartSidebar;