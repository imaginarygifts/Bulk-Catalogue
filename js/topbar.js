/*==================================================
    TOPBAR SYSTEM
==================================================

    Handles ONLY:

    • Topbar
    • Menu button
    • Logo
    • Search button
    • Search overlay
    • Product search

    Works on:

    • home.html
    • shop.html
    • product.html
    • other storefront pages

==================================================*/

import { db } from "./firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


/*==================================================
    STATE
==================================================*/

let searchProducts = [];

let searchProductsLoaded =
    false;

let searchProductsLoading =
    false;

let searchInitialized =
    false;


/*==================================================
    DOM HELPERS
==================================================*/

function getElement(id){

    return document.getElementById(
        id
    );

}


/*==================================================
    INIT
==================================================*/

document.addEventListener(
    "DOMContentLoaded",
    initTopbar
);


function initTopbar(){

    console.log(
        "✅ Topbar system loaded"
    );


    initMenu();


    initLogo();


    initSearch();

}


/*==================================================
    MENU
==================================================*/

function initMenu(){

    const menuButton =
        getElement(
            "menuButton"
        );


    if(!menuButton){

        return;

    }


    /*
        IMPORTANT:

        sidebar.js already contains
        window.toggleSidebar().

        We simply call it here.

        This keeps sidebar functionality
        inside sidebar.js.
    */

    menuButton.addEventListener(
        "click",
        event => {

            event.preventDefault();


            if(
                typeof window.toggleSidebar ===
                "function"
            ){

                window.toggleSidebar();

                return;

            }


            /*
                Fallback in case sidebar.js
                is not loaded.
            */

            const sidebar =
                getElement(
                    "sidebar"
                );


            const overlay =
                getElement(
                    "overlay"
                );


            if(sidebar){

                sidebar.classList.toggle(
                    "open"
                );

                sidebar.classList.toggle(
                    "active"
                );

            }


            if(overlay){

                overlay.classList.toggle(
                    "show"
                );

                overlay.classList.toggle(
                    "active"
                );

            }

        }
    );

}


/*==================================================
    LOGO
==================================================*/

function initLogo(){

    const logo =
        getElement(
            "siteLogo"
        );


    const logoLink =
        getElement(
            "logoLink"
        );


    if(!logo){

        return;

    }


    /*
        site-settings.js normally handles
        the actual logo image.

        We only make sure the logo
        behaves correctly.
    */

    logo.addEventListener(
        "error",
        () => {

            logo.style.display =
                "none";

        }
    );


    /*
        Home link.

        data-logo-link can still be
        changed by site-settings.js.
    */

    if(logoLink){

        logoLink.addEventListener(
            "click",
            event => {

                /*
                    If site-settings.js has
                    already assigned a valid
                    custom link, don't interfere.
                */

                const href =
                    logoLink.getAttribute(
                        "href"
                    );


                if(
                    !href ||
                    href === "#"
                ){

                    event.preventDefault();

                    window.location.href =
                        "index";

                }

            }
        );

    }

}


/*==================================================
    SEARCH
==================================================*/

function initSearch(){

    if(searchInitialized){

        return;

    }


    searchInitialized =
        true;


    const searchButton =
        getElement(
            "searchButton"
        );


    if(searchButton){

        searchButton.addEventListener(
            "click",
            event => {

                event.preventDefault();


                openSearch();

            }
        );

    }


    /*
        Remove old search overlay.

        Your current home.html already has:

        #searchOverlay

        But that old HTML is not enough
        for our new search system.

        We replace it with our new
        complete search system.
    */

    const oldOverlay =
        getElement(
            "searchOverlay"
        );


    if(oldOverlay){

        oldOverlay.remove();

    }


    createSearchOverlay();

}


/*==================================================
    CREATE SEARCH OVERLAY
==================================================*/

