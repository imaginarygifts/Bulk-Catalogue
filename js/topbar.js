/*==================================================
    TOPBAR + SIDEBAR + SEARCH
    COMMON JS
==================================================*/

import { db } from "./firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";



/*==================================================
    DOM
==================================================*/

const menuButton =
    document.getElementById("menuButton");

const sidebar =
    document.getElementById("sidebar");

const sidebarOverlay =
    document.getElementById("sidebarOverlay");

const closeSidebarButton =
    document.getElementById("closeSidebarButton");

const searchButton =
    document.getElementById("searchButton");

const searchOverlay =
    document.getElementById("searchOverlay");

const closeSearchButton =
    document.getElementById("closeSearchButton");

const searchInput =
    document.getElementById("searchInput");

const clearSearchButton =
    document.getElementById("clearSearchButton");

const searchResults =
    document.getElementById("searchResults");



/*==================================================
    SEARCH STATE
==================================================*/

let searchProducts = [];

let searchProductsLoaded =
    false;

let searchLoading =
    false;



/*==================================================
    INITIALIZE
==================================================*/

document.addEventListener(
    "DOMContentLoaded",
    initializeTopbar
);



function initializeTopbar(){

    initializeSidebar();

    initializeSearch();

}



/*==================================================
    SIDEBAR
==================================================*/

function initializeSidebar(){

    if(!sidebar){

        return;

    }


    /*----------------------------------------------
        MENU BUTTON
    ----------------------------------------------*/

    menuButton?.addEventListener(
        "click",
        openSidebar
    );


    /*----------------------------------------------
        CLOSE BUTTON
    ----------------------------------------------*/

    closeSidebarButton?.addEventListener(
        "click",
        closeSidebar
    );


    /*----------------------------------------------
        OVERLAY
    ----------------------------------------------*/

    sidebarOverlay?.addEventListener(
        "click",
        closeSidebar
    );


    /*----------------------------------------------
        ESCAPE
    ----------------------------------------------*/

    document.addEventListener(
        "keydown",
        event => {

            if(
                event.key === "Escape"
            ){

                closeSidebar();

                closeSearch();

            }

        }
    );


    /*----------------------------------------------
        CATEGORIES
    ----------------------------------------------*/

    document
        .getElementById("categoriesToggle")
        ?.addEventListener(
            "click",
            () => {

                toggleSidebarSection(
                    "categoriesToggle",
                    "sidebarCategories"
                );

            }
        );


    /*----------------------------------------------
        TAGS
    ----------------------------------------------*/

    document
        .getElementById("tagsToggle")
        ?.addEventListener(
            "click",
            () => {

                toggleSidebarSection(
                    "tagsToggle",
                    "sidebarTags"
                );

            }
        );

}



/*==================================================
    OPEN SIDEBAR
==================================================*/

function openSidebar(){

    if(!sidebar){

        return;

    }


    sidebar.classList.add(
        "open"
    );


    sidebarOverlay?.classList.add(
        "show"
    );


    document.body.classList.add(
        "sidebar-open"
    );


    sidebar.setAttribute(
        "aria-hidden",
        "false"
    );


    menuButton?.setAttribute(
        "aria-expanded",
        "true"
    );

}



/*==================================================
    CLOSE SIDEBAR
==================================================*/

function closeSidebar(){

    if(!sidebar){

        return;

    }


    sidebar.classList.remove(
        "open"
    );


    sidebarOverlay?.classList.remove(
        "show"
    );


    document.body.classList.remove(
        "sidebar-open"
    );


    sidebar.setAttribute(
        "aria-hidden",
        "true"
    );


    menuButton?.setAttribute(
        "aria-expanded",
        "false"
    );

}



/*==================================================
    SIDEBAR SECTION TOGGLE
==================================================*/

function toggleSidebarSection(
    buttonId,
    submenuId
){

    const button =
        document.getElementById(
            buttonId
        );

    const submenu =
        document.getElementById(
            submenuId
        );


    if(
        !button ||
        !submenu
    ){

        return;

    }


    const isOpen =
        submenu.classList.toggle(
            "open"
        );


    button.classList.toggle(
        "open",
        isOpen
    );


    button.setAttribute(
        "aria-expanded",
        String(isOpen)
    );

}



/*==================================================
    SEARCH
==================================================*/

