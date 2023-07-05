<!--
  * 파일명 : ResourceOperationDatabase.vue
  * 파일 기능 : 자원 운용 > 데이터베이스 자원 정보 (readOnly) 데이터를 보여주기만 할 뿐, 조작 하진 않습니다.
  * 작성자 : 김예담
  * 최종 작성일 : 2021-10-20
  * License By Shinsegae I&C
 -->

<template>
  <div class="operation-storage">
    <div
      class="grid-wrap"
      v-if="!isCart && withCartVmData.length"
    >
      <resource-title>
        <!-- 장바구니에 담긴 VM과 연관 있는 Database -->
        {{ $t('config.TRANSFER.relatedToVmInBasket', { type: 'Database' }) }}
      </resource-title>
      <cmp-grid
        v-loading="loading"
        :item-source="withCartVmData"
        :columns="gridColumns"
        :column-data-map="columnDataMap"
        :changing-page-reset="false"
        :init-custom-action="flex => this.withVmGrid = flex"
        :init-auto-select-row="initAutoSelectRow"
        init-auto-select-row-key="databaseUuid"
        header-checkbox
        page-keeping
        @loaded-rows="onLoadedRows"
        @checkedRowsData="items => {
          withVmCheckedItems = items
          checkHandler()
          gridRefresh(grid)
        }"
      >
        <template #companyName="props">
          {{ props.row.companyName || '-' }}
        </template>
        <!-- 관계사 -->

        <template #groupName="props">
          {{ props.row.groupName || '-' }}
        </template>
        <!-- 조직 -->

        <template #projectName="props">
          {{ props.row.projectName || '-' }}
        </template>
        <!-- 프로젝트 -->

        <template #databaseName="props">
          {{ props.row.databaseName || '-' }}
        </template>
        <!-- DB명 -->

        <template #createTime="props">
          {{ props.row.createTime | dateSimple }}
        </template>
        <!-- 생성일 -->

        <template #osInfo="props">
          <set-os-icon
            v-if="props.row.osName"
            :os-name="`${props.row.osName ? props.row.osName : ''}${props.row.osVersion ? props.row.osVersion : ''}${props.row.osPlatform ? props.row.osPlatform : ''}`"
          />
          <span v-else>-</span>
        </template>
        <!-- OS명(OS Version, Bits) -->

        <template #networkCateKey="props">
          {{ props.row.networkCateKey || '-' }}
        </template>
        <!-- 네트워크 조직 -->

        <template #port="props">
          {{ props.row.port || '-' }}
        </template>
        <!-- 포트 -->
      </cmp-grid>
    </div>
    <!-- 장바구니에 담긴 VM과 연관 있는 자원 -->

    <div class="grid-wrap">
      <resource-title :count="totalResultCnt">
        Database
      </resource-title>
      <cmp-grid
        v-loading="loading"
        :item-source="gridData"
        :columns="gridColumns"
        :column-data-map="columnDataMap"
        :changing-page-reset="false"
        :init-custom-action="flex => this.grid = flex"
        :init-auto-select-row="initAutoSelectRow"
        init-auto-select-row-key="databaseUuid"
        header-checkbox
        page-keeping
        @loaded-rows="onLoadedRows"
        @total-count="cnt => totalResultCnt = cnt"
        @checkedRowsData="items => {
          checkedItems = items
          checkHandler()
          if(withVmGrid) gridRefresh(withVmGrid)
        }"
      >
        <template #companyName="props">
          {{ props.row.companyName || '-' }}
        </template>
        <!-- 관계사 -->

        <template #groupName="props">
          {{ props.row.groupName || '-' }}
        </template>
        <!-- 조직 -->

        <template #projectName="props">
          {{ props.row.projectName || '-' }}
        </template>
        <!-- 프로젝트 -->

        <template #hostname="props">
          {{ props.row.hostname || '-' }}
        </template>
        <!-- VM(Host)명 -->

        <template #createTime="props">
          {{ props.row.createTime | dateSimple }}
        </template>
        <!-- 생성일 -->

        <template #osInfo="props">
          <set-os-icon
            v-if="props.row.osName"
            :os-name="`${props.row.osName ? props.row.osName : ''}${props.row.osVersion ? props.row.osVersion : ''}${props.row.osPlatform ? props.row.osPlatform : ''}`"
          />
          <span v-else>-</span>
        </template>
        <!-- OS명(OS Version, Bits) -->

        <template #networkCateKey="props">
          {{ props.row.networkCateKey || '-' }}
        </template>
        <!-- 네트워크 조직 -->

        <template #port="props">
          {{ props.row.port || '-' }}
        </template>
        <!-- 포트 -->

        <template #deleting="props">
          <button
            class="button"
            type="is-icon"
            @click.stop="clickDelete(props.row)"
          >
            <i class="delete-icon" />
          </button>
        </template>
      </cmp-grid>
    </div>
  </div>
</template>

<script>
import { SetOSIcon } from '@sd-fe/cmp-core'
import ResourceTitle from './ResourceTitle.vue'
import GridUtils from '@/components/Utils/GridUtils'
import ResourceOperationMixins from './ResourceOperation.mixins.js'

