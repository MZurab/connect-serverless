const CONNECT   = require('../../../connect');
// const LOG       = require('ramman-z-log');
// const FIREBASE  = require("../../../firebase/firebase");
// const firestore = FIREBASE.firestore;

const FreeformShared        = require('./../FreeformShared').FreeformShared;// FreeformShared

class FreeformElementReference {
    //@< global variable
        static getGlobaObject (iNkey) {
            let key         = iNkey.replace('#',''),
                freeform    = global['freeform'],
                r           = null;
            if (
                freeform &&
                freeform['@element-reference'] &&
                freeform['@element-reference'][key]
            ) {
                r = freeform['@element-reference'][key];
            }
            // return r
            return r;
        }

        static setGlobaObject (iNkey, iNvar) {
            if ( !global['freeform'] ) { global['freeform'] = {}; }
            if ( !global['freeform']['@element-reference'] ) { global['freeform']['@element-reference'] = {}; }

            global['freeform']['@element-reference'][iNkey] = iNvar;
        }

    //@> global variable

    constructor() {

    }

    static splitStr (iNstr, iNseperator = '.') {
        return iNstr.split(iNseperator);
    }

    //@< ACTIONS
        static getPathAction (iNpath) {
            let r = FreeformElementReference.splitStr(iNpath, '::');
            if ( r.length > 1) {
                return r[ r.length - 1 ];
            }
            return null;
        }

        static runAction (iNpath, iNfreeformObject) {
            let action              = FreeformElementReference.getPathAction(iNpath),
                freeformObject      = iNfreeformObject;

            if(!action) return false;

            let actionName          = action.replace(/\([^\(\)]*\)/g, ''),
                dataFromBracket     = FreeformElementReference.getDataFromBracketOfString(action);

            switch (actionName) {
                case "save-position":
                    // get variableName
                    if(!dataFromBracket) return;

                    let varName = dataFromBracket.replace('#','');
                    // set variable
                    FreeformElementReference.setGlobaObject(varName, freeformObject['position'] );
                break;
            }
        }
    //@> ACTIONS


    //@< VAR NAME

    //@> VAR NAME

    static getLastElAfterSplit (iNstr, iNseperator) {
        let r = FreeformElementReference.splitStr(iNstr, iNseperator);
        return r[ r.length - 1 ];
    }
    static getSubValue (iNstr) {
        let r = FreeformElementReference.splitStr(iNstr, ':');
        if ( r.length > 1) {
            return r[ r.length - 1 ];
        }

        return null;
    }

    static getDataFromBracketOfString (iNstr) {
        let str     = iNstr,
            result  = str.match(/\([^\)\(]+\)/g);

        if ( result ) return result[0].replace(/[\(\)]+/g,'')

        return null;
    }

    static getNumberFromString (iNstr) {
        let str = iNstr,
            arr = str.match(/[0-9]+/);
        return (arr) ? parseInt(arr[0]) : null;
    }

    static getReferenceType (iNstr) {
        let str = iNstr;
        return (str[0] === '$') ? 'relative' : (str[0] === '&') ? 'absolute' : null;
    }

    static getPathType (iNstr) {
        let str = iNstr,
            v   = 'id';
        if ( str[0] === '$' ) {
            v = 'reference';
        } else if ( str[0] === '&' ) {
            // absolute refrence
            v = 'reference';
        } else if ( str[0] === '#' ) {
            //variable
            v = 'var';
        }

        return v;
    }

