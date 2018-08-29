import {Mock} from "./dictionary.mock";
import {Dictionary} from "./dictionary.library";

export const GraphQlResolver = {
    Query: {
        getDictionary:  ()   => Dictionary.get('@system').toPromise(), //Mock.Dictionary,
        getDictionaryHash: ()  => Mock.Hash
    }
};