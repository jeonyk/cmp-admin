<template>
  <div class="config-network-cate-setting">
    <div
      v-if="Object.keys(selectedTreeItem).length === 0"
      class="config-network-cate-setting--is-empty"
    >
      <span class="empty-text">{{ $t('common.ALERT.NETWORK.014') }}</span>
    </div>
    <div
      class="flex-wrapper"
      v-else
    >
      <section
        class="confnetcate-setting__section confnetcate-setting-def"
      >
        <section class="setting-section-header">
          <span class="setting-section-header__title">
            {{ $v("네트워크 카테고리 정보") }}
          </span>
          <section class="setting-section-header__buttons">
            <button
              class="button"
              type="is-black"
              @click="handleOpenModal"
            >
              {{ $v("수정") }}
            </button>
          </section>
        </section>
        <div
          v-for="column in cateInfoTable"
          class="confnetcate-setting-def__box"
          :key="column.label"
        >
          <span class="confnetcate-setting-def__box__label">
            {{ column.label }}</span>
          <span class="confnetcate-setting-def__box__value">
            {{ column.value }}</span>
        </div>
      </section>
      <section class="confnetcate-setting__section confnetcate-setting-env">
        <section class="setting-section-header">
          <span class="setting-section-header__title">
            {{ $v("환경변수 설정") }}</span>
          <section class="setting-section-header__buttons">
            <div v-if="!isEditEnv">
              <button
                class="button"
                type="is-primary"
                :disabled="isDisabledBtnAdd"
                @click="handleClickAddEnvVar"
              >
                {{ $v("추가") }}
              </button>
              <button
                class="button"
                type="is-black"
                @click="handleClickUpdateEnvVar"
                :disabled="isDisabledBtnUpdate"
              >
                {{ $v('수정') }}
              </button>
              <button
                class="button"
                type="is-anti"
                @click="handleClickDeleteEnvVars"
                :disabled="isDisabledBtnDelete"
              >
                {{ $v('삭제') }}
              </button>
            </div>
            <div v-else>
              <button
                class="button"
                type="is-primary"
                @click="handleClickCancleGrid"
              >
                {{ $v("취소") }}
              </button>
              <button
                class="button"
                type="is-black"
                @click="handleClickUpdateGrid"
                :disabled="isDisabledBtnApply"
              >
                {{ $v('적용') }}
              </button>
            </div>
          </section>
        </section>
        <config-network-cate-env
          :is-edit-env="isEditEnv"
          :is-new-row="isNewRow"
          :selected-cate-item="netCateItem"
          :is-deleted-before="isDeletedBefore"
          @checkRows="handleCheckRows"
          @change="handleChangeNewEnv"
          @apiGetAfter="handleApiGetAfter"
          class="confnetcate-setting-env__grid"
        />
      </section>
    </div>
    <el-dialog
      :title="$v('네트워크 카테고리 정보 수정')"
      :visible="isOpenedNetCateUpdate"
      @close="handleCloseModal"
    >
      <modal-network-cate-update
        :is-opened="isOpenedNetCateUpdate"
        :selected-cate-item="netCateItem"
        :selected-cate-info="cateInfoTable"
        :cate-modal-type="cateModalType"
        @change="handleChangeCateUpdate"
      />
      <modal-footer
        @close="handleCloseModal"
        @confirm="handleSaveModal"
        :confirm-text="$t('common.BTN.save')"
      />
    </el-dialog>
  </div>
</template>

<script>
import ConfigNetworkCateEnv from './ConfigNetworkCateEnv.vue'
// import { cloneDeep } from 'lodash'
import API, { CommonModalFooter } from '@sd-fe/cmp-core'
import ModalNetworkCateUpdate from './ModalNetworkCateUpdate.vue'

