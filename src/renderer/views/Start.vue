<template>
    <div id="start">
        <Toolbar @on-minify="minifyWindow()" @on-close="closeWindow()"></Toolbar>

        <div class="windowContent">
            <h3>EUNO• payout program is running</h3>

            <div>
                <input type="checkbox" v-model="localSettings.enablePayout"> Enable payouts
            </div>

            <button @click="openSettings()">Open settings</button>
            <button @click="fetchUnspents()">Fetch unspents</button>
        </div>
    </div>
</template>

<script>
    import log from 'electron-log'
    import {ipcRenderer} from 'electron'
    import storage from 'electron-json-storage';
    import RpcClient from 'bitcoind-rpc-client';
    import _ from 'underscore';
    import constants from "../constants";
    import Toolbar from "../components/Toolbar";

    export default {
        name: 'Start',
        components: {Toolbar},
        data(){
            return {
                localSettings: {
                    enablePayout: false
                }
            }
        },
        mounted(){
            this.fetchUnspents();
        },
        methods: {
            openSettings(){
                ipcRenderer.send('openSettingsScreen', true);
            },
            fetchUnspents(){
                let self = this;

                storage.has('eunoPayoutSettings', async function(error, hasKey) {
                    if (error) throw error;

                    if (hasKey)
                    {
                        storage.get('eunoPayoutSettings', async function(error, data) {
                            if (error) throw error;

                            const client = new RpcClient({
                                host: data.host,
                                port: data.port
                            });
                            client.set('user', data.rpcUser);
                            client.set('pass', data.rpcPassword);

                            let result = false;

                            try {
                                result = await client.cmd('listunspent', 16);
                            } catch (error) {
                                result = error;
                            }

                            if(result.error === null)
                            {
                                let rewards = _.filter(result.result, (unspent)=>{
                                    return parseInt(parseFloat(unspent.amount).toFixed(0)) === 30
                                });

                                console.log(rewards);

                                if(self.localSettings.enablePayout === false)
                                    return true;

                                let sortedTxPerAddress = {};
                                _.each(rewards, (r)=>{
                                    if(typeof sortedTxPerAddress[r.address] === 'undefined'){
                                        sortedTxPerAddress[r.address] = [];
                                    }

                                    sortedTxPerAddress[r.address].push(r);
                                });

                                if(Object.keys(sortedTxPerAddress).length > 0)
                                {
                                    let inputCollection = [];
                                    let totalCoins = 0;

                                    _.each(sortedTxPerAddress, (txs, address)=>{
                                        _.each(txs, (tx)=>{
                                            totalCoins += tx.amount;

                                            inputCollection.push({
                                                txid: tx.txid,
                                                vout: tx.vout
                                            });
                                        });

                                        totalCoins -= constants.feeAmount;
                                    });

                                    if(!data.payoutAddress)
                                    {
                                        new Notification('No payout address provided', {
                                            body: 'Please go to settings and fill in your payout address!'
                                        });
                                        return true;
                                    }

                                    let toAddress = {};
                                    toAddress[data.payoutAddress] = totalCoins;

                                    let rawTx = false;

                                    try {
                                        rawTx = await client.cmd('createrawtransaction', inputCollection, toAddress);
                                    } catch (error) {
                                        rawTx = error;
                                    }

                                    if(typeof rawTx.result !== 'undefined')
                                    {
                                        let signRawTx = false;

                                        try {
                                            signRawTx = await client.cmd('signrawtransaction', rawTx.result);
                                        } catch (error) {
                                            signRawTx = error;
                                        }

                                        if(typeof signRawTx.result !== 'undefined')
                                        {
                                            let sendRawTx = false;

                                            if(signRawTx.result.complete === true)
                                            {
                                                try {
                                                    sendRawTx = await client.cmd('sendrawtransaction', signRawTx.result.hex);
                                                } catch (error) {
                                                    sendRawTx = error;
                                                }

                                                if(typeof sendRawTx.result !== 'undefined')
                                                {
                                                    new Notification('Rewards successfully payed out!', {
                                                        body: totalCoins+ 'EUNO sent to address '+data.payoutAddress
                                                    });

                                                    let newTxId = sendRawTx.result;
                                                }
                                                else
                                                {
                                                    new Notification('EunoPayout Error Occurred', {
                                                        body: sendRawTx
                                                    });
                                                }
                                            }
                                            else
                                            {
                                                new Notification('EunoPayout Error Occurred', {
                                                    body: 'Transaction could not be signed!'
                                                });
                                            }
                                        }
                                        else
                                        {
                                            new Notification('EunoPayout Error Occurred', {
                                                body: signRawTx
                                            });
                                        }
                                    }
                                    else
                                    {
                                        new Notification('EunoPayout Error Occurred', {
                                            body: rawTx
                                        });
                                    }
                                }
                            }
                        });
                    }
                });
            },
            minifyWindow(){
                ipcRenderer.send('minifyMainWindow', true);
            },
            closeWindow(){
                ipcRenderer.send('closeMainWindow', true);
            }
        }
    }
</script>

<style lang="scss">
    #start{
        .windowContent{
            margin: 20px;
        }
    }
</style>