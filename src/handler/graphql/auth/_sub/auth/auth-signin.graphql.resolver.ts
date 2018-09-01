import {AuthSignIn} from "./auth-signin.library";

export const GraphQlAuthSignInResolver = {
    Query: {
        authSignIn:  (user: string, pswd: string)   => AuthSignIn.did(user, pswd)
    }
};