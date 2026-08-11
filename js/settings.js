/*==================================================
    ADMIN SETTINGS
==================================================*/

import {
    auth,
    db,
    storage
} from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";


/*==================================================
    DOM
==================================================*/

const form =
    document.getElementById("settingsForm");

const logoInput =
    document.getElementById("logo");

const logoPreview =
    document.getElementById("logoPreview");

const saveButton =
    document.getElementById("saveSettings");

const message =
    document.getElementById("settingsMessage");


/*==================================================
    SETTINGS DOCUMENT
==================================================*/

const SETTINGS_DOC =
    doc(
        db,
        "settings",
        "general"
    );


/*==================================================
    CURRENT USER
==================================================*/

let currentUser = null;

let isAdmin = false;


/*==================================================
    AUTH CHECK
==================================================*/

onAuthStateChanged(
    auth,
    async user => {

        if(!user){

            window.location.href =
                "/admin/login.html";

            return;

        }


        try{

            /*
                Check admin document using
                Firebase Auth UID.
            */

            const adminRef =
                doc(
                    db,
                    "admins",
                    user.uid
                );


            const adminSnap =
                await getDoc(
                    adminRef
                );


            if(!adminSnap.exists()){

                alert(
                    "You are not authorized to access admin settings."
                );


                await auth.signOut();


                window.location.href =
                    "/admin/login.html";


                return;

            }


            currentUser =
                user;


            isAdmin =
                true;


            /*
                Load existing settings
            */

            await loadSettings();


        }

        catch(error){

            console.error(
                "Admin verification error:",
                error
            );


            showMessage(
                "Unable to verify admin access.",
                "error"
            );

        }

    }
);


/*==================================================
    LOAD SETTINGS
==================================================*/

