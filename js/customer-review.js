/*==================================================
    CUSTOMER REVIEW SYSTEM
==================================================*/

import {
    db,
    storage
} from "./firebase.js";

import {
    collection,
    getDocs,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";


/*==================================================
    DOM
==================================================*/

const reviewPopup =
    document.getElementById("reviewPopup");

const openReviewButton =
    document.getElementById("openReviewButton");

const closeReviewButton =
    document.getElementById("closeReviewButton");

const form =
    document.getElementById("customerReviewForm");

const customerNameInput =
    document.getElementById("reviewCustomerName");

const customerImageInput =
    document.getElementById("reviewCustomerImage");

const customerImagePreview =
    document.getElementById("customerImagePreview");

const customerImagePreviewImg =
    document.getElementById("customerImagePreviewImg");

const removeCustomerImageButton =
    document.getElementById("removeCustomerImageButton");


/*==================================================
    PRODUCT IMAGE
==================================================*/

const productImageInput =
    document.getElementById("reviewProductImage");

const productImagePreview =
    document.getElementById("productImagePreview");

const productImagePreviewImg =
    document.getElementById("productImagePreviewImg");

const removeProductImageButton =
    document.getElementById("removeProductImageButton");


/*==================================================
    PRODUCT SEARCH
==================================================*/

const productSearchInput =
    document.getElementById("reviewProductSearch");

const productResults =
    document.getElementById("reviewProductResults");

const selectedProductBox =
    document.getElementById("selectedReviewProduct");

const selectedProductImage =
    document.getElementById("selectedProductImage");

const selectedProductName =
    document.getElementById("selectedProductName");

const changeReviewProductButton =
    document.getElementById("changeReviewProductButton");


/*==================================================
    RATING
==================================================*/

const ratingContainer =
    document.getElementById("reviewRating");


/*==================================================
    REVIEW
==================================================*/

const reviewTextInput =
    document.getElementById("reviewText");


const errorBox =
    document.getElementById("reviewFormError");


const successBox =
    document.getElementById("reviewFormSuccess");


const submitButton =
    document.getElementById("submitReviewBtn");


/*==================================================
    STATE
==================================================*/

let products = [];

let selectedProduct = null;

let selectedRating = 0;

let customerImageFile = null;

let productImageFile = null;

let productLoading = false;


/*==================================================
    INIT
==================================================*/

document.addEventListener(
    "DOMContentLoaded",
    initCustomerReview
);


function initCustomerReview(){

    console.log(
        "Customer Review System Loaded"
    );


    /*==================================================
        OPEN
    ==================================================*/

    openReviewButton?.addEventListener(
        "click",
        openReviewPopup
    );


    /*==================================================
        CLOSE
    ==================================================*/

    closeReviewButton?.addEventListener(
        "click",
        closeReviewPopup
    );


    /*==================================================
        OUTSIDE CLICK
    ==================================================*/

    reviewPopup?.addEventListener(
        "click",
        event => {

            if(
                event.target ===
                reviewPopup
            ){

                closeReviewPopup();

            }

        }
    );


    /*==================================================
        ESC
    ==================================================*/

    document.addEventListener(
        "keydown",
        event => {

            if(
                event.key === "Escape" &&
                reviewPopup &&
                !reviewPopup.classList.contains("hidden")
            ){

                closeReviewPopup();

            }

        }
    );


    /*==================================================
        CUSTOMER IMAGE
    ==================================================*/

    customerImageInput?.addEventListener(
        "change",
        handleCustomerImage
    );


    removeCustomerImageButton?.addEventListener(
        "click",
        removeCustomerImage
    );


    /*==================================================
        PRODUCT IMAGE
    ==================================================*/

    productImageInput?.addEventListener(
        "change",
        handleProductImage
    );


    removeProductImageButton?.addEventListener(
        "click",
        removeProductImage
    );


    /*==================================================
        PRODUCT SEARCH
    ==================================================*/

    productSearchInput?.addEventListener(
        "input",
        handleProductSearch
    );


    productSearchInput?.addEventListener(
        "focus",
        () => {

            if(
                !products.length
            ){

                loadProducts();

            }

        }
    );


    /*==================================================
        CHANGE PRODUCT
    ==================================================*/

    changeReviewProductButton?.addEventListener(
        "click",
        clearSelectedReviewProduct
    );


    /*==================================================
        RATING
    ==================================================*/

    ratingContainer
        ?.querySelectorAll(
            "[data-rating]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        setRating(
                            Number(
                                button.dataset.rating
                            )
                        );

                    }
                );

            }
        );


    /*==================================================
        SUBMIT
    ==================================================*/

    form?.addEventListener(
        "submit",
        handleSubmit
    );

}


