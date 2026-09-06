/* ==================================================
   CART SIDEBAR
   GLOBAL FRONTEND CART DRAWER
================================================== */

const CART_KEY = "storeCart";


/* ==================================================
   HELPERS
================================================== */

function getCart() {

    try {

        const cart =
            JSON.parse(
                localStorage.getItem(
                    CART_KEY
                ) || "[]"
            );

        return Array.isArray(cart)
            ? cart
            : [];

    }

    catch (error) {

        console.error(
            "Cart sidebar read error:",
            error
        );

        return [];

    }

}


function saveCart(cart) {

    localStorage.setItem(
        CART_KEY,
        JSON.stringify(cart)
    );


    window.dispatchEvent(
        new CustomEvent(
            "cartUpdated"
        )
    );

}


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


function money(value) {

    return "₹" +
        Number(
            value || 0
        ).toLocaleString(
            "en-IN"
        );

}


/* ==================================================
   GET PRODUCT PRICE
================================================== */

function getCartItemUnitPrice(item) {

    /*
       The cart system stores the final
       configured price in `price`.

       Keep compatibility with older
       cart structures.
    */

    if (
        item.price !== undefined
    ) {

        return Number(
            item.price || 0
        );

    }


    if (
        item.finalPrice !== undefined
    ) {

        return Number(
            item.finalPrice || 0
        );

    }


    const product =
        item.productSnapshot ||
        item.product ||
        {};


    const salePrice =
        Number(
            product.salePrice || 0
        );


    const basePrice =
        Number(
            product.basePrice || 0
        );


    if (
        salePrice > 0 &&
        salePrice < basePrice
    ) {

        return salePrice;

    }


    return basePrice;

}


/* ==================================================
   GET CART TOTAL
================================================== */

function getCartSubtotal(cart) {

    return cart.reduce(
        (
            total,
            item
        ) => {

            const price =
                getCartItemUnitPrice(
                    item
                );


            const quantity =
                Math.max(
                    Number(
                        item.quantity || 1
                    ),
                    1
                );


            return (
                total +
                price * quantity
            );

        },
        0
    );

}


/* ==================================================
   CREATE SIDEBAR HTML
================================================== */

