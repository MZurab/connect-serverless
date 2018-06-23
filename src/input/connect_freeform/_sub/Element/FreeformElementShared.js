// const CONNECT   = require('../../../connect');
// const LOG       = require('ramman-z-log');
// const FIREBASE  = require("../../../firebase/firebase");
// const firestore = FIREBASE.firestore;

class FreeformElementShared {
    constructor () {

    }

    static getDbIdByIdAndType (iNtype, iNobjType, iNelId) {
        let elId            = iNelId,
            objType         = iNobjType,
            type            = iNtype,
            dbId            = null;

        switch (type) {
            case "field":
                dbId = (objType === 'model')  ? ('m-f-' + elId) : ('o-f-' + elId );
                break;
            case "page":
                dbId = (objType === 'model')  ? ('m-p-' + elId) : ('o-p-' + elId );
                break;
            case "group":
                dbId = (objType === 'model')  ? ('m-g-' + elId) : ('o-g-' + elId );
                break;
            case "row":
                dbId = (objType === 'model')  ? ('m-r-' + elId) : ('o-r-' + elId );
                break;
        }
        return dbId;
    }


    static getFolderByElementType (iNtype) {
        let type            = iNtype;

        switch (type) {
            case "field":
                return 'fields';
            case "page":
                return 'pages';
            case "group":
                return 'groups';
            case "row":
                return 'rows';
        }
        return null;
    }
}
module.exports.FreeformElementShared = FreeformElementShared;

