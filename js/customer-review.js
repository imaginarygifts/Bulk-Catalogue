/*==================================================
    CUSTOMER REVIEW SYSTEM

    Features:
    - Open / close popup
    - Customer name
    - Customer image
    - Product search
    - Product selection
    - Product image
    - 1-5 rating
    - Review text
    - Firebase Storage upload
    - Firestore review submission
    - Review starts as pending
==================================================*/


/*==================================================
    FIREBASE
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
    document.getElementById(
        "reviewPopup"
    );


const openReviewButton =
    document.getElementById(
        "openReviewButton"
    );


const closeReviewButton =
    document.getElementById(
        "closeReviewButton"
    );


const changeReviewProductButton =
    document.getElementById(
        "changeReviewProductButton"
    );


const removeCustomerImageButton =
    document.getElementById(
        "removeCustomerImageButton"
    );


const form =
    document.getElementById(
        "customerReviewForm"
    );


const customerNameInput =
    document.getElementById(
        "reviewCustomerName"
    );


const customerImageInput =
    document.getElementById(
        "reviewCustomerImage"
    );


const customerImagePreview =
    document.getElementById(
        "customerImagePreview"
    );


const customerImagePreviewImg =
    document.getElementById(
        "customerImagePreviewImg"
    );


const productSearchInput =
    document.getElementById(
        "reviewProductSearch"
    );


const productResults =
    document.getElementById(
        "reviewProductResults"
    );


const selectedProductBox =
    document.getElementById(
        "selectedReviewProduct"
    );


const selectedProductImage =
    document.getElementById(
        "selectedProductImage"
    );


const selectedProductName =
    document.getElementById(
        "selectedProductName"
    );


const ratingContainer =
    document.getElementById(
        "reviewRating"
    );


const reviewTextInput =
    document.getElementById(
        "reviewText"
    );


const errorBox =
    document.getElementById(
        "reviewFormError"
    );


const successBox =
    document.getElementById(
        "reviewFormSuccess"
    );


const submitButton =
    document.getElementById(
        "submitReviewBtn"
    );



/*==================================================
    STATE
==================================================*/

let products = [];

let selectedProduct = null;

let selectedRating = 0;

let customerImageFile = null;

let productLoading = false;



/*==================================================
    INITIALIZE
==================================================*/

initCustomerReview();



/*==================================================
    INIT
==================================================*/

function initCustomerReview(){

    console.log(
        "Customer Review JS loaded"
    );


    /*==================================================
        OPEN
    ==================================================*/

    if(openReviewButton){

        openReviewButton.addEventListener(
            "click",
            openReviewPopup
        );

    }
    else{

        console.error(
            "openReviewButton not found"
        );

    }


    /*==================================================
        CLOSE
    ==================================================*/

    if(closeReviewButton){

        closeReviewButton.addEventListener(
            "click",
            closeReviewPopup
        );

    }


    /*==================================================
        OUTSIDE CLICK
    ==================================================*/

    if(reviewPopup){

        reviewPopup.addEventListener(
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

    }


    /*==================================================
        ESCAPE
    ==================================================*/

    document.addEventListener(
        "keydown",
        event => {

            if(
                event.key === "Escape" &&
                reviewPopup &&
                !reviewPopup.classList.contains(
                    "hidden"
                )
            ){

                closeReviewPopup();

            }

        }
    );


    /*==================================================
        IMAGE
    ==================================================*/

    if(customerImageInput){

        customerImageInput.addEventListener(
            "change",
            handleCustomerImage
        );

    }


    /*==================================================
        REMOVE IMAGE
    ==================================================*/

    if(removeCustomerImageButton){

        removeCustomerImageButton.addEventListener(
            "click",
            removeCustomerImage
        );

    }


    /*==================================================
        PRODUCT SEARCH
    ==================================================*/

    if(productSearchInput){

        productSearchInput.addEventListener(
            "input",
            handleProductSearch
        );


        productSearchInput.addEventListener(
            "focus",
            () => {

                if(
                    !products.length
                ){

                    loadProducts();

                }

            }
        );

    }


    /*==================================================
        CHANGE PRODUCT
    ==================================================*/

    if(changeReviewProductButton){

        changeReviewProductButton.addEventListener(
            "click",
            clearSelectedReviewProduct
        );

    }


    /*==================================================
        RATING
    ==================================================*/

    if(ratingContainer){

        ratingContainer
            .querySelectorAll(
                "[data-rating]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const rating =
                                Number(
                                    button.dataset.rating
                                );


                            setRating(
                                rating
                            );

                        }
                    );

                }
            );

    }


    /*==================================================
        FORM
    ==================================================*/

    if(form){

        form.addEventListener(
            "submit",
            handleSubmit
        );

    }

}