export default {
  components: {
    ConfigNetworkCateEnv,
    ModalNetworkCateUpdate,
    ModalFooter: CommonModalFooter
  },
  props: {
    selectedTreeItem: {
      type: Object,
      default () {
        return {}
      }
    }
  },
  computed: {
    checkedRowsLength () {
      return this.checkedRows.length
    },
    isDisabledBtnDelete () {
      return this.checkedRowsLength <= 0
    },
    isDisabledBtnUpdate () {
      return this.checkedRowsLength !== 1
    },
    isDisabledBtnApply () {
      return !this.newEnvItem.varKey || !this.newEnvItem.varValue
    },
    isDisabledBtnAdd () {
      return !this.isSuccessEnv
    }
  },
  watch: {
    selectedTreeItem: {
      deep: true,
      async handler (val) {
        if (val !== null) {
          this.netCateItem = val
          const cateDetail = await this.getNetworkCategoryDetail(val.cateIdx)
          this.setCateInfoTable(cateDetail)
          this.isEditEnv = false
          this.newEnvItem = {}
        }
      }
    }
  },
  methods: {
    // 모달 핸들러
    /** EVENT_HANDLER - (모달 닫기) 모달을 닫기**/
    handleCloseModal () {
      this.isOpenedNetCateUpdate = false
    },
    /** EVENT_HANDLER - (모달 닫기) 모달을 닫기**/
    async handleSaveModal () {
      const isTrue = await this.updateIpCategory(
        this.selectedTreeItem.cateIdx, {
          ...this.selectedTreeItem,
          ...this.cateUpdateForm,
          ipCategoryIdx: this.selectedTreeItem.cateIdx,
          parentNode: undefined,
          children: undefined
        })
      if (isTrue) {
        this.$alert(this.$v('수정하였습니다.'))
        this.isOpenedNetCateUpdate = false
      }
    },
    /** EVENT_HANDLER - (수정 취소) 그리드 수정 취소 */
    handleClickCancleGrid () {
      this.newEnvItem = {}
      this.isEditEnv = false
    },
    handleApiGetAfter (isSuccessGetEnv) {
      this.isSuccessEnv = isSuccessGetEnv
    },
    /** EVENT_HANDLER - (POST) 핸들 */
    async handleChangeCateUpdate (cateUpdate) {
      this.cateUpdateForm = cateUpdate
    },
    /** API_HANDLER (PUT) 네트워크 카테고리 업데이트 */
    async  updateIpCategory (cateIdx, payload) {
      try {
        const result = await API.network.updateIpCategory(cateIdx, payload)
        this.$emit('updateAfter')
        if (result) return true
      } catch (error) {
        if (error?.response?.data?.code) {
          const code = error?.response?.data?.code
          switch (code) {
            case 'NET6003': this.$alert(this.$v('네트워크 카테고리명을 변경 해 주세요.')); break
            case 'NET6004': this.$alert(this.$v('수정 된 값이 없습니다.')); break
            case 'NET6005': this.$alert(this.$v('코드 값을 입력해주세요.')); break
            case 'NET5004': this.$alert(this.$v('중복 된 코드 값입니다.')); break
            default : this.$alert(this.$v('수정 된 값이 없습니다.'))
          }
        }
      }
    },
    handleOpenModal () {
      this.isOpenedNetCateUpdate = true
      this.$emit('openModal')
    },
    /** EVENT_HANDLER - (수정 적용) 그리드 수정 내용 적용 */
    async handleClickUpdateGrid () {
      const _message = this.isNewRow ? '환경변수를 추가하시겠습니까?' : '환경변수를 변경하시겠습니까?'
      const _api = this.isNewRow ? this.createTheEnvVar : this.updateTheEnvVar
      const isConfirmed = await this.$confirm(this.$v(_message),
        { cancelButtonText: this.$v('취소'), confirmButtonText: this.$v('저장') }).then(() => true)
      if (isConfirmed) {
        await _api(this.newEnvItem)
        this.isEditEnv = false
        this.newEnvItem = {}
      }
    },
    /** EVENT_HANDLER  - (내용 수정) 그리드에 Row 업데이트 발생 */
    handleChangeNewEnv (newEnvItem) {
      // const { varKey, varValue } = newEnvItem
      this.newEnvItem = newEnvItem
    },
    setCateInfoTable (selectedCate) {
      if (selectedCate) {
        this.cateInfoTable.forEach((item) => {
          item.value = selectedCate[item.bindKey]
        })
      }
    },
    // SECTION 환경변수 설정 추가 변경
    handleClickAddEnvVar () {
      this.isNewRow = true
      this.isEditEnv = true
    },
    handleClickUpdateEnvVar () {
      this.isNewRow = false
      this.isEditEnv = true
    },
    async handleClickDeleteEnvVars () {
      this.isDeletedBefore = true
      const confirm = await this.$confirm(this.$v('삭제하시겠습니까?'),
        { cancelButtonText: this.$v('취소'), confirmButtonText: this.$v('확인') }).then(() => true)
        .catch(() => {
          this.isDeletedBefore = false
        })

      if (confirm) {
        const checkedEnvIdxs = this.checkedRows.map((envVarRow) => envVarRow.envVarIdx)
        const result = await this.deleteTheEnvVar(checkedEnvIdxs)
        if (result) {
          this.isDeletedBefore = false
        }
      }
    },
    handleCheckRows (payload) {
      this.checkedRows = payload
    },
    /** API_HANDLER (GET) 네트워크 카테고리 상세 조회 */
    getNetworkCategoryDetail: async (cateIdx) => {
      try {
        const result = await API.network.getNetworkCategoryDetail(cateIdx)
        // result  =
        return result || []
      } catch (error) {
        this.$alert(this.$v('삭제하시겠습니까?'))
      }
    },
    /** API_HANDLER (DELETE) 환경변수 삭제 */
    deleteTheEnvVar: async (envVarIdxs) => {
      try {
        const result = await API.network.deleteTheEnvVar(envVarIdxs)
        if (result) { this.$alert(this.$v('삭제하였습니다.')) }
        return true
      } catch (error) {
        this.$alert(this.$v('삭제를 실패하였습니다.'))
      }
    },
    /** API_HANDLER (PUT) 환경변수 수정 */
    async updateTheEnvVar (newEnvItem) {
      try {
        const { varKey, varValue, isEncrypted, comment, envVarIdx } = newEnvItem
        const ipCategoryIdx = this.selectedTreeItem.cateIdx
        const payload = { varKey, varValue, isEncrypted, comment, ipCategoryIdx, envVarIdx }
        const result = await API.network.updateTheEnvVar(payload)
        if (result) { this.$alert(this.$v('수정하였습니다.')) }
      } catch (error) {
        this.$alert(this.$v('수정를 실패하였습니다.'))
      }
    },
    /** API_HANDLER (POST) 환경변수 추가 */
    async  createTheEnvVar (newEnvItem) {
      try {
        const { varKey, varValue, isEncrypted, comment } = newEnvItem
        const ipCategoryIdx = this.selectedTreeItem.cateIdx
        const payload = { varKey, varValue, isEncrypted, comment, ipCategoryIdx }
        const result = await API.network.createTheEnvVar(payload)
        if (result) { this.$alert(this.$v('추가하였습니다.')) }
        return true
      } catch (error) {
        this.$alert(this.$v('추가 실패'))
      }
    }
    // !SECTION
  },
  data () {
    return {

      // 모달 핸들링 변수
      cateModalType: 'MODIFY', // MODIFY(수정), DATACENTER_ADD(데이터센터추가), CHILDEN_ADD(하위항목추가)
      isOpenedNetCateUpdate: false,
      cateUpdateForm: null,
      cateInfoTable: [
        {
          label: this.$v('네트워크 카테고리 명'),
          bindKey: 'codeValue',
          value: ''
        },
        { label: this.$v('코드 값'), bindKey: 'codeName', value: '' }
      ],
      netCateItem: {},
      isNewRow: false,
      isEditEnv: false,
      isDeletedBefore: false,
      isSuccessEnv: false,
      checkedRows: [],
      newEnvItem: {}
    }
  }
}
</script>

