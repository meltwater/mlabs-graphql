import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString
} from 'graphql'

import { execSchema } from '../lib'

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

export default ({ log }) => async () => {
  return execSchema({
    query: `query getHello { hello }`,
    operationName: 'getHello',
    schema,
    log
  })
}
