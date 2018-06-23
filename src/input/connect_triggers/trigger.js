const LOG             = require('ramman-z-log');
const FIREBASE        = require("./../firebase/firebase");
      const firestore = FIREBASE.firestore;

const _ = {};


// function getTriggerByAuthType (  iNquerySnapshot, iNfunction ) {
//
// }


function createTrigger ( iNcollection, iNpath, iNobject , iNfunction, iNdb, iNbatch ) {
  /*
    @discr
      add triger to firesotre db
    @inputs
      @required
        iNcollection -> strign
        iNpath    -> string
        iNobject  -> object
          @required
            type
            event
            payload -> object
          @optional
            role
            status (@default - 1)
            authType (@default - @)
            limit (@default - 1)
            weight (@default - 0)
  */
  // guard
  LOG.printObject ('triggers/createTrigger createTrigger INVOKE',iNcollection, iNpath, iNobject);
  if (
    typeof iNcollection != 'string' ||
    typeof iNpath       != 'string' ||
    typeof iNobject     != 'object' ||

    typeof iNobject.payload != 'object' ||
    typeof iNobject.event != 'string' ||
    typeof iNobject.type != 'string'
  ) return;


  //default values
  if(iNobject.weight    != 'number') iNobject.weight = 0;
  if(iNobject.role      != 'number') iNobject.role = 0;
  if(iNobject.status    != 'number') iNobject.status = 1;
  if(iNobject.authType  != 'string') iNobject.authType ='*';
  if(iNobject.time      != 'object') iNobject.time = FIREBASE.getFirestoreSeverVarTimestamp();


  var objForAddToTriggerDb = {
    'payload' : iNobject.payload,
    'event'   : iNobject.event,
    'type'    : iNobject.type,
    'role'    : iNobject.role,
    'authType': iNobject.authType,
    'time'    : iNobject.time,
    'weight'  : iNobject.weight,
    'status'  : iNobject.status
  };
  LOG.print('triggers/createTrigger createTrigger - objForAddToTriggerDb', objForAddToTriggerDb);

  // add to db
  FIREBASE.safeUpdateFirestoreDb (
    iNcollection,
    iNpath,
    objForAddToTriggerDb,
    {
      'onSuccess' : (s) => {
        LOG.print('triggers/createTrigger createTrigger safeUpdateFirestoreDb - s',s);
        iNfunction(null,objForAddToTriggerDb);
      },
      'onError' : (e) => {
        LOG.print('triggers/createTrigger createTrigger safeUpdateFirestoreDb - e',e);
        iNfunction(e,false);
      },
    },
    iNdb,
    iNbatch
  );

} _.createTrigger = createTrigger;


// getTrigger (
//   'users/sharepay/triggers',
//   {
//       "event": "createdMainChat"
//   },
//   (err,data)=> {console.log('sss err,data',err,data);}
// )

function getTrigger ( iNpath, iNobject , iNfunction ) {
  /*
    @discr
      get triger from db
    @inputs
      @required
        iNpath    -> string
        iNobject  -> object
          @required
            type
            event
          @optional
            role
            status (@default - 1)
            authType (@default - @)
            limit (@default - 1)
  */
  LOG.printObject('connect_triggers/getTrigger - INVOKE',iNpath, iNobject);
  var path = iNpath, status, role, authType, ref;

  // default status only active trigger rules
  if ( typeof iNobject.status != 'number' ) iNobject.status = 1;
  // default role 0
  // if ( typeof iNobject.role   != 'number' ) iNobject.role   = 0;

  // default only for auth user
  if ( typeof iNobject.authType   != 'string' ) iNobject.authType   = '@';
  // default set limit = 1
  // if ( typeof iNobject.limit   != 'number' ) iNobject.limit   = 1;

  status    = iNobject.status;
  // role      = iNobject.role;
  authType  = iNobject.authType;
  // limit     = iNobject.limit;

  ref = firestore ()
    .collection( path )
    .where('status',  '==', status);
    // .where('role',    '==', role)


  if ( typeof iNobject.type   == 'string' ) ref  = ref.where('type',    '==', iNobject.type);
  if ( typeof iNobject.event  == 'string' ) ref  = ref.where('event',   '==', iNobject.event);
  if ( typeof iNobject.role   == 'number' ) ref  = ref.where('role',    '==', iNobject.role);

  // add weight rule => add rule
  ref = ref.orderBy ('weight','desc').orderBy ('time','desc');//.limit(limit);

  ref.get().then(
    (querySnapshot) => {
      if ( !querySnapshot.empty ) {
          // we has data
            var BreakException = {};
            // querySnapshot.forEach (
            //   (doc) => {
                var resultObj, isSuccess = false;
                try {
                  // if(!querySnapshot.empty){
                    querySnapshot.forEach (
                      (doc) => {
              			  	// throw BreakException;
              		    	let docObject        = doc.data();
                          	docObject['id']  = doc.id;
                        LOG.printObject('connect_triggers/getTrigger - docObject',docObject);
                        if ( docObject.authType == authType || docObject.authType == '*' ) {
                            resultObj   = docObject;
                            throw BreakException;
                        }
              			  }
                    );
                  // }
          			} catch (e) {
          			  if (e === BreakException) {
                    // we found need object invoke result func with success
                    isSuccess = true;
                  }

          			} finally {
                  if (isSuccess) {
                    // we found need object invoke result func with success
                    iNfunction(null,resultObj);
                  } else {
                    // we NOT found need object invoke result func with fail
                    iNfunction(true);

                  }
                }
            //   }
            // );
      } else {
          // we has not data
          iNfunction( true );
      }
    }
  ).catch (
    (e) => {
        LOG.print ('connect_triggers/getTrigger - e',e);
        // we has not data
        iNfunction( true );
    }
  );
} _.getTrigger = getTrigger;

module.exports = _;
