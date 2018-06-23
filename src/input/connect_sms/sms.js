var DINAMO  = require("./../aws/dinamo");
var CONNECT = require('../connect');
const LOG   = require('ramman-z-log');

const tableSms = "connect-sms";
const _ = {};

const request = require("request");

// getSms
// createSms
// updateSms

// sendSms
// sendMegafonSms
// sendTele2Sms
// clean


function isCyrillic (iNstring) {
  return /[а-я]/i.test(iNstring)
}
function getSizeOfSms (iNstring) {
  var smsLength = iNstring.length;
  var beforeFirst = 160, afterFirst = 153, divider;
  if (isCyrillic(iNstring)) {
    beforeFirst = 70, afterFirst = 67;
  }
  if (smsLength > beforeFirst) {
    // if more one sms
    divider = afterFirst;
  } else {
    divider = beforeFirst;
  }
  return Math.ceil(smsLength/divider);
}
_['getSizeOfSms'] = getSizeOfSms;

function getSms (iNownerUid, iNdata, iNfunction ) {
  /*
    @discr
      get sms
    @example
      getSms ('aaaa-bbbb-cccc-dddd', {'uid':'aaaa-bbbb-cccc-dddd'}, (err,data) => {} )
    @inputs
      @required
        iNownerUid -> string
      @optioanal
        iNdata -> object
          @required
            uid -> string
          @optinal
            status    -> number
            type      -> string
            key       -> string
            currency  -> string
            by        -> string
        iNfunction
    @algoritm
  */
  if (
    typeof(iNownerUid) != 'string' ||
    typeof(iNdata) != 'object'
  ) return false;

  var
      // add init date
      objecrForQuery = DINAMO.addByMask ( { 'owner' : iNownerUid }, "owner" , { "table" : tableSms } , "string" ),
      by = iNdata['by']||'default';
      index          = '';


  if ( typeof(iNdata['by']) == 'string' ) {
    switch (iNdata['by']) {
      case "from":
        if( typeof(iNdata['from']) != 'string') break;
        index = 'owner-from-index'; objecrForQuery['index'] = index;
        objecrForQuery = DINAMO.addByMask( iNdata, "from", objecrForQuery, "string" );
      break;

      case "content":
        if( typeof(iNdata['content']) != 'string') break;
        index = 'owner-content-index'; objecrForQuery['index'] = index;
        objecrForQuery = DINAMO.addByMask(iNdata,"content",objecrForQuery,"string");
      break;

      case "phone":
        if( typeof(iNdata['phone']) != 'number') break;
        index = 'owner-phone-index-copy'; objecrForQuery['index'] = index;
        objecrForQuery = DINAMO.addByMask(iNdata,"phone",objecrForQuery,"number");
      break;

      case "uid":
        if( typeof(iNdata['uid']) != 'string') break;
        index = 'owner-uid-index'; objecrForQuery['index'] = index;
        objecrForQuery = DINAMO.addByMask(iNdata,"uid",objecrForQuery,"string");
      break;

      case "key":
        if( typeof(iNdata['key']) != 'string') break;
        index = 'owner-key-index'; objecrForQuery['index'] = index;
        objecrForQuery = DINAMO.addByMask(iNdata,"key",objecrForQuery,"string");
      break;

      default: // default
        if( typeof(iNdata['id']) != 'string') break;
        // index = 'owner-id-index'; objecrForQuery['index'] = index;
        objecrForQuery = DINAMO.addByMask( iNdata, "id", objecrForQuery, "string");
      break;
    }
  }
  // add uid
  if ( typeof( iNdata['uid'] ) == 'string' && index != 'owner-uid-index' )
    objecrForQuery = DINAMO.addByMaskFilter(iNdata, "uid", objecrForQuery, "string");


  // add content
  if ( typeof( iNdata['content'] ) == 'string' && index != 'owner-content-index' )
    objecrForQuery = DINAMO.addByMaskFilter(iNdata, "content", objecrForQuery, "string");

  // add from
  if ( typeof( iNdata['from'] ) == 'string' && index != 'owner-from-index')
    objecrForQuery = DINAMO.addByMaskFilter(iNdata,"from",objecrForQuery,"string");

  // add phone
  if ( typeof( iNdata['phone'] ) == 'number' && index != 'owner-phone-index-copy')
    objecrForQuery = DINAMO.addByMaskFilter(iNdata,"phone",objecrForQuery,"number");

  // add operator
  if ( typeof( iNdata['operator'] ) == 'string' )
    objecrForQuery = DINAMO.addByMaskFilter(iNdata,"operator",objecrForQuery,"string");



  LOG.printObject('getSms objecrForQuery',objecrForQuery);
  DINAMO.query(objecrForQuery,iNfunction);
}
_['getSms'] = getSms;


