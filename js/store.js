import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


/*==================================================
    STORE / SHOP SYSTEM

    IMPORTANT:
    This file handles ONLY:

    • Products
    • Categories
    • Subcategories
    • Tags
    • Product filtering
    • Product rendering
    • Load More
    • URL filters

    Topbar / Menu / Logo / Search are NOT handled here.

    Topbar:
        js/topbar.js

    Sidebar:
        js/sidebar.js
==================================================*/


/*==================================================
    ELEMENTS
==================================================*/

const grid =
    document.getElementById(
        "productGrid"
    );


const categoryBar =
    document.getElementById(
        "categoryBar"
    );


const subCategoryBar =
    document.getElementById(
        "subCategoryBar"
    );


const tagRow =
    document.getElementById(
        "tagFilterRow"
    );


/*==================================================
    STATE
==================================================*/

let visibleCount =
    30;


const LOAD_STEP =
    30;


let allProducts =
    [];


let allCategories =
    [];


let mainCategories =
    [];


let subCategories =
    [];


let activeCategory =
    "all";


let activeSubCategory =
    "all";


let activeTag =
    "all";


/*
    Search value is still maintained here
    because the shop page can receive:

        ?search=keyword

    The new topbar.js will navigate to the shop
    using this URL parameter.
*/

let searchQuery =
    "";


/*==================================================
    URL SYSTEM
==================================================*/

/*==================================================
    READ FILTERS FROM URL
==================================================*/

function applyFiltersFromURL(){

    const params =
        new URLSearchParams(
            window.location.search
        );


    const category =
        params.get(
            "category"
        );


    const sub =
        params.get(
            "sub"
        );


    const tag =
        params.get(
            "tag"
        );


    const search =
        params.get(
            "search"
        );


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
            tag;

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


    /*==================================================
        CATEGORY
    ==================================================*/

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


    /*==================================================
        SUBCATEGORY
    ==================================================*/

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


    /*==================================================
        TAG
    ==================================================*/

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


    /*==================================================
        SEARCH
    ==================================================*/

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

        const snap =
            await getDocs(
                collection(
                    db,
                    "products"
                )
            );


        allProducts =
            snap.docs.map(
                d => ({

                    id:
                        d.id,

                    ...d.data()

                })
            );


    }

    catch(error){

        console.error(
            "Product loading error:",
            error
        );


        allProducts =
            [];


        if(grid){

            grid.innerHTML = `

                <p class="empty">

                    Unable to load products.

                </p>

            `;

        }

    }

}


/*==================================================
    LOAD CATEGORIES
==================================================*/

async function loadCategories(){

    try{

        const snap =
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
            snap.docs.map(
                d => ({

                    id:
                        d.id,

                    ...d.data()

                })
            );


        mainCategories =
            allCategories.filter(
                category =>
                    !category.parentId
            );


        subCategories =
            allCategories.filter(
                category =>
                    category.parentId
            );

    }

    catch(error){

        console.error(
            "Category loading error:",
            error
        );


        allCategories =
            [];


        mainCategories =
            [];


        subCategories =
            [];

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

        const snap =
            await getDocs(
                collection(
                    db,
                    "tags"
                )
            );


        const tags =
            snap.docs.map(
                d =>
                    ({

                        id:
                            d.id,

                        ...d.data()

                    })
            );


        renderTags(
            tags
        );

    }

    catch(error){

        console.error(
            "Tag loading error:",
            error
        );

    }

}


/*==================================================
    CATEGORY
==================================================*/

function renderMainCategories(){

    if(!categoryBar){

        return;

    }


    categoryBar.innerHTML =
        "";


    if(subCategoryBar){

        subCategoryBar.innerHTML =
            "";

    }


    categoryBar.appendChild(
        createMainBtn(
            "All",
            "all"
        )
    );


    mainCategories.forEach(
        category => {

            categoryBar.appendChild(
                createMainBtn(
                    category.name,
                    category.id
                )
            );

        }
    );

}


/*==================================================
    MAIN CATEGORY BUTTON
==================================================*/

function createMainBtn(
    label,
    id
){

    const div =
        document.createElement(
            "div"
        );


    div.className =
        "category-pill"
        +
        (
            activeCategory === id
            ?
            " active"
            :
            ""
        );


    div.innerText =
        label;


    div.onclick =
        () => {

            activeCategory =
                id;


            activeSubCategory =
                "all";


            visibleCount =
                30;


            document
                .querySelectorAll(
                    ".category-pill"
                )
                .forEach(
                    pill =>
                        pill.classList.remove(
                            "active"
                        )
                );


            div.classList.add(
                "active"
            );


            renderSubCategories();


            renderProducts();


            updateURL();

        };


    return div;

}


