<template>
  <div class="component">
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
            <span>{{ $v("인스턴스 기본 정보") }}</span>
          </h2>
          <section class="section">
            <!-- <pre style="color:#000;">{{ selectedService }}</pre> -->
            <h3>{{ $v('기본 정보') }}</h3>
            <simple-info-table
              :title="$v('대상그룹 이름')"
              :desc="selectedService.targetGroupName"
              width="130"
            />
            <simple-info-table
              :title="$v('대상 그룹 유형')"
              :desc="type"
              width="130"
            />
            <!-- </div> -->
            <simple-info-table
              :title="$v('서비스 포트')"
              :desc="servicePort"
              width="130"
            />

            <h3 style="margin-top:20px;">
              {{ $v('대상그룹 서비스 상태 확인') }}
            </h3>
            <simple-info-table
              :title="$v('상태확인 프로토콜')"
              :desc="selectedService.protocol"
              width="130"
            />
            <simple-info-table
              :title="$v('상태확인 경로')"
              desc="-"
              width="130"
            />

            <!-- //     대상그룹 이름 : targetGroupName
    // 대상그룹 유형 : targetType
    // 서비스 포트 : healthCheckPort
    // 상태확인 프로토콜 : healthCheckProtocol
    // 상태확인 경로 : healthCheckPath
    // 상태확인 속성 :
    //   - 포트 :healthCheckPort
    //   - 시간초과 : healthCheckTimeoutSeconds
    //   - 정상 임계값 : healthyThresholdCount
    //   - 비정상 임계값 : healthCheckIntervalSeconds
    //  7. 인스턴스 targetType
    //  8.포트 healthCheckPort -->
            <simple-info-table
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
            </simple-info-table>

            <h3 style="margin-top:20px;">
              {{ $v('인스턴스 상세') }}
            </h3>
            <simple-info-table
              :title="$v('인스턴스')"
              slot-name="instance"
              width="130"
            >
              <template #instance>
                <ul class="instance-list">
                  <li style="border-bottom:1px solid #999; padding-bottom:10px; margin-bottom:10px;">
                    <span>{{ type }}</span>
                    <span>{{ $v('포트') }}</span>
                  </li>
                  <li
                    v-for="(r,index) in selectedService.registerTarget"
                    :key="index"
                  >
                    <span> {{ index + 1 }}. {{ r.instanceName }}</span>
                    <span>{{ r.targetPort }}</span>
                    <!-- <span> {{ list[idx].targetType === 'ip' ? r.targetId : r.instanceName }}</span> -->
                    <!-- <span> {{ r.targetPort }}</span> -->
                  </li>
                </ul>
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
    type () {
      return this.selectedService.targetType === 'instance' ? this.$v('인스턴스') : 'IP'
    },
    servicePort () {
      return `${this.selectedService.protocol} : ${this.selectedService.port}`
    },
    statusCheckProps () {
      return 123
    }
  },
  methods: {
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
h3 {
  color:#333;
  padding:20px 0px;
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

.instance-list {
  width:100%;
  > li {
    padding: 10px 0px;
    display:flex;
    &:first-child {
      padding-bottom:5px;
      border-bottom:1px solid #e0e0e0;
    }
    > span {
      width:44%;
    }
  }
}
</style>
