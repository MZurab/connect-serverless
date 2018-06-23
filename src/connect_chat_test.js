exports.handler = (event, context, callback) => {
    //implement
    var CONNECT     = require('./input/connect');
    const LOG       = require('ramman-z-log');
    //var DINAMO      = require("./input/aws/dinamo");
    //var ACCESS      = require("./input/connect_access/access");
    var CONFIRM     = require("./input/connect_access/confirm");
    // var USER        = require("./input/connect_users/users");
    // var CATEGORY    = require("./input/connect_category/category");

    var CHAT        = require("./input/connect_chat/chat");
    var USER        = require("./input/connect_users/users");
    // var DICTIONARY    = require("./input/connect_dictionary/dictionary");
    // var PAGE      = require("./input/connect_page/page");
    // var FIREBASE  = require("./input/firebase/firebase");

    // log on
    LOG.on();

    CONNECT.setHeader(event);
    var HEADER = CONNECT.getHeader(['*']);
    var DATA   = HEADER['data'];
    var TYPE   = HEADER['type'];

    var apiType  = CONNECT.getUrlParam('typeUrl');
    var apiLogin   = CONNECT.getUrlParam('userUrl');


    // output init data
    LOG.step(0, 0, 'Init date', 'EVENT', event, 'DATA', DATA, 'TYPE',TYPE, apiType, apiLogin );

    if (
        typeof(apiType) == 'string' && typeof(apiLogin) == 'string'
    ) {


      if (apiType == 'createPrivateChat') {
        // get user public with categories and all info via token, uid from GET
        var myUID   = DATA['uid'], myTOKEN = DATA['token'], result = {}, pseudouser = DATA['pseudouser'], activeUser;

        var functionGetUserByLogin = (errUser,dataUser) => {
          if (errUser || dataUser.Count < 1 ) {
            //ERROR (1.5) We cannot get user by login
            var errorObject = LOG.defaultErrorMessage(1,5,'We cannot get user by login' ,errUser,dataUser);
            result['status']  = 0;
            result['error']   = errorObject;
            context.succeed(result);
            return;
          }
          //SUCCESS (1) We get user by login -> we get main chat id
          LOG.step(1,5,'We get user by login -> we get main chat id ' ,errUser, dataUser);

          var thisUserData  = dataUser.Items[0],
              thisUserId    = thisUserData['uid'];

          ///
          CHAT.getChiefChatIdByUid (
            activeUser,thisUserId,
            function (chatData) {
              if ( !chatData ) {
                //ERROR (1.6) This chat is not exist -> get triggers for chat
                var errorObject   = LOG.defaultErrorMessage(1,6,'This chat is not exist -> get triggers for chat' , chatData);

                CHAT.trigger.getTriggerForMainChat (
                  thisUserId,
                  {},
                  (errTrigger,dataTrigger) => {
                    if ( errTrigger || typeof dataTrigger.payload != 'object') {
                      //ERROR (1.7) This user has not trigger for event - create main chat in usual mode
                      var errorObject   = LOG.defaultErrorMessage(1,7,'This user has not trigger for event' , errTrigger, dataTrigger);

                      CHAT.addMainChat (
                        { 'with':activeUser,      'users':[thisUserId]  },
                        { 'with':thisUserId,      'users':[activeUser]  },
                        '@system',
                        (errMainChat,dataMainChat) => {
                          if (errMainChat) {
                            //ERROR (1.8) We cannot create main chat -> output error
                            var errorObject   = LOG.defaultErrorMessage(1,8,'We cannot create main chat' , errMainChat, dataMainChat);
                            result['status']  = 0;
                            result['error']   = errorObject;
                            context.succeed(result);
                            return;
                          }

                          //SUCCESS (1.8) We created main chat -> output result
                          LOG.step(1,8,'We createed main chat -> create main chat with rule from trigger',errMainChat,dataMainChat);

                          result['status'] = 1;
                          result['chat']   = dataMainChat['chatId'];
                          context.succeed(result);
                          return;

                        }
                      );
                      // CHAT.addPrivateChat (
                      //   {
                      //     'uid':myUID,
                      //     'for':thisUserId
                      //   } ,
                      //   ( errChatToken, dataChatToken ) => {
                      //
                      //     if (errChatToken) {
                      //       //ERROR (1.4) We cannot create main chat -> output error
                      //       var errorObject   = LOG.defaultErrorMessage(1,4,'We cannot create main chat' , errChatToken, dataChatToken);
                      //       result['status']  = 0;
                      //       result['error']   = errorObject;
                      //       context.succeed(result);
                      //       return;
                      //     }
                      //     //SUCCESS (1.4) We created main chat -> output result
                      //     LOG.step(1,4,'This user has not trigger for event - create main chat with rule from trigger',errChatToken, dataChatToken);
                      //
                      //     result['status'] = 1;
                      //     result['chat']   = dataChatToken['chatId'];
                      //     context.succeed(result);
                      //     return;
                      //   }
                      // );
                      return;
                    }

                    //SUCCESS (1.7) This user has trigger for event - create main chat with rule from trigger
                    LOG.step(1,7,'This user has trigger for event - create main chat with rule from trigger', errTrigger, dataTrigger);


                    CHAT.addMainChat (
                      { 'with':activeUser,      'users':[thisUserId].concat(dataTrigger.payload.users)  },
                      { 'with':thisUserId,      'users':[activeUser]  },
                      '@system',
                      (errMainChat,dataMainChat) => {
                        if (errMainChat) {
                          //ERROR (1.8.1) We cannot create main chat -> output error
                          var errorObject   = LOG.defaultErrorMessage(1,8.1,'We cannot create main chat' , errMainChat, dataMainChat);
                          result['status']  = 0;
                          result['error']   = errorObject;
                          context.succeed(result);
                          return;
                        }

                        //SUCCESS (1.8.1) We created main chat -> output result
                        LOG.step(1,8.1,'We createed main chat -> create main chat with rule from trigger',errMainChat,dataMainChat);

                        result['status'] = 1;
                        result['chat']   = dataMainChat['chatId'];
                        context.succeed(result);
                        return;

                      }
                    );
                    return;
                  }
                )
                return;
              }

              //SUCCESS (1.6) The chat has already exist -> output chatid
              LOG.step(1,6,'The chat is exist -> output result', chatData );

              result['status']  = 1;
              result['chat']    = chatData;
              context.succeed(result);
              return;

            }
          );
            ///
        }

        if( typeof(DATA['uid']) == 'string' && typeof DATA['token'] == 'string' ) {
          //SUCCESS (1.0) Authed mode -> check user token
          LOG.step(1,0,'Authed mode', DATA );

          CONFIRM.getSignInSmsToken (
              myUID ,
              {'token':myTOKEN,'status':5},
              function (errCheckToken,dataCheckToken) {

              if( errCheckToken || dataCheckToken.Count < 1 ) {
                //ERROR (1.2) This token is not valid -> output error
                var errorObject = LOG.defaultErrorMessage(1,2,'This token is not valid' , errCheckToken, dataCheckToken );
                result['status']  = 0;
                result['error']   = errorObject;
                context.succeed(result);
                return;
              }

              //SUCCESS (1.2) This token is legal -> check request for isset pseudouuser
              LOG.step(1, 2, 'This token is legal => check request for isset pseudouuser', errCheckToken, dataCheckToken );


              if( typeof DATA['pseudouser'] != 'string' || myUID == pseudouser) {
                //ERROR (1.3)  In request has not pseudouser -> we get chat in usial mode
                var errorObject = LOG.defaultErrorMessage(1,3,'In request has not pseudouser' , DATA, myUID, pseudouser);
                activeUser = myUID;
                USER.getUserByLogin (apiLogin,'@system',functionGetUserByLogin);
                return;
              }

              //SUCCESS (1.3) In request has pseudouser => we check acces to pseudouser
              LOG.step(1, 3, 'In request has pseudouser => we check acces to pseudouser', DATA, myUID, pseudouser );

              USER.checkAccessToPseudoUser (
                myUID,
                pseudouser,
                ( errAccessToPseudoUser, dataPseudoUser ) => {
                  if (errAccessToPseudoUser) {
                    //ERROR (1.3.1) This user has not access to pseudouser => output error
                    var errorObject = LOG.defaultErrorMessage(1,3.1,'This user has not access to pseudouser' , errAccessToPseudoUser, dataPseudoUser );
                    result['status']  = 0;
                    result['error']   = errorObject;
                    context.succeed(result);
                    return;
                  }

                  //SUCCESS (1.3.1) This user has access to pseudouser => chat for activeUser
                  LOG.step(1, 3.1, 'This token is legal ->  getchat for pseudouser', errCheckToken, dataCheckToken );
                  activeUser = pseudouser;
                  USER.getUserByLogin (apiLogin,'@system',functionGetUserByLogin);
                  return;
                }
              );


            }
          );
          return;
        }

        //ERROR (1.0) This user is unsigned -> get chat for unsigned user
        var errorObject = LOG.defaultErrorMessage(1, 0, 'This user is unsigned' , DATA );
        USER.getPublicUserByLogin ( apiLogin, '@system', functionGetUserByLogin );


      } // create chat

    }

}
