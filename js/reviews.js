import {
    db,
    storage
} from "../js/firebase.js";


import {
    collection,
    getDocs,
    getDoc,
    addDoc,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";


import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";


/* ==================================================
   REVIEWS ADMIN

   FIRESTORE COLLECTION:

   reviews

   CUSTOMER REVIEW STRUCTURE:

   {
       name: "...",

       image: "...",

       customerImage: "...",

       productId: "...",

       productName: "...",

       productImage: "...",

       customerProductImage: "...",

       reviewProductImage: "...",

       productLink: "...",

       stars: 5,

       rating: 5,

       review: "...",

       text: "...",

       approved: false,

       published: false,

       status: "pending",

       source: "customer",

       createdAt: serverTimestamp()
   }


   IMPORTANT:

   productImage
   =
   ORIGINAL PRODUCT CATALOG IMAGE


   customerProductImage
   =
   CUSTOMER UPLOADED PRODUCT PHOTO


   reviewProductImage
   =
   SAME CUSTOMER UPLOADED PRODUCT PHOTO


   customerImage / image
   =
   CUSTOMER PHOTO
================================================== */


/* ==================================================
   AUTH
================================================== */

const auth =
    getAuth();


/* ==================================================
   STATE
================================================== */

let allReviews = [];

let editingReview = null;


/* ==================================================
   DOM HELPER
================================================== */

const $ =
    id =>
        document.getElementById(id);


/* ==================================================
   DOM
================================================== */

const loading =
    $("loading");

const errorBox =
    $("errorBox");

const grid =
    $("reviewsGrid");

const emptyState =
    $("emptyState");


/* ==================================================
   ERROR
================================================== */

function showError(
    message
){

    if(!errorBox){

        return;

    }


    errorBox.textContent =
        message;


    errorBox.classList.remove(
        "hidden"
    );

}


/* ==================================================
   HIDE ERROR
================================================== */

function hideError(){

    errorBox?.classList.add(
        "hidden"
    );

}


/* ==================================================
   ESCAPE HTML
================================================== */

function escapeHtml(
    value = ""
){

    return String(
        value
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
   DATE VALUE
================================================== */

function getDateValue(
    value
){

    if(!value){

        return 0;

    }


    if(
        typeof value ===
        "number"
    ){

        return value;

    }


    if(
        value?.toMillis
    ){

        return value.toMillis();

    }


    if(
        value?.seconds
    ){

        return value.seconds * 1000;

    }


    const date =
        new Date(
            value
        );


    return Number.isNaN(
        date.getTime()
    )
        ?
        0
        :
        date.getTime();

}


/* ==================================================
   FORMAT DATE
================================================== */

function formatDate(
    value
){

    const timestamp =
        getDateValue(
            value
        );


    if(!timestamp){

        return "No date";

    }


    return new Intl.DateTimeFormat(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    ).format(
        new Date(
            timestamp
        )
    );

}


/* ==================================================
   INITIAL
================================================== */

function getInitial(
    name
){

    return String(
        name ||
        "C"
    )
    .trim()
    .charAt(0)
    .toUpperCase()
    ||
    "C";

}


/* ==================================================
   STARS
================================================== */

function renderStars(
    rating
){

    const value =
        Math.max(
            0,
            Math.min(
                5,
                Number(
                    rating
                ) || 0
            )
        );


    return (
        "★".repeat(
            value
        )
        +
        "☆".repeat(
            5 - value
        )
    );

}


/* ==================================================
   NORMALIZE REVIEW

   Supports:

   NEW CUSTOMER FORMAT

   AND

   OLD ADMIN FORMAT
================================================== */

function normalizeReview(
    id,
    data
){

    const customerImage =
        data.customerImage ||
        data.customerPhoto ||
        data.image ||
        data.userPhoto ||
        data.avatar ||
        data.photo ||
        "";


    const customerProductImage =
        data.customerProductImage ||
        data.reviewProductImage ||
        data.productPhoto ||
        "";


    const originalProductImage =
        data.productImage ||
        "";


    return {

        id,

        /* ==========================================
           CUSTOMER
        ========================================== */

        customerName:
            data.customerName ||
            data.name ||
            data.userName ||
            "Customer",


        customerPhoto:
            customerImage,


        /* ==========================================
           RATING
        ========================================== */

        rating:
            Number(
                data.rating ??
                data.stars ??
                5
            ),


        /* ==========================================
           REVIEW
        ========================================== */

        text:
            data.text ||
            data.review ||
            data.comment ||
            "",


        /* ==========================================
           PRODUCT
        ========================================== */

        productId:
            data.productId ||
            "",


        productName:
            data.productName ||
            data.product ||
            "",


        /* ==========================================
           ORIGINAL CATALOG PRODUCT IMAGE
        ========================================== */

        productImage:
            originalProductImage,


        /* ==========================================
           CUSTOMER-UPLOADED PRODUCT IMAGE
        ========================================== */

        productPhoto:
            customerProductImage,


        customerProductImage:
            customerProductImage,


        reviewProductImage:
            customerProductImage,


        /* ==========================================
           PRODUCT LINK
        ========================================== */

        productLink:
            data.productLink ||
            data.link ||
            "",


        /* ==========================================
           STATUS
        ========================================== */

        approved:
            data.approved === true,


        published:
            data.published === true,


        rejected:
            data.rejected === true,


        status:
            data.status ||
            "",


        source:
            data.source ||
            "admin",


        /* ==========================================
           DATES
        ========================================== */

        createdAt:
            data.createdAt ||
            data.date ||
            null,


        updatedAt:
            data.updatedAt ||
            null

    };

}


/* ==================================================
   ADMIN AUTH CHECK
================================================== */

onAuthStateChanged(
    auth,
    async user => {

        if(!user){

            if($("adminEmail")){

                $("adminEmail").textContent =
                    "Not logged in";

            }


            showError(
                "You are not logged in. Please sign in to the admin dashboard."
            );


            loading?.classList.add(
                "hidden"
            );


            return;

        }


        try{

            /*
             * Only check current admin UID.
             *
             * This works with your current
             * Firestore admin rules.
             */

            const adminSnap =
                await getDoc(
                    doc(
                        db,
                        "admins",
                        user.uid
                    )
                );


            const isAdmin =
                adminSnap.exists();


            if(!isAdmin){

                if($("adminEmail")){

                    $("adminEmail").textContent =
                        user.email ||
                        "Unknown";

                }


                showError(
                    "Access denied. Your account is not registered as an admin."
                );


                loading?.classList.add(
                    "hidden"
                );


                return;

            }


            if($("adminEmail")){

                $("adminEmail").textContent =
                    user.email ||
                    "Admin";

            }


            await loadReviews();

        }

        catch(error){

            console.error(
                "Admin verification error:",
                error
            );


            showError(
                "Could not verify admin access. Check your Firestore rules."
            );


            loading?.classList.add(
                "hidden"
            );

        }

    }
);


/* ==================================================
   LOAD REVIEWS
================================================== */

async function loadReviews(){

    loading?.classList.remove(
        "hidden"
    );


    hideError();


    try{

        const snap =
            await getDocs(
                collection(
                    db,
                    "reviews"
                )
            );


        allReviews =
            snap.docs.map(
                item =>
                    normalizeReview(
                        item.id,
                        item.data()
                    )
            );


        updateStats();

        applyFilters();

    }

    catch(error){

        console.error(
            "Reviews loading error:",
            error
        );


        showError(
            "Unable to load reviews. Check your Firestore reviews rules."
        );


        if(grid){

            grid.innerHTML =
                "";

        }


        emptyState?.classList.add(
            "hidden"
        );

    }

    finally{

        loading?.classList.add(
            "hidden"
        );

    }

}


/* ==================================================
   STATS
================================================== */

function updateStats(){

    const total =
        allReviews.length;


    const approved =
        allReviews.filter(
            review =>
                review.approved &&
                !review.rejected
        ).length;


    const pending =
        allReviews.filter(
            review =>
                !review.approved &&
                !review.rejected
        ).length;


    const published =
        allReviews.filter(
            review =>
                review.approved &&
                review.published &&
                !review.rejected
        ).length;


    const ratings =
        allReviews
            .map(
                review =>
                    review.rating
            )
            .filter(
                rating =>
                    rating >= 1 &&
                    rating <= 5
            );


    const average =
        ratings.length
            ?
            ratings.reduce(
                (
                    a,
                    b
                ) =>
                    a + b,
                0
            )
            /
            ratings.length
            :
            0;


    if($("totalCount")){

        $("totalCount").textContent =
            total;

    }


    if($("pendingCount")){

        $("pendingCount").textContent =
            pending;

    }


    if($("approvedCount")){

        $("approvedCount").textContent =
            approved;

    }


    if($("publishedCount")){

        $("publishedCount").textContent =
            published;

    }


    if($("averageRating")){

        $("averageRating").textContent =
            average.toFixed(
                1
            );

    }

}


/* ==================================================
   FILTERS
================================================== */

function applyFilters(){

    const search =
        (
            $("searchInput")?.value ||
            ""
        )
        .trim()
        .toLowerCase();


    const status =
        $("statusFilter")?.value ||
        "all";


    const rating =
        $("ratingFilter")?.value ||
        "all";


    const sort =
        $("sortFilter")?.value ||
        "newest";


    let reviews =
        allReviews.filter(
            review => {

                const searchMatch =

                    !search

                    ||

                    review.customerName
                        .toLowerCase()
                        .includes(
                            search
                        )

                    ||

                    review.text
                        .toLowerCase()
                        .includes(
                            search
                        )

                    ||

                    review.productName
                        .toLowerCase()
                        .includes(
                            search
                        );


                const ratingMatch =

                    rating === "all"

                    ||

                    Number(
                        review.rating
                    )
                    ===
                    Number(
                        rating
                    );


                let statusMatch =
                    true;


                if(
                    status ===
                    "pending"
                ){

                    statusMatch =
                        !review.approved &&
                        !review.rejected;

                }


                if(
                    status ===
                    "approved"
                ){

                    statusMatch =
                        review.approved &&
                        !review.rejected;

                }


                if(
                    status ===
                    "published"
                ){

                    statusMatch =
                        review.approved &&
                        review.published &&
                        !review.rejected;

                }


                if(
                    status ===
                    "hidden"
                ){

                    statusMatch =
                        review.approved &&
                        !review.published &&
                        !review.rejected;

                }


                if(
                    status ===
                    "rejected"
                ){

                    statusMatch =
                        review.rejected === true;

                }


                return (
                    searchMatch &&
                    ratingMatch &&
                    statusMatch
                );

            }
        );


    reviews.sort(
        (
            a,
            b
        ) => {

            if(
                sort ===
                "newest"
            ){

                return (
                    getDateValue(
                        b.createdAt
                    )
                    -
                    getDateValue(
                        a.createdAt
                    )
                );

            }


            if(
                sort ===
                "oldest"
            ){

                return (
                    getDateValue(
                        a.createdAt
                    )
                    -
                    getDateValue(
                        b.createdAt
                    )
                );

            }


            if(
                sort ===
                "ratingHigh"
            ){

                return (
                    b.rating -
                    a.rating
                );

            }


            if(
                sort ===
                "ratingLow"
            ){

                return (
                    a.rating -
                    b.rating
                );

            }


            return 0;

        }
    );


    renderReviews(
        reviews
    );

}


/* ==================================================
   RENDER REVIEWS
================================================== */

function renderReviews(
    reviews
){

    if(!grid){

        return;

    }


    grid.innerHTML =
        "";


    if(!reviews.length){

        emptyState?.classList.remove(
            "hidden"
        );


        return;

    }


    emptyState?.classList.add(
        "hidden"
    );


    reviews.forEach(
        review => {

            grid.appendChild(
                createReviewCard(
                    review
                )
            );

        }
    );

}


/* ==================================================
   CREATE REVIEW CARD
================================================== */

function createReviewCard(
    review
){

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "review-card";


    const isPending =
        !review.approved &&
        !review.rejected;


    const isApproved =
        review.approved &&
        !review.rejected;


    const isPublished =
        isApproved &&
        review.published;


    let statusHtml =
        "";


    if(
        review.rejected
    ){

        statusHtml +=
            `
            <span class="badge rejected">
                Rejected
            </span>
            `;

    }

    else if(
        isPending
    ){

        statusHtml +=
            `
            <span class="badge pending">
                Pending
            </span>
            `;

    }

    else if(
        isApproved
    ){

        statusHtml +=
            `
            <span class="badge approved">
                Approved
            </span>
            `;

    }


    if(
        isPublished
    ){

        statusHtml +=
            `
            <span class="badge published">
                Homepage
            </span>
            `;

    }


    /* ==================================================
       CUSTOMER PHOTO
    ================================================== */

    const customerPhoto =
        review.customerPhoto
        ?

        `
        <img
            class="avatar"
            src="${escapeHtml(
                review.customerPhoto
            )}"
            alt=""
            onerror="
                this.style.display='none';
                this.nextElementSibling.style.display='flex';
            "
        >

        <div
            class="avatar avatar-fallback"
            style="display:none"
        >
            ${escapeHtml(
                getInitial(
                    review.customerName
                )
            )}
        </div>
        `

        :

        `
        <div
            class="avatar avatar-fallback"
        >
            ${escapeHtml(
                getInitial(
                    review.customerName
                )
            )}
        </div>
        `;


    /* ==================================================
       CUSTOMER UPLOADED PRODUCT PHOTO
    ================================================== */

    const customerProductPhoto =
        review.productPhoto;


    const productHtml =

        review.productName ||
        customerProductPhoto

        ?

        `
        <div class="product-row">

            ${
                customerProductPhoto

                ?

                `
                <img
                    class="product-thumb"
                    src="${escapeHtml(
                        customerProductPhoto
                    )}"
                    alt="Customer product photo"
                    onerror="
                        this.style.display='none';
                    "
                >
                `

                :

                `
                <div class="product-thumb"></div>
                `
            }


            <div
                style="min-width:0"
            >

                <div
                    class="product-label"
                >
                    PRODUCT
                </div>


                <div
                    class="product-name"
                >

                    ${escapeHtml(
                        review.productName ||
                        "Product"
                    )}

                </div>

            </div>

        </div>
        `

        :

        "";


    /* ==================================================
       CARD
    ================================================== */

    card.innerHTML = `

        <div class="review-card-top">


            <div class="customer">

                ${customerPhoto}


                <div
                    style="min-width:0"
                >

                    <div
                        class="customer-name"
                    >

                        ${escapeHtml(
                            review.customerName
                        )}

                    </div>


                    <div
                        class="date"
                    >

                        ${formatDate(
                            review.createdAt
                        )}

                    </div>

                </div>

            </div>


            <div
                class="statuses"
            >

                ${statusHtml}

            </div>

        </div>


        <div
            class="rating-row"
        >

            <span
                class="stars"
            >

                ${renderStars(
                    review.rating
                )}

            </span>


            <span
                class="rating-number"
            >

                ${review.rating}/5

            </span>

        </div>


        <div
            class="review-text"
        >

            ${escapeHtml(
                review.text ||
                "No review text"
            )}

        </div>


        ${productHtml}


        <div
            class="card-actions"
        >

            ${
                review.rejected

                ?

                `
                <button
                    class="action-btn approve"
                    data-action="approve"
                >
                    Approve
                </button>
                `

                :

                isPending

                ?

                `
                <button
                    class="action-btn approve"
                    data-action="approve"
                >
                    Approve
                </button>
                `

                :

                `
                <button
                    class="action-btn"
                    data-action="reject"
                >
                    Reject
                </button>
                `
            }


            ${
                isApproved &&
                !isPublished

                ?

                `
                <button
                    class="action-btn publish"
                    data-action="publish"
                >
                    Show Homepage
                </button>
                `

                :

                isPublished

                ?

                `
                <button
                    class="action-btn publish"
                    data-action="hide"
                >
                    Hide Homepage
                </button>
                `

                :

                ""
            }


            <button
                class="action-btn"
                data-action="edit"
            >
                Edit
            </button>


            <button
                class="action-btn danger"
                data-action="delete"
            >
                Delete
            </button>

        </div>

    `;


    card
        .querySelectorAll(
            "[data-action]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        handleAction(
                            button.dataset.action,
                            review
                        );

                    }
                );

            }
        );


    return card;

}


