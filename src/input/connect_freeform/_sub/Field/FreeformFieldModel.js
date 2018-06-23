const CONNECT   = require('../../../connect');
const LOG       = require('ramman-z-log');
const FIREBASE  = require("../../../firebase/firebase");
const firestore = FIREBASE.firestore;

// const Field        = require('./../GlobalStorage/Field').Field;// FreeformShared
const Element      = require('./../GlobalStorage/Element').Element;// FreeformShared
const FreeformElementModel      = require('./../Element/FreeformElementModel').FreeformElementModel;// FreeformShared

class FreeformFieldModel {

    static async getFieldsFromFormModel (iNuserLogin, iNmodelId, iNformId = null, iNcallback = null) {
        return FreeformElementModel.getElementsFromFormModel('field', iNuserLogin, iNmodelId, iNformId, iNcallback);
    }

    // static async getFieldFromFormModel ( iNuserLogin, iNmodelId, iNfieldModelId ) {
    //     /*
    //       @inputsgetFormModelAccessList
    //         @required
    //           iNuserLogin : string
    //           iNmodelId : string
    //           iNfieldModelId : string
    //     */
    //     // passed data
    //     let fname           = 'getFieldFromFormModel',
    //         user            = iNuserLogin,
    //         modelId         = iNmodelId,
    //         fieldModelId    = iNfieldModelId;
    //
    //     LOG.fstep (fname, 1, 0,'INVOKE - user, modelId, data', user, modelId);
    //
    //
    //     const   pathToFireStoreDb   = `/freeform/${user}/model/${modelId}/element/${fieldModelId}`,
    //             firestoreRef        = firestore().doc(pathToFireStoreDb),
    //             isInLocal           = Element.getElementModelFromBuffer('field', user,modelId,fieldModelId); // getFieldModelFromBuffer
    //
    //     if (isInLocal) {
    //         // we have model in local -> get from local
    //         LOG.fstep (fname, 1, 1,'We have model in local -> get from local', pathToFireStoreDb, isInLocal);
    //
    //     } else {
    //         // we have NOT model in local -> get from db
    //         LOG.fstep (fname, 1, 1,'We have NOT model in local -> get from db', pathToFireStoreDb, isInLocal);
    //
    //         return new Promise (
    //             (resolve) => {
    //                 firestoreRef.get().then(
    //                     (docs) => {
    //                         if (doc.exists) {
    //                             let fieldModel = doc.data();
    //                             LOG.fstep (fname, 1, 2,'this fieldObject exis', fieldModel);
    //                             if (
    //                                 fieldModel
    //                             ) {
    //                                 LOG.fstep (fname, 1, 3,'END - this is need fieldModel', fieldModel);
    //                                 // this form model need status -> return this model
    //                                 resolve( fieldModel );
    //                                 return;
    //
    //                             }
    //                         }
    //                         LOG.fstep (fname, 1, 4,'ERROR - fieldModel is not exist');
    //                         resolve(null)
    //                     }
    //                 ).catch(
    //                     (error) => {
    //                         LOG.fstep (fname, 1, 4,'ERROR - fieldModel is not exist');
    //                         resolve(null)
    //                     }
    //                 );
    //             }
    //         );
    //
    //     }
    // }





    static async getFieldFromFormObject (iNuserLogin, iNmodelId, iNformId, iNfieldId, iNobjType) { // getFieldModelFromFormObject
        /*
          @inputs
            @required
              iNuserLogin
              iNmodelId
              iNformId
        */
        return FreeformElementModel.getElementFromFormObject('field', iNuserLogin, iNmodelId, iNformId, iNfieldId, iNobjType);
    }


