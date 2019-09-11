<template>
    <div>
        <router-view />
    </div>
</template>

<script>
    export default {
        name: 'App',
    }
</script>

<style>
    *, *::after, *::before {
        -webkit-user-select: none;
        -webkit-user-drag: none;
        -webkit-app-region: no-drag;
        cursor: default;
    }

    body{
        overflow: hidden;
        margin: 0;
        padding: 0;
        font-family: Avenir;
    }
</style>