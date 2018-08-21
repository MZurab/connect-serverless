const CONNECT   = require('../../../connect');
const LOG     = require('ramman-z-log');
const FIREBASE  = require("../../../firebase/firebase");
const firestore = FIREBASE.firestore;


const FreeformShared        = require('./../FreeformShared').FreeformShared;// FreeformGlobalStorage
const FreeformRow           = require('./../Row/FreeformRow').FreeformRow;// FreeformGlobalStorage

const AccessListShared           = require('./../AccessList/AccessListShared').AccessListShared_;// AccessListShared


const FreeformElementModel   = require('./../Element/FreeformElementModel').FreeformElementModel;// FreeformShared
const FreeformElementObject  = require('./../Element/FreeformElementObject').FreeformElementObject;// FreeformShared
const FreeformElementReference  = require('./../Element/FreeformElementReference').FreeformElementReference;// FreeformElementReference

class FreeformGroupObject {
    constructor () {
    }

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
        const fname = 'Group.create';
        LOG.fstep (fname,1,0,'INVOKE - iNobject, iNparentForChild  , iNnewInIdObject', iNobject, iNparentForChild  , iNnewInIdObject);
        
        FreeformGroupObject.check(iNfreeform, iNobject);

        // random key
        const   freeform = iNfreeform,
                id       = iNobject['key'] = FreeformShared.safeGetInId(iNobject['inid'], CONNECT.getRandomKeyByUuid(), iNnewInIdObject),
                modelid  = iNobject['id'];




        // if isset this group not create from model
        let modelFromLocal = null,
            objectFromLocal = null,
            objModel = null,
            objObject;

