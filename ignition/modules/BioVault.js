const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer ? deployer.address : "No account available. Check SEPOLIA_RPC_URL and HARDHAT_PRIVATE_KEY");

  // Since it's a testnet deployment, let's only proceed if an account exists
  if (deployer) {
    const BioVault = await hre.ethers.getContractFactory("BioVault");
    const bioVault = await BioVault.deploy();
  
    await bioVault.waitForDeployment();
  
    console.log(`BioVault deployed to: ${bioVault.target}`);
    
    // Save address for frontend use
    const fs = require('fs');
    if (!fs.existsSync('./frontend/src/contracts')) {
      fs.mkdirSync('./frontend/src/contracts', { recursive: true });
    }
    fs.writeFileSync('./frontend/src/contracts/address.js', `export const BIOVAULT_ADDRESS = "${bioVault.target}";\n`);
    
    // Note: To compile ABI for frontend, you need to run: `npx hardhat compile`
    // And ideally copy the ABI from artifacts to the frontend.
  } else {
    console.log("Skipping actual deployment because no private key was provided in .env");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
