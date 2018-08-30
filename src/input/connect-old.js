const crypto  = require('crypto');
const http    = require('http');
const _uuid_  = require('node-uuid');
// var https = require('https');
const request = require('request');
const LOG     = require('ramman-z-log');

function GetUrlRequest(url) {
    LOG.printObject('start request to ' + url)
    http.get(url, function(res) {
        LOG.printObject("Got response: " + res.statusCode);

    }).on('error', function(e) {
        LOG.printObject("Got error: " + e.message);
    });

}
module.exports.getUrlRequest = GetUrlRequest;

function getUrlHttpsRequest(url,success) {
    LOG.printObject('start request to ' + url)
    // https.get(url, function(res) {
    //     LOG.printObject("Got response: " + res.statusCode);
    //
    // }).on('error', function(e) {
    //     LOG.printObject("Got error: " + e.message);
    // });

    request(url, function (error, response, body) {
      if (!error ) { //&& response.statusCode == 200
        LOG.printObject('getUrlHttpsRequest error, response, body',error, response, body);
        success(body);
      }
    });

}
module.exports.getUrlHttpsRequest = getUrlHttpsRequest;

function getRandomKeyByUuid () {
    return _uuid_.v4();// e.g. 32a4fbed-676d-47f9-a321-cb2f267e2918
}
module.exports.getRandomKeyByUuid = getRandomKeyByUuid;

function clearHtml (iNdata) {
  return iNdata.replace(/[\t\n ]+/g,' ');
}
module.exports.clearHtml = clearHtml;


function addVarsToPage (iNobject) {
	if(typeof(iNobject) != 'object')return '';
  var result = '';
  for(var iKey in iNobject) {
  	result += "let " + iKey + " = '" +iNobject[iKey] + "';";
  }
  return result;
}
module.exports.addVarsToPage = addVarsToPage;

function convertArrayToObject(arr) {
  var rv = {};
  for (var i = 0; i < arr.length; ++i)
    if (arr[i] !== undefined) rv[i] = arr[i];
  return rv;
}
module.exports.convertArrayToObject = convertArrayToObject;

function concat_json (json1, json2) {
    /*
      @discr
        merge json objects
    */
    var out = {};
    for(var k1 in json1){
        if (json1.hasOwnProperty(k1)) out[k1] = json1[k1];
    }
    for(var k2 in json2){
        if (json2.hasOwnProperty(k2)) {
            if(!out.hasOwnProperty(k2)) out[k2] = json2[k2];
            else if(
                (typeof out[k2] === 'object') && (out[k2].constructor === Object) &&
                (typeof json2[k2] === 'object') && (json2[k2].constructor === Object)
            ) out[k2] = json_merge_recursive(out[k2], json2[k2]);
        }
    }
    return out;
}
module.exports.concat_json = concat_json;

function getTime () {
  return new Date().getTime();
}
module.exports.getTime = getTime;

// generate Random values from limited set of characters NEED CRYPTO var crypto = require('crypto');
function getRandomKeyWithChars (howMany, chars) {

    chars = chars
        || "abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789";
    var rnd = crypto.randomBytes(howMany)
        , value = new Array(howMany)
        , len = chars.length;

    for (var i = 0; i < howMany; i++) {
        value[i] = chars[rnd[i] % len]
    };

    return value.join('');
}
module.exports.getRandomKeyWithChars = getRandomKeyWithChars;

function getRandomNubmer (iNhowMany) {
  if(typeof(iNhowMany) != 'number') iNhowMany =5;
  return getRandomKeyWithChars(iNhowMany,"0123456789");
}
module.exports.getRandomNubmer = getRandomNubmer;


var _algorithm_ = 'aes-256-ctr', _password_ = 'd6F3Efeq';
function encryptByAes(text){
    var cipher = crypto.createCipher(_algorithm_,_password_)
    var crypted = cipher.update(text,'utf8','hex')
    crypted += cipher.final('hex');
    return crypted;
}
module.exports.encryptByAes = encryptByAes;

function decryptByAes(text){
    var decipher = crypto.createDecipher(_algorithm_,_password_)
    var dec = decipher.update(text,'hex','utf8')
    dec += decipher.final('utf8');
    return dec;
}
module.exports.decryptByAes = decryptByAes;


function createHashMd5 (iNdata) {
    // NodeJS create md5 hash from string
    // https://gist.github.com/kitek/1579117/8cd97e0d85c3fca35036d4f76dd6f32d8ffe1e46
    return crypto.createHash('md5').update(iNdata).digest("hex");
}
module.exports.createHashMd5 = createHashMd5;

function sendSms (smsText,phone,iNaccount, iNtranslit) {
    // if ( typeof(iNsender) != 'string' ) iNsender = 'RVerify';
    // var smsText = encodeURIComponent ( smsText );
    // var urlSms  = "http://bsms.tele2.ru/api/?operation=send&login=ht887624043&password=rrDwQqsN&msisdn="+phone+ "&shortcode="+iNsender+"&text="+smsText;
    // GetUrlRequest(urlSms);

    // default non translit
    if(typeof iNtranslit != 'number' || iNtranslit != 1)
      iNtranslit =0;


    // get header
    var header, userId;
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
    var request = require("request");
    var options = { method: 'POST',
          url: 'https://ramman.net/api/service/sms/v1/send/' + userId + '/auto',
          headers:
           { authorization: 'Basic ' + header,'content-type': 'application/json' },
          body:
           { to: { phone: phone },
             content: smsText,
             translit: iNtranslit },
          json: true
    };
    request(options, function (error, response, body) {
      if (error) throw new Error(error);

      console.log(body);
    });

}
module.exports.sendSms = sendSms;



