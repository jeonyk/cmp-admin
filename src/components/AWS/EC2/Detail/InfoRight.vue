<template>
  <section class="instance-info-right">
    <section class="head">
      <div class="head-instance">
        <h2>인스턴스 사양</h2>
        <div class="head-instance-form">
          <h3>t2.micro</h3>
          <vertical-list
            class="vertical"
            :data="instanceVerticalList"
          />
        </div>
      </div>
      <div class="head-network">
        <h2>네트워크</h2>
        <div class="head-network-block">
          <div class="wrapper">
            <div class="left">
              <vpc-icon />
              <span class="title">VPC</span>
            </div>
            <div
              v-if="resData"
              class="right"
            >
              {{ resData.environment | caseOfVPC }}
            </div>
          </div>
        </div>
        <div class="head-network-block">
          <div class="wrapper">
            <div class="left">
              <subnet-icon />
              <span class="title">서브넷</span>
            </div>
            <div
              v-if="resData"
              class="right"
            >
              {{ parseInt(resData.isPublic) ? "외부" : "내부" }}
            </div>
          </div>
        </div>
      </div>
    </section>
    <security-group
      :security-group-data.sync="convertedSecurityGroupData"
      :selected-security-group.sync="selectedSecurityGroup"
    />
    <section class="storage">
      <div class="storage-head">
        <div class="storage-head-left">
          <h2>스토리지</h2>
          <span>(총 {{ storageData.length }}개)</span>
        </div>
        <div class="storage-head-right">
          <div class="page">
            <span class="start">{{ currPage }}</span>
            <span class="split">/</span>
            <span class="end">{{ lastPage }}</span>
          </div>
          <div class="action">
            <div
              class="prev"
              :class="{ disabled: currPage <= 1 }"
              @click="movePrev"
            >
              <i class="mdi mdi-chevron-left" />
            </div>
            <div
              class="next"
              :class="{ disabled: currPage >= lastPage }"
              @click="moveNext"
            >
              <i class="mdi mdi-chevron-right" />
            </div>
          </div>
        </div>
      </div>
      <div class="storage-body">
        <div
          v-for="(ebs, idx) in ebsList"
          :key="ebs.volumeId"
          class="storage-item"
        >
          <div class="storage-item-title">
            <div class="storage-item-title__icon">
              <storage-icon />
            </div>
            <div class="storage-item-title__info">
              <div class="type">
                {{ idx === 0 ? "루트" : "EBS" }}
              </div>
              <div class="path">
                {{ ebs.attachedDevice }}
              </div>
            </div>
          </div>
          <div class="storage-item-body">
            <simple-info-table
              title="용량"
              slot-name="diskSize"
            >
              <template #diskSize>
                {{ ebs.size }}GB
              </template>
            </simple-info-table>
            <simple-info-table
              title="유형"
              slot-name="type"
            >
              <template #type>
                {{ ebs.volumeType }}
              </template>
            </simple-info-table>
            <simple-info-table
              title="IOPS"
              slot-name="iops"
            >
              <template #iops>
                {{ ebs.iops }}
              </template>
            </simple-info-table>
            <simple-info-table
              title="처리량"
              desc="해당사항 없음"
            />
          </div>
        </div>
      </div>
    </section>
  </section>
</template>

<script>
import VpcIcon from '@/components/Icons/VpcIcon.vue'
import VerticalList from '../Util/VerticalList.vue'
import SubnetIcon from '@/components/Icons/SubnetIcon.vue'
import { mapMutations } from 'vuex'
import StorageIcon from '@/components/Icons/StorageIcon.vue'
import SimpleInfoTable from '../Forms/SimpleInfoTable.vue'
import SecurityGroup from '@/components/AWS/EC2/Security/SecurityGroup.vue'

