import {Handler} from "aws-lambda";
import {Mock} from "./dictionary/dictionary.mock";

const { ApolloServer, gql } = require('apollo-server-lambda');

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
    type Query {
        getDictionary: Dictionary
        getDictionaryHash: DictionaryHash
        test: Test
    }
    
    type Dictionary {
        status: Boolean!,
        dictionary: [DictionaryType]!,
        defaultLanguage: String,
        includedLanguages: [String]!,
        possibleLanguages: [String]!,
        hash: String!
    }
        type DictionaryType {
            key: String!
            value: DictionaryValueType!  
        }
            type DictionaryValueType {
                en: String
                ru: String
            }
    
    type DictionaryHash {
        status: Boolean!
        hash: String!
    }
    

    type Test {
        val: String
    }
`;

// Provide resolver functions for your schema fields
const resolvers = {
    Query: {
        getDictionary: ()   => Mock.Dictionary,
        getDictionaryHash: ()  => Mock.Hash,
        test: () => { return {"val":"it is test"}}
    }
};


const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ event, context }) => ({
        headers: event.headers,
        functionName: context.functionName,
        event,
        context,
    }),
});


const handler: Handler  = server.createHandler(
    // {
    //     cors: {
    //         origin: true,
    //         credentials: true,
    //     },
    // }
    {
        cors: {
            origin: '*',
            credentials: true,
        }
    }
);

export {handler};