import { ethers } from 'ethers';

// Helper to encrypt a string (private key) using a key (credentialId)
// Simple XOR encryption for demonstration. In a real application, use a strong Crypto API algorithm (AES-GCM).
// WebAuthn's PRF extension is ideal for this, but standard WebAuthn doesn't guarantee key export.
// For this demo, we use the credentialID as a static key to AES encrypt the wallet.
function encryptData(text, key) {
  // Using a simple deterministic mechanism for the sake of the demo
  // WARNING: This is basic and not truly secure crypto without PRF/WebCrypto AES.
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result);
}

function decryptData(encodedText, key) {
  const text = atob(encodedText);
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

export async function createEncryptedWallet(credentialId) {
  // Generate a random wallet
  const wallet = ethers.Wallet.createRandom();
  
  // Encrypt the private key with the credentialId (biometric session key)
  const encryptedKey = encryptData(wallet.privateKey, credentialId);
  
  return {
    address: wallet.address,
    encryptedKey
  };
}

export function loadWallet(encryptedKey, credentialId) {
  try {
    const privateKey = decryptData(encryptedKey, credentialId);
    return new ethers.Wallet(privateKey);
  } catch (e) {
    throw new Error("Failed to decrypt wallet. Invalid credential.");
  }
}

export async function getProvider() {
  const rpcUrl = import.meta.env.VITE_SEPOLIA_RPC_URL || "https://rpc.sepolia.org";
  return new ethers.JsonRpcProvider(rpcUrl);
}

export async function sendTransaction(wallet, toAddress, amountInEth) {
  const provider = await getProvider();
  const connectedWallet = wallet.connect(provider);

  const tx = {
    to: toAddress,
    value: ethers.parseEther(amountInEth.toString()),
  };

  const transactionResponse = await connectedWallet.sendTransaction(tx);
  // Wait for 1 confirmation
  const receipt = await transactionResponse.wait(1);
  return receipt;
}

export async function getBalance(address) {
  const provider = await getProvider();
  const balanceWei = await provider.getBalance(address);
  return ethers.formatEther(balanceWei);
}
