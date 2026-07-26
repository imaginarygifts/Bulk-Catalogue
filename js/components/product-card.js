/*==================================================
    PRODUCT CARD
==================================================*/

export function createProductCard(product){

    const card=document.createElement("div");

    card.className="product-card";

    const image=

        product.images?.[0] ||

        "assets/no-image.png";

    const original=

        Number(product.basePrice||0);

    const sale=

        Number(product.salePrice||original);

    const discount=

        original>sale

        ? Math.round(
            ((original-sale)/original)*100
        )

        :0;

    card.innerHTML=`

<div class="product-image">

    ${
        discount
        ?
        `
        <span class="product-badge">

            ${discount}% OFF

        </span>
        `
        :""
    }

    ${
        product.isBestseller
        ?
        `
        <span class="product-bestseller">

            Bestseller

        </span>
        `
        :""
    }

    <button class="product-wishlist">

        ♡

    </button>

    <img

        src="${image}"

        alt="${product.name}"

        loading="lazy"

    >

</div>

<div class="product-content">

    <h3 class="product-name">

        ${product.name}

    </h3>

    <div class="product-description">

        ${product.description || ""}

    </div>

    <div class="product-price">

        <span class="product-sale-price">

            ₹${sale.toLocaleString("en-IN")}

        </span>

        ${
            original>sale
            ?
            `
            <span class="product-original-price">

                ₹${original.toLocaleString("en-IN")}

            </span>

            <span class="product-discount">

                ${discount}% OFF

            </span>
            `
            :""
        }

    </div>

    <div class="product-stock ${product.inStock ? "" : "out"}">

        ${
            product.inStock
            ? "✓ In Stock"
            : "Out of Stock"
        }

    </div>

    <div class="product-actions">

        <button class="btn btn-outline">

            View

        </button>

        <button class="btn btn-primary">

            Buy Now

        </button>

    </div>

</div>

`;

    return card;

}