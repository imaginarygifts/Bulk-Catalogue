/*==================================================
    HOMEPAGE BUILDER
    MOBILE FRIENDLY VERSION
==================================================*/

import { db } from "../js/firebase.js";

import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
    renderSectionEditor
} from "./section-editor.js";

import {
    renderHomepagePreview
} from "./preview.js";


/*==================================================
    ELEMENTS
==================================================*/

const sectionNameInput =
    document.getElementById("sectionName");

const sectionTypeSelect =
    document.getElementById("sectionType");

const addSectionBtn =
    document.getElementById("addSectionBtn");

const sectionList =
    document.getElementById("sectionList");

const sectionsEmpty =
    document.getElementById("sectionsEmpty");

const sectionCount =
    document.getElementById("sectionCount");

const sectionPreviewModal =
    document.getElementById("sectionPreviewModal");

const sectionPreviewContent =
    document.getElementById("sectionPreviewContent");

const previewModalTitle =
    document.getElementById("previewModalTitle");

const closePreviewBtn =
    document.getElementById("closePreviewBtn");

const homepagePreviewModal =
    document.getElementById("homepagePreviewModal");

const homepagePreviewContent =
    document.getElementById("homepagePreviewContent");

const closeHomepagePreviewBtn =
    document.getElementById("closeHomepagePreviewBtn");

const fullPreviewBtn =
    document.getElementById("fullPreviewBtn");

const publishBtn =
    document.getElementById("publishBtn");

const toast =
    document.getElementById("toast");

const toastMessage =
    document.getElementById("toastMessage");

const loader =
    document.getElementById("loader");


/*==================================================
    DATA
==================================================*/

let homepageSections = [];

let expandedSectionId = null;

let draggedSectionId = null;


/*==================================================
    SECTION INFORMATION
==================================================*/

const sectionInfo = {

    heading: {

        label: "Heading",

        icon: "fa-heading"

    },

    spacer: {

        label: "Spacer",

        icon: "fa-arrows-up-down"

    },

    banner: {

        label: "Banner",

        icon: "fa-image"

    },

    imageCarousel: {

        label: "Image Carousel",

        icon: "fa-images"

    },

    productCarousel: {

        label: "Product Carousel",

        icon: "fa-box"

    },

    youtubeCarousel: {

        label: "YouTube Carousel",

        icon: "fa-circle-play"

    },

    reviewCarousel: {

        label: "Reviews Carousel",

        icon: "fa-star"

    }

};


/*==================================================
    INIT
==================================================*/

document.addEventListener(
    "DOMContentLoaded",
    initBuilder
);


/*==================================================
    INITIALIZE
==================================================*/

async function initBuilder(){

    bindEvents();

    showLoader(true);

    try{

        await loadSections();

        renderSectionList();

    }

    catch(error){

        console.error(
            "Homepage builder initialization failed:",
            error
        );

        showToast(
            "Failed to load homepage sections",
            "error"
        );

    }

    finally{

        showLoader(false);

    }

}


/*==================================================
    EVENTS
==================================================*/

function bindEvents(){

    /* Add section */

    addSectionBtn?.addEventListener(
        "click",
        createNewSection
    );


    /* Individual preview */

    closePreviewBtn?.addEventListener(
        "click",
        closeSectionPreview
    );


    /* Full homepage preview */

    fullPreviewBtn?.addEventListener(
        "click",
        openHomepagePreview
    );


    closeHomepagePreviewBtn?.addEventListener(
        "click",
        closeHomepagePreview
    );


    /* Publish */

    publishBtn?.addEventListener(
        "click",
        publishHomepage
    );


    /* Close modal when clicking background */

    sectionPreviewModal?.addEventListener(
        "click",
        event=>{

            if(
                event.target ===
                sectionPreviewModal
            ){

                closeSectionPreview();

            }

        }
    );


    homepagePreviewModal?.addEventListener(
        "click",
        event=>{

            if(
                event.target ===
                homepagePreviewModal
            ){

                closeHomepagePreview();

            }

        }
    );


    /* Escape key */

    document.addEventListener(
        "keydown",
        event=>{

            if(event.key !== "Escape") return;

            closeSectionPreview();

            closeHomepagePreview();

        }
    );


    /* Enter in section name */

    sectionNameInput?.addEventListener(
        "keydown",
        event=>{

            if(
                event.key === "Enter"
            ){

                event.preventDefault();

                createNewSection();

            }

        }
    );

}


