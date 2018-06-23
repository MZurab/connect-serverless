exports.handler = (event, context, callback) => {
    //implement
    const CONNECT     = require('./input/connect');
    const LOG         = require('ramman-z-log');
    //var DINAMO      = require("./input/aws/dinamo");
    //var ACCESS      = require("./input/connect_access/access");
    const USER        = require("./input/connect_users/users");
    // var CATEGORY    = require("./input/connect_category/category");
    // var DICTIONARY    = require("./input/connect_dictionary/dictionary");
    // var PAGE    = require("./input/connect_page/page");

    const SYNCHRONIZE = require("./input/connect_service/synchronize");


    CONNECT.setHeader(event);
    var HEADER = CONNECT.getHeader(['*']);
    var DATA   = HEADER['data'];
    var TYPE   = HEADER['type'];


    LOG.printObject('Start HEADER, DATA , TYPE',HEADER, DATA , TYPE);
    DATA['login'] = CONNECT.getUrlParam('login');
    LOG.printObject('DATA',DATA);
    // DATA['uid'] = CONNECT.getUrlParam('uid');
    if(
        typeof(DATA['login']) == 'string'

    ) {
      var result = {};

      LOG.printObject('ifStart');

      USER.getUserByLogin (
        DATA['login'],
        '@system',
        (err,data) => {
            LOG.printObject('USER.getUserByLogin',err,data);
            if ( !err && data.Count > 0) {
              var iNuser = data.Items[0];
              LOG.printObject('iNuser',iNuser);
                LOG.printObject('0iNuser[mark]',iNuser['mark']);
                LOG.printObject('0iNuser[mark][subDomain]',iNuser['mark']['subDomain']);
              if( typeof iNuser['mark'] == 'object' && iNuser['mark']['subDomain'] == true ) {
                LOG.printObject('iNuser[mark]',iNuser['mark']);
                LOG.printObject('iNuser[mark][subDomain]',iNuser['mark']['subDomain']);

                var accessCorsDomain = 'https://' + DATA['login'] + '.ramman.net';
                    result['subDomain'] = accessCorsDomain;
                    result['content']   = accessCorsDomain;
                    SYNCHRONIZE.getPageForSubDomain(result, (err,data) => {
                      LOG.printObject('SYNCHRONIZE.getPageForSubDomain err,data',err,data);

                      if (!err) {
                        result['content'] = data;
                        context.succeed(result);
                      } else {

                      }
                    });
              }
            } else {
              // ERROR CHANGE
            }
        }
      );



}

};