function initializeSearch(){

    if(
        !searchButton ||
        !searchOverlay
    ){

        return;

    }


    /*----------------------------------------------
        OPEN SEARCH
    ----------------------------------------------*/

    searchButton.addEventListener(
        "click",
        openSearch
    );


    /*----------------------------------------------
        CLOSE SEARCH
    ----------------------------------------------*/

    closeSearchButton?.addEventListener(
        "click",
        closeSearch
    );


    /*----------------------------------------------
        OUTSIDE CLICK
    ----------------------------------------------*/

    searchOverlay.addEventListener(
        "click",
        event => {

            if(
                event.target ===
                searchOverlay
            ){

                closeSearch();

            }

        }
    );


    /*----------------------------------------------
        SEARCH INPUT
    ----------------------------------------------*/

    searchInput?.addEventListener(
        "input",
        handleSearchInput
    );


    /*----------------------------------------------
        CLEAR
    ----------------------------------------------*/

    clearSearchButton?.addEventListener(
        "click",
        clearSearch
    );

}



/*==================================================
    OPEN SEARCH
==================================================*/

function openSearch(){

    if(!searchOverlay){

        return;

    }


    /*----------------------------------------------
        CLOSE SIDEBAR IF OPEN
    ----------------------------------------------*/

    closeSidebar();


    /*----------------------------------------------
        SHOW SEARCH
    ----------------------------------------------*/

    searchOverlay.classList.add(
        "open"
    );


    searchOverlay.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "search-open"
    );


    /*----------------------------------------------
        RESET RESULT MESSAGE
    ----------------------------------------------*/

    if(
        searchInput &&
        !searchInput.value.trim()
    ){

        renderSearchMessage(
            "Search for a product"
        );

    }


    /*----------------------------------------------
        FOCUS
    ----------------------------------------------*/

    setTimeout(
        () => {

            searchInput?.focus();

        },
        100
    );


    /*----------------------------------------------
        LOAD PRODUCTS
    ----------------------------------------------*/

    if(
        !searchProductsLoaded
    ){

        loadSearchProducts();

    }

}



/*==================================================
    CLOSE SEARCH
==================================================*/

function closeSearch(){

    if(!searchOverlay){

        return;

    }


    searchOverlay.classList.remove(
        "open"
    );


    searchOverlay.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.classList.remove(
        "search-open"
    );


    if(searchInput){

        searchInput.value = "";

    }


    if(clearSearchButton){

        clearSearchButton.classList.remove(
            "show"
        );

    }


    renderSearchMessage(
        "Search for a product"
    );

}



/*==================================================
    CLEAR SEARCH
==================================================*/

function clearSearch(){

    if(searchInput){

        searchInput.value = "";

        searchInput.focus();

    }


    clearSearchButton?.classList.remove(
        "show"
    );


    renderSearchMessage(
        "Search for a product"
    );

}



/*==================================================
    LOAD SEARCH PRODUCTS
==================================================*/

async function loadSearchProducts(){

    if(
        searchLoading ||
        searchProductsLoaded
    ){

        return;

    }


    searchLoading = true;


    renderSearchMessage(
        "Loading products..."
    );


    try{

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "products"
                )
            );


        searchProducts =
            snapshot.docs
                .map(
                    docSnap => ({

                        id:
                            docSnap.id,

                        ...docSnap.data()

                    })
                )
                .filter(
                    product =>

                        product.published !== false
                        &&
                        product.active !== false

                );


        searchProductsLoaded =
            true;


        /*------------------------------------------
            SEARCH AGAIN IF USER TYPED
        ------------------------------------------*/

        if(
            searchInput &&
            searchInput.value.trim()
        ){

            handleSearchInput({
                target: searchInput
            });

        }
        else{

            renderSearchMessage(
                "Search for a product"
            );

        }

    }

    catch(error){

        console.error(
            "Search products error:",
            error
        );


        renderSearchMessage(
            "Unable to load products."
        );

    }

    finally{

        searchLoading =
            false;

    }

}



/*==================================================
    SEARCH INPUT
==================================================*/

function handleSearchInput(event){

    const query =
        String(
            event.target.value || ""
        )
        .trim()
        .toLowerCase();


    /*----------------------------------------------
        CLEAR BUTTON
    ----------------------------------------------*/

    if(clearSearchButton){

        clearSearchButton.classList.toggle(
            "show",
            Boolean(query)
        );

    }


    /*----------------------------------------------
        EMPTY
    ----------------------------------------------*/

    if(!query){

        renderSearchMessage(
            "Search for a product"
        );

        return;

    }


    /*----------------------------------------------
        LOADING
    ----------------------------------------------*/

    if(!searchProductsLoaded){

        renderSearchMessage(
            "Loading products..."
        );

        return;

    }


    /*----------------------------------------------
        MATCH
    ----------------------------------------------*/

    const matchedProducts =
        searchProducts
            .filter(
                product =>
                    productMatchesSearch(
                        product,
                        query
                    )
            )
            .slice(
                0,
                30
            );


    renderSearchResults(
        matchedProducts
    );

}



