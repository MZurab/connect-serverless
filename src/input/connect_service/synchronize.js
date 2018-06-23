/*
  @depends
    @libraries
      AMAZON AWS - require("aws-sdk");
    @vars input
      var docClient = new AWS.DynamoDB.DocumentClient();
*/
// const USER          = require("./../connect_users/users");
const APP_PAGE      = require("./../connect_app/app-page");
// const APP_BASE      = require("./app-base");
// const APP_SHAREPAY  = require("./app-sharepay");
// const APP_ONEPAY    = require("./app-onepay");
// const LANG          = require("./../connect_lang/lang");
const TEMPLATE      = require("./../connect_template/template");
const LOG           = require('ramman-z-log');

const _ = {};


function getPageForSubDomain (iNdata,iNfunction) {
  APP_PAGE.getPage(
    {
      'bucket'        : 'rconnect-data',
      'path'          : 'users/system/templateForSynchronizeSubDomain.html',
      'toStringUtf8'  : true
    },
    (err,data) => {
        // LOG.printObject("app-base.js run  iNuser.login == iNdata['user']",iNuser.login == iNdata['user']);
        if(!err && typeof data == 'string' ) {
          //success
          //getPageByTemplate
          LOG.printObject('app-synchronize.js getPageForSubDomain iNdata',iNdata);
          // iNcontext.succeed( TEMPLATE.get(data,iNdata) );
          var dataFromTemplate = TEMPLATE.get(data,iNdata);
          iNfunction(false,dataFromTemplate);
          return true;
        }
        iNfunction(err,false);

        //  else {
        //   iNcontext.fail('https://ramman.net');
        // }
    }
  );
}
_['getPageForSubDomain'] = getPageForSubDomain;




module.exports = _;
