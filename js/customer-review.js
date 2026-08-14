/*==================================================
    CUSTOMER REVIEW SYSTEM
    Customer Review Popup + Firestore
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
    GLOBAL STATE
==================================================*/

let allProducts = [];

let selectedProduct = null;

let selectedRating = 0;


/*==================================================
    DOM READY
==================================================*/

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initCustomerReview();

    }
);


/*==================================================
    INITIALIZE
==================================================*/

async function initCustomerReview(){

    console.log(
        "Customer Review System initialized."
    );


    /*==================================================
        CHECK POPUP
    ==================================================*/

    const popup =
        document.getElementById(
            "reviewPopup"
        );


    if(!popup){

        console.warn(
            "Review popup #reviewPopup was not found."
        );

        return;

    }


    /*==================================================
        LOAD PRODUCTS
    ==================================================*/

    await loadReviewProducts();


    /*==================================================
        PRODUCT SEARCH
    ==================================================*/

    const search =
        document.getElementById(
            "reviewProductSearch"
        );


    if(search){

        search.addEventListener(
            "input",
            handleProductSearch
        );

    }


    /*==================================================
        CUSTOMER IMAGE
    ==================================================*/

    const imageInput =
        document.getElementById(
            "reviewCustomerImage"
        );


    if(imageInput){

        imageInput.addEventListener(
            "change",
            handleCustomerImagePreview
        );

    }


    /*==================================================
        RATING
    ==================================================*/

    const ratingButtons =
        document.querySelectorAll(
            "#reviewRating button"
        );


    ratingButtons.forEach(
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


    /*==================================================
        FORM
    ==================================================*/

    const form =
        document.getElementById(
            "customerReviewForm"
        );


    if(form){

        form.addEventListener(
            "submit",
            submitCustomerReview
        );

    }


    /*==================================================
        CLOSE WHEN CLICKING BACKDROP
    ==================================================*/

    popup.addEventListener(
        "click",
        event => {

            if(
                event.target ===
                popup
            ){

                closeReviewPopup();

            }

        }
    );


    /*==================================================
        ESC KEY
    ==================================================*/

    document.addEventListener(
        "keydown",
        event => {

            if(
                event.key ===
                "Escape"
            ){

                if(
                    !popup.classList.contains(
                        "hidden"
                    )
                ){

                    closeReviewPopup();

                }

            }

        }
    );

}


/*==================================================
    OPEN REVIEW POPUP
==================================================*/

window.openReviewPopup =
function(){

    console.log(
        "Opening review popup..."
    );


    const popup =
        document.getElementById(
            "reviewPopup"
        );


    /*==================================================
        POPUP NOT FOUND
    ==================================================*/

    if(!popup){

        console.error(
            "Review popup element #reviewPopup was not found."
        );

        alert(
            "Review popup is not available on this page."
        );

        return;

    }


    /*==================================================
        SHOW
    ==================================================*/

    popup.classList.remove(
        "hidden"
    );


    document.body.classList.add(
        "review-popup-open"
    );


    /*==================================================
        PREVENT BACKGROUND SCROLL
    ==================================================*/

    document.body.style.overflow =
        "hidden";

};


/*==================================================
    CLOSE REVIEW POPUP
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


    document.body.style.overflow =
        "";

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


        console.log(
            "Review products loaded:",
            allProducts.length
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
            event.target.value || ""
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


    /*==================================================
        EMPTY SEARCH
    ==================================================*/

    if(!query){

        results.innerHTML = "";

        results.classList.add(
            "hidden"
        );

        return;

    }


    /*==================================================
        SEARCH PRODUCTS
    ==================================================*/

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


    /*==================================================
        NO RESULTS
    ==================================================*/

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


    /*==================================================
        RESULTS
    ==================================================*/

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


    /*==================================================
        RESULT CLICK
    ==================================================*/

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
    CREATE PRODUCT SEARCH ITEM
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
                <div
                    class="review-product-no-image"
                >
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


    /*==================================================
        NAME
    ==================================================*/

    if(selectedName){

        selectedName.textContent =
            name;

    }


    /*==================================================
        IMAGE
    ==================================================*/

    if(selectedImage){

        if(image){

            selectedImage.src =
                image;

            selectedImage.style.display =
                "block";

        }
        else{

            selectedImage.src =
                "";

            selectedImage.style.display =
                "none";

        }

    }


    /*==================================================
        SHOW SELECTED
    ==================================================*/

    if(selectedBox){

        selectedBox.classList.remove(
            "hidden"
        );

    }


    /*==================================================
        HIDE SEARCH RESULTS
    ==================================================*/

    if(results){

        results.classList.add(
            "hidden"
        );

    }


    /*==================================================
        HIDE SEARCH INPUT
    ==================================================*/

    if(search){

        search.value =
            name;

        search.style.display =
            "none";

    }

}


