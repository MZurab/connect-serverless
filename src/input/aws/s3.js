/*
  @depends
    @libraries
      AMAZON AWS - require("aws-sdk");
    @vars input
      var docClient = new AWS.DynamoDB.DocumentClient();
*/
// const AMAZON = require("./aws");
const AWS2 = require("aws-sdk");//AMAZON.data;
const LOG  = require('ramman-z-log');
// AWS2.config.update (
//   {
//     // accessKeyId: "AKIAJ2AECGNRBK4LSUFA",
//     // secretAccessKey: "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",
//     // "s3BucketEndpoint": true,
//      region: "eu-west-1",
//     "endpoint": "s3.amazonaws.com"
//   }
// );
const S3 = new AWS2.S3(
    {
        region: "eu-west-1",
        endpoint: "s3.amazonaws.com"
    }
);
const _ = {};


function getFile (iNdata, iNfunction) {
  /*
    @discr
      get file from s3 by passed bucket && path
    @inputs
      @required
        iNdata -> object
          bucket
          path
          toStringUtf8 -> bool
      @optional
        iNfunction -> function
    @example
      getFile(
        {
            bucket: 'bucketName',
            'path': 'my/file/path/file.extention'
        },
        function (err,data) {
          if(!err){
            //success
            return data;
          } else {
            //false
            return false;
          }
        }
      )
  */
  var getParams = {}, objForGetObjectS3 = {};
    if( typeof iNdata == 'object' ) {
      if(typeof iNdata['bucket'] == 'string')
        objForGetObjectS3['Bucket'] = iNdata['bucket'];

      if(typeof iNdata['path'] == 'string')
        objForGetObjectS3['Key'] = iNdata['path'];
    }
  S3.getObject(objForGetObjectS3,
    (err, data) => {

      if (err) {
        if ( typeof iNfunction == 'function') iNfunction(err,false);
      } else {
        if (iNdata['toStringUtf8'] && data ) {
          data = data.Body.toString('utf-8');
        }

        if ( typeof iNfunction == 'function') iNfunction(false, data);
      }
    }
  );
}
_['getFile'] = getFile;


module.exports = _;
