const CONNECT   = require('../../../connect');
const LOG     = require('ramman-z-log');
// const FIREBASE  = require("../../../firebase/firebase");
// const firestore = FIREBASE.firestore;

class Form {
    constructor () {
    }

    static prepareGlobalObjectForFormModel (iNformUser, iNformModelId) { //-
        if ( !global['freeform'] ) {
            global['freeform'] = {};
        }

        if ( !global['freeform']['form'] ) {
            global['freeform']['form'] = {};
        }

        if ( !global['freeform']['form'][iNformUser] ) {
            global['freeform']['form'][iNformUser] = {};

        }

        if ( !global['freeform']['form'][iNformUser][iNformModelId] ) {
            global['freeform']['form'][iNformUser][iNformModelId] = {};
        }
    }

    static checkModel (iNformUser, iNformModelId) { //-
        if (!global['freeform']) return false;
        if (!global['freeform']['form']) return false;
        if (!global['freeform']['form'][iNformUser]) return false;
        if (!global['freeform']['form'][iNformUser][iNformModelId]) return false;

        return true;
    }


    static checkObject (iNformUser, iNformModelId, iNformId) { //-
        const fname = 'checkObject';
        LOG.fstep(fname, 0, 0, 'INVOKE - iNformUser, iNformModelId, iNformId', iNformUser, iNformModelId, iNformId );
        if ( !Form.checkModel(iNformUser, iNformModelId) ) {
            LOG.fstep(fname, 1, 1, 'checkModel - false', global['freeform'] );
            return false;
        }
        LOG.fstep(fname, 1, 2, 'checkModel - true', global['freeform'] );
        if (!global['freeform']['form'][iNformUser][iNformModelId][iNformId]) {
            LOG.fstep(fname, 2, 1, 'check - false', global['freeform'] );
            return false;
        }
        LOG.fstep(fname, 2, 2, 'check - true', global['freeform'] );

        return true;
    }

    static prepareGlobalObjectForFormObject (iNformUser, iNformModelId, iNformId) { //-

        Form.prepareGlobalObjectForFormModel(iNformUser, iNformModelId);

        if ( !global['freeform']['form'][iNformUser][iNformModelId][iNformId] ) {
            global['freeform']['form'][iNformUser][iNformModelId][iNformId] = {};
        }
    }

    static addObject (iNformUser, iNformModelId, iNformId, iNform ) { //+
        Form.prepareGlobalObjectForFormModel(iNformUser, iNformModelId);


        // add fields block for add later fields for not simpleform
        if (iNform && !iNform['fields']) iNform['fields']={};


        if (
            global['freeform']['form'][iNformUser][iNformModelId][iNformId]
        ) {
            // add with merge with old data
            global['freeform']['form'][iNformUser][iNformModelId][iNformId]   = CONNECT.mergeObject(
                global['freeform']['form'][iNformUser][iNformModelId][iNformId] ,
                iNform
            )
        } else {
            global['freeform']['form'][iNformUser][iNformModelId][iNformId] = iNform;

        }
        console.log("Form.add - global['freeform']", JSON.stringify(global['freeform']) );
    }


    static addModel (iNformUser, iNformModelId, iNmodel ) { //+
        Form.prepareGlobalObjectForFormModel(iNformUser, iNformModelId);

        if (
            global['freeform']['form'][iNformUser][iNformModelId]['@buffer']
        ) {
            // add with merge with old data
            global['freeform']['form'][iNformUser][iNformModelId]['@buffer']   = CONNECT.mergeObject(
                global['freeform']['form'][iNformUser][iNformModelId]['@buffer'] ,
                iNmodel
            )
        } else {
            global['freeform']['form'][iNformUser][iNformModelId]['@buffer'] = iNform;

        }
        console.log("Form.addModel - global['freeform']", JSON.stringify(global['freeform']) );
    }

    static moveFormModelFromBufferToFormObject (iNuser, iNmodelId, iNformId) {
        if (iNformId === '@buffer') return false;
        let formFromBuffer = Form.getObject(iNuser, iNmodelId, '@buffer');
        if (!formFromBuffer) return false;
        // deep clone  of buffer form -> delete bufer form
        formFromBuffer = CONNECT.deepCopyObject(formFromBuffer);
        // delete from buffer form global -> add
        Form.delObject (iNuser, iNmodelId, '@buffer');
        // add buffer form to new place
        Form.addObject (iNuser, iNmodelId, iNformId, formFromBuffer );

        return true;
    }

    static delObject (iNformUser, iNformModelId, iNformId) {
        if ( Form.getObject (iNformUser, iNformModelId, iNformId)) {
            delete global['freeform']['form'][iNformUser][iNformModelId][iNformId];
            return true;
        }
        return false;
    }

    static getModel (iNformUser, iNformModelId) { //+
        if (
            Form.checkModel (iNformUser, iNformModelId)
        ) {
            return global['freeform']['form'][iNformUser][iNformModelId];
        }

        return null;
    }

    static getObject (iNformUser, iNformModelId, iNformId) { //+
        if (
            Form.checkObject (iNformUser, iNformModelId, iNformId)
        ) {
            return global['freeform']['form'][iNformUser][iNformModelId][iNformId];
        }
        return null;
    }
}
module.exports.Form = Form;