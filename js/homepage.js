/*==================================================
    HOMEPAGE.JS
    Base File
==================================================*/

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

const home = document.querySelector(".homepage");

const scrollTopBtn =
    document.getElementById("scrollTop");

/*==================================================
    DATA
==================================================*/

let products = [];
let categories = [];
let reviews = [];

/*==================================================
    SETTINGS
==================================================*/

const HOME = {

    productLimit: 10,

    autoSlideDelay: 4000,

    animationSpeed: 300

};

/*==================================================
    LOAD DATA
==================================================*/

async function loadProducts(){

    try{

        const snap = await getDocs(
            collection(db,"products")
        );

        products = snap.docs.map(doc=>({

            id:doc.id,

            ...doc.data()

        }));

        console.log(
            "Products Loaded:",
            products.length
        );

    }

    catch(err){

        console.error(err);

    }

}

async function loadCategories(){

    try{

        const snap = await getDocs(

            query(

                collection(db,"categories"),

                orderBy("order")

            )

        );

        categories = snap.docs.map(doc=>({

            id:doc.id,

            ...doc.data()

        }));

    }

    catch(err){

        console.error(err);

    }

}

async function loadReviews(){

    try{

        const snap = await getDocs(
            collection(db,"reviews")
        );

        reviews = snap.docs.map(doc=>({

            id:doc.id,

            ...doc.data()

        }));

    }

    catch{

        reviews=[];

    }

}

/*==================================================
    HELPERS
==================================================*/

function money(price){

    return "₹"+Number(price).toLocaleString();

}

function discount(product){

    if(

        !product.salePrice ||

        product.salePrice>=product.basePrice

    ){

        return 0;

    }

    return Math.round(

        (

            (product.basePrice-

            product.salePrice)

            /

            product.basePrice

        )*100

    );

}

function getCategory(id){

    return categories.find(

        c=>c.id===id

    );

}

function byCategory(id){

    return products.filter(

        p=>p.categoryId===id

    );

}

function bySubCategory(id){

    return products.filter(

        p=>p.subCategoryId===id

    );

}

function byTag(tag){

    return products.filter(

        p=>

        Array.isArray(p.tags)

        &&

        p.tags.includes(tag)

    );

}

function latest(limit=10){

    return [...products]

    .sort(

        (a,b)=>

        b.createdAt-a.createdAt

    )

    .slice(0,limit);

}

/*==================================================
    RENDER
==================================================*/

function renderHome(){

    console.log("Homepage Ready");

    /*
        Banner Slider

        Image Carousel

        Product Carousel

        Youtube Carousel

        Review Carousel

        Future Sections
    */

}

/*==================================================
    SCROLL TOP
==================================================*/

window.addEventListener(

    "scroll",

    ()=>{

        if(window.scrollY>300){

            scrollTopBtn.style.display="flex";

        }

        else{

            scrollTopBtn.style.display="none";

        }

    }

);

scrollTopBtn.onclick=()=>{

    window.scrollTo({

        top:0,

        behavior:"smooth"

    });

};

/*==================================================
    INIT
==================================================*/

async function init(){

    console.log("Loading Homepage...");

    await Promise.all([

        loadProducts(),

        loadCategories(),

        loadReviews()

    ]);

    renderHome();

}

init();