import { print } from 'graphql'
import gql from 'graphql-tag'
import uuid from 'uuid'
import createLogger from '@meltwater/mlabs-logger'

const serializers = {
  gql: ast => {
    try {
      return print(ast)
    } catch (err) {
      return ast.toString()
    }
  },
  meta: m => Object.keys(m).length === 0 ? undefined : m
}

const getOperationName = ast => {
  try {
    return ast.definitions[0].name.value
  } catch (err) {
    return null
  }
}

const normalize = (type, req = {}, options = {}) => {
  const isSingleArg = Object.keys(req).includes(type)

  const ast = isSingleArg
    ? req[type]
    : req

  const meta = isSingleArg
    ? { ...req, ...options }
    : options

  const prefix = type.charAt(0).toUpperCase() + type.slice(1)
  const name = meta.name ? meta.name : getOperationName(ast)

  delete meta[type]
  delete meta.name

  return {
    ast,
    meta,
    name: name ? `${prefix} ${name}` : prefix
  }
}

const createChildLogger = (log, { ast, name, meta = {} }) => log.child({
  gql: ast,
  ...(Object.keys(meta).length === 0 ? {} : { meta }),
  reqName: name
})

export class GraphQLClient {
  constructor ({
    apolloClient,
    name = 'graphql',
    reqId = uuid(),
    reqIdHeader = 'x-request-id',
    reqNameHeader = 'x-request-name',
    log = createLogger()
  }) {
    this.log = log.child({ client: name, reqId, serializers })
    this.apolloClient = apolloClient
    this.reqIdHeader = { [reqIdHeader]: reqId }
    this.reqNameHeader = n => ({ [reqNameHeader]: n })
  }

  async health () {
    try {
      this.log.info('Health: Start')
      const query = gql`{__schema {types {name}}}`
      await this.apolloClient.query({
        query,
        context: {
          headers: { ...this.reqIdHeader, ...this.reqNameHeader('Health') }
        }
      })
      return true
    } catch (err) {
      this.log.error({ err }, 'Health: Fail')
      throw err
    }
  }

  async query (req, options = {}) {
    const { ast, meta, name } = normalize('query', req, options)
    const log = createChildLogger(this.log, { ast, name, meta })

    try {
      log.info(`${name}: Start`)
      const { headers = {} } = meta
      const data = await this.apolloClient.query({
        ...meta,
        query: ast,
        context: {
          headers: { ...headers, ...this.reqIdHeader, ...this.reqNameHeader(name) }
        }
      })
      log.debug({ data }, `${name}: Success`)
      return data
    } catch (err) {
      log.error({ err }, `${name}: Fail`)
      throw err
    }
  }

  async mutate (req, options = {}) {
    const { ast, meta, name } = normalize('mutation', req, options)
    const log = createChildLogger(this.log, { ast, name, meta })

    try {
      log.info(`${name}: Start`)
      const { headers = {} } = meta
      const data = await this.apolloClient.mutate({
        ...meta,
        mutation: ast,
        context: {
          headers: { ...headers, ...this.reqIdHeader, ...this.reqNameHeader(name) }
        }
      })
      log.debug({ data }, `${name}: Success`)
      return data
    } catch (err) {
      log.error({ err }, `${name}: Fail`)
      throw err
    }
  }
}
