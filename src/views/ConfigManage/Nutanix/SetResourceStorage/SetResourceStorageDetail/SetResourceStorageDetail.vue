<!--
  * 파일명 : SetResourceStorageDetail.vue
  * 파일 기능 : 구성관리 > 자원관리 > Storage 상세 확인 기능
  * 작성자 : 이경환 외 3명
  * 최종 작성일 : 2021-02-19
  * License By Shinsegae I&C
  * 2021-02-19 fix: 접근불가능 페이지 접근 후 > 뒤로가기시 이동 불가능 버그 수정
 -->

<template>
  <div
    clas
    v-loading="!interval ? loading.getDetail || loading.getProject : false"
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
            :disabled="resourceData.status === 'START' || resourceData.deleteDate"
            @click="e => {
              updateVolData = {
                ...resourceData,
                ...(originData && { beforeData: originData })
              }
              modal.controlVol = true
            }"
          >
            {{ $v('변경') }}
          </button>

          <!-- 삭제 -->
          <button
            v-if="!isUrgent"
            class="button"
            type="is-primary"
            :disabled="resourceData.status === 'START' || resourceData.deleteDate"
            @click="e => {
              updateVolData = null
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

        <template #vms="props">
          <div v-if="props.row.vms && props.row.vms.length">
            <p
              v-for="vm in props.row.vms"
              :key="vm.hostname"
            >
              {{ vm.hostname }}
            </p>
          </div>
          <span
            v-else
            class="empty-content"
          >-</span>
        </template>
        <!-- 연결된 호스트 정보 -->

        <template #totalDisk="props">
          <span
            class="align-center-wrap"
            v-if="props.row.disks"
          >
            {{ props.row.disks|volumnGroupSize('vmDiskSizeBytes') | byte }}&nbsp;
            {{ '(' + props.row.disks.length + 'EA)' }}
          </span>
        </template>
        <template #disks="props">
          <span v-if="props.row.disks">
            <div
              v-for="(disk,diskIdx) in props.row.disks"
              :key="diskIdx"
            >
              {{ disk.vmDiskSizeBytes|byte }}
            </div>
          </span>
          <span v-else />
        </template>

        <template #manageGroup>
          <span v-if="resourceData.manageGroupName">{{ resourceData.manageGroupName }}</span>
          <span v-else>-</span>
        </template>
        <!-- 운영그룹 -->

        <template #projectOwnerInfo>
          <span class="account-name">
            {{ resourceData.projectOwnerInfo }}
          </span>
        </template>

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
        <template #chargeDate>
          {{ resourceData.chargeDate | dateSimple('YYYY.MM.DD') }}
        </template>
        <template #tagInfo>
          <resource-tag-select-edit
            :data="resourceData"
            :read-only="false"
            service-type="STORAGE"
            module="NUTANIX"
            :project-idx="resourceData.projectIdx"
            resource-key="userVgIdx"
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
      <!-- :origin-form-data="storageMetadataForm" -->
    </dashboard-panel>
    <!-- 운영 정보 -->

    <!-- 모달 -->
    <!-- 자원 수정 -->
    <el-dialog
      :visible.sync="modal.controlVol"
      :title="`${$v('자원 변경')}`"
      :before-close="beforeCloseModal"
      width="1100px"
      top="5vh"
      @close="modal.controlVol = false"
    >
      <nx-storage-update-form
        v-if="modal.controlVol"
        :data="updateVolData"
        :project-idx="updateVolData
          ? updateVolData.projectIdx
          : undefined"
        :user-info="user"
        @close="modal.controlVol = false"
        @save="saveUpdatePayload"
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
        v-html="$v('<b>{storageName}</b>을 {state}하시겠습니까?<br>스토리지 명을 동일하게 입력해주세요.', {
          storageName: resourceData.storageName,
          state: updateVolData
            ? $i18n.locale === 'en' ? 'change' : '변경'
            : $i18n.locale === 'en' ? 'delete' : '삭제'
        })"
      />

      <el-input
        v-model="checkStorageName"
        :placeholder="$v('스토리지 명을 입력해주세요.')"
        @keyup.native.enter="e => {
          if(
            resourceData.storageName !== checkStorageName
          ) return
          updateVolData ? confirmUpdate() : confirmDelete()
        }"
      />
      <small
        class="-reference"
        v-if="!checkStorageName"
      >*&nbsp;{{ $v('스토리지 명을 입력해주세요.') }}</small>

      <small
        class="-reference"
        v-else-if="resourceData.storageName !== checkStorageName"
      >*&nbsp;{{ $v('스토리지 명이 올바르지 않습니다.') }}</small>

      <div
        class="convert-urgent-form"
        v-if="!updateVolData"
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
          @click="updateVolData ? confirmUpdate() : confirmDelete()"
          type="is-primary"
          :disabled="resourceData.storageName !== checkStorageName"
        >
          {{ updateVolData ? $v('변경') : $v('삭제') }}
        </button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import API, { VerticalTable, DashboardPanel, NXStorageUpdateForm, ToggleIsUrgentCheckbox } from '@sd-fe/cmp-core'

