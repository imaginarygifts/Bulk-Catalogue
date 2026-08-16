import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";



/*==================================================
    ELEMENTS
==================================================*/

const grid =
    document.getElementById("productGrid");

const categoryBar =
    document.getElementById("categoryBar");

const subCategoryBar =
    document.getElementById("subCategoryBar");

const tagRow =
    document.getElementById("tagFilterRow");



/*==================================================
    STATE
==================================================*/

let visibleCount = 30;

const LOAD_STEP = 30;

let allProducts = [];

let allCategories = [];

let mainCategories = [];

let subCategories = [];


/*==================================================
    ACTIVE FILTERS
==================================================*/

let activeCategory = "all";

let activeSubCategory = "all";

let activeTag = "all";

let searchQuery = "";



/*==================================================
    URL FILTER SYSTEM
==================================================*/

/*
    Example:

    index?category=abc
    index?category=abc&sub=xyz
    index?tag=bestseller
    index?search=keychain

*/


/*==================================================
    READ FILTERS FROM URL
==================================================*/

function applyFiltersFromURL(){

    const params =
        new URLSearchParams(
            window.location.search
        );


    const category =
        params.get("category");

    const sub =
        params.get("sub");

    const tag =
        params.get("tag");

    const search =
        params.get("search");


    if(category){

        activeCategory =
            category;

    }


    if(sub){

        activeSubCategory =
            sub;

    }


    if(tag){

        activeTag =
            tag.toLowerCase();

    }


    if(search){

        searchQuery =
            search
                .toLowerCase()
                .trim();

    }

}



/*==================================================
    UPDATE URL
==================================================*/

function updateURL(){

    const url =
        new URL(
            window.location
        );


    /*----------------------------------------------
        CATEGORY
    ----------------------------------------------*/

    if(
        activeCategory !==
        "all"
    ){

        url.searchParams.set(
            "category",
            activeCategory
        );

    }
    else{

        url.searchParams.delete(
            "category"
        );

    }


    /*----------------------------------------------
        SUB CATEGORY
    ----------------------------------------------*/

    if(
        activeSubCategory !==
        "all"
    ){

        url.searchParams.set(
            "sub",
            activeSubCategory
        );

    }
    else{

        url.searchParams.delete(
            "sub"
        );

    }


    /*----------------------------------------------
        TAG
    ----------------------------------------------*/

    if(
        activeTag !==
        "all"
    ){

        url.searchParams.set(
            "tag",
            activeTag
        );

    }
    else{

        url.searchParams.delete(
            "tag"
        );

    }


    /*----------------------------------------------
        SEARCH
    ----------------------------------------------*/

    if(searchQuery){

        url.searchParams.set(
            "search",
            searchQuery
        );

    }
    else{

        url.searchParams.delete(
            "search"
        );

    }


    window.history.replaceState(
        {},
        "",
        url
    );

}



/*==================================================
    LOAD PRODUCTS
==================================================*/

async function loadProducts(){

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
            "Products loaded:",
            allProducts.length
        );

    }

    catch(error){

        console.error(
            "Error loading products:",
            error
        );


        allProducts = [];

    }

}



/*==================================================
    LOAD CATEGORIES
==================================================*/

async function loadCategories(){

    try{

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


        allCategories =
            snapshot.docs.map(
                docSnap => ({

                    id:
                        docSnap.id,

                    ...docSnap.data()

                })
            );


        /*------------------------------------------
            MAIN CATEGORIES
        ------------------------------------------*/

        mainCategories =
            allCategories.filter(
                category =>
                    !category.parentId
            );


        /*------------------------------------------
            SUB CATEGORIES
        ------------------------------------------*/

        subCategories =
            allCategories.filter(
                category =>
                    category.parentId
            );


        console.log(
            "Categories loaded:",
            allCategories.length
        );

    }

    catch(error){

        console.error(
            "Error loading categories:",
            error
        );


        allCategories = [];

        mainCategories = [];

        subCategories = [];

    }

}



/*==================================================
    LOAD TAGS
==================================================*/

