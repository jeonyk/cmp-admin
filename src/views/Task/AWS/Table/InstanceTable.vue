<template>
  <div>
    <div class="conference-body">
      <header class="instance-table-header">
        <div class="instance-tags">
          <el-tag
            :class="[
              'instance-tag',
              { '-selected': idx === selectedInstanceIdx },
            ]"
            v-for="(instance, idx) in instanceTagNameList"
            :key="instance"
            @click="clickTagName(idx)"
          >
            {{ instance }}
          </el-tag>
        </div>
      </header>
      <instance-table-content
        :type="type"
        :data="selectedInstanceItem"
        :status="status"
        :mode="mode"
        @excute="runTask"
        @complete="completeTask"
        @updateDone="updateDone"
      />
      <!-- <pre>{{ data }}</pre> 자원별 들어오는 실데이터 확인 -->
      <!-- @update="update" -->
      <task-security-tabs
        :data="[]"
        :tabs="taskDetailTabs"
        :type="type"
        :memo-list="memoList"
        @refresh-memo="refreshMemo"
      >
        <slot />
      </task-security-tabs>
    </div>
  </div>
</template>

<script>
import InstanceTableContent from './InstanceTableContent.vue'
import TaskSecurityTabs from '@/components/TaskTabs/TaskSecurityTabs.vue'
export default {
  components: {
    InstanceTableContent,
    TaskSecurityTabs
  },
  props: {
    type: {
      type: String,
      default: 'EC2'
    },
    mode: {
      type: String,
      default: 'CONF'
    },
    data: {
      type: [Array],
      default: () => {}
    },
    title: {
      type: String,
      default: ''
    },
    status: {
      type: Boolean,
      default: false
    },
    memoList: {
      type: Object,
      default: () => {}
    }
  },
  computed: {
    resourceList () {
      if (this.type === 'EC2') {
        return this.data.map(instance => {
          return {
            tagName: instance.instanceName,
            instanceName: instance.instanceName,
            amiId: instance.amazonImageDto?.imageId || 'imageId',
            networkPerformance: instance.instanceTypeDto?.networkPerformance || 'network',
            memory: instance.instanceTypeDto?.memory,
            instanceType: instance.instanceTypeDto?.instanceType,
            region: instance.instanceTypeDto?.regionName,
            availableRegion: instance.subnetDto?.availabilityZone,
            architecture: instance.amazonImageDto?.architecture,
            vCpu: instance.instanceTypeDto?.vcpu,
            securityGroupDtoList: instance.securityGroupDtoList,
            workResult: instance.workResult || '',
            meta: instance.meta,
            status: instance.status
          } || []
        })
      }

      if (this.type === 'EFS') {
        return this.data?.map(prop => {
          return {
            status: prop.status,
            tagName: prop.fileSystemName,
            fileSystemId: prop.fileSystemId || '-',
            fileSystemName: prop.fileSystemName || '-',
            isRegion: prop.isRegion || '-',
            vpcId: prop.vpcId || '-',
            regionName: prop.regionName || '-',
            performanceMode: prop.performanceMode || '-',
            throughputMode: prop.throughtputMode || '-', // throughputMode === '처리량 모드'
            activeMonitoring: prop.activeMonitoring || '-',
            size: prop.size || '-',
            sizeStandard: prop.sizeStandard || '-',
            sizeIa: prop.sizeIa || 0,
            transitionToIa: prop.transitionToIa || '-',
            transitionToPrimaryStorageClass: prop.transitionToPrimaryStorageClass || '-',
            accessPointCnt: prop.accessPointCnt || 0,
            projectIdx: prop.projectIdx || '-',
            lifeCycleState: prop.lifeCycleState || '-',
            appManageTeamName: prop.appManageTeamName || '-',
            appTaskUser: prop.appTaskUser || '-',
            createDate: prop.createDate || '-',
            modifyDate: prop.modifyDate || '-'
            // securityGroupDtoList: prop.securityGroupDtoList,
            // efsMountTargetDtoList: prop.efsMountTargetDtoList
            // instanceName: prop.fileSystemId,
            // environment:prop.environment || '-',
          } || []
        })
      }

      if (this.type === '3번째자원') {
        return [] // 조건
      }
      if (this.type === '4번째자원') {
        return [] // 조건
      }
      return []
    },
    selectedInstanceItem () {
      return this.resourceList?.find((_, idx) => {
        // this.$emit('selected', idx)
        return idx === this.selectedInstanceIdx
      }) || {}
    },
    instanceTagNameList () {
      return this.resourceList?.map(instance => instance.tagName) || []
    },
    securityGroupData () {
      if (this.type === 'EC2') return this.selectedInstanceItem?.securityGroupDtoList || []
      if (this.type === 'EFS') return []
      return []
    }
  },
  watch: {
    data: {
      deep: true,
      immediate: true,
      handler (newVal) {
      }
    },
    selectedInstanceIdx: {
      immediate: true,
      handler (newVal) {
        this.$emit('selected', newVal)
      }
    }
  },
  created () {
    this.tableData = this.data
  },
  methods: {
    clickTagName (idx) {
      this.selectedInstanceIdx = idx
    },
    updateDone () {
      this.$emit('updateDone', this.tableData[this.selectedInstanceIdx])
    },
    completeTask () {
      this.$emit('complete', this.tableData[this.selectedInstanceIdx])
    },
    runTask () {
      this.$emit('excute', this.tableData[this.selectedInstanceIdx])
    },
    refreshMemo (orderNo) {
      this.$emit('refresh-memo', orderNo)
    }
  },
  data () {
    return {
      tableData: [],
      selectedInstanceIdx: 0,
      selectedInstance: {},
      taskDetailTabs: [
        {
          field: 'accessPoint',
          name: '엑세스 포인트',
          keyPath: '엑세스 포인트'
        },
        {
          field: 'security',
          name: '보안그룹 정보',
          isActive: true,
          keyPath: '보안그룹 정보'
        },
        { field: 'memo', name: '메모', keyPath: '메모' }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
.instance-table-header {
  padding-bottom:20px;
  display: flex;
  justify-content: space-between;
  .instance-tags {
    width: 80%;
  }
  .button-wrapper {
    display: flex;
    align-items: top;
    margin-top: 20px;
  }
  .instance-tag {
    cursor:pointer;
    &.-selected {
      background: #3e57c9;
    }
  }
}

.security-article {
  &-title {
    padding: 0 $gap-s;
    border: 1px solid $purple;
    border-radius: 3px;
    color: $purple;
    font-size: 13px;
    line-height: 27px;
  }
}
</style>
