import { db, storage } from "./firebase.js";

import {
  collection,
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
    PRODUCT ID
==================================================*/

const params =
  new URLSearchParams(
    window.location.search
  );

const productId =
  params.get("id");


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
    SHIPPING
==================================================*/

const shippingType =
  document.getElementById("shippingType");

const shippingAmount =
  document.getElementById("shippingAmount");

const commonShippingAmountBox =
  document.getElementById(
    "commonShippingAmountBox"
  );

const sizeShippingType =
  document.getElementById(
    "sizeShippingType"
  );

const sizeShippingAmount =
  document.getElementById(
    "sizeShippingAmount"
  );

const sizeShippingAmountBox =
  document.getElementById(
    "sizeShippingAmountBox"
  );


/*==================================================
    TAGS / BESTSELLER
==================================================*/

const tagBox =
  document.getElementById(
    "tagCheckboxes"
  );

const bestsellerCheckbox =
  document.getElementById(
    "isBestseller"
  );


/*==================================================
    PAYMENT
==================================================*/

const allowOnline =
  document.getElementById(
    "allowOnline"
  );

const allowCOD =
  document.getElementById(
    "allowCOD"
  );

const allowAdvance =
  document.getElementById(
    "allowAdvance"
  );

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


/*==================================================
    STATE
==================================================*/

let colors = [];

let sizes = [];

let customOptions = [];

let productImages = [];

let gallerySelected = [];

let currentGalleryPath =
  "product-images";

let relatedDesigns = [];

let originalRelatedDesigns = [];

let allProducts = [];

let selectedTags = [];

let originalProduct = null;


/*==================================================
    POPUP
==================================================*/

function showPopup(msg){

  const p =
    document.getElementById(
      "popup"
    );

  if(!p){

    return;

  }

  p.innerText =
    msg;

  p.classList.remove(
    "hidden"
  );

}


function hidePopup(){

  const p =
    document.getElementById(
      "popup"
    );

  if(p){

    p.classList.add(
      "hidden"
    );

  }

}


/*==================================================
    ACCORDION
==================================================*/

window.toggleSection =
function(id){

  const section =
    document.getElementById(id);

  if(section){

    section.classList.toggle(
      "hidden"
    );

  }

};


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

      shippingAmount.value =
        "";

    }

  }

}


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

      sizeShippingAmount.value =
        "";

    }

  }

}


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
          collection(
            db,
            "categories"
          ),
          orderBy("order")
        )
      );

    const categories = [];

    snap.forEach(
      docSnap => {

        categories.push({

          id:
            docSnap.id,

          ...docSnap.data()

        });

      }
    );


    const mains =
      categories.filter(
        c => !c.parentId
      );


    mains.forEach(
      main => {

        const opt =
          document.createElement(
            "option"
          );

        opt.value =
          main.id;

        opt.textContent =
          main.name;

        opt.dataset.type =
          "main";

        catSelect.appendChild(
          opt
        );


        const subs =
          categories.filter(
            c =>
              c.parentId ===
              main.id
          );


        subs.forEach(
          sub => {

            const subOpt =
              document.createElement(
                "option"
              );

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

          }
        );

      }
    );


    /*
      Set category AFTER
      categories are loaded.
    */

    if(originalProduct){

      if(
        originalProduct.subCategoryId
      ){

        catSelect.value =
          originalProduct.subCategoryId;

      }
      else if(
        originalProduct.categoryId
      ){

        catSelect.value =
          originalProduct.categoryId;

      }

    }

  }

  catch(error){

    console.error(
      "Category loading error:",
      error
    );

  }

}


/*==================================================
    IMAGE INPUT
==================================================*/

if(imagesInput){

  imagesInput.addEventListener(
    "change",
    event => {

      const files =
        Array.from(
          event.target.files || []
        );


      files.forEach(
        file => {

          productImages.push({

            type:
              "file",

            file,

            preview:
              URL.createObjectURL(
                file
              )

          });

        }
      );


      renderImagePreview();


      imagesInput.value =
        "";

    }
  );

}


