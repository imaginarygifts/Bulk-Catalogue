/*==================================================
    HOMEPAGE BUILDER
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

import { enableDragDrop } from "./drag-drop.js";

import { renderHomepagePreview } from "./preview.js";

import {
    renderSectionEditor
} from "./section-editor.js";

/*==================================================
    ELEMENTS
==================================================*/

const sectionList =
document.getElementById("sectionList");

const preview =
document.getElementById("homepagePreview");

const settingsPanel =
document.getElementById("settingsPanel");

const addSectionBtn =
document.getElementById("addSection");

/*==================================================
    DATA
==================================================*/

let homepageSections=[];

let selectedSection=null;

/*==================================================
    INIT
==================================================*/

document.addEventListener(

    "DOMContentLoaded",

    initBuilder

);

/*==================================================
    INIT BUILDER
==================================================*/

async function initBuilder(){

    bindEvents();

    await refresh();

}

/*==================================================
    EVENTS
==================================================*/

function bindEvents(){

    addSectionBtn.addEventListener(

        "click",

        showAddSectionDialog

    );

}

/*==================================================
    REFRESH
==================================================*/

async function refresh(){

    await loadSections();

    refreshUI();

}

/*==================================================
    REFRESH UI
==================================================*/

function refreshUI(){

    renderSectionList();

    renderPreview();

    renderSettings();

    initializeDragDrop();

}

/*==================================================
    LOAD HOMEPAGE SECTIONS
==================================================*/

async function loadSections(){

    const q = query(

        collection(

            db,

            "homepageSections"

        ),

        orderBy(

            "order"

        )

    );

    const snapshot =

    await getDocs(q);

    homepageSections =

    snapshot.docs.map(doc=>({

        id:doc.id,

        ...doc.data()

    }));

}

/*==================================================
    RENDER SECTION LIST
==================================================*/

function renderSectionList(){

    sectionList.innerHTML="";

    homepageSections.forEach(section=>{

        const item =

        document.createElement("div");

        item.className=

        "builder-section";

        if(

            selectedSection &&

            selectedSection.id===section.id

        ){

            item.classList.add(

                "active"

            );

        }

        item.innerHTML=`

<div class="builder-section-left">

<strong>

${section.title || section.type}

</strong>

<div class="builder-section-type">

${section.type}

</div>

</div>

<div class="builder-section-right">

#${section.order}

</div>

`;

        item.onclick=()=>{

            selectSection(

                section.id

            );

        };

        sectionList.appendChild(

            item

        );

    });

}

/*==================================================
    PREVIEW
==================================================*/

function renderPreview(){

    renderHomepagePreview(

        preview,

        homepageSections

    );

}

/*==================================================
    SETTINGS
==================================================*/

function renderSettings(){

    renderSectionEditor({

        container:settingsPanel,

        section:selectedSection,

        onUpdate:updateSection,

        onDuplicate:duplicateSelectedSection,

        onDelete:deleteSelectedSection,

        onRefresh:refresh

    });

}

/*==================================================
    SELECT SECTION
==================================================*/

function selectSection(id){

    selectedSection=

    homepageSections.find(

        section=>section.id===id

    );

    refreshUI();

}

/*==================================================
    ADD SECTION
==================================================*/

function showAddSectionDialog(){

    const type = prompt(

`Enter Section Type

banner
heading
productCarousel
imageCarousel
youtubeCarousel
reviewCarousel
spacer`

    );

    if(!type) return;

    createSection(type);

}

/*==================================================
    CREATE SECTION
==================================================*/

async function createSection(type){

    const data = getDefaultSection(type);

    data.order = homepageSections.length + 1;

    data.createdAt = Date.now();

    data.updatedAt = Date.now();

    data.published = true;

    const ref = await addDoc(

        collection(
            db,
            "homepageSections"
        ),

        data

    );

    data.id = ref.id;

    await refresh();

    selectedSection = homepageSections.find(

        section => section.id === ref.id

    );

    refreshUI();

}

/*==================================================
    UPDATE SECTION
==================================================*/

async function updateSection(data){

    if(!selectedSection) return;

    Object.assign(

        selectedSection,

        data,

        {

            updatedAt:Date.now()

        }

    );

    await updateDoc(

        doc(

            db,

            "homepageSections",

            selectedSection.id

        ),

        selectedSection

    );

    renderSectionList();

    renderPreview();

}

/*==================================================
    DEFAULT SECTION
==================================================*/

