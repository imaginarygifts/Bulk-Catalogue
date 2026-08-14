import { db, storage } from "../js/firebase.js";

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
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

/*
==================================================
 REVIEWS ADMIN
 Collection: reviews

 Recommended document structure:

 {
   customerName: "Rahul",
   rating: 5,
   text: "Amazing product!",
   productId: "abc123",
   productName: "Personalized Frame",
   customerPhoto: "https://...",
   productPhoto: "https://...",
   approved: true,
   published: true,
   createdAt: serverTimestamp(),
   updatedAt: serverTimestamp()
 }

 "approved" = review is accepted.
 "published" = review is shown on homepage.
==================================================
*/

const auth = getAuth();

let allReviews = [];
let editingReview = null;

const $ = id => document.getElementById(id);

const loading = $("loading");
const errorBox = $("errorBox");
const grid = $("reviewsGrid");
const emptyState = $("emptyState");

function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.remove("hidden");
}

function hideError() {
    errorBox.classList.add("hidden");
}

function escapeHtml(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function getDateValue(value) {
    if (!value) return 0;

    if (typeof value === "number") return value;

    if (value?.toMillis) {
        return value.toMillis();
    }

    if (value?.seconds) {
        return value.seconds * 1000;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function formatDate(value) {
    const timestamp = getDateValue(value);

    if (!timestamp) return "No date";

    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).format(new Date(timestamp));
}

function getInitial(name) {
    return String(name || "C").trim().charAt(0).toUpperCase() || "C";
}

function renderStars(rating) {
    const value = Math.max(0, Math.min(5, Number(rating) || 0));
    return "★".repeat(value) + "☆".repeat(5 - value);
}

function normalizeReview(id, data) {
    return {
        id,
        customerName: data.customerName || data.name || data.userName || "Customer",
        rating: Number(data.rating ?? data.stars ?? 5),
        text: data.text || data.review || data.comment || "",
        productId: data.productId || "",
        productName: data.productName || data.product || "",
        customerPhoto: data.customerPhoto || data.userPhoto || data.avatar || data.photo || "",
        productPhoto: data.productPhoto || data.productImage || "",
        approved: data.approved === true,
        published: data.published === true,
        rejected: data.rejected === true,
        createdAt: data.createdAt || data.date || null,
        updatedAt: data.updatedAt || null
    };
}

/* ==================================================
   ADMIN AUTH CHECK
================================================== */

onAuthStateChanged(auth, async user => {
    if (!user) {
        $("adminEmail").textContent = "Not logged in";
        showError("You are not logged in. Please sign in to the admin dashboard.");
        loading.classList.add("hidden");
        return;
    }

    try {
        /*
         * IMPORTANT:
         * Your Firestore rules intentionally disable admin collection LIST.
         * Therefore we check only the currently logged-in user's admin document.
         */
        const adminSnap = await getDoc(
            doc(db, "admins", user.uid)
        );

        const isAdmin = adminSnap.exists();

        if (!isAdmin) {
            $("adminEmail").textContent = user.email || "Unknown";
            showError("Access denied. Your account is not registered as an admin.");
            loading.classList.add("hidden");
            return;
        }

        $("adminEmail").textContent = user.email || "Admin";
        await loadReviews();

    } catch (error) {
        console.error(error);
        showError("Could not verify admin access. Check your Firestore rules.");
        loading.classList.add("hidden");
    }
});

/* ==================================================
   LOAD REVIEWS
================================================== */

async function loadReviews() {
    loading.classList.remove("hidden");
    hideError();

    try {
        const snap = await getDocs(collection(db, "reviews"));

        allReviews = snap.docs
            .map(item => normalizeReview(item.id, item.data()));

        updateStats();
        applyFilters();

    } catch (error) {
        console.error("Reviews loading error:", error);

        showError(
            "Unable to load reviews. Make sure the Firestore 'reviews' rules allow admin reads."
        );

        grid.innerHTML = "";
        emptyState.classList.add("hidden");

    } finally {
        loading.classList.add("hidden");
    }
}

/* ==================================================
   STATS
================================================== */

function updateStats() {
    const total = allReviews.length;

    const approved = allReviews.filter(
        review => review.approved && !review.rejected
    ).length;

    const pending = allReviews.filter(
        review => !review.approved && !review.rejected
    ).length;

    const published = allReviews.filter(
        review => review.approved && review.published && !review.rejected
    ).length;

    const ratings = allReviews
        .map(review => review.rating)
        .filter(rating => rating >= 1 && rating <= 5);

    const average = ratings.length
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;

    $("totalCount").textContent = total;
    $("pendingCount").textContent = pending;
    $("approvedCount").textContent = approved;
    $("publishedCount").textContent = published;
    $("averageRating").textContent = average.toFixed(1);
}

/* ==================================================
   FILTERS
================================================== */

function applyFilters() {
    const search = $("searchInput").value.trim().toLowerCase();
    const status = $("statusFilter").value;
    const rating = $("ratingFilter").value;
    const sort = $("sortFilter").value;

    let reviews = allReviews.filter(review => {

        const searchMatch =
            !search ||
            review.customerName.toLowerCase().includes(search) ||
            review.text.toLowerCase().includes(search) ||
            review.productName.toLowerCase().includes(search);

        const ratingMatch =
            rating === "all" ||
            Number(review.rating) === Number(rating);

        let statusMatch = true;

        if (status === "pending") {
            statusMatch = !review.approved && !review.rejected;
        }

        if (status === "approved") {
            statusMatch = review.approved && !review.rejected;
        }

        if (status === "published") {
            statusMatch =
                review.approved &&
                review.published &&
                !review.rejected;
        }

        if (status === "hidden") {
            statusMatch =
                review.approved &&
                !review.published &&
                !review.rejected;
        }

        if (status === "rejected") {
            statusMatch = review.rejected === true;
        }

        return searchMatch && ratingMatch && statusMatch;
    });

    reviews.sort((a, b) => {
        if (sort === "newest") {
            return getDateValue(b.createdAt) - getDateValue(a.createdAt);
        }

        if (sort === "oldest") {
            return getDateValue(a.createdAt) - getDateValue(b.createdAt);
        }

        if (sort === "ratingHigh") {
            return b.rating - a.rating;
        }

        if (sort === "ratingLow") {
            return a.rating - b.rating;
        }

        return 0;
    });

    renderReviews(reviews);
}

/* ==================================================
   RENDER
================================================== */

function renderReviews(reviews) {
    grid.innerHTML = "";

    if (!reviews.length) {
        emptyState.classList.remove("hidden");
        return;
    }

    emptyState.classList.add("hidden");

    reviews.forEach(review => {
        grid.appendChild(createReviewCard(review));
    });
}

function createReviewCard(review) {
    const card = document.createElement("article");
    card.className = "review-card";

    const isPending = !review.approved && !review.rejected;
    const isApproved = review.approved && !review.rejected;
    const isPublished = isApproved && review.published;

    let statusHtml = "";

    if (review.rejected) {
        statusHtml += `<span class="badge rejected">Rejected</span>`;
    } else if (isPending) {
        statusHtml += `<span class="badge pending">Pending</span>`;
    } else if (isApproved) {
        statusHtml += `<span class="badge approved">Approved</span>`;
    }

    if (isPublished) {
        statusHtml += `<span class="badge published">Homepage</span>`;
    }

    const customerPhoto = review.customerPhoto
        ? `<img class="avatar" src="${escapeHtml(review.customerPhoto)}" alt="">`
        : `<div class="avatar avatar-fallback">${escapeHtml(getInitial(review.customerName))}</div>`;

    const productHtml = review.productName || review.productPhoto
        ? `
            <div class="product-row">
                ${
                    review.productPhoto
                        ? `<img class="product-thumb" src="${escapeHtml(review.productPhoto)}" alt="">`
                        : `<div class="product-thumb"></div>`
                }
                <div style="min-width:0">
                    <div class="product-label">PRODUCT</div>
                    <div class="product-name">${escapeHtml(review.productName || "Product")}</div>
                </div>
            </div>
        `
        : "";

    card.innerHTML = `
        <div class="review-card-top">
            <div class="customer">
                ${customerPhoto}
                <div style="min-width:0">
                    <div class="customer-name">${escapeHtml(review.customerName)}</div>
                    <div class="date">${formatDate(review.createdAt)}</div>
                </div>
            </div>

            <div class="statuses">
                ${statusHtml}
            </div>
        </div>

        <div class="rating-row">
            <span class="stars">${renderStars(review.rating)}</span>
            <span class="rating-number">${review.rating}/5</span>
        </div>

        <div class="review-text">
            ${escapeHtml(review.text || "No review text")}
        </div>

        ${productHtml}

        <div class="card-actions">
            ${
                review.rejected
                    ? `<button class="action-btn approve" data-action="approve">Approve</button>`
                    : isPending
                        ? `<button class="action-btn approve" data-action="approve">Approve</button>`
                        : `<button class="action-btn" data-action="reject">Reject</button>`
            }

            ${
                isApproved && !isPublished
                    ? `<button class="action-btn publish" data-action="publish">Show Homepage</button>`
                    : isPublished
                        ? `<button class="action-btn publish" data-action="hide">Hide Homepage</button>`
                        : `<button class="action-btn" data-action="edit">Edit</button>`
            }

            <button class="action-btn" data-action="edit">Edit</button>
            <button class="action-btn danger" data-action="delete">Delete</button>
        </div>
    `;

    card.querySelectorAll("[data-action]").forEach(button => {
        button.addEventListener("click", () => {
            handleAction(button.dataset.action, review);
        });
    });

    return card;
}

/* ==================================================
   ACTIONS
================================================== */

async function handleAction(action, review) {

    if (action === "edit") {
        openEditModal(review);
        return;
    }

    if (action === "delete") {
        const ok = confirm(
            `Delete the review from "${review.customerName}" permanently?`
        );

        if (!ok) return;

        try {
            await deleteDoc(doc(db, "reviews", review.id));

            allReviews = allReviews.filter(
                item => item.id !== review.id
            );

            updateStats();
            applyFilters();

        } catch (error) {
            console.error(error);
            alert("Could not delete review.");
        }

        return;
    }

    try {

        if (action === "approve") {
            await updateDoc(
                doc(db, "reviews", review.id),
                {
                    approved: true,
                    rejected: false,
                    updatedAt: serverTimestamp()
                }
            );

            review.approved = true;
            review.rejected = false;
        }

        if (action === "reject") {
            await updateDoc(
                doc(db, "reviews", review.id),
                {
                    approved: false,
                    published: false,
                    rejected: true,
                    updatedAt: serverTimestamp()
                }
            );

            review.approved = false;
            review.published = false;
            review.rejected = true;
        }

        if (action === "publish") {
            if (!review.approved) {
                alert("Approve the review before showing it on the homepage.");
                return;
            }

            await updateDoc(
                doc(db, "reviews", review.id),
                {
                    published: true,
                    updatedAt: serverTimestamp()
                }
            );

            review.published = true;
        }

        if (action === "hide") {
            await updateDoc(
                doc(db, "reviews", review.id),
                {
                    published: false,
                    updatedAt: serverTimestamp()
                }
            );

            review.published = false;
        }

        updateStats();
        applyFilters();

    } catch (error) {
        console.error(error);
        alert("Could not update review. Check your Firestore rules.");
    }
}

/* ==================================================
   MODAL
================================================== */

function openAddModal() {
    editingReview = null;

    $("modalTitle").textContent = "Add Review";
    $("reviewId").value = "";

    $("customerName").value = "";
    $("rating").value = "5";
    $("reviewText").value = "";
    $("productName").value = "";
    $("productId").value = "";

    $("approved").checked = true;
    $("published").checked = false;

    $("customerPhoto").value = "";
    $("productPhoto").value = "";

    $("customerPhotoPreview").innerHTML = "";
    $("productPhotoPreview").innerHTML = "";

    $("reviewModal").classList.remove("hidden");
}

function openEditModal(review) {
    editingReview = review;

    $("modalTitle").textContent = "Edit Review";
    $("reviewId").value = review.id;

    $("customerName").value = review.customerName || "";
    $("rating").value = String(review.rating || 5);
    $("reviewText").value = review.text || "";
    $("productName").value = review.productName || "";
    $("productId").value = review.productId || "";

    $("approved").checked = review.approved === true;
    $("published").checked = review.published === true;

    $("customerPhoto").value = "";
    $("productPhoto").value = "";

    $("customerPhotoPreview").innerHTML =
        review.customerPhoto
            ? `<img src="${escapeHtml(review.customerPhoto)}" alt="">`
            : "";

    $("productPhotoPreview").innerHTML =
        review.productPhoto
            ? `<img src="${escapeHtml(review.productPhoto)}" alt="">`
            : "";

    $("reviewModal").classList.remove("hidden");
}

function closeModal() {
    $("reviewModal").classList.add("hidden");
    editingReview = null;
}

$("addReviewBtn").addEventListener("click", openAddModal);
$("closeModalBtn").addEventListener("click", closeModal);
$("cancelModalBtn").addEventListener("click", closeModal);

$("reviewModal").addEventListener("click", event => {
    if (event.target === $("reviewModal")) {
        closeModal();
    }
});

/* ==================================================
   IMAGE PREVIEWS
================================================== */

$("customerPhoto").addEventListener("change", event => {
    previewSelectedFile(
        event.target.files[0],
        $("customerPhotoPreview")
    );
});

$("productPhoto").addEventListener("change", event => {
    previewSelectedFile(
        event.target.files[0],
        $("productPhotoPreview")
    );
});

function previewSelectedFile(file, container) {
    container.innerHTML = "";

    if (!file) return;

    const url = URL.createObjectURL(file);

    container.innerHTML = `
        <img src="${url}" alt="Preview">
    `;
}

/* ==================================================
   IMAGE UPLOAD
================================================== */

async function uploadReviewImage(file, type) {
    if (!file) return "";

    const safeName = file.name
        .replace(/[^a-zA-Z0-9._-]/g, "-");

    const path =
        `review-images/${type}/${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 9)}-${safeName}`;

    const storageRef = ref(storage, path);

    await uploadBytes(storageRef, file);

    return await getDownloadURL(storageRef);
}

/* ==================================================
   SAVE FORM
================================================== */

$("reviewForm").addEventListener("submit", async event => {
    event.preventDefault();

    const button = $("saveReviewBtn");
    button.disabled = true;
    button.textContent = "Saving...";

    try {

        const customerName =
            $("customerName").value.trim();

        const reviewText =
            $("reviewText").value.trim();

        const rating =
            Number($("rating").value);

        const productName =
            $("productName").value.trim();

        const productId =
            $("productId").value.trim();

        const approved =
            $("approved").checked;

        let published =
            $("published").checked;

        if (published && !approved) {
            published = false;
            alert("The review is not approved, so it cannot be published.");
        }

        const customerFile =
            $("customerPhoto").files[0];

        const productFile =
            $("productPhoto").files[0];

        let customerPhoto =
            editingReview?.customerPhoto || "";

        let productPhoto =
            editingReview?.productPhoto || "";

        if (customerFile) {
            customerPhoto =
                await uploadReviewImage(
                    customerFile,
                    "customers"
                );
        }

        if (productFile) {
            productPhoto =
                await uploadReviewImage(
                    productFile,
                    "products"
                );
        }

        const reviewData = {
            customerName,
            rating,
            text: reviewText,
            productName,
            productId,
            customerPhoto,
            productPhoto,
            approved,
            published,
            rejected: false,
            updatedAt: serverTimestamp()
        };

        if (editingReview) {

            await updateDoc(
                doc(db, "reviews", editingReview.id),
                reviewData
            );

            const index = allReviews.findIndex(
                item => item.id === editingReview.id
            );

            if (index !== -1) {
                allReviews[index] = normalizeReview(
                    editingReview.id,
                    {
                        ...allReviews[index],
                        ...reviewData,
                        updatedAt: Date.now()
                    }
                );
            }

        } else {

            const refResult = await addDoc(
                collection(db, "reviews"),
                {
                    ...reviewData,
                    createdAt: serverTimestamp()
                }
            );

            allReviews.unshift(
                normalizeReview(
                    refResult.id,
                    {
                        ...reviewData,
                        createdAt: Date.now()
                    }
                )
            );
        }

        updateStats();
        applyFilters();
        closeModal();

    } catch (error) {
        console.error("Save review error:", error);

        alert(
            "Could not save review. Check Firestore/Storage rules and Firebase configuration."
        );

    } finally {
        button.disabled = false;
        button.textContent = "Save Review";
    }
});

/* ==================================================
   SEARCH / FILTER EVENTS
================================================== */

$("searchInput").addEventListener("input", applyFilters);
$("statusFilter").addEventListener("change", applyFilters);
$("ratingFilter").addEventListener("change", applyFilters);
$("sortFilter").addEventListener("change", applyFilters);

$("refreshBtn").addEventListener("click", loadReviews);

/* ==================================================
   MOBILE SIDEBAR
================================================== */

$("mobileMenuBtn").addEventListener("click", () => {
    $("sidebar").classList.toggle("open");
});

/* ==================================================
   INITIAL
================================================== */

$("loading").classList.remove("hidden");
