<template>
  <div class="tgw-detail">
    <template v-if="!isErrorGetData && detailData">
      <div
        v-loading="isLoadingDetailData"
        class="detail"
      >
        <dashboard-panel
          :padding-top="0"
          :title="$v('기본 정보')"
          small-title
        >
          <vertical-table
            :data="detailData ? detailData.transitGatewayDto : {}"
            :columns="baseInfoColumns"
            type="horizontal"
          />
        </dashboard-panel>
        <div
          v-if="detailData"
          class="tgw-connection"
        >
          <g-tab
            v-loading="isInfoLoading"
            :data="tgwDetailTab"
            @click="onClickTab"
          >
            <template #resource-vpc>
              <div
                v-if="resourceVpc.data && resourceVpc.data.length"
                class="vpc-resources"
              >
                <div class="vpc-resource">
                  <h3>{{ $v('연결된 VPC 환경') }}</h3>
                  <cmp-grid
                    key="vpc-resource-grid"
                    :header-merge="{ colSpan: resourceVpc.colSpan, rowSpan: resourceVpc.rowSpan }"
                    :columns="resourceVpc.columns"
                    :item-source="resourceVpc.data"
                  >
                    <template #sourceVpcEnvironment="{ row }">
                      {{ getVpcName(row.sourceVpcEnvironment) }}
                    </template>
                    <template #targetVpcEnvironment="{ row }">
                      {{ getVpcName(row.targetVpcEnvironment) }}
                    </template>
                  </cmp-grid>
                </div>
              </div>
              <div
                v-else
                class="empty-data"
              >
                {{ $v('데이터가 없습니다.') }}
              </div>
            </template>
            <template #resource-vpn>
              <div
                v-if="resourceVpn.data.length"
                class="vpn-resource"
              >
                <div class="vpn-resource-download">
                  <button
                    class="button"
                    type="is-primary"
                    :disabled="!resourceVpn.selectedRow"
                    @click="isActiveCompDownloadVpn = true"
                  >
                    VPN 구성 다운로드
                  </button>
                  <vpn-comp-download
                    :project-idx="resourceVpn.selectedRow ? resourceVpn.selectedRow.projectIdx : null"
                    :vpn-connection-id="resourceVpn.selectedRow ? resourceVpn.selectedRow.vpnConnectionId : null"
                    :active="isActiveCompDownloadVpn"
                    @close="isActiveCompDownloadVpn = false"
                  />
                </div>
                <div class="vpn-resource-list">
                  <h3>{{ $v('VPN 목록') }}</h3>
                  <cmp-grid
                    key="vpn-resource-vpn-list"
                    :columns="resourceVpn.columns"
                    :item-source="resourceVpn.data"
                    selectable
                    @selectedRow="onSelectResourceVpn"
                  >
                    <template #vpcEnvironments="{ row }">
                      {{ row.vpcEnvironments.map(vpc => getVpcName(vpc)).join(', ') }}
                    </template>
                  </cmp-grid>
                </div>
                <template v-if="resourceVpn.selectedRow && resourceVpn.detailData">
                  <div class="vpn-resource-data">
                    <h3>{{ $v('연결된 VPC 정보') }}</h3>
                    <cmp-grid
                      key="vpn-resource-vpn-data"
                      :columns="resourceVpn.dataColumns"
                      :item-source="resourceVpn.detailData.mappingResDtos"
                    >
                      <template #sourceVpcEnvironment="{ row }">
                        {{ getVpcName(row.sourceVpcEnvironment) }}
                      </template>
                    </cmp-grid>
                  </div>
                  <div class="vpn-resource-detail">
                    <h3>{{ $v('VPN 세부 정보') }}</h3>
                    <vertical-table
                      v-if="resourceVpn.detailData.vpnConnectionJson"
                      key="vpn-resource-vpn-detail"
                      type="horizontal"
                      :data="resourceVpn.detailData.vpnConnectionJson.options"
                      :columns="resourceVpn.detailColumns"
                    >
                      <template #enableAcceleration="{ row }">
                        {{ row.enableAcceleration ? '네' : '아니요' }}
                      </template>
                      <template #staticRoutesOnly="{ row }">
                        {{ row.staticRoutesOnly ? '정적' : '동적' }}
                      </template>
                      <template #localIpv4NetworkCidr="{ row }">
                        {{ row.localIpv4NetworkCidr }}
                      </template>
                      <template #remoteIpv4NetworkCidr="{ row }">
                        {{ row.remoteIpv4NetworkCidr }}
                      </template>
                    </vertical-table>
                  </div>
                </template>
              </div>
              <div
                v-else
                class="empty-data"
              >
                {{ $v('데이터가 없습니다.') }}
              </div>
            </template>
            <template #resource-peering>
              <div class="peering-resource">
                <div
                  v-if="resourcePeering.data && resourcePeering.data.length"
                  class="peering-resource-list"
                >
                  <h3>{{ $v('Peering 목록') }}</h3>
                  <cmp-grid
                    key="peering-resource-peering-list"
                    :columns="resourcePeering.columns"
                    :item-source="resourcePeering.data"
                    :header-merge="{ colSpan: resourcePeering.listColSpan, rowSpan: resourcePeering.listRowSpan}"
                    selectable
                    @selectedRow="onSelectResourcePeering"
                  />
                </div>
                <div
                  v-else
                  class="empty-data"
                >
                  {{ $v('데이터가 없습니다.') }}
                </div>
                <template v-if="resourcePeering.selectedRow && resourcePeering.detailData">
                  <div class="peering-resource-project">
                    <h3>{{ $v('프로젝트 정보') }}</h3>
                    <vertical-table
                      type="horizontal"
                      :columns="resourcePeering.projectColumns"
                      :data="resourcePeering.selectedRow"
                    />
                  </div>
                  <div class="peering-resource-detail">
                    <h3>{{ $v('VPC 정보') }}</h3>
                    <cmp-grid
                      key="peering-resource-peering-detail"
                      cell-merge
                      :columns="resourcePeering.detailColumns"
                      :header-merge="{ rowSpan: resourcePeering.detailRowSpan, colSpan: resourcePeering.detailColSpan}"
                      :item-source="resourcePeering.vpcInfo"
                    />
                    <!-- :init-custom-action="onInitPeeringDetailGrid" -->
                  </div>
                </template>
              </div>
            </template>
          </g-tab>
        </div>
        <!-- <dashboard-panel
          :padding-top="0"
          title="연결 정보"
          small-title
        >
          <cmp-grid
            :columns="selectAttachmentGridColumns"
            :item-source="selectAttachmentGridData"
            selectable
            @selectedRow="onSelectAttahcment"
          />
        </dashboard-panel>
        <dashboard-panel
          :padding-top="0"
          title="선택 연결 정보"
          small-title
        >
          <template v-if="selectedAttachment">
            <vertical-table
              :data="selectedAttachment"
              :columns="selectAttahcmentVTableColumns"
              type="horizontal"
            />
            <template v-if="selectedAttachment.resourceType === 'VPN'">
              <dashboard-panel
                :padding-top="0"
                title="터널 세부 정보"
                small-title
              >
                <div
                  v-for="(tunnel, idx) in selectedAttachment.vpnConnectionJson
                    .options.tunnelOptions"
                  :key="idx"
                  class="flex-wrap column-3"
                >
                  <register-contents :title="`터널 ${idx + 1} 외부 IP 주소`">
                    {{ tunnel.outsideIpAddress }}
                  </register-contents>
                  <register-contents :title="`터널 ${idx + 1} 내부 IPv4 CIDR`">
                    {{ tunnel.tunnelInsideCidr }}
                  </register-contents>
                  <register-contents :title="`터널 ${idx + 1} 상태`">
                    {{
                      selectedAttachment.vpnConnectionJson.vgwTelemetry[idx]
                        .status
                    }}
                  </register-contents>
                </div>
              </dashboard-panel>
            </template>
          </template>
          <template v-else>
            <div class="empty-data">
              선택된 연결 정보가 없습니다.
            </div>
          </template>
        </dashboard-panel> -->
        <dashboard-panel
          :padding-top="0"
          title="라우팅 테이블 정보"
          small-title
        >
          <vertical-table
            :data="detailData.transitGatewayRouteTableDto"
            :columns="routingTableColumns"
            type="horizontal"
          />
        </dashboard-panel>
        <dashboard-panel
          :padding-top="0"
          :title="
            `라우팅 테이블 > 연결 (${detailData.transitGatewayRouteTableDto.associationsJson.length} EA)`
          "
          small-title
        >
          <cmp-grid
            :columns="routingTableAssociationGridColumns"
            :item-source="
              detailData.transitGatewayRouteTableDto.associationsJson
            "
          />
        </dashboard-panel>
        <dashboard-panel
          :padding-top="0"
          :title="
            `라우팅 테이블 > 전파 (${detailData.transitGatewayRouteTableDto.propagationsJson.length} EA)`
          "
          small-title
        >
          <cmp-grid
            :columns="routingTableAssociationGridColumns"
            :item-source="
              detailData.transitGatewayRouteTableDto.propagationsJson
            "
          />
        </dashboard-panel>
        <dashboard-panel
          :padding-top="0"
          :title="
            `라우팅 테이블 > 경로 (${detailData.transitGatewayRouteTableDto.routesJson.length} EA)`
          "
          small-title
        >
          <cmp-grid
            :columns="routingTableRouteGridColumns"
            :item-source="detailData.transitGatewayRouteTableDto.routesJson"
          >
            <template #attachmentsresourceId="{ row }">
              <span v-if="row.attachments.resourceType !== 'VPN'">
                {{ row.attachments.resourceId }}
              </span>
              <el-tooltip
                v-else
                effect="light"
              >
                <span class="more">{{ row.attachments.resourceId }}</span>
                <div slot="content">
                  <div
                    v-for="attachment in row.originAttachments"
                    :key="attachment.resourceId"
                  >
                    {{ attachment.resourceId }}
                  </div>
                </div>
              </el-tooltip>
            </template>
          </cmp-grid>
        </dashboard-panel>
      </div>
    </template>
    <template v-else>
      <div class="empty-data">
        {{ $v("데이터가 없습니다.") }}
      </div>
    </template>
  </div>
