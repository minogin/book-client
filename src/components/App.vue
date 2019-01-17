<template>
  <div id="app" class="app">
    <nav class="header">
      Онлайн-редактор Имиджбук
    </nav>
    <main class="main">
      <router-view></router-view>
    </main>
    <footer class="footer">
      Copyright &copy; 2018 Imagebook Ltd.
    </footer>
  </div>
</template>

<script>
  export default {
    name: 'app'
  }
</script>

<style lang="less">
  @import "../assets/styles";

  body {
    margin: 0;
    font-family: Verdana, Geneva, sans-serif;
  }

  .app {
    .full-screen;
    .column;
    .no-select;

    > .header {
      .fixed-size(5rem);
      .column;
      .center-main;
      font-size: 1.5rem;
      padding-left: 2rem;
      background: lightskyblue;
    }

    > .main {
      .stretch;
      .row;
    }

    > .footer {
      .fixed-size(3rem);
      .column;
      .center-both;
      background: lightgray;
    }
  }
</style>