function getSystemSmsFromDb ( iNuid, iNfunction ) {
  getSms( '@system', { 'uid' : iNuid, 'type' : 'real', 'by' : 'default' } , iNfunction );
}
_['getSystemSmsFromDb'] = getSystemSmsFromDb;


function addSmsToDb (iNownerUid, iNdata,iNfunction) {
  /*
    @inputs
      @required
        iNownerUid -> string
        iNdata -> function
          @required
            phone     -> number
            content   -> string
          @optional
            key       -> string
            id        -> string
            operator  -> string
            uid       -> string
            time      -> number

            status    -> string
            currency  -> string
            answer    -> string
            error     -> string
            cost      -> number
            sender     -> string

            length    -> number
            size      -> number

        @optioanal
          iNfunction -> function
    @example
        SMS.addSmsToDb (
          '@owner',
          {
            'operator'  : 'tele2',
            'phone'     : '79287377782',
            'content'   : 'Тест2',
            'cost'      : 8,
            'key'       : 'testKey',
            'uid'       : 'testUid',
            'from'      : 'testFrom',
          },
          (err,data) => {
              LOG.printObject('SMS.addSmsToDb err', err);
              LOG.printObject('SMS.addSmsToDb data', data);
          }
        );
  */
  var
      dataForDbInsert = {'owner':iNownerUid};

  // check
  if (
    (
      typeof iNdata['phone']   != 'string' && typeof iNdata['phone']   != 'number'
    ) ||
    typeof iNdata['content'] != 'string' ||
    typeof iNdata['uid'] != 'string'
  ) return false;

  // if string to int
  iNdata['phone']   = parseInt(iNdata['phone']);
  dataForDbInsert['size']    = getSizeOfSms ( iNdata['content'] );
  dataForDbInsert['length']  = iNdata['content'].length;
  dataForDbInsert['uid'] = iNdata['uid'];

  // add id
  if ( typeof iNdata['id'] != 'string')  iNdata['id'] = CONNECT.getRandomKeyByUuid();
  dataForDbInsert['id'] = iNdata['id'];

  // add length
  // if ( typeof iNdata['length'] == 'number' )
  //   dataForDbInsert['length'] = iNdata['length'];

  // add cost
  if ( typeof iNdata['cost'] == 'number' )
    dataForDbInsert['cost'] = iNdata['cost'];

  // add size
  // if ( typeof iNdata['size'] == 'number' )
  //   dataForDbInsert['size'] = iNdata['size'];

  // add operator
  if ( typeof iNdata['operator'] == 'string' )
    dataForDbInsert['operator'] = iNdata['operator'];

  // add uid
  if ( typeof iNdata['uid'] == 'string' )
    dataForDbInsert['uid'] = iNdata['uid'];

  // add error
  if ( typeof iNdata['error'] == 'string' )
    dataForDbInsert['error'] = iNdata['error'];

  // add currency
  if ( typeof iNdata['currency'] == 'string' )
    dataForDbInsert['currency'] = iNdata['currency'];

  // add answer if string
  if ( typeof iNdata['answer'] == 'string' )
    dataForDbInsert['answer'] = iNdata['answer'];

  // add answer if object
  if ( typeof iNdata['answer'] == 'object' )
    dataForDbInsert['answer'] = JSON.stringify(iNdata['answer']);


  // add from
  if ( typeof iNdata['from'] == 'string' )
    dataForDbInsert['from'] = iNdata['from'];

  // add status
  if ( typeof iNdata['status'] == 'string' )
    dataForDbInsert['status'] = iNdata['status'];

  // add key
  if ( typeof iNdata['key'] == 'string' )
    dataForDbInsert['key'] = iNdata['key'];

  // add uid
  // if ( typeof iNdata['uid'] == 'string' )

  // add type
  if ( typeof iNdata['type'] != 'string')  iNdata['type'] = 'private';
  dataForDbInsert['type'] = iNdata['type'];

  dataForDbInsert['phone']    = iNdata['phone'];
  dataForDbInsert['content']  = iNdata['content'];

  // add time
  if ( typeof iNdata['time'] != 'number')  iNdata['time'] = CONNECT.getTime();
  dataForDbInsert['time'] = iNdata['time'];

  DINAMO.add( tableSms , dataForDbInsert , iNfunction );
}
_['addSmsToDb'] = addSmsToDb;


