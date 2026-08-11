/*==================================================
    SIDEBAR
    CATEGORIES + TAGS
==================================================*/

import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


/*==================================================
    INIT
==================================================*/

document.addEventListener(
    "DOMContentLoaded",
    initSidebar
);


/*==================================================
    INIT SIDEBAR
==================================================*/

async function initSidebar(){

    setupSidebarToggles();

    await Promise.all([
        loadSidebarCategories(),
        loadSidebarTags()
    ]);

}


/*==================================================
    SIDEBAR TOGGLES
==================================================*/

function setupSidebarToggles(){

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

            toggleSubmenu(
                categoriesToggle,
                "sidebarCategories"
            );

        }
    );


    tagsToggle?.addEventListener(
        "click",
        () => {

            toggleSubmenu(
                tagsToggle,
                "sidebarTags"
            );

        }
    );

}


/*==================================================
    TOGGLE SUBMENU
==================================================*/

function toggleSubmenu(
    button,
    submenuId
){

    const submenu =
        document.getElementById(
            submenuId
        );


    if(!submenu){

        return;

    }


    const isOpen =
        submenu.classList.contains(
            "open"
        );


    submenu.classList.toggle(
        "open",
        !isOpen
    );


    button.classList.toggle(
        "active",
        !isOpen
    );

}


/*==================================================
    LOAD CATEGORIES
==================================================*/

async function loadSidebarCategories(){

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
                query(
                    collection(
                        db,
                        "categories"
                    ),
                    orderBy("order")
                )
            );


        const categories = [];


        snapshot.forEach(
            docSnap => {

                categories.push({

                    id:
                        docSnap.id,

                    ...docSnap.data()

                });

            }
        );


        /*==================================================
            MAIN CATEGORIES
        ==================================================*/

        const mainCategories =
            categories.filter(
                category =>
                    !category.parentId
            );


        if(!mainCategories.length){

            container.innerHTML = `

                <div class="sidebar-empty">

                    No categories found.

                </div>

            `;

            return;

        }


        container.innerHTML = "";


        mainCategories.forEach(
            category => {

                const children =
                    categories.filter(
                        child =>
                            child.parentId ===
                            category.id
                    );


                const item =
                    createCategoryItem(
                        category,
                        children
                    );


                container.appendChild(
                    item
                );

            }
        );

    }

    catch(error){

        console.error(
            "Sidebar category loading error:",
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
    CREATE CATEGORY ITEM
==================================================*/

function createCategoryItem(
    category,
    children
){

    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "sidebar-category-item";


    /*==================================================
        MAIN ROW
    ==================================================*/

    const row =
        document.createElement(
            "div"
        );


    row.className =
        "sidebar-category-row";


    /*==================================================
        CATEGORY LINK
    ==================================================*/

    const link =
        document.createElement(
            "a"
        );


    link.href =
        buildCategoryUrl(
            category.id
        );


    link.innerHTML = `

        <i class="fa-solid fa-folder"></i>

        <span>
            ${escapeHtml(
                category.name ||
                "Category"
            )}
        </span>

    `;


    row.appendChild(
        link
    );


    /*==================================================
        CHILDREN TOGGLE
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


        row.appendChild(
            toggle
        );


        wrapper.appendChild(
            row
        );


        /*==================================================
            SUBCATEGORIES
        ==================================================*/

        const submenu =
            document.createElement(
                "div"
            );


        submenu.className =
            "sidebar-category-children";


        children.forEach(
            child => {

                const childLink =
                    document.createElement(
                        "a"
                    );


                childLink.href =
                    buildCategoryUrl(
                        child.id
                    );


                childLink.innerHTML = `

                    <i class="
                        fa-solid
                        fa-angle-right
                    "></i>

                    <span>
                        ${escapeHtml(
                            child.name ||
                            "Subcategory"
                        )}
                    </span>

                `;


                submenu.appendChild(
                    childLink
                );

            }
        );


        wrapper.appendChild(
            submenu
        );


        /*==================================================
            TOGGLE CHILDREN
        ==================================================*/

        toggle.addEventListener(
            "click",
            event => {

                event.preventDefault();

                event.stopPropagation();


                submenu.classList.toggle(
                    "open"
                );


                toggle.classList.toggle(
                    "active"
                );

            }
        );

    }
    else{

        wrapper.appendChild(
            row
        );

    }


    return wrapper;

}


/*==================================================
    CATEGORY URL
==================================================*/

function buildCategoryUrl(
    categoryId
){

    return `/?category=${encodeURIComponent(
        categoryId
    )}`;

}


/*==================================================
    LOAD TAGS
==================================================*/

async function loadSidebarTags(){

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


        const tags = [];


        snapshot.forEach(
            docSnap => {

                tags.push({

                    id:
                        docSnap.id,

                    ...docSnap.data()

                });

            }
        );


        /*==================================================
            SORT TAGS
        ==================================================*/

        tags.sort(
            (a,b) => {

                const nameA =
                    String(
                        a.name ||
                        ""
                    ).toLowerCase();


                const nameB =
                    String(
                        b.name ||
                        ""
                    ).toLowerCase();


                return nameA.localeCompare(
                    nameB
                );

            }
        );


        if(!tags.length){

            container.innerHTML = `

                <div class="sidebar-empty">

                    No tags found.

                </div>

            `;

            return;

        }


        container.innerHTML = "";


        tags.forEach(
            tag => {

                const link =
                    document.createElement(
                        "a"
                    );


                link.className =
                    "sidebar-tag-link";


                link.href =
                    buildTagUrl(
                        tag.slug
                    );


                link.innerHTML = `

                    <i class="
                        fa-solid
                        fa-tag
                    "></i>

                    <span>
                        ${escapeHtml(
                            tag.name ||
                            tag.slug ||
                            "Tag"
                        )}
                    </span>

                `;


                container.appendChild(
                    link
                );

            }
        );

    }

    catch(error){

        console.error(
            "Sidebar tag loading error:",
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
    TAG URL
==================================================*/

function buildTagUrl(
    slug
){

    return `/?tag=${encodeURIComponent(
        slug
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
    GLOBAL SIDEBAR TOGGLE
==================================================*/

window.toggleSidebar =
function(){

    const sidebar =
        document.getElementById(
            "sidebar"
        );


    const overlay =
        document.getElementById(
            "overlay"
        );


    if(
        !sidebar ||
        !overlay
    ){

        return;

    }


    sidebar.classList.toggle(
        "open"
    );


    overlay.classList.toggle(
        "show"
    );

};