export default {
  name: 'ResourceOperationDatabase',
  mixins: [ResourceOperationMixins],
  components: {
    'set-os-icon': SetOSIcon,
    ResourceTitle
  },
  props: {
    data: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    deletable: {
      type: Boolean,
      default: false
    },
    hostNamesInBasket: { // 이관 장바구니에 있는 vm의 호스트명
      type: Array,
      default: () => []
    },
    initAutoSelectRow: {
      type: Array,
      default: () => []
    }
  },
  watch: {
    data: {
      immediate: true,
      handler (list) {
        this.setGridInfo(list)
        // console.log('@@DB', list)
      }
    }
  },
  computed: {
    gridColumns () {
      if (this.deletable) return this.columns
      else return this.columns.filter(col => col.binding !== 'deleting')
    },
    isCart () { // 이관바구니인지? => 장바구니에 담긴 VM 관련 자원 미노출
      return this.deletable
    }
  },
  methods: {
    setGridInfo (data) {
      if (!data) return
      const result = data.map(row => {
        // App 담당자
        row.appTaskUsersName = ''
        if (row.appTaskUser?.length) {
          row.appTaskUsersName = row.appTaskUser.map(usr => usr.appTaskUserName).join(',')
        }

        // OS명
        const engineObj = {
          engineType: row.engineType || row.eraDbInfo?.engineType || null,
          engineVersion: row.engineVersion || row.eraDbInfo?.engineVersion || '',
          nodeType: row.topology || row.eraDbInfo?.nodeType || null
        }

        // 현재 사양
        const spec = {
          vcpu: row.vcpu || row.eraDbServerInfo?.numVcpu || 0,
          memory: () => {
            if (row.memoryByte) return this.$options.filters.byte(row.memoryByte)
            else if (row?.eraDbServerInfo.memoryByte) return this.$options.filters.byte(row?.eraDbServerInfo.memoryByte)
            else return '0GB'
          }
        }

        const dbSize = row?.dbSizeByte || row?.eraDbInfo?.dbSizeByte || 0

        return {
          ...row,
          companyName: row.companyName,
          groupName: row.groupName,
          projectName: row.projectName,
          createTime: row.createTime,
          databaseName: row.databaseName,
          engineInfo: engineObj.engineType
            ? `${engineObj.engineType} ${engineObj.engineVersion} (${engineObj.nodeType ? engineObj.nodeType : '-'})`
            : '-',
          osInfo: `${row.osType || ''}${row.osVersion || ''}${row.osPlatform || ''}`,
          osName: row.osName,
          networkCateKey: row.networkList?.length ? row.networkList[0].cateKey : undefined,
          port: row.port || row.eraDbInfo?.listenPort,
          specInfo: `vCPU: ${spec.vcpu}Core, Memory: ${spec.memory()}`,
          dbSize: this.$options.filters.byte(dbSize) || '0 Bytes',
          checked: this.setRowCheckState(row) // 초기 체크 row 세팅
        }
      })

      this.gridData = result

      // columnDataMap 세팅
      this.columnDataMap.createTime = GridUtils.setColumnDataMap('createTime', this.gridData, 'date')
    },
    checkHandler () {
      this.$emit('checkedRowsData', [...this.withVmCheckedItems, ...this.checkedItems])
    },
    /**
     * row 삭제 시, 발생 이벤트
     */
    clickDelete (row) {
      if (!this.deletable) return false

      this.$emit('delete-row', row)
    }
  },
  data () {
    return {
      gridData: [],
      withCartVmData: [], // 장바구니에 담긴 VM과 연관 있는 자원
      totalResultCnt: 0,
      withVmCheckedItems: [], // vm과 연관 있는 자원 그리드에서 체크 아이템
      checkedItems: [], // 일반 그리드에서 체크 아이템
      columns: [
        { binding: 'companyName', header: '관계사', keyPath: 'common.TERMS.rel', width: 100, customHtml: true },
        { binding: 'groupName', header: '조직', keyPath: 'common.TERMS.group', width: 100, customHtml: true },
        { binding: 'projectName', header: '프로젝트', keyPath: 'common.TERMS.project', width: 100, customHtml: true },
        { binding: 'createTime', header: '자원 생성일', customHtml: true, keyPath: 'common.REGCON.createTime', width: 150 },
        { binding: 'databaseName', header: 'DB명', keyPath: 'config.TRANSFER.dbName', customHtml: true },
        { binding: 'hostname', header: '호스트 명', keyPath: 'common.GRID.hostName' },
        { binding: 'engineInfo', header: 'DB Engine/Version' },
        { binding: 'osInfo', header: `${this.$t('config.TRANSFER.osName')}(OS Version, Bits)`, customHtml: true }, // OS명(OS Version, Bits)
        { binding: 'networkCateKey', header: '네트워크 조직', keyPath: 'common.GRID.COMPUTE.networkOrg', customHtml: true },
        { binding: 'port', header: '포트', width: 80, keyPath: 'common.GRID.NETWORK.port', customHtml: true },
        { binding: 'specInfo', header: '현재 사양', keyPath: 'config.TRANSFER.curSpec', customHtml: true, width: 200 },
        { binding: 'dbSize', header: 'DB Size', customHtml: true, width: 100 },
        { header: ' ', binding: 'deleting', customHtml: true, width: 60, sorting: false }
      ],
      columnDataMap: {
        createTime: []
      },
      searchableColumns: [ // 검색시 사용. 지우지 마세요.
        { binding: 'hostname', label: this.$t('common.GRID.hostName') }, // 호스트 명
        { binding: 'appTaskUsersName', label: this.$t('config.TRANSFER.appManager') }, // 현재 APP 담당자
        { binding: 'ip', label: 'IP' }
      ]
    }
  }
}
</script>
