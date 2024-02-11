/*

Use this file to define the colors used in the app.
Strings starting with -- are CSS variables and can be used in CSS files.
If you use inline styles, you can import this file and use the variables as well, by using real variables names.

*/


const hardBackgroundColor = '#00AA70';
const softBackgroundColor = '#a3e3b2'; 
const whiteBackgroundColor = '#f5f5f5'; /*whitesmoke */

const primaryButtonColor = '#1677ff';
const backButtonColor = '#6C757D';
const deleteButtonColor = '#d12121';

document.documentElement.style.setProperty('--hard-background-color', hardBackgroundColor);
document.documentElement.style.setProperty('--soft-background-color', softBackgroundColor);
document.documentElement.style.setProperty('--primary-button-color', primaryButtonColor);
document.documentElement.style.setProperty('--back-button-color', backButtonColor);
document.documentElement.style.setProperty('--delete-button-color', deleteButtonColor);

export default {
    hardBackgroundColor,
    softBackgroundColor,
    whiteBackgroundColor,
    primaryButtonColor,
    backButtonColor,
    deleteButtonColor,
    };
