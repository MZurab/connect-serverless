import _ from "lodash";


export class ElementReferenceLibrary {

    /*
    * @disc
    * @example getValueFromObjectByPath('a.b', {a: { b: '1' } }) -> return 1
    * @params iNpath string path to file
    * @params iNobject object
    * */
    public getValueFromObjectByPath ( iNpath: string, iNobject: any ): any {
        //@
        let obj                 = iNobject,
            splitedPathArray    = iNpath.split('.'),
            arrayName           = splitedPathArray[0],
            result;

        // we have not sub path -> get result
        result = obj[arrayName];

        if (result) {
            // if we have object -> check for subpath
            if ( splitedPathArray.length > 1 ) {
                // we have sub path -> did request
                let newPath = splitedPathArray.splice(1).join('.');

                if ( typeof result === 'object' ) {
                    // if we have subpath and have object  -> recursive object
                    let r =  this.getValueFromObjectByPath( newPath, result );
                    return r;
                } else {
                    // if we have subpath but have not object -> return null
                    return null;
                }

            } else {
                // if we have not subpath -> return result
                return result;
            }
        }

        // if we have not object
        return null;
    }

    /*
    * @disc
    * @params iNobject:*/
    public addValueToObjectByPath ( iNobject: any, iNpath: string, iNdata: any ) {
        const fname = 'addValueToObjectByPath';

        // LOG.fstep(fname, 0, 0, 'INVOKE - iNobject, iNpath, iNdata', iNobject, iNpath, iNdata );
        //@
        let obj                 = iNobject,
            data                = iNdata,
            splitedPathArray    = iNpath.split('.'),
            arrayName           = splitedPathArray[0],
            result;



        // we have not sub path -> get result
        if (splitedPathArray.length > 1) {
            let newPath = splitedPathArray.splice(1).join('.');

            if ( typeof obj[arrayName] !== 'object') {
                obj [ arrayName ] = {};
            }

            this.addValueToObjectByPath( obj[arrayName], newPath, data);
        } else {
            //if this last
            if ( typeof obj[arrayName] === 'object') {
                obj[arrayName] = _.merge(data, obj[arrayName] );//this.mergeObject( data, obj[arrayName] );
            } else {
                obj[arrayName] = data;
            }
        }
    }

    // public mergeObject (iNobject, iNobject2) {
    //     let arrOfKeys = Object.keys(iNobject2);
    //     for (let k of arrOfKeys) {
    //         //
    //         let el = iNobject2[k];
    //
    //         if ( typeof el === 'object' && !Array.isArray(el)) {
    //             // create object if not
    //             if ( typeof iNobject[k] !== 'object' ) iNobject[k] = {};
    //             // copy this object
    //             this.mergeObject(iNobject[k], el);
    //         } else {
    //             // set new val if in original object is not isset
    //             if ( typeof iNobject[k] === 'undefined' ) {
    //                 iNobject[k] = el;
    //             }
    //         }
    //     }
    //     return iNobject;
    // }

    public getElementByPath ( iNfreeform, iNpath, iNpathArray = [], iNnowIndex = 0, iNseperator = '.') { //@root

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
}