/* ==================================================
   ACTIONS
================================================== */

async function handleAction(
    action,
    review
){

    if(
        action ===
        "edit"
    ){

        openEditModal(
            review
        );

        return;

    }


    if(
        action ===
        "delete"
    ){

        const ok =
            confirm(
                `Delete the review from "${review.customerName}" permanently?`
            );


        if(!ok){

            return;

        }


        try{

            await deleteDoc(
                doc(
                    db,
                    "reviews",
                    review.id
                )
            );


            allReviews =
                allReviews.filter(
                    item =>
                        item.id !==
                        review.id
                );


            updateStats();

            applyFilters();

        }

        catch(error){

            console.error(
                error
            );


            alert(
                "Could not delete review."
            );

        }


        return;

    }


    try{

        /* ==========================================
           APPROVE
        ========================================== */

        if(
            action ===
            "approve"
        ){

            await updateDoc(
                doc(
                    db,
                    "reviews",
                    review.id
                ),
                {

                    approved:
                        true,

                    rejected:
                        false,

                    status:
                        "approved",

                    updatedAt:
                        serverTimestamp()

                }
            );


            review.approved =
                true;


            review.rejected =
                false;


            review.status =
                "approved";

        }


        /* ==========================================
           REJECT
        ========================================== */

        if(
            action ===
            "reject"
        ){

            await updateDoc(
                doc(
                    db,
                    "reviews",
                    review.id
                ),
                {

                    approved:
                        false,

                    published:
                        false,

                    rejected:
                        true,

                    status:
                        "rejected",

                    updatedAt:
                        serverTimestamp()

                }
            );


            review.approved =
                false;


            review.published =
                false;


            review.rejected =
                true;


            review.status =
                "rejected";

        }


        /* ==========================================
           PUBLISH
        ========================================== */

        if(
            action ===
            "publish"
        ){

            if(
                !review.approved
            ){

                alert(
                    "Approve the review before showing it on the homepage."
                );


                return;

            }


            await updateDoc(
                doc(
                    db,
                    "reviews",
                    review.id
                ),
                {

                    approved:
                        true,

                    published:
                        true,

                    rejected:
                        false,

                    status:
                        "published",

                    updatedAt:
                        serverTimestamp()

                }
            );


            review.approved =
                true;


            review.published =
                true;


            review.rejected =
                false;


            review.status =
                "published";

        }


        /* ==========================================
           HIDE
        ========================================== */

        if(
            action ===
            "hide"
        ){

            await updateDoc(
                doc(
                    db,
                    "reviews",
                    review.id
                ),
                {

                    published:
                        false,

                    status:
                        "approved",

                    updatedAt:
                        serverTimestamp()

                }
            );


            review.published =
                false;


            review.status =
                "approved";

        }


        updateStats();

        applyFilters();

    }

    catch(error){

        console.error(
            "Review update error:",
            error
        );


        alert(
            "Could not update review. Check your Firestore rules."
        );

    }

}