/*==================================================
    LOAD SECTIONS
==================================================*/

async function loadSections(){

    const q = query(

        collection(
            db,
            "homepageSections"
        ),

        orderBy("order")

    );

    const snapshot =
        await getDocs(q);

    homepageSections =
        snapshot.docs.map(item=>({

            id:item.id,

            ...item.data()

        }));

}


/*==================================================
    RENDER SECTION LIST
==================================================*/

function renderSectionList(){

    sectionList.innerHTML = "";


    /* Empty */

    if(
        homepageSections.length === 0
    ){

        sectionList.appendChild(
            sectionsEmpty
        );

        sectionsEmpty.classList.remove(
            "hidden"
        );

        updateSectionCount();

        return;

    }


    sectionsEmpty.classList.add(
        "hidden"
    );


    homepageSections.forEach(
        (section,index)=>{

            const card =
                createSectionCard(
                    section,
                    index
                );

            sectionList.appendChild(card);

        }
    );


    updateSectionCount();

}


/*==================================================
    CREATE SECTION CARD
==================================================*/

function createSectionCard(
    section,
    index
){

    const info =
        sectionInfo[section.type] || {

            label:section.type,

            icon:"fa-layer-group"

        };


    const card =
        document.createElement("div");

    card.className =
        "builder-section";


    card.dataset.id =
        section.id;


    if(
        expandedSectionId ===
        section.id
    ){

        card.classList.add(
            "active"
        );

    }


    /*================================================
        HEADER
    =================================================*/

    const header =
        document.createElement("div");

    header.className =
        "section-card-header";


    /* Drag */

    const drag =
        document.createElement("div");

    drag.className =
        "section-drag";

    drag.innerHTML = `
        <i class="fa-solid fa-grip-vertical"></i>
    `;

    drag.draggable = true;


    /* Icon */

    const icon =
        document.createElement("div");

    icon.className =
        "section-icon";

    icon.innerHTML = `
        <i class="fa-solid ${info.icon}"></i>
    `;


    /* Info */

    const infoBox =
        document.createElement("div");

    infoBox.className =
        "section-info";


    const title =
        document.createElement("div");

    title.className =
        "section-title";

    title.textContent =
        section.title ||
        info.label;


    const type =
        document.createElement("div");

    type.className =
        "section-type";

    type.textContent =
        info.label;


    infoBox.appendChild(title);

    infoBox.appendChild(type);


    /* Actions */

    const actions =
        document.createElement("div");

    actions.className =
        "section-actions";


    /* Preview */

    const previewBtn =
        document.createElement("button");

    previewBtn.type =
        "button";

    previewBtn.className =
        "section-action preview";

    previewBtn.title =
        "Preview";

    previewBtn.innerHTML = `
        <i class="fa-solid fa-eye"></i>
    `;

    previewBtn.addEventListener(
        "click",
        event=>{

            event.stopPropagation();

            openSectionPreview(
                section
            );

        }
    );


    /* Edit */

    const editBtn =
        document.createElement("button");

    editBtn.type =
        "button";

    editBtn.className =
        "section-action edit";

    editBtn.title =
        "Edit";

    editBtn.innerHTML = `
        <i class="fa-solid ${
            expandedSectionId === section.id
            ? "fa-chevron-up"
            : "fa-chevron-down"
        }"></i>
    `;

    editBtn.addEventListener(
        "click",
        event=>{

            event.stopPropagation();

            toggleSectionEditor(
                section.id
            );

        }
    );


    /* Delete */

    const deleteBtn =
        document.createElement("button");

    deleteBtn.type =
        "button";

    deleteBtn.className =
        "section-action delete";

    deleteBtn.title =
        "Delete";

    deleteBtn.innerHTML = `
        <i class="fa-regular fa-trash-can"></i>
    `;

    deleteBtn.addEventListener(
        "click",
        async event=>{

            event.stopPropagation();

            await deleteSection(
                section
            );

        }
    );


    actions.appendChild(
        previewBtn
    );

    actions.appendChild(
        editBtn
    );

    actions.appendChild(
        deleteBtn
    );


    header.appendChild(
        drag
    );

    header.appendChild(
        icon
    );

    header.appendChild(
        infoBox
    );

    header.appendChild(
        actions
    );


    card.appendChild(
        header
    );


    /*================================================
        EDITOR
    =================================================*/

    if(
        expandedSectionId ===
        section.id
    ){

        const editorContainer =
            document.createElement("div");

        editorContainer.className =
            "section-editor-container";


        renderSectionEditor({

            container:
                editorContainer,

            section:
                section,

            onUpdate:
                updatedSection=>{

                    handleSectionUpdate(
                        updatedSection
                    );

                },

            onDuplicate:
                async()=>{

                    await duplicateSection(
                        section
                    );

                },

            onDelete:
                async()=>{

                    await deleteSection(
                        section
                    );

                },

            onRefresh:
                async()=>{

                }

        });


        card.appendChild(
            editorContainer
        );

    }


    /*================================================
        DRAG EVENTS
    =================================================*/

    card.addEventListener(
        "dragstart",
        event=>{

            draggedSectionId =
                section.id;

            card.classList.add(
                "dragging"
            );

            event.dataTransfer.effectAllowed =
                "move";

            event.dataTransfer.setData(
                "text/plain",
                section.id
            );

        }
    );


    card.addEventListener(
        "dragend",
        ()=>{

            card.classList.remove(
                "dragging"
            );

            draggedSectionId =
                null;

            document
                .querySelectorAll(
                    ".drag-over"
                )
                .forEach(item=>{

                    item.classList.remove(
                        "drag-over"
                    );

                });

        }
    );


    card.addEventListener(
        "dragover",
        event=>{

            event.preventDefault();

            if(
                draggedSectionId ===
                section.id
            ){

                return;

            }

            card.classList.add(
                "drag-over"
            );

        }
    );


    card.addEventListener(
        "dragleave",
        ()=>{

            card.classList.remove(
                "drag-over"
            );

        }
    );


    card.addEventListener(
        "drop",
        async event=>{

            event.preventDefault();

            card.classList.remove(
                "drag-over"
            );

            const draggedId =
                event.dataTransfer.getData(
                    "text/plain"
                );

            if(
                !draggedId ||
                draggedId === section.id
            ){

                return;

            }

            await moveSection(
                draggedId,
                section.id
            );

        }
    );


    return card;

}


