const CONNECT   = require('./../connect');
const LOG     = require('ramman-z-log');
const FIREBASE  = require("./../firebase/firebase");
      const firestore = FIREBASE.firestore;
// var LFIREBASE = require("./../firebase/firebase");
const DINAMO    = require("./../aws/dinamo");
const TRIGGER   = require("./../connect_triggers/chat/trigger");
const USER      = require("./../connect_users/users");
const _         = {'trigger':TRIGGER};

var tableMsg      = 'connect-message',
    tableMember   = 'connect-member',
    tableChat     = 'connect-chat';

var functionAddress = 'connect_chat/chat.js';


// Array.prototype.getUniqueOf = function() {
//  var o = {}, a = [], i, e;
//  for (i = 0; e = this[i]; i++) {o[e] = 1};
//  for (e in o) {a.push (e)};
//  return a;
// }

//@< MEMBER
function getMember (iNdata,iNfunction) {
  /*
    @inputs
      @required
        iNfunction
        iNdata
          @required
            uid
            by
          @optinal
            for
            from
            status -> number
            id
            chatId
  */
  var functionAddress = '@file chat.js | $func getMember - ';
  if(typeof(iNdata['by']) != 'string')iNdata['by']='default';

  var isDoc = false;
  let pathToFireStoreDb = 'users/' + iNdata['uid'] + '/members';
  var firestoreRef = firestore().collection(pathToFireStoreDb);
  LOG.printObject(functionAddress, 'collection $pathToFireStoreDb',pathToFireStoreDb);

  if ( typeof(iNdata['by']) == 'string' ) {
    switch (iNdata['by']) {
      case "type":
        if( typeof(iNdata['type']) != 'number') break;
        firestoreRef = firestoreRef.where('type','==',iNdata['type']);
        LOG.printObject(functionAddress, 'by type $iNdata',iNdata);
      break;

      case "with":
        // for private chat
        if( typeof(iNdata['with']) != 'string') break;
        firestoreRef = firestoreRef.where('with','==',iNdata['with']);
        firestoreRef = firestoreRef.where('type','==',1);
        LOG.printObject(functionAddress, 'by with $iNdata',iNdata);
      break;

      case "chatId":
        if( typeof(iNdata['chatId']) != 'string') break;
        firestoreRef = firestoreRef.doc(iNdata['chatId']);
        LOG.printObject(functionAddress, 'by doc $iNdata',iNdata['chatId']);
        isDoc = true;
      break;

      case "owner":
        // if( typeof(iNdata['owner']) != 'string') break;
        // index = 'uid-owner-index'; objecrForQuery['index'] = index;
        // objecrForQuery = DINAMO.addByMask(iNdata,"owner",objecrForQuery,"string");
      break;

      case "status":
        if( typeof(iNdata['status']) != 'number') break;
        firestoreRef = firestoreRef.where('status','==', iNdata['status'] );
        LOG.printObject(functionAddress, 'by status $iNdata',iNdata);
      break;

      default:
        // if( typeof(iNdata['id']) != 'string') break;
        // objecrForQuery = DINAMO.addByMask(iNdata,"id",objecrForQuery);
        LOG.printObject(functionAddress, 'by default $iNdata',iNdata);
      break;
    }

  }


  // if ( typeof(iNdata['chatId'])=='string' && index != 'uid-chatId-index')
  //   objecrForQuery = DINAMO.addByMaskFilter(iNdata,"chatId",objecrForQuery,"string");

  if ( typeof(iNdata['for'])=='string' && iNdata['by'] != 'for' && iNdata['by'] != 'chatId')
      firestoreRef = firestoreRef.where(iNdata['for'],'==',1);

  if ( typeof(iNdata['type'])=='string' && iNdata['by'] != 'type' && iNdata['by'] != 'chatId')
      firestoreRef = firestoreRef.where('type','==',iNdata['type']);

  if ( typeof(iNdata['status'])=='number' && iNdata['by'] != 'status' && iNdata['by'] != 'chatId')
      firestoreRef = firestoreRef.where('status','==', iNdata['status'] );

  // if ( typeof(iNdata['owner'])=='string'  && && iNdata['by'] != 'owner' && iNdata['by'] != 'chatId')
  //   objecrForQuery = DINAMO.addByMaskFilter(iNdata,"owner",objecrForQuery);
  // LOG.printObject(functionAddress +  'getMember objecrForQuery',objecrForQuery);
  // DINAMO.query(objecrForQuery,iNfunction);

  firestoreRef.get().then(
    (doc) => {
      LOG.printObject(functionAddress, 'getMember',doc);
      if(isDoc) { // if a document
        if (doc.exists) {
            LOG.printObject(functionAddress,  "Document data:", doc.data());
            iNfunction(null,[doc]);
        } else {
            LOG.printObject(functionAddress,  "No such document!");
            iNfunction("No such document!",null);
        }
      } else { // if collection
        if ( !doc.empty ) {
            LOG.printObject(functionAddress,  "Collection data:", doc.docs);
            iNfunction(null,doc.docs);
        } else {
            LOG.printObject(functionAddress,  "No data in  collection!");
            iNfunction("No data in  collection!", null);

        }
      }
  });
  // .catch(
  //   (error) => {
  //       LOG.printObject(functionAddress, "Document error:", error);
  //       iNfunction(error,null);
  //   }
  // );
} _.getMember = getMember;



function pseudoUser_getObjectForAddToChat (iNpseudoUid) {
  /*
    @discr
      get object for add to chat as pseudMember
    @inputs
      @required
        iNowner -> string
          @default '@system'
  */
  var fname = 'pseudoUser_getObjectForAddToChat';
  LOG.fstep (fname, 1, 0, 'INVOKE - iNpseudoUid', iNpseudoUid);
  var objForReturn = {
    'status' : 1,
    'link'  : iNpseudoUid,
    'time'   : FIREBASE.getFirestoreSeverVarTimestamp()
  };
  LOG.fstep (fname,1,1,'END - return', objForReturn);
  return objForReturn;
}

