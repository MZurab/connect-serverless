
import {Observable, Observer} from "rxjs";
import {Amazon} from "../amazon";
import {
    AwsDynamoDefaultResponseType,
    AwsDynamoDelType,
    AwsDynamoUpdateType,
    DynamoQueryInputType
} from "./res/@abstract/@type/common.type";
import {DynamoOrderTypeEnum} from "./res/@abstract/@enum/common.enum";

export namespace MzDynamoDb {
    const docClient = new Amazon.config.DynamoDB.DocumentClient({
        region:      "eu-west-1",
        endpoint:   "https://dynamodb.eu-west-1.amazonaws.com"
    });

    export function add (table: string,data: any): Observable<AwsDynamoDefaultResponseType> {
        return Observable.create(
            (observer: Observer<AwsDynamoDefaultResponseType>) => {
                let params = {
                    TableName:table,
                    Item:data
                };
                docClient.put(params, function(err, data) {
                    observer.next({err, data});
                    observer.complete();
                });
            }
        )
    }
    
    export function del (obj: AwsDynamoDelType): Observable<AwsDynamoDefaultResponseType> {
        return Observable.create(
            (observer: Observer<AwsDynamoDefaultResponseType>) => {
                let params: any = {
                    TableName : obj.table,
                    Key: obj.key,
                };
                if( typeof(obj.vals) !== 'undefined' && obj.vals !== false)
                    params.ExpressionAttributeValues = obj.vals;
                if( typeof(obj.mask) !== 'undefined' && obj.cond !== false)
                    params.ConditionExpression = obj.cond;
                if( typeof(obj.keys) !== 'undefined' && obj.keys !== false)
                    params.ExpressionAttributeNames = obj.keys; // "#yr": "year"

                docClient.delete(params, function(err, data) {
                    if (err) {
                        console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
                    }
                    observer.next({err, data});
                    observer.complete();
                });
            }
        );
        
    }
    
    export function update (obj: AwsDynamoUpdateType): Observable<AwsDynamoDefaultResponseType> {
        return Observable.create(
            (observer: Observer<AwsDynamoDefaultResponseType>) => {
                let params: any = {
                    TableName : obj.table,
                    ReturnValues:"UPDATED_NEW"
                };
                if( typeof obj.keys  !== 'undefined' && obj.keys !== false)
                    params.ExpressionAttributeNames = obj.keys; // "#yr": "year"


                if( typeof obj.key  !== 'undefined' && obj.key !== false)
                    params.Key = obj.key; //{ "year": year, "title": title }

                if( typeof obj.set  !== 'undefined' && obj.set !== false)
                    params.UpdateExpression = obj.set; // "set info.rating = :r, info.plot=:p, info.actors=:a"

                if( typeof obj.vals  !== 'undefined' && obj.vals !== false)
                    params.ExpressionAttributeValues = obj.vals; // ":yyyy":1985
                
                docClient.update(params, function(err, data) {
                    if (err) {
                        console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                    } else {
                        // LOG.printObject("UpdateItem succeeded:", JSON.stringify(data, null, 2));
                    }
                    observer.next({err, data});
                    observer.complete();
                });
            }
        )
    }

    export function query (obj: DynamoQueryInputType): Observable<AwsDynamoDefaultResponseType> {
        return Observable.create(
            (observer: Observer<AwsDynamoDefaultResponseType>) => {
                let params: any = {
                    TableName : obj.table
                };

                if( typeof(obj.limit) != 'undefined' )
                    params.Limit = obj.limit;

                if( typeof(obj.last) != 'undefined' )
                    params.ExclusiveStartKey = obj.last;

                if( typeof(obj.index) != 'undefined' )
                    params.IndexName = obj.index;

                if( typeof(obj.order) != 'undefined' ) {
                    if(obj.order === DynamoOrderTypeEnum.desc){
                        params.ScanIndexForward = false;
                    } else {
                        params.ScanIndexForward = true;
                    }
                }
                if( typeof(obj.maskFilter) != 'undefined' && obj.maskFilter !== false)
                    params.FilterExpression = obj.maskFilter; //"#yr = :yyyy",

                if( typeof(obj.select) != 'undefined' && obj.select !== false)
                    params.ProjectionExpression = obj.select; // "#yr, title, info.genres, info.actors[0]",

                if( typeof(obj.mask) != 'undefined' && obj.mask !== false)
                    params.KeyConditionExpression = obj.mask; //"#yr = :yyyy",

                if( typeof(obj.keys) != 'undefined' && obj.keys !== false)
                    params.ExpressionAttributeNames = obj.keys; // "#yr": "year"

                if( typeof(obj.vals) != 'undefined' && obj.vals !== false)
                    params.ExpressionAttributeValues = obj.vals; // ":yyyy":1985

                let data = {'Count':0,"Items":[],"Counter":0,"ScannedCount":0};

                function callback (err, d) {
                    // LOG.printObject('DinamoDbQuery err',err);
                    if(err) {
                        observer.next({err, data: null});
                        observer.complete();
                        return;
                    }

                    data["Counter"]++;
                    if(d.Count > 0) {
                        data['Items'] = data['Items'].concat(d.Items);
                        data['Count'] += d.Count;
                    }
                    data['ScannedCount'] += d.ScannedCount;
                    // LOG.printObject("inF",dataResult["Counter"],dataResult['Count']);
                    if (typeof(d.LastEvaluatedKey) === 'object'){
                        params.ExclusiveStartKey = d.LastEvaluatedKey;
                        docClient.query( params , callback );
                    } else {
                        // onQuery(err,dataResult);

                        observer.next({err, data});
                        observer.complete();
                    }
                }
                docClient.query (params, callback);
            }
        )
    }


