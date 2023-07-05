<template>
  <div style="color:#fff;">
    <cmp-grid
      :columns="columns"
      :item-source="data"
    >
      <template #info="{row}">
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
      <article>
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
                :title="$v('Transit Gateway ID')"
                :desc="selectedService.transitGatewayId"
                width="130"
              />
              <simple-info-table
                :title="$v('자원명')"
                :desc="selectedService.resourceName"
                width="130"
              />
              <simple-info-table
                :title="$v('Amazon ASN')"
                :desc="selectedService.amazonAsn"
                width="130"
              />

              <simple-info-table
                :title="$v('연결 방식')"
                :desc="selectedService.attachmentType"
                width="130"
              />
            </section>
          </section>
        </div>
      </article>
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
      default: () => {}
    },
    columns: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    selectedService () {
      return this.service?.data
    }
  },
  methods: {
    openReview (row) {
      const { resourceName } = row
      const found = this.data.find(x => x.resourceName === resourceName)
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
