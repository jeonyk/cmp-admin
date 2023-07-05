<!--
  * 파일명 : SetResourceShareList.vue
  * 파일 기능 : 구성관리 > 자원 관리 > Storage > VolumeGroup 리스트 확인 기능, 필터링(관계사 / 조직 / 프로젝트) 기능
  * 작성자 : 이경환 외 2명
  * 최종 작성일 : 2021-01-27
  * License By Shinsegae I&C
  * 2021-01-27 fix: 그리드 데이터 로딩 UI 개선
 -->

<template>
  <div
    v-loading="loading.detail"
    class="set-resource-volume-group-list"
    :element-loading-text="$t('common.PLACEHOLDER.loading')"
  >
    <resource-filter-component
      cloud-type="private"
      :table-data="tableData"
      @search="searchFiles"
      @reset="filteredIsUrgent = ''"
    >
      <section class="filter-form">
        <span class="filter-name">{{ $v('분류') }}</span>
        <el-select
          v-model="filteredIsUrgent"
          :placeholder="$v('분류')"
          :popper-append-to-body="false"
          @change="filtering"
        >
          <el-option
            v-for="option in isUrgentOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </section>
    </resource-filter-component>

    <section class="table-top-wrap">
      <total-count
        class="total-count-wrap"
        :total-count="totalResultCnt"
      >
        <div class="flex-wrap">
          <el-checkbox
            v-model="filterCreateTypeRegisterChecked"
            @change="filtering()"
          >
            {{ $v('CMP 외부 생성 자원 보기') }}
          </el-checkbox>
        </div>
      </total-count>

      <div class="button-area -right">
        <button
          class="button change"
          type="is-primary"
          v-if="checkedItems.length"
          :disabled="checkedItems.length > 1 || checkedItems[0] && checkedItems[0].status === 'PROGRESS'"
          @click="e => {
            setUpdateShareData()
          }"
        >
          {{ $v('변경') }}
        </button>
        <el-tooltip
          :disabled="availableFileServerCnt > 0"
          placement="top"
          effect="light"
        >
          <div
            slot="content"
            v-html="$v('등록된 파일 서버가 없습니다.')"
          />
          <span>
            <button
              class="button"
              type="is-primary"
              :disabled="availableFileServerCnt === 0"
              @click="e => {
                modal.controlShare = true
                updateShareData = null
              }"
            >
              {{ $v('자원 추가') }}
            </button>
          </span>
        </el-tooltip>
      </div>
    </section>

    <section class="table-area">
      <cmp-grid
        class="route-detail-grid"
        :init-custom-action="flex => grid = flex"
        :custom-init-filter="filter => gridFilter = filter"
        :item-source="filteredData"
        :columns="shareColumns"
        :use-excel-download="true"
        :changing-page-reset="false"
        @selectedRow="selectRow"
        @checkedRowsData="(items) => setCheckedItems(items)"
        @total-count="cnt => totalResultCnt = cnt"
        selectable
        use-checkbox
        page-keeping
      >
        <template #createType="{ row }">
          <created-by-cmp-tag v-if="row.createType !== 'REGISTER'" />
          <span v-else />
        </template>

        <template #projectName="{ row }">
          {{ projects[row.projectIdx] ? projects[row.projectIdx].projectName : '-' }}
        </template>
        <!-- 프로젝트 명 -->
        <template #shareName="props">
          <span
            v-if="props.row.deleteDate"
            class="new-tag-wh -delete"
          >{{ setDeleteDateState(props.row.deleteDate) }}</span>
          <!-- 삭제 예정/중/실패 태그 -->
          {{ props.row.shareName }}
        </template>
        <template #isUrgent="{ row }">
          {{ row.isUrgent ? '긴급' : '일반' }}
        </template>
        <!-- 분류 -->
        <template #protocolType="{ row }">
          {{ row.protocolType === 'SMB' ? 'SMB' : 'NFS' }}
        </template>
        <!-- protocolType -->
        <template #shareConnection="{ row }">
          {{ row.shareConnection || 0 }}
        </template>
        <!-- shareConnection -->
        <template #shareUsedSpaceByte="props">
          <span>{{ props.row.shareUsedSpaceByte | onlyGB }}</span>
        </template>
        <!-- 현재 사용량 -->
        <template #maxSizeGiB="props">
          <span>{{ props.row.maxSizeGiB + ' GB' }}</span>
        </template>
        <!-- 최대 용량 -->
      </cmp-grid>
    </section>

    <!-- 모달 -->
    <!-- 자원 추가/변경 -->
    <el-dialog
      :visible.sync="modal.controlShare"
      :title="updateShareData ? $t('common.TERMS.resourceUpdate') : $t('common.TERMS.resourceAdd')"
      width="1300px"
      top="5vh"
      :before-close="beforeCloseModal"
      @close="modal.controlShare = false"
    >
      <nx-share-update-form
        v-if="modal.controlShare"
        v-loading="loading.detail"
        :data="updateShareData"
        :project-idx="updateShareData
          ? updateShareData.projectIdx
          : (selectedProjectInfo ? selectedProjectInfo.projectIdx : undefined)"
        :user-info="user"
        @close="modal.controlShare = false"
        @save="confirmSave"
        in-admin
      />
    </el-dialog>

    <!-- 자원 변경 -> 스토리지명 동일 입력 확인 모달 -->
    <el-dialog
      v-if="checkedItems.length && updatePayloadData"
      :visible.sync="modal.passUpdate"
      width="350px"
      @close="modal.passUpdate = false"
      class="pass-name-form"
    >
      <span
        class="name-form-noti"
        v-html="$v('<b>{shareName}</b>을 {state}하시겠습니까?<br>NAS 명을 동일하게 입력해주세요.', {
          shareName: checkedItems[0].shareName,
          state: $i18n.locale === 'en' ? 'change' : '변경'
        })"
      />

      <el-input
        v-model="checkShareName"
        :placeholder="$v('NAS 명을 입력해주세요.')"
        @keyup.native.enter="e => {
          if(checkedItems[0].shareName !== checkShareName) return
          confirmUpdate()
        }"
      />
      <small
        class="-reference"
        v-if="!checkShareName"
      >*&nbsp;{{ $v('NAS 명을 입력해주세요.') }}</small>

      <small
        class="-reference"
        v-else-if="checkedItems[0].shareName !== checkShareName"
      >*&nbsp;{{ $v('NAS 명이 올바르지 않습니다.') }}</small>

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
          @click="confirmUpdate()"
          type="is-primary"
          :disabled="checkedItems[0].shareName !== checkShareName"
        >
          {{ $v('변경') }}
        </button>
      </div>
    </el-dialog>
  </div>
