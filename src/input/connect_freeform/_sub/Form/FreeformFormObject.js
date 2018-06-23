const CONNECT   = require('../../../connect');
const LOG       = require('ramman-z-log');
const FIREBASE  = require("../../../firebase/firebase");
const firestore = FIREBASE.firestore;

const AccessListForObject   = require('./../AccessList/AccessListForObject').AccessListForObject;
const Form                  = require('./../GlobalStorage/Form').Form;


const FreeformShared        = require('./../FreeformShared').FreeformShared;    // FreeformGlobalStorage
const FreeformPage          = require('./../Page/FreeformPage').FreeformPage;   // FreeformGlobalStorage


class FreeformFormObject {
    constructor () {
    }
    // AccessList
    static get AccessList () {
        return AccessListForObject;
    }

    static async updateFormStatus (iNuser, iNformModelId, iNformObjectId, iNstatus, iNfirestoreGroupBatch) {
        if (typeof iNstatus !== 'number') return CONNECT.returnPromiseValue(false);
        
        return FIREBASE.batchGroupUpdate (
            `freeform/${iNuser}/model/${iNformModelId}/form/${iNformObjectId}`,
            { 'options.status' : iNstatus },
            iNfirestoreGroupBatch
        );
    }
    
    static async updateFormState (iNuser, iNformModelId, iNformObjectId, iNstate, iNfirestoreGroupBatch) {
        if (typeof iNstate !== 'number') return CONNECT.returnPromiseValue(false);

        return FIREBASE.batchGroupUpdate (
            `freeform/${iNuser}/model/${iNformModelId}/form/${iNformObjectId}`,
            { 'options.state' : iNstate },
            iNfirestoreGroupBatch
        );
    }
    
    static async addToDb (iNuser, iNformModelId, iNformObjectId, iNform, iNfirestoreBatchGroup) {
        /*
          @discr
          @inputs
            @required
            @optinal
              iNdb
              iNbatch
        */
        const   fname       = 'FreeformFormObject.addToDb';

        LOG.fstep (fname,1,0,'INVOKE - iNuser, iNformModelId, iNformObjectId',
            iNuser, iNformModelId, iNformObjectId);

        const   pathToDoc   = `${iNuser}/model/${iNformModelId}/form/${iNformObjectId}`,
                formUser    = iNuser,
                form        = iNform,
                modelId     = iNformModelId,
                formId      = iNformObjectId;
        // `${iNuser}/model/${iNformModelId}/field/${iNfieldModelId}`;

        LOG.fstep (fname,1,0,'INVOKE - modelId, formId, pathToDoc, form', modelId, formId, pathToDoc, form);

        // add to global (would need later access if want create form object)
        Form.addObject ( formUser, modelId, formId, form );
        

        // add to db

        return FIREBASE.batchGroupCreate (
            `freeform/${pathToDoc}`,
            iNform ,
            iNfirestoreBatchGroup
        );
        // return FIREBASE.safeCreateFirestoreDb(
        //     'freeform',
        //     pathToDoc,
        //     iNform,
        //     iNfirestoreBatch
        // );
    }

