// const fadmin = require("firebase-admin");
import * as fadmin_ from 'firebase-admin';

// var serviceAccount = require("./connect-9109d-firebase-adminsdk-lytg0-130f89d0ed.json");
const serviceAccount = {
    "type": "service_account",
    "project_id": "connect-9109d",
    "private_key_id": "35d26b449256cf5f8b3b4dd6c9d0329fd82b4dcb",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCvCpDGE6f/HBaf\nkb5sPGkC2ZNHXYMZkfqdOMGCWa+QdUNlSGneN9gK7lVYBcNeYPDbMeUozLS+90cS\nz4yoj8+gJ+0FffyQVkkrxsXipUaeDkxazfLCC6xj7mkayW+HOzNXPi5AqtN1ftyI\n49+miTSFtg8Mq/NB39TZAVSmxlMsdgKjbu5ecu8Wa720qtfkqs0Ku1rkIYmsQr+1\nBZe3hjH29VJ8Ldj+Z5FM3bYGI37sgAMx/La75enBbd+IzyyTizHJ0UcMSEby87Na\nCiFTK+a0FPp4yQAr6ybU3gNjY6PzB46e68GJJfa56yKf8LV2OjWyx6u7an6l6bhE\nOR2LFcgPAgMBAAECggEAOWodR6Nd6OtVLlz3WXhNN46XZQKyxFniGtzpeDCjyh30\nj827UBUAK8G2Q6uMRDJG/pb0pDfVF4hziyOB7y5Qu6cs8y66f7uVv6Kw+OEecyyc\ndfJ0rJp4nsSuPAeTqgdMlVLDiBmgR7tnag1YqD7799naQN1L6rEZF1783cFSudOm\nQkM7zKXrsyqd3F95KvSbtDBmrBIrnvtGyY1MfV5K8Awi2g6xyg6SPqM8GAxfyyQC\nGo5ODvZpXe6ntsybtm+4AZQ0wC3/U37zdQLSk68jJAJnuUb9tKdI5uw1Wfovx9/2\nr2MbwoGP0Fd4aRo9yT1Iv9vWhPQbFdMIm0AxyRbGhQKBgQDlfH4XI3Wf/x4CqOxD\nz85BslX0pU4Nim60wxcUUL5DWUpMobsDCVzt0KWAhLoDzghpRRQUv9trvhJ0mGRY\n7ONAsBxTI1/kbGWYuEbDRT84P6p93fQg7vsLu7DkfZ9wy4Z2xGxG9qjuD8JH+xah\n+LrOeiC8wxxmTJjukZjiGO7oQwKBgQDDQ8Eml8TsCyWV2r3BmSR3YF+yWYQP4l3t\nSzxR1y4PLsb9/bpqh6LRrWvnISum16i9kWtovbvgqBGtDVD/BdIr5zFR0aQHEjg0\noScINXo6GlejWrADnjjSLvxyGNHI6gWGiu5WTubH/Q9jyseqkSP9kdS5hnRPc8gf\nOut79YY6RQKBgQCg464XFNIzkQ3+OWYjiL6HSrt+oKJfVe2Vp603ngA2gZRYs47E\naz0OshhGSUeMwVceTsLsZTI1kHWp7ulzeuk8gfvpwcRKBkEYWCGsZ5ESI3ipdAHj\nUQkKydUT7Irq7pXgEIgFHIuFE+FWy8+rURHPDsqC7JutkQgrQkKYSXi9twKBgQCu\nlxhOz4jtnRHgKZNdVPa8HlmyeEOSiE5/a7PlYUb3oFWgqItT0S8N18gRAyGqrk1c\nIngtUOh5+QzE9JElVSkUxETe6VmGUQ4cULM7rcU5ym/tyZpzwbcAh66EvhhlUona\nQMLWPPowet6V1awtoFTT1t6je8rnd5jKA76mOWPpGQKBgA67uY+BJLzJLQLRvpf3\nNn4gzjGrVu15ajcLOf60eOyC5F+sYLm6a7SN7hd6ORGQQXcG2vWwUwyKLvMtz0j/\nhIvTjOrDqb3LqJH9FcAPn7mA35niG/xabuKki3EshzBm/qQYWrC7IXUh0auNX17a\neILOvqgfVruB24ty004F7XN4\n-----END PRIVATE KEY-----\n",
    "client_email": "firebase-adminsdk-lytg0@connect-9109d.iam.gserviceaccount.com",
    "client_id": "114049106198867248758",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://accounts.google.com/o/oauth2/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-lytg0%40connect-9109d.iam.gserviceaccount.com"
};

fadmin_.initializeApp(
    {
        credential: fadmin_.credential.cert(serviceAccount),
        projectId 			    : "connect-9109d",
        storageBucket		    : "connect-9109d.appspot.com",
        authDomain			    : "connect-9109d.firebaseapp.com",
        messagingSenderId	    : "737839044422",
        databaseURL             : "https://connect-9109d.firebaseio.com"
    }
);
let fadmin: any = fadmin_;
export {fadmin};