/*==================================================
    OPEN POPUP
==================================================*/

function openReviewPopup(){

    console.log(
        "Opening review popup"
    );


    if(!reviewPopup){

        console.error(
            "reviewPopup element not found"
        );

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


    /*
        Load products when popup opens.
    */

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
    CLOSE POPUP
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

        if(productResults){

            productResults.innerHTML = `

                <div class="review-product-loading">

                    Loading products...

                </div>

            `;


            productResults.classList.remove(
                "hidden"
            );

        }


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


        /*
            Remove unavailable products
            if your product documents use
            published/active fields.
        */

        products =
            products.filter(
                product => {

                    if(
                        product.published === false
                    ){

                        return false;

                    }


                    if(
                        product.active === false
                    ){

                        return false;

                    }


                    return true;

                }
            );


        if(
            productSearchInput &&
            productSearchInput.value.trim()
        ){

            renderProductResults(
                productSearchInput.value.trim()
            );

        }
        else{

            hideProductResults();

        }

    }

    catch(error){

        console.error(
            "Product loading error:",
            error
        );


        if(productResults){

            productResults.innerHTML = `

                <div class="review-product-error">

                    Unable to load products.

                </div>

            `;


            productResults.classList.remove(
                "hidden"
            );

        }

    }

    finally{

        productLoading =
            false;

    }

}



/*==================================================
    PRODUCT SEARCH
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


    if(
        !query
    ){

        hideProductResults();

        return;

    }


    if(
        !products.length
    ){

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


    productResults.innerHTML = "";


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
                () => {

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
            image || "";


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


    hideProductResults();

}



/*==================================================
    CLEAR SELECTED PRODUCT
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
    HIDE PRODUCT RESULTS
==================================================*/

function hideProductResults(){

    productResults?.classList.add(
        "hidden"
    );

}



/*==================================================
    RATING
==================================================*/

