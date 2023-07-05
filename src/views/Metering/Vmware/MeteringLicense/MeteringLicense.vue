<!--
  * 파일명 : MeteringLicense.vue
  * 파일 기능 : [S/W 라이선스] 관련 페이지입니다. 라이선스 추가 / 스케줄 관리가 가능합니다
  * 작성자 : 김진범 외 2명
  * 최종 작성일 : 2021-02-08
  * License By Shinsegae I&C
  * 2021-02-08 push~
 -->

<template>
  <div
    class="metering-license"
    v-loading="isMetering"
  >
    <section class="table-top-wrap">
      <total-count :total-count="totalResultCnt" />

      <div class="button-area -right">
        <!-- 수동 스케쥴 버튼 임시 삭제 처리 🔴 -->
        <!-- <button
          class="button"
          style="margin-left: 10px;"
          @click="scheduleHandle"
          v-loading="scheduleStatusBool"
          :disabled="scheduleStatusBool"
        >
          {{ $t('common.BTN.METER.manual') }}
        </button>
        <span class="divider" /> -->
        <button
          class="button"
          type="is-primary"
          @click="addRow"
          :disabled="isEditing"
        >
          {{ $t('common.BTN.METER.addLicense') }}
        </button>
        <button
          v-if="isEditItem()"
          class="button"
          @click="applySave"
          type="is-primary"
        >
          {{ $t('common.BTN.apply') }}
        </button>
        <button
          class="button"
          v-else
          :disabled="!selectedRow"
          @click="updateItem"
        >
          {{ $t('common.BTN.change') }}
        </button>
        <button
          v-if="isEditItem()"
          class="button"
          type="is-anti"
          @click="cancelSave"
        >
          {{ $t('common.BTN.cancel') }}
        </button>
        <button
          class="button"
          type="is-anti"
          :disabled="!selectedRow || isEditItem()"
          @click="removeItem(selectedRow)"
        >
          {{ $t('common.BTN.delete') }}
        </button>
      </div>
    </section>

    <section class="table-area">
      <cmp-grid
        :init-custom-action="init"
        :item-source="data"
        :columns="columns"
        :header-merge="headerMergeColumns"
        selectable
        @selectedRow="(param) => {
          selectedRow = param
        }"
        :init-auto-select-row="selectedRow ? selectedRow._data : null"
        init-auto-select-row-key="id"
        :use-excel-download="true"
        @total-count="cnt => totalResultCnt = cnt"
      >
        <template
          v-for="column in columns"
          :slot="column.binding"
          slot-scope="props"
        >
          <div :key="column.binding">
            <el-input
              v-model="props.row[column.binding]"
              v-if="props.row.edit"
              @click.native="(e) => {
                e.stopPropagation()
                e.preventDefault()
              }"
              @keypress.enter.native="applySave"
            />
            <span v-else>
              <!--{{ props.row[column.binding] | locale }}-->
              {{ props.row[column.binding] }}
            </span>
          </div>
        </template>

        <template #osType="props">
          <el-select
            class="information-input"
            v-model="props.row.osType"
            :placeholder="$t('service.PLACEHOLDER.selectOs')"
            :popper-append-to-body="true"
            v-if="props.row.edit"
          >
            <el-option
              v-for="option in osTypeOptions"
              :key="option.field"
              :label="option.label"
              :value="option.field"
            />
          </el-select>
          <span v-else>
            {{ props.row.osType }}
          </span>
        </template>
        <!-- 운영체제 유형 -->

        <template #categoryLabel="props">
          <el-select
            class="information-input"
            v-model="props.row.category"
            :placeholder="$t('common.MODAL.selectCate')"
            :popper-append-to-body="true"
            v-if="props.row.edit"
          >
            <el-option
              v-for="option in cateOptions"
              :key="option.field"
              :label="$t(option.keyPath) || (option.label)"
              :value="option.field"
            />
          </el-select>
          <span v-else>
            {{ props.row.categoryLabel }}
          </span>
        </template>
        <!-- 카테고리 -->

        <template #type="props">
          <el-select
            class="information-input"
            v-model="props.row.type"
            :placeholder="$t('meter.selectType')"
            :popper-append-to-body="true"
            v-if="props.row.edit"
          >
            <el-option
              v-for="option in licenseOptions"
              :key="option.field"
              :label="option.label"
              :value="option.field"
            />
          </el-select>
          <span v-else>
            {{ props.row.type }}
          </span>
        </template>
        <!-- 라이선스 유형 -->

        <template #purchCount="props">
          <el-input-number
            v-model="props.row.purchCount"
            style="width: 80px;"
            v-if="props.row.edit"
            @click.native="(e) => {
              e.stopPropagation()
              e.preventDefault()
            }"
            @keypress.enter.native="applySave"
            :min="0"
          />
          <span v-else>
            {{ props.row.purchCount | moneyFormat }}
          </span>
        </template>
        <!-- 구매 수량 -->

        <!-- <template #billingType="props">
          <el-select
            class="information-input"
            v-model="props.row.billingType"
            :placeholder="$t('bill.selectUnit')"
            :popper-append-to-body="true"
            v-if="props.row.edit"
          >
            <el-option
              v-for="option in unitOptions"
              :key="option.field"
              :label="option.label"
              :value="option.field"
            />
          </el-select>
          <span v-else>
            {{ props.row.billingType }}
          </span>
        </template> -->
        <!-- 과금 유형 -->

        <template #all="props">
          <a
            v-if="props.row.all && !props.row.edit"
            @click.stop="getVolume(props.row)"
            class="-link"
          >{{ props.row.all | moneyFormat }}</a>
        </template>
        <!-- 총 수량 -->

        <template #cloud="props">
          <a
            v-if="props.row.cloud && !props.row.edit"
            @click.stop="getVolume(props.row, 'cloud')"
            class="-link"
          >{{ props.row.cloud | moneyFormat }}</a>
        </template>
        <!-- 통합 클라우드 -->

        <template #company="props">
          <a
            v-if="props.row.company && !props.row.edit"
            @click.stop="getVolume(props.row, 'company')"
            class="-link"
          >{{ props.row.company | moneyFormat }}</a>
        </template>
        <!-- 각 관계사 -->

        <template #record="props">
          <button
            v-if="!props.row.edit"
            class="button"
            @click.stop="setRawData(props)"
          >
            {{ $t('common.BTN.METER.viewHistory') }}
          </button>
        </template>

        <template #usage="props">
          <a
            v-if="props.row.usage && !props.row.edit"
            @click.stop="getUsed(props.row)"
            class="-link"
          >{{ props.row.usage | moneyFormat }}</a>
        </template>
        <!-- 사용량 -->

        <template #remain="props">
          <span>
            {{ props.row.remain }}
          </span>
        </template>
        <!-- 잔여 -->
      </cmp-grid>
    </section>

    <!-- 기준 수량 상세 -->
    <el-dialog
      :title="detailName"
      :visible.sync="defaultVolDetailModal"
      class="new-item-modal"
      width="80%"
      @close="closeVolumeInfo"
    >
      <section
        class="modal-body"
        v-loading="isDefaultVol"
      >
        <cmp-grid
          :init-custom-action="initModalGrid"
          :item-source="defaultVolTableData"
          :columns="defaultVolcolumns"
          selectable
          @selectedRow="(param) => {selectedVol = param}"
        >
          <template
            v-for="column in columns"
            :slot="column.binding"
            slot-scope="props"
          >
            <div :key="column.binding">
              <span>{{ props.row[column.binding] }}</span>
            </div>
          </template>

          <template #totalCores="props">
            <span>{{ props.row.totalCores }}Core</span>
          </template>
          <!-- vCPU -->

          <template #totalMemSize="props">
            <span>{{ props.row.totalMemSize }}GB</span>
          </template>
          <!-- memory -->

          <template #assignDiskSize="props">
            <span>{{ props.row.assignDiskSize }}GB</span>
          </template>
          <!-- rootDisk -->

          <template #externalDisk="props">
            <span>{{ props.row.externalDisk }}TB (10EA)</span>
          </template>
          <template #createDate="props">
            <span>{{ props.row.createDate |date('YYYY-MM-DD') }}
            </span>
          </template>
          <!-- externalDisk -->

          <template #isAssets="props">
            <el-checkbox
              v-model="props.row.isAssets"
            />
            <!-- disabled -->
          </template>
          <!-- rootDisk -->
        </cmp-grid>
      </section>

      <div class="modal-footer modal-button-area">
        <button
          class="button -modal-button"
          type="is-anti"
          @click="closeModal"
        >
          {{ $t('common.BTN.cancel') }}
        </button>
        <button
          class="button -modal-button"
          @click="saveModal"
          type="is-primary"
        >
          {{ $t('common.BTN.change') }}
        </button>
      </div>
    <!-- </section> -->
    </el-dialog>

    <el-dialog
      :title="usedName"
      :visible.sync="defaultUsedDetailModal"
      class="new-item-modal"
      width="80%"
      @close="closeUsedInfo"
    >
      <section
        class="modal-body"
        v-loading="isDefaultUsedDetail"
      >
        <cmp-grid
          :init-custom-action="initUsedModalGrid"
          :item-source="defaultUsedTableData"
          :columns="defaultUsedcolumns"
        >
          <template
            v-for="column in columns"
            :slot="column.binding"
            slot-scope="props"
          >
            <div :key="column.binding">
              <span>{{ props.row[column.binding] }}</span>
            </div>
          </template>

          <template #totalCores="props">
            <span>{{ props.row.totalCores }}Core</span>
          </template>
          <!-- vCPU -->

          <template #totalMemSize="props">
            <span>{{ props.row.totalMemSize }}GB</span>
          </template>
          <!-- memory -->

          <template #assignDiskSize="props">
            <span>{{ props.row.assignDiskSize }}GB</span>
          </template>
          <!-- rootDisk -->

          <template #externalDisk="props">
            <span>{{ props.row.externalDisk }}TB (10EA)</span>
          </template>
          <!-- externalDisk -->
        </cmp-grid>
      </section>

      <!-- <section class="modal-footer"> -->
      <div class="modal-footer modal-button-area">
        <button
          class="button -modal-button"
          @click="closeUsedInfo"
          type="is-primary"
        >
          {{ $t('common.BTN.confirm') }}
        </button>
      </div>
      <!-- </section> -->
    </el-dialog>

    <!-- 이력보기 모달 -->
    <grid-modal
      :active.sync="record.view"
      :title="record.rowData.name + ` ${$t('meter.record')}`"
      :table-data="historyData"
      :column-data="record.columns"
      :header-merge="record.headerMergeColumns"
      :loading="isHistory"
      width="90%"
      @close="reloadTable"
    >
      <template #button>
        <button
          class="button"
          type="is-primary"
          @click="reloadTable"
        >
          {{ $t('common.BTN.confirm') }}
        </button>
      </template>
    </grid-modal>
  </div>
