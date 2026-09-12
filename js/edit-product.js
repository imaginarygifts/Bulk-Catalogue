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

const productId =
  new URLSearchParams(location.search).get("id");

let originalProduct = null;
let oldRelatedDesigns = [];


/*==================================================
    INPUTS
==================================================*/

const nameInput = document.getElementById("name");
const descInput = document.getElementById("desc");
const priceInput = document.getElementById("price");
const salePriceInput = document.getElementById("salePrice");
const catSelect = document.getElementById("category");
const imagesInput = document.getElementById("images");
const preview = document.getElementById("imagePreview");
const stockStatus = document.getElementById("stockStatus");


/*==================================================
    SHIPPING
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
    TAGS
==================================================*/

const tagBox =
  document.getElementById("tagCheckboxes");

const bestsellerCheckbox =
  document.getElementById("isBestseller");


/*==================================================
    PAYMENT
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
let productImages = [];

let gallerySelected = [];
let currentGalleryPath = "product-images";

let relatedDesigns = [];
let allProducts = [];
let selectedTags = [];


/*==================================================
    HELPERS
==================================================*/

function showPopup(message) {
  const popup = document.getElementById("popup");

  if (!popup) {
    alert(message);
    return;
  }

  popup.innerText = message;
  popup.classList.remove("hidden");
}

