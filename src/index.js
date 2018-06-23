exports.handler = (event, context, callback) => {
    // TODO implement
    const LOG         = require('ramman-z-log');
    const crypto      = require('crypto');
    const AWS         = require("aws-sdk");
    const http        = require('http');





    var _uuid_ = require('node-uuid');
    AWS.config.update({
        region: "eu-west-1",
        endpoint: "https://dynamodb.eu-west-1.amazonaws.com"
    });

// event['body-json'] = {};
// event['body-json'].user = 'zurab';
// event['body-json'].code = '2974';
// event['body-json'].type = "checkCode";
// event['body-json'].token = 'iMhblfYydNOuQmgaNjtnjrIfPzPCy2co';

    if( typeof(event['body-json']) == 'undefined'){
        callback(null,{'status':0,'ru':'Нет входных данных.'});
        return 0;
    }

    var ij = event['body-json'];

    var docClient = new AWS.DynamoDB.DocumentClient();




    function GetUrl(url) {
        LOG.printObject('start request to ' + url)
        http.get(url, function(res) {
            LOG.printObject("Got response: " + res.statusCode);

        }).on('error', function(e) {
            LOG.printObject("Got error: " + e.message);
        });

    }

//<<<@ WORK WITH DINAMO
    function DinamaDbAdd(table,iNdata){
        var params = {
            TableName:table,
            Item:iNdata
        };
        docClient.put(params, function(err, data) {
            if (err) {
                return err;
            } else {
                return true;
            }
        });
    }
    //Dinamo DB delete
    function DinamoDbDel (iNobject) {
        /*
         1 - iNobject
         @required
         table       String
         key         Object
         @
         vals        String (":val": 5.0)
         cond        String ("info.rating <= :val")
         */
        var params = {
            TableName : iNobject.table,
            Key: iNobject.key,
        };
        if( typeof(iNobject.vals) != 'undefined' && iNobject.vals !== false)
            params.ExpressionAttributeValues = iNobject.vals;
        if( typeof(iNobject.cond) != 'undefined' && iNobject.cond !== false)
            params.ConditionExpression = iNobject.cond;
        // if( typeof(iNobject.keys) != 'undefined' && iNobject.keys !== false)
        //     params.ExpressionAttributeNames = iNobject.keys; // "#yr": "year"
        // if( typeof(iNobject.mask) != 'undefined' && iNobject.mask !== false)
        //     params.KeyConditionExpression = iNobject.mask; //"#yr = :yyyy",


        docClient.delete(params, function(err, data) {
            if (err) {
                console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
                return false;
            } else {
                LOG.printObject("Deleted Item succeeded:", JSON.stringify(data, null, 2));
                return true;
            }
        });
    }
    //Dinamo DB update
    function DinamoDbUpdate (iNobject) {
        /*
         1 - iNobject
         @required
         table
         key
         set
         vals
         keys
         */
        var params = {
            TableName : iNobject.table,
            ReturnValues:"UPDATED_NEW"
        };
        if( typeof(iNobject.keys) != 'undefined' && iNobject.keys !== false)
            params.ExpressionAttributeNames = iNobject.keys; // "#yr": "year"


        if( typeof(iNobject.key) != 'undefined' && iNobject.key !== false)
            params.Key = iNobject.key; //{ "year": year, "title": title }

        if( typeof(iNobject.set) != 'undefined' && iNobject.set !== false)
            params.UpdateExpression = iNobject.set; // "set info.rating = :r, info.plot=:p, info.actors=:a"

        if( typeof(iNobject.vals) != 'undefined' && iNobject.vals !== false)
            params.ExpressionAttributeValues = iNobject.vals; // ":yyyy":1985

        docClient.update(params, function(err, data) {
            if (err) {
                console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                return false;
            } else {
                LOG.printObject("UpdateItem succeeded:", JSON.stringify(data, null, 2));
                return true;
            }
        });
    }
    //Dinamo DB query
    function DinamoDbQuery (iNobject,onQuery) {
        var params = {
            TableName : iNobject.table
        };
        if( typeof(iNobject.limit) != 'undefined' )
            params.Limit = iNobject.limit;

        if( typeof(iNobject.last) != 'undefined' )
            params.ExclusiveStartKey = iNobject.last;

        if( typeof(iNobject.index) != 'undefined' )
            params.IndexName = iNobject.index;

        if( typeof(iNobject.order) != 'undefined' ) {
           if(iNobject.order == 'desc'){
              params.ScanIndexForward = false;
           } else {
              params.ScanIndexForward = true;
           }
        }

        if( typeof(iNobject.select) != 'undefined' && iNobject.select !== false)
            params.ProjectionExpression = iNobject.select; // "#yr, title, info.genres, info.actors[0]",

        if( typeof(iNobject.mask) != 'undefined' && iNobject.mask !== false)
            params.KeyConditionExpression = iNobject.mask; //"#yr = :yyyy",

        if( typeof(iNobject.keys) != 'undefined' && iNobject.keys !== false)
            params.ExpressionAttributeNames = iNobject.keys; // "#yr": "year"

        if( typeof(iNobject.vals) != 'undefined' && iNobject.vals !== false)
            params.ExpressionAttributeValues = iNobject.vals; // ":yyyy":1985

        docClient.query(params, onQuery);
    }
    //Dinamo DB scan
    function DinamoDbScan (iNobject,onScan) {
        var params = { TableName : iNobject.table };
        // params.ConsistentRead = false;


        if( typeof(iNobject.limit) != 'undefined' )
            params.Limit = iNobject.limit;

        if( typeof(iNobject.last) != 'undefined' )
            params.ExclusiveStartKey = iNobject.last;

        if( typeof(iNobject.index) != 'undefined' )
            params.IndexName = iNobject.index;

        if( typeof(iNobject.order) != 'undefined' ) {
           if(iNobject.order == 'desc'){
              params.ScanIndexForward = false;
           } else {
              params.ScanIndexForward = true;
           }
        }
        if( typeof(iNobject.select) != 'undefined' && iNobject.select !== false)
            params.ProjectionExpression = iNobject.select; // "#yr, title, info.genres, info.actors[0]",

        if( typeof(iNobject.mask) != 'undefined' && iNobject.mask !== false)
            params.FilterExpression = iNobject.mask; //"#yr = :yyyy",

        if( typeof(iNobject.keys) != 'undefined' && iNobject.keys !== false)
            params.ExpressionAttributeNames = iNobject.keys; // "#yr": "year"

        if( typeof(iNobject.vals) != 'undefined' && iNobject.vals !== false)
            params.ExpressionAttributeValues = iNobject.vals; // ":yyyy":1985


        docClient.scan(params, onScan);
    }
//>>>@ WORK WITH DINAMO

//<<<@ WORK WITH CONNECT FUNCTIONS
    // add user
    function Connect_addUser(iNdata){
        var table = "connect-user";
        iNdata.id = Connect_getRandomKeyByUuid();
        return DinamaDbAdd(table,iNdata);
    }

    // get random key NEED var _uuid_ = require('node-uuid'); 128-bit number

    function Connect_getRandomKeyByUuid () {
        return _uuid_.v4();// e.g. 32a4fbed-676d-47f9-a321-cb2f267e2918
    }

    // generate Random values from limited set of characters NEED CRYPTO var crypto = require('crypto');
    function Connect_getRandomKeyWithChars (howMany, chars) {

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


    // encrypt AND decrypt BY AES NEED CRYPTO var crypto = require('crypto');
    var _algorithm_ = 'aes-256-ctr', _password_ = 'd6F3Efeq';
    function Connect_encryptByAes(text){
        var cipher = crypto.createCipher(_algorithm_,_password_)
        var crypted = cipher.update(text,'utf8','hex')
        crypted += cipher.final('hex');
        return crypted;
    }

    function Connect_decryptByAes(text){
        var decipher = crypto.createDecipher(_algorithm_,_password_)
        var dec = decipher.update(text,'hex','utf8')
        dec += decipher.final('utf8');
        return dec;
    }
    function Connect_sendSms (smsText,phone) {
        var smsText = encodeURIComponent(smsText);
        var urlSms = "http://bsms.tele2.ru/api/?operation=send&login=ht887624043&password=rrDwQqsN&msisdn="+phone+ "&shortcode=RammanPay&text="+smsText;
        GetUrl(urlSms);

    }
    // get user
    function Connect_getUserByLoginAndPswd(){
        DinamoDbScan(
            {
                'table':'connect-user',
                // 'select': "login",
                'mask' : "#login = :login and #pswd = :pswd",
                'keys' : {"#login": "login","#pswd":"pswd"},
                'vals' : {":login":"zurab",":pswd": '1q2w3e4r5t'}

            }
        );
    }
    function ClearDeadTokenByDeviceField (userData) {
        // если токены не подтвержденны () и просроченны на 15 минут (900 секунд) то мы их удаляем
        var nowTime = new Date().getTime();
        var deviceIN = userData.device;
        var id = userData.id;
        var countDels = 1;
        for(var key in deviceIN) {
            thisDevice = deviceIN[key];
            var deadSmsCodeTime = thisDevice.created + 900000;
            var status = thisDevice.status;
            if( status == 0 && deadSmsCodeTime < nowTime){
                delete deviceIN[key];
                countDels++;

            }
        }
        if(countDels > 1)
            DinamoDbUpdate(
                {
                    'table':'connect-user',
                    'key': {"id":id},
                    'set' : "set #d = :d",
                    'keys' : {"#d":"device"},
                    'vals' : {":d": deviceIN}

                }
            );
    }
//>>>@ WORK WITH CONNECT FUNCTIONS

    //Connect_getUserByLoginAndPswd();
    // DinamoDbUpdate(
    //     {
    //         'table':'connect-user',
    //         'key': {"phone":79287377782, "login":"zurab"},
    //         'set' : "set #pswd = :pswd",
    //         'keys' : {"#pswd":"pswd"},
    //         'vals' : {":pswd": '1234'}

    //     }
    // );
    // DinamoDbDel({
    //     'table':'connect-user',
    //     'key': {"login":"zurab",'phone':79287377782},
    //     //'cond': "pswd = :pswd",
    //     //'keys': {"#pswd":"pswd"},
    //     //'vals': {":pswd":'1'}
    // });


    // var rk = Connect_getRandomKeyByUuid();
    // LOG.printObject(rk);

    // Connect_addUser({
    //   'phone':79287377782,
    //   'login':'zurab',
    // });





    ///@< access api
    function Connect_rolesGetPermissionForApi (iNseviceId, iNcode, iNapiData, iNafterFunction) {
      /*
        Check access to action in service by service id,iNcode,iNapiData
        @in
          1 - iNseviceId - ид сервиса
          2 - iNcode - код действия
          3 - iNapiData - апи блок
            apiKey
            apiPswd
            ip
      */
      // Н

      DinamoDbQuery (
          {
              'table':'connect-base',
              // 'select': "login",
              'limit': 1,
              // 'order': "asc",
              'index': "uid-to-index",
              //  and (#data.ip = :ipAll or #data.ip = :userIp)
              'mask' : "#uid = :uid and #to = :to and #verification = :verification and #key = :key" ,// attribute_exists(#login)
              'keys' : { "#uid": "uid" , "#to":"to" , "#verification" : "verification" , "#key" : "key" },//
              'vals' : { ":uid" : "?" , ":to" : iNseviceId, ":verification" : "api" , ":key" : iNapiData.key } //

          }, onCheckApiAccess
      ); //

      function onCheckApiAccess ( err , data ) {
          if (err) {
              //console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
              LOG.printObject(err);
              callback(null,{'status':0,'text':'Wrong data!'});
              return 0;
          } else {
              LOG.printObject("Scan succeeded. Data counted = " + data.Count);
              if(data.Count < 1 ){
                  callback(null,{'status':0,'text':'Null data!'});
                  return 0;
              }
              var userData  = data.Items[0];
              var userIp = iNapiData.ip;
              // проверка разрешение на  правильные ключи и ip

              // check pswd and ip access
              if (
                  typeof(userData.data) != 'undefined' &&
                  userData.data.pswd == ij.pswd &&
                  ( userData.data.ip == '*' || userData.data.ip == userIp ) &&
                  typeof(data.actions) != 'undefined'
              ) {
                  // get access
                  if(data.Count > 2 ){
                    // если найденно только одно правило
                    var actions = data.actions;
                    var apps = Object.keys(data.actions);

                  }else{
                    // if founded many
                  }

              }
          } // if (err) {

      } // end function onCheckApiAccess

    } // end function Connect_rolesGetPermissionForApi
    ///@> access api



    function Connect_checkApiAccess () {
      DinamoDbScan(
          {
              'table':'app_market2',
              // 'select': "login",
              // 'limit': 3,
              'order': "asc",
              'index': "status-cost-index",
              'mask' : "#status = :status and #cost > :cost",
              'keys' : {"#status": "status","#cost": "cost"},
              'vals' : {":status":0,":cost":0}

          },onCheckApiAccess
      );
    }

        LOG.printObject('Connect_getRandomKeyByUuid() = now');
    LOG.printObject(Connect_getRandomKeyByUuid());

    ij.type = ij.type;
    ij.user = ij.user;
    ij.pswd = ij.pswd;
    // //'checkCode';//'signin';

    LOG.printObject(event);
    if ( typeof(ij.type) != 'undefined') {
        /*
         input
         type
         user
         pswd
         */
        // signIn (by login or phone) and pswd NEED [inUser,inPswd] [inUserAgent || androidCode || iosCode ]
        if( ij.type == 'api') {
          if( typeof(ij.uid) != 'undefined' && typeof(ij.key) != 'undefined' && typeof(ij.pswd) != 'undefined' ) {

              var userIp = 'ddd';

              function onCheckApiAccess(err, data) {
                  if (err) {
                      //console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
                      LOG.printObject(err);
                      callback(null,{'status':0,'text':'Wrong data!'});
                      return 0;
                  } else {
                      LOG.printObject("Scan succeeded. Data counted = " + data.Count);
                      if(data.Count < 1 ){
                          callback(null,{'status':0,'text':'Null data!'});
                          return 0;
                      }
                      var userData  = data.Items[0];

                      // проверка разрешение на  правильные ключи и ip
                      if ( typeof(userData.data) != 'undefined' && userData.data.key == ij.key && userData.data.pswd == ij.pswd && ( userData.data.ip == '*' || userData.data.ip == userIp ) ) {
                        LOG.printObject ( "Access is." );
                        LOG.printObject ( userData );

                        LOG.printObject( " Scan finished. " );
                        return userData;
                      } // if( userData.data.key == ij.key && userData.data.pswd == ij.pswd && ( userData.data.ip == '*' || userData.data.ip == userIp ) ) {


                      // if(typeof(data.LastEvaluatedKey) != 'undefined'){
                      //
                      //   LOG.printObject("Scan new.");
                      //   LOG.printObject('data.ExclusiveStartKey - ' + data.LastEvaluatedKey );
                      //   DinamoDbScan(
                      //       {
                      //           'table':'app_market2',
                      //           // 'select': "login",
                      //           'last':data.LastEvaluatedKey,
                      //           'limit': 3,
                      //           'order': "asc",
                      //           'index': "status-cost-index",
                      //           'mask' : "#cost > :cost",
                      //           'keys' : {"#cost": "cost"},
                      //           'vals' : {":cost":0}
                      //
                      //       },onScanForGetUserByUserAndPswd
                      //   );
                      //
                      // }


                  } // } else {
              } // function onCheckApiAccess(err, data) {

              DinamoDbQuery(
                  {
                      'table':'connect-user',
                      // 'select': "login",
                      'limit': 1,
                      // 'order': "asc",
                      'index': "login-index",
                      //  and (#data.ip = :ipAll or #data.ip = :userIp)
                      'mask' : "#login = :login ",// attribute_exists(#login)
                      'keys' : {"#login": "login",},//
                      'vals' : { ":login" : ij.uid  } //

                  },onCheckApiAccess
              );

            } // if( typeof(ij.uid) != 'undefined' && typeof(ij.key) != 'undefined' && typeof(ij.pswd) != 'undefined' &&  ){
        } // if( ij.type == 'api') {
    } // if ( typeof(ij.type) != 'undefined') {

};
