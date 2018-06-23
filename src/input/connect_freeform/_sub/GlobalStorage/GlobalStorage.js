const Form          = require('./Form').Form;// FreeformGlobalStorage
const Field         = require('./Field').Field;// FreeformGlobalStorage
const ConnectedUser = require('./ConnectedUser').ConnectedUser;// FreeformGlobalStorage
const AccessList    = require('./AccessList').AccessList;// FreeformGlobalStorage
const Element    = require('./Element').Element;// FreeformGlobalStorage


class GlobalStorage {
    constructor () {
    }

    static get ConnectedUser () {
        return ConnectedUser;
    }
    static get AccessList () {
        return AccessList;
    }
    static get Field () {
        return Field;
    }
    static get Form () {
        return Form;
    }
    static get Element () {
        return Element;
    }
}
module.exports.GlobalStorage = GlobalStorage;



