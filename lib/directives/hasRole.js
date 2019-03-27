import { SchemaDirectiveVisitor } from 'apollo-server-koa/dist'
import { defaultFieldResolver } from 'graphql'

export class HasRoleDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition (field, details) {
    const { resolve = defaultFieldResolver } = field
    const { role } = this.args

    field.resolve = async (...args) => {
      const [, , ctx] = args
      const dep = 'HasRoleDirectiveResolver'
      const isAuthorized = ctx.getDep(dep)
      await isAuthorized(ctx, role)
      return resolve.apply(this, args)
    }
  }
}

export default HasRoleDirective
