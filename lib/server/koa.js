import Router from 'koa-router'
import koaBody from 'koa-bodyparser'
import { ApolloServer } from 'apollo-server-koa/dist/ApolloServer'
import { graphqlKoa } from 'apollo-server-koa/dist/koaApollo'
import { resolveGraphiQLString } from 'apollo-server-module-graphiql'
import { koa as voyagerKoa } from 'graphql-voyager/middleware'
import playgroundKoa from 'graphql-playground-middleware-koa'
import typeIs from 'type-is'
import { defaultTo } from '@meltwater/phi'
import {
  formatApolloErrors,
  processFileUploads
} from 'apollo-server-core'

export default ({
  graphqlRoot = '/graphql',
  subscriptionsRoot = '/subscriptions',
  graphiqlRoot = '/graphiql',
  voyagerRoot = '/voyager',
  playgroundRoot = '/playground',
  typeDefs = null,
  resolvers = null,
  schema = null,
  ...options
} = {}) => {
  const router = new Router()
  const apolloServerOptions = {
    debug: false,
    subscriptions: { path: subscriptionsRoot },
    ...options
  }

  const middleware = [
    logError(),
    apolloServer(apolloServerOptions, { graphqlRoot, schema, typeDefs, resolvers }),
    willStart(),
    graphql()
  ]

  const postMiddleware = [
    koaBody(),
    uploads(),
    ...middleware
  ]

  router.get('graphql', graphqlRoot, ...middleware)
  router.post('graphql', graphqlRoot, ...postMiddleware)

  if (graphiqlRoot) {
    router.get('graphiql', graphiqlRoot, graphiqlKoa({ endpointURL: graphqlRoot }))
  }

  if (voyagerRoot) {
    router.all('voyager', voyagerRoot, voyagerKoa({ endpointUrl: graphqlRoot }))
  }

  if (playgroundRoot) {
    router.all('playground', playgroundRoot, playgroundKoa({
      endpoint: graphqlRoot,
      subscriptionEndpoint: subscriptionsRoot,
      settings: {
        'request.credentials': 'same-origin'
      }
    }))
  }

  return router
}

const graphql = () => async (ctx, next) => graphqlKoa(
  () => ctx.state.apolloServer.createGraphQLServerOptions(ctx)
)(ctx, next)

const graphiqlKoa = options => async ctx => {
  const query = ctx.request.query
  const body = await resolveGraphiQLString(query, options, ctx)
  ctx.set('content-type', 'text/html')
  ctx.body = body
}

const getModels = (container, { schema, typeDefs, resolvers } = {}) => {
  const allowUnregistered = true
  const scopedTypeDefs = container.resolve('gqlTypeDefs', { allowUnregistered })
  const scopedResolvers = container.resolve('gqlResolvers', { allowUnregistered })
  const scopedSchema = container.resolve('gqlSchema', { allowUnregistered })
  return {
    schema: defaultTo(schema, scopedSchema),
    typeDefs: defaultTo(typeDefs, scopedTypeDefs),
    resolvers: defaultTo(resolvers, scopedResolvers)
  }
}

const apolloServer = (options, { graphqlRoot, ...model }) => (ctx, next) => {
  const { state: { container } } = ctx
  const log = ctx.state.log || ctx.log

  const { typeDefs, schema, resolvers } = getModels(container, model)
  const formatError = createFormatError(log)

  const data = schema ? { schema } : { typeDefs, resolvers }

  const apolloServer = new ApolloServer({
    formatError,
    ...data,
    ...options
  })
  apolloServer.graphqlPath = graphqlRoot
  ctx.state.apolloServer = apolloServer
  return next()
}

const willStart = () => async (ctx, next) => {
  await ctx.state.apolloServer.willStart()
  return next()
}

const logError = () => async (ctx, next) => {
  await next()
  const log = ctx.state.log || ctx.log
  if (!log) return
  const { errors, err } = parseErrors(ctx.body)
  if (errors) {
    const msg = ctx.status === 400 ? 'Bad Request' : 'Errors'
    log.warn({ errors }, `GraphQL Server: ${msg}`)
  }
  if (err) log.error({ err }, `GraphQL Server: Fail`)
}

const uploads = () => async (ctx, next) => {
  const isUpload = typeIs(ctx.req, ['multipart/form-data'])
  if (!isUpload) return next()

  try {
    const { apolloServer } = ctx.state

    ctx.request.body = await processFileUploads(
      ctx.req,
      ctx.res,
      apolloServer.uploadsConfig
    )

    return next()
  } catch (error) {
    if (error.status && error.expose) ctx.status = error.status

    throw formatApolloErrors([error], {
      formatter: apolloServer.requestOptions.formatError,
      debug: apolloServer.requestOptions.debug
    })
  }
}

const parseErrors = body => {
  try {
    const { errors } = JSON.parse(body)
    return { errors }
  } catch (err) {
    return { err: body }
  }
}

const createFormatError = log => err => {
  if (log) log.error({ err }, 'GraphQL: Schema Error')
  return err
}
