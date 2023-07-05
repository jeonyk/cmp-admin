<!--
  * 파일명 : NutanixCentralImageList.vue
  * 파일 기능 : Nutanix 설정 > Central 이미지 추가/수정/삭제
  * 작성자 : 정재은
  * 최종 작성일 : 2021-02-25
  * License By Shinsegae I&C
  * 2021-02-25 Update : 파일 is-ready 상태일 경우 css 버그 수정
 -->

<template>
  <div class="file-server-detail">
    <back-before-page class="before-page-btn" />
    <section class="detail-contents">
      <dashboard-panel
        v-loading="!tableView"
        :padding-top="0"
        title="파일 서버 정보"
      >
        <vertical-table
          v-if="tableView"
          :columns="fileServerInfoColumns"
          :data="fsDetailData"
          type="horizontal"
          class="file-server-info"
        >
          <template #networkNameList>
            <span v-if="fsDetailData.networkNameList.length === 1">
              {{ fsDetailData.networkNameList[0] }}
            </span>
            <div
              v-else-if="fsDetailData.networkNameList.length > 1"
              class="flex-box"
            >
              <span>
                {{ fsDetailData.networkNameList[0] + ' 외 ' + (fsDetailData.networkNameList.length - 1) }}
              </span>
              <div class="tooptip-icon">
                <el-tooltip
                  effect="light"
                  popper-class="shade-popper"
                >
                  <i class="mdi mdi-information-outline" />
                  <div slot="content">
                    <p
                      v-for="(item, index) in fsDetailData.networkNameList"
                      :key="index"
                    >
                      {{ item }}
                    </p>
                  </div>
                </el-tooltip>
              </div>
            </div>
          </template>
          <template #companyNameList>
            <span v-if="fsDetailData.companyNameList.length === 1">
              {{ fsDetailData.companyNameList[0] }}
            </span>
            <div
              v-else-if="fsDetailData.companyNameList.length > 1"
              class="flex-box"
            >
              <span>
                {{ fsDetailData.companyNameList[0] + ' 외 ' + (fsDetailData.companyNameList.length - 1) }}
              </span>
              <div class="tooptip-icon">
                <el-tooltip
                  effect="light"
                  popper-class="shade-popper"
                >
                  <i class="mdi mdi-information-outline" />
                  <div slot="content">
                    <p
                      v-for="(item, index) in fsDetailData.companyNameList"
                      :key="index"
                    >
                      {{ item }}
                    </p>
                  </div>
                </el-tooltip>
              </div>
            </div>
          </template>
          <template #numShare>
            <span>
              {{ fsDetailData.numShare }}
            </span>
          </template>
        </vertical-table>
      </dashboard-panel>
    </section>
    <!-- 파일 서버 정보 -->

    <g-tab
      :data="detailTabs"
      class="detail-tabs"
      :padding-top="0"
      @click="clickTab"
    >
      <template #monitor>
        <vm-monitoring>
          <file-server-monitoring-chart
            ref="fsMonitoringChart"
            :idx="fileServerUuid"
            :is-share="false"
            :threshold="fileServerThreshold"
          />
        </vm-monitoring>
      </template>

      <template #fsvm>
        <section class="detail-contents">
          <cmp-grid
            v-loading="gridLoading.fsvm"
            :item-source.sync="fsvmList"
            :columns="fsvmColumns"
          >
            <template #memoryCapacityInBytes="props">
              <span>{{ props.row.memoryCapacityInBytes | onlyGB }}</span>
            </template>
            <template #nicIps="props">
              <div
                v-for="(item, index) in props.row.nicIps"
                :key="index"
              >
                <p v-if="index < 2">
                  {{ item.ipAddress }}
                </p>
              </div>
            </template>
          </cmp-grid>
        </section>
      </template>

      <template #share>
        <section class="detail-contents">
          <cmp-grid
            v-loading="gridLoading.share"
            :item-source.sync="shareList"
            :columns="shareColumns"
          >
            <template #shareUsedSpaceByte="props">
              <span>{{ props.row.shareUsedSpaceByte | onlyGB }}</span>
            </template>
            <template #isSnapshot="props">
              <span>{{ props.row.isSnapshot ? $v('사용') : $v('미사용') }}</span>
            </template>
          </cmp-grid>
        </section>
      </template>
      <template #alert>
        <section class="detail-contents">
          <cmp-grid
            v-loading="gridLoading.alert"
            :item-source.sync="alertList"
            :columns="alertColumns"
          />
        </section>
      </template>
      <template #event>
        <section class="detail-contents">
          <cmp-grid
            v-loading="gridLoading.event"
            :item-source.sync="eventList"
            :columns="eventColumns"
          />
        </section>
      </template>
    </g-tab>
  </div>
