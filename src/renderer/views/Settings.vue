<template>
    <div id="settings">

        <h3>Settings</h3>

        <input type="text" name="host" v-model="form.host" placeholder="Host" />
        <input type="text" name="port" v-model="form.port" placeholder="Port" />
        <input type="text" name="username" v-model="form.rpcUser" placeholder="RPC username" />
        <input type="password" name="password" v-model="form.rpcPassword" placeholder="RPC password" />

        <input type="text" name="payout_address" v-model="form.payoutAddress" placeholder="EUNO payout address" />

        <button @click="saveSettings()">Save</button>
        <button @click="testSettings()">Test connection</button>

    </div>
</template>

<script>
    import { remote, ipcRenderer } from 'electron'
    import log from 'electron-log'
    import storage from 'electron-json-storage';
    import RpcClient from 'bitcoind-rpc-client'

    export default {
        name: 'Settings',
        data(){
            return {
                form: {
                    host: '127.0.0.1', //Default settings
                    port: 20102,
                    rpcUser: 'user',
                    rpcPassword: '1234',
                    payoutAddress: ''
                }
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

                        const client = new RpcClient({
                            host: data.host,
                            port: data.port
                        });
                        client.set('user', data.rpcUser);
                        client.set('pass', data.rpcPassword);

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

                if (typeof result.result !== 'undefined') {
                    alert('ok');
                } else
                {
                    alert('Credentials invalid');
                }
            }
        }
    }
</script>

<style lang="scss">
    #settings{

    }
</style>