import { nullChecker } from './commonUtils';
import crypto from 'crypto-js';

export const setStorageItem = (key, value) => {
    const valueAsString = JSON.stringify(value);
    const encryptedValue = crypto.AES.encrypt(valueAsString,key).toString();
    window.sessionStorage.setItem(key, encryptedValue);
};

export const getStorageItem = key => {
    const encryptedValue = window.sessionStorage.getItem(key);
    if(nullChecker(encryptedValue)){
        const decryptedString = crypto.AES.decrypt(encryptedValue,key)
        .toString(crypto.enc.Utf8);
        return JSON.parse(decryptedString);
    }
    return null;
};

export const removeStorageItem = key => {
    window.sessionStorage.removeItem(key);
}