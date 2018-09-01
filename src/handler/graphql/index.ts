import {Handler} from "aws-lambda";
import {graphqlLambda} from "../../../node_modules/apollo-server-lambda/dist/lambdaApollo";
import {makeExecutableSchema} from "graphql-tools";
import { merge } from 'lodash';

// resolvers
import {GraphQlResolver} from "./dictionary/dictionary.graphql.resolver";
import {DictionaryTypeDef} from "./dictionary/dictionary.graphql.typedef";
import {GraphQlTypeDefGroupAuth} from "./auth/auth.graphql.typedefs";
import {GraphQlAuthGroupResolvers} from "./auth/auth.graphql.resolvers";


// Construct a schema, using GraphQL schema language
const baseTypeDef = `
    type Query {
        _empty: String
    }
`;


// @ts-ignore
const myGraphQLSchema = makeExecutableSchema({
    // add with all types in array
    typeDefs: [baseTypeDef, DictionaryTypeDef, ...GraphQlTypeDefGroupAuth],
    // add all resolver with lodash method merge
    resolvers: merge(GraphQlResolver, ...GraphQlAuthGroupResolvers),
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