/*==================================================
    IMAGE PREVIEW
==================================================*/

function renderImagePreview(){

  if(!preview){

    return;

  }

  preview.innerHTML =
    "";


  productImages.forEach(
    (image, index) => {

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


      if(
        image.type === "file"
      ){

        img.src =
          image.preview;

      }
      else{

        img.src =
          image.url;

      }


      img.draggable =
        false;


      const del =
        document.createElement(
          "button"
        );

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


      card.appendChild(
        img
      );

      card.appendChild(
        del
      );


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
            .forEach(
              item =>
                item.classList.remove(
                  "drag-over"
                )
            );

        }
      );


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


      card.addEventListener(
        "dragleave",
        () => {

          card.classList.remove(
            "drag-over"
          );

        }
      );


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
            Number.isNaN(toIndex) ||
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


      preview.appendChild(
        card
      );

    }
  );

}


/*==================================================
    COLORS
==================================================*/

window.addColor =
function(){

  const name =
    document
      .getElementById(
        "colorName"
      )
      ?.value
      .trim();


  const price =
    Number(
      document
        .getElementById(
          "colorPrice"
        )
        ?.value || 0
    );


  const required =
    document
      .getElementById(
        "colorRequired"
      )
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
  ).value =
    "";


  document.getElementById(
    "colorPrice"
  ).value =
    "";


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

  list.innerHTML =
    "";


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


      list.appendChild(
        div
      );

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

