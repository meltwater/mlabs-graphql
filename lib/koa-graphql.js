import Router from 'koa-router'
import koaBody from 'koa-bodyparser'
import { graphqlKoa, graphiqlKoa } from 'apollo-server-koa'
import { koa as voyagerKoa } from 'graphql-voyager/middleware'
import playgroundKoa from 'graphql-playground-middleware-koa'

export default ({
  graphqlRoot = '/graphql',
  graphiqlRoot = '/graphiql',
  voyagerRoot = '/voyager',
  playgroundRoot = '/playground',
  schema = null,
  ...options
} = {}) => {
  const router = new Router()
  const opts = { debug: false, ...options }

  const graphql = () => {
    if (schema) return graphqlKoa({ schema, ...opts })

    return (ctx, next) => {
      const { state: { container } } = ctx
      const scopedSchema = container.resolve('schema')
      return graphqlKoa({ schema: scopedSchema, ...opts })(ctx, next)
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

const parseErrors = body => {
  try {
    const { errors } = JSON.parse(body)
    return errors
  } catch (err) {}
}
