import Koa from 'koa'
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString
} from 'graphql'

import { koaGraphql, fetchRemoteSchemas } from '../lib'

const basicSchema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
      hello: {
        type: GraphQLString,
        resolve () {
          return 'world'
        }
      }
    }
  })
})

export const koa = ({ log, schema = basicSchema }) => async (port = 9000) => {
  const app = new Koa()
  const graphqlRouter = koaGraphql({ schema })
  app.use(graphqlRouter.routes())
  app.use(graphqlRouter.allowedMethods())
  return new Promise(() => {
    app.listen(port, () => {
      log.info(`Playground: http://localhost:${port}/playground`)
      log.info(`Voyager: http://localhost:${port}/voyager`)
      log.info(`Server: http://localhost:${port}/graphql`)
    })
  })
}

export const remote = (options) => async (
  origin = 'https://graphql-pokemon.now.sh',
  path = '/graphql',
  port
) => {
  const schemas = await fetchRemoteSchemas({ pokemon: { origin, path } })
  const example = koa({ ...options, schema: schemas.pokemon.schema })
  return example(port)
}

export default koa
