import { DateTime } from '@meltwater/tau'
import { SchemaDirectiveVisitor } from 'apollo-server-koa'
import { GraphQLString, defaultFieldResolver } from 'graphql'

export class DateFormatDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition (field, details) {
    const { resolve = defaultFieldResolver } = field

    field.args.push({
      name: 'format',
      type: GraphQLString
    })

    field.resolve = async function (...args) {
      const date = await resolve.apply(this, args)
      return format
        ? DateTime.fromISO(date).toFormat(format)
        : date
    }
  }
}

export default DateFormatDirective