export default {
  components: {
    VerticalList,
    VpcIcon,
    SubnetIcon,
    StorageIcon,
    SimpleInfoTable,
    SecurityGroup
  },
  name: 'InfoRight',
  props: {
    resData: {
      type: Object,
      required: true
    },
    storageData: {
      type: Array,
      required: true
    },
    securityGroupData: {
      type: Array,
      required: true
    }
  },
  computed: {
    ebsList () {
      const data = this.storageData
      const start = (this.currPage - 1) * this.perPage
      const end = start + this.perPage
      return data.slice(start, end)
    }
  },
  filters: {
    caseOfVPC (vpc) {
      switch (vpc) {
        case 'STG':
          return '스테이징'
        case 'PRD':
          return '운영'
        case 'DEV':
          return '개발'
        default:
          return ''
      }
    }
  },
  methods: {
    ...mapMutations({
      mutateFullLayout: 'common/SET_FULL_LAYOUT'
    }),
    initPage () {
      this.currPage = 1
      this.lastPage =
        this.storageData.length % this.perPage === 0
          ? this.storageData.length / this.perPage
          : parseInt(this.storageData.length / 4) + 1
    },
    movePrev () {
      if (this.currPage <= 1) return
      this.currPage--
    },
    moveNext () {
      if (this.currPage >= this.lastPage) return
      this.currPage++
    },
    initSpec () {
      this.instanceVerticalList[0].value = this.resData.vcpu + 'Core'
      this.instanceVerticalList[1].value =
        this.resData.memory % 1024 === 0
          ? parseInt(this.resData.memory / 1024) + 'GB'
          : Number(this.resData.memory / 1024).toFixed(2) + 'GB'
    },
    /**
     * 쓸 수 있게 변환 (보안그룹)
     */
    initSecurityGroup () {
      this.convertedSecurityGroupData = this.securityGroupData.map(
        (sg, sgIdx) => {
          this.$set(sg, 'tabActivated', 0)
          this.$set(sg, 'activated', sgIdx === 0)
          sg.outboundRules = sg.securityGroupRuleDtoList.filter(
            groupRule => groupRule.isEgress
          )
          sg.inboundRules = sg.securityGroupRuleDtoList.filter(
            groupRule => !groupRule.isEgress
          )
          return sg
        }
      )
      this.selectedSecurityGroup = this.convertedSecurityGroupData[0]
    }
  },
  created () {
    this.mutateFullLayout(true)
    this.initSpec()
    this.initSecurityGroup()
    this.initPage()
  },
  beforeDestroy () {
    this.mutateFullLayout(false)
  },
  data: () => ({
    instanceVerticalList: [
      { name: 'vCPU', value: '' },
      { name: '메모리', value: '' },
      { name: '네트워크 성능', value: 'LOW TO MODERATO' }
    ],
    currPage: 1,
    lastPage: 1,
    perPage: 4,
    selectedSecurityGroup: null,
    convertedSecurityGroupData: []
  })
}
</script>

<style lang="scss" scoped>
.instance-info-right {
  flex: 1;
  height: 860px;
  overflow: hidden;
  box-sizing: border-box;

  h2 {
    font-size: 16px;
    margin-bottom: 15px;
  }

  h3 {
    font-size: 15px;
  }

  .head {
    display: flex;
    flex-wrap: nowrap;

    &-instance {
      flex: 0 0 510px;
      margin-right: $gap-s;

      &-form {
        padding: 20px 30px;
        border-radius: 6px;
        background-color: #f9f9f9;
        height: 90px;
        box-sizing: border-box;

        .vertical {
          margin-top: $gap;
          padding-bottom: 5px;
          text-align: right;
        }
      }
    }

    &-network {
      flex: 0 1 100%;
      box-sizing: border-box;

      &-block {
        display: inline-block;
        box-sizing: border-box;
        width: calc(50% - 5px);
        height: 90px;
        padding: 20px 30px;
        border: 1px solid #caced0;
        border-radius: 6px;

        .wrapper {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 100%;

          svg {
            margin-right: 15px;
            position: relative;
            top: -1px;
          }

          .title {
            color: $main-blue;
            font-size: 15px;
            font-weight: 500;
          }

          .left {
            display: flex;
            align-items: center;
          }

          .right {
            font-size: 15px;
            font-weight: bold;
          }
        }

        &:first-of-type {
          margin-right: $gap-s;
        }
      }
    }
  }

  .storage {
    margin-top: 40px;

    &-head {
      display: flex;
      justify-content: space-between;

      &-left {
        h2 {
          display: inline-block;
        }

        span {
          margin-left: 5px;
          color: #999;
        }
      }

      &-right {
        > * {
          display: inline-block;
        }

        .page {
          margin-right: $gap-s;

          .split {
            margin: 0 5px;
          }

          .split,
          .end {
            color: #999;
          }
        }

        .action {
          .prev {
            border-right: none;
          }

          .prev,
          .next {
            display: inline-block;
            border: 1px solid #ccc;
            padding: 3px;
            cursor: pointer;

            &.disabled {
              cursor: not-allowed;

              .mdi {
                color: #e0e0e0;
              }
            }

            .mdi {
              font-size: 18px;
            }
          }
        }
      }
    }

    &-body {
      display: flex;
      flex-wrap: nowrap;

      > * + * {
        margin-left: $gap-s;
      }

      .storage-item {
        width: 250px;
        height: 200px;
        background-color: #f9f9f9;
        border-radius: 6px;
        box-sizing: border-box;
        padding: 15px 20px;

        &-title {
          padding-bottom: $gap;
          margin-bottom: 15px;
          border-bottom: 1px solid #f0f0f0;

          &__icon {
            padding: 10px 12px;
            border-radius: 9999px;
            background-color: $white;
            display: inline-block;
            vertical-align: top;

            > svg {
              position: relative;
              top: 2px;
            }
          }

          &__info {
            display: inline-block;
            margin-left: 10px;
            padding-top: 5px;
            line-height: 1.125;

            .type {
              font-weight: bold;
            }

            .path {
              color: #999;
              font-size: 13px;
            }
          }
        }

        &-body {
          padding: 0 10px;

          > * + * {
            margin-top: $gap-s;
          }

          &::v-deep {
            .info-table-desc {
              color: #333;
              text-align: right;
            }
          }
        }
      }
    }
  }
}
</style>
