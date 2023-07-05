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
      <pre style="overflow-y:auto; height:300px;">
        {{ selectedService }}
    </pre>
      <header class="header">
        {{ $v("검토") }}
      </header>

      <div class="review">
        <section class="efs-form-div">
          <h2 class="table-title">
            <span>{{ $v("인스턴스 기본 정보") }}</span>
          </h2>
          <section class="section">
            <simple-info-table
              title="로드밸런서 이름"
              :desc="selectedService.elbName"
              width="130"
            />
            <simple-info-table
              title="로드 밸런서 종류"
              desc="L4"
              width="130"
            />
            <simple-info-table
              title="스키마"
              :desc="scheme"
              width="130"
            />

            <simple-info-table
              title="VPC "
              :desc="vpc"
              width="130"
            />
          </section>
        </section>

        <section class="efs-form-div">
          <h2 class="table-title">
            <span>{{ $v("리스너/대상그룹") }}</span>
          </h2>
          <section class="section">
            <simple-info-table
              title="리스너"
              desc="aws-nlb-test-01"
              slot-name="contents"
              width="130"
            >
              <template #contents>
                <div class="row line-bottom">
                  <span style="width:100px;">{{ $v('프로토콜') }}</span>
                  <span>{{ $v('포트') }}</span>
                  <span>{{ $v('대상그룹') }}</span>
                </div>
                <ul>
                  <li
                    v-for="(listener, idx) in listeners"
                    :key="idx"
                    class="row"
                  >
                    <span style="width:100px;">{{ listener.protocol }}</span>
                    <span>{{ listener.port }}</span>
                    <span>{{ getTargetGroup(listener) }}</span>
                  </li>
                </ul>
              </template>
            </simple-info-table>

            <!-- <simple-info-table
              :title="$v('상태확인 속성')"
              :desc="123"
              slot-name="statusCheck"
              width="130"
            >
              <template #statusCheck>
                <span>{{ $v('포트') }} : {{ selectedService.healthCheckPort }} / </span>
                <span>{{ $v('시간초과') }} : {{ selectedService.healthCheckTimeoutSeconds }} {{ $v('초') }} / </span>
                <span>{{ $v('정상 임계값') }} : {{ selectedService.healthyThresholdCount }} {{ $v('연속 상태 확인 성공 횟수') }}  </span><br>
                <span>{{ $v('비정상 임계값') }} : {{ selectedService.unhealthyThresholdCount }} {{ $v('연속 상태 확인 실패 횟수') }} / </span>
                <span>{{ $v('간격') }} : {{ selectedService.healthCheckIntervalSeconds }} {{ $v('초') }} </span>
              </template>
            </simple-info-table> -->
            <!-- 프로토콜 포트 대상그룹 -->
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
    scheme () {
      return this.selectedService.isPublic ? this.$v('외부') : this.$v('외부')
    },
    vpc () {
      return this.selectedService.vpcRaw?.environment
    },
    listeners () {
      return this.selectedService.registerListener
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
        &:nth-of-type(1) {
            width:200px;
        }
        &:nth-of-type(2){
            width:200px;
        }
    }
}

.line-bottom {
    padding-bottom:5px;
    margin-bottom: 5px;
    border-bottom:1px solid #e0e0e0;
}
</style>
