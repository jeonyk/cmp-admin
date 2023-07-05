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
    <g-tab
      :data="detailtabData"
      class="detail-tab"
      :padding-top="20"
      ref="tab"
    >
      <!-- 그룹 -->
      <template #group>
        <div
          class="security-detail -group"
          v-loading="loading.detail"
        >
          <dashboard-panel
            :padding-top="0"
            :title="$t('common.GRID.NETWORK.setInfo')"
            class="product-info -default"
          >
            <template #header>
              <button
                v-if="canDelete"
                class="button"
                type="is-primary"
                @click="cancelDelete"
              >
                삭제 취소
              </button>
            </template>
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

          <div class="flex-wrap -path-info-wrap">
            <dashboard-panel
              :padding-top="0"
              :title="$t('common.GRID.NETWORK.originInfo')"
              class="product-info"
            >
              <cmp-grid
                :item-source="srcInfos"
                :columns="moreColumns.startColumns"
                :use-excel-download="false"
              />
            </dashboard-panel>
            <!-- 출발지 -->

            <dashboard-panel
              :padding-top="0"
              :title="$t('common.GRID.NETWORK.destInfo')"
              class="product-info"
            >
              <cmp-grid
                :item-source="dstInfos"
                :columns="moreColumns.destColumns"
                :use-excel-download="false"
              />
            </dashboard-panel>
            <!-- 목적지 -->
          </div>

          <dashboard-panel
            :padding-top="0"
            :title="$t('common.MODAL.serviceInfo')"
            class="product-info"
          >
            <cmp-grid
              :item-source="portInfos"
              :columns="moreColumns.portColumns"
              :use-excel-download="false"
            />
          </dashboard-panel>
        </div>
      </template>

      <!-- 경유지 -->
      <template #path>
        <!-- 환경설정 > 경유지 설정 상세 항목과 동일한 페이지로 보여주기로 합의. 그래서 일단 주석처리.. 지우지 마세요! (21.04.29) -->

        <!-- <div
          class="security-detail -road"
          v-loading="loading.road"
        >
          <cmp-grid
            :item-source="pathTableData"
            :columns="pathColumns"
            :header-merge="headerMergeColumns"
            selectable
            @selectedRow="setSelectedResource"
          />

          <section v-if="selectedResource">
            <dashboard-panel
              :padding-top="0"
              class="product-info"
              :title="$t('common.REGCON.vipInfo')"
            >
              <cmp-grid
                :item-source="roadVips"
                :columns="detail.vipColumns"
              />
            </dashboard-panel>

            <dashboard-panel
              :padding-top="0"
              class="product-info"
              :title="$t('common.REGCON.poolInfo')"
            >
              <cmp-grid
                :item-source="roadIpPools"
                :columns="detail.poolColumns"
              />
            </dashboard-panel>

            <div class="flex-wrap -path-info-wrap">
              <dashboard-panel
                :padding-top="0"
                class="product-info"
                title="출발지 정보"
              >
                <cmp-grid
                  :item-source="roadSrcAddrs"
                  :columns="detail.startColumns"
                  :use-excel-download="false"
                />
              </dashboard-panel>

              <dashboard-panel
                :padding-top="0"
                class="product-info"
                title="목적지 정보"
              >
                <cmp-grid
                  :item-source="roadDstAddrs"
                  :columns="detail.destColumns"
                  :use-excel-download="false"
                />
              </dashboard-panel>
            </div>

            <dashboard-panel
              :padding-top="0"
              class="product-info"
              :title="$t('common.REGCON.scheInfo')"
            >
              <vertical-table
                class="product-table"
                :columns="detail.policyScheduleColumns"
                :data="detail.policySchedule"
                type="horizontal"
              >
                <template #scheduleName>
                  <span>{{ detail.policySchedule.scheduleName }}</span>
                </template>
                <template #start>
                  <span>{{ detail.policySchedule.start | dateSimple }}</span>
                </template>
                <template #end>
                  <span>{{ detail.policySchedule.end | dateSimple }}</span>
                </template>
              </vertical-table>
            </dashboard-panel>
          </section>
        </div> -->
        <config-network-routing-detail
          :detail-idx="roadIdx"
          @error="() => {$refs.tab.clickEvent(detailtabData[0], 0)}"
        />
      </template>
    </g-tab>
  </div>
