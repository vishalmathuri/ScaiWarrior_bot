import { CONTRACTS } from "./config.js";

let provider;
let signer;
let ethersProvider;

// ================= CONNECT WALLET =================
export async function connectWallet() {
  try {
    if (signer) return await signer.getAddress();

    const isTelegram = window.Telegram?.WebApp;
    console.log("Is Telegram:", isTelegram);

    // ================= BROWSER WALLET =================
    if (window.ethereum && !isTelegram) {
      ethersProvider = new window.ethers.BrowserProvider(window.ethereum);

      await ethersProvider.send("eth_requestAccounts", []);

      // ✅ Force Sepolia
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }]
      });

      signer = await ethersProvider.getSigner();

      const address = await signer.getAddress();
      const balance = await ethersProvider.getBalance(address);

      console.log("✅ Browser wallet connected:", address);
      console.log("💰 Balance:", window.ethers.formatEther(balance));

      return address;
    }

    // ================= WALLETCONNECT (TELEGRAM) =================
    const EthereumProvider = window.EthereumProvider;

    if (!EthereumProvider) {
      alert("WalletConnect not loaded");
      return null;
    }

    provider = await EthereumProvider.init({
      projectId: "2cdf3feb2a94aeea53e56d863bb42eb4",
      chains: [11155111], // Sepolia
      showQrModal: true,
      qrModalOptions: {
        themeMode: "dark"
      }
    });

    await provider.enable();

    // ✅ Force Sepolia
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0xaa36a7" }]
    });

    ethersProvider = new window.ethers.BrowserProvider(provider);
    signer = await ethersProvider.getSigner();

    const address = await signer.getAddress();
    const balance = await ethersProvider.getBalance(address);

    console.log("✅ WalletConnect used (Telegram):", address);
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

  if (betId === undefined) throw new Error("Bet ID not found");

  await new Promise((r) => setTimeout(r, 2500));

  const tx2 = await contract.reveal(betId, secret);
  const receipt2 = await tx2.wait();

  for (let log of receipt2.logs) {
    try {
      const parsed = contract.interface.parseLog(log);

      if (parsed.name === "BetRevealed") {
        return {
          betId: betId.toString(),
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
  "function play(uint choice) payable",
  "event DicePlayed(address player, uint bet, uint dice1, uint dice2, uint total, uint choice, bool win)"
];

export async function playDice(choice, bet) {
  const signer = await getSigner();

  if (choice === undefined || choice === null) {
    alert("Please select a choice");
    return;
  }

  if (!bet || bet <= 0) {
    alert("Enter valid bet");
    return;
  }

  const contract = new window.ethers.Contract(
    CONTRACTS.dice,
    diceABI,
    signer
  );

  try {
    const tx = await contract.play(choice, {
      value: window.ethers.parseEther(bet.toString())
    });

    const receipt = await tx.wait();

    // Parse DicePlayed event directly from receipt
    for (let log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);

        if (parsed.name === "DicePlayed") {
          return {
            d1: Number(parsed.args.dice1),
            d2: Number(parsed.args.dice2),
            total: Number(parsed.args.total),
            choice: Number(parsed.args.choice),
            win: parsed.args.win,
            amount: window.ethers.formatEther(parsed.args.bet)
          };
        }
      } catch {}
    }

    throw new Error("Dice result not found");

  } catch (err) {
    console.error("❌ Dice error:", err);

    alert(
      err.reason ||
      err.shortMessage ||
      err.message ||
      "Transaction failed"
    );

    throw err;
  }
}

// ================= WHEEL =================
const wheelABI = [
  "function spin() payable",
  "event SpinResult(address player, uint index, uint multiplier, uint payout)"
];

export async function spinWheel(bet) {
  const signer = await getSigner();

  const contract = new window.ethers.Contract(
    CONTRACTS.wheel,
    wheelABI,
    signer
  );

  try {
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
            payout: window.ethers.formatEther(parsed.args.payout),
            win: Number(parsed.args.multiplier) > 0
          };
        }
      } catch {}
    }

    throw new Error("Event not found");

  } catch (err) {
    console.error("Wheel Error:", err);
    alert("❌ Transaction failed");
    throw err;
  }
}

// ================= KING =================
const kingABI = [
  "function play(uint guessIndex) payable",
  "event Played(address player, uint bet, uint kingIndex, uint guess, bool win)"
];

export async function playKing(choice, bet) {
  const signer = await getSigner();

  const contract = new window.ethers.Contract(
    CONTRACTS.king,
    kingABI,
    signer
  );

  try {
    const cleanChoice = parseInt(choice);
    const cleanBet = parseFloat(bet);

    if (cleanChoice < 0 || cleanChoice > 2) {
      alert("❌ Invalid card selected");
      throw new Error("Invalid index");
    }

    if (!cleanBet || cleanBet <= 0) {
      alert("❌ Enter valid bet");
      throw new Error("Invalid bet");
    }

    const tx = await contract.play(cleanChoice, {
      value: window.ethers.parseEther(cleanBet.toString())
    });

    const receipt = await tx.wait();

    for (let log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);

        if (parsed.name === "Played") {
          return {
            kingIndex: Number(parsed.args.kingIndex),
            guess: Number(parsed.args.guess),
            win: parsed.args.win
          };
        }
      } catch {}
    }

    throw new Error("Result not found");

  } catch (err) {
    console.error("❌ King Error:", err);
    alert(err.message || "Transaction failed");
    throw err;
  }
}