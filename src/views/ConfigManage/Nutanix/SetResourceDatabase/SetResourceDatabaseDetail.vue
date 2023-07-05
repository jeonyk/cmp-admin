<!--
  * 파일명 : SetResourceDatabaseDetail.vue
  * 파일 기능 : 구성관리 > 자원관리 > Database 상세 정보 확인 기능
  * 작성자 : 김예담 외 2명
  * License By Shinsegae I&C
 -->

<template>
  <div
    class="set-resource-database-detail"
    v-loading="loading.deleteDb"
  >
    <dashboard-panel
      :padding-top="0"
      :title="$v('자원 정보')"
      class="detail-contents"
    >
      <template #header>
        <div
          class="button-area -right"
          v-if="rowData.databaseName && !(rowData.deleteDate && rowData.orderType === 'DELETE')"
        >
          <button
            v-if="!isUrgent && !rowData.deleteDate"
            class="button"
            type="is-primary"
            @click="modal.deleteDB = true"
            :disabled="rowData.status === 'START'"
          >
            {{ $t('삭제') }}
          </button>

          <span
            class="divider"
            v-if="!isUrgent && !rowData.deleteDate"
          />

          <!-- 바로 삭제/삭제 취소는 긴급 여부와 상관 없이 노출(23/05/16) -->
          <template v-if="rowData.deleteDate">
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
              @click="cancelDelete"
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
                <b>{{ $v('삭제 예정일') }} : {{ rowData.deleteDateByDayjs }}</b>
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

      <!-- v-loading="isGetVmRequest" -->
      <vertical-table
        :columns="resourceInfoColumns"
        :data="rowData"
        type="horizontal"
      >
        <template
          #deleteDate
          v-if="rowData.deleteDate && isView"
        >
          <span>
            {{ deleteDate }}
          </span>
        </template>

        <template #vcpu>
          <span>{{ rowData.vcpu }} Core</span>
        </template>

        <template #memory>
          <span>{{ rowData.memory | byte }}</span>
        </template>

        <template #osName>
          <span>
            <set-os-icon :os-name="rowData.osName" />
          </span>
          <!-- <span>{{ rowData.memory | byte }}</span> -->
        </template>

        <template #dbSize>
          <span>{{ rowData.dbSize | byte }}</span>
        </template>

        <template #dbUsage>
          <span>{{ rowData.dbUsage | byte }}</span>
        </template>

        <template #networkList>
          <span v-if="rowData.networkList && rowData.networkList.length > 0">
            <div
              v-for="(net, netIdx) in rowData.networkList"
              :key="netIdx"
            >
              {{ net.cateKey }}
            </div>
          </span>
          <span v-else-if="rowData.nics && rowData.nics.length > 0">
            <div
              v-for="(net, netIdx) in rowData.nics"
              :key="netIdx"
            >
              {{ net.cateKey }}
            </div>
          </span>
          <span
            v-else
            class="empty-content"
          >-</span>
        </template>

        <template #installProgramList>
          <el-tag
            v-for="(pkg,pkgIdx) in rowData.installProgramList"
            :key="pkgIdx"
          >
            {{ pkg.softwareName }}&nbsp;{{ pkg.versionName }}
          </el-tag>
        </template>

        <template #licenseList>
          <div class="license-list-wrap">
            <register-contents
              :title="$v('자산')"
              :title-width-px="100"
            >
              <ul
                class="flex-wrap license-list"
                v-if="licenseList.isAssets.length"
              >
                <li
                  v-for="sw in licenseList.isAssets"
                  :key="`swLicense_${sw.swIdx}`"
                >
                  {{ sw.name }}
                </li>
              </ul>
              <span
                v-else
                class="empty-content"
              >-</span>
            </register-contents>
            <register-contents
              :title="$v('비자산')"
              :title-width-px="100"
            >
              <ul
                class="flex-wrap license-list"
                v-if="licenseList.notAssets.length"
              >
                <li
                  v-for="sw in licenseList.notAssets"
                  :key="`swLicense_${sw.swIdx}`"
                >
                  {{ sw.name }}
                </li>
              </ul>
              <span
                v-else
                class="empty-content"
              >-</span>
            </register-contents>
          </div>
        </template>

        <template #projectInfo>
          <span v-if="rowData.companyName">{{ rowData.companyName }}</span>
          <span v-if="rowData.groupName">&nbsp;>&nbsp;{{ rowData.groupName }}</span>
          <span v-if="rowData.projectName">&nbsp;>&nbsp;{{ rowData.projectName }}</span>
        </template>
        <!-- 프로젝트 위치 -->

        <template #chargeDate>
          <span>{{ rowData.chargeDate | date }}</span>
        </template>
        <!-- 과금 시작일 -->

        <template #serviceDate>
          <span>{{ rowData.serviceDate | date }}</span>
        </template>
        <!-- 서비스 개시일 -->
        <template #tagInfo>
          <resource-tag-select-edit
            :data="rowData"
            :read-only="false"
            service-type="DATABASE"
            module="NUTANIX"
            :project-idx="rowData.projectIdx"
            resource-key="userDbIdx"
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
    </dashboard-panel>
    <!-- 운영 정보 -->

    <!-- DB 업데이트 -->
    <el-dialog
      :visible.sync="modal.controlDB"
      :title="$v('자원 변경')"
      width="1300px"
      top="5vh"
      @close="modal.controlDB = false"
    >
      <nx-compute-update-form
        v-if="modal.controlVm"
        v-loading="loading.updateVm"
        :data="originDbDetail"
        :project-idx="originDbDetail
          ? originDbDetail.projectIdx
          : undefined"
        :user-info="user"
        @close="modal.controlVm = false"
        @save="confirmUpdate"
        in-admin
      />
    </el-dialog>

    <!-- 자원 삭제 -> 호스명 동일 입력 확인 모달 -->
    <el-dialog
      :visible.sync="modal.deleteDB"
      width="350px"
      @close="modal.deleteDB = false"
      class="pass-name-form"
      v-loading="loading.deleteDB"
    >
      <span
        class="name-form-noti"
        v-html="$v('<b>{databaseName}</b>을 삭제하시겠습니까?<br>DB 서버 {hostname}가 함께 삭제됩니다.<br><br>DB 명을 동일하게 입력해주세요.', {
          databaseName: rowData.databaseName,
          hostname: rowData.hostname
        })"
      />

      <el-input
        v-model="checkDatabaseName"
        :placeholder="$v('DB 명을 입력하세요.')"
        @keyup.native.enter="e => {
          if(originDbDetail.databaseName !== checkDatabaseName) return
          confirmDelete()
        }"
      />
      <small
        class="-reference"
        v-if="!checkDatabaseName"
      >*&nbsp;{{ $v('DB 명을 입력하세요.') }}</small>

      <small
        class="-reference"
        v-else-if="originDbDetail.databaseName !== checkDatabaseName"
      >*&nbsp;{{ $v('DB 명이 올바르지 않습니다.') }}</small>

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
          @click="modal.deleteDB = false"
        >
          {{ $v('취소') }}
        </button>
        <button
          class="button -modal-button"
          @click="confirmDelete()"
          type="is-primary"
          :disabled="originDbDetail.hostname !== checkDatabaseName"
        >
          {{ $v('삭제') }}
        </button>
      </div>
    </el-dialog>
  </div>
