import * as crypto from 'crypto'
import * as http from 'http'
import * as request from 'request'
import * as _uuid_ from 'node-uuid'
import * as LOG from 'ramman-z-log'

export function getUrlRequest(url: string): void {
    LOG.printObject('start request to ' + url);

    http.get(
        url,
        (res) => {
            LOG.printObject("Got response: " + res.statusCode);

        }
    ).on(
        'error',
        (e) => {
            LOG.printObject("Got error: " + e.message);
        }
    );

}

export function getUrlHttpsRequest(url,success): void {
    LOG.printObject('start request to ' + url);

    request (
        url,
        (error, response, body) => {
            if (!error ) { //&& response.statusCode == 200
                LOG.printObject('getUrlHttpsRequest error, response, body',error, response, body);
                success(body);
            }
        }
    );

}

export function getRandomKeyByUuid (): string {
    return _uuid_.v4();// e.g. 32a4fbed-676d-47f9-a321-cb2f267e2918
}

export function clearHtml (iNdata: string): string {
    return iNdata.replace(/[\t\n ]+/g,' ');
}


export function addVarsToPage (iNobject: any): string {
    if(typeof(iNobject) != 'object') return '';

    let result = '';
    for(let iKey in iNobject) {
        result += "let " + iKey + " = '" +iNobject[iKey] + "';";
    }
    return result;
}

export function convertArrayToObject(arr: any): any {
    let rv = {};
    for (let i = 0; i < arr.length; ++i)
        if (arr[i] !== undefined) rv[i] = arr[i];
    return rv;
}

// export function concat_json (json1: any, json2: any): any {
//     /*
//       @discr
//         merge json objects
//     */
//     let out = {};
//     for(let k1 in json1){
//         if (json1.hasOwnProperty(k1)) out[k1] = json1[k1];
//     }
//     for(let k2 in json2){
//         if (json2.hasOwnProperty(k2)) {
//             if(!out.hasOwnProperty(k2)) out[k2] = json2[k2];
//             else if(
//                 (typeof out[k2] === 'object') && (out[k2].constructor === Object) &&
//                 (typeof json2[k2] === 'object') && (json2[k2].constructor === Object)
//             ) out[k2] = json_merge_recursive(out[k2], json2[k2]);
//         }
//     }
//     return out;
// }

export function getTime (): number {
    return new Date().getTime();
}

// generate Random values from limited set of characters NEED CRYPTO var crypto = require('crypto');
export function getRandomKeyWithChars (howMany: number, chars: string): string {

    chars = chars
        || "abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789";
    let rnd = crypto.randomBytes(howMany)
        , value = new Array(howMany)
        , len = chars.length;

    for (let i = 0; i < howMany; i++) {
        value[i] = chars[rnd[i] % len]
    };

    return value.join('');
}

export function getRandomNubmer (iNhowMany): string {
    if(typeof(iNhowMany) != 'number') iNhowMany =5;
    return getRandomKeyWithChars(iNhowMany,"0123456789");
}


let _algorithm_ = 'aes-256-ctr', _password_ = 'd6F3Efeq';
export function encryptByAes( text: string ): string{
    let cipher = crypto.createCipher(_algorithm_,_password_),
        crypted = cipher.update(text,'utf8','hex');

    crypted += cipher.final('hex');

    return crypted;
}

export function decryptByAes(text: string): string{
    let decipher = crypto.createDecipher(_algorithm_,_password_),
        dec = decipher.update(text,'hex','utf8');

    dec += decipher.final('utf8');

    return dec;
}


export function createHashMd5 (iNdata: string): string {
    // NodeJS create md5 hash from string
    // https://gist.github.com/kitek/1579117/8cd97e0d85c3fca35036d4f76dd6f32d8ffe1e46
    return crypto.createHash('md5').update(iNdata).digest("hex");
}

export function sendSms (smsText: string, phone: string, iNaccount: string, iNtranslit: number) {

    // default non translit
    if (typeof iNtranslit != 'number' || iNtranslit != 1)
        iNtranslit =0;


    // get header
    let header, userId;
    //CHANGE add load from dynamoDb
    switch (iNaccount) {
        case 'sign':
            //user -> sign
            userId = 'a4985557-f610-4e94-be47-f614423c0267';
            //dynamo base -> login:pswd for uid
            header = base64_encode("1626q05234fd64x4e718dr:dfarb4");
            break;

        default:
            //user -> ramman
            userId = '4f488a43-b5fd-452d-8e81-66da96156ab8';
            //dynamo base -> login:pswd for uid
            header = base64_encode("2626q05234fd64x4e718dq:asdfh43");
            break;
    }
    let options = {
        method: 'POST',
        url: 'https://ramman.net/api/service/sms/v1/send/' + userId + '/auto',
        headers:
            { authorization: 'Basic ' + header,'content-type': 'application/json' },
        body:
            { to: { phone: phone },
                content: smsText,
                translit: iNtranslit },
        json: true
    };
    request (
        options,
        (error, response, body) =>  {
            if (error) throw new Error(error);

            console.log(body);
        }
    );

}


