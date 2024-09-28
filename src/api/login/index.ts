import { request } from "@/utils/service"
import type * as Login from "./types/login"

/** 获取登录验证码 */
export function getLoginCodeApi() {
  return request<Login.LoginCodeResponseData>({
    url: "login/code",
    method: "get"
  })
}

// 拿TokenApi
export function getTokenApi() {
  return request<Login.GetTokenRequestData>({
    url: "getToken",
    method: "post"
  })
}

/** 登录并返回 Token */
export function loginApi(data: Login.LoginRequestData) {
  return request<Login.LoginResponseData>({
    url: "adminLogin",
    method: "post",
    data
  })
}

/** 获取用户详情 */
export function getUserInfoApi(data: Login.token) {
  return request<Login.UserInfoResponseData>({
    url: "selectAdminUserInfo",
    method: "post",
    data
  })
}
