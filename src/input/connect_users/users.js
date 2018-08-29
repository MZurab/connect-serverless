var DINAMO  = require("../aws/dynamo/dynamo");
const LOG   = require('ramman-z-log');
const table = "connect-user";

const FIREBASE  = require("./../firebase/firebase");
      const firestore = FIREBASE.firestore;

const TRIGGER   = require("./../connect_triggers/user/trigger");

const _ = {'trigger':TRIGGER};

//
function getPseudoUsersByUid (iNuid, iNfunction) {
  var path = 'users/' + iNuid + '/pseudouser',
      status  = 1,
      ref = firestore ()
      .collection( path )
      .where('status',  '==', status);

  ref.get().then(
    (querySnapshot) => {
      if ( !querySnapshot.empty ) {
          LOG.print ('getPseudoUsersByUid non empty');
          // we has data
          var resultObj = {};
          querySnapshot.forEach (
            (doc) => {
              resultObj[doc.id] = true;
            }
          );

          iNfunction(null, resultObj);
      } else {
          // we has not data
          iNfunction( true );
      }
    }
  ).catch (
    (e) => {
        LOG.print ('getPseudoUsersByUid ERROR',e);
        // we has not data
        iNfunction( true );
    }
  );
} _. getPseudoUsersByUid = getPseudoUsersByUid;


function checkAccessToPseudoUser (iNuid,iNpseudoId,iNfunction) {
  /*
    @discr
      check access to pseudouser for userId
    @inputs
      @required
        iNchatObject -> object
          @required
            iNuid       -> string
            iNpseudoId  -> string
            iNfunction  -> function
          @optional
    */
    LOG.printObject('checkAccessToPseudoUser - INVOKE',iNuid,iNpseudoId);
    var path = `users/${iNuid}/pseudouser/${iNpseudoId}`;
    LOG.printObject('checkAccessToPseudoUser - path',path);
    firestore().doc(path).get().then(
      (doc) => {
        LOG.printObject('checkAccessToPseudoUser - doc',doc);
         if (doc.exists) {
           var docObject = doc.data();
           LOG.printObject('checkAccessToPseudoUser - docObject',docObject);
           if ( docObject.status == 1 ) {
             //add
             // docObject.id = doc.id;
             iNfunction( false, docObject );
             return;
           }
         }

         iNfunction(true)


      }
    ).catch (
      (err) => {
        LOG.print('checkAccessToPseudoUser - err',err);
        iNfunction(true)
      }
    );
} _.checkAccessToPseudoUser = checkAccessToPseudoUser;
//


//@<
  function getUserById (iNuid,iNowner,iNfunction) {
    /*
      @inputs
        @required
          iNuid -> string
        @optinal
          iNfunction -> funciton
            @example
              iNfunction(err,data)
      @return
        NOT, callback to iNfunction
    */
    if ( typeof(iNuid) != 'string' ) return false;

    var data = {};
      data['table'] = table;
      data['mask']  = "#uid = :uid and #own = :own";
      data['keys']  = {"#uid":"uid",'#own':'owner'};
      data['vals']  = {":uid":iNuid,':own' : iNowner};

    DINAMO.query(data,iNfunction);

  }
  _.getUserById = getUserById;

  function getPublicUserById (iNuid,iNowner,iNfunction) {
    /*
      @inputs
        @required
          iNuid -> string
        @optinal
          iNfunction -> funciton
            @example
              iNfunction(err,data)
      @return
        NOT, callback to iNfunction
    */
    if ( typeof(iNuid) != 'string' ) return false;

    var data = {};
      data['table'] = table;
      data['mask']  = "#uid = :uid and #own = :own";
      data['maskFilter']  = "#public = :public";
      data['keys']  = {"#uid":"uid",'#own':'owner','#public':'public'};
      data['vals']  = {":uid":iNuid,':own' : iNowner,':public' : 1};

    DINAMO.query(data,iNfunction);

  }
  _.getUserById = getUserById;


  function getPublicUserByLogin (iNlogin,iNowner,iNfunction) {
    /*
      @inputs
        @required
          iNlogin -> string
        @optinal
          iNfunction -> funciton
            @example
              iNfunction(err,data)
      @return
        NOT, callback to iNfunction
    */
    LOG.printObject('getUserByLogin iNlogin,iNowner,iNfunction',iNlogin,iNowner,iNfunction);
    if ( typeof(iNlogin) != 'string' ) return false;
    var data = {};
      data['table'] = table;
      data['index'] = 'owner-login-index';
      data['mask']  = "#login = :login and #own = :own";
      data['maskFilter']  = "#public = :public";
      data['keys']  = {"#login" : "login",'#own' :'owner','#public':'public'};//,'#public':'public'
      data['vals']  = {":login" : iNlogin,':own' : iNowner,':public' : 1}; // ,':public' : 1

    DINAMO.query(data,iNfunction);

  }
  _.getPublicUserByLogin = getPublicUserByLogin;


  function getUserByLogin (iNlogin,iNowner,iNfunction) {
    /*
      @inputs
        @required
          iNlogin -> string
        @optinal
          iNfunction -> funciton
            @example
              iNfunction(err,data)
      @return
        NOT, callback to iNfunction
    */
    LOG.printObject('getUserByLogin iNlogin,iNowner,iNfunction',iNlogin,iNowner,iNfunction);
    if ( typeof(iNlogin) != 'string' ) return false;
    var data = {};
      data['table'] = table;
      data['index'] = 'owner-login-index';
      data['mask']  = "#login = :login and #own = :own";
      // data['maskFilter']  = "#public = :public";
      data['keys']  = {"#login" : "login",'#own' :'owner'};//,'#public':'public'
      data['vals']  = {":login" : iNlogin,':own' : iNowner}; // ,':public' : 1

    DINAMO.query(data,iNfunction);

  }
  _.getUserByLogin = getUserByLogin;