function pseudoUser_createWithArrayAsPseudoMemberOfChat ( iNchatId, iNchiefUid, iNpseudoUidOfArray, iNfunction, iNdb, iNbatch ) {
    /*
      @discr
        add pseudousers as pseudoMember to chat
      @inputs
        @required
          iNchatId            -> string
          iNchiefUid          -> string
          iNpseudoUidOfArray  -> array of string
          iNpseudoId          -> string
          iNfunction          -> function
        @optinal
          iNdb
          iNbatch
    */
    var fname       = 'pseudoUser_createWithArrayAsPseudoMemberOfChat';//,
        // objectForDb = pseudoUser_getObjectForAddToChat(iNpseudoId);

    LOG.fstep (fname,1,0,'INVOKE - iNchatId, iNuid, iNpseudoUidOfArray, iNpseudoId', iNchatId, iNchiefUid, iNpseudoUidOfArray);

    for ( var iKey in iNpseudoUidOfArray ) {
      var pseudoUid = iNpseudoUidOfArray[iKey];
      if(typeof pseudoUid != 'string') continue;

      // self invoking closure for work with right key from array
      (
        () => {
          var thisKeyForUser      = iKey,
              lengthPseudoOfArray = iNpseudoUidOfArray.length;

          // get chief userId by => add to array
          pseudoUser_getSubByUID (
            iNchiefUid,
            pseudoUid,
            ( errPseudoUser, dataPseudoUser ) => {
              if ( errPseudoUser ) {
                //ERROR cannot we get chief userId of pseudo
                var errorObj = LOG.ferror ( fname, 1, 1, 'Cannot get chief user id for pseudouser' , errPseudoUser, dataPseudoUser );

                return;
              }
              // SUUCESS we get chief userId of pseudo
              var uidLinkOfPseudoUser = dataPseudoUser.link;
              LOG.fstep ( fname, 1, 1, 'We get chief user id for pseudouser' , dataPseudoUser, uidLinkOfPseudoUser, lengthPseudoOfArray, thisKeyForUser);

              var thisKeyForUser2      = thisKeyForUser,
                  lengthPseudoOfArray2 = lengthPseudoOfArray;
              // self invoking closure - add pseudo user to chat
              (
                () => {
                  var thisKeyForUser3     = thisKeyForUser2, lengthPseudoOfArray3 = lengthPseudoOfArray2;

                  pseudoUser_createAsPseudoMemberOfChat (
                    iNchatId            ,
                    uidLinkOfPseudoUser ,
                    pseudoUid           ,
                    ( errCreateMember, dataCreateMember ) => {
                      if ( errCreateMember ) {
                        //ERROR cannot add pseudoMember to chat
                        LOG.ferror ( fname, 1, 2, 'Cannot add pseudoMember to chat' , errCreateMember, dataCreateMember );
                        return;
                      }
                      //SUCCESS we add pseudoMember to chat => if last invoke result function
                      LOG.printObject( '4 thisKeyForUser3, lengthPseudoOfArray3' , thisKeyForUser3, lengthPseudoOfArray3 );
                      LOG.fstep ( fname, 1, 2, 'We add pseudoMember to chat' , thisKeyForUser3, (lengthPseudoOfArray3 - 1), dataCreateMember );

                      if ( thisKeyForUser3 == (lengthPseudoOfArray3 - 1) ) {
                        LOG.fstep (fname, 1, 3, 'END - invoke passed func' , thisKeyForUser3, (lengthPseudoOfArray3 - 1), dataCreateMember );
                        iNfunction(null,true);
                      }
                    },
                    iNdb,
                    iNbatch
                  );
                }
              ) ();
            }
          );
        }
      )();

    }
}

function pseudoUser_createAsPseudoMemberOfChat (iNchatId, iNpseudoUid, iNpseudoId, iNfunction, iNdb, iNbatch) {
    /*
      @discr
        add pseudouser as pseudoMember to chat
      @inputs
        @required
          iNchatId    -> string
          iNpseudoUid       -> string
          iNpseudoId  -> string
          iNfunction  -> function
        @optinal
          iNdb
          iNbatch
    */

    var fname       = 'pseudoUser_createAsPseudoMemberOfChat',
        pathToDoc   = `${iNchatId}/pseudoMember/${iNpseudoUid}`,
        objectForDb = pseudoUser_getObjectForAddToChat(iNpseudoId);

    LOG.fstep (fname,1,0,'INVOKE - iNchatId, iNpseudoUid, iNpseudoId',iNchatId, iNpseudoUid, iNpseudoId);


    // add to db
    FIREBASE.safeUpdateFirestoreDb (
      'chats',
      pathToDoc,
      objectForDb,
      {
        'onSuccess' : (d) => {
          iNfunction(null,d);
        },
        'onError'   : (e) => {
          iNfunction(e,false);
        },
      },
      iNdb,
      iNbatch
    );
}

