import EventEmitter from 'events'

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
import {
  addTimings,
  defaultPrefix as metricsDefaultPrefix,
  handleStart as metricsHandleStart,
  handleDone as metricsHandleDone,
  handleFail as metricsHandleFail,
  handleSuccess as metricsHandleSuccess
} from './metrics'

const defaultHealthQuery = gql`{__schema {types {name}}}`

export class GraphQLClient {
  constructor ({
    apolloClient,
    metricRegistry = null,
    metricPrefix = metricsDefaultPrefix,
    name = 'graphql',
    healthQuery = defaultHealthQuery,
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
    this.clientName = name
    this.metricRegistry = metricRegistry
    this.metricPrefix = metricPrefix
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
    this.healthQuery = healthQuery
    this._createEvents()
  }

  getEmitter () {
    return this.emitter
  }

  async health () {
    const query = this.healthQuery
    await this.query(query, { name: 'Health' })
    return true
  }

  async query (req, options = {}) {
    return this._request('query', req, options)
  }

  async mutate (req, options = {}) {
    return this._request('mutate', req, options)
  }

  async _request (verb, req, options) {
    const noun = getNoun(verb)
    const { ast, reqOpts, name, operationName, logOpts, retry } = normalizeArgs(
      noun,
      req,
      options,
      this.defaultOptions
    )
    const eventProps = { resourceName: operationName, method: verb }
    const log = createChildLogger(this.log, { ast, reqOpts, name, verb, operationName, ...logOpts })
    const startTime = new Date()

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

      this.emitter.emit('start', eventProps)
      const data = await retryRequest(
        () => this.apolloClient[verb](args),
        { name, log },
        retry
      )
      addTimings(startTime, data)
      this.emitter.emit('success', { data, ...eventProps })
      this.emitter.emit('done', { data, ...eventProps })
      this._logResponse({ ...logOpts, name, data, log })
      return data
    } catch (err) {
      addTimings(startTime, err)
      this.emitter.emit('fail', { err, ...eventProps })
      this.emitter.emit('done', { err, ...eventProps })
      log.error({
        err,
        ...(err.networkError ? { statusCode: err.networkError.statusCode } : {})
      }, `${name}: Fail`)
      throw err
    }
  }

  _createEvents () {
    const emitter = new EventEmitter()
    this.emitter = emitter
    this._subscribeMetrics()
  }

  _subscribeMetrics () {
    if (this.metricRegistry === null) return

    const args = {
      prefix: this.metricPrefix,
      name: this.clientName,
      register: this.metricRegistry
    }

    const emitter = this.emitter
    emitter.on('start', x => metricsHandleStart({ ...x, ...args }))
    emitter.on('fail', x => metricsHandleFail({ ...x, ...args }))
    emitter.on('success', x => metricsHandleSuccess({ ...x, ...args }))
    emitter.on('done', x => metricsHandleDone({ ...x, ...args }))
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

    const allLogProps = { ...logProps, statusCode: 200 }

    const props = willLogResponseData
      ? { ...allLogProps, data: makeSafe(getLogResponseData)(data) }
      : allLogProps

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
  const operationName = reqOpts.name ? reqOpts.name : getOperationName(ast)

  delete reqOpts[type]
  delete reqOpts.name

  return {
    ast,
    reqOpts,
    logOpts,
    retry,
    operationName,
    name: operationName ? `${prefix} ${operationName}` : prefix
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
