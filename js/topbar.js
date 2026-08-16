/*==================================================
    COMMON TOPBAR + SIDEBAR + SEARCH
==================================================*/

import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


/*==================================================
    STATE
==================================================*/

let searchProducts = [];

let searchProductsLoaded = false;

let searchLoading = false;

let categoriesLoaded = false;

let tagsLoaded = false;


/*==================================================
    DOM READY
==================================================*/

document.addEventListener(
    "DOMContentLoaded",
    initTopbar
);


/*==================================================
    INIT
==================================================*/

async function initTopbar(){

    console.log(
        "✅ Common Topbar / Sidebar / Search loaded"
    );


    initMenu();

    initSearch();

    initSidebarToggles();

    await loadSidebarCategories();

    await loadSidebarTags();

}


/*==================================================
    MENU
==================================================*/

function initMenu(){

    const menuButton =
        document.getElementById(
            "menuButton"
        );


    const closeButton =
        document.getElementById(
            "closeSidebarButton"
        );


    const overlay =
        document.getElementById(
            "overlay"
        );


    /*==================================================
        OPEN MENU
    ==================================================*/

    menuButton?.addEventListener(
        "click",
        openSidebar
    );


    /*==================================================
        CLOSE BUTTON
    ==================================================*/

    closeButton?.addEventListener(
        "click",
        closeSidebar
    );


    /*==================================================
        OVERLAY CLICK
    ==================================================*/

    overlay?.addEventListener(
        "click",
        closeSidebar
    );


    /*==================================================
        ESCAPE
    ==================================================*/

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

}


/*==================================================
    OPEN SIDEBAR
==================================================*/

function openSidebar(){

    const sidebar =
        document.getElementById(
            "sidebar"
        );


    const overlay =
        document.getElementById(
            "overlay"
        );


    if(!sidebar){

        return;

    }


    /*
        Support both:
        .open
        .active
    */

    sidebar.classList.add(
        "open"
    );

    sidebar.classList.add(
        "active"
    );


    if(overlay){

        overlay.classList.add(
            "show"
        );

        overlay.classList.add(
            "active"
        );

    }


    document.body.classList.add(
        "sidebar-open"
    );

}


/*==================================================
    CLOSE SIDEBAR
==================================================*/

function closeSidebar(){

    const sidebar =
        document.getElementById(
            "sidebar"
        );


    const overlay =
        document.getElementById(
            "overlay"
        );


    sidebar?.classList.remove(
        "open"
    );


    sidebar?.classList.remove(
        "active"
    );


    overlay?.classList.remove(
        "show"
    );


    overlay?.classList.remove(
        "active"
    );


    document.body.classList.remove(
        "sidebar-open"
    );

}


/*==================================================
    GLOBAL SIDEBAR FUNCTIONS
==================================================*/

window.toggleSidebar =
function(){

    const sidebar =
        document.getElementById(
            "sidebar"
        );


    if(
        sidebar?.classList.contains("open") ||
        sidebar?.classList.contains("active")
    ){

        closeSidebar();

    }
    else{

        openSidebar();

    }

};


window.openSidebar =
openSidebar;


window.closeSidebar =
closeSidebar;


/*==================================================
    SIDEBAR CATEGORY / TAG TOGGLES
==================================================*/

function initSidebarToggles(){

    const categoriesToggle =
        document.getElementById(
            "categoriesToggle"
        );


    const tagsToggle =
        document.getElementById(
            "tagsToggle"
        );


    categoriesToggle?.addEventListener(
        "click",
        () => {

            toggleSidebarSection(
                categoriesToggle,
                "sidebarCategories"
            );

        }
    );


    tagsToggle?.addEventListener(
        "click",
        () => {

            toggleSidebarSection(
                tagsToggle,
                "sidebarTags"
            );

        }
    );

}


/*==================================================
    TOGGLE SIDEBAR SECTION
==================================================*/

function toggleSidebarSection(
    button,
    targetId
){

    const target =
        document.getElementById(
            targetId
        );


    if(!target){

        return;

    }


    const isOpen =
        target.classList.contains(
            "open"
        );


    target.classList.toggle(
        "open",
        !isOpen
    );


    button.classList.toggle(
        "active",
        !isOpen
    );

}


/*==================================================
    LOAD SIDEBAR CATEGORIES
==================================================*/

