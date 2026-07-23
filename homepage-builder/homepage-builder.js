/*==================================================
    HOMEPAGE BUILDER
==================================================*/

import { db } from "../js/firebase.js";

import { enableDragDrop } from "./drag-drop.js";

import { renderHomepagePreview } from "./preview.js";

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

    await loadSections();

    refreshUI();

    bindEvents();

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
    LOAD FIRESTORE
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

    snapshot.docs.map(doc=>({

        id:doc.id,

        ...doc.data()

    }));

}

/*==================================================
    REFRESH UI
==================================================*/

function refreshUI(){

    renderSectionList();

    initializeDragDrop();

    renderPreview();

    renderSettings();

}

/*==================================================
    SECTION LIST
==================================================*/

function renderSectionList(){

    sectionList.innerHTML="";

    homepageSections.forEach(section=>{

        const item =

        document.createElement("div");

        item.className="builder-section";

        if(

            selectedSection &&

            selectedSection.id===section.id

        ){

            item.classList.add(

                "active"

            );

        }

        item.innerHTML=`

<div class="builder-section-name">

<strong>

${section.title || section.type}

</strong>

</div>

<div class="builder-section-type">

${section.type}

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
    DRAG & DROP
==================================================*/

function initializeDragDrop(){

    enableDragDrop({

        container:sectionList,

        items:homepageSections,

        onChange:async()=>{

            await saveOrder();

            renderPreview();

            renderSectionList();

        }

    });

}


/*==================================================
    SELECT SECTION
==================================================*/

function selectSection(id){

    selectedSection =

    homepageSections.find(

        section=>section.id===id

    );

    refreshUI();

}

/*==================================================
    SETTINGS PANEL
==================================================*/

function renderSettings(){

    if(!selectedSection){

        settingsPanel.innerHTML=`

<div class="empty-settings">

Select a section to edit.

</div>

`;

        return;

    }

    settingsPanel.innerHTML=`

<h3>

${selectedSection.title || selectedSection.type}

</h3>

<div class="builder-setting">

<label>

Title

</label>

<input

type="text"

id="settingTitle"

value="${selectedSection.title || ""}">

</div>

<div class="builder-setting">

<label>

Subtitle

</label>

<textarea

id="settingSubtitle"

rows="4">${selectedSection.subtitle || ""}</textarea>

</div>

<div class="builder-actions">

<button id="duplicateSection">

Duplicate

</button>

<button id="deleteSection">

Delete

</button>

</div>

`;

    document

    .getElementById(

        "settingTitle"

    )

    .addEventListener(

        "input",

        updateSetting

    );

    document

    .getElementById(

        "settingSubtitle"

    )

    .addEventListener(

        "input",

        updateSetting

    );

    document

    .getElementById(

        "duplicateSection"

    )

    .onclick=

    duplicateSelectedSection;

    document

    .getElementById(

        "deleteSection"

    )

    .onclick=

    deleteSelectedSection;

}

/*==================================================
    UPDATE SETTINGS
==================================================*/

async function updateSetting(){

    if(!selectedSection) return;

    selectedSection.title =

    document.getElementById(

        "settingTitle"

    ).value;

    selectedSection.subtitle =

    document.getElementById(

        "settingSubtitle"

    ).value;

    await updateDoc(

        doc(

            db,

            "homepageSections",

            selectedSection.id

        ),

        {

            title:selectedSection.title,

            subtitle:selectedSection.subtitle

        }

    );

    renderSectionList();

    renderPreview();

}

/*==================================================
    ADD SECTION
==================================================*/

function showAddSectionDialog(){

    const type = prompt(

`Section Type

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

    const data =

    getDefaultSection(type);

    data.order=

    homepageSections.length+1;

    data.createdAt=

    Date.now();

    data.published=true;

    await addDoc(

        collection(

            db,

            "homepageSections"

        ),

        data

    );

    await loadSections();

    selectedSection=

    homepageSections[

        homepageSections.length-1

    ];

    refreshUI();

}

/*==================================================
    DEFAULT SECTION DATA
==================================================*/

function getDefaultSection(type){

    switch(type){

        case "banner":

            return{

                type,

                title:"",

                subtitle:"",

                slides:[]

            };

        case "heading":

            return{

                type,

                title:"New Heading",

                subtitle:""

            };

        case "productCarousel":

            return{

                type,

                title:"Products",

                subtitle:"",

                filterType:"latest",

                limit:10,

                autoPlay:false

            };

        case "imageCarousel":

            return{

                type,

                title:"Gallery",

                subtitle:"",

                images:[],

                autoPlay:false

            };

        case "youtubeCarousel":

            return{

                type,

                title:"Videos",

                subtitle:"",

                videos:[],

                autoPlay:false

            };

        case "reviewCarousel":

            return{

                type,

                title:"Customer Reviews",

                subtitle:"",

                reviews:[],

                autoPlay:true

            };

        case "spacer":

            return{

                type,

                height:40

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

    const copy = structuredClone(selectedSection);

    delete copy.id;

    copy.order = homepageSections.length + 1;

    copy.createdAt = Date.now();

    await addDoc(

        collection(
            db,
            "homepageSections"
        ),

        copy

    );

    await loadSections();

    selectedSection =
        homepageSections[
            homepageSections.length - 1
        ];

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

    selectedSection = null;

    await loadSections();

    await reorderSections();

    await loadSections();

    refreshUI();

}

/*==================================================
    SAVE ORDER
==================================================*/

async function saveOrder(){

    for(
        let i = 0;
        i < homepageSections.length;
        i++
    ){

        homepageSections[i].order = i + 1;

        await updateDoc(

            doc(

                db,

                "homepageSections",

                homepageSections[i].id

            ),

            {

                order:i+1

            }

        );

    }

}

/*==================================================
    REORDER ALL
==================================================*/

async function reorderSections(){

    for(

        let i=0;

        i<homepageSections.length;

        i++

    ){

        await updateDoc(

            doc(

                db,

                "homepageSections",

                homepageSections[i].id

            ),

            {

                order:i+1

            }

        );

    }

}

/*==================================================
    REFRESH
==================================================*/

async function refresh(){

    await loadSections();

    refreshUI();

}

/*==================================================
    GET SECTION
==================================================*/

function getSection(id){

    return homepageSections.find(

        section=>section.id===id

    );

}