    // static async getFieldsFromFormObject (iNuserLogin, iNmodelId, iNformId) {
    //     /*
    //       @inputs
    //         @required
    //           iNuserLogin
    //           iNmodelId
    //           iNformId
    //     */
    //     // passed data
    //     let fname = 'getFieldsFromFormObject',
    //         user            = iNuserLogin,
    //         model           = iNmodelId;
    //
    //     LOG.fstep (fname, 1, 0,'INVOKE - user, model, data', user, model);
    //
    //
    //     const   pathToFireStoreDb   = `freeform/${iNuserLogin}/model/${model}/form/${iNformId}/element`,
    //             firestoreRef        = firestore().collection(pathToFireStoreDb);
    //
    //     LOG.fstep (fname, 1, 1,'will get  fields models of form model from path - ', pathToFireStoreDb);
    //     return new Promise(
    //         (resolve) => {
    //             firestoreRef.get().then(
    //                 (docs) => {
    //                     if ( !docs.empty ) {
    //                         LOG.fstep (fname, 1, 2,' fields models of form model is  exist');
    //
    //                         let resultDocs = {};
    //
    //                         for (let doc of docs.docs) {
    //                             resultDocs[doc.id] = doc.data();
    //                         }
    //
    //                         resolve(resultDocs);
    //                         return;
    //                     }
    //
    //                     LOG.fstep (fname, 1, 3,'ERROR -  fields models of form model is not exist');
    //                     resolve(null);
    //                 }
    //             ).catch (
    //                 (error) => {
    //                     LOG.fstep (fname, 1, 4,'ERROR -  fields models of form model is not exist');
    //                     resolve(null)
    //                 }
    //             );
    //         }
    //     );
    // }

    // static async getFieldModelsFromFormObject (iNuserLogin, iNmodelId, iNformId) {
    //     /*
    //       @inputs
    //         @required
    //           iNuserLogin
    //           iNmodelId
    //     */
    //     // passed data
    //     let fname           = 'getFieldModelsFromFormObject',
    //         user            = iNuserLogin,
    //         modelId         = iNmodelId,
    //         formId          = iNformId;
    //
    //     LOG.fstep (fname, 1, 0,'INVOKE - user, model, formId', user, modelId, formId);
    //
    //
    //     const   pathToFireStoreDb   = `freeform/${iNuserLogin}/model/${modelId}/form/${formId}/field`,
    //         firestoreRef        = firestore().collection(pathToFireStoreDb);
    //
    //     LOG.fstep (fname, 1, 1,'will get  fields models of form model from path - ', pathToFireStoreDb);
    //     return new Promise(
    //         (resolve) => {
    //             firestoreRef.get().then(
    //                 (docs) => {
    //                     if ( !docs.empty ) {
    //                         LOG.fstep (fname, 1, 2,' fields models of form model is  exist - docs', docs.docs);
    //
    //                         let resultDocs = {};
    //
    //                         for (let doc of docs.docs) {
    //                             resultDocs[doc.id] = doc.data();
    //                         }
    //
    //                         resolve(resultDocs);
    //                         return;
    //                     }
    //
    //                     LOG.fstep (fname, 1, 3,'ERROR -  fields models of form model is not exist');
    //                     resolve(null);
    //                 }
    //             ).catch(
    //                 (error) => {
    //                     LOG.fstep (fname, 1, 4,'ERROR -  fields models of form model is not exist - error', error);
    //                     resolve(null)
    //                 }
    //             );
    //         }
    //     );
    // }

    static async addToFormObjectToDb (iNuser, iNformModelId, iNformObjectId, iNfieldModelId, iNfieldModelData, iNobjType, iNfirestoreBatchGroup) {
        /*
          @discr
          @inputs
            @required
            @optinal
              iNdb
              iNbatch
        */

        var fname       = 'addForFormObjectToDb',
            objType     = iNobjType,
            id          =  (objType === 'model') ? ('m-f-' + iNfieldModelId) : ('o-f-' + iNfieldModelId),
            pathToDoc   = `freeform/${iNuser}/model/${iNformModelId}/form/${iNformObjectId}/element/${id}`;
        // `${iNuser}/model/${iNformModelId}/field/${iNfieldModelId}`;


        LOG.fstep (fname,1,0,'INVOKE - iNuser, iNformModelId, iNformObjectId, iNfieldModelId, iNfieldModelData, iNbatch',
            iNuser, iNformModelId, iNformObjectId, iNfieldModelId, iNfieldModelData, iNfirestoreBatchGroup);


        // add to db
        return FIREBASE.batchGroupCreate (
            pathToDoc,
            iNfieldModelData,
            iNfirestoreBatchGroup
        )


        // FIREBASE.safeCreateFirestoreDb(
        //     'freeform',
        //     pathToDoc,
        //     iNfieldModelData,
        //     iNbatch
        // );
    }

}
module.exports.FreeformFieldModel = FreeformFieldModel;
