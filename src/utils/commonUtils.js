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