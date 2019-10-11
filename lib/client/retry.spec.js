import test from 'ava'
import createLogger from '@meltwater/mlabs-logger'

import retry, {
  willRetryError,
  getDelay
} from './retry'

const factor = 0
const retries = 10

test.beforeEach(t => {
  t.context.createF = (numFailures = 10, statusCode = 500, hasNetErr = true) => {
    let n = 1
    return async () => {
      if (n > numFailures) return true
      n++
      const err = new Error('Fail')
      err.networkError = null
      if (hasNetErr) err.networkError = { statusCode }
      throw err
    }
  }

  t.context.retryHeader = v => ({
    headers: {
      get: k => {
        if (k === 'retry-after') return v.toString()
      }
    }
  })

  t.context.ctx = { name: 'test', log: createLogger({ noop: true }) }
})

test('retry', async t => {
  const { ctx } = t.context
  const f = t.context.createF(10)
  const data = await retry(f, ctx, { factor, retries })
  t.true(data)
})

test('retry: no fail', async t => {
  const { ctx } = t.context
  const f = t.context.createF(0)
  const data = await retry(f, ctx, { factor, retries })
  t.true(data)
})

test('retry: fail', async t => {
  const { ctx } = t.context
  const f = t.context.createF(11)
  await t.throwsAsync(retry(f, ctx, { factor, retries }), 'Fail')
})

test('retry 0 times', async t => {
  const { ctx } = t.context
  const f = t.context.createF(0)
  const data = await retry(f, ctx, { factor, retries: 0 })
  t.true(data)
})

test('retry 0 times: fail', async t => {
  const { ctx } = t.context
  const f = t.context.createF(1)
  await t.throwsAsync(retry(f, ctx, { factor, retries: 0 }), 'Fail')
})

test('retry: valid code', async t => {
  const { ctx } = t.context
  const f = t.context.createF(1, 500)
  const data = await retry(f, ctx, { factor, retries })
  t.true(data)
})

test('retry: invalid code', async t => {
  const { ctx } = t.context
  const f = t.context.createF(1, 507)
  await t.throwsAsync(retry(f, ctx, { factor, retries: 0 }), 'Fail')
})

test.only('retry: no network error', async t => {
  const { ctx } = t.context
  const f = t.context.createF(1, 507, false)
  await t.throwsAsync(retry(f, ctx, { factor, retries: 0 }), 'Fail')
})

test('retry: delay', async t => {
  const { ctx } = t.context
  const start = new Date()
  const f = t.context.createF(1)
  const data = await retry(f, ctx, { factor, retries: 1 })
  const end = new Date()
  t.true(data)
  t.true(end - start >= 1000)
})

test('willRetryError', t => {
  t.false(willRetryError())
  t.true(willRetryError({ statusCode: 500 }))
  t.false(willRetryError({ statusCode: 505 }))
  t.true(willRetryError({ code: 'ETIMEDOUT' }))
  t.false(willRetryError({ code: 'NOTETIMEDOUT' }))
})

test('getDelay', t => {
  t.is(getDelay(undefined, { minTimeout: 0 }), 0)
  t.is(getDelay({}, { minTimeout: 20 }), 0)
  t.is(getDelay({ statusCode: 500 }, { minTimeout: 20000 }), 0)
  t.is(getDelay({ statusCode: 503 }, { minTimeout: 20000 }), 0)
})

test('getDelay: header in seconds', t => {
  const statusCode = 503
  const h = t.context.retryHeader
  t.is(getDelay({ statusCode, response: h(0) }, { minTimeout: 0 }), 0)
  t.is(getDelay({ statusCode, response: h(30) }, { minTimeout: 0 }), 30000)
  t.is(getDelay({ statusCode, response: h(30) }, { minTimeout: 50000 }), 0)
  t.is(getDelay({ statusCode, response: h(30) }, { minTimeout: 20000 }), 10000)
})

test('getDelay: header as date', t => {
  const h = t.context.retryHeader
  const statusCode = 503
  const date = new Date(Date.now() + 100000).toString()
  const delay = getDelay({
    statusCode,
    response: h(date.toString())
  },
  { minTimeout: 0 })
  t.log(date)
  t.true(delay > 80000)
})
