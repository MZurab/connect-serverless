import * as crypto from 'crypto';
// import * as http from 'http';
import * as _uuid_ from 'node-uuid';
import * as request from 'request';
import {Observable, Observer} from "rxjs";

export namespace Connect {

    var c1, c2, c3;

    export function getUrlHttpsRequest (url: string) {
        return Observable.create(
            (observer: Observer<{error: any, response: any, body: any}>) => {
                request (
                    url,
                    (error, response, body) => {
                        observer.next({error, response, body});
                        observer.complete();
                    }
                );
            }
        )
    }

    export function getRandomKeyByUuid (): string {
        return _uuid_.v4();
    }

    export function clearHtml (data: string): string {
        return data.replace(/[\t\n ]+/g,' ');
    }

    export function addVarsToPage (obj: any) {
        if (typeof(obj) != 'object') return '';
        let result = '';
        for(let iKey in obj) {
            result += "let " + iKey + " = '" +obj[iKey] + "';";
        }
        return result;
    }

    export function getTime () {
        return new Date().getTime();
    }

    // generate Random values from limited set of characters NEED CRYPTO var crypto = require('crypto');
    export function getRandomKeyWithChars (amountChars: number, chars?: string) {

        chars = chars
            || "abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789";
        let rnd = crypto.randomBytes(amountChars)
            , value = new Array(amountChars)
            , len = chars.length;

        for (var i = 0; i < amountChars; i++) {
            value[i] = chars[rnd[i] % len]
        }

        return value.join('');
    }

    export function getRandomNubmer (amountChars?: number) {
        if(typeof(amountChars) !== 'number') amountChars =5;
        return getRandomKeyWithChars(amountChars,"0123456789");
    }

    const _algorithm_ = 'aes-256-ctr', _password_ = 'd6F3Efeq';
    export function encryptByAes(text: string): string {
        let cipher = crypto.createCipher(_algorithm_,_password_),
            crypted = cipher.update(text,'utf8','hex');

        crypted += cipher.final('hex');
        return crypted;
    }

    export function decryptByAes(text: string): string {
        let decipher = crypto.createDecipher(_algorithm_,_password_),
            dec = decipher.update(text,'hex','utf8');

        dec += decipher.final('utf8');

        return dec;
    }


    export function createHashMd5 (text: string): string {
        // NodeJS create md5 hash from string
        // https://gist.github.com/kitek/1579117/8cd97e0d85c3fca35036d4f76dd6f32d8ffe1e46
        return crypto.createHash('md5').update(text).digest("hex");
    }

    var headerFromJs;
    export function setHeader (iNheaderFromJs) {
        headerFromJs = iNheaderFromJs;
    }


    export function getHeaderByKey (iNkey: string, iNheaderFromJs?: any): any {
        let headerFromJsIn;
        if( typeof(iNheaderFromJs) === 'object' )
            headerFromJsIn = iNheaderFromJs;
        else
            headerFromJsIn = headerFromJs;

        return headerFromJsIn['params']["header"][iNkey];
    }

    export function getDataFromBasicAuthFromHeader (): any {
        let headerAuthorization =  getHeaderByKey('Authorization');
        if(typeof headerAuthorization  === 'string' ) {
            //delete substing
            let base64EncodeString = headerAuthorization.replace('Basic ',''),
            //decode this string
             decodedString = base64_decode(base64EncodeString),
            // split this text
             arrayWithLoginAndPswd = decodedString.split(':');

            if(arrayWithLoginAndPswd.length == 2) {
                return {
                    'login':arrayWithLoginAndPswd[0],
                    'password':arrayWithLoginAndPswd[1]
                }
            }
        }
        return false;
    }

    export function getBody (iNheaderFromJs?: any): any {
        let data = getHeader(['*'], iNheaderFromJs);
        return data && data['data']
    }

