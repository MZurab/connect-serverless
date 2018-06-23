var CONNECT   = require('./../connect');
const LOG     = require('ramman-z-log');
var FIREBASE  = require("./../firebase/firebase");
var DINAMO    = require("./../aws/dinamo");

var tableMsg      = 'connect-message',
    tableMember   = 'connect-member',
    tableChat     = 'connect-chat';

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
            status
            id
            chatId
  */
  var
      objecrForQuery = DINAMO.addByMask( {'uid':iNdata['uid']},"uid", { "table" : tableMember } ),
      index          = '';
      if(typeof(iNdata['by']) != 'string')iNdata['by']='standart';

  if ( typeof(iNdata['by']) == 'string' ) {
    switch (iNdata['by']) {
      case "type":
        if( typeof(iNdata['type']) != 'string') break;
        index = 'uid-type-index'; objecrForQuery['index'] = index;
        objecrForQuery = DINAMO.addByMask(iNdata,"type",objecrForQuery);
      break;

      case "for":
        if( typeof(iNdata['for']) != 'string') break;
        index = 'uid-for-index'; objecrForQuery['index'] = index;
        objecrForQuery = DINAMO.addByMask(iNdata,"for",objecrForQuery,"string");
      break;

      case "chatId":
        if( typeof(iNdata['chatId']) != 'string') break;
        index = 'uid-chatId-index'; objecrForQuery['index'] = index;
        objecrForQuery = DINAMO.addByMask(iNdata,"chatId",objecrForQuery,"string");
      break;

      case "owner":
        if( typeof(iNdata['owner']) != 'string') break;
        index = 'uid-owner-index'; objecrForQuery['index'] = index;
        objecrForQuery = DINAMO.addByMask(iNdata,"owner",objecrForQuery,"string");
      break;

      case "status":
        if( typeof(iNdata['status']) != 'number') break;
        index = 'uid-status-index'; objecrForQuery['index'] = index;
        objecrForQuery = DINAMO.addByMask(iNdata,"status",objecrForQuery,"number");
      break;

      default:
        if( typeof(iNdata['id']) != 'string') break;
        objecrForQuery = DINAMO.addByMask(iNdata,"id",objecrForQuery);
      break;
    }

  }


  if ( typeof(iNdata['chatId'])=='string' && index != 'uid-chatId-index')
    objecrForQuery = DINAMO.addByMaskFilter(iNdata,"chatId",objecrForQuery,"string");

  if ( typeof(iNdata['for'])=='string' && index != 'uid-for-index')
    objecrForQuery = DINAMO.addByMaskFilter(iNdata,"for",objecrForQuery,"string");

  if ( typeof(iNdata['type'])=='string' && index != 'uid-type-index')
    objecrForQuery = DINAMO.addByMaskFilter(iNdata,"type",objecrForQuery,"string");

  if ( typeof(iNdata['status'])=='number' && index != 'uid-status-index')
    objecrForQuery = DINAMO.addByMaskFilter(iNdata,"status",objecrForQuery,"number");

  if ( typeof(iNdata['owner'])=='string'  && index != 'uid-owner-index')
    objecrForQuery = DINAMO.addByMaskFilter(iNdata,"owner",objecrForQuery);
  LOG.printObject('getMember objecrForQuery',objecrForQuery);
  DINAMO.query(objecrForQuery,iNfunction);
}
module.exports.getMember  = getMember;

function createMember (iNdata,iNfunction) {
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
  var
      dataForDbInsert = {'uid':iNdata['uid']};

  if ( typeof iNdata['id'] != 'string')  iNdata['id'] = CONNECT.getRandomKeyByUuid();
  dataForDbInsert['id'] = iNdata['id'];

  if ( typeof iNdata['owner'] != 'string')  iNdata['owner'] = '@system';
  dataForDbInsert['owner'] = iNdata['owner'];

  if ( typeof iNdata['status'] != 'number')  iNdata['status'] = 1;
  dataForDbInsert['status'] = iNdata['status'];

  if ( typeof iNdata['type'] != 'string')  iNdata['type'] = 'private';
  dataForDbInsert['type'] = iNdata['type'];

  dataForDbInsert['for']  = iNdata['for'];
  dataForDbInsert['chatId'] = iNdata['chatId'];

  if ( typeof iNdata['time'] != 'number')  iNdata['time'] = CONNECT.getTime();
  dataForDbInsert['time'] = iNdata['time'];

  DINAMO.add( tableMember , dataForDbInsert , iNfunction );
}
module.exports.createMember  = createMember;

