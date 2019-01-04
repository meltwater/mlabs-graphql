import Router from 'koa-router'
import koaBody from 'koa-bodyparser'
import { ApolloServer } from 'apollo-server'
import { graphqlKoa } from 'apollo-server-koa/dist/koaApollo'
import { resolveGraphiQLString } from 'apollo-server-module-graphiql'
import { koa as voyagerKoa } from 'graphql-voyager/middleware'
import playgroundKoa from 'graphql-playground-middleware-koa'

export default ({
  graphqlRoot = '/graphql',
  graphiqlRoot = '/graphiql',
  voyagerRoot = '/voyager',
  playgroundRoot = '/playground',
  typeDefs = null,
  resolvers = null,
  schema = null,
  ...options
} = {}) => {
  const router = new Router()
  const opts = { debug: false, ...options }

  const graphql = () => {
    if (typeDefs && resolvers) return graphqlKoa({ typeDefs, resolvers, ...opts })
    if (schema) return graphqlKoa({ schema, ...opts })

    return (ctx, next) => {
      const { state: { container } } = ctx
      const scopedTypeDefs = container.resolve('gqlTypeDefs')
      const scopedResolvers = container.resolve('gqlResolvers')
      const log = container.resolve('log')
      const apolloServer = new ApolloServer({
        typeDefs: scopedTypeDefs,
        resolvers: scopedResolvers,
        formatError: formatError(log),
        ...opts
      })
      return graphqlKoa(
        () => apolloServer.createGraphQLServerOptions(ctx)
      )(ctx, next)
    }
  }

  const logError = () => async (ctx, next) => {
    await next()
    const log = ctx.state.log || ctx.log
    if (!log) return
    const errors = parseErrors(ctx.body)
    if (errors) {
      const msg = ctx.status === 400 ? 'Bad Request' : 'Errors'
      log.warn({ errors }, `GraphQL Server: ${msg}`)
    }
  }

  router.get('graphql', graphqlRoot, logError(), graphql())
  router.post('graphql', graphqlRoot, koaBody(), logError(), graphql())

  if (graphiqlRoot) {
    router.get('graphiql', graphiqlRoot, graphiqlKoa({ endpointURL: graphqlRoot }))
  }

  if (voyagerRoot) {
    router.all('voyager', voyagerRoot, voyagerKoa({ endpointUrl: graphqlRoot }))
  }

  if (playgroundRoot) {
    router.all('playground', playgroundRoot, playgroundKoa({
      endpoint: graphqlRoot,
      settings: {
        'request.credentials': 'same-origin'
      }
    }))
  }

  return router
}

const graphiqlKoa = options => async ctx => {
  const query = ctx.request.query
  const body = await resolveGraphiQLString(query, options, ctx)
  ctx.set('content-type', 'text/html')
  ctx.body = body
}

const parseErrors = body => {
  try {
    const { errors } = JSON.parse(body)
    return errors
  } catch (err) {}
}

const formatError = log => err => {
  log.error({ err }, 'GraphQL: Schema Error')
  return err
}