</template>

<script>
import API, {
  DashboardPanel,
  VerticalTable,
  ResCreateUtil,
  VPNCompDownload
} from '@sd-fe/cmp-core'
import TransitGatewayStateMap from '@/components/AWS/TGW/TransitGatewayStateMap'
import { mapGetters } from 'vuex'
import dayjs from 'dayjs'
import * as wjGrid from '@grapecity/wijmo.grid'

export default {
  name: 'TransitGatewayDetail',
  components: {
    DashboardPanel,
    VerticalTable,
    'vpn-comp-download': VPNCompDownload
  },
  mixins: [TransitGatewayStateMap, ResCreateUtil.methodUtils],
  watch: {
    getIsProjectLoaded: {
      immediate: true,
      handler (loaded) {
        if (loaded) this.getDetailData(this.$route.params.tgwId)
      }
    },
    detailData (data) {
      if (data && data.transitGatewayDto) {
        this.getVpcInfo()
      }
    }
  },
  computed: {
    ...mapGetters({
      getIsProjectLoaded: 'project/getIsProjectLoaded',
      getProject: 'project/getProject'
    }),
    selectAttahcmentVTableColumns () {
      if (!this.selectedAttachment) return []

      switch (this.selectedAttachment.resourceType) {
        case 'VPN':
          return [
            {
              binding: 'vpnConnectionJson.customerGatewayId',
              header: '고객 게이트웨이 ID'
            },
            {
              binding: 'vpnConnectionJson.customerGatewayName',
              header: '고객 게이트웨이 이름'
            },
            { binding: 'vpnConnectionJson.bgpAsn', header: 'bgp ASN' },
            { binding: '', header: 'IP 주소' },
            { binding: 'vpnConnectionJson.type', header: '유형' },
            { binding: 'stateKor', header: '상태' },
            { binding: 'isAcceleration', header: '가속 사용됨' },
            { binding: 'routeType', header: '라우팅' },
            {
              binding: 'vpnConnectionJson.options.localIpv4NetworkCidr',
              header: '로컬 IPv4 네트워크 CIDR'
            },
            {
              binding: 'vpnConnectionJson.options.remoteIpv4NetworkCidr',
              header: '원격 IPv4 네트워크 CIDR'
            }
          ]
        case 'VPC':
          return [
            { binding: 'vpcAttachmentJson.vpcId', header: 'VPC ID' },
            { binding: 'vpcData.environment', header: 'VPC 환경' },
            { binding: 'dnsSupportKor', header: 'DNS 지원' },
            { binding: 'ipv6SupportKor', header: 'IPv6 지원' }
          ]
        case 'Peering':
          return [
            {
              binding:
                'peeringAttachmentJson.projectData.requesterPeeringProjectDto.projectName',
              header: '요청자 프로젝트 이름'
            },
            {
              binding:
                'peeringAttachmentJson.projectData.requesterPeeringProjectDto.regionDisplayName',
              header: '요청자 프로젝트 리전'
            },
            {
              binding:
                'peeringAttachmentJson.projectData.requesterPeeringProjectDto.transitGatewayId',
              header: '요청자 Transit Gateway ID'
            },
            {
              binding:
                'peeringAttachmentJson.projectData.requesterPeeringProjectDto.transitGatewayName',
              header: '요청자 Transit Gateway 이름'
            },
            {
              binding:
                'peeringAttachmentJson.projectData.accepterPeeringProjectDto.projectName',
              header: '연결된 프로젝트 이름'
            },
            {
              binding:
                'peeringAttachmentJson.projectData.accepterPeeringProjectDto.regionDisplayName',
              header: '연결된 프로젝트 리전'
            },
            {
              binding:
                'peeringAttachmentJson.projectData.accepterPeeringProjectDto.transitGatewayId',
              header: '연결된 Transit Gateway ID'
            },
            {
              binding:
                'peeringAttachmentJson.projectData.accepterPeeringProjectDto.transitGatewayName',
              header: '연결된 Transit Gateway 이름'
            }
          ]
        default:
          return []
      }
    }
  },
  methods: {
    getVpcName (vpcType) {
      return {
        STG: '스테이징',
        DEV: '개발',
        PRD: '운영'
      }[vpcType]
    },
    async getVpcInfo () {
      this.isInfoLoading = true

      try {
        const { data } = await API.aws.getTgwVpcInfo({
          projectIdx: this.detailData.transitGatewayDto.projectIdx
        })
        this.resourceVpc.detailData = data
        this.resourceVpc.data = this.resourceVpc.detailData.mappingResDtos?.map(res => {
          return {
            ...res,
            sourceDnsSupport: res.sourceJson.options.dnsSupport === 'enable' ? '예' : '아니오',
            sourceIpV6Support: res.sourceJson.options.ipv6Support === 'enable' ? '예' : '아니오',
            targetDnsSupport: res.targetJson.options.dnsSupport === 'enable' ? '예' : '아니오',
            targetIpV6Support: res.targetJson.options.ipv6Support === 'enable' ? '예' : '아니오'
          }
        })
      } catch (error) {
        console.log(error)
        this.$alert(this.$v('VPC 정보 조회에 실패하였습니다.'))
      } finally {
        this.isInfoLoading = false
      }
    },
    async getVpnInfo () {
      this.isInfoLoading = true
      this.resourceVpn.selectedRow = null
      this.resourceVpn.data = []
      this.resourceVpn.detailData = []

      try {
        const { data } = await API.aws.getTgwVpnInfo({
          projectIdx: this.detailData.transitGatewayDto.projectIdx
        })
        this.resourceVpn.data = data
      } catch (error) {
        console.log(error)
        this.$alert(this.$v('VPN 정보 조회에 실패하였습니다.'))
      } finally {
        this.isInfoLoading = false
      }
    },
    async getPeeringInfo () {
      this.isInfoLoading = true

      try {
        const { data } = await API.aws.getTgwPeeringInfo({
          projectIdx: this.detailData.transitGatewayDto.projectIdx
        })
        this.resourcePeering.data = data
      } catch (error) {
        console.log(error)
        this.$alert(this.$v('Peering 정보 조회에 실패하였습니다.'))
      } finally {
        this.isInfoLoading = false
      }
    },
    async getVpnDetailInfo () {
      this.isInfoLoading = true

      try {
        const { data } = await API.aws.getTgwVpnDetailInfo({
          projectIdx: this.detailData.transitGatewayDto.projectIdx
        }, this.resourceVpn.selectedRow.resourceId)
        this.resourceVpn.detailData = data
      } catch (error) {
        console.log(error)
        this.$alert(this.$v('VPN 정보 조회에 실패하였습니다.'))
      } finally {
        this.isInfoLoading = false
      }
    },
    async getPeeringDetailInfo () {
      this.isInfoLoading = true

      try {
        const { data } = await API.aws.getTgwPeeringDetailInfo({
          projectIdx: this.detailData.transitGatewayDto.projectIdx
        }, this.resourcePeering.selectedRow.resourceId)
        this.resourcePeering.detailData = data
        if (this.resourcePeering.detailData.mappingResDtos) {
          this.resourcePeering.detailData.mappingResDtos.sort((a, b) => {
            return b.sourceId > a.sourceId ? -1 : 1
          })
          this.resourcePeering.vpcInfo = this.resourcePeering.detailData.mappingResDtos
        }
      } catch (error) {
        console.log(error)
        this.$alert(this.$v('Peering 정보 조회에 실패하였습니다.'))
      } finally {
        this.isInfoLoading = false
      }
    },
    onClickTab (field) {
      const callback = {
        'resource-vpc': this.getVpcInfo,
        'resource-vpn': this.getVpnInfo,
        'resource-peering': this.getPeeringInfo
      }[field.field]

      callback()

      this.activeTabField = field.field
      this.editDetailData = null
      this.resourceVpn.selectedRow = null
      this.resourcePeering.selectedRow = null
    },
    onInitPeeringDetailGrid (grid) {
      const self = this

      class CustomMergeManager extends wjGrid.MergeManager {
        getMergedRange (p, r, c) {
          if (p.getCellData(r, c, false) === p.columns[c].header || !p.columns[c].binding) return null
          const ignoreColumns = [3, 4, 5]

          if (p.rows[r].dataIndex !== -1 && ignoreColumns.includes(c)) return null
          if (!ignoreColumns.length) return null

          const rng = new wjGrid.CellRange(r, c)

          if (p.rows[r].dataIndex === -1) {
            for (let i = rng.col; i < p.columns.length - 1; i++) {
              if (p.getCellData(r, i, false) !== p.getCellData(r, i + 1, false)) break
              rng.col2 = i + 1
            }

            for (let i = rng.col; i > 0; i--) {
              if (p.getCellData(r, i, false) !== p.getCellData(r, i - 1, false)) break
              rng.col = i - 1
            }

            return rng
          }

          const val = self.resourcePeering.vpcInfo[r].sourceVpcEnvironment

          const getUid = (index) => {
            return self.resourcePeering.vpcInfo[index]?.sourceVpcEnvironment
          }

          if (!val) return null

          for (let i = rng.row; i < p.rows.length; i++) {
            if (getUid(i) !== getUid(i + 1)) break
            rng.row2 = i + 1
          }

          for (let i = rng.row; i > 0; i--) {
            if (getUid(i) !== getUid(i - 1)) break
            rng.row = i - 1
          }

          return rng
        }
      }

      grid.mergeManager = new CustomMergeManager()
    },
    onSelectResourcePeering (row) {
      this.resourcePeering.selectedRow = row?.dataItem
      if (this.resourcePeering.selectedRow) this.getPeeringDetailInfo()
    },
    onSelectResourceVpn (row) {
      this.resourceVpn.selectedRow = row?.dataItem
      if (this.resourceVpn.selectedRow) this.getVpnDetailInfo()
    },
    async getPeering (req, acc, peer) {
      try {
        const { data } = await API.aws.getPeeringProject(req, acc)
        peer.projectData = data
      } catch (error) {
        console.log(error)
      }
    },
    async getVPC (vpcId) {
      try {
        const { data } = await API.aws.getVpcDetail(vpcId)
        this.vpcData = {
          ...data,
          environmentKor: this.caseOfVPC(data.environment)
        }
      } catch (error) {
        console.log(error)
      }
    },
    async getAttachmentData (tgwId) {
      this.selectAttachmentGridData = this.detailData.transitGatewayAttachmentDtos.map(
        data => ({
          ...data,
          originResourceType: data.resourceType,
          resourceType: this.transformResourceType(data.resourceType)
        })
      )
    },
    onSelectAttahcment (row) {
      if (!row || !row.dataItem) {
        this.selectedAttachment = null
        return
      }
      this.selectedAttachment = row.dataItem
      if (this.selectedAttachment) {
        if (this.selectedAttachment.resourceType === 'VPC') {
          this.selectedAttachment.dnsSupportKor =
            this.selectedAttachment.vpcAttachmentJson.options.dnsSupport ===
            'enable'
              ? '지원'
              : '미지원'
          this.selectedAttachment.ipv6SupportKor =
            this.selectedAttachment.vpcAttachmentJson.options.ipv6Support ===
            'enable'
              ? '지원'
              : '미지원'
          this.getVPC(this.selectedAttachment.resourceId)
        } else if (this.selectedAttachment.resourceType === 'VPN') {
          const innerVpn = this.selectedAttachment.vpnConnectionJson

          this.selectedAttachment.routeType = innerVpn.options.staticRoutesOnly
            ? '정적'
            : '동적'
          this.selectedAttachment.stateKor = this.tgwStateMap(innerVpn.state)
          this.selectedAttachment.isAcceleration = innerVpn.options
            .enableAcceleration
            ? '네'
            : '아니오'
        } else {
          const peer = this.selectedAttachment.peeringAttachmentJson
          this.getPeering(
            peer.requesterTgwInfo.ownerId,
            peer.accepterTgwInfo.ownerId,
            peer
          )
        }
      }
    },
    transformRouteGridData (data) {
      return {
        ...data,
        originType: data.type,
        type: data.type === 'propagated' ? '동적' : '정적',
        originState: data.state,
        state: data.state === 'active' ? '활성' : '블랙홀',
        originAttachments: data.transitGatewayAttachments,
        attachments: {
          ...data.transitGatewayAttachments[0],
          resourceType: this.transformResourceType(
            data.transitGatewayAttachments[0].resourceType
          )
        }
      }
    },
    transformTableGridData (data) {
      return {
        ...data,
        resourceType: this.transformResourceType(data.resourceType)
      }
    },
    transformResourceType (resourceType) {
      return resourceType.toLowerCase() === 'peering'
        ? resourceType[0].toUpperCase() + resourceType.slice(1)
        : resourceType.toUpperCase()
    },
    getRoutingTableData () {
      this.detailData.transitGatewayRouteTableDto.associationsJson = this.detailData.transitGatewayRouteTableDto.associationsJson.map(
        this.transformTableGridData
      )
      this.detailData.transitGatewayRouteTableDto.propagationsJson = this.detailData.transitGatewayRouteTableDto.propagationsJson.map(
        this.transformTableGridData
      )
      this.detailData.transitGatewayRouteTableDto.routesJson = this.detailData.transitGatewayRouteTableDto.routesJson.map(
        this.transformRouteGridData
      )
    },
    async getDetailData (tgwId) {
      if (this.isLoadingDetailData) return
      else if (!tgwId) {
        this.isErrorGetData = true
        this.isLoadingDetailData = false
        return
      }

      this.isLoadingDetailData = true
      this.isErrorGetData = false

      try {
        const { data } = await API.aws.getTransitGatewayDetailAdm(tgwId)

        this.$store.commit('common/ADD_PARAMETERS', {
          label: data.transitGatewayDto.transitGatewayName,
          path: ''
        })

        /** =============================== */
        /** =============================== */
        /** =============================== */
        /** =============================== */
        this.detailData = data
        // 상태
        this.detailData.transitGatewayDto.mappedState = this.tgwStateMap(
          this.detailData.transitGatewayDto.state
        )

        const project = this.getProject(
          this.detailData.transitGatewayDto.projectIdx
        )

        // 프로젝트 위치
        this.detailData.transitGatewayDto.projectLocation = `${project.companyName} > ${project.groupName} > ${project.projectName}`
        // DNS 지원 (지원 / 미지원)
        this.detailData.transitGatewayDto.mappedDnsSupport =
          this.detailData.transitGatewayDto.dnsSupport === 'enable'
            ? '지원'
            : '미지원'
        // 연결, 전파 라우팅 테이블
        this.detailData.transitGatewayDto.activeAssociateRoutingTable =
          this.detailData.transitGatewayDto.defaultRouteTableAssociation ===
          'enable'
            ? '활성화'
            : '비활성화'
        this.detailData.transitGatewayDto.activePropagationRoutingTable =
          this.detailData.transitGatewayDto.defaultRouteTablePropagation ===
          'enable'
            ? '활성화'
            : '비활성화'
        // 마지막 변경 시간, 생성 시간
        this.detailData.transitGatewayDto.formatCreateDate = dayjs(
          new Date(this.detailData.transitGatewayDto.createTime)
        ).format('YYYY.MM.DD HH:mm:ss')
        this.detailData.transitGatewayDto.formatUpdateDate = dayjs(
          new Date(this.detailData.transitGatewayDto.modifyTime)
        ).format('YYYY.MM.DD HH:mm:ss')

        this.detailData.transitGatewayRouteTableDto.mappedState = this.tgwStateMap(
          this.detailData.transitGatewayRouteTableDto.state
        )
        this.detailData.transitGatewayRouteTableDto.associationDefaultRouteTableId = this.detailData.transitGatewayDto.associationDefaultRouteTableId
        this.detailData.transitGatewayRouteTableDto.propagationDefaultRouteTableId = this.detailData.transitGatewayDto.propagationDefaultRouteTableId
        /** =============================== */
        /** =============================== */
        /** =============================== */
        /** =============================== */

        this.getRoutingTableData()
        this.getAttachmentData()
      } catch (error) {
        this.isErrorGetData = true
        console.log(error)
        this.$alert('Transit Gateway 상세 조회에 실패하였습니다.')
      } finally {
        this.isLoadingDetailData = false
      }
    }
  },
  data: root => ({
    isActiveCompDownloadVpn: false,
    resourceVpc: {
      colSpan: [
        { startIdx: 0, endIdx: 3, header: root.$v('환경') },
        { startIdx: 4, endIdx: 7, header: root.$v('연결 환경') }
      ],
      rowSpan: [],
      columns: [
        { binding: 'sourceVpcEnvironment', header: root.$v('환경'), customHtml: true },
        { binding: 'sourceName', header: root.$v('연결 이름') },
        { binding: 'sourceDnsSupport', header: root.$v('DNS 지원') },
        { binding: 'sourceIpV6Support', header: root.$v('IPv6 지원') },
        { binding: 'targetVpcEnvironment', header: root.$v('환경'), customHtml: true },
        { binding: 'targetName', header: root.$v('연결 이름') },
        { binding: 'targetDnsSupport', header: root.$v('DNS 지원') },
        { binding: 'targetIpV6Support', header: root.$v('IPv6 지원') }
      ],
      data: [],
      detailData: null
    },
    resourceVpn: {
      columns: [
        { binding: 'resourceName', header: root.$v('자원명') },
        { binding: 'vpnConnectionId', header: root.$v('커넥션 ID') },
        { binding: 'customerGatewayName', header: root.$v('고객 게이트웨이 이름') },
        { binding: 'destinationCidrBlock', header: root.$v('IP 주소') },
        { binding: 'vpcEnvironments', header: root.$v('환경'), customHtml: true }
      ],
      dataColumns: [
        { binding: 'sourceVpcEnvironment', header: root.$v('환경'), customHtml: true },
        { binding: 'sourceName', header: root.$v('연결 이름') },
        { binding: 'sourceCidr', header: 'CIDR' }
      ],
      detailColumns: [
        { binding: 'enableAcceleration', header: root.$v('가속 사용됨') },
        { binding: 'staticRoutesOnly', header: root.$v('라우팅') },
        { binding: 'localIpv4NetworkCidr', header: root.$v('로컬 IPv4 네트워크 CIDR') },
        { binding: 'remoteIpv4NetworkCidr', header: root.$v('원격 IPv4 네트워크 CIDR') }
      ],
      data: [],
      detailData: null,
      selectedRow: null
    },
    resourcePeering: {
      columns: [
        { binding: 'resourceName', header: root.$v('자원명') },
        { binding: 'sourceProjectName', header: root.$v('프로젝트명') },
        { binding: 'sourceId', header: 'Source Peering' },
        { binding: 'targetProjectName', header: root.$v('프로젝트명') },
        { binding: 'targetId', header: 'Target Peering' }
      ],
      listColSpan: [
        { startIdx: 1, endIdx: 2, header: root.$v('Source 프로젝트 정보') },
        { startIdx: 3, endIdx: 4, header: root.$v('Target 프로젝트 정보') }
      ],
      listRowSpan: [
        'resourceName'
      ],
      detailColumns: [
        { binding: 'sourceVpcEnvironment', header: root.$v('VPC 환경'), cellMerge: true },
        { binding: 'sourceName', header: root.$v('VPC 연결 이름'), cellMerge: true },
        { binding: 'sourceCidr', header: 'CIDR', cellMerge: true },
        { binding: 'targetVpcEnvironment', header: root.$v('VPC 환경') },
        { binding: 'targetName', header: root.$v('VPC 연결 이름') },
        { binding: 'targetCidr', header: 'CIDR' }
      ],
      detailColSpan: [
        { startIdx: 0, endIdx: 2, header: root.$v('Source 프로젝트 정보') },
        { startIdx: 3, endIdx: 5, header: root.$v('Target 프로젝트 정보') }
      ],
      detailRowSpan: [],
      projectColumns: [
        { binding: 'sourceProjectName', header: root.$v('Source 프로젝트 이름') },
        { binding: 'sourceId', header: 'Source Peering' },
        { binding: 'targetProjectName', header: root.$v('Target 프로젝트 이름') },
        { binding: 'targetId', header: 'Target Peering' }
      ],
      data: [],
      detailData: null,
      vpcInfo: [],
      selectedRow: null
    },
    tgwDetailTab: [
      { field: 'resource-vpc', name: 'VPC' },
      { field: 'resource-vpn', name: 'VPN' },
      { field: 'resource-peering', name: 'Peering' }
    ],
    isInfoLoading: false,
    isErrorGetData: false,
    isLoadingDetailData: false,
    detailData: null,
    selectedAttachment: null,
    vpcData: null,

    baseInfoColumns: [
      { binding: 'transitGatewayId', header: 'Transit Gateway ID' },
      { binding: 'transitGatewayName', header: 'Transit Gateway 이름' },
      { binding: 'amazonSideAsn', header: 'Amazon ASN' },
      { binding: 'mappedState', header: '연결 상태' },
      { binding: 'projectLocation', header: '프로젝트 위치' },
      { binding: 'description', header: '설명' },
      { binding: 'transitGatewayArn', header: 'ARN' },
      { binding: 'mappedDnsSupport', header: 'DNS 지원' },
      { binding: 'activeAssociateRoutingTable', header: '연결 라우팅 테이블' },
      {
        binding: 'activePropagationRoutingTable',
        header: '전파 라우팅 테이블'
      },
      { binding: 'formatCreateDate', header: '생성시간' },
      { binding: 'formatUpdateDate', header: '마지막 변경 시간' }
    ],

    routingTableColumns: [
      { binding: 'transitGatewayRouteTableId', header: '라우팅 테이블 ID' },
      { binding: 'mappedState', header: '상태' },
      {
        binding: 'associationDefaultRouteTableId',
        header: '기본 연결 라우팅 테이블 ID'
      },
      {
        binding: 'propagationDefaultRouteTableId',
        header: '기본 전파 라우팅 테이블 ID'
      }
    ],

    routingTableAssociationGridColumns: [
      { binding: 'transitGatewayAttachmentId', header: '연결 ID' },
      { binding: 'resourceType', header: '리소스 유형' },
      { binding: 'resourceId', header: '리소스 ID' },
      { binding: 'state', header: '상태' }
    ],

    routingTableRouteGridColumns: [
      { binding: 'destinationCidrBlock', header: 'CIDR' },
      { binding: 'type', header: '경로 유형' },
      { binding: 'state', header: '상태' },
      { binding: 'attachments.transitGatewayAttachmentId', header: '연결 ID' },
      {
        binding: 'attachments.resourceId',
        header: '리소스 ID',
        customHtml: true
      },
      { binding: 'attachments.resourceType', header: '리소스 유형' }
    ],

    selectAttachmentGridColumns: [
      { binding: 'transitGatewayAttachmentName', header: '연결 이름' },
      { binding: 'transitGatewayAttachmentId', header: '연결 ID' },
      { binding: 'resourceId', header: '리소스 ID' },
      { binding: 'resourceType', header: '연결 유형' }
    ],

    selectAttachmentGridData: []
  })
}
</script>

<style lang="scss" scoped>
.tgw-detail {
  .loadding-wrapper,
  .detail {
    min-height: 700px;
  }

  .loadding-wrapper,
  .empty-data {
    padding: 80px 0;
  }

  .more {
    color: $main-blue;
    cursor: pointer;
    text-decoration: underline;
  }

  .flex-wrap {
    width: 100%;

    &.column-3 {
      > * {
        flex: 1 1 33%;
      }
    }
  }

  .tgw-connection {
    margin: 30px 0 60px 0;

    h3 {
      margin-bottom: $gap;
    }

    .cmp-grid-wrapper,
    .vertical-table {
      margin-bottom: $gap;
    }

    .vpc-resources {
      > .vpc-resource + .vpc-resource {
        margin-top: $gap;
      }
    }

    .vpn-resource-download {
      display: flex;
      justify-content: flex-end;
      margin-bottom: $gap-m;
    }
  }
}
</style>