/*==================================================
    TOGGLE EDITOR
==================================================*/

function toggleSectionEditor(
    id
){

    if(
        expandedSectionId === id
    ){

        expandedSectionId =
            null;

    }

    else{

        expandedSectionId =
            id;

    }

    renderSectionList();


    /* Scroll selected section */

    if(
        expandedSectionId === id
    ){

        requestAnimationFrame(()=>{

            const card =
                sectionList.querySelector(
                    `[data-id="${id}"]`
                );

            card?.scrollIntoView({

                behavior:"smooth",

                block:"nearest"

            });

        });

    }

}


/*==================================================
    CREATE NEW SECTION
==================================================*/

async function createNewSection(){

    const name =
        sectionNameInput.value.trim();

    const type =
        sectionTypeSelect.value;


    if(!name){

        showToast(
            "Please enter a section name",
            "error"
        );

        sectionNameInput.focus();

        return;

    }


    if(!type){

        showToast(
            "Please select a section type",
            "error"
        );

        sectionTypeSelect.focus();

        return;

    }


    showLoader(true);


    try{

        const data =
            getDefaultSection(
                type
            );


        data.title =
            name;


        data.order =
            homepageSections.length + 1;


        data.createdAt =
            Date.now();


        data.updatedAt =
            Date.now();


        data.published =
            true;


        const ref =
            await addDoc(

                collection(
                    db,
                    "homepageSections"
                ),

                data

            );


        const newSection = {

            id:ref.id,

            ...data

        };


        homepageSections.push(
            newSection
        );


        /* Clear form */

        sectionNameInput.value =
            "";

        sectionTypeSelect.value =
            "";


        /* Open new section */

        expandedSectionId =
            ref.id;


        renderSectionList();


        showToast(
            "Section added successfully"
        );


        /* Scroll */

        requestAnimationFrame(()=>{

            const card =
                sectionList.querySelector(
                    `[data-id="${ref.id}"]`
                );

            card?.scrollIntoView({

                behavior:"smooth",

                block:"center"

            });

        });

    }

    catch(error){

        console.error(
            "Create section error:",
            error
        );

        showToast(
            "Failed to create section",
            "error"
        );

    }

    finally{

        showLoader(false);

    }

}


