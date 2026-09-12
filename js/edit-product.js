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

const params =
  new URLSearchParams(window.location.search);

const id =
  params.get("id");

if (!id) {
  alert("Product ID missing");
}


// ============================================================
// INPUTS
// ============================================================

const nameInput =
  document.getElementById("name");

const descInput =
  document.getElementById("desc");

const priceInput =
  document.getElementById("price");

const salePriceInput =
  document.getElementById("salePrice");

const catSelect =
  document.getElementById("category");

const stockStatus =
  document.getElementById("stockStatus");

const preview =
  document.getElementById("imagePreview");

const newImagesInput =
  document.getElementById("newImages");

const allowOnline =
  document.getElementById("allowOnline");

const allowCOD =
  document.getElementById("allowCOD");

const allowAdvance =
  document.getElementById("allowAdvance");

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

let currentGalleryPath =
  "product-images";

const galleryBreadcrumbs =
  document.getElementById(
    "galleryBreadcrumbs"
  );


// ============================================================
// GLOBAL DRAG STATE
// IMPORTANT: shared by ALL variant lists
// ============================================================

let activeDrag = null;


// ============================================================
// POPUP
// ============================================================

function showPopup(message) {

  const popup =
    document.getElementById("popup");

  if (!popup) return;

  popup.innerText =
    message;

  popup.classList.remove("hidden");
}


function hidePopup() {

  const popup =
    document.getElementById("popup");

  if (!popup) return;

  popup.classList.add("hidden");
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

window.toggleSection =
  function(sectionId) {

    const element =
      document.getElementById(sectionId);

    if (!element) return;

    element.classList.toggle("hidden");
  };


// ============================================================
// CATEGORIES
// ============================================================

async function loadCategories() {

  if (!catSelect) return;

  catSelect.innerHTML =
    `<option value="">Select category</option>`;

  const snapshot =
    await getDocs(
      query(
        collection(db, "categories"),
        orderBy("order")
      )
    );

  const categories = [];

  snapshot.forEach(
    documentSnapshot => {

      categories.push({
        id: documentSnapshot.id,
        ...documentSnapshot.data()
      });

    }
  );

  const mains =
    categories.filter(
      category =>
        !category.parentId
    );

  mains.forEach(
    main => {

      const option =
        document.createElement("option");

      option.value =
        main.id;

      option.textContent =
        main.name;

      option.dataset.type =
        "main";

      catSelect.appendChild(option);

      const subCategories =
        categories.filter(
          category =>
            category.parentId === main.id
        );

      subCategories.forEach(
        sub => {

          const subOption =
            document.createElement("option");

          subOption.value =
            sub.id;

          subOption.textContent =
            "— " + sub.name;

          subOption.dataset.type =
            "sub";

          subOption.dataset.parent =
            main.id;

          catSelect.appendChild(subOption);

        }
      );

    }
  );
}


// ============================================================
// NORMALIZE COLOR
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
      Number(
        color.price ?? 0
      ),

    required:
      Boolean(
        color.required
      )

  };
}


// ============================================================
// NORMALIZE SIZE
// ============================================================

