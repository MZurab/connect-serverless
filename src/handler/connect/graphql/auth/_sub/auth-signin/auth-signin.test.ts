import {AuthSignIn} from "./auth-signin.library";
import {Mock} from "./auth-signin.mock";

describe(
    'Auth sign-in with right data',
    () =>  {
        it(
            'Sign in with test data',
            async () => {
                let data = await AuthSignIn.did(Mock.Request.AuthSignIn.user, Mock.Request.AuthSignIn.pswd);
                console.log('data', data);
            }
        );
    }
);