function updateSms (iNownerUid, iNdata, iNfunction) {
  /*
    @inputs
      @required
        iNownerUid    -> string
        iNdata        -> object
          @required
            id        -> string
          @optinal
            time      -> number
            content   -> string
            operator  -> string
            key       -> string
            phone     -> string
            uid       -> string
            status    -> string
            answer    -> string
      @optioanal
        iNfunction
    @algoritm
  */
  if (
    typeof(iNownerUid) != 'string' ||
    typeof(iNdata) != 'object' ||
    typeof(iNdata['id']) != 'string'
  ) return false;

  var
      objForUpdate = {"table":tableSms},
      objForLateConver = {};

      objForUpdate['key'] = {"owner":iNownerUid,"id":iNdata['id']};

  //add status
  if( typeof(iNdata ['status']) == 'string' )
    objForLateConver['status']  =  iNdata['status'];

  //add time
  if( typeof(iNdata ['time']) == 'number' )
    objForLateConver['time']  =  iNdata['time'];

  //add updated updatedTime
  if( typeof(iNdata ['updatedTime']) == 'number' )
    objForLateConver['updatedTime']  =  iNdata['updatedTime'];

  //add cost
  if( typeof(iNdata ['cost']) == 'number' )
    objForLateConver['cost']  =  iNdata['cost'];

  //add size
  if( typeof(iNdata ['size']) == 'number' )
    objForLateConver['size']  =  iNdata['size'];

  //add answer
  if( typeof(iNdata ['answer']) == 'string' )
    objForLateConver['answer']  =  iNdata['answer'];

  //add length
  if( typeof(iNdata ['length']) == 'number' )
    objForLateConver['length']  =  iNdata['length'];

  //add content
  if( typeof(iNdata ['content']) == 'string' )
    objForLateConver['content']  =  iNdata['content'];

  //add operator
  if( typeof(iNdata ['operator']) == 'string' )
    objForLateConver['operator']  =  iNdata['operator'];

  //add phone
  if( typeof(iNdata ['phone']) == 'string' )
    objForLateConver['phone']  =  iNdata['phone'];

  //add key
  if( typeof(iNdata ['key']) == 'string' )
    objForLateConver['key']  =  iNdata['key'];

  //add uid
  if( typeof(iNdata ['uid']) == 'string' )
    objForLateConver['uid']  =  iNdata['uid'];

  objForUpdate = DINAMO.jsonObjectToUpdate(objForLateConver,objForUpdate,'keys');
  DINAMO.update(objForUpdate,iNfunction);
}
_['updateSms'] = updateSms;




