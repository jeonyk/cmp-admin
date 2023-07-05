<!--
  * 파일명 : SetResourceSwitchDetail.vue
  * 파일 기능 :
  * 작성자 : 이경환 외 2명
  * 최종 작성일 : 2021-02-19
  * License By Shinsegae I&C
  * 2021-02-19 fix: 접근불가능 페이지 접근 후 > 뒤로가기시 이동 불가능 버그 수정
 -->

<template>
  <div class="set-resource-switch-detail">
    <!-- <h3 class="product-title">
      자원 정보
    </h3> -->
    <dashboard-panel
      :title="$v('설정 정보')"
      :padding-top="0"
      class="product-info -default"
    >
      <template #header>
        <section class="header__certificate">
          <button
            class="button header__certificate__btn"
            :disabled="isDisabledDisconnectBtn"
            @click="handleClickCertifDelete"
          >
            {{ $v('인증서 해제') }}
          </button>
          <button
            type="is-primary"
            :disabled="isDisabledConnectBtn"
            class="button header__certificate__btn"
            @click="handleClickCertifOpen"
          >
            {{ $v('인증서 연결') }}
          </button>
          <span
            class="divider"
            v-if="!isUrgent && packageType !== 'PL'"
          />
          <!-- 바로 삭제/삭제 취소는 긴급 여부와 상관 없이 노출(23/05/16) -->
          <!-- :disabled="loadBalanceData.vmStatus === 'START'" -->
          <template v-if="isDeleteDate">
            <button
              class="button"
              type="is-anti"
              @click="forceDelete"
            >
              {{ $t('바로 삭제') }}
            </button>

            <button
              v-if="canDelete"
              class="button"
              type="is-primary"
              @click="handleCancelDelete"
            >
              {{ $v('삭제 취소') }}
            </button>
            <el-tooltip
              v-else
              placement="top"
              effect="light"
            >
              <span
                slot="content"
                style="white-space: nowrap;"
              >
                {{ $v('삭제 중이거나 삭제 취소 불가능 자원입니다.') }}
                <br>
                <b v-if="loadBalanceData.deleteDateByDayjs">{{ $v('삭제 예정일') }} : {{ loadBalanceData.deleteDateByDayjs }}</b>
              </span>
              <div>
                <button
                  class="button"
                  type="is-primary"
                  :disabled="true"
                >
                  {{ $v('삭제 취소') }}
                </button>
              </div>
            </el-tooltip>
          </template>
          <!-- 변경 -->
          <button
            v-if="!isUrgent"
            class="button"
            type="is-primary"
            :disabled="!!isDeleteDate"
            @click="isOpenUpdateForm = true"
          >
            {{ $v('변경') }}
          </button>
          <button
            v-if="!isUrgent"
            class="button"
            type="is-primary"
            :disabled="!!isDeleteDate"
            @click="isOpenDelete = true"
          >
            {{ $t('삭제') }}
          </button>

          <!-- 자원 삭제 -> 삭제 확인 모달 -->
          <el-dialog
            :visible.sync="isOpenDelete"
            width="350px"
            @close="isOpenDelete = false"
            class="pass-name-form"
            v-loading="isLoadingDelete"
          >
            <span
              class="name-form-noti"
              v-html="$v('<b>{loadBalanceName}</b>을 삭제하시겠습니까?<br>로드밸런스명을 동일하게 입력해주세요.',
                         {loadBalanceName})"
            />
            <el-input
              v-model="checkLoadBalanceName"
              :placeholder="$v('로드밸런스명을 입력하세요.')"
              @keyup.native.enter="e => {
                if(vmDetailData.hostname !== checkLoadBalanceName) return
                confirmDelete()
              }"
            />
            <small
              class="-reference"
              v-if="!checkLoadBalanceName"
            >*&nbsp;{{ $v('로드밸런스명을 입력하세요.') }}</small>

            <small
              class="-reference"
              v-else-if="loadBalanceName !== checkLoadBalanceName"
            >*&nbsp;{{ $v('로드밸런스명이 올바르지 않습니다.') }}</small>

            <div class="convert-urgent-form">
              <toggle-is-urgent-checkbox
                v-model="deleteIsUrgent"
                :action-name="$v('자원 삭제')"
              />
            </div>

            <div class="modal-button-area">
              <button
                class="button -modal-button"
                type="is-anti"
                @click="isOpenDelete = false"
              >
                {{ $v('취소') }}
              </button>
              <button
                class="button -modal-button"
                @click="handleClickLbDelete()"
                type="is-primary"
                :disabled="loadBalanceName !== checkLoadBalanceName"
              >
                {{ $v('삭제') }}
              </button>
            </div>
          </el-dialog>
        </section>

        <el-dialog
          :title="$v('인증서 연결')"
          :visible="isOpenCertif"
          @close="handleCloseCertif"
        >
          <certification-connect
            @close="handleCloseCertif"
            @confirm="handleConfirmCertif"
          />
        </el-dialog>
      </template>
      <vertical-table
        class="product-table"
        :columns="columns"
        :data="loadBalanceData"
        type="horizontal"
      >
        <!--   v-if="loadBalanceData.deleteDate && isView" -->
        <template #isUrgent="props">
          {{ props.row.isUrgent ? $v('긴급') : $v('일반') }}
        </template>
        <template
          #deleteDate
        >
          <span>
            {{ deleteDate }}
          </span>
        </template>
        <template #port="props">
          {{ props.row.port }}
        </template>
        <template #netName="props">
          {{ props.row.netName }} {{ props.row.isManualManagement?'('+$v('수기관리')+')': '' }}
        </template>
        <template #protocolType="props">
          {{ props.row.protocolType }}<span class="ssh-certif__text">{{ isSsl ? certifMessage : '' }}
          </span>
        </template>
      </vertical-table>
    </dashboard-panel>
    <dashboard-panel
      :title="$v('SSL 인증서 정보')"
      :padding-top="0"
      class="product-info -default"
    >
      <cmp-grid
        :item-source="MOCK_GRID_CERT"
        :columns="certificationColumns"
        :empty-text="$v('연결된 인증서가 없습니다.')"
      />
    </dashboard-panel>
    <g-tab
      class="detail-tabs"
      :data="networkDetailTabs"
    >
      <template #manage>
        <meta-data-form
          v-loading="loading.isGetMetaInfo || loading.isUpdateMetaInfo"
          style="margin-top: -30px;"
          :form-data="metaInfoArr"
          use-update-btns
          read-only
          @save-info="saveMetaInfo"
          ref="metaDataFormRef"
        />
      </template>
      <template #server>
        <cmp-grid
          :item-source="swType==='l4'?l4.serviceList :l7.serviceList"
          :columns="loadBalance7Columns.serverInfoColumns"
          :empty-text="$v('서버 정보가 없습니다.')"
        />
      </template>
      <template #policy>
        <keep-alive>
          <cmp-grid
            :item-source="l7.policyInfoList"
            :columns="loadBalance7Columns.policyColumns"
            :empty-text="$v('정책 정보가 없습니다.')"
          >
            <template #serviceName="props">
              <el-tooltip
                v-if="props.row.serviceName.length > 1"
                placement="bottom-end"
                popper-class="panel-title-popper"
                effect="light"
              >
                <template #content>
                  <span v-html="setProjectData(props.row.serviceName)" />
                </template>
                <span>
                  {{ props.row.serviceName[0] }}
                  <a class="-link">{{ props.row.serviceName.length - 1 }}</a>
                </span>
              </el-tooltip>
              <span v-else>{{ props.row.serviceName[0] }}</span>
            </template>
          </cmp-grid>
        </keep-alive>

        <dashboard-panel
          :title="$v('정책 요청 사항')"
          small-title
          :padding-top="0"
          class="product-info -default"
        >
          <el-input
            v-model="loadBalanceData.policyRequestComment"
            type="textarea"
            disabled
          />
        </dashboard-panel>
      </template>
    </g-tab>
    <el-dialog
      :title="swType ==='l4' ? $t('common.MODAL.changeL4') : $t('common.MODAL.changeL7')"
      :visible="isOpenUpdateForm"
      width="1400px"
      @close="isOpenUpdateForm = false"
      top="10vh"
    >
      <network-l4-update-form
        v-if="swType === 'l4'"
        v-loading="isLoadingUpdate"
        @close="isOpenUpdateForm = false"
        @save="handleSaveUpdate"
        :user-info="user"
        in-admin
        :height="'72vh'"
        :data="loadBalanceData"
      />
      <network-l7-update-form
        v-if="swType === 'l7'"
        v-loading="isLoadingUpdate"
        @close="isOpenUpdateForm = false"
        @save="handleSaveUpdate"
        :user-info="user"
        in-admin
        :height="'72vh'"
        :data="loadBalanceData"
      />
    </el-dialog>
  </div>
