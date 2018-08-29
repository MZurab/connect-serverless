var DINAMO    = require("../aws/dynamo/dynamo");
var CONNECT   = require('./../connect');
const LOG     = require('ramman-z-log');


var tablePage = 'connect-page';

/*
  @tableStructure noSql
    connect-bill
      @keys
        uid id
      @secondaryIndex
        from   -> string
        status -> number
        time   -> number
        type   -> string
        for    -> string
      @otherFields
        info -> object, map
          id -> string
            cost
            amount
            sale
        total -> object, map
          amount
          cost
          sale

*/

function createBill (iNuid,iNdata,iNfunction) {
  /*
    @inputs
      @required
        iNuid
        iNdata
          @required
            info
          @optinal
            type  -> string
            status  -> number

            status-pay  -> number
            status-delivery -> number
            pay-info -> objects
              total -> objects
                value
                percent
                status
              parts -> object
                id (from info)
                  value
                  procent
                  status

      @optioanal
        iNfunction
    @algoritm
      0 - check/prepare data
      1 - add to dinamo
  */
  if (
    typeof(iNuid) != 'string' ||
    typeof(iNdata) != 'object'
  ) return false;

  var
      dataForDbInsert = {};

  dataForDbInsert['id']       = CONNECT.getRandomKeyByUuid();
  dataForDbInsert['uid']      = iNuid;
  dataForDbInsert['status']   = 0;
  dataForDbInsert['type']     = "0"; // 0 - chern / 1 - online
  dataForDbInsert['for']      = "market"; // change

  dataForDbInsert['time']     = CONNECT.getTime();
  dataForDbInsert['from']     = "?";
  dataForDbInsert['spay']     = 0;
  dataForDbInsert['sdelivery']= 0;

  if(
    typeof(iNdata['spay'] )     == 'number' &&
    (iNdata['spay'] == -1 || iNdata['spay'] == 0 || iNdata['spay'] == 5 || iNdata['spay'] == 3)
  ) dataForDbInsert['spay']       = iNdata['spay'];

  if(
    typeof(iNdata['sdelivery'] )     == 'number' &&
    (iNdata['sdelivery'] == -1 || iNdata['sdelivery'] == 0 || iNdata['sdelivery'] == 1)
  ) dataForDbInsert['sdelivery']       = iNdata['sdelivery'];

  if( typeof(iNdata['from'] )     == 'string' ) dataForDbInsert['from']     = iNdata['from'];
  if( typeof(iNdata['for']  )     == 'string' ) dataForDbInsert['for']      = iNdata['for'];
  if( typeof(iNdata['type'] )     == 'string' ) dataForDbInsert['type']     = iNdata['type'];
  if( typeof(iNdata['sinfo'])     == 'object' ) dataForDbInsert['sinfo']    = iNdata['sinfo'];
  if( typeof(iNdata['comment'] )  == 'object' ) dataForDbInsert['comment']  = iNdata['comment'];
  if( typeof(iNdata['info'] )     == 'object' ) dataForDbInsert = createInfoForMarket(iNdata['info'],dataForDbInsert);
  LOG.printObject('dataForDbInsert befor add dynamo',dataForDbInsert)
  DINAMO.add( tablePage , dataForDbInsert , iNfunction );
}
module.exports.createBill = createBill;
  //i
    function createInfoForMarket (iNinfo,iNresult) {
      if(typeof(iNinfo)!='object')return iNresult;
      var result = {},amount=0,cost=0,sale=0;
      for(var iKey in iNinfo) {
        if(
          typeof(iNinfo[iKey]) != 'object' ||
          typeof(iNinfo[iKey]['am']) == 'undefined' ||
          typeof(iNinfo[iKey]['cost']) == 'undefined'
        )continue;
        result[iKey] = {};
        result[iKey]['am'] = iNinfo[iKey]['am'] * 1; amount += result[iKey]['am'];
        result[iKey]['cost'] = iNinfo[iKey]['cost'] * 1; cost += result[iKey]['cost'];
        if ( typeof(iNinfo[iKey]['sale']) != 'undefined' ) {
          result[iKey]['sale'] = iNinfo[iKey]['sale'] * 1;;
          sale += result[iKey]['sale'];
        }
        if ( typeof(iNinfo[iKey]['name']) == 'string' )
          result[iKey]['name'] = iNinfo[iKey]['name'];


        if ( typeof(iNinfo[iKey]['src']) == 'string' )
          result[iKey]['src'] = iNinfo[iKey]['src'];
      }
      if(amount > 0) {
        iNresult['info'] = result;
        iNresult['total'] = {"amount":amount,'cost':cost,'sale':sale};
      }
      return iNresult;
    }
  //i

