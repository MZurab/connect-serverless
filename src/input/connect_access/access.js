/*
  public

    getActionPermission ((read||write||delete||update),app,action)
      example -  ACCESS.getActionPermission("delete","market","menus")
    checkAccessByRole (role,app) -
      example -   ACCESS.checkAccessByRole(123,"market");
*/

var DINAMO    = require("./../aws/dinamo");
var CONNECT   = require('./../connect');
const LOG     = require('ramman-z-log');

var FIREBASE  = require("./../firebase/firebase");
var FADMIN    = FIREBASE.admin;
var USER      = require("./../connect_users/users");

const _ = {};
const global_connect = {};
    global_connect['roles']   = {};
    global_connect['actions'] = {};
    global_connect['info'] = {};

//@@@< OUTPUT FUNTIONCS

    function getInfo () {
      return global_connect['info'];
    }
    _['getInfo'] = getInfo;


    function getAccessDataForApi (iNdata,iNfunction) {
    /*
      @inputs
        @required
          1 - iNdata -> object
            @required
              key
              to
              ip
              pswd
            @optinal
              code          -> string ( default: 'appAccess' )
              verification  -> string ( default: 'api' )
              to            -> string ( default: '?' )
          2 - iNfunction -> function
      @callback
        iNfunction (object) {actions : [] ,roles: []}
        OR iNfunction (false)
    */

      if( typeof(iNdata.code) != 'string' )           iNdata.code = 'appAccess';
      if( typeof(iNdata.verification) != 'string' )   iNdata.verification = 'api';
      if( typeof(iNdata.to) != 'string' )             iNdata.to = '?';

      var iNkey           = iNdata.key,
      iNseviceId          = iNdata.uid,
      iNip                = iNdata.ip,
      iNcode              = iNdata.code,
      iNverification      = iNdata.verification||'api',
      iNto                = iNdata.to,
      iNpswd              = iNdata.pswd;

      function forQuery (err,data) {
        LOG.printObject('getAccessDataForApi forQuery err,data',err,data);
        if (err || data.Count < 1) {
          iNfunction(true);
        } else {

          // var userIp = iNip;
          // check pswd and ip access
              // create global val

              // foreach found data
              var info = {};
              data.Items.forEach(function(item) {
                  if (item.ip != '*' && item.ip != iNip) {
                    LOG.printObject("IP wrond - " + item.ip + " != " + iNip);
                    return;
                  };
                  if (item.pswd != iNpswd) {
                    LOG.printObject("Pswd wrond - " + item.pswd + " != " + iNpswd);
                    return;
                  };
                  var weight = getWeightForAccessBlock(item.weight);
                  //if actions isset add them
                  if( typeof(item.actions) == 'object') {
                    var actions = item.actions;
                    createCertainBlockForAcctions (actions,weight,'actions');
                  }
                  //if roles isset add them
                  if( typeof(item.roles) == 'object'){
                    var roles = item.roles;
                    for(var appName in roles){
                      for(var thisRole=0;thisRole < roles[appName].length;thisRole++){
                        addAccessRole(roles[appName][thisRole],appName,'roles');
                      }
                    }
                  }

                  //if additional data isset -> we add to global const them
                  if(typeof(item.info) == 'object') {
                    info = CONNECT.concat_json(info,item.info);
                    global_connect['info'] = info;
                  }
                  //invoke funciton
                  iNfunction(false,global_connect,info);
            			// addToVar(item.val,dataBlock);
              });


        }
      }
      LOG.printObject('access2 ',{
          'table':'connect-base',
          // 'select': "login",
          // 'order': "asc",
          'index': "uid-code-index",
          //  and (#data.ip = :ipAll or #data.ip = :userIp)
          'mask' : "#uid = :uid and #code = :code" ,// attribute_exists(#login)
          'maskFilter': "#verification = :verification and #key = :key and #to = :to",
          'keys' : { "#uid": "uid" , "#to":"to" , "#verification" : "verification" , "#key" : "key", "#code" : "code"},//
          'vals' : { ":uid" : iNseviceId , ":to" : iNto, ":verification" : iNverification , ":key" : iNkey, ":code" : iNcode} //

      });
      DINAMO.query (
          {
            'table':'connect-base',
            // 'select': "login",
            // 'order': "asc",
            'index': "uid-code-index",
            //  and (#data.ip = :ipAll or #data.ip = :userIp)
            'mask' : "#uid = :uid and #code = :code" ,// attribute_exists(#login)
            'maskFilter': "#verification = :verification and #key = :key and #to = :to",
            'keys' : { "#uid": "uid" , "#to":"to" , "#verification" : "verification" , "#key" : "key", "#code" : "code"},//
            'vals' : { ":uid" : iNseviceId , ":to" : iNto, ":verification" : iNverification , ":key" : iNkey, ":code" : iNcode} //

          }, (e,d) => {
            LOG.print('(e,d) ',e,d );
            forQuery(e,d);
          }
      );
    }
    _['getAccessDataForApi'] = getAccessDataForApi;


    function getAccessDataForUid () {

    }