function hidePopup() {
  document
    .getElementById("popup")
    ?.classList.add("hidden");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

window.toggleSection = function (id) {
  document
    .getElementById(id)
    ?.classList.toggle("hidden");
};


/*==================================================
    SHIPPING UI
==================================================*/

function updateCommonShippingUI() {
  if (!shippingType || !commonShippingAmountBox) {
    return;
  }

  if (shippingType.value === "paid") {
    commonShippingAmountBox.style.display = "block";
  } else {
    commonShippingAmountBox.style.display = "none";

    if (shippingAmount) {
      shippingAmount.value = "";
    }
  }
}

function updateSizeShippingUI() {
  if (!sizeShippingType || !sizeShippingAmountBox) {
    return;
  }

  if (sizeShippingType.value === "paid") {
    sizeShippingAmountBox.classList.remove("hidden");
  } else {
    sizeShippingAmountBox.classList.add("hidden");

    if (sizeShippingAmount) {
      sizeShippingAmount.value = "";
    }
  }
}

shippingType?.addEventListener(
  "change",
  updateCommonShippingUI
);

sizeShippingType?.addEventListener(
  "change",
  updateSizeShippingUI
);


/*==================================================
    LOAD CATEGORIES
==================================================*/

async function loadCategories() {
  if (!catSelect) {
    return;
  }

  catSelect.innerHTML =
    `<option value="">Select category</option>`;

  try {
    const snap = await getDocs(
      query(
        collection(db, "categories"),
        orderBy("order")
      )
    );

    const categories = [];

    snap.forEach(categoryDoc => {
      categories.push({
        id: categoryDoc.id,
        ...categoryDoc.data()
      });
    });

    const mains = categories.filter(
      category => !category.parentId
    );

    mains.forEach(main => {
      const mainOption =
        document.createElement("option");

      mainOption.value = main.id;
      mainOption.textContent = main.name;
      mainOption.dataset.type = "main";

      catSelect.appendChild(mainOption);

      categories
        .filter(category =>
          category.parentId === main.id
        )
        .forEach(sub => {
          const subOption =
            document.createElement("option");

          subOption.value = sub.id;
          subOption.textContent = "— " + sub.name;
          subOption.dataset.type = "sub";
          subOption.dataset.parent = main.id;

          catSelect.appendChild(subOption);
        });
    });
  } catch (error) {
    console.error("Category loading error:", error);
  }
}


/*==================================================
    IMAGE PICKER
==================================================*/

imagesInput?.addEventListener("change", event => {
  const files = Array.from(
    event.target.files || []
  );

  files.forEach(file => {
    productImages.push({
      type: "file",
      file,
      preview: URL.createObjectURL(file)
    });
  });

  renderImagePreview();
  imagesInput.value = "";
});


function renderImagePreview() {
  if (!preview) {
    return;
  }

  preview.innerHTML = "";

  productImages.forEach((image, index) => {
    const card = document.createElement("div");

    card.className = "image-card";
    card.draggable = true;
    card.dataset.index = index;

    const img = document.createElement("img");

    img.src =
      image.type === "file"
        ? image.preview
        : image.url;

    img.draggable = false;

    const deleteButton =
      document.createElement("button");

    deleteButton.type = "button";
    deleteButton.className = "image-delete";
    deleteButton.innerText = "×";
    deleteButton.title = "Remove image";

    deleteButton.addEventListener("click", event => {
      event.stopPropagation();

      if (
        image.type === "file" &&
        image.preview
      ) {
        URL.revokeObjectURL(image.preview);
      }

      productImages.splice(index, 1);
      renderImagePreview();
    });

    card.appendChild(img);
    card.appendChild(deleteButton);

    card.addEventListener("dragstart", event => {
      event.dataTransfer.effectAllowed = "move";

      event.dataTransfer.setData(
        "text/plain",
        String(index)
      );

      card.classList.add("dragging");
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");

      document
        .querySelectorAll("#imagePreview .image-card")
        .forEach(item =>
          item.classList.remove("drag-over")
        );
    });

    card.addEventListener("dragover", event => {
      event.preventDefault();
      card.classList.add("drag-over");
    });

    card.addEventListener("dragleave", () => {
      card.classList.remove("drag-over");
    });

    card.addEventListener("drop", event => {
      event.preventDefault();

      const fromIndex = Number(
        event.dataTransfer.getData("text/plain")
      );

      const toIndex = Number(card.dataset.index);

      if (
        Number.isNaN(fromIndex) ||
        Number.isNaN(toIndex) ||
        fromIndex === toIndex
      ) {
        return;
      }

      const moved =
        productImages.splice(fromIndex, 1)[0];

      productImages.splice(toIndex, 0, moved);

      renderImagePreview();
    });

    preview.appendChild(card);
  });
}


/*==================================================
    RELATED DESIGNS
==================================================*/

async function loadDesignProducts() {
  try {
    const snap = await getDocs(
      collection(db, "products")
    );

    allProducts = [];

    snap.forEach(productDoc => {
      allProducts.push({
        id: productDoc.id,
        ...productDoc.data()
      });
    });

    renderDesignList(allProducts);
  } catch (error) {
    console.error(
      "Loading design products error:",
      error
    );
  }
}

function renderDesignList(list) {
  const box =
    document.getElementById("designList");

  if (!box) {
    return;
  }

  box.innerHTML = "";

  list
    .filter(product => product.id !== productId)
    .forEach(product => {
      const row =
        document.createElement("div");

      row.className = "design-item";

      const checked =
        relatedDesigns.includes(product.id)
          ? "checked"
          : "";

      row.innerHTML = `
        <input
          type="checkbox"
          ${checked}
          onchange="toggleDesign('${escapeAttribute(product.id)}')"
        >

        <img src="${escapeAttribute(
          product.images?.[0] || ""
        )}">

        <span>
          ${escapeHtml(product.name || "")}
        </span>
      `;

      box.appendChild(row);
    });
}

window.toggleDesign = function (id) {
  if (relatedDesigns.includes(id)) {
    relatedDesigns =
      relatedDesigns.filter(item => item !== id);
  } else {
    relatedDesigns.push(id);
  }
};

window.filterDesigns = function () {
  const searchInput =
    document.getElementById("designSearch");

  const search =
    searchInput?.value.toLowerCase() || "";

  const filtered = allProducts.filter(product =>
    String(product.name || "")
      .toLowerCase()
      .includes(search)
  );

  renderDesignList(filtered);
};


/*==================================================
    TAGS
==================================================*/

async function loadTags() {
  if (!tagBox) {
    return;
  }

  try {
    const snap = await getDocs(
      collection(db, "tags")
    );

    tagBox.innerHTML = "";

    snap.forEach(tagDoc => {
      const tag = tagDoc.data();

      const row =
        document.createElement("div");

      row.className = "design-item";

      const checked =
        selectedTags.includes(tag.slug)
          ? "checked"
          : "";

      row.innerHTML = `
        <input
          type="checkbox"
          ${checked}
          onchange="toggleTag(
            '${escapeAttribute(tag.slug)}',
            this.checked
          )"
        >

        <span>
          ${escapeHtml(tag.name || "")}
        </span>
      `;

      tagBox.appendChild(row);
    });
  } catch (error) {
    console.error("Tags loading error:", error);
  }
}

window.toggleTag = function (slug, checked) {
  if (checked) {
    if (!selectedTags.includes(slug)) {
      selectedTags.push(slug);
    }
  } else {
    selectedTags =
      selectedTags.filter(tag => tag !== slug);
  }
};


/*==================================================
    STORAGE GALLERY
==================================================*/

window.openGalleryPicker = function () {
  const picker =
    document.getElementById("galleryPicker");

  if (!picker) {
    return;
  }

  picker.classList.remove("hidden");

  setTimeout(() => {
    loadGalleryFolder("product-images");
  }, 10);
};

async function loadGalleryFolder(path) {
  try {
    currentGalleryPath = path;
    updateGalleryBreadcrumbs(path);

    const grid =
      document.getElementById(
        "galleryPickerGrid"
      );

    if (!grid) {
      return;
    }

    grid.innerHTML = "";

    const folderRef = ref(storage, path);
    const result = await listAll(folderRef);

    result.prefixes.forEach(folder => {
      const div =
        document.createElement("div");

      div.className = "gallery-folder";

      div.innerHTML = `
        <div class="folder-icon">📁</div>
        <span>${escapeHtml(folder.name)}</span>
      `;

      div.onclick = () =>
        loadGalleryFolder(folder.fullPath);

      grid.appendChild(div);
    });

    for (const file of result.items) {
      const url = await getDownloadURL(file);

      const div =
        document.createElement("div");

      div.className = "gallery-img";

      const checked =
        gallerySelected.includes(url)
          ? "checked"
          : "";

      div.innerHTML = `
        <input
          type="checkbox"
          class="gallery-check"
          ${checked}
        >

        <img src="${escapeAttribute(url)}">
      `;

      const checkbox =
        div.querySelector("input");

      checkbox.onchange = () => {
        if (checkbox.checked) {
          if (!gallerySelected.includes(url)) {
            gallerySelected.push(url);
          }
        } else {
          gallerySelected =
            gallerySelected.filter(
              item => item !== url
            );
        }
      };

      grid.appendChild(div);
    }
  } catch (error) {
    console.error("Gallery loading error:", error);

    showPopup("Unable to load gallery.");

    setTimeout(hidePopup, 1800);
  }
}

function updateGalleryBreadcrumbs(path) {
  let breadcrumbs =
    document.getElementById(
      "galleryBreadcrumbs"
    );

  const picker =
    document.getElementById("galleryPicker");

  const grid =
    document.getElementById(
      "galleryPickerGrid"
    );

  if (!picker || !grid) {
    return;
  }

  if (!breadcrumbs) {
    breadcrumbs =
      document.createElement("div");

    breadcrumbs.id = "galleryBreadcrumbs";
    breadcrumbs.className =
      "gallery-breadcrumbs";

    picker.insertBefore(breadcrumbs, grid);
  }

  breadcrumbs.innerHTML = "";

  const home =
    document.createElement("span");

  home.innerText = "Home";
  home.style.cursor = "pointer";

  home.onclick = () =>
    loadGalleryFolder("product-images");

  breadcrumbs.appendChild(home);

  const parts = path
    .replace("product-images", "")
    .split("/")
    .filter(Boolean);

  let current = "product-images";

  parts.forEach(part => {
    current += "/" + part;

    const span =
      document.createElement("span");

    span.innerText =
      " / " + decodeURIComponent(part);

    span.style.cursor = "pointer";

    const selectedPath = current;

    span.onclick = () =>
      loadGalleryFolder(selectedPath);

    breadcrumbs.appendChild(span);
  });
}

window.closeGalleryPicker = function () {
  document
    .getElementById("galleryPicker")
    ?.classList.add("hidden");
};

window.addSelectedImages = function () {
  if (!gallerySelected.length) {
    alert("Select images first");
    return;
  }

  gallerySelected.forEach(url => {
    const exists = productImages.some(
      image =>
        image.type === "url" &&
        image.url === url
    );

    if (!exists) {
      productImages.push({
        type: "url",
        url
      });
    }
  });

  gallerySelected = [];

  renderImagePreview();

  document
    .getElementById("galleryPicker")
    ?.classList.add("hidden");
};


/*==================================================
    LOAD EXISTING PRODUCT
==================================================*/

async function loadExistingProduct() {
  if (!productId) {
    showPopup("Product ID is missing.");
    return;
  }

  try {
    const productRef =
      doc(db, "products", productId);

    const productSnap =
      await getDoc(productRef);

    if (!productSnap.exists()) {
      showPopup("Product not found.");
      return;
    }

    originalProduct = productSnap.data();

    oldRelatedDesigns =
      Array.isArray(
        originalProduct.relatedDesigns
      )
        ? [...originalProduct.relatedDesigns]
        : [];

    if (nameInput) {
      nameInput.value =
        originalProduct.name || "";
    }

    if (descInput) {
      descInput.value =
        originalProduct.description || "";
    }

    if (priceInput) {
      priceInput.value =
        originalProduct.basePrice ?? "";
    }

    if (salePriceInput) {
      salePriceInput.value =
        originalProduct.salePrice ??
        originalProduct.basePrice ??
        "";
    }

    if (stockStatus) {
      stockStatus.value =
        String(
          originalProduct.inStock !== false
        );
    }

    if (bestsellerCheckbox) {
      bestsellerCheckbox.checked =
        originalProduct.isBestseller === true;
    }

    const categoryValue =
      originalProduct.subCategoryId ||
      originalProduct.categoryId ||
      "";

    if (catSelect) {
      catSelect.value = categoryValue;
    }

    colors =
      Array.isArray(
        originalProduct.variants?.colors
      )
        ? [...originalProduct.variants.colors]
        : [];

    sizes =
      Array.isArray(
        originalProduct.variants?.sizes
      )
        ? [...originalProduct.variants.sizes]
        : [];

    customOptions =
      Array.isArray(
        originalProduct.customOptions
      )
        ? [...originalProduct.customOptions]
        : [];

    productImages =
      Array.isArray(originalProduct.images)
        ? originalProduct.images.map(url => ({
            type: "url",
            url
          }))
        : [];

    relatedDesigns = [...oldRelatedDesigns];

    selectedTags =
      Array.isArray(originalProduct.tags)
        ? [...originalProduct.tags]
        : [];

    const shipping =
      originalProduct.shipping || {};

    if (shippingType) {
      shippingType.value =
        shipping.type || "free";
    }

    if (shippingAmount) {
      shippingAmount.value =
        shipping.amount || "";
    }

    const payment =
      originalProduct.paymentSettings || {};

    if (allowOnline) {
      allowOnline.checked =
        payment.online?.enabled === true;
    }

    if (onlineDiscountType) {
      onlineDiscountType.value =
        payment.online?.discountType || "none";
    }

    if (onlineDiscountValue) {
      onlineDiscountValue.value =
        payment.online?.discountValue || 0;
    }

    if (allowCOD) {
      allowCOD.checked =
        payment.cod?.enabled === true;
    }

    if (codDiscountType) {
      codDiscountType.value =
        payment.cod?.discountType || "none";
    }

    if (codDiscountValue) {
      codDiscountValue.value =
        payment.cod?.discountValue || 0;
    }

    if (allowAdvance) {
      allowAdvance.checked =
        payment.advance?.enabled === true;
    }

    if (advanceType) {
      advanceType.value =
        payment.advance?.type || "percent";
    }

    if (advanceValue) {
      advanceValue.value =
        payment.advance?.value || 0;
    }

    if (advanceDiscountType) {
      advanceDiscountType.value =
        payment.advance?.discountType || "none";
    }

    if (advanceDiscountValue) {
      advanceDiscountValue.value =
        payment.advance?.discountValue || 0;
    }

    renderImagePreview();

    /*
      These functions exist in your Add Product JS.
      Keep their same implementations in Edit Product JS
      if you want complete variant editing UI.
    */

    if (typeof window.renderColors === "function") {
      window.renderColors();
    }

    if (typeof window.renderSizes === "function") {
      window.renderSizes();
    }

    if (
      typeof window.renderCustomOptions ===
      "function"
    ) {
      window.renderCustomOptions();
    }

    await loadTags();

    renderDesignList(allProducts);

    updateCommonShippingUI();
    updateSizeShippingUI();

  } catch (error) {
    console.error(
      "Load existing product error:",
      error
    );

    showPopup(
      "Unable to load product: " +
      (error.message || "")
    );
  }
}


/*==================================================
    SAVE / UPDATE PRODUCT
==================================================*/

window.saveProduct = async function () {
  if (!productId) {
    showPopup("Product ID is missing.");
    return;
  }

  const name =
    nameInput?.value.trim() || "";

  const price =
    priceInput?.value || "";

  const selectedOption =
    catSelect?.options[
      catSelect.selectedIndex
    ];

  let categoryId = null;
  let subCategoryId = null;

  if (
    selectedOption?.dataset.type ===
    "main"
  ) {
    categoryId = selectedOption.value;
  }

  if (
    selectedOption?.dataset.type ===
    "sub"
  ) {
    subCategoryId = selectedOption.value;
    categoryId =
      selectedOption.dataset.parent;
  }

  if (
    !name ||
    !price ||
    !selectedOption?.value
  ) {
    showPopup(
      "⚠ Fill all required fields"
    );

    setTimeout(hidePopup, 1500);
    return;
  }

  const commonShippingType =
    shippingType?.value || "free";

  let commonShippingAmount = 0;

  if (commonShippingType === "paid") {
    commonShippingAmount =
      Number(shippingAmount?.value || 0);

    if (commonShippingAmount <= 0) {
      showPopup(
        "⚠ Please enter common shipping amount."
      );

      setTimeout(hidePopup, 1800);
      return;
    }
  }

  try {
    showPopup("Uploading images...");

    const uploadedImages = [];

    for (const image of productImages) {
      if (image.type === "url") {
        uploadedImages.push(image.url);
        continue;
      }

      if (image.type === "file") {
        const file = image.file;

        const imageRef = ref(
          storage,
          `products/${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 8)}-${file.name}`
        );

        await uploadBytes(imageRef, file);

        const url =
          await getDownloadURL(imageRef);

        uploadedImages.push(url);
      }
    }

    const paymentSettings = {
      online: {
        enabled:
          allowOnline?.checked || false,

        discountType:
          onlineDiscountType?.value || "none",

        discountValue:
          Number(
            onlineDiscountValue?.value || 0
          )
      },

      cod: {
        enabled:
          allowCOD?.checked || false,

        discountType:
          codDiscountType?.value || "none",

        discountValue:
          Number(
            codDiscountValue?.value || 0
          )
      },

      advance: {
        enabled:
          allowAdvance?.checked || false,

        discountType:
          advanceDiscountType?.value || "none",

        discountValue:
          Number(
            advanceDiscountValue?.value || 0
          ),

        type:
          advanceType?.value || "percent",

        value:
          Number(
            advanceValue?.value || 0
          )
      }
    };

    const updatedProduct = {
      name,

      description:
        descInput?.value || "",

      basePrice:
        Number(price),

      salePrice:
        Number(
          salePriceInput?.value || price
        ),

      inStock:
        stockStatus
          ? stockStatus.value === "true"
          : true,

      categoryId,
      subCategoryId,

      images: uploadedImages,

      variants: {
        colors,
        sizes
      },

      shipping: {
        type: commonShippingType,
        amount: commonShippingAmount
      },

      customOptions,

      paymentSettings,

      relatedDesigns,

      tags: selectedTags,

      isBestseller:
        bestsellerCheckbox?.checked || false,

      createdAt:
        originalProduct?.createdAt ||
        Date.now(),

      updatedAt: Date.now()
    };

    showPopup("Updating product...");

    await updateDoc(
      doc(db, "products", productId),
      updatedProduct
    );


    /*============================================
        REMOVE OLD RELATED LINKS
    ============================================*/

    for (const oldId of oldRelatedDesigns) {
      if (
        oldId === productId ||
        relatedDesigns.includes(oldId)
      ) {
        continue;
      }

      const oldRef =
        doc(db, "products", oldId);

      const oldSnap =
        await getDoc(oldRef);

      if (!oldSnap.exists()) {
        continue;
      }

      const oldData = oldSnap.data();

      const oldArray =
        Array.isArray(oldData.relatedDesigns)
          ? [...oldData.relatedDesigns]
          : [];

      const updatedArray =
        oldArray.filter(
          id => id !== productId
        );

      await updateDoc(oldRef, {
        relatedDesigns: updatedArray
      });
    }


    /*============================================
        ADD NEW RELATED LINKS
    ============================================*/

    for (const relatedId of relatedDesigns) {
      if (relatedId === productId) {
        continue;
      }

      const relatedRef =
        doc(db, "products", relatedId);

      const relatedSnap =
        await getDoc(relatedRef);

      if (!relatedSnap.exists()) {
        continue;
      }

      const relatedData =
        relatedSnap.data();

      const relatedArray =
        Array.isArray(
          relatedData.relatedDesigns
        )
          ? [...relatedData.relatedDesigns]
          : [];

      if (!relatedArray.includes(productId)) {
        relatedArray.push(productId);

        await updateDoc(relatedRef, {
          relatedDesigns: relatedArray
        });
      }
    }


    showPopup("✅ Product updated");

    setTimeout(() => {
      hidePopup();
      location.href = "products.html";
    }, 1200);

  } catch (error) {
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
    BUTTON EVENTS
==================================================*/

document
  .getElementById("openGalleryBtn")
  ?.addEventListener(
    "click",
    window.openGalleryPicker
  );

document
  .getElementById("galleryBackBtn")
  ?.addEventListener(
    "click",
    window.closeGalleryPicker
  );

document
  .getElementById("addSelectedGalleryImages")
  ?.addEventListener(
    "click",
    window.addSelectedImages
  );

document
  .getElementById("saveProductBtn")
  ?.addEventListener(
    "click",
    window.saveProduct
  );


/*==================================================
    INITIALIZATION
==================================================*/

async function initializeEditPage() {
  if (!productId) {
    showPopup("Missing product ID in URL.");
    return;
  }

  await loadCategories();
  await loadDesignProducts();
  await loadExistingProduct();

  updateCommonShippingUI();
  updateSizeShippingUI();
}

initializeEditPage();