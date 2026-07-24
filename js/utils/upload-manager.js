/*==================================================
    UPLOAD MANAGER
==================================================*/

import {

    storage

} from "../firebase.js";

import {

    ref,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject

} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

/*==================================================
    UPLOAD SINGLE IMAGE
==================================================*/

export async function uploadImage({

    file,

    folder="general",

    filename=null,

    onProgress=null

}){

    if(!file){

        throw new Error(

            "No file selected."

        );

    }

    const extension=

    file.name.split(".").pop();

    const name=

    filename ||

    `${Date.now()}.${extension}`;

    const storageRef=

    ref(

        storage,

        `${folder}/${name}`

    );

    return new Promise(

        (resolve,reject)=>{

            const task=

            uploadBytesResumable(

                storageRef,

                file

            );

            task.on(

                "state_changed",

                snapshot=>{

                    const percent=

                    Math.round(

                        snapshot.bytesTransferred

                        /

                        snapshot.totalBytes

                        *

                        100

                    );

                    if(onProgress){

                        onProgress(percent);

                    }

                },

                reject,

                async()=>{

                    const url=

                    await getDownloadURL(

                        task.snapshot.ref

                    );

                    resolve({

                        url,

                        path:task.snapshot.ref.fullPath

                    });

                }

            );

        }

    );

}

/*==================================================
    UPLOAD MULTIPLE
==================================================*/

export async function uploadImages({

    files,

    folder,

    onProgress

}){

    const uploaded=[];

    for(

        let i=0;

        i<files.length;

        i++

    ){

        const result=

        await uploadImage({

            file:files[i],

            folder,

            onProgress:p=>{

                if(onProgress){

                    onProgress(

                        i,

                        p

                    );

                }

            }

        });

        uploaded.push(result);

    }

    return uploaded;

}

/*==================================================
    DELETE IMAGE
==================================================*/

export async function deleteImage(path){

    if(!path) return;

    const imageRef=

    ref(

        storage,

        path

    );

    await deleteObject(

        imageRef

    );

}

