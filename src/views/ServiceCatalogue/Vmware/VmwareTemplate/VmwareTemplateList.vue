<template>
  <div class="vm-template-list">
    <filtering-component
      v-if="isAvailableOVA"
      @reset-data="resetFilter"
    >
      <div class="filter-form">
        <span class="filter-name">
          {{ $v('VM 템플릿 명') }}
        </span>

        <el-input
          v-model="searchOvaName"
          placeholder="VM template Name"
          @keyup.enter.native="filtering"
        />
        <search-icon style="margin-left: 5px;" />
      </div>

      <div class="filter-form">
        <span class="filter-name">
          {{ $v('소스 VM명') }}
        </span>

        <el-input
          v-model="searchVmName"
          placeholder="VM Name"
          @keyup.enter.native="filtering"
        />
        <search-icon style="margin-left: 5px;" />
      </div>
    </filtering-component>

    <section
      v-loading="!interval && (isLoadingOVAList || isLoadingCentralList)"
      class="ova-list-wrapper"
    >
      <div
        v-if="!isAvailableOVA"
        class="empty-data"
        style="flex-direction: column;"
      >
        <p v-if="!allElements.length">
          <!-- 클러스터 정보가 없습니다. -->
          {{ $t('service.OVA.ALERT.006') }}
        </p>
        <template v-else>
          <!-- <b>Nutanix 5.18</b>&nbsp;부터 VM 템플릿을 사용할 수 있습니다. -->
          <p v-html="$t('service.OVA.PLACEHOLDER.002', { version: 5.18 })" />

          <div
            class="current-version-wrap"
            v-if="centralVersion"
          >
            <!-- 현재 버전:  -->
            <span>{{ $t('service.OVA.PLACEHOLDER.003') }}</span>
            <ol>
              <li
                v-for="cluster in allClusters"
                :key="cluster.clusterUuid"
              >
                {{ cluster.clusterName }}:&nbsp;{{ cluster.version }}
              </li>
            </ol>
          </div>
        </template>
      </div>

      <template v-else>
        <p
          v-if="!isLoadingOVAList && !originData.length"
          class="empty-data"
        >
          {{ $v('데이터가 없습니다.') }}
        </p>
        <span
          class="ova-list-wrapper__count"
          v-else
        >
          {{ $t("bill.MODEL.allCount", { count: filteredData.length }) }}
        </span>

        <ul class="ova-list">
          <li
            class="ova-item"
            :class="{'-disabled': vm.customStatus || !vm.templateIdx}"
            v-for="(vm, index) in ovaList"
            :key="index"
            @click="e => {
              if(vm.customStatus) return
              $router.push({
                name: 'vm-template-detail-vmw',
                params: {
                  key: vm.templateIdx ? 'idx' : 'uuid',
                  id: vm.templateIdx || vm.vm.vmUuid,
                }
              })
            }"
          >
            <div
              class="disable-wrap"
              v-if="vm.customStatus"
            >
              <span>
                <i
                  class="el-icon-loading"
                  style="margin-right: 5px;"
                />

                <!-- {{ `${vm.customStatus} 중인 자원입니다.` }} -->
                {{ $t('service.OVA.PLACEHOLDER.001', {state:vm.customStatus }) }}
              </span>
            </div>

            <div
              class="disable-wrap unregister-template-wrap"
              v-else-if="!vm.templateIdx"
            >
              <span style="margin-left: 10px;">미등록 템플릿입니다.</span>
            </div>

            <vmware-template-item :data="vm" />
          </li>
        </ul>

        <div
          class="pagination-wrap"
        >
          <el-pagination
            v-if="filteredData.length > pageSize"
            layout="prev, pager, next"
            :total="filteredData.length"
            :current-page.sync="currentPage"
            :page-size="pageSize"
            @current-change="page => currentPage = page"
          />
        </div>
      </template>
    </section>
  </div>
</template>

<script>
import API, { FilteringComponent } from '@sd-fe/cmp-core'
import SearchIcon from '@/components/Icons/SearchIcon.vue'
import VmwareTemplateItem from './VmwareTemplateItem.vue'
import { uniqBy } from 'lodash'

