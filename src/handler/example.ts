import {Callback, Context, Handler} from "aws-lambda";

const base: Handler = async (event: any, context: Context, callback: Callback) => {
    callback(null, 'Test');
};

export {base};