/*==================================================
    OPEN
==================================================*/

function openReviewPopup(){

    if(!reviewPopup){

        return;

    }


    reviewPopup.classList.remove(
        "hidden"
    );


    reviewPopup.classList.add(
        "show"
    );


    reviewPopup.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "review-popup-open"
    );


    if(
        !products.length
    ){

        loadProducts();

    }


    setTimeout(
        () => {

            customerNameInput?.focus();

        },
        100
    );

}


/*==================================================
    CLOSE
==================================================*/

function closeReviewPopup(){

    if(!reviewPopup){

        return;

    }


    reviewPopup.classList.add(
        "hidden"
    );


    reviewPopup.classList.remove(
        "show"
    );


    reviewPopup.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.classList.remove(
        "review-popup-open"
    );

}


/*==================================================
    LOAD PRODUCTS
==================================================*/

async function loadProducts(){

    if(productLoading){

        return;

    }


    productLoading =
        true;


    try{

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "products"
                )
            );


        products =
            snapshot.docs.map(
                docSnap => ({

                    id:
                        docSnap.id,

                    ...docSnap.data()

                })
            );


        products =
            products.filter(
                product =>
                    product.published !== false &&
                    product.active !== false
            );


    }

    catch(error){

        console.error(
            "Product loading error:",
            error
        );

        showError(
            "Unable to load products."
        );

    }

    finally{

        productLoading =
            false;

    }

}


/*==================================================
    SEARCH
==================================================*/

function handleProductSearch(
    event
){

    const query =
        String(
            event.target.value ||
            ""
        )
        .trim()
        .toLowerCase();


    if(!query){

        hideProductResults();

        return;

    }


    if(!products.length){

        loadProducts();

        return;

    }


    renderProductResults(
        query
    );

}


/*==================================================
    RENDER PRODUCT RESULTS
==================================================*/

function renderProductResults(
    query
){

    if(!productResults){

        return;

    }


    const results =
        products
            .filter(
                product => {

                    const name =
                        getProductName(
                            product
                        )
                        .toLowerCase();


                    return name.includes(
                        query
                    );

                }
            )
            .slice(
                0,
                10
            );


    productResults.innerHTML =
        "";


    if(!results.length){

        productResults.innerHTML = `

            <div class="review-product-no-results">

                No products found.

            </div>

        `;


        productResults.classList.remove(
            "hidden"
        );


        return;

    }


    results.forEach(
        product => {

            const item =
                document.createElement(
                    "button"
                );


            item.type =
                "button";


            item.className =
                "review-product-result";


            const image =
                getProductImage(
                    product
                );


            item.innerHTML = `

                ${
                    image
                    ?
                    `
                    <img
                        src="${escapeAttribute(
                            image
                        )}"
                        alt="${escapeAttribute(
                            getProductName(
                                product
                            )
                        )}"
                    >
                    `
                    :
                    `
                    <div class="review-product-result-placeholder">
                        No Image
                    </div>
                    `
                }

                <span>

                    ${escapeHtml(
                        getProductName(
                            product
                        )
                    )}

                </span>

            `;


            item.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    event.stopPropagation();


                    selectProduct(
                        product
                    );

                }
            );


            productResults.appendChild(
                item
            );

        }
    );


    productResults.classList.remove(
        "hidden"
    );

}


/*==================================================
    SELECT PRODUCT
==================================================*/

