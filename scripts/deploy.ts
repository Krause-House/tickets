import { ethers, upgrades } from "hardhat";

async function main() {
  const V2Tickets = await ethers.getContractFactory("KrauseTickets");
  const krauseTicketsContract = await upgrades.deployProxy(V2Tickets, [
    "0x6F1183aB121e9F05CA4916237012Ed37B6f20583", // THESE ARE THE MAINNET ADDRESSES
    "0xC4E0f3Ec24972C75dF7c716922096F4270b7bB4e",
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
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
