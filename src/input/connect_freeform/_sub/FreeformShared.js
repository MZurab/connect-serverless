const CONNECT   = require('./../../connect');
const LOG     = require('ramman-z-log');
const FIREBASE  = require("./../../firebase/firebase");
// const firestore = FIREBASE.firestore;


class FreeformShared {
    constructor () {}

    static get Options () {
        return FreeformOptions;
    }

    //@< SIMPLEFIELD CHAPTER
        static isSimpleForm (iNfreeform) {
            if (
                iNfreeform['options'] &&
                iNfreeform['options']['simpleForm']
            ) {
                return true;
            }
            return false;
        }
    //@> SIMPLEFIELD CHAPTER

    static get formStatus  () {
        return {
            "created"       : 0,
            "activated"     : 1,
            "deactivated"   : 2,
            "deleted"       : 3,
            "submited"      : 5
        };
    };

    static scanRulesOfObject (iNfreeform, iNojbect) {
        if (
            typeof iNojbect === 'object' &&
            typeof iNojbect['body']['rules'] === 'object' &&
            Array.isArray(iNojbect['body']['rules']['for'])
        ) {
            const inid      = iNojbect['id'];
            const rules     = iNojbect['body']['rules'];
            const forArray  = rules['for'];

            if ( !Array.isArray(forArray) || forArray.length < 1) {
                return;
            } else {
            }

            // hide this element
            iNojbect['body']['status']['hide'] = true;

            // create dependent
            FreeformShared.addDependentFromForArray(iNfreeform, forArray, inid );
        }
    }



    static getFreeform ( iNformUser, iNmodelId, iNformId) {

        if (
            global['freeform'] &&
            global['freeform']['form'][iNformUser] &&
            global['freeform']['form'][iNformUser][iNmodelId] &&
            global['freeform']['form'][iNformUser][iNmodelId][iNformId]
        ) {
            return global['freeform']['form'][iNformUser][iNmodelId][iNformId];
        }
    }

    static getFreefomObjectByInId (iNfreeform, iNinId, iNsearchObjects = null) {
        // get model of this
        const freeform   = iNfreeform; //this._freeform;

        if(!freeform) { return null; }

        // categories which search
        const search     = iNsearchObjects || [ 'fields', 'pages', 'groups', 'rows' ];
        for ( const type of search ) {
            // search in this cateogry
            if (!freeform[type]) continue;
            for (const modelid of Object.keys( freeform[type] ) ) {
                //search in this categories' models if this model has objects (created object by this model)
                if (!freeform[type][modelid]['objects']) { continue; }

                for (const objid of Object.keys( freeform[type][modelid]['objects'] ) ) {
                    // search in this models' objects
                    var obj = freeform[type][modelid]['objects'][objid];
                    if ( iNinId === obj['id'] ) { return obj; }
                }
            }
        }
        return null;
    }
    static getFreefomObjectId (iNfreeform, iNfolder, iNmodelId, iNid) {
        // get model of this
        const freeform   = iNfreeform; //this._freeform;

        if (
            freeform &&
            freeform[iNfolder] &&
            freeform[iNfolder][iNmodelId] &&
            freeform[iNfolder][iNmodelId]['objects'] &&
            freeform[iNfolder][iNmodelId]['objects'][iNid]

        ) {
            return freeform[iNfolder][iNmodelId]['objects'][iNid];
        }

        return null;
    }

    static createRuleBlockIfNot (iNobject) {
        if (
            typeof iNobject['body']['rules'] !== 'object'
        ) {
            iNobject['body']['rules'] = {};
            return true;
        }
        return false;
    }
    static createDependentBlockIfNot (iNobject) {
        if (
            FreeformShared.createRuleBlockIfNot(iNobject) &&
            Array.isArray(iNobject['body']['rules']['dependent'])
        ) {
            iNobject['body']['rules']['dependent'] = [];
            return true;
        }
        return false;
    }

