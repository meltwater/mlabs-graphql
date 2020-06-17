import test from 'ava'
import { Registry } from 'prom-client'
import { createContainer, asValue, asClass } from 'awilix'

import { registerClient, registerClients } from './register'

test.beforeEach((t) => {
  t.context.log = { child: () => {} }
})

test('registers client', (t) => {
  const container = createContainer()

  container.register({
    registry: asClass(Registry),
    log: asValue(t.context.log),
    reqId: asValue(null)
  })

  registerClient(container, {
    name: 'foo'
  })

  const fooClient = container.resolve('fooClient')
  t.truthy(fooClient)
})

test('does not register client when missing container', (t) => {
  t.throws(registerClient, { message: /missing container/i })
})

test('registers clients', (t) => {
  const container = createContainer()

  container.register({
    registry: asClass(Registry),
    log: asValue(t.context.log),
    reqId: asValue(null)
  })

  registerClients(container, {
    foo: {},
    bar: {}
  })

  const fooClient = container.resolve('fooClient')
  const barClient = container.resolve('barClient')
  t.truthy(fooClient)
  t.truthy(barClient)
})
