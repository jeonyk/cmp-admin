<!--
  * 파일명 : ConfigJdbc.vue
  * 파일 기능 : 인사/조직 연동 정보 JDBC 연결 정보 리스트 노출 및 관리(동기화, 추가, 변경, 삭제)
  * 작성자 : 이경환 외 3명
  * 최종 작성일 : 2021-01-27
  * License By Shinsegae I&C
  * 2021-01-27 fix: 그리드 데이터 로딩 UI 개선
 -->
<template>
  <div
    class="org-jdbc"
  >
    <section class="table-top-wrap">
      <total-count :total-count="totalResultCnt" />
      <div class="button-area -right">
        <!-- <sync-component
          v-if="tableData.length > 0 && (tableData[0].syncStatus && tableData[0].syncStatus === 1)"
          :last-info="lastSync"
        /> -->
        <button
          :disabled="!tableData.length"
          class="button"
          type="is-primary"
          @click="handelClickToOpenSyncSet"
        >
          {{ $v('동기화 설정') }}
        </button>
        <span class="divider" />
        <div class="button-area">
          <button
            class="button"
            type="is-primary"
            :disabled="tableData.length>=1"
            @click="e => applyUpdateItem()"
          >
            {{ $t('common.BTN.ADMIN.addDb') }}
          </button>
          <button
            class="button"
            :disabled="!selectedRow"
            @click="e => applyUpdateItem(selectedRow)"
          >
            {{ $t('common.BTN.change') }}
          </button>
          <button
            class="button"
            type="is-anti"
            @click="applyRemove"
            :disabled="!selectedRow"
          >
            {{ $t('common.BTN.delete') }}
          </button>
        </div>
      </div>
    </section>

    <section class="table-area">
      <!-- v-loading="loading" -->
      <!-- :item-source="tempTableData" -->
      <cmp-grid
        :item-source="tableData"
        v-loading="!interval && loading"
        :element-loading-text="$t('common.PLACEHOLDER.loading')"
        :columns="columns"
        selectable
        @selectedRow="selectRow"
        :init-custom-action="init"
        :column-data-map="columnDataMap"
        @total-count="cnt => totalResultCnt = cnt"
      >
        <!-- :custom-init-filter="initFilter" -->
        <template
          v-for="column in columns"
          :slot="column.binding"
          slot-scope="props"
        >
          <div :key="column.binding">
            <span>{{ props.row[column.binding] }}</span>
          </div>
        </template>

        <template #hrUrl="props">
          <a class="-link">{{ props.row.hrUrl }}</a>
        </template>
        <!-- URL -->

        <template #isActive="props">
          <div class="cell-flex-wrap">
            <cmp-status-tag
              :contents="props.row.isActive ? $t('admin.ACCOUNT.active') : $t('admin.ACCOUNT.inactive')"
              :type="props.row.isActive ? 'is-complete' : 'is-fail'"
            />
          </div>
        </template>
        <!-- 연결 상태 -->

        <template #employee>
          <button
            class="button"
            type="is-black"
            @click="e => openTableMapModal(e, 'emp')"
          >
            {{ $t('common.BTN.modify') }}
          </button>
        </template>
        <!-- 사원 테이블 -->

        <template #company>
          <button
            class="button"
            type="is-black"
            @click="e => openTableMapModal(e, 'group')"
          >
            {{ $t('common.BTN.modify') }}
          </button>
        </template>
        <!-- 조직 테이블 -->

        <template #syncStatus="props">
          <div class="cell-flex-wrap">
            <cmp-status-tag
              type="is-complete"
              v-if="props.row.syncStatus === 2"
              :contents="$t('common.success')"
            />
            <cmp-status-tag
              v-else-if="props.row.syncStatus === 0"
              type="is-fail"
              :contents="$t('common.fail')"
            />
            <cmp-status-tag
              v-else-if="props.row.syncStatus === 1"
              type="is-loading"
            >
              <i
                class="el-icon-loading"
                style="margin-right: 5px;"
              />
              <span>{{ $t('common.syncing') }}</span>
            </cmp-status-tag>
            <button
              class="button button-sync"
              type="is-primary"
              @click.self.prevent="handleClickToSyncDB"
            >
              {{ $v('동기화') }}
            </button>
          </div>
        </template>
        <!-- 상태 -->
      </cmp-grid>
    </section>

    <!-- 모달 -->
    <!-- 항목 생성/수정 모달 -->
    <el-dialog
      :title="modalTitle"
      :visible.sync="newItemModal"
      class="new-item-modal"
      width="650px"
      @close="newItemModal = false"
    >
      <section
        class="modal-body"
        style="border-top: 1px solid #3D435E"
      >
        <register-contents
          :title="$t('admin.JDBC.selectDbType')"
          required
        >
          <el-select
            :placeholder="$t('admin.JDBC.plzSelectDbType')"
            v-model="updateItem.databaseType"
          >
            <el-option
              v-for="(type, idx) in databaseTypeList"
              :key="idx"
              :value="type.value"
              :label="type.label"
            />
          </el-select>
        </register-contents>
        <!-- DB 종류 선택 -->

        <register-contents
          :title="$t('common.MODAL.name')"
          required
        >
          <el-input
            :placeholder="$t('common.ALERT.ORG.009')"
            v-model="updateItem.hrName"
          />
        </register-contents>
        <!-- 이름 -->

        <register-contents
          title="URL"
          required
        >
          <el-input
            :placeholder="$t('admin.PREF.enterUrl')"
            v-model="updateItem.hrUrl"
          />
        </register-contents>
        <!-- URL -->

        <register-contents
          title="ID"
          required
        >
          <el-input
            :placeholder="$t('common.ALERT.ORG.012')"
            v-model="updateItem.hrId"
          />
        </register-contents>
        <!-- ID -->

        <register-contents
          :title="$t('admin.PREF.pw')"
          required
        >
          <el-input
            v-if="updateItem.crud === 'create' || otp"
            :placeholder="$t('admin.PREF.enterPw')"
            v-model="updateItem.hrPw"
            show-password
            ref="otpPasswordInput"
          />
          <button
            v-else
            @click="otpModalActive = !otpModalActive"
            type="is-primary"
            class="button -confirm"
            style="width: 100%;"
          >
            {{ $t('common.BTN.viewPw') }}
          </button>
        </register-contents>
        <!-- 패스워드 -->

        <register-contents
          :title="$t('admin.JDBC.empTableName')"
          required
        >
          <el-input
            :placeholder="$t('admin.JDBC.enterEmpTableName')"
            v-model="updateItem.emp.tableName"
          />
        </register-contents>
        <!-- 사용자 테이블 명 -->

        <register-contents
          :title="$t('admin.JDBC.groupTableName')"
          required
        >
          <el-input
            :placeholder="$t('admin.JDBC.enterGroupTableName')"
            v-model="updateItem.group.tableName"
          />
        </register-contents>

        <!-- DB 종류 선택 -->
        <!-- 조직 테이블 명 -->

        <!-- <register-contents
          title="상태"
          required
        >
          <div class="input-form">
            <el-radio-group v-model="updateItem.isActive">
              <el-radio
                :label="true"
              >
                활성
              </el-radio>
              <el-radio
                style="margin-left: 10px;"
                :label="false"
              >
                비활성
              </el-radio>
            </el-radio-group>
          </div>
        </register-contents> -->
        <!-- 상태 -->
      </section>

      <div class="modal-footer modal-button-area">
        <button
          class="button -modal-button"
          type="is-anti"
          @click="cancelSave"
        >
          {{ $t('common.BTN.cancel') }}
        </button>
        <!-- TODO  saveUpdateAction 리펙토링 작업 필요-->
        <button
          class="button -modal-button"
          @click="saveUpdateAction"
          type="is-primary"
        >
          {{ $t('common.BTN.confirm') }}
        </button>
      </div>
      <otp-modal
        api-call-component-name="OrgJdbc"
        required-api
        :callback-api="callbackApi"
        :active="otpModalActive"
        @close="otpModalActive = false"
        @validated-otp="validatedOTP"
      />
    </el-dialog>
    <!-- 테이블 정보 입력 모달 -->
    <el-dialog
      :title="tableMapModalTitle[modalMode]"
      :visible.sync="tableMapModal"
      class="table-map-modal"
      width="50vw"
      @close="closeTableMapModal"
    >
      <section
        class="modal-body"
        style="overflow: scroll;"
      >
        <div class="mapping-table-name">
          <p class="-required">
            {{ $t('admin.JDBC.tableName') + ':' }}
          </p>
          <el-input
            :placeholder="mappingTableName"
            v-model="mappingTableNameRe"
          />
        </div>
        <table
          class="mapping-table"
        >
          <tr class="head-row">
            <th class="col-info">
              {{ $t('admin.JDBC.colInfo') }}
            </th>
            <th class="col-name">
              {{ $t('admin.JDBC.colName') }}
            </th>
            <th class="col-type">
              {{ $t('admin.JDBC.colType') }}
            </th>
          </tr>
          <tr
            v-for="(data, idx) in mappingTableColData"
            :key="idx"
          >
            <td>
              <span :class="{'-required': data.required}">{{ data.colInfo }}</span>
            </td>
            <td>
              <el-input
                :placeholder="data.colName"
                v-model="mappingTableColName[modalMode][data.mappingName]"
              />
            </td>
            <td>
              <!-- {{ data.isUnique ? 'Unique Key, ' + data.colType : data.colType }} -->
              {{ data.colType }}
            </td>
          </tr>
        </table>
      </section>

      <div class="modal-footer modal-button-area">
        <button
          class="button -modal-button"
          type="is-anti"
          @click="closeMappingModal"
        >
          {{ $t('common.BTN.cancel') }}
        </button>
        <button
          class="button -modal-button"
          @click="saveTableMap"
          type="is-primary"
        >
          {{ $t('common.BTN.save') }}
        </button>
      </div>
    </el-dialog>
    <el-dialog
      :title="$v('동기화 설정')"
      :visible.sync="isOpenedSyncSet"
      class="table-map-modal"
      width="600px"
      @close="isOpenedSyncSet=false"
    >
      <section
        class="modal-body"
        style="border-top: 1px solid #3D435E"
      >
        <register-contents
          :title="$v('연동 시각 설정')"
          required
        >
          <el-select
            v-model="timeSyncObj.hours.dateList[0]"
            :placeholder="$i18n.locale === 'en' ? 'time' : '시'"
            :popper-append-to-body="false"
            class="service-time-select"
          >
            <el-option
              v-for="time in 24"
              :key="'time' + time"
              :label="(time - 1) < 10 ? '0' + (time-1) : time - 1"
              :value="time - 1"
            />
          </el-select>
          &ensp;{{ $i18n.locale === 'en' ? ' : ' : '시' }}
          <el-select
            v-model="timeSyncObj.minutes.dateList[0]"
            :placeholder="$i18n.locale === 'en' ? 'min' : '분'"
            :popper-append-to-body="false"
            class="service-time-select"
          >
            <el-option
              v-for="min in [0, 10, 20, 30, 40, 50]"
              :key="'min' + min"
              :label="min < 10 ? '0' + min : min"
              :value="min"
            />
          </el-select>
          <span v-if="$i18n.locale !== 'en'">&ensp;분</span>
        <!-- /. 서비스 개시일 -->
        </register-contents>
        <register-contents
          :title="$v('동기화 여부')"
          required
        >
          <el-radio-group
            :value="timeSyncObj.isActive"
            @input="timeSyncObj.isActive = !timeSyncObj.isActive"
            class="monitoring-radio-group"
          >
            <el-radio-button
              :label="true"
            >
              {{ $v('활성') }}
            </el-radio-button>
            <el-radio-button :label="false">
              {{ $v('비활성') }}
            </el-radio-button>
          </el-radio-group>
        </register-contents>
      </section>
      <div class="modal-footer modal-button-area">
        <button
          class="button -modal-button"
          type="is-anti"
          @click="isOpenedSyncSet = false"
        >
          {{ $t('common.BTN.cancel') }}
        </button>
        <button
          class="button -modal-button"
          @click="handelClickToSaveSync"
          type="is-primary"
        >
          {{ $t('common.BTN.save') }}
        </button>
      </div>
    </el-dialog>
  </div>
