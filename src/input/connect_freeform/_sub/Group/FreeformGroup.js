// const CONNECT   = require('../../../connect');
// const LOG     = require('ramman-z-log');
// const FIREBASE  = require("../../../firebase/firebase");
// const firestore = FIREBASE.firestore;

const FreeformGroupModel        = require('./FreeformGroupModel').FreeformGroupModel;// FreeformGlobalStorage
const FreeformGroupObject       = require('./FreeformGroupObject').FreeformGroupObject;// FreeformGlobalStorage



class FreeformGroup {
    constructor () {
    }

    static get Model () {
        return FreeformGroupModel;
    }

    static get Object () {
        return FreeformGroupObject;
    }
}
module.exports.FreeformGroup = FreeformGroup;



