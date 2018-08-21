const CONNECT   = require('../../../connect');
const LOG       = require('ramman-z-log');
const FIREBASE  = require("../../../firebase/firebase");
const firestore = FIREBASE.firestore;

// const Field        = require('./../GlobalStorage/Field').Field;// FreeformShared
const Element      = require('./../GlobalStorage/Element').Element;// Element
// const FreeformElementShared      = require('./FreeformElementShared').FreeformElementShared;// FreeformElementShared
const FreeformElementModel      = require('./FreeformElementModel').FreeformElementModel;// FreeformElementModel
const FreeformElementReference      = require('./FreeformElementReference').FreeformElementReference;// FreeformElementModel
const FreeformShared        = require('./../FreeformShared').FreeformShared;// FreeformShared

const AccessListShared           = require('./../AccessList/AccessListShared').AccessListShared_;// AccessListShared

class FreeformElementObject {
    constructor () {

    }



    static async loadElements (
        iNuserLogin, iNmodelId, iNformId, iNonlyPreload = true
    ) {
        const fname = 'loadElements';
        LOG.fstep(fname,0,0,'INVOKE', iNuserLogin, iNmodelId, iNformId);
        let result = await FreeformElementObject.getElementsFromFormObject (iNuserLogin, iNmodelId, iNformId , iNonlyPreload);
        LOG.fstep(fname,1,0,'result', result);

        return CONNECT.returnPromiseValue(result);

    }


    static async getElementsFromFormObject (iNuserLogin, iNmodelId, iNformId , iNonlyPrelad = true ){
        /*
          @inputsgetFormModelAccessList
            @required
              iNuserLogin : string
              iNmodelId : string
              iNmyUid : string
        */
        // passed data
        let fname           = 'getElementsFromFormObject',
            user            = iNuserLogin,
            formModelId     = iNmodelId,
            formId          = iNformId;

        LOG.fstep (fname, 1, 0,'INVOKE - user, formModelId, data', user, formModelId);


        let     pathToFireStoreDb   = `freeform/${iNuserLogin}/model/${formModelId}/form/${formId}/element`, // /${fieldModelId}/object
                firestoreRef        = firestore().collection(pathToFireStoreDb);

        if ( iNonlyPrelad ) {
            firestoreRef        = firestoreRef.where("options.preload", ">", 0);
        }

        LOG.fstep (fname, 1, 1,'from path - ', pathToFireStoreDb);
        return new Promise(
            (resolve) => {
                firestoreRef.get().then(
                    (docs) => {
                        if ( !docs.empty ) {
                            LOG.fstep (fname, 1, 2,' fields object of form object is  exist');

                            let resultDocs = {};

                            for (let doc of docs.docs) {
                                let dbId     = doc.id,
                                    element  = doc.data(),
                                    modelId  = element.modelid,
                                    elType   = element['options']['object'],
                                    objType  = element['options']['type'];
                                // add to local storage for later access without reloading
                                LOG.fstep (fname, 2, 1,' doc', objType, elType, modelId, element);
                                if ( objType !== 'model' ) {
                                    LOG.fstep (fname, 3, 1,' it is object', objType, elType, modelId, element);
                                    // if this object
                                    let fieldId = element['id'];
                                    // Field.addFieldObjectToGlobal(user,formModelId,formId, modelId, dbId, element);
                                    if ( !fieldId ) {
                                        LOG.fstep (fname, 4, 1,' element not have id', modelId, element);
                                    } else {
                                        LOG.fstep (fname, 4, 2,' element have id', modelId, element);
                                        Element.addElementObjectToGlobal(elType, user, formModelId, formId, modelId, fieldId, element);
                                        resultDocs[fieldId] = element;
                                    }
                                } else {
                                    LOG.fstep (fname, 3, 2,' it is model', objType, elType, modelId, element);
                                    // if this model -> add to global
                                    // Field.addFieldModelToGlobal(
                                    //     user,
                                    //     formModelId,
                                    //     formId,
                                    //     modelId,
                                    //     element
                                    // );

                                    Element.addElementModelToGlobal(elType, user, formModelId, formId, modelId, element);
                                    resultDocs[modelId] = element;
                                }
                            }

                            resolve(resultDocs);
                            return;
                        }

                        LOG.fstep (fname, 1, 3,'ERROR -  fields object of form object is not exist');
                        resolve(null);
                    }
                ).catch(
                    (error) => {
                        LOG.fstep (fname, 1, 4,'ERROR - fields object of form object is not exist');
                        resolve(null)
                    }
                );
            }
        );
    }

