import { dataSource, JSONValue, JSONValueKind } from '@graphprotocol/graph-ts'
import { NewPost as NewPostEvent } from '../generated/Poster/Poster'
import { Result } from './Result'
import { json } from './json'
import { MetadataEntry } from '../generated/schema'
import {
  buildMetadataId,
  getAction,
  getTarget,
  getType,
  getName,
} from './utils'

enum ActionType {
  CREATE = 1,
  UPDATE = 2,
  DELETE = 3,
}

function replacer(key: string, value: JSONValue): string | null {
  if (key == 'type' || key == 'action') {
    return null
  }
  return json.stringify(value)
}

export class MetadataRegistrar {
  _event: NewPostEvent

  constructor(event: NewPostEvent) {
    this._event = event
  }

  authorized(entry: MetadataEntry, action: ActionType): boolean {
    // TODO: check granted permissions too
    return (
      this._event.transaction.from.toHexString() == entry.owner.toHexString()
    )
  }

  parse(data: string): JSONValue[] | null {
    let parsed = json.try_fromString(data)
    if (parsed.isError) {
      return null
    }

    if (parsed.value.kind !== JSONValueKind.OBJECT) {
      return null
    }

    let obj = parsed.value.toObject()
    let content = obj.get('content')
    if (!content) {
      return null
    }

    if (content.kind !== JSONValueKind.ARRAY) {
      return null
    }

    return content.toArray()
  }

  process(data: JSONValue): Result {
    let type = getType(data)
    if (type == 'permissions') {
      return this.setMetadataPermissions(data)
    } else if (type == 'metadata') {
      let action = getAction(data)
      if (action == 'create') {
        return this.registerMetadata(data)
      } else if (action == 'update') {
        return this.updateMetadata(data)
      } else if (action == 'delete') {
        return this.deleteMetadata(data)
      }
      return new Result('Invalid action')
    }

    return new Result('Invalid type')
  }

  registerMetadata(data: JSONValue): Result {
    let network = dataSource.network()
    let msgSender = this._event.transaction.from
    let name = getName(data)
    if (!name) {
      return new Result('Metadata name missing')
    }
    let id = buildMetadataId(network, msgSender, name!)
    let entry = new MetadataEntry(id)
    entry.owner = msgSender
    entry.network = network

    entry.metadata = json.stringify(data, replacer)
    entry.createdAt = this._event.block.timestamp

    entry.save()
    return new Result()
  }

  updateMetadata(data: JSONValue): Result {
    let id = getTarget(data)
    let entry = MetadataEntry.load(id)
    if (!entry) {
      return new Result('Metadata not found: ' + id)
    }

    if (!this.authorized(entry, ActionType.UPDATE)) {
      return new Result('Not authorized to update: ' + id)
    }

    // TODO: merge instead of replace
    entry.metadata = json.stringify(data, replacer)
    entry.lastUpdatedAt = this._event.block.timestamp
    entry.save()
    return new Result()
  }

  deleteMetadata(data: JSONValue): Result {
    let id = getTarget(data)
    let entry = MetadataEntry.load(id)
    if (!entry) {
      return new Result('Metadata not found: ' + id)
    }

    if (!this.authorized(entry, ActionType.DELETE)) {
      return new Result('Not authorized to delete: ' + id)
    }

    entry.deletedAt = this._event.block.timestamp
    entry.save()
    return new Result()
  }

  setMetadataPermissions(data: JSONValue): Result {
    return new Result()
  }
}
