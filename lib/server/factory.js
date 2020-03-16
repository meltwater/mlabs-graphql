import createLogger from '@meltwater/mlabs-logger'
import { ApolloServer } from 'apollo-server-koa/dist/ApolloServer'
import { makeExecutableSchema, mergeSchemas } from 'graphql-tools'
import {
  all,
  any,
  compose,
  defaultTo,
  identity,
  ifElse,
  isArray,
  isEmptyArray,
  isFunction,
  isNotNil,
  isNotString,
  isString,
  join,
  map,
  mergeAll,
  unnest
} from '@meltwater/phi'

const createServer = ({
  context = ({ ctx }) => ctx,
  typeDefs,
  resolvers,
  remoteResolvers,
  schema,
  schemas,
  schemaDirectives,
  mergeInfo,
  transformSchema,
  onTypeConflict,
  log = createLogger(),
  graphqlRoot = '/graphql',
  subscriptionsRoot = '/subscriptions',
  ...options
}) => {
  const apolloServerOptions = {
    debug: true,
    introspection: true,
    subscriptions: { path: subscriptionsRoot },
    ...options
  }

  const formatError = createFormatError(log)

  const mergedSchema = createSchema({
    schema,
    schemas,
    schemaDirectives,
    typeDefs,
    resolvers,
    remoteResolvers,
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

export const createInstallSubscriptionHandlers = ({
  server,
  apolloServer
}) => () => {
  apolloServer.installSubscriptionHandlers(server)
}

const createFormatError = log => err => {
  if (log) log.error({ err }, 'GraphQL: Schema Error')
  return err
}

export const createSchema = ({
  schema,
  schemas,
  typeDefs,
  resolvers,
  remoteResolvers,
  schemaDirectives,
  ...options
}) => {
  schemaDirectives = isArray(schemaDirectives)
    ? mergeAll(schemaDirectives)
    : schemaDirectives

  const hasOtherOptions = any(isNotNil, [
    schemas,
    typeDefs,
    resolvers,
    remoteResolvers
  ])
  if (isNotNil(schema) && hasOtherOptions) {
    throw new Error(
      'Cannot use schema option with schemas, typeDefs, resolvers, or remoteResolvers'
    )
  }

  if (isNotNil(schema)) return schema

  const normalizedTypeDefs = normalizeTypeDefs(typeDefs)

  if (all(isString, normalizedTypeDefs)) {
    const typeDefsString = join('\n', normalizedTypeDefs)
    return mergeSchemas({
      schemas: isEmptyArray(normalizedTypeDefs)
        ? schemas
        : [...schemas, typeDefsString],
      schemaDirectives,
      resolvers
    })
  }

  if (all(isNotString, normalizedTypeDefs)) {
    const localSchema = makeExecutableSchema({
      ...options,
      typeDefs,
      resolvers,
      schemaDirectives
    })

    return mergeSchemas({
      schemas: [...schemas, localSchema],
      resolvers: remoteResolvers
    })
  }

  throw new Error('All typeDefs must either be strings or ASTs')
}

const normalizeTypeDefs = compose(
  unnest,
  map(ifElse(isFunction, f => f(), identity)),
  defaultTo([])
)

export default createServer