async function loadSidebarCategories(){

    if(categoriesLoaded){

        return;

    }


    const container =
        document.getElementById(
            "sidebarCategories"
        );


    if(!container){

        return;

    }


    try{

        container.innerHTML = `

            <div class="sidebar-loading">

                Loading categories...

            </div>

        `;


        const snapshot =
            await getDocs(
                query(
                    collection(
                        db,
                        "categories"
                    ),
                    orderBy(
                        "order"
                    )
                )
            );


        const categories =
            snapshot.docs.map(
                docSnap => ({

                    id:
                        docSnap.id,

                    ...docSnap.data()

                })
            );


        const mainCategories =
            categories.filter(
                category =>
                    !category.parentId
            );


        const subCategories =
            categories.filter(
                category =>
                    category.parentId
            );


        categoriesLoaded =
            true;


        renderSidebarCategories(
            container,
            mainCategories,
            subCategories
        );

    }

    catch(error){

        console.error(
            "Sidebar categories error:",
            error
        );


        container.innerHTML = `

            <div class="sidebar-error">

                Unable to load categories.

            </div>

        `;

    }

}


/*==================================================
    RENDER SIDEBAR CATEGORIES
==================================================*/

function renderSidebarCategories(
    container,
    mainCategories,
    subCategories
){

    container.innerHTML = "";


    if(!mainCategories.length){

        container.innerHTML = `

            <div class="sidebar-empty">

                No categories found.

            </div>

        `;

        return;

    }


    mainCategories.forEach(
        category => {

            const children =
                subCategories.filter(
                    sub =>
                        sub.parentId ===
                        category.id
                );


            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "sidebar-category-row";


            /*==================================================
                MAIN CATEGORY LINK
            ==================================================*/

            const link =
                document.createElement(
                    "a"
                );


            link.href =
                `shop?category=${encodeURIComponent(
                    category.id
                )}`;


            link.innerHTML = `

                <i class="fa-solid fa-folder"></i>

                <span>
                    ${escapeHtml(
                        category.name ||
                        "Category"
                    )}
                </span>

            `;


            link.addEventListener(
                "click",
                closeSidebar
            );


            row.appendChild(
                link
            );


            /*==================================================
                SUBCATEGORY TOGGLE
            ==================================================*/

            if(children.length){

                const toggle =
                    document.createElement(
                        "button"
                    );


                toggle.type =
                    "button";


                toggle.className =
                    "sidebar-category-toggle";


                toggle.setAttribute(
                    "aria-label",
                    "Show subcategories"
                );


                toggle.innerHTML = `

                    <i class="
                        fa-solid
                        fa-chevron-down
                    "></i>

                `;


                const childrenBox =
                    document.createElement(
                        "div"
                    );


                childrenBox.className =
                    "sidebar-category-children";


                children.forEach(
                    sub => {

                        const subLink =
                            document.createElement(
                                "a"
                            );


                        subLink.href =
                            `shop?category=${encodeURIComponent(
                                category.id
                            )}&sub=${encodeURIComponent(
                                sub.id
                            )}`;


                        subLink.innerHTML = `

                            <i class="
                                fa-solid
                                fa-angle-right
                            "></i>

                            <span>
                                ${escapeHtml(
                                    sub.name ||
                                    "Subcategory"
                                )}
                            </span>

                        `;


                        subLink.addEventListener(
                            "click",
                            closeSidebar
                        );


                        childrenBox.appendChild(
                            subLink
                        );

                    }
                );


                toggle.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        event.stopPropagation();


                        const isOpen =
                            childrenBox.classList.contains(
                                "open"
                            );


                        childrenBox.classList.toggle(
                            "open",
                            !isOpen
                        );


                        toggle.classList.toggle(
                            "active",
                            !isOpen
                        );

                    }
                );


                row.appendChild(
                    toggle
                );


                container.appendChild(
                    row
                );


                container.appendChild(
                    childrenBox
                );

            }
            else{

                container.appendChild(
                    row
                );

            }

        }
    );

}


/*==================================================
    LOAD SIDEBAR TAGS
==================================================*/

async function loadSidebarTags(){

    if(tagsLoaded){

        return;

    }


    const container =
        document.getElementById(
            "sidebarTags"
        );


    if(!container){

        return;

    }


    try{

        container.innerHTML = `

            <div class="sidebar-loading">

                Loading tags...

            </div>

        `;


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "tags"
                )
            );


        const tags =
            snapshot.docs.map(
                docSnap => ({

                    id:
                        docSnap.id,

                    ...docSnap.data()

                })
            );


        tagsLoaded =
            true;


        renderSidebarTags(
            container,
            tags
        );

    }

    catch(error){

        console.error(
            "Sidebar tags error:",
            error
        );


        container.innerHTML = `

            <div class="sidebar-error">

                Unable to load tags.

            </div>

        `;

    }

}


