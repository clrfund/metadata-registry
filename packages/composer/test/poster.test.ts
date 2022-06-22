import hre, { network } from 'hardhat'
import { MetadataComposer } from '../src/index'

describe('Poster', function () {
  let registry: MetadataComposer
  beforeAll(async () => {
    const Poster = await hre.ethers.getContractFactory('Poster')
    const poster = await Poster.deploy()
    await poster.deployed()

    // empty array fo urls because we are not testing subgraph part
    const urls: string[] = []
    registry = new MetadataComposer(urls, poster.address)
  })
  test('add metadata', async function () {
    const metadata = { name: 'test', description: 'test' }
    const tx = await registry.create(metadata, network.provider)
    const receipt = await tx.wait()

    expect(receipt.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'NewPost',
        }),
      ])
    )
  })
  test('update metadata', async function () {
    const metadata = { name: 'test', description: 'test' }
    const tx = await registry.update(metadata, network.provider)
    const receipt = await tx.wait()

    expect(receipt.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'NewPost',
        }),
      ])
    )
  })
  test('delete metadata', async function () {
    const metadataId = 'someId'
    const tx = await registry.delete(metadataId, network.provider)
    const receipt = await tx.wait()

    expect(receipt.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'NewPost',
        }),
      ])
    )
  })
})
