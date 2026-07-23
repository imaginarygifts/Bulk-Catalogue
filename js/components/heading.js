/*==================================================
    HEADING COMPONENT
==================================================*/

export function renderHeading(container, section){

    const heading = document.createElement("section");

    heading.className = "homepage-heading";

    heading.innerHTML = `

<div class="heading-container">

    ${
        section.badge
        ?
        `
        <span class="heading-badge">

            ${section.badge}

        </span>
        `
        :
        ""
    }

    ${
        section.title
        ?
        `
        <h2 class="heading-title">

            ${section.title}

        </h2>
        `
        :
        ""
    }

    ${
        section.subtitle
        ?
        `
        <p class="heading-subtitle">

            ${section.subtitle}

        </p>
        `
        :
        ""
    }

</div>

`;

    container.appendChild(heading);

}