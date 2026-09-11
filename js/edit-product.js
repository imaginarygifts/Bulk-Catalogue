/* ==================================================
   EDIT PRODUCT
   SAME SYSTEM AS ADD PRODUCT
================================================== */

import {
  db,
  storage
} from "./firebase.js";

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


/* ==================================================
   PRODUCT ID
================================================== */

const params =
  new URLSearchParams(
    window.location.search
  );

const id =
  params.get("id");


if (!id) {

  alert(
    "Product ID missing"
  );

}


/* ==================================================
   INPUTS
================================================== */

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
  document.getElementById(
    "onlineDiscountType"
  );

const onlineDiscountValue =
  document.getElementById(
    "onlineDiscountValue"
  );

const codDiscountType =
  document.getElementById(
    "codDiscountType"
  );

const codDiscountValue =
  document.getElementById(
    "codDiscountValue"
  );

const advanceDiscountType =
  document.getElementById(
    "advanceDiscountType"
  );

const advanceDiscountValue =
  document.getElementById(
    "advanceDiscountValue"
  );

const advanceType =
  document.getElementById(
    "advanceType"
  );

const advanceValue =
  document.getElementById(
    "advanceValue"
  );

const bestsellerCheckbox =
  document.getElementById(
    "isBestseller"
  );


/* ==================================================
   STATE
================================================== */

let existingImages = [];

let newImages = [];

let colors = [];

let sizes = [];

let customOptions = [];

let relatedDesigns = [];

let allProducts = [];

let selectedTags = [];

let gallerySelected = [];

let draggedImageIndex =
  null;

const galleryBreadcrumbs =
  document.getElementById(
    "galleryBreadcrumbs"
  );


/* ==================================================
   POPUP
================================================== */

function showPopup(message) {

  const popup =
    document.getElementById(
      "popup"
    );

  if (!popup) return;

  popup.innerText =
    message;

  popup.classList.remove(
    "hidden"
  );

}


function hidePopup() {

  document
    .getElementById("popup")
    ?.classList.add(
      "hidden"
    );

}


/* ==================================================
   ACCORDION
================================================== */

window.toggleSection =
function(sectionId) {

  document
    .getElementById(sectionId)
    ?.classList.toggle(
      "hidden"
    );

};


/* ==================================================
   ESCAPE HTML
================================================== */

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


/* ==================================================
   ESCAPE ATTRIBUTE
================================================== */

function escapeAttribute(value) {

  return escapeHtml(
    value
  );

}


/* ==================================================
   NORMALIZE DROPDOWN CHOICE
================================================== */

function normalizeDropdownChoice(
  choice
) {

  if (
    choice &&
    typeof choice === "object"
  ) {

    return {

      name:
        String(
          choice.name ??
          choice.label ??
          choice.value ??
          ""
        ).trim(),

      price:
        Number(
          choice.price || 0
        )

    };

  }


  return {

    name:
      String(
        choice ?? ""
      ).trim(),

    price:
      0

  };

}


/* ==================================================
   NORMALIZE CUSTOM OPTION
================================================== */

function normalizeCustomOption(
  option
) {

  const normalized = {

    type:
      option?.type ||
      "text",

    label:
      String(
        option?.label ||
        ""
      ).trim(),

    price:
      Number(
        option?.price || 0
      ),

    required:
      Boolean(
        option?.required
      )

  };


  if (
    normalized.type ===
    "dropdown"
  ) {

    normalized.choices =
      Array.isArray(
        option?.choices
      )

      ?

      option.choices
        .map(
          normalizeDropdownChoice
        )
        .filter(
          choice =>
            choice.name
        )

      :

      [];

  }


  return normalized;

}


/* ==================================================
   LOAD CATEGORIES
================================================== */