window.addSize =
function(){

  const name =
    document
      .getElementById(
        "sizeName"
      )
      ?.value
      .trim();


  const price =
    Number(
      document
        .getElementById(
          "sizePrice"
        )
        ?.value || 0
    );


  const required =
    document
      .getElementById(
        "sizeRequired"
      )
      ?.checked ||
    false;


  const shippingMode =
    document
      .getElementById(
        "sizeShippingType"
      )
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
  ).value =
    "";


  document.getElementById(
    "sizePrice"
  ).value =
    "";


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


  list.innerHTML =
    "";


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
        size.shippingMode ===
        "free"
      ){

        shippingText =
          "Free Shipping";

      }


      if(
        size.shippingMode ===
        "paid"
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


      list.appendChild(
        div
      );

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

      <select class="edit-size-shipping">

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
          shippingSelect.value ===
          "paid"
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
    NORMALIZE DROPDOWN
==================================================*/

function normalizeDropdownChoices(
  choices
){

  if(
    !Array.isArray(choices)
  ){

    return [];

  }


  return choices
    .map(
      choice => {

        if(
          typeof choice ===
          "string"
        ){

          return {

            name:
              choice,

            price:
              0

          };

        }


        return {

          name:
            String(
              choice?.name ??
              choice?.value ??
              ""
            ),

          price:
            Number(
              choice?.price || 0
            )

        };

      }
    )
    .filter(
      choice =>
        choice.name
    );

}


/*==================================================
    CUSTOM OPTION
==================================================*/

function getDropdownNames(
  value
){

  return String(
    value || ""
  )
    .split(",")
    .map(
      item =>
        item.trim()
    )
    .filter(Boolean);

}


/*==================================================
    RENDER CUSTOM OPTIONS
==================================================*/

function renderCustomOptions(){

  const list =
    document.getElementById(
      "customList"
    );

  if(!list){

    return;

  }


  list.innerHTML =
    "";


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


      let priceHTML =
        "";


      if(
        option.type !==
        "dropdown"
      ){

        priceHTML = `

          <span>
            +₹${Number(
              option.price || 0
            )}
          </span>

        `;

      }


      let choicesHTML =
        "";


      if(
        option.type ===
        "dropdown"
      ){

        const choices =
          normalizeDropdownChoices(
            option.choices
          );


        choicesHTML = `

          <div
            class="custom-dropdown-choice-list"
            style="
              margin-top:8px;
              display:flex;
              flex-direction:column;
              gap:5px;
            "
          >

            ${
              choices
                .map(
                  choice => `

                    <small
                      style="
                        display:flex;
                        justify-content:space-between;
                        gap:10px;
                        padding:5px 7px;
                        border-radius:6px;
                        background:rgba(255,255,255,0.05);
                        color:#bbb;
                      "
                    >

                      <span>
                        ${escapeHtml(
                          choice.name
                        )}
                      </span>

                      <strong
                        style="color:#fff;"
                      >
                        +₹${Number(
                          choice.price || 0
                        )}
                      </strong>

                    </small>

                  `
                )
                .join("")
            }

          </div>

        `;

      }


      div.innerHTML = `

        <div
          class="custom-drag-handle"
          title="Drag to reorder"
        >
          ☰
        </div>

        <div class="custom-option-info">

          <strong>
            ${escapeHtml(
              option.type
            )}
          </strong>

          <span>
            ${escapeHtml(
              option.label
            )}
          </span>

          ${priceHTML}

          <span>
            ${
              option.required
              ? "Required"
              : "Optional"
            }
          </span>

          ${choicesHTML}

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

          document
            .querySelectorAll(
              ".custom-option-item"
            )
            .forEach(
              item =>
                item.classList.remove(
                  "drag-over"
                )
            );

        }
      );


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


  const normalizedChoices =
    normalizeDropdownChoices(
      option.choices
    );


  const choicesNames =
    normalizedChoices
      .map(
        choice =>
          choice.name
      )
      .join(", ");


  /*
    IMPORTANT:

    Prices are mapped by option NAME.

    This prevents a price from moving
    to another option when the user
    changes/reorders the comma-separated
    dropdown choices.
  */

  const choicePriceMap =
    new Map();


  normalizedChoices.forEach(
    choice => {

      choicePriceMap.set(
        choice.name,
        Number(
          choice.price || 0
        )
      );

    }
  );


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
        value="${escapeAttribute(
          option.label
        )}"
        placeholder="Option label"
      >


      <input
        type="number"
        class="edit-custom-price"
        value="${Number(
          option.price || 0
        )}"
        placeholder="Extra price"
        min="0"
        step="0.01"
        ${
          option.type === "dropdown"
          ? "style='display:none'"
          : ""
        }
      >


      <input
        type="text"
        class="edit-custom-choices"
        value="${escapeAttribute(
          choicesNames
        )}"
        placeholder="Dropdown choices (comma separated)"
        ${
          option.type !== "dropdown"
          ? "style='display:none'"
          : ""
        }
      >


      <div
        class="edit-custom-choice-prices"
        style="
          width:100%;
          display:${
            option.type === "dropdown"
            ? "block"
            : "none"
          };
        "
      ></div>


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


  const typeSelect =
    item.querySelector(
      ".edit-custom-type"
    );


  const priceInput =
    item.querySelector(
      ".edit-custom-price"
    );


  const choicesInput =
    item.querySelector(
      ".edit-custom-choices"
    );


  const choicePriceEditor =
    item.querySelector(
      ".edit-custom-choice-prices"
    );


  /*================================================
      RENDER CHOICE PRICE FIELDS
  =================================================*/

  function renderEditChoicePrices(){

    if(!choicePriceEditor){

      return;

    }


    const names =
      getDropdownNames(
        choicesInput?.value
      );


    if(!names.length){

      choicePriceEditor.innerHTML =
        "";

      choicePriceEditor.style.display =
        "none";

      return;

    }


    choicePriceEditor.style.display =
      "block";


    choicePriceEditor.innerHTML = `

      <div
        style="
          font-size:13px;
          font-weight:600;
          color:#ddd;
          margin-bottom:8px;
        "
      >
        Dropdown option prices
      </div>

    `;


    names.forEach(
      name => {

        /*
          First try exact name match.
          This is the important difference
          from index-only matching.
        */

        const price =
          choicePriceMap.has(name)
          ?
          Number(
            choicePriceMap.get(name) || 0
          )
          :
          0;


        const row =
          document.createElement(
            "div"
          );


        row.style.cssText = `
          display:grid;
          grid-template-columns:minmax(0,1fr) 110px;
          gap:8px;
          align-items:center;
          margin-bottom:8px;
        `;


        row.innerHTML = `

          <div
            style="
              min-width:0;
              padding:9px 10px;
              border:1px solid rgba(255,255,255,0.10);
              border-radius:9px;
              background:#161a23;
              color:#fff;
              font-size:13px;
              overflow:hidden;
              text-overflow:ellipsis;
              white-space:nowrap;
            "
          >
            ${escapeHtml(name)}
          </div>

          <input
            type="number"
            class="edit-custom-choice-price"
            data-choice-name="${escapeAttribute(name)}"
            value="${price}"
            min="0"
            step="0.01"
            placeholder="Price"
            style="
              width:100%;
              margin:0;
              padding:9px 10px;
              border-radius:9px;
              background:#11141b;
              border:1px solid rgba(255,255,255,0.12);
              color:#fff;
              font-size:13px;
              outline:none;
            "
          >

        `;


        choicePriceEditor.appendChild(
          row
        );

      }
    );


    /*
      Update map whenever the user
      changes a price.
    */

    choicePriceEditor
      .querySelectorAll(
        ".edit-custom-choice-price"
      )
      .forEach(
        input => {

          input.addEventListener(
            "input",
            () => {

              const name =
                input.dataset.choiceName;


              choicePriceMap.set(
                name,
                Number(
                  input.value || 0
                )
              );

            }
          );

        }
      );

  }


  if(
    option.type === "dropdown"
  ){

    renderEditChoicePrices();

  }


  /*================================================
      TYPE CHANGE
  =================================================*/

  if(typeSelect){

    typeSelect.addEventListener(
      "change",
      () => {

        if(
          typeSelect.value ===
          "dropdown"
        ){

          if(priceInput){

            priceInput.style.display =
              "none";

            priceInput.value =
              "";

          }


          if(choicesInput){

            choicesInput.style.display =
              "block";

          }


          /*
            Keep the old prices map.
            Newly added choices get ₹0.
          */

          renderEditChoicePrices();

        }
        else{

          if(priceInput){

            priceInput.style.display =
              "block";

          }


          if(choicesInput){

            choicesInput.style.display =
              "none";

          }


          if(choicePriceEditor){

            choicePriceEditor.innerHTML =
              "";

            choicePriceEditor.style.display =
              "none";

          }

        }

      }
    );

  }


  /*================================================
      CHOICE NAME CHANGE
  =================================================*/

  if(choicesInput){

    choicesInput.addEventListener(
      "input",
      () => {

        /*
          Before rebuilding, read the currently
          visible price fields into the map.
        */

        item
          .querySelectorAll(
            ".edit-custom-choice-price"
          )
          .forEach(
            input => {

              const name =
                input.dataset.choiceName;


              if(name){

                choicePriceMap.set(
                  name,
                  Number(
                    input.value || 0
                  )
                );

              }

            }
          );


        renderEditChoicePrices();

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


  const required =
    item
      .querySelector(
        ".edit-custom-required"
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


  const updated = {

    ...customOptions[index],

    type,

    label,

    required

  };


  /*================================================
      DROPDOWN
  =================================================*/

  if(
    type === "dropdown"
  ){

    const choicesInput =
      item.querySelector(
        ".edit-custom-choices"
      );


    const names =
      getDropdownNames(
        choicesInput?.value
      );


    if(!names.length){

      showPopup(
        "⚠ Please enter dropdown options."
      );

      setTimeout(
        hidePopup,
        1800
      );

      return;

    }


    const priceInputs =
      Array.from(
        item.querySelectorAll(
          ".edit-custom-choice-price"
        )
      );


    /*
      Build prices by NAME.
    */

    const priceMap =
      new Map();


    priceInputs.forEach(
      input => {

        const name =
          input.dataset.choiceName;


        if(name){

          priceMap.set(
            name,
            Number(
              input.value || 0
            )
          );

        }

      }
    );


    updated.choices =
      names.map(
        name => {

          return {

            name,

            price:
              Number(
                priceMap.get(name) ||
                0
              )

          };

        }
      );


    /*
      Dropdown does NOT use
      one common price.
    */

    updated.price =
      0;

  }
  else{

    const price =
      Number(
        item
          .querySelector(
            ".edit-custom-price"
          )
          ?.value || 0
      );


    updated.price =
      price;


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


function renderDesignList(
  list
){

  const box =
    document.getElementById(
      "designList"
    );

  if(!box){

    return;

  }


  box.innerHTML =
    "";


  list.forEach(
    product => {

      /*
        Don't show current product
        as a related design.
      */

      if(
        product.id === productId
      ){

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
          ${checked ? "checked" : ""}
          onchange="
            toggleDesign(
              '${escapeAttribute(
                product.id
              )}'
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


      box.appendChild(
        row
      );

    }
  );

}


window.toggleDesign =
function(productIdValue){

  if(
    relatedDesigns.includes(
      productIdValue
    )
  ){

    relatedDesigns =
      relatedDesigns.filter(
        id =>
          id !== productIdValue
      );

  }
  else{

    relatedDesigns.push(
      productIdValue
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
    searchInput.value
      .toLowerCase()
    :
    "";


  const filtered =
    allProducts.filter(
      product =>

        product.id !==
          productId &&

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


    tagBox.innerHTML =
      "";


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


        const checked =
          selectedTags.includes(
            tag.slug
          );


        row.innerHTML = `

          <input
            type="checkbox"
            ${checked ? "checked" : ""}
            onchange="
              toggleTag(
                '${escapeAttribute(
                  tag.slug
                )}',
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


        tagBox.appendChild(
          row
        );

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
      !selectedTags.includes(
        slug
      )
    ){

      selectedTags.push(
        slug
      );

    }

  }
  else{

    selectedTags =
      selectedTags.filter(
        tag =>
          tag !== slug
      );

  }

};