</template>
<script>
import API from '@sd-fe/cmp-core'
import GridModal from '@/components/Modal/GridModal/GridModal'
import { cloneDeep } from 'lodash'
import Dayjs from 'dayjs'
import { mapState } from 'vuex'

export default {
  name: 'MeteringLicense',
  components: {
    'grid-modal': GridModal
  },
  computed: {
    ...mapState({
      user: state => state.auth.user
    }),
    scheduleStatusBool () {
      return this.scheduleStatus === 'RUNNING'
    }
  },
  watch: {
    columns () {
      this.setNewItem()
    },
    tableData (newVal) {
      this.setTableData(newVal)
    }
  },
  async created () {
    await this.getScheduleStatus()
    await this.setUpMetering()
    this.startScheduleCheckInterval()
  },
  mounted () {
    this.setTableData(this.tableData)
  },
  beforeDestroy () {
    clearInterval(this.scheduleCheckInterval)
  },
  methods: {
    async getScheduleStatus () {
      this.scheduleStatus = await API.metering.getScheduleStatus()
    },
    /**
     * 수동 스케줄링 가능 상태 인터벌로 지속적으로 체크
     */
    startScheduleCheckInterval () {
      this.scheduleCheckInterval = setInterval(async () => {
        this.getScheduleStatus()
      }, 10000)
    },
    async setUpMetering () {
      await this.setOptions()
      await this.setOsTypeOptions()
      await this.getSwList()
    },
    /**
     * 미터링의 라이선스 유형 및 카테고리 정보를 불러옵니다.
     */
    async setOptions () {
      this.licenseOptions = await API.metering.getMeteringLicenseType()
      this.cateOptions = await API.metering.getMeteringCategory()
    },
    async getSwList () {
      try {
        this.isMetering = true
        this.rawApiData = await API.metering.getSwList()
        console.log('api로 가져온 s/w라이선스', this.rawApiData)
        if (this.rawApiData) {
          const tempTableData = []
          this.rawApiData.map(sw => {
            tempTableData.push({
              id: sw.swIdx,
              name: sw.name,
              category: sw.category,
              categoryLabel: this.getCateLabel(sw.category),
              version: sw.version,
              type: sw.licenseType,
              osType: sw.osType,
              purchCount: sw.buyAmount,
              processName: sw.processName,
              argument: sw.argument,
              billingType: sw.billingType,
              all: sw.allVolume,
              cloud: sw.cloudVolume,
              company: sw.companyVolume,
              usage: sw.usedAmount,
              usedCount: sw.usedCount,
              remain: sw.buyAmount - sw.companyVolume
            })
          })
          this.tableData = tempTableData
        }
      } catch (error) {
        this.tableData = []
        this.$alert(error, '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          type: 'error'
        })
      } finally {
        this.isMetering = false
      }
    },
    async setOsTypeOptions () {
      this.osTypeOptions = []
      // const response = await ConfigApi.getCodeList({ codeType: 'INSTALL_OS' })
      const response = await API.enum.getOsTypes()
      response.forEach(e => {
        this.osTypeOptions.push({
          field: e.codeVal,
          codeName: e.codeVal
        })
      })
    },
    init (grid) {
      this.grid = grid
    },
    initModalGrid (grid) {
      this.volGrid = grid
    },
    initUsedModalGrid (grid) {
      this.usedGrid = grid
    },
    gridRefresh (grid) {
      const cv = grid.collectionView
      cv.refresh()
    },
    setTableData (tableData) {
      this.data = cloneDeep(tableData)
      this.data = this.data.map(row => {
        return {
          ...row,
          crud: null,
          edit: false
        }
      })
    },
    closeModal () {
      this.defaultVolDetailModal = false
    },
    saveModal () {
      // 변경사항을 저장하시겠습니까?
      this.$confirm(this.$t('common.CONFIRM.BASE.006'), {
        confirmButtonText: this.$t('common.BTN.confirm'), // 확인
        cancelButtonText: this.$t('common.BTN.cancel') // 취소
      }).then(async () => {
        const paylaod = []
        let obj = null
        this.defaultVolTableData.forEach(e => {
          obj = cloneDeep(e)
          delete obj.createDate
          delete obj.updateDate
          paylaod.push(obj)
        })
        await API.metering.updateIsAssert(paylaod)
        await this.getSwList()
        this.$alert(this.$t('common.ALERT.BASE.022'))
        this.closeModal()
      }).catch(() => false)
    },
    /**
     * 테이블 칼럼 데이터에 따라서 newItem양식 세팅
     */
    setNewItem () {
      const bindingArr = this.columns.map(item => item.binding)
      const newItem = {}
      bindingArr.forEach(item => {
        newItem[item] = ''
      })
      newItem.vol = {
        all: '',
        cloud: '',
        company: ''
      }

      newItem.edit = true
      this.newItem = newItem
    },
    /**
     * 편집 중인 새 아이템이 있으면 유/무 반환
     */
    isCreateItem () {
      const isNewItem = this.data.filter(item => item.crud === 'create' && item.edit)
      return !!isNewItem.length
    },
    /**
     * 편집 중인 아이템이 있으면 유/무 반환
     */
    isEditItem () {
      const isEditItem = this.data.filter(item => item.edit === true)
      return !!isEditItem.length
    },
    scheduleHandle () {
      this.$confirm(this.$t('common.CONFIRM.CONF.005'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(async () => {
        try {
          this.isMetering = true
          await API.metering.scheduleHandle(this.$options.filters.date(new Date(), 'YYYY-MM-DD'))
          await this.getSwList()
          await this.getScheduleStatus()
        } catch (error) {
          switch (error.code) {
            case 'MTR2003':
              this.$alert(this.$t('common.ALERT.METER.004')) // 스케줄이 진행되고 있습니다.
              break
            default:
              this.$alert(this.$t('common.BASE.061')) // 문제가 발생했습니다. 관리자에게 문의해주세요.
          }
        } finally {
          this.isMetering = false
        }
      })
    },
    /**
     * [추가] 버튼을 눌렀을 때, 테이블 상단에 입력 가능한 row를 추가합니다.
     */
    addRow () {
      if (this.isCreateItem() || this.isEditing) return
      this.isEditing = true
      this.setNewItem()

      Object.defineProperty(this.newItem, 'crud', { value: 'create' })

      if (this.data?.length) this.data.unshift(this.newItem)
      else this.data.push(this.newItem)

      this.$forceUpdate()
    },
    /**
     * 로우 삭제
     * @param {Object} item 삭제 할 Row 오브젝트
     */
    removeItem (item) {
      if (!this.selectedRow) return
      if (item._data.all > 0) {
        this.$alert(this.$t('common.ALERT.METER.003'), '알림', {
          confirmButtonText: this.$t('common.BTN.confirm')
        })
        return
      }
      this.$confirm(this.$t('common.CONFIRM.BASE.020'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(async () => {
        try {
          await API.metering.deleteSw(item.dataItem.id)
          await this.setUpMetering()
          // const removeIdx = item._idx
          // this.grid.rows.remove(this.grid.rows[removeIdx])
          // this.data.splice(removeIdx, 1)
          this.$alert(this.$t('common.ALERT.BASE.013')) // 삭제되었습니다.
        } catch (error) {
          switch (error.code) {
            case 'MTR2001':
              return this.$alert(this.$t('common.ALERT.METER.003')) // 자원을 사용중입니다.
            case 'MTR2002':
              return this.$alert(this.$t('common.ALERT.METER.003')) // 자원을 사용중입니다.
            default:
              return this.$alert(this.$t('common.ALERT.BASE.016')) // 삭제에 실패했습니다.
          }
        }
      }).catch(() => false)
      this.setGridInit()
    },
    /**
     * [변경] 눌렀을 때, 편집상태로 전환
     */
    updateItem () {
      if (!this.selectedRow) return
      this.updateId = this.selectedRow._data.id
      this.isEditing = true

      this.toggleEditState(this.selectedRow._data, true)
      this.gridRefresh(this.grid)
    },
    cancelSave () {
      if (this.isCreateItem()) {
        this.data.splice(0, 1)
        this.toggleEditState(this.data, false)
      } else {
        this.getSwList()
      }
      this.updateId = null
      this.isEditing = false
    },
    checkRowData (row) {
      if (row.name === '' || row.version === '' || row.category === '' || row.type === '' || row.osType === '' || row.purchCount === '') {
        this.$alert(this.$t('common.ALERT.METER.001'), '알림', {
          confirmButtonText: this.$t('common.BTN.confirm')
        })
        return false
      }
      return true
    },
    /**
     * [완료] 눌렀을 때, 저장
     */
    async applySave () {
      const updateItem = this.data.filter(d => {
        return d.id === this.updateId
      })[0]
      const targetSw = (targetObj) => {
        return {
          swIdx: targetObj.id,
          name: targetObj.name,
          version: targetObj.version,
          category: targetObj.category,
          licenseType: targetObj.type,
          osType: targetObj.osType,
          billingType: targetObj.billingType,
          buyAmount: targetObj.purchCount,
          usedAmount: targetObj.usage,
          allVolume: targetObj.all,
          cloudVolume: targetObj.cloud,
          companyVolume: targetObj.company,
          processName: targetObj.processName,
          argument: targetObj.argument,
          userId: this.user.userId,
          userName: this.user.userName,
          userPosition: this.user.userPosition
        }
      }
      if (updateItem) {
        if (!this.checkRowData(updateItem)) return
        await API.metering.updateSw(targetSw(updateItem))
      } else {
        if (!this.checkRowData(this.newItem)) return
        await API.metering.insertSw(targetSw(this.newItem))
      }
      this.isEditing = false
      this.updateId = null
      this.toggleEditState(this.data, false)
      this.setGridInit()
      await this.getSwList()
    },
    setMoneyFormat (value) {
      return value ? value.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,') : value
    },
    getCateLabel (value) {
      return this.cateOptions[this.cateOptions.findIndex(c => c.field === value)].label
    },
    /**
     * 편집상태 토글
     * @param {Array, Object} item 편집 상태 토글 대상
     * @param {Boolean} state 편집 상태
     */
    toggleEditState (item, state) {
      if (Array.isArray(item)) {
        item = item.map(child => { child.edit = state })
      } else item.edit = state
    },
    /**
     * 그리드 초기 상태로 세팅
     */
    setGridInit () {
      this.grid.select(-1, -1)
      this.selectedRow = undefined
      this.gridRefresh(this.grid)
    },
    setRawData (props) {
      this.record.view = true
      this.record.rowData = props.row
      const swIdx = this.record.rowData.id
      console.log('rawData?', this.record.rowData)
      this.getSwHistApi(swIdx)
    },
    async getSwHistApi (swIdx) {
      try {
        this.isHistory = true
        const swHistList = await API.metering.getSwHistList(// { swIdx: swIdx }
        )
        this.swHistList = swHistList.filter((itm) => itm.swIdx === swIdx)
        if (!this.swHistList) return
        const tempTableData = []
        this.swHistList.map(sw => {
          tempTableData.push({
            id: sw.swIdx,
            name: sw.name,
            category: this.getCateLabel(sw.category),
            version: sw.version,
            type: sw.licenseType,
            osType: sw.osType,
            purchCount: this.setMoneyFormat(sw.buyAmount),
            processName: sw.processName,
            argument: sw.argument,
            billingType: sw.billingType,
            all: sw.allVolume,
            cloud: sw.cloudVolume,
            company: sw.companyVolume,
            usage: this.setMoneyFormat(sw.usedAmount),
            remain: sw.buyAmount - sw.companyVolume,
            userId: sw.userId,
            userName: sw.userName,
            userPosition: sw.userPosition,
            createDate: this.$options.filters.date(sw.createDate, 'YYYY-MM-DD')
          })
        })
        this.historyData = tempTableData
      } catch (error) {
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.projectTreeData = []
        this.$alert(message, '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          type: 'error'
        })
        throw error
      } finally {
        this.isHistory = false
      }
    },
    reloadTable () {
      this.record.view = false
    },
    getDate (date) {
      return Dayjs(new Date(date)).format('YYYY-MM-DD')
    },
    async getUsed (row) {
      this.usedName = this.$t('meter.zabbix')
      let usedSw = ''
      if (!(row.name === undefined || row.name === null)) {
        usedSw += '('
        usedSw += row.name
        if (!(row.version === undefined || row.version === null)) {
          usedSw += '/' + row.version
        }
        usedSw += ')'
      }
      this.usedName += usedSw
      this.defaultUsedDetailModal = true
      this.defaultUsedTableData = []
      try {
        this.isDefaultUsedDetail = true
        const rawData = await API.metering.getUsedSw(row.id)
        if (!rawData || !rawData.length) return
        rawData.map(m => {
          this.defaultUsedTableData.push({
            vmUuid: m.vmUuid,
            swIdx: m.swIdx,
            ownerCompanyName: m.ownerCompanyName,
            companyName: m.companyName,
            groupName: m.groupName,
            projectName: m.projectName,
            hostName: m.hostName,
            totalCores: m.totalCores,
            totalMemSize: m.totalMemSize / 1024 / 1024 / 1024,
            assignDiskSize: Math.round(m.assignDiskSize / 1024 / 1024 / 1024),
            userId: this.user.userId,
            userName: this.user.userName,
            userPosition: this.user.userPosition,
            createDate: this.getDate(m.createDate),
            updateDate: this.getDate(m.updateDate)
          })// end of push
        })
      } catch (error) {
        console.error(error)
        this.$alert(error)
      } finally {
        this.isDefaultUsedDetail = false
      }
    },
    /**
     * @param {'all' | 'cloud' | 'company'} type
     */
    async getVolume (row, type = 'all') {
      try {
        this.detailName = this.$t('meter.standardCountDetail')
        let detailSw = ''
        if (!(row.name === undefined || row.name === null)) {
          detailSw += '('
          detailSw += row.name
          if (!(row.version === undefined || row.version === null)) {
            detailSw += '/' + row.version
          }
          detailSw += ')'
        }
        this.detailName += detailSw
        this.defaultVolDetailModal = true
        this.defaultVolTableData = []
        this.isDefaultVol = true
        const rawData = await API.metering.getAllUseSw(row.id)
        const process = (m) => {
          // 데이터 가공
          return {
            ...m,
            totalMemSize: m.totalMemSize / 1024 / 1024 / 1024,
            assignDiskSize: Math.round(m.assignDiskSize / 1024 / 1024 / 1024),
            userId: this.user.userId,
            userName: this.user.userName,
            userPosition: this.user.userPosition,
            createDate: this.getDate(m.createDate),
            updateDate: this.getDate(m.updateDate)
          }
        }
        let targetData = rawData
        if (type === 'cloud') {
          // 통합 클라우드
          targetData = rawData.filter(m => !m.isAssets)
        } else if (type === 'company') {
          // 각 관계사
          targetData = rawData.filter(m => m.isAssets)
        }
        this.defaultVolTableData = targetData.map(process)
        console.log('사용중인 소프트웨어 목록 :', this.defaultVolTableData)
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.defaultVolTableData = []
        this.$alert(message, '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          type: 'error'
        })
        throw error
      } finally {
        this.isDefaultVol = false
      }
    },
    closeVolumeInfo () {
      this.defaultVolDetailModal = false
    },
    closeUsedInfo () {
      this.defaultUsedDetailModal = false
    }
  },
  data () {
    return {
      scheduleStatus: '',
      scheduleCheckInterval: null,
      isEditing: false, // 편집중인 상태를 저장합니다.
      totalResultCnt: 0,
      isMetering: false,
      isDefaultVol: false,
      isHistory: false,
      isDefaultUsedDetail: false,
      detailName: this.$t('meter.standardCountDetail'),
      usedName: this.$t('meter.zabbix'),
      data: [],
      historyData: [],
      startDate: '',
      swHistList: [],
      endDate: new Date(),
      selectedRow: undefined,
      defaultVolDetailModal: false,
      defaultUsedDetailModal: false,
      rawApiData: null,
      selectedVol: undefined, // 기준 수량 모달에서 선택한 로우
      updateId: null,

      newItem: null,

      // 과금 유형
      // unitOptions: [
      //   { field: 'vCore', label: 'vCore' },
      //   { field: 'Core', label: 'Core' },
      //   { field: 'OS', label: 'OS' },
      //   { field: 'GB', label: 'GB' },
      //   { field: 'GPU', label: 'GPU' },
      //   { field: 'Slice GPU', label: 'Slice GPU' }
      // ],

      // 카테고리 유형
      cateOptions: [
        // { field: 'image', label: '이미지', keyPath: 'common.REGCON.image' },
        // { field: 'market', label: '마켓 플레이스', keyPath: 'main.LAYOUT.marketPlace' },
        // { field: 'installation', label: '설치프로그램', keyPath: 'common.GRID.COMPUTE.install' },
        // { field: 'database', label: '데이터베이스', keyPath: 'common.GRID.DATABASE.title' }
      ],

      // 라이선스 유형
      licenseOptions: [
        // { field: 'Core', label: 'Core' },
        // { field: 'Socket', label: 'Socket' },
        // { field: 'Node', label: 'Node' },
        // { filed: 'app', label: 'app' },
        // { field: 'os', label: 'os' }
      ],

      // 운영체제 유형
      osTypeOptions: [],

      // 테이블 정보
      columns: [
        { header: 'S/W 이름', binding: 'name', width: '*', customHtml: true, align: 'left', keyPath: 'meter.swName' },
        { header: 'S/W 버전', binding: 'version', width: '*', customHtml: true, align: 'left', keyPath: 'meter.swVersion' },
        { header: '카테고리', binding: 'categoryLabel', width: 180, customHtml: true, align: 'left', keyPath: 'meter.category' },
        { header: '라이선스 유형', binding: 'type', width: 160, customHtml: true, align: 'left', keyPath: 'meter.licenseType' },
        { header: '운영체제 유형', binding: 'osType', width: 160, customHtml: true, align: 'left', keyPath: 'meter.osType' },
        // { header: '과금 유형', binding: 'billingType', width: '*', customHtml: true },
        { header: '구매 수량', binding: 'purchCount', width: 130, customHtml: true, keyPath: 'meter.countBuy' },
        { header: '구매 이력', binding: 'record', width: 130, customHtml: true, sorting: false, keyPath: 'meter.historyBuy' },
        { header: '프로세스명', binding: 'processName', width: '*', customHtml: true, keyPath: 'meter.processName' },
        { header: '아규먼트', binding: 'argument', width: '*', customHtml: true, keyPath: 'meter.arrgument' },
        { header: '총 수량', binding: 'all', width: '*', customHtml: true, keyPath: 'meter.totalCount' },
        { header: '통합 클라우드', binding: 'cloud', width: '*', customHtml: true, keyPath: 'meter.integCloud' },
        { header: '각 관계사', binding: 'company', width: '*', customHtml: true, keyPath: 'meter.eachAff' },
        { header: '사용량', binding: 'usage', width: 100, customHtml: true, keyPath: 'meter.usage' }
        // { header: '잔여', binding: 'remain', width: 80, customHtml: true },

      ],
      headerMergeColumns: {
        colSpan: [
          { startIdx: 9, endIdx: 11, header: '기준 수량', keyPath: 'meter.standardCount' }
        ],
        rowSpan: ['name', 'version', 'categoryLabel', 'type', 'osType', 'billingType', 'purchCount', 'processName', 'argument', 'usage', 'remain', 'record']
      },
      tableData: [],
      // 기준 수량 상세 테이블 데이터
      defaultVolcolumns: [
        { header: '소유 관계사', binding: 'ownerCompanyName', width: '*', align: 'left', keyPath: 'common.REGCON.ownerAff' },
        { header: '관계사', binding: 'companyName', width: '*', align: 'left', keyPath: 'common.TERMS.rel' },
        { header: '조직', binding: 'groupName', width: '*', align: 'left', keyPath: 'common.TERMS.group' },
        { header: '프로젝트', binding: 'projectName', width: '*', align: 'left', keyPath: 'common.TERMS.project' },
        { header: '호스트명', binding: 'hostName', width: '*', align: 'left', keyPath: 'common.GRID.hostName' },
        { header: 'vCPU', binding: 'totalCores', width: 100, customHtml: true },
        { header: 'Memory', binding: 'totalMemSize', width: 100, customHtml: true },
        { header: 'RootDisk', binding: 'assignDiskSize', width: 100, customHtml: true },
        // { header: 'ExternalDisk', binding: 'externalDisk', width: '*', customHtml: true },
        // { header: 'VM 아이디', binding: 'vmUuid', width: '*' },
        // { header: 'S/W 아이디', binding: 'swIdx', width: '*' },
        { header: 'S/W 생성일', binding: 'createDate', width: '*', dataType: 'Date', customHtml: true, keyPath: 'meter.createSwDate' },
        // { header: '소프트웨어 수정일자', binding: 'updateDate', width: '*' },
        // { header: '관계사', binding: 'relationComp', width: '*' },
        // { header: '조직', binding: 'org', width: '*' },
        // { header: '프로젝트', binding: 'project', width: '*' },
        // { header: '호스트명', binding: 'hostName', width: '*' },
        // { header: 'vCPU', binding: 'vcpu', width: '*', customHtml: true },
        // { header: 'Memory', binding: 'memory', width: '*', customHtml: true },
        // { header: 'RootDisk', binding: 'rootDisk', width: '*', customHtml: true },
        // { header: 'ExternalDisk', binding: 'externalDisk', width: '*', customHtml: true },
        { header: '자산 여부', binding: 'isAssets', width: 80, customHtml: true, keyPath: 'meter.isAsset' }
      ],
      // S/W 수량 및 목록
      defaultUsedcolumns: [
        { header: '소유 관계사', binding: 'ownerCompanyName', width: '*', align: 'left', keyPath: 'common.REGCON.ownerAff' },
        { header: '관계사', binding: 'companyName', width: '*', align: 'left', keyPath: 'common.TERMS.rel' },
        { header: '조직', binding: 'groupName', width: '*', keyPath: 'common.TERMS.group' },
        { header: '프로젝트', binding: 'projectName', width: '*', keyPath: 'common.TERMS.project' },
        { header: '호스트명', binding: 'hostName', width: '*', keyPath: 'common.GRID.hostName' },
        { header: 'vCPU', binding: 'totalCores', width: 100, customHtml: true },
        { header: 'Memory', binding: 'totalMemSize', width: 100, customHtml: true },
        { header: 'RootDisk', binding: 'assignDiskSize', width: 100, customHtml: true },
        { header: 'S/W 생성일', binding: 'createDate', width: '*', dataType: 'Date', customHtml: true, keyPath: 'meter.createSwDate' }
      ],
      defaultVolTableData: [],
      defaultUsedTableData: [],
      record: {
        view: false,
        rowData: {
          name: ''
        },
        columns: [
          { header: 'S/W 이름', binding: 'name', width: '*', align: 'left', keyPath: 'meter.swName' },
          { header: 'S/W 버전', binding: 'version', width: '*', align: 'left', keyPath: 'meter.swVersion' },
          { header: '카테고리', binding: 'category', width: '*', align: 'left', keyPath: 'meter.category' },
          { header: '라이선스 유형', binding: 'type', width: '*', align: 'left', keyPath: 'meter.licenseType' },
          { header: '운영체제 유형', binding: 'osType', width: '*', align: 'left', keyPath: 'meter.osType' },
          // { header: '과금 유형', binding: 'billingType', width: '*' },
          { header: '구매 수량', binding: 'purchCount', width: '*', customHtml: true, keyPath: 'meter.upCountBuy' },
          // { header: '총 수량', binding: 'all', width: '*', customHtml: true },
          // { header: '통합 클라우드', binding: 'cloud', width: '*', customHtml: true },
          // { header: '각 관계사', binding: 'company', width: '*', customHtml: true },
          { header: '사용량', binding: 'usage', width: '*', customHtml: true, keyPath: 'meter.usage' },
          { header: '사번', binding: 'userId', width: '*', keyPath: 'common.GRID.pressure' },
          { header: '이름', binding: 'userName', width: '*', keyPath: 'common.MODAL.name' },
          { header: '직책', binding: 'userPosition', width: '*', keyPath: 'meter.position' },
          { header: '변경일자', binding: 'createDate', width: '*', dataType: 'Date', keyPath: 'common.GRID.changeDate' }
        ],
        headerMergeColumns: {
          colSpan: [
            { startIdx: 7, endIdx: 9, header: '기준 수량', keyPath: 'meter.standardCount' }
          ],
          rowSpan: ['name', 'version', 'category', 'type', 'osType', 'billingType', 'purchCount', 'usage', 'userId', 'userName', 'userPosition', 'createDate']
        }

      } // 이력보기 모달
    }
  }
}
</script>