    static async createElement (
        iNelType,
        iNobjType,
        iNfreeform,

        iNdata,
        iNuserId,
        iNmodelId,
        iNformId,
        iNfieldModelId,
        iNfieldId,

        iNfirestoreBatchGroup
    )  {
        // create field for simple form OR full funcitonalite seperate fields in firestore db
        const fname = 'Element.Object.createElement';

        // get copy because we delete access block
            let object = CONNECT.deepCopyObject(iNdata);

        LOG.fstep(fname, 1, 0, 'INVOKE - iNelType, iNdata, iNuserId, iNmodelId, iNformId, iNfieldModelId, iNfieldId',
            iNelType, object, iNuserId, iNmodelId, iNformId, iNfieldModelId, iNfieldId
        );

        //delete access gen
            if ( object['options']['access'] ) delete object['options']['access'];

        if( FreeformShared.isSimpleForm(iNfreeform) ) {
            // it is simple form -> create fields in this simple form
            return FreeformElementObject.createElementForSimpleForm(iNelType, iNobjType,  iNfreeform, object, iNuserId, iNmodelId, iNformId, iNfieldModelId, iNfieldId, iNfirestoreBatchGroup);
        } else {
            // it is not simple form -> create full functionality seperate fields
            return FreeformElementObject.createElementForNotSimpleForm(iNelType, iNobjType, iNfreeform, object, iNuserId, iNmodelId, iNformId, iNfieldId, iNfirestoreBatchGroup);
        }
    }

    static async createElementForSimpleForm (
        iNelType,
        iNobjType,

        iNfreeform,

        iNdata, iNuserId, iNmodelId, iNformId, iNfieldModelId, iNfieldId,

        iNfirestoreBatchGroup
    )  {
        // create field to firebase
        const fname = 'Element.Object.createElementForSimpleForm';

        LOG.fstep(fname, 1, 0, 'INVOKE - iNelType, iNdata, iNuserId, iNmodelId, iNformId, iNfieldModelId, iNfieldId', iNelType, iNdata, iNuserId, iNmodelId, iNformId, iNfieldModelId, iNfieldId );

        let uid           = iNuserId,
            data          = iNdata,
            modelId       = iNmodelId,
            formId        = iNformId,
            fieldModelId  = iNfieldModelId,
            pathToDoc     = `freeform/${uid}/model/${modelId}/form/${formId}`,
            result        = false,
            update        = {};

        let objType = iNobjType, fieldId = fieldId ;
        if (objType === 'model' ) {
            // fieldId = iNdata.modelid;
            update[ `fields.${fieldModelId}.objects.${fieldId}` ] = data;
        } else {
            // it is object
            // fieldId = iNdata.id;
            update[ `fields.${fieldModelId}.${fieldId}` ] = data;
        }


        // change type to object (may be was type is model if this create form model (it was when first generate) )
        // if ( typeof  data['options'] !== 'object') {data['options'] = {};}
        // data['options']['type']     = objType;
        // data['options']['object']   = iNelType;

        // update block for simple form

        try {
            await FIREBASE.batchGroupUpdate (
                pathToDoc,
                update,
                iNfirestoreBatchGroup
            );
            result = true;
        } catch (e) {
            console.log('ERR - createFieldForSimpleForm', e , pathToDoc, update);
            result = false;
        }
        return new Promise (
            (resolve, reject) => {
                resolve(result);
            }
        );
    }

