import {DynamoOrderTypeEnum} from "../@enum/common.enum";

export type AwsDynamoDelType = {
    /*
     1 - iNobject
     @required
       table       String
       key         Object
     @optional
       vals        String (":val": 5.0)
       mask        String ("info.rating <= :val")
       keys
    */
    table: string,
    key: string | number,
    vals?: any,
    mask?: any,
    keys?: any,
    cond?: any
}

export type AwsDynamoDefaultResponseType = {
    err: any,
    data: any
}

export type AwsDynamoUpdateType = {
    /*
     @inputs
       @required
         1 - iNobject -> object
           @required
             table
             key
             set
             vals
             keys
         2 - iNfunction -> function
     */
    table: string,
    key: any,
    set: any,
    vals: any,
    keys: any
}

export type DynamoQueryInputType = {
    table: string,
    limit?: any,
    last?: string,
    index?: string,
    order?: DynamoOrderTypeEnum,
    maskFilter?: any,
    select?: any,
    mask?: any,
    keys?: any,
    vals?: any
}