function pseudoUser_getSubByUID ( iNchiefUid, iNpseudoUid, iNfunction ) {
    /*
      @discr
        get sub user id by real userid
      @inputs
        @required
          iNpseudoUid -> string
          iNfunction -> function
    */
    var fname = 'pseudoUser_getSubByUID',
        path  = `users/${iNchiefUid}/subpseudouser/${iNpseudoUid}`;

    LOG.fstep (fname,1,0,'INVOKE - iNchiefUid, iNpseudoUid',iNchiefUid, iNpseudoUid);

    firestore()
    .doc(path)
    .get()
    .then (
      (doc) => {
        if (doc.exists) {
            var docId   = doc.id,
                docData = doc.data();

            //SUCCESS we get sub user from db
            LOG.fstep (fname,1,1,'we have active subuser => output with result func',docId,docData);

            if (docData.status != 1) {
              //ERROR we have not active subuser
              var errObj = LOG.ferror(fname,1,2,'we have not active subuser',docData);
              iNfunction(errObj)
              return;
            }
            //SUCCESS we have active subuser => output with result func
            LOG.fstep (fname,1,2,'we have active subuser => output with result func',docData);
            iNfunction(null,docData);

        } else {
            LOG.printObject(functionAddress,  'checkAccessToChatByUid', "No such document!");
            iNfunction("No such document!",null);
        }
      }
    )
    .catch (
      (err) => {
        LOG.print(fname,'ERROR 1.1',err);
        //ERROR we do not get sub user from db
        var errObj = LOG.ferror(fname,1,1,'we do not get sub user from db',docData);
        iNfunction(err);
      }
    );
} //_.pseudoUser_getSubByUID = pseudoUser_getSubByUID;


function member_getInitChatObjectForAddToDb (iNowner) {
  /*
    @discr
      get object with start valur for add to firestore chat/$chatId/member db
    @inputs
      @required
        iNowner -> string
          @default '@system'
  */
  if (typeof iNowner != 'string') iNowner = '@system';
  var objForReturn = {
    'status' : 1,
    'count'  : 0,
    'newMsg' : 0,
    'time'   : FIREBASE.getFirestoreSeverVarTimestamp(),
    'owner'  : iNowner
  };
  return objForReturn;

}

function member_getInitUserObjectForAddToDb (iNtype, iNwith, iNowner) {
  /*
    @discr
      get object with start valur for add to firestore chat/$chatId/member db
    @inputs
      @required
      @optinal
        iNtype    -> number
          @discr
            chat type
          @default 1
        iNowner   -> string
          @default '@system'

  */
  LOG.printObject ( "member_getInitUserObjectForAddToDb - INVOKE ", iNtype, iNwith, iNowner );
  var objForReturn = {
    'time'    : FIREBASE.getFirestoreSeverVarTimestamp(),
    'status'  : 1,
    'type'    : iNtype
  };

  if (typeof iNtype != 'number')  iNtype = 1;
  if (typeof iNowner != 'string') iNowner = '@system';

  //
  if (typeof iNwith == 'string')  objForReturn['with'] = iNwith;

  objForReturn['type'] = iNtype;
  objForReturn['owner'] = iNowner;

  return objForReturn;
}

function member_addToUserDbForMainChat ( iNusers, iNchatId, iNobject, iNfunction, iNdb, iNbatch ) {
  /*
    @inputs
      @required
        iNusers   -> array OR string
        iNchatId  -> string
        iNobject  -> object
          @required
            with     -> string
          @optional
            owner (default - @system)
  */
  var fname = 'member_addToUserDbForMainChat';
  LOG.fstep ( fname, 1, 0, "INVOKE -  iNusers, iNchatId, iNobject", iNusers, iNchatId, iNobject );

  // guard from empty val
  if(typeof iNobject.with != 'string' ) return;
  // if string convert to array
  if(typeof iNobject.iNusers == 'string' ) iNusers = [iNusers];

  var thisChatType = 1,
      objectForDb = member_getInitUserObjectForAddToDb(thisChatType,iNobject.with,iNobject.owner),
      uid,
      chatId = iNchatId;

  // add to user db
  for (var keyForUser in iNusers) {
    uid = iNusers[keyForUser];
    if(typeof uid != 'string') continue;

    // self invoking closure for work with right key from array
    (
      () => {
        var thisKeyForUser = keyForUser;
        FIREBASE.safeUpdateFirestoreDb (
          'users',
          uid + '/members/' + chatId,
          objectForDb,
          {
            'onSuccess' : (d) => {
              //if last element we invoke result function
              console.log('member_addToUserDbForMainChat CLOSURE - thisKeyForUser, (iNusers.length - 1)',thisKeyForUser, (iNusers.length - 1));
              if ( thisKeyForUser == (iNusers.length - 1) )  iNfunction(null,d);
            },
            'onError'   : (e) => {
              iNfunction(e,false);
            }
          },
          iNdb,
          iNbatch
        );
      }
    )();
  }
} _.member_addToUserDbForMainChat = member_addToUserDbForMainChat;

function member_addToChatDbForMainChat (iNusers, iNchatId, iNobject, iNfunction, iNdb, iNbatch ) {
  /*
    @discr
    @inputs
      @required
        iNusers -> array OR string
        iNchatId -> string
        iNobject -> object
          @optional
            owner (default - @system)
  */
  LOG.printObject ( "member_addToChatDbForMainChat - INVOKE ", iNusers, iNchatId, iNobject );


  var chatId = iNchatId,
      memberObjectForAddToChatDb = member_getInitChatObjectForAddToDb( iNobject.owner );

  // add to user db
  for (var keyForUser in iNusers) {
    uid = iNusers[keyForUser];
    if(typeof uid != 'string') continue;

    // self invoking closure for work with right key from array
    (
      () => {
        var thisKeyForUser = keyForUser;
        FIREBASE.safeUpdateFirestoreDb (
          'chats',
          chatId + '/members/' + uid,
          memberObjectForAddToChatDb,
          {
            'onSuccess' : (d) => {
              //if last element we invoke result function
              if ( thisKeyForUser == (iNusers.length - 1) )  iNfunction(null,d);
            },
            'onError'   : (e) => {
              iNfunction(e,false);
            },
          },
          iNdb,
          iNbatch
        );
      }
    )();
  }
} _.member_addToChatDbForMainChat = member_addToChatDbForMainChat;

