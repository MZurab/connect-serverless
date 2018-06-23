var util    = require('util');
var spawn   = require('child_process').spawn;
var Promise = require('promise');


/**
* Sign a file.
*
* @param {object} options Options
* @param {stream.Readable} options.content Content stream
* @param {string} options.key Key path
* @param {string} options.cert Cert path
* @param {string} [options.password] Key password
* @param {function} [cb] Optional callback
* @returns {object} result Result
* @returns {string} result.pem Pem signature
* @returns {string} result.der Der signature
* @returns {string} result.stdout Strict stdout
* @returns {string} result.stderr Strict stderr
* @returns {ChildProcess} result.child Child process
*/

function sign(options, cb) {
  console.log('sign - INVOKE options',options);
return new Promise(function (resolve, reject) {
    options = options || {};

    if (!options.content)
        throw new Error('Invalid content.');

    if (!options.key)
        throw new Error('Invalid key.');

    if (!options.cert)
        throw new Error('Invalid certificate.');



    /* - https://gist.github.com/ggrandes/a57c401f1bad6bd0ffd87a557b7b5790

      openssl cms -sign -nodetach   -binary  -in 1.txt -signer 1.crt -inkey 1.key -outform SMIME  -out 1.txt.smime
    */
    //openssl smime -sign -inkey 1.key -signer 1.cer -outform pem -nodetach -binary -nocerts -passin pass:111 -in 1.txt -out 1.txt.sig



    // openssl smime -sign -nosigs -outform SMIME -in 1.txt  -signer 1.cer -inkey 1.key -out 2.b.txt -nodetach -md digest
    // openssl smime -sign -nosigs -outform SMIME -in 1.txt  -signer 1.cer -inkey 1.key -passin pass:111 -out message-signed7.txt -binary
    // openssl smime -sign -nosigs -outform SMIME -in 1.txt  -signer 1.cer -certfile 1.cer  -inkey 1.key -passin pass:111 -out message-signed1.txt -nodetach -binary
    // openssl smime -sign -nosigs -outform SMIME -in 1.txt  -signer 1.cer -inkey 1.key -passin pass:111 -out message-signed9.txt -binary -nodetach
    // openssl smime -sign -nosigs -outform SMIME -in 1.txt  -signer 1.cer -inkey 1.key -passin pass:111 -out message-signed10.txt -nodetach
    // openssl smime -sign -nosigs -in 1.txt -out 1.txt.msg -passin pass:111 -signer 1.cer

    // openssl smime -verify -in 1.txt -signer 1.cer -out 1.txt.sig

    //openssl smime -sign -inkey 1.key -signer 1.cer -outform SMIME -nodetach -passin pass:111 -in 1.txt -out 6.txt.sig
    //openssl smime -sign -inkey 1.key -signer 1.cer -certfile 1.cer -outform SMIME -passin pass:1111 -in 1.txt -out 1.txt.sig
    //openssl smime -sign -inkey 1.key -signer 1.cer  -nodetach -passin pass:1111 -in 1.txt -pk7out
    //openssl smime -sign -inkey 1.key -signer 1.cer -outform SMIME -nodetach -in 1.txt -out 2.txt.sig

    // sudo openssl smime -sign -text -signer 1.cer -inkey 1.key -outform SMIME -nodetach -in 1.txt -passin pass:111
    //openssl smime -verify -inform SMIME -in 86.txt.sig -signer 1.cer -out 1.txt.sig
    // openssl smime -verify -in 86.txt.sig -out 86-1.txt.sig

    // openssl smime -verify -in 8.txt.sig -out 86.txt.sig
    // Verification failure


    //openssl smime -sign -pk7out -inkey 1.key -signer 1.cer  -outform pem -nodetach -passin pass:111 -in 1.txt -out 7.txt.sig

    /*
    openssl smime -sign -in 1.txt -text -out 1.msg -signer certificate.cer -nodetach
    openssl smime -sign -in 1.txt -signer certificate.cer -nodetach  -passin pass:111 -out 1.cer.txt
    */

    //openssl smime -sign -text -signer %s -inkey %s -outform DER -nodetach
    var command = util.format (
        'openssl smime -sign -signer %s -inkey %s -outform SMIME -nodetach -binary ',//-text -noattr
        options.cert,
        options.key
        // options.file//
    );

    if ( options.password )
        command += util.format(' -passin pass:%s', options.password);
    console.log('command',command);

    var args = command.split(' ');
    var child = spawn(args[0], args.splice(1));

    var der = [];

    child.stdout.on('data', function (chunk) {
        der.push(chunk);
    });

    child.on('close', function (code) {
        if (code !== 0)
            reject(new Error('Process failed.'));
        else
            resolve({
                child: child,
                der: Buffer.concat(der)
            });
    });

    options.content.pipe(child.stdin);
})
    .nodeify(cb);
}

// Expose methods.
module.exports.sign = sign;