    static addDependent (iNdependentBlock, iNojbect) {
        /*
          @input
            iNdependentBlock: dependentBlock
            iNojbect: {}
        */

        // safe create dependent block
        FreeformShared.createDependentBlockIfNot(iNojbect);


        if ( !Array.isArray(iNojbect['body']['rules']['dependent']) ) iNojbect['body']['rules']['dependent'] = [];

        // safe create status block
        if ( typeof(iNojbect['body']['status'] ) !== 'object' ) iNojbect['body']['status'] = {};


        // get dependent array
        var dependent = iNojbect['body']['rules']['dependent'];

        // permission for add dependent ()
        let add = true;

        for ( const thisEl of dependent ) {
            if ( thisEl['in_id'] === iNdependentBlock['in_id'] && iNdependentBlock['in_id']) {
                // if this element isset yet, we not add new element
                add = false;
                // quit out from cycle
                break;
            }
        }

        // add if not isset
        if (add) {
            dependent.push(
                // this.deepcopy(iNdependentBlock)
                iNdependentBlock
            );

        }

        return add;
    }


    static createInitialFreeformObject (iNfreeform, iNid, iNbaseId, iNtype) {
        // random key
        let key = CONNECT.getRandomKeyByUuid(),
            freeform = iNfreeform;
        // initial object
        let obj = {
            'id'  : iNid,
            'body': {
                'rules': {}
            },
            'post': [],
            'pre' : []
        };
        switch (iNtype) {
            case 'group':
                // safe create object block + add to each object
                if ( typeof freeform['groups'][iNbaseId]['objects'] !== 'object' )
                    freeform['groups'][iNbaseId]['objects'] = {};

                // create initial object
                freeform['groups'][iNbaseId]['objects'][key] = obj;
                break;
            case "row":
                // safe create object block + add to each object
                if ( typeof freeform['rows'][iNbaseId]['objects'] !== 'object' )
                    freeform['rows'][iNbaseId]['objects'] = {};

                // create initial object
                freeform['rows'][iNbaseId]['objects'][key]   = obj;
                break;
            case "page":
                // safe create object block + add to each object
                if ( typeof freeform['pages'][iNbaseId]['objects'] !== 'object' )
                    freeform['pages'][iNbaseId]['objects'] = {};

                // create initial object
                freeform['pages'][iNbaseId]['objects'][key]  = obj;
                break;
            default: // field
                // safe create object block + add to each object
                if ( typeof freeform['fields'][iNbaseId]['objects'] !== 'object' )
                    freeform['fields'][iNbaseId]['objects'] = {};

                // create initial object
                freeform['fields'][iNbaseId]['objects'][ key ] = obj;
                break;
        }
        return key;
    }

    static addDependentFromForArray (iNfreeform, iNforArray, iNid) {
        for ( const thisEl of iNforArray ) {
            // get object whitch this inid
            var thisObj = FreeformShared.getFreefomObjectByInId(iNfreeform, thisEl.in_id);

            // if this ob
            if (!thisObj) {
                FreeformShared.createInitialFreeformObject (iNfreeform, thisEl['in_id'], thisEl['model_id'], thisEl['obj_type'] );
                thisObj = FreeformShared.getFreefomObjectByInId(iNfreeform, thisEl.in_id);
            }

            // if not skip this step
            if (!thisObj) { continue; }

            // replace this for id to this objectid
            thisEl['in_id'] = iNid;

            //add dependent for this object - iNid
            FreeformShared.addDependent( thisEl, thisObj );
        }
    }

