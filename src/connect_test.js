// Import node-fetch so we have something asynchronous to demonstrate with.
// import fetch from 'node-fetch'

exports.handler = (event, context, callback) => {
  const LOG         = require('ramman-z-log');
  // const Cookie         = require('SOAP-cookie');
  const PKCS7       = require('./input/esign/pkcs7');
  var STORAGE       = require("./input/firebase/storage");
  var CRYPTOGRAMM   = require('./input/other/cryptogramm/cryptogramm');
  var STR_TO_STREEM = require('string-to-stream');
  const FS            = require('fs');
  LOG.on();
  //const STORAGE     = require("./input/firebase/storage");





  CRYPTOGRAMM.getTokenByLogin (
    'magomadov',
    (errGetTokenByLogin,dataGetTokenByLogin) => {
      LOG.print('CRYPTOGRAMM - errGetTokenByLogin,dataGetTokenByLogin',errGetTokenByLogin,dataGetTokenByLogin);


      CRYPTOGRAMM.createClientForCryptoOperation (
        () => {
          // signFile
          FS.readFile(
            './doc.pdf',
            (errFile, dataFile) => {
                LOG.print ( 'CRYPTOGRAMM.readFile - errFile, dataFile', errFile, dataFile );
                if (errFile) {
                    return;
                }

                CRYPTOGRAMM.signFile (
                  {
                    'files' : [
                      {
                        'Name' : 'docFile',
                        'File' : dataFile,
                      }
                    ]
                  },
                  (errSign, dataSign) => {
                    LOG.printObject ( 'CRYPTOGRAMM.signFile - errSign, dataSign', errSign, dataSign );
                  }
                );
            }
          );

        }
      );



    }
  );

  return;

  console.log( ' START - BREE ' );

  var SOAP = require('soap');
  // var SoapClient = require('node-SOAP-client').SoapClient;

  // var soapTwo = require('strong-SOAP').SOAP;
    console.log( ' START - SOAP',SOAP );

  var url = 'https://dssclients.taxnet.ru/Authentication/Services/Authentication.svc?singleWsdl';//'https://dssclients.taxnet.ru/Authentication/Services/Authentication.svc';
  var args = {name: 'value'};


  console.log ( ' START - BR 2' ,url);
  var options = {}, requestArgs = {};

var soapOptions = {
    // forceSoap12Headers: true,
    disableCache: true,
};


function cryptogrammInit (iN) {

}

SOAP.createClient (
    url ,
    soapOptions ,
    function (err, client) {

      console.log( 'err, client 156 ' , err, client );

      if (err) {
        return;
      }
      client.setEndpoint('https://dssclients.taxnet.ru/Authentication/Services/Authentication.svc');

      var rand = client.GetRandomForSign (
        // null,
        (a,b,c) => {
          var RandomDataForSign = b.GetRandomForSignResult.Data;

          LOG.printObject ( 'GetRandomForSign - rd ' , rd );



          var FS = require('fs');
          var stremOfRandomForSign = STR_TO_STREEM(RandomDataForSign);
          PKCS7.sign(
            {
              content   : stremOfRandomForSign,//rd,
              key       : __dirname + '/draft/' + "1.key",//path.join(__dirname, '/draft/' + "1.key"),
              cert      : __dirname + '/draft/' + "1.cer",//path.join(__dirname, '/draft/' + "1.cer"),
              password  : '111'
            }
          ).then(function (result) {
              LOG.print("signTicket result",result);
              var bufferFile    = result.der;

              // get string from buffer
              var bufferString  = bufferFile.toString();
              // cut signcode frin string
              var bufferStringAfterSplit = bufferString.split("\n\n");//\n\n
              // get si
              var signedFile = bufferStringAfterSplit[1];
              LOG.print ( "signTicket signedFile", signedFile );

              var objForSignViaIntegrator = {
                'loginUserIntegrator'   : 'magomadov',
                'integratorsKey'        : signedFile //signedFile sdata bufferString
              };

              // get token
              client.LoginViaIntegrator (
                objForSignViaIntegrator,
                (errLoginViaIntegrator,dataLoginViaIntegrator) => {
                  console.log('errLoginViaIntegrator',errLoginViaIntegrator);
                  if(errLoginViaIntegrator){
                    // context.succeed(signedFile);
                    return;
                  }
                  console.log('dataLoginViaIntegrator',dataLoginViaIntegrator);
                  LOG.printObject('dataLoginViaIntegrator',dataLoginViaIntegrator);
                  // context.succeed(signedFile);
                }
              );


              // callback(null, result.der); //result.der is the signed certificate
          }).catch(function (err) {
              LOG.print("Error signing: " + err.stack);
              // callback(err);
          });
      });

          // PKCS7.sign(
          //   {
          //     content   : __dirname + '/draft/' + "1.txt",//rd,
          //     key       : __dirname + '/draft/' + "1.key",//path.join(__dirname, '/draft/' + "1.key"),
          //     cert      : __dirname + '/draft/' + "1.cer",//path.join(__dirname, '/draft/' + "1.cer"),
          //     password  : '111'
          //   }
          // ).then(function (result) {
          //     LOG.print("signTicket result",result);
          //     var bufferFile    = result.der;
          //       // context.succeed(bufferFile);
          //     LOG.print("signTicket - bufferFile", bufferFile);
          //
          //     // STORAGE.createFile('connect-9109d.appspot.com','draft/testSign1.txt','safdsf');
          //     // STORAGE.createFile('connect-9109d.appspot.com','draft/testSign2.txt',bufferFile);
          //
          //     var bufferString  = bufferFile.toString(); //.toString('utf8');//'utf8' ascii base64 binary
          //     LOG.print("signTicket - bufferString", bufferString);
          //     var bufferStringAfterSplit = bufferString.split("\n\n");//\n\n
          //     LOG.print("signTicket bufferStringAfterSplit.length", bufferStringAfterSplit.length );
          //     LOG.printObject ("signTicket bufferStringAfterSplit", bufferStringAfterSplit);
          //     var signedFile = bufferStringAfterSplit[1];
          //     LOG.print ( "signTicket signedFile", signedFile );
          //
          //
          //     // var url = signedFile;
          //     // var sdata = [];
          //     // for (var i = 0; i < url.length; i++){
          //     //     sdata.push(url.charCodeAt(i));
          //     // }
          //
          //
          //     // LOG.printObject("signTicket sdata", sdata);
          //
          //     var objForSignViaIntegrator = {
          //       'loginUserIntegrator'   : 'magomadov',
          //       'integratorsKey'        : signedFile //signedFile sdata
          //     };
          //     LOG.printObject("signTicket objForSignViaIntegrator", objForSignViaIntegrator);
          //
          //
          //     client.LoginViaIntegrator(
          //       objForSignViaIntegrator,
          //       (errLoginViaIntegrator,dataLoginViaIntegrator) => {
          //         console.log('errLoginViaIntegrator',errLoginViaIntegrator);
          //         if(errLoginViaIntegrator){
          //           // context.succeed(signedFile);
          //           return;
          //         }
          //         console.log('dataLoginViaIntegrator',dataLoginViaIntegrator);
          //         LOG.printObject('dataLoginViaIntegrator',dataLoginViaIntegrator);
          //         // context.succeed(signedFile);
          //       }
          //     );
          //
          //
          //     // callback(null, result.der); //result.der is the signed certificate
          // }).catch(function (err) {
          //     LOG.print("Error signing: " + err.stack);
          //     // callback(err);
          // });


          // console.log( 'GetRandomForSign - b.GetRandomForSignResult' , b.GetRandomForSignResult );

        }
      );
      // var args = {
      //   login : 'magomadov',
      //   password : '',
      // };
      // client.MyFunction(args, function(err, result) {
      //     console.log(result);
      // });
//   }
// );


  // STORAGE.getSignedUrlForRead3Hour('connect-9109d.appspot.com','public/5.mp3').then(results => {
  //   var url = results[0].replace('https://storage.googleapis.com/connect-9109d.appspot.com','https://gstorage.ramman.net');
  //       LOG.printObject('getSignedUrlForRead3Hour SUCCESS results',results);
  //
  //   LOG.printObject('getSignedUrlForRead3Hour SUCCESS',`The signed url for ${filename} is ${url}.`);
  // })
  // .catch( err => {
  //   LOG.print('getSignedUrlForRead3Hour ERROR', err);
  // });




//
//   var CONNECT    = require('./input/connect');
//   var LOG    = require('./input/log');
//   var FIREBASE     = require("./input/firebase/firebase");
//   var FADMIN = FIREBASE['admin'];
//
//   LOG.on()
//
//   LOG.printObject('START 1');
//   LOG.print('FADMIN.auth()',FADMIN.auth());
//   LOG.print('FADMFIREBASEIN',FIREBASE);
//   var uid = "bac255e1-6a59-4181-bfb9-61139e38630e";
//   var clams = {
//     "bac255e1-6a59-4181-bfb9-61139e38630e"    : true,
//     "769b72df-6e67-465c-9334-b1a8bfb95a1a2"   : true,
//     "01bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "02bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "03bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "04bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "05bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "06bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "07bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "08bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//
//
//     "18bac255e1-6a59-4181-bfb9-61139e38630e"    : true,
//     "09769b72df-6e67-465c-9334-b1a8bfb95a1a2"   : true,
//     "10bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "11bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "12bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "13bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "14bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "15bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "16bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "17bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//
//
//     "19bac255e1-6a59-4181-bfb9-61139e38630e"    : true,
//     "20769b72df-6e67-465c-9334-b1a8bfb95a1a2"   : true,
//     "21bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "22bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "23bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "24bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "25bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "26bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "27bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "28bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//
//
//     "29c255e1-6a59-4181-bfb9-61139e38630e"    : true,
//     "30769b72df-6e67-465c-9334-b1a8bfb95a1a2"   : true,
//     "31bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "32bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "33bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "34bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "35bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "36bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "37bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "38bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//
//
//     "39bac255e1-6a59-4181-bfb9-61139e38630e"    : true,
//     "40769b72df-6e67-465c-9334-b1a8bfb95a1a2"   : true,
//     "41bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "42bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "43bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "44bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "45bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "46bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "47bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "48bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//
//
//     "49ac255e1-6a59-4181-bfb9-61139e38630e"    : true,
//     "50769b72df-6e67-465c-9334-b1a8bfb95a1a2"   : true,
//     "51bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "52bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "53bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "54bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "55bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "56bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "57bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "58bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//
//
//     "59bac255e1-6a59-4181-bfb9-61139e38630e"    : true,
//     "60769b72df-6e67-465c-9334-b1a8bfb95a1a2"   : true,
//     "61bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "62bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "63bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "64bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "65bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "66bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "67bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "68bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//
//
//     "69bac255e1-6a59-4181-bfb9-61139e38630e"    : true,
//     "100769b72df-6e67-465c-9334-b1a8bfb95a1a2"   : true,
//     "101bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "102bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "103bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "104bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "105bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "106bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "107bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "108bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//
//
//     "109bac255e1-6a59-4181-bfb9-61139e38630e"    : true,
//     "110769b72df-6e67-465c-9334-b1a8bfb95a1a2"   : true,
//     "111bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "112bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "113bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "114bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "115bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "116bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "117bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "118bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//
//
//     "69bac255e1-6a59-4181-bfb9-61139e38630e"    : true,
//     "70769b72df-6e67-465c-9334-b1a8bfb95a1a2"   : true,
//     "71bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "72bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "73bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "74bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "75bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "76bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "77bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "78bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//
//
//     "79bac255e1-6a59-4181-bfb9-61139e38630e"    : true,
//     "80769b72df-6e67-465c-9334-b1a8bfb95a1a2"   : true,
//     "81bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "82bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "83bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "84bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "85bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "86bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "87bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "88bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//
//
//     "89bac255e1-6a59-4181-bfb9-61139e38630e"    : true,
//     "90769b72df-6e67-465c-9334-b1a8bfb95a1a2"   : true,
//     "91bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "92bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "93bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "94bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "95bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "96bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "97bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "98bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//
//
//     "99bac255e1-6a59-4181-bfb9-61139e38630e"    : true,
//     "120769b72df-6e67-465c-9334-b1a8bfb95a1a2"   : true,
//     "121bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "122bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "123bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "124bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "125bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "126bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "127bac255e1-6a59-4181-bfb9-61139e38630e"  : true,
//     "128bac255e1-6a59-4181-bfb9-61139e38630e"  : true
//   };
// // Lookup the user associated with the specified uid.
//   //  FADMIN.auth().getUser(uid).then(
//   //    (userRecord) => {
//   //      // The claims can be accessed on the user record.
//   //      LOG.printObject(userRecord.customClaims.admin);
//   //      LOG.printObject (userRecord );
//   //      context.succeed(userRecord);
//   //    }
//   // );
//
//   // FADMIN.auth().setCustomUserClaims (uid, clams ).then(
//   //    () => {
//   //     // The new custom claims will propagate to the user's ID token the
//   //     // next time a new one is issued.
//   //     LOG.printObject('Success');
//   //     context.succeed(userRecord);
//   //   }
//   // );;
//
//
//   var http = require("https");
//
//   var request = require("request");
//
//   var options = { method: 'GET',
//     url: 'https://api.ipify.org/',
//     qs: { format: 'json' },
//     headers:
//      { 'postman-token': '613002bf-0bad-6f6c-3b05-beb371f9db82',
//        'cache-control': 'no-cache' } };
//
//   request(options, function (error, response, body) {
//     if (error) throw new Error(error);
//     LOG.printObject('body',body);
//     context.succeed(body);
//   });
//
//
//
//  //  FADMIN.auth().getUser(uid).then((userRecord) => {
//  //   // The claims can be accessed on the user record.
//  //   LOG.printObject(userRecord.customClaims.admin);
//  //   context.succeed(userRecord);
//  // });




// A simple wrapper around fetch() to log the request and response.
// async function fetchAndLog(uri) {
//     LOG.printObject('Fetching ' + uri)
//
//     // These two statements are asynchronous,
//     // but look almost like synchronous code.
//     const response = await fetch(uri)
//     const responseText = await response.text()
//
//     LOG.printObject('Received ' + responseText)
// }

// It's not possible to use await at the top level, so we need a simple async
// function wrapper.
// (async () => {
//     // These two operations are executed in series, despite being asynchronous.
//     await fetchAndLog('https://httpbin.org/get?request=a')
//     await fetchAndLog('https://httpbin.org/get?request=b')
//
//     // These two operations are executed in parallel, and execution resumes when
//     // both are finished.
//     await Promise.all([
//         fetchAndLog('https://httpbin.org/get?request=c'),
//         fetchAndLog('https://httpbin.org/get?request=d'),
//     ])
// })();


}


