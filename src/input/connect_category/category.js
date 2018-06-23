// var DINAMO  	= require("./../aws/dinamo");
// var CONNECT 	= require('../connect');
const LOG     = require('ramman-z-log');

//@init
const RammanLibraryVersion = 0.1;
const RammanLibraryName    = 'Category';
const RammanLibraryPath    = 'input/connect_category/category.js';
LOG.print('*init = @library - ', RammanLibraryName, ' && @version - ', RammanLibraryVersion, '&& @path - ', RammanLibraryPath);

const FIREBASE  			= require("./../firebase/firebase");
      const firestore = FIREBASE.firestore;


// var tableCategory = "connect-category";


function addbyChildId (iNobj,iNout) {
	for ( var i in iNobj ) {
  		var thisObj = iNobj[i].data();
  		var thisObjId = iNobj[i].id;

    	if ( typeof thisObj['parents'] == 'object' && typeof thisObj['parents']['main'] != 'undefined' ) {
      		iNout ['byChildId' ][ thisObjId ] = thisObj['parents']['main'];

        if ( typeof iNout ['byParentId'][ thisObj['parents']['main'] ] != 'object' )
      		iNout ['byParentId'][ thisObj['parents']['main'] ] 	= [ thisObjId ];
        else
        	iNout ['byParentId' ][ thisObj['parents']['main'] ].push ( thisObjId );

      }
      LOG.printObject('addbyChildId thisObj',thisObj);
      LOG.printObject("addbyChildId iNout['categories']",iNout['categories']);
      LOG.printObject("addbyChildId thisObjId", thisObjId );
      iNout['categories'][ thisObjId ] = {
      	'id'   : thisObjId,
        'name': thisObj['names']['*'],
        'code': thisObj['code'],
        'data': thisObj['data'],
        'app' :thisObj['app'],
        'page': thisObj['page']
      }
  }
}

function startAdd (iNout) {
    for ( var i in iNout['categories']) {
        var thisObj = iNout['categories'][i];
				rightAddChildren(thisObj,iNout);

    }
}
function packCatsToApp (iNout) {
  var newCat = {};
  for ( var i in iNout['categories']) {
      var thisCat = iNout['categories'][i];
      var thisApp = thisCat['app'];
      var thisId  = i;
      if ( typeof newCat[thisApp] != 'object') newCat[thisApp] = {};
      newCat[thisApp][thisId] = thisCat
  }
  iNout['categories'] = newCat;
}
function rightAddChildren (iNobj,iNout) {
	var thisObj = iNobj;
	var thisId = iNobj['id'];

 	if( typeof (iNout['byParentId'][ thisId ]) == 'object' ) {
  	// add my children first to me
    for ( var i in iNout['byParentId'][ thisId ] ) {

    	var childObjectId = iNout['byParentId'][ thisId ][i];
      if ( typeof iNout['categories'][ childObjectId ] == 'object' ) {
    	   var childObject 	= iNout['categories'][ childObjectId ];
         LOG.printObject('rightAddChildren childObject + ');
        rightAddChildren(childObject,iNout);
      } else {
        LOG.printObject('rightAddChildren childObject - typeof',typeof iNout['categories'][ childObjectId ]);

      }
    }
  }

  if( typeof (iNout['byChildId'][ thisId ]) != 'undefined' ) {
  	// i am children
    var parentId = iNout['byChildId'][ thisId ];
    if ( typeof iNout['categories'][parentId]['children'] != 'object')
    	iNout['categories'][parentId]['children'] = [];
    iNout['categories'][parentId]['children'].push(thisObj);
    delete iNout['categories'][ thisId ];
  }


}
function getStructuredCategory (iNuid,iNdata,iNfunction) {
  /*
    @discr
      get sctrucured category for api
    @example
    @inputs
      @required
        iNuid       -> function
        iNdata      -> array
        iNfunction  -> function
    @deps
      function: getCategory
      function: startAdd
      function: addbyChildId
    @return
  */
  LOG.printObject('getStructuredCategory - $iNuid, $iNdata',iNuid,iNdata);

  getCategory ( iNuid,iNdata,
    function (err,data) {
      LOG.printObject('getStructuredCategory err, data',err,data);
      if ( !err && data.length > 0 ){
        LOG.printObject('getStructuredCategory $data.length',data.length);
        var links = {'byParentId':{}, 'byChildId':{}, 'categories' : {} };
        LOG.printObject('getStructuredCategory before addbyChildId - $links',links);
        addbyChildId(data,links);
        LOG.printObject('getStructuredCategory before startAdd  $links',links);
        startAdd(links);
        LOG.printObject('getStructuredCategory before packCatsToApp  $links',links);
        packCatsToApp(links);
        LOG.printObject('getStructuredCategory before func  $links',links);
        iNfunction(links);
      } else {
        iNfunction(false);
      }
    }
  );
}
module.exports.getStructuredCategory = getStructuredCategory;

