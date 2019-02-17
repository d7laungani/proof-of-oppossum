import React, {Component} from 'react';
import Fortmatic from 'fortmatic';
import Web3 from 'web3';

import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Divider from '@material-ui/core/Divider';


const StatusJS = require('status-js-api');
const status = new StatusJS();
const fm = new Fortmatic('pk_test_22FF0DC077139278');

const LEADERBOARD_ABI = require('../../LeaderBoard')
const CONTRACT_ADDRESS = '0x48F813F80A36F86d0F1e62096dE5a155FaA7B046'
const STATUS_NODE = 'http://35.188.163.32:8545'



const styles = theme => ({
    button: {
        margin: theme.spacing.unit,
    },
    input: {
        display: 'none',
    },
});




export default class Home extends Component {

    constructor (props) {
       super(props)

        this.state = {

            accounts: [
                "poop",
                "poop1"
            ]
        }

       this.connectWeb3ToWindow()
    }

    connectWeb3ToWindow () {

        this.web3 = new Web3(fm.getProvider())
    }




    render() {
        return (
            <div>
                <div style={{marginVertical: '6%'}} >
                    <Button variant="contained" color="secondary" onClick={() => this.callLoginProvider()}>
                        Log In
                    </Button>
                </div>
                <Divider variant="middle" />

                <h2> Leaderboard </h2>
                <div style={{display: 'flex', justifyContent: 'center'}}>
                    <List component="nav" style={{width: '30%'}}>
                        {this.state.accounts.map(account => (
                            <ListItem key={account}>
                                <ListItemText primary={account} />
                                <Button variant="contained" color="primary" onClick={() => this.callLoginProvider()}>
                                Vote
                                </Button>
                            </ListItem>
                        ))}
                    </List>
                 </div>
            </div>
        )

    }


    async callLoginProvider () {


        let result = await this.web3.currentProvider.enable();

        let account = result[0]
        this.getSignedData(account)

        this.setState({account: account})
    }


    async getSignedData(account) {
        const from = account;
        const msg = [
            {
                type: 'string',
                name: 'fullName',
                value: 'Logging into POO with Fortmatic.'
            }
        ];

        const params = [msg, from];
        const method = 'eth_signTypedData';


        let web3Internal = this.web3

        const result = await new Promise (function (resolve, reject) {
            web3Internal.currentProvider.sendAsync({
                id: 1,
                method,
                params
            }, function(error, result) {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            })
        })

        const loginHash = result.result.slice(0, 66);
        this.getStatusName(loginHash)





    }
    async getStatusName(loginHash) {

        let provider = STATUS_NODE
        await status.connect(provider, loginHash);


        const publicKey = await status.getPublicKey();
        const userName = await status.getUserName();

        console.log('public key is ', publicKey)
        console.log('username is ', userName)
        const userNameHex =  this.web3.utils.fromAscii(userName)

        const contract = await new this.web3.eth.Contract(LEADERBOARD_ABI.abi, CONTRACT_ADDRESS)

        // Register new user on blockchain


        //contract.methods.newStatusName(userNameHex).call().then(result =>  {console.log('here')});

        //let result =  contract.methods.tokenMint().send({from:this.state.account})
        // using the event emitter
        contract.methods.tokenMint().send({from: this.state.account}).then((receipt) => {
            console.log('receipt is ', receipt)
        })




        /*
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