</template>
<script>
import API, {
  ResourceFilterComponent,
  NXShareUpdateForm
} from '@sd-fe/cmp-core'
import axios from 'axios'
import { mapState } from 'vuex'
import Dayjs from 'dayjs'
import CreateByCMPTag from '@/components/Tag/CreateByCMPTag'

export default {
  name: 'SetResourceShareList',
  components: {
    ResourceFilterComponent,
    'created-by-cmp-tag': CreateByCMPTag,
    'nx-share-update-form': NXShareUpdateForm
  },
  async mounted () {
    this.netCateList = await this.getNetworkCategory()
    await this.getFileServerList()
    await this.getClusters()
    await this.init()
  },
  watch: {
    'modal.controlShare' (newVal) {
      if (!newVal) this.updatePayloadData = null
    }
  },
  computed: {
    ...mapState({
      user: state => state.auth.user,
      projects: state => state.project.projects
    })
  },
  methods: {
    async getFileServerList () {
      const fileServers = await API.compute.getAllFileServerList()
      if (fileServers.length) {
        const available = fileServers.filter(fs => {
          // 등록 되어있고, 사용자 노출이 true 인 파일서버 필터링
          if (fs.userFsIdx && fs.isPub) {
            return fs
          }
        })
        this.availableFileServerCnt = available.length
      } else {
        this.availableFileServerCnt = 0
      }
    },
    /**
     * deleteDate 존재 데이터에 삭제 예정/중/실패 표기
     */
    setDeleteDateState (deleteDate) {
      const today = Dayjs().format('YYYY-MM-DD')
      const delDate = Dayjs(deleteDate).format('YYYY-MM-DD')
      const isBeforeDelDate = Dayjs(today).isBefore(delDate)
      if (isBeforeDelDate) return this.$t('task.TODO.beDeleted') // '삭제 예정' : 삭제 일 > 오늘
      else if (Dayjs(today).isSame(delDate)) return this.$t('common.TERMS.deleting') // '삭제 중' : 삭제 일 = 오늘
      else if (!isBeforeDelDate) return this.$t('common.ALERT.BASE.038')// '삭제 실패' : 삭제 일 < 오늘
    },
    async getClusters () {
      await this.$store.dispatch('cluster/getClusters', ['clusterUuid', 'clusterName'])
      this.clusters = this.$store.state.cluster.clusterList
    },
    getClusterName (data) {
      return this.clusters.find(item => item.clusterUuid === data.clusterUuid)
    },
    filtering () {
      if (this.filteredIsUrgent === '' && !this.filterCreateTypeRegisterChecked) this.filteredData = this.tableData
      else {
        this.filteredData = this.tableData.filter(item => {
          let result = true
          // 분류
          if (typeof this.filteredIsUrgent === 'boolean') result = result && (item.isUrgent === this.filteredIsUrgent)

          // CMP 외부 생성 자원 보기 (미등록 -> 등록)
          if (this.filterCreateTypeRegisterChecked) result = result && (item?.createType === 'REGISTER')

          return result
        })
      }
    },
    beforeCloseModal (done) {
      this.$confirm(this.$v('내용을 저장하지 않고 취소하시겠습니까?'))
        .then(() => {
          done()
        }).catch(() => false)
    },
    async init () {
      await this.getShareList()
      // await this.onSaveGridState()
      await this.filtering()
      // if (this.originGridState) this.onRestoreGridState()
    },
    async getShareList (params = {}) {
    // async getShareList () {
      try {
        this.isGetShareRequest = true
        if (this.selectedProjectInfo) params = this.selectedProjectInfo
        const data = await API.compute.getShareList(params)
        console.log('@getShareList', data)
        await this.shareInfoSetting(data)
      } catch (error) {
        console.error(error)
        this.tableData = []
        throw error
      } finally {
        this.isGetShareRequest = false
      }
    },
    /**
     * 테이블에 뿌려지는 볼륨그룹 데이터 가공
     */
    shareInfoSetting (data) {
      if (!data) {
        this.tableData = []
        return
      }
      // let cate = ''
      for (let i = 0; i < data.length; i++) {
        const cate = this.netCateList.find(item => {
          return item.ipCategoryIdx === data[i].cateIdx
        })
        // 클러스터 정보
        if (data[i].clusterUuid) {
          const clusterInfo = this.getClusterName(data[i])
          Object.assign(data[i], {
            clusterName: clusterInfo?.clusterName
          })
        }
        let blocking
        if (data[i].fileBlocking) {
          blocking = data[i].fileBlocking === '[]' ? '-' : data[i].fileBlocking.replace(/[[\]]/g, '')
        }
        Object.assign(data[i], {
          cateName: cate?.cateKey,
          networkList: cate ? [cate] : [],
          shareUsedSpaceByte: Number(data[i].shareUsedSpaceByte),
          fileBlocking: blocking
        })
      }
      this.tableData = [...data].sort((a, b) => {
        if (a.createTime < b.createTime) return 1
        else if (a.createTime > b.createTime) return -1
        else return 0
      })
      // this.tableData.forEach(row => {
      //   if (row.status === 'START' || row.deleteDate) row.disable = true // '작업' 상태일 때, 체크박스 disable 처리)
      //   else row.disable = false
      // })
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

    /**
     * 체크 된 항목 컨트롤
     * 체크박스 개선사항 요청으로 1개의 체크박스 선택 시 다른 체크박스는 모두 해제되게끔 처리(22.11.07)
     * @link https://its.seowoninfo.com/issues/5103
     */
    setCheckedItems (items) {
      let checkedRows = []
      let checkedRowsIdx = []
      if (items?.length) {
        const beforeCheckedUserShareIdx = [...this.checkedItemsUserShareIdx]

        const newRow = beforeCheckedUserShareIdx.length
          ? items.find(row => !beforeCheckedUserShareIdx.includes(row.userShareIdx))
          : items[0]

        checkedRows = newRow ? [{ ...newRow }] : []
        checkedRowsIdx = newRow
          ? [newRow.userShareIdx]
          : []
      }
      this.checkedItems = checkedRows
      this.checkedItemsUserShareIdx = checkedRowsIdx

      this.tableData.forEach(row => {
        if (row.status === 'START' || row.deleteDate) row.disable = true // '작업' 상태일 때, 체크박스 disable 처리)
        // if (row.status === 'START') row.disable = true // '작업' 상태일 때, 체크박스 disable 처리)
        else row.disable = false

        row.checked = this.checkedItemsUserShareIdx.includes(row.userShareIdx)
      })
    },

    /**
     * 상단 필터 관-조-프 필터링 시, 발생 이벤트
     */
    async searchFiles (payload) {
      this.selectedProjectInfo = payload
      console.log(this.selectedProjectInfo)
      await this.init()
    },

    /**
     * 자원 생성/수정 > '저장' 발생 이벤트
     * @param {Object} payload 저장 시, API 전송 데이터
     */
    confirmSave (saveData) {
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

      const userShareIdx = payload.requestData.userShareIdx

      if (!userShareIdx) { // 생성
        this.$confirm(this.$v('자원을 생성하시겠습니까?')).then(async () => {
          const result = await this.createShare(payload)
          if (result) this.modal.controlShare = false

          this.cancelToken.cancel()
        }).catch(() => false)
      } else {
        this.updatePayloadData = {
          ...saveData,
          originSharName: this.checkedItems[0].shareName
        }
        if (this.updatePayloadData) {
          this.checkShareName = ''
          this.modal.passUpdate = true
        }
      }
    },
    /**
   * share 생성 이벤트
   */
    async createShare (payload) {
      try {
        this.loading.create = true
        console.log('@createShare: ', payload)
        const result = await API.work_v3.createNxShare(payload)

        if (result) {
          this.$alert(this.$v('NAS 생성 작업이 요청되었습니다.<br>{shareName}', { shareName: payload.requestData.shareName }), {
            dangerouslyUseHTMLString: true,
            callback: () => false
          })
          this.init()
          return true
        } else return false
      } catch (error) {
        console.error(error)
        this.$alert(this.$v('생성에 실패하였습니다.<br>관리자 문의 부탁드립니다.'), { dangerouslyUseHTMLString: true })
        throw error
      } finally {
        this.loading.create = false
      }
    },
    async confirmUpdate (saveData = this.updatePayloadData) {
      const {
        // beforePrice,
        isUrgent,
        // price,
        ...rest
      } = saveData

      const payload = {
        // beforePrice,
        groupIdx: saveData.groupIdx,
        groupName: saveData.groupName,
        isUrgent: !!isUrgent, // 긴급 여부(긴급 = true, 일반 = false)
        // price,
        projectIdx: saveData.projectIdx,
        requestData: rest, // 기존 orderData
        service: 'FILE_SERVER',
        userId: this.user.userId,
        userName: this.user.userName
      }

      this.$confirm(this.$v('자원을 변경하시겠습니까?')).then(async () => {
        const result = await this.updateShare(payload)
        if (result) {
          this.modal.passUpdate = false
          this.modal.controlShare = false
          this.setCheckedItems([])
        }

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
    async setUpdateShareData () {
      if (this.checkedItems?.length !== 1) return
      this.cancelToken = axios.CancelToken.source()

      this.updateShareData = this.checkedItems[0]
      this.modal.controlShare = true
    },
    routeTo (to) {
      this.$router.push(to)
    },
    selectRow (rowGroup) {
      console.log('@selectRow', rowGroup.dataItem)
      if (!rowGroup) return

      this.routeTo({
        name: 'set-resource-share-detail',
        params: {
          shareIdx: rowGroup.dataItem.userShareIdx
        }
      })
    }
  },
  data: (root) => ({
    tableData: [],
    shareColumns: [
      { binding: 'createType', header: ' ', width: 70, customHtml: true, filtable: false },
      { binding: 'projectName', header: root.$v('프로젝트 명'), customHtml: true },
      { binding: 'shareName', header: root.$v('Share 이름'), customHtml: true },
      { binding: 'isUrgent', header: root.$v('분류'), customHtml: true },
      { binding: 'cateName', header: root.$v('네트워크 카테고리'), customHtml: true },
      { binding: 'fileServerName', header: root.$v('연결된 파일 서버'), customHtml: true },
      { binding: 'protocolType', header: root.$v('프로토콜 타입'), customHtml: true },
      { binding: 'mountPath', header: root.$v('마운트 경로'), customHtml: true },
      { binding: 'shareConnection', header: root.$v('연결된 VM 개수'), customHtml: true },
      { binding: 'shareUsedSpaceByte', header: root.$v('현재 사용량'), customHtml: true },
      { binding: 'maxSizeGiB', header: root.$v('할당량'), customHtml: true }
    ],
    netCateList: [],

    cancelToken: null,
    totalResultCnt: 0,
    // isProgressVg: false, // 작업 중인 자원이 1개라도 있는지?
    updateShareData: null, // 업데이트 할 share 자원 정보
    checkedItems: [], // 체크 된 Share
    checkedItemsUserShareIdx: [],
    checkShareName: '', // 스토리지 변경/삭제 > 스토리지명 확인 시, 입력한 스토리지명
    updatePayloadData: null, // 업데이트 시, payload
    modal: {
      controlShare: false, // NAS 생성/변경 모달
      passUpdate: false // 변경 -> 스토리지명 동일 입력 확인 모달
    },
    selectedProjectInfo: {}, // 관-조-프 정보
    isGetShareRequest: false,
    originGridState: null, // 인터벌 돌기 전, 그리드의 sorting/filtering 상태 저장

    loading: { detail: false },

    filteredIsUrgent: '', // 필터링 > 구분
    filterCreateTypeRegisterChecked: false, // 필터링 > CMP 외부 생성 자원 보기 (미등록 -> 등록)
    isUrgentOptions: [
      { value: '', label: '전체' },
      { value: false, label: '일반' },
      { value: true, label: '긴급' }
    ],
    filteredData: [],
    grid: null,
    clusters: [],
    availableFileServerCnt: 0
  })
}
</script>

<style lang="scss" scoped>
  .set-resource-volume-group-list {
    .table-top-wrap {
      .button-area {
        .change {
          margin-right: 10px;
        }
      }
    }
    .total-count-wrap {
      .flex-wrap { margin-left: 30px; gap: 30px; }
    }
    .new-tag-wh {
      display: inline-block;
      // padding: 0 $gap-s;
      width: 16px;
      height: 16px;
      line-height: 14px;
      text-align: center;
      color: $white;
      font-weight: bold;
      background-color: $primary;
      border: 1px solid $primary;
      font-size: 11px;
      &.-delete {
        padding: 0 2px;
        width: auto;
        font-weight: normal;
        background-color: $input-placeholder;
        border-color: $input-placeholder;
      }
    }
  }
</style>

<style lang="scss">
  .set-resource-volume-group-list {
    // 인터벌 + 페이지네이션 때 알 수 없는 스크롤바 생김 방지
    .route-detail-grid {
      .wj-content {
        & > div {
          div[wj-part=root] {
            overflow: hidden !important;
          }
        }
      }
    }
  }
</style>
