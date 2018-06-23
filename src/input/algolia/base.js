//
const applicationID = "P3LQH10J7L";
const apiKey        = "0cdcd967b77a94a666c514650d6594e2";
const plaginName    = "algoliasearch";

const algoliasearch = require(plaginName);
const LOG           = require('ramman-z-log');


const client        = algoliasearch(applicationID, apiKey);


function addObjects (iNdata,iNtable,iNfunction) {
    var index = client.initIndex(iNtable);
    index.addObjects(iNdata, function(err, content) {
      if (err) {
        console.error('plugin algoliasearch, method add',err);
      }
      if(typeof(iNfunction) == 'function') iNfunction(err,content);
    });
}
module.exports.addObjects = addObjects;

function addObject (iNdata,iNtable,iNfunction) {
    var index = client.initIndex(iNtable);
    index.addObject(iNdata, function(err, content) {
      if (err) {
        console.error('plugin algoliasearch, method add',err);
      }
      if(typeof(iNfunction) == 'function') iNfunction(err,content);
    });
}
module.exports.addObject = addObject;

function updateObjects (iNdata,iNtable,iNfunction) {
    var index = client.initIndex(iNtable);
    index.partialUpdateObjects (iNdata, function(err, content) {
      if (err) {
        console.error('plugin algoliasearch, method add',err);
      }
      if(typeof(iNfunction) == 'function') iNfunction(err,content);
    });
}
module.exports.updateObjects = updateObjects;

function updateObject (iNdata,iNtable,iNfunction) {
    var index = client.initIndex(iNtable);
    index.partialUpdateObjects (iNdata, function(err, content) {
      if (err) {
        console.error('plugin algoliasearch, method add',err);
      }
      if(typeof(iNfunction) == 'function') iNfunction(err,content);
    });
}
module.exports.updateObject = updateObject;

function getById (iNtable,iNid,iNretrive,iNfunction) {
  /*
    @inputs
      @required
        iNtable -> string
        iNid -> string OR array
      @optional
        iNfields   -> string
        iNfunction -> function
  */
  if(typeof(iNretrive) != 'object' || Array.isArray(iNretrive) != true ) iNretrive = ['*'];

  var index = client.initIndex(iNtable);

  if(typeof(iNid) == 'object' && Array.isArray(iNid) == true ) {
    // multiple
    index.getObjects (iNid,iNretrive, function(err, content) {
      if (err) {
        console.error('plugin algolia, method getById',err);
      }
      if( typeof(iNfunction) == 'function' ) iNfunction(err,content);
    });
  }else {
    // one getObject
    index.getObject (iNid,iNretrive, function(err, content) {
      if (err) {
        console.error('plugin algolia, method getById',err);
      }
      if( typeof(iNfunction) == 'function' ) iNfunction(err,content);
    });
  }
}
module.exports.getById = getById;

