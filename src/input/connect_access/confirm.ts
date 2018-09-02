import {Connect} from "../connect";
import {MzDynamoDb} from "../aws/dynamo/dynamo";
import {Observable} from "rxjs";

export namespace CONFIRM {
    const tableConfirm  = "connect-confirm";
    
    export function createSmsSignInForSystem (uid: string, data: any): Observable<{err: any, data: any}> {
        data['to']      = "@system";
        data['type']    = "signin";
        data['expired'] = Connect.getTime() + (300*1000);
        return createSmsCode ( uid, data );
    }
    
    export function createSmsCode (uid: string,data: string): Observable<{err: any, data: any}> {
        data['method']  = 'sms';
        return createCode ( uid, data);
    }

    export function createCode (uid: string,data: any): Observable<{err: any, data: any}> {
        data['code'] = Connect.getRandomNubmer();
        return createToken ( uid, data);
    }
    
    export function createToken (uid: string, data: any): Observable<{err: any, data: any}> {
        let token     = Connect.getRandomKeyByUuid(),
            iNinfo    = {},
            objForAdd = {},
            time      = Connect.getTime();
        
        if ( typeof data !== 'object') data = {},iNinfo = {};
        if ( typeof data['to']       === 'string') objForAdd['to']      = data['to'];
        if ( typeof data['status']   === 'number')
            objForAdd['status']  = data['status'];
        else
            objForAdd['status']  = 0;
        if ( typeof data['type']     === 'string') objForAdd['type']    = data['type'];
        if ( typeof data['method']   === 'string') objForAdd['method']  = data['method'];
        if ( typeof data['expired']  === 'number') objForAdd['expired'] = data['expired'];
        if ( typeof data['code']     === 'string') objForAdd['code']    = data['code'];

        //@< info
        if ( typeof data['phone']     === 'string' )
            iNinfo['phone']   = data['phone'];
        if ( typeof data['device']    === 'string' )
            iNinfo['device']  = data['device'];
        if ( typeof data['uagent']    === 'string' )
            iNinfo['uagent']  = data['uagent'];
        if ( typeof data['did']    === 'string' ) // did - device id
            iNinfo['did']  = data['did'];

        if( Object.keys(iNinfo).length > 0 ) objForAdd['info'] = iNinfo;
        //@> info

        objForAdd['id']       = token;
        objForAdd['time']     = time;
        objForAdd['uid']      = uid;

        return MzDynamoDb.add( tableConfirm, objForAdd );
    }
}