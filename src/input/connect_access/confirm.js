var DINAMO    = require("../aws/dynamo/dynamo");
var CONNECT   = require('./../connect');
const LOG     = require('ramman-z-log');

// var FIREBASE  = require("./../firebase/firebase_install");
// var FADMIN    = FIREBASE.firebase;
var LFIREBASE     = require("./../firebase/firebase");
var tableConfirm  = "connect-confirm";



function createTokenForSign (iNuid,iNexpired,iNfunction) {
  createToken(iNuid,iNexpired,iNfunction,"@sign","@system","sms");
}
module.exports.createTokenForSign = createTokenForSign;

function createToken (iNuid,iNdata,iNfunction) {
  // ,iNtype,iNto,iNmethod
  var token     = CONNECT.getRandomKeyByUuid(),
      uid       = iNuid,
      iNinfo    = {},
      objForAdd = {},
      time      = CONNECT.getTime();
      if(typeof(iNdata) !== 'object') iNdata = {},iNinfo = {};
      if(typeof(iNdata['to'])       === 'string') objForAdd['to']      = iNdata['to'];
      if(typeof(iNdata['status'])   === 'number')
        objForAdd['status']  = iNdata['status'];
      else
        objForAdd['status']  = 0;
      if(typeof(iNdata['type'])     === 'string') objForAdd['type']    = iNdata['type'];
      if(typeof(iNdata['method'])   === 'string') objForAdd['method']  = iNdata['method'];
      if(typeof(iNdata['expired'])  === 'number') objForAdd['expired'] = iNdata['expired'];
      if(typeof(iNdata['code'])     === 'string') objForAdd['code']    = iNdata['code'];

      //@< info
        if ( typeof(iNdata['phone'] )    === 'string' )
          iNinfo['phone']   = iNdata['phone'];
        if ( typeof(iNdata['device'] )   === 'string' )
          iNinfo['device']  = iNdata['device'];
        if ( typeof(iNdata['uagent'] )   === 'string' )
          iNinfo['uagent']  = iNdata['uagent'];
        if ( typeof(iNdata['did'] )   === 'string' ) // did - device id
          iNinfo['did']  = iNdata['did'];

        if( Object.keys(iNinfo).length > 0 ) objForAdd['info'] = iNinfo;
      //@> info

      objForAdd['id']       = token;
      objForAdd['time']     = time;
      objForAdd['uid']      = uid;

      DINAMO.add( tableConfirm, objForAdd, iNfunction );
}
module.exports.createToken = createToken;

function createCode (iNuid,iNdata,iNfunction) {
  iNdata['code'] = CONNECT.getRandomNubmer();
  createToken ( iNuid, iNdata, iNfunction);
}
module.exports.createCode = createCode;

function createSmsCode (iNuid,iNdata,iNfunction) {
  iNdata['method']  = 'sms';
  createCode ( iNuid, iNdata, iNfunction);
}
module.exports.createSmsCode = createSmsCode;

function createSmsAuthForSystem (iNuid,iNdata,iNfunction) {
  iNdata['to']      = "@system";
  iNdata['type']    = "auth";
  iNdata['expired'] = CONNECT.getTime() + (300*1000);
  createSmsCode ( iNuid, iNdata, iNfunction );
}
module.exports.createSmsAuthForSystem = createSmsAuthForSystem;

function createSmsSignUpForSystem (iNuid,iNdata,iNfunction) {
  iNdata['to']      = "@system";
  iNdata['type']    = "signup";
  iNdata['expired'] = CONNECT.getTime() + (300*1000);
  createSmsCode ( iNuid, iNdata, iNfunction );
}
module.exports.createSmsSignUpForSystem = createSmsSignUpForSystem;

function createSmsSignInForSystem (iNuid,iNdata,iNfunction) {
  iNdata['to']      = "@system";
  iNdata['type']    = "signin";
  iNdata['expired'] = CONNECT.getTime() + (300*1000);
  createSmsCode ( iNuid, iNdata, iNfunction );
}
module.exports.createSmsSignInForSystem = createSmsSignInForSystem;