function getDefaultSection(type){

    switch(type){

        case "banner":

            return{

                type,

                title:"",

                subtitle:"",

                slides:[],

                autoPlay:true,

                interval:5000

            };

        case "heading":

            return{

                type,

                badge:"",

                title:"Heading",

                subtitle:""

            };

        case "productCarousel":

            return{

                type,

                title:"Products",

                subtitle:"",

                filterType:"latest",

                categoryId:"",

                subCategoryId:"",

                tag:"",

                limit:10,

                autoPlay:false,

                interval:5000,

                viewAllLink:""

            };

        case "imageCarousel":

            return{

                type,

                title:"Gallery",

                subtitle:"",

                images:[],

                autoPlay:false,

                interval:5000

            };

        case "youtubeCarousel":

            return{

                type,

                title:"Videos",

                subtitle:"",

                videos:[],

                autoPlay:false,

                interval:5000

            };

        case "reviewCarousel":

            return{

                type,

                title:"Reviews",

                subtitle:"",

                reviews:[],

                autoPlay:true,

                interval:5000,

                limit:10

            };

        case "spacer":

            return{

                type,

                height:40,

                background:"transparent"

            };

        default:

            return{

                type

            };

    }

}



/*==================================================
    DUPLICATE SECTION
==================================================*/

async function duplicateSelectedSection(){

    if(!selectedSection) return;

    const clone = structuredClone(selectedSection);

    delete clone.id;

    clone.order = homepageSections.length + 1;

    clone.createdAt = Date.now();

    clone.updatedAt = Date.now();

    const ref = await addDoc(

        collection(
            db,
            "homepageSections"
        ),

        clone

    );

    await refresh();

    selectedSection = homepageSections.find(
        section => section.id === ref.id
    );

    refreshUI();

}

/*==================================================
    DELETE SECTION
==================================================*/

async function deleteSelectedSection(){

    if(!selectedSection) return;

    const ok = confirm(
        "Delete this section?"
    );

    if(!ok) return;

    await deleteDoc(

        doc(
            db,
            "homepageSections",
            selectedSection.id
        )

    );

    homepageSections = homepageSections.filter(

        section => section.id !== selectedSection.id

    );

    homepageSections.forEach((section,index)=>{

        section.order = index + 1;

    });

    await saveOrder();

    selectedSection = null;

    refreshUI();

}

/*==================================================
    DRAG DROP
==================================================*/

function initializeDragDrop(){

    enableDragDrop({

        container:sectionList,

        items:".builder-section",

        onChange:newOrder=>{

            reorderSections(newOrder);

        }

    });

}

/*==================================================
    REORDER
==================================================*/

function reorderSections(order){

    const reordered=[];

    order.forEach(id=>{

        const section = homepageSections.find(

            item=>item.id===id

        );

        if(section){

            reordered.push(section);

        }

    });

    reordered.forEach((section,index)=>{

        section.order=index+1;

    });

    homepageSections=reordered;

    renderPreview();

    saveOrder();

}

/*==================================================
    SAVE ORDER
==================================================*/

async function saveOrder(){

    const promises=[];

    homepageSections.forEach(section=>{

        promises.push(

            updateDoc(

                doc(

                    db,

                    "homepageSections",

                    section.id

                ),

                {

                    order:section.order,

                    updatedAt:Date.now()

                }

            )

        );

    });

    await Promise.all(promises);

    renderSectionList();

}

/*==================================================
    MOVE UP
==================================================*/

async function moveUp(){

    if(!selectedSection) return;

    const index = homepageSections.findIndex(

        s=>s.id===selectedSection.id

    );

    if(index<=0) return;

    [

        homepageSections[index-1],

        homepageSections[index]

    ]=[

        homepageSections[index],

        homepageSections[index-1]

    ];

    homepageSections.forEach((s,i)=>{

        s.order=i+1;

    });

    await saveOrder();

    refreshUI();

}

/*==================================================
    MOVE DOWN
==================================================*/

async function moveDown(){

    if(!selectedSection) return;

    const index = homepageSections.findIndex(

        s=>s.id===selectedSection.id

    );

    if(index===homepageSections.length-1) return;

    [

        homepageSections[index+1],

        homepageSections[index]

    ]=[

        homepageSections[index],

        homepageSections[index+1]

    ];

    homepageSections.forEach((s,i)=>{

        s.order=i+1;

    });

    await saveOrder();

    refreshUI();

}

/*==================================================
    TOGGLE PUBLISH
==================================================*/

async function togglePublish(){

    if(!selectedSection) return;

    selectedSection.published = !selectedSection.published;

    await updateDoc(

        doc(

            db,

            "homepageSections",

            selectedSection.id

        ),

        {

            published:selectedSection.published,

            updatedAt:Date.now()

        }

    );

    renderSectionList();

    renderPreview();

}

/*==================================================
    HELPERS
==================================================*/

function getSection(id){

    return homepageSections.find(

        section=>section.id===id

    );

}

function getSelectedSection(){

    return selectedSection;

}

export{

    refresh,

    refreshUI,

    getSection,

    getSelectedSection,

    updateSection

};