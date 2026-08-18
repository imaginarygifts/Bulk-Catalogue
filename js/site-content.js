/* =====================================================
   SITE CONTENT LOADER
===================================================== */

import { db } from "./firebase.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


const settingsRef =
    doc(
        db,
        "settings",
        "general"
    );


/* =====================================================
   LOAD WEBSITE SETTINGS
===================================================== */

export async function loadSiteSettings(){

    try{

        const snapshot =
            await getDoc(
                settingsRef
            );


        if(
            !snapshot.exists()
        ){

            console.warn(
                "Website settings not found."
            );

            return {};

        }


        return snapshot.data();

    }

    catch(error){

        console.error(
            "Unable to load website settings:",
            error
        );

        return {};

    }

}


/* =====================================================
   LOAD CONTENT PAGE
===================================================== */

export async function loadContentPage(
    field
){

    const settings =
        await loadSiteSettings();


    const content =
        settings[field] ||
        "";


    const contentElement =
        document.getElementById(
            "pageContent"
        );


    if(
        !contentElement
    ){

        console.warn(
            "#pageContent not found."
        );

        return;

    }


    contentElement.textContent =
        content;

}

/* =====================================================
   AUTO LOAD PAGE CONTENT
===================================================== */

const field =
    document.body?.dataset?.contentField;


if(field){

    loadContentPage(
        field
    );

}