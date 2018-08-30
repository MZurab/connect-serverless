export namespace mz {
    export function mergeObject (objectBase: any, ...objects: any[]): any
    {
        let objs = objects;

        for ( let obj of objs ) {
            let arrOfKeys = Object.keys(obj);
            for (let k of arrOfKeys) {
                //
                let el = obj[k];

                if ( typeof el === 'object' && !Array.isArray(el)) {
                    // create object if not
                    if ( typeof objectBase[k] !== 'object' ) objectBase[k] = {};
                    // copy this object
                    mergeObject(objectBase[k], el);
                } else {
                    // set new val if in original object is not isset
                    if ( typeof objectBase[k] === 'undefined' ) {
                        objectBase[k] = el;
                    }
                }
            }

        }

        return objectBase;
    }

    export function addValueToObjectByPath (object: any, path: any, data: any ): void
    {
        let obj                 = object,
            splitedPathArray    = path.split('.'),
            arrayName           = splitedPathArray[0];

        // we have not sub path -> get result
        if (splitedPathArray.length > 1) {
            let newPath = splitedPathArray.splice(1).join('.');

            if ( typeof obj[arrayName] !== 'object') {
                obj [ arrayName ] = {};
            }

            addValueToObjectByPath( obj[arrayName], newPath, data);
        } else {
            //if this last
            if ( typeof obj[arrayName] === 'object') {
                obj[arrayName] = mergeObject( data, obj[arrayName] );
            } else {
                obj[arrayName] = data;
            }
        }
    }

    export function getValueFromObjectByPath (path: string, object: any ): any
    {
        //@
        let obj                 = object,
            splitedPathArray    = path.split('.'),
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
                    let r =  getValueFromObjectByPath( newPath, result );
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
}