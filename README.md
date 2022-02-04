# Metadata Registry
Metadata Registry is an event driven registry that builds the metadata database using [theGraph](https://thegraph.com/en/) and the [Poster](https://github.com/onPoster/contract) contract (see [EIP-3722](https://eips.ethereum.org/EIPS/eip-3722)).

Anyone can register a new metadata, the owner or authorized accounts can update or delete a metadata.

Any dApp can query and consume the metadata using the subgraph API.  For example, the [clr.fund](https://clr.fund/#/) app will use the metadata to populate the project page while adding a new project or viewing the project details.

## How to Register a New Metadata
To register a new metadata, simply call the `Poster.post()` function to log an event. The `Poster` contract has been deployed at the same address, `0x000000000000cd17345801aa8147b8D3950260FF`, on multiple EVM compatible networks using the [Singleton Factory](https://eips.ethereum.org/EIPS/eip-2470).

```
  function post(string calldata content, string calldata tag) public {
      emit NewPost(msg.sender, content, tag);
  }
```

The inputs to the `Poster.post()` function should be:
* tag: "METADATA"
* content: a JSON formatted string with a content field that is an array of instruction objects for managing metadata and metadata permissions. See [Content Layout](docs/poster-content-layout.md) for more details.

## Subgraph
Subgraph is used to track the state of metadata by indexing events logged through the `Poster` contract.  When a new metadata is registered, it will be assigned a unique ID generated as `network-transactionHash-logIndex)`. This ID will be used for updating or deleting the metadata as well as setting the metadata permissions.

Content of the metadata will not be verified as the registry is designed to be generic and can accept any metadata. It is the Dapp's responsibility to verify metadata.

See subgraph entity definitions: [/packages/subgraph/schema.graphql](./packages/subgraph/schema.graphql).


## Composer
A library that merges subgraph results from different networks.
See [/packages/composer/README.md](/packages/composer/README.md) for more details.




