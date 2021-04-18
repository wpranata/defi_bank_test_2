App = {
    init: () => {
        // import Token.json manually (for them sweet ABIs)
        $.getJSON("Token.json", (data) => {
            App.TokenJSON = data;
        });

        // import Bank.json manually (for them sweet ABIs)
        $.getJSON("Bank.json", (data) => {
            App.BankJSON = data;
        });

        // onClick listener on 'deposit button'
        $("#btn_deposit").click(() => {
            amount = parseInt($("#txt_amount").val());
            amount *= 1e18;
            App.deposit(amount);
        });

        // onClick listener on 'withdraw button'
        $("#btn_withdraw").click(() => {
            App.withdraw();
        });
    },

    load: async() => {
        console.log("App loading...");
        await App.loadWeb3(); // async function: connect metamask, get blockchain network id
        App.getContracts(); // get token and bank smart contract
        await App.loadAccount(); // async function: get current account in metamask
        App.colog(); // console logs
        App.updateFrontEnd(); // update front end
    },

    loadWeb3: async() => {
        if (window.ethereum) { // check if ethereum browser/extension (such as metamask) exists
            await window.ethereum.enable(); // enable metamask (login, pick account, etc) (if not already)
            window.web3 = new Web3(window.ethereum); // create new web3 object
            window.netId = await window.web3.eth.net.getId(); // get blockchain network id

            // on metamask account change, reload window.currentAccount
            window.ethereum.on('accountsChanged', async() => {
                await App.loadAccount();
                App.updateFrontEnd();
            });
        } else {
            alert("Where Metamask");
        }
    },

    loadAccount: async() => {
        accounts = await window.web3.eth.getAccounts(); // get accounts
        window.currentAccount = accounts[0];

        window.currentBalance = await window.web3.eth.getBalance(window.currentAccount); // get account wei balance
        window.currentBalance /= 1e18; // convert wei to ether

        window.currentToken = await window.token.methods.balanceOf(window.currentAccount).call();
    },

    getContracts: () => {
        window.token = new window.web3.eth.Contract(App.TokenJSON.abi, App.TokenJSON.networks[window.netId].address); // load contract (ABI, location in blockchain)
        window.bankAddress = App.BankJSON.networks[window.netId].address // get contract location (address) in blockchain
        window.bank = new window.web3.eth.Contract(App.BankJSON.abi, window.bankAddress);
    },

    getAccounts: (callback) => {
        window.web3.eth.getAccounts((error, result) => {
            if (error) {
                console.log(error);
            } else {
                callback(result);
            }
        });
    },

    colog: () => {
        console.log("web3: ", window.web3);
        console.log("netId: ", window.netId);
        console.log("token: ", window.token);
        console.log("bank: ", window.bank)
        console.log("bank address: ", window.bankAddress)
        console.log("current account: ", window.currentAccount);
        console.log("current ether: ", window.currentBalance);
        console.log("current tokens: ", window.currentToken);
        App.test_getAccounts();
    },

    test_getAccounts: () => {
        console.log("Getting accounts...");
        App.getAccounts(async(result) => {
            for (let i = 0; i < result.length; i++) {
                const balance = await window.web3.eth.getBalance(result[i]);
                console.log("Account " + i + ": ", result[i], balance);

            }
        });
    },

    deposit: async(amount) => {
        console.log("Amount: ", amount);
        // calls bank's deposit method, send parameter values (value & from address)
        await window.bank.methods.deposit().send({ value: amount.toString(), from: window.currentAccount });
        await App.loadAccount();
        App.updateFrontEnd();
    },

    withdraw: async() => {
        // calls bank's withdraw method, send parameter values (from address)
        await window.bank.methods.withdraw().send({ from: window.currentAccount });
        await App.loadAccount();
        App.updateFrontEnd();
    },

    updateFrontEnd: () => {
        $("#account_id").html(window.currentAccount);
        $("#account_ether").html(window.currentBalance + " Ether");
        $("#account_token").html(window.currentToken + " TC3");
    }
}

$(window).on("load", () => {
    App.init();
    App.load();
});