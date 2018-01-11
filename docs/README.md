# API Reference

## Top-Level Exports

- [`koaGraphql(options)`](#koagraphqloptions)

### Importing

Every function described above is a top-level export.
You can import any of them like this:

```js
import { koaGraphql } from '@meltwater/mlabs-graphql'
```

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

[apollo-server]: https://www.apollographql.com/docs/apollo-server/
[koa-router]: https://github.com/alexmingoia/koa-router
