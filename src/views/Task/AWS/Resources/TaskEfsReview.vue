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
            <simple-info-table
              title="EFS 이름"
              :desc="selectedService.fileSystemName"
            />
            <simple-info-table
              title="적용 범위"
              desc="리전"
            />
            <simple-info-table
              title="탑재 대상"
              :desc="selectedService.environment"
            />

            <!-- 성능_모드: performanceMode === 'generalPurpose' ? '범용모드' : data.performanceMode, // data.generalPurpose -->
            <!-- 파일_처리량: throughputMode === 'bursting' ? '버스트 모드' : data.throughputMode // data.throughputMode -->
            <simple-info-table
              title="성능 모드"
              :desc="performanceMode"
            />
            <simple-info-table
              title="파일 처리량"
              :desc="throughputMode"
            />
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
    performanceMode () {
      return this.selectedService.performanceMode === 'generalPurpose' ? '범용모드' : this.selectedService.performanceMode
    },
    throughputMode () {
      return this.selectedService.throughputMode === 'bursting' ? '버스트 모드' : this.selectedService.throughputMode
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
</style>
