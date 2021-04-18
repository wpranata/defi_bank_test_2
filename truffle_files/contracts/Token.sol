//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.0;

import "./../../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
    // the minter, account that mints new tokens
    address public minter;

    // fire when minter is changed, log search keyword using 'from' address
    event MinterChanged(address indexed from, address to);



    // constructor, call on deployment
    constructor() public payable ERC20("Testing Currency 3", "TC3") {
        minter = msg.sender;
    }

    // function to switch new minter
    function setMinter(address new_minter) public returns(bool){ 
        require(msg.sender == minter, "[!] Not a Minter!");
        minter = new_minter;

        emit MinterChanged(msg.sender, new_minter);
        return true;
    }

    // function to mint new tokens by minter only.
    function mint(address account, uint amount) public {
        require(msg.sender == minter, "[!] Not a Minter!");
        _mint(account, amount);
    }
}