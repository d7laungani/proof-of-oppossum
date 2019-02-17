import React, { Component } from "react";
import Fortmatic from "fortmatic";
import Web3 from "web3";

import { withStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import Divider from "@material-ui/core/Divider";

import ApolloClient, { gql, InMemoryCache } from "apollo-boost";
import { ApolloProvider, Query } from "react-apollo";

const StatusJS = require("status-js-api");
const status = new StatusJS();
const fm = new Fortmatic("pk_test_22FF0DC077139278");

const LEADERBOARD_ABI = require("../../LeaderBoard");
const CONTRACT_ADDRESS = "0x36746466833222e25E23a48a92906e474818d9d0";
const STATUS_NODE = "http://35.188.163.32:8545";

if (!process.env.REACT_APP_GRAPHQL_ENDPOINT) {
    throw new Error(
        "REACT_APP_GRAPHQL_ENDPOINT environment variable not defined"
    );
}

const client = new ApolloClient({
    uri: process.env.REACT_APP_GRAPHQL_ENDPOINT,
    cache: new InMemoryCache()
});

const GET_NAMES = gql`
    {
        statusNames {
            owner
            displayName
            amount
            id
        }
    }
`;

const styles = theme => ({
    button: {
        margin: theme.spacing.unit
    },
    input: {
        display: "none"
    }
});

export default class Home extends Component {
    constructor(props) {
        super(props);

        this.state = {
            accounts: ["poop", "poop1"]
        };

        this.connectWeb3ToWindow();
    }

    connectWeb3ToWindow() {
        this.web3 = new Web3(fm.getProvider());
    }

    render() {
        return (
            <ApolloProvider client={client}>
                <div>
                    <div style={{ marginVertical: "6%" }}>
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={() => this.callLoginProvider()}
                        >
                            Log In
                        </Button>
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={() => this.logOut()}
                        >
                            Log Out
                        </Button>
                    </div>
                    <Divider variant="middle" />

                    <h2> Leaderboard </h2>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                        <List component="nav" style={{ width: "30%" }}>
                            <Query query={GET_NAMES}>
                                {({ loading, error, data }) => {
                                    if (loading) return "Loading...";
                                    if (error) return `Error! ${error.message}`;

                                    console.log(data);
                                    return (
                                        <div>
                                            {data.statusNames.map(account => (
                                                <ListItem
                                                    key={
                                                        account.owner +
                                                        Math.random() * 0.018
                                                    }
                                                >
                                                    <ListItemText
                                                        primary={this.web3.utils.hexToAscii(
                                                            account.displayName
                                                        )}
                                                    />
                                                    <ListItemText
                                                        primary={account.amount}
                                                    />
                                                    <Button
                                                        variant="contained"
                                                        color="primary"
                                                        onClick={() =>
                                                            this.voteForAccount(
                                                                account
                                                            )
                                                        }
                                                    >
                                                        Vote
                                                    </Button>
                                                </ListItem>
                                            ))}
                                        </div>
                                    );
                                }}
                            </Query>
                        </List>
                    </div>
                </div>
            </ApolloProvider>
        );
    }

    async voteForAccount(data) {
        console.log("data is ", data);
        let result = await this.web3.currentProvider.enable();

        let account = result[0];

        this.setState({ account: account });
        console.log("account is ", account);
        const accountId = this.web3.utils.hexToNumber(data.id);

        const contract = await new this.web3.eth.Contract(
            LEADERBOARD_ABI.abi,
            CONTRACT_ADDRESS
        );

        // Register new user on blockchain

        contract.methods
            .vote(accountId)
            .send({ from: this.state.account })
            .then(receipt => {
                console.log("receipt is ", receipt);
            });
    }

    async callLoginProvider() {
        let result = await this.web3.currentProvider.enable();

        let account = result[0];
        this.getSignedData(account);

        this.setState({ account: account });
    }

    logOut() {
        fm.user.logout();
    }

    async getSignedData(account) {
        const from = account;
        const msg = [
            {
                type: "string",
                name: "fullName",
                value: "Logging into POO with Fortmatic."
            }
        ];

        const params = [msg, from];
        const method = "eth_signTypedData";

        let web3Internal = this.web3;

        const result = await new Promise(function(resolve, reject) {
            web3Internal.currentProvider.sendAsync(
                {
                    id: 1,
                    method,
                    params
                },
                function(error, result) {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }
            );
        });

        const loginHash = result.result.slice(0, 66);
        this.getStatusName(loginHash);
    }
    async getStatusName(loginHash) {
        let provider = STATUS_NODE;
        await status.connect(provider, loginHash);

        const publicKey = await status.getPublicKey();
        const userName = await status.getUserName();

        this.setState({ username: userName });
        console.log("public key is ", publicKey);
        console.log("username is ", userName);
        const userNameHex = this.web3.utils.fromAscii(userName);

        const contract = await new this.web3.eth.Contract(
            LEADERBOARD_ABI.abi,
            CONTRACT_ADDRESS
        );

        // Register new user on blockchain

        contract.methods
            .newStatusName(userNameHex)
            .send({ from: this.state.account })
            .then(receipt => {
                console.log("receipt is ", receipt);
            });

        //contract.methods.newStatusName(userNameHex).call().then(result =>  {console.log('here')});

        //let result =  contract.methods.tokenMint().send({from:this.state.account})
        // using the event emitter

        contract.methods
            .newStatusName(userNameHex)
            .send({ from: this.state.account })
            .then(receipt => {
                console.log("receipt is ", receipt);
            });

        /*

        contract.methods.tokenMint().send({from: this.state.account}).then((receipt) => {
            console.log('receipt is ', receipt)
        })

        const tokenContract = this.web3.eth.contract(LEADERBOARD_ABI.abi)

        const tokenContractInstance = tokenContract.at(CONTRACT_ADDRESS);

        tokenContractInstance.tokenMint.call(function(error, result) {
            if (error) throw error;
            console.log(result);
        });

        tokenContractInstance.newStatusName(userNameHex).call(function(error, result) {
            if (error) throw error;
            console.log(result);
        });

*/
        /*
        const contract = await new this.web3.eth.Contract(LEADERBOARD_ABI.abi, CONTRACT_ADDRESS)

        // Register new user on blockchain


        //contract.methods.newStatusName(userNameHex).call().then(result =>  {console.log('here')});

        let result =  contract.methods.tokenMint().send({from:this.state.account})
        console.log('result is ', result)
        /*
        let result = contract.methods['newStatusName'].setValue(
            userNameHex,
        ).send({from:this.state.account})
            .once('transactionHash', (hash) => { console.log(hash); })
            .once('receipt', (receipt) => { console.log(receipt); });
  console.log('result is ', result)
        */

        // Mint initial tokens manually

        /*
        let result1 = await contract.methods['tokenMint']()
            .send({from : this.state.account })

        console.log('result1 is ', result1)

        */
    }
}
