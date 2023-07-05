<!--
  * 파일명 : ConfigITAutomation.vue
  * 파일 기능 : IT Automation 리스트 노출 및 관리(테스트, 추가, 변경, 삭제)
  * 작성자 : 정재은 외 2명
  * 최종 작성일 : 2021-02-22
  * License By Shinsegae I&C
 -->

<template>
  <div class="it-automation">
    <section class="table-top-wrap">
      <total-count :total-count="totalResultCnt" />

      <div class="button-area -right">
        <button
          class="button"
          type="is-primary"
          @click="addModalOpen"
        >
          {{ $v('추가') }}
        </button>
        <button
          class="button"
          :disabled="!selectedRow"
          @click="updateModalOpen(selectedRow)"
        >
          {{ $v('변경') }}
        </button>
        <button
          class="button"
          @click="applyRemove"
          :disabled="!selectedRow"
          type="is-anti"
        >
          {{ $v('삭제') }}
        </button>
      </div>
    </section>

    <section class="table-area">
      <cmp-grid
        v-loading="loading"
        :item-source="tableData"
        :columns="columns"
        is-read-only
        selectable
        :init-custom-action="init"
        :init-auto-select-row="selectedRow"
        init-auto-select-row-key="itAutomationIdx"
        :sort-keeping="sortedCol"
        page-keeping
        :column-data-map="columnDataMap"
        @total-count="cnt => totalResultCnt = cnt"
      >
        <template #category="{ row }">
          <el-tooltip
            effect="light"
            :disabled="row.category.length <= 1"
          >
            <span>{{ row.category.length > 1 ? `${row.category[0]} 외 ${row.category.length - 1}` : row.category[0] }}</span>
            <template slot="content">
              <p
                v-for="cate in row.category"
                :key="cate"
                style="width: 80px;"
              >
                {{ cate }}
              </p>
            </template>
          </el-tooltip>
        </template>

        <template #connectionStatus="{ row }">
          <el-tooltip
            v-if="row.sync.loginStatus"
            effect="light"
            :content="row.sync.failMessage"
            :disabled="!row.sync.failMessage"
          >
            <cmp-status-tag
              :type="syncStatus[row.sync.loginStatus].type"
              :contents="syncStatus[row.sync.loginStatus].contents"
            />
          </el-tooltip>
        </template>
        <!-- 연결 상태 -->

        <template #isSync="{ row }">
          <cmp-status-tag
            v-if="row.sync.syncStatus"
            :type="syncStatus[row.sync.syncStatus].type"
            :contents="syncStatus[row.sync.syncStatus].contents"
          />
          <!-- 동기화 상태 -->
        </template>
      </cmp-grid>
    </section>

    <!-- 모달 -->
    <!-- 항목 생성 모달 -->
    <el-dialog
      :title="showModal.type === 'create' ? $v('IT Automation 연동 추가') : $v('IT Automation 연동 변경')"
      :visible.sync="showModal.view"
      class="new-item-modal"
      width="840px"
      @close="showModal.view = false"
      top="15vh"
    >
      <section
        v-loading="isConnecting"
        :element-loading-text="$t('common.PLACEHOLDER.testPossibility')"
      >
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
                  v-model="auth.userName"
                />
              </div>
              <div class="input-form">
                <span style="min-width: 100px;">{{ $t('admin.PREF.userPw') }}: </span>
                <el-input
                  :disabled="testPassed"
                  v-if="showModal.type === 'create' || otp"
                  :placeholder="$t('admin.PREF.userPw')"
                  v-model="auth.userPw"
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
                v-model="newItem.url"
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
            :disabled="(isConnecting || !auth.userName || !auth.userPw || !newItem.url)? true : false"
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

          <!-- v-if="testPassed || showModal.type !== 'create'" -->
          <div
            class="edit-list"
            v-if="(testPassed || showModal.type !== 'create') && showModal.view"
          >
            <register-contents
              :title="$v('타입')"
              required
            >
              <el-select
                :disabled="!testPassed"
                v-model="newItem.itAutomationType"
              >
                <el-option
                  v-for="type in scriptType"
                  :key="type.value"
                  :label="type.label"
                  :value="type.value"
                />
              </el-select>
            </register-contents>
            <!-- /. 타입 -->

            <register-contents
              :title="$v('이름')"
              required
            >
              <div class="input-form">
                <el-input
                  :placeholder="$v('이름을 입력해주세요.')"
                  v-model="newItem.itAutomationName"
                  :disabled="!testPassed"
                />
              </div>
            </register-contents>
            <!-- /. 이름 -->

            <register-contents
              :title="$v('네트워크 카테고리')"
              required
            >
              <!-- 네트워크 카테고리 모달 -->
              <network-category-tree-selection-btn
                :visible="networkCategoryModal"
                :cate-limit="1"
                :init-data="networkList"
                @close="networkCategoryModal = false"
                @save="setNetworkCategory"
              />
            </register-contents>
            <!-- /. 네트워크 카테고리 -->

            <register-contents :title="$v('설명')">
              <div class="input-form">
                <el-input
                  :placeholder="$v('설명을 입력해주세요.')"
                  type="textarea"
                  :rows="5"
                  v-model="newItem.itAutomationDesc"
                  :disabled="!testPassed"
                />
              </div>
            </register-contents>
            <!-- /. 설명 -->

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
            {{ $v('취소') }}
          </button>
          <button
            class="button -modal-button"
            :disabled="!testPassed || isConnecting"
            @click="confirmUpdateItem"
            type="is-primary"
          >
            {{ $v('확인') }}
          </button>
        </div>
      </section>

      <otp-modal
        api-call-component-name="ConfigITAutomation"
        required-api
        :it-automation-idx="newItem.itAutomationIdx"
        :callback-api="callbackApi"
        :active="otpModalActive"
        @close="otpModalActive = false"
        @validated-otp="validatedOTP"
      />
      <!-- /. OTP 모달 -->
    </el-dialog>
  </div>
