<template>
    <div id="start">
        <Toolbar
            @on-minify="minifyWindow()"
            @on-close="closeWindow()"
            title="EUNO• REMA"
            :show-minify="true"
            :show-close="true"
        >
        </Toolbar>

        <div class="windowContent">
            <div>
                <el-checkbox v-model="localSettings.enablePayout">Enable auto payouts</el-checkbox>
            </div>

            <el-button class="settings-btn" type="primary" size="mini" @click="manualPayout()" :disabled="!localSettings.enablePayout || payoutInProgress" :loading="payoutInProgress">Payout now</el-button>
            <el-button class="settings-btn" type="info" size="mini" @click="openSettings()">Open settings</el-button>

            <p class="info" v-if="payoutInProgress">
                <em>Creating the transaction may take a while. Please wait...</em>
            </p>

            <p class="info">
                A payout request for masternode rewards will be executed every hour.<br />
                Please use the "Payout now" button to execute a manual payout.
            </p>

            <p class="info">
                Estimated time for the next auto payout request: <br />
                {{localSettings.enablePayout === true ? nextPayoutDateHuman : 'Never, because payouts are disabled'}}
            </p>

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
    import moment from "moment";

    export default {
        name: 'Start',
        components: {Toolbar, Version},
        data(){
            return {
                localSettings: {
                    enablePayout: false
                },
                payoutInProgress: false,
                blockCount: 0,
                nextPayoutDate: 0,
                nextPayoutDateHuman: '',
            }
        },
        mounted(){
            this.setCountdownDate();

            this.nextPayoutHuman();
            setInterval(()=>{
                this.nextPayoutHuman();
            }, 2500);

            setInterval(()=>{
                this.setCountdownDate();
                this.fetchUnspents();
            }, 3600000);
        },
        methods: {
            nextPayoutHuman(){
                this.nextPayoutDateHuman = moment(new Date(this.nextPayoutDate)).fromNow();
            },
            setCountdownDate(){
                this.nextPayoutDate = new Date().getTime() + 3600000;
            },
            openSettings(){
                ipcRenderer.send('openSettingsScreen', true);
            },
            manualPayout(){
                this.$confirm('Do you want to pay out your masternode rewards now?', 'Manual payout', {
                    confirmButtonText: 'Yes',
                    cancelButtonText: 'No, cancel',
                    type: 'warning',
                    showClose: false
                }).then(() => {
                    this.fetchUnspents();
                }).catch(() => {
                });
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

                            self.payoutInProgress = true;

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
                                let unlocked = true;
                                try {
                                    await client.cmd('walletpassphrase', data.walletPassphrase, 1000, false);
                                } catch (error) {
                                    unlocked = false;
                                    new Notification('EunoPayout Error Occurred', {
                                        body: error
                                    });
                                }

                                if(unlocked === false)
                                {
                                    self.payoutInProgress = false;
                                    return false;
                                }
                            }

                            let info = false;

                            try {
                                info = await client.cmd('getinfo');
                            } catch (error) {
                                info = error;
                            }

                            if(typeof info.id === 'undefined')
                            {
                                this.closeWallet();
                                return true;
                            }

                            self.blockCount = info.result.blocks;

                            let result = false;

                            try {
                                result = await client.cmd('listunspent', 16);
                            } catch (error) {
                                result = error;
                            }

                            if(result.error === null)
                            {
                                let rewards = _.filter(result.result, (unspent)=>{
                                    return parseFloat(unspent.amount).toFixed(2) == self.calcRewardAmount()
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
                                                    self.payoutInProgress = false;
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

                                    self.payoutInProgress = false;
                                    await self.closeWallet();
                                }
                                else
                                {
                                    new Notification('No unspents', {
                                        body: 'No rewards found to pay out'
                                    });

                                    self.payoutInProgress = false;
                                    await self.closeWallet();
                                }
                            }
                        });
                    }
                });
            },
            async closeWallet(){
                storage.has('eunoPayoutSettings', async function(error, hasKey) {
                    if (error) throw error;

                    if (hasKey) {
                        storage.get('eunoPayoutSettings', async function (error, data) {
                            if (error) throw error;

                            const client = new RpcClient({
                                host: data.host,
                                port: data.port
                            });
                            client.set('user', data.rpcUser);
                            client.set('pass', data.rpcPassword);

                            if (data.walletPassphrase) {
                                let lock = '';
                                try {
                                    lock = await client.cmd('walletlock');
                                } catch (error) {
                                }

                                let unlockForStakingOnly = '';
                                try {
                                    unlockForStakingOnly = await client.cmd('walletpassphrase', data.walletPassphrase, 1000, true);
                                } catch (error) {
                                }
                            }

                        });
                    }
                });
            },
            calcRewardAmount(){
                let mnReward = 0;

                if(this.blockCount < 550000)
                {
                    mnReward = 50 * 0.6;
                }
                else if(this.blockCount < 915000)
                {
                    mnReward = 33.5 * 0.8;
                }
                else if(this.blockCount < 1295000)
                {
                    mnReward = 22.4 * 0.8;
                }
                else if(this.blockCount < 1675000)
                {
                    mnReward = 15 * 0.8;
                }
                else if(this.blockCount < 2055000)
                {
                    mnReward = 10 * 0.8;
                }
                else if(this.blockCount < 2435000)
                {
                    mnReward = 6.7 * 0.8;
                }
                else if(this.blockCount < 2815000)
                {
                    mnReward = 4.5 * 0.8;
                }
                else
                {
                    mnReward = 3 * 0.8;
                }

                return mnReward.toFixed(2);
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