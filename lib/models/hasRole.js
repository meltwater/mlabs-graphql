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
    throw new AuthenticationError('Default hasRole will throw error')
  }
}
