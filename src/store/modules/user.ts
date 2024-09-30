import { ref } from "vue"
import store from "@/store"
import { defineStore } from "pinia"
import { useTagsViewStore } from "./tags-view"
import { useSettingsStore } from "./settings"
import { getToken, removeToken, setToken } from "@/utils/cache/cookies"
import { resetRouter } from "@/router"
import { loginApi, getUserInfoApi } from "@/api/login"
import { type LoginRequestData, type GetUserLoginData, type GetUserInfoData } from "@/api/login/types/login"
import { getTokenApi } from "@/api/login"
import { type GetTokenRequestData } from "@/api/login/types/login"
import routeSettings from "@/config/route"
import { useRouter } from "vue-router"

export const useUserStore = defineStore("user", () => {
  const token = ref<string>(getToken() || "")
  const roles = ref<string[]>([])
  const username = ref<string>("")

  const tagsViewStore = useTagsViewStore()
  const settingsStore = useSettingsStore()

  const router = useRouter()

  /** 登录 */
  const login = async ({ account, password }: LoginRequestData) => {
    console.log(account, password, token.value)

    loginApi({ account, password, token: token.value }) // 将 token 包装在对象中
      .then((res: GetUserLoginData) => {
        console.log(res.type) // 访问响应数据

        if (res.type == 0) {
          router.push({ path: "/login" })
        }

        if (res.type == 1) {
          router.push({ path: "/" })
        }
      })
      .catch((error) => {
        console.error("Error fetching user info:", error) // 捕获并打印错误
      })
  }
  /** 获取用户详情 */
  const getInfo = async () => {
    getUserInfoApi({ token: token.value }) // 将 token 包装在对象中
      .then((res: GetUserInfoData) => {
        console.log(res.type) // 访问响应数据

        if (res.type == 0) {
          console.log("沒登錄喔")
          router.push({ path: "/login" })
        }

        if (res.type == 1) {
          router.push({ path: "/" })
        }
      })
      .catch((error) => {
        console.error("Error fetching user info:", error) // 捕获并打印错误
      })

    // roles.value = Array.isArray(res.roles) && data.roles.length > 0 ? data.roles : ["admin"]

    console.log(token.value)
    roles.value = ["admin"]
  }

  /** 模拟角色变化 */
  const changeRoles = async (role: string) => {
    const newToken = "token-" + role
    token.value = newToken
    setToken(newToken)
    // 用刷新页面代替重新登录
    window.location.reload()
  }
  /** 登出 */
  const logout = () => {
    removeToken()
    // getTokenApi().then((res: GetTokenRequestData) => {
    //   setToken(res.data.token)
    // })
    roles.value = []
    resetRouter()
    _resetTagsView()
  }
  /** 重置 Token */
  const resetToken = () => {
    removeToken()
    // getTokenApi().then((res: GetTokenRequestData) => {
    //   setToken(res.data.token)
    // })
    roles.value = []
  }
  /** 重置 Visited Views 和 Cached Views */
  const _resetTagsView = () => {
    if (!settingsStore.cacheTagsView) {
      tagsViewStore.delAllVisitedViews()
      tagsViewStore.delAllCachedViews()
    }
  }

  return { token, roles, username, login, getInfo, changeRoles, logout, resetToken }
})

/** 在 setup 外使用 */
export function useUserStoreHook() {
  return useUserStore(store)
}
