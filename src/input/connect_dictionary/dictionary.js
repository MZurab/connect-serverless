var DINAMO    = require("./../aws/dinamo");
var CONNECT   = require('./../connect');
const LOG     = require('ramman-z-log');
var tableDictionary  = "connect-dictionary";
var CONNECT_DICTIONARY = {};

function Connect_getDictionary (iNuid,iNlang,iNfunction) {
  // NEED SELECT OPTIMISITION
  var objForQuery = {'table':tableDictionary,'index':'uid-status-index'},
      uid = iNuid,
      lang = iNlang,
      result=null;
    LOG.printObject('Connect_getDictionary objForQuery start',objForQuery,typeof(objForQuery));
  objForQuery = DINAMO.addByMask({'status':0},'status',objForQuery,'number');
  LOG.printObject('Connect_getDictionary objForQuery after status',objForQuery,typeof(objForQuery));
  objForQuery = DINAMO.addByMask({'uid':uid},'uid',objForQuery);
  LOG.printObject('Connect_getDictionary objForQuery after uid',objForQuery,typeof(objForQuery));
  DINAMO.query(objForQuery,function (err,data) {
    LOG.printObject('Connect_getDictionary err',err);
    LOG.printObject('Connect_getDictionary data',data);
    if(!err && data.Count > 0){
      getValues(data.Items,lang);
      result = CONNECT_DICTIONARY;
    }
    LOG.printObject('Connect_getDictionary result',result);
    iNfunction(result);
  });
}
module.exports.getDictionary = Connect_getDictionary;


function getValues (iNvalues,iNlang) {
	var values 	= iNvalues,
  		lang		= iNlang;
  for (var iKey in values) {
			var thisBlock = values[iKey];
      var nameKeyObj = thisBlock['key'].split('-');
      var thisName = nameKeyObj[0];
      var thisKey = nameKeyObj[1];
      var thisValues = thisBlock['values'];
      for( var iValueKey in thisValues) {
      		var thisValue = thisValues[iValueKey];
     		 	var myVal 	=  thisValue[lang];
          if ( !myVal ) myVal =  thisValue['*'];
          if ( !myVal ) myVal = '';
          addBody(thisName,thisKey,myVal,iValueKey);
      }
  }
}
function addHeader (iName,iKey) {
  var thisDict = checkHeader(iName),
  		thisKeys,myKey;
  thisKeys = Object.keys(thisDict).length;
  if(thisKeys>0)
  	myKey =  thisKeys;
  else
  	myKey =  0;
  if ( typeof(thisDict[iKey]) != 'number')
  	thisDict[iKey]=myKey;
  else
  	myKey = thisDict[iKey];
  CONNECT_DICTIONARY[iName]['header'] = thisDict;
  return myKey;
}
function checkHeader (iName) {
  var thisKeys,myKey;
  if(typeof(CONNECT_DICTIONARY[iName]) != 'object') {
    CONNECT_DICTIONARY[iName] = {};
  }
  if (typeof(CONNECT_DICTIONARY[iName]['header']) != 'object') {
    CONNECT_DICTIONARY[iName]['header'] = {};
  }
  return CONNECT_DICTIONARY[iName]['header'];
}


function addBody (iName,iKey,iVal,iField) {
  var thisDict = checkBody(iName,iKey,iField),
      myKey 	 = addHeader(iName,iField);

  thisDict[iKey][myKey] = iVal;
  CONNECT_DICTIONARY[iName]['body'] = thisDict;
}
function checkBody (iName,iKey,myKey) {
  var thisKeys,myKey;
  if(typeof(CONNECT_DICTIONARY[iName]) != 'object') {
    CONNECT_DICTIONARY[iName] = {};
  }
  if (typeof(CONNECT_DICTIONARY[iName]['body']) != 'object') {
    CONNECT_DICTIONARY[iName]['body'] = {};
  }
  if (typeof(CONNECT_DICTIONARY[iName]['body'][iKey]) != 'object') {
    CONNECT_DICTIONARY[iName]['body'][iKey] = {};
  }
  return CONNECT_DICTIONARY[iName]['body'];
}
