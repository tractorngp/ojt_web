export const nullChecker = val => {
    return val !== null && val !== undefined;
};

export const listEmptyChecker = val => {
    if(nullChecker(val)){
        if(val.length > 0){ 
            return true;
        }
    }
    return false;
}

export const stringIsEmpty = val => {
    return !(val !== null && val !== undefined && val.length > 0);
}

export const stringIsNotEmpty = val => {
    return !stringIsEmpty(val);
};