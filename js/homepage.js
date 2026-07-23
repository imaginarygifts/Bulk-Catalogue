/*==================================================
    HOMEPAGE.JS
==================================================*/

import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    query,
    where,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { renderBanner } from "./components/banner.js";
import { renderHeading } from "./components/heading.js";
import { renderProductCarousel } from "./components/product-carousel.js";
import { renderImageCarousel } from "./components/image-carousel.js";
import { renderYoutubeCarousel } from "./components/youtube-carousel.js";
import { renderReviewCarousel } from "./components/review-carousel.js";
import { renderSpacer } from "./components/spacer.js";

/*==================================================
    ELEMENTS
==================================================*/

const homepage = document.getElementById("homepage");

/*==================================================
    DATA
==================================================*/

let homepageSections = [];

/*==================================================
    LOAD HOMEPAGE
==================================================*/

async function loadHomepage() {

    try {

        const q = query(
            collection(db, "homepageSections"),
            where("published", "==", true),
            orderBy("order")
        );

        const snap = await getDocs(q);

        homepageSections = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        renderHomepage();

    }

    catch (err) {

        console.error("Homepage Load Error", err);

    }

}

/*==================================================
    RENDER HOMEPAGE
==================================================*/

function renderHomepage() {

    homepage.innerHTML = "";

    homepageSections.forEach(section => {

        switch (section.type) {

            case "banner":

                renderBanner(homepage, section);

                break;

            case "heading":

                renderHeading(homepage, section);

                break;

            case "productCarousel":

                renderProductCarousel(homepage, section);

                break;

            case "imageCarousel":

                renderImageCarousel(homepage, section);

                break;

            case "youtubeCarousel":

                renderYoutubeCarousel(homepage, section);

                break;

            case "reviewCarousel":

                renderReviewCarousel(homepage, section);

                break;

            case "spacer":

                renderSpacer(homepage, section);

                break;

            default:

                console.warn(
                    "Unknown Section",
                    section.type
                );

        }

    });

}

/*==================================================
    INIT
==================================================*/

async function init() {

    await loadHomepage();

}

init();