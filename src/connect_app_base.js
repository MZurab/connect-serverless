/*
  @depends
    @libraries
      AMAZON AWS - require("aws-sdk");
    @vars input
      var docClient = new AWS.DynamoDB.DocumentClient();
*/;
const FILE = require("./input/aws/s3");
const _ = {};
const LOG   = require('ramman-z-log');

function run (iNdata,iNuser,iNevent) {

}
_['run'] = run;


module.exports = _;
