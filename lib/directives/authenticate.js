import { SchemaDirectiveVisitor } from 'apollo-server-koa/dist'
import { defaultFieldResolver } from 'graphql'

export class AuthenticateDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition (field, details) {
    const { resolve = defaultFieldResolver } = field

    field.resolve = async (...args) => {
      const [, , ctx] = args
      const dep = 'AuthenticateDirectiveResolver'
      const authenticate = ctx.state.getDep(dep)
      await authenticate(ctx)
      return resolve.apply(this, args)
    }
  }
}

export default AuthenticateDirective
