<!--
  * 파일명 : MeteringAllResource.vue
  * 파일 기능 :
  * 작성자 : 정재은 외 2명
  * 최종 작성일 : 2021-01-15
  * License By Shinsegae I&C
  * 2021-01-15 Update: lodash 사용방식 변경
 -->

<template>
  <div class="metering-all-resource">
    <section class="form-area">
      <b class="panel-title">자원 보기</b>
      <ul class="resource-form-list">
        <li
          class="resource-form-item"
          v-for="(form, idx) in resourceFormList"
          :key="idx"
        >
          <a
            class="resource-form-text"
            @click="setColumnsFromForm(form)"
          >{{ form.label }}</a>
          <a
            class="mdi mdi-close"
            @click="deleteItem(resourceFormList, idx)"
          />
        </li>
      </ul>
      <!--
        comment: 요런 친구들은 어딘가에 자주 쓰일 수도 있겠네요.
        혹시 요 아이템이 재사용 될 기미가 보이면 바로 컴포넌트화 하면 유용하겠네요 :)
      -->
      <button
        class="button -new-form-button"
        type="is-primary"
        @click="newForm=true"
      >
        <i class="mdi mdi-plus" /> &nbsp;새 양식 만들기
      </button>
      <transition name="fade">
        <!-- comment: 오오 vue transition wrapper를 쓰시다니 멋져용 이거 저도 제대로 못써봤는데 ㅠㅠ -->
        <new-form-component
          v-show="newForm"
          :data="columns"
          @close="newForm=false"
          @save="saveNewForm"
        />
      </transition>
    </section>

    <section class="left-area">
      <filtering-component
        :data="filteringList"
      />
      <div class="table-top-wrap">
        <total-count
          class="total-count-wrap  -with-filter"
          :total-count="meteringTableData.length"
        />
        <!-- @selected="selectFilter" -->
      </div>

      <div class="table-area">
        <!-- ### 일반? - 사용되는 column이 매번 달라서 일단 보류 -->
        <wj-flex-grid
          :items-source="tableData"
          :initialized="init"
          headers-visibility="Column"
          allow-dragging="None"
          selection-mode="None"
        >
          <!-- :allow-add-new="true" -->
          <wj-flex-grid-column
            v-for="column in tableColumns"
            :key="column.field"
            :header="column.label"
            :binding="column.field"
            :is-read-only="true"
            :width="column.width"
          />
        </wj-flex-grid>
        <div>
          <table-more-btn
            v-if="meteringTableData.length > tableCountDefault"
            :total-data-len="meteringTableData.length"
            :table-data-len="tableCountDefault"
            @click="addCount(meteringTableData)"
          />
        </div>
      </div>
    </section>
  </div>
</template>
<script>
import NewFormComponent from '@/components/NewFormComponent/NewFormComponent'
import { map } from 'lodash'

