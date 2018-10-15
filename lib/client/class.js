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

export class GraphQLClient {
  constructor ({
    apolloClient,
    metrics = null,
    metricsPrefix = metricsDefaultPrefix,
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
    this.metrics = metrics
    this.metricsPrefix = metricsPrefix
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
    this._createEvents()
  }

  getEmitter () {
    return this.emitter
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
      log.error({ err }, `${name}: Fail`)
      throw err
    }
  }

  _createEvents () {
    const emitter = new EventEmitter()
    this.emitter = emitter
    this._subscribeMetrics()
  }

  _subscribeMetrics () {
    if (this.metrics === null) return

    const args = {
      prefix: this.metricsPrefix,
      name: this.clientName,
      register: this.metrics
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
