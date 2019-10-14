import { asValue } from 'awilix'
import Router from 'koa-router'
import koaBody from 'koa-bodyparser'
import { graphqlKoa } from 'apollo-server-koa/dist/koaApollo'
import { koa as voyagerKoa } from 'graphql-voyager/middleware'
import playgroundKoa from 'graphql-playground-middleware-koa'
import typeIs from 'type-is'
import {
  formatApolloErrors,
  processFileUploads
} from 'apollo-server-core'
import {
  assoc,
  complement,
  compose,
  dissocPath,
  either,
  ifElse,
  isNil,
  isNotNil,
  map,
  path,
  propEq,
  stubUndefined
} from '@meltwater/phi'

import createServer from './factory'

export default ({
  graphqlRoot = '/graphql',
  subscriptionsRoot = '/subscriptions',
  voyagerRoot = '/voyager',
  playgroundRoot = '/playground',
  typeDefs = null,
  resolvers = null,
  schema = null,
  middleware = [],
  ...options
} = {}) => {
  const router = new Router()

  const apolloOptions = {
    graphqlRoot,
    subscriptionsRoot,
    schema,
    typeDefs,
    resolvers,
    ...options
  }

  const sharedMiddleware = [
    handleErrors(),
    apolloServerFromContainer(apolloOptions),
    apolloServerFromState(apolloOptions),
    willStart(),
    ...middleware
  ]

  const getMiddleware = [...sharedMiddleware, graphql()]

  const postMiddleware = [
    ...sharedMiddleware,
    koaBody(),
    uploads(),
    graphql()
  ]

  router.get('graphql', graphqlRoot, ...getMiddleware)
  router.post('graphql', graphqlRoot, ...postMiddleware)

  if (voyagerRoot) {
    router.all('voyager', voyagerRoot, voyagerKoa({ endpointUrl: graphqlRoot }))
  }

  if (playgroundRoot) {
    router.all('playground', playgroundRoot, playgroundKoa({
      endpoint: graphqlRoot,
      subscriptionEndpoint: subscriptionsRoot,
      settings: {
        'schema.polling.interval': 10000,
        'request.credentials': 'same-origin'
      }
    }))
  }

  return router
}

const graphql = () => async (ctx, next) => graphqlKoa(
  () => ctx.state.apolloServer.createGraphQLServerOptions(ctx)
)(ctx, next)

const apolloServerFromContainer = (options) => (ctx, next) => {
  if (either(hasServer, complement(hasContainer))(ctx)) return next()

  const { state: { container } } = ctx

  // TODO: Remove when server is forced SINGLETON.
  container.register('gqlOptions', asValue(options))

  ctx.state.apolloServer = container.resolve('apolloServer')
  return next()
}

const apolloServerFromState = ({
  typeDefs,
  resolvers,
  schema,
  ...options
}) => (ctx, next) => {
  const { state: { container } } = ctx
  if (container) return next()

  const { gqlTypeDefs, gqlResolvers, gqlSchema, log = ctx.log } = ctx.state

  const apolloServer = createServer({
    ...options,
    typeDefs: typeDefs || gqlTypeDefs,
    resolvers: resolvers || gqlResolvers,
    schema: schema || gqlSchema,
    content: ctx,
    log
  })

  ctx.state.apolloServer = apolloServer
  return next()
}

const willStart = () => async (ctx, next) => {
  await ctx.state.apolloServer.willStart()
  return next()
}

const handleErrors = () => async (ctx, next) => {
  await next()

  const { errors, err, ...body } = parseBody(ctx.body)
  if (isNil(err) || isNil(errors)) return

  const log = ctx.state.log || ctx.log
  if (log) logErrors({ status: ctx.status, errors, err, log })

  const data = {
    ...isNil(err) ? {} : { err: safeError(err) },
    ...isNil(errors) ? {} : { errors: map(safeError, errors) },
    ...body
  }
  ctx.body = JSON.stringify(data)
}

const logErrors = ({ status, errors, err, log }) => {
  if (errors) {
    const msg = status === 400 ? 'Bad Request' : 'Errors'
    log.warn({ errors }, `GraphQL Server: ${msg}`)
  }
  if (err) log.error({ err }, 'GraphQL Server: Fail')
}

const isUpload = ctx => typeIs(ctx.req, ['multipart/form-data'])

const uploads = () => async (ctx, next) => {
  if (!isUpload(ctx)) return next()
  const server = ctx.state.apolloServer

  try {
    ctx.request.body = await processFileUploads(
      ctx.req,
      ctx.res,
      server.uploadsConfig
    )

    return next()
  } catch (error) {
    if (error.status && error.expose) ctx.status = error.status

    throw formatApolloErrors([error], {
      formatter: server.requestOptions.formatError,
      debug: server.requestOptions.debug
    })
  }
}

const parseBody = body => {
  try {
    return JSON.parse(body)
  } catch (err) {
    return { err: body }
  }
}

const safeError = ifElse(
  isNil,
  stubUndefined,
  compose(
    ifElse(
      propEq('ValidationError', 'type'),
      assoc('message', 'Bad Request'),
      assoc('message', 'Internal Server Error')
    ),
    dissocPath(['extensions', 'stack']),
    dissocPath(['extensions', 'exception'])
  )
)

const hasServer = compose(isNotNil, path(['state', 'apolloServer']))
const hasContainer = compose(isNotNil, path(['state', 'container']))
