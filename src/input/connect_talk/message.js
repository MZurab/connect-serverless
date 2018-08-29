var DINAMO    = require("../aws/dynamo/dynamo");
var CONNECT   = require('./../connect');
const LOG     = require('ramman-z-log');

function Connect_sendSms (smsText,phone,iNsender,iNcountry) {
    if ( typeof(iNsender) != 'string' ) iNsender = 'RVerify';
    var smsText = encodeURIComponent ( smsText );
    phone = Connect_getPhoneCodeByCountry(iNcountry) + phone;
    var urlSms  = "http://bsms.tele2.ru/api/?operation=send&login=ht887624043&password=rrDwQqsN&msisdn="+phone+ "&shortcode="+iNsender+"&text="+smsText;
    CONNECT.getUrlRequest(urlSms);
}
module.exports.sendSms = Connect_sendSms;

function Connect_getPhoneCodeByCountry (iNcountry) {
    var country = iNcountry,
        phone='7';
    switch (country) {
      case "russia":
        phone = "7";
      break;

      case "none":
        phone = '';
      break;
    }
    return phone;
}
module.exports.getPhoneCodeByCountry = Connect_getPhoneCodeByCountry;

/*
include
  firebase base
  dynamo base

@SCHEMA
  - FIREBASE
    - messages -> db
        $chatId    -> object
          $msgId    -> object
            data    -> number
            option  -> object (additional data {key : value})
            read    -> number
            time    -> number
            type    -> number (1 - user, 2 - service)
            uid     -> string
*/
