const CONNECT   = require('../../../connect');
const LOG       = require('ramman-z-log');
const FIREBASE  = require("../../../firebase/firebase");
const firestore = FIREBASE.firestore;

const FreeformShared            = require('./../FreeformShared').FreeformShared;// FreeformShared

const FreeformFieldModel        = require('./FreeformFieldModel').FreeformFieldModel;// FreeformFieldModel
// const Field                  = require('./../GlobalStorage/Field').Field;// FreeformShared



const FreeformElementModel   = require('./../Element/FreeformElementModel').FreeformElementModel;// FreeformShared
const FreeformElementObject  = require('./../Element/FreeformElementObject').FreeformElementObject;// FreeformShared
const FreeformElementReference  = require('./../Element/FreeformElementReference').FreeformElementReference;// FreeformElementReference

class FreeformFieldObject {


    // static async getFieldObjectFromFormObject (iNuserLogin, iNmodelId, iNformId, iNfieldModelId, iNinid) {
    //     /*
    //       @inputsgetFormModelAccessList
    //         @required
    //           iNuserLogin : string
    //           iNmodelId : string
    //           iNmyUid : string
    //     */
    //     // passed data
    //     let fname = 'getFieldObjectFromFormObject',
    //         user            = iNuserLogin,
    //         modelId         = iNmodelId,
    //         formId          = iNformId,
    //         inid            = iNinid,
    //         fieldModel      = iNfieldModelId;
    //
    //     LOG.fstep (fname, 1, 0,'INVOKE - user, modelId, data', user, modelId);
    //
    //
    //     const   pathToFireStoreDb   = `freeform/${iNuserLogin}/model/${modelId}/form/${formId}/field/${fieldModel}/object/${inid}`,
    //             firestoreRef        = firestore().doc(pathToFireStoreDb),
    //             fieldFromLocal      = Field.getFieldObject (user, modelId, formId, fieldModel, inid);
    //
    //     if (fieldFromLocal) {
    //         // we have field in local storage -> get from local
    //         LOG.fstep (fname, 2, 1,'We have field in local storage -> get from local - ', pathToFireStoreDb, fieldFromLocal);
    //         return CONNECT.returnPromiseValue(fieldFromLocal);
    //     } else {
    //         // we have not object in local - get from db
    //         LOG.fstep (fname, 2, 2,'We have not object in local - get from db', pathToFireStoreDb, fieldFromLocal);
    //         return new Promise(
    //             (resolve) => {
    //                 firestoreRef.get().then(
    //                     (doc) => {
    //                         if (doc.exists) {
    //                             let fieldObject = doc.data();
    //                             LOG.fstep (fname, 1, 2,'this fieldObject exis', fieldObject);
    //                             if (
    //                                 fieldObject
    //                             ) {
    //                                 LOG.fstep (fname, 1, 3,'END - this is need fieldObject', fieldObject);
    //                                 // this form model need status -> return this model
    //                                 resolve( fieldObject );
    //                                 return;
    //
    //                             }
    //                         }
    //                         LOG.fstep (fname, 1, 4,'ERROR - fieldObject is not exist');
    //                         resolve(null)
    //                     }
    //                 ).catch(
    //                     (error) => {
    //                         LOG.fstep (fname, 1, 4,'ERROR - fieldObject is not exist');
    //                         resolve(null)
    //                     }
    //                 );
    //             }
    //         );
    //     }
    //
    // }







