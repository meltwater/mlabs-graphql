import {
  AuthenticationError,
  SchemaDirectiveVisitor
} from 'apollo-server-koa'
import { defaultFieldResolver } from 'graphql'

export class AuthDirective extends SchemaDirectiveVisitor {
  visitObject (type) {}

  visitFieldDefinition (field, details) {
    const { resolve = defaultFieldResolver } = field
    const { role } = this.args

    field.resolve = async function (...args) {
      const [, , ctx] = args

      if (ctx.req && ctx.req.user) {
        if (role && (!ctx.req.user.role || !ctx.req.user.role.includes(role))) {
          throw new AuthenticationError(
            'You are not authorized to view this resource.'
          )
        } else {
          const result = await resolve.apply(this, args)
          return result
        }
      } else {
        throw new AuthenticationError(
          'You must be signed in to view this resource.'
        )
      }
    }
  }
}

export default AuthDirective
