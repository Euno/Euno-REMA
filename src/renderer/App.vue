<template>
    <div id="app">
        <router-view />
    </div>
</template>

<script>
    export default {
        name: 'App',
    }
</script>

<style lang="scss">
    *, *::after, *::before {
        -webkit-user-select: none;
        -webkit-user-drag: none;
        -webkit-app-region: no-drag;
        cursor: default;
    }

    html{
        height: 100%;
        width: 100%;
    }

    body{
        overflow: hidden;
        margin: 0;
        padding: 0;
        font-family: Avenir;
        height: 100%;
        width: 100%;

        #app{
            width: 100%;
            height: 100%;
        }
    }
</style>