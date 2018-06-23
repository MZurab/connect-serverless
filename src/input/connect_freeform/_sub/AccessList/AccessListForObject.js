const CONNECT   = require('../../../connect');
const LOG     = require('ramman-z-log');
const FIREBASE  = require("../../../firebase/firebase");
const firestore = FIREBASE.firestore;


const GlobalStorage     = require('../GlobalStorage/GlobalStorage').GlobalStorage;// FreeformGlobalStorage
const AccessListShared      = require('./AccessListShared').AccessListShared;

class AccessListForObject {// FreeformAccessListForObject

    static async getAccessListsForFormObjectByList (iNuserLogin, iNmodelId, iNarrayList) { //+
        /*
          @inputs
            @required
              iNuserLogin
              iNmodelId
        */
        // passed data
        const   fname       = 'getAccessListsForFormObjectByList',
            user            = iNuserLogin,
            model           = iNmodelId,
            list            = iNarrayList;

        let     counter         = 0,
            result          = {};


        LOG.fstep (fname, 1, 0,'INVOKE - user, model, data', user, model);
        if(
            !(
                typeof list === 'object' &&
                Array.isArray(list) &&
                list.length > 0
            )
        ) {
            LOG.fstep (fname, 1, 1,'ERROR - we has not list array', user, model, list);
            return CONNECT.returnPromiseWithValue(null);
        }

        for (let accessListId of list) {
            let accessListUser = await AccessListForObject.getUsersOfAccessListForFormObject(user, model, accessListId);
            if (!accessListUser) {
                // we have NOT this access list -> return null
                LOG.fstep (fname, 1, 2,'ERROR - we has not access list', user, model, list, accessListUser);
                return CONNECT.returnPromiseWithValue(null);
            }
            // add to result array
            result[ accessListId ] = accessListUser;
            // save to global for later access
            GlobalStorage.AccessList.saveAccessListToGlobal ('form', accessListId, accessListUser);

            counter++;
        }

        if (counter > 0) {
            LOG.fstep (fname, 1, 3,'END SUCCESS - return access list users array', result);
            return CONNECT.returnPromiseWithValue(result);
        } else {
            // we has
            LOG.fstep (fname, 1, 3,'ERROR - we has not access list array', result);
            return CONNECT.returnPromiseWithValue(null);
        }
    }

    static async getUsersOfAccessListForFormObject (iNuserLogin, iNmodelId, iNlistId) {
        /*
          @inputs
            @required
              iNuserLogin : string
              iNmodelId : string
              iNmyUid : string

              url
              /freeform/{wideFormat24}/model/{model_id1}/accessList/{lw3Do9CFMdy4syMG6HmH}/users/{bac255e1-6a59-4181-bfb9-61139e38630e}
        */
        // passed data
        let fname           = 'getUsersOfAccessListForFormObject',
            user            = iNuserLogin,
            model           = iNmodelId,
            listId          = iNlistId;

        LOG.fstep (fname, 1, 0,'INVOKE - user, model, data', user, model);


        const   pathToFireStoreDb   = `/freeform/${iNuserLogin}/model/${model}/accessListForObject/${listId}/user`,
            firestoreRef        = firestore().collection(pathToFireStoreDb);

        LOG.fstep (fname, 1, 1,'will get access list object from path - ', pathToFireStoreDb);
        return new Promise(
            (resolve) => {
                firestoreRef.get().then(
                    (docs) => {
                        if ( !docs.empty ) {
                            LOG.fstep (fname, 1, 2,'access list object users is  exist');

                            let resultDocs = {};

                            for (let doc of docs.docs) {
                                resultDocs[doc.id] = doc.data();
                            }

                            resolve(resultDocs);
                            return;
                        }

                        LOG.fstep (fname, 1, 3,'ERROR - access list object users is not exist');
                        resolve(null);
                    }
                ).catch(
                    (error) => {
                        LOG.fstep (fname, 1, 4,'ERROR - access list object is not exist');
                        resolve(null)
                    }
                );
            }
        );
    }

    static async clearFromNotAccessModels (iNformUser, iNmodelId, iNformId, iNclientData, iNform, iNfolder = null) { //+
        //@public
        return await AccessListShared.clearFormModelFromNotAccessSubModels (iNformUser, iNmodelId, iNformId, iNclientData, iNform, 'read', iNfolder = null);
    }

}
module.exports.AccessListForObject = AccessListForObject;