import axios from 'axios'
import Dayjs from 'dayjs'
import { mapState, mapGetters } from 'vuex'

// import StorageUpdateForm from '@/components/Modal/UpdateResource/StorageUpdateForm/StorageUpdateForm'
import SetResourceVolumeMixins from '../SetResourceVolume.mixins.js'

export default {
  name: 'SetResourceStorageDetail',
  mixins: [SetResourceVolumeMixins],
  components: {
    VerticalTable,
    'dashboard-panel': DashboardPanel,
    'nx-storage-update-form': NXStorageUpdateForm,
    ToggleIsUrgentCheckbox
  },
  async created () {
    this.cancelToken = axios.CancelToken.source()
    await this.init()

    // const today = Dayjs().format('YYYY.MM.DD')
    // const delDate = Dayjs(this.resourceData.deleteDate).format('YYYY.MM.DD')
    // this.isBefore = Dayjs(today).isBefore(delDate)

    // if (this.resourceData?.deleteDate && this.isBefore) {
    //   this.resourceInfoColumns.unshift({ binding: 'deleteDate', header: '삭제 예정일', colspan: true })
    // }
  },
  beforeDestroy () {
    this.clearGetVgInterval()
    this.cancelToken.cancel()
  },
  watch: {
    'resourceData.status': {
      immediate: true,
      deep: true,
      handler (val) {
        if (!val) return

        this.setBreadCrumbsStorageName(this.resourceData)
      }
    },
    'modal.controlVol' (newVal) {
      if (!newVal) this.updatePayloadData = null
    },
    'modal.passUpdate' () {
      this.deleteIsUrgent = true
    }
  },
  computed: {
    ...mapState({
      breadcrumbs: state => state.common.breadcrumbs,
      storageMetadataForm: state => state.metadata.NUTANIX.STORAGE
    }),
    ...mapGetters(['user']),
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
  methods: {
    async init () {
      await Promise.all([
        this.getVolumeGroupDetail()
      ]).then(() => {
        this.getVgInterval()
        this.getMetaInfo()

        if (this.resourceData) {
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
      this.resourceInfoColumns[0].binding !== 'deleteDate'
      ) {
        this.resourceInfoColumns.unshift({ binding: 'deleteDate', header: this.$v('삭제 예정일'), colspan: true })
      }
    },
    cancelDelete () {
      this.$confirm(this.$v('삭제 예정인 자원입니다. 삭제를 취소하시겠습니까?'))
        .then(async () => {
          const idxType = 'userVgIdx'
          const params = {
            indexType: idxType,
            userResourceIdx: this.resourceData[idxType],
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
    async getVolumeGroupDetail () {
      try {
        this.loading.getDetail = true
        const groupDetail = await API.compute.getVolumeGroupDetail(
          this.$route.params.userVgIdx,
          { isProgress: true },
          this.cancelToken
        )
        if (groupDetail) {
          this.originData = groupDetail
          this.resourceData = await this.settingDetailData(groupDetail)

          this.setBreadCrumbsStorageName(this.resourceData)
        } else {
          throw new Error()
        }
      } catch (error) {
        if (error?.data?.message) this.$alert(error.data.message)
        throw new Error(error)
        // this.$router.replace({ name: 'not-found-status', params: { code: error.status } })
      } finally {
        this.loading.getDetail = false
      }
    },
    async getMetaInfo (data = this.resourceData) {
      try {
        this.loading.isUpdateMetaInfo = true
        // 메타데이터 동기화 -> 메타데이터 편집 중이 아닐 때만
        if (this.isMetaDataFormEditing()) return

        const meta = this.resourceData.userVgIdx
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
     * storageName을 Breadcrumbs에 추가합니다.
     */
    setBreadCrumbsStorageName (data) {
      if (!data) return

      const isLastBreadcrumbsHasStatus = Object.keys(this.breadcrumbs[this.breadcrumbs.length - 1]).includes('resourceStatus') // breadcrumbs 마지막 요소가 'resourceStatus' key를 가지고 있는지?
      if (isLastBreadcrumbsHasStatus) return

      this.$store.commit('common/ADD_PARAMETERS', {
        label: data.storageName,
        path: '',
        resourceStatus: data.status === 'START' ? 'PROGRESS' : ''
      })
    },
    /**
     * 프로젝트 정보 조회
     */
    async getProject (projectIdx) {
      try {
        this.loading.getProject = true
        if (isNaN(projectIdx)) return null
        const data = await API.iam.getProject({ projectIdx })
        if (data?.length) return data[0]
        else return null
      } catch (error) {
        if (error?.data?.message) this.$alert(error.data.message)
        this.$router.replace({ name: 'not-found-status', params: { code: error.status } })
      } finally {
        this.loading.getProject = false
      }
    },

    // 자원 기본 정보 세팅
    async settingDetailData (resData) {
      let mappedData = {}

      console.log('@상세 정보: ', resData)
      const companyInfo = await this.getProject(resData.projectIdx)

      // 운영정보
      let manageGroupName
      if (resData?.manageGroupIdx) {
        const { data: findManageGorupInfo } = await API.billing.getOperationGroup({
          moduleType: 'NX',
          operatingGroupIdx: resData.manageGroupIdx
        })
        if (findManageGorupInfo?.length) manageGroupName = findManageGorupInfo[0].operatingGroupName
      }

      // 계정 정보
      let createUserName, updateUserName
      if (resData?.createUserId) createUserName = await this.getUserName(resData.createUserId)
      if (resData?.updateUserId) updateUserName = await this.getUserName(resData.updateUserId)

      mappedData = Object.assign({
        ...resData,
        storageName: resData?.storageName || resData?.vgName, // 미등록 자원 vgName으로 들어온다.
        manageGroupIdx: resData.manageGroupIdx,
        manageGroupName,

        deleteDateByDayjs: resData.deleteDate ? Dayjs(resData.deleteDate).format('YYYY.MM.DD') : undefined,

        projectInfoText: resData.companyName + ' > ' + resData.groupName + ' > ' + resData.projectName, // 신청 프로젝트
        projectOwnerInfo: companyInfo.projectOwner?.userName && companyInfo.projectOwner?.userId ? `${companyInfo.projectOwner?.userName}(${this.$options.filters.maskingName(companyInfo.projectOwner?.userId)})` : '', // 프로젝트 소유자
        createTime: this.$options.filters.date(resData.createTime, 'YYYY.MM.DD HH:mm'), // 자원 생성일
        createUserId: resData?.createUserId,
        updateUserId: resData?.updateUserId,
        createUserName,
        updateUserName,
        updateTime: this.$options.filters.date(resData.updateTime, 'YYYY.MM.DD HH:mm') // 최근 수정일
      }, {})
      return mappedData
    },
    /**
     * 스토리지 업데이트 정보 저장 합니다.
     * 스토리지 명 입력 모달창을 띄웁니다.
     */
    saveUpdatePayload (payload) {
      this.updatePayloadData = {
        ...payload,
        originStorageName: this.resourceData.storageName
      }
      if (this.updatePayloadData) {
        this.modal.passUpdate = true
        this.checkStorageName = ''
      }
    },
    /**
     * Storage 수정 시, '저장'
     */
    async confirmUpdate (saveData = this.updatePayloadData) {
      const {
        beforePrice,
        isUrgent,
        price,
        userVgIdx,
        manageGroupIdx,

        groupId,
        groupName,
        projectId,

        chargeDate,
        diskList,
        elementIdx,
        storageName,
        storageDesc,
        updateUserId,
        updateUserName,
        metaInfo
      } = saveData

      const payload = {
        beforePrice,
        groupIdx: groupId,
        groupName: groupName,
        isUrgent: !!isUrgent, // 긴급 여부(긴급 = true, 일반 = false)
        price,
        projectIdx: projectId,
        requestData: {
          chargeDate,
          diskList,
          elementIdx,
          storageName,
          storageDesc,
          updateUserId,
          updateUserName,
          userVgIdx,
          manageGroupIdx,
          metaInfo
        }, // 기존 orderData
        service: 'STORAGE',
        userId: this.user.userId,
        userName: this.user.userName
      }

      const result = await this.updateVg({ userVgIdx }, payload)
      if (result) {
        this.modal.passUpdate = false
        this.modal.controlVol = false
        this.checkStorageName = ''
      }
      // }).catch(() => false)
    },
    /**
     * 볼륨그룹 '삭제' -> API 찌르기 전 데이터 가공
     */
    async confirmDelete (data = this.resourceData) {
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
        service: 'STORAGE',
        requestData: {
          userVgIdx: data.userVgIdx
        }
      }
      // const payload = {
      //   userId: this.user.userId,
      //   userName: this.user.userName,
      //   userPosition: this.user.userPosition,
      //   groupIdx: data.groupIdx,
      //   groupName: data.groupName,
      //   orderData: {
      //     userVgIdx: data.userVgIdx
      //   }
      // }

      await this.deleteVg(payload)
      this.modal.passUpdate = false
      this.checkStorageName = ''
    },
    /**
     * [바로 삭제]
     */
    forceDelete () {
      this.$confirm(this.$v('자원을 바로 삭제하시겠습니까?'))
        .then(async () => {
          const params = {
            indexType: 'userVgIdx',
            userResourceIdx: this.resourceData.userVgIdx,
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
      this.clearGetVgInterval()
      this.$router.push({ name: 'set-resource-storage' })
    },
    // 메타데이터 정보 세팅
    settingMetaDataArr (data = {}) {
      try {
        const form = this.storageMetadataForm || []
        const metaData = form.map(meta => {
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
          resourceType: 'STORAGE',
          resourceId: this.resourceData.userVgIdx
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
          resourceType: 'STORAGE',
          resourceId: this.resourceData.userVgIdx
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
        console.error(this.$v('사용자 조회에 문제가 발생했습니다') + ': ', error)
      }
    }
  },
  data (root) {
    return {
      isBefore: false,
      isView: true,
      deleteIsUrgent: true, // 삭제 > 긴급 여부
      loading: {
        getDetail: false,
        getProject: false,
        isGetMetaInfo: false, // 메타 정보 조회
        isUpdateMetaInfo: false // 메타 정보 업데이트
      },
      originData: null, // 기등록 자원 > 상세 원본 정보
      resourceData: {},
      metaInfoArr: [],
      updatePayloadData: null, // 업데이트 시, payload
      companyInfo: undefined, // 선택한 관-조-프의 프로젝트 정보
      updateVolData: null, // 업데이트 할 volumeGroup정보 (create, delete일 때 null)
      checkStorageName: '', // 스토리지 변경/삭제 > 스토리지명 확인 시, 입력한 스토리지명
      cancelToken: null, // axios cancel 토큰
      modal: {
        controlVol: false, // 스토리지 변경 모달
        passUpdate: false // 스토리지 변경/삭제 확인 모달
      },
      resourceInfoColumns: [
        { header: root.$v('긴급 처리 여부'), binding: 'isUrgent' },
        { binding: 'storageName', header: root.$v('Volume 그룹명') },
        { binding: 'vms', header: root.$v('연결된 호스트 정보') },
        { binding: 'totalDisk', header: root.$v('총 크기(신청 수)') },
        { binding: 'disks', header: root.$v('신청 용량') },
        { binding: 'manageGroup', header: root.$v('운영그룹') },

        { binding: 'projectInfoText', header: root.$v('프로젝트 위치') },
        { binding: 'projectOwnerInfo', header: '프로젝트 소유자', keyPath: 'common.REGCON.projectOwner' },
        { binding: 'createAccount', header: root.$v('자원 생성 계정') },
        { binding: 'updateAccount', header: root.$v('마지막 수정 계정') },
        { binding: 'createTime', header: root.$v('자원 생성일') },
        { binding: 'updateTime', header: root.$v('최근 수정일') },
        { binding: 'chargeDate', header: root.$v('과금 시작일') },
        { binding: 'storageDesc', header: root.$v('Volume 설명') },
        { binding: 'tagInfo', header: root.$v('자원 태그'), colspan: true }
      ]
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

  .empty-content { color: $input-placeholder; }
</style>
