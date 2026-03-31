//require("@nomiclabs/hardhat-ethers");
// require("@nomicfoundation/hardhat-toolbox");
// require("dotenv").config();

// module.exports = {
//   solidity: "0.8.20",
//   networks: {
//     scai: {
//       url: process.env.RPC_URL,
//       accounts: [process.env.PRIVATE_KEY],
//     },
//   },
// };

require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL;

module.exports = {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      url: RPC_URL,       // ✅ RPC from Alchemy/Infura
      accounts: [PRIVATE_KEY], // ✅ your wallet private key
    },
  },
};