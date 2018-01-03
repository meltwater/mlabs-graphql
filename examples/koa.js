import Koa from 'koa'
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString
} from 'graphql'

import { koaGraphql } from '../lib'

export default ({log}) => async (port = 8080) => {
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
  app.listen(port, () => {
    log.info(`Server: http://localhost:${port}/graphiql`)
  })
}
