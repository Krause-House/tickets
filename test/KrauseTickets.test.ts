import { expect } from "chai";
import { Address } from "cluster";
import { Contract, Signer } from "ethers";
import { ethers } from "hardhat";
import { KrauseTickets, MirrorTicket } from "../typechain";

const abi = [
  "function exchange(uint256 legacyTokenId, uint256 newTokenId) public",
];
const legacyTicketsAbi = [
  "function approve(address spender, uint256 id) public",
  "function safeTransferFrom(address from,address to,uint256 tokenId) public",
];

let legacyTickets: {
  upperLevel: MirrorTicket;
  clubLevel: MirrorTicket;
  courtside: MirrorTicket;
};
let upperLevelId: number, clubLevelId: number, courtsideId: number;
let owner: Signer, alice: Signer, bob: Signer;
let krauseTickets: KrauseTickets;

describe("Exchange tickets", function () {
  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();
    legacyTickets = await deployLegacyTickets(await owner.getAddress());
    const KrauseTickets = await ethers.getContractFactory("KrauseTickets");
    krauseTickets = await KrauseTickets.deploy(
      legacyTickets.upperLevel.address,
      legacyTickets.clubLevel.address,
      legacyTickets.courtside.address
    );

    upperLevelId = await (await krauseTickets.upperLevelId()).toNumber();
    clubLevelId = await (await krauseTickets.clubLevelId()).toNumber();
    courtsideId = await (await krauseTickets.courtsideId()).toNumber();
  });

  it("allows holders to exchange ticket", async function () {
    const aliceAddress = await alice.getAddress();
    await givenLegacyTickets(aliceAddress, 1);

    await whenExchanging(alice, 1);

    assertExchanged(aliceAddress);
  });
});

const givenUpperLevelContract = (signer: Signer) => {
  return new ethers.Contract(
    legacyTickets.upperLevel.address,
    legacyTicketsAbi,
    signer
  );
};
const givenClubLevelContract = (signer: Signer) => {
  return new ethers.Contract(
    legacyTickets.clubLevel.address,
    legacyTicketsAbi,
    signer
  );
};
const givenCourtsideContract = (signer: Signer) => {
  return new ethers.Contract(
    legacyTickets.courtside.address,
    legacyTicketsAbi,
    signer
  );
};

const givenLegacyTickets = async (accountAddress: string, tokenId: number) => {
  await legacyTickets.upperLevel.mint(accountAddress, tokenId);
  expect(await legacyTickets.upperLevel.balanceOf(accountAddress)).to.equal(1);
  await legacyTickets.clubLevel.mint(accountAddress, tokenId);
  expect(await legacyTickets.clubLevel.balanceOf(accountAddress)).to.equal(1);
  await legacyTickets.courtside.mint(accountAddress, tokenId);
  expect(await legacyTickets.courtside.balanceOf(accountAddress)).to.equal(1);
};

const whenExchanging = async (signer: Signer, tokenId: number) => {
  await givenUpperLevelContract(signer).safeTransferFrom(
    await signer.getAddress(),
    krauseTickets.address,
    tokenId
  );
  await givenClubLevelContract(signer).safeTransferFrom(
    await signer.getAddress(),
    krauseTickets.address,
    tokenId
  );
  await givenCourtsideContract(signer).safeTransferFrom(
    await signer.getAddress(),
    krauseTickets.address,
    tokenId
  );
};

const deployLegacyTickets = async (owner: string) => {
  const LegacyTicket = await ethers.getContractFactory("MirrorTicket");
  const upperLevel = await LegacyTicket.deploy(owner, "", "");
  const clubLevel = await LegacyTicket.deploy(owner, "", "");
  const courtside = await LegacyTicket.deploy(owner, "", "");

  await upperLevel.deployed();
  await clubLevel.deployed();
  await courtside.deployed();
  return { upperLevel, clubLevel, courtside };
};

const assertExchanged = async (address: string) => {
  assertV2TicketsHeld(address, 1);
  expect(await legacyTickets.upperLevel.balanceOf(address)).to.equal(0);
  expect(await legacyTickets.clubLevel.balanceOf(address)).to.equal(0);
  expect(await legacyTickets.courtside.balanceOf(address)).to.equal(0);
};

const assertV2TicketsHeld = async (address: string, count: number) => {
  expect(await krauseTickets.balanceOf(address, upperLevelId)).to.equal(count);
  expect(await krauseTickets.balanceOf(address, clubLevelId)).to.equal(count);
  expect(await krauseTickets.balanceOf(address, courtsideId)).to.equal(count);
};
