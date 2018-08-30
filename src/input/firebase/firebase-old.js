var CONNECT   = require('./../connect');
var FirebaseOld  = require("./firebase_install");
const LOG     = require('ramman-z-log');
// var FADMIN    = FirebaseOld.firebase;




var Datebase      = FirebaseOld.database;
var Firestore     = FirebaseOld.firestore;
var _ = {
  'admin'     :  FirebaseOld,
  'firestore' :  Firestore,
  'database'  :  Datebase
};


//@< FIRESTORE
//
//
LOG.printObject ( 'Firestore _', Firestore );

function getBatchFirestoreDb (iNdb) {
    return iNdb.batch();
}
_['getBatchFirestoreDb'] = getBatchFirestoreDb;

function getGroupBatchFirestoreDb (iNdb) {
    console.log('getGroupBatchFirestoreDb - iNdb', iNdb );
    let result =  {
        batch: iNdb.batch(),
        group: {
            update      : {},
            delete      : {},
            set         : {},
            mergeSet    : {}
        },
        db: iNdb
    };
    console.log('getGroupBatchFirestoreDb - result', JSON.stringify(result) );

    return result;
}
_['getGroupBatchFirestoreDb'] = getGroupBatchFirestoreDb;
//

function runBatchFirestoreDb (iNfirestoreBatch, iNfunctions) {
    if(typeof iNfunctions != 'object') iNfunctions = {};
      // Commit the batch

      LOG.print ('runBatchFirestoreDb iNfirestoreBatch, iNfunctions', iNfirestoreBatch, iNfunctions );
      iNfirestoreBatch.commit().then(function () {
          LOG.print ('runBatchFirestoreDb iNfirestoreBatch.commit()');
          if(typeof iNfunctions['onSuccess'] == 'function') iNfunctions['onSuccess'] ();
      }).catch (
        (e) => {
          LOG.print ('runBatchFirestoreDb iNfirestoreBatch onError', e);
          if(typeof iNfunctions['onError'] == 'function') iNfunctions['onError'] ();
        }
      );
}
_['runBatchFirestoreDb'] = runBatchFirestoreDb;

function getFirestoreDb () {
    return Firestore();
}
_['getFirestoreDb'] = getFirestoreDb;

function copyUpdateFirestoreObjectToSetObject(iNupdateObject, iNobject) {
    const fname = 'copyUpdateFirestoreObjectToSetObject';

    LOG.fstep(fname, 0, 0, 'INVOKE - iNupdateObject, iNobject', iNupdateObject, iNobject );

    for ( let updateObjKey of Object.keys(iNupdateObject) ) {
        let data = iNupdateObject[updateObjKey];
        LOG.fstep(fname, 2, 0, 'updateObjKey, data', updateObjKey, data, iNobject );
        CONNECT.addValueToObjectByPath ( iNobject, updateObjKey, data );
        LOG.fstep(fname, 3, 0, 'iNobject', iNobject );
    }

    LOG.fstep(fname, 4, 0, 'return', iNobject );
    return iNobject;
}

