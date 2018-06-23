exports.handler = (event, context, callback) => {
  // TODO implement
  var CONNECT = require('./input/connect');
  var DINAMO = require("./input/aws/dinamo");
  var ACCESS = require("./input/connect_access/access");
  var MARKET = require("./input/connect_market/market");
  const LOG         = require('ramman-z-log');








if(
  event['context']['http-method']=='GET' &&
  event['context']['resource-path'] == '/api/service/market/{service_id}/search' &&
  typeof(event['params']['path']['service_id']) == 'string'
) {
  LOG.printObject("search");
  var GET   = event['params']["querystring"],
      DATA  = GET,
      TYPE  = "GET",
      UID   = event['params']["path"]["service_id"];

      DATA['uid']     = UID;
      DATA['type']    = 'goods';
      DATA['action']  = 'search';
      if(typeof(DATA['autocomplite']) != 'undefined'){
        DATA['fields']  = ['name'];
      }
      if( typeof(DATA['query']) == 'string')  DATA['search'] = DATA['query'];
}else if( typeof(event['body-json']) != 'undefined'){
  LOG.printObject("json");
    var DATA = event['body-json'];
    var ij = DATA;
}else {
    callback(null,{'status':0,'ru':'Нет входных данных.'});
    return 0;
}









// callback(null,event);
if ( typeof(DATA.type) != 'undefined' && typeof(DATA.action) != 'undefined') {
              // LOG.printObject('start');
              /*
                  *** MENU ***
                      *** ADD ***
                          @discr
                            add menu for market
                          @access-condition
                            @required
                              context -> [] <- api aws gateway
                                @required
                                  source-ip
                              ij -> {} <- body-json
                                @required
                                  type    == menu
                                  action  == add
                          @required
                            ij -> {} <- body-json
                              @required
                                to    -> String
                                pswd  -> String
                                key   -> String
                                data -> []
                                  @required
                                    name
                                  @optional
                                    links   -> [ids,cids]
                                    parents -> [ids,cids]
                                    utype   -> [String...]
                                    cids    -> [String...]
                                    id      -> String
                        !!! ADD !!!
                  !!! MENU !!!

                  *** GOODS ***
                        *** DELETE  ***
                            @discr
                              add single goods from market
                            @access-condition
                              @required
                                context --> [] <- api aws gateway
                                  @required
                                    source-ip
                                ij -> {} <- body-json
                                  @required
                                    type    == goods
                                    action  == del
                            @inputs
                              @required
                                ij -> {} <- body-json
                                  @required
                                    id    -> String
                        !!! DELETE !!!

                        *** ADD or UPDATE ***
                              @discr
                                add goods or update for market
                              @access-condition
                                @required
                                  context --> [] <- api aws gateway
                                    @required
                                      source-ip
                                  ij -> {} <- body-json
                                    @required
                                      type    == menu
                                      action  == add
                              @required
                                ij -> {} <- body-json
                                  @required
                                    to    -> String
                                    pswd  -> String
                                    key   -> String
                                    data -> []
                                      @required
                                        name
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
                          !!! ADD or UPDATE !!!
                  !!! GOODS !!!

              */
              DATA.verification = 'api';//DELETE
              if(DATA.verification == 'api') {
                if(
                    typeof(DATA.uid)   != 'undefined'                      &&
                    typeof(DATA.key)  != 'undefined'                      &&
                    typeof(DATA.pswd) != 'undefined'                      &&
                    // typeof(DATA.data) == 'object'                         &&
                    typeof(event.context) != 'undefined'                &&
                    typeof(event.context['source-ip']) != 'undefined'
                  ) {
                    // LOG.printObject('verification == api - ');
                    var inData    = {};
                      inData.key  = DATA.key;
                      inData.pswd = DATA.pswd;
                      inData.ip   = event.context['source-ip'];
                      inData.uid  = DATA.uid;
                      ACCESS.getAccessDataForApi(inData,controleHub);
                    }
              }
                LOG.printObject("action type",DATA.action,DATA.type);
                function controleHub (d) {
                  // LOG.printObject('controleHub - ',d);
                  if (DATA.type == 'menu' && (DATA.action == 'add' || DATA.action == 'update'))
                      LOCAL_MENU_addOrUpdate();
                  else if (DATA.type == 'menu' &&  DATA.action == 'del')
                      LOCAL_MENU_del(DATA.data);
                  else if (DATA.type == 'goods' && (DATA.action == 'add' || DATA.action == 'update'))
                      LOCAL_GOODS_addOrUpdate();
                  else if (DATA.type == 'goods' &&  DATA.action == 'del')
                      LOCAL_GOODS_del(DATA);
                  else if (DATA.type == 'goods' &&  DATA.action == 'search')
                      LOCAL_GOODS_search(DATA);
                  else if (DATA.type == 'goods' &&  DATA.action == 'get')
                      LOCAL_GOODS_get(DATA);
                }
                // *** LOCAL ***
                        // *** MENU FUNCTIONS ***
                                function LOCAL_MENU_del(d) {
                                  if ( typeof(d.id) == 'undefined' ) d.id = null;
                                  var permision = ACCESS.getActionPermission("delete","market","menus");
                                  if(permision == 'full') {
                                    MARKET.MENU_del(inData.uid,d.id,function(err,res){
                                      if(err){
                                        callback(null,{'status':0,'err':err});
                                      }else if (res) {
                                        callback(null,{'status':1});
                                      }
                                    });
                                  }
                                }
                                function LOCAL_MENU_addOrUpdate(d) {
                                  LOG.printObject("LOCAL_MENU_addOrUpdate");
                                  var permision;
                                  if(ij.action == 'add') {
                                    // add operation
                                    permision = ACCESS.getActionPermission("write","market","menus");
                                    delete ij.data.update; // guard from update gate
                                  }
                                  else{
                                    // update operation
                                    ij['data']['update'] =1;
                                    permision = ACCESS.getActionPermission("update","market","menus");
                                  }
                                  // var checkRole123          = ACCESS.checkAccessByRole(123,"market");
                                  if(permision == 'full') {
                                    if( typeof(ij.data) == 'object' && ij.data.length > 0 ) {
                                      var dataBlock = ij.data;
                                      MARKET.addOrUpdateMenu(dataBlock,inData.uid,function(err,res){
                                        if(err){
                                          callback(null,{'status':0,'err':err});
                                        }else if (res) {
                                          callback(null,{'status':1});
                                        }
                                      });
                                    }
                                  }
                                }
                        // !!! MENU FUNCTIONS !!!
                        // ***

                              function LOCAL_GOODS_search(data) {
                                LOG.printObject("LOCAL_GOODS_search");
                                var permision = ACCESS.getActionPermission("read","market","search");
                                if (permision == 'full') {
                                  var result = {};
                                  MARKET.GOODS_search(data,inData.uid,function(err,res){
                                    if(err){
                                      callback(null,{'status':0,'err':err});
                                    } else if (res) {
                                      if(typeof(res) == 'object') {
                                        if(typeof(data['autocomplite']) != 'undefined'){
                                          var fieldsArray = data['fields'];
                                          result = {'suggestions':[],'query':data['search']};
                                          for (var iKey in res['hits']){
                                            var objectForAdd = {'data':res['hits'][iKey]['objectID'],'value':res['hits'][iKey]['name']}
                                            result['suggestions'].push(objectForAdd);
                                          }
                                        } else if( typeof(data['search']) == 'object' ) {
                                          // var result = []; res = res['results'];
                                          // for (var iKeyForResult in res){
                                          //     for( var iKey in res[iKeyForResult]['hits'] ) {
                                          //       var thisElement = res[iKeyForResult]['hits'][iKey];
                                          //       if(typeof(thisElement['objectID']) != 'undefined') {
                                          //         thisElement['id'] = thisElement['objectID'];
                                          //         delete thisElement['objectID'];
                                          //       }
                                          //       delete thisElement['_highlightResult'];
                                          //       result.push(thisElement);
                                          //     }
                                          // }
                                        } else {
                                          result['data']  = MARKET.GOODS_clear(res['hits']);
                                          if( typeof(res['nbHits']) != 'undefined' ) {
                                            result['pages'] = Math.ceil(res['nbHits']/res['hitsPerPage']);
                                            result['page']  = res['page']+1;
                                          }
                                          if( typeof(res['cursor']) != 'undefined')
                                            result['last']  = res['cursor'];

                                        }

                                      }
                                     callback(null,result);
                                    }
                                  });
                                }
                              }
                              function LOCAL_GOODS_get(data) {
                                var permision = ACCESS.getActionPermission("read","market","goods");
                                if (permision == 'full') {
                                  MARKET.GOODS_get(data,function(err,res){
                                    if(err){
                                      callback(null,{'status':0,'err':err});
                                    }else if (res) {
                                      callback(null,{'status':1,'data':MARKET.GOODS_clear (res) });
                                    }
                                  });
                                }
                              }
                              function LOCAL_GOODS_del(d) {
                                if ( typeof(d.id) == 'undefined' ) d.id = null;
                                var permision = ACCESS.getActionPermission("delete","market","goods");
                                if (permision == 'full') {
                                  MARKET.GOODS_del(inData.uid,d.id,function(err,res){
                                    if(err){
                                      callback(null,{'status':0,'err':err});
                                    }else if (res) {
                                      callback(null,{'status':1});
                                    }
                                  });
                                }
                              }
                              function LOCAL_GOODS_addOrUpdate(d){
                                var permision;
                                if(DATA.action == 'add') {
                                  // add operation
                                  permision = ACCESS.getActionPermission("write","market","goods");
                                  delete DATA.update; // guard from update gate
                                  // LOG.printObject('LOCAL_GOODS_addOrUpdate add');
                                } else{
                                  // update operation
                                  DATA['update'] =1;
                                  permision = ACCESS.getActionPermission("update","market","goods");
                                  // LOG.printObject('LOCAL_GOODS_addOrUpdate update');
                                }
                                // LOG.printObject('ij.data');
                                // LOG.printObject( JSON.stringify(ij) );
                                // var checkRole123          = ACCESS.checkAccessByRole(123,"market");
                                if(permision == 'full') {
                                  // var data = {};
                                  if( typeof(ij.data) == 'object' && ij.data.length > 0 ) {
                                    var dataBlock = ij.data;
                                    MARKET.addOrUpdateGoods(dataBlock,inData.uid,function(err,res){
                                      if (err) {
                                        callback(null,{'status':0,'err':err});
                                      } else if (res) {
                                        callback(null,{'status':1});
                                      }
                                    });
                                  }
                                }
                              }
                        // !!!
                // !!! LOCAL !!!

    } //if ( typeof(ij.type) != 'undefined' && typeof(ij.action) != 'undefined') {

};
