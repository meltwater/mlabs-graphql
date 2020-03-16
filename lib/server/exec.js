import { graphql } from 'graphql'
import createLogger from '@meltwater/mlabs-logger'
import { entries, isNilOrEmpty, isNotString } from '@meltwater/phi'

export default async ({
  schema,
  query,
  root,
  operationName,
  context = {},
  variables,
  throwGqlErrors = true,
  log = createLogger()
}) => {
  for (const [k, v] of entries({ schema, operationName, query })) {
    if (isNilOrEmpty(v)) throw new Error(`Missing argument ${k}`)
  }

  const l = log.child({ isGraphql: true, operationName })
  const name = `GraphQL ${operationName}`

  try {
    l.info(`${name}: Start`)

    if (isNotString(query)) {
      throw new Error(
        'Using the gql template literal tag for query is unsupported: use a plain string instead'
      )
    }

    const data = await graphql(
      schema,
      query,
      root,
      context,
      variables,
      operationName
    )
    if (throwGqlErrors) checkForErrors(data)
    l.debug({ data }, `${name}: Success`)
    return data
  } catch (err) {
    log.error({ err }, `${operationName}: Fail`)
    throw err
  }
}

const checkForErrors = ({ errors } = {}) => {
  if (isNilOrEmpty(errors)) return
  const err = new Error(`GraphQL Errors: ${errors.toString()}`)
  err.errors = errors
  throw err
}
