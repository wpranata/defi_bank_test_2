require('chai')
    .use(require('chai-as-promised'))
    .should()

const wait = s => {
    const milliseconds = s * 1000
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

const EVM_REVERT = "VM Exception while processing transaction: revert";

const Token = artifacts.require("Token");
const Bank = artifacts.require("Bank");

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */

// create contract with accounts (left is deployer, right is user)
contract("Test", function([deployer, user]) {
    let token, bank;

    beforeEach(async() => {
        token = await Token.new();
        bank = await Bank.new(token.address);
        await token.setMinter(bank.address, { from: deployer });
    });

    it("Token contract should be deployed", async function() {
        await Token.deployed();
        return assert.isTrue(true);
    });

    it("Bank contract should be deployed", async function() {
        await Bank.deployed();
        return assert.isTrue(true);
    });

    describe('testing token contract...', () => {
        describe('success', () => {
            it('Token name should be Testing Currency 3', async() => {
                expect(await token.name()).to.be.eq('Testing Currency 3')
            });

            it('Token symbol should be TC3', async() => {
                expect(await token.symbol()).to.be.eq('TC3')
            });

            it('Token initial total supply should be 0', async() => {
                expect(Number(await token.totalSupply())).to.eq(0)
            });

            it('Bank should have Token minter role', async() => {
                expect(await token.minter()).to.eq(bank.address)
            });
        })

        describe('failure', () => {
            it('setMinter should be rejected, since Bank is the current minter.', async() => {
                await token.setMinter(user, { from: deployer }).should.be.rejectedWith(EVM_REVERT);
            });

            it('Tokens minting should be rejected, since Bank is the current minter.', async() => {
                await token.mint(user, '1', { from: deployer }).should.be.rejectedWith(EVM_REVERT); //unauthorized minter
            });
        });
    });

    describe('testing deposit...', () => {
        describe('success', () => {
            beforeEach(async() => {
                await bank.deposit({ value: 10 ** 16, from: user }) //0.01 ETH
            })

            it('balance should increase', async() => {
                expect(Number(await bank.etherBalanceOf(user))).to.eq(10 ** 16);
            })

            it('deposit time should > 0', async() => {
                expect(Number(await bank.depositStart(user))).to.be.above(0);
            })

            it('deposit status should eq true', async() => {
                expect(await bank.isDeposited(user)).to.eq(true);
            })
        })

        describe('failure', () => {
            it('deposits under 0.01 Ether should be rejected', async() => {
                await bank.deposit({ value: 10 ** 15, from: user }).should.be.rejectedWith(EVM_REVERT) //to small amount
            })
        })
    })

    describe('testing withdraw...', () => {
        let balance

        describe('success', () => {

            beforeEach(async() => {
                await bank.deposit({ value: 10 ** 16, from: user }) //0.01 ETH

                await wait(2) //accruing interest

                balance = await web3.eth.getBalance(user)
                await bank.withdraw({ from: user })
                interestPerSecond = 1;
            })

            it('balances should decrease', async() => {
                expect(Number(await web3.eth.getBalance(bank.address))).to.eq(0)
                expect(Number(await bank.etherBalanceOf(user))).to.eq(0)
            })

            it('user should receive ether back', async() => {
                expect(Number(await web3.eth.getBalance(user))).to.be.above(Number(balance))
            })

            it('user should receive proper amount of interest', async() => {
                //time synchronization problem make us check the 1-3s range for 2s deposit time
                balance = Number(await token.balanceOf(user))
                expect(balance).to.be.above(0)
                expect(balance % interestPerSecond).to.eq(0)
                expect(balance).to.be.below(interestPerSecond * 4)
            })

            it('depositer data should be reseted', async() => {
                expect(Number(await bank.depositStart(user))).to.eq(0)
                expect(Number(await bank.etherBalanceOf(user))).to.eq(0)
                expect(await bank.isDeposited(user)).to.eq(false)
            })
        })

        describe('failure', () => {
            it('withdrawing should be rejected', async() => {
                await bank.deposit({ value: 10 ** 16, from: user }) //0.01 ETH
                await wait(2) //accruing interest
                await bank.withdraw({ from: deployer }).should.be.rejectedWith(EVM_REVERT) //wrong user
            })
        })
    })
});