import { Registry } from 'prom-client'
import { createContainer, asValue } from 'awilix'
import gql from 'graphql-tag'

import { createClient, registerClients, collectClientMetrics } from '../lib'

const defaultQuery = gql`query GetSchema{
  __schema {
    types {
      name
    }
  }
}`

export const query = ({ log, graphqlOrigin, graphqlPath }) => async (q = defaultQuery) => {
  const query = typeof q === 'string' ? gql(q) : q

  const client = createClient({
    origin: graphqlOrigin,
    path: graphqlPath,
    reqId: 'req-id',
    token: 'token',
    log
  })

  const { data } = await client.query({ query })
  return data
}

export const metrics = ({ log, graphqlOrigin, graphqlPath }) => async (q = defaultQuery) => {
  const register = new Registry()
  collectClientMetrics({
    register,
    metricOptions: {
      'request_duration_milliseconds': {
        buckets: [0, 200, 300, 800]
      }
    }
  })

  const query = typeof q === 'string' ? gql(q) : q

  const client = createClient({
    retry: 0,
    origin: graphqlOrigin,
    path: graphqlPath,
    metrics: register,
    log
  })

  const get = async () => {
    try {
      return await client.query({ query })
    } catch (err) {}
  }

  await Promise.all([
    get(),
    get(),
    get()
  ])

  get().catch(() => {})
  return register.metrics()
}

export default ({ log, graphqlOrigin, graphqlPath }) => async (q = defaultQuery) => {
  const query = typeof q === 'string' ? gql(q) : q

  const container = createContainer()

  container.register({
    registry: new Registry(),
    log: asValue(log),
    reqId: asValue('req-id')
  })

  registerClients(container, {
    example: {
      origin: graphqlOrigin,
      path: graphqlPath
    } }, {
    token: 'token'
  }
  )

  const client = container.resolve('exampleClient')
  const { data } = await client.query({ query })
  return data
}
