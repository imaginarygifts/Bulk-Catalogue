/* =========================================================
   CART SYSTEM
   =========================================================

   FEATURES
   ---------------------------------------------------------
   • Multiple products
   • Multiple variants of same product
   • Size
   • Color
   • Custom options
   • Variant-aware cart identity
   • Quantity +/- controls
   • Add to Cart
   • LocalStorage persistence
   • Common cart count
   • Cart subtotal
   • Cart page compatibility
========================================================= */


/* =========================================================
   STORAGE
========================================================= */

const CART_STORAGE_KEY =
    "storeCart";


/* =========================================================
   GLOBAL CART
========================================================= */

let cart = [];


/* =========================================================
   INITIALIZE
========================================================= */

function initializeCart() {

    loadCart();

    updateCartUI();

}


/* =========================================================
   LOAD CART
========================================================= */

function loadCart() {

    try {

        const raw =
            localStorage.getItem(
                CART_STORAGE_KEY
            );


        if (!raw) {

            cart = [];

            return;

        }


        const parsed =
            JSON.parse(raw);


        if (
            Array.isArray(parsed)
        ) {

            cart = parsed;

        }

        else {

            cart = [];

        }

    }

    catch (error) {

        console.error(
            "Cart loading error:",
            error
        );


        cart = [];

    }

}


/* =========================================================
   SAVE CART
========================================================= */

function saveCart() {

    try {

        localStorage.setItem(
            CART_STORAGE_KEY,
            JSON.stringify(cart)
        );

    }

    catch (error) {

        console.error(
            "Cart save error:",
            error
        );

    }

}


/* =========================================================
   GET CART
========================================================= */

function getCart() {

    return [
        ...cart
    ];

}


/* =========================================================
   GET CART ITEM COUNT
=========================================================

   Example:

   Product A × 2
   Product B × 1

   Result:

   3
========================================================= */

function getCartQuantity() {

    return cart.reduce(
        (
            total,
            item
        ) => {

            return total +
                Number(
                    item.quantity ||
                    0
                );

        },
        0
    );

}


/* =========================================================
   GET NUMBER OF DIFFERENT CART ITEMS
========================================================= */

function getCartItemCount() {

    return cart.length;

}


/* =========================================================
   GET CART SUBTOTAL
========================================================= */

function getCartSubtotal() {

    return cart.reduce(
        (
            total,
            item
        ) => {

            const price =
                Number(
                    item.price ||
                    0
                );


            const quantity =
                Number(
                    item.quantity ||
                    0
                );


            return total +
                (
                    price *
                    quantity
                );

        },
        0
    );

}


/* =========================================================
   NORMALIZE VALUE
=========================================================

   Used to create a stable variant identity.
========================================================= */

function normalizeValue(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    if (
        typeof value ===
        "object"
    ) {

        /*
           Sort object keys so:

           {name:"Red", price:20}

           and

           {price:20, name:"Red"}

           produce the same identity.
        */

        const sorted = {};


        Object.keys(value)
            .sort()
            .forEach(
                key => {

                    sorted[key] =
                        normalizeValue(
                            value[key]
                        );

                }
            );


        return sorted;

    }


    if (
        Array.isArray(value)
    ) {

        return value.map(
            item =>
                normalizeValue(
                    item
                )
        );

    }


    return String(
        value
    )
        .trim()
        .toLowerCase();

}


/* =========================================================
   CREATE CART ITEM KEY
=========================================================

   IMPORTANT:

   Product ID alone is NOT enough.

   These are different:

   Product A
   Red
   M

   Product A
   Red
   L

   Product A
   Blue
   M

   Product A
   Red
   M
   Custom Text: Rahul

========================================================= */

function createCartItemKey(
    productId,
    configuration = {}
) {

    const identity = {

        productId:
            String(
                productId ||
                ""
            ),

        color:
            normalizeValue(
                configuration.color ||
                null
            ),

        size:
            normalizeValue(
                configuration.size ||
                null
            ),

        options:
            normalizeValue(
                configuration.options ||
                {}
            ),

        optionValues:
            normalizeValue(
                configuration.optionValues ||
                {}
            )

    };


    return JSON.stringify(
        identity
    );

}


/* =========================================================
   FIND CART ITEM
========================================================= */

function findCartItem(
    cartItemKey
) {

    return cart.find(
        item =>
            item.cartItemKey ===
            cartItemKey
    );

}


/* =========================================================
   GET PRODUCT PRICE
========================================================= */

function getProductCartPrice(
    product,
    configuration = {}
) {

    let price =
        Number(
            product?.salePrice ??
            product?.basePrice ??
            product?.price ??
            0
        );


    /* =====================================================
       COLOR EXTRA PRICE
    ===================================================== */

    if (
        configuration.color
    ) {

        price +=
            Number(
                configuration.color.price ||
                0
            );

    }


    /* =====================================================
       SIZE EXTRA PRICE
    ===================================================== */

    if (
        configuration.size
    ) {

        price +=
            Number(
                configuration.size.price ||
                0
            );

    }


    /* =====================================================
       CUSTOM OPTION EXTRA PRICES
    ===================================================== */

    if (
        Array.isArray(
            configuration.customOptionPrices
        )
    ) {

        configuration
            .customOptionPrices
            .forEach(
                extra => {

                    price +=
                        Number(
                            extra ||
                            0
                        );

                }
            );

    }


    return Math.max(
        0,
        price
    );

}


