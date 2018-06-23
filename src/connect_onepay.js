

exports.handler = ( event, context, callback ) => {
  const http        = require('http');
  const crypto      = require('crypto');
  const _uuid_      = require('node-uuid');
  const LOG         = require('ramman-z-log');
  const CONNECT   = require ("./input/connect");
  const ONEPAY    = require ("./input/connect_onepay/onepay");
  const ACCESS    = require ("./input/connect_access/access");
  LOG.printObject( "start event", event );

var DATA = {};
if (
  typeof(event['params']['path']['action'])     == 'string' &&
  typeof(event['params']['path']['service_id']) == 'string'
) {
    var DATA,GET,POST,TYPE,ACTION,UID,PATH,JSON;
    PATH    = event['params']['path'];
    UID     = PATH["service_id"];
    ACTION  = PATH["action"];
    if( event['context']['http-method']=='GET' ) {
      TYPE  = "GET",
      GET   = event['params']["querystring"],
      DATA  = GET;
    } else {
      TYPE  = "JSON",
      JSON2 = event["body-json"],
      DATA  = JSON2;
    }
} else {
    callback(null,{'status':0,'ru':'Нет входных данных.'});
    return 0;
}

// CONNECT.setHeader(event);
// var HEADER = CONNECT.getHeader(['*']);
// var DATA   = HEADER['data'];
// var TYPE   = HEADER['type'];





if ( typeof(DATA) != 'undefined' && typeof(ACTION) != 'undefined') {

  DATA.verification     = 'api';// CHANGE AFTER
  if(DATA.verification == 'api') {
    if(
        typeof(UID)                         != 'undefined'  &&
        typeof(DATA.key)                    != 'undefined'  &&
        typeof(DATA.pswd)                   != 'undefined'  &&
        typeof(event.context)               != 'undefined'  &&
        typeof(event.context['source-ip'])  != 'undefined'
      ) {
        // LOG.printObject('verification == api - ');
        var inData    = {};
          inData.key  = DATA.key;
          inData.code = 'accessBySite';
          inData.to   = '@';
          inData.pswd = DATA.pswd;
          inData.ip   = event.context['source-ip'];
          inData.uid  = UID;
          LOG.printObject("start getAccessDataForApi");
          ACCESS.getAccessDataForApi( inData,controleHub );
      }
  }
  function controleHub (iN1,iNinfo) {
    if (ACTION == 'updateShipStatus') {
      // if order create with service
      LOCAL_ORDER_UPDATE(DATA);
    } else if (ACTION == 'updateBill') {
      // if order create with service
      LOCAL_ORDER_UPDATE(DATA);

    } else if (ACTION == 'updateStatus' && typeof(DATA.status) == 'number') {
      // if order create with service
      LOCAL_ORDER_UPDATE(DATA);
    } else if (ACTION == 'createOrder' && TYPE == 'JSON') {
      LOCAL_ORDER_CREATE(DATA);
    } else if (ACTION == 'getOrder' ) {
      LOCAL_ORDER_GET(DATA);
    }
  }

  //@< LOCAL FUNCTIONS
    function LOCAL_ORDER_UPDATE (DATA) {
        var permision;
          permision = ACCESS.getActionPermission("update","onepay","billStatus");
        if(permision == 'full') {
          if( typeof(DATA.id) == 'string' && typeof(DATA.uid) == 'string') {
            var objForGetBill = {};
                objForGetBill = {"id":DATA.id,"from":UID};
            ONEPAY.getBill(DATA.uid,objForGetBill,function (err,data) {
              LOG.printObject("LOCAL_ORDER_UPDATE err",err);
              LOG.printObject("LOCAL_ORDER_UPDATE DATA",data);
              if(!err && data.Count > 0) {
                LOG.printObject("ONEPAY.updateBill start");
                var objForUpdateBill = {"id":DATA.id};

                if( typeof(DATA['sdelivery']) == 'number') objForUpdateBill['sdelivery'] = DATA['sdelivery'];
                if( typeof(DATA['spay']) == 'number') objForUpdateBill['spay'] = DATA['spay'];

                if( typeof(DATA['comment']) == 'object') objForUpdateBill['comment'] = DATA['comment'];
                if( typeof(DATA['sinfo'])   == 'object') objForUpdateBill['sinfo'] = DATA['sinfo'];
                if( typeof(DATA['info'])    == 'object') objForUpdateBill['info'] = DATA['info'];
                ONEPAY.updateBill(DATA.uid,objForUpdateBill,function(){
                  context.succeed({"status":1});
                });
              } else {
                context.succeed({"status":0});
              }
            });

          }
        }
      }

      function LOCAL_ORDER_GET (DATA) {
        var permision;
          permision = ACCESS.getActionPermission("read","onepay","billStatus");
          if(permision == 'full') {
            if( typeof(DATA.id) == 'string' && typeof(DATA.uid) == 'string') {
              var objForGetBill   = {"id":DATA.id,"from":UID};
                if( typeof(DATA['comment']) == 'object') objForGetBill['comment'] = DATA['comment'];
                if( typeof(DATA['sinfo'])   == 'object') objForGetBill['sinfo'] = DATA['sinfo'];
                ONEPAY.getBill(DATA.uid,objForGetBill,function (err,data) {
                  if(!err && data.Count > 0){
                    context.succeed({"status":1,"data":data.Items});
                  } else {
                    context.succeed({"status":0});
                  }
                });
            }
          }
      }

      function LOCAL_ORDER_CREATE (DATA) {
        LOG.printObject('LOCAL_ORDER_CREATE started');
        var permision;
          permision = ACCESS.getActionPermission("write","onepay","bill");
          if(permision == 'full') {
            if( typeof(DATA.info) == 'object' && typeof(DATA.uid) == 'string' && typeof(DATA.info) == 'object') {
                var objForCreateBill = {"id":DATA.id,"from":UID,"info":DATA.info};
                if( typeof(DATA['comment']) == 'object')    objForCreateBill['comment']   = DATA['comment'];
                if( typeof(DATA['sinfo'])   == 'object')    objForCreateBill['sinfo']     = DATA['sinfo'];
                if( typeof(DATA['sdelivery']) == 'number')  objForCreateBill['sdelivery'] = DATA['sdelivery'];
                if( typeof(DATA['spay']) == 'number')       objForCreateBill['spay']      = DATA['spay'];

                LOG.printObject('LOCAL_ORDER_CREATE objForGetBill',objForCreateBill);
                ONEPAY.createBill(UID,objForCreateBill,function (err,data) {
                  LOG.printObject ('createBill err',err);
                  LOG.printObject ('createBill data',data);
                  if (!err) {
                    context.succeed({"status":1,"data":data});
                  } else {
                    context.succeed({"status":0});
                  }
                });
            }
          }
      }
  //@> LOCAL FUNCTIONS
  }
}
