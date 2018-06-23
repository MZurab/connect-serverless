exports.handler = (event, context, callback) => {
    //implement
    const CONNECT     = require('./input/connect');
    const LOG         = require('ramman-z-log');
    //var DINAMO      = require("./input/aws/dinamo");
    //var ACCESS      = require("./input/connect_access/access");
    const CONFIRM     = require("./input/connect_access/confirm");
    const USER        = require("./input/connect_users/users");
    const CATEGORY    = require("./input/connect_category/category");
    const CHAT        = require("./input/connect_chat/chat");
    // var DICTIONARY    = require("./input/connect_dictionary/dictionary");
    const PAGE        = require("./input/connect_page/page");
    const APP         = require("./input/connect_app/app");

    //enable log
    LOG.on();

    CONNECT.setHeader(event);
    const HEADER = CONNECT.getHeader(['*']);
    const DATA   = HEADER['data'];
    const TYPE   = HEADER['type'];

    var apiType  = CONNECT.getUrlParam('type');
    var apiLogin   = CONNECT.getUrlParam('uid');
    LOG.printObject('DATA start',DATA);



    var result = {};
    // var vUserDomain = APP.getUserDomain();
      // if(vUserDomain)
      //   result['accessDomain'] = result['']
    if(
        typeof(apiType) == 'string' && typeof(apiLogin) == 'string'
    ) {
      if (apiType == 'info' ) {
        // get user public with categories and all info via token, uid from GET
        //check user token + device type check
        var functionForGetStructureUserByLogin = function (userData) {
          LOG.printObject('USER.getStructuredUserByLogin', userData);
          if (typeof userData == 'object' ) {
            result['status']  = 1;
            result['user']    = userData;
            CATEGORY.getStructuredCategory( userData['uid'] , {
              'status'  :0,
              'by'      :'type',
              'type'    :'@system-menu'
            }, function (catData) {
              LOG.printObject('getStructuredCategory result $catData',catData);
              if ( typeof catData == 'object' ) {
                // if we have categories
                result['categories'] = catData['categories'];
              }
              CHAT.getChiefChatIdByUid (myUID,userData['uid'],function (memberData) {
                  result['chat']  =  memberData;
                  context.succeed(result);
              });
            });
          }else {
            result['status'] = 0;
            context.succeed(result);
          }
        };

        // del all gap and  spaces
        DATA['userId'] = DATA['userId'].replace(/[ ]+/g,'');

        if( typeof(DATA['userId']) == 'string' && DATA['userId'].length > 0 && typeof DATA['token'] == 'string') {
          var myUID   = DATA['userId'], myTOKEN = DATA['token'];
          CONFIRM.getSignInSmsToken (myUID,{'token':myTOKEN,'status':5},function (errCheckToken,dataCheckToken) {
            LOG.printObject('CONFIRM.getSignInSmsToken errCheckToken,dataCheckToken', errCheckToken,dataCheckToken);

            if( !errCheckToken && dataCheckToken.Count > 0){
              // CHAT.getChiefChatIdByUid (myUID,apiLogin,function (memberData) {
                  // result['chat']  = memberData;
                  LOG.printObject('USER.getStructuredUserByLogin @ start',apiLogin);
                  USER.getStructuredUserByLogin (apiLogin,'@system',functionForGetStructureUserByLogin,'@');

              // });
            } else {
              result['status'] = 0;
              context.succeed(result);
            }
          });

        } else {

          LOG.printObject('USER.getStructuredUserByLogin ? start',apiLogin);
          USER.getStructuredUserByLogin (apiLogin,'@system',functionForGetStructureUserByLogin,'?');
        }




      }
    }

}
