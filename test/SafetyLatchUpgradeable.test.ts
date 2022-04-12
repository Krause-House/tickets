import { expect } from "chai";
import { Signer } from "ethers";
import { ethers } from "hardhat";
import { SafetyLatchUpgradeable } from "../typechain";

const safetyLatchUpgradeableAbi = [
  "function withdrawERC721(address contractAddress, uint256 tokenId) public",
  "function withdrawERC1155(address contractAddress, uint256 tokenId) public",
  "function withdrawERC20(address contractAddress) public",
];

let owner: Signer, alice: Signer, bob: Signer;
let safetyLatchUpgradeable: SafetyLatchUpgradeable;

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
    const erc721 = await givenERC721(safetyLatchUpgradeable.address, 0);

    const asAlice = new ethers.Contract(
      safetyLatchUpgradeable.address,
      safetyLatchUpgradeableAbi,
      alice
    );
    await expect(asAlice.withdrawERC721(erc721.address, 0)).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );

    await safetyLatchUpgradeable.withdrawERC721(erc721.address, 0);
    expect(await erc721.ownerOf(0)).to.equal(await owner.getAddress());
  });

  it("allows only the owner to withdraw erc1155s", async () => {
    const erc1155 = await givenERC1155(safetyLatchUpgradeable.address, 0, 10);

    const asAlice = new ethers.Contract(
      safetyLatchUpgradeable.address,
      safetyLatchUpgradeableAbi,
      alice
    );
    await expect(
      asAlice.withdrawERC1155(erc1155.address, 0)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await safetyLatchUpgradeable.withdrawERC1155(erc1155.address, 0);
    expect(await erc1155.balanceOf(safetyLatchUpgradeable.address, 0)).to.equal(
      0
    );
    expect(await erc1155.balanceOf(await owner.getAddress(), 0)).to.equal(10);
  });

  it("allows only the owner to withdraw erc20s", async () => {
    const erc20 = await givenERC20(safetyLatchUpgradeable.address, 10);

    const asAlice = new ethers.Contract(
      safetyLatchUpgradeable.address,
      safetyLatchUpgradeableAbi,
      alice
    );
    await expect(asAlice.withdrawERC20(erc20.address)).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );

    await safetyLatchUpgradeable.withdrawERC20(erc20.address);
    expect(await erc20.balanceOf(safetyLatchUpgradeable.address)).to.equal(0);
    expect(await erc20.balanceOf(await owner.getAddress())).to.equal(10);
  });
});

const givenERC721 = async (address: string, id: number) => {
  const ERC721 = await ethers.getContractFactory("MintableERC721");
  const erc721 = await ERC721.deploy();
  await erc721.deployed();

  await erc721.mint(address, id);
  expect(await erc721.ownerOf(id)).to.equal(address);
  return erc721;
};

const givenERC1155 = async (address: string, id: number, amount: number) => {
  const ERC1155 = await ethers.getContractFactory("MintableERC1155");
  const erc1155 = await ERC1155.deploy("");
  await erc1155.deployed();

  await erc1155.mint(address, id, amount);
  expect(await erc1155.balanceOf(address, id)).to.equal(amount);
  return erc1155;
};

const givenERC20 = async (address: string, amount: number) => {
  const ERC20 = await ethers.getContractFactory("MintableERC20");
  const erc20 = await ERC20.deploy();
  await erc20.deployed();

  await erc20.mint(address, amount);
  expect(await erc20.balanceOf(address)).to.equal(amount);
  return erc20;
};