async function writeBatchFirestoreDbGroup (iNfirestoreBatchGroup) {
    //@return - promise
    const fname = 'writeBatchFirestoreDbGroup';
    LOG.fstep(fname, 0, 0, 'INVOKE');

    let group       = iNfirestoreBatchGroup['group'],
        db          = iNfirestoreBatchGroup['db'],
        batch       = iNfirestoreBatchGroup['batch'];

    LOG.fstep(fname, 1, 0, 'group', group );

    //@< delete
        if ( typeof group['delete'] === 'object' ) {
            for ( let deletePatch of Object.keys(group['delete']) ) {
                if ( group ['delete'][deletePatch]   )  delete group['delete'][deletePatch];
                if ( group ['update'][deletePatch]   )  delete group['update'][deletePatch];
                if ( group ['set'][deletePatch]      )  delete group['set'][deletePatch];

                LOG.fstep(fname, 2, 0, 'delete', deletePatch );
                // delete - batch
                batch.delete( db.doc(deletePatch) );
            }
        }
    //@> delete

    //@< set
        if ( typeof group['set'] === 'object' ) {
            for ( let setPatch of Object.keys(group['set']) ) {
                if ( group ['update'][setPatch]   )  {
                    // if we have in update this doc ->
                    LOG.fstep( fname, 3, 1, 'setPatch, group [\'update\'][setPatch] ', setPatch, group ['update'][setPatch] );

                    let newSetBlock  = copyUpdateFirestoreObjectToSetObject (
                        group['update'][ setPatch ],
                        group['set'][ setPatch ]
                    );

                    LOG.fstep( fname, 3, 2, 'newSetBlock ', newSetBlock );

                    group['set'][ setPatch ] = newSetBlock;

                    LOG.fstep( fname, 3, 3, 'setPatch, group[\'set\'][setPatch] merge', setPatch, group['set'][setPatch] );

                    // delete from update
                    delete group['update'][setPatch];
                }

                LOG.fstep(fname, 4, 0, 'setPatch, group[\'set\'][setPatch]', setPatch, group['set'][setPatch] );
                if ( group['mergeSet'][setPatch] ) {
                    delete group['mergeSet'][setPatch];
                    batch.set( db.doc(setPatch), group['set'][ setPatch ], { merge : true } );
                } else {

                    batch.set( db.doc(setPatch), group['set'][ setPatch ] );
                }

            }
        }
    //@> set

    //@< update
        if ( typeof group['update'] === 'object' ) {
            for ( let updatePatch of Object.keys(group['update']) ) {
                // update - batch
                LOG.fstep(fname, 5, 0, 'update - updatePatch, group[\'update\'][updatePatch]', updatePatch, group['update'][updatePatch] );
                batch.update( db.doc(updatePatch), group['update'][ updatePatch ] );
            }
        }
    //@> update

    LOG.fstep(fname, 6, 0, 'group', group );

    return new Promise(
        (resolve) => {
            runBatchFirestoreDb (
                batch,
                {
                    onSuccess : () => {
                        resolve(true);
                    },
                    onError   : (err) => {
                        resolve(false);
                    }
                }
            );
        }
    )
}
_['writeBatchFirestoreDbGroup'] = writeBatchFirestoreDbGroup;

async function writeBatchFirestoreDb (iNfirestoreBatch) {
    //@return - promise
    return new Promise(
        (resolve) => {
            runBatchFirestoreDb (
                iNfirestoreBatch,
                {
                    onSuccess : () => {
                        resolve(true);
                    },
                    onError   : (err) => {
                        resolve(false);
                    }
                }
            );
        }
    )
}
_['writeBatchFirestoreDb'] = writeBatchFirestoreDb;

function batchGroupUpdate ( iNpath, iNdata, iNfirestoreBatchGroup ) {
    /*
                    onError -> function
    */
    let firestoreBatchGroup = iNfirestoreBatchGroup,
        updateGroup         = firestoreBatchGroup['group']['update'];
    return new Promise (
        (resolve) => {
            if ( updateGroup[iNpath] ) {
                updateGroup[iNpath] = CONNECT.mergeObject( iNdata, updateGroup[iNpath] );
            } else {
                updateGroup[iNpath] = iNdata;
            }
            resolve(true);
        }
    )
}
_['batchGroupUpdate'] = batchGroupUpdate;



// async function writeBatchFirestoreDbBatch (iNfirestoreBatch) {
//     //@return - promise
//     return new Promise(
//         (resolve) => {
//             runBatchFirestoreDb (
//                 iNfirestoreBatch,
//                 {
//                     onSuccess : () => {
//                         resolve(true);
//                     },
//                     onError   : (err) => {
//                         resolve(false);
//                     }
//                 }
//             );
//         }
//     )
// }
// _['writeBatchFirestoreDbBatch'] = writeBatchFirestoreDbBatch;





function batchUpdate ( iNpath, iNdata, iNdb, iNbatch) {
    /*
                    onError -> function
    */
    return new Promise(
        (resolve) => {
            try {

                let ref = iNdb.doc(iNpath);
                 iNbatch.update(ref, iNdata );

                 resolve(true);
            } catch (e) {
                resolve(false);
                console.log('batchUpdate - e', e);
            }
        }
    )
}
_['batchUpdate'] = batchUpdate;


function batchDelete ( iNpath, iNdb, iNbatch) {
    /*
    */
    return new Promise(
        (resolve) => {
            let ref = iNdb.doc(`${iNpath}`);
            iNbatch.delete(ref );
            resolve(true);
        }
    )
}
_['batchDelete'] = batchDelete;

