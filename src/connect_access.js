exports.handler = (event, context, callback) => {
  // TODO implement
  var CONNECT = require('./input/connect');
  var DINAMO  = require("./input/aws/dynamo/dynamo");
  var ACCESS  = require("./input/connect_access/access");
  const LOG   = require('ramman-z-log');





  if( typeof(event['body-json']) == 'undefined'){
      callback(null,{'status':0,'ru':'Нет входных данных.'});
      return 0;
  }
  var ij = event['body-json'];









  var userIp = 'ddd';
  var inData = {};
    inData.key = 'dsfsdfdsf';
    inData.pswd = 'jdslfkj';
    inData.ip = 'jdslfkj';
    inData.to = 'idTataevMarket';
    ACCESS.getAccessDataForApi(inData,function(d){LOG.printObject('HAHAHA');LOG.printObject(d);});


if ( typeof(ij.type) != 'undefined') {
      /*
       input
       type
       user
       pswd
       */
      // signIn (by login or phone) and pswd NEED [inUser,inPswd] [inUserAgent || androidCode || iosCode ]
      if( ij.type == 'api') {
        if( typeof(ij.uid) != 'undefined' && typeof(ij.key) != 'undefined' && typeof(ij.pswd) != 'undefined' ) {

            var userIp = 'ddd';
            var inData = {};
              inData.key = 'dsfsdfdsf';
              inData.pswd = 'jdslfkj';
              inData.ip = 'jdslfkj';
              inData.to = 'idTataevMarket';
              ACCESS.getAccessDataForApi(inData,function(d){LOG.printObject('HAHAHA');LOG.printObject(d);});


          } // if( typeof(ij.uid) != 'undefined' && typeof(ij.key) != 'undefined' && typeof(ij.pswd) != 'undefined' &&  ){
      } // if( ij.type == 'api') {
  } // if ( typeof(ij.type) != 'undefined') {

};
