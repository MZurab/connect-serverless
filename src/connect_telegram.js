exports.handler = (event, context, callback) => {
    //implement
    const CONNECT     = require('./input/connect');
    const LOG         = require('ramman-z-log');
    //var DINAMO      = require("./input/aws/dinamo");
    //var ACCESS      = require("./input/connect_access/access");
    // var CONFIRM     = require("./input/connect_access/confirm");
    // var USER        = require("./input/connect_users/users");
    // var CATEGORY    = require("./input/connect_category/category");
    // var CHAT        = require("./input/connect_chat/chat");
    // var USER        = require("./input/connect_users/users");
    // var DICTIONARY    = require("./input/connect_dictionary/dictionary");
    // var PAGE      = require("./input/connect_page/page");
    // var FIREBASE  = require("./input/firebase/firebase");


    CONNECT.setHeader(event);
    var HEADER = CONNECT.getHeader(['*']);
    var DATA   = HEADER['data'];
    var TYPE   = HEADER['type'];



    const apiUID  = CONNECT.getUrlParam('uid');
    const params  = CONNECT.getQueryString();


    LOG.printObject('event',event);
    LOG.printObject('stringify event',JSON.stringify(event));
    LOG.printObject('stringify params',JSON.stringify(params));
    // var CATEGORY    = require("./input/connect_category/category");

    const TelegramBot = require('node-telegram-bot-api');

    LOG.printObject('TelegramBot',TelegramBot);
    // replace the value below with the Telegram token you receive from @BotFather
    const TOKEN = '467561005:AAF6s51ASX1VrcF0bK9JWkcpp5e1exfMiuk';

    const msgType = params['type'];


    // const options = {
    //   webHook: {
    //     port: 443,
    //     key: `ssl/domain/rammanNet/private.pem`,  // Path to file with PEM private key
    //     cert: `ssl/domain/rammanNet/concat.crt`  // Path to file with PEM certificate
    //   }
    // };
    // This URL must route to the port set above (i.e. 443)
    const url = 'https://ramman.net/api/app/telegram/botFirst';
    const bot = new TelegramBot(TOKEN, {polling: false});




    if( msgType == 'inputMessageFromTelegramApp') {
        const msg = DATA.message;
        const msgText = msg.text;
        var msgForAnswer = '';
        if(msgText.match('Войти') !== null) {
          var matchArray = msgText.match(/([0-9a-zA-Z]+)/ig);
          if(matchArray.length == 2) {
              var login = matchArray[0];
              var pswd = matchArray[1];
              var urlForAddTelegram = 'https://lk.ramman.net/api/device/telegram.php?phone='+login+'&pswd='+pswd+'&telegram_id='+msg.chat.id+'&type=addId';
              CONNECT.getUrlHttpsRequest(urlForAddTelegram,
                (answer)=>{
                  LOG.printObject('getUrlHttpsRequest answer',answer);
                  var answerJson = JSON.parse(answer);
                  if(answerJson['success'] == 1) {
                    msgForAnswer = 'Вы успешно вошли.\nВаш логин - '+login+"\nВаш пароль - "+pswd;

                  } else {
                    msgForAnswer = 'Ошибка! Телефон или пароль не верны.';
                  }
                  bot.sendMessage(msg.chat.id, msgForAnswer);

              });
              // pass to server for check user pswd and login
              // msgForAnswer = 'Вы успешно вошли.\nВаш логин - '+login+"\nВаш пароль - "+pswd;
          }
        }else {
          msgForAnswer = 'Комманда не распознана.';
          bot.sendMessage(msg.chat.id, msgForAnswer);
        }
        // bot.sendMessage(msg.from.id, 'I am alive! for from');

    } else if (msgType == 'createMsg') {
        const telegram_destinationId = params['telegram_destinationId'];
        const telegram_textMsg = params['telegram_textMsg'];
        let destinationIds = telegram_destinationId.split(',');
        for (var destinationId in destinationIds) {
            let thisDestinationId = destinationIds[destinationId];
            var r = bot.sendMessage(thisDestinationId, telegram_textMsg);
            LOG.printObject('thisDestinationId 1, telegram_textMsg 2', thisDestinationId, telegram_textMsg,r);
        }

    }
    // This informs the Telegram servers of the new webhook.
    // bot.setWebHook(`${url}/bot${TOKEN}`, {
    //   certificate: options.webHook.cert,
    // });


    // Just to ping! curl --data "url=https://ramman.net/api/app/telegram/botFirst" "https://api.telegram.org/bot467561005:AAF6s51ASX1VrcF0bK9JWkcpp5e1exfMiuk/setWebhook"
    // bot.on('message', function onMessage(msg) {
    //   LOG.printObject('bot.on message  msg',msg);
    //   bot.sendMessage(msg.chat.id, 'I am alive!');
    // });

    LOG.printObject('END bot');
}


/*
    https://lk.ramman.net/api/device/index.php?device_type=3&phone=" + phoneUrl + "&pswd=" + pswdUrl + "&token=" + tokenUrl + "&name=" + nameUrl + "&type=users_checkAccess&v=1


    https://lk.ramman.net/api/device/telegram.php?device_type=3&phone=79287377782&pswd=12345678&telegram_id=123456&type=addId
    "update_id": 809681869,
        "message": {
            "message_id": 17,
            "from": {
                "id": 57219438,
                "is_bot": false,
                "first_name": "Zurab",
                "last_name": "Magomadov",
                "language_code": "ru-RU"
            },
            "chat": {
                "id": 57219438,
                "first_name": "Zurab",
                "last_name": "Magomadov",
                "type": "private"
            },
            "date": 1506421287,
            "text": "5"
        }
*/
