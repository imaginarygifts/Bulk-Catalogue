/* ==================================================
   CART SIDEBAR
   ==================================================
   - No cart.html required
   - Opens from #cartButton
   - Uses existing storeCart
   - Quantity + / -
   - Remove item
   - Subtotal
   - Shipping estimate
   - Total
   - Direct Checkout → order
================================================== */


/* ==================================================
   SETTINGS
================================================== */

const CART_STORAGE_KEY = "storeCart";

const CHECKOUT_PAGE = "order";


/* ==================================================
   HELPERS
================================================== */

function getCart() {

    try {

        const raw =
            localStorage.getItem(
                CART_STORAGE_KEY
            );

        if (!raw) {
            return [];
        }

        const cart =
            JSON.parse(raw);

        return Array.isArray(cart)
            ? cart
            : [];

    }
    catch (error) {

        console.error(
            "Cart loading error:",
            error
        );

        return [];

    }

}


function saveCart(cart) {

    try {

        localStorage.setItem(
            CART_STORAGE_KEY,
            JSON.stringify(cart)
        );

        window.dispatchEvent(
            new CustomEvent(
                "cartUpdated"
            )
        );

    }
    catch (error) {

        console.error(
            "Cart save error:",
            error
        );

    }

}


function formatMoney(value) {

    const amount =
        Number(value || 0);

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
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* ==================================================
   PRICE
================================================== */

function getCartItemUnitPrice(item) {

    /*
       cart.js normally stores the final
       selected configuration price in item.price.
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

    return (
        getCartItemUnitPrice(item) *
        Math.max(
            Number(item.quantity || 1),
            1
        )
    );

}


/* ==================================================
   PRODUCT IMAGE
================================================== */

function getCartItemImage(item) {

    if (item.image) {
        return item.image;
    }


    if (
        Array.isArray(
            item.images
        ) &&
        item.images.length
    ) {

        return item.images[0];

    }


    if (
        item.productSnapshot &&
        Array.isArray(
            item.productSnapshot.images
        ) &&
        item.productSnapshot.images.length
    ) {

        return item.productSnapshot.images[0];

    }


    if (
        item.product &&
        Array.isArray(
            item.product.images
        ) &&
        item.product.images.length
    ) {

        return item.product.images[0];

    }


    return "";

}


/* ==================================================
   CONFIGURATION TEXT
================================================== */

function getConfigurationHtml(item) {

    let html = "";


    /*
       COLOR
    */

    if (item.color) {

        const color =
            typeof item.color === "object"
                ? (
                    item.color.name ||
                    item.color.value ||
                    ""
                )
                : item.color;

        if (color) {

            html += `
                <div class="cart-item-option">
                    Color: ${escapeHtml(color)}
                </div>
            `;

        }

    }


    /*
       SIZE
    */

    if (item.size) {

        const size =
            typeof item.size === "object"
                ? (
                    item.size.name ||
                    item.size.value ||
                    ""
                )
                : item.size;

        if (size) {

            html += `
                <div class="cart-item-option">
                    Size: ${escapeHtml(size)}
                </div>
            `;

        }

    }


    /*
       CUSTOM OPTIONS
    */

    const optionValues =
        item.optionValues ||
        {};

    const optionKeys =
        Object.keys(
            optionValues
        );


    if (optionKeys.length) {

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

    if (!product) {

        return {
            type: "free",
            amount: 0
        };

    }


    /*
       Product shipping object
    */

    const shipping =
        product.shipping ||
        {};


    let type =
        shipping.type ??
        shipping.shippingType ??
        product.shippingType ??
        "free";


    type =
        String(type)
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
            type: "free",
            amount: 0
        };

    }


    if (
        type === "paid" ||
        type === "fixed" ||
        type === "amount"
    ) {

        return {
            type: "paid",
            amount: Math.max(
                0,
                amount
            )
        };

    }


    return {
        type,
        amount: Math.max(
            0,
            amount
        )
    };

}


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


    if (!selectedSizeName) {
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
        )
            .toLowerCase();


    const amount =
        Number(
            selected.shippingAmount ??
            selected.shipping?.amount ??
            0
        ) || 0;


    if (type === "free") {

        return {
            type: "free",
            amount: 0
        };

    }


    if (type === "paid") {

        return {
            type: "paid",
            amount: Math.max(
                0,
                amount
            )
        };

    }


    return null;

}


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


    if (sizeShipping) {

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
   SIDEBAR HTML
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


            <!-- CONTENT -->

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


    /*
       Close button
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
       Click outside drawer
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


    /*
       ESC key
    */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
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


    if (!body || !footer) {
        return;
    }


    const cart =
        getCart();


    updateCartCount(
        cart
    );


    /*
       EMPTY CART
    */

    if (!cart.length) {

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


        footer.innerHTML = "";

        return;

    }


    /*
       ITEMS
    */

    let html = "";


    cart.forEach(
        (item, index) => {

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
                                ? `
                                    <img
                                        src="${escapeHtml(image)}"
                                        alt="${escapeHtml(name)}"
                                    >
                                  `
                                : `
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
                                ? `
                                    <div class="cart-sidebar-item-options">
                                        ${configHtml}
                                    </div>
                                  `
                                : ""
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


    /*
       PRICE BREAKDOWN
    */

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
                            ? `₹${formatMoney(
                                totals.shipping
                            )}`
                            : "FREE"
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


    /*
       Quantity / remove events
    */

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


    /*
       Checkout
    */

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

    const cart =
        getCart();


    if (
        !cart[index]
    ) {

        return;

    }


    const item =
        cart[index];


    const currentQuantity =
        Math.max(
            Number(
                item.quantity || 1
            ),
            1
        );


    /*
       DECREASE
    */

    if (
        action === "decrease"
    ) {

        if (
            currentQuantity <= 1
        ) {

            cart.splice(
                index,
                1
            );

        }
        else {

            item.quantity =
                currentQuantity - 1;

        }

    }


    /*
       INCREASE
    */

    else if (
        action === "increase"
    ) {

        item.quantity =
            currentQuantity + 1;

    }


    /*
       REMOVE
    */

    else if (
        action === "remove"
    ) {

        cart.splice(
            index,
            1
        );

    }


    saveCart(
        cart
    );


    renderCartSidebar();

}


/* ==================================================
   CART COUNT
================================================== */

function updateCartCount(
    cart = getCart()
) {

    const count =
        cart.reduce(
            (total, item) => {

                return total +
                    Math.max(
                        Number(
                            item.quantity || 0
                        ),
                        0
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

                element.classList.toggle(
                    "show",
                    count > 0
                );

            }
        );

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


    if (!overlay) {
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
                           Your cart icon is an <a>
                           pointing to cart.html.

                           Stop navigation because
                           there is no cart page anymore.
                        */

                        event.preventDefault();

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

    const cart =
        getCart();


    if (!cart.length) {

        return;

    }


    /*
       Convert existing cart items into
       the structure already supported
       by order.js:

       {
           items: [
               {
                   product,
                   finalPrice,
                   quantity,
                   color,
                   size,
                   options,
                   optionValues,
                   imageLinks
               }
           ]
       }

       order.js treats finalPrice as
       LINE TOTAL.
    */


    const items =
        cart
            .map(
                item => {

                    const product =
                        item.productSnapshot ||
                        item.product ||
                        null;


                    if (
                        !product ||
                        !product.id
                    ) {

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

                        /*
                           Full product snapshot
                           needed by checkout.
                        */

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


                        /*
                           Preserve cart identity.
                        */

                        cartItemKey:
                            item.cartItemKey ||
                            null

                    };

                }
            )
            .filter(Boolean);


    if (!items.length) {

        alert(
            "Your cart contains no valid products."
        );

        return;

    }


    const checkoutData = {

        items

    };


    /*
       Save checkout data.
    */

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


    /*
       Close drawer first.
    */

    closeCartSidebar();


    /*
       Go directly to existing checkout.
    */

    location.href =
        CHECKOUT_PAGE;

}


/* ==================================================
   CART UPDATED
================================================== */

window.addEventListener(
    "cartUpdated",
    () => {

        updateCartCount();

        /*
           If drawer is already open,
           refresh it immediately.
        */

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
   STORAGE UPDATED
================================================== */

window.addEventListener(
    "storage",
    event => {

        if (
            event.key ===
            CART_STORAGE_KEY
        ) {

            updateCartCount();


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

    }
);


/* ==================================================
   INITIALIZE
================================================== */

function initializeCartSidebar() {

    createCartSidebar();

    updateCartCount();

    connectCartButton();

}


/*
   DOM READY
*/

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