function getToken (iNuid,iNdata,iNfunction) {
  let uid           = iNuid,
      token         = iNdata['token'],
      objForQuery   = {'table':tableConfirm};
      LOG.printObject('getToken INVOKE iNdata, objForQuery', iNdata, objForQuery );

      objForQuery = DINAMO.addByMask ( {'id': token} ,'id' , objForQuery );
      LOG.printObject('getToken INVOKE iNdata, addByMask 1', iNdata, objForQuery );
      objForQuery = DINAMO.addByMask ( {'uid':  uid} ,'uid' , objForQuery );
      LOG.printObject('getToken INVOKE iNdata, addByMask 2', iNdata, objForQuery );

      LOG.printObject('getToken objForQuery 1.1',objForQuery);
      if( typeof(iNdata['code'])    === 'string') objForQuery = DINAMO.addByMaskFilter ( iNdata ,'code'  , objForQuery );
      if( typeof(iNdata['status'])  === 'number') objForQuery = DINAMO.addByMaskFilter ( iNdata ,'status', objForQuery , 'number');
      LOG.printObject('getToken objForQuery 1.2',objForQuery);
      if( typeof(iNdata['to'])      === 'string') objForQuery = DINAMO.addByMaskFilter ( iNdata ,'to'    , objForQuery );
      LOG.printObject('getToken objForQuery 1.3',objForQuery);
      if( typeof(iNdata['from'])    === 'string') objForQuery = DINAMO.addByMaskFilter ( iNdata ,'from'  , objForQuery );
      if( typeof(iNdata['type'])    === 'string') objForQuery = DINAMO.addByMaskFilter ( iNdata ,'type'  , objForQuery );
      LOG.printObject('getToken objForQuery 1.4',objForQuery);
      if( typeof(iNdata['method'])  === 'string') objForQuery = DINAMO.addByMaskFilter ( iNdata ,'method', objForQuery );
      LOG.printObject('getToken objForQuery 1.5',objForQuery);
      if( typeof(iNdata['expired']) === 'number')
        objForQuery = DINAMO.addByMaskFilter ( iNdata ,'expired', objForQuery ,'number','>=');
      if( typeof(iNdata['time'])    === 'number') objForQuery = DINAMO.addByMaskFilter ( iNdata ,'time', objForQuery ,'number','>=');

      LOG.printObject('getToken objForQuery 2',objForQuery);
      //@< search by info
        if( typeof(iNdata['device']) === 'string')
          objForQuery = DINAMO.addByMaskFilter ( iNdata ,'info.device', objForQuery );

        if( typeof(iNdata['uagent']) === 'string')
          objForQuery = DINAMO.addByMaskFilter ( iNdata ,'info.uagent', objForQuery );

        if( typeof(iNdata['ip']) === 'string')
          objForQuery = DINAMO.addByMaskFilter ( iNdata ,'info.ip', objForQuery );
      //@> search by info
      LOG.printObject ('getToken objForQuery 3', objForQuery);
      DINAMO.query ( objForQuery , iNfunction );
}
module.exports.getToken = getToken;

  function getSmsToken (iNuid,iNtoken,iNfunction) {
    var token = iNtoken, iNdata = {};
        iNdata['method']  = 'sms';
        iNdata['to']      = '@system';
        iNdata['type']    = 'auth';
        getToken (iNuid,iNdata,iNfunction);
  }
  module.exports.getSmsToken = getSmsToken;

  function getSignUpSmsToken (iNuid,iNdata,iNfunction) {
        iNdata['method']  = 'sms';
        iNdata['to']      = '@system';
        iNdata['type']    = 'signup';
        getToken (iNuid,iNdata,iNfunction);
  }
  module.exports.getSignUpSmsToken = getSignUpSmsToken;

  function getSignInSmsToken (iNuid,iNdata,iNfunction) {
        iNdata['method']  = 'sms';
        iNdata['to']      = '@system';
        iNdata['type']    = 'signin';
        getToken (iNuid,iNdata,iNfunction);
  }
  module.exports.getSignInSmsToken = getSignInSmsToken;


function checkTokenCode (iNuid,iNdata,iNfunction) {
  var token       = iNtoken,
      uid         = iNuid,
      token       = iNdata['token'],
      code        = iNdata['code'] ,
      objForQuery = {'table':tableConfirm  };

      objForQuery = DINAMO.addByMask ( {'id':token}   , 'id'  , objForQuery );
      objForQuery = DINAMO.addByMask ( {'uid':iNuid}  , 'uid' , objForQuery );
      //
      // if ( typeof(iNdata['code']) === 'string' )
      //   objForQuery = DINAMO.addByMaskFilter ( iNdata ,'code' , objForQuery );
      //
      // if ( typeof(iNdata['device']) === 'string' )
      //   objForQuery = DINAMO.addByMaskFilter ( iNdata ,'indo.device' , objForQuery );
      //
      // if ( typeof(iNdata['did']) === 'string' )
      //   objForQuery = DINAMO.addByMaskFilter ( iNdata ,'indo.did' , objForQuery );
      DINAMO.query ( objForQuery , iNfunction );
}
module.exports.checkTokenCode = checkTokenCode;



function updateToken ( iNuid, iNtoken, iNdata , iNfunction) {
  var token       = iNtoken,
      objForUpdate= {},
      dataForUpdate= {},
      uid         = iNuid;
      // if(typeof(status)!== 'number') {
      //   if(typeof(iNfunction)==='function')
      //     iNfunction('Error - type of status !== number in updateTokenStatus',false);
      //   return false;
      // }
      if(typeof(iNdata['status']) === 'number')
          dataForUpdate ['status'] = iNdata['status'];
      if(typeof(iNdata['value']) === 'string')
          dataForUpdate ['value'] = iNdata['value'];


      objForUpdate['table'] = tableConfirm;
      objForUpdate['key'] = {'id':token,'uid':uid};

      objForUpdate = DINAMO.jsonObjectToUpdate ( dataForUpdate ,objForUpdate );
      LOG.printObject('updateToken objForUpdate',objForUpdate);
      DINAMO.update(objForUpdate,iNfunction);
}
module.exports.updateToken = updateToken;
