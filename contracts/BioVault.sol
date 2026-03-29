// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract BioVault {
    address public owner;
    
    // Mapping of registered user wallet addresses
    mapping(address => bool) public isRegisteredWallet;

    // Events
    event WalletRegistered(address indexed walletAddress);
    event TransferExecuted(address indexed from, address indexed to, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    // Explicitly allow the contract to receive ETH
    receive() external payable {}
    fallback() external payable {}

    // Register a new wallet
    function registerWallet(address walletAddress) external {
        // Anyone can register a wallet for simplicity in this demo,
        // but in a production app, the backend would typically control this or use signatures.
        require(!isRegisteredWallet[walletAddress], "Wallet already registered");
        isRegisteredWallet[walletAddress] = true;
        emit WalletRegistered(walletAddress);
    }

    // Check if a wallet is registered
    function checkRegistration(address walletAddress) external view returns (bool) {
        return isRegisteredWallet[walletAddress];
    }
}
