/*==================================================
    YOUTUBE CAROUSEL
    Independent Homepage Component

    BEHAVIOR:
    - NO automatic playback on page load
    - Swipe/scroll -> centered video plays WITH SOUND
    - Tap video -> plays WITH SOUND
    - Only one video plays at a time
==================================================*/


/*==================================================
    YOUTUBE IFRAME API
==================================================*/

let youtubeApiPromise = null;


function loadYouTubeAPI(){

    if(
        window.YT &&
        window.YT.Player
    ){

        return Promise.resolve(
            window.YT
        );

    }


    if(youtubeApiPromise){

        return youtubeApiPromise;

    }


    youtubeApiPromise =
        new Promise(
            resolve => {

                const previousCallback =
                    window.onYouTubeIframeAPIReady;


                window.onYouTubeIframeAPIReady =
                    () => {

                        if(
                            typeof previousCallback ===
                            "function"
                        ){

                            previousCallback();

                        }


                        resolve(
                            window.YT
                        );

                    };


                const existing =
                    document.querySelector(
                        'script[src="https://www.youtube.com/iframe_api"]'
                    );


                if(existing){

                    return;

                }


                const script =
                    document.createElement(
                        "script"
                    );


                script.src =
                    "https://www.youtube.com/iframe_api";


                script.async = true;


                document.head.appendChild(
                    script
                );

            }
        );


    return youtubeApiPromise;

}


/*==================================================
    RENDER YOUTUBE CAROUSEL
==================================================*/

function renderYoutubeCarousel(
    container,
    section
){

    const videos =
        Array.isArray(
            section.videos
        )
            ? section.videos
            : [];


    /*==================================================
        REMOVE EMPTY SECTION
    ==================================================*/

    if(!videos.length){

        container.remove();

        return;

    }


    /*==================================================
        VALID VIDEOS
    ==================================================*/

    const validVideos =
        videos
            .map(
                video => {

                    const videoId =
                        getYoutubeVideoId(
                            video.url
                        );


                    if(!videoId){

                        return null;

                    }


                    return {

                        ...video,

                        videoId

                    };

                }
            )
            .filter(
                Boolean
            );


    if(!validVideos.length){

        container.remove();

        return;

    }


    /*==================================================
        HTML
    ==================================================*/

    container.innerHTML = `

        <div class="home-container">

            ${renderYoutubeSectionHeading(
                section
            )}


            <div
                class="youtube-carousel"
                data-youtube-carousel
            >

                ${
    validVideos.map(
        video => {

            const thumbnail =
                getYoutubeThumbnail(
                    video.videoId
                );


            return `

                <div
                    class="youtube-item"
                    data-video-id="${escapeAttribute(
                        video.videoId
                    )}"
                >

                    <!-- VIDEO BOX -->

                    <div class="youtube-video-box">

                        <!-- THUMBNAIL -->

                        <div
                            class="youtube-thumbnail"
                            style="
                                background-image:url(
                                    '${escapeAttribute(
                                        thumbnail
                                    )}'
                                );
                            "
                            aria-label="Play video"
                            role="button"
                            tabindex="0"
                        ></div>


                        <!-- PLAY ICON -->

                        <div
                            class="youtube-play-indicator"
                            aria-hidden="true"
                        ></div>

                    </div>


                    <!-- VIDEO TITLE -->

                    ${
                        video.title
                        ?
                        `
                        <div class="youtube-video-title">

                            ${escapeHtml(
                                video.title
                            )}

                        </div>
                        `
                        :
                        ""
                    }

                </div>

            `;

        }
    ).join("")
}

            

            </div>

        </div>

    `;


    initYoutubeCarousel(
        container,
        section
    );

}


/*==================================================
    YOUTUBE SECTION HEADING
==================================================*/

function renderYoutubeSectionHeading(
    section
){

    const hasTitle =
        Boolean(
            section.title
        );


    const hasSubtitle =
        Boolean(
            section.subtitle
        );


    if(
        !hasTitle &&
        !hasSubtitle
    ){

        return "";

    }


    const titleColor =
        section.titleColor ||
        "#ffffff";


    const subtitleColor =
        section.subtitleColor ||
        "#aaaaaa";


    return `

        <div class="carousel-heading">

            <div>

                ${
                    hasTitle
                    ?
                    `
                    <h2
                        style="
                            color:${escapeAttribute(
                                titleColor
                            )};
                        "
                    >
                        ${escapeHtml(
                            section.title
                        )}
                    </h2>
                    `
                    :
                    ""
                }


                ${
                    hasSubtitle
                    ?
                    `
                    <p
                        style="
                            color:${escapeAttribute(
                                subtitleColor
                            )};
                        "
                    >
                        ${escapeHtml(
                            section.subtitle
                        )}
                    </p>
                    `
                    :
                    ""
                }

            </div>

        </div>

    `;

}


