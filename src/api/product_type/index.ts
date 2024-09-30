import axios from "axios"

export const selectProductTypeApi = (token) => {
  return axios.post("/selectProductType", {
    token: token
  })
}
