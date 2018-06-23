const CONNECT   = require('../../../connect');
const LOG       = require('ramman-z-log');

class Stepper {

    constructor(){}

    static getSteppersForFormObject (iNformUser, iNformModelId, iNformId) {
        const fname = 'Field.getSteppersForFormObject';

        LOG.fstep(
            fname, 0, 0,
            'INVOKE - iNformUser, iNformModelId, iNformId, iNfieldModelId, form',
            iNformUser, iNformModelId, iNformId
        );

        if (
            global['freeform'] &&
            global['freeform']['stepper'] &&
            global['freeform']['stepper'][iNformModelId] &&
            global['freeform']['stepper'][iNformModelId][iNformId]
        ) {
            LOG.fstep (
                fname,1, 1,
                'END SUCCESS - We have field',
                global['freeform']['stepper'][iNformModelId][iNformId]
            );

            return  global['freeform']['stepper'][iNformModelId][iNformId] ;
        } else {
            LOG.fstep (
                fname, 1, 2,
                'END ERROR -We have not field yet'
            );

        }

        return null;
    }

    static prepareGlobalObjectForStepper ( iNformModelId ) { //-
        if ( typeof global['freeform'] !== 'object' ) {
            global['freeform'] = {};
        }

        if ( typeof global['freeform']['stepper'] !== 'object' ) {
            global['freeform']['stepper'] = {};
        }

        if ( typeof global['freeform']['stepper'][iNformModelId] !== 'object' ) {
            global['freeform']['stepper'][iNformModelId] = {};
        }
    }

    static addStepper ( iNuser, iNformModelId, iNformId, iNsteppers ) { //+
        const fname = 'Stepper.addStepper';

        LOG.fstep (
            fname, 0, 0,
            'INVOKE -  iNuser, iNformModelId, iNformId, iNsteppers',
            iNuser, iNformModelId, iNformId, iNsteppers
        );

        console.log(fname, 'global stepper - 1', JSON.stringify(  global['freeform']['stepper'] )  );

        Stepper.prepareGlobalObjectForStepper(iNformModelId);
        global[ 'freeform' ][ 'stepper' ][ iNformModelId ][ iNformId ] = iNsteppers;

        console.log(fname, 'global stepper - 2',  JSON.stringify( global['freeform']['stepper'] )  );

    }


}
module.exports.Stepper = Stepper;