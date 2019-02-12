import { asFunction, asValue } from 'awilix'
import {
  compose,
  entries,
  filter,
  flatten,
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
  container.register(`${name}${type}`, asFunction(fn).scoped())
}

const resolveFromModel = (container, type) => name => (
  container.resolve(`${name}${type}`, { allowUnregistered: true })
)

const registerModel = (container, name, model) => {
  const { typeDefs, resolvers, query, mutation } = model
  const register = (k, v) => registerFunction(container, name, k, v)

  if (typeDefs) register('TypeDefs', typeDefs)
  if (query) register('Query', query)
  if (mutation) register('Mutation', mutation)
  if (resolvers) register('Resolvers', resolvers)
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

const createApolloServerStart = ({ apolloServer }) => () => apolloServer.willStart()
const createApolloServerStop = ({ apolloServer }) => () => apolloServer.stop()

export default (container, models = [], options = {}) => {
  registerModels(container, models)

  const createApolloServer = ({
    gqlTypeDefs,
    gqlResolvers,
    gqlContext,
    gqlOptions,
    log
  }) => createServer({
    ...options,
    ...gqlOptions,
    context: gqlContext,
    typeDefs: gqlTypeDefs,
    resolvers: gqlResolvers,
    log
  })

  container.register({
    gqlContext: asValue({}),
    gqlOptions: asValue({}),
    gqlTypeDefs: asFunction(createTypeDefs(models, container)).singleton(),
    gqlResolvers: asFunction(createResolvers(models)).inject(objOf('container')).scoped(),
    apolloServer: asFunction(createApolloServer).scoped(),
    apolloServerStart: asFunction(createApolloServerStart).scoped(),
    apolloServerStop: asFunction(createApolloServerStop).scoped(),
    installApolloServerSubscriptionHandlers: asFunction(createInstallSubscriptionHandlers).scoped()
  })
}