//@@@> OUTPUT FUNTIONCS








//@@@< WORK WITH VARS
      function getVarByName (iNdata,iNvalName,iNfunction) {
      /*
      	@discr
        	get var by [iNdata.to,iNdata.name,iNdata.uid] data from db to (iNvalName) by (iNfunction(iNval)) firstParam
      	@inputs
        	iNdata
          	@required
            	iNdata
              iNval
              iNfunction
        @return
        	void
        @depends
        	global_connect
          @functions
          	addToVar();
          @global
          	DINAMO

      */
        if(
          typeof(iNdata.uid) != 'undefined' &&
          typeof(iNdata.to) != 'undefined' &&
          typeof(iNdata.name) != 'undefined'
        ) {
      		var keysForQuery = {}, valsForQuery = {};
          	keysForQuery['#name'] 	= "name";		valsForQuery[':name'] 	= iNdata.name;
            keysForQuery['#uid'] 		= "uid";		valsForQuery[':uid'] 		= iNdata.uid;
            keysForQuery['#to'] 		= "to";			valsForQuery[':to'] 		= iNdata.to;

          if ( typeof(iNdata.id) != 'undefined' ) 	{
          	keysForQuery['#id'] 		= "id";			valsForQuery[':id'] 		= iNdata.id;
          }

          var paramsForQueryToDb = {
          	'table':'connect-base',
            'index' : "uid-to-index",
            'mask' : "#uid = :uid and #to = :to and #code = :code and #name = :name",
            'keys' : keysForQuery,
            'vals' : valsForQuery,
          };
          function forQuery ( err , data) {
          	 if (err) {
                  LOG.printObject(err);
                  return 0;
             } else {
             		if(data.Count > 0 ) {
                	// add to global data
                  var dataBlock = [];
                	data.Items.forEach(function(item) {
                			addToVar(item.val,dataBlock);
                  });
                  if(typeof(iNfunction) == 'function') iNfunction(dataBlock);
                }
             }
          }
          DINAMO.query(
          	paramsForQueryToDb,
            forQuery
          );
        }
      }

      function addToVar (iNinput,iNoutput) {
      /*
      	@discr
        	add data to var
      	@inputs
        	iNinput
          iNoutput
        @return
        	iNinput (object)
        @for
          @functions
          	getVarByName();
      */
      	if( typeof(iNinput) == 'undefined' ) 	return false;
      	if( typeof(iNoutput) == 'undefined' ) iNoutput = [];
      	iNoutput.push(iNinput);
        return iNinput;
      }
//@@@> WORK WITH VARS