/*==================================================
    DEFAULT SECTION
==================================================*/

function getDefaultSection(type){

    const design = {

        backgroundColor:"#ffffff",

        padding:20,

        margin:0,

        borderRadius:0,

        width:"boxed",

        customWidth:1200

    };


    switch(type){

        case "heading":

            return {

                type,

                title:"Heading",

                subtitle:"",

                badge:"",

                ...design

            };


        case "spacer":

            return {

                type,

                height:40,

                background:"transparent",

                ...design

            };


        case "banner":

            return {

                type,

                title:"Banner",

                subtitle:"",

                slides:[],

                autoPlay:true,

                interval:5000,

                ...design

            };


        case "imageCarousel":

            return {

                type,

                title:"Gallery",

                subtitle:"",

                images:[],

                autoPlay:false,

                interval:5000,

                ...design

            };


        case "productCarousel":

            return {

                type,

                title:"Products",

                subtitle:"",

                filterType:"latest",

                categoryId:"",

                categoryType:"",

                tags:[],

                limit:10,

                autoPlay:false,

                interval:5000,

                viewAllLink:"",

                ...design

            };


        case "youtubeCarousel":

            return {

                type,

                title:"Videos",

                subtitle:"",

                videos:[],

                autoPlay:false,

                interval:5000,

                ...design

            };


        case "reviewCarousel":

            return {

                type,

                title:"Reviews",

                subtitle:"",

                reviews:[],

                autoPlay:true,

                interval:5000,

                limit:10,

                ...design

            };


        default:

            return {

                type,

                title:"Section",

                ...design

            };

    }

}


/*==================================================
    UPDATE SECTION
==================================================*/

async function handleSectionUpdate(
    updatedSection
){

    if(!updatedSection?.id){

        return;

    }


    const index =
        homepageSections.findIndex(
            item =>
                item.id ===
                updatedSection.id
        );


    if(index === -1){

        return;

    }


    const cleanData = {
        ...updatedSection
    };


    delete cleanData.id;


    cleanData.updatedAt =
        Date.now();


    homepageSections[index] = {

        id:updatedSection.id,

        ...cleanData

    };


    try{

        await updateDoc(

            doc(
                db,
                "homepageSections",
                updatedSection.id
            ),

            cleanData

        );


        /*
            Do NOT rerender the entire section
            on every keystroke.

            This keeps typing smooth.
        */

        updateSectionCardTitle(
            updatedSection
        );

    }

    catch(error){

        console.error(
            "Update section error:",
            error
        );

        showToast(
            "Failed to save changes",
            "error"
        );

    }

}


/*==================================================
    UPDATE CARD TITLE
==================================================*/

function updateSectionCardTitle(
    section
){

    const card =
        sectionList.querySelector(
            `[data-id="${section.id}"]`
        );

    if(!card) return;


    const title =
        card.querySelector(
            ".section-title"
        );

    if(!title) return;


    const info =
        sectionInfo[section.type];


    title.textContent =
        section.title ||
        info?.label ||
        section.type;

}


