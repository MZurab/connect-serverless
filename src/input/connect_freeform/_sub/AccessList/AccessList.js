// const CONNECT   = require('../../../connect');
// const LOG     = require('ramman-z-log');
// const FIREBASE  = require("../../../firebase/firebase");
// const firestore = FIREBASE.firestore;

const AccessListShared      = require('./AccessListShared').AccessListShared;
const AccessListForModel    = require('./AccessListForModel').AccessListForModel;
const AccessListForObject   = require('./AccessListForObject').AccessListForObject;

class AccessList {// AccessListForModel
    constructor() {

    }
    static get Shared () {
        return AccessListShared;
    }
    static get AccessListForModel () {
        return AccessListForModel;
    }
    static get AccessListForObject () {
        return AccessListForObject;
    }
}
module.exports.AccessList = AccessList;
