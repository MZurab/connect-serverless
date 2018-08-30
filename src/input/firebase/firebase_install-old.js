var fadmin = require("firebase-admin");
var serviceAccount = require("./connect-9109d-firebase-adminsdk-lytg0-130f89d0ed.json");
fadmin.initializeApp({
    credential: fadmin.credential.cert(serviceAccount),
    projectId 			    : "connect-9109d",
    storageBucket		    : "connect-9109d.appspot.com",
    authDomain			    : "connect-9109d.firebaseapp.com",
    messagingSenderId	    : "737839044422",
    databaseURL             : "https://connect-9109d.firebaseio.com"
});
module.exports = fadmin;
