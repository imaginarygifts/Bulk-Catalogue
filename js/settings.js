/*==================================================
    SETTINGS
==================================================*/

import { db, storage } from "./firebase.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";


/*==================================================
    DOM
==================================================*/

const logoInput =
    document.getElementById(
        "logoInput"
    );


const logoPreview =
    document.getElementById(
        "logoPreview"
    );


const companyName =
    document.getElementById(
        "companyName"
    );


const whatsappNumber =
    document.getElementById(
        "whatsappNumber"
    );


const email =
    document.getElementById(
        "email"
    );


const aboutUs =
    document.getElementById(
        "aboutUs"
    );


const contactUs =
    document.getElementById(
        "contactUs"
    );


const termsAndConditions =
    document.getElementById(
        "termsAndConditions"
    );


const privacyPolicy =
    document.getElementById(
        "privacyPolicy"
    );


const refundPolicy =
    document.getElementById(
        "refundPolicy"
    );


const shippingPolicy =
    document.getElementById(
        "shippingPolicy"
    );


const saveButton =
    document.getElementById(
        "saveSettings"
    );


const message =
    document.getElementById(
        "settingsMessage"
    );


/*==================================================
    FIRESTORE LOCATION
==================================================*/

const settingsRef =
    doc(
        db,
        "settings",
        "general"
    );


/*==================================================
    CURRENT LOGO URL
==================================================*/

let currentLogoUrl = "";


/*==================================================
    INIT
==================================================*/

document.addEventListener(
    "DOMContentLoaded",
    loadSettings
);


/*==================================================
    LOAD SETTINGS
==================================================*/

async function loadSettings(){

    try{

        const snapshot =
            await getDoc(
                settingsRef
            );


        if(
            !snapshot.exists()
        ){

            return;

        }


        const data =
            snapshot.data();


        /*=========================================
            GENERAL
        =========================================*/

        companyName.value =
            data.companyName ||
            "";


        whatsappNumber.value =
            data.whatsappNumber ||
            "";


        email.value =
            data.email ||
            "";


        /*=========================================
            CONTENT
        =========================================*/

        aboutUs.value =
            data.aboutUs ||
            "";


        contactUs.value =
            data.contactUs ||
            "";


        termsAndConditions.value =
            data.termsAndConditions ||
            "";


        privacyPolicy.value =
            data.privacyPolicy ||
            "";


        refundPolicy.value =
            data.refundPolicy ||
            "";


        shippingPolicy.value =
            data.shippingPolicy ||
            "";


        /*=========================================
            LOGO
        =========================================*/

        currentLogoUrl =
            data.logoUrl ||
            "";


        if(currentLogoUrl){

            showLogo(
                currentLogoUrl
            );

        }

    }

    catch(error){

        console.error(
            "Settings loading error:",
            error
        );


        showMessage(
            "Unable to load settings.",
            "error"
        );

    }

}


/*==================================================
    LOGO PREVIEW
==================================================*/

logoInput?.addEventListener(
    "change",
    () => {

        const file =
            logoInput.files?.[0];


        if(!file){

            return;

        }


        if(
            !file.type.startsWith(
                "image/"
            )
        ){

            showMessage(
                "Please select an image file.",
                "error"
            );

            logoInput.value = "";

            return;

        }


        const reader =
            new FileReader();


        reader.onload =
            event => {

                showLogo(
                    event.target.result
                );

            };


        reader.readAsDataURL(
            file
        );

    }
);


/*==================================================
    SHOW LOGO
==================================================*/

function showLogo(
    url
){

    logoPreview.innerHTML = `

        <img
            src="${escapeAttribute(url)}"
            alt="Company Logo"
        >

    `;

}


/*==================================================
    SAVE SETTINGS
==================================================*/

saveButton?.addEventListener(
    "click",
    saveSettings
);


async function saveSettings(){

    try{

        saveButton.disabled =
            true;


        saveButton.textContent =
            "Saving...";


        showMessage(
            "",
            ""
        );


        /*=========================================
            LOGO
        =========================================*/

        let logoUrl =
            currentLogoUrl;


        const logoFile =
            logoInput.files?.[0];


        if(logoFile){

            /*
                Create unique filename
            */

            const extension =
                getFileExtension(
                    logoFile.name
                );


            const fileName =
                `logo-${Date.now()}.${extension}`;


            const storageRef =
                ref(
                    storage,
                    `settings/logo/${fileName}`
                );


            /*
                Upload
            */

            await uploadBytes(
                storageRef,
                logoFile
            );


            /*
                Get public download URL
            */

            logoUrl =
                await getDownloadURL(
                    storageRef
                );

        }


        /*=========================================
            DATA
        =========================================*/

        const data = {

            logoUrl:

                logoUrl || "",


            companyName:

                companyName.value.trim(),


            whatsappNumber:

                whatsappNumber.value.trim(),


            email:

                email.value.trim(),


            aboutUs:

                aboutUs.value.trim(),


            contactUs:

                contactUs.value.trim(),


            termsAndConditions:

                termsAndConditions.value.trim(),


            privacyPolicy:

                privacyPolicy.value.trim(),


            refundPolicy:

                refundPolicy.value.trim(),


            shippingPolicy:

                shippingPolicy.value.trim(),


            updatedAt:

                serverTimestamp()

        };


        /*=========================================
            SAVE FIRESTORE
        =========================================*/

        await setDoc(
            settingsRef,
            data,
            {
                merge:true
            }
        );


        /*=========================================
            UPDATE LOCAL
        =========================================*/

        currentLogoUrl =
            logoUrl;


        logoInput.value =
            "";


        /*=========================================
            SUCCESS
        =========================================*/

        showMessage(
            "Settings saved successfully.",
            "success"
        );

    }

    catch(error){

        console.error(
            "Settings save error:",
            error
        );


        showMessage(
            "Unable to save settings. Please try again.",
            "error"
        );

    }

    finally{

        saveButton.disabled =
            false;


        saveButton.textContent =
            "Save Settings";

    }

}


/*==================================================
    FILE EXTENSION
==================================================*/

function getFileExtension(
    fileName
){

    const parts =
        String(fileName)
            .split(".");


    return (
        parts.length > 1
            ? parts.pop()
            : "jpg"
    )
    .toLowerCase();

}


/*==================================================
    MESSAGE
==================================================*/

function showMessage(
    text,
    type
){

    if(!message){

        return;

    }


    message.textContent =
        text;


    message.className =
        "settings-message";


    if(type){

        message.classList.add(
            type
        );

    }

}


/*==================================================
    ESCAPE
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


function escapeAttribute(
    value
){

    return escapeHtml(
        value
    );

}