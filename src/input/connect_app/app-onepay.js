const DINAMO    = require("../aws/dynamo/dynamo");
const FILE      = require("./../aws/s3");
const TEMPLATE  = require("./../connect_template/template");

const LOG     = require('ramman-z-log');

const _  = {};



//
//@< FUNCTION
function run ( iNdata, iNuser, iNevent, iNcontext ) {
  /*
    @example
    @discr
    @inputs
      @required
        iNdata  -> object |
        iNuser  -> object |
        iNevent -> object |
  */
  LOG.printObject('app-onepay.js run iNdata, iNuser, iNevent, iNcontext', iNdata, iNuser, iNevent, iNcontext);

}
_['run'] = run;

function getPageIndex ( iNdata, iNuser, iNevent, iNcontext ) {
  /*
    @example
    @discr
    @inputs
      @required
        iNdata  -> object |
        iNuser  -> object |
        iNevent -> object |
  */
}
_['getPageIndex'] = getPageIndex;
//@> FUNCTION

module.exports = _;
