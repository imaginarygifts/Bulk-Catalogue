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
    STATE
==================================================*/

let allProducts = [];

let selectedProduct = null;

let selectedRating = 0;


/*==================================================
    DOM READY
==================================================*/

document.addEventListener(
    "DOMContentLoaded",
    initCustomerReview
);


/*==================================================
    INIT
==================================================*/

async function initCustomerReview(){

    const form =
        document.getElementById(
            "customerReviewForm"
        );


    if(!form){

        return;

    }


    /*==============================================
        LOAD PRODUCTS
    ==============================================*/

    await loadReviewProducts();


    /*==============================================
        PRODUCT SEARCH
    ==============================================*/

    const search =
        document.getElementById(
            "reviewProductSearch"
        );


    search?.addEventListener(
        "input",
        handleProductSearch
    );


    /*==============================================
        CUSTOMER IMAGE PREVIEW
    ==============================================*/

    const imageInput =
        document.getElementById(
            "reviewCustomerImage"
        );


    imageInput?.addEventListener(
        "change",
        handleCustomerImagePreview
    );


    /*==============================================
        RATING
    ==============================================*/

    document
        .querySelectorAll(
            "#reviewRating button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        selectedRating =
                            Number(
                                button.dataset.rating
                            );


                        updateRatingUI();

                    }
                );

            }
        );


    /*==============================================
        FORM SUBMIT
    ==============================================*/

    form.addEventListener(
        "submit",
        submitCustomerReview
    );

}


/*==================================================
    OPEN POPUP
==================================================*/

window.openReviewPopup =
function(){

    const popup =
        document.getElementById(
            "reviewPopup"
        );


    if(!popup){

        return;

    }


    popup.classList.remove(
        "hidden"
    );


    document.body.classList.add(
        "review-popup-open"
    );

};


/*==================================================
    CLOSE POPUP
==================================================*/

window.closeReviewPopup =
function(){

    const popup =
        document.getElementById(
            "reviewPopup"
        );


    if(!popup){

        return;

    }


    popup.classList.add(
        "hidden"
    );


    document.body.classList.remove(
        "review-popup-open"
    );

};


/*==================================================
    LOAD PRODUCTS
==================================================*/

async function loadReviewProducts(){

    try{

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "products"
                )
            );


        allProducts =
            snapshot.docs.map(
                docSnap => ({

                    id:
                        docSnap.id,

                    ...docSnap.data()

                })
            );

    }

    catch(error){

        console.error(
            "Unable to load products:",
            error
        );

        allProducts = [];

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
            event.target.value
        )
        .trim()
        .toLowerCase();


    const results =
        document.getElementById(
            "reviewProductResults"
        );


    if(!results){

        return;

    }


    if(!query){

        results.innerHTML = "";

        results.classList.add(
            "hidden"
        );

        return;

    }


    const matches =
        allProducts
            .filter(
                product => {

                    const name =
                        product.name ||
                        product.title ||
                        "";


                    return String(
                        name
                    )
                    .toLowerCase()
                    .includes(
                        query
                    );

                }
            )
            .slice(
                0,
                10
            );


    if(!matches.length){

        results.innerHTML = `

            <div class="review-no-products">

                No products found

            </div>

        `;

        results.classList.remove(
            "hidden"
        );

        return;

    }


    results.innerHTML =
        matches
            .map(
                product =>
                    createProductSearchItem(
                        product
                    )
            )
            .join("");


    results.classList.remove(
        "hidden"
    );


    results
        .querySelectorAll(
            ".review-product-result"
        )
        .forEach(
            item => {

                item.addEventListener(
                    "click",
                    () => {

                        const productId =
                            item.dataset.productId;


                        const product =
                            allProducts.find(
                                p =>
                                    p.id ===
                                    productId
                            );


                        if(product){

                            selectReviewProduct(
                                product
                            );

                        }

                    }
                );

            }
        );

}


