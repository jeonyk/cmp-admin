<!--
  * 파일명 : SetResourceStorageContainerList.vue
  * 파일 기능 :
  * 작성자 : 염창윤 외 3명
  * 최종 작성일 : 2021-02-03
  * License By Shinsegae I&C
  * 2021-02-03 Wijmo Grid 엑셀 다운로드 추가
 -->

<template>
  <div
    class="set-resource-storage-container-list"
    v-loading="isLoading"
  >
    <filtering-component
      @reset-data="e => {
        filteredCluster = ''
        changeCluster()
      }"
    >
      <section class="filter-form">
        <span class="filter-name">클러스터 명</span>
        <div class="filter-options">
          <el-select
            v-model="filteredCluster"
            placeholder="클러스터 선택"
            @change="changeCluster"
            :popper-append-to-body="false"
          >
            <el-option
              v-for="item in clusterOptions"
              :key="item.elementIdx"
              :label="item.clusterName"
              :value="item.clusterUuid"
            />
          </el-select>
        </div>
      </section>
    </filtering-component>

    <section class="table-top-wrap">
      <total-count
        class="total-count-wrap"
        :total-count="totalResultCnt"
      />
      <div class="button-area -right">
        <button
          class="button"
          type="is-anti"
          :disabled="!checkedItems.length"
        >
          삭제 취소
        </button>
      </div>
    </section>

    <section class="table-area">
      <cmp-grid
        v-loading="isGetStorageRequest"
        :element-loading-text="$t('common.PLACEHOLDER.loading')"
        :loading="isGetStorageRequest"
        :item-source="filteredScTableData"
        :columns="scColumns"
        header-checkbox
        @checkedRowsData="setCheckedOffItems"
        @total-count="cnt => totalResultCnt = cnt"
      >
        <template
          v-for="column in scColumns"
          :slot="column.binding"
          slot-scope="props"
        >
          <div
            :key="column.binding"
          >
            <span>{{ props.row[column.binding] }}</span>
          </div>
        </template>

        <template #controllerNumIops="props">
          <span v-if="props.row.controllerNumIops < 0">N/A
          </span>
          <span v-else>{{ props.row.controllerNumIops }} IOPS</span>
        </template>
        <template #controllerIoBandwidthKbps="props">
          {{ props.row.controllerIoBandwidthKbps |KBps }}
        </template>
        <template #controllerAvgIoLatencyUsecs="props">
          <span v-if="props.row.controllerAvgIoLatencyUsecs < 0">N/A
          </span>
          <span v-else>{{ props.row.controllerAvgIoLatencyUsecs/1000 }} ms</span>
        </template>

        <template #storageUsageBytes="props">
          {{ props.row.storageUsageBytes | byte }}
        </template>
        <template #storageFreeBytes="props">
          {{ props.row.storageFreeBytes | byte }}
        </template>
        <template #maxCapacity="props">
          {{ props.row.maxCapacity | byte }}
        </template>
        <template #createTime="props">
          {{ props.row.createTime | date }}
        </template>
      </cmp-grid>
    </section>
  </div>
</template>
<script>
import API, { FilteringComponent } from '@sd-fe/cmp-core'

export default {
  name: 'SetResourceStorageContainerList',
  components: {
    FilteringComponent
  },
  watch: {
    scTableData (newVal) {
      this.filteredScTableData = newVal
    }
  },
  async mounted () {
    try {
      this.isLoading = true
      await this.getClusterList()

      await this.getStorageContainersList()
      this.isLoading = false
    } catch (error) {
      this.isLoading = false
    }
  },
  methods: {
    async getStorageContainersList () {
      try {
        this.isGetStorageRequest = true
        this.scTableData = []
        let data = []
        data = await API.compute.getStorageContainersList()
        for (let i = 0; i < data.length; i++) {
          data[i].controllerAvgIoLatencyUsecs = Number(data[i].controllerAvgIoLatencyUsecs)
          data[i].controllerIoBandwidthKbps = Number(data[i].controllerIoBandwidthKbps)
          data[i].controllerNumIops = Number(data[i].controllerNumIops)
          data[i].storageCapacityBytes = Number(data[i].storageCapacityBytes)
          data[i].storageFreeBytes = Number(data[i].storageFreeBytes)
          data[i].storageUsageBytes = Number(data[i].storageUsageBytes)

          // const groupInfo = this.getGroupInfo(this.projectTreeData, data[i].projectIdx) // 관계사, 조직 정보를 넣어줍니다.
          // data[i].companyIdx = groupInfo.companyIdx
          // data[i].groupIdx = groupInfo.groupIdx
        }
        this.scTableData = data
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.scTableData = []
        this.$alert(message, '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          type: 'error'
        })
        return false
      } finally {
        this.isGetStorageRequest = false
      }
    },
    async getClusterList () {
      try {
        let data = []
        data = await API.compute.getClusters()

        this.clusterOptions = data
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.$alert(message, '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          type: 'error'
        })
        return false
      }
    },
    /*
     *  클러스터명 필터링
     */
    changeCluster (clusterUuid) {
      this.filteredScTableData = this.scTableData.filter(item => item.clusterUuid === clusterUuid)

      if (!clusterUuid) this.filteredScTableData = this.scTableData
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
      isLoading: false,
      filteredCluster: '',
      clusterOptions: [],

      isGetStorageRequest: false,

      checkedItems: [],

      filteredScTableData: [],
      scTableData: [],
      scColumns: [
        { header: '이름', binding: 'storageContainerName', width: '*' },
        { header: '클러스터 명', binding: 'clusterName', width: '*' },
        { header: 'Controller IOPS', binding: 'controllerNumIops', customHtml: true, width: '*' },
        { header: 'Controller IO B/W', binding: 'controllerIoBandwidthKbps', customHtml: true, width: '*' },
        { header: 'Controller IO Latency', binding: 'controllerAvgIoLatencyUsecs', customHtml: true, width: '*' },
        { header: '사용량', binding: 'storageUsageBytes', customHtml: true, width: 200 },
        { header: '남은 용량', binding: 'storageFreeBytes', customHtml: true, width: 200 },
        { header: '총 용량', binding: 'maxCapacity', customHtml: true, width: 200 },
        // { header: '가상서버명', binding: 'vmServerName', width: '*' },
        // { header: '할당량 (GB)', binding: 'quota', width: '*' },
        { header: '생성일자', binding: 'createTime', customHtml: true, width: 200, dataType: 'Date' },
        { header: '삭제 예정일', binding: 'deleteDate', width: '*', dataType: 'Date' }
      ]
    }
  }
}
</script>
