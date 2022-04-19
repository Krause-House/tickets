import { ethers, upgrades } from "hardhat";

async function main() {
  const V2Tickets = await ethers.getContractFactory("KrauseTickets");
  const krauseTicketsContract = await upgrades.deployProxy(V2Tickets, [
    "0xe13ac4eA901C8A30A219eb8842d1693c387c7a69",
    "0x726CD6af96BC07a25606FfA227d81cff72b658c0",
    "0x10304b3bF0529daDfb9c4E975F439e93B5618fB1",
    "",
  ]);
  await krauseTicketsContract.deployed();
  console.log("KrauseTickets deployed to:", krauseTicketsContract.address);

  await krauseTicketsContract.setUri(
    "https://ipfs.io/ipfs/QmRtwCrLUYUmiMSw9Xrd2mMPe5JWEo9X8s4hKsb8NRkZWF/"
  );
  await krauseTicketsContract.setContractURI(
    "https://ipfs.io/ipfs/QmaWoMgxdpd9h7D1GAY38JBYpzftJbRWdxWDSMp8t5cVFt"
  );
  await krauseTicketsContract.setRoyaltyInfo(
    "0xb2e19da274Cfc17110abca40114784D9822D4242",
    500
  );

  console.log("Setup complete!");
  // MANUAL: transfer ownership
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
