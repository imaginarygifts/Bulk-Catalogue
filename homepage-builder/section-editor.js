/*==================================================
    SECTION EDITOR
==================================================*/
import { storage } from "../js/firebase.js";

import {
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";


export function renderSectionEditor({
    container,
    section,
    onUpdate,
    onDuplicate,
    onDelete,
    onRefresh
}){

    container.innerHTML = "";

    if(!section){

        container.innerHTML = `

        <div class="editor-empty">

            <h3>No Section Selected</h3>

            <p>Select a section from the left panel.</p>

        </div>

        `;

        return;

    }

    const wrapper = document.createElement("div");

    wrapper.className = "section-editor";

    wrapper.innerHTML = `

        <div class="editor-header">

            <h2>${capitalize(section.type)}</h2>

        </div>

        <div class="editor-body">

            <div id="commonFields"></div>

            <div id="typeFields"></div>

        </div>

        <div class="editor-footer">

            <button id="duplicateBtn">
                Duplicate
            </button>

            <button id="deleteBtn">
                Delete
            </button>

        </div>

    `;

    container.appendChild(wrapper);

    renderCommonFields(
        wrapper.querySelector("#commonFields"),
        section,
        onUpdate
    );

    renderTypeEditor(
        wrapper.querySelector("#typeFields"),
        section,
        onUpdate
    );

    wrapper.querySelector("#duplicateBtn")
        .onclick = onDuplicate;

    wrapper.querySelector("#deleteBtn")
        .onclick = onDelete;

}

/*==================================================
    COMMON FIELDS
==================================================*/

function renderCommonFields(
    container,
    section,
    onUpdate
){

    container.innerHTML = "";

    addTextField(
        container,
        "Title",
        section.title || "",
        value => {

            section.title = value;

            onUpdate(section);

        }

    );

    addTextareaField(
        container,
        "Subtitle",
        section.subtitle || "",
        value => {

            section.subtitle = value;

            onUpdate(section);

        }

    );

}

/*==================================================
    TYPE ROUTER
==================================================*/

function renderTypeEditor(
    container,
    section,
    onUpdate
){

    container.innerHTML = "";

    switch(section.type){

        case "banner":

            renderBannerEditor(
                container,
                section,
                onUpdate
            );

            break;

        case "heading":

            renderHeadingEditor(
                container,
                section,
                onUpdate
            );

            break;

        case "productCarousel":

            renderProductCarouselEditor(
                container,
                section,
                onUpdate
            );

            break;

        case "imageCarousel":

            renderImageCarouselEditor(
                container,
                section,
                onUpdate
            );

            break;

        case "youtubeCarousel":

            renderYoutubeEditor(
                container,
                section,
                onUpdate
            );

            break;

        case "reviewCarousel":

            renderReviewEditor(
                container,
                section,
                onUpdate
            );

            break;

        case "spacer":

            renderSpacerEditor(
                container,
                section,
                onUpdate
            );

            break;

    }

}

/*==================================================
    INPUT COMPONENTS
==================================================*/

function addTextField(
    parent,
    label,
    value,
    callback
){

    const div = document.createElement("div");

    div.className = "editor-field";

    div.innerHTML = `

        <label>${label}</label>

        <input
            type="text"
            value="${value}"
        >

    `;

    div.querySelector("input")
        .addEventListener("input",e=>{

            callback(e.target.value);

        });

    parent.appendChild(div);

}

function addTextareaField(
    parent,
    label,
    value,
    callback
){

    const div = document.createElement("div");

    div.className = "editor-field";

    div.innerHTML = `

        <label>${label}</label>

        <textarea rows="3">${value}</textarea>

    `;

    div.querySelector("textarea")
        .addEventListener("input",e=>{

            callback(e.target.value);

        });

    parent.appendChild(div);

}

function addNumberField(
    parent,
    label,
    value,
    callback
){

    const div = document.createElement("div");

    div.className = "editor-field";

    div.innerHTML = `

        <label>${label}</label>

        <input
            type="number"
            value="${value}"
        >

    `;

    div.querySelector("input")
        .addEventListener("input",e=>{

            callback(Number(e.target.value));

        });

    parent.appendChild(div);

}

function addCheckboxField(
    parent,
    label,
    checked,
    callback
){

    const div = document.createElement("div");

    div.className = "editor-field";

    div.innerHTML = `

        <label>

            <input
                type="checkbox"
                ${checked ? "checked" : ""}

            >

            ${label}

        </label>

    `;

    div.querySelector("input")
        .addEventListener("change",e=>{

            callback(e.target.checked);

        });

    parent.appendChild(div);

}

/*==================================================
    HELPERS
==================================================*/

function capitalize(text){

    if(!text) return "";

    return text.charAt(0).toUpperCase()
        + text.slice(1);

}

/*==================================================
    HEADING EDITOR
==================================================*/

function renderHeadingEditor(
    container,
    section,
    onUpdate
){

    addTextField(
        container,
        "Badge",
        section.badge || "",
        value=>{

            section.badge=value;

            onUpdate(section);

        }
    );

}

/*==================================================
    SPACER EDITOR
==================================================*/

function renderSpacerEditor(
    container,
    section,
    onUpdate
){

    addNumberField(
        container,
        "Height (px)",
        section.height || 40,
        value=>{

            section.height=value;

            onUpdate(section);

        }
    );

    addTextField(
        container,
        "Background",
        section.background || "transparent",
        value=>{

            section.background=value;

            onUpdate(section);

        }
    );

}

/*==================================================
    BANNER EDITOR
==================================================*/

function renderBannerEditor(
    container,
    section,
    onUpdate
){

    addCheckboxField(
        container,
        "Auto Play",
        section.autoPlay ?? true,
        value=>{

            section.autoPlay=value;

            onUpdate(section);

        }
    );

    addNumberField(
        container,
        "Interval (ms)",
        section.interval || 5000,
        value=>{

            section.interval=value;

            onUpdate(section);

        }
    );

    renderSlides(
        container,
        section,
        onUpdate
    );

    const addButton=document.createElement("button");

    addButton.className="editor-button";

    addButton.textContent="Add Slide";

    addButton.onclick=()=>{

        if(!section.slides){

            section.slides=[];

        }

        section.slides.push({

            title:"",

            subtitle:"",

            image:"",

            buttonText:"",

            buttonLink:""

        });

        onUpdate(section);

        renderBannerEditor(
            container,
            section,
            onUpdate
        );

    };

    container.appendChild(addButton);

}

/*==================================================
    SLIDES
==================================================*/

function renderSlides(
    container,
    section,
    onUpdate
){

    if(!section.slides){

        section.slides=[];

    }

    section.slides.forEach(

        (slide,index)=>{

            const card=document.createElement("div");

            card.className="editor-card";

            card.innerHTML=`

<h3>

Slide ${index+1}

</h3>

`;

            container.appendChild(card);

            addTextField(

                card,

                "Title",

                slide.title || "",

                value=>{

                    slide.title=value;

                    onUpdate(section);

                }

            );

            addTextareaField(

                card,

                "Subtitle",

                slide.subtitle || "",

                value=>{

                    slide.subtitle=value;

                    onUpdate(section);

                }

            );

            addTextField(

                card,

                "Image URL",

                slide.image || "",

                value=>{

                    slide.image=value;

                    onUpdate(section);

                }

            );

            addTextField(

                card,

                "Button Text",

                slide.buttonText || "",

                value=>{

                    slide.buttonText=value;

                    onUpdate(section);

                }

            );

            addTextField(

                card,

                "Button Link",

                slide.buttonLink || "",

                value=>{

                    slide.buttonLink=value;

                    onUpdate(section);

                }

            );

            const remove=document.createElement("button");

            remove.className="editor-danger";

            remove.textContent="Remove Slide";

            remove.onclick=()=>{

                section.slides.splice(index,1);

                onUpdate(section);

                renderBannerEditor(

                    container,

                    section,

                    onUpdate

                );

            };

            card.appendChild(remove);

        }

    );

}


/*==================================================
    PRODUCT CAROUSEL EDITOR
==================================================*/

function renderProductCarouselEditor(
    container,
    section,
    onUpdate
){

    addTextField(
        container,
        "View All Link",
        section.viewAllLink || "",
        value=>{
            section.viewAllLink=value;
            onUpdate(section);
        }
    );

    addTextField(
        container,
        "Category ID",
        section.categoryId || "",
        value=>{
            section.categoryId=value;
            onUpdate(section);
        }
    );

    addTextField(
        container,
        "Sub Category ID",
        section.subCategoryId || "",
        value=>{
            section.subCategoryId=value;
            onUpdate(section);
        }
    );

    addTextField(
        container,
        "Tag",
        section.tag || "",
        value=>{
            section.tag=value;
            onUpdate(section);
        }
    );

    addNumberField(
        container,
        "Products Limit",
        section.limit || 10,
        value=>{
            section.limit=value;
            onUpdate(section);
        }
    );

    addCheckboxField(
        container,
        "Auto Play",
        section.autoPlay || false,
        value=>{
            section.autoPlay=value;
            onUpdate(section);
        }
    );

    addNumberField(
        container,
        "Auto Play Interval",
        section.interval || 5000,
        value=>{
            section.interval=value;
            onUpdate(section);
        }
    );

}

/*==================================================
    IMAGE CAROUSEL EDITOR
==================================================*/

function renderImageCarouselEditor(
    container,
    section,
    onUpdate
){

    if(!section.images){
        section.images=[];
    }

    section.images.forEach((image,index)=>{

        const card=document.createElement("div");

        card.className="editor-card";

        card.innerHTML=`<h3>Image ${index+1}</h3>`;

        container.appendChild(card);

        addTextField(
            card,
            "Image URL",
            image.src || "",
            value=>{
                image.src=value;
                onUpdate(section);
            }
        );

        addTextField(
            card,
            "Title",
            image.title || "",
            value=>{
                image.title=value;
                onUpdate(section);
            }
        );

        addTextField(
            card,
            "Link",
            image.link || "",
            value=>{
                image.link=value;
                onUpdate(section);
            }
        );

        const remove=document.createElement("button");

        remove.className="editor-danger";

        remove.textContent="Remove";

        remove.onclick=()=>{

            section.images.splice(index,1);

            onUpdate(section);

            renderImageCarouselEditor(
                container,
                section,
                onUpdate
            );

        };

        card.appendChild(remove);

    });

    const add=document.createElement("button");

    add.className="editor-button";

    add.textContent="Add Image";

    add.onclick=()=>{

        section.images.push({

            src:"",
            title:"",
            link:""

        });

        onUpdate(section);

        renderImageCarouselEditor(
            container,
            section,
            onUpdate
        );

    };

    container.appendChild(add);

}

/*==================================================
    YOUTUBE EDITOR
==================================================*/

function renderYoutubeEditor(
    container,
    section,
    onUpdate
){

    if(!section.videos){
        section.videos=[];
    }

    section.videos.forEach((video,index)=>{

        const card=document.createElement("div");

        card.className="editor-card";

        card.innerHTML=`<h3>Video ${index+1}</h3>`;

        container.appendChild(card);

        addTextField(
            card,
            "YouTube URL",
            video.url || "",
            value=>{
                video.url=value;
                onUpdate(section);
            }
        );

        addTextField(
            card,
            "Title",
            video.title || "",
            value=>{
                video.title=value;
                onUpdate(section);
            }
        );

        const remove=document.createElement("button");

        remove.className="editor-danger";

        remove.textContent="Remove";

        remove.onclick=()=>{

            section.videos.splice(index,1);

            onUpdate(section);

            renderYoutubeEditor(
                container,
                section,
                onUpdate
            );

        };

        card.appendChild(remove);

    });

    const add=document.createElement("button");

    add.className="editor-button";

    add.textContent="Add Video";

    add.onclick=()=>{

        section.videos.push({

            url:"",
            title:""

        });

        onUpdate(section);

        renderYoutubeEditor(
            container,
            section,
            onUpdate
        );

    };

    container.appendChild(add);

}

/*==================================================
    REVIEW EDITOR
==================================================*/

function renderReviewEditor(
    container,
    section,
    onUpdate
){

    addNumberField(
        container,
        "Reviews Limit",
        section.limit || 10,
        value=>{

            section.limit=value;

            onUpdate(section);

        }

    );

    addCheckboxField(
        container,
        "Auto Play",
        section.autoPlay ?? true,
        value=>{

            section.autoPlay=value;

            onUpdate(section);

        }

    );

    addNumberField(
        container,
        "Interval (ms)",
        section.interval || 5000,
        value=>{

            section.interval=value;

            onUpdate(section);

        }

    );

}

/*==================================================
    SELECT FIELD
==================================================*/

function addSelectField(
    parent,
    label,
    value,
    options,
    callback
){

    const div=document.createElement("div");

    div.className="editor-field";

    const select=document.createElement("select");

    options.forEach(option=>{

        const item=document.createElement("option");

        item.value=option.value;

        item.textContent=option.label;

        item.selected=option.value===value;

        select.appendChild(item);

    });

    select.addEventListener("change",e=>{

        callback(e.target.value);

    });

    const title=document.createElement("label");

    title.textContent=label;

    div.appendChild(title);

    div.appendChild(select);

    parent.appendChild(div);

}

/*==================================================
    COLOR FIELD
==================================================*/

function addColorField(
    parent,
    label,
    value,
    callback
){

    const div=document.createElement("div");

    div.className="editor-field";

    div.innerHTML=`

<label>${label}</label>

<input
type="color"
value="${value || "#000000"}">

`;

    div.querySelector("input")

    .addEventListener(

        "input",

        e=>{

            callback(

                e.target.value

            );

        }

    );

    parent.appendChild(div);

}

/*==================================================
    IMAGE PREVIEW
==================================================*/

function createImagePreview(
    parent,
    image
){

    const preview=document.createElement("img");

    preview.className="editor-image-preview";

    preview.src=image || "";

    preview.onerror=()=>{

        preview.style.display="none";

    };

    parent.appendChild(preview);

    return preview;

}

/*==================================================
    VALIDATION
==================================================*/

function isValidUrl(url){

    try{

        new URL(url);

        return true;

    }

    catch{

        return false;

    }

}

function isEmpty(value){

    return value===undefined ||

    value===null ||

    value==="";

}

/*==================================================
    SAVE HELPER
==================================================*/

function saveSection(
    section,
    onUpdate
){

    if(!section) return;

    section.updatedAt=Date.now();

    onUpdate(section);

}

/*==================================================
    REFRESH HELPER
==================================================*/

function rerender(
    renderer,
    container,
    section,
    onUpdate
){

    container.innerHTML="";

    renderer(

        container,

        section,

        onUpdate

    );

}

/*==================================================
    PLACEHOLDER
    FIREBASE STORAGE
==================================================*/

async function uploadImage(){

    alert(

`Firebase Storage upload
will be connected in
image-upload.js`

    );

}

/*==================================================
    EXPORTS
==================================================*/

export{

    addTextField,

    addTextareaField,

    addNumberField,

    addCheckboxField,

    addSelectField,

    addColorField,

    createImagePreview,

    saveSection,

    uploadImage

};