/* =========================================================
   ADD TO CART
=========================================================

   product:
       Complete product object

   configuration:
       {
           color,
           size,
           options,
           optionValues,
           customOptionPrices
       }

   quantity:
       default = 1
========================================================= */

function addToCart(
    product,
    configuration = {},
    quantity = 1
) {

    if (
        !product ||
        !product.id
    ) {

        console.error(
            "Cannot add product without product ID."
        );

        return null;

    }


    quantity =
        Number(
            quantity
        );


    if (
        !Number.isFinite(
            quantity
        ) ||
        quantity <= 0
    ) {

        quantity = 1;

    }


    const cartItemKey =
        createCartItemKey(
            product.id,
            configuration
        );


    const existing =
        findCartItem(
            cartItemKey
        );


    /* =====================================================
       EXISTING CONFIGURATION
    ===================================================== */

    if (
        existing
    ) {

        existing.quantity =
            Number(
                existing.quantity ||
                0
            ) +
            quantity;


        if (
            existing.quantity < 1
        ) {

            existing.quantity =
                1;

        }

    }


    /* =====================================================
       NEW CONFIGURATION
    ===================================================== */

    else {

        const price =
            getProductCartPrice(
                product,
                configuration
            );


        const item = {

            cartItemKey,

            productId:
                product.id,

            name:
                product.name ||
                product.title ||
                "Product",

            image:
                getProductImage(
                    product
                ),

            price,

            quantity,

            color:
                configuration.color ||
                null,

            size:
                configuration.size ||
                null,

            options:
                configuration.options ||
                {},

            optionValues:
                configuration.optionValues ||
                {},

            customOptionPrices:
                configuration.customOptionPrices ||
                [],

            productSnapshot: {

                basePrice:
                    product.basePrice ??
                    null,

                salePrice:
                    product.salePrice ??
                    null,

                categoryId:
                    product.categoryId ??
                    null,

                subCategoryId:
                    product.subCategoryId ??
                    null,

                images:
                    Array.isArray(
                        product.images
                    )
                        ?
                        [
                            ...product.images
                        ]
                        :
                        []

            },

            addedAt:
                Date.now()

        };


        cart.push(
            item
        );

    }


    saveCart();

    updateCartUI();

    dispatchCartChange();


    return findCartItem(
        cartItemKey
    );

}


/* =========================================================
   SET EXACT QUANTITY
=========================================================

   If quantity becomes 0:

   Remove cart item.

   The product page/shop/homepage can then
   automatically show "Add to Cart".
========================================================= */

function setCartItemQuantity(
    cartItemKey,
    quantity
) {

    quantity =
        Number(
            quantity
        );


    const index =
        cart.findIndex(
            item =>
                item.cartItemKey ===
                cartItemKey
        );


    if (
        index === -1
    ) {

        return null;

    }


    /* =====================================================
       REMOVE AT ZERO
    ===================================================== */

    if (
        !Number.isFinite(
            quantity
        ) ||
        quantity <= 0
    ) {

        cart.splice(
            index,
            1
        );

    }

    else {

        cart[index].quantity =
            Math.floor(
                quantity
            );

    }


    saveCart();

    updateCartUI();

    dispatchCartChange();


    return (
        cart.find(
            item =>
                item.cartItemKey ===
                cartItemKey
        )
        ||
        null
    );

}


/* =========================================================
   INCREASE QUANTITY
========================================================= */

function increaseCartItem(
    cartItemKey,
    amount = 1
) {

    const item =
        findCartItem(
            cartItemKey
        );


    if (
        !item
    ) {

        return null;

    }


    const newQuantity =
        Number(
            item.quantity ||
            0
        ) +
        Number(
            amount ||
            1
        );


    return setCartItemQuantity(
        cartItemKey,
        newQuantity
    );

}


/* =========================================================
   DECREASE QUANTITY
========================================================= */

function decreaseCartItem(
    cartItemKey,
    amount = 1
) {

    const item =
        findCartItem(
            cartItemKey
        );


    if (
        !item
    ) {

        return null;

    }


    const newQuantity =
        Number(
            item.quantity ||
            0
        ) -
        Number(
            amount ||
            1
        );


    return setCartItemQuantity(
        cartItemKey,
        newQuantity
    );

}


/* =========================================================
   REMOVE CART ITEM
========================================================= */

function removeCartItem(
    cartItemKey
) {

    const index =
        cart.findIndex(
            item =>
                item.cartItemKey ===
                cartItemKey
        );


    if (
        index === -1
    ) {

        return false;

    }


    cart.splice(
        index,
        1
    );


    saveCart();

    updateCartUI();

    dispatchCartChange();


    return true;

}


/* =========================================================
   CLEAR CART
========================================================= */

