const LOG             = require('ramman-z-log');
const FIREBASE        = require("./../../firebase/firebase");
      const firestore = FIREBASE.firestore;
const TRIGGER         = require("./../trigger");

const _ = {};



function addTriggerForEventAddMessage (iNchatId, iNobject , iNfunction, iNdb, iNbatch ) {
  /*
    @discr
    @inputs
      @required
        iNchatId  -> string
        iNobject  -> object
          @required
            payload
              @required
                projectId -> string
                uidOfBot -> string
              @optinal
                answerOnlyForBot  -> array
                noAnswerForBot    -> array

          @optional
            authType
            role
            status (@default - 1)
  */
  var fname = 'addTriggerForEventAddMessage';
  LOG.fstep(fname,1,0,'INVOKE - iNchatId, iNobject',iNchatId, iNobject);
  var objForAddTrigger  = { 'event':'addedMessage', 'type' : 'toBotDialogFlow' , 'payload' : {} },
      triggerId         = FIREBASE.generateIdForFirestoreByFullPathToDb('chats', iNchatId + '/triggers'),
      path              = iNchatId + '/triggers/' + triggerId;

  if ( typeof iNobject != 'object' ) iNobject = {};

  // add role     if need
  if ( typeof iNobject.role == 'number' )       objForAddTrigger.role = iNobject.role;

  // add authType if need
  if ( typeof iNobject.authType == 'string' )   objForAddTrigger.authType = iNobject.authType;

  // add status   if need
  if ( typeof iNobject.status == 'number' )     objForAddTrigger.status = iNobject.status;

  LOG.printObject('addTriggerForEventAddMessage 1- objForAddTrigger', objForAddTrigger, triggerId , path);
  // add projectId && uidOfBot  OR return
  if (
      (typeof iNobject.payload == 'object' && typeof iNobject.payload.projectId == 'string') &&
      (typeof iNobject.payload.uidOfBot == 'string')
    ) {
      objForAddTrigger.payload = {
        'projectId'   : iNobject.payload.projectId,
        'uidOfBot'    : iNobject.payload.uidOfBot
      };
  } else {
    LOG.ferror(fname,1,1,'We cannot uidOfBot or project in payload',iNobject, objForAddTrigger);
    return;
  }


  // add users for bot wil not answer
  if ( !Array.isArray(iNobject.payload.noAnswerForBot) ) {
    iNobject.payload.noAnswerForBot = [];
  }
  objForAddTrigger.payload.noAnswerForBot     = iNobject.payload.noAnswerForBot;

  // add users for bot wil  answer only for them
  if ( !Array.isArray(iNobject.payload.answerOnlyForBot) ) {
    iNobject.payload.answerOnlyForBot = [];
  }
  objForAddTrigger.payload.answerOnlyForBot   = iNobject.payload.answerOnlyForBot;

  // add supported languages 
  if ( !Array.isArray(iNobject.payload.supportedLang) ) {
    iNobject.payload.supportedLang = [];
  }
  objForAddTrigger.payload.supportedLang   = iNobject.payload.supportedLang;


  LOG.fstep(fname,1,1,'finished - objForAddTrigger',objForAddTrigger);

  TRIGGER.createTrigger ('chats', path , objForAddTrigger , iNfunction, iNdb, iNbatch )


} _.addTriggerForEventAddMessage = addTriggerForEventAddMessage;


function getTriggerByEventAddedMessage ( iNuid, iNobject , iNfunction ) {
  /*
    @discr
    @inputs
      @required
        iNobject  -> object
          @required
          @optional
            authType
            role
            status (@default - 1)
  */
  iNobject['event'] = 'addedMessage';
  // iNobject['type']  = 'toBotDialogFlow';
  var path = 'users/' + iNuid + '/triggers';
  TRIGGER.getTrigger (
    path,
    iNobject,
    (err, resultObj) => {
      LOG.printObject('getTriggerByEventAddedMessage - docs',err, resultObj);
      iNfunction(err, resultObj);
    }
  );

} _.getTriggerByEventAddedMessage = getTriggerByEventAddedMessage;

module.exports = _;
