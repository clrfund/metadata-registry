import { JSONValue, JSONValueKind } from "@graphprotocol/graph-ts";
import { NewPost as NewPostEvent } from "../generated/Poster/Poster";
import { Result } from "./Result";
import { json } from "./json";
import { MetadataEntry } from "../generated/schema";
import { buildMetadataId, getAction, getType } from "./utils";

function replacer(key: string, value: JSONValue): string | null {
  if (key == "type" || key == "action") {
    return null;
  }
  return json.stringify(value);
}

export class MetadataRegistrar {
  _event: NewPostEvent;

  constructor(event: NewPostEvent) {
    this._event = event;
  }

  parse(data: string): JSONValue[] | null {
    let parsed = json.try_fromString(data);
    if (parsed.isError) {
      return null;
    }

    if (parsed.value.kind !== JSONValueKind.OBJECT) {
      return null;
    }

    let obj = parsed.value.toObject();
    let content = obj.get("content");
    if (!content) {
      return null;
    }

    if (content.kind !== JSONValueKind.ARRAY) {
      return null;
    }

    return content.toArray();
  }

  process(data: JSONValue): Result {
    let type = getType(data);
    if (type == "permissions") {
      return this.setMetadataPermissions(data);
    } else if (type == "metadata") {
      let action = getAction(data);
      if (action == "create") {
        return this.registerMetadata(data);
      } else if (action == "update") {
        return this.updateMetadata(data);
      } else if (action == "delete") {
        return this.deleteMetadata(data);
      }
      return new Result("Invalid action");
    }

    return new Result("Invalid type");
  }

  registerMetadata(data: JSONValue): Result {
    let id = buildMetadataId(this._event);
    let entry = new MetadataEntry(id);
    entry.owner = this._event.transaction.from;

    entry.metadata = json.stringify(data, replacer);
    entry.createdAt = this._event.block.timestamp;

    entry.save();
    return new Result();
  }

  updateMetadata(data: JSONValue): Result {
    return new Result();
  }

  deleteMetadata(data: JSONValue): Result {
    return new Result();
  }

  setMetadataPermissions(data: JSONValue): Result {
    return new Result();
  }
}
