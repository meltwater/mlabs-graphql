import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString
} from 'graphql'

import { runGql } from '../lib'

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
  return runGql({
    query: `query getHello { hello }`,
    operationName: 'getHello',
    schema,
    log
  })
}
