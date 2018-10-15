import test from 'ava'
import nock from 'nock'
import uuid4 from 'uuid/v4'
import gql from 'graphql-tag'
import { Registry } from 'prom-client'
import createLogger from '@meltwater/mlabs-logger'

import {
  createClient,
  registerClientMetrics
} from '../lib'

test.beforeEach(t => {
  nock.disableNetConnect()

  const register = new Registry()

  registerClientMetrics({
    register,
    options: {
      'request_duration_milliseconds': {
        buckets: [0, 10000]
      }
    }
  })

  const api = 'https://example.com'
  const gqlPath = `/${uuid4()}`

  const client = (t, options = {}) => createClient({
    origin: api,
    retry: { retries: 0 },
    metrics: register,
    log: createLogger({ t }),
    ...options
  })

  t.context.api = api
  t.context.gqlPath = gqlPath
  t.context.register = register
  t.context.client = client
  t.context.id = uuid4()
  t.context.query = gql`query DoFoo {__schema {types {name}}}`
  t.context.mutation = gql`mutation DoBar {__schema {types {name}}}`
  t.context.data = { __schema: { types: [{ name: 'Root' }] } }
})

test('get', async t => {
  const { api, gqlPath, query, mutation, data } = t.context
  const goodPath = `/good/${gqlPath}`
  const badPath = `/bad/${gqlPath}`
  const goodClient = t.context.client(t, { path: goodPath })
  const badClient = t.context.client(t, { path: badPath })
  nock(api).post(goodPath).times(3).reply(200, { data })
  nock(api).post(badPath).reply(500, { data })
  await Promise.all([
    goodClient.query({ query }),
    goodClient.mutate({ mutation })
  ])
  try {
    badClient.query({ query })
  } catch (err) {}
  goodClient.query({ query }).catch(() => {})
  const metrics = t.context.register.metrics()

  // Remove metric line that depends on millisecond timing
  const m = metrics.split('\n')
  const snapshot = [
    ...m.slice(0, 31),
    ...m.slice(32, 44),
    ...m.slice(45)
  ].join('\n')

  t.snapshot(snapshot)
})