async function loadTags(){

    if(!tagRow){

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
            snapshot.docs.map(
                docSnap => ({

                    id:
                        docSnap.id,

                    ...docSnap.data()

                })
            );


        renderTags(tags);

    }

    catch(error){

        console.error(
            "Error loading tags:",
            error
        );


        tagRow.innerHTML = "";

    }

}



/*==================================================
    MAIN CATEGORY BAR
==================================================*/

function renderMainCategories(){

    if(!categoryBar){

        return;

    }


    categoryBar.innerHTML = "";


    if(subCategoryBar){

        subCategoryBar.innerHTML = "";

    }


    /*----------------------------------------------
        ALL
    ----------------------------------------------*/

    categoryBar.appendChild(
        createMainCategoryButton(
            "All",
            "all"
        )
    );


    /*----------------------------------------------
        CATEGORIES
    ----------------------------------------------*/

    mainCategories.forEach(
        category => {

            categoryBar.appendChild(
                createMainCategoryButton(
                    category.name,
                    category.id
                )
            );

        }
    );

}



/*==================================================
    CREATE MAIN CATEGORY BUTTON
==================================================*/

function createMainCategoryButton(
    label,
    id
){

    const button =
        document.createElement(
            "div"
        );


    button.className =
        "category-pill";


    if(
        activeCategory ===
        id
    ){

        button.classList.add(
            "active"
        );

    }


    button.innerText =
        label;


    button.addEventListener(
        "click",
        () => {

            /*--------------------------------------
                CHANGE CATEGORY
            --------------------------------------*/

            activeCategory =
                id;


            /*--------------------------------------
                RESET SUBCATEGORY
            --------------------------------------*/

            activeSubCategory =
                "all";


            /*--------------------------------------
                RESET PAGINATION
            --------------------------------------*/

            visibleCount =
                30;


            /*--------------------------------------
                UPDATE UI
            --------------------------------------*/

            updateMainCategoryUI(
                button
            );


            renderSubCategories();

            renderProducts();

            updateURL();

        }
    );


    return button;

}



/*==================================================
    UPDATE MAIN CATEGORY UI
==================================================*/

function updateMainCategoryUI(
    activeButton
){

    if(!categoryBar){

        return;

    }


    categoryBar
        .querySelectorAll(
            ".category-pill"
        )
        .forEach(
            button => {

                button.classList.remove(
                    "active"
                );

            }
        );


    activeButton.classList.add(
        "active"
    );

}



/*==================================================
    SUBCATEGORY BAR
==================================================*/

function renderSubCategories(){

    if(!subCategoryBar){

        return;

    }


    subCategoryBar.innerHTML = "";


    /*----------------------------------------------
        ALL CATEGORIES
    ----------------------------------------------*/

    if(
        activeCategory ===
        "all"
    ){

        return;

    }


    const subs =
        subCategories.filter(
            subCategory =>
                subCategory.parentId ===
                activeCategory
        );


    if(!subs.length){

        return;

    }


    /*----------------------------------------------
        ALL
    ----------------------------------------------*/

    subCategoryBar.appendChild(
        createSubCategoryButton(
            "All",
            "all"
        )
    );


    /*----------------------------------------------
        SUBCATEGORIES
    ----------------------------------------------*/

    subs.forEach(
        subCategory => {

            subCategoryBar.appendChild(
                createSubCategoryButton(
                    subCategory.name,
                    subCategory.id
                )
            );

        }
    );

}



/*==================================================
    CREATE SUBCATEGORY BUTTON
==================================================*/

function createSubCategoryButton(
    label,
    id
){

    const button =
        document.createElement(
            "div"
        );


    button.className =
        "subcategory-pill";


    if(
        activeSubCategory ===
        id
    ){

        button.classList.add(
            "active"
        );

    }


    button.innerText =
        label;


    button.addEventListener(
        "click",
        () => {

            activeSubCategory =
                id;


            visibleCount =
                30;


            updateSubCategoryUI(
                button
            );


            renderProducts();

            updateURL();

        }
    );


    return button;

}



/*==================================================
    UPDATE SUBCATEGORY UI
==================================================*/