function selectProduct(
    product
){

    selectedProduct =
        product;


    const name =
        getProductName(
            product
        );


    const image =
        getProductImage(
            product
        );


    if(selectedProductName){

        selectedProductName.textContent =
            name;

    }


    if(selectedProductImage){

        selectedProductImage.src =
            image ||
            "";


        selectedProductImage.alt =
            name;


        selectedProductImage.style.display =
            image
            ?
            "block"
            :
            "none";

    }


    selectedProductBox?.classList.remove(
        "hidden"
    );


    if(productSearchInput){

        productSearchInput.value =
            name;

    }


    /*
        IMPORTANT:
        Completely hide the dropdown
        after product selection.
    */

    hideProductResults();

}


/*==================================================
    HIDE PRODUCT RESULTS
==================================================*/

function hideProductResults(){

    if(!productResults){

        return;

    }


    productResults.innerHTML =
        "";


    productResults.classList.add(
        "hidden"
    );

}


/*==================================================
    CHANGE PRODUCT
==================================================*/

function clearSelectedReviewProduct(){

    selectedProduct =
        null;


    selectedProductBox?.classList.add(
        "hidden"
    );


    if(productSearchInput){

        productSearchInput.value =
            "";


        productSearchInput.focus();

    }


    hideProductResults();

}


/*==================================================
    PRODUCT NAME
==================================================*/

function getProductName(
    product
){

    return (
        product?.name ||
        product?.title ||
        product?.productName ||
        "Product"
    );

}


/*==================================================
    PRODUCT IMAGE
==================================================*/