function normalizeSize(size) {

  if (!size) {

    return {
      name: "",
      price: 0,
      required: false,
      shipping: null,
      shippingMode: null,
      shippingAmount: 0
    };

  }

  return {

    name:
      size.name ??
      size.label ??
      "",

    price:
      Number(
        size.price ?? 0
      ),

    required:
      Boolean(
        size.required
      ),

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
// NORMALIZE DROPDOWN CHOICES
// ============================================================

function normalizeDropdownChoices(choices) {

  if (!Array.isArray(choices)) {
    return [];
  }

  return choices
    .map(choice => {

      if (
        typeof choice === "string"
      ) {

        return {
          name: choice.trim(),
          price: 0
        };

      }

      if (
        choice &&
        typeof choice === "object"
      ) {

        return {

          name:
            choice.name ??
            choice.label ??
            "",

          price:
            Number(
              choice.price ?? 0
            )

        };

      }

      return null;

    })
    .filter(
      choice =>
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
      Number(
        option.price ?? 0
      ),

    required:
      Boolean(
        option.required
      )

  };

  if (
    normalized.type ===
    "dropdown"
  ) {

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

  const snapshot =
    await getDoc(
      doc(
        db,
        "products",
        id
      )
    );

  if (!snapshot.exists()) {

    alert("Product not found");

    return;
  }

  const product =
    snapshot.data();


  // ----------------------------------------------------------
  // BASIC
  // ----------------------------------------------------------

  if (nameInput) {
    nameInput.value =
      product.name || "";
  }

  if (descInput) {
    descInput.value =
      product.description || "";
  }

  if (priceInput) {
    priceInput.value =
      product.basePrice ?? "";
  }

  if (salePriceInput) {
    salePriceInput.value =
      product.salePrice ?? "";
  }

  if (stockStatus) {

    stockStatus.value =
      product.inStock === false
        ? "false"
        : "true";

  }


  // ----------------------------------------------------------
  // CATEGORY
  // ----------------------------------------------------------

  if (catSelect) {

    catSelect.value =
      product.subCategoryId ||
      product.categoryId ||
      "";

  }


  // ----------------------------------------------------------
  // BESTSELLER
  // ----------------------------------------------------------

  if (bestsellerCheckbox) {

    bestsellerCheckbox.checked =
      Boolean(
        product.isBestseller
      );

  }


  // ----------------------------------------------------------
  // IMAGES
  // ----------------------------------------------------------

  existingImages =
    Array.isArray(product.images)
      ? [...product.images]
      : [];

  newImages = [];


  // ----------------------------------------------------------
  // VARIANTS
  // ----------------------------------------------------------

  colors =
    Array.isArray(
      product.variants?.colors
    )
      ? product.variants.colors.map(
          normalizeColor
        )
      : [];

  sizes =
    Array.isArray(
      product.variants?.sizes
    )
      ? product.variants.sizes.map(
          normalizeSize
        )
      : [];


  // ----------------------------------------------------------
  // SHIPPING
  // ----------------------------------------------------------

  const shipping =
    product.shipping || {};

  const shippingType =
    document.getElementById(
      "shippingType"
    );

  const shippingAmount =
    document.getElementById(
      "shippingAmount"
    );

  if (shippingType) {

    shippingType.value =
      shipping.type ||
      shipping.shippingType ||
      "free";

  }

  if (shippingAmount) {

    shippingAmount.value =
      shipping.amount ??
      shipping.shippingAmount ??
      "";

  }

  updateCommonShippingUI();


  // ----------------------------------------------------------
  // CUSTOM OPTIONS
  // ----------------------------------------------------------

  customOptions =
    Array.isArray(
      product.customOptions
    )
      ? product.customOptions.map(
          normalizeCustomOption
        )
      : [];


  // ----------------------------------------------------------
  // RELATED
  // ----------------------------------------------------------

  relatedDesigns =
    Array.isArray(
      product.relatedDesigns
    )
      ? [...product.relatedDesigns]
      : [];


  // ----------------------------------------------------------
  // TAGS
  // ----------------------------------------------------------

  selectedTags =
    Array.isArray(
      product.tags
    )
      ? [...product.tags]
      : [];


  // ----------------------------------------------------------
  // PAYMENT
  // ----------------------------------------------------------

  const paymentSettings =
    product.paymentSettings || {};

  const online =
    paymentSettings.online || {};

  const cod =
    paymentSettings.cod || {};

  const advance =
    paymentSettings.advance || {};

  if (allowOnline) {

    allowOnline.checked =
      online.enabled ??
      true;

  }

  if (onlineDiscountType) {

    onlineDiscountType.value =
      online.discountType ||
      "none";

  }

  if (onlineDiscountValue) {

    onlineDiscountValue.value =
      online.discountValue ??
      "";

  }

  if (allowCOD) {

    allowCOD.checked =
      cod.enabled ??
      false;

  }

  if (codDiscountType) {

    codDiscountType.value =
      cod.discountType ||
      "none";

  }

  if (codDiscountValue) {

    codDiscountValue.value =
      cod.discountValue ??
      "";

  }

  if (allowAdvance) {

    allowAdvance.checked =
      advance.enabled ??
      false;

  }

  if (advanceDiscountType) {

    advanceDiscountType.value =
      advance.discountType ||
      "none";

  }

  if (advanceDiscountValue) {

    advanceDiscountValue.value =
      advance.discountValue ??
      "";

  }

  if (advanceType) {

    advanceType.value =
      advance.type ||
      "percent";

  }

  if (advanceValue) {

    advanceValue.value =
      advance.value ??
      "";

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
// IMAGE PREVIEW SCROLL
// ============================================================

function setupImagePreviewScrolling() {

  if (!preview) return;


  // Horizontal scrolling
  preview.style.overflowX =
    "auto";

  preview.style.overflowY =
    "hidden";

  preview.style.display =
    "flex";

  preview.style.flexWrap =
    "nowrap";

  preview.style.touchAction =
    "pan-x";

  preview.style.webkitOverflowScrolling =
    "touch";


  // Mouse wheel -> horizontal scroll
  if (!preview.dataset.scrollSetup) {

    preview.addEventListener(
      "wheel",
      event => {

        if (
          preview.scrollWidth <=
          preview.clientWidth
        ) {
          return;
        }

        // Vertical mouse wheel
        // becomes horizontal gallery scroll
        if (
          Math.abs(event.deltaY) >
          Math.abs(event.deltaX)
        ) {

          event.preventDefault();

          preview.scrollLeft +=
            event.deltaY;

        }

      },
      {
        passive: false
      }
    );


    preview.dataset.scrollSetup =
      "true";

  }

}


// ============================================================
// IMAGE PREVIEW
// ============================================================

function renderImagePreview() {

  if (!preview) return;

  setupImagePreviewScrolling();

  preview.innerHTML = "";


  // ----------------------------------------------------------
  // EXISTING IMAGES
  // ----------------------------------------------------------

  existingImages.forEach(
    (url, index) => {

      const card =
        document.createElement("div");

      card.className =
        "image-card";

      card.draggable =
        true;

      card.dataset.type =
        "existing";

      card.dataset.index =
        index;


      const image =
        document.createElement("img");

      image.src =
        url;

      image.draggable =
        false;


      const deleteButton =
        document.createElement("span");

      deleteButton.className =
        "image-delete";

      deleteButton.innerText =
        "×";


      deleteButton.onclick =
        event => {

          event.stopPropagation();

          existingImages.splice(
            index,
            1
          );

          renderImagePreview();

        };


      card.appendChild(image);

      card.appendChild(
        deleteButton
      );


      setupImageDrag(
        card
      );


      preview.appendChild(card);

    }
  );


  // ----------------------------------------------------------
  // NEW IMAGES
  // ----------------------------------------------------------

  newImages.forEach(
    (file, index) => {

      const card =
        document.createElement("div");

      card.className =
        "image-card";

      card.draggable =
        true;

      card.dataset.type =
        "new";

      card.dataset.index =
        index;


      const image =
        document.createElement("img");

      image.src =
        URL.createObjectURL(file);

      image.draggable =
        false;


      const deleteButton =
        document.createElement("span");

      deleteButton.className =
        "image-delete";

      deleteButton.innerText =
        "×";


      deleteButton.onclick =
        event => {

          event.stopPropagation();

          newImages.splice(
            index,
            1
          );

          renderImagePreview();

        };


      card.appendChild(image);

      card.appendChild(
        deleteButton
      );


      setupImageDrag(
        card
      );


      preview.appendChild(card);

    }
  );

}


// ============================================================
// IMAGE DRAG
// FIXED: GLOBAL DRAG STATE
// ============================================================

function setupImageDrag(element) {

  element.addEventListener(
    "dragstart",
    event => {

      activeDrag = {

        kind: "image",

        type:
          element.dataset.type,

        index:
          Number(
            element.dataset.index
          )

      };

      element.classList.add(
        "dragging"
      );


      if (
        event.dataTransfer
      ) {

        event.dataTransfer.effectAllowed =
          "move";

      }

    }
  );


  element.addEventListener(
    "dragend",
    () => {

      element.classList.remove(
        "dragging"
      );

      activeDrag =
        null;

    }
  );


  element.addEventListener(
    "dragover",
    event => {

      event.preventDefault();

      if (
        event.dataTransfer
      ) {

        event.dataTransfer.dropEffect =
          "move";

      }

    }
  );


  element.addEventListener(
    "drop",
    event => {

      event.preventDefault();

      if (
        !activeDrag ||
        activeDrag.kind !==
          "image"
      ) {

        return;

      }


      const targetType =
        element.dataset.type;

      const targetIndex =
        Number(
          element.dataset.index
        );


      reorderImages(
        activeDrag.type,
        activeDrag.index,
        targetType,
        targetIndex
      );


      activeDrag =
        null;

    }
  );

}


// ============================================================
// REORDER IMAGES
// ============================================================

function reorderImages(
  fromType,
  fromIndex,
  toType,
  toIndex
) {

  const combined = [];


  existingImages.forEach(
    (value, index) => {

      combined.push({

        type: "existing",

        index,

        value

      });

    }
  );


  newImages.forEach(
    (value, index) => {

      combined.push({

        type: "new",

        index,

        value

      });

    }
  );


  const fromCombinedIndex =
    combined.findIndex(
      item =>
        item.type === fromType &&
        item.index === fromIndex
    );


  const toCombinedIndex =
    combined.findIndex(
      item =>
        item.type === toType &&
        item.index === toIndex
    );


  if (
    fromCombinedIndex === -1 ||
    toCombinedIndex === -1
  ) {

    return;

  }


  const moved =
    combined.splice(
      fromCombinedIndex,
      1
    )[0];


  let insertIndex =
    toCombinedIndex;


  if (
    fromCombinedIndex <
    toCombinedIndex
  ) {

    insertIndex--;

  }


  combined.splice(
    insertIndex + 1,
    0,
    moved
  );


  existingImages =
    combined
      .filter(
        item =>
          item.type ===
          "existing"
      )
      .map(
        item =>
          item.value
      );


  newImages =
    combined
      .filter(
        item =>
          item.type ===
          "new"
      )
      .map(
        item =>
          item.value
      );


  renderImagePreview();
}


// ============================================================
// NEW IMAGE INPUT
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
            file.type.startsWith(
              "image/"
            )
          ) {

            newImages.push(file);

          }

        }
      );


      newImagesInput.value =
        "";


      renderImagePreview();

    }
  );

}


