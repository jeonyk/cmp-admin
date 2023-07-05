<!--
  * 파일명 : NutanixEra.vue
  * 파일 기능 : 뉴타닉스 Era 리스트 노출 및 관리(테스트, 추가, 변경, 삭제)
  * 작성자 : 정재은 외 2명
  * 최종 작성일 : 2021-02-22
  * License By Shinsegae I&C
  * 2021-02-22 Update: sorting 기능 유지 > Nutanix Central / Element / Era 모두 적용 및 destroy 시 interval 제거
 -->

<template>
  <div class="nutanix-era">
    <section class="table-top-wrap">
      <total-count :total-count="totalResultCnt" />

      <div class="button-area -right">
        <button
          class="button"
          :disabled="!selectedRow || selectedRow.isSync === -1"
          type="is-anti"
          @click="activeSync"
        >
          <!-- 동기화 -->
          {{ $t('common.BTN.ADMIN.sync') }}
        </button>
        <span class="divider" />
        <button
          class="button"
          type="is-primary"
          @click="addModalOpen"
        >
          <!-- 항목 추가 -->
          {{ $t('common.TERMS.itemAdd') }}
        </button>
        <button
          class="button"
          :disabled="!selectedRow"
          @click="updateModalOpen(selectedRow)"
        >
          <!-- 변경 -->
          {{ $t('common.BTN.change') }}
        </button>
        <button
          class="button"
          @click="applyRemove"
          :disabled="!selectedRow"
          type="is-anti"
        >
          <!-- 삭제 -->
          {{ $t('common.BTN.delete') }}
        </button>
      </div>
    </section>

    <section class="table-area">
      <cmp-grid
        v-loading="gridLoading"
        :item-source="tableData"
        :columns="columns"
        is-read-only
        selectable
        :init-custom-action="init"
        :init-auto-select-row="selectedRow"
        init-auto-select-row-key="eraIdx"
        :sort-keeping="sortedCol"
        page-keeping
        :column-data-map="columnDataMap"
        @total-count="cnt => totalResultCnt = cnt"
      >
        <template #auth="props">
          <span v-if="props.row.username && props.row.password">기입 완료</span>
          <span v-else><button
            class="button"
            @click.stop="updateModalOpen(props.row)"
          >인증 정보 설정</button></span>
        </template>
        <!-- /. 인증 정보 -->

        <template #intervalMin="props">
          <span v-if="props.row.intervalSec">{{ props.row.intervalMin }} {{ $t('common.TERMS.minute') }}</span>
          <span v-else />
        </template>
        <!-- /.인터벌 주기(분) -->

        <template #state="props">
          <div style="text-align: center;">
            <span :class="['state-icon', props.row.state]" />
          </div>
        </template>
        <!-- 운영 여부 -->

        <template #isSync="props">
          <!-- -1 동기화중, 1 성공, 0 실패 -->
          <div
            v-if="props.row.isSync !== undefined"
            class="cell-flex-wrap"
          >
            <cmp-status-tag
              v-if="props.row.isSync === -1"
              type="is-loading"
            >
              <i class="el-icon-loading" />
              <span style="padding: 0 10px;">{{ $t('common.syncing') }}</span>
            </cmp-status-tag>

            <cmp-status-tag
              v-else
              :type="syncStatus(props.row.isSync).type"
              :contents="syncStatus(props.row.isSync).contents"
            />
          </div>
        </template>
        <!-- 동기화 상태 -->
      </cmp-grid>
    </section>

    <section class="meta-profile-area">
      <profile-list />
    </section>
    <!-- /. 사용자 화면 프로파일 -->

    <!-- 모달 -->
    <!-- 항목 생성 모달 -->
    <el-dialog
      :title="showModal.type === 'create' ? $t('common.TERMS.itemAdd') : $t('common.TERMS.itemChange')"
      :visible.sync="showModal.view"
      class="new-item-modal"
      width="840px"
      @close="showModal.view = false"
      top="15vh"
    >
      <section>
        <article class="modal-body">
          <div class="edit-list">
            <register-contents
              :title="$t('admin.PREF.authInfo')"
              required
            >
              <div class="input-form">
                <span style="min-width: 100px;">{{ $t('admin.PREF.userName') }}: </span>
                <el-input
                  :disabled="testPassed"
                  :placeholder="$t('admin.PREF.userName')"
                  v-model.trim="auth.userName"
                />
              </div>
              <div class="input-form">
                <span style="min-width: 100px;">{{ $t('admin.PREF.userPw') }}: </span>
                <el-input
                  :disabled="testPassed"
                  v-if="showModal.type === 'create' || otp"
                  :placeholder="$t('admin.PREF.userPw')"
                  v-model.trim="auth.userPw"
                  show-password
                  ref="otpPasswordInput"
                />
                <button
                  v-else
                  @click="otpModalActive = !otpModalActive"
                  class="button -confirm"
                  type="is-primary"
                >
                  <!-- 비밀번호 보기 -->
                  {{ $t('common.BTN.viewPw') }}
                </button>
              </div>
            </register-contents>
            <!-- 인증 정보 -->

            <register-contents
              title="URL"
              required
            >
              <el-input
                :placeholder="$t('admin.PREF.enterUrl')"
                v-model.trim="newItem.eraUrl"
                :disabled="testPassed"
              />
            </register-contents>
            <!-- URL -->

            <span
              v-if="testPassed || isConnecting"
              :class="['block-before-test', { 'is-connecting':isConnecting }]"
            >
              {{ !isConnecting ? $v('연결 테스트에 성공하였습니다.') : '' }}
            </span>
            <!-- /. 테스트 완료 문구 -->
          </div>

          <button
            :class="['test-btn', 'button', { 'confirm' : testPassed }]"
            @click="activeTest(showModal.type)"
            :type="testPassed ? 'is-success' : 'is-primary'"

            :disabled="(testPassed || isConnecting || !auth.userName || !auth.userPw || !newItem.eraUrl)? true : false"
          >
            <i class="icon">
              <i
                v-if="isConnecting"
                class="el-icon-loading"
              />
              <check-icon
                v-if="testPassed"
                class="check-icon"
              />
            </i>
            <!-- 테스트 (테스트 전 / 실패시) -->
            {{ testPassed?'Connected':'Test Connection' }}
          </button>
          <!-- 테스트 -->

          <!-- ------ -->
          <!-- ------ -->
          <!-- ------ -->

          <div
            class="edit-list"
            v-if="testPassed || showModal.type !== 'create'"
          >
            <register-contents
              :title="$t('common.GRID.NUTA.eraName')"
              required
            >
              <el-input
                :placeholder="$t('common.GRID.NUTA.eraName')"
                v-model="newItem.eraName"
                :disabled="!testPassed"
              />
            </register-contents>
            <!-- /. Era 명 -->

            <register-contents
              :title="$v('인터벌 주기(분)')"
              required
            >
              <div class="input-form">
                <el-input-number
                  v-model="newItem.intervalMin"
                  :min="0"
                  :disabled="!testPassed"
                />
              </div>
            </register-contents>
            <!-- /. 인터벌 주기(분) -->

            <register-contents
              :title="$t('admin.PREF.isOper')"
              required
            >
              <div class="input-form">
                <el-radio-group
                  v-model="newItem.isManage"
                  :disabled="!testPassed"
                >
                  <el-radio
                    :label="true"
                  >
                    {{ $t('admin.PREF.oper') }}
                  </el-radio>
                  <el-radio
                    style="margin-left: 10px;"
                    :label="false"
                  >
                    {{ $t('admin.PREF.noOper') }}
                  </el-radio>
                </el-radio-group>
              </div>
            </register-contents>
            <!-- /. 운영 여부 -->

            <span
              v-if="!testPassed"
              class="block-before-test"
            >
              <!-- 테스트를 먼저 진행해주세요. -->
              {{ !isConnecting ? $t('admin.PREF.proceedTest') : '' }}
            </span>
          </div>
        </article>

        <div class="modal-footer modal-button-area">
          <button
            class="button -modal-button"
            type="is-anti"
            @click="closeModal"
          >
            <!-- 취소 -->
            {{ $t('common.BTN.cancel') }}
          </button>
          <button
            class="button -modal-button"
            :disabled="!testPassed || isConnecting"
            @click="confirmUpdateItem(newItem)"
            type="is-primary"
          >
            <!-- 운영안함 -->
            {{ $t('common.BTN.confirm') }}
          </button>
        </div>
      </section>

      <otp-modal
        api-call-component-name="NutanixEra"
        required-api
        :ntx-idx="newItem.eraIdx"
        :callback-api="callbackApi"
        :active="otpModalActive"
        @close="otpModalActive = false"
        @validated-otp="validatedOTP"
      />
    </el-dialog>
  </div>
