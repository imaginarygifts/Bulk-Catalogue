/*==================================================
    CAROUSEL ENGINE
==================================================*/

export function createCarousel(options){

    const {

        container,

        leftButton,

        rightButton,

        autoPlay = false,

        interval = 5000,

        scrollAmount = 350

    } = options;

    if(!container) return;

    /*==============================================
        BUTTONS
    ==============================================*/

    if(leftButton){

        leftButton.addEventListener(

            "click",

            ()=>{

                container.scrollBy({

                    left:-scrollAmount,

                    behavior:"smooth"

                });

            }

        );

    }

    if(rightButton){

        rightButton.addEventListener(

            "click",

            ()=>{

                container.scrollBy({

                    left:scrollAmount,

                    behavior:"smooth"

                });

            }

        );

    }

    /*==============================================
        TOUCH
    ==============================================*/

    let startX = 0;

    let scrollLeft = 0;

    container.addEventListener(

        "touchstart",

        e=>{

            startX =

            e.touches[0].pageX;

            scrollLeft =

            container.scrollLeft;

        }

    );

    container.addEventListener(

        "touchmove",

        e=>{

            const x =

            e.touches[0].pageX;

            const walk =

            startX - x;

            container.scrollLeft =

            scrollLeft + walk;

        }

    );

    /*==============================================
        MOUSE DRAG
    ==============================================*/

    let isDragging = false;

    let dragStart = 0;

    let dragScroll = 0;

    container.addEventListener(

        "mousedown",

        e=>{

            isDragging = true;

            dragStart = e.pageX;

            dragScroll =

            container.scrollLeft;

            container.classList.add(

                "dragging"

            );

        }

    );

    window.addEventListener(

        "mouseup",

        ()=>{

            isDragging = false;

            container.classList.remove(

                "dragging"

            );

        }

    );

    container.addEventListener(

        "mousemove",

        e=>{

            if(!isDragging) return;

            e.preventDefault();

            const walk =

            dragStart - e.pageX;

            container.scrollLeft =

            dragScroll + walk;

        }

    );

    /*==============================================
        AUTO PLAY
    ==============================================*/

    if(autoPlay){

        let timer = setInterval(

            next,

            interval

        );

        container.addEventListener(

            "mouseenter",

            ()=>clearInterval(timer)

        );

        container.addEventListener(

            "mouseleave",

            ()=>{

                timer = setInterval(

                    next,

                    interval

                );

            }

        );

    }

    /*==============================================
        NEXT
    ==============================================*/

    function next(){

        if(

            container.scrollLeft +

            container.clientWidth >=

            container.scrollWidth - 5

        ){

            container.scrollTo({

                left:0,

                behavior:"smooth"

            });

        }

        else{

            container.scrollBy({

                left:scrollAmount,

                behavior:"smooth"

            });

        }

    }

}