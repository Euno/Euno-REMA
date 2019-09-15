<template>
    <div id="version">
        EUNO• Payout {{version}} - &copy; EUNO 2018 - 2019
    </div>
</template>

<script>
    import appPackage from '../../../package.json'
    export default {
        name: "Version",
        data(){
            return {
                version: appPackage.version
            }
        }
    }
</script>

<style lang="scss">
    #version{
        position: absolute;
        bottom: 20px;
        left: 20px;
        font-size: 12px;
        font-weight: 100;
    }
</style>