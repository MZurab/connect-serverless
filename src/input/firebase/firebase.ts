import {Connect} from "../connect";
import {fadmin} from "./firebase_install";
import {Observable, Observer} from "rxjs";
import * as mzCommon from 'mz-common';
import {map} from "rxjs/operators";
import {USER} from "../connect_access/user";

const FADMIN    = fadmin.firebase;

export namespace LFIREBASE {
    import getEmptyObservable = USER.getEmptyObservable;
    export const    admin = fadmin,
        database = fadmin.database,
        firestore = fadmin.firestore;


    export function getBatchFirestoreDb (db: any) {
        return db.batch();
    }

    export function getGroupBatchFirestoreDb (db: any): any {
        return  {
            batch: db.batch(),
            group: {
                update      : {},
                delete      : {},
                set         : {},
                mergeSet    : {}
            },
            db: db
        };
    }
//

    export function runBatchFirestoreDb (iNfirestoreBatch: any): Observable<{err: any}> {
        // if(typeof iNfunctions != 'object') iNfunctions = {};

        return Observable.create(
            (observer: Observer<{err: any}>) => {
                iNfirestoreBatch.commit().then(
                    () => {
                        // if(typeof iNfunctions['onSuccess'] == 'function') iNfunctions['onSuccess'] ();
                        observer.next({err: false});
                        observer.complete();
                    }
                ).catch (
                    (e) => {
                        // if(typeof iNfunctions['onError'] == 'function') iNfunctions['onError'] ();
                        observer.next({err: e});
                        observer.complete();
                    }
                );
            }
        )
    }

    export function getFirestoreDb (): any {
        return firestore();
    }

    export function copyUpdateFirestoreObjectToSetObject(iNupdateObject: any, iNobject: any) {
        // const fname = 'copyUpdateFirestoreObjectToSetObject';
        // LOG.fstep(fname, 0, 0, 'INVOKE - iNupdateObject, iNobject', iNupdateObject, iNobject );

        for ( let updateObjKey of Object.keys(iNupdateObject) ) {
            let data = iNupdateObject[updateObjKey];
            // LOG.fstep(fname, 2, 0, 'updateObjKey, data', updateObjKey, data, iNobject );
            mzCommon.mz.addValueToObjectByPath ( iNobject, updateObjKey, data );
            // LOG.fstep(fname, 3, 0, 'iNobject', iNobject );
        }

        // LOG.fstep(fname, 4, 0, 'return', iNobject );
        return iNobject;
    }

    export function writeBatchFirestoreDbGroup (iNfirestoreBatchGroup: any): Observable<boolean> {
        //@return - promise
        // const fname = 'writeBatchFirestoreDbGroup';
        // LOG.fstep(fname, 0, 0, 'INVOKE');

        let group       = iNfirestoreBatchGroup['group'],
            db          = iNfirestoreBatchGroup['db'],
            batch       = iNfirestoreBatchGroup['batch'];

        // LOG.fstep(fname, 1, 0, 'group', group );

        //@< delete
        if ( typeof group['delete'] === 'object' ) {
            for ( let deletePatch of Object.keys(group['delete']) ) {
                if ( group ['delete'][deletePatch]   )  delete group['delete'][deletePatch];
                if ( group ['update'][deletePatch]   )  delete group['update'][deletePatch];
                if ( group ['set'][deletePatch]      )  delete group['set'][deletePatch];

                // LOG.fstep(fname, 2, 0, 'delete', deletePatch );
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
                    // LOG.fstep( fname, 3, 1, 'setPatch, group [\'update\'][setPatch] ', setPatch, group ['update'][setPatch] );

                    let newSetBlock  = copyUpdateFirestoreObjectToSetObject (
                        group['update'][ setPatch ],
                        group['set'][ setPatch ]
                    );

                    // LOG.fstep( fname, 3, 2, 'newSetBlock ', newSetBlock );

                    group['set'][ setPatch ] = newSetBlock;

                    // LOG.fstep( fname, 3, 3, 'setPatch, group[\'set\'][setPatch] merge', setPatch, group['set'][setPatch] );

                    // delete from update
                    delete group['update'][setPatch];
                }

                // LOG.fstep(fname, 4, 0, 'setPatch, group[\'set\'][setPatch]', setPatch, group['set'][setPatch] );
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
                // LOG.fstepp(fname, 5, 0, 'update - updatePatch, group[\'update\'][updatePatch]', updatePatch, group['update'][updatePatch] );
                batch.update( db.doc(updatePatch), group['update'][ updatePatch ] );
            }
        }
        //@> update