/*==================================================
    STORAGE GALLERY
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


async function loadGalleryFolder(
  path
){

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


    grid.innerHTML =
      "";


    const folderRef =
      ref(
        storage,
        path
      );


    const result =
      await listAll(
        folderRef
      );


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


        grid.appendChild(
          div
        );

      }
    );


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

function updateGalleryBreadcrumbs(
  path
){

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


  breadcrumbs.innerHTML =
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


  breadcrumbs.appendChild(
    home
  );


  let current =
    "product-images";


  parts.forEach(
    part => {

      current +=
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
        current;


      span.onclick =
        () =>
          loadGalleryFolder(
            pathCopy
          );


      breadcrumbs.appendChild(
        span
      );

    }
  );

}


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


  gallerySelected.forEach(
    url => {

      const exists =
        productImages.some(
          image =>
            image.type === "url" &&
            image.url === url
        );


      if(!exists){

        productImages.push({

          type:
            "url",

          url

        });

      }

    }
  );


  gallerySelected =
    [];


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
    LOAD PRODUCT
==================================================*/

async function loadProduct(){

  if(!productId){

    showPopup(
      "❌ Product ID missing."
    );

    return;

  }


  try{

    showPopup(
      "Loading product..."
    );


    const productRef =
      doc(
        db,
        "products",
        productId
      );


    const snap =
      await getDoc(
        productRef
      );


    if(
      !snap.exists()
    ){

      showPopup(
        "❌ Product not found."
      );

      return;

    }


    originalProduct =
      snap.data();


    /*============================================
        BASIC
    ============================================*/

    if(nameInput){

      nameInput.value =
        originalProduct.name ||
        "";

    }


    if(descInput){

      descInput.value =
        originalProduct.description ||
        "";

    }


    if(priceInput){

      priceInput.value =
        originalProduct.basePrice ??
        "";

    }


    if(salePriceInput){

      salePriceInput.value =
        originalProduct.salePrice ??
        originalProduct.basePrice ??
        "";

    }


    if(stockStatus){

      stockStatus.value =
        originalProduct.inStock === false
        ? "false"
        : "true";

    }


    /*============================================
        IMAGES
    ============================================*/

    productImages =
      Array.isArray(
        originalProduct.images
      )
      ?
      originalProduct.images.map(
        url => ({

          type:
            "url",

          url

        })
      )
      :
      [];


    renderImagePreview();


    /*============================================
        VARIANTS
    ============================================*/

    const variants =
      originalProduct.variants ||
      {};


    colors =
      Array.isArray(
        variants.colors
      )
      ?
      variants.colors.map(
        color => ({

          name:
            String(
              color?.name || ""
            ),

          price:
            Number(
              color?.price || 0
            ),

          required:
            Boolean(
              color?.required
            )

        })
      )
      :
      [];


    sizes =
      Array.isArray(
        variants.sizes
      )
      ?
      variants.sizes.map(
        size => ({

          name:
            String(
              size?.name || ""
            ),

          price:
            Number(
              size?.price || 0
            ),

          required:
            Boolean(
              size?.required
            ),

          shippingMode:
            size?.shippingMode ||
            "common",

          shippingAmount:
            size?.shippingAmount ??
            null

        })
      )
      :
      [];


    renderColors();

    renderSizes();


    /*============================================
        CUSTOM OPTIONS
    ============================================*/

    customOptions =
      Array.isArray(
        originalProduct.customOptions
      )
      ?
      originalProduct.customOptions.map(
        option => {

          const normalized = {

            ...option,

            type:
              option?.type ||
              "text",

            label:
              String(
                option?.label || ""
              ),

            price:
              Number(
                option?.price || 0
              ),

            required:
              Boolean(
                option?.required
              )

          };


          if(
            normalized.type ===
            "dropdown"
          ){

            normalized.choices =
              normalizeDropdownChoices(
                option?.choices
              );

            normalized.price =
              0;

          }
          else{

            delete normalized.choices;

          }


          return normalized;

        }
      )
      :
      [];


    renderCustomOptions();


    /*============================================
        SHIPPING
    ============================================*/

    const shipping =
      originalProduct.shipping ||
      {};


    if(shippingType){

      shippingType.value =
        shipping.type ||
        "free";

    }


    if(shippingAmount){

      shippingAmount.value =
        shipping.amount ??
        "";

    }


    updateCommonShippingUI();


    /*============================================
        PAYMENT
    ============================================*/

    const payment =
      originalProduct.paymentSettings ||
      {};


    const online =
      payment.online ||
      {};


    const cod =
      payment.cod ||
      {};


    const advance =
      payment.advance ||
      {};


    if(allowOnline){

      allowOnline.checked =
        Boolean(
          online.enabled
        );

    }


    if(onlineDiscountType){

      onlineDiscountType.value =
        online.discountType ||
        "none";

    }


    if(onlineDiscountValue){

      onlineDiscountValue.value =
        online.discountValue ??
        0;

    }


    if(allowCOD){

      allowCOD.checked =
        Boolean(
          cod.enabled
        );

    }


    if(codDiscountType){

      codDiscountType.value =
        cod.discountType ||
        "none";

    }


    if(codDiscountValue){

      codDiscountValue.value =
        cod.discountValue ??
        0;

    }


    if(allowAdvance){

      allowAdvance.checked =
        Boolean(
          advance.enabled
        );

    }


    if(advanceDiscountType){

      advanceDiscountType.value =
        advance.discountType ||
        "none";

    }


    if(advanceDiscountValue){

      advanceDiscountValue.value =
        advance.discountValue ??
        0;

    }


    if(advanceType){

      advanceType.value =
        advance.type ||
        "percent";

    }


    if(advanceValue){

      advanceValue.value =
        advance.value ??
        0;

    }


    /*============================================
        RELATED
    ============================================*/

    relatedDesigns =
      Array.isArray(
        originalProduct.relatedDesigns
      )
      ?
      [
        ...originalProduct.relatedDesigns
      ]
      :
      [];


    originalRelatedDesigns =
      [
        ...relatedDesigns
      ];


    renderDesignList(
      allProducts
    );


    /*============================================
        TAGS
    ============================================*/

    selectedTags =
      Array.isArray(
        originalProduct.tags
      )
      ?
      [
        ...originalProduct.tags
      ]
      :
      [];


    await loadTags();


    /*============================================
        BESTSELLER
    ============================================*/

    if(bestsellerCheckbox){

      bestsellerCheckbox.checked =
        Boolean(
          originalProduct.isBestseller
        );

    }


    /*
      Categories must be loaded AFTER
      originalProduct is available.
    */

    await loadCategories();


    updateSizeShippingUI();


    hidePopup();

  }

  catch(error){

    console.error(
      "Load product error:",
      error
    );


    showPopup(
      "❌ " +
      (
        error?.message ||
        "Unable to load product."
      )
    );

  }

}


