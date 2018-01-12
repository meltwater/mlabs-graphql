import test from 'ava'
import { createContainer, asValue } from 'awilix'

import createClient, { createRegisterClient, registerClients } from './client'

test.beforeEach(t => {
  t.context.log = {child: () => {}}
})

test('creates client', t => {
  const client = createClient()
  t.truthy(client)
})

test('registers client', t => {
  const container = createContainer()

  container.register({
    log: asValue(t.context.log),
    reqId: asValue(null)
  })

  createRegisterClient(container)({
    name: 'foo'
  })

  const fooClient = container.resolve('fooClient')
  t.truthy(fooClient)
})

test('registers clients', t => {
  const container = createContainer()

  container.register({
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
