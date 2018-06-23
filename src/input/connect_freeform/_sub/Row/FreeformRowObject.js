const CONNECT   = require('../../../connect');
const LOG     = require('ramman-z-log');
const FIREBASE  = require("../../../firebase/firebase");
const firestore = FIREBASE.firestore;

const FreeformShared        = require('./../FreeformShared').FreeformShared;// FreeformShared
const FreeformField         = require('./../Field/FreeformField').FreeformField;// FreeformField

const AccessListShared           = require('./../AccessList/AccessListShared').AccessListShared;// AccessListShared

const FreeformElementModel   = require('./../Element/FreeformElementModel').FreeformElementModel;// FreeformShared
const FreeformElementObject  = require('./../Element/FreeformElementObject').FreeformElementObject;// FreeformShared
const FreeformElementReference  = require('./../Element/FreeformElementReference').FreeformElementReference;// FreeformElementReference

class FreeformRowObject {
    constructor () {
    }

    static async create (
        iNfreeform,
        iNformUser,
        iNformModelId,
        iNformId,

        iNrow,
        iNparentForChild = null,
        iNnewInIdObject = null,

        iNfirestoreBatchGroup,
        iNfullDownloaded = false
    ) {

        const   fname       = 'Row.create',
                freeform    = iNfreeform;
        LOG.fstep (fname,1,0,'INVOKE - freeform, iNgroup, iNparentForChild  , iNnewInIdObject', freeform, iNrow, iNparentForChild , iNnewInIdObject);


        // return CONNECT.returnPromiseValue(true); //

        FreeformRowObject.check (freeform, iNrow);
        // generated random key for this object
        let id      = iNrow['key'] = FreeformShared.safeGetInId(iNrow['inid'], CONNECT.getRandomKeyByUuid(), iNnewInIdObject),
            modelid = iNrow['id'];

        // if isset this group not create from model
        let modelFromLocal = null,
            objectFromLocal = null,
            objModel = null,
            objObject;

        //@< check for isset model
            if (
                (
                    freeform['rows'] &&
                    freeform['rows'][modelid]
                )
            ) {
                // we have this model
                modelFromLocal = objModel = freeform['rows'][modelid];
            } else if(!iNfullDownloaded){
                // we have not this model local -> get from db
                objModel = await FreeformElementModel.getElementFromFormObject (//getFieldFromFormObject
                    'row',
                    iNformUser,
                    iNformModelId,
                    iNformId,
                    modelid,
                    'model'
                );
                if (objModel) {
                    freeform['rows'][modelid] = { 'base' : objModel, objects: {} };
                }
            }

            if (!objModel) {
                // we have not this model yet -> error end
                LOG.fstep(fname,2,0,'ERROR END - We canot get this freeform model -> stop this func', objModel);
                return CONNECT.returnPromiseValue(null);
            }
        //@> check for isset model

        //@< check for isset object
            //**LATER добавить зашиту от несушествующих моделей не полей (сейчас нет зашиты на несушествующие модели)
            if (
                (
                    modelFromLocal &&
                    modelFromLocal['fromLocal'] !== false
                )
            )  {
                // we have this field on server -> not create this field
                objObject  = objectFromLocal = freeform['rows'][modelid]['objects'][id];
                LOG.fstep (fname,2,10,'ROW ISSET', modelid, id, objectFromLocal );
            } else if (
                !iNfullDownloaded &&
                !FreeformShared.isSimpleForm(freeform) &&
                !objObject &&
                FreeformShared.isSavableObject(freeform, objModel)
            ) {
                LOG.fstep (fname,3,2,'Element not isset in local', modelid, id, freeform );
                objObject = await FreeformElementModel.getElementFromFormObject ( //getFieldFromFormObject
                    'row',
                    iNformUser,
                    iNformModelId,
                    iNformId,
                    id,
                    'object'
                );
            }
        //@> check for isset object


        //@< get row object from model OR (if iseet yet) create safe sub freeform objects
            if ( objObject ) {
                // we have this row object already -> create if need sub freeform objects
                objObject = await FreeformRowObject.createIfNeedSubFreeformObjects(
                    iNfreeform,
                    iNformUser,
                    iNformModelId,
                    iNformId,

                    iNrow, objObject, iNnewInIdObject,

                    iNfirestoreBatchGroup,
                    iNfullDownloaded
                );
            } else {
                // wa have not this freeform objec yet -> create from model with create sub objects
                objObject = await FreeformRowObject.getObjectFromModel(
                    iNfreeform,
                    iNformUser,
                    iNformModelId,
                    iNformId,

                    iNrow, iNparentForChild, iNnewInIdObject,

                    iNfirestoreBatchGroup,
                    iNfullDownloaded
                );
            }

            if ( !objObject ) {
                // if we canot get this freeform object -> stop this func
                LOG.fstep ( fname, 4, 0,'We canot get this freeform object - stop this func' , objObject );
                return CONNECT.returnPromiseValue(null);
            }
        //@> get row object from model OR (if iseet yet) create safe sub freeform objects


        //pre step create
            let preArr;
            if ( !objectFromLocal ) {
                // if object from local (object isset already) -> we pass
                preArr = FreeformShared.sortObjectByWeight( freeform.rows[iNrow['id']].base.pre );
            } else {
                preArr = objObject.pre;
            }
            for ( let preRowKey in preArr ) {
                let preRow      = preArr[preRowKey],
                    preRowObject;

                preRow['index'] = preRowKey;

                preRowObject    = await FreeformRowObject.create (
                    iNfreeform,
                    iNformUser,
                    iNformModelId,
                    iNformId,
                    
                    preRow, iNparentForChild, iNnewInIdObject,

                    iNfirestoreBatchGroup,
                    iNfullDownloaded
                );
    
                if ( !preRowObject ) {
                    // console.log('row create 3.1 -  - can not create pre field object - STOP THIS FUNC');
                    LOG.fstep( fname, 2, 1, 'ERROR END - We can not create pre object -> skip this object and next', preRowObject, preRow );
                    if ( !objectFromLocal ) {
                        //if we create from model -> delete from model
                        freeform.rows[iNrow['id']].base.pre = freeform.rows[iNrow['id']].base.pre.filter(object => object['inid'] !== preRow['inid']);
                    } else {
                        //if this object already created -> delete from model
                        objObject.pre = objObject.pre.filter(object => object['inid'] !== preRow['inid']);
                    }
                    continue;
                    // return CONNECT.returnPromiseValue( null );
                }
                if ( !objectFromLocal ) {
                    // if we create from model add to object

                    let  objRef          = { baseid  : preRow['id'], objid   : preRowObject['id'] };
                    // check iner id if isset
                    if ( preRow['inid'] ) { objRef['inid'] = FreeformShared.safeGetInId (preRow['inid'], preRowObject['id'], iNnewInIdObject) ; }
                    // add to array
                    objObject.pre.push( objRef );
                }
            }



        // post step create
            let postArr;
            if ( !objectFromLocal ) {
                // if object from local (object isset already) -> we pass
                postArr = FreeformShared.sortObjectByWeight( freeform.rows[iNrow['id']].base.post );
            } else {
                postArr = objObject.post;
            }
            for ( let postRowKey in postArr  ) {
                let postRow         = postArr[postRowKey],
                    postRowObject;

                postRow['index'] = postRowKey;

                postRowObject       = await FreeformRowObject.create(
                    iNfreeform,
                    iNformUser,
                    iNformModelId,
                    iNformId,
                    
                    postRow, iNparentForChild, iNnewInIdObject,

                    iNfirestoreBatchGroup,
                    iNfullDownloaded
                );
    
                if ( !postRowObject ) {
                    // console.log('row create 4.1 -  - can not create post field object - STOP THIS FUNC');
                    LOG.fstep(fname,3,0,'ERROR END - We can not create pre object -> skip this object and next', postRowObject, postRow);
                    if ( !objectFromLocal ) {
                        //if we create from model -> delete from model
                        freeform.rows[iNrow['id']].base.post = freeform.rows[iNrow['id']].base.post.filter( object =>  object['inid'] !== postRow['inid'] );
                    } else {
                        //if this object already created -> delete from model
                        objObject.post = objObject.post.filter(object => object['inid'] !== postRow['inid']);
                    }
                    continue;
                }

                if ( !objectFromLocal ) {
                    // if we create from model add to object
                    let objRef            = { baseid  : postRow['id'], objid   : postRowObject['id'] };
                    // check iner id if isset
                    if ( postRow['inid'] ) { objRef['inid'] = FreeformShared.safeGetInId (postRow['inid'], postRowObject['id'], iNnewInIdObject) ; }

                    // add to array
                    objObject.post.push( objRef );
                }
            }

        // create dependedents for this element
        FreeformShared.scanRulesOfObject(freeform, objObject);


        // add object to freeform object with merge old object
        let obj = freeform.rows[iNrow['id']].objects[id];
        if ( typeof obj !== 'object' ) { obj = {}; }
        freeform.rows[iNrow['id']].objects[id] = Object.assign( objObject, obj );

        let resultObject = true;
        //@< create in db -> add to server
            if (
                !objectFromLocal ||
                objectFromLocal['fromLocal']
            ) {
                // if we generated this object on client
                console.log('row generating', modelid, id, objectFromLocal);
                // delete local value before server sign
                delete freeform['rows'][modelid]['objects'][id]['fromLocal'];

                let savable     = FreeformShared.isSavableObject (
                    freeform,
                    freeform['rows'][modelid]['objects'][id]
                );

                if (savable) {
                    // this form is savable -> create in server
                    resultObject = await FreeformElementObject.createElement ( // FreeformFieldObject.createField
                        'row',
                        'object',
                        freeform,
                        freeform.rows[ modelid ].objects[id],
                        iNformUser,
                        iNformModelId,
                        iNformId,
                        modelid,
                        id,
                        iNfirestoreBatchGroup
                    );

                    // resultObject = await FreeformShared.createFreeformNotFieldObject(
                    //     freeform,
                    //     iNformUser,
                    //     iNformModelId,
                    //     iNformId,
                    //     freeform.rows[modelid].objects[id],
                    //     modelid,
                    //     id,
                    //     'row',
                    //
                    //     iNfirestoreBatchGroup
                    // );
                } else {
                    // this form is not savable -> set result page true
                    // resultObject = true;
                }
            }
        //@> create in db -> add to server


        if ( !resultObject ) {
            // we can not update freeform savable object  -> STOP THIS FUNC
            console.log ( 'create row - 5.2 createFreeformNotFieldObject - resultObject - STOP THIS FUNC - 4.2', resultObject );
            return CONNECT.returnPromiseValue ( null );
        } else {
            // we can update - return callback

            //@< return promise because we use asyns function
            return CONNECT.returnPromiseValue( {id: id} );
            //@> return promise because we use asyns function
        }


    }

