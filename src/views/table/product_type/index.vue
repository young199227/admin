<script lang="ts" setup>
import axios from "axios"
import { nextTick, reactive, ref } from "vue"
import { type ElMessageBoxOptions, ElMessageBox, ElMessage } from "element-plus"
import { deleteTableDataApi, getTableDataApi } from "@/api/table"
import { type TableResponseData } from "@/api/table/types/table"
import {
  type VxeGridInstance,
  type VxeGridProps,
  type VxeModalInstance,
  type VxeModalProps,
  type VxeFormInstance,
  type VxeFormProps
} from "product_type"
import { log } from "console"

defineOptions({
  // 命名当前组件
  name: "product_type"
})

//#region vxe-grid
interface RowMeta {
  id: number
  type_name: string
  created_at: string
  updated_at: string
}

const xGridDom = ref<VxeGridInstance>()
const xGridOpt: VxeGridProps = reactive({
  loading: true,
  autoResize: true,
  /** 分页配置项 */
  pagerConfig: {
    align: "right"
  },
  /** 工具栏配置 */
  toolbarConfig: {
    refresh: true,
    custom: true,
    slots: { buttons: "toolbar-btns" }
  },
  /** 自定义列配置项 */
  customConfig: {
    /** 是否允许列选中  */
    checkMethod: ({ column }) => !["username"].includes(column.field)
  },
  /** 列配置 */
  columns: [
    {
      field: "id",
      title: "id"
    },
    {
      field: "type_name",
      title: "種類名稱"
    },
    {
      field: "created_at",
      title: "創建時間"
    },
    {
      field: "updated_at",
      title: "修改時間"
    },
    {
      title: "操作",
      width: "150px",
      fixed: "right",
      showOverflow: false,
      slots: { default: "row-operate" }
    }
  ],
  /** 数据代理配置项（基于 Promise API） */
  data: [] as RowMeta[] // 直接綁定資料
})
//#endregion

//#region vxe-modal
const xModalDom = ref<VxeModalInstance>()
const xModalOpt: VxeModalProps = reactive({
  title: "",
  showClose: true,
  escClosable: true,
  maskClosable: true,
  beforeHideMethod: () => {
    xFormDom.value?.clearValidate()
    return Promise.resolve()
  }
})
//#endregion

//#region vxe-form
const xFormDom = ref<VxeFormInstance>()
const xFormOpt: VxeFormProps = reactive({
  span: 24,
  titleWidth: "100px",
  loading: false,
  /** 是否显示标题冒号 */
  titleColon: false,
  /** 表单数据 */
  data: {
    id: "",
    type_name: ""
  },
  /** 项列表 */
  items: [
    {
      field: "id",
      title: "id",
      itemRender: {
        name: "$input",
        props: { disabled: false }, // 動態禁用狀態
        visible: true // 動態顯示狀態
      }
    },
    {
      field: "type_name",
      title: "類別名稱",
      itemRender: { name: "$input", props: { placeholder: "请输入" } }
    },
    {
      align: "right",
      itemRender: {
        name: "$buttons",
        children: [
          { props: { content: "取消" }, events: { click: () => xModalDom.value?.close() } },
          {
            props: { type: "submit", content: "确定", status: "primary" },
            events: { click: () => crudStore.onSubmitForm() }
          }
        ]
      }
    }
  ],
  /** 校验规则 */
  rules: {
    username: [
      {
        required: true,
        validator: ({ itemValue }) => {
          switch (true) {
            case !itemValue:
              return new Error("请输入")
            case !itemValue.trim():
              return new Error("空格无效")
          }
        }
      }
    ],
    password: [
      {
        required: true,
        validator: ({ itemValue }) => {
          switch (true) {
            case !itemValue:
              return new Error("请输入")
            case !itemValue.trim():
              return new Error("空格无效")
          }
        }
      }
    ]
  }
})
//#endregion