        // LOG.fstep(fname, 6, 0, 'group', group );

        return runBatchFirestoreDb(batch).pipe( map( (r) => !r.err ) );
    }

    export function writeBatchFirestoreDb (iNfirestoreBatch: any): Observable<boolean> {

        return runBatchFirestoreDb(iNfirestoreBatch).pipe( map( (r) => !r.err ) );

    }

    export function batchGroupUpdate ( iNpath: any, iNdata: any, iNfirestoreBatchGroup: any ): Observable<boolean> {
        /*
                        onError -> function
        */
        let firestoreBatchGroup = iNfirestoreBatchGroup,
            updateGroup         = firestoreBatchGroup['group']['update'];

        return Observable.create(
            (observer: Observer<boolean>) => {
                if ( updateGroup[iNpath] ) {
                    updateGroup[iNpath] = Connect.mergeObject( iNdata, updateGroup[iNpath] );
                } else {
                    updateGroup[iNpath] = iNdata;
                }
                observer.next(true);
                observer.complete();
            }
        )
    }


    export function batchUpdate ( iNpath: any, iNdata: any, iNdb: any, iNbatch: any): Observable<boolean> {
        /*
                        onError -> function
        */
        // return new Promise(
        //     (resolve) => {
        //         try {
        //
        //             let ref = iNdb.doc(iNpath);
        //             iNbatch.update(ref, iNdata );
        //
        //             resolve(true);
        //         } catch (e) {
        //             resolve(false);
        //             console.log('batchUpdate - e', e);
        //         }
        //     }
        // );

        return Observable.create(
            (observer: Observer<boolean>) => {
                try {
                    let ref = iNdb.doc(iNpath);
                    iNbatch.update(ref, iNdata);

                    observer.next(true );
                } catch (e) {
                    observer.next(false );
                }

                observer.complete();

            }
        )
    }


    export function batchDelete ( iNpath: any, iNdb: any, iNbatch: any): Observable<boolean> {
        /*
        */
        return Observable.create (
            (observer: Observer<boolean>) => {

                let ref = iNdb.doc(`${iNpath}`);
                iNbatch.delete(ref );

                observer.next(true);
                observer.complete();
            }
        );
    }

    export function batchGroupDelete ( iNpath: any, iNfirestoreBatchGroup: any ): Observable<boolean> {
        /*
            batchGroupDelete
        */
        let firestoreBatchGroup = iNfirestoreBatchGroup,
            deleteGroup         = firestoreBatchGroup['group']['delete'];

        return Observable.create (
            (observer: Observer<boolean>) => {
                deleteGroup[iNpath] = iNpath;

                observer.next(true);
                observer.complete();
            }
        );
    }

    export function batchGroupCreate ( iNpath: any, iNdata: any, iNfirestoreBatchGroup: any, iNmerge = false ): Observable<boolean> {
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

        return Observable.create(
            (observer: Observer<boolean>) => {
                if ( setGroup[iNpath] ) {
                    setGroup[iNpath] = Connect.mergeObject( iNdata, setGroup[iNpath] );
                } else {
                    setGroup[iNpath] = iNdata;
                }
                observer.next(true);
                observer.complete();
            }
        )
    }

    export function safeUpdateFirestoreDb ( iNcollection: any, iNpath: any, iNdata: any, iNdb?: any, iNbatch?: any): Observable<{err: any, data: any}> {
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
        return addFirestoreDb_ (true, iNcollection, iNpath, iNdata, iNdb, iNbatch);
    }

    export function safeCreateFirestoreDb ( iNcollection, iNpath, iNdata , iNdb, iNbatch): Observable<boolean> {
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

        return addFirestoreDb_ (false, iNcollection, iNpath, iNdata, iNdb, iNbatch).pipe(
            map((data) => !data.err)
        );

    }

    export function addFirestoreDb ( iNcollection?: any, iNpath?: any, iNdata?: any, iNfunctions?: any , iNdb?: any, iNbatch?: any): Observable<{err: any, data: any}> {
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
        return addFirestoreDb_ (false, iNcollection, iNpath, iNdata , iNdb, iNbatch);
    }

    export function addFirestoreDb_ (iNmerge: any, iNcollection: any, iNpath?: any, iNdata?: any, iNdb?: any, iNbatch?: any ): Observable<{err: any, data: any}> {
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

        let baseKey = iNcollection + '/' + iNpath, docRef;

        if ( typeof iNdb != 'undefined') {
            docRef = iNdb.doc(baseKey);

        }
        else
            docRef = firestore().doc(baseKey);

        return Observable.create(
            (observer: Observer<{err: any, data: any}>) => {
                if (typeof iNbatch != 'undefined') {
                    //#if batch common one query
                    if (iNmerge) {
                        iNbatch.set( docRef, iNdata, { merge : true } );
                    } else {
                        iNbatch.set( docRef, iNdata );
                    }

                    // LOG.print ('addFirestoreDb_ by batch SUCCESS baseKey, docRef', baseKey, docRef);

                    // if(typeof iNfunctions['onSuccess'] == 'function' ) iNfunctions['onSuccess'](docRef);

                    observer.next({err: null, data: docRef});
                    observer.complete();

                } else {
                    // Update the timestamp field with the value from the server
                    // LOG.print ('addFirestoreDb_ by set',iNdata);
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
                            // LOG.print ('addFirestoreDb_ SUCCESS baseKey, docRef', baseKey, docRef);
                            // if(typeof iNfunctions['onSuccess'] == 'function' ) iNfunctions['onSuccess'](docRef);
                            observer.next({err: null, data: docRef});
                            observer.complete();
                        }
                    ).catch (
                        (error) => {
                            // LOG.print ('addFirestoreDb_ EROR baseKey, error', baseKey, error);
                            // if(typeof iNfunctions['onError'] == 'function' ) iNfunctions['onError'](error);
                            observer.next({err: error, data: null});
                            observer.complete();
                        }
                    );
                }
            }
        )
    }

    export function getFirestoreSeverVarTimestamp () {
        return fadmin.firestore.FieldValue.serverTimestamp();
    }


    export function isFirestoreLocalMutation (doc) {
        return doc.et.hasLocalMutations;
    }

    export function generateIdForFirestoreByFullPathToDb ( iNcollection, iNpath ) {
        var path = '';
        if ( typeof iNcollection == 'string' )  path = iNcollection;
        if ( typeof iNpath == 'string' )        path += '/' +  iNpath;

        var generateIdForRealtimeDbByFullPathToDb = firestore().collection(path).doc();
        return generateIdForRealtimeDbByFullPathToDb.id;
    }
