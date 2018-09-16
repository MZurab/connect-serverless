import {Callback, Context, Handler} from "aws-lambda";

// import * as CONNECT './input/connect');
// import * as LOG     'ramman-z-log');

const base: Handler = async (event: any, context: Context, callback: Callback) => {
    callback(null, 'Test');
};

export {base};