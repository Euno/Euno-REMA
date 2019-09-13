<template>
    <div id="settings">

        <Toolbar
                @on-close="closeWindow()"
                title="Settings"
                :show-close="true"
        >
        </Toolbar>

        <div class="windowContent">
            <el-form ref="form" :model="form" label-position="top">

                <el-row>
                    <el-col :span="14">
                        <el-form-item label="Host">
                            <el-input placeholder="Host" v-model="form.host" size="mini"></el-input>
                        </el-form-item>
                    </el-col>

                    <el-col :span="8">
                        <el-form-item label="Port">
                            <el-input placeholder="Port" v-model="form.port" size="mini"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-row>
                    <el-col :span="11">
                        <el-form-item label="RPC username">
                            <el-input placeholder="RPC username" v-model="form.rpcUser" size="mini"></el-input>
                        </el-form-item>
                    </el-col>

                    <el-col :span="11">
                        <el-form-item label="RPC password">
                            <el-input placeholder="RPC password" v-model="form.rpcPassword" size="mini" type="password"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-row>
                    <el-col :span="22">
                        <el-form-item label="EUNO payout address">
                            <el-input placeholder="RPC username" v-model="form.payoutAddress" size="mini"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-row>
                    <el-col :span="22">
                        <el-form-item label="Wallet password">
                            <el-input placeholder="Wallet password" v-model="form.walletPassphrase" size="mini" type="password"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>

            </el-form>

            <el-button @click="saveSettings()" size="mini" type="primary">Save</el-button>
            <el-button @click="testSettings()" size="mini" type="info" :loading="testLoading">Test connection</el-button>
        </div>

    </div>
</template>

<script>
    import { remote, ipcRenderer } from 'electron'
    import log from 'electron-log'
    import storage from 'electron-json-storage';
    import RpcClient from 'bitcoind-rpc-client'
    import Toolbar from "../components/Toolbar";

    export default {
        name: 'Settings',
        components: {Toolbar},
        data(){
            return {
                form: {
                    host: '127.0.0.1', //Default settings
                    port: 21333,
                    rpcUser: 'user',
                    rpcPassword: '1234',
                    payoutAddress: '',
                    walletPassphrase: ''
                },
                testLoading: false
            }
        },
        mounted(){
            let self = this;
            storage.has('eunoPayoutSettings', async function(error, hasKey) {
                if (error) throw error;

                if (hasKey)
                {
                    storage.get('eunoPayoutSettings', async function(error, data) {
                        if (error) throw error;

                        self.form.host = data.host;
                        self.form.port = data.port;
                        self.form.rpcUser = data.rpcUser;
                        self.form.rpcPassword = data.rpcPassword;
                        self.form.payoutAddress = data.payoutAddress;
                        self.form.walletPassphrase = data.walletPassphrase;
                    });
                }
            });
        },
        methods: {
            saveSettings(){
                storage.set('eunoPayoutSettings', this.form, function(error) {
                    if (error) throw error;

                    ipcRenderer.send('checkSettingsFilled', true);
                });
            },
            async testSettings() {
                this.testLoading = true;

                const client = new RpcClient({
                    host: this.form.host,
                    port: this.form.port
                });
                client.set('user', this.form.rpcUser);
                client.set('pass', this.form.rpcPassword);

                let result = false;

                try {
                    result = await client.cmd('getinfo');
                } catch (error) {
                    result = error;
                }

                this.testLoading = false;

                if (typeof result.result !== 'undefined') {
                    alert('ok');
                } else
                {
                    alert('Credentials invalid');
                }
            },
            closeWindow(){
                ipcRenderer.send('closeSettingsWindow', true);
            }
        }
    }
</script>

<style lang="scss">
    #settings{
        background-color:  #EBF1FF;
        height: 100%;
        width: 100%;

        .windowContent{
            margin: 20px;
            height: 100%;
            width: 100%;

            .el-form-item__label{
                padding: 0;
                margin-bottom: -15px;
            }

            .el-form-item{
                margin-bottom: 0;
            }
        }
    }
</style>