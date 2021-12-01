const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());
const {interface, bytecode} = require('../compile');

let lottery, accounts;

beforeEach(async() => {
    accounts = await web3.eth.getAccounts();

    lottery = await new web3.eth.Contract(JSON.parse(interface))
        .deploy({data: bytecode})
        .send({from: accounts[0], gas: '1000000'});
});

describe('Lottery Testing', () => {
    it('Deploy the Contract!', () => {
        assert.ok(lottery.options.address);
    });

    it('Check Manager Details', async () => {
        let manager = await lottery.methods.manager.call();
        console.log(manager);
        console.log(accounts[0]);
        assert.equal(manager, accounts[0]);
    })

    it('Enter into the Lottery!', async() => {
        await lottery.methods.enterLottery().send({
            from: accounts[1],
            value: web3.utils.toWei('0.011', 'ether')
        });
        let players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        });
        assert.equal(accounts[1], players[0]);
        assert.equal(1,players.length);
    });

    it('Requires minimum amount to enter into lottery!', async() => {
        try {
            await lottery.methods.enterLottery().send({
                from: accounts[0],
                value: 0
            });
            assert(false);
        } catch (error) {
            assert(error);
        }
    });

    it('Only manager can Select winner!', async() => {
        try {
            await lottery.methods.selectWinner().send({
                from: accounts[1]
            });
            assert(false);
        } catch (error) {
            assert(error);
        }
    });

    it('Transfer Money to Winner!', async() => {
        await lottery.methods.enterLottery().send({
            from: accounts[1],
            value: web3.utils.toWei('9', 'ether')
        });

        let initialBalance = await web3.eth.getBalance(accounts[1]);

        await lottery.methods.selectWinner().send({
            from: accounts[0]
        });

        let finalBalance = await web3.eth.getBalance(accounts[1]);
        let balDifference = finalBalance - initialBalance;

        assert(balDifference > web3.utils.toWei('8.8', 'ether'));
    })
});