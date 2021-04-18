const Token = artifacts.require("Token");
const Bank = artifacts.require("Bank");

module.exports = async function(deployer) {
    // Deploy token contract
    await deployer.deploy(Token);

    // Deploy bank contract, pass token address
    const token = await Token.deployed();
    await deployer.deploy(Bank, token.address);

    // Set minter to bank contract
    const bank = await Bank.deployed();
    await token.setMinter(bank.address);
}