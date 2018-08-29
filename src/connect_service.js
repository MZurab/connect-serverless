exports.handler = (event, context, callback) => {
  // TODO implement
  const CONNECT = require('./input/connect');
  const LOG     = require('ramman-z-log');
  const DINAMO  = require("./input/aws/dynamo/dynamo");
  const ACCESS  = require("./input/connect_access/access");
  const SERVICE = require("./input/connect_service/service");

  LOG.printObject("Start");
  var DATA ={};
  if(
    // event['context']['http-method']=='GET' &&
    // event['context']['resource-path'] == '/api/service/market/{service_id}/search' &&
    typeof(event['params']['path']['action'])     == 'string' &&
    typeof(event['params']['path']['service_id']) == 'string'
  ) {
      var DATA,GET,POST,TYPE,ACTION,UID,PATH,JSON;
      PATH    = event['params']['path'];
      UID     = PATH["service_id"];
      ACTION  = PATH["action"];
      if( event['context']['http-method']=='GET' ) {
        TYPE  = "GET",
        GET   = event['params']["querystring"],
        DATA  = GET;
      } else {
        TYPE  = "JSON",
        JSON  = event["body-json"],
        DATA  = JSON;
      }
  } else {
      callback(null,{'status':0,'ru':'Нет входных данных.'});
      return 0;
  }


  function getPageSign (iNuid,iNinfo) {
    let connect_service_site  = iNinfo['site'];
    let connect_uid           = iNuid;
    if( typeof(DATA['callback_path']) != 'string' )
      DATA['callback_path'] = '';
    let connect_callback_path = DATA['callback_path'];
    var page = '<html>\
    <head>\
        <meta charset="UTF-8">\
        <title>Войти в сервис..</title>\
        <script type="text/javascript">\
            ' + CONNECT.addVarsToPage(
              {
                'S_UID'           : connect_uid,
                'S_CALLBACK_PATH' : connect_callback_path,
                'S_SITE'          : connect_service_site,
                'S_PSWD'          : DATA.pswd,
                'S_KEY'           : DATA.key,
              }
            ) +'\
        </script>\
        <meta name="viewport" content="width=device-width, initial-scale=1.0">\
        <link rel="stylesheet" href="https://cdn.ramman.net/css/full/style2.css">\
        <link rel="stylesheet" href="https://cdn.ramman.net/css/full/styleForService.css">\
        <script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js"></script>\
        <link href="https://fonts.googleapis.com/css?family=Open+Sans" rel="stylesheet">\
        <script type="text/javascript" src="https://cdn.ramman.net/js/min/jquery.countdown.min.js"></script>\
        <script type="text/javascript" src="https://cdn.ramman.net/js/full/sweetalert2.js"></script>\
        <link rel="stylesheet" href="https://cdn.ramman.net/css/min/sweetalert2.min.css">\
        <script src="https://www.gstatic.com/firebasejs/3.6.10/firebase.js"></script>\
        <script type="text/javascript" src="https://cdn.ramman.net/js/full/connect_common.js"></script>\
        <script type="text/javascript" src="https://cdn.ramman.net/js/full/servises/users.js"></script>\
    </head>\
    <body>\
        <div id="window">\
            <div id="container">\
                <div class="logo_box_service">\
                    <img class="logo_file_service" src="https://cdn.ramman.net/users/'+connect_uid+'/img/logo.png">\
                </div>\
                <div class="view">\
                    <form class="formSignIn" onsubmit="return Connect_sendForm(\'.formSignIn\')" style="">\
                        <input type="text" name="user" class="log_input" placeholder="Телефон">\
                        <input type="password" name="pswd" class="log_pswd" placeholder="Пароль">\
                        <input type="hidden" name="type" value="signin">\
                        <input type="submit" name="t" class="log_submit" value="Вход">\
                    </form>\
                    <form class="formSmsCode" onsubmit="return Connect_checkSmsCodeForService(this)" style="display:none">\
                        <div class="informBlock">На ваш телефон отправленно смс сообщение с кодом, введите его</div>\
                        <div class="smsCode">\
                            <div class="LastTimeForExpireSms">\
                                <a href="#" class="">Отправить заново</a>\
                            </div>\
                            <div class="reSendSms" onclick="return Connect_reSendSms()">Отправить заново</div>\
                            <input type="text" name="code" class="input_smsCode" placeholder="Код">\
                        </div>\
                        <input type="submit" name="t" class="log_submit" value="Продолжить">\
                    </form>\
                    <form class="formSignUp" onsubmit="return Connect_signUpByUserAndPswd(this)" style="display: none;">\
                        <input type="text" name="login" class="log_input" placeholder="Логин">\
                        <input type="text" name="phone" class="log_input" placeholder="Телефон">\
                        <input type="password" name="pswd" class="log_pswd" placeholder="Пароль">\
                        <input type="hidden" name="type" value="signup">\
                        <input type="submit" name="t" class="log_submit" value="Регистрация">\
                    </form>\
                </div>\
                <div class="view signBlock">\
                    <div class="signUpBlock signBlock" style="display: block;">\
                        Еще нет аккаунта? <a href="#" class="signup_link sign_link">Зарегистрируйтесь</a>\
                    </div>\
                    <div class="signInBlock signBlock" style="display: none;">\
                        Есть аккаунт? <a href="#" class="signin_link sign_link">Вход</a>\
                    </div>\
                    <div class="footer">\
                        <img src="https://cdn.ramman.net/images/icons/logo/loadingLogo_50_50.png"><span>&copy; Copyright 2016-2017</span>\
                    </div>\
                </div>\
            </div>\
        </div>\
        <script type="text/javascript" src="https://cdn.ramman.net/js/full/signPage.js"></script>\
    </body>\
</html>';
    context.succeed ( page );
  }

  function getPageLoading (iNuid,iNtoken,iNinfo) {
    let connect_service_site  = iNinfo['site'];
    let connect_uid           = iNuid;
    if( typeof(DATA['callback_path']) != 'string' )
      DATA['callback_path'] = '';

    let connect_callback_path = DATA['callback_path'];
    var page  = '<html>\
    <head>\
        <meta charset="UTF-8">\
        <title>Загрузка... ' + iNtoken + ' ' + connect_service_site + '</title>\
        <meta name="viewport" content="width=device-width, initial-scale=1.0">\
        <script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js"></script>\
        <link href="https://fonts.googleapis.com/css?family=Open+Sans" rel="stylesheet">\
        <link rel="stylesheet" href="https://cdn.ramman.net/css/full/base.css">\
        <link rel="stylesheet" href="https://cdn.ramman.net/css/full/styleForService.css">\
        <script src="https://www.gstatic.com/firebasejs/3.6.10/firebase.js"></script>\
        <script type="text/javascript" src="https://cdn.ramman.net/js/full/connect_common.js"></script>\
        <script type="text/javascript" src="https://cdn.ramman.net/js/full/servises/users.js"></script>\
        <script type="text/javascript">\
            ' + CONNECT.addVarsToPage(
              {
                'S_UID'           : connect_uid,
                'S_TOKEN'         : iNtoken,
                'S_CALLBACK_PATH' : connect_callback_path,
                'S_SITE'          : connect_service_site,
                'S_PSWD'          : DATA.pswd,
                'S_KEY'           : DATA.key,
              }
            ) +'\
        </script>\
        <script type="text/javascript" src="https://cdn.ramman.net/js/full/servises/starterForLoadingPage.js"></script>\
    </head>\
    <body>\
        <div class="loader">\
            <div class="logoServive"><img src="https://cdn.ramman.net/users/'+iNuid+'/img/logo.png"></div>\
            <div class="textEnter">Вход в сервис.</div>\
            <img src="https://cdn.ramman.net/images/gif/loaderForService.gif">\
            <div class="footer">\
                <img src="https://cdn.ramman.net/images/icons/logo/loadingLogo_50_50.png"><span>&copy; Copyright 2016-2017</span>\
            </div>\
        </div>\
    </body>\
</html>';
    context.succeed ( page);
  }


  if ( typeof(DATA) != 'undefined' && typeof(ACTION) != 'undefined') {
    DATA.verification     = 'api';// CHANGE AFTER
    if(DATA.verification == 'api') {
      if(
          typeof(UID)                         != 'undefined'  &&
          typeof(DATA.key)                    != 'undefined'  &&
          typeof(DATA.pswd)                   != 'undefined'  &&
          typeof(event.context)               != 'undefined'  &&
          typeof(event.context['source-ip'])  != 'undefined'
        ) {
          // LOG.printObject('verification == api - ');
          var inData    = {};
            inData.key  = DATA.key;
            inData.code = 'accessBySite';
            inData.to   = '@';
            inData.pswd = DATA.pswd;
            inData.ip   = event.context['source-ip'];
            inData.uid  = UID;
            ACCESS.getAccessDataForApi( inData,controleHub );
        }
    }
    function controleHub (iN1,iNinfo) {
      if (ACTION == 'userToken') {
        // add user token to service token
        if( typeof(DATA.utoken) == 'string' ) {
          LOG.printObject('addUserTokenToServiceToken utoken',1);
          SERVICE.addDataToServiceToken(DATA.stoken,{'utoken':DATA.utoken},UID,function(err,token){
            callback (null,{'status':1} );
          });
        } else {
          LOG.printObject('addUserTokenToServiceToken utoken',0);
          callback (null, {'status':0} );
        }
      } else if (ACTION == 'pageServiceChecker') {
        SERVICE.createServiceToken(UID,function(err,token){
          getPageLoading(UID,token,iNinfo);
        });
      } else if (ACTION == 'pageServiceSign') {
        getPageSign(UID,iNinfo);
      }
    }
  }

  function getToken (iNuid) {
    var permision = ACCESS.getActionPermission("write","base","token");
    if (permision == 'full') {
      var token = SERVICE.createServiceToken(iNuid,function(err,token) {
        if( typeof(token) == 'string') {
          callback(null,{'status':1,'token':token});
        } else {
          callback(null,{'status':0});
        }
      });
    }
  }
  function checkToken (iNuid,iNtoken) {

  }
  function checkUserToken () {

  }
  function checkAccessBySite () {

  }

}
