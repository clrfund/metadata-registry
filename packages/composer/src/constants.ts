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
