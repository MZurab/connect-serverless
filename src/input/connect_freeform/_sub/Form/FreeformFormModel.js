const CONNECT   = require('../../../connect');
const LOG     = require('ramman-z-log');
const FIREBASE  = require("../../../firebase/firebase");
const firestore = FIREBASE.firestore;


const FreeformShared        = require('./../FreeformShared').FreeformShared;// FreeformGlobalStorage
const Form                  = require('./../GlobalStorage/Form').Form;// Form


const AccessListForModel = require('./../AccessList/AccessListForModel').AccessListForModel;

class FreeformFormModel {
    constructor () {

    }
    // AccessList
    static get AccessList () {
        return AccessListForModel;
    }

    static async getModel (iNuserLogin, iNmodelId, iNdata) {
        /*
          @inputs
            @required
              iNuserLogin
              iNmodelId
            @optinal
              iNdata : object
                status: string
        */
        // passed data
        let fname           = 'getRootModel',
            user            = iNuserLogin,
            model           = iNmodelId,
            data            = iNdata || {};

        LOG.fstep (fname, 1, 0,'INVOKE - user, model, data', user, model, data);

        // inner data
        let formStatus      = FreeformShared.formStatus[ ( data['status'] || 'actived' ) ] || 1; // default value - actived

        const   pathToFireStoreDb   = `/freeform/${iNuserLogin}/model/${model}`,
                firestoreRef        = firestore().doc(pathToFireStoreDb);

        LOG.fstep (fname, 1, 1,'create path to fistore db', pathToFireStoreDb);

        // console.log('issetInLocal', issetInLocal);



        return new Promise(
            (resolve) => {
                firestoreRef.get().then(
                    (doc) => {
                        if (doc.exists) {
                            let model = doc.data();
                            LOG.fstep (fname, 1, 2,'this model exis', model);
                            if (
                                model['options'] &&
                                model['options']['status'] === formStatus
                            ) {
                                LOG.fstep (fname, 1, 3,'END - this is need model', model);
                                // this form model need status -> return this model
                                resolve( model );
                                return;

                            }
                        }
                        LOG.fstep (fname, 1, 4,'ERROR - model is not exist');
                        resolve(null)
                    }
                )
                    .catch(
                        (error) => {
                            LOG.fstep (fname, 1, 5,'ERROR - model is not exist');
                            resolve(null)
                        }
                    );
            }
        );
    }
}
module.exports.FreeformFormModel = FreeformFormModel;

