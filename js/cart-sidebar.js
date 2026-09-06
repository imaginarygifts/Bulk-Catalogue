/* ==================================================
   CART SIDEBAR
   ==================================================
   - No cart.html required
   - Opens from #cartButton
   - Uses cart.js as the SINGLE cart system
   - Quantity + / -
   - Remove item
   - Subtotal
   - Shipping estimate
   - Total
   - Direct Checkout → order
   - Real-time cart synchronization
================================================== */


/* ==================================================
   IMPORT CART SYSTEM
================================================== */

import {
    getCart,
    setCartItemQuantity,
    removeCartItem
} from "./cart.js";


/* ==================================================
   SETTINGS
================================================== */

const CHECKOUT_PAGE =
    "order";


/* ==================================================
   HELPERS
================================================== */

function formatMoney(value) {

    const amount =
        Number(
            value || 0
        );


    return amount.toLocaleString(
        "en-IN",
        {
            maximumFractionDigits: 2
        }
    );

}


function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


/* ==================================================
   PRICE
================================================== */

function getCartItemUnitPrice(item) {

    /*
       cart.js stores the final selected
       configuration price in item.price.
    */

    if (
        item.price !== undefined &&
        item.price !== null
    ) {

        return Number(
            item.price
        ) || 0;

    }


    if (
        item.unitPrice !== undefined &&
        item.unitPrice !== null
    ) {

        return Number(
            item.unitPrice
        ) || 0;

    }


    const product =
        item.productSnapshot ||
        item.product ||
        {};


    return Number(
        product.salePrice ??
        product.basePrice ??
        0
    ) || 0;

}


function getCartItemTotal(item) {

    const quantity =
        Math.max(
            Number(
                item.quantity || 1
            ),
            1
        );


    return (
        getCartItemUnitPrice(item) *
        quantity
    );

}


/* ==================================================
   PRODUCT IMAGE
================================================== */

