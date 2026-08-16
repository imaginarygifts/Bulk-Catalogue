/*==================================================
    TOPBAR + SEARCH + SIDEBAR
    Combined System
==================================================*/


/*==================================================
    SIDEBAR
==================================================*/

function openSidebar(){

    const sidebar =
        document.getElementById("sidebar");

    const overlay =
        document.getElementById("overlay");

    if(!sidebar || !overlay){
        return;
    }

    sidebar.classList.add("open");

    overlay.classList.add("show");

    document.body.classList.add("sidebar-open");

}


function closeSidebar(){

    const sidebar =
        document.getElementById("sidebar");

    const overlay =
        document.getElementById("overlay");

    if(!sidebar || !overlay){
        return;
    }

    sidebar.classList.remove("open");

    overlay.classList.remove("show");

    document.body.classList.remove("sidebar-open");

}


window.toggleSidebar = function(){

    const sidebar =
        document.getElementById("sidebar");

    if(!sidebar){
        return;
    }

    if(sidebar.classList.contains("open")){

        closeSidebar();

    }
    else{

        openSidebar();

    }

};


/*==================================================
    SEARCH
==================================================*/

let searchProducts = [];

let searchProductsLoaded = false;

let searchLoading = false;


/*==================================================
    CREATE SEARCH OVERLAY
==================================================*/

