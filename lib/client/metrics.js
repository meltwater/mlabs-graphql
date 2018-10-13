import {
  registerMetrics as registerHttpMetrics
} from '@meltwater/mlabs-http'

const defaultPrefix = 'graphql_client_'

export const registerMetrics = ({
  prefix = defaultPrefix,
  ...options
}) => registerHttpMetrics({
  prefix,
  ...options
})
