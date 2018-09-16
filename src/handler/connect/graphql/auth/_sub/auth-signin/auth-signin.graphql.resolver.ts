import {AuthSignIn} from "./auth-signin.library";

export const GraphQlAuthSignInResolver = {
    Query: {
        authSignIn:  (root, data: {user: string, pswd: string})   => AuthSignIn.did(data.user, data.pswd)
    }
};