        //@< check for isset model
            if (
                (
                    freeform['groups'] &&
                    freeform['groups'][modelid]
                )
            ) {
                // we have this model
                modelFromLocal = objModel = freeform['groups'][modelid];
            } else if (!iNfullDownloaded){
                // we have not this model local -> get from db
                objModel = await FreeformElementModel.getElementFromFormObject (//getFieldFromFormObject
                    'group',
                    iNformUser,
                    iNformModelId,
                    iNformId,
                    modelid,
                    'model'
                );
                if (objModel) {
                    freeform['groups'][modelid] = { 'base' : objModel, objects: {} };
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
                objObject = objectFromLocal = freeform['groups'][modelid]['objects'][id];
                LOG.fstep (fname,3,1,'GROUP ISSET', modelid, id );
            } else if (
                !iNfullDownloaded &&
                !FreeformShared.isSimpleForm(freeform) &&
                !objObject &&
                FreeformShared.isSavableObject(freeform, objModel)
            ) {
                LOG.fstep (fname,3,2,'Element not isset in local', modelid, id, freeform );
                objObject = await FreeformElementModel.getElementFromFormObject (//getFieldFromFormObject
                    'group',
                    iNformUser,
                    iNformModelId,
                    iNformId,
                    id,
                    'object'
                );
            }
        //@> check for isset object

        //@< get group object from model OR (if iseet yet) create safe sub freeform objects
            if ( objObject ) {
                // we have this group object already -> create if need sub freeform objects
                objObject = await FreeformGroupObject.createIfNeedSubFreeformObjects (
                    freeform,
                    iNformUser,
                    iNformModelId,
                    iNformId,
                    
                    iNobject,
                    objObject,
                    iNnewInIdObject,

                    iNfirestoreBatchGroup,
                    iNfullDownloaded
                );
                console.log('create group 2.1 - pageObject', objObject);
            } else {
                // wa have not this freeform objec yet -> create from model with create sub objects
                objObject = await FreeformGroupObject.getObjectFromModel (
                    freeform,
                    iNformUser,
                    iNformModelId,
                    iNformId,

                    iNobject, iNparentForChild, iNnewInIdObject,

                    iNfirestoreBatchGroup,
                    iNfullDownloaded
                );
            }
    
            if ( !objObject ) {
                // if we canot get this freeform object -> stop this func
                LOG.fstep ( fname, 4, 0,'We canot get this freeform object - stop this func', objObject );
                return CONNECT.returnPromiseValue(null);
            }
        //@> get group object from model OR (if iseet yet) create safe sub freeform objects






        //@> get group object from model OR (if iseet yet) create safe sub freeform objects

        //pre step create
            let preArr;
            if ( !objectFromLocal ) {
                // if object from local (object isset already) -> we pass
                preArr = FreeformShared.sortObjectByWeight( freeform.groups[iNobject['id']].base.pre );
            } else {
                preArr = objObject.pre;
            }
            for ( let preGroupKey  in preArr ) {
                let preGroup        = preArr[preGroupKey],
                    preGroupObject;

                preGroup['index']   = preGroupKey;

                preGroupObject      = await FreeformGroupObject.create (
                        iNfreeform,
                        iNformUser,
                        iNformModelId,
                        iNformId,

                        preGroup, iNparentForChild, iNnewInIdObject,

                        iNfirestoreBatchGroup,
                        iNfullDownloaded
                    );
                if ( !preGroupObject ) {
                    LOG.fstep(fname,2,0,'ERROR END - We can not create pre object -> delete && skip this object and next', preGroupObject, preGroup);
                    // freeform.groups[iNobject['id']].base.pre = freeform.groups[iNobject['id']].base.pre.filter( object =>  object['inid'] !== preGroup['inid'] );
                    if ( !objectFromLocal ) {
                        //if we create from model -> delete from model
                        freeform.groups[ iNobject['id'] ].base.pre = freeform.groups[ iNobject['id'] ].base.pre.filter(object => object['inid'] !== preGroup['inid']);
                    } else {
                        //if this object already created -> delete from model
                        objObject.pre = objObject.pre.filter(object => object['inid'] !== preGroup['inid']);
                    }
                    continue;
                    // we can not create sub group -> STOP this object
                    // return CONNECT.returnPromiseValue(null);
                }
                if ( !objectFromLocal ) {
                    let objRef          = { baseid  : preGroup['id'], objid   : preGroupObject['id'] };
                    // check iner id if isset
                    if ( preGroup['inid'] ) { objRef['inid'] = FreeformShared.safeGetInId (preGroup['inid'], preGroupObject['id'], iNnewInIdObject) ; }
                    // add to array
                    objObject.pre.push( objRef );
                }
            }

        // post step create
            let postArr;
            if ( !objectFromLocal ) {
                // if object from local (object isset already) -> we pass
                postArr = FreeformShared.sortObjectByWeight( freeform.groups[iNobject['id']].base.post );
            } else {
                postArr = objObject.post;
            }
            for ( let postGroupKey  in postArr ) {
                let postGroup         = postArr[postGroupKey],
                    postGroupObject;

                    // add index
                    postGroup['index'] = postGroupKey;

                    postGroupObject   = await FreeformGroupObject.create(
                        iNfreeform,
                        iNformUser,
                        iNformModelId,
                        iNformId,
                        
                        postGroup, iNparentForChild, iNnewInIdObject,

                        iNfirestoreBatchGroup,
                        iNfullDownloaded
                    );
    
                if ( !postGroupObject ) {
                    LOG.fstep(fname,3,0,'ERROR END - We can not create post object -> skip this object and next', postGroupObject, postGroup);

                    if ( !objectFromLocal ) {
                        //if we create from model -> delete from model
                        freeform.groups[iNobject['id']].base.post = freeform.groups[iNobject['id']].base.post.filter( object =>  object['inid'] !== postGroup['inid'] );
                    } else {
                        //if this object already created -> delete from model
                        objObject.post = objObject.post.filter( object => object['inid'] !== postGroup['inid'] );
                    }
                    continue;
                    // we can not create sub group -> STOP this object
                    // return CONNECT.returnPromiseValue(null);
                }

                if ( !objectFromLocal ) {
                    let objRef            = { baseid  : postGroup['id'], objid   : postGroupObject['id'] };
                    // check iner id if isset and not need generate new inid
                    if ( postGroup['inid'] ) {
                        objRef['inid'] = FreeformShared.safeGetInId (postGroup['inid'], postGroupObject['id'], iNnewInIdObject) ;

                    } else {objRef['inid'] = id;}
                    // add to array
                    objObject.post.push( objRef );
                }
    

            }

            // create dependedents for this element
            FreeformShared.scanRulesOfObject(freeform, objObject);


        // add object to freeform object with merge old object
            let obj = freeform.groups[iNobject['id']].objects[id];
            if ( typeof obj !== 'object' ) { obj = {}; }
            freeform.groups[ modelid ].objects[id] = Object.assign( objObject, obj );

        let resultObject = true;
        //@< create in db -> add to server
            if (
                !objectFromLocal ||
                objectFromLocal['fromLocal']
            ) {
                // if we generated this object on client
                console.log('group generating', modelid, id, objectFromLocal);

                // delete local value before server sign
                delete freeform['groups'][modelid]['objects'][id]['fromLocal'];

                let savable     = FreeformShared.isSavableObject (
                    freeform,
                    freeform['groups'][modelid]['objects'][id]
                );


                if (savable) {
                    // this form is savable -> create in server
                    resultObject = await FreeformElementObject.createElement ( // FreeformFieldObject.createField
                        'group',
                        'object',
                        freeform,
                        freeform.groups[ modelid ].objects[id],
                        iNformUser,
                        iNformModelId,
                        iNformId,
                        modelid,
                        id,
                        iNfirestoreBatchGroup
                    );
                    // await FreeformShared.createFreeformNotFieldObject(
                    //     freeform,
                    //     iNformUser,
                    //     iNformModelId,
                    //     iNformId,
                    //     freeform.groups[ modelid ].objects[id],
                    //     modelid,
                    //     id,
                    //     'group',
                    //     iNfirestoreBatchGroup
                    //
                    // );

                } else {
                    // this form is not savable -> set result page true
                    // resultObject = true;
                }

            }
        //@> create in db -> add to server

    
            if ( !resultObject ) {
                // we can not update freeform savable object  -> STOP THIS FUNC
                console.log ( 'create group - 5.2 createFreeformNotFieldObject - resultObject - STOP THIS FUNC - 4.2', resultObject );
                return CONNECT.returnPromiseValue ( null );
            } else {
                //@ we can update field in server OR is not savable form - return callback
    
                //@< return promise because we use asyns function
                return CONNECT.returnPromiseValue( { id: id} );
                //@> return promise because we use asyns function
            }
    }


