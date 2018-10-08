# API Reference

## Top-Level Exports

- [`koaGraphql(options)`](#koagraphqloptions)
- [`createClient(options)`](#createclientoptions)
- [`registerClient(container, client)`](#registerclientcontainer-client)
- [`registerClients(container, clients)`](#registerclientscontainer-clients-defaults)
- [`examples`](#examples)
- [`GraphQLClient(options)`](#graphqlclientoptions)

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

[Koa router][koa-router] for [Apollo GraphQL server][apollo-server].

Supports singleton or scoped schema.
If `schema` is not provided, it will be resolved for each request with

```
ctx.state.container.resolve('schema')
```

#### Arguments

1. `options` (*object*):
    - `schema` (*object*): The GraphQL schema.
      Default: resolve a schema scoped to each request (see above).
    - `graphqlRoot` (*string*): Path to serve GraphQL endpoint.
      Default: `/graphql`.
    - `graphiqlRoot` (*string*): Path to serve [GraphiQL] endpoint.
      If `null`, the endpoint will be unavailable.
      Default: `/graphiql`.
    - `voyagerRoot` (*string*): Path to serve [GraphQL Voyager] endpoint.
      If `null`, the endpoint will be unavailable.
      Default: `/voyager`.
    - `playgroundRoot` (*string*): Path to serve [GraphQL Playground] endpoint.
      If `null`, the endpoint will be unavailable.
      Default: `/playground`.

#### Returns

(*object*): The [router][koa-router].

#### Example

```js
graphqlRouter = koaGraphql()
app.use(graphqlRouter.routes())
app.use(graphqlRouter.allowedMethods())
```

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

The container must provide the dependencies `log` and `reqId`.
The `reqId` will be sent in the `x-request-id` header.

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
1. `client` (*object*):
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

#### Example

```js
registerClients(container, {
  foo: {origin: 'https://example.com'},
  {token: 'auth-token'}
})

const client = container.resolve('fooClient')
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

## GraphQLClient

All methods are asynchronous (return a promise).

### Constructor

1. `options` (*object*):
    - `apolloClient` (*object* **required**):
      The [Apollo Client] instance to use for requests.
    - `name` (*string*): The client name (for logging).
      Default: graphql.
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

- If the query is given an [operation name]
  or `name` is given as an option (in either case above),
  log messages will include the name
  and the name will be sent in the request name header.
- Pass the `meta` option to log additional properties to the `meta` key.
- Pass the `logProps` option to log additional properties at the top-level.
- The following options may be set per-request to override
  the defaults defined by the constructor:
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
2. `options` (*object*): Options to pass to [ApolloC Client] mutate method.

Alternatively, if a single argument is provided as an object,
it is passed directly to the [Apollo Client] mutate method.

- If the mutation is given an [operation name]
  or `name` is given as an option (in either case above),
  log messages will include the name
  and the name will be sent in the request name header.
- Pass the `meta` option to log additional properties to the `meta` key.
- Pass the `logProps` option to log additional properties at the top-level.
- The following options may be set per-request to override
  the defaults defined by the constructor:
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
[Apollo Client]: https://www.apollographql.com/docs/react/
[Apollo Cache]: https://www.apollographql.com/docs/react/basics/caching.html
[Apollo InMemoryCache]: https://www.apollographql.com/docs/react/basics/caching.html
[Apollo HTTP Link]: https://www.apollographql.com/docs/link/links/http.html
[Apollo Link]: https://www.apollographql.com/docs/link/
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