function sendSmsViaMegafon (iNdata, iNfunction, iNobjForGetReports) {
  /*
    @inputs
      @required
        iNdata -> object
          @required
            to (phone)
            content (msg)
            operator_login () - @disable
            operator_pswd () - @disable

          @optinal
            sender ()
            proxy () - @disable
            operator_login () - @disable
            operator_pswd () - @disable
        iNfunction -> function
          @example
            iNfunction ( false, message , response )
      @optional
        iNobjForGetReports -> object
          @required
            uid -> string

  */
  if(typeof iNdata != 'object') iNdata = {};
  if(typeof iNobjForGetReports != 'object') iNobjForGetReports = {};
  // add sender
  iNdata['sender']  = iNdata['sender'] || "Ramman.net";
  // add proxy
  // iNdata['proxy']   = iNdata['proxy']  || "https://api.ramman.net/RammanProxy/proxy.php";
  // add proxy login
  // iNdata['proxy_login'] = iNdata['proxy_login'] || "ramman";
  // add proxy password
  // iNdata['proxy_pswd']  = iNdata['proxy_pswd']  || "1q2w3e4r5t";

  // create body for pass to server
  const bodyForRequest = {
    from: iNdata['sender'],
    to: parseInt(iNdata['to']),
    message: iNdata['content']
  };
  // add callback_url if we want get delivery reports from megafon
  if(typeof iNdata['callback_url'] == 'string') {
      bodyForRequest['callback_url']  = iNdata['callback_url'];
  } //  add default callback_url for get delivery reports from megafon if we have user sender id
  else if(typeof(iNobjForGetReports['uid']) == 'string') {
      bodyForRequest['callback_url'] = "https://ramman.net/backend/service/sms/v1/" + iNobjForGetReports['uid'] + "/megafon";
  }

  var mefagonUrl = "https://a2p-api.megalabs.ru/sms/v1/sms";
  // create authorization code
  var authorization  = CONNECT.base64_encode(iNdata['operator_login'] + ":" + iNdata['operator_pswd']);
  var options = {
    method: 'POST',
    url: mefagonUrl,//iNdata['proxy'],
    // qs:
    //  {
    //    ramman_url: 'https://a2p-api.megalabs.ru/sms/v1/sms',
    //    ramman_login : iNdata['proxy_login'],
    //    ramman_pswd  : iNdata['proxy_pswd'],
    //  },
    headers:
     {
       'cache-control'  : 'no-cache',
       'authorization'  : 'Basic ' + authorization,
       'content-type'   : 'application/json'
     },
    body: bodyForRequest,
    json: true
  };

  request(options, function (error, response, body) {
    if( error ) {
      // if error msgId
      iNfunction( error, false, body );
    } else {
      if(typeof body == 'string')
        var json = JSON.parse(body);//response.search("ERROR");
      else
        var json = body; //response.search("ERROR");

      if( json.result.status.code == 0 ) {
        // not error -> pass to msgId -> success
        iNfunction ( false, json.result.msg_id , body );

      } else {
        // not error msgId -> failure
        iNfunction ( true, false, body );
      }
    }
  });

}
_['sendSmsViaMegafon'] = sendSmsViaMegafon;

function sendSmsViaTele2 (iNdata, iNfunction, iNobjForGetReports) {
  /*
    @inputs
      @required
        iNdata -> object
          @required
            to (phone)
            content (msg)
            operator_login ()- @disable
            operator_pswd ()- @disable

          @optinal
            sender ()
            proxy () - @disable
            operator_login ()
            operator_pswd ()
            proxy_login - @disable
            proxy_pswd - @disable
        iNfunction -> function
          success : iNfunction(false, msgid)
  */
    if(typeof iNdata != 'object') iNdata = {};
    iNdata['sender']      = iNdata['sender'] || "Ramman.net";
    // iNdata['proxy']       = iNdata['proxy']  || "https://api.ramman.net/RammanProxy/proxy.php";



    // iNdata['proxy_login'] = iNdata['proxy_login'] || "ramman";
    // iNdata['proxy_pswd']  = iNdata['proxy_pswd']  || "1q2w3e4r5t";
    var tele2Url = "http://bsms.tele2.ru/api/";

    var options = {
      method: 'GET',
      url: tele2Url, // iNdata['proxy'],//'http://bsms.tele2.ru/api/',
      qs:
       {
        //  ramman_url   : tele2Url,
        //  ramman_login : iNdata['proxy_login'],
        //  ramman_pswd  : iNdata['proxy_pswd'],

         operation    : 'send',
         login        : iNdata['operator_login'],   //'ht887624043',
         password     : iNdata['operator_pswd'], // 'rrDwQqsN',
         msisdn       : iNdata['to'],//'79287377782',
         shortcode    : iNdata['sender'],// 'Ramman.net',
         text         : iNdata['content']
       },
       headers: {
         'cache-control': 'no-cache'
       }
     };

     request(options, function (error, response, body) {
       if( error ) {
         // if error msgId
         iNfunction( error, false, body );
       } else {
         var result = body;
         var searchResult = body.search("ERROR");
         if(searchResult != -1) {
           // nor error msgId
           iNfunction( true, false, body );

         } else {
           // not error -> pass to msgId -> success
           iNfunction( false, result, body );
         }
       }
     });

}
_['sendSmsViaTele2'] = sendSmsViaTele2;


