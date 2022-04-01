export type SearchOptions = {
  activeOnly?: boolean
  first?: number
}

export interface MetadataResult<Data = any> {
  data?: Data
  error?: any
}
