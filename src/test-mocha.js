// import {FreeformElementReference} from "./input/connect_freeform/_sub/Element/FreeformElementReference";

const FreeformElementReference = require('./input/connect_freeform/_sub/Element/FreeformElementReference').FreeformElementReference;


let freeeform =  global['freeform']  = {
  'fields' : {
      'inid1': { 'base': {}, 'objects': { 'inid1': {'id': 'inid1', 'position' : 'inid2'} } },
      'inid2': { 'base': {}, 'objects': { 'inid2': {'id': 'inid2', 'body': { 'gen': {lid: { 'lid1': 'inid1' }} }, 'position' : 2} } },
      'inid3': { 'base': {}, 'objects': { 'inid3': {'id': 'inid3', 'body': { 'gen': {lid: { 'lid2': 'inid4' }} }, 'position' : 3} } } ,
      'inid4': { 'base': {}, 'objects': { 'inid4': {'id': 'inid4', 'position' : 4} } } ,
  }
};
let path = 'inid2.inid3.$1(lid2).&1(lid1):position.$1(lid1)::save-position(#newVar).#newVar'; //.&1(lid1)
console.log('START path', path);

describe('FreeformElementReference#runAction', function() {
    // console.log('1', FreeformElementReference);
    let result = FreeformElementReference.getElementByPath ( freeeform, path);
    it(
        'should return an array',
        () => {
            console.log('2 result - ', result );
            console.log('3 global.freeform - ', global['freeform'] );
        }
    );
});