import { ethers, upgrades } from "hardhat";

async function main() {
  const V2Tickets = await ethers.getContractFactory("KrauseTickets");
  const krauseTicketsContract = await upgrades.deployProxy(V2Tickets, [
    "0x6F1183aB121e9F05CA4916237012Ed37B6f20583", // THESE ARE THE MAINNET ADDRESSES
    "0xC4E0f3Ec24972C75dF7c716922096F4270b7bB4e",
    "https://gateway.pinata.cloud/ipfs/QmVGYouVCfxpsJKrecrNFmbeqom98Ybhrz5yL7K3kiVRMo/",
  ]);
  await krauseTicketsContract.deployed();
  console.log("KrauseTickets deployed to:", krauseTicketsContract.address);

  await krauseTicketsContract.setContractURI(
    "https://gateway.pinata.cloud/ipfs/QmfWTJPp173RT15YoEmRJUBJbGGigocgyLFiH8upWV8w7z/"
  );
  await krauseTicketsContract.setRoyaltyInfo(
    "0xe4762eacebdb7585d32079fdcba5bb94eb5d76f2",
    500
  );

  console.log("Setup complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
