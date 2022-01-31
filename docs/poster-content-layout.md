# Poster Content Layout

The `content` input field for the `Poster.post()` function takes an array of JSON objects with instructions to
1. [Create Metadata](#create-metadata)
2. [Update Metadata](#update-metadata)
3. [Delete Metadata](#delete-metadata)
4. [Set Metadata Permissions](#set-metadata-permissions)

## Create Metadata

| Property           | Type      | Value    |
| ------------------ |:------:| --------    |
| type               | String | metadata    |
| action             | String | create - create a metadata |
| name               | String | metadata name    |
| description        | String | markdown formatted metadata description |
| imageHash          | String | IPFS hash |
| imageUrl           | String | url |
| tagline            | String | tagline for your metadata |
| category           | String | Content, Data, Tooling  |
| problemSpace       | String | problem space description |
| plans              | String | plans |
| teamName           | String | team name |
| teamDescription    | String | team description |
| receivingAddresses | Array  | [EIP-3770](https://eips.ethereum.org/EIPS/eip-3770) addresses, i.e. eth:0x1234...789  |
| githubUrl          | String | github url |
| radicleUrl         | String | radicle url |
| websiteUrl         | String | website url |
| twitterUrl         | String | twitter url |
| discordUrl         | String | discord url |
| bannerImageHash    | String | IPFS hash |
| bannerImageUrl     | String | banner image url |
| thumbnailImageHash | String | IPFS hash |
| thumbnailImageUrl  | String | thumbnail image url |


A sample create metadata content:
```
{
  "content": [
    {
      "type": "metadata",
      "action": "create",
      "name": "Project name",
      "description": "A markdown formatted project description.",
      "imageHash": "QmbMP2fMiy6ek5uQZaxG3bzT9gSqMWxpdCUcQg1iSeEFMU",
      "imageUrl": "https://website.com/assets/image.png",
      "tagline": "short description",
      "category": "Content",
      "problemSpace": "problem space description",
      "plans": "plans",
      "teamName": "team name",
      "teamDescription": "team description",
      "receivingAddresses": ["eth:0x1234…5678","xdai:0x3333..."],
      "githubUrl": "https://github.com/",
      "radicleUrl": "https://radicle.xyz/",
      "websiteUrl": "https://website.com/",
      "twitterUrl": "https://twitter.com/",
      "discordUrl": "https://discord.com/",
      "bannerImageHash": "QmbMP2fMiy6ek5uQZaxG3bzT9gSqMWxpdCUcQg1iSeEFMU",
      "bannerImageUrl": "https://website.com/assets/banner.png",
      "thumbnailImageHash": "QmbMP2fMiy6ek5uQZaxG3bzT9gSqMWxpdCUcQg1iSeEFMU",
      "thumbnailImageUrl": "https://website.com/assets/thumbnail.png"
    }
  ]
}
```

## Update Metadata
| Property           | Type      | Value    |
| ------------------ |:------:| --------    |
| type               | String | metadata    |
| action             | String | update - update a metadata |
| target             | String | id of the metadata to update; create metadata will generate this id |
| property to update | Property Type | any metadata property to update |

Sample content for updating only the description property.

```
{
  "content": [
    {
      "type": "metadata",
      "action": "update",
      "target": "0x123...",
      "description": "new project description",
    }
  ]
}
```

## Delete Metadata
| Property           | Type      | Value    |
| ------------------ |:------:| --------    |
| type               | String | metadata    |
| action             | String | delete - mark a metadata as deleted |
| target             | String | id of the metadata to delete |

Note that a metadata is only marked as deleted so that dApps can still reference it after deletion.

Sample for marking a metadata as deleted
```
{
  "content": [
    {
      "type": "metadata",
      "action": "delete",
      "target": "metadata id to mark deleted",
    }
  ]
}
```

## Set Metadata Permissions
After registering a metadata, the owner can grant permissions to other accounts to update/delete/change permissions on the metadata.

| Property           | Type   | Value    |
| ------------------ |:------:| --------    |
| type               | String | permissions    |
| action             | String | set - to set permissions |
| target             | String | metadata id generated from metadata creation |
| accounts           | Array  | array of addresses to grants the permissions to |
| permissions        | Object | each property in this object specifies what permissions to grant |
|                    |        | create: true - allow to create metadata|
|                    |        | update: true - allow to update metadata|
|                    |        | delete: true - allow to delete metadata|
|                    |        | permissions: true - allow to grant permissions on the metadata |
|                    |        | if the permissions property is not defined, all metadata permissions will be revoked from the accounts|

Sample:
```
{
  "content": [
    {
      "type": "permissions",
      "action": "set",
      "accounts": ["0x1234...", "0x2222..."],
      "target": "metadata id generated from create",
      "permissions": {
        "create": true,
        "delete": true,
        "update": true,
        "permissions": true
      }
    }
  ]
}
```
