export namespace Mock {
    export namespace Response {
        export const AuthSignIn = {
            "info":{
                "icon" : "https://cdn.ramman.net/images/icons/users/zurab.jpg",
                "firstname" : "Firstname",
                "lastname" : "Lastname"
            },
            "displayName" : "Test User",
            "user" : "test",
            "token" : "aaaaaaaa-bbbb-cccc-eeee-ffffffffffff",
            "status" : 1
        };
    }

    export namespace Request {
        export const AuthSignIn = {
            "user": "@test-user",
            "pswd": "@test-pswd"
        }
    }
}