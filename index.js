const { ethers } = require("ethers");
const config = require("./config")

const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);

const wallet = new ethers.Wallet(config.privateKey.trim(), provider);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const convertToHexa = (str = '') =>{
   const res = [];
   const { length: len } = str;
   for (let n = 0, l = len; n < l; n ++) {
      const hex = Number(str.charCodeAt(n)).toString(16);
      res.push(hex);
   };
   return `0x${res.join('')}`;
}

async function getCurrentNonce(wallet) {
  try {
    const nonce = await wallet.getTransactionCount("pending");
    console.log("Nonce:", nonce);
    return nonce;
  } catch (error) {
    console.error("Error fetching nonce:", error.message);
    throw error;
  }
}

async function getGasPrice() {
  const gasPrice = await provider.getGasPrice();
  return gasPrice;
}

async function getGasLimit(hexData, address) {
  const gasLimit = await provider.estimateGas({
    to: address,
    value: ethers.utils.parseEther("0"),
    data: hexData,
  });

  return gasLimit.toNumber();
}

async function sendTransaction(nonce) {
  const hexData	= convertToHexa(config.tokenJson.trim());
  const currentGasPrice = await getGasPrice();
  const gasMultiple = parseInt(String(config.increaseGas * 100))
  const increasedGasPrice = currentGasPrice.div(100).mul(gasMultiple);
  let address = await wallet.getAddress();
  if (config.receiveAddress !== "") {
    address = config.receiveAddress;
  }
  const gasLimit = await getGasLimit(hexData, address);
  const payPrice = config.payPrice

  const transaction = {
    to: address,
    value: ethers.utils.parseEther(payPrice),
    data: hexData,
    nonce: nonce,
    gasPrice: increasedGasPrice,
    gasLimit: gasLimit,
  };

  try {
    const tx = await wallet.sendTransaction(transaction);
    console.log(`Transaction with nonce ${nonce} hash:`, tx.hash);
  } catch (error) {
    console.error(`Error in transaction with nonce ${nonce}:`, error.message);
  }
}

async function sendTransactions() {
  const currentNonce = await getCurrentNonce(wallet);
  const sleepTime = config.sleepTime

  for (let i = 0; i < config.repeatCount; i++) {
    const gasPrice = await getGasPrice();
    await sendTransaction(currentNonce + i, gasPrice);
    await sleep(sleepTime)
  }
}

sendTransactions();
