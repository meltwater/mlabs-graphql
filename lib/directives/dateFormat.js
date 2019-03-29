import { SchemaDirectiveVisitor } from 'apollo-server-koa/dist'
import { GraphQLString, defaultFieldResolver } from 'graphql'

export class DateFormatDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition (field, details) {
    const { resolve = defaultFieldResolver } = field

    field.args.push({
      name: 'format',
      type: GraphQLString
    })

    field.resolve = async (...args) => {
      const [, { format }, ctx] = args
      const dep = 'DateFormatDirectiveResolver'
      const formatDate = ctx.state.getDep(dep)
      const date = await resolve.apply(this, args)
      return format
        ? formatDate({ date, format })
        : date
    }
  }
}

export default DateFormatDirective