// exports.handler = (event, context, callback) => {
//     //implement
//     var CONNECT     = require('./input/connect');
//     const LOG       = require('ramman-z-log');
//     //var DINAMO      = require("./input/aws/dinamo");
//     //var ACCESS      = require("./input/connect_access/access");
//     var CONFIRM     = require("./input/connect_access/confirm");
//     // var USER        = require("./input/connect_users/users");
//     // var CATEGORY    = require("./input/connect_category/category");
//
//     var CHAT        = require("./input/connect_chat/chat");
//     var USER        = require("./input/connect_users/users");
//     // var DICTIONARY    = require("./input/connect_dictionary/dictionary");
//     // var PAGE      = require("./input/connect_page/page");
//     // var FIREBASE  = require("./input/firebase/firebase");
//
//     // log on
//     LOG.on();
//
//     CONNECT.setHeader(event);
//     var HEADER = CONNECT.getHeader(['*']);
//     var DATA   = HEADER['data'];
//     var TYPE   = HEADER['type'];
//
//     var apiType  = CONNECT.getUrlParam('typeUrl');
//     var apiLogin   = CONNECT.getUrlParam('userUrl');
//
//
//     // output init data
//     LOG.step(0, 0, 'Init date', 'EVENT', event, 'DATA', DATA, 'TYPE',TYPE, apiType, apiLogin );
//
//     if (
//         typeof(apiType) == 'string' && typeof(apiLogin) == 'string'
//     ) {
//
//
//       if (apiType == 'createPrivateChat') {
//         // get user public with categories and all info via token, uid from GET
//         var myUID   = DATA['uid'], myTOKEN = DATA['token'], result = {}, pseudouser = DATA['pseudouser'], activeUser;
//
//         var functionGetUserByLogin = (errUser,dataUser) => {
//           if (errUser || dataUser.Count < 1 ) {
//             //ERROR (1.5) We cannot get user by login
//             var errorObject = LOG.defaultErrorMessage(1,5,'We cannot get user by login' ,errUser,dataUser);
//             result['status']  = 0;
//             result['error']   = errorObject;
//             context.succeed(result);
//             return;
//           }
//           //SUCCESS (1) We get user by login -> we get main chat id
//           LOG.step(1,5,'We get user by login -> we get main chat id ' ,errUser, dataUser);
//
//           var thisUserData  = dataUser.Items[0],
//               thisUserId    = thisUserData['uid'];
//
//           ///
//           CHAT.getChiefChatIdByUid (
//             activeUser,thisUserId,
//             function (chatData) {
//               if ( !chatData ) {
//                 //ERROR (1.6) This chat is not exist -> get triggers for chat
//                 var errorObject   = LOG.defaultErrorMessage(1,6,'This chat is not exist -> get triggers for chat' , chatData);
//
//
//                 var func_from7step = (iNusers) => {
//                   // create main chat with iNusers
//                   CHAT.addMainChat (
//                     { 'with':activeUser,      'users':[thisUserId].concat(dataTrigger.payload.users)  },
//                     { 'with':thisUserId,      'users':[activeUser]  },
//                     '@system',
//                     (errMainChat,dataMainChat) => {
//                       if (errMainChat) {
//                         //ERROR (1.8.1) We cannot create main chat -> output error
//                         var errorObject   = LOG.defaultErrorMessage(1,8.1,'We cannot create main chat' , errMainChat, dataMainChat);
//                         result['status']  = 0;
//                         result['error']   = errorObject;
//                         context.succeed(result);
//                         return;
//                       }
//
//                       //SUCCESS (1.8.1) We created main chat -> output result
//                       LOG.step(1,8.1,'We createed main chat -> create main chat with rule from trigger',errMainChat,dataMainChat);
//
//                       result['status'] = 1;
//                       result['chat']   = dataMainChat['chatId'];
//                       context.succeed(result);
//                       return;
//
//                     }
//                   );
//                 }
//
//                 USER.trigger.getTriggerByEventCreatingMainChat (
//                   thisUserId,
//                   {},
//                   (errTrigger,dataTrigger) => {
//                     if ( errTrigger || typeof dataTrigger.payload != 'object') {
//                       //ERROR (1.7) This user has not trigger for event - create main chat in usual mode
//                       var errorObject   = LOG.defaultErrorMessage(1,7,'This user has not trigger for event' , errTrigger, dataTrigger);
//                       // create main chat in usual mode
//                       func_from7step ( [thisUserId]) );
//
//
//                       // CHAT.addMainChat (
//                       //   { 'with':activeUser,      'users':[thisUserId]  },
//                       //   { 'with':thisUserId,      'users':[activeUser]  },
//                       //   '@system',
//                       //   (errMainChat,dataMainChat) => {
//                       //     if (errMainChat) {
//                       //       //ERROR (1.8) We cannot create main chat -> output error
//                       //       var errorObject   = LOG.defaultErrorMessage(1,8,'We cannot create main chat' , errMainChat, dataMainChat);
//                       //       result['status']  = 0;
//                       //       result['error']   = errorObject;
//                       //       context.succeed(result);
//                       //       return;
//                       //     }
//                       //
//                       //     //SUCCESS (1.8) We created main chat -> output result
//                       //     LOG.step(1,8,'We createed main chat -> create main chat with rule from trigger',errMainChat,dataMainChat);
//                       //
//                       //     result['status'] = 1;
//                       //     result['chat']   = dataMainChat['chatId'];
//                       //     context.succeed(result);
//                       //     return;
//                       //
//                       //   }
//                       // );
//
//
//                       // CHAT.addPrivateChat (
//                       //   {
//                       //     'uid':myUID,
//                       //     'for':thisUserId
//                       //   } ,
//                       //   ( errChatToken, dataChatToken ) => {
//                       //
//                       //     if (errChatToken) {
//                       //       //ERROR (1.4) We cannot create main chat -> output error
//                       //       var errorObject   = LOG.defaultErrorMessage(1,4,'We cannot create main chat' , errChatToken, dataChatToken);
//                       //       result['status']  = 0;
//                       //       result['error']   = errorObject;
//                       //       context.succeed(result);
//                       //       return;
//                       //     }
//                       //     //SUCCESS (1.4) We created main chat -> output result
//                       //     LOG.step(1,4,'This user has not trigger for event - create main chat with rule from trigger',errChatToken, dataChatToken);
//                       //
//                       //     result['status'] = 1;
//                       //     result['chat']   = dataChatToken['chatId'];
//                       //     context.succeed(result);
//                       //     return;
//                       //   }
//                       // );
//                       return;
//                     }
//
//                     //SUCCESS (1.7) This user has trigger for event - create main chat with rule from trigger
//                     LOG.step(1,7,'This user has trigger for event - create main chat with rule from trigger', errTrigger, dataTrigger);
//
//                     switch (dataTrigger.type) {
//                       case 'toPseudoUser':
//                         //SUCCESS (1.7) This trigger type - toPseudoUser => creating chat with add extra users
//                         LOG.step(1,7.1,'This trigger type - toPseudoUser => creating chat with add extra users', dataTrigger);
//                         func_from7step ( [thisUserId].concat(dataTrigger.payload.users) );
//                       break;
//
//
//                       case 'toBotDialogFlow':
//                         //SUCCESS (1.7) This trigger type - toBotDialogFlow => creating chat with add trigger
//                         LOG.step(1,7.1,'This trigger type - toPseudoUser => creating chat with add extra users', dataTrigger);
//                         func_from7step ( [thisUserId].concat(dataTrigger.payload.users) );
//                       break;
//
//                       default:
//                         //ERROR (1.7.1) This user has not trigger for event => output error
//                         var errorObject   = LOG.defaultErrorMessage(1,7.1,'This user has not trigger for event' , dataTrigger.type );
//                         result['status']  = 0;
//                         result['error']   = errorObject;
//                         context.succeed(result);
//                       break;
//
//                     }
//
//                     func_from7step ( [thisUserId].concat(dataTrigger.payload.users) );
//
//
//                     return;
//                   }
//                 )
//                 return;
//               }
//
//               //SUCCESS (1.6) The chat has already exist -> output chatid
//               LOG.step(1,6,'The chat is exist -> output result', chatData );
//
//               result['status']  = 1;
//               result['chat']    = chatData;
//               context.succeed(result);
//               return;
//
//             }
//           );
//             ///
//         }
//
//         if( typeof(DATA['uid']) == 'string' && typeof DATA['token'] == 'string' ) {
//           //SUCCESS (1.0) Authed mode -> check user token
//           LOG.step(1,0,'Authed mode', DATA );
//
//           CONFIRM.getSignInSmsToken (
//               myUID ,
//               {'token':myTOKEN,'status':5},
//               function (errCheckToken,dataCheckToken) {
//
//               if( errCheckToken || dataCheckToken.Count < 1 ) {
//                 //ERROR (1.2) This token is not valid -> output error
//                 var errorObject = LOG.defaultErrorMessage(1,2,'This token is not valid' , errCheckToken, dataCheckToken );
//                 result['status']  = 0;
//                 result['error']   = errorObject;
//                 context.succeed(result);
//                 return;
//               }
//
//               //SUCCESS (1.2) This token is legal -> check request for isset pseudouuser
//               LOG.step(1, 2, 'This token is legal => check request for isset pseudouuser', errCheckToken, dataCheckToken );
//
//
//               if( typeof DATA['pseudouser'] != 'string' || myUID == pseudouser) {
//                 //ERROR (1.3)  In request has not pseudouser -> we get chat in usial mode
//                 var errorObject = LOG.defaultErrorMessage(1,3,'In request has not pseudouser' , DATA, myUID, pseudouser);
//                 activeUser = myUID;
//                 USER.getUserByLogin (apiLogin,'@system',functionGetUserByLogin);
//                 return;
//               }
//
//               //SUCCESS (1.3) In request has pseudouser => we check acces to pseudouser
//               LOG.step(1, 3, 'In request has pseudouser => we check acces to pseudouser', DATA, myUID, pseudouser );
//
//               USER.checkAccessToPseudoUser (
//                 myUID,
//                 pseudouser,
//                 ( errAccessToPseudoUser, dataPseudoUser ) => {
//                   if (errAccessToPseudoUser) {
//                     //ERROR (1.3.1) This user has not access to pseudouser => output error
//                     var errorObject = LOG.defaultErrorMessage(1,3.1,'This user has not access to pseudouser' , errAccessToPseudoUser, dataPseudoUser );
//                     result['status']  = 0;
//                     result['error']   = errorObject;
//                     context.succeed(result);
//                     return;
//                   }
//
//                   //SUCCESS (1.3.1) This user has access to pseudouser => chat for activeUser
//                   LOG.step(1, 3.1, 'This token is legal ->  getchat for pseudouser', errCheckToken, dataCheckToken );
//                   activeUser = pseudouser;
//                   USER.getUserByLogin (apiLogin,'@system',functionGetUserByLogin);
//                   return;
//                 }
//               );
//
//
//             }
//           );
//           return;
//         }
//
//         //ERROR (1.0) This user is unsigned -> get chat for unsigned user
//         var errorObject = LOG.defaultErrorMessage(1, 0, 'This user is unsigned' , DATA );
//         USER.getPublicUserByLogin ( apiLogin, '@system', functionGetUserByLogin );
//
//
//       } // create chat
//
//     }
//
// }