function pseudoMember_addToChatDbForMainChat (iNusers, iNchatId, iNobject, iNfunction, iNdb, iNbatch ) {
  /*
    @inputs
      @required
        iNusers -> array OR string
        iNchatId -> string
        iNobject -> object
          @optional
            owner (default - @system)
  */
  LOG.printObject ( "pseudoMember_addToChatDbForMainChat - INVOKE ", iNusers, iNchatId, iNobject );


  var chatId = iNchatId,
      memberObjectForAddToChatDb = member_getInitChatObjectForAddToDb( iNobject.owner );

  // get pseudoDb to user


  // add to user db
  for (var keyForUser in iNusers) {
    var uid = iNusers[keyForUser];
    if(typeof uid != 'string') continue;

    // self invoking closure for work with right key from array
    (
      () => {
        var thisKeyForUser = keyForUser;
        FIREBASE.safeUpdateFirestoreDb (
          'chats',
          chatId + '/pseudoMembers/' + uid,
          memberObjectForAddToChatDb,
          {
            'onSuccess' : (d) => {
              //if last element we invoke result function
              if ( thisKeyForUser == (iNusers.length - 1) )  iNfunction(null,d);
            },
            'onError'   : (e) => {
              iNfunction(e,false);
            },
          },
          iNdb,
          iNbatch
        );
      }
    )();
  }
} _.pseudoMember_addToChatDbForMainChat = pseudoMember_addToChatDbForMainChat;




