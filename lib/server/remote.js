import {
  makeRemoteExecutableSchema,
  introspectSchema
} from 'graphql-tools'
import {
  entries
} from '@meltwater/phi'

import { createHttpLink, createUri } from '../client/factory'

const fetchRemoteSchema = async ({
  origin,
  path = '/graphql',
  token
} = {}) => {
  const uri = createUri(origin, path)
  const link = createHttpLink({ token, uri })
  const schema = await introspectSchema(link)
  return {
    link,
    schema: makeRemoteExecutableSchema({ schema, link })
  }
}
export const fetchRemoteSchemas = async (schemas) => {
  const remoteSchemas = {}
  for (const [name, v] of entries(schemas)) {
    remoteSchemas[name] = await fetchRemoteSchema({ ...v, name })
  }
  return remoteSchemas
}

export default fetchRemoteSchemas