export default {
  name: 'MeteringAllResource',
  components: {
    'new-form-component': NewFormComponent
  },
  created () {
    this.tableColumns = this.setColumns(this.columns)
    this.tableData = this.getTableData(this.meteringTableData)

    this.resourceFormList[1].newFormFilter = this.setColumns(this.columns) // 즐겨찾기
  },
  watch: {
    tableCountDefault () {
      this.tableData = this.getTableData(this.meteringTableData)
    }
  },

  methods: {
    init (grid) {
      this.grid = grid
      grid.columnHeaders.rows.defaultSize = 60
      grid.rows.defaultSize = 50

      this.rowEvent(grid)
    },
    /**
     * 미우스 오버 했을 때, 스타일 클래스를 줍니다.
     */
    rowEvent (grid) {
      grid.addEventListener(grid.hostElement, 'mouseover', (e) => {
        const ht = grid.hitTest(e)
        grid.cells.rows.forEach(row => {
          row.cssClass = undefined
        })
        if (ht.panel === grid.cells) {
          grid.cells.rows[ht.row].cssClass = 'selected-row'
        }
      })
    },
    /**
     * columns Array중, visible=true 인 아이템만 배열에 넣어서 리턴합니다.
     * @return [Array] columnArr
     */
    setColumns (columns) {
      const columnArr = []
      columns.forEach((column, idx) => {
        if (column.visible) columnArr.push(column)
      })
      return columnArr
      // this.tableColumns = columnArr
    },
    /**
     * 양식을 클릭했을 때, 테이블의 column을 양식에 저장된 데이터로 세팅합니다.
     * @param {Object} form 양식 개별 오브젝트
     */
    setColumnsFromForm (form) {
      this.tableColumns = this.setColumns(form.newFormFilter)
    },
    selectFilter (selectedArr) {
      console.log(selectedArr)
    },
    deleteItem (list, idx) {
      this.$confirm(this.$t('common.CONFIRM.BASE.008'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
        this.$alert(this.$t('common.ALERT.BASE.013'))
        list.splice(idx, 1)
      })
    },
    saveNewForm (param) {
      if (map([...this.resourceFormList], 'label').includes(param.label)) {
        this.$alert(this.$t('common.ALERT.METER.002'), '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          type: 'error'
        })
        return false
      } else {
        this.resourceFormList.push(param)
        this.newForm = false
      }

      // console.log('@새 양식 만들기', param, map(this.resourceFormList, 'label').includes(param.label))
    },
    /**
     * [더보기]버튼에 의한 테이블 데이터 가공
     * @param {Array} data 전체 테이블 데이타
     */
    getTableData (data) {
      const viewData = []
      if (data.length > this.tableCountDefault) {
        for (let i = 0; i < this.tableCountDefault; i++) {
          viewData.push(data[i])
        }
        return viewData
      } else return data
    },
    /**
     * 더보기
     */
    addCount (data) {
      const leftCount = data.length - this.tableCountDefault

      if (leftCount > 10) this.tableCountDefault += 10
      else this.tableCountDefault += leftCount
    }
  },
  data () {
    return {
      tableCountDefault: 10,
      tableColumns: [],
      tableData: [],
      newForm: false,
      resourceFormList: [
        {
          label: '전체 항목',
          newFormFilter: [
            { field: 'workName', label: '업무명', visible: true },
            { field: 'sort', label: '소속분류', visible: true },
            { field: 'webToB', label: 'WebToB', visible: true },
            { field: 'relationCop', label: '관계사', visible: true },
            { field: 'department', label: '부서', visible: true },
            { field: 'name', label: '이름', visible: true },
            { field: 'category', label: '구분', visible: true },
            { field: 'virtualMethod', label: '가상화 방법', visible: true },
            { field: 'host', label: '호스트', visible: true },
            { field: 'ip', label: 'IP', visible: true },
            { field: 'operating', label: '운영기/개발기', visible: true },
            { field: 'os', label: 'OS', visible: true },
            { field: 'vcpu', label: 'vCPU(개)', visible: true },
            { field: 'memory', label: 'Memory(GB)', visible: true },
            { field: 'storage', label: 'Storage(GB)', visible: true },
            { field: 'sdn', label: 'SDN(방화벽)', visible: true },
            { field: 'sdnL4', label: 'SDN(L4)', visible: true },
            { field: 'sdnL7', label: 'SDN(L7)', visible: true },
            { field: 'l4Ios', label: 'L4(IOS)', visible: true },
            { field: 'jeus', label: 'Jeus', visible: true },
            { field: 'interMaxWeb', label: 'interMax(Web)', visible: true },
            { field: 'interMaxWas', label: 'interMax(Was)', visible: true },
            { field: 'interMaxDb', label: 'interMax(DB)', visible: true },
            { field: 'maxguage', label: 'Maxguage', visible: true },
            { field: 'redcastle', label: 'Redcastle', visible: true },
            { field: 'nodeSafer', label: 'NodeSafer', visible: true },
            { field: 'dBSafer', label: 'DBSafer', visible: true },
            { field: 'polestar', label: 'Polestar', visible: true },
            { field: 'gpu', label: 'GPU', visible: true },
            { field: 'sse', label: 'SSE(1OS)', visible: true },
            { field: 'apm', label: '통합APM', visible: true },
            { field: 'haSolution', label: 'HA 솔루션', visible: true },
            { field: 'oracle', label: 'Oracle Ent', visible: true },
            { field: 'mv', label: 'MW/보안운영비-DR 사용시', visible: true },
            { field: 'fee', label: '회선 사용료', visible: true },
            { field: 'cloneSolution', label: '복제 솔루션', visible: true, keyPath: 'bill.copySolution' },
            { field: 'cloneData', label: '데이터복제', visible: true, keyPath: 'bill.copyData' }
          ]
        },
        { label: '즐겨찾기', newFormFilter: [] },
        { label: 20200730, newFormFilter: [] }
      ],
      filteredRel: '',
      filteredDep: '',
      filteringList: [
        {
          field: 'relatedCorp',
          label: '관계사',
          selections: [
            { label: '신세계', value: 'shinsegae' },
            { label: '이마트', value: 'emart' },
            { label: '스타벅스', value: 'starbucks' }
          ]
        },
        {
          field: 'department',
          label: '부서',
          selections: [
            { label: '부서1', value: 'tag1' },
            { label: '부서2', value: 'tag2' },
            { label: '부서3', value: 'tag3' },
            { label: '부서4', value: 'tag4' },
            { label: '부서5', value: 'tag5' }
          ]
        }
      ],
      columns: [
        { field: 'workName', label: '업무명', visible: false, sortable: true, width: 150 },
        { field: 'sort', label: '소속분류', visible: false, sortable: true, width: 150 },
        { field: 'webToB', label: 'WebToB', visible: false, sortable: true, width: 150 },
        { field: 'relationCop', label: '관계사', visible: true, default: true, sortable: true, width: 100 },
        { field: 'department', label: '부서', visible: true, default: true, sortable: true, width: 150 },
        { field: 'name', label: '이름', visible: true, default: true, sortable: true, width: 200 },
        { field: 'category', label: '구분', visible: true, default: true, sortable: true, width: 200 },
        { field: 'virtualMethod', label: '가상화 방법', visible: false, sortable: true, width: 150 },
        { field: 'host', label: '호스트', visible: true, default: true, sortable: true, width: '*' },
        { field: 'ip', label: 'IP', visible: true, default: true, sortable: true, width: 200 },
        { field: 'operating', label: '운영기/개발기', visible: false, sortable: true, width: 150 },
        { field: 'os', label: 'OS', visible: false, sortable: true, width: 150 },
        { field: 'vcpu', label: 'vCPU(개)', visible: false, sortable: true, width: 150 },
        { field: 'memory', label: 'Memory(GB)', visible: false, sortable: true, width: 150 },
        { field: 'storage', label: 'Storage(GB)', visible: false, sortable: true, width: 150 },
        { field: 'sdn', label: 'SDN(방화벽)', visible: false, sortable: true, width: 150 },
        { field: 'sdnL4', label: 'SDN(L4)', visible: false, sortable: true, width: 150 },
        { field: 'sdnL7', label: 'SDN(L7)', visible: false, sortable: true, width: 150 },
        { field: 'l4Ios', label: 'L4(IOS)', visible: false, sortable: true, width: 150 },
        { field: 'jeus', label: 'Jeus', visible: false, sortable: true, width: 150 },
        { field: 'interMaxWeb', label: 'interMax(Web)', visible: false, sortable: true, width: 150 },
        { field: 'interMaxWas', label: 'interMax(Was)', visible: false, sortable: true, width: 150 },
        { field: 'interMaxDb', label: 'interMax(DB)', visible: false, sortable: true, width: 150 },
        { field: 'maxguage', label: 'Maxguage', visible: false, sortable: true, width: 150 },
        { field: 'redcastle', label: 'Redcastle', visible: false, sortable: true, width: 150 },
        { field: 'nodeSafer', label: 'NodeSafer', visible: false, sortable: true, width: 150 },
        { field: 'dBSafer', label: 'DBSafer', visible: false, sortable: true, width: 150 },
        { field: 'polestar', label: 'Polestar', visible: false, sortable: true, width: 150 },
        { field: 'gpu', label: 'GPU', visible: false, sortable: true, width: 150 },
        { field: 'sse', label: 'SSE(1OS)', visible: false, sortable: true, width: 150 },
        { field: 'apm', label: '통합APM', visible: false, sortable: true, width: 150 },
        { field: 'haSolution', label: 'HA 솔루션', visible: false, sortable: true, width: 150 },
        { field: 'oracle', label: 'Oracle Ent', visible: false, sortable: true, width: 150 },
        { field: 'mv', label: 'MW/보안운영비-DR 사용시', visible: false, sortable: true, width: 150 },
        { field: 'fee', label: '회선 사용료', visible: false, sortable: true, width: 150 },
        { field: 'cloneSolution', label: '복제 솔루션', visible: false, sortable: true, width: 2000 },
        { field: 'cloneData', label: '데이터복제', visible: false, sortable: true, width: 150 }
      ],
      meteringTableData: [
        {
          workName: '업무 명', sort: '김포=내부망A-Node2', webToB: 'WebToB', relationCop: '이마트', department: '발주', name: '신세빈', category: '카테고리', virtualMethod: '', host: 'sccon-itest-유', ip: '10.254.16.274', operating: '', os: '', vcpu: '', memory: '', storage: '', sdn: 'SDN', sdnL4: 'L4', sdnL7: 'L7', l4Ios: '', jeus: 'JEUS', interMaxWeb: '', interMaxWas: '', interMaxDb: '', maxguage: '', redcastle: '', nodeSafer: '', dBSafer: '', polestar: 'Polestar', gpu: 'GPU', sse: '', apm: '', haSolution: '', oracle: '', mv: 'MV', fee: '', cloneSolution: '', cloneData: 'clone'
        },
        {
          workName: '업무 명', sort: '김포=내부망A-Node2', webToB: 'WebToB', relationCop: '이마트', department: '발주', name: '신세빈', category: '카테고리', virtualMethod: '', host: 'sccon-itest-유', ip: '10.254.16.274', operating: '', os: '', vcpu: '', memory: '', storage: '', sdn: 'SDN', sdnL4: 'L4', sdnL7: 'L7', l4Ios: '', jeus: 'JEUS', interMaxWeb: '', interMaxWas: '', interMaxDb: '', maxguage: '', redcastle: '', nodeSafer: '', dBSafer: '', polestar: 'Polestar', gpu: 'GPU', sse: '', apm: '', haSolution: '', oracle: '', mv: 'MV', fee: '', cloneSolution: '', cloneData: 'clone'
        },
        {
          workName: '업무 명', sort: '김포=내부망A-Node2', webToB: 'WebToB', relationCop: '이마트', department: '발주', name: '신세빈', category: '카테고리', virtualMethod: '', host: 'sccon-itest-유', ip: '10.254.16.274', operating: '', os: '', vcpu: '', memory: '', storage: '', sdn: 'SDN', sdnL4: 'L4', sdnL7: 'L7', l4Ios: '', jeus: 'JEUS', interMaxWeb: '', interMaxWas: '', interMaxDb: '', maxguage: '', redcastle: '', nodeSafer: '', dBSafer: '', polestar: 'Polestar', gpu: 'GPU', sse: '', apm: '', haSolution: '', oracle: '', mv: 'MV', fee: '', cloneSolution: '', cloneData: 'clone'
        },
        {
          workName: '업무 명', sort: '김포=내부망A-Node2', webToB: 'WebToB', relationCop: '이마트', department: '발주', name: '신세빈', category: '카테고리', virtualMethod: '', host: 'sccon-itest-유', ip: '10.254.16.274', operating: '', os: '', vcpu: '', memory: '', storage: '', sdn: 'SDN', sdnL4: 'L4', sdnL7: 'L7', l4Ios: '', jeus: 'JEUS', interMaxWeb: '', interMaxWas: '', interMaxDb: '', maxguage: '', redcastle: '', nodeSafer: '', dBSafer: '', polestar: 'Polestar', gpu: 'GPU', sse: '', apm: '', haSolution: '', oracle: '', mv: 'MV', fee: '', cloneSolution: '', cloneData: 'clone'
        },
        {
          workName: '업무 명', sort: '김포=내부망A-Node2', webToB: 'WebToB', relationCop: '이마트', department: '발주', name: '신세빈', category: '카테고리', virtualMethod: '', host: 'sccon-itest-유', ip: '10.254.16.274', operating: '', os: '', vcpu: '', memory: '', storage: '', sdn: 'SDN', sdnL4: 'L4', sdnL7: 'L7', l4Ios: '', jeus: 'JEUS', interMaxWeb: '', interMaxWas: '', interMaxDb: '', maxguage: '', redcastle: '', nodeSafer: '', dBSafer: '', polestar: 'Polestar', gpu: 'GPU', sse: '', apm: '', haSolution: '', oracle: '', mv: 'MV', fee: '', cloneSolution: '', cloneData: 'clone'
        },
        {
          workName: '업무 명', sort: '김포=내부망A-Node2', webToB: 'WebToB', relationCop: '이마트', department: '발주', name: '신세빈', category: '카테고리', virtualMethod: '', host: 'sccon-itest-유', ip: '10.254.16.274', operating: '', os: '', vcpu: '', memory: '', storage: '', sdn: 'SDN', sdnL4: 'L4', sdnL7: 'L7', l4Ios: '', jeus: 'JEUS', interMaxWeb: '', interMaxWas: '', interMaxDb: '', maxguage: '', redcastle: '', nodeSafer: '', dBSafer: '', polestar: 'Polestar', gpu: 'GPU', sse: '', apm: '', haSolution: '', oracle: '', mv: 'MV', fee: '', cloneSolution: '', cloneData: 'clone'
        },
        {
          workName: '업무 명', sort: '김포=내부망A-Node2', webToB: 'WebToB', relationCop: '이마트', department: '발주', name: '신세빈', category: '카테고리', virtualMethod: '', host: 'sccon-itest-유', ip: '10.254.16.274', operating: '', os: '', vcpu: '', memory: '', storage: '', sdn: 'SDN', sdnL4: 'L4', sdnL7: 'L7', l4Ios: '', jeus: 'JEUS', interMaxWeb: '', interMaxWas: '', interMaxDb: '', maxguage: '', redcastle: '', nodeSafer: '', dBSafer: '', polestar: 'Polestar', gpu: 'GPU', sse: '', apm: '', haSolution: '', oracle: '', mv: 'MV', fee: '', cloneSolution: '', cloneData: 'clone'
        },
        {
          workName: '업무 명', sort: '김포=내부망A-Node2', webToB: 'WebToB', relationCop: '이마트', department: '발주', name: '신세빈', category: '카테고리', virtualMethod: '', host: 'sccon-itest-유', ip: '10.254.16.274', operating: '', os: '', vcpu: '', memory: '', storage: '', sdn: 'SDN', sdnL4: 'L4', sdnL7: 'L7', l4Ios: '', jeus: 'JEUS', interMaxWeb: '', interMaxWas: '', interMaxDb: '', maxguage: '', redcastle: '', nodeSafer: '', dBSafer: '', polestar: 'Polestar', gpu: 'GPU', sse: '', apm: '', haSolution: '', oracle: '', mv: 'MV', fee: '', cloneSolution: '', cloneData: 'clone'
        },
        {
          workName: '업무 명', sort: '김포=내부망A-Node2', webToB: 'WebToB', relationCop: '이마트', department: '발주', name: '신세빈', category: '카테고리', virtualMethod: '', host: 'sccon-itest-유', ip: '10.254.16.274', operating: '', os: '', vcpu: '', memory: '', storage: '', sdn: 'SDN', sdnL4: 'L4', sdnL7: 'L7', l4Ios: '', jeus: 'JEUS', interMaxWeb: '', interMaxWas: '', interMaxDb: '', maxguage: '', redcastle: '', nodeSafer: '', dBSafer: '', polestar: 'Polestar', gpu: 'GPU', sse: '', apm: '', haSolution: '', oracle: '', mv: 'MV', fee: '', cloneSolution: '', cloneData: 'clone'
        },
        {
          workName: '업무 명', sort: '김포=내부망A-Node2', webToB: 'WebToB', relationCop: '이마트', department: '발주', name: '신세빈', category: '카테고리', virtualMethod: '', host: 'sccon-itest-유', ip: '10.254.16.274', operating: '', os: '', vcpu: '', memory: '', storage: '', sdn: 'SDN', sdnL4: 'L4', sdnL7: 'L7', l4Ios: '', jeus: 'JEUS', interMaxWeb: '', interMaxWas: '', interMaxDb: '', maxguage: '', redcastle: '', nodeSafer: '', dBSafer: '', polestar: 'Polestar', gpu: 'GPU', sse: '', apm: '', haSolution: '', oracle: '', mv: 'MV', fee: '', cloneSolution: '', cloneData: 'clone'
        },
        {
          workName: '업무 명', sort: '김포=내부망A-Node2', webToB: 'WebToB', relationCop: '이마트', department: '발주', name: '신세빈', category: '카테고리', virtualMethod: '', host: 'sccon-itest-유', ip: '10.254.16.274', operating: '', os: '', vcpu: '', memory: '', storage: '', sdn: 'SDN', sdnL4: 'L4', sdnL7: 'L7', l4Ios: '', jeus: 'JEUS', interMaxWeb: '', interMaxWas: '', interMaxDb: '', maxguage: '', redcastle: '', nodeSafer: '', dBSafer: '', polestar: 'Polestar', gpu: 'GPU', sse: '', apm: '', haSolution: '', oracle: '', mv: 'MV', fee: '', cloneSolution: '', cloneData: 'clone'
        },
        {
          workName: '업무 명', sort: '김포=내부망A-Node2', webToB: 'WebToB', relationCop: '이마트', department: '발주', name: '신세빈', category: '카테고리', virtualMethod: '', host: 'sccon-itest-유', ip: '10.254.16.274', operating: '', os: '', vcpu: '', memory: '', storage: '', sdn: 'SDN', sdnL4: 'L4', sdnL7: 'L7', l4Ios: '', jeus: 'JEUS', interMaxWeb: '', interMaxWas: '', interMaxDb: '', maxguage: '', redcastle: '', nodeSafer: '', dBSafer: '', polestar: 'Polestar', gpu: 'GPU', sse: '', apm: '', haSolution: '', oracle: '', mv: 'MV', fee: '', cloneSolution: '', cloneData: 'clone'
        },
        {
          workName: '업무 명', sort: '김포=내부망A-Node2', webToB: 'WebToB', relationCop: '이마트', department: '발주', name: '신세빈', category: '카테고리', virtualMethod: '', host: 'sccon-itest-유', ip: '10.254.16.274', operating: '', os: '', vcpu: '', memory: '', storage: '', sdn: 'SDN', sdnL4: 'L4', sdnL7: 'L7', l4Ios: '', jeus: 'JEUS', interMaxWeb: '', interMaxWas: '', interMaxDb: '', maxguage: '', redcastle: '', nodeSafer: '', dBSafer: '', polestar: 'Polestar', gpu: 'GPU', sse: '', apm: '', haSolution: '', oracle: '', mv: 'MV', fee: '', cloneSolution: '', cloneData: 'clone'
        },
        {
          workName: '업무 명', sort: '김포=내부망A-Node2', webToB: 'WebToB', relationCop: '이마트', department: '발주', name: '신세빈', category: '카테고리', virtualMethod: '', host: 'sccon-itest-유', ip: '10.254.16.274', operating: '', os: '', vcpu: '', memory: '', storage: '', sdn: 'SDN', sdnL4: 'L4', sdnL7: 'L7', l4Ios: '', jeus: 'JEUS', interMaxWeb: '', interMaxWas: '', interMaxDb: '', maxguage: '', redcastle: '', nodeSafer: '', dBSafer: '', polestar: 'Polestar', gpu: 'GPU', sse: '', apm: '', haSolution: '', oracle: '', mv: 'MV', fee: '', cloneSolution: '', cloneData: 'clone'
        },
        {
          workName: '업무 명', sort: '김포=내부망A-Node2', webToB: 'WebToB', relationCop: '이마트', department: '발주', name: '신세빈', category: '카테고리', virtualMethod: '', host: 'sccon-itest-유', ip: '10.254.16.274', operating: '', os: '', vcpu: '', memory: '', storage: '', sdn: 'SDN', sdnL4: 'L4', sdnL7: 'L7', l4Ios: '', jeus: 'JEUS', interMaxWeb: '', interMaxWas: '', interMaxDb: '', maxguage: '', redcastle: '', nodeSafer: '', dBSafer: '', polestar: 'Polestar', gpu: 'GPU', sse: '', apm: '', haSolution: '', oracle: '', mv: 'MV', fee: '', cloneSolution: '', cloneData: 'clone'
        },
        {
          workName: '업무 명', sort: '김포=내부망A-Node2', webToB: 'WebToB', relationCop: '이마트', department: '발주', name: '신세빈', category: '카테고리', virtualMethod: '', host: 'sccon-itest-유', ip: '10.254.16.274', operating: '', os: '', vcpu: '', memory: '', storage: '', sdn: 'SDN', sdnL4: 'L4', sdnL7: 'L7', l4Ios: '', jeus: 'JEUS', interMaxWeb: '', interMaxWas: '', interMaxDb: '', maxguage: '', redcastle: '', nodeSafer: '', dBSafer: '', polestar: 'Polestar', gpu: 'GPU', sse: '', apm: '', haSolution: '', oracle: '', mv: 'MV', fee: '', cloneSolution: '', cloneData: 'clone'
        }
      ]
    }
  }
}
</script>
<style lang="scss">
  .metering-all-resource {
    display: flex;
    align-items: stretch;
    .panel-title {
      padding: $gap;
      font-weight: bold;
      font-size: 15px;
    }
    > .form-area {
      position: relative;
      flex: 1 1 auto;
      padding: $gap 0 80px;
      min-width: 200px;
      min-height: 70vh;
      background-color: $panel-bg;
      border-radius: $radius-m;
      .resource-form-list {
        overflow-y: auto;
        max-height: 75vh;
        margin-top: $gap;
        padding: 0 $gap;
        > .resource-form-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: $gap-s;
        }
      }

      .-new-form-button {
        position: absolute;
        left: $gap;
        right: $gap;
        bottom: $gap;
        width: calc(100% - 40px);
        white-space: nowrap;
      }

      .new-form-component {
        position: absolute;
        top: -1px;
        bottom: 0;
        left: 0;
      }
    }

    > .left-area {
      flex: 5 1 auto;
      margin-left: $gap-m;
      .table-area {
        overflow-y: hidden;
        overflow-x: auto;
        max-width: calc(100% - 370px);
      }
    }
    .fade-enter-active,
    .fade-leave-active {
      transition-duration: .2s;
      transition-property: opacity;
      transition-timing-function: ease;
    }
    .fade-enter,
    .fade-leave-to {
      opacity: 0
    }
  }
</style>