    static async createElementForNotSimpleForm (
        iNelType,
        iNobjType,

        iNfreeform,

        iNdata, iNuserId, iNmodelId, iNformId,
        // iNfieldModelId,
        iNelId,

        iNfirestoreBatchGroup
    ) {
        const fname = 'ElementObject.createElementForNotSimpleForm';

        LOG.fstep(fname, 1, 0, 'INVOKE - iNdata, iNuserId, iNmodelId, iNformId, iNelId', iNdata, iNuserId, iNmodelId, iNformId,  iNelId );

        // create field to firebase
        let uid           = iNuserId,
            data          = iNdata,
            modelId       = iNmodelId,
            formId        = iNformId,
            result        = false;

        // change type to object (may be was type is model if this create form model (it was when first generate) )
        // if ( typeof  data['options'] !== 'object') {data['options'] = {};}
        // data['options']['type'] = 'object';
        // data['options']['object'] = 'field';

        try {
            await FreeformElementModel.addToFormObjectToDb ( iNelType, uid, modelId, formId, iNelId, data, iNobjType, iNfirestoreBatchGroup);
            result = true;
        } catch (e) {
            console.log('ERR - createElementForNotSimpleForm', e, data);
            result = false;
        }
        return new Promise (
            (resolve, reject) => {
                resolve(result);
            }
        );
    }

    static async proccessAccess  (
        iNelType,

        iNfreeform,
        iNformUser,
        iNformModelId,
        iNformId,
        iNmodelId,
        iNelObjId,
        iNfreeformObject,
        iNisObject = false

    ) {
        const fname = 'ElementObject.proccessAccess';
        LOG.fstep(fname,0,0,'INVOKE', iNformId, iNmodelId, iNelObjId, iNfreeformObject);

        //@< check access and set access to this obj
        const readAccess = await AccessListShared.checkListForAccessToFreeformObject ( 'read', iNelType, iNmodelId, iNelObjId, iNformUser, iNformModelId, iNformId, iNfreeformObject, null ),
              folderName = Element.getFolderNameByType(iNelType);



        if ( !readAccess ) {
            // if we canot get this freeform object -> stop this func (
            LOG.ferror(fname,1,0,'END ERROR - we have not read access to object', readAccess);
            if (iNisObject) {
                // if we have not access to this object  -> delete this object from this object (not DB)
                delete iNfreeform[folderName][ iNmodelId ]['objects'][iNelObjId];
            }
            LOG.fstep(fname,2,0,'END ERROR - we have not access to this object', iNfreeformObject);
            return CONNECT.returnPromiseValue(false);
        }

        // safe create this block
            if ( typeof iNfreeformObject['options']  !== 'object' ) { iNfreeformObject['options'] = {}; }
            if ( typeof iNfreeformObject['options']['access']  !== 'object' ) { iNfreeformObject['options']['access'] = {}; }
        // add read access
            iNfreeformObject['options']['access']['read'] = true;

        const writeAccess = await AccessListShared.checkListForAccessToFreeformObject ( 'write', iNelType, iNmodelId, iNelObjId, iNformUser, iNformModelId, iNformId, iNfreeformObject, null );
        if (writeAccess) {
            // we have write access to this freeform object -> add write access
            LOG.fstep(fname,3,1,'We have not write access to object', writeAccess);
            iNfreeformObject['options']['access']['write'] = true;
        } else {
            LOG.fstep(fname,3,2,'We have write access to object', writeAccess);
            // we have NOT write access to this freeform object -> delete required
            iNfreeformObject['options']['access']['write'] = false;
            // delete required status
            iNfreeformObject['body']['status']['required'] = null;
        }

        //we have access to this object -> return true
        LOG.fstep(fname,4,0,'END SUCCES - we have access to this object - iNfreeformObject', iNfreeformObject);
        return CONNECT.returnPromiseValue(true);
        //@> check access and set access to this obj
    }



