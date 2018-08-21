const FIREBASE  = require("./../../../firebase/firebase");
const CONNECT   = require('../../../connect');
const firestore = FIREBASE.firestore;
const LOG       = require('ramman-z-log');

const Stepper                   = require("./../GlobalStorage/Stepper").Stepper;
const FreeformFormObject        = require("./../Form/FreeformFormObject").FreeformFormObject;
const AccessListShared           = require('./../AccessList/AccessListShared').AccessListShared_;// AccessListShared
const FreeformShared            = require('./../FreeformShared').FreeformShared;// FreeformShared

class FreeformStepper {

    //@root
    static async performStep (
        iNformUser,
        iNformModelId,
        iNformId,
        iNform,
        iNstepperId,
        iNstepper,
        iNfirestoreBatchGroup
    ) {
        const fname     = 'performStep',
              stepper   = iNstepper;

        LOG.fstep (
            fname, 0, 0, 'INVOKE - iNformUser, iNformModelId, iNformId, iNform, iNstepperId, iNstepper',
            iNformUser, iNformModelId, iNformId, iNform, iNstepperId, stepper
        );
        let result = false;

        let proccessAccess  = await AccessListShared.checkListForAccessToFreeformObject (
            'read',
            'stepper',
            stepper['id'],
            '@self',
            iNformUser,
            iNformModelId,
            iNformId,
            stepper,
            null
        );

        if ( !proccessAccess ) {
            LOG.fstep( fname, 2, 1,'ERRROR END - we have not access to this obj', stepper, proccessAccess);
            return CONNECT.returnPromiseWithValue(false);
        } else {
            LOG.fstep( fname, 2, 2,'We have access to this obj', stepper, proccessAccess);
            // we have access to this stepper

            // check stepper
            let rule = stepper['rule'];
            if ( Array.isArray(rule) ) {
                result = await FreeformStepper.checkRuleArray ( rule , iNform );
            }

            if ( result && stepper['action'] ) {
                let performActionBlock =  await FreeformStepper.perfomActionBlock (
                    iNformUser,
                    iNformModelId,
                    iNformId,
                    stepper['action'],
                    iNfirestoreBatchGroup
                );
                LOG.fstep( fname, 2, 3,'We have access to this obj', performActionBlock);

            }
            LOG.fstep( fname, 2, 4,'We have access to this obj', result, stepper);
        }

        return CONNECT.returnPromiseWithValue(result);
    }

    static sortRuleElObject (iNarray) {
        // desc order by weight
        return iNarray.sort((obj1, obj2) => {
            obj1.weight           = ((obj1.weight) ? obj1.weight : 1);
            obj1.order            = ((obj1.order) ? obj1.order : 1);
            obj1.group            = ((obj1.group) ? obj1.group : 1);

            let commonWeightObj1  = (obj1.weight * 1000) + obj1.order;

            obj2.weight           = ((obj2.weight) ? obj2.weight : 1);
            obj2.order            = ((obj2.order) ? obj2.order : 1);
            obj2.group            = ((obj2.group) ? obj2.group : 1);

            let commonWeightObj2  = (obj2.weight * 1000) + obj2.order;

            var groupWeightObj = 0;
            if(obj1.group < obj2.group) groupWeightObj = -1;
            if(obj1.group > obj2.group) groupWeightObj = 1;
            groupWeightObj *= 100;

            return  commonWeightObj2 - commonWeightObj1 + groupWeightObj;
        });
    }

