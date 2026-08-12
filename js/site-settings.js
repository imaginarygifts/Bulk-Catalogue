/*==================================================
    SITE SETTINGS
    PUBLIC WEBSITE SETTINGS

    FIRESTORE:

    settings/general

    Fields:

    logoUrl
    companyName
    whatsapp
    email

    siteTitle
    metaDescription

    aboutUs
    contactUs
    terms
    privacyPolicy
    refundPolicy
    shippingPolicy
==================================================*/

import { db } from "./firebase.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


/*==================================================
    CACHE
==================================================*/

let siteSettings = null;

let settingsPromise = null;


/*==================================================
    DEFAULT SETTINGS
==================================================*/

const DEFAULT_SETTINGS = {

    logoUrl: "",

    companyName: "Imaginary Gifts",

    whatsapp: "",

    email: "",

    siteTitle:
        "Imaginary Gifts - Customized Gifts",

    metaDescription:
        "Customized gifts from Imaginary Gifts",

    aboutUs: "",

    contactUs: "",

    terms: "",

    privacyPolicy: "",

    refundPolicy: "",

    shippingPolicy: ""

};


/*==================================================
    LOAD SETTINGS
==================================================*/

async function loadSiteSettings(){

    /*----------------------------------------------
        RETURN CACHE
    ----------------------------------------------*/

    if(siteSettings){

        return siteSettings;

    }


    /*----------------------------------------------
        PREVENT DUPLICATE REQUESTS
    ----------------------------------------------*/

    if(settingsPromise){

        return settingsPromise;

    }


    settingsPromise =
        (async function(){

            try{

                const settingsRef =
                    doc(
                        db,
                        "settings",
                        "general"
                    );


                const snapshot =
                    await getDoc(
                        settingsRef
                    );


                /*--------------------------------------
                    SETTINGS EXIST
                --------------------------------------*/

                if(snapshot.exists()){

                    siteSettings = {

                        ...DEFAULT_SETTINGS,

                        ...snapshot.data()

                    };

                }

                else{

                    console.warn(
                        "settings/general does not exist."
                    );


                    siteSettings = {

                        ...DEFAULT_SETTINGS

                    };

                }


                /*--------------------------------------
                    NORMALIZE
                --------------------------------------*/

                siteSettings.companyName =
                    String(
                        siteSettings.companyName || ""
                    ).trim();


                siteSettings.siteTitle =
                    String(
                        siteSettings.siteTitle || ""
                    ).trim();


                siteSettings.metaDescription =
                    String(
                        siteSettings.metaDescription || ""
                    ).trim();


                siteSettings.email =
                    String(
                        siteSettings.email || ""
                    ).trim();


                siteSettings.whatsapp =
                    normalizeWhatsAppNumber(
                        siteSettings.whatsapp
                    );


                /*--------------------------------------
                    APPLY TO PAGE
                --------------------------------------*/

                applySiteSettings(
                    siteSettings
                );


                return siteSettings;

            }

            catch(error){

                console.error(
                    "Site settings loading error:",
                    error
                );


                /*
                    Keep website functional even
                    when Firebase settings cannot
                    be loaded.
                */

                siteSettings = {

                    ...DEFAULT_SETTINGS

                };


                return siteSettings;

            }

        })();


    return settingsPromise;

}


/*==================================================
    GET SETTINGS
==================================================*/

async function getSiteSettings(){

    return await loadSiteSettings();

}


/*==================================================
    APPLY SETTINGS
==================================================*/

