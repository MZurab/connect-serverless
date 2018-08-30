import {MzDynamoDb} from "../aws/dynamo/dynamo";
import {Observable, Observer} from "rxjs";
import {Connect} from "../connect";

const tableUser = "connect-user";
let dNameForAdd;

export function getByLoginIndex ( data: any ): Observable<{err: any, data: any}> {
    if ( typeof(data) != 'object' || typeof(data['login']) != 'string') return getEmptyObservable({err: true, data: null});

    let login       = (data['login']+"").toLowerCase(),
        objForQuery = {'index': 'owner-login-index' ,'table': tableUser};


    objForQuery = MzDynamoDb.addByMask({'login':login},'login',objForQuery);
    // DINAMO.addByMask ({'login':login},'login',objForQuery);
    objForQuery = MzDynamoDb.addByMask ({'owner':'@system'},'owner',objForQuery);

    if(typeof(data['pswd']) == 'string')
        objForQuery = MzDynamoDb.addByMaskFilter (data,'pswd',objForQuery);

    if( typeof(data['phone'] )=='string')
        objForQuery = MzDynamoDb.addByMaskFilter (data,'phone',objForQuery);

    return MzDynamoDb.query(objForQuery);
}

export function getEmptyObservable (result: any = null): Observable<any> {
    return Observable.create(
        (observer: Observer<null>) => {
            observer.next(result);
            observer.complete();
        }
    );
}

export function getByPhoneIndex (data: {phone: string}): Observable<any> {
    if ( typeof(data) != 'object' || typeof(data['phone']) != 'string') return getEmptyObservable({err: true, data: null});

    let objForQuery = {'index':'owner-phone-index','table':tableUser};

    objForQuery = MzDynamoDb.addByMask (data,'phone',objForQuery);
    objForQuery = MzDynamoDb.addByMask ({'owner':'@system'},'owner',objForQuery);

    if( typeof(data['login'] ) === 'string' ) objForQuery = MzDynamoDb.addByMaskFilter (data,'login',objForQuery);

    return MzDynamoDb.query(objForQuery);
}

export function addUser (data: any): Observable<{err: any, data: any}> {
    /*
      @inputs
        @required
          login AND pswd OR login==? (its ABSTACT USER)
    */
    if (
        typeof(data)!= 'object' &&
        typeof(data['login'])!= 'string' &&
        ( data['login'] != '?' &&  data['login'] != '?' &&  typeof(data['pswd']) != 'string' )
    ) return getEmptyObservable({err: true, data: null});

    let objectForDinamo   = {},
        objectForFirebase = {},
        uInfoForDinamo    = {},
        dName             = "";

    if(typeof(data.uid) != 'string') data.uid = Connect.getRandomKeyByUuid();

    objectForDinamo   ['uid']     = data.uid;
    objectForFirebase ['uid']     = data.uid;

    if(typeof(data['owner']) != 'string')
        objectForDinamo['owner'] = '@system';
    else
        objectForDinamo['owner']    = data['owner'];

    objectForDinamo   ['login']   = data['login'].toLowerCase();
    if(data['login'] != '?')      objectForDinamo   ['pswd']    = data['pswd'];

    if ( typeof(data['lastname']) == 'string') {
        dName  = data['lastname'];
        uInfoForDinamo['lastname'] = data['lastname'];
    }
    if ( typeof(data['firstname']) == 'string') {
        dName  += " " + data['firstname'];
        uInfoForDinamo['firstname'] = data['firstname'];
    }
    if ( typeof(data['phone']) == 'string') {
        objectForDinamo['phone'] = data['phone'];
    }
    if ( typeof(data['icon']) == 'string') {
        uInfoForDinamo['icon']      = data['icon'];
        objectForFirebase['icon']   = data['icon'];
    }
    if ( typeof(data['country']) == 'string') {
        objectForDinamo['country']  = data['country'];
    }
    if ( typeof(data['lang']) == 'string') {
        objectForDinamo['lang']  = data['lang'];
    }
    if ( typeof(data['device']) == 'object') {
        objectForDinamo['device']   = data['device'];
    }
    if ( typeof(data['email']) == 'string') {
        objectForDinamo['email']    = data['email'];
        objectForFirebase['email']  = data['email'];
    }
    objectForDinamo['info'] = uInfoForDinamo;

    if(typeof(data['dname']) == 'string') dNameForAdd = data['dname']; else dNameForAdd  = dName;
    dNameForAdd  = dName.trim();
    //add dispay name for firebase if dName right isset
    if(dNameForAdd.length > 0) {
        objectForFirebase['dName'] = dNameForAdd;
        objectForDinamo['displayName'] = dNameForAdd;
    }

    return Observable.create (
        (observer: Observer<{err: any, data: any}>) => {
            MzDynamoDb.add(
                tableUser, objectForDinamo
            ).subscribe(
                (d) => {
                    if (!d.err) {
                        LFIREBASE.createUser (objectForFirebase).subscribe(
                            (d) => {
                                observer.next(d);
                                observer.complete();
                            }
                        )

                    } else {
                        observer.next(d);
                        observer.complete();
                    }
                }
            )
        }
    );
}