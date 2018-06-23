// const CONNECT   = require('./../connect');
const LOG       = require('ramman-z-log');
const FIREBASE  = require("./../firebase/firebase");
// const firestore = FIREBASE.firestore;


export class ConnectTable {
    static async addData (iNsid, iNtableId, iNdocId, iNdata, iNfirestoreBatchGroup) {
        /*
          @discr
          @inputs
            @required
            @optinal
              iNdb
              iNbatch
        */
        let fname       = 'addToFormObjectToDb',
            sid           = iNsid,//'wideFormat24',
            tableId       = 'firstTable',
            docId         = iNdocId,
            result        = {'err': false},
            pathToDoc     = `users/${sid}/tables/${docId}`; // `/users/${sid}/tables/${tableId}/data/${docId}`  /tables/${sid}/table/${tableId}/data/${docId}


        LOG.fstep ( fname, 1, 0,'INVOKE - iNsid, iNtableId, iNdocId, iNdata',
            Nsid, iNtableId, iNdocId, iNdata );


        // add to db
        return FIREBASE.batchGroupCreate(
            pathToDoc,
            iNdata,
            iNfirestoreBatchGroup
        );
    }
}