//@>


  function getStructuredUserByLogin (iNlogin,iNowner,iNfunction,iNtype) {
    /*
      @inputs
        @required
          iNlogin -> string
          iNowner
          iNfunction -> funciton
            @example
              iNfunction(data)
          @optional
            iNtype ->string @|?
      @return
        NOT, callback to iNfunction
    */
    if ( typeof(iNlogin) != 'string' ) return false;
    if ( typeof iNtype != 'string' || iNtype != '@')iNtype = '?';
    var f = function (err,data) {
      if( !err && data.Count > 0 ) {
        var result = {};
        var thisData = data.Items[0];
        result.login  = thisData.login;
        result.public = thisData.public;
        result.uid    = thisData.uid;
        result.lang    = thisData.lang;
        if ( typeof thisData['info'] == 'object') {
          var thisInfo = thisData['info'];
          if ( typeof thisInfo['description'] == 'object' )     result.description      = thisInfo.description['*'];
          if ( typeof thisInfo['metaDescription'] == 'object' ) result.metaDescription  = thisInfo.metaDescription['*'];
          if ( typeof thisInfo['metaKey'] == 'object' )         result.metaKey          = thisInfo.metaKey['*'];
          if ( typeof thisInfo['name'] == 'object' )            result.name             = thisInfo.name['*'];
          if ( typeof thisInfo['icon'] == 'object' )            result.icon             = thisInfo.icon['*'];
        }
        iNfunction (result);
      } else {
        iNfunction (false);
      }
    };
    if(iNtype == '?')
      getPublicUserByLogin (iNlogin,iNowner,f);
    else
      getUserByLogin (iNlogin,iNowner,f);
  }
  _.getStructuredUserByLogin = getStructuredUserByLogin;


//@<
  function getStructuredUserById (iNuid,iNowner,iNfunction) {
    /*
      @inputs
        @required
          iNuid -> string
          iNfunction -> funciton
            @example
              iNfunction(data)
      @return
        NOT, callback to iNfunction
    */
    if ( typeof(iNuid) != 'string' ) return false;

    getPublicUserById (iNuid,iNowner,function (err,data) {
      if( !err && data.Count > 0 ) {
        var result = {};
        var thisData = data.Items[0];
        result.login  = thisData.login;
        result.public = thisData.public;
        result.uid    = thisData.uid;
        result.lang    = thisData.lang;
        if ( typeof thisData['info'] == 'object') {
          var thisInfo = thisData['info'];
          if ( typeof thisInfo['description'] == 'object' )     result.description      = thisInfo.description['*'];
          if ( typeof thisInfo['metaDescription'] == 'object' ) result.metaDescription  = thisInfo.metaDescription['*'];
          if ( typeof thisInfo['metaKey'] == 'object' )         result.metaKey          = thisInfo.metaKey['*'];
          if ( typeof thisInfo['name'] == 'object' )            result.name             = thisInfo.name['*'];
          if ( typeof thisInfo['icon'] == 'object' )            result.icon             = thisInfo.icon['*'];
        }
        iNfunction (result);
      } else {
        iNfunction (false);
      }
    });

  }
  _.getStructuredUserById = getStructuredUserById;
//@>

//@<
  function getUserById234 (iNuid,iNfunction) {
    /*
      @inputs
        @required
          iNuid -> string
        @optinal
          iNfunction -> funciton
            @example
              iNfunction(err,data)
      @return
        NOT, callback to iNfunction
    */
    if ( typeof(iNuid) != 'string' ) return false;

    var data = {};
      data['table'] = table;
      data['mask']  = "#id = :id";
      data['keys']  = {"#id":"id"};
      data['vals']  = {":id":iNuid};

    DINAMO.query(data,iNfunction);

  }
  _.getUserById = getUserById;
//@>


module.exports = _;
