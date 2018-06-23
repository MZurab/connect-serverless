const DINAMO    = require("./../aws/dinamo");
const FILE      = require("./../aws/s3");
const Template7 = require("./../connect_template/template");
const APP_PAGE  = require("./app-page.js");
const LANG      = require("./../connect_lang/lang");
const LOG     = require('ramman-z-log');


const _  = {};



//
//@< FUNCTION
function run ( iNobject , iNdata, iNuser, iNevent, iNcontext ) {
  /*
    @example
    @discr
    @inputs
      @required
        iNdata  -> object
        iNuser  -> object
        iNevent -> object
  */
  LOG.printObject('app-base.js run iNdata, iNuser, iNevent, iNcontext', iNdata, iNuser, iNevent, iNcontext);
  APP_PAGE.getPage(
    {
      'bucket'        : 'rconnect-data',
      'path'          : 'users/system/template.html',
      'toStringUtf8'  : true
    },
    (err,data) => {
        // LOG.printObject("app-base.js run  iNuser.login == iNdata['user']",iNuser.login == iNdata['user']);
        if(!err && iNuser['login'].length > 2 ) {
          //success
          //getPageByTemplate
          let userLang = LANG.getLangByArray(iNdata);
          LOG.printObject('app-base.js run iNdata',iNdata);
          LOG.printObject('app-base.js run iNobject',iNobject);
          LOG.printObject('app-base.js run userLang',userLang);
          let objForGetPage = prepareObjectForTemplate(iNuser,userLang)||{};
          if ( iNobject['userDomain'] ) objForGetPage['subDomain'] = iNobject['userDomain'];
          LOG.printObject('app-base.js run subDomain objForGetPage',objForGetPage);
          LOG.printObject('app-base.js run data',data);
          iNcontext.succeed( Template7.get(data,objForGetPage) );
        } else {
          iNcontext.fail('https://ramman.net');
        }
    }
  );
}
_['run'] = run;

function prepareObjectForTemplate ( iNuserObjForDynamo , iNlang) {
  /*
    @example
    @discr
    @inputs
      @required
        iNdata  -> object |
    @return
      object
        head_title
        head_metaDiscr
        head_metaKey
        body_appMenu
        body_appChief
  */
  var objForTemplate = {}, _ = iNuserObjForDynamo;
  if ( typeof _ == 'object' )
    if ( typeof _['info'] == 'object' ) {
      var _info = _['info'],
          discr           = LANG.safeGetLang(_info['description'],iNlang)
          name            = LANG.safeGetLang(_info['name'],iNlang),
          metaKey         = LANG.safeGetLang(_info['metaKey'],iNlang),
          metaDescription = LANG.safeGetLang(_info['metaDescription'],iNlang),
          title           = LANG.safeGetLang(_info['title'],iNlang);

      if ( metaDescription !== false )  objForTemplate['head_metaDiscr']  = metaDescription;
      if ( title !== false    ) objForTemplate['head_title']  = title;
      if ( metaKey !== false  ) objForTemplate['head_metaKey']  = metaKey;
      if ( discr !== false    ) objForTemplate['body_discr']  = discr;
      if ( name !== false     ) objForTemplate['body_name']  = name;

      return objForTemplate;
    }

   return false;
}



//@> FUNCTION

module.exports = _;