/*==================================================
    CLEAR SELECTED PRODUCT
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


    if(selectedBox){

        selectedBox.classList.add(
            "hidden"
        );

    }


    if(search){

        search.style.display =
            "block";

        search.value =
            "";

        search.focus();

    }


    if(results){

        results.innerHTML =
            "";

        results.classList.add(
            "hidden"
        );

    }

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


    /*==================================================
        NO IMAGE
    ==================================================*/

    if(!file){

        preview.innerHTML =
            "";

        preview.classList.add(
            "hidden"
        );

        return;

    }


    /*==================================================
        VALIDATE
    ==================================================*/

    if(
        !file.type.startsWith(
            "image/"
        )
    ){

        alert(
            "Please select a valid image."
        );


        event.target.value =
            "";


        return;

    }


    if(
        file.size >
        5 * 1024 * 1024
    ){

        alert(
            "Customer image must be smaller than 5 MB."
        );


        event.target.value =
            "";


        return;

    }


    /*==================================================
        PREVIEW
    ==================================================*/

    const url =
        URL.createObjectURL(
            file
        );


    preview.innerHTML = `

        <img
            src="${url}"
            alt="Customer image preview"
        >

    `;


    preview.classList.remove(
        "hidden"
    );

}


/*==================================================
    UPDATE RATING UI
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
                    rating <=
                    selectedRating
                );

            }
        );

}


/*==================================================
    SUBMIT CUSTOMER REVIEW
==================================================*/