/*==================================================
    DELETE SECTION
==================================================*/

async function deleteSection(
    section
){

    if(!section) return;


    const confirmed =
        confirm(
            `Delete "${section.title || "this section"}"?`
        );


    if(!confirmed){

        return;

    }


    showLoader(true);


    try{

        await deleteDoc(

            doc(
                db,
                "homepageSections",
                section.id
            )

        );


        homepageSections =
            homepageSections.filter(
                item =>
                    item.id !==
                    section.id
            );


        await normalizeOrders();


        if(
            expandedSectionId ===
            section.id
        ){

            expandedSectionId =
                null;

        }


        renderSectionList();


        showToast(
            "Section deleted"
        );

    }

    catch(error){

        console.error(
            "Delete section error:",
            error
        );

        showToast(
            "Failed to delete section",
            "error"
        );

    }

    finally{

        showLoader(false);

    }

}


/*==================================================
    DUPLICATE SECTION
==================================================*/

async function duplicateSection(
    section
){

    if(!section) return;


    showLoader(true);


    try{

        const clone =
            structuredClone(
                section
            );


        delete clone.id;


        clone.title =
            `${section.title || "Section"} Copy`;


        clone.order =
            homepageSections.length + 1;


        clone.createdAt =
            Date.now();


        clone.updatedAt =
            Date.now();


        const ref =
            await addDoc(

                collection(
                    db,
                    "homepageSections"
                ),

                clone

            );


        const newSection = {

            id:ref.id,

            ...clone

        };


        homepageSections.push(
            newSection
        );


        expandedSectionId =
            ref.id;


        renderSectionList();


        showToast(
            "Section duplicated"
        );


        requestAnimationFrame(()=>{

            sectionList
                .querySelector(
                    `[data-id="${ref.id}"]`
                )
                ?.scrollIntoView({

                    behavior:"smooth",

                    block:"center"

                });

        });

    }

    catch(error){

        console.error(
            "Duplicate section error:",
            error
        );

        showToast(
            "Failed to duplicate section",
            "error"
        );

    }

    finally{

        showLoader(false);

    }

}


/*==================================================
    MOVE SECTION
==================================================*/

async function moveSection(
    draggedId,
    targetId
){

    const fromIndex =
        homepageSections.findIndex(
            section =>
                section.id ===
                draggedId
        );


    const targetIndex =
        homepageSections.findIndex(
            section =>
                section.id ===
                targetId
        );


    if(
        fromIndex === -1 ||
        targetIndex === -1
    ){

        return;

    }


    const moved =
        homepageSections.splice(
            fromIndex,
            1
        )[0];


    homepageSections.splice(
        targetIndex,
        0,
        moved
    );


    await normalizeOrders();

}


/*==================================================
    NORMALIZE ORDERS
==================================================*/

async function normalizeOrders(){

    const updates = [];


    homepageSections.forEach(
        (section,index)=>{

            const newOrder =
                index + 1;


            section.order =
                newOrder;


            updates.push(

                updateDoc(

                    doc(
                        db,
                        "homepageSections",
                        section.id
                    ),

                    {

                        order:newOrder,

                        updatedAt:Date.now()

                    }

                )

            );

        }
    );


    await Promise.all(
        updates
    );


    renderSectionList();

}


/*==================================================
    UPDATE SECTION COUNT
==================================================*/

function updateSectionCount(){

    const count =
        homepageSections.length;


    if(!sectionCount) return;


    sectionCount.textContent =
        `${count} ${
            count === 1
            ? "Section"
            : "Sections"
        }`;

}


/*==================================================
    INDIVIDUAL SECTION PREVIEW
==================================================*/