//@@@< WORK WITH ROLES
      function addAccessRole(iNthisRole,iNapp,iNnameForGlobalVar){
      /*
      	@discr
        	get permission by role
      	@inputs
        	iNthisRole
        	iNapp
          iNnameForGlobalVar - (default - 'roles') roles block  name from db
        @return
        	true
          OR false
        @depends
        	global_connect (object) [iNnameForGlobalVar]
      */
      	if(
        	typeof(iNthisRole) 	!= undefined &&
        	typeof(iNapp) 			!= undefined
        	// typeof(iNroles) 		== "object"
        )
        {

          if( typeof(iNnameForGlobalVar) == 'undefined' )iNnameForGlobalVar = 'roles';
          if( typeof(global_connect[iNnameForGlobalVar]) != 'object') {
            global_connect[iNnameForGlobalVar] = {};
          }
        	if( typeof(global_connect[iNnameForGlobalVar][iNapp]) != 'object') global_connect[iNnameForGlobalVar][iNapp] = [];
          global_connect[iNnameForGlobalVar][iNapp].push(iNthisRole);
          return true;
        }
        return false;
      }

      function checkAccessByRole(iNthisRole,iNapp,iNnameForGlobalVar) {
      /*
      	@discr
        	get permission by role
      	@inputs
        	iNthisRole
        	iNapp
          iNnameForGlobalVar -  (default - 'roles') roles block from db
        @return
        	true
          OR false
        @depends
        	iNroles
      */
      if(
        	typeof(iNthisRole) 	!= undefined &&
        	typeof(iNapp) 			!= undefined
        )
        {
          if( typeof(iNnameForGlobalVar) == 'undefined' ) iNnameForGlobalVar = 'roles';
          if( typeof(global_connect[iNnameForGlobalVar]) == 'object' && typeof(global_connect[iNnameForGlobalVar][iNapp]) == 'object') {
          	for(var role in global_connect[iNnameForGlobalVar][iNapp]) {
            	if(iNthisRole == global_connect[iNnameForGlobalVar][iNapp][role]) return true;
            }
          }
        }
        return false;
      }
      _['checkAccessByRole'] = checkAccessByRole;
//@@@> WORK WITH ROLES