function addMainChat ( iNuser1, iNuser2, iNuserData, iNdataForChat, iNfunction ) {
  /*
    @inputs
      @required
        iNuser1       -> object   (@model - user)
        iNuser2       -> object   (@model - user)
        iNuserData    -> object   (@DISABLE)
          lang
          country
          info
        iNdataForChat -> object
        iNfunction    -> function
      @optional
      @model
        user
          @required
            with  -> string
            users -> array with uid
          @optional
    @algoritm
      1 - createChat
      2 - addMembersToChatDb
      3 - addMembersToUserDb
  */
  //create firebase batch for write all at once
  var fname = 'addMainChat';
  LOG.fstep( fname, 1, 0, 'INVOKE - iNuser1, iNuser2, iNuserData, iNdataForChat' , iNuser1, iNuser2, iNuserData, iNdataForChat );

  const firestoreDb     = FIREBASE.getFirestoreDb();
  const firestoreBatch  = FIREBASE.getBatchFirestoreDb(firestoreDb);

  if (typeof iNdataForChat != 'object') iNdataForChat = {};

  const owner           = iNdataForChat.owner||'@system';

  var dataForChat       = iNdataForChat, result = {};
  //default
  if ( typeof dataForChat.owner != 'string' ) dataForChat.owner = '@system';

  //create function for succes commit to db
  var overloaderFunc = (errChatToken, dataChatToken) => {
    if (errChatToken) {
      iNfunction( errChatToken );
      return;
    }
    FIREBASE.runBatchFirestoreDb (
      firestoreBatch,
      {
        onSuccess : () => {
          LOG.printObject ('addPrivateChat runBatchFirestoreDb overloaderFunc onSuccess - errChatToken, dataChatToken', errChatToken, dataChatToken);
          iNfunction( false, dataChatToken );
        },
        onError   : (err) => {
          LOG.print ('addPrivateChat runBatchFirestoreDb overloaderFunc onError - err, errChatToken dataChatToken', err, errChatToken, dataChatToken );
          iNfunction( true);
        }
      }
    );
  };

  // inner function in create chat for first add members
  var createChatWithAddMembers = ( iNuser1, iNuser2, iNtriggerData, iNfunctionAfterCreatedChat ) => {
    // add supported language from triggerObject to chat
    dataForChat ['supportedLang'] = iNtriggerData ['supportedLang'];
    // create chat
    createChat (
      dataForChat,
      (errChatToken,dataChatToken) => {
        LOG.printObject ( 'addMainChat createChat - errChatToken, dataChatToken'  ,   errChatToken , dataChatToken );
          if (errChatToken) {
            //ERROR (1) we cannot create cha => return funciton with error
            var errorFromLog = LOG.ferror( fname, 1, 1, 'Cannot create chat', errChatToken, dataChatToken );
            overloaderFunc(errorFromLog,false)
          }
          //SUCCESS (1) we added members to chat => add membeb to users
          LOG.fstep( fname, 1, 1, 'We created chat => add membet to chat', errChatToken, dataChatToken );

          // get chat id
          var chatId    = dataChatToken['id'],
              user1     = iNuser1,
              user2     = iNuser2;

          // merge all users for add member to chat
          var allUsers  = user1.users.concat ( user2.users );

          var funcAddMembers = () => {
              // add member user firestore
              member_addToChatDbForMainChat (
                allUsers,
                chatId,
                {},
                (err,data) => {
                  if (err) {
                    //ERROR (2) we cannot add members to chat => return funciton with error
                    var errorFromLog = LOG.ferror( fname, 1, 2, 'Cannot add members to chat', err,data);
                    overloaderFunc (errorFromLog);
                    return;
                  }
                  //SUCCESS (2) we added members to chat => add membeb to users
                  LOG.fstep( fname, 1, 2, 'We added members to chat => add membeb to users', err,data);

                  // inner function funcAddMembers
                  member_addToUserDbForMainChat (
                    user1.users,
                    chatId,
                    {'with':user1.with, 'owner': owner},
                    (errMember1,dataMember1)=> {
                      LOG.printObject ('addMainChat createChat member_addToUserDbForMainChat 1 errChatToken - err,data'  ,   errMember1,dataMember1);
                      if (errMember1) {
                        //ERROR (3) Цe cannot add member to first group user => return funciton with error
                        var errorFromLog = LOG.ferror( fname, 1, 3, 'Cannot add add member to first group user', errMember1,dataMember1);
                        overloaderFunc (errorFromLog);
                        return;
                      }
                      //SUCCESS (3) we added member to first group user => add second group
                      LOG.fstep( fname, 1, 3, 'We added members to first group user => add second group', errMember1, dataMember1);

                      member_addToUserDbForMainChat (
                        iNuser2.users,
                        chatId,
                        {'with': iNuser2.with, 'owner': owner},
                        (errMember2,dataMember2)=> {
                          LOG.printObject ('addMainChat createChat member_addToUserDbForMainChat 2 errChatToken - err,data'  ,   errMember2,dataMember2);
                          if (errMember2) {
                            //ERROR (4) we cannot add member to second group user => return funciton with error
                            var errorFromLog = LOG.ferror( fname, 1, 4, 'Cannot add member to second group users', errMember2,dataMember2);
                            overloaderFunc (errorFromLog);
                            return;
                          }
                          //SUCCESS (4) we added member to second group user => return function with success
                          LOG.fstep( fname, 1, 4, 'We added members to second group user => return function with success', errMember2, dataMember2 );

                          overloaderFunc (false,{'chatId':chatId});

                        },
                        firestoreDb,
                        firestoreBatch
                      );

                    },
                    firestoreDb,
                    firestoreBatch
                  );

                },
                firestoreDb,
                firestoreBatch
              );
          }

          // check for exist function for +=> invoke this function -=> create empty function
          if ( typeof iNfunctionAfterCreatedChat != 'function' ) {
            iNfunctionAfterCreatedChat = (iNchatId,iNaddMembersFunction) => {
              // add members with reuslt
              iNaddMembersFunction();
            }
          }

          // invoke funciton passed chatId OR created here
          iNfunctionAfterCreatedChat (chatId, funcAddMembers);



        // }
      },
      firestoreDb,
      firestoreBatch
    );
  };



  //get trigger for second user
  USER.trigger.getTriggerByEventCreatingMainChat (
    iNuser2.with,
    {},
    ( errTrigger, dataTrigger ) => {
      if ( errTrigger || typeof dataTrigger.payload != 'object') {
        //ERROR (1.1) User has not trigger for event => create main chat with usual mode
        var errorObject   = LOG.ferror ( fname, 1, 1.1, 'User has not trigger for event' , errTrigger, dataTrigger );

        // create main chat in usual mode
        createChatWithAddMembers ( iNuser1, iNuser2, dataTrigger );
        return;
      }
      //SUCCESS (1.1) User has trigger for event => get trigger type
      LOG.fstep ( fname, 1, 1, 'User has trigger for event => get trigger type' , iNuser1, iNuser2, iNdataForChat, dataTrigger );

      switch (dataTrigger.type) {
        case 'addExtraUser':
          //SUCCESS (1.1) This trigger type - addExtraUser => creating chat with add extra users
          LOG.fstep( fname, 1, 1.1, 'This trigger type - addExtraUser => creating chat with add extra users', dataTrigger.type );

          if ( typeof dataTrigger != 'object' )
            dataTrigger.payload = {};

          //add users from trigger to user
          if ( Array.isArray(dataTrigger.payload.users) && dataTrigger.payload.users.length > 0) {
            iNuser1.users = iNuser1.users.concat ( dataTrigger.payload.users );
          }


          // add pseudousers from trigger to user
          if ( Array.isArray(dataTrigger.payload.pseudoUsers) && dataTrigger.payload.pseudoUsers.length > 0 ) {

            LOG.fstep ( fname, 1, 1.12, 'ISpseudoUser IS', dataTrigger.payload.pseudoUsers );


            iNuser1.users = iNuser1.users.concat ( dataTrigger.payload.pseudoUsers );
            // created function after created chat => add pseudousers from trigger to user
            var functionAfterCreatedChat = (iNchatId, iNaddMembersFunction) => {

              LOG.fstep ( fname, 1, 1.13, 'functionAfterCreatedChat invoked', dataTrigger.payload.pseudoUsers );

              pseudoUser_createWithArrayAsPseudoMemberOfChat (
                iNchatId,
                iNuser2.with,
                dataTrigger.payload.pseudoUsers,
                (errCreateArray, dataCreateArray) => {
                  if (errCreateArray) {
                    //ERROR we cant add pseudoMembers to chat
                    LOG.ferror ( fname, 1, 1.2, 'We cant add pseudoMembers to chat', errCreateArray, dataCreateArray );
                    return;
                  }
                  //SUCCESS we added pseudoMembers to chat
                  LOG.fstep ( fname, 1, 1.2, 'We added pseudoMembers to chat', errCreateArray, dataCreateArray );

                  //function result
                  iNaddMembersFunction();
                },
                firestoreDb,
                firestoreBatch
              );
            }

            // create chat with members AND we add pseudo members to chat
            createChatWithAddMembers ( iNuser1, iNuser2 , dataTrigger, functionAfterCreatedChat );
          } else {
            LOG.fstep ( fname, 1, 1.12, 'ISpseudoUser NOT', dataTrigger.payload.pseudoUsers );
            // create chat with members
            createChatWithAddMembers ( iNuser1, iNuser2, dataTrigger);
          }



        break;


        case 'toBotDialogFlow':
          //SUCCESS (1.1.1) This trigger type - toBotDialogFlow => add trigger => create chat
          LOG.fstep( fname, 1, 1.1, 'This trigger type - toBotDialogFlow  => add trigger => creating chat with add trigger for passed msg to bot', dataTrigger.type);

          //add users from trigger to user
          // if ( typeof dataTrigger.payload == 'object' && Array.isArray(dataTrigger.payload.users) )
          //   iNuser1.users = iNuser1.users.concat(dataTrigger.payload.users);

          //add users from trigger to user
          if ( Array.isArray(dataTrigger.payload.users)  && dataTrigger.payload.users.length > 0 ) {
            iNuser1.users = iNuser1.users.concat ( dataTrigger.payload.users );
          }



          // created function after created chat => add trigger
          var functionAfterCreatedChat2 = (iNchatId, iNaddMembersFunction) => {
            TRIGGER.addTriggerForEventAddMessage (
              iNchatId,
              dataTrigger ,
              (errFromAddTrigger,dataFromAddTrigger) => {
                if (errFromAddTrigger) {
                  //ERROR (1.1.2) Trigger toBotDialogFlow could not create => output error
                  var errorObject   = LOG.ferror( fname, 1, 1.2, 'Trigger toBotDialogFlow could not create' , errFromAddTrigger, dataFromAddTrigger );
                  overloaderFunc ( errorObject );
                  return;
                }
                //SUCCESS (1.1.2) Trigger toBotDialogFlow added => addMembers
                LOG.fstep( fname, 1, 1.2, 'Trigger toBotDialogFlow added => add to db', dataTrigger.type);

                iNaddMembersFunction()
              },
              firestoreDb,
              firestoreBatch
            );
          }

          if ( Array.isArray(dataTrigger.payload.pseudoUsers) && dataTrigger.payload.pseudoUsers.length > 0 ) {

            LOG.fstep ( fname, 1, 1.12, 'ISpseudoUser IS', dataTrigger.payload.pseudoUsers );

            iNuser1.users = iNuser1.users.concat ( dataTrigger.payload.pseudoUsers );
            // created function after created chat => add pseudousers from trigger to user
            var functionAfterCreatedChat = (iNchatId, iNaddMembersFunction) => {

              LOG.fstep ( fname, 1, 1.13, 'functionAfterCreatedChat invoked', dataTrigger.payload.pseudoUsers );

              pseudoUser_createWithArrayAsPseudoMemberOfChat (
                iNchatId,
                iNuser2.with,
                dataTrigger.payload.pseudoUsers,
                (errCreateArray, dataCreateArray) => {
                  if (errCreateArray) {
                    //ERROR we cant add pseudoMembers to chat
                    LOG.ferror ( fname, 1, 1.2, 'We cant add pseudoMembers to chat', errCreateArray, dataCreateArray );
                    return;
                  }
                  //SUCCESS we added pseudoMembers to chat
                  LOG.fstep ( fname, 1, 1.2, 'We added pseudoMembers to chat', errCreateArray, dataCreateArray );

                  //function result
                  functionAfterCreatedChat2(iNchatId, iNaddMembersFunction);
                },
                firestoreDb,
                firestoreBatch
              );
            }

            // create chat with members AND we add pseudo members to chat
            createChatWithAddMembers ( iNuser1, iNuser2 , dataTrigger , functionAfterCreatedChat );
          } else {
            LOG.fstep ( fname, 1, 1.12, 'ISpseudoUser NOT', dataTrigger.payload.pseudoUsers );
            // create trigger
            createChatWithAddMembers ( iNuser1, iNuser2, dataTrigger , functionAfterCreatedChat2 );
          }




        break;


        default:
          //ERROR (1.1) This user has not action for this trigger event => output error
          var errorObject   = LOG.ferror( fname, 1, 1.1, 'Unrecognized event type of trigger' , dataTrigger.type );
          iNfunction ( errorObject );
        break;

      }

    }
  );


  //addMembersToChatDb

  //addMembersToUserDb
} _.addMainChat = addMainChat;





