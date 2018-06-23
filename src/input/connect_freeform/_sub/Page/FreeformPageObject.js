const CONNECT   = require('../../../connect');
const LOG     = require('ramman-z-log');
const FIREBASE  = require("../../../firebase/firebase");
const firestore = FIREBASE.firestore;


const FreeformShared    = require('./../FreeformShared').FreeformShared;// FreeformGlobalStorage
const FreeformGroup     = require('./../Group/FreeformGroup').FreeformGroup;// FreeformGlobalStorage

const AccessListShared  = require('./../AccessList/AccessListShared').AccessListShared;// AccessListShared

const FreeformElementModel      = require('./../Element/FreeformElementModel').FreeformElementModel;// FreeformShared
const FreeformElementObject     = require('./../Element/FreeformElementObject').FreeformElementObject;// FreeformShared
const FreeformElementReference  = require('./../Element/FreeformElementReference').FreeformElementReference;// FreeformElementReference

class FreeformPageObject {
    constructor () {
    }


    static check (iNfreeform, iNpageId) {
        if (!iNfreeform.pages ) {
            iNfreeform.pages = {};
        }
        if (!iNfreeform.pages[ iNpageId ]) {
            iNfreeform.pages[ iNpageId ] = {};
        }
        if ( !iNfreeform.pages[ iNpageId ]['objects'] ) {
            iNfreeform.pages[ iNpageId ]['objects'] = {};
        }
    }

