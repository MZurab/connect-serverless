var DINAMO    = require("./../aws/dinamo");
var CONNECT   = require('./../connect');
const LOG     = require('ramman-z-log');

// var FIREBASE  = require("./../firebase/firebase_install");
// var FADMIN    = FIREBASE.firebase;
var LFIREBASE = require("./../firebase/firebase");
var tableUser = "connect-user";

function addUser (iNdata,iNfunction) {
    /*
      @inputs
        @required
          login AND pswd OR login==? (its ABSTACT USER)
    */
    if (
        typeof(iNdata)!= 'object' &&
        typeof(iNdata['login'])!= 'string' &&
        ( iNdata['login'] != '?' &&  iNdata['login'] != '?' &&  typeof(iNdata['pswd']) != 'string' )
    ) return false;
    var objectForDinamo   = {},
        objectForFirebase = {},
        table             = "connect-user",
        uInfoForDinamo    = {},
        dName             = "";

    if(typeof(iNdata.uid) != 'string') iNdata.uid = CONNECT.getRandomKeyByUuid();
        objectForDinamo   ['uid']     = iNdata.uid;
        objectForFirebase ['uid']     = iNdata.uid;

    if(typeof(iNdata['owner']) != 'string')
      objectForDinamo['owner'] = '@system';
    else
      objectForDinamo['owner']    = iNdata['owner'];

    objectForDinamo   ['login']   = iNdata['login'].toLowerCase();
      if(iNdata['login'] != '?')      objectForDinamo   ['pswd']    = iNdata['pswd'];

    if ( typeof(iNdata['lastname']) == 'string') {
      dName  = iNdata['lastname'];
      uInfoForDinamo['lastname'] = iNdata['lastname'];
    }
    if ( typeof(iNdata['firstname']) == 'string') {
      dName  += " " + iNdata['firstname'];
      uInfoForDinamo['firstname'] = iNdata['firstname'];
    }
    if ( typeof(iNdata['phone']) == 'string') {
      objectForDinamo['phone'] = iNdata['phone'];
    }
    if ( typeof(iNdata['icon']) == 'string') {
      uInfoForDinamo['icon']      = iNdata['icon'];
      objectForFirebase['icon']   = iNdata['icon'];
    }
    if ( typeof(iNdata['country']) == 'string') {
      objectForDinamo['country']  = iNdata['country'];
    }
    if ( typeof(iNdata['lang']) == 'string') {
      objectForDinamo['lang']  = iNdata['lang'];
    }
    if ( typeof(iNdata['device']) == 'object') {
      objectForDinamo['device']   = iNdata['device'];
    }
    if ( typeof(iNdata['email']) == 'string') {
      objectForDinamo['email']    = iNdata['email'];
      objectForFirebase['email']  = iNdata['email'];
    }
    objectForDinamo['info'] = uInfoForDinamo;

    if(typeof(iNdata['dname']) == 'string') dNameForAdd = iNdata['dname']; else dNameForAdd  = dName;
    dNameForAdd  = dName.trim();
    //add dispay name for firebase if dName right isset
      if(dNameForAdd.length > 0) {
        objectForFirebase['dName'] = dNameForAdd;
        objectForDinamo['displayName'] = dNameForAdd;
      }

    DINAMO.add( tableUser,objectForDinamo,function (err,data) {
      if(!err)
        LFIREBASE.createUser(objectForFirebase,iNfunction);
      else
        if(typeof(iNfunction)=='function')iNfunction(err,data);
    });
}
module.exports.addUser = addUser;

function updateUser (iNdata,iNfunction) {

}
module.exports.updateUser = updateUser;




