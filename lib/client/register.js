import { asFunction } from 'awilix'
import {
  createApolloClient,
  createCache,
  createGraphQLClient,
  createHttpLink,
  createLink,
  createUri
} from './factory'

export const registerClient = (
  container,
  {
    name = 'gql',
    origin = '',
    path = '/graphql',
    token,
    cacheOptions = {},
    linkOptions = {},
    apolloClientOptions = {},
    clientOptions = {}
  } = {}
) => {
  if (!container) throw new Error('Missing container.')

  const uri = createUri(origin, path)

  const cacheName = `${name}ClientCache`
  const httpLinkName = `${name}ClientHttpLink`
  const linkName = `${name}ClientLink`
  const apolloName = `${name}ApolloClient`
  const clientName = `${name}Client`

  const cache = () => createCache({ ...cacheOptions })
  const httpLink = () => createHttpLink({ uri, token, ...linkOptions })

  const link = ({ httpLink }) => createLink({ httpLink })
  const linkDeps = c => ({ httpLink: c.resolve(httpLinkName) })

  const apolloClient = ({ cache, link }) =>
    createApolloClient({
      link,
      cache,
      ...apolloClientOptions
    })

  const apolloDeps = c => ({
    cache: c.resolve(cacheName),
    link: c.resolve(linkName)
  })

  const client = ({ apolloClient, registry, reqId, log }) =>
    createGraphQLClient({
      name,
      apolloClient,
      metricRegistry: registry,
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
    [linkName]: asFunction(link)
      .inject(linkDeps)
      .singleton(),
    [apolloName]: asFunction(apolloClient)
      .inject(apolloDeps)
      .scoped(),
    [clientName]: asFunction(client)
      .inject(clientDeps)
      .scoped()
  })
}

export const registerClients = (container, clients = {}, defaults = {}) => {
  for (const [name, options] of Object.entries(clients)) {
    registerClient(container, { name, ...defaults, ...options })
  }
}
