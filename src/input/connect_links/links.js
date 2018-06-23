const CONNECT   = require('./../connect');
const LOG       = require('ramman-z-log');
const FIREBASE  = require("./../firebase/firebase");
      const firestore = FIREBASE.firestore;
// const LFIREBASE = require("./../firebase/firebase");
// const DINAMO    = require("./../aws/dinamo");

const _ = {};
var functionAddress = 'connect_links/links.js ';


function addChatLinkByMsgId ( iNchatId, iNmsgId, iNuid, iNlink, iNpath, iNfunction) {
  // 12 hours
  var hours = 12 * 60 * 60 * 1000;

  var expired = new Date( new Date().getTime() + hours );
  var time    = new Date();

  var objForAddToLinkDb = {
    'time'    : time,
    'expired' : expired,
    'msgId'   : iNmsgId,
    'userId'  : iNuid,
    'link'    : iNlink,
    'path'    : iNpath,
    'status'  : 1,
  };

  var pathToLinkDb = iNchatId + '/links/' + iNmsgId;
  FIREBASE.addFirestoreDb (
    'chats',
    pathToLinkDb,
    objForAddToLinkDb,
    {
      'onSuccess' : (data) => {
        if ( typeof iNfunction == 'function' ) iNfunction (false, data);
      },
      'onError'   : (err) => {
        if ( typeof iNfunction == 'function' ) iNfunction (err, false);
      }
    }
  );
} _.addChatLinkByMsgId = addChatLinkByMsgId;

function getChatLinkByMsgId (iNchatId,iNmsgId,iNfunction) {
  /*
    @inputs
      @required
        iNchatId       -> string
        iNmsgId       -> string
        iNfunction  -> function
  */
  var pathToFireStoreDb = 'chats/'+iNchatId+'/links/'+iNmsgId;
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

} _.getChatLinkByMsgId = getChatLinkByMsgId;

function checkChatLinkByMsgId (iNchatId,iNmsgId,iNfunction) {
  /*
    @discr

    @inputs
      @required
        iNchatId       -> string
        iNmsgId       -> string
        iNfunction  -> function
  */
  getChatLinkByMsgId (
    iNchatId,
    iNmsgId,
    (err, data) => {
      if(err) {
        //ERROR we has not link
        iNfunction(err, data);
        return;
      }
      //SUCCESS we has link
      if (typeof data.expired == 'object' && data.expired.getTime() > new Date().getTime() && data.status == 1) {
        // SUCCESS link is not expired
        iNfunction(null,data);
      } else {
        // ERROR link is expired
        iNfunction("Link is expired",data);
      }
    }
  );
} _.checkChatLinkByMsgId = checkChatLinkByMsgId;

module.exports  = _;
