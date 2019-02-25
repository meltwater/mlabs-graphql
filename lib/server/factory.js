import createLogger from '@meltwater/mlabs-logger'
import { ApolloServer } from 'apollo-server-koa/dist/ApolloServer'
import { makeExecutableSchema, mergeSchemas } from 'graphql-tools'
import {
  any,
  isNotNil
} from '@meltwater/phi'

const createServer = ({
  context = {},
  typeDefs,
  resolvers,
  schema,
  schemas,
  mergeInfo,
  transformSchema,
  onTypeConflict,
  log = createLogger(),
  graphqlRoot = '/graphql',
  subscriptionsRoot = '/subscriptions',
  ...options
}) => {
  const apolloServerOptions = {
    debug: false,
    introspection: true,
    subscriptions: { path: subscriptionsRoot },
    ...options
  }

  const formatError = createFormatError(log)

  const mergedSchema = createSchema({
    schema,
    schemas,
    typeDefs,
    resolvers,
    mergeInfo,
    transformSchema,
    onTypeConflict
  })

  const apolloServer = new ApolloServer({
    formatError,
    context,
    schema: mergedSchema,
    ...apolloServerOptions
  })

  apolloServer.setGraphQLPath(graphqlRoot)
  return apolloServer
}

export const createInstallSubscriptionHandlers = ({ server, apolloServer }) => () => {
  apolloServer.installSubscriptionHandlers(server)
}

const createFormatError = log => err => {
  if (log) log.error({ err }, 'GraphQL: Schema Error')
  return err
}

const createSchema = ({ schema, schemas, typeDefs, resolvers, ...options }) => {
  const hasOtherOptions = any(isNotNil, [schemas, typeDefs, resolvers])
  if (isNotNil(schema) && hasOtherOptions) {
    throw new Error('Cannot use schema option with schemas, typeDefs, or resolvers')
  }

  if (isNotNil(schema)) return schema

  return mergeSchemas({
    schemas: [ makeExecutableSchema({ typeDefs }), ...schemas ],
    resolvers,
    ...options
  })
}

export default createServer
