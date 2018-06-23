exports.handler = (event, context, callback) => {
    //implement
    var CONNECT     = require('./input/connect');
    const LOG       = require('ramman-z-log');
    //var DINAMO      = require("./input/aws/dinamo");
    //var ACCESS      = require("./input/connect_access/access");
    // var CONFIRM     = require("./input/connect_access/confirm");
    // var USER        = require("./input/connect_users/users");
    // var CATEGORY    = require("./input/connect_category/category");
    var APP        = require("./input/connect_app/app");
    // var DICTIONARY    = require("./input/connect_dictionary/dictionary");
    // var PAGE      = require("./input/connect_page/page");
    // var FIREBASE  = require("./input/firebase/firebase");


    LOG.on();

    CONNECT.setHeader(event);
    var HEADER = CONNECT.getHeader(['*']);
    var DATA   = HEADER['data'];
    var TYPE   = HEADER['type'];

    const CONTEXT = context;
    const EVENT = event;
    const PARAMS = CONNECT.getUrlParams();
          PARAMS['data'] = DATA;
    LOG.printObject('PARAMS1',PARAMS);
    APP.run(PARAMS, EVENT, CONTEXT);

}
