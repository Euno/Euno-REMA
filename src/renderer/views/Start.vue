<template>
    <div id="start">
        <Toolbar
            @on-minify="minifyWindow()"
            @on-close="closeWindow()"
            title="EUNO• Payout"
            :show-minify="true"
            :show-close="true"
        >
        </Toolbar>

        <div class="windowContent">
            <div>
                <el-checkbox v-model="localSettings.enablePayout">Enable payouts</el-checkbox>
            </div>

            <el-button class="settings-btn" type="primary" size="mini" @click="fetchUnspents()" :disabled="!localSettings.enablePayout">Payout now</el-button>
            <el-button class="settings-btn" type="info" size="mini" @click="openSettings()">Open settings</el-button>

            <p class="info">A payout request will be executed every hour. If you want to do a manual payout, please click the "Payout now" button!</p>

            <Version></Version>
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
    import Version from "../components/Version";

    export default {
        name: 'Start',
        components: {Toolbar, Version},
        data(){
            return {
                localSettings: {
                    enablePayout: false
                }
            }
        },
        mounted(){
            this.fetchUnspents();

            setInterval(()=>{
                this.fetchUnspents();
            }, 3600000);
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

                            if(self.localSettings.enablePayout === false)
                                return true;

                            if(!data.payoutAddress)
                            {
                                new Notification('No payout address provided', {
                                    body: 'Please go to settings and fill in your payout address!'
                                });
                                return true;
                            }

                            const client = new RpcClient({
                                host: data.host,
                                port: data.port
                            });
                            client.set('user', data.rpcUser);
                            client.set('pass', data.rpcPassword);

                            if(data.walletPassphrase)
                            {
                                let unlock = false;
                                try {
                                    unlock = await client.cmd('walletpassphrase', data.walletPassphrase, 1000, false);
                                } catch (error) {
                                    unlock = error;
                                    new Notification('EunoPayout Error Occurred', {
                                        body: error
                                    });
                                }

                                if(typeof unlock.result !== 'undefined')
                                {
                                    return false;
                                }
                            }

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

                                    if(data.walletPassphrase)
                                    {
                                        try {
                                            await client.cmd('walletlock');
                                        } catch (error) {
                                        }

                                        try {
                                            await client.cmd('walletpassphrase', data.walletPassphrase, 1000, true);
                                        } catch (error) {
                                        }
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
        background-color:  #EBF1FF;
        height: 100%;
        width: 100%;

        .windowContent{
            margin: 20px;
            height: 100%;
            width: 100%;

            .settings-btn{
                margin-top: 20px;
            }

            .info{
                font-size: 14px;
                padding-right: 10px;
            }
        }
    }
</style>