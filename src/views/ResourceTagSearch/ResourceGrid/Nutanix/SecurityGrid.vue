<template>
  <section class="table-area">
    <cmp-grid
      :item-source="securityTableData"
      :columns="securityColumns"
      @selectedRow="selectRow"
      selectable
      class="route-detail-grid"
      :use-excel-download="true"
      @total-count="cnt => totalResultCnt = cnt"
    >
      <template #startTime="prop">
        {{ prop.row.startTime | dateSimple }}
      </template>
      <template #endTime="prop">
        {{ prop.row.endTime | dateSimple }}
      </template>
      <template #comment="prop">
        {{ prop.row.comment }}
      </template>
    </cmp-grid>
  </section>
</template>
<script>
import API from '@sd-fe/cmp-core'

export default {
  name: 'SetResourceSecurityList',
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
    selectRow (row) {
      this.routeTo({
        name: 'set-resource-security-detail-vmw',
        params: {
          idx: row.dataItem.securityGroupIdx,
          data: row.dataItem
        }
      })
    },

    async getSecurities () {
      const response = await API.network.getPolicyGroups()
      if (response) {
        this.securityTableData = [...response]
      }
    },
    /**
     * 상태 OFF 인 친구들 중 체크된 친구들
     */
    setCheckedOffItems (rows) {
      this.checkedItems = rows
    }
  },
  data () {
    return {
      totalResultCnt: 0,
      checkedItems: [], // 체크 된 친구들

      // 테이블 데이터
      securityColumns: [
        { binding: 'projectName', header: '프로젝트 명', align: 'left', width: 200, keyPath: 'common.GRID.projectName' },
        { header: '보안 그룹명', binding: 'securityGroupName', align: 'left', keyPath: 'common.GRID.NETWORK.secGroup' },
        { header: '시작일', binding: 'startTime', customHtml: true, width: 200, dataType: 'Date', keyPath: 'common.GRID.NETWORK.startDate' },
        { header: '만료일', binding: 'endTime', customHtml: true, width: 200, dataType: 'Date', keyPath: 'common.GRID.NETWORK.expireDate' },
        { header: '설명', binding: 'comment', align: 'left', keyPath: 'common.GRID.explain', customHtml: true }
        // { header: '삭제 예정일', binding: 'deleteDate', width: '*' }
      ],
      securityTableData: []
    }
  }
}
</script>