function createMember ( iNdata, iNfunction, iNdb, iNbatch) { //DELETE
  /*
    @inputs
      @required
        iNdata -> function
          @required
            uid     -> string
            for     -> string
            chatId  -> string
          @optional
            owner   -> string
            id      -> string
            status  -> number
            type    -> string
            time    -> number
  */
//  var
//      dataForDbInsert = {iNdata['for']:1};

  // if ( typeof iNdata['id'] != 'string')  iNdata['id'] = FIREBASE.generateIdForFirestoreByFullPathToDb ('chats/',iNdata['chatId'] + '/members');//CONNECT.getRandomKeyByUuid();
  // dataForDbInsert['id'] = iNdata['id'];

  if ( typeof iNdata['owner'] != 'string')  iNdata['owner'] = '@system';
  dataForDbInsert['owner'] = iNdata['owner'];

  if ( typeof iNdata['status'] != 'number')  iNdata['status'] = 1;
  dataForDbInsert['status'] = iNdata['status'];

  if ( typeof iNdata['type'] != 'number')  iNdata['type'] = 1;
  dataForDbInsert['type'] = iNdata['type'];

  if ( typeof iNdata['time'] != 'number')  iNdata['time'] = FIREBASE.getFirestoreSeverVarTimestamp();
  dataForDbInsert['time'] = iNdata['time'];

  LOG.printObject(  "createMember iNdata", iNdata, dataForDbInsert );
  // DINAMO.add( tableMember , dataForDbInsert , iNfunction );

  FIREBASE.safeUpdateFirestoreDb (
    'users',
    iNdata['uid'] + '/members/' + iNdata['chatId'],
    dataForDbInsert,
    {
      'onSuccess' : (d) => {
        LOG.printObject("createMember FIREBASE.safeUpdateFirestoreDb - onSuccess");
        iNfunction(null,d);
      },
      'onError'   : (e) => {
        LOG.printObject("createMember FIREBASE.safeUpdateFirestoreDb - onError");
        iNfunction(e,false);
      },
    },
    iNdb,
    iNbatch
  );
} _.createMember = createMember;