function updateBill (iNuid,iNdata,iNfunction) {
  /*
    @inputs
      @required
        iNuid
        iNdata
          @required
            id
          @optinal
            type
            status
      @optioanal
        iNfunction
    @algoritm
      0 - check/prepare data
      1 - add to dinamo
  */
  if (
    typeof(iNuid) != 'string' ||
    typeof(iNdata) != 'object' ||
    typeof(iNdata['id']) != 'string'
  ) return false;

  var
      objForUpdate = {"table":tablePage},
      objForLateConver = {};
      id = iNdata['id'];

      objForUpdate['key'] = {"uid":iNuid,"id":id};

  if( typeof(iNdata ['info']) == 'object' )
    objForLateConver = createInfoForMarket(iNdata['info'],objForLateConver);

  if( typeof(iNdata ['sinfo']) == 'object' )
    objForLateConver['sinfo']  =  iNdata['sinfo'];

  if( typeof(iNdata ['comment']) == 'object' )
    objForLateConver['comment']  =  iNdata['comment'];

  if( typeof(iNdata ['status']) == 'number' )
    objForLateConver['status']  =  iNdata['status'];

  if( typeof(iNdata ['sdelivery']) == 'number' )
    objForLateConver['sdelivery']  =  iNdata['sdelivery'];

  if( typeof(iNdata ['spay']) == 'number' )
    objForLateConver['spay']  =  iNdata['spay'];

  if( typeof(iNdata ['type']) == 'string' )
    objForLateConver['type']  =  iNdata['type'];

  if( typeof(iNdata ['sync_time']) == 'number' )
    objForLateConver['sync_time']  =  iNdata['sync_time'];

  if( typeof(iNdata ['ship_status']) == 'number' )
    objForLateConver['ship_status']  =  iNdata['ship_status'];

  objForUpdate = DINAMO.jsonObjectToUpdate(objForLateConver,objForUpdate,'keys');
  DINAMO.update(objForUpdate,iNfunction);
}
module.exports.updateBill = updateBill;


function getPage (iNuid,iNdata,iNfunction) {
  /*
    @example
      getPage (
        iNuid,
        {
          id
        },
        ()=>{}
      )
    @disc
      get page
    @inputs
      @required
        iNuid
        iNdata
          @required
            uid
            id
          @optinal
      @optioanal
        iNfunction
    @algoritm
      0 - check/prepare data
      1 - update in dynamo
  */
  if (
    typeof(iNuid) != 'string' ||
    typeof(iNdata) != 'object'
  ) return false;

  LOG.printObject('getPage start iNdata ' , iNdata);
  LOG.printObject('getPage start iNuid  ' , iNuid);
  var
      objecrForQuery = DINAMO.addByMask({'uid': iNdata['uid']||iNuid },"uid",{"table":tablePage}),
      index          = '';
      // if(typeof(iNdata['by']) != 'string')iNdata['by']='standart';

  // if ( typeof(iNdata['id'])=='string' && index.length > 0 )
  //   objecrForQuery = DINAMO.addByMask(iNdata,"id",objecrForQuery);

  // if ( typeof(iNdata['by']) == 'string' ) {
    switch (iNdata['by']) {
      case "from":
        // if( typeof(iNdata['from']) != 'string') break;
        // index = 'uid-from-index'; objecrForQuery['index'] = index;
        // objecrForQuery = DINAMO.addByMask(iNdata,"from",objecrForQuery);
      break;

      case "status":
        // if( typeof(iNdata['status']) != 'number') break;
        // index = 'uid-status-index'; objecrForQuery['index'] = index;
        // objecrForQuery = DINAMO.addByMask(iNdata,"status",objecrForQuery,"number");
      break;

      case "type":
        // if( typeof(iNdata['type']) != 'string') break;
        // index = 'uid-type-index'; objecrForQuery['index'] = index;
        // objecrForQuery = DINAMO.addByMask(iNdata,"type",objecrForQuery);
      break;

      case "time":
        // if( typeof(iNdata['time']) != 'number') break;
        // index = 'uid-time-index'; objecrForQuery['index'] = index;
        // objecrForQuery = DINAMO.addByMask(iNdata,"time",objecrForQuery,"number",">=");
      break;

      case "for":
        // if( typeof(iNdata['for']) != 'string') break;
        // index = 'uid-for-index'; objecrForQuery['index'] = index;
        // objecrForQuery = DINAMO.addByMask(iNdata,"for",objecrForQuery);
      break;

      default:
        if( typeof(iNdata['id']) != 'string') break;
        objecrForQuery = DINAMO.addByMask(iNdata,"id",objecrForQuery);
      break;
    }

  // }


  // if ( typeof(iNdata['status'])=='number' && index != "uid-status-index" )
  //   objecrForQuery = DINAMO.addByMaskFilter(iNdata,"status",objecrForQuery,"number");
  //
  //
  // if ( typeof(iNdata['from'])=='string' && index != "uid-from-index" )
  //   objecrForQuery = DINAMO.addByMaskFilter(iNdata,"from",objecrForQuery);
  //
  // if ( typeof(iNdata['for'])=='string' && index != "uid-for-index" )
  //   objecrForQuery = DINAMO.addByMaskFilter(iNdata,"for",objecrForQuery);

  LOG.printObject('getPage objecrForQuery',objecrForQuery);
  DINAMO.query(objecrForQuery,iNfunction);
}
module.exports.getPage = getPage;
