/* ======================================================
   ORDER / CHECKOUT PAGE

   FEATURES
   ------------------------------------------------------
   ✓ Single product checkout
   ✓ Multiple product checkout
   ✓ Product variants
   ✓ Size-specific shipping
   ✓ Common shipping
   ✓ Free shipping
   ✓ Payment-method discount
   ✓ Coupon discount
   ✓ Coupon free shipping
   ✓ STACK / REPLACE / BEST
   ✓ Product-specific coupons
   ✓ Shipping in summary
   ✓ Shipping in price breakdown
   ✓ Advance payment
   ✓ Razorpay
   ✓ WhatsApp
   ✓ Common checkout note
====================================================== */

import { db } from "./firebase.js";

import {
    collection,
    addDoc,
    doc,
    getDoc,
    getDocs,
    runTransaction
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


/* ======================================================
   GLOBAL STATE
====================================================== */

let orderData = null;

let siteSettings = {

    companyName: "",
    whatsapp: "",
    email: "",
    logoUrl: "",
    faviconUrl: "",
    websiteTitle: "",
    metaDescription: "",
    metaKeywords: "",
    razorpayKeyId: "",
    orderPrefix: "IG"

};


/*
   All checkout items.

   This supports:
   checkoutData.items
   checkoutData.products
   checkoutData.cart

   and old:
   checkoutData.product
*/
let orderItems = [];


/*
   Original subtotal before discounts.
*/
let subTotal = 0;


/*
   Original shipping before free shipping.
*/
let originalShipping = 0;


/*
   Final shipping after free shipping.
*/
let shippingAmount = 0;


/*
   Payment method discount.
*/
let paymentDiscount = 0;


/*
   Coupon discount.
*/
let couponDiscount = 0;


/*
   Actual discount applied after
   STACK / REPLACE / BEST.
*/
let totalDiscount = 0;


/*
   Final amount.
*/
let finalAmount = 0;


/*
   Currently applied coupon.
*/
let appliedCoupon = null;


/*
   Available coupons.
*/
let availableCoupons = [];


/*
   Payment mode.
*/
let selectedPaymentMode = "online";


/*
   Order number.
*/
let orderNumber = null;


/*
   Prevent double order submission.
*/
let orderSubmitting = false;


/*
   Common checkout note.

   This is NOT loaded from settings.
   Change the text here whenever required.
*/
const CHECKOUT_NOTE =
    "Please check your product details, customization and delivery information carefully before placing the order.";


/* ======================================================
   LOAD SITE SETTINGS
====================================================== */

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


        if (snapshot.exists()) {

            siteSettings = {

                ...siteSettings,

                ...snapshot.data()

            };

        }


        window.siteSettings =
            siteSettings;


        applySiteSettings();


        return siteSettings;

    }

    catch (error) {

        console.error(
            "Site settings loading error:",
            error
        );


        window.siteSettings =
            siteSettings;


        return siteSettings;

    }

}


/* ======================================================
   APPLY SITE SETTINGS
====================================================== */

function applySiteSettings() {

    const companyName =
        siteSettings.companyName ||
        "";


    document.title =
        siteSettings.websiteTitle ||
        companyName;


    document
        .querySelectorAll(
            "[data-company-name]"
        )
        .forEach(
            element => {

                element.textContent =
                    companyName;

            }
        );


    document
        .querySelectorAll(
            "[data-site-logo]"
        )
        .forEach(
            image => {

                if (
                    siteSettings.logoUrl
                ) {

                    image.src =
                        siteSettings.logoUrl;

                }


                image.alt =
                    companyName;

            }
        );


    if (
        siteSettings.faviconUrl
    ) {

        let favicon =
            document.querySelector(
                'link[rel="icon"]'
            );


        if (!favicon) {

            favicon =
                document.createElement(
                    "link"
                );


            favicon.rel =
                "icon";


            document.head.appendChild(
                favicon
            );

        }


        favicon.href =
            siteSettings.faviconUrl;

    }


    if (
        siteSettings.metaDescription
    ) {

        let meta =
            document.querySelector(
                'meta[name="description"]'
            );


        if (!meta) {

            meta =
                document.createElement(
                    "meta"
                );


            meta.name =
                "description";


            document.head.appendChild(
                meta
            );

        }


        meta.content =
            siteSettings.metaDescription;

    }

}


/* ======================================================
   LOAD ORDER
====================================================== */

async function loadOrder() {

    try {

        await loadSiteSettings();


        const raw =
            localStorage.getItem(
                "checkoutData"
            );


        if (!raw) {

            alert(
                "No product selected"
            );


            location.href =
                "website/shop.html";


            return;

        }


        orderData =
            JSON.parse(
                raw
            );


        if (!orderData) {

            alert(
                "Invalid checkout data"
            );


            location.href =
                "website/shop.html";


            return;

        }


        /*
           Convert checkout data into
           standard orderItems array.
        */

        orderItems =
            normalizeCheckoutItems(
                orderData
            );


        if (!orderItems.length) {

            alert(
                "No products selected"
            );


            location.href =
                "website/shop.html";


            return;

        }


        /*
           Calculate base subtotal.
        */

        calculateSubtotal();


        /*
           Render products.
        */

        renderSummary();


        /*
           Setup payment methods.
        */

        setupPaymentModes();


        /*
           Load coupons.
        */

        await loadCoupons();


        /*
           Calculate everything.
        */

        recalcPrice();


        updateAdvancePaymentInfo();


        /*
           Render common checkout note.
        */

        renderCheckoutNote();


        console.log(
            "Order data loaded:",
            orderData
        );


        console.log(
            "Normalized order items:",
            orderItems
        );

    }

    catch (error) {

        console.error(
            "Order loading error:",
            error
        );


        showOrderPopup(
            false,
            "Unable to Load Order",
            "We could not load your order details. Please try again."
        );

    }

}


/* ======================================================
   NORMALIZE CHECKOUT ITEMS
====================================================== */

function normalizeCheckoutItems(
    data
) {

    let rawItems = [];


    /*
       New multiple-product format
    */

    if (
        Array.isArray(
            data.items
        ) &&
        data.items.length
    ) {

        rawItems =
            data.items;

    }


    /*
       Alternative multiple-product format
    */

    else if (
        Array.isArray(
            data.products
        ) &&
        data.products.length
    ) {

        rawItems =
            data.products;

    }


    /*
       Alternative cart format
    */

    else if (
        Array.isArray(
            data.cart
        ) &&
        data.cart.length
    ) {

        rawItems =
            data.cart;

    }


    /*
       Existing single product format
    */

    else if (
        data.product
    ) {

        rawItems = [

            {

                product:
                    data.product,

                color:
                    data.color ||
                    null,

                size:
                    data.size ||
                    null,

                options:
                    data.options ||
                    {},

                optionValues:
                    data.optionValues ||
                    {},

                imageLinks:
                    data.imageLinks ||
                    {},

                quantity:
                    Number(
                        data.quantity ||
                        1
                    ),

                finalPrice:
                    data.finalPrice

            }

        ];

    }


    return rawItems
        .map(
            item => {

                /*
                   Some carts may directly contain
                   product properties.
                */

                const product =
                    item.product ||
                    item;


                return {

                    product,

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

                    quantity:
                        Math.max(
                            Number(
                                item.quantity ||
                                1
                            ),
                            1
                        ),

                    finalPrice:
                        item.finalPrice

                };

            }
        );

}


/* ======================================================
   GET ITEM UNIT PRICE
====================================================== */