/*==================================================
    RENDER SIDEBAR TAGS
==================================================*/

function renderSidebarTags(
    container,
    tags
){

    container.innerHTML = "";


    if(!tags.length){

        container.innerHTML = `

            <div class="sidebar-empty">

                No tags found.

            </div>

        `;

        return;

    }


    tags.forEach(
        tag => {

            const slug =
                tag.slug ||
                tag.id ||
                "";


            const link =
                document.createElement(
                    "a"
                );


            link.className =
                "sidebar-tag-link";


            link.href =
                `shop?tag=${encodeURIComponent(
                    slug
                )}`;


            link.innerHTML = `

                <i class="
                    fa-solid
                    fa-tag
                "></i>

                <span>

                    ${escapeHtml(
                        tag.name ||
                        slug ||
                        "Tag"
                    )}

                </span>

            `;


            link.addEventListener(
                "click",
                closeSidebar
            );


            container.appendChild(
                link
            );

        }
    );

}


/*==================================================
    SEARCH INIT
==================================================*/

function initSearch(){

    const searchButton =
        document.getElementById(
            "searchButton"
        );


    searchButton?.addEventListener(
        "click",
        openSearch
    );


    /*
        Existing HTML search close button
    */

    const closeButton =
        document.getElementById(
            "closeSearchButton"
        );


    closeButton?.addEventListener(
        "click",
        closeSearch
    );


    /*
        Existing search overlay
    */

    const existingOverlay =
        document.getElementById(
            "searchOverlay"
        );


    existingOverlay?.addEventListener(
        "click",
        event => {

            if(
                event.target ===
                existingOverlay
            ){

                closeSearch();

            }

        }
    );

}


/*==================================================
    CREATE / PREPARE SEARCH UI
==================================================*/

function prepareSearchOverlay(){

    let overlay =
        document.getElementById(
            "searchOverlay"
        );


    /*==================================================
        CREATE IF NOT IN HTML
    ==================================================*/

    if(!overlay){

        overlay =
            document.createElement(
                "div"
            );


        overlay.id =
            "searchOverlay";


        overlay.className =
            "search-overlay";


        document.body.appendChild(
            overlay
        );

    }


    /*==================================================
        CREATE SEARCH PANEL IF NEEDED
    ==================================================*/

    let panel =
        overlay.querySelector(
            ".search-panel"
        );


    if(!panel){

        panel =
            document.createElement(
                "div"
            );


        panel.className =
            "search-panel";


        panel.innerHTML = `

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


            <div class="search-input-wrap">

                <span class="search-input-icon">

                    🔍

                </span>


                <input
                    type="search"
                    id="searchInput"
                    class="search-input"
                    placeholder="Search products..."
                    autocomplete="off"
                >


                <button
                    type="button"
                    id="clearSearchButton"
                    class="clear-search-button"
                    aria-label="Clear search"
                >

                    ×

                </button>

            </div>


            <div
                id="searchResults"
                class="search-results"
            >

                <div class="search-empty">

                    Type to search products

                </div>

            </div>

        `;


        overlay.innerHTML = "";


        overlay.appendChild(
            panel
        );

    }


    /*
        If your existing home.html has
        the simple .search-box, convert it
        to the full search UI.
    */

    else{

        ensureSearchElements(
            panel
        );

    }


    /*==================================================
        CLOSE
    ==================================================*/

    document
        .getElementById(
            "searchCloseButton"
        )
        ?.addEventListener(
            "click",
            closeSearch
        );


    document
        .getElementById(
            "closeSearchButton"
        )
        ?.addEventListener(
            "click",
            closeSearch
        );


    /*==================================================
        INPUT
    ==================================================*/

    const input =
        document.getElementById(
            "searchInput"
        );


    if(
        input &&
        !input.dataset.searchInitialized
    ){

        input.dataset.searchInitialized =
            "true";


        input.addEventListener(
            "input",
            handleSearchInput
        );

    }


    /*==================================================
        CLEAR
    ==================================================*/

    const clearButton =
        document.getElementById(
            "clearSearchButton"
        );


    if(
        clearButton &&
        !clearButton.dataset.searchInitialized
    ){

        clearButton.dataset.searchInitialized =
            "true";


        clearButton.addEventListener(
            "click",
            clearSearch
        );

    }


    return overlay;

}


/*==================================================
    ENSURE SEARCH ELEMENTS
==================================================*/

