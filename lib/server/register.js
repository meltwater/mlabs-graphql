import { asFunction, asValue, Lifetime } from 'awilix'
import {
  compose,
  entries,
  filter,
  flatten,
  isFunction,
  isNotNil,
  keys,
  map,
  mapObjIndexed,
  objOf
} from '@meltwater/phi'

import createServer, {
  createSchema,
  createInstallSubscriptionHandlers
} from './factory'

const registerFunction = (container, name, type, fn) => {
  const dependency = isFunction(fn) ? asFunction(fn).scoped() : asValue(fn)
  container.register(`${name}${type}`, dependency)
}

const resolveFromModel = (container, type) => name => (
  container.resolve(`${name}${type}`, { allowUnregistered: true })
)

const registerModel = (container, name, model) => {
  const { typeDefs, resolvers, schema, query, mutation } = model
  const register = (k, v) => registerFunction(container, name, k, v)

  if (typeDefs) register('TypeDefs', typeDefs)
  if (query) register('Query', query)
  if (mutation) register('Mutation', mutation)
  if (resolvers) register('Resolvers', resolvers)
  if (schema) register('Schema', schema)
}

const registerModels = (container, models) => {
  for (const [ k, v ] of entries(models)) registerModel(container, k, v)
}

const createFromModel = name => (models, container) => () => compose(
  flatten,
  filter(isNotNil),
  map(resolveFromModel(container, name)),
  keys
)(models)

const createTypeDefs = createFromModel('TypeDefs')
const createSchemas = createFromModel('Schema')

const createResolvers = (models) => ({ container }) => compose(
  filter(isNotNil),
  mapObjIndexed((v, k) => resolveFromModel(container, 'Resolvers')(k))
)(models)

const createApolloServerStart = ({ apolloServer }) => () => apolloServer.willStart()
const createApolloServerStop = ({ apolloServer }) => () => apolloServer.stop()

export default (
  container,
  models = [],
  { useScopedTypeDefs = false, ...options } = {}
) => {
  registerModels(container, models)

  const createApolloServer = ({
    gqlSchema,
    gqlContext,
    gqlOptions,
    log
  }) => createServer({
    ...options,
    ...gqlOptions,
    context: gqlContext,
    schema: gqlSchema,
    log
  })

  const typeDefsLifetime = useScopedTypeDefs ? Lifetime.SCOPED : Lifetime.SINGLETON

  const createGqlSchema = ({
    gqlSchemas,
    gqlTypeDefs,
    gqlResolvers,
    gqlOptions
  }) => createSchema({
    ...options,
    ...gqlOptions,
    schemas: gqlSchemas,
    typeDefs: gqlTypeDefs,
    resolvers: gqlResolvers
  })

  container.register({
    gqlContext: asValue({}),
    gqlOptions: asValue({}),
    gqlTypeDefs: asFunction(createTypeDefs(models, container), { lifetime: typeDefsLifetime }),
    gqlResolvers: asFunction(createResolvers(models)).inject(objOf('container')).scoped(),
    gqlSchemas: asFunction(createSchemas(models, container)).scoped(),
    gqlSchema: asFunction(createGqlSchema).scoped(),
    apolloServer: asFunction(createApolloServer).scoped(),
    apolloServerStart: asFunction(createApolloServerStart).scoped(),
    apolloServerStop: asFunction(createApolloServerStop).scoped(),
    installApolloServerSubscriptionHandlers: asFunction(createInstallSubscriptionHandlers).scoped()
  })
}