function getProvider (iNinfoFromDb,iNprovider) {
  /*
    @inputs
      iNinfoFromDb -> object
        @example
          "default": "tele2",
          "megafon": {
            "login": "MSK_rcnnct",
            "proxy": "https://api.ramman.net/RammanProxy/proxy.php",
            "pswd": "gzKJckJB",
            "sender": "Ramman.net"
          },
          "tele2": {
            "login": "ht887624043",
            "proxy": "https://api.ramman.net/RammanProxy/proxy.php",
            "pswd": "rrDwQqsN",
            "sender": "Ramman.net"
          }
      iNprovider -> string
  */
  var result = {};//providerName, providerFunctionName;

  if (iNprovider == 'megafon' && typeof iNinfoFromDb[iNprovider] == 'object' ) {
    result['name']= 'megafon';
    result['functionName']= 'sendSmsViaMegafon';
  } else if (iNprovider == 'tele2' && typeof iNinfoFromDb[iNprovider] == 'object' ) {
    result['name'] = 'tele2';
    result['functionName']= 'sendSmsViaTele2';
  } else {
    result['name']= iNinfoFromDb['default'];
    result['functionName']= 'sendSmsVia' + capitalizeFirstLetter(result['name']);
  }

  return result;
}
_['getProvider'] = getProvider;

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function getContentOfMsgWithTranslateIfNeed (iNdata) {
  /*
    @discr
      return message with||without translit
    @inputs
      iNdata -> object
        content
        translit
  */
  var needTranslit = iNdata['translit']||false;
  var content;
  if(needTranslit)
    content = translit(iNdata['content'])
  else
    content = iNdata['content'];

    content = content
      .trim()
      .replace('/\n/g', "\n" )
      .replace(/[\n\r]+/g, "\n" )
      .replace(/[ ]+/g, " " )
      .replace(/[\n\r\t ]+[\n\t\r]+/g,"\n");
  return content;
}
_['getContentOfMsgWithTranslateIfNeed'] = getContentOfMsgWithTranslateIfNeed;


function translit (iNstr) {
    var str = iNstr;
    var link = '', space = " ";
    var transl = {
        "а" : "a","б" : "b","в" : "v","г" : "g","д" : "d","е" : "e",
        "ё" : "yo","ж" : "j","з" : "z","и" : "i","й" : "y","к" : "k","л" : "l", "м" : "m",
        "н" : "n","о" : "o","п" : "p","р" : "r","с" : "s","т" : "t",
        "у" : "y","ф" : "f","х" : "h","ц" : "c","ч" : "ch", "ш" : "sh","щ" : "sh",
        "ы" : "i","э" : "e","ю" : "u","я" : "ya",
        /*--*/
        "А" : "A","Б" : "B","В" : "V","Г" : "G","Д" : "D","Е" : "E", "Ё" : "Yo",
        "Ж" : "J","З" : "Z","И" : "I","Й" : "Y","К" : "K", "Л" : "L","М" : "M",
        "Н" : "N","О" : "O","П" : "P", "Р" : "R","С" : "S","Т" : "T","У" : "Y",
        "Ф" : "F", "Х" : "H","Ц" : "C","Ч" : "Ch","Ш" : "Sh","Щ" : "Sh",
        "Ы" : "I","Э" : "E","Ю" : "U","Я" : "Ya",
        "ь" : "","Ь" : "","ъ" : "","Ъ" : ""
    }

    for (var i = 0; i < str.length; i++){
        if (/[а-яА-ЯёЁ]/.test(str.charAt(i))){ // заменяем символы на русском
            link += transl[str.charAt(i)];
        } else if (/[a-z0-9]/.test(str.charAt(i))){ // символы на анг. оставляем как есть
        	link += str.charAt(i);
    	}else {
            // if (link.slice(-1) !== space) link += space; // прочие символы заменяем на space
            link += str.charAt(i);
      }
    }
    return link;
}
_['translit'] = translit;