function createCartSidebar() {

    if (
        document.getElementById(
            "globalCartSidebar"
        )
    ) {

        return;

    }


    const overlay =
        document.createElement(
            "div"
        );


    overlay.id =
        "globalCartOverlay";


    overlay.className =
        "cart-sidebar-overlay";


    const sidebar =
        document.createElement(
            "aside"
        );


    sidebar.id =
        "globalCartSidebar";


    sidebar.className =
        "cart-sidebar";


    sidebar.setAttribute(
        "aria-hidden",
        "true"
    );


    sidebar.innerHTML = `

        <div class="cart-sidebar-header">

            <div class="cart-sidebar-title">

                <i class="fa-solid fa-cart-shopping"></i>

                <span>
                    Your Cart
                </span>

                <span
                    id="cartSidebarItemCount"
                    class="cart-sidebar-count"
                >
                    0
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


        <div
            id="cartSidebarBody"
            class="cart-sidebar-body"
        ></div>


        <div
            id="cartSidebarFooter"
            class="cart-sidebar-footer"
        ></div>

    `;


    document.body.appendChild(
        overlay
    );


    document.body.appendChild(
        sidebar
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
       OVERLAY
    ================================================== */

    overlay.addEventListener(
        "click",
        closeCartSidebar
    );


    /* ==================================================
       ESC KEY
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


    renderCartSidebar();

}


/* ==================================================
   OPEN CART
================================================== */

function openCartSidebar() {

    createCartSidebar();


    renderCartSidebar();


    const sidebar =
        document.getElementById(
            "globalCartSidebar"
        );


    const overlay =
        document.getElementById(
            "globalCartOverlay"
        );


    if (
        !sidebar ||
        !overlay
    ) {

        return;

    }


    sidebar.classList.add(
        "open"
    );


    overlay.classList.add(
        "open"
    );


    sidebar.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "cart-sidebar-open"
    );

}


/* ==================================================
   CLOSE CART
================================================== */

function closeCartSidebar() {

    const sidebar =
        document.getElementById(
            "globalCartSidebar"
        );


    const overlay =
        document.getElementById(
            "globalCartOverlay"
        );


    if (
        sidebar
    ) {

        sidebar.classList.remove(
            "open"
        );

        sidebar.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    if (
        overlay
    ) {

        overlay.classList.remove(
            "open"
        );

    }


    document.body.classList.remove(
        "cart-sidebar-open"
    );

}


/* ==================================================
   RENDER CART
================================================== */

function renderCartSidebar() {

    const body =
        document.getElementById(
            "cartSidebarBody"
        );


    const footer =
        document.getElementById(
            "cartSidebarFooter"
        );


    const countElement =
        document.getElementById(
            "cartSidebarItemCount"
        );


    if (
        !body ||
        !footer
    ) {

        return;

    }


    const cart =
        getCart();


    const totalQuantity =
        cart.reduce(
            (
                total,
                item
            ) => {

                return (
                    total +
                    Number(
                        item.quantity || 0
                    )
                );

            },
            0
        );


    if (
        countElement
    ) {

        countElement.innerText =
            totalQuantity;

    }


    /* ==================================================
       EMPTY CART
    ================================================== */

    if (
        cart.length === 0
    ) {

        body.innerHTML = `

            <div class="cart-sidebar-empty">

                <div class="cart-empty-icon">

                    <i class="fa-solid fa-cart-shopping"></i>

                </div>


                <h3>
                    Your cart is empty
                </h3>


                <p>
                    Add some products to your cart
                    and they will appear here.
                </p>


                <button
                    type="button"
                    class="cart-empty-shop-btn"
                    id="cartEmptyShopButton"
                >
                    Continue Shopping
                </button>

            </div>

        `;


        footer.innerHTML =
            "";


        document
            .getElementById(
                "cartEmptyShopButton"
            )
            ?.addEventListener(
                "click",
                () => {

                    closeCartSidebar();

                    location.href =
                        "shop";

                }
            );


        return;

    }


    /* ==================================================
       CART ITEMS
    ================================================== */

    let html =
        `<div class="cart-sidebar-items">`;


    cart.forEach(
        (
            item,
            index
        ) => {

            const product =
                item.productSnapshot ||
                item.product ||
                {};


            const name =
                item.name ||
                product.name ||
                "Product";


            const image =
                item.image ||
                product.images?.[0] ||
                "";


            const price =
                getCartItemUnitPrice(
                    item
                );


            const quantity =
                Math.max(
                    Number(
                        item.quantity || 1
                    ),
                    1
                );


            html += `

                <div
                    class="cart-sidebar-item"
                    data-cart-index="${index}"
                >

                    <div class="cart-sidebar-item-image">

                        ${
                            image

                            ?

                            `

                            <img
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

                            <div class="cart-sidebar-no-image">

                                <i class="fa-solid fa-image"></i>

                            </div>

                            `
                        }

                    </div>


                    <div class="cart-sidebar-item-content">

                        <div class="cart-sidebar-item-top">

                            <h4>

                                ${escapeHtml(
                                    name
                                )}

                            </h4>


                            <button
                                type="button"
                                class="cart-sidebar-remove"
                                data-remove-index="${index}"
                                aria-label="Remove product"
                            >

                                <i class="fa-solid fa-trash"></i>

                            </button>

                        </div>


                        ${renderConfiguration(item)}


                        <div class="cart-sidebar-item-price">

                            <span>

                                ${money(price)}

                            </span>


                            <span class="cart-sidebar-price-x">

                                ×

                            </span>


                            <span>

                                ${quantity}

                            </span>


                            <strong>

                                ${money(
                                    price *
                                    quantity
                                )}

                            </strong>

                        </div>


                        <div class="cart-sidebar-quantity">

                            <button
                                type="button"
                                class="cart-qty-btn"
                                data-decrease-index="${index}"
                                aria-label="Decrease quantity"
                            >
                                −
                            </button>


                            <span>

                                ${quantity}

                            </span>


                            <button
                                type="button"
                                class="cart-qty-btn"
                                data-increase-index="${index}"
                                aria-label="Increase quantity"
                            >
                                +
                            </button>

                        </div>

                    </div>

                </div>

            `;

        }
    );


    html +=
        `</div>`;


    body.innerHTML =
        html;


    /* ==================================================
       ITEM EVENTS
    ================================================== */

    body
        .querySelectorAll(
            "[data-remove-index]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        removeCartItem(
                            Number(
                                button.dataset.removeIndex
                            )
                        );

                    }
                );

            }
        );


    body
        .querySelectorAll(
            "[data-increase-index]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        changeCartQuantity(
                            Number(
                                button.dataset.increaseIndex
                            ),
                            1
                        );

                    }
                );

            }
        );


    body
        .querySelectorAll(
            "[data-decrease-index]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        changeCartQuantity(
                            Number(
                                button.dataset.decreaseIndex
                            ),
                            -1
                        );

                    }
                );

            }
        );


    /* ==================================================
       FOOTER
    ================================================== */

    const subtotal =
        getCartSubtotal(
            cart
        );


    footer.innerHTML = `

        <div class="cart-sidebar-summary">

            <div class="cart-summary-row">

                <span>
                    Subtotal
                </span>

                <strong>
                    ${money(subtotal)}
                </strong>

            </div>


            <div class="cart-summary-row cart-summary-shipping">

                <span>
                    Shipping
                </span>

                <span>
                    Calculated at checkout
                </span>

            </div>


            <div class="cart-summary-total">

                <span>
                    Total
                </span>

                <strong>
                    ${money(subtotal)}
                </strong>

            </div>

        </div>


        <div class="cart-sidebar-actions">

            <button
                type="button"
                id="cartViewButton"
                class="cart-view-btn"
            >

                View Cart

            </button>


            <button
                type="button"
                id="cartCheckoutButton"
                class="cart-checkout-btn"
            >

                Checkout

            </button>

        </div>

    `;


    /* ==================================================
       VIEW CART
    ================================================== */

    document
        .getElementById(
            "cartViewButton"
        )
        ?.addEventListener(
            "click",
            () => {

                closeCartSidebar();

                location.href =
                    "cart";

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
            goToCartCheckout
        );

}


