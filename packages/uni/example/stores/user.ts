import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => {
    return {
      token: '',
      name: '',
      userInfo: {
        year: 1997
      }
    }
  },
  actions: {
    setToken(token: string) {
      this.token = token
    },
    setName(name: string) {
      this.name = name
    },
    setUserInfo(userInfo: {
      year: number
    }) {
      this.userInfo = userInfo
    },
    setYear(year: number) {
      this.userInfo.year = year
    }
  },
})