/*==================================================
    YOUTUBE CAROUSEL CONTROLLER
==================================================*/

async function initYoutubeCarousel(
    container,
    section
){

    const carousel =
        container.querySelector(
            "[data-youtube-carousel]"
        );


    if(!carousel){

        return;

    }


    const slides =
        Array.from(
            carousel.querySelectorAll(
                ".youtube-item"
            )
        );


    if(!slides.length){

        return;

    }


    /*==================================================
        PLAYER STORAGE
    ==================================================*/

    const players =
        new Array(
            slides.length
        ).fill(null);


    const playerReady =
        new Array(
            slides.length
        ).fill(false);


    let activeIndex =
        -1;


    let scrollTimer =
        null;


    let readyCount =
        0;


    /*==================================================
        LOAD API
    ==================================================*/

    try{

        await loadYouTubeAPI();

    }

    catch(error){

        console.error(
            "YouTube API failed:",
            error
        );

        return;

    }


    /*==================================================
        CREATE PLAYERS
    ==================================================*/

    slides.forEach(
        (slide,index) => {

            const videoId =
                slide.dataset.videoId;


            if(!videoId){

                return;

            }


            const iframe =
                document.createElement(
                    "iframe"
                );


            /*
                Keep iframe hidden until
                user starts a video.
            */

            iframe.style.display =
                "none";


            iframe.src =
                `https://www.youtube.com/embed/${encodeURIComponent(
                    videoId
                )}?enablejsapi=1&playsinline=1&controls=0&rel=0&autoplay=0&fs=0&iv_load_policy=3&disablekb=1&modestbranding=1`;


            iframe.title =
                "Product Video";


            iframe.setAttribute(
                "frameborder",
                "0"
            );


            iframe.setAttribute(
                "allow",
                "autoplay; encrypted-media; picture-in-picture"
            );


            iframe.setAttribute(
                "allowfullscreen",
                ""
            );


            slide.appendChild(
                iframe
            );


            /*==================================================
                CREATE YOUTUBE PLAYER
            ==================================================*/

            const player =
                new YT.Player(
                    iframe,
                    {

                        events: {

                            /*======================================
                                READY
                            ======================================*/

                            onReady:
                                event => {

                                    players[index] =
                                        event.target;


                                    playerReady[index] =
                                        true;


                                    readyCount++;


                                    /*
                                        IMPORTANT:

                                        We DO NOT call mute().
                                        We DO NOT call playVideo().

                                        The video stays stopped until
                                        the user interacts.
                                    */

                                },


                            /*======================================
                                STATE CHANGE
                            ======================================*/

                            onStateChange:
                                event => {

                                    if(
                                        event.data ===
                                        YT.PlayerState.ENDED
                                    ){

                                        resetVideo(
                                            index
                                        );

                                    }

                                },


                            /*======================================
                                ERROR
                            ======================================*/

                            onError:
                                event => {

                                    console.warn(
                                        "YouTube error:",
                                        event.data
                                    );


                                    resetVideo(
                                        index
                                    );

                                }

                        }

                    }
                );


            players[index] =
                player;

        }
    );


    /*==================================================
        PLAY VIDEO
        USER ACTION ONLY
    ==================================================*/

    function playVideo(
        index
    ){

        if(
            index < 0 ||
            index >= slides.length
        ){

            return;

        }


        /*==============================================
            STOP ALL OTHER VIDEOS
        ==============================================*/

        slides.forEach(
            (_,i) => {

                if(i !== index){

                    resetVideo(
                        i
                    );

                }

            }
        );


        /*==============================================
            PLAYER NOT READY
        ==============================================*/

        if(
            !playerReady[index] ||
            !players[index]
        ){

            /*
                The YouTube player may still be loading.

                Do NOT automatically play it later.

                This is important because we only want
                playback as a result of user interaction.
            */

            console.warn(
                "YouTube player is not ready yet."
            );

            return;

        }


        activateVideo(
            index
        );

    }


    /*==================================================
        ACTIVATE VIDEO
    ==================================================*/

    function activateVideo(
        index
    ){

        const player =
            players[index];


        const slide =
            slides[index];


        if(
            !player ||
            !slide
        ){

            return;

        }


        /*==================================================
            STOP OTHER PLAYERS
        ==================================================*/

        slides.forEach(
            (_,i) => {

                if(i === index){

                    return;

                }


                const otherPlayer =
                    players[i];


                if(
                    otherPlayer &&
                    playerReady[i]
                ){

                    try{

                        otherPlayer.pauseVideo();

                    }

                    catch(error){}

                }


                slides[i]
                    .classList
                    .remove(
                        "is-playing"
                    );


                const otherIframe =
                    slides[i]
                        .querySelector(
                            "iframe"
                        );


                if(otherIframe){

                    otherIframe.style.display =
                        "none";

                }

            }
        );


        /*==================================================
            ACTIVE SLIDE
        ==================================================*/

        activeIndex =
            index;


        slide.classList.add(
            "is-playing"
        );


        const iframe =
            slide.querySelector(
                "iframe"
            );


        if(iframe){

            iframe.style.display =
                "block";

        }


        updateYoutubeDots(
            carousel,
            index
        );


        /*==================================================
            SOUND
        ==================================================*/

        /*
            This playback is triggered by the user's
            click/touch/swipe interaction.

            Therefore we explicitly enable sound.
        */

        try{

            player.unMute();

            player.setVolume(
                100
            );

        }

        catch(error){

            console.warn(
                "Unable to enable YouTube sound:",
                error
            );

        }


        /*==================================================
            PLAY
        ==================================================*/

        try{

            player.playVideo();

        }

        catch(error){

            console.warn(
                "Unable to play YouTube video:",
                error
            );

        }

    }


    /*==================================================
        RESET VIDEO
    ==================================================*/

    function resetVideo(
        index
    ){

        if(
            index < 0 ||
            index >= slides.length
        ){

            return;

        }


        const player =
            players[index];


        if(
            player &&
            playerReady[index]
        ){

            try{

                player.pauseVideo();

            }

            catch(error){}

        }


        const slide =
            slides[index];


        slide.classList.remove(
            "is-playing"
        );


        const iframe =
            slide.querySelector(
                "iframe"
            );


        if(iframe){

            iframe.style.display =
                "none";

        }


        if(
            activeIndex === index
        ){

            activeIndex =
                -1;

        }

    }


    /*==================================================
        STOP ALL
    ==================================================*/

    function stopAll(){

        slides.forEach(
            (_,index) => {

                resetVideo(
                    index
                );

            }
        );

    }


    /*==================================================
        CENTER SLIDE
    ==================================================*/

    function getCenterSlide(){

        const carouselRect =
            carousel.getBoundingClientRect();


        const carouselCenter =
            carouselRect.left +
            (
                carouselRect.width /
                2
            );


        let closestIndex =
            -1;


        let closestDistance =
            Infinity;


        slides.forEach(
            (slide,index) => {

                const rect =
                    slide.getBoundingClientRect();


                const slideCenter =
                    rect.left +
                    (
                        rect.width /
                        2
                    );


                const distance =
                    Math.abs(
                        carouselCenter -
                        slideCenter
                    );


                if(
                    distance <
                    closestDistance
                ){

                    closestDistance =
                        distance;


                    closestIndex =
                        index;

                }

            }
        );


        return closestIndex;

    }


    /*==================================================
        HORIZONTAL SWIPE / SCROLL
    ==================================================*/

    carousel.addEventListener(
        "scroll",
        () => {

            clearTimeout(
                scrollTimer
            );


            /*==========================================
                STOP CURRENT VIDEO WHEN IT MOVES AWAY
            ==========================================*/

            if(
                activeIndex >= 0
            ){

                const currentSlide =
                    slides[
                        activeIndex
                    ];


                if(currentSlide){

                    const rect =
                        currentSlide.getBoundingClientRect();


                    const carouselRect =
                        carousel.getBoundingClientRect();


                    const carouselCenter =
                        carouselRect.left +
                        (
                            carouselRect.width /
                            2
                        );


                    const currentCenter =
                        rect.left +
                        (
                            rect.width /
                            2
                        );


                    if(
                        Math.abs(
                            currentCenter -
                            carouselCenter
                        ) >
                        rect.width * 0.35
                    ){

                        resetVideo(
                            activeIndex
                        );

                    }

                }

            }


            /*==========================================
                AFTER USER FINISHES SWIPING
            ==========================================*/

            scrollTimer =
                setTimeout(
                    () => {

                        const centerIndex =
                            getCenterSlide();


                        if(
                            centerIndex < 0
                        ){

                            return;

                        }


                        /*
                            IMPORTANT:

                            This playback happens after
                            a USER SCROLL/TOUCH gesture.

                            Sound is therefore requested.
                        */

                        playVideo(
                            centerIndex
                        );

                    },
                    180
                );

        },
        {
            passive:true
        }
    );


    /*==================================================
        CLICK / TOUCH VIDEO
    ==================================================*/

    carousel.addEventListener(
        "click",
        event => {

            const slide =
                event.target.closest(
                    ".youtube-item"
                );


            if(!slide){

                return;

            }


            const index =
                slides.indexOf(
                    slide
                );


            if(index < 0){

                return;

            }


            /*
                Direct user click.

                Video plays with sound.
            */

            playVideo(
                index
            );

        }
    );


    /*==================================================
        KEYBOARD
    ==================================================*/

    carousel.addEventListener(
        "keydown",
        event => {

            const thumbnail =
                event.target.closest(
                    ".youtube-thumbnail"
                );


            if(!thumbnail){

                return;

            }


            if(
                event.key !== "Enter" &&
                event.key !== " "
            ){

                return;

            }


            event.preventDefault();


            const slide =
                thumbnail.closest(
                    ".youtube-item"
                );


            if(!slide){

                return;

            }


            const index =
                slides.indexOf(
                    slide
                );


            if(index < 0){

                return;

            }


            playVideo(
                index
            );

        }
    );


    /*==================================================
        VISIBILITY
    ==================================================*/

    const visibilityObserver =
        new IntersectionObserver(
            entries => {

                entries.forEach(
                    entry => {

                        if(
                            entry.target !==
                            carousel
                        ){

                            return;

                        }


                        if(
                            !entry.isIntersecting
                        ){

                            stopAll();

                        }

                    }
                );

            },
            {
                threshold:0.05
            }
        );


    visibilityObserver.observe(
        carousel
    );


    /*==================================================
        PAGE VISIBILITY
    ==================================================*/

    document.addEventListener(
        "visibilitychange",
        () => {

            if(
                document.hidden
            ){

                stopAll();

            }

        }
    );

}


