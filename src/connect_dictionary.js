exports.handler = (event, context, callback) => {
    //implement
    var CONNECT     = require('./input/connect');
    const LOG       = require('ramman-z-log');
    //var DINAMO      = require("./input/aws/dinamo");
    //var ACCESS      = require("./input/connect_access/access");
    //var USER        = require("./input/connect_access/user");
    var DICTIONARY    = require("./input/connect_dictionary/dictionary");


    CONNECT.setHeader(event);
    var HEADER = CONNECT.getHeader(['*']);
    var DATA   = HEADER['data'];
    var TYPE   = HEADER['type'];



    var lang ='ru';
    if(  typeof(DATA['lang']) == 'string' ) lang = DATA['lang'];

    //for firefox && safari auto
    if(lang == 'ru-RU') lang = 'ru';
    if(lang == 'en-US') lang = 'en';

    DICTIONARY.getDictionary('@system',lang,function (iNresult) {
      context.succeed("CONNECT_DICTIONARY = " + JSON.stringify(iNresult) + ";");
    });
}
