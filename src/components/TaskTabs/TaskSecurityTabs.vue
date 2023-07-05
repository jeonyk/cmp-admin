<template>
  <div>
    <g-tab
      :data="convertedTabs"
      :padding-top="30"
    >
      <!-- v-if="isTrue" -->
      <template #accessPoint>
        <dashboard-panel
          v-if="!accessPointList.length"
          :padding-top="0"
          title="루트 디바이스"
          small-title
        >
          <cmp-grid
            :item-source="accessPointList"
            :columns="accessPointColumns"
          >
            <template #lifeCycleState="{ row }">
              {{
                row.lifeCycleState === "available" ? "사용 가능" : "사용 불가능"
              }}
            </template>
          </cmp-grid>
        </dashboard-panel>
        <div
          class="empty-zone"
          v-else
        >
          액세스 포인트 정보가 없습니다.
        </div>
        <!-- <cmp-grid
          :item-source="accessPointList"
          :columns="accessPointColumns"
        /> -->
      </template>
      <template #security>
        <div v-if="type === 'EFS'">
          <section>
            <p style="text-indent: 10px">
              적용된 파일 시스템 정책
            </p>
            <div
              class="security-table"
              style="margin-top: 10px"
            >
              <register-contents
                v-for="int in [1, 2, 3, 4]"
                :key="int"
                title="기본적으로 루트 엑세스 금지"
              >
                Allow
              </register-contents>
            </div>
          </section>
          <section style="margin-top: 30px">
            <p style="text-indent: 10px">
              네트워크 정책 <span>영역(0개)</span>
            </p>
            <p
              style="
                font-size: 16px;
                text-indent: 10px;
                margin-top: 30px;
                border-bottom: 1px solid #3d435e;
                padding-bottom: 10px;
              "
            >
              us-northeast--sa2
            </p>
            <div
              class="network-table"
              style="margin-top: 10px"
            >
              <register-contents
                v-for="int in [1, 2, 3, 4]"
                :key="int"
                title="기본적으로 루트 엑세스 금지"
              >
                Allow
              </register-contents>
            </div>
          </section>
        </div>

        <!-- Securitygroup Names -->
        <!-- 보안그룹 -->
        <div>
          <span
            @click="clickSecurityName(idx)"
            :class="[
              'instance-tag',
              { '-selected': idx === selectedSecurityGroupIdx },
            ]"
            v-for="(name, idx) in securityGroupNames"
            :key="name"
            class="security-article-title"
          >
            보안 그룹 ID :&nbsp;{{ name }}
          </span>
        </div>

        <!-- Outbound Rules -->
        <!-- Outbound Rules -->
        <dashboard-panel
          style="margin-top: 20px"
          title="아웃바운드 규칙"
          foldable
          small-title
        >
          <template #headerPostfix>
            <small
              class="reference-text"
            >(총 <strong>{{ outboundRules.length }}</strong>개)</small>
          </template>
          <ul
            class="flex-wrap"
            style="gap: 13px;"
          >
            <bound-card
              v-for="rule in outboundRules"
              :key="rule.id"
              :data="rule"
            />
          </ul>
        </dashboard-panel>

        <!-- Inbound Rules -->
        <!-- Inbound Rules -->
        <dashboard-panel
          style="margin-top: 20px"
          title="인바운드 규칙"
          foldable
          small-title
        >
          <template #headerPostfix>
            <small
              class="reference-text"
            >(총 <strong>{{ inboundRules.length }}</strong>개)</small>
          </template>
          <ul
            class="flex-wrap"
            style="gap: 13px;"
          >
            <bound-card
              v-for="rule in inboundRules"
              :key="rule.id"
              :data="rule"
            />
          </ul>
        </dashboard-panel>
        <slot />
      </template>
      <template #memo>
        <section id="memo-section">
          <div class="memo-wrap">
            <task-memo
              :data="memoList"
              @refresh-memo="refreshMemo"
            />
          </div>
        </section>
      </template>
    </g-tab>
  </div>
</template>

<script>
import TaskMemo from '@/views/Task/Nutanix/TaskMemo/TaskMemo.vue'
import { DashboardPanel } from '@sd-fe/cmp-core'