    export function scan (obj: DynamoQueryInputType): Observable<AwsDynamoDefaultResponseType> {
        return Observable.create(
            (observer: Observer<AwsDynamoDefaultResponseType>) => {
                let params: any = { TableName : obj.table };

                if( typeof(obj.limit) != 'undefined' )
                    params.Limit = obj.limit;

                if( typeof(obj.last) != 'undefined' )
                    params.ExclusiveStartKey = obj.last;

                if( typeof(obj.index) != 'undefined' )
                    params.IndexName = obj.index;

                if( typeof(obj.order) != 'undefined' ) {
                    if(obj.order == 'desc'){
                        params.ScanIndexForward = false;
                    } else {
                        params.ScanIndexForward = true;
                    }
                }
                if( typeof(obj.select) != 'undefined' && obj.select !== false)
                    params.ProjectionExpression = obj.select; // "#yr, title, info.genres, info.actors[0]",

                if( typeof(obj.mask) != 'undefined' && obj.mask !== false)
                    params.FilterExpression = obj.mask; //"#yr = :yyyy",

                if( typeof(obj.keys) != 'undefined' && obj.keys !== false)
                    params.ExpressionAttributeNames = obj.keys; // "#yr": "year"

                if( typeof(obj.vals) != 'undefined' && obj.vals !== false)
                    params.ExpressionAttributeValues = obj.vals; // ":yyyy":1985

                docClient.scan(
                    params,
                    (err, data) => {
                        observer.next({err, data});
                        observer.complete();
                    }
                );
            }
        );
    }

    export function addByMask (iNdata: any,iNname: any,iNresult?: any,iNtype?: any,iNmark?: any) {
        return _addBy(iNdata, iNname, iNresult, iNtype, iNmark,"mask");
    }
    export function addByMaskFilter (iNdata: any,iNname: any,iNresult?: any,iNtype?: any,iNmark?: any) {
        return _addBy(iNdata, iNname, iNresult, iNtype, iNmark,"maskFilter");
    }

        function _addBy (iNdata: any,iNname: any,iNresult: any,iNtype: any,iNmark: any,iNmaskType: any): any {
            if (
                typeof(iNdata) != 'object' ||
                typeof(iNname) != 'string' ||
                typeof(iNmaskType) != 'string'
            ) return false;

            if ( typeof(iNmark) != 'string' ) iNmark = "=";
            if ( typeof(iNtype) != 'string' ) iNtype = "string";

            if(iNmaskType == 'mask')
                iNresult = checkForMask(iNresult);
            else if (iNmaskType == 'maskFilter')
                iNresult = checkForMaskFilter(iNresult);
            let arrayOfNames: any = iNname.split('.'),
                nameForAdd,
                valNameForAdd,
                nameArrayForAdd = [];
            for (let iKey in arrayOfNames) {
                // iKey *= 1; - I DONT WHY IS NEED

                if(arrayOfNames.length == (iKey+1) ){
                    // add value if last
                    if ( typeof(iNdata[arrayOfNames[iKey]]) != iNtype ) return false;
                    iNresult['vals'][":"+arrayOfNames[iKey]] = iNdata[arrayOfNames[iKey]];
                    valNameForAdd = ':' + arrayOfNames[iKey];
                }
                // add key to path
                iNresult['keys'][`#${arrayOfNames[iKey]}`] = arrayOfNames[iKey];
                // @ts-ignore
                nameArrayForAdd.push(`#${arrayOfNames[iKey]}`);
            }
            nameForAdd = nameArrayForAdd.join('.');
            if ( iNresult[iNmaskType].length > 0 ) iNresult[iNmaskType] += " and " ;
            iNresult[iNmaskType] +=  nameForAdd + " " + iNmark + " " + valNameForAdd;
            return iNresult;
        }

            function checkForMask (iNresult: any): any {
                return checkPrivate(iNresult,"mask");
            }
            function checkForMaskFilter (iNresult: any) : any{
                return checkPrivate(iNresult,"maskFilter");
            }

                function checkPrivate (iNresult: any,iNname: any): any {
                    if ( typeof(iNresult) != 'object' ) iNresult = {};
                    if ( typeof(iNresult['keys']) != 'object' ) iNresult['keys'] = {};
                    if ( typeof(iNresult['vals']) != 'object' ) iNresult['vals'] = {};
                    if ( typeof(iNresult[iNname]) != 'string' ) iNresult[iNname] = '';
                    return iNresult;
                }
}