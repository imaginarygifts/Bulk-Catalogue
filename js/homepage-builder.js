/*==================================================
 HOMEPAGE BUILDER
 PART 1
==================================================*/

const Builder = {

    sections: [],

    selectedSection: null,

    history: [],

    templates: []

};

/*==================================================
 SECTION TYPES
==================================================*/

const SectionRegistry = {

    heroBanner: {
        title: "Hero Banner",
        icon: "fa-image"
    },

    offerBanner: {
        title: "Offer Banner",
        icon: "fa-tags"
    },

    imageCarousel: {
        title: "Image Carousel",
        icon: "fa-images"
    },

    productCarousel: {
        title: "Product Carousel",
        icon: "fa-cart-shopping"
    },

    categoryCarousel: {
        title: "Category Carousel",
        icon: "fa-table-cells-large"
    },

    youtubeShorts: {
        title: "YouTube Shorts",
        icon: "fa-youtube"
    },

    reviews: {
        title: "Reviews",
        icon: "fa-star"
    },

    features: {
        title: "Feature Icons",
        icon: "fa-truck-fast"
    },

    divider: {
        title: "Divider",
        icon: "fa-minus"
    },

    spacer: {
        title: "Spacer",
        icon: "fa-arrows-up-down"
    }

};

/*==================================================
 INIT
==================================================*/

document.addEventListener("DOMContentLoaded", () => {

    initBuilder();

});

/*==================================================
 INIT BUILDER
==================================================*/

function initBuilder(){

    bindEvents();

    renderSections();

    initSortable();

}

/*==================================================
 EVENTS
==================================================*/

function bindEvents(){

    document
    .getElementById("addSectionButton")
    .addEventListener("click", openDrawer);

    document
    .getElementById("closeDrawer")
    .addEventListener("click", closeDrawer);

    document
    .querySelectorAll(".drawer-item")
    .forEach(item=>{

        item.addEventListener("click",()=>{

            addSection(item.dataset.type);

        });

    });

}

/*==================================================
 OPEN DRAWER
==================================================*/

function openDrawer(){

    document
    .getElementById("sectionDrawer")
    .classList
    .add("open");

}

/*==================================================
 CLOSE DRAWER
==================================================*/

function closeDrawer(){

    document
    .getElementById("sectionDrawer")
    .classList
    .remove("open");

}

/*==================================================
 CREATE SECTION
==================================================*/

function addSection(type){

    const config = SectionRegistry[type];

    if(!config) return;

    const section={

        id:createId(),

        type:type,

        title:config.title,

        visible:true,

        settings:{},

        items:[]

    };

    Builder.sections.push(section);

    renderSections();

    selectSection(section.id);

    closeDrawer();

}

/*==================================================
 RENDER LIST
==================================================*/

function renderSections(){

    const list=document.getElementById("sectionList");

    list.innerHTML="";

    Builder.sections.forEach(section=>{

        list.appendChild(

            createSectionCard(section)

        );

    });

}

/*==================================================
 CARD
==================================================*/

function createSectionCard(section){

    const template=document
    .getElementById("sectionCardTemplate");

    const card=template
    .content
    .cloneNode(true);

    const root=card.querySelector(".section-card");

    root.dataset.id=section.id;

    card.querySelector(".section-title")
    .textContent=section.title;

    card.querySelector(".section-subtitle")
    .textContent=section.visible
    ?"Visible":"Hidden";

    root.addEventListener("click",()=>{

        selectSection(section.id);

    });

    return card;

}

/*==================================================
 SELECT
==================================================*/

function selectSection(id){

    Builder.selectedSection=id;

    document
    .querySelectorAll(".section-card")
    .forEach(card=>{

        card.classList.remove("active");

    });

    const active=document.querySelector(
        `[data-id="${id}"]`
    );

    if(active){

        active.classList.add("active");

    }

    openEditor(id);

}

/*==================================================
 EDITOR
==================================================*/

function openEditor(id){

    const panel=document
    .getElementById("settingsPanel");

    const empty=document
    .querySelector(".settings-empty");

    empty.style.display="none";

    panel.style.display="block";

    const section=findSection(id);

    if(!section) return;

    panel.innerHTML=`

        <h2>${section.title}</h2>

        <p style="margin:10px 0 30px;color:#888">

        Editor loading...

        </p>

    `;

}

/*==================================================
 FIND
==================================================*/

function findSection(id){

    return Builder.sections.find(

        s=>s.id===id

    );

}

/*==================================================
 ID
==================================================*/

function createId(){

    return "sec_"+Date.now()+"_"+

    Math.floor(Math.random()*9999);

}

/*==================================================
 SORTABLE
==================================================*/

function initSortable(){

    new Sortable(

        document.getElementById("sectionList"),

        {

            animation:200,

            handle:".drag-handle",

            onEnd:updateOrder

        }

    );

}

/*==================================================
 UPDATE ORDER
==================================================*/

function updateOrder(){

    const ids=[

        ...document.querySelectorAll(

            ".section-card"

        )

    ].map(card=>card.dataset.id);

    Builder.sections.sort(

        (a,b)=>

        ids.indexOf(a.id)-

        ids.indexOf(b.id)

    );

}

/*==================================================
 TOAST
==================================================*/

function showToast(message){

    const toast=document.getElementById("toast");

    document
    .getElementById("toastMessage")
    .textContent=message;

    toast.classList.add("show");

    setTimeout(()=>{

        toast.classList.remove("show");

    },2500);

}