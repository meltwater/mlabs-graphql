import test from 'ava'

import koaGraphql from './koa'

test('serves graphql endpoint', t => {
  const graphqlRoot = '/root'
  const router = koaGraphql({ graphqlRoot })
  t.is(router.url('graphql'), '/root')
})