function clearCart() {

    cart = [];


    saveCart();

    updateCartUI();

    dispatchCartChange();

}


/* =========================================================
   GET PRODUCT IMAGE
========================================================= */

function getProductImage(
    product
) {

    if (
        Array.isArray(
            product?.images
        )
        &&
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
        product?.image ||
        product?.imageUrl ||
        product?.thumbnail ||
        ""
    );

}


/* =========================================================
   GET CURRENT QUANTITY FOR CONFIGURATION
=========================================================

   This is especially important for PRODUCT PAGE.

   Example:

   Customer has:

   Red + M = 2

   They change selection to:

   Blue + L

   This returns 0 if Blue + L isn't in cart.

   Therefore UI shows:

   ADD TO CART

   instead of:

   − 2 +
========================================================= */

function getConfigurationQuantity(
    productId,
    configuration = {}
) {

    const key =
        createCartItemKey(
            productId,
            configuration
        );


    const item =
        findCartItem(
            key
        );


    return item
        ?
        Number(
            item.quantity ||
            0
        )
        :
        0;

}


/* =========================================================
   GET CART ITEM BY CONFIGURATION
========================================================= */

function getCartItemByConfiguration(
    productId,
    configuration = {}
) {

    const key =
        createCartItemKey(
            productId,
            configuration
        );


    return (
        findCartItem(
            key
        )
        ||
        null
    );

}


/* =========================================================
   UPDATE CART UI
=========================================================

   Supports common topbar:

   #cartCount

   Also supports:

   .cart-count

========================================================= */

function updateCartUI() {

    const totalQuantity =
        getCartQuantity();


    const elements =
        document.querySelectorAll(
            "#cartCount, .cart-count"
        );


    elements.forEach(
        element => {

            element.textContent =
                String(
                    totalQuantity
                );


            /*
               Hide badge when empty.
            */

            if (
                totalQuantity <= 0
            ) {

                element.classList.add(
                    "empty"
                );

                /*
                   Keep 0 in DOM for
                   accessibility/logic.
                */

            }

            else {

                element.classList.remove(
                    "empty"
                );

            }

        }
    );


    /*
       Optional subtotal elements.
    */

    document
        .querySelectorAll(
            "#cartSubtotal, .cart-subtotal"
        )
        .forEach(
            element => {

                element.textContent =
                    formatMoney(
                        getCartSubtotal()
                    );

            }
        );


    /*
       Optional cart item count.
    */

    document
        .querySelectorAll(
            "#cartItemCount, .cart-item-count"
        )
        .forEach(
            element => {

                element.textContent =
                    String(
                        getCartItemCount()
                    );

            }
        );

}


/* =========================================================
   CART CHANGE EVENT
=========================================================

   Other pages can listen to:

   window.addEventListener(
       "cartUpdated",
       ...
   );
========================================================= */

function dispatchCartChange() {

    window.dispatchEvent(
        new CustomEvent(
            "cartUpdated",
            {
                detail: {

                    cart:
                        getCart(),

                    quantity:
                        getCartQuantity(),

                    itemCount:
                        getCartItemCount(),

                    subtotal:
                        getCartSubtotal()

                }
            }
        )
    );

}


/* =========================================================
   FORMAT MONEY
========================================================= */

function formatMoney(
    value
) {

    const number =
        Number(
            value ||
            0
        );


    if (
        Number.isInteger(
            number
        )
    ) {

        return number.toString();

    }


    return number.toFixed(
        2
    );

}


/* =========================================================
   CART PAGE
=========================================================

   We are not creating cart.html yet.

   But this function is ready for it.

========================================================= */

function openCart() {

    /*
       Later we can change this
       if cart.html has another path.

       For now:

       cart.html
    */

    window.location.href =
        "cart.html";

}


/* =========================================================
   GLOBAL CART FUNCTIONS
=========================================================

   These allow HTML onclick handlers
   to use the cart without importing
   the module manually.
========================================================= */

window.addToCart =
    addToCart;


window.setCartItemQuantity =
    setCartItemQuantity;


window.increaseCartItem =
    increaseCartItem;


window.decreaseCartItem =
    decreaseCartItem;


window.removeCartItem =
    removeCartItem;


window.clearCart =
    clearCart;


window.getCart =
    getCart;


window.getCartQuantity =
    getCartQuantity;


window.getCartItemCount =
    getCartItemCount;


window.getCartSubtotal =
    getCartSubtotal;


window.getConfigurationQuantity =
    getConfigurationQuantity;


window.getCartItemByConfiguration =
    getCartItemByConfiguration;


window.openCart =
    openCart;


/* =========================================================
   AUTO INITIALIZE
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeCart
    );

}

else {

    initializeCart();

}


/* =========================================================
   EXPORTS
========================================================= */

export {

    getCart,

    getCartQuantity,

    getCartItemCount,

    getCartSubtotal,

    addToCart,

    setCartItemQuantity,

    increaseCartItem,

    decreaseCartItem,

    removeCartItem,

    clearCart,

    getConfigurationQuantity,

    getCartItemByConfiguration,

    createCartItemKey,

    updateCartUI,

    openCart

};