</template>
<script>
import { cloneDeep } from 'lodash'
import ProfileList from '../../ManageProfile/ProfileList'
import CheckIcon from '@/components/Icons/CheckIcon.vue'
import OTPModal from '@/components/Modal/OTPModal/OTPModal'
import API from '@sd-fe/cmp-core'
import Dayjs from 'dayjs'

export default {
  name: 'NutanixEra',
  components: {
    'profile-list': ProfileList,
    'otp-modal': OTPModal,
    CheckIcon
  },
  async created () {
    this.elements = await this.getElements()
    await this.getEraConfigs()
    this.startInterval()
  },
  watch: {
    'showModal.view' (val) {
      if (!val) this.otp = false
    }
  },
  methods: {
    callbackApi: API.database.getEraConfig,
    /**
     * OTP 인증
     */
    validatedOTP (data) {
      if (data?.isOtpAuth) this.$set(this.auth, 'userPw', data?.password)
      else this.$alert(this.$t('common.ALERT.PROJECT.022'))

      this.otpModalActive = false
      this.otp = true

      this.$nextTick(() => {
        this.$refs.otpPasswordInput.passwordVisible = false
      })
    },
    /**
     * 동기화를 매 10 초마다 한번씩 진행합니다.
     */
    async startInterval  () {
      this.interval = setInterval(() => {
        this.getEraConfigs()
      }, 10000)
    },
    /**
     * Era 전체 리스트를 가져옵니다.
     */
    async getEraConfigs () {
      try {
        this.gridLoading = true
        const rawEra = await API.database.getEraConfigs()
        this.tableData = this.settingEra(rawEra)
      } catch (error) {
        this.errorHandler(error)
        this.tableData = []
        clearInterval(this.interval)
      } finally {
        this.gridLoading = false
      }
    },
    /**
     * Era 리스트를 가공합니다.
     * @param {Array} rawEra API로 가져온 Era 목록 데이터입니다.
     * @return {Array} tableData를 위한 데이터를 가공합니다.
     */
    settingEra (rawEra) {
      if (!rawEra) return

      const eraLists = rawEra.map(era => {
        const result = { ...era }
        result.auth = { userName: era.username }

        let state = ''
        if (era.isManage && era.isConnect) state = 'success'
        else if (era.isManage && !era.isConnect) state = 'error'
        else if (!era.isManage && !era.isDelete) state = ''

        // 상태
        result.state = state

        if (this.elements.length > 0) {
          const filteredElements = this.elements.filter(item => item.connectUrl.includes(era.externalIp))
          result.elementName = filteredElements[0]?.clusterName
        }
        result.intervalMin = era.intervalSec ? era.intervalSec / 60 : ''

        // 동기화 상태 :: 1 성공, 0 실패, -1 동기화중
        // 마지막 동기화 상태
        let syncStatus = 1
        let biggestUpdateTime = null

        if (era.syncInfos) {
          era.syncInfos.forEach(job => {
            const sync = job.syncStatus
            if (sync === 'ING') syncStatus = -1
            if (!sync || sync === 'FAIL') syncStatus = 0
            // console.log(sync, syncStatus)

            if (biggestUpdateTime === null || biggestUpdateTime < job.syncEndTime) {
              biggestUpdateTime = job.syncEndTime
            }
          })
        }

        result.connectSuccessTime = Dayjs(biggestUpdateTime).format('YYYY.MM.DD HH:mm:ss')
        result.isSync = syncStatus

        result.lastSyncTime = biggestUpdateTime
        // console.log(biggestUpdateTime, '====?')
        return result
      })

      // this.columnDataMap.lastSyncTime = Array.from(new Set(mappedTime))
      // console.log(this.columnDataMap.lastSyncTime)
      return eraLists
    },
    /**
     * Cluster (Element) 전체 리스트를 가져옵니다.
     */
    async getElements () {
      try {
        this.gridLoading = true
        const response = await API.compute.getClusters()
        return response
      } catch (error) {
        this.errorHandler(error)
      } finally {
        this.gridLoading = false
      }
    },

    // ===================================
    // ========= 모달 내부 [테스트] ==========
    // ===================================

    /**
     * [테스트] 버튼을 클릭했을때 [항목추가] 인지 [변경] 인지 확인 후 해당 함수를 실행합니다.
     * @param {string} type 현재 [항목추가] 인지 [변경] 인지 확인
     * @returns {(Function|Boolean)}
     */
    activeTest (type = this.showModal.type) {
      if (type) return this.activeTestCreate(this.newItem)
      else return false
    },
    /**
     * [항목 추가/변경 > 테스트] 버튼이 connection 이 연결될 경우 활성화 시킵니다.
     * 연결여부를 알려주고 하단 작업이 가능하도록 설정합니다.
     * @param {Object} item
     */
    async activeTestCreate (item = this.newItem) {
      try {
        this.isConnecting = true

        const payload = {
          eraUrl: item.eraUrl,
          username: this.auth.userName,
          password: this.auth.userPw
        }

        const testPassed = await API.database.connectionTest(payload)
        this.testPassed = testPassed.connectionResult
        // 연결 테스트에 (this.testPassed ? '성공' : '실패') 하였습니다.
        const message = this.testPassed ? this.$t('common.ALERT.NUTA.005') : this.$t('common.ALERT.NUTA.006')
        item.connectionTestResult = testPassed

        this.$alert(message, '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
      } catch (error) {
        this.errorHandler(error)
      } finally {
        this.isConnecting = false
      }
    },

    // ===================================
    // ========== 모달 내용 저장 ============
    // ===================================

    /**
     * [항목 추가 / 변경] > [확인] 클릭시 발생하는 이벤트를 다룹니다.
     * 같은 모달을 사용하므로, 함수 두개로 분리시킵니다
     */
    async confirmUpdateItem (newItem = this.newItem) {
      const valueCheck = [
        { displayName: 'Era 명', key: 'eraName', message: this.$v('Era 명을 입력해주세요.') },
        { displayName: '인터벌 주기(분)', key: 'intervalMin', message: this.$v('인터벌 주기(분)를 입력해주세요.') },
        { displayName: '운영 여부', key: 'isManage', message: this.$v('운영 여부를 입력해주세요.') }
      ]

      const fullfilled = valueCheck.every(cond => {
        const condition = newItem[cond.key]
        // isManage 는 값이 false일 수 있습니다.

        if (condition === undefined || condition === '') this.$alert(cond.message)
        return typeof condition === 'boolean' ? true : condition
      })

      if (!fullfilled) return false

      const confirm = (this.showModal.type === 'create') ? '021' : '015' // 해당 항목을 생성하시겠습니까? : 업데이트 하시겠습니까?
      this.updateItemAction(this.$t(`common.CONFIRM.BASE.${confirm}`))
    },

    /**
     * [항목 추가/변경 > 확인] 시 central 이 추가/변경 되도록 하는 함수입니다.
     * @param {String} message
     */
    updateItemAction (message) {
      const item = this.newItem

      this.$confirm(message, '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(async () => {
        const req = {
          eraName: item.eraName,
          username: this.auth.userName,
          password: this.auth.userPw,
          eraUrl: item.eraUrl,
          isManage: item.isManage,
          intervalSec: item.intervalMin * 60,
          connectionTestResult: item.connectionTestResult
        }

        if (this.showModal.type === 'update') { // [변경] 일때
          const payload = { eraIdx: item.eraIdx, req }
          await this.updateEraConfig(payload) // update
        } else { // [항목 추가] 일 때
          await this.createEraConfig(req)
        }

        await this.getEraConfigs()
        return this.closeModal()
      }).catch(() => {
        return false
      })
    },

    /**
     * [항목 추가 > 확인] Era 추가 API 를 실행합니다
     * @param {Object} payload
     */
    async createEraConfig (payload) {
      try {
        this.isConnecting = true
        const created = await API.database.createEraConfig(payload)
        if (created) this.$alert(this.$t('common.ALERT.BASE.026'), '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
      } catch (error) {
        this.errorHandler(error)
        this.showModal.view = true
        // const { code, message } = error.response.data
        // let msg = this.$t('common.ALERT.NUTA.022')
        // if (code) msg = message
        // this.$alert(msg)
      } finally {
        this.isConnecting = false
      }
    },
    /**
     * [변경 > 확인] Era 가 변경될 때 API를 실행합니다.
     * @param {Object} payload API 에 함께 전달할 데이터
     */
    async updateEraConfig (payload) {
      try {
        this.isConnect = true
        const updated = await API.database.updateEraConfig(payload)
        if (updated) this.$alert('업데이트 하였습니다.')
      } catch (error) {
        this.errorHandler(error)
        // this.$alert(this.$t('common.ALERT.NUTA.022'))
      } finally {
        this.isConnect = false
      }
    },

    // ==========================
    // ========= [삭제] ==========
    // ==========================

    /**
     * [삭제] 버튼을 눌렀을 때, 선택한 row 데이터를 삭제 여부를 리턴합니다.
     * @return {Boolean} 삭제 성공 여부
     */
    applyRemove () {
      // - if(정상 운영중) this.$alert('정상 운영중인 Era입니다. 정말로 삭제하시겠습니까?')
      this.$confirm(this.$t('common.CONFIRM.BASE.032'), '삭제', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(async () => {
        await this.deleteEraConfig(this.selectedRow.eraIdx)
        return await this.getEraConfigs()
      }).catch(() => false)
    },
    /**
     * 선택한 Era를 [삭제]할 때 발생합니다.
     * @param {Array} eraIdx 삭제할(선택된) row 의 인덱스
     */
    async deleteEraConfig (eraIdx) {
      try {
        this.gridLoading = true
        const removed = await API.database.deleteEraConfig(eraIdx)
        console.log(removed)
        if (removed) this.$alert(this.$t('common.ALERT.BASE.017'))
      } catch (error) {
        this.$alert(this.$t('common.ALERT.BASE.016'))
      } finally {
        this.gridLoading = false
      }
    },

    // ==========================
    // ========= [동기화] =========
    // ==========================
    /**
     * 동기화 처리 API 를 호출합니다
     * @param {*} eraIdx
     */
    async syncEraData (eraIdx) {
      try {
        return await API.database.syncEraData(eraIdx)
      } catch (error) {
        this.errorHandler(error)
      }
    },
    async activeSync () {
      // 해당 항목(' + this.selectedRow.eraName + ')을<br>동기화 하시겠습니까?
      this.$confirm(this.$t('common.CONFIRM.NUTA.007', { centralName: this.selectedRow.eraName }), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel'),
        dangerouslyUseHTMLString: true
      }).then(async () => {
        await this.syncEraData(this.selectedRow.eraIdx)
        // 동기화 작업을 요청하였습니다.
        this.$alert(this.$t('common.ALERT.NUTA.001'), '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
        return await this.getEraConfigs()
      }).catch(() => false)
    },

    // ============================
    // ========= 모달 open =========
    // ============================
    /**
     * [항목추가] 버튼을 클릭시 해당 모달을 띄웁니다.
     */
    addModalOpen () {
      this.isConnecting = false
      this.showModal = {
        view: true,
        type: 'create'
      }
      this.newItem = {}
      this.testPassed = false
    },
    /**
     * [변경] 버튼을 클릭시 해당 모달을 띄웁니다.
     * 선택된 row 의 데이터를 가지고 변경을 시도합니다.
     * @param {Object} item 변경 할 로우 데이터
     */
    updateModalOpen (item) {
      if (item !== undefined) this.selectedRow = item
      this.isConnecting = false
      this.newItem = {}
      this.showModal = {
        view: true,
        type: 'update'
      }
      this.auth = { ...cloneDeep(item.auth) }
      this.newItem = cloneDeep(item)
      this.testPassed = false
    },
    /**
     * [항목추가 / 변경] 모달을 닫습니다.
     */
    closeModal () {
      this.isConnectinfg = false
      this.showModal = {
        view: false,
        type: undefined
      }
      this.auth = {
        userName: '',
        userPw: ''
      }
      this.newItem = {}
      this.testPassed = false
      this.gridRefresh(this.grid)
      this.selectedRow = null
      this.selectedRowIdx = undefined
    },
    /**
     * 그리드 설정 - 인터벌시에도 선택된 데이터가 계속 유지되도록 합니다.
     * @param {Object} grid
     */
    init (grid) {
      this.grid = grid

      // sorting 이벤트 발생할 경우 저장
      grid.sortingColumn.addHandler((s, e) => {
        const col = s.columns[e.col]
        const asc = col.currentSort !== '+'

        this.sortedCol = { binding: col.binding, asc }
      })

      grid.addEventListener(grid.hostElement, 'click', (e) => {
        const ht = grid.hitTest(e) // HitTestInfo
        const rows = grid.cells.rows // 클릭한 rows의 data
        const selectedRow = rows[ht.row]

        if (ht.cellType === 1) {
          // 동기화 되도 저장할 수 있도록 합니다
          // 선택된 row를 한번 더 클릭하면 선택을 해제합니다
          if (this.selectedRowIdx === undefined || this.selectedRowIdx !== selectedRow.index) {
            this.selectedRow = selectedRow ? selectedRow.dataItem : null
            this.selectedRowIdx = selectedRow.index
          } else {
            this.selectedRowIdx = undefined
            this.selectedRow = null
          }
        }
      })
    },
    gridRefresh (grid) {
      const cv = grid.collectionView
      cv.refresh()
    },
    routeTo (to) {
      this.$router.push(to)
    }
  },
  beforeDestroy () {
    clearInterval(this.interval)
  },
  data () {
    return {
      totalResultCnt: 0,
      otpModalActive: false,
      otp: false,

      gridLoading: false, // Central 목록 로딩바
      isConnecting: false, // [테스트] 진행중인지 로딩바

      showModal: { // [항목 추가 / 변경] 모달 visible 여부
        view: false,
        type: undefined
      },

      elements: [], // elements 리스트들
      selectedRow: undefined, // 선택한 로우
      selectedRowIdx: undefined, // 선택한 로우 유지
      testPassed: false, // 테스트 성공 했는지 여부

      auth: { // 유저이름 / 유저 비밀번호
        userName: '',
        userPw: ''
      },
      newItem: {},

      // 테이블 정보
      columns: [
        { header: 'ID', binding: 'eraIdx', width: 100, customHtml: true },
        { header: 'Era 명', binding: 'eraName', width: '*', customHtml: true, align: 'left', keyPath: 'common.GRID.NUTA.eraName' },
        { header: 'Era 클러스터 명', binding: 'eraClusterName', width: '*', customHtml: true, align: 'left', keyPath: 'common.PLACEHOLDER.eraCluster' },
        { header: '연결 Eelement', binding: 'elementName', width: '*', customHtml: true, align: 'left', keyPath: 'common.GRID.NUTA.connElement' },
        // { header: '인증 정보', binding: 'auth', width: '*', customHtml: true, keyPath: 'admin.PREF.authInfo', filtable: false },
        { header: 'URL', binding: 'eraUrl', width: '*', customHtml: true },
        { header: '인터벌 주기(분)', binding: 'intervalMin', width: '*', customHtml: true, keyPath: 'common.GRID.NUTA.interval' },
        { header: '운영 여부', binding: 'state', width: '*', customHtml: true, keyPath: 'admin.PREF.isOper' },
        { header: '동기화 상태', binding: 'isSync', width: 150, customHtml: true, keyPath: 'common.GRID.NUTA.syncState' },
        { header: '마지막 동기 시간', binding: 'connectSuccessTime', width: '*', customHtml: true, keyPath: 'common.GRID.lastSyncTime' }
      ],
      tableData: [],
      sortedCol: null,

      columnDataMap: {
        isSync: [
          { value: 0, caption: this.$t('common.fail') },
          { value: 1, caption: this.$t('common.success') },
          { value: -1, caption: this.$t('common.syncing') }
        ],
        state: [
          { value: '', caption: this.$t('common.noOper') },
          { value: 'success', caption: this.$t('common.operNormal') },
          { value: 'error', caption: this.$t('common.operAbNormal') }
        ],
        lastSyncTime: null
      },
      syncStatus (isSync) {
        return {
          1: { contents: this.$t('common.success'), type: 'is-complete' },
          0: { contents: this.$t('common.fail'), type: 'is-fail' }
        }[isSync]
      },
      errorHandler (error) {
        if (error.response) {
          if (error.response.data.code === 'IAM002') return false

          // 기타 에러값
          // COMMON0001 : central/ element / era 등록 시 필수 값 null 일 경우
          // COMMON0012 : element 가상화율 및 임계치 퍼센트 등록 시 0 보다 작게 입력할 경우
          // COMMON0011 : element 2차 임계치가 1차 임계치보다 작을 경우
          // COMMON0003 : central / element 연결 실패 시

          const { code: errorCode, message: errorMsg } = error.response?.data

          const code = {
            COMMON0006: {
              era: this.$v('이미 등록된 URL입니다.'),
              name: this.$v('이미 등록된 Era입니다.')
            }[errorMsg?.split(': ')[1]]
          }

          const customMessage = code[errorCode]
          const defaultMessage = (error.response && error.response.data) ? error.response.data.message : error.message

          const message = customMessage || defaultMessage
          this.$alert(message, '알림', {
            confirmButtonText: this.$t('common.BTN.confirm'),
            dangerouslyUseHTMLString: true
          })
          return false
        }
      }
    }
  }

}
</script>
<style lang="scss">
  .nutanix-era {
    .meta-profile-area {
      margin-top: 100px;
    }

    // 모달
    .new-item-modal {
      .modal-body {
        .edit-list {
          border-top: 1px solid $border-color;
          position: relative;
          & + .edit-list { margin-top: $gap-m;}

          .block-before-test {
            background: rgba(0, 0, 0, 0.8);
            position: absolute;
            top: 0; left: 0; bottom: 0; right: 0;
            z-index: 10;
            display: flex;
            align-items: center;
            justify-content: center;
            color: $light-gray;
            transition: background 0.2s ease-in-out;
            &.is-connecting {
              background: rgba(0, 0, 0, 0.2);
            }
          }
        }
        .register-contents {
          .contents-title {
            min-width: 150px;
          }
        }
        .input-form {
          display: flex;
          align-items: center;
          position: relative;
          & + .input-form {
            margin-top: 5px;
          }
          > .button {
            width: 100%;
          }
        }
        .divided {
          display: flex;
          > * {
            flex: 0 0 50%;
          }
        }
      }
    }
  }
</style>

<style lang="scss" scoped>
 .test-btn {
    width: 100%;
    margin-top:4px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    justify-content: center;

      &.confirm {
        background-color: $success;
        &:disabled {
          background: $success;
          opacity: 1;
        }
      }
    .icon {
      margin-right: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 15px;
      height: 15px;
      .check-icon {
        height: 12px;
      }
    }
  }
</style>
