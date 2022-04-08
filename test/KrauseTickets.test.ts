import { expect } from "chai";
import { Contract, Signer } from "ethers";
import { ethers, upgrades } from "hardhat";
import { MirrorTickets } from "../typechain";

const ticketsAbi = ["function setUri(string memory _uri) public"];
const legacyTicketsAbi = [
  "function approve(address spender, uint256 id) public",
  "function safeTransferFrom(address from,address to,uint256 tokenId) public",
];

let legacyTickets: {
  upperLevel: MirrorTickets;
  clubLevel: MirrorTickets;
  courtside: MirrorTickets;
};
let upperLevelId: number, clubLevelId: number, courtsideId: number;
let owner: Signer, alice: Signer, bob: Signer;
let krauseTickets: Contract; // can't directly use type since its a proxy
const uri = "https://mirror-api.com/editions/custom/krause-house-crowdfund";

describe("Exchange tickets", function () {
  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();
    legacyTickets = await deployLegacyTickets(await owner.getAddress());

    const KrauseTickets = await ethers.getContractFactory("KrauseTickets");
    krauseTickets = await upgrades.deployProxy(KrauseTickets, [
      legacyTickets.upperLevel.address,
      legacyTickets.clubLevel.address,
      legacyTickets.courtside.address,
      uri,
    ]);

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

  it("retrieves the correct uri for each token", async function () {
    expect(await krauseTickets.getUri("0")).to.equal(uri + "/0");
    expect(await krauseTickets.getUri("1")).to.equal(uri + "/1");
    expect(await krauseTickets.getUri("2")).to.equal(uri + "/2");

    // confirm the OZ implementation is disabled
    await expect(krauseTickets.uri(0)).to.be.revertedWith(
      "KrauseTickets: Unsupported method"
    );
  });

  it("allows setting uri only if owner", async function () {
    const newUri = "https://krause.com/new";
    await krauseTickets.setUri(newUri);
    expect(await krauseTickets.getUri("0")).to.equal(newUri + "/0");

    // non-owner cannot set uri
    await expect(
      givenKrauseTicketsContract(alice).setUri(uri)
    ).to.be.revertedWith("Ownable: caller is not the owner");
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

const givenKrauseTicketsContract = (signer: Signer) => {
  return new ethers.Contract(krauseTickets.address, ticketsAbi, signer);
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
  const LegacyTicket = await ethers.getContractFactory("MirrorTickets");
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
