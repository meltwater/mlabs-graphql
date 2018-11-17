import test from 'ava'

import koaGraphql from './koa'

test('serves graphql endpoint', t => {
  const graphqlRoot = '/root'
  const router = koaGraphql({ graphqlRoot })
  t.is(router.url('graphql'), '/root')
})

test('serves graphiql endpoint', t => {
  const graphiqlRoot = '/root'
  const router = koaGraphql({ graphiqlRoot })
  t.is(router.url('graphiql'), '/root')
})

test('does not serve graphiql endpoint', t => {
  const graphiqlRoot = null
  const router = koaGraphql({ graphiqlRoot })
  const route = router.url('graphiql')
  t.regex(route.message, /No route found for name: graphiql/)
})
