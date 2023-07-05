<template>
  <div class="config-network-cate">
    <div class="organ-contents">
      <dashboard-panel
        class="body-panel -left a"
        :title="$v('네트워크 카테고리')"
        :padding-top="0"
      >
        <template #header>
          <button
            class="button"
            type="is-primary"
            @click="handleOpenDcenter"
          >
            {{ $v("데이터센터 추가") }}
          </button>
        </template>
        <div class="side-tree-area">
          <network-cate-tree
            :init-cate-list.sync="initCateList"
            @select="handleSelectToNcTree"
          />
        </div>
      </dashboard-panel>
      <div class="confnetcate-panel-right">
        <section class="panel-right__header confnetcate-panel-right__header">
          <div
            v-if="netCateBreadcrumb.length === 0"
            class="confnetcate-panel-right__header--is-empty"
          >
            <!-- {{ $v('카테고리를 선택해주세요.') }} -->
          </div>
          <network-cate-breadcrumb
            :selected-tree-item="selectedTreeItem"
          />

          <section
            v-if="netCateBreadcrumb.length !== 0"
            class="confnetcate-panel-right__header__buttons"
          >
            <button
              type="is-primary"
              class="button"
              @click="handleOpenChildren"
            >
              {{ $v('하위 항목 추가') }}
            </button>
            <button
              type="is-anti"
              class="button"
              @click="handleClickDeleteCate(selectedTreeItem)"
            >
              {{ $v('삭제') }}
            </button>
          </section>
        </section>
        <network-cate-setting
          :selected-tree-item="selectedTreeItem"
          class="panel-rigth-form"
          @updateAfter="handleUpdateAfter"
          @openModal="handleOpenModal"
        />
      </div>
      <el-dialog
        :title="netCateModalTitle"
        :visible="isOpenedNetCate"
        @close="isOpenedNetCate = false"
      >
        <modal-network-cate-update
          :is-opened="isOpenedNetCate"
          :selected-cate-item="selectedTreeItem"
          @change="handleChangeCateUpdate"
        />
        <modal-footer
          @close="handleCloseNcModal"
          @confirm="handleSaveNcModal"
          :confirm-text="$t('common.BTN.save')"
        />
      </el-dialog>
    </div>
  </div>
</template>