function batchGroupDelete ( iNpath, iNfirestoreBatchGroup ) {
    /*
        batchGroupDelete
    */
    let firestoreBatchGroup = iNfirestoreBatchGroup,
        deleteGroup         = firestoreBatchGroup['group']['delete'];
    return new Promise (
        (resolve) => {
            deleteGroup[iNpath] = iNpath;
            resolve(true);
        }
    )
}
_['batchGroupDelete'] = batchGroupDelete;

function batchGroupCreate ( iNpath, iNdata, iNfirestoreBatchGroup, iNmerge = false ) {
    /*
        batchGroupCreate
    */
    let firestoreBatchGroup = iNfirestoreBatchGroup,
        setGroup            = firestoreBatchGroup['group']['set'];

    if (iNmerge) {
        firestoreBatchGroup['group']['mergeSet'][iNpath] = true;
    } else {
        firestoreBatchGroup['group']['mergeSet'][iNpath] = null;
    }

    return new Promise (
        (resolve) => {
            if ( setGroup[iNpath] ) {
                setGroup[iNpath] = CONNECT.mergeObject( iNdata, setGroup[iNpath] );
            } else {
                setGroup[iNpath] = iNdata;
            }
            resolve(true);
        }
    )
}
_['batchGroupCreate'] = batchGroupCreate;

function safeUpdateFirestoreDb ( iNcollection, iNpath, iNdata, iNfunctions , iNdb, iNbatch) {
    /*
        @disrc
            safe update firestore db
        @inputs
            @required
                iNcollection -> string
                iNpath -> string
                iNdata -> object
                    type
                    data
            @optional
                iNfunctions -> function
                    onSuccess -> function
                    onError -> function
    */
    addFirestoreDb_ (true, iNcollection, iNpath, iNdata, iNfunctions , iNdb, iNbatch);
}
_['safeUpdateFirestoreDb'] = safeUpdateFirestoreDb;

function safeCreateFirestoreDb ( iNcollection, iNpath, iNdata , iNdb, iNbatch) {
    /*
        @disrc - return Promise

            safe update firestore db
        @inputs
            @required
                iNcollection -> string
                iNpath -> string
                iNdata -> object
                    type
                    data
            @optional
                iNfunctions -> function
                    onSuccess -> function
                    onError -> function
    */

    return new Promise(
        (resolve) => {
            addFirestoreDb_ (false, iNcollection, iNpath, iNdata,
                {
                    onSuccess: () => {
                        resolve(true);
                    },
                    onError: () => {
                        resolve(false);
                    }
                }, iNdb, iNbatch);
        }
    )

}
_['safeCreateFirestoreDb'] = safeCreateFirestoreDb;



function addFirestoreDb ( iNcollection, iNpath, iNdata, iNfunctions , iNdb, iNbatch) {
    /*
        @disrc
            safe update firestore db
        @inputs
            @required
                iNcollection -> string
                iNpath -> string
                iNdata -> object
                    type
                    data
            @optional
                iNfunctions -> function
                    onSuccess -> function
                    onError -> function
    */
    addFirestoreDb_(false, iNcollection, iNpath, iNdata, iNfunctions , iNdb, iNbatch);
}
_['addFirestoreDb'] = addFirestoreDb;


function addFirestoreDb_ (iNmerge, iNcollection, iNpath, iNdata, iNfunctions , iNdb, iNbatch ) {
    /*
        @disrc
            add data firestore db
        @inputs
            @required
                iNcollection -> string
                iNpath -> string
                iNdata -> object
                    type
                    data
            @optional
                iNfunctions -> function
                    onSuccess -> function
                    onError -> function
    */
    if(typeof iNfunctions != 'object') iNfunctions = {};

    var baseKey = iNcollection + '/' + iNpath, docRef;

    if ( typeof iNdb != 'undefined') {
        docRef = iNdb.doc(baseKey);

    }
    else
        docRef = Firestore().doc(baseKey);

    if(typeof iNbatch != 'undefined') {
      //#if batch common one query
      if (iNmerge) {
        iNbatch.set( docRef, iNdata, { merge : true } );
      } else {
        iNbatch.set( docRef, iNdata );
      }

      LOG.print ('addFirestoreDb_ by batch SUCCESS baseKey, docRef', baseKey, docRef);

      if(typeof iNfunctions['onSuccess'] == 'function' ) iNfunctions['onSuccess'](docRef);

    } else {
      // Update the timestamp field with the value from the server
      LOG.print ('addFirestoreDb_ by set',iNdata);
      (
        () => {
          if (iNmerge) {
            return docRef.set (iNdata,{ merge : true });
          } else {
            return docRef.set (iNdata );
          }
        }
      )().then (
        (docRef) => {
          LOG.print ('addFirestoreDb_ SUCCESS baseKey, docRef', baseKey, docRef);
          if(typeof iNfunctions['onSuccess'] == 'function' ) iNfunctions['onSuccess'](docRef);
        }
      ).catch (
        (error) => {
          LOG.print ('addFirestoreDb_ EROR baseKey, error', baseKey, error);
          if(typeof iNfunctions['onError'] == 'function' ) iNfunctions['onError'](error);
        }
      );
    }
}