function createSearchOverlay(){

    let overlay =
        document.getElementById(
            "searchOverlay"
        );


    if(overlay){

        return overlay;

    }


    overlay =
        document.createElement("div");


    overlay.id =
        "searchOverlay";


    overlay.className =
        "topbar-search-overlay";


    overlay.innerHTML = `

        <div class="topbar-search-panel">

            <div class="topbar-search-header">

                <div class="topbar-search-title">

                    Search Products

                </div>


                <button
                    type="button"
                    class="topbar-search-close"
                    id="topbarSearchCloseButton"
                    aria-label="Close search"
                >

                    <i class="fa-solid fa-xmark"></i>

                </button>

            </div>


            <div class="topbar-search-input-wrap">

                <i class="fa-solid fa-magnifying-glass"></i>


                <input
                    type="search"
                    id="topbarSearchInput"
                    class="topbar-search-input"
                    placeholder="Search products..."
                    autocomplete="off"
                >


                <button
                    type="button"
                    id="topbarClearSearchButton"
                    class="topbar-clear-search"
                    aria-label="Clear search"
                >

                    <i class="fa-solid fa-xmark"></i>

                </button>

            </div>


            <div
                id="topbarSearchResults"
                class="topbar-search-results"
            >

                <div class="topbar-search-empty">

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

    document
        .getElementById(
            "topbarSearchCloseButton"
        )
        ?.addEventListener(
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

    overlay.addEventListener(
        "keydown",
        event => {

            if(
                event.key ===
                "Escape"
            ){

                closeSearch();

            }

        }
    );


    /*==================================================
        SEARCH INPUT
    ==================================================*/

    document
        .getElementById(
            "topbarSearchInput"
        )
        ?.addEventListener(
            "input",
            handleSearchInput
        );


    /*==================================================
        CLEAR SEARCH
    ==================================================*/

    document
        .getElementById(
            "topbarClearSearchButton"
        )
        ?.addEventListener(
            "click",
            () => {

                const input =
                    document.getElementById(
                        "topbarSearchInput"
                    );


                if(input){

                    input.value = "";

                    input.focus();

                }


                renderSearchResults([]);

            }
        );


    return overlay;

}


/*==================================================
    OPEN SEARCH
==================================================*/

window.openSearch = function(){

    const overlay =
        createSearchOverlay();


    overlay.classList.add("open");


    overlay.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "search-open"
    );


    const input =
        document.getElementById(
            "topbarSearchInput"
        );


    setTimeout(
        () => {

            input?.focus();

        },
        100
    );


    /*==================================================
        LOAD PRODUCTS ONLY ON FIRST OPEN
    ==================================================*/

    if(
        !searchProductsLoaded &&
        !searchLoading
    ){

        loadSearchProducts();

    }

};


/*==================================================
    CLOSE SEARCH
==================================================*/

window.closeSearch = function(){

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


    overlay.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.classList.remove(
        "search-open"
    );

};


/*==================================================
    LOAD PRODUCTS
==================================================*/

async function loadSearchProducts(){

    if(
        searchLoading ||
        searchProductsLoaded
    ){

        return;

    }


    searchLoading = true;


    const results =
        document.getElementById(
            "topbarSearchResults"
        );


    if(results){

        results.innerHTML = `

            <div class="topbar-search-loading">

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


        searchProductsLoaded = true;


        const input =
            document.getElementById(
                "topbarSearchInput"
            );


        if(
            input &&
            input.value.trim()
        ){

            handleSearchInput({

                target: input

            });

        }
        else if(results){

            results.innerHTML = `

                <div class="topbar-search-empty">

                    Type to search products

                </div>

            `;

        }

    }
    catch(error){

        console.error(
            "Search products error:",
            error
        );


        if(results){

            results.innerHTML = `

                <div class="topbar-search-error">

                    Unable to load products.

                </div>

            `;

        }

    }
    finally{

        searchLoading = false;

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


    const clearButton =
        document.getElementById(
            "topbarClearSearchButton"
        );


    if(clearButton){

        clearButton.style.display =
            query
                ? "flex"
                : "none";

    }


    if(!query){

        renderSearchResults([]);

        return;

    }


    if(!searchProductsLoaded){

        const results =
            document.getElementById(
                "topbarSearchResults"
            );


        if(results){

            results.innerHTML = `

                <div class="topbar-search-loading">

                    Loading products...

                </div>

            `;

        }

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
    PRODUCT MATCH
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
    PRODUCT TAGS
==================================================*/

function getProductTags(product){

    if(
        Array.isArray(
            product.tags
        )
    ){

        return product.tags
            .map(tag => {

                if(
                    typeof tag ===
                    "string"
                ){

                    return tag;

                }

                if(
                    tag &&
                    typeof tag ===
                    "object"
                ){

                    return (
                        tag.name ||
                        tag.title ||
                        tag.label ||
                        ""
                    );

                }

                return "";

            })
            .filter(Boolean);

    }


    if(
        typeof product.tags ===
        "string"
    ){

        return product.tags
            .split(",")
            .map(tag => tag.trim())
            .filter(Boolean);

    }


    return [];

}


/*==================================================
    RENDER SEARCH RESULTS
==================================================*/

function renderSearchResults(products){

    const results =
        document.getElementById(
            "topbarSearchResults"
        );


    if(!results){

        return;

    }


    if(!products.length){

        const input =
            document.getElementById(
                "topbarSearchInput"
            );


        const query =
            input?.value.trim();


        results.innerHTML = `

            <div class="topbar-search-empty">

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


    results.innerHTML =
        products
            .map(
                product =>
                    createSearchResult(
                        product
                    )
            )
            .join("");


    results
        .querySelectorAll(
            ".topbar-search-result"
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

}


/*==================================================
    SEARCH RESULT CARD
==================================================*/

function createSearchResult(product){

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
            class="topbar-search-result"
            data-product-id="${escapeAttribute(
                product.id
            )}"
        >

            <div class="topbar-search-result-image">

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
                            topbar-search-no-image
                        "
                    >

                        No Image

                    </div>

                    `
                }

            </div>


            <div class="topbar-search-result-info">

                <div
                    class="
                        topbar-search-result-name
                    "
                >

                    ${escapeHtml(name)}

                </div>


                ${
                    price !== ""

                    ?

                    `

                    <div
                        class="
                            topbar-search-result-price
                        "
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


            <span
                class="
                    topbar-search-result-arrow
                "
            >

                ›

            </span>

        </button>

    `;

}


/*==================================================
    SIDEBAR CATEGORY / TAGS
==================================================*/

let sidebarCategoriesLoaded = false;

let sidebarTagsLoaded = false;


/*==================================================
    LOAD SIDEBAR CATEGORIES
==================================================*/

async function loadSidebarCategories(){

    if(sidebarCategoriesLoaded){

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

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "categories"
                )
            );


        const categories =
            snapshot.docs
                .map(
                    docSnap => ({

                        id:
                            docSnap.id,

                        ...docSnap.data()

                    })
                )
                .filter(
                    category =>
                        category.active !== false
                );


        if(!categories.length){

            container.innerHTML = `

                <div class="sidebar-empty">

                    No categories found.

                </div>

            `;

            sidebarCategoriesLoaded = true;

            return;

        }


        container.innerHTML =
            categories
                .map(
                    category =>
                        createSidebarCategory(
                            category,
                            categories
                        )
                )
                .join("");


        sidebarCategoriesLoaded = true;


        setupSidebarCategoryButtons();

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
    CREATE SIDEBAR CATEGORY
==================================================*/

function createSidebarCategory(
    category,
    allCategories
){

    const id =
        category.id;


    const name =
        category.name ||
        category.title ||
        "Category";


    const slug =
        category.slug ||
        category.slugName ||
        id;


    const children =
        allCategories.filter(
            child =>
                child.parentId === id ||
                child.parentCategoryId === id
        );


    const categoryLink =
        `category?category=${encodeURIComponent(
            slug
        )}`;


    return `

        <div class="sidebar-category-row">

            <a
                href="${escapeAttribute(
                    categoryLink
                )}"
            >

                <i class="fa-solid fa-folder"></i>

                <span>

                    ${escapeHtml(name)}

                </span>

            </a>


            ${
                children.length

                ?

                `

                <button
                    type="button"
                    class="
                        sidebar-category-toggle
                    "
                    data-category-toggle="${escapeAttribute(
                        id
                    )}"
                    aria-label="Expand ${escapeAttribute(
                        name
                    )}"
                >

                    <i class="
                        fa-solid
                        fa-chevron-down
                    "></i>

                </button>

                `

                :

                ""

            }

        </div>


        ${
            children.length

            ?

            `

            <div
                class="
                    sidebar-category-children
                "
                data-category-children="${escapeAttribute(
                    id
                )}"
            >

                ${
                    children
                        .map(
                            child => {

                                const childName =
                                    child.name ||
                                    child.title ||
                                    "Subcategory";


                                const childSlug =
                                    child.slug ||
                                    child.slugName ||
                                    child.id;


                                return `

                                    <a
                                        href="category?category=${encodeURIComponent(
                                            childSlug
                                        )}"
                                    >

                                        <i class="
                                            fa-solid
                                            fa-angle-right
                                        "></i>

                                        <span>

                                            ${escapeHtml(
                                                childName
                                            )}

                                        </span>

                                    </a>

                                `;

                            }
                        )
                        .join("")

                }

            </div>

            `

            :

            ""

        }

    `;

}


