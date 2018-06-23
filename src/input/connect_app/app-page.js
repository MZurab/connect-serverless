const DINAMO    = require("./../aws/dinamo");
const FILE      = require("./../aws/s3");
// const TEMPLATE  = require("./../connect_template/template");
const LOG     = require('ramman-z-log');

const LANG      = require("./../connect_lang/lang");
const Template7 = require("./../connect_template/template");
const PAGE      = require("./../connect_page/page");

const _  = {};

// PAGE.getPage (
//   iNuid,
//   {
//     id
//   },
//   ()=>{}
// )

//
//@< FUNCTION
function run ( iNobject , iNdata, iNuser, iNevent, iNcontext ) {
  /*
    @example
    @discr
    @inputs
      @required
        iNdata  -> object |
        iNuser  -> object |
        iNevent -> object |
  */
  LOG.printObject('app-page.js run iNobject, iNdata, iNuser, iNevent, iNcontext',iNobject,iNdata, iNuser, iNevent, iNcontext);
  getPage(
    {
    'bucket'        : 'rconnect-data',
    'path'          : 'users/system/template.html',
    'toStringUtf8'  : true
  },
  (err, temp) => {
    if(!err) {
      //SUCCESS we get tamplate from s3
      LOG.printObject('PAGE.getPage start');
      // get page from dynamo
      var dataForGetPage = iNdata['data'];
      PAGE.getPage (
        iNuser['uid'],
        dataForGetPage,
        (err,data) => {
          if (!err && data['Count'] > 0 ) {
              //SUCCESS we get page from db
              LOG.printObject('PAGE.getPage count > 0 -> $data',data);
              var page = data.Items[0];
              LOG.printObject('PAGE.getPage $page',page);
              var userLang = LANG.getLangByArray(iNdata);
              LOG.printObject('PAGE.getPage $userLang',userLang);
              var objForGetPage = prepareObjectForTemplate(page,userLang)||{};
              LOG.printObject('PAGE.getPage $objForGetPage',objForGetPage);
              LOG.printObject('PAGE.getPage $temp',temp);

              if ( iNobject['userDomain'] ) objForGetPage['subDomain'] = iNobject['userDomain'];
              iNcontext.succeed( Template7.get(temp,objForGetPage) );
          } else {
            //ERROR we cant get page from db -> we view 404 error
            LOG.printObject('PAGE.getPage !err',err);
            view404Page ( iNobject , iNdata, iNuser, iNevent, iNcontext );
          }
        }
      );
    }else {
      //ERROR we get tamplate from s3-> we view 404 error
      view404Page ( iNobject , iNdata, iNuser, iNevent, iNcontext );
    }
  });
}
_['run'] = run;


function view404Page ( iNobject , iNdata, iNuser, iNevent, iNcontext ) {
  /*
    @example
    @discr
    @inputs
      @required
        iNdata  -> object
        iNuser  -> object
        iNevent -> object
  */
  LOG.printObject('app-page.js view404Page iNobject, iNdata, iNuser, iNevent, iNcontext', iNobject, iNdata, iNuser, iNevent, iNcontext);
  getPage(
    {
      'bucket'        : 'rconnect-data',
      'path'          : 'users/system/template404page.html',
      'toStringUtf8'  : true
    },
    (err,data) => {
        // LOG.printObject("app-base.js run  iNuser.login == iNdata['user']",iNuser.login == iNdata['user']);

        //success
        //getPageByTemplate
        // let userLang = LANG.getLangByArray(iNdata);
        if(!err) {
          //SUCCESS we get 404 page
          let objForGetPage = {};
          if ( iNobject['userDomain'] ) objForGetPage['subDomain'] = iNobject['userDomain'];
          iNcontext.succeed( Template7.get(data,objForGetPage) );

        } else {
          //ERROR we can not get 404 page
          iNcontext.succeed(false);
        }

    }
  );
}
_['view404Page'] = view404Page;

function prepareObjectForTemplate ( iNpageObjForDynamo , iNlang) {
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
  var objForTemplate = {}, _ = iNpageObjForDynamo;
  if ( typeof _ == 'object' )
    if ( typeof _['info'] == 'object' ) {
      var _info = _['info'],
          metaKey         = LANG.safeGetLang(_info['metaKey'],iNlang),
          metaDescription = LANG.safeGetLang(_info['metaDescription'],iNlang),
          title           = LANG.safeGetLang(_info['title'],iNlang);

      if ( metaDescription !== false )  objForTemplate['head_metaDiscr']  = metaDescription;
      if ( title !== false    ) objForTemplate['head_title']  = title;
      if ( metaKey !== false  ) objForTemplate['head_metaKey']  = metaKey;

      return objForTemplate;
    }

   return false;
}

function getPage (iNdata,iNfunction) {
  /*
    @example
    @discr
    @inputs
      @required
        iNdata  -> object
          bucket
          path
          @optional
            toStringUtf8 -> bool
  */
  let objForGetFile = iNdata;
  FILE.getFile (
    objForGetFile,
    (err,data) => {
      if(!err) {
        // if all good -> output page
        LOG.printObject('app-page.js getPage success', err,data);
        iNfunction(false,data);
      } else {
        LOG.printObject('app-page.js getPage error', err,data);
        iNfunction(err,false);
      }
    }
  );
}
_['getPage'] = getPage;


function getPageFullWindow ( iNdata, iNuser, iNevent, iNcontext ) {
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
_['getPageFullWindow'] = getPageFullWindow;

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