function ensureSearchElements(
    panel
){

    let results =
        document.getElementById(
            "searchResults"
        );


    if(!results){

        results =
            document.createElement(
                "div"
            );


        results.id =
            "searchResults";


        results.className =
            "search-results";


        results.innerHTML = `

            <div class="search-empty">

                Type to search products

            </div>

        `;


        panel.appendChild(
            results
        );

    }

}


/*==================================================
    OPEN SEARCH
==================================================*/

async function openSearch(){

    const overlay =
        prepareSearchOverlay();


    if(!overlay){

        return;

    }


    overlay.classList.add(
        "open"
    );


    overlay.classList.add(
        "active"
    );


    document.body.classList.add(
        "search-open"
    );


    const input =
        document.getElementById(
            "searchInput"
        );


    setTimeout(
        () => {

            input?.focus();

        },
        100
    );


    /*==================================================
        LOAD PRODUCTS
    ==================================================*/

    if(
        !searchProductsLoaded
    ){

        await loadSearchProducts();

    }

}


/*==================================================
    CLOSE SEARCH
==================================================*/

function closeSearch(){

    const overlay =
        document.getElementById(
            "searchOverlay"
        );


    if(!overlay){

        return;

    }


    overlay.classList.remove(
        "open"
    );


    overlay.classList.remove(
        "active"
    );


    document.body.classList.remove(
        "search-open"
    );

}


window.openSearch =
openSearch;


window.closeSearch =
closeSearch;


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


    searchLoading =
        true;


    const results =
        document.getElementById(
            "searchResults"
        );


    if(results){

        results.innerHTML = `

            <div class="search-loading">

                Loading products...

            </div>

        `;

    }


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
            `✅ Search loaded ${searchProducts.length} products`
        );


        const input =
            document.getElementById(
                "searchInput"
            );


        if(
            input &&
            input.value.trim()
        ){

            handleSearchInput({
                target: input
            });

        }
        else{

            showSearchEmpty();

        }

    }

    catch(error){

        console.error(
            "Search products error:",
            error
        );


        if(results){

            results.innerHTML = `

                <div class="search-error">

                    Unable to load products.

                </div>

            `;

        }

    }

    finally{

        searchLoading =
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


    const clearButton =
        document.getElementById(
            "clearSearchButton"
        );


    if(clearButton){

        clearButton.style.display =
            query
                ? "flex"
                : "none";

    }


    if(!query){

        showSearchEmpty();

        return;

    }


    if(!searchProductsLoaded){

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
        matched
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

    const results =
        document.getElementById(
            "searchResults"
        );


    if(!results){

        return;

    }


    if(!products.length){

        const input =
            document.getElementById(
                "searchInput"
            );


        const query =
            input?.value.trim();


        results.innerHTML = `

            <div class="search-empty">

                ${
                    query
                    ?
                    "No products found."
                    :
                    "Type to search products"
                }

            </div>

        `;


        return;

    }


    results.innerHTML = `

        <div class="search-results-count">

            ${products.length}
            ${
                products.length === 1
                ? "product"
                : "products"
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

    `;


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


                        if(!productId){

                            return;

                        }


                        window.location.href =
                            getProductLinkById(
                                productId
                            );

                    }
                );

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


            <div class="search-result-info">

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


            <span
                class="search-result-arrow"
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

function getProductLinkById(
    id
){

    return `product?id=${encodeURIComponent(
        id
    )}`;

}


/*==================================================
    PRODUCT TAGS
==================================================*/

function getProductTags(
    product
){

    let tags = [];


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
                );

            }


            return String(
                tag
            );

        }
    );

}


/*==================================================
    CLEAR SEARCH
==================================================*/

function clearSearch(){

    const input =
        document.getElementById(
            "searchInput"
        );


    if(input){

        input.value =
            "";

        input.focus();

    }


    const clearButton =
        document.getElementById(
            "clearSearchButton"
        );


    if(clearButton){

        clearButton.style.display =
            "none";

    }


    showSearchEmpty();

}


/*==================================================
    EMPTY SEARCH
==================================================*/

function showSearchEmpty(){

    const results =
        document.getElementById(
            "searchResults"
        );


    if(!results){

        return;

    }


    results.innerHTML = `

        <div class="search-empty">

            Type to search products

        </div>

    `;

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
    EXPORT
==================================================*/

export {

    initTopbar,

    openSidebar,

    closeSidebar,

    openSearch,

    closeSearch,

    loadSidebarCategories,

    loadSidebarTags

};