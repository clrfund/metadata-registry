// default number of metadata search result to return
export const SEARCH_FIRST = 10

export const METADATA_FRAGMENT = `
  id
  owner
  metadata
  permissions {
    id
    update
    account
  }
`

export const GET_METADATA_QUERY = `query($id: String) {
  metadataEntries(where: { id: $id}) {
    ${METADATA_FRAGMENT}
  }
}`

// poster address is the same for all networks because it's deployed using the singleton method
export const POSTER = {
  ADDRESS: '0x000000000000cd17345801aa8147b8D3950260FF',
  ABI: [
    'function post(string content, string tag) public',
    'event NewPost(address indexed user, string content, string indexed tag)',
  ],
  METADATA_TAG: 'METADATA',
  METADATA_TYPE: 'metadata',
}

/**
 * Metadata actions
 */
export enum Action {
  create = 'create',
  update = 'update',
  delete = 'delete',
}
