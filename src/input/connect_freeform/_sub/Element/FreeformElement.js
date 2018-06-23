const FreeformElementObject     = require('./FreeformElementObject').FreeformElementObject;// FreeformElementObject
const FreeformElementModel      = require('./FreeformElementModel').FreeformElementModel;// FreeformElementObject
const FreeformElementDb      = require('./FreeformElementDb').FreeformElementDb;// FreeformElementObject




class FreeformElement {
    constructor () {}

    static get Object () {
        return FreeformElementObject;
    }

    static get Model () {
        return FreeformElementModel;
    }

    static get Db () {
        return FreeformElementDb;
    }


}
module.exports.FreeformElement = FreeformElement;