function getCategory (iNuid,iNdata,iNfunction) {
  /*
    @inputs
      @required
        iNuid
        iNdata
          @required
            to
            type
            uid
            by
          @optinal
            for
            from
            status
            id
      @optioanal
        iNfunction
    @algoritm
      0 - check/prepare data
      1 - update in dynamo
  */
  const functionAddress = '@file category.js | @connect/getCategory ';
  LOG.printObject(functionAddress,'start');
  if (
    typeof(iNuid) != 'string' ||
    typeof(iNdata) != 'object'
  ) return false;

	var isDoc = false,
			objecrForQuery = {},
			index = '';


  let pathToFireStoreDb = 'users/' + iNuid + '/menus';
  LOG.printObject(functionAddress,'$pathToFireStoreDb',pathToFireStoreDb);
  var firestoreRef = firestore().collection(pathToFireStoreDb);
	if(typeof(iNdata['by']) != 'string')iNdata['by']='standart';

  // var
  //     objecrForQuery = DINAMO.addByMask( {'uid':iNuid},"uid", { "table" : tableCategory } ),
  //     index          = '';
  //     if(typeof(iNdata['by']) != 'string')iNdata['by']='standart';

  if ( typeof(iNdata['by']) == 'string' ) {
    switch (iNdata['by']) {
      case "type":
        if( typeof(iNdata['type']) != 'string') break;
        firestoreRef = firestoreRef.where( 'type', '==', iNdata['type'] );
      break;

      case "for":
        if( typeof(iNdata['for']) != 'string') break;
        firestoreRef = firestoreRef.where( 'for', '==', iNdata['for'] );
      break;

      case "to":
        if( typeof(iNdata['to']) != 'string') break;
        firestoreRef = firestoreRef.where( 'to', '==', iNdata['to'] );
      break;

      default:
        if( typeof(iNdata['id']) != 'string') break;
        firestoreRef = firestoreRef.doc(iNdata['id']);
        isDoc = true;

        // objecrForQuery = DINAMO.addByMask(iNdata,"id",objecrForQuery);
      break;
    }

  }


  if ( typeof(iNdata['type'])=='string' && iNdata['by'] != 'type')
			firestoreRef = firestoreRef.where( 'type', '==', iNdata['type'] );

  if ( typeof(iNdata['status'])=='number' && iNdata['by'] != 'status')
			firestoreRef = firestoreRef.where( 'status', '==', iNdata['status'] );

  if ( typeof(iNdata['to'])=='string'  && iNdata['by'] != 'to')
			firestoreRef = firestoreRef.where( 'to', '==', iNdata['to'] );

  // DINAMO.query(objecrForQuery,iNfunction);

	firestoreRef.get().then(
    (doc) => {
      LOG.printObject(functionAddress,'$doc',doc);
      LOG.printObject(functionAddress,'$isDoc',isDoc);
      if(isDoc) { // if a document
        if (doc.exists) {
            //SUCCESS
            LOG.printObject(functionAddress,  "Document data $doc.data()", doc.data());
            iNfunction(null,[doc]);
        } else {
            LOG.printObject(functionAddress,  "No such document!");
            iNfunction("No such document!",null);
        }
      } else { // if collection
        if ( !doc.empty ) {
            //SUCCESS
            LOG.printObject(functionAddress, "Collection data $doc.docs", doc.docs);
            iNfunction(null,doc.docs);
        } else {
            LOG.printObject(functionAddress,  "No data in  collection!");
            iNfunction("No data in  collection!",null);

        }
      }
  }).catch (
    (error) => {
      LOG.printObject(functionAddress, "Document error", error);
      iNfunction(error,null);
    }
  );
}
module.exports.getCategory = getCategory;
