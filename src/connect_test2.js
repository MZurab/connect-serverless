exports.handler = (event, context, callback) => {

    const SNS       = require("./input/aws/sns");


    console.log('start');
    // for (let i = 0; i<100; i++) {
    //     console.log('i',i);
    //     if( i === 0) {
    //         console.log('CALLBACK',i);
    //         callback(true);
    //     }
    // }


    SNS.sendMessage({'body':true},'')
}