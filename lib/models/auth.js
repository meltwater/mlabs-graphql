import gql from 'graphql-tag'
import { AuthDirective } from '../directives'

export default {
  typeDefs: () => gql`
    directive @auth(role: Role = ADMIN) on OBJECT | FIELD_DEFINITION

    enum Role {
      ADMIN
      USER
    }`,
  directive: () => ({ auth: AuthDirective })
}
