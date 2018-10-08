import { print } from 'graphql'
import gql from 'graphql-tag'
import uuid from 'uuid'
import createLogger from '@meltwater/mlabs-logger'

export class GraphQLClient {
  constructor ({
    apolloClient,
    name = 'graphql',
    reqId = uuid(),
    reqIdHeader = 'x-request-id',
    reqNameHeader = 'x-request-name',
    responseLogLevel = 'debug',
    willLogResponseProps = true,
    willLogResponseData = false,
    getLogResponseProps = _getLogResponseProps,
    getLogResponseData = _getLogResponseData,
    log = createLogger()
  }) {
    this.log = log.child({ isGraphqlClient: true, name, reqId, serializers })
    this.apolloClient = apolloClient
    this.reqIdHeader = { [reqIdHeader]: reqId }
    this.reqNameHeader = n => ({ [reqNameHeader]: n })
    this.defaultOptions = {
      responseLogLevel,
      willLogResponseProps,
      willLogResponseData,
      getLogResponseProps,
      getLogResponseData
    }
  }

  async health () {
    try {
      this.log.info('Health: Start')
      const query = gql`{__schema {types {name}}}`
      await this.apolloClient.query({
        query,
        context: {
          headers: {
            ...this.reqIdHeader,
            ...this.reqNameHeader('Health')
          }
        }
      })
      return true
    } catch (err) {
      this.log.error({ err }, 'Health: Fail')
      throw err
    }
  }

  async query (req, options = {}) {
    return this._request('query', req, options)
  }

  async mutate (req, options = {}) {
    return this._request('mutate', req, options)
  }

  async _request (verb, req, options) {
    const noun = getNoun(verb)
    const { ast, meta, name, logOpts } = normalize(
      noun,
      req,
      options,
      this.defaultOptions
    )
    const log = createChildLogger(this.log, { ast, name, meta, ...logOpts })

    try {
      log.info(`${name}: Start`)
      const { headers = {} } = meta
      const data = await this.apolloClient[verb]({
        ...meta,
        [verb]: ast,
        context: {
          headers: {
            ...headers,
            ...this.reqIdHeader,
            ...this.reqNameHeader(name)
          }
        }
      })
      this._logResponse({ ...logOpts, name, data, log })
      return data
    } catch (err) {
      log.error({ err }, `${name}: Fail`)
      throw err
    }
  }

  _logResponse ({
    name,
    data,
    responseLogLevel,
    willLogResponseProps,
    willLogResponseData,
    getLogResponseProps,
    getLogResponseData,
    log
  }) {
    if (!log.isLevelEnabled(responseLogLevel)) return

    const logProps = willLogResponseProps
      ? makeSafe(getLogResponseProps)(data)
      : {}

    const props = willLogResponseData
      ? { ...logProps, data: makeSafe(getLogResponseData)(data) }
      : logProps

    log[responseLogLevel](props, `${name}: Success`)
  }
}

const getNoun = verb => ({
  'query': 'query',
  'mutate': 'mutation'
}[verb])

const makeSafe = f => (...args) => {
  try {
    return f(...args)
  } catch (err) {
    return {}
  }
}

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

const normalize = (type, req = {}, options = {}, defaultOptions = {}) => {
  const isSingleArg = Object.keys(req).includes(type)

  const ast = isSingleArg
    ? req[type]
    : req

  const allOptions = isSingleArg
    ? { ...req, ...options }
    : options

  const {
    responseLogLevel = defaultOptions.responseLogLevel,
    willLogResponseProps = defaultOptions.willLogResponseProps,
    willLogResponseData = defaultOptions.willLogResponseData,
    getLogResponseProps = data => defaultOptions.getLogResponseProps(data),
    getLogResponseData = data => defaultOptions.getLogResponseData(data),
    logProps,
    ...meta
  } = allOptions

  const logOpts = {
    responseLogLevel,
    willLogResponseProps,
    willLogResponseData,
    getLogResponseProps,
    getLogResponseData,
    logProps
  }

  const prefix = type.charAt(0).toUpperCase() + type.slice(1)
  const name = meta.name ? meta.name : getOperationName(ast)

  delete meta[type]
  delete meta.name

  return {
    ast,
    meta,
    logOpts,
    name: name ? `${prefix} ${name}` : prefix
  }
}

const createChildLogger = (log, {
  ast,
  name,
  meta = {},
  logProps = {}
}) => log.child({
  gql: ast,
  ...logProps,
  ...(Object.keys(meta).length === 0 ? {} : { meta }),
  reqName: name
})

const _getLogResponseProps = data => ({})
const _getLogResponseData = data => data