function getItemUnitPrice(
    item
) {

    /*
       If checkout already calculated
       finalPrice, use it.

       This is useful because your product
       page may already calculate:

       base price
       + color
       + size
       + custom options
    */

    if (
        item.finalPrice !== undefined &&
        item.finalPrice !== null &&
        item.finalPrice !== ""
    ) {

        const value =
            Number(
                item.finalPrice
            );


        if (
            Number.isFinite(
                value
            )
        ) {

            return Math.max(
                value,
                0
            );

        }

    }


    const product =
        item.product ||
        {};


    let price =
        Number(
            product.salePrice ??
            product.basePrice ??
            0
        );


    /*
       COLOR PRICE
    */

    if (
        item.color
    ) {

        price +=
            Number(
                item.color.price ||
                0
            );

    }


    /*
       SIZE PRICE

       If size object already contains price,
       use it.
    */

    if (
        item.size
    ) {

        price +=
            Number(
                item.size.price ||
                0
            );

    }


    /*
       CUSTOM OPTION PRICES

       Calculate only when finalPrice was
       not already supplied.
    */

    const customOptions =
        product.customOptions ||
        [];


    Object
        .keys(
            item.options ||
            {}
        )
        .forEach(
            index => {

                const option =
                    customOptions[index];


                if (!option) {

                    return;

                }


                price +=
                    Number(
                        option.price ||
                        0
                    );

            }
        );


    return Math.max(
        price,
        0
    );

}


/* ======================================================
   CALCULATE SUBTOTAL
====================================================== */

function calculateSubtotal() {

    subTotal = 0;


    orderItems.forEach(
        item => {

            const unitPrice =
                getItemUnitPrice(
                    item
                );


            const quantity =
                Math.max(
                    Number(
                        item.quantity ||
                        1
                    ),
                    1
                );


            item.calculatedUnitPrice =
                unitPrice;


            item.calculatedQuantity =
                quantity;


            item.calculatedSubtotal =
                unitPrice *
                quantity;


            subTotal +=
                item.calculatedSubtotal;

        }
    );


    subTotal =
        Math.round(
            subTotal *
            100
        ) / 100;

}


/* ======================================================
   SHIPPING HELPERS
====================================================== */


/*
   Find selected size shipping.

   Supports:
   shippingType
   shippingAmount

   on size object.
*/

function getSizeShipping(
    item
) {

    const size =
        item.size;


    if (!size) {

        return null;

    }


    const type =
        String(
            size.shippingType ||
            ""
        )
            .toLowerCase()
            .trim();


    /*
       No override means common shipping.
    */

    if (!type) {

        return null;

    }


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
                Number(
                    size.shippingAmount ||
                    0
                )

        };

    }


    /*
       Explicit common.
    */

    if (
        type === "common"
    ) {

        return {

            type: "common",

            amount: 0

        };

    }


    return null;

}


/*
   Get product common shipping.
*/

function getProductShipping(
    product
) {

    const shipping =
        product?.shipping ||
        {};


    /*
       Some older product structures may
       store shippingType directly.
    */

    const type =
        String(
            shipping.type ||
            product.shippingType ||
            "free"
        )
            .toLowerCase()
            .trim();


    let amount =
        Number(
            shipping.amount ??
            product.shippingAmount ??
            0
        );


    if (
        !Number.isFinite(
            amount
        )
    ) {

        amount = 0;

    }


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
                    amount,
                    0
                )

        };

    }


    return {

        type: "free",

        amount: 0

    };

}


/*
   Get shipping for one item.
*/

function getItemShipping(
    item
) {

    const product =
        item.product ||
        {};


    const sizeShipping =
        getSizeShipping(
            item
        );


    /*
       Size has FREE
    */

    if (
        sizeShipping?.type ===
        "free"
    ) {

        return 0;

    }


    /*
       Size has custom paid shipping
    */

    if (
        sizeShipping?.type ===
        "paid"
    ) {

        return Math.max(
            Number(
                sizeShipping.amount ||
                0
            ),
            0
        );

    }


    /*
       Size = common
       or no size override.

       Use common product shipping.
    */

    const commonShipping =
        getProductShipping(
            product
        );


    return Math.max(
        Number(
            commonShipping.amount ||
            0
        ),
        0
    );

}


/* ======================================================
   CALCULATE ORIGINAL SHIPPING
====================================================== */

function calculateOriginalShipping() {

    originalShipping = 0;


    orderItems.forEach(
        item => {

            const unitShipping =
                getItemShipping(
                    item
                );


            const quantity =
                Math.max(
                    Number(
                        item.quantity ||
                        1
                    ),
                    1
                );


            item.originalShipping =
                unitShipping *
                quantity;


            originalShipping +=
                item.originalShipping;

        }
    );


    originalShipping =
        Math.round(
            originalShipping *
            100
        ) / 100;

}


/* ======================================================
   COUPON APPLIES TO ITEM
====================================================== */

function couponAppliesToItem(
    coupon,
    item
) {

    if (!coupon) {

        return false;

    }


    /*
       Global coupon
    */

    if (
        coupon.scope !==
        "product"
    ) {

        return true;

    }


    const productIds =
        Array.isArray(
            coupon.productIds
        )
            ?
            coupon.productIds
            :
            [];


    /*
       Product-specific coupon
       with no products assigned.
    */

    if (
        !productIds.length
    ) {

        return false;

    }


    return productIds.includes(
        item.product?.id
    );

}


/* ======================================================
   GET COUPON ELIGIBLE SUBTOTAL
====================================================== */

function getCouponEligibleSubtotal(
    coupon
) {

    let total = 0;


    orderItems.forEach(
        item => {

            if (
                couponAppliesToItem(
                    coupon,
                    item
                )
            ) {

                total +=
                    Number(
                        item.calculatedSubtotal ||
                        0
                    );

            }

        }
    );


    return Math.max(
        total,
        0
    );

}


/* ======================================================
   CALCULATE COUPON DISCOUNT
====================================================== */

function calculateCouponDiscount(
    coupon
) {

    if (!coupon) {

        return 0;

    }


    /*
       Free shipping coupons do not
       necessarily have a price discount.
    */

    if (
        coupon.type ===
            "free_shipping" ||
        coupon.type ===
            "shipping"
    ) {

        return 0;

    }


    const eligibleSubtotal =
        getCouponEligibleSubtotal(
            coupon
        );


    if (
        eligibleSubtotal <= 0
    ) {

        return 0;

    }


    const type =
        String(
            coupon.type ||
            ""
        )
            .toLowerCase()
            .trim();


    const value =
        Number(
            coupon.value ||
            0
        );


    let result = 0;


    /*
       PERCENT
    */

    if (
        type === "percent" ||
        type === "%" ||
        type === "percentage"
    ) {

        result =
            eligibleSubtotal *
            (
                value /
                100
            );

    }


    /*
       FLAT
    */

    else if (
        type === "flat" ||
        type === "amount" ||
        type === "fixed"
    ) {

        result =
            value;

    }


    result =
        Math.max(
            result,
            0
        );


    /*
       Coupon cannot discount more
       than its eligible products.
    */

    result =
        Math.min(
            result,
            eligibleSubtotal
        );


    return Math.round(
        result *
        100
    ) / 100;

}


/* ======================================================
   CALCULATE PAYMENT DISCOUNT
====================================================== */

