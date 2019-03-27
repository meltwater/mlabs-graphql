import gql from 'graphql-tag'
import { HasRoleDirective } from '../directives'
import { AuthenticationError } from 'apollo-server-koa/dist'

export default {
  directive: () => ({ hasRole: HasRoleDirective }),
  typeDefs: () => gql`
    directive @hasRole(role: Role = ADMIN) on FIELD_DEFINITION

    enum Role {
      ADMIN
      USER
    }`,
  directiveResolver: () => ({ req }, role) => {
    throw AuthenticationError('Default hasRole directive resolver thorws error')
  }
}
