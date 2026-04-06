import { CONTRACTS } from "./config.js";

let provider;
let signer;
let ethersProvider;

// ================= CONNECT WALLET =================
export async function connectWallet() {
  try {
    if (signer) return await signer.getAddress();

    // ✅ 1. Browser wallet (OKX / MetaMask)
    if (window.ethereum) {
      ethersProvider = new window.ethers.BrowserProvider(window.ethereum);

      // Request account
      await ethersProvider.send("eth_requestAccounts", []);

      // 🔥 Force Sepolia
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }] // Sepolia
      });

      signer = await ethersProvider.getSigner();

      // 🔍 DEBUG
      const address = await signer.getAddress();
      const balance = await ethersProvider.getBalance(address);

      console.log("✅ Connected (Browser):", address);
      console.log("💰 Balance:", window.ethers.formatEther(balance));

      return address;
    }

    // ✅ 2. WalletConnect (Telegram)
    const EthereumProvider = window.EthereumProvider;

    if (!EthereumProvider) {
      alert("WalletConnect not loaded");
      return null;
    }

    provider = await EthereumProvider.init({
      projectId: "2cdf3feb2a94aeea53e56d863bb42eb4",
      chains: [11155111], // ✅ Sepolia
      showQrModal: true,
      qrModalOptions: {
        themeMode: "dark"
      }
    });

    await provider.enable();

    // 🔥 Force Sepolia (WalletConnect)
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0xaa36a7" }]
    });

    ethersProvider = new window.ethers.BrowserProvider(provider);
    signer = await ethersProvider.getSigner();

    // 🔍 DEBUG
    const address = await signer.getAddress();
    const balance = await ethersProvider.getBalance(address);

    console.log("✅ Connected (WC):", address);
    console.log("💰 Balance:", window.ethers.formatEther(balance));

    return address;

  } catch (err) {
    console.error("❌ Wallet error:", err);
    alert("Wallet connection failed");
    return null;
  }
}

// ================= ENSURE SIGNER =================
async function getSigner() {
  if (!signer) {
    await connectWallet();
  }

  if (!signer) {
    throw new Error("Wallet not connected");
  }

  return signer;
}

// ================= BALANCE CHECK =================
async function checkBalance(bet) {
  const address = await signer.getAddress();
  const balance = await ethersProvider.getBalance(address);

  const required = window.ethers.parseEther(bet.toString());

  if (balance < required) {
    alert("❌ Not enough ETH\nBalance: " + window.ethers.formatEther(balance));
    throw new Error("Insufficient funds");
  }
}

// ================= COINFLIP =================
const coinflipABI = [
  "function placeBet(bool guess, bytes32 commitHash) payable",
  "function reveal(uint256 betId, string memory secret)",
  "event BetPlaced(uint256 betId, address player, uint amount, bool guess)",
  "event BetRevealed(uint256 betId, bool win, uint payout)"
];

export async function playCoinFlip(choice, bet) {
  const signer = await getSigner();

  await checkBalance(bet); // ✅ prevent error

  const contract = new window.ethers.Contract(
    CONTRACTS.coinflip,
    coinflipABI,
    signer
  );

  const secret = Math.random().toString(36).substring(2);

  const hash = window.ethers.keccak256(
    window.ethers.toUtf8Bytes(secret)
  );

  const tx = await contract.placeBet(choice, hash, {
    value: window.ethers.parseEther(bet.toString())
  });

  const receipt = await tx.wait();

  let betId;

  for (let log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed.name === "BetPlaced") {
        betId = parsed.args.betId;
      }
    } catch {}
  }

  await new Promise(r => setTimeout(r, 2500));

  const tx2 = await contract.reveal(betId, secret);
  const receipt2 = await tx2.wait();

  for (let log of receipt2.logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed.name === "BetRevealed") {
        return {
          win: parsed.args.win,
          amount: window.ethers.formatEther(parsed.args.payout)
        };
      }
    } catch {}
  }

  throw new Error("Result not found");
}

// ================= DICE =================
const diceABI = [
  "function play(uint choice) payable"
];

export async function playDice(choice, bet) {
  const signer = await getSigner();

  await checkBalance(bet);

  const contract = new window.ethers.Contract(
    CONTRACTS.dice,
    diceABI,
    signer
  );

  const tx = await contract.play(choice, {
    value: window.ethers.parseEther(bet.toString())
  });

  await tx.wait();
}

// ================= WHEEL =================
const wheelABI = [
  "function spin() payable",
  "event SpinResult(address player, uint index, uint multiplier, uint payout)"
];

export async function spinWheel(bet) {
  const signer = await getSigner();

  await checkBalance(bet);

  const contract = new window.ethers.Contract(
    CONTRACTS.wheel,
    wheelABI,
    signer
  );

  const tx = await contract.spin({
    value: window.ethers.parseEther(bet.toString())
  });

  const receipt = await tx.wait();

  for (let log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed.name === "SpinResult") {
        return {
          index: Number(parsed.args.index),
          multiplier: Number(parsed.args.multiplier),
          payout: window.ethers.formatEther(parsed.args.payout)
        };
      }
    } catch {}
  }
}

// ================= KING =================
const kingABI = [
  "function play(uint guessIndex) payable"
];

export async function playKing(choice, bet) {
  const signer = await getSigner();

  await checkBalance(bet);

  const contract = new window.ethers.Contract(
    CONTRACTS.king,
    kingABI,
    signer
  );

  const tx = await contract.play(choice, {
    value: window.ethers.parseEther(bet.toString())
  });

  const receipt = await tx.wait();

  return receipt;
}