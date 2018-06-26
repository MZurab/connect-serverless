const CONNECT   = require('./../connect');
const LOG     = require('ramman-z-log');
const FIREBASE  = require("./../firebase/firebase");
const firestore = FIREBASE.firestore;



const GlobalStorage     = require('./_sub/GlobalStorage/GlobalStorage').GlobalStorage;
const FreeformForm      = require('./_sub/Form/FreeformForm').FreeformForm;
const FreeformField     = require('./_sub/Field/FreeformField').FreeformField;
const FreeformElement            = require('./_sub/Element/FreeformElement').FreeformElement;
const FreeformElementReference   = require('./_sub/Element/FreeformElementReference').FreeformElementReference;
const FreeformShared    = require('./_sub/FreeformShared').FreeformShared;
const AccessList        = require('./_sub/AccessList/AccessList').AccessList;
const FreeformStepper   = require('./_sub/Stepper/FreeformStepper').FreeformStepper;
const SNS               = require("./../aws/sns"); // {'body':true}


const _ = {};

//@< function


    async function runSubmitBackend(iNdata) {
        //run backend
        let tupic_arn = 'arn:aws:sns:eu-west-1:222322594734:freeform-submit-form';
        let snsresult   = await SNS.sendMessage(iNdata, tupic_arn);

        return snsresult;
    }

    async function createFormObjectFromModel (iNformUser, iNmodelId, iNformId, iNclienUserData, iNfirestoreBatchGroup, iNfullDownloaded = false ) {

        let fname       = 'createFormObjectFromModel',
            modelId     = iNmodelId, // 'model_id1'
            formUser    = iNformUser,
            formId      = iNformId,
            fullDownloaded = iNfullDownloaded,
            cdata       = iNclienUserData;

        LOG.fstep( fname, 0, 0, 'INVOKE - iNformUser, iNmodelId, iNformId, iNclienUserData', iNformUser, iNmodelId, iNformId, iNclienUserData );

        // we have initial data
        LOG.fstep( fname, 0, 1, 'We need initial datas', 'formUser', formUser, 'modelId', modelId , 'cdata', cdata);


        // get activated form modelId
        const modelOfForm = await FreeformForm.Object.getObject( formUser, modelId, formId,  { status: "activated" } );

        if (!modelOfForm) {
            LOG.ferror( fname, 0, 2, 'ERROR END We has NOT object in db', modelOfForm);
            return CONNECT.returnPromiseWithValue(null);
        }
        //We has this form in db -> check access to this db
        LOG.fstep( fname, 0, 2, 'We has this form in db -> check access to this db', modelOfForm);

        //@< check access

            let hasAccess = await AccessList.Shared.checkListForAccessToFreeformObject ('read', 'form', null, null, formUser, modelId, formId, modelOfForm, cdata);
            //(formUser, modelId, modelOfForm, cdata);


            if (!hasAccess) {
                LOG.ferror(fname, 0, 3, "END ERROR - has not access for read", hasAccess ); // modelOfForm
                return CONNECT.returnPromiseWithValue(null);
            }

            LOG.fstep(fname, 0, 3, "step NEXT - we has access for read -> preload access lists",  hasAccess, cdata ); // modelOfForm
        //@> check access


        //@< preload all access lists
            if (cdata['uid']) {
                // if this signed formUser
                let preloadAccessList = FreeformShared.Options.getAccessLists(modelOfForm);
                if(!preloadAccessList) {
                    //
                    LOG.fstep(fname, 0, 4, "ERROR - we has not preload lists -> get fields of modelId if need",   preloadAccessList);
                } else {
                    let accessListsArray =  await AccessList.Shared.preloadAccessObjectsFromFormForUserByList(formUser, modelId, formId, preloadAccessList, cdata['uid']);
                    if(accessListsArray) {
                        LOG.fstep(fname, 0, 4, "We has  preloaded lists -> get fields of modelId if need",   accessListsArray);
                    } else {
                        LOG.ferror(fname, 0, 4, "ERROR - we can not preloaded all lists",   accessListsArray);
                    }
                }
            }
        //@> preload all access lists


        //@< preload all fields and lists
            let formPreloadedStatus = FreeformShared.Options.getPreloadStatus(modelOfForm);
            if (formPreloadedStatus && !fullDownloaded ) {
                LOG.fstep( fname, 5, 1, 'We have preload form -> get fields and models ', formPreloadedStatus);
                let resultOfPreloading;
                if ( formPreloadedStatus === 'all' ) {
                    resultOfPreloading = await FreeformElement.Object.loadElements(
                        formUser, modelId, formId, false
                    );
                    // we preload all date -> set full downloaded status to true
                    fullDownloaded = true;
                } else if ( formPreloadedStatus === 'part' ) {
                    resultOfPreloading = await FreeformElement.Object.loadElements(
                        formUser, modelId, formId, true
                    );
                }
                if (resultOfPreloading) {
                    LOG.fstep( fname, 5, 11, 'We finished preloading', resultOfPreloading, global['freeform'] );
                } else {
                    LOG.fstep( fname, 5, 12, 'ERROR - We could not preloading -> go NEXT ', resultOfPreloading, global['freeform'] );
                }
            } else {
                LOG.fstep( fname, 5, 2, 'We have NOT preload form -> go next', formPreloadedStatus, modelOfForm);
            }
        //@> preload all fields and lists




        //@< proccessing form object (FINISH STEP)
            const initResult = await FreeformForm.Object.init (
                formUser,
                modelId,
                formId,

                modelOfForm,

                iNfirestoreBatchGroup,
                fullDownloaded
            );

            if ( initResult ) {
                //we could created form object -> return
                LOG.fstep( fname, 6, 1, 'We could created form object -> return ', initResult);

                let thisForm = GlobalStorage.Form.getObject (formUser, modelId, formId);

                return CONNECT.returnPromiseWithValue(thisForm);
            } else {
                LOG.ferror( fname, 6, 2, 'ERROR END - we canot proccissing this form -> return false', initResult);
            }

        //@> proccessing form object



    } _.createFormObjectFromModel = createFormObjectFromModel;

    async function createFormModelWithOutGetFormObject (iNuser, iNmodel, iNclienUserData, iNfirestoreGroupBatch) {
        /*
        * @disc - creating form object witout getting form object
        * @ROOTFUNCTION*/
        let firestoreGroupBatch,
            fname               = 'createFormModelWithOutGetFormObject';

        LOG.fstep( fname, 0, 0, 'INVOKE - iNuser, iNmodel, iNclienUserData', iNuser, iNmodel, iNclienUserData);

        if ( !iNfirestoreGroupBatch ) {
            const   firestoreDb           = FIREBASE.getFirestoreDb();
                    firestoreGroupBatch   = FIREBASE.getGroupBatchFirestoreDb(firestoreDb);
        } else {
                    firestoreGroupBatch   = iNfirestoreGroupBatch;
        }



        let created =  await createFormObjectModelFormFromModel (iNuser, iNmodel, iNclienUserData, firestoreGroupBatch );

        if (created) {
            LOG.fstep( fname, 1, 1, 'created - true', created);
            if ( !iNfirestoreGroupBatch ) {
                //we can add model for write to batch -> run batch write to db
                let batchWriteResult = await FIREBASE.writeBatchFirestoreDbGroup(firestoreGroupBatch);
                if (batchWriteResult) {
                    console.log('createFormModelWithOutGetFormObject - batchWriteResult', batchWriteResult);
                    // we can write to db -> return form id
                    return CONNECT.returnPromiseWithValue(created);
                } else {
                    // we can NOT write to db -> return error
                    return CONNECT.returnPromiseWithValue(false);
                }
            } else {
                // we have passed batch -> don't write to batch -> return result
                return CONNECT.returnPromiseWithValue(created);
            }
        } else {
            LOG.fstep( fname, 1, 2, 'created - false', created);
            return CONNECT.returnPromiseWithValue(false);
        }
    } _.createFormModelWithOutGetFormObject = createFormModelWithOutGetFormObject;


    async function getFullForm ( iNuser, iNmodel, iNformId, iNclienUserData ) {
        let fname       = 'getFullForm',
            modelId     = iNmodelId, // 'model_id1'
            formUser    = iNformUser,
            formId      = iNformId,
            cdata       = iNclienUserData;

        LOG.fstep( fname, 0, 0, 'INVOKE - iNformUser, iNmodelId, iNformId, iNclienUserData', iNformUser, iNmodelId, iNformId, iNclienUserData );

        // we have initial data
            LOG.fstep( fname, 1, 0, 'We need initial datas', 'formUser', formUser, 'modelId', modelId , 'cdata', cdata);


        // get activated form modelId
            const modelOfForm = await FreeformForm.Object.getObject( formUser, modelId, formId,  { status: "activated" } );


        //We has this form in db -> check access to this db
            
            if( !modelOfForm) {
                LOG.fstep( fname, 2, 1, 'END ERROR - We has NOT this form in db', modelOfForm);
                return CONNECT.returnPromiseValue(false);
            }

            LOG.fstep( fname, 2, 2, 'We has this form in db -> get all elements', modelOfForm);

        //@< get fields
            let hasAccess = await AccessList.Shared.checkListForAccessToFreeformObject ('read', 'form', null, null, formUser, modelId, formId, modelOfForm, cdata);

            if (!hasAccess) {
                LOG.ferror(fname, 0, 3, "END ERROR - has not access for read", hasAccess ); // modelOfForm
                return CONNECT.returnPromiseWithValue(null);
            }

            LOG.fstep(fname, 0, 3, "step NEXT - we has access for read -> preload access lists",  hasAccess, cdata ); // modelOfForm
        //@> check access


    }


    async function getFromObject (iNuser, iNmodel, iNformId, iNclienUserData) {
        /*
        * @disc - creating form object witout getting form object
        * @ROOTFUNCTION*/
        const   firestoreDb           = FIREBASE.getFirestoreDb(),
                firestoreGroupBatch   = FIREBASE.getGroupBatchFirestoreDb(firestoreDb);

        let     formOjbect;

        formOjbect  = await createFormObjectFromModel(iNuser, iNmodel, iNformId, iNclienUserData, firestoreGroupBatch, false);

        if (  formOjbect ) {
            //we can add model for write to batch -> run batch write to db
            let batchWriteResult = await FIREBASE.writeBatchFirestoreDbGroup(firestoreGroupBatch);
            if (batchWriteResult) {
                console.log('getFromObject - batchWriteResult', batchWriteResult);
                // we can write to db -> return form id
                return CONNECT.returnPromiseWithValue({ 'formId': iNformId, 'form' : formOjbect });
            } else {
                // we can NOT write to db -> return error
                return CONNECT.returnPromiseWithValue(false);
            }
        } else {
            return CONNECT.returnPromiseWithValue(false);
        }
    } _.getFromObject = getFromObject;





    async function backend_submitForm (iNformUser, iNmodelId, iNformId, iNclienUserData, iNfirestoreGroupBatch = null ) {
        let fname       = 'backend_submitForm',
            modelId     = iNmodelId,
            formUser    = iNformUser,
            formId      = iNformId,
            cdata       = iNclienUserData,
            firestoreGroupBatch,
            notStepperUpdate,
            stepResult;

        if ( !iNfirestoreGroupBatch ) {
            const   firestoreDb           = FIREBASE.getFirestoreDb();
            firestoreGroupBatch   = FIREBASE.getGroupBatchFirestoreDb(firestoreDb);
        } else {
            firestoreGroupBatch   = iNfirestoreGroupBatch;
        }

        // we have initial data
            LOG.fstep( fname, 1, 0, 'We need initial datas', 'formUser', formUser, 'modelId', modelId , 'cdata', cdata);

        // get activated form modelId
            const modelOfForm = await FreeformForm.Object.getObject( formUser, modelId, formId ); // { status: "activated" }

            if (!modelOfForm) {
                LOG.ferror( fname, 2, 1, 'ERROR END We has NOT object in db', modelOfForm);
                return CONNECT.returnPromiseWithValue(null);
            }

        //We has this form in db -> check access to this db
            LOG.fstep( fname, 2, 2, 'We has this form in db -> check access to this db', modelOfForm);

        //@< check access
            let hasAccess = await AccessList.Shared.checkListForAccessToFreeformObject ('submit', 'form', null, null, formUser, modelId, formId, modelOfForm, cdata);


            if (!hasAccess) {
                LOG.ferror(fname, 3, 1, "END ERROR - has not access for submit", hasAccess ); // modelOfForm
                return CONNECT.returnPromiseWithValue(null);
            }

            LOG.fstep(fname, 3, 2, "step NEXT - we has access for submit -> load all elements",  hasAccess, cdata ); // modelOfForm
        //@> check access

        //@< LATER DELETE - WRITE TO USER TABLE
            let db = FreeformElement.Db.isFormWithDb(modelOfForm), tableId;
            if (db ) {
                tableId = (modelId === 'work-article')? 'work-article' : 'article-site1';

                LOG.fstep( fname, 5, 1, 'We has db -> get all fields', db, formUser, modelId, formId, modelId );
                // we has db -> loading all sub elements
                let loadResult = await FreeformElement.Object.loadElements(formUser, modelId, formId);
                LOG.fstep( fname, 111, 1, 'loadResult', loadResult );

                let tablepath = `/users/wideFormat24/table/${tableId}/row/${formId}`,
                    thisFreeform = FreeformShared.getFreeform(formUser, modelId, formId);
                LOG.fstep( fname, 111, 2, 'thisFreeform, global', thisFreeform, global['freeform'] );

                let dbData = {};
                dbData['name']      = '';
                dbData['title']     = '';
                dbData['status']    = 1;
                if ( cdata['uid'] ) dbData['uid']       = cdata['uid'];
                dbData['date']      = new Date();
                dbData['blocks']    = [];

                if ( tableId === 'work-article' ) {
                    // if we have work-article -> add mini icon and text
                    // g3
                    let uploadImage = FreeformElementReference.getElementByPath(thisFreeform, 'gidIcon.$1(gl_f_uploadImage)'),
                        text        = FreeformElementReference.getElementByPath(thisFreeform, 'gidIcon.$1(gl_f_textArea):body>value'),
                        category    = FreeformElementReference.getElementByPath(thisFreeform, 'g0_r3_id2:body>value');

                    if (uploadImage && Array.isArray(uploadImage.body.payload.options) && uploadImage.body.payload.options.length > 0 ) {
                        dbData['icon'] = uploadImage.body.payload.options[0].path;
                        dbData['text'] = text;
                        dbData['category'] = category;
                    }
                }

                {
                    // g1 - g0_r1_id1 - name | date - g0_r3_id1 | title - g0_r2_id1
                    let name    = FreeformElementReference.getElementByPath(thisFreeform, 'g0_r1_id1:body>value'),
                        date    = FreeformElementReference.getElementByPath(thisFreeform, 'g0_r3_id1:body>value'),
                        title   = FreeformElementReference.getElementByPath(thisFreeform, 'g0_r2_id1:body>value');

                    if (name  ) {
                        dbData['name'] = name;
                    }
                    if (date  ) {
                        dbData['date'] = new Date( parseInt(date) );
                    }
                    if (title  ) {
                        dbData['title'] = title;
                    }

                }
                {
                    // g3
                    let uploadImage = FreeformElementReference.getElementByPath(thisFreeform, 'gid2.$1(gl_f_uploadImage)'),
                        text        = FreeformElementReference.getElementByPath(thisFreeform, 'gid2.$1(gl_f_textArea):body>value');
                    if (uploadImage && Array.isArray(uploadImage.body.payload.options) && uploadImage.body.payload.options.length > 0 ) {
                        dbData['blocks'].push(
                            {
                                'type' : 'centerBigImage',
                                'text' : text,
                                weight: 1,
                                image: [ uploadImage.body.payload.options[0].path ]
                            }
                        );
                    }

                }
                {
                    // g4
                    let uploadImage = FreeformElementReference.getElementByPath(thisFreeform, 'gid3.$1(gl_f_uploadImage)'),
                        text        = FreeformElementReference.getElementByPath(thisFreeform, 'gid3.$1(gl_f_textArea):body>value');
                    if (uploadImage && Array.isArray(uploadImage.body.payload.options) && uploadImage.body.payload.options.length > 0 ) {
                        dbData['blocks'].push(
                            {
                                'type' : 'leftBigImage',
                                'text' : text,
                                weight: 1,
                                image: [ uploadImage.body.payload.options[0].path ]
                            }
                        );
                    }

                }
                {
                    // g5
                    let uploadImage = FreeformElementReference.getElementByPath(thisFreeform, 'gid4.$1(gl_f_uploadImage)'),
                        text        = FreeformElementReference.getElementByPath(thisFreeform, 'gid4.$1(gl_f_textArea):body>value');
                    if (uploadImage && Array.isArray(uploadImage.body.payload.options) && uploadImage.body.payload.options.length > 0 ) {
                        dbData['blocks'].push(
                            {
                                'type' : 'leftMiniImage',
                                'text' : text,
                                weight: 1,
                                image: [ uploadImage.body.payload.options[0].path ]
                            }
                        );
                    }
                }

                {
                    // g6
                    let uploadImage = FreeformElementReference.getElementByPath(thisFreeform, 'gid5.$1(gl_f_uploadImage)'),
                        text        = FreeformElementReference.getElementByPath(thisFreeform, 'gid5.$1(gl_f_textArea):body>value');
                    if (uploadImage && Array.isArray(uploadImage.body.payload.options) && uploadImage.body.payload.options.length > 0 ) {
                        dbData['blocks'].push(
                            {
                                'type' : 'rightBigImage',
                                'text' : text,
                                weight: 1,
                                image: [ uploadImage.body.payload.options[0].path ]
                            }
                        );
                    }

                }
                {
                    // g7
                    let uploadImage = FreeformElementReference.getElementByPath(thisFreeform, 'gid6.$1(gl_f_uploadImage)'),
                        text        = FreeformElementReference.getElementByPath(thisFreeform, 'gid6.$1(gl_f_textArea):body>value');
                    if (uploadImage && Array.isArray(uploadImage.body.payload.options) && uploadImage.body.payload.options.length > 0 ) {
                        dbData['blocks'].push(
                            {
                                'type' : 'rightMiniImage',
                                'text' : text,
                                weight: 1,
                                image: [ uploadImage.body.payload.options[0].path ]
                            }
                        );
                    }
                }

                LOG.fstep( fname, 111, 3, 'dbData', dbData );
                await FIREBASE.batchGroupCreate (
                    tablepath,
                    dbData,
                    firestoreGroupBatch
                );
                LOG.fstep( fname, 555, 12, '- ', dbData, firestoreGroupBatch );
            } else {
                LOG.fstep( fname, 5, 2, 'We has  not db -> next', db, formUser, modelId, formId, modelId );
            }
        //@> LATER DELETE - WRITE TO USER TABLE


        //@<
            if ( !iNfirestoreGroupBatch && (stepResult || notStepperUpdate) ) {
                let batchWriteResult = await FIREBASE.writeBatchFirestoreDbGroup(firestoreGroupBatch);
                if (batchWriteResult) {
                    // we can write to db -> return form id
                    return CONNECT.returnPromiseWithValue( stepResult || notStepperUpdate );
                } else {
                    // we can NOT write to db -> return error
                    return CONNECT.returnPromiseWithValue(false);
                }
            }
        //@>
    }

    async function submitForm (iNformUser, iNmodelId, iNformId, iNclienUserData, iNfirestoreGroupBatch = null ) {
        let fname       = 'submitForm',
            modelId     = iNmodelId, // 'model_id1'
            formUser    = iNformUser,
            formId      = iNformId,
            cdata       = iNclienUserData,
            firestoreGroupBatch,
            notStepperUpdate,
            stepResult,
            objForRunBackendFunctionViaSns = { 'command' : 'submit' };

        if ( !iNfirestoreGroupBatch ) {
            const   firestoreDb           = FIREBASE.getFirestoreDb();
                    firestoreGroupBatch   = FIREBASE.getGroupBatchFirestoreDb(firestoreDb);
        } else {
                    firestoreGroupBatch   = iNfirestoreGroupBatch;
        }

        // we have initial data
            LOG.fstep( fname, 1, 0, 'We need initial datas', 'formUser', formUser, 'modelId', modelId , 'cdata', cdata);



        // get activated form modelId
            const modelOfForm = await FreeformForm.Object.getObject( formUser, modelId, formId ); // { status: "activated" }

            if (!modelOfForm) {
                LOG.ferror( fname, 2, 1, 'ERROR END We has NOT object in db', modelOfForm);
                return CONNECT.returnPromiseWithValue(null);
            }

        //We has this form in db -> check access to this db
            LOG.fstep( fname, 2, 2, 'We has this form in db -> check access to this db', modelOfForm);

        //@< check access
            let hasAccess = await AccessList.Shared.checkListForAccessToFreeformObject ('submit', 'form', null, null, formUser, modelId, formId, modelOfForm, cdata);
            //(formUser, modelId, modelOfForm, cdata);


            if (!hasAccess) {
                LOG.ferror(fname, 3, 1, "END ERROR - has not access for submit", hasAccess ); // modelOfForm
                return CONNECT.returnPromiseWithValue(null);
            }

            LOG.fstep(fname, 3, 2, "step NEXT - we has access for submit -> load all elements",  hasAccess, cdata ); // modelOfForm
        //@> check access


        //@<
            let stepper = FreeformShared.Options.getFormStepper( modelOfForm, false );

            if (stepper) {
                // this form must have own stepper -> get stepper
                LOG.ferror(fname, 4, 1, "This form has stepper -> get all elements", stepper ); // modelOfForm

                // add stepper  to object for run backend via sns
                    objForRunBackendFunctionViaSns['stepper'] = stepper;

                //@< load all elements
                    let allEllements = await FreeformElement.Object.loadElements(
                        formUser, modelId, formId, false
                    );
                    if (allEllements) {
                        LOG.fstep( fname, 5, 11, 'We finished load all elements -> set step', allEllements, global['freeform'] );

                        stepResult = await FreeformStepper.run(
                            formUser, modelId, formId, modelOfForm, firestoreGroupBatch
                        );
                        LOG.fstep( fname, 6, 1, 'Get result of step', stepResult );



                    } else {
                        LOG.fstep( fname, 5, 12, 'END ERROR - We could not load -> go NEXT ', allEllements, global['freeform'] );
                        return CONNECT.returnPromiseValue(false);
                    }
                //@> load all elements

                //@< set step
                //@> set step

            } else {
                notStepperUpdate = true;
                // this form must NOT have own stepper -> check for standart required
                LOG.ferror(fname, 4, 2, "This form NOT has stepper", stepper ); // modelOfForm

                //**LATER -  add check required for stepper and not stepper forms
                //**LATER -
                let write = FreeformForm.Object.updateFormStatus(formUser, modelId, formId, 5, firestoreGroupBatch)
                // return CONNECT.returnPromiseValue(true);

            }

            // add freeform  to object for run backend via sns
                objForRunBackendFunctionViaSns['freeform'] = global['freeform'];

            // pass to backend function
                let time = new Date().getTime();
                console.log('start runSubmitBackend - ', time);
                runSubmitBackend(
                    objForRunBackendFunctionViaSns
                );
                console.log('start runSubmitBackend - ', new Date().getTime() - time, 'time', time);



            if ( !iNfirestoreGroupBatch && (stepResult || notStepperUpdate) ) {
                let batchWriteResult = await FIREBASE.writeBatchFirestoreDbGroup(firestoreGroupBatch);
                if (batchWriteResult) {
                    // we can write to db -> return form id
                    return CONNECT.returnPromiseWithValue( stepResult || notStepperUpdate );
                } else {
                    // we can NOT write to db -> return error
                    return CONNECT.returnPromiseWithValue(false);
                }
            }
        //@>
    }
    _.submitForm = submitForm;






    async function createFormModelWithGetFormObject (iNuser, iNmodel, iNclienUserData) {
        /*
        * @disc - creating form object witout getting form object
        * @ROOTFUNCTION*/
        const   fname                 = 'createFormModelWithGetFormObject',
                firestoreDb           = FIREBASE.getFirestoreDb(),
                firestoreGroupBatch   = FIREBASE.getGroupBatchFirestoreDb(firestoreDb);

        let     formOjbect, created;

        LOG.fstep(fname, 0, 0, 'INVOKE - iNuser, iNmodel, iNclienUserData', iNuser, iNmodel, iNclienUserData);

        // created = await createFormObjectModelFormFromModel (iNuser, iNmodel, iNclienUserData, firestoreDb, firestoreBatch);

        created = await createFormModelWithOutGetFormObject (iNuser, iNmodel, iNclienUserData, firestoreGroupBatch);

        if (created) {
            LOG.fstep(fname, 1, 1, 'created - true', created);
            formOjbect  = await createFormObjectFromModel(iNuser, iNmodel, created['formId'], iNclienUserData, firestoreGroupBatch, true);
        } else {
            LOG.fstep(fname, 1, 2, 'created - false', created);
        }

        if ( created && formOjbect ) {
            //we can add model for write to batch -> run batch write to db
            let batchWriteResult = await FIREBASE.writeBatchFirestoreDbGroup(firestoreGroupBatch);
            if (batchWriteResult) {
                console.log('createFormModelWithGetFormObject - batchWriteResult', batchWriteResult);
                // we can write to db -> return form id
                return CONNECT.returnPromiseWithValue({ 'formId': created['formId'], 'form' : formOjbect });
            } else {
                // we can NOT write to db -> return error
                return CONNECT.returnPromiseWithValue(false);
            }
        } else {
            return CONNECT.returnPromiseWithValue(false);
        }
    } _.createFormModelWithGetFormObject = createFormModelWithGetFormObject;

    async function createFormObjectModelFormFromModel (iNformUser, iNmodelId, iNclienUserData, iNfirestoreGroupBatch) {
        /*
        * @disc - create form object from model
        * @*/
        let fname       = 'createFormObjectModelFormFromModel',
            modelId     = iNmodelId, // 'model_id1'
            formUser    = iNformUser,
            cdata       = iNclienUserData;
        // we have initial data
        LOG.fstep( fname, 0, 1, 'We need initial datas', 'formUser', formUser, 'modelId', modelId );

        // get activated form modelId
        const modelOfForm = await FreeformForm.Model.getModel( formUser, modelId, { status: "activated" } );

        // if modelId with this status is not exist -> (STOP)
        if (!modelOfForm) {
            LOG.fstep(fname, 0, 2, "END ERROR - this modelId is not exist OR not activated", 'modelOfForm', modelOfForm ); // modelOfForm
            return CONNECT.returnPromiseWithValue(null);
        }

        LOG.fstep(fname, 0, 2, "step NEXT - we has this modelId -> check access", 'modelOfForm', modelOfForm ); // modelOfForm


        let hasAccess = await AccessList.Shared.checkListForAccessToFreeformObject ('create', 'form', null, null, formUser, modelId, null, modelOfForm, cdata);
        //(formUser, modelId, modelOfForm, cdata);


        if (!hasAccess) {
            LOG.fstep(fname, 0, 3, "END ERROR - has not access for create", hasAccess ); // modelOfForm
            return CONNECT.returnPromiseWithValue(null);
        }
        // check access

        LOG.fstep(fname, 0, 3, "step NEXT - we has access for create -> preload access lists",  hasAccess, cdata ); // modelOfForm

        //preload all lists
            if (cdata['uid']) {
                // if this signed formUser
                let preloadAccessList = FreeformShared.Options.getAccessLists(modelOfForm);
                if(!preloadAccessList) {
                    //
                    LOG.fstep(fname, 0, 5, "ERROR - we has not preload lists -> get fields of modelId if need",   preloadAccessList);
                } else {
                    let accessListsArray =  await AccessList.Shared.preloadAccessObjectsFromFormForUserByList(formUser, modelId, null, preloadAccessList, cdata['uid']);
                    if(accessListsArray) {
                        LOG.fstep(fname, 0, 5, "We has  preloaded lists -> get fields of modelId if need",   accessListsArray);
                    } else {
                        LOG.fstep(fname, 0, 5, "ERROR - we can not preloaded all lists",   accessListsArray);

                    }
                }
            }



        // create for late write batch operations
        const firestoreBatchGroup   = iNfirestoreGroupBatch,

              // get form uuid for crating object
              pathToCreateFormId    = `${formUser}/model/${modelId}/form`,
              formId                = FIREBASE.generateIdForFirestoreByFullPathToDb ( 'freeform', pathToCreateFormId );

            console.log('pathToCreateFormId, formId', pathToCreateFormId, formId );



        //get fields if is not modelId of simpleForm
        let copyFieldModels = await copyElementModelsToFormObject (formUser, modelOfForm, modelId, formId, firestoreBatchGroup);

        if (copyFieldModels) {
            LOG.fstep(fname, 0, 6, "We can copy modelId of field (later write in batch) -> create form object",   copyFieldModels);
            // we can add modelId for late write to db -> copy form (move optionsForObject to options)

        } else {

            LOG.fstep(fname, 0, 6, "END ERROR - we can not copy modelId of field",   copyFieldModels);
            return CONNECT.returnPromiseWithValue(false);
        }

        //@< copy access list for object if need - **LATER past to another functino
            let accessLists = FreeformShared.Options.getAccessLists(modelOfForm, true),
                authType    = FreeformShared.Options.getAccessType(modelOfForm, true),
                useType     = FreeformShared.Options.getUseType(modelOfForm, true);

            if(
                authType['@list'] === true &&
                useType === 'common'

            ) {
                LOG.fstep(fname, 0, 8, "We have form authType is '@list' -> check for isset access lists for form object",   authType, useType);
                // we have form authType is '@list' -> check for isset access lists for form object
                if (accessLists.length > 0) {
                    // we has access list for @list form  -> download this lists
                    LOG.fstep(fname, 0, 801, "We has access list for @list form  -> download this lists", accessLists, global['freeform']);
                    let formAccessLists = await FreeformForm.Object.AccessList.getAccessListsForFormObjectByList (formUser, modelId, accessLists);

                    if (formAccessLists) {
                        // we downloaded access list for object -> next create members
                        LOG.fstep(fname, 0, 802, "We downloaded access list for object -> copy this to firebase", formAccessLists, global['freeform']);

                        let copyAccessListsResult = await AccessList.Shared.startCopyAccessListToFormObject (formUser, modelId, formId, firestoreBatchGroup);

                        if ( copyAccessListsResult ) {
                            LOG.fstep(fname, 0, 802, "We add to copy batch -> next created members, formAccessLists, global['freeform']", global['freeform']);
                        } else {
                            LOG.fstep(fname, 0, 802, "END ERROR - We NOT add to copy batch", global['freeform']);
                            return CONNECT.returnPromiseWithValue(false);
                        }

                    } else {
                        // we can not download access lists -> return error
                        LOG.fstep(fname, 0, 802, "END ERROR - we has not access list for @list form", formAccessLists);
                        return CONNECT.returnPromiseWithValue(false);
                    }
                } else {
                    // we has not access list for @list form -> return error
                    LOG.fstep(fname, 0, 801, "END ERROR - we has not access list for @list form", accessLists);
                    return CONNECT.returnPromiseWithValue(false);
                }

            } else {
                LOG.fstep(fname, 0, 8, "We has not access list -> create member freeform object for users",   authType, useType);
            }
        //@> copy access list for object if need - **LATER past to another functin


        //@< createForm
            let form = CONNECT.deepCopyObject( modelOfForm );
            // create object options from modelId
            FreeformShared.Options.convertModelOptionsToWorkFormat (form, false, true);

            let createForm = await FreeformForm.Object.addToDb (formUser, modelId, formId, form, firestoreBatchGroup);
            if (createForm) {
                LOG.fstep(fname, 0, 9, "We can create form object -> check form member block",   createForm, form);
                // return CONNECT.returnPromiseWithValue(true);
            } else {
                LOG.fstep(fname, 0, 9, "END ERROR - we can not create form", createForm, form);
                return CONNECT.returnPromiseWithValue(false);
            }
        //@> create form

        //@< create stepper
            let stepper = FreeformShared.Options.getFormStepper( modelOfForm );

            if (stepper) {
                LOG.fstep(fname, 91, 1, "We have active stepper for this form -> copy", stepper );
                // return CONNECT.returnPromiseWithValue(true);
                let result = await FreeformStepper.copyStepperFromFormModelToFormObject (
                    formUser,
                    modelId,
                    formId,
                    firestoreBatchGroup
                );
                if (result) {
                    LOG.fstep(fname, 92, 1, "We can copy steppers", result );

                } else {
                    LOG.fstep(fname, 92, 2, "ERROR END We can not copy steppers", result );
                    return CONNECT.returnPromiseWithValue(false);
                }

            } else {
                LOG.fstep(fname, 91, 2, "ERROR We have not active stepper for this form -> next", stepper );
            }
        //@> create stepper





        //@< create member freeform object for users
            if (
                useType === 'common'
            ) {
               // we has common useType form add -> add freeform date for all connected members
                LOG.fstep(fname, 0, 10, "We has common useType form add -> add freeform date for all connected members", authType, useType);
                let connectedAllUsers = GlobalStorage.ConnectedUser.getConnectedUsersWithFormFromGlobalStorage();
                if (
                    typeof connectedAllUsers === 'object' &&
                    connectedAllUsers.length > 0
                ) {
                    //SUCCESS - we has connectUsers -> add to db
                    LOG.fstep(fname, 0, 101, "END - we has connectUsers -> add to db  ", connectedAllUsers);
                    let createMemberObjectForUser = await createFreeformObjectForMembers (formUser, modelId, formId, form, connectedAllUsers, cdata['uid'], firestoreBatchGroup);
                    if (createMemberObjectForUser) {
                        LOG.fstep(fname, 0, 102, "END SUCCESS - We can add to formUser short freeform block -> return formId", createMemberObjectForUser);
                        // move function from buffer to this form object
                        console.log('before move from buffer', JSON.stringify(global['freeform']));
                        let resultOfMove = GlobalStorage.Form.moveFormModelFromBufferToFormObject(formUser,modelId,formId);
                        console.log('after move from buffer', resultOfMove, JSON.stringify(global['freeform']));
                        // return form SUCCESS END
                        return CONNECT.returnPromiseWithValue( { 'formId': formId, 'modelId' : modelId, 'user': formUser } );
                    } else {
                        LOG.fstep(fname, 0, 102, "END ERROR - We can NOT add to formUser short freeform block", createMemberObjectForUser);
                        return CONNECT.returnPromiseWithValue(false);
                    }
                } else {
                    //ERROR - we has not connected formUser - return NULL
                    LOG.fstep(fname, 0, 101, "END ERROR - we has not connected formUser ", connectedAllUsers);
                    return CONNECT.returnPromiseWithValue(false);
                }
            } else if (cdata['uid']) { // if we athed formUser
               // we has individual useType form add -> add freeform date for one member
                LOG.fstep(fname, 0, 10, "We has individual useType form add -> add freeform date for one member", authType, useType);
                let createMemberObjectForUser = await createFreeformObjectForMember (formUser, modelId, formId, form, cdata['uid'], cdata['uid'], firestoreBatchGroup);

                if (createMemberObjectForUser) {
                    LOG.fstep(fname, 0, 10, "END SUCCESS - We can add to formUser short freeform block", createMemberObjectForUser);
                    return CONNECT.returnPromiseWithValue(form);
                } else {
                    LOG.fstep(fname, 0, 10, "END ERROR - We can NOT add to formUser short freeform block", createMemberObjectForUser);
                    return CONNECT.returnPromiseWithValue(false);
                }

            }
        //@> create member freeform object for users

    }


    

    async function copyElementModelsToFormObject (iNuser, iNmodel, iNmodelId, iNformId, iNfirestoreBatchGroup) {
        //
        // getModels
        //
        let fname           = 'copyElementModelsToFormObject',
            modelId         = iNmodelId,
            formmodel       = iNmodel,
            user            = iNuser,
            formId          = iNformId,
            firestoreBatch  = iNfirestoreBatchGroup;

        //get fields if is not model of simpleForm
        let simpleForm = FreeformShared.Options.isSimpleForm(formmodel);
        if ( simpleForm ) {
            LOG.fstep(fname, 1, 1, "END SUCCESS - It is model of simple form -> not need copy sepearete field models",   simpleForm);
            return CONNECT.returnPromiseWithValue(true);
        } else {
            LOG.fstep(fname, 1, 2, "It is not model of simple form -> get field models",   simpleForm);
            // let elements = await FreeformField.Model.getFieldsFromFormModel (user, modelId);
            let elements = await FreeformElement.Model.getElementsFromFormModel (
                null,
                user,
                modelId,
                formId,
                null
            );

            //changeTo FormModel - , 'objId1'

            if ( elements ) {
                LOG.fstep(fname, 2, 1, "We has  field models -> processing this field models",   elements);
                for ( let elementKey in elements) {
                    let element      = elements[elementKey],
                        elementId    = element['modelid'];

                    // create work options for this
                        FreeformShared.Options.convertModelOptionsToWorkFormat (element, true, false );

                    // add options data for recognize field and model

                    // add to write batch block for later add to db
                        // let createdElement    = await FreeformField.Model.addToFormObjectToDb (user, modelId, formId, elementId, element, 'model', firestoreBatch);
                    let createdElement    = await FreeformElement.Model.addToFormObjectToDb (
                        element['options']['object'],
                        user,
                        modelId,
                        formId,
                        elementId,
                        element,
                        'model',
                        firestoreBatch
                    );
                    if ( !createdElement ) {
                        LOG.fstep(fname, 3, 1, "END ERROR - We can not create element", createdElement );

                        return CONNECT.returnPromiseWithValue(false);

                    } else {
                        LOG.fstep(fname, 3, 2, "We can  create field - next", createdElement );
                    }
                }

                LOG.fstep(fname, 4, 1, "END SUCCESS - We add all elements for write to bacht for late add to db");
                return CONNECT.returnPromiseWithValue(true);

                // let result = await FIREBASE.writeBatchFirestoreDbGroup(firestoreBatch);
                // LOG.fstep(fname, 0, 4, "TEST - ",   result);
            } else {
                LOG.fstep(fname, 2, 2, "END ERROR - we has not fields",   elements);
                return CONNECT.returnPromiseWithValue(null);
            }
        }

    }