    static getObjectWithShortData (iNobject, iNshortData, iNfromModel = false) {
        const fname = 'getObjectWithShortData';
        LOG.fstep(fname,0,0, "INOKE - iNobject, iNshortData, iNfromModel", iNobject, iNshortData, iNfromModel);
        // for create object with need data if not exist

        //@< replace to new params if they isset
        let object        = iNobject || { 'body': {} },
            bodyOfObject  = object['body'];


        // safe create pre array  (if this not object copy from model) or we have not pre array
        if ( !Array.isArray(iNshortData.pre) || iNfromModel) object['pre'] = [];
        // safe create pre array  (if this not object copy from model) or we have not pre array
        if ( !Array.isArray(iNshortData.post) || iNfromModel) object['post'] = [];

        //change value of field or create initial value
        if ( typeof iNshortData['value'] === 'string' )
            bodyOfObject['value']     = iNshortData['value'];
        else
            bodyOfObject['value']     = '';


        if ( typeof iNshortData['name'] === 'string' )     bodyOfObject['name']    = iNshortData['name'];
        // set type if need change
        if ( typeof iNshortData['type'] === 'string' )     bodyOfObject['type']    = iNshortData['type'];
        if ( typeof iNshortData['payload'] === 'object' )  bodyOfObject['payload'] = iNshortData['payload'];
        if ( typeof iNshortData['status'] === 'object' )   bodyOfObject['status']  = iNshortData['status'];
        //@< rules
            if ( typeof iNshortData['rules'] === 'object' ) {
                bodyOfObject['rules']  = iNshortData['rules'];
            } else if (typeof bodyOfObject['rules'] !== 'object' ){
                // create if not have rule -> probabaly we later must add 'for'
                bodyOfObject['rules'] = {};
            }
            if ( typeof bodyOfObject['rules'] !== 'object' ){
                // create if not have rule -> probabaly we later must add 'for'
                bodyOfObject['rules'] = {};
            }

            //@< triggers
                if ( typeof iNshortData['triggers'] === 'object' ) {
                    bodyOfObject['triggers']    = iNshortData['triggers'];
                } else if (typeof bodyOfObject['triggers'] !== 'object' ) {
                    bodyOfObject['triggers'] = {};
                }
            //@> triggers

            // add mask if isset to rules
            if ( iNshortData && Array.isArray(iNshortData['mask']) )
                bodyOfObject['rules']['mask']  = iNshortData['mask'];

            // add resolvedSymbols for this field (input) if pass in shortDate
            if ( iNshortData && Array.isArray(iNshortData['resolvedSymbols']) )
                bodyOfObject['rules']['resolvedSymbols']  = iNshortData['resolvedSymbols'];


            // add validators (check value after change if(-) clear value) for this field (input) if pass in shortDate
            if ( iNshortData && !Array.isArray(iNshortData['validators']) && typeof iNshortData['validators'] === 'object' )
                bodyOfObject['rules']['validators']  = iNshortData['validators'];
        //@> rules



        //@< options - merge with model

                if ( typeof iNshortData['optionsForObject'] === 'object' ) {

                    if ( typeof object['optionsForObject'] !== 'object' ) {
                        object['optionsForObject'] = {};//  options['optionsForObject'] = ;
                    }

                    object['optionsForObject'] = CONNECT.mergeObject( iNshortData['optionsForObject'], object['optionsForObject'] );
                    // object['options']    = CONNECT.mergeObject(iNshortData['options'], object['options']);
                }

                if ( typeof object['optionsForObject'] === 'object' ) {
                    // options - convert optionsForObject -> to options

                    FreeformOptions.convertModelOptionsToWorkFormat( object, false, false);
                }
        //@> options - merge with model

        //@< view
        LOG.fstep(fname,1,0, "INOKE - iNshortData['view'", typeof iNshortData['view'], iNshortData['view']);
        if ( typeof iNshortData['view'] === 'object' ) {
            LOG.fstep(fname,2,1, "INOKE - iNshortData['view'", typeof iNshortData['view'], iNshortData['view']);
            bodyOfObject['view']    = iNshortData['view'];
        } else if (typeof bodyOfObject['view'] !== 'object' ){
            LOG.fstep(fname,2,2, "INOKE - iNshortData['view'", typeof iNshortData['view'], iNshortData['view']);
            bodyOfObject['view'] = {};
        }
        LOG.fstep(fname,3,0, "bodyOfObject['view']", bodyOfObject['view']);
        LOG.fstep(fname,3,0, "object", object);

        // add prefix if isset to rules
        if ( iNshortData && iNshortData['prefix'] ) {
            if ( typeof iNshortData['prefix'] !== 'object' ) {
                bodyOfObject['view']['prefix'] = {'type': 'string', 'value' : iNshortData['prefix']};
            } else {
                bodyOfObject['view']['prefix'] = {
                    'type': iNshortData['prefix']['type'],
                    'value' : iNshortData['prefix']['value']
                };
            }
        }
        // add postfix if isset to rules
        if ( iNshortData && iNshortData['postfix'] ) {
            if ( typeof iNshortData['postfix'] !== 'object' ) {
                bodyOfObject['view']['postfix'] = {'type': 'string', 'value' : iNshortData['postfix']};
            } else {
                bodyOfObject['view']['postfix'] = {
                    'type'  : iNshortData['postfix']['type'],
                    'value' : iNshortData['postfix']['value']
                };
            }
        }

        // add hint is not exist -> create object
        if( typeof bodyOfObject['view']['hint'] !== 'object' )  bodyOfObject['view']['hint'] = {};
        if ( iNshortData && iNshortData['hint'] ) {
            if ( typeof iNshortData['hint'] !== 'object' ) {
                // if in short date is string we add to start hint
                bodyOfObject['view']['hint']['start'] = iNshortData['hint'];
            } else {
                // if in short date is hint as object we add start and end from this
                bodyOfObject['view']['hint'] = {
                    'start'   : iNshortData['hint']['start'],
                    'end'     : iNshortData['hint']['end']
                };
            }
        }
        //@> view

        if ( typeof iNshortData['status'] === 'object' ){
            // create if not have rule -> probabaly we later must add 'for'
            bodyOfObject['status'] = iNshortData['status'];
        } else if ( typeof bodyOfObject['status'] !== 'object' ) {
            bodyOfObject['status'] = {};
        }

        // created required array if need or null
        bodyOfObject['status']['required']  =
            ( iNshortData['required'] && Array.isArray(iNshortData['required']) )     ? iNshortData['required']   :
                ( ( bodyOfObject['status']['required'] && Array.isArray(bodyOfObject['status']['required']) ) ? bodyOfObject['status']['required']  : [] );


        if ( iNshortData && Array.isArray(iNshortData['for']) )    bodyOfObject['rules']['for']  = iNshortData['for'];
        if ( typeof iNshortData['permission'] === 'object' )    bodyOfObject['permission']  = iNshortData['permission'];
        if ( typeof iNshortData['actions'] === 'object' )    bodyOfObject['actions']  = iNshortData['actions'];
        if ( typeof iNshortData['helper'] === 'object' )    bodyOfObject['helper']  = iNshortData['helper'];

        //@> replace to new params if they isset
        LOG.fstep(fname,5,0, "END", object);
        return object;
    }

