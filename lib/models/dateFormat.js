import gql from 'graphql-tag'
import { fromUnix } from '@meltwater/tau'
import { DateFormatDirective } from '../directives'

export default {
  typeDefs: () => gql`directive @dateFormat on FIELD_DEFINITION`,
  directive: () => ({ dateFormat: DateFormatDirective }),
  directiveResolver: () => ({ date, format }) => fromUnix(date).toFormat(format)
}
