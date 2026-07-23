/*==================================================
    DRAG DROP
==================================================*/

export function enableDragDrop({

    container,

    items,

    onChange

}){

    let draggedItem = null;

    function render(){

        const cards =

        container.querySelectorAll(

            ".builder-section"

        );

        cards.forEach((card,index)=>{

            card.draggable = true;

            card.dataset.index = index;

            card.addEventListener(

                "dragstart",

                dragStart

            );

            card.addEventListener(

                "dragover",

                dragOver

            );

            card.addEventListener(

                "drop",

                drop

            );

            card.addEventListener(

                "dragend",

                dragEnd

            );

        });

    }

    function dragStart(e){

        draggedItem =

        Number(

            this.dataset.index

        );

        this.classList.add(

            "dragging"

        );

    }

    function dragOver(e){

        e.preventDefault();

    }

    async function drop(){

        const target =

        Number(

            this.dataset.index

        );

        if(

            draggedItem===null ||

            draggedItem===target

        ){

            return;

        }

        const moved =

        items.splice(

            draggedItem,

            1

        )[0];

        items.splice(

            target,

            0,

            moved

        );

        items.forEach((item,index)=>{

            item.order =

            index+1;

        });

        if(onChange){

            await onChange(

                items

            );

        }

    }

    function dragEnd(){

        this.classList.remove(

            "dragging"

        );

        draggedItem = null;

    }

    render();

}