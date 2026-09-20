/* ============================================================
   CATALOGUE ADMIN
   ============================================================

   Firestore:
   catalogues/{catalogueId}

   Features:
   - Admin authentication
   - Create catalogue
   - Edit catalogue
   - Delete catalogue
   - Active/inactive
   - Display order
   - Colours
   - Sizes
   - Colour × Size price matrix
   - Upload catalogue images
   - Link every image to an existing product
   - Assign optional colour to every image
   - Drag/drop image ordering
   - Firebase Storage
   ============================================================ */

import { db, storage } from "../js/firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    where,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";


/* ============================================================
   AUTH
   ============================================================ */

const auth = getAuth();


/* ============================================================
   STATE
   ============================================================ */

let currentCatalogueId = null;

let catalogues = [];

let products = [];

let colours = [];

let sizes = [];

let catalogueImages = [];

let draggedImageIndex = null;


/* ============================================================
   DOM HELPERS
   ============================================================ */

const $ = id => document.getElementById(id);


/* ============================================================
   POPUP
   ============================================================ */

function showMessage(message, type = "info") {

    let popup = $("cataloguePopup");

    if (!popup) {

        popup = document.createElement("div");

        popup.id = "cataloguePopup";

        popup.className = "catalogue-popup";

        document.body.appendChild(popup);

    }

    popup.textContent = message;

    popup.className =
        `catalogue-popup ${type}`;

    popup.classList.add("show");

    clearTimeout(popup._timer);

    popup._timer = setTimeout(() => {

        popup.classList.remove("show");

    }, 2500);

}


/* ============================================================
   AUTH GUARD
   ============================================================ */

onAuthStateChanged(auth, async user => {

    if (!user) {

        location.href = "admin-login.html";

        return;

    }

    try {

        const adminRef =
            doc(
                db,
                "admins",
                user.uid
            );

        const adminSnap =
            await getDoc(adminRef);

        if (!adminSnap.exists()) {

            await auth.signOut();

            location.href = "admin-login.html";

            return;

        }

        initializeCatalogueAdmin();

    }
    catch (error) {

        console.error(error);

        showMessage(
            "Unable to verify admin account.",
            "error"
        );

    }

});


/* ============================================================
   INITIALIZE
   ============================================================ */

async function initializeCatalogueAdmin() {

    setupEvents();

    await loadProducts();

    await loadCatalogues();

    resetForm();

}


/* ============================================================
   EVENTS
   ============================================================ */

function setupEvents() {

    $("catalogueForm")
        ?.addEventListener(
            "submit",
            handleCatalogueSubmit
        );


    $("addColourButton")
        ?.addEventListener(
            "click",
            addColour
        );


    $("addSizeButton")
        ?.addEventListener(
            "click",
            addSize
        );


    $("catalogueImagesInput")
        ?.addEventListener(
            "change",
            handleImageUpload
        );


    $("cancelCatalogueButton")
        ?.addEventListener(
            "click",
            resetForm
        );

}


/* ============================================================
   LOAD PRODUCTS
   ============================================================ */

async function loadProducts() {

    try {

        const snap =
            await getDocs(
                collection(
                    db,
                    "products"
                )
            );

        products = [];

        snap.forEach(
            productDoc => {

                products.push({
                    id:
                        productDoc.id,

                    ...productDoc.data()
                });

            }
        );

        products.sort(
            (a, b) =>
                String(
                    a.name || ""
                ).localeCompare(
                    String(
                        b.name || ""
                    )
                )
        );

        renderProductCount();

    }
    catch (error) {

        console.error(
            "Load products error:",
            error
        );

        showMessage(
            "Unable to load products.",
            "error"
        );

    }

}


/* ============================================================
   PRODUCT COUNT
   ============================================================ */

function renderProductCount() {

    const element =
        $("productCount");

    if (!element) {

        return;

    }

    element.textContent =
        `${products.length} products available`;

}


/* ============================================================
   LOAD CATALOGUES
   ============================================================ */