</template>
<script>
import API, {
  MonitoringContainer,
  FSMonitoringChart,
  VerticalTable,
  DashboardPanel
} from '@sd-fe/cmp-core'
import BackBeforePage from '@/components/BackBeforePage/BackBeforePage'
import Dayjs from 'dayjs'

export default {
  name: 'NutanixFileServerDetail',
  components: {
    VerticalTable,
    DashboardPanel,
    BackBeforePage,
    'vm-monitoring': MonitoringContainer,
    'file-server-monitoring-chart': FSMonitoringChart
  },
  async created () {
    this.fileServerUuid = this.$route.params.fileServerUuid
    console.log(this.fileServerUuid)
    Promise.all([
      await this.getClusters(),
      await this.getNetworkCategoryList(),
      await this.getCompanyList(),
      await this.getFileServer(this.fileServerUuid)
    ]).then(() => {
      this.$refs.fsMonitoringChart.getThreshold()
    }).catch((error) => {
      console.log(error)
      return false
    })
  },
  watch: {
    fsvmList: {
      deep: true,
      handler (val) {
        console.log(val)
      }
    }
  },
  methods: {
    async getFsvmList (uuid) {
      console.log(uuid)

      try {
        const vms = await API.compute.getFileServerVm(uuid)
        if (vms) {
          const result = vms.map(vm => {
            return {
              vmName: vm.vmName,
              memoryCapacityInBytes: vm.memoryCapacityInBytes,
              numVcpus: vm.numVcpus,
              nicIps: vm.nicIps
            }
          })
          this.fsvmList = result
        }
      } catch (error) {
        console.log(error)
      } finally {
        this.gridLoading.fsvm = false
        console.log('@getFsvmList', this.fsvmList)
      }
    },
    async getShareList () {
      const response = await API.compute.getShareList()
      if (response) {
        const result = response.filter(share => share.fileServerUuid === this.fileServerUuid)
        this.shareList = result
        this.gridLoading.share = false
        console.log('@getShareList', this.shareList)
      }
    },
    async getAlertList () {
      try {
        const condition = { entityIds: this.fileServerUuid, entityType: 'file_server' }
        const response = await API.compute.getAlertCluster(condition)
        if (response && response.length > 0) {
          const result = this.sortTicket(response[0].data, 'lastOccurrenceTimeStamp', 'alert')
          this.alertList = result
        }
      } catch (error) {
        console.log(error)
      } finally {
        this.gridLoading.alert = false
        console.log('@getAlertList', this.alertList)
      }
    },
    async getEventList () {
      const condition = { entityIds: this.fileServerUuid, entityType: 'file_server' }
      const response = await API.compute.getNutanixEvent(condition)
      if (response) {
        const result = this.sortTicket(response[0].data, 'createdTimeStamp', 'event')
        this.eventList = result
        this.gridLoading.event = false
        console.log('@getEventList', this.eventList)
      }
    },
    async clickTab (clickedTab) {
      if (clickedTab.field === 'fsvm') {
        if (!this.fsvmList.length) {
          this.gridLoading.fsvm = true
          await this.getFsvmList(this.fileServerUuid)
        }
      }
      if (clickedTab.field === 'share') {
        if (!this.shareList.length) {
          this.gridLoading.share = true
          await this.getShareList()
        }
      }
      if (clickedTab.field === 'alert') {
        if (!this.alertList.length) {
          this.gridLoading.alert = true
          await this.getAlertList()
        }
      }
      if (clickedTab.field === 'event') {
        if (!this.eventList.length) {
          this.gridLoading.event = true
          await this.getEventList()
        }
      }
    },
    async getCompanyList () {
      await this.$store.dispatch('common/getSimpleCompanyList')
      this.companyList = this.$store.state.common.company
      console.log('@getCompanyList', this.companyList)
    },
    async getNetworkCategoryList () {
      await this.$store.dispatch('network/getNetworkCategoryList', { isAdmin: true, isDeleted: false })
      this.networkCategoryList = this.$store.state.network.networkCategoryList
      console.log('@getNetworkCategoryList', this.networkCategoryList)
    },
    async getClusters () {
      await this.$store.dispatch('cluster/getClusters', ['clusterUuid', 'clusterName'])
      this.clusters = this.$store.state.cluster.clusterList
      console.log('@getClusters', this.clusters)
    },
    getClusterName (data) {
      console.log('@getClusterName', data.clusterUuid)
      return this.clusters.find(item => item.clusterUuid === data.clusterUuid)
    },
    getNetworkCateName (data) {
      return this.networkCategoryList.find(item => item.ipCategoryIdx === data.cateIdx)
    },
    getCompanyName (data) {
      return this.companyList.find(item => item.field === data.companyIdx)
    },
    /**
     * File Server List 조회
     */
    async getFileServer (fileServerUuid) {
      const data = await API.compute.getFileServer(fileServerUuid)
      if (data) {
        // 클러스터 정보
        if (data.clusterUuid) {
          const clusterInfo = this.getClusterName(data)
          console.log(clusterInfo)
          data.clusterName = clusterInfo?.clusterName
        }

        // 네트워크 카테고리 정보
        if (data.networkList?.length) {
          data.networkNameList = data.networkList.map(network => {
            const item = this.getNetworkCateName(network)
            console.log(item)
            return item?.cateKey || '-'
          })
        }

        // 관계사 정보
        if (data.companyList?.length) {
          data.companyNameList = data.companyList.map(company => {
            const item = this.getCompanyName(company)
            console.log(item)
            return item?.label || '-'
          })
        }

        // 임계치 정보 추출
        this.fileServerThreshold = {
          fsManageIndicator: data.fsManageIndicator, // 관리 지표
          firstThresholdPercent: data.firstThresholdPercent, // 1차 임계치
          secondThresholdPercent: data.secondThresholdPercent // 2차 임계치 입니다.
        }

        this.fsDetailData = data
        this.tableView = true
        console.log('@getFileServer: fsDetailData', this.fsDetailData, this.fileServerThreshold)
      }
    },
    /**
     * alert 데이터 sorting 및 가공
     */
    sortTicket (data, key, type) {
      const filterInfo = data?.filter(item => item.severity !== 'kInfo')

      // 시간순으로 정렬
      const sortedData = filterInfo?.sort((a, b) => {
        const timeA = a[key]
        const timeB = b[key]
        if (timeA > timeB) return -1
        else if (timeA < timeB) return 1
        else return 0
      })

      const format = (date) => date ? Dayjs(new Date(date)).format('YYYY.MM.DD HH:mm') : undefined

      // date 형식 가공
      return sortedData?.map((item, idx) => {
        const {
          severity, lastOccurrenceTimeStamp,
          entityTypes,
          createdTimeStamp,
          contextTypes, contextValues
        } = item

        let message = item.message
        let alertTitle = item.alertTitle
        contextTypes.forEach((type, index) => {
          const regex = new RegExp(type)
          if (regex.test(alertTitle)) alertTitle = alertTitle.replace('{' + type + '}', contextValues[index])
          if (regex.test(message)) message = message.replace('{' + type + '}', contextValues[index])
        })

        let result = {
          ...item,
          message,
          alertTitle,
          // _ :: 내부에서 사용한다는 의미
          _severity: severity.toLowerCase().replace('k', ''),
          _createdTime: format(createdTimeStamp),
          _lastOccuredTime: format(lastOccurrenceTimeStamp)
        }
        if (type === 'alert') {
          result = {
            ...result,
            _entityTypes: entityTypes.join(',') // 발생 위치
          }
        }

        return result
      })
    }
  },
  data (root) {
    return {
      detailTabs: [
        { field: 'monitor', name: root.$v('모니터링 정보'), active: false },
        { field: 'fsvm', name: root.$v('FSVM'), active: true },
        { field: 'share', name: root.$v('Share'), active: true },
        { field: 'alert', name: root.$v('Alert'), active: true },
        { field: 'event', name: root.$v('Event'), active: true }
      ],
      fileServerInfoColumns: [
        { binding: 'fileServerName', header: '이름', keyPath: root.$v('이름') },
        { binding: 'networkNameList', header: '네트워크 카테고리', keyPath: root.$v('네트워크 카테고리') },
        { binding: 'companyNameList', header: '관계사', keyPath: root.$v('관계사') },
        { binding: 'clusterName', header: '클러스터', keyPath: root.$v('클러스터') },
        { binding: 'dnsDomainName', header: 'DNS 도메인 이름', keyPath: root.$v('DNS 도메인 이름') },
        { binding: 'numShare', header: 'Share 개수', keyPath: root.$v('Share 개수') },
        { binding: 'protocolType', header: '프로토콜', keyPath: root.$v('프로토콜'), colspan: true }
        // { binding: '#####', header: 'Open Connections', keyPath: root.$v('Open Connections') },
        // { binding: '#####', header: 'Data Reduction Ratio', keyPath: root.$v('Data Reduction Ratio') },
        // { binding: '#####', header: 'Data Savings', keyPath: root.$v('Data Savings') },
      ],
      fsDetailData: {},
      tableView: false,
      companyList: [],
      networkCategoryList: [],
      clusters: [],
      fileServerUuid: '',
      gridLoading: {
        fsvm: false,
        share: false,
        alert: false,
        event: false
      },
      fsvmList: [],
      shareList: [],
      alertList: [],
      eventList: [],
      fsvmColumns: [
        { binding: 'vmName', header: root.$v('VM 이름'), customHtml: true },
        { binding: 'memoryCapacityInBytes', header: root.$v('메모리'), customHtml: true },
        { binding: 'numVcpus', header: root.$v('vCPU'), customHtml: true },
        { binding: 'nicIps', header: root.$v('IP'), customHtml: true }
      ],
      shareColumns: [
        { binding: 'shareName', header: root.$v('이름'), customHtml: true },
        { binding: 'shareUsedSpaceByte', header: root.$v('사용량'), customHtml: true },
        { binding: 'shareUsedSnapshotByte', header: root.$v('Snapshots Space'), customHtml: true },
        { binding: 'isSnapshot', header: root.$v('스냅샷 사용 여부'), customHtml: true }
      ],
      alertColumns: [
        { binding: '_severity', header: root.$t('config.Alerts.risk'), customHtml: true }, // 위험도
        { binding: '_entityTypes', header: root.$t('config.Alerts.occur'), customHtml: true }, // 발생 위치
        { binding: '_createdTime', header: root.$v('생성 시각'), customHtml: true },
        { binding: '_lastOccuredTime', header: root.$v('마지막 발생 시각'), customHtml: true },
        { binding: 'message', header: root.$v('메시지'), customHtml: true }
      ],
      eventColumns: [
        { binding: 'message', header: root.$v('메시지'), customHtml: true },
        { binding: '_createdTime', header: root.$v('생성 시각'), customHtml: true }
        // { binding: '_lastOccuredTime', header: root.$v('마지막 발생 시각'), customHtml: true },
      ],
      fileServerThreshold: {}
    }
  }

}
</script>
<style lang="scss">
  .file-server-detail {
    position: relative;
    .before-page-btn {
      position: absolute;
      top: -58px;
      left: 0;
    }

    .detail-tabs {
      .detail-contents {
        padding-top: 20px;
      }
    }

    .file-server-info {
      .flex-box {
        display: flex;
        align-items: center;
        .tooptip-icon {
          display: inline-block;
          margin-left: 5px;
        }
      }

    }

  }
</style>
