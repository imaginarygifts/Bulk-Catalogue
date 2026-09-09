import { db, storage } from "./firebase.js";

import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL,
  listAll
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";


/*==================================================
    INPUTS
==================================================*/

const nameInput =
  document.getElementById("name");

const descInput =
  document.getElementById("desc");

const priceInput =
  document.getElementById("price");

const catSelect =
  document.getElementById("category");

const imagesInput =
  document.getElementById("images");

const preview =
  document.getElementById("imagePreview");

const salePriceInput =
  document.getElementById("salePrice");

const stockStatus =
  document.getElementById("stockStatus");


/*==================================================
    SHIPPING INPUTS
==================================================*/

const shippingType =
  document.getElementById("shippingType");

const shippingAmount =
  document.getElementById("shippingAmount");

const commonShippingAmountBox =
  document.getElementById("commonShippingAmountBox");

const sizeShippingType =
  document.getElementById("sizeShippingType");

const sizeShippingAmount =
  document.getElementById("sizeShippingAmount");

const sizeShippingAmountBox =
  document.getElementById("sizeShippingAmountBox");


/*==================================================
    TAGS & BESTSELLER
==================================================*/

const tagBox =
  document.getElementById("tagCheckboxes");

const bestsellerCheckbox =
  document.getElementById("isBestseller");


/*==================================================
    PAYMENT & DISCOUNTS
==================================================*/

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


/*==================================================
    STATE
==================================================*/

let colors = [];

let sizes = [];

let customOptions = [];

/*
  Product images are stored as objects internally.

  Example:

  {
    type: "file",
    file: File,
    preview: "blob:..."
  }

  OR

  {
    type: "url",
    url: "https://..."
  }

  This makes drag/reorder much easier.
*/

let productImages = [];

let gallerySelected = [];

let currentGalleryPath =
  "product-images";

let relatedDesigns = [];

let allProducts = [];

let selectedTags = [];


/*==================================================
    ACCORDION
==================================================*/

window.toggleSection = (id) => {

  const section =
    document.getElementById(id);

  if(section){

    section.classList.toggle("hidden");

  }

};


/*==================================================
    POPUP
==================================================*/

function showPopup(msg){

  const p =
    document.getElementById("popup");

  if(!p){
    return;
  }

  p.innerText = msg;

  p.classList.remove("hidden");

}


function hidePopup(){

  const p =
    document.getElementById("popup");

  if(p){

    p.classList.add("hidden");

  }

}


/*==================================================
    SHIPPING UI
==================================================*/

function updateCommonShippingUI(){

  if(
    !shippingType ||
    !commonShippingAmountBox
  ){

    return;

  }

  if(
    shippingType.value === "paid"
  ){

    commonShippingAmountBox.style.display =
      "block";

  }
  else{

    commonShippingAmountBox.style.display =
      "none";

    if(shippingAmount){

      shippingAmount.value = "";

    }

  }

}


/*==================================================
    SIZE SHIPPING UI
==================================================*/

function updateSizeShippingUI(){

  if(
    !sizeShippingType ||
    !sizeShippingAmountBox
  ){

    return;

  }

  if(
    sizeShippingType.value === "paid"
  ){

    sizeShippingAmountBox.classList.remove(
      "hidden"
    );

  }
  else{

    sizeShippingAmountBox.classList.add(
      "hidden"
    );

    if(sizeShippingAmount){

      sizeShippingAmount.value = "";

    }

  }

}


/*==================================================
    SHIPPING EVENTS
==================================================*/

if(shippingType){

  shippingType.addEventListener(
    "change",
    updateCommonShippingUI
  );

}


if(sizeShippingType){

  sizeShippingType.addEventListener(
    "change",
    updateSizeShippingUI
  );

}


updateCommonShippingUI();

updateSizeShippingUI();


/*==================================================
    LOAD CATEGORIES
==================================================*/