async function loadCatalogues() {

    try {

        const q =
            query(
                collection(
                    db,
                    "catalogues"
                ),
                orderBy(
                    "order",
                    "asc"
                )
            );

        const snap =
            await getDocs(q);

        catalogues = [];

        snap.forEach(
            catalogueDoc => {

                catalogues.push({
                    id:
                        catalogueDoc.id,

                    ...catalogueDoc.data()
                });

            }
        );

        renderCatalogueList();

    }
    catch (error) {

        console.error(
            "Load catalogues error:",
            error
        );

        /*
           Fallback without orderBy
           in case old documents don't
           have the order field.
        */

        try {

            const snap =
                await getDocs(
                    collection(
                        db,
                        "catalogues"
                    )
                );

            catalogues = [];

            snap.forEach(
                catalogueDoc => {

                    catalogues.push({
                        id:
                            catalogueDoc.id,

                        ...catalogueDoc.data()
                    });

                }
            );

            catalogues.sort(
                (a, b) =>
                    Number(
                        a.order || 0
                    ) -
                    Number(
                        b.order || 0
                    )
            );

            renderCatalogueList();

        }
        catch (fallbackError) {

            console.error(
                fallbackError
            );

            showMessage(
                "Unable to load catalogues.",
                "error"
            );

        }

    }

}


/* ============================================================
   RENDER CATALOGUE LIST
   ============================================================ */

function renderCatalogueList() {

    const container =
        $("catalogueList");

    if (!container) {

        return;

    }

    if (!catalogues.length) {

        container.innerHTML = `
            <div class="catalogue-empty">
                No catalogues created yet.
            </div>
        `;

        return;

    }

    container.innerHTML =
        catalogues
            .map(
                catalogue => {

                    const imageCount =
                        Array.isArray(
                            catalogue.images
                        )
                            ? catalogue.images.length
                            : 0;

                    const colourCount =
                        Array.isArray(
                            catalogue.colours
                        )
                            ? catalogue.colours.length
                            : 0;

                    const sizeCount =
                        Array.isArray(
                            catalogue.sizes
                        )
                            ? catalogue.sizes.length
                            : 0;

                    return `
                        <div
                            class="catalogue-list-item"
                            data-id="${escapeAttribute(
                                catalogue.id
                            )}"
                        >

                            <div class="catalogue-list-image">

                                ${
                                    catalogue.images?.[0]?.imageUrl
                                        ? `
                                            <img
                                                src="${escapeAttribute(
                                                    catalogue.images[0].imageUrl
                                                )}"
                                                alt="${escapeAttribute(
                                                    catalogue.name
                                                )}"
                                            >
                                        `
                                        : `
                                            <i class="fa-regular fa-images"></i>
                                        `
                                }

                            </div>

                            <div class="catalogue-list-info">

                                <h3>
                                    ${escapeHtml(
                                        catalogue.name ||
                                        "Untitled Catalogue"
                                    )}
                                </h3>

                                <p>
                                    ${imageCount} images
                                    •
                                    ${colourCount} colours
                                    •
                                    ${sizeCount} sizes
                                </p>

                                <span class="${
                                    catalogue.active
                                        ? "active"
                                        : "inactive"
                                }">

                                    ${
                                        catalogue.active
                                            ? "Active"
                                            : "Hidden"
                                    }

                                </span>

                            </div>

                            <div class="catalogue-list-actions">

                                <button
                                    type="button"
                                    class="edit-catalogue"
                                    data-id="${escapeAttribute(
                                        catalogue.id
                                    )}"
                                >
                                    Edit
                                </button>

                                <button
                                    type="button"
                                    class="delete-catalogue"
                                    data-id="${escapeAttribute(
                                        catalogue.id
                                    )}"
                                >
                                    Delete
                                </button>

                            </div>

                        </div>
                    `;

                }
            )
            .join("");


    container
        .querySelectorAll(
            ".edit-catalogue"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        editCatalogue(
                            button.dataset.id
                        );

                    }
                );

            }
        );


    container
        .querySelectorAll(
            ".delete-catalogue"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteCatalogue(
                            button.dataset.id
                        );

                    }
                );

            }
        );

}


