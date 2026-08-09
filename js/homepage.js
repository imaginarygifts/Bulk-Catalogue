import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    query,
    where,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


/*==================================================
    ELEMENTS
==================================================*/

const homepage =
    document.getElementById("homepage");

const loader =
    document.getElementById("homepageLoader");


/*==================================================
    INIT
==================================================*/

document.addEventListener(
    "DOMContentLoaded",
    loadHomepage
);


/*==================================================
    LOAD HOMEPAGE
==================================================*/

async function loadHomepage(){

    try{

        showLoader();


        const q = query(

            collection(
                db,
                "homepageSections"
            ),

            where(
                "published",
                "==",
                true
            ),

            orderBy(
                "order"
            )

        );


        const snapshot =
            await getDocs(q);


        homepage.innerHTML = "";


        snapshot.forEach(
            docSnap => {

                const section = {

                    id: docSnap.id,

                    ...docSnap.data()

                };


                renderSection(
                    homepage,
                    section
                );

            }
        );


        hideLoader();

    }

    catch(error){

        console.error(
            "Homepage loading error:",
            error
        );


        homepage.innerHTML = `

            <div class="homepage-error">

                <h2>
                    Unable to load homepage
                </h2>

                <p>
                    Please try again later.
                </p>

            </div>

        `;


        hideLoader();

    }

}
