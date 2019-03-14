# API Reference

## Top-Level Exports

- [`koaGraphql(options)`](#koagraphqloptions)
- [`createClient(options)`](#createclientoptions)
- [`createServer(options)`](#createserveroptions)
- [`fetchRemoteSchema(options)`](#fetchremoteschemaoptions)
- [`fetchRemoteSchemas(schemas, options)`](#fetchremoteschemasschemas-options)
- [`registerClient(container, client)`](#registerclientcontainer-client)
- [`registerClients(container, clients)`](#registerclientscontainer-clients-defaults)
- [`registerServer(container, models)`](#registerservercontainer-models-options)
- [`collectClientMetrics(options)`](#collectclientmetricsoptions)
- [`examples`](#examples)
- [`GraphQLClient`](#graphqlclient)

### Importing

Every function described above is a top-level export.
You can import any of them like this:

```js
import { koaGraphql } from '@meltwater/mlabs-graphql'
```

Additionally, all modules from [GraphQL.js] and [GraphQL-tools] are reexported,
and [graphql-tag] is reexported as the default export for this module, e.g.,

```js
import gql, { graphql, makeExecutableSchema } from '@meltwater/mlabs-graphql'
```

[GraphQL.js]: http://graphql.org/graphql-js/
[GraphQL-tools]: https://www.apollographql.com/docs/graphql-tools/
[graphql-tag]: https://github.com/apollographql/graphql-tag

---
### `koaGraphql(options)`

[Koa router][koa-router] for [Apollo GraphQL Server][apollo-server]
[GraphQL Playground] and [GraphQL Voyager].

Creates a new Apollo server instance for each request.
The server is created with `context` set to the Koa `ctx`
and assigned to `ctx.state.apolloServer`.

The server is created using the following logic:

- If `ctx.state.container` is defined,
  resolve `apolloServer` from the [Awilix] container.
  - The passed `options` will be registered as `gqlOptions`
    before resolving `apolloServer`.
  - The Koa context will be registered as `gqlContext`
    before resolving `apolloServer`.
- If `ctx.state.container` is not defined,
  look for `gqlTypeDefs`, `gqlResolvers`, and `gqlSchema`
  in `ctx.state` and pass to [`createServer`]
  as `typeDefs`, `resolvers`, and `schema` respectively.
  - If `schema`, `resolvers`, or `typeDefs` are passed
    these will override any corresponding values in `ctx.state`.

#### Arguments

1. `options` (*object*):
   Any additional options are passed directly to [`createServer`].
    - `schema` (*object*): The GraphQL schema.
      Default: `null`.
    - `typeDefs` (*object*): The GraphQL type defs.
      Default: `null`.
    - `resolvers` (*object*): The GraphQL resolvers map.
      Default: `null`.
    - `middleware` (*array*): Koa middleware to use after Apollo server starts
      but before the request is handled.
    - `graphqlRoot` (*string*): Path to serve GraphQL endpoint.
      Default: `/graphql`.
    - `subscriptionsRoot ` (*string*): Path to serve GraphQL subscriptions endpoint.
      Default: `/subscriptions`.
    - `playgroundRoot` (*string*): Path to serve [GraphQL Playground] endpoint.
      If `null`, the endpoint will be unavailable.
      Default: `/playground`.
    - `voyagerRoot` (*string*): Path to serve [GraphQL Voyager] endpoint.
      If `null`, the endpoint will be unavailable.
      Default: `/voyager`.

#### Returns

(*object*): The [router][koa-router].

#### Example

```js
graphqlRouter = koaGraphql()
app.use(graphqlRouter.routes())
app.use(graphqlRouter.allowedMethods())
```

[`createServer`]: (#createserveroptions)

---
### `createServer(options)`

Create an [Apollo Server].
Either `typeDefs` and `resolvers` or a `schema` must be provided.

#### Arguments

1. `options` (*object*):
   Any additional options are passed directly to the [Apollo Server].
    - `schema` (*object*): The GraphQL schema.
      If given will override all other schema-specific options below.
    - `typeDefs` (*array*): The GraphQL type defs.
      Must be either an array of only strings or an array of
      only strings tagged with `gql`, an array of mixed types
      is not currently supported.
    - `resolvers` (*object*): The GraphQL resolvers map.
    - `mergeInfo` (*object*): The `mergeInfo` option for [`mergeSchemas`].
    - `transformSchema` (*function*): The `transformSchema` option for [`mergeSchemas`].
    - `onTypeConflict` (*function*): The `onTypeConflict` option for [`mergeSchemas`].
    - `graphqlRoot` (*string*): Path to serve GraphQL endpoint.
      Default: `/graphql`.
    - `subscriptionsRoot ` (*string*): Path to serve GraphQL subscriptions endpoint.
      Default: `/subscriptions`.
    - `log` (*object*): A [Logger].
      Default: one will be created.

#### Returns

(*ApolloServer*)

[`mergeSchemas`]: https://www.apollographql.com/docs/apollo-server/api/graphql-tools.html#mergeSchemas

---
### `fetchRemoteSchema(options)`

Fetch a remote schema from a GraphQL endpoint
using Apollo Link and [makeRemoteExecutableSchema].

Returns a promise.

#### Arguments

1. `options` (*object*):
    - `origin` (*string* **required**): The GraphQL server [URL origin].
    - `path` (*string*): The GraphQL endpoint on the server.
      Default: `/graphql`.
    - `token` (*string*): Token to send in the `authorization` header.
      Default: none.
    - `link` (*object*): The [Apollo Link] to use.
      Default: create a new [Apollo HTTP Link].
    - `linkOptions` (*object*): Options passed directly to [Apollo HTTP Link]
      if `link` is not provided.
    - `schemaOptions` (*object*): Options passed directly to [makeRemoteExecutableSchema].
      Default: none.

#### Returns

(*object*):
  - `schema`: The remote executable schema.
  - `link`: The Apollo Link for the remote schema.
  - `health`: An async function that will fetch a new schema,
     compare the current schema, and throw if they differ.
  - `introspectionQueryResultData`:
    The data returned from the introspection query.

---
### `fetchRemoteSchemas(schemas, options)`

Fetch remote schemas from a GraphQL endpoint using
[`fetchRemoteSchema(options)`](#fetchremoteschemaoptions).

Returns a promise.

#### Arguments

1. `schemas` (*object*): Object where each value is passed to
   `fetchRemoteSchema`.
2. `options`: (*object*): Default options to merge with each schema
    before passing to `fetchRemoteSchema`.

#### Returns

(*object*): Object with the same keys as `schemas`
with values replaced by the return of `fetchRemoteSchema`.

---
### `createClient(options)`

Create a [GraphQLClient].
If a link or cache are not provided, they will be created.

The Apollo Client `fetchPolicy` option is set to `no-cache` by default
for each operation.

#### Arguments

1. `options` (*object*):
   Any additional options are passed directly to the [GraphQLClient].
    - `origin` (*string*): The GraphQL server [URL origin].
      Default: an empty string.
    - `path` (*string*): The GraphQL endpoint on the server.
      Default: `/graphql`.
    - `reqId` (*string*): Request id to send in the `x-request-id` header.
      Default: none.
    - `token` (*string*): Token to send in the `authorization` header.
      Default: none.
    - `log` (*object*): A [Logger].
      Default: none, but one will be created by the [GraphQLClient].
    - `cache` (*object*): The [Apollo Cache] to use.
      Default: create a new [Apollo InMemoryCache].
    - `cacheOptions` (*object*): Options passed directly to [Apollo InMemoryCache]
      if `cache` is not provided.
    - `link` (*object*): The [Apollo Link] to use.
      Default: create a new [Apollo HTTP Link].
    - `linkOptions` (*object*): Options passed directly to [Apollo HTTP Link]
      if `link` is not provided.
    - `apolloClientOptions` (*object*): Options passed directly to [Apollo Client].

#### Returns

(*GraphQLClient*)

#### Example

```js
const client = createClient({
  origin: 'https://example.com',
  reqId: null,
  log
})
```

---
### `registerClient(container, client)`

Register a [GraphQLClient] and its dependencies in the Awilix container.

The container must provide the dependencies `registry`, `log` and `reqId`.
The `reqId` will be sent in the `x-request-id` header.
The `registry` is passed as `metricRegistry` to the GraphQLClient.

For example, registering a client named `gql`
will register the following dependencies:

- `gqlClientCache`: The [Apollo InMemoryCache] (singleton).
- `gqlClientHttpLink`: The [Apollo HTTP Link] (singleton).
- `gqlClientLink`: The [Apollo Link] (scoped).
  Combines the HTTP Link and request id header forwarding.
- `gqlClientApolloClient`: The [Apollo Client] (scoped).
  Uses `gqlClientCache` and `gqlClientLink`.
  The `fetchPolicy` option is set to `no-cache` by default for each operation.
- `gqlClient`: The [GraphQLClient] (scoped).
  Uses `gqlClientApolloClient`.

Any of these dependencies may be overridden manually be registering
a compatible dependency under the corresponding name.

#### Arguments

1. `container` (*object* **required**): The [Awilix] container.
2. `client` (*object*):
    - `name` (*string*): The (unique) client name.
      The client will be registered as `${name}Client`.
      Default: `gql`.
    - `origin` (*string*): The GraphQL server [URL origin].
      Default: an empty string.
    - `path` (*string*): The GraphQL endpoint on the server.
      Default: `/graphql`.
    - `token` (*string*): Token to send in the `authorization` header.
      Default: none.
    - `cacheOptions` (*object*): Options passed directly to [Apollo InMemoryCache].
    - `linkOptions` (*object*): Options passed directly to [Apollo HTTP Link].
    - `apolloClientOptions` (*object*): Options passed directly to [Apollo Client].
    - `clientOptions` (*object*): Options passed directly to [GraphQLClient].

#### Returns

(*undefined*)

#### Example

```js
registerClient(container, {
  name: 'foo',
  origin: 'https://example.com'
})

const client = container.resolve('fooClient')
```

---
### `registerClients(container, clients, defaults)`

Register each [GraphQLClient] and its dependencies in the Awilix container
using [`registerClient`](#registerclientcontainer-client).

#### Arguments

1. `container` (*object* **required**): The [Awilix] container.
2. `clients` (*object*):
    The clients to register.
    Each key will be used as the client `name`
    and the value will be passed as the second argument to
    [`registerClient`](#registerclientcontainer-client).
3. `defaults` (*object*):
   Options to apply to each client by default.

#### Returns

(*undefined*)

---
### `registerServer(container, models, options)`

Register a GraphQL server and its dependencies in the [Awilix] container.
The `options` argument is optional and will be passed to [`createServer`].

The container must provide the dependency `log`.

Register the following dependencies
as well as named dependencies for each model (see below).
Any of these may be overridden by re-registering them
after calling this method.

- `gqlTypeDefs` (singleton).
  Pass `useScopedTypeDefs = true` in options to override this.
- `gqlResolvers` (scoped).
- `gqlSchemas` (scoped).
- `gqlSchema` (scoped).
- `gqlContext` (scoped).
- `gqlOptions` (scoped).
- `apolloServer` (scoped).
- `apolloServerStart`: Calls `willStart`.
- `apolloServerStop`: Calls `stop`.
- `installApolloServerSubscriptionHandlers`:
  Calls `installSubscriptionHandlers` for websocket subscriptions support.
  Depends on `server` as a registered dependency which should be
  an instance of the Node.js built in `http.Server`.

Each model is an object containing any or all of
`typeDefs`, `resolvers`, `schema`, `mutation`, and `query`.
Each of these should be a factory function which
will be registered in the container and thus may
request dependencies.
(Supplying a constant non-factory functions is also supported.)
The name of the model is its key in the model object
and is prefixed to the registered dependencies.
For example, if the models object has a key `Cat`, then
`CatTypeDefs`, `CatResolvers`, `CatSchema`, `CatMutation`, and `CatQuery`
may all be registered.
See the example below for the format of each type.

#### Arguments

1. `container` (*object* **required**): The [Awilix] container.
2. `models` (*object*): The models to register.

#### Returns

(*undefined*)

#### Example

```js
const Cat = `
  type Cat {
    name: String
    type: CatType
    food: FoodType
  }
`

const CatType = ({ catTypes }) => `
  enum CatType {
    ${catTypes.join(' ')}
  }
`

const typeDefs = ({ catTypes }) => () => [
  CatType({ catTypes }),
  Cat
]

export const resolvers = ({
  FoodQuery
}) => ({
  food: (...args) => FoodQuery.get(...args)
})

export const query = ({ catService }) => ({
  get: (parent, { id }, context, info) => catService.get(id)
})

export const mutation = ({ catService }) => ({
  create: (parent, { input }, context, info) => {
    return catService.create(input)
  }
})

const catModel = {
  typeDefs,
  resolvers,
  mutation,
  query
}

const foodModel = {...} // will define FoodQuery.get(...)
const QueryModel = {...} // will use CatQuery.get(...)
const MutationModel = {...} // will use CatMutation.create(...)
const RootModel = {...} // will define Query and Mutation under schema

registerModels(container, {
  Food: FoodModel,
  Cat: CatModel,
  Root: RootModel
})
```

---
### `examples`

Convenient `query` and `mutate` examples for projects using [examplr].

- Each example receives the same options and takes the same arguments (see below).
- The `query` (`mutation`) example looks
  for a `queries` (`mutations`) directory under `dataRoot`.
- The GraphQL query or mutation is loaded from a file matching `${name}.graphql`.
  The corresponding variables are loaded from a file matching `${name}.${vars}.json`.
- By default, to support queries without variables,
  the special name `default` is used for `vars`,
  in which case there is no error if the variables file is not found.

#### Options

- `dataRoot` (*string* **required**): Path containing
  the `queries` and `mutations` directories.
- `graphqlOrigin` (*string* **required**): The GraphQL server [URL origin].
- `graphqlPath` (*string*): The GraphQL endpoint on the server.
  Default: `/graphql`.
- `graphqlVarTransforms` (*object*): Functions to transform the variables
  loaded from the JSON file before making a request.
  Looks for a transform function under `queries[name]` or `mutations[name]`.
  Each function will receive the variables as an object and should return a new object.
  Additionally, all arguments passed to the example will be passed to the transform
  function as additional arguments beyond the first (`name`, `vars`, etc.).
  Default: no transforms.
- `graphqlClientOptions` (*object*): Additional options to pass to `createClient`.
  Use `defaultOptions` inside this to directly affect the query or mutation.
- `graphqldefaultNames` (*object*): Default names to use for queries and mutations.
  Default: `{query: 'query', mutation: 'mutation'}`.
- `log` (*object*): The Logger.

#### Arguments

1. `name` (*string*): The name of the query or mutation to load.
2. `vars` (*string*): The name of variables to load.

#### Returns

(*object*): The `{data}` result from the query or mutation.

#### Example

Create `examples/mutations/foo.graphql`
and `examples/mutations/foo.default.json`,
then update an existing set of examplr examples, e.g.,

```js
/* examples/index.js */

import createExamples from '@meltwater/examplr'

import { examples } from '@meltwater/mlabs-graphql'

const envVars = [
  'GRAPHQL_ORIGIN',
  'DATA_ROOT'
]

const defaultOptions = {
  graphqlVarTransforms: {
    mutations: {
      bar: vars => ({...vars, date: Date.now()})
    }
  },
  graphqlDefaultNames: {query: 'foo', 'mutation': 'bar'},
  graphqlOrigin: 'http://localhost:9000',
  dataRoot: __dirname
}

if (require.main === module) {
  const { runExample } = createExamples({
    examples,
    envVars,
    defaultOptions
  })
  runExample()
}
```

---
### `collectClientMetrics(options)`

Collect metrics with [Prometheus client].

Call this function once with a [Prometheus Registry] instance
and pass the same Registry instance to each GraphQLClient that should
send metrics to this Registry.

The list of (un-prefixed) metric names is exported as `metricNames`.

#### Arguments

1. `options` (*object*):
    - `register` (*object* **required**):
      [Prometheus registry] to use for metrics.
    - `prefix` (*string*): Prefix to prepend to all metric names.
      Default: `graphql_client_`.
    - `metricOptions` (*object*): Override options for each metric.
      Default: no overrides.

#### Returns

(*undefined*)

#### Examples

```js
const register = new Registry()

collectClientMetrics({
  register,
  prefix: 'my_prefix_',
  options: {
    'request_duration_milliseconds': {
      buckets: [0, 200, 300, 800]
    }
  }
})

const client = createClient({ metricRegistry: register })
await client.query(...)

register.metrics()
```

## GraphQLClient

All methods are asynchronous (return a promise).

### Constructor

1. `options` (*object*):
    - `apolloClient` (*object* **required**):
      The [Apollo Client] instance to use for requests.
    - `name` (*string*): The client name (for logging).
      Default: graphql.
    - `retry` (*object* or *number*): Options to pass directly to [async-retry].
    - `metricRegistry` (*object*): [Prometheus Registry] to collect metrics.
      Default: `null` (metrics disabled).
    - `metricPrefix` (*object*): Prefix prepend to all metric names.
      Default: See [`collectClientMetrics`](#collectclientmetricsoptions).
    - `healthQuery`: Query used for health check.
      Default: standard type query.
    - `reqId` (*string*): A request id to bind to the instance.
      Default: one will be generated.
    - `reqIdHeader` (*string*): Name of the header to use for the request id.
      Default: `x-request-id`.
    - `reqNameHeader` (*string*): Name of the header to use for the request name.
      Default: `x-request-name`.
    - `responseLogLevel` (*string*): Log level to log successful responses.
      If this level is active, then successful responses
      will be logged according to the other log response options.
      Default: debug.
    - `willLogOptions` (*boolean*): If true, log additional options
      passed to the client methods under `meta`.
      Default: true.
    - `willLogResponseProps` (*boolean*): If true, log props returned
      by `getLogResponseProps`.
      Only relevant if `responseLogLevel` is an active level.
      Default: true.
    - `willLogResponseData` (*boolean*): If true, log `data` returned
      by `getLogResponseData`.
      Only relevant if `responseLogLevel` is an active level.
      Default: true.
    - `getLogResponseProps` (*function*): Receives the full response from ApolloClient
      and returns an object whose properties will be logged at the top level.
      Only relevant if `responseLogLevel` is an active level.
      Default: no additional props are logged.
    - `getLogResponseData` (*function*): Receives the full response from ApolloClient
      and returns an object whose properties will be logged under `data`.
      Only relevant if `responseLogLevel` is an active level
      and `willLogResponseData` is set.
      Default: logs the full ApolloClient response.
    - `log` (*object*): A [Logger].
      Default: a new logger.

### Example

```js
import ApolloClient from 'apollo-client'
import { HttpLink } from 'apollo-link-http'
import { InMemoryCache } from 'apollo-cache-inmemory'

const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: new HttpLink({uri})
})

const client = createClient({apolloClient})
```

---
### `health()`

#### Returns

(*boolean*): If the client is healthy.

---
### `query(query, options)`

#### Arguments

1. `query` (*string* **required**): The GraphQL query.
2. `options` (*object*): Options to pass to the [Apollo Client] query method.

Alternatively, if a single argument is provided as an object,
it is passed directly to the [Apollo Client] query method.

- Failing requests will be retried on certain errors.
- If the query is given an [operation name]
  or `name` is given as an option (in either case above),
  log messages will include the name
  and the name will be sent in the request name header.
- Pass the `meta` option to log additional properties to the `meta` key.
- Pass the `logProps` option to log additional properties at the top-level.
- The following options may be set per-request to override
  the defaults defined by the constructor:
  `retry`,
  `willLogOptions`,
  `willLogResponseProps`,
  `willLogResponseData`,
  `getLogResponseProps`,
  `getLogResponseData`
  and `responseLogLevel`.

### Example

```js
const query = gql`query Hello { hello }`

// Each call will execute the same query and log 'Query Hello: Start'
// and set the request name to 'Query Hello'.
client.query(query)
client.query(query, {name: 'Hello'})
client.query({query})
client.query({query, name: 'Hello'})
```

#### Returns

(*object*): The response.

---
### `mutate(mutation, options)`

#### Arguments

1. `mutation` (*string* **required**): The GraphQL mutation.
2. `options` (*object*): Options to pass to [Apollo Client] mutate method.

Alternatively, if a single argument is provided as an object,
it is passed directly to the [Apollo Client] mutate method.

- Failing requests will be retried on certain errors.
- If the mutation is given an [operation name]
  or `name` is given as an option (in either case above),
  log messages will include the name
  and the name will be sent in the request name header.
- Pass the `meta` option to log additional properties to the `meta` key.
- Pass the `logProps` option to log additional properties at the top-level.
- The following options may be set per-request to override
  the defaults defined by the constructor:
  `retry`,
  `willLogOptions`,
  `willLogResponseProps`,
  `willLogResponseData`,
  `getLogResponseProps`,
  `getLogResponseData`
  and `responseLogLevel`.

### Example

```js
const mutation = gql`{ mutation Greeting { setGreeting(name: "Hola") } }`

// Each call will execute the same mutation and log 'Mutation Greeting: Start'
// and set the request name to 'Mutation Greeting'.
client.mutate(mutation)
client.mutate(mutation, {name: 'Greeting'})
client.mutate({mutation})
client.mutate({mutation, name: 'Greeting'})
```

#### Returns

(*object*): The response.

[Awilix]: https://github.com/jeffijoe/awilix
[Apollo Server]: https://www.apollographql.com/docs/apollo-server/api/apollo-server.html#ApolloServer
[Apollo Client]: https://www.apollographql.com/docs/react/
[Apollo Cache]: https://www.apollographql.com/docs/react/basics/caching.html
[Apollo InMemoryCache]: https://www.apollographql.com/docs/react/basics/caching.html
[Apollo HTTP Link]: https://www.apollographql.com/docs/link/links/http.html
[Apollo Link]: https://www.apollographql.com/docs/link/
[Remote schemas]: https://www.apollographql.com/docs/graphql-tools/remote-schemas.html
[makeRemoteExecutableSchema]: https://www.apollographql.com/docs/graphql-tools/remote-schemas.html#makeRemoteExecutableSchema
[async-retry]: https://github.com/zeit/async-retry#readme
[GraphQLClient]: #graphqlclient
[GraphQL Voyager]: https://github.com/APIs-guru/graphql-voyager
[GraphQL Playground]: https://github.com/prismagraphql/graphql-playground
[GraphiQL]: https://github.com/graphql/graphiql
[apollo-server]: https://www.apollographql.com/docs/apollo-server/
[koa-router]: https://github.com/alexmingoia/koa-router
[Logger]: https://github.com/meltwater/mlabs-logger
[URL origin]: https://nodejs.org/api/url.html#url_url_strings_and_url_objects
[examplr]: https://github.com/meltwater/node-examplr
[operation name]: http://graphql.org/learn/queries/#operation-name
[Prometheus Registry]: https://github.com/siimon/prom-client#multiple-registries
[Prometheus client]: https://github.com/siimon/prom-client
