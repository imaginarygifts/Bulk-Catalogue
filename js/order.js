/* ======================================================
   ORDER PAGE
   SITE SETTINGS + PAYMENT DISCOUNTS + ADVANCE PAYMENT
   + SINGLE ORDER COUNTER
====================================================== */

import { db } from "./firebase.js";

import {
    collection,
    addDoc,
    doc,
    getDoc,
    setDoc,
    updateDoc,
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

let subTotal = 0;

/* Product payment-mode discount */
let paymentDiscount = 0;

/* Coupon discount */
let discount = 0;

/* Final order total */
let finalAmount = 0;

let appliedCoupon = null;

let selectedPaymentMode = "online";

let availableCoupons = [];

let orderNumber = null;

let orderSubmitting = false;


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

        console.log(
            "Order page site settings:",
            siteSettings
        );

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


    /* PAGE TITLE */

    document.title =
        siteSettings.websiteTitle ||
        companyName;


    /* COMPANY NAME */

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


    /* LOGO */

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


    /* FAVICON */

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


    /* META DESCRIPTION */

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
   LOAD ORDER DATA
====================================================== */

async function loadOrder() {

    try {

        /* SETTINGS FIRST */

        await loadSiteSettings();


        /* CHECKOUT DATA */

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


        if (
            !orderData ||
            !orderData.product
        ) {

            alert(
                "Invalid checkout data"
            );

            location.href =
                "website/shop.html";

            return;

        }


        /*
           finalPrice from checkout already
           contains selected variant/custom option
           pricing.
        */

        subTotal =
            Number(
                orderData.finalPrice ||
                0
            );


        finalAmount =
            subTotal;


        renderSummary();

        setupPaymentModes();

        await loadCoupons();

        recalcPrice();

        updateAdvancePaymentInfo();


        console.log(
            "Order data loaded:",
            orderData
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
   GENERATE ORDER NUMBER
   SINGLE COUNTER FOR ALL PAYMENT MODES
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


    /*
       IMPORTANT:

       We use a Firestore transaction.

       COD
       ONLINE
       ADVANCE

       ALL use this exact same counter.

       There is intentionally NO timestamp
       fallback. A fallback creates different
       order-number formats.
    */

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


        /*
           DO NOT create timestamp IDs.

           If this happens, Firestore rules are
           probably blocking the customer from
           reading/updating counters/orders.
        */

        throw new Error(
            "Unable to generate order number. Please try again."
        );

    }

}


/* ======================================================
   RENDER SUMMARY
====================================================== */

function renderSummary() {

    const box =
        document.getElementById(
            "orderSummary"
        );


    if (!box) {

        return;

    }


    const product =
        orderData.product;


    const productPrice =
        Number(
            product.salePrice ||
            product.basePrice ||
            0
        );


    let html = `

        <div>

            <b>
                ${escapeHtml(
                    product.name ||
                    "Product"
                )}
            </b>

        </div>

        <div>

            Sale Price:
            ₹${productPrice}

        </div>

    `;


    /* COLOR */

    if (
        orderData.color
    ) {

        html += `

            <div>

                Color:
                ${escapeHtml(
                    orderData.color.name ||
                    ""
                )}

            </div>

        `;

    }


    /* SIZE */

    if (
        orderData.size
    ) {

        html += `

            <div>

                Size:
                ${escapeHtml(
                    orderData.size.name ||
                    ""
                )}

            </div>

        `;

    }


    /* OPTIONS */

    if (
        orderData.options &&
        Object.keys(
            orderData.options
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
                orderData.options
            )
            .forEach(
                index => {

                    const option =
                        product
                            .customOptions?.[index];


                    const label =
                        option?.label ||
                        "Option";


                    const value =
                        orderData
                            .optionValues?.[index] ||
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


    box.innerHTML =
        html;

}


/* ======================================================
   PAYMENT MODES
====================================================== */

function setupPaymentModes() {

    const ps =
        orderData
            ?.product
            ?.paymentSettings ||
        {};


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


    /* ONLINE */

    if (
        !ps.online?.enabled &&
        onlineLabel
    ) {

        onlineLabel.style.display =
            "none";

    }


    /* COD */

    if (
        !ps.cod?.enabled &&
        codLabel
    ) {

        codLabel.style.display =
            "none";

    }


    /* ADVANCE */

    if (
        !ps.advance?.enabled &&
        advanceLabel
    ) {

        advanceLabel.style.display =
            "none";

    }


    /* DEFAULT PAYMENT MODE */

    if (
        ps.online?.enabled
    ) {

        selectedPaymentMode =
            "online";

    }

    else if (
        ps.cod?.enabled
    ) {

        selectedPaymentMode =
            "cod";

    }

    else if (
        ps.advance?.enabled
    ) {

        selectedPaymentMode =
            "advance";

    }


    const firstRadio =
        document.querySelector(
            `input[value="${selectedPaymentMode}"]`
        );


    if (firstRadio) {

        firstRadio.checked =
            true;

    }


    /* PAYMENT CHANGE */

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
                           Coupon is reset because
                           allowed payment modes may
                           change.
                        */

                        removeCoupon();


                        await loadCoupons();


                        recalcPrice();


                        updateAdvancePaymentInfo();

                    }
                );

            }
        );


    /*
       Calculate initial payment discount
       immediately.
    */

    recalcPrice();

}


/* ======================================================
   PAYMENT MODE DISCOUNT
====================================================== */

function getPaymentModeDiscount() {

    const paymentSettings =
        orderData
            ?.product
            ?.paymentSettings ||
        {};


    const settings =
        paymentSettings[
            selectedPaymentMode
        ] ||
        {};


    if (
        !settings.enabled
    ) {

        return 0;

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
        !value ||
        value <= 0
    ) {

        return 0;

    }


    let result =
        0;


    /* PERCENT */

    if (
        type === "percent" ||
        type === "%" ||
        type === "percentage"
    ) {

        result =
            Math.round(
                subTotal *
                (
                    value /
                    100
                )
            );

    }


    /* FLAT */

    else if (
        type === "flat" ||
        type === "amount" ||
        type === "fixed"
    ) {

        result =
            value;

    }


    /*
       Safety
    */

    if (
        result < 0
    ) {

        result =
            0;

    }


    if (
        result > subTotal
    ) {

        result =
            subTotal;

    }


    return Math.round(
        result
    );

}


/* ======================================================
   PRICE
====================================================== */

function recalcPrice() {

    /*
       PRODUCT PAYMENT DISCOUNT
    */

    paymentDiscount =
        getPaymentModeDiscount();


    /*
       TOTAL DISCOUNT

       Payment discount
       +
       Coupon discount
    */

    const totalDiscount =
        Math.min(
            subTotal,
            Number(
                paymentDiscount
            ) +
            Number(
                discount
            )
        );


    finalAmount =
        Number(
            subTotal
        ) -
        totalDiscount;


    if (
        finalAmount < 0
    ) {

        finalAmount =
            0;

    }


    const subTotalElement =
        document.getElementById(
            "subTotal"
        );


    const discountElement =
        document.getElementById(
            "discountAmount"
        );


    const finalElement =
        document.getElementById(
            "finalAmount"
        );


    if (subTotalElement) {

        subTotalElement.innerText =
            "₹" +
            subTotal;

    }


    if (discountElement) {

        discountElement.innerText =
            "-₹" +
            totalDiscount;

    }


    if (finalElement) {

        finalElement.innerText =
            "₹" +
            finalAmount;

    }


    /*
       Optional dedicated payment discount
       element if you add it to HTML.
    */

    const paymentDiscountElement =
        document.getElementById(
            "paymentDiscountAmount"
        );


    if (paymentDiscountElement) {

        paymentDiscountElement.innerText =
            "-₹" +
            paymentDiscount;

    }


    /*
       Optional coupon discount element.
    */

    const couponDiscountElement =
        document.getElementById(
            "couponDiscountAmount"
        );


    if (couponDiscountElement) {

        couponDiscountElement.innerText =
            "-₹" +
            discount;

    }


    updateAdvancePaymentInfo();

}


/* ======================================================
   ADVANCE PAYMENT AMOUNT
====================================================== */

function getAdvancePaymentAmount() {

    const advanceSettings =
        orderData
            ?.product
            ?.paymentSettings
            ?.advance ||
        {};


    if (
        !advanceSettings.enabled
    ) {

        return finalAmount;

    }


    const type =
        String(
            advanceSettings.type ||
            "percent"
        )
            .toLowerCase()
            .trim();


    const value =
        Number(
            advanceSettings.value ||
            0
        );


    let advanceAmount =
        0;


    /* FLAT ADVANCE */

    if (
        type === "flat" ||
        type === "amount" ||
        type === "fixed"
    ) {

        advanceAmount =
            value;

    }


    /* PERCENT ADVANCE */

    else {

        advanceAmount =
            finalAmount *
            (
                value /
                100
            );

    }


    /*
       Safety limits
    */

    if (
        advanceAmount < 0
    ) {

        advanceAmount =
            0;

    }


    if (
        advanceAmount >
        finalAmount
    ) {

        advanceAmount =
            finalAmount;

    }


    /*
       Keep paise/decimal amounts.
       Razorpay supports smallest currency
       units, so ₹427.50 becomes 42750 paise.
    */

    return Math.round(
        advanceAmount *
        100
    ) / 100;

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
            Number(
                finalAmount
            ) -
            Number(
                advanceAmount
            ),
            0
        );


    box.innerHTML = `

        <span>

            ℹ️

            Pay Advance

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
   COUPONS
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

                const c =
                    d.data();


                if (
                    !c.active
                ) {

                    return;

                }


                const expiry =
                    c.expiry?.toDate
                        ?
                        c.expiry.toDate()
                        :
                        null;


                if (
                    expiry &&
                    expiry < now
                ) {

                    return;

                }


                if (
                    c.minOrder &&
                    subTotal <
                    c.minOrder
                ) {

                    return;

                }


                if (
                    c.allowedModes &&
                    !c.allowedModes.includes(
                        selectedPaymentMode
                    )
                ) {

                    return;

                }


                if (
                    c.scope === "product" &&
                    c.productIds?.length
                ) {

                    if (
                        !c.productIds.includes(
                            orderData.product.id
                        )
                    ) {

                        return;

                    }

                }


                availableCoupons.push({

                    id:
                        d.id,

                    ...c

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


            if (
                appliedCoupon &&
                appliedCoupon.id ===
                coupon.id
            ) {

                div.classList.add(
                    "applied"
                );

            }


            const valueText =
                coupon.type === "percent"

                    ?

                    `${coupon.value}% OFF`

                    :

                    `₹${coupon.value} OFF`;


            const isApplied =
                appliedCoupon &&
                appliedCoupon.id ===
                coupon.id;


            div.innerHTML = `

                <div>

                    <b>
                        ${escapeHtml(
                            coupon.code
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


    if (
        coupon.type === "percent"
    ) {

        discount =
            Math.round(
                subTotal *
                (
                    coupon.value /
                    100
                )
            );

    }

    else {

        discount =
            Number(
                coupon.value ||
                0
            );

    }


    if (
        discount > subTotal
    ) {

        discount =
            subTotal;

    }


    appliedCoupon =
        coupon;


    renderCoupons();

    recalcPrice();

    updateAdvancePaymentInfo();

};


/* ======================================================
   REMOVE COUPON
====================================================== */

window.removeCoupon =
function() {

    appliedCoupon =
        null;


    discount =
        0;


    renderCoupons();

    recalcPrice();

    updateAdvancePaymentInfo();

};


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
       Generate ONE order number.

       This is called exactly once for
       each successful order.
    */

    orderNumber =
        await generateOrderNumber();


    /*
       FINAL ORDER TOTAL
    */

    const orderTotal =
        Number(
            finalAmount
        );


    /*
       ACTUAL AMOUNT PAID
    */

    let paidAmount =
        0;


    if (
        paymentStatus === "paid"
    ) {

        if (
            paymentMode === "advance"
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
       BALANCE
    */

    const balanceAmount =
        Math.max(
            orderTotal -
            paidAmount,
            0
        );


    /*
       ADVANCE SETTINGS
    */

    const advanceSettings =
        orderData
            ?.product
            ?.paymentSettings
            ?.advance ||
        {};


    /*
       PAYMENT MODE DISCOUNT SETTINGS
    */

    const paymentSettings =
        orderData
            ?.product
            ?.paymentSettings
            ?.[paymentMode] ||
        {};


    const order = {

        orderNumber:


            orderNumber,


        productId:
            orderData.product.id ||
            null,


        productName:
            orderData.product.name ||
            "",


        productImage:
            orderData.product.images?.[0] ||
            "",


        categoryId:
            orderData.product.categoryId ||
            null,


        tags:
            orderData.product.tags ||
            [],


        variants: {

            color:
                orderData.color ||
                null,

            size:
                orderData.size ||
                null

        },


        customOptions:

            Object
                .keys(
                    orderData.options ||
                    {}
                )
                .map(
                    i => ({

                        label:
                            orderData
                                .product
                                .customOptions?.[i]
                                ?.label ||
                            "",


                        value:
                            orderData
                                .optionValues?.[i] ||
                            "Selected",


                        image:
                            orderData
                                .imageLinks?.[i] ||
                            null

                    })
                ),


        pricing: {

            subTotal:
                Number(
                    subTotal
                ),


            /*
               Product payment discount
            */

            paymentDiscount:
                Number(
                    paymentDiscount
                ),


            /*
               Coupon discount
            */

            couponDiscount:
                Number(
                    discount
                ),


            /*
               Combined discount
            */

            discount:
                Number(
                    Math.min(
                        subTotal,
                        paymentDiscount +
                        discount
                    )
                ),


            finalAmount:
                orderTotal,


            totalAmount:
                orderTotal

        },


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
                paymentMode === "advance"
                    ?
                    (
                        advanceSettings.type ||
                        null
                    )
                    :
                    null,


            advanceValue:
                paymentMode === "advance"
                    ?
                    Number(
                        advanceSettings.value ||
                        0
                    )
                    :
                    0

        },


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


        productLink:
            window.location.origin +
            "/product?id=" +
            encodeURIComponent(
                orderData.product.id
            ),


        createdAt:
            Date.now()

    };


    /*
       SAVE FIRESTORE ORDER
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
   ORDER SUCCESS POPUP
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
   ORDER FAILED POPUP
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
   ORDER RESULT POPUP
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


    /*
       If popup HTML is not present,
       use alert.
    */

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
   CLOSE ORDER POPUP
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


        /* ==============================================
           COD
        ============================================== */

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


        /* ==============================================
           ADVANCE
        ============================================== */

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


        /* ==============================================
           ONLINE
        ============================================== */

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
            "WhatsApp number is not configured in Site Settings."
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


    message +=
        `📦 *Product:* ${order.productName}\n`;


    /* COLOR */

    if (
        order.variants.color
    ) {

        message +=
            `🎨 Color: ${order.variants.color.name}\n`;

    }


    /* SIZE */

    if (
        order.variants.size
    ) {

        message +=
            `📏 Size: ${order.variants.size.name}\n`;

    }


    /* OPTIONS */

    if (
        order.customOptions.length
    ) {

        message +=
            `\n⚙ *Options:*\n`;


        order.customOptions.forEach(
            option => {

                message +=
                    `- ${option.label}: ${option.value}\n`;


                if (
                    option.image
                ) {

                    message +=
                        `  Image: ${option.image}\n`;

                }

            }
        );

    }


    /* PRICE */

    message +=
        `\n💰 *Subtotal:* ₹${formatMoney(
            order.pricing.subTotal
        )}\n`;


    if (
        order.pricing.paymentDiscount > 0
    ) {

        message +=
            `💳 *Payment Discount:* ₹${formatMoney(
                order.pricing.paymentDiscount
            )}\n`;

    }


    if (
        order.pricing.couponDiscount > 0
    ) {

        message +=
            `🏷 *Coupon Discount:* ₹${formatMoney(
                order.pricing.couponDiscount
            )}\n`;

    }


    if (
        order.pricing.discount > 0
    ) {

        message +=
            `🎁 *Total Discount:* ₹${formatMoney(
                order.pricing.discount
            )}\n`;

    }


    message +=
        `💵 *Order Total:* ₹${formatMoney(
            order.pricing.finalAmount
        )}\n`;


    /* ADVANCE */

    if (
        order.payment.mode ===
        "advance"
    ) {

        const paid =
            Number(
                order.payment.paidAmount ||
                0
            );


        const balance =
            Number(
                order.payment.balanceAmount ||
                0
            );


        message +=
            `\n💳 *Advance Paid:* ₹${formatMoney(
                paid
            )}\n`;


        message +=
            `💰 *Balance on COD:* ₹${formatMoney(
                balance
            )}\n`;

    }


    /* PAYMENT */

    message +=
        `💳 *Payment:* ${String(
            order.payment.mode
        ).toUpperCase()}\n`;


    /* PRODUCT LINK */

    message +=
        `\n🔗 Product Link:\n`;


    message +=
        `${window.location.origin}/product?id=${encodeURIComponent(
            order.productId
        )}`;


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
   RAZORPAY PAYMENT
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


        /* CHECK KEY */

        if (!razorpayKey) {

            showOrderFailed(
                "Razorpay Key ID is not configured in Site Settings."
            );

            orderSubmitting =
                false;

            return;

        }


        /*
           ONLINE
           = final order amount

           ADVANCE
           = configured advance amount
        */

        const paymentAmount =
            paymentMode === "advance"
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


        console.log(
            "Order total:",
            finalAmount
        );


        console.log(
            "Payment mode:",
            paymentMode
        );


        console.log(
            "Payment amount:",
            paymentAmount
        );


        await loadRazorpayScript();


        const companyName =
            siteSettings.companyName ||
            "Store";


        const options = {

            key:
                razorpayKey,


            /*
               Razorpay expects INR in paise.
            */

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
                paymentMode === "advance"

                    ?

                    `Advance payment for order from ${companyName}`

                    :

                    `Order from ${companyName}`,


            handler:
                async function(
                    response
                ) {

                    try {

                        /*
                           IMPORTANT:

                           Order number is generated
                           only after successful
                           payment.

                           This means failed payment
                           does not consume an order
                           number.
                        */

                        const order =
                            await saveOrder(
                                paymentMode,
                                "paid",
                                response
                                    .razorpay_payment_id
                            );


                        if (!order) {

                            showOrderFailed(
                                "Payment was successful, but the order could not be saved. Please contact us."
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

                product:
                    orderData.product.name,

                company:
                    companyName,

                paymentMode:
                    paymentMode,

                orderTotal:
                    String(
                        finalAmount
                    ),

                paymentAmount:
                    String(
                        paymentAmount
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


        /* PAYMENT FAILED */

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


        /* MODAL CLOSED */

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
            value || 0
        );


    /*
       Remove unnecessary .00

       1500
       427.5
       427.50
    */

    return Number.isInteger(
        number
    )

        ?

        number.toString()

        :

        number.toFixed(2);

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