function getFirestoreSeverVarTimestamp () {
    return FirebaseOld.firestore.FieldValue.serverTimestamp();
}
_['getFirestoreSeverVarTimestamp'] = getFirestoreSeverVarTimestamp;


function isFirestoreLocalMutation (doc) {
    return doc.et.hasLocalMutations;
}
_['isFirestoreLocalMutation'] = isFirestoreLocalMutation;

function generateIdForFirestoreByFullPathToDb ( iNcollection, iNpath ) {
  var path = '';
  if ( typeof iNcollection == 'string' )  path = iNcollection;
  if ( typeof iNpath == 'string' )        path += '/' +  iNpath;

  var generateIdForRealtimeDbByFullPathToDb = Firestore().collection(path).doc();
  return generateIdForRealtimeDbByFullPathToDb.id;
}
_['generateIdForFirestoreByFullPathToDb'] = generateIdForFirestoreByFullPathToDb;
//
//
//@> FIRESTORE
function multiMoveData (iNobject,iNfunction) {
  if(typeof(iNobject) != 'object')return false;
  var keys = Object.keys(iNobject);
  if( keys.length > 0 ) {
  	var fkey = keys[0];
    if(typeof(iNobject[fkey]) == 'string'){
      moveData (fkey,iNobject[fkey],function(){
        delete iNobject[fkey];
        multiMoveData(iNobject,iNfunction);
      });
    }
  } else {
  	if(typeof(iNfunction) == 'function') iNfunction();
  }
}
_.multiMoveData  = multiMoveData;




function moveData (iNfromTable,iNtoTable,iNfunction) {
  getData( iNfromTable , function(err,data) {
      var fromTable = iNfromTable;
      if(!err){
        var dataFrom = data.val();
        if(Array.isArray(dataFrom))dataFrom=CONNECT.convertArrayToObject(dataFrom);
        if(typeof(dataFrom) == 'object' && Object.keys(dataFrom).length > 0 ){
          //delete if value == remove
          if( iNtoTable != 'remove' ) updateData(iNtoTable,dataFrom);
          removeData(fromTable,iNfunction);
          return true;
        }

        //@@@ with get -> concat -> set
        // getData(iNtoTable,function(errTo,dataTo){
        //     var fromTableInFinal = fromTable;
        //     dataTo = dataTo.val();
        //     var dataFromTo = dataTo.toJSON;
        //     var updatedData = null;
        //     if(!errTo){
        //       updatedData = CONNECT.concat_json(dataFrom,dataFromTo);
        //       updateData(iNtoTable,updatedData);
        //     }
        //     removeData(fromTableInFinal,iNfunction);
        // });
      }
      if(typeof(iNfunction)=='function')iNfunction();
      return null;
  });
}
_.moveData  = moveData;


function updateData (iNtable,iNdata) {
  var tablePath = iNtable;
  var ref = FADMIN.database().ref(tablePath);
  ref.update(iNdata);
}
_.updateData  = updateData;

function setData (iNtable,iNdata,iNfunction) {
  var tablePath = iNtable;
  var ref = FADMIN.database().ref(tablePath);
  ref.set(iNdata, function ( error ) {
    if (error) {
      iNfunction(error);
    } else {
      iNfunction(false);
    }
  });
}
_.setData  = setData;

function getData (iNtable,iNfunction) {
  var tablePath = iNtable;
  var ref = FADMIN.database().ref(tablePath);
  ref.once('value')
  .then(function(dataSnapshot) {
    if ( typeof(iNfunction) == 'function' ) iNfunction(false,dataSnapshot);
  }).catch(function(error) {
      LOG.printObject("Firebase","ERROR getData " + error.message);
      if ( typeof(iNfunction) == 'function' ) iNfunction(error,false);
  });
}
module.exports.getData  = getData;



