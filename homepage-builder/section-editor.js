/*==================================================
    SECTION EDITOR
==================================================*/

import { db, storage } from "../js/firebase.js";

import {
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";


/*==================================================
    MAIN EDITOR
==================================================*/

export function renderSectionEditor({
    container,
    section,
    onUpdate,
    onDuplicate,
    onDelete,
    onRefresh
}) {

    container.innerHTML = "";

    if (!section) {

        container.innerHTML = `
            <div class="editor-empty">

                <div class="empty-icon">
                    ⚙
                </div>

                <h3>No Section Selected</h3>

                <p>
                    Select a section from the section list.
                </p>

            </div>
        `;

        return;
    }


    const wrapper = document.createElement("div");

    wrapper.className = "section-editor";


    wrapper.innerHTML = `

        <div class="editor-header">

            <div>

                <div class="editor-type">
                    ${formatType(section.type)}
                </div>

                <h2>
                    ${section.title || formatType(section.type)}
                </h2>

            </div>

        </div>


        <div class="editor-body">

            <div class="editor-section">

                <div class="editor-section-title">

                    <span>General</span>

                </div>

                <div id="commonFields"></div>

            </div>


            <div class="editor-section">

                <div class="editor-section-title">

                    <span>Design</span>

                </div>

                <div id="designFields"></div>

            </div>


            <div class="editor-section">

                <div class="editor-section-title">

                    <span>${formatType(section.type)} Settings</span>

                </div>

                <div id="typeFields"></div>

            </div>

        </div>


        <div class="editor-footer">

            <button
                type="button"
                class="editor-button"
                id="duplicateBtn">

                Duplicate

            </button>


            <button
                type="button"
                class="editor-danger"
                id="deleteBtn">

                Delete

            </button>

        </div>

    `;


    container.appendChild(wrapper);


    /* GENERAL */

    renderCommonFields(
        wrapper.querySelector("#commonFields"),
        section,
        onUpdate
    );


    /* DESIGN */

    renderDesignFields(
        wrapper.querySelector("#designFields"),
        section,
        onUpdate
    );


    /* TYPE */

    renderTypeEditor(
        wrapper.querySelector("#typeFields"),
        section,
        onUpdate
    );


    /* ACTIONS */

    wrapper.querySelector("#duplicateBtn")
        .onclick = onDuplicate;


    wrapper.querySelector("#deleteBtn")
        .onclick = onDelete;

}


/*==================================================
    GENERAL FIELDS
==================================================*/

function renderCommonFields(
    container,
    section,
    onUpdate
) {

    addTextField(
        container,
        "Section Title",
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
    DESIGN FIELDS
==================================================*/

function renderDesignFields(
    container,
    section,
    onUpdate
) {

    /* Background */

    addColorField(
        container,
        "Background Color",
        section.design?.backgroundColor || "#ffffff",
        value => {

            ensureDesign(section);

            section.design.backgroundColor = value;

            onUpdate(section);

        }
    );


    /* Width */

    addNumberWithUnitField(
        container,
        "Width",
        section.design?.width || 100,
        section.design?.widthUnit || "%",
        (value, unit) => {

            ensureDesign(section);

            section.design.width = value;
            section.design.widthUnit = unit;

            onUpdate(section);

        }
    );


    /* Padding */

    addFourSideField(
        container,
        "Padding",
        section.design?.padding || {},
        values => {

            ensureDesign(section);

            section.design.padding = values;

            onUpdate(section);

        }
    );


    /* Margin */

    addFourSideField(
        container,
        "Margin",
        section.design?.margin || {},
        values => {

            ensureDesign(section);

            section.design.margin = values;

            onUpdate(section);

        }
    );


    /* Border Radius */

    addNumberField(
        container,
        "Border Radius (px)",
        section.design?.borderRadius || 0,
        value => {

            ensureDesign(section);

            section.design.borderRadius = value;

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
) {

    container.innerHTML = "";

    switch (section.type) {

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
    HEADING
==================================================*/

function renderHeadingEditor(
    container,
    section,
    onUpdate
) {

    addTextField(
        container,
        "Badge",
        section.badge || "",
        value => {

            section.badge = value;

            onUpdate(section);

        }
    );

}


/*==================================================
    SPACER
==================================================*/

function renderSpacerEditor(
    container,
    section,
    onUpdate
) {

    addNumberField(
        container,
        "Height (px)",
        section.height || 40,
        value => {

            section.height = value;

            onUpdate(section);

        }
    );

}


/*==================================================
    BANNER
==================================================*/

function renderBannerEditor(
    container,
    section,
    onUpdate
) {

    addCheckboxField(
        container,
        "Auto Play",
        section.autoPlay ?? true,
        value => {

            section.autoPlay = value;

            onUpdate(section);

        }
    );


    addNumberField(
        container,
        "Interval (ms)",
        section.interval || 5000,
        value => {

            section.interval = value;

            onUpdate(section);

        }
    );


    if (!section.slides) {
        section.slides = [];
    }


    section.slides.forEach(
        (slide, index) => {

            renderBannerSlide(
                container,
                section,
                slide,
                index,
                onUpdate
            );

        }
    );


    const addButton =
        document.createElement("button");


    addButton.className =
        "editor-button";


    addButton.textContent =
        "+ Add Slide";


    addButton.onclick = () => {

        section.slides.push({

            title: "",

            subtitle: "",

            image: "",

            buttonText: "",

            buttonLink: "",

            buttonPosition: "center"

        });


        onUpdate(section);


        renderTypeEditor(
            container,
            section,
            onUpdate
        );

    };


    container.appendChild(addButton);

}


/*==================================================
    BANNER SLIDE
==================================================*/

function renderBannerSlide(
    container,
    section,
    slide,
    index,
    onUpdate
) {

    const card =
        document.createElement("div");


    card.className =
        "editor-card";


    card.innerHTML = `

        <h3>
            Slide ${index + 1}
        </h3>

    `;


    container.appendChild(card);


    addImageUploadField(
        card,
        "Banner Image",
        slide.image || "",
        "homepage/banners",
        url => {

            slide.image = url;

            onUpdate(section);

        }
    );


    addTextField(
        card,
        "Title",
        slide.title || "",
        value => {

            slide.title = value;

            onUpdate(section);

        }
    );


    addTextareaField(
        card,
        "Subtitle",
        slide.subtitle || "",
        value => {

            slide.subtitle = value;

            onUpdate(section);

        }
    );


    addTextField(
        card,
        "Button Text",
        slide.buttonText || "",
        value => {

            slide.buttonText = value;

            onUpdate(section);

        }
    );


    addTextField(
        card,
        "Button Link",
        slide.buttonLink || "",
        value => {

            slide.buttonLink = value;

            onUpdate(section);

        }
    );


    addSelectField(
        card,
        "Button Position",
        slide.buttonPosition || "center",

        [
            {
                value: "left",
                label: "Left"
            },
            {
                value: "center",
                label: "Center"
            },
            {
                value: "right",
                label: "Right"
            }
        ],

        value => {

            slide.buttonPosition =
                value;

            onUpdate(section);

        }
    );


    const remove =
        document.createElement("button");


    remove.className =
        "editor-danger";


    remove.textContent =
        "Remove Slide";


    remove.onclick = () => {

        section.slides.splice(
            index,
            1
        );

        onUpdate(section);

        renderTypeEditor(
            container,
            section,
            onUpdate
        );

    };


    card.appendChild(remove);

}


/*==================================================
    PRODUCT CAROUSEL
==================================================*/

async function renderProductCarouselEditor(
    container,
    section,
    onUpdate
) {

    addTextField(
        container,
        "View All Link",
        section.viewAllLink || "",
        value => {

            section.viewAllLink = value;

            onUpdate(section);

        }
    );


    /* CATEGORY */

    await renderCategoryDropdown(
        container,
        section,
        onUpdate
    );


    /* TAGS */

    await renderTagDropdown(
        container,
        section,
        onUpdate
    );


    /* PRODUCTS */

    await renderProductSelector(
        container,
        section,
        onUpdate
    );


    addNumberField(
        container,
        "Products Limit",
        section.limit || 10,
        value => {

            section.limit = value;

            onUpdate(section);

        }
    );


    addCheckboxField(
        container,
        "Auto Play",
        section.autoPlay || false,
        value => {

            section.autoPlay = value;

            onUpdate(section);

        }
    );


    addNumberField(
        container,
        "Auto Play Interval",
        section.interval || 5000,
        value => {

            section.interval = value;

            onUpdate(section);

        }
    );

}


/*==================================================
    CATEGORY DROPDOWN
==================================================*/

async function renderCategoryDropdown(
    parent,
    section,
    onUpdate
) {

    const snap = await getDocs(
        query(
            collection(db, "categories"),
            orderBy("order")
        )
    );


    const categories = [];


    snap.forEach(docSnap => {

        categories.push({

            id: docSnap.id,

            ...docSnap.data()

        });

    });


    const div =
        document.createElement("div");


    div.className =
        "editor-field";


    const label =
        document.createElement("label");


    label.textContent =
        "Category";


    div.appendChild(label);


    const select =
        document.createElement("select");


    select.innerHTML = `
        <option value="">
            Any Category
        </option>
    `;


    const mains =
        categories.filter(
            c => !c.parentId
        );


    mains.forEach(main => {

        const option =
            document.createElement("option");


        option.value =
            main.id;


        option.textContent =
            main.name;


        option.dataset.type =
            "main";


        select.appendChild(option);


        categories
            .filter(
                c => c.parentId === main.id
            )
            .forEach(sub => {

                const subOption =
                    document.createElement(
                        "option"
                    );


                subOption.value =
                    sub.id;


                subOption.textContent =
                    "— " + sub.name;


                subOption.dataset.type =
                    "sub";


                subOption.dataset.parent =
                    main.id;


                select.appendChild(
                    subOption
                );

            });

    });


    select.value =
        section.categoryId || "";


    select.onchange = () => {

        const selected =
            select.selectedOptions[0];


        section.categoryId =
            selected.value;


        section.categoryType =
            selected.dataset.type || "";


        if (!selected.value) {

            section.categoryId = "";

            section.categoryType = "all";

        }


        onUpdate(section);

    };


    div.appendChild(select);


    parent.appendChild(div);

}


/*==================================================
    TAGS
==================================================*/

async function renderTagDropdown(
    parent,
    section,
    onUpdate
) {

    const snap =
        await getDocs(
            collection(db, "tags")
        );


    section.tags ??= [];


    const wrapper =
        document.createElement("div");


    wrapper.className =
        "editor-field";


    const label =
        document.createElement("label");


    label.textContent =
        "Tags";


    wrapper.appendChild(label);


    const tagGrid =
        document.createElement("div");


    tagGrid.className =
        "tag-checkbox-grid";


    snap.forEach(docSnap => {

        const tag =
            docSnap.data();


        const row =
            document.createElement("label");


        row.className =
            "tag-option";


        const checkbox =
            document.createElement(
                "input"
            );


        checkbox.type =
            "checkbox";


        checkbox.checked =
            section.tags.includes(
                tag.slug
            );


        checkbox.onchange = () => {

            if (
                checkbox.checked
            ) {

                if (
                    !section.tags.includes(
                        tag.slug
                    )
                ) {

                    section.tags.push(
                        tag.slug
                    );

                }

            } else {

                section.tags =
                    section.tags.filter(
                        t =>
                            t !== tag.slug
                    );

            }


            onUpdate(section);

        };


        row.appendChild(
            checkbox
        );


        row.append(
            " " + tag.name
        );


        tagGrid.appendChild(
            row
        );

    });


    wrapper.appendChild(
        tagGrid
    );


    parent.appendChild(
        wrapper
    );

}


/*==================================================
    PRODUCT SELECTOR
==================================================*/

async function renderProductSelector(
    parent,
    section,
    onUpdate
) {

    const snap =
        await getDocs(
            collection(db, "products")
        );


    const products =
        snap.docs.map(docSnap => ({

            id: docSnap.id,

            ...docSnap.data()

        }));


    section.productIds ??= [];


    const wrapper =
        document.createElement("div");


    wrapper.className =
        "editor-field";


    wrapper.innerHTML = `

        <label>
            Select Products (optional)
        </label>

        <input
            type="text"
            class="product-search"
            placeholder="Search products..."
        >

        <div class="product-selector-list">
        </div>

    `;


    parent.appendChild(
        wrapper
    );


    const search =
        wrapper.querySelector(
            ".product-search"
        );


    const list =
        wrapper.querySelector(
            ".product-selector-list"
        );


    function renderProducts(items) {

        list.innerHTML = "";


        items.forEach(product => {

            const row =
                document.createElement(
                    "label"
                );


            row.className =
                "product-selector-item";


            const checkbox =
                document.createElement(
                    "input"
                );


            checkbox.type =
                "checkbox";


            checkbox.checked =
                section.productIds.includes(
                    product.id
                );


            checkbox.onchange = () => {

                if (
                    checkbox.checked
                ) {

                    if (
                        !section.productIds.includes(
                            product.id
                        )
                    ) {

                        section.productIds.push(
                            product.id
                        );

                    }

                } else {

                    section.productIds =
                        section.productIds.filter(
                            id =>
                                id !== product.id
                        );

                }


                onUpdate(section);

            };


            row.appendChild(
                checkbox
            );


            const image =
                document.createElement(
                    "img"
                );


            image.src =
                product.images?.[0] || "";


            row.appendChild(
                image
            );


            const name =
                document.createElement(
                    "span"
                );


            name.textContent =
                product.name || "Product";


            row.appendChild(
                name
            );


            list.appendChild(
                row
            );

        });

    }


    renderProducts(
        products
    );


    search.oninput = () => {

        const keyword =
            search.value
                .toLowerCase()
                .trim();


        const filtered =
            products.filter(
                product =>
                    (
                        product.name || ""
                    )
                    .toLowerCase()
                    .includes(keyword)
            );


        renderProducts(
            filtered
        );

    };

}


/*==================================================
    IMAGE CAROUSEL
==================================================*/

function renderImageCarouselEditor(
    container,
    section,
    onUpdate
) {

    section.images ??= [];


    section.images.forEach(
        (image, index) => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "editor-card";


            card.innerHTML = `
                <h3>
                    Image ${index + 1}
                </h3>
            `;


            container.appendChild(
                card
            );


            addImageUploadField(
                card,
                "Image",
                image.src || "",
                "homepage/images",
                url => {

                    image.src = url;

                    onUpdate(section);

                }
            );


            addTextField(
                card,
                "Text",
                image.title || "",
                value => {

                    image.title = value;

                    onUpdate(section);

                }
            );


            addTextField(
                card,
                "Link",
                image.link || "",
                value => {

                    image.link = value;

                    onUpdate(section);

                }
            );


            const remove =
                document.createElement(
                    "button"
                );


            remove.className =
                "editor-danger";


            remove.textContent =
                "Remove Image";


            remove.onclick = () => {

                section.images.splice(
                    index,
                    1
                );


                onUpdate(section);


                renderTypeEditor(
                    container,
                    section,
                    onUpdate
                );

            };


            card.appendChild(
                remove
            );

        }
    );


    const add =
        document.createElement(
            "button"
        );


    add.className =
        "editor-button";


    add.textContent =
        "+ Add Image";


    add.onclick = () => {

        section.images.push({

            src: "",

            title: "",

            link: ""

        });


        onUpdate(section);


        renderTypeEditor(
            container,
            section,
            onUpdate
        );

    };


    container.appendChild(
        add
    );

}


/*==================================================
    YOUTUBE CAROUSEL
==================================================*/

function renderYoutubeEditor(
    container,
    section,
    onUpdate
) {

    section.videos ??= [];


    section.videos.forEach(
        (video, index) => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "editor-card";


            card.innerHTML = `
                <h3>
                    Short ${index + 1}
                </h3>
            `;


            container.appendChild(
                card
            );


            addTextField(
                card,
                "YouTube Shorts URL",
                video.url || "",
                value => {

                    video.url = value;

                    onUpdate(section);

                }
            );


            const remove =
                document.createElement(
                    "button"
                );


            remove.className =
                "editor-danger";


            remove.textContent =
                "Remove Video";


            remove.onclick = () => {

                section.videos.splice(
                    index,
                    1
                );


                onUpdate(section);


                renderTypeEditor(
                    container,
                    section,
                    onUpdate
                );

            };


            card.appendChild(
                remove
            );

        }
    );


    const add =
        document.createElement(
            "button"
        );


    add.className =
        "editor-button";


    add.textContent =
        "+ Add YouTube Short";


    add.onclick = () => {

        section.videos.push({

            url: "",

            title: ""

        });


        onUpdate(section);


        renderTypeEditor(
            container,
            section,
            onUpdate
        );

    };


    container.appendChild(
        add
    );

}


/*==================================================
    REVIEW CAROUSEL
==================================================*/

function renderReviewEditor(
    container,
    section,
    onUpdate
) {

    section.reviews ??= [];


    section.reviews.forEach(
        (review, index) => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "editor-card";


            card.innerHTML = `
                <h3>
                    Review ${index + 1}
                </h3>
            `;


            container.appendChild(
                card
            );


            addImageUploadField(
                card,
                "Reviewer Image",
                review.image || "",
                "homepage/reviews",
                url => {

                    review.image = url;

                    onUpdate(section);

                }
            );


            addTextField(
                card,
                "Name",
                review.name || "",
                value => {

                    review.name = value;

                    onUpdate(section);

                }
            );


            addSelectField(
                card,
                "Stars",
                String(
                    review.stars || 5
                ),

                [
                    {
                        value: "1",
                        label: "★ 1"
                    },
                    {
                        value: "2",
                        label: "★ 2"
                    },
                    {
                        value: "3",
                        label: "★ 3"
                    },
                    {
                        value: "4",
                        label: "★ 4"
                    },
                    {
                        value: "5",
                        label: "★ 5"
                    }
                ],

                value => {

                    review.stars =
                        Number(value);

                    onUpdate(section);

                }
            );


            addTextareaField(
                card,
                "Review",
                review.text || "",
                value => {

                    review.text = value;

                    onUpdate(section);

                }
            );


            const remove =
                document.createElement(
                    "button"
                );


            remove.className =
                "editor-danger";


            remove.textContent =
                "Remove Review";


            remove.onclick = () => {

                section.reviews.splice(
                    index,
                    1
                );


                onUpdate(section);


                renderTypeEditor(
                    container,
                    section,
                    onUpdate
                );

            };


            card.appendChild(
                remove
            );

        }
    );


    const add =
        document.createElement(
            "button"
        );


    add.className =
        "editor-button";


    add.textContent =
        "+ Add Review";


    add.onclick = () => {

        section.reviews.push({

            image: "",

            name: "",

            stars: 5,

            text: ""

        });


        onUpdate(section);


        renderTypeEditor(
            container,
            section,
            onUpdate
        );

    };


    container.appendChild(
        add
    );


    addNumberField(
        container,
        "Reviews Limit",
        section.limit || 10,
        value => {

            section.limit = value;

            onUpdate(section);

        }
    );


    addCheckboxField(
        container,
        "Auto Play",
        section.autoPlay ?? true,
        value => {

            section.autoPlay = value;

            onUpdate(section);

        }
    );


    addNumberField(
        container,
        "Interval (ms)",
        section.interval || 5000,
        value => {

            section.interval = value;

            onUpdate(section);

        }
    );

}


/*==================================================
    INPUT COMPONENTS
==================================================*/

function addTextField(
    parent,
    label,
    value,
    callback
) {

    const div =
        document.createElement("div");


    div.className =
        "editor-field";


    div.innerHTML = `

        <label>
            ${label}
        </label>

        <input
            type="text"
            value="${escapeHtml(value)}"
        >

    `;


    div.querySelector("input")
        .addEventListener(
            "input",
            e => {

                callback(
                    e.target.value
                );

            }
        );


    parent.appendChild(div);

}


/*==================================================
    TEXTAREA
==================================================*/

function addTextareaField(
    parent,
    label,
    value,
    callback
) {

    const div =
        document.createElement("div");


    div.className =
        "editor-field";


    div.innerHTML = `

        <label>
            ${label}
        </label>

        <textarea rows="3">${escapeHtml(value)}</textarea>

    `;


    div.querySelector("textarea")
        .addEventListener(
            "input",
            e => {

                callback(
                    e.target.value
                );

            }
        );


    parent.appendChild(div);

}


/*==================================================
    NUMBER
==================================================*/

function addNumberField(
    parent,
    label,
    value,
    callback
) {

    const div =
        document.createElement("div");


    div.className =
        "editor-field";


    div.innerHTML = `

        <label>
            ${label}
        </label>

        <input
            type="number"
            value="${Number(value) || 0}"
            min="0"
        >

    `;


    div.querySelector("input")
        .addEventListener(
            "input",
            e => {

                callback(
                    Number(
                        e.target.value
                    )
                );

            }
        );


    parent.appendChild(div);

}


/*==================================================
    CHECKBOX
==================================================*/

function addCheckboxField(
    parent,
    label,
    checked,
    callback
) {

    const div =
        document.createElement("div");


    div.className =
        "editor-field checkbox-field";


    div.innerHTML = `

        <label>

            <input
                type="checkbox"
                ${checked ? "checked" : ""}
            >

            <span>
                ${label}
            </span>

        </label>

    `;


    div.querySelector("input")
        .addEventListener(
            "change",
            e => {

                callback(
                    e.target.checked
                );

            }
        );


    parent.appendChild(div);

}


/*==================================================
    SELECT
==================================================*/

function addSelectField(
    parent,
    label,
    value,
    options,
    callback
) {

    const div =
        document.createElement("div");


    div.className =
        "editor-field";


    const labelElement =
        document.createElement(
            "label"
        );


    labelElement.textContent =
        label;


    const select =
        document.createElement(
            "select"
        );


    options.forEach(option => {

        const item =
            document.createElement(
                "option"
            );


        item.value =
            option.value;


        item.textContent =
            option.label;


        item.selected =
            option.value === value;


        select.appendChild(
            item
        );

    });


    select.onchange = () => {

        callback(
            select.value
        );

    };


    div.appendChild(
        labelElement
    );


    div.appendChild(
        select
    );


    parent.appendChild(div);

}


/*==================================================
    COLOR
==================================================*/

function addColorField(
    parent,
    label,
    value,
    callback
) {

    const div =
        document.createElement("div");


    div.className =
        "editor-field";


    div.innerHTML = `

        <label>
            ${label}
        </label>

        <div class="color-input-row">

            <input
                type="color"
                value="${value || "#ffffff"}"
            >

            <span>
                ${value || "#ffffff"}
            </span>

        </div>

    `;


    const input =
        div.querySelector(
            "input"
        );


    const text =
        div.querySelector(
            "span"
        );


    input.oninput = () => {

        text.textContent =
            input.value;

        callback(
            input.value
        );

    };


    parent.appendChild(div);

}


/*==================================================
    WIDTH
==================================================*/

function addNumberWithUnitField(
    parent,
    label,
    value,
    unit,
    callback
) {

    const div =
        document.createElement("div");


    div.className =
        "editor-field";


    div.innerHTML = `

        <label>
            ${label}
        </label>

        <div class="unit-row">

            <input
                type="number"
                min="0"
                value="${Number(value) || 0}"
            >

            <select>

                <option value="%">%</option>

                <option value="px">px</option>

                <option value="vw">vw</option>

            </select>

        </div>

    `;


    const input =
        div.querySelector(
            "input"
        );


    const select =
        div.querySelector(
            "select"
        );


    select.value =
        unit || "%";


    const update = () => {

        callback(
            Number(input.value),
            select.value
        );

    };


    input.oninput =
        update;


    select.onchange =
        update;


    parent.appendChild(div);

}


/*==================================================
    FOUR SIDE FIELD
==================================================*/

function addFourSideField(
    parent,
    label,
    values,
    callback
) {

    const div =
        document.createElement("div");


    div.className =
        "editor-field";


    const data = {

        top: Number(
            values.top || 0
        ),

        right: Number(
            values.right || 0
        ),

        bottom: Number(
            values.bottom || 0
        ),

        left: Number(
            values.left || 0
        )

    };


    div.innerHTML = `

        <label>
            ${label}
        </label>

        <div class="four-side-grid">

            <div>
                <small>Top</small>
                <input
                    type="number"
                    min="0"
                    value="${data.top}"
                >
            </div>

            <div>
                <small>Right</small>
                <input
                    type="number"
                    min="0"
                    value="${data.right}"
                >
            </div>

            <div>
                <small>Bottom</small>
                <input
                    type="number"
                    min="0"
                    value="${data.bottom}"
                >
            </div>

            <div>
                <small>Left</small>
                <input
                    type="number"
                    min="0"
                    value="${data.left}"
                >
            </div>

        </div>

    `;


    const inputs =
        div.querySelectorAll(
            "input"
        );


    inputs.forEach(
        (input, index) => {

            input.oninput = () => {

                const names = [
                    "top",
                    "right",
                    "bottom",
                    "left"
                ];


                data[
                    names[index]
                ] =
                    Number(
                        input.value
                    );


                callback({
                    ...data
                });

            };

        }
    );


    parent.appendChild(div);

}


/*==================================================
    IMAGE UPLOAD
==================================================*/

function addImageUploadField(
    parent,
    label,
    image,
    folder,
    callback
) {

    const div =
        document.createElement(
            "div"
        );


    div.className =
        "editor-field";


    const title =
        document.createElement(
            "label"
        );


    title.textContent =
        label;


    div.appendChild(
        title
    );


    const preview =
        document.createElement(
            "img"
        );


    preview.className =
        "editor-image-preview";


    preview.src =
        image || "";


    preview.style.display =
        image ? "block" : "none";


    div.appendChild(
        preview
    );


    const input =
        document.createElement(
            "input"
        );


    input.type =
        "file";


    input.accept =
        "image/*";


    input.onchange =
        async event => {

            const file =
                event.target.files?.[0];


            if (!file) return;


            input.disabled =
                true;


            try {

                const url =
                    await uploadImage(
                        file,
                        folder
                    );


                preview.src =
                    url;


                preview.style.display =
                    "block";


                callback(url);

            }

            catch (error) {

                console.error(
                    "IMAGE UPLOAD ERROR:",
                    error
                );


                alert(
                    "Image upload failed:\n" +
                    error.message
                );

            }

            finally {

                input.disabled =
                    false;

                input.value =
                    "";

            }

        };


    div.appendChild(
        input
    );


    parent.appendChild(div);

}


/*==================================================
    FIREBASE STORAGE UPLOAD
==================================================*/

async function uploadImage(
    file,
    folder
) {

    if (!file) return "";


    const extension =
        file.name
            .split(".")
            .pop();


    const fileName =
        `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 8)}
            .${extension}`;


    const storageRef =
        ref(
            storage,
            `${folder}/${fileName}`
        );


    await uploadBytes(
        storageRef,
        file
    );


    return await getDownloadURL(
        storageRef
    );

}


/*==================================================
    DESIGN HELPERS
==================================================*/

function ensureDesign(section) {

    if (!section.design) {

        section.design = {};

    }

}


/*==================================================
    FORMAT TYPE
==================================================*/

function formatType(type) {

    if (!type) return "";

    return type
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, char =>
            char.toUpperCase()
        );

}


/*==================================================
    ESCAPE HTML
==================================================*/

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/*==================================================
    EXPORTS
==================================================*/

export {

    addTextField,
    addTextareaField,
    addNumberField,
    addCheckboxField,
    addSelectField,
    addColorField,
    uploadImage

};
