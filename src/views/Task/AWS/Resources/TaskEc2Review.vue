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
      <article class="review">
        <header class="review-head">
          <h1>{{ $v("검토") }}</h1>
        </header>
        <section class="review-instance">
          <header class="review-instance-head">
            <h2>{{ $v("인스턴스 기본 정보") }}</h2>
          </header>
          <section class="review-instance-body form">
            <simple-info-table
              v-for="info in instance"
              :key="info.title"
              :title="info.title"
              :desc="info.desc"
              :slot-name="info.slotName"
              width="130"
            >
              <template #storage>
                <el-table
                  class="storage-table"
                  :data="selectedService.blockDeviceMapping"
                  stripe
                >
                  <el-table-column
                    prop="volumeRootType"
                    :label="$v('볼륨 유형')"
                  >
                    <template slot-scope="scope">
                      {{ scope.row.volumeRootType === 0 ? $v("루트") : "EBS" }}
                    </template>
                  </el-table-column>
                  <el-table-column
                    prop="device"
                    :label="$v('디바이스')"
                  />
                  <el-table-column
                    prop="volumeSize"
                    :label="$v('볼륨 크기')"
                  />
                  <el-table-column
                    prop="iops"
                    label="IOPS"
                  />
                  <el-table-column
                    prop="throughput"
                    :label="$v('처리량')"
                  />
                </el-table>
              </template>
            </simple-info-table>
          </section>
        </section>
        <!-- 네트워크 -->
        <section class="review-network">
          <header class="review-network-head">
            <h2>{{ $v("네트워크/보안그룹") }}</h2>
          </header>
          <section class="review-network-body form">
            <simple-info-table
              title="VPC"
              :desc="vpc"
            />
            <simple-info-table
              title="서브넷"
              :desc="subnet"
            />
            <simple-info-table
              title="보안그룹"
              slot-name="securityGroupDtoList"
            >
              <template #securityGroupDtoList>
                <div
                  v-for="(securityGroup, idx) in securityGroupDtoList"
                  :key="idx"
                >
                  {{ securityGroup.groupName }}
                  (인바운드 규칙 : {{ securityGroup.securityGroupRuleDtoList.filter(x => !x.isEgress).length }})
                  (아웃바운드 규칙 : {{ securityGroup.securityGroupRuleDtoList.filter(x => x.isEgress).length }})
                </div>
              </template>
            </simple-info-table>
          </section>
        </section>
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
  computed: {
    selectedService () {
      return this.service.data
    },
    instance () {
      return [
        { title: 'Region', desc: this.data.region },
        {
          title: this.$v('인스턴스 이름'),
          desc: this.selectedService.instanceName
        },
        {
          title: 'AMI',
          desc: this.selectedService.amazonImageDto ? this.selectedService.amazonImageDto.name : ''
        },
        {
          title: this.$v('인스턴스 사양'),
          desc: this.selectedService.amazonImageDto?.defaultInstanceType
        },
        {
          title: this.$v('스토리지'),
          desc: this.selectedService.instanceName,
          slotName: 'storage'
        },
        {
          title: this.$v('세부 모니터링'),
          desc: this.selectedService.monitoringState
            ? this.$v('활성')
            : this.$v('비활성')
        } // TODO 다국어
      ]
    },
    vpc () {
      return this.selectedService.vpcDto?.environment || ''
    },
    subnet () {
      return this.selectedService.subnetDto?.isPublic ? this.$v('내부') : this.$v('외부') || ''
    },
    securityGroupDtoList () {
      return this.selectedService.securityGroupDtoList || []
    },
    network () {
      return [
        {
          title: 'VPC',
          desc: this.networkInfo.vpc ? this.networkInfo.vpc.envStr : ''
        },
        {
          title: this.$v('서브넷'),
          desc: this.networkInfo.subnet ? this.$v('내부') : this.$v('외부')
        },
        { title: this.$v('보안그룹'), slotName: 'securityGroup' }
      ]
    }
  },
  props: {
    data: {
      type: Array,
      default: () => {}
    },
    columns: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    openReview (row) {
      const { instanceName } = row
      const found = this.data.find(x => x.instanceName === instanceName)
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
      // service.isVisible: false
    }
  }
}
</script>
<style lang="scss" scoped>
.review {
  &.dark {
    .review-price {
      > .mdi {
        color: $main-blue;
      }

      &-number {
        color: $main-blue;
      }
    }

    .modal-button-area {
      border-color: #3d435e;
    }

    .required {
      &::after {
        color: $main-blue !important;
      }
    }

    .form {
      background-color: #fff;
    }
  }

  header {
    display: flex;
    justify-content: space-between;

    .edit-icon {
      margin: $gap-m $gap-s $gap-s 0;
      cursor: pointer;
    }
  }

  h1 {
    font-size: 16px;
    margin-top: 0;
  }

  h2 {
    margin: $gap-m 0 $gap-s 0;
    font-size: 14px;
  }

  .form {
    margin-bottom: $gap;
    padding: 40px;
    background-color: #f9f9f9;
    border-radius: 6px;
    position: relative;

    > .info-table + .info-table {
      margin-top: $gap;
    }

    &::v-deep .info-table {
      &-desc {
        color: #333;
      }
    }

    .edit-icon {
      position: absolute;
      top: 20px;
      right: 20px;
      color: #9596ad;

      &:hover {
        cursor: pointer;
        color: #333;
      }
    }

    .storage-table {
      background-color: transparent;

      &::before {
        background-color: transparent;
      }

      &::v-deep {
        tr,
        td,
        th {
          background-color: transparent;
          color: #333;
          border-color: #e0e0e0;
        }

        td,
        th {
          padding: 3px 0;
        }

        th {
          font-weight: normal;
          padding-top: 0;
        }

        td {
          border: none;
        }
      }
    }
  }

  .list {
    & > * + * {
      margin-top: $gap-s;
    }
  }

  &-price {
    margin-top: 60px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    flex-wrap: nowrap;

    &-text {
      font-size: 22px;
      font-weight: bold;
      margin-right: 5px;
    }

    > .mdi {
      font-size: 18px;
      color: $main-red;
      margin-right: 25px;
    }

    &-dollar {
      margin-right: $gap;
    }

    &-number {
      font-size: 28px;
      font-weight: bold;
      color: $main-red;
    }
  }

  &-service-date {
    margin-top: $gap;

    span,
    .service-date-form {
      display: inline-block;
    }

    span {
      margin-right: 25px;
      font-size: 14px;
      font-weight: bold;
    }

    .service-date-form {
      margin-top: $gap-s;

      &::v-deep {
        .date-select {
          margin-right: $gap-s;
          width: 180px;
        }

        .time-select {
          width: 120px;
        }
      }
    }
  }

  .modal-button-area {
    border-top: 1px solid $section-stroke;
    padding-top: $gap;
    margin-top: 40px;
  }

  .empty-data {
    border: 1px solid #caced0;
    border-radius: 6px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $gap;
    margin-top: 0;
  }

  .required {
    position: relative;

    &::after {
      position: absolute;
      content: "*";
      color: $main-red;
      display: inline-block;
      top: -2px;
      margin-left: 5px;
    }
  }
}
</style>
