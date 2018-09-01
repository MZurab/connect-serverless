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
    
    export function createToken (uid: string, iNdata: any): Observable<{err: any, data: any}> {
        let token     = Connect.getRandomKeyByUuid(),
            iNinfo    = {},
            objForAdd = {},
            time      = Connect.getTime();
        
        if ( typeof iNdata !== 'object') iNdata = {},iNinfo = {};
        if ( typeof iNdata['to']       === 'string') objForAdd['to']      = iNdata['to'];
        if ( typeof iNdata['status']   === 'number')
            objForAdd['status']  = iNdata['status'];
        else
            objForAdd['status']  = 0;
        if ( typeof iNdata['type']     === 'string') objForAdd['type']    = iNdata['type'];
        if ( typeof iNdata['method']   === 'string') objForAdd['method']  = iNdata['method'];
        if ( typeof iNdata['expired']  === 'number') objForAdd['expired'] = iNdata['expired'];
        if ( typeof iNdata['code']     === 'string') objForAdd['code']    = iNdata['code'];

        //@< info
        if ( typeof iNdata['phone']     === 'string' )
            iNinfo['phone']   = iNdata['phone'];
        if ( typeof iNdata['device']    === 'string' )
            iNinfo['device']  = iNdata['device'];
        if ( typeof iNdata['uagent']    === 'string' )
            iNinfo['uagent']  = iNdata['uagent'];
        if ( typeof iNdata['did']    === 'string' ) // did - device id
            iNinfo['did']  = iNdata['did'];

        if( Object.keys(iNinfo).length > 0 ) objForAdd['info'] = iNinfo;
        //@> info

        objForAdd['id']       = token;
        objForAdd['time']     = time;
        objForAdd['uid']      = uid;

        return MzDynamoDb.add( tableConfirm, objForAdd );
    }
}