function search (iNstring,iNtable,iNfunction,iNdata) {
    /*
      @inputs
        @required
          iNstring -> string or array (if multisearch)
          iNtable -> string
        @optional
          iNfunction -> function
          inData -> object
            filters -> object
              { key : (string) or (array) }
            page    -> number
            limit   -> number
            fields  -> array


    */
    var data = {};
    if ( typeof(iNdata) == 'undefined' ) iNdata = {};

    if ( typeof(iNdata['offset'])  != 'undefined'  ) data['offset']  = iNdata['offset'];
    if ( typeof(iNdata['pre'])     == 'string'     ) data['highlightPreTag']  = iNdata['pre'];
    if ( typeof(iNdata['last'])    == 'string'     ) data['cursor']  = iNdata['last'];
    if ( typeof(iNdata['post'])    == 'string'     ) data['highlightPostTag'] = iNdata['post'];
    if ( typeof(data['highlightPostTag']) != 'undefined' && typeof(data['highlightPreTag']) != 'undefined')
      data['restrictHighlightAndSnippetArrays']=false;

    if ( typeof(iNdata['page'])     == 'number'     ) {
      data['page'] = iNdata['page']-1;
      if(data['page']<0)data['page']=0;
    }
    if ( typeof(iNdata['limit'])    == 'number'     ) data['hitsPerPage'] = iNdata['limit'];
    if ( typeof(iNdata['fields'])   != 'undefined'  ) {
      var fields;
      if( typeof(iNdata['fields']) != 'object' || Array.isArray(iNdata['fields']) == false)
        fields = [iNdata['fields']];
      else
        fields = iNdata['fields'];
      data['attributesToRetrieve'] = fields;
    }

    var filtersAnd  = [], filterOr;

    if ( typeof(iNdata['full_filters'])  == 'object'     ) {
      /*
        @inputs
          @expamle
          'full_filters' : [
            [
              {
                'key'   : 'cost',
                'mark'  : '>',
                'val'   : 10
              },
              {
                'key'   : 'cost',
                'mark'  : '<',
                'val'   : 777
              },
            ]
          ]
          };
        @result
          filtersAnd
            [(cost>10 OR cost<777)]
      */
      var filters     = iNdata['full_filters'];
      for(var iKey in filters) {
        if ( typeof(filters[iKey]) == 'object' && Array.isArray(filters[iKey]) == true ) {
            var thisFullFilter = filters[iKey];
            filterOr = [];
            var mark = ':', thisData = thisFullFilter;

            for(var iKey in thisData) {
              if(
                typeof(thisData[iKey]) != 'object'
              ) continue;
              if(typeof(thisData[iKey]['mark']) == 'string')  mark = thisData[iKey]['mark'];
              filterOr.push(thisData[iKey]['key'] + mark + thisData[iKey]['val']);
            }
            filtersAnd.push( "(" + filterOr.join(' OR ') + ")" );
        }
      }
    }

    if ( typeof(iNdata['filters'])  == 'object'     ) {
        var filters     = iNdata['filters'];

        for(var iKey in filters) {
          filterOr = [];
          if ( typeof(filters[iKey]) != 'object' && Array.isArray(filters[iKey]) != false ) {
            filters[iKey] = [filters[iKey]];
          }
          for(var iVal in filters[iKey]) {
            filterOr.push(iKey+":"+filters[iKey][iVal]);
          }
          filtersAnd.push( "(" + filterOr.join(' OR ') + ")" );
        }

        // data['facets']        = '*';
    }

    if(filtersAnd.length > 0)
      data['filters']  = filtersAnd.join(' AND ');
    LOG.printObject("data['filters']",data['filters']);

    var callbackFunction = function(err, content) {
      if (err) {
        console.error('plugin algoliasearch, method add',err);
      }
      LOG.printObject('content',content);
      if(typeof(iNfunction) == 'function') iNfunction(err,content);
    };
    if(typeof(iNstring) == 'object' && Array.isArray(iNstring) == true) {
      // multiSearch
      var multiSearch = [];
      for(var iKey in iNstring){
        multiSearch.push(
          {
            'indexName' : iNtable,
            'query'     : iNstring[iKey],
            'params'    : data
          }
        );
      }
      client.search(multiSearch, callbackFunction);
    } else {
      var index = client.initIndex(iNtable);
      if ( typeof(iNdata['all']) != 'undefined' ) {
        var browser = index.browseAll();
        var hits = [];
        browser.on('result', function onResult(content) {
          hits = hits.concat(content.hits);
        });
        browser.on('end', function onEnd() {
          LOG.printObject('Finished!');
          LOG.printObject('We got %d hits', hits.length);
          callbackFunction(false,{'hits':hits});
        });
        browser.on('error', function onError(err) {
          throw err;
          LOG.printObject('error',err);
          callbackFunction(err,{});
        });
      } else if ( typeof(iNdata['limit']) == 'number' && (iNdata['limit'] * iNdata['page']) >= 1000) {
        index.browse(iNstring,data, callbackFunction);
      } else {
        index.search(iNstring, data, callbackFunction);
      }
    }

}
module.exports.search = search;




function clearData (iNhits) {
  /*
    @disrc
       from answer (hits) val (rename objectID -> id) && del (_highlightResult)
    @inputs
      1 iNhits - array OR object
  */
  if(typeof(iNhits) == 'object') {
    if(Array.isArray(iNhits) != true) iNhits = [iNhits];

    for( var iKey in iNhits ) {
      if(typeof(iNhits[iKey]['objectID']) != 'undefined') {
        iNhits[iKey]['id'] = iNhits[iKey]['objectID'];
        delete iNhits[iKey]['objectID'];
      }
      if(typeof(iNhits[iKey]['_highlightResult']) != 'undefined') delete iNhits[iKey]['_highlightResult'];
    }

    return iNhits;
  }
}
module.exports.clearData = clearData;
