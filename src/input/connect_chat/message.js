const CONNECT   = require('./../connect');
const LOG       = require('ramman-z-log');
const FIREBASE  = require("./../firebase/firebase");
      const firestore = FIREBASE.firestore;
// const LFIREBASE = require("./../firebase/firebase");
// const DINAMO    = require("./../aws/dinamo");
var functionAddress = 'connect_chat/message.js ';
const _ = {};

function getMessage (iNchatId,iNmsgId,iNfunction) {
  /*
    @inputs
      @required
        iNchatId      -> string
        iNmsgId       -> string
        iNfunction    -> function
  */
  var pathToFireStoreDb = 'chats/'+iNchatId+'/messages/'+iNmsgId;
  var firestoreRef = firestore().doc(pathToFireStoreDb);
  firestoreRef.get().then(
    (doc) => {
      LOG.printObject(functionAddress, 'getMessage - doc',doc);
      if (doc.exists) {
          LOG.printObject(functionAddress, 'getMessage', "Document - data:", doc.data());
          iNfunction(null,doc.data());
      } else {
          LOG.printObject(functionAddress, 'getMessage',  "No such document!");
          iNfunction("No such document!",null);
      }
    }
  );

} _.getMessage = getMessage;

function getMessageType (iNmsgObject) {
  /*
    @inputs
      @required
        iNmsgObject   -> object (from message db)
  */
  if ( typeof iNmsgObject != 'object' ) iNmsgObject = {};
  var msgType = iNmsgObject.type, result = false;
  switch (msgType) {
    case 1:
      result = 'simpleText';
    break;

    case 20:
      result = 'liveAudio';
    break;

    case 21:
      result = 'liveVideo';
    break;
  }
  return result;
} _.getMessageType = getMessageType;

function getSrc (iNmsgObject) {
  if (typeof iNmsgObject != 'object' )return false;
  if (typeof iNmsgObject.info != 'object' )return false;
  if (typeof iNmsgObject.info.src != 'string' )return false;
  return iNmsgObject.info.src;
} _.getSrc = getSrc;

function getUid (iNmsgObject) {
  if (typeof iNmsgObject != 'object' )return false;
  if (typeof iNmsgObject.uid != 'string' )return false;
  return iNmsgObject.info.uid;
} _.getUid = getUid;

function getMessageLinkToStorage (iNchatId, iNmsgId, iNmsgObject) {
  /*
    @inputs
      @required
        iNmsgObject   -> object (from message db)
  */
  // chats/$chatId/$userId/$msgType/$msgId/file.exe
  var msgType = getMessageType(iNmsgObject),
      chatId  = iNchatId,
      msgId   = iNmsgId,
      userId  = getUid(iNmsgObject),
      file    = getSrc(iNmsgObject);
  if (!msgType || !file) return false;
  return `chats/${chatId}/${userId}/${msgType}/${msgId}/${file}`;
} _.getMessageLinkToStorage = getMessageLinkToStorage;

module.exports  = _;
