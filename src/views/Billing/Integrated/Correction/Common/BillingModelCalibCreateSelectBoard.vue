<template>
  <dashboard-panel
    v-loading="creating"
    class="dashboard__left"
    :title="`${displayServerOrCompany}별 보정 모델`"
    :padding-top="10"
  >
    <template #header>
      <div class="header-button-area">
        <button
          v-loading="isLoadingModels"
          :disabled="isDisabledLoadModelBtn"
          class="button"
          type="is-primary"
          @click="isOpenedModalCM = true"
        >
          보정 모델 불러오기
        </button>
      </div>
    </template>

    <template #headerPostfix>
      <span
        class="postfix"
        @click="onClickResetForm"
      >
        <i class="mdi mdi-refresh" />
        <span>{{ $t("common.BTN.reset") }}</span>
      </span>
    </template>

    <div class="model-create-body">
      <div class="input-wrap">
        <el-input
          v-model="modelName"
          class="model-input"
          :placeholder="'보정 모델명을 입력해주세요.'"
        />
      </div>
      <div
        class="button-wrap"
        style="display: flex;"
      >
        <button
          class="button"
          type="is-anti"
          size="is-large"
          @click="$router.go(-1)"
        >
          {{ $t("common.BTN.cancel") }}
        </button>
        <button
          class="button"
          type="is-primary"
          size="is-large"
          @click="onClickAddModel"
        >
          {{ $v("적용") }}
        </button>
      </div>

      <!-- <div
        class="button-wrap"
        style="display: flex;"
      >
        <button
          class="button"
          type="is-default"
          size="is-large"
        >
          Excel 업로드 양식 다운로드
          <span class="download-icon" />
        </button>
        <el-upload
          action=""
          ref="excel-upload"
          :limit="1"
          :multiple="false"
          :show-file-list="false"
          :auto-upload="false"
          class="excel-upload"
        >
          <button
            class="button"
            type="is-default"
            size="is-large"
          >
            Excel 업로드
            <span class="upload-icon" />
          </button>
        </el-upload>
      </div> -->
    </div>
    <el-dialog
      :title="$v('보정 모델 불러오기')"
      :visible.sync="isOpenedModalCM"
      width="auto"
    >
      <cmp-grid
        ref="fetchModelGrid"
        :item-source="fetchModels"
        :columns="fetchGridColumnByModelType"
        selectable
        @selectedRow="handleEmitSelectedRow"
      />
      <div class="modal-footer modal-button-area">
        <button
          class="button -modal-button"
          type="is-anti"
          @click="handleClickCancleCM"
        >
          {{ $t("common.BTN.cancel") }}
        </button>
        <button
          class="button -modal-button"
          @click="handleClickConfirmCM"
          :disabled="!selectedCalibModel"
          type="is-primary"
        >
          {{ $t("common.BTN.confirm") }}
        </button>
      </div>
    </el-dialog>
  </dashboard-panel>
</template>

<script>
import API, { DashboardPanel } from '@sd-fe/cmp-core'
import { mapGetters } from 'vuex'
import { omit } from 'lodash'
import { EventBus } from '@/components/Billing/Correction/CorrectionEventBus'