    static async getObject (iNuserForm, iNmodelId, iNformId, iNdata) {
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
        let fname = 'FormObject.getObject',
            userForm       = iNuserForm,
            modelId         = iNmodelId,
            formId          = iNformId,
            data            = iNdata || {};

        LOG.fstep(fname, 0, 0, 'INVOKE - iNuserForm, iNmodelId, iNformId, iNdata', iNuserForm, iNmodelId, iNformId, iNdata);

        // inner data
        let formStatus      = FreeformShared.formStatus[ ( data['status'] || 'actived' ) ] || 1; // default get for by status - actived

        const   pathToFireStoreDb   = `freeform/${userForm}/model/${modelId}/form/${formId}`,
                firestoreRef        = firestore().doc(pathToFireStoreDb),
                isInLocal           = Form.checkObject(userForm, modelId, formId);

        LOG.fstep (fname, 1, 0,'INVOKE - user, model, data, pathToFireStoreDb, isInLocal', userForm, modelId, data, pathToFireStoreDb, isInLocal);

        if ( !isInLocal ) {
            LOG.fstep (fname, 1, 1,'We have not in local -> get from db');
            return new Promise(
                (resolve) => {
                    firestoreRef.get().then(
                        (doc) => {
                            if (doc.exists) {
                                let object = doc.data();
                                LOG.fstep (fname, 1, 2,'this model exis', object);
                                if (
                                    object['options'] &&
                                    ( !data['status'] ||  object['options']['status'] === formStatus )
                                ) {
                                    // add to global (would need later access if want create form object)
                                    Form.addObject ( userForm, modelId, formId, object );

                                    LOG.fstep (fname, 1, 3,'END - this is need model', object);
                                    // this form model need status -> return this model
                                    resolve( object );
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
            )
        } else {
            let objectFromLocal =  Form.getObject(userForm,modelId,formId);
            LOG.fstep (fname, 1, 1,'We have in local -> return from local', objectFromLocal);
            return objectFromLocal;
        }
    }

    static async init (iNformUser, iNformModelId, iNformId, iNform, iNfirestoreBatchGroup, iNjustCreated = false ) {
        let fname       = 'Form.init',
            freeform    = iNform;
        //@< checking
            // check map
                if (Array.isArray(freeform.map) && freeform.map.length > 0) {
                    const map = freeform.map;
                    // iterate array
                    for (const thisMapKey in map) {
                        const thisMap = map[thisMapKey];
                        if ( !FreeformFormObject.checkMap(thisMap['baseid'], thisMap['objid'], freeform) ) {
                            // create <= page object not isset
                            let result = null;
                            try {
                                // create form
                                result = await FreeformPage.Object.create(
                                    freeform,
                                    iNformUser,
                                    iNformModelId,
                                    iNformId,

                                    { id: thisMap['baseid'], inid: thisMap['objid'], 'index': thisMapKey },
                                    null,
                                    false,
                                    null,

                                    iNfirestoreBatchGroup
                                );
                            } catch (e) {
                                console.log(fname, 'page create from map- errror - e', e, fname);
                            }
                            if ( !result ) {
                                // we have error -> output error -> stop this funct
                                //**LATER delete fixed values -> add multi dictionary
                                // error = 'Не возможно открыть форму.';
                                return CONNECT.returnPromiseWithValue(null);
                            }
                        }
                    }
                    // stop function
                    return CONNECT.returnPromiseValue(true);
                }

            // get pageId from initialMap => create page object
                let sorted = FreeformShared.sortObjectByWeight(freeform['initialMap']);
                for (const pageKey in sorted ) {
                    const   page            = sorted[pageKey];
                            page['index']   = pageKey;
                    // create page object
                    let result = null;
                    try{
                        //
                        result = await FreeformPage.Object.create (
                            freeform,
                            iNformUser,
                            iNformModelId,
                            iNformId,

                            page,
                            null,
                            true,
                            null,

                            iNfirestoreBatchGroup,
                            iNjustCreated
                        );

                    } catch (e) {
                        console.log('page create from initial map - errror - e', e)
                    }
                    if (!result) {
                        // we have error -> output error -> stop this funct
                        //**LATER delete fixed values -> add multi dictionary
                        // error = 'Не возможно открыть форму.';
                        // this.common.freeform.error = error;
                        return CONNECT.returnPromiseValue(false);
                    }
                }

        return CONNECT.returnPromiseValue(true);

        //@> checking
    }

    static checkMap (iNpageId, iNobjId, iNform) {
        let freeform = iNform;
        if (
            freeform &&
            freeform.pages &&
            freeform.pages[iNpageId] &&
            freeform.pages[iNpageId].objects &&
            freeform.pages[iNpageId].objects[iNpageId]
        ) { return freeform.pages[iNpageId].objects[iNpageId]; }
        return null;
    }
}
module.exports.FreeformFormObject = FreeformFormObject;



