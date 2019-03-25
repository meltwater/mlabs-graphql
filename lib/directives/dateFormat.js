import { fromUnix } from '@meltwater/tau'
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
      const date = await resolve.apply(this, args)
      const format = args[1].format
      return format
        ? fromUnix(date).toFormat(format)
        : date
    }
  }
}

export default DateFormatDirective