    static async checkRuleArray (iNrulesOfObject, iNform) { //+
        //@public
        let ruleBlock       = iNrulesOfObject,
            statusByWeight  = {},
            statusByGroup   = {},
            lastWeight      = null,
            lastGroup       = null,
            counter         = 0;


        // sort this object before start iteration by weight and group (need for right result)
        ruleBlock = FreeformStepper.sortRuleElObject(ruleBlock);

        for (let ruleEl of ruleBlock) {
            // increase counter Need for recoginize last operation
            counter++;

            let weight = ruleEl['weight'];
            let group = ruleEl['group'];


            // if this first iteration -> set initial lastWeight && lastGroup
            if (lastWeight === null) {
                lastWeight  = weight;
                lastGroup   = group;
            }

            if (lastWeight === weight ) {
                // if this weight is the same previous weight ->

                if (lastGroup !== group ) {
                    if ( statusByWeight[lastWeight] === true ) {
                        // if this new group but in the same weigth but same group was success -> we SKIP <- DONT CHECK
                        continue;
                    } else {
                        // if this new group but in the same weigth but same group was false -> we continue <- DONT CHECK

                    }
                } else if (statusByWeight[group] === false) {
                    // if this the same group but at less one operation in this group was false -> continue;
                    continue;
                }

            } else if ( lastWeight !== weight && statusByWeight[lastWeight] !== true ) {
                // if this new weight but last weight is false -> return false;
                return CONNECT.returnPromiseWithValue(false);
                // break;
            }

            // if this new grou and thes previous group was false -> we check next
            let result = FreeformStepper.checkRuleElOperation (ruleEl, iNform);

            // set result for group and weight
            statusByWeight[weight]  = statusByWeight[group] = result;

            if (ruleBlock.length === counter && !result) {
                // if this was last operation and result was false => output false (need only for single array)
                return CONNECT.returnPromiseWithValue(false);
            }

            // set last group and last weight
            lastWeight  = weight;
            lastGroup   = group;

        }

        return CONNECT.returnPromiseWithValue(true);
    }


    //@root
    static async run (iNformUser, iNmodelId, iNformId, iNform, iNfirestoreBatchGroup ) {
        /*
          @inputsgetFormModelAccessList
            @required
              iNformUser : string
              iNmodelId : string
              iNmyUid : string
        */
        // passed data
        let fname           = 'Stepper.getStepperFromFormObjectDb',
            user            = iNformUser,
            formModelId     = iNmodelId,
            form            = iNform,
            firestoreBatchGroup = iNfirestoreBatchGroup,
            formId          = iNformId;

        LOG.fstep ( fname, 1, 0,'INVOKE - user, formModelId, data', user, formModelId, formId );


        const   pathToFireStoreDb   = `freeform/${user}/model/${formModelId}/form/${formId}/stepper`,
                firestoreRef        = firestore().collection(pathToFireStoreDb)
                    .where( "active", "==", true )
                    .orderBy("weight")
                    .orderBy("group")
                    .orderBy("order");

        LOG.fstep (fname, 1,0,'will get access fields object of form object from path - ', pathToFireStoreDb);
        return new Promise (
            async  (resolve) => {
                firestoreRef.get().then(
                    async (docs) => {
                        if ( !docs.empty ) {
                            LOG.fstep (fname, 2, 1,' stepper of form object is  exist');

                            let resultDocs = {};

                            for (let doc of docs.docs) {

                                //
                                const   stepperId   = doc.id,
                                        stepper     = doc.data();

                                resultDocs[stepper] = stepper;
                                let result = await FreeformStepper.performStep (
                                    user,
                                    formModelId,
                                    formId,
                                    form,
                                    stepperId,
                                    stepper,
                                    firestoreBatchGroup
                                );

                                if ( result ) {
                                    resolve(result);
                                    return;
                                    // return CONNECT.returnPromiseWithValue(result);
                                }
                                LOG.fstep (fname, 3, 1,' stepper result', stepperId, stepper, result);
                            }

                            // resolve(false);
                            // return;
                        }

                        LOG.fstep (fname, 2, 2,'ERROR -  stepper is not exist');
                        resolve(null);
                    }
                ).catch(
                    (error) => {
                        console.log( fname, 'error', error );
                        LOG.fstep (fname, 2, 3,'ERROR - stepper of form object is not exist');
                        resolve(null)
                    }
                );
            }
        );
    }

