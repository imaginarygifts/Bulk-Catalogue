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
   • Product-page configuration tracking
   • Real-time synchronization with cart sidebar
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
   INITIALIZE CART
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
   REFRESH CART FROM LOCAL STORAGE
=========================================================

   IMPORTANT:

   cart-sidebar.js and cart.js can both interact
   with the same storeCart.

   Always reload before performing cart operations
   so an old in-memory cart cannot overwrite newer
   localStorage data.
========================================================= */

function refreshCart() {

    loadCart();

    return cart;

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
   SAVE + NOTIFY
========================================================= */

function commitCart() {

    /*
       Save current cart.
    */

    saveCart();


    /*
       Update local UI immediately.
    */

    updateCartUI();


    /*
       Notify sidebar and other cart components.
    */

    dispatchCartChange();

}


/* =========================================================
   GET CART
========================================================= */

function getCart() {

    /*
       Always return the latest LocalStorage state.

       This prevents stale cart data.
    */

    refreshCart();


    return [
        ...cart
    ];

}


/* =========================================================
   GET TOTAL CART QUANTITY
=========================================================

   Example:

   Product A × 2
   Product B × 1

   Result:

   3
========================================================= */

function getCartQuantity() {

    /*
       Make sure the in-memory cart is current.
    */

    refreshCart();


    return cart.reduce(
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

}


/* =========================================================
   GET DIFFERENT CART ITEM COUNT
========================================================= */

function getCartItemCount() {

    refreshCart();


    return cart.length;

}


/* =========================================================
   GET CART SUBTOTAL
========================================================= */

function getCartSubtotal() {

    refreshCart();


    return cart.reduce(
        (
            total,
            item
        ) => {

            const price =
                Number(
                    item.price || 0
                );


            const quantity =
                Number(
                    item.quantity || 0
                );


            return (
                total +
                (
                    price *
                    quantity
                )
            );

        },
        0
    );

}


/* =========================================================
   NORMALIZE VALUE
=========================================================

   Used for creating a stable cart identity.

   Important:

   Objects are sorted by key so that:

   {name:"Red", price:20}

   and

   {price:20, name:"Red"}

   are treated as the same configuration.
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


    /* ARRAY */

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


    /* OBJECT */

    if (
        typeof value === "object"
    ) {

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


    /* STRING / NUMBER / BOOLEAN */

    return String(
        value
    )
        .trim()
        .toLowerCase();

}


/* =========================================================
   CREATE CART ITEM KEY
=========================================================

   Product ID alone is NOT enough.

   Example:

   Product A
   Red
   M

   and

   Product A
   Blue
   M

   must be separate cart items.

   Custom values are also included.

========================================================= */

function createCartItemKey(
    productId,
    configuration = {}
) {

    const identity = {

        productId:
            String(
                productId || ""
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
   GET PRODUCT CART PRICE
========================================================= */

function getProductCartPrice(
    product,
    configuration = {}
) {

    let price = 0;


    /* =====================================================
       BASE PRODUCT PRICE

       Match product.js pricing:

       salePrice is used only when it is
       lower than basePrice.
    ===================================================== */

    const base =
        Number(
            product?.basePrice || 0
        );


    const sale =
        Number(
            product?.salePrice || 0
        );


    if (
        sale > 0 &&
        sale < base
    ) {

        price = sale;

    }

    else if (
        base > 0
    ) {

        price = base;

    }

    else {

        price =
            Number(
                product?.price || 0
            );

    }


    /* =====================================================
       COLOR EXTRA
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
       SIZE EXTRA
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
       CUSTOM OPTIONS
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
                            extra || 0
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
   GET PRODUCT IMAGE
========================================================= */

function getProductImage(
    product
) {

    /* =====================================================
       PRODUCT IMAGES ARRAY
    ===================================================== */

    if (
        Array.isArray(
            product?.images
        ) &&
        product.images.length
    ) {

        const first =
            product.images[0];


        /* STRING IMAGE URL */

        if (
            typeof first ===
            "string"
        ) {

            return first;

        }


        /* OBJECT IMAGE */

        return (
            first?.url ||
            first?.src ||
            ""
        );

    }


    /* =====================================================
       FALLBACK IMAGE FIELDS
    ===================================================== */

    return (
        product?.image ||
        product?.imageUrl ||
        product?.thumbnail ||
        ""
    );

}


/* =========================================================
   ADD TO CART
========================================================= */

function addToCart(
    product,
    configuration = {},
    quantity = 1
) {

    /*
       Always get the newest cart first.
    */

    refreshCart();


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


    quantity =
        Math.floor(
            quantity
        );


    /* =====================================================
       CREATE CONFIGURATION KEY
    ===================================================== */

    const cartItemKey =
        createCartItemKey(
            product.id,
            configuration
        );


    /* =====================================================
       FIND EXISTING ITEM
    ===================================================== */

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
                existing.quantity || 0
            ) +
            quantity;


        if (
            existing.quantity < 1
        ) {

            existing.quantity = 1;

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


            /* =================================================
               SELECTED VARIANTS
            ================================================= */

            color:
                configuration.color ||
                null,

            size:
                configuration.size ||
                null,


            /* =================================================
               CUSTOM OPTIONS
            ================================================= */

            options:
                configuration.options ||
                {},

            optionValues:
                configuration.optionValues ||
                {},

            customOptionPrices:
                configuration.customOptionPrices ||
                [],


            /* =================================================
               PRODUCT SNAPSHOT
            ================================================= */

            productSnapshot: {

                /*
                   IMPORTANT:

                   Include product ID inside the snapshot
                   as well. This makes checkout conversion
                   more reliable.
                */

                id:
                    product.id,

                name:
                    product.name ||
                    product.title ||
                    "Product",

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


            /* =================================================
               TIMESTAMP
            ================================================= */

            addedAt:
                Date.now()

        };


        cart.push(
            item
        );

    }


    /* =====================================================
       SAVE + NOTIFY
    ===================================================== */

    commitCart();


    return findCartItem(
        cartItemKey
    );

}


/* =========================================================
   SET EXACT QUANTITY
========================================================= */

function setCartItemQuantity(
    cartItemKey,
    quantity
) {

    /*
       IMPORTANT:

       Reload before modifying so we don't
       overwrite changes made by sidebar.
    */

    refreshCart();


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


    /* =====================================================
       SET QUANTITY
    ===================================================== */

    else {

        cart[index].quantity =
            Math.floor(
                quantity
            );

    }


    /* =====================================================
       SAVE + NOTIFY
    ===================================================== */

    commitCart();


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

    refreshCart();


    const item =
        findCartItem(
            cartItemKey
        );


    if (
        !item
    ) {

        return null;

    }


    amount =
        Number(
            amount
        );


    if (
        !Number.isFinite(
            amount
        ) ||
        amount <= 0
    ) {

        amount = 1;

    }


    const newQuantity =
        Number(
            item.quantity || 0
        ) +
        amount;


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

    refreshCart();


    const item =
        findCartItem(
            cartItemKey
        );


    if (
        !item
    ) {

        return null;

    }


    amount =
        Number(
            amount
        );


    if (
        !Number.isFinite(
            amount
        ) ||
        amount <= 0
    ) {

        amount = 1;

    }


    const newQuantity =
        Number(
            item.quantity || 0
        ) -
        amount;


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

    refreshCart();


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


    commitCart();


    return true;

}


/* =========================================================
   CLEAR CART
========================================================= */

function clearCart() {

    /*
       Clear both memory and LocalStorage.
    */

    cart = [];


    commitCart();

}


/* =========================================================
   GET CONFIGURATION QUANTITY
========================================================= */

function getConfigurationQuantity(
    productId,
    configuration = {}
) {

    /*
       Always use the latest cart.
    */

    refreshCart();


    const key =
        createCartItemKey(
            productId,
            configuration
        );


    const item =
        findCartItem(
            key
        );


    if (
        !item
    ) {

        return 0;

    }


    return Number(
        item.quantity || 0
    );

}


/* =========================================================
   GET CART ITEM BY CONFIGURATION
========================================================= */

function getCartItemByConfiguration(
    productId,
    configuration = {}
) {

    refreshCart();


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
========================================================= */

function updateCartUI() {

    /*
       Use the current in-memory cart here.

       Do NOT call getCartQuantity(),
       because that would reload again.
    */

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


    /* =====================================================
       CART BADGE
    ===================================================== */

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


            /* =================================================
               EMPTY STATE
            ================================================= */

            if (
                totalQuantity <= 0
            ) {

                element.classList.add(
                    "empty"
                );

            }

            else {

                element.classList.remove(
                    "empty"
                );

            }

        }
    );


    /* =====================================================
       SUBTOTAL
    ===================================================== */

    const subtotal =
        cart.reduce(
            (
                total,
                item
            ) => {

                return (
                    total +
                    (
                        Number(
                            item.price || 0
                        ) *
                        Number(
                            item.quantity || 0
                        )
                    )
                );

            },
            0
        );


    document
        .querySelectorAll(
            "#cartSubtotal, .cart-subtotal"
        )
        .forEach(
            element => {

                element.textContent =
                    formatMoney(
                        subtotal
                    );

            }
        );


    /* =====================================================
       DIFFERENT ITEM COUNT
    ===================================================== */

    document
        .querySelectorAll(
            "#cartItemCount, .cart-item-count"
        )
        .forEach(
            element => {

                element.textContent =
                    String(
                        cart.length
                    );

            }
        );

}


/* =========================================================
   CART CHANGE EVENT
========================================================= */

function dispatchCartChange() {

    /*
       Create a fresh snapshot so listeners cannot
       accidentally modify our internal array.
    */

    const currentCart =
        [
            ...cart
        ];


    const quantity =
        currentCart.reduce(
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


    const itemCount =
        currentCart.length;


    const subtotal =
        currentCart.reduce(
            (
                total,
                item
            ) => {

                return (
                    total +
                    (
                        Number(
                            item.price || 0
                        ) *
                        Number(
                            item.quantity || 0
                        )
                    )
                );

            },
            0
        );


    window.dispatchEvent(
        new CustomEvent(
            "cartUpdated",
            {
                detail: {

                    cart:
                        currentCart,

                    quantity,

                    itemCount,

                    subtotal

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
            value || 0
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
   OPEN CART
=========================================================

   cart-sidebar.js now controls the cart drawer.

   This fallback remains for pages where the drawer
   is not loaded.
========================================================= */

function openCart() {

    if (
        typeof window.openCartSidebar ===
        "function"
    ) {

        window.openCartSidebar();

        return;

    }


    /*
       Fallback only.
    */

    window.location.href =
        "cart.html";

}


/* =========================================================
   GLOBAL CART FUNCTIONS
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


window.updateCartUI =
    updateCartUI;


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