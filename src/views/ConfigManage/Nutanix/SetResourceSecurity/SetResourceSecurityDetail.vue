<!--
  * 파일명 : SetResourceSecurityDetail.vue
  * 파일 기능 : 구성관리 > 자원관리 > 네트워크(보안그룹) 상세 정보 확인 기능
  * 작성자 : 김예담 외 1명
  * 최종 작성일 : 2021-02-17
  * License By Shinsegae I&C
  * 2021-02-17 fix: [기등록 자원 이관 L4, L7] - read only fix: [기등록 자원 이관 보안그룹] - read only 처리 및 업데이트 폼 공통 컴포넌트로 분리
 -->

<template>
  <div class="set-resource-security-detail">
    <dashboard-panel
      :title="$v('설정 정보')"
      :padding-top="0"
      class="product-info -default"
    >
      <vertical-table
        class="product-table"
        :columns="resourceInfoColumns"
        :data="rowData"
        type="horizontal"
      >
        <template
          #deleteDate
          v-if="rowData.deleteDate && isView"
        >
          <span>
            {{ deleteDate }}
          </span>
        </template>
        <template #startTime>
          <span>{{ rowData.startTime | dateSimple }}</span>
        </template>
        <template #endTime>
          <span>{{ rowData.endTime | dateSimple }}</span>
        </template>
        <template #comment>
          <pre>{{ rowData.comment }}</pre>
        </template>
      </vertical-table>
    </dashboard-panel>
    <g-tab
      class="detail-tabs"
      :data="networkDetailTabs"
    >
      <template #manage>
        <meta-data-form
          v-loading="loading.isGetMetaInfo || loading.isUpdateMetaInfo"
          style="margin-top: -30px;"
          :form-data="metaInfoArr"
          use-update-btns
          read-only
          @save-info="saveMetaInfo"
          ref="metaDataFormRef"
        />
      </template>
      <template #startDst>
        <div class="info-contents-flex">
          <div class="info-contents">
            <strong class="small-title">
              <!-- 출발지 정보 -->
              {{ $v('출발지 정보') }}
            </strong>
            <cmp-grid
              :item-source="startData"
              :columns="startColumns"
            />
          </div>

          <div class="info-contents">
            <strong class="small-title">
              <!-- 목적지 정보 -->
              {{ $v('목적지 정보') }}
            </strong>
            <cmp-grid
              :item-source="destData"
              :columns="dstColumns"
            />
          </div>
        </div>
      </template>
      <template #policy>
        <cmp-grid
          :item-source="policyData"
          :columns="policyTableColumn"
          class="content-area policy-list-grid"
          :use-excel-download="false"
          :empty-text="$v('정책 정보가 없습니다.')"
        >
          <template #startingAddresses="props">
            <el-tooltip
              v-if="props.row.startingAddresses && props.row.startingAddresses.length > 1"
              effect="light"
            >
              <span class="receiver-tooltip-trigger">
                {{ props.row.startingAddresses[0].value }} 외 {{ props.row.startingAddresses.length - 1 }} {{ $v('개') }}
              </span>
              <div slot="content">
                <div
                  v-for="item in props.row.startingAddresses"
                  :key="item.value"
                >
                  {{ item.value }}
                </div>
              </div>
            </el-tooltip>
            <div v-else-if="props.row.startingAddresses && props.row.startingAddresses.length === 1">
              {{ props.row.startingAddresses[0].value }}
            </div>
            <div v-else>
              -
            </div>
          </template>
          <template #destinationAddresses="props">
            <el-tooltip
              v-if="props.row.destinationAddresses && props.row.destinationAddresses.length > 1"
              effect="light"
            >
              <span class="receiver-tooltip-trigger">
                {{ props.row.destinationAddresses[0].value }} 외 {{ props.row.destinationAddresses.length - 1 }} {{ $v('개') }}
              </span>
              <div slot="content">
                <div
                  v-for="item in props.row.destinationAddresses"
                  :key="item.value"
                >
                  {{ item.value }}
                </div>
              </div>
            </el-tooltip>
            <div v-else-if="props.row.destinationAddresses && props.row.destinationAddresses.length === 1">
              {{ props.row.destinationAddresses[0].value }}
            </div>
            <div v-else>
              -
            </div>
          </template>
          <template #nats="props">
            <el-tooltip
              v-if="props.row.nats && props.row.nats.length > 1"
              effect="light"
            >
              <span class="receiver-tooltip-trigger">
                {{ props.row.nats[0].ipPoolName }} 외 {{ props.row.nats.length - 1 }} {{ $v('개') }}
              </span>
              <div slot="content">
                <div
                  v-for="item in props.row.nats"
                  :key="item.ipPoolName"
                >
                  {{ item.ipPoolName }}
                </div>
              </div>
            </el-tooltip>
            <div v-else-if="props.row.nats && props.row.nats.length === 1">
              {{ props.row.nats[0].ipPoolName }}
            </div>
            <div v-else>
              -
            </div>
          </template>
          <template #destinationVips="props">
            {{ props.row.destinationVips[0].value }} 외 {{ props.row.destinationVips.length - 1 }} 개
          </template>
        </cmp-grid>
      </template>
    </g-tab>
  </div>
