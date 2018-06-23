exports.handler = async (event, context, callback) => {

    //implement
    const CONNECT       = require('./input/connect'),
            LOG             = require('ramman-z-log'),
            CONFIRM         = require("./input/connect_access/confirm"),

        //**LATER DELETER FIREBASE FROM HERE
         FIREBASE       = require("./input/firebase/firebase"),
         firestore      = FIREBASE.firestore,
        FREEFORM        = require("./input/connect_freeform/freeform");
        // USER            = require("./input/connect_users/users")

    // log on-
    LOG.on(); // off

    CONNECT.setHeader(event);

    const HEADER     = CONNECT.getHeader(['*']),
          DATA       = HEADER['data'],
          TYPE       = HEADER['type'],
          type       = CONNECT.getUrlParam('type'),
          formUser   = CONNECT.getUrlParam('user'),
          modelId    = CONNECT.getUrlParam('model');


    // output init data
    LOG.step(0, 0, 'Init date', 'EVENT', event, 'DATA', DATA, 'TYPE',TYPE, type, formUser, modelId );

    // clear freeform cache
    delete global['freeform'];




    // const SNS       = require("./input/aws/sns"); // {'body':true}
    // let time = new Date().getTime();
    // console.log('s 11', time);
    // let snsresult   = await SNS.sendMessage('123', 'arn:aws:sns:eu-west-1:222322594734:Test');
    // console.log ( 'snsresult' , snsresult );
    // console.log ( 's 22' , time - new Date().getTime(), time );
    // return;


    if (
        type &&
        formUser &&
        modelId
    ) {
        // we have initial data
        LOG.step(0, 1, 'We need initial datas', 'type', type, 'user', formUser, 'model',modelId );

        let tokenData       = null,
            usetAuthType    = '?',
            clientData      = null,
            userData        = {},
            result          = {'status': 0}; // default value anonym

        //@< check signed token
            if ( DATA['uid'] && DATA['token'] ) {
                // We have user 'uid' and 'token' -> check token
                LOG.step(0, 2, "We have user 'uid' and 'token' -> check token", 'type', type, 'user', formUser, 'model',modelId );
                tokenData = await ( async () => {
                    return new Promise(
                        (resolve) => {
                            CONFIRM.getSignInSmsToken (DATA['uid'], {'token':DATA['token'],'status':5}, function (errCheckToken,dataCheckToken) {

                                if( !errCheckToken && dataCheckToken.Count > 0 ) {
                                    resolve(dataCheckToken);
                                } else {
                                    resolve(null);
                                }
                            });
                        }
                    );

                })();
            }
        //@> check signed toked


        console.log('global 1', global);
        if (tokenData) {
            // if this user authed -> we set authType to '@' && set uid (later pass to function)
            usetAuthType    = '@';
            userData['uid'] = DATA['uid'];

            // save client/user uid for late access
            CONNECT.saveUid(DATA['uid']);
        }

        if ( type === 'create' ) {
            // create form objecr from model
            let formmodel;
            if ( !DATA['getForm'] ) {
                // if we want only create object
                try {
                    formmodel = await FREEFORM.createFormModelWithOutGetFormObject( formUser,modelId, userData );
                }catch (e) {
                    console.log('formmodel 2 - e', e);

                }
                console.log('formmodel 2', formmodel);

                if (formmodel) {
                    result['status'] = 1;
                    result['formId'] = formmodel['formId'];
                }
                console.log('FREEFORM', JSON.stringify(global['freeform']));
            } else {
                // if we want get form object after create
                formmodel = await FREEFORM.createFormModelWithGetFormObject( formUser, modelId, userData );
                console.log('formmodel 2', formmodel);

                if (formmodel) {
                    result['status'] = 1;
                    result['formId'] = formmodel['formId'];
                    result['form'] = formmodel['form'];
                }

                console.log('FREEFORM', JSON.stringify(global['freeform']));
            }
        } else if ( type === 'get' ) {
            // get form object from form model
            let formId = DATA['formId'], formobject;
            if ( formId ) {
                formobject = await FREEFORM.getFromObject( formUser, modelId, formId, userData );
            }
            if (formobject) {
                result['status'] = 1;
                result['formId'] = formobject['formId'];
                result['form'] = formobject['form'];
            }
        } else if ( type === 'submit' ) {
            // return new state&&status
            let formId = DATA['formId'], formobject;
            if (formId) {
                // simple get form
                // formobject = await FREEFORM.getFromObject( formUser, modelId, formId, userData );

                let resultOfSubmit = await FREEFORM.submitForm(formUser, modelId, formId, userData);
                if (resultOfSubmit) {
                    result['status'] = 1;
                    LOG.fstep('', 9, 9, result);
                }


            }
        } else if ( type === 'copy' ) {
            /* @requestType - post
            *  @body - json
            *  @
            * */
            if (
                typeof DATA['el_id']    === 'string' &&
                typeof DATA['add_to']   === 'string' &&
                typeof DATA['copy_el_id'] === 'string'
            ) {
                let elId        = DATA['el_id'],
                    addTo       = DATA['add_to'],
                    copyElId    = DATA['copy_el_id'],
                    ids         = (typeof DATA['ids'] === 'array') ? DATA['ids'] : null, //@required
                    withValue   = (typeof DATA['withValue'] === 'number' && DATA['withValue'] > 1) ? 1 : 0, //@optional value
                    data        = (typeof DATA['data'] === 'object') ? DATA['data'] : null; //@optional value

                if (ids) {

                }
                //@ check - user type

                //@ get form and elements




                //@ check - access type

            }
        }
        console.log('result', result);

        console.log('global.freeform 2', JSON.stringify(global['freeform']));
        // return
        context.succeed(result);
    }
}