/*
  @depends
    @libraries
      AMAZON AWS - require("aws-sdk");
    @vars input
      var docClient = new AWS.DynamoDB.DocumentClient();
*/
const AMAZON  = require("./aws");
const AWS     = AMAZON.data;
const LOG     = require('ramman-z-log');

// const a  = new AWS.DynamoDB.DocumentClient({
//     region: "eu-west-1",
//     endpoint: "https://dynamodb.eu-west-1.amazonaws.com"
// }
// );
//
// a

var docClient = new AWS.DynamoDB.DocumentClient({
    region: "eu-west-1",
    endpoint: "https://dynamodb.eu-west-1.amazonaws.com"
});


// AWS.DynamoDB.DocumentClient({})
//<<<@ WORK WITH DINAMO
    function DinamoDbAdd(table,iNdata,iNfunction){
        var params = {
            TableName:table,
            Item:iNdata
        };
        docClient.put(params, function(err, data) {
            if( typeof(iNfunction) == 'function') iNfunction(err, iNdata);
        });
    }
    module.exports.add = DinamoDbAdd;
    //Dinamo DB delete
    function DinamoDbDel (iNobject,iNfunction) {
        /*
         1 - iNobject
         @required
           table       String
           key         Object
         @optional
           vals        String (":val": 5.0)
           mask        String ("info.rating <= :val")
           keys

         */
        var params = {
            TableName : iNobject.table,
            Key: iNobject.key,
        };
        if( typeof(iNobject.vals) != 'undefined' && iNobject.vals !== false)
            params.ExpressionAttributeValues = iNobject.vals;
        if( typeof(iNobject.mask) != 'undefined' && iNobject.cond !== false)
            params.ConditionExpression = iNobject.cond;
        if( typeof(iNobject.keys) != 'undefined' && iNobject.keys !== false)
            params.ExpressionAttributeNames = iNobject.keys; // "#yr": "year"
        // if( typeof(iNobject.mask) != 'undefined' && iNobject.mask !== false)
        //     params.KeyConditionExpression = iNobject.mask; //"#yr = :yyyy",


        docClient.delete(params, function(err, data) {
            if (err) {
                console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
            } else {
                LOG.printObject("Deleted Item succeeded:", JSON.stringify(data, null, 2));
            }
            if(typeof(iNfunction) == 'function')iNfunction(err,data);
        });
    }
    module.exports.del = DinamoDbDel;
    //Dinamo DB update
    function DinamoDbUpdate (iNobject,iNfunction) {
        /*
         @inputs
           @required
             1 - iNobject -> object
               @required
                 table
                 key
                 set
                 vals
                 keys
             2 - iNfunction -> function
         */
        LOG.printObject('DinamoDbUpdate iNobject');
        LOG.printObject(iNobject);
        var params = {
            TableName : iNobject.table,
            ReturnValues:"UPDATED_NEW"
        };
        if( typeof(iNobject.keys) != 'undefined' && iNobject.keys !== false)
            params.ExpressionAttributeNames = iNobject.keys; // "#yr": "year"


        if( typeof(iNobject.key) != 'undefined' && iNobject.key !== false)
            params.Key = iNobject.key; //{ "year": year, "title": title }

        if( typeof(iNobject.set) != 'undefined' && iNobject.set !== false)
            params.UpdateExpression = iNobject.set; // "set info.rating = :r, info.plot=:p, info.actors=:a"

        if( typeof(iNobject.vals) != 'undefined' && iNobject.vals !== false)
            params.ExpressionAttributeValues = iNobject.vals; // ":yyyy":1985
        docClient.update(params, function(err, data) {
            if (err) {
                console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
            } else {
                LOG.printObject("UpdateItem succeeded:", JSON.stringify(data, null, 2));
            }
            if( typeof(iNfunction) == 'function' ) iNfunction(err,data);
        });
    }
    module.exports.update = DinamoDbUpdate;



      function addDataWithCreatePathToObject (iNobj,iNpath,iNdata) {
      	/*
        	@discr
          	add iNdata to InObj by InPath (id1.id2)
        	@example
          	checkTypeOfByVal(iNobject,'id1.id2','HAHA')
            	return
              	iNobject => object <= { 'id1': { 'id2' : 'HAHA' } }
        	@inputs
          	@required
            	1 - iNobj	 -> object,string,number
              2 - iNpath -> string
              	@example
                	keys.id1.id2
              3 - iNresult -> object
        */
        if(typeof(iNobj) != 'object')iNobj = {};
        var iNpathArray = iNpath.split('.');
        var pathArraySize = iNpathArray.length;
        var thisPathForEval = '', thisTextForEval = '', iEvalText;
        for (var iKey = 0; iKey < pathArraySize;iKey++){
        	thisPathForEval += "['" + iNpathArray[iKey] + "']"
        	if( (iKey+1) == pathArraySize){
          	// if last elem
            iEvalText = "iNobj" + thisPathForEval + " = iNdata;"
            eval(iEvalText);
          }else {
          	thisTextForEval = "iNobj"+thisPathForEval;
            	if(typeof(eval(thisTextForEval)) != 'object') {
              	iEvalText = thisTextForEval + "= {};"
                eval(iEvalText);
              }
          }
        }
        return iNobj;
      }
      module.exports.addDataWithCreatePathToObject = addDataWithCreatePathToObject;

      function jsonObjectToUpdate (iNobj,iNresult,iNupdateType,iNpassData,invokeFunctionCounter) {
        var result = _jsonObjectToUpdate (iNobj,iNresult,iNupdateType,iNpassData,invokeFunctionCounter);
        result['set'] = result['set'].replace(/^[, \n\r\t]+/,'').replace(/[, \n\r\t]+$/,'');
        return result;
      }
      function _jsonObjectToUpdate (iNobj,iNresult,iNupdateType,iNpassData,invokeFunctionCounter) {
         /*
          	@dicr
            	conver json array for update for dinamo db
          	@example
            	_jsonObjectToUpdate({'varKey':'varName'},iNresult => {})
              	return
                	iNresult => object <= _jsonObjectToUpdate()
                  {
                  	'set' : 'set #varKey = :varKey',
                  	'keys': {
                    	'#varKey':'varKey'
                    },
                    'vals': {
                    	':varKey':'varName'
                    }
                  }
          	@inputs
            	@required
              	1 - iNobj	 -> object
                2 - iNresult -> object
                	@example
              @optinal
                3 - iNupdateType -> string (full OR keys)
                [use self funciton]
                	4 - iNpassData
                  	path
                    keypath

          */
          if(
          	typeof(iNobj) 		!= 'object' ||
          	typeof(iNresult) 	!= 'object'
          )	return false;
          if(typeof(iNresult['keys']) != 'object')iNresult['keys']={};
          if(typeof(iNresult['set']) 	!= 'string')iNresult['set']='';
          if(typeof(iNresult['vals']) != 'object')iNresult['vals']={};
          if(typeof(iNupdateType) != 'string') iNupdateType = 'full';
          if(typeof(invokeFunctionCounter) != 'number') {
          	invokeFunctionCounter=1;
            if(iNresult['set'] == '')iNresult['set']='set';
          } else
            invokeFunctionCounter++;

          var thisObj,thisPath,thisKeyPath;
          if( typeof(iNpassData) == 'object' && typeof(iNpassData['path']) == 'string' && typeof(iNpassData['keypath']) == 'string') {
          	thisObj 		= getDataWithPathFromObject(iNobj,iNpassData['path']);
          	thisPath 		= iNpassData['path']+'.';
          	thisKeyPath = iNpassData['keypath']+'.';
          } else {
          	iNpassData	= {};
          	thisPath 		= '', thisKeyPath = '';
          	thisObj 		= iNobj;
          }
          var counter = 1;
           if(typeof(thisObj) == 'object') {
           		for(var iKey in thisObj) {
              	var chiefKeyName 	= thisPath+iKey;
                var varName 			= chiefKeyName.replace(/[.]+/g,'_');
                var keyForDb 			= "#"+varName;
           			if(typeof(thisObj[iKey]) != 'object' || iNupdateType == 'keys') {
                  //.replace(/([^a-zA-z.]+)/g,'')
                  var keyForSetDb = thisKeyPath+ "#"+varName;
                	var valForDb 		= ":"+varName;
                	// add to set
                    iNresult['set'] += " " + keyForSetDb + " = " + valForDb + ",";


                  // add to keys
                  	iNresult['keys'][keyForDb] = iKey;
                  // add to vals
                  	iNresult['vals'][valForDb] = thisObj[iKey];
                } else {
                  if(Object.keys(thisObj).length > 0) {
                  	iNresult['keys'][keyForDb] 	= iKey;
                    iNpassData['keypath'] 			= thisKeyPath + keyForDb;
                    iNpassData['path'] 					= thisPath+iKey;
                    iNresult = _jsonObjectToUpdate (iNobj,iNresult,iNupdateType,iNpassData,invokeFunctionCounter);
                  }
                }
                counter++;
           		}
           }

           return iNresult;
      }
      module.exports.jsonObjectToUpdate = jsonObjectToUpdate;

      function getDataWithPathFromObject (iNobj,iNpath) {
      	/*
        	@dicr
          	return data from iNobj by iNpath (id1.id2)
        	@example
          	getDataWithPathFromObject({'keys':thisVal,'keys')
            	return
              	thisVal => var <= iNobj.keys
        	@inputs
          	@required
            	1 - iNobj	 -> object
              2 - iNpath -> string
              	@example
                	keys.id1.id2
        */
        if(typeof(iNobj) != 'object' || typeof(iNpath) != 'string')return false;
        var iNpathArray = iNpath.split('.');
        var pathArraySize = iNpathArray.length;
        var thisPathForEval = "iNobj", result = false;
        for (var iKey = 0; iKey < pathArraySize;iKey++){
        	thisPathForEval += "['" + iNpathArray[iKey] + "']";
          if( (iKey+1) == pathArraySize){
          	// if last elem -> return result if its isset
            result = eval(thisPathForEval);
            if(typeof(result) == 'undefined') return false;
          }else {
          	// if !last elem -> check for object for next step
          	result = eval(thisPathForEval);
            if(typeof(result) != 'object')return false;

          }
        }
        return result;
      }

    //Dinamo DB query
    function DinamoDbQuery (iNobject,onQuery) {
        var params = {
            TableName : iNobject.table
        };
        if( typeof(iNobject.limit) != 'undefined' )
            params.Limit = iNobject.limit;

        //params.ConsistentRead = false;
        if( typeof(iNobject.last) != 'undefined' )
            params.ExclusiveStartKey = iNobject.last;

        if( typeof(iNobject.index) != 'undefined' )
            params.IndexName = iNobject.index;

        if( typeof(iNobject.order) != 'undefined' ) {
           if(iNobject.order == 'desc'){
              params.ScanIndexForward = false;
           } else {
              params.ScanIndexForward = true;
           }
        }
        if( typeof(iNobject.maskFilter) != 'undefined' && iNobject.maskFilter !== false)
            params.FilterExpression = iNobject.maskFilter; //"#yr = :yyyy",

        if( typeof(iNobject.select) != 'undefined' && iNobject.select !== false)
            params.ProjectionExpression = iNobject.select; // "#yr, title, info.genres, info.actors[0]",

        if( typeof(iNobject.mask) != 'undefined' && iNobject.mask !== false)
            params.KeyConditionExpression = iNobject.mask; //"#yr = :yyyy",

        if( typeof(iNobject.keys) != 'undefined' && iNobject.keys !== false)
            params.ExpressionAttributeNames = iNobject.keys; // "#yr": "year"

        if( typeof(iNobject.vals) != 'undefined' && iNobject.vals !== false)
            params.ExpressionAttributeValues = iNobject.vals; // ":yyyy":1985
        var dataResult = {'Count':0,"Items":[],"Counter":0,"ScannedCount":0};
        function inF (err,data) {
          LOG.printObject('DinamoDbQuery err',err);
          if(err) {
            onQuery(err,false);
            return null;
          }
          dataResult["Counter"]++;
          if(data.Count > 0) {
            dataResult['Items'] = dataResult['Items'].concat(data.Items);
            dataResult['Count'] += data.Count;
          }
          dataResult['ScannedCount'] += data.ScannedCount;
          LOG.printObject("inF",dataResult["Counter"],dataResult['Count']);
          if (typeof(data.LastEvaluatedKey) == 'object'){
            params.ExclusiveStartKey = data.LastEvaluatedKey;
            docClient.query( params , inF );
          }else {
            onQuery(err,dataResult);
          }
        }
        docClient.query (params,inF);
    }
    module.exports.query = DinamoDbQuery;
    //Dinamo DB scan
    function DinamoDbScan (iNobject,onScan) {
        var params = { TableName : iNobject.table };
        // params.ConsistentRead = false;


        if( typeof(iNobject.limit) != 'undefined' )
            params.Limit = iNobject.limit;

        if( typeof(iNobject.last) != 'undefined' )
            params.ExclusiveStartKey = iNobject.last;

        if( typeof(iNobject.index) != 'undefined' )
            params.IndexName = iNobject.index;

        if( typeof(iNobject.order) != 'undefined' ) {
           if(iNobject.order == 'desc'){
              params.ScanIndexForward = false;
           } else {
              params.ScanIndexForward = true;
           }
        }
        if( typeof(iNobject.select) != 'undefined' && iNobject.select !== false)
            params.ProjectionExpression = iNobject.select; // "#yr, title, info.genres, info.actors[0]",

        if( typeof(iNobject.mask) != 'undefined' && iNobject.mask !== false)
            params.FilterExpression = iNobject.mask; //"#yr = :yyyy",

        if( typeof(iNobject.keys) != 'undefined' && iNobject.keys !== false)
            params.ExpressionAttributeNames = iNobject.keys; // "#yr": "year"

        if( typeof(iNobject.vals) != 'undefined' && iNobject.vals !== false)
            params.ExpressionAttributeValues = iNobject.vals; // ":yyyy":1985


        docClient.scan(params, onScan);
    }
    module.exports.scan = DinamoDbScan;

    function Connect_clearObjectByTypeOf (iNval, iNdata, inTypeConverter) {
      /*
        @disct
          clear array (iNval) from elems where typeof from elem not found in Indata with convert
          @example
            Connect_clearObjectByTypeOf( ['12',22], ['string'] , {'number':'string'} );
        @input
          @required
            iNval   - [array]
            iNdata  - [array]
          @optional
            inTypeConverter - {object}
              @example {valueType:toValueType}
        @return
          [] with rith elems
          OR false
      */
      if( typeof(iNval) == 'object' && typeof(iNdata) == 'object') {
        var resultArray = [], typeData;
        for ( var i in iNval) {
          typeData = typeof(iNval[i]);
          // convert block
          if(
            typeof(inTypeConverter) == 'object' &&
            typeof(inTypeConverter[typeData]) != 'undefined'
          ){
            switch (inTypeConverter[typeData]) {
              case "string":
                iNval[i] = iNval[i].toString();
                typeData = 'string';
              break;
              case "number":
                iNval[i] = parseInt(iNval[i]);
                typeData = 'number';
              break;
            }
          }

          //check typeOf val
          if( iNdata.indexOf(typeData) != -1) {
             resultArray.push(iNval[i]);
          }
        }
        if( resultArray.length < 1) return false;
        return resultArray;
      }
      return false;
  }
  module.exports.clearObjectByTypeOf = Connect_clearObjectByTypeOf;


  function Connect_addIn (iNname,iNarray,params) {
    /*
    	@discr
      	get block for query
      	@example
        	Connect_addIn('nameThis',[1,2,3,5],{})
          	@return
            	{'vals':{...},'keys':{...},'maskFilter': '...'}
      @inputs
        1 - iNname -> array OR string
        2 - iNarray -> array
        3 - params -> object (default = {})
      @return
        add to call back in contains to params dinamo db
    */
    if( typeof(iNarray) == 'object' ) {
    	if (typeof(params['keys']) != 'object')       params['keys'] = {};
    	if (typeof(params['vals']) != 'object')       params['vals'] = {};
    	if (typeof(params['maskFilter']) != 'string') params['maskFilter'] = "";

      if(typeof(iNname) != 'object' || Array.isArray(iNname)!= true) {
      	iNname= [iNname];
      }

      var ExtraMaskFilter = [];
      for(var nameIndex in iNname){
      	var name = iNname[nameIndex];
     	  params.keys['#'+name] = name;
        for (var i = 0; i < iNarray.length; i++) {
          var valCidName = ":"+name+i;
          var addOperand = "contains (#" + name + "," + valCidName + ")";
          ExtraMaskFilter.push(addOperand);
          params.vals[valCidName]    = iNarray[i];
        }
      }
      ExtraMaskFilter = ExtraMaskFilter.join(' or ');
      if(params.maskFilter.length > 0)params.maskFilter += " and";
      params.maskFilter += " ("+ExtraMaskFilter+")";
      return params;
    }
  }
  module.exports.addIn = Connect_addIn;
