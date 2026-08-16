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
    document.getElementById(
        "settingsForm"
    );


const logoInput =
    document.getElementById(
        "logo"
    );


const logoPreview =
    document.getElementById(
        "logoPreview"
    );


const logoPlaceholder =
    document.getElementById(
        "logoPlaceholder"
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
    SETTINGS DOCUMENT
==================================================*/

const settingsRef =
    doc(
        db,
        "settings",
        "general"
    );


/*==================================================
    ADMIN STATE
==================================================*/

let currentUser =
    null;


let adminVerified =
    false;


/*==================================================
    INIT
==================================================*/

initSettings();


/*==================================================
    INITIALIZE
==================================================*/

function initSettings(){

    onAuthStateChanged(
        auth,
        async user => {

            /*==========================================
                NOT LOGGED IN
            ==========================================*/

            if(!user){

                window.location.href =
                    "/admin/login.html";

                return;

            }


            try{

                /*======================================
                    CHECK ADMIN DOCUMENT
                ======================================*/

                const adminRef =
                    doc(
                        db,
                        "admins",
                        user.uid
                    );


                const adminSnapshot =
                    await getDoc(
                        adminRef
                    );


                /*======================================
                    NOT ADMIN
                ======================================*/

                if(
                    !adminSnapshot.exists()
                ){

                    console.warn(
                        "User is not an admin."
                    );


                    alert(
                        "Not authorized"
                    );


                    await auth.signOut();


                    window.location.href =
                        "/admin/login.html";


                    return;

                }


                /*======================================
                    ADMIN VERIFIED
                ======================================*/

                currentUser =
                    user;


                adminVerified =
                    true;


                /*======================================
                    LOAD SETTINGS
                ======================================*/

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

}


/*==================================================
    LOAD SETTINGS
==================================================*/

async function loadSettings(){

    try{

        const snapshot =
            await getDoc(
                settingsRef
            );


        /*==============================================
            NO SETTINGS YET
        ==============================================*/

        if(
            !snapshot.exists()
        ){

            console.log(
                "No settings document found yet."
            );


            /*------------------------------------------
                DEFAULT ORDER BUTTON
            ------------------------------------------*/

            setValue(
                "orderButton",
                "whatsapp"
            );


            setValue(
                "razorpayKeyId",
                ""
            );


            return;

        }


        const settings =
            snapshot.data();


        /*==============================================
            COMPANY NAME
        ==============================================*/

        setValue(
            "companyName",
            settings.companyName
        );


        /*==============================================
            WHATSAPP
        ==============================================*/

        setValue(
            "whatsapp",
            settings.whatsapp
        );


        /*==============================================
            EMAIL
        ==============================================*/

        setValue(
            "email",
            settings.email
        );


        /*==============================================
            ORDER BUTTON
        ==============================================*/

        setValue(
            "orderButton",
            settings.orderButton ||
            "whatsapp"
        );


        /*==============================================
            RAZORPAY KEY ID
        ==============================================*/

        setValue(
            "razorpayKeyId",
            settings.razorpayKeyId ||
            ""
        );


        /*==============================================
            ABOUT US
        ==============================================*/

        setValue(
            "aboutUs",
            settings.aboutUs
        );


        /*==============================================
            CONTACT US
        ==============================================*/

        setValue(
            "contactUs",
            settings.contactUs
        );


        /*==============================================
            TERMS
        ==============================================*/

        setValue(
            "terms",
            settings.terms
        );


        /*==============================================
            PRIVACY
        ==============================================*/

        setValue(
            "privacyPolicy",
            settings.privacyPolicy
        );


        /*==============================================
            REFUND
        ==============================================*/

        setValue(
            "refundPolicy",
            settings.refundPolicy
        );


        /*==============================================
            SHIPPING
        ==============================================*/

        setValue(
            "shippingPolicy",
            settings.shippingPolicy
        );


        /*==============================================
            LOGO
        ==============================================*/

        if(
            settings.logoUrl
        ){

            showLogo(
                settings.logoUrl
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
    LOGO INPUT
==================================================*/

if(logoInput){

    logoInput.addEventListener(
        "change",
        handleLogoChange
    );

}


/*==================================================
    HANDLE LOGO CHANGE
==================================================*/

function handleLogoChange(
    event
){

    const file =
        event.target.files?.[0];


    if(!file){

        return;

    }


    /*==============================================
        IMAGE VALIDATION
    ==============================================*/

    if(
        !file.type.startsWith(
            "image/"
        )
    ){

        showMessage(
            "Please select a valid image file.",
            "error"
        );


        logoInput.value =
            "";


        return;

    }


    /*==============================================
        SIZE VALIDATION
    ==============================================*/

    const maxSize =
        5 * 1024 * 1024;


    if(
        file.size > maxSize
    ){

        showMessage(
            "Logo must be smaller than 5 MB.",
            "error"
        );


        logoInput.value =
            "";


        return;

    }


    /*==============================================
        PREVIEW
    ==============================================*/

    const reader =
        new FileReader();


    reader.onload =
        event => {

            showLogo(
                event.target.result
            );

        };


    reader.onerror =
        () => {

            showMessage(
                "Unable to preview logo.",
                "error"
            );

        };


    reader.readAsDataURL(
        file
    );

}


/*==================================================
    SHOW LOGO
==================================================*/

function showLogo(
    url
){

    if(
        !logoPreview
    ){

        return;

    }


    logoPreview.src =
        url;


    logoPreview.style.display =
        "block";


    if(
        logoPlaceholder
    ){

        logoPlaceholder.style.display =
            "none";

    }

}


/*==================================================
    SAVE SETTINGS
==================================================*/

if(form){

    form.addEventListener(
        "submit",
        handleSave
    );

}


/*==================================================
    SAVE
==================================================*/

async function handleSave(
    event
){

    event.preventDefault();


    /*==============================================
        ADMIN CHECK
    ==============================================*/

    if(
        !currentUser ||
        !adminVerified
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
            VERIFY CURRENT AUTH USER
        ==============================================*/

        const user =
            auth.currentUser;


        if(!user){

            throw new Error(
                "Authentication session expired."
            );

        }


        /*==============================================
            VERIFY ADMIN AGAIN
        ==============================================*/

        const adminRef =
            doc(
                db,
                "admins",
                user.uid
            );


        const adminSnapshot =
            await getDoc(
                adminRef
            );


        if(
            !adminSnapshot.exists()
        ){

            await auth.signOut();


            window.location.href =
                "/admin/login.html";


            return;

        }


        /*==============================================
            GET EXISTING SETTINGS
        ==============================================*/

        const existingSnapshot =
            await getDoc(
                settingsRef
            );


        const existingSettings =
            existingSnapshot.exists()
            ?
            existingSnapshot.data()
            :
            {};


        /*==============================================
            EXISTING LOGO
        ==============================================*/

        let logoUrl =
            existingSettings.logoUrl ||
            "";


        /*==============================================
            NEW LOGO
        ==============================================*/

        const logoFile =
            logoInput?.files?.[0];


        if(logoFile){

            showMessage(
                "Uploading logo...",
                "info"
            );


            /*==========================================
                FILE EXTENSION
            ==========================================*/

            const extension =
                getFileExtension(
                    logoFile.name
                );


            /*==========================================
                UNIQUE FILE NAME
            ==========================================*/

            const fileName =
                `${user.uid}_${Date.now()}.${extension}`;


            /*==========================================
                STORAGE PATH
            ==========================================*/

            const logoRef =
                ref(
                    storage,
                    `settings/logos/${fileName}`
                );


            /*==========================================
                UPLOAD
            ==========================================*/

            await uploadBytes(
                logoRef,
                logoFile,
                {
                    contentType:
                        logoFile.type,

                    customMetadata:{
                        uploadedBy:
                            user.uid
                    }
                }
            );


            /*==========================================
                DOWNLOAD URL
            ==========================================*/

            logoUrl =
                await getDownloadURL(
                    logoRef
                );

        }


        /*==============================================
            ORDER BUTTON
        ==============================================*/

        let orderButton =
            getValue(
                "orderButton"
            );


        /*
            Only allow the two values that
            product.js understands.
        */

        if(
            orderButton !== "whatsapp" &&
            orderButton !== "buyNow"
        ){

            orderButton =
                "whatsapp";

        }


        /*==============================================
            RAZORPAY KEY
        ==============================================*/

        const razorpayKeyId =
            getValue(
                "razorpayKeyId"
            );


        /*==============================================
            COLLECT SETTINGS
        ==============================================*/

        const settings = {

            /*------------------------------------------
                GENERAL
            ------------------------------------------*/

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


            /*------------------------------------------
                PRODUCT ORDER SETTINGS
            ------------------------------------------*/

            orderButton:
                orderButton,


            razorpayKeyId:
                razorpayKeyId,


            /*------------------------------------------
                WEBSITE CONTENT
            ------------------------------------------*/

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


            /*------------------------------------------
                LOGO
            ------------------------------------------*/

            logoUrl:
                logoUrl,


            /*------------------------------------------
                META
            ------------------------------------------*/

            updatedAt:
                new Date().toISOString(),


            updatedBy:
                user.uid

        };


        /*==============================================
            SAVE FIRESTORE
        ==============================================*/

        showMessage(
            "Saving to Firebase...",
            "info"
        );


        await setDoc(
            settingsRef,
            settings
        );


        /*==============================================
            SUCCESS
        ==============================================*/

        showMessage(
            "Settings saved successfully.",
            "success"
        );


        /*==============================================
            UPDATE PREVIEW
        ==============================================*/

        if(
            logoUrl
        ){

            showLogo(
                logoUrl
            );

        }


        /*==============================================
            RESET FILE INPUT
        ==============================================*/

        if(
            logoInput
        ){

            logoInput.value =
                "";

        }

    }

    catch(error){

        console.error(
            "===================================="
        );

        console.error(
            "SETTINGS SAVE ERROR"
        );

        console.error(
            error
        );

        console.error(
            "Error code:",
            error?.code
        );

        console.error(
            "Error message:",
            error?.message
        );

        console.error(
            "===================================="
        );


        /*==============================================
            FIRESTORE PERMISSION
        ==============================================*/

        if(
            error?.code ===
            "permission-denied"
        ){

            showMessage(
                "Permission denied. Check your Firestore security rules.",
                "error"
            );

            return;

        }


        /*==============================================
            STORAGE UNAUTHORIZED
        ==============================================*/

        if(
            error?.code ===
            "storage/unauthorized"
        ){

            showMessage(
                "Logo upload permission denied. Check your Firebase Storage rules.",
                "error"
            );

            return;

        }


        /*==============================================
            STORAGE UNAUTHENTICATED
        ==============================================*/

        if(
            error?.code ===
            "storage/unauthenticated"
        ){

            showMessage(
                "Firebase authentication is required for logo upload.",
                "error"
            );

            return;

        }


        /*==============================================
            STORAGE QUOTA
        ==============================================*/

        if(
            error?.code ===
            "storage/quota-exceeded"
        ){

            showMessage(
                "Firebase Storage quota exceeded.",
                "error"
            );

            return;

        }


        /*==============================================
            NETWORK
        ==============================================*/

        if(
            error?.code ===
            "unavailable"
        ){

            showMessage(
                "Network unavailable. Please try again.",
                "error"
            );

            return;

        }


        /*==============================================
            GENERIC ERROR
        ==============================================*/

        showMessage(
            error?.message
            ?
            `Unable to save settings: ${error.message}`
            :
            "Unable to save settings.",
            "error"
        );

    }

    finally{

        setSaving(
            false
        );

    }

}


/*==================================================
    GET VALUE
==================================================*/

function getValue(
    id
){

    const element =
        document.getElementById(
            id
        );


    if(
        !element
    ){

        return "";

    }


    return String(
        element.value ||
        ""
    ).trim();

}


/*==================================================
    SET VALUE
==================================================*/

function setValue(
    id,
    value
){

    const element =
        document.getElementById(
            id
        );


    if(
        !element
    ){

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
        )
        .split(".");


    if(
        parts.length < 2
    ){

        return "jpg";

    }


    const extension =
        parts
            .pop()
            .toLowerCase()
            .replace(
                /[^a-z0-9]/g,
                ""
            );


    return extension ||
        "jpg";

}


/*==================================================
    SAVING STATE
==================================================*/

function setSaving(
    saving
){

    if(
        !saveButton
    ){

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

    if(
        !message
    ){

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