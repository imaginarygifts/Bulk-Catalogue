/*==================================================
    FIREBASE HELPERS
==================================================*/

import { db } from "../firebase.js";

import {

    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit

} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/*==================================================
    GET COLLECTION
==================================================*/

export async function getCollection(collectionName){

    const snapshot = await getDocs(

        collection(db, collectionName)

    );

    return snapshot.docs.map(doc=>({

        id:doc.id,

        ...doc.data()

    }));

}

/*==================================================
    GET COLLECTION ORDERED
==================================================*/

export async function getOrderedCollection(

    collectionName,

    field="order",

    direction="asc"

){

    const q = query(

        collection(db, collectionName),

        orderBy(field, direction)

    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc=>({

        id:doc.id,

        ...doc.data()

    }));

}

/*==================================================
    GET COLLECTION WHERE
==================================================*/

export async function getWhere(

    collectionName,

    field,

    operator,

    value

){

    const q = query(

        collection(db, collectionName),

        where(field, operator, value)

    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc=>({

        id:doc.id,

        ...doc.data()

    }));

}

/*==================================================
    GET DOCUMENT
==================================================*/

export async function getDocument(

    collectionName,

    id

){

    const snapshot = await getDoc(

        doc(db, collectionName, id)

    );

    if(!snapshot.exists()){

        return null;

    }

    return{

        id:snapshot.id,

        ...snapshot.data()

    };

}

/*==================================================
    ADD DOCUMENT
==================================================*/

export async function addDocument(

    collectionName,

    data

){

    return await addDoc(

        collection(db, collectionName),

        data

    );

}

/*==================================================
    UPDATE DOCUMENT
==================================================*/

export async function updateDocument(

    collectionName,

    id,

    data

){

    return await updateDoc(

        doc(db, collectionName, id),

        data

    );

}

/*==================================================
    DELETE DOCUMENT
==================================================*/

export async function deleteDocument(

    collectionName,

    id

){

    return await deleteDoc(

        doc(db, collectionName, id)

    );

}

/*==================================================
    GET LATEST
==================================================*/

export async function getLatest(

    collectionName,

    field="createdAt",

    count=10

){

    const q = query(

        collection(db, collectionName),

        orderBy(field,"desc"),

        limit(count)

    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc=>({

        id:doc.id,

        ...doc.data()

    }));

}

/*==================================================
    EXISTS
==================================================*/

export async function documentExists(

    collectionName,

    id

){

    const snapshot = await getDoc(

        doc(db, collectionName, id)

    );

    return snapshot.exists();

}

/*==================================================
    GENERATE ORDER
==================================================*/

export function generateOrder(items){

    return items.map((item,index)=>({

        ...item,

        order:index+1

    }));

}

/*==================================================
    SORT BY ORDER
==================================================*/

export function sortByOrder(items){

    return [...items].sort(

        (a,b)=>

        (a.order||0)

        -

        (b.order||0)

    );

}

/*==================================================
    DELAY
==================================================*/

export function delay(ms){

    return new Promise(resolve=>

        setTimeout(resolve,ms)

    );

}

/*==================================================
    TRY CATCH
==================================================*/

export async function safeAsync(callback){

    try{

        return await callback();

    }

    catch(error){

        console.error(error);

        return null;

    }

}