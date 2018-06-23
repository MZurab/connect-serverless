exports.handler = (event, context, callback) => {
    // TODO implement
    var CONNECT     = require('./input/connect');
    const LOG       = require('ramman-z-log');
    var DINAMO      = require("./input/aws/dinamo");
    var ACCESS      = require("./input/connect_access/access");
    var USER        = require("./input/connect_access/user");
    // var MESSAGE    = require("./input/connect_message/message");
    var CONFIRM     = require("./input/connect_access/confirm");
    // var LFIREBASE  = require("./input/firebase/firebase");



    CONNECT.setHeader(event);
    var HEADER = CONNECT.getHeader(['*']);
    var DATA   = HEADER['data'];
    var TYPE   = HEADER['type'];


    LOG.on();
    
    if( typeof(DATA) == 'undefined'){
        callback(null,{'status':0,'ru':'Нет входных данных.'});
        return 0;
    }


//<<<@ WORK WITH CONNECT FUNCTIONS
    // add user
    // function Connect_addUser(iNdata,iNfunction){
    //     var table = "connect-user";
    //     if(typeof(iNdata.id) != 'string')iNdata.id = CONNECT.getRandomKeyByUuid();
    //     return DINAMO.add(table,iNdata,iNfunction);
    // }


    function ClearDeadTokenByDeviceField (userData) {
        // если токены не подтвержденны () и просроченны на 15 минут (900 секунд) то мы их удаляем
        var nowTime = new Date().getTime();
        var deviceIN = userData.device;
        var id = userData.id;
        var countDels = 1;
        for(var key in deviceIN) {
            thisDevice = deviceIN[key];
            var deadSmsCodeTime = thisDevice.created + 900000;
            var status = thisDevice.status;
            if( status == 0 && deadSmsCodeTime < nowTime){
                delete deviceIN[key];
                countDels++;

            }
        }
        if(countDels > 1)
            DINAMO.update(
                {
                    'table':'connect-user',
                    'key': {"id":id},
                    'set' : "set #d = :d",
                    'keys' : {"#d":"device"},
                    'vals' : {":d": deviceIN}

                }
            );
    }
//>>>@ WORK WITH CONNECT FUNCTIONS



    DATA.type = DATA.type;
    DATA.user = DATA.user;
    DATA.pswd = DATA.pswd;
    // //'checkCode';//'signin';


    if ( typeof(DATA.type) != 'undefined') {
        /*
         input
         type
         user
         pswd
         */
        // signIn (by login or phone) and pswd NEED [inUser,inPswd] [inUserAgent || androidCode || iosCode ]
        if( DATA.type == 'signin') {
            // авторизация
            if( typeof(DATA.user) != 'undefined' && typeof(DATA.pswd) != 'undefined' ) {
                var id, device, ua, user = DATA.user, pswd = DATA.pswd;
                if( typeof(event.params.header['User-Agent']) != 'undefined')
                { device = 'browser'; id = event.params.header['User-Agent']; }
                else if( typeof(DATA.androidCode) != 'undefined')
                { device = 'android'; id = DATA.androidCode; }
                else if( typeof(DATA.iosCode) != 'undefined')
                { device = 'ios';     id = DATA.iosCode; }

                USER.getByLoginIndex( {
                  'login' : user,
                  'pswd'  : pswd
                }, onScanForGetUserByUserAndPswd );
                LOG.printObject('USER getByLoginIndex', {
                  'login' : DATA.user,
                  'pswd'  : DATA.pswd
                }
              );
                function onScanForGetUserByUserAndPswd(err, data) {
                    console.error("onScanForGetUserByUserAndPswd",err, JSON.stringify(data));
                    if (err) {
                        console.error("Unable to scan the table. Error JSON:", JSON.stringify(err));
                        callback(null,{'status':0,'ru':'Пользователь не найден.'});
                        return 0;
                    } else {
                        //
                        LOG.printObject("Scan succeeded.");
                        if(data.Count < 1 ){
                            LOG.printObject("Nothing found.");
                            callback(null,{'status':0,'ru':'Неправильный логин или пароль'});
                            return 0;
                        }
                        var userData  = data.Items[0];

                        var loginIN = userData.login;
                        var phoneIN = userData.phone;
                        var uid     = userData.uid;
                        var userInfo     = userData.info;
                        var displayName     = userData.displayName;
                        var objectForResult = {'info':userInfo,'displayName':displayName,'user':loginIN};

                        CONFIRM.createSmsSignInForSystem( uid, {
                          'device'  : device,
                          'did'     : id,
                          'ip'      : CONNECT.getIp()
                        }, function (errCodeData,addCodeData) {
                          var token   = addCodeData['id'];
                            objectForResult['token'] = token;
                            objectForResult['status'] = 1;
                          var smsText = "Код - " + addCodeData.code;
                          CONNECT.sendSms( smsText , phoneIN, 'sign', 0 );
                          callback(null,objectForResult);
                        });
                        return 0;
                    }
                }
            }

        } else if (DATA.type == 'signInByAnonim') {//code user token

            context.callbackWaitsForEmptyEventLoop = false;
            createAnonymUserFunction();
            function createAnonymUserFunction () {
                USER.createAnonymUser ( function (err,data) {
                  LOG.printObject('createAnonymUser started NULLED 0');
                  var uid     = data['id'],
                      token   = data['token'];
                  if(!err){
                    let additionalClaims = {'type':'?','token':token};
                        additionalClaims[token] = true;
                    ACCESS.createCustomToken ( uid,additionalClaims, function(err,ftoken) {
                      if(!err) {
                        DINAMO.update (
                            {
                                'table' :'connect-user',
                                'key'   : {"id":uid},
                                'set'   : "set #f = :f",
                                'keys'  : {"#f":'ftoken'},
                                'vals'  : {":f": ftoken},
                            }
                        );
                        LOG.printObject('return success',{'status':1,'fkey':ftoken,'uid':uid,'token':token} );
                        callback(null,{'status':1,'fkey':ftoken,'uid':uid,'token':token} );
                      }else {
                        LOG.printObject ( 'return error' , {'status':0,'error':err} );
                        callback ( null , {'status':0,'error':err} );
                      }
                    });
                  }
                } );
            }
            //context.succeed({'status':0});
        } else if (DATA.type == 'checkCode') {//code user token
            if ( typeof(DATA.codeType) != 'undefined' &&  typeof(DATA.code) != 'undefined' &&  typeof(DATA.token) != 'undefined' &&  typeof(DATA.user) != 'undefined'){
                var code, token, login, anonymToken, typeMoveFromAnonym;
                code      = DATA.code,
                token     = DATA.token,
                login     = DATA.user,
                codeType  = DATA.codeType;//
                LOG.printObject( 'checkCode codeType' , codeType );
                USER.getByLoginIndex ({'login':login},onScanForCheckCode);

                function onScanForCheckCode (err, data) {
                    if (!err && data.Count > 0) {
                        var userData  = data.Items[0];
                        var myToken   = DATA.token;

                        var loginIN   = userData.login,
                            phoneIN   = userData.phone,
                            idIn      = userData.uid,
                            funcName  = 'getSignInSmsToken',
                            objForConfirm = {
                              'token'   : myToken,
                              'code'    : code,
                              'expired' :CONNECT.getTime(),
                              'status'  : 0
                            };
                        if(codeType == 'signup')
                          funcName  = 'getSignUpSmsToken';

                        LOG.printObject('== funcName',funcName);
                        CONFIRM[funcName](idIn,objForConfirm,function(errGetCode,dataGetCode){
                            LOG.printObject('errGetCode',errGetCode);
                            LOG.printObject('dataGetCode',dataGetCode);

                          if(!errGetCode && dataGetCode.Count > 0){
                                var uid = idIn;
                                var additionalClaims = {
                                    service : false,
                                    login   : loginIN,
                                    phone   : phoneIN,
                                    token   : token,
                                    type    : '@',
                                };
                                    additionalClaims[token] = true;
                                ACCESS.createCustomToken ( uid, additionalClaims , function (err,customToken) {
                                  LOG.printObject ( 'createCustomToken err' ,  err  );
                                  LOG.printObject ( 'createCustomToken customToken' , customToken );
                                  if(!err) {
                                    userData.ftoken = customToken;
                                    // DINAMO.update(
                                    //     {
                                    //         'table':'connect-user',
                                    //         'key': {"id":userData.id},
                                    //         'set' : "set #d = :d,#f = :f",
                                    //         'keys' : {"#d":"device","#f":'ftoken'},
                                    //         'vals' : {":d": deviceIN, ":f": userData.ftoken},
                                    //     }
                                    // );
                                      CONFIRM.updateToken(uid,myToken,{
                                        'status'      : 5,
                                        'value'       : customToken
                                      },function(errUpdateToken,dataUpdateToken){
                                        LOG.printObject ( 'updateToken errUpdateToken' ,  errUpdateToken  );
                                        LOG.printObject ( 'updateToken dataUpdateToken' , dataUpdateToken );

                                        if(!errUpdateToken){
                                          if(
                                            typeof(DATA.aToken) == 'string' &&
                                            (typeof(DATA.aUid)   == 'string'    && typeof(DATA.aToken)   == 'string')
                                          ) {
                                            // if need move data from anonym to this user
                                            var userSignedId    = userData.id,
                                                userAnonymToken = DATA.aToken,
                                                userAnonymId    = DATA.aUid;
                                            if (
                                              typeof(DATA.aType)  != 'undefined' && DATA.aType == 1
                                            ) {
                                              USER.passAnonimDataToUid ( userAnonymId, userSignedId, function(err) {
                                                context.succeed({'status':1,'fkey':userData.ftoken,'moved':1});
                                              });

                                            } else {
                                              USER.removeUser(userAnonymId,function(err){
                                                LOG.printObject('err removeUser',err);
                                                context.succeed({'status':1,'fkey':userData.ftoken,'moved':0});
                                              });
                                            }

                                          } else {
                                            context.succeed( { 'status':1,'fkey':userData.ftoken,'moved': 0 });
                                          }
                                        }
                                      });


                                  }else {
                                    callback(null,{'error firebase':err});
                                  }
                                });
                          }else {
                            callback(null,{'status':0,'text':'Токен уже использован'});
                            return 0;
                          }
                        });

                        // if(typeof(userData.device) != 'undefined' && typeof(userData.device[token]) != 'undefined' ) {
                        //     var deviceIN = userData.device;
                        //     if(typeof(deviceIN[token].status) == 'undefined' || deviceIN[token].status == 1){
                        //         callback(null,{'status':0,'text':'Токен уже использован'});
                        //         return 0;
                        //     }
                        //     deviceIN[token].status = 1;
                        //     deviceIN[token].auth = new Date().getTime();
                        //
                        //     if( typeof(deviceIN[token]) != 'undefined' && typeof(deviceIN[token].created) != 'undefined') {
                        //         // если  есть токен и время создания токена
                        //
                        //         //время прошедшение с создание токена
                        //         var passedTime = (deviceIN[token].auth - deviceIN[token].created)/1000;
                        //         if( !(passedTime < 3000) ) {
                        //             // если прошле более 5 минут то есть 300 секунд то удаляем авторизацию и ключ
                        //             delete deviceIN[token];
                        //             callback(null,{'status':0,'ru':'Код просрочен'});
                        //             return 0;
                        //         }
                        //         if ( code == deviceIN[token].code ) {
                        //             var uid = idIn;
                        //             var additionalClaims = {
                        //                 service : false,
                        //                 login   : loginIN,
                        //                 phone   : phoneIN
                        //             };
                        //             ACCESS.createCustomToken ( uid,additionalClaims, function(err,customToken) {
                        //               if(!err) {
                        //                 userData.ftoken = customToken;
                        //                 DINAMO.update(
                        //                     {
                        //                         'table':'connect-user',
                        //                         'key': {"id":userData.id},
                        //                         'set' : "set #d = :d,#f = :f",
                        //                         'keys' : {"#d":"device","#f":'ftoken'},
                        //                         'vals' : {":d": deviceIN, ":f": userData.ftoken},
                        //                     }
                        //                 );
                        //                   if(
                        //                     typeof(DATA.aToken) == 'string' &&
                        //                     (typeof(DATA.aUid)   == 'string'    && typeof(DATA.aToken)   == 'string')
                        //                   ) {
                        //                     // if need move data from anonym to this user
                        //                     var userSignedId    = userData.id,
                        //                         userAnonymToken = DATA.aToken,
                        //                         userAnonymId    = DATA.aUid;
                        //                     if (
                        //                       typeof(DATA.aType)  != 'undefined' && DATA.aType == 1
                        //                     ) {
                        //                       USER.passAnonimDataToUid ( userAnonymId, userSignedId, function(err) {
                        //                         context.succeed({'status':1,'fkey':userData.ftoken,'moved':1});
                        //                       });
                        //
                        //                     } else {
                        //                       USER.removeUser(userAnonymId,function(err){
                        //                         LOG.printObject('err removeUser',err);
                        //                         context.succeed({'status':1,'fkey':userData.ftoken,'moved':0});
                        //                       });
                        //                     }
                        //
                        //                   } else {
                        //                     context.succeed( { 'status':1,'fkey':userData.ftoken,'moved': 0 });
                        //                   }
                        //               }else {
                        //                 callback(null,{'error firebase':err});
                        //               }
                        //             });
                        //         }
                        //         else
                        //           callback(null,{'status':0,'ru':'Ключ не найден.'});
                        //
                        //     }
                        //
                        //
                        // }

                    }
                    // callback(null,{'status':0,'ru':'Ключ не найден'});
                    // return 0;
                }

            }


        } else if (DATA.type == 'reSendSms') { // type = reSendSms && user && token

            if( typeof(DATA.token) != 'undefined' && typeof(DATA.user) != 'undefined') {
                DINAMO.scan(
                    {
                        'table':'connect-user',
                        'mask' : "#login = :login",
                        'keys' : {"#login": "login"},
                        'vals' : {":login":DATA.user}

                    },onScanForReSendSms
                );

                function onScanForReSendSms(err, data) {
                    if (!err && data.Count > 0) { // если пользователь найден
                        var userData  = data.Items[0];
                        var myToken = DATA.token;
                        var phone = userData.phone;
                        var deviceIN = userData.device;
                        var nowTime;
                        ClearDeadTokenByDeviceField(userData);
                        if( typeof(deviceIN[myToken]) != 'undefined' && typeof(deviceIN[myToken].status) != 'undefined' && deviceIN[myToken].status != 1){
                            //если токен есть и не использованный

                            nowTime = new Date().getTime();
                            var token = CONNECT.getRandomKeyByUuid();
                            var smsCode = CONNECT.getRandomKeyWithChars(4,"1234567890");
                            var expiredSmsCodeTime = deviceIN[myToken].created + 300000;
                            var deadSmsCodeTime = deviceIN[myToken].created + 900000;

                            // добавить проверку по устройству CHANGE ADD +
                            // добавить проверку по истечении времени +
                            // добавить дед тайм +
                            // добавить очистку +

                            //Проверка устройства
                            var id, device, ua;
                            if( typeof(event.params.header['User-Agent']) != 'undefined')
                            { device = 'browser'; id = event.params.header['User-Agent']; }
                            else if( typeof(DATA.androidCode) != 'undefined')
                            { device = 'android'; id = DATA.androidCode; }
                            else if( typeof(DATA.iosCode) != 'undefined')
                            { device = 'ios';     id = DATA.iosCode; }

                            if(expiredSmsCodeTime <= nowTime && nowTime <= deadSmsCodeTime && deviceIN[myToken].did == id  && deviceIN[myToken].name == device){
                                deviceIN[myToken].code = smsCode;
                                deviceIN[myToken].created = nowTime;
                                var smsText = "Код - "+smsCode;
                                CONNECT.sendSms(smsText,phone,'sign',0);

                                DINAMO.update(
                                    {
                                        'table':'connect-user',
                                        'key': {"id":userData.id},
                                        'set' : "set #d = :d",
                                        'keys' : {"#d":"device"},
                                        'vals' : {":d": deviceIN}

                                    }
                                );
                                callback(null,{'status':1});
                                return 0;
                            }
                            callback(null,{'status':0,'ru':'Не действительный токен'});
                        }
                    }
                    callback(null,{'status':0,'ru':'Не действительный токен'});
                }
                return 0;
            }

        }else if (DATA.type == 'signup') { //login, pswd, phone
            // нет защиты !!!
            if( typeof(DATA.login) != 'undefined' && typeof(DATA.pswd) != 'undefined' && typeof(DATA.phone) != 'undefined'){
                // DINAMO.scan(
                //     {
                //         'table':'connect-user',
                //         'mask' : "#login = :login",
                //         'keys' : {"#login": "login"},
                //         'vals' : {":login":DATA.login}
                //
                //     },onScanCheckIssetUserByLogin
                // );
                USER.getByLoginIndex( { 'login':DATA.login} ,onScanCheckIssetUserByLogin);
                function onScanCheckIssetUserByLogin(errLoginIndex, dataLoginIndex) {
                    LOG.printObject('onScanCheckIssetUserByLogin errLoginIndex' , errLoginIndex );
                    LOG.printObject('onScanCheckIssetUserByLogin dataLoginIndex', dataLoginIndex );
                    if (!errLoginIndex && dataLoginIndex.Count < 1) {
                        // нет пользователя с таким логином
                        DATA.phone = '7' + DATA.phone; //CHANGE
                        USER.getByPhoneIndex( { 'phone' : DATA.phone },onScanCheckIssetUserByPhone);
                        function onScanCheckIssetUserByPhone (errPhoneIndex, dataPhoneIndex) {
                            LOG.printObject('onScanCheckIssetUserByPhone errPhoneIndex' , errPhoneIndex );
                            LOG.printObject('onScanCheckIssetUserByPhone dataPhoneIndex', dataPhoneIndex );
                            if (!errPhoneIndex && dataPhoneIndex.Count < 1) {
                                // нет пользователя с таким логином и паролем все ок
                                // верифицировать устройство +
                                // отправить смс
                                // добавить пользователя +
                                // проверка добавление !!!

                                //DOUBLE CODE 3
                                var id, device, ua, user = DATA.user, pswd = DATA.pswd;
                                if( typeof(event.params.header['User-Agent']) != 'undefined')
                                { device = 'browser'; id = event.params.header['User-Agent']; }
                                else if( typeof(DATA.androidCode) != 'undefined')
                                { device = 'android'; id = DATA.androidCode; }
                                else if( typeof(DATA.iosCode) != 'undefined')
                                { device = 'ios';     id = DATA.iosCode; }

                                var newUserId = CONNECT.getRandomKeyByUuid();
                                var objForAddUserMethod = { 'uid' : newUserId, 'owner': '@system', 'login': DATA.login, 'phone': DATA.phone};
                                if(typeof(DATA.firstname) == 'string')
                                  DATA.firstname = DATA.firstname.trim();
                                if(typeof(DATA.lastname)  == 'string')
                                  DATA.lastname  = DATA.lastname.trim();
                                if( DATA.firstname.length>0 )
                                  objForAddUserMethod['firstname']  = DATA.firstname;
                                if( DATA.lastname.length>0 )
                                  objForAddUserMethod['lastname']   = DATA.lastname;
                                if( typeof(DATA.lang)     == 'string'     )
                                  objForAddUserMethod['lang']       = DATA.lang;
                                if( typeof(DATA.country)  == 'string'  )
                                  objForAddUserMethod['country']    = DATA.country;

                                objForAddUserMethod['status'] = 3;

                                USER.addUser(objForAddUserMethod,function(errAddUser,dataAddUser){
                                  CONFIRM.createSmsSignUpForSystem(newUserId,{
                                    'device'  : device,
                                    'did'     : id
                                  },function(errCodeData,addCodeData){
                                    var token   = addCodeData['id'];
                                    var smsText = "Код - " + addCodeData.code;
                                    CONNECT.sendSms( smsText , DATA.phone , 'sign',0);
                                    callback(null,{'status':1,'token':token,'user':DATA.login});
                                  });
                                });
                                return 0;

                            }else callback(null,{'status':0,'ru':'Пользователь с таким номером телефона сущетсвует существует'});
                        }
                    }else callback(null,{'status':0,'ru':'Пользователь с таким логином сущетсвует'});
                }
            }
            return 0;
        }else if ( DATA.type == 'checkToken' ) { // login, token
            // нет защиты !!!



            // add check token
            /* add get user public or now, and empty page
              - get public or now
              - get start messages
              - get rules for allow anonim chat ot know
              - get workes an strudent
              - get subcriber or now
              - get you role
              - get rule for action api
              - get service or now

              add messages chat

            */
            // add messages block + story
            // add open chat

            // add goods block
            if( typeof(DATA.login) != 'undefined' && typeof(DATA.token) != 'undefined'){
                USER.getByLoginIndex( { 'login':DATA.login} ,onScanCheckToken);
                function onScanCheckToken(err, data) {
                    if (!err && data.Count > 0) {
                        var userData  = data.Items[0];

                        // double code 4 CHANGE
                        var id, device, ua;
                        if( typeof(event.params.header['User-Agent']) != 'undefined')
                        { device = 'browser'; id = event.params.header['User-Agent']; }
                        else if( typeof(DATA.androidCode) != 'undefined')
                        { device = 'android'; id = DATA.androidCode; }
                        else if( typeof(DATA.iosCode) != 'undefined')
                        { device = 'ios';     id = DATA.iosCode; }
                        else { device = 'unknown';     id = 'unknown'; }

                        if(
                            typeof(userData.device) != 'undefined' &&
                            typeof(userData.device[DATA.token]) != 'undefined' &&
                            typeof(userData.device[DATA.token].status) != 'undefined' &&
                            typeof(userData.device[DATA.token].did) != 'undefined' &&
                            typeof(userData.device[DATA.token].name) != 'undefined' &&
                            userData.device[DATA.token].status == 1 &&
                            userData.device[DATA.token].did == id &&
                            userData.device[DATA.token].name == device &&
                            device != 'unknown'
                        ){
                            callback(null,{'status':1});
                            return 0;
                        }
                    }
                    callback(null,{'status':0,'ru':'Токен не действительный'});
                }
            }

            return 0;
        }

    }

};
