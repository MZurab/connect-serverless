export const GraphQlTypeDefAuthSignIn = `
  
    extend type Query {
        # request for sign in - need passed login and pswd
        authSignIn(user: String, pswd: String): AuthSignInResponse
    }
    
    # responce for sign in request
    type AuthSignInResponse {
        # status boolean 
        status: Boolean!,
        # token for sign in
        token: String
        # user login
        user: String,
        # user dispayed name
        displayName: String,
        # information of user 
        info: AuthSignInForInfoType!
    }
        type AuthSignInForInfoType {
            # @deprecated 
            icon: String
            # user firstname
            firstname: String!  
            # user lastname
            lastname: String!  
        }
`;