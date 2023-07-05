<!--
  * 파일명 : SetResourceDatabaseList.vue
  * 파일 기능 : 구성관리 > 자원관리 > Database 정보 확인 기능, 필터링(관계사 / 조직 / 프로젝트) 기능
  * 작성자 : 이경환 외 4명
  * 최종 작성일 : 2021-01-27
  * License By Shinsegae I&C
  * 2021-01-27 fix: 그리드 데이터 로딩 UI 개선
 -->

<template>
  <div
    class="set-resource-database-list"
    :element-loading-text="$t('common.PLACEHOLDER.loading')"
  >
    <resource-filter-component
      v-if="!isOnlyGrid"
      cloud-type="private"
      :table-data="tableData"
      :company-options="[]"
      @search="params => {
        selectedProjectInfo = params
        getDatabases(params)
      }"
      @reset="() => {
        filteredIsUrgent = ''
      }"
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
          @click="openDBUpdateModal(true)"
        >
          {{ $v('자원 추가') }}
        </button>
      </div>
    </section>

    <section class="table-area">
      <cmp-grid
        class="route-detail-grid"
        v-loading="!this.interval ? loading.read : false"
        :init-custom-action="flex => this.grid = flex"
        :custom-init-filter="filter => this.gridFilter = filter"
        :item-source="filteredData"
        :columns="databaseColumns"
        :use-excel-download="!isOnlyGrid"
        :changing-page-reset="false"
        @selectedRow="selectRow(...arguments, databaseColumns)"
        @checkedRowsData="(items) => setCheckedItems(items)"
        @clickDisabledCheckbox="clickDisabled"
        @total-count="cnt => totalResultCnt = cnt"
        selectable
        page-keeping
      >
        <!-- use-checkbox -->
        <template #createType="{ row }">
          <created-by-cmp-tag v-if="row.createType !== 'REGISTER'" />
          <span v-else />
        </template>

        <template #isUrgent="{ row }">
          {{ row.isUrgent ? '긴급' : '일반' }}
        </template>
        <!-- 분류 -->

        <template #dbStatus="props">
          <template v-if="props.row.dbStatus || props.row.status">
            <cmp-status-tag
              :type="props.row.status === 'START' ? 'is-loading' : {
                ON: 'is-info',
                OFF: 'is-undefined',
              }[props.row.dbStatus]"
              :line-style="true"
              :style="{width: props.row.status === 'START' ? '75px' : '60px'}"
            >
              {{ props.row.status === 'START' ? 'Progress' : props.row.dbStatus }}
            </cmp-status-tag>
          </template>
          <span v-else>-</span>
        </template>
        <!-- 상태 -->

        <template #vcpu="props">
          {{ props.row.vcpu }} Core
        </template>
        <template #ip="props">
          <div>
            {{ props.row.ip || '-' }}
          </div>
          <small
            v-if="props.row.reqInfo &&
              props.row.reqInfo.networkList &&
              props.row.reqInfo.networkList.length"
            style="white-space: nowrap;"
          >
            ({{ props.row.reqInfo.networkList[0].cateKey || '-' }})
          </small>
        </template>
      </cmp-grid>
    </section>

    <!-- 미등록 DB 자원 최초 업데이트 -->
    <el-dialog
      :visible.sync="modal.controlDB"
      :title="updateDBData
        ? `${$v('자원 변경')}`
        : `${$v('자원 추가')}`"
      width="1300px"
      top="5vh"
      @close="modal.controlDB = false"
    >
      <nx-database-update-form
        v-if="modal.controlDB"
        v-loading="loading.createDb || loading.updateDb || loading.isGetDbDetail"
        :data="updateDBData"
        :project-idx="updateDBData
          ? updateDBData.projectIdx
          : (selectedProjectInfo ? selectedProjectInfo.projectIdx : undefined)"
        :user-info="user"
        @close="modal.controlDB = false"
        @save="confirmUpdate"
        in-admin
      />
    </el-dialog>
  </div>
</template>
<script>
import { cloneDeep } from 'lodash'
import API, { ResourceFilterComponent, NXDatabaseUpdateForm } from '@sd-fe/cmp-core'
import { mapState } from 'vuex'
import { SortDescription } from '@grapecity/wijmo'
import CreateByCMPTag from '@/components/Tag/CreateByCMPTag'
import SetResourceDatabaseMixins from './SetResourceDatabase.mixins.js'