//@@@< WORK WITH ACTIONS
      function getActionPermission (inNeedType,iNapp,iNaction,iNnameForGlobalVar) {
      /*
      	@discr
        	get permission by app AND action
      	@inputs
        	inNeedType - read || redact || delete || write or full
        	iNapp
          iNaction
          iNnameForGlobalVar default = actions
        @return
        	full
          OR limited
          OR false (default return)
      	@depends
        	iNcertainBlock - result by createCertainBlockForAcctions()

      */
        if( typeof(iNnameForGlobalVar) == 'undefined' )iNnameForGlobalVar = 'actions';
      	if (
        	typeof(inNeedType) == 'undefined' ||
        	typeof(iNapp)      == 'undefined' ||
        	typeof(iNaction)   == 'undefined'
        ) return false;
        var result = false;
      	var name = iNapp + "_" + iNaction;
      	if( typeof(global_connect[iNnameForGlobalVar][name]) == "object" ) {
        	var lastIndexElem = global_connect[iNnameForGlobalVar][name].length - 1;
          var permission 		= global_connect[iNnameForGlobalVar][name][lastIndexElem].val;
          var permissionNumber;
          switch (inNeedType) {
            case "read":
            	permissionNumber = 0;
            break;
            case "update":
            	permissionNumber = 1;
            break;
            case "delete":
            	permissionNumber = 2;
            break;
          	case "write":
            	permissionNumber = 3;
            break;

          }
          var permisionCode = permission.charAt(permissionNumber);
          if ( permisionCode == 1)
          	result = "limit";
          else if ( permisionCode == 2 )
          	result = "full";
        }
        return result;
      }
      _['getActionPermission'] = getActionPermission;

      function createCustomToken (iNuid,iNdata,iNfunction) {
        LOG.printObject('createCustomToken INVOKE',iNuid,iNdata);
        // gaurd for non object for claims token
        if(typeof iNdata != 'object') iNdata = {};


        var functCreateToken =  (iNuid,iNdata) =>  {
          LOG.printObject('createCustomToken iNuid, iNdata -',iNuid,iNdata);
          FADMIN.auth().createCustomToken(iNuid, {'claims': iNdata })
              .then ( function(customToken) {
                  iNfunction(false,customToken);
              }).catch(function(error) {
                  iNfunction(error,null);
              });
        }

        //add pseudouser to to this token
        USER.getPseudoUsersByUid(
          iNuid,
          ( errPseudoUser, objPseudoUsers) => {
            LOG.print('createCustomToken getPseudoUsersByUid errPseudoUser -',errPseudoUser);
            LOG.print('createCustomToken getPseudoUsersByUid objPseudoUsers -',objPseudoUsers);
            if (errPseudoUser) {
              functCreateToken(iNuid,iNdata)
              return;
            }
            //SUCCESS add pseudo user to claims => create token
            for (var pseudUserId in objPseudoUsers) {
              iNdata[pseudUserId] = objPseudoUsers[pseudUserId];
            }
            //invoke function with pseudousers
            functCreateToken(iNuid,iNdata)

          }
        )


      }
      _['createCustomToken'] = createCustomToken;

      function createCertainBlockForAcctions (actions,weight,iNnameForGlobalVar) {
      /*
      	@discr
        	create certaind block for actions
        @inputs
          actions
          weight
          iNnameForGlobalVar
      	@depends
        	addActionToCertainBlock()
      */
        for (var appName in actions) {
          var actionsObject = actions[appName];
          if( typeof(actionsObject) != 'object') continue;
          // go-round actions block
          for( var actionName in actionsObject) {
            var data = {
              "val" 		: actions[appName][actionName],
              "weight" 	: weight,
              "app" 		: appName,
              "action" 	: actionName
            };
            addActionToCertainBlock(data,iNnameForGlobalVar);
          }
        };
      }


      function addActionToCertainBlock (iNdata,iNnameForGlobalVar){
      	/*
        	1 - iNdata
          	app
            action
            val
            weight
          2 - iNnameForGlobalVar
          @depends
          	iNcertainBlock
        */
        if(
        	typeof(iNdata) != 'undefined' &&
        	typeof(iNdata.app) != 'undefined' &&
        	typeof(iNdata.action) != 'undefined' &&
        	typeof(iNdata.weight) != 'undefined' &&
        	typeof(iNdata.val) != 'undefined'
        ) {
        	// create name
        	var name = iNdata.app + '_' + iNdata.action;
          // check for conflict
          var conflict = goRoundActionsForConflict (
          	name,
            iNdata.weight ,
            iNnameForGlobalVar
          );
          // object create for push
          var obj = { "val" : iNdata.val , "weight" : iNdata.weight };
          // create if not
          if( typeof(global_connect[iNnameForGlobalVar][name]) != "object") global_connect[iNnameForGlobalVar][name] = [];
          // add if not conflict
          if(conflict !== true) global_connect[iNnameForGlobalVar][name].push(obj);
        }
      }
      function goRoundActionsForConflict (iNname,iNweight,iNnameForGlobalVar) {
      	/*
        	@inputs
            1 - iNname
            2 - iNweight
            3 - iNnameForGlobalVar
          @discription
          	обход
          @depends
          	global_connect (object) [iNnameForGlobalVar]
        */
        var result = false;
        if (
        	typeof(global_connect[iNnameForGlobalVar]) != 'undefined' &&
        	typeof(iNweight) != 'undefined' &&
        	typeof(iNname) != 'undefined'
        ) {
        	// if !isset action block = not conflict
          if( typeof(global_connect[iNnameForGlobalVar][iNname]) != 'object') return false;
          // get action array for search weighter than new
        	var ArrayForThisAction = global_connect[iNnameForGlobalVar][iNname];
          // default lastWeight equil -1
          var lastWeight = iNweight;
          for (var nameThisBlock in ArrayForThisAction) {
          	if( typeof(ArrayForThisAction[nameThisBlock]) == "object" ) {
            	var thisActionObject = ArrayForThisAction[nameThisBlock];
              var thisActionWeight = thisActionObject.weight;
              //
              if ( lastWeight < thisActionWeight )
              	lastWeight = thisActionWeight;
              else if ( lastWeight == thisActionWeight )
              	global_connect[iNnameForGlobalVar][iNname].splice(nameThisBlock,1);
            }
          }
          if( lastWeight > iNweight ) result =  true;
          return result;
        }
      }
      function getWeightForAccessBlock (iNweight,iNselect) {
      	/*
        	@inputs
          	iNweight
          @depends
          	none
          @theme
          	get weight for action block
        */
        var weight;
        if( typeof(iNweight) == 'undefined')
        	weight = 0;
        else
        	weight = iNweight;

        if( typeof(iNselect) != 'undefined') {
        	if(iNselect != "@" && iNselect != "?") weight++;
        }

      	return weight;
      }
//@@@> WORK WITH ACTIONS




module.exports = _;
