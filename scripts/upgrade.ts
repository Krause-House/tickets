import { ethers, upgrades } from "hardhat";

async function main() {
  const V2Tickets = await ethers.getContractFactory("KrauseTickets");
  const upgraded = await upgrades.upgradeProxy(
    "0x8993F1EF0583F64b2EEA49a0Cb65Df6eB364e105",
    V2Tickets
  );
  await upgraded.deployed();
  console.log("KrauseTickets upgraded to:", upgraded.address);

  console.log("Upgrade complete!");
  // MANUAL: transfer ownership
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