</template>
<script>
import OTPModal from '@/components/Modal/OTPModal/OTPModal'
import API from '@sd-fe/cmp-core'
import { cloneDeep } from 'lodash'
// import * as wjGrid from '@grapecity/wijmo.grid'
// import * as wjFilter from '@grapecity/wijmo.grid.filter'
import newAPI from '@/components/Apis/newApis/Config'

export default {
  name: 'ConfigJdbc',
  components: {
    'otp-modal': OTPModal
    // 'sync-component': SyncComponent
  },
  async created () {
    await this.getTableData()
    this.startInterval()
  },
  watch: {
    newItemModal (val) {
      if (!val) this.otp = false
      else this.setModalTitle()
    },
    tableMapModal (newVal) {
      if (this.modalMode === 'emp') {
        this.mappingTableColData = this.mappingTableColDataEmp
        this.mappingTableName = this.mappingTableNameEmp
        this.mappingTableNameRe = this.tableData[0].emp.tableName
      } else {
        this.mappingTableColData = this.mappingTableColDataOrg
        this.mappingTableName = this.mappingTableNameOrg
        this.mappingTableNameRe = this.tableData[0].group.tableName
      }
    }
  },
  destroyed () {
    clearInterval(this.interval)
  },
  // SECTION methods
  methods: {
    // 사원/조직 테이블 오픈 시 실행
    openTableMapModal (e, param) {
      console.log(e, param)
      e.preventDefault()
      e.stopPropagation()
      this.modalMode = param
      this.mappingTableColName[param] = this.tableData[0][param]
      this.tableMapModal = true
    },
    callbackApi: API.config.getCertHrJdbc,
    validatedOTP (data) {
      this.otp = true
      this.otpModalActive = false

      const tableData = data
      const findJDBC = tableData.find(item => item.hrIdx === this.updateItem.hrIdx)
      if (findJDBC) this.updateItem = findJDBC

      this.$nextTick(() => {
        // this.$refs.otpPasswordInput.passwordVisible = true
      })
    },
    init (grid) {
      this.grid = grid
    },
    initFilter (filter) {
      this.filter = filter
    },

    gridRefresh (grid = this.grid) {
      const cv = grid.collectionView
      cv.refresh()
    },

    async getTableData () {
      this.selectedRow = null
      this.loading = true
      const response = await API.config.getHrJdbc(0)
      if (!response) return
      this.tableData = response
      this.loading = false
    },
    /* ----------------------------- SECTION (CMP-DB)연동 스케줄링 설정---------------------------- */
    // EVENT_HANDLER - 오픈 > 동기화 설정 모달
    async handelClickToOpenSyncSet () {
      try {
        console.log('@handelClickToOpenSyncSet')
        const _test = await this.getScheduler()
        if (_test) {
          const { hours, minutes, isActive } = _test
          this.timeSyncObj = { ...this.timeSyncObj, hours, minutes, isActive }
        }
        this.isOpenedSyncSet = true
      } catch (error) {
        this.$alert(error.message)
      }
    },
    // EVENT_HANDLER - 저장 > 동기화 설정 모달
    async handelClickToSaveSync () {
      try {
        console.log('@handelClickToSaveSync')
        const action = await this.$confirm(this.$v('저장하시겠습니까?'),
          {
            confirmButtonText: this.$v('저장'),
            cancelButtonText: this.$v('취소')
          }).catch(() => false)

        if (action === 'confirm') {
          await this.setScheduler(this.timeSyncObj)
          this.isOpenedSyncSet = false
        }
      } catch (error) {
        this.$alert(error.message)
      }
    },

    /** API_HANDLER - POST _ 스케줄링 시간 설정
     * @return {object}time
    */
    async setScheduler (time) {
      try {
        console.log('@setScheduler')
        const payload = time
        await newAPI.config.setScheduler(payload)
      } catch (error) {
        throw new Error(this.$v('동기화 설정을 실패하였습니다.'))
      }
    },
    // API_HANDLER -  GET _ 스케줄링 시간 조회
    async getScheduler () {
      try {
        console.log('@getScheduler')
        const result = await newAPI.config.getSchedulerList()

        return result.data[0]
      } catch (error) {
        throw new Error(this.$v('동기화 설정 조회을 실패했습니다.'))
      }
    },

    // API_HANDLER - DELETE _ 스케줄링 삭제
    async deleteScheduler (idx) {
      try {
        console.log('@deleteScheduler')
        await newAPI.config.deleteScheduler(idx)
      } catch (error) {
        throw new Error(this.$v('동기화 설정 삭제을 실패했습니다.'))
      }
    },

    /* -------------------------------- !SECTION -------------------------------- */
    /**
     * 생성/수정 모달 타이틀 설정
     */
    setModalTitle () {
      if (this.updateItem.crud === 'update') {
        this.modalTitle = this.$t('admin.PREF.changeItem')
      } else {
        this.modalTitle = this.$t('common.TERMS.itemAdd')
      }
    },
    selectRow (rowData) {
      if (rowData && rowData._data) {
        this.selectedRow = rowData._data
        console.log('@@', this.selectedRow)
      } else {
        this.selectedRow = null
      }
    },
    /**
     * 템플릿 편집 -> 편집 전 데이터를 this.initData에 담아주고,
     * 업데이트 아이템을 세팅해줍니다. (생성/수정 구분을 위함)
     */
    applyUpdateItem (item) {
      this.updateItem = this.setUpdateItem(item)
      this.newItemModal = true
    },
    /**
     * 업데이트 아이템 세팅
     * @return {Object} [변경]을 누르면 체크된 친구가 updateItem, [항목 추가]를 누르면 새로운 데이터 세팅
     */
    setUpdateItem (data) {
      if (data) {
        this.updateItem = data
        this.updateItem.crud = 'update'
        return this.updateItem
      } else {
        const newTemp = {
          crud: 'create',
          databaseType: '',
          hrName: '',
          hrUrl: '',
          hrId: '',
          hrPw: '',
          isActive: undefined,
          emp: {
            tableName: ''
          },
          group: {
            tableName: ''
          }
        }
        return newTemp
      }
    },
    /**
     * [삭제] 버튼을 눌렀을 때, 선택한 row 삭제 여부를 리턴합니다.
     * @return {Boolean} 삭제 성공 여부
     */
    applyRemove () {
      this.$confirm(this.$t('common.CONFIRM.BASE.032'), '삭제', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
        this.removeItems(this.selectedRow)
      }).catch(() => false)
    },
    /**
     * 선택된 로우들을 삭제합니다.
     */
    async removeItems (removeObj) {
      try {
        await this.deleteScheduler(removeObj.hrIdx)
        const deleteResult = await API.config.deleteHr(removeObj.hrIdx)
        if (deleteResult) {
          this.tableData.splice(removeObj._idx, 1)
        }

        this.alertResult(deleteResult, this.$t('admin.PREF.delete')) // 삭제
        this.gridSetInit()
      } catch (error) {
        this.$alert(error.message)
      }
    },
    /**
     * 항목 생성/수정 모달에서 [확인]을 눌렀을 때 해당 로우 저장
     */
    saveUpdateAction () {
      if (this.updateItem.crud === 'update' && !this.otp) {
        // 인증을 먼저 진행해주세요.
        return this.$alert(this.$t('common.ALERT.ACCOUNT.019'))
      }
      if (!this.updateItem.databaseType || this.updateItem.databaseType === '') {
        // DB 종류를 선택해주세요.
        this.$alert(this.$t('admin.JDBC.plzSelectDbType'))
        return
      } else if (!this.updateItem.hrName || this.updateItem.hrName === '') {
        // this.$alert('이름을 입력해주세요.')
        this.$alert(this.$t('common.ALERT.ORG.009'))
        return
      } else if (!this.updateItem.hrUrl || this.updateItem.hrUrl === '') {
        // this.$alert('URL을 입력해주세요.')
        this.$alert(this.$t('common.ALERT.ORG.013'))
        return
      } else if (!this.updateItem.hrId || this.updateItem.hrId === '') {
        // this.$alert('ID를 입력해주세요.')
        this.$alert(this.$t('common.ALERT.ORG.012'))
        return
      } else if (!this.updateItem.hrPw || this.updateItem.hrPw === '') {
        this.$alert(this.$t('common.ALERT.ACCOUNT.023'))
        return
      } else if (!this.updateItem.emp.tableName || this.updateItem.emp.tableName === '') {
        // 사용자 테이블 명을 입력해주세요.
        this.$alert(this.$t('admin.JDBC.enterEmpTableName'))
        return
      } else if (!this.updateItem.group.tableName || this.updateItem.group.tableName === '') {
        // 조직 테이블 명을 입력해주세요.
        this.$alert(this.$t('admin.JDBC.enterGroupTableName'))
        return
      }

      this.$confirm(this.$t('common.CONFIRM.BASE.001'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
        this.saveUpdatedItem(this.updateItem)
      }).catch(() => {
        return false
      })
    },
    /**
     * 항목 생성/수정 모달에서 [취소] 버튼을 눌렀을 때 발생하는 이벤트
     */
    cancelSave () {
      // this.saveUpdatedItem(null)
      this.newItemModal = false
    },
    /**
     * 변경 모달 -> [확인]/[취소] -> 저장
     * @param {Object} updateItem emit으로 전달 받은 업데이트 된 템플릿 아이템, 없을 때 (저장 안하고 취소 눌렀을 때) 편집 전 상태로 돌려줍니다.
     */
    async saveUpdatedItem (updateRow) {
      if (updateRow.crud === 'create') {
        this.tableData.length ? this.tableData.unshift(updateRow) : this.tableData.push(updateRow)
        await API.config.insertHrJdbc(updateRow).then(insertResult => {
          this.alertResult(insertResult, this.$t('common.BTN.enroll')) // 등록
        }).catch(err => {
          this.alertMassage(err, 'enroll')
        })
      } else { // 아이템 변경일 때
        await API.config.updateHrJdbc(updateRow).then(updateResult => {
          this.alertResult(updateResult, this.$t('common.BTN.modify')) // 수정
        }).catch(err => {
          this.alertMassage(err, 'modify')
        })
      }
    },

    alertMassage (err, type) {
      console.log(err.data.message.split('Column Name: '))
      if (this.errCode.includes(err.data.code)) {
        this.$alert(this.$t('admin.JDBC.checkDbType'))
      } else {
        if (Object.keys(this.errMsg).includes(err.data.code)) {
          this.$alert(this.$t(this.errMsg[err.data.code], { column: `${err.data.message.split('Column Name: ')[1]}` }))
        } else {
          this.$alert(this.$t('common.ALERT.BASE.058', { type: this.$t(`common.BTN.${type}`) }))
        }
      }
    },

    gridSetInit () {
      // this.gridRefresh(this.grid)
      this.getTableData()
      this.selectedRow = null
    },
    /* --------------------------------- SECTION - 동기화 설정-------------------------------- */
    // EVENT_HANDLER - 동기화 > DB 수동 동기화 버튼
    async handleClickToSyncDB () {
      try {
        const theRow = this.tableData[0]

        const result = await this.$confirm(this.$t('admin.JDBC.sync'), {
          confirmButtonText: this.$t('common.BTN.confirm'),
          cancelButtonText: this.$t('common.BTN.cancel')
        }).catch(() => false)

        if (result) {
          await this.syncJDBC(theRow)
          await this.syncAllOfIAM()
          theRow.syncStatus = 1
        }
      } catch (error) {
        this.$alert(error.message)
      }
    },
    // API_HANDLER - PUT _ JDBC 동기화
    async syncJDBC (rowData) {
      try {
        const data = cloneDeep(rowData)
        this.$forceUpdate()
        delete data.hrPw
        await API.config.updateHrJdbc(data)
      } catch (error) {
        throw new Error(this.$v('JDBC 동기화를 실패하였습니다.'))
      }
    },
    // API_HANDLER - IAM 전체 동기화
    async syncAllOfIAM () {
      try {
        await API.iam.syncAll()
      } catch (error) {
        throw new Error(this.$v('IAM 전체 동기화를 실패하였습니다.'))
      }
    },
    /* -------------------------------- !SECTION -------------------------------- */
    async startInterval () {
      const self = this
      this.interval = setInterval(function () {
        self.getTableData()
      }, 10000)
    },

    alertResult (result, type) {
      if (result) {
        // {type} 성공
        this.$alert(this.$t('common.ALERT.BASE.059', { type }))

        // 성공 시에만 실행
        this.gridSetInit()
        this.newItemModal = false
      } else {
        // {type} 실패하였습니다.
        this.$alert(this.$t('common.ALERT.BASE.058', { type }))
      }
    },
    closeMappingModal () {
      this.mappingTableColName = {
        emp: {},
        group: {}
      }
      this.tableMapModal = false
    },
    saveTableMap () {
      if (!this.mappingTableNameRe?.trim()) { // 테이블 명 입력 여부 체크
        const emptyTableNameAlert = this.modalMode === 'emp' ? this.$t('admin.JDBC.enterEmpTableName') : this.$t('admin.JDBC.enterGroupTableName')
        return this.$alert(emptyTableNameAlert)
      }

      console.log(this.mappingTableColName[this.modalMode], this.modalMode)

      const modalData = this.mappingTableColName[this.modalMode]

      console.log(modalData)

      // 컬럼 모두 입력했는지 체크
      // const targetKeys = Object.keys(this.mappingTableColName[this.modalMode])
      const requiredColumns = (this.modalMode === 'emp')
        ? ['companyCode', 'companyName', 'empNo', 'empName', 'dutyCode', 'dutyName', 'orgCode']
        : ['companyCode', 'companyName', 'orgCode', 'orgName', 'seq', 'seq']

      let emptyCol = ''
      for (let k = 0; k < requiredColumns.length; k++) {
        if (!modalData[requiredColumns[k]]?.trim()) {
          modalData[requiredColumns[k]] = modalData[requiredColumns[k]]?.trim()
          emptyCol = requiredColumns[k]
          break
        }
      }

      // const testArr = keys.map(key => {
      //   return !!(targetKeys.includes(key) && this.mappingTableColName[this.modalMode][key])
      // })
      // if (testArr.includes(false)) {
      if (emptyCol) {
        const emptyColName = this.mappingTableColData.find(col => col.mappingName === emptyCol)
        this.$alert(this.$t('admin.JDBC.enterColName', { name: emptyColName.colInfo }))
      } else {
        this.$confirm(this.$t('common.CONFIRM.BASE.018'), {
          confirmButtonText: this.$t('common.BTN.confirm'),
          cancelButtonText: this.$t('common.BTN.cancel')
        }).then(async () => {
          Object.entries(this.mappingTableColName[this.modalMode]).forEach((el) => {
            this.mappingTableColName[this.modalMode][el[0]] = this.mappingTableColName[this.modalMode][el[0]].replaceAll(' ', '')
            if (el[1].length === 0) this.mappingTableColName[this.modalMode][el[0]] = null
          })
          Object.assign(this.tableData[0][this.modalMode], this.mappingTableColName[this.modalMode])

          console.log(this.tableData[0].group)
          this.tableData[0][this.modalMode].tableName = this.mappingTableNameRe
          const updatePayload = {
            emp: this.tableData[0].emp,
            group: this.tableData[0].group,
            databaseType: this.tableData[0].databaseType,
            hrId: this.tableData[0].hrId,
            hrIdx: this.tableData[0].hrIdx,
            hrUrl: this.tableData[0].hrUrl,
            isUpdatedEmp: this.modalMode === 'emp',
            isUpdatedGroup: this.modalMode === 'group'
          }
          await API.config.updateHrJdbc(updatePayload).then(updateResult => {
            this.alertResult(updateResult, this.$t('common.BTN.save')) // 저장
            if (updateResult) this.tableMapModal = false
          }).catch(err => {
            this.alertMassage(err, 'save')
          })
        }).catch(() => false)
      }
    },
    closeTableMapModal () {
      this.tableMapModal = false
    }
  },
  //! !SECTION
  // SECTION data()
  data () {
    return {
      isSyncDB: false,
      isOpenedSyncSet: false,
      timeSyncObj: {
        seconds: {
          dateList: [0],
          scheduleType: 'FIXED'
        },
        minutes: {
          dateList: [0],
          scheduleType: 'FIXED'
        },
        hours: {
          dateList: [0],
          scheduleType: 'FIXED'
        },
        days: {
          scheduleType: 'PASS'
        },
        month: {
          scheduleType: 'PASS'
        },
        week: {
          scheduleType: 'PASS'
        },
        year: {
          scheduleType: 'PASS'
        },
        isActive: false
      }, // 동기화 설정시간
      totalResultCnt: 0,
      otp: false,
      otpModalActive: false,
      selectedRow: null,
      modalTitle: '',
      newItemModal: false,
      tableData: [],
      initData: null,
      updateItem: {
        crud: '',
        databaseType: '', // DB 종류
        hrName: '',
        hrUrl: '',
        hrId: '',
        hrPw: '',
        isActive: undefined,
        emp: {
          tableName: '' // 사용자 테이블 명
        },
        group: {
          tableName: '' // 조직 테이블 명
        }
      },
      databaseTypeList: [ // DB 종류 리스트
        { label: 'Oracle', value: 'oracle' },
        { label: 'MS-SQL', value: 'mssql' },
        { label: 'MySQL', value: 'mysql' },
        { label: 'MariaDB', value: 'mariadb' },
        { label: 'PostgreSQL', value: 'postgresql' }
      ],
      lastSync: null,

      // 테이블 정보
      columns: [
        { header: '이름', binding: 'hrName', width: '*', keyPath: 'common.REGCON.name' },
        { header: 'URL', binding: 'hrUrl', width: '*', customHtml: true },
        { header: 'ID', binding: 'hrId', width: '*' },
        { header: 'Password', binding: 'hrPw', width: 150 },
        { header: '연결 상태', binding: 'isActive', width: 150, customHtml: true, keyPath: 'admin.PREF.connState' },
        { header: '사용자 테이블', binding: 'employee', width: 150, customHtml: true, keyPath: 'admin.JDBC.empTable' },
        { header: '조직 테이블', binding: 'company', width: 150, customHtml: true, keyPath: 'admin.JDBC.groupTable' },
        { header: '동기화 상태', binding: 'syncStatus', width: 300, customHtml: true, keyPath: 'common.GRID.NUTA.syncState' }
      ],
      tempTableData: [
        {
          id: 1,
          hrName: 'MEMBER1_jdbc',
          hrUrl: 'http://10.130.203.123:9999',
          hrId: 'user1',
          hrPw: '*****',
          isActive: true
        }
      ],
      // 상태 옵션
      userStateOptions: [
        { field: 'active', label: this.$t('admin.ACCOUNT.active') },
        { field: 'inactive', label: this.$t('admin.ACCOUNT.inactive') }
      ],
      interval: null,
      loading: false,
      columnDataMap: {
        syncStatus: [
          { value: 0, caption: this.$t('common.fail') },
          { value: 1, caption: this.$t('common.syncing') },
          { value: 2, caption: this.$t('common.success') }
        ],
        isActive: [
          { value: true, caption: this.$t('admin.ACCOUNT.active') },
          { value: false, caption: this.$t('admin.ACCOUNT.inactive') }
        ]
      },
      tableMapModal: false, // 테이블 정보 입력 모달 show 여부
      modalMode: '',
      tableMapModalTitle: {
        emp: this.$t('admin.JDBC.empTableInfo'),
        group: this.$t('admin.JDBC.groupTableInfo')
      },
      mappingTableName: '',
      mappingTableNameEmp: 'V_IF_S_PHM_IC0_SPHAROS_EMP',
      mappingTableNameOrg: 'V_IF_S_PHM_IC0_SPHAROS_ORG',
      mappingTableColData: [],
      mappingTableColDataEmp: [
        {
          colName: 'COMPANY_CD',
          colInfo: this.$t('admin.JDBC.companyCode'), // 관계사 코드 *
          colType: 'varchar(100)',
          mappingName: 'companyCode',
          required: true
        },
        {
          colName: 'COMPANY_NM',
          colInfo: this.$t('admin.JDBC.companyName'), // 관계사 명
          colType: 'varchar(100)',
          mappingName: 'companyName',
          required: true
        },
        {
          colName: 'EMP_NO',
          colInfo: this.$t('admin.JDBC.empNo'), // 사원 번호
          colType: 'varchar(100)',
          mappingName: 'empNo',
          required: true
        },
        {
          colName: 'EMP_NM',
          colInfo: this.$t('admin.JDBC.empName'), // 사원명
          colType: 'varchar(100)',
          mappingName: 'empName',
          required: true
        },
        {
          colName: 'DUTY_CD',
          colInfo: this.$t('admin.JDBC.dutyCode'), // 직책 코드
          colType: 'varchar(100)',
          mappingName: 'dutyCode',
          required: true
        },
        {
          colName: 'DUTY_NM',
          colInfo: this.$t('admin.JDBC.dutyName'), // 직책 명
          colType: 'varchar(100)',
          mappingName: 'dutyName',
          required: true
        },
        {
          colName: 'ORG_CD',
          colInfo: this.$t('admin.JDBC.orgCode'), // 조직 코드 *
          colType: 'varchar(100)',
          mappingName: 'orgCode',
          required: true
        },
        {
          colName: 'ORG_NM',
          colInfo: this.$t('admin.JDBC.orgName'), // 조직 명
          colType: 'varchar(100)',
          mappingName: 'orgName'
        },
        {
          colName: 'MOD_DATE',
          colInfo: this.$t('admin.JDBC.modDate'), // 수정 시각
          colType: 'DATETIME',
          mappingName: 'modDate'
        },
        {
          colName: 'EMP_EMAIL',
          colInfo: this.$t('admin.JDBC.empEmail'), // 사원 이메일
          colType: 'varchar(100)',
          mappingName: 'empEmail'
        },
        {
          colName: 'EMP_PHONE',
          colInfo: this.$t('admin.JDBC.empPhone'), // 사원 전화번호
          colType: 'varchar(100)',
          mappingName: 'empPhone'
        }
      ],
      mappingTableColDataOrg: [
        {
          colName: 'COMPANY_CD',
          colInfo: this.$t('admin.JDBC.companyCode'), // 관계사 코드 *
          colType: 'varchar(100)',
          mappingName: 'companyCode',
          required: true
        },
        {
          colName: 'COMPANY_NM',
          colInfo: this.$t('admin.JDBC.companyName'), // 관계사 명
          colType: 'varchar(100)',
          mappingName: 'companyName',
          required: true
        },
        {
          colName: 'ORG_CD',
          colInfo: this.$t('admin.JDBC.orgCode'), // 조직 코드
          colType: 'varchar(100)',
          mappingName: 'orgCode',
          required: true
        },
        {
          colName: 'ORG_NM',
          colInfo: this.$t('admin.JDBC.orgName'), // 조직 명
          colType: 'varchar(100)',
          mappingName: 'orgName',
          required: true
        },
        {
          colName: 'SUPER_ORG_CD',
          colInfo: this.$t('admin.JDBC.superOrgCode'), // 싱위 조직 명
          colType: 'varchar(100)',
          mappingName: 'superOrgCode',
          required: true
        },
        {
          colName: 'SEQ',
          colInfo: this.$t('admin.JDBC.seq'), // 조직 우선순위 *
          colType: 'INT(11)',
          mappingName: 'seq',
          required: true
        },
        {
          colName: 'MOD_DATE',
          colInfo: this.$t('admin.JDBC.modDate'), // 수정 시각
          colType: 'DATETIME',
          mappingName: 'modDate'
        },
        {
          colName: 'SHORT_NM',
          colInfo: this.$t('admin.JDBC.shortName'), // 조직 명 (단축)
          colType: 'varchar(100)',
          mappingName: 'shortName'
        }
      ],
      mappingTableNameRe: '',
      mappingTableColName: {
        emp: {},
        group: {}
      },
      errMsg: {
        CFG014: 'admin.JDBC.CFG014',
        CFG015: 'admin.JDBC.CFG015',
        CFG019: 'admin.JDBC.CFG019',
        CFG017: 'admin.JDBC.CFG017',
        CFG020: 'admin.JDBC.CFG020'
      },
      errCode: [
        'CFG2002',
        'CFG2003',
        'CFG2004',
        'CFG2005',
        'CFG2006'
      ]
    }
  }
  // !SECTION
}
</script>
<style lang="scss" scoped>
.org-jdbc {
  .service-time-select {
      width: 100px;
      border: 1px solid;
      margin-right: 10px;
      border: 1px solid $dark-gray;

    &:nth-of-type(2) {
      margin-left: 10px;
    }
  }

  .button-sync {
    margin-left: 20px;
  }
}
</style>
<style lang="scss">
  .org-jdbc {
   .input-form {
      display: flex;
      align-items: center;
      position: relative;
      & + .input-form {
        margin-top: 5px;
      }
    }
    .table-map-modal {
      .el-dialog__header {
        margin: 0;
        padding-bottom: 30px;
        border-bottom: 1px solid #3D435E;
      }
      .modal-body {
        max-height: 70vh;
        .mapping-table-name {
          display: flex;
          align-items: center;
          padding: 20px 0;
          p {
            font-size: 1.5em;
            margin-right: 20px;
          }
          .el-input {
            width: 50%;
          }
        }
        .mapping-table {
          width: 100%;
          // border-bottom: 1px solid #3D435E;
          .head-row {
            th {
              padding: 15px 0;
              background: #2A2D44;
            }
          }
          td {
            text-align: center;
            padding: 10px;
          }
          .col-info {
            width: 30%;
            border-right: 1px solid #1F1E32;
          }
          .col-name {
            width: 40%;
            border-right: 1px solid #1F1E32;
          }
          .col-type {
            width: 30%;
          }
        }
        .-required {
          position: relative;
          &::before {
            position: absolute;
            top: 0px;
            left: calc(100% + 5px);
            content: '*';
            font-size: 15px;
            color: $main-red;
            height: 100%;
          }
        }
      }
      .modal-button-area {
        border-top: 1px solid #3D435E;
        margin: 0 !important;
        padding-top: 20px;
      }
    }
  }
</style>
