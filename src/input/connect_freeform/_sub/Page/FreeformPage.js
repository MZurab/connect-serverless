// const CONNECT   = require('../../../connect');
// const LOG     = require('ramman-z-log');
// const FIREBASE  = require("../../../firebase/firebase");
// const firestore = FIREBASE.firestore;

const FreeformPageModel        = require('./FreeformPageModel').FreeformPageModel;// FreeformGlobalStorage
const FreeformPageObject       = require('./FreeformPageObject').FreeformPageObject;// FreeformGlobalStorage
// const Form                     = require('./../GlobalStorage/Form').Form;// FreeformGlobalStorage



class FreeformPage {
    constructor (
    ) {
    }

    static get Model () {
        return FreeformPageModel;
    }

    static get Object () {
        return FreeformPageObject;
    }



}
module.exports.FreeformPage = FreeformPage;



