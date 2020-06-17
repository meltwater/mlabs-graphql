import { print } from 'graphql'

export const createChildLogger = (
  log,
  {
    ast,
    name,
    operationName,
    verb,
    willLogOptions,
    meta = {},
    reqOpts = {},
    logProps = {}
  }
) => {
  const allMeta = willLogOptions ? { ...reqOpts, ...meta } : meta

  return log.child({
    gql: ast,
    ...logProps,
    ...(Object.keys(allMeta).length === 0 ? {} : { meta: allMeta }),
    method: verb.toLowerCase(),
    resourceName: operationName,
    reqName: name
  })
}

export const makeSafe = (f) => (...args) => {
  try {
    return f(...args)
  } catch (err) {
    return {}
  }
}

export const serializers = {
  gql: (ast) => {
    try {
      return print(ast)
    } catch (err) {
      return ast.toString()
    }
  },
  meta: (m) => (Object.keys(m).length === 0 ? undefined : m)
}

export const getLogResponseProps = (data) => ({})
export const getLogResponseData = (data) => data