    static async createIfNeedSubFreeformObjects (
        iNfreeform,
        iNformUser,
        iNformModelId,
        iNformId,
        
        iNobject, iNfreeformObject, iNnewInIdObject,

        iNfirestoreBatchGroup,
        iNfullDownloaded = false
    ) {
        //@disc - create freeform of this object
        const fname = 'Row.createIfNeedSubFreeformObjects';

        LOG.fstep(fname, 1, 0, 'INVOKE - iNobject, iNfreeformObject, iNnewInIdObject,', iNobject, iNfreeformObject, iNnewInIdObject);

        let thisObj = iNfreeformObject;

        //@< check access
            let proccessAccess = await FreeformRowObject.proccessAccess ( iNfreeform, iNformUser, iNformModelId, iNformId, iNobject['id'], iNobject['key'], thisObj, true );
            if ( !proccessAccess ) {
                LOG.fstep(fname,2,1,'ERRROR END - we have not access to this obj', iNobject, proccessAccess);
                return CONNECT.returnPromiseWithValue(false);
            }
            LOG.fstep(fname,2,2,'We have access to this obj', iNobject, proccessAccess);
        //@> check access
        
        
        try {
            // add groups (right format) to object
            for ( const fieldKey in CONNECT.deepCopyObject(thisObj.body.fields) ) {
                // parent object for child obj (group)
                const   field               = thisObj.body.fields[fieldKey],
                        dataForChildObj     = FreeformElementReference.getParentOfObjForChildObj(
                            iNobject['key'], // obj key
                            iNobject['id'], // model id
                            'row' //
                        );
                const fieldObj  = await FreeformField.Object.create(
                    iNfreeform,
                    iNformUser,
                    iNformModelId,
                    iNformId,

                    {
                        'id'    : field['baseid'],
                        'inid'  : field['objid'],
                        'index' : fieldKey
                    }
                    , dataForChildObj, iNnewInIdObject,

                    iNfirestoreBatchGroup,
                    iNfullDownloaded
                );

                if ( !fieldObj ) {
                    LOG.fstep( fname,3,1,'ERROR END - We can not create sub field -> skip this object and next', thisObj.body.fields, thisObj, fieldKey );
                    // delete
                    thisObj.body.fields.splice( fieldKey, 1 );
                    continue;
                    // we can not create sub group -> STOP this object
                    // console.log('createIfNeedSubFreeformObject row - STOP THIS FUNCT ', iNobject, iNfreeformObject, iNnewInIdObject );
                    // return  CONNECT.returnPromiseValue(null);
                }
            }
            // return this freeform object
            return CONNECT.returnPromiseValue(thisObj);
        } catch (e) {
            console.log('createIfNeedSubFreeformObject  row  6 ERR - STOP THIS FUNCT - e', e );
            return CONNECT.returnPromiseValue(null);
        }
    }
    