    static async createFreeformNotFieldObject (
        iNfreeform,
        iNuid, 
        iNformModelId, 
        iNformId, 
        iNobject, 
        iNmodelId, 
        iNobjId, 
        iNtype,
        iNfirestoreBatch
    ) {
        let folder    = null,
            update    = {},
            pathToDoc = `freeform/${iNuid}/model/${iNformModelId}/form/${iNformId}`;

        switch (iNtype) {
            case "page":
                folder='pages';
                break;

            case "row":
                folder='rows';
                break;

            case "group":
                folder='groups';
                break;

        }
        if (folder) {
            update[`${folder}.${iNmodelId}.objects.${iNobjId}`] = iNobject;
            let result = CONNECT.getValueFromObjectByPath(`${folder}.${iNmodelId}.objects.${iNobjId}`, iNfreeform );

            try {
                let thisFirestore = FIREBASE.batchGroupUpdate(
                    pathToDoc,
                    update,
                    iNfirestoreBatch
                );
                return CONNECT.returnPromiseValue (true );
            } catch (e) {
                return CONNECT.returnPromiseValue (false );
            }
        } else {
            return CONNECT.returnPromiseValue (false);
        }
    }
    

    static sortObjectByWeight (iNarray) {
        // desc order by weight
        return iNarray.sort((obj1, obj2) => {
            obj1.weight = (obj1.weight) ? obj1.weight : 1;
            obj2.weight = (obj2.weight) ? obj2.weight : 1;

            return  obj2.weight - obj1.weight;
        });
    }

    static isSavableForm (freeform) {
        //@ disc - all form is not savable by default
        if (
            freeform['options'] &&
            freeform['options']['savable']
        ) {
            // this form not savable
            return true;
        }
        return false;
    }
    //