function calculatePaymentDiscountForItems() {

    let total = 0;


    orderItems.forEach(
        item => {

            const product =
                item.product ||
                {};


            const settings =
                product
                    .paymentSettings
                    ?.[selectedPaymentMode] ||
                {};


            if (
                !settings.enabled
            ) {

                return;

            }


            const type =
                String(
                    settings.discountType ||
                    "none"
                )
                    .toLowerCase()
                    .trim();


            const value =
                Number(
                    settings.discountValue ||
                    0
                );


            if (
                value <= 0
            ) {

                return;

            }


            const itemSubtotal =
                Number(
                    item.calculatedSubtotal ||
                    0
                );


            let discountForItem =
                0;


            /*
               PERCENT
            */

            if (
                type === "percent" ||
                type === "%" ||
                type === "percentage"
            ) {

                discountForItem =
                    itemSubtotal *
                    (
                        value /
                        100
                    );

            }


            /*
               FLAT
            */

            else if (
                type === "flat" ||
                type === "amount" ||
                type === "fixed"
            ) {

                /*
                   Flat payment discount is
                   applied once per product line,
                   not once per quantity.
                */

                discountForItem =
                    value;

            }


            discountForItem =
                Math.max(
                    discountForItem,
                    0
                );


            discountForItem =
                Math.min(
                    discountForItem,
                    itemSubtotal
                );


            total +=
                discountForItem;

        }
    );


    return Math.round(
        total *
        100
    ) / 100;

}


/* ======================================================
   CALCULATE FREE SHIPPING
====================================================== */

function calculateFreeShipping() {

    if (!appliedCoupon) {

        return false;

    }


    /*
       New format
    */

    if (
        appliedCoupon.freeShipping ===
        true
    ) {

        return true;

    }


    /*
       Also support coupon type.
    */

    const type =
        String(
            appliedCoupon.type ||
            ""
        )
            .toLowerCase()
            .trim();


    return (
        type === "free_shipping" ||
        type === "shipping"
    );

}


/* ======================================================
   CALCULATE SHIPPING
====================================================== */

function calculateShipping() {

    calculateOriginalShipping();


    const freeShipping =
        calculateFreeShipping();


    if (
        freeShipping
    ) {

        shippingAmount = 0;

    }

    else {

        shippingAmount =
            originalShipping;

    }


    shippingAmount =
        Math.round(
            shippingAmount *
            100
        ) / 100;

}


/* ======================================================
   GET COUPON / PAYMENT DISCOUNT
   ACCORDING TO STACK RULE
====================================================== */

function calculateDiscountRule() {

    /*
       Payment discount
    */

    paymentDiscount =
        calculatePaymentDiscountForItems();


    /*
       Coupon discount
    */

    couponDiscount =
        appliedCoupon
            ?
            calculateCouponDiscount(
                appliedCoupon
            )
            :
            0;


    /*
       No coupon
    */

    if (!appliedCoupon) {

        totalDiscount =
            Math.min(
                subTotal,
                paymentDiscount
            );


        return;

    }


    const rule =
        String(
            appliedCoupon.stackRule ||
            "stack"
        )
            .toLowerCase()
            .trim();


    /* ==================================================
       STACK

       Payment discount + coupon discount
    ================================================== */

    if (
        rule === "stack"
    ) {

        totalDiscount =
            paymentDiscount +
            couponDiscount;

    }


    /* ==================================================
       REPLACE

       Coupon replaces payment discount.
    ================================================== */

    else if (
        rule === "replace"
    ) {

        totalDiscount =
            couponDiscount;

    }


    /* ==================================================
       BEST

       Whichever monetary discount is higher.
    ================================================== */

    else if (
        rule === "best"
    ) {

        totalDiscount =
            Math.max(
                paymentDiscount,
                couponDiscount
            );

    }


    /*
       Safety
    */

    totalDiscount =
        Math.max(
            totalDiscount,
            0
        );


    totalDiscount =
        Math.min(
            totalDiscount,
            subTotal
        );


    totalDiscount =
        Math.round(
            totalDiscount *
            100
        ) / 100;

}


/* ======================================================
   RECALCULATE EVERYTHING
====================================================== */

function recalcPrice() {

    /*
       Discount calculation
    */

    calculateDiscountRule();


    /*
       Shipping
    */

    calculateShipping();


    /*
       Final amount
    */

    finalAmount =
        subTotal -
        totalDiscount +
        shippingAmount;


    if (
        finalAmount < 0
    ) {

        finalAmount = 0;

    }


    finalAmount =
        Math.round(
            finalAmount *
            100
        ) / 100;


    /*
       Subtotal
    */

    const subTotalElement =
        document.getElementById(
            "subTotal"
        );


    if (subTotalElement) {

        subTotalElement.innerText =
            "₹" +
            formatMoney(
                subTotal
            );

    }


    /*
       Shipping
    */

    const shippingElement =
        document.getElementById(
            "shippingAmount"
        );


    if (shippingElement) {

        shippingElement.innerText =
            shippingAmount === 0
                ?
                "FREE"
                :
                "₹" +
                formatMoney(
                    shippingAmount
                );

    }


    /*
       Discount
    */

    const discountElement =
        document.getElementById(
            "discountAmount"
        );


    if (discountElement) {

        discountElement.innerText =
            "-₹" +
            formatMoney(
                totalDiscount
            );

    }


    /*
       Payment discount
    */

    const paymentDiscountElement =
        document.getElementById(
            "paymentDiscountAmount"
        );


    if (
        paymentDiscountElement
    ) {

        paymentDiscountElement.innerText =
            "-₹" +
            formatMoney(
                paymentDiscount
            );

    }


    /*
       Coupon discount
    */

    const couponDiscountElement =
        document.getElementById(
            "couponDiscountAmount"
        );


    if (
        couponDiscountElement
    ) {

        couponDiscountElement.innerText =
            "-₹" +
            formatMoney(
                couponDiscount
            );

    }


    /*
       Final amount
    */

    const finalElement =
        document.getElementById(
            "finalAmount"
        );


    if (finalElement) {

        finalElement.innerText =
            "₹" +
            formatMoney(
                finalAmount
            );

    }


    /*
       Render discount explanation
    */

    renderDiscountInformation();


    updateAdvancePaymentInfo();

}


/* ======================================================
   DISCOUNT INFORMATION
====================================================== */

function renderDiscountInformation() {

    const box =
        document.getElementById(
            "discountInformation"
        );


    if (!box) {

        return;

    }


    box.innerHTML =
        "";


    if (
        !paymentDiscount &&
        !couponDiscount
    ) {

        return;

    }


    let text = "";


    if (
        appliedCoupon
    ) {

        const rule =
            String(
                appliedCoupon.stackRule ||
                "stack"
            )
                .toLowerCase();


        if (
            rule === "stack"
        ) {

            text =
                "Payment discount + coupon discount applied.";

        }

        else if (
            rule === "replace"
        ) {

            text =
                "Coupon discount replaced the payment discount.";

        }

        else if (
            rule === "best"
        ) {

            if (
                couponDiscount >
                paymentDiscount
            ) {

                text =
                    "Coupon discount was higher, so it was applied.";

            }

            else if (
                paymentDiscount >
                couponDiscount
            ) {

                text =
                    "Payment discount was higher, so it was applied.";

            }

            else {

                text =
                    "The coupon and payment discount were equal.";

            }

        }

    }


    if (text) {

        box.textContent =
            text;

    }

}


/* ======================================================
   RENDER ORDER SUMMARY
====================================================== */

