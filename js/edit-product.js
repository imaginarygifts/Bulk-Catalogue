import { db, storage } from "./firebase.js";


import {
  doc,
  getDoc,
  updateDoc,
  getDocs,
  collection,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL,
  listAll
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";


// ============================================================
// PRODUCT ID
// ============================================================

const params = new URLSearchParams(window.location.search);
const id = params.get("id");

if (!id) {
  alert("Product ID missing");
}


// ============================================================
// INPUTS
// ============================================================

const nameInput = document.getElementById("name");
const descInput = document.getElementById("desc");
const priceInput = document.getElementById("price");
const catSelect = document.getElementById("category");
const salePriceInput = document.getElementById("salePrice");
const stockStatus = document.getElementById("stockStatus");

const preview = document.getElementById("imagePreview");
const newImagesInput = document.getElementById("newImages");

const allowOnline = document.getElementById("allowOnline");
const allowCOD = document.getElementById("allowCOD");
const allowAdvance = document.getElementById("allowAdvance");

const onlineDiscountType =
  document.getElementById("onlineDiscountType");

const onlineDiscountValue =
  document.getElementById("onlineDiscountValue");

const codDiscountType =
  document.getElementById("codDiscountType");

const codDiscountValue =
  document.getElementById("codDiscountValue");

const advanceDiscountType =
  document.getElementById("advanceDiscountType");

const advanceDiscountValue =
  document.getElementById("advanceDiscountValue");

const advanceType =
  document.getElementById("advanceType");

const advanceValue =
  document.getElementById("advanceValue");

const bestsellerCheckbox =
  document.getElementById("isBestseller");


// ============================================================
// STATE
// ============================================================

let existingImages = [];
let newImages = [];

let colors = [];
let sizes = [];
let customOptions = [];

let relatedDesigns = [];
let allProducts = [];

let selectedTags = [];

let gallerySelected = [];
let currentGalleryPath = "product-images";

const galleryBreadcrumbs =
  document.getElementById("galleryBreadcrumbs");


// ============================================================
// POPUP
// ============================================================

function showPopup(msg) {

  const p = document.getElementById("popup");

  if (!p) return;

  p.innerText = msg;
  p.classList.remove("hidden");
}


function hidePopup() {

  const p = document.getElementById("popup");

  if (!p) return;

  p.classList.add("hidden");
}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// ============================================================
// ACCORDION
// ============================================================

window.toggleSection = function(id) {

  const el = document.getElementById(id);

  if (!el) return;

  el.classList.toggle("hidden");
};


// ============================================================
// CATEGORIES
// ============================================================

async function loadCategories() {

  if (!catSelect) return;

  catSelect.innerHTML =
    `<option value="">Select category</option>`;

  const snap = await getDocs(
    query(
      collection(db, "categories"),
      orderBy("order")
    )
  );

  const categories = [];

  snap.forEach(d => {

    categories.push({
      id: d.id,
      ...d.data()
    });

  });


  const mains =
    categories.filter(c => !c.parentId);


  mains.forEach(main => {

    const opt =
      document.createElement("option");

    opt.value = main.id;
    opt.textContent = main.name;
    opt.dataset.type = "main";

    catSelect.appendChild(opt);


    const subs =
      categories.filter(
        c => c.parentId === main.id
      );


    subs.forEach(sub => {

      const subOpt =
        document.createElement("option");

      subOpt.value = sub.id;
      subOpt.textContent = "— " + sub.name;

      subOpt.dataset.type = "sub";
      subOpt.dataset.parent = main.id;

      catSelect.appendChild(subOpt);

    });

  });

}


// ============================================================
// NORMALIZE COLORS
// ============================================================

function normalizeColor(color) {

  if (!color) {

    return {
      name: "",
      price: 0,
      required: false
    };

  }

  return {

    name:
      color.name ??
      color.label ??
      "",

    price:
      Number(color.price ?? 0),

    required:
      Boolean(color.required)

  };

}


// ============================================================
// NORMALIZE SIZES
// ============================================================

function normalizeSize(size) {

  if (!size) {

    return {
      name: "",
      price: 0,
      required: false
    };

  }

  return {

    name:
      size.name ??
      size.label ??
      "",

    price:
      Number(size.price ?? 0),

    required:
      Boolean(size.required),

    shipping:
      size.shipping ??
      null,

    shippingMode:
      size.shippingMode ??
      size.shippingType ??
      null,

    shippingAmount:
      Number(
        size.shippingAmount ??
        size.shippingPrice ??
        0
      )

  };

}


// ============================================================
// NORMALIZE CUSTOM CHOICES
// ============================================================

function normalizeDropdownChoices(choices) {

  if (!Array.isArray(choices)) {
    return [];
  }


  return choices
    .map(choice => {

      // Old format:
      // ["Design 1", "Design 2"]

      if (typeof choice === "string") {

        return {

          name: choice.trim(),

          price: 0

        };

      }


      // New format:
      // { name: "Design 1", price: 100 }

      if (choice && typeof choice === "object") {

        return {

          name:
            choice.name ??
            choice.label ??
            "",

          price:
            Number(choice.price ?? 0)

        };

      }


      return null;

    })
    .filter(choice =>
      choice &&
      choice.name
    );

}


// ============================================================
// NORMALIZE CUSTOM OPTION
// ============================================================

function normalizeCustomOption(option) {

  if (!option) {

    return {

      type: "text",
      label: "",
      price: 0,
      required: false

    };

  }


  const normalized = {

    type:
      option.type ??
      "text",

    label:
      option.label ??
      "",

    price:
      Number(option.price ?? 0),

    required:
      Boolean(option.required)

  };


  if (normalized.type === "dropdown") {

    normalized.choices =
      normalizeDropdownChoices(
        option.choices
      );

  }


  return normalized;

}


// ============================================================
// LOAD PRODUCT
// ============================================================

async function loadProduct() {

  if (!id) return;


  const snap =
    await getDoc(
      doc(db, "products", id)
    );


  if (!snap.exists()) {

    alert("Product not found");
    return;

  }


  const p = snap.data();


  // ----------------------------------------------------------
  // BASIC PRODUCT
  // ----------------------------------------------------------

  nameInput.value =
    p.name || "";

  descInput.value =
    p.description || "";

  priceInput.value =
    p.basePrice ?? "";

  salePriceInput.value =
    p.salePrice ?? "";

  if (stockStatus) {

    stockStatus.value =
      p.inStock === false
        ? "false"
        : "true";

  }


  catSelect.value =
    p.subCategoryId ||
    p.categoryId ||
    "";


  // ----------------------------------------------------------
  // IMAGES
  // ----------------------------------------------------------

  existingImages =
    Array.isArray(p.images)
      ? [...p.images]
      : [];

  newImages = [];


  // ----------------------------------------------------------
  // VARIANTS
  // ----------------------------------------------------------

  colors =
    Array.isArray(p.variants?.colors)
      ? p.variants.colors.map(normalizeColor)
      : [];


  sizes =
    Array.isArray(p.variants?.sizes)
      ? p.variants.sizes.map(normalizeSize)
      : [];


  // ----------------------------------------------------------
  // CUSTOM OPTIONS
  // ----------------------------------------------------------

  customOptions =
    Array.isArray(p.customOptions)
      ? p.customOptions.map(
          normalizeCustomOption
        )
      : [];


  // ----------------------------------------------------------
  // RELATED DESIGNS
  // ----------------------------------------------------------

  relatedDesigns =
    Array.isArray(p.relatedDesigns)
      ? [...p.relatedDesigns]
      : [];


  // ----------------------------------------------------------
  // TAGS
  // ----------------------------------------------------------

  selectedTags =
    Array.isArray(p.tags)
      ? [...p.tags]
      : [];


  // ----------------------------------------------------------
  // BESTSELLER
  // ----------------------------------------------------------

  if (bestsellerCheckbox) {

    bestsellerCheckbox.checked =
      p.isBestseller || false;

  }


  // ----------------------------------------------------------
  // PAYMENT
  // ----------------------------------------------------------

  const ps =
    p.paymentSettings || {};


  if (ps.online) {

    allowOnline.checked =
      ps.online.enabled ?? true;

    onlineDiscountType.value =
      ps.online.discountType || "none";

    onlineDiscountValue.value =
      ps.online.discountValue ?? "";

  }


  if (ps.cod) {

    allowCOD.checked =
      ps.cod.enabled ?? false;

    codDiscountType.value =
      ps.cod.discountType || "none";

    codDiscountValue.value =
      ps.cod.discountValue ?? "";

  }


  if (ps.advance) {

    allowAdvance.checked =
      ps.advance.enabled ?? false;

    advanceDiscountType.value =
      ps.advance.discountType || "none";

    advanceDiscountValue.value =
      ps.advance.discountValue ?? "";

    advanceType.value =
      ps.advance.type || "percent";

    advanceValue.value =
      ps.advance.value ?? "";

  }


  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  renderImagePreview();

  renderColors();

  renderSizes();

  renderCustomOptions();

}


// ============================================================
// IMAGE PREVIEW
// ============================================================

function renderImagePreview() {

  if (!preview) return;

  preview.innerHTML = "";


  // ----------------------------------------------------------
  // EXISTING IMAGES
  // ----------------------------------------------------------

  existingImages.forEach(
    (url, index) => {

      const div =
        document.createElement("div");

      div.className =
        "image-card";

      div.draggable = true;

      div.dataset.type =
        "existing";

      div.dataset.index =
        index;


      const img =
        document.createElement("img");

      img.src = url;


      const del =
        document.createElement("span");

      del.className =
        "image-delete";

      del.innerText = "×";


      del.onclick = (e) => {

        e.stopPropagation();

        existingImages.splice(
          index,
          1
        );

        renderImagePreview();

      };


      div.appendChild(img);

      div.appendChild(del);

      setupImageDrag(div, "existing", index);

      preview.appendChild(div);

    }
  );


  // ----------------------------------------------------------
  // NEW IMAGES
  // ----------------------------------------------------------

  newImages.forEach(
    (file, index) => {

      const div =
        document.createElement("div");

      div.className =
        "image-card";

      div.draggable = true;

      div.dataset.type =
        "new";

      div.dataset.index =
        index;


      const img =
        document.createElement("img");

      img.src =
        URL.createObjectURL(file);


      const del =
        document.createElement("span");

      del.className =
        "image-delete";

      del.innerText = "×";


      del.onclick = (e) => {

        e.stopPropagation();

        newImages.splice(
          index,
          1
        );

        renderImagePreview();

      };


      div.appendChild(img);

      div.appendChild(del);

      setupImageDrag(div, "new", index);

      preview.appendChild(div);

    }
  );

}


// ============================================================
// IMAGE DRAG / DROP
// ============================================================

let draggedImage = null;


function setupImageDrag(
  element,
  type,
  index
) {

  element.addEventListener(
    "dragstart",
    () => {

      draggedImage = {
        type,
        index
      };

      element.classList.add(
        "dragging"
      );

    }
  );


  element.addEventListener(
    "dragend",
    () => {

      draggedImage = null;

      element.classList.remove(
        "dragging"
      );

    }
  );


  element.addEventListener(
    "dragover",
    e => {

      e.preventDefault();

    }
  );


  element.addEventListener(
    "drop",
    e => {

      e.preventDefault();

      if (!draggedImage) return;


      const targetType =
        type;

      const targetIndex =
        index;


      // Build one unified ordered list

      const combined = [];


      existingImages.forEach(
        value => {

          combined.push({
            type: "existing",
            value
          });

        }
      );


      newImages.forEach(
        value => {

          combined.push({
            type: "new",
            value
          });

        }
      );


      const fromIndex =
        combined.findIndex(
          item =>
            item.type ===
              draggedImage.type &&
            item.value ===
              (
                draggedImage.type === "existing"
                  ? existingImages[draggedImage.index]
                  : newImages[draggedImage.index]
              )
        );


      if (
        fromIndex === -1
      ) return;


      const targetValue =
        targetType === "existing"
          ? existingImages[targetIndex]
          : newImages[targetIndex];


      const toIndex =
        combined.findIndex(
          item =>
            item.type ===
              targetType &&
            item.value ===
              targetValue
        );


      if (toIndex === -1) return;


      const moved =
        combined.splice(
          fromIndex,
          1
        )[0];


      combined.splice(
        toIndex,
        0,
        moved
      );


      existingImages =
        combined
          .filter(
            item =>
              item.type === "existing"
          )
          .map(
            item =>
              item.value
          );


      newImages =
        combined
          .filter(
            item =>
              item.type === "new"
          )
          .map(
            item =>
              item.value
          );


      renderImagePreview();

    }
  );

}


// ============================================================
// NEW IMAGE FILES
// ============================================================

if (newImagesInput) {

  newImagesInput.addEventListener(
    "change",
    () => {

      const files =
        Array.from(
          newImagesInput.files || []
        );


      files.forEach(
        file => {

          if (
            file.type &&
            file.type.startsWith("image/")
          ) {

            newImages.push(file);

          }

        }
      );


      newImagesInput.value = "";

      renderImagePreview();

    }
  );

}


// ============================================================
// COLORS
// ============================================================

window.addEditColor = function() {

  const name =
    document
      .getElementById("editColorName")
      ?.value
      .trim();


  const price =
    Number(
      document
        .getElementById("editColorPrice")
        ?.value || 0
    );


  const required =
    document
      .getElementById("colorRequired")
      ?.checked ||
    false;


  if (!name) {

    showPopup(
      "⚠ Enter color name"
    );

    setTimeout(
      hidePopup,
      1200
    );

    return;

  }


  colors.push({

    name,

    price:
      Math.max(0, price),

    required

  });


  renderColors();


  document.getElementById(
    "editColorName"
  ).value = "";


  document.getElementById(
    "editColorPrice"
  ).value = "";


  document.getElementById(
    "colorRequired"
  ).checked = false;

};


// ============================================================
// RENDER COLORS
// ============================================================

function renderColors() {

  const list =
    document.getElementById(
      "editColorList"
    );

  if (!list) return;

  list.innerHTML = "";


  colors.forEach(
    (color, index) => {

      const div =
        document.createElement("div");

      div.className =
        "variant-item";

      div.draggable = true;

      div.dataset.index =
        index;


      div.innerHTML = `

        <div class="variant-info">

          <strong>
            ${escapeHTML(color.name)}
          </strong>

          <span>
            +₹${Number(color.price || 0)}
          </span>

          ${
            color.required
              ? `<small>(Required)</small>`
              : ""
          }

        </div>

        <div class="variant-actions">

          <button
            type="button"
            class="btn-outline"
            data-edit
          >
            Edit
          </button>

          <button
            type="button"
            class="btn-outline"
            data-delete
          >
            Delete
          </button>

        </div>

      `;


      div.querySelector(
        "[data-edit]"
      ).onclick = () => {

        editColor(index);

      };


      div.querySelector(
        "[data-delete]"
      ).onclick = () => {

        colors.splice(
          index,
          1
        );

        renderColors();

      };


      setupVariantDrag(
        div,
        colors,
        renderColors
      );


      list.appendChild(div);

    }
  );

}


// ============================================================
// EDIT COLOR
// ============================================================

function editColor(index) {

  const color =
    colors[index];

  if (!color) return;


  const div =
    document.createElement("div");

  div.className =
    "variant-edit-form";


  div.innerHTML = `

    <input
      type="text"
      class="edit-name"
      value="${escapeHTML(color.name)}"
      placeholder="Color name"
    >

    <input
      type="number"
      class="edit-price"
      value="${Number(color.price || 0)}"
      placeholder="Extra price"
      min="0"
    >

    <label>
      <input
        type="checkbox"
        class="edit-required"
        ${color.required ? "checked" : ""}
      >
      Required
    </label>

    <button
      type="button"
      class="btn-outline save-btn"
    >
      Save
    </button>

    <button
      type="button"
      class="btn-outline cancel-btn"
    >
      Cancel
    </button>

  `;


  const list =
    document.getElementById(
      "editColorList"
    );


  const old =
    list.children[index];


  if (old) {

    old.replaceWith(div);

  }


  div.querySelector(
    ".save-btn"
  ).onclick = () => {

    const name =
      div.querySelector(
        ".edit-name"
      ).value.trim();


    if (!name) return;


    colors[index] = {

      name,

      price:
        Math.max(
          0,
          Number(
            div.querySelector(
              ".edit-price"
            ).value || 0
          )
        ),

      required:
        div.querySelector(
          ".edit-required"
        ).checked

    };


    renderColors();

  };


  div.querySelector(
    ".cancel-btn"
  ).onclick = () => {

    renderColors();

  };

}


// ============================================================
// SIZES / QUANTITY
// ============================================================

window.addEditSize = function() {

  const name =
    document
      .getElementById("editSizeName")
      ?.value
      .trim();


  const price =
    Number(
      document
        .getElementById("editSizePrice")
        ?.value || 0
    );


  const required =
    document
      .getElementById("sizeRequired")
      ?.checked ||
    false;


  if (!name) {

    showPopup(
      "⚠ Enter quantity"
    );

    setTimeout(
      hidePopup,
      1200
    );

    return;

  }


  sizes.push({

    name,

    price:
      Math.max(0, price),

    required

  });


  renderSizes();


  document.getElementById(
    "editSizeName"
  ).value = "";


  document.getElementById(
    "editSizePrice"
  ).value = "";


  document.getElementById(
    "sizeRequired"
  ).checked = false;

};


// ============================================================
// RENDER SIZES
// ============================================================

function renderSizes() {

  const list =
    document.getElementById(
      "editSizeList"
    );

  if (!list) return;

  list.innerHTML = "";


  sizes.forEach(
    (size, index) => {

      const div =
        document.createElement("div");

      div.className =
        "variant-item";

      div.draggable = true;


      div.innerHTML = `

        <div class="variant-info">

          <strong>
            ${escapeHTML(size.name)}
          </strong>

          <span>
            +₹${Number(size.price || 0)}
          </span>

          ${
            size.required
              ? `<small>(Required)</small>`
              : ""
          }

        </div>

        <div class="variant-actions">

          <button
            type="button"
            class="btn-outline"
            data-edit
          >
            Edit
          </button>

          <button
            type="button"
            class="btn-outline"
            data-delete
          >
            Delete
          </button>

        </div>

      `;


      div.querySelector(
        "[data-edit]"
      ).onclick = () => {

        editSize(index);

      };


      div.querySelector(
        "[data-delete]"
      ).onclick = () => {

        sizes.splice(
          index,
          1
        );

        renderSizes();

      };


      setupVariantDrag(
        div,
        sizes,
        renderSizes
      );


      list.appendChild(div);

    }
  );

}


// ============================================================
// EDIT SIZE
// ============================================================

function editSize(index) {

  const size =
    sizes[index];

  if (!size) return;


  const div =
    document.createElement("div");

  div.className =
    "variant-edit-form";


  div.innerHTML = `

    <input
      type="text"
      class="edit-name"
      value="${escapeHTML(size.name)}"
      placeholder="Quantity"
    >

    <input
      type="number"
      class="edit-price"
      value="${Number(size.price || 0)}"
      placeholder="Extra price"
      min="0"
    >

    <label>
      <input
        type="checkbox"
        class="edit-required"
        ${size.required ? "checked" : ""}
      >
      Required
    </label>

    <button
      type="button"
      class="btn-outline save-btn"
    >
      Save
    </button>

    <button
      type="button"
      class="btn-outline cancel-btn"
    >
      Cancel
    </button>

  `;


  const list =
    document.getElementById(
      "editSizeList"
    );


  const old =
    list.children[index];


  if (old) {

    old.replaceWith(div);

  }


  div.querySelector(
    ".save-btn"
  ).onclick = () => {

    const name =
      div.querySelector(
        ".edit-name"
      ).value.trim();


    if (!name) return;


    sizes[index] = {

      ...sizes[index],

      name,

      price:
        Math.max(
          0,
          Number(
            div.querySelector(
              ".edit-price"
            ).value || 0
          )
        ),

      required:
        div.querySelector(
          ".edit-required"
        ).checked

    };


    renderSizes();

  };


  div.querySelector(
    ".cancel-btn"
  ).onclick = () => {

    renderSizes();

  };

}


// ============================================================
// VARIANT DRAG
// ============================================================

function setupVariantDrag(
  element,
  array,
  renderFunction
) {

  let draggedIndex = null;


  element.addEventListener(
    "dragstart",
    () => {

      draggedIndex =
        Number(
          element.dataset.index
        );

      element.classList.add(
        "dragging"
      );

    }
  );


  element.addEventListener(
    "dragend",
    () => {

      element.classList.remove(
        "dragging"
      );

      draggedIndex = null;

    }
  );


  element.addEventListener(
    "dragover",
    e => {

      e.preventDefault();

    }
  );


  element.addEventListener(
    "drop",
    e => {

      e.preventDefault();


      const targetIndex =
        Number(
          element.dataset.index
        );


      if (
        draggedIndex === null ||
        draggedIndex === targetIndex
      ) return;


      const moved =
        array.splice(
          draggedIndex,
          1
        )[0];


      array.splice(
        targetIndex,
        0,
        moved
      );


      renderFunction();

    }
  );

}


// ============================================================
// CUSTOM OPTION CHOICE PRICE EDITOR
// ============================================================

function ensureCustomChoicePriceEditor(
  inputId,
  editorId
) {

  const input =
    document.getElementById(
      inputId
    );

  if (!input) return null;


  let editor =
    document.getElementById(
      editorId
    );


  if (!editor) {

    editor =
      document.createElement("div");

    editor.id =
      editorId;

    editor.className =
      "custom-choice-prices";

    input.insertAdjacentElement(
      "afterend",
      editor
    );

  }


  return editor;

}


// ============================================================
// PARSE CHOICE NAMES
// ============================================================

function parseChoiceNames(raw) {

  return String(raw || "")
    .split(",")
    .map(
      value =>
        value.trim()
    )
    .filter(Boolean);

}


// ============================================================
// RENDER ADD CUSTOM CHOICE PRICES
// ============================================================

function renderAddChoicePriceInputs() {

  const input =
    document.getElementById(
      "editCustomChoices"
    );

  const editor =
    ensureCustomChoicePriceEditor(
      "editCustomChoices",
      "editCustomChoicePrices"
    );


  if (!input || !editor) return;


  const names =
    parseChoiceNames(
      input.value
    );


  const previous = {};


  editor
    .querySelectorAll(
      ".custom-choice-price-row"
    )
    .forEach(row => {

      const name =
        row.dataset.name;

      const price =
        row.querySelector(
          "input"
        )?.value;


      if (name) {

        previous[name] =
          Number(price || 0);

      }

    });


  editor.innerHTML = "";


  if (!names.length) {

    editor.style.display =
      "none";

    return;

  }


  editor.style.display =
    "block";


  names.forEach(
    (name, index) => {

      const row =
        document.createElement("div");

      row.className =
        "custom-choice-price-row";

      row.dataset.name =
        name;


      row.style.display =
        "flex";

      row.style.alignItems =
        "center";

      row.style.gap =
        "8px";

      row.style.marginTop =
        "8px";


      const label =
        document.createElement("span");

      label.textContent =
        name;

      label.style.flex =
        "1";


      const price =
        document.createElement("input");

      price.type =
        "number";

      price.min =
        "0";

      price.placeholder =
        "Price";

      price.value =
        previous[name] ?? 0;


      row.appendChild(label);

      row.appendChild(price);

      editor.appendChild(row);

    }
  );

}


// ============================================================
// READ CUSTOM CHOICE PRICES
// ============================================================

function getChoicePriceData(
  inputId,
  editorId
) {

  const input =
    document.getElementById(
      inputId
    );

  const editor =
    document.getElementById(
      editorId
    );


  const names =
    parseChoiceNames(
      input?.value || ""
    );


  if (!names.length) {

    return [];

  }


  return names.map(
    (name, index) => {

      let price = 0;


      const rows =
        editor?.querySelectorAll(
          ".custom-choice-price-row"
        );


      if (rows && rows[index]) {

        const input =
          rows[index].querySelector(
            "input"
          );

        price =
          Number(
            input?.value || 0
          );

      }


      return {

        name,

        price:
          Math.max(
            0,
            price
          )

      };

    }
  );

}


// ============================================================
// CUSTOM OPTION TYPE UI
// ============================================================

function updateCustomOptionForm() {

  const type =
    document.getElementById(
      "editCustomType"
    )?.value;


  const priceInput =
    document.getElementById(
      "editCustomPrice"
    );


  const choicesInput =
    document.getElementById(
      "editCustomChoices"
    );


  const editor =
    ensureCustomChoicePriceEditor(
      "editCustomChoices",
      "editCustomChoicePrices"
    );


  if (!type) return;


  if (type === "dropdown") {

    if (priceInput) {

      priceInput.style.display =
        "none";

      priceInput.disabled =
        true;

    }


    if (choicesInput) {

      choicesInput.style.display =
        "block";

    }


    if (editor) {

      editor.style.display =
        "block";

    }


    renderAddChoicePriceInputs();

  } else {

    if (priceInput) {

      priceInput.style.display =
        "";

      priceInput.disabled =
        false;

    }


    if (choicesInput) {

      choicesInput.style.display =
        "none";

    }


    if (editor) {

      editor.style.display =
        "none";

    }

  }

}


// ============================================================
// CUSTOM OPTION EVENTS
// ============================================================

const customTypeInput =
  document.getElementById(
    "editCustomType"
  );

const customChoicesInput =
  document.getElementById(
    "editCustomChoices"
  );


if (customTypeInput) {

  customTypeInput.addEventListener(
    "change",
    updateCustomOptionForm
  );

}


if (customChoicesInput) {

  customChoicesInput.addEventListener(
    "input",
    renderAddChoicePriceInputs
  );

}


// ============================================================
// ADD CUSTOM OPTION
// ============================================================

window.addEditCustomOption =
  function() {

    const type =
      document.getElementById(
        "editCustomType"
      ).value;


    const label =
      document.getElementById(
        "editCustomLabel"
      ).value.trim();


    const price =
      Number(
        document.getElementById(
          "editCustomPrice"
        ).value || 0
      );


    const choicesRaw =
      document.getElementById(
        "editCustomChoices"
      ).value;


    const required =
      document.getElementById(
        "customRequired"
      )?.checked ||
      false;


    if (!label) {

      showPopup(
        "⚠ Enter option label"
      );

      setTimeout(
        hidePopup,
        1200
      );

      return;

    }


    // --------------------------------------------------------
    // DROPDOWN
    // --------------------------------------------------------

    if (type === "dropdown") {

      const choices =
        getChoicePriceData(
          "editCustomChoices",
          "editCustomChoicePrices"
        );


      if (!choices.length) {

        showPopup(
          "⚠ Add at least one dropdown choice"
        );

        setTimeout(
          hidePopup,
          1500
        );

        return;

      }


      customOptions.push({

        type,

        label,

        price: 0,

        required,

        choices

      });

    }


    // --------------------------------------------------------
    // OTHER OPTIONS
    // --------------------------------------------------------

    else {

      customOptions.push({

        type,

        label,

        price:
          Math.max(
            0,
            price
          ),

        required

      });

    }


    renderCustomOptions();


    // --------------------------------------------------------
    // RESET
    // --------------------------------------------------------

    document.getElementById(
      "editCustomLabel"
    ).value = "";


    document.getElementById(
      "editCustomPrice"
    ).value = "";


    document.getElementById(
      "editCustomChoices"
    ).value = "";


    document.getElementById(
      "customRequired"
    ).checked = false;


    renderAddChoicePriceInputs();

    updateCustomOptionForm();

  };


// ============================================================
// RENDER CUSTOM OPTIONS
// ============================================================

function renderCustomOptions() {

  const list =
    document.getElementById(
      "editCustomList"
    );

  if (!list) return;


  list.innerHTML = "";


  customOptions.forEach(
    (option, index) => {

      const div =
        document.createElement("div");

      div.className =
        "custom-option-item";

      div.draggable = true;

      div.dataset.index =
        index;


      let details = "";


      if (
        option.type ===
        "dropdown"
      ) {

        const choices =
          normalizeDropdownChoices(
            option.choices
          );


        details = `

          <div class="custom-choice-summary">

            ${choices
              .map(
                choice => `
                  <div>
                    ${escapeHTML(
                      choice.name
                    )}
                    <strong>
                      +₹${Number(
                        choice.price || 0
                      )}
                    </strong>
                  </div>
                `
              )
              .join("")}

          </div>

        `;

      }


      const overallPrice =
        option.type ===
        "dropdown"
          ? ""
          : `+₹${Number(
              option.price || 0
            )}`;


      div.innerHTML = `

        <div class="custom-option-main">

          <div>

            <strong>
              ${escapeHTML(
                option.label
              )}
            </strong>

            <span>
              ${escapeHTML(
                option.type
              )}
            </span>

            ${
              overallPrice
                ? `<span>${overallPrice}</span>`
                : ""
            }

            ${
              option.required
                ? `<small>(Required)</small>`
                : ""
            }

          </div>

          ${
            details
          }

        </div>


        <div class="custom-option-actions">

          <button
            type="button"
            class="btn-outline"
            data-edit
          >
            Edit
          </button>

          <button
            type="button"
            class="btn-outline"
            data-delete
          >
            Delete
          </button>

        </div>

      `;


      div.querySelector(
        "[data-edit]"
      ).onclick = () => {

        editCustomOption(index);

      };


      div.querySelector(
        "[data-delete]"
      ).onclick = () => {

        customOptions.splice(
          index,
          1
        );

        renderCustomOptions();

      };


      setupVariantDrag(
        div,
        customOptions,
        renderCustomOptions
      );


      list.appendChild(div);

    }
  );

}


// ============================================================
// EDIT CUSTOM OPTION
// ============================================================

function editCustomOption(index) {

  const option =
    normalizeCustomOption(
      customOptions[index]
    );


  if (!option) return;


  const div =
    document.createElement("div");

  div.className =
    "custom-option-edit";


  const choices =
    option.type === "dropdown"
      ? normalizeDropdownChoices(
          option.choices
        )
      : [];


  div.innerHTML = `

    <select class="edit-option-type">

      <option value="text">
        Text
      </option>

      <option value="image">
        Image Upload
      </option>

      <option value="checkbox">
        Checkbox
      </option>

      <option value="dropdown">
        Dropdown
      </option>

    </select>


    <input
      class="edit-option-label"
      placeholder="Option label"
      value="${escapeHTML(
        option.label
      )}"
    >


    <input
      class="edit-option-price"
      type="number"
      min="0"
      placeholder="Extra price"
      value="${Number(
        option.price || 0
      )}"
    >


    <input
      class="edit-option-choices"
      placeholder="Dropdown choices (comma separated)"
      value="${escapeHTML(
        choices
          .map(
            c => c.name
          )
          .join(", ")
      )}"
    >


    <div
      class="edit-option-choice-prices"
    ></div>


    <label>

      <input
        type="checkbox"
        class="edit-option-required"
        ${
          option.required
            ? "checked"
            : ""
        }
      >

      Required

    </label>


    <div>

      <button
        type="button"
        class="btn-outline save-custom"
      >
        Save
      </button>

      <button
        type="button"
        class="btn-outline cancel-custom"
      >
        Cancel
      </button>

    </div>

  `;


  const list =
    document.getElementById(
      "editCustomList"
    );


  const old =
    list.children[index];


  if (old) {

    old.replaceWith(div);

  }


  const typeSelect =
    div.querySelector(
      ".edit-option-type"
    );


  const priceInput =
    div.querySelector(
      ".edit-option-price"
    );


  const choicesInput =
    div.querySelector(
      ".edit-option-choices"
    );


  const choiceEditor =
    div.querySelector(
      ".edit-option-choice-prices"
    );


  typeSelect.value =
    option.type;


  // ----------------------------------------------------------
  // LOCAL CHOICE PRICE RENDERER
  // ----------------------------------------------------------

  function renderEditChoicePrices() {

    if (
      typeSelect.value !==
      "dropdown"
    ) {

      choiceEditor.innerHTML =
        "";

      choiceEditor.style.display =
        "none";

      choicesInput.style.display =
        "none";

      priceInput.style.display =
        "";

      priceInput.disabled =
        false;

      return;

    }


    choicesInput.style.display =
      "block";

    priceInput.style.display =
      "none";

    priceInput.disabled =
      true;


    const names =
      parseChoiceNames(
        choicesInput.value
      );


    // Preserve current entered prices

    const previous = {};


    choiceEditor
      .querySelectorAll(
        ".custom-choice-price-row"
      )
      .forEach(row => {

        const name =
          row.dataset.name;

        const price =
          row.querySelector(
            "input"
          )?.value;


        if (name) {

          previous[name] =
            Number(price || 0);

        }

      });


    // First time: use original values

    if (
      !Object.keys(previous).length
    ) {

      choices.forEach(
        choice => {

          previous[
            choice.name
          ] =
            Number(
              choice.price || 0
            );

        }
      );

    }


    choiceEditor.innerHTML =
      "";

    choiceEditor.style.display =
      "block";


    names.forEach(
      name => {

        const row =
          document.createElement("div");

        row.className =
          "custom-choice-price-row";

        row.dataset.name =
          name;


        row.style.display =
          "flex";

        row.style.alignItems =
          "center";

        row.style.gap =
          "8px";

        row.style.marginTop =
          "8px";


        const label =
          document.createElement(
            "span"
          );

        label.textContent =
          name;

        label.style.flex =
          "1";


        const price =
          document.createElement(
            "input"
          );

        price.type =
          "number";

        price.min =
          "0";

        price.placeholder =
          "Price";

        price.value =
          previous[name] ?? 0;


        row.appendChild(
          label
        );

        row.appendChild(
          price
        );

        choiceEditor.appendChild(
          row
        );

      }
    );

  }


  typeSelect.addEventListener(
    "change",
    renderEditChoicePrices
  );


  choicesInput.addEventListener(
    "input",
    renderEditChoicePrices
  );


  renderEditChoicePrices();


  // ----------------------------------------------------------
  // SAVE
  // ----------------------------------------------------------

  div.querySelector(
    ".save-custom"
  ).onclick = () => {

    const type =
      typeSelect.value;


    const label =
      div.querySelector(
        ".edit-option-label"
      ).value.trim();


    const required =
      div.querySelector(
        ".edit-option-required"
      ).checked;


    if (!label) {

      showPopup(
        "⚠ Enter option label"
      );

      setTimeout(
        hidePopup,
        1200
      );

      return;

    }


    // --------------------------------------------------------
    // DROPDOWN
    // --------------------------------------------------------

    if (
      type ===
      "dropdown"
    ) {

      const names =
        parseChoiceNames(
          choicesInput.value
        );


      if (!names.length) {

        showPopup(
          "⚠ Add dropdown choices"
        );

        setTimeout(
          hidePopup,
          1200
        );

        return;

      }


      const rows =
        choiceEditor.querySelectorAll(
          ".custom-choice-price-row"
        );


      const finalChoices =
        names.map(
          (name, choiceIndex) => {

            const row =
              rows[choiceIndex];


            const input =
              row?.querySelector(
                "input"
              );


            const choicePrice =
              Number(
                input?.value || 0
              );


            return {

              name,

              price:
                Math.max(
                  0,
                  choicePrice
                )

            };

          }
        );


      customOptions[index] = {

        type,

        label,

        price: 0,

        required,

        choices:
          finalChoices

      };

    }


    // --------------------------------------------------------
    // OTHER TYPES
    // --------------------------------------------------------

    else {

      const price =
        Number(
          priceInput.value || 0
        );


      customOptions[index] = {

        type,

        label,

        price:
          Math.max(
            0,
            price
          ),

        required

      };

    }


    renderCustomOptions();

  };


  // ----------------------------------------------------------
  // CANCEL
  // ----------------------------------------------------------

  div.querySelector(
    ".cancel-custom"
  ).onclick = () => {

    renderCustomOptions();

  };

}


// ============================================================
// RELATED DESIGNS
// ============================================================

async function loadDesignProducts() {

  const snap =
    await getDocs(
      collection(
        db,
        "products"
      )
    );


  allProducts = [];


  snap.forEach(
    d => {

      allProducts.push({

        id: d.id,

        ...d.data()

      });

    }
  );


  renderDesignList(
    allProducts
  );

}


// ============================================================
// RENDER RELATED DESIGNS
// ============================================================

function renderDesignList(list) {

  const box =
    document.getElementById(
      "designList"
    );

  if (!box) return;


  box.innerHTML = "";


  list.forEach(
    product => {

      if (
        product.id === id
      ) return;


      const row =
        document.createElement("div");

      row.className =
        "design-item";


      const checked =
        relatedDesigns.includes(
          product.id
        );


      row.innerHTML = `

        <input
          type="checkbox"
          ${
            checked
              ? "checked"
              : ""
          }
        >

        <img
          src="${escapeHTML(
            product.images?.[0] || ""
          )}"
        >

        <span>
          ${escapeHTML(
            product.name || ""
          )}
        </span>

      `;


      const checkbox =
        row.querySelector(
          "input"
        );


      checkbox.addEventListener(
        "change",
        () => {

          toggleDesign(
            product.id,
            checkbox.checked
          );

        }
      );


      box.appendChild(row);

    }
  );

}


// ============================================================
// TOGGLE DESIGN
// ============================================================

window.toggleDesign =
  function(
    productId,
    checked
  ) {

    if (checked) {

      if (
        !relatedDesigns.includes(
          productId
        )
      ) {

        relatedDesigns.push(
          productId
        );

      }

    } else {

      relatedDesigns =
        relatedDesigns.filter(
          value =>
            value !==
            productId
        );

    }

  };


// ============================================================
// FILTER DESIGNS
// ============================================================

window.filterDesigns =
  function() {

    const input =
      document.getElementById(
        "designSearch"
      );


    const q =
      (
        input?.value ||
        ""
      )
        .toLowerCase()
        .trim();


    const filtered =
      allProducts.filter(
        product =>
          product.id !== id &&
          String(
            product.name || ""
          )
            .toLowerCase()
            .includes(q)
      );


    renderDesignList(
      filtered
    );

  };


// ============================================================
// TAGS
// ============================================================

async function loadTags() {

  const box =
    document.getElementById(
      "tagCheckboxes"
    );

  if (!box) return;


  const snap =
    await getDocs(
      collection(
        db,
        "tags"
      )
    );


  box.innerHTML = "";


  snap.forEach(
    d => {

      const t =
        d.data();


      const row =
        document.createElement("div");

      row.className =
        "tag-item";


      const checked =
        selectedTags.includes(
          t.slug
        );


      row.innerHTML = `

        <input
          type="checkbox"
          ${
            checked
              ? "checked"
              : ""
          }
        >

        <span>
          ${escapeHTML(
            t.name || ""
          )}
        </span>

      `;


      const checkbox =
        row.querySelector(
          "input"
        );


      checkbox.addEventListener(
        "change",
        () => {

          toggleTag(
            t.slug,
            checkbox.checked
          );

        }
      );


      box.appendChild(row);

    }
  );

}


// ============================================================
// TAG TOGGLE
// ============================================================

window.toggleTag =
  function(
    slug,
    checked
  ) {

    if (checked) {

      if (
        !selectedTags.includes(
          slug
        )
      ) {

        selectedTags.push(
          slug
        );

      }

    } else {

      selectedTags =
        selectedTags.filter(
          tag =>
            tag !== slug
        );

    }

  };


// ============================================================
// STORAGE GALLERY
// ============================================================

window.openGalleryPicker =
  function() {

    const picker =
      document.getElementById(
        "galleryPicker"
      );


    if (!picker) return;


    picker.classList.remove(
      "hidden"
    );


    gallerySelected = [];


    loadGalleryFolder(
      "product-images"
    );

  };


// ============================================================
// LOAD GALLERY FOLDER
// ============================================================

async function loadGalleryFolder(
  path
) {

  currentGalleryPath =
    path;


  updateGalleryBreadcrumbs(
    path
  );


  const grid =
    document.getElementById(
      "galleryPickerGrid"
    );


  if (!grid) return;


  grid.innerHTML = "";


  try {

    const folderRef =
      ref(
        storage,
        path
      );


    const res =
      await listAll(
        folderRef
      );


    // --------------------------------------------------------
    // FOLDERS
    // --------------------------------------------------------

    res.prefixes.forEach(
      folder => {

        const div =
          document.createElement("div");

        div.className =
          "gallery-folder";


        div.innerHTML = `

          <div class="folder-icon">
            📁
          </div>

          <span>
            ${escapeHTML(
              folder.name
            )}
          </span>

        `;


        div.onclick =
          () => {

            loadGalleryFolder(
              folder.fullPath
            );

          };


        grid.appendChild(
          div
        );

      }
    );


    // --------------------------------------------------------
    // IMAGES
    // --------------------------------------------------------

    for (
      const file of res.items
    ) {

      const url =
        await getDownloadURL(
          file
        );


      const div =
        document.createElement("div");

      div.className =
        "gallery-img";


      const checked =
        gallerySelected.includes(
          url
        );


      div.innerHTML = `

        <input
          type="checkbox"
          class="gallery-check"
          ${
            checked
              ? "checked"
              : ""
          }
        >

        <img
          src="${escapeHTML(
            url
          )}"
        >

      `;


      const checkbox =
        div.querySelector(
          "input"
        );


      checkbox.onchange =
        () => {

          if (
            checkbox.checked
          ) {

            if (
              !gallerySelected.includes(
                url
              )
            ) {

              gallerySelected.push(
                url
              );

            }

          } else {

            gallerySelected =
              gallerySelected.filter(
                x =>
                  x !== url
              );

          }

        };


      grid.appendChild(
        div
      );

    }

  } catch (error) {

    console.error(
      "Gallery error:",
      error
    );


    grid.innerHTML =
      `<p>Unable to load gallery.</p>`;

  }

}


// ============================================================
// BREADCRUMBS
// ============================================================

function updateGalleryBreadcrumbs(
  path
) {

  if (!galleryBreadcrumbs)
    return;


  galleryBreadcrumbs.innerHTML =
    "";


  const parts =
    path
      .replace(
        "product-images",
        ""
      )
      .split("/")
      .filter(Boolean);


  const home =
    document.createElement(
      "span"
    );


  home.innerText =
    "Home";

  home.style.cursor =
    "pointer";


  home.onclick =
    () => {

      loadGalleryFolder(
        "product-images"
      );

    };


  galleryBreadcrumbs.appendChild(
    home
  );


  let currentPath =
    "product-images";


  parts.forEach(
    part => {

      currentPath +=
        "/" + part;


      const span =
        document.createElement(
          "span"
        );


      span.innerText =
        " / " +
        decodeURIComponent(
          part
        );


      span.style.cursor =
        "pointer";


      const pathCopy =
        currentPath;


      span.onclick =
        () => {

          loadGalleryFolder(
            pathCopy
          );

        };


      galleryBreadcrumbs.appendChild(
        span
      );

    }
  );

}


// ============================================================
// CLOSE GALLERY
// ============================================================

window.closeGalleryPicker =
  function() {

    const picker =
      document.getElementById(
        "galleryPicker"
      );


    if (!picker) return;


    picker.classList.add(
      "hidden"
    );

  };


// ============================================================
// ADD SELECTED GALLERY IMAGES
// ============================================================

window.addSelectedImages =
  function() {

    gallerySelected.forEach(
      url => {

        if (
          !existingImages.includes(
            url
          )
        ) {

          existingImages.push(
            url
          );

        }

      }
    );


    gallerySelected = [];


    renderImagePreview();


    closeGalleryPicker();

  };


// ============================================================
// UPDATE PRODUCT
// ============================================================

window.updateProduct =
  async function() {

    const name =
      nameInput.value.trim();


    const price =
      Number(
        priceInput.value || 0
      );


    const selectedOption =
      catSelect.options[
        catSelect.selectedIndex
      ];


    let categoryId =
      null;

    let subCategoryId =
      null;


    if (
      selectedOption &&
      selectedOption.dataset.type ===
        "main"
    ) {

      categoryId =
        selectedOption.value;

    }


    if (
      selectedOption &&
      selectedOption.dataset.type ===
        "sub"
    ) {

      subCategoryId =
        selectedOption.value;

      categoryId =
        selectedOption.dataset.parent;

    }


    const isBestseller =
      document.getElementById(
        "isBestseller"
      )?.checked ||
      false;


    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (
      !name ||
      !price ||
      !selectedOption?.value
    ) {

      showPopup(
        "⚠ Fill all required fields"
      );


      setTimeout(
        hidePopup,
        1500
      );


      return;

    }


    // Validate custom dropdown choices

    for (
      const option of customOptions
    ) {

      if (
        option.type ===
        "dropdown"
      ) {

        option.choices =
          normalizeDropdownChoices(
            option.choices
          );


        if (
          !option.choices.length
        ) {

          showPopup(
            `⚠ Dropdown "${option.label}" has no choices`
          );


          setTimeout(
            hidePopup,
            1800
          );


          return;

        }


        option.price = 0;

      }

    }


    try {

      // ------------------------------------------------------
      // UPLOAD NEW IMAGES
      // ------------------------------------------------------

      showPopup(
        "Uploading images..."
      );


      const finalImages =
        [...existingImages];


      for (
        const file of newImages
      ) {

        const safeName =
          `${Date.now()}-${file.name}`;


        const storageRef =
          ref(
            storage,
            `products/${safeName}`
          );


        await uploadBytes(
          storageRef,
          file
        );


        const url =
          await getDownloadURL(
            storageRef
          );


        finalImages.push(
          url
        );

      }


      // ------------------------------------------------------
      // PAYMENT SETTINGS
      // ------------------------------------------------------

      const paymentSettings = {

        online: {

          enabled:
            allowOnline.checked,

          discountType:
            onlineDiscountType.value,

          discountValue:
            Number(
              onlineDiscountValue.value ||
              0
            )

        },


        cod: {

          enabled:
            allowCOD.checked,

          discountType:
            codDiscountType.value,

          discountValue:
            Number(
              codDiscountValue.value ||
              0
            )

        },


        advance: {

          enabled:
            allowAdvance.checked,

          discountType:
            advanceDiscountType.value,

          discountValue:
            Number(
              advanceDiscountValue.value ||
              0
            ),

          type:
            advanceType.value,

          value:
            Number(
              advanceValue.value ||
              0
            )

        }

      };


      // ------------------------------------------------------
      // SAVE
      // ------------------------------------------------------

      showPopup(
        "Saving changes..."
      );


      await updateDoc(
        doc(
          db,
          "products",
          id
        ),
        {

          name,

          description:
            descInput.value,


          basePrice:
            price,


          salePrice:
            Number(
              salePriceInput.value ||
              price
            ),


          inStock:
            stockStatus?.value ===
            "true",


          categoryId,

          subCategoryId,


          images:
            finalImages,


          variants: {

            colors:
              colors.map(
                normalizeColor
              ),

            sizes:
              sizes.map(
                normalizeSize
              )

          },


          customOptions:
            customOptions.map(
              option =>
                normalizeCustomOption(
                  option
                )
            ),


          paymentSettings,


          relatedDesigns,


          tags:
            selectedTags,


          isBestseller

        }
      );


      // ------------------------------------------------------
      // BIDIRECTIONAL RELATED DESIGNS
      // ------------------------------------------------------

      const allOldRelated =
        new Set();


      // Get current product's old related designs

      const currentSnap =
        await getDoc(
          doc(
            db,
            "products",
            id
          )
        );


      if (
        currentSnap.exists()
      ) {

        const currentData =
          currentSnap.data();


        (
          currentData.relatedDesigns ||
          []
        ).forEach(
          rid =>
            allOldRelated.add(
              rid
            )
        );

      }


      // ------------------------------------------------------
      // ADD NEW LINKS
      // ------------------------------------------------------

      for (
        const rid of relatedDesigns
      ) {

        if (
          rid === id
        ) continue;


        const refDoc =
          doc(
            db,
            "products",
            rid
          );


        const snap =
          await getDoc(
            refDoc
          );


        if (
          !snap.exists()
        ) continue;


        const data =
          snap.data();


        const arr =
          Array.isArray(
            data.relatedDesigns
          )
            ? [
                ...data.relatedDesigns
              ]
            : [];


        if (
          !arr.includes(id)
        ) {

          arr.push(id);


          await updateDoc(
            refDoc,
            {
              relatedDesigns:
                arr
            }
          );

        }

      }


      // ------------------------------------------------------
      // REMOVE OLD LINKS
      // ------------------------------------------------------

      for (
        const rid of allOldRelated
      ) {

        if (
          relatedDesigns.includes(
            rid
          )
        ) continue;


        const refDoc =
          doc(
            db,
            "products",
            rid
          );


        const snap =
          await getDoc(
            refDoc
          );


        if (
          !snap.exists()
        ) continue;


        const data =
          snap.data();


        const arr =
          Array.isArray(
            data.relatedDesigns
          )
            ? [
                ...data.relatedDesigns
              ]
            : [];


        const cleaned =
          arr.filter(
            value =>
              value !== id
          );


        if (
          cleaned.length !==
          arr.length
        ) {

          await updateDoc(
            refDoc,
            {
              relatedDesigns:
                cleaned
            }
          );

        }

      }


      // ------------------------------------------------------
      // SUCCESS
      // ------------------------------------------------------

      showPopup(
        "✅ Product updated"
      );


      setTimeout(
        () => {

          hidePopup();

          location.href =
            "products.html";

        },
        1200
      );

    } catch (error) {

      console.error(
        "Update product error:",
        error
      );


      showPopup(
        "❌ " +
        (
          error.message ||
          "Something went wrong"
        )
      );

    }

  };


// ============================================================
// INITIALIZE
// ============================================================

async function init() {

  try {

    await loadCategories();

    await loadProduct();

    await Promise.all([
      loadDesignProducts(),
      loadTags()
    ]);


    // Initialize custom dropdown UI

    updateCustomOptionForm();

  } catch (error) {

    console.error(
      "Edit product initialization error:",
      error
    );


    showPopup(
      "❌ Failed to load product"
    );

  }

}


init();