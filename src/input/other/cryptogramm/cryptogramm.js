
// const Cookie         = require('SOAP-cookie');
const PKCS7         = require('./../../esign/pkcs7');
// const STORAGE       = require("./input/firebase/storage");
const CONNECT       = require('./../../connect');

const SOAP          = require('soap');
const STR_TO_STREEM = require('string-to-stream');
const LOG           = require('ramman-z-log');
const FS            = require('fs');
const ENUM          = require('./enum');

const _ = {}, __ = {};


const CRYPTOGRAM_WSDL_AUTH_URL        = 'https://dssclients.taxnet.ru/Authentication/Services/Authentication.svc?singleWsdl';
const CRYPTOGRAM_WSDL_CRYPTO_URL      = 'https://dssclients.taxnet.ru/CryptxDSS/Services/CryptoOperation.svc?singleWsdl';
const CRYPTOGRAM_AUTH_URL             = 'https://dssclients.taxnet.ru/Authentication/Services/Authentication.svc';
const CRYPTOGRAM_OPERATION_URL        = 'https://dssclients.taxnet.ru/CryptxDSS/Services/CryptoOperation.svc';
const CRYPTOGRAM_SERT_PASSPHRASE      = '111';
const PATH_TO_PRIVATEKEY              = __dirname + '/res/' + "1.key";
const PATH_TO_CERT                    = __dirname + '/res/' + "1.cer";

function createClient (iNfunction, iNwsdlUrl) {
  var url = iNwsdlUrl;
  var args = {name: 'value'};
  var soapOptions = {
      disableCache: true, //disableCache
  };

  SOAP.createClient (
      url ,
      soapOptions ,
      function (err, client) {
          if (err) {
            //ERROR cannot create client
            return;
          }
          //SUCCESS created client => invoke resultWithSign function
          iNfunction (null,client);
      }
  );
}

function createClientForAuth (iNfunction) {
  var fname = 'createClientForAuth';
  LOG.fstep (fname,1,0, 'INVOKE');
  createClient (
    (errClient,client) => {
      if (errClient) {
        //ERROR Cannot create client
        var errObj = LOG.ferror ( fname, 1, 1, 'Cannot create client ', errClient );
        iNfunction (errObj);
        return;

      }
      // set init point for operation for auth
      setEndpointForAuthOperation(client);
      __.client = client;
      iNfunction(null,client);
    },
    CRYPTOGRAM_WSDL_AUTH_URL
  );
}

function createClientForCryptoOperation (iNfunction) {
  var fname = 'createClientForCryptoOperation';
  LOG.fstep (fname,1,0, 'INVOKE');
  createClient (
    (errClient,client) => {
      if (errClient) {
        //ERROR cannot create client
        var errObj = LOG.ferror ( fname, 1, 1, 'Cannot create client ', errClient );
        iNfunction (errObj);
        return;
      }
      LOG.fstep (fname,1,1, 'created client', errClient);
      // set init point for crypto operaion
      setEndpointForCryptoOperation(client);
      __.clientCrypto = client;
      iNfunction(null,client);
    },
    CRYPTOGRAM_WSDL_CRYPTO_URL
  );
} _.createClientForCryptoOperation = createClientForCryptoOperation;

function setEndpointForCryptoOperation (iNclient) {
  var client = iNclient||__.client;
  // set init point for crypto operaion
  client.setEndpoint(CRYPTOGRAM_OPERATION_URL);
} _.setEndpointForCryptoOperation = setEndpointForCryptoOperation;

function setEndpointForAuthOperation (iNclient) {
  var client = iNclient||__.client;
  // set init point for operation for auth
  client.setEndpoint(CRYPTOGRAM_AUTH_URL);
} _.setEndpointForAuthOperation = setEndpointForAuthOperation;