export default {
  name: 'VmwareTemplateList',
  components: {
    FilteringComponent,
    SearchIcon,
    VmwareTemplateItem
  },
  watch: {
    currentPage (page) {
      this.setPagingData()
    }
  },
  async created () {
    // await this.checkAvailableOva() // OVA 사용 가능 버전인지 체크

    if (this.isAvailableOVA) {
      await this.getVmwareTemplateList()
      await this.getInterval()
    }
  },
  beforeDestroy () {
    this.clearListInterval()
  },
  methods: {
    /**
     * API: VMware Template 전체 리스트를 가져옵니다.
     */
    async getVmwareTemplateList () {
      try {
        this.isLoadingOVAList = true
        const { data } = await API.vmware.template.getVmwareTemplateList()

        // const expList = (await getRunningOVAList({ operations: 'OVA_EXPORT', progressStatus: 'RUNNING' })).data
        // const delList = (await getRunningOVAList({ operations: 'OVA_DELETE', progressStatus: 'RUNNING' })).data

        // const exportingOVAs = expList ? this.setExportingOvas(expList, 'Export') : []
        // const deletingOVAUuids = delList ? this.getDeletingOvasUuid(delList) : []

        const list = data
          ? data.map(ova => {
            return {
              ...ova,
              osType: ova?.image?.osType || '-',
              osSystem: ova?.image?.osSystem || '-',
              osBit: ova?.image?.osBit || '-',
              customStatus: ['READY', 'RUNNING'].includes(ova?.status)
                ? {
                  VM_TEMPLATE_CREATE: '생성',
                  VM_TEMPLATE_RENAME: '템플릿 명 변경',
                  VM_TEMPLATE_UPDATE: '업데이트',
                  VM_TEMPLATE_DELETE: '삭제',
                  VM_TEMPLATE_DEPLOY: 'Deploy'
                }[ova?.lastPracticeType]
                : ''
            }
          })
          : []

        this.originData = [...list]
          .sort((a, b) => b?.createTime - a?.createTime)
        await this.filtering()
      } catch (error) {
        // this.$alert('리스트 조회에 실패하였습니다.', () => false)
        console.error(error)
      } finally {
        this.isLoadingOVAList = false
      }
    },
    /**
     * API: Central 전체 리스트를 가져옵니다.
     */
    async getCentralList () {
      try {
        this.isLoadingCentralList = true
        const allCentralList = await API.compute.getCentralList()

        if (allCentralList?.length && allCentralList[0].elements.length) this.centralVersion = allCentralList[0]?.elements[0]?.version

        return allCentralList ?? []
      } catch (error) {
        console.error(error)
      } finally {
        this.isLoadingCentralList = false
      }
    },
    /**
     * OVA를 사용할 수 있는지 판단합니다.
     * central 중에서 isSupportOva=true인 친구가 하나라도 있으면 사용 가능.
     */
    async checkAvailableOva () {
      const centrals = await this.getCentralList()
      this.allCentrals = centrals ?? [] // nx 센트럴
      this.allElements = this.allCentrals.map(central => central.elements).flat() // 센트럴 내 모든 클러스터 정보
      const clusters = this.allElements.map(el => {
        return {
          clusterName: el.clusterName,
          version: el.version,
          clusterUuid: el.clusterUuid
        }
      })
      this.allClusters = uniqBy(clusters, 'clusterUuid')
      this.isAvailableOVA = centrals.some(central => central.isSupportOva)
    },
    /**
    * ova 정보 조회 interval clear
    */
    clearListInterval () {
      clearInterval(this.interval)
      this.interval = null
    },
    /**
     * ova 정보 조회 interval
     */
    async getInterval () {
      if (this.interval) this.clearListInterval()
      this.interval = setInterval(async () => {
        await this.getVmwareTemplateList()
      }, 10000)
    },

    /**
     * 페이징 처리
     */
    setPagingData (data = this.filteredData) {
      const all = JSON.parse(JSON.stringify(data))

      console.log('@all: ', all)

      this.ovaList = all.slice(this.pageSize * (this.currentPage - 1), this.pageSize * this.currentPage)
    },
    resetFilter () {
      this.searchOvaName = ''
      this.searchVmName = ''
      this.filtering()
    },
    /**
     * 호스트명, VM 상태 필터링 이벤트
     */
    filtering () {
      if (!this.interval) this.currentPage = 1
      if (!this.searchOvaName && !this.searchVmName) this.filteredData = this.originData
      else {
        const filteredData = this.originData.filter(item => {
          let result = true
          if (this.searchOvaName) result = result && (item.templateName?.toLowerCase().includes(this.searchOvaName?.toLowerCase()))
          if (this.searchVmName) result = result && (item.vm?.name?.toLowerCase().includes(this.searchVmName?.toLowerCase()))

          return result
        })
        this.filteredData = filteredData
      }
      this.setPagingData()
    }
  },
  data () {
    return {
      interval: null,
      isAvailableOVA: true, // OVA 사용 가능 여부
      centralVersion: null, // central 버전 (일단 첫번째 central > 첫번째 cluster의 버전으로 표기)
      allCentrals: [], // nx 센트럴
      allElements: [], // nx 엘리먼트
      allClusters: [], // nx 클러스터

      originData: [],
      filteredData: [],
      ovaList: [],
      isLoadingOVAList: false, // 로딩: vm template 리스트
      isLoadingCentralList: false, // 로딩: central 리스트
      searchOvaName: '', // 검색 : 템플릿 명
      searchVmName: '', // 검색 : 소스 VM 명
      currentPage: 1,
      pageSize: 10
    }
  }
}
</script>

<style lang="scss" scoped>
.ova-list {
  margin-top: $gap-s;
}

.ova-item {
  // padding: $gap-m ($gap * 2);
  cursor: pointer;
  & + .ova-item {
    border-top: 1px solid $border-color;
  }
  &.-disabled {
    position: relative;
    cursor: default;
    .disable-wrap {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: $black;
      opacity: .4;
      z-index: 1;
      > span { color: $color-lightgrey;}
      &.unregister-template-wrap {
        opacity: .2;
        cursor: pointer;
      }
    }
  }
}

.empty-data { min-height: 500px; }
.current-version-wrap {
  margin-top: $gap;
  align-items: start;
  > ol {
    margin-top: 5px;
    line-height: 20px;
  }
}
</style>