/* ==================================================
   OPEN ADD MODAL
================================================== */

function openAddModal(){

    editingReview =
        null;


    $("modalTitle").textContent =
        "Add Review";


    $("reviewId").value =
        "";


    $("customerName").value =
        "";


    $("rating").value =
        "5";


    $("reviewText").value =
        "";


    $("productName").value =
        "";


    $("productId").value =
        "";


    $("approved").checked =
        true;


    $("published").checked =
        false;


    $("customerPhoto").value =
        "";


    $("productPhoto").value =
        "";


    $("customerPhotoPreview").innerHTML =
        "";


    $("productPhotoPreview").innerHTML =
        "";


    $("reviewModal").classList.remove(
        "hidden"
    );

}


/* ==================================================
   OPEN EDIT MODAL
================================================== */

function openEditModal(
    review
){

    editingReview =
        review;


    $("modalTitle").textContent =
        "Edit Review";


    $("reviewId").value =
        review.id;


    $("customerName").value =
        review.customerName ||
        "";


    $("rating").value =
        String(
            review.rating ||
            5
        );


    $("reviewText").value =
        review.text ||
        "";


    $("productName").value =
        review.productName ||
        "";


    $("productId").value =
        review.productId ||
        "";


    $("approved").checked =
        review.approved === true;


    $("published").checked =
        review.published === true;


    $("customerPhoto").value =
        "";


    $("productPhoto").value =
        "";


    /* ==========================================
       CUSTOMER PHOTO PREVIEW
    ========================================== */

    $("customerPhotoPreview").innerHTML =

        review.customerPhoto

        ?

        `
        <img
            src="${escapeHtml(
                review.customerPhoto
            )}"
            alt="Customer photo"
        >
        `

        :

        "";


    /* ==========================================
       CUSTOMER PRODUCT PHOTO PREVIEW
    ========================================== */

    $("productPhotoPreview").innerHTML =

        review.productPhoto

        ?

        `
        <img
            src="${escapeHtml(
                review.productPhoto
            )}"
            alt="Customer product photo"
        >
        `

        :

        "";


    $("reviewModal").classList.remove(
        "hidden"
    );

}


