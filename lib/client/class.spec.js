import test from 'ava'
import nock from 'nock'
import { ApolloClient } from 'apollo-client'
import { HttpLink } from 'apollo-link-http'
import { InMemoryCache } from 'apollo-cache-inmemory'
import gql from 'graphql-tag'
import createLogger from '@meltwater/mlabs-logger'

import { GraphQLClient } from './class'

test.beforeEach(t => {
  nock.disableNetConnect()

  const api = 'https://example.com'

  const apolloClient = new ApolloClient({
    link: new HttpLink({ uri: `${api}/graphql` }),
    cache: new InMemoryCache()
  })

  const client = (t, reqId) => new GraphQLClient({
    apolloClient,
    reqId,
    reqIdHeader: 'x-r-id',
    reqNameHeader: 'x-r-name',
    log: createLogger({ t })
  })

  t.context.api = api
  t.context.client = client
  t.context.apolloClient = apolloClient
  t.context.query = gql`query DoFoo {__schema {types {name}}}`
  t.context.data = { __schema: { types: [{ name: 'Root' }] } }
  t.context.mutation = gql`mutation DoBar {__schema {types {name}}}`
})

test('healthy', async t => {
  const { api, client } = t.context
  const data = { __schema: { types: [{ name: 'Root' }] } }

  nock(api).post('/graphql').reply(200, { data })

  const res = await client(t).health()
  t.true(res)
})

test('unhealthy', async t => {
  const { api, client } = t.context

  nock(api).post('/graphql').reply(500, {})

  await t.throws(
    client(t).health(),
    /status code 500/
  )
})

test('query', async t => {
  const { api, client, query, data } = t.context

  nock(api).post('/graphql').reply(200, { data })

  const res = await client(t).query({ query })
  t.deepEqual(res.data, data)
})

test('query with simple argument', async t => {
  const { api, client, query, data } = t.context

  nock(api).post('/graphql').reply(200, { data })

  const res = await client(t).query(query)
  t.deepEqual(res.data, data)
})

test('query request error', async t => {
  const { api, client, query, data } = t.context

  nock(api).post('/graphql').reply(500, { data })

  await t.throws(
    client(t).query({ query }),
    /status code 500/
  )
})

// TODO: Update when nock issue is closed:
// https://github.com/node-nock/nock/issues/748
test.failing('query and sends headers', async t => {
  const { api, client, query, data } = t.context

  nock(api).post('/graphql', {
    reqheaders: {
      'x-r-name': 'Query DoFoo',
      'x-r-id': 'req-id'
    } })
    .reply(200, { data })

  const res = await client(t, 'req-id').query({ query })
  t.deepEqual(res.data, data)
})

// TODO: Update when nock issue is closed:
// https://github.com/node-nock/nock/issues/748
test.failing('query and sends custom name in header', async t => {
  const { api, client, query, data } = t.context

  nock(api).post('/graphql', {
    reqheaders: {
      'x-r-name': 'Query MyOperation'
    } })
    .reply(200, { data })

  const res = await client(t).query({ query, name: 'MyOperation' })
  t.deepEqual(res.data, data)
})

test('query error', async t => {
  const { client } = t.context
  await t.throws(
    client(t).query(),
    /You must wrap the query string in a "gql" tag./
  )
})

test('mutate', async t => {
  const { api, client, mutation, data } = t.context

  nock(api).post('/graphql').reply(200, { data })

  const res = await client(t).mutate({ mutation })
  t.deepEqual(res.data, data)
})

test('mutate with simple argument', async t => {
  const { api, client, mutation, data } = t.context

  nock(api).post('/graphql').reply(200, { data })

  const res = await client(t).mutate(mutation)
  t.deepEqual(res.data, data)
})

// TODO: Update when nock issue is closed:
// https://github.com/node-nock/nock/issues/748
test.failing('mutate and sends headers', async t => {
  const { api, client, mutation, data } = t.context

  nock(api).post('/graphql', {
    reqheaders: {
      'x-r-name': 'Mutation DoFoo',
      'x-r-id': 'req-id'
    } })
    .reply(200, { data })

  const res = await client(t, 'req-id').mutate({ mutation })
  t.deepEqual(res.data, data)
})

// TODO: Update when nock issue is closed:
// https://github.com/node-nock/nock/issues/748
test.failing('mutate and sends custom name in header', async t => {
  const { api, client, mutation, data } = t.context

  nock(api).post('/graphql', {
    reqheaders: {
      'x-r-name': 'Mutation MyOperation'
    } })
    .reply(200, { data })

  const res = await client(t, 'req-id').mutate({ mutation, name: 'MyOperation' })
  t.deepEqual(res.data, data)
})

test('mutate request error', async t => {
  const { api, client, mutation, data } = t.context

  nock(api).post('/graphql').reply(500, { data })

  await t.throws(
    client(t).mutate({ mutation }),
    /status code 500/
  )
})

test('mutate error', async t => {
  const { client } = t.context
  await t.throws(
    client(t).mutate(),
    /Expecting a parsed GraphQL document/
  )
})
