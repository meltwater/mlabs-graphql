import gql from 'graphql-tag'
import { DateFormatDirective } from '../directives'

export default {
  typeDefs: () => gql`directive @dateFormat on FIELD_DEFINITION`,
  directive: () => ({ dateFormat: DateFormatDirective })
}
