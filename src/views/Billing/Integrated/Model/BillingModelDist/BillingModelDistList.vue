<template>
  <div
    v-loading="loadingLoadModels"
    class="dist"
    :class="{ [$i18n.locale]: true }"
  >
    <div class="dist-list">
      <section class="dist-list-header">
        <h3>{{ $t('bill.exposeDist') }}</h3>
        <button
          class="button"
          type="is-primary"
          @click="createDistModel"
        >
          {{ $t('bill.createDist') }}
        </button>
      </section>
      <section class="dist-list-models">
        <billing-model
          v-if="applyModel"
          :model-data="applyModel"
          is-apply-model
          distribute-model
          root-clickable
          @all-expand="onUpdateAllExpand"
          @active-model="onChangeActiveModel"
          @expand-model="onExpandModel"
          @click-root="onClickRoot"
        />
        <div
          v-else
          class="empty-data"
        >
          {{ $t('common.PLACEHOLDER.noData') }}
        </div>
      </section>
      <section class="dist-list-filter">
        <div class="dist-list-filter__head">
          <h3>{{ $t('bill.allDist') }}</h3>
          <span>({{
            $t("bill.MODEL.allCount", { count: distModels.length })
          }})</span>
        </div>
        <div class="dist-list-filter__open">
          <div
            v-if="!isOpenAllModel"
            @click="isOpenAllModel = true"
          >
            {{ $t("bill.MODEL.PLACEHOLDER.open") }}
            <i class="el-icon-arrow-down" />
          </div>
          <div
            v-else
            @click="isOpenAllModel = false"
          >
            {{ $t("bill.MODEL.PLACEHOLDER.close") }}
            <i class="el-icon-arrow-up" />
          </div>
        </div>
      </section>
      <section v-show="isOpenAllModel">
        <div class="billing-filter">
          <div class="is-billing-text">
            {{ $t("bill.MODEL.filterBilling") }}
          </div>
          <div class="radio-group">
            <el-radio-group
              v-model="filterOption"
              class="filter-radio-group"
            >
              <el-radio :label="2">
                {{ $t("main.DASHBOARD.all") }}
              </el-radio>
              <el-radio :label="1">
                Y
              </el-radio>
              <el-radio :label="0">
                N
              </el-radio>
            </el-radio-group>
          </div>
        </div>
        <div
          v-if="getModels(filterOption).length"
          class="filtered-items"
        >
          <billing-model
            v-for="model in getModels(filterOption)"
            ref="noApplyModels"
            :key="model.id"
            :model-data="model"
            distribute-model
            root-clickable
            @all-expand="onUpdateAllExpand"
            @active-model="onChangeActiveModel"
            @expand-model="onExpandModel"
            @update-apply="updateApply"
            @delete-model-group="deleteModel"
            @click-root="onClickRoot"
          />
        </div>
        <div
          v-else
          class="empty-data"
        >
          {{ $t('common.PLACEHOLDER.noData') }}
        </div>
      </section>
    </div>
    <div
      v-if="activeModel"
      v-loading="loadingLoadDetail"
      class="dist-detail"
    >
      <distribute-sheet
        :key="sheetRenderKey"
        v-if="!activeProject"
        :current-model="activeModel"
        :sheet-data="sheetData"
        @refresh="onRefreshSheetData"
        @open="historyModal = true"
        ref="sheet"
      />
      <template v-else>
        <distribute-detail
          v-if="!isEditActiveProject"
          :active-model="activeProject"
          :active-model-name="activeRootModelName"
        />
        <distribute-summary
          v-if="detailModel && detailCommonProject"
          :detail-common-project="detailCommonProject"
          @on-history="onHistory"
        />
        <div
          v-if="!isEditActiveProject"
          class="dist-detail-tab"
        >
          <div class="dist-detail-select">
            <span class="dist-detail-select__name">배부 입력 방식</span>
            <el-radio-group
              v-if="detailModel"
              :value="detailModel.distributeInputType"
            >
              <el-radio
                label="DIRECT"
                :disabled="detailModel.distributeInputType !== 'DIRECT'"
              >
                직접 입력
              </el-radio>
              <el-radio
                label="TEMPLATE"
                :disabled="detailModel.distributeInputType !== 'TEMPLATE'"
              >
                템플릿 선택
              </el-radio>
            </el-radio-group>
            <button
              class="button"
              type="is-primary"
              style="margin-left: auto;"
              :disabled="activeModel.confirm || activeModel.apply"
              @click="onClickChangeActiveProject"
            >
              변경
            </button>
          </div>
          <distribute-tabs
            v-if="detailModel"
            :detail-model="detailModel"
            :std-ref="sheetData"
          />
        </div>
        <distribute-edit-form
          v-else
          :key="editFormRenderKey"
          :project="detailModel"
          :model="activeModel"
          @cancel="onClickCancelUpdateActiveProject"
          @save="onClickCancelUpdateActiveProject"
        />
      </template>
    </div>
    <div
      v-else
      class="empty-data"
      style="width: 100%; height: 50px; text-align: center;"
    >
      {{ $t('common.PLACEHOLDER.noData') }}
    </div>
    <distribute-history-modal
      :active.sync="activeHistoryModal"
      :active-dist-model="activeModel"
      @close="activeHistoryModal = false"
    />
    <el-dialog
      :visible.sync="isActiveCreateModal"
      :title="$v('배부 모델 추가')"
    >
      <div class="create-dist">
        <span class="label">
          {{ $v('배부 모델 이름') }} <span class="required">*</span>
        </span>
        <el-input
          v-model="createDistModelName"
          :placeholder="$v('배부 모델 이름을 입력하세요.')"
        />
      </div>
      <section class="modal-button-area">
        <button
          class="button"
          type="is-anti"
          @click="isActiveCreateModal = false"
        >
          {{ $v('취소') }}
        </button>
        <button
          class="button"
          type="is-primary"
          @click="onClickCreateDistModel"
        >
          {{ $v('추가') }}
        </button>
      </section>
    </el-dialog>
    <grid-modal
      :active.sync="historyModal"
      :title="$v('히스토리')"
      :column-data="histColumns"
      :table-data="histData"
      :use-cancel-btn="false"
      :loading="isGetHistory"
      width="700px"
      @close="historyModal = false"
      >
      <template #createDate="{ row }">
        <p>{{ row.createDate | date('YYYY.MM.DD') }}</p>
      </template>
      <template #userName="{ row }">
        <p>{{ row.userName || '-' }}</p>
      </template>
      <template #excel="{ row }">
        <button
          class="button"
          @click="() => downloadExcel(row)"
        >
          {{ $t("common.BTN.excelDownload") }}
          <i class="download-icon" />
        </button>
      </template>
    </grid-modal>
  </div>
