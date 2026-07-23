/*==================================================
    FORMAT UTILITIES
==================================================*/

/*==================================================
    MONEY
==================================================*/

export function money(value){

    if(value===undefined || value===null){

        return "₹0";

    }

    return "₹"+

    Number(value).toLocaleString(

        "en-IN"

    );

}

/*==================================================
    DISCOUNT %
==================================================*/

export function getDiscount(

    original,

    sale

){

    original = Number(original);

    sale = Number(sale);

    if(

        !original ||

        sale>=original

    ){

        return 0;

    }

    return Math.round(

        ((original-sale)/original)*100

    );

}

/*==================================================
    PLACEHOLDER IMAGE
==================================================*/

export function placeholderImage(){

    return "assets/images/placeholder.png";

}

/*==================================================
    MOBILE CHECK
==================================================*/

export function isMobile(){

    return window.innerWidth<=768;

}

/*==================================================
    DEBOUNCE
==================================================*/

export function debounce(

    callback,

    delay=300

){

    let timer;

    return(...args)=>{

        clearTimeout(timer);

        timer=setTimeout(

            ()=>callback(...args),

            delay

        );

    };

}

/*==================================================
    FORMAT DATE
==================================================*/

export function formatDate(date){

    if(!date) return "";

    const d =

    date.seconds

    ?

    new Date(

        date.seconds*1000

    )

    :

    new Date(date);

    return d.toLocaleDateString(

        "en-IN",

        {

            day:"2-digit",

            month:"short",

            year:"numeric"

        }

    );

}

/*==================================================
    RANDOM ID
==================================================*/

export function randomId(){

    return Math.random()

    .toString(36)

    .substring(2,10);

}

/*==================================================
    CAPITALIZE
==================================================*/

export function capitalize(text){

    if(!text) return "";

    return text.charAt(0)

    .toUpperCase()

    +

    text.slice(1);

}

/*==================================================
    SLUG
==================================================*/

export function slug(text){

    if(!text) return "";

    return text

    .toLowerCase()

    .trim()

    .replace(/\s+/g,"-")

    .replace(/[^\w-]+/g,"");

}

/*==================================================
    CLAMP
==================================================*/

export function clamp(

    value,

    min,

    max

){

    return Math.min(

        Math.max(value,min),

        max

    );

}

/*==================================================
    COPY
==================================================*/

export async function copy(text){

    try{

        await navigator.clipboard.writeText(text);

        return true;

    }

    catch{

        return false;

    }

}