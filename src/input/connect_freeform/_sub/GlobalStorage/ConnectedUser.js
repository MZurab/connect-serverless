class ConnectedUser {
    constructor () {}
    static prepareGlobalObjectForConnectedUsers () { //-
        if (!global['freeform']) global['freeform'] = {};
        if (!global['freeform']['conectedUsers']) global['freeform']['conectedUsers'] = [];
    }

    static addConnectedUserWithFormToGlobalStorage (iNuid) { //+

        ConnectedUser.prepareGlobalObjectForConnectedUsers();

        if ( global['freeform']['conectedUsers'].indexOf(iNuid) === -1 ) {
            global['freeform']['conectedUsers'].push(iNuid);
        }
    }

    static getConnectedUsersWithFormFromGlobalStorage () { //+

        ConnectedUser.prepareGlobalObjectForConnectedUsers();

        return global['freeform']['conectedUsers'];
    }
}
module.exports.ConnectedUser = ConnectedUser;