<template>
    <div id="toolbar">

        <div class="title">
            {{title}}
        </div>
        <div class="minify" v-if="showMinify === true">
            <button @click="minify()">-</button>
        </div>
        <div class="close" v-if="showClose === true">
            <button @click="close()">X</button>
        </div>

    </div>
</template>

<script>
    export default {
        name: "Toolbar",
        props: ['title', 'showMinify', 'showClose'],
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
                background-color: #7599F2;
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
                background-color: #562CDD;
                color: #FFF;
                border: none;
                height: 25px;
                width: 45px;
            }
        }
    }
</style>