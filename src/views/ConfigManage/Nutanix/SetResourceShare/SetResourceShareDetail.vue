<!--
  * 파일명 : NutanixCentralImageList.vue
  * 파일 기능 : Nutanix 설정 > Central 이미지 추가/수정/삭제
  * 작성자 : 정재은
  * 최종 작성일 : 2021-02-25
  * License By Shinsegae I&C
  * 2021-02-25 Update : 파일 is-ready 상태일 경우 css 버그 수정
 -->

<template>
  <div class="file-server-detail">
    <section class="detail-contents">
      <dashboard-panel
        v-loading="!tableView"
        :padding-top="0"
        title="파일 서버 정보"
      >
        <template #header>
          <div
            class="button-area -right"
            v-if="!isUrgent"
          >
            <button
              class="button"
              type="is-primary"
              :disabled="shareDetailData.status === 'START' || shareDetailData.deleteDate"
              @click="e => {
                updateShareData = shareDetailData
                modal.controlShare = true
              }"
            >
              {{ $v('변경') }}
            </button>
            <button
              class="button"
              type="is-primary"
              :disabled="shareDetailData.status === 'START' || shareDetailData.deleteDate"
              @click="e => {
                updateShareData = null
                modal.passUpdate = true
              }"
            >
              {{ $v('삭제') }}
            </button>
            <span
              class="divider"
              v-if="shareDetailData.deleteDate"
            />

            <template v-if="shareDetailData.deleteDate">
              <button
                class="button"
                type="is-anti"
                @click="forceDelete"
              >
                {{ $v('바로 삭제') }}
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
                  <b>{{ $v('삭제 예정일') }} : {{ shareDetailData.deleteDateByDayjs }}</b>
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
          v-if="tableView"
          :columns="nasInfoColumns"
          :data="shareDetailData"
          type="horizontal"
          class="file-server-info"
        >
          <template
            #deleteDate
            v-if="shareDetailData.deleteDate && isView"
          >
            <span>
              {{ deleteDate }}
            </span>
          </template>

          <template #isUrgent>
            {{ shareDetailData.isUrgent ? '긴급 자원' : '일반 자원' }}
          </template>
          <template #maxSizeGiB>
            <span>
              {{ shareDetailData.maxSizeGiB + ' GB' }}
            </span>
          </template>
          <!-- 할당량 -->
          <template #shareUsedSpaceByte>
            <span>
              {{ shareDetailData.shareUsedSpaceByte | onlyGB }}
            </span>
          </template>
          <!-- 현재 사용량 -->
          <template #protocolType>
            {{ shareDetailData.protocolType === 'SMB' ? 'SMB' : 'NFS' }}
          </template>
          <template #shareConnection>
            <span>
              {{ shareDetailData.shareConnection || 0 }}
            </span>
          </template>
          <!-- 연결 vm 개수 -->
          <template #fileBlocking>
            <span>{{ shareDetailData.fileBlocking }}</span>
          </template>
          <!-- 차단 파일 -->
          <template #isDistributed>
            {{ shareDetailData.isDistributed ? '사용' : '미사용' }}
          </template>
          <!-- 부하분산 사용 여부 -->
          <template #isCompression>
            {{ shareDetailData.isCompression ? '사용' : '미사용' }}
          </template>
          <!-- 압축 여부 -->
          <template #isAccess>
            {{ shareDetailData.isAccess ? '사용' : '미사용' }}
          </template>
          <!-- 액세스 제한 여부 -->
          <template #isSnapshot>
            {{ shareDetailData.isSnapshot ? '사용' : '미사용' }}
          </template>
          <!-- 스냅샷 사용 여부 -->
          <template #isSmb3Encryption>
            {{ shareDetailData.isSmb3Encryption ? '사용' : '미사용' }}
          </template>
          <!-- SMB 암호화 사용 여부 -->
        </vertical-table>
      </dashboard-panel>
    </section>
    <!-- 파일 서버 정보 -->

    <g-tab
      :data="detailTabs"
      class="detail-tabs"
      :padding-top="0"
    >
      <!-- @click="clickTab" -->
      <template #manage>
        <section
          class="detail-contents"
        >
          <dashboard-panel
            :padding-top="0"
          >
            <meta-data-form
              v-loading="loading.isGetMetaInfo || loading.isUpdateMetaInfo"
              :form-data="metaInfoArr"
              use-update-btns
              read-only
              @save-info="saveMetaInfo"
              ref="metaDataFormRef"
            />
            <!-- :origin-form-data="fileServerMetadataForm" -->
          </dashboard-panel>
          <!-- 운영 정보 -->
        </section>
      </template>
      <template #monitor>
        <vm-monitoring>
          <file-server-monitoring-chart
            :idx="shareIdx"
            :is-share="true"
          />
        </vm-monitoring>
      </template>
    </g-tab>

    <!-- 모달 -->
    <!-- 자원 수정 -->
    <el-dialog
      :visible.sync="modal.controlShare"
      :title="updateShareData ? $t('common.TERMS.resourceUpdate') : $t('common.TERMS.resourceAdd')"
      :before-close="beforeCloseModal"
      width="1300px"
      top="5vh"
      @close="modal.controlShare = false"
    >
      <nx-share-update-form
        v-if="modal.controlShare"
        :data="updateShareData"
        :project-idx="updateShareData
          ? updateShareData.projectIdx
          : undefined"
        :user-info="user"
        @close="modal.controlShare = false"
        @save="confirmUpdate"
        in-admin
      />
    </el-dialog>

    <!-- 자원 변경/삭제 -> NAS명 동일 입력 확인 모달 -->
    <el-dialog
      :visible.sync="modal.passUpdate"
      @close="closeModal"
      class="pass-name-form"
      v-loading="loading.delete || loading.update"
    >
      <span
        class="name-form-noti"
        v-html="$v('<b>{shareName}</b>을 {state}하시겠습니까?<br>NAS 명을 동일하게 입력해주세요.', {
          shareName: shareDetailData.shareName,
          state: updateShareData
            ? $i18n.locale === 'en' ? 'change' : '변경'
            : $i18n.locale === 'en' ? 'delete' : '삭제'
        })"
      />

      <el-input
        v-model="checkShareName"
        :placeholder="$v('NAS 명을 입력해주세요.')"
        @keyup.native.enter="e => {
          if(
            shareDetailData.shareName !== checkShareName
          ) return
          updateShareData ? confirmUpdate() : confirmDelete()
        }"
      />
      <small
        class="-reference"
        v-if="!checkShareName"
      >*&nbsp;{{ $v('NAS 명을 입력해주세요.') }}</small>

      <small
        class="-reference"
        v-else-if="shareDetailData.shareName !== checkShareName"
      >*&nbsp;{{ $v('NAS 명이 올바르지 않습니다.') }}</small>

      <div
        class="convert-urgent-form"
        v-if="!updateShareData"
      >
        <el-checkbox v-model="deleteIsUrgent">
          {{ $v('긴급') }}
        </el-checkbox>
        <small class="-reference">*&nbsp;긴급 자원인 경우 체크박스를 선택하세요.</small>
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
          @click="updateShareData ? confirmUpdate() : confirmDelete()"
          type="is-primary"
          :disabled="shareDetailData.shareName !== checkShareName"
        >
          {{ updateShareData ? $v('변경') : $v('삭제') }}
        </button>
      </div>
    </el-dialog>
  </div>
