export interface LoginRequestData {
  account: string
  password: string
  token?: string // 这里添加 token 属性
}

export interface token {
  token: string
}

export interface GetTokenRequestData {
  type: number
  data: {
    token: string
  }
  message: string
}

export interface GetUserInfoData {
  type: number
  data: {
    account: string
    name: string | null
    phone: string | null
    email: string | null
    ip: string
    created_at: string
    updated_at: string
  }
  message: string
}

export interface GetUserLoginData {
  type: number
  account: string
  message: string
}

export type UserData = {
  account: string
  name: string | null
  phone: string | null
  email: string | null
  ip: string
  created_at: string
  updated_at: string
}

export type getTokenApi = ApiResponseData<string>

export type LoginCodeResponseData = ApiResponseData<string>

export type LoginResponseData = ApiResponseData<{ token: string }>

export type UserInfoResponseData = ApiResponseData<UserData>
