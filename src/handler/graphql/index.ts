import {Handler} from "aws-lambda";
import {graphqlLambda} from "../../../node_modules/apollo-server-lambda/dist/lambdaApollo";
import {makeExecutableSchema} from "graphql-tools";
import { merge } from 'lodash';
import {GraphQlResolver} from "./dictionary/dictionary.graphql.resolver";
import {DictionaryTypeDef} from "./dictionary/dictionary.graphql.typedef";


// Construct a schema, using GraphQL schema language
const typeDefs = `
    type Query {
        _empty: String
    }
    
    extend type Query {
        test: Test
    }

    type Test {
        val: String
    }
`;

// Provide resolver functions for your schema fields
const resolvers = {
    Query: {
        test: () => { return {"val":"it is test"}}
    }
};


// @ts-ignore
const myGraphQLSchema = makeExecutableSchema({
    // add with all types in array
    typeDefs: [typeDefs, DictionaryTypeDef],
    // add all resolver with lodash method merge
    resolvers: merge(GraphQlResolver, resolvers),
});

const handler: Handler  = function graphqlHandler (event, context, callback) {
    // create handler
    const handler = graphqlLambda({ schema: myGraphQLSchema });

    // return handler
    return handler(event, context, (error, output: any) => {
        // eslint-disable-next-line no-param-reassign
        // @ts-ignore
        output.headers['Access-Control-Allow-Origin'] = '*';
        callback(error, output);
    });
};

export {handler};