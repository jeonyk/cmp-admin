<!--
  * 파일명 : SetResourceVolumeGroupList.vue
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
      v-if="!isOnlyGrid"
      cloud-type="private"
      :table-data="filteredData"
      @search="searchVolumeGroup"
      @reset="filteredIsUrgent = ''"
    >
      <section class="filter-form">
        <span class="filter-name">{{ $v('긴급 처리 여부') }}</span>
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
            updateVolData = null
          }"
        >
          {{ $v('자원 추가') }}
        </button>
      </div>
    </section>

    <section class="table-area">
      <cmp-grid
        class="route-detail-grid"
        v-loading="!this.interval ? loading.isGetStorageRequest : false"
        :init-custom-action="flex => grid = flex"
        :custom-init-filter="filter => this.gridFilter = filter"
        :item-source="filteredData"
        :columns="vgColumns"
        :use-excel-download="!isOnlyGrid"
        :changing-page-reset="false"
        @selectedRow="selectRow"
        @checkedRowsData="(items) => setCheckedItems(items)"
        @clickDisabledCheckbox="clickDisabled"
        @total-count="cnt => totalResultCnt = cnt"
        selectable
        use-checkbox
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
        <template #storageName="props">
          <div
            class="flex-wrap"
            style="align-items: center; gap: 5px;"
          >
            <span
              v-if="props.row.createTime > new Date(Date.now() - ( 3600 * 1000 * 24))"
              class="new-tag-wh"
            >N</span>
            <!-- NEW 태그 : 만들어진지 하루 지나면 사라짐 -->

            <span
              v-if="props.row.deleteDate"
              class="new-tag-wh -delete"
            >{{ setDeleteDateState(props.row.deleteDate) }}</span>
            <!-- 삭제 예정/중/실패 태그 -->

            {{ props.row.storageName || '-' }}
          </div>
        </template>
        <template #diskSum="props">
          {{ props.row.disks |volumnGroupSize('vmDiskSizeBytes')| byte }}
        </template>

        <template #vms="{ row }">
          <div v-if="row.vms && row.vms.length">
            <span
              v-if="row.vms.length > 1"
            >{{ row.vms[0].hostname }} {{ $t('common.TERMS.other') }}
              <el-tooltip
                placement="bottom-end"
                popper-class="panel-title-popper"
                effect="light"
              >
                <template #content>
                  <span v-html="ArrayjoinWithHtml(row.vms)" />
                </template>
                <span>{{ row.vms.length - 1 }}</span>
              </el-tooltip>
            </span>

            <span v-else>{{ row.vms[0].hostname }}</span>
          </div>
          <span v-else>-</span>
        </template>
      </cmp-grid>
    </section>

    <!-- 모달 -->
    <!-- 자원 추가/변경 -->
    <el-dialog
      :visible.sync="modal.controlVg"
      :title="updateVolData
        ? `${$v('자원 변경')}`
        : `${$v('자원 추가')}`"
      :before-close="beforeCloseModal"
      width="1100px"
      top="5vh"
      @close="modal.controlVg = false"
    >
      <nx-storage-update-form
        v-if="modal.controlVg"
        v-loading="loading.detail"
        :data="updateVolData"
        :project-idx="updateVolData
          ? updateVolData.projectIdx
          : (selectedProjectInfo ? selectedProjectInfo.projectIdx : undefined)"
        :user-info="user"
        @close="modal.controlVg = false"
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
        v-html="$v('<b>{storageName}</b>을 {state}하시겠습니까?<br>스토리지 명을 동일하게 입력해주세요.', {
          storageName: checkedItems[0].storageName,
          state: $i18n.locale === 'en' ? 'change' : '변경'
        })"
      />
      <!-- {storageName}을 변경하시겠습니까?<br>스토리지 명을 동일하게 입력해주세요. -->

      <el-input
        v-model="checkStorageName"
        :placeholder="$v('스토리지 명을 입력해주세요.')"
        @keyup.native.enter="e => {
          if(checkedItems[0].storageName !== checkStorageName) return
          confirmUpdate()
        }"
      />
      <small
        class="-reference"
        v-if="!checkStorageName"
      >*&nbsp;{{ $v('스토리지 명을 입력해주세요.') }}</small>

      <small
        class="-reference"
        v-else-if="checkedItems[0].storageName !== checkStorageName"
      >*&nbsp;{{ $v('스토리지 명이 올바르지 않습니다.') }}</small>

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
          :disabled="checkedItems[0].storageName !== checkStorageName"
        >
          {{ $v('변경') }}
        </button>
      </div>
    </el-dialog>
  </div>