    ///
    ///
    ///
    static async create (
        iNfreeform,
        iNformUser,
        iNformModelId,
        iNformId,

        iNobject,
        iNparentForChild = null,
        iNnewInIdObject = null,

        iNfirestoreBatchGroup,
        iNfullDownloaded = false

    ) {
        const fname    = 'FIELD.create',
              freeform = iNfreeform;

        LOG.fstep(fname, 1, 0, 'INVOKE - iNgroup, iNparentForChild  , iNnewInIdObject', iNobject, iNparentForChild, iNnewInIdObject);

        // try to get id (key) by inner id (inid)
        let     id      = iNobject['key'] = FreeformShared.safeGetInId(iNobject['inid'], CONNECT.getRandomKeyByUuid(), iNnewInIdObject),
                modelid = iNobject['id'],
                field,
                objectFromLocal = null;
        LOG.fstep(fname, 1, 0, 'INVOKE modelid - (' + modelid + ') id - ('+id+')', iNobject, iNparentForChild, iNnewInIdObject);

        //@< check field model for isset  in local
            //**LATER добавить зашиту от несушествующих моделей не полей (сейчас нет зашиты на несушествующие модели)
            if (
                !(
                    freeform['fields'] &&
                    freeform['fields'][modelid]
                ) &&
                !iNfullDownloaded
            )  {
                // we have NOT field model in local   -> get model from db
                LOG.fstep(fname, 2, 1, 'we have NOT field model in local   -> get model from db', freeform);
    
                if ( FreeformShared.isSimpleForm(freeform) ) {
                    // it is simple form and we have not model yet -> STOP this FUNCTION
                    return CONNECT.returnPromiseValue( null );
                }
    
                const fieldModel = await FreeformElementModel.getElementFromFormObject (//getFieldFromFormObject
                    'field',
                    iNformUser,
                    iNformModelId,
                    iNformId,
                    modelid,
                    'model'
                );
    
                if ( !fieldModel ) {
                    // we can not get field model from server -> STOP this function
                    return CONNECT.returnPromiseValue( null );
                }
    
                // add field model to local freeform object
                freeform['fields'][modelid] = { 'base' : fieldModel, 'objects': {} };
            } else if ( !freeform['fields'] || !freeform['fields'][modelid] ) {
                // we can not get field model from server OR local -> STOP this function
                LOG.fstep(fname, 2, 2, 'ERROR we can not get field model from server OR local', modelid, iNfullDownloaded, freeform['fields'][modelid]);

                return CONNECT.returnPromiseValue( null );

            }
        //@> check field model for isset in local

        // check (safe create object for model)
        FreeformFieldObject.check (freeform,  iNobject );

        if (
            freeform['fields'][modelid]['objects'] &&
            freeform['fields'][modelid]['objects'][id]
        ) {
            // field isset (it's preloading) -> or it's from simplefield
            field = objectFromLocal = freeform['fields'][modelid]['objects'][id];
            LOG.fstep (fname,2,10,'FIELD  ISSET', modelid, id, objectFromLocal );
        } else if (
            !iNfullDownloaded &&
            !FreeformShared.isSimpleForm(freeform) &&
            !field &&
            FreeformShared.isSavableObject(freeform, freeform['fields'][modelid])
        ) {
            //@ we have not this field and this field  savable && this form not simple -> get from db -> not

            LOG.fstep (fname,3,2,'Element not isset in local', modelid, id, freeform );


            //@ field not isset not (pre loaded) and this field is not preload -> download
            field = await FreeformElementModel.getElementFromFormObject ( // getFieldFromFormObject
                'field',
                freeform,
                iNformModelId,
                iNformId,
                // modelid,
                id,
                'object'
            );

        }

        // if is isset object check access
        if ( field ) {
            // we get field object from db -> add to local freform -> save this field to local object
            // freeform['fields'][modelid]['objects'][id] = field;

            // we have field yet -> next this field after check access
                let proccessAccess = await FreeformElementObject.proccessAccess ( 'field', freeform, iNformUser, iNformModelId, iNformId, modelid, id, field,false );
                if ( !proccessAccess ) {
                    LOG.fstep( fname, 3, 1,'ERRROR END - we have not access to this obj', field, proccessAccess);
                    delete freeform['fields'][modelid]['objects'][id];
                    return CONNECT.returnPromiseWithValue(false);
                }

            LOG.fstep( fname, 3, 2,'We have access to this obj', field, proccessAccess);
        } else {
            //@ we have not field object in db -> create from model -> callback  (end)
            field = await FreeformFieldObject.getObjectFromModel (
                iNfreeform,
                iNformUser,
                iNformModelId,
                iNformId,

                iNobject, iNparentForChild, iNnewInIdObject,

                iNfirestoreBatchGroup,
                iNfullDownloaded
            );
            LOG.fstep( fname, 3, 3,'We have access to this obj', field['id'], field['modelid'], field );
        }
                
        if ( !field ) {
            console.log('field create 4.0 - CAN NOT GET FIELD OBJECT FROM MODEL - STOP THIS FUNCT');
            return CONNECT.returnPromiseValue(null );
        }

        //pre step create
            let preArr;
            if ( !objectFromLocal ) {
                // if object from local (object isset already) -> we pass
                preArr = FreeformShared.sortObjectByWeight( freeform.fields[iNobject['id']].base.pre );
            } else {
                preArr = field.pre;
            }
            for ( let preFieldKey in preArr ) {
                let preField         = preArr[preFieldKey],
                    preFieldObject;

                    preField['index'] = preFieldKey;

                    preFieldObject   = await FreeformFieldObject.create (
                        iNfreeform,
                        iNformUser,
                        iNformModelId,
                        iNformId,

                        preField, iNparentForChild, iNnewInIdObject,

                        iNfirestoreBatchGroup,
                        iNfullDownloaded
                    );

                if ( !preFieldObject ) {
                    LOG.fstep(fname,1,3,'ERROR END - We can not create pre object -> skip this object and next', preFieldObject, preField);

                    if ( !objectFromLocal ) {
                        //if we create from model -> delete from model
                        freeform.fields[iNobject['id']].base.pre = freeform.fields[iNobject['id']].base.pre.filter( object =>  object['inid'] !== preField['inid'] );
                    } else {
                        //if this object already created -> delete from model
                        field.pre = field.pre.filter(object => object['inid'] !== preField['inid']);
                    }
                    continue;
                    // console.log('field create 4.2 - CAN NOT PRE FIELD - STOP THIS FUNCT');
                    // return CONNECT.returnPromiseValue(null);
                }
                if ( !objectFromLocal ) {
                    let objRef           = { baseid  : preField['id'], objid   : preFieldObject['id'] };

                    // check iner id if isset
                    if ( preField['inid'] ) { objRef['inid'] = FreeformShared.safeGetInId (preField['inid'], preFieldObject['id'], iNnewInIdObject) ; }

                    // add to array
                    field['pre'].push( objRef );
                }
            }

        // post step create
            let postArr;
            if ( !objectFromLocal ) {
                // if object from local (object isset already) -> we pass
                postArr = FreeformShared.sortObjectByWeight( freeform.fields[iNobject['id']].base.post );
            } else {
                postArr = field.post;
            }
            for ( let postFieldKey in postArr ) {
                let postField       = postArr[postFieldKey],
                    postFieldObject;

                postFieldObject['index'] = postFieldKey;

                postFieldObject   = await FreeformFieldObject.create (
                    iNfreeform,
                    iNformUser,
                    iNformModelId,
                    iNformId,

                    postField, iNparentForChild, iNnewInIdObject,

                    iNfirestoreBatchGroup,
                    iNfullDownloaded
                );

                if ( !postFieldObject ) {
                    LOG.fstep(fname,2,3,'ERROR END - We can not create pre object -> skip this object and next', postFieldObject, postField);

                    if ( !objectFromLocal ) {
                        //if we create from model -> delete from model
                        freeform.fields[iNobject['id']].base.post = freeform.fields[iNobject['id']].base.post.filter( object =>  object['inid'] !== postField['inid'] );
                    } else {
                        //if this object already created -> delete from model
                        field.post = field.post.filter(object => object['inid'] !== postField['inid']);
                    }
                    continue;
                    // console.log('field create 5.2 - CAN NOT POST FIELD STOP THIS FUNCT');
                    // return CONNECT.returnPromiseValue(null);
                }

                if ( !objectFromLocal ) {
                    let objRef            = { baseid  : postField['id'], objid   : postFieldObject['id'] };

                    // check iner id if isset
                    if ( postField['inid'] ) { objRef['inid'] = FreeformShared.safeGetInId (postField['inid'], postFieldObject['id'], iNnewInIdObject) ; }

                    // add to array
                    field['post'].push( objRef );
                }

            }


        // create dependedents for this element
            FreeformShared.scanRulesOfObject(freeform, field);

        // add object to freeform object with merge old object if isset
        LOG.fstep( fname, 44, 1,'field', field );
            let obj = {};
            if(
                !objectFromLocal &&
                typeof freeform.fields[ modelid ]['objects'] === 'object' &&
                typeof freeform.fields[ modelid ].objects[id] === 'object'
            ) {
                LOG.fstep( fname, 45, 1,'obj', obj );
                obj = freeform.fields[ modelid ].objects[id];
            }
            freeform.fields[ modelid ].objects[id] = CONNECT.mergeObject(field, obj);

        LOG.fstep( fname, 46, 1,'obj new', freeform.fields[ modelid ].objects[id] );


        let result = true;
        //@<  add to freeform server
            if (
                !objectFromLocal ||
                objectFromLocal['fromLocal']
            ) {
                let savable     = FreeformShared.isSavableObject (
                    freeform,
                    freeform['fields'][modelid]['objects'][id]
                );

                if (savable) {
                    // this form is savable -> create in server
                    result = await FreeformElementObject.createElement ( // FreeformFieldObject.createField
                        'field',
                        'object',
                        freeform,
                        freeform.fields[ modelid ].objects[id],
                        iNformUser,
                        iNformModelId,
                        iNformId,
                        modelid,
                        id,
                        iNfirestoreBatchGroup
                    );
                } else {
                    // this form is not savable -> set result page true
                    // fieldCreated = true;
                }

            }
        //@>  add to freeform server

        LOG.fstep( fname, 50, 1,'obj new', modelid, id, freeform.fields[ modelid ].objects[id] );
        LOG.fstep( fname, 50, 2,'freeform new', freeform );
        LOG.fstep( fname, 50, 3,'global ', global['freeform'] );

        if ( !result ) {
            // we can not update freeform savable object  -> STOP THIS FUNC
            console.log('field create 8.2 CAN NOT CREATED FIELD - STOP THIS FUNCT');
            return CONNECT.returnPromiseValue(null);
        } else {
            //@ we can update field in server OR is not savable form - return callback

            //@< return promise because we use asyns function
            return CONNECT.returnPromiseValue({ id: id});
            //@> return promise because we use asyns function
        }
    }

