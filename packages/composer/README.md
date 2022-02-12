# `Metadata Composer`

> A library that merges metadata from subgraphs indexing different networks. The interface of this library is closely similar to the `theGraph` interface (i.e. input/output) so that if dApps needs metadata from one network, it can simply use `theGraph` api with minimal changes.

## Usage
```
import { MetadataComposer } from '@clrfund/metadata-composer'

const urls = ['https://api.thegraph.com/subgraphs/name/yuetloo/metadata-rinkeby']
const composer = new MetadataComposer(urls)

const query = '{ metadataEntries{id} }'
const { data, error } = await composer.query(query)
if( data } {
  console.log(data)
  //    {
  //      metadataEntries: [
  //        {
  //          __typename: 'MetadataEntry',
  //          id: 'rinkeby-0x123...456-59'
  //        }
  //      ]
  //    }
  //
}

if( error ) {
  console.log(error)
  //  [
  //    CombinedError {
  //      name: 'CombinedError',
  //      message: '[GraphQL] No value provided for required argument: `id`',
  //      graphQLErrors: [
  //         GraphQLError: No value provided for required argument: `id`
  //        ... stack trace ...
  //      ]
  //      networkError: undefined,
  //      response: Response {
  //         url: 'https://api.thegraph.com/subgraphs/name/...',
  //         status: 200,
  //         statusText: 'OK',
  //         headers: [Headers]
  //         counter: 0
  //      }
  //   }
  // ]
  //
}

```


## Limitations

Currently, this library only merges the results without sorting or refining the paging according to the query request.

Sorting could be adding later to only sort the data if the `orderBy` fields are returned as part of the results; unlike subgraph queries which can order fields that are not in the query result.

Paging may not be implemented in this library due to performance impact.