    // static async getStepperFromFormObjectDb (iNuserLogin, iNmodelId, iNformId ){
    //     /*
    //       @inputsgetFormModelAccessList
    //         @required
    //           iNuserLogin : string
    //           iNmodelId : string
    //           iNmyUid : string
    //     */
    //     // passed data
    //     let fname           = 'Stepper.getStepperFromFormObjectDb',
    //         user            = iNuserLogin,
    //         formModelId     = iNmodelId,
    //         formId          = iNformId;
    //
    //     LOG.fstep ( fname, 1, 0, 'INVOKE - user, formModelId, formId', user, formModelId, formId );
    //
    //
    //     const   pathToFireStoreDb   = `freeform/${user}/model/${formModelId}/form/${formId}/stepper`,
    //             firestoreRef        = firestore().collection(pathToFireStoreDb);
    //
    //     LOG.fstep ( fname, 1, 1, 'will get access fields object of form object from path - ', pathToFireStoreDb );
    //     return new Promise(
    //         (resolve) => {
    //             firestoreRef.get().then(
    //                 (docs) => {
    //                     if ( !docs.empty ) {
    //                         LOG.fstep (fname, 1, 2,' stepper of form object is  exist');
    //
    //                         let resultDocs = {};
    //
    //                         // add to local storage for later access without reloading
    //                         Stepper.addStepper(user, formModelId, formId, docs.docs);
    //
    //                         for (let doc of docs.docs) {
    //                             const   fieldId = doc.id,
    //                                 field   = doc.data();
    //                             resultDocs[fieldId] = field;
    //                         }
    //
    //                         resolve(resultDocs);
    //                         return;
    //                     }
    //
    //                     LOG.fstep (fname, 1, 3,'ERROR -  stepper of form object is not exist');
    //                     resolve(null);
    //                 }
    //             ).catch(
    //                 (error) => {
    //                     LOG.fstep (fname, 1, 4,'ERROR - stepper of form object is not exist');
    //                     resolve(null)
    //                 }
    //             );
    //         }
    //     );
    // }

    static async copyStepperFromFormModelToFormObject (iNuserLogin, iNmodelId, iNformId, iNfirestoreBatchGroup ) {
        /*
          @inputsgetFormModelAccessList
            @required
              iNuserLogin : string
              iNmodelId : string
              iNmyUid : string
        */
        // passed data
        let fname           = 'Stepper.copyStepperFromFormModelToFormObject',
            user            = iNuserLogin,
            formModelId     = iNmodelId,
            formId          = iNformId,
            freeform        = global['freeform'];

        LOG.fstep ( fname, 1, 0,'INVOKE - user, formModelId, formId', user, formModelId, formId );


        const   pathToFireStoreDb   = `freeform/${user}/model/${formModelId}/stepper`,
                firestoreRef        = firestore().collection(pathToFireStoreDb)
                                        .where ( "active", "==", true );

        LOG.fstep (fname, 1, 1,'will get access stepper of form model from path - ', pathToFireStoreDb);
        return new Promise (
            async (resolve) => {
                firestoreRef.get().then(
                    async (docs) => {
                        if ( !docs.empty ) {
                            try {
                                LOG.fstep (fname, 1, 2,' stepper of form model is  exist');

                                let resultDocs = {};

                                for (let doc of docs.docs) {
                                    const   stepperId   = doc.id,
                                            stepper     = doc.data();

                                    let proccessAccess  = await AccessListShared.checkListForAccessToFreeformObject (
                                        'create',
                                        'stepper',
                                        stepper['id'],
                                        '@self',
                                        user,
                                        formModelId,
                                        formId,
                                        stepper,
                                        null
                                    );

                                    if ( !proccessAccess ) {
                                        LOG.fstep( fname, 2, 1,'ERRROR END - we have not access to this obj', stepper, proccessAccess);
                                        return CONNECT.returnPromiseWithValue(false);
                                    } else {
                                        LOG.fstep( fname, 2, 2,'ERRROR END - we have not access to this obj', stepper, proccessAccess);
                                        // we have access to this form
                                            FreeformShared.Options.convertModelOptionsToWorkFormat ( stepper,  false,  false);
                                        // add
                                            FIREBASE.batchGroupCreate (
                                                `freeform/${user}/model/${formModelId}/form/${formId}/stepper/${stepperId}`,
                                                stepper,
                                                iNfirestoreBatchGroup
                                            );
                                        // add stepper to result
                                            resultDocs[stepperId] = stepper;
                                    }
                                }
                                // add to local storage for later access without reloading
                                    Stepper.addStepper( user, formModelId, formId, resultDocs );
                                // resolve doc
                                    resolve ( resultDocs );

                            } catch (e) {
                                console.log( fname,'ERROR - e', e );
                            }
                        }

                        LOG.fstep (fname, 1, 3,'ERROR -  stepper of form model is not exist');
                        resolve(null);
                    }
                ).catch(
                    (error) => {
                        LOG.fstep (fname, 1, 4,'ERROR - stepper of form model is not exist');
                        resolve(null)
                    }
                );
            }
        );
    }