export default {
  props: {
    isServer: {
      type: Boolean,
      required: true
    },
    items: {
      type: Array,
      default () {
        return []
      }
    },
    serverMap: {
      type: Object,
      default: () => null
    },
    gridData: {
      type: Array,
      default: () => []
    },
    fallbackUpdateModel: {
      type: Object,
      default: null
    }
  },
  components: { DashboardPanel },
  computed: {
    ...mapGetters({
      cloud: 'cloud/getCloud'
    }),
    /**
     * IP 카테고리 전부 펼친 상태
     */
    ipCategories () {
      if (this.items && this.items.length) {
        const result = []
        const travel = item => {
          if (item.children && item.children.length) {
            item.children.forEach(travel)
          }
          result.push(item)
        }
        this.items.forEach(travel)
        return result
      } else return []
    },
    /**
     * 수정 여부
     */
    isUpdate () {
      return this.$route.query && this.$route.query.edit
    },
    fetchGridColumnByModelType () {
      const modelType = this.isServer ? 'server' : 'company'

      if (modelType === 'server') {
        return this.fetchServerModelGridColumn
      } else {
        const copy = this.fetchServerModelGridColumn.slice(0)
        copy.splice(3, 1)
        return copy
      }
    },
    activeCategory () {
      return this.categoryList.find(category => category.active)
    },
    displayServerOrCompany () {
      return this.isServer ? this.$v('서버') : this.$v('관계사')
    },
    /**
     * 보정 모델 불러오기 비활성화 조건
     */
    isDisabledLoadModelBtn () {
      return this.isLoadingModels || !this.fetchModels.length
    }
  },
  created () {
    this.getServerModels()
    this.getGroupModels()

    EventBus.$on('init-form', this.initForm)
    EventBus.$on('reset-form', this.resetForm)
  },
  methods: {
    /**
     * 폼 초기화
     */
    resetForm () {
      this.modelName = ''
    },
    /**
     * 폼 초기화 호출 이벤트
     */
    onClickResetForm () {
      this.$confirm(this.$v('보정 모델 폼을 초기화하시겠습니까?'))
        .then(() => EventBus.$emit('reset-form'))
        .catch(() => false)
    },
    /**
     * 네트워크 카테고리 최상위 조회
     */
    getParentCategory (categoryIdx) {
      let target = this.ipCategories.find(
        category => category.cateIdx === categoryIdx
      )

      while (target && target.upperCategoryIdx) {
        const findTarget = this.ipCategories.find(
          category => category.cateIdx === target.upperCategoryIdx
        )
        if (!findTarget) return target
        target = this.ipCategories.find(
          category => category.cateIdx === target.upperCategoryIdx
        )
      }

      return target
    },
    /**
     * 불러오기 및 수정시 채워야할 데이터
     */
    initForm (model) {
      this.modelName = model.name
    },
    /**
     * 관계사별 보정 모델 검증
     */
    validateGroupCorrectionModel (correction) {
      if (!correction.discountClass) {
        this.$alert(this.$v('보정 분류를 입력해주세요.'))
        return false
      }
      if (!correction.discountKinds) {
        this.$alert(this.$v('보정 방식을 입력해주세요.'))
        return false
      }
      if (!correction.discountPeriodBegin) {
        this.$alert(this.$v('보정 시작일을 입력해주세요.'))
        return false
      }
      if (!correction.discountPeriodEnd) {
        this.$alert(this.$v('보정 종료일을 입력해주세요.'))
        return false
      }
      if (!correction.priceType) {
        this.$alert(this.$v('보정 감산/가산 방식을 선택해주세요.'))
        return false
      }
      if (!correction.discountPrice) {
        this.$alert(this.$v('보정 금액을 입력해주세요.'))
        return false
      }
      return true
    },
    /**
     * 관계사별 보정 모델 Request Body
     */
    getGroupModelReqBody (update = false) {
      if (!this.gridData || !this.gridData.length) {
        this.$alert(this.$v('등록된 관계사가 없습니다.'))
        return false
      }

      // const moduleType = this.getModuleType()
      const result = []

      for (let i = 0; i < this.gridData.length; i++) {
        const target = this.gridData[i]
        const localGroupInfo = {
          companyIdx: target.groupIdx,
          companyName: target.groupName,
          groupInfo: []
        }

        if (!target.corrections || !target.corrections.length) {
          this.$alert(this.$v('보정이 등록되지 않은 관계사가 존재합니다.'))
          return false
        }

        if (update) {
          localGroupInfo.modelId = parseInt(this.$route.query.id) || 0
        }

        for (let j = 0; j < target.corrections.length; j++) {
          const correction = target.corrections[j]
          if (!this.validateGroupCorrectionModel(correction)) return false
          const correctionData = {
            companyIdx: target.groupIdx,
            discountClass: correction.discountClass,
            discountKinds: correction.discountKinds,
            discountPeriodBegin: correction.discountPeriodBegin,
            discountPeriodEnd: correction.discountPeriodEnd,
            discountPrice:
              correction.priceType === 'minus'
                ? correction.discountPrice * -1
                : correction.discountPrice,
            discountReason: correction.discountReason,
            groupIdx: target.groupIdx,
            groupName: target.groupName
          }

          if (update) {
            correctionData.modelId = parseInt(this.$route.query.id) || 0
          }

          localGroupInfo.groupInfo.push(correctionData)
        }

        result.push(localGroupInfo)
      }

      const req = {
        // moduleType,
        name: this.modelName,
        groupInfo: result
      }

      if (update) {
        req.id = parseInt(this.$route.query.id) || 0
      }

      return req
    },
    async updateGroupCorrectionModel () {
      const req = this.getGroupModelReqBody(true)
      if (!req) return false

      await API.billing.updateGroupCorrectionModel(req, this.$route.query.id)
      return true
    },
    /**
     * 관계사별 보정 모델 추가
     */
    async createGroupCorrectionModel () {
      const req = this.getGroupModelReqBody()
      if (!req) return false

      await API.billing.createGroupCorrectionModel(req)
      return true
    },
    /**
     * 서버별 보정 모델 검증
     */
    validateServerCorrectionModel (correction) {
      if (!correction.discountClass) {
        this.$alert(this.$v('보정 분류를 입력해주세요.'))
        return false
      }
      if (!correction.discountKinds) {
        this.$alert(this.$v('보정 방식을 입력해주세요.'))
        return false
      }
      if (!correction.discountPeriodBegin) {
        this.$alert(this.$v('보정 시작일을 입력해주세요.'))
        return false
      }
      if (!correction.discountPeriodEnd) {
        this.$alert(this.$v('보정 종료일을 입력해주세요.'))
        return false
      }
      if (!correction.priceType) {
        this.$alert(this.$v('보정 감산/가산 방식을 선택해주세요.'))
        return false
      }
      if (!correction.discountPrice) {
        this.$alert(this.$v('보정 금액을 입력해주세요.'))
        return false
      }
      if (!correction.hostName) {
        this.$alert(this.$v('VM 호스트명 에러'))
        return false
      }
      if (!correction.vmUuid) {
        this.$alert(this.$v('VM UUID 에러'))
        return false
      }
      return true
    },
    /**
     * 서버별 보정 모델 Request Body
     */
    getServerModelReqBody (update = false) {
      const serverMap = this.serverMap
      // const mapValues = flatten(
      //   Array.from(serverMap.values()).map(
      //     mapVal => mapVal.registeredServerList
      //   )
      // )
      const mapValues = serverMap.registeredServerList
      const serverInfo = []

      for (const item of mapValues) {
        if (!item.corrections || !item.corrections.length) {
          this.$alert(
            this.$v('보정이 등록되지 않은 서버가 존재합니다.'),
            {
              callback: () => null
            }
          )
          return null
        }

        const localServerInfo = {
          serverInfo: [],
          companyIdx: item.companyIdx,
          companyName: item.companyName,
          dataCenter: item.center,
          hostName: item.hostname,
          ipAddress: item.ipAddress,
          projectIdx: item.projectIdx,
          projectName: item.projectName,
          taskInfo: item.itsmName,
          vmUuid: item.vmUuid || ''
        }

        if (update) {
          if (this.fallbackUpdateModel) {
            const findVm = this.fallbackUpdateModel.serverInfo.find(vm => vm.vmUuid === item.vmUuid)
            if (findVm) {
              localServerInfo.serverIdx = findVm.serverIdx
              localServerInfo.modelId = findVm.modelId
            }
          }
          localServerInfo.modelId = parseInt(this.$route.query.id) || 0
        }

        for (const correction of item.corrections) {
          const data = {
            ...correction,
            hostName: item.hostname,
            discountPrice:
              correction.priceType === 'minus'
                ? correction.discountPrice * -1
                : correction.discountPrice
          }
          if (update) {
            data.modelId = parseInt(this.$route.query.id) || 0
          }
          if (!this.validateServerCorrectionModel(data)) return
          localServerInfo.serverInfo.push(
            omit(data, ['__ui_uid__', 'priceType', 'updateDate', 'createDate'])
          )
        }

        serverInfo.push(localServerInfo)
      }

      // const moduleType = this.getModuleType()

      const req = {
        serverInfo,
        // moduleType,
        name: this.modelName
      }

      if (update) {
        req.id = parseInt(this.$route.query.id) || null
      }

      return req
    },
    /**
     * 서버별 보정 모델 업데이트
     */
    async updateServerCorrectionModel () {
      if (!this.serverMap) return false

      const req = this.getServerModelReqBody(true)
      if (!req) return false

      await API.billing.updateServerCorrectionModel(req, this.$route.query.id)
      return true
    },
    /**
     * 서버별 보정 모델 추가
     */
    async createServerCorrectionModel () {
      if (!this.serverMap) return

      const req = this.getServerModelReqBody()
      if (!req) return false

      await API.billing.createServerCorrectionModel(req)
      return true
    },
    /**
     * 보정 모델 추가
     */
    onClickAddModel () {
      if (!this.modelName) {
        return this.$alert(this.$v('모델명을 입력해주세요.'))
      }

      const message = {
        CREATE_SUCCESS: this.$v('보정 모델 생성을 완료하였습니다.'),
        CREATE_FAIL: this.$v('보정 모델 생성에 실패하였습니다.'),
        CREATE_CONFIRM: this.$v('입력하신 정보로 모델을 생성하시겠습니까?'),
        UPDATE_SUCCESS: this.$v('보정 모델 수정을 완료하였습니다.'),
        UPDATE_FAIL: this.$v('보정 모델 수정에 실패하였습니다.'),
        UPDATE_CONFIRM: this.$v('입력하신 정보로 모델을 수정하시겠습니까?')
      }

      const bindMessage = {
        CREATE: {
          SUCCESS: message.CREATE_SUCCESS,
          FAIL: message.CREATE_FAIL,
          CONFIRM: message.CREATE_CONFIRM
        },
        UPDATE: {
          SUCCESS: message.UPDATE_SUCCESS,
          FAIL: message.UPDATE_FAIL,
          CONFIRM: message.UPDATE_CONFIRM
        }
      }[this.isUpdate ? 'UPDATE' : 'CREATE']

      this.$confirm(bindMessage.CONFIRM)
        .then(async () => {
          try {
            this.creating = true

            let callback

            if (this.isServer) {
              if (!this.isUpdate) callback = this.createServerCorrectionModel
              else callback = this.updateServerCorrectionModel
            } else {
              if (!this.isUpdate) callback = this.createGroupCorrectionModel
              else callback = this.updateGroupCorrectionModel
            }

            const result = await callback()
            if (!result) {
              this.creating = false
              return
            }

            this.$alert(bindMessage.SUCCESS, {
              callback: () => {
                const routeName = this.$route.name
                const splitRouteName = routeName.split('-')
                const goRouteName = splitRouteName
                  .slice(0, splitRouteName.length - 1)
                  .join('-')
                this.$router.push({ name: goRouteName })
              }
            })
          } catch (error) {
            console.log(error)
            if (error.response.data) {
              switch (error.response.data.code) {
                case 'BIL2001':
                  return this.$alert(this.$v('중복된 모델명입니다.'))
                case 'BIL10018':
                  return this.$alert(this.$v('보정이 등록된 서버가 없습니다.'))
                case 'BIL10019':
                  return this.$alert(this.$v('보정이 등록된 관계사가 없습니다.'))
                default:
                  return this.$alert(bindMessage.FAIL)
              }
            } else {
              return this.$alert(bindMessage.FAIL)
            }
          } finally {
            this.creating = false
          }
        })
        .catch(() => false)
    },
    // getModuleType () {
    //   return {
    //     nutanix: 'NX',
    //     vmware: 'VMWARE'
    //   }[this.cloud]
    // },
    transformModel (model, index) {
      return {
        ...model,
        modelIndex: index + 1,
        isBilling: model.deleteAble ? 'N' : 'Y',
        registrationDate:
          this.$options.filters.date(model.createTime, 'YYYY. MM. DD') +
          (model.updateTime
            ? '(' + this.$options.filters.date(model.updateTime, 'YYYY. MM. DD') + ')'
            : '')
      }
    },
    /**
     * 서버별 보정 모델 조회
     */
    async getServerModels () {
      if (this.isLoadingModels || !this.isServer) return

      this.isLoadingModels = true

      try {
        const { data } = await API.billing.getSimpleCorrectionModel(
          true
        )
        this.fetchModels = data.map(this.transformModel)
        this.$emit('load-models', this.fetchModels)
      } catch (error) {
        console.log(error)
        this.fetchModels = []
      } finally {
        this.isLoadingModels = false
      }
    },
    /**
     * 관계사별 보정 모델 조회
     */
    async getGroupModels () {
      if (this.isLoadingModels || this.isServer) return

      this.isLoadingModels = true

      try {
        const { data } = await API.billing.getSimpleCorrectionModel(
          false
        )
        this.fetchModels = data.map(this.transformModel)
        this.$emit('load-models', this.fetchModels)
      } catch (error) {
        console.log(error)
        this.fetchModels = []
      } finally {
        this.isLoadingModels = false
      }
    },
    /** EVENT_HANDLER (선택) 로우를 선택합니다. */
    handleEmitSelectedRow (selectedRow) {
      this.selectedCalibModel = selectedRow?.dataItem
    },
    /** EVENT_HANDLER (확인) 보정 모델 불러오기 모달 확인 */
    handleClickConfirmCM () {
      this.isOpenedModalCM = false
      if (this.$refs.fetchModelGrid) {
        this.$refs.fetchModelGrid.setSelectState()
        this.$emit('fetch-model', this.selectedCalibModel)
        this.selectedCalibModel = null
      }
    },
    /** EVENT_HANDLER (취소) 보정 모델 물러오기 모달 닫기 */
    handleClickCancleCM () {
      console.log('@handleClickCancleCM')
      this.isOpenedModalCM = false
    }
  },
  data () {
    return {
      creating: false,
      modelName: '',
      itemSourceCalibModel: [],
      // columnsCalibModel: [
      //   { header: this.$v('No'), binding: 'no', width: 70 },
      //   { header: this.$v('보정 모델 명'), binding: 'billingName', width: 200 },
      //   { header: this.$v('빌링여부'), binding: 'isUsedBilling', width: 100 },
      //   { header: this.$v('등록 서버수'), binding: 'serverNumber', width: 150 },
      //   {
      //     header: this.$v('등록일 (마지막 수정일)'),
      //     binding: 'registrationDate',
      //     width: 216
      //   }
      // ],
      fetchServerModelGridColumn: [
        { header: 'No', binding: 'modelIndex', width: 70 },
        { header: this.$v('보정 모델 명'), binding: 'modelName', width: 200 },
        { header: this.$v('빌링여부'), binding: 'isBilling', width: 100 },
        { header: this.$v('등록 서버수'), binding: 'register', width: 150 },
        {
          header: this.$v('등록일 (마지막 수정일)'),
          binding: 'registrationDate',
          width: 216,
          customHtml: true
        }
      ],
      selectedWhiteBoardLabel: this.items[0],
      selectedCalibModel: null,
      isOpenedModalCM: false,
      categoryList: [],
      isLoadingModels: false,
      fetchModels: []
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard__left {
  min-width: 400px;
  margin-right: $gap-m;
  & .postfix {
    cursor: pointer;
    padding-left: 3px;
    font-weight: normal;
    & > * {
      display: inline-block;
      color: $text-lighter-gray;
      font-size: 11px;
    }
    & > .mdi-refresh {
      margin-left: 3px;
      transform: rotate(270deg);
      &::before {
        font-size: 14px;
      }
    }
    vertical-align: middle;
  }

  .model-create-body {
    .center-list {
      margin-top: $gap-m;
      background-color: white;
      border-radius: 6px;
      box-shadow: 10px 10px 30px rgba(0, 0, 0, 0.5);
      padding: $gap;
      color: #333;

      & > * + * {
        margin-top: $gap-s;
        padding-top: $gap-s;
        border-top: 1px solid #e9e9e9;
      }

      &-item {
        cursor: pointer;

        &.active {
          color: $primary;
          font-weight: bold;
        }

        &__icon,
        &__label {
          display: inline-block;
        }

        &__icon {
          position: relative;
          top: 1px;
          margin-right: 5px;

          .mdi {
            &::before {
              font-size: 16px;
            }
          }
        }

        &__label {
          font-size: 14px;
        }
      }
    }

    .input-wrap {
      margin-bottom: $gap-s;
      & .model-input {
        &::v-deep .el-input__inner {
          padding: $gap;
        }
      }
    }

    .button-wrap {
      display: flex;
      flex-wrap: nowrap;

      button {
        flex: 1 1 50%;
        &:first-of-type {
          margin-right: $gap-s;
        }
      }
      .excel-upload {
        button {
          margin-right: unset;
        }
      }
    }
  }
}
</style>
