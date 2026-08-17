import {
    db,
    storage,
    messaging
} from "./firebase.js";


import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


import {
    ref,
    listAll,
    getMetadata,
    deleteObject,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";


import {
    getToken
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js";


/* ==================================================
   DOM
================================================== */

const statsBox =
    document.getElementById(
        "stats"
    );


const cleanupList =
    document.getElementById(
        "cleanupList"
    );


/* ==================================================
   STATE
================================================== */

let cleanupFiles = [];

let allSelected = false;


/* ==================================================
   TIMESTAMP NORMALIZER
================================================== */

function normalizeTimestamp(ts) {

    if (!ts) {

        return 0;

    }


    /* Firestore Timestamp */

    if (
        typeof ts.toMillis === "function"
    ) {

        return ts.toMillis();

    }


    /* JavaScript Date */

    if (
        ts instanceof Date
    ) {

        return ts.getTime();

    }


    /* Number */

    if (
        typeof ts === "number"
    ) {

        /*
            Seconds → milliseconds
        */

        if (
            ts < 1000000000000
        ) {

            return ts * 1000;

        }


        return ts;

    }


    /* String date */

    if (
        typeof ts === "string"
    ) {

        const parsed =
            Date.parse(ts);


        if (
            !isNaN(parsed)
        ) {

            return parsed;

        }

    }


    return 0;

}


/* ==================================================
   ORDER AMOUNT
================================================== */

function getOrderAmount(order) {

    const amount =
        order?.finalAmount ??
        order?.pricing?.finalAmount ??
        order?.price ??
        0;


    const number =
        Number(amount);


    return Number.isFinite(number)
        ? number
        : 0;

}


/* ==================================================
   PAID AMOUNT
================================================== */

function getPaidAmount(order) {

    const amount =
        getOrderAmount(
            order
        );


    const paid =
        Number(
            order?.payment?.paidAmount
        );


    if (
        Number.isFinite(paid)
    ) {

        return paid;

    }


    if (
        order?.payment?.status ===
        "paid"
    ) {

        return amount;

    }


    return 0;

}


/* ==================================================
   LOAD STATS
================================================== */

async function loadStats() {

    if (!statsBox) {

        console.error(
            "Dashboard stats element #stats not found."
        );

        return;

    }


    /*
        Show loading state immediately.
    */

    statsBox.innerHTML = `

        <div class="card">

            <b>...</b>

            <small>
                Loading Products
            </small>

        </div>


        <div class="card">

            <b>...</b>

            <small>
                Loading Categories
            </small>

        </div>


        <div class="card">

            <b>...</b>

            <small>
                Loading Orders
            </small>

        </div>

    `;


    /* ==================================================
       LOAD EACH COLLECTION SEPARATELY

       IMPORTANT:

       If orders fails because of Firestore
       permission, products and categories
       will still work.
    ================================================== */

    let productsSnap = null;

    let catsSnap = null;

    let ordersSnap = null;


    /* ==================================================
       PRODUCTS
    ================================================== */

    try {

        productsSnap =
            await getDocs(
                collection(
                    db,
                    "products"
                )
            );

    }

    catch (error) {

        console.error(
            "Products stats error:",
            error
        );

    }


    /* ==================================================
       CATEGORIES
    ================================================== */

    try {

        catsSnap =
            await getDocs(
                collection(
                    db,
                    "categories"
                )
            );

    }

    catch (error) {

        console.error(
            "Categories stats error:",
            error
        );

    }


    /* ==================================================
       ORDERS
    ================================================== */

    try {

        ordersSnap =
            await getDocs(
                collection(
                    db,
                    "orders"
                )
            );

    }

    catch (error) {

        console.error(
            "Orders stats error:",
            error
        );

    }


    /* ==================================================
       DEFAULT COUNTS
    ================================================== */

    const totalProducts =
        productsSnap
        ?
        productsSnap.size
        :
        0;


    const totalCategories =
        catsSnap
        ?
        catsSnap.size
        :
        0;


    let pendingOrders = 0;

    let todayOrders = 0;

    let todaySale = 0;

    let totalBalance = 0;


    /* ==================================================
       TODAY START
    ================================================== */

    const todayStart =
        new Date();


    todayStart.setHours(
        0,
        0,
        0,
        0
    );


    const todayTimestamp =
        todayStart.getTime();


    /* ==================================================
       PROCESS ORDERS
    ================================================== */

    if (ordersSnap) {

        ordersSnap.forEach(
            orderDoc => {

                const order =
                    orderDoc.data();


                /* ---------------------------------------
                   ORDER STATUS
                --------------------------------------- */

                if (
                    order.orderStatus ===
                    "pending"
                ) {

                    pendingOrders++;

                }


                /* ---------------------------------------
                   CREATED AT
                --------------------------------------- */

                const createdAt =
                    normalizeTimestamp(
                        order.createdAt
                    );


                /* ---------------------------------------
                   ORDER AMOUNT
                --------------------------------------- */

                const amount =
                    getOrderAmount(
                        order
                    );


                /* ---------------------------------------
                   TODAY
                --------------------------------------- */

                if (
                    createdAt >=
                    todayTimestamp
                ) {

                    todayOrders++;

                    todaySale +=
                        amount;

                }


                /* ---------------------------------------
                   BALANCE
                --------------------------------------- */

                const paid =
                    getPaidAmount(
                        order
                    );


                const balance =
                    Math.max(
                        amount -
                        paid,
                        0
                    );


                totalBalance +=
                    balance;

            }
        );

    }


    /* ==================================================
       FORMAT MONEY
    ================================================== */

    const todaySaleFormatted =
        formatCurrency(
            todaySale
        );


    const totalBalanceFormatted =
        formatCurrency(
            totalBalance
        );


    /* ==================================================
       RENDER STATS
    ================================================== */

    statsBox.innerHTML = `

        <!-- PRODUCTS -->

        <div
            class="card clickable"
            onclick="location.href='products.html'"
        >

            <b>
                ${totalProducts}
            </b>

            <small>
                Total Products
            </small>

        </div>


        <!-- CATEGORIES -->

        <div
            class="card clickable"
            onclick="location.href='products.html'"
        >

            <b>
                ${totalCategories}
            </b>

            <small>
                Total Categories
            </small>

        </div>


        <!-- PENDING ORDERS -->

        <div
            class="card clickable"
            onclick="location.href='orders.html?status=pending'"
        >

            <b>
                ${pendingOrders}
            </b>

            <small>
                Pending Orders
            </small>

        </div>


        <!-- TODAY ORDERS -->

        <div
            class="card clickable"
            onclick="location.href='orders.html?range=today'"
        >

            <b>
                ${todayOrders}
            </b>

            <small>
                Today Orders
            </small>

        </div>


        <!-- TODAY SALE -->

        <div
            class="card clickable"
            onclick="location.href='orders.html?range=today&paymentStatus=paid'"
        >

            <b>
                ₹${todaySaleFormatted}
            </b>

            <small>
                Today Sale
            </small>

        </div>


        <!-- TOTAL BALANCE -->

        <div
            class="card clickable"
            onclick="location.href='orders.html?balance=due'"
        >

            <b>
                ₹${totalBalanceFormatted}
            </b>

            <small>
                Total Balance
            </small>

        </div>

    `;


    /* ==================================================
       WARNING IF ORDERS FAILED
    ================================================== */

    if (!ordersSnap) {

        console.warn(
            "Orders could not be loaded. Product and category stats are still available."
        );

    }

}


/* ==================================================
   CURRENCY FORMAT
================================================== */

function formatCurrency(
    value
) {

    const number =
        Number(
            value
        ) || 0;


    return number.toLocaleString(
        "en-IN",
        {
            maximumFractionDigits: 2
        }
    );

}


/* ==================================================
   CUSTOM IMAGES
================================================== */

async function loadCustomImages() {

    if (!cleanupList) {

        return;

    }


    try {

        const folderRef =
            ref(
                storage,
                "custom-images/"
            );


        const result =
            await listAll(
                folderRef
            );


        cleanupFiles = [];


        for (
            const item
            of result.items
        ) {

            try {

                const metadata =
                    await getMetadata(
                        item
                    );


                const url =
                    await getDownloadURL(
                        item
                    );


                const created =
                    new Date(
                        metadata.timeCreated
                    ).getTime();


                const ageDays =
                    Math.floor(
                        (
                            Date.now() -
                            created
                        )
                        /
                        (
                            1000 *
                            60 *
                            60 *
                            24
                        )
                    );


                cleanupFiles.push({

                    ref:
                        item,

                    url,

                    ageDays,

                    name:
                        item.name

                });

            }

            catch (fileError) {

                console.error(
                    "Custom image error:",
                    fileError
                );

            }

        }


        renderCleanupList();

    }

    catch (error) {

        console.error(
            "Load images error:",
            error
        );

    }

}


/* ==================================================
   RENDER CLEANUP LIST
================================================== */

function renderCleanupList() {

    if (!cleanupList) {

        return;

    }


    cleanupList.innerHTML =
        "";


    if (
        !cleanupFiles.length
    ) {

        cleanupList.innerHTML = `

            <div class="cleanup-empty">

                No custom images found.

            </div>

        `;


        return;

    }


    cleanupFiles.forEach(
        file => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "cleanup-card";


            card.innerHTML = `

                <input

                    type="checkbox"

                    class="cleanup-check"

                    data-path="${escapeAttribute(
                        file.ref.fullPath
                    )}"

                >


                <img

                    src="${escapeAttribute(
                        file.url
                    )}"

                    alt="Custom image"

                    loading="lazy"

                >


                <small>

                    ${file.ageDays} days old

                </small>

            `;


            cleanupList.appendChild(
                card
            );

        }
    );

}


/* ==================================================
   ESCAPE ATTRIBUTE
================================================== */

function escapeAttribute(
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
            /"/g,
            "&quot;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        );

}


/* ==================================================
   BULK DELETE
================================================== */

window.deleteSelectedImages =
async function() {

    const checks =
        document.querySelectorAll(
            ".cleanup-check:checked"
        );


    if (!checks.length) {

        alert(
            "No images selected"
        );

        return;

    }


    if (
        !confirm(
            "Delete selected images?"
        )
    ) {

        return;

    }


    try {

        for (
            const checkbox
            of checks
        ) {

            const fileRef =
                ref(
                    storage,
                    checkbox.dataset.path
                );


            await deleteObject(
                fileRef
            );

        }


        alert(
            "Deleted successfully"
        );


        await loadCustomImages();

    }

    catch (error) {

        console.error(
            "Delete selected images error:",
            error
        );


        alert(
            "Delete failed: " +
            (
                error.message ||
                "Unknown error"
            )
        );

    }

};


/* ==================================================
   DELETE OLDER THAN 7 DAYS
================================================== */

window.deleteOlderThan7Days =
async function() {

    if (
        !confirm(
            "Delete all images older than 7 days?"
        )
    ) {

        return;

    }


    try {

        for (
            const file
            of cleanupFiles
        ) {

            if (
                file.ageDays > 7
            ) {

                await deleteObject(
                    file.ref
                );

            }

        }


        alert(
            "Old images deleted"
        );


        await loadCustomImages();

    }

    catch (error) {

        console.error(
            "Delete old images error:",
            error
        );


        alert(
            "Delete failed: " +
            (
                error.message ||
                "Unknown error"
            )
        );

    }

};


/* ==================================================
   SELECT ALL
================================================== */

window.toggleSelectAll =
function() {

    const checks =
        document.querySelectorAll(
            ".cleanup-check"
        );


    allSelected =
        !allSelected;


    checks.forEach(
        checkbox => {

            checkbox.checked =
                allSelected;

        }
    );


    const button =
        document.getElementById(
            "selectAllBtn"
        );


    if (button) {

        button.innerText =
            allSelected
            ?
            "Deselect All"
            :
            "Select All";

    }

};


/* ==================================================
   NAVIGATION
================================================== */

window.goOrders =
function() {

    location.href =
        "orders.html";

};


/* ==================================================
   NOTIFICATIONS
================================================== */

async function initNotifications() {

    try {

        /*
            Browser support
        */

        if (
            typeof Notification ===
            "undefined"
        ) {

            console.warn(
                "Browser notifications are not supported."
            );

            return;

        }


        if (!messaging) {

            console.warn(
                "Firebase messaging is not available."
            );

            return;

        }


        const permission =
            await Notification.requestPermission();


        if (
            permission !==
            "granted"
        ) {

            console.log(
                "Notification permission:",
                permission
            );

            return;

        }


        const token =
            await getToken(
                messaging,
                {

                    vapidKey:
                        "BDgddR6q2vIsMwUfya-PuyOOK1Qu270SvhGMN-fJgOVIyiJ2OP9QzjQcP_cJ9syip_TayZ_fn8rHcVN3gAgrW0"

                }
            );


        console.log(
            "Admin notification token:",
            token
        );

    }

    catch (error) {

        /*
            Notification failure must NEVER
            stop dashboard statistics.
        */

        console.error(
            "Notification initialization error:",
            error
        );

    }

}


/* ==================================================
   INITIALIZE DASHBOARD
================================================== */

async function initializeDashboard() {

    console.log(
        "Initializing dashboard..."
    );


    /*
        Run independently.

        A Storage or Notification error
        will not stop Firestore stats.
    */

    await loadStats();


    await loadCustomImages();


    /*
        Notification permission is handled
        separately.
    */

    initNotifications();

}


/* ==================================================
   START
================================================== */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeDashboard,
        {
            once: true
        }
    );

}

else {

    initializeDashboard();

}
