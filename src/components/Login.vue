<template>
  <div class="container">
    <div class="card login-card">
      <h3 class="card-header">Вход</h3>
      <div class="card-body">
        <div class="form-group">
          <label for="email">Email:</label>
          <input v-model="email" v-validate="'required|email'" type="text" class="form-control" id="email" name="email"
                 placeholder="E-mail" :class="{'is-invalid':errors.has('email')}">
          <div class="invalid-feedback">Укажите корректный e-mail</div>
        </div>
        <div class="form-group">
          <label for="password">Пароль:</label>
          <input v-model="password" v-validate="'required|min:6'" type="password" class="form-control" id="password"
                 name="password" placeholder="Пароль" :class="{'is-invalid':errors.has('password')}">
          <div class="invalid-feedback">Укажите пароль</div>
        </div>
        <div class="alert alert-danger" role="alert" v-if="error">{{error}}</div>
        <button type="button" class="btn btn-primary" @click="login()">Войти</button>
        <!--<router-link class="ml-3" :to="{ name: 'Register' }">Регистрация</router-link>-->
      </div>
    </div>
  </div>
</template>

<script>
  import auth from '@/services/auth'

  export default {
    data() {
      return {
        email: '',
        password: '',
        error: ''
      }
    },
    methods: {
      async login() {
        this.error = '';

        if (!await this.$validator.validate())
          return;

        try {
          await auth.login(this.email, this.password)
          this.$router.push('/')
        }
        catch (e) {
          this.error = 'Неверное имя пользователя или пароль'
        }
      }
    },
    mounted() {
      if (true) {
        this.email = 'minogin@gmail.com'
        this.password = 'passwd'
        // this.email = 'zoc@gmail.com'
        // this.password = 'zocpwd'
        this.login()
      }
    }
  }
</script>

<style scoped src="../assets/bootstrap.min.css"></style>

<style scoped lang="less">
  @import "../assets/styles";

  .login-card {
    .centered;
    margin-top: 5rem;
    max-width: 30rem;
  }
</style>
