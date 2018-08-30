const gcs     = require('@google-cloud/storage')({keyFilename: __dirname + '/connect-9109d-firebase-adminsdk-lytg0-130f89d0ed.json'});
const _       = {};
const LOG     = require('ramman-z-log');
var functionAddress = 'firebase/storage-old.js ';

if ( !Date.prototype.toISOString ) {
  ( function() {

    function pad(number) {
      var r = String(number);
      if ( r.length === 1 ) {
        r = '0' + r;
      }
      return r;
    }

    Date.prototype.toISOString = function() {
      return this.getUTCFullYear()
        + '-' + pad( this.getUTCMonth() + 1 )
        + '-' + pad( this.getUTCDate() )
        + 'T' + pad( this.getUTCHours() )
        + ':' + pad( this.getUTCMinutes() )
        + ':' + pad( this.getUTCSeconds() )
        + '.' + String( (this.getUTCMilliseconds()/1000).toFixed(3) ).slice( 2, 5 )
        + 'Z';
    };

  }() );
}


function createFile (iNbucket,iNfile,iNcontent) {
  LOG.print('createFile INVOKE 3 - iNbucket,iNfile,iNcontent',iNbucket,iNfile,iNcontent);
  let bucket  = gcs.bucket(iNbucket);
  let file    = bucket.file(iNfile);
  file.save( iNcontent , function(err) {
    LOG.print('createFile',err);
    if (!err) {
      // File written successfully.
    }
  });

} _.createFile = createFile;


function getSignedUrlForRead (iNbucket, iNfile, iNexpires) {
  let bucket  = gcs.bucket(iNbucket);
  let file    = bucket.file(iNfile);
  return file.getSignedUrl (
    {
      action    : 'read',
      expires   : iNexpires
    }
  );
  // .then(signedUrls => {
  //   // signedUrls[0] contains the file's public URL
  // });
} _.getSignedUrlForRead = getSignedUrlForRead;

function changeDomainToCompany (iNurl) {
    return iNurl.replace('https://storage.googleapis.com/connect-9109d.appspot.com','https://gstorage.ramman.net');
} _.changeDomainToCompany = changeDomainToCompany;


function getSignedUrlForRead12Hour (iNbucket, iNfile, iNfunction) {
  let exp = new Date( new Date().getTime() + (60*60*12.5*1000) ).toISOString();
  return getSignedUrlForRead(iNbucket, iNfile, exp).then(results => {
        LOG.printObject('getSignedUrlForRead12Hour SUCCESS results',results);
        var url = changeDomainToCompany(results[0]);
        iNfunction(null,url);
  }).catch( err => {
    LOG.print('getSignedUrlForRead12Hour ERROR', err);
    iNfunction(err,null);
  });
} _.getSignedUrlForRead12Hour = getSignedUrlForRead12Hour;

module.exports  = _;
