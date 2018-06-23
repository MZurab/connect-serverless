exports.handler = (event, context, callback) => {
    //implement
    var CONNECT     = require('./input/connect');
    const LOG       = require('ramman-z-log');
    //var DINAMO      = require("./input/aws/dinamo");
    //var ACCESS      = require("./input/connect_access/access");
    var USER        = require("./input/connect_users/users");
    var CATEGORY    = require("./input/connect_category/category");
    // var DICTIONARY    = require("./input/connect_dictionary/dictionary");
    var PAGE    = require("./input/connect_page/page");


    CONNECT.setHeader(event);
    var HEADER = CONNECT.getHeader(['*']);
    var DATA   = HEADER['data'];
    var TYPE   = HEADER['type'];

    LOG.printObject('event',event);
    LOG.printObject('context',context);

    DATA['type'] = CONNECT.getUrlParam('type');
    DATA['uid'] = CONNECT.getUrlParam('uid');
    if(
        typeof(DATA['uid']) == 'string' &&
        ( typeof(DATA['type']) == 'string' && DATA['type'] == 'full')

    ) {
      var result = {};
      USER.getStructuredUserById(DATA['uid'],'@system',function (userData) {
        if (typeof userData == 'object' ) { // && userData != false
          result['status'] = 1;
          // result['user'] = userData;
          CATEGORY.getStructuredCategory(DATA['uid'],{
            'status'  : 0,
            'by'      :'type',
            'type'    : '@system-menu'
          }, function (catData) {
            if ( typeof catData == 'object' ) {
              // if we have categories
              result['categories'] = catData['categories'];
            }
            context.succeed(result);
          });
        }else {
          result['status'] = 0;
          context.succeed(result);
        }
      });
    }

}