<script>
import API, { DashboardPanel, CommonModalFooter } from '@sd-fe/cmp-core'
import NetworkCateTree from '@/components/NetworkCategorySelection/NetworkCateTree.vue'
import NetworkCateSetting from './NetworkCateSetting.vue'
import ModalNetworkCateUpdate from './ModalNetworkCateUpdate.vue'
import NetworkCateBreadcrumb from '@/components/NetworkCategorySelection/NetworkCateBreadcrumb.vue'
import { cloneDeep } from 'lodash'
export default {
  components: {
    DashboardPanel,
    NetworkCateTree,
    NetworkCateSetting,
    ModalNetworkCateUpdate,
    ModalFooter: CommonModalFooter,
    NetworkCateBreadcrumb
  },
  computed: {
    netCateBreadcrumb () {
      return this.selectedTreeItem?.cateKey?.split('-') || []
    },
    netCateModalTitle () {
      const type = this.cateModalOpenType
      let result = type // DATACENTER_ADD(데이터센터추가), CHILDREN_ADD(하위항목추가)
      switch (type) {
        case 'DATACENTER_ADD': result = this.$v('데이터센터 추가')
          break
        case 'CHILDREN_ADD' : result = this.$v('하위 항목 추가')
          break
      }
      return result
    }
  },
  methods: {
    /** EVENT_HANDLER (카테고리 선택)
     * 네트워크 카테고리 트리(NcTree)에 아이템을 선택했을때 */
    handleSelectToNcTree (item) {
      if (this.cateModalOpenType === 'CHILDREN_ADD') {
        if (!item?.parentNode) {
          this.selectedTreeItem = { ...cloneDeep(item), parentNode: this.temp }
          this.temp = {}
        } else {
          this.selectedTreeItem = cloneDeep(item)
        }
        this.cateModalOpenType = null
      } else {
        this.selectedTreeItem = cloneDeep(item)
      }
    },
    // SECTION 카테고리 모달 핸들러
    handleOpenDcenter () {
      this.cateModalOpenType = 'DATACENTER_ADD'
      this.isOpenedNetCate = true
    },
    handleOpenChildren () {
      this.cateModalOpenType = 'CHILDREN_ADD'
      this.isOpenedNetCate = true
    },
    handleCloseNcModal () {
      this.isOpenedNetCate = false
    },
    handleChangeCateUpdate (cateUpdate) {
      this.cateUpdateForm = cateUpdate
    },
    handleOpenModal () {
      console.log('openModal')
      this.cateModalOpenType = 'CHILDREN_ADD'
      // this.cateModalOpenType = null
    },
    async  handleSaveNcModal () {
      try {
        let payload = {}
        if (this.cateModalOpenType === 'DATACENTER_ADD') {
          payload = {
            ...this.cateUpdateForm,
            upperCategoryIdx: 0
          }
        } else if (this.cateModalOpenType === 'CHILDREN_ADD') {
          payload = {
            ...this.cateUpdateForm,
            upperCategoryIdx: this.selectedTreeItem.cateIdx
          }
        }
        const result = await this.createIpCategory(payload)

        if (result) {
          this.$alert(this.$v('추가하였습니다.'))
          this.isOpenedNetCate = false
          this.temp = cloneDeep(this.selectedTreeItem)
          this.initCateList = { isAdded: true, codeValue: this.cateUpdateForm.codeValue, isDatacenter: payload.upperCategoryIdx === 0 }
        }
      // this.createIpCategory(this)
      } catch (error) {
        console.log(error)
      }
    },
    // EVENT_HANDLER (EMIT)네트워크 카테고리를 업데이트 이후 동작
    handleUpdateAfter () {
      this.initCateList = { isUpdated: true }
      this.cateModalOpenType = null
    },
    async handleClickDeleteCate (networkCate) {
      try {
        const { cateIdx } = networkCate
        const isConfirmed = await this.$confirm(this.$v('삭제하시겠습니까?'), { confirmButtonText: this.$v('확인'), cancelButtonText: this.$v('취소') })
          .then(() => true).catch(() => false)
        if (isConfirmed) {
          const result = await this.deleteNetworkCate(cateIdx)
          if (result) {
            this.initCateList = { isDeleted: true }
          }
        }
      } catch (error) {
      }
    },

    //! SECTION
    // SECTION  API 핸들러
    /** API_HANDLER (POST) 네트워크 카테고리 하위에 추가 */
    async createIpCategory (payload) {
      try {
        const result = await API.network.createIpCategory(payload)
        if (result) {
          return true
        }
        return false
      } catch (error) {
        if (error?.response?.data?.code) {
          const code = error?.response?.data?.code
          switch (code) {
            case 'NET6003': this.$alert(this.$v('중복 된 네트워크 카테고리 명입니다.')); break
            case 'NET6004': this.$alert(this.$v('네트워크 카테고리 명을 입력해주세요.')); break
            case 'NET6005': this.$alert(this.$v('코드 값을 입력해주세요.')); break
            case 'NET5004': this.$alert(this.$v('중복 된 코드 값입니다.')); break
            default : this.$alert(this.$v('필수 값을 모두 입력해주세요'))
          }
        }
      }
    },
    /** API_HANDLER (DELETE) 네트워크 카테고리 또는 데이터 센터 삭제
   *  [삭제조건]
   * 1. 하위 카케고리가 존재하면 안된다.
   * 2. 다른 모듈에서 해당 카테고리가 사용되어지고 있다면 삭제할 수 없다.
   */
    async deleteNetworkCate (cateIdx) {
      try {
        await API.network.deleteIpCategory(cateIdx)
        this.$alert(this.$v('삭제하였습니다.'))
        return true
      } catch (error) {
        if (error?.response?.data?.code) {
          const errCode = error?.response?.data.code
          let errSubMessage = error?.response?.data?.message
          switch (errCode) {
            case 'NET6000' : errSubMessage = '하위 카테고리를 먼저 삭제해주세요.'; break
          }
          this.$alert(`${this.$v('삭제를 실패했습니다.')}
          <br/><span>${this.$v(errSubMessage)}</span>,`, { dangerouslyUseHTMLString: true })
        } else {
          this.$alert(this.$v('삭제를 실패했습니다.'))
        }
      }
    }
    //! !SECTION

  },
  data () {
    return {
      selectedTreeItem: {},
      cateModalOpenType: null, // DATACENTER_ADD(데이터센터추가), CHILDREN_ADD(하위항목추가)
      isOpenedNetCate: false,
      cateUpdateForm: {},
      initCateList: null,
      temp: {}
    }
  }

}
</script>
<style lang="scss" scoped>
.config-network-cate {
.organ-contents {
  display: flex;
  .body-panel {
    display: flex !important;
    width: 800px;
    &::v-deep {
      .panel-body {
        padding: 0px !important;
      }
    }
    // justify-content: flex-start;
  }

  .side-tree-area {
    height: 700px;
    min-height:unset;
  }
  .confnetcate-panel-right {
    display: flex;
    flex-direction: column;
    width:100%;
    margin-left: 40px;
    .confnetcate-panel-right__header {
      display: flex;
      flex-grow: 0;
      height: 52px;
      border-bottom: 1px solid #2A2D44;
      justify-content: space-between;
      &__buttons {
        display: flex;
        align-self: center;
        * { margin-left:10px; }
      }
      &--is-empty {
        display: flex;
        align-items: center;
        font-size: 16px;
      }
    }
    .panel-rigth-form {
      display: flex;
      flex-grow: 1;
    }
  }
}
}
</style>
