# GraphQL

[![npm](https://img.shields.io/badge/npm-%40meltwater%2Fmlabs--graphql-blue.svg)](https://www.npmjs.com/package/@meltwater/mlabs-graphql)
[![github](https://img.shields.io/badge/github-repo-blue.svg)](https://github.com/meltwater/mlabs-graphql)
[![docs](https://img.shields.io/badge/docs-master-green.svg)](https://github.com/meltwater/mlabs-graphql/tree/master/docs)
[![Codecov](https://img.shields.io/codecov/c/token/Hg1simkqTV/github/meltwater/mlabs-graphql.svg)](https://codecov.io/gh/meltwater/mlabs-graphql)
[![CircleCI](https://circleci.com/gh/meltwater/mlabs-graphql.svg?style=shield&circle-token=21c42825f9c2e2986d5f62ef0acf532e25ce2647)](https://circleci.com/gh/meltwater/mlabs-graphql)

## Description

GraphQL client and server toolkit.
The goal of this package is to consolidate core GraphQL modules in a single module
to ensure version compatibility and maximize code reuse.

- Register [GraphQL clients][GraphQL Client].
  in the Awilix dependency tree with automatic creation of sub-dependencies.
- Create a Koa router for the GraphQL [Apollo Server]
  with a static or request-scoped schema.
  Includes [GraphiQL] and [GraphQL Voyager].
- Import all [GraphQL.js] and [GraphQL-tools] modules from this module.
- Conveniently import `gql`, the [graphql-tag], as the default import
  from this module.

[GraphQL.js]: http://graphql.org/graphql-js/
[GraphQL-tools]: https://www.apollographql.com/docs/graphql-tools/
[GraphQL Voyager]: https://github.com/APIs-guru/graphql-voyager
[GraphiQL]: https://github.com/graphql/graphiql
[graphql-tag]: https://github.com/apollographql/graphql-tag
[Apollo Server]: https://www.apollographql.com/docs/apollo-server/
[GraphQL Client]: https://github.com/meltwater/mlabs-graphql-client

## Installation

Add this as a dependency to your project using [npm] with

```
$ npm install @meltwater/mlabs-graphql
```

or using [Yarn] with

```
$ yarn add @meltwater/mlabs-graphql
```

[npm]: https://www.npmjs.com/
[Yarn]: https://yarnpkg.com/

## Usage

**See the complete [API documentation](./docs) and [working examples](./examples).**

### GraphQL Modules

#### graphql-tag

Import [graphql-tag] by default with

```js
// import gql from 'graphql-tag' // instead of this use line below
import gql from '@meltwater/mlabs-graphql'
```

#### GraphQL.js

All [GraphQL.js] modules are reexported, e.g.,

```js
// import { graphql, buildSchema } from 'graphql' // instead of this use line below
import { graphql, buildSchema } from '@meltwater/mlabs-graphql'
```

#### GraphQL-tools

All [GraphQL-tools] modules are reexported, e.g.,

```js
// import { makeExecutableSchema } from 'graphql-tools' // instead of this use line below
import { makeExecutableSchema } from '@meltwater/mlabs-graphql'
```

### GraphQL Client

#### Manual Instantiation

Create a [GraphQL Client] and run a query with

```js
import createLogger from '@meltwater/mlabs-logger'
import { createClient } from '@meltwater/mlabs-graphql'

const client = createClient({
  origin: 'https://example.com',
  path: '/graphql',
  log: createLogger()
})

const logQuery = async () => {
  const { data } = await client.query(gql`{
    __schema {
      types {
        name
      }
    }
  }`)
  console.log(data)
}

logQuery().catch(err => { console.log(err) })
```

#### Dependency Injection

Register each [GraphQL Client] and its dependencies in an Awilix container

```js
import { createContainer, asValue } from 'awilix'
import createLogger from '@meltwater/mlabs-logger'
import { registerClients } from '@meltwater/mlabs-graphql'

const container = createContainer()

container.register({
  log: asValue(createLogger()),
  reqId: asValue(null)
})

registerClients(container, {
  foo: {origin: 'https://example.com'},
  bar: {origin: 'https://bar.example.com'}
})

const fooClient = container.resolve('fooClient')
const barClient = container.resolve('barClient')
```

### GraphQL Server

#### Koa

Create and run a Koa GraphQL [Apollo Server] with

```js
import Koa from 'koa'
import { koaGraphql } from '@meltwater/mlabs-graphql'

import schema from './schema'

const app = new Koa()
const graphqlRouter = koaGraphql({schema})
app.use(graphqlRouter.routes())
app.use(graphqlRouter.allowedMethods())
app.listen()
```

## Development Quickstart

```
$ git clone https://github.com/meltwater/mlabs-graphql.git
$ cd mlabs-graphql
$ nvm install
$ yarn
```

Run each command below in a separate terminal window:

```
$ yarn run watch
$ yarn run test:watch
```

## Development and Testing

### Source code

The [mlabs-graphql source] is hosted on GitHub.
Clone the project with

```
$ git clone git@github.com:meltwater/mlabs-graphql.git
```

[mlabs-graphql source]: https://github.com/meltwater/mlabs-graphql

### Requirements

You will need [Node.js] with [npm], [Yarn],
and a [Node.js debugging] client.

Be sure that all commands run under the correct Node version, e.g.,
if using [nvm], install the correct version with

```
$ nvm install
```

Set the active version for each shell session with

```
$ nvm use
```

Install the development dependencies with

```
$ yarn
```

[Node.js]: https://nodejs.org/
[Node.js debugging]: https://nodejs.org/en/docs/guides/debugging-getting-started/
[npm]: https://www.npmjs.com/
[nvm]: https://github.com/creationix/nvm

#### CircleCI

_CircleCI should already be configured: this section is for reference only._

The following environment variables must be set on [CircleCI]:

- `NPM_TOKEN`: npm token for installing and publishing packages.
- `NPM_TEAM`: npm team to grant read-only package access
  (format `org:team`, optional).
- `CODECOV_TOKEN`: Codecov token for uploading coverage reports (optional).

These may be set manually or by running the script `./circleci/envvars.sh`.

[CircleCI]: https://circleci.com/

### Development tasks

Primary development tasks are defined under `scripts` in `package.json`
and available via `yarn run`.
View them with

```
$ yarn run
```

#### Production build

Lint, test, and transpile the production build to `dist` with

```
$ yarn run dist
```

##### Publishing a new release

Release a new version using [`npm version`][npm version].
This will run all tests, update the version number,
create and push a tagged commit,
and trigger CircleCI to publish the new version to npm.

- **Update the CHANGELOG before each new release after version 1.**
- New versions are released when the commit message is a valid version number.
- Versions are only published on release branches:
  `master` branch or any branch matching `ver/*`.
- If branch protection options are enabled,
  you must first run `npm version` on a separate branch,
  wait for the commit to pass any required checks,
  then merge and push the changes to a release branch.
- **Do not use the GitHub pull request button to merge version commits**
  as the commit tagged with the new version number will not match after merging.

[npm version]: https://docs.npmjs.com/cli/version

#### Examples

**See the [full documentation on using examples](./examples).**

View all examples with

```
$ yarn run example
```

#### Linting

Linting against the [JavaScript Standard Style] and [JSON Lint]
is handled by [gulp].

View available commands with

```
$ yarn run gulp --tasks
```

Run all linters with

```
$ yarn run lint
```

In a separate window, use gulp to watch for changes
and lint JavaScript and JSON files with

```
$ yarn run watch
```

Automatically fix most JavaScript formatting errors with

```
$ yarn run format
```

[gulp]: https://gulpjs.com/
[JavaScript Standard Style]: https://standardjs.com/
[JSON Lint]: https://github.com/zaach/jsonlint

#### Tests

Unit and integration testing is handled by [AVA]
and coverage is reported by [Istanbul] and uploaded to [Codecov].

- Test files end in `.spec.js`.
- Unit tests are placed under `lib` alongside the tested module.
- Integration tests are placed in `test`.
- Static files used in tests are placed in `fixtures`.

Watch and run tests on changes with

```
$ yarn run test:watch
```

If using [AVA snapshot testing], update snapshots with

```
$ yarn run test:update
```

Generate a coverage report with

```
$ yarn run report
```

An HTML version will be saved in `coverage`.

##### Debugging tests

Create a breakpoint by adding the statement `debugger` to the test
and start a debug session with, e.g.,

```
$ yarn run test:inspect lib/client.spec.js
```

Watch and restart the debugging session on changes with

```
$ yarn run test:inspect:watch lib/client.spec.js
```

[AVA]: https://github.com/avajs/ava
[AVA snapshot testing]: https://github.com/avajs/ava#snapshot-testing
[Codecov]: https://codecov.io/
[Istanbul]: https://istanbul.js.org/

## Contributing

The author and active contributors may be found in `package.json`,

```
$ jq .author < package.json
$ jq .contributors < package.json
```

To submit a patch:

1. Request repository access by submitting a new issue.
2. Create your feature branch (`git checkout -b my-new-feature`).
3. Make changes and write tests.
4. Commit your changes (`git commit -am 'Add some feature'`).
5. Push to the branch (`git push origin my-new-feature`).
6. Create a new Pull Request.

## License

This npm package is Copyright (c) 2016-2018 Meltwater Group.

## Warranty

This software is provided by the copyright holders and contributors "as is" and
any express or implied warranties, including, but not limited to, the implied
warranties of merchantability and fitness for a particular purpose are
disclaimed. In no event shall the copyright holder or contributors be liable for
any direct, indirect, incidental, special, exemplary, or consequential damages
(including, but not limited to, procurement of substitute goods or services;
loss of use, data, or profits; or business interruption) however caused and on
any theory of liability, whether in contract, strict liability, or tort
(including negligence or otherwise) arising in any way out of the use of this
software, even if advised of the possibility of such damage.