</template>
<script>
import API, { NetworkCategoryTreeSelectionBtn } from '@sd-fe/cmp-core'
import OTPModal from '@/components/Modal/OTPModal/OTPModal'
import CheckIcon from '@/components/Icons/CheckIcon.vue'
import { cloneDeep } from 'lodash'

export default {
  name: 'ConfigITAutomation',
  components: {
    'network-category-tree-selection-btn': NetworkCategoryTreeSelectionBtn,
    'otp-modal': OTPModal,
    CheckIcon
  },
  async created () {
    await this.getITAutomationTypes()
    await this.getNetworkCategory()
    await this.getITAutomationList()
    this.startInterval()
  },
  watch: {
    'showModal.view' (val) {
      if (!val) this.otp = false
    }
  },
  methods: {
    callbackApi: API.sw.getITAutomationConfig,
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
        this.getITAutomationList()
      }, 10000)
    },
    /**
     * IT Automation 전체 리스트를 가져옵니다.
     */
    async getITAutomationList () {
      try {
        this.loading = true
        const response = await API.sw.getITAutomationList()
        this.tableData = this.settingITAutomation(response)
      } catch (error) {
        // this.errorHandler(error)
        this.tableData = []
        clearInterval(this.interval)
      } finally {
        this.loading = false
      }
    },

    /**
     * IT Automation Type 데이터 가져오기
     */
    async getITAutomationTypes () {
      try {
        const data = await API.sw.getITAutomationTypes()

        this.scriptType = data.map(({ field }) => ({ label: field, value: field }))
      } catch (error) {
        console.error('@@ getITAutomationTypes', error)
      }
    },
    /**
     * 네트워크 카테고리 직렬화 데이터 가져오기
     */
    async getNetworkCategory () {
      try {
        const data = await API.network.getNetworkCategory()

        const result = {}
        for (const { ipCategoryIdx: cateIdx, cateKey, cateCode, codeValue } of data) {
          const name = cateKey.replace(/-/g, ' > ')
          result[cateIdx] = { name, cateIdx, cateKey, cateCode, cateName: codeValue }
        }

        this.rawNetworkList = result
      } catch (error) {
        console.error('@@ getNetworkCategory', error)
      }
    },
    /**
     * IT Autonation 리스트를 가공합니다.
     * @param {Array} rawData API로 가져온 IT Automation 목록 데이터입니다.
     * @return {Array} tableData를 위한 데이터를 가공합니다.
     */
    settingITAutomation (rawData) {
      if (!rawData) return

      const typeLabel = type => ({ SaltStack: this.$v('Salt') }[type])
      const categories = networkList => networkList.map(({ cateIdx }) => this.rawNetworkList[cateIdx])

      const itemList = rawData.map(item => {
        const networkList = categories(item.networkList)

        const result = {
          ...item,
          itAutomationTypeLabel: typeLabel(item.itAutomationType), // 타입
          category: networkList.map((cate) => cate ? cate.cateKey : undefined), // 네트워크 카테고리
          networkList
        }

        return result
      })

      return itemList
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
          url: item.url, // 테스트용 "http://10.102.68.69:8000"
          id: this.auth.userName, // 테스트용 "cmpadm"
          password: this.auth.userPw, // 테스트용 "tlstprP1@#"
          masterServer: 'master' // 테스트용 "master"
        }

        const testPassed = await API.sw.connectionTest(payload)
        this.testPassed = testPassed.isSuccess

        // 연결 테스트에 (this.testPassed ? '성공' : '실패') 하였습니다.
        const message = this.testPassed ? this.$t('common.ALERT.NUTA.005') : this.$t('common.ALERT.NUTA.006')
        item.connectionTestResult = testPassed

        this.$alert(message, '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
      } catch (error) {
        this.catchMessage(error, this.$v('연결 테스트 도중 문제가 발생했습니다.<br>관리자에게 문의해주세요.'))
      } finally {
        this.isConnecting = false
      }
    },

    /**
     * [네트워크 카테고리] 데이터 저장
     * @param {Array} networkList
     */
    setNetworkCategory (networkList) {
      this.networkList = cloneDeep(networkList)
    },

    // ===================================
    // ========== 모달 내용 저장 ============
    // ===================================

    /**
     * [항목 추가 / 변경] > [확인] 클릭시 발생하는 이벤트를 다룹니다.
     * 같은 모달을 사용하므로, 함수 두개로 분리시킵니다
     */
    async confirmUpdateItem () {
      const validator = [
        { condition: this.newItem.itAutomationType, message: this.$v('타입을 입력해주세요.') },
        { condition: this.newItem.itAutomationName, message: this.$v('이름을 입력해주세요.') },
        { condition: this.networkList.length > 0, message: this.$v('네트워크 카테고리를 선택해주세요.') }
      ]

      const validation = validator.every(({ condition, message }) => {
        if (!condition) this.$alert(message)
        return condition
      })

      if (!validation) return false

      const confirm = (this.showModal.type === 'create') ? '021' : '015' // 해당 항목을 생성하시겠습니까? : 업데이트 하시겠습니까?
      this.updateItemAction(this.$t(`common.CONFIRM.BASE.${confirm}`))
    },

    /**
     * [항목 추가/변경 > 확인] 시 itautomation 이 추가/변경 되도록 하는 함수입니다.
     * @param {String} message
     */
    updateItemAction (message) {
      const { itAutomationDesc, itAutomationName, itAutomationType, itAutomationIdx, url } = this.newItem

      this.$confirm(message, '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(async () => {
        const payload = {
          id: this.auth.userName,
          password: this.auth.userPw,
          networkList: this.networkList,
          itAutomationDesc,
          itAutomationName,
          itAutomationType,
          url,
          itAutomationIdx,
          masterServer: 'master' // 🟨
        }

        const apiName = {
          create: 'createITAutomation', // [추가]
          update: 'updateITAutomation' // [변경]
        }[this.showModal.type]

        const result = await this[apiName](payload)
        if (!result) return

        await this.getITAutomationList()
        return this.closeModal()
      }).catch(() => {
        return false
      })
    },

    /**
     * [추가 > 확인] IT Automation 추가 API 를 실행합니다
     * @param {Object} payload
     */
    async createITAutomation (payload) {
      try {
        this.isConnecting = true
        const created = await API.sw.createITAutomation(payload)
        if (created) this.$alert(this.$t('추가하였습니다.'))
        return true
      } catch (error) {
        this.catchMessage(error, this.$v('IT Automation 추가에 실패했습니다.'))
        return false
      } finally {
        this.isConnecting = false
      }
    },
    /**
     * [변경 > 확인] IT Automation 이 변경될 때 API를 실행합니다.
     * @param {Object} payload API 에 함께 전달할 데이터
     */
    async updateITAutomation (payload) {
      try {
        this.isConnect = true
        const updated = await API.sw.updateITAutomation(payload)
        if (updated) this.$alert('업데이트 하였습니다.')
        return true
      } catch (error) {
        this.catchMessage(error, this.$v('IT Automation 변경에 실패했습니다.'))
        return false
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
      this.$confirm(this.$t('common.CONFIRM.BASE.032'), '삭제', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(async () => {
        await this.deleteITAutomation(this.selectedRow.itAutomationIdx)
        return await this.getITAutomationList()
      }).catch(() => false)
    },
    /**
     * 선택한 IT Automation을 [삭제]할 때 발생합니다.
     * @param {Array} itAutomationIdx 삭제할(선택된) row 의 인덱스
     */
    async deleteITAutomation (itAutomationIdx) {
      try {
        this.loading = true
        const removed = await API.sw.deleteITAutomation(itAutomationIdx)
        if (removed) this.$alert(this.$t('common.ALERT.BASE.017'))
      } catch (error) {
        this.$alert(this.$t('common.ALERT.BASE.016'))
      } finally {
        this.loading = false
      }
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
      this.networkList = []
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
      this.networkList = cloneDeep(item.networkList)
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
      this.networkList = []
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

      loading: false,
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
      networkList: [],
      rawNetworkList: {}, // 기본 네트워크 카테고리 리스트 > Object 형태로 변경

      scriptType: [], // 타입 option 목록

      // 테이블 정보
      columns: [
        { header: this.$v('타입'), binding: 'itAutomationTypeLabel' },
        { header: this.$v('이름'), binding: 'itAutomationName' },
        { header: this.$v('설명'), binding: 'itAutomationDesc' },
        { header: 'URL', binding: 'url' },
        { header: this.$v('아이디'), binding: 'id' },
        { header: this.$v('네트워크 카테고리'), binding: 'category', customHtml: true },
        { header: this.$v('연결 상태'), binding: 'connectionStatus', customHtml: true },
        { header: this.$v('동기화 상태'), binding: 'isSync', customHtml: true }
      ],
      tableData: [],
      sortedCol: null,
      networkCategoryModal: false,

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
      syncStatus: {
        WAIT: { contents: this.$v('대기'), type: 'is-wait' },
        START: { contents: this.$v('시작'), type: 'is-info' },
        RUNNING: { contents: this.$v('진행중'), type: 'is-ing' },
        SUCCESS: { contents: this.$v('성공'), type: 'is-complete' },
        FAIL: { contents: this.$v('실패'), type: 'is-fail' }
      },

      catchMessage (error, defaultMessage) {
        const { code, message: msg } = error.response.data
        const message = {
          SM3000: this.$v('중복된 이름 또는 URL이 존재합니다.'),
          SM3001: this.$v('중복된 네트워크 정보가 존재합니다.')
        }[code] || defaultMessage || msg

        return this.$alert(message, '', { dangerouslyUseHTMLString: true, callback: () => false })
      },
      errorHandler (error) {
        if (error.response) {
          if (error.response.data.code === 'IAM002') return false

          const message = (error.response && error.response.data) ? error.response.data.message : error.message
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
  .it-automation {
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
