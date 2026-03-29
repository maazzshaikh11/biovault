# BioVault — Biometric-Secured Decentralized Wallet

BioVault is a full-stack, decentralized Ethereum wallet simulator built for the Sepolia Testnet. It replaces traditional seed phrases and passwords with device-native biometrics (Face ID/Touch ID) using the WebAuthn API (`@simplewebauthn`).

The application features a sleek, modern, dark-themed crypto UI fully implemented with React, Tailwind CSS, and ethers.js. 

---

## 🏗 Prerequisites

To run this application locally, you will need:
- Node.js (v18+ recommended)
- A Firebase Project (for storing WebAuthn credential IDs)
- An Alchemy or Infura account (for Sepolia RPC URL)
- A MetaMask wallet or similar with a Sepolia account (to export private key for contract deployment)

---

## ⚙️ Setup & Installation

### 1. Firebase Setup
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new project.
3. Navigate to **Project Settings > Service accounts**.
4. Click **Generate new private key** and download the JSON file.
5. In **Firestore Database**, create a new database in test mode (or configure secure rules). No actual biometrics or raw private keys are stored here — only WebAuthn `credentialID`, `publicKey`, and a counter.

### 2. Environment Variables

Create a `.env` file in the `backend/` directory:
```env
PORT=5001
FIREBASE_PROJECT_ID="your-firebase-project-id"
# Stringified JSON from your downloaded service account file:
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"..."}'
WEBAUTHN_RP_ID="localhost"
WEBAUTHN_RP_NAME="BioVault"
WEBAUTHN_ORIGIN="http://localhost:5173"
```

Create a `.env` file in the ROOT `biovault/` directory (for Hardhat):
```env
SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY"
HARDHAT_PRIVATE_KEY="your_wallet_private_key_without_0x"
```

Create a `.env` file in the `frontend/` directory:
```env
VITE_BACKEND_URL="http://localhost:5001/api/webauthn"
VITE_SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY"
```

### 3. Install Dependencies
In the root directory:
```bash
# Install Hardhat dependencies
npm install

# Install Backend dependencies
cd backend
npm install

# Install Frontend dependencies
cd ../frontend
npm install
```

---

## 🚀 Running the Application

### 1. Deploy Smart Contract to Sepolia
From the root directory (`/biovault`):
```bash
npx hardhat run ignition/modules/BioVault.js --network sepolia
```
*Note: Make sure your `.env` contains a valid private key loaded with Sepolia ETH.*

**Need Sepolia ETH?**
- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
- [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)
- [QuickNode Faucet](https://faucet.quicknode.com/ethereum/sepolia)

### 2. Start the Backend
```bash
cd backend
npm start
```
*Server will run on `http://localhost:5001`*

### 3. Start the Frontend
In a new terminal:
```bash
cd frontend
npm run dev
```
*App will run on `http://localhost:5173`*

---

## 🎮 Demo Walkthrough

### 1. Register a new wallet
- Open the app in your browser (Ensure you are on a device with biometric capabilities or a browser like Chrome that simulates WebAuthn).
- Enter a name/alias.
- Click **Register with Biometric**. Your device will prompt you for Face ID/Touch ID or a system pin.
- Once completed, a new secure ethers.js wallet is generated and encrypted.

### 2. Login
- On a fresh session, click **Authenticate** on the login screen.
- Verify your biometrics.
- The encrypted key is securely unlocked and loaded into session memory.

### 3. Vault & Dashboard
- View your newly generated Ethereum Sepolia address.
- Check your live ETH balance.
- *Bonus: Copy your address and send yourself some free testnet ETH from a faucet!*

### 4. Send Transaction
- Navigate to the **Send** tab.
- Enter a recipient address (e.g., your own MetaMask wallet address) and an amount.
- Click **Authorize strictly with Biometric & Send**.
- You will be prompted for authentication *again* to sign the transaction.
- Once authenticated, it is broadcasted to the Sepolia testnet.
- A success toast will appear with a direct link to view the transaction on Sepolia Etherscan!

---
*Built with React, Express, Hardhat, and the Web Authentication API.*
