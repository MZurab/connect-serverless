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
    var LINKS       = require("./input/connect_links/links");
    var MESSAGE     = require("./input/connect_chat/message");
    var STORAGE     = require("./input/firebase/storage");
    // var DICTIONARY    = require("./input/connect_dictionary/dictionary");
    // var PAGE      = require("./input/connect_page/page");
    // var FIREBASE  = require("./input/firebase/firebase");

    // log on
    LOG.on();
    LOG.print('START');

    CONNECT.setHeader(event);
    var HEADER = CONNECT.getHeader(['*']);
    var DATA   = HEADER['data'];
    var TYPE   = HEADER['type'];

    var apiType     = CONNECT.getUrlParam('type');
    LOG.print('apiType' , apiType);
    LOG.print('DATA' , DATA);
    if (
        typeof(apiType) == 'string'
    ) {

      // get downloadurl for chat msg
      if (
          apiType == 'chat' &&
          (typeof DATA['uid']     == 'string' && DATA['uid']) &&
          (typeof DATA['token']   == 'string' && DATA['token']) &&
          (typeof DATA['msgId']   == 'string' && DATA['msgId']) &&
          (typeof DATA['chatId']  == 'string' && DATA['chatId'])
        ) {
        /*
          @scriptId = #1
          uid
          chatId
          token
          msgId
        */
        // init params
        const result = {};
        var myUID   = DATA['uid'], myTOKEN = DATA['token'], chatId = DATA['chatId'], msgId = DATA['msgId'], pseudouser = DATA['pseudouser'];

        // chek token for auth user
        CONFIRM.getSignInSmsToken (
          myUID ,
          {'token':myTOKEN,'status':5} ,
          function (errCheckToken,dataCheckToken) {
              if ( errCheckToken || dataCheckToken.Count < 1) {
                  //ERROR (2) This user's token is not legal
                  var errorObject = LOG.defaultErrorMessage(1,2,"This user's token is not legal");
                  result['status']  = 0;
                  result['error']   = errorObject;
                  context.succeed(result);
                  return;
              }
                //SUCCESS (1.2) This user token is legal -> we check access for this chat
                LOG.step(1,2,"This user's token is legal",dataCheckToken);


                funct_fromFourStep = (forUser) => {
                  CHAT.checkAccessToChatByUid(
                    chatId,
                    forUser,
                    (errFromChat,dataFromChat) => {
                      if ( errFromChat || (typeof dataFromChat == 'object' && dataFromChat.status != 1) ) {
                        //ERROR (1.4) This user has not access to this group
                        var errorObject = LOG.defaultErrorMessage(1,4,'This user has not access to this chat',errFromChat,dataFromChat);
                        result['status']  = 0;
                        result['error']   = errorObject;
                        context.succeed(result);
                        return;
                      }
                      //SUCCESS (1.4) This user has access to this chat -> we have to get link
                      LOG.step(1,4,'This user has access to this chat',dataFromChat);

                      LINKS.checkChatLinkByMsgId (
                        chatId,
                        msgId,
                        (errFromLink, dataFromLink) => {
                          if (errFromLink) {
                            //ERROR (1.5) We has not link -> we create it
                            LOG.defaultErrorMessage(1,5,'We has not link -> we create it',errFromLink,dataFromLink);

                            // get msg src => prepare link -> create link => output link
                            MESSAGE.getMessage (
                              chatId,
                              msgId,
                              (errFromMessage, dataFromMessage) => {
                                if (errFromMessage){
                                  //ERROR (1.6) This message is not exist
                                  var errorObject = LOG.defaultErrorMessage(1,6,'This message is not exist',errFromMessage,dataFromMessage);
                                  result['status']  = 0;
                                  result['error']   = errorObject;
                                  context.succeed(result);
                                  return;
                                }
                                //SUCCESS (1.6) This message is exists => preparing link => creating link
                                LOG.step( 1, 6, 'This message is exists => preparing link', dataFromMessage);

                                // prepare message link to storage
                                const linkToStorage = MESSAGE.getMessageLinkToStorage (chatId, msgId, dataFromMessage);
                                LOG.step( 1, 6.1, 'We get link to storage => get expired signed link', linkToStorage);

                                // get signed link (1.7)
                                STORAGE.getSignedUrlForRead12Hour (
                                  'connect-9109d.appspot.com',
                                  linkToStorage,
                                  (errSignedUrl, dataSignedUrl) => {
                                    if (errSignedUrl) {
                                        //ERROR (1.7) Could not get signed url
                                        var errorObject = LOG.defaultErrorMessage( 1, 7, 'Could not get signed url', errSignedUrl, dataSignedUrl);
                                        result['status']  = 0;
                                        result['error']   = errorObject;
                                        context.succeed(result);
                                        return;
                                    }
                                    //SUCCESS (1.7) We have get signed url => we add to db => output
                                    LOG.step ( 1, 7, 'We have get signed url => we add to db => output ', dataSignedUrl );

                                    // add link to db (1.8)
                                    LINKS.addChatLinkByMsgId (
                                      chatId,
                                      msgId,
                                      myUID,
                                      dataSignedUrl,
                                      linkToStorage,
                                      (errCreatedLink,dataCreatedLink) => {
                                        if (errCreatedLink) {
                                          //ERROR (1.8) We cannot add to db created signed link
                                          var errorObject = LOG.defaultErrorMessage(1,8,'We cannot add to db created signed link',errCreatedLink,dataCreatedLink);
                                          result['status']  = 0;
                                          result['error']   = errorObject;
                                          context.succeed(result);
                                          return;
                                        }
                                        //SUCCESS (1.8) We have added to db created signed link => output
                                        LOG.step( 1, 8, 'We have added to db created signed link => output', dataCreatedLink);
                                        result['status']  = 1;
                                        result['link']  = dataSignedUrl;
                                        context.succeed(result);
                                        return;
                                        // FINISH


                                      }
                                    );
                                  }
                                );

                              }
                            );
                            return;
                          }

                          //SUCCESS (1.5) We has link -> we output it
                          LOG.step (1,5,'We has link -> we output it', dataFromLink);
                          result['status']  = 1;
                          result['link']    = dataFromLink.link;
                          context.succeed(result);
                          return;

                        }
                      );



                      //we have to get message content src
                      // LOG.step(1,3,'This user has access to this chat',dataFromChat);
                      // CHAT.getMessage (
                      //   chatId,
                      //   msgId,
                      //   (errFromMessage,dataFromMessage) => {
                      //
                      //   }
                      // );

                    }
                  );
                }


                ////// pseudouser block
                if( typeof pseudouser != 'string' || pseudouser == myUID ) {
                  //ERROR (1.3) This user has not pseudouser -> we have to check access to chat for main user
                  var errorObject = LOG.defaultErrorMessage(1,3,'This user has not pseudouser -> we have to check access to chat for main user', myUID, pseudouser );
                  funct_fromFourStep(myUID);
                  return;
                }

                //SUCCESS (1.3) This user has pseudouser => we check access to pseudouser
                LOG.step(1,3,'This user has pseudouser => we check access to pseudouser', pseudouser);

                USER.checkAccessToPseudoUser (
                  myUID,
                  pseudouser,
                  ( errAccessToPseudoUser, dataPseudoUser ) => {
                    if (errAccessToPseudoUser) {
                      //ERROR (1.3.1) This user has not access to pseudouser => output error
                      var errorObject = LOG.defaultErrorMessage(1,3.1,'This user has not access to pseudouser.' , errAccessToPseudoUser, dataPseudoUser );
                      result['status']  = 0;
                      result['error']   = errorObject;
                      context.succeed(result);
                      return;
                    }

                    //SUCCESS (1.3.1) This user has access to pseudouser =>  we have to check access to chat for pseudo user
                    LOG.step(1,3.1,'This user has access to pseudouser =>  we have to check access to chat for pseudo user', errAccessToPseudoUser, dataPseudoUser);
                    funct_fromFourStep(pseudouser);
                    return;
                  }
                );

                ////// pseudouser block





          }
        );
        //check user token + device type check
        // var result = {};
        // if( typeof(DATA['uid']) == 'string' && typeof DATA['token'] == 'string' ) {
        //   CONFIRM.getSignInSmsToken ( myUID , {'token':myTOKEN,'status':5} , function (errCheckToken,dataCheckToken) {
        //     //get sms token for check access via sms token
        //
        //     LOG.printObject('CONFIRM.getSignInSmsToken apiLogin,  myUID, {}', apiLogin, myUID, {'token':myTOKEN,'status':5});
        //     LOG.printObject('CONFIRM.getSignInSmsToken errCheckToken, dataCheckToken', errCheckToken, dataCheckToken);
        //
        //     if( !errCheckToken && dataCheckToken.Count > 0) {
        //       USER.getUserByLogin (apiLogin,'@system',functionGetUserByLogin);
        //     } else {
        //       result['status'] = 0;
        //       context.succeed(result);
        //     }
        //   });
        // } else {
        //   USER.getPublicUserByLogin (apiLogin,'@system',functionGetUserByLogin);
        // }

      } // create chat

    }

}