function getTokenByLogin (iNlogin, iNfunction) {
  var fname = 'getTokenByLogin';
  LOG.fstep (fname,1,0, 'INVOKE - iNlogin ',iNlogin);
  createClientForAuth (
    ( errClient, client ) => {
      if ( errClient ) {
        //ERROR Cannot create client
        var errObj = LOG.ferror ( fname, 1, 1, 'Cannot create client ', errClient );
        iNfunction (errObj);
        return;
      }
      //SUCCESS We created client => we sign this token
      LOG.fstep( fname, 1, 1, 'We created client' );

      // set init point for crypto operaion
      client.GetRandomForSign (
        (errGerRandom,dataGetRandom) => {
          if (errGerRandom) {
            //ERROR Cannot get random key
            var errObj = LOG.ferror (fname, 1,2, 'Cannot get random key',errGerRandom,dataGetRandom);
            iNfunction (errObj);
            return;
          }
          //SUCCESS WE GET TOKEN => we sign this token
          LOG.fstep(fname,1,2,'We got token',dataGetRandom);

          // get random string and decode base64
          var RandomDataForSign = CONNECT.base64_decode ( dataGetRandom.GetRandomForSignResult.Data );

          // conver to stream for sign
          var streamOfRandomForSign = STR_TO_STREEM (RandomDataForSign);
          PKCS7.sign(
            {
              content   : streamOfRandomForSign,
              key       : PATH_TO_PRIVATEKEY,
              cert      : PATH_TO_CERT,
              password  : CRYPTOGRAM_SERT_PASSPHRASE
            }
          ).then (
            (resultWithSign) => {
              //SUCCESS We signed file for signin to cryptogram
              LOG.fstep (fname,1,3,'We signed file for signin to cryptogram',resultWithSign);
              var bufferFile    = resultWithSign.der;

              // get string from buffer
              var bufferString  = bufferFile.toString();
              // cut signcode frin string
              var bufferStringAfterSplit = bufferString.split("\n\n");//\n\n
              // get si
              var signedFile = bufferStringAfterSplit[1];
              LOG.print ( "signTicket signedFile", signedFile );

              var objForSignViaIntegrator = {
                'loginUserIntegrator'   : iNlogin,//'magomadov',
                'integratorsKey'        : signedFile //signedFile sdata bufferString
              };

              // get token
              client.LoginViaIntegrator (
                objForSignViaIntegrator,
                (errLoginViaIntegrator,dataLoginViaIntegrator) => {
                  if(errLoginViaIntegrator){
                    //ERROR cannot get login
                    var errObj = LOG.ferror (fname,1,4, 'Cannot get login ',errLoginViaIntegrator,dataLoginViaIntegrator);
                    iNfunction (errObj);
                    return;
                  }
                  //SUCCESS We get login
                  LOG.fstep(fname,1,4, 'We get login');
                  LOG.printObject('dataLoginViaIntegrator',dataLoginViaIntegrator);

                  __.token = dataLoginViaIntegrator.LoginViaIntegratorResult.Token;
                  iNfunction(__.token,dataLoginViaIntegrator.LoginViaIntegratorResult);
                  return;
                }
              );
              return;
          }).catch(function (err) {
              LOG.print(fname, "Error signing: ", err.stack);
              //ERROR We cannot sign file for signin to cryptogram
              var errObj = LOG.ferror (fname,1,3,'We cannot sign file for signin to cryptogram',err);
              iNfunction (errObj);
              return;
          });
          ////
        }
      );
    }
  );
} _.getTokenByLogin = getTokenByLogin;

function deactivateToken ( iNtoken, iNfunction ) {
  var fname = 'deactivateToken';
  LOG.fstep (fname,1,0, 'INVOKE - iNtoken ', iNtoken);

  // if token is not exist
  if ( typeof iNtoken == 'function' ) {
    var token   = __.token, client  = __.client, iNfunction = iNtoken;
  } else {
    var token   = iNtoken||__.token, client  = __.client;
  }

  if ( !client || !token ) {
    //ERROR client is not exist
    var errObj = LOG.ferror (fname,1,1,'Client or tokent does not exist');
    iNfunction (errObj);
    return;
  }
  //SUCCES Client is exist
  LOG.fstep ( fname, 1, 1, 'Client is created', token );

  client.DeactivateToken (
    { token : token } ,
    ( errToken, dataToken ) => {
      if ( errToken && dataToken.DeactivateTokenResult.Code != 'NoAuthorize' ) {
        //ERROR we can not deactivate token
        var errObj = LOG.ferror (fname,1,2,'We can not deactivate token', errToken, dataToken );
        iNfunction (errObj);
        return;
      }
      //SUCCESS we deactivated token
      LOG.fstep(fname, 1, 2, 'We deactivated token',  dataToken );
      iNfunction (null,dataToken);
    }
  );

} _.deactivateToken = deactivateToken;