    static addElLocalRefToParentLocal (iNparentElType , iNparentModelId, iNparentId, iNform, iNfolder, iNlid, iNlidKey, iNelId) {
        let fname           = FreeformElementObject.addElLocalRefToParentLocal.name,
            folder          = iNfolder,
            parentModelId   = iNparentModelId,
            parentId        = iNparentId,
            lid             = iNlid,
            lkey            = iNlidKey,
            form            = iNform,
            elId            = iNelId,
            parentElType    = iNparentElType,
            parent_el       = FreeformShared.getFreefomObjectId(form, folder, parentModelId , parentId);

        LOG.fstep(fname, 0, 0 ,'INVOKE - iNparentElType, iNparentModelId, iNparentId, iNfolder,  iNlid, iNlidKey, iNelId', iNparentElType, iNparentModelId, iNparentId, iNfolder,  iNlid, iNlidKey, iNelId);

        LOG.fstep(fname, 0, 0 ,'parent_el, form, folder, parentModelId,  parentId', parent_el, form, folder, parentModelId,  parentId);

        if (parent_el) {

            LOG.fstep(fname, 1, 1 ,'parent_el', parent_el);
            // we have parent element -> safe create gen block
            if ( !parent_el['body']['gen'] ){
                parent_el['body']['gen'] = {};
            }
            // safe created gen block -> safe create lid in gen block
            if ( !parent_el['body']['gen']['lid'] ) {
                parent_el['body']['gen']['lid'] = {};
            }
            // safe create gen block -> safe create lid in gen block
            let parentlocal = parent_el['body']['gen']['lid'];
            if ( lid[lkey] ) {
                // we have local ids for parent collection -> add child el id to parent collection
                LOG.fstep(fname, 2, 1 ,'we have local ids', lid[lkey], lid, parentElType, elId);
                for (let id of lid[lkey]) {
                    parentlocal[id] = elId;
                }
            } else {
                LOG.fstep(fname, 2, 2 ,'we have NOT local ids', lid[lkey], lkey, lid, parentElType);
            }
            LOG.fstep(fname, 3, 0 ,'elId, lkey, parentlocal', elId, lkey, parentlocal);
            //
            if ( ( parentElType === 'collection' && ( lid['r'] || lid['g'] || lid['p']) ) ) {
                return FreeformElementObject.setLocalId( 'field', parent_el, lid, form, elId );
            } else if ( parentElType === 'row' && ( lid['g'] || lid['p'] ) ) {
                return FreeformElementObject.setLocalId( 'row', parent_el, lid, form, elId );
            } else if ( parentElType === 'group' && lid['p'] ) {
                return FreeformElementObject.setLocalId( 'group', parent_el, lid, form, elId );
            }
        }
        LOG.fstep(fname, 1, 2 ,'ERROR parent_el', parent_el);
        return null;
    }

    static setLocalId (iNelType, iNelement, iNlocalIdBlock, iNform, iNelId = null) {
        let fname       = 'setLocalId',
            elType      = iNelType,
            el          = iNelement,
            form        = iNform,
            lid         = iNlocalIdBlock,
            parent,
            elId = iNelId;

        LOG.fstep(fname, 0, 0 ,'INVOKE - iNelType, iNelement, iNlocalIdBlock, iNform, iNelId', iNelType, iNelement, iNlocalIdBlock, iNform, iNelId);
        if (
            el['options'] &&
            el['options']['p-type']
        ) {
            parent      = FreeformElementReference.getParentBlockFromElement(el); //{'type': el['options']['p-type'], 'modelid': el['options']['p-mid'], 'objid': el['options']['p-id']};//el['body']['gen']['parent'];
        } else {
            // error - we have not parent block
            return null;
        }

        if ( parent && lid) {
            // we have parent block and locale id block -> generate lid
            LOG.fstep(fname, 1, 1 ,'we have parent block and locale id block -> generate lid', lid, parent);
            let ptype       = parent['type'],
                pmodelid    = parent['mid'], // modelid
                pobjid      = parent['id'], // objid
                parent_el;

            // if we have not locale id -> stop
            if (!lid) return false;

            LOG.fstep(fname, 2, 1 ,'elType, ptype', elType, ptype);
            switch (elType) {
                case "field":
                    if ( ptype === 'collection' ) {
                        return FreeformElementObject.addElLocalRefToParentLocal ( ptype , pmodelid, pobjid, form, 'fields', lid, 'c', elId);
                    } else if (ptype === 'row') {
                        return FreeformElementObject.addElLocalRefToParentLocal ( ptype , pmodelid, pobjid, form, 'rows', lid, 'r', elId);
                    }
                break;

                case "row":
                    if (ptype !== 'group') return false;
                    return FreeformElementObject.addElLocalRefToParentLocal ( ptype , pmodelid, pobjid, form, 'groups', lid, 'g', elId);

                case "group":
                    if (ptype !== 'page') return false;
                    return FreeformElementObject.addElLocalRefToParentLocal ( ptype , pmodelid, pobjid, form, 'pages', lid, 'p', elId);

            }
        }

        LOG.fstep(fname, 1, 2 ,'ERROR we have  NOT parent block and locale id block -> generate lid', lid, parent);
        return false;
    }
}
module.exports.FreeformElementObject = FreeformElementObject;