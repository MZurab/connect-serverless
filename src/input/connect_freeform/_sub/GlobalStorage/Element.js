// const CONNECT   = require('../../../connect');
const LOG       = require('ramman-z-log');
// const CONNECT   = require('../../../connect');
const Form          = require('./Form').Form;// FreeformGlobalStorage

class Element {
    constructor () {
        
    }
    
    static getFolderNameByType (iNtype) {
        let res = null;
        
        switch (iNtype) {
            case "field":
                res = 'fields';
            break;
            case "group":
                res = 'groups';
            break;
            case "row":
                res = 'rows';
            break;
            case "page":
                res = 'pages';
            break;
        } 
        
        return res;
    }

    static getElement (iNelType, iNformUser, iNformModelId, iNformId, iNelModelId) {
        const fname = 'Element.getElement';


        let form = Form.getObject( iNformUser, iNformModelId, iNformId );
        
        let elType      = iNelType,
            modelId     = iNelModelId,
            folderName  = Element.getFolderNameByType(elType);
        
        

        LOG.fstep( fname, 0, 0, 'INVOKE - iNelType, iNformUser, iNformModelId, iNformId, iNelModelId, form, folderName', iNelType, iNformUser, iNformModelId, iNformId, modelId, form, folderName);

        if (
            form &&
            form[folderName] &&
            form[folderName][modelId] &&

            form[folderName][modelId].base
        ) {
            LOG.fstep (
                fname,1, 1,
                'END SUCCESS - We have element', elType, form[folderName][modelId].base
            );

            return form[folderName][modelId].base;
            //global['freeform']['form'][iNformUser][iNformModelId][iNformId][folderName][modelId].base;
        } else {
            LOG.fstep (
                fname, 1, 2,
                'END ERROR -We have not field yet'
            );

        }

        return null;
    }

    static getElementModel (iNelType, iNformUser, iNformModelId, iNformId, iNelModelId) {
        const fname = 'Element.getElementModel';

        let element = Element.getElement(iNelType, iNformUser, iNformModelId, iNformId, iNelModelId );
        LOG.fstep (
            fname, 0, 0,
            'INVOKE - iNelType, iNformUser, iNformModelId, iNformId, iNelModelId , element',
            iNelType, iNformUser, iNformModelId, iNformId, iNelModelId, element
        );

        LOG.fstep ( fname, 0, 1, 'global.freeform', global['freeform']);

        if (
            element &&
            element['base']
        ) {
            LOG.fstep ( fname, 1, 2, 'END SUCCESS - element.base', element['base'] );
            return element['base'];
        } else {
            LOG.fstep ( fname, 1, 2, 'END ERROR', element );
        }

        return null;
    }

    static getElementModelFromBuffer (iNelType, iNformUser, iNformModelId, iNelModelId) {
        return Element.getElementModel(iNelType, iNformUser, iNformModelId, '@buffer', iNelModelId);
    }
    
    static getElementObject (iNelType, iNformUser, iNformModelId, iNformId, iNelModelId, iNelId) {

        let element = Element.getElement(iNelType, iNformUser, iNformModelId, iNformId, iNelModelId );
        if (
            element &&
            element['objects'] &&
            element['objects'][iNelId]
        ) {
            return element['objects'][iNelId];
        }
        return null;
    }

    static prepareGlobalObjectForFormElement (iNelType, iNuser, iNformModelId, iNformId ) { //-
        Form.prepareGlobalObjectForFormObject(iNuser, iNformModelId, iNformId);
        
        let elType      = iNelType,
            folderName  = Element.getFolderNameByType(elType);
        
        if ( !global['freeform']['form'][iNuser][iNformModelId][iNformId][folderName] ) {
            global['freeform']['form'][iNuser][iNformModelId][iNformId][folderName] = {};
        }
    }

    static prepareGlobalObjectForFormElementModel ( iNelType, iNuser, iNformModelId, iNformId, iNelModelId ) { //-
        Element.prepareGlobalObjectForFormElement(iNelType, iNuser, iNformModelId, iNformId);
        
        let elType      = iNelType,
            folderName  = Element.getFolderNameByType(elType);
        
        if ( !global['freeform']['form'][iNuser][iNformModelId][iNformId][folderName][iNelModelId]  ) {
            global['freeform']['form'][iNuser][iNformModelId][iNformId][folderName][iNelModelId] = {};
        }
    }

    static addElementModelToGlobal ( iNelType, iNuser, iNformModelId, iNformId, iNelModelId, iNelModel ) { //+
        const fname = 'Element.addElementModelToGlobal';

        LOG.fstep(
            fname, 0, 0,
            'INVOKE - iNelType, iNuser, iNformModelId, iNformId, iNelModelId, iNelModel',
            iNelType, iNuser, iNformModelId, iNformId, iNelModelId, iNelModel
        );

        let elType      = iNelType,
            folderName  = Element.getFolderNameByType(elType);

        console.log ( fname, 'global 1', JSON.stringify ( global['freeform'] )  );
        Element.prepareGlobalObjectForFormElementModel( iNelType, iNuser, iNformModelId, iNformId, iNelModelId);

        global[ 'freeform' ][ 'form' ][ iNuser ][ iNformModelId ][ iNformId ][ folderName ][ iNelModelId ][ 'base' ] = iNelModel;
        
        console.log( fname, 'global 2',  JSON.stringify(global['freeform'])  );
    }

    static addElementObjectToGlobal ( iNelType, iNuser, iNformModelId, iNformId, iNelModelId, iNelId, iNelObject  ) {

        Element.prepareGlobalObjectForFormElementModel( iNelType, iNuser, iNformModelId, iNformId, iNelModelId);

        let elType      = iNelType,
            folderName  = Element.getFolderNameByType(elType);
        
        // if we opern first time -> opent this model
        if (
            !global[ 'freeform' ][ 'form' ][ iNuser ][ iNformModelId ][ iNformId ][ folderName ][ iNelModelId ][ 'objects' ]
        ) {
            global[ 'freeform' ][ 'form' ][ iNuser ][ iNformModelId ][ iNformId ][ folderName ][ iNelModelId ][ 'objects' ] = {};
        }

        global[ 'freeform' ][ 'form' ][ iNuser ][ iNformModelId ][ iNformId ][ folderName ][ iNelModelId ][ 'objects' ][iNelId] = iNelObject;
    }
}
module.exports.Element = Element;