async function openSectionPreview(
    section
){

    if(!section) return;


    previewModalTitle.textContent =
        section.title ||
        sectionInfo[
            section.type
        ]?.label ||
        "Section Preview";


    sectionPreviewContent.innerHTML = "";


    sectionPreviewModal.classList.remove(
        "hidden"
    );


    try{

        await renderHomepagePreview(

            sectionPreviewContent,

            [section]

        );

    }

    catch(error){

        console.error(
            "Section preview error:",
            error
        );


        sectionPreviewContent.innerHTML = `

            <div style="
                padding:40px;
                text-align:center;
                color:#555;
            ">

                <h3>
                    Preview could not be loaded
                </h3>

                <p style="margin-top:8px;">
                    ${error.message || "Unknown error"}
                </p>

            </div>

        `;

    }

}


/*==================================================
    CLOSE SECTION PREVIEW
==================================================*/

function closeSectionPreview(){

    sectionPreviewModal?.classList.add(
        "hidden"
    );

    if(sectionPreviewContent){

        sectionPreviewContent.innerHTML =
            "";

    }

}


/*==================================================
    FULL HOMEPAGE PREVIEW
==================================================*/

async function openHomepagePreview(){

    homepagePreviewContent.innerHTML =
        "";


    homepagePreviewModal.classList.remove(
        "hidden"
    );


    try{

        const publishedSections =
            homepageSections.filter(
                section =>
                    section.published !== false
            );


        await renderHomepagePreview(

            homepagePreviewContent,

            publishedSections

        );

    }

    catch(error){

        console.error(
            "Homepage preview error:",
            error
        );


        homepagePreviewContent.innerHTML = `

            <div style="
                padding:40px;
                text-align:center;
                color:#555;
            ">

                <h3>
                    Homepage preview could not be loaded
                </h3>

                <p style="margin-top:8px;">
                    ${error.message || "Unknown error"}
                </p>

            </div>

        `;

    }

}


/*==================================================
    CLOSE HOMEPAGE PREVIEW
==================================================*/

function closeHomepagePreview(){

    homepagePreviewModal?.classList.add(
        "hidden"
    );

    if(homepagePreviewContent){

        homepagePreviewContent.innerHTML =
            "";

    }

}


/*==================================================
    PUBLISH
==================================================*/

async function publishHomepage(){

    if(
        homepageSections.length === 0
    ){

        showToast(
            "Add at least one section first",
            "error"
        );

        return;

    }


    showLoader(true);


    try{

        const updates =
            homepageSections.map(
                section=>{

                    return updateDoc(

                        doc(
                            db,
                            "homepageSections",
                            section.id
                        ),

                        {

                            published:
                                true,

                            updatedAt:
                                Date.now()

                        }

                    );

                }
            );


        await Promise.all(
            updates
        );


        homepageSections.forEach(
            section=>{

                section.published =
                    true;

            }
        );


        showToast(
            "Homepage published successfully"
        );

    }

    catch(error){

        console.error(
            "Publish error:",
            error
        );

        showToast(
            "Failed to publish homepage",
            "error"
        );

    }

    finally{

        showLoader(false);

    }

}


/*==================================================
    TOAST
==================================================*/

function showToast(
    message,
    type="success"
){

    if(!toast) return;


    toastMessage.textContent =
        message;


    const icon =
        toast.querySelector("i");


    if(icon){

        icon.className =
            type === "error"
            ? "fa-solid fa-circle-exclamation"
            : "fa-solid fa-circle-check";

    }


    toast.classList.remove(
        "hidden"
    );


    requestAnimationFrame(()=>{

        toast.classList.add(
            "show"
        );

    });


    clearTimeout(
        showToast.timeout
    );


    showToast.timeout =
        setTimeout(()=>{

            toast.classList.remove(
                "show"
            );


            setTimeout(()=>{

                toast.classList.add(
                    "hidden"
                );

            },250);

        },2500);

}


/*==================================================
    LOADER
==================================================*/

function showLoader(
    show
){

    if(!loader) return;


    if(show){

        loader.classList.remove(
            "hidden"
        );

    }

    else{

        loader.classList.add(
            "hidden"
        );

    }

}


/*==================================================
    PUBLIC HELPERS
==================================================*/

export {

    loadSections,

    renderSectionList,

    createNewSection,

    openSectionPreview,

    openHomepagePreview,

    closeSectionPreview,

    closeHomepagePreview

};