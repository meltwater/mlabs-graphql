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
  mergeAll,
  objOf
} from '@meltwater/phi'

import createServer, {
  createSchema,
  createInstallSubscriptionHandlers
} from './factory'
import runGql from './run'

const registerFunction = (container, name, type, fn) => {
  const dependency = isFunction(fn) ? asFunction(fn).scoped() : asValue(fn)
  container.register(`${name}${type}`, dependency)
}

const resolveFromModel = (container, type) => name => (
  container.resolve(`${name}${type}`, { allowUnregistered: true })
)

const registerModel = (container, name, {
  typeDefs,
  resolvers,
  directive,
  directiveResolver,
  schema,
  query,
  mutation
} = {}) => {
  const register = (k, v) => registerFunction(container, name, k, v)

  if (typeDefs) register('TypeDefs', typeDefs)
  if (query) register('Query', query)
  if (mutation) register('Mutation', mutation)
  if (resolvers) register('Resolvers', resolvers)
  if (directive) register('Directive', directive)
  if (directiveResolver) register('DirectiveResolver', directiveResolver)
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
const createDirectives = createFromModel('Directive')
const createSchemas = createFromModel('Schema')

const createResolvers = (models) => ({ container }) => compose(
  filter(isNotNil),
  mapObjIndexed((v, k) => resolveFromModel(container, 'Resolvers')(k))
)(models)

const createContext = ({ container }) => ({ ctx }) => ({
  getDep: (...args) => container.resolve(...args),
  getDeps: (keys, ...args) => mergeAll(
    map(k => container.resolve(k, ...args), keys)
  ),
  ...ctx
})

const createApolloServerStart = ({ apolloServer }) => () => apolloServer.willStart()
const createApolloServerStop = ({ apolloServer }) => () => apolloServer.stop()

export default (
  container,
  models = [],
  {
    useScopedTypeDefs = false,
    useScopedServer = true,
    ...options
  } = {}
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
  const serverLifetime = useScopedServer ? Lifetime.SCOPED : Lifetime.SINGLETON

  container.register({
    gqlOptions: asValue({}),
    gqlContext: asFunction(createContext).inject(objOf('container')).scoped(),
    gqlTypeDefs: asFunction(createTypeDefs(models, container), { lifetime: typeDefsLifetime }),
    gqlResolvers: asFunction(createResolvers(models)).inject(objOf('container')).scoped(),
    gqlSchemaDirectives: asFunction(createDirectives(models, container)).scoped(),
    gqlSchemas: asFunction(createSchemas(models, container)).scoped(),
    gqlSchema: asFunction(createGqlSchema(options)).scoped(),
    gqlRun: asFunction(createGqlRun(options)).scoped(),
    apolloServer: asFunction(createApolloServer, { lifetime: serverLifetime }),
    apolloServerStart: asFunction(createApolloServerStart).scoped(),
    apolloServerStop: asFunction(createApolloServerStop).scoped(),
    installApolloServerSubscriptionHandlers: asFunction(createInstallSubscriptionHandlers).scoped()
  })
}

const createGqlRun = options => ({
  gqlContext,
  gqlSchema,
  gqlOptions,
  log
}) => (query, operationName, variables, context = {}) => {
  const { rootValue } = { ...options, ...gqlOptions }
  return runGql({
    schema: gqlSchema,
    context: { ...gqlContext, ...context },
    root: rootValue,
    variables,
    log,
    query,
    operationName
  })
}

const createGqlSchema = options => ({
  gqlSchemas,
  gqlSchemaDirectives,
  gqlTypeDefs,
  gqlResolvers,
  gqlOptions
}) => createSchema({
  ...options,
  ...gqlOptions,
  schemas: gqlSchemas,
  schemaDirectives: gqlSchemaDirectives,
  typeDefs: gqlTypeDefs,
  resolvers: gqlResolvers
})