function updateSubCategoryUI(
    activeButton
){

    if(!subCategoryBar){

        return;

    }


    subCategoryBar
        .querySelectorAll(
            ".subcategory-pill"
        )
        .forEach(
            button => {

                button.classList.remove(
                    "active"
                );

            }
        );


    activeButton.classList.add(
        "active"
    );

}



/*==================================================
    TAGS
==================================================*/

function renderTags(
    tags
){

    if(!tagRow){

        return;

    }


    tagRow.innerHTML = "";


    /*----------------------------------------------
        ALL TAG
    ----------------------------------------------*/

    const allChip =
        document.createElement(
            "div"
        );


    allChip.className =
        "tag-chip";


    if(
        activeTag ===
        "all"
    ){

        allChip.classList.add(
            "active"
        );

    }


    allChip.innerText =
        "All";


    allChip.addEventListener(
        "click",
        () => {

            activeTag =
                "all";


            visibleCount =
                30;


            updateTagUI();

            renderProducts();

            updateURL();

        }
    );


    tagRow.appendChild(
        allChip
    );


    /*----------------------------------------------
        TAG LIST
    ----------------------------------------------*/

    tags.forEach(
        tag => {

            if(!tag){

                return;

            }


            const slug =
                String(
                    tag.slug ||
                    tag.name ||
                    ""
                )
                .toLowerCase();


            if(!slug){

                return;

            }


            const chip =
                document.createElement(
                    "div"
                );


            chip.className =
                "tag-chip";


            if(
                activeTag ===
                slug
            ){

                chip.classList.add(
                    "active"
                );

            }


            chip.innerText =
                tag.name ||
                tag.slug;


            chip.addEventListener(
                "click",
                () => {

                    activeTag =
                        slug;


                    visibleCount =
                        30;


                    updateTagUI();

                    renderProducts();

                    updateURL();

                }
            );


            tagRow.appendChild(
                chip
            );

        }
    );

}



/*==================================================
    UPDATE TAG UI
==================================================*/

function updateTagUI(){

    if(!tagRow){

        return;

    }


    tagRow
        .querySelectorAll(
            ".tag-chip"
        )
        .forEach(
            chip => {

                chip.classList.remove(
                    "active"
                );

            }
        );


    const chips =
        tagRow.querySelectorAll(
            ".tag-chip"
        );


    chips.forEach(
        chip => {

            const text =
                chip.innerText
                    .trim()
                    .toLowerCase();


            if(
                activeTag ===
                text
            ){

                chip.classList.add(
                    "active"
                );

            }

        }
    );


    /*----------------------------------------------
        ALL
    ----------------------------------------------*/

    if(
        activeTag ===
        "all"
    ){

        chips[0]?.classList.add(
            "active"
        );

    }

}



/*==================================================
    PRODUCT FILTERING
==================================================*/