function renderSummary() {

    const box =
        document.getElementById(
            "orderSummary"
        );


    if (!box) {

        return;

    }


    box.innerHTML =
        "";


    orderItems.forEach(
        (item, itemIndex) => {

            const product =
                item.product ||
                {};


            const quantity =
                Math.max(
                    Number(
                        item.quantity ||
                        1
                    ),
                    1
                );


            const unitPrice =
                Number(
                    item.calculatedUnitPrice ||
                    getItemUnitPrice(
                        item
                    )
                );


            const itemSubtotal =
                Number(
                    item.calculatedSubtotal ||
                    unitPrice *
                    quantity
                );


            const itemShipping =
                Number(
                    item.originalShipping ||
                    0
                );


            const wrapper =
                document.createElement(
                    "div"
                );


            wrapper.className =
                "order-summary-item";


            let html = `

                <div class="order-product">

                    ${
                        product.images?.[0]
                            ?
                            `
                            <img
                                src="${escapeAttribute(
                                    product.images[0]
                                )}"
                                alt="${escapeAttribute(
                                    product.name ||
                                    "Product"
                                )}"
                                style="
                                    width:70px;
                                    height:70px;
                                    object-fit:cover;
                                    border-radius:10px;
                                    margin-bottom:8px;
                                "
                            >
                            `
                            :
                            ""
                    }

                    <div>

                        <b>
                            ${escapeHtml(
                                product.name ||
                                "Product"
                            )}
                        </b>

                    </div>

                </div>


                <div>
                    Price:
                    ₹${formatMoney(
                        unitPrice
                    )}
                </div>


                <div>
                    Quantity:
                    ${quantity}
                </div>

            `;


            /* COLOR */

            if (
                item.color
            ) {

                html += `

                    <div>

                        Color:
                        ${escapeHtml(
                            item.color.name ||
                            ""
                        )}

                    </div>

                `;

            }


            /* SIZE */

            if (
                item.size
            ) {

                html += `

                    <div>

                        Size:
                        ${escapeHtml(
                            item.size.name ||
                            ""
                        )}

                    </div>

                `;

            }


            /* CUSTOM OPTIONS */

            if (
                item.options &&
                Object.keys(
                    item.options
                ).length
            ) {

                html += `

                    <div style="margin-top:6px">

                        <b>
                            Options:
                        </b>

                    </div>

                `;


                Object
                    .keys(
                        item.options
                    )
                    .forEach(
                        index => {

                            const option =
                                product
                                    .customOptions
                                    ?.[index];


                            const label =
                                option?.label ||
                                "Option";


                            const value =
                                item
                                    .optionValues
                                    ?.[index] ||
                                "Selected";


                            html += `

                                <div>

                                    -
                                    ${escapeHtml(
                                        label
                                    )}:

                                    ${escapeHtml(
                                        value
                                    )}

                                </div>

                            `;

                        }
                    );

            }


            html += `

                <div>

                    Product Total:
                    ₹${formatMoney(
                        itemSubtotal
                    )}

                </div>


                <div>

                    Shipping:
                    ${
                        itemShipping > 0
                            ?
                            `₹${formatMoney(
                                itemShipping
                            )}`
                            :
                            "FREE"
                    }

                </div>

            `;


            wrapper.innerHTML =
                html;


            box.appendChild(
                wrapper
            );


            /*
               Divider
            */

            if (
                itemIndex <
                orderItems.length - 1
            ) {

                const divider =
                    document.createElement(
                        "hr"
                    );


                divider.style.margin =
                    "15px 0";


                box.appendChild(
                    divider
                );

            }

        }
    );


    /*
       Summary total shipping
    */

    const shippingSummary =
        document.createElement(
            "div"
        );


    shippingSummary.style.marginTop =
        "15px";


    shippingSummary.innerHTML = `

        <b>
            Total Shipping:
        </b>

        <span>
            ${
                originalShipping > 0
                    ?
                    `₹${formatMoney(
                        originalShipping
                    )}`
                    :
                    "FREE"
            }
        </span>

    `;


    box.appendChild(
        shippingSummary
    );

}


/* ======================================================
   SETUP PAYMENT MODES
====================================================== */

function setupPaymentModes() {

    /*
       Determine which payment modes are
       actually available.

       For multiple products, a mode is enabled
       when at least one item supports it.

       This preserves compatibility with
       your existing product payment settings.
    */

    const modes = {

        online: orderItems.some(
            item =>
                item.product
                    ?.paymentSettings
                    ?.online
                    ?.enabled
        ),

        cod: orderItems.some(
            item =>
                item.product
                    ?.paymentSettings
                    ?.cod
                    ?.enabled
        ),

        advance: orderItems.some(
            item =>
                item.product
                    ?.paymentSettings
                    ?.advance
                    ?.enabled
        )

    };


    const onlineLabel =
        document.getElementById(
            "onlineOption"
        );


    const codLabel =
        document.getElementById(
            "codOption"
        );


    const advanceLabel =
        document.getElementById(
            "advanceOption"
        );


    if (onlineLabel) {

        onlineLabel.style.display =
            modes.online
                ?
                ""
                :
                "none";

    }


    if (codLabel) {

        codLabel.style.display =
            modes.cod
                ?
                ""
                :
                "none";

    }


    if (advanceLabel) {

        advanceLabel.style.display =
            modes.advance
                ?
                ""
                :
                "none";

    }


    /*
       Default mode.
    */

    if (modes.online) {

        selectedPaymentMode =
            "online";

    }

    else if (modes.cod) {

        selectedPaymentMode =
            "cod";

    }

    else if (modes.advance) {

        selectedPaymentMode =
            "advance";

    }

    else {

        selectedPaymentMode =
            "online";

    }


    const firstRadio =
        document.querySelector(
            `input[name="paymode"][value="${selectedPaymentMode}"]`
        );


    if (firstRadio) {

        firstRadio.checked =
            true;

    }


    /*
       Payment change.
    */

    document
        .querySelectorAll(
            "input[name='paymode']"
        )
        .forEach(
            radio => {

                radio.addEventListener(
                    "change",
                    async () => {

                        selectedPaymentMode =
                            radio.value;


                        /*
                           Existing coupon may
                           no longer be valid for
                           this payment mode.

                           Remove it.
                        */

                        removeCoupon();


                        await loadCoupons();


                        recalcPrice();


                        updateAdvancePaymentInfo();

                    }
                );

            }
        );


    recalcPrice();

}


/* ======================================================
   LOAD COUPONS
====================================================== */

async function loadCoupons() {

    try {

        const snap =
            await getDocs(
                collection(
                    db,
                    "coupons"
                )
            );


        availableCoupons =
            [];


        const now =
            new Date();


        snap.forEach(
            d => {

                const coupon =
                    d.data();


                if (
                    coupon.active === false
                ) {

                    return;

                }


                /*
                   Expiry
                */

                const expiry =
                    coupon.expiry?.toDate
                        ?
                        coupon.expiry.toDate()
                        :
                        null;


                if (
                    expiry &&
                    expiry < now
                ) {

                    return;

                }


                /*
                   Minimum order.

                   Use overall subtotal.
                */

                if (
                    Number(
                        coupon.minOrder ||
                        0
                    ) >
                    subTotal
                ) {

                    return;

                }


                /*
                   Payment mode.

                   Coupon can be used only
                   with allowed modes.
                */

                if (
                    Array.isArray(
                        coupon.allowedModes
                    ) &&
                    coupon.allowedModes.length &&
                    !coupon.allowedModes.includes(
                        selectedPaymentMode
                    )
                ) {

                    return;

                }


                /*
                   Product-specific coupon.

                   At least one checkout item
                   must belong to the coupon.
                */

                if (
                    coupon.scope ===
                    "product"
                ) {

                    const hasMatchingProduct =
                        orderItems.some(
                            item =>
                                couponAppliesToItem(
                                    coupon,
                                    item
                                )
                        );


                    if (
                        !hasMatchingProduct
                    ) {

                        return;

                    }

                }


                availableCoupons.push({

                    id:
                        d.id,

                    ...coupon

                });

            }
        );


        renderCoupons();

    }

    catch (error) {

        console.error(
            "Coupon loading error:",
            error
        );

    }

}


