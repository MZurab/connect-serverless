// const CONNECT   = require('../../../connect');
// const LOG     = require('ramman-z-log');
const FIREBASE  = require("../../../firebase/firebase");
// const firestore = FIREBASE.firestore;

const FreeformFormObject    = require('./FreeformFormObject').FreeformFormObject;// FreeformGlobalStorage
const FreeformFormModel     = require('./FreeformFormModel').FreeformFormModel;// FreeformGlobalStorage



class FreeformForm {



    static get Freeform () {
        return Form.get()
    }

    static get Model () {
        return FreeformFormModel;
    }
    static get Object () {
        return FreeformFormObject;
    }
}
module.exports.FreeformForm = FreeformForm;