</template>
<script>
import API, { ResourceTagSelectEdit, VerticalTable, DashboardPanel, SetOSIcon, ToggleIsUrgentCheckbox } from '@sd-fe/cmp-core'
import SetResourceDatabaseMixins from './SetResourceDatabase.mixins.js'
import Dayjs from 'dayjs'
import { mapGetters, mapState } from 'vuex'
import { isEmpty } from 'lodash'

export default {
  name: 'SetResourceDatabaseDetail',
  mixins: [SetResourceDatabaseMixins],
  components: {
    ResourceTagSelectEdit,
    VerticalTable,
    'dashboard-panel': DashboardPanel,
    'set-os-icon': SetOSIcon,
    ToggleIsUrgentCheckbox
  },
  watch: {
    'rowData.status': {
      immediate: true,
      deep: true,
      handler (val) {
        if (!val) return

        this.setBreadCrumbsDatabaseName()
      }
    },
    'modal.deleteDB' (val) {
      if (val) this.deleteIsUrgent = true
    }
  },
  async created () {
    this.databaseIdx = this.$route.params.databaseIdx
    await this.init()
  },
  beforeDestroy () {
    this.clearGetDbInterval()
  },
  computed: {
    ...mapState({
      breadcrumbs: state => state.common.breadcrumbs,
      databaseMetadataForm: state => state.metadata.NUTANIX.DATABASE
    }),
    ...mapGetters(['user']),
    canDelete () {
      if (this.rowData.deleteDate) {
        return this.rowData.deleteDate && this.isBefore && this.isView
      } else {
        return false
      }
    },
    deleteDate () {
      if (this.rowData.deleteDate) {
        return Dayjs(this.rowData.deleteDate).format('YYYY.MM.DD')
      } else {
        return ''
      }
    },
    isUrgent () { // 긴급 자원 여부
      return !!this.originDbDetail.isUrgent
    }
  },
  methods: {
    async init () {
      await Promise.all([
        this.getDatabase()
      ]).then(() => {
        this.getDbInterval()
        this.getMetaInfo()
        if (this.rowData) {
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
      if (!this.rowData?.deleteDate) return
      const today = Dayjs().format('YYYY.MM.DD')
      const delDate = Dayjs(this.rowData.deleteDate).format('YYYY.MM.DD')
      this.isBefore = Dayjs(today).isBefore(delDate)
      this.isView = true

      if (this.rowData?.deleteDate &&
      this.isBefore &&
      this.resourceInfoColumns[0].binding !== 'deleteDate'
      ) {
        this.resourceInfoColumns.unshift({ binding: 'deleteDate', header: this.$v('삭제 예정일'), colspan: true })
      }
    },
    async getDatabase () {
      try {
        this.loading.getDatabaseDetail = true

        const response = await API.database.getDatabase(this.databaseIdx)

        if (!response) throw new Error()
        // console.log('@@ getDatabase : ', result)

        this.originDbDetail = response

        this.rowData = await this.setDetailData(response)

        this.setBreadCrumbsDatabaseName()
      } catch (error) {
        throw new Error(error)
      } finally {
        this.loading.getDatabaseDetail = false
      }
    },
    async setDetailData (data) { // 자원정보 세팅
      console.log('상세 데이터: ', data)
      const {
        reqInfo,
        eraDbServerInfo,
        eraDbInfo,
        deleteDate
      } = data

      const rowData = {
        ...data,
        vcpu: eraDbServerInfo.numVcpu * eraDbServerInfo.numCorePerVcpu,
        memory: eraDbServerInfo.memoryByte,
        version: eraDbInfo.engineVersion,
        osName: reqInfo.osName,
        osVersion: reqInfo.osVersion,
        osPlatform: reqInfo.osPlatform,
        dbSize: eraDbInfo.dbSizeByte,
        initialDbName: eraDbInfo.initialDbName,
        dbId: eraDbInfo.databaseUser,
        dbUsage: eraDbInfo.dbUsageByte,
        homePath: eraDbServerInfo.homePath,
        installProgramList: reqInfo?.installProgramList || null,
        dbStatus: eraDbInfo?.databaseStatus,
        deleteDateByDayjs: deleteDate ? Dayjs(deleteDate).format('YYYY.MM.DD') : undefined
      }

      // 추가 정보 세팅
      // 프로젝트 정보
      let projectInfo
      if (data?.projectIdx) {
        const findProject = await API.iam.getProject({ projectIdx: data.projectIdx })
        projectInfo = findProject[0]
      }
      rowData.companyName = projectInfo?.companyName
      rowData.groupName = projectInfo?.groupName
      rowData.groupIdx = projectInfo?.groupIdx
      rowData.projectName = projectInfo?.projectName
      rowData.projectIdx = projectInfo?.projectIdx

      // S/W 라이선스
      if (data?.licenseList) {
        const swIdxList = data?.licenseList.map(item => item.swIdx)
        const swList = await API.metering.getSWLicense() || []

        const licenseList = swList.filter(sw => swIdxList.includes(sw.swIdx))

        rowData.licenseList = licenseList

        // 자산/비자산 구분
        this.licenseList.isAssets = licenseList.filter(license => !!license.isAssets)
        this.licenseList.notAssets = licenseList.filter(license => !license.isAssets)
      }

      // 네트워크 카테고리
      if (reqInfo?.networkList?.length) {
        const reqNetworkList = reqInfo.networkList
        const idxList = []
        for (let i = 0; i < reqNetworkList.length; i++) {
          if (reqNetworkList[i].cateIdx || reqNetworkList[i].cateId) {
            idxList.push(reqNetworkList[i].cateIdx || reqNetworkList[i].cateId)
          }
        }
        if (idxList?.length) {
          const networkList = await API.network.getNetworkCategory({ idxList: idxList.join(',') })
          const net = []
          if (networkList) {
            for (let i = 0; i < networkList.length; i++) {
              const cateInfo = networkList[i]
              cateInfo.cateIdx = cateInfo.cateIdx || cateInfo.cateId || cateInfo.ipCategoryIdx
              cateInfo.cateName = cateInfo.cateName || cateInfo.codeValue
              for (let j = 0; j < reqNetworkList.length; j++) {
                if (cateInfo.cateIdx === (reqNetworkList[j].cateIdx || reqNetworkList[j].cateId)) {
                  net.push({
                    ...reqNetworkList[j],
                    cateId: cateInfo.cateIdx,
                    cateKey: cateInfo.cateKey,
                    cateName: cateInfo.cateName,
                    cateCode: cateInfo.cateCode,
                    nicIp: cateInfo.nicIp
                  })
                  break
                }
              }
            }
          }
          rowData.networkList = net
        }
      }

      return rowData
    },
    /**
     * databaseName을 Breadcrumbs에 추가합니다.
     */
    setBreadCrumbsDatabaseName () {
      if (isEmpty(this.rowData)) return

      const isLastBreadcrumbs = Object.keys(this.breadcrumbs[this.breadcrumbs.length - 1]).includes('isLast') // breadcrumbs 마지막 요소가 'isLast' key를 가지고 있는지?

      if (isLastBreadcrumbs) return

      this.$store.commit('common/ADD_PARAMETERS', {
        label: this.rowData.databaseName,
        path: '',
        resourceStatus: this.rowData.status === 'START'
          ? 'PROGRESS'
          : '',
        isLast: true
      })
    },
    /**
     * 메타 폼 조회 및 데이터 세팅
     */
    async getMetaInfo (data = this.rowData) {
      try {
        this.loading.isUpdateMetaInfo = true
        // 메타데이터 동기화 -> 메타데이터 편집 중이 아닐 때만
        if (this.isMetaDataFormEditing()) return

        const meta = this.rowData?.userDbIdx
          ? await this.getNxResourceMetaInfo()
          : (data?.metaInfo ? JSON.parse(data.metaInfo) : null)
        this.metaInfoArr = await this.settingMetaDataArr(meta)
      } catch (error) {
        console.error(error)
      } finally {
        this.loading.isUpdateMetaInfo = false
      }
    },
    /**
     * [바로 삭제]
     */
    forceDelete () {
      this.$confirm(this.$v('자원을 바로 삭제하시겠습니까?'))
        .then(async () => {
          const params = {
            indexType: 'userDbIdx',
            userResourceIdx: this.rowData.userDbIdx,
            userId: this.user.userId,
            userName: this.user.userName
          }
          const result = await this.forceDeleteResource(params)
          if (result) this.goToList()
        }).catch(() => false)
    },
    /**
     * [삭제 취소]
     */
    cancelDelete () {
      this.$confirm(this.$v('삭제 예정인 자원입니다. 삭제를 취소하시겠습니까?'))
        .then(async () => {
          const params = {
            indexType: 'userDbIdx',
            userResourceIdx: this.rowData.userDbIdx,
            userId: this.user.userId,
            userName: this.user.userName
          }

          const res = await API.work_v3.cancelDelete(params)
          if (res) {
            this.$alert(this.$v('삭제 요청이 취소되었습니다.'), () => false)
            this.resourceInfoColumns.shift()
            this.isView = false
          }

          this.init()
        }).catch(() => false)
    },

    /**
     * DB 수정 시, '저장'
     */
    confirmUpdate (saveData) {
      const {
        beforePrice,
        isUrgent,
        price
      } = saveData

      const payload = {
        beforePrice,
        groupIdx: saveData.groupId,
        groupName: saveData.groupName,
        isUrgent: !!isUrgent, // 긴급 여부(긴급 = true, 일반 = false)
        price,
        projectIdx: saveData.projectId,
        requestData: saveData,
        service: 'DATABASE',
        userId: this.user.userId,
        userName: this.user.userName
      }

      this.$confirm(this.$v('자원을 수정하시겠습니까?')).then(async () => {
        const result = await this.updateDb(payload.requestData.userDbIdx, payload)
        if (result) {
          this.modal.controlDB = false
        }
      }).catch(() => false)
    },
    /**
     * VM '삭제' -> API 찌르기 전 데이터 가공
     */
    async confirmDelete (data = this.rowData) {
      const {
        hostname,
        userDbIdx,
        orderNo, // DB 자원일 때, 필수값

        groupIdx,
        groupName,
        projectIdx,
        beforePrice,
        price
      } = data

      const requestData = {
        userDbIdx,
        orderNo,
        hostname
      }

      const payload = {
        beforePrice: beforePrice || 0,
        groupIdx,
        groupName,
        projectIdx,
        isUrgent: !!this.deleteIsUrgent,
        price: price || 0,
        service: 'DATABASE',
        userId: this.user.userId,
        userName: this.user.userName,
        requestData
      }

      await this.deleteDb(userDbIdx, payload) // DB 자원 삭제

      this.modal.deleteDB = false
    },
    goToList () {
      this.cancelToken.cancel()
      this.clearGetDbInterval()
      return this.routeTo({ name: 'set-resource-database' })
    },

    // 메타데이터 정보 세팅
    settingMetaDataArr (data = {}) {
      try {
        const metaData = (this.databaseMetadataForm || []).map(meta => {
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
    /**
   * API: 메타 정보를 조회 합니다. (기생성 자원의 경우)
   */
    async getNxResourceMetaInfo () {
      try {
        this.loading.isGetMetaInfo = true

        const payload = {
          resourceType: 'DATABASE',
          resourceId: this.rowData.userDbIdx
        }

        return await API.compute.getNxResourceMetaInfo(payload)
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
          userMetaInfo: JSON.stringify(params),
          resourceType: 'DATABASE',
          resourceId: this.rowData?.userDbIdx
        }

        const result = await API.compute.updateNxResourceMetaInfo(payload)

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
    // 메타데이터 폼 업데이트 중인지?
    isMetaDataFormEditing () {
      const ref = this.$refs?.metaDataFormRef

      return ref?.activeEdit
    }
  },
  data (root) {
    return {
      rowData: {},
      metaInfoArr: [],
      databaseIdx: '',
      originDbDetail: { // DB 상세 조회 > 조회되는 오리지널 데이터
        deleteDate: null
      },
      deleteIsUrgent: true, // 삭제 > 긴급 여부
      isBefore: false,
      isView: true,
      checkDatabaseName: '', // 삭제 시, 입력하는 DB 명의 값
      licenseList: { // 라이선스 (자산/비자산)
        isAssets: [],
        notAssets: []
      },
      resourceInfoColumns: [
        { header: root.$v('긴급 처리 여부'), binding: 'isUrgent' },
        { header: root.$v('DB 명'), binding: 'databaseName' },
        { header: root.$v('상태'), binding: 'dbStatus' },
        { header: root.$v('호스트 명'), binding: 'eraDbServerInfo.dbserverName' },
        { header: 'vCPUs', binding: 'vcpu' },
        { header: 'Memory', binding: 'memory' },
        { header: 'DB Size', binding: 'dbSize' },
        { header: 'Node Type', binding: 'eraDbInfo.nodeType' },
        { header: 'ENGINE', binding: 'eraDbInfo.engineType' },
        { header: 'Version', binding: 'version' },
        { header: 'OS Name', binding: 'osName', customHtml: true },
        { header: 'OS Version', binding: 'osVersion' },
        { header: 'OS Bit', binding: 'osPlatform' },
        { header: 'Port', binding: 'eraDbInfo.listenPort' },
        { header: root.$v('DB 초기 스키마명'), binding: 'initialDbName' },
        { header: `DB ${root.$v('계정 ID')}`, binding: 'dbId' },
        // { header: '계정 비밀번호', binding: 'dbPassword' },
        { header: root.$v('네트워크 카테고리'), binding: 'networkList' },
        { header: 'IP', binding: 'eraDbServerInfo.dbserverIp' },
        { header: '사용량', binding: 'dbUsage', keyPath: 'main.DASHBOARD.usage' },
        { header: 'Home Path', binding: 'homePath' },
        { header: root.$v('설치프로그램'), binding: 'installProgramList' },
        { binding: 'licenseList', header: root.$v('SW 라이선스') },
        { binding: 'projectInfo', header: root.$v('프로젝트 위치') },
        { header: root.$v('과금시작일'), binding: 'chargeDate' },
        { binding: 'tagInfo', header: root.$v('자원 태그'), colspan: true }
      ],
      // 로딩
      loading: {
        update: false,
        isGetDbDetail: false,
        isGetMetaInfo: false,
        isUpdateMetaInfo: false
      },
      modal: {
        controlDB: false,
        deleteDB: false
      }
    }
  }
}
</script>
<style lang="scss" scoped>
  .detail-contents {
    & + .detail-contents {
      margin-top: $gap;
    }
  }

  .license-list-wrap {
    border-top: 1px solid $common-border;
    ul.license-list {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      gap: 2px;
      > li:not(:last-child) {
        &:after { content: ','; }
      }
    }
  }

  .empty-content { color: $input-placeholder; }
</style>