/* ==================================================
   CONFIGURATION DISPLAY
================================================== */

function renderConfiguration(item) {

    let html =
        `<div class="cart-sidebar-options">`;


    /* COLOR */

    if (
        item.color
    ) {

        const colorName =
            typeof item.color ===
            "object"

            ?

            item.color.name

            :

            item.color;


        if (
            colorName
        ) {

            html += `

                <span>
                    Color: ${escapeHtml(
                        colorName
                    )}
                </span>

            `;

        }

    }


    /* SIZE */

    if (
        item.size
    ) {

        const sizeName =
            typeof item.size ===
            "object"

            ?

            item.size.name

            :

            item.size;


        if (
            sizeName
        ) {

            html += `

                <span>
                    Size: ${escapeHtml(
                        sizeName
                    )}
                </span>

            `;

        }

    }


    /* CUSTOM OPTIONS */

    const values =
        item.optionValues ||
        {};


    Object
        .keys(
            values
        )
        .forEach(
            index => {

                const value =
                    values[index];


                if (
                    value
                ) {

                    html += `

                        <span>

                            ${escapeHtml(
                                value
                            )}

                        </span>

                    `;

                }

            }
        );


    html +=
        `</div>`;


    return html;

}


/* ==================================================
   CHANGE QUANTITY
================================================== */

function changeCartQuantity(
    index,
    change
) {

    const cart =
        getCart();


    const item =
        cart[index];


    if (
        !item
    ) {

        return;

    }


    const current =
        Number(
            item.quantity || 1
        );


    const next =
        current + change;


    if (
        next <= 0
    ) {

        cart.splice(
            index,
            1
        );

    }

    else {

        item.quantity =
            next;

    }


    saveCart(
        cart
    );


    renderCartSidebar();


    updateGlobalCartCount();

}


/* ==================================================
   REMOVE ITEM
================================================== */

function removeCartItem(index) {

    const cart =
        getCart();


    if (
        !cart[index]
    ) {

        return;

    }


    cart.splice(
        index,
        1
    );


    saveCart(
        cart
    );


    renderCartSidebar();


    updateGlobalCartCount();

}


/* ==================================================
   CHECKOUT
================================================== */

function goToCartCheckout() {

    const cart =
        getCart();


    if (
        cart.length === 0
    ) {

        return;

    }


    /*
       Your existing order.js supports
       checkoutData.items.
    */

    const checkoutData = {

        items:
            cart.map(
                item => {

                    const product =
                        item.productSnapshot ||
                        item.product ||
                        {};


                    const price =
                        getCartItemUnitPrice(
                            item
                        );


                    return {

                        product,

                        finalPrice:
                            price *
                            Number(
                                item.quantity || 1
                            ),

                        unitPrice:
                            price,

                        quantity:
                            Number(
                                item.quantity || 1
                            ),

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
                            ""

                    };

                }
            )

    };


    try {

        localStorage.setItem(
            "checkoutData",
            JSON.stringify(
                checkoutData
            )
        );


        closeCartSidebar();


        location.href =
            "order";

    }

    catch (error) {

        console.error(
            "Cart checkout error:",
            error
        );


        alert(
            "Unable to start checkout. Please try again."
        );

    }

}


/* ==================================================
   GLOBAL CART COUNT
================================================== */

function updateGlobalCartCount() {

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
                    Number(
                        item.quantity || 0
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
                    count;

                element.style.display =
                    count > 0
                        ?
                        ""
                        :
                        "";

            }
        );


    document
        .querySelectorAll(
            "[data-cart-count]"
        )
        .forEach(
            element => {

                element.innerText =
                    count;

            }
        );

}


/* ==================================================
   CART ICON CONNECTION
================================================== */

function connectCartButton() {

    document
        .querySelectorAll(
            "#cartButton"
        )
        .forEach(
            button => {

                /*
                   Prevent duplicate listeners.
                */

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

                        event.preventDefault();

                        openCartSidebar();

                    }
                );

            }
        );

}


/* ==================================================
   CART UPDATED
================================================== */

window.addEventListener(
    "cartUpdated",
    () => {

        updateGlobalCartCount();

        renderCartSidebar();

    }
);


/* ==================================================
   STORAGE UPDATED
   Useful when another browser tab changes cart.
================================================== */

window.addEventListener(
    "storage",
    event => {

        if (
            event.key ===
            CART_KEY
        ) {

            updateGlobalCartCount();

            renderCartSidebar();

        }

    }
);


/* ==================================================
   INITIALIZE
================================================== */

function initCartSidebar() {

    createCartSidebar();

    connectCartButton();

    updateGlobalCartCount();

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
        initCartSidebar
    );

}

else {

    initCartSidebar();

}


/* ==================================================
   PUBLIC API
================================================== */

window.openCartSidebar =
    openCartSidebar;


window.closeCartSidebar =
    closeCartSidebar;