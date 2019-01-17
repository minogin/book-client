import Vue from 'vue'
import Router from 'vue-router'
import Editor from '@/components/Editor'
import Login from '@/components/Login'
import store from '@/services/store'

Vue.use(Router)

const router = new Router({
  routes: [
    {
      path: '*',
      redirect: '/editor'
    },
    {
      path: '/login',
      name: 'Login',
      component: Login
    },
    {
      path: '/editor',
      name: 'Editor',
      component: Editor,
      meta: { requiresAuth: true }
    },
  ]
})

router.beforeEach((to, from, next) => {
  let requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  let auth = store.state.auth

  if (requiresAuth && !auth)
    next('/login')
  else if (!requiresAuth && auth)
    next('/')
  else
    next()
})

export default router
