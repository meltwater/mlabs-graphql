# API Reference

## Top-Level Exports

- [`koaGraphql(options)`](#koagraphqloptions)
- [`createClient(options)`](#createclientoptions)
- [`registerClient(container, client)`](#registerclientcontainer-client)
- [`registerClients(container, clients)`](#registerclientscontainer-clients)

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
    - `graphiqlRoot` (*string*): Path to serve GraphiQL endpoint.
      If `null`, the endpoint will be unavailable.
      Default: `/graphiql`.

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

Create a [GraphQL Client].
If a link or cache are not provided, they will be created.

#### Arguments

1. `options` (*object*):
   Any addtional options are passed directly to the [GraphQL Client].
    - `origin` (*string*): The GraphQL server [URL origin].
      Default: an empty string.
    - `path` (*string*): The GraphQL endpoint on the server.
      Default: `/graphql`.
    - `reqId` (*string*): Request id to send in header.
    - `cache` (*object): The [Apollo Cache] to use.
      Default: create a new [Apollo InMemoryCache].
    - `cacheOptions` (*object): Options passed directly to [Apollo InMemoryCache]
      if `cache` is not provided.
    - `link` (*object): The [Apollo Link] to use.
      Default: create a new [Apollo HTTP Link].
    - `linkOptions` (*object): Options passed directly to [Apollo HTTP Link]
      if `link` is not provided.
    - `apolloClientOptions` (*object): Options passed directly to [Apollo Client].

#### Returns

(*undefined*)

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

Register a [GraphQL Client] and its dependencies in the Awilix container.

The container must provide the dependencies `log` and `reqId`.

For example, registering a client named `gql`
will register the following dependencies:

- `gqlClientCache`: The [Apollo InMemoryCache] (singleton).
- `gqlClientHttpLink`: The [Apollo HTTP Link] (singleton).
- `gqlClientLink`: The [Apollo Link] (scoped).
  Combines the HTTP Link and request id header forwarding.
- `gqlClientApolloClient`: The [Apollo Client] (scoped).
  Uses `gqlClientCache` and `gqlClientLink`.
- `gqlClient`: The [GraphQL Client] (scoped).
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
    - `cacheOptions` (*object*): Options passed directly to [Apollo InMemoryCache].
    - `linkOptions` (*object*): Options passed directly to [Apollo HTTP Link].
    - `apolloClientOptions` (*object*): Options passed directly to [Apollo Client].
    - `clientOptions` (*object*): Options passed directly to [GraphQL Client].

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
### `registerClients(container, clients)`

Register each [GraphQL Client] and its dependencies in the Awilix container
using [`registerClient`](#registerclientcontainer-client).

#### Arguments

1. `container` (*object* **required**): The [Awilix] container.
2. `clients` (*object*):
    The clients to register.
    Each key will be used as the client `name`
    and the value will be passed as the second argument to
    [`registerClient`](#registerclientcontainer-client).

#### Returns

(*undefined*)

#### Example

```js
registerClients(container, {
  foo: {origin: 'https://example.com'}
})

const client = container.resolve('fooClient')
```

[Awilix]: https://github.com/jeffijoe/awilix
[Apollo Client]: https://www.apollographql.com/docs/react/
[Apollo Cache]: https://www.apollographql.com/docs/react/basics/caching.html
[Apollo InMemoryCache]: https://www.apollographql.com/docs/react/basics/caching.html
[Apollo HTTP Link]: https://www.apollographql.com/docs/link/links/http.html
[Apollo Link]: https://www.apollographql.com/docs/link/
[GraphQL Client]: https://github.com/meltwater/mlabs-graphql-client
[apollo-server]: https://www.apollographql.com/docs/apollo-server/
[koa-router]: https://github.com/alexmingoia/koa-router
[URL origin]: https://url.spec.whatwg.org/#origin
