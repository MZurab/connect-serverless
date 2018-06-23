// const CONNECT   = require('../../../connect');
class AccessList {
    constructor () {}
    static prepareGlobalObjectForAccessList (iNtype) { //-
        if (!global['freeform']) global['freeform'] = {};
        if (!global['freeform']['accessLists']) global['freeform']['accessLists'] = {};
        if (!global['freeform']['accessLists'][iNtype] ) global['freeform']['accessLists'][iNtype] = {};
    }


    static saveAccessListToGlobal (iNtype, iNlistId, iNdata) { //+

        AccessList.prepareGlobalObjectForAccessList (iNtype);

        global['freeform']['accessLists'][iNtype][iNlistId] = iNdata;
    }

    static getAccessListsFromGlobal (iNtype) { //+

        AccessList.prepareGlobalObjectForAccessList (iNtype);

        return global['freeform']['accessLists'][iNtype];
    }

    static saveAccessListForUserToGlobalByUid (iNtype, iNlistId, iNuid, iNdata ) { //+

        AccessList.prepareGlobalObjectForAccessList (iNtype);

        if (
            !global['freeform']['accessLists'][iNtype][iNlistId]
        )
            global['freeform']['accessLists'][iNtype][iNlistId] = {};

        global['freeform']['accessLists'][iNtype][iNlistId][iNuid] = iNdata;
    }
    static getAccessListFromGlobalByUid (iNtype, iNlistId, iNuid ) { //+

        AccessList.prepareGlobalObjectForAccessList (iNtype);

        if (  global['freeform']['accessLists'][iNtype][iNlistId]  ) {
            if (  global['freeform']['accessLists'][iNtype][iNlistId][iNuid]  ) {
                return global['freeform']['accessLists'][iNtype][iNlistId][iNuid];
            }
        }

        return null;
    }
    static issetAccessListInGlobalStorageByUid (iNtype, iNlistId, iNuid ) { //+

        AccessList.prepareGlobalObjectForAccessList (iNtype);

        if (  global['freeform']['accessLists'][iNtype][iNlistId]  ) {
            if (  typeof global['freeform']['accessLists'][iNtype][iNlistId][iNuid] !== 'undefined'  ) {
                return true;
            }
        }

        return false;
    }

}
module.exports.AccessList = AccessList;