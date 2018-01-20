import Koa from 'koa'
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString
} from 'graphql'

import { koaGraphql } from '../lib'

export default ({log}) => async (port = 9000) => {
  const schema = new GraphQLSchema({
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

  const app = new Koa()
  const graphqlRouter = koaGraphql({schema})
  app.use(graphqlRouter.routes())
  app.use(graphqlRouter.allowedMethods())
  return new Promise(() => {
    app.listen(port, () => {
      log.info(`Server: http://localhost:${port}/graphiql`)
    })
  })
}