function getByLoginIndex (iNdata,iNfunction) {
  if( typeof(iNdata) != 'object' || typeof(iNdata['login']) != 'string') return false;

  var login       = (iNdata['login']+"").toLowerCase(),
      objForQuery = {'index': 'owner-login-index' ,'table': tableUser};

  objForQuery = DINAMO.addByMask ({'login':login},'login',objForQuery);
  objForQuery = DINAMO.addByMask ({'owner':'@system'},'owner',objForQuery);

  if(typeof(iNdata['pswd']) == 'string')
    objForQuery = DINAMO.addByMaskFilter (iNdata,'pswd',objForQuery);

  if( typeof(iNdata['phone'] )=='string')
    objForQuery = DINAMO.addByMaskFilter (iNdata,'phone',objForQuery);
  LOG.printObject('getByLoginIndex objForQuery',objForQuery);
  DINAMO.query(objForQuery,iNfunction);
}
module.exports.getByLoginIndex = getByLoginIndex;

function getByPhoneIndex (iNdata,iNfunction) {
  if ( typeof(iNdata) != 'object' || typeof(iNdata['phone']) != 'string') return false;

  var phone = iNdata['phone'],
      objForQuery = {'index':'owner-phone-index','table':tableUser};
  objForQuery = DINAMO.addByMask (iNdata,'phone',objForQuery);
  objForQuery = DINAMO.addByMask ({'owner':'@system'},'owner',objForQuery);
  if( typeof(iNdata['login'] )=='string')
    objForQuery = DINAMO.addByMaskFilter (iNdata,'login',objForQuery);
  DINAMO.query(objForQuery,iNfunction);
}
module.exports.getByPhoneIndex = getByPhoneIndex;

function removeUser (iNuid,iNfunction) {
  var uid = iNuid,
      ojbForDel = {};
  ojbForDel['key']    = {'uid':uid,'owner':'@system'};
  ojbForDel['table']  = tableUser;
  DINAMO.del(ojbForDel,function (err,data) {
    LFIREBASE.removeUser(uid,iNfunction);
  });
}
module.exports.removeUser = removeUser;

function passAnonimDataToUid (iNanonimId,iNuid,iNfunction) {
  LOG.printObject('passAnonimDataToUid start');
  var objForMultiMoveData = {}
      userAnonymId        = iNanonimId,
      userSignedId        = iNuid;
  objForMultiMoveData["members/"  + userAnonymId]     = "members/"    + userSignedId;
  objForMultiMoveData["pushes/"   + userAnonymId]     = "pushes/"     + userSignedId;
  objForMultiMoveData["contacts/" + userAnonymId]     = "contacts/"   + userSignedId;
  objForMultiMoveData["users/"    + userAnonymId]     = "remove";
  LOG.printObject('passAnonimDataToUid objForMultiMoveData',objForMultiMoveData);
  LFIREBASE.multiMoveData(
    objForMultiMoveData
    , function () {
      // delete anonym user
      removeUser( userAnonymId , function (err,data) {
        LOG.printObject ('LFIREBASE.removeUser start',err,data);
        if(typeof(iNfunction) == 'function') iNfunction(err,data);
      });
    }
  );
}
module.exports.passAnonimDataToUid = passAnonimDataToUid;



function createAnonymUser (iNfunction) {
  var uid   = CONNECT.getRandomKeyByUuid(),
      token = CONNECT.getRandomKeyByUuid(),
      time  = CONNECT.getTime(),
      table = 'connect-user',
      data  = {
        'owner'   : '@system',
        'login'   : "?",
        'uid'     : uid,
        'token'   : token,
        'status'  : 0,
        'create'  : time
      };
  DINAMO.add(table,data,iNfunction);
}
module.exports.createAnonymUser = createAnonymUser;











/*
include
  firebase base
  dynamo base

@SCHEMA
  - FIREBASE
    - users -> db
        info    -> object
          data    -> object
            icon    -> number
            login   -> string
            name    -> string
            phone   -> number
            type    -> number (1 - user, 2 - service)
        live -> object (last time what this user was online, and status)
          status    -> number (1 - online, 0 - ofline)
          timeout   -> number
*/