/* ======================================================
   RENDER COUPONS
====================================================== */

function renderCoupons() {

    const list =
        document.getElementById(
            "couponListUI"
        );


    if (!list) {

        return;

    }


    list.innerHTML =
        "";


    if (
        !availableCoupons.length
    ) {

        list.innerHTML = `

            <p class="no-coupon">

                No coupons available

            </p>

        `;


        return;

    }


    availableCoupons.forEach(
        coupon => {

            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "coupon-card";


            const isApplied =
                appliedCoupon &&
                appliedCoupon.id ===
                coupon.id;


            if (isApplied) {

                div.classList.add(
                    "applied"
                );

            }


            const couponType =
                String(
                    coupon.type ||
                    ""
                )
                    .toLowerCase();


            let valueText =
                "";


            if (
                coupon.freeShipping ===
                true &&
                (
                    couponType ===
                    "free_shipping" ||
                    Number(
                        coupon.value ||
                        0
                    ) === 0
                )
            ) {

                valueText =
                    "FREE SHIPPING";

            }

            else if (
                couponType ===
                "percent"
            ) {

                valueText =
                    `${coupon.value}% OFF`;

            }

            else {

                valueText =
                    `₹${coupon.value} OFF`;

            }


            if (
                coupon.freeShipping ===
                true &&
                !valueText.includes(
                    "FREE SHIPPING"
                )
            ) {

                valueText +=
                    " + FREE SHIPPING";

            }


            div.innerHTML = `

                <div>

                    <b>
                        ${escapeHtml(
                            coupon.code ||
                            ""
                        )}
                    </b>

                    <small>

                        ${escapeHtml(
                            valueText
                        )}

                    </small>

                </div>


                <button
                    type="button"
                    onclick="${
                        isApplied
                            ?
                            "removeCoupon()"
                            :
                            `applyCoupon('${escapeAttribute(
                                coupon.id
                            )}')`
                    }"
                >

                    ${
                        isApplied
                            ?
                            "Remove"
                            :
                            "Apply"
                    }

                </button>

            `;


            list.appendChild(
                div
            );

        }
    );

}


/* ======================================================
   APPLY COUPON
====================================================== */

window.applyCoupon =
function(id) {

    const coupon =
        availableCoupons.find(
            item =>
                item.id === id
        );


    if (!coupon) {

        return;

    }


    /*
       Product-specific validation.
    */

    if (
        coupon.scope ===
        "product"
    ) {

        const matching =
            orderItems.some(
                item =>
                    couponAppliesToItem(
                        coupon,
                        item
                    )
            );


        if (!matching) {

            showCouponMessage(
                "This coupon does not apply to the selected products."
            );


            return;

        }

    }


    appliedCoupon =
        coupon;


    /*
       Calculate immediately.
    */

    recalcPrice();


    renderCoupons();


    showCouponMessage(
        `Coupon ${coupon.code} applied successfully.`
    );


    updateAdvancePaymentInfo();

};


/* ======================================================
   MANUAL COUPON
====================================================== */

window.applyManualCoupon =
function() {

    const input =
        document.getElementById(
            "couponInput"
        );


    const code =
        String(
            input?.value ||
            ""
        )
            .trim()
            .toUpperCase();


    if (!code) {

        showCouponMessage(
            "Please enter a coupon code."
        );


        return;

    }


    const coupon =
        availableCoupons.find(
            item =>
                String(
                    item.code ||
                    ""
                )
                    .trim()
                    .toUpperCase() ===
                code
        );


    if (!coupon) {

        showCouponMessage(
            "Invalid or unavailable coupon."
        );


        return;

    }


    applyCoupon(
        coupon.id
    );

};


/* ======================================================
   REMOVE COUPON
====================================================== */

window.removeCoupon =
function() {

    appliedCoupon =
        null;


    couponDiscount =
        0;


    const input =
        document.getElementById(
            "couponInput"
        );


    if (input) {

        input.value =
            "";

    }


    renderCoupons();


    recalcPrice();


    updateAdvancePaymentInfo();

};


/* ======================================================
   COUPON MESSAGE
====================================================== */

function showCouponMessage(
    message
) {

    const element =
        document.getElementById(
            "couponMsg"
        );


    if (!element) {

        return;

    }


    element.textContent =
        message;

}


/* ======================================================
   ADVANCE PAYMENT AMOUNT
====================================================== */

function getAdvancePaymentAmount() {

    /*
       For multiple products we calculate
       advance settings per product.

       If multiple products have different
       advance settings, we calculate each
       product's proportion of the final amount.

       For a single product, this behaves
       exactly like your old system.
    */

    if (
        selectedPaymentMode !==
        "advance"
    ) {

        return finalAmount;

    }


    if (
        orderItems.length === 1
    ) {

        const settings =
            orderItems[0]
                .product
                ?.paymentSettings
                ?.advance ||
            {};


        if (
            !settings.enabled
        ) {

            return finalAmount;

        }


        const type =
            String(
                settings.type ||
                "percent"
            )
                .toLowerCase()
                .trim();


        const value =
            Number(
                settings.value ||
                0
            );


        let advanceAmount =
            0;


        if (
            type === "flat" ||
            type === "amount" ||
            type === "fixed"
        ) {

            advanceAmount =
                value;

        }

        else {

            advanceAmount =
                finalAmount *
                (
                    value /
                    100
                );

        }


        return Math.min(
            Math.max(
                advanceAmount,
                0
            ),
            finalAmount
        );

    }


    /*
       Multiple products.

       Calculate weighted advance based
       on each product's discounted
       contribution.
    */

    let advanceTotal = 0;


    const subtotalAfterDiscount =
        Math.max(
            subTotal -
            totalDiscount,
            0
        );


    orderItems.forEach(
        item => {

            const product =
                item.product ||
                {};


            const settings =
                product
                    .paymentSettings
                    ?.advance ||
                {};


            if (
                !settings.enabled
            ) {

                return;

            }


            const itemSubtotal =
                Number(
                    item.calculatedSubtotal ||
                    0
                );


            if (
                itemSubtotal <= 0
            ) {

                return;

            }


            /*
               Approximate item's share of
               discounted merchandise total.
            */

            const itemShare =
                subtotalAfterDiscount >
                0
                    ?
                    itemSubtotal /
                    subTotal
                    :
                    0;


            const itemFinal =
                (
                    finalAmount -
                    shippingAmount
                ) *
                itemShare;


            const type =
                String(
                    settings.type ||
                    "percent"
                )
                    .toLowerCase()
                    .trim();


            const value =
                Number(
                    settings.value ||
                    0
                );


            if (
                type === "flat" ||
                type === "amount" ||
                type === "fixed"
            ) {

                advanceTotal +=
                    Math.min(
                        value,
                        itemFinal
                    );

            }

            else {

                advanceTotal +=
                    itemFinal *
                    (
                        value /
                        100
                    );

            }

        }
    );


    /*
       Shipping is normally payable at
       the same time as the advance unless
       your business rules say otherwise.
    */

    if (
        advanceTotal <= 0
    ) {

        return finalAmount;

    }


    return Math.min(
        Math.round(
            advanceTotal *
            100
        ) / 100,
        finalAmount
    );

}


/* ======================================================
   ADVANCE PAYMENT INFO
====================================================== */

function updateAdvancePaymentInfo() {

    const box =
        document.getElementById(
            "advancePaymentInfo"
        );


    if (!box) {

        return;

    }


    if (
        selectedPaymentMode !==
        "advance"
    ) {

        box.classList.remove(
            "show"
        );


        box.innerHTML =
            "";


        return;

    }


    const advanceAmount =
        getAdvancePaymentAmount();


    const balance =
        Math.max(
            finalAmount -
            advanceAmount,
            0
        );


    box.innerHTML = `

        <span>

            ℹ️ Pay Advance

            <span class="advance-amount">

                ₹${formatMoney(
                    advanceAmount
                )}

            </span>

            now and Balance

            <span class="balance-amount">

                ₹${formatMoney(
                    balance
                )}

            </span>

            on COD.

        </span>

    `;


    box.classList.add(
        "show"
    );

}


/* ======================================================
   RENDER CHECKOUT NOTE
====================================================== */

function renderCheckoutNote() {

    /*
       Do not require HTML manually.

       The JS creates the note below
       the price breakdown.
    */

    let note =
        document.getElementById(
            "checkoutCommonNote"
        );


    if (!note) {

        note =
            document.createElement(
                "div"
            );


        note.id =
            "checkoutCommonNote";


        note.className =
            "checkout-common-note";


        /*
           Put below the price breakdown.
        */

        const finalElement =
            document.getElementById(
                "finalAmount"
            );


        if (
            finalElement
        ) {

            const priceSection =
                finalElement.closest(
                    ".section"
                );


            if (
                priceSection
            ) {

                priceSection.appendChild(
                    note
                );

            }

            else {

                document.body.appendChild(
                    note
                );

            }

        }

        else {

            document.body.appendChild(
                note
            );

        }

    }


    note.innerHTML = `

        <div class="checkout-note-title">

            Note

        </div>

        <div class="checkout-note-text">

            ${escapeHtml(
                CHECKOUT_NOTE
            )}

        </div>

    `;

}


/* ======================================================
   GENERATE ORDER NUMBER
====================================================== */

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


    try {

        const next =
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
                                snapshot.data().current ||
                                1000
                            );

                    }


                    const nextNumber =
                        current + 1;


                    transaction.set(
                        counterRef,
                        {

                            current:
                                nextNumber

                        },
                        {

                            merge:
                                true

                        }
                    );


                    return nextNumber;

                }
            );


        return `${prefix}-${next}`;

    }

    catch (error) {

        console.error(
            "ORDER COUNTER ERROR:",
            error
        );


        throw new Error(
            "Unable to generate order number. Please try again."
        );

    }

}


/* ======================================================
   FORM VALIDATION
====================================================== */

function validateForm() {

    const name =
        document
            .getElementById(
                "custName"
            )
            ?.value
            .trim();


    const phone =
        document
            .getElementById(
                "custPhone"
            )
            ?.value
            .trim();


    const address =
        document
            .getElementById(
                "custAddress"
            )
            ?.value
            .trim();


    const pincode =
        document
            .getElementById(
                "custPincode"
            )
            ?.value
            .trim();


    if (
        !name ||
        !phone ||
        !address ||
        !pincode
    ) {

        alert(
            "Please fill all fields"
        );


        return null;

    }


    if (
        !/^[6-9]\d{9}$/.test(
            phone
        )
    ) {

        alert(
            "Please enter a valid 10-digit mobile number"
        );


        return null;

    }


    if (
        !/^\d{6}$/.test(
            pincode
        )
    ) {

        alert(
            "Please enter a valid 6-digit pincode"
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


/* ======================================================
   SAVE ORDER
====================================================== */

async function saveOrder(
    paymentMode,
    paymentStatus,
    paymentId = null
) {

    const customer =
        validateForm();


    if (!customer) {

        return null;

    }


    /*
       Generate order number.
    */

    orderNumber =
        await generateOrderNumber();


    /*
       Final total.
    */

    const orderTotal =
        Number(
            finalAmount
        );


    /*
       Actual paid amount.
    */

    let paidAmount = 0;


    if (
        paymentStatus ===
        "paid"
    ) {

        if (
            paymentMode ===
            "advance"
        ) {

            paidAmount =
                getAdvancePaymentAmount();

        }

        else {

            paidAmount =
                orderTotal;

        }

    }


    /*
       Balance.
    */

    const balanceAmount =
        Math.max(
            orderTotal -
            paidAmount,
            0
        );


    /*
       Free shipping.
    */

    const freeShipping =
        shippingAmount === 0 &&
        originalShipping > 0;


    /*
       Save all order items.
    */

    const items =
        orderItems.map(
            item => {

                const product =
                    item.product ||
                    {};


                return {

                    productId:
                        product.id ||
                        null,


                    productName:
                        product.name ||
                        "",


                    productImage:
                        product.images?.[0] ||
                        "",


                    quantity:
                        Number(
                            item.quantity ||
                            1
                        ),


                    unitPrice:
                        Number(
                            item.calculatedUnitPrice ||
                            0
                        ),


                    subtotal:
                        Number(
                            item.calculatedSubtotal ||
                            0
                        ),


                    shipping:
                        Number(
                            item.originalShipping ||
                            0
                        ),


                    variants: {

                        color:
                            item.color ||
                            null,


                        size:
                            item.size ||
                            null

                    },


                    customOptions:
                        Object
                            .keys(
                                item.options ||
                                {}
                            )
                            .map(
                                index => {

                                    const option =
                                        product
                                            .customOptions
                                            ?.[index];


                                    return {

                                        label:
                                            option?.label ||
                                            "",


                                        value:
                                            item
                                                .optionValues
                                                ?.[index] ||
                                            "Selected",


                                        image:
                                            item
                                                .imageLinks
                                                ?.[index] ||
                                            null

                                    };

                                }
                            )

                };

            }
        );


    /*
       Keep old single-product fields
       for compatibility with existing
       admin/order pages.
    */

    const firstItem =
        items[0] ||
        {};


    const firstProduct =
        orderItems[0]?.product ||
        {};


    const paymentSettings =
        firstProduct
            ?.paymentSettings
            ?.[paymentMode] ||
        {};


    const advanceSettings =
        firstProduct
            ?.paymentSettings
            ?.advance ||
        {};


    const order = {

        orderNumber:


            orderNumber,


        /*
           Multiple products
        */

        items,


        /*
           Old compatibility fields
        */

        productId:
            firstProduct.id ||
            null,


        productName:
            firstProduct.name ||
            "",


        productImage:
            firstProduct.images?.[0] ||
            "",


        categoryId:
            firstProduct.categoryId ||
            null,


        tags:
            firstProduct.tags ||
            [],


        variants:
            firstItem.variants ||
            {

                color:
                    null,

                size:
                    null

            },


        customOptions:
            firstItem.customOptions ||
            [],


        /*
           PRICING
        */

        pricing: {

            subTotal:
                Number(
                    subTotal
                ),


            originalShipping:
                Number(
                    originalShipping
                ),


            shipping:
                Number(
                    shippingAmount
                ),


            freeShipping:
                Boolean(
                    freeShipping
                ),


            paymentDiscount:
                Number(
                    paymentDiscount
                ),


            couponDiscount:
                Number(
                    couponDiscount
                ),


            discount:
                Number(
                    totalDiscount
                ),


            finalAmount:
                Number(
                    orderTotal
                ),


            totalAmount:
                Number(
                    orderTotal
                )

        },


        /*
           COUPON
        */

        coupon: appliedCoupon
            ?

            {

                id:
                    appliedCoupon.id ||
                    null,


                code:
                    appliedCoupon.code ||
                    "",


                type:
                    appliedCoupon.type ||
                    "",


                value:
                    Number(
                        appliedCoupon.value ||
                        0
                    ),


                freeShipping:
                    Boolean(
                        appliedCoupon.freeShipping
                    ),


                stackRule:
                    appliedCoupon.stackRule ||
                    "stack"

            }

            :

            null,


        customer,


        payment: {

            mode:
                paymentMode,


            status:
                paymentStatus,


            paymentId:
                paymentId,


            paidAmount:
                Number(
                    paidAmount
                ),


            balanceAmount:
                Number(
                    balanceAmount
                ),


            paymentDiscountType:
                paymentSettings
                    ?.discountType ||
                null,


            paymentDiscountValue:
                Number(
                    paymentSettings
                        ?.discountValue ||
                    0
                ),


            advanceType:
                paymentMode ===
                "advance"
                    ?
                    (
                        advanceSettings.type ||
                        null
                    )
                    :
                    null,


            advanceValue:
                paymentMode ===
                "advance"
                    ?
                    Number(
                        advanceSettings.value ||
                        0
                    )
                    :
                    0

        },


        /*
           COMMON CHECKOUT NOTE
        */

        checkoutNote:
            CHECKOUT_NOTE,


        orderStatus:
            "pending",


        source:
            "frontend",


        companyName:
            siteSettings.companyName ||
            "",


        orderPrefix:
            siteSettings.orderPrefix ||
            "IG",


        /*
           Keep first product link
           for compatibility.
        */

        productLink:
            window.location.origin +
            "/product?id=" +
            encodeURIComponent(
                firstProduct.id ||
                ""
            ),


        createdAt:
            Date.now()

    };


    /*
       SAVE FIRESTORE
    */

    await addDoc(
        collection(
            db,
            "orders"
        ),
        order
    );


    return order;

}


/* ======================================================
   ORDER SUCCESS
====================================================== */

function showOrderSuccess(
    order
) {

    let message =
        "Thank you! Your order has been received successfully.";


    if (
        order?.payment?.mode ===
        "advance"
    ) {

        message =
            `Your advance payment was received successfully. Balance ₹${formatMoney(
                order.payment.balanceAmount
            )} will be payable on COD.`;

    }


    showOrderPopup(
        true,
        "Order Placed Successfully!",
        message,
        order?.orderNumber ||
        ""
    );

}


/* ======================================================
   ORDER FAILED
====================================================== */

function showOrderFailed(
    message
) {

    showOrderPopup(
        false,
        "Order Failed",
        message ||
        "Something went wrong. Please try again."
    );

}


/* ======================================================
   ORDER POPUP
====================================================== */

function showOrderPopup(
    success,
    title,
    message,
    orderNo = ""
) {

    const overlay =
        document.getElementById(
            "orderResultPopup"
        );


    const popup =
        overlay?.querySelector(
            ".order-popup"
        );


    const icon =
        document.getElementById(
            "orderPopupIcon"
        );


    const titleElement =
        document.getElementById(
            "orderPopupTitle"
        );


    const messageElement =
        document.getElementById(
            "orderPopupMessage"
        );


    const orderNoElement =
        document.getElementById(
            "orderPopupOrderNo"
        );


    const button =
        document.getElementById(
            "orderPopupButton"
        );


    if (!overlay) {

        alert(
            title +
            "\n\n" +
            message +
            (
                orderNo
                    ?
                    `\n\nOrder No: ${orderNo}`
                    :
                    ""
            )
        );


        if (success) {

            setTimeout(
                () => {

                    window.location.href =
                        "shop";

                },
                1000
            );

        }


        return;

    }


    if (popup) {

        popup.classList.toggle(
            "failed",
            !success
        );

    }


    if (icon) {

        icon.innerText =
            success
                ?
                "✓"
                :
                "×";

    }


    if (titleElement) {

        titleElement.innerText =
            title;

    }


    if (messageElement) {

        messageElement.innerText =
            message;

    }


    if (orderNoElement) {

        orderNoElement.innerText =
            orderNo
                ?
                `Order No: ${orderNo}`
                :
                "";

    }


    if (button) {

        button.innerText =
            success
                ?
                "Continue Shopping"
                :
                "Try Again";


        button.onclick =
            success

                ?

                function() {

                    window.location.href =
                        "shop";

                }

                :

                function() {

                    closeOrderPopup();

                };

    }


    overlay.classList.add(
        "show"
    );

}


/* ======================================================
   CLOSE POPUP
====================================================== */

window.closeOrderPopup =
function() {

    document
        .getElementById(
            "orderResultPopup"
        )
        ?.classList.remove(
            "show"
        );

};


/* ======================================================
   PLACE ORDER
====================================================== */

window.placeOrder =
async function() {

    if (
        orderSubmitting
    ) {

        return;

    }


    try {

        const customer =
            validateForm();


        if (!customer) {

            return;

        }


        orderSubmitting =
            true;


        /*
           COD
        */

        if (
            selectedPaymentMode ===
            "cod"
        ) {

            const order =
                await saveOrder(
                    "cod",
                    "pending"
                );


            if (!order) {

                orderSubmitting =
                    false;

                return;

            }


            sendWhatsApp(
                order
            );


            orderSubmitting =
                false;


            showOrderSuccess(
                order
            );


            return;

        }


        /*
           ADVANCE
        */

        if (
            selectedPaymentMode ===
            "advance"
        ) {

            await startPayment(
                customer,
                "advance"
            );


            return;

        }


        /*
           ONLINE
        */

        await startPayment(
            customer,
            "online"
        );

    }

    catch (error) {

        console.error(
            "Place order error:",
            error
        );


        orderSubmitting =
            false;


        showOrderFailed(
            error.message ||
            "Unable to place order."
        );

    }

};


/* ======================================================
   WHATSAPP
====================================================== */

function sendWhatsApp(
    order
) {

    const whatsappNumber =
        String(
            siteSettings.whatsapp ||
            ""
        )
            .replace(
                /\D/g,
                ""
            );


    if (!whatsappNumber) {

        console.warn(
            "WhatsApp number is not configured."
        );


        return false;

    }


    const companyName =
        siteSettings.companyName ||
        "Store";


    let message =
        `🛍 *New Order — ${companyName}*\n\n`;


    message +=
        `🧾 *Order No:* ${order.orderNumber}\n\n`;


    message +=
        `👤 *Name:* ${order.customer.name}\n`;


    message +=
        `📞 *Phone:* ${order.customer.phone}\n`;


    message +=
        `🏠 *Address:* ${order.customer.address}\n`;


    message +=
        `📮 *Pincode:* ${order.customer.pincode}\n\n`;


    /*
       PRODUCTS
    */

    message +=
        `📦 *Products:*\n`;


    order.items.forEach(
        (item, index) => {

            message +=
                `\n${index + 1}. ${item.productName}\n`;


            message +=
                `   Qty: ${item.quantity}\n`;


            message +=
                `   Price: ₹${formatMoney(
                    item.unitPrice
                )}\n`;


            if (
                item.variants?.color
            ) {

                message +=
                    `   Color: ${item.variants.color.name}\n`;

            }


            if (
                item.variants?.size
            ) {

                message +=
                    `   Size: ${item.variants.size.name}\n`;

            }


            if (
                item.customOptions?.length
            ) {

                item.customOptions.forEach(
                    option => {

                        message +=
                            `   ${option.label}: ${option.value}\n`;

                    }
                );

            }

        }
    );


    /*
       PRICE
    */

    message +=
        `\n💰 *Subtotal:* ₹${formatMoney(
            order.pricing.subTotal
        )}\n`;


    /*
       SHIPPING
    */

    if (
        order.pricing.freeShipping
    ) {

        message +=
            `🚚 *Shipping:* FREE\n`;

    }

    else {

        message +=
            `🚚 *Shipping:* ₹${formatMoney(
                order.pricing.shipping
            )}\n`;

    }


    /*
       PAYMENT DISCOUNT
    */

    if (
        order.pricing.paymentDiscount >
        0
    ) {

        message +=
            `💳 *Payment Discount:* ₹${formatMoney(
                order.pricing.paymentDiscount
            )}\n`;

    }


    /*
       COUPON
    */

    if (
        order.coupon?.code
    ) {

        message +=
            `🏷 *Coupon:* ${order.coupon.code}\n`;

    }


    if (
        order.pricing.couponDiscount >
        0
    ) {

        message +=
            `🏷 *Coupon Discount:* ₹${formatMoney(
                order.pricing.couponDiscount
            )}\n`;

    }


    /*
       TOTAL DISCOUNT
    */

    if (
        order.pricing.discount >
        0
    ) {

        message +=
            `🎁 *Total Discount:* ₹${formatMoney(
                order.pricing.discount
            )}\n`;

    }


    /*
       FINAL
    */

    message +=
        `\n💵 *Order Total:* ₹${formatMoney(
            order.pricing.finalAmount
        )}\n`;


    /*
       ADVANCE
    */

    if (
        order.payment.mode ===
        "advance"
    ) {

        message +=
            `\n💳 *Advance Paid:* ₹${formatMoney(
                order.payment.paidAmount
            )}\n`;


        message +=
            `💰 *Balance on COD:* ₹${formatMoney(
                order.payment.balanceAmount
            )}\n`;

    }


    /*
       PAYMENT
    */

    message +=
        `💳 *Payment:* ${String(
            order.payment.mode
        ).toUpperCase()}\n`;


    /*
       CHECKOUT NOTE
    */

    if (
        order.checkoutNote
    ) {

        message +=
            `\n📝 *Note:* ${order.checkoutNote}\n`;

    }


    /*
       PRODUCT LINK
    */

    if (
        order.productId
    ) {

        message +=
            `\n🔗 Product Link:\n`;


        message +=
            `${window.location.origin}/product?id=${encodeURIComponent(
                order.productId
            )}`;

    }


    const whatsappUrl =
        `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
            message
        )}`;


    try {

        window.open(
            whatsappUrl,
            "_blank"
        );


        return true;

    }

    catch (error) {

        console.error(
            "WhatsApp open error:",
            error
        );


        return false;

    }

}


/* ======================================================
   RAZORPAY SCRIPT
====================================================== */

function loadRazorpayScript() {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            if (
                typeof Razorpay !==
                "undefined"
            ) {

                resolve();

                return;

            }


            const existing =
                document.querySelector(
                    'script[src*="checkout.razorpay.com"]'
                );


            if (existing) {

                existing.addEventListener(
                    "load",
                    resolve,
                    {
                        once:
                            true
                    }
                );


                existing.addEventListener(
                    "error",
                    reject,
                    {
                        once:
                            true
                    }
                );


                return;

            }


            const script =
                document.createElement(
                    "script"
                );


            script.src =
                "https://checkout.razorpay.com/v1/checkout.js";


            script.onload =
                resolve;


            script.onerror =
                () =>
                    reject(
                        new Error(
                            "Unable to load Razorpay."
                        )
                    );


            document.head.appendChild(
                script
            );

        }
    );

}


/* ======================================================
   START RAZORPAY PAYMENT
====================================================== */

async function startPayment(
    customer,
    paymentMode = "online"
) {

    try {

        const razorpayKey =
            String(
                siteSettings.razorpayKeyId ||
                ""
            )
                .trim();


        if (!razorpayKey) {

            showOrderFailed(
                "Razorpay Key ID is not configured in Site Settings."
            );


            orderSubmitting =
                false;


            return;

        }


        const paymentAmount =
            paymentMode ===
            "advance"

                ?

                getAdvancePaymentAmount()

                :

                finalAmount;


        if (
            paymentAmount <= 0
        ) {

            showOrderFailed(
                "Invalid payment amount."
            );


            orderSubmitting =
                false;


            return;

        }


        await loadRazorpayScript();


        const companyName =
            siteSettings.companyName ||
            "Store";


        const options = {

            key:
                razorpayKey,


            amount:
                Math.round(
                    paymentAmount *
                    100
                ),


            currency:
                "INR",


            name:
                companyName,


            description:
                paymentMode ===
                "advance"

                    ?

                    `Advance payment for order from ${companyName}`

                    :

                    `Order from ${companyName}`,


            handler:
                async function(
                    response
                ) {

                    try {

                        const order =
                            await saveOrder(
                                paymentMode,
                                "paid",
                                response
                                    .razorpay_payment_id
                            );


                        if (!order) {

                            showOrderFailed(
                                "Payment was successful, but the order could not be saved."
                            );


                            return;

                        }


                        sendWhatsApp(
                            order
                        );


                        showOrderSuccess(
                            order
                        );

                    }

                    catch (error) {

                        console.error(
                            "Payment order save error:",
                            error
                        );


                        showOrderFailed(
                            error.message ||
                            "Payment was successful, but order saving failed."
                        );

                    }

                    finally {

                        orderSubmitting =
                            false;

                    }

                },


            prefill: {

                name:
                    customer.name,

                contact:
                    customer.phone

            },


            notes: {

                company:
                    companyName,


                paymentMode:
                    paymentMode,


                orderTotal:
                    String(
                        finalAmount
                    ),


                shipping:
                    String(
                        shippingAmount
                    ),


                coupon:
                    String(
                        appliedCoupon?.code ||
                        ""
                    ),


                orderPrefix:
                    String(
                        siteSettings.orderPrefix ||
                        "IG"
                    )

            },


            theme: {

                color:
                    "#00f5ff"

            }

        };


        const rzp =
            new Razorpay(
                options
            );


        rzp.on(
            "payment.failed",
            function(response) {

                console.error(
                    "Razorpay payment failed:",
                    response
                );


                orderSubmitting =
                    false;


                const reason =
                    response
                        ?.error
                        ?.description ||
                    "Payment could not be completed. Please try again.";


                showOrderFailed(
                    reason
                );

            }
        );


        rzp.on(
            "modal.ondismiss",
            function() {

                orderSubmitting =
                    false;

            }
        );


        rzp.open();

    }

    catch (error) {

        console.error(
            "Razorpay error:",
            error
        );


        orderSubmitting =
            false;


        showOrderFailed(
            error.message ||
            "Unable to start payment."
        );

    }

}


/* ======================================================
   FORMAT MONEY
====================================================== */

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


/* ======================================================
   ESCAPE HTML
====================================================== */

function escapeHtml(
    value
) {

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


/* ======================================================
   ESCAPE ATTRIBUTE
====================================================== */

function escapeAttribute(
    value
) {

    return escapeHtml(
        value
    );

}


/* ======================================================
   START
====================================================== */

loadOrder();