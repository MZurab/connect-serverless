// const CONNECT   = require('../../../connect');
// const LOG       = require('ramman-z-log');
// const FIREBASE  = require("../../../firebase/firebase");
// const firestore = FIREBASE.firestore;

// const FreeformShared        = require('./../FreeformShared').FreeformShared;// FreeformShared

class FreeformElementDb {
    static isFormWithDb (iNform) {
        //@ disc - all form is not have connect with db
        if (
            iNform['options'] &&
            iNform['options']['db']
        ) {
            // this form not savable
            return true;
        }
        return false;
    }

    static getSystemVariable (iNstr) {
        let str     = iNstr,
            regex   = /\{[^\{\}]*\}/g;
        return str.match(regex)
    }
}
module.exports['FreeformElementDb'] = FreeformElementDb;