/* ============================================================
   ADD COLOUR
   ============================================================ */

function addColour() {

    const input =
        $("colourName");

    if (!input) {

        return;

    }

    const name =
        input.value.trim();

    if (!name) {

        showMessage(
            "Enter colour name.",
            "error"
        );

        return;

    }

    const exists =
        colours.some(
            colour =>
                colour.name.toLowerCase() ===
                name.toLowerCase()
        );

    if (exists) {

        showMessage(
            "Colour already exists.",
            "error"
        );

        return;

    }

    const id =
        createSlug(name);

    colours.push({
        id,
        name
    });

    input.value = "";

    renderColours();

    renderPriceMatrix();

}


/* ============================================================
   REMOVE COLOUR
   ============================================================ */

function removeColour(index) {

    colours.splice(
        index,
        1
    );

    renderColours();

    renderPriceMatrix();

}


/* ============================================================
   RENDER COLOURS
   ============================================================ */

function renderColours() {

    const container =
        $("colourList");

    if (!container) {

        return;

    }

    container.innerHTML =
        colours
            .map(
                (
                    colour,
                    index
                ) => {

                    return `
                        <div class="catalogue-chip">

                            <span>
                                ${escapeHtml(
                                    colour.name
                                )}
                            </span>

                            <button
                                type="button"
                                data-index="${index}"
                                class="remove-colour"
                            >
                                ×
                            </button>

                        </div>
                    `;

                }
            )
            .join("");


    container
        .querySelectorAll(
            ".remove-colour"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        removeColour(
                            Number(
                                button.dataset.index
                            )
                        );

                    }
                );

            }
        );

}


/* ============================================================
   ADD SIZE
   ============================================================ */

function addSize() {

    const input =
        $("sizeName");

    if (!input) {

        return;

    }

    const name =
        input.value.trim();

    if (!name) {

        showMessage(
            "Enter size.",
            "error"
        );

        return;

    }

    const exists =
        sizes.some(
            size =>
                size.name.toLowerCase() ===
                name.toLowerCase()
        );

    if (exists) {

        showMessage(
            "Size already exists.",
            "error"
        );

        return;

    }

    sizes.push({

        id:
            createSlug(name),

        name,

        prices: {}

    });

    input.value = "";

    renderSizes();

    renderPriceMatrix();

}


/* ============================================================
   REMOVE SIZE
   ============================================================ */

function removeSize(index) {

    sizes.splice(
        index,
        1
    );

    renderSizes();

    renderPriceMatrix();

}


/* ============================================================
   RENDER SIZES
   ============================================================ */

function renderSizes() {

    const container =
        $("sizeList");

    if (!container) {

        return;

    }

    container.innerHTML =
        sizes
            .map(
                (
                    size,
                    index
                ) => {

                    return `
                        <div class="catalogue-chip">

                            <span>
                                ${escapeHtml(
                                    size.name
                                )}
                            </span>

                            <button
                                type="button"
                                data-index="${index}"
                                class="remove-size"
                            >
                                ×
                            </button>

                        </div>
                    `;

                }
            )
            .join("");


    container
        .querySelectorAll(
            ".remove-size"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        removeSize(
                            Number(
                                button.dataset.index
                            )
                        );

                    }
                );

            }
        );

}


/* ============================================================
   PRICE MATRIX
   ============================================================ */

