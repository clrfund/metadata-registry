import { NewPost as NewPostEvent } from '../generated/Poster/Poster'
import {
  ethereum,
  JSONValueKind,
  dataSource,
  JSONValue,
} from '@graphprotocol/graph-ts'
import { Error } from '../generated/schema'

export function buildMetadataId(event: ethereum.Event): string {
  return dataSource.network().concat('-').concat(buildEventId(event))
}

export function buildEventId(event: ethereum.Event): string {
  return event.transaction.hash
    .toHex()
    .concat('-')
    .concat(event.logIndex.toString())
}

export function logError(
  event: NewPostEvent,
  content: string,
  message: string | null
): void {
  let id = buildEventId(event)
  let error = new Error(id)
  error.errorMessage = message
  error.content = content
  error.msgSender = event.transaction.from
  error.txHash = event.transaction.hash
  error.logIndex = event.logIndex
  error.timestamp = event.block.timestamp
  error.save()
}

function getString(data: JSONValue, key: string): string | null {
  if (data.kind !== JSONValueKind.OBJECT) {
    return null
  }

  let obj = data.toObject()
  let value = obj.get(key)
  if (!value || value.kind != JSONValueKind.STRING) {
    return null
  }

  return value.toString()
}

export function getType(data: JSONValue): string | null {
  return getString(data, 'type')
}

export function getAction(data: JSONValue): string | null {
  return getString(data, 'action')
}

export function getTarget(data: JSONValue): string {
  let target = getString(data, 'target')
  return target ? target : ''
}
