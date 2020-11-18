# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## [7.0.0] / 2020-11-17

### Changed

- Update to mlabs-http v2.
- Update graphql to v15 and graphql-tools to v7.
- Update all dependencies.

### Removed

- (**Breaking**) GraphQL Voyager.

## [6.4.0] / 2020-03-17

### Added

- Better error logging.
- Export Apollo Server error constructors from apollo-server-core.

### Changed

- Set Apollo Server `debug` option to true.
    - Required to support better error logging.
- Skip error middleware when no errors.
- Use @koa-router over koa-router.
- Update to prom-client v12.

## [6.3.0] / 2019-06-28

### Changed

- Pass `createSchema` options to `makeExecutableSchema`.
- Pass `remoteResolvers` to mergeSchemas as `resolvers`

### Added

- `remoteResolvers` option to `createServer`.
- `gqlRemoteResolvers` to registered dependencies via `remoteResolvers`

## [6.2.0] / 2019-04-11

### Changed

- Open source under the Apache License, Version 2.0!

## [6.1.0] / 2019-04-08

### Added

- `execSchema` function.
- New `gqlExec` dependency wrapping `execSchema`.
- `health` function for `fetchRemoteSchema`.
- `useScopedServer` boolean (default true) added to `registerServer` options.

### Changed

- `gqlContext` registered dependency:
  - `gqlContext` is no longer registered in `apolloServerFromContainer`.
  - Registered as function, injected with a scoped container.
  - `gqlContext` is now a function which accepts Koa context.
  - Context state has convenience functions `getDep` and `getDeps`
    wrapping `container.resolve`.

## [6.0.0] / 2019-03-08

### Changed

- (**Breaking**) Apollo Server updated to version 2.
- (**Breaking**) `graphqlKoa` has new options and behavior.
  See docs for details.
- Better error handling and logging.

### Added

- `createServer`.
- `fetchRemoteSchema` and `fetchRemoteSchemas`.
- Server support for `mergeSchemas` via new options.
- Server support for subscriptions and uploads (no direct client support yet).
- New dependencies registered with `registerServer`:
  - `apolloServer`
  - `apolloServerStart`
  - `apolloServerStop`
  - `installApolloServerSubscriptionHandlers`
  - `gqlSchemas`

### Removed

- (**Breaking**) GraphiQL (use GraphQL Playground instead).
- (**Breaking**) `registerServer` no longer registers `gqlSchema`.

### Fixed

- Use `client` not `name` log property.

## [5.0.1] / 2018-12-17

### Changed

- Update to [makenew-node-lib] v5.3.0.

## [5.0.0] / 2018-11-29

### Changed

- (**Breaking**) Rename `schema` dependency to `gqlSchema`.

### Added

- `registerServer` function.
- Log errors on server.
- Pass additional options of `koaGraphql` to `graphqlKoa`.

## [4.0.0] / 2018-10-20

### Added

- (**Breaking**) Clients registered with `registerClient` or `registerClients`
  now require a `registry` dependency.
- Automatic retries with `retry` option.
- `healthQuery` option.
- Client metrics with `collectClientMetrics` and `metricPrefix`, and `metricRegistry` options.
- Client logging options:
  - `logProps`
  - `willLogOptions`
  - `willLogResponseProps`
  - `willLogResponseData`
  - `getLogResponseProps`
  - `getLogResponseData`
  - `responseLogLevel`

## [3.0.0] / 2018-10-04

### Added

- `GraphQLClient` (moved from mlabs-graphql-client).

### Changed

- (**Breaking**) Update to graphql version 14 and graphql-tools version 4.
- Import unfetch and use ponyfill.
- Update to [makenew-node-lib] v5.1.0.

## [2.0.3] / 2018-07-25

### Fixed

- Set default GraphQL Playground option
  `'request.credentials': 'same-origin'`
  to meet expected behavior.

## [2.0.2] / 2018-07-16

### Fixed

- Missing react peer dependencies.

## [2.0.1] / 2018-07-12

### Fixed

- Missing `Bearer` string in authorization header.

## [2.0.0] / 2018-05-30

### Added

- GraphQL playground endpoint.

### Changed

- (**Breaking**) Update graphql-tools to version 3.
- Update to [makenew-node-lib] v4.7.1.

## [1.1.0] / 2018-03-27

### Added

- Export `examples` to use in examplr.
- Serve [GraphQL Voyager].

### Changed

- Change default `fetchPolicy` to `no-cache`.
- Update all Apollo and GraphQL dependencies.
- Update to [mlabs-graphql-client] to v2.2.1.
- Update to [makenew-node-lib] v4.6.0.

## [1.0.1] / 2018-01-19

### Changed

- Update to [mlabs-graphql-client] to v2.2.0.
- Update to [makenew-node-lib] v4.1.12.

## 1.0.0 / 2018-01-15

- Initial release.

[GraphQL Voyager]: https://github.com/APIs-guru/graphql-voyager
[makenew-node-lib]: https://github.com/meltwater/makenew-node-lib
[mlabs-graphql-client]: https://github.com/meltwater/mlabs-graphql-client

[Unreleased]: https://github.com/meltwater/mlabs-graphql/compare/v7.0.0...HEAD
[7.0.0]: https://github.com/meltwater/mlabs-graphql/compare/v6.4.0...v7.0.0
[6.4.0]: https://github.com/meltwater/mlabs-graphql/compare/v6.3.0...v6.4.0
[6.3.0]: https://github.com/meltwater/mlabs-graphql/compare/v6.2.0...v6.3.0
[6.2.0]: https://github.com/meltwater/mlabs-graphql/compare/v6.1.0...v6.2.0
[6.1.0]: https://github.com/meltwater/mlabs-graphql/compare/v6.0.0...v6.1.0
[6.0.0]: https://github.com/meltwater/mlabs-graphql/compare/v5.0.1...v6.0.0
[5.0.1]: https://github.com/meltwater/mlabs-graphql/compare/v5.0.0...v5.0.1
[5.0.0]: https://github.com/meltwater/mlabs-graphql/compare/v4.0.0...v5.0.0
[4.0.0]: https://github.com/meltwater/mlabs-graphql/compare/v3.0.0...v4.0.0
[3.0.0]: https://github.com/meltwater/mlabs-graphql/compare/v2.0.3...v3.0.0
[2.0.3]: https://github.com/meltwater/mlabs-graphql/compare/v2.0.2...v2.0.3
[2.0.2]: https://github.com/meltwater/mlabs-graphql/compare/v2.0.1...v2.0.2
[2.0.1]: https://github.com/meltwater/mlabs-graphql/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/meltwater/mlabs-graphql/compare/v1.1.0...v2.0.0
[1.1.0]: https://github.com/meltwater/mlabs-graphql/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/meltwater/mlabs-graphql/compare/v1.0.0...v1.0.1
