<template>
  <div
    v-loading="isGetDetailData"
    class="set-resource-vmware-vsan-list"
  >
    <resource-filter-component
      v-if="!isOnlyGrid"
      cloud-type="private"
      module-type="VMWARE"
      @search="searchList"
      @reset="filteredIsUrgent = ''"
    >
      <section class="filter-form">
        <!-- 분류 -->
        <span class="filter-name">{{ $v('긴급 처리 여부') }}</span>
        <div class="filter-options">
          <el-select
            v-model="filteredIsUrgent"
            :placeholder="$v('긴급 처리 여부')"
            :popper-append-to-body="false"
            @change="updateMainGrid()"
          >
            <el-option
              v-for="option in isUrgentOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </div>
      </section>
    </resource-filter-component>

    <section
      class="table-top-wrap"
      v-if="!isOnlyGrid"
    >
      <total-count
        class="total-count-wrap"
        :total-count="totalResultCnt"
      >
        <div class="flex-wrap">
          <el-checkbox
            v-model="filterCreateTypeRegisterChecked"
            @change="updateMainGrid()"
          >
            {{ $v('CMP 외부 생성 자원 보기') }}
          </el-checkbox>
        </div>
      </total-count>
      <div class="button-area -right">
        <button
          class="button"
          type="is-primary"
          v-if="checkedItems.length"
          :disabled="checkedItems.length > 1 || checkedItems[0] && checkedItems[0].status === 'PROGRESS'"
          @click="e => {
            setUpdateVgData()
          }"
        >
          {{ $v('변경') }}
        </button>
        <button
          class="button"
          type="is-primary"
          @click="e => {
            modal.controlVg = true
            updatingData = null
          }"
        >
          iSCSI 대상 추가
        </button>
      </div>
    </section>

    <section class="table-area">
      <cmp-grid
        class="route-detail-grid"
        v-loading="!this.interval ? loading.isGetList : false"
        :init-custom-action="flex => this.grid = flex"
        :custom-init-filter="filter => this.gridFilter = filter"
        :item-source="filteredData"
        :columns="columns"
        :init-auto-select-row="checkedItems"
        init-auto-select-row-key="userIscsiIdx"
        :use-excel-download="!isOnlyGrid"
        :changing-page-reset="false"
        @selectedRow="selectRow"
        @checkedRowsData="setCheckedItems"
        @clickDisabledCheckbox="clickDisabled"
        @total-count="cnt => totalResultCnt = cnt"
        selectable
        :use-checkbox="!isOnlyGrid"
        page-keeping
      >
        <template #createType="{ row }">
          <created-by-cmp-tag v-if="row.createType !== 'REGISTER'" />
          <span v-else />
        </template>

        <template #isUrgent="{ row }">
          {{ row.isUrgent ? '긴급' : '일반' }}
        </template>
        <!-- 분류 -->

        <template #alias="{ row }">
          <div
            class="flex-wrap"
            style="align-items: center; gap: 5px;"
          >
            <span
              v-if="row.createTime > new Date(Date.now() - ( 3600 * 1000 * 24))"
              class="new-tag-wh"
            >N</span>
            <!-- NEW 태그 : 만들어진지 하루 지나면 사라짐 -->

            <span
              v-if="row.deleteDate"
              class="new-tag-wh -delete"
            >{{ setDeleteDateState(row.deleteDate) }}</span>
            <!-- 삭제 예정/중/실패 태그 -->

            {{ row.alias || '-' }}
          </div>
        </template>
        <!-- 별칭 -->

        <template #status="{ row }">
          <template v-if="row.status">
            <cmp-status-tag
              :type="{
                PROGRESS: 'is-loading',
                healthy: 'is-info'
              }[row.status] || 'is-undefined'"
              :line-style="true"
              :style="{width: row.status === 'PROGRESS' ? '75px' : '60px'}"
            >
              {{ {
                PROGRESS: 'Progress',
                healthy: '정상'
              }[row.status] || '비정상' }}
            </cmp-status-tag>
          </template>
          <span v-else>-</span>
        </template>

        <template #lun="{ row }">
          <el-tooltip
            effect="light"
            placement="top"
            :disabled="!row.lunCount"
          >
            총 <span>{{ row.lunCount || 0 }}개</span>
            <div
              v-if="row.lunList"
              slot="content"
            >
              <span
                v-for="lunItem in row.lunList"
                :key="lunItem.lunId"
              >
                ID: {{ lunItem.lunId }}
                ,&nbsp;{{ $v('용량') }}: {{ lunItem.lunSize | byte }}
              </span>
            </div>
          </el-tooltip>
        </template>
        <!-- LUN -->

        <template #port="{ row }">
          {{ row.port }}
        </template>

        <template #authSpecAutoType="{ row }">
          {{ authTypes[row.authSpecAutoType] }}
        </template>
      </cmp-grid>
    </section>

    <!-- 모달 -->
    <!-- 자원 추가/변경 -->
    <el-dialog
      v-if="!isOnlyGrid"
      :visible.sync="modal.controlVg"
      :title="updatingData ? $v('자원 변경') : $v('자원 추가')"
      :before-close="beforeCloseModal"
      width="1100px"
      top="5vh"
      @close="modal.controlVg = false"
    >
      <vmware-iscsi-update-form
        v-if="modal.controlVg"
        v-loading="loading.detail"
        @close="modal.controlVg = false"
        @save="confirmSave"
        :data="updatingData"
        :project-idx="updatingData
          ? updatingData.projectIdx
          : (selectedProjectInfo ? selectedProjectInfo.projectIdx : undefined)"
        :user-info="user"
        in-admin
      />
    </el-dialog>

    <!-- 자원 변경 -> 스토리지명 동일 입력 확인 모달 -->
    <el-dialog
      v-if="!isOnlyGrid && checkedItems.length && updatePayloadData && updatePayloadData.requestData"
      :visible.sync="modal.passUpdate"
      width="350px"
      @close="modal.passUpdate = false"
      class="pass-name-form"
    >
      <span
        class="name-form-noti"
        v-html="$t('common.ALERT.STORAGE.003', {storageName: updatePayloadData.requestData.storageName})"
      />
      <!-- {storageName}을 변경하시겠습니까?<br>스토리지 명을 동일하게 입력해주세요. -->

      <el-input
        v-model="checkResourceName"
        :placeholder="$t('common.ALERT.STORAGE.001')"
      />
      <small
        class="-reference"
        v-if="!checkResourceName"
      >*&nbsp;{{ $t('common.ALERT.STORAGE.001') }}</small>
      <!-- 스토리지명을 입력해주세요. -->

      <small
        class="-reference"
        v-else-if="updatePayloadData.requestData.storageName !== checkResourceName"
      >*&nbsp;{{ $t('common.ALERT.STORAGE.002') }}</small>
      <!-- 스토리지 명이 올바르지 않습니다. -->

      <div class="modal-button-area">
        <button
          class="button -modal-button"
          type="is-anti"
          @click="modal.passUpdate = false"
        >
          <!-- 취소 -->
          {{ $t('common.BTN.cancel') }}
        </button>
        <button
          class="button -modal-button"
          @click="confirmUpdate()"
          type="is-primary"
          :disabled="updatePayloadData.requestData.storageName !== checkResourceName"
        >
          <!-- 변경 -->
          {{ $t('common.BTN.change') }}
        </button>
      </div>
    </el-dialog>
  </div>
