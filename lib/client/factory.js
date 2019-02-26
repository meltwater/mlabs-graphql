import fetch from 'isomorphic-unfetch'

import { ApolloClient } from 'apollo-client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { HttpLink } from 'apollo-link-http'

import { GraphQLClient } from './class'

export const createGraphQLClient = (...args) => new GraphQLClient(...args)

export const createUri = (origin = '', path = '') => [origin, path].join('')

export const createCache = (...options) => (
  new InMemoryCache(...options)
)

export const createHttpLink = ({ token, ...options }) => {
  const headers = {}
  if (token) headers['authorization'] = `Bearer ${token}`

  return new HttpLink({
    fetch,
    ...options,
    headers: {
      ...headers,
      ...(options.headers ? options.headers : {})
    }
  })
}

export const createLink = ({ httpLink }) => httpLink

export const createApolloClient = ({ cache, link, ...options }) => (
  new ApolloClient({
    ...options,
    link,
    cache
  })
)

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
  const clientCache = cache || createCache({ ...cacheOptions })
  const clientLink = link || createLink({
    httpLink: createHttpLink({ uri, token, ...linkOptions })
  })

  const apolloClient = createApolloClient({
    link: clientLink,
    cache: clientCache,
    ...apolloClientOptions
  })

  return createGraphQLClient({ apolloClient, reqId, ...options })
}