function createSearchOverlay(){

    /*
        Prevent duplicate overlay
    */

    let overlay =
        getElement(
            "searchOverlay"
        );


    if(overlay){

        return overlay;

    }


    overlay =
        document.createElement(
            "div"
        );


    overlay.id =
        "searchOverlay";


    overlay.className =
        "search-overlay";


    overlay.innerHTML = `

        <div
            class="search-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Search products"
        >


            <!--========================================
                HEADER
            ========================================-->

            <div class="search-header">


                <div class="search-title">

                    Search Products

                </div>


                <button
                    type="button"
                    class="search-close"
                    id="searchCloseButton"
                    aria-label="Close search"
                >

                    ×

                </button>

            </div>



            <!--========================================
                SEARCH INPUT
            ========================================-->

            <div class="search-input-wrap">


                <span
                    class="search-input-icon"
                    aria-hidden="true"
                >

                    🔍

                </span>


                <input
                    type="search"
                    id="searchInput"
                    class="search-input"
                    placeholder="Search products..."
                    autocomplete="off"
                    enterkeyhint="search"
                >


                <button
                    type="button"
                    id="clearSearchButton"
                    class="clear-search-button"
                    aria-label="Clear search"
                    style="display:none;"
                >

                    ×

                </button>

            </div>



            <!--========================================
                RESULTS
            ========================================-->

            <div
                id="searchResults"
                class="search-results"
            >

                <div class="search-empty">

                    Type to search products

                </div>

            </div>


        </div>

    `;


    document.body.appendChild(
        overlay
    );


    /*==================================================
        CLOSE BUTTON
    ==================================================*/

    getElement(
        "searchCloseButton"
    )?.addEventListener(
        "click",
        closeSearch
    );


    /*==================================================
        OUTSIDE CLICK
    ==================================================*/

    overlay.addEventListener(
        "click",
        event => {

            if(
                event.target ===
                overlay
            ){

                closeSearch();

            }

        }
    );


    /*==================================================
        ESCAPE
    ==================================================*/

    document.addEventListener(
        "keydown",
        event => {

            if(
                event.key ===
                "Escape"
            ){

                const currentOverlay =
                    getElement(
                        "searchOverlay"
                    );


                if(
                    currentOverlay &&
                    currentOverlay.classList.contains(
                        "open"
                    )
                ){

                    closeSearch();

                }

            }

        }
    );


    /*==================================================
        SEARCH INPUT
    ==================================================*/

    getElement(
        "searchInput"
    )?.addEventListener(
        "input",
        handleSearchInput
    );


    /*==================================================
        ENTER
    ==================================================*/

    getElement(
        "searchInput"
    )?.addEventListener(
        "keydown",
        event => {

            if(
                event.key ===
                "Enter"
            ){

                const query =
                    event.target.value
                        .trim();


                if(!query){

                    return;

                }


                /*
                    Go to shop with search
                    parameter.

                    store.js will read:

                        ?search=
                */

                window.location.href =
                    `shop?search=${encodeURIComponent(
                        query
                    )}`;

            }

        }
    );


    /*==================================================
        CLEAR
    ==================================================*/

    getElement(
        "clearSearchButton"
    )?.addEventListener(
        "click",
        () => {

            const input =
                getElement(
                    "searchInput"
                );


            if(input){

                input.value =
                    "";

                input.focus();

            }


            updateClearButton();


            renderSearchMessage(
                "Type to search products"
            );

        }
    );


    return overlay;

}


/*==================================================
    OPEN SEARCH
==================================================*/

function openSearch(){

    const overlay =
        getElement(
            "searchOverlay"
        );


    if(!overlay){

        createSearchOverlay();

    }


    const currentOverlay =
        getElement(
            "searchOverlay"
        );


    if(!currentOverlay){

        return;

    }


    currentOverlay.classList.add(
        "open"
    );


    document.body.classList.add(
        "search-open"
    );


    const input =
        getElement(
            "searchInput"
        );


    setTimeout(
        () => {

            input?.focus();

        },
        100
    );


    /*
        Load products only once.
    */

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

    const overlay =
        getElement(
            "searchOverlay"
        );


    if(!overlay){

        return;

    }


    overlay.classList.remove(
        "open"
    );


    document.body.classList.remove(
        "search-open"
    );

}


/*==================================================
    LOAD PRODUCTS
==================================================*/

async function loadSearchProducts(){

    if(
        searchProductsLoading ||
        searchProductsLoaded
    ){

        return;

    }


    searchProductsLoading =
        true;


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


        console.log(
            "Search products loaded:",
            searchProducts.length
        );


        const input =
            getElement(
                "searchInput"
            );


        if(
            input &&
            input.value.trim()
        ){

            handleSearchInput({
                target:
                    input
            });

        }
        else{

            renderSearchMessage(
                "Type to search products"
            );

        }

    }

    catch(error){

        console.error(
            "Search products error:",
            error
        );


        renderSearchMessage(
            "Unable to load products. Please try again."
        );

    }

    finally{

        searchProductsLoading =
            false;

    }

}


/*==================================================
    SEARCH INPUT
==================================================*/