    //
    static getElementByPath ( iNfreeform, iNpath, iNpathArray = [], iNnowIndex = 0, iNseperator = '.') { //@root

        let path                = iNpath,
            freeform            = iNfreeform,
            seperator           = iNseperator,
            splitedPathArray    = path.split(seperator),
            value               = splitedPathArray[0],
            valueType           = FreeformElementReference.getPathType(value),
            pathArray           = iNpathArray,
            nowIndex            = iNnowIndex,
            offsetNumber        = FreeformElementReference.getNumberFromString(value),
            objWithLocalId,
            inid,
            freeformObject;

        console.log('getElementByPath 1 - valueType, value', valueType, value );

        if (
            valueType === 'reference'
        ) {
            let referenceType       = FreeformElementReference.getReferenceType(value);
            console.log('getElementByPath 1.1 - referenceType', referenceType, nowIndex, offsetNumber );
            //@< guard block
                if (
                    !(
                        nowIndex > 0 &&
                        offsetNumber > 0
                    )
                ) {
                   return null;
                }
            //@> guard block

            // this is relative patch && second access-> know absolute OR relative ->

            // if this id is local id with relative postion ref
            let localId = FreeformElementReference.getDataFromBracketOfString(value); // local id without prefix
            console.log('getElementByPath 1.2 - localId', localId );

            if ( referenceType === 'relative' ) {
                // if is relative patch ($) ->

                if ( pathArray[ pathArray.length -  offsetNumber ] ) {
                    // this is first element
                    objWithLocalId = pathArray[ pathArray.length -  offsetNumber ];
                }
            } else {
                // if is absolute patch (&) ->
                if (
                    pathArray[ offsetNumber - 1  ]
                ) {
                    objWithLocalId = pathArray[ offsetNumber - 1  ];
                }
            }
            console.log('getElementByPath 1.3 - objWithLocalId', objWithLocalId );
            console.log('getElementByPath 1.4 - objWithLocalId', pathArray.length, pathArray  );
            if (
                objWithLocalId &&
                objWithLocalId['body']['gen'] &&
                objWithLocalId['body']['gen']['lid'] &&
                objWithLocalId['body']['gen']['lid'][localId]
            ) {
                inid = objWithLocalId['body']['gen']['lid'][ localId ];
            } else {
                return null;
            }
        } else if (valueType === 'var') {
            console.log('getElementByPath 1.5 - valueType', valueType, value  );
            //it's variable get from global -> varibale
            if ( splitedPathArray.length > 1 ) {
                // it's NOT last return variable value -> change inid value to new
                inid = FreeformElementReference.getGlobaObject(value);
            } else {
                // it's last return variable value
                return FreeformElementReference.getGlobaObject(value);
            }
        }else if (valueType === 'id') {
            // it's id ->
            inid = value.replace(/\:.*/g, '');
        } else {
            return null;
        }

        // if this id is in id
        freeformObject = FreeformShared.getFreefomObjectByInId(freeform, inid );

        console.log('getElementByPath 3 - inid, freeformObject', inid, freeformObject );

        if(!freeformObject) {return null;}

        // run action -> and clear value from action
            console.log('getElementByPath 4 - value', value );
            FreeformElementReference.runAction(value, freeformObject);
            value = value.replace(/\:\:.+/g,'');
            console.log('getElementByPath 5 - value', value );


        // get sub value +-> do action
            let subValue = FreeformElementReference.getSubValue(value);
            console.log('getElementByPath 6 - subValue', subValue, splitedPathArray );

        if ( splitedPathArray.length > 1 ) {
            // it's not last element -> do recursive request
            if ( subValue ) {
                // we have sub value -> get inid from subpath -> get freeform object
                let pathFromSubValue = subValue.replace ( '>', '.');
                inid = CONNECT.getValueFromObjectByPath ( pathFromSubValue, freeformObject );
                if (!inid) return null;
                freeformObject = FreeformShared.getFreefomObjectByInId(freeform, inid );
                if(!freeformObject) return null;
            }
            // we have sub element -> add to array -> recursive request
                pathArray.push(freeformObject);
            // get new path
                let newPath = splitedPathArray.splice(1).join('.');
            // we have NOT sub value -> recursive request
                return FreeformElementReference.getElementByPath ( freeform, newPath, pathArray, nowIndex + 1);
        } else {
            // we have not sub element This is last element -> check sub value
                if ( subValue ) {
                    // we have sub value -> return subvalue of element
                        let pathFromSubValue = subValue.replace ( '>', '.');
                        console.log('getElementByPath 7.1 - subValue= ', subValue, pathFromSubValue , freeformObject);
                        return CONNECT.getValueFromObjectByPath ( pathFromSubValue, freeformObject );
                } else {
                    // we have NOT sub value -> return object
                    console.log('getElementByPath 7.2 - freeformObject', freeformObject );
                        return freeformObject;
                }
        }
    }



    //@< parent element block
        static getParentOfObjForChildObj (  iNobjId, iNmodelId, iNtype, iNgreatParent  = null) {
            // let result= {
            //     objid     : iNobjId,
            //     modelid   : iNmodelId,
            //     type      : iNtype,
            // };
            let greatParent = iNgreatParent,
                result = greatParent || {},
                parenntKeys;

            // get keys for add parent date
            parenntKeys = FreeformElementReference.getKeysForParenIdAndModelId (iNtype);

            if ( !parenntKeys ) {
                return null;
            }

            // add/replace model id
            result[ parenntKeys['mid'] ] = iNmodelId;
            // add/replace object id
            result[ parenntKeys['id'] ] = iNobjId;
            // add/replace parent type
            result[ 'p-type' ] = iNtype;

            return result;
        }
    // set
        static setParentOfObjForChildObj (iNelement, iNparentBlock) {
            let el_options = iNelement['options'];

            if (
                typeof iNparentBlock === 'object' &&
                iNparentBlock
            ) {
                // merge element options && parent block data
                CONNECT.mergeObject(el_options, iNparentBlock);
                // return result
                return el_options;
            }

            return null;

        }
    //
        static getParentBlockFromElement (iNelement) {
            //@disct - get parent bloc from element
            let options = iNelement['options'],
                result  =  { 'type': options['p-type'] },
                pkeys = FreeformElementReference.getKeysForParenIdAndModelId (result['type']);

            if ( !pkeys ) return null;
            result['id'] = options[ pkeys['id'] ];
            result['mid'] = options[ pkeys['mid'] ];

            return result;
        }

        static getKeysForParenIdAndModelId (iNtype) { //@private
            const  type    = iNtype;
            let    keyObjId,
                keyModelId;

            switch (type) {
                case "page":
                    keyObjId    = 'p-p-id';
                    keyModelId  = 'p-p-mid';
                    break;
                case "row":
                    keyObjId    = 'p-r-id';
                    keyModelId  = 'p-r-mid';
                    break;
                case "group":
                    keyObjId    = 'p-g-id';
                    keyModelId  = 'p-g-mid';
                    break;
                case "collection":
                    keyObjId    = 'p-c-id';
                    keyModelId  = 'p-c-mid';
                    break;
            }

            if ( keyObjId ) {
                return  {
                    'id'    : keyObjId,
                    'mid'   : keyModelId,
                }
            }

            return null;
        }


        getParentOfElement (iNtype, iNelement) {
            let el      = iNelement,
                type    = iNtype,
                options = el['options'],
                keys = FreeformElementReference.getKeysForParenIdAndModelId(type);

            return {
                'id'    : options[ keys['id'] ],
                'mid'   : options[ keys['mid'] ]
            }
        }

    //@> parent element block
}
module.exports['FreeformElementReference'] = FreeformElementReference;