// function addMemberForPrivateChat ( iNdata, iNfunction, iNdb, iNbatch ) { // DELETE
//   /*
//     @discr
//       create double notes for user
//     @inputs
//       @required
//         iNdata -> function
//           @required
//             uid     -> string
//             for     -> string
//             chatId  -> string
//           @optional
//             owner   -> string
//             id      -> string
//             status  -> number
//             type    -> string
//             time    -> number
//   */
//   var user1 = iNdata;
//   var user2 = {'uid':user1['for'],'for':user1['uid'],'chatId':user1['chatId']};
//   //chatType default 'private' type
//   var chatType = iNdata['type']||1;
//
//   var result = {};
//   var tempResult = {
//     'status' : 1,
//     'count' : 0
//   };
//
//   result [ user1['uid'] ] = tempResult;
//   result [ user2['uid'] ] = tempResult;
//
//   createMember (
//     user1 ,
//     function (errMemberUser1,dataMemberUser1) {
//       // if( !errMemberUser1 ) {
//       //   result[ dataMemberUser1['uid'] ] = tempResult;
//       //
//       // } else {
//       //   iNfunction(false);
//       // }
//     },
//     iNdb,
//     iNbatch
//   );
//
//   createMember (
//     user2 ,
//     function (errMemberUser2,dataMemberUser2) {
//     //   if( !errMemberUser2 ) {
//     //     result[ dataMemberUser2['uid'] ] = tempResult;
//     //   }
//     //   iNfunction(result);
//     },
//     iNdb,
//     iNbatch
//   );
//
//   iNfunction(result);
//
// } _.addMemberForPrivateChat = addMemberForPrivateChat;

function createMemberToFirebase (iNdata,iNfunction) {

}
_.createMemberToFirebase = createMemberToFirebase;
//@> MEMBER


//@< CHAT
function getChat (iNdata,iNfunction) {
  /*
    @inputs
      @required
        iNfunction
        iNdata
          @required
            owner
            by
          @optinal
            id
            status
            type
            time

  */
  // if(typeof iNdata['owner'] != 'string') iNdata['owner'] = '@system';
  // var
  //     objecrForQuery = DINAMO.addByMask( {'owner':iNdata['owner']},"owner", { "table" : tableChat } ),
  //     index          = '';
  //     if(typeof(iNdata['by']) != 'string')iNdata['by']='standart';
  //
  // if ( typeof(iNdata['by']) == 'string' ) {
  //   switch (iNdata['by']) {
  //     case "type":
  //       if( typeof(iNdata['type']) != 'string') break;
  //       index = 'uid-type-index'; objecrForQuery['index'] = index;
  //       objecrForQuery = DINAMO.addByMask(iNdata,"type",objecrForQuery);
  //     break;
  //
  //     case "time":
  //       if( typeof(iNdata['time']) != 'number') break;
  //       index = 'uid-time-index'; objecrForQuery['index'] = index;
  //       objecrForQuery = DINAMO.addByMask(iNdata,"time",objecrForQuery,"number");
  //     break;
  //
  //     case "status":
  //       if( typeof(iNdata['status']) != 'number') break;
  //       index = 'uid-status-index'; objecrForQuery['index'] = index;
  //       objecrForQuery = DINAMO.addByMask(iNdata,"status",objecrForQuery,"number");
  //     break;
  //
  //     case "owner":
  //       if( typeof(iNdata['owner']) != 'string') break;
  //       index = 'uid-owner-index'; objecrForQuery['index'] = index;
  //       objecrForQuery = DINAMO.addByMask(iNdata,"owner",objecrForQuery);
  //     break;
  //
  //     default:
  //       if( typeof(iNdata['id']) != 'string') break;
  //       objecrForQuery = DINAMO.addByMask(iNdata,"id",objecrForQuery);
  //     break;
  //   }
  //
  // }
  //
  // if ( typeof(iNdata['type'])=='string' && index != 'uid-type-index')
  //   objecrForQuery = DINAMO.addByMaskFilter(iNdata,"type",objecrForQuery,"string");
  //
  // if ( typeof(iNdata['status'])=='number' && index != 'uid-status-index')
  //   objecrForQuery = DINAMO.addByMaskFilter(iNdata,"status",objecrForQuery,"number");
  //
  // if ( typeof(iNdata['id'])=='string'  && index != 'uid-id-index')
  //   objecrForQuery = DINAMO.addByMaskFilter(iNdata,"id",objecrForQuery);
  //
  // DINAMO.query(objecrForQuery,iNfunction);
}
_.getChat = getChat;

function getChiefChatIdByUid (iNpseudoUid,iNwith,iNfunction) {
  /*
    @inputs
      @required
        iNpseudoUid       -> string
        iNfor       -> string
        iNfunction  -> function
  */
  var objForGetMember = {'by':'with', 'uid': iNpseudoUid, 'with' : iNwith, 'status' : 1};
  LOG.printObject('getChiefChatIdByUid - objForGetMember',objForGetMember);
  getMember(objForGetMember,function (err,docs) {
    LOG.printObject('getMember result - err,docs',err,docs);
    if(!err && docs.length > 0) {
      var memberData = docs[0].data();
      iNfunction(docs[0].id);
    } else {
      iNfunction(false);
    }
  });
}
_.getChiefChatIdByUid = getChiefChatIdByUid;