/* ==================================================
   CLOSE MODAL
================================================== */

function closeModal(){

    $("reviewModal")?.classList.add(
        "hidden"
    );


    editingReview =
        null;

}


/* ==================================================
   MODAL BUTTONS
================================================== */

$("addReviewBtn")
    ?.addEventListener(
        "click",
        openAddModal
    );


$("closeModalBtn")
    ?.addEventListener(
        "click",
        closeModal
    );


$("cancelModalBtn")
    ?.addEventListener(
        "click",
        closeModal
    );


$("reviewModal")
    ?.addEventListener(
        "click",
        event => {

            if(
                event.target ===
                $("reviewModal")
            ){

                closeModal();

            }

        }
    );


/* ==================================================
   IMAGE PREVIEWS
================================================== */

$("customerPhoto")
    ?.addEventListener(
        "change",
        event => {

            previewSelectedFile(
                event.target.files[0],
                $("customerPhotoPreview")
            );

        }
    );


$("productPhoto")
    ?.addEventListener(
        "change",
        event => {

            previewSelectedFile(
                event.target.files[0],
                $("productPhotoPreview")
            );

        }
    );


/* ==================================================
   PREVIEW FILE
================================================== */

function previewSelectedFile(
    file,
    container
){

    if(!container){

        return;

    }


    container.innerHTML =
        "";


    if(!file){

        return;

    }


    const url =
        URL.createObjectURL(
            file
        );


    container.innerHTML = `

        <img
            src="${url}"
            alt="Preview"
        >

    `;

}


