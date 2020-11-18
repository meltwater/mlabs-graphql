import fetch from 'isomorphic-unfetch'

import test from 'ava'
import nock from 'nock'
import { v4 as uuidv4 } from 'uuid'
import { ApolloClient } from 'apollo-client'
import { HttpLink } from 'apollo-link-http'
import { InMemoryCache } from 'apollo-cache-inmemory'
import gql from 'graphql-tag'
import createLogger from '@meltwater/mlabs-logger'

import { GraphQLClient } from './class'

test.beforeEach((t) => {
  nock.disableNetConnect()

  const api = 'https://example.com'
  const gqlPath = `/${uuidv4()}`

  const apolloClient = new ApolloClient({
    link: new HttpLink({ fetch, uri: `${api}${gqlPath}` }),
    cache: new InMemoryCache()
  })

  const client = (t, reqId) =>
    new GraphQLClient({
      retry: { retries: 0 },
      apolloClient,
      reqId,
      reqIdHeader: 'x-r-id',
      reqNameHeader: 'x-r-name',
      log: createLogger({ t })
    })

  t.context.api = api
  t.context.gqlPath = gqlPath
  t.context.client = client
  t.context.apolloClient = apolloClient
  t.context.query = gql`
    query DoFoo {
      foo
    }
  `
  t.context.data = { foo: 'hello' }
  t.context.mutation = gql`
    mutation DoBar {
      foo
    }
  `
})

test('healthy', async (t) => {
  const { gqlPath, api, client } = t.context
  const data = {
    __schema: {
      types: [{ name: 'Root', __typename: 'Root' }],
      __typename: 'schema'
    }
  }

  nock(api).post(gqlPath).reply(200, { data })

  const res = await client(t).health()
  t.true(res)
})

test('unhealthy', async (t) => {
  const { gqlPath, api, client } = t.context

  nock(api).post(gqlPath).reply(500, {})

  await t.throwsAsync(client(t).health(), { message: /status code 500/ })
})

test('query', async (t) => {
  const { gqlPath, api, client, query, data } = t.context

  nock(api).post(gqlPath).reply(200, { data })

  const res = await client(t).query({ query })
  t.deepEqual(res.data, data)
})

test('query with simple argument', async (t) => {
  const { gqlPath, api, client, query, data } = t.context

  nock(api).post(gqlPath).reply(200, { data })

  const res = await client(t).query(query)
  t.deepEqual(res.data, data)
})

test('query request error', async (t) => {
  const { gqlPath, api, client, query, data } = t.context

  nock(api).post(gqlPath).reply(500, { data })

  await t.throwsAsync(client(t).query({ query }), {
    message: /status code 500/
  })
})

test('query request error retry', async (t) => {
  const { gqlPath, api, client, query, data } = t.context

  nock(api)
    .post(gqlPath)
    .reply(500, { data })
    .post(gqlPath)
    .reply(200, { data })

  const res = await client(t).query(query, { retry: 1 })
  t.deepEqual(res.data, data)
})

test('query request error retry with header', async (t) => {
  const { gqlPath, api, client, query, data } = t.context

  nock(api)
    .post(gqlPath)
    .reply(500, { data }, { 'retry-after': 1 })
    .post(gqlPath)
    .reply(200, { data })

  const res = await client(t).query(query, { retry: 1 })
  t.deepEqual(res.data, data)
})

test('query request timeout retry', async (t) => {
  const { gqlPath, api, client, query, data } = t.context

  nock(api)
    .post(gqlPath)
    .replyWithError({ code: 'ECONNREFUSED' })
    .post(gqlPath)
    .reply(200, { data })

  const res = await client(t).query(query, { retry: 1 })
  t.deepEqual(res.data, data)
})

test('query and sends headers', async (t) => {
  const { gqlPath, api, client, query, data } = t.context

  nock(api)
    .post(gqlPath)
    .matchHeader('x-r-name', 'Query DoFoo')
    .matchHeader('x-r-id', 'req-id')
    .reply(200, { data })

  const res = await client(t, 'req-id').query({ query })
  t.deepEqual(res.data, data)
})

test('query and sends custom name in header', async (t) => {
  const { gqlPath, api, client, query, data } = t.context

  nock(api)
    .post(gqlPath)
    .matchHeader('x-r-name', 'Query MyOperation')
    .reply(200, { data })

  const res = await client(t).query({ query, name: 'MyOperation' })
  t.deepEqual(res.data, data)
})

test('query error', async (t) => {
  const { client } = t.context
  await t.throwsAsync(client(t).query(), {
    message: /You must wrap the query string in a "gql" tag./
  })
})

test('mutate', async (t) => {
  const { gqlPath, api, client, mutation, data } = t.context

  nock(api).post(gqlPath).reply(200, { data })

  const res = await client(t).mutate({ mutation })
  t.deepEqual(res.data, data)
})

test('mutate with simple argument', async (t) => {
  const { gqlPath, api, client, mutation, data } = t.context

  nock(api).post(gqlPath).reply(200, { data })

  const res = await client(t).mutate(mutation)
  t.deepEqual(res.data, data)
})

test('mutate and sends headers', async (t) => {
  const { gqlPath, api, client, mutation, data } = t.context

  nock(api)
    .post(gqlPath)
    .matchHeader('x-r-name', 'Mutation DoBar')
    .matchHeader('x-r-id', 'req-id')
    .reply(200, { data })

  const res = await client(t, 'req-id').mutate({ mutation })
  t.deepEqual(res.data, data)
})

test('mutate and sends custom name in header', async (t) => {
  const { gqlPath, api, client, mutation, data } = t.context

  nock(api)
    .post(gqlPath)
    .matchHeader('x-r-name', 'Mutation MyOperation')
    .reply(200, { data })

  const res = await client(t, 'req-id').mutate({
    mutation,
    name: 'MyOperation'
  })
  t.deepEqual(res.data, data)
})

test('mutate request error', async (t) => {
  const { gqlPath, api, client, mutation, data } = t.context

  nock(api).post(gqlPath).reply(500, { data })

  await t.throwsAsync(client(t).mutate({ mutation }), {
    message: /status code 500/
  })
})

test('mutate error', async (t) => {
  const { client } = t.context
  await t.throwsAsync(client(t).mutate(), {
    message: /Expecting a parsed GraphQL document/
  })
})
