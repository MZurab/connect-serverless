exports.handler = (event, context, callback) => {
    const LOG       = require('ramman-z-log');
    // LOG.on();
    //implement
    const CONNECT   = require('./../../../input/connect');
    //var DINAMO    = require("./input/aws/dinamo");
    const ACCESS    = require("./../../../input/connect_access/access");
    //var USER        = require("./input/connect_access/user");
    // var DICTIONARY    = require("./input/connect_dictionary/dictionary");
    const BALANCE   = require("./../../../input/connect_balance/balance");
    const ONEPAY    = require("./../../../input/connect_onepay/onepay");
    const SMS       = require("./../../../input/connect_sms/sms");

    CONNECT.setHeader(event);
    const HEADER  = CONNECT.getHeader(['*']);
    const DATA    = HEADER['data'];
    const TYPE    = HEADER['type'];

    const URLPATH = CONNECT.getUrlParams();
    const QUERYSTRING = CONNECT.getQueryString();
    const RESULT  = {'status':0};


    LOG.printObject('event',event);
    LOG.printObject('HEADER', HEADER);
    LOG.printObject('DATA',   DATA);
    LOG.printObject('URLPATH',URLPATH);

    // first version
    if(URLPATH['version'] == 'v1') {
      LOG.printObject ( 'START' )
      SMS.backed_accepDeliveryReportFromTele2(
        QUERYSTRING,
        { uid:URLPATH['uid'] },
        (err) => {
          if(!err) {
            //SUCCESS we update msg delivery staty
            RESULT['status'] = 1;
            context.succeed(RESULT);
          }else {
            //SUCCESS we update msg delivery staty
            RESULT['error'] = {code:2};
            context.succeed(RESULT);
          }
        }
      );
    } else {
      RESULT['error'] = {code:1};
      context.succeed(RESULT);
  }
}