/*==================================================
    SETUP CATEGORY BUTTONS
==================================================*/

function setupSidebarCategoryButtons(){

    document
        .querySelectorAll(
            ".sidebar-category-toggle"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        event.stopPropagation();


                        const id =
                            button.dataset.categoryToggle;


                        const children =
                            document.querySelector(
                                `[data-category-children="${CSS.escape(
                                    id
                                )}"]`
                            );


                        if(!children){

                            return;

                        }


                        button.classList.toggle(
                            "active"
                        );


                        children.classList.toggle(
                            "open"
                        );

                    }
                );

            }
        );

}


/*==================================================
    LOAD SIDEBAR TAGS
==================================================*/

async function loadSidebarTags(){

    if(sidebarTagsLoaded){

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

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "tags"
                )
            );


        const tags =
            snapshot.docs
                .map(
                    docSnap => ({

                        id:
                            docSnap.id,

                        ...docSnap.data()

                    })
                )
                .filter(
                    tag =>
                        tag.active !== false
                );


        if(!tags.length){

            container.innerHTML = `

                <div class="sidebar-empty">

                    No tags found.

                </div>

            `;

            sidebarTagsLoaded = true;

            return;

        }


        container.innerHTML =
            tags
                .map(
                    tag => {

                        const name =
                            tag.name ||
                            tag.title ||
                            tag.label ||
                            "Tag";


                        const slug =
                            tag.slug ||
                            tag.slugName ||
                            tag.id;


                        return `

                            <a
                                class="sidebar-tag-link"
                                href="tag?tag=${encodeURIComponent(
                                    slug
                                )}"
                            >

                                <i class="
                                    fa-solid
                                    fa-tag
                                "></i>

                                <span>

                                    ${escapeHtml(
                                        name
                                    )}

                                </span>

                            </a>

                        `;

                    }
                )
                .join("");


        sidebarTagsLoaded = true;

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
    SIDEBAR INITIALIZATION
==================================================*/

function initializeTopbar(){

    const menuButton =
        document.getElementById(
            "menuButton"
        );


    const closeSidebarButton =
        document.getElementById(
            "closeSidebarButton"
        );


    const overlay =
        document.getElementById(
            "overlay"
        );


    const searchButton =
        document.getElementById(
            "searchButton"
        );


    const categoriesToggle =
        document.getElementById(
            "categoriesToggle"
        );


    const tagsToggle =
        document.getElementById(
            "tagsToggle"
        );


    /*==================================================
        MENU
    ==================================================*/

    menuButton?.addEventListener(
        "click",
        openSidebar
    );


    closeSidebarButton?.addEventListener(
        "click",
        closeSidebar
    );


    overlay?.addEventListener(
        "click",
        closeSidebar
    );


    /*==================================================
        SEARCH
    ==================================================*/

    searchButton?.addEventListener(
        "click",
        openSearch
    );


    /*==================================================
        CATEGORIES
    ==================================================*/

    categoriesToggle?.addEventListener(
        "click",
        () => {

            categoriesToggle.classList.toggle(
                "active"
            );


            const submenu =
                document.getElementById(
                    "sidebarCategories"
                );


            if(submenu){

                submenu.classList.toggle(
                    "open"
                );

            }


            if(
                categoriesToggle.classList.contains(
                    "active"
                )
            ){

                loadSidebarCategories();

            }

        }
    );


    /*==================================================
        TAGS
    ==================================================*/

    tagsToggle?.addEventListener(
        "click",
        () => {

            tagsToggle.classList.toggle(
                "active"
            );


            const submenu =
                document.getElementById(
                    "sidebarTags"
                );


            if(submenu){

                submenu.classList.toggle(
                    "open"
                );

            }


            if(
                tagsToggle.classList.contains(
                    "active"
                )
            ){

                loadSidebarTags();

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
                event.key !==
                "Escape"
            ){

                return;

            }


            closeSidebar();

            closeSearch();

        }
    );


    /*==================================================
        WINDOW RESIZE
    ==================================================*/

    window.addEventListener(
        "resize",
        () => {

            if(
                window.innerWidth >
                900
            ){

                closeSidebar();

            }

        }
    );

}


/*==================================================
    INITIALIZE
==================================================*/

if(
    document.readyState ===
    "loading"
){

    document.addEventListener(
        "DOMContentLoaded",
        initializeTopbar
    );

}
else{

    initializeTopbar();

}
