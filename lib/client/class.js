import gql from 'graphql-tag'
import uuid from 'uuid'
import createLogger from '@meltwater/mlabs-logger'

import retryRequest from './retry'
import {
  getLogResponseProps as _getLogResponseProps,
  getLogResponseData as _getLogResponseData,
  createChildLogger,
  serializers,
  makeSafe
} from './logging'

export class GraphQLClient {
  constructor ({
    apolloClient,
    name = 'graphql',
    reqId = uuid(),
    reqIdHeader = 'x-request-id',
    reqNameHeader = 'x-request-name',
    retry = {},
    responseLogLevel = 'debug',
    willLogOptions = true,
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
      retry,
      responseLogLevel,
      willLogOptions,
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
    const { ast, reqOpts, name, logOpts, retry } = normalizeArgs(
      noun,
      req,
      options,
      this.defaultOptions
    )
    const log = createChildLogger(this.log, { ast, name, reqOpts, ...logOpts })

    try {
      log.info(`${name}: Start`)
      const { headers = {} } = reqOpts
      const args = {
        ...reqOpts,
        [noun]: ast,
        context: {
          headers: {
            ...headers,
            ...this.reqIdHeader,
            ...this.reqNameHeader(name)
          }
        }
      }
      const data = await retryRequest(
        () => this.apolloClient[verb](args),
        { name, log },
        retry
      )
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

const getOperationName = ast => {
  try {
    return ast.definitions[0].name.value
  } catch (err) {
    return null
  }
}

const normalizeArgs = (type, req = {}, options = {}, defaultOptions = {}) => {
  const isSingleArg = Object.keys(req).includes(type)

  const ast = isSingleArg
    ? req[type]
    : req

  const allOptions = isSingleArg
    ? { ...req, ...options }
    : options

  const { reqOpts, logOpts, retry } = getOptions(allOptions, defaultOptions)

  const prefix = type.charAt(0).toUpperCase() + type.slice(1)
  const name = reqOpts.name ? reqOpts.name : getOperationName(ast)

  delete reqOpts[type]
  delete reqOpts.name

  return {
    ast,
    reqOpts,
    logOpts,
    retry,
    name: name ? `${prefix} ${name}` : prefix
  }
}

const getOptions = (
  options,
  defaultOptions
) => {
  const {
    retry = defaultOptions.retry,
    responseLogLevel = defaultOptions.responseLogLevel,
    willLogOptions = defaultOptions.willLogOptions,
    willLogResponseProps = defaultOptions.willLogResponseProps,
    willLogResponseData = defaultOptions.willLogResponseData,
    getLogResponseProps = data => defaultOptions.getLogResponseProps(data),
    getLogResponseData = data => defaultOptions.getLogResponseData(data),
    logProps,
    meta,
    ...reqOpts
  } = options

  const logOpts = {
    responseLogLevel,
    willLogOptions,
    willLogResponseProps,
    willLogResponseData,
    getLogResponseProps,
    getLogResponseData,
    meta,
    logProps
  }

  return {
    reqOpts,
    retry,
    logOpts
  }
}