function removeData (iNtable,iNfunction) {
  var tablePath = iNtable;
  var ref = FADMIN.database().ref(tablePath);
  ref.remove()
    .then(function() {
      LOG.printObject("Firebase","Remove succeeded.");
      if(typeof(iNfunction) == 'function')iNfunction(false);
    })
    .catch(function(error) {
      LOG.printObject("Firebase","Remove failed: " + error.message);
      if(typeof(iNfunction) == 'function')iNfunction(error);
    });
}
_.removeData  = removeData;


//@@@<<< USERS
    function removeUser (iNuid,iNfunction) {
      var uid = iNuid;
      FADMIN.auth().deleteUser(uid)
      .then(function() {
        LOG.printObject("Firebase","Successfully deleted user");
        if(typeof(iNfunction) == 'function')iNfunction(false);
      })
      .catch(function(error) {
        LOG.printObject("Firebase","Error deleting user:", error);
        if(typeof(iNfunction) == 'function')iNfunction(error);
      });
    }
    _.removeUser  = removeUser;

    function createUser (iNdata,iNfunction) {
      /*
        @inputs
          @required
            iNdata -> object
              @required
                uid -> string
              @optional
                email -> string
                emailVerified
                pswd -> string
                dName -> string
                icon -> string
      */
      if( typeof(iNdata) != 'object' || typeof(iNdata['uid']) != 'string' )return false;
      var data = { 'uid' : iNdata['uid'] };
      if( typeof(iNdata['email']) == 'string' )         data['email']         = iNdata['email'];
      if( typeof(iNdata['emailVerified']) == 'string' ) data['emailVerified'] = iNdata['emailVerified'];
      if( typeof(iNdata['pswd']) == 'string' )          data['password']      = iNdata['pswd'];
      if( typeof(iNdata['icon']) == 'string' )          data['photoURL']      = iNdata['icon'];
      if( typeof(iNdata['dName']) == 'string' )         data['displayName']   = iNdata['dName'];
      FADMIN.auth().createUser(
        data
        ).then(function(userRecord) {
          LOG.printObject("FIREBASE","createUser", userRecord.uid);
          if(typeof(iNfunction)=='function')iNfunction(false,userRecord);
        }).catch(function(error) {
          LOG.printObject ("FIREBASE","ERROR CreateUser", error);
          if( typeof(iNfunction)=='function' ) iNfunction(error,false);
        });
    }
    _.createUser  = createUser;

    function updateUser (iNuid,iNdata,iNfunction) {
      /*
        @inputs
          @required
            iNuid             -> string
            iNdata            -> object
              @optional
                email         -> string
                emailVerified -> string
                password      -> string
                displayName   -> string
                icon          -> string
          @optinal
            iNfunction        -> function
      */
      if (
        typeof(iNuid)   != 'string' ||
        typeof(iNdata)  != 'object'
      ) return false;
      var uid = iNuid, data = {};
      if( typeof(iNdata['email']) == 'string' )         data['email']         = iNdata['email'];
      if( typeof(iNdata['emailVerified']) == 'string' ) data['emailVerified'] = iNdata['emailVerified'];
      if( typeof(iNdata['pswd']) == 'string' )          data['password']      = iNdata['pswd'];
      if( typeof(iNdata['icon']) == 'string' )          data['photoURL']      = iNdata['icon'];
      if( typeof(iNdata['dName']) == 'string' )         data['displayName']   = iNdata['dName'];

      if(Object.keys(data).length < 1){
        if(typeof(iNfunction) == 'function') iNfunction("error null date for update",false);
      }

      FADMIN.auth().updateUser(uid, data)
        .then(function(userRecord) {
          // See the UserRecord reference doc for the contents of userRecord.
          LOG.printObject("FIREBASE","updateUser"+ userRecord.toJSON());
          if(typeof(iNfunction) == 'function') iNfunction(false,userRecord);
        })
        .catch(function(error) {
          LOG.printObject ("FIREBASE","ERROR updateUser", error);
          if(typeof(iNfunction) == 'function') iNfunction(error,false);
        });
    }
    _.updateUser  = updateUser;
//@@@>>> USERS


module.exports = _;
//@@@<<< CHATS
//@@@>>> CHATS