function getFilteredProducts(){

    return allProducts.filter(
        product => {

            /*--------------------------------------
                CATEGORY
            --------------------------------------*/

            if(
                activeCategory !==
                "all"
            ){

                const matchesCategory =

                    product.categoryId ===
                    activeCategory

                    ||

                    product.category?.id ===
                    activeCategory;


                if(!matchesCategory){

                    return false;

                }

            }


            /*--------------------------------------
                SUBCATEGORY
            --------------------------------------*/

            if(
                activeSubCategory !==
                "all"
            ){

                const matchesSubCategory =

                    product.subCategoryId ===
                    activeSubCategory

                    ||

                    product.subcategoryId ===
                    activeSubCategory

                    ||

                    product.subCategory?.id ===
                    activeSubCategory;


                if(!matchesSubCategory){

                    return false;

                }

            }


            /*--------------------------------------
                TAG
            --------------------------------------*/

            if(
                activeTag !==
                "all"
            ){

                const productTags =
                    getProductTags(
                        product
                    );


                if(
                    !productTags.includes(
                        activeTag
                    )
                ){

                    return false;

                }

            }


            /*--------------------------------------
                SEARCH
            --------------------------------------*/

            if(searchQuery){

                const searchableText = [

                    product.name,

                    product.title,

                    product.productName,

                    product.description,

                    product.shortDescription,

                    product.categoryName,

                    product.category?.name,

                    ...getProductTags(
                        product
                    )

                ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


                if(
                    !searchableText.includes(
                        searchQuery
                    )
                ){

                    return false;

                }

            }


            return true;

        }
    );

}



/*==================================================
    RENDER PRODUCTS
==================================================*/

function renderProducts(){

    if(!grid){

        return;

    }


    grid.innerHTML = "";


    const filtered =
        getFilteredProducts();


    /*----------------------------------------------
        EMPTY
    ----------------------------------------------*/

    if(
        !filtered.length
    ){

        grid.innerHTML = `

            <div class="store-empty">

                <p>
                    No products found
                </p>

            </div>

        `;


        removeLoadMoreButton();

        return;

    }


    /*----------------------------------------------
        VISIBLE PRODUCTS
    ----------------------------------------------*/

    const visibleProducts =
        filtered.slice(
            0,
            visibleCount
        );


    visibleProducts.forEach(
        product => {

            const card =
                createProductCard(
                    product
                );


            grid.appendChild(
                card
            );

        }
    );


    /*----------------------------------------------
        LOAD MORE
    ----------------------------------------------*/

    renderLoadMore(
        filtered.length
    );

}



/*==================================================
    CREATE PRODUCT CARD
==================================================*/

function createProductCard(
    product
){

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "product-card";


    /*----------------------------------------------
        PRODUCT IMAGE
    ----------------------------------------------*/

    const image =
        getProductImage(
            product
        );


    /*----------------------------------------------
        PRODUCT NAME
    ----------------------------------------------*/

    const name =
        product.name ||
        product.title ||
        "Product";


    /*----------------------------------------------
        BASE PRICE
    ----------------------------------------------*/

    const basePrice =
        product.basePrice ??
        product.originalPrice ??
        product.mrp ??
        product.pricing?.basePrice ??
        product.pricing?.mrp ??
        "";


    /*----------------------------------------------
        SALE PRICE
    ----------------------------------------------*/

    const salePrice =
        product.salePrice ??
        product.price ??
        product.pricing?.salePrice ??
        product.pricing?.price ??
        "";


    /*----------------------------------------------
        BESTSELLER
    ----------------------------------------------*/

    const productTags =
        getProductTags(
            product
        );


    const isBestseller =

        product.isBestseller === true

        ||

        product.bestseller === true

        ||

        product.bestSeller === true

        ||

        productTags.includes(
            "bestseller"
        );


    /*----------------------------------------------
        OUT OF STOCK
    ----------------------------------------------*/

    const outOfStock =
        product.inStock === false;


    /*----------------------------------------------
        DISCOUNT
    ----------------------------------------------*/

    let discount =
        0;


    if(
        basePrice !== ""
        &&
        salePrice !== ""
        &&
        Number(basePrice) >
        Number(salePrice)
    ){

        discount =
            Math.round(
                (
                    (
                        Number(basePrice) -
                        Number(salePrice)
                    )
                    /
                    Number(basePrice)
                )
                *
                100
            );

    }


    /*----------------------------------------------
        BADGES
    ----------------------------------------------*/

    let badges = "";


    if(isBestseller){

        badges += `

            <span
                class="badge bestseller"
            >
                🔥 Bestseller
            </span>

        `;

    }


    if(discount > 0){

        badges += `

            <span
                class="badge discount"
            >
                -${discount}%
            </span>

        `;

    }


    if(outOfStock){

        badges += `

            <span
                class="badge stock"
            >
                Out of Stock
            </span>

        `;

    }


    /*----------------------------------------------
        CARD HTML
    ----------------------------------------------*/

    card.innerHTML = `

        <div class="img-wrap">

            ${badges}


            ${
                image

                ?

                `
                <img
                    loading="lazy"
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
                <div class="product-no-image">

                    No Image

                </div>
                `
            }

        </div>


        <div class="product-card-info">

            <h4>

                ${escapeHtml(
                    name
                )}

            </h4>


            <div class="price-wrap">

                ${
                    salePrice !== ""
                    &&
                    basePrice !== ""
                    &&
                    Number(salePrice) <
                    Number(basePrice)

                    ?

                    `
                    <span class="sale">

                        ₹${escapeHtml(
                            String(
                                salePrice
                            )
                        )}

                    </span>

                    <span class="old">

                        ₹${escapeHtml(
                            String(
                                basePrice
                            )
                        )}

                    </span>
                    `

                    :

                    salePrice !== ""

                    ?

                    `
                    <span class="sale">

                        ₹${escapeHtml(
                            String(
                                salePrice
                            )
                        )}

                    </span>
                    `

                    :

                    basePrice !== ""

                    ?

                    `
                    <span class="sale">

                        ₹${escapeHtml(
                            String(
                                basePrice
                            )
                        )}

                    </span>
                    `

                    :

                    ""
                }

            </div>

        </div>

    `;


    /*----------------------------------------------
        CARD CLICK
    ----------------------------------------------*/

    card.addEventListener(
        "click",
        () => {

            window.location.href =
                `product?id=${encodeURIComponent(
                    product.id
                )}`;

        }
    );


    return card;

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


        if(
            typeof first ===
            "object"
        ){

            return (

                first?.url ||

                first?.src ||

                ""

            );

        }

    }


    return (

        product.image ||

        product.imageUrl ||

        product.thumbnail ||

        ""

    );

}



