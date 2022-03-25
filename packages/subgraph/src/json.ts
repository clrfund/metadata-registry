import {
  JSONValue,
  JSONValueKind,
  Result,
  Wrapped,
  TypedMap,
  json as graphJSON,
} from '@graphprotocol/graph-ts'
import { StringSink } from 'as-string-sink'

function serializeString(data: string): string {
  // @ts-ignore: replaceAll does not exist
  return '"' + data.replaceAll('"', '\\"') + '"'
}

export namespace json {
  export function try_fromString(data: string): Result<JSONValue, boolean> {
    return graphJSON.try_fromString(data)
  }

  /**
   * try to merge an array of JSONValue objects
   * @param sources array of JSONValue to be merged
   * @returns result containing JSONValue on success, message on error
   */
  export function try_mergeObject(
    sources: Array<JSONValue>,
    filter: Set<string> = new Set<string>()
  ): Result<TypedMap<string, JSONValue>, string> {
    let result = new Result<TypedMap<string, JSONValue>, string>()
    if (sources.length === 0) {
      return result
    }

    let target = new TypedMap<string, JSONValue>()
    for (let i = 0; i < sources.length; i++) {
      if (sources[i].kind !== JSONValueKind.OBJECT) {
        result._error = new Wrapped(
          'Entry at index' + i.toString() + 'is not an object'
        )
        return result
      }

      let source = sources[i].toObject()
      for (let j = 0; j < source.entries.length; j++) {
        let entry = source.entries[j]
        if (!filter.has(entry.key)) {
          target.set(entry.key, entry.value)
        }
      }
    }

    if (target) {
      result._value = new Wrapped(target)
    }
    return result
  }

  export function stringifyTypedMap(data: TypedMap<string, JSONValue>): string {
    let buffer = new StringSink('{')

    for (let i = 0; i < data.entries.length; i++) {
      let entry = data.entries[i]
      if (i > 0) {
        buffer.write(',')
      }
      buffer.write(serializeString(entry.key))
      buffer.write(':')
      buffer.write(json.stringify(entry.value))
    }
    buffer.write('}')
    let result = buffer.toString()
    return result
  }

  export function stringify(
    data: JSONValue,
    replacer: ((k: string, v: JSONValue) => string | null) | null = null
  ): string {
    let result: string

    if (data.kind === JSONValueKind.OBJECT) {
      let obj = data.toObject()
      let buffer = new StringSink('{')
      let first = true
      for (let i = 0; i < obj.entries.length; i++) {
        let key = obj.entries[i].key
        let replacement: string | null
        if (replacer) {
          replacement = replacer(key, obj.entries[i].value)

          if (!replacement) {
            // skip this property
            continue
          }
        }

        if (first) {
          first = false
        } else {
          buffer.write(',')
        }

        buffer.write(serializeString(key))
        buffer.write(':')
        if (replacement) {
          buffer.write(replacement)
        } else {
          buffer.write(json.stringify(obj.entries[i].value))
        }
      }
      buffer.write('}')
      result = buffer.toString()
    } else if (data.kind === JSONValueKind.NUMBER) {
      result = data.toBigInt().toString()
    } else if (data.kind === JSONValueKind.BOOL) {
      result = data.toBool() ? 'true' : 'false'
    } else if (data.kind === JSONValueKind.STRING) {
      result = serializeString(data.toString())
    } else if (data.kind === JSONValueKind.ARRAY) {
      let arr = data.toArray()
      let buffer = new StringSink('[')
      for (let i = 0; i < arr.length; i++) {
        if (i > 0) {
          buffer.write(',')
        }
        buffer.write(json.stringify(arr[i]))
      }
      buffer.write(']')
      result = buffer.toString()
    } else {
      // data.kind === JSONValueKind.NULL
      result = 'null'
    }

    return result
  }
}
