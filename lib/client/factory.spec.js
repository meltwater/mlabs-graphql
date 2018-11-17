import test from 'ava'

import createClient from './factory'

test.beforeEach(t => {
  t.context.log = { child: () => {} }
})

test('creates client', t => {
  const client = createClient()
  t.truthy(client)
})
