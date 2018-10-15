import {
  collectMetrics as collectHttpMetrics
} from '@meltwater/mlabs-http'

export {
  metricsHandleStart as handleStart,
  metricsHandleDone as handleDone,
  metricsHandleFail as handleFail,
  metricsHandleSuccess as handleSuccess
} from '@meltwater/mlabs-http'

export const defaultPrefix = 'graphql_client_'

export const collectMetrics = ({
  prefix = defaultPrefix,
  ...options
}) => collectHttpMetrics({
  prefix,
  ...options
})

export const addTimings = (startTime, obj = {}) => {
  const endTime = new Date()
  const timings = {
    phases: {
      total: endTime - startTime
    }
  }
  obj.timings = timings
}