/*==================================================
    SAVE / UPDATE PRODUCT
==================================================*/

window.saveProduct =
async function(){

  if(!productId){

    showPopup(
      "❌ Product ID missing."
    );

    return;

  }


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


  /*============================================
      COMMON SHIPPING
  ============================================*/

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

    /*==========================================
        UPLOAD NEW FILE IMAGES
    ==========================================*/

    showPopup(
      "Uploading images..."
    );


    const uploadedImages = [];


    /*
      Keep EXACT current image order.
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


    /*==========================================
        PAYMENT
    ==========================================*/

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


    /*==========================================
        SHIPPING
    ==========================================*/

    const productShipping = {

      type:
        commonShippingType,

      amount:
        commonShippingAmount

    };


    /*==========================================
        UPDATE PRODUCT
    ==========================================*/

    showPopup(
      "Saving product..."
    );


    const productRef =
      doc(
        db,
        "products",
        productId
      );


    await updateDoc(
      productRef,
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

        images:
          uploadedImages,


        variants: {

          colors,

          sizes

        },


        shipping:
          productShipping,


        customOptions,


        paymentSettings,


        relatedDesigns,


        tags:
          selectedTags,


        isBestseller:
          bestsellerCheckbox?.checked ||
          false,


        updatedAt:
          Date.now()

      }
    );


    /*==========================================
        BIDIRECTIONAL RELATED DESIGNS
    ==========================================*/

    /*
      Remove this product from designs
      that are no longer related.
    */

    const removedRelated =
      originalRelatedDesigns.filter(
        id =>
          !relatedDesigns.includes(id)
      );


    for(
      const rid of removedRelated
    ){

      if(
        rid === productId
      ){

        continue;

      }


      try{

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
          !snap.exists()
        ){

          continue;

        }


        const data =
          snap.data();


        const arr =
          Array.isArray(
            data.relatedDesigns
          )
          ?
          data.relatedDesigns.filter(
            id =>
              id !== productId
          )
          :
          [];


        await updateDoc(
          refDoc,
          {

            relatedDesigns:
              arr

          }
        );

      }

      catch(error){

        console.error(
          "Removing old related design error:",
          rid,
          error
        );

      }

    }


    /*
      Add this product to newly related designs.
    */

    const newlyRelated =
      relatedDesigns.filter(
        id =>
          !originalRelatedDesigns.includes(
            id
          )
      );


    for(
      const rid of newlyRelated
    ){

      if(
        rid === productId
      ){

        continue;

      }


      try{

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
          !snap.exists()
        ){

          continue;

        }


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
          !arr.includes(
            productId
          )
        ){

          arr.push(
            productId
          );


          await updateDoc(
            refDoc,
            {

              relatedDesigns:
                arr

            }
          );

        }

      }

      catch(error){

        console.error(
          "Adding related design error:",
          rid,
          error
        );

      }

    }


    /*==========================================
        SUCCESS
    ==========================================*/

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

  catch(error){

    console.error(
      "Update product error:",
      error
    );


    showPopup(
      "❌ " +
      (
        error?.message ||
        "Unable to update product."
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

  return escapeHtml(
    value
  );

}


/*==================================================
    INITIALIZE
==================================================*/

updateCommonShippingUI();

updateSizeShippingUI();

loadProduct();