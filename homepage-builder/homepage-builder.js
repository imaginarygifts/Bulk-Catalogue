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