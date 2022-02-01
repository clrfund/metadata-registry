import { NewPost as NewPostEvent } from '../generated/Poster/Poster'
import { MetadataRegistrar } from './MetadataRegistrar'
import { logError } from './utils'
import { json } from './json'

// keccak256 hash of "METADATA"
const METADATA_TAG =
  '0x6afae84a1cc73825b77b2d8f14dc55a052ec6456df5cb0940e5de49ee56c0bd3'

export function handleNewPost(event: NewPostEvent): void {
  if (event.params.tag.toHex() != METADATA_TAG) {
    // ignore, only interested in the METADATA posts
    return
  }

  let registrar = new MetadataRegistrar(event)
  let content = registrar.parse(event.params.content)
  if (!content) {
    logError(event, event.params.content, 'Failed to parse content')
    return
  }

  for (let i = 0; i < content.length; i++) {
    let result = registrar.process(content[i])
    if (result.isError) {
      let errorMessage = 'Error in entry ' + i.toString() + ': ' + result.error
      logError(event, json.stringify(content[i]), errorMessage)
      break
    }
  }
}
