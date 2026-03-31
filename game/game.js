import { CONTRACTS } from "./config.js";

// ================= GLOBAL =================
let provider;
let signer;

// ================= CONNECT WALLET =================
export async function connectWallet() {
  if (!window.ethereum) {
    alert("Install MetaMask");
    return null;
  }

  provider = new window.ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();

  return await signer.getAddress();
}

// ================= ENSURE SIGNER =================
async function getSigner() {
  if (!signer) {
    await connectWallet();
  }
  return signer;
}

// ================= COINFLIP ABI =================
// ================= COINFLIP ABI =================
// ================= COINFLIP ABI =================
const coinflipABI = [
  "function placeBet(bool guess, bytes32 commitHash) payable",
  "function reveal(uint256 betId, string memory secret)",
  "event BetPlaced(uint256 betId, address player, uint amount, bool guess)",
  "event BetRevealed(uint256 betId, bool win, uint payout)"
];

// ================= PLAY COINFLIP =================
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

  // 🎯 PLACE BET
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

  // ⏳ small delay
  await new Promise((r) => setTimeout(r, 2500));

  // 🎯 REVEAL
  const tx2 = await contract.reveal(betId, secret);
  const receipt2 = await tx2.wait();

  // ✅ GET RESULT DIRECTLY
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


// ================= DICE ABI =================
const diceABI = [
  "function play(uint choice) payable",
  "event DicePlayed(address player, uint bet, uint dice1, uint dice2, uint total, uint choice, bool win)"
];

// ================= PLAY DICE =================
// ================= PLAY DICE =================
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

  console.log("🎲 Playing Dice");
  console.log("Choice:", choice);
  console.log("Bet:", bet);

  const contract = new window.ethers.Contract(
    CONTRACTS.dice,
    diceABI,
    signer
  );

  try {
    const tx = await contract.play(choice, {
      value: window.ethers.parseEther(bet.toString())
    });

    console.log("TX sent:", tx.hash);

    await tx.wait();

    console.log("✅ Dice played successfully");

  } catch (err) {
    console.error("❌ Dice error:", err);
    alert("Transaction failed");
    throw err;
  }
}

// ================= LISTEN DICE =================
export function listenDiceResult(callback) {
  const provider = new window.ethers.BrowserProvider(window.ethereum);

  const contract = new window.ethers.Contract(
    CONTRACTS.dice,
    diceABI,
    provider
  );

  contract.on(
    "DicePlayed",
    (player, bet, d1, d2, total, choice, win) => {
      callback({
        d1,
        d2,
        total,
        win,
        amount: window.ethers.formatEther(bet)
      });
    }
  );
}

// ================= WHEEL ABI =================
const wheelABI = [
  "function spin() payable",
  "event SpinResult(address player, uint index, uint multiplier, uint payout)"
];

// ================= SPIN WHEEL =================
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

    // ❌ If reverted (extra safety)
    if (receipt.status === 0) {
      throw new Error("Transaction reverted");
    }

    // 🔥 READ EVENT
    for (let log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);

        if (parsed.name === "SpinResult") {
          return {
            index: Number(parsed.args.index),
            multiplier: Number(parsed.args.multiplier),
            payout: window.ethers.formatEther(parsed.args.payout),

            // ✅ FIXED LOGIC
            win: Number(parsed.args.multiplier) > 0
          };
        }
      } catch (e) {}
    }

    throw new Error("Event not found");

  } catch (err) {
    console.error("Wheel Error:", err);

    // 🔥 USER FRIENDLY ERROR
    alert("❌ Transaction failed or reverted");

    throw err;
  }
}

// ================= ABI =================
const kingABI = [
  "function play(uint guessIndex) payable",
  "event Played(address player, uint bet, uint kingIndex, uint guess, bool win)"
];

// ================= PLAY KING =================
// ================= PLAY KING =================
export async function playKing(choice, bet) {
  const signer = await getSigner();

  const contract = new window.ethers.Contract(
    CONTRACTS.king,
    kingABI,
    signer
  );

  try {
    // ✅ FORCE CLEAN INPUTS
    const cleanChoice = parseInt(choice);
    const cleanBet = parseFloat(bet);

    console.log("👉 Raw choice:", choice);
    console.log("👉 Clean choice:", cleanChoice);
    console.log("👉 Bet:", cleanBet);

    // ✅ STRICT VALIDATION (PREVENT REVERT)
    if (cleanChoice === undefined || cleanChoice === null || cleanChoice < 0 || cleanChoice > 2) {
      alert("❌ Invalid card selected");
      throw new Error("Invalid index");
    }

    if (!cleanBet || cleanBet <= 0) {
      alert("❌ Enter valid bet");
      throw new Error("Invalid bet");
    }

    // ✅ SEND TX
    const tx = await contract.play(cleanChoice, {
      value: window.ethers.parseEther(cleanBet.toString())
    });

    console.log("⏳ Waiting...");
    const receipt = await tx.wait();

    if (receipt.status === 0) {
      throw new Error("Transaction reverted");
    }

    // ✅ READ RESULT
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