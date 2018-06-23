/*
  @depends
    @libraries
      AMAZON AWS - require("aws-sdk");
    @vars input
      var docClient = new AWS.DynamoDB.DocumentClient();
*/
const USER          = require("./../connect_users/users");
const APP_PAGE      = require("./app-page");
const APP_BASE      = require("./app-base");
const APP_SHAREPAY  = require("./app-sharepay");
const APP_ONEPAY    = require("./app-onepay");
const LANG          = require("./../connect_lang/lang");
const LOG           = require('ramman-z-log');

const _ = {};


//< functions
  function hubApp ( iNobject, iNdata, iNuser, iNevent, iNcontext) {
    LOG.printObject('app.js hubApp iNdata, iNuser, iNevent',iNdata, iNuser, iNevent);
    const app = iNobject['app'];
    switch (app) {
      case 'market':
        APP_BASE.run(  iNobject , iNdata, iNuser, iNevent , iNcontext);
        // APP_MARKET.run(  iNobject , iNdata, iNuser, iNevent , iNcontext); CHANGE
      break;

      case 'sharepay':
        APP_BASE.run(  iNobject , iNdata, iNuser, iNevent , iNcontext);
        // APP_SHAREPAY.run(  iNobject , iNdata, iNuser, iNevent , iNcontext); CHANGE
      break;

      case 'page':
        APP_PAGE.run(  iNobject , iNdata, iNuser, iNevent , iNcontext);
      break;

      case 'onepay':
        APP_BASE.run(  iNobject , iNdata, iNuser, iNevent , iNcontext);
        // APP_ONEPAY.run( iNobject ,  iNdata, iNuser, iNevent , iNcontext); CHANGE
      break;

      default:
        APP_BASE.run(  iNobject , iNdata, iNuser, iNevent , iNcontext);
      break;
    }
  }
  _['hubApp'] = hubApp;

  function openApp ( iNdata, iNevent, iNcontext ) {
    LOG.printObject ('app.js openApp1 iNdata, iNevent, iNcontext',iNdata, iNevent, iNcontext);
    var objForHub  = {};
    objForHub['data']       = getData (iNdata),
    objForHub['page']       = getPage (iNdata),
    objForHub['app']        = getApp  (iNdata) ,
    objForHub['user']       = getUser (iNdata);
    objForHub['userDomain'] = getUserDomain (iNevent);
    var user = objForHub['userDomain']||objForHub['user'];//getUser (iNdata, iNevent);
    LOG.printObject ('app.js openApp objForHub',objForHub);
    LOG.printObject ('app.js openApp iNdata',iNdata);

    USER.getUserByLogin (
      user,
      '@system',
      (err,data) => {
          if ( !err ) {
            var iNuser = data.Items[0];
            hubApp ( objForHub, iNdata, iNuser, iNevent, iNcontext );
          } else {
            // ERROR CHANGE
          }
      }
    );
  }
  _['openApp'] = openApp;

  function run ( iNdata, iNevent, iNcontext ) {
    LOG.printObject ('app.js run iNdata, iNevent, iNcontext',iNdata, iNevent, iNcontext);
    openApp ( iNdata, iNevent, iNcontext );
  }
  _['run'] = run;


  function getUser (iNdata) {
    return iNdata['user'];
  }
    function getUserDomain (iNevent) {
      // header
      var r;
      try {
        r = iNevent['params'];
        r = r['header']['Host'];
        r = r.split('.');
        r = r[0];
        if( r == 'ramman' || r == 'www') r = false;
      } catch (e) {
        r = false;
      } finally {
        return r;
      }
    }
    _['getUserDomain'] = getObjectByUrl;

  function getApp (iNdata) {
    LOG.printObject ("app.js getApp iNdata",iNdata);
    let app = ( LANG.check(iNdata['app']) ) ? 'base' : iNdata['app'];
    LOG.printObject ("app.js getApp app",app);

    return app;
  }

  function getPage (iNdata) {
    LOG.printObject ("app.js getPage iNdata",iNdata);
    let page = ( LANG.check(iNdata['page']) ) ? 'index' : iNdata['page'];
    LOG.printObject ("app.js getPage page",page);

    return page;
  }

  function getData (iNdata) {
    LOG.printObject ("app.js getData iNdata['data']", iNdata['data'] );
    let r = false;
    if( typeof iNdata['data'] == 'string') {
      r = getObjectByUrl(iNdata['data']);
    } else if (typeof iNdata['data'] == 'object')
      r = iNdata['data'];
    LOG.printObject ("app.js getData r", r );
    return r;
  }
// functions

function getUrlPath (iNurl,iNnumber) {
	/*
		@inputs
		@example
			urlGetPath(url,1)
	*/
	var loc 	= iNurl;
	if(typeof(iNnumber) != 'number') return loc; iNnumber--;
	var locArr 	= loc.split('/').splice(1);
	if(iNnumber <= 0) return locArr[0];
	if(typeof(locArr[iNnumber]) != 'undefined')
		if(typeof(locArr[iNnumber]) == 'string' && locArr[iNnumber].length > 0)
			return locArr[iNnumber];
	return false;
}
_['getUrlPath'] = getUrlPath;

function getUrlLength (iNurl) {
	/*
		@inputs
		@example
			getUrlLength(1)
	*/
	var loc 	= iNurl;//location.pathname,
	 	locArr 	= loc.split('/').splice(1),
		count   = 0;
	for(var iKey in locArr) {
		if(locArr[iKey].length > 0 )count ++
	}
	return count;
}
_['getUrlLength'] = getUrlLength;

function getObjectByUrl (iNurl) {
  /*
  	@disc
  		get json object from string with url get type
  	@inputs
  		iNstr -> string
  	@example
  		getObjectFromString('key=value&key2=value2')
  			@return -> { key : 'value', key2 : value2 }
  */
  LOG.printObject('app.js getObjectByUrl iNurl',iNurl);
  if ( typeof iNstr != 'string' ) iNstr ='';
  var result = {};
  var str = iNurl.split('?');
      str = str[str.length - 1];
  let res = str.split('&');
  if(res.length > 0 ) {
    for(var i in res){
      var keyAndValue = res[i];
      var arrayWithKeyAndValue = keyAndValue.split('=');
      var key = arrayWithKeyAndValue[0];
      var val = decodeURI(arrayWithKeyAndValue[1]);
      result[key]=val;
    }
  }
  LOG.printObject('app.js getObjectByUrl result', result);
  return result;
}
_['getObjectByUrl'] = getObjectByUrl;

module.exports = _;
