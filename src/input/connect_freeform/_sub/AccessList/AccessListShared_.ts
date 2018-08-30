// import * as CONNECT from '../../../connect-old.js';
// import * as FIREBASE from '../../../firebase/firebase-old.js';
// import * as LOG from 'ramman-z-log';
// import {FreeformShared} from './../FreeformShared.js';
// import {GlobalStorage} from './../GlobalStorage/GlobalStorage.js';
//
//
// const firestore = FIREBASE.firestore;
//
// export class AccessListShared_ {
//     // FreeformAccessListForModel
//     constructor() {
//
//     }
//
//     public static async checkListForAccessToFreeformObject (
//         iNoperation: any,
//         iNfolder: any,
//         iNobjModelId: any,
//         iNobjInId: any,
//         iNuser: any,
//         iNmodelId: any,
//         iNformId: any,
//         InExistModel: any,
//         iNclientData: any = null
//     )
//     { //+
//         const fname = 'checkListForAccessToFreeformObject';
//         LOG.fstep (
//             fname,
//             0,
//             0,
//             'iNmodelId, iNformId, InExistModel, iNclientData',
//             iNmodelId, iNformId, InExistModel, iNclientData
//         );
//         LOG.fstep (
//             fname,
//             0,
//             0,
//             'iNoperation, iNfolder, iNobjModelId, iNinId, iNuser',
//             iNoperation, iNfolder, iNobjModelId, iNobjInId, iNuser
//         );
//
//         if (!iNclientData && CONNECT.getUid() ) {
//             // add client data if not passed it && if this user is authed
//             iNclientData = { 'uid': CONNECT.getUid() }
//         }
//
//         let accessType      = FreeformShared.Options.getAccessType(InExistModel),
//             promissArray    = [],
//             objInId         = iNobjInId,
//             objModelId      = iNobjModelId;//{}
//
//         let formActived = FreeformShared.Options.checkActiveTime(InExistModel),
//             formDeaded  = FreeformShared.Options.checkDeadTime(InExistModel),
//             formExpired = FreeformShared.Options.checkExpiredTime(InExistModel),
//             modelActive = FreeformShared.Options.getActive(InExistModel);
//
//         console.log(fname, 'formActived, formDeaded, formExpired, modelActive', formActived, formDeaded, formExpired, modelActive);
//         if (!formActived || !formDeaded || !formExpired || !modelActive) {
//             // form model not actived yet OR dead
//             return CONNECT.returnPromiseWithValue(null);
//         }
//
//         console.log(fname, 'accessType',accessType);
//         for (let accessTypeKey of Object.keys(accessType) ){
//             // skip if this access rule is false
//             console.log('accessType, accessTypeKey, accessType[accessTypeKey]', accessType, accessTypeKey, accessType[accessTypeKey]);
//             if ( !accessType[accessTypeKey] ) {continue;}
//             try {
//                 let checkAccessOperation = await AccessListShared_.checkAccessOperationToFreeformObject (
//                     iNoperation,
//                     iNfolder,
//                     objModelId,
//                     objInId,
//                     iNuser,
//                     iNmodelId,
//                     iNformId,
//                     InExistModel,
//                     iNclientData,
//                     accessTypeKey
//                 );
//                 console.log(fname, 'accessType, accessTypeKey, accessType[accessTypeKey] - checkAccessOperation', checkAccessOperation);
//                 promissArray.push(checkAccessOperation);
//
//             } catch (e) {
//                 console.log(fname, 'ERROR accessType, accessTypeKey, - e', e);
//             }
//         }
//
//         return new Promise<any>(
//             async (resolve) => {
//                 try {
//                     let resultArray = await Promise.all(promissArray);
//                     console.log(fname, '  - resultArray' , resultArray);
//                     for ( let result of resultArray ) {
//                         console.log(fname, '  - result' , result);
//                         if (!result) {
//                             resolve(false);
//                             return;
//                         }
//                     }
//                     resolve(true);
//                 } catch (e) {
//                     console.log(fname, 'ERROR accessType, accessTypeKey, - e', e);
//                     resolve(false);
//                 }
//             }
//         );
//     }
//
//
//     // static async checkListForAccessToFreeformObject2 (iNoperation, iNfolder,iNobjModelId, iNobjInId, iNuser, iNmodelId, iNformId, InExistModel, iNclientData = null) { //+
//     //     const fname = 'checkListForAccessToFreeformObject';
//     //     LOG.fstep (
//     //         fname,
//     //         0,
//     //         0,
//     //         'iNmodelId, iNformId, InExistModel, iNclientData',
//     //         iNmodelId, iNformId, InExistModel, iNclientData
//     //     );
//     //     LOG.fstep (
//     //         fname,
//     //         0,
//     //         0,
//     //         'iNoperation, iNfolder, iNobjModelId, iNinId, iNuser',
//     //         iNoperation, iNfolder, iNobjModelId, iNobjInId, iNuser
//     //     );
//     //
//     //     if (!iNclientData && CONNECT.getUid() ) {
//     //         // add client data if not passed it && if this user is authed
//     //         iNclientData = { 'uid': CONNECT.getUid() }
//     //     }
//     //
//     //     let accessTypeArray = FreeformShared.Options.getAccessType(InExistModel),
//     //         promiseBaseArray    = [],
//     //         objInId         = iNobjInId,
//     //         objModelId      = iNobjModelId;//{}
//     //
//     //     let formActived = FreeformShared.Options.checkActiveTime(InExistModel),
//     //         formDeaded  = FreeformShared.Options.checkDeadTime(InExistModel),
//     //         formExpired = FreeformShared.Options.checkExpiredTime(InExistModel),
//     //         modelActive = FreeformShared.Options.getActive(InExistModel);
//     //
//     //     console.log(fname, 'formActived, formDeaded, formExpired, modelActive', formActived, formDeaded, formExpired, modelActive);
//     //     if (!formActived || !formDeaded || !formExpired || !modelActive) {
//     //         // form model not actived yet OR dead
//     //         return CONNECT.returnPromiseWithValue(null);
//     //     }
//     //
//     //     console.log(fname, 'accessTypeArray', accessTypeArray);
//     //     for (let accessTypeObjectKey in accessTypeArray ){
//     //
//     //         let accessTypeObject = accessTypeArray[accessTypeObjectKey];
//     //         promiseBaseArray[accessTypeObjectKey] = [];
//     //
//     //         // skip if this access rule is false
//     //         for ( let accessTypeKey of Object.keys(accessTypeObject) ) {
//     //
//     //             console.log('accessType, accessTypeKey, accessType[accessTypeKey]',
//     //                 accessTypeObject,
//     //                 accessTypeKey,
//     //                 accessTypeObject[accessTypeKey]
//     //             );
//     //
//     //             if ( !accessTypeObject[accessTypeKey] ) {continue;}
//     //             try {
//     //                 let checkAccessOperation = AccessListShared.checkAccessOperationToFreeformObject (
//     //                     iNoperation,
//     //                     iNfolder,
//     //                     objModelId,
//     //                     objInId,
//     //                     iNuser,
//     //                     iNmodelId,
//     //                     iNformId,
//     //                     InExistModel,
//     //                     iNclientData,
//     //                     accessTypeKey
//     //                 );
//     //                 console.log(fname, 'accessType, accessTypeKey, accessType[accessTypeKey] - checkAccessOperation', checkAccessOperation);
//     //                 promiseBaseArray[accessTypeObjectKey].push(checkAccessOperation);
//     //
//     //             } catch (e) {
//     //                 console.log(fname, 'ERROR accessType, accessTypeKey, - e', e);
//     //             }
//     //         }
//     //
//     //     }
//     //
//     //     return new Promise(
//     //         async (resolve) => {
//     //             try {
//     //                 // need for recognize last block iteration of array
//     //                 let counter = 0;
//     //                 //
//     //                 for ( let promissArray of promiseBaseArray) {
//     //                     counter++;
//     //                     let resultOfThisPromise = true, //default value true
//     //                         resultArray         = await Promise.all(promissArray);
//     //                     console.log(fname, '  - resultArray' , resultArray);
//     //                     for ( let result of resultArray ) {
//     //                         console.log(fname, '  - result' , result);
//     //                         if ( !result ) {
//     //                             //if this last block
//     //                             if ( counter === promiseBaseArray.length ) {
//     //                                 // if this block false and this is last block -> return null
//     //                                 resolve(false);
//     //                                 return;
//     //                             } else {
//     //                                 // if this block false but this is NOT last block -> skip this block
//     //                                 resultOfThisPromise = false;
//     //                                 break;
//     //                             }
//     //                         }
//     //                     }
//     //                     // if we have one block in object true -> stop iterate
//     //                     console.log(fname, '  - resultOfThisPromise' , resultOfThisPromise);
//     //                     if (resultOfThisPromise) {
//     //                         break;
//     //                     }
//     //                 }
//     //                 //
//     //
//     //                 resolve(true);
//     //             } catch (e) {
//     //                 console.log(fname, 'ERROR accessType, accessTypeKey, - e', e);
//     //                 resolve(false);
//     //             }
//     //         }
//     //     );
//     // }
//
//     private static async checkAccessOperationToFreeformObject (
//         iNoperation: any,
//         iNfolder: any,
//         iNobjModelId: any,
//         iNobjInId: any,
//         iNuser: any,
//         iNmodelId: any,
//         iNformId: any,
//         InExistModel: any,
//         iNclientData: any,
//         iNaccessType: any
//     )
//     {
//         let fname           = 'checkAccessOperationToFreeformObject' ,
//             user            = iNuser,
//             model           = InExistModel,
//             modelId         = iNmodelId,
//             clientData      = iNclientData,
//             formId          = iNformId,
//             folder          = iNfolder, // @enums (form, page, field, group, row, field)
//             operation       = iNoperation, // - @enums (create, read, write)
//             objModelId      = iNobjModelId, // - @enums (create, read, write)
//             objInId         = iNobjInId; // freeform object id -
//
//
//         let accessType      = iNaccessType,
//             usetAuthType    = (iNclientData['uid']) ? '@' : '?';
//
//         LOG.fstep( fname, 0, 1, "INVOKE -  ", accessType, usetAuthType, model, modelId  );
//
//         //@< check access to this model for this user
//         switch (accessType) {
//             case '*': // public access
//                 // if this form is public -> not has access list && not copy
//                 LOG.fstep(fname, 0, 2, "We has public access", accessType, usetAuthType);
//                 return CONNECT.returnPromiseWithValue(true);
//             // break;
//
//
//             case usetAuthType: // access is public -
//                 // if this form give access for user of my aythType
//                 // not has access list && not copy
//                 LOG.fstep(fname, 0, 2, "We has ? for not authed user access", accessType, usetAuthType);
//                 return CONNECT.returnPromiseWithValue(true);
//             // break;
//
//             case '@list':
//                 // if this model has access with personal list -> check access for me in list
//                 LOG.fstep(fname, 0, 2, "We has @list access type -> ", accessType, usetAuthType);
//                 // check access to this objec
//                 let listId = FreeformShared.Options.getAccessListId(model);
//                 if ( !listId ) {
//                     // we has not access list id ->
//                     LOG.fstep(fname,0, 3, "END ERROR - We has  not list id", listId);
//                     break;
//                 }
//
//                 // we has list id -> get access object
//                 LOG.fstep(fname, 0, 3, "We has listId -> get access object", listId);
//                 let accessObject;
//                 try {
//                     accessObject = await AccessListShared_.getAccessObjectFromFormForUser (user, modelId, formId, listId, clientData['uid']);
//                 }catch (e) {
//                     console.log('e test try catch', e);
//
//                 }
//
//                 if ( !accessObject  ) {
//                     LOG.fstep(fname,0, 4, "END ERROR - We has  not accessObject", listId);
//                     break;
//                 }
//
//                 // we has access object -> check access object
//                 LOG.fstep(fname, 0, 4, "We has accessObject -> check access for create", accessObject);
//
//                 let hasAccessForCreateObject;
//                 try {
//                     hasAccessForCreateObject = AccessListShared_.checkAccessForObject (folder, operation, accessObject, objModelId, objInId );
//                     console.log('TRY 404', hasAccessForCreateObject);
//                 } catch (e) {
//                     console.log('CATCH 404 ERROR - ', e , ' - ', hasAccessForCreateObject);
//                 }
//
//                 if (!hasAccessForCreateObject) {
//                     LOG.fstep(fname,0, 5, "END ERROR - We has  not get access in accessObject", listId);
//                     break;
//                 }
//                 // we has access for create
//                 LOG.fstep(fname, 0, 4, "END SUCCESS - We has access in access object - hasAccessForCreateObject", hasAccessForCreateObject);
//
//
//                 return CONNECT.returnPromiseWithValue(true);
//
//
//             case "@form":
//                 // if this model has access with personal list -> check access for me in list
//                 LOG.fstep(fname,0, 4, "We has @form <=>  -> ", accessType, usetAuthType );
//                 break;
//
//             case "@contact":
//                 // if this model has access for owner contacts -> check the owner have my contact  -> not has access list && not copy
//                 LOG.fstep(fname,0, 2, "We has @subscriber access type -> check this user is contact", accessType, usetAuthType  );
//                 break;
//
//             case "@uid":
//                 if (clientData['uid'] && usetAuthType === '@') {
//                     // if this model has access for owner contacts -> check the owner have my contact  -> not has access list && not copy
//                     LOG.fstep(fname,0, 2, "We has @uid access type -> check this user is contact", accessType, usetAuthType  );
//                     // if this model has access for owner subscriber -> check i am subscribe to this model owner
//                     let uidList = FreeformShared.Options.getAccessUidsList(model);
//                     LOG.fstep(fname,0, 2, "We has @uid access type -> check this user in uids list", accessType, usetAuthType, uidList  );
//                     if (uidList && uidList[ clientData['uid'] ]) {
//                         LOG.fstep(fname,0, 2, "We has @uid access type -> check this user in uids list", accessType, usetAuthType, uidList  );
//                         return CONNECT.returnPromiseWithValue(true);
//                     }
//                 }
//                 break;
//         }
//         return CONNECT.returnPromiseWithValue(null);
//         //@> check access to this model for this user
//     }
//
//     private static checkAccessForObject
//     (
//         iNfolder:any,
//         iNoperation:any,
//         iNaccessData:any,
//         iNobjModelId:any = null,
//         iNobjInId:any = null
//     )
//     { //-
//         //@private
//         const fname = 'checkAccessForObject';
//         LOG.fstep(fname, 0,0,'INVOKE - iNfolder, iNoperation, iNaccessData, iNobjModelId, iNid', iNfolder, iNoperation, iNaccessData, iNobjModelId, iNobjInId);
//         //@disc -
//         let accessData  = iNaccessData,
//             folder      = iNfolder,
//             operation   = iNoperation,
//             objModelId  = iNobjModelId,
//             objInId     = iNobjInId; //  || '*'
//
//         if (
//             folder === 'form'
//         ) {
//             let accessOperation = AccessListShared_.checkAccessForOperation (operation, accessData['form'] , null, null );
//             LOG.fstep(fname, 1,1,'Result access to form - accessOperation, folder, inid', accessOperation, folder, objModelId, objInId);
//             // if this form check only access
//             if (
//                 accessOperation ||
//                 // if we have not access data for this form in access object -> get access for all object
//                 ( accessOperation === null && AccessListShared_.checkAccessForOperation (operation, accessData['*'] ,null, null ) )
//             ) {
//                 LOG.fstep(fname, 2, 1,'END SUCCESS - we have access to form - operation, accessOperation, folder, objInId, inid', operation, accessOperation, folder, objInId);
//                 return true;
//             }
//         } else {
//             // get accessOperation for not form object
//             let accessOperation = AccessListShared_.checkAccessForOperation ( operation, accessData[folder] , objModelId, objInId );
//             LOG.fstep(fname, 1,2,'Result access to nonForm -  accessOperation, folder, objInId, inid', accessOperation, folder, objModelId, objInId);
//             if (
//                 accessOperation ||
//                 // if we have not access data for this nonForm object in access object -> get access for form object
//                 ( accessOperation === null && AccessListShared_.checkAccessForOperation (operation, accessData['form'] , null, null ) )
//             ) {
//                 LOG.fstep(fname, 2,2,'END SUCCESS - we have access to nonForm - operation, accessOperation, folder, objInId, inid', operation, accessOperation, folder, objModelId, objInId);
//                 return true;
//             }
//         }
//
//         LOG.ferror(fname, 3,0,'END ERROR we have not access - accessData, operation, folder, objInId, inid', accessData, operation, folder, objModelId, objInId);
//         return false;
//     }
//
//     public static checkAccessOperation (
//         iNobj,
//         iNoperation
//     )
//     {
//         if (
//             iNobj[iNoperation]
//
//         ) {
//             if (
//                 iNobj[iNoperation].active && // if active
//                 (!iNobj[iNoperation].expire || (iNobj[iNoperation].expire.getTime() > new Date().getTime()) ) // if not expired
//             ) {
//                 return true;
//             } else {
//                 return false
//             }
//         } else if ( // check access for all operation - we has not operation spec rules -> check
//             iNoperation !== '*'
//         ) {
//             return AccessListShared_.checkAccessOperation ( iNobj, '*' );
//         } else if ( typeof iNobj[iNoperation] !== 'object' ) {
//             return null;
//         }
//         return false;
//     }
//
//     private static checkAccessForOperation (
//         iNoperation: any,
//         iNaccessObject: any,
//         iNobjModelId: any = null,
//         iNobjInId: any = null
//     ) { //-
//         //@private
//         //@ disc - check access by object and operation name
//         const fname = 'checkAccessForOperation';
//
//         let objModelId  = iNobjModelId,
//             objInId     = iNobjInId,
//             objWithOperation;
//         LOG.fstep(fname, 1,0, 'INVOKE - iNoperation, iNaccessObject, objModelId, iNobjInId, objInId', iNoperation, iNaccessObject, objModelId, objInId);
//         if (
//             typeof iNaccessObject === 'object' // if it is object
//         ) {
//             if (
//                 !objModelId
//             ) {
//                 // if this is form (form) OR it's all access (*) -> we check access without pass model id and
//                 LOG.fstep(fname, 1, 1, 'This for form');
//                 objWithOperation = iNaccessObject;
//             } else if (
//                 !objInId || objInId === '@model'
//             ) {
//                 // if this is path to model (not object) ->
//                 LOG.fstep(fname, 1, 2, 'This for model');
//                 if (!(iNaccessObject[objModelId] && iNaccessObject[objModelId]['@model'])) {
//                     if ( objModelId !== '*' ) {
//                         let r =  AccessListShared_.checkAccessForOperation(iNoperation, iNaccessObject, '*', null);
//                         return r;
//                     }
//                 } else {
//                     // we have access rule for this obj model
//                     objWithOperation = iNaccessObject[objModelId]['@model'];
//                 }
//             } else {
//                 // if this is path freeform object (not FORM and Not ALL) ->
//                 LOG.fstep(fname, 1, 3, 'This for object');
//                 // objWithOperation = iNaccessObject[objModelId][objInId];
//
//                 if (!iNaccessObject[objModelId]) {
//                     // if we have not folder with model for this obj id ->
//                     LOG.fstep(fname, 2, 1, 'we have not folder with model for this obj id', iNaccessObject, objModelId, objInId);
//                     if (objModelId !== '*') {
//                         let r = AccessListShared_.checkAccessForOperation(iNoperation, iNaccessObject, '*', '*');
//                         LOG.fstep(fname, 3, 1, 'resultat', r);
//                         return r;
//                     }
//                 } else if (
//                     !iNaccessObject[objModelId][objInId]
//                 ) {
//                     // if we have not folder with this obj in model ->
//                     LOG.fstep(fname, 2, 2, 'we have not folder with this obj in model', iNaccessObject, objModelId, objInId);
//                     if (objInId !== '*') {
//                         let r = AccessListShared_.checkAccessForOperation(iNoperation, iNaccessObject, objModelId, '*');
//                         LOG.fstep(fname, 3, 2, 'resultat', r);
//                         return r;
//                     }
//                 } else {
//                     // we have rule for this object
//                     LOG.fstep(fname, 2, 3, 'we have rule for this object', iNaccessObject, objModelId, objInId);
//                     objWithOperation = iNaccessObject[objModelId][objInId];
//                 }
//             }
//         }
//         if (objWithOperation) {
//             LOG.fstep(fname, 4,1,'We have this operation rule', objWithOperation, iNoperation, iNoperation, iNaccessObject, objModelId, objInId);
//
//
//             let result =  AccessListShared_.checkAccessOperation(objWithOperation, iNoperation);
//             if (result) {
//                 // END SUCCESS -> we have access to this operation
//                 LOG.fstep(fname, 5,1,'END SUCCESS - We have access to this operation', result, iNoperation, iNaccessObject, objModelId, objInId);
//             } else {
//                 // END ERROR -> we have not access to this operation
//                 LOG.ferror(fname, 5,2,'END ERROR - we have not access to this operation', result, iNoperation, iNaccessObject, objModelId, objInId);
//             }
//             return result;
//         }
//
//
//         LOG.ferror(fname, 6,1,'END ERROR -> We have NOT this operation rule', iNoperation, iNaccessObject, objModelId, objInId);
//         // we have not this object
//         return null;
//
//
//
//         //     if (
//         //         iNaccessObject[objInId]
//         //     ) {
//         //         // if has this rule
//         //         if (
//         //             (
//         //                 iNaccessObject[objInId][iNoperation] &&
//         //                 iNaccessObject[objInId][iNoperation].active && // if active
//         //                 iNaccessObject[objInId][iNoperation].expire.getTime() > new Date().getTime() // if not expired
//         //             ) ||
//         //             ( // check access for all operation - we has not operation spec rules -> check
//         //                 iNoperation !== '*' &&
//         //                 iNaccessObject[objInId]['*'] &&
//         //                 iNaccessObject[objInId]['*'] &&
//         //                 iNaccessObject[objInId]['*'].active && // if active
//         //                 iNaccessObject[objInId]['*'].expire.getTime() > new Date().getTime() // if not expired
//         //             )
//         //         ) {
//         //             return true;
//         //         } else {
//         //             return false;
//         //         }
//         //     } else if (
//         //         objInId !== '*' &&
//         //         AccessListShared.checkAccessForOperation(iNoperation, iNaccessObject, '*')
//         //     ){
//         //         // we has access to all operation
//         //         return true;
//         //     } else {
//         //         return false;
//         //     }
//         // }
//         //
//         // // we has not access rule
//         // return null;
//
//     }
//
//
//     private static async  getAccessObjectFromFormForUser (
//         iNuserLogin: any,
//         iNmodelId: any,
//         iNformId: any,
//         iNlistId: any,
//         iNuid: any
//     ) { //-
//         //@private
//         /*
//           @inputs
//             @required
//               iNuserLogin : string
//               iNmodelId : string
//               iNmyUid : string
//
//               url
//               /freeform/{wideFormat24}/model/{model_id1}/accessList/{lw3Do9CFMdy4syMG6HmH}/users/{bac255e1-6a59-4181-bfb9-61139e38630e}
//         */
//         // passed data
//         let fname           = 'getAccessObjectFromFormForUser',
//             user            = iNuserLogin,
//             modelId         = iNmodelId,
//             listId          = iNlistId,
//             formId          = iNformId,
//             type            = (formId) ? 'form' : 'model', // - model, form
//             uid             = iNuid;
//
//         LOG.fstep (fname, 1, 0,'INVOKE - user, modelId, listId, uid', user, modelId, listId, uid );
//
//         //** LATER change users TO user here and in DB
//
//         var pathToFireStoreDb;
//         if (formId) {
//             // if we isset -> get access list from form object
//             pathToFireStoreDb   = `freeform/${user}/model/${modelId}/form/${formId}/accessList/${listId}/user/${uid}`;
//         } else {
//             // if we NOT isset -> get access list from form model
//             pathToFireStoreDb   = `freeform/${user}/model/${modelId}/accessList/${listId}/user/${uid}`;
//         }
//
//         const   firestoreRef        = firestore().doc(pathToFireStoreDb),
//             isInLocal           = GlobalStorage.AccessList.issetAccessListInGlobalStorageByUid (type, listId, uid );
//
//         LOG.fstep (fname, 1, 1,'it is from path - ', pathToFireStoreDb , isInLocal);
//         if ( !isInLocal ) {
//             LOG.fstep (fname, 2, 1,'We have not in local this access object -> get from db', isInLocal);
//
//             // if we have not in locall add to local
//             // if is l
//             return new Promise<any>(
//                 (resolve) => {
//                     firestoreRef.get().then(
//                         (doc) => {
//                             if (doc.exists) {
//                                 let model = doc.data();
//                                 LOG.fstep (fname, 3, 1,'access object for user in model is exist', model);
//                                 if (
//                                     model
//                                 ) {
//                                     // add to local
//                                     GlobalStorage.AccessList.saveAccessListForUserToGlobalByUid ( type, listId, uid, model );
//
//                                     LOG.fstep (fname, 3, 11,'END SUCCESS - return model', model);
//                                     // this form model need status -> return this model
//                                     resolve( model );
//                                     return;
//
//                                 }
//                             } else {
//                                 // add to local
//                                 GlobalStorage.AccessList.saveAccessListForUserToGlobalByUid ( type, listId, uid, null );
//                             }
//
//
//                             LOG.fstep (fname, 3, 2,'ERROR - access object for user in model is exist is not exist');
//                             resolve(null)
//                         }
//                     ).catch(
//                         (error) => {
//                             // add to local
//                             GlobalStorage.AccessList.saveAccessListForUserToGlobalByUid ( type, listId, uid, null );
//                             LOG.fstep (fname, 3, 3,'ERROR - access list object is not exist');
//                             resolve(null);
//                         }
//                     );
//                 }
//             );
//         } else {
//             //
//             LOG.fstep (fname, 2, 2,'We have in local this access object -> get from local', isInLocal);
//             return CONNECT.returnPromiseWithValue (
//                 GlobalStorage.AccessList.getAccessListFromGlobalByUid (type, listId, uid )
//             );
//         }
//     }
//
//
// //     static async getAccessObjectFromObjectForUser (iNuserLogin, iNmodelId, iNlistId, iNuid) {
// //         /*
// //           @inputs
// //             @required
// //               iNuserLogin : string
// //               iNmodelId : string
// //               iNmyUid : string
// //
// //               url
// //               /freeform/{wideFormat24}/model/{model_id1}/accessList/{lw3Do9CFMdy4syMG6HmH}/users/{bac255e1-6a59-4181-bfb9-61139e38630e}
// //         */
// //         // passed data
// //         let fname           = 'getAccessObjectFromObjectForUser',
// //             user            = iNuserLogin,
// //             modelId         = iNmodelId,
// //             listId          = iNlistId,
// //             uid             = iNuid;
// //
// //         LOG.fstep (fname, 1, 0,'INVOKE - user, modelId, listId, uid', user, modelId, listId, uid );
// //
// // //** LATER change users TO user here and in DB
// //         const   pathToFireStoreDb   = `/freeform/${user}/model/${modelId}/accessList/${listId}/users/${uid}`,
// //             firestoreRef        = firestore().doc(pathToFireStoreDb),
// //             isInLocal           = GlobalStorage.AccessList.issetAccessListInGlobalStorageByUid ('model', listId, uid );
// //
// //         LOG.fstep (fname, 1, 1,'it is from path - ', pathToFireStoreDb);
// //         if ( !isInLocal ) {
// //             LOG.fstep (fname, 1, 2,'We have not in local this access object -> get from db', isInLocal);
// //
// //             // if we have not in locall add to local
// //             // if is l
// //             return new Promise(
// //                 (resolve) => {
// //                     firestoreRef.get().then(
// //                         (doc) => {
// //                             if (doc.exists) {
// //                                 let model = doc.data();
// //                                 LOG.fstep (fname, 1, 3,'access object for user in model is exist', model);
// //                                 if (
// //                                     model
// //                                 ) {
// //                                     // add to local
// //                                     GlobalStorage.AccessList.saveAccessListForUserToGlobalByUid ( 'model', listId, uid, model );
// //
// //                                     LOG.fstep (fname, 1, 4,'END SUCCESS - return model', model);
// //                                     // this form model need status -> return this model
// //                                     resolve( model );
// //                                     return;
// //
// //                                 }
// //                             } else {
// //                                 // add to local
// //                                 GlobalStorage.AccessList.saveAccessListForUserToGlobalByUid ( 'model', listId, uid, null );
// //                             }
// //
// //
// //                             LOG.fstep (fname, 1, 4,'ERROR - access object for user in model is exist is not exist');
// //                             resolve(null)
// //                         }
// //                     ).catch(
// //                         (error) => {
// //                             // add to local
// //                             GlobalStorage.AccessList.saveAccessListForUserToGlobalByUid ( 'model', listId, uid, null );
// //                             LOG.fstep (fname, 1, 3,'ERROR - access list object is not exist');
// //                             resolve(null);
// //                         }
// //                     );
// //                 }
// //             );
// //         } else {
// //             //
// //             LOG.fstep (fname, 1, 2,'We have in local this access object -> get from local', isInLocal);
// //             return CONNECT.returnPromiseWithValue (
// //                 GlobalStorage.AccessList.getAccessListFromGlobalByUid ('model', listId, uid )
// //             );
// //         }
// //     }
//
//     public static async startCopyAccessListToFormObject (
//         iNuser,
//         iNformModelId,
//         iNformObjectId,
//         iNfirestoreBatch
//     )
//     { //-
//         //@private
//
//         let localAccessLists = GlobalStorage.AccessList.getAccessListsFromGlobal('form');
//         let promiseArray = [];
//         if (typeof localAccessLists === 'object'){
//             //
//             for (let accessListId of Object.keys(localAccessLists)) {
//                 let accessList = localAccessLists[accessListId];
//                 if (typeof accessList !== 'object') continue;
//                 for (let userId of Object.keys(accessList)){
//                     let userAccessListObject = accessList[userId];
//                     if (typeof userAccessListObject !== 'object') continue;
//                     let writeOperation = AccessListShared_.createFormObjectAccessLists(iNuser, iNformModelId, iNformObjectId, accessListId, userId, userAccessListObject, iNfirestoreBatch);
//
//                     GlobalStorage.ConnectedUser.addConnectedUserWithFormToGlobalStorage (userId);
//
//                     promiseArray.push(writeOperation);
//                 }
//             }
//         }
//
//         return Promise.all(promiseArray);
//     }
//
//     private static async createFormObjectAccessLists (
//         iNuser,
//         iNformModelId,
//         iNformObjectId,
//         iNaccessListId,
//         iNuserId,
//         iNdata,
//         iNfirestoreBatchGroup
//     ) { //-
//         //@private
//
//         /*
//           @discr
//           @inputs
//             @required
//             @optinal
//               iNbatch
//         */
//
//         var fname       = 'createFormObjectAccessLists',
//             pathToDoc   = `${iNuser}/model/${iNformModelId}/form/${iNformObjectId}/accessList/${iNaccessListId}/user/${iNuserId}`;
//         // `${iNuser}/model/${iNformModelId}/field/${iNfieldModelId}`;
//
//
//         LOG.fstep (fname,1,0,'INVOKE - iNuser, iNformModelId, iNformObjectId',
//             iNuser, iNformModelId, iNformObjectId);
//
//
//         // add to db
//         return FIREBASE.batchGroupCreate(
//             `freeform/${pathToDoc}`,
//             iNdata,
//             iNfirestoreBatchGroup
//         );
//
//         // FIREBASE.safeCreateFirestoreDb(
//         //     'freeform',
//         //     pathToDoc,
//         //     iNdata,
//         //     iNdb,
//         //     iNfirestoreBatchGroup
//         // );
//     }
//
//
//     public static async preloadAccessObjectsFromFormForUserByList (
//         iNuserLogin,
//         iNmodelId,
//         iNformId,
//         iNpreloadList,
//         iNuid
//     ) { //+ (2)
//         //@public
//         if(
//             !(
//                 typeof iNpreloadList === 'object' &&
//                 Array.isArray(iNpreloadList)
//             )
//         ) return CONNECT.returnPromiseWithValue(null);
//
//         let preloadAccessLists = iNpreloadList,
//             promiseArray = [];
//         for (let accessListId of preloadAccessLists ) {
//             promiseArray.push (
//                 AccessListShared_.getAccessObjectFromFormForUser (iNuserLogin, iNmodelId, iNformId, accessListId, iNuid)
//             );
//         }
//
//         return Promise.all(promiseArray);
//     }
//
//     //@< CLEAR FORM
//     static async  clearFormModelFromNotAccessSubModels (iNformUser, iNmodelId, iNformId, iNclientData, iNform, iNoperation, iNfolder = null) { //+
//         // public
//         let fname   = 'clearFormModelFromNotAccessSubModels',
//             form    = iNform,
//             folder  = iNfolder;
//
//         if (typeof iNform !== 'object') return false;
//
//         let folderArray =  (typeof iNfolder === 'object' && Array.isArray(folder)) ? folder :  ['pages','groups', 'rows', 'fields'];
//
//         if (folderArray.length === 0 ) {
//             return false;
//         }
//
//         //generate counter
//         let folderCounter = {};
//         for (let folderName of folderArray ) {
//             // we have not this folder
//             if (typeof form[folderName] !== 'object') return false;
//
//             if (typeof folderCounter[folderName] !== 'number') folderCounter[folderName] = 0;
//         }
//
//         // filtering
//         for (let folderName of Object.keys(folderCounter)) {
//             let folder = form[folderName],
//                 objectType = FreeformShared.getObjTypeByFolderName(folderName),
//                 result = folderCounter[folderName] = await AccessListShared_.clearFolderFromNotAccessSubModels (iNformUser, iNmodelId, iNformId, iNclientData,folder, iNoperation, objectType);
//             // if have not elemets in group -> return false or we have not
//             if(!result || !objectType) return false;
//         }
//
//         return true;
//     }
//
//     static async  clearFolderFromNotAccessSubModels (iNformUser, iNmodelId, iNformId, iNclientData,  iNfolderObject, iNoperation, iNobjectType) { //-
//         //@private
//         let fname       = 'clearFolderFromNotAccessSubModels',
//             folderObj   = iNfolderObject,
//             counter     = 0;
//         if (typeof folderObj !== 'object') return counter;
//
//         for (let modelId of Object.keys(folderObj)) {
//             let model   = folderObj[modelId],
//                 access  = await AccessListShared_.checkListForAccessToFreeformObject (
//                     iNoperation,
//                     iNobjectType,
//                     null,
//                     null,
//                     iNformUser,
//                     iNmodelId,
//                     iNformId,
//                     model,
//                     iNclientData
//                 );
//
//             if (!access) {
//                 // delete we have not access to this object
//                 delete folderObj[modelId];
//             } else {
//                 // we have access -< increase counter
//                 counter++;
//             }
//         }
//
//         return counter;
//     }
//
//     static getObjTypeByFolderName (iNfolderName) {
//         let obj = {
//             'fields'    : 'field',
//             'rows'      : 'row',
//             'groups'    : 'group',
//             'pages'     : 'page',
//         };
//         return obj[iNfolderName]||null;
//     }
//     //@> CLEAR FORM
// }
// module.exports.AccessListShared = AccessListShared_;