/*==================================================
    PRODUCT TAGS
==================================================*/

function getProductTags(
    product
){

    const tags = [];


    /*----------------------------------------------
        tags: []
    ----------------------------------------------*/

    if(
        Array.isArray(
            product.tags
        )
    ){

        tags.push(
            ...product.tags
        );

    }


    /*----------------------------------------------
        tag
    ----------------------------------------------*/

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


    /*----------------------------------------------
        NORMALIZE
    ----------------------------------------------*/

    return tags
        .map(
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
                    .toLowerCase()
                    .trim();

                }


                return String(
                    tag
                )
                .toLowerCase()
                .trim();

            }
        )
        .filter(Boolean);

}



/*==================================================
    LOAD MORE
==================================================*/

function renderLoadMore(
    total
){

    removeLoadMoreButton();


    if(
        visibleCount >=
        total
    ){

        return;

    }


    const button =
        document.createElement(
            "button"
        );


    button.id =
        "loadMoreBtn";


    button.className =
        "load-more-btn";


    button.type =
        "button";


    button.innerText =
        "Load More";


    button.addEventListener(
        "click",
        () => {

            visibleCount +=
                LOAD_STEP;


            renderProducts();

        }
    );


    grid.after(
        button
    );

}



/*==================================================
    REMOVE LOAD MORE
==================================================*/

function removeLoadMoreButton(){

    const button =
        document.getElementById(
            "loadMoreBtn"
        );


    if(button){

        button.remove();

    }

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
    INITIALIZE STORE
==================================================*/

async function initStore(){

    console.log(
        "✅ Store page initializing..."
    );


    /*----------------------------------------------
        READ URL FIRST
    ----------------------------------------------*/

    applyFiltersFromURL();


    /*----------------------------------------------
        LOAD DATA
    ----------------------------------------------*/

    await Promise.all([

        loadProducts(),

        loadCategories(),

        loadTags()

    ]);


    /*----------------------------------------------
        RENDER FILTERS
    ----------------------------------------------*/

    renderMainCategories();

    renderSubCategories();


    /*----------------------------------------------
        RENDER PRODUCTS
    ----------------------------------------------*/

    renderProducts();


    console.log(
        "✅ Store page loaded"
    );

}



/*==================================================
    START
==================================================*/

if(
    document.readyState ===
    "loading"
){

    document.addEventListener(
        "DOMContentLoaded",
        initStore
    );

}
else{

    initStore();

}



/*==================================================
    EXPORT
==================================================*/

export {

    initStore,

    renderProducts,

    renderMainCategories,

    renderSubCategories

};