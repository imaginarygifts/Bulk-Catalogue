/*==================================================
    SPACER COMPONENT
==================================================*/

export function renderSpacer(container, section){

    const spacer = document.createElement("div");

    spacer.className = "homepage-spacer";

    spacer.style.height =
        `${section.height || 40}px`;

    if(section.background){

        spacer.style.background =
            section.background;

    }

    container.appendChild(spacer);

}