</template>
<script>
import API, { VerticalTable, DashboardPanel } from '@sd-fe/cmp-core'
import Dayjs from 'dayjs'
import { mapGetters } from 'vuex'
import ConfigNetworkRoutingDetail from '@/views/Admin/SetConfigure/ConfigNetworkRouting/ConfigNetworkRoutingDetail.vue'

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
    'dashboard-panel': DashboardPanel,
    'config-network-routing-detail': ConfigNetworkRoutingDetail
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
    ...mapGetters(['user'])
  },
  methods: {
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

        // 출발지 정보 & 목적지 정보 데이터 세팅
        this.securityTableData.groupAddresses.map(g => {
          if (g.addressDirection === 'START') {
            this.srcInfos.push(g)
          } else if (g.addressDirection === 'DESTINATION') {
            this.dstInfos.push(g)
          }
        })
        // 프로젝트(포트)정보 데이터 세팅
        this.portInfos = this.securityTableData.groupPorts

        if (this.securityTableData.roadIdx !== undefined) {
          // const roads = await this.getRoadDetails(29)
          this.roadIdx = this.securityTableData.roadIdx
        }
      } catch (error) {
        console.error(error)
        this.rowData = {}
        this.srcInfos = []
        this.dstInfos = []
        this.portInfos = []
      } finally {
        this.loading.detail = false
      }
    },
    // /** 환경설정 > 경유지 설정 상세 항목과 동일한 페이지로 보여주기로 합의. 그래서 일단 주석처리.. 지우지 마세요! (21.04.29)
    //  * 경유지 정보를 보여줍니다.
    //  * @param {Number} idx 보안그룹Idx
    //  */
    // async getRoadDetails (idx) {
    //   try {
    //     this.loading.road = true
    //     const response = await API.network.getPolicyRoadDetails(idx)
    //     if (!response) return []
    //     else return [...response]
    //   } catch (error) {
    //     console.error(error)
    //     this.pathTableData = []
    //   } finally {
    //     this.loading.road = false
    //   }
    // },
    // /**
    //  * 경유지 정보 세팅
    //  * @param Array,
    //  */
    // setPolicies (policies) {
    //   if (!policies?.length) return []
    //   console.log('@@@@@', policies)

    //   const policyRoadDetails = policies.map(policy => {
    //     return {
    //       dstIntf: policy.dstInterface,

    //       roadName: policy.roadName,
    //       srcRoadType: policy.srcRoadType,
    //       dstRoadType: policy.dstRoadType,
    //       routeName: policy.routeName,
    //       srcIntf: policy.srcIntf,
    //       srcIpType: policy.srcIpType,
    //       dstIpType: policy.dstIpType,
    //       nat: policy.nat,

    //       vdomId: policy.vdomId,
    //       originPolicyData: {
    //         nat: policy.nat,
    //         vdomId: policy.vdomId,
    //         srv: policy.srv,
    //         srcintf: policy.srcintf,
    //         dstintf: policy.dstintf,
    //         srcaddr: policy.srcaddr,
    //         dstaddr: policy.dstaddr
    //       }

    //     }
    //   })
    //   if (!policyRoadDetails?.length) return []

    //   const mappedPolicy = uniq(policyRoadDetails, 'vdomId') // policyRoadDetails 중복 경유지 제거

    //   const result = mappedPolicy.map(detail => {
    //     const obj = detail
    //     for (let i = 0; i < policies.length; i++) {
    //       if (detail.vdomId === policies[i].vdomId) {
    //         obj.virtualIps = policies[i].virtualIps
    //         obj.schedule = policies[i].schedule
    //       }
    //     }
    //     return obj
    //   })
    //   console.log('@경유지 정보: ', result)

    //   // ==================

    //   // return result
    // },
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
      selectedResource: null, // 선택한 경유지
      roadVips: [],
      roadIpPools: [],
      roadSrcAddrs: [],
      roadDstAddrs: [],
      roadPortInfos: [],
      srcName: '',
      dstName: '',
      portInfos: [],
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

      resourceInfoColumns: [
        { header: '보안 그룹명', binding: 'securityGroupName', colspan: true, keyPath: 'common.GRID.NETWORK.secGroup' },
        { header: '시작일', binding: 'startTime', keyPath: 'common.REGCON.billStart' },
        { header: '만료일', binding: 'endTime', keyPath: 'common.GRID.NETWORK.expireDate' },
        { header: '설명', binding: 'comment', colspan: true, keyPath: 'common.GRID.explain' }
        // { header: '삭제 예정일', binding: 'deleteDate' }
      ],
      moreColumns: {
        startColumns: [
          { header: '타입', binding: 'addressType', customHtml: true, keyPath: 'common.MODAL.type' },
          { header: 'IP', binding: 'value', customHtml: true },
          { header: '설명', binding: 'comment', customHtml: true, keyPath: 'common.GRID.explain' }
        ],

        // 목적지 정보
        destColumns: [
          { header: '타입', binding: 'addressType', customHtml: true, keyPath: 'common.MODAL.type' },
          { header: 'IP', binding: 'value', customHtml: true },
          { header: '설명', binding: 'comment', customHtml: true, keyPath: 'common.GRID.explain' }
        ],

        // 포트 정보
        portColumns: [
          { header: '포트', binding: 'port', customHtml: true, keyPath: 'common.GRID.NETWORK.port' },
          { header: '프로토콜', binding: 'portType', customHtml: true, keyPath: 'common.GRID.STORAGE.protocol' },
          { header: '설명', binding: 'comment', customHtml: true, keyPath: 'common.GRID.explain' }
        ]
      },

      headerMergeColumns: {
        colSpan: [
          { startIdx: 3, endIdx: 5, header: '경유지', keyPath: 'common.GRID.NETWORK.stopover' },
          { startIdx: 6, endIdx: 8, header: '정책', keyPath: 'admin.PREF.policy' }
        ],
        rowSpan: ['roadName', 'srcName', 'dstName']
      },
      pathColumns: [
        { header: '경유지명', binding: 'roadName', width: '*', keyPath: 'admin.PREF.stopover' },
        { header: '출발지', binding: 'srcName', width: '*', keyPath: 'common.GRID.NETWORK.origin' },
        { header: '목적지', binding: 'dstName', width: '*', keyPath: 'common.GRID.NETWORK.dest' },
        { header: 'VDOM 명', binding: 'routeName', width: '*', keyPath: 'common.GRID.NETWORK.vdomName' },
        { header: 'SRC 망', binding: 'srcIntf', width: '*', keyPath: 'common.GRID.NETWORK.srcN' },
        { header: 'DST 망', binding: 'dstIntf', width: '*', keyPath: 'common.GRID.NETWORK.dstN' },
        { header: 'SRC', binding: 'srcIpType', width: '*' },
        { header: 'DST', binding: 'dstIpType', width: '*' },
        { header: 'NAT', binding: 'nat', width: '*' }
      ],
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
        // // 출발지 정보
        // startColumns: [
        //   { header: '출발지명', binding: 'addressName', customHtml: true },
        //   { header: '타입', binding: 'addressType', customHtml: true },
        //   { header: 'IP', binding: 'value', customHtml: true }
        // ],
        // startTableData: [],
        // // 목적지 정보
        // destColumns: [
        //   { header: '목적지명', binding: 'addressName', customHtml: true },
        //   { header: '타입', binding: 'addressType', customHtml: true },
        //   { header: 'IP', binding: 'value', customHtml: true }
        // ],
        // destTableData: [],
        // 포트 정보
        portColumns: [
          { header: '포트명', binding: 'serviceName', customHtml: true, keyPath: 'common.GRID.NETWORK.portName' },
          { header: '프로토콜', binding: 'serviceType', customHtml: true, keyPath: 'common.MODAL.protocol' },
          { header: '포트', binding: 'port', customHtml: true, keyPath: 'common.GRID.NETWORK.port' }
        ],
        portTableData: [],

        // 스케쥴 정보
        policyScheduleColumns: [
          { header: '스케쥴 명', binding: 'scheduleName', keyPath: 'common.GRID.NETWORK.scheduleName' },
          { header: '시작일', binding: 'start', keyPath: 'common.GRID.NETWORK.startDate' },
          { header: '완료일', binding: 'end', keyPath: 'common.GRID.NETWORK.completeDate' }
        ],
        policySchedule: {
          scheduleName: '',
          start: '',
          end: ''
        }
      },
      loading: {
        detail: false, // 그룹 정보 로딩
        road: false // 경유지 정보 로딩
      }

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
</style>
