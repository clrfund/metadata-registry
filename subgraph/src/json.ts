import {
  JSONValue,
  JSONValueKind,
  Result,
  json as graphJson,
} from "@graphprotocol/graph-ts";
import { StringSink } from "as-string-sink";

function serializeString(data: string): string {
  // @ts-ignore: replaceAll does not exist
  return '"' + data.replaceAll('"', '\\"') + '"';
}

export namespace json {
  export function try_fromString(data: string): Result<JSONValue, boolean> {
    return graphJson.try_fromString(data);
  }

  export function stringify(
    data: JSONValue,
    replacer: ((k: string, v: JSONValue) => string | null) | null = null
  ): string {
    let result: string;

    if (data.kind === JSONValueKind.OBJECT) {
      let obj = data.toObject();
      let buffer = new StringSink("{");
      let first = true;
      for (let i = 0; i < obj.entries.length; i++) {
        let key = obj.entries[i].key;
        let replacement: string | null;
        if (replacer) {
          replacement = replacer(key, obj.entries[i].value);

          if (!replacement) {
            // skip this property
            continue;
          }
        }

        if (first) {
          first = false;
        } else {
          buffer.write(",");
        }

        buffer.write(serializeString(key));
        buffer.write(":");
        if (replacement) {
          buffer.write(replacement);
        } else {
          buffer.write(json.stringify(obj.entries[i].value));
        }
      }
      buffer.write("}");
      result = buffer.toString();
    } else if (data.kind === JSONValueKind.NUMBER) {
      result = data.toBigInt().toString();
    } else if (data.kind === JSONValueKind.BOOL) {
      result = data.toBool() ? "true" : "false";
    } else if (data.kind === JSONValueKind.STRING) {
      result = serializeString(data.toString());
    } else if (data.kind === JSONValueKind.ARRAY) {
      let arr = data.toArray();
      let buffer = new StringSink("[");
      for (let i = 0; i < arr.length; i++) {
        if (i > 0) {
          buffer.write(",");
        }
        buffer.write(json.stringify(arr[i]));
      }
      buffer.write("]");
      result = buffer.toString();
    } else {
      // data.kind === JSONValueKind.NULL
      result = "null";
    }

    return result;
  }
}
