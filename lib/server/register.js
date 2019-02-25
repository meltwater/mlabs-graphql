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

const createTypeDefs = (models, container) => () => compose(
  flatten,
  filter(isNotNil),
  map(resolveFromModel(container, 'TypeDefs')),
  keys
)(models)

const createResolvers = (models) => ({ container }) => compose(
  filter(isNotNil),
  mapObjIndexed((v, k) => resolveFromModel(container, 'Resolvers')(k))
)(models)

const createSchemas = (models, container) => () => compose(
  flatten,
  filter(isNotNil),
  map(resolveFromModel(container, 'Schema')),
  keys
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
    gqlTypeDefs,
    gqlResolvers,
    gqlSchemas,
    gqlContext,
    gqlOptions,
    log
  }) => createServer({
    ...options,
    ...gqlOptions,
    context: gqlContext,
    typeDefs: gqlTypeDefs,
    resolvers: gqlResolvers,
    schemas: gqlSchemas,
    log
  })

  const typeDefsLifetime = useScopedTypeDefs ? Lifetime.SCOPED : Lifetime.SINGLETON

  container.register({
    gqlContext: asValue({}),
    gqlOptions: asValue({}),
    gqlTypeDefs: asFunction(createTypeDefs(models, container), { lifetime: typeDefsLifetime }),
    gqlResolvers: asFunction(createResolvers(models)).inject(objOf('container')).scoped(),
    gqlSchemas: asFunction(createSchemas(models, container)),
    apolloServer: asFunction(createApolloServer).scoped(),
    apolloServerStart: asFunction(createApolloServerStart).scoped(),
    apolloServerStop: asFunction(createApolloServerStop).scoped(),
    installApolloServerSubscriptionHandlers: asFunction(createInstallSubscriptionHandlers).scoped()
  })
}
