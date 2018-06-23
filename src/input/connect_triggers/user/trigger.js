const LOG             = require('ramman-z-log');
const FIREBASE        = require("./../../firebase/firebase");
      const firestore = FIREBASE.firestore;
const TRIGGER         = require("./../trigger");

const _ = {};

function getTriggerByEventCreatingMainChat ( iNuid, iNobject , iNfunction ) {
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
  iNobject['event'] = 'createdMainChat';
  // iNobject['type']  = 'toPseudoUser';
  var path = 'users/' + iNuid + '/triggers';
  TRIGGER.getTrigger(
    path,
    iNobject,
    (err, resultObj) => {
      LOG.printObject( 'getTriggerByEventCreatingMainChat - docs', err, resultObj );
      iNfunction(err, resultObj);
    }
  );

} _.getTriggerByEventCreatingMainChat = getTriggerByEventCreatingMainChat;

module.exports = _;
