// const CONNECT   = require('../../../connect');
// const LOG     = require('ramman-z-log');
// const FIREBASE  = require("../../../firebase/firebase");
// const firestore = FIREBASE.firestore;

const FreeformRowModel        = require('./FreeformRowModel').FreeformRowModel;// FreeformGlobalStorage
const FreeformRowObject       = require('./FreeformRowObject').FreeformRowObject;// FreeformGlobalStorage



class FreeformRow {
    constructor () {}

    static get Model () {
        return FreeformRowModel;
    }

    static get Object () {
        return FreeformRowObject;
    }
}
module.exports.FreeformRow = FreeformRow;



