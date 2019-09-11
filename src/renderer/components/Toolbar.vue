<template>
    <div id="toolbar">

        <div class="title">
            EUNO• Payout
        </div>
        <div class="minify">
            <button @click="minify()">-</button>
        </div>
        <div class="close">
            <button @click="close()">X</button>
        </div>

    </div>
</template>

<script>
    export default {
        name: "Toolbar",
        methods: {
            minify(){
                this.$emit('on-minify');
            },
            close(){
                this.$emit('on-close');
            }
        }
    }
</script>

<style lang="scss">
    #toolbar{
        position: relative;
        background-color: #000;
        height: 25px;

        .title{
            position: absolute;
            color: #FFF;
            width: 100%;
            text-align: center;
            left: 0;
            font-size: 14px;
            line-height: 25px;
            display: block;
            -webkit-app-region: drag;
        }

        .minify{
            position: absolute;
            right: 45px;

            button{
                display: block;
                background-color: #ffbd2c;
                color: #FFF;
                border: none;
                height: 25px;
                width: 45px;
            }
        }

        .close{
            position: absolute;
            right: 0;

            button{
                display: block;
                background-color: #bf1c1a;
                color: #FFF;
                border: none;
                height: 25px;
                width: 45px;
            }
        }
    }
</style>