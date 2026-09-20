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

const networks = {};

if (RPC_URL) {
  networks.sepolia = {
    url: RPC_URL,
    accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
  };
}

module.exports = {
  solidity: "0.8.20",
  networks,
};