function getProductImage(
    product
){

    if(
        Array.isArray(
            product?.images
        ) &&
        product.images.length
    ){

        const first =
            product.images[0];


        if(
            typeof first ===
            "string"
        ){

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


/*==================================================
    RATING
==================================================*/

function setRating(
    rating
){

    selectedRating =
        Math.max(
            1,
            Math.min(
                5,
                Number(
                    rating
                )
            )
        );


    ratingContainer
        ?.querySelectorAll(
            "[data-rating]"
        )
        .forEach(
            button => {

                const value =
                    Number(
                        button.dataset.rating
                    );


                button.classList.toggle(
                    "active",
                    value <= selectedRating
                );

            }
        );

}


/*==================================================
    CUSTOMER IMAGE
==================================================*/

function handleCustomerImage(
event
){

    const file =
        event.target.files?.[0];


    customerImageFile =
        null;


    if(!file){

        hideCustomerImagePreview();

        return;

    }


    if(
        !validateImage(
            file
        )
    ){

        event.target.value =
            "";


        return;

    }


    customerImageFile =
        file;


    showImagePreview(
        file,
        customerImagePreview,
        customerImagePreviewImg
    );

}


/*==================================================
    PRODUCT IMAGE
==================================================*/

function handleProductImage(
event
){

    const file =
        event.target.files?.[0];


    productImageFile =
        null;


    if(!file){

        hideProductImagePreview();

        return;

    }


    if(
        !validateImage(
            file
        )
    ){

        event.target.value =
            "";


        return;

    }


    productImageFile =
        file;


    showImagePreview(
        file,
        productImagePreview,
        productImagePreviewImg
    );

}


/*==================================================
    VALIDATE IMAGE
==================================================*/

function validateImage(
file
){

    if(
        !file.type.startsWith(
            "image/"
        )
    ){

        showError(
            "Please select a valid image."
        );


        return false;

    }


    const maxSize =
        5 *
        1024 *
        1024;


    if(
        file.size >
        maxSize
    ){

        showError(
            "Image must be smaller than 5 MB."
        );


        return false;

    }


    return true;

}


/*==================================================
    IMAGE PREVIEW
==================================================*/

function showImagePreview(
file,
box,
image
){

    const reader =
        new FileReader();


    reader.onload =
        event => {

            if(image){

                image.src =
                    event.target.result;

            }


            box?.classList.remove(
                "hidden"
            );

        };


    reader.readAsDataURL(
        file
    );

}


/*==================================================
    REMOVE CUSTOMER IMAGE
==================================================*/

function removeCustomerImage(){

    customerImageFile =
        null;


    if(customerImageInput){

        customerImageInput.value =
            "";

    }


    hideCustomerImagePreview();

}


/*==================================================
    HIDE CUSTOMER IMAGE
==================================================*/

function hideCustomerImagePreview(){

    customerImagePreview?.classList.add(
        "hidden"
    );


    if(customerImagePreviewImg){

        customerImagePreviewImg.src =
            "";

    }

}


/*==================================================
    REMOVE PRODUCT IMAGE
==================================================*/

function removeProductImage(){

    productImageFile =
        null;


    if(productImageInput){

        productImageInput.value =
            "";

    }


    hideProductImagePreview();

}


/*==================================================
    HIDE PRODUCT IMAGE
==================================================*/

function hideProductImagePreview(){

    productImagePreview?.classList.add(
        "hidden"
    );


    if(productImagePreviewImg){

        productImagePreviewImg.src =
            "";

    }

}


/*==================================================
    SUBMIT
==================================================*/

async function handleSubmit(
event
){

    event.preventDefault();


    clearMessages();


    const name =
        String(
            customerNameInput?.value ||
            ""
        ).trim();


    const reviewText =
        String(
            reviewTextInput?.value ||
            ""
        ).trim();


    /*==================================================
        VALIDATION
    ==================================================*/

    if(!name){

        showError(
            "Please enter your name."
        );

        return;

    }


    if(!selectedProduct){

        showError(
            "Please select a product."
        );

        return;

    }


    if(
        selectedRating < 1
    ){

        showError(
            "Please select a rating."
        );

        return;

    }


    if(
        reviewText.length < 5
    ){

        showError(
            "Please write your review."
        );

        return;

    }


    setSubmitting(
        true
    );


    try{

        /*==================================================
            CUSTOMER IMAGE
        ==================================================*/

        let customerImageUrl =
            "";


        if(
            customerImageFile
        ){

            showInfo(
                "Uploading customer image..."
            );


            customerImageUrl =
                await uploadReviewImage(
                    customerImageFile,
                    "customer"
                );

        }


        /*==================================================
            PRODUCT IMAGE
        ==================================================*/

        let customerProductImageUrl =
            "";


        if(
            productImageFile
        ){

            showInfo(
                "Uploading product image..."
            );


            customerProductImageUrl =
                await uploadReviewImage(
                    productImageFile,
                    "product"
                );

        }


        /*==================================================
            PRODUCT
        ==================================================*/

        const productId =
            selectedProduct.id;


        const productName =
            getProductName(
                selectedProduct
            );


        const productImage =
            getProductImage(
                selectedProduct
            );


        const productLink =
            selectedProduct.link ||
            `product.html?id=${encodeURIComponent(
                productId
            )}`;


        /*==================================================
            REVIEW DOCUMENT
        ==================================================*/

        const reviewData = {

            name:
                name,

            image:
                customerImageUrl,

            customerImage:
                customerImageUrl,

            productId:
                productId,

            productName:
                productName,

            productImage:
                productImage,

            customerProductImage:
                customerProductImageUrl,

            reviewProductImage:
                customerProductImageUrl,

            productLink:
                productLink,

            stars:
                selectedRating,

            rating:
                selectedRating,

            review:
                reviewText,

            text:
                reviewText,

            approved:
                false,

            published:
                false,

            status:
                "pending",

            source:
                "customer",

            createdAt:
                serverTimestamp()

        };


        showInfo(
            "Submitting your review..."
        );


        await addDoc(
            collection(
                db,
                "reviews"
            ),
            reviewData
        );


        /*==================================================
            SUCCESS
        ==================================================*/

        showSuccess(
            "Thank you! Your review has been submitted and will appear after approval."
        );


        resetForm();


        setTimeout(
            () => {

                closeReviewPopup();

            },
            2200
        );

    }

    catch(error){

        console.error(
            "Review submission error:",
            error
        );


        showError(
            getFriendlyError(
                error
            )
        );

    }

    finally{

        setSubmitting(
            false
        );

    }

}


/*==================================================
    UPLOAD REVIEW IMAGE
==================================================*/

async function uploadReviewImage(
file,
type
){

    const extension =
        getFileExtension(
            file.name
        );


    const fileName =
        `${type}_${Date.now()}_${randomString(10)}.${extension}`;


    const storageRef =
        ref(
            storage,
            `reviews/${type}-images/${fileName}`
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


/*==================================================
    RESET
==================================================*/

function resetForm(){

    form?.reset();


    selectedProduct =
        null;


    selectedRating =
        0;


    customerImageFile =
        null;


    productImageFile =
        null;


    selectedProductBox?.classList.add(
        "hidden"
    );


    hideProductResults();


    hideCustomerImagePreview();


    hideProductImagePreview();


    ratingContainer
        ?.querySelectorAll(
            "[data-rating]"
        )
        .forEach(
            button => {

                button.classList.remove(
                    "active"
                );

            }
        );

}


/*==================================================
    SUBMITTING
==================================================*/

function setSubmitting(
state
){

    if(!submitButton){

        return;

    }


    submitButton.disabled =
        state;


    submitButton.textContent =
        state
        ?
        "Submitting..."
        :
        "Submit Review";

}


/*==================================================
    ERROR
==================================================*/

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


    successBox?.classList.add(
        "hidden"
    );

}


/*==================================================
    SUCCESS
==================================================*/

function showSuccess(
message
){

    if(!successBox){

        return;

    }


    successBox.textContent =
        message;


    successBox.classList.remove(
        "hidden"
    );


    errorBox?.classList.add(
        "hidden"
    );

}


/*==================================================
    INFO
==================================================*/

function showInfo(
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


    successBox?.classList.add(
        "hidden"
    );

}


/*==================================================
    CLEAR MESSAGES
==================================================*/

function clearMessages(){

    errorBox?.classList.add(
        "hidden"
    );


    successBox?.classList.add(
        "hidden"
    );


    if(errorBox){

        errorBox.textContent =
            "";

    }


    if(successBox){

        successBox.textContent =
            "";

    }

}


/*==================================================
    FRIENDLY ERROR
==================================================*/

function getFriendlyError(
error
){

    console.error(
        "Firebase error:",
        error
    );


    if(
        error?.code ===
        "storage/unauthorized"
    ){

        return (
            "Image upload was denied by Firebase Storage Rules. " +
            "Please update your Storage Rules."
        );

    }


    if(
        error?.code ===
        "storage/unauthenticated"
    ){

        return (
            "Image upload requires authentication. " +
            "Please update your Storage Rules or enable authentication."
        );

    }


    if(
        error?.code ===
        "permission-denied"
    ){

        return (
            "Firebase permission denied. " +
            "Please check your Firestore Rules."
        );

    }


    return (
        error?.message ||
        "Unable to submit review. Please try again."
    );

}


/*==================================================
    FILE EXTENSION
==================================================*/

function getFileExtension(
filename
){

    const parts =
        String(
            filename ||
            ""
        ).split(".");


    if(
        parts.length < 2
    ){

        return "jpg";

    }


    return (
        parts
            .pop()
            .toLowerCase()
            .replace(
                /[^a-z0-9]/g,
                ""
            )
        ||
        "jpg"
    );

}


/*==================================================
    RANDOM STRING
==================================================*/

function randomString(
length
){

    const chars =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";


    let result =
        "";


    for(
        let i = 0;
        i < length;
        i++
    ){

        result +=
            chars[
                Math.floor(
                    Math.random() *
                    chars.length
                )
            ];

    }


    return result;

}


/*==================================================
    ESCAPE
==================================================*/

function escapeHtml(
value
){

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


function escapeAttribute(
value
){

    return escapeHtml(
        value
    );

}


/*==================================================
    WINDOW EXPORT
==================================================*/

window.openReviewPopup =
    openReviewPopup;


window.closeReviewPopup =
    closeReviewPopup;


window.clearSelectedReviewProduct =
    clearSelectedReviewProduct;


/*==================================================
    EXPORT
==================================================*/

export {

    openReviewPopup,

    closeReviewPopup,

    clearSelectedReviewProduct

};