    static check (iNfreeform, iNfield) {
        console.log("Field.check 1 ", iNfield['id'], JSON.stringify(iNfield) );

        if ( !iNfreeform['fields'] ) { iNfreeform['fields'] = {}; }

        if ( !iNfreeform.fields[ iNfield['id'] ] ) { iNfreeform['fields'][ iNfield['id'] ] = {}; }

        if ( !iNfreeform.fields[iNfield['id']].objects ) { iNfreeform.fields[iNfield['id']].objects = {}; }

        console.log( "Field.check 2 ", iNfield['id'], iNfreeform.fields[iNfield['id']] );
    }

    static async getObjectFromModel (
        iNfreeform,
        iNformUser,
        iNformModelId,
        iNformId,
        
        iNobject, iNparentForChild = null, iNnewInIdObject,

        iNfirestoreBatchGroup,
        iNfullDownloaded = false
    ) {

        const fname = 'Field.Object.getObjectFromModel';

        LOG.fstep(fname, 1, 0, 'INVOKE - iNobject, iNparentForChild, iNnewInIdObject,', iNobject, iNparentForChild, iNnewInIdObject);

        const freeform = iNfreeform;
        // get model of this
        let model   =   freeform.fields[ iNobject['id'] ].base,
            object  =   FreeformShared.getObjectWithShortData ( CONNECT.deepCopyObject(model), iNobject, true);



        // convert object model to object and date for late recognize type and obj type - object
            object['options']['type'] = 'object';
            FreeformShared.Options.convertModelOptionsToWorkFormat (object, false, false);
            // object['options']['type'] = 'object';
            // object['options']['object'] = 'field';


        //@< check access
        LOG.fstep( fname, 2, 1,'We have access to this obj', object);
            let proccessAccess = await FreeformElementObject.proccessAccess ( 'field', iNfreeform, iNformUser, iNformModelId, iNformId, iNobject['id'], iNobject['key'], object, false );
            if ( !proccessAccess ) {
                LOG.fstep( fname, 2, 2,'ERRROR END - we have not access to this obj', iNobject, proccessAccess);
                return CONNECT.returnPromiseWithValue(false);
            }
            LOG.fstep( fname, 2, 3,'We have access to this obj', object, proccessAccess);
        //@> check access

        //@< set parent
            const gen = object['body']['gen'] = {};
            // add to object (generated parent object)
            // gen['parent'] = iNparentForChild;
            //     object['options']['p-id']   = iNparentForChild['objid'];
            //     object['options']['p-mid']  = iNparentForChild['modelid'];
            //     object['options']['p-type'] = iNparentForChild['type'];

            FreeformElementReference.setParentOfObjForChildObj (object, iNparentForChild);
        //@> set parent



        //@< set new id and add to freeform
            object['id']        = iNobject['key']; //FreeformShared.safeGetInId (iNobject['inid'], false, iNnewInIdObject) ;
            object['position']  = parseInt(iNobject['index']);
            freeform.fields[ iNobject['id'] ].objects[ object['id'] ] = object;
            LOG.fstep ( fname, 22, 1, 'object', object['id'], iNobject['inid'], object );
        //@> set new id and add to freeform


        LOG.fstep( fname, 3, 0,'object', object);
        //@< generate local id
            if (object['lid']) {
                FreeformElementObject.setLocalId('field', object, object['lid'], freeform, object['id'] );
            }
        //@> generate local id

        // create with need params by shor data
        // object = FreeformShared.getObjectWithShortData(object, iNobject, true);


        if (object.body.type === 'collection' && Array.isArray(model.body.fields) ) {
            // if this field collection -> we create filds clear fields from object

            object.body.fields = [];
            // add rows (right format) to object
            let sorted = FreeformShared.sortObjectByWeight( model.body.fields );
            for (const fieldKey in sorted ) {
                let field = sorted[fieldKey];

                field['index'] = fieldKey;

                // parent object of us (collection) for child obj (field)
                const dataForChildObj = FreeformElementReference.getParentOfObjForChildObj(
                    iNobject['key'], // obj key
                    iNobject['id'], // model id
                    'collection', //
                    iNparentForChild // greate parent block
                );

                const fieldsObject  = await FreeformFieldObject.create(
                    iNfreeform,
                    iNformUser,
                    iNformModelId,
                    iNformId,
                    
                    field, dataForChildObj, iNnewInIdObject,

                    iNfirestoreBatchGroup,
                    iNfullDownloaded
                );
                if ( !fieldsObject ) {
                    LOG.fstep(fname,3,1,'ERROR END - We can not create sub field -> skip this object and next', fieldsObject, field);
                    model.body.fields = model.body.fields.filter( object =>  object['inid'] !== field['inid'] );
                    continue;
                    // console.log('field getObjectFromModel 3.3 - STOP THIS FUNCT', fieldsObject);
                    // return CONNECT.returnPromiseValue(null);
                }
                const objRef        = { baseid  : field['id'], objid   : fieldsObject['id'] };
                // check iner id if isset
                objRef['inid'] = FreeformShared.safeGetInId (field['inid'], fieldsObject['id'], iNnewInIdObject) ;

                // add to array of object
                object.body.fields.push( objRef );
            }
        }

        // return object in need format
        LOG.fstep( fname, 4, 0,'object', object);
        return CONNECT.returnPromiseValue(object);
    }