</template>
<script>
import API, { ResourceFilterComponent, NXStorageUpdateForm } from '@sd-fe/cmp-core'
import Dayjs from 'dayjs'
import axios from 'axios'
import { SortDescription } from '@grapecity/wijmo'
import { cloneDeep } from 'lodash'

import CreateByCMPTag from '@/components/Tag/CreateByCMPTag'
import SetResourceVolumeMixins from '../SetResourceVolume.mixins.js'

export default {
  name: 'SetResourceVolumeGroupList',
  mixins: [SetResourceVolumeMixins],
  components: {
    ResourceFilterComponent,
    'created-by-cmp-tag': CreateByCMPTag,
    'nx-storage-update-form': NXStorageUpdateForm
  },

  async mounted () {
    this.filteredData = [...this.tableData]

    if (!this.isOnlyGrid) {
      this.init()
      await this.getVgInterval()
    } else {
      this.init()
    }
  },
  beforeDestroy () {
    this.clearGetVgInterval()
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
  watch: {
    searchedTags: {
      immediate: true,
      deep: true,
      handler (val) {
        this.filteredData = this.filterGridSearchedTags(val)
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
          tags.serviceType === 'STORAGE' && String(el.userVgIdx) === tags.resourceId
        )
      })
      // 자원태그 검색화면에서 사용하는 이벤트입니다.
      this.$emit('change', result.length || 0)
      return result
    },
    async init () {
      await this.getVolumeGroupsList()
    },
    async getVolumeGroupsList (payload = this.selectedProjectInfo) {
      try {
        console.log('getVolumeGroupsList')
        this.isGetStorageRequest = true

        let data = []
        payload.isProgress = true
        data = await API.compute.getVolumeGroupsList(payload)

        await this.vgInfoSetting(data)
      } catch (error) {
        console.error(error)
        // const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.tableData = []
        // this.$alert(message)
        throw error
      } finally {
        this.isGetStorageRequest = false
      }
    },
    /**
     * 볼륨그룹 상세 정보 조회
     * @param {Number} userVgIdx
     */
    async getVolumeGroupDetail (userVgIdx) {
      try {
        this.loading.detail = true
        const data = await API.compute.getVolumeGroupDetail(userVgIdx, { isProgress: true }, this.cancelToken)

        return data
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.tableData = []
        this.$alert(message)
        throw error
      } finally {
        this.loading.detail = false
      }
    },
    /**
     * 테이블에 뿌려지는 볼륨그룹 데이터 가공
     */
    async vgInfoSetting (data) {
      if (!data) {
        this.tableData = []
        return
      }

      const allStatus = []

      for (let i = 0; i < data.length; i++) {
        data[i].isUrgent = !!data[i]?.isUrgent

        data[i].controllerAvgIoLatencyUsecs = Number(data[i].controllerAvgIoLatencyUsecs)
        data[i].controllerIoBandwidthKbps = Number(data[i].controllerIoBandwidthKbps)
        data[i].controllerNumIops = Number(data[i].controllerNumIops)

        if (data[i].disks) {
          const sumDiskSize = data[i].disks.reduce((acc, cur) => acc + cur.vmDiskSizeBytes, 0)
          data[i].diskSum = this.$options.filters.byte(sumDiskSize)
          data[i].checked = this.checkedItemsUserVgIdx.includes(data[i].userVgIdx)
        }

        data[i].storageName = data[i]?.storageName || data[i]?.vgName // 미등록 자원 vgName으로 들어온다.

        allStatus.push(data[i].status)
      }
      this.tableData = [...data].sort((a, b) => {
        if (a.createTime < b.createTime) return 1
        else if (a.createTime > b.createTime) return -1
        else return 0
        // const isNew = (item) => item.createTime > new Date(Date.now() - (3600 * 1000 * 24))

        // if (isNew(a) < isNew(b)) return 1
        // else if (isNew(a) > isNew(b)) return -1
        // else return 0
      })

      // this.setCheckedItems(this.checkedItems)

      this.tableData.forEach(row => {
        if (row.status === 'START' || row.deleteDate || row.isUrgent) row.disable = true // '작업' 상태일 때, 긴급 자원일 때 체크박스 disable 처리)

        // if (row.status === 'START') row.disable = true // '작업' 상태일 때, 체크박스 disable 처리)
        else row.disable = false
      })
      await this.updateMainGrid()

      if (this.isOnlyGrid) {
        this.initList = cloneDeep(this.tableData)
        this.$emit('getGrid', true)
      }
    },
    /**
     * 호스트명, VM 상태, 클러스터, 노드 필터링 이벤트
     */
    filtering () {
      if (
        this.filteredIsUrgent === '' &&
        !this.filterCreateTypeRegisterChecked
      ) this.filteredData = this.tableData
      else {
        this.filteredData = this.tableData.filter(item => {
          let result = false
          // 분류
          if (typeof this.filteredIsUrgent === 'boolean') result = (item.isUrgent === this.filteredIsUrgent)

          // CMP 외부 생성 자원 보기 (미등록 -> 등록)
          if (this.filterCreateTypeRegisterChecked) result = item?.createType === 'REGISTER'

          return result
        })
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
        const beforeCheckedUserVgIdx = [...this.checkedItemsUserVgIdx]

        const newRow = beforeCheckedUserVgIdx.length
          ? items.find(row => !beforeCheckedUserVgIdx.includes(row.userVgIdx))
          : items[0]

        checkedRows = newRow ? [{ ...newRow }] : []
        checkedRowsIdx = newRow
          ? [newRow.userVgIdx]
          : []
      }
      this.checkedItems = checkedRows
      this.checkedItemsUserVgIdx = checkedRowsIdx

      this.tableData.forEach(row => {
        if (row.status === 'START' || row.deleteDate || row.isUrgent) row.disable = true // '작업' 상태일 때, 긴급 자원일 때 체크박스 disable 처리)
        // if (row.status === 'START') row.disable = true // '작업' 상태일 때, 체크박스 disable 처리)
        else row.disable = false

        row.checked = this.checkedItemsUserVgIdx.includes(row.userVgIdx)
      })
    },
    /**
     * 그리드의 disable 체크박스 클릭 시, 발생 이벤트
     */
    clickDisabled (row) {
      if (row.deleteDate) return this.$alert(this.$v('삭제 예정 자원입니다.'), () => false)
      if (row.status === 'START') return this.$alert(this.$v('작업 중인 자원입니다.'), () => false)
      if (row.isUrgent) return this.$alert('긴급 자원은 읽기만 가능합니다.', () => false)
    },
    /**
     * 상단 필터 관-조-프 필터링 시, 발생 이벤트
     */
    async searchVolumeGroup (payload) {
      this.selectedProjectInfo = payload
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
        tagInfo,
        ...rest
      } = saveData

      const userVgIdx = saveData?.userVgIdx
      const isNew = !userVgIdx

      const payload = {
        beforePrice,
        groupIdx: saveData.groupId,
        groupName: saveData.groupName,
        isUrgent: !!isUrgent, // 긴급 여부(긴급 = true, 일반 = false)
        price,
        projectIdx: saveData.projectId,
        requestData: {
          ...rest,
          ...(isNew && {
            tagInfo: tagInfo || []
          })
        },
        service: 'STORAGE',
        userId: this.user.userId,
        userName: this.user.userName
      }

      if (isNew) { // 생성
        this.$confirm(this.$v('자원을 생성하시겠습니까?')).then(async () => {
          const result = await this.createVg(payload)
          if (result) this.modal.controlVg = false

          this.cancelToken.cancel()
        }).catch(() => false)
      } else {
        this.updatePayloadData = {
          ...saveData,
          originStorageName: this.checkedItems[0].storageName
        }
        if (this.updatePayloadData) {
          this.checkStorageName = ''
          this.modal.passUpdate = true
        }
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
        this.modal.controlVg = false
        this.setCheckedItems([])
      }
    },
    async setUpdateVgData () {
      if (this.checkedItems?.length !== 1) return
      this.cancelToken = axios.CancelToken.source()

      const vgDetail = await this.getVolumeGroupDetail(
        this.checkedItems[0].userVgIdx
      )
      this.updateVolData = {
        ...vgDetail,
        beforeData: cloneDeep(vgDetail)
      }
      this.modal.controlVg = true
    },
    routeTo (to) {
      this.$router.push(to)
    },
    selectRow (rowGroup) {
      if (!rowGroup) return

      this.routeTo({
        name: 'set-resource-storage-detail',
        params: rowGroup.dataItem
      })
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
    /**
     * 배열 순회하며 <br/>로 묶어서 리턴
     * @param {Array} list 순회 할 배역
     */
    ArrayjoinWithHtml (list, name = 'hostname') {
      if (list.length <= 1) return

      let revealText = ''

      for (let i = 1; i < list.length; i++) {
        const unit = () => {
          if (i === 1) return ''
          return (i % 2 ? ',<br>' : ', ')
        }

        revealText += (unit() + list[i][name])
      }
      return revealText
    }
  },
  data (root) {
    return {
      initList: [],
      cancelToken: null,
      totalResultCnt: 0,
      // isProgressVg: false, // 작업 중인 자원이 1개라도 있는지?
      updateVolData: null, // 업데이트 할 volumeGroup 자원 정보
      checkedItems: [], // 체크 된 스토리지
      checkedItemsUserVgIdx: [],
      checkStorageName: '', // 스토리지 변경/삭제 > 스토리지명 확인 시, 입력한 스토리지명
      updatePayloadData: null, // 업데이트 시, payload
      modal: {
        controlVg: false, // 스토리지 생성/변경 모달
        passUpdate: false // 변경 -> 스토리지명 동일 입력 확인 모달
      },
      selectedProjectInfo: {}, // 관-조-프 정보
      isGetStorageRequest: false,
      originGridState: null, // 인터벌 돌기 전, 그리드의 sorting/filtering 상태 저장

      loading: { detail: false },

      filteredIsUrgent: '', // 필터링 > 구분
      filterCreateTypeRegisterChecked: false, // 필터링 > CMP 외부 생성 자원 보기 (미등록 -> 등록)
      isUrgentOptions: [
        { value: '', label: '전체' },
        { value: false, label: '일반' },
        { value: true, label: '긴급' }
      ],

      tableData: [],
      filteredData: [],
      vgColumns: [
        { binding: 'createType', header: ' ', width: 80, customHtml: true, filtable: false },
        { binding: 'projectName', header: root.$v('프로젝트 명'), width: 200, align: 'left' },
        { binding: 'isUrgent', header: root.$v('긴급 처리 여부'), width: 100, customHtml: true },
        { binding: 'storageName', header: root.$v('Volume 그룹명'), width: 300, align: 'left', customHtml: true },
        { binding: 'diskSum', header: root.$v('크기(신청 용량)'), width: 150 },
        { binding: 'storageDesc', header: root.$v('Volume 설명'), align: 'left', customHtml: true }
        // { binding: 'vms', header: root.$v('연결된 호스트 정보'), customHtml: true }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
  .set-resource-volume-group-list {
    .total-count-wrap {
      .flex-wrap { margin-left: 30px; gap: 30px; }
    }
    .new-tag-wh {
      display: inline-block;
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