let headerFromJs;
export function setHeader (iNheaderFromJs) {
    headerFromJs = iNheaderFromJs;
}


export function getHeaderByKey (iNkey, iNheaderFromJs?: any) {
    let headerFromJsIn;

    if( typeof(iNheaderFromJs) == 'object' )
        headerFromJsIn = iNheaderFromJs;
    else
        headerFromJsIn = headerFromJs;

    return headerFromJsIn['params']["header"][iNkey];

}

export function getDataFromBasicAuthFromHeader (): boolean | any {
    var headerAuthorization =  getHeaderByKey('Authorization');
    if(typeof(headerAuthorization) == 'string' ) {
        //delete substing
        var base64EncodeString = headerAuthorization.replace('Basic ','');
        //decode this string
        var decodedString = base64_decode(base64EncodeString);
        // split this text
        var arrayWithLoginAndPswd = decodedString.split(':');
        if(arrayWithLoginAndPswd.length == 2) {
            return {
                'login':arrayWithLoginAndPswd[0],
                'password':arrayWithLoginAndPswd[1]
            }
        }
    }
    return false;
}

export function getHeader (iNheaderArray: any, iNheaderFromJs?: any): any {
    let headerFromJsIn;

    if( typeof(iNheaderFromJs) == 'object' )
        headerFromJsIn = iNheaderFromJs;
    else
        headerFromJsIn = headerFromJs;

    if ( typeof(iNheaderArray) != 'object'  || Array.isArray(iNheaderArray) == false ) iNheaderArray['*'];
    let DATA={},TYPE,METHOD = getMethod(headerFromJsIn);
    if(
        METHOD == 'GET' &&
        (iNheaderArray.indexOf('*') != -1 || iNheaderArray.indexOf('GET') != -1 )
    ) {
        TYPE  = "GET",
        DATA   = headerFromJsIn['params']["querystring"];
    } else if ( iNheaderArray.indexOf('*') != -1 || iNheaderArray.indexOf('JSON') != -1 ) {
        TYPE  = "JSON",
        DATA  = headerFromJsIn["body-json"];
    }

    return {'data':DATA,'type':TYPE,'header':headerFromJsIn['params']["header"]};
}

export function getQueryString (iNheaderFromJs: any): boolean | any {
    let headerFromJsIn, r;

    if( typeof(iNheaderFromJs) == 'object' )
        headerFromJsIn = iNheaderFromJs;
    else
        headerFromJsIn = headerFromJs;

    try {
        r   = headerFromJsIn['params']["querystring"];

    } catch (e) {
        LOG.printObject('connect.js -f getQueryString ERROR r',e);
        r = false;
    }

    return r;
}

export function getUrlParam (iNname: string, iNheaderFromJs?: any) {
    var PATH    = getUrlParams(iNheaderFromJs);
    if(typeof(PATH[iNname]) != 'undefined')return PATH[iNname];
    return null;
}

export function getUrlParams (iNheaderFromJs?: string) {
    let headerFromJsIn;

    if( typeof(iNheaderFromJs) == 'object' )
        headerFromJsIn = iNheaderFromJs;
    else
        headerFromJsIn = headerFromJs;

    return headerFromJsIn['params']['path'];
}

export function getIp (iNheaderFromJs?: any): string {
    let headerFromJsIn;

    if( typeof(iNheaderFromJs) == 'object' )
        headerFromJsIn = iNheaderFromJs;
    else
        headerFromJsIn = headerFromJs;

    return getFromContext('source-ip', headerFromJsIn);
}

export function getUrl (iNheaderFromJs?: string) {
    let headerFromJsIn;

    if( typeof(iNheaderFromJs) == 'object' )
        headerFromJsIn = iNheaderFromJs;
    else
        headerFromJsIn = headerFromJs;

    return getFromContext('resource-path',headerFromJsIn);
}

export function getUserAgent (iNheaderFromJs?: any) {
    let headerFromJsIn;

    if( typeof(iNheaderFromJs) == 'object' )
        headerFromJsIn = iNheaderFromJs;
    else
        headerFromJsIn = headerFromJs;

    return getFromContext('user-agent', headerFromJsIn);
}

export function getMethod (iNheaderFromJs?: any) {
    let headerFromJsIn;

    if( typeof(iNheaderFromJs) == 'object' )
        headerFromJsIn = iNheaderFromJs;
    else
        headerFromJsIn = headerFromJs;

    return getFromContext('http-method',headerFromJsIn);
}