// ============================================================
// COLORS
// ============================================================

window.addColor =
  function() {

    const name =
      document
        .getElementById("colorName")
        .value
        .trim();


    const price =
      Math.max(
        0,
        Number(
          document.getElementById(
            "colorPrice"
          ).value || 0
        )
      );


    const required =
      document.getElementById(
        "colorRequired"
      ).checked;


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

      price,

      required

    });


    renderColors();


    document.getElementById(
      "colorName"
    ).value = "";


    document.getElementById(
      "colorPrice"
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
      "colorList"
    );

  if (!list) return;

  list.innerHTML = "";


  colors.forEach(
    (color, index) => {

      const div =
        document.createElement(
          "div"
        );


      div.className =
        "variant-item";

      div.draggable =
        true;

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
      ).onclick =
        () =>
          editColor(index);


      div.querySelector(
        "[data-delete]"
      ).onclick =
        () => {

          colors.splice(
            index,
            1
          );

          renderColors();

        };


      setupVariantDrag(
        div,
        "colors",
        index
      );


      list.appendChild(div);

    }
  );

}


// ============================================================
// EDIT COLOR
// Uses SAME edit CSS class as variants
// ============================================================

function editColor(index) {

  const color =
    colors[index];

  if (!color) return;


  const list =
    document.getElementById(
      "colorList"
    );


  const old =
    list.children[index];


  const div =
    document.createElement(
      "div"
    );


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
      min="0"
      placeholder="Extra price"
    >


    <label>

      <input
        type="checkbox"
        class="edit-required"
        ${
          color.required
            ? "checked"
            : ""
        }
      >

      Required

    </label>


    <div class="variant-edit-actions">

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

    </div>

  `;


  if (old) {

    old.replaceWith(div);

  }


  div.querySelector(
    ".save-btn"
  ).onclick =
    () => {

      const name =
        div.querySelector(
          ".edit-name"
        ).value.trim();


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
  ).onclick =
    () =>
      renderColors();

}


// ============================================================
// SIZES
// ============================================================

window.addSize =
  function() {

    const name =
      document
        .getElementById("sizeName")
        .value
        .trim();


    const price =
      Math.max(
        0,
        Number(
          document.getElementById(
            "sizePrice"
          ).value || 0
        )
      );


    const required =
      document.getElementById(
        "sizeRequired"
      ).checked;


    const shippingMode =
      document.getElementById(
        "sizeShippingType"
      ).value;


    const shippingAmount =
      Math.max(
        0,
        Number(
          document.getElementById(
            "sizeShippingAmount"
          ).value || 0
        )
      );


    if (!name) {

      showPopup(
        "⚠ Enter size"
      );

      setTimeout(
        hidePopup,
        1200
      );

      return;

    }


    sizes.push({

      name,

      price,

      required,

      shippingMode,

      shippingAmount

    });


    renderSizes();


    document.getElementById(
      "sizeName"
    ).value = "";


    document.getElementById(
      "sizePrice"
    ).value = "";


    document.getElementById(
      "sizeRequired"
    ).checked = false;


    document.getElementById(
      "sizeShippingType"
    ).value =
      "common";


    document.getElementById(
      "sizeShippingAmount"
    ).value = "";


    updateSizeShippingUI();

  };


// ============================================================
// RENDER SIZES
// ============================================================

function renderSizes() {

  const list =
    document.getElementById(
      "sizeList"
    );


  if (!list) return;

  list.innerHTML = "";


  sizes.forEach(
    (size, index) => {

      const div =
        document.createElement(
          "div"
        );


      div.className =
        "variant-item";

      div.draggable =
        true;

      div.dataset.index =
        index;


      let shippingText =
        "Common Shipping";


      if (
        size.shippingMode ===
        "free"
      ) {

        shippingText =
          "Free Shipping";

      }


      if (
        size.shippingMode ===
        "paid"
      ) {

        shippingText =
          `Shipping ₹${Number(
            size.shippingAmount || 0
          )}`;

      }


      div.innerHTML = `

        <div class="variant-info">

          <strong>
            ${escapeHTML(size.name)}
          </strong>

          <span>
            +₹${Number(size.price || 0)}
          </span>

          <small>
            ${escapeHTML(shippingText)}
          </small>

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
      ).onclick =
        () =>
          editSize(index);


      div.querySelector(
        "[data-delete]"
      ).onclick =
        () => {

          sizes.splice(
            index,
            1
          );

          renderSizes();

        };


      setupVariantDrag(
        div,
        "sizes",
        index
      );


      list.appendChild(div);

    }
  );

}


