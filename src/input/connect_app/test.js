const DINAMO    = require("../aws/dynamo/dynamo");
const FILE      = require("./../aws/s3");
const Template7 = require("./../template7/template7");
const LOG       = require('ramman-z-log');


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
  let userId = iNdata['uid'];

}
_['run'] = run;

function getPageIndex ( iNdata, iNuser, iNevent ) {
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
