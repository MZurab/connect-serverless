var CONNECT = require('./../connect');
var DINAMO  = require("../aws/dynamo/dynamo");
const LOG   = require('ramman-z-log');

var table = 'connect-service';


//@< add user token to service token
    function addDataToServiceToken (inServiceToken,iNdata,iNuid,iNfunction) {
      /*
        @discr
          add user token to service token
        @inputs
          @required
            iNdata -> object
              utoken       -> string
              ftoken       -> string
            iNuid             -> string
          @optinal
            iNfunction        -> function
              @example
                iNfunction(err, token);
        @return
          calback
      */
      if(
        typeof(iNdata) != 'object' ||
        (typeof(iNdata['utoken']) != 'string' && typeof(iNdata['ftoken']) != 'string' ) ||
        typeof(iNuid) != 'string'
      ) return false;
      var objForUpdate = {},
          time = CONNECT.getTime();
          objForUpdate['table'] = table;
          objForUpdate['key']   = {'uid':iNuid,'token':inServiceToken};

      var objJsonForUpdate = {};
        objJsonForUpdate['last_sync'] = time;
        if(typeof(iNdata['utoken']) == 'string') objJsonForUpdate['utoken'] = iNdata['utoken'];
        if(typeof(iNdata['ftoken']) == 'string') objJsonForUpdate['ftoken'] = iNdata['ftoken'];

      objForUpdate = DINAMO.jsonObjectToUpdate(objJsonForUpdate,objForUpdate);
      DINAMO.update(objForUpdate,iNfunction);
    }
    module.exports.addDataToServiceToken  = addDataToServiceToken;
//@> add user token to service token

//@< create token
    function createServiceToken (iNuid,iNfunction) {
      /*
        @discr
          create token in connect-service dinamo db
        @inputs
          @required
            iNuid       -> string
          @optinal
            iNfunction  -> function
              @example
                iNfunction(err, token);
        @return
          tokenId
      */
      if(typeof(iNuid) != 'string') {
        if ( typeof(iNfunction) == 'function' ) {
          iNfunction(true,false);
        }
        return false;
      }
      var
        time,             // time for fields (create)
        status  = 0,      // time for fields (create)
        type    = 0;      // filds for dinamo db
      time = CONNECT.getTime();

      var data = {};
        data['uid']         = iNuid;
        data['token']       = CONNECT.getRandomKeyByUuid();;
        data['addToDb']      = time;
        data['type']        = type;
        data['status']      = status;
        data['last_sync']   = 0;

      DINAMO.add(table,data,function (err,d) {
        var tokenData = data['token'];
        iNfunction ( err , tokenData );
      });
      return data['token'];
    }
    module.exports.createServiceToken  = createServiceToken;
//@> create token

//@< getServiceToken
    function getServiceToken (iNtoken, iNuid,iNfunction) {
      /*
        @discr
          check token by token and service id
        @inputs
          @required
            iNtoken -> string
            iNuid -> string
          @optional
            iNfunction -> function
        @return
          void, callback
      */
      if (
        typeof(iNtoken) != 'string' ||
        typeof(iNuid)   != 'string'
      ) return false;
      var params = {
        'table'     :  table,
        'mask'      :  "#uid = :uid and #token = :token",
        'keys'      :  {"#uid":"uid","#token":"token"},
        'vals'      :  {":uid":iNuid,"#token":iNtoken},
      };
      DINAMO.query(params,function (err,data) {
        if(err) {
          console.error("ERROR IN getServiceToken",err);
        }
        if( typeof(iNfunction) == 'function' ) iNfunction(err,data);
      });
    }
//@> getServiceToken


//@< joinUserTokenToServiceToken
  function joinUserTokenToServiceToken () {

  }
//@> joinUserTokenToServiceToken