    static check (iNfreeform, iNgroup) {
        if (!iNfreeform.groups[iNgroup['id']].objects) { iNfreeform.groups[iNgroup['id']].objects = {}; }
    }

    static async createIfNeedSubFreeformObjects (
        iNfreeform,
        iNformUser,
        iNformModelId,
        iNformId,

        iNobject, 
        iNfreeformObject, 
        iNnewInIdObject,

        iNfirestoreBatchGroup,
        iNfullDownloaded = false
    ) {
        //@disc - create freeform of this object

        const fname = 'Group.createIfNeedSubFreeformObjects';
        LOG.fstep (fname,1,0,'INVOKE - iNobject, iNfreeformObject, iNnewInIdObject', iNobject, iNfreeformObject, iNnewInIdObject );


        let thisObj = iNfreeformObject;


        //@< check access
            let proccessAccess = await FreeformGroupObject.proccessAccess ( iNfreeform, iNformUser, iNformModelId, iNformId, iNobject['id'], iNobject['key'], thisObj, true );
            if ( !proccessAccess ) {
                LOG.fstep(fname,2,1,'ERRROR END - we have not access to this obj', iNobject, proccessAccess);
                delete iNfreeform['groups'][ iNobject['id'] ]['objects'][ iNobject['key'] ];

                return CONNECT.returnPromiseWithValue(false);
            }
            LOG.fstep(fname,2,2,'We have not access to this obj', iNobject, proccessAccess);
        //@> check access

        try {
            // add groups (right format) to object
            for ( const rowKey in CONNECT.deepCopyObject(thisObj.body.rows) ) {
                const row = thisObj.body.rows[rowKey];
                // parent object for child obj (group)
                const dataForChildObj = FreeformElementReference.getParentOfObjForChildObj(
                    iNobject['key'], // obj key
                    iNobject['id'], // model id
                    'group' //
                );
                const rowObj  = await FreeformRow.Object.create(
                    iNfreeform,
                    iNformUser,
                    iNformModelId,
                    iNformId,
                    {
                        'id'    : row['baseid'],
                        'inid'  : row['objid'],
                        'index' : rowKey
                    },
                    dataForChildObj, 
                    iNnewInIdObject,

                    iNfirestoreBatchGroup,
                    iNfullDownloaded
                );

                if ( !rowObj ) {
                    LOG.fstep( fname,3,1,'ERROR END - We can not create sub row object -> delete && skip this object and next', rowObj, row );
                    // delete
                    thisObj.body.rows.splice( rowKey, 1 );
                    continue;
                    // we can not create sub group -> STOP this object
                    // console.log('createIfNeedSubFreeformObject- STOP THIS FUNCT ', iNobject, iNfreeformObject, iNnewInIdObject );
                    // return  CONNECT.returnPromiseValue(null);
                }
            }
            // return this freeform object
            return CONNECT.returnPromiseValue(thisObj);
        } catch (e) {
            console.log('createIfNeedSubFreeformObject group 6 ERR - STOP THIS FUNCT - e', e );
            return CONNECT.returnPromiseValue(null);
        }
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
        const fname = 'Group.proccessAccess';
        LOG.fstep(fname,0,0,'INVOKE');

        //@< check access and set access to this obj
            const readAccess = await AccessListShared.checkListForAccessToFreeformObject ( 'read', 'group', iNmodelId, iNobjId, iNformUser, iNformModelId, iNformId, iNfreeformObject, null );
            if ( !readAccess ) {
                // if we canot get this freeform object -> stop this func (
                console.log(fname, 'create group 3.21 - STOP THIS FUNCT');
                if (iNfromObject) {
                    // if we have not access to this object  -> delete this object from this object (not DB)
                    delete iNfreeform['groups'][iNmodelId]['objects'][iNobjId];
                }
                LOG.fstep(fname,1,1,'END ERROR - we have not access to this object');
                return CONNECT.returnPromiseValue(false);
            }
            // safe create this block
            if ( typeof iNfreeformObject['options']  !== 'object' ) { iNfreeformObject['options'] = {}; }
            if ( typeof iNfreeformObject['options']['access']  !== 'object' ) { iNfreeformObject['options']['access'] = {}; }
            // add read access
            iNfreeformObject['options']['access']['read'] = true;

            const writeAccess = await AccessListShared.checkListForAccessToFreeformObject ( 'write', 'group', iNmodelId, iNobjId, iNformUser, iNformModelId, iNformId, iNfreeformObject, null );
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

    static async getObjectFromModel (
        iNfreeform,
        iNformUser,
        iNformModelId,
        iNformId,
        
        iNobject, 
        iNparentForChild , 
        iNnewInIdObject,

        iNfirestoreBatchGroup,
        iNfullDownloaded
    ) {

        const fname = 'Group.getObjectFromModel';
        LOG.fstep (fname,1,0,'INVOKE - iNobject, iNparentForChild, iNnewInIdObject', iNobject, iNparentForChild, iNnewInIdObject );

        // get model of this
        let freeform = iNfreeform,
            model   =   freeform.groups[ iNobject['id'] ].base,
            object  =   FreeformShared.getObjectWithShortData( CONNECT.deepCopyObject(model), iNobject, true) ;


        //@< check access
            let proccessAccess = await FreeformGroupObject.proccessAccess ( iNfreeform, iNformUser, iNformModelId, iNformId, iNobject['id'], iNobject['key'], object, false );
            if ( !proccessAccess ) {
                LOG.fstep( fname, 2, 1,'ERRROR END - we have not access to this obj', iNobject, proccessAccess);
                delete iNfreeform['groups'][ iNobject['id'] ]['objects'][ iNobject['key'] ];
                return CONNECT.returnPromiseWithValue(false);
            }
            LOG.fstep( fname, 2, 2,'We have not access to this obj', iNobject, proccessAccess);
        //@> check access

        // convert object model to object and date for late recognize type and obj type - object
            object['options']['type'] = 'object';
            FreeformShared.Options.convertModelOptionsToWorkFormat (object, false, false);

        //@< generated object
            const gen     = object['body']['gen'] = {};
            // add to object (generated parent object)
            // gen['parent'] = iNparentForChild;
            FreeformElementReference.setParentOfObjForChildObj (object, iNparentForChild);
        //@> generated object

        // clear groups from object
            object.body.rows = [];

        //@< get new id and add to freeform
            object['id'] = iNobject['key']; //FreeformShared.safeGetInId (iNobject['inid'], false, iNnewInIdObject) ;
            object['position'] = parseInt(iNobject['index']);
            freeform.groups[ iNobject['id'] ].objects[ object['id'] ] = object;
            LOG.fstep ( fname, 22, 1, 'object', object['id'], iNobject['inid'], object );
        //@> get new id and add to freeform

        //@< generate local id
            //**LATER delete try - catch
            if (object['lid']) {
                FreeformElementObject.setLocalId('group', object, object['lid'], freeform, object['id'] );
            }
        //@> generate local id

        // add groups (right format) to object

        let sorted = FreeformShared.sortObjectByWeight( model.body.rows );
        for (let rowKey in sorted ) {
            // parent object for child obj (group)
            const   row             =  sorted[rowKey],
                    dataForChildObj = FreeformElementReference.getParentOfObjForChildObj(
                        iNobject['key'], // obj key
                        iNobject['id'], // model id
                        'group', //
                        iNparentForChild
                    );
            // add index
            row['index'] = rowKey;

            let rowObject   = await FreeformRow.Object.create(
                iNfreeform,
                iNformUser,
                iNformModelId,
                iNformId,
                
                row, dataForChildObj, iNnewInIdObject,

                iNfirestoreBatchGroup,
                iNfullDownloaded
            );

            if ( !rowObject ) {
                LOG.fstep(fname, 3, 1, 'ERROR END - We can not create sub row -> skip this object and next', rowObject, row );
                model.body.rows = model.body.rows.filter( object =>  object['inid'] !== row['inid'] );
                continue;
                // we can not create sub group -> STOP this object
                // return CONNECT.returnPromiseValue(null);
            }

            let objRef      = { baseid  : row['id'], objid   : rowObject['id'] };
            // check iner id if isset
            if ( row['inid'] ) { objRef['inid'] = FreeformShared.safeGetInId (row['inid'], rowObject['id'], iNnewInIdObject) ; }
            // add to array
            object.body.rows.push( objRef );
        }

        // if ( iNobject['inid'] ) {
        //     // object['id'] = iNobject['inid'];
        //     object['id'] = FreeformShared.safeGetInId (iNobject['inid'], false, iNnewInIdObject) ;
        // }
        // return object in need format

        return CONNECT.returnPromiseValue( object  );
    }
}
module.exports.FreeformGroupObject = FreeformGroupObject;



