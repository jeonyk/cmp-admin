<template>
  <div>
    <cmp-grid
      :columns="columns"
      :item-source="data"
    >
      <template #info="{ row }">
        <file-icon
          :width="20"
          :height="20"
          is-button
          class="file-icon"
          @click="openReview(row)"
        />
      </template>
    </cmp-grid>
    <el-dialog
      :visible="service.isVisible"
      :actvie="true"
      width="1220px"
      top="10vh"
      @close="service.isVisible = false"
    >
      <header class="header">
        {{ $v("검토") }}
      </header>

      <div class="review">
        <section class="efs-form-div">
          <h2 class="table-title">
            <span>{{ $v("보안그룹 정보") }}</span>
          </h2>
          <section class="section">
            <simple-info-table
              title="보안그룹 이름"
              :desc="selectedService.groupName"
              width="130"
            />
            <simple-info-table
              title="보안그룹 설명"
              :desc="selectedService.description"
              width="130"
            />
            <simple-info-table
              title="VPC"
              :desc="selectedService.vpcKor"
              width="130"
            />

            <simple-info-table
              title="인바운드 규칙"
              desc="vpc"
              width="130"
              slot-name="contents"
            >
              <template #contents>
                <!-- securityGroupRuleDtoList -->
                <div class="row line-bottom">
                  <span>{{ $v('프로토콜 유형') }}</span>
                  <span>{{ $v('포토범위') }}</span>
                  <span>{{ $v('소스') }}</span>
                  <span>{{ $v('규칙 설명') }}</span>
                </div>
                <ul v-if="inbounds && inbounds.length">
                  <!-- tcp 1123 0.0.0.0/0 규책 설명 -->
                  <li
                    class="row"
                    v-for="(x, idx) in inbounds"
                    :key="idx"
                  >
                    <span>{{ x.protocol }}</span>
                    <span>{{ x.fromPort }}</span>
                    <span>{{ x.ipv4Ranges }}</span>
                    <el-tooltip
                      placement="top"
                      effect="light"
                    >
                      <div slot="content">
                        {{ x.ruleDescription }}
                      </div>
                      <span>{{ $v('규책설명') }}</span>
                    </el-tooltip>
                  </li>
                </ul>
              </template>
            </simple-info-table>
            <simple-info-table
              title="아웃바운드 규칙"
              desc="vpc"
              width="130"
              slot-name="contents"
            >
              <template #contents>
                <!-- securityGroupRuleDtoList -->
                <div class="row line-bottom">
                  <span>{{ $v('프로토콜 유형') }}</span>
                  <span>{{ $v('포토범위') }}</span>
                  <span>{{ $v('소스') }}</span>
                  <span>{{ $v('규칙 설명') }}</span>
                </div>
                <ul v-if="outbounds && outbounds.length">
                  <!-- tcp 1123 0.0.0.0/0 규책 설명 -->
                  <li
                    v-for="(x, idx) in outbounds"
                    :key="idx"
                    class="row"
                  >
                    <span>{{ x.protocol }}</span>
                    <span>{{ x.fromPort }}</span>
                    <span>{{ x.ipv4Ranges }}</span>
                    <span>{{ $v('규책설명') }}</span>
                  </li>
                </ul>
                <div class="empty-data">
                  {{ $v('선택한 규칙이 없습니다.') }}
                </div>
              </template>
            </simple-info-table>
          </section>
        </section>
      </div>
    </el-dialog>
  </div>
</template>
<script>
import SimpleInfoTable from './SimpleInfoTable.vue'
import FileIcon from '@/components/Icons/FileIcon.vue'

export default {
  components: {
    SimpleInfoTable,
    FileIcon
  },
  props: {
    data: {
      type: Array,
      default: () => []
    },
    columns: {
      type: Array,
      default: () => []
    },
    function: {
      type: Function,
      default: () => {}
    }
  },
  computed: {
    selectedService () {
      return this.service.data
    },
    securityGroupRuleDtoList () {
      return this.selectedService.securityGroupRuleDtoList
    },
    outbounds () {
      return this.selectedService.securityGroupRuleDtoList.filter(s => s.isEngress)
    },
    inbounds () {
      return this.selectedService.securityGroupRuleDtoList.filter(s => !s.isEngress)
    }
  },
  methods: {
    getTargetGroup (listener) {
      return listener?.targetGroup?.targetGroupName
    },
    openReview (row) {
      const { instanceName } = row
      const found = this.data.find((x) => x.instanceName === instanceName)
      this.service = {
        isVisible: true,
        data: found
      }
    }
  },
  data () {
    return {
      service: {
        service: false,
        data: {}
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.component {
}
.header {
  font-size: 16px;
}

.table-title {
  margin: 30px 0 10px 0;
  font-size: 14px;
}
.section {
  margin-bottom: 20px;
  padding: 40px;
  background-color: #f9f9f9;
  border-radius: 6px;
  position: relative;
  .info-table + .info-table {
    margin-top: 20px !important;
  }
}

.row {
    display:flex;
    span {
        display:inline-block;
        width:25%;
      &:nth-of-type(4){
        width:auto;
      }
    }
}

.line-bottom {
    padding-bottom:5px;
    margin-bottom: 5px;
    border-bottom:1px solid #e0e0e0;
}
</style>
