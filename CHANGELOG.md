# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/)
and this project adheres to [Semantic Versioning](https://semver.org/).

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

[Unreleased]: https://github.com/meltwater/mlabs-graphql/compare/v2.0.3...HEAD
[2.0.3]: https://github.com/meltwater/mlabs-graphql/compare/v2.0.2...v2.0.3
[2.0.2]: https://github.com/meltwater/mlabs-graphql/compare/v2.0.1...v2.0.2
[2.0.1]: https://github.com/meltwater/mlabs-graphql/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/meltwater/mlabs-graphql/compare/v1.1.0...v2.0.0
[1.1.0]: https://github.com/meltwater/mlabs-graphql/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/meltwater/mlabs-graphql/compare/v1.0.0...v1.0.1
