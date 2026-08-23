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
  document.getElementById(
    "shippingType"
  );

const shippingAmount =
  document.getElementById(
    "shippingAmount"
  );

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
    TAGS & BESTSELLER
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
    PAYMENT & DISCOUNTS
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

let images = [];

let galleryImages = [];

let gallerySelected = [];

let currentGalleryPath =
  "product-images";

let galleryBreadcrumbs;

let relatedDesigns = [];

let allProducts = [];

let selectedTags = [];


/*==================================================
    ACCORDION
==================================================*/

window.toggleSection = (
  id
) => {

  const section =
    document.getElementById(
      id
    );

  if(section){

    section.classList.toggle(
      "hidden"
    );

  }

};


/*==================================================
    POPUP
==================================================*/

function showPopup(
  msg
){

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
    shippingType.value ===
    "paid"
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
    sizeShippingType.value ===
    "paid"
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


/*==================================================
    INITIAL SHIPPING STATE
==================================================*/

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


  const snap =
    await getDocs(
      query(
        collection(
          db,
          "categories"
        ),
        orderBy(
          "order"
        )
      )
    );


  const categories =
    [];


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
      c =>
        !c.parentId
    );


  mains.forEach(
    main => {

      /*==========================================
          MAIN CATEGORY
      ==========================================*/

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


      /*==========================================
          SUB CATEGORIES
      ==========================================*/

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
            "— " +
            sub.name;


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

}


loadCategories();


/*==================================================
    IMAGE PICKER
==================================================*/

if(imagesInput){

  imagesInput.addEventListener(
    "change",
    event => {

      const files =
        Array.from(
          event.target.files ||
          []
        );


      files.forEach(
        file =>
          images.push(
            file
          )
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


  /*==============================================
      UPLOADED IMAGES
  ==============================================*/

  images.forEach(
    (
      file,
      index
    ) => {

      const div =
        document.createElement(
          "div"
        );


      div.className =
        "image-card";


      const img =
        document.createElement(
          "img"
        );


      img.src =
        URL.createObjectURL(
          file
        );


      const del =
        document.createElement(
          "span"
        );


      del.innerText =
        "×";


      del.onclick =
        () => {

          images.splice(
            index,
            1
          );


          renderImagePreview();

        };


      div.appendChild(
        img
      );


      div.appendChild(
        del
      );


      preview.appendChild(
        div
      );

    }
  );


  /*==============================================
      GALLERY IMAGES
  ==============================================*/

  galleryImages.forEach(
    (
      url,
      index
    ) => {

      const div =
        document.createElement(
          "div"
        );


      div.className =
        "image-card";


      const img =
        document.createElement(
          "img"
        );


      img.src =
        url;


      const del =
        document.createElement(
          "span"
        );


      del.innerText =
        "×";


      del.onclick =
        () => {

          galleryImages.splice(
            index,
            1
          );


          renderImagePreview();

        };


      div.appendChild(
        img
      );


      div.appendChild(
        del
      );


      preview.appendChild(
        div
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
      .getElementById(
        "colorName"
      )
      .value
      .trim();


  const price =
    Number(
      document
        .getElementById(
          "colorPrice"
        )
        .value ||
      0
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
    (
      color,
      index
    ) => {

      const div =
        document.createElement(
          "div"
        );


      div.innerText =
        `${color.name} (+₹${color.price}) ${
          color.required
          ?
          "(Required)"
          :
          ""
        } ❌`;


      div.onclick =
        () => {

          colors.splice(
            index,
            1
          );


          renderColors();

        };


      list.appendChild(
        div
      );

    }
  );

}


/*==================================================
    SIZES
==================================================*/

window.addSize = () => {

  const name =
    document
      .getElementById(
        "sizeName"
      )
      .value
      .trim();


  const price =
    Number(
      document
        .getElementById(
          "sizePrice"
        )
        .value ||
      0
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


  /*==============================================
      VALIDATE SIZE
  ==============================================*/

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


  /*==============================================
      VALIDATE SIZE SHIPPING
  ==============================================*/

  if(
    shippingMode ===
    "paid"
  ){

    sizeShippingValue =
      Number(
        document
          .getElementById(
            "sizeShippingAmount"
          )
          ?.value ||
        0
      );


    if(
      sizeShippingValue <=
      0
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


  /*==============================================
      ADD SIZE
  ==============================================*/

  sizes.push({

    name,

    price,

    required,

    shippingMode,

    shippingAmount:

      shippingMode ===
      "free"

      ?

      0

      :

      shippingMode ===
      "paid"

      ?

      sizeShippingValue

      :

      null

  });


  renderSizes();


  /*==============================================
      RESET INPUTS
  ==============================================*/

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
    (
      size,
      index
    ) => {

      const div =
        document.createElement(
          "div"
        );


      div.className =
        "size-item";


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
            size.shippingAmount ||
            0
          )}`;

      }


      div.innerHTML = `

        <strong>
          ${escapeHtml(
            size.name
          )}
        </strong>

        <span>
          +₹${Number(
            size.price ||
            0
          )}
        </span>

        <span>
          ${
            size.required
            ?
            "Required"
            :
            "Optional"
          }
        </span>

        <span>
          ${shippingText}
        </span>

        <button
          type="button"
          class="btn-outline"
          onclick="removeSize(${index})"
        >
          Remove
        </button>

      `;


      list.appendChild(
        div
      );

    }
  );

}


/*==================================================
    REMOVE SIZE
==================================================*/

window.removeSize =
  function(
    index
  ){

    sizes.splice(
      index,
      1
    );


    renderSizes();

  };


/*==================================================
    CUSTOM OPTIONS
==================================================*/

window.addCustomOption = () => {

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
        .value ||
      0
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

    return;

  }


  const option = {

    type,

    label,

    price,

    required

  };


  if(
    type ===
    "dropdown"
  ){

    option.choices =
      choicesRaw
        .split(",")
        .map(
          value =>
            value.trim()
        )
        .filter(
          Boolean
        );

  }


  customOptions.push(
    option
  );


  renderCustomOptions();


  document.getElementById(
    "customLabel"
  ).value =
    "";


  document.getElementById(
    "customPrice"
  ).value =
    "";


  document.getElementById(
    "customChoices"
  ).value =
    "";


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
    (
      option,
      index
    ) => {

      const div =
        document.createElement(
          "div"
        );


      div.innerText =
        `${option.type}: ${
          option.label
        } (+₹${
          option.price
        }) ${
          option.required
          ?
          "(Required)"
          :
          ""
        } ❌`;


      div.onclick =
        () => {

          customOptions.splice(
            index,
            1
          );


          renderCustomOptions();

        };


      list.appendChild(
        div
      );

    }
  );

}


/*==================================================
    RELATED DESIGNS
==================================================*/

async function loadDesignProducts(){

  const snap =
    await getDocs(
      collection(
        db,
        "products"
      )
    );


  allProducts =
    [];


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
            ?
            "checked"
            :
            ""
          }
          onchange="
            toggleDesign(
              '${product.id}'
            )
          "
        >

        <img
          src="${
            product.images?.[0] ||
            ""
          }"
        >

        <span>
          ${
            escapeHtml(
              product.name ||
              ""
            )
          }
        </span>

      `;


      box.appendChild(
        row
      );

    }
  );

}


window.toggleDesign =
  function(
    productId
  ){

    if(
      relatedDesigns.includes(
        productId
      )
    ){

      relatedDesigns =
        relatedDesigns.filter(
          id =>
            id !==
            productId
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
      searchInput.value
        .toLowerCase()
      :
      "";


    const filtered =
      allProducts.filter(
        product =>

          String(
            product.name ||
            ""
          )
          .toLowerCase()
          .includes(
            q
          )
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


      row.innerHTML = `

        <input
          type="checkbox"
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
          ${
            escapeHtml(
              tag.name ||
              ""
            )
          }
        </span>

      `;


      tagBox.appendChild(
        row
      );

    }
  );

}


window.toggleTag =
  function(
    slug,
    checked
  ){

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
            tag !==
            slug
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


    /*==============================================
        FOLDERS
    ==============================================*/

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
            ${
              escapeHtml(
                folder.name
              )
            }
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


    /*==============================================
        IMAGES
    ==============================================*/

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
          src="${escapeAttribute(
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
                  item !==
                  url
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


    gallerySelected.forEach(
      url => {

        if(
          !galleryImages.includes(
            url
          )
        ){

          galleryImages.push(
            url
          );

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


    /*==============================================
        REQUIRED FIELDS
    ==============================================*/

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


    /*==============================================
        COMMON SHIPPING
    ==============================================*/

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
        commonShippingAmount <=
        0
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
          UPLOAD IMAGES
      ============================================*/

      showPopup(
        "Uploading images..."
      );


      const uploadedImages =
        [
          ...galleryImages
        ];


      for(
        const file of images
      ){

        const imgRef =
          ref(
            storage,
            `products/${Date.now()}-${file.name}`
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
          SHIPPING OBJECT
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
              Number(
                price
              ),

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

            /*======================================
                VARIANTS
            ======================================*/

            variants: {

              colors,

              sizes

            },

            /*======================================
                SHIPPING
            ======================================*/

            shipping:
              productShipping,

            /*======================================
                CUSTOM OPTIONS
            ======================================*/

            customOptions,

            /*======================================
                PAYMENT
            ======================================*/

            paymentSettings,

            /*======================================
                RELATED DESIGNS
            ======================================*/

            relatedDesigns,

            /*======================================
                TAGS
            ======================================*/

            tags:
              selectedTags,

            /*======================================
                BESTSELLER
            ======================================*/

            isBestseller,

            /*======================================
                CREATED
            ======================================*/

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
            !arr.includes(
              newId
            )
          ){

            arr.push(
              newId
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

      }


      /*============================================
          SUCCESS
      ============================================*/

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

function escapeHtml(
  value
){

  return String(
    value ??
    ""
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

function escapeAttribute(
  value
){

  return escapeHtml(
    value
  );

}