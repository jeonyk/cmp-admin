<!--
  * 파일명 : SetResourceVmwareVsanIscsiDetail.vue
  * 파일 기능 : VMware > 구성관리 > 자원관리 > vSAN iSCSI 상세 확인 기능
  * License By Shinsegae I&C
 -->

<template>
  <div
    class="set-resource-vsan-detail"
    v-loading="loading.passUpdate"
  >
    <dashboard-panel
      class="detail-contents"
      :padding-top="0"
      :title="$v('자원 정보')"
    >
      <template #header>
        <div
          class="button-area -right"
          v-if="!(resourceData.deleteDate && resourceData.orderType === 'DELETE')"
        >
          <button
            v-if="!isUrgent"
            class="button"
            type="is-primary"
            :disabled="resourceData.status === 'PROGRESS' || !!resourceData.deleteDate"
            @click="e => {
              updatingData = resourceData
              modal.controlVg = true
            }"
          >
            {{ $v('변경') }}
          </button>
          <button
            v-if="!isUrgent"
            class="button"
            type="is-primary"
            :disabled="resourceData.status === 'PROGRESS' || !!resourceData.deleteDate"
            @click="e => {
              updatingData = null
              modal.passUpdate = true
            }"
          >
            {{ $v('삭제') }}
          </button>
          <span
            class="divider"
            v-if="!isUrgent && resourceData.deleteDate"
          />

          <!-- 바로 삭제/삭제 취소는 긴급 여부와 상관 없이 노출(23/05/16) -->
          <template v-if="resourceData.deleteDate">
            <button
              class="button"
              type="is-anti"
              :disabled="resourceData.status === 'PROGRESS'"
              @click="forceDelete"
            >
              {{ $v('바로 삭제') }}
            </button>

            <button
              v-if="canDelete"
              class="button"
              type="is-primary"
              :disabled="resourceData.status === 'PROGRESS'"
              @click="cancelDelete"
            >
              {{ $v('삭제 취소') }}
            </button>
            <el-tooltip
              v-else
              placement="top"
              effect="light"
              style="margin-left: 10px;"
            >
              <span
                slot="content"
                style="white-space: nowrap;"
              >
                {{ $v('삭제 중이거나 삭제 취소 불가능 자원입니다.') }}
                <br>
                <b>{{ $v('삭제 예정일') }} : {{ resourceData.deleteDateByDayjs }}</b>
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
        </div>
      </template>

      <vertical-table
        v-loading="!interval ? loading.isGetDetailData : false"
        :element-loading-text="loadingText"
        :columns="resourceInfoColumns"
        :data="resourceData"
        type="horizontal"
      >
        <template
          #deleteDate
          v-if="resourceData.deleteDate && isView"
        >
          <span>
            {{ deleteDate }}
          </span>
        </template>

        <template #isUrgent>
          {{ resourceData.isUrgent ? '긴급 자원' : '일반 자원' }}
        </template>

        <template #status>
          <template v-if="resourceData.status">
            <cmp-status-tag
              :type="{
                PROGRESS: 'is-loading',
                healthy: 'is-info'
              }[resourceData.status] || 'is-undefined'"
              :line-style="true"
              :style="{width: resourceData.status === 'PROGRESS' ? '75px' : '60px'}"
            >
              {{ {
                PROGRESS: 'Progress',
                healthy: '정상'
              }[resourceData.status] || '비정상' }}
            </cmp-status-tag>
          </template>
          <span v-else>-</span>
        </template>

        <span slot="cluster">{{ resourceData.clusterName || '-' }}</span>
        <!-- 클러스터 -->

        <span slot="iqn">{{ resourceData.iqn || '-' }}</span>
        <!-- IQN -->

        <span slot="alias">{{ resourceData.alias || '-' }}</span>
        <!-- 별칭 -->

        <span slot="networkCateInfo">{{ resourceData.networkCateInfo ? resourceData.networkCateInfo.cateKey : '-' }}</span>
        <!-- 네트워크 카테고리 -->

        <span slot="networkInterface">{{ resourceData.networkInterface ||'-' }}</span>
        <!-- 네트워크 -->

        <span slot="port">{{ resourceData.port ||'-' }}</span>
        <!-- TCP 포트 -->

        <span slot="authSpecAutoType">
          {{ authTypes[resourceData.authSpecAutoType] }}
          <ul
            class="auth-detail-list"
            v-if="resourceData.authSpecAutoType !== 'NONE'"
          >
            <li>
              <b>수신 CHAP 사용자 : </b>
              <span>{{ resourceData.authSpecUserNameAttachToTarget || '-' }}</span>
            </li>
            <!-- <li>
                <b>수신 CHAP 암호 : </b>

                <div
                  class="auth-password-wrap"
                  v-if="resourceData.authSpecUserSecretAttachToTarget"
                >
                  <span v-if="exposeTargetPassword">
                    {{ resourceData.authSpecUserSecretAttachToTarget }}
                  </span>
                  <span v-else>
                    {{ resourceData.authSpecUserSecretAttachToTarget | password }}
                  </span>
                  <i
                    class="mdi reveal-button"
                    :class="[exposeTargetPassword ? ' mdi-eye-off-outline' : 'mdi-eye-outline']"
                    size="is-small"
                    @click="exposeTargetPassword = !exposeTargetPassword"
                  />
                </div>
                <span v-else>-</span>
              </li> -->

            <li v-if="resourceData.authSpecAutoType === 'MUTUAL_CHAP'">
              <b>송신 CHAP 사용자 : </b>
              <span>{{ resourceData.authSpecUserNameAttachToInitiator || '-' }}</span>
            </li>
            <!-- <li v-if="resourceData.authentication === 'MUTUAL_CHAP'">
                <b>송신 CHAP 암호 : </b>

                <div
                  class="auth-password-wrap"
                  v-if="resourceData.authSpecUserSecretAttachToInitiator"
                >
                  <span v-if="exposeInitiatorPassword">
                    {{ resourceData.authSpecUserSecretAttachToInitiator }}
                  </span>
                  <span v-else>
                    {{ resourceData.authSpecUserSecretAttachToInitiator | password }}
                  </span>
                  <i
                    class="mdi reveal-button"
                    :class="[exposeInitiatorPassword ? ' mdi-eye-off-outline' : 'mdi-eye-outline']"
                    size="is-small"
                    @click="exposeInitiatorPassword = !exposeInitiatorPassword"
                  />
                </div>
                <span v-else>-</span>
              </li> -->
          </ul>
        </span>
        <!-- 인증 -->

        <template #lunList>
          <cmp-grid
            v-if="resourceData.lunList && resourceData.lunList.length"
            :columns="lunColumns"
            :item-source="resourceData.lunList"
            :use-column-filter="false"
          >
            <template #lunSize="{ row }">
              {{ row.lunSize | byte }}
            </template>
            <template #status="{ row }">
              {{ row.status === 'Online' ? '온라인' : '오프라인' }}
            </template>
          </cmp-grid>
          <span v-else>-</span>
        </template>
        <!-- LUN -->

        <template #initiatorList>
          <ul v-if="resourceData.initiatorList && resourceData.initiatorList.length">
            <li
              v-for="(initiator ,idx) in resourceData.initiatorList"
              :key="`initiator_${idx}`"
            >
              {{ initiator.initiator }}
            </li>
          </ul>
          <span v-else>-</span>
        </template>
        <!-- 이니시에이터 -->

        <template #manageGroup>
          <span v-if="resourceData.manageGroupName">{{ resourceData.manageGroupName }}</span>
          <span v-else>-</span>
        </template>
        <!-- 운영그룹 -->

        <template #createDate>
          <span v-if="resourceData.createDate">{{ resourceData.createDate | date }}</span>
          <span v-else>-</span>
        </template>
        <!-- 자원 생성일 -->

        <template #createAccount>
          <span v-if="resourceData.createUserId">
            {{ resourceData.createUserName }}&nbsp;
            ({{ resourceData.createUserId | maskingName }})
          </span>
          <span
            v-else
            class="empty-content"
          >-</span>
        </template>

        <template #updateAccount>
          <span v-if="resourceData.updateUserId">
            {{ resourceData.updateUserName }}&nbsp;
            ({{ resourceData.updateUserId | maskingName }})
          </span>
          <span
            v-else
            class="empty-content"
          >-</span>
        </template>

        <template #projectInfo>
          <span v-if="resourceData.companyName">{{ resourceData.companyName }}</span>
          <span v-if="resourceData.groupName">&nbsp;>&nbsp;{{ resourceData.groupName }}</span>
          <span v-if="resourceData.projectName">&nbsp;>&nbsp;{{ resourceData.projectName }}</span>
        </template>
        <!-- 프로젝트 위치 -->

        <template #projectOwnerInfo>
          <span class="account-name">
            {{ resourceData.projectOwnerInfo }}
          </span>
        </template>
        <!-- 프로젝트 소유자 -->

        <template #createTime>
          {{ resourceData.createTime | date }}
        </template>

        <template #updateTime>
          {{ resourceData.updateTime | date }}
        </template>

        <template #chargeDate>
          <span v-if="resourceData.chargeDate">{{ resourceData.chargeDate | date('YYYY.MM.DD HH:mm') }}</span>
          <span
            v-else
            class="empty-content"
          >-</span>
        </template>

        <template #serviceDate>
          <span v-if="resourceData.serviceDate">{{ resourceData.serviceDate | date('YYYY.MM.DD HH:mm') }}</span>
          <span
            v-else
            class="empty-content"
          >-</span>
        </template>

        <template #note>
          <div
            v-if="resourceData.note"
            style="white-space: pre-wrap;"
          >
            {{ resourceData.note }}
          </div>
          <span
            v-else
            class="empty-content"
          >-</span>
        </template>
        <template #tagInfo>
          <resource-tag-select-edit
            :data="resourceData"
            :read-only="false"
            service-type="VSAN_ISCSI"
            module="VMWARE"
            :project-idx="resourceData.projectIdx"
            resource-key="userIscsiIdx"
          />
        </template>
      </vertical-table>
    </dashboard-panel>
    <!-- 자원 정보 -->

    <dashboard-panel
      class="detail-contents"
      :padding-top="0"
      :title="$v('운영 정보')"
    >
      <meta-data-form
        v-loading="loading.isGetMetaInfo || loading.isUpdateMetaInfo"
        style="margin-top: -30px;"
        :form-data="metaInfoArr"
        use-update-btns
        read-only
        @save-info="saveMetaInfo"
        ref="metaDataFormRef"
      />
      <!-- :origin-form-data="iscsiMetadataForm" -->
    </dashboard-panel>
    <!-- 운영 정보 -->

    <!-- 모달 -->
    <!-- 자원 생성/수정 -->
    <el-dialog
      :visible.sync="modal.controlVg"
      :title="$v('자원 변경')"
      :before-close="beforeCloseModal"
      width="1200px"
      top="5vh"
      @close="modal.controlVg = false"
    >
      <vmware-iscsi-update-form
        v-if="modal.controlVg"
        @close="modal.controlVg = false"
        @save="confirmUpdate"
        :data="detailData"
        :project-idx="resourceData.projectIdx"
        :user-info="user"
        in-admin
      />
    </el-dialog>

    <!-- 자원 변경/삭제 -> 스토리지명 동일 입력 확인 모달 -->
    <el-dialog
      :visible.sync="modal.passUpdate"
      @close="modal.passUpdate = false"
      class="pass-name-form"
      v-loading="loading.delete || loading.update"
    >
      <span
        class="name-form-noti"
        v-html="`${resourceData.alias}을(를) ${updatingData ? '변경' : '삭제'}하시겠습니까?<br>별칭을 동일하게 입력해주세요.`"
      />

      <el-input
        v-model="checkAlias"
        placeholder="별칭을 입력해주세요."
        @keyup.native.enter="e => {
          if(
            resourceData.alias !== checkAlias
          ) return
          updatingData ? confirmUpdate() : confirmDelete()
        }"
      />
      <small
        class="-reference"
        v-if="!checkAlias"
      >*&nbsp;별칭을 입력해주세요.</small>

      <small
        class="-reference"
        v-else-if="resourceData.alias !== checkAlias"
      >*&nbsp;별칭이 올바르지 않습니다.</small>

      <div
        class="convert-urgent-form"
        v-if="!updatingData"
      >
        <toggle-is-urgent-checkbox
          v-model="deleteIsUrgent"
          :action-name="$v('자원 삭제')"
        />
      </div>

      <div class="modal-button-area">
        <button
          class="button -modal-button"
          type="is-anti"
          @click="modal.passUpdate = false"
        >
          {{ $v('취소') }}
        </button>
        <button
          class="button -modal-button"
          @click="updatingData ? confirmUpdate() : confirmDelete()"
          type="is-primary"
          :disabled="resourceData.alias !== checkAlias"
        >
          {{ updatingData ? $v('적용') : $v('삭제') }}
        </button>
      </div>
    </el-dialog>
  </div>