function renderPriceMatrix() {

    const container =
        $("priceMatrix");

    if (!container) {

        return;

    }

    if (
        !colours.length ||
        !sizes.length
    ) {

        container.innerHTML = `
            <div class="matrix-empty">
                Add at least one colour and one size.
            </div>
        `;

        return;

    }

    let html = `
        <div class="price-matrix-wrapper">

            <table class="price-matrix">

                <thead>

                    <tr>

                        <th>
                            Size
                        </th>

                        ${colours
                            .map(
                                colour => `
                                    <th>
                                        ${escapeHtml(
                                            colour.name
                                        )}
                                    </th>
                                `
                            )
                            .join("")}

                    </tr>

                </thead>

                <tbody>
    `;


    sizes.forEach(
        (
            size,
            sizeIndex
        ) => {

            html += `
                <tr>

                    <th>
                        ${escapeHtml(
                            size.name
                        )}
                    </th>
            `;


            colours.forEach(
                colour => {

                    const existing =
                        Number(
                            size.prices?.[
                                colour.id
                            ] ??
                            ""
                        );


                    html += `
                        <td>

                            <div class="price-input">

                                <span>₹</span>

                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value="${
                                        Number.isFinite(
                                            existing
                                        )
                                            ? existing
                                            : ""
                                    }"
                                    data-size-index="${sizeIndex}"
                                    data-colour-id="${escapeAttribute(
                                        colour.id
                                    )}"
                                    class="matrix-price"
                                    placeholder="Price"
                                >

                            </div>

                        </td>
                    `;

                }
            );


            html += `
                </tr>
            `;

        }
    );


    html += `
                </tbody>

            </table>

        </div>
    `;


    container.innerHTML =
        html;


    container
        .querySelectorAll(
            ".matrix-price"
        )
        .forEach(
            input => {

                input.addEventListener(
                    "input",
                    () => {

                        const sizeIndex =
                            Number(
                                input.dataset.sizeIndex
                            );

                        const colourId =
                            input.dataset.colourId;

                        if (
                            !sizes[sizeIndex]
                        ) {

                            return;

                        }

                        if (
                            !sizes[sizeIndex].prices
                        ) {

                            sizes[sizeIndex].prices =
                                {};

                        }

                        const value =
                            input.value;

                        if (
                            value === ""
                        ) {

                            delete sizes[
                                sizeIndex
                            ].prices[
                                colourId
                            ];

                        }
                        else {

                            sizes[
                                sizeIndex
                            ].prices[
                                colourId
                            ] =
                                Number(
                                    value
                                );

                        }

                    }
                );

            }
        );

}


/* ============================================================
   HANDLE IMAGE UPLOAD
   ============================================================ */

async function handleImageUpload(event) {

    const files =
        Array.from(
            event.target.files || []
        );

    if (!files.length) {

        return;

    }

    for (
        const file of files
    ) {

        try {

            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {

                continue;

            }

            const tempId =
                `temp-${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2)}`;

            catalogueImages.push({

                id:
                    tempId,

                imageUrl:
                    URL.createObjectURL(
                        file
                    ),

                productId:
                    "",

                colour:
                    "",

                alt:
                    file.name,

                file,

                isNew:
                    true

            });

        }
        catch (error) {

            console.error(error);

        }

    }

    event.target.value = "";

    renderCatalogueImages();

}


/* ============================================================
   RENDER IMAGES
   ============================================================ */

