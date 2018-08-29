var DINAMO  = require("../aws/dynamo/dynamo");
var CONNECT = require('../connect');
const LOG   = require('ramman-z-log');

const tableBalance = "connect-balance";
const _ = {};


function getBalance (iNownerUid, iNdata, iNfunction ) {
  /*
    @discr
      check user balance
    @example
      getBalance ('aaaa-bbbb-cccc-dddd', {'uid':'aaaa-bbbb-cccc-dddd'}, (err,data) => {} )
    @inputs
      @required
        iNownerUid -> string
      @optioanal
        iNdata -> object
          @required
            uid -> string
          @optinal
            status -> number
            type -> string
            currency -> string
            by -> string
        iNfunction
    @algoritm
  */
  if (
    typeof(iNownerUid) != 'string' ||
    typeof(iNdata) != 'object'
  ) return false;

  var
      // add uid
      objecrForQuery = DINAMO.addByMask( { 'owner' : iNownerUid }, "owner", { "table" : tableBalance } ),
      by = iNdata['by']||'default';
      index          = '';

      // add owner
      // objecrForQuery = DINAMO.addByMask( { 'uid' : iNdata['uid'] } , "uid", objecrForQuery, "string");
      // if(typeof(iNdata['by']) != 'string')iNdata['by']='standart';

  if ( typeof(iNdata['by']) == 'string' ) {
    switch (iNdata['by']) {
      case "time":
        if( typeof(iNdata['time']) != 'number') break;
        index = 'owner-time-index'; objecrForQuery['index'] = index;
        objecrForQuery = DINAMO.addByMask( iNdata, "time", objecrForQuery, "number" );
      break;

      case "status":
        if( typeof(iNdata['status']) != 'number') break;
        index = 'owner-status-index'; objecrForQuery['index'] = index;
        objecrForQuery = DINAMO.addByMask(iNdata,"status",objecrForQuery,"number");
      break;

      case "type":
        if( typeof(iNdata['type']) != 'string') break;
        index = 'owner-type-index'; objecrForQuery['index'] = index;
        objecrForQuery = DINAMO.addByMask(iNdata,"type",objecrForQuery,"string");
      break;

      case "currency":
        if( typeof(iNdata['currency']) != 'string') break;
        index = 'owner-currency-index'; objecrForQuery['index'] = index;
        objecrForQuery = DINAMO.addByMask(iNdata,"currency",objecrForQuery,"string");
      break;

      case "uid":
        if( typeof(iNdata['uid']) != 'string') break;
        index = 'owner-uid-index'; objecrForQuery['index'] = index;
        objecrForQuery = DINAMO.addByMask(iNdata,"uid",objecrForQuery,"string");
      break;

      default: // default
        if( typeof(iNdata['id']) != 'string') break;
        index = 'owner-id-index'; objecrForQuery['index'] = index;
        objecrForQuery = DINAMO.addByMask( iNdata, "id", objecrForQuery, "string");
      break;
    }
  }

  // add status
  if ( typeof( iNdata['status'] ) == 'number' && index != 'owner-status-index')
    objecrForQuery = DINAMO.addByMaskFilter(iNdata,"status",objecrForQuery,"number");

  // add type
  if ( typeof( iNdata['type'] ) == 'string' && index != 'owner-type-index')
    objecrForQuery = DINAMO.addByMaskFilter(iNdata,"type",objecrForQuery,"string");

  // add currency
  if ( typeof( iNdata['currency'] ) == 'string' && index != 'owner-currency-index')
    objecrForQuery = DINAMO.addByMaskFilter(iNdata,"currency",objecrForQuery,"string");

  DINAMO.query(objecrForQuery,iNfunction);
}
_['getBalance'] = getBalance;

function updateBalance (iNownerUid, iNdata, iNfunction) {
  /*
    @inputs
      @required
        iNownerUid    -> string
        iNdata        -> object
          @required
            id        -> string
          @optinal
            balance   -> number
      @optioanal
        iNfunction
    @algoritm
  */
  if (
    typeof(iNownerUid) != 'string' ||
    typeof(iNdata) != 'object' ||
    typeof(iNdata['id']) != 'string'
  ) return false;

  var objForUpdate = {"table":tableBalance},
      objForLateConver = {};

      objForUpdate['key'] = {"owner":iNownerUid,"id":iNdata['id']};


  //add balance
  if( typeof(iNdata ['balance']) == 'number' )
    objForLateConver['balance']  =  iNdata['balance'];
;
  objForUpdate = DINAMO.jsonObjectToUpdate(objForLateConver,objForUpdate,'keys');
  DINAMO.update(objForUpdate,iNfunction);
}
_['updateBalance'] = updateBalance;


function calculateBalance (iNbalance, iNsumm) {
  return iNbalance - iNsumm;
}
_['calculateBalance'] = calculateBalance;


function getSystemRealBalance ( iNuid, iNcurrency, iNfunction ) {
  getBalance( '@system', { 'uid' : iNuid, 'type' : 'real', 'by' : 'uid', 'currency' : iNcurrency } ,
  (err,data) => {
    if(err || data['Count'] < 1) {
      iNfunction(true,false);
    }else{
      var objForPassToFunc = {};
      objForPassToFunc['owner']     = data['Items'][0]['owner'];
      objForPassToFunc['balance']   = data['Items'][0]['balance'];
      objForPassToFunc['currency']  = data['Items'][0]['currency'];
      objForPassToFunc['id']        = data['Items'][0]['id'];
      objForPassToFunc['type']      = data['Items'][0]['type'];
      objForPassToFunc['uid']       = data['Items'][0]['uid'];
      iNfunction(false,objForPassToFunc);
    }
  } );
}
_['getSystemRealBalance'] = getSystemRealBalance;

module.exports = _;
