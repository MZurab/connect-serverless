const AccessListShared      = require('./AccessListShared').AccessListShared_;
const AccessListForModel    = require('./AccessListForModel').AccessListForModel;
const AccessListForObject   = require('./AccessListForObject').AccessListForObject;

class AccessList {// AccessListForModel

    constructor ()
    {

    }

    static get Shared ()
    {
        return AccessListShared;
    }

    static get AccessListForModel ()
    {
        return AccessListForModel;
    }

    static get AccessListForObject ()
    {
        return AccessListForObject;
    }
}
module.exports.AccessList = AccessList;