</template>
<script>
import API, {
  MonitoringContainer,
  FSMonitoringChart,
  VerticalTable,
  DashboardPanel,
  MetaDataForm,
  NXShareUpdateForm
} from '@sd-fe/cmp-core'
import { mapState } from 'vuex'
import Dayjs from 'dayjs'
import axios from 'axios'

export default {
  name: 'SetResourceShareDetail',
  components: {
    VerticalTable,
    DashboardPanel,
    MetaDataForm,
    'vm-monitoring': MonitoringContainer,
    'file-server-monitoring-chart': FSMonitoringChart,
    'nx-share-update-form': NXShareUpdateForm
  },
  watch: {
    protocolType (val) {
      let addColumns
      if (val === 'SMB') {
        addColumns = [
          { binding: 'isSmb3Encryption', header: this.$v('SMB 암호화 사용') }
        ]
      }
      if (val === 'NFS') {
        addColumns = [
          { binding: 'authenticationType', header: this.$v('인증 타입') },
          { binding: 'squashType', header: this.$v('스쿼시 타입') },
          { binding: 'anonymousUid', header: this.$v('익명 유저 아이디') },
          { binding: 'anonymousGid', header: this.$v('익명 그룹 아이디') },
          { binding: 'shareAccessType', header: this.$v('파일 접근 권한') }
        ]
      }
      this.nasInfoColumns = [
        { binding: 'isUrgent', header: this.$v('자원 분류') },
        { binding: 'shareName', header: this.$v('Share 이름') },
        { binding: 'cateName', header: this.$v('네트워크 카테고리') },
        { binding: 'maxSizeGiB', header: this.$v('할당량') },
        { binding: 'shareUsedSpaceByte', header: this.$v('현재 사용량') },
        { binding: 'protocolType', header: this.$v('프로토콜 타입') },
        { binding: 'dnsDomainName', header: this.$v('DNS 도메인 이름') },
        { binding: 'clusterName', header: this.$v('클러스터') },
        { binding: 'fileServerName', header: this.$v('연결된 파일 서버') },
        { binding: 'shareConnection', header: this.$v('연결된 VM 개수') },
        { binding: 'mountPath', header: this.$v('Mount path') },
        { binding: 'isDistributed', header: this.$v('부하 분산 사용 여부') },
        { binding: 'isCompression', header: this.$v('압축 여부') },
        { binding: 'isAccess', header: this.$v('엑세스 제한 여부') },
        { binding: 'isSnapshot', header: this.$v('스냅샷 사용 여부') },
        { binding: 'fileBlocking', header: this.$v('차단 파일') },
        ...addColumns,
        { binding: 'projectInfoText', header: this.$v('프로젝트 위치') },
        { binding: 'projectOwner', header: this.$v('프로젝트 소유자') },
        { binding: 'createUserNameWithId', header: this.$v('자원 생성 계정') },
        { binding: 'updateUserNameWithId', header: this.$v('마지막 수정 계정') },
        { binding: 'createTime', header: this.$v('자원 생성일') },
        { binding: 'updateTime', header: this.$v('최근 수정일') },
        { binding: 'description', header: this.$v('설명') },
        { binding: 'chargeDate', header: this.$v('과금 시작일') }
      ]
    }
  },
  computed: {
    ...mapState({
      user: state => state.auth.user,
      breadcrumbs: state => state.common.breadcrumbs,
      fileServerMetadataForm: state => state.metadata.NUTANIX.FILE_SERVER,
      projects: state => state.project.projects
    }),
    isUrgent () { // 긴급 자원 여부
      return !!this.shareDetailData.isUrgent
    },
    canDelete () {
      if (this.shareDetailData.deleteDate) {
        return this.shareDetailData.deleteDate && this.isBefore && this.isView
      } else {
        return false
      }
    },
    deleteDate () {
      if (this.shareDetailData.deleteDate) {
        return Dayjs(this.shareDetailData.deleteDate).format('YYYY.MM.DD')
      } else {
        return ''
      }
    },
    // 미등록 자원인지?
    isUnregistered () {
      return (this.shareDetailData?.chargeDate === undefined)
    }
  },
  beforeDestroy () {
    this.clearGetShareInterval()
    this.cancelToken.cancel()
  },
  async created () {
    this.shareIdx = this.$route.params.shareIdx
    this.cancelToken = axios.CancelToken.source()

    this.netCateList = await this.getNetworkCategory()
    await this.getClusters()
    await this.init()

    // Promise.all([
    //   this.getShare(this.$route.params.shareIdx)
    // ]).then(() => {
    //   this.getMetaInfo()
    // }).catch((err) => {
    //   console.log(err)
    //   return false
    // })
  },
  methods: {
    async init () {
      await Promise.all([
        this.getShare(this.shareIdx)
      ]).then(() => {
        this.getShareInterval()

        if (this.shareDetailData) {
          this.setDeleteDate()
          this.getMetaInfo()
        }
      }).catch((err) => {
        console.log(err)
        this.goToList()

        return false
      })
    },
    /**
     * 정보 조회 interval
     */
    async getShareInterval () {
      if (this.interval) this.clearGetShareInterval()

      const callbackFlag = false
      this.interval = setInterval(async () => {
        if (!callbackFlag) await this.init()
      }, 10000)
    },
    /**
     * deleteDate 세팅
     */
    setDeleteDate () {
      if (!this.shareDetailData?.deleteDate) return
      const today = Dayjs().format('YYYY.MM.DD')
      const delDate = Dayjs(this.shareDetailData.deleteDate).format('YYYY.MM.DD')
      this.isBefore = Dayjs(today).isBefore(delDate)
      this.isView = true

      if (this.shareDetailData?.deleteDate &&
      this.isBefore &&
      this.nasInfoColumns[0].binding !== 'deleteDate'
      ) {
        this.nasInfoColumns.unshift({ binding: 'deleteDate', header: '삭제 예정일', colspan: true, keyPath: 'common.GRID.deleteDate' })
      }
    },
    cancelDelete () {
      this.$confirm(this.$v('삭제 예정인 자원입니다. 삭제를 취소하시겠습니까?'), { dangerouslyUseHTMLString: true })
        .then(async () => {
          const idxType = 'userShareIdx'
          const params = {
            indexType: idxType,
            userResourceIdx: this.shareDetailData[idxType],
            userId: this.user.userId,
            userName: this.user.userName
          }

          const res = await API.work_v3.cancelDelete(params)
          if (res) {
            this.$alert(this.$v('삭제 요청이 취소되었습니다.'), () => false)
            this.nasInfoColumns.shift()
            this.isView = false
          }
          this.init()
        }).catch(() => false)
    },
    /**
     * 네트워크 카테고리 리스트 조회
     */
    async getNetworkCategory () {
      try {
        const networkCates = await API.network.getNetworkCategory()

        if (networkCates) {
          return networkCates.map(cate => ({
            codeValue: cate.codeValue,
            cateKey: cate.cateKey,
            ipCategoryIdx: cate.ipCategoryIdx
          }))
        } else return []
      } catch (error) {
        this.$alert(this.$v('네트워크 카테고리 조회에 문제가 발생했습니다.'))
      }
    },
    async getClusters () {
      await this.$store.dispatch('cluster/getClusters', ['clusterUuid', 'clusterName'])
      this.clusters = this.$store.state.cluster.clusterList
      console.log('@getClusters', this.clusters)
    },
    getClusterName (data) {
      return this.clusters.find(item => item.clusterUuid === data.clusterUuid)
    },
    setBreadCrumbsResourceName (data) {
      if (!data) return
      this.$store.commit('common/ADD_PARAMETERS', {
        label: data.shareName,
        path: ''
      })
    },
    /**
     * File Server List 조회
     */
    async getShare (idx) {
      const data = await API.compute.getShare(idx)
      if (data) {
        if (this.breadcrumbs.length < 4) this.setBreadCrumbsResourceName(data)

        // this.setTableColumns(data.protocolType)
        this.protocolType = data.protocolType

        // 클러스터 정보
        if (data.clusterUuid) {
          const clusterInfo = this.getClusterName(data)
          data.clusterName = clusterInfo?.clusterName
        }

        if (data.cateIdx) {
          const cate = this.netCateList.find(item => {
            return item.ipCategoryIdx === data.cateIdx
          })
          data.cateName = cate?.cateKey
          data.networkList = [cate]
        }

        data.fileBlocking = data.fileBlocking ? data.fileBlocking === '[]' ? '-' : data.fileBlocking.replace(/[[\]]/g, '') : null
        data.project = this.projects[data.projectIdx]
        data.projectName = data.project?.projectName
        if (data.project) {
          Object.assign(data, {
            projectInfoText: data.project.companyName + ' > ' + data.project.groupName + ' > ' + data.project.projectName,
            projectOwner: data.project.projectOwner,
            createUserNameWithId: data.createUserId && data.createUserName ? `${data.createUserName}(${this.$options.filters.maskingName(data.createUserId)})` : '', // 자원 생성 계정,
            updateUserNameWithId: data.updateUserId && data.updateUserName ? `${data.updateUserName}(${this.$options.filters.maskingName(data.updateUserId)})` : '', // 마지막 수정 계정,
            groupIdx: data.project.groupIdx,
            groupName: data.project.groupName
          })
        }
        data.createTime = this.$options.filters.date(data.createTime, 'YYYY.MM.DD HH:mm') // 자원 생성일
        data.updateTime = this.$options.filters.date(data.updateTime, 'YYYY.MM.DD HH:mm') // 최근 수정일

        if (data.deleteDate) {
          Object.assign(data, {
            deleteDateByDayjs: Dayjs(data.deleteDate).format('YYYY.MM.DD')
          })
        }

        // projectOwnerInfo: companyInfo.projectOwner?.userName && companyInfo.projectOwner?.userId ? `${companyInfo.projectOwner?.userName}(${this.$options.filters.maskingName(companyInfo.projectOwner?.userId)})` : '', // 프로젝트 소유자
        // createAccount: data.createUserId && data.createUserName ? `${data.createUserName}(${this.$options.filters.maskingName(data.createUserId)})` : '', // 자원 생성 계정
        // updateAccount: data.updateUserId && data.updateUserName ? `${data.updateUserName}(${this.$options.filters.maskingName(data.updateUserId)})` : '', // 마지막 수정 계정

        this.shareDetailData = data
        this.tableView = true
        console.log('@getShare: shareDetailData', this.shareDetailData)
      }
    },
    async getMetaInfo (data = this.shareDetailData) {
      try {
        this.loading.isUpdateMetaInfo = true
        // 메타데이터 동기화 -> 메타데이터 편집 중이 아닐 때만
        if (this.isMetaDataFormEditing()) return

        // 메타 정보 확인 필요
        const meta = this.shareDetailData.userShareIdx
          ? await this.getNxResourceMetaInfo()
          : (data?.metaInfo ? JSON.parse(data.metaInfo) : null)
        this.shareDetailData.metaInfo = meta ? JSON.stringify(meta) : ''
        this.metaInfoArr = await this.settingMetaDataArr(meta)
      } catch (error) {
        console.error(error)
      } finally {
        this.loading.isUpdateMetaInfo = false
      }
    },
    // 메타데이터 정보 세팅
    settingMetaDataArr (data = {}) {
      const metaData = this.fileServerMetadataForm?.map(meta => {
        const info = data && data[meta.key]
          ? data[meta.key]
          : ''

        return {
          ...meta,
          data: info || meta.data
        }
      })
      // if (this.shareDetailData.tags) metaData.push({ title: '자원 태그', key: 'tags', data: this.shareDetailData.tags })
      return metaData
    },
    /**
   * API: 메타 정보를 조회 합니다. (기생성 자원의 경우)
   */
    async getNxResourceMetaInfo () {
      try {
        this.loading.isGetMetaInfo = true

        const payload = {
          resourceType: 'FILE_SERVER',
          resourceId: this.shareDetailData.userShareIdx
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
          resourceType: 'FILE_SERVER',
          resourceId: this.shareDetailData?.userShareIdx
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
    },
    /**
    * 모달 닫기 전, 정말 취소하겠냐는 알람
    */
    beforeCloseModal (done) {
      this.$confirm(this.$v('내용을 저장하지 않고 취소하시겠습니까?'))
        .then(() => {
          done()
        }).catch(() => false)
    },
    /**
     * Storage 수정 시, '저장'
     */
    async confirmUpdate (saveData) {
      const {
        beforePrice,
        isUrgent,
        price,
        ...rest
      } = saveData

      const payload = {
        beforePrice,
        groupIdx: saveData.groupIdx,
        groupName: saveData.groupName,
        isUrgent: !!isUrgent, // 긴급 여부(긴급 = true, 일반 = false)
        price,
        projectIdx: saveData.projectIdx,
        requestData: rest, // 기존 orderData
        service: 'FILE_SERVER',
        userId: this.user.userId,
        userName: this.user.userName
      }

      this.$confirm(this.$v('자원을 변경하시겠습니까?')).then(async () => {
        const result = await this.updateShare(payload)
        if (result) this.modal.controlShare = false

        this.cancelToken.cancel()
      }).catch(() => false)
    },
    /**
   * share 생성 이벤트
   */
    async updateShare (payload) {
      try {
        this.loading.create = true
        console.log('@updateShare: ', payload)
        const result = await API.work_v3.updateNxShare(payload)

        if (result) {
          this.$alert(this.$v('NAS 변경 작업이 요청되었습니다.<br>{shareName}', { shareName: payload.requestData.shareName }), {
            dangerouslyUseHTMLString: true,
            callback: () => false
          })
          this.init()
          return true
        } else return false
      } catch (error) {
        console.error(error)
        this.$alert(this.$v('변경에 실패하였습니다.<br>관리자 문의 부탁드립니다.'), { dangerouslyUseHTMLString: true })
        throw error
      } finally {
        this.loading.create = false
      }
    },
    /**
     * 볼륨그룹 '삭제' -> API 찌르기 전 데이터 가공
     */
    async confirmDelete (data = this.shareDetailData) {
      console.log('@@@@', data)
      const payload = {
        beforePrice: data?.beforePrice || 0,
        price: data?.price || 0,
        userId: this.user.userId,
        userName: this.user.userName,
        groupIdx: data.groupIdx,
        groupName: data.groupName,
        projectIdx: data.projectIdx,
        isUrgent: !!this.deleteIsUrgent,
        service: 'FILE_SERVER',
        requestData: {
          userShareIdx: data.userShareIdx,
          fileServerUuid: data.fileServerUuid,
          shareUuid: data.shareUuid
        }
      }
      await this.deleteShare(payload)
      this.modal.passUpdate = false
      this.checkShareName = ''
    },
    /**
     * [바로 삭제]
     */
    forceDelete () {
      this.$confirm(this.$v('자원을 바로 삭제하시겠습니까?'))
        .then(async () => {
          const params = {
            indexType: 'userShareIdx',
            userResourceIdx: this.shareDetailData.userShareIdx,
            userId: this.user.userId,
            userName: this.user.userName
          }
          await this.forceDeleteResource(params)
        }).catch(() => false)
    },
    /**
    * API: 바로 삭제
    */
    async forceDeleteResource (params) {
      try {
        this.loading.delete = true
        const result = await API.work_v3.forceDeleteResource(params)

        if (result) {
          this.$alert(this.$v('자원을 삭제하였습니다.'), () => false)
          this.goToList()
        }
      } catch (error) {
        console.error(error)
        this.$alert(this.$v('삭제에 실패하였습니다.<br>관리자 문의 부탁드립니다.'), {
          dangerouslyUseHTMLString: true,
          callback: () => false
        })
      } finally {
        this.loading.delete = false
      }
    },
    goToList () {
      this.clearGetShareInterval()
      this.$router.push({ name: 'set-resource-share' })
    },
    /**
    * 정보 조회 interval clear
    */
    clearGetShareInterval () {
      clearInterval(this.interval)
      this.interval = null
    },
    /**
     * share 삭제 이벤트
     */
    async deleteShare (payload) {
      console.log(payload)
      try {
        this.loading.delete = true
        const result = await API.work_v3.deleteNxShare(payload)

        if (result) {
          this.$alert(this.$v('자원을 삭제하였습니다.'), () => false)
          this.init()
        }
      } catch (error) {
        console.error(error)
        this.$alert(this.$v('삭제에 실패하였습니다.<br>관리자 문의 부탁드립니다.'), {
          dangerouslyUseHTMLString: true,
          callback: () => false
        })
      } finally {
        this.loading.delete = false
      }
    },
    closeModal () {
      this.modal.passUpdate = false
      this.checkShareName = ''
    }
  },
  data (root) {
    return {
      detailTabs: [
        { field: 'manage', name: root.$v('운영 정보'), active: true },
        { field: 'monitor', name: root.$v('모니터링 정보'), active: false }
      ],
      nasInfoColumns: [],
      shareDetailData: {},
      tableView: false,
      companyList: [],
      networkCategoryList: [],
      clusters: [],
      fileServerUuid: '',
      loading: {
        isGetMetaInfo: false,
        isUpdateMetaInfo: false,
        delete: false,
        update: false
      },
      metaInfoArr: [],
      shareIdx: 0,
      updateShareData: null, // 업데이트 할 Share 정보 (create, delete일 때 null)
      modal: {
        controlShare: false, // share 변경 모달
        passUpdate: false // share 변경/삭제 확인 모달
      },
      checkShareName: '', // share 변경/삭제 > share명 확인 시, 입력한 share명
      deleteIsUrgent: false, // 삭제 > 긴급 여부
      netCateList: [],
      protocolType: '',
      isView: true,
      isBefore: false,
      interval: null
    }
  }

}
</script>
<style lang="scss">
  .file-server-detail {
    position: relative;
    .before-page-btn {
      position: absolute;
      top: -58px;
      left: 0;
    }

    .detail-tabs {
      .detail-contents {
        padding-top: 20px;
      }
    }

    .file-server-info {
      .flex-box {
        display: flex;
        align-items: center;
        .tooptip-icon {
          display: inline-block;
          margin-left: 5px;
        }
      }

    }

  }
</style>