    static async create (
        iNfreeform,
        iNformUser,
        iNformModelId,
        iNformId,

        iNobject,
        iNparentForChild = null,
        iNaddToMap = true,
        iNnewInIdObject = null,

        iNfirestoreBatch,
        iNfullDownloaded = false
   ) {
        const fname     = 'Page.create',
              freeform  = iNfreeform;

        LOG.fstep(fname,1,0,'INVOKE - iNobject, iNparentForChild, iNaddToMap, iNnewInIdObject', iNobject, iNparentForChild, iNaddToMap, iNnewInIdObject);

        // safe create page
        FreeformPageObject.check(freeform, iNobject['id']);

        // generated random key for this object
        const   id      = iNobject['key'] = FreeformShared.safeGetInId (iNobject['inid'], CONNECT.getRandomKeyByUuid(), iNnewInIdObject),
                modelid = iNobject['id'];

        // if isset this page not create from model
        let modelFromLocal = null,
            objectFromLocal = null,
            objModel = null,
            objObject;

        //@< check for isset model
            if (
                (
                    freeform['pages'] &&
                    freeform['pages'][modelid]
                )
            ) {
                // we have this model
                modelFromLocal = objModel = freeform['pages'][modelid];
            } else if (!iNfullDownloaded){
                // we have not this model local -> get from db
                objModel = await FreeformElementModel.getElementFromFormObject (//getFieldFromFormObject
                    'page',
                    iNformUser,
                    iNformModelId,
                    iNformId,
                    modelid,
                    'model'
                );
                if (objModel) {
                    freeform['pages'][modelid] = { 'base' : objModel, objects: {} };
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
                ) {
                    // we have this field on server -> not create this field -> return field
                    objObject = objectFromLocal = freeform['pages'][modelid]['objects'][id];
                    LOG.fstep (fname,3,1,'PAGE ISSET', modelid, id, objectFromLocal );
                    // return CONNECT.returnPromiseValue(new FreeformReadyObjectModel(id));
                } else if (
                    !FreeformShared.isSimpleForm(freeform) &&
                    !objObject &&
                    FreeformShared.isSavableObject(freeform, objModel)
                ) {
                    LOG.fstep (fname,3,2,'Page not isset in local', modelid, id, freeform );
                    objObject = await FreeformElementModel.getElementFromFormObject (//getFieldFromFormObject
                        'page',
                        iNformUser,
                        iNformModelId,
                        iNformId,
                        id,
                        'object'
                    );
                }
        //@> check for isset


        //@< get page object from model OR (if iseet yet) create safe sub freeform objects
            if ( objObject ) {
                // we have this page object already -> create if need sub freeform objects
                objObject = await FreeformPageObject.createIfNeedSubFreeformObjects
                    (
                        iNfreeform,
                        iNformUser,
                        iNformModelId,
                        iNformId,

                        iNobject,
                        objObject,
                        iNnewInIdObject,

                        iNfirestoreBatch,
                        iNfullDownloaded
                    );
            } else {
                // wa have not this freeform objec yet -> create from model with create sub objects
                objObject = await FreeformPageObject.getObjectFromModel(
                    iNfreeform,
                    iNformUser,
                    iNformModelId,
                    iNformId,

                    iNobject,
                    iNparentForChild,
                    iNnewInIdObject,

                    iNfirestoreBatch,
                    iNfullDownloaded
                );
            }

            if ( !objObject ) {
                // if we canot get this freeform object -> stop this func
                LOG.fstep(fname,4,0,'ERROR END - We canot get this freeform object -> stop this func');
                return CONNECT.returnPromiseValue(null);
            }
        //@> get page object from model OR (if iseet yet) create safe sub freeform objects

        //pre step create
            let preArr;
            if ( !objectFromLocal ) {
                // if object from local (object isset already) -> we pass
                preArr = FreeformShared.sortObjectByWeight( freeform.pages[ modelid ].base['pre'] );
            } else {
                preArr = objObject.pre;
            }
            for ( const prePageKey in preArr ) {
                const   prePage = preArr[prePageKey],
                        objRef  = { 'id' : prePage['id'], 'baseid'  : prePage['id'], 'index' : prePageKey };
                // check iner id if isset
                if ( prePage['inid'] ) {
                    objRef['inid'] = FreeformShared.safeGetInId (prePage['inid'], false, iNnewInIdObject);
                }
                const prePageObject     = await FreeformPageObject.create(
                    iNfreeform,
                    iNformUser,
                    iNformModelId,
                    iNformId,

                    objRef,
                    false,
                    iNnewInIdObject,

                    iNfirestoreBatch,
                    iNfullDownloaded
                );

                if ( !prePageObject ) {
                    LOG.fstep(fname,5,0,'ERROR END - We can not create pre object -> delete && skip this object and next', prePageObject, prePage);

                    if ( !objectFromLocal ) {
                        //if we create from model -> delete from model
                        freeform.pages[ modelid ].base['pre'] = freeform.pages[ modelid ].base['pre'].filter( object =>  object['inid'] !== prePage['inid'] );
                    } else {
                        //if this object already created -> delete from model
                        objObject.pre = objObject.pre.filter(object => object['inid'] !== prePage['inid']);
                    }
                    continue;
                    // return CONNECT.returnPromiseValue(null);
                }
                if ( !objectFromLocal ) {
                    objRef ['objid']    = prePageObject['id'];

                    // add to array
                    prePage['pre'].push( objRef );
                }

            }

        // post step create
            let postArr;
            if ( !objectFromLocal ) {
                // if object from local (object isset already) -> we pass
                postArr = FreeformShared.sortObjectByWeight( freeform.pages[ modelid ].base['post'] );
            } else {
                postArr = objObject.post;
            }
            for ( const postPageKey  in postArr ) {
                const   postPage = postArr[postPageKey],
                        objRef = { 'id' : postPage['id'], 'baseid'  : postPage['id'], 'index' : postPageKey };
                // check iner id if isset
                if ( postPage['inid'] ) {
                    // objRef['inid'] = postPage['inid'];
                    FreeformShared.safeGetInId ( postPage['inid'], false, iNnewInIdObject );
                }
                const postPageObject    = await FreeformPageObject.create(
                    iNfreeform,
                    iNformUser,
                    iNformModelId,
                    iNformId,

                    objRef,
                    false,
                    iNnewInIdObject,

                    iNfirestoreBatch,
                    iNfullDownloaded
                );
                if ( !postPageObject ) {
                    LOG.fstep(fname,6,0,'ERROR END - We can not create post object -> delete && skip this postPageObject and next', postPageObject, postPage);

                    if ( !objectFromLocal ) {
                        //if we create from model -> delete from model
                        freeform.pages[ modelid ].base['post'] = freeform.pages[ modelid ].base['post'].filter( object =>  object['inid'] !== postPage['inid'] );
                    } else {
                        //if this object already created -> delete from model
                        objObject.post = objObject.post.filter(object => object['inid'] !== postPage['inid']);
                    }
                    continue;
                    // return CONNECT.returnPromiseValue(null);
                }
                if ( !objectFromLocal ) {
                    objRef ['objid'] = postPageObject['id'];
                    // add to array
                    postPage['pre'].push(objRef);
                }
            }

        // add to map this page if need
            if (iNaddToMap) {
                try {
                    await FreeformPageObject.addPageToMap(freeform, iNformUser, iNformModelId, iNformId, modelid, id, iNfirestoreBatch);

                } catch (e) {
                    LOG.fstep(fname,7,0,'ERROR END - We can not add to map -> stop this func', e,iNaddToMap);
                }
            }

        // add object to freeform object with merge old object
        // add object to freeform object with merge old object
        let obj = {};
        if (
            freeform.pages &&
            freeform.pages[modelid] &&
            freeform.pages[modelid].objects &&
            typeof freeform.pages[modelid].objects[id] === 'object'
        ) {
            obj = freeform.pages[modelid].objects[id];
        }
        freeform.pages[modelid].objects[id] = Object.assign( objObject, obj );


        //@< create in db -> add to server
            let resultPage = true;
            if (
                !objectFromLocal ||
                objectFromLocal['fromLocal']
            ) {
                // if we generated this object on client
                console.log('page generating', modelid, id, objectFromLocal);
                // delete local value before server sign
                delete freeform['pages'][modelid]['objects'][id]['fromLocal'];

                let savable     = FreeformShared.isSavableObject (
                    freeform,
                    freeform['pages'][modelid]['objects'][id]
                );
                if (savable) {
                    // this form is savable -> create in server
                    resultPage = await FreeformElementObject.createElement ( // FreeformFieldObject.createField
                        'page',
                        'object',
                        freeform,
                        freeform.pages[iNobject['id']].objects[id],
                        iNformUser,
                        iNformModelId,
                        iNformId,
                        modelid,
                        id,
                        iNfirestoreBatch
                    );
                } else {
                    // this form is not savable -> set result page true
                }
            }
        //@> create in db -> add to server

    
        if ( !resultPage ) {
            // we can not update freeform savable object  -> STOP THIS FUNC
            LOG.fstep(fname,8,0,'ERROR END - We can not update freeform savable object -> stop this func', resultPage);
            return CONNECT.returnPromiseValue ( null );
        } else {
            //@ we can update field in server OR is not savable form - return callback

            //@< return promise because we use asyns function
                return CONNECT.returnPromiseValue( { 'id': id} );
            //@> return promise because we use asyns function
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
        const fname = 'PAGE.proccessAccess';

        //@< check access and set access to this obj
        const readAccess = await AccessListShared.checkListForAccessToFreeformObject ( 'read', 'page', iNmodelId, iNobjId, iNformUser, iNformModelId, iNformId, iNfreeformObject, null );
        if ( !readAccess ) {
            // if we canot get this freeform object -> stop this func (
            console.log(fname, 'create group 3.21 - STOP THIS FUNCT');
            if (iNfromObject) {
                // if we have not access to this object  -> delete this object from this object (not DB)
                delete iNfreeform['pages'][iNmodelId]['objects'][iNobjId];
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

    static async addPageToMap  (iNfreeform, iNformUser, iNformModelId, iNformId, iNpageId, iNobjId, iNfirestoreBatch) {
        // create map array if not isset
        if (!Array.isArray(iNfreeform.map) ) { iNfreeform.map = []; }
        const map = iNfreeform.map;
        // add to map
        map.push(
            {
                baseid: iNpageId,
                objid :  iNobjId
            }
        );

        // sync with db from server
        return  FreeformShared.syncFormMap (
            iNformUser,
            iNformModelId,
            iNformId,
            map,
            iNfirestoreBatch
        );
    }

    static async createIfNeedSubFreeformObjects (
        iNfreeform,
        iNformUser,
        iNformModelId,
        iNformId,

        iNobject,
        iNfreeformObject,
        iNnewInIdObject,

        iNfirestoreBatch,
        iNfullDownloaded
    ) {
        //@disc - create freeform of this object
        const fname = 'Page.createIfNeedSubFreeformObjects';
        LOG.fstep(fname,1,0,'INVOKE - iNobject, iNfreeformObject, iNnewInIdObject', iNobject, iNfreeformObject, iNnewInIdObject);

        let thisObj = iNfreeformObject;

        //@< check access
            let proccessAccess = await FreeformPageObject.proccessAccess ( iNfreeform, iNformUser, iNformModelId, iNformId, iNobject['id'], iNobject['key'], thisObj, true );
            if (!proccessAccess) {
                LOG.fstep(fname,2,1,'ERRROR END - we have not access to this obj', iNobject, proccessAccess);
                delete iNfreeform['pages'][ iNobject['id'] ]['objects'][ iNobject['key'] ];
                return CONNECT.returnPromiseWithValue(false);
            }
            LOG.fstep(fname,2,2,'We have not access to this obj', iNobject, proccessAccess);
        //@> check access

        try {
            // add groups (right format) to object
            for ( const groupKey in CONNECT.deepCopyObject(thisObj.body.groups) ) {
                const group = thisObj.body.groups[groupKey];
                // parent object for child obj (group)
                const dataForChildObj = FreeformElementReference.getParentOfObjForChildObj(
                    iNobject['key'], // obj key
                    iNobject['id'], // model id
                    'page' //
                );
                const groupObj  = await FreeformGroup.Object.create (
                    iNfreeform,
                    iNformUser,
                    iNformModelId,
                    iNformId,
                    {
                        'id'    : group['baseid'],
                        'inid'  : group['objid'],
                        'index' : groupKey
                    },
                    dataForChildObj,
                    iNnewInIdObject,

                    iNfirestoreBatch,
                    iNfullDownloaded

                );

                if ( !groupObj ) {
                    LOG.fstep(fname,3,1,'ERROR END - We can not create sub group -> delete this, skip this object and next', groupObj, group );
                    thisObj.body.groups.splice( groupKey, 1 );
                    // we can not create sub group -> STOP this object
                    // return  CONNECT.returnPromiseValue(null);
                }
            }
            // return this freeform object
            return CONNECT.returnPromiseValue(thisObj);
        } catch (e) {
            console.log('createIfNeedSubFreeformObject page ERR - STOP THIS FUNCT - e', e );
            return CONNECT.returnPromiseValue(null);
        }
    }


    static async getObjectFromModel (
        iNfreeform,
        iNformUser,
        iNformModelId,
        iNformId,
        
        iNobject,
        iNparentForChild,
        iNnewInIdObject,

        iNfirestoreBatch,
        iNfullDownloaded
    ) {
        // get model of this

        const fname = 'Page.getObjectFromModel';
        LOG.fstep(fname,1,0,'INVOKE - iNobject, iNparentForChild, iNnewInIdObject', iNobject, iNparentForChild, iNnewInIdObject);

        const   freeform    = iNfreeform,
                model       = freeform.pages[iNobject['id']].base,
                // if we have not object
                object      = FreeformShared.getObjectWithShortData( CONNECT.deepCopyObject(model), iNobject, true);

        //@< check access
            let proccessAccess = await FreeformPageObject.proccessAccess ( iNfreeform, iNformUser, iNformModelId, iNformId, iNobject['id'], iNobject['key'], object, false );
            if ( !proccessAccess ) {
                LOG.fstep(fname,2,1,'ERRROR END - we have not access to this obj', iNobject, proccessAccess);
                return CONNECT.returnPromiseWithValue(false);
            }
            LOG.fstep(fname,2,2,'We have access to this obj', iNobject, object, proccessAccess);
        //@> check access

        // convert object model to object and date for late recognize type and obj type - object
            object['options']['type'] = 'object';
            FreeformShared.Options.convertModelOptionsToWorkFormat (object, false, false);

        LOG.fstep( fname, 3, 0, 'We have converted', object );

        //@< generated object
            const gen = object['body']['gen'] = {};
            // add to object (generated parent object)
            gen['parent'] = iNparentForChild;
        //@> generated object

        // clearing
            object.body.groups = [];

        //@< get new id and add to freeform
            object['id']        = iNobject['key']; //FreeformShared.safeGetInId (iNobject['inid'],false, iNnewInIdObject) ;
            object['position']  = parseInt(iNobject['index']);
            freeform.pages[ iNobject['id'] ].objects[ object['id'] ] = object;
            LOG.fstep ( fname, 22, 1, 'object', object['id'], iNobject['inid'], object );
        //@> get new id and add to freeform

        // add groups (right format) to object
        const   sortedGroups = FreeformShared.sortObjectByWeight(model.body.groups);
        for ( const groupKey in sortedGroups ) {
            const   group = sortedGroups[groupKey];
                    // add index
                    group['index'] = groupKey;

            // parent object for child obj (group)
                const dataForChildObj = FreeformElementReference.getParentOfObjForChildObj (
                    iNobject['key'], // obj key
                    iNobject['id'], // model id
                    'page' //
                );

            const groupObj  = await FreeformGroup.Object.create (
                iNfreeform,
                iNformUser,
                iNformModelId,
                iNformId,
                
                group, 
                dataForChildObj, 
                iNnewInIdObject,

                iNfirestoreBatch,
                iNfullDownloaded
            );
            if ( !groupObj ) {
                // we can not create sub group -> delete ref to this object && skip this object and next
                LOG.fstep(fname,3,0,'ERROR - We can not create sub group ->  skip this object and next', groupObj );
                model.body.groups = model.body.groups.filter( object =>  object['inid'] !== group['inid'] );
                continue;
                // return CONNECT.returnPromiseValue(null);
            }

            let   objRef    = { baseid  : group['id'], objid   : groupObj['id'] };
            // check iner id if isset
            if ( group['inid'] ) { objRef['inid'] = FreeformShared.safeGetInId( group['inid'], group['id'], iNnewInIdObject) ; }
            // if ( group['inid'] ) { objRef['inid'] = group['inid']; }
            // add to array
            object.body.groups.push ( objRef );
        }


        // add inid
        // if ( iNobject['inid'] ) { object['id'] = FreeformShared.safeGetInId (iNobject['inid'],false, iNnewInIdObject) ;  }


        // return object in need format
        return CONNECT.returnPromiseValue( object ); // FreeformShared.getObjectWithShortData(object, iNobject, true)
    }
}
module.exports.FreeformPageObject = FreeformPageObject;



