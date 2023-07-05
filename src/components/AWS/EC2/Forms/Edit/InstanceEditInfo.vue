<template>
  <div class="ins-edit">
    <simple-dropdown absolute>
      <template #title>
        기본정보
      </template>
      <div class="dropdown-body-inner">
        <simple-info-table
          title="Region"
          :desc="shared.regionName"
          width="175"
        />
        <simple-info-table
          title="인스턴스 이름"
          :desc="instanceData.instanceName"
          width="175"
        />
        <simple-info-table
          title="AMI"
          :desc="instanceData.amazonImageDto.name"
          width="175"
        />
        <simple-info-table
          title="인스턴스 사양"
          width="175"
          slot-name="spec"
          flex-center
        >
          <template #spec>
            {{ instanceData.instanceTypeDto.instanceType }}
          </template>
          <template #title-tooltip>
            <el-tooltip
              placement="bottom"
              effect="light"
              popper-class="shade-popper"
            >
              <i class="mdi mdi-information-outline tooltip" />
              <div slot="content">
                인스턴스 사양의 수정이 필요한 경우<br>
                1:1 문의나 관리자에게 문의 해주세요.
              </div>
            </el-tooltip>
          </template>
        </simple-info-table>
      </div>
    </simple-dropdown>
  </div>
</template>

<script>
import SimpleInfoTable from '../SimpleInfoTable.vue'
import SimpleDropdown from '../Edit/SimpleDropdown.vue'

export default {
  name: 'InstanceEditInfo',
  components: { SimpleInfoTable, SimpleDropdown },
  inject: ['shared'],
  computed: {
    instanceData () {
      return this.shared.isEdit && !this.shared.basketEdit
        ? this.shared.editData.orderData
        : this.shared.basketData.orderData
    }
  },
  data: () => ({
    toggledDropdown: false
  })
}
</script>

<style lang="scss" scoped>
.ins-edit {
  padding-bottom: $gap-s;

  .dropdown-body-inner {
    margin: 15px 20px;
    padding-top: $gap;
    border-top: 1px solid #e0e0e0;

    > * + * {
      margin-top: 15px;
    }
  }

  &::v-deep {
    .info-table {
      &-desc {
        color: #333;
      }

      .tooltip {
        color: $main-blue;
        position: relative;
        top: 1px;
        font-size: 18px;
      }
    }
  }
}
</style>