/*==================================================
    GET YOUTUBE VIDEO ID
==================================================*/

function getYoutubeVideoId(
    url
){

    if(!url){

        return "";

    }


    const value =
        String(url).trim();


    /*==============================================
        DIRECT VIDEO ID
    ==============================================*/

    if(
        /^[a-zA-Z0-9_-]{11}$/.test(
            value
        )
    ){

        return value;

    }


    try{

        const parsed =
            new URL(value);


        const hostname =
            parsed.hostname
                .toLowerCase()
                .replace(
                    "www.",
                    ""
                );


        /*==========================================
            SHORTS
        ==========================================*/

        if(
            hostname ===
            "youtube.com" &&
            parsed.pathname.startsWith(
                "/shorts/"
            )
        ){

            return parsed.pathname
                .split("/shorts/")[1]
                .split("/")[0]
                .split("?")[0];

        }


        /*==========================================
            NORMAL WATCH
        ==========================================*/

        if(
            hostname ===
            "youtube.com"
        ){

            const id =
                parsed.searchParams.get(
                    "v"
                );


            if(id){

                return id;

            }

        }


        /*==========================================
            YOUTU.BE
        ==========================================*/

        if(
            hostname ===
            "youtu.be"
        ){

            return parsed.pathname
                .replace(
                    "/",
                    ""
                )
                .split("?")[0];

        }

    }

    catch(error){

        console.warn(
            "Invalid YouTube URL:",
            url
        );

    }


    return "";

}


/*==================================================
    THUMBNAIL
==================================================*/

function getYoutubeThumbnail(
    videoId
){

    if(!videoId){

        return "";

    }


    return `https://img.youtube.com/vi/${encodeURIComponent(
        videoId
    )}/hqdefault.jpg`;

}


/*==================================================
    DOTS
==================================================*/

function updateYoutubeDots(
    carousel,
    index
){

    const container =
        carousel.closest(
            ".home-section"
        );


    if(!container){

        return;

    }


    const dots =
        container.querySelectorAll(
            ".carousel-dots span"
        );


    dots.forEach(
        (dot,i) => {

            dot.classList.toggle(
                "active",
                i === index
            );

        }
    );

}


/*==================================================
    ESCAPE HTML
==================================================*/

function escapeHtml(
    value
){

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

function escapeAttribute(
    value
){

    return escapeHtml(
        value
    );

}


/*==================================================
    EXPORT
==================================================*/

export {

    renderYoutubeCarousel,

    initYoutubeCarousel,

    getYoutubeVideoId,

    getYoutubeThumbnail

};