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

