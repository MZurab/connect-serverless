exports.handler = (event, context, callback) => {
    const CONNECT     = require('./input/connect');
    const LOG         = require('ramman-z-log');

      LOG.printObject('DATA1 event');
      LOG.printObject(event);
      LOG.printObject('DATA1 context');
      LOG.printObject(context);

      // CONNECT.sendSms( `Код - ДВCHAT1 - ${event.Records.length}`, '79287377782', 'RVerify', 'none' );
      callback(null, `Successfully processed ${event.Records.length} records.`);

    //implement
    //var DINAMO      = require("./input/aws/dinamo");
    //var ACCESS      = require("./input/connect_access/access");
    var CONFIRM     = require("./input/connect_access/confirm");
    var USER        = require("./input/connect_users/users");
    var CATEGORY    = require("./input/connect_category/category");
    var CHAT        = require("./input/connect_chat/chat");
    // var DICTIONARY    = require("./input/connect_dictionary/dictionary");
    var PAGE        = require("./input/connect_page/page");



    if(
        true
    ) {



    }

}