async function loadSettings(){

    try{

        const snapshot =
            await getDoc(
                SETTINGS_DOC
            );


        if(!snapshot.exists()){

            /*
                No settings saved yet.
                Keep form empty.
            */

            return;

        }


        const settings =
            snapshot.data();


        /*==============================================
            COMPANY
        ==============================================*/

        setValue(
            "companyName",
            settings.companyName
        );


        setValue(
            "whatsapp",
            settings.whatsapp
        );


        setValue(
            "email",
            settings.email
        );


        /*==============================================
            PAGES
        ==============================================*/

        setValue(
            "aboutUs",
            settings.aboutUs
        );


        setValue(
            "contactUs",
            settings.contactUs
        );


        setValue(
            "terms",
            settings.terms
        );


        setValue(
            "privacyPolicy",
            settings.privacyPolicy
        );


        setValue(
            "refundPolicy",
            settings.refundPolicy
        );


        setValue(
            "shippingPolicy",
            settings.shippingPolicy
        );


        /*==============================================
            LOGO
        ==============================================*/

        if(
            settings.logoUrl &&
            logoPreview
        ){

            logoPreview.src =
                settings.logoUrl;

            logoPreview.style.display =
                "block";

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
    event => {

        const file =
            event.target.files?.[0];


        if(!file){

            return;

        }


        /*
            Only images
        */

        if(
            !file.type.startsWith(
                "image/"
            )
        ){

            showMessage(
                "Please select an image file.",
                "error"
            );


            logoInput.value =
                "";


            return;

        }


        /*
            5 MB limit
        */

        if(
            file.size >
            5 * 1024 * 1024
        ){

            showMessage(
                "Logo must be smaller than 5 MB.",
                "error"
            );


            logoInput.value =
                "";


            return;

        }


        const reader =
            new FileReader();


        reader.onload =
            event => {

                if(!logoPreview){

                    return;

                }


                logoPreview.src =
                    event.target.result;


                logoPreview.style.display =
                    "block";

            };


        reader.readAsDataURL(
            file
        );

    }
);


/*==================================================
    SAVE SETTINGS
==================================================*/

form?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        /*
            Double protection.
            Don't save unless Firebase Auth
            and admin verification succeeded.
        */

        if(
            !currentUser ||
            !isAdmin
        ){

            showMessage(
                "Admin authentication is required.",
                "error"
            );


            return;

        }


        try{

            setSaving(
                true
            );


            showMessage(
                "Saving settings...",
                "info"
            );


            /*==============================================
                VERIFY ADMIN AGAIN
            ==============================================*/

            const adminRef =
                doc(
                    db,
                    "admins",
                    currentUser.uid
                );


            const adminSnap =
                await getDoc(
                    adminRef
                );


            if(!adminSnap.exists()){

                throw new Error(
                    "Admin account is not authorized."
                );

            }


            /*==============================================
                GET EXISTING SETTINGS
            ==============================================*/

            const existingSnapshot =
                await getDoc(
                    SETTINGS_DOC
                );


            const existingSettings =
                existingSnapshot.exists()
                ?
                existingSnapshot.data()
                :
                {};


            /*==============================================
                LOGO
            ==============================================*/

            let logoUrl =
                existingSettings.logoUrl ||
                "";


            const logoFile =
                logoInput?.files?.[0];


            if(logoFile){

                /*
                    Create unique filename.

                    Example:
                    logos/uid_timestamp.png
                */

                const extension =
                    getFileExtension(
                        logoFile.name
                    );


                const fileName =
                    `${currentUser.uid}_${Date.now()}.${extension}`;


                const storageRef =
                    ref(
                        storage,
                        `settings/logos/${fileName}`
                    );


                /*
                    Upload
                */

                await uploadBytes(
                    storageRef,
                    logoFile,
                    {
                        contentType:
                            logoFile.type,

                        customMetadata:{
                            uploadedBy:
                                currentUser.uid
                        }
                    }
                );


                /*
                    Get public download URL
                */

                logoUrl =
                    await getDownloadURL(
                        storageRef
                    );

            }


            /*==============================================
                COLLECT FORM DATA
            ==============================================*/

            const settings = {

                companyName:
                    getValue(
                        "companyName"
                    ),

                whatsapp:
                    getValue(
                        "whatsapp"
                    ),

                email:
                    getValue(
                        "email"
                    ),

                aboutUs:
                    getValue(
                        "aboutUs"
                    ),

                contactUs:
                    getValue(
                        "contactUs"
                    ),

                terms:
                    getValue(
                        "terms"
                    ),

                privacyPolicy:
                    getValue(
                        "privacyPolicy"
                    ),

                refundPolicy:
                    getValue(
                        "refundPolicy"
                    ),

                shippingPolicy:
                    getValue(
                        "shippingPolicy"
                    ),

                logoUrl:
                    logoUrl,

                updatedAt:
                    new Date().toISOString(),

                updatedBy:
                    currentUser.uid

            };


            /*==============================================
                SAVE FIRESTORE
            ==============================================*/

            await setDoc(
                SETTINGS_DOC,
                settings
            );


            /*==============================================
                SUCCESS
            ==============================================*/

            showMessage(
                "Settings saved successfully.",
                "success"
            );


            /*
                Keep preview after save
            */

            if(
                logoUrl &&
                logoPreview
            ){

                logoPreview.src =
                    logoUrl;

                logoPreview.style.display =
                    "block";

            }

        }

        catch(error){

            console.error(
                "SETTINGS SAVE ERROR:",
                error
            );


            /*
                Show actual Firebase error
                instead of only "Unable to save"
            */

            let errorMessage =
                "Unable to save settings.";


            if(
                error?.code ===
                "permission-denied"
            ){

                errorMessage =
                    "Permission denied. Check Firestore/Storage security rules.";

            }


            if(
                error?.code ===
                "storage/unauthorized"
            ){

                errorMessage =
                    "Logo upload permission denied. Check Firebase Storage rules.";

            }


            if(
                error?.code ===
                "storage/unauthenticated"
            ){

                errorMessage =
                    "You are not authenticated for logo upload.";

            }


            showMessage(
                errorMessage,
                "error"
            );

        }

        finally{

            setSaving(
                false
            );

        }

    }
);


/*==================================================
    GET FORM VALUE
==================================================*/

function getValue(
    id
){

    const element =
        document.getElementById(
            id
        );


    if(!element){

        return "";

    }


    return String(
        element.value || ""
    ).trim();

}


/*==================================================
    SET FORM VALUE
==================================================*/

function setValue(
    id,
    value
){

    const element =
        document.getElementById(
            id
        );


    if(!element){

        return;

    }


    element.value =
        value ?? "";

}


/*==================================================
    FILE EXTENSION
==================================================*/

function getFileExtension(
    filename
){

    const parts =
        String(
            filename
        ).split(".");


    if(
        parts.length < 2
    ){

        return "jpg";

    }


    return parts
        .pop()
        .toLowerCase()
        .replace(
            /[^a-z0-9]/g,
            ""
        ) || "jpg";

}


/*==================================================
    SAVE BUTTON
==================================================*/

function setSaving(
    saving
){

    if(!saveButton){

        return;

    }


    saveButton.disabled =
        saving;


    saveButton.textContent =
        saving
        ?
        "Saving..."
        :
        "Save Settings";

}


/*==================================================
    MESSAGE
==================================================*/

function showMessage(
    text,
    type = "info"
){

    if(!message){

        return;

    }


    message.textContent =
        text;


    message.className =
        `settings-message ${type}`;

}


/*==================================================
    EXPORT
==================================================*/

export {
    loadSettings
};