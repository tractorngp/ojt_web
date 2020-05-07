import { nullChecker } from './commonUtils';
import crypto from 'crypto-js';

export const setStorageItem = (key, value) => {
    const valueAsString = JSON.stringify(value);
    const encryptedValue = crypto.AES.encrypt(valueAsString,key);
    window.sessionStorage.setItem(key, encryptedValue);
};

export const getStorageItem = key => {
    const encryptedValue = window.sessionStorage.getItem(key);
    if(nullChecker(encryptedValue)){
        const decryptedString = crypto.AES.decrypt(encryptedValue,key).toString();
        return JSON.parse(decryptedString);
    }
    return null;
};

export const removeStorageItem = key => {
    window.sessionStorage.removeItem(key);
}