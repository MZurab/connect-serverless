import {USER} from "../../../../../input/connect_access/user";
import {CONFIRM} from "../../../../../input/connect_access/confirm";
import {Connect} from "../../../../../input/connect";
import {Observable, Observer} from "rxjs";
import {Mock} from "./auth-signin.mock";

// import {Observable, Observer} from "rxjs";
// import {MzDynamoDb} from "../../../input/aws/dynamo/dynamo";
// import {DictionaryType} from "./res/@abstract/@type/common.type";
// import * as crypto from 'crypto';

export namespace AuthSignIn {

    export function isTestUser (user, pswd): boolean {
        return (user === Mock.Request.AuthSignIn.user && pswd === Mock.Request.AuthSignIn.pswd);
    }

    export async function did (user: string, pswd: string): Promise<any> {

        let userDataAnswer = await USER.getByLoginIndex(
            {
                'login' : user,
                'pswd'  : pswd
            }
        ).toPromise();

        if (userDataAnswer.err) {
            return Connect.returnPromiseWithValue({'status':0, 'ru':'Пользователь не найден.'});
        } else if (userDataAnswer.data.Count < 1 ) {
            return Connect.returnPromiseWithValue({'status':0,'ru':'Неправильный логин или пароль'});
        }

        let userData        = userDataAnswer.data.Items[0],
            loginIN         = userData.login,
            phoneIN         = userData.phone,
            uid             = userData.uid,
            userInfo        = userData.info,
            displayName     = userData.displayName,
            objectForResult = {'info':userInfo,'displayName':displayName,'user':loginIN};

        let data = await CONFIRM.createSmsSignInForSystem(
                uid,
                {
                    'device'  : 'unknown', // type device android, browse, ios
                    'did'     : 0, // device id
                    'ip'      : Connect.getIp()
                }
            ).toPromise(),
            token   = data.data.Item['id'],
            smsText = "Код - " + data.data.Item.code;


        objectForResult['token'] = token;
        objectForResult['status'] = 1;

        return Observable.create(
            async (observer: Observer<any>) => {
                if ( !isTestUser(user, pswd) ) await Connect.sendSms( smsText , phoneIN, 'sign', 0 ).toPromise();
                observer.next(objectForResult);
                observer.complete();
            }
        ).toPromise();
    }

}