import asyncRetry from 'async-retry'
import {
  compose,
  defaultTo,
  flip,
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

const retryStatusCodes = new Set([
  408,
  413,
  429,
  500,
  502,
  503,
  504
])

const defaultOptions = {
  minTimeout: 1000
}

const retryHeader = 'retry-after'

const parseRetryHeader = str => {
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

export const getDelay = (err = {}, { minTimeout } = {}) => compose(
  max(0),
  flip(subtract)(minTimeout),
  defaultTo(0),
  getMinRetry
)(err)

export const willRetryError = ({ statusCode, code } = {}) => {
  if (retryStatusCodes.has(statusCode)) return true
  if (retryErrorCodes.has(code)) return true
  return false
}

export default (fn, options = defaultOptions) => {
  return asyncRetry(async bail => {
    try {
      return await fn()
    } catch (err) {
      const error = err.networkError
      if (willRetryError(error)) {
        const delay = getDelay(error, options)
        await sleeP(delay)
        throw err
      }
      bail(err)
    }
  }, options)
}
