import * as dotenv from "dotenv";
import { expect } from "chai";
import { Contract, Signer } from "ethers";
import { ethers, upgrades } from "hardhat";

dotenv.config();

const ticketsAbi = [
  "function balanceOf(address, uint256) view returns (uint256)",
];
const willCallTicketsAbi = [
  "function approve(address spender, uint256 id) public",
  "function safeTransferFrom(address from,address to,uint256 tokenId) public",
  "function balanceOf(address) view returns (uint256)",
];
const legacyTicketsAbi = [
  "function approve(address spender, uint256 id) public",
  "function balanceOf(address) view returns (uint256)",
  "function safeTransferFrom(address from,address to,uint256 tokenId) public",
  "function setEdition(uint256 _edition) public",
  "function tokenToEdition(uint256) public view returns (uint256)",
];

let upperLevelId: number, clubLevelId: number, courtsideId: number;
let owner: Signer, alice: Signer, bob: Signer;
let krauseTickets: Contract; // can't directly use type since its a proxy
const uri =
  "https://ipfs.io/ipfs/QmRtwCrLUYUmiMSw9Xrd2mMPe5JWEo9X8s4hKsb8NRkZWF/";
const legacyTickets = "0xC4E0f3Ec24972C75dF7c716922096F4270b7bB4e";
const willCallTickets = "0x6F1183aB121e9F05CA4916237012Ed37B6f20583";

const test = async () => {
  let provider = ethers.getDefaultProvider("http://127.0.0.1:8545/");
  owner = new ethers.Wallet(process.env.PRIVATE_KEY ?? "", provider);

  //   const KrauseTickets = await ethers.getContractFactory("KrauseTickets");
  //   krauseTickets = await upgrades.deployProxy(KrauseTickets, [
  //     willCallTickets,
  //     legacyTickets,
  //     uri,
  //   ]);
  krauseTickets = new ethers.Contract(
    "0x70bDA08DBe07363968e9EE53d899dFE48560605B",
    ticketsAbi,
    owner
  );
  console.log(await owner.getAddress());

  upperLevelId = 0;
  clubLevelId = 1;
  courtsideId = 2;

  console.log(
    await krauseTickets.balanceOf(await owner.getAddress(), upperLevelId)
  );
  console.log(await provider.getBalance(owner.getAddress()));

  const legacy = new ethers.Contract(legacyTickets, legacyTicketsAbi, owner);

  console.log(
    "Will call ticket:",
    await legacy.balanceOf(await owner.getAddress())
  );
  console.log(
    "V2 tickets:",
    await krauseTickets.balanceOf(await owner.getAddress(), upperLevelId)
  );

  const txn = await legacy.safeTransferFrom(
    await owner.getAddress(),
    krauseTickets.address,
    2583
  );

  console.log(
    "Will call ticket:",
    await legacy.balanceOf(await owner.getAddress())
  );
  console.log(
    "V2 tickets:",
    await krauseTickets.balanceOf(await owner.getAddress(), upperLevelId)
  );
  console.log(
    "Will call ticket in V2:",
    await legacy.balanceOf(krauseTickets.address)
  );
};
test();
