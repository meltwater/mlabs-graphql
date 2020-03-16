import { printSchema } from 'graphql'
import { makeRemoteExecutableSchema, introspectSchema } from 'graphql-tools'
import {
  apply,
  compose,
  equals,
  map,
  mapObjIndexed,
  pluck,
  values,
  zipObj
} from '@meltwater/phi'

import { createHttpLink, createUri } from '../client/factory'

export const fetchRemoteSchema = async ({
  origin,
  path = '/graphql',
  token,
  link,
  linkOptions = {},
  schemaOptions = {}
} = {}) => {
  if (!origin) throw new Error('GraphQL origin required for remote schema')
  const uri = createUri(origin, path)
  const schemaLink = link || createHttpLink({ token, uri, ...linkOptions })
  const introspectionQueryResultData = await introspectSchema(schemaLink)
  const schema = makeRemoteExecutableSchema({
    ...schemaOptions,
    schema: introspectionQueryResultData,
    link: schemaLink
  })

  return {
    health: createHealth({
      link: schemaLink,
      schema: introspectionQueryResultData
    }),
    link: schemaLink,
    introspectionQueryResultData,
    schema
  }
}

export const fetchRemoteSchemas = async (schemas = {}, options = {}) => {
  const fullSchemas = compose(
    values,
    mapObjIndexed((schema, name) => ({ ...options, ...schema, name }))
  )(schemas)

  const remoteSchemas = await Promise.all(map(fetchRemoteSchema, fullSchemas))

  return zipObj(pluck('name', fullSchemas), remoteSchemas)
}

const createHealth = ({ link, schema }) => async () => {
  const data = await introspectSchema(link)
  if (apply(equals)(map(printSchema, [schema, data]))) return true
  throw new Error('Remote schema changed')
}