function sendSmsWithConfirmCode (iNtoken, iNfunction ) {
  var fname = 'SendSmsWithConfirmCode';
  var errObj = LOG.ferror (fname,1,0, 'INVOKE - iNtoken ', iNtoken);

  // if token is not exist
  if ( typeof iNtoken == 'function' ) {
    var token   = __.token, client  = __.client, iNfunction = iNtoken;
  } else {
    var token   = iNtoken||__.token, client  = __.client;
  }

  client.SendSmsWithConfirmCode (
    { token : token } ,
    ( errToken, dataToken ) => {
      if ( errToken ) {
        //ERROR we can not deactivate token
        var errObj = LOG.ferror (fname,1,2,'We can not deactivate token', errToken, dataToken );
        iNfunction (errObj);
        return;
      }
      //SUCCESS we deactivated token
      LOG.fstep(fname, 1, 2, 'We deactivated token',  dataToken );
      iNfunction (null,dataToken);
    }
  );

} _.sendSmsWithConfirmCode = sendSmsWithConfirmCode;



function signByA (iNdata,iNfunction) {
  /*
    @inputs
      documents -> array of object
        Name -> String
        File -> Bynary

  */
  var token   = __.token, client  = __.client;
  // guard
  if ( !token || !client ) {return;}

}

function GetCertificates (iNtoken, iNfunction) {
  /*
    @discr
      get user certificats
    @inputs
      @optional
        iNtoken     -> string
      @requierd
        iNfunction  -> function

  */
  const fname = 'GetCertificates';
  LOG.fstep (fname,1,0, 'INVOKE - iNtoken, iNfunction', iNtoken, iNfunction );

  // if token is not exist
  if ( typeof iNtoken == 'function' ) {
    var token   = __.token, client  = __.clientCrypto, iNfunction = iNtoken;
  } else {
    var token   = iNtoken||__.token, client  = __.clientCrypto;
  }

  // guard
  if ( !token || !client ) {
    //ERROR Client or token does not exist  => output error
    var errObj = LOG.ferror (fname,1,1,'Client or token does not exist');
    iNfunction (errObj);
    return;
  }
  //SUCCESS Client and token is exist => do request to show certificate
  LOG.fstep (fname,1,1, 'Client and token is exist',  token );

  client.GetCertificates (
    { 'token' : token },
    (errSert,dataSert) => {
      if (errSert) {
        //ERROR we cannot get certificate => output error
        var errObj = LOG.ferror ( fname, 1, 2,'We cannot get certificate', errSert, dataSert );
        iNfunction (errObj);
        return;
      }
      //SUCCESS we get certificate => output result func
      LOG.step ( fname, 1, 2,'We get certificate => output result func', errSert, dataSert );
      var cert = dataSert.GetCertificatesResult.Certificates.RepositoryCertificate;
      iNfunction(null,cert);
    }
  );

} _.GetCertificates = GetCertificates;


function signFile (iNdata,iNtoken, iNfunction) {
  /*
    @discr
      signFile
    @inputs
      @required
        iNdata      -> certificate (<= GetCertificates)
          files => array of objects
            {
              Name => string
              File => binary
            }
        iNtoken     -> string

  */
  const fname = 'signFile';
  LOG.fstep ( fname, 1, 0, 'INVOKE - iNdata, iNtoken, iNfunction', iNdata, iNtoken, iNfunction );

  // if token is not exist
  if ( typeof iNtoken == 'function' ) {
    var token   = __.token, client  = __.clientCrypto, iNfunction = iNtoken;
  } else {
    var token   = iNtoken||__.token, client  = __.clientCrypto;
  }

  GetCertificates (
    token,
    ( errCert, dataCert ) => {
      if (errCert) {
        //ERROR we cannot get user certificate
        var errObj = LOG.ferror ( fname, 1, 1,'We cannot get certificate', errCert, dataCert );
        iNfunction(errObj);
        return;
      }
      //SUCCESS we get certificate => sign data
      LOG.step ( fname, 1, 2,'We get certificate => sign file', errCert, dataCert );
      var cert = dataCert,
          signatureSettings = {
            'Certificate'               : cert,
            'CompressionType'           : ENUM.CompressionType.NoCompression,
            'EncodingTypeData'          : ENUM.EncodingTypeData.Binary,
            'IncludeSignerCertificate'  : false,
            'IncludeTimestamp'          : false,
            'IsDetached'                : true,
            'PinCode'                   : CRYPTOGRAM_SERT_PASSPHRASE,//'11111111',
            'SignatureType'             : ENUM.SignatureType.XmldSig // XmldSig,
          },
          params = {
            'token'               : token,
            'documents'           : iNdata.files,
            'signatureSettings'   : signatureSettings
          };

      // sign data
      client.Sign (
        params,
        (errSign, dataSign) => {
          LOG.print ( 'params', params );
          LOG.step ( fname, 1, 3, 'We start sign', errSign, dataSign );
          iNfunction (errSign, dataSign);
        }
      )
    }
  );


} _.signFile = signFile;

module.exports = _;
