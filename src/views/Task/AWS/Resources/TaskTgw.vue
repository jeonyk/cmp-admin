<template>
  <div style="color:#fff;">
    <task-tgw-review
      v-if="isReviewMode"
      :columns="reviewColumns"
      :data="list"
    />
    <div v-else>
      <header class="tag-header">
        <task-service-tags
          @click="clickTagName"
          :data="computedTags"
        />
        <task-button-groups
          v-if="selectedService.isExecutable"
          :service-status="selectedService.workItemState"
          :role-status="$roleState()"
          @cancel="setEmitData('cancel')"
          @set="setEmitData('set')"
          @update="setEmitData('update')"
          @restore="setEmitData('restore')"
          @excute="($event) => setEmitData('excute', $event)"
        />
      </header>
      <main>
        <div
          v-for="(data, idx) in list"
          :key="idx"
        >
          <template v-if="idx === selectedIdx">
            <!-- 공통 TGW INFO -->
            <vertical-table
              :columns="newColumns"
              :data="data"
              type="horizontal"
            >
              <template #status="{row}">
                <task-status-tags
                  :status="data.workItemState"
                  @set-success="$event => setEmitData('set-success', { data :$event, row})"
                />
              </template>
              <template #autoScheduleAt>
                <div>
                  {{ getScheduleTime(data.autoScheduleAt) }}
                </div>
              </template>
            </vertical-table>

            <dashboard-panel :title="$v('라우팅 테이블 정보')">
              <register-contents
                :title="$v('라우팅 테이블 ID')"
              >
                <div>{{ data.associationDefaultRouteTableId }}</div>
              </register-contents>
            </dashboard-panel>

            <!-- 신청 타입이 VPC 인 경우 -->
            <template v-if="data && data.attachmentType === 'VPC' && $orderType() !== 'DELETE'">
              <dashboard-panel :title="$v('VPC 정보')">
                <div
                  v-for="(vpc,idx) in data.createPairVpcs"
                  :key="idx"
                >
                  <cmp-grid
                    :columns="gridColumns"
                    :item-source="transformData(vpc)"
                    type="horizontal"
                  />
                </div>
              </dashboard-panel>
            </template>
            <template v-if="data && data.attachmentType === 'VPC' && $orderType() === 'DELETE'">
              <dashboard-panel :title="$v('VPC 정보')">
                <div
                  v-for="(vpc,idx) in data.removePairVpcs"
                  :key="idx"
                >
                  <cmp-grid
                    :columns="gridColumns"
                    :item-source="transformData(vpc)"
                    type="horizontal"
                  />
                </div>
              </dashboard-panel>
            </template>

            <template v-if="data && data.attachmentType === 'VPN'">
              <dashboard-panel :title="$v('VPN 정보')">
                <vertical-table
                  :columns="vpnColumns.vpn"
                  :data="data.vpnConnectionDto.customerGatewayDto"
                  type="horizontal"
                >
                  <template #projectName>
                    <div> {{ getVpnProjectName(data.vpnConnectionDto) }}</div>
                  </template>
                  <template #status="{row}">
                    <task-status-tags
                      :status="data.workItemState"
                      @set-success="$event => setEmitData('set-success', { data :$event, row})"
                    />
                  </template>
                </vertical-table>
              </dashboard-panel>

              <!-- VPN 타입의 VPC 정보 노출 -->
              <dashboard-panel :title="$v('VPC 정보')">
                <cmp-grid
                  :columns="vpnColumns.vpc"
                  :item-source="data.vpnConnectionDto.createVpcAttachmentDtos"
                  type="horizontal"
                />
              </dashboard-panel>
            </template>

            <template v-if="data&& data.attachmentType === 'Peering'">
              <dashboard-panel :title="$v('PEERING')">
                <vertical-table
                  :data="data.peeringAttachmentDto"
                  :columns="peeringColumns"
                  type="horizontal"
                />
              </dashboard-panel>

              <dashboard-panel :title="$v('VPC 정보')">
                <cmp-grid
                  class="peering-vpc-grid"
                  :columns="peeringVpcColumns"
                  :header-merge="headerMergeColumns"
                  :item-source="getPeeringVpcs(data.peeringAttachmentDto.createPairVpcs)"
                  type="horizontal"
                >
                  <template #sourceVpcEnvironment="{row}">
                    <div>{{ row.source.environmentKor }}</div>
                  </template>
                  <template #sourceVpcName="{row}">
                    <div>{{ row.source.vpcId }}</div>
                  </template>
                  <template #sourceCidr="{row}">
                    <div>{{ row.source.destinationCidrBlock }}</div>
                  </template>
                  <template #targetVpcEnvironments="{row}">
                    <ul class="grid-ul">
                      <li
                        v-for="t in row.targets"
                        :key="t.vpcId"
                      >
                        {{ t.environmentKor }}
                      </li>
                    </ul>
                  </template>
                  <template #targetVpcNames="{row}">
                    <ul class="grid-ul">
                      <li
                        v-for="t in row.targets"
                        :key="t.vpcId"
                      >
                        {{ t.vpcId }}
                      </li>
                    </ul>
                  </template>
                  <template #targetVpcCidrs="{row}">
                    <ul class="grid-ul">
                      <li
                        v-for="t in row.targets"
                        :key="t.vpcId"
                      >
                        {{ t.destinationCidrBlock }}
                      </li>
                    </ul>
                  </template>
                </cmp-grid>
              </dashboard-panel>
            </template>
          </template>
        </div>
      </main>
    </div>
  </div>
