import { expect } from "chai";
import { Contract, Signer } from "ethers";
import { ethers, upgrades } from "hardhat";
import { MirrorTickets, MirrorTicketEditions } from "../typechain";

const ticketsAbi = [
  "function setUri(string memory _uri) public",
  "function setRoyaltyInfo(address _royaltyReceiver, uint256 _royaltyFeeInBips) external",
  "function supportsInterface(bytes4 interfaceID) public",
];
const willCallTicketsAbi = [
  "function approve(address spender, uint256 id) public",
  "function safeTransferFrom(address from,address to,uint256 tokenId) public",
];
const legacyTicketsAbi = [
  "function approve(address spender, uint256 id) public",
  "function safeTransferFrom(address from,address to,uint256 tokenId) public",
  "function setEdition(uint256 _edition) public",
  "function tokenToEdition(uint256) public view returns (uint256)",
];

let legacyTickets: {
  willCall: MirrorTickets;
  legacy: MirrorTicketEditions;
};
let upperLevelId: number, clubLevelId: number, courtsideId: number;
let owner: Signer, alice: Signer, bob: Signer;
let krauseTickets: Contract; // can't directly use type since its a proxy
const uri = "https://mirror-api.com/editions/custom/krause-house-crowdfund/";

describe("Exchange tickets", function () {
  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();
    legacyTickets = await deployLegacyTickets(await owner.getAddress());

    const KrauseTickets = await ethers.getContractFactory("KrauseTickets");
    krauseTickets = await upgrades.deployProxy(KrauseTickets, [
      legacyTickets.willCall.address,
      legacyTickets.legacy.address,
      uri,
    ]);

    upperLevelId = await (await krauseTickets.upperLevelId()).toNumber();
    clubLevelId = await (await krauseTickets.clubLevelId()).toNumber();
    courtsideId = await (await krauseTickets.courtsideId()).toNumber();
  });

  it("allows holders to exchange tickets", async function () {
    const aliceAddress = await alice.getAddress();
    await givenLegacyTickets(aliceAddress, 1);

    await whenExchanging(alice, 1);

    assertExchanged(aliceAddress);
  });

  it("retrieves the correct uri for each token", async function () {
    expect(await krauseTickets.uri("0")).to.equal(uri + "0");
    expect(await krauseTickets.uri("1")).to.equal(uri + "1");
    expect(await krauseTickets.uri("2")).to.equal(uri + "2");
  });

  it("allows setting uri only if owner", async function () {
    const newUri = "https://krause.com/new";
    await krauseTickets.setUri(newUri);
    expect(await krauseTickets.uri("0")).to.equal(newUri + "0");

    // non-owner cannot set uri
    await expect(
      givenKrauseTicketsContract(alice).setUri(uri)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("allows setting royalty info only if owner", async function () {
    await krauseTickets.setRoyaltyInfo(await alice.getAddress(), 100); // 1% royalty
    const { receiver, royaltyAmount } = await krauseTickets.royaltyInfo(
      0,
      100000
    );
    expect(receiver).to.equal(await alice.getAddress());
    expect(royaltyAmount).to.equal(1000);
  });

  it("properly calculates royalties", async function () {
    await krauseTickets.setRoyaltyInfo(await alice.getAddress(), 100);
    expect(await krauseTickets.royaltyReceiver()).to.equal(
      await alice.getAddress()
    );
    expect(await krauseTickets.royaltyFeeInBips()).to.equal(100);

    // non-owner cannot set royalty info
    await expect(
      givenKrauseTicketsContract(alice).setRoyaltyInfo(
        await alice.getAddress(),
        10000
      )
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("supports EIP2981", async function () {
    expect(await krauseTickets.supportsInterface("0x2a55205a")).to.be.true;
  });
});

const givenWillCallContract = (signer: Signer) => {
  return new ethers.Contract(
    legacyTickets.willCall.address,
    willCallTicketsAbi,
    signer
  );
};
const givenTicketContract = (signer: Signer) => {
  return new ethers.Contract(
    legacyTickets.legacy.address,
    legacyTicketsAbi,
    signer
  );
};

const givenKrauseTicketsContract = (signer: Signer) => {
  return new ethers.Contract(krauseTickets.address, ticketsAbi, signer);
};

const givenLegacyTickets = async (
  accountAddress: string,
  startingTokenId: number
) => {
  await legacyTickets.willCall.mint(accountAddress, startingTokenId);
  expect(await legacyTickets.willCall.balanceOf(accountAddress)).to.equal(1);
  await legacyTickets.legacy.mint(accountAddress, startingTokenId);
  expect(await legacyTickets.legacy.balanceOf(accountAddress)).to.equal(1);
  await legacyTickets.legacy.mint(accountAddress, startingTokenId + 1);
  expect(await legacyTickets.legacy.balanceOf(accountAddress)).to.equal(2);
  await legacyTickets.legacy.mint(accountAddress, startingTokenId + 2);
  expect(await legacyTickets.legacy.balanceOf(accountAddress)).to.equal(3);
};

const whenExchanging = async (signer: Signer, startingTokenId: number) => {
  await givenWillCallContract(signer).safeTransferFrom(
    await signer.getAddress(),
    krauseTickets.address,
    startingTokenId
  );
  const legacyTickets = givenTicketContract(signer);
  await legacyTickets.setEdition(59); // courtside
  await legacyTickets.safeTransferFrom(
    await signer.getAddress(),
    krauseTickets.address,
    startingTokenId
  );
  console.log("Thing");

  await legacyTickets.setEdition(60); // club level
  await legacyTickets.safeTransferFrom(
    await signer.getAddress(),
    krauseTickets.address,
    startingTokenId + 1
  );

  await legacyTickets.setEdition(61); // upper level
  await legacyTickets.safeTransferFrom(
    await signer.getAddress(),
    krauseTickets.address,
    startingTokenId + 2
  );
};

const deployLegacyTickets = async (owner: string) => {
  const WillCallTicket = await ethers.getContractFactory("MirrorTickets");
  const willCall = await WillCallTicket.deploy(owner, "", "");
  const LegacyTicket = await ethers.getContractFactory("MirrorTicketEditions");
  const legacy = await LegacyTicket.deploy(owner, "", "");

  await willCall.deployed();
  await legacy.deployed();
  return { willCall, legacy };
};

const assertExchanged = async (address: string) => {
  assertV2TicketsHeld(address, [2, 1, 1]);
  expect(await legacyTickets.willCall.balanceOf(address)).to.equal(0);
  expect(await legacyTickets.legacy.balanceOf(address)).to.equal(0);
};

const assertV2TicketsHeld = async (address: string, count: number[]) => {
  expect(await krauseTickets.balanceOf(address, upperLevelId)).to.equal(
    count[0]
  );
  expect(await krauseTickets.balanceOf(address, clubLevelId)).to.equal(
    count[1]
  );
  expect(await krauseTickets.balanceOf(address, courtsideId)).to.equal(
    count[2]
  );
};