function renderCatalogueImages() {

    const container =
        $("catalogueImagesList");

    if (!container) {

        return;

    }

    if (!catalogueImages.length) {

        container.innerHTML = `
            <div class="catalogue-images-empty">
                No images added yet.
            </div>
        `;

        return;

    }

    container.innerHTML =
        catalogueImages
            .map(
                (
                    image,
                    index
                ) => {

                    return `
                        <div
                            class="catalogue-image-card"
                            draggable="true"
                            data-index="${index}"
                        >

                            <div class="catalogue-image-preview">

                                <img
                                    src="${escapeAttribute(
                                        image.imageUrl
                                    )}"
                                    alt="${escapeAttribute(
                                        image.alt ||
                                        "Catalogue image"
                                    )}"
                                >

                                <span class="image-position">
                                    ${index + 1}
                                </span>

                            </div>


                            <div class="catalogue-image-controls">

                                <label>
                                    Linked Product
                                </label>

                                <select
                                    class="image-product"
                                    data-index="${index}"
                                >

                                    <option value="">
                                        Select Product
                                    </option>

                                    ${products
                                        .map(
                                            product => `
                                                <option
                                                    value="${escapeAttribute(
                                                        product.id
                                                    )}"
                                                    ${
                                                        image.productId ===
                                                        product.id
                                                            ? "selected"
                                                            : ""
                                                    }
                                                >
                                                    ${escapeHtml(
                                                        product.name ||
                                                        "Unnamed Product"
                                                    )}
                                                </option>
                                            `
                                        )
                                        .join("")}

                                </select>


                                <label>
                                    Colour
                                </label>

                                <select
                                    class="image-colour"
                                    data-index="${index}"
                                >

                                    <option value="">
                                        All / Not specified
                                    </option>

                                    ${colours
                                        .map(
                                            colour => `
                                                <option
                                                    value="${escapeAttribute(
                                                        colour.id
                                                    )}"
                                                    ${
                                                        image.colour ===
                                                        colour.id
                                                            ? "selected"
                                                            : ""
                                                    }
                                                >
                                                    ${escapeHtml(
                                                        colour.name
                                                    )}
                                                </option>
                                            `
                                        )
                                        .join("")}

                                </select>


                                <label>
                                    Image Alt Text
                                </label>

                                <input
                                    type="text"
                                    class="image-alt"
                                    data-index="${index}"
                                    value="${escapeAttribute(
                                        image.alt || ""
                                    )}"
                                    placeholder="Image description"
                                >


                                <button
                                    type="button"
                                    class="remove-image"
                                    data-index="${index}"
                                >
                                    <i class="fa-solid fa-trash"></i>
                                    Remove Image
                                </button>

                            </div>

                        </div>
                    `;

                }
            )
            .join("");


    bindImageControls();

}


/* ============================================================
   IMAGE CONTROLS
   ============================================================ */

function bindImageControls() {

    document
        .querySelectorAll(
            ".image-product"
        )
        .forEach(
            select => {

                select.addEventListener(
                    "change",
                    () => {

                        const index =
                            Number(
                                select.dataset.index
                            );

                        if (
                            catalogueImages[index]
                        ) {

                            catalogueImages[
                                index
                            ].productId =
                                select.value;

                        }

                    }
                );

            }
        );


    document
        .querySelectorAll(
            ".image-colour"
        )
        .forEach(
            select => {

                select.addEventListener(
                    "change",
                    () => {

                        const index =
                            Number(
                                select.dataset.index
                            );

                        if (
                            catalogueImages[index]
                        ) {

                            catalogueImages[
                                index
                            ].colour =
                                select.value;

                        }

                    }
                );

            }
        );


    document
        .querySelectorAll(
            ".image-alt"
        )
        .forEach(
            input => {

                input.addEventListener(
                    "input",
                    () => {

                        const index =
                            Number(
                                input.dataset.index
                            );

                        if (
                            catalogueImages[index]
                        ) {

                            catalogueImages[
                                index
                            ].alt =
                                input.value;

                        }

                    }
                );

            }
        );


    document
        .querySelectorAll(
            ".remove-image"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        removeCatalogueImage(
                            Number(
                                button.dataset.index
                            )
                        );

                    }
                );

            }
        );


    bindImageDragDrop();

}


/* ============================================================
   REMOVE IMAGE
   ============================================================ */

function removeCatalogueImage(index) {

    catalogueImages.splice(
        index,
        1
    );

    renderCatalogueImages();

}


/* ============================================================
   DRAG DROP
   ============================================================ */

function bindImageDragDrop() {

    document
        .querySelectorAll(
            ".catalogue-image-card"
        )
        .forEach(
            card => {

                card.addEventListener(
                    "dragstart",
                    () => {

                        draggedImageIndex =
                            Number(
                                card.dataset.index
                            );

                    }
                );


                card.addEventListener(
                    "dragover",
                    event => {

                        event.preventDefault();

                    }
                );


                card.addEventListener(
                    "drop",
                    event => {

                        event.preventDefault();

                        const targetIndex =
                            Number(
                                card.dataset.index
                            );

                        if (
                            draggedImageIndex ===
                            null ||
                            draggedImageIndex ===
                            targetIndex
                        ) {

                            return;

                        }

                        const moved =
                            catalogueImages.splice(
                                draggedImageIndex,
                                1
                            )[0];

                        catalogueImages.splice(
                            targetIndex,
                            0,
                            moved
                        );

                        draggedImageIndex =
                            null;

                        renderCatalogueImages();

                    }
                );

            }
        );

}


