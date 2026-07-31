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

const drawer =
document.getElementById("sectionDrawer");

const drawerList =
document.getElementById("drawerList");

const drawerSearch =
document.getElementById("drawerSearch");

const closeDrawer =
document.getElementById("closeDrawer");

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

        openSectionDrawer

    );

    closeDrawer.addEventListener(

        "click",

        closeSectionDrawer

    );

    drawerSearch.addEventListener(

        "input",

        renderDrawerItems

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





function getSectionIcon(type){

    switch(type){

        case "banner":
            return "fa-image";

        case "heading":
            return "fa-heading";

        case "productCarousel":
            return "fa-box";

        case "imageCarousel":
            return "fa-images";

        case "youtubeCarousel":
            return "fa-circle-play";

        case "reviewCarousel":
            return "fa-star";

        case "spacer":
            return "fa-arrows-up-down";

        default:
            return "fa-layer-group";

    }

}





function getSectionLabel(type){

    switch(type){

        case "banner":
            return "Hero Banner";

        case "heading":
            return "Heading";

        case "productCarousel":
            return "Product Carousel";

        case "imageCarousel":
            return "Image Gallery";

        case "youtubeCarousel":
            return "YouTube Videos";

        case "reviewCarousel":
            return "Customer Reviews";

        case "spacer":
            return "Spacer";

        default:
            return type;

    }

}


/*==================================================
    RENDER SECTION LIST
==================================================*/

function renderSectionList(){

    sectionList.innerHTML="";

    homepageSections.forEach(section=>{

        const card=document.createElement("div");

        card.className="section-card";

        if(
            selectedSection &&
            selectedSection.id===section.id
        ){
            card.classList.add("active");
        }

        card.innerHTML=`

<div class="section-card-header">

<div class="left">

<i class="fa-solid fa-grip-vertical drag-handle"></i>

<i class="fa-solid ${getSectionIcon(section.type)} section-icon"></i>

<div>

<div class="section-title">

${section.order}. ${section.title || getSectionLabel(section.type)}

</div>

<div class="section-subtitle">

${getSectionLabel(section.type)}

</div>

</div>

</div>

<div class="right">

<span class="status-badge ${section.published ? "published" : "draft"}">

${section.published ? "Live" : "Draft"}

</span>

<button class="icon-btn duplicate-btn">

<i class="fa-regular fa-copy"></i>

</button>

<button class="icon-btn delete-btn">

<i class="fa-regular fa-trash-can"></i>

</button>

</div>

</div>

`;

        card.addEventListener(

            "click",

            ()=>{

                selectSection(section.id);

            }

        );

        card.querySelector(".duplicate-btn")

        .addEventListener(

            "click",

            async e=>{

                e.stopPropagation();

                selectedSection=section;

                await duplicateSelectedSection();

            }

        );

        card.querySelector(".delete-btn")

        .addEventListener(

            "click",

            async e=>{

                e.stopPropagation();

                selectedSection=section;

                await deleteSelectedSection();

            }

        );

        sectionList.appendChild(card);

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

const availableSections = [

{
    category:"Basic",
    items:[
        {
            type:"banner",
            title:"Hero Banner",
            icon:"fa-image"
        },
        {
            type:"heading",
            title:"Heading",
            icon:"fa-heading"
        },
        {
            type:"spacer",
            title:"Spacer",
            icon:"fa-arrows-up-down"
        }
    ]
},

{
    category:"Products",
    items:[
        {
            type:"productCarousel",
            title:"Product Carousel",
            icon:"fa-box"
        }
    ]
},

{
    category:"Media",
    items:[
        {
            type:"imageCarousel",
            title:"Image Carousel",
            icon:"fa-images"
        },
        {
            type:"youtubeCarousel",
            title:"YouTube Carousel",
            icon:"fa-circle-play"
        }
    ]
},

{
    category:"Social Proof",
    items:[
        {
            type:"reviewCarousel",
            title:"Review Carousel",
            icon:"fa-star"
        }
    ]
}

];

function openSectionDrawer(){

    drawer.classList.add("open");

    drawerSearch.value="";

    renderDrawerItems();

}

function closeSectionDrawer(){

    drawer.classList.remove("open");

}

function renderDrawerItems(){

    const keyword = drawerSearch.value
        .toLowerCase()
        .trim();

    drawerList.innerHTML = "";

    availableSections.forEach(group=>{

        const items = group.items.filter(item=>

            item.title
            .toLowerCase()
            .includes(keyword)

        );

        if(items.length===0) return;

        const heading=document.createElement("h3");

        heading.className="drawer-category";

        heading.textContent=group.category;

        drawerList.appendChild(heading);

        items.forEach(item=>{

            const div=document.createElement("div");

            div.className="drawer-item";

            div.innerHTML=`

<i class="fa-solid ${item.icon}"></i>

<div>

<h4>${item.title}</h4>

<p>${item.type}</p>

</div>

`;

            div.onclick=async()=>{

                closeSectionDrawer();

                await createSection(item.type);

            };

            drawerList.appendChild(div);

        });

    });

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

                categoryType:"all",

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