function applySiteSettings(
    settings
){

    if(!settings){

        return;

    }


    /*================================================
        LOGO
    ================================================*/

    const logoElements =
        document.querySelectorAll(
            "#siteLogo, [data-site-logo]"
        );


    logoElements.forEach(
        logo => {

            if(
                settings.logoUrl
            ){

                logo.src =
                    settings.logoUrl;

                logo.style.display =
                    "";

            }


            logo.alt =
                settings.companyName ||
                "Company Logo";

        }
    );


    /*================================================
        COMPANY NAME
    ================================================*/

    const companyNameElements =
        document.querySelectorAll(
            "[data-company-name]"
        );


    companyNameElements.forEach(
        element => {

            element.textContent =
                settings.companyName || "";

        }
    );


    /*================================================
        LOGO LINK
    ================================================*/

    const logoLinks =
        document.querySelectorAll(
            "#logoLink, [data-logo-link]"
        );


    logoLinks.forEach(
        link => {

            link.href =
                getHomeUrl();

        }
    );


    /*================================================
        HOME LINK
    ================================================*/

    const homeLinks =
        document.querySelectorAll(
            "#homeLink, [data-home-link]"
        );


    homeLinks.forEach(
        link => {

            link.href =
                getHomeUrl();

        }
    );


    /*================================================
        EMAIL TEXT
    ================================================*/

    const emailElements =
        document.querySelectorAll(
            "[data-site-email]"
        );


    emailElements.forEach(
        element => {

            element.textContent =
                settings.email || "";

        }
    );


    /*================================================
        EMAIL LINK
    ================================================*/

    const emailLinks =
        document.querySelectorAll(
            "[data-email-link]"
        );


    emailLinks.forEach(
        link => {

            if(
                settings.email
            ){

                link.href =
                    `mailto:${settings.email}`;

            }

        }
    );


    /*================================================
        WHATSAPP LINK
    ================================================*/

    const whatsappLinks =
        document.querySelectorAll(
            "[data-whatsapp-link]"
        );


    whatsappLinks.forEach(
        link => {

            if(
                settings.whatsapp
            ){

                link.href =
                    `https://wa.me/${settings.whatsapp}`;

            }

        }
    );


    /*================================================
        WEBSITE TITLE
    ================================================*/

    /*
        IMPORTANT:

        If a product.js or another page-specific
        script has already created a product title,
        don't overwrite it.

        The global title is applied only when
        the page hasn't explicitly marked itself
        as page-specific.
    */

    const pageUsesCustomTitle =
        document.documentElement.dataset
            .customPageTitle === "true";


    if(
        !pageUsesCustomTitle &&
        settings.siteTitle
    ){

        document.title =
            settings.siteTitle;

    }


    /*================================================
        META DESCRIPTION
    ================================================*/

    const metaDescription =
        document.querySelector(
            'meta[name="description"]'
        );


    const pageUsesCustomDescription =
        document.documentElement.dataset
            .customMetaDescription === "true";


    if(
        metaDescription &&
        !pageUsesCustomDescription &&
        settings.metaDescription
    ){

        metaDescription.setAttribute(
            "content",
            settings.metaDescription
        );

    }


    /*================================================
        OPEN GRAPH TITLE
    ================================================*/

    const ogTitle =
        document.querySelector(
            'meta[property="og:title"]'
        );


    if(
        ogTitle &&
        !pageUsesCustomTitle &&
        settings.siteTitle
    ){

        ogTitle.setAttribute(
            "content",
            settings.siteTitle
        );

    }


    /*================================================
        OPEN GRAPH DESCRIPTION
    ================================================*/

    const ogDescription =
        document.querySelector(
            'meta[property="og:description"]'
        );


    if(
        ogDescription &&
        !pageUsesCustomDescription &&
        settings.metaDescription
    ){

        ogDescription.setAttribute(
            "content",
            settings.metaDescription
        );

    }


    /*================================================
        OPEN GRAPH IMAGE
    ================================================*/

    const ogImage =
        document.querySelector(
            'meta[property="og:image"]'
        );


    if(
        ogImage &&
        settings.logoUrl
    ){

        ogImage.setAttribute(
            "content",
            settings.logoUrl
        );

    }


    /*================================================
        OPEN GRAPH URL
    ================================================*/

    const ogUrl =
        document.querySelector(
            'meta[property="og:url"]'
        );


    if(ogUrl){

        ogUrl.setAttribute(
            "content",
            window.location.href
        );

    }


    /*================================================
        HTML LANG / COMPANY
    ================================================*/

    document.documentElement
        .setAttribute(
            "data-company",
            settings.companyName || ""
        );

}


/*==================================================
    HOME URL
==================================================*/

function getHomeUrl(){

    /*
        No domain is stored in Firebase.

        Current website origin is automatically
        used.

        Example:

        https://imaginarygifts.shopcom.in/

        becomes:

        https://imaginarygifts.shopcom.in/
    */

    return (
        window.location.origin +
        "/"
    );

}


/*==================================================
    WHATSAPP NORMALIZATION
==================================================*/

function normalizeWhatsAppNumber(
    value
){

    if(
        value === null ||
        value === undefined
    ){

        return "";

    }


    return String(
        value
    )
    .replace(
        /\D/g,
        ""
    );

}


/*==================================================
    GET WHATSAPP
==================================================*/

async function getWhatsAppNumber(){

    const settings =
        await loadSiteSettings();


    return (
        settings.whatsapp ||
        ""
    );

}


/*==================================================
    GET COMPANY NAME
==================================================*/

async function getCompanyName(){

    const settings =
        await loadSiteSettings();


    return (
        settings.companyName ||
        ""
    );

}


/*==================================================
    GET COMPANY LOGO
==================================================*/

async function getCompanyLogo(){

    const settings =
        await loadSiteSettings();


    return (
        settings.logoUrl ||
        ""
    );

}


/*==================================================
    GET EMAIL
==================================================*/

async function getCompanyEmail(){

    const settings =
        await loadSiteSettings();


    return (
        settings.email ||
        ""
    );

}


/*==================================================
    GET WEBSITE TITLE
==================================================*/

async function getSiteTitle(){

    const settings =
        await loadSiteSettings();


    return (
        settings.siteTitle ||
        ""
    );

}


/*==================================================
    GET META DESCRIPTION
==================================================*/

async function getMetaDescription(){

    const settings =
        await loadSiteSettings();


    return (
        settings.metaDescription ||
        ""
    );

}


/*==================================================
    GET PAGE CONTENT
==================================================*/

async function getPageContent(
    page
){

    const settings =
        await loadSiteSettings();


    switch(page){

        case "about":

            return settings.aboutUs || "";


        case "contact":

            return settings.contactUs || "";


        case "terms":

            return settings.terms || "";


        case "privacy":

            return settings.privacyPolicy || "";


        case "refund":

            return settings.refundPolicy || "";


        case "shipping":

            return settings.shippingPolicy || "";


        default:

            return "";

    }

}


/*==================================================
    REFRESH
==================================================*/

async function refreshSiteSettings(){

    siteSettings =
        null;

    settingsPromise =
        null;


    return await loadSiteSettings();

}


/*==================================================
    AUTO INITIALIZE
==================================================*/

if(
    document.readyState ===
    "loading"
){

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            loadSiteSettings();

        },
        {
            once: true
        }
    );

}
else{

    loadSiteSettings();

}


/*==================================================
    EXPORT
==================================================*/

export {

    loadSiteSettings,

    getSiteSettings,

    applySiteSettings,

    getWhatsAppNumber,

    getCompanyName,

    getCompanyLogo,

    getCompanyEmail,

    getSiteTitle,

    getMetaDescription,

    getPageContent,

    refreshSiteSettings

};