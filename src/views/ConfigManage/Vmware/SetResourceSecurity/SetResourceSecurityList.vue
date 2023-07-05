<!--
  * 파일명 : SetResourceSecurityList.vue
  * 파일 기능 : 구성관리 > 자원관리 > 네트워크(보안그룹) 정보 확인 기능
  * 작성자 : 염창윤 외 4명
  * 최종 작성일 : 2021-02-03
  * License By Shinsegae I&C
  * 2021-02-03 Wijmo Grid 엑셀 다운로드 추가
 -->

<template>
  <div class="set-resource-security-list">
    <section class="table-top-wrap">
      <total-count
        class="total-count-wrap"
        :total-count="totalResultCnt"
      />
    </section>

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
        <template #startTime="props">
          {{ props.row.startTime | dateSimple }}
        </template>
        <template #endTime="props">
          {{ props.row.endTime | dateSimple }}
        </template>
        <template #comment="props">
          {{ props.row.comment }}
        </template>
      </cmp-grid>
    </section>
  </div>
</template>
<script>
import API from '@sd-fe/cmp-core'

export default {
  name: 'SetResourceSecurityList',
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
