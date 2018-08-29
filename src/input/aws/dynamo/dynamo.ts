// const AMAZON  = require("./aws");
// const AWS     = AMAZON.data;
import {Observable} from "rxjs";

export namespace AWS2 {
    export namespace Dynamo {
        const docClient = new AWS.config.data.DynamoDB.DocumentClient({
            region: "eu-west-1",
            endpoint: "https://dynamodb.eu-west-1.amazonaws.com"
        });

        export function add (table: string,data: any): Observable<any> {
            var params = {
                TableName:table,
                Item:data
            };
            docClient.put(params, function(err, data) {
                if( typeof(iNfunction) == 'function') iNfunction(err, data);
            });
        }
    }
}