function addMember (iNdata,iNfunction) {
  /*
    @discr
      create double notes for user
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
  var user1 = iNdata;
  var user2 = {'uid':user1['for'],'for':user1['uid'],'chatId':user1['chatId']};
  var result = {};
  var tempResult = {
    'status' : 1,
    'count' : 0
  };
  createMember ( user1 , function (errMemberUser1,dataMemberUser1) {
    if( !errMemberUser1 ) {
      result[ dataMemberUser1['uid'] ] = tempResult;
      createMember(user2,function (errMemberUser2,dataMemberUser2) {
        if( !errMemberUser2 ) {
          result[ dataMemberUser2['uid'] ] = tempResult;
        }
        iNfunction(result);
      });
    } else {
      iNfunction(false);
    }
  });

}
module.exports.addMember  = addMember;

function createMemberToFirebase (iNdata,iNfunction) {

}
module.exports.createMemberToFirebase  = createMemberToFirebase;
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
  if(typeof iNdata['owner'] != 'string') iNdata['owner'] = '@system';
  var
      objecrForQuery = DINAMO.addByMask( {'owner':iNdata['owner']},"owner", { "table" : tableChat } ),
      index          = '';
      if(typeof(iNdata['by']) != 'string')iNdata['by']='standart';

  if ( typeof(iNdata['by']) == 'string' ) {
    switch (iNdata['by']) {
      case "type":
        if( typeof(iNdata['type']) != 'string') break;
        index = 'uid-type-index'; objecrForQuery['index'] = index;
        objecrForQuery = DINAMO.addByMask(iNdata,"type",objecrForQuery);
      break;

      case "time":
        if( typeof(iNdata['time']) != 'number') break;
        index = 'uid-time-index'; objecrForQuery['index'] = index;
        objecrForQuery = DINAMO.addByMask(iNdata,"time",objecrForQuery,"number");
      break;

      case "status":
        if( typeof(iNdata['status']) != 'number') break;
        index = 'uid-status-index'; objecrForQuery['index'] = index;
        objecrForQuery = DINAMO.addByMask(iNdata,"status",objecrForQuery,"number");
      break;

      case "owner":
        if( typeof(iNdata['owner']) != 'string') break;
        index = 'uid-owner-index'; objecrForQuery['index'] = index;
        objecrForQuery = DINAMO.addByMask(iNdata,"owner",objecrForQuery);
      break;

      default:
        if( typeof(iNdata['id']) != 'string') break;
        objecrForQuery = DINAMO.addByMask(iNdata,"id",objecrForQuery);
      break;
    }

  }

  if ( typeof(iNdata['type'])=='string' && index != 'uid-type-index')
    objecrForQuery = DINAMO.addByMaskFilter(iNdata,"type",objecrForQuery,"string");

  if ( typeof(iNdata['status'])=='number' && index != 'uid-status-index')
    objecrForQuery = DINAMO.addByMaskFilter(iNdata,"status",objecrForQuery,"number");

  if ( typeof(iNdata['id'])=='string'  && index != 'uid-id-index')
    objecrForQuery = DINAMO.addByMaskFilter(iNdata,"id",objecrForQuery);

  DINAMO.query(objecrForQuery,iNfunction);
}
module.exports.getChat  = getChat;

function getChiefChatIdByUid (iNuid,iNfor,iNfunction) {
  /*
    @inputs
      @required
        iNuid       -> string
        iNfor       -> string
        iNfunction  -> function
  */
  var objForGetMember = {'by':'for', 'uid': iNuid, 'for' : iNfor, 'status' : 1};
  getMember(objForGetMember,function (err,data) {
    if(!err && data.Count > 0) {
      var memberData = data.Items[0];
      iNfunction(memberData['chatId']);
    } else {
      iNfunction(false);
    }
  });
}
module.exports.getChiefChatIdByUid  = getChiefChatIdByUid

function getСhatsByOwner (iNuid,iNowner,iNfunction) {
  /*
    @inputs
      @required
        iNuid       -> string
        iNowner       -> string
        iNfunction  -> function
  */
  var objForGetMember = {'by':'owner', 'uid': iNuid, 'iNowner' : iNowner, 'status' : 1};
  getMember(objForGetMember,function (err,data) {
    if(!err && data.Count > 0) {
      iNfunction(data.Items);
    } else {
      iNfunction(false);
    }
  });
}
module.exports.getСhatsByOwner  = getСhatsByOwner

function getChatById (iNowner,iNid,iNfunction) {
  /*
    @inputs
      @required
        iNowner
        iNid
        iNfunction -> funtion
  */
  var dataForGetChat = {};
  if ( typeof iNowner == 'string' ) dataForGetChat['owner'] = iNowner;
  dataForGetChat['id'] = iNid;
  getChat(dataForGetChat,iNfunction);
}
module.exports.getChatById  = getChatById

