//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.0;

import "./Token.sol";

contract Bank {
    // token contract
    Token private token;

    // deposit event
    event Deposit(address indexed user, uint amount, uint start);
    event Withdraw(address indexed user, uint amount, uint time, uint interest);

    // mapping amount of currency (account address -> amount of ether)
    mapping(address => uint) public etherBalanceOf;

    // mapping deposit start time (account address -> start time)
    mapping(address => uint) public depositStart;

    // mapping account is depositing (account address -> is deposit?)
    mapping(address => bool) public isDeposited;

    // constructor, call on deployment
    constructor(Token _token) public {
        token = _token;
    }

    // deposit function:
    // balance Up
    // start time set
    // isDeposited = true
    // *note: msg.value is in Wei (1 Ether = 10^18 Wei)
    function deposit() payable public {
        require(isDeposited[msg.sender] == false, "[!] Already deposited!");
        require(msg.value >= 1e16, "[!] Min. amount 0.01 Ether (10^16 Wei)!");

        // balance Up
        etherBalanceOf[msg.sender] += msg.value;

        // start time set
        depositStart[msg.sender] = block.timestamp;

        // isDeposited = true
        isDeposited[msg.sender] = true;

        emit Deposit(msg.sender, msg.value, block.timestamp);
    }

    // Withdraw function:
    // calculate interest
    // send deposit back
    // mint interest as new tokens
    // reset data
    // *note: let interest per second = 1, just cause :)
    function withdraw() public {
        require(isDeposited[msg.sender] == true, "[!] No ongoing deposits!");
        address payable caller = payable(msg.sender);

        uint userBalance = etherBalanceOf[caller];
        uint depositTime = block.timestamp - depositStart[caller];

        // calculate interest
        uint IPS = 1;
        uint totalInterest = depositTime * IPS;

        // send deposit back
        
        caller.transfer(userBalance);

        // mint interest as new tokens
        token.mint(caller, totalInterest);

        // reset data
        etherBalanceOf[caller] = 0;
        depositStart[caller] = 0;
        isDeposited[caller] = false;

        emit Withdraw(caller, userBalance, depositTime, totalInterest);
    }
}