async function loadCategories() {

  if (!catSelect) return;


  catSelect.innerHTML = `

    <option value="">
      Select category
    </option>

  `;


  try {

    const snap =
      await getDocs(
        query(
          collection(
            db,
            "categories"
          ),
          orderBy("order")
        )
      );


    const categories = [];


    snap.forEach(
      categoryDoc => {

        categories.push({

          id:
            categoryDoc.id,

          ...categoryDoc.data()

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
          document.createElement(
            "option"
          );


        option.value =
          main.id;

        option.textContent =
          main.name;

        option.dataset.type =
          "main";


        catSelect.appendChild(
          option
        );


        const subs =
          categories.filter(
            sub =>
              sub.parentId ===
              main.id
          );


        subs.forEach(
          sub => {

            const subOption =
              document.createElement(
                "option"
              );


            subOption.value =
              sub.id;

            subOption.textContent =
              "— " +
              sub.name;

            subOption.dataset.type =
              "sub";

            subOption.dataset.parent =
              main.id;


            catSelect.appendChild(
              subOption
            );

          }
        );

      }
    );

  }

  catch(error) {

    console.error(
      "Category loading error:",
      error
    );

  }

}


/* ==================================================
   LOAD PRODUCT
================================================== */

async function loadProduct() {

  if (!id) return;


  try {

    const snap =
      await getDoc(
        doc(
          db,
          "products",
          id
        )
      );


    if (
      !snap.exists()
    ) {

      alert(
        "Product not found"
      );

      return;

    }


    const p =
      snap.data();


    /* BASIC */

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
        ?
        "false"
        :
        "true";

    }


    catSelect.value =
      p.subCategoryId ||
      p.categoryId ||
      "";


    /* IMAGES */

    existingImages =
      Array.isArray(p.images)
      ?
      [...p.images]
      :
      [];


    newImages = [];


    /* VARIANTS */

    colors =
      Array.isArray(
        p.variants?.colors
      )

      ?

      p.variants.colors.map(
        color => ({

          name:
            color.name || "",

          price:
            Number(
              color.price || 0
            ),

          required:
            Boolean(
              color.required
            )

        })
      )

      :

      [];


    sizes =
      Array.isArray(
        p.variants?.sizes
      )

      ?

      p.variants.sizes.map(
        size => ({

          name:
            size.name || "",

          price:
            Number(
              size.price || 0
            ),

          required:
            Boolean(
              size.required
            )

        })
      )

      :

      [];


    /* CUSTOM OPTIONS */

    customOptions =
      Array.isArray(
        p.customOptions
      )

      ?

      p.customOptions.map(
        normalizeCustomOption
      )

      :

      [];


    /* RELATED */

    relatedDesigns =
      Array.isArray(
        p.relatedDesigns
      )

      ?

      [...p.relatedDesigns]

      :

      [];


    /* TAGS */

    selectedTags =
      Array.isArray(
        p.tags
      )

      ?

      [...p.tags]

      :

      [];


    /* BESTSELLER */

    if (
      bestsellerCheckbox
    ) {

      bestsellerCheckbox.checked =
        Boolean(
          p.isBestseller
        );

    }


    /* PAYMENT */

    const ps =
      p.paymentSettings ||
      {};


    if (ps.online) {

      allowOnline.checked =
        ps.online.enabled ??
        true;

      onlineDiscountType.value =
        ps.online.discountType ||
        "none";

      onlineDiscountValue.value =
        ps.online.discountValue ??
        "";

    }

    else {

      allowOnline.checked =
        true;

    }


    if (ps.cod) {

      allowCOD.checked =
        ps.cod.enabled ??
        false;

      codDiscountType.value =
        ps.cod.discountType ||
        "none";

      codDiscountValue.value =
        ps.cod.discountValue ??
        "";

    }


    if (ps.advance) {

      allowAdvance.checked =
        ps.advance.enabled ??
        false;

      advanceDiscountType.value =
        ps.advance.discountType ||
        "none";

      advanceDiscountValue.value =
        ps.advance.discountValue ??
        "";

      advanceType.value =
        ps.advance.type ||
        "percent";

      advanceValue.value =
        ps.advance.value ??
        "";

    }


    /* RENDER */

    renderImagePreview();

    renderColors();

    renderSizes();

    renderCustomOptions();

    await loadDesignProducts();

    await loadTags();


    console.log(
      "Edit product loaded:",
      p
    );

  }

  catch(error) {

    console.error(
      "Product loading error:",
      error
    );

    showPopup(
      "❌ " +
      (
        error.message ||
        "Unable to load product"
      )
    );

  }

}


/* ==================================================
   IMAGE PREVIEW
================================================== */

function renderImagePreview() {

  if (!preview) return;


  preview.innerHTML =
    "";


  /* EXISTING */

  existingImages.forEach(
    (url, index) => {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "image-card";


      card.draggable =
        true;


      card.dataset.index =
        index;


      const img =
        document.createElement(
          "img"
        );


      img.src =
        url;

      img.alt =
        "Product image";


      const deleteButton =
        document.createElement(
          "span"
        );


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


      card.appendChild(
        img
      );

      card.appendChild(
        deleteButton
      );


      /* DRAG START */

      card.addEventListener(
        "dragstart",
        () => {

          draggedImageIndex =
            index;

          card.classList.add(
            "dragging"
          );

        }
      );


      card.addEventListener(
        "dragend",
        () => {

          draggedImageIndex =
            null;

          card.classList.remove(
            "dragging"
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

          event.stopPropagation();


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
            existingImages.splice(
              draggedImageIndex,
              1
            )[0];


          existingImages.splice(
            targetIndex,
            0,
            moved
          );


          renderImagePreview();

        }
      );


      preview.appendChild(
        card
      );

    }
  );


  /* NEW */

  newImages.forEach(
    (file, index) => {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "image-card new-image-card";


      card.draggable =
        true;


      const img =
        document.createElement(
          "img"
        );


      img.src =
        URL.createObjectURL(
          file
        );


      img.alt =
        file.name;


      const deleteButton =
        document.createElement(
          "span"
        );


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


      card.appendChild(
        img
      );

      card.appendChild(
        deleteButton
      );


      preview.appendChild(
        card
      );

    }
  );

}


/* ==================================================
   NEW IMAGE UPLOAD
================================================== */

if (newImagesInput) {

  newImagesInput.addEventListener(
    "change",
    () => {

      const files =
        Array.from(
          newImagesInput.files ||
          []
        );


      files.forEach(
        file => {

          newImages.push(
            file
          );

        }
      );


      newImagesInput.value =
        "";


      renderImagePreview();

    }
  );

}


/* ==================================================
   COLORS
================================================== */

window.addEditColor =
function() {

  const nameInput =
    document.getElementById(
      "editColorName"
    );

  const priceInput =
    document.getElementById(
      "editColorPrice"
    );

  const requiredInput =
    document.getElementById(
      "colorRequired"
    );


  const name =
    nameInput.value.trim();


  const price =
    Number(
      priceInput.value || 0
    );


  const required =
    requiredInput?.checked ||
    false;


  if (!name) {

    showPopup(
      "Enter color name"
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


  nameInput.value =
    "";

  priceInput.value =
    "";

  requiredInput.checked =
    false;

};


function renderColors() {

  const list =
    document.getElementById(
      "editColorList"
    );


  if (!list) return;


  list.innerHTML =
    "";


  colors.forEach(
    (color, index) => {

      const item =
        document.createElement(
          "div"
        );


      item.className =
        "variant-item";


      item.innerHTML = `

        <div>

          <strong>
            ${escapeHtml(
              color.name
            )}
          </strong>

          <small>

            ${
              Number(
                color.price || 0
              ) > 0

              ?

              `+₹${Number(
                color.price || 0
              )}`

              :

              "No extra price"

            }

            ${
              color.required
              ?
              " • Required"
              :
              ""
            }

          </small>

        </div>


        <div>

          <button
            type="button"
            class="btn-outline"
            data-edit="${index}"
          >
            Edit
          </button>

          <button
            type="button"
            class="btn-outline"
            data-delete="${index}"
          >
            ×
          </button>

        </div>

      `;


      item
        .querySelector(
          "[data-delete]"
        )
        ?.addEventListener(
          "click",
          () => {

            colors.splice(
              index,
              1
            );

            renderColors();

          }
        );


      item
        .querySelector(
          "[data-edit]"
        )
        ?.addEventListener(
          "click",
          () => {

            editColor(index);

          }
        );


      list.appendChild(
        item
      );

    }
  );

}


/* ==================================================
   EDIT COLOR
================================================== */

function editColor(index) {

  const color =
    colors[index];


  if (!color) return;


  const list =
    document.getElementById(
      "editColorList"
    );


  const item =
    list.children[index];


  if (!item) return;


  item.innerHTML = `

    <input
      type="text"
      class="variant-edit-name"
      value="${escapeAttribute(
        color.name
      )}"
    >

    <input
      type="number"
      min="0"
      class="variant-edit-price"
      value="${Number(
        color.price || 0
      )}"
    >

    <label>

      <input
        type="checkbox"
        class="variant-edit-required"
        ${
          color.required
          ?
          "checked"
          :
          ""
        }
      >

      Required

    </label>

    <button
      type="button"
      class="btn-outline"
      data-save
    >
      Save
    </button>

    <button
      type="button"
      class="btn-outline"
      data-cancel
    >
      Cancel
    </button>

  `;


  item
    .querySelector(
      "[data-save]"
    )
    .onclick =
    () => {

      const name =
        item
          .querySelector(
            ".variant-edit-name"
          )
          .value
          .trim();


      if (!name) return;


      color.name =
        name;

      color.price =
        Number(
          item
            .querySelector(
              ".variant-edit-price"
            )
            .value ||
          0
        );

      color.required =
        item
          .querySelector(
            ".variant-edit-required"
          )
          .checked;


      renderColors();

    };


  item
    .querySelector(
      "[data-cancel]"
    )
    .onclick =
    () => {

      renderColors();

    };

}


/* ==================================================
   SIZES / QUANTITY
================================================== */

window.addEditSize =
function() {

  const nameInput =
    document.getElementById(
      "editSizeName"
    );

  const priceInput =
    document.getElementById(
      "editSizePrice"
    );

  const requiredInput =
    document.getElementById(
      "sizeRequired"
    );


  const name =
    nameInput.value.trim();


  const price =
    Number(
      priceInput.value || 0
    );


  const required =
    requiredInput?.checked ||
    false;


  if (!name) {

    showPopup(
      "Enter quantity"
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

    required

  });


  renderSizes();


  nameInput.value =
    "";

  priceInput.value =
    "";

  requiredInput.checked =
    false;

};


function renderSizes() {

  const list =
    document.getElementById(
      "editSizeList"
    );


  if (!list) return;


  list.innerHTML =
    "";


  sizes.forEach(
    (size, index) => {

      const item =
        document.createElement(
          "div"
        );


      item.className =
        "variant-item";


      item.innerHTML = `

        <div>

          <strong>
            ${escapeHtml(
              size.name
            )}
          </strong>

          <small>

            ${
              Number(
                size.price || 0
              ) > 0

              ?

              `+₹${Number(
                size.price || 0
              )}`

              :

              "No extra price"

            }

            ${
              size.required
              ?
              " • Required"
              :
              ""
            }

          </small>

        </div>


        <div>

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
            ×
          </button>

        </div>

      `;


      item
        .querySelector(
          "[data-delete]"
        )
        .onclick =
        () => {

          sizes.splice(
            index,
            1
          );

          renderSizes();

        };


      item
        .querySelector(
          "[data-edit]"
        )
        .onclick =
        () => {

          editSize(index);

        };


      list.appendChild(
        item
      );

    }
  );

}


/* ==================================================
   EDIT SIZE
================================================== */

function editSize(index) {

  const size =
    sizes[index];


  if (!size) return;


  const list =
    document.getElementById(
      "editSizeList"
    );


  const item =
    list.children[index];


  if (!item) return;


  item.innerHTML = `

    <input
      type="text"
      class="variant-edit-name"
      value="${escapeAttribute(
        size.name
      )}"
    >

    <input
      type="number"
      min="0"
      class="variant-edit-price"
      value="${Number(
        size.price || 0
      )}"
    >

    <label>

      <input
        type="checkbox"
        class="variant-edit-required"
        ${
          size.required
          ?
          "checked"
          :
          ""
        }
      >

      Required

    </label>


    <button
      type="button"
      class="btn-outline"
      data-save
    >
      Save
    </button>


    <button
      type="button"
      class="btn-outline"
      data-cancel
    >
      Cancel
    </button>

  `;


  item
    .querySelector(
      "[data-save]"
    )
    .onclick =
    () => {

      const name =
        item
          .querySelector(
            ".variant-edit-name"
          )
          .value
          .trim();


      if (!name) return;


      size.name =
        name;

      size.price =
        Number(
          item
            .querySelector(
              ".variant-edit-price"
            )
            .value ||
          0
        );

      size.required =
        item
          .querySelector(
            ".variant-edit-required"
          )
          .checked;


      renderSizes();

    };


  item
    .querySelector(
      "[data-cancel]"
    )
    .onclick =
    () => {

      renderSizes();

    };

}


/* ==================================================
   CUSTOM DROPDOWN PRICE EDITOR
================================================== */

function getCustomChoicePriceEditor() {

  return document.getElementById(
    "editCustomChoicePrices"
  );

}


/* ==================================================
   PARSE CHOICE NAMES
================================================== */

function parseChoiceNames(
  raw
) {

  return String(
    raw || ""
  )

    .split(",")

    .map(
      value =>
        value.trim()
    )

    .filter(
      Boolean
    );

}


/* ==================================================
   RENDER ADD CHOICE PRICES
================================================== */

function renderCustomChoicePriceInputs(
  raw,
  existingChoices = []
) {

  const container =
    getCustomChoicePriceEditor();


  if (!container) return;


  container.innerHTML =
    "";


  const names =
    parseChoiceNames(
      raw
    );


  if (!names.length) {

    return;

  }


  const oldMap =
    new Map();


  existingChoices.forEach(
    choice => {

      const normalized =
        normalizeDropdownChoice(
          choice
        );


      if (
        normalized.name
      ) {

        oldMap.set(
          normalized.name,
          normalized.price
        );

      }

    }
  );


  const heading =
    document.createElement(
      "div"
    );


  heading.innerHTML = `
    <strong>
      Price for each dropdown choice
    </strong>
  `;


  container.appendChild(
    heading
  );


  names.forEach(
    name => {

      const row =
        document.createElement(
          "div"
        );


      row.className =
        "custom-choice-price-row";


      const oldPrice =
        oldMap.has(name)
        ?
        oldMap.get(name)
        :
        0;


      row.innerHTML = `

        <span>
          ${escapeHtml(
            name
          )}
        </span>

        <input
          type="number"
          min="0"
          step="1"
          class="custom-choice-price-input"
          data-choice-name="${escapeAttribute(
            name
          )}"
          value="${Number(
            oldPrice || 0
          )}"
          placeholder="Price"
        >

      `;


      container.appendChild(
        row
      );

    }
  );

}


/* ==================================================
   GET CHOICE PRICE DATA
================================================== */

function getCustomChoicePriceData() {

  const choicesInput =
    document.getElementById(
      "editCustomChoices"
    );

  const editor =
    getCustomChoicePriceEditor();


  const names =
    parseChoiceNames(
      choicesInput?.value ||
      ""
    );


  if (!names.length) {

    return [];

  }


  const rows =
    editor
      ?
      [
        ...editor.querySelectorAll(
          ".custom-choice-price-row"
        )
      ]
      :
      [];


  return names.map(
    name => {

      const row =
        rows.find(
          currentRow =>
            currentRow
              .querySelector(
                ".custom-choice-price-input"
              )
              ?.dataset
              .choiceName ===
            name
        );


      const input =
        row
          ?.querySelector(
            ".custom-choice-price-input"
          );


      return {

        name,

        price:
          Number(
            input?.value || 0
          )

      };

    }
  );

}


/* ==================================================
   CUSTOM TYPE CHANGE
================================================== */

function updateCustomTypeUI() {

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
    getCustomChoicePriceEditor();


  if (
    type === "dropdown"
  ) {

    if (priceInput) {

      priceInput.style.display =
        "none";

    }


    if (choicesInput) {

      choicesInput.style.display =
        "";

    }


    if (editor) {

      editor.style.display =
        "";

    }


    renderCustomChoicePriceInputs(
      choicesInput?.value || ""
    );

  }

  else {

    if (priceInput) {

      priceInput.style.display =
        "";

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


/* ==================================================
   CHOICE INPUT LIVE UPDATE
================================================== */

const editCustomChoices =
  document.getElementById(
    "editCustomChoices"
  );


editCustomChoices?.addEventListener(
  "input",
  () => {

    renderCustomChoicePriceInputs(
      editCustomChoices.value
    );

  }
);


document
  .getElementById(
    "editCustomType"
  )
  ?.addEventListener(
    "change",
    updateCustomTypeUI
  );


/* ==================================================
   ADD CUSTOM OPTION
================================================== */

window.addEditCustomOption =
function() {

  const type =
    document.getElementById(
      "editCustomType"
    ).value;


  const label =
    document.getElementById(
      "editCustomLabel"
    ).value
    .trim();


  const price =
    Number(
      document.getElementById(
        "editCustomPrice"
      ).value ||
      0
    );


  const required =
    document.getElementById(
      "customRequired"
    )?.checked ||
    false;


  if (!label) {

    showPopup(
      "Enter option label"
    );

    setTimeout(
      hidePopup,
      1200
    );

    return;

  }


  const option = {

    type,

    label,

    price,

    required

  };


  /* ==================================================
     DROPDOWN
  ================================================== */

  if (
    type === "dropdown"
  ) {

    const choices =
      getCustomChoicePriceData();


    if (!choices.length) {

      showPopup(
        "Enter dropdown choices"
      );

      setTimeout(
        hidePopup,
        1200
      );

      return;

    }


    option.price =
      0;


    option.choices =
      choices;

  }


  customOptions.push(
    option
  );


  renderCustomOptions();


  document.getElementById(
    "editCustomLabel"
  ).value =
    "";


  document.getElementById(
    "editCustomPrice"
  ).value =
    "";


  document.getElementById(
    "editCustomChoices"
  ).value =
    "";


  document.getElementById(
    "customRequired"
  ).checked =
    false;


  renderCustomChoicePriceInputs(
    ""
  );


  updateCustomTypeUI();

};


/* ==================================================
   RENDER CUSTOM OPTIONS
================================================== */

function renderCustomOptions() {

  const list =
    document.getElementById(
      "editCustomList"
    );


  if (!list) return;


  list.innerHTML =
    "";


  customOptions.forEach(
    (rawOption, index) => {

      const option =
        normalizeCustomOption(
          rawOption
        );


      customOptions[index] =
        option;


      const item =
        document.createElement(
          "div"
        );


      item.className =
        "custom-option-item";


      let details =
        "";


      if (
        option.type ===
        "dropdown"
      ) {

        const choiceText =
          option.choices
            .map(
              choice => {

                const price =
                  Number(
                    choice.price || 0
                  );


                return (

                  `${escapeHtml(
                    choice.name
                  )}` +

                  (
                    price > 0
                    ?
                    ` (+₹${price})`
                    :
                    ""
                  )

                );

              }
            )
            .join(
              ", "
            );


        details = `

          <div>

            <strong>
              ${escapeHtml(
                option.label
              )}
            </strong>

            <small>
              Dropdown
            </small>

            <div>
              ${choiceText}
            </div>

          </div>

        `;

      }

      else {

        details = `

          <div>

            <strong>
              ${escapeHtml(
                option.label
              )}
            </strong>

            <small>

              ${escapeHtml(
                option.type
              )}

              ${
                Number(
                  option.price || 0
                ) > 0

                ?

                ` • +₹${Number(
                  option.price || 0
                )}`

                :

                ""

              }

              ${
                option.required
                ?
                " • Required"
                :
                ""
              }

            </small>

          </div>

        `;

      }


      item.innerHTML = `

        ${details}

        <div>

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
            ×
          </button>

        </div>

      `;


      item
        .querySelector(
          "[data-delete]"
        )
        .onclick =
        () => {

          customOptions.splice(
            index,
            1
          );

          renderCustomOptions();

        };


      item
        .querySelector(
          "[data-edit]"
        )
        .onclick =
        () => {

          editCustomOption(
            index
          );

        };


      list.appendChild(
        item
      );

    }
  );

}


/* ==================================================
   EDIT CUSTOM OPTION
================================================== */

function editCustomOption(index) {

  const option =
    normalizeCustomOption(
      customOptions[index]
    );


  const list =
    document.getElementById(
      "editCustomList"
    );


  const item =
    list.children[index];


  if (!item) return;


  let choicesHTML =
    "";


  if (
    option.type ===
    "dropdown"
  ) {

    choicesHTML = `

      <input
        type="text"
        class="edit-option-choices"
        value="${escapeAttribute(
          option.choices
            .map(
              choice =>
                choice.name
            )
            .join(", ")
        )}"
        placeholder="Dropdown choices"
      >


      <div
        class="edit-option-choice-prices"
      ></div>

    `;

  }


  item.innerHTML = `

    <select
      class="edit-option-type"
    >

      <option
        value="text"
        ${
          option.type === "text"
          ?
          "selected"
          :
          ""
        }
      >
        Text
      </option>

      <option
        value="image"
        ${
          option.type === "image"
          ?
          "selected"
          :
          ""
        }
      >
        Image Upload
      </option>

      <option
        value="checkbox"
        ${
          option.type === "checkbox"
          ?
          "selected"
          :
          ""
        }
      >
        Checkbox
      </option>

      <option
        value="dropdown"
        ${
          option.type === "dropdown"
          ?
          "selected"
          :
          ""
        }
      >
        Dropdown
      </option>

    </select>


    <input
      type="text"
      class="edit-option-label"
      value="${escapeAttribute(
        option.label
      )}"
      placeholder="Option label"
    >


    <input
      type="number"
      min="0"
      class="edit-option-price"
      value="${Number(
        option.price || 0
      )}"
      placeholder="Extra price"
    >


    ${choicesHTML}


    <label>

      <input
        type="checkbox"
        class="edit-option-required"
        ${
          option.required
          ?
          "checked"
          :
          ""
        }
      >

      Required

    </label>


    <button
      type="button"
      class="btn-outline"
      data-save
    >
      Save
    </button>


    <button
      type="button"
      class="btn-outline"
      data-cancel
    >
      Cancel
    </button>

  `;


  const typeSelect =
    item.querySelector(
      ".edit-option-type"
    );


  const priceInput =
    item.querySelector(
      ".edit-option-price"
    );


  const choicesInput =
    item.querySelector(
      ".edit-option-choices"
    );


  function updateEditChoiceUI() {

    const type =
      typeSelect.value;


    if (
      type === "dropdown"
    ) {

      priceInput.style.display =
        "none";


      let choicesBox =
        item.querySelector(
          ".edit-option-choices"
        );


      if (!choicesBox) {

        choicesBox =
          document.createElement(
            "input"
          );

        choicesBox.type =
          "text";

        choicesBox.className =
          "edit-option-choices";

        choicesBox.placeholder =
          "Dropdown choices";


        priceInput.insertAdjacentElement(
          "afterend",
          choicesBox
        );

      }


      choicesBox.style.display =
        "";


      let priceBox =
        item.querySelector(
          ".edit-option-choice-prices"
        );


      if (!priceBox) {

        priceBox =
          document.createElement(
            "div"
          );

        priceBox.className =
          "edit-option-choice-prices";


        choicesBox.insertAdjacentElement(
          "afterend",
          priceBox
        );

      }


      renderInlineChoicePrices(
        item,
        choicesBox.value,
        option.choices
      );

    }

    else {

      priceInput.style.display =
        "";

      choicesInput?.remove();

      item
        .querySelector(
          ".edit-option-choice-prices"
        )
        ?.remove();

    }

  }


  typeSelect.addEventListener(
    "change",
    updateEditChoiceUI
  );


  choicesInput?.addEventListener(
    "input",
    () => {

      renderInlineChoicePrices(
        item,
        choicesInput.value,
        option.choices
      );

    }
  );


  updateEditChoiceUI();


  item
    .querySelector(
      "[data-save]"
    )
    .onclick =
    () => {

      const newType =
        typeSelect.value;


      const newLabel =
        item
          .querySelector(
            ".edit-option-label"
          )
          .value
          .trim();


      const newRequired =
        item
          .querySelector(
            ".edit-option-required"
          )
          .checked;


      if (!newLabel) {

        return;

      }


      const updated = {

        type:
          newType,

        label:
          newLabel,

        price:
          Number(
            priceInput.value ||
            0
          ),

        required:
          newRequired

      };


      if (
        newType ===
        "dropdown"
      ) {

        const input =
          item.querySelector(
            ".edit-option-choices"
          );


        const prices =
          item.querySelectorAll(
            ".inline-choice-price"
          );


        const names =
          parseChoiceNames(
            input?.value ||
            ""
          );


        updated.price =
          0;


        updated.choices =
          names.map(
            name => {

              const priceInput =
                [
                  ...prices
                ].find(
                  current =>
                    current.dataset.name ===
                    name
                );


              return {

                name,

                price:
                  Number(
                    priceInput?.value ||
                    0
                  )

              };

            }
          );

      }


      customOptions[index] =
        updated;


      renderCustomOptions();

    };


  item
    .querySelector(
      "[data-cancel]"
    )
    .onclick =
    () => {

      renderCustomOptions();

    };

}


/* ==================================================
   INLINE DROPDOWN PRICE EDITOR
================================================== */

function renderInlineChoicePrices(
  item,
  raw,
  existingChoices = []
) {

  const box =
    item.querySelector(
      ".edit-option-choice-prices"
    );


  if (!box) return;


  box.innerHTML =
    "";


  const names =
    parseChoiceNames(
      raw
    );


  const oldMap =
    new Map();


  existingChoices.forEach(
    choice => {

      const normalized =
        normalizeDropdownChoice(
          choice
        );


      if (
        normalized.name
      ) {

        oldMap.set(
          normalized.name,
          normalized.price
        );

      }

    }
  );


  names.forEach(
    name => {

      const row =
        document.createElement(
          "div"
        );


      row.className =
        "custom-choice-price-row";


      const oldPrice =
        oldMap.get(
          name
        ) ??
        0;


      row.innerHTML = `

        <span>
          ${escapeHtml(
            name
          )}
        </span>


        <input
          type="number"
          min="0"
          class="inline-choice-price"
          data-name="${escapeAttribute(
            name
          )}"
          value="${Number(
            oldPrice || 0
          )}"
          placeholder="Price"
        >

      `;


      box.appendChild(
        row
      );

    }
  );

}


/* ==================================================
   RELATED PRODUCTS
================================================== */

async function loadDesignProducts() {

  try {

    const snap =
      await getDocs(
        collection(
          db,
          "products"
        )
      );


    allProducts = [];


    snap.forEach(
      productDoc => {

        allProducts.push({

          id:
            productDoc.id,

          ...productDoc.data()

        });

      }
    );


    renderDesignList(
      allProducts
    );

  }

  catch(error) {

    console.error(
      "Related products error:",
      error
    );

  }

}


/* ==================================================
   RELATED DESIGN LIST
================================================== */

function renderDesignList(
  list
) {

  const box =
    document.getElementById(
      "designList"
    );


  if (!box) return;


  box.innerHTML =
    "";


  list.forEach(
    p => {

      if (
        p.id === id
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
          p.id
        );


      row.innerHTML = `

        <input
          type="checkbox"
          ${
            checked
            ?
            "checked"
            :
            ""
          }
        >

        <img
          src="${escapeAttribute(
            p.images?.[0] ||
            ""
          )}"
          alt="${escapeAttribute(
            p.name ||
            ""
          )}"
        >

        <span>
          ${escapeHtml(
            p.name ||
            ""
          )}
        </span>

      `;


      row
        .querySelector(
          "input"
        )
        .addEventListener(
          "change",
          event => {

            toggleDesign(
              p.id,
              event.target.checked
            );

          }
        );


      box.appendChild(
        row
      );

    }
  );

}


/* ==================================================
   TOGGLE RELATED DESIGN
================================================== */

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

  }

  else {

    relatedDesigns =
      relatedDesigns.filter(
        id =>
          id !== productId
      );

  }

};


/* ==================================================
   SEARCH RELATED DESIGNS
================================================== */

window.filterDesigns =
function() {

  const input =
    document.getElementById(
      "designSearch"
    );


  const queryText =
    input?.value
      ?.toLowerCase()
      .trim() ||
    "";


  const filtered =
    allProducts.filter(
      p =>
        p.id !== id &&
        String(
          p.name || ""
        )
          .toLowerCase()
          .includes(
            queryText
          )
    );


  renderDesignList(
    filtered
  );

};


/* ==================================================
   TAGS
================================================== */

async function loadTags() {

  const box =
    document.getElementById(
      "tagCheckboxes"
    );


  if (!box) return;


  try {

    const snap =
      await getDocs(
        collection(
          db,
          "tags"
        )
      );


    box.innerHTML =
      "";


    snap.forEach(
      tagDoc => {

        const tag =
          tagDoc.data();


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
              ?
              "checked"
              :
              ""
            }
          >

          <span>
            ${escapeHtml(
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


        box.appendChild(
          row
        );

      }
    );

  }

  catch(error) {

    console.error(
      "Tags loading error:",
      error
    );

  }

}


/* ==================================================
   TOGGLE TAG
================================================== */

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

  }

  else {

    selectedTags =
      selectedTags.filter(
        tag =>
          tag !== slug
      );

  }

};


/* ==================================================
   STORAGE GALLERY
================================================== */

let currentGalleryPath =
  "product-images";


/* ==================================================
   OPEN GALLERY
================================================== */

window.openGalleryPicker =
function() {

  const picker =
    document.getElementById(
      "galleryPicker"
    );


  if (!picker) return;


  gallerySelected =
    [];


  picker.classList.remove(
    "hidden"
  );


  loadGalleryFolder(
    "product-images"
  );

};


/* ==================================================
   LOAD GALLERY FOLDER
================================================== */

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


  grid.innerHTML =
    "<p>Loading...</p>";


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


    grid.innerHTML =
      "";


    /* FOLDERS */

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
            ${escapeHtml(
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


    /* IMAGES */

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


      div.innerHTML = `

        <input
          type="checkbox"
          class="gallery-check"
        >

        <img
          src="${escapeAttribute(
            url
          )}"
          alt=""
        >

      `;


      const checkbox =
        div.querySelector(
          ".gallery-check"
        );


      checkbox.checked =
        gallerySelected.includes(
          url
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

          }

          else {

            gallerySelected =
              gallerySelected.filter(
                item =>
                  item !== url
              );

          }

        };


      grid.appendChild(
        div
      );

    }

  }

  catch(error) {

    console.error(
      "Gallery error:",
      error
    );


    grid.innerHTML =
      "<p>Unable to load gallery.</p>";

  }

}


/* ==================================================
   BREADCRUMBS
================================================== */

function updateGalleryBreadcrumbs(
  path
) {

  if (!galleryBreadcrumbs) {
    return;
  }


  galleryBreadcrumbs.innerHTML =
    "";


  const parts =
    path
      .replace(
        "product-images",
        ""
      )
      .split("/")
      .filter(
        Boolean
      );


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
        "/" +
        part;


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


/* ==================================================
   CLOSE GALLERY
================================================== */

window.closeGalleryPicker =
function() {

  document
    .getElementById(
      "galleryPicker"
    )
    ?.classList.add(
      "hidden"
    );

};


/* ==================================================
   ADD SELECTED GALLERY IMAGES
================================================== */

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


/* ==================================================
   UPDATE PRODUCT
================================================== */

window.updateProduct =
async function() {

  if (!id) {

    return;

  }


  const name =
    nameInput.value.trim();


  const price =
    Number(
      priceInput.value || 0
    );


  const selectedCategory =
    catSelect.options[
      catSelect.selectedIndex
    ];


  if (
    !selectedCategory ||
    !selectedCategory.value
  ) {

    showPopup(
      "⚠ Select category"
    );

    setTimeout(
      hidePopup,
      1500
    );

    return;

  }


  let categoryId =
    null;


  let subCategoryId =
    null;


  if (
    selectedCategory.dataset.type ===
    "main"
  ) {

    categoryId =
      selectedCategory.value;

  }


  if (
    selectedCategory.dataset.type ===
    "sub"
  ) {

    subCategoryId =
      selectedCategory.value;

    categoryId =
      selectedCategory.dataset.parent;

  }


  if (
    !name ||
    price <= 0
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


  /* ==================================================
     VALIDATE CUSTOM OPTIONS
  ================================================== */

  for (
    const option of customOptions
  ) {

    if (
      !option.label
    ) {

      showPopup(
        "⚠ Custom option label is missing"
      );

      setTimeout(
        hidePopup,
        1500
      );

      return;

    }


    if (
      option.type ===
      "dropdown"
    ) {

      if (
        !Array.isArray(
          option.choices
        ) ||
        !option.choices.length
      ) {

        showPopup(
          `⚠ Add choices for ${option.label}`
        );

        setTimeout(
          hidePopup,
          1500
        );

        return;

      }


      option.price =
        0;


      option.choices =
        option.choices
          .map(
            normalizeDropdownChoice
          )
          .filter(
            choice =>
              choice.name
          );

    }

  }


  try {

    showPopup(
      "Uploading images..."
    );


    /* ==================================================
       UPLOAD NEW IMAGES
    ================================================== */

    const finalImages =
      [...existingImages];


    for (
      const file of newImages
    ) {

      const storageRef =
        ref(
          storage,
          `products/${Date.now()}-${file.name}`
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


    showPopup(
      "Saving changes..."
    );


    /* ==================================================
       PAYMENT SETTINGS
    ================================================== */

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


    /* ==================================================
       CLEAN CUSTOM OPTIONS
    ================================================== */

    const cleanCustomOptions =
      customOptions.map(
        option => {

          const clean = {

            type:
              option.type,

            label:
              option.label,

            required:
              Boolean(
                option.required
              )

          };


          if (
            option.type ===
            "dropdown"
          ) {

            clean.price =
              0;


            clean.choices =
              (
                option.choices ||
                []
              )
                .map(
                  normalizeDropdownChoice
                )
                .filter(
                  choice =>
                    choice.name
                );

          }

          else {

            clean.price =
              Number(
                option.price ||
                0
              );

          }


          return clean;

        }
      );


    /* ==================================================
       UPDATE FIRESTORE
    ================================================== */

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

          colors,

          sizes

        },


        customOptions:
          cleanCustomOptions,


        paymentSettings,


        relatedDesigns,


        tags:
          selectedTags,


        isBestseller:
          bestsellerCheckbox?.checked ||
          false

      }

    );


    /* ==================================================
       BIDIRECTIONAL RELATED PRODUCTS
    ================================================== */

    for (
      const relatedId of relatedDesigns
    ) {

      const relatedRef =
        doc(
          db,
          "products",
          relatedId
        );


      const relatedSnap =
        await getDoc(
          relatedRef
        );


      if (
        !relatedSnap.exists()
      ) {

        continue;

      }


      const relatedData =
        relatedSnap.data();


      const relatedArray =
        Array.isArray(
          relatedData.relatedDesigns
        )

        ?

        [
          ...relatedData.relatedDesigns
        ]

        :

        [];


      if (
        !relatedArray.includes(
          id
        )
      ) {

        relatedArray.push(
          id
        );


        await updateDoc(
          relatedRef,
          {

            relatedDesigns:
              relatedArray

          }
        );

      }

    }


    /* ==================================================
       SUCCESS
    ================================================== */

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

  }

  catch(error) {

    console.error(
      "Update product error:",
      error
    );


    showPopup(
      "❌ " +
      (
        error.message ||
        "Update failed"
      )
    );

  }

};


/* ==================================================
   INITIALIZE
================================================== */

async function init() {

  try {

    await loadCategories();

    await loadProduct();

    updateCustomTypeUI();

  }

  catch(error) {

    console.error(
      "Edit page initialization error:",
      error
    );

  }

}


init();