/*==================================================
    PRODUCT SEARCH ITEM
==================================================*/

function createProductSearchItem(
    product
){

    const name =
        product.name ||
        product.title ||
        "Product";


    const image =
        getProductImage(
            product
        );


    return `

        <div
            class="review-product-result"
            data-product-id="${escapeAttribute(
                product.id
            )}"
        >

            ${
                image
                ?
                `
                <img
                    src="${escapeAttribute(
                        image
                    )}"
                    alt="${escapeAttribute(
                        name
                    )}"
                >
                `
                :
                `
                <div class="review-product-no-image">
                    📦
                </div>
                `
            }


            <span>

                ${escapeHtml(
                    name
                )}

            </span>

        </div>

    `;

}


/*==================================================
    SELECT PRODUCT
==================================================*/

function selectReviewProduct(
    product
){

    selectedProduct =
        product;


    const name =
        product.name ||
        product.title ||
        "Product";


    const image =
        getProductImage(
            product
        );


    const selectedBox =
        document.getElementById(
            "selectedReviewProduct"
        );


    const selectedImage =
        document.getElementById(
            "selectedProductImage"
        );


    const selectedName =
        document.getElementById(
            "selectedProductName"
        );


    const results =
        document.getElementById(
            "reviewProductResults"
        );


    const search =
        document.getElementById(
            "reviewProductSearch"
        );


    if(selectedName){

        selectedName.textContent =
            name;

    }


    if(selectedImage){

        selectedImage.src =
            image || "";

        selectedImage.style.display =
            image
            ? "block"
            : "none";

    }


    selectedBox?.classList.remove(
        "hidden"
    );


    results?.classList.add(
        "hidden"
    );


    if(search){

        search.value =
            name;

        search.style.display =
            "none";

    }

}


/*==================================================
    CLEAR PRODUCT
==================================================*/

window.clearSelectedReviewProduct =
function(){

    selectedProduct =
        null;


    const selectedBox =
        document.getElementById(
            "selectedReviewProduct"
        );


    const search =
        document.getElementById(
            "reviewProductSearch"
        );


    const results =
        document.getElementById(
            "reviewProductResults"
        );


    selectedBox?.classList.add(
        "hidden"
    );


    if(search){

        search.style.display =
            "block";

        search.value =
            "";

        search.focus();

    }


    results?.classList.add(
        "hidden"
    );

};


/*==================================================
    CUSTOMER IMAGE PREVIEW
==================================================*/

function handleCustomerImagePreview(
    event
){

    const file =
        event.target.files?.[0];


    const preview =
        document.getElementById(
            "customerImagePreview"
        );


    if(!preview){

        return;

    }


    if(!file){

        preview.innerHTML = "";

        preview.classList.add(
            "hidden"
        );

        return;

    }


    const url =
        URL.createObjectURL(
            file
        );


    preview.innerHTML = `

        <img
            src="${url}"
            alt="Customer preview"
        >

    `;


    preview.classList.remove(
        "hidden"
    );

}


/*==================================================
    RATING UI
==================================================*/

function updateRatingUI(){

    document
        .querySelectorAll(
            "#reviewRating button"
        )
        .forEach(
            button => {

                const rating =
                    Number(
                        button.dataset.rating
                    );


                button.classList.toggle(
                    "active",
                    rating <= selectedRating
                );

            }
        );

}


/*==================================================
    SUBMIT REVIEW
==================================================*/