export default {
  name: 'SetResourceDatabaseList',
  mixins: [SetResourceDatabaseMixins],
  components: {
    'created-by-cmp-tag': CreateByCMPTag,
    'nx-database-update-form': NXDatabaseUpdateForm,
    ResourceFilterComponent
  },
  computed: {
    ...mapState({
      user: state => state.auth.user,
      packageType: state => state.auth.packageType
    })
  },
  async mounted () {
    if (!this.isOnlyGrid) {
      this.init()
      await this.getDbInterval()
    } else {
      this.init()
    }
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
        this.tableData = this.filterGridSearchedTags(val)
      }
    }
  },
  beforeDestroy () {
    this.clearGetDbInterval()
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
          tags.serviceType === 'DATABASE' && String(el.userDbIdx) === tags.resourceId
        )
      })
      // 자원태그 검색화면에서 사용하는 이벤트입니다.
      this.$emit('change', result.length || 0)
      return result
    },
    routeTo (to) {
      this.$router.push(to)
    },
    selectRow (row, columns) {
      // console.log('@@ row : ', row)
      if (!row) return
      this.routeTo({
        name: 'set-resource-database-detail',
        params: {
          columns: columns,
          data: row.dataItem,
          databaseIdx: row.dataItem.userDbIdx
        }
      })
    },
    async init () {
      await this.getDatabases()
    },
    /**
     * API: 데이터베이스 목록 조회
     */
    async getDatabases (payload = this.selectedProjectInfo) {
      try {
        this.loading.read = true
        const param = { ...payload }
        param.isUser = false
        const response = await API.database.getDatabasesSimple(param)

        await this.dbInfoSetting(response)
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.tableData = []
        this.$alert(message)
        throw error
      } finally {
        this.loading.read = false
      }
    },
    async dbInfoSetting (data) {
      if (!data) {
        this.tableData = []
        return
      }

      for (let i = 0; i < data.length; i++) {
        const item = data[i]
        item.isUrgent = !!item?.isUrgent
        item.checked = this.checkedItemsUserDbIdx.includes(data[i].userVgIdx)

        item.frontInfo = {
          vcpu: item.vcpu ? item.vcpu + 'GB' : '',
          memory: item.memoryByte ? this.$options.filters.byte(item.memoryByte) : 0,
          dbUsageInfo: `${this.$options.filters.byte(item.dbUsageByte)} / ${this.$options.filters.byte(item.dbSizeByte)}` // 사용량/Total 정보
        }
      }

      this.tableData = [...data].sort((a, b) => {
        if (a.createTime < b.createTime) return 1
        else if (a.createTime > b.createTime) return -1
        else return 0
      })

      this.tableData.forEach(row => {
        if (row.status === 'START' || row.deleteDate || row.isUrgent) row.disable = true // '작업' 상태일 때, 긴급 자원일 때 체크박스 disable 처리)

        else row.disable = false
      })
      await this.updateMainGrid()

      if (this.isOnlyGrid) {
        this.initList = cloneDeep(this.tableData)
        this.$emit('getGrid', true)
      }
    },
    /**
     * API: 데이터베이스 상세 조회
     */
    async getDatabaseDetail (userDbIdx) {
      try {
        this.loading.isGetDbDetail = true
        const response = await API.database.getDatabase(userDbIdx)
        if (response) return response

        console.log('@상세 정보: ', response)
      } catch (error) {
        console.error(error)
        return null
      } finally {
        this.loading.isGetDbDetail = false
      }
    },
    /**
     * 체크 된 항목 컨트롤
     */
    setCheckedItems (items) {
      let checkedRows = []
      let checkedRowsIdx = []
      if (items?.length) {
        const beforeCheckedUserDbIdx = [...this.checkedItemsUserDbIdx]

        const newRow = beforeCheckedUserDbIdx.length
          ? items.find(row => !beforeCheckedUserDbIdx.includes(row.userDbIdx))
          : items[0]

        checkedRows = newRow ? [{ ...newRow }] : []
        checkedRowsIdx = newRow
          ? [newRow.userDbIdx]
          : []
      }
      this.checkedDBs = checkedRows
      this.checkedItemsUserDbIdx = checkedRowsIdx

      this.tableData.forEach(row => {
        row.checked = this.checkedItemsUserDbIdx.includes(row.userDbIdx)
        row.disable = !!(row.status === 'START' || row.deleteDate || row.isUrgent) // Progress 상태거나 삭제 예정(deleteDate o) 이거나 긴급 자원
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
     * DB 생성/변경 모달 Open
     */
    async openDBUpdateModal (isCreate) {
      if (!isCreate) {
        if (this.checkedDBs.length !== 1) return

        const userDbIdx = this.checkedDBs[0].userDbIdx

        this.updateDBData = await this.getDatabaseDetail(userDbIdx)
      } else this.updateDBData = null
      this.modal.controlDB = true
    },
    /**
     * DB 생성/수정 시, '저장'
     */
    confirmUpdate (saveData) {
      const isNew = !saveData?.userDbIdx

      const {
        beforePrice,
        isUrgent,
        price,
        tagInfo,
        ...rest
      } = saveData

      const payload = {
        beforePrice,
        groupIdx: saveData.groupId,
        groupName: saveData.groupName,
        isUrgent: !!isUrgent, // 긴급 여부(긴급 = true, 일반 = false)
        price,
        projectIdx: saveData.projectId,
        requestData: {
          ...rest,
          ...(isNew ? {
            tagInfo: tagInfo || [],
            orderNo: 'direct_vm'
          } : {
            vmUuid: saveData?.vmUuid
          })
        },
        service: 'DATABASE',
        userId: this.user.userId,
        userName: this.user.userName
      }

      let message
      isNew ? message = this.$v('자원을 생성하시겠습니까?') : message = this.$v('자원을 수정하시겠습니까?')

      this.$confirm(message).then(async () => {
        if (isNew) {
          const result = await this.createDb(payload)
          if (result) this.modal.controlDB = false
        } else {
          const result = await this.updateDb(payload)
          if (result) {
            this.modal.controlDB = false
            this.setCheckedItems([])
          }
        }
      }).catch(() => false)
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
          if (this.filterCreateTypeRegisterChecked) result = result && (item?.createType === 'REGISTER')

          return result
        })
      }
    },
    /**
     * filteredData를 세팅합니다.
     * 세팅 전, 그리드의 sorting / filtering 상태를 기억했다가 filteredData 세팅 후 다시 설정해줍니다.
     */
    async updateMainGrid () {
      await this.onSaveGridState()
      await this.filtering()
      if (this.originGridState) await this.onRestoreGridState()
    }
  },
  data (root) {
    return {
      initList: [],
      totalResultCnt: 0,
      originGridState: null, // 인터벌 돌기 전, 그리드의 sorting/filtering 상태 저장
      loading: {
        read: false,
        update: false,
        isGetDbDetail: false
      },
      checkedDBs: [],
      checkedItemsUserDbIdx: [],
      databaseColumns: [
        { binding: 'createType', header: ' ', width: 60, customHtml: true, filtable: false },
        { header: root.$v('프로젝트 명'), binding: 'projectName' },
        { header: root.$v('조직 명'), binding: 'groupName', align: 'left' },
        { binding: 'isUrgent', header: root.$v('긴급 처리 여부'), width: 60, customHtml: true },
        { header: root.$v('DB 명'), binding: 'databaseName', align: 'left' },
        { header: root.$v('호스트명'), binding: 'hostname', width: 150, align: 'left' },
        { header: root.$v('상태'), binding: 'dbStatus', customHtml: true },
        { header: 'IP', binding: 'ip', customHtml: true },
        { header: 'Port', binding: 'port', width: 80 },
        { header: 'vCPUs', binding: 'frontInfo.vcpu', width: 80 },
        { header: 'Memory', binding: 'frontInfo.memory', width: 80 },
        { header: 'Engine', binding: 'engineType', width: 100 },
        { header: 'Version', binding: 'version', width: 80 },
        { header: 'Node Type', binding: 'topology', width: 150 },
        { header: '사용량 / DB Size', binding: 'frontInfo.dbUsageInfo', width: 150, keyPath: 'common.GRID.DATABASE.usageTotal' }
        // { header: '삭제예정일', binding: 'deleteDate', width: 150, customHtml: true }
      ],
      tableData: [],
      filteredData: [],
      selectedProjectInfo: null,
      filteredIsUrgent: '', // 필터링 > 구분
      filterCreateTypeRegisterChecked: false, // 필터링 > CMP 외부 생성 자원 보기 (미등록 -> 등록)
      isUrgentOptions: [
        { value: '', label: root.$v('전체') },
        { value: false, label: root.$v('일반') },
        { value: true, label: root.$v('긴급') }
      ],

      updateDBData: null, // 업데이트 할 DB 정보

      modal: {
        controlDB: false
      }
    }
  }
}
</script>

<style lang="scss">
.set-resource-database-list {
  .total-count-wrap {
    .flex-wrap { margin-left: 30px; gap: 30px; }
  }
    // 인터벌 + 페이지네이션 때 알 수 없는 스크롤바 생김 방지
  .route-detail-grid {
    .wj-content {
      & > div {
        div[wj-part=root] {
          overflow: hidden !important;
          .wj-cell > div { white-space: nowrap !important; }
        }
      }
    }
  }
}
</style>
