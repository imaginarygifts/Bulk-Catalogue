/* ======================================================
   ORDER PAGE
   SITE SETTINGS CONNECTED VERSION
====================================================== */

import { db } from "./firebase.js";

import {
    collection,
    addDoc,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    getDocs
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

let discount = 0;

let finalAmount = 0;

let appliedCoupon = null;

let selectedPaymentMode = "online";

let availableCoupons = [];

let orderNumber = null;


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


        if (
            snapshot.exists()
        ) {

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
                "";


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
                "";


            return;

        }


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


        alert(
            "Unable to load order."
        );

    }

}


/* ======================================================
   ORDER NUMBER
====================================================== */

async function generateOrderNumber() {

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


    try {

        const counterRef =
            doc(
                db,
                "counters",
                "orders"
            );


        const snap =
            await getDoc(
                counterRef
            );


        let next =
            1001;


        if (
            snap.exists()
        ) {

            next =
                Number(
                    snap.data().current ||
                    1000
                ) + 1;


            await updateDoc(
                counterRef,
                {
                    current:
                        next
                }
            );

        }

        else {

            await setDoc(
                counterRef,
                {
                    current:
                        next
                }
            );

        }


        return `${prefix}-${next}`;

    }

    catch (error) {

        /*
           Counter may be blocked for
           non-admin customers by Firestore rules.

           Use a unique fallback number so
           customer checkout does not completely fail.
        */

        console.warn(
            "Counter unavailable. Using fallback order number.",
            error
        );


        const timestamp =
            Date.now()
                .toString()
                .slice(-8);


        return `${prefix}-${timestamp}`;

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

            Base Price:
            ₹${Number(
                product.basePrice || 0
            )}

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
                    () => {

                        selectedPaymentMode =
                            radio.value;


                        removeCoupon();

                        loadCoupons();

                        recalcPrice();

                    }
                );

            }
        );

}


/* ======================================================
   PRICE
====================================================== */

function recalcPrice() {

    finalAmount =
        Number(
            subTotal
        ) -
        Number(
            discount
        );


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
            discount;

    }


    if (finalElement) {

        finalElement.innerText =
            "₹" +
            finalAmount;

    }

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


        availableCoupons = [];


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
                coupon.value || 0
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


    orderNumber =
        await generateOrderNumber();


    const order = {

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

            discount:
                Number(
                    discount
                ),

            finalAmount:
                Number(
                    finalAmount
                )

        },


        customer,


        payment: {

            mode:
                paymentMode,

            status:
                paymentStatus,

            paymentId:
                paymentId

        },


        orderStatus:
            "pending",


        source:
            "frontend",


        companyName:
            siteSettings.companyName ||
            "",


        productLink:
            window.location.origin +
            "/product?id=" +
            encodeURIComponent(
                orderData.product.id
            ),


        createdAt:
            Date.now()

    };


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
   PLACE ORDER
====================================================== */

window.placeOrder =
async function() {

    try {

        const customer =
            validateForm();


        if (!customer) {

            return;

        }


        /* COD */

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

                return;

            }


            sendWhatsApp(
                order
            );


            alert(
                "Order placed successfully"
            );


            return;

        }


        /* ADVANCE */

        if (
            selectedPaymentMode ===
            "advance"
        ) {

            startPayment(
                customer,
                "advance"
            );


            return;

        }


        /* ONLINE */

        startPayment(
            customer,
            "online"
        );

    }

    catch (error) {

        console.error(
            "Place order error:",
            error
        );


        alert(
            "Order failed: " +
            (
                error.message ||
                "Unknown error"
            )
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

        console.error(
            "WhatsApp number missing in Site Settings"
        );


        alert(
            "WhatsApp number is not configured in Site Settings."
        );


        return;

    }


    const companyName =
        siteSettings.companyName ||
        "";


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
        `\n💰 *Subtotal:* ₹${order.pricing.subTotal}\n`;


    if (
        order.pricing.discount > 0
    ) {

        message +=
            `🏷 *Discount:* ₹${order.pricing.discount}\n`;

    }


    message +=
        `💵 *Total:* ₹${order.pricing.finalAmount}\n`;


    message +=
        `💳 *Payment:* ${order.payment.mode}\n`;


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


    window.open(
        whatsappUrl,
        "_blank"
    );

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
                    resolve
                );


                existing.addEventListener(
                    "error",
                    reject
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
            ).trim();


        if (!razorpayKey) {

            alert(
                "Razorpay Key ID is not configured in Site Settings."
            );


            return;

        }


        if (
            finalAmount <= 0
        ) {

            alert(
                "Invalid order amount."
            );


            return;

        }


        await loadRazorpayScript();


        const companyName =
            siteSettings.companyName ||
            "";


        const options = {

            key:
                razorpayKey,


            amount:
                Math.round(
                    finalAmount * 100
                ),


            currency:
                "INR",


            name:
                companyName,


            description:
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

                            return;

                        }


                        sendWhatsApp(
                            order
                        );


                        alert(
                            "Payment successful"
                        );

                    }

                    catch (error) {

                        console.error(
                            "Payment order save error:",
                            error
                        );


                        alert(
                            "Payment was successful, but order saving failed. Please contact us."
                        );

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
                    companyName

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


                alert(
                    "Payment failed. Please try again."
                );

            }
        );


        rzp.open();

    }

    catch (error) {

        console.error(
            "Razorpay error:",
            error
        );


        alert(
            error.message ||
            "Unable to start payment."
        );

    }

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
