import { METADATA_FRAGMENT } from './constants'

export function buildSearchQuery(activeOnly = false): string {
  const deletedClause = activeOnly ? `, deletedAt: null` : ''
  return `query($search: String, $first: Int) {
    metadataEntries(where: { metadata_contains_nocase: $search ${deletedClause} }, first: $first) {
      ${METADATA_FRAGMENT}
    }
  }`
}