//@> function



//@< GLOBAL LOCAL DATA
    //@< for model ONLY
    //@< for model ONLY
//@> GLOBAL DATA







async function createFreeformObjectForMembers (iNuser, iNformModelId, iNformObjectId, iNform, iNuidList, iNuidCreator, iNfiresotreBatchGroup) {
    let fname           = 'createFreeformObjectForMembers',
        connectedUsers  = iNuidList;//


    LOG.fstep (fname,1,0,'INVOKE - iNuser, iNformModelId, iNformObjectId, iNuidCreator, connectedUsers',
        iNuser, iNformModelId, iNformObjectId, iNuidCreator, connectedUsers);

    let promiseAll = [];
    for (let thisUid of connectedUsers) {
        let resultForCreate = createFreeformObjectForMember (iNuser, iNformModelId, iNformObjectId, iNform, thisUid, iNuidCreator, iNfiresotreBatchGroup);
        promiseAll.push(resultForCreate);
    }

    return Promise.all(promiseAll);

}

async function createFreeformObjectForMember (iNuser, iNformModelId, iNformObjectId, iNform, iNthisUid, iNuidCreator, iNfirestoreBatchGroup) {
    /*
      @discr
      @inputs
        @required
        @optinal
          iNdb
          iNbatch
    */

    let fname           = 'createFreeformObjectForMember',
        pathToGenId     = `${iNthisUid}/freeform`,
        genId           = CONNECT.createHashMd5(`${iNuser}.${iNformModelId}.${iNformObjectId}`),//FIREBASE.generateIdForFirestoreByFullPathToDb('users', pathToGenId),
        pathToDoc       = `users/${pathToGenId}/${genId}`,
        objForWriteToDb = {
            'createdTime'   : FIREBASE.getFirestoreSeverVarTimestamp(),
            'name'          : iNform['name'],
            'formId'        : iNformObjectId,
            'formModelId'   : iNformModelId,
            'formUser'      : iNuser,
            'creator'       : iNuidCreator,
            'status'        : 1,
            'useType'       : FreeformShared.Options.getUseType(iNform),
            'active'        : FreeformShared.Options.getActive(iNform),
            'redTime'       : FreeformShared.Options.getRedTime(iNform),
            'dearTime'      : FreeformShared.Options.getDeadTime(iNform),
            'expiredTime'   : FreeformShared.Options.getExpiredTime(iNform),
            'activeTime'    : FreeformShared.Options.getActiveTime(iNform),
            'state'         : FreeformShared.Options.getCustomState(iNform),
            'data'          : {}// here we add later custom field values from form
        };

    LOG.fstep (fname,1,0,'INVOKE - iNuser, iNformModelId, iNformObjectId, iNuidCreator, iNthisUid',
        iNuser, iNformModelId, iNformObjectId, iNuidCreator, iNthisUid);


    LOG.fstep (fname,1,1,'genId, pathToGenId, pathToDoc, objForWriteToDb', genId, pathToGenId, pathToDoc, objForWriteToDb);


    // add to db
    return FIREBASE.batchGroupCreate (
        pathToDoc,
        objForWriteToDb,
        iNfirestoreBatchGroup
    );
}

module.exports  = _;
