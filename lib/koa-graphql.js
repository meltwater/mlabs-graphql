import Router from 'koa-router'
import koaBody from 'koa-bodyparser'
import { graphqlKoa, graphiqlKoa } from 'apollo-server-koa'

export default ({
  graphqlRoot = '/graphql',
  graphiqlRoot = '/graphiql',
  schema = null
} = {}) => {
  const router = new Router()

  const graphql = () => {
    if (schema) return graphqlKoa({schema})

    return (ctx, next) => {
      const { state: { container } } = ctx
      const scopedSchema = container.resolve('schema')
      return graphqlKoa({schema: scopedSchema})(ctx, next)
    }
  }

  router.post(graphqlRoot, koaBody(), graphql())
  router.get(graphqlRoot, graphql())

  if (graphiqlRoot) {
    router.get(graphiqlRoot, graphiqlKoa({endpointURL: graphqlRoot}))
  }

  return router
}
