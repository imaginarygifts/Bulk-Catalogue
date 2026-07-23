/*==================================================
    PRODUCT CARD
==================================================*/

export function createProductCard(product){

    const card = document.createElement("div");

    card.className = "product-card";

    const image =
        product.images?.[0] || "";

    const basePrice =
        Number(product.basePrice || 0);

    const salePrice =
        Number(product.salePrice || 0);

    const discount =
        getDiscount(basePrice,salePrice);

    const inStock =
        product.inStock !== false;

    card.innerHTML = `

<div class="product-image">

    <img
        src="${image}"
        loading="lazy"
        alt="${product.name}">

    ${
        discount > 0
        ?

        `<span class="discount-badge">

            ${discount}% OFF

        </span>`

        :

        ""
    }

    ${
        !inStock
        ?

        `<span class="out-of-stock">

            Out of Stock

        </span>`

        :

        ""
    }

</div>

<div class="product-content">

    <h3 class="product-name">

        ${product.name}

    </h3>

    <div class="product-price">

        ${
            salePrice > 0 &&
            salePrice < basePrice

            ?

            `

            <span class="sale-price">

                ${money(salePrice)}

            </span>

            <span class="old-price">

                ${money(basePrice)}

            </span>

            `

            :

            `

            <span class="sale-price">

                ${money(basePrice)}

            </span>

            `
        }

    </div>

</div>

`;

    card.addEventListener(

        "click",

        ()=>{

            window.location.href =

            `product?id=${product.id}`;

        }

    );

    return card;

}

/*==================================================
    MONEY
==================================================*/

function money(value){

    return "₹" +

    Number(value).toLocaleString(

        "en-IN"

    );

}

/*==================================================
    DISCOUNT
==================================================*/

function getDiscount(

    base,

    sale

){

    if(

        sale <= 0 ||

        sale >= base

    ){

        return 0;

    }

    return Math.round(

        (

            (base-sale)

            /

            base

        )*100

    );

}