    static isSavableObject (freeform, iNobject) {
        //@ disc - all object (not form) is savable by default
        if (
            FreeformShared.isSavableForm(freeform) &&
            (
                ( iNobject['options'] && ( iNobject['options']['savable'] !== false ) ) ||
                ( !iNobject['options'] )
            )
        ) {
            // this form not savable
            return true;
        }
        return false;
    }
    // //@< parent element block
    //     static getParentOfObjForChildObj (  iNobjId, iNmodelId, iNtype, iNgreatParent  = null) {
    //         // let result= {
    //         //     objid     : iNobjId,
    //         //     modelid   : iNmodelId,
    //         //     type      : iNtype,
    //         // };
    //         let greatParent = iNgreatParent,
    //             result = greatParent || {},
    //             parenntKeys;
    //
    //         // get keys for add parent date
    //         parenntKeys = FreeformShared.getKeysForParenIdAndModelId (iNtype);
    //
    //         if ( !parenntKeys ) {
    //             return null;
    //         }
    //
    //         // add/replace model id
    //         result[ parenntKeys['mid'] ] = iNmodelId;
    //         // add/replace object id
    //         result[ parenntKeys['id'] ] = iNobjId;
    //         // add/replace parent type
    //         result[ 'p-type' ] = iNtype;
    //
    //         return result;
    //     }
    //     // set
    //     static setParentOfObjForChildObj (iNelement, iNparentBlock) {
    //         let el_options = iNelement['options'];
    //
    //         if (
    //             typeof iNparentBlock === 'object' &&
    //             iNparentBlock
    //         ) {
    //             // merge element options && parent block data
    //             CONNECT.mergeObject(el_options, iNparentBlock);
    //             // return result
    //             return el_options;
    //         }
    //
    //         return null;
    //
    //     }
    //     //
    //     static getParentBlockFromElement (iNelement) {
    //         //@disct - get parent bloc from element
    //         let options = iNelement['options'],
    //             result  =  { 'type': options['p-type'] },
    //             pkeys = FreeformShared.getKeysForParenIdAndModelId (result['type']);
    //
    //         if ( !pkeys ) return null;
    //         result['id'] = options[ pkeys['id'] ];
    //         result['mid'] = options[ pkeys['mid'] ];
    //
    //         return result;
    //     }
    //
    //     static getKeysForParenIdAndModelId (iNtype) { //@private
    //          const  type    = iNtype;
    //          let    keyObjId,
    //                 keyModelId;
    //
    //         switch (type) {
    //             case "page":
    //                 keyObjId    = 'p-p-id';
    //                 keyModelId  = 'p-p-mid';
    //                 break;
    //             case "row":
    //                 keyObjId    = 'p-r-id';
    //                 keyModelId  = 'p-r-mid';
    //                 break;
    //             case "group":
    //                 keyObjId    = 'p-g-id';
    //                 keyModelId  = 'p-g-mid';
    //                 break;
    //             case "collection":
    //                 keyObjId    = 'p-c-id';
    //                 keyModelId  = 'p-c-mid';
    //             break;
    //         }
    //
    //         if ( keyObjId ) {
    //             return  {
    //                 'id'    : keyObjId,
    //                 'mid'   : keyModelId,
    //             }
    //         }
    //
    //         return null;
    //     }
    // //@> parent element block

    static async syncFormMap (iNuid, iNformModelId, iNformId, iNmap, iNfirestoreBatchGroup) {
        let map         = iNmap,
            update      = {},
            pathToDoc   = `freeform/${iNuid}/model/${iNformModelId}/form/${iNformId}`;

            update[`map`] = map;

        // add to db
        return FIREBASE.batchGroupUpdate (
            pathToDoc,
            update,
            iNfirestoreBatchGroup
        );
    }


    static safeGetInId (iNid, iNkey, iNnewInIdObject) {
        /*
          @discr
            get inid id from local memory or right new generated inid
         */

        // set for result default value
        let result = iNkey || CONNECT.getRandomKeyByUuid();

        if ( iNid ) {
            // if we have inid -> we set this inid (with check local copy block)

            if (!iNnewInIdObject) {
                // if dont need generate new inid
                result = iNid;
            } else {
                // if we must generate new inid -> check isset already new id in local memory
                if ( !iNnewInIdObject[iNid] ) {
                    // if we not have this inid in local memory -> we set default generate id
                    iNnewInIdObject[iNid] = result;
                } else {
                    // we have in local memory set result (delete default value for result)
                    result = iNnewInIdObject[iNid];
                }
            }
        }
        return result;
    }
}
module.exports.FreeformShared = FreeformShared;