/*==================================================
    SUBCATEGORY
==================================================*/

function renderSubCategories(){

    if(!subCategoryBar){

        return;

    }


    subCategoryBar.innerHTML =
        "";


    if(
        activeCategory ===
        "all"
    ){

        return;

    }


    const subs =
        subCategories.filter(
            sub =>
                sub.parentId ===
                activeCategory
        );


    if(!subs.length){

        return;

    }


    subCategoryBar.appendChild(
        createSubBtn(
            "All",
            "all"
        )
    );


    subs.forEach(
        sub => {

            subCategoryBar.appendChild(
                createSubBtn(
                    sub.name,
                    sub.id
                )
            );

        }
    );

}


/*==================================================
    SUBCATEGORY BUTTON
==================================================*/

function createSubBtn(
    label,
    id
){

    const div =
        document.createElement(
            "div"
        );


    div.className =
        "subcategory-pill"
        +
        (
            activeSubCategory === id
            ?
            " active"
            :
            ""
        );


    div.innerText =
        label;


    div.onclick =
        () => {

            activeSubCategory =
                id;


            visibleCount =
                30;


            document
                .querySelectorAll(
                    ".subcategory-pill"
                )
                .forEach(
                    pill =>
                        pill.classList.remove(
                            "active"
                        )
                );


            div.classList.add(
                "active"
            );


            renderProducts();


            updateURL();

        };


    return div;

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


    tagRow.innerHTML =
        "";


    /*==================================================
        ALL TAG
    ==================================================*/

    const allChip =
        document.createElement(
            "div"
        );


    allChip.className =
        "tag-chip"
        +
        (
            activeTag === "all"
            ?
            " active"
            :
            ""
        );


    allChip.innerText =
        "All";


    allChip.onclick =
        () => {

            activeTag =
                "all";


            visibleCount =
                30;


            updateTagUI();


            renderProducts();


            updateURL();

        };


    tagRow.appendChild(
        allChip
    );


    /*==================================================
        TAG LIST
    ==================================================*/

    tags.forEach(
        tag => {

            const chip =
                document.createElement(
                    "div"
                );


            chip.className =
                "tag-chip"
                +
                (
                    activeTag ===
                    tag.slug
                    ?
                    " active"
                    :
                    ""
                );


            chip.innerText =
                tag.name;


            chip.onclick =
                () => {

                    activeTag =
                        tag.slug;


                    visibleCount =
                        30;


                    updateTagUI();


                    renderProducts();


                    updateURL();

                };


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

    document
        .querySelectorAll(
            ".tag-chip"
        )
        .forEach(
            chip => {

                chip.classList.remove(
                    "active"
                );


                if(
                    chip.innerText
                        .toLowerCase()
                    ===
                    activeTag
                ){

                    chip.classList.add(
                        "active"
                    );

                }

            }
        );

}


/*==================================================
    PRODUCTS
==================================================*/

function renderProducts(){

    if(!grid){

        return;

    }


    grid.innerHTML =
        "";


    const filtered =
        allProducts.filter(
            product => {


                /*==========================================
                    CATEGORY
                ==========================================*/

                if(
                    activeCategory !==
                    "all"
                ){

                    const categoryMatch =
                        product.categoryId ===
                        activeCategory
                        ||
                        product.category?.id ===
                        activeCategory;


                    if(
                        !categoryMatch
                    ){

                        return false;

                    }

                }


                /*==========================================
                    SUBCATEGORY
                ==========================================*/

                if(
                    activeSubCategory !==
                    "all"
                ){

                    const subCategoryMatch =
                        product.subCategoryId ===
                        activeSubCategory
                        ||
                        product.subcategoryId ===
                        activeSubCategory
                        ||
                        product.subCategory?.id ===
                        activeSubCategory;


                    if(
                        !subCategoryMatch
                    ){

                        return false;

                    }

                }


                /*==========================================
                    TAG
                ==========================================*/

                if(
                    activeTag !==
                    "all"
                ){

                    const productTags =
                        Array.isArray(
                            product.tags
                        )
                        ?
                        product.tags
                        :
                        [];


                    const tagMatch =
                        productTags.some(
                            tag => {

                                if(
                                    typeof tag ===
                                    "object"
                                ){

                                    return (
                                        String(
                                            tag.slug ||
                                            tag.name ||
                                            ""
                                        )
                                        .toLowerCase()
                                        ===
                                        String(
                                            activeTag
                                        )
                                        .toLowerCase()
                                    );

                                }


                                return (
                                    String(
                                        tag
                                    )
                                    .toLowerCase()
                                    ===
                                    String(
                                        activeTag
                                    )
                                    .toLowerCase()
                                );

                            }
                        );


                    if(
                        !tagMatch
                    ){

                        return false;

                    }

                }


                /*==========================================
                    SEARCH

                    This is NOT the search UI.

                    It simply allows the shop page to
                    display results when topbar.js sends:

                        ?search=keyword
                ==========================================*/

                if(
                    searchQuery
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


                    const categoryName =
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
                        .join(
                            " "
                        )
                        .toLowerCase();


                    const matches =
                        name.includes(
                            searchQuery
                        )
                        ||
                        description.includes(
                            searchQuery
                        )
                        ||
                        categoryName.includes(
                            searchQuery
                        )
                        ||
                        tags.includes(
                            searchQuery
                        );


                    if(
                        !matches
                    ){

                        return false;

                    }

                }


                return true;

            }
        );


    /*==================================================
        EMPTY
    ==================================================*/

    if(
        !filtered.length
    ){

        grid.innerHTML = `

            <p class="empty">

                No products found

            </p>

        `;


        return;

    }


    /*==================================================
        VISIBLE PRODUCTS
    ==================================================*/

    const visibleProducts =
        filtered.slice(
            0,
            visibleCount
        );


    visibleProducts.forEach(
        product => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "product-card";


            const isBestseller =
                product.isBestseller === true
                ||
                product.bestseller === true
                ||
                product.tags?.includes(
                    "bestseller"
                );


            const outOfStock =
                product.inStock === false;


            let discount =
                0;


            if(
                product.salePrice &&
                product.basePrice &&
                Number(
                    product.salePrice
                )
                <
                Number(
                    product.basePrice
                )
            ){

                discount =
                    Math.round(
                        (
                            (
                                Number(
                                    product.basePrice
                                )
                                -
                                Number(
                                    product.salePrice
                                )
                            )
                            /
                            Number(
                                product.basePrice
                            )
                        )
                        *
                        100
                    );

            }


            let badges =
                "";


            if(
                isBestseller
            ){

                badges += `

                    <span
                        class="
                            badge
                            bestseller
                        "
                    >

                        🔥 Bestseller

                    </span>

                `;

            }


            if(
                discount > 0
            ){

                badges += `

                    <span
                        class="
                            badge
                            discount
                        "
                    >

                        -${discount}%

                    </span>

                `;

            }


            if(
                outOfStock
            ){

                badges += `

                    <span
                        class="
                            badge
                            stock
                        "
                    >

                        Out of Stock

                    </span>

                `;

            }


            const image =
                getProductImage(
                    product
                );


            const name =
                product.name ||
                product.title ||
                "Product";


            const salePrice =
                product.salePrice ??
                "";


            const basePrice =
                product.basePrice ??
                product.price ??
                "";


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

                        <div
                            class="
                                product-image-empty
                            "
                        >

                            No Image

                        </div>

                        `
                    }

                </div>


                <h4>

                    ${escapeHtml(
                        name
                    )}

                </h4>


                <div class="price-wrap">

                    ${
                        salePrice !== "" &&
                        basePrice !== "" &&
                        Number(
                            salePrice
                        )
                        <
                        Number(
                            basePrice
                        )
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

                        `

                        <span class="sale">

                            ₹${escapeHtml(
                                String(
                                    salePrice ||
                                    basePrice
                                )
                            )}

                        </span>

                        `

                    }

                </div>

            `;


            card.onclick =
                () => {

                    location.href =
                        getProductLink(
                            product
                        );

                };


            grid.appendChild(
                card
            );

        }
    );


    renderLoadMore(
        filtered.length
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
    LOAD MORE
==================================================*/

function renderLoadMore(
    total
){

    const oldBtn =
        document.getElementById(
            "loadMoreBtn"
        );


    if(oldBtn){

        oldBtn.remove();

    }


    if(
        visibleCount >= total
    ){

        return;

    }


    const btn =
        document.createElement(
            "button"
        );


    btn.id =
        "loadMoreBtn";


    btn.innerText =
        "Load More";


    btn.className =
        "load-more-btn";


    btn.onclick =
        () => {

            visibleCount +=
                LOAD_STEP;


            renderProducts();

        };


    grid.after(
        btn
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
    INIT
==================================================*/

async function init(){

    console.log(
        "✅ Store system loaded"
    );


    /*
        Read URL FIRST.

        This is important because the new
        topbar search can send:

            shop.html?search=name
    */

    applyFiltersFromURL();


    await loadProducts();


    await loadCategories();


    await loadTags();


    renderMainCategories();


    renderSubCategories();


    renderProducts();

}


/*==================================================
    START
==================================================*/

init();


/*==================================================
    EXPORT
==================================================*/

export {

    loadProducts,

    loadCategories,

    loadTags,

    renderProducts,

    renderMainCategories,

    renderSubCategories,

    applyFiltersFromURL,

    updateURL

};