</template>
<script>
import axios from 'axios'
import { mapGetters, mapActions, mapState } from 'vuex'
import { isEmpty, cloneDeep } from 'lodash'
import API, { ResourceTagSelectEdit, VerticalTable, DashboardPanel, MetaDataForm, VMwareIscsiUpdateForm, ToggleIsUrgentCheckbox } from '@sd-fe/cmp-core'

import Dayjs from 'dayjs'

import SetResourceVmwareVsanIscsi from './SetResourceVmwareVsanIscsi.mixins.js'
export default {
  name: 'SetResourceVmwareVsanIscsiDetail',
  mixins: [SetResourceVmwareVsanIscsi],
  components: {
    ResourceTagSelectEdit,
    'vertical-table': VerticalTable,
    'dashboard-panel': DashboardPanel,
    'vmware-iscsi-update-form': VMwareIscsiUpdateForm,
    MetaDataForm,
    ToggleIsUrgentCheckbox
  },
  async created () {
    this.id = this.$route.params.idx
    this.cancelToken = axios.CancelToken.source()

    await this.getProjectByCloudType() // 프로젝트 조회

    await this.init()
  },
  computed: {
    ...mapState({
      user: state => state.auth.user,
      breadcrumbs: state => state.common.breadcrumbs,
      packageType: state => state.auth.packageType,
      iscsiMetadataForm: state => state.metadata.VMWARE.VSAN_ISCSI
    }),
    ...mapGetters({
      getProject: 'project/getProject'
    }),
    canDelete () {
      if (this.resourceData.deleteDate) {
        return this.resourceData.deleteDate && this.isBefore && this.isView
      } else {
        return false
      }
    },
    deleteDate () {
      if (this.resourceData.deleteDate) {
        return Dayjs(this.resourceData.deleteDate).format('YYYY.MM.DD')
      } else {
        return ''
      }
    },
    isUrgent () { // 긴급 자원 여부
      return !!this.resourceData.isUrgent
    }

  },
  watch: {
    'resourceData.status': {
      immediate: true,
      deep: true,
      handler (val) {
        const isLastBreadcrumbsHasStatus = Object.keys(this.breadcrumbs[this.breadcrumbs.length - 1]).includes('resourceStatus') // breadcrumbs 마지막 요소가 'resourceStatus' key를 가지고 있는지?

        if (isLastBreadcrumbsHasStatus) {
          this.$store.commit('common/MOD_LAST_PARAMETERS', {
            label: this.resourceData.alias,
            path: '',
            resourceStatus: {
              PROGRESS: 'PROGRESS',
              healthy: this.$v('정상')
            }[val] || this.$v('비정상')
          })
        }
      }
    },
    'modal.passUpdate' () {
      this.deleteIsUrgent = true
    }
  },
  beforeDestroy () {
    this.clearGetVgInterval()
    this.cancelToken.cancel()
  },
  methods: {
    ...mapActions({
      getProjectByCloudType: 'project/getProjectByCloudType'
    }),
    async init () {
      await Promise.all([
        this.getVsanIscsiDetail()
      ]).then(() => {
        this.getVgInterval()
        if (this.resourceData) {
          this.getMetaInfo()
          this.setDeleteDate()
        }
      }).catch((err) => {
        console.log(err)
        this.goToList()

        return false
      })
    },
    /**
     * deleteDate 세팅
     */
    setDeleteDate () {
      if (!this.resourceData?.deleteDate) return
      const today = Dayjs().format('YYYY.MM.DD')
      const delDate = Dayjs(this.resourceData.deleteDate).format('YYYY.MM.DD')
      this.isBefore = Dayjs(today).isBefore(delDate)
      this.isView = true

      if (this.resourceData?.deleteDate &&
      this.isBefore &&
      this.resourceInfoColumns[0].binding !== 'deleteDate') {
        this.resourceInfoColumns.unshift({ binding: 'deleteDate', header: this.$v('삭제 예정일'), colspan: true })
      }
    },
    /**
     * 호스트명을 Breadcrumbs에 추가합니다. (조건: Breadcrumbs 마지막 label 이 hostname과 다를 경우)
     */
    setBreadCrumbsHostName (data) {
      if (!data) return
      this.$store.commit('common/ADD_PARAMETERS', {
        label: data.resourceName,
        path: '',
        resourceStatus: {
          PROGRESS: 'Progress',
          healthy: this.$v('정상')
        }[data.vmStatus] || this.$v('비정상')
      })
    },
    /**
     * [바로 삭제]
     */
    forceDelete () {
      this.$confirm(this.$v('자원을 바로 삭제하시겠습니까?'))
        .then(async () => {
          const params = {
            userId: this.user.userId,
            userName: this.user.userName,
            indexType: 'userIscsiIdx',
            userResourceIdx: this.resourceData.userIscsiIdx
          }
          const result = await this.forceDeleteResource(params)
          if (result) this.goToList()
        }).catch(() => false)
    },
    /**
     * [삭제 취소]
     */
    cancelDelete () {
      this.$confirm(this.$v('삭제 예정인 자원입니다. 삭제를 취소하시겠습니까?'), { dangerouslyUseHTMLString: true })
        .then(async () => {
          const payload = {
            indexType: 'userIscsiIdx',
            userId: this.user.userId,
            userName: this.user.userName,
            userResourceIdx: this.id
          }
          const res = await API.work_v3.cancelDelete(payload)
          if (res) {
            this.$alert(this.$v('삭제 요청이 취소되었습니다.'))
            this.resourceInfoColumns.shift()
            this.isView = false
          }

          this.init()
        }).catch(() => false)
    },
    async getVsanIscsiDetail () {
      try {
        this.loading.isGetDetailData = true
        const data = await API.vmware.vsan.getVsanIscsiDetail(this.id, this.cancelToken)

        if (!data) throw new Error()

        const isLastBreadcrumbsHasStatus = Object.keys(this.breadcrumbs[this.breadcrumbs.length - 1]).includes('resourceStatus') // breadcrumbs 마지막 요소가 'resourceStatus' key를 가지고 있는지?
        if (!isLastBreadcrumbsHasStatus) this.setBreadCrumbsHostName(data)

        this.resourceData = await this.settingResourceData(data)
        this.detailData = data
      } catch (error) {
        throw new Error(error)
      } finally {
        this.loading.isGetDetailData = false
      }
    },
    /**
     * 메타 폼 조회 및 데이터 세팅
     */
    async getMetaInfo (data = this.resourceData) {
      try {
        this.loading.isUpdateMetaInfo = true
        // 메타데이터 동기화 -> 메타데이터 편집 중이 아닐 때만
        if (this.isMetaDataFormEditing()) return

        const meta = this.resourceData?.userIscsiIdx
          ? await this.getVmwareVsanIscsiMetaInfo()
          : (data?.userInfo?.metaInfo ? JSON.parse(data?.userInfo.metaInfo) : null)
        this.detailData.metaInfo = meta ? JSON.stringify(meta) : ''
        this.metaInfoArr = await this.settingMetaDataArr(meta)
      } catch (error) {
        console.error(error)
      } finally {
        this.loading.isUpdateMetaInfo = false
      }
    },

    // 자원정보 세팅
    // 현재 저장된 메타데이터 폼 형식 + 자원 메타정보를 조합
    async  settingResourceData (iscsiInfo) {
      if (!iscsiInfo) return
      const {
        userInfo,
        authSpecAutoType,
        vsanHealth,
        isUrgent,
        ...rest
      } = iscsiInfo

      // const meta = userInfo?.metaInfo ? JSON.parse(userInfo.metaInfo) : null

      const status = ['START', 'RUNNING'].includes(userInfo?.status) ? 'PROGRESS' : vsanHealth // VM 상태

      // 프로젝트 정보
      let projectInfo
      if (userInfo?.projectIdx) {
        const findProject = await API.iam.getProject({ projectIdx: userInfo.projectIdx })
        if (findProject?.length) projectInfo = findProject[0]
      }

      // 계정 정보
      let createUserName, updateUserName
      if (userInfo?.createUserId) createUserName = await this.getUserName(userInfo.createUserId)
      if (userInfo?.updateUserId) updateUserName = await this.getUserName(userInfo.updateUserId)

      // console.log('🔮 userInfo: ', userInfo)
      // console.log('🔮 meta: ', meta)
      // console.log('🔮 projectInfo: ', projectInfo)

      // 네트워크 카테고리
      let networkCateInfo
      if (userInfo?.cateIdx) {
        const findCateInfo = await API.network.getNetworkCategory({ idxList: userInfo.cateIdx })
        if (findCateInfo?.length) networkCateInfo = findCateInfo[0]
      }

      // 운영정보
      let manageGroupName
      if (userInfo?.manageGroupIdx) {
        const { data: findManageGorupInfo } = await API.billing.getOperationGroup({
          moduleType: 'VMWARE',
          operatingGroupIdx: userInfo.manageGroupIdx
        })
        if (findManageGorupInfo?.length) manageGroupName = findManageGorupInfo[0].operatingGroupName
      }

      const settingData = {
        ...rest,
        authSpecAutoType: {
          NoAuth: 'NONE',
          CHAP_Mutual: 'MUTUAL_CHAP'
        }[authSpecAutoType] || authSpecAutoType,
        companyName: projectInfo?.companyName,
        companyIdx: projectInfo?.companyIdx,
        groupName: projectInfo?.groupName,
        groupIdx: projectInfo?.groupIdx,
        projectName: projectInfo?.projectName,
        projectIdx: projectInfo?.projectIdx,
        status,
        isUrgent: isUrgent || userInfo?.isUrgent,
        userIscsiIdx: this.id,
        manageGroupName,
        manageGroupIdx: userInfo?.manageGroupIdx,

        projectOwnerInfo: projectInfo?.projectOwner?.userName && projectInfo.projectOwner?.userId ? `${projectInfo.projectOwner?.userName} (${this.$options.filters.maskingName(projectInfo.projectOwner?.userId)})` : '', // 프로젝트 소유자
        createUserId: userInfo?.createUserId,
        updateUserId: userInfo?.updateUserId,
        createUserName,
        updateUserName,
        createTime: userInfo?.createTime,
        updateTime: userInfo?.updateTime,
        chargeDate: userInfo?.chargeDate,
        deleteDate: userInfo?.deleteDate,
        networkCateInfo,
        beforeData: cloneDeep(iscsiInfo)
      }

      return settingData
    },

    /**
     * userId로 유저 정보를 조회합니다. (사용자 > 관리자)
     */
    async getUserName (userId) {
      try {
        const infoUser = await API.iam.getUserInfo({ isAdmin: false, userId })
        if (infoUser.length) return infoUser[0].userName
        else {
          const infoAdmin = await API.iam.getUserInfo({ isAdmin: true, userId })
          if (infoAdmin?.length) return infoAdmin[0].userName
        }
      } catch (error) {
        console.error('사용자 조회에 문제가 발생했습니다: ', error)
      }
    },
    /**
     * VM 수정 시, '저장'
     */
    confirmUpdate (saveData = this.resourceData) {
      const message = this.$v('자원을 수정하시겠습니까?')

      const {
        beforePrice,
        isUrgent,
        price,
        ...rest
      } = saveData

      const payload = {
        beforePrice,
        groupIdx: saveData?.groupIdx,
        groupName: saveData?.groupName,
        projectIdx: saveData?.projectIdx,
        isUrgent: !!isUrgent, // 긴급 여부(긴급 = true, 일반 = false)
        price,
        requestData: rest, // 기존 orderData
        service: 'VSAN_ISCSI',
        userId: this.user.userId,
        userName: this.user.userName
      }

      this.$confirm(message).then(async () => {
        const result = await this.updateVsanIscsi(payload)
        if (result) this.modal.controlVg = false
      }).catch(() => false)
    },
    /**
     * VM '삭제' -> API 찌르기 전 데이터 가공
     */
    async confirmDelete (data = this.resourceData) {
      const {
        groupIdx,
        groupName,
        projectIdx,
        userIscsiIdx
      } = data

      const requestData = {
        isUrgent: !!this.deleteIsUrgent,
        reqUserId: this.user.userId,
        userIscsiIdx
      }

      const payload = {
        beforePrice: data?.beforePrice || 0,
        groupIdx,
        groupName,
        isUrgent: !!this.deleteIsUrgent,
        price: data?.price || 0,
        projectIdx,
        requestData,
        service: 'VSAN_ISCSI',
        userId: this.user.userId,
        userName: this.user.userName
      }

      await this.deleteVsanIscsi(payload) // VM 삭제

      this.modal.passUpdate = false
    },

    // 메타데이터 정보 세팅
    settingMetaDataArr (data) {
      const metaData = (this.iscsiMetadataForm || []).map(meta => {
        const info = data && data[meta.key]
          ? data[meta.key]
          : ''
        return {
          ...meta,
          data: info || meta.data
        }
      })
      if (this.resourceData.tags) metaData.push({ title: '자원 태그', key: 'tags', data: this.resourceData.tags })
      return metaData
    },
    /**
   * API: 메타 정보를 조회 합니다. (기생성 자원의 경우)
   */
    async getVmwareVsanIscsiMetaInfo () {
      try {
        this.loading.isGetMetaInfo = true

        const payload = {
          userIscsiIdx: this.resourceData.userIscsiIdx
        }

        return await API.vmware.vsan.getVmwareVsanIscsiMetaInfo(payload)
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
          resourceIdx: this.id
        }

        const result = await API.vmware.vsan.updateVmwareVsanIscsiMetaInfo(payload)

        if (result) {
          this.init()
          this.$alert(this.$v('운영 정보 업데이트를 성공했습니다.'), () => false)
        }
      } catch (error) {
        console.error(error)
        this.$alert(this.$v('운영 정보 업데이트를 실패했습니다.'), () => false)
      } finally {
        this.loading.isUpdateMetaInfo = false
      }
    },

    gridRefresh (grid = this.grid) {
      if (!grid) return
      const cv = grid.collectionView
      if (!cv) return
      cv.refresh()
    },

    routeTo (to) {
      this.$router.push(to)
    },
    alert (message, callback) {
      this.$alert(message, '알림', {
        callback: callback,
        dangerouslyUseHTMLString: true
      })
    },
    isEmpty (value) {
      return isEmpty(value)
    },
    goToList () {
      this.cancelToken.cancel()
      this.clearGetVgInterval()
      this.stopInterval = true // interval stop flag
      return this.routeTo({ name: 'vmware-storage-vsan-iscsi-list' })
    },
    // 메타데이터 폼 업데이트 중인지?
    isMetaDataFormEditing () {
      const ref = this.$refs?.metaDataFormRef

      return ref?.activeEdit
    }
  },
  data (root) {
    return {
      detailTabs: [
        { field: 'manage', name: root.$v('운영 정보'), active: true }
      ],
      cancelToken: null, // axios cancel 토큰
      isBefore: false,
      isView: true,
      deleteIsUrgent: true, // 삭제 > 긴급 여부
      loadingText: '', // 로딩 시, 노출 텍스트 (생성 시 표기를 위함)
      resourceData: {},
      detailData: {}, // 오리지널 상세 데이터
      metaInfoArr: [],
      loading: {
        isGetDetailData: false,
        passUpdate: false,
        isGetMetaInfo: false,
        isUpdateMetaInfo: false // 운영 정보 업데이트
      },
      id: null,
      updatingData: null, // 업데이트 할 vm정보 (create일 때 null)
      resourceInfoColumns: [
        { binding: 'isUrgent', header: root.$v('긴급 처리 여부') },
        { binding: 'cluster', header: root.$v('클러스터 명') },
        { binding: 'iqn', header: 'IQN' },
        { binding: 'alias', header: root.$v('별칭') },
        { binding: 'status', header: root.$v('상태') },
        { binding: 'networkCateInfo', header: root.$v('네트워크 카테고리') },
        { binding: 'networkInterface', header: root.$v('네트워크 장비') },
        { binding: 'ioOwnerHostname', header: root.$v('I/O 소유자 호스트') },
        { binding: 'port', header: root.$v('TCP 포트') },
        { binding: 'spbmProfileName', header: root.$v('스토리지 정책') },
        { binding: 'authSpecAutoType', header: root.$v('인증') },
        { binding: 'lunList', header: 'LUN' },
        { binding: 'initiatorList', header: root.$v('허용 이니시에이터') },
        { binding: 'manageGroup', header: root.$v('운영그룹') },
        { binding: 'projectInfo', header: root.$v('프로젝트 위치') },
        { binding: 'projectOwnerInfo', header: root.$v('프로젝트 소유자') },
        { binding: 'createAccount', header: root.$v('자원 생성 계정') },
        { binding: 'updateAccount', header: root.$v('마지막 수정 계정') },
        { binding: 'createTime', header: root.$v('자원 생성일') },
        { binding: 'updateTime', header: root.$v('최근 수정일') },
        { binding: 'chargeDate', header: root.$v('과금 시작일'), colspan: true },
        { binding: 'tagInfo', header: this.$v('자원 태그'), colspan: true }
      ],

      rowData: {},

      modal: {
        controlVg: false,
        passUpdate: false // 삭제 시, 호스트명 확인 모달
      },

      checkAlias: '', // 변경/삭제 > 별칭 확인 시, 입력한 별칭

      lunColumns: [
        { binding: 'lunId', header: 'ID', width: 60 },
        { binding: 'alias', header: root.$v('별칭'), width: 100 },
        { binding: 'lunSize', header: root.$v('용량'), customHtml: true, width: 80 },
        { binding: 'status', header: root.$v('상태'), customHtml: true, width: 80 },
        { binding: 'spbmProfileName', header: root.$v('스토리지 정책'), customHtml: true }
      ]

      // exposeTargetPassword: false, // 수신 암호 텍스트 노출 여부
      // exposeInitiatorPassword: false // 송신 암호 텍스트 노출 여부
    }
  }
}
</script>
<style lang="scss" scoped>
  .set-resource-vsan-detail {
    position: relative;
    > .button-area {
      position: absolute;
      top: 12px;
      right: 0;
      z-index: 1;
    }
    .detail-contents {
      & + .detail-contents {
        margin-top: $gap;
      }
    }
  }

  .auth-detail-list {
    display: flex;
    flex-direction: column;
    gap: $gap-s;
    margin-top: $gap-s;
    padding: $gap;
    background-color: #070a20;
    border-radius: $radius;
    > li {
      display: flex;
      align-items: center;
      > b {
        display: block;
        min-width: 150px;
        font-weight: normal;
      }
    }
    .auth-password-wrap {
      display: flex;
      align-items: center;
      gap: $gap;
      width: 100%;
    }
    // .reveal-button {
    //   display: flex;
    //   align-items: center;
    //   height: 20px;
    //   cursor: pointer;
    //   color: $main-red;
    // }
  }

  .detail-tabs {
    margin-top: 60px;
  }

  .empty-content { color: $input-placeholder; }
</style>