function handleSearchInput(
    event
){

    const query =
        String(
            event.target.value ||
            ""
        )
        .trim()
        .toLowerCase();


    updateClearButton();


    if(!query){

        renderSearchMessage(
            "Type to search products"
        );

        return;

    }


    if(
        !searchProductsLoaded
    ){

        renderSearchMessage(
            "Loading products..."
        );


        /*
            In case the user started
            typing immediately after
            opening search.
        */

        loadSearchProducts();


        return;

    }


    const matched =
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
                20
            );


    renderSearchResults(
        matched,
        query
    );

}


/*==================================================
    UPDATE CLEAR BUTTON
==================================================*/

function updateClearButton(){

    const input =
        getElement(
            "searchInput"
        );


    const clearButton =
        getElement(
            "clearSearchButton"
        );


    if(
        !input ||
        !clearButton
    ){

        return;

    }


    clearButton.style.display =
        input.value.trim()
        ?
        "flex"
        :
        "none";

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
        .join(
            " "
        )
        .toLowerCase();


    return (

        name.includes(
            query
        )

        ||

        description.includes(
            query
        )

        ||

        category.includes(
            query
        )

        ||

        tags.includes(
            query
        )

    );

}


/*==================================================
    PRODUCT TAGS
==================================================*/

function getProductTags(
    product
){

    let tags =
        [];


    if(
        Array.isArray(
            product.tags
        )
    ){

        tags.push(
            ...product.tags
        );

    }


    if(
        product.tag
    ){

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


            return String(
                tag
            )
            .toLowerCase();

        }
    );

}


/*==================================================
    RENDER SEARCH MESSAGE
==================================================*/

function renderSearchMessage(
    message
){

    const results =
        getElement(
            "searchResults"
        );


    if(!results){

        return;

    }


    results.innerHTML = `

        <div class="search-empty">

            ${escapeHtml(
                message
            )}

        </div>

    `;

}


/*==================================================
    RENDER SEARCH RESULTS
==================================================*/

function renderSearchResults(
    products,
    query
){

    const results =
        getElement(
            "searchResults"
        );


    if(!results){

        return;

    }


    if(!products.length){

        results.innerHTML = `

            <div class="search-empty">

                <strong>
                    No products found
                </strong>

                <span>
                    Try another search.
                </span>

            </div>

        `;


        return;

    }


    results.innerHTML = `

        <div class="search-results-count">

            ${
                products.length
            }
            ${
                products.length === 1
                ?
                "product"
                :
                "products"
            }
            found

        </div>


        <div class="search-result-list">

            ${
                products
                    .map(
                        product =>
                            createSearchResult(
                                product
                            )
                    )
                    .join("")
            }

        </div>


        <button
            type="button"
            class="search-view-all"
            id="searchViewAllButton"
        >

            View all results for
            "${escapeHtml(
                query
            )}"

        </button>

    `;


    /*==================================================
        RESULT CLICK
    ==================================================*/

    results
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
                                product =>
                                    product.id ===
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


    /*==================================================
        VIEW ALL
    ==================================================*/

    getElement(
        "searchViewAllButton"
    )?.addEventListener(
        "click",
        () => {

            window.location.href =
                `shop?search=${encodeURIComponent(
                    query
                )}`;

        }
    );

}


/*==================================================
    SEARCH RESULT CARD
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
        product.basePrice ??
        "";


    return `

        <button
            type="button"
            class="search-result"
            data-product-id="${escapeAttribute(
                product.id
            )}"
        >


            <!-- IMAGE -->

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
                        class="
                            search-result-no-image
                        "
                    >

                        No Image

                    </div>

                    `
                }

            </div>



            <!-- INFO -->

            <div
                class="search-result-info"
            >

                <div
                    class="search-result-name"
                >

                    ${escapeHtml(
                        name
                    )}

                </div>


                ${
                    price !== ""

                    ?

                    `

                    <div
                        class="
                            search-result-price
                        "
                    >

                        ₹${escapeHtml(
                            String(
                                price
                            )
                        )}

                    </div>

                    `

                    :

                    ""

                }

            </div>



            <!-- ARROW -->

            <span
                class="search-result-arrow"
                aria-hidden="true"
            >

                ›

            </span>


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

    if(
        product.link
    ){

        return product.link;

    }


    return `product?id=${encodeURIComponent(
        product.id
    )}`;

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
    GLOBAL EXPORTS
==================================================*/

window.openSearch =
    openSearch;


window.closeSearch =
    closeSearch;


/*==================================================
    EXPORT
==================================================*/

export {

    initTopbar,

    openSearch,

    closeSearch

};