function backed_accepDeliveryReportFromMegafon (iNbodyFromRequest,iNdata, iNfunction ) {
  /*
    @discr
      update delivery state from provider megafon
    @inputs
      @required
        iNbodyFromRequest -> object
            @value
              status -> string
              short_message -> string
              receipted_message_id -> string
              msg_id -> string
            @examples
                {
                  status: 'delivered',
                  short_message: 'id:3163234653 submit date:1710220057 done date:1710220057 stat:DELIVRD err:000',
                  receipted_message_id: '2680000bc8b215d',
                  msg_id: 'sl8rvlvdlo345hvf'
                }
        iNdata -> object
          @value
            @required
              uid -> string
  */
  var owner = '@system';
  getSms (
    owner,
    {
      'uid': iNdata['uid'],//'0626c053-882c-456b-80f1-a864d4c718da',
      'key': iNbodyFromRequest['msg_id'],//'sl8rvlvdlo345hvf',
      'by' : 'key',
      'operator': 'megafon'
    },
    (err,data) => {
      if(!err && data.Count > 0) {
        //SUCCESS we get this msg from db -> we update status

        // create objec for update msg
          const objForUpdateMsg = {
            'id'            : data.Items[0].id,
            'answer'        : JSON.stringify(iNbodyFromRequest),
            'updatedTime'   : CONNECT.getTime()
          };
        // get status
          if(iNbodyFromRequest['status'] == 'delivered') {
            objForUpdateMsg['status'] = 'delivered';
          } else if (iNbodyFromRequest['status'] == 'delivery_failed'){
            objForUpdateMsg['status'] = 'fail';
          } else {
            objForUpdateMsg['status'] = 'unknown';
          }
        updateSms (
          owner,
          objForUpdateMsg,
          (err,data) => {
            if(!err) {
              // SUCCESS we update message delivery status
              iNfunction(false);
            }else {
              // ERROR we cant update message delivery status
              iNfunction(true);
            }
          }
        );
      } else {
        //ERROR
        iNfunction(true);
      }
    }
  );

}
_['backed_accepDeliveryReportFromMegafon'] = backed_accepDeliveryReportFromMegafon;

function backed_accepDeliveryReportFromTele2 (iNbodyFromRequest,iNdata, iNfunction ) {
  /*
    @discr
      update delivery state from provider tele2
    @inputs
      @required
        iNbodyFromRequest -> object
            @value
              status -> string
                @enum
                  delivered | expired | undeliverable | rejected | billed | unknown
              parts -> number || string
              id -> string
                @discr
                  message key
            @examples
                {
                  status: 'delivered',
                  parts: 2,
                  id: 'sl8rvlvdlo345hvf'
                }
        iNdata -> object
          @value
            @required
              uid -> string
  */
  var owner = '@system';
  getSms (
    owner,
    {
      'uid': iNdata['uid'],//'0626c053-882c-456b-80f1-a864d4c718da',
      'key': iNbodyFromRequest['id'],//'sl8rvlvdlo345hvf',
      'by' : 'key',
      'operator': 'tele2'
    },
    (err,data) => {
      if(!err && data.Count > 0) {
        //SUCCESS we get this msg from db -> we update status

        // create objec for update msg
          const objForUpdateMsg = {
            'id'            : data.Items[0].id,
            'answer'        : JSON.stringify(iNbodyFromRequest),
            'updatedTime'   : CONNECT.getTime(),
            'size'          : parseInt(iNbodyFromRequest['parts'])
          };
        // get status
          if(iNbodyFromRequest['status'] == 'delivered') {
            objForUpdateMsg['status'] = 'delivered';
          } else if (iNbodyFromRequest['status'] == 'undeliverable'){
            objForUpdateMsg['status'] = 'fail';
          } else if (iNbodyFromRequest['status'] == 'expired'){
            objForUpdateMsg['status'] = 'expired';
          } else if (iNbodyFromRequest['status'] == 'rejected'){
            objForUpdateMsg['status'] = 'rejected';
          } else if (iNbodyFromRequest['status'] == 'billed'){
            objForUpdateMsg['status'] = 'billed';
          } else {
            objForUpdateMsg['status'] = 'unknown';
          }
        updateSms (
          owner,
          objForUpdateMsg,
          (err,data) => {
            if(!err) {
              // SUCCESS we update message delivery status
              iNfunction(false);
            }else {
              // ERROR we cant update message delivery status
              iNfunction(true);
            }
          }
        );
      } else {
        //ERROR
        iNfunction(true);
      }
    }
  );

}
_['backed_accepDeliveryReportFromTele2'] = backed_accepDeliveryReportFromTele2;

module.exports = _;