</template>
<script>
import API, { VerticalTable, DashboardPanel } from '@sd-fe/cmp-core'
import Dayjs from 'dayjs'
import { mapState, mapGetters } from 'vuex'
// import ConfigNetworkRoutingDetail from '@/views/Admin/SetConfigure/ConfigNetworkRouting/ConfigNetworkRoutingDetail.vue'

export default {
  name: 'SetResourceSecurityDetail',
  props: {
    groupIdx: { // groupIdx를 가져옵니다.(자원 이관시, 데이터 보여주기 위함.)
      type: Number,
      default: undefined
    }
  },
  components: {
    VerticalTable,
    'dashboard-panel': DashboardPanel
    // 'config-network-routing-detail': ConfigNetworkRoutingDetail
  },
  async created () {
    const groupIdx = this.groupIdx === undefined ? this.$route.params.idx : this.groupIdx
    await this.getSgGroupDetail(groupIdx)

    const today = Dayjs().format('YYYY-MM-DD')
    const delDate = Dayjs(this.rowData.deleteDate).format('YYYY-MM-DD')
    this.isBefore = Dayjs(today).isBefore(delDate)

    if (this.rowData?.deleteDate && this.isBefore) {
      this.resourceInfoColumns.unshift({ binding: 'deleteDate', header: '삭제 예정일', colspan: true })
    }
    this.setTabs()
  },
  mounted () {
    this.$refs.tab.clickEvent(this.detailtabData[0], 0)
  },
  computed: {
    canDelete () {
      if (this.rowData.deleteDate) {
        return this.rowData.deleteDate && this.isBefore && this.isView
      } else {
        return false
      }
    },
    deleteDate () {
      if (this.rowData.deleteDate) {
        return Dayjs(this.rowData.deleteDate).format('YYYY-MM-DD')
      } else {
        return ''
      }
    },
    ...mapState({
      // breadcrumbs: state => state.common.breadcrumbs,
      networkSGmetadataForm: state => state.metadata.NETWORK.SECURITY
    }),
    ...mapGetters(['user'])
  },
  methods: {

    /** 메타데이터 */
    async getMetaInfo (data = this.rowData) {
      console.log('🚀 ~ file: SetResourceSwitchDetail.vue:233 ~ getMetaInfo ~ loadBalanceData:', this.rowData)
      try {
        this.loading.isUpdateMetaInfo = true
        // 메타데이터 동기화 -> 메타데이터 편집 중이 아닐 때만
        if (this.isMetaDataFormEditing()) return

        const meta = (this.groupIdx || this.$route.params.idx)
          ? await this.getNetworkResourceMetaInfo()
          : (data?.metaInfo ? JSON.parse(data.metaInfo) : null)
        console.log('🚀 ~ file: SetResourceSwitchDetail.vue:240 ~ getMetaInfo ~ meta:', meta)

        this.metaInfoArr = await this.settingMetaDataArr(meta)

        console.log('🚀 ~ file: SetResourceSwitchDetail.vue:241 ~ getMetaInfo ~ this.metaInfoArr:', this.metaInfoArr)
      } catch (error) {
        console.error(error)
      } finally {
        this.loading.isUpdateMetaInfo = false
      }
    },
    // 메타데이터 정보 세팅
    settingMetaDataArr (data = {}) {
      try {
        const metaData = (this.networkSGmetadataForm || []).map(meta => {
          const info = data && data[meta.key]
            ? data[meta.key]
            : ''

          return {
            ...meta,
            data: info || meta.data
          }
        })
        return metaData
      } catch (error) {
        console.error(error)
      }
    },
    /**
   * API: 메타 정보를 조회 합니다. (기생성 자원의 경우)
   */
    async getNetworkResourceMetaInfo () {
      try {
        this.loading.isGetMetaInfo = true

        const groupIdx = this.groupIdx === undefined ? this.$route.params.idx : this.groupIdx

        const payload = {
          resourceType: 'SECURITY_GROUP',
          resourceIdx: groupIdx
        }

        return await API.network.getNetworkResourceMetaInfo(payload)
      } catch (error) {
        console.error(error)
        // this.$alert(this.$v('운영 정보 조회를 실패했습니다.'), () => false)
      } finally {
        this.loading.isGetMetaInfo = false
      }
    },
    /**
   * API: 메타 정보를 업데이트 합니다.
   */
    async saveMetaInfo (params) {
      const groupIdx = this.groupIdx === undefined ? this.$route.params.idx : this.groupIdx
      try {
        this.loading.isUpdateMetaInfo = true

        const payload = {
          metaInfo: JSON.stringify(params),
          reqUserId: this.user.userId,
          index: groupIdx
        }

        const result = await API.network.updateSecurityGroupMetaInfo(payload)

        if (result) {
          this.$alert(this.$v('운영 정보 업데이트를 성공했습니다.'), () => false)
          this.getMetaInfo()
        }
      } catch (error) {
        console.error(error)
        this.$alert(this.$v('운영 정보 업데이트를 실패했습니다.'), () => false)
      } finally {
        this.loading.isUpdateMetaInfo = false
      }
    },
    // 메타데이터 폼 업데이트 중인지?
    isMetaDataFormEditing () {
      const ref = this.$refs?.metaDataFormRef

      return ref?.activeEdit
    },
    /** 탭 정의 */
    setTabs () {
      const initTabs = [
        { field: 'manage', name: this.$v('운영 정보'), active: true },
        { field: 'startDst', name: this.$v('출발지 및 목적지'), active: false },
        { field: 'policy', name: this.$v('정책 정보'), active: false }
      ]

      this.networkDetailTabs = initTabs
    },
    async cancelDelete () {
      this.$confirm('삭제 예정인 자원입니다. 삭제를 취소하시겠습니까?', '알림', {
        confirmButtonText: '확인',
        cancelButtonText: '취소'
      }).then(async () => {
        const idxType = this.rowData.userVmIdx ? 'userVmIdx' : this.rowData.userDbIdx ? 'userDbIdx' : 'userVgIdx'
        const params = {
          indexType: idxType,
          userResourceIdx: this.rowData[idxType]
        }
        const payload = {
          groupIdx: this.user.userGroup,
          groupName: this.user.userGroupName,
          projectIdx: this.rowData.projectIdx,
          service: 'SECURITY',
          userId: this.user.userId,
          userName: this.user.userName
        }
        // const payload = {
        //   companyCode: this.user.userCompanyCode,
        //   companyIdx: this.user.userCompany,
        //   companyName: this.user.userCompanyName,
        //   groupCode: this.user.userGroupCode,
        //   groupIdx: this.user.userGroup,
        //   groupName: this.user.userGroupName,
        //   userDuty: this.user.userDuty,
        //   userId: this.user.userId,
        //   userName: this.user.userName,
        //   userPosition: this.user.userPosition
        // }
        const res = await API.work.cancelDelete(params, payload)
        if (res.data) {
          this.$alert('삭제 요청이 취소되었습니다.')
          this.resourceInfoColumns.shift()
          this.isView = false
        }
      }).catch(() => false)
    },
    /**
     * 설정 정보 (로우에서 선택한 보안그룹) 데이터 세팅
     * @param {Object} data 보안그룹 정보
     * @return {Object} this.rowData 설정 정보 오브젝트
     */
    setSettingData (data) {
      this.rowData = {
        securityGroupName: data.securityGroupName,
        startTime: data.startTime,
        endTime: data.endTime,
        comment: data.comment
      }
      if (this.groupIdx === undefined) {
        this.$store.commit('common/ADD_PARAMETERS', {
          label: this.rowData.securityGroupName ? this.rowData.securityGroupName : this.$t('bc.MANAGE.resDetail'),
          path: ''
        })
      }
      return this.rowData
    },
    async getSgGroupDetail (idx) { // 보안그룹 상세
      try {
        this.loading.detail = true
        const response = await API.network.getPolicyGroup(idx)
        if (!response) return

        this.securityTableData = { ...response }
        this.setSettingData(this.securityTableData)
        // console.log('@@Table에서 클릭한 Row 정보: ', this.securityTableData)

        // [출발지 정보] 세팅
        const startingAddressList = response.startingAddresses
        if (startingAddressList) {
          for (const key in startingAddressList) {
            const server = startingAddressList[key]
            if (server) {
              this.srcInfos.push(server)
            }
          }
        }

        // [목적지 정보] 세팅
        const dstAddressList = response.destinationAddresses
        if (dstAddressList) {
          for (const key in dstAddressList) {
            const server = dstAddressList[key]
            if (server) {
              this.dstInfos.push(server)
            }
          }
        }

        for (const key in response.policies) {
          this.policyData.push(response.policies[key])
          const vrserver = response.policies[key].vrserver

          if (vrserver) {
            const serviceList = vrserver.serviceList

            if (serviceList) {
              const serviceName = []
              for (const key in serviceList) {
                serviceName.push(serviceList[key].serviceName)
              }
              response.policies[key].serviceName = serviceName
            }
          }
        }

        // 프로젝트(포트)정보 데이터 세팅
        // this.portInfos = this.securityTableData.groupPorts

        if (this.securityTableData.roadIdx !== undefined) {
          // const roads = await this.getRoadDetails(29)
          this.roadIdx = this.securityTableData.roadIdx
        }
      } catch (error) {
        console.error(error)
        this.rowData = {}
        this.srcInfos = []
        this.dstInfos = []
        // this.portInfos = []
      } finally {
        this.loading.detail = false
      }
    },
    setSelectedResource (row) {
      if (row !== null) {
        this.selectedResource = row.dataItem
        this.roadVips = this.selectedResource.virtualIps
        this.detail.policySchedule = { ...this.selectedResource.schedule }
      } else {
        this.selectedResource = null
        this.roadVips = null
        this.detail.policySchedule = null
      }
    }
  },
  data () {
    return {
      policyData: [],
      selectedResource: null, // 선택한 경유지
      roadVips: [],
      roadIpPools: [],
      roadSrcAddrs: [],
      roadDstAddrs: [],
      roadPortInfos: [],
      srcName: '',
      dstName: '',
      // portInfos: [],
      srcInfos: [],
      dstInfos: [],
      isBefore: false,
      isView: true,
      roadIdx: undefined,
      securityTableData: {},
      detailtabData: [
        { field: 'group', name: '그룹', isActive: true, keyPath: 'common.GRID.NETWORK.group' },
        { field: 'path', name: '경유지', keyPath: 'common.GRID.NETWORK.stopover' }
      ],
      rowData: {},
      // columns: [],

      loading: {
        isGetMetaInfo: false,
        isUpdateMetaInfo: false,
        detail: false, // 그룹 정보 로딩
        road: false // 경유지 정보 로딩
      },
      resourceInfoColumns: [
        { header: '보안 그룹명', binding: 'securityGroupName', colspan: true, keyPath: 'common.GRID.NETWORK.secGroup' },
        { header: '시작일', binding: 'startTime', keyPath: 'common.REGCON.billStart' },
        { header: '만료일', binding: 'endTime', keyPath: 'common.GRID.NETWORK.expireDate' },
        { header: '설명', binding: 'comment', colspan: true, keyPath: 'common.GRID.explain' }
        // { header: '삭제 예정일', binding: 'deleteDate' }
      ],
      startColumns: [
        { header: this.$v('호스트명'), binding: 'hostName' },
        { header: 'IP', binding: 'value' },
        { header: this.$v('설명'), binding: 'comment' }
      ],
      dstColumns: [
        { header: this.$v('호스트명'), binding: 'hostName' },
        { header: 'IP', binding: 'value' },
        { header: this.$v('포트'), binding: 'port' },
        { header: this.$v('프로토콜'), binding: 'protocol' },
        { header: this.$v('설명'), binding: 'comment' }
      ],
      // moreColumns: {

      // 포트 정보
      // portColumns: [
      //   { header: '포트', binding: 'port', customHtml: true, keyPath: 'common.GRID.NETWORK.port' },
      //   { header: '프로토콜', binding: 'portType', customHtml: true, keyPath: 'common.GRID.STORAGE.protocol' },
      //   { header: '설명', binding: 'comment', customHtml: true, keyPath: 'common.GRID.explain' }
      // ]
      // },

      // headerMergeColumns: {
      //   colSpan: [
      //     { startIdx: 3, endIdx: 5, header: '경유지', keyPath: 'common.GRID.NETWORK.stopover' },
      //     { startIdx: 6, endIdx: 8, header: '정책', keyPath: 'admin.PREF.policy' }
      //   ],
      //   rowSpan: ['roadName', 'srcName', 'dstName']
      // },
      // pathColumns: [
      //   { header: '경유지명', binding: 'roadName', width: '*', keyPath: 'admin.PREF.stopover' },
      //   { header: '출발지', binding: 'srcName', width: '*', keyPath: 'common.GRID.NETWORK.origin' },
      //   { header: '목적지', binding: 'dstName', width: '*', keyPath: 'common.GRID.NETWORK.dest' },
      //   { header: 'VDOM 명', binding: 'routeName', width: '*', keyPath: 'common.GRID.NETWORK.vdomName' },
      //   { header: 'SRC 망', binding: 'srcIntf', width: '*', keyPath: 'common.GRID.NETWORK.srcN' },
      //   { header: 'DST 망', binding: 'dstIntf', width: '*', keyPath: 'common.GRID.NETWORK.dstN' },
      //   { header: 'SRC', binding: 'srcIpType', width: '*' },
      //   { header: 'DST', binding: 'dstIpType', width: '*' },
      //   { header: 'NAT', binding: 'nat', width: '*' }
      // ],
      // pathTableData: [],

      // 상세 정보
      detail: {
        // VIP 정보
        vipColumns: [
          { header: 'VIP명', binding: 'virtualIpName', customHtml: true, keyPath: 'common.GRID.NETWORK.vipName' },
          { header: 'External IP', binding: 'extIp', customHtml: true },
          { header: 'Mapped IP', binding: 'mappedIp', customHtml: true }
        ],
        vipTableData: [],
        // POOL 정보
        poolColumns: [
          { header: 'Pool명', binding: 'ipPoolName', customHtml: true, keyPath: 'common.GRID.NETWORK.poolName' },
          { header: 'Pool Start IP', binding: 'startIp', customHtml: true },
          { header: 'Pool End IP', binding: 'endIp', customHtml: true }
        ],
        poolTableData: [],
        // 포트 정보
        // portColumns: [
        //   { header: '포트명', binding: 'serviceName', customHtml: true, keyPath: 'common.GRID.NETWORK.portName' },
        //   { header: '프로토콜', binding: 'serviceType', customHtml: true, keyPath: 'common.MODAL.protocol' },
        //   { header: '포트', binding: 'port', customHtml: true, keyPath: 'common.GRID.NETWORK.port' }
        // ],
        portTableData: [],

        // 스케쥴 정보
        // policyScheduleColumns: [
        //   { header: '스케쥴 명', binding: 'scheduleName', keyPath: 'common.GRID.NETWORK.scheduleName' },
        //   { header: '시작일', binding: 'start', keyPath: 'common.GRID.NETWORK.startDate' },
        //   { header: '완료일', binding: 'end', keyPath: 'common.GRID.NETWORK.completeDate' }
        // ],
        policySchedule: {
          scheduleName: '',
          start: '',
          end: ''
        }
      },
      networkDetailTabs: [],
      metaInfoArr: []
    }
  }
}
</script>
<style lang="scss" scoped>
  .set-resource-security-detail {
    .detail-tab {
      > .tab-contents-area {
        padding-top: 0;
      }
    }
    .product-info {
      &:not(.-default){
        margin-top: 20px;
      }
    }

    .-path-info-wrap {
      align-items: flex-start;
      .product-info {
        width: calc(50% - 25px);
        &+.product-info {margin-left: 50px;}
      }
    }
  }
  .info-contents-flex {
    display: flex;
    justify-content: space-between;
  }
  .info-title-wrap {
    align-items: center;
    display: flex;
    justify-content: space-between;
    position: absolute;
    top:0; right: 0;
    .detail-setting {
     > button:first-child {
        margin-right: $gap-s;
      }
    }
  }
  .info-contents {
  width: 100%;
  margin-bottom: $gap;
  &:last-child { margin-left: $gap * 2; }
}
.detail-tabs {
    margin-top: 60px;
}
</style>