/* ==================================================
   IMAGE UPLOAD

   IMPORTANT:

   customers
       =>
   reviews/customer-images/

   products
       =>
   reviews/product-images/
================================================== */

async function uploadReviewImage(
    file,
    type
){

    if(!file){

        return "";

    }


    const safeName =
        file.name
            .replace(
                /[^a-zA-Z0-9._-]/g,
                "-"
            );


    const fileName =
        `${type}_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 9)}_${safeName}`;


    let folder;


    if(
        type ===
        "customers"
    ){

        folder =
            "customer-images";

    }

    else{

        folder =
            "product-images";

    }


    const path =
        `reviews/${folder}/${fileName}`;


    const storageRef =
        ref(
            storage,
            path
        );


    await uploadBytes(
        storageRef,
        file,
        {

            contentType:
                file.type

        }
    );


    return await getDownloadURL(
        storageRef
    );

}


/* ==================================================
   SAVE FORM
================================================== */

$("reviewForm")
    ?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const button =
                $("saveReviewBtn");


            if(button){

                button.disabled =
                    true;


                button.textContent =
                    "Saving...";

            }


            try{

                const customerName =
                    $("customerName")
                        .value
                        .trim();


                const reviewText =
                    $("reviewText")
                        .value
                        .trim();


                const rating =
                    Number(
                        $("rating").value
                    );


                const productName =
                    $("productName")
                        .value
                        .trim();


                const productId =
                    $("productId")
                        .value
                        .trim();


                const approved =
                    $("approved")
                        .checked;


                let published =
                    $("published")
                        .checked;


                /* ==========================================
                   VALIDATION
                ========================================== */

                if(
                    !customerName
                ){

                    throw new Error(
                        "Please enter customer name."
                    );

                }


                if(
                    !reviewText
                ){

                    throw new Error(
                        "Please enter review text."
                    );

                }


                if(
                    rating < 1 ||
                    rating > 5
                ){

                    throw new Error(
                        "Please select a rating between 1 and 5."
                    );

                }


                if(
                    published &&
                    !approved
                ){

                    published =
                        false;


                    alert(
                        "The review is not approved, so it cannot be published."
                    );

                }


                /* ==========================================
                   FILES
                ========================================== */

                const customerFile =
                    $("customerPhoto")
                        ?.files?.[0] ||
                    null;


                const productFile =
                    $("productPhoto")
                        ?.files?.[0] ||
                    null;


                /* ==========================================
                   KEEP EXISTING IMAGES
                ========================================== */

                let customerPhoto =
                    editingReview?.customerPhoto ||
                    "";


                let customerProductImage =
                    editingReview?.customerProductImage ||
                    editingReview?.reviewProductImage ||
                    editingReview?.productPhoto ||
                    "";


                /* ==========================================
                   UPLOAD CUSTOMER IMAGE
                ========================================== */

                if(
                    customerFile
                ){

                    customerPhoto =
                        await uploadReviewImage(
                            customerFile,
                            "customers"
                        );

                }


                /* ==========================================
                   UPLOAD CUSTOMER PRODUCT PHOTO
                ========================================== */

                if(
                    productFile
                ){

                    customerProductImage =
                        await uploadReviewImage(
                            productFile,
                            "products"
                        );

                }


                /* ==========================================
                   REVIEW DATA

                   USE BOTH OLD + NEW COMPATIBLE FIELDS
                ========================================== */

                const reviewData = {

                    /* Customer */

                    name:
                        customerName,

                    customerName:
                        customerName,


                    image:
                        customerPhoto,

                    customerImage:
                        customerPhoto,

                    customerPhoto:
                        customerPhoto,


                    /* Product */

                    productId:
                        productId,

                    productName:
                        productName,


                    /*
                     * IMPORTANT:
                     *
                     * This is only the original
                     * product image when admin
                     * manually provides one.
                     *
                     * We do NOT overwrite it with
                     * customer's uploaded photo.
                     */

                    productImage:
                        editingReview?.productImage ||
                        "",


                    /*
                     * Customer uploaded product image
                     */

                    customerProductImage:
                        customerProductImage,

                    reviewProductImage:
                        customerProductImage,

                    productPhoto:
                        customerProductImage,


                    /* Rating */

                    stars:
                        rating,

                    rating:
                        rating,


                    /* Review */

                    review:
                        reviewText,

                    text:
                        reviewText,


                    /* Status */

                    approved:
                        approved,

                    published:
                        published,

                    rejected:
                        false,


                    status:
                        published
                        ?
                        "published"
                        :
                        approved
                        ?
                        "approved"
                        :
                        "pending",


                    source:
                        editingReview?.source ||
                        "admin",


                    updatedAt:
                        serverTimestamp()

                };


                /* ==========================================
                   UPDATE EXISTING
                ========================================== */

                if(
                    editingReview
                ){

                    await updateDoc(
                        doc(
                            db,
                            "reviews",
                            editingReview.id
                        ),
                        reviewData
                    );


                    const index =
                        allReviews.findIndex(
                            item =>
                                item.id ===
                                editingReview.id
                        );


                    if(
                        index !==
                        -1
                    ){

                        allReviews[index] =
                            normalizeReview(
                                editingReview.id,
                                {

                                    ...allReviews[index],

                                    ...reviewData,

                                    updatedAt:
                                        Date.now()

                                }
                            );

                    }

                }


                /* ==========================================
                   CREATE NEW
                ========================================== */

                else{

                    const refResult =
                        await addDoc(
                            collection(
                                db,
                                "reviews"
                            ),
                            {

                                ...reviewData,

                                createdAt:
                                    serverTimestamp()

                            }
                        );


                    allReviews.unshift(
                        normalizeReview(
                            refResult.id,
                            {

                                ...reviewData,

                                createdAt:
                                    Date.now()

                            }
                        )
                    );

                }


                /* ==========================================
                   REFRESH
                ========================================== */

                updateStats();

                applyFilters();

                closeModal();

            }

            catch(error){

                console.error(
                    "Save review error:",
                    error
                );


                let message =
                    "Could not save review.";


                if(
                    error?.code ===
                    "storage/unauthorized"
                ){

                    message =
                        "Image upload was denied by Firebase Storage Rules.";

                }

                else if(
                    error?.code ===
                    "permission-denied"
                ){

                    message =
                        "Firestore permission denied.";

                }

                else if(
                    error?.message
                ){

                    message =
                        error.message;

                }


                alert(
                    message
                );

            }

            finally{

                if(button){

                    button.disabled =
                        false;


                    button.textContent =
                        "Save Review";

                }

            }

        }
    );


/* ==================================================
   SEARCH / FILTER EVENTS
================================================== */

$("searchInput")
    ?.addEventListener(
        "input",
        applyFilters
    );


$("statusFilter")
    ?.addEventListener(
        "change",
        applyFilters
    );


$("ratingFilter")
    ?.addEventListener(
        "change",
        applyFilters
    );


$("sortFilter")
    ?.addEventListener(
        "change",
        applyFilters
    );


/* ==================================================
   REFRESH
================================================== */

$("refreshBtn")
    ?.addEventListener(
        "click",
        loadReviews
    );


/* ==================================================
   MOBILE SIDEBAR
================================================== */

$("mobileMenuBtn")
    ?.addEventListener(
        "click",
        () => {

            $("sidebar")
                ?.classList
                .toggle(
                    "open"
                );

        }
    );


/* ==================================================
   INITIAL LOADING
================================================== */

loading?.classList.remove(
    "hidden"
);