<style lang="scss" scoped>
.config-network-cate-setting {
  position: relative;
  display: flex;
  flex-direction: column;
  .config-network-cate-setting--is-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: content-box;
    border: 1px solid $gray;
    border-radius: 4px;
    width: 100%;
    height: 100%;
    top: 0px;
    left: 0px;
    z-index: 1;
    .empty-text {
      color: $gray;
    }
  }
  .confnetcate-setting__section {
    width: 100%;
    min-height: 200px;
    margin-top: 20px;
    .setting-section-header {
      display: flex;
      justify-content: space-between;
      .setting-section-header__title {
        font-size: 16px;
        font-weight: 500;
        align-self: center;
      }
      .setting-section-header__buttons {
        display: flex;
        * {
          margin-left: 10px;
        }
      }
    }
    .confnetcate-setting-def__box {
      display: flex;
      padding: 20px;
      box-sizing: content-box;
      border: 1px solid #3e435c;
      border-radius: 4px;
      background-color: #26273c;
      margin-top: 16px;
      font-size: 16px;
      .confnetcate-setting-def__box__label {
        min-width: 200px;
        color: #737fee;
        font-weight: 600;
      }
      .confnetcate-setting-def__box__value {
      }
    }
  }
  .confnetcate-setting-env {

    .confnetcate-setting-env__grid {
      margin-top: 20px;
    }
  }

}
</style>
