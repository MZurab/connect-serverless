exports.handler = (event, context, callback) => {
    //implement
    const CONNECT     = require('./input/connect');
    const LOG         = require('ramman-z-log');
    //var DINAMO      = require("./input/aws/dinamo");
    //var ACCESS      = require("./input/connect_access/access");
    //var USER        = require("./input/connect_access/user");
    // var DICTIONARY    = require("./input/connect_dictionary/dictionary");
    const PAGE        = require("./input/connect_page/page");

    // LOG.on();
    CONNECT.setHeader(event);
    var HEADER = CONNECT.getHeader(['*']);
    var DATA   = HEADER['data'];
    var TYPE   = HEADER['type'];



    if(
        typeof(DATA['uid']) == 'string' ||
        typeof(DATA['id']) == 'string'
    ) {

    }
    var uid = DATA['uid'];
    LOG.printObject('PAGE.getPage init');
    PAGE.getPage(uid,DATA,function(err,data){
      LOG.printObject('PAGE.getPage start');
      if (!err) {
        LOG.printObject('PAGE.getPage !err');
        if( data['Count'] > 0 ) {
            LOG.printObject('PAGE.getPage count > 0');
            context.succeed(data['Items'][0]);
        }
      }
    });
}
