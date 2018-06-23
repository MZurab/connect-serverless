const CONNECT   = require('../../../connect');
const LOG       = require('ramman-z-log');
const Form          = require('./Form').Form;// FreeformGlobalStorage
// const CONNECT   = require('../../../connect');

class Field {

    constructor(){}

    static getField (iNformUser, iNformModelId, iNformId, iNfieldModelId) {
        const fname = 'Field.getField';


        let form = Form.getObject( iNformUser, iNformModelId, iNformId );

        LOG.fstep(
            fname, 0, 0,
            'INVOKE - iNformUser, iNformModelId, iNformId, iNfieldModelId, form',
            iNformUser, iNformModelId, iNformId, iNfieldModelId, form
        );

        if (
            form &&
            form['fields'] &&
            form['fields'][iNfieldModelId]
        ) {
            LOG.fstep (
                fname,1, 1,
                'END SUCCESS - We have field',
                form['fields'][iNfieldModelId]
            );

            return global['freeform']['form'][iNformUser][iNformModelId][iNformId]['fields'][iNfieldModelId];
        } else {
            LOG.fstep (
                fname, 1, 2,
                'END ERROR -We have not field yet'
            );

        }

        return null;
    }

    static getFieldModel (iNformUser, iNformModelId, iNformId, iNfieldModelId) {
        const fname = 'Field.getFieldModel';

        let field = Field.getField( iNformUser, iNformModelId, iNformId, iNfieldModelId );
        LOG.fstep (
            fname, 0, 0,
            'INVOKE - iNformUser, iNformModelId, iNformId, iNfieldModelId , field',
            iNformUser, iNformModelId, iNformId, iNfieldModelId, field
        );

        LOG.fstep (
            fname, 0, 1,
            'global.freeform',
            global['freeform']
        );

        if (
            field &&
            field['base']
        ) {
            LOG.fstep (
                fname, 1, 2,
                'END SUCCESS - field.base',
                field['base']
            );
            return field['base'];
        } else {
            LOG.fstep (
                fname, 1, 2,
                'END ERROR', field
            );
        }

        return null;
    }

    static getFieldModelFromBuffer (iNformUser, iNformModelId, iNfieldModelId) {
        return Field.getFieldModel(iNformUser, iNformModelId, '@buffer', iNfieldModelId);
    }

    static getFieldObject (iNformUser, iNformModelId, iNformId, iNfieldModelId, iNfieldId) {

        let field = Field.getField( iNformUser, iNformModelId, iNformId, iNfieldModelId );
        if (
            field &&
            field['objects'] &&
            field['objects'][iNfieldId]
        ) {
            return field['objects'][iNfieldId];
        }
        return null;
    }

    static prepareGlobalObjectForFormField ( iNuser, iNformModelId, iNformId ) { //-
        Form.prepareGlobalObjectForFormObject(iNuser, iNformModelId, iNformId);

        if ( !global['freeform']['form'][iNuser][iNformModelId][iNformId]['fields'] ) {
            global['freeform']['form'][iNuser][iNformModelId][iNformId]['fields'] = {};
        }
    }

    static prepareGlobalObjectForFormFieldModel ( iNuser, iNformModelId, iNformId, iNfieldModelId ) { //-
        Field.prepareGlobalObjectForFormField(iNuser, iNformModelId, iNformId);

        if ( !global['freeform']['form'][iNuser][iNformModelId][iNformId]['fields'][iNfieldModelId]  ) {
            global['freeform']['form'][iNuser][iNformModelId][iNformId]['fields'][iNfieldModelId] = {};
        }
    }

    static addFieldModelToGlobal ( iNuser, iNformModelId, iNformId, iNfieldModelId, iNfieldModel ) { //+
        const fname = 'addFieldModelToGlobal';

        LOG.fstep(
            fname, 0, 0,
            'INVOKE - iNuser, iNformModelId, iNformId, iNfieldModelId, iNfieldModel',
            iNuser, iNformModelId, iNformId, iNfieldModelId, iNfieldModel
        );

        console.log ( fname, 'global 1', JSON.stringify ( global['freeform'] )  );
        Field.prepareGlobalObjectForFormFieldModel( iNuser, iNformModelId, iNformId, iNfieldModelId);

        global[ 'freeform' ][ 'form' ][ iNuser ][ iNformModelId ][ iNformId ][ 'fields' ][ iNfieldModelId ][ 'base' ] = iNfieldModel
        ;
        console.log( fname, 'global 2',  JSON.stringify(global['freeform'])  );

    }

    static addFieldModelToBuffer ( iNuser, iNformModelId, iNfieldModelId, iNfieldModel ) { //+
        // we use buffer when we just get from root model and want create
        Field.addFieldModelToGlobal(iNuser, iNformModelId, '@buffer', iNfieldModelId, iNfieldModel )
    }

    static addFieldObjectToGlobal ( iNuser, iNformModelId, iNformId, iNfieldModelId, iNfielId, iNfieldObject  ) {

        Field.prepareGlobalObjectForFormFieldModel( iNuser, iNformModelId, iNformId, iNfieldModelId);

        // if we opern first time -> opent this model
        if (
            !global[ 'freeform' ][ 'form' ][ iNuser ][ iNformModelId ][ iNformId ][ 'fields' ][ iNfieldModelId ][ 'objects' ]
        ) {
            global[ 'freeform' ][ 'form' ][ iNuser ][ iNformModelId ][ iNformId ][ 'fields' ][ iNfieldModelId ][ 'objects' ] = {};
        }

        global[ 'freeform' ][ 'form' ][ iNuser ][ iNformModelId ][ iNformId ][ 'fields' ][ iNfieldModelId ][ 'objects' ][iNfielId] = iNfieldObject;
    }
}
module.exports.Field = Field;