class FreeformOptions {
    constructor () {
        
    }

    //@< options of model AND form object
    static convertModelOptionsToWorkFormat ( iNfreeformObject, iNfromModelOptions = false, iNform = false ) { //+
        const fname = 'convertModelOptionsToWorkFormat';
        let objectType, type;
        LOG.fstep(
            fname, 0,0, 'INVOKE - iNfreeformObject, iNfromModelOptions, iNform',
            iNfreeformObject, iNfromModelOptions, iNform
        );

        if ( !iNform && iNfreeformObject['options'] ) {
            // get object type if it is not form
            if(iNfreeformObject['options']['object']) objectType  = iNfreeformObject['options']['object'];
            if(iNfreeformObject['options']['type']) type        = iNfreeformObject['options']['type'];
        }

        // delete model options
        delete iNfreeformObject['options'];

        if (typeof iNfreeformObject !== 'object') return null;

        let optionsKey = (iNfromModelOptions) ? 'optionsForModel' : 'optionsForObject';

        let optionsForObject = { };

        if ( iNfreeformObject[optionsKey] ) {
            // if we have options add to it
            optionsForObject = CONNECT.deepCopyObject ( iNfreeformObject[optionsKey] );
        }

        delete iNfreeformObject[optionsKey];

        //add created time
        optionsForObject['createdTime'] = FIREBASE.getFirestoreSeverVarTimestamp();


        if ( !iNform ) {
            //
            if(type)optionsForObject['type']    = type;
            //
            if(objectType)optionsForObject['object']  = objectType;
        }

        if ( !iNform && typeof optionsForObject['preload'] !== 'number') {
            // it is not form
            optionsForObject['preload'] = 1;
        } else if (!iNform && typeof optionsForObject['preload'] !== 'boolean') {
            // it is form
            optionsForObject['preload'] = true;
        }



        if ( optionsForObject['activeTime'] ) {
            // conver model to work time formate
            optionsForObject['activeTime'] = FreeformOptions.createWorkFormatTimeFromModel(optionsForObject['activeTime']);
        }
        if ( optionsForObject['deadTime'] ) {
            // conver model to work time formate
            optionsForObject['deadTime'] = FreeformOptions.createWorkFormatTimeFromModel(optionsForObject['deadTime']);
        }
        if ( optionsForObject['redTime'] ) {
            // conver model to work time formate
            optionsForObject['redTime'] = FreeformOptions.createWorkFormatTimeFromModel(optionsForObject['redTime']);
        }
        if ( optionsForObject['deleteTime'] ) {
            // conver model to work time formate
            optionsForObject['deleteTime'] = FreeformOptions.createWorkFormatTimeFromModel(optionsForObject['deleteTime']);
        }
        // add active true if not
        if ( typeof optionsForObject['active'] !== 'boolean') {
            // conver model to work time formate
            optionsForObject['active'] = true;
        }

        iNfreeformObject['options'] = optionsForObject;
        return optionsForObject;
    }

    static createWorkFormatTimeFromModel (iNtime) {
        if (typeof iNtime === 'object') {
            let timeType = iNtime['type'],
                value = iNtime['value'];
            if (timeType === '-') {
                return new Date( new Date().getTime() - value );
            } else if (timeType === '+') {
                return new Date( new Date().getTime() + value );
            } else if (timeType === 'to') {
                return new Date(value);
            }
        }
        return null;
    }

    static getOptionsInForm (iNfreeformObject, iNforObject = false) { // -
        if (
            typeof iNfreeformObject === 'object' &&
            (
                (!iNforObject && typeof iNfreeformObject['options'] === 'object') ||
                (iNforObject && typeof iNfreeformObject['optionsForObject'] === 'object')
            ) // if we get options from model
        ) {
            if (iNforObject) {
                return iNfreeformObject['optionsForObject'];
            } else {
                return iNfreeformObject['options'];
            }
        }
        return null;
    }

