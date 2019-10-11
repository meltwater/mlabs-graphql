import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

import gql from 'graphql-tag'
import { identity, partialRight, pathOr } from '@meltwater/phi'

import { createClient } from './client'

const readFileAsync = promisify(fs.readFile)

const loadFromFile = (base, type, name, ext) => {
  const file = path.resolve(base, type, `${name}.${ext}`)
  return readFileAsync(file)
}

const loadGql = async (base, type, name) => {
  const data = await loadFromFile(base, type, name, 'graphql')
  return gql(data.toString())
}

const loadVariables = async (base, type, name, vars, mapVars = x => x) => {
  if (!vars) return null
  try {
    const data = await loadFromFile(base, type, `${name}.${vars}`, 'json')
    return mapVars(JSON.parse(data))
  } catch (err) {
    if (vars === 'default') return null
    throw err
  }
}

const loadRequest = type => (base, name, vars, mapVars) => Promise.all([
  loadGql(base, type, name),
  loadVariables(base, type, name, vars, mapVars)
])

const loadQuery = loadRequest('queries')
const loadMutation = loadRequest('mutations')
const defaultNames = { query: 'query', mutation: 'mutation' }

const getTransform = (transforms, type, name, vars, ...args) => partialRight(
  pathOr(identity, [type, name], transforms),
  [name, vars, ...args]
)

export const query = ({
  graphqlOrigin,
  graphqlPath,
  dataRoot,
  graphqlVarTransforms = {},
  graphqlClientOptions = {},
  graphqlDefaultNames = {},
  log
}) => async (
  name = { ...defaultNames, ...graphqlDefaultNames }.query,
  vars = 'default',
  ...args
) => {
  const mapVars = getTransform(graphqlVarTransforms, 'queries', name, vars, ...args)
  const client = createClient({
    origin: graphqlOrigin,
    path: graphqlPath,
    log,
    ...graphqlClientOptions
  })
  const [query, variables] = await loadQuery(dataRoot, name, vars, mapVars)
  const { data } = await client.query({ query, variables })
  return data
}

export const mutate = ({
  graphqlOrigin,
  graphqlPath,
  dataRoot,
  graphqlVarTransforms = {},
  graphqlClientOptions = {},
  graphqlDefaultNames = {},
  log
}) => async (
  name = { ...defaultNames, ...graphqlDefaultNames }.mutation,
  vars = 'default',
  ...args
) => {
  const client = createClient({
    origin: graphqlOrigin,
    path: graphqlPath,
    log,
    ...graphqlClientOptions
  })
  const mapVars = getTransform(graphqlVarTransforms, 'mutations', name, vars, ...args)
  const [mutation, variables] = await loadMutation(dataRoot, name, vars, mapVars)
  const { data } = await client.mutate({ mutation, variables })
  return data
}

export default {
  query,
  mutate
}
