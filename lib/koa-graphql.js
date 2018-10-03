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
  schema = null
} = {}) => {
  const router = new Router()

  const graphql = () => {
    if (schema) return graphqlKoa({ schema })

    return (ctx, next) => {
      const { state: { container } } = ctx
      const scopedSchema = container.resolve('schema')
      return graphqlKoa({ schema: scopedSchema })(ctx, next)
    }
  }

  router.get('graphql', graphqlRoot, graphql())
  router.post('graphql', graphqlRoot, koaBody(), graphql())

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
