<template>
  <section class="table-area">
    <cmp-grid
      v-loading="!this.interval ? loading.read : false"
      ref="serverGrid"
      class="route-detail-grid"
      :item-source="databaseTableData"
      :columns="databaseColumns"
      :changing-page-reset="false"
      :init-auto-select-row="checkedDBs"
      :init-custom-action="flex => this.grid = flex"
      :custom-init-filter="filter => this.gridFilter = filter"
      init-auto-select-row-key="userDbIdx"
      @selectedRow="selectRow(...arguments, databaseColumns)"
      @total-count="cnt => totalResultCnt = cnt"
      @checkedRowsData="setCheckedItems"
      selectable
      header-checkbox
      page-keeping
      use-excel-download
    >
      <!-- :init-auto-select-row="checkedDBs"
        init-auto-select-row-key="userDbIdx" -->
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
</template>

<script>
import API from '@sd-fe/cmp-core'
import { SortDescription } from '@grapecity/wijmo'
import SetResourceDatabaseMixins from '../SetResourceDatabase.mixins.js'

export default {
  name: 'SetResourceDatabaseList',
  mixins: [SetResourceDatabaseMixins],
  async mounted () {
    await this.getDbInterval()
  },
  beforeDestroy () {
    this.clearGetDbInterval()
  },
  props: {
    resourceGridData: {
      type: Array,
      default () {
        return []
      }
    }
  },
  methods: {
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
      await this.onSaveGridState()
      await this.getDatabases()
      if (this.originGridState) this.onRestoreGridState()
    },
    /**
     * API: 데이터베이스 목록 조회
     */
    async getDatabases (payload) {
      try {
        this.loading.read = true
        const param = { ...payload }
        param.isUser = false
        const response = await API.database.getDatabasesSimple(param)
        // console.log('@@ response : ', response)
        if (response) {
          this.databaseTableData = response.map(db => {
            Object.defineProperty(db, 'frontInfo', {
              value: {},
              writable: true
            })

            if (db.vcpu) db.frontInfo.vcpu = db.vcpu + 'Core'
            if (db.memoryByte) db.frontInfo.memory = this.$options.filters.byte(db.memoryByte)

            db.frontInfo.dbUsageInfo = `${this.$options.filters.byte(db.dbUsageByte)} / ${this.$options.filters.byte(db.dbSizeByte)}` // 사용량/Total 정보

            db.checked = this.checkedItemsUserDbIdx.includes(db.userDbIdx)
            db.disable = !!(db.reqInfo?.orderNo || db.chargeDate)
            return db
          })

          this.setCheckedItems(this.checkedDBs)
        }
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.databaseTableData = []
        this.$alert(message)
        throw error
      } finally {
        this.loading.read = false
      }
      // if (response.status === 200 && response.data != null) this.databaseTableData = response.data
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
     * projectIdx 를 바탕으로 속한 그룹 정보(조직)를 리턴합니다, 관조프 필터링을 위해 반드시 필요한 작업
     */
    getGroupInfo (treeData, projectIdx) {
      for (let i = 0; i < treeData.length; i++) {
        if (!treeData[i].groupProject.length) {
          const res = this.getGroupInfo(treeData[i].children, projectIdx)
          if (res) { return res }
        }
        const filtered = treeData[i].groupProject.filter(item => item.projectIdx === projectIdx)
        if (filtered?.length) return filtered[0]
        // else {
        //   if (!treeData[i].children?.length) return treeData[i]
        //   this.getGroupInfo(treeData[i].children, projectIdx)
        // }
      }
    },
    /**
     * 체크 된 항목 컨트롤
     */
    setCheckedItems (items) {
      this.checkedDBs = [...items]
      this.checkedItemsUserDbIdx = items.map(item => item.userDbIdx)
      // this.checkedVmsUserVmIdx = items.map(item => item.userVmIdx)

      // for (let i = 0; i < this.tableData.length; i++) {
      //   const row = this.tableData[i]

      //   row.checked = this.checkedVmsUserVmIdx.includes(row.userVmIdx)
      //   row.disable = this.checkedVms.length >= 1
      //     ? !!(row.powerState !== this.checkedVms[0].powerState || row.vmStatus === 'START')
      //     : !!(row.vmStatus === 'START' || row.deleteDate)
      // }

      // this.updateMainGrid()
    },
    /**
     * [미등록] 미등록 DB 최초 Update 모달 open
     */
    async openDBUpdateModal () {
      if (this.checkedDBs.length !== 1) return

      const userDbIdx = this.checkedDBs[0].userDbIdx

      this.updateDBData = await this.getDatabaseDetail(userDbIdx)

      this.modal.controlDB = true
    },
    /**
     * [미등록] 미등록 DB 최초 Update > 저장
     */
    confirmDatabaseUpdate (payload) {
      const message = this.$t('common.CONFIRM.PROJECT.022') // '자원을 수정하시겠습니까?'
      this.$confirm(message).then(async () => {
        const result = await this.updateDb(payload.orderData.userDbIdx, payload)
        if (result) {
          this.modal.controlDB = false
          this.setCheckedItems([])
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
    }
  },
  data () {
    return {
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
        { header: '프로젝트명', binding: 'projectName', width: '*', keyPath: 'common.GRID.projectName' },
        { header: '조직명', binding: 'groupName', width: '*', align: 'left', keyPath: 'common.TERMS.orgName' },
        { header: '이름', binding: 'databaseName', width: '*', align: 'left', keyPath: 'common.REGCON.name' },
        { header: '호스트명', binding: 'hostname', width: 150, align: 'left', keyPath: 'common.GRID.hostName' },
        { header: '상태', binding: 'dbStatus', width: '*', keyPath: 'common.GRID.NUTA.state' },
        { header: 'IP', binding: 'ip', width: '*', customHtml: true },
        { header: 'Port', binding: 'port', width: 80 },
        { header: 'VCPU', binding: 'frontInfo.vcpu', width: 80 },
        { header: 'Memory', binding: 'frontInfo.memory', width: 80 },
        { header: 'Engine', binding: 'engineType', width: 100 },
        { header: 'Version', binding: 'version', width: 80 },
        { header: 'Node Type', binding: 'topology', width: 150 },
        { header: '사용량 / Total', binding: 'frontInfo.dbUsageInfo', width: 150, keyPath: 'common.GRID.DATABASE.usageTotal' }
        // { header: '삭제예정일', binding: 'deleteDate', width: 150, customHtml: true }
      ],
      databaseTableData: [],

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