function checkAccessToChatByUid (iNchatId,iNpseudoUid,iNfunction) {
  /*
    @inputs
      @required
        iNchatId       -> string
        iNpseudoUid       -> string
        iNfunction  -> function
  */
  var pathToFireStoreDb = 'chats/'+iNchatId+'/members/'+iNpseudoUid;
  var firestoreRef = firestore().doc(pathToFireStoreDb);
  firestoreRef.get()
  .then(
    (doc) => {
      LOG.printObject(functionAddress, 'checkAccessToChatByUid - doc',doc);
      if (doc.exists) {
          LOG.printObject(functionAddress, 'checkAccessToChatByUid', "Document - data", doc.data());
          iNfunction(null,doc.data());
      } else {
          LOG.printObject(functionAddress,  'checkAccessToChatByUid', "No such document!");
          iNfunction("No such document!",null);
      }
    }
  )
  .catch(
    (err) => {
      iNfunction(err,null);
    }
  );

}
_.checkAccessToChatByUid = checkAccessToChatByUid;


function getСhatsByOwner (iNpseudoUid,iNowner,iNfunction) {
  /*
    @inputs
      @required
        iNpseudoUid       -> string
        iNowner       -> string
        iNfunction  -> function
  */
  // var objForGetMember = {'by':'owner', 'uid': iNpseudoUid, 'iNowner' : iNowner, 'status' : 1};
  //
  //
  //
  // getMember(objForGetMember,function (err,data) {
  //   if(!err && data.Count > 0) {
  //     iNfunction(data.Items);
  //   } else {
  //     iNfunction(false);
  //   }
  // });
}
_.getСhatsByOwner = getСhatsByOwner;

function getChatById (iNowner,iNid,iNfunction) {
  /*
    @inputs
      @required
        iNowner
        iNid
        iNfunction -> funtion
  */
  // var dataForGetChat = {};
  // if ( typeof iNowner == 'string' ) dataForGetChat['owner'] = iNowner;
  // dataForGetChat['id'] = iNid;
  // getChat(dataForGetChat,iNfunction);
}
_.getChatById = getChatById;

function passedChatToFirebase (iNdata,iNfunction) {
}
_.passedChatToFirebase = passedChatToFirebase;


function createChat (iNdata, iNfunction, iNdb, iNbatch) {
  /*
    @inputs
      @required
        iNdata -> function
          @required
          @optional
            owner   -> string
            id      -> string
            status  -> number
            type    -> number
            trigger -> object
              @enum
                1 - private main chatId
                2 - group chat
                3 - sub chat pseudo

            time    -> number
  */
  var
      dataForDbInsert = {},
      docId;


  if ( typeof iNdata['id'] != 'string')  iNdata['id'] = FIREBASE.generateIdForFirestoreByFullPathToDb('chats');
  docId = iNdata['id'];

  // add status to chat (@default 1
  if ( typeof iNdata['status'] != 'number')  iNdata['status'] = 1;
  dataForDbInsert['status'] = iNdata['status'];

  // add owner to chat (@default '@system')
  if ( typeof iNdata['owner'] != 'string' )  iNdata['owner'] = '@system';
  dataForDbInsert['owner'] = iNdata['owner'];


    // add type to chat (@default 1)
  if ( typeof iNdata['type'] != 'number')  iNdata['type'] = 1;
  dataForDbInsert['type'] = iNdata['type'];

  // add time to chat (@default now)
  if ( typeof iNdata['time'] != 'object')  iNdata['time'] = FIREBASE.getFirestoreSeverVarTimestamp(); //addMainChat();
  dataForDbInsert['time'] = iNdata['time'];

  // for fistore chat
  dataForDbInsert['info'] = {
      "chat" : {
        "type": dataForDbInsert['type']
      }
  }

  // add to chat
  FIREBASE.safeUpdateFirestoreDb (
    'chats',
    docId,
    dataForDbInsert,
    {
      'onSuccess' : (d) => {
        // add chatId to function result
        dataForDbInsert['id'] = docId;

        iNfunction(null,dataForDbInsert);
      },
      'onError' : (e) => {
        iNfunction(e,false);
      },
    },
    iNdb,
    iNbatch
  );

  // iNfunction(null,dataForDbInsert);
  // DINAMO.add( tableChat , dataForDbInsert , iNfunction );
} _.createChat = createChat;
//@> CHAT


//@< MESSAGE
function addMessage () {

}
_.addMessage = addMessage;

function createMessage (iNdata,iNfunction) {
  /*
    @inputs
      @required
        iNdata -> function
          @required
            chatId      -> string
            content     -> string
          @optional
            generated   -> string
            id          -> string
            status      -> number
            type        -> string
            time        -> number
            extra       -> object
  */
  // var
  //     dataForDbInsert = { 'chatId': iNdata['chatId'] ,'content': iNdata['content'] };
  //
  // if ( typeof iNdata['id'] != 'string')  iNdata['id'] = CONNECT.getRandomKeyByUuid();
  // dataForDbInsert['id'] = iNdata['id'];
  //
  // if ( typeof iNdata['generated'] != 'string')  iNdata['generated'] = 'usual';
  // dataForDbInsert['generated'] = iNdata['generated'];
  //
  // if ( typeof iNdata['status'] != 'number')  iNdata['status'] = 1;
  // dataForDbInsert['status'] = iNdata['status'];
  //
  // if ( typeof iNdata['type'] != 'string')  iNdata['type'] = 'private';
  // dataForDbInsert['type'] = iNdata['type'];
  //
  // if ( typeof iNdata['time'] != 'number')  iNdata['time'] = CONNECT.getTime();
  // dataForDbInsert['time'] = iNdata['time'];
  //
  // if ( typeof iNdata['extra'] == 'object')  dataForDbInsert['extra'] = iNdata['extra'];
  //
  // DINAMO.add( tableChat , dataForDbInsert , iNfunction );
}
_.createMessage = createMessage;
//@> MESSAGE

module.exports  = _;
