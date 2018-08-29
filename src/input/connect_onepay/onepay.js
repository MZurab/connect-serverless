var DINAMO    = require("../aws/dynamo/dynamo");
var CONNECT   = require('./../connect');
const LOG     = require('ramman-z-log');

var FIREBASE  = require("./../firebase/firebase_install");
var FADMIN    = FIREBASE.firebase;
var LFIREBASE = require("./../firebase/firebase");
var BALANCE   = require("./../connect_balance/balance");

var
    tableBill = 'connect-bill';

/*
  @tableStructure noSql
    connect-bill
      @keys
        uid_buyer id
      @secondaryIndex
        uid_seller   -> string
        status -> number
        time   -> number
        type   -> string
        app    -> string
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
function createSystemBill (iNdata,iNfunction) {
  iNdata = iNdata||{};
  createBill ('@system',iNdata,iNfunction)
}


function createSystemBillAndPayByBalance (iNdata,iNfunction) {
  /*
    @inputs
      @required
        iNfunction  -> function (err)
        iNdata      -> object
          @required
            uid_buyer   -> string
            uid_seller  -> string
            summ        -> number
            name        -> string
          @optinal
            type
  */
  iNdata['status'] = 5;

  BALANCE.getSystemRealBalance ( iNdata['uid_buyer'], 'rub',
    (err,objBalance) => {
      if(!err) {
        //SUCCESS we get balance

        // attach balance for add to bill db
        iNdata['balance'] = objBalance['id'];

        const calculatedBalance = BALANCE.calculateBalance (objBalance['balance'], iNdata['summ']) ;
        if ( calculatedBalance > 0){
          //SUCCESS we have enough money
          var objForUpdateBalance = {'balance':calculatedBalance,'id':objBalance['id']};
          // update balnce (minus from balance need summ)
          BALANCE.updateBalance (objBalance['owner'], objForUpdateBalance,
            (errBalanceUpdate,dataBalanceUpdate) => {
              if(!errBalanceUpdate) {
                //SUCCESS we change balance
                // create bill
                createSystemBill(
                  iNdata,
                  (errCreateSystemBill,dataCreateSystemBill) => {
                    if (!errCreateSystemBill) {
                      //SUCCESS we create bill
                      iNfunction(false)
                    } else {
                      //ERROR we cannot create bill
                      iNfunction(true)
                    }
                  }
                )
              }else {
                //ERROR we dont change balance
                iNfunction(true)

              }
            }
          );

        } else {
          //ERROR we dont have enough money
          iNfunction(true)
        }
      } else {
        //ERROR we dont get balance
        iNfunction(true)

      }
    }
  )
}
module.exports.createSystemBillAndPayByBalance = createSystemBillAndPayByBalance;