/* ============================================================
   SAVE UPLOADED IMAGES
   ============================================================ */

async function uploadNewImages() {

    for (
        const image
        of catalogueImages
    ) {

        if (
            !image.isNew ||
            !image.file
        ) {

            continue;

        }

        const safeName =
            image.file.name
                .replace(
                    /[^a-zA-Z0-9._-]/g,
                    "-"
                );

        const storagePath =
            `catalogues/${currentCatalogueId || "new"}/${Date.now()}-${safeName}`;

        const imageRef =
            ref(
                storage,
                storagePath
            );

        await uploadBytes(
            imageRef,
            image.file
        );

        const url =
            await getDownloadURL(
                imageRef
            );

        image.imageUrl =
            url;

        image.storagePath =
            storagePath;

        image.file =
            null;

        image.isNew =
            false;

    }

}


/* ============================================================
   PREPARE IMAGE DATA
   ============================================================ */

function getCleanImageData() {

    return catalogueImages.map(
        image => {

            return {

                id:
                    image.id ||
                    `img-${Date.now()}`,

                imageUrl:
                    image.imageUrl,

                productId:
                    image.productId ||
                    "",

                colour:
                    image.colour ||
                    "",

                alt:
                    image.alt ||
                    "",

                storagePath:
                    image.storagePath ||
                    ""

            };

        }
    );

}


/* ============================================================
   SAVE CATALOGUE
   ============================================================ */

async function handleCatalogueSubmit(
    event
) {

    event.preventDefault();

    const name =
        $("catalogueName")
            ?.value
            .trim() || "";

    const description =
        $("catalogueDescription")
            ?.value
            .trim() || "";

    const active =
        $("catalogueActive")
            ? $("catalogueActive").checked
            : true;

    const order =
        Number(
            $("catalogueOrder")
                ?.value || 0
        );


    if (!name) {

        showMessage(
            "Enter catalogue name.",
            "error"
        );

        return;

    }


    if (!colours.length) {

        showMessage(
            "Add at least one colour.",
            "error"
        );

        return;

    }


    if (!sizes.length) {

        showMessage(
            "Add at least one size.",
            "error"
        );

        return;

    }


    if (!catalogueImages.length) {

        showMessage(
            "Add at least one catalogue image.",
            "error"
        );

        return;

    }


    const missingProduct =
        catalogueImages.some(
            image =>
                !image.productId
        );


    if (missingProduct) {

        showMessage(
            "Please link every image to a product.",
            "error"
        );

        return;

    }


    const saveButton =
        $("saveCatalogueButton");


    if (saveButton) {

        saveButton.disabled =
            true;

        saveButton.textContent =
            "Saving...";

    }


    try {

        /*
           For a new catalogue we first create
           a temporary Firestore document so
           Storage gets a permanent catalogue ID.
        */

        if (!currentCatalogueId) {

            const temporaryData = {

                name,

                description,

                active,

                order,

                colours,

                sizes,

                images: [],

                createdAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()

            };


            const newDoc =
                await addDoc(
                    collection(
                        db,
                        "catalogues"
                    ),
                    temporaryData
                );


            currentCatalogueId =
                newDoc.id;

        }


        await uploadNewImages();


        const cleanImages =
            getCleanImageData();


        await updateDoc(
            doc(
                db,
                "catalogues",
                currentCatalogueId
            ),
            {

                name,

                description,

                active,

                order,

                colours,

                sizes,

                images:
                    cleanImages,

                updatedAt:
                    serverTimestamp()

            }
        );


        showMessage(
            "Catalogue saved successfully.",
            "success"
        );


        await loadCatalogues();

        resetForm();

    }
    catch (error) {

        console.error(
            "Save catalogue error:",
            error
        );

        showMessage(
            error?.message ||
            "Unable to save catalogue.",
            "error"
        );

    }
    finally {

        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "Save Catalogue";

        }

    }

}


