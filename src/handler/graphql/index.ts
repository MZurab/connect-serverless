import {Handler} from "aws-lambda";

const { ApolloServer, gql } = require('apollo-server-lambda');

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
    type Query {
        hello: String
        hello2: String
    }

    type Test {
        val: String
    }
`;

// Provide resolver functions for your schema fields
const resolvers = {
    Query: {
        hello: ()   => 'Hello world - 1!',
        hello2: ()  => 'Hello world - 2!',
        test: () => { return {"val":"privet"}}
    }
};

const server = new ApolloServer({
    typeDefs,
    resolvers,
});

const handler: Handler  = server.createHandler(
    {
        cors: {
            origin: true,
            credentials: true,
        },
    }
);

export {handler};