    export function getHeader (iNheaderArray: any[],iNheaderFromJs?: any): any {
        let headerFromJsIn;

        headerFromJsIn = (typeof iNheaderFromJs  == 'object') ? iNheaderFromJs : headerFromJs;

        if ( typeof iNheaderArray  !== 'object'  || Array.isArray(iNheaderArray) == false ) iNheaderArray['*'];
        let DATA={},TYPE,METHOD = getMethod();

        if( METHOD == 'GET' && (iNheaderArray.indexOf('*') != -1 || iNheaderArray.indexOf('GET') != -1 )) {
            TYPE  = "GET",
            DATA  = headerFromJsIn['params']["querystring"];
        } else if ( iNheaderArray.indexOf('*') != -1 || iNheaderArray.indexOf('JSON') != -1 ) {
            TYPE  = "JSON",
            DATA  = headerFromJsIn["body-json"];
        }
        return {'data':DATA,'type':TYPE,'header':headerFromJsIn['params']["header"]};
    }

    export function getQueryString (iNheaderFromJs?: any): any {
        let headerFromJsIn, r;
        if( typeof(iNheaderFromJs) == 'object' )
            headerFromJsIn = iNheaderFromJs;
        else
            headerFromJsIn = headerFromJs;

        try {
            r   = headerFromJsIn['params']["querystring"];

        } catch (e) {
            r = false;
        }

        return r
    }

    export function getUrlParam (iNname: string,iNheaderFromJs: any): any {
        let PATH    = getUrlParams(iNheaderFromJs);
        if(typeof(PATH[iNname]) != 'undefined')return PATH[iNname];
        return null;
    }

    export function getUrlParams (iNheaderFromJs: any): any {
        if( typeof(iNheaderFromJs) === 'object' )
            var headerFromJsIn = iNheaderFromJs;
        else
            headerFromJsIn = headerFromJs;

        return headerFromJsIn['params']['path'];
    }

    export function getIp (iNheaderFromJs?: any): string {
        return getFromContext('source-ip',iNheaderFromJs);
    }

    export function getUrl (iNheaderFromJs: any): any {
        return getFromContext('resource-path',iNheaderFromJs);
    }

    export function getUserAgent (iNheaderFromJs: any): any {
        return getFromContext('user-agent',iNheaderFromJs);
    }

    export function getMethod (iNheaderFromJs?: any): any {
        return getFromContext('http-method',iNheaderFromJs);
    }

    export function getFromContext (iNname: string, iNheaderFromJs?: any): any {
        if( typeof(iNheaderFromJs) === 'object' )
            var headerFromJsIn = iNheaderFromJs;
        else
            headerFromJsIn = headerFromJs;
        var r;
        try {
            r = headerFromJsIn['context'][iNname];

        } catch (e) {
            r = {};
        } finally {
            return r;
        }
    }

    // Create Base64 Object
    var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9+/=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/rn/g,"n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}}
    export function base64_encode ( text: string ): string {
        return Base64.encode(text);
    }

    export function base64_decode ( text: string ): string {
        return Base64.decode (text);
    }

    export function mergeObject (iNobject: any, iNobject2: any) {
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

    export function saveUid (iNuid: string): void {
        let uid = iNuid;
        if ( !global['freeform'] ) global['freeform'] = {};
        global['freeform']['uid'] = uid;
    }

    export function getUid (): any {
        if ( !global['freeform'] ) return false;
        if ( !global['freeform']['uid'] ) return false;
        return global['freeform']['uid'];
    }

    export function convertArrayToObject(arr: any[]): any {
        var rv = {};
        for (var i = 0; i < arr.length; ++i)
            if (arr[i] !== undefined) rv[i] = arr[i];
        return rv;
    }

    export function sendSms (smsText: string, phone: string, account?: string, translit?: number): Observable<{err: any, response: any}> {
        // default non translit
        if(typeof translit != 'number' || translit != 1) translit =0;

        // get header
        let header, userId;
        //CHANGE add load from dynamoDb
        switch (account) {
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
        };

        let options = {
            method: 'POST',
            url: 'https://ramman.net/api/service/sms/v1/send/' + userId + '/auto',
            headers:
                { authorization: 'Basic ' + header,'content-type': 'application/json' },
            body:
                { to: { phone: phone },
                    content: smsText,
                    translit: translit },
            json: true
        };

        return Observable.create(
            (observer: Observer<{err: any, response: any}>) => {
                request(options, function (err, response, body) {
                    observer.next({err, response});
                    observer.complete();
                });
            }
        )

    }

    export function getEmptyObservable (result: any = null): Observable<any> {
        return Observable.create(
            (observer: Observer<null>) => {
                observer.next(result);
                observer.complete();
            }
        );
    }
}