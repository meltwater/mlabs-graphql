import gql from 'graphql-tag'
import { AuthenticateDirective } from '../directives'
import { AuthenticationError } from 'apollo-server-koa/dist'

export default {
  directive: () => ({ authenticate: AuthenticateDirective }),
  typeDefs: () => gql`directive @authenticate on FIELD_DEFINITION`,
  directiveResolver: () => ({ req }) => {
    throw AuthenticationError('Default authenticate directive resolver thorws error')
  }
}