</template>
<script>
import axios from 'axios'
import API, { VerticalTable, DashboardPanel } from '@sd-fe/cmp-core'
import BlockRouteMixins from '@/components/Utils/BlockRoute.mixins'
import CertificationConnect from '@/components/Modal/NetworkUpdateModal/CertificationConnect.vue'
import { mapState, mapGetters } from 'vuex'
import Dayjs from 'dayjs'

export default {
  name: 'SetResourceSwitchDetail',
  mixins: [BlockRouteMixins],
  components: {
    VerticalTable,
    'dashboard-panel': DashboardPanel,
    CertificationConnect
  },
  computed: {
    ...mapState({
      user: state => state.auth.user,
      // breadcrumbs: state => state.common.breadcrumbs,
      networkL4metadataForm: state => state.metadata.NETWORK.NETWORK_L4,
      networkL7metadataForm: state => state.metadata.NETWORK.NETWORK_L7,
      packageType: state => state.auth.packageType
    }),
    ...mapGetters(['user', 'packageType']),
    canDelete () {
      if (this.loadBalanceData?.deleteDate) {
        return this.loadBalanceData.deleteDate && this.isBefore && this.isView
      } else {
        return false
      }
    },

    ...mapGetters(['user']),
    loadBalanceData () {
      if (this.swType === 'l4') return this.l4?.detailInfo
      else if (this.swType === 'l7') return this.l7?.detailInfo
      else return null
    },
    loadBalanceName () {
      if (this.swType === 'l4') return this.loadBalanceData?.lbName
      else if (this.swType === 'l7') return this.loadBalanceData?.lbName
      else return null
    },
    lodaBalanceIdx () {
      if (this.swType === 'l4') return this.loadBalanceData?.vrserverIdx
      else if (this.swType === 'l7') return this.loadBalanceData?.csVrserverIdx
      else return null
    },
    deleteDate () {
      if (this.loadBalanceData.deleteDate) {
        return Dayjs(this.loadBalanceData.deleteDate).format('YYYY.MM.DD')
      } else {
        return ''
      }
    },
    isSsl () {
      if (this.loadBalanceData === null) return false
      const data = this.loadBalanceData
      return data.protocolType !== 'SSL'
    },
    hasConnectedCertifData () {
      return !!this.connectedCertifData.length
    },
    certifMessage () {
      const hasConnectedCertifData = this.hasConnectedCertifData
      if (this.loadBalanceData.protocolType) return ''
      return hasConnectedCertifData ? ` ${this.$v('인증서 연결 성공')} (${this.loadBalanceData.protocolType}/${this.loadBalanceData.protocolType})` : this.$v('인증서 연결 실패')
    },
    isDisabledDisconnectBtn () {
      const hasConnectedCertifData = this.hasConnectedCertifData
      return !(hasConnectedCertifData && this.isSsl)
    },
    isDisabledConnectBtn () {
      const hasConnectedCertifData = this.hasConnectedCertifData
      return !(!hasConnectedCertifData && this.isSsl)
    },
    isUrgent () { // 긴급 자원 여부
      return !!this.loadBalanceData?.isUrgent
    },
    isDeleteDate () {
      return this.loadBalanceData?.deleteDate ? this.loadBalanceData?.deleteDate : null
    }
  },
  async created () {
    const pathInfo = this.$route?.path.split('/')
    this.cancelToken = axios.CancelToken.source()
    this.swType = pathInfo[pathInfo.length - 2]
    this.idx = this.$route.params.idx

    await this.init()
    this.setTabs()
  },

  methods: {
    setL4Payload (isNew, saveData) {
      const {
        beforePrice,
        isUrgent,
        price,
        tagInfo,
        ...rest
      } = saveData

      const service = 'NETWORK_L4'

      const payload = {
        beforePrice,
        groupIdx: saveData.groupIdx,
        groupName: saveData.groupName,
        isUrgent: !!isUrgent, // 긴급 여부(긴급 = true, 일반 = false)
        price,
        projectIdx: saveData.projectIdx,
        requestData: {
          ...rest,
          ...(isNew && {
            tagInfo: tagInfo || []
          })
        },
        service,
        userId: this.user.userId,
        userName: this.user.userName
      }
      return payload
    },
    setL7Payload (isNew, saveData) {
      const {
        beforePrice,
        isUrgent,
        price,
        tagInfo,
        ...rest
      } = saveData

      const service = 'NETWORK_L7'

      const payload = {
        beforePrice,
        groupIdx: saveData.groupIdx,
        groupName: saveData.groupName,
        isUrgent: !!isUrgent, // 긴급 여부(긴급 = true, 일반 = false)
        price,
        projectIdx: saveData.projectIdx,
        requestData: {
          ...rest,
          ...(isNew && {
            tagInfo: tagInfo || []
          })
        },
        service,
        userId: this.user.userId,
        userName: this.user.userName
      }
      return payload
    },
    /**
   * API_HANDLER (POST)네트워크 L7 생성 API
   */
    async updateNetworkL7 (payload) {
      try {
        await API.work_v3.updateNetworkL7(payload) // 일반 네트워크 L7 생성
        this.$alert('Network L7 실행 작업이 요청되었습니다.')
        return true
      } catch (error) {
        console.error(error)
        this.$alert(this.$t('자원 변경을 실패하였습니다.<br/> 관리자에게 문의해주세요.'), { dangerouslyUseHTMLString: true }) // 생성에 실패하였습니다.<br>관리자 문의 부탁드립니다.
        throw error
      }
    },
    /**
   * API_HANDLER (POST)네트워크 L4 생성 API
   */
    async updateNetworkL4 (payload) {
      try {
        await API.work_v3.updateNetworkL4(payload) // 일반 네트워크 L4 생성
        this.$alert('Network L4 실행 작업이 요청되었습니다.')
        return true
      } catch (error) {
        console.error(error)
        this.$alert(this.$t('자원 변경을 실패하였습니다.<br/> 관리자에게 문의해주세요.'), { dangerouslyUseHTMLString: true }) // 생성에 실패하였습니다.<br>관리자 문의 부탁드립니다.
        throw error
      }
    },
    /**
     * L4 생성/수정 시, '저장'
     */
    async handleSaveUpdate (saveData) {
      try {
        this.isLoadingUpdate = true
        let result = null
        const isL7 = saveData?.csVrserverIdx
        const payload = await !isL7 ? this.setL4Payload(false, saveData) : this.setL7Payload(false, saveData)
        if (!isL7) {
          result = await this.updateNetworkL4(payload)
        } else {
          result = await this.updateNetworkL7(payload)
        }
        if (result) {
          this.isOpenUpdateForm = false
          this.checkedRows = []
          this.init()
        }
      } catch (err) {
        console.log(err)
      } finally {
        this.isLoadingUpdate = false
      }
    },
    /** API_HANDLER (GET) 프로젝트 조회 */
    async getProject (payload) {
      try {
        const result = await API.iam.getProject(payload)
        return result
      } catch (error) {
        console.error(error)
      }
    },
    async init () {
      try {
        this.connectedCertifData = await this.getSslCertif()
        if (this.swType && this.idx !== undefined) {
          await this.getDetail()
          // '삭제 예정일'을 세팅합니다.
          this.setDeleteDate()
        }
        // 관.조.프 명을 최신상태로 유지합니다.
        await this.setProjectName(this.loadBalanceData)
        this.getMetaInfo()
      } catch (error) {
        this.goToList()
      }
    },
    routeTo (to) {
      this.$router.push(to)
    },
    goToList () {
      this.cancelToken.cancel()
      // this.clearGetVmInterval() 인터벌
      return this.routeTo({ name: 'set-resource-switch' })
    },
    // 관.조.프 명을 최신상태 세팅
    async setProjectName (data = this.loadBalanceData) {
      const { companyIdx, groupIdx, projectIdx } = data
      const payload = { companyIdx, groupIdx, projectIdx }
      this.projectInfo = await this.getProject(payload)
    },
    /**
     * [바로 삭제]
     */
    forceDelete () {
      this.$confirm(this.$v('자원을 바로 삭제하시겠습니까?'))
        .then(async () => {
          const idxType = this.loadBalanceData.vrserverIdx ? 'vrserverIdx' : 'csVrserverIdx'
          const params = {
            indexType: idxType,
            userResourceIdx: this.loadBalanceData[idxType],
            userId: this.user.userId,
            userName: this.user.userName
          }
          const result = await this.forceDeleteResource(params)
          if (result) this.goToList()
        }).catch(() => false)
    },

    /** API_HANDLER (Delete) 자원 바로 삭제 **/
    async forceDeleteResource (params) {
      try {
        this.loading.deleteVm = true
        const result = await API.work_v3.forceDeleteResource(params)

        if (result) {
          this.$alert(this.$v('자원을 삭제하였습니다.'), () => false)
          return true
        } else { return false }
      } catch (error) {
        console.error(error)
        this.$alert(this.$v('삭제에 실패하였습니다.<br>관리자 문의 부탁드립니다.'), {
          dangerouslyUseHTMLString: true,
          callback: () => false
        })
      } finally {
        this.loading.deleteVm = false
      }
    },

    /**
     * [삭제 취소]
     */
    handleCancelDelete () {
      this.$confirm(this.$v('삭제 예정인 자원입니다. 삭제를 취소하시겠습니까?'), { dangerouslyUseHTMLString: true })
        .then(async () => {
          const idxType = this.loadBalanceData.vrserverIdx ? 'vrserverIdx' : 'csVrserverIdx'

          const params = {
            indexType: idxType,
            userResourceIdx: this.loadBalanceData[idxType],
            userId: this.user.userId,
            userName: this.user.userName
          }

          const res = await API.work_v3.cancelDelete(params)
          if (res) {
            this.$alert(this.$v('삭제 요청이 취소되었습니다.'), () => false)
            this.columns.shift()
            this.isView = false
          }

          this.init()
        }).catch(() => false)
    },
    /**
     * deleteDate 세팅
     */
    setDeleteDate () {
      if (!this.loadBalanceData?.deleteDate) return
      const today = Dayjs().format('YYYY.MM.DD')
      const delDate = Dayjs(this.loadBalanceData.deleteDate).format('YYYY.MM.DD')
      this.isBefore = Dayjs(today).isBefore(delDate)
      this.isView = true

      if (this.loadBalanceData?.deleteDate &&
      this.isBefore &&
      this.columns[0].binding !== 'deleteDate') {
        this.columns.unshift({ binding: 'deleteDate', header: '삭제 예정일', colspan: true, keyPath: 'common.GRID.deleteDate' })
      }
    },
    setProjectData (data) {
      if (typeof data === 'string') return data
      return [...data].splice(1, data.length - 1).join('<br>')
    },
    /** 탭 생성 */
    setTabs () {
      const initTabs = [
        { field: 'manage', name: this.$v('운영 정보'), active: true },
        { field: 'server', name: this.$v('서버 정보'), active: false }
      ]
      if (this.swType === 'l7') {
        initTabs.push({ field: 'policy', name: this.$v('정책 정보'), active: false })
      }
      this.networkDetailTabs = initTabs
    },
    /** 메타데이터 */
    async getMetaInfo (data = this.loadBalanceData) {
      try {
        this.loading.isUpdateMetaInfo = true
        // 메타데이터 동기화 -> 메타데이터 편집 중이 아닐 때만
        if (this.isMetaDataFormEditing()) return

        const metadataFormName = () => {
          if (this.swType === 'l4') return 'networkL4metadataForm'
          else if (this.swType === 'l7') return 'networkL7metadataForm'
        }
        this.allMetaInfoArr = this[metadataFormName()]

        const meta = (this.lodaBalanceIdx)
          ? await this.getNetworkResourceMetaInfo()
          : (data?.metaInfo ? JSON.parse(data.metaInfo) : null)
        this.loadBalanceData.metaInfo = meta ? JSON.stringify(meta) : ''

        this.metaInfoArr = await this.settingMetaDataArr(meta)
      } catch (error) {
        console.error(error)
      } finally {
        this.loading.isUpdateMetaInfo = false
      }
    },
    // 메타데이터 정보 세팅
    settingMetaDataArr (data = {}) {
      try {
        const metaData = ((this.swType === 'l4' ? this.networkL4metadataForm : this.networkL7metadataForm) || []).map(meta => {
          const info = data && data[meta.key]
            ? data[meta.key]
            : ''

          return {
            ...meta,
            data: info || meta.data
          }
        })
        return metaData
      } catch (error) {
        console.error(error)
      }
    },
    /** API_HANDLER (삭제) 로드벨런스 삭제 (L4, L7) */
    async handleClickLbDelete (data = this.loadBalanceData) {
      try {
        this.isLoadingDelete = true
        console.log('[Click] 로드벨런스 삭제')
        const { beforePrice, groupIdx, projectIdx, price } = data
        const { groupName, companyName, projectName } = this.projectInfo[0]
        const payload = {
          beforePrice: beforePrice || 0,
          groupIdx,
          groupName,
          projectIdx,
          isUrgent: !!this.deleteIsUrgent,
          price: price || 0,
          service: this.swType === 'l4' ? 'NETWORK_L4' : 'NETWORK_L7',
          userId: this.user.userId,
          userName: this.user.userName,

          // 자원데이터
          requestData: {

            ...data,

            // 최신 관.조.프 명
            groupName,
            companyName,
            projectName
          }
        }

        if (this.swType === 'l4') {
          await this.deleteNetworkL4(payload)
        } else await this.deleteNetworkL7(payload)
        this.isOpenDelete = false
        await this.init()
      } catch (error) {
        console.error(error)
        this.$alert(this.$v('삭제에 실패하였습니다.<br>관리자 문의 부탁드립니다.'), {
          dangerouslyUseHTMLString: true,
          callback: () => false
        })
      } finally {
        this.isLoadingDelete = false
      }
    },

    /** API_HANDLER (POST) 네트워크 L4 자원 삭제 */
    async deleteNetworkL4 (payload) {
      try {
        const res = await API.work_v3.deleteNetworkL4(payload)
        if (res) {
          this.$alert(this.$t('자원 삭제를 요청하였습니다.'))
        } else this.$alert(this.$t('common.ALERT.BASE.038'))
      } catch (error) {
        console.err(error)
        throw error
      }
    },
    /** API_HANDLER (POST) 네트워크 L7 자원 삭제 */
    async deleteNetworkL7 (payload) {
      try {
        const res = await API.work_v3.deleteNetworkL7(payload)
        if (res) {
          this.$alert(this.$t('자원 삭제를 요청하였습니다.'))
        } else this.$alert(this.$t('common.ALERT.BASE.038'))
      } catch (error) {
        console.log(error)
        throw error
      }
    },

    /**
   * API: 메타 정보를 조회 합니다. (기생성 자원의 경우)
   */
    async getNetworkResourceMetaInfo () {
      try {
        this.loading.isGetMetaInfo = true

        const payload = {
          resourceType: this.swType === 'l4' ? 'L4' : 'L7',
          resourceIdx: this.swType === 'l4' ? this.loadBalanceData.vrserverIdx : this.loadBalanceData.csVrserverIdx
        }

        return await API.network.getNetworkResourceMetaInfo(payload)
      } catch (error) {
        console.error(error)
        // this.$alert(this.$v('운영 정보 조회를 실패했습니다.'), () => false)
      } finally {
        this.loading.isGetMetaInfo = false
      }
    },
    /**
   * API: 메타 정보를 업데이트 합니다.
   */
    async saveMetaInfo (params) {
      try {
        this.loading.isUpdateMetaInfo = true

        const payload = {
          metaInfo: JSON.stringify(params),
          reqUserId: this.user.userId,
          index: this.swType === 'l4' ? this.loadBalanceData.vrserverIdx : this.loadBalanceData.csVrserverIdx
        }

        const result = this.swType === 'l4' ? await API.network.updateVrserverMetaInfo(payload) : await API.network.updateCsVrserverMetaInfo(payload)

        if (result) {
          this.$alert(this.$v('운영 정보 업데이트를 성공했습니다.'), () => false)
          this.getMetaInfo()
        }
      } catch (error) {
        console.error(error)
        this.$alert(this.$v('운영 정보 업데이트를 실패했습니다.'), () => false)
      } finally {
        this.loading.isUpdateMetaInfo = false
      }
    },
    // 메타데이터 폼 업데이트 중인지?
    isMetaDataFormEditing () {
      const ref = this.$refs?.metaDataFormRef

      return ref?.activeEdit
    },

    handleConfirmCertif () {
      console.log('handleConfirmCertif')
    },
    handleClickCertifOpen () {
      this.isOpenCertif = true
    },
    async handleClickCertifDelete () {
      const isConfirm = await this.$confirm(this.$v('연결을 해제 하시겠습니까?')).then(() => true).catch(() => false)
      if (isConfirm) { console.log('handleClickCertifDelete') }
    },
    handleCloseCertif () {
      this.isOpenCertif = false
    },
    /** API_HANDLER (GET) 인증서 가져오기(네트워크 장비 IDX)의 인증서 정보를 가져옵니다. **/
    async getSslCertif (netIdx) {
      try {
        const result = await API.network.getSslCertif(netIdx)
        return result
      } catch (error) {
        // this.$alert(this.$v('인증서를 불러오지 못하였습니다.'))
      }
    },
    async getDetail () {
      let lbName = ''
      try {
        // [L4 상세페이지] 상세 조회
        if (this.swType === 'l4') {
          const res = await API.network.getVrserverDetail(this.idx)
          if (!res) this.$router.replace({ name: 'not-found-status', params: { code: 400 } })
          lbName = res.vrserverName
          this.setL4Data({ ...res })

          // [L7 상세페이지] 상세 조회
        } else if (this.swType === 'l7') {
          const res = await API.network.getCsvrserverDetail(this.idx)
          if (!res) this.$router.replace({ name: 'not-found-status', params: { code: 400 } })
          lbName = res.csVrserverName
          this.setL7Data({ ...res })
        }

        this.$store.commit('common/ADD_PARAMETERS', {
          label: this.$route.params ? lbName : this.$t('bc.MANAGE.resDetail'),
          path: ''
        })
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.$alert(message)

        this.$router.replace({ name: 'not-found-status', params: { code: error.response?.status } })
      }
    },
    // setL4ServerColumn () {
    // const columns = JSON.parse(JSON.stringify(this.loadBalance4Columns.serverInfoColumns))
    // this.loadBalance4Columns.serverInfoColumns = columns.filter(col => col?.field !== 'serverhostName')
    // },
    setL4Data (data) {
      console.log('L4 Res : ', data)

      const detail = {
        ...data,
        port: data.port.toString(),
        lbName: data?.vrserverName
      }
      if (detail.deleteDate) {
        console.log(detail.deleteDate)
        detail.deleteDateByDayjs = Dayjs(detail.deleteDate).format('YYYY.MM.DD')
      }
      const serviceInfo = data.serviceList?.length ? data.serviceList : null

      this.l4.detailInfo = detail
      this.l4.serviceList = serviceInfo
    },
    setL7Data (data) {
      console.log('L7 Res : ', data)

      const detail = data
      detail.lbName = detail.csVrserverName
      if (detail.deleteDate) {
        detail.deleteDateByDayjs = Dayjs(detail.deleteDate).format('YYYY.MM.DD')
      }
      // const serviceInfo = data.serviceList?.length ? data.serviceList : null

      // const serviceList = networkL7.serviceList

      // if (serviceList) {
      //   for (const key in serviceList) {
      //     const server = serviceList[key].server
      //     if (server) {
      //       this.serversData.push(server)
      //     }
      //   }
      // }
      this.l7.detailInfo = detail
      // this.l4.serviceList = serviceInfo
      this.setDetailDatas(data.policies)
    },

    /**
     * 서버 정보, 서비스 정보 세팅
     */
    setDetailDatas (policyList) {
      if (policyList === undefined) return
      // const services = [] //
      let servers = [] // 서버 정보
      const policies = [] // 정책 정보

      for (const key in policyList) {
        policies.push(policyList[key])
        const vrserver = policyList[key].vrserver

        const serviceList = vrserver?.serviceList
        if (!serviceList) return

        const serviceNames = serviceList.map(svc => svc.serviceName)
        // const serviceNameList = []
        // for (const key in serviceList) {
        //   serviceNameList.push(serviceList[key].serviceName)
        // }
        policyList[key].serviceName = serviceNames
        console.log('🚀 ~ file: SetResourceSwitchDetail.vue:394 ~ setDetailDatas ~ serviceList:', serviceList)
        servers = serviceList
        // for (const service in serviceList) {
        //   console.log('🚀 ~ file: SetResourceSwitchDetail.vue:394 ~ setDetailDatas ~ service:', service)

        //   if (servers?.length) {
        //     const overlapSvr = servers.some(svr => svr?.serverName === serviceList[service]?.server?.serverName)
        //     if (!overlapSvr) servers.push(serviceList[service].server)
        //   }

        // const overlapSvc = services.some(svr => svr?.serverName === serviceList[service]?.serverName)
        // if (!overlapSvc) services.push(serviceList[service])
        // }
      }

      this.l7.serviceList = [...servers]
      // this.l7.projectInfoList = [...services]
      this.l7.policyInfoList = [...policies]
    },
    map (arr, key) {
      const data = arr.map(item => { return item[key] })
      return data
    }
  },
  data (root) {
    return {
      // 최신상태의 프로젝트 정보
      projectInfo: null,

      /** 삭제 연관 변수 */
      cancelToken: null, // axios cancel 토큰
      deleteIsUrgent: true, // 삭제 > 긴급 여부
      isBefore: false,
      isView: true,
      checkLoadBalanceName: '',

      /** 모달 컨트롤 */
      isOpenDelete: false,
      isLoadingDelete: false,
      isOpenUpdateForm: false,
      isLoadingUpdate: false,

      MOCK_GRID_CERT: [
        { certName: 'certification1', validTo: '2015-04-24', validFrom: '2023-05-24', domain: 'seowoninfo.com', issuer: '발행기간' }
      ],
      certificationColumns: [
        { binding: 'certName', header: this.$v('인증서 명') },
        { binding: 'domain', header: this.$v('도메인') },
        { binding: 'validTo', header: this.$v('시작일') },
        { binding: 'validFrom', header: this.$v('만료일') },
        { binding: 'issuer', header: this.$v('발행 기관') }

      ],
      isOpenCertif: false,
      connectedCertifData: [],
      loading: {
        isGetMetaInfo: false,
        isUpdateMetaInfo: false
      },
      networkDetailTabs: [],
      metaInfoArr: [],

      columns: [
        { header: root.$v('긴급 처리 여부'), binding: 'isUrgent' },
        { header: this.$v('로드 밸런스명'), binding: 'lbName' },
        { header: this.$v('상태'), binding: 'state' },
        { header: this.$v('가상 IP'), binding: 'ip' },
        { header: this.$v('포트'), binding: 'port' },
        { header: this.$v('프로토콜'), binding: 'protocolType' },
        { header: this.$v('방식'), binding: 'method' },
        { header: this.$v('스위치 장비명'), binding: 'netName' },
        // { header: '작업완료일', binding: 'endDate' },
        // { header: '과금시작일', binding: 'chargeDate' }, 05.25 : 윤소팀장님과 합의 하에 주석처리 (방화벽, 스위치 모두 과금 시작일이 없음, 작업 완료일도 빼버림)
        { header: root.$v('설명'), binding: 'comment', colspan: true }
        // { header: '서비스', binding: 'service' }
      ],
      rowData: {},
      pData: [],

      l4: {
        detailInfo: null,
        serviceList: []
      },
      l7: {
        detailInfo: null,
        serviceList: [], // 서버 정보
        projectInfoList: [], // 프로젝트(포트) 정보
        policyInfoList: [] // 정책 정보
      },

      // 로드밸런스 4
      loadBalance4Columns: {

        projectColumns: [
          { binding: 'serviceName', header: this.$t('common.GRID.serviceName') },
          { binding: 'port', header: root.$v('포트'), customHtml: true },
          { binding: 'protocolType', header: root.$v('프로토콜') },
          { binding: 'serverName', header: root.$v('서버명'), customHtml: true }
        ],
        serverInfoColumns: [
          { binding: 'server.serverName', header: root.$v('서버명') },
          { binding: 'server.hostName', header: root.$v('호스트명') },
          { binding: 'server.ip', header: 'IP' },
          { binding: 'serviceName', header: root.$v('서비스명') },
          { binding: 'port', header: root.$v('포트') },
          { binding: 'protocolType', header: root.$v('프로토콜') }
        ]
      },

      // 로드밸런스 7
      loadBalance7Columns: {
        policyColumns: [
          { binding: 'policyName', header: root.$v('정책명') },
          { binding: 'expression', header: root.$v('패턴') },
          { binding: 'serviceName', header: root.$v('서비스명'), customHtml: true }
        ],
        // projectColumns: [
        //   { binding: 'serviceName', header: this.$t('common.GRID.serviceName') },
        //   { binding: 'port', header: root.$v('포트'), customHtml: true },
        //   { binding: 'protocolType', header: root.$v('프로토콜') },
        //   { binding: 'serverName', header: root.$v('서버명') }
        // ],
        serverInfoColumns: [
          { binding: 'server.serverName', header: root.$v('서버명') },
          { binding: 'server.hostName', header: root.$v('호스트명') },
          { binding: 'server.ip', header: 'IP' },
          { binding: 'serviceName', header: root.$v('서비스명'), customHtml: true },
          { binding: 'port', header: root.$v('포트') },
          { binding: 'protocolType', header: root.$v('프로토콜') }
        ]
      },
      swType: '',
      idx: ''
    }
  }
}
</script>
<style lang="scss" scoped>
.set-resource-switch-detail {
  .product-info {
    &:not(.-default){
      margin-top: 20px;
    }
  }

}
.header__certificate {
  display: flex;
  gap: 10px;
  .header__certificate__btn {

  }
}
.panel-title {
  position: absolute;
  font-size: 16px;
  margin-top: 10px;
}
.ssh-certif__text {
  color: #59A51D;
  margin-left: 10px;
}
.detail-tabs {
    margin-top: 60px;
}
.policy-tab {
  margin-top: 20px;
}
</style>