// ============================================================
// EDIT SIZE
// SAME VARIANT EDIT CLASS
// ============================================================

function editSize(index) {

  const size =
    sizes[index];

  if (!size) return;


  const list =
    document.getElementById(
      "sizeList"
    );


  const old =
    list.children[index];


  const div =
    document.createElement(
      "div"
    );


  div.className =
    "variant-edit-form";


  div.innerHTML = `

    <input
      type="text"
      class="edit-name"
      value="${escapeHTML(size.name)}"
      placeholder="Size"
    >


    <input
      type="number"
      class="edit-price"
      value="${Number(size.price || 0)}"
      min="0"
      placeholder="Extra price"
    >


    <label>
      Shipping for this Size
    </label>


    <select class="edit-shipping-type">

      <option value="common">
        Use Common Shipping
      </option>

      <option value="free">
        Free Shipping
      </option>

      <option value="paid">
        Custom Shipping Amount
      </option>

    </select>


    <input
      type="number"
      class="edit-shipping-amount"
      min="0"
      placeholder="Shipping Amount"
    >


    <label>

      <input
        type="checkbox"
        class="edit-required"
        ${
          size.required
            ? "checked"
            : ""
        }
      >

      Required

    </label>


    <div class="variant-edit-actions">

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

    </div>

  `;


  if (old) {

    old.replaceWith(div);

  }


  const shippingType =
    div.querySelector(
      ".edit-shipping-type"
    );


  const shippingAmount =
    div.querySelector(
      ".edit-shipping-amount"
    );


  shippingType.value =
    size.shippingMode ||
    "common";


  shippingAmount.value =
    size.shippingAmount || "";


  function updateEditShippingUI() {

    shippingAmount.style.display =
      shippingType.value ===
      "paid"
        ? ""
        : "none";

  }


  shippingType.addEventListener(
    "change",
    updateEditShippingUI
  );


  updateEditShippingUI();


  div.querySelector(
    ".save-btn"
  ).onclick =
    () => {

      const name =
        div.querySelector(
          ".edit-name"
        ).value.trim();


      if (!name) {

        showPopup(
          "⚠ Enter size"
        );

        setTimeout(
          hidePopup,
          1200
        );

        return;

      }


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

        shippingMode:
          shippingType.value,

        shippingAmount:
          Math.max(
            0,
            Number(
              shippingAmount.value ||
              0
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
  ).onclick =
    () =>
      renderSizes();

}


// ============================================================
// VARIANT DRAG
// FIXED GLOBAL DRAG
// ============================================================

function setupVariantDrag(
  element,
  arrayName,
  index
) {

  element.addEventListener(
    "dragstart",
    event => {

      activeDrag = {

        kind: "variant",

        arrayName,

        index

      };


      element.classList.add(
        "dragging"
      );


      if (
        event.dataTransfer
      ) {

        event.dataTransfer.effectAllowed =
          "move";

      }

    }
  );


  element.addEventListener(
    "dragend",
    () => {

      element.classList.remove(
        "dragging"
      );

      activeDrag =
        null;

    }
  );


  element.addEventListener(
    "dragover",
    event => {

      event.preventDefault();

      if (
        event.dataTransfer
      ) {

        event.dataTransfer.dropEffect =
          "move";

      }

    }
  );


  element.addEventListener(
    "drop",
    event => {

      event.preventDefault();

      if (
        !activeDrag ||
        activeDrag.kind !==
          "variant"
      ) {

        return;

      }


      if (
        activeDrag.arrayName !==
        arrayName
      ) {

        return;

      }


      const fromIndex =
        activeDrag.index;


      const targetIndex =
        Number(
          element.dataset.index
        );


      if (
        fromIndex === targetIndex
      ) {

        activeDrag =
          null;

        return;

      }


      let array;


      if (
        arrayName ===
        "colors"
      ) {

        array =
          colors;

      } else if (
        arrayName ===
        "sizes"
      ) {

        array =
          sizes;

      } else if (
        arrayName ===
        "customOptions"
      ) {

        array =
          customOptions;

      }


      if (!array) {

        activeDrag =
          null;

        return;

      }


      const moved =
        array.splice(
          fromIndex,
          1
        )[0];


      array.splice(
        targetIndex,
        0,
        moved
      );


      activeDrag =
        null;


      if (
        arrayName ===
        "colors"
      ) {

        renderColors();

      } else if (
        arrayName ===
        "sizes"
      ) {

        renderSizes();

      } else if (
        arrayName ===
        "customOptions"
      ) {

        renderCustomOptions();

      }

    }
  );

}


// ============================================================
// CUSTOM OPTION CHOICE HELPERS
// ============================================================

function parseChoiceNames(value) {

  return String(value || "")
    .split(",")
    .map(
      item =>
        item.trim()
    )
    .filter(Boolean);

}


// ============================================================
// RENDER ADD CHOICE PRICE INPUTS
// ============================================================

function renderAddChoicePriceInputs() {

  const input =
    document.getElementById(
      "customChoices"
    );


  const editor =
    document.getElementById(
      "customChoicePrices"
    );


  if (!input || !editor)
    return;


  const names =
    parseChoiceNames(
      input.value
    );


  const previous = {};


  editor
    .querySelectorAll(
      ".custom-choice-price-row"
    )
    .forEach(
      row => {

        const name =
          row.dataset.name;


        const price =
          row.querySelector(
            "input"
          )?.value;


        if (name) {

          previous[name] =
            Number(
              price || 0
            );

        }

      }
    );


  editor.innerHTML = "";


  if (!names.length) {

    editor.style.display =
      "none";

    return;

  }


  editor.style.display =
    "block";


  names.forEach(
    name => {

      const row =
        document.createElement(
          "div"
        );


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


      const inputPrice =
        document.createElement(
          "input"
        );


      inputPrice.type =
        "number";

      inputPrice.min =
        "0";

      inputPrice.placeholder =
        "Price";

      inputPrice.value =
        previous[name] ?? 0;


      row.appendChild(label);

      row.appendChild(
        inputPrice
      );

      editor.appendChild(row);

    }
  );

}


// ============================================================
// READ CHOICE PRICES
// ============================================================

function getChoicePriceData() {

  const input =
    document.getElementById(
      "customChoices"
    );


  const editor =
    document.getElementById(
      "customChoicePrices"
    );


  const names =
    parseChoiceNames(
      input?.value || ""
    );


  return names.map(
    (name, index) => {

      const row =
        editor?.querySelectorAll(
          ".custom-choice-price-row"
        )?.[index];


      const price =
        Number(
          row?.querySelector(
            "input"
          )?.value || 0
        );


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
// CUSTOM OPTION FORM
// ============================================================

function updateCustomOptionForm() {

  const type =
    document.getElementById(
      "customType"
    )?.value;


  const price =
    document.getElementById(
      "customPrice"
    );


  const choices =
    document.getElementById(
      "customChoices"
    );


  const choicePrices =
    document.getElementById(
      "customChoicePrices"
    );


  if (!type) return;


  if (
    type ===
    "dropdown"
  ) {

    if (price) {

      price.style.display =
        "none";

      price.disabled =
        true;

    }


    if (choices) {

      choices.style.display =
        "block";

    }


    renderAddChoicePriceInputs();

  } else {

    if (price) {

      price.style.display =
        "";

      price.disabled =
        false;

    }


    if (choices) {

      choices.style.display =
        "none";

    }


    if (choicePrices) {

      choicePrices.style.display =
        "none";

    }

  }

}


// ============================================================
// CUSTOM OPTION EVENTS
// ============================================================

const customType =
  document.getElementById(
    "customType"
  );

const customChoices =
  document.getElementById(
    "customChoices"
  );


if (customType) {

  customType.addEventListener(
    "change",
    updateCustomOptionForm
  );

}


if (customChoices) {

  customChoices.addEventListener(
    "input",
    renderAddChoicePriceInputs
  );

}


// ============================================================
// ADD CUSTOM OPTION
// ============================================================

window.addCustomOption =
  function() {

    const type =
      document.getElementById(
        "customType"
      ).value;


    const label =
      document.getElementById(
        "customLabel"
      ).value.trim();


    const price =
      Math.max(
        0,
        Number(
          document.getElementById(
            "customPrice"
          ).value || 0
        )
      );


    const required =
      document.getElementById(
        "customRequired"
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


    if (
      type ===
      "dropdown"
    ) {

      const choices =
        getChoicePriceData();


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

    } else {

      customOptions.push({

        type,

        label,

        price,

        required

      });

    }


    renderCustomOptions();


    document.getElementById(
      "customLabel"
    ).value = "";


    document.getElementById(
      "customPrice"
    ).value = "";


    document.getElementById(
      "customChoices"
    ).value = "";


    document.getElementById(
      "customRequired"
    ).checked = false;


    renderAddChoicePriceInputs();

  };


// ============================================================
// RENDER CUSTOM OPTIONS
// NOW USES variant-item
// ============================================================

function renderCustomOptions() {

  const list =
    document.getElementById(
      "customList"
    );


  if (!list) return;


  list.innerHTML = "";


  customOptions.forEach(
    (rawOption, index) => {

      const option =
        normalizeCustomOption(
          rawOption
        );


      customOptions[index] =
        option;


      const div =
        document.createElement(
          "div"
        );


      // IMPORTANT:
      // Same class as variants
      div.className =
        "variant-item";


      div.draggable =
        true;

      div.dataset.index =
        index;


      let details =
        "";


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

                    <span>
                      ${escapeHTML(
                        choice.name
                      )}
                    </span>

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

        <div class="variant-info">

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


          ${details}

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
      ).onclick =
        () =>
          editCustomOption(index);


      div.querySelector(
        "[data-delete]"
      ).onclick =
        () => {

          customOptions.splice(
            index,
            1
          );

          renderCustomOptions();

        };


      setupVariantDrag(
        div,
        "customOptions",
        index
      );


      list.appendChild(div);

    }
  );

}


// ============================================================
// EDIT CUSTOM OPTION
// SAME variant-edit-form CLASS
// ============================================================

function editCustomOption(index) {

  const option =
    normalizeCustomOption(
      customOptions[index]
    );


  if (!option) return;


  const list =
    document.getElementById(
      "customList"
    );


  const old =
    list.children[index];


  const div =
    document.createElement(
      "div"
    );


  // IMPORTANT:
  // Use the same edit class as variants
  div.className =
    "variant-edit-form";


  const choices =
    option.type ===
    "dropdown"

      ? normalizeDropdownChoices(
          option.choices
        )

      : [];


  div.innerHTML = `

    <select
      class="edit-option-type"
    >

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
      type="text"
      class="edit-option-label"
      placeholder="Option label"
      value="${escapeHTML(
        option.label
      )}"
    >


    <input
      type="number"
      class="edit-option-price"
      min="0"
      placeholder="Extra price"
      value="${Number(
        option.price || 0
      )}"
    >


    <input
      type="text"
      class="edit-option-choices"
      placeholder="Dropdown choices (comma separated)"
      value="${escapeHTML(
        choices
          .map(
            choice =>
              choice.name
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


    <div class="variant-edit-actions">

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
  // CHOICE PRICE RENDERER
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


    const previous = {};


    // Preserve current editor values
    choiceEditor
      .querySelectorAll(
        ".custom-choice-price-row"
      )
      .forEach(
        row => {

          const name =
            row.dataset.name;


          const value =
            row.querySelector(
              "input"
            )?.value;


          if (name) {

            previous[name] =
              Number(
                value || 0
              );

          }

        }
      );


    // On first render use saved prices
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


    if (!names.length) {

      choiceEditor.style.display =
        "none";

      return;

    }


    choiceEditor.style.display =
      "block";


    names.forEach(
      name => {

        const row =
          document.createElement(
            "div"
          );


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


        const input =
          document.createElement(
            "input"
          );


        input.type =
          "number";

        input.min =
          "0";

        input.placeholder =
          "Price";

        input.value =
          previous[name] ?? 0;


        row.appendChild(label);

        row.appendChild(input);

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
  // SAVE CUSTOM OPTION
  // ----------------------------------------------------------

  div.querySelector(
    ".save-custom"
  ).onclick =
    () => {

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

              const input =
                rows[
                  choiceIndex
                ]?.querySelector(
                  "input"
                );


              return {

                name,

                price:
                  Math.max(
                    0,
                    Number(
                      input?.value ||
                      0
                    )
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

      } else {

        customOptions[index] = {

          type,

          label,

          price:
            Math.max(
              0,
              Number(
                priceInput.value ||
                0
              )
            ),

          required

        };

      }


      renderCustomOptions();

    };


  div.querySelector(
    ".cancel-custom"
  ).onclick =
    () =>
      renderCustomOptions();

}


// ============================================================
// RELATED PRODUCTS
// ============================================================

async function loadDesignProducts() {

  const snapshot =
    await getDocs(
      collection(
        db,
        "products"
      )
    );


  allProducts = [];


  snapshot.forEach(
    documentSnapshot => {

      allProducts.push({

        id:
          documentSnapshot.id,

        ...documentSnapshot.data()

      });

    }
  );


  renderDesignList(
    allProducts
  );

}


// ============================================================
// RENDER RELATED PRODUCTS
// ============================================================

function renderDesignList(products) {

  const box =
    document.getElementById(
      "designList"
    );


  if (!box) return;


  box.innerHTML = "";


  products.forEach(
    product => {

      if (
        product.id === id
      ) {

        return;

      }


      const row =
        document.createElement(
          "div"
        );


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
            product.images?.[0] ||
            ""
          )}"
        >


        <span>
          ${escapeHTML(
            product.name ||
            ""
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
// TOGGLE RELATED DESIGN
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
// FILTER RELATED PRODUCTS
// ============================================================

window.filterDesigns =
  function() {

    const input =
      document.getElementById(
        "designSearch"
      );


    const search =
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
            product.name ||
            ""
          )
            .toLowerCase()
            .includes(search)
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


  const snapshot =
    await getDocs(
      collection(
        db,
        "tags"
      )
    );


  box.innerHTML =
    "";


  snapshot.forEach(
    documentSnapshot => {

      const tag =
        documentSnapshot.data();


      const row =
        document.createElement(
          "div"
        );


      row.className =
        "tag-item";


      const checked =
        selectedTags.includes(
          tag.slug
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
            tag.name ||
            ""
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
            tag.slug,
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
// SHIPPING UI
// ============================================================

function updateCommonShippingUI() {

  const type =
    document.getElementById(
      "shippingType"
    )?.value;


  const box =
    document.getElementById(
      "commonShippingAmountBox"
    );


  const amount =
    document.getElementById(
      "shippingAmount"
    );


  if (!box || !amount)
    return;


  if (type === "paid") {

    box.style.display =
      "block";

  } else {

    box.style.display =
      "none";

    amount.value =
      "";

  }

}


// ============================================================
// SIZE SHIPPING UI
// ============================================================

function updateSizeShippingUI() {

  const type =
    document.getElementById(
      "sizeShippingType"
    )?.value;


  const box =
    document.getElementById(
      "sizeShippingAmountBox"
    );


  if (!box) return;


  box.classList.toggle(
    "hidden",
    type !== "paid"
  );

}


// ============================================================
// SHIPPING EVENTS
// ============================================================

const shippingType =
  document.getElementById(
    "shippingType"
  );


if (shippingType) {

  shippingType.addEventListener(
    "change",
    updateCommonShippingUI
  );

}


const sizeShippingType =
  document.getElementById(
    "sizeShippingType"
  );


if (sizeShippingType) {

  sizeShippingType.addEventListener(
    "change",
    updateSizeShippingUI
  );

}


// ============================================================
// GALLERY
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


    gallerySelected =
      [];


    loadGalleryFolder(
      "product-images"
    );

  };


// ============================================================
// LOAD GALLERY FOLDER
// ============================================================

async function loadGalleryFolder(path) {

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


  grid.innerHTML =
    "";


  try {

    const folderRef =
      ref(
        storage,
        path
      );


    const result =
      await listAll(
        folderRef
      );


    // --------------------------------------------------------
    // FOLDERS
    // --------------------------------------------------------

    result.prefixes.forEach(
      folder => {

        const div =
          document.createElement(
            "div"
          );


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
          () =>
            loadGalleryFolder(
              folder.fullPath
            );


        grid.appendChild(div);

      }
    );


    // --------------------------------------------------------
    // IMAGES
    // --------------------------------------------------------

    for (
      const file of result.items
    ) {

      const url =
        await getDownloadURL(
          file
        );


      const div =
        document.createElement(
          "div"
        );


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
          src="${escapeHTML(url)}"
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
                item =>
                  item !== url
              );

          }

        };


      grid.appendChild(div);

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
// GALLERY BREADCRUMBS
// ============================================================

function updateGalleryBreadcrumbs(path) {

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
    () =>
      loadGalleryFolder(
        "product-images"
      );


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
        () =>
          loadGalleryFolder(
            pathCopy
          );


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
// ADD GALLERY IMAGES
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


    gallerySelected =
      [];


    renderImagePreview();


    closeGalleryPicker();

  };


// ============================================================
// UPDATE PRODUCT
// ============================================================

window.updateProduct =
  async function() {

    if (!id) {

      showPopup(
        "❌ Product ID missing"
      );

      return;

    }


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
      bestsellerCheckbox?.checked ||
      false;


    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (
      !name ||
      price <= 0 ||
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


    // --------------------------------------------------------
    // VALIDATE DROPDOWNS
    // --------------------------------------------------------

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


        option.price =
          0;

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
      // SHIPPING
      // ------------------------------------------------------

      const finalShippingType =
        document.getElementById(
          "shippingType"
        ).value;


      const finalShippingAmount =
        Math.max(
          0,
          Number(
            document.getElementById(
              "shippingAmount"
            ).value || 0
          )
        );


      const shipping = {

        type:
          finalShippingType,

        amount:
          finalShippingType ===
          "paid"

            ? finalShippingAmount

            : 0

      };


      // ------------------------------------------------------
      // PAYMENT
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
      // OLD RELATED PRODUCTS
      // ------------------------------------------------------

      const oldProductSnapshot =
        await getDoc(
          doc(
            db,
            "products",
            id
          )
        );


      const oldProductData =
        oldProductSnapshot.exists()
          ? oldProductSnapshot.data()
          : {};


      const oldRelatedDesigns =
        Array.isArray(
          oldProductData.relatedDesigns
        )
          ? [
              ...oldProductData.relatedDesigns
            ]
          : [];


      // ------------------------------------------------------
      // SAVE PRODUCT
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
            stockStatus.value ===
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
              normalizeCustomOption
            ),

          shipping,

          paymentSettings,

          relatedDesigns:
            relatedDesigns.filter(
              productId =>
                productId !== id
            ),

          tags:
            selectedTags,

          isBestseller

        }
      );


      // ======================================================
      // BIDIRECTIONAL RELATED PRODUCTS
      // ======================================================

      // ------------------------------------------------------
      // ADD NEW LINKS
      // ------------------------------------------------------

      for (
        const relatedId of
          relatedDesigns
      ) {

        if (
          relatedId === id
        ) {

          continue;

        }


        const relatedRef =
          doc(
            db,
            "products",
            relatedId
          );


        const relatedSnapshot =
          await getDoc(
            relatedRef
          );


        if (
          !relatedSnapshot.exists()
        ) {

          continue;

        }


        const relatedData =
          relatedSnapshot.data();


        const relatedArray =
          Array.isArray(
            relatedData.relatedDesigns
          )
            ? [
                ...relatedData.relatedDesigns
              ]
            : [];


        if (
          !relatedArray.includes(id)
        ) {

          relatedArray.push(id);


          await updateDoc(
            relatedRef,
            {

              relatedDesigns:
                relatedArray

            }
          );

        }

      }


      // ------------------------------------------------------
      // REMOVE OLD LINKS
      // ------------------------------------------------------

      for (
        const oldRelatedId of
          oldRelatedDesigns
      ) {

        if (
          relatedDesigns.includes(
            oldRelatedId
          )
        ) {

          continue;

        }


        const relatedRef =
          doc(
            db,
            "products",
            oldRelatedId
          );


        const relatedSnapshot =
          await getDoc(
            relatedRef
          );


        if (
          !relatedSnapshot.exists()
        ) {

          continue;

        }


        const relatedData =
          relatedSnapshot.data();


        const relatedArray =
          Array.isArray(
            relatedData.relatedDesigns
          )
            ? [
                ...relatedData.relatedDesigns
              ]
            : [];


        const cleaned =
          relatedArray.filter(
            value =>
              value !== id
          );


        if (
          cleaned.length !==
          relatedArray.length
        ) {

          await updateDoc(
            relatedRef,
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
        "✅ Product updated successfully"
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


    updateCustomOptionForm();

    updateSizeShippingUI();

    updateCommonShippingUI();

    setupImagePreviewScrolling();

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