function getCartItemImage(item) {

    if (
        item.image
    ) {

        return item.image;

    }


    if (
        Array.isArray(
            item.images
        ) &&
        item.images.length
    ) {

        const first =
            item.images[0];


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


    if (
        item.productSnapshot &&
        Array.isArray(
            item.productSnapshot.images
        ) &&
        item.productSnapshot.images.length
    ) {

        const first =
            item.productSnapshot.images[0];


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


    if (
        item.product &&
        Array.isArray(
            item.product.images
        ) &&
        item.product.images.length
    ) {

        const first =
            item.product.images[0];


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


    return "";

}


/* ==================================================
   CONFIGURATION TEXT
================================================== */

function getConfigurationHtml(item) {

    let html = "";


    /* ==================================================
       COLOR
    ================================================== */

    if (
        item.color
    ) {

        const color =
            typeof item.color === "object"
                ? (
                    item.color.name ||
                    item.color.value ||
                    ""
                )
                : item.color;


        if (
            color
        ) {

            html += `

                <div class="cart-item-option">

                    Color:
                    ${escapeHtml(color)}

                </div>

            `;

        }

    }


    /* ==================================================
       SIZE
    ================================================== */

    if (
        item.size
    ) {

        const size =
            typeof item.size === "object"
                ? (
                    item.size.name ||
                    item.size.value ||
                    ""
                )
                : item.size;


        if (
            size
        ) {

            html += `

                <div class="cart-item-option">

                    Size:
                    ${escapeHtml(size)}

                </div>

            `;

        }

    }


    /* ==================================================
       CUSTOM OPTIONS
    ================================================== */

    const optionValues =
        item.optionValues ||
        {};


    const optionKeys =
        Object.keys(
            optionValues
        );


    if (
        optionKeys.length
    ) {

        const product =
            item.productSnapshot ||
            item.product ||
            {};


        const customOptions =
            product.customOptions ||
            {};


        optionKeys.forEach(
            key => {

                const value =
                    optionValues[key];


                if (
                    value === undefined ||
                    value === null ||
                    value === ""
                ) {

                    return;

                }


                const option =
                    customOptions[key];


                const label =
                    option?.label ||
                    key;


                html += `

                    <div class="cart-item-option">

                        ${escapeHtml(label)}:
                        ${escapeHtml(value)}

                    </div>

                `;

            }
        );

    }


    return html;

}


/* ==================================================
   SHIPPING
================================================== */

function getCommonProductShipping(
    product
) {

    if (
        !product
    ) {

        return {

            type:
                "free",

            amount:
                0

        };

    }


    const shipping =
        product.shipping ||
        {};


    let type =
        shipping.type ??
        shipping.shippingType ??
        product.shippingType ??
        "free";


    type =
        String(
            type
        )
        .toLowerCase();


    const amount =
        Number(
            shipping.amount ??
            shipping.shippingAmount ??
            product.shippingAmount ??
            0
        ) || 0;


    if (
        type === "free" ||
        type === "none"
    ) {

        return {

            type:
                "free",

            amount:
                0

        };

    }


    if (
        type === "paid" ||
        type === "fixed" ||
        type === "amount"
    ) {

        return {

            type:
                "paid",

            amount:
                Math.max(
                    0,
                    amount
                )

        };

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


/* ==================================================
   SIZE SHIPPING
================================================== */

function getSelectedSizeShipping(
    item
) {

    const product =
        item.productSnapshot ||
        item.product ||
        {};


    const sizes =
        product?.variants?.sizes;


    if (
        !Array.isArray(sizes) ||
        !sizes.length ||
        !item.size
    ) {

        return null;

    }


    const selectedSizeName =
        typeof item.size === "object"
            ? String(
                item.size.name ||
                item.size.value ||
                ""
            ).trim()
            : String(
                item.size
            ).trim();


    if (
        !selectedSizeName
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


    if (
        !selected
    ) {

        return null;

    }


    const type =
        String(
            selected.shippingType ??
            selected.shipping?.type ??
            "common"
        )
        .toLowerCase();


    const amount =
        Number(
            selected.shippingAmount ??
            selected.shipping?.amount ??
            0
        ) || 0;


    if (
        type === "free"
    ) {

        return {

            type:
                "free",

            amount:
                0

        };

    }


    if (
        type === "paid"
    ) {

        return {

            type:
                "paid",

            amount:
                Math.max(
                    0,
                    amount
                )

        };

    }


    return null;

}


/* ==================================================
   ITEM SHIPPING
================================================== */

function getCartItemShipping(
    item
) {

    const quantity =
        Math.max(
            Number(
                item.quantity || 1
            ),
            1
        );


    /*
       Size-specific shipping has priority.
    */

    const sizeShipping =
        getSelectedSizeShipping(
            item
        );


    if (
        sizeShipping
    ) {

        return (
            sizeShipping.amount *
            quantity
        );

    }


    const product =
        item.productSnapshot ||
        item.product ||
        {};


    const common =
        getCommonProductShipping(
            product
        );


    return (
        common.amount *
        quantity
    );

}


/* ==================================================
   CART TOTALS
================================================== */

function calculateCartTotals(
    cart
) {

    let subtotal = 0;

    let shipping = 0;


    cart.forEach(
        item => {

            subtotal +=
                getCartItemTotal(
                    item
                );


            shipping +=
                getCartItemShipping(
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
   UPDATE CART COUNT
================================================== */

function updateCartCount(
    cart
) {

    const count =
        cart.reduce(
            (
                total,
                item
            ) => {

                return (
                    total +
                    Math.max(
                        Number(
                            item.quantity || 0
                        ),
                        0
                    )
                );

            },
            0
        );


    document
        .querySelectorAll(
            "#cartCount"
        )
        .forEach(
            element => {

                element.innerText =
                    String(
                        count
                    );


                element.classList.toggle(
                    "show",
                    count > 0
                );

            }
        );

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

        <div
            class="cart-sidebar"
            id="cartSidebar"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping Cart"
        >

            <!-- HEADER -->

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
                    aria-label="Close cart"
                >

                    <i class="fa-solid fa-xmark"></i>

                </button>

            </div>


            <!-- BODY -->

            <div
                class="cart-sidebar-body"
                id="cartSidebarBody"
            ></div>


            <!-- FOOTER -->

            <div
                class="cart-sidebar-footer"
                id="cartSidebarFooter"
            ></div>

        </div>

    `;


    document.body.appendChild(
        overlay
    );


    /* ==================================================
       CLOSE BUTTON
    ================================================== */

    document
        .getElementById(
            "closeCartSidebar"
        )
        ?.addEventListener(
            "click",
            closeCartSidebar
        );


    /* ==================================================
       OUTSIDE CLICK
    ================================================== */

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
   RENDER CART
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


    /*
       IMPORTANT:

       Always get the latest cart from
       cart.js.
    */

    const cart =
        getCart();


    updateCartCount(
        cart
    );


    /* ==================================================
       EMPTY CART
    ================================================== */

    if (
        !cart.length
    ) {

        body.innerHTML = `

            <div class="cart-empty">

                <div class="cart-empty-icon">

                    <i class="fa-solid fa-cart-shopping"></i>

                </div>


                <h3>

                    Your cart is empty

                </h3>


                <p>

                    Add products to your cart
                    and they will appear here.

                </p>

            </div>

        `;


        footer.innerHTML =
            "";


        return;

    }


    /* ==================================================
       CART ITEMS
    ================================================== */

    let html = "";


    cart.forEach(
        (
            item,
            index
        ) => {

            const image =
                getCartItemImage(
                    item
                );


            const name =
                item.name ||
                item.productSnapshot?.name ||
                item.product?.name ||
                "Product";


            const quantity =
                Math.max(
                    Number(
                        item.quantity || 1
                    ),
                    1
                );


            const unitPrice =
                getCartItemUnitPrice(
                    item
                );


            const itemTotal =
                getCartItemTotal(
                    item
                );


            const configHtml =
                getConfigurationHtml(
                    item
                );


            html += `

                <div
                    class="cart-sidebar-item"
                    data-cart-key="${escapeHtml(
                        item.cartItemKey || ""
                    )}"
                >

                    <!-- IMAGE -->

                    <div class="cart-sidebar-item-image">

                        ${
                            image

                                ?

                                `

                                    <img
                                        src="${escapeHtml(image)}"
                                        alt="${escapeHtml(name)}"
                                        loading="lazy"
                                    >

                                `

                                :

                                `

                                    <div class="cart-no-image">

                                        <i class="fa-solid fa-image"></i>

                                    </div>

                                `
                        }

                    </div>


                    <!-- INFO -->

                    <div class="cart-sidebar-item-info">

                        <div class="cart-sidebar-item-top">

                            <div class="cart-sidebar-item-name">

                                ${escapeHtml(name)}

                            </div>


                            <button
                                type="button"
                                class="cart-remove-button"
                                data-action="remove"
                                data-index="${index}"
                                aria-label="Remove ${escapeHtml(name)}"
                            >

                                <i class="fa-solid fa-trash"></i>

                            </button>

                        </div>


                        <div class="cart-sidebar-item-price">

                            ₹${formatMoney(unitPrice)}

                        </div>


                        ${
                            configHtml

                                ?

                                `

                                    <div class="cart-sidebar-item-options">

                                        ${configHtml}

                                    </div>

                                `

                                :

                                ""
                        }


                        <div class="cart-sidebar-item-bottom">

                            <!-- QUANTITY -->

                            <div class="cart-sidebar-quantity">

                                <button
                                    type="button"
                                    class="cart-quantity-button"
                                    data-action="decrease"
                                    data-index="${index}"
                                    aria-label="Decrease quantity"
                                >

                                    −

                                </button>


                                <span class="cart-sidebar-quantity-value">

                                    ${quantity}

                                </span>


                                <button
                                    type="button"
                                    class="cart-quantity-button"
                                    data-action="increase"
                                    data-index="${index}"
                                    aria-label="Increase quantity"
                                >

                                    +

                                </button>

                            </div>


                            <!-- LINE TOTAL -->

                            <div class="cart-sidebar-item-total">

                                ₹${formatMoney(itemTotal)}

                            </div>

                        </div>

                    </div>

                </div>

            `;

        }
    );


    body.innerHTML =
        html;


    /* ==================================================
       PRICE BREAKDOWN
    ================================================== */

    const totals =
        calculateCartTotals(
            cart
        );


    footer.innerHTML = `

        <div class="cart-price-breakdown">

            <div class="cart-price-row">

                <span>
                    Subtotal
                </span>

                <strong>

                    ₹${formatMoney(
                        totals.subtotal
                    )}

                </strong>

            </div>


            <div class="cart-price-row">

                <span>
                    Shipping
                </span>

                <strong>

                    ${
                        totals.shipping > 0

                            ?

                            `₹${formatMoney(
                                totals.shipping
                            )}`

                            :

                            "FREE"
                    }

                </strong>

            </div>


            <div class="cart-price-divider"></div>


            <div class="cart-price-row cart-total-row">

                <span>
                    Total
                </span>

                <strong>

                    ₹${formatMoney(
                        totals.total
                    )}

                </strong>

            </div>

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

    `;


    /* ==================================================
       QUANTITY / REMOVE EVENTS
    ================================================== */

    body
        .querySelectorAll(
            "[data-action]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const index =
                            Number(
                                button.dataset.index
                            );


                        const action =
                            button.dataset.action;


                        handleCartAction(
                            action,
                            index
                        );

                    }
                );

            }
        );


    /* ==================================================
       CHECKOUT
    ================================================== */

    document
        .getElementById(
            "cartCheckoutButton"
        )
        ?.addEventListener(
            "click",
            checkoutFromCart
        );

}


/* ==================================================
   CART ACTIONS
================================================== */

function handleCartAction(
    action,
    index
) {

    /*
       Always read the newest cart from cart.js.
    */

    const cart =
        getCart();


    if (
        !cart[index]
    ) {

        return;

    }


    const item =
        cart[index];


    const cartItemKey =
        item.cartItemKey;


    if (
        !cartItemKey
    ) {

        return;

    }


    const currentQuantity =
        Math.max(
            Number(
                item.quantity || 1
            ),
            1
        );


    /* ==================================================
       DECREASE
    ================================================== */

    if (
        action === "decrease"
    ) {

        /*
           When quantity reaches 0,
           cart.js automatically removes it.
        */

        setCartItemQuantity(
            cartItemKey,
            currentQuantity - 1
        );

        return;

    }


    /* ==================================================
       INCREASE
    ================================================== */

    if (
        action === "increase"
    ) {

        setCartItemQuantity(
            cartItemKey,
            currentQuantity + 1
        );

        return;

    }


    /* ==================================================
       REMOVE
    ================================================== */

    if (
        action === "remove"
    ) {

        removeCartItem(
            cartItemKey
        );

        return;

    }

}


/* ==================================================
   OPEN CART
================================================== */

function openCartSidebar() {

    createCartSidebar();

    renderCartSidebar();


    const overlay =
        document.getElementById(
            "cartSidebarOverlay"
        );


    if (
        !overlay
    ) {

        return;

    }


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
   CLOSE CART
================================================== */

function closeCartSidebar() {

    const overlay =
        document.getElementById(
            "cartSidebarOverlay"
        );


    if (
        !overlay
    ) {

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
   CART BUTTON
================================================== */

function connectCartButton() {

    document
        .querySelectorAll(
            "#cartButton"
        )
        .forEach(
            button => {

                if (
                    button.dataset.cartSidebarConnected ===
                    "true"
                ) {

                    return;

                }


                button.dataset.cartSidebarConnected =
                    "true";


                button.addEventListener(
                    "click",
                    event => {

                        /*
                           The cart icon is an <a>
                           pointing to cart.html.

                           Stop navigation and open
                           the drawer instead.
                        */

                        event.preventDefault();

                        event.stopPropagation();

                        openCartSidebar();

                    }
                );

            }
        );

}


/* ==================================================
   CHECKOUT
================================================== */

function checkoutFromCart() {

    /*
       Always get the newest cart.
    */

    const cart =
        getCart();


    if (
        !cart.length
    ) {

        return;

    }


    /* ==================================================
       BUILD CHECKOUT ITEMS
    ================================================== */

    const items =
        cart
            .map(
                item => {

                    /*
                       Use product snapshot first.
                    */

                    const product = {

                        ...(
                            item.productSnapshot ||
                            item.product ||
                            {}

                        )

                    };


                    /*
                       Older cart items may not have
                       productSnapshot.id.

                       Restore it from productId.
                    */

                    if (
                        !product.id &&
                        item.productId
                    ) {

                        product.id =
                            item.productId;

                    }


                    /*
                       Make sure product has a name.
                    */

                    if (
                        !product.name &&
                        item.name
                    ) {

                        product.name =
                            item.name;

                    }


                    /*
                       Make sure product has image data
                       when available.
                    */

                    if (
                        !Array.isArray(
                            product.images
                        ) &&
                        item.image
                    ) {

                        product.images = [
                            item.image
                        ];

                    }


                    /*
                       INVALID PRODUCT
                    */

                    if (
                        !product.id
                    ) {

                        console.warn(
                            "Skipping cart item without product ID:",
                            item
                        );

                        return null;

                    }


                    const quantity =
                        Math.max(
                            Number(
                                item.quantity || 1
                            ),
                            1
                        );


                    const lineTotal =
                        getCartItemTotal(
                            item
                        );


                    return {

                        product,


                        /*
                           order.js expects
                           finalPrice as LINE TOTAL.
                        */

                        finalPrice:
                            lineTotal,


                        quantity,


                        color:
                            item.color ||
                            null,


                        size:
                            item.size ||
                            null,


                        options:
                            item.options ||
                            {},


                        optionValues:
                            item.optionValues ||
                            {},


                        imageLinks:
                            item.imageLinks ||
                            {},


                        cartItemKey:
                            item.cartItemKey ||
                            null

                    };

                }
            )
            .filter(Boolean);


    /* ==================================================
       VALIDATION
    ================================================== */

    if (
        !items.length
    ) {

        alert(
            "Your cart contains no valid products."
        );

        return;

    }


    /* ==================================================
       CHECKOUT DATA
    ================================================== */

    const checkoutData = {

        items

    };


    /* ==================================================
       SAVE CHECKOUT DATA
    ================================================== */

    try {

        localStorage.setItem(
            "checkoutData",
            JSON.stringify(
                checkoutData
            )
        );

    }

    catch (error) {

        console.error(
            "Checkout data save error:",
            error
        );


        alert(
            "Unable to prepare checkout. Please try again."
        );

        return;

    }


    /* ==================================================
       CLOSE SIDEBAR
    ================================================== */

    closeCartSidebar();


    /* ==================================================
       GO TO CHECKOUT
    ================================================== */

    location.href =
        CHECKOUT_PAGE;

}


/* ==================================================
   CART UPDATED
==================================================

   cart.js dispatches this event after:

   • Add to cart
   • Increase
   • Decrease
   • Remove
   • Clear cart

   Therefore the sidebar automatically refreshes.
================================================== */

window.addEventListener(
    "cartUpdated",
    event => {

        /*
           Prefer the cart supplied by cart.js.
        */

        const cart =
            event.detail?.cart ||
            getCart();


        updateCartCount(
            cart
        );


        const overlay =
            document.getElementById(
                "cartSidebarOverlay"
            );


        /*
           If sidebar is currently open,
           immediately redraw it.
        */

        if (
            overlay &&
            overlay.classList.contains(
                "show"
            )
        ) {

            renderCartSidebar();

        }

    }
);


/* ==================================================
   STORAGE UPDATED
==================================================

   Useful if another browser tab/window changes
   the cart.
================================================== */

window.addEventListener(
    "storage",
    event => {

        if (
            event.key !==
            "storeCart"
        ) {

            return;

        }


        const cart =
            getCart();


        updateCartCount(
            cart
        );


        const overlay =
            document.getElementById(
                "cartSidebarOverlay"
            );


        if (
            overlay &&
            overlay.classList.contains(
                "show"
            )
        ) {

            renderCartSidebar();

        }

    }
);


/* ==================================================
   INITIALIZE
================================================== */

function initializeCartSidebar() {

    createCartSidebar();


    const cart =
        getCart();


    updateCartCount(
        cart
    );


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