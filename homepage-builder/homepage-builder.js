/*==================================================
    HOMEPAGE BUILDER
    homepage-builder.js
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

    renderSectionList();

    renderPreview();

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
    LOAD SECTIONS
==================================================*/

async function loadSections(){

    const q=query(

        collection(

            db,

            "homepageSections"

        ),

        orderBy("order")

    );

    const snap=

    await getDocs(q);

    homepageSections=

    snap.docs.map(doc=>({

        id:doc.id,

        ...doc.data()

    }));

}

/*==================================================
    SECTION LIST
==================================================*/

function renderSectionList(){

    sectionList.innerHTML="";

    homepageSections.forEach(

        section=>{

            const item=

            document.createElement("div");

            item.className=

            "builder-section";

            item.innerHTML=

            `

<div>

<strong>

${section.type}

</strong>

</div>

<div>

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

        }

    );

}

/*==================================================
    PREVIEW
==================================================*/

function renderPreview(){

    preview.innerHTML="";

    homepageSections.forEach(

        section=>{

            const box=

            document.createElement("div");

            box.className=

            "preview-section";

            box.innerHTML=

            `

<div class="preview-title">

${section.type}

</div>

`;

            preview.appendChild(box);

        }

    );

}

/*==================================================
    SELECT SECTION
==================================================*/

function selectSection(id){

    selectedSection=

    homepageSections.find(

        s=>s.id===id

    );

    renderSettings();

}

/*==================================================
    SETTINGS PANEL
==================================================*/

function renderSettings(){

    if(!selectedSection){

        settingsPanel.innerHTML=

        "Select a section";

        return;

    }

    settingsPanel.innerHTML=

`

<h3>

${selectedSection.type}

</h3>

<button id="duplicateSection">

Duplicate

</button>

<button id="deleteSection">

Delete

</button>

`;

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
    ADD SECTION
==================================================*/

function showAddSectionDialog(){

    const type=

    prompt(

`Enter section type

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

    const data={

        type,

        order:

        homepageSections.length+1,

        published:true,

        createdAt:Date.now()

    };

    await addDoc(

        collection(

            db,

            "homepageSections"

        ),

        data

    );

    await loadSections();

    renderSectionList();

    renderPreview();

}

/*==================================================
    DUPLICATE
==================================================*/

async function duplicateSelectedSection(){

    if(!selectedSection)

    return;

    const copy={

        ...selectedSection,

        order:

        homepageSections.length+1

    };

    delete copy.id;

    await addDoc(

        collection(

            db,

            "homepageSections"

        ),

        copy

    );

    await loadSections();

    renderSectionList();

    renderPreview();

}

/*==================================================
    DELETE
==================================================*/

async function deleteSelectedSection(){

    if(!selectedSection)

    return;

    if(

!confirm(

"Delete section?"

)

)

return;

    await deleteDoc(

doc(

db,

"homepageSections",

selectedSection.id

)

);

    selectedSection=null;

    await loadSections();

    renderSectionList();

    renderPreview();

    renderSettings();

}

/*==================================================
    SAVE ORDER
==================================================*/

async function saveOrder(){

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

    renderSectionList();

    renderPreview();

}