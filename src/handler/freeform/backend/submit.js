//implement
const CONNECT       = require('./../../../input/connect'),
    LOG             = require('ramman-z-log'),
    CONFIRM         = require("./../../../input/connect_access/confirm"),
    FREEFORM        = require("./../../../input/connect_freeform/freeform"),
    SNS             = require("./../../../input/aws/sns"); // {'body':true}



console.log('START');

exports.handler = async (event, context, callback) => {

    LOG.on();


    // output init data
    LOG.step(0, 0, 'Init date', 'EVENT', event);
    LOG.step(1, 0, 'Init date', 'DATA', context);
    LOG.step(3, 0, 'Object', 'SNS', SNS.getObjectFromEvent(event) );

    console.log('END');

}

//
/*
{
    "Records": [
    {
        "EventSource": "aws:sns",
        "EventVersion": "1.0",
        "EventSubscriptionArn": "arn:aws:sns:eu-west-1:222322594734:freeform-submit-form:5106b09f-8241-488c-bc08-b12a94cc3be5",
        "Sns": {
            "Type": "Notification",
            "MessageId": "563bbdfb-8fbd-592b-a093-ee5037aa77ed",
            "TopicArn": "arn:aws:sns:eu-west-1:222322594734:freeform-submit-form",
            "Subject": "testing ",
            "Message": "{\"a\":\"a\",\"b\":2}",
            "Timestamp": "2018-06-26T03:41:11.655Z",
            "SignatureVersion": "1",
            "Signature": "mt4bhmdZKE/JAWki3HcefxIVtQJAw4RD4j7leyiC22nk8OSjdY9+jvwaPacqpbIMFiRVxL7rqODU0jlbNRcEvPp60v26Dm9OazPrBgokJvCiSNKMLSkwpBv63CBcMwXKX3pusVT5by53HNBfx+osJ0vPHFll4iNn/pNihwK1Z/sfo0UR0DwwO5vSpjFdjid9E1wkd9u7WyzMVNFYx6W4puGPu54ziGi6JiJCOAL/GI1Ab1tezvMnrUAsLV+RmzR9YdPiiryKGUAteDmae2wjGRv2LKAWyafXCai9rhBqe575qDk4HyXW9jNCv0EP6stGjC7KNRN03S1Aurmsu7sRmA==",
            "SigningCertUrl": "https://sns.eu-west-1.amazonaws.com/SimpleNotificationService-eaea6120e66ea12e88dcd8bcbddca752.pem",
            "UnsubscribeUrl": "https://sns.eu-west-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:eu-west-1:222322594734:freeform-submit-form:5106b09f-8241-488c-bc08-b12a94cc3be5",
            "MessageAttributes": {}
        }
    }
]
}*/
