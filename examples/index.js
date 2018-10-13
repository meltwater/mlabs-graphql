import path from 'path'

import createExamples from '@meltwater/examplr'

import client, { metrics, query } from './client'
import koa from './koa'

export const examples = {
  metrics,
  client,
  query,
  koa
}

const envVars = [
  'GRAPHQL_ORIGIN',
  'GRAPHQL_PATH',
  'LOG_LEVEL',
  'LOG_FILTER',
  'LOG_OUTPUT_MODE'
]

const defaultOptions = {
  graphqlOrigin: 'http://localhost:9000',
  graphqlPath: '/graphql'
}

if (require.main === module) {
  const { runExample } = createExamples({
    examples,
    envVars,
    defaultOptions
  })

  runExample({
    local: path.resolve(__dirname, 'local.json')
  })
}