//>>>@ WORK WITH DINAMO



function addByMask (iNdata,iNname,iNresult,iNtype,iNmark) {
	return _addBy(iNdata,iNname,iNresult,iNtype,iNmark,"mask");
}
module.exports.addByMask = addByMask;

module.exports.addByMask = addByMask;

function addByMaskFilter (iNdata,iNname,iNresult,iNtype,iNmark) {
	return _addBy(iNdata,iNname,iNresult,iNtype,iNmark,"maskFilter");
}
module.exports.addByMaskFilter = addByMaskFilter;

function _addBy (iNdata,iNname,iNresult,iNtype,iNmark,iNmaskType) {
   if (
     typeof(iNdata) != 'object' ||
     typeof(iNname) != 'string' ||
     typeof(iNmaskType) != 'string'
   ) return false;
   if ( typeof(iNmark) != 'string' ) iNmark = "=";
   if ( typeof(iNtype) != 'string' ) iNtype = "string";
   if(iNmaskType == 'mask')
    iNresult = checkForMask(iNresult);
   else if (iNmaskType == 'maskFilter')
    iNresult = checkForMaskFilter(iNresult);
   var arrayOfNames = iNname.split('.'),
   		 nameForAdd,
       valNameForAdd,
       nameArrayForAdd = [];
   for (var iKey in arrayOfNames) {
    iKey *= 1;

     if(arrayOfNames.length == (iKey+1) ){
       // add value if last
       if ( typeof(iNdata[arrayOfNames[iKey]]) != iNtype ) return false;
       iNresult['vals'][":"+arrayOfNames[iKey]] = iNdata[arrayOfNames[iKey]];
       valNameForAdd = ':' + arrayOfNames[iKey];
     }
     // add key to path
     iNresult['keys']["#"+arrayOfNames[iKey]] = arrayOfNames[iKey];
     nameArrayForAdd.push("#"+arrayOfNames[iKey]);
   }
	 nameForAdd = nameArrayForAdd.join('.');
   if ( iNresult[iNmaskType].length > 0 ) iNresult[iNmaskType] += " and " ;
   iNresult[iNmaskType] +=  nameForAdd + " " + iNmark + " " + valNameForAdd;
   return iNresult;
}

function checkForMask (iNresult) {
	return checkPrivate(iNresult,"mask");
}
function checkForMaskFilter (iNresult) {
	return checkPrivate(iNresult,"maskFilter");
}
  function checkPrivate (iNresult,iNname) {
    if ( typeof(iNresult) != 'object' ) iNresult = {};
    if ( typeof(iNresult['keys']) != 'object' ) iNresult['keys'] = {};
    if ( typeof(iNresult['vals']) != 'object' ) iNresult['vals'] = {};
    if ( typeof(iNresult[iNname]) != 'string' ) iNresult[iNname] = '';
    return iNresult;
  }