function setRating(
    rating
){

    rating =
        Math.max(
            1,
            Math.min(
                5,
                Number(rating) || 1
            )
        );


    selectedRating =
        rating;


    if(!ratingContainer){

        return;

    }


    ratingContainer
        .querySelectorAll(
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
                    value <= rating
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
        !file.type.startsWith(
            "image/"
        )
    ){

        showError(
            "Please select a valid image."
        );


        event.target.value =
            "";


        return;

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
            "Customer image must be smaller than 5 MB."
        );


        event.target.value =
            "";


        return;

    }


    customerImageFile =
        file;


    const reader =
        new FileReader();


    reader.onload =
        event => {

            if(customerImagePreviewImg){

                customerImagePreviewImg.src =
                    event.target.result;

            }


            customerImagePreview?.classList.remove(
                "hidden"
            );

        };


    reader.onerror =
        () => {

            showError(
                "Unable to preview customer image."
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
    SUBMIT
==================================================*/

async function handleSubmit(
    event
){

    event.preventDefault();


    clearMessages();


    /*==================================================
        VALIDATE NAME
    ==================================================*/

    const name =
        String(
            customerNameInput?.value ||
            ""
        ).trim();


    if(!name){

        showError(
            "Please enter your name."
        );


        customerNameInput?.focus();

        return;

    }


    /*==================================================
        VALIDATE PRODUCT
    ==================================================*/

    if(!selectedProduct){

        showError(
            "Please select a product."
        );


        productSearchInput?.focus();

        return;

    }


    /*==================================================
        VALIDATE RATING
    ==================================================*/

    if(
        selectedRating < 1 ||
        selectedRating > 5
    ){

        showError(
            "Please select a rating."
        );


        return;

    }


    /*==================================================
        VALIDATE REVIEW
    ==================================================*/

    const reviewText =
        String(
            reviewTextInput?.value ||
            ""
        ).trim();


    if(!reviewText){

        showError(
            "Please write your review."
        );


        reviewTextInput?.focus();

        return;

    }


    if(
        reviewText.length <
        5
    ){

        showError(
            "Please write a little more about your experience."
        );


        reviewTextInput?.focus();

        return;

    }


    /*==================================================
        DISABLE
    ==================================================*/

    setSubmitting(
        true
    );


    try{

        let customerImageUrl =
            "";


        /*==================================================
            CUSTOMER IMAGE UPLOAD
        ==================================================*/

        if(
            customerImageFile
        ){

            showInfo(
                "Uploading customer image..."
            );


            const extension =
                getFileExtension(
                    customerImageFile.name
                );


            const fileName =
                `customer_${Date.now()}_${randomString(8)}.${extension}`;


            const imageRef =
                ref(
                    storage,
                    `reviews/customer-images/${fileName}`
                );


            await uploadBytes(
                imageRef,
                customerImageFile,
                {
                    contentType:
                        customerImageFile.type
                }
            );


            customerImageUrl =
                await getDownloadURL(
                    imageRef
                );

        }


        /*==================================================
            PRODUCT DATA
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
            REVIEW DATA
        ==================================================*/

        const reviewData = {

            /*----------------------------------------------
                CUSTOMER
            ----------------------------------------------*/

            name:
                name,


            image:
                customerImageUrl,


            /*----------------------------------------------
                PRODUCT
            ----------------------------------------------*/

            productId:
                productId,


            productName:
                productName,


            productImage:
                productImage,


            productLink:
                productLink,


            /*----------------------------------------------
                REVIEW
            ----------------------------------------------*/

            stars:
                selectedRating,


            rating:
                selectedRating,


            review:
                reviewText,


            text:
                reviewText,


            /*----------------------------------------------
                MODERATION
            ----------------------------------------------*/

            approved:
                false,


            status:
                "pending",


            published:
                false,


            source:
                "customer",


            /*----------------------------------------------
                TIMESTAMP
            ----------------------------------------------*/

            createdAt:
                serverTimestamp()

        };


        /*==================================================
            SAVE FIRESTORE
        ==================================================*/

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


        /*
            Keep success visible briefly,
            then close popup.
        */

        setTimeout(
            () => {

                closeReviewPopup();

            },
            2200
        );

    }

    catch(error){

        console.error(
            "Customer review submission error:",
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
    RESET FORM
==================================================*/

function resetForm(){

    form?.reset();


    selectedProduct =
        null;


    selectedRating =
        0;


    customerImageFile =
        null;


    selectedProductBox?.classList.add(
        "hidden"
    );


    hideProductResults();


    hideCustomerImagePreview();


    if(ratingContainer){

        ratingContainer
            .querySelectorAll(
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

}



/*==================================================
    SUBMITTING STATE
==================================================*/

function setSubmitting(
    submitting
){

    if(!submitButton){

        return;

    }


    submitButton.disabled =
        submitting;


    submitButton.textContent =
        submitting
        ?
        "Submitting..."
        :
        "Submit Review";

}



/*==================================================
    ERROR
==================================================*/

function showError(
    text
){

    if(!errorBox){

        return;

    }


    errorBox.textContent =
        text;


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
    text
){

    if(!successBox){

        return;

    }


    successBox.textContent =
        text;


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
    text
){

    if(!errorBox){

        return;

    }


    errorBox.textContent =
        text;


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

    if(
        error?.code ===
        "permission-denied"
    ){

        return "Unable to submit review. Firebase permission was denied.";

    }


    if(
        error?.code ===
        "storage/unauthorized"
    ){

        return "Unable to upload customer image. Storage permission was denied.";

    }


    if(
        error?.code ===
        "storage/quota-exceeded"
    ){

        return "Storage quota exceeded. Please try again later.";

    }


    if(
        error?.code ===
        "unavailable"
    ){

        return "Network unavailable. Please check your internet connection.";

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
        parts.length <
        2
    ){

        return "jpg";

    }


    const extension =
        parts
            .pop()
            .toLowerCase()
            .replace(
                /[^a-z0-9]/g,
                ""
            );


    return (
        extension ||
        "jpg"
    );

}



/*==================================================
    RANDOM STRING
==================================================*/

function randomString(
length = 8
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
    ESCAPE HTML
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



/*==================================================
    ESCAPE ATTRIBUTE
==================================================*/

function escapeAttribute(
value
){

    return escapeHtml(
        value
    );

}



/*==================================================
    WINDOW EXPORTS
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