</template>

<script>
import { isEqual } from 'lodash'
import API, { DashboardPanel, RegisterContents } from '@sd-fe/cmp-core'
import TaskResourceMixins from '../TaskResourceMixins'
import TaskStatusTags from './TaskStatusTags.vue'
import TaskServiceTags from './TaskServiceTags.vue'
import TaskButtonGroups from '@/components/ButtonGroups/TaskButtonGroups.vue'
import TaskTgwReview from './TaskTgwReview'
export default {
  mixins: [TaskResourceMixins],
  components: {
    DashboardPanel,
    TaskServiceTags,
    TaskButtonGroups,
    RegisterContents,
    TaskStatusTags,
    TaskTgwReview
  },
  computed: {
    computedTags () {
      return this.list?.map((r) => {
        return {
          label: r.resourceName,
          workItemState: r.workItemState
        }
      })
    }
  },

  props: {
    data: {
      type: [Array, Object],
      default: () => {}
    },
    isReviewMode: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    data: {
      immediate: true,
      handler (newList) {
        this.list = newList.map(x => {
          if (x.attachmentType === 'Peering') {
            return {
              ...x,
              peeringAttachmentDto: {
                ...x.peeringAttachmentDto,
                projectName: this.getProjectName(x.peeringAttachmentDto, 'source'),
                targetProjectName: this.getProjectName(x.peeringAttachmentDto, 'target')
              }
            }
          } else {
            return {
              ...x
            }
          }
        })
      }
    },
    selectedIdx: {
      immediate: true,
      handler (newIdx) {
        this.$emit('selected', newIdx)
      }
    }
  },
  methods: {
    getVpnProjectName (vpnConnectionDto) {
      console.log('#getVpnProjectName')
      const pairType = {
        NEW: 'createVpcAttachmentDtos',
        CHANGE: 'createVpcAttachmentDtos',
        DELETE: 'removeVpcAttachmentDtos'
      }[this.$orderType()]

      const tags = vpnConnectionDto?.[pairType]?.[0]?.tags
      return this.filterTagName(tags)
    },
    filterTagName (data) {
      const projectObj = data?.find(item => item.key === 'PROJECT_NAME')
      return projectObj ? projectObj.value : '-'
    },
    getProjectName (peeringAttachmentDto, type) {
      const pairType = {
        NEW: 'createPairVpcs',
        CHANGE: 'createPairVpcs',
        DELETE: 'removePairVpcs'
      }[this.$orderType()]

      const tags = peeringAttachmentDto?.[pairType]?.[0]?.[type]?.tags

      return this.filterTagName(tags)
    },
    getPeeringVpcs (list) {
      const result = []
      list.forEach(item => {
        const { ...sourceRest } = item.source
        const { ...targetRest } = item.target
        let source = result.find(obj => isEqual(obj.source, sourceRest))
        if (!source) {
          source = {
            source: {
              ...sourceRest
            },
            targets: []
          }
          result.push(source)
        }

        const target = {
          ...targetRest
        }
        source.targets.push(target)
      })

      return result
    },
    async getClinetVpnInfo (clientInfo, transitGatewayId) {
      console.log(API)
      // const res = await API.aws.getTransitGatewayDetail(transitGatewayId)
      // const projectName = res?.data.projectName || ''
      const result = {
        projectName: '123',
        ...clientInfo
      }
      console.log(234234)
      console.log(result)
      // constconsole.log(...clientInfo)

      return {
        ...result
      }
    },
    transformData (jsonData, type) {
      if (type === 'VPN') return jsonData
      const sourceData = jsonData.source
      const targetData = jsonData.target

      const transformedData = [
        { ...sourceData, type: 'source' },
        { ...targetData, type: 'target' }
      ]

      return transformedData
    }
  },
  data () {
    return {
      reviewColumns: [
        { binding: 'resourceName', header: this.$v('TGW 이름') },
        { binding: 'info', header: this.$v('자원 정보'), customHtml: true }
      ],
      list: [],
      newColumns: [
        { binding: 'transitGatewayId', header: this.$v('TGW ID') },
        { binding: 'resourceName', header: this.$v('TGW 이름') },
        { binding: 'amazonAsn', header: this.$v('Amazon ASN') },
        { binding: 'attachmentType', header: this.$v('타입') },
        { binding: 'autoScheduleAt', header: this.$v('예약설정') },
        { binding: 'status', header: this.$v('상태'), customHtml: true }
      ],
      vpnColumns: {
        vpn: [
          { binding: 'projectName', header: this.$v('내 프로젝트 이름') },
          { binding: 'customerGatewayName', header: this.$v('고객 게이트웨이 이름') },
          { binding: 'bgpAsn', header: this.$v('BGP ASN') },
          { binding: 'ipAddress', header: this.$v('IP 주소') }
        ],
        vpc: [
          { binding: 'environment', keyPath: this.$v('VPC 환경'), width: '*', customHtml: true },
          { binding: 'vpcId', keyPath: this.$v('VPC 연결 이름'), width: '*' },
          { binding: 'destinationCidrBlock', keyPath: this.$v('CIDR'), width: '*' }
        ]
      },
      // vpnColumns: [
      //   { binding: 'projectName', header: this.$v('내 프로젝트 이름') },
      //   { binding: 'customerGatewayName', header: this.$v('고객 게이트웨이 이름') },
      //   { binding: 'bgpAsn', header: this.$v('BGP ASN') },
      //   { binding: 'ipAddress', header: this.$v('IP 주소') }
      // ],
      // vpnTypeColumns: [
      //   { binding: 'environment', keyPath: this.$v('VPC 환경'), width: '*', customHtml: true },
      //   { binding: 'vpcId', keyPath: this.$v('VPC 연결 이름'), width: '*' },
      //   { binding: 'destinationCidrBlock', keyPath: this.$v('CIDR'), width: '*' }
      // ],
      gridColumns: [
        { binding: 'environment', keyPath: this.$v('VPC 환경'), width: '*', customHtml: true },
        { binding: 'vpcId', keyPath: this.$v('VPC 연결 이름'), width: '*' },
        { binding: 'destinationCidrBlock', keyPath: this.$v('CIDR'), width: '*' }
      ],
      peeringColumns: [
        { binding: 'projectName', keyPath: this.$v('내 프로젝트 이름'), width: '*', customHtml: true },
        { binding: 'sourceTransitGatewayAttachmentName', keyPath: this.$v('소스 PEERING'), width: '*' },
        { binding: 'targetProjectName', keyPath: this.$v('상대 프로젝트 이름'), width: '*' },
        { binding: 'targetTransitGatewayAttachmentName', keyPath: this.$v('타켓 PEERING'), width: '*' }
      ],
      peeringVpcColumns: [
        { binding: 'sourceVpcEnvironment', keyPath: this.$v('VPC 환경'), width: '*', customHtml: true },
        { binding: 'sourceVpcName', keyPath: this.$v('VPC 연결 이름'), width: '*', customHtml: true },
        { binding: 'sourceCidr', keyPath: this.$v('CIDR'), width: '*', customHtml: true },
        { binding: 'targetVpcEnvironments', keyPath: this.$v('VPC 환경'), width: '*', customHtml: true },
        { binding: 'targetVpcNames', keyPath: this.$v('VPC 연결 이름'), width: '*', customHtml: true },
        { binding: 'targetVpcCidrs', keyPath: this.$v('CIDR'), width: '*', customHtml: true }
      ],
      headerMergeColumns: {
        colSpan: [
          { startIdx: 0, endIdx: 2, header: this.$v('내 프로젝트 정보') },
          { startIdx: 3, endIdx: 5, header: this.$v('상대 프로젝트 정보') }
        ]
      }
    }
  }
}
</script>
<style lang="scss" scoped>

.tag-header {
  padding-bottom: 20px;
  display: flex;
  justify-content: space-between;
}

.peering-vpc-grid {
  &::v-deep {
    .wj-cell {
      border:.5+px solid #333;
    }
  }
  .grid-ul {
    position: relative;
    li {
      position:relative;
      padding:10px;
      &:not(:last-child){
        &::before{
          top:100%;
          left:0px;
          left:-20px;
          content: '';
          position:absolute;
          width:120%;
          height:1px;
          background: #333;
        }
      }
    }
  }
}
</style>