export default {
  components: {
    TaskMemo,
    DashboardPanel
  },
  props: {
    type: {
      type: String,
      default: 'EC2'
    },
    data: {
      type: Array,
      default: () => {}
    },
    tabs: {
      type: Array,
      default: () => {}
    },
    rules: {
      type: Array,
      default: () => {}
    },
    memoList: {
      type: Object,
      default: () => {}
    }
  },
  computed: {
    convertedTabs () {
      if (this.type === 'EC2') { return this.tabs.filter((tab) => tab.field !== 'accessPoint') } else return this.tabs
    },
    securityGroupNames () {
      return this.data?.map((d) => d.groupId)
    },
    selectedSecurityGroup () {
      return (
        this.data?.find((_, idx) => idx === this.selectedSecurityGroupIdx) || []
      )
    },
    inboundRules () {
      if (!this.selectedSecurityGroup) return []
      return (
        this.selectedSecurityGroup.securityGroupRuleDtoList
          ?.filter((rule) => !rule.isEgress)
          .map((rule) => ({
            ...rule,
            id: rule.ruleId,
            title: rule.groupName,
            method: rule.ruleType,
            source: rule.ipv4Ranges,
            port: rule.toPort
          })) || []
      )
    },
    outboundRules () {
      if (!this.selectedSecurityGroup) return []
      return (
        this.selectedSecurityGroup.securityGroupRuleDtoList
          ?.filter((rule) => rule.isEgress)
          .map((rule) => ({
            ...rule,
            id: rule.ruleId,
            title: rule.groupName,
            method: rule.ruleType,
            source: rule.ipv4Ranges,
            port: rule.toPort
          })) || []
      )
    }
  },
  methods: {
    refreshMemo (orderNo) {
      this.$emit('refresh-memo', orderNo)
    },
    clickSecurityName (idx) {
      this.selectedSecurityGroupIdx = idx
    },
    rejectButtonAction () {
      this.approveStep = {
        visible: true,
        currentStep: '반려'
      }
    }
  },
  data () {
    return {
      selectedSecurityGroupIdx: 0,
      tabsData: [],
      isTrue: false,
      accessPointList: [
        // 후에 액세스 포인트 맵핑 필요;
        {
          name: 'Test_ACCESS_POINT',
          id: 'd9f8vsdf87fds',
          path: '/foo/bar',
          status: 'Available'
        },
        {
          name: 'Test_ACCESS_POINT',
          id: 'd9f8vsdf87fds',
          path: '/foo/bar',
          status: 'Available'
        }
      ],
      accessPointColumns: [
        {
          header: '이름',
          binding: 'name',
          width: '',
          sorting: false,
          customHtml: true
        }, // 발생시간
        {
          header: 'Access Point Id',
          binding: 'id',
          width: '',
          sorting: false,
          customHtml: true,
          cssClass: 'task-status-fail'
        }, // 상태
        {
          header: '경로',
          binding: 'path',
          width: '',
          sorting: false,
          customHtml: true
        }, // 관계사
        {
          header: '상태',
          binding: 'status',
          width: '',
          sorting: false,
          customHtml: true
        } // 조직
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
.security-table {
  display: flex;
  flex-wrap: wrap;
  .register-contents {
    width: 50%;
  }
}

.network-table {
  display: flex;
  flex-wrap: wrap;
  .register-contents {
    width: 25%;
  }
}

.memo-wrap {
  padding: $gap $gap-m $gap-m;
  border: 1px solid $border2A;
  border-radius: $radius;
}

#memo-section {
  // margin-top: $gap-m * 2;
  padding: $gap-m * 2;
  border-radius: 20px;
  > .sub-title {
    margin-bottom: 0;
    line-height: normal;
  }
}

.instance-tag {
  margin-right:10px;
  cursor: pointer;
  padding:5px;
  border-radius: 3px;
  font-size: 13px;
  line-height: 27px;
  border:1px solid #999;
  color:#999;
  &.-selected {
    border:1px solid $purple;
    color:  $purple;
  }
}

small.reference-text {
  margin-left: 5px;
  font-size: 12px;
  color: $input-placeholder;
}

</style>