    static getValue (iNform, iNvalueObject) {
        let valObj = iNvalueObject;
        if (typeof valObj !== 'object') {
            return valObj;
        } else if (valObj['type']){
            let type = valObj['type'];
            switch (type) {
                case "element": {
                    let in_id   = valObj['in_id'],
                        el      = FreeformStepper.getFreefomObjectByInIdFromForm(iNform, in_id ),
                        path    = valObj['pathToValue'];

                    if ( path && in_id && el) {
                        return CONNECT.getValueFromObjectByPath ( path, el );
                    } {
                        return el;
                    }

                }
                case "element-focus": {
                    let in_id   = valObj['in_id'],
                        el      = FreeformStepper.getFreefomObjectByInIdFromForm(iNform, in_id ),
                        path    = "body.status.focus";

                    if (in_id && el) {
                        return CONNECT.getValueFromObjectByPath ( path, el );
                    } {
                        return el;
                    }
                }


                case "element-active": {
                    let in_id   = valObj['in_id'],
                        el      = FreeformStepper.getFreefomObjectByInIdFromForm(iNform, in_id ),
                        path    = "body.status.value";

                    if (in_id && el) {
                        return ( CONNECT.getValueFromObjectByPath ( path, el ) ) ? true : false;
                    } {
                        return el;
                    }
                }

                case "uid" : {
                    return CONNECT.getUid()
                }

                case "field-value":
                {
                    let in_id   = valObj['in_id'],
                        el      = FreeformStepper.getFreefomObjectByInIdFromForm(iNform, in_id ),
                        path    = 'body.value';

                    if (  in_id && el ) {
                        return CONNECT.getValueFromObjectByPath ( path, el );
                    } {
                        return null;
                    }
                }

                case "element-status":
                {
                    let in_id   = valObj['in_id'],
                        el      = FreeformStepper.getFreefomObjectByInIdFromForm(iNform, in_id ),
                        path    = 'body.status.value';

                    if (  in_id && el ) {
                        return CONNECT.getValueFromObjectByPath ( path, el );
                    } {
                        return null;
                    }
                }

                case "form-status":
                {
                    if (iNform) {
                        if (
                            typeof iNform === 'object' &&
                            typeof iNform['options'] === 'object'
                        ) {
                            return iNform['options']['status'];
                        }
                    }
                    return null;
                }



                case "form-state":
                {
                    if (iNform) {
                        if (
                            typeof iNform === 'object' &&
                            typeof iNform['options'] === 'object'
                        ) {
                            return iNform['options']['state'];
                        }
                    }
                    return null;
                }
            }
        }
    }

