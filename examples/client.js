import { createContainer, asValue } from 'awilix'
import gql from 'graphql-tag'

import { createClient, registerClients } from '../lib'

const defaultQuery = gql`{
  __schema {
    types {
      name
    }
  }
}`

export const query = ({log, graphqlOrigin, graphqlPath}) => async (q = defaultQuery) => {
  const query = typeof q === 'string' ? gql(q) : q

  const client = createClient({
    origin: graphqlOrigin,
    path: graphqlPath,
    reqId: 'req-id',
    token: 'token',
    log
  })

  const { data } = await client.query({query})
  return data
}

export default ({log, graphqlOrigin, graphqlPath}) => async (q = defaultQuery) => {
  const query = typeof q === 'string' ? gql(q) : q

  const container = createContainer()

  container.register({
    log: asValue(log),
    reqId: asValue('req-id')
  })

  registerClients(container, {
    example: {
      origin: graphqlOrigin,
      path: graphqlPath
    }}, {
      token: 'token'
    }
  )

  const client = container.resolve('exampleClient')
  const { data } = await client.query({query})
  return data
}