    // static async createField (
    //     iNfreeform,
    //
    //     iNdata,
    //     iNuserId,
    //     iNmodelId,
    //     iNformId,
    //     iNfieldModelId,
    //     iNfieldId,
    //
    //     iNfirestoreBatchGroup
    // )  {
    //     // create field for simple form OR full funcitonalite seperate fields in firestore db
    //     const fname = 'Field.Object.createField';
    //
    //     LOG.fstep(fname, 1, 0, 'INVOKE - iNdata, iNuserId, iNmodelId, iNformId, iNfieldModelId, iNfieldId',
    //         iNdata, iNuserId, iNmodelId, iNformId, iNfieldModelId, iNfieldId
    //     );
    //
    //
    //     if( FreeformShared.isSimpleForm(iNfreeform) ) {
    //         // it is simple form -> create fields in this simple form
    //         return FreeformFieldObject.createFieldForSimpleForm(iNfreeform, iNdata, iNuserId, iNmodelId, iNformId, iNfieldModelId, iNfieldId, iNfirestoreBatchGroup);
    //     } else {
    //         // it is not simple form -> create full functionality seperate fields
    //         return FreeformFieldObject.createFieldForNotSimpleForm(iNfreeform, iNdata, iNuserId, iNmodelId, iNformId, iNfieldId, iNfirestoreBatchGroup);
    //     }
    // }
    //
    // static async createFieldForSimpleForm (
    //     iNfreeform,
    //
    //     iNdata, iNuserId, iNmodelId, iNformId, iNfieldModelId, iNfieldId,
    //
    //     iNfirestoreBatchGroup
    // )  {
    //     // create field to firebase
    //     const fname = 'Field.Object.createFieldForSimpleForm';
    //
    //     LOG.fstep(fname, 1, 0, 'INVOKE - iNdata, iNuserId, iNmodelId, iNformId, iNfieldModelId, iNfieldId', iNdata, iNuserId, iNmodelId, iNformId, iNfieldModelId, iNfieldId );
    //
    //     let uid           = iNuserId,
    //         data          = iNdata,
    //         modelId       = iNmodelId,
    //         formId        = iNformId,
    //         fieldId       = iNfieldId,
    //         fieldModelId  = iNfieldModelId,
    //         pathToDoc     = `freeform/${uid}/model/${modelId}/form/${formId}`,
    //         result        = false,
    //         update        = {};
    //
    //     // change type to object (may be was type is model if this create form model (it was when first generate) )
    //     if ( typeof  data['options'] !== 'object') {data['options'] = {};}
    //     data['options']['type'] = 'object';
    //     data['options']['object'] = 'field';
    //
    //     // update block for simple form
    //     update[ `fields.${fieldModelId}.objects.${fieldId}` ] = data;
    //
    //     try {
    //         await FIREBASE.batchGroupUpdate (
    //             pathToDoc,
    //             update,
    //             iNfirestoreBatchGroup
    //         );
    //         result = true;
    //     } catch (e) {
    //         console.log('ERR - createFieldForSimpleForm', e , pathToDoc, update);
    //         result = false;
    //     }
    //     return new Promise (
    //         (resolve, reject) => {
    //             resolve(result);
    //         }
    //     );
    // }
    //
    // static async createFieldForNotSimpleForm (
    //     iNfreeform,
    //
    //     iNdata, iNuserId, iNmodelId, iNformId,
    //     // iNfieldModelId,
    //     iNfieldId,
    //
    //     iNfirestoreBatchGroup
    // ) {
    //     const fname = 'Field.Object.createFieldForNotSimpleForm';
    //
    //     LOG.fstep(fname, 1, 0, 'INVOKE - iNdata, iNuserId, iNmodelId, iNformId, iNfieldId', iNdata, iNuserId, iNmodelId, iNformId,  iNfieldId );
    //
    //     // create field to firebase
    //     let uid           = iNuserId,
    //         data          = iNdata,
    //         modelId       = iNmodelId,
    //         formId        = iNformId,
    //         result        = false;
    //
    //     // change type to object (may be was type is model if this create form model (it was when first generate) )
    //     if ( typeof  data['options'] !== 'object') {data['options'] = {};}
    //         data['options']['type'] = 'object';
    //         data['options']['object'] = 'field';
    //
    //     try {
    //         await FreeformFieldModel.addToFormObjectToDb (uid, modelId, formId, iNfieldId, data, 'object', iNfirestoreBatchGroup);
    //         result = true;
    //     } catch (e) {
    //         console.log('ERR - createFieldForNotSimpleForm', e , pathToDoc, data);
    //         result = false;
    //     }
    //     return new Promise (
    //         (resolve, reject) => {
    //             resolve(result);
    //         }
    //     );
    // }

}
module.exports.FreeformFieldObject = FreeformFieldObject;