async function submitCustomerReview(
    event
){

    event.preventDefault();


    const nameInput =
        document.getElementById(
            "reviewCustomerName"
        );


    const reviewInput =
        document.getElementById(
            "reviewText"
        );


    const imageInput =
        document.getElementById(
            "reviewCustomerImage"
        );


    const submitButton =
        document.getElementById(
            "submitReviewBtn"
        );


    const errorBox =
        document.getElementById(
            "reviewFormError"
        );


    const name =
        nameInput?.value.trim();


    const review =
        reviewInput?.value.trim();


    /*==================================================
        VALIDATION
    ==================================================*/

    if(!name){

        showReviewError(
            "Please enter your name."
        );

        return;

    }


    if(!selectedProduct){

        showReviewError(
            "Please select a product."
        );

        return;

    }


    if(!selectedRating){

        showReviewError(
            "Please select a rating."
        );

        return;

    }


    if(!review){

        showReviewError(
            "Please write your review."
        );

        return;

    }


    /*==================================================
        START
    ==================================================*/

    try{

        if(submitButton){

            submitButton.disabled =
                true;

            submitButton.textContent =
                "Submitting...";

        }


        errorBox?.classList.add(
            "hidden"
        );


        /*==================================================
            CUSTOMER IMAGE
        ==================================================*/

        let customerImage =
            "";


        const file =
            imageInput?.files?.[0];


        if(file){

            /*
                Basic image validation.
            */

            if(
                !file.type.startsWith(
                    "image/"
                )
            ){

                throw new Error(
                    "Please select a valid image."
                );

            }


            if(
                file.size >
                5 * 1024 * 1024
            ){

                throw new Error(
                    "Customer image must be smaller than 5 MB."
                );

            }


            const fileName =
                `${Date.now()}_${Math.random()
                    .toString(36)
                    .substring(2,10)}_${file.name}`;


            const imageRef =
                ref(
                    storage,
                    `reviews/customer-images/${fileName}`
                );


            await uploadBytes(
                imageRef,
                file
            );


            customerImage =
                await getDownloadURL(
                    imageRef
                );

        }


        /*==================================================
            PRODUCT IMAGE
        ==================================================*/

        const productImage =
            getProductImage(
                selectedProduct
            );


        /*==================================================
            FIRESTORE
        ==================================================*/

        await addDoc(
            collection(
                db,
                "reviews"
            ),
            {

                name:

                    name,

                image:

                    customerImage,

                stars:

                    selectedRating,

                review:

                    review,

                productId:

                    selectedProduct.id,

                productName:

                    selectedProduct.name ||
                    selectedProduct.title ||
                    "Product",

                productImage:

                    productImage || "",

                status:

                    "pending",

                source:

                    "customer",

                createdAt:

                    serverTimestamp(),

                approvedAt:

                    null

            }
        );


        /*==================================================
            SUCCESS
        ==================================================*/

        alert(
            "Thank you! Your review has been submitted and will appear after approval."
        );


        resetReviewForm();


        closeReviewPopup();

    }

    catch(error){

        console.error(
            "Review submission error:",
            error
        );


        showReviewError(
            error.message ||
            "Unable to submit review. Please try again."
        );

    }

    finally{

        if(submitButton){

            submitButton.disabled =
                false;

            submitButton.textContent =
                "Submit Review";

        }

    }

}


/*==================================================
    RESET FORM
==================================================*/

function resetReviewForm(){

    const form =
        document.getElementById(
            "customerReviewForm"
        );


    form?.reset();


    selectedProduct =
        null;


    selectedRating =
        0;


    updateRatingUI();


    document
        .getElementById(
            "selectedReviewProduct"
        )
        ?.classList.add(
            "hidden"
        );


    document
        .getElementById(
            "customerImagePreview"
        )
        ?.classList.add(
            "hidden"
        );


    const search =
        document.getElementById(
            "reviewProductSearch"
        );


    if(search){

        search.style.display =
            "block";

    }

}


/*==================================================
    ERROR
==================================================*/

function showReviewError(
    message
){

    const errorBox =
        document.getElementById(
            "reviewFormError"
        );


    if(!errorBox){

        return;

    }


    errorBox.textContent =
        message;


    errorBox.classList.remove(
        "hidden"
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
            product.images
        )
        &&
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
        product.image ||
        product.imageUrl ||
        product.thumbnail ||
        ""
    );

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
    EXPORT
==================================================*/

export {

    openReviewPopup,

    closeReviewPopup

};