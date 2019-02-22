import createLogger from '@meltwater/mlabs-logger'
import { ApolloServer } from 'apollo-server-koa/dist/ApolloServer'
import { makeExecutableSchema, mergeSchemas } from 'graphql-tools'

const createServer = ({
  context = {},
  typeDefs,
  resolvers,
  schema,
  schemas = [],
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

  if (schema) schemas.push(schema)
  if (typeDefs) schemas.push(makeExecutableSchema({ typeDefs }))
  const mergedSchema = mergeSchemas({ schemas, resolvers })

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

export default createServer