//@> FIRESTORE

    export function multiMoveData (iNobject, iNfunction?: (...params:any[]) => any): void {
        if(typeof(iNobject) != 'object') return;
        let keys = Object.keys(iNobject);
        if( keys.length > 0 ) {
            let fkey = keys[0];
            if (typeof(iNobject[fkey]) == 'string') {
                moveData (
                    fkey,
                    iNobject[fkey],
                    () => {
                        delete iNobject[fkey];
                        multiMoveData( iNobject, iNfunction);
                    }
                );
            }
        } else {
            if(typeof(iNfunction) == 'function') iNfunction();
        }
    }




    export function moveData ( iNfromTable: any, iNtoTable: any, iNfunction?: (...params:any[]) => any ) {
        getData( iNfromTable , (err,data) => {
            let fromTable = iNfromTable;
            if(!err){
                var dataFrom = data.val();
                if (Array.isArray(dataFrom)) dataFrom = Connect.convertArrayToObject(dataFrom);
                if (typeof(dataFrom) == 'object' && Object.keys(dataFrom).length > 0 ) {
                    //delete if value == remove
                    if( iNtoTable != 'remove' ) updateData(iNtoTable,dataFrom);
                    removeData(fromTable,iNfunction);
                    return true;
                }
            }
            if(typeof(iNfunction)=='function')iNfunction();
            return null;
        });
    }


    export function updateData (iNtable,iNdata) {
        var tablePath = iNtable;
        var ref = FADMIN.database().ref(tablePath);
        ref.update(iNdata);
    }

    export function setData (iNtable,iNdata,iNfunction) {
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

    export function getData (iNtable,iNfunction) {
        var tablePath = iNtable;
        var ref = FADMIN.database().ref(tablePath);
        ref.once('value')
            .then(function(dataSnapshot) {
                if ( typeof(iNfunction) == 'function' ) iNfunction(false,dataSnapshot);
            }).catch(function(error) {
            if ( typeof(iNfunction) == 'function' ) iNfunction(error,false);
        });
    }



    export function removeData (iNtable,iNfunction) {
        var tablePath = iNtable;
        var ref = FADMIN.database().ref(tablePath);
        ref.remove()
            .then(function() {
                if(typeof(iNfunction) == 'function')iNfunction(false);
            })
            .catch(function(error) {
                if(typeof(iNfunction) == 'function')iNfunction(error);
            });
    }

//@@@<<< USERS
    export function removeUser (iNuid): Observable<{err: any, data: any}> {
        let uid = iNuid;

        return Observable.create(
            (observer: Observer<{err: any, data: any}>) => {
                FADMIN.auth().deleteUser(uid).then(
                    (userRecord) => {
                        observer.next({err: false, data: null});
                        observer.complete();
                    }
                ).catch(
                    (error) =>  {
                        observer.next({err: error, data: null});
                        observer.complete();
                    }
                );

            }
        );
    }

    export function createUser (iNdata: any): Observable<{err: any, data: any}> {
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
        if( typeof(iNdata) != 'object' || typeof(iNdata['uid']) != 'string' )return getEmptyObservable({err: true, data: null});
        let data = { 'uid' : iNdata['uid'] };
        if( typeof(iNdata['email']) == 'string' )         data['email']         = iNdata['email'];
        if( typeof(iNdata['emailVerified']) == 'string' ) data['emailVerified'] = iNdata['emailVerified'];
        if( typeof(iNdata['pswd']) == 'string' )          data['password']      = iNdata['pswd'];
        if( typeof(iNdata['icon']) == 'string' )          data['photoURL']      = iNdata['icon'];
        if( typeof(iNdata['dName']) == 'string' )         data['displayName']   = iNdata['dName'];

        return Observable.create(
            (observer: Observer<{err: any, data: any}>) => {
                FADMIN.auth().createUser( data ).then(
                    (userRecord) => {
                        observer.next({err: false, data: userRecord});
                        observer.complete();
                    }
                ).catch(
                    (error) =>  {
                        observer.next({err: error, data: null});
                        observer.complete();
                    }
                );

            }
        )
    }

    export function updateUser (iNuid,iNdata): Observable<{err: any, data: any}> {
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
        ) return getEmptyObservable({err: true, data: null});

        var uid = iNuid, data = {};
        if( typeof(iNdata['email']) == 'string' )         data['email']         = iNdata['email'];
        if( typeof(iNdata['emailVerified']) == 'string' ) data['emailVerified'] = iNdata['emailVerified'];
        if( typeof(iNdata['pswd']) == 'string' )          data['password']      = iNdata['pswd'];
        if( typeof(iNdata['icon']) == 'string' )          data['photoURL']      = iNdata['icon'];
        if( typeof(iNdata['dName']) == 'string' )         data['displayName']   = iNdata['dName'];

        if(Object.keys(data).length < 1){
            return getEmptyObservable({err: "error null date for update", data: null});
        }

        return Observable.create(
            (observer: Observer<{err: any, data: any}>) => {
                FADMIN.auth().updateUser(uid, data).then(
                    (userRecord) => {
                        observer.next({err: false, data: userRecord});
                        observer.complete();
                    }
                ).catch(
                    (error) =>  {
                        observer.next({err: error, data: null});
                        observer.complete();
                    }
                );

            }
        );
    }
}