    static async getObjectFromModel (
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
        // get model of this

        const fname = 'Row.getObjectFromModel';

        LOG.fstep(fname, 1, 0, 'INVOKE - iNobject, iNparentForChild, iNnewInIdObject,', iNobject, iNparentForChild, iNnewInIdObject);

        const   freeform    = iNfreeform,
                model       = freeform.rows[iNobject['id']].base,
                object      = FreeformShared.getObjectWithShortData( CONNECT.deepCopyObject(model) , iNobject, true);

        //@< check access
            let proccessAccess = await FreeformRowObject.proccessAccess ( iNfreeform, iNformUser, iNformModelId, iNformId, iNobject['id'], iNobject['key'], object, false );
            if ( !proccessAccess ) {
                LOG.fstep(fname,2,1,'ERRROR END - we have not access to this obj', iNobject, proccessAccess);
                return CONNECT.returnPromiseWithValue(false);
            }
            LOG.fstep(fname,2,2,'We have not access to this obj', iNobject, proccessAccess);
        //@> check access

        // convert object model to object and date for late recognize type and obj type - object
            object['options']['type'] = 'object';
            FreeformShared.Options.convertModelOptionsToWorkFormat ( object,  false,  false);

        //@< generated object
            const gen = object['body']['gen'] = {};
            // add to object (generated parent object)
            // gen['parent'] = iNparentForChild;
            FreeformElementReference.setParentOfObjForChildObj (object, iNparentForChild);
        //@> generated object

        // clear fields from object
            object.body.fields = [];


        //@< get new id and add to freeform
            object['id'] = iNobject['key']; //FreeformShared.safeGetInId (iNobject['inid'], false, iNnewInIdObject) ;
            object['position'] = parseInt(iNobject['index']);
            freeform.rows[ iNobject['id'] ].objects[ object['id'] ] = object;

            LOG.fstep ( fname, 22, 1, 'object', object['id'], iNobject['inid'], object );
        //@> get new id and add to freeform


        //@< generate local id
            //**LATER delete try - catch
            if (object['lid']) {
                LOG.fstep( fname, 4, 1,'TRY start', object['lid'], object);
                FreeformElementObject.setLocalId('row', object, object['lid'], freeform, object['id'] );
            }
        //@> generate local id

        // add rows (right format) to object
        let sorted = FreeformShared.sortObjectByWeight( model.body.fields );
        for (let fieldKey in sorted ) {
            const field     = sorted[fieldKey];

            field['index']  = fieldKey;

            // parent object for child obj (group)
            const dataForChildObj = FreeformElementReference.getParentOfObjForChildObj(
                iNobject['key'], // obj key
                iNobject['id'], // model id
                'row', //
                iNparentForChild
            );

            let fieldsObject  = await FreeformField.Object.create(
                iNfreeform,
                iNformUser,
                iNformModelId,
                iNformId,

                field, dataForChildObj, iNnewInIdObject,

                iNfirestoreBatchGroup,
                iNfullDownloaded
            );

            if ( !fieldsObject ) {
                LOG.fstep ( fname, 3, 1, 'ERROR END - We can not create sub field -> skip this object and next', fieldsObject, field );
                model.body.fields = model.body.fields.filter( object =>  object['inid'] !== field['inid'] );
                continue;
                // console.log('row create - can not create field -> STOP THIS FUNC')
                // return CONNECT.returnPromiseValue(null );
            }

            let  objRef    = { baseid  : field['id'], objid   : fieldsObject['id'] };
            // check iner id if isset
            objRef['inid'] = FreeformShared.safeGetInId (field['inid'], fieldsObject['id'], iNnewInIdObject) ;

            // add to array
            object.body.fields.push( objRef );
        }



        // return object in need format
        return CONNECT.returnPromiseValue( object );

    }