</template>

<script>
import BillingModel from '@/components/Billing/BillingModel.vue'
import API, { DistributeEditForm } from '@sd-fe/cmp-core'
import DistributeDetail from '@/components/Billing/Distribute/DistributeDetail.vue'
import DistributeSummary from '@/components/Billing/Distribute/DistributeSummary.vue'
import DistributeTabs from '@/components/Billing/Distribute/DistributeTabs.vue'
import DistributeHistoryModal from '@/components/Billing/Distribute/DistributeHistoryModal.vue'
import DistributeSheet from '@/components/Billing/Distribute/DistributeSheet.vue'
import GridModal from '@/components/Modal/GridModal/GridModal'
import XLSX from 'xlsx'
import dayjs from 'dayjs'
import { cloneDeep, omit } from 'lodash'
export default {
  name: 'BillingModelDistList',
  components: {
    BillingModel,
    DistributeDetail,
    DistributeEditForm,
    DistributeHistoryModal,
    DistributeSheet,
    DistributeSummary,
    DistributeTabs,
    GridModal
  },
  computed: {
    isBillingModels () {
      return this.distModels.filter(model => model.confirm)
    },
    noBillingModels () {
      return this.distModels.filter(model => !model.confirm)
    },
    activeRootModelName () {
      return this.activeModel?.name
    }
  },
  watch: {
    activeProject (project) {
      if (project) {
        this.getDetailModel(project.id, project.projectIdx)
        this.editFormRenderKey = Date.now()
        this.isEditActiveProject = false
      }
    },
    isActiveCreateModal (visible) {
      if (!visible) {
        this.createDistModelName = ''
      }
    }
  },
  created () {
    this.getDistModels()
  },
  methods: {
    onClickCreateDistModel () {
      if (!this.createDistModelName) {
        return this.$alert(this.$v('배부 모델 이름을 입력하세요.'))
      }

      const modelName = this.createDistModelName
      const getCloneModel = () => omit(cloneDeep(this.applyModel),
        [
          'active',
          'apply',
          'applyDate',
          'createTime',
          'batchDate',
          'updateTime',
          'id',
          'iamProjectSync',
          'name'
        ]
      )

      this.$confirm(this.$v('배부 모델을 추가하시겠습니까?'))
        .then(async () => {
          const model = getCloneModel()
          model.name = modelName
          model.distributeProjects.forEach(project => {
            project.distributeInputType = 'DIRECT'

            project.distributeGroups.forEach(group => {
              group.stdRefIdx = null
            })
          })

          if (!model.name) {
            this.$alert(this.$v('배부 모델 이름을 입력하세요.'))
            return
          }

          const loading = this.$loading()

          try {
            const { data } = await API.billing.getDistributeStdRef({
              distributeModelId: this.applyModel.id
            })
            const copyStdRef = data.map(stdRef => omit(stdRef, ['stdRefIdx', 'distributeModelId']))
            // 배부 모델 생성
            await API.billing.insertDistModel(model)
            // 배부 모델 조회
            const distModels = await API.billing.getDistModel()
            const createdModelId = distModels[distModels.length - 1]?.id
            // 배부 표준 템플릿 생성
            await Promise.all(copyStdRef.map(stdRef => API.billing.createDistributeStdRef({ ...stdRef, distributeModelId: createdModelId })))

            this.$alert(this.$v('배부 모델을 생성하였습니다.'), {
              onClose: () => {
                this.createDistModelName = ''
                this.isActiveCreateModal = false
                this.getDistModels()
              }
            })
          } catch (createdError) {
            console.log(createdError)
            if (createdError?.data?.code === 'BIL2001') {
              this.$alert(this.$v('중복된 모델명입니다.'))
            } else {
              this.$alert(this.$v('배부 모델 생성에 실패하였습니다.'))
            }
          } finally {
            loading.close()
          }
        })
        .catch(() => false)
    },
    onClickCancelUpdateActiveProject () {
      this.isEditActiveProject = false
      this.getDetailModel(this.activeProject.id, this.activeProject.distributeModelId)
    },
    onClickChangeActiveProject () {
      this.isEditActiveProject = true
    },
    async onRefreshSheetData () {
      await this.getSheetData(this.activeModel)
      this.sheetRenderKey = Date.now()
    },
    async getSheetData (model) {
      this.loadingLoadModels = true
      try {
        const { data } = await API.billing.getDistributeStdRef({
          distributeModelId: model.id
        })
        this.sheetData = data
        await this.getHistory(this.activeModel)
      } catch (error) {
        console.log(error)
        this.$alert(this.$v('배부 모델 기준표 조회에 실패하였습니다.'))
      } finally {
        this.loadingLoadModels = false
      }
    },
    async onClickRoot (model) {
      if (this.applyModel && this.applyModel.distributeProjects) this.applyModel.distributeProjects.forEach(this.inActiveModel)
      this.distModels.forEach(distModel =>
        distModel.distributeProjects.forEach(this.inActiveModel)
      )
      this.activeModel = model
      this.activeProject = null
      await this.getSheetData(this.activeModel)
      this.sheetRenderKey = Date.now()
    },
    onUpdateAllExpand () {
      if (this.$refs.noApplyModels) {
        this.$refs.noApplyModels.forEach(model => {
          model.isOpenNoApplyModel = false
        })
      }
    },
    /**
     * 배부 모델 히스토리 조회 모달 오픈
     */
    onHistory () {
      this.activeHistoryModal = true
    },
    async deleteModel (model) {
      return this.$confirm(this.$t('common.CONFIRM.BILL.013'))
        .then(async () => {
          if (!model.deletable) {
            this.$alert(this.$t('common.ALERT.BILL.048'))
            return
          }

          try {
            this.loadingLoadModels = true
            await API.billing.deleteDistModel(model.id)
            this.$alert(this.$t('common.ALERT.BILL.049'), { callback: () => this.getDistModels()() })
          } catch (error) {
            console.log(error)
            this.$alert(this.$t('common.ALERT.BILL.050'))
          } finally {
            this.loadingLoadModels = false
          }
        })
        .catch(() => false)
    },
    async updateApply (model) {
      return this.$confirm(this.$t('common.CONFIRM.BILL.014'))
        .then(async () => {
          const id = model.id
          const apply = true
          const reqObj = { id, apply }

          try {
            this.loadingLoadModels = true
            await API.billing.updateApply(reqObj)
            this.$alert(this.$t('common.ALERT.BILL.051'), {
              callback: () => this.getDistModels()
            })
          } catch (error) {
            console.log(error)
            this.$alert(this.$t('common.ALERT.BILL.052'))
          } finally {
            this.loadingLoadModels = false
          }
        })
        .catch(() => false)
    },
    getModels (filterOption) {
      switch (filterOption) {
        case 2:
          return this.distModels
        case 1:
          return this.isBillingModels
        default:
          return this.noBillingModels
      }
    },
    createDistModel () {
      // this.$router.push({ name: 'nx-billing-model-dist-create' })
      this.isActiveCreateModal = true
    },
    /**
     * 배부 모델 부모 active 값 매핑
     */
    mapActive (model) {
      this.$set(model, 'active', model.apply)
      if (model.distributeProjects && model.distributeProjects.length) {
        model.distributeProjects.forEach(this.mapActiveChildren)
      }
    },
    mapActiveChildren (project) {
      this.$set(project, 'active', false)
      this.$set(project, 'expanded', false)
      this.$set(project, 'expandable', true)
    },
    inActiveModel (model) {
      model.active = false
      model.expanded = false
    },
    onChangeActiveModel (model, modelIdx, isApplyModel) {
      const fn = () => {
        if (this.applyModel && this.applyModel.distributeProjects) this.applyModel.distributeProjects.forEach(this.inActiveModel)
        this.distModels.forEach(distModel =>
          distModel.distributeProjects.forEach(this.inActiveModel)
        )
        model.active = true
        this.activeProject = model
        const findModel = this.distModels.find(m => m.id === model.distributeModelId) || this.applyModel
        this.activeModel = findModel
      }

      fn()

      // if (this.$refs.sheet && this.$refs.sheet.isEdit) {
      //   this.$confirm(this.$v('프로젝트 선택시 입력중이던 내용이 초기화됩니다.<br>그래도 이동하시겠습니까?'), { dangerouslyUseHTMLString: true })
      //     .then(fn)
      //     .catch(() => false)
      // } else fn()
    },
    onExpandModel (model, modelIdx, isApplyModel) {
      if (model.expanded) {
        model.expanded = false
        return
      }
      // this.onChangeActiveModel(model, modelIdx, isApplyModel)
      model.expanded = true
    },
    onChangeActiveChildrenModel (item, isApplyModel, model) {
      // 공통 프로젝트 내 관계사에 대한 언급이 기획서에 없음... 따로 처리가 필요하면
      // 관계사를 클릭했을 때 이벤트를 여기서 처리
    },
    async getDetailModel (id, projectIdx) {
      try {
        this.loadingLoadDetail = true
        this.detailModel = null
        this.detailCommonProject = null
        // 빌링 모듈에서 주는 배부 모델 상세 정보
        const detail = await API.billing.getDistProject(id)
        this.detailModel = detail

        // IAM에서 projectIdx로 공통 프로젝트 조회
        const commonProject = await API.iam.getProject({
          inCommon: true,
          projectIdx: projectIdx
        })
        this.detailCommonProject = commonProject ? commonProject[0] : null
      } catch (error) {
        console.log(error)
      } finally {
        this.loadingLoadDetail = false
      }
    },
    // async getGroups () {
    //   try {
    //     const res = await API.iam.getGroupList({ groupUpper: 0 })
    //     this.rawGroups = res
    //   } catch (error) {
    //     console.log(error)
    //   }
    // },
    splitIntoChunk (arr, chunk) {
      const result = []

      for (let i = 0; i < arr.length; i += chunk) {
        const tempArray = arr.slice(i, i + chunk)
        result.push(tempArray)
      }

      return result
    },
    downloadExcel (row) {
      this.histRowData = row
      const workbook = XLSX.utils.book_new()
      const checkRowData = this.histRowData
      const companyInfo = this.rawGroups.map(group => {
        return {
          idx: group.groupIdx
        }
      })

      // Before 시트
      const beforeSheetHeader = ['변경일자', '변경한 사람', '관계사']
      const bfList = []
      const bfValues = []

      // 생성만 했을 경우

      // 변경 및 수정 시
      for (let i = 0; i < checkRowData.prevDistributeStdValueList.length; i++) {
        const stdRefName = checkRowData.prevDistributeStdValueList[i].stdRefName
        beforeSheetHeader.push(stdRefName)
        for (let j = 0; j < checkRowData.prevDistributeStdValueList[i].companyStdValueList.length; j++) {
          checkRowData.prevDistributeStdValueList.map(item => {
            const idx = item.companyStdValueList[j].companyIdx
            const val = item.companyStdValueList[j].standardValue
            const createdTime = dayjs(checkRowData.createDate).format('YYYY.MM.DD')
            const userName = checkRowData.userName
            const companyList = checkRowData.prevDistributeStdValueList[i].companyStdValueList[j].companyName
            bfValues.push(val)
            bfList.push(
              {
                createdTime: createdTime,
                editUser: userName,
                groupName: companyList,
                idx: idx
              }
            )
          })
        }
      }
      const map = new Map()
      companyInfo.forEach(item => map.set(item.idx, item))
      bfList.forEach(item => map.set(item.idx, { ...map.get(item.idx), ...item }))
      const bfSheetData = Array.from(map.values())

      const result = []
      for (let i = 0; i < bfValues.length; i += checkRowData.prevDistributeStdValueList.length) {
        result.push(bfValues.slice(i, i + checkRowData.prevDistributeStdValueList.length))
      }
      for (let i = 0; i < bfSheetData.length; i++) {
        for (let j = 0; j < result[i].length; j++) {
          result[i]['value' + j] = result[i][j]
          delete result[i][j]
        }
        bfSheetData[i] = { ...bfSheetData[i], ...result[i] }
        delete bfSheetData[i].idx
      }
      const bfSheetItem = bfSheetData

      const setBfSheet = {
        header: [],
        body: bfSheetItem
      }
      setBfSheet.header.push(beforeSheetHeader)
      const beforeWorksheet = XLSX.utils.json_to_sheet(setBfSheet.body)
      XLSX.utils.sheet_add_aoa(beforeWorksheet, setBfSheet.header)

      beforeWorksheet['!cols'] = [
        { width: 15 },
        { width: 15 },
        { width: 25 }
      ]
      console.log(beforeSheetHeader)

      XLSX.utils.book_append_sheet(workbook, beforeWorksheet, 'BEFORE')

      // After 시트
      const afterSheetHeader = ['변경일자', '변경한 사람', '관계사']
      const afList = []
      const afValues = []

      for (let i = 0; i < checkRowData.distributeStdValueList.length; i++) {
        const stdRefName = checkRowData.distributeStdValueList[i].stdRefName
        afterSheetHeader.push(stdRefName)
        for (let j = 0; j < checkRowData.distributeStdValueList[i].companyStdValueList.length; j++) {
          checkRowData.distributeStdValueList.map(item => {
            const idx = item.companyStdValueList[j].companyIdx
            const val = item.companyStdValueList[j].standardValue
            const createdTime = dayjs(checkRowData.createDate).format('YYYY.MM.DD')
            const userName = checkRowData.userName
            const companyList = checkRowData.distributeStdValueList[i].companyStdValueList[j].companyName
            afValues.push(val)
            afList.push(
              {
                createdTime: createdTime,
                editUser: userName,
                groupName: companyList,
                idx: idx
              }
            )
          })
        }
      }
      const afMap = new Map()
      companyInfo.forEach(item => afMap.set(item.idx, item))
      bfList.forEach(item => afMap.set(item.idx, { ...afMap.get(item.idx), ...item }))
      const afSheetData = Array.from(afMap.values())

      const resultAf = []
      for (let i = 0; i < afValues.length; i += checkRowData.distributeStdValueList.length) {
        resultAf.push(afValues.slice(i, i + checkRowData.distributeStdValueList.length))
      }
      for (let i = 0; i < afSheetData.length; i++) {
        for (let j = 0; j < resultAf[i].length; j++) {
          resultAf[i]['value' + j] = resultAf[i][j]
          delete resultAf[i][j]
        }
        afSheetData[i] = { ...afSheetData[i], ...resultAf[i] }
        delete afSheetData[i].idx
      }
      const afSheetItem = afSheetData

      const setAfSheet = {
        header: [],
        body: afSheetItem
      }
      setAfSheet.header.push(afterSheetHeader)
      const afterWorksheet = XLSX.utils.json_to_sheet(setAfSheet.body)
      XLSX.utils.sheet_add_aoa(afterWorksheet, setAfSheet.header)

      afterWorksheet['!cols'] = [
        { width: 15 },
        { width: 15 },
        { width: 25 }
      ]
      XLSX.utils.book_append_sheet(workbook, afterWorksheet, 'AFTER') // AFTER 시트 생성

      // 다운로드
      const fileName = `빌링_배부_모델_히스토리_${dayjs().format(
        'YYYYMMDDHHmmss'
      )}.xlsx`
      XLSX.writeFile(workbook, fileName)
      // console.log(dayjs().format('YYYYMMDDHHmmss'))
    },
    getFruitDataByJson () {
      const arr = []
      const checkRowData = this.histRowData

      const beforeSheetHeader = ['변경일자', '변경한 사람', '관계사']
      if (checkRowData.prevDistributeStdValueList?.length) {
        checkRowData.prevDistributeStdValueList.map(head => {
          beforeSheetHeader.push(head.stdRefName)
        })
      }
      return arr
    },
    async getHistory (model) {
      this.isGetHistory = true
      try {
        const { data } = await API.billing.getDistributeStdRefHistory({
          distributeModelId: model.id
        })
        const filterData = data
        this.histData = filterData.filter(item => item.prevDistributeStdValueList !== null)
        // console.log(this.histData, 'History Data')
      } catch (error) {
        console.log(error)
      } finally {
        this.isGetHistory = false
      }
    },
    async getDistModels () {
      this.loadingLoadModels = true
      try {
        const data = await API.billing.getDistModel()
        // test
        // data[0].apply = true
        data.forEach(this.mapActive)
        this.applyModel = data.find(model => model.apply)
        this.distModels = data.filter(
          model => model.id !== this.applyModel?.id
        )
        this.distModels.sort((a, b) => b.createTime - a.createTime)

        // if (!this.applyModel) {
        //   throw new NoApplyModelError()
        // }

        if (this.applyModel && this.applyModel.distributeProjects.length) {
          // this.onChangeActiveModel(
          //   this.applyModel.distributeProjects[0],
          //   0,
          //   true
          // )
          // this.activeModel = this.applyModel
          this.onClickRoot(this.applyModel)
        }
      } catch (error) {
        console.log(error)
        // if (error instanceof NoApplyModelError) {
        //   return this.$alert(
        //     '사용자 노출이 설정된 배부 모델이 존재하지 않습니다.'
        //   )
        // }
        this.$alert(this.$t('common.ALERT.BILL.053'))
      } finally {
        this.loadingLoadModels = false
      }
    }
  },
  data: () => ({
    editFormRenderKey: Date.now(),
    distModels: [],
    applyModel: null, // 배부모델
    loadingLoadModels: true,
    loadingLoadDetail: false,
    activeModel: null,
    activeProject: null,
    isOpenAllModel: true,
    filterOption: 2,
    detailModel: null,
    detailCommonProject: null,
    activeHistoryModal: false,
    sheetData: [],
    // 3차 추가 공통 배부
    isEditActiveProject: false,
    isActiveCreateModal: false,
    createDistModelName: '',
    sheetRenderKey: Date.now(),
    rawGroups: [],
    isGetHistory: false,
    historyModal: false,
    histRowData: [],
    histData: [],
    histColumns: [
      { header: '변경일자', binding: 'createDate', width: '*', dataType: 'Date', date: true, keyPath: 'common.GRID.changeDate', customHtml: true },
      { header: '변경한 사람', binding: 'userName', width: '*', keyPath: '', customHtml: true },
      { header: 'Excel 다운로드', binding: 'excel', width: '*', keyPath: 'common.BTN.excelDownload', customHtml: true }
    ]
  })
}
</script>

