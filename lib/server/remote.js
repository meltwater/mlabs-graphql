import {
  makeRemoteExecutableSchema,
  introspectSchema
} from 'graphql-tools'
import {
  compose,
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
  const uri = createUri(origin, path)
  const schemaLink = link || createHttpLink({ token, uri, ...linkOptions })
  const introspectionQueryResultData = await introspectSchema(schemaLink)
  const schema = makeRemoteExecutableSchema({
    ...schemaOptions,
    schema: introspectionQueryResultData,
    link: schemaLink
  })

  return {
    link,
    introspectionQueryResultData,
    schema
  }
}

export const fetchRemoteSchemas = async (schemas = {}) => {
  const schemasWithName = compose(
    values,
    mapObjIndexed((schema, name) => ({ ...schema, name }))
  )(schemas)

  const remoteSchemas = await Promise.all(
    map(fetchRemoteSchema, schemasWithName)
  )

  return zipObj(
    pluck('name', schemasWithName),
    remoteSchemas
  )
}