    static async proccessAccess  (
        iNfreeform,
        iNformUser,
        iNformModelId,
        iNformId,
        iNmodelId,
        iNobjId,
        iNfreeformObject,
        iNfromObject = false

    ) {
        const fname = 'ROW.proccessAccess';

        //@< check access and set access to this obj
        const readAccess = await AccessListShared.checkListForAccessToFreeformObject ( 'read', 'row', iNmodelId, iNobjId, iNformUser, iNformModelId, iNformId, iNfreeformObject, null );
        if ( !readAccess ) {
            // if we canot get this freeform object -> stop this func (
            console.log(fname, 'create row 3.21 - STOP THIS FUNCT');
            if (iNfromObject) {
                // if we have not access to this object  -> delete this object from this object (not DB)
                delete iNfreeform['rows'][iNmodelId]['objects'][iNobjId];
            }
            LOG.fstep(fname,1,1,'END ERROR - we have not access to this object');
            return CONNECT.returnPromiseValue(false);
        }
        // safe create this block
        if ( typeof iNfreeformObject['options']  !== 'object' ) { iNfreeformObject['options'] = {}; }
        if ( typeof iNfreeformObject['options']['access']  !== 'object' ) { iNfreeformObject['options']['access'] = {}; }
        // add read access
        iNfreeformObject['options']['access']['read'] = true;

        const writeAccess = await AccessListShared.checkListForAccessToFreeformObject ( 'write', 'row', iNmodelId, iNobjId, iNformUser, iNformModelId, iNformId, iNfreeformObject, null );
        if (writeAccess) {
            // we have write access to this freeform object -> add write access
            iNfreeformObject['options']['access']['write'] = true;
        } else {
            // we have NOT write access to this freeform object -> delete required
            iNfreeformObject['options']['access']['write'] = false;
            // delete required status
            iNfreeformObject['body']['status']['required'] = null;
        }

        //we have access to this object -> return true
        LOG.fstep(fname,1,2,'END SUCCES - we have access to this object');
        return CONNECT.returnPromiseValue(true);
        //@> check access and set access to this obj
    }

    static check (iNfreeform, iNrow) {
        if (!iNfreeform.rows[iNrow['id']].objects) { iNfreeform.rows[iNrow['id']].objects = {}; }
    }
}
module.exports.FreeformRowObject = FreeformRowObject;