//#region 增删改查
const crudStore = reactive({
  /** 表单类型，true 表示修改，false 表示新增 */
  isUpdate: true,
  /** 加载表格数据 */
  commitQuery: () => xGridDom.value?.commitProxy("query"),
  /** 清空表格数据 */
  clearTable: () => xGridDom.value?.reloadData([]),
  /** 点击显示弹窗 */
  onShowModal: (row?: RowMeta) => {
    if (row) {
      crudStore.isUpdate = true
      xModalOpt.title = "修改產品類別"
      // 赋值
      xFormOpt.data.type_name = row.type_name
      xFormOpt.data.id = row.id
      // 顯示並禁用 id 欄位
      const idField = xFormOpt.items.find((item) => item.field == "id")
      if (idField) {
        idField.itemRender.props.disabled = true // 鎖住 id 欄位
        idField.visible = true // 顯示 id 欄位
      }
    } else {
      crudStore.isUpdate = false
      xModalOpt.title = "新增產品類別"
      // 清空表單
      xFormOpt.data.type_name = ""
      xFormOpt.data.id = ""
      // 隱藏 id 欄位
      const idField = xFormOpt.items.find((item) => item.field == "id")
      if (idField) {
        idField.itemRender.props.disabled = false // 解除鎖定
        idField.visible = false // 隱藏 id 欄位
      }
    }
    // 開啟彈窗
    xModalDom.value?.open()
    nextTick(() => {
      !crudStore.isUpdate && xFormDom.value?.reset()
      xFormDom.value?.clearValidate()
    })
  },
  /** 确定并保存 */
  onSubmitForm: () => {
    if (xFormOpt.loading) return
    xFormDom.value?.validate((errMap) => {
      if (errMap) return
      xFormOpt.loading = true
      const callback = () => {
        xFormOpt.loading = false
        xModalDom.value?.close()
        ElMessage.success("操作成功")
        fetchProductTypes()
        // !crudStore.isUpdate && crudStore.afterInsert()
        // crudStore.commitQuery()
      }
      if (crudStore.isUpdate) {
        // 模拟调用修改接口成功
        updateProductType()
          .then(() => callback()) // 调用成功后执行 callback
          .catch((error) => {
            console.error("更新失败:", error)
            xFormOpt.loading = false
          })
      } else {
        // 模拟调用新增接口成功
        setTimeout(() => callback(), 1000)
      }
    })
  },
  /** 新增后是否跳入最后一页 */
  afterInsert: () => {
    const pager = xGridDom.value?.getProxyInfo()?.pager
    if (pager) {
      const currentTotal = pager.currentPage * pager.pageSize
      if (currentTotal === pager.total) {
        ++pager.currentPage
      }
    }
  },
  /** 删除 */
  onDelete: (row: RowMeta) => {
    const tip = `确定 <strong style="color: var(--el-color-danger);"> 删除 </strong> 用户 <strong style="color: var(--el-color-primary);"> ${row.username} </strong> ？`
    const config: ElMessageBoxOptions = {
      type: "warning",
      showClose: true,
      closeOnClickModal: true,
      closeOnPressEscape: true,
      cancelButtonText: "取消",
      confirmButtonText: "确定",
      dangerouslyUseHTMLString: true
    }
    ElMessageBox.confirm(tip, "提示", config).then(() => {
      deleteTableDataApi(row.id).then(() => {
        ElMessage.success("删除成功")
        crudStore.afterDelete()
        crudStore.commitQuery()
      })
    })
  },
  /** 删除后是否返回上一页 */
  afterDelete: () => {
    const tableData: RowMeta[] = xGridDom.value!.getData()
    const pager = xGridDom.value?.getProxyInfo()?.pager
    if (pager && pager.currentPage > 1 && tableData.length === 1) {
      --pager.currentPage
    }
  },
  /** 更多自定义方法 */
  moreFn: () => {}
})
//#endregion

// 呼叫 API 並獲取數據
const fetchProductTypes = async () => {
  xGridOpt.loading = true
  try {
    const response = await axios.post("http://192.168.0.61:8000/selectProductType", {
      token: "ulKDS5BGQ7LfBPMUXsZfs9QSCKVnzRmHCPfRqBg5SFZVtliMQ10GwmzUtiJsDQNc"
    })

    // 如果回應正確，將資料綁定到 xGridOpt.data
    if (response.data.type == 1) {
      xGridOpt.data = response.data.data
    } else {
      console.error(response.data.message)
    }
  } catch (error) {
    console.error("API 呼叫失敗:", error)
  } finally {
    xGridOpt.loading = false
  }
}
fetchProductTypes()

const updateProductType = async () => {
  xGridOpt.loading = true
  try {
    const response = await axios.post("http://192.168.0.61:8000/updateProductType", {
      token: "ulKDS5BGQ7LfBPMUXsZfs9QSCKVnzRmHCPfRqBg5SFZVtliMQ10GwmzUtiJsDQNc",
      product_type_id: xFormOpt.data.id,
      product_type_name: xFormOpt.data.type_name
    })

    // 如果回應正確，將資料綁定到 xGridOpt.data
    if (response.data.type == 1) {
      xGridOpt.data = response.data.data
    } else {
      console.error(response.data.message)
    }
  } catch (error) {
    console.error("API 呼叫失敗:", error)
  } finally {
    xGridOpt.loading = false
  }
}
</script>

<template>
  <div class="app-container">
    <!-- 表格 -->
    <vxe-grid ref="xGridDom" v-bind="xGridOpt">
      <!-- 左侧按钮列表 -->
      <template #toolbar-btns>
        <vxe-button status="primary" icon="vxe-icon-add" @click="crudStore.onShowModal()">新增產品類別</vxe-button>
        <!--<vxe-button status="danger" icon="vxe-icon-delete">批量删除</vxe-button>-->
      </template>
      <!-- 操作 -->
      <template #row-operate="{ row }">
        <el-button link type="primary" @click="crudStore.onShowModal(row)">修改</el-button>
        <!--<el-button link type="danger" @click="crudStore.onDelete(row)">删除</el-button>-->
      </template>
    </vxe-grid>
    <!-- 弹窗 -->
    <vxe-modal ref="xModalDom" v-bind="xModalOpt">
      <!-- 表单 -->
      <vxe-form ref="xFormDom" v-bind="xFormOpt" />
    </vxe-modal>
  </div>
</template>