function createBill (iNownerUid,iNdata,iNfunction) {
  /*
    @inputs
      @required
        iNuid           -> string
        iNdata          -> object
          @required
            name        -> string
            -------------
            balance     -> number
            -------------
            description -> string
            -------------
            currency    -> number
            -------------
            info -> object
              @discr
                info
              @exanple
                "info": {
                  "89e2ad41-786a-4813-bf41-14f91c272447": {
                    "am": 1,
                    "cost": 130,
                    "name": " ПВА Аквест 2,5\n                        ",
                    "src": "/templates/leroymerlin/res/images/noimage.jpg"
                  },
                  "delivery": {
                    "am": 1,
                    "cost": 100,
                    "name": "Оплата за доставку",
                    "src": "https://tataev-market.ru/templates/leroymerlin/res/images/noimage.jpg"
                  }
                }
            -------------
            uid_seller -> string
          @optinal
            app -> string
              @enum
                market||sharepay||message || other app
              @default
                market
            -------------
            spay -> number
              @discr
                pay status
              @enum
                0 - create
                1 -
                5 - payed
            -------------
            sdelivery -> number
              @discr
                delivery status
              @enum
                0 - create
                1 -
                5 - delivered
            -------------
            type
              @discr
                delivery status
              @enum
                draft   - черновик
                valid   - дейсвтиельный
                invalid -
            -------------
            extraInfo -> object
              @discr
                additional info
              @exanple
                "extraInfo": {
                  "address"   : "Маяковского 113",
                  "city"      : "Грозный",
                  "email"     : "bin2oct8@gmail.com",
                  "fio"       : "Шамиль",
                  "phone"     : "+79380003767"
                }
            -------------
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
                id (uid_seller info)
                  value
                  procent
                  status

      @optioanal
        iNfunction
    @algoritm
      0 - check/prepare data
      1 - add to dinamo
  */
  LOG.printObject('createBill start iNownerUid,iNdata',iNownerUid,iNdata);
  if (
    typeof iNownerUid               != 'string'   ||
    typeof iNdata                   != 'object'   ||
    typeof iNdata['uid_seller']     != 'string'   ||
    typeof iNdata['uid_buyer']      != 'string'   ||
    typeof iNdata['summ']           != 'number'   ||
    typeof iNdata['name']           != 'string'

  ) return false;

  var dataForDbInsert = {'owner':iNownerUid};
  // add id
  dataForDbInsert['id']             = iNdata['id']||CONNECT.getRandomKeyByUuid();
  // add buyer user id
  dataForDbInsert['uid_buyer']      = iNdata['uid_buyer'];
  // add seller user id
  dataForDbInsert['uid_seller']     = iNdata['uid_seller'];
  // add summ
  dataForDbInsert['summ']           = iNdata['summ'];
  // add name
  dataForDbInsert['name']           = iNdata['name'];


  // add type (@default - 'draft')
    dataForDbInsert['type'] = "draft";
    if (typeof iNdata['type'] == 'string' ) {
      dataForDbInsert['type'] = iNdata['type'];
    }
  // add status (@default - '0')
    dataForDbInsert['status'] = 0
    if (typeof iNdata['status'] == 'number' ) {
      dataForDbInsert['status'] =   iNdata['status'];
    }

  // add app (@default - 'market')
    dataForDbInsert['app'] = "market";
    if (typeof iNdata['app'] == 'string' ) {
      dataForDbInsert['app'] = iNdata['app'];
    }

  // add time (@default - now time stamp)
    dataForDbInsert['time'] = CONNECT.getTime();
    if (typeof iNdata['time'] == 'number' ) {
      dataForDbInsert['time'] = iNdata['time'];
    }

  // add currency (@default - 'rub')
    dataForDbInsert['currency'] = 'rub';
    if( typeof ( iNdata['currency'] )     == 'string' )
      dataForDbInsert['currency']     = iNdata['currency'];

  // if( typeof(iNdata['extraInfo'])     == 'object' )
  //     dataForDbInsert['extraInfo']    = iNdata['extraInfo'];


  // if( typeof(iNdata['comment'] )  == 'object' )
  //     dataForDbInsert['comment']  = iNdata['comment'];

  if( typeof ( iNdata['balance'] )      == 'string' )
      dataForDbInsert['balance']      = iNdata['balance'];

  // add description
  if( typeof ( iNdata['description'] )  == 'string' )
    dataForDbInsert['description']  = iNdata['description'];

  // if( typeof(iNdata['info'] )     == 'object' ) dataForDbInsert = createInfoForMarket(iNdata['info'],dataForDbInsert);
  LOG.printObject('createBill dataForDbInsert',dataForDbInsert);
  DINAMO.add( tableBill , dataForDbInsert , iNfunction );
}
module.exports.createBill = createBill;
  //i
    function createInfoForMarket (iNinfo,iNresult) {
      /*
        @inputs
          @required
            iNinfo    -> object
              am
              cost
              name

              sale
              src
            iNresult  -> object
      */
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
        if ( typeof(iNinfo[iKey]['sale']) == 'number' ) {
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


function puchase () {

}

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

            description
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
      objForUpdate = {"table":tableBill},
      objForLateConver = {};
      id = iNdata['id'];

  objForUpdate['key'] = { "uid_buyer" : iNuid , "id" : id };

  // add info
  if( typeof(iNdata ['info']) == 'object' )
    objForLateConver = createInfoForMarket(iNdata['info'],objForLateConver);
  // add extraInfo
  if( typeof(iNdata ['extraInfo']) == 'object' )
    objForLateConver['extraInfo']  =  iNdata['extraInfo'];
  // add comment
  if( typeof(iNdata ['comment']) == 'object' )
    objForLateConver['comment']  =  iNdata['comment'];
  // add status
  if( typeof(iNdata ['status']) == 'number' )
    objForLateConver['status']  =  iNdata['status'];
  // add sdelivery
  if( typeof(iNdata ['sdelivery']) == 'number' )
    objForLateConver['sdelivery']  =  iNdata['sdelivery'];
  // add spay
  if( typeof(iNdata ['spay']) == 'number' )
    objForLateConver['spay']  =  iNdata['spay'];
  // add type
  if( typeof(iNdata ['type']) == 'string' )
    objForLateConver['type']  =  iNdata['type'];
  // add name
  if( typeof(iNdata ['name']) == 'string' )
    objForLateConver['name']  =  iNdata['name'];
  // add description
  if( typeof(iNdata ['description']) == 'string' )
    objForLateConver['description']  =  iNdata['description'];
  // add currency
  if( typeof(iNdata ['currency']) == 'string' )
    objForLateConver['currency']  =  iNdata['currency'];
  // add balance
  if( typeof(iNdata ['balance']) == 'string' )
    objForLateConver['balance']  =  iNdata['balance'];
  // add sync_time
  if( typeof(iNdata ['sync_time']) == 'number' )
    objForLateConver['sync_time']  =  iNdata['sync_time'];
  // add ship_status
  if( typeof(iNdata ['ship_status']) == 'number' )
    objForLateConver['ship_status']  =  iNdata['ship_status'];

  objForUpdate = DINAMO.jsonObjectToUpdate(objForLateConver,objForUpdate,'keys');
  DINAMO.update(objForUpdate,iNfunction);
}
module.exports.updateBill = updateBill;


function getBill (iNuid,iNdata,iNfunction) {
  /*
    @inputs
      @required
        iNuid
        iNdata
          @required
            by
          @optinal
            app
            uid_seller
            status
            id
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

  var
      objecrForQuery = DINAMO.addByMask({'uid_buyer':iNuid},"uid_buyer",{"table":tableBill}),
      index          = '';
      if(typeof(iNdata['by']) != 'string')iNdata['by']='standart';

  if ( typeof(iNdata['by']) == 'string' ) {
    switch (iNdata['by']) {
      case "uid_seller":
        if( typeof(iNdata['uid_seller']) != 'string') break;
        index = 'uid_buyer-uid_seller-index'; objecrForQuery['index'] = index;
        objecrForQuery = DINAMO.addByMask(iNdata,"uid_seller",objecrForQuery);
      break;

      case "status":
        if( typeof(iNdata['status']) != 'number') break;
        index = 'uid_buyer-status-index'; objecrForQuery['index'] = index;
        objecrForQuery = DINAMO.addByMask(iNdata,"status",objecrForQuery,"number");
      break;

      case "type":
        if( typeof(iNdata['type']) != 'string') break;
        index = 'uid_buyer-type-index'; objecrForQuery['index'] = index;
        objecrForQuery = DINAMO.addByMask(iNdata,"type",objecrForQuery);
      break;

      case "time":
        if( typeof(iNdata['time']) != 'number') break;
        index = 'uid_buyer-time-index'; objecrForQuery['index'] = index;
        objecrForQuery = DINAMO.addByMask(iNdata,"time",objecrForQuery,"number",">=");
      break;

      case "app":
        if( typeof(iNdata['app']) != 'string') break;
        index = 'uid_buyer-app-index'; objecrForQuery['index'] = index;
        objecrForQuery = DINAMO.addByMask(iNdata,"app",objecrForQuery);
      break;

      default:
        if( typeof(iNdata['id']) != 'string') break;
        objecrForQuery = DINAMO.addByMask(iNdata,"id",objecrForQuery);
      break;
    }

  }

  if (objecrForQuery['mask'].length == 0)  return false;

  if ( typeof(iNdata['status'])=='number' && index != "uid_buyer-status-index" )
    objecrForQuery = DINAMO.addByMaskFilter(iNdata,"status",objecrForQuery,"number");


  if ( typeof(iNdata['uid_seller'])=='string' && index != "uid_buyer-uid_seller-index" )
    objecrForQuery = DINAMO.addByMaskFilter(iNdata,"uid_seller",objecrForQuery);

  if ( typeof(iNdata['app'])=='string' && index != "uid_buyer-app-index" )
    objecrForQuery = DINAMO.addByMaskFilter(iNdata,"app",objecrForQuery);

  if ( typeof(iNdata['id'])=='string' && index.length > 0 )
    objecrForQuery = DINAMO.addByMaskFilter(iNdata,"id",objecrForQuery);

  DINAMO.query(objecrForQuery,iNfunction);
}
module.exports.getBill = getBill;
