import asyncRetry from 'async-retry'
import {
  compose,
  defaultTo,
  flip,
  isFunction,
  isInteger,
  isNil,
  max,
  path,
  sleeP,
  subtract
} from '@meltwater/phi'

const retryErrorCodes = new Set([
  'ETIMEDOUT',
  'ECONNRESET',
  'EADDRINUSE',
  'ECONNREFUSED',
  'EPIPE',
  'ENOTFOUND',
  'ENETUNREACH',
  'EAI_AGAIN'
])

const retryStatusCodes = new Set([408, 413, 429, 500, 502, 503, 504])

const defaultOptions = {
  minTimeout: 1000
}

const retryHeader = 'retry-after'

const parseRetryHeader = (str) => {
  const sec = parseInt(str)
  if (isInteger(sec)) return 1000 * sec
  return Date.parse(str) - new Date()
}

const getMinRetry = ({ statusCode, response = {} } = {}) => {
  if (statusCode !== 503) return
  if (isNil(path(['headers', 'get'], response))) return
  const retryAfter = response.headers.get(retryHeader)
  return parseRetryHeader(retryAfter)
}

export const getDelay = (err = {}, { minTimeout } = {}) =>
  compose(max(0), flip(subtract)(minTimeout), defaultTo(0), getMinRetry)(err)

export const willRetryError = ({ statusCode, code } = {}) => {
  if (retryStatusCodes.has(statusCode)) return true
  if (retryErrorCodes.has(code)) return true
  return false
}

const createOnRetry = ({ onRetry, log, name }) => (err) => {
  log.warn({ err, isRetry: true }, `${name}: Retried`)
  if (isFunction(onRetry)) onRetry(err)
}

const getRetryOptions = ({ name, log, retry = defaultOptions }) => {
  const onRetry = createOnRetry({
    name,
    log,
    ...(isInteger(retry) ? {} : { onRetry: retry.onRetry })
  })

  const options = isInteger(retry)
    ? { ...defaultOptions, retries: retry, onRetry }
    : { ...defaultOptions, ...retry, onRetry }

  return options
}

const throwForRetry = async (err, options) => {
  const { networkError } = err
  if (isNil(networkError)) return
  if (willRetryError(networkError)) {
    const delay = getDelay(networkError, options)
    await sleeP(delay)
    throw err
  }
}

export default (fn, { name, log }, retry = defaultOptions) => {
  const options = getRetryOptions({ name, log, retry })
  return asyncRetry(async (bail) => {
    try {
      return await fn()
    } catch (err) {
      await throwForRetry(err, options)
      bail(err)
    }
  }, options)
}