</template>
<script>
import { mapState, mapGetters } from 'vuex'
import axios from 'axios'
import { cloneDeep } from 'lodash'
import API, { ResourceFilterComponent, VMwareIscsiUpdateForm } from '@sd-fe/cmp-core'
import Dayjs from 'dayjs'
import { SortDescription } from '@grapecity/wijmo'

import CreateByCMPTag from '@/components/Tag/CreateByCMPTag'
import SetResourceVmwareVsanIscsi from './SetResourceVmwareVsanIscsi.mixins.js'

export default {
  name: 'SetResourceVolumeGroupList',
  mixins: [SetResourceVmwareVsanIscsi],
  components: {
    ResourceFilterComponent,
    'created-by-cmp-tag': CreateByCMPTag,
    'vmware-iscsi-update-form': VMwareIscsiUpdateForm
  },
  props: {
    isOnlyGrid: {
      type: Boolean,
      default: false
    },
    searchedTags: {
      type: Array,
      default () {
        return []
      }
    }
  },
  computed: {
    ...mapState({
      user: state => state.auth.user,
      packageType: state => state.auth.packageType
    }),
    ...mapGetters({
      getProject: 'project/getProject'
    })
  },
  async created () {
    await this.init()
  },
  beforeDestroy () {
    this.clearGetVgInterval()
  },
  watch: {
    searchedTags: {
      immediate: true,
      deep: true,
      handler (val) {
        this.tableData = this.filterGridSearchedTags(val)
      }
    },
    'modal.controlVg' (newVal) {
      if (!newVal) this.updatePayloadData = null
    }
  },
  methods: {
    filterGridSearchedTags (searchedTags) {
      let result = cloneDeep(this.initList)

      // 검색된 자원태그가 없을경우 빈 배열을 반환합니다.
      if (!searchedTags || searchedTags.length === 0) {
        return []
      }

      result = this.initList.filter((el) => {
        return searchedTags.some((tags) =>
          tags.serviceType === 'VSAN_ISCSI' && String(el.userIscsiIdx) === tags.resourceId
        )
      })
      // 자원태그 검색화면에서 사용하는 이벤트입니다.
      this.$emit('change', result.length || 0)
      return result
    },
    async init () {
      await this.getExsiData()
      await this.getVsanIscsiList()
    },
    /**
     * filteredData를 세팅합니다.
     * 세팅 전, 그리드의 sorting / filtering 상태를 기억했다가 filteredData 세팅 후 다시 설정해줍니다.
     */
    async updateMainGrid () {
      await this.onSaveGridState()
      await this.filtering()
      if (this.originGridState) await this.onRestoreGridState()
    },
    async getVsanIscsiList () {
      try {
        this.isGetList = true
        const data = await API.vmware.vsan.getVsanIscsiList({
          isProgress: true,
          userId: this.user.userId,
          ...(this.selectedProjectInfo?.projectIdx && {
            projectIdx: this.selectedProjectInfo?.projectIdx
          }, this.cancelToken)
        })
        await this.listInfoMapping(data)
        if (!this.isOnlyGrid) this.getVgInterval()
      } catch (error) {
        this.tableData = []
        console.error(error)
        this.$alert('iSCSI 조회에 문제가 발생했습니다.', () => false)
        throw error
      } finally {
        this.isGetList = false
      }
    },
    /**
     * vSAN iSCSI 상세 조회
     */
    async getVsanIscsiDetail (userIscsiIdx) {
      try {
        this.isGetDetailData = true
        const data = await API.vmware.vsan.getVsanIscsiDetail(userIscsiIdx)

        return data
      } catch (error) {
        console.error(error)
      } finally {
        this.isGetDetailData = false
      }
    },
    /**
     * 테이블에 뿌려지는 볼륨그룹 데이터 가공
     */
    async listInfoMapping (data) {
      if (!data) {
        this.tableData = []
        return
      }

      const allStatus = []

      const list = data.map(iscsi => {
        const {
          userInfo,
          authSpecAutoType,
          vsanHealth,
          vsanObjectUuid,
          ...rest
        } = iscsi

        const projectInfo = this.getProject(userInfo?.projectIdx)

        const status = ['START', 'RUNNING'].includes(userInfo?.status) ? 'PROGRESS' : vsanHealth
        allStatus.push(status)

        return {
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
          isUrgent: userInfo?.isUrgent || false,
          userIscsiIdx: userInfo?.userIscsiIdx,
          deleteDate: userInfo?.deleteDate,
          createTime: userInfo?.createTime,
          checked: this.checkedItemsId.includes(userInfo?.userIscsiIdx),
          createType: userInfo?.createType
        }
      })

      this.tableData = [...list].sort((a, b) => {
        const isNew = (item) => item.createTime > new Date(Date.now() - (3600 * 1000 * 24))

        if (isNew(a) < isNew(b)) return 1
        else if (isNew(a) > isNew(b)) return -1
        else return (b.createTime - a.createTime)
      })
      if (this.isOnlyGrid) {
        this.initList = cloneDeep(this.tableData)
        this.$emit('getGrid', true)
      }
      await this.setCheckedItems(this.checkedItems)
    },
    /**
     * 체크 된 항목 컨트롤
     */
    setCheckedItems (items) {
      this.checkedItems = [...items]
      this.checkedItemsId = items.map(item => item.userIscsiIdx)
      this.tableData.forEach(row => {
        if (row.status === 'PROGRESS' || row.deleteDate || row.isUrgent) row.disable = true // '작업' 상태일 때, 긴급 자원일 때 체크박스 disable 처리)
        else row.disable = false
      })

      this.updateMainGrid()
    },
    /**
     * 그리드의 disable 체크박스 클릭 시, 발생 이벤트
     */
    clickDisabled (row) {
      if (row.deleteDate) return this.$alert(this.$v('삭제 예정 자원입니다.'), () => false)
      if (row.status === 'PROGRESS') return this.$alert(this.$v('작업 중인 자원입니다.'), () => false)
      if (row.isUrgent) return this.$alert('긴급 자원은 읽기만 가능합니다.', () => false)
    },
    /**
     * [API] 호스트(ESXi) 조회
     */
    async getExsiData () {
      try {
        this.isGetHostRequest = true
        console.log('getExsiData')
        const data = API.vmware.host.getVmwareHostList()
        this.esxiList = data
      } catch (err) {
        console.error(err)
        this.$alert(this.$v('호스트 리스트를 조회하지 못하였습니다.'), () => false)
      } finally {
        this.isGetHostRequest = false
      }
    },

    /**
     * 자원 생성/수정 > '저장' 발생 이벤트
     */
    confirmSave (saveData) {
      const isNew = !saveData.userIscsiIdx // 생성?

      const {
        beforePrice,
        isUrgent,
        price,
        tagInfo,
        ...rest
      } = saveData

      const payload = {
        beforePrice,
        groupIdx: saveData.groupIdx,
        groupName: saveData.groupName,
        projectIdx: saveData.projectIdx,
        isUrgent: !!isUrgent, // 긴급 여부(긴급 = true, 일반 = false)
        price,
        requestData: { // 기존 orderData
          ...rest,
          ...(isNew && {
            tagInfo: tagInfo || []
          })
        },
        service: 'VSAN_ISCSI',
        userId: this.user.userId,
        userName: this.user.userName
      }

      this.$confirm(isNew
        ? this.$v('자원을 생성하시겠습니까?')
        : this.$v('자원을 수정하시겠습니까?')).then(async () => {
        let result

        if (isNew) result = await this.createVsanIscsi(payload)
        else result = await this.updateVsanIscsi(payload)

        if (result) this.modal.controlVg = false

        this.cancelToken.cancel()
      }).catch(() => false)
    },
    /**
     * Storage 수정 시, '저장'
     */
    async confirmUpdate (payload) {
      if (!payload) return
      const result = await this.updateVsanIscsi(payload)
      if (result) {
        this.modal.passUpdate = false
        this.modal.controlVg = false
        this.setCheckedItems([])
      }
    },
    async setUpdateVgData () {
      if (this.checkedItems?.length !== 1) return
      this.cancelToken = axios.CancelToken.source()

      const detailInfo = await this.getVsanIscsiDetail(this.checkedItems[0].userIscsiIdx)
      if (detailInfo) {
        const userInfo = detailInfo?.userInfo
        const projectInfo = this.getProject(userInfo?.projectIdx)

        this.updatingData = {
          ...detailInfo,
          userIscsiIdx: userInfo?.userIscsiIdx,
          companyName: projectInfo?.companyName,
          companyIdx: projectInfo?.companyIdx,
          groupName: projectInfo?.groupName,
          groupIdx: projectInfo?.groupIdx,
          projectName: projectInfo?.projectName,
          projectIdx: projectInfo?.projectIdx,
          beforeData: cloneDeep(detailInfo)
        }
      }
      this.modal.controlVg = true
    },
    routeTo (to) {
      this.$router.push(to)
    },
    selectRow (rowGroup) {
      if (!rowGroup) return
      const row = rowGroup._data

      this.routeTo({
        name: 'vmware-storage-vsan-iscsi-detail',
        params: { idx: row.userIscsiIdx }
      })
    },
    /**
     * interval 전 그리드 sorting/filtering 저장
     */
    onSaveGridState () {
      if (!this.grid?.collectionView || !this.gridFilter) return
      const state = {
        filterDefinition: this.gridFilter.filterDefinition,
        sortDescriptions: this.grid.collectionView.sortDescriptions.map((sortDesc) => {
          return {
            property: sortDesc.property,
            ascending: sortDesc.ascending
          }
        })
      }
      this.originGridState = JSON.stringify(state)
    },
    /**
     * 저장 되었던 그리드 sorting/filtering 복구
     */
    onRestoreGridState () {
      const json = this.originGridState
      if (!json) return
      const state = JSON.parse(json)
      this.gridFilter.filterDefinition = state.filterDefinition
      const view = this.grid.collectionView
      if (!view) return
      view.deferUpdate(() => {
        view.sortDescriptions.clear()
        for (let i = 0; i < state.sortDescriptions.length; i++) {
          const sortDesc = state.sortDescriptions[i]
          view.sortDescriptions.push(
            new SortDescription(sortDesc.property, sortDesc.ascending)
          )
        }
      })
    },
    /**
     * deleteDate 존재 데이터에 삭제 예정/중/실패 표기
     */
    setDeleteDateState (deleteDate) {
      const today = Dayjs().format('YYYY-MM-DD')
      const delDate = Dayjs(deleteDate).format('YYYY-MM-DD')
      const isBeforeDelDate = Dayjs(today).isBefore(delDate)
      if (isBeforeDelDate) return this.$t('task.TODO.beDeleted')// '삭제 예정' : 삭제 일 > 오늘
      else if (Dayjs(today).isSame(delDate)) return this.$t('common.TERMS.deleting')// '삭제 중' : 삭제 일 = 오늘
      else if (!isBeforeDelDate) return this.$t('common.ALERT.BASE.038')// '삭제 실패' : 삭제 일 < 오늘
    },
    async searchList (payload) {
      this.selectedProjectInfo = payload
      await this.init()
    },
    /**
     * 호스트명, VM 상태 필터링 이벤트
     */
    filtering () {
      if (
        !this.selectedProjectInfo &&
      this.filteredIsUrgent === '' &&
      !this.filterCreateTypeRegisterChecked
      ) this.filteredData = this.tableData
      else {
        this.filteredData = this.tableData.filter(item => {
          let result = true
          if (this.selectedProjectInfo?.companyIdx) result = result && (item.companyIdx === this.selectedProjectInfo.companyIdx)
          if (this.selectedProjectInfo?.groupIdx) result = result && (item.groupIdx === this.selectedProjectInfo.groupIdx)
          if (this.selectedProjectInfo?.projectIdx) result = result && (item.projectIdx === this.selectedProjectInfo.projectIdx)

          if (typeof this.filteredIsUrgent === 'boolean') result = result && (item.isUrgent === this.filteredIsUrgent)

          // CMP 외부 생성 자원 보기 (미등록 -> 등록)
          if (this.filterCreateTypeRegisterChecked) result = item?.createType === 'REGISTER'
          return result
        })
      }
    },
    getEsxiNameByUuid (uuid) {
      if (!uuid) return ''

      return this.esxiList.find(esxi => esxi.hostUuid === uuid).name
    }
  },
  data (root) {
    return {
      initList: [],
      cancelToken: null,
      totalResultCnt: 0,
      // isProgressVg: false, // 작업 중인 자원이 1개라도 있는지?
      updatingData: null, // 업데이트 할 자원 정보
      checkedItems: [], // 체크 된 스토리지
      checkedItemsId: [],
      checkResourceName: '', // 스토리지 변경/삭제 > 스토리지명 확인 시, 입력한 스토리지명
      updatePayloadData: null, // 업데이트 시, payload
      modal: {
        controlVg: false, // 스토리지 생성/변경 모달
        passUpdate: false // 변경 -> 스토리지명 동일 입력 확인 모달
      },
      selectedProjectInfo: null, // 관-조-프 정보
      isGetList: false, // 목록 조회 로딩
      isGetDetailData: false, // 변경 > 상세 조회 로딩
      originGridState: null, // 인터벌 돌기 전, 그리드의 sorting/filtering 상태 저장

      loading: {
        detail: false,
        isGetHostRequest: false // 호스트 목록 조회
      },

      tableData: [],
      filteredData: [],
      esxiList: [],
      isUrgentOptions: [
        { value: '', label: '전체' },
        { value: false, label: '일반' },
        { value: true, label: '긴급' }
      ],
      filteredIsUrgent: '', // 핉터링 > 분류
      filterCreateTypeRegisterChecked: false, // 필터링 > CMP 외부 생성 자원 보기 (미등록 -> 등록)
      columns: [
        { binding: 'createType', header: ' ', width: 60, customHtml: true, filtable: false },
        { binding: 'projectName', header: root.$v('프로젝트 명'), align: 'left', width: 100 },
        { binding: 'isUrgent', header: root.$v('긴급 처리 여부'), width: 100, customHtml: true },
        { binding: 'clusterName', header: '클러스터 명' },
        { binding: 'iqn', header: 'IQN', align: 'left', width: 250 },
        { binding: 'alias', header: '별칭', align: 'left', customHtml: true },
        { binding: 'status', header: root.$v('상태'), width: 100, customHtml: true },
        { binding: 'lun', header: 'LUN', customHtml: true, width: 80 },
        { binding: 'networkInterface', header: '네트워크' },
        { binding: 'ioOwnerHostname', header: 'I/O 소유자 호스트' },
        { binding: 'port', header: 'TCP 포트' },
        { binding: 'spbmProfileName', header: '스토리지 정책' },
        { binding: 'authSpecAutoType', header: '인증', customHtml: true }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
  .set-resource-vmware-vsan-list {
    .total-count-wrap {
      .flex-wrap { margin-left: 30px; gap: 30px; }
    }
    .new-tag-wh {
      display: inline-block;
      min-width: 16px;
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
        min-width: 50px;
        font-weight: normal;
        background-color: $input-placeholder;
        border-color: $input-placeholder;
      }
    }
  }
</style>

<style lang="scss">
  .set-resource-vmware-vsan-list {
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
