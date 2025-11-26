<template>
  <div>
    <div>测试index页面</div>
    <button id="button" @click="changeName">按钮</button>
    <button id="button2" @click="setToken">修改token</button>
    <button id="button3" @click="setUserInfo">修改用户信息</button>
    <button id="button4" @click="setUserInfoKey">修改用户信息</button>
    <button id="button5" @click="setPiniaYear">修改用户信息</button>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { set } from './global'
import { useUserStore } from './stores/user'
import { init, onCustomMounted } from '../src'

init({
  Login: {
    key: 'token',
    type: 'pinia',
    store: useUserStore()
  },
  Name: {
    key: 'name',
    type: 'pinia',
    store: useUserStore()
  },
  Year: {
    key: 'userInfo.year',
    type: 'pinia',
    store: useUserStore(),
    onUpdate: (val)=> {
      return val == 1996
    }
  },
  GlobalLogin: {
    key: 'token',
  },
  GlobalAge: {
    key: 'age'
  },
  UserInfo: {
    key: 'userInfo'
  },
  UserInfoA: {
    key: 'userInfo.name',
    onUpdate: (val) => {
      return val == 123
    }
  }
})

const customMountedLogin = ref(false)
const customMountedLoginName = ref(false)
const customMountedYear = ref(false)
const customMountedGlobalAge = ref(false)
const customMountedGlobalLogin = ref(false)
const customMountedGlobalUserInfo = ref(false)
const customMountedGlobalUserInfoA = ref(false)

useUserStore().setToken('newToken')

onCustomMounted(() => {
  customMountedLogin.value = true
}, ['Login'])

onCustomMounted(() => {
  customMountedGlobalLogin.value = true
}, ['GlobalLogin'])

onCustomMounted(() => {
  customMountedGlobalAge.value = true
}, ['GlobalAge'])

onCustomMounted(() => {
  customMountedGlobalUserInfo.value = true
}, ['UserInfo'])

onCustomMounted(() => {
  console.log("执行了UserInfoA");
  customMountedGlobalUserInfoA.value = true
}, ['UserInfoA'])

onCustomMounted(() => {
  customMountedLoginName.value = true
}, ['Login', 'Name'])

onCustomMounted(() => {
  customMountedYear.value = true
}, ['Year'])


const changeName = () => {
  useUserStore().setName("newName")
}

const setToken = () => {
  set('token', "newToekn")
}

const setUserInfo = () => {
  set('userInfo', {
    b: 2,
    name: 213
  })
}

const setUserInfoKey = () => {
  set('userInfo', {
    name: 123
  })
}

const setPiniaYear = () => {
  console.log("执行setPiniaYear");
  
  useUserStore().setYear(1996)
}

</script>
