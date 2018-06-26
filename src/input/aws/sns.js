// const AMAZON  = require("./aws");
// const AWS     = AMAZON.data;
const AWS        = require("aws-sdk");
// AWS.sn
// AWS.config.update({ region: 'eu-west-1'}); // accessKeyId: 'ZZZ', secretAccessKey: 'ZZZ',

// var AWS = require('aws-sdk');
// AWS.config.region = 'eu-west-1';

// const CONNECT   = require('./../connect');

const sns = new AWS.SNS(
//     {
//     region: "eu-west-1"
// }
);

function sendMessage (iNmessage, iNarn) {

    // clear congifg
    // AWS.config.update({});
    // AWS.

    return new Promise (
        (resolve) => {
            let sendString = iNmessage;
            if ( typeof (iNmessage) === 'object' ) {
                sendString = JSON.stringify(iNmessage)
            }
            // sns.publish()
            sendString = sendString + '';
            sns.publish (
                {
                    Message     : sendString, // 'Test publish to SNS from Lambda'
                    TopicArn    : iNarn, // 'TOPIC_ARN'
                    Subject     : "testing "
                },
                (err, data) => {
                    console.log('sendMessage 114 - err', err );
                    console.log('sendMessage 115 - data', data );
                    if (err) {
                        resolve(null);
                        return;
                    }
                    resolve(data);
                }
            );
        }
    );
}
module.exports.sendMessage = sendMessage;

function getTextFromEvent (iNeventObject) {
    let event = iNeventObject, r = null;
    if (
        event &&
        event['Records'] &&
        event['Records'][0] &&
        event['Records'][0]['Sns'] &&
        event['Records'][0]['Sns']['Message']
    ) {
        r = event['Records'][0]['Sns']['Message'];
    }

    return r;
}
module.exports.getTextFromEvent = getTextFromEvent;



function getObjectFromEvent (iNeventObject) {
    let event = iNeventObject, text = getTextFromEvent(event), r;
    if (
        text
    ) {
        r = JSON.parse(text);
    }
    return r;
}
module.exports.getObjectFromEvent = getObjectFromEvent;