async function submitCustomerReview(
    event
){

    event.preventDefault();


    /*==================================================
        ELEMENTS
    ==================================================*/

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


    const name =
        nameInput?.value
            .trim() ||
        "";


    const review =
        reviewInput?.value
            .trim() ||
        "";


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
        START SUBMISSION
    ==================================================*/

    try{

        if(submitButton){

            submitButton.disabled =
                true;

            submitButton.textContent =
                "Submitting...";

        }


        hideReviewError();


        /*==================================================
            CUSTOMER IMAGE
        ==================================================*/

        let customerImage =
            "";


        const file =
            imageInput?.files?.[0];


        if(file){

            /*==============================================
                VALIDATE TYPE
            ==============================================*/

            if(
                !file.type.startsWith(
                    "image/"
                )
            ){

                throw new Error(
                    "Please select a valid customer image."
                );

            }


            /*==============================================
                VALIDATE SIZE
            ==============================================*/

            if(
                file.size >
                5 * 1024 * 1024
            ){

                throw new Error(
                    "Customer image must be smaller than 5 MB."
                );

            }


            /*==============================================
                FILE NAME
            ==============================================*/

            const safeName =
                file.name
                    .replace(
                        /[^a-zA-Z0-9._-]/g,
                        "_"
                    );


            const fileName =
                `${Date.now()}_${Math.random()
                    .toString(36)
                    .substring(2,10)}_${safeName}`;


            /*==============================================
                STORAGE
            ==============================================*/

            const imageRef =
                ref(
                    storage,
                    `reviews/customer-images/${fileName}`
                );


            await uploadBytes(
                imageRef,
                file,
                {
                    contentType:
                        file.type
                }
            );


            /*==============================================
                DOWNLOAD URL
            ==============================================*/

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
            PRODUCT NAME
        ==================================================*/

        const productName =
            selectedProduct.name ||
            selectedProduct.title ||
            "Product";


        /*==================================================
            PRODUCT LINK
        ==================================================*/

        const productLink =
            `product.html?id=${encodeURIComponent(
                selectedProduct.id
            )}`;


        /*==================================================
            SAVE FIRESTORE
        ==================================================*/

        const reviewData = {

            /*==============================================
                CUSTOMER
            ==============================================*/

            name:
                name,


            image:
                customerImage,


            /*==============================================
                RATING
            ==============================================*/

            stars:
                Number(
                    selectedRating
                ),


            /*==============================================
                REVIEW
            ==============================================*/

            review:
                review,


            /*==============================================
                PRODUCT
            ==============================================*/

            productId:
                selectedProduct.id,


            productName:
                productName,


            productImage:
                productImage || "",


            productLink:
                productLink,


            /*==============================================
                MODERATION
            ==============================================*/

            status:
                "pending",


            approved:
                false,


            /*==============================================
                SOURCE
            ==============================================*/

            source:
                "customer",


            /*==============================================
                DATES
            ==============================================*/

            createdAt:
                serverTimestamp(),


            approvedAt:
                null

        };


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

        alert(
            "Thank you! Your review has been submitted successfully and will appear after approval."
        );


        /*==================================================
            RESET
        ==================================================*/

        resetReviewForm();


        /*==================================================
            CLOSE
        ==================================================*/

        closeReviewPopup();

    }

    catch(error){

        console.error(
            "Customer review submission error:",
            error
        );


        console.error(
            "Error code:",
            error?.code
        );


        console.error(
            "Error message:",
            error?.message
        );


        showReviewError(
            error?.message ||
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


    if(form){

        form.reset();

    }


    selectedProduct =
        null;


    selectedRating =
        0;


    updateRatingUI();


    /*==================================================
        SELECTED PRODUCT
    ==================================================*/

    document
        .getElementById(
            "selectedReviewProduct"
        )
        ?.classList.add(
            "hidden"
        );


    /*==================================================
        PRODUCT SEARCH
    ==================================================*/

    const search =
        document.getElementById(
            "reviewProductSearch"
        );


    if(search){

        search.style.display =
            "block";

        search.value =
            "";

    }


    /*==================================================
        PRODUCT RESULTS
    ==================================================*/

    const results =
        document.getElementById(
            "reviewProductResults"
        );


    if(results){

        results.innerHTML =
            "";

        results.classList.add(
            "hidden"
        );

    }


    /*==================================================
        CUSTOMER IMAGE
    ==================================================*/

    const preview =
        document.getElementById(
            "customerImagePreview"
        );


    if(preview){

        preview.innerHTML =
            "";

        preview.classList.add(
            "hidden"
        );

    }


    hideReviewError();

}


/*==================================================
    SHOW ERROR
==================================================*/

function showReviewError(
    message
){

    const errorBox =
        document.getElementById(
            "reviewFormError"
        );


    if(!errorBox){

        alert(
            message
        );

        return;

    }


    errorBox.textContent =
        message;


    errorBox.classList.remove(
        "hidden"
    );

}


/*==================================================
    HIDE ERROR
==================================================*/

function hideReviewError(){

    const errorBox =
        document.getElementById(
            "reviewFormError"
        );


    if(errorBox){

        errorBox.classList.add(
            "hidden"
        );

        errorBox.textContent =
            "";

    }

}


/*==================================================
    GET PRODUCT IMAGE
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
    GLOBAL TEST HELPERS
==================================================*/

window.testReviewPopup =
function(){

    console.log(
        "Review popup test"
    );


    window.openReviewPopup();

};


/*==================================================
    EXPORT
==================================================*/

export {

    initCustomerReview,

    openReviewPopup,

    closeReviewPopup

};