import { createClient, Client, OperationResult } from '@urql/core'
import fetch from 'isomorphic-unfetch'
import { SearchOptions, MetadataResult } from './types'
import { buildSearchQuery } from './utils'
import { SEARCH_FIRST, GET_METADATA_QUERY, POSTER, Action } from './constants'
import { ContractTransaction, providers, Contract } from 'ethers'

/**
 * Merge an array of subgraph query results from different networks
 * Export this function for testing purposes
 * @param result array of query results from subgraphs
 * @returns merged result
 */
export function merge(result: OperationResult<any, any>[]): any {
  const data = result.reduce((acc: any, res) => {
    Object.entries(res.data).forEach(([key, val]) => {
      acc[key] = (acc[key] || []).concat(val)
    })

    return acc
  }, {})

  return { data }
}

// this function is only exported for testing purposes
export function hasError(result: OperationResult<any, any>[]): boolean {
  return !!result.find((el) => el.error)
}

/**
 *
 * this function is only exported for testing purposes
 * @param result
 * @returns
 */
export function mapError(result: OperationResult<any, any>[] | unknown): any {
  if (Array.isArray(result)) {
    return result.reduce((acc, el) => {
      if (el.error) {
        acc.error = (acc.error || []).concat(el.error)
      }
      return acc
    }, {})
  } else {
    return { error: [result] }
  }
}

/**
 * @class MetadataComposer
 */
export class MetadataComposer {
  clients: Client[]
  posterAddress: string

  /**
   * @param urls subgraph urls
   * @posterAddress address of the poster address, default POSTER.ADDRESS
   * @constructor
   */
  constructor(urls: string[] = [], posterAddress?: string) {
    this.clients = urls.map((url) => createClient({ url, fetch }))
    this.posterAddress = posterAddress || POSTER.ADDRESS
  }

  /**
   * Run a subgraph query against one or more networks and merges the results
   * @param queryString graphql query
   * @param args arguments to pass to the query
   * @returns query result
   */
  async query(queryString: string, args: any = {}): Promise<MetadataResult> {
    const queryResult = await Promise.all(
      this.clients.map((client) => client.query(queryString, args).toPromise())
    )

    if (hasError(queryResult)) {
      return mapError(queryResult)
    }

    try {
      return merge(queryResult)
    } catch (err) {
      return mapError(err)
    }
  }

  /**
   * Search for metadata containing the given search text
   * @param searchText text to search in the metadata field
   * @param options search options, i.e. search activeOnly metadata and
   *                number of result to return
   * @returns array of metadata entries
   */
  async search(
    searchText: string,
    options: SearchOptions = { first: SEARCH_FIRST }
  ): Promise<MetadataResult<any[]>> {
    const { activeOnly, first } = options
    const searchQuery = buildSearchQuery(activeOnly)
    const result = await this.query(searchQuery, {
      search: searchText,
      first,
    })

    if (result.error) {
      return result
    }

    const data = result.data.metadataEntries.map((entry: any) => {
      const { id, metadata: metadataString, __typename, ...others } = entry
      let metadata = {}
      try {
        metadata = JSON.parse(metadataString)
      } catch (error) {
        metadata = { error }
      }
      return {
        ...metadata,
        ...others,
        id,
      }
    })

    return { data }
  }

  /**
   * Get the metadata by id
   * @param id metadata id
   * @returns metadata
   */
  async get(id: string): Promise<MetadataResult> {
    const result = await this.query(GET_METADATA_QUERY, { id })

    if (result.error) {
      return result
    }

    if (
      !result.data.metadataEntries ||
      result.data.metadataEntries.length === 0
    ) {
      // id not found
      return { data: null }
    }

    const [entry] = result.data.metadataEntries
    const { metadata: metadataString, __typename, ...others } = entry
    try {
      const metadata = JSON.parse(metadataString)
      const data = {
        ...metadata,
        ...others,
        id,
      }

      return { data }
    } catch (error) {
      // return as much data as we can if json failed to parse so that
      // the metadata string can be updated
      const data = {
        ...others,
        id,
      }
      return { error, data }
    }
  }

  /**
   * Create a metadata entry in the registry
   * @param metadata metadata to add
   * @param provider EIP1193 web3 provider
   * @returns the added transaction
   */
  async create(metadata: any, provider: any): Promise<ContractTransaction> {
    const web3Provider = new providers.Web3Provider(provider)
    const signer = web3Provider.getSigner()
    const contract = new Contract(this.posterAddress, POSTER.ABI, signer)
    const content = {
      content: [
        {
          ...metadata,
          action: Action.create,
          type: POSTER.METADATA_TYPE,
        },
      ],
    }

    return contract.post(JSON.stringify(content), POSTER.METADATA_TAG)
  }

  /**
   * Update a metadata in the registry
   * @param metadata metadata to update
   * @param provider EIP1193 web3 provider
   * @returns the updated transaction
   */
  async update(metadata: any, provider: any): Promise<ContractTransaction> {
    const web3Provider = new providers.Web3Provider(provider)
    const signer = web3Provider.getSigner()
    const contract = new Contract(this.posterAddress, POSTER.ABI, signer)

    const content = {
      content: [
        {
          ...metadata,
          action: Action.update,
          type: POSTER.METADATA_TYPE,
          target: metadata.id,
        },
      ],
    }

    return contract.post(JSON.stringify(content), POSTER.METADATA_TAG)
  }

  /**
   * Mark a metadata as deleted in the registry
   * @param metadataId metadata id to delete
   * @param provider EIP1193 provider
   * @returns the delete transaction
   */
  async delete(
    metadataId: string,
    provider: any
  ): Promise<ContractTransaction> {
    const web3Provider = new providers.Web3Provider(provider)
    const signer = web3Provider.getSigner()
    const contract = new Contract(this.posterAddress, POSTER.ABI, signer)
    const content = {
      content: [
        {
          target: metadataId,
          action: Action.delete,
          type: POSTER.METADATA_TYPE,
        },
      ],
    }

    return contract.post(JSON.stringify(content), POSTER.METADATA_TAG)
  }
}