<style lang="scss" scoped>
.dist {
  display: flex;
  flex-wrap: nowrap;
  width: 100%;

  &.en {
    .dist-list-header {
      flex-wrap: wrap;

      h3 {
        margin-bottom: $gap-s;
      }
    }
  }

  &-list {
    flex: 0 0 385px;
    margin-right: 50px;
    min-height: 500px;

    &-header {
      display: flex;
      flex-wrap: nowrap;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 15px;
      margin-bottom: 15px;
      border-bottom: 1px solid $purple-gray;

      h3 {
        font-size: 16px;
      }

      .button {
        min-width: 150px;
      }
    }

    &-filter {
      display: flex;
      flex-wrap: nowrap;
      justify-content: space-between;
      margin-top: 40px;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid $purple-gray;

      h3 {
        font-size: 16px;
        display: inline-block;
      }

      &__head {
        display: flex;
        align-items: center;

        > span {
          margin-left: 5px;
          color: $input-placeholder;
          font-size: 12px;
        }
      }

      &__open {
        > * {
          cursor: pointer;
        }
      }
    }

    & .billing-filter {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: $gap;
      margin-top: $gap-s;

      & .is-billing-text {
        color: $light-gray;
        font-size: 12px;
      }

      & .filter-radio-group {
        &::v-deep > .el-radio {
          &:not(:last-child) {
            margin-right: $gap !important;
          }
        }
      }
    }

    .filtered-items {
      padding-right: 10px;
      max-height: 700px;
      overflow-y: auto;

      & > * + * {
        margin-top: 10px;
      }
    }
  }

  &-detail {
    width: 100%;
    position: relative;
    overflow: hidden;

    &-tab {
      margin-top: 40px;
    }

    &-select {
      display: flex;
      align-items: center;
      margin-bottom: $gap-m;

      &__name {
        margin-right: $gap-m;
        font-size: 14px;
      }

      .el-radio-group {
        display: inline-flex;
      }
    }
  }

  .create-dist {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;

    .label {
      min-width: 120px;
      margin-right: $gap;

      .required {
        position: relative;
        top: -2px;
        color: $primary;
      }
    }
  }
}
</style>