    static checkRuleElOperation (iNstepperRule, iNform) {
        //
        const fname = 'Stepper.checkRuleElOperation';

        LOG.fstep ( fname, 0,0,'INVOKE - iNstepperRule, iNform', iNstepperRule, iNform );

        let type    = iNstepperRule['type'],
            // elem    = FreeformStepper.getFreefomObjectByInIdFromForm(iNform, iNstepperRule['in_id']),
            val1     = FreeformStepper.getValue  (iNform, iNstepperRule['val1'] ) ;

        // if ( !elem ) return false;

        const val2   =  FreeformStepper.getValue (iNform, iNstepperRule['val2'] ) ;

        let result  = false;
        switch (type) {
            //@< EQUALORMORE OR LESSORMORE
                case 'isMoreOrEqual':
                    // if this element's value is more or euial  than value and is not exist
                    if (
                        (typeof val1 === 'string' && val1 >= (val2 + "")) ||
                        (typeof val1 === 'number' && val1 >= ( parseInt(val2) ) )
                    ) {
                        result =  true;
                    }
                break;

                case 'isLessOrEqual':
                    // if this element's value is less or euial  than value and is not exist
                    if (
                        (typeof val1 === 'string' && val1 <= (val2 + "")) ||
                        (typeof val1 === 'number' && val1 <= ( parseInt(val2) ) )
                    ) {
                        result =  true;
                    }
                break;
            //@> EQUALORMORE OR LESSORMORE

            //@< MORE OR LESS
                case 'isMore':
                    // if this element's value is more than value and is not exist
                    if (
                            (typeof val1 === 'string' && val1 > (val2 + "")) ||
                            (typeof val1 === 'number' && val1 > ( parseInt(val2) ) )
                    ) {
                        result =  true;
                    }
                break;

                case 'isLess':
                    // if this element's value is less than value and is not exist
                    if (
                        typeof val1 === 'object'  && (
                            (typeof val1 === 'string' && val1 < (val2 + "")) ||
                            (typeof val1 === 'number' && val1 < ( parseInt(val2) ) )
                        )
                    ) {
                        result =  true;
                    }
                break;
            //@> MORE OR LESS

            //@< EQUIL
                case 'isEqual':
                    // if this element's value is euqilt and is not exist
                    if (
                            (typeof val1 === 'string' && val1 === ( val2 + "" ) ) ||
                            (typeof val1 === 'number' && val1 === ( parseInt(val2) ) )

                    ) {
                        result =  true;
                    }
                break;

                case '!isEqual':
                    // if this element's value is not euqil and is not exist
                    if (
                        (typeof val1 === 'string' && val1 !== ( val2 + "" ) ) ||
                        (typeof val1 === 'number' && val1 !== ( parseInt (val2) ) )
                    ) {
                        result =  true;
                    }
                break;
            //@> EQUIL


            //@< ANYOF
                case 'isAnyOf':
                    // if this element's value is in array and is not exist
                    if (
                        (Array.isArray(val1) && val1.indexOf(val2) !== -1) ||
                        (Array.isArray(val1) && val1.indexOf(parseInt(val2)) !== -1) // **LATER DELET**
                    ) {
                        result =  true;
                    }
                break;

                case '!isAnyOf':
                    // if this element's value is not in array and is not exist
                    if (
                        (Array.isArray(val1) && val1.indexOf(val2) === -1) &&
                        (Array.isArray(val1) && val1.indexOf(parseInt(val2)) === -1) // **LATER DELET**
                    ) {
                        result =  true;
                    }
                break;
            //@> ANYOF

            //@< IN
                case 'isIn':
                    // if this value is in array and is not exist
                    if (
                        (Array.isArray(val2) && val2.indexOf(val1) !== -1) ||
                        (Array.isArray(val2) && val2.indexOf(parseInt(val1)) !== -1) // **LATER DELET**
                    ) {
                        result =  true;
                    }
                break;

                case '!isIn':
                    // if this element's value is not in array and is not exist
                    if (
                        (Array.isArray(val2) && val2.indexOf(val1) === -1) &&
                        (Array.isArray(val2) && val2.indexOf( parseInt(val1) ) === -1) // **LATER DELET**
                    ) {
                        result =  true;
                    }
                break;
            //@> IN


            //@< FOCUS
                case 'isFocus':
                    // if this element's value is in focus now and is not exist
                    if (
                        typeof val1 === 'object'  &&
                        val1['body']['status']['focus'] === true
                    ) {
                        result =  true;
                    }
                break;
                case '!isFocus':
                    // if this element's value is not in focus now and is not exist
                    if (
                        typeof val1 === 'object'  &&
                        val1['body']['status']['focus'] !== true
                    ) {
                        result =  true;
                    }
                break;
            //@> FOCUS

            //@< TOUCHED
                case 'isTouched':
                    // if this element's value is in focus now and is not exist
                    if (
                        typeof val1 === 'object'  &&
                        val1['body']['status']['touched'] === true
                    ) {
                        result =  true;
                    }
                break;
                case '!isTouched':
                    // if this element's value is not in focus now and is not exist
                    if (
                        typeof val1 === 'object'  &&
                        val1['body']['status']['touched'] !== true
                    ) {
                        result =  true;
                    }
                break;

                case 'isUntouched':
                    // if this element's value is not in focus now and is not exist
                    if (
                        typeof val1 === 'object'  &&
                        val1['body']['status']['untouched'] === true
                    ) {
                        result =  true;
                    }
                break;
                case '!isUntouched':
                    // if this element's value is not in focus now and is not exist
                    if (
                        typeof val1 === 'object'  &&
                        val1['body']['status']['untouched'] !== true
                    ) {
                        result =  true;
                    }
                break;
            //@> TOUCHED

            //@< EXIST
                case '!isExist':
                    // if this elem is not exist
                    if ( !val1  ) { // !typeof val1 === 'object'
                        result =  true;
                    }
                break;

                case 'isExist':
                    // if this elem is exist
                    if ( val1 ) {
                        result =  true;
                    }
                break;
            //@> EXIST

            //@< ACTIVE
                case '!active':
                    // if this elem not active (not value OR value is false)
                    if (typeof val1 === 'object'  && val1['body']['status']['value'] !== true) {
                        result =  true;
                    }
                break;

                default:
                    // 'active' - if this elem is active (has value)
                    if (typeof val1 === 'object' && val1['body']['status']['value'] !== false) {
                        result =  true;
                    }
                break;
            //@> ACTIVE
        }
        return result;
    }


