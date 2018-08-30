"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mz;
(function (mz) {
    function mergeObject(objectBase) {
        var objects = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            objects[_i - 1] = arguments[_i];
        }
        var objs = objects;
        for (var _a = 0, objs_1 = objs; _a < objs_1.length; _a++) {
            var obj = objs_1[_a];
            var arrOfKeys = Object.keys(obj);
            for (var _b = 0, arrOfKeys_1 = arrOfKeys; _b < arrOfKeys_1.length; _b++) {
                var k = arrOfKeys_1[_b];
                //
                var el = obj[k];
                if (typeof el === 'object' && !Array.isArray(el)) {
                    // create object if not
                    if (typeof objectBase[k] !== 'object')
                        objectBase[k] = {};
                    // copy this object
                    mergeObject(objectBase[k], el);
                }
                else {
                    // set new val if in original object is not isset
                    if (typeof objectBase[k] === 'undefined') {
                        objectBase[k] = el;
                    }
                }
            }
        }
        return objectBase;
    }
    mz.mergeObject = mergeObject;
    function addValueToObjectByPath(object, path, data) {
        var obj = object, splitedPathArray = path.split('.'), arrayName = splitedPathArray[0];
        // we have not sub path -> get result
        if (splitedPathArray.length > 1) {
            var newPath = splitedPathArray.splice(1).join('.');
            if (typeof obj[arrayName] !== 'object') {
                obj[arrayName] = {};
            }
            addValueToObjectByPath(obj[arrayName], newPath, data);
        }
        else {
            //if this last
            if (typeof obj[arrayName] === 'object') {
                obj[arrayName] = mergeObject(data, obj[arrayName]);
            }
            else {
                obj[arrayName] = data;
            }
        }
    }
    mz.addValueToObjectByPath = addValueToObjectByPath;
    function getValueFromObjectByPath(path, object) {
        //@
        var obj = object, splitedPathArray = path.split('.'), arrayName = splitedPathArray[0], result;
        // we have not sub path -> get result
        result = obj[arrayName];
        if (result) {
            // if we have object -> check for subpath
            if (splitedPathArray.length > 1) {
                // we have sub path -> did request
                var newPath = splitedPathArray.splice(1).join('.');
                if (typeof result === 'object') {
                    // if we have subpath and have object  -> recursive object
                    var r = getValueFromObjectByPath(newPath, result);
                    return r;
                }
                else {
                    // if we have subpath but have not object -> return null
                    return null;
                }
            }
            else {
                // if we have not subpath -> return result
                return result;
            }
        }
        // if we have not object
        return null;
    }
    mz.getValueFromObjectByPath = getValueFromObjectByPath;
})(mz = exports.mz || (exports.mz = {}));