async function loadCategories(){

  if(!catSelect){

    return;

  }

  catSelect.innerHTML =
    `<option value="">Select category</option>`;

  try{

    const snap =
      await getDocs(
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

    const mains =
      categories.filter(
        c => !c.parentId
      );

    mains.forEach(main => {

      const opt =
        document.createElement("option");

      opt.value =
        main.id;

      opt.textContent =
        main.name;

      opt.dataset.type =
        "main";

      catSelect.appendChild(opt);


      const subs =
        categories.filter(
          c =>
            c.parentId === main.id
        );

      subs.forEach(sub => {

        const subOpt =
          document.createElement("option");

        subOpt.value =
          sub.id;

        subOpt.textContent =
          "— " + sub.name;

        subOpt.dataset.type =
          "sub";

        subOpt.dataset.parent =
          main.id;

        catSelect.appendChild(
          subOpt
        );

      });

    });

  }

  catch(error){

    console.error(
      "Category loading error:",
      error
    );

  }

}


loadCategories();


/*==================================================
    PRODUCT IMAGE PICKER
==================================================*/

if(imagesInput){

  imagesInput.addEventListener(
    "change",
    event => {

      const files =
        Array.from(
          event.target.files || []
        );

      files.forEach(file => {

        productImages.push({

          type: "file",

          file: file,

          preview:
            URL.createObjectURL(file)

        });

      });

      renderImagePreview();

      imagesInput.value = "";

    }
  );

}


/*==================================================
    IMAGE PREVIEW
    IMAGE-ONLY DRAG + DROP + DELETE
==================================================*/

function renderImagePreview(){

  if(!preview){
    return;
  }

  preview.innerHTML = "";

  productImages.forEach(
    (image, index) => {

      const card =
        document.createElement("div");

      card.className =
        "image-card";

      card.draggable =
        true;

      card.dataset.index =
        index;


      /*--------------------------------------------
          IMAGE
      --------------------------------------------*/

      const img =
        document.createElement("img");

      if(image.type === "file"){

        img.src =
          image.preview;

      }
      else{

        img.src =
          image.url;

      }

      img.draggable =
        false;


      /*--------------------------------------------
          DELETE BUTTON
      --------------------------------------------*/

      const del =
        document.createElement("button");

      del.type =
        "button";

      del.className =
        "image-delete";

      del.innerText =
        "×";

      del.title =
        "Remove image";


      del.addEventListener(
        "click",
        event => {

          event.stopPropagation();

          if(
            image.type === "file" &&
            image.preview
          ){

            URL.revokeObjectURL(
              image.preview
            );

          }

          productImages.splice(
            index,
            1
          );

          renderImagePreview();

        }
      );


      /*--------------------------------------------
          APPEND ONLY IMAGE + DELETE
      --------------------------------------------*/

      card.appendChild(img);

      card.appendChild(del);


      /*============================================
          DRAG START
      ============================================*/

      card.addEventListener(
        "dragstart",
        event => {

          event.dataTransfer.effectAllowed =
            "move";

          event.dataTransfer.setData(
            "text/plain",
            String(index)
          );

          card.classList.add(
            "dragging"
          );

        }
      );


      /*============================================
          DRAG END
      ============================================*/

      card.addEventListener(
        "dragend",
        () => {

          card.classList.remove(
            "dragging"
          );

          document
            .querySelectorAll(
              "#imagePreview .image-card"
            )
            .forEach(item => {

              item.classList.remove(
                "drag-over"
              );

            });

        }
      );


      /*============================================
          DRAG OVER
      ============================================*/

      card.addEventListener(
        "dragover",
        event => {

          event.preventDefault();

          event.dataTransfer.dropEffect =
            "move";

          card.classList.add(
            "drag-over"
          );

        }
      );


      /*============================================
          DRAG LEAVE
      ============================================*/

      card.addEventListener(
        "dragleave",
        () => {

          card.classList.remove(
            "drag-over"
          );

        }
      );


      /*============================================
          DROP
      ============================================*/

      card.addEventListener(
        "drop",
        event => {

          event.preventDefault();

          card.classList.remove(
            "drag-over"
          );

          const fromIndex =
            Number(
              event.dataTransfer.getData(
                "text/plain"
              )
            );

          const toIndex =
            Number(
              card.dataset.index
            );


          if(
            Number.isNaN(fromIndex) ||
            Number.isNaN(toIndex)
          ){

            return;

          }


          if(
            fromIndex === toIndex
          ){

            return;

          }


          const moved =
            productImages.splice(
              fromIndex,
              1
            )[0];


          productImages.splice(
            toIndex,
            0,
            moved
          );


          renderImagePreview();

        }
      );


      /*--------------------------------------------
          ADD CARD
      --------------------------------------------*/

      preview.appendChild(
        card
      );

    }
  );

}



/*==================================================
    COLORS
==================================================*/

window.addColor = () => {

  const name =
    document
      .getElementById("colorName")
      .value
      .trim();

  const price =
    Number(
      document
        .getElementById("colorPrice")
        .value || 0
    );

  const required =
    document
      .getElementById("colorRequired")
      ?.checked ||
    false;

  if(!name){

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

  const requiredInput =
    document.getElementById(
      "colorRequired"
    );

  if(requiredInput){

    requiredInput.checked =
      false;

  }

};


/*==================================================
    RENDER COLORS
==================================================*/

function renderColors(){

  const list =
    document.getElementById(
      "colorList"
    );

  if(!list){

    return;

  }

  list.innerHTML = "";

  colors.forEach(
    (color, index) => {

      const div =
        document.createElement(
          "div"
        );

      div.className =
        "variant-item";

      div.innerHTML = `

        <div class="variant-drag-handle">
          ☰
        </div>

        <div class="variant-info">

          <strong>
            ${escapeHtml(color.name)}
          </strong>

          <span>
            +₹${Number(color.price || 0)}
          </span>

          <span>
            ${
              color.required
              ? "Required"
              : "Optional"
            }
          </span>

        </div>

        <div class="variant-actions">

          <button
            type="button"
            class="btn-outline"
            onclick="editColor(${index})"
          >
            Edit
          </button>

          <button
            type="button"
            class="btn-outline"
            onclick="removeColor(${index})"
          >
            Remove
          </button>

        </div>

      `;

      list.appendChild(div);

    }
  );

}


/*==================================================
    EDIT COLOR
==================================================*/

window.editColor =
function(index){

  const color =
    colors[index];

  if(!color){

    return;

  }

  const list =
    document.getElementById(
      "colorList"
    );

  const item =
    list?.children[index];

  if(!item){

    return;

  }

  item.innerHTML = `

    <div class="variant-edit-box">

      <input
        type="text"
        class="edit-color-name"
        value="${escapeAttribute(color.name)}"
        placeholder="Color"
      >

      <input
        type="number"
        class="edit-color-price"
        value="${Number(color.price || 0)}"
        placeholder="Extra price"
        min="0"
      >

      <label>

        <input
          type="checkbox"
          class="edit-color-required"
          ${color.required ? "checked" : ""}
        >

        Required

      </label>

      <div class="variant-actions">

        <button
          type="button"
          class="btn-outline"
          onclick="saveEditedColor(${index})"
        >
          Save
        </button>

        <button
          type="button"
          class="btn-outline"
          onclick="renderColors()"
        >
          Cancel
        </button>

      </div>

    </div>

  `;

};


/*==================================================
    SAVE COLOR
==================================================*/

window.saveEditedColor =
function(index){

  const list =
    document.getElementById(
      "colorList"
    );

  const item =
    list?.children[index];

  if(!item){

    return;

  }

  const name =
    item
      .querySelector(
        ".edit-color-name"
      )
      ?.value
      .trim();

  const price =
    Number(
      item
        .querySelector(
          ".edit-color-price"
        )
        ?.value || 0
    );

  const required =
    item
      .querySelector(
        ".edit-color-required"
      )
      ?.checked ||
    false;

  if(!name){

    showPopup(
      "⚠ Please enter color."
    );

    setTimeout(
      hidePopup,
      1500
    );

    return;

  }

  colors[index] = {

    ...colors[index],

    name,

    price,

    required

  };

  renderColors();

};


/*==================================================
    REMOVE COLOR
==================================================*/

window.removeColor =
function(index){

  colors.splice(
    index,
    1
  );

  renderColors();

};


/*==================================================
    SIZES
==================================================*/

window.addSize = () => {

  const name =
    document
      .getElementById("sizeName")
      .value
      .trim();

  const price =
    Number(
      document
        .getElementById("sizePrice")
        .value || 0
    );

  const required =
    document
      .getElementById("sizeRequired")
      ?.checked ||
    false;

  const shippingMode =
    document
      .getElementById("sizeShippingType")
      ?.value ||
    "common";

  let sizeShippingValue =
    null;


  if(!name){

    showPopup(
      "⚠ Please enter size."
    );

    setTimeout(
      hidePopup,
      1500
    );

    return;

  }


  if(
    shippingMode === "paid"
  ){

    sizeShippingValue =
      Number(
        document
          .getElementById(
            "sizeShippingAmount"
          )
          ?.value || 0
      );

    if(
      sizeShippingValue <= 0
    ){

      showPopup(
        "⚠ Please enter shipping amount for this size."
      );

      setTimeout(
        hidePopup,
        1800
      );

      return;

    }

  }


  sizes.push({

    name,

    price,

    required,

    shippingMode,

    shippingAmount:

      shippingMode === "free"
      ? 0
      : shippingMode === "paid"
      ? sizeShippingValue
      : null

  });


  renderSizes();


  document.getElementById(
    "sizeName"
  ).value = "";

  document.getElementById(
    "sizePrice"
  ).value = "";


  const requiredInput =
    document.getElementById(
      "sizeRequired"
    );

  if(requiredInput){

    requiredInput.checked =
      false;

  }


  if(sizeShippingType){

    sizeShippingType.value =
      "common";

  }


  if(sizeShippingAmount){

    sizeShippingAmount.value =
      "";

  }

  updateSizeShippingUI();

};


/*==================================================
    RENDER SIZES
==================================================*/

function renderSizes(){

  const list =
    document.getElementById(
      "sizeList"
    );

  if(!list){

    return;

  }

  list.innerHTML = "";

  sizes.forEach(
    (size, index) => {

      const div =
        document.createElement(
          "div"
        );

      div.className =
        "size-item";

      div.draggable =
        true;

      div.dataset.index =
        index;


      let shippingText =
        "Common Shipping";

      if(
        size.shippingMode === "free"
      ){

        shippingText =
          "Free Shipping";

      }

      if(
        size.shippingMode === "paid"
      ){

        shippingText =
          `Shipping ₹${Number(
            size.shippingAmount || 0
          )}`;

      }


      div.innerHTML = `

        <div
          class="variant-drag-handle"
          title="Drag to reorder"
        >
          ☰
        </div>

        <div class="variant-info">

          <strong>
            ${escapeHtml(size.name)}
          </strong>

          <span>
            +₹${Number(size.price || 0)}
          </span>

          <span>
            ${
              size.required
              ? "Required"
              : "Optional"
            }
          </span>

          <span>
            ${shippingText}
          </span>

        </div>

        <div class="variant-actions">

          <button
            type="button"
            class="btn-outline"
            onclick="editSize(${index})"
          >
            Edit
          </button>

          <button
            type="button"
            class="btn-outline"
            onclick="removeSize(${index})"
          >
            Remove
          </button>

        </div>

      `;


      /* DRAG */

      div.addEventListener(
        "dragstart",
        event => {

          event.dataTransfer.effectAllowed =
            "move";

          event.dataTransfer.setData(
            "text/plain",
            String(index)
          );

          div.classList.add(
            "dragging"
          );

        }
      );


      div.addEventListener(
        "dragend",
        () => {

          div.classList.remove(
            "dragging"
          );

        }
      );


      div.addEventListener(
        "dragover",
        event => {

          event.preventDefault();

          div.classList.add(
            "drag-over"
          );

        }
      );


      div.addEventListener(
        "dragleave",
        () => {

          div.classList.remove(
            "drag-over"
          );

        }
      );


      div.addEventListener(
        "drop",
        event => {

          event.preventDefault();

          div.classList.remove(
            "drag-over"
          );

          const fromIndex =
            Number(
              event.dataTransfer.getData(
                "text/plain"
              )
            );

          const toIndex =
            Number(
              div.dataset.index
            );

          if(
            Number.isNaN(fromIndex) ||
            Number.isNaN(toIndex) ||
            fromIndex === toIndex
          ){

            return;

          }

          const moved =
            sizes.splice(
              fromIndex,
              1
            )[0];

          sizes.splice(
            toIndex,
            0,
            moved
          );

          renderSizes();

        }
      );


      list.appendChild(div);

    }
  );

}


/*==================================================
    EDIT SIZE
==================================================*/

window.editSize =
function(index){

  const size =
    sizes[index];

  if(!size){

    return;

  }

  const list =
    document.getElementById(
      "sizeList"
    );

  const item =
    list?.children[index];

  if(!item){

    return;

  }

  item.draggable =
    false;

  item.innerHTML = `

    <div class="variant-edit-box">

      <input
        type="text"
        class="edit-size-name"
        value="${escapeAttribute(size.name)}"
        placeholder="Size"
      >

      <input
        type="number"
        class="edit-size-price"
        value="${Number(size.price || 0)}"
        placeholder="Extra price"
        min="0"
      >

      <select
        class="edit-size-shipping"
      >

        <option
          value="common"
          ${size.shippingMode === "common" ? "selected" : ""}
        >
          Common Shipping
        </option>

        <option
          value="free"
          ${size.shippingMode === "free" ? "selected" : ""}
        >
          Free Shipping
        </option>

        <option
          value="paid"
          ${size.shippingMode === "paid" ? "selected" : ""}
        >
          Paid Shipping
        </option>

      </select>

      <input
        type="number"
        class="edit-size-shipping-amount"
        value="${size.shippingAmount ?? ""}"
        placeholder="Shipping amount"
        min="0"
        ${
          size.shippingMode !== "paid"
          ? "style='display:none'"
          : ""
        }
      >

      <label>

        <input
          type="checkbox"
          class="edit-size-required"
          ${size.required ? "checked" : ""}
        >

        Required

      </label>

      <div class="variant-actions">

        <button
          type="button"
          class="btn-outline"
          onclick="saveEditedSize(${index})"
        >
          Save
        </button>

        <button
          type="button"
          class="btn-outline"
          onclick="renderSizes()"
        >
          Cancel
        </button>

      </div>

    </div>

  `;


  const shippingSelect =
    item.querySelector(
      ".edit-size-shipping"
    );

  const shippingInput =
    item.querySelector(
      ".edit-size-shipping-amount"
    );


  if(
    shippingSelect &&
    shippingInput
  ){

    shippingSelect.addEventListener(
      "change",
      () => {

        if(
          shippingSelect.value === "paid"
        ){

          shippingInput.style.display =
            "block";

        }
        else{

          shippingInput.style.display =
            "none";

          shippingInput.value =
            "";

        }

      }
    );

  }

};


/*==================================================
    SAVE EDITED SIZE
==================================================*/

window.saveEditedSize =
function(index){

  const list =
    document.getElementById(
      "sizeList"
    );

  const item =
    list?.children[index];

  if(!item){

    return;

  }

  const name =
    item
      .querySelector(
        ".edit-size-name"
      )
      ?.value
      .trim();

  const price =
    Number(
      item
        .querySelector(
          ".edit-size-price"
        )
        ?.value || 0
    );

  const shippingMode =
    item
      .querySelector(
        ".edit-size-shipping"
      )
      ?.value ||
    "common";

  const shippingAmountInput =
    item.querySelector(
      ".edit-size-shipping-amount"
    );

  const required =
    item
      .querySelector(
        ".edit-size-required"
      )
      ?.checked ||
    false;


  if(!name){

    showPopup(
      "⚠ Please enter size."
    );

    setTimeout(
      hidePopup,
      1500
    );

    return;

  }


  let shippingAmount =
    null;

  if(
    shippingMode === "free"
  ){

    shippingAmount =
      0;

  }


  if(
    shippingMode === "paid"
  ){

    shippingAmount =
      Number(
        shippingAmountInput?.value ||
        0
      );

    if(
      shippingAmount <= 0
    ){

      showPopup(
        "⚠ Please enter shipping amount."
      );

      setTimeout(
        hidePopup,
        1800
      );

      return;

    }

  }


  sizes[index] = {

    ...sizes[index],

    name,

    price,

    required,

    shippingMode,

    shippingAmount

  };


  renderSizes();

  showPopup(
    "✅ Variant updated"
  );

  setTimeout(
    hidePopup,
    1200
  );

};


/*==================================================
    REMOVE SIZE
==================================================*/

window.removeSize =
function(index){

  if(
    index < 0 ||
    index >= sizes.length
  ){

    return;

  }

  sizes.splice(
    index,
    1
  );

  renderSizes();

};


/*==================================================
    CUSTOM OPTIONS
==================================================*/

window.addCustomOption =
function(){

  const type =
    document
      .getElementById(
        "customType"
      )
      .value;

  const label =
    document
      .getElementById(
        "customLabel"
      )
      .value
      .trim();

  const price =
    Number(
      document
        .getElementById(
          "customPrice"
        )
        .value || 0
    );

  const choicesRaw =
    document
      .getElementById(
        "customChoices"
      )
      .value;

  const required =
    document
      .getElementById(
        "customRequired"
      )
      ?.checked ||
    false;


  if(!label){

    showPopup(
      "⚠ Please enter option label."
    );

    setTimeout(
      hidePopup,
      1500
    );

    return;

  }


  const option = {

    type,

    label,

    price,

    required

  };


  if(
    type === "dropdown"
  ){

    option.choices =
      choicesRaw
        .split(",")
        .map(
          value =>
            value.trim()
        )
        .filter(Boolean);

  }


  customOptions.push(
    option
  );


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


  const requiredInput =
    document.getElementById(
      "customRequired"
    );

  if(requiredInput){

    requiredInput.checked =
      false;

  }

};


/*==================================================
    RENDER CUSTOM OPTIONS
    DRAG + EDIT + REMOVE
==================================================*/

function renderCustomOptions(){

  const list =
    document.getElementById(
      "customList"
    );

  if(!list){

    return;

  }

  list.innerHTML = "";


  customOptions.forEach(
    (option, index) => {

      const div =
        document.createElement(
          "div"
        );

      div.className =
        "custom-option-item";

      div.draggable =
        true;

      div.dataset.index =
        index;


      div.innerHTML = `

        <div
          class="custom-drag-handle"
          title="Drag to reorder"
        >
          ☰
        </div>

        <div class="custom-option-info">

          <strong>
            ${escapeHtml(option.type)}
          </strong>

          <span>
            ${escapeHtml(option.label)}
          </span>

          <span>
            +₹${Number(option.price || 0)}
          </span>

          <span>
            ${
              option.required
              ? "Required"
              : "Optional"
            }
          </span>

          ${
            option.type === "dropdown"
            ?
            `
              <small>
                ${escapeHtml(
                  (option.choices || []).join(", ")
                )}
              </small>
            `
            :
            ""
          }

        </div>

        <div class="custom-option-actions">

          <button
            type="button"
            class="btn-outline"
            onclick="editCustomOption(${index})"
          >
            Edit
          </button>

          <button
            type="button"
            class="btn-outline"
            onclick="removeCustomOption(${index})"
          >
            Remove
          </button>

        </div>

      `;


      /*============================================
          DRAG START
      ============================================*/

      div.addEventListener(
        "dragstart",
        event => {

          event.dataTransfer.effectAllowed =
            "move";

          event.dataTransfer.setData(
            "text/plain",
            String(index)
          );

          div.classList.add(
            "dragging"
          );

        }
      );


      /*============================================
          DRAG END
      ============================================*/

      div.addEventListener(
        "dragend",
        () => {

          div.classList.remove(
            "dragging"
          );

          document
            .querySelectorAll(
              ".custom-option-item"
            )
            .forEach(item => {

              item.classList.remove(
                "drag-over"
              );

            });

        }
      );


      /*============================================
          DRAG OVER
      ============================================*/

      div.addEventListener(
        "dragover",
        event => {

          event.preventDefault();

          event.dataTransfer.dropEffect =
            "move";

          div.classList.add(
            "drag-over"
          );

        }
      );


      /*============================================
          DRAG LEAVE
      ============================================*/

      div.addEventListener(
        "dragleave",
        () => {

          div.classList.remove(
            "drag-over"
          );

        }
      );


      /*============================================
          DROP
      ============================================*/

      div.addEventListener(
        "drop",
        event => {

          event.preventDefault();

          div.classList.remove(
            "drag-over"
          );


          const fromIndex =
            Number(
              event.dataTransfer.getData(
                "text/plain"
              )
            );

          const toIndex =
            Number(
              div.dataset.index
            );


          if(
            Number.isNaN(fromIndex) ||
            Number.isNaN(toIndex)
          ){

            return;

          }


          if(
            fromIndex === toIndex
          ){

            return;

          }


          const moved =
            customOptions.splice(
              fromIndex,
              1
            )[0];


          customOptions.splice(
            toIndex,
            0,
            moved
          );


          renderCustomOptions();

        }
      );


      list.appendChild(
        div
      );

    }
  );

}


/*==================================================
    EDIT CUSTOM OPTION

    IMPORTANT:
    This edits the SAME card.
==================================================*/

window.editCustomOption =
function(index){

  const option =
    customOptions[index];

  if(!option){

    return;

  }


  const list =
    document.getElementById(
      "customList"
    );

  const item =
    list?.children[index];

  if(!item){

    return;

  }


  item.draggable =
    false;


  item.innerHTML = `

    <div class="custom-option-edit-box">

      <select
        class="edit-custom-type"
      >

        <option
          value="text"
          ${option.type === "text" ? "selected" : ""}
        >
          Text
        </option>

        <option
          value="checkbox"
          ${option.type === "checkbox" ? "selected" : ""}
        >
          Checkbox
        </option>

        <option
          value="dropdown"
          ${option.type === "dropdown" ? "selected" : ""}
        >
          Dropdown
        </option>

        <option
          value="image"
          ${option.type === "image" ? "selected" : ""}
        >
          Image
        </option>

      </select>


      <input
        type="text"
        class="edit-custom-label"
        value="${escapeAttribute(option.label)}"
        placeholder="Option label"
      >


      <input
        type="number"
        class="edit-custom-price"
        value="${Number(option.price || 0)}"
        placeholder="Extra price"
        min="0"
      >


      <input
        type="text"
        class="edit-custom-choices"
        value="${escapeAttribute(
          (option.choices || []).join(", ")
        )}"
        placeholder="Dropdown choices (comma separated)"
        ${
          option.type !== "dropdown"
          ? "style='display:none'"
          : ""
        }
      >


      <label>

        <input
          type="checkbox"
          class="edit-custom-required"
          ${option.required ? "checked" : ""}
        >

        Required

      </label>


      <div class="custom-option-actions">

        <button
          type="button"
          class="btn-outline"
          onclick="saveEditedCustomOption(${index})"
        >
          Save
        </button>

        <button
          type="button"
          class="btn-outline"
          onclick="renderCustomOptions()"
        >
          Cancel
        </button>

      </div>

    </div>

  `;


  /*============================================
      TYPE CHANGE
  ============================================*/

  const typeSelect =
    item.querySelector(
      ".edit-custom-type"
    );

  const choicesInput =
    item.querySelector(
      ".edit-custom-choices"
    );


  if(
    typeSelect &&
    choicesInput
  ){

    typeSelect.addEventListener(
      "change",
      () => {

        if(
          typeSelect.value ===
          "dropdown"
        ){

          choicesInput.style.display =
            "block";

        }
        else{

          choicesInput.style.display =
            "none";

          choicesInput.value =
            "";

        }

      }
    );

  }

};


/*==================================================
    SAVE EDITED CUSTOM OPTION
==================================================*/

window.saveEditedCustomOption =
function(index){

  const list =
    document.getElementById(
      "customList"
    );

  const item =
    list?.children[index];

  if(!item){

    return;

  }


  const type =
    item
      .querySelector(
        ".edit-custom-type"
      )
      ?.value ||
    "text";


  const label =
    item
      .querySelector(
        ".edit-custom-label"
      )
      ?.value
      .trim();


  const price =
    Number(
      item
        .querySelector(
          ".edit-custom-price"
        )
        ?.value || 0
    );


  const required =
    item
      .querySelector(
        ".edit-custom-required"
      )
      ?.checked ||
    false;


  const choicesRaw =
    item
      .querySelector(
        ".edit-custom-choices"
      )
      ?.value ||
    "";


  if(!label){

    showPopup(
      "⚠ Please enter option label."
    );

    setTimeout(
      hidePopup,
      1500
    );

    return;

  }


  const updated = {

    ...customOptions[index],

    type,

    label,

    price,

    required

  };


  if(
    type === "dropdown"
  ){

    updated.choices =
      choicesRaw
        .split(",")
        .map(
          value =>
            value.trim()
        )
        .filter(Boolean);

  }
  else{

    delete updated.choices;

  }


  customOptions[index] =
    updated;


  renderCustomOptions();


  showPopup(
    "✅ Custom option updated"
  );

  setTimeout(
    hidePopup,
    1200
  );

};


/*==================================================
    REMOVE CUSTOM OPTION
==================================================*/

window.removeCustomOption =
function(index){

  if(
    index < 0 ||
    index >= customOptions.length
  ){

    return;

  }

  customOptions.splice(
    index,
    1
  );

  renderCustomOptions();

};


/*==================================================
    RELATED DESIGNS
==================================================*/

async function loadDesignProducts(){

  try{

    const snap =
      await getDocs(
        collection(
          db,
          "products"
        )
      );

    allProducts = [];

    snap.forEach(
      docSnap => {

        allProducts.push({

          id:
            docSnap.id,

          ...docSnap.data()

        });

      }
    );


    renderDesignList(
      allProducts
    );

  }

  catch(error){

    console.error(
      "Loading design products error:",
      error
    );

  }

}


function renderDesignList(list){

  const box =
    document.getElementById(
      "designList"
    );

  if(!box){

    return;

  }

  box.innerHTML = "";


  list.forEach(product => {

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
        ${checked ? "checked" : ""}
        onchange="
          toggleDesign(
            '${product.id}'
          )
        "
      >

      <img
        src="${
          product.images?.[0] || ""
        }"
      >

      <span>
        ${escapeHtml(
          product.name || ""
        )}
      </span>

    `;


    box.appendChild(row);

  });

}


window.toggleDesign =
function(productId){

  if(
    relatedDesigns.includes(
      productId
    )
  ){

    relatedDesigns =
      relatedDesigns.filter(
        id => id !== productId
      );

  }
  else{

    relatedDesigns.push(
      productId
    );

  }

};


window.filterDesigns =
function(){

  const searchInput =
    document.getElementById(
      "designSearch"
    );

  const q =
    searchInput
    ?
    searchInput.value.toLowerCase()
    :
    "";


  const filtered =
    allProducts.filter(
      product =>

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


loadDesignProducts();


/*==================================================
    TAGS
==================================================*/

async function loadTags(){

  if(!tagBox){

    return;

  }

  try{

    const snap =
      await getDocs(
        collection(
          db,
          "tags"
        )
      );

    tagBox.innerHTML = "";


    snap.forEach(
      docSnap => {

        const tag =
          docSnap.data();

        const row =
          document.createElement(
            "div"
          );

        row.className =
          "design-item";


        row.innerHTML = `

          <input
            type="checkbox"
            onchange="
              toggleTag(
                '${escapeAttribute(tag.slug)}',
                this.checked
              )
            "
          >

          <span>
            ${escapeHtml(
              tag.name || ""
            )}
          </span>

        `;


        tagBox.appendChild(row);

      }
    );

  }

  catch(error){

    console.error(
      "Tags loading error:",
      error
    );

  }

}


window.toggleTag =
function(slug, checked){

  if(checked){

    if(
      !selectedTags.includes(slug)
    ){

      selectedTags.push(slug);

    }

  }
  else{

    selectedTags =
      selectedTags.filter(
        tag => tag !== slug
      );

  }

};


loadTags();


/*==================================================
    STORAGE GALLERY PICKER
==================================================*/

window.openGalleryPicker =
function(){

  const picker =
    document.getElementById(
      "galleryPicker"
    );

  if(!picker){

    return;

  }

  picker.classList.remove(
    "hidden"
  );


  setTimeout(
    () => {

      loadGalleryFolder(
        "product-images"
      );

    },
    10
  );

};


/*==================================================
    LOAD GALLERY FOLDER
==================================================*/

async function loadGalleryFolder(path){

  try{

    currentGalleryPath =
      path;


    updateGalleryBreadcrumbs(
      path
    );


    const grid =
      document.getElementById(
        "galleryPickerGrid"
      );

    if(!grid){

      return;

    }

    grid.innerHTML = "";


    const folderRef =
      ref(
        storage,
        path
      );


    const result =
      await listAll(
        folderRef
      );


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
          () =>
            loadGalleryFolder(
              folder.fullPath
            );


        grid.appendChild(div);

      }
    );


    /* IMAGES */

    for(
      const file of result.items
    ){

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
        )
        ?
        "checked"
        :
        "";


      div.innerHTML = `

        <input
          type="checkbox"
          class="gallery-check"
          ${checked}
        >

        <img
          src="${escapeAttribute(url)}"
        >

      `;


      const checkbox =
        div.querySelector(
          "input"
        );


      checkbox.onchange =
        () => {

          if(
            checkbox.checked
          ){

            if(
              !gallerySelected.includes(
                url
              )
            ){

              gallerySelected.push(
                url
              );

            }

          }
          else{

            gallerySelected =
              gallerySelected.filter(
                item => item !== url
              );

          }

        };


      grid.appendChild(div);

    }

  }

  catch(error){

    console.error(
      "Gallery loading error:",
      error
    );


    showPopup(
      "Unable to load gallery."
    );


    setTimeout(
      hidePopup,
      1800
    );

  }

}


/*==================================================
    GALLERY BREADCRUMBS
==================================================*/

function updateGalleryBreadcrumbs(path){

  let breadcrumbs =
    document.getElementById(
      "galleryBreadcrumbs"
    );


  if(!breadcrumbs){

    const picker =
      document.getElementById(
        "galleryPicker"
      );

    if(!picker){

      return;

    }


    breadcrumbs =
      document.createElement(
        "div"
      );


    breadcrumbs.id =
      "galleryBreadcrumbs";

    breadcrumbs.className =
      "gallery-breadcrumbs";


    const grid =
      document.getElementById(
        "galleryPickerGrid"
      );


    picker.insertBefore(
      breadcrumbs,
      grid
    );

  }


  breadcrumbs.innerHTML = "";


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

  breadcrumbs.appendChild(home);


  let current =
    "product-images";


  parts.forEach(part => {

    current +=
      "/" + part;


    const span =
      document.createElement(
        "span"
      );

    span.innerText =
      " / " +
      decodeURIComponent(part);

    span.style.cursor =
      "pointer";


    const pathCopy =
      current;


    span.onclick =
      () =>
        loadGalleryFolder(
          pathCopy
        );


    breadcrumbs.appendChild(span);

  });

}


/*==================================================
    CLOSE GALLERY
==================================================*/

window.closeGalleryPicker =
function(){

  const picker =
    document.getElementById(
      "galleryPicker"
    );

  if(picker){

    picker.classList.add(
      "hidden"
    );

  }

};


/*==================================================
    ADD SELECTED GALLERY IMAGES
==================================================*/

window.addSelectedImages =
function(){

  if(
    !gallerySelected.length
  ){

    alert(
      "Select images first"
    );

    return;

  }


  gallerySelected.forEach(url => {

    const alreadyExists =
      productImages.some(
        image =>
          image.type === "url" &&
          image.url === url
      );


    if(!alreadyExists){

      productImages.push({

        type: "url",

        url

      });

    }

  });


  gallerySelected = [];


  renderImagePreview();


  const picker =
    document.getElementById(
      "galleryPicker"
    );


  if(picker){

    picker.classList.add(
      "hidden"
    );

  }

};


/*==================================================
    SAVE PRODUCT
==================================================*/

window.saveProduct =
async () => {

  const name =
    nameInput
    ?
    nameInput.value.trim()
    :
    "";


  const price =
    priceInput
    ?
    priceInput.value
    :
    "";


  const selectedOption =
    catSelect?.options[
      catSelect.selectedIndex
    ];


  let categoryId =
    null;

  let subCategoryId =
    null;


  if(
    selectedOption?.dataset.type ===
    "main"
  ){

    categoryId =
      selectedOption.value;

  }


  if(
    selectedOption?.dataset.type ===
    "sub"
  ){

    subCategoryId =
      selectedOption.value;

    categoryId =
      selectedOption.dataset.parent;

  }


  const isBestseller =
    bestsellerCheckbox?.checked ||
    false;


  /* REQUIRED */

  if(
    !name ||
    !price ||
    !selectedOption?.value
  ){

    showPopup(
      "⚠ Fill all required fields"
    );

    setTimeout(
      hidePopup,
      1500
    );

    return;

  }


  /* COMMON SHIPPING */

  const commonShippingType =
    shippingType?.value ||
    "free";


  let commonShippingAmount =
    0;


  if(
    commonShippingType ===
    "paid"
  ){

    commonShippingAmount =
      Number(
        shippingAmount?.value ||
        0
      );


    if(
      commonShippingAmount <= 0
    ){

      showPopup(
        "⚠ Please enter common shipping amount."
      );

      setTimeout(
        hidePopup,
        1800
      );

      return;

    }

  }


  try{

    /*============================================
        UPLOAD PRODUCT IMAGES
    ============================================*/

    showPopup(
      "Uploading images..."
    );


    const uploadedImages = [];


    /*
      IMPORTANT:

      We loop through productImages
      in the exact drag/drop order.

      Therefore Firestore images[]
      gets the same order as the UI.
    */

    for(
      const image of productImages
    ){

      if(
        image.type === "url"
      ){

        uploadedImages.push(
          image.url
        );

        continue;

      }


      if(
        image.type === "file"
      ){

        const file =
          image.file;


        const imgRef =
          ref(
            storage,
            `products/${Date.now()}-${Math.random()
              .toString(36)
              .substring(2, 8)}-${file.name}`
          );


        await uploadBytes(
          imgRef,
          file
        );


        const url =
          await getDownloadURL(
            imgRef
          );


        uploadedImages.push(
          url
        );

      }

    }


    /*============================================
        PAYMENT SETTINGS
    ============================================*/

    const paymentSettings = {

      online: {

        enabled:
          allowOnline?.checked ||
          false,

        discountType:
          onlineDiscountType?.value ||
          "none",

        discountValue:
          Number(
            onlineDiscountValue?.value ||
            0
          )

      },


      cod: {

        enabled:
          allowCOD?.checked ||
          false,

        discountType:
          codDiscountType?.value ||
          "none",

        discountValue:
          Number(
            codDiscountValue?.value ||
            0
          )

      },


      advance: {

        enabled:
          allowAdvance?.checked ||
          false,

        discountType:
          advanceDiscountType?.value ||
          "none",

        discountValue:
          Number(
            advanceDiscountValue?.value ||
            0
          ),

        type:
          advanceType?.value ||
          "percent",

        value:
          Number(
            advanceValue?.value ||
            0
          )

      }

    };


    /*============================================
        SHIPPING
    ============================================*/

    const productShipping = {

      type:
        commonShippingType,

      amount:
        commonShippingAmount

    };


    /*============================================
        SAVE PRODUCT
    ============================================*/

    showPopup(
      "Saving product..."
    );


    const docRef =
      await addDoc(
        collection(
          db,
          "products"
        ),
        {

          name,

          description:
            descInput?.value ||
            "",

          basePrice:
            Number(price),

          salePrice:
            Number(
              salePriceInput?.value ||
              price
            ),

          inStock:
            stockStatus
            ?
            stockStatus.value ===
              "true"
            :
            true,

          categoryId,

          subCategoryId,

          /*
            Images are saved in the
            exact drag/drop order.
          */

          images:
            uploadedImages,


          /* VARIANTS */

          variants: {

            colors,

            sizes

          },


          /* SHIPPING */

          shipping:
            productShipping,


          /* CUSTOM OPTIONS */

          customOptions,


          /* PAYMENT */

          paymentSettings,


          /* RELATED */

          relatedDesigns,


          /* TAGS */

          tags:
            selectedTags,


          /* BESTSELLER */

          isBestseller,


          /* CREATED */

          createdAt:
            Date.now()

        }
      );


    const newId =
      docRef.id;


    /*============================================
        BIDIRECTIONAL RELATED DESIGNS
    ============================================*/

    for(
      const rid of relatedDesigns
    ){

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


      if(
        snap.exists()
      ){

        const data =
          snap.data();


        const arr =
          Array.isArray(
            data.relatedDesigns
          )
          ?
          [
            ...data.relatedDesigns
          ]
          :
          [];


        if(
          !arr.includes(newId)
        ){

          arr.push(newId);


          await updateDoc(
            refDoc,
            {
              relatedDesigns:
                arr
            }
          );

        }

      }

    }


    /* SUCCESS */

    showPopup(
      "✅ Product saved"
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

  catch(error){

    console.error(
      "Save product error:",
      error
    );


    showPopup(
      "❌ " +
      (
        error?.message ||
        "Unable to save product."
      )
    );

  }

};


/*==================================================
    ESCAPE HTML
==================================================*/

function escapeHtml(value){

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


/*==================================================
    ESCAPE ATTRIBUTE
==================================================*/

function escapeAttribute(value){

  return escapeHtml(value);

}