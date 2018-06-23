const Template7 = require('handlebars');//require("./library/template7");

const LOG   = require('ramman-z-log');

const _  = Template7;

function createTemplateByString (iNfile) {
  return _.compile(iNfile);
}
_['createTemplateByString'] = createTemplateByString;

function getTemplateByObject (iNtemplate,iNdata) {
  return iNtemplate(iNdata);
}
_['getTemplateByObject'] = getTemplateByObject;

function get (iNtemplate,iNdata) {
  let template = createTemplateByString(iNtemplate);
  let result   = getTemplateByObject(template,iNdata);
  return result;
}
_['get'] = get;

module.exports = _;