/*==================================================
    PRODUCT SEARCH MATCH
==================================================*/

function productMatchesSearch(
    product,
    query
){

    const name =
        String(
            product.name ||
            product.title ||
            product.productName ||
            ""
        )
        .toLowerCase();


    const description =
        String(
            product.description ||
            ""
        )
        .toLowerCase();


    const category =
        String(
            product.categoryName ||
            product.category ||
            product.category?.name ||
            ""
        )
        .toLowerCase();


    const tags =
        getProductTags(
            product
        )
        .join(" ")
        .toLowerCase();


    return (

        name.includes(query)

        ||

        description.includes(query)

        ||

        category.includes(query)

        ||

        tags.includes(query)

    );

}



/*==================================================
    RENDER SEARCH RESULTS
==================================================*/

function renderSearchResults(
    products
){

    if(!searchResults){

        return;

    }


    if(!products.length){

        const query =
            searchInput?.value.trim();


        renderSearchMessage(
            query
                ? "No products found."
                : "Search for a product"
        );


        return;

    }


    searchResults.innerHTML =
        products
            .map(
                product =>
                    createSearchResult(
                        product
                    )
            )
            .join("");


    /*----------------------------------------------
        RESULT CLICK
    ----------------------------------------------*/

    searchResults
        .querySelectorAll(
            ".search-result"
        )
        .forEach(
            item => {

                item.addEventListener(
                    "click",
                    () => {

                        const productId =
                            item.dataset.productId;


                        const product =
                            searchProducts.find(
                                item =>
                                    item.id ===
                                    productId
                            );


                        if(!product){

                            return;

                        }


                        window.location.href =
                            getProductLink(
                                product
                            );

                    }
                );

            }
        );

}



/*==================================================
    SEARCH MESSAGE
==================================================*/

function renderSearchMessage(
    message
){

    if(!searchResults){

        return;

    }


    searchResults.innerHTML = `

        <div class="search-message">

            ${escapeHtml(message)}

        </div>

    `;

}



/*==================================================
    SEARCH RESULT
==================================================*/

function createSearchResult(
    product
){

    const image =
        getProductImage(
            product
        );


    const name =
        product.name ||
        product.title ||
        product.productName ||
        "Product";


    const price =
        product.salePrice ??
        product.price ??
        product.pricing?.salePrice ??
        product.pricing?.price ??
        "";


    return `

        <button
            type="button"
            class="search-result"
            data-product-id="${escapeAttribute(
                product.id
            )}"
        >

            <div class="search-result-image">

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
                        loading="lazy"
                    >
                    `

                    :

                    `
                    <div
                        class="search-result-no-image"
                    >
                        No Image
                    </div>
                    `
                }

            </div>


            <div class="search-result-info">

                <div
                    class="search-result-name"
                >

                    ${escapeHtml(name)}

                </div>


                ${
                    price !== ""

                    ?

                    `
                    <div
                        class="search-result-price"
                    >

                        ₹${escapeHtml(
                            String(price)
                        )}

                    </div>
                    `

                    :

                    ""
                }

            </div>


            <i
                class="fa-solid fa-chevron-right search-result-arrow"
            ></i>

        </button>

    `;

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
    PRODUCT LINK
==================================================*/

function getProductLink(
    product
){

    if(product.link){

        return product.link;

    }


    return `product.html?id=${encodeURIComponent(
        product.id
    )}`;

}



/*==================================================
    PRODUCT TAGS
==================================================*/

function getProductTags(
    product
){

    const tags = [];


    if(
        Array.isArray(
            product.tags
        )
    ){

        tags.push(
            ...product.tags
        );

    }


    if(product.tag){

        if(
            Array.isArray(
                product.tag
            )
        ){

            tags.push(
                ...product.tag
            );

        }
        else{

            tags.push(
                product.tag
            );

        }

    }


    return tags.map(
        tag => {

            if(
                typeof tag ===
                "object"
            ){

                return String(
                    tag.slug ||
                    tag.name ||
                    ""
                )
                .toLowerCase();

            }


            return String(tag)
                .toLowerCase();

        }
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

    return escapeHtml(value);

}



/*==================================================
    OPTIONAL GLOBAL FUNCTIONS
==================================================*/

window.openSearch =
    openSearch;

window.closeSearch =
    closeSearch;

window.toggleSidebar =
    function(){

        if(
            sidebar?.classList.contains(
                "open"
            )
        ){

            closeSidebar();

        }
        else{

            openSidebar();

        }

    };
