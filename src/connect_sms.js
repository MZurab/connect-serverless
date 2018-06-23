exports.handler = (event, context, callback) => {
    //implement
    const CONNECT     = require('./input/connect');
    const LOG         = require('ramman-z-log');
    //var DINAMO      = require("./input/aws/dinamo");
    const ACCESS      = require("./input/connect_access/access");
    //var USER        = require("./input/connect_access/user");
    // var DICTIONARY    = require("./input/connect_dictionary/dictionary");
    const BALANCE     = require("./input/connect_balance/balance");
    const ONEPAY      = require("./input/connect_onepay/onepay");
    const SMS         = require("./input/connect_sms/sms");

    // LOG.on();
    LOG.printObject ( 'event' ,  event);

    CONNECT.setHeader(event);
    const HEADER  = CONNECT.getHeader(['*']);
    const DATA    = HEADER['data'];
    const TYPE    = HEADER['type'];

    const URLPATH = CONNECT.getUrlParams();
    const RESULT  = {'status':0};

    LOG.printObject ( 'URLPATH' ,  URLPATH);
    LOG.printObject ( 'TYPE'    ,  TYPE);
    LOG.printObject ( 'DATA'    ,  DATA);
    LOG.printObject ( 'HEADER'  ,  HEADER);



    if (
      typeof URLPATH['uid']        == 'string' &&
      typeof URLPATH['type']       == 'string' &&  URLPATH['type'] == 'send' &&
      typeof URLPATH['provider']   == 'string' &&
      typeof URLPATH['version']    == 'string' &&
      TYPE == 'JSON'                           &&
      // typeof DATA['key']          == 'string' &&
      // typeof DATA['password']     == 'string' &&
      typeof DATA['to']           == 'object' && typeof DATA['to']['phone'] == 'string' &&
      typeof DATA['content']      == 'string'
	) {
      var loginAndPasswordMethodBasicAuth1 = CONNECT.getDataFromBasicAuthFromHeader();
      LOG.printObject('loginAndPasswordMethodBasicAuth1',loginAndPasswordMethodBasicAuth1);
      if( typeof loginAndPasswordMethodBasicAuth1 != 'object') {
        //ERROR we dont get login and password from header
        RESULT['error'] = {code:1};
        context.succeed(RESULT);
      } else {
        //SUCCESS we get login and password from header
        DATA['key']       = loginAndPasswordMethodBasicAuth1['login'];
        DATA['password']  = loginAndPasswordMethodBasicAuth1['password'];
      }
      // authorization
      LOG.printObject('DATA',DATA);
      var inData    = {};
        inData.key  = DATA['key'];            //'0626q05234fd64x4e718dh';
        inData.code = 'accessForSendSms';
        inData.to   = '@';
        inData.pswd = DATA['password'];     //'23rsd45';
        inData.ip   = CONNECT.getIp(event);
        inData.uid  = URLPATH['uid'];       //'0626c053-882c-456b-80f1-a864d4c718da';
        ACCESS.getAccessDataForApi( inData,
          (err,data,info) => {
            LOG.printObject('ACCESS.getAccessDataForApi',err,data,info);
            if (!err) {
              //SUCCESS we get api data -> we get permisson for send sms && for change balance
              const API_INFO = info;
              if ( URLPATH['provider'] == 'auto')
                var PROVIDER_NAME = API_INFO['default'];
              else
                var PROVIDER_NAME = URLPATH['provider'];

              permisionForCreateMessage       = ACCESS.getActionPermission("write","message","sms");
              permisionForChangeMainBallance  = ACCESS.getActionPermission("write","onepay","mainBalance");

              if(permisionForCreateMessage == permisionForChangeMainBallance && permisionForChangeMainBallance == 'full') {
                //SUCCESS we have permission for balance && sendSms -> we create bill

                // get cost of operation
                  // get message with translit if need
                  DATA['content'] = SMS.getContentOfMsgWithTranslateIfNeed(DATA);
                  const smsSize = SMS.getSizeOfSms(DATA['content']);
                  const smsCost = smsSize * 2;

                ONEPAY.createSystemBillAndPayByBalance (
                  {
                    'uid_buyer'   : URLPATH['uid'],
                    'uid_seller'  : '@system',
                    'summ'        : smsCost,
                    'name'        : 'Оплата смс (' + smsSize + 'шт)',
                    'type'        : 'real',
                  },
                  (err,data) => {
                    LOG.printObject('ONEPAY.createSystemBillAndPayByBalance err,data', err,data);
                    if(!err && typeof API_INFO[ PROVIDER_NAME ] == 'object') {
                      //SUCCESS we add bill && update user balance -> we send sms && add to db

                      //Choose provider
                      var providerName, providerFunctionName;
                      var providerObject = SMS.getProvider (API_INFO,URLPATH['provider']);
                          LOG.printObject('providerObject',providerObject);
                          providerName          = providerObject['name'];
                          providerFunctionName  = providerObject['functionName'];

                      LOG.printObject('SMS providerName providerFunctionName', providerName, providerFunctionName);
                      SMS [providerFunctionName] (
                          {
                            'operator_pswd'   : API_INFO[providerName]['pswd'],//'rrDwQqsN',
                            'operator_login'  : API_INFO[providerName]['login'],//'ht887624043',
                            'content'         : DATA['content'],
                            'to'              : DATA['to']['phone'],
                            'sender'          : API_INFO[providerName]['sender'],
                            'proxy'           : API_INFO[providerName]['proxy'],
                            // for megafon
                            'callback_url'    : API_INFO[providerName]['callback_url'],
                          },
                          ( err, messageId, response ) => {
                            LOG.printObject('SMS ' + providerFunctionName,err, messageId, response );
                            if (!err) {
                              //SUCCESS we could send sms -> we add to db
                              SMS.addSmsToDb (
                                '@system',
                                {
                                  'operator'  : providerName,
                                  'phone'     : DATA['to']['phone'],//'79287377782',
                                  'content'   : DATA['content'],//'Тест2',
                                  'cost'      : smsCost,
                                  'key'       : messageId,
                                  'uid'       : URLPATH['uid'],
                                  'from'      : API_INFO[providerName]['sender'],
                                  'answer'    : response,
                                },
                                (err,data) => {
                                    if(!err) {
                                      //SUCCESS we added to db
                                      RESULT['status']  = 1;
                                      RESULT['msgId']   = data['id'];
                                      context.succeed(RESULT);
                                    }else {
                                      //ERROR we dont added to db
                                      RESULT['error'] = {code:7};
                                      context.succeed(RESULT);
                                    }
                                }
                              );


                            } else {
                              //ERROR we add bill && update user balance -> we send sms && add to db
                              RESULT['error'] = {code:6};
                              context.succeed(RESULT);
                            }
                          },
                          // add for get callback for megafon
                          {"uid":URLPATH['uid']}
                      );
                    }else {
                      //ERROR we cannot add bill && update user balance
                      RESULT['error'] = {code:5};
                      context.succeed(RESULT);
                  	}
                  }
                );
              }else {
                //ERROR we dont have permission -> return fail
                RESULT['error'] = {code:4};
                context.succeed(RESULT);
              }

            }else {
              //ERROR we dont get api data -> return fail
              RESULT['error'] = {code:3};
              context.succeed(RESULT);
            }
          }
        );
    } else {
      //ERROR we dont have all date
      RESULT['error'] = {code:2};
      context.succeed(RESULT);
    }







    // BALANCE.getSystemRealBalance ( "0626c053-882c-456b-80f1-a864d4c718da", 'rub',
    //   (err,data) => {
    //     LOG.printObject ( '1 getSystemRealBalance err'    ,  err);
    //     LOG.printObject ( '1 getSystemRealBalance data'  ,  data);
    //   }
    // )



    // SMS.sendSmsViaMegafon (
    //     {
    //       'operator_pswd'   : 'gzKJckJB',
    //       'operator_login'  : 'MSK_rcnnct',
    //       'content'         : 'Тестирование 7',
    //       'to'              : '79287377782',
    //       'sender'          : 'ramman.net',
    //     },
    //     ( err, messageId, response ) => {
    //       LOG.printObject('sendSmsViaMegafon err'       , err       );
    //       LOG.printObject('sendSmsViaMegafon messageId' , messageId );
    //       LOG.printObject('sendSmsViaMegafon response'  , response  );
    //     }
    // );

    // SMS.sendSmsViaTele2 (
    //     {
    //       'operator_pswd'   : 'rrDwQqsN',
    //       'operator_login'  : 'ht887624043',
    //       'content'         : 'Тестирование 6',
    //       'to'              : '7928',
    //       'sender'          : 'Ramman.net',
    //     },
    //     ( err, messageId, response ) => {
    //       LOG.printObject('sendSmsViaTele2 err'       , err       );
    //       LOG.printObject('sendSmsViaTele2 messageId' , messageId );
    //       LOG.printObject('sendSmsViaTele2 response'  , response  );
    //     }
    // );






    // var inData    = {};
    //   inData.key  = '0626q05234fd64x4e718dh';
    //   inData.code = 'accessForSendSms';
    //   inData.to   = '@';
    //   inData.pswd = '23rsd45';
    //   inData.ip   = CONNECT.getIp(event);
    //   inData.uid  = '0626c053-882c-456b-80f1-a864d4c718da';
    //   ACCESS.getAccessDataForApi( inData,
    //     (err,data) => {
    //
    //       permisionForCreateMessage       = ACCESS.getActionPermission("write","message","sms");
    //       permisionForChangeMainBallance  = ACCESS.getActionPermission("write","onepay","mainBalance");
    //       LOG.printObject ( 'getAccessDataForApi permisionForCreateMessage'    ,  permisionForCreateMessage);
    //       LOG.printObject ( 'getAccessDataForApi permisionForChangeMainBallance'    ,  permisionForChangeMainBallance);
    //       LOG.printObject ( 'getAccessDataForApi err'    ,  err);
    //       LOG.printObject ( 'getAccessDataForApi data'  ,  data);
    //     }
    //   );

    // var content  = DATA['content'],
    //     to       = DATA['to'],
    //     operator = DATA['operator'];
    //
    // if(
    //     typeof(DATA['c']) == 'string' ||
    //     typeof(DATA['id']) == 'string'
    // ) {
    //
    // }
    // var uid = DATA['uid'];
    // LOG.printObject('PAGE.getPage init');
    // PAGE.getPage(uid,DATA,function(err,data){
    //   LOG.printObject('PAGE.getPage start');
    //   if (!err) {
    //     LOG.printObject('PAGE.getPage !err');
    //     if( data['Count'] > 0 ) {
    //         LOG.printObject('PAGE.getPage count > 0');
    //         context.succeed(data['Items'][0]);
    //     }
    //   }
    // });
}