/* ============================================================
   EDIT CATALOGUE
   ============================================================ */

async function editCatalogue(
    catalogueId
) {

    const catalogue =
        catalogues.find(
            item =>
                item.id ===
                catalogueId
        );


    if (!catalogue) {

        return;

    }


    currentCatalogueId =
        catalogue.id;


    $("catalogueName").value =
        catalogue.name || "";


    $("catalogueDescription").value =
        catalogue.description || "";


    $("catalogueActive").checked =
        catalogue.active !== false;


    $("catalogueOrder").value =
        catalogue.order || 0;


    colours =
        Array.isArray(
            catalogue.colours
        )
            ? JSON.parse(
                JSON.stringify(
                    catalogue.colours
                )
            )
            : [];


    sizes =
        Array.isArray(
            catalogue.sizes
        )
            ? JSON.parse(
                JSON.stringify(
                    catalogue.sizes
                )
            )
            : [];


    catalogueImages =
        Array.isArray(
            catalogue.images
        )
            ? JSON.parse(
                JSON.stringify(
                    catalogue.images
                )
            )
            : [];


    renderColours();

    renderSizes();

    renderPriceMatrix();

    renderCatalogueImages();


    $("catalogueForm")
        ?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });


    if ($("saveCatalogueButton")) {

        $("saveCatalogueButton").textContent =
            "Update Catalogue";

    }

}


/* ============================================================
   DELETE CATALOGUE
   ============================================================ */

async function deleteCatalogue(
    catalogueId
) {

    const catalogue =
        catalogues.find(
            item =>
                item.id ===
                catalogueId
        );


    if (!catalogue) {

        return;

    }


    const confirmed =
        confirm(
            `Delete "${catalogue.name}"?`
        );


    if (!confirmed) {

        return;

    }


    try {

        /*
           Delete Storage images if
           storagePath is available.
        */

        if (
            Array.isArray(
                catalogue.images
            )
        ) {

            for (
                const image
                of catalogue.images
            ) {

                if (
                    image.storagePath
                ) {

                    try {

                        await deleteObject(
                            ref(
                                storage,
                                image.storagePath
                            )
                        );

                    }
                    catch (
                        storageError
                    ) {

                        console.warn(
                            "Image delete skipped:",
                            storageError
                        );

                    }

                }

            }

        }


        await deleteDoc(
            doc(
                db,
                "catalogues",
                catalogueId
            )
        );


        showMessage(
            "Catalogue deleted.",
            "success"
        );


        if (
            currentCatalogueId ===
            catalogueId
        ) {

            resetForm();

        }


        await loadCatalogues();

    }
    catch (error) {

        console.error(
            error
        );

        showMessage(
            error?.message ||
            "Unable to delete catalogue.",
            "error"
        );

    }

}


/* ============================================================
   RESET FORM
   ============================================================ */

function resetForm() {

    currentCatalogueId =
        null;

    colours = [];

    sizes = [];

    catalogueImages = [];

    if ($("catalogueForm")) {

        $("catalogueForm").reset();

    }


    if ($("catalogueActive")) {

        $("catalogueActive").checked =
            true;

    }


    renderColours();

    renderSizes();

    renderPriceMatrix();

    renderCatalogueImages();


    if ($("saveCatalogueButton")) {

        $("saveCatalogueButton").textContent =
            "Save Catalogue";

    }

}


/* ============================================================
   SLUG
   ============================================================ */

function createSlug(value) {

    return String(value || "")
        .toLowerCase()
        .trim()
        .replace(
            /[^a-z0-9]+/g,
            "-"
        )
        .replace(
            /^-+|-+$/g,
            ""
        ) ||
        `item-${Date.now()}`;

}


/* ============================================================
   ESCAPE
   ============================================================ */

function escapeHtml(value) {

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


function escapeAttribute(value) {

    return escapeHtml(value);

}