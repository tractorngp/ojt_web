import * as firebase from 'firebase/app';
import 'firebase/storage';

// takes a storage reference and the Blog/File
// return download URL to the uploaded file
const MediaUploader = async (refString, blob) => {
    const storage = firebase.storage();
    const directory = storage.ref(refString);
    return await directory.put(blob).then(async data=>{
        console.log('Upload successful');
        return await data.ref.getDownloadURL();
    }).catch(error => {
        alert('Upload to Storage failed');
        console.error(error);
        return null;
    });
};

export default MediaUploader;