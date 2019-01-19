import { ApolloServer } from 'apollo-server-koa/dist/ApolloServer'

const createServer = ({
  context = {},
  typeDefs,
  resolvers,
  schema,
  log,
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

  const data = schema ? { schema } : { typeDefs, resolvers }

  const apolloServer = new ApolloServer({
    formatError,
    context,
    ...data,
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
