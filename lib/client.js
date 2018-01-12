import 'isomorphic-fetch'

import { asFunction } from 'awilix'
import { ApolloClient } from 'apollo-client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { ApolloLink, concat } from 'apollo-link'
import { HttpLink } from 'apollo-link-http'
import {
  createGraphQLClient,
  reqIdMiddleware
} from '@meltwater/mlabs-graphql-client'

const createUri = (origin = '', path = '') => [origin, path].join('')

const createCache = (...options) => (
  new InMemoryCache(...options)
)

const createHttpLink = (...options) => (
  new HttpLink(...options)
)

const createLink = ({reqId, httpLink}) => concat(
  new ApolloLink(reqIdMiddleware(reqId)),
  httpLink
)

const createApolloClient = ({cache, link, ...options}) => (
  new ApolloClient({link, cache, ...options})
)

export const createRegisterClient = container => ({
  name = 'gql',
  origin = '',
  path = '/graphql',
  cacheOptions = {},
  linkOptions = {},
  apolloClientOptions = {},
  clientOptions = {}
} = {}) => {
  const uri = createUri(origin, path)

  const cacheName = `${name}ClientCache`
  const httpLinkName = `${name}ClientHttpLink`
  const linkName = `${name}ClientLink`
  const apolloName = `${name}ApolloClient`
  const clientName = `${name}Client`

  const cache = () => createCache({...cacheOptions})
  const httpLink = () => createHttpLink({uri, ...linkOptions})

  const link = ({httpLink, reqId}) => createLink({httpLink, reqId})
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
    [linkName]: asFunction(link).inject(linkDeps).scoped(),
    [apolloName]: asFunction(apolloClient).inject(apolloDeps).scoped(),
    [clientName]: asFunction(client).inject(clientDeps).scoped()
  })
}

export const registerClients = (container, clients = {}) => {
  const registerClient = createRegisterClient(container)

  for (const [name, options] of Object.entries(clients)) {
    registerClient({name, ...options})
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
  ...options
} = {}) => {
  const uri = createUri(origin, path)
  const clientCache = cache || createCache({...cacheOptions})
  const clientLink = link || createLink({
    reqId,
    httpLink: createHttpLink({uri, ...linkOptions})
  })

  const apolloClient = createApolloClient({
    link: clientLink,
    cache: clientCache,
    ...apolloClientOptions
  })

  return createGraphQLClient({apolloClient, ...options})
}