    static async perfomActionBlock (
        iNuser,
        iNformModelId,
        iNformObjectId,

        iNactionBlock,
        iNfirestoreGroupBatch
    ) {
        let fname       = 'Stepper.perfomActionBlcok',
            actionBlock = iNactionBlock;

        LOG.fstep ( fname, 0,0,'INVOKE - iNactionBlock', actionBlock );

        for ( let action of actionBlock ) {
            let result = await FreeformStepper.performAction(iNuser, iNformModelId, iNformObjectId, action, iNfirestoreGroupBatch);
            if ( !result ) {
                LOG.fstep ( fname, 1, 0, 'ERROR - we can not perform action', action );
            }
        }

        LOG.fstep ( fname, 2, 0, 'END SUCCESS - we performed action block' );

        return CONNECT.returnPromiseWithValue(true);
    }

    static async performAction (
        iNuser,
        iNformModelId,
        iNformObjectId,

        iNaction,
        iNfirestoreGroupBatch
    ) {
        const fname = 'Stepper.performAction';

        LOG.fstep ( fname, 0,0,'INVOKE - iNaction', iNaction );

        if ( typeof iNaction !== 'object') {
            LOG.fstep ( fname, 1, 1, 'We have not action', iNaction);
            return CONNECT.returnPromiseWithValue(false);
        }

        let action  = iNaction,
            type    = action['type'],
            val     = action['value'];

        switch (type) {
            case "setFormStatus":
                if ( typeof val !== 'number' ) {
                    LOG.fstep ( fname, 2, 1, 'We have not value', val);
                    return CONNECT.returnPromiseWithValue(false);
                }

                LOG.fstep ( fname, 2, 2, 'We have value -> update', val);

                return FreeformFormObject.updateFormStatus(iNuser, iNformModelId, iNformObjectId, val, iNfirestoreGroupBatch);
            // break;

            case "setFormState":
                if ( typeof val !== 'number' ) {
                    LOG.fstep ( fname, 2, 3, 'We have not value', val);
                    return CONNECT.returnPromiseWithValue(false);
                }
                LOG.fstep ( fname, 2, 4, 'We have value -> update', val);

                return FreeformFormObject.updateFormState(iNuser, iNformModelId, iNformObjectId, val, iNfirestoreGroupBatch);
            // break;

            //@LATER add - setFieldValue, copyField(group|page|row|field), createGroup(group|page|row|field), addMem
            //@LATER add - addMemeberByArray(), delMemberByArray, setMemberByArray
            //@LATER add - addAccessByArray(), delAccessByArray, setAccessByArray
        }

        LOG.fstep ( fname, 2, 0, 'END SUCCESS - we performed action block' );
        return CONNECT.returnPromiseWithValue(true);
    }



    static getFreefomObjectByInIdFromForm (iNform, iNinId, iNsearchObjects= null) {
        // get model of this
        const freeform   = iNform;

        // categories which search
        const search     = iNsearchObjects || [ 'fields', 'pages', 'groups', 'rows' ];

        for ( const type of search ) {
            // search in this cateogry
            for (const modelid of Object.keys( freeform[type] ) ) {
                //search in this categories' models if this model has objects (created object by this model)
                if (!freeform[type][modelid]['objects']) { continue; }

                for (const objid of Object.keys( freeform[type][modelid]['objects'] ) ) {
                    // search in this models' objects
                    var obj = freeform[type][modelid]['objects'][objid];
                    if ( iNinId === obj['id'] ) { return obj; }
                }
            }
        }
        return null;
    }


}
module.exports.FreeformStepper = FreeformStepper;