var headerFromJs;
function setHeader (iNheaderFromJs) {
  headerFromJs = iNheaderFromJs;
}
module.exports.setHeader = setHeader;


function getHeaderByKey (iNkey, iNheaderFromJs) {
  if( typeof(iNheaderFromJs) == 'object' )
    var headerFromJsIn = iNheaderFromJs;
  else
    var headerFromJsIn = headerFromJs;

  return headerFromJsIn['params']["header"][iNkey];

}
module.exports.getHeaderByKey = getHeaderByKey;

function getDataFromBasicAuthFromHeader () {
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
module.exports.getDataFromBasicAuthFromHeader = getDataFromBasicAuthFromHeader;

function getHeader (iNheaderArray,iNheaderFromJs) {
  if( typeof(iNheaderFromJs) == 'object' )
    var headerFromJsIn = iNheaderFromJs;
  else
    var headerFromJsIn = headerFromJs;

  if ( typeof(iNheaderArray) != 'object'  || Array.isArray(iNheaderArray) == false ) iNheaderArray['*'];
      var DATA={},TYPE,METHOD = getMethod();
      if( METHOD == 'GET' && (iNheaderArray.indexOf('*') != -1 || iNheaderArray.indexOf('GET') != -1 )) {
        TYPE  = "GET",
        DATA   = headerFromJsIn['params']["querystring"];
      } else if ( iNheaderArray.indexOf('*') != -1 || iNheaderArray.indexOf('JSON') != -1 ) {
        TYPE  = "JSON",
        DATA  = headerFromJsIn["body-json"];
      }
      return {'data':DATA,'type':TYPE,'header':headerFromJsIn['params']["header"]};
}
module.exports.getHeader = getHeader;

function getQueryString (iNheaderFromJs) {
  if( typeof(iNheaderFromJs) == 'object' )
    var headerFromJsIn = iNheaderFromJs;
  else
    var headerFromJsIn = headerFromJs;

    try {
      var r   = headerFromJsIn['params']["querystring"];

    } catch (e) {
      LOG.printObject('connect.js -f getQueryString ERROR r',e);
      var r = false;
    }
    return r
}
module.exports.getQueryString = getQueryString;

function getUrlParam (iNname,iNheaderFromJs) {
  var PATH    = getUrlParams(iNname,iNheaderFromJs);
  if(typeof(PATH[iNname]) != 'undefined')return PATH[iNname];
  return null;
}
module.exports.getUrlParam = getUrlParam;

function getUrlParams (iNheaderFromJs) {
  if( typeof(iNheaderFromJs) == 'object' )
    var headerFromJsIn = iNheaderFromJs;
  else
    headerFromJsIn = headerFromJs;

  return headerFromJsIn['params']['path'];
}
module.exports.getUrlParams = getUrlParams;

function getIp (iNheaderFromJs) {
  return getFromContext('source-ip',iNheaderFromJs);
}
module.exports.getIp = getIp;

function getUrl (iNheaderFromJs) {
  return getFromContext('resource-path',iNheaderFromJs);
}
module.exports.getUrl = getUrl;

function getUserAgent (iNheaderFromJs) {
  return getFromContext('user-agent',iNheaderFromJs);
}
module.exports.getUserAgent = getUserAgent;

function getMethod (iNheaderFromJs) {
  return getFromContext('http-method',iNheaderFromJs);
}
module.exports.getMethod = getMethod;


function getFromContext (iNname,iNheaderFromJs) {
  if( typeof(iNheaderFromJs) == 'object' )
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
module.exports.getFromContext = getFromContext;






// Create Base64 Object
var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9+/=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/rn/g,"n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}}

function base64_encode ( data ) {
  return Base64.encode(data);
}
module.exports.base64_encode = base64_encode;

function base64_decode ( data ) {
  return Base64.decode (data);
}
module.exports.base64_decode = base64_decode;

function mergeObject (iNobject, iNobject2) {
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
module.exports.mergeObject = mergeObject;

// function deepCopyObjectWithoutFunction (iNobject) {
//     return JSON.parse( JSON.stringify(iNobject) );
// }
// module.exports.deepCopyObject = deepCopyObject;


function deepCopyObject(object) {
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
module.exports.deepCopyObject = deepCopyObject;


function returnPromiseWithValue (iNvalue) {
    return new Promise(
        (resolve) => {
            resolve(iNvalue)
        }
    )
}
module.exports.returnPromiseWithValue = returnPromiseWithValue;
module.exports.returnPromiseValue = returnPromiseWithValue;

function addValueToObjectByPath ( iNobject, iNpath, iNdata ) {
    const fname = 'addValueToObjectByPath';

    LOG.fstep(fname, 0, 0, 'INVOKE - iNobject, iNpath, iNdata', iNobject, iNpath, iNdata );
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
module.exports.addValueToObjectByPath = addValueToObjectByPath;



function getValueFromObjectByPath ( iNpath, iNobject ) {
    //@
    let obj                 = iNobject,
        splitedPathArray    = iNpath.split('.'),
        arrayName           = splitedPathArray[0],
        result;
    // we have not sub path -> get result
    result = obj[arrayName]
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
module.exports.getValueFromObjectByPath = getValueFromObjectByPath;



function saveUid (iNuid) {
    let uid = iNuid;
    if ( !global['freeform'] ) global['freeform'] = {};
    global['freeform']['uid'] = uid;
}
module.exports.saveUid = saveUid;

function getUid () {
    if ( !global['freeform'] ) return false;
    if ( !global['freeform']['uid'] ) return false;
    return global['freeform']['uid'];
}
module.exports.getUid = getUid;
