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

// keys to be filtered out of the metadata json object
let filter = new Set<string>()
filter.add('action')
filter.add('type')

function replacer(key: string, value: JSONValue): string | null {
  if (filter.has(key)) {
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
      return new Result('Processing of permissions type not implemented')
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
      return new Result('Missing metadata name')
    }

    let id = buildMetadataId(network, msgSender, name)
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

    let metadata = json.try_fromString(entry.metadata as string)
    if (metadata.isError) {
      return new Result('Error parsing metadata for id: ' + id)
    }

    let merged = json.try_mergeObject([metadata.value, data], filter)
    if (merged.isError) {
      return new Result('Error merging metadata:' + merged.error)
    }

    entry.metadata = json.stringifyTypedMap(merged.value)
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
}