    static getOptionsElementFromFreformObject (iNfreeformObject, iNoptionsName, iNforObject = false) { //-
        let options = FreeformOptions.getOptionsInForm(iNfreeformObject, iNforObject) || {}, //**LATER delete (required add options block for every freeform object)
            optName = iNoptionsName;
        if (
            typeof options[optName]
        ) {
            return options[optName];
        }
        return null;
    }
    static getAccessUidsList (iNfreeformObject, iNforObject = false) { //+
        let name = 'uids', // uidsWithFullAccess
            defaultValue = {},
            result = FreeformOptions.getOptionsElementFromFreformObject(iNfreeformObject, name, iNforObject = false ) || defaultValue;

        return result;
    }

    static getCustomState (iNfreeformObject, iNforObject = false) { // +
        let name = 'state', // uidsWithFullAccess
            defaultValue = 0,
            result = FreeformOptions.getOptionsElementFromFreformObject(iNfreeformObject, name, iNforObject = false ) || defaultValue;

        if (typeof result !== 'number'){
            result = defaultValue;
        }

        return result;
    }
    static getAccessListId (iNfreeformObject, iNforObject = false) { //+
        let name = 'accessListId',
            defaultValue = null,
            result = FreeformOptions.getOptionsElementFromFreformObject(iNfreeformObject, name,  false ) || defaultValue;

        return result;
    }

    static getFormStepper (iNfreeformObject, iNforObject = true) { //+
        let name = 'stepper',
            defaultValue = null,
            result = FreeformOptions.getOptionsElementFromFreformObject(iNfreeformObject, name, iNforObject ) || defaultValue;

        return result;
    }

    static getActiveTime (iNfreeformObject) { //+
        let name = 'activeTime',
            defaultValue = null,
            result = FreeformOptions.getOptionsElementFromFreformObject(iNfreeformObject, name ) || defaultValue;

        return result;
    }
    static checkActiveTime (iNfreeformObject) { //+
        let activeTime = FreeformOptions.getActiveTime(iNfreeformObject);
        if (activeTime && typeof activeTime.getTime === 'function') {
            return (activeTime.getTime()  <= new Date().getTime() );
        }
        return true;
    }
    static getExpiredTime (iNfreeformObject) { //+
        let name = 'expiredTime',
            defaultValue = null,
            result = FreeformOptions.getOptionsElementFromFreformObject(iNfreeformObject, name ) || defaultValue;

        return result;
    }
    static checkExpiredTime (iNfreeformObject) { //+
        let expiredTime = FreeformOptions.getExpiredTime(iNfreeformObject);
        if (expiredTime && typeof expiredTime.getTime === 'function') {
            return (expiredTime.getTime()  > new Date().getTime() );
        }
        return true;
    }

    static getRedTime (iNfreeformObject) { //+
        let name = 'redTime',
            defaultValue = null,
            result = FreeformOptions.getOptionsElementFromFreformObject(iNfreeformObject, name ) || defaultValue;

        return result;
    }

    static getDeadTime (iNfreeformObject) { //+
        let name = 'deadTime',
            defaultValue = null,
            result = FreeformOptions.getOptionsElementFromFreformObject(iNfreeformObject, name ) || defaultValue;

        return result;
    }
    static checkDeadTime (iNfreeformObject) { //+
        let deadTime = FreeformOptions.getDeadTime(iNfreeformObject);
        if (deadTime && typeof deadTime.getTime === 'function') {
            return (deadTime.getTime()  > new Date().getTime() );
        }
        return true;
    }

