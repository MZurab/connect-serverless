/*
  public

    Connect_getActionPermission ((read||write||delete||update),app,action)
      example -  ACCESS.getActionPermission("delete","market","menus")
    Connect_checkAccessByRole (role,app) -
      example -   ACCESS.checkAccessByRole(123,"market");
*/

var DINAMO  = require("../aws/dynamo/dynamo");
var ALGOLIA = require("./../algolia/base");
var CONNECT = require('../connect');
const LOG   = require('ramman-z-log');

// var iNdata, data;



//@@@<<< OUTPUT FUNTIONCS

//@@@>>> OUTPUT FUNTIONCS

//@@@<<< INPUT FUNTIONCS

  function Connect_getMenuByUid (iNdata2,iNfuntion2) {
    /*
      @discr
        get menus by id
      @inputs
        @required
          1 - iNdata
            @required
              uid
            @optional
              cids
              links
              parents
          2 - iNfuntion
          3 - data
          4 - iNdata
      @return
        void > callback to function
    */
    if(
      typeof (iNdata2)           != 'object'   ||
      typeof (iNdata2.uid)       != 'string'   ||
      typeof (iNfuntion2)        != 'function'
    ) return false;
      var param2 = {};
      // for create cids? links? parents?
      param2 = Connect_rightCreateForMenu(iNdata2,param2);

      if( typeof(iNdata2.status) != 'number' )   iNdata2.status = 0;
      if( typeof(iNdata2.to) != 'string' )       iNdata2.to     = '*';
      if( typeof(iNdata2.select) == 'string' )   param2.select  = iNdata.select;

      param2.mask           = "#uid = :uid and #to = :to";
      param2.vals           = {
                                ':to'     : iNdata2.to,
                                ':uid'    : iNdata2.uid,
                                ':status' : iNdata2.status,
                                ':type' : "0",
                              };
      param2.keys           = {
                                '#uid'    : 'uid',
                                '#to'     : 'to',
                                '#status' : 'status',
                                '#type'   : 'type',
                              };
      param2.maskFilter     = "#status = :status and #type = :type";

      if( typeof(iNdata2.cids) == 'object' ) {
        param2 = DINAMO.addIn('cids',iNdata2.cids,param2);
      }

      param2.index = 'uid-to-index';
      param2.table = 'connect-category';
      DINAMO.query (param2,iNfuntion2);
  }

  function GOODS_get (iNdata,iNfunction) {
    /*
      @inputs
        @required
          @required
            iNdata -> object
              @required
                id -> array OR string
              @optioanal
                fields -> array
        @optional
          iNfunction

    */
    if(typeof(iNdata['id']) == 'undefined') return false;
    if( typeof(iNdata['fields']) != 'object' || Array.isArray(iNdata['fields']) == false ) iNdata['fields'] = ['*'];
    ALGOLIA.getById("Connect Market",iNdata['id'],iNdata['fields'],iNfunction);
  }
  module.exports.GOODS_get = GOODS_get;

  function GOODS_search (iNdata,iNuid,iNfunction) {
    /*
      @inputs
        @required
          1 - iNdata -> object
            search -> string or Array for multi search
            select -> array (DISABLE)
            orderBy -> string (default - viewed)
                cost || time || viewed || rate || sold
            orderDesc -> bool (default - false)
            cats -> array
            utype -> array
            cids -> array
            ids -> array
        @optional
          2 - iNuid -> string
          3 - iNfunction -> function
    */
    var orderIndexName,fIndexName,params ={},table='Connect Market';
    if( typeof(iNdata) != 'object') iNdata = {};
    if( typeof(iNdata['limit'])   != 'number'   ) iNdata['limit']   = 100;
    if( typeof(iNdata['page'])    == 'number'   ) params['page']    = iNdata['page'];
    if( typeof(iNdata['orderBy']) != 'string' ) iNdata['orderBy']   = 'viewed';

    if( typeof(iNdata['orderDesc']) != 'boolean') iNdata['orderDesc'] = false;
    params['limit'] = iNdata['limit'];

    var filters = {}, searchStr='';

    if ( typeof(iNuid) != 'string') {
      // if query from user
      filters['uid']  = iNuid;
    } else {
    }
    switch (iNdata['orderBy']) {
        case "sold":
        break;
        case "time":
        break;
        case "rate":
        break;
        case "cost":
        break;
        default:
        break;
    }
    if( typeof(iNdata['fields']) == 'object' ){
      //if isset cids
      params['fields'] = iNdata['fields'];
    }
    if( typeof(iNdata['last']) == 'string' ){
      //if last object
      params['last'] = iNdata['last'];
    }
    params['full_filters'] = [];
    if( typeof(iNdata['block_cost_null']) != 'undefined' ){
      //if last object
      params['full_filters'].push(
        [
          {
             'key'   : 'cost',
             'mark'  : '>',
             'val'   : 0
           },
        ]
      );
    }
    if( typeof(iNdata['block_amount_null']) != 'undefined' ){
      //if last object
      params['full_filters'].push(
        [
          {
             'key'   : 'amount',
             'mark'  : '>',
             'val'   : 0
           },
        ]
      );
    }
    LOG.printObject("params['full_filters']",params['full_filters']);
    if(params['full_filters'].length < 1) delete params['full_filters'];

    if( typeof(iNdata['all']) != 'undefined' ){
      //if last object
      params['all'] = 1;
    }


    if( typeof(iNdata['pre']) == 'string' ) {
      //if isset cids
      params['pre'] = iNdata['pre'];
    }

    if( typeof(iNdata['post']) == 'string' ) {
      //if isset cids
      params['post'] = iNdata['post'];
    }

    if( typeof(iNdata['cids']) == 'object' && Array.isArray(iNdata['cids']) == true ){
      //if isset cids
      filters['cids'] = iNdata['cids'];
    }
    if( typeof(iNdata['ids']) == 'object' && Array.isArray(iNdata['ids']) == true ){
      //if isset cids
      var idsBlock = iNdata['ids'];
    }
    if( typeof(iNdata['utype']) == 'object' && Array.isArray(iNdata['utype']) == true ){
      //if isset cids
      filters['utype'] = iNdata['utype'];
    }
    if ( typeof(iNdata['search']) != 'undefined') {
      searchStr = iNdata['search'];
    }
    if( typeof(iNdata['cats']) == 'object' && Array.isArray(iNdata['cats']) == true ){
      //if isset cids
      var category = iNdata['cats'];
      filters['category'] = category;
    }
    params['filters'] = filters;

    ALGOLIA.search(searchStr,table,iNfunction,params);
  }
  module.exports.GOODS_search = GOODS_search;

  function GOODS_clear(iNdata){
    /*
      @disrc
        del from answer (hits) val (objectID) && (_highlightResult)
      @inputs
        1 iNdata - array OR object
    */
    return ALGOLIA.clearData(iNdata);
  }
  module.exports.GOODS_clear = GOODS_clear;

  function GOODS_del(iNuid,iNid,iNfunction){
    /*
      @discr
        del single goods
      @inputs
        @required
          1 - iNuid -> string
          2 - iNid -> string
        @optional
          3 - iNfunction -> function
      @output
        DINAMO.del
    */
    if (
      typeof(iNid) != 'string' ||
      typeof(iNuid) != 'string'
    ) return false;
    var table = 'connect-market', objForDinamo = {};
        objForDinamo['key']   = {'uid':iNuid,'id':iNid};
        objForDinamo['table'] = table;
    DINAMO.del(objForDinamo,iNfunction);
  }
  module.exports.GOODS_del = GOODS_del;

  function MENU_del(iNuid,iNid,iNfunction){
    /*
      @discr
        del single menu
      @inputs
        @required
          1 - iNuid -> string
          2 - iNid -> string
        @optional
          3 - iNfunction -> function
      @output
        DINAMO.del
    */
    if (
      typeof(iNid) != 'string' ||
      typeof(iNuid) != 'string'
    ) return false;
    var table = 'connect-category', objForDinamo = {};
        objForDinamo['key']   = {'uid':iNuid,'id':iNid};
        objForDinamo['table'] = table;
    DINAMO.del(objForDinamo,iNfunction);
  }
  module.exports.MENU_del = MENU_del;
  function Connect_addOrUpdateGoods (iNdataBlock,iNuid,iNcallback,iNqu) {
    /*
      @discr
        add single menu
      @inputs
        @required
          1 - iNdata (object)
            @required
              name
              uid
            @optional
              cost -> number
              data -> object
                  discription -> string
                    Клевый товар. Просто бомба
                  mini-discription -> string
              filters   -> object
                  filterKey : value
              images   - -> object
                main
                discription
              cids   - [array] client_ids
              categories    - [array] client_ids
              status  - [number] (default - 0)
              utype -> array
          2 - iNuid (string)
        @optional
          3 - iNcallback
          4 - iNqu
      @output
        checkIssetCids();
        DINAMO.clearObjectByTypeOf
    */

    if(typeof(iNqu) != 'number') iNqu = 0;
    if(
      typeof(iNdataBlock)             != 'object'   ||
      typeof(iNuid)                   != 'string'   ||
      ( typeof(iNdataBlock[iNqu].name)  != 'string' && typeof(iNdataBlock[iNqu].id)  != 'string' )
    ) return false;
    var table = 'Connect Market';
    var data = {}, iNdata = iNdataBlock[iNqu];
      data.type = '0'; // 0 - menu 1 - group
      if ( typeof(iNdata.name) == "string" ) data.name = iNdata.name;
      data = Connect_rightCreateForGoods(iNdata,data);
    if ( typeof(iNdata['discription'])        == 'string' )     data['full'] = iNdata['discription'];
    if ( typeof(iNdata['mini-discription'])   == 'string' )     data['mini'] = iNdata['mini-discription'];

    if ( typeof(iNdata.utype)   == 'object' )     data.utype        = DINAMO.clearObjectByTypeOf(iNdata.utype,['string'],{'number':'string'});
    if ( typeof(iNdata.cids)    == 'object' )     data.cids         = DINAMO.clearObjectByTypeOf(iNdata.cids,['string'],{'number':'string'});
    if ( typeof(iNdata.category) == 'object')     data.category     = DINAMO.clearObjectByTypeOf(iNdata.category,['string'],{'number':'string'});
    if ( typeof(iNdata.filter) == 'object' )      data.filter       = iNdata.filter;
    if ( typeof(iNdata.id)      != 'string' )     data.objectID     = CONNECT.getRandomKeyByUuid(); else data.objectID = iNdata.id;
    if ( typeof(iNdata.cost)    == 'number' )     data.cost         = iNdata.cost;
    if ( typeof(iNdata.to)      == 'string' )     data.to           = iNdata.to;
    if ( typeof(iNdata.status)  != 'number' )     data.status       = 0;
    if ( typeof(iNdata.amount)  == 'number' )     data.amount       = 0;
    var typeAction;
    if( typeof(iNdata.update) == 'undefined' ) {
      //add to base operation
      typeAction = 'add';
      data.viewed = 0;
      data.rate   = 0;
      data.sold   = 0;
      data.uid    = iNuid;
      if( typeof(data.to)     != 'string'   )   data.to     = '*';
      if( typeof(data.status) != 'number'   )   data.status = 0;
      // set default time if user not sendus
      if( typeof(iNdata.time)   != 'number' )   data.time = CONNECT.getTime(); else data.time = iNdata.time;
    } else {
      //update operation
      delete iNdata['update'];
      typeAction = 'update';
      if(
        typeof(iNuid) != 'undefined' &&
        typeof(data.objectID)  != 'undefined'
      ) {
        // var updateBlock = {};
        // // remove excess elements from add date block
        // updateBlock['key']    = {"uid":iNuid,"id":data.id};
        // delete data.id;
        // updateBlock['table']  = table;
        // //convert json to update params for dinamo update
        // updateBlock = DINAMO.jsonObjectToUpdate( data , updateBlock );
      } else {
        iNcallback ("Not found keys for update.",false);
      }
    }
    iNdataBlock[iNqu] = data;
    // if status none of its type not equil number set status to default 0
    var last = 0;
    if( iNdataBlock.length > (1+iNqu) ) {
      iNqu++;
      Connect_addOrUpdateGoods (iNdataBlock,iNuid,iNcallback,iNqu);
    } else {
      last = 1;
    }
    if(typeAction == 'update' && last == 1) {
      ALGOLIA.updateObjects(iNdataBlock,table,iNcallback);
      LOG.printObject(iNuid + ' typeAction update');
      // DINAMO.update(updateBlock,userCallback);
    }
    else if (typeAction == 'add' && last == 1) {
      //DINAMO.add(table,data,userCallback);
      LOG.printObject(iNuid + ' typeAction add');
      ALGOLIA.addObjects(iNdataBlock,table,iNcallback);
    }
  }
  module.exports.addOrUpdateGoods = Connect_addOrUpdateGoods;



  function Connect_addOrUpdateMenu (iNdataBlock,iNuid,iNcallback,iNqu) {
    /*
      @discr
        add single menu
      @inputs
        @required
          1 - iNdata (object)
            @required
              name
              uid
            @optional
              parents - [object]
                ids
                cids
              links   - [array] links to menus
                ids
                cids
              status  - [number] (default - 0)
              cids    - [array] client_ids
          2 - iNuid (string)
        @optional
          3 - iNqu
      @output
        checkIssetCids();
        DINAMO.clearObjectByTypeOf
    */
    if(typeof(iNqu) != 'number') iNqu = 0;
    if(
      typeof(iNdataBlock)             != 'object'   ||
      typeof(iNuid)                   != 'string'   ||
      (typeof(iNdataBlock[iNqu].name) != 'string' && typeof(iNdataBlock[iNqu].id)  != 'string')
    ) return false;
    var data = {}, iNdata = iNdataBlock[iNqu], table = 'connect-category';
      data.uid  = iNuid;
      if( typeof(iNdata.name) == 'string') data.name = iNdata.name;

      data.type   = '0'; // 0 - menu 1 - group
    // if status none of its type not equil number set status to default 0
    if( typeof(iNdataBlock.update) != 'undefined') {
      data.update = 1;
      data.id     = iNdata.id;
    } else {
      if( typeof(iNdata.status) != 'number' )   iNdata.status = 0;
      if( typeof(iNdata.to)     != 'string' )   iNdata.to     = '*';
      if( typeof(iNdata.id)     != 'string' )   data.id       = CONNECT.getRandomKeyByUuid(); else data.id = iNdata.id;
      data.status = iNdata.status;
      data.to     = iNdata.to;
    }
    if( typeof(iNdata.utype) == 'object'  )   data.utype  = DINAMO.clearObjectByTypeOf(iNdata.utype,['string'],{'number':'string'});;

    // for create cids? links? parents?
    data = Connect_rightCreateForMenu(iNdata,data);
    Connect_l_starStepGetParentCid();
    ////// Step By Step Technology //////
    function Connect_l_starStepGetParentCid () {
      /*
        @inputs
          @required
        @OUTPUT
          iNdata
            cids
            uid
          data
        @discr (stepByStepCallbackFunction)
          1 - Connect_l_starStepGetParentCid
            do query to get params if need
          2 - Connect_l_firstStepGetParentCid
            get result from parent db or false date
          3 - Connect_l_thirdStepGetLinkCid
            get result from links cids or false date
            add to db data

      */
      var lcids = iNdata.cids, luid = iNuid, l_inData = iNdata, l_data = data,
      baseFilters = {
        'maskFilter':  "#status = :status and #type = :type",
        'keys'      :  {'#to':'to','#uid':'uid','#status':'status','#type':'type'},
        'vals'      :  {':to':'*',':uid':luid, ':status':0,':type':'0'},
      },
      params = {
        'table'     : table,
        'index'     : 'uid-to-index',
        'mask'      :  "#uid = :uid and #to = :to",
        'maskFilter':  baseFilters['maskFilter'],
        'keys'      :  baseFilters['keys'],
        'vals'      :  baseFilters['vals']
      };

      if( checkIssetCids(l_inData.parents) ) {
        // if issets parents by user client ids
        l_inData.parents.cids = DINAMO.clearObjectByTypeOf( l_inData.parents.cids, ['string'] , {'number':'string'} );
        params = DINAMO.addIn('cids',l_inData.parents.cids,params);
        DINAMO.query (params,Connect_l_firstStepGetParentCid);
      } else {
        Connect_l_firstStepGetParentCid(false,false);
      }
      function Connect_l_firstStepGetParentCid (err,data) {
        /*
          @output
            l_inData < iNdata
            l_data < data
            l_params < params
            l_baseFilters < baseFilters
        */
        var l_inData2 = l_inData, l_data2   = l_data, l_params = params, l_baseFilters = baseFilters;
        l_params['maskFilter']   = l_baseFilters['maskFilter'],
        l_params['keys']         = l_baseFilters['keys'],
        l_params['vals']         = l_baseFilters['vals'];

        if (err) {

        } else if (data) {
          //
          if ( data.Count > 0 ) {
            var resultIds = [];
            // data.Items.forEach(function(item) {
            //     resultIds.push(item.id);
            // });
            var item;
            for(var itemNumber in data.Items) {
              item = data.Items[itemNumber];
              resultIds.push(item.id);
            }
            if(resultIds.length > 0)
              l_data2 = Connect_rightCreateForMenu( {'parents':{'ids':resultIds}} ,l_data2 );
            else LOG.printObject(l_data2.name + ' resultIds.length - ' + resultIds.length);
          }else LOG.printObject('parents not found for' + l_data2.name);
        }
        if ( checkIssetCids(l_inData2.links) ) {
          l_inData2.links.cids = DINAMO.clearObjectByTypeOf( l_inData2.links.cids, ['string'] , {'number':'string'} );
          l_params = DINAMO.addIn('cids',l_inData2.links.cids,l_params);
          DINAMO.query ( l_params,Connect_l_thirdStepGetLinkCid );
        } else {
          Connect_l_thirdStepGetLinkCid (false,false);
        }
          //


        function Connect_l_thirdStepGetLinkCid (err,data) {
            /*
              @output
                l_inData2   < l_inData  < iNdata
                l_data2     < l_data    < data
            */
            var l_inData3 = l_inData2,  l_data3   = l_data2;
            if(err){
              //
            } else if (data) {

              if ( data.Count > 0 ) {
                var resultIds = [];
                // data.Items.forEach(function(item) {
                //     resultIds.push(item.id);
                // });
                var item;
                for(var itemNumber in data.Items){
                  item = data.Items[itemNumber];
                  resultIds.push(item.id);
                }

                if(resultIds.length > 0)
                  l_data3 = Connect_rightCreateForMenu( {'links':{'ids':resultIds}} ,l_data3 );
                else LOG.printObject(l_data3.name + ' resultIds.length - ' + resultIds.length);
              }else LOG.printObject('links not found for' + l_data3.name);
            }
            // if status none of its type not equil number set status to default 0
            if( iNdataBlock.length > (1+iNqu) ) {
              iNqu++;
              var userCallback = function(){ Connect_addOrUpdateMenu (iNdataBlock,iNuid,iNcallback,iNqu); };
            } else {
              var userCallback = iNcallback;
            }
            var typeAction;
            if( typeof(l_data3.update) != 'undefined' && l_data3.update == 1 ) {
                // if not add operation if update operation -> start update operation
                if (
                  typeof(l_data3.uid) != 'undefined' &&
                  typeof(l_data3.id)  != 'undefined'
                ) {
                  var updateBlock = {};
                  // remove excess elements from add date block
                  updateBlock['table']  = table;
                  updateBlock['key']    = { "uid":l_data3.uid, "id":l_data3.id };
                  delete l_data3.id; delete l_data3.uid; delete l_data3.update;
                  //convert json to update params for dinamo update
                  updateBlock = DINAMO.jsonObjectToUpdate(l_data3,updateBlock);
                } else {
                  iNcallback ("Not found keys for update.",false);
                }
                typeAction = 'update';
            } else {
                typeAction = 'add'
            }

            if(typeAction == 'update'){
              DINAMO.update(updateBlock,userCallback);
            }
            else {
              DINAMO.add(table,l_data3,userCallback);
            }

        }
      }
    }
  }
  module.exports.addOrUpdateMenu = Connect_addOrUpdateMenu;
    function checkIssetCids (iNobj) {
      /*
        @inputs
          @required
            1 - iNobj
      */
      if(
        typeof(iNobj) == 'object' &&
        typeof(iNobj.cids) == 'object'
      ) return true;
      return false;
    }


    function Connect_rightCreateForGoods (iNdata,iNresult) {
      /*
        @inputs
          1 - iNdata
          @optional
            cids
            images
          2 - iNresult [object]

        @return
          object {} add to iNresult
      */
      // add images to all and main parent block for write to db  if right isset
      if( typeof(iNdata.image) == 'object' ) {
         var images = DINAMO.clearObjectByTypeOf(iNdata.image,['string'],{'number':'string'});
         if (images) {
           var imagesForAdd = {};
           imagesForAdd['main'] = images[0];
           imagesForAdd['all']  = images.splice(1);
         }
         iNresult.image = imagesForAdd;
      }
      return iNresult;
    }


  function Connect_rightCreateForMenu (iNdata,iNresult) {
    /*
      @inputs
        1 - iNdata
        @optional
          cids
          links.ids
          parents.ids
          images
        2 - iNresult [object]

      @return
        object {} add to iNresult
    */
    if( typeof(iNdata.cids) == 'object' ) {
       var cids = DINAMO.clearObjectByTypeOf(iNdata.cids,['string'],{'number':'string'});
       if (cids) {
         if(
           typeof(iNresult.cids)      == 'object'
         ) {
           cids = cids.concat(iNresult.cids);
         }
         iNresult.cids = cids;
       }
    }
    if( typeof(iNdata.links) == 'object' && typeof(iNdata.links.ids) == 'object' ) {
       var links = DINAMO.clearObjectByTypeOf(iNdata.links.ids,['string'],{'number':'string'});
       if (links) {
         if(
           typeof(iNresult.links)      == 'object'
         ) {
           links = links.concat(iNresult.links);
         }
         iNresult.links = links;
       }
    }
    // add parents to all and main parent block for write to db  if right isset
    if( typeof(iNdata.parents) == 'object' && typeof(iNdata.parents.ids) == 'object' ) {
       var parents = DINAMO.clearObjectByTypeOf(iNdata.parents.ids,['string'],{'number':'string'});
       if (parents) {
         var parentForAdd = {};
         if(
           typeof( iNresult.parents)      == 'object' &&
           typeof( iNresult.parents.all)  == 'object'
         ) {
            parentForAdd['all']  = parents.concat(iNresult.parents.all);
         } else
            parentForAdd['all']  = parents;

         parentForAdd['main'] = parents[0];
         iNresult.parents = parentForAdd;
       }
    }
    // add images to all and main parent block for write to db  if right isset
    if( typeof(iNdata.images) == 'object' ) {
       var images = DINAMO.clearObjectByTypeOf(iNdata.images,['string'],{'number':'string'});
       if (images) {
         var imagesForAdd = {};
         imagesForAdd['main'] = images[0];
         imagesForAdd['all']  = images.splice(1);
       }
       iNresult.images = imagesForAdd;
    }
    return iNresult;
  }











  function getParentIdsByCids (err,result) {
    /*
      @for
        addMenu
      @inputs
        @required
        1 - Err
        2 - result
      @output
        data from Connect_addOrUpdateMenu();
      @use
        Connect_rightCreateForMenu()
        checkIssetCids()
        DINAMO.clearObjectByTypeOf
    */
    if (err) {
      LOG.printObject('err getParentIdsByCids');
      LOG.printObject(err);
    } else {
        LOG.printObject('result getParentIdsByCids');
        LOG.printObject(result);
        if ( result.Count > 0 ) {
          var resultIds = [];
          result.Items.forEach(function(item) {
              resultIds.push(item.id);
          });
          Connect_rightCreateForMenu({'parents':{'ids':resultIds}},data);
        }
        if ( checkIssetCids(iNdata.links) ) {
          // get parent links if isset
          var cidsForQuery = iNdata.links.cids;
          cidsForQuery = DINAMO.clearObjectByTypeOf( cidsForQuery, ['string'] , {'number':'string'} );
          Connect_getMenuByUid({'uid':data.uid,'cids':cidsForQuery},getLinksIdsByCids);
        } else {
          // add the date
          DINAMO.add('connect-category',data);
       }
    }
  }
  function getLinksIdsByCids (err2,result2) {
    /*
      @for
        addMenu
      @inputs
        @required
        1 - Err
        2 - result
      @output
        data from Connect_addOrUpdateMenu();
      @use
        Connect_rightCreateForMenu()
        DINAMO.clearObjectByTypeOf
      @return
    */
    if (err2) {

    } else {
      if ( result2.Count > 0 ) {
        var result2Ids = [];
        result2.Items.forEach(function(item) {
            result2Ids.push(item.id);
        });
        Connect_rightCreateForMenu({'links':{'ids':result2Ids}},data);
      }
      DINAMO.add('connect-category',data);
    }
  }
//@@@>>> INPUT FUNTIONCS
