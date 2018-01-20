import 'isomorphic-fetch'

import { asFunction } from 'awilix'
import { ApolloClient } from 'apollo-client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { HttpLink } from 'apollo-link-http'
import createGraphQLClient from '@meltwater/mlabs-graphql-client'

const createUri = (origin = '', path = '') => [origin, path].join('')

const createCache = (...options) => (
  new InMemoryCache(...options)
)

const createHttpLink = ({token, ...options}) => {
  const headers = {}
  if (token) headers['authorization'] = token

  return new HttpLink({
    ...options,
    headers: {
      ...headers,
      ...(options.headers ? options.headers : {})
    }
  })
}

const createLink = ({httpLink}) => httpLink

const createApolloClient = ({cache, link, ...options}) => (
  new ApolloClient({link, cache, ...options})
)

export const registerClient = (container, {
  name = 'gql',
  origin = '',
  path = '/graphql',
  token,
  cacheOptions = {},
  linkOptions = {},
  apolloClientOptions = {},
  clientOptions = {}
} = {}) => {
  if (!container) throw new Error('Missing container.')

  const uri = createUri(origin, path)

  const cacheName = `${name}ClientCache`
  const httpLinkName = `${name}ClientHttpLink`
  const linkName = `${name}ClientLink`
  const apolloName = `${name}ApolloClient`
  const clientName = `${name}Client`

  const cache = () => createCache({...cacheOptions})
  const httpLink = () => createHttpLink({uri, token, ...linkOptions})

  const link = ({httpLink}) => createLink({httpLink})
  const linkDeps = c => ({httpLink: c.resolve(httpLinkName)})

  const apolloClient = ({cache, link}) => createApolloClient({
    cache,
    link,
    ...apolloClientOptions
  })

  const apolloDeps = c => ({
    cache: c.resolve(cacheName),
    link: c.resolve(linkName)
  })

  const client = ({apolloClient, reqId, log}) => createGraphQLClient({
    name,
    apolloClient,
    reqId,
    log,
    ...clientOptions
  })

  const clientDeps = c => ({
    apolloClient: c.resolve(apolloName)
  })

  container.register({
    [cacheName]: asFunction(cache).singleton(),
    [httpLinkName]: asFunction(httpLink).singleton(),
    [linkName]: asFunction(link).inject(linkDeps).singleton(),
    [apolloName]: asFunction(apolloClient).inject(apolloDeps).scoped(),
    [clientName]: asFunction(client).inject(clientDeps).scoped()
  })
}

export const registerClients = (container, clients = {}, defaults = {}) => {
  for (const [name, options] of Object.entries(clients)) {
    registerClient(container, {name, ...defaults, ...options})
  }
}

export default ({
  origin,
  path = '/graphql',
  link,
  linkOptions = {},
  cache,
  cacheOptions = {},
  apolloClientOptions = {},
  reqId,
  token,
  ...options
} = {}) => {
  const uri = createUri(origin, path)
  const clientCache = cache || createCache({...cacheOptions})
  const clientLink = link || createLink({
    httpLink: createHttpLink({uri, token, ...linkOptions})
  })

  const apolloClient = createApolloClient({
    link: clientLink,
    cache: clientCache,
    ...apolloClientOptions
  })

  return createGraphQLClient({apolloClient, reqId, ...options})
}