export function getFromContext (iNname: string, iNheaderFromJs?: any) {
    let headerFromJsIn, r;

    if( typeof(iNheaderFromJs) == 'object' )
        headerFromJsIn = iNheaderFromJs;
    else
        headerFromJsIn = headerFromJs;

    try {
        r = headerFromJsIn['context'][iNname];
    } catch (e) {
        r = {};
    }

    return r;
}






// Create Base64 Object
let Base64={
    _keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    encode: function(e){
        let t="";
        let n,r,i,s,o,u,a;
        let f=0;
        e=Base64._utf8_encode(e);
        while(f<e.length){
            n=e.charCodeAt(f++);
            r=e.charCodeAt(f++);
            i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;
            if(isNaN(r)){
                u=a=64
            } else if(isNaN(i)){
                a=64
            }
            t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},
    decode: function(e){
        let t="";let n,r,i;let s,o,u,a;let f=0;e=e.replace(/[^A-Za-z0-9+/=]/g,"");
        while(f<e.length){
            s=this._keyStr.indexOf(e.charAt(f++));
            o=this._keyStr.indexOf(e.charAt(f++));
            u=this._keyStr.indexOf(e.charAt(f++));
            a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);
            if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}
        }
            t=Base64._utf8_decode(t);
        return t
    },
    _utf8_encode: function(e){
        e=e.replace(/rn/g,"n");
        let t="";
        for(let n=0;n<e.length;n++){
            let r=e.charCodeAt(n);
            if(r<128){
                t+=String.fromCharCode(r)
            }else if(r>127&&r<2048){
                t+=String.fromCharCode(r>>6|192);
                t+=String.fromCharCode(r&63|128)
            }else{
                t+=String.fromCharCode(r>>12|224);
                t+=String.fromCharCode(r>>6&63|128);
                t+=String.fromCharCode(r&63|128)
            }
        }
        return t
    },
    _utf8_decode: function(e){
        let t="";
        let n=0,c1,c2,r,c3;

        r=c1=c2=0;

        while(n<e.length){
            r=e.charCodeAt(n);
            if(r<128){
                t+=String.fromCharCode(r);
                n++
            }else if(r>191&&r<224){
                c2=e.charCodeAt(n+1);
                t+=String.fromCharCode((r&31)<<6|c2&63);n+=2
            }else{
                c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3
            }
        }return t
        }
    };

export function base64_encode ( data: string ): string {
    return Base64.encode(data);
}

export function base64_decode ( data: string ): string {
    return Base64.decode (data);
}
export function mergeObject (iNobject: any, iNobject2: any): any {
    let arrOfKeys = Object.keys(iNobject2);
    for (let k of arrOfKeys) {
        //
        let el = iNobject2[k];

        if ( typeof el === 'object' && !Array.isArray(el)) {
            // create object if not
            if ( typeof iNobject[k] !== 'object' ) iNobject[k] = {};
            // copy this object
            mergeObject(iNobject[k], el);
        } else {
            // set new val if in original object is not isset
            if ( typeof iNobject[k] === 'undefined' ) {
                iNobject[k] = el;
            }
        }
    }
    return iNobject;
}

export function deepCopyObject(object: any) {
    let node;
    if (object === null) {
        node = object;
    }
    else if (Array.isArray(object)) {
        node = object.slice(0) || [];
        node.forEach(n => {
            if (typeof n === 'object' && n !== {} || Array.isArray(n)) {
                n = deepCopyObject(n);
            }
        });
    }
    else if (typeof object === 'object') {
        node = Object.assign({}, object);
        Object.keys(node).forEach(key => {
            if (typeof node[key] === 'object' && node[key] !== {}) {
                node[key] = deepCopyObject(node[key]);
            }
        });
    }
    else {
        node = object;
    }
    return node;
}

export function returnPromiseWithValue (iNvalue: any): Promise<any> {
    return new Promise(
        (resolve) => {
            resolve(iNvalue)
        }
    )
}

export function addValueToObjectByPath ( iNobject: any, iNpath: string, iNdata: any ): void {
    const fname = 'addValueToObjectByPath';

    LOG.fstep(fname, 0, 0, 'INVOKE - iNobject, iNpath, iNdata', iNobject, iNpath, iNdata );
    //@
    let obj                 = iNobject,
        data                = iNdata,
        splitedPathArray    = iNpath.split('.'),
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

export function getValueFromObjectByPath ( iNpath: string, iNobject: any ) {
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


export function saveUid (iNuid: string): void {
    let uid = iNuid;
    if ( !global['freeform'] ) global['freeform'] = {};
    global['freeform']['uid'] = uid;
}

export function getUid (): string | boolean {
    if ( !global['freeform'] ) return false;
    if ( !global['freeform']['uid'] ) return false;
    return global['freeform']['uid'];
}