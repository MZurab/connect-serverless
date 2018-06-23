const CONNECT   = require('../../../connect');
const LOG       = require('ramman-z-log');
const FIREBASE  = require("../../../firebase/firebase");
const firestore = FIREBASE.firestore;

const FreeformFieldObject     = require('./FreeformFieldOjbect').FreeformFieldObject;// FreeformFieldObject
const FreeformFieldModel      = require('./FreeformFieldModel').FreeformFieldModel;// FreeformFieldObject


class FreeformField {
    constructor () {}

    static get Object () {
        return FreeformFieldObject;
    }

    static get Model () {
        return FreeformFieldModel;
    }
}
module.exports.FreeformField = FreeformField;