    static getActive (iNfreeformObject, iNoptionsForFieldFormModel = false) { //+

        let name            = 'active',
            defaultValue    = {}, // default - only for signed user
            active = FreeformOptions.getOptionsElementFromFreformObject(iNfreeformObject, name, iNoptionsForFieldFormModel );

        if (typeof active !== 'boolean') active = true;

        return active;
    }
    static getAccessType (iNfreeformObject, iNoptionsForFieldFormModel = false) { //+
        /*
        * accessType return value from sting enum
            * '@' - signed user
            * '?' - not signed user
            * '*' - any user
            * '@subsriber' - for only subscriber
            * '@contact' - for only subscriber
            * '@list' - for only access via access list
        * */
        let name            = 'accessType',
            defaultValue    = {'@': true}, // default - only for signed user
            result          = null,
            accessType = FreeformOptions.getOptionsElementFromFreformObject(iNfreeformObject, name, iNoptionsForFieldFormModel );

        if (typeof accessType === 'string' ) {
            result = {};
            result[accessType] = true;
        } else if (typeof accessType === 'object' && !Array.isArray(accessType) ) {
            result =  accessType;
        }
        return result || defaultValue;
    }

    // static getAccessType (iNfreeformObject, iNoptionsForFieldFormModel = false) { //+
    //     /*
    //     * accessType return value from sting enum
    //         * '@' - signed user
    //         * '?' - not signed user
    //         * '*' - any user
    //         * '@subsriber' - for only subscriber
    //         * '@contact' - for only subscriber
    //         * '@list' - for only access via access list
    //     * */
    //     let name            = 'accessType',
    //         defaultValue    = [{'@': true}], // default - only for signed user
    //         result          = null,
    //         accessType = FreeformOptions.getOptionsElementFromFreformObject(iNfreeformObject, name, iNoptionsForFieldFormModel );
    //
    //     if (typeof accessType === 'string' ) {
    //         result = {};
    //         result[accessType] = true;
    //         result = [result];
    //     } else if (typeof accessType === 'object' ) {
    //         if ( Array.isArray(accessType) ) {
    //             // if this array return
    //             result =  accessType;
    //         } else {
    //             // if this not array -> return in array
    //             result = [accessType];
    //         }
    //     }
    //     return result || defaultValue;
    // }


    //@< options of model ONLY
    static getAccessLists (iNfreeformObject, iNoptionsForFieldFormModel = false) { //+
        let name = 'accessLists',
            defaultValue = [],
            result = FreeformOptions.getOptionsElementFromFreformObject(iNfreeformObject, name , iNoptionsForFieldFormModel) || defaultValue;
        return result;
    }
    //@> options of model ONLY


    //@< options of form object ONLY
    static isSimpleForm (iNform, iNoptionsForFieldFormModel = false) { //+
        /* OPTIONS MODELS - SIMPLEFORM models
        *  not has seperate fields, not access list this fields -> copy only form
        *  only have common form object of this model with id - '@savable' -> check object for isset ()
        * */
        let name = 'simpleForm',
            result = FreeformOptions.getOptionsElementFromFreformObject(iNform, name, iNoptionsForFieldFormModel );

        return result;
    }

    static getPreloadStatus (iNform, iNoptionsForFieldFormModel = false) { //+
        let name = 'preload',
            result = FreeformOptions.getOptionsElementFromFreformObject(iNform, name, iNoptionsForFieldFormModel );

        return result;
    }

    static isSavableForm (iNform, iNoptionsForFieldFormModel = false)
    { //NONUSE WHILE ANYWHERE
        /* OPTIONS MODELS - SAVABLE models
        * savable forms can not sava value => create one form for all with id '@savable'
        *  if the model is savable - we pass this option to the object from model
        *  only have common form object of this model with id - '@savable' -> check object for isset + return this id if- create
        * */
        let name = 'savable',
            result = FreeformOptions.getOptionsElementFromFreformObject(iNform, name, iNoptionsForFieldFormModel );

        return result;
    }

    static getUseType (iNform, iNoptionsForFieldFormModel = false) { //+
        /* OPTIONS MODELS - useType 'individual' models
        *  individual model use this form only creator
        *  common model can use many users >0
        *  we not create access list
        * */
        /* OPTIONS MODELS - USETYPE of models
        *  may be 'individual' or 'common'
        *  form objects of individual model has only has creator
        *  if individual model we not nead copy access list
        *  if common model we need copy access list
        *  new we need only form with this fiedls without access list
        * */
        let name = 'useType',
            defaultValue = 'individual',
            result = FreeformOptions.getOptionsElementFromFreformObject(iNform, name, iNoptionsForFieldFormModel ) || defaultValue;

        return result;
    }
    //@> options of model ONLY
}