function addChat (iNdata,iNfunction) {
  /*
    @inputs
      iNdata -> object
        uid
        for

        content

        type
        owner

    @algoritm
      [проверяем на наличее]
      1 - создаем чат       [dinamoDb]
      2 - создаем в мемберс [dinamoDb]
      4 - возвращаем код чата
  */
  if (typeof iNdata['type'] != 'number')          iNdata['type']          = 1;
  if (typeof iNdata['status'] != 'number')        iNdata['status']        = 1;
  if (typeof iNdata['countMessages'] != 'number') iNdata['countMessages'] = 0;
  createChat({},function (errChatToken,dataChatToken) {
    LOG.printObject('addChat errChatToken',errChatToken);
    LOG.printObject('addChat dataChatToken',dataChatToken);
    if (!errChatToken) {
      //create members for new chatId
      var chatId = dataChatToken['id'];
      var objForCreateMembers = {'uid':iNdata['uid'],'for':iNdata['for'],'chatId':chatId};
      addMember(objForCreateMembers, function(dataMember) {
        LOG.printObject('addMember dataMember',dataMember);
        var countUsers = Object.keys(dataMember).length;
        if( typeof dataMember == 'object' ) {
          FIREBASE.setData ( `chats/${chatId}`,
            {
              'info'          : {
                'chat' : {
                  'type'          : iNdata['type'],
                  'countMessages' : iNdata['countMessages'],
                  'countUsers'    : countUsers,
                  'status'        : iNdata['status'],
                }
              },
              'member'            : dataMember,

            },
            function (errorFirebase) {
              LOG.printObject('FIREBASE errorFirebase',errorFirebase);
              if (!errorFirebase)
                iNfunction(false,objForCreateMembers);
              else
                iNfunction(errorFirebase,false);
            }
          );
        }else {
          iNfunction(true,false);
        }
      });
    } else {
      iNfunction(errChatToken,false)
    }
  });

}
module.exports.addChat  = addChat;

function passedChatToFirebase (iNdata,iNfunction) {
}
module.exports.passedChatToFirebase  = passedChatToFirebase;


function createChat (iNdata,iNfunction) {
  /*
    @inputs
      @required
        iNdata -> function
          @required
          @optional
            owner   -> string
            id      -> string
            status  -> number
            type    -> string
            time    -> number
  */
  var
      dataForDbInsert = {};

  if ( typeof iNdata['id'] != 'string')  iNdata['id'] = CONNECT.getRandomKeyByUuid();
  dataForDbInsert['id'] = iNdata['id'];

  if ( typeof iNdata['owner'] != 'string')  iNdata['owner'] = '@system';
  dataForDbInsert['owner'] = iNdata['owner'];

  if ( typeof iNdata['status'] != 'number')  iNdata['status'] = 1;
  dataForDbInsert['status'] = iNdata['status'];

  if ( typeof iNdata['type'] != 'string')  iNdata['type'] = 'private';
  dataForDbInsert['type'] = iNdata['type'];

  if ( typeof iNdata['geoId'] != 'string')  iNdata['geoId'] = '-';
  dataForDbInsert['geoId'] = iNdata['geoId'];

  if ( typeof iNdata['time'] != 'number')  iNdata['time'] = CONNECT.getTime();
  dataForDbInsert['time'] = iNdata['time'];

  DINAMO.add( tableChat , dataForDbInsert , iNfunction );
}
module.exports.createChat  = createChat;
//@> CHAT


//@< MESSAGE
function addMessage () {

}
module.exports.addMessage  = addMessage;

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
  var
      dataForDbInsert = { 'chatId': iNdata['chatId'] ,'content': iNdata['content'] };

  if ( typeof iNdata['id'] != 'string')  iNdata['id'] = CONNECT.getRandomKeyByUuid();
  dataForDbInsert['id'] = iNdata['id'];

  if ( typeof iNdata['generated'] != 'string')  iNdata['generated'] = 'usual';
  dataForDbInsert['generated'] = iNdata['generated'];

  if ( typeof iNdata['status'] != 'number')  iNdata['status'] = 1;
  dataForDbInsert['status'] = iNdata['status'];

  if ( typeof iNdata['type'] != 'string')  iNdata['type'] = 'private';
  dataForDbInsert['type'] = iNdata['type'];

  if ( typeof iNdata['time'] != 'number')  iNdata['time'] = CONNECT.getTime();
  dataForDbInsert['time'] = iNdata['time'];

  if ( typeof iNdata['extra'] == 'object')  dataForDbInsert['extra'] = iNdata['extra'];

  DINAMO.add( tableChat , dataForDbInsert , iNfunction );
}
module.exports.createMessage  = createMessage;
//@> MESSAGE
