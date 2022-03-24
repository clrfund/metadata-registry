import { NewPost as NewPostEvent } from '../generated/Poster/Poster'
import {
  ethereum,
  JSONValueKind,
  JSONValue,
  crypto,
  ByteArray,
  Address,
} from '@graphprotocol/graph-ts'
import { concat } from '@graphprotocol/graph-ts/helper-functions'
import { Error } from '../generated/schema'

export function buildMetadataId(
  network: string,
  msgSender: Address,
  name: string
): string {
  let nameHash = crypto.keccak256(ByteArray.fromUTF8(name))
  let networkHash = crypto.keccak256(ByteArray.fromUTF8(network))
  let id = crypto.keccak256(concat(concat(networkHash, msgSender), nameHash))
  return id.toHex()
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

export function getName(data: JSONValue): string | null {
  return getString(data, 'name')
}
