import { expect } from "chai";
import { Contract, Signer } from "ethers";
import { ethers, upgrades } from "hardhat";

const safetyLatchUpgradeableAbi = [
  "function withdrawErc721(address contractAddress, uint256 tokenId) public",
  "function withdrawErc1155(address contractAddress, uint256 tokenId) public",
  "function withdrawErc20(address contractAddress) public",
];

let owner: Signer, alice: Signer, bob: Signer;
let safetyLatchUpgradeable: Contract; // can't directly use type since its a proxy

describe("Safety latch", function () {
  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();

    const SafetyLatchUpgradeable = await ethers.getContractFactory(
      "SafetyLatchUpgradeable"
    );
    safetyLatchUpgradeable = await SafetyLatchUpgradeable.deploy();
    await safetyLatchUpgradeable.deployed();
    safetyLatchUpgradeable.__SafetyLatchUpgradeable_init();
  });

  it("allows only the owner to withdraw erc721s", async () => {
    const erc721 = await givenErc721(safetyLatchUpgradeable.address, 0);

    const asAlice = new ethers.Contract(
      safetyLatchUpgradeable.address,
      safetyLatchUpgradeableAbi,
      alice
    );
    await expect(asAlice.withdrawErc721(erc721.address, 0)).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );

    await safetyLatchUpgradeable.withdrawErc721(erc721.address, 0);
    expect(await erc721.ownerOf(0)).to.equal(await owner.getAddress());
  });

  it("allows only the owner to withdraw erc1155s", async () => {
    const erc1155 = await givenErc1155(safetyLatchUpgradeable.address, 0, 10);

    const asAlice = new ethers.Contract(
      safetyLatchUpgradeable.address,
      safetyLatchUpgradeableAbi,
      alice
    );
    await expect(
      asAlice.withdrawErc1155(erc1155.address, 0)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await safetyLatchUpgradeable.withdrawErc1155(erc1155.address, 0);
    expect(await erc1155.balanceOf(safetyLatchUpgradeable.address, 0)).to.equal(
      0
    );
    expect(await erc1155.balanceOf(await owner.getAddress(), 0)).to.equal(10);
  });

  it("allows only the owner to withdraw erc20s", async () => {
    const erc20 = await givenErc20(safetyLatchUpgradeable.address, 10);

    const asAlice = new ethers.Contract(
      safetyLatchUpgradeable.address,
      safetyLatchUpgradeableAbi,
      alice
    );
    await expect(asAlice.withdrawErc20(erc20.address)).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );

    await safetyLatchUpgradeable.withdrawErc20(erc20.address);
    expect(await erc20.balanceOf(safetyLatchUpgradeable.address)).to.equal(0);
    expect(await erc20.balanceOf(await owner.getAddress())).to.equal(10);
  });
});

const givenErc721 = async (address: string, id: number) => {
  const ERC721 = await ethers.getContractFactory("MintableERC721");
  const erc721 = await ERC721.deploy();
  await erc721.deployed();

  await erc721.mint(address, id);
  expect(await erc721.ownerOf(id)).to.equal(address);
  return erc721;
};

const givenErc1155 = async (address: string, id: number, amount: number) => {
  const ERC1155 = await ethers.getContractFactory("MintableERC1155");
  const erc1155 = await ERC1155.deploy("");
  await erc1155.deployed();

  await erc1155.mint(address, id, amount);
  expect(await erc1155.balanceOf(address, id)).to.equal(amount);
  return erc1155;
};

const givenErc20 = async (address: string, amount: number) => {
  const ERC20 = await ethers.getContractFactory("MintableERC20");
  const erc20 = await ERC20.deploy();
  await erc20.deployed();

  await erc20.mint(address, amount);
  expect(await erc20.balanceOf(address)).to.equal(amount);
  return erc20;
};
