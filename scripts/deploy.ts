import { ethers } from "hardhat";

async function main() {
  const LegacyTicket = await ethers.getContractFactory("MirrorTicket");
  const upperLevel = await LegacyTicket.deploy(
    "0x2C68489f711eEf3e30fC0Cc20Bdaa436A3b4cc4a",
    "Krause House Upper Level Ticket",
    "KH"
  );
  const clubLevel = await LegacyTicket.deploy(
    "0x2C68489f711eEf3e30fC0Cc20Bdaa436A3b4cc4a",
    "Krause House Club Level Ticket",
    "KH"
  );
  const courtside = await LegacyTicket.deploy(
    "0x2C68489f711eEf3e30fC0Cc20Bdaa436A3b4cc4a",
    "Krause House Courtside Ticket",
    "KH"
  );

  await upperLevel.deployed();
  await clubLevel.deployed();
  await courtside.deployed();

  console.log("Upper level deployed to:", upperLevel.address);
  console.log("Club level deployed to:", clubLevel.address);
  console.log("Courtside deployed to:", courtside.address);

  const V2Tickets = await ethers.getContractFactory("KrauseTickets");
  const krauseTicketsContract = await V2Tickets.deploy(
    upperLevel.address,
    clubLevel.address,
    courtside.address
  );
  await krauseTicketsContract.deployed();
  console.log("KrauseTickets deployed to:", krauseTicketsContract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
