const CONNECT   = require('../../../connect');
const LOG       = require('ramman-z-log');
const FIREBASE  = require("../../../firebase/firebase");
const firestore = FIREBASE.firestore;

// const Field        = require('./../GlobalStorage/Field').Field;// FreeformShared
const Element      = require('./../GlobalStorage/Element').Element;// Element
const ElementShared      = require('./FreeformElementShared').FreeformElementShared;// FreeformElementShared

class FreeformElementModel {

    constructor () {

    }

    static async getElementsFromFormModel (iNelType =null, iNuserLogin, iNmodelId, iNformId = null, iNcallback = null) {
        /*
          @inputs
            @required
              iNuserLogin
              iNmodelId
        */
        // passed data
        let fname   = 'getElementsFromFormModel',
            user    = iNuserLogin,
            model   = iNmodelId,
            formId  = iNformId || '@buffer';

        LOG.fstep (fname, 1, 0,'INVOKE - user, model, data', user, model);


        const   pathToFireStoreDb   = `freeform/${iNuserLogin}/model/${model}/element`,
                firestoreRef        = firestore().collection(pathToFireStoreDb);

        LOG.fstep (fname, 1, 1,'will get  fields models of form model from path - ', pathToFireStoreDb);
        return new Promise(
            (resolve) => {
                firestoreRef.get().then(
                    (docs) => {
                        if ( !docs.empty ) {
                            LOG.fstep (fname, 1, 2,' fields models of form model is  exist');

                            let resultDocs = {};

                            for (let doc of docs.docs) {
                                let dbId                = doc.id,
                                    element             = doc.data(),
                                    elementModelId      = element['modelid'];

                                    resultDocs[elementModelId]    = element;

                                // add to local this field
                                Element.addElementModelToGlobal ( // addFieldModelToGlobal
                                    iNelType || element['options']['object'] ,
                                    user,
                                    model,
                                    formId,
                                    elementModelId,
                                    element
                                );

                                if (typeof iNcallback === 'function') iNcallback(elementModelId, element);
                            }

                            resolve(resultDocs);
                            return;
                        }

                        LOG.fstep (fname, 1, 3,'ERROR -  fields models of form model is not exist');
                        resolve(null);
                    }
                ).catch(
                    (error) => {
                        LOG.fstep (fname, 1, 4,'ERROR -  fields models of form model is not exist - error', error);
                        resolve(null)
                    }
                );
            }
        );
    }

    static async getElementFromFormObject (iNelType, iNuserLogin, iNmodelId, iNformId, iNelId, iNobjType) { // getFieldModelFromFormObject
        /*
          @inputs
            @required
              iNuserLogin
              iNmodelId
              iNformId
        */
        // passed data
        let fname           = 'getElementFromFormObject',
            user            = iNuserLogin,
            model           = iNmodelId,
            elId            = iNelId,
            formId          = iNformId,
            objType         = iNobjType,
            elType          = iNelType,
            dbId            = ElementShared.getDbIdByIdAndType(elType, objType, elId);

        LOG.fstep (fname, 1, 0,'INVOKE - user, model, formId, fieldModelId', user, model, formId, elId);


        const   pathToFireStoreDb   = `freeform/${iNuserLogin}/model/${model}/form/${formId}/element/${dbId}`;

        LOG.fstep (fname, 1, 1,'will get  fields models of form model from path - ', pathToFireStoreDb);

        const firestoreRef        = firestore().doc(pathToFireStoreDb);

        const fieldModelFromLocal = Element.getElement(elType, user, model, formId, elId); // getFieldModel

        if (fieldModelFromLocal) {
            // if we have field model in local (it's possible if we just create) -> get from local
            LOG.fstep (fname, 2, 1,'we have field model in local (it\'s possible if we just create) -> get from local', pathToFireStoreDb, fieldModelFromLocal);
            return CONNECT.returnPromiseWithValue(fieldModelFromLocal);

        } else {
            // if we have NOT field model in local (it's possible if we just create) -> get from firestore db
            LOG.fstep (fname, 2, 2,'we have NOT field model in local (it\'s possible if we just create) -> get from firestore db', pathToFireStoreDb, fieldModelFromLocal);

            return new Promise(
                (resolve) => {
                    firestoreRef.get().then(
                        (doc) => {
                            if (doc.exists) {
                                let fieldModel = doc.data();
                                LOG.fstep (fname, 1, 2,'this fieldObject exis', fieldModel);
                                if ( fieldModel.options.type === 'model' ) {
                                    LOG.fstep (fname, 1, 3,'this fieldObject elType is model');
                                    // this field model is isset add to local
                                    Element.addElementModelToGlobal(//addFieldModelToGlobal
                                        elType,
                                        user,
                                        model,
                                        formId,
                                        elId,
                                        fieldModel
                                    );
                                } else {
                                    LOG.fstep (fname, 1, 3,'this fieldObject elType is object', fieldModel.options.type);
                                    // field not isset add to local null
                                    Element.addElementObjectToGlobal( // addFieldModelToGlobal
                                        elType,
                                        user,
                                        model,
                                        formId,
                                        fieldModel.modelid,
                                        fieldModel.id,
                                        fieldModel
                                    );
                                }
                                // this form model need status -> return this model
                                resolve( fieldModel );
                                return;
                            }

                            LOG.fstep (fname, 1, 4,'ERROR - fieldModel is not exist');
                            resolve(null)
                        }
                    ).catch(
                        (error) => {
                            LOG.fstep (fname, 1, 4,'ERROR -  fields models of form model is not exist');
                            resolve(null)
                        }
                    );
                }
            );

        }
    }

    static async addToFormObjectToDb (iNelType, iNuser, iNformModelId, iNformObjectId, iNelId, iNelModelData, iNobjType, iNfirestoreBatchGroup) {
        /*
          @discr
          @inputs
            @required
            @optinal
              iNdb
              iNbatch
        */

        var fname       = 'addToFormObjectToDb',
            objType     = iNobjType,
            id          =  ElementShared.getDbIdByIdAndType(iNelType, iNobjType, iNelId),
            pathToDoc   = `freeform/${iNuser}/model/${iNformModelId}/form/${iNformObjectId}/element/${id}`;
        // `${iNuser}/model/${iNformModelId}/field/${iNelId}`;


        LOG.fstep (fname,1,0,'INVOKE - iNelType, iNobjType, iNuser, iNformModelId, iNformObjectId, iNelId, iNelModelData, iNbatch',
            iNelType, iNobjType, iNuser, iNformModelId, iNformObjectId, iNelId, iNelModelData, iNfirestoreBatchGroup);


        // add to db
        return FIREBASE.batchGroupCreate(
            pathToDoc,
            iNelModelData,
            iNfirestoreBatchGroup
        );
    }
}
module.exports.FreeformElementModel = FreeformElementModel;