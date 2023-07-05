<template>
  <div class="aws-task-tabs">
    <h2
      v-if="!isReadOnly"
      style="display:flex; gap:10px; margin-bottom:10px; font-size:18px;"
    >
      <span>{{ contents.name }}</span>

      <el-tooltip
        effect="light"
        popper-class="guid-content"
        v-if="contents.guide"
      >
        <span class="guide">
          <i class="mdi mdi-information-outline" />
        </span>
        <div
          slot="content"
          class="guide-content"
        >
          <strong>{{ $v('사용 방법 안내') }}</strong>
          <p v-html="$v(contents.guide)" />
        </div>
      </el-tooltip>
    </h2>
    <g-tab
      :data="tabs"
      show-length
      @click="clickTab"
    >
      <template #name="{ row }">
        {{ row.name }}
        <span class="view-count">{{ row.count }}</span>
      </template>
      <template
        v-for="tab in tabs"
        :slot="tab.field"
      >
        <div
          class="task-common-contents"
          :key="tab.field"
        >
          <g-foldable
            ref="confList"
            v-for="(item, key) in roleData[tab.field]"
            :key="key"
            :use-state="$orderType()"
            :title="setCount(key, item.length)"
          >
            <template #contents>
              <component
                :is="setComponent(key)"
                :task-type="taskType"
                :data="item"
                @cancel="(service) => $emit('cancel',service , tab.setting)"
                @set="(service) => $emit('set', service, tab.setting)"
                @update="service => $emit('update',service ,tab.setting)"
                @restore="(service) => $emit('restore', service, tab.setting)"
                @excute="(service, status) => $emit('excute', service, tab.setting, status)"
                @set-success="value => $emit('set-success', value, tab.setting)"
                :is-review-mode="isReviewMode"
              />
            </template>
          </g-foldable>
          <div class="big-button-area -bottom">
            <task-common-buttons
              :tab="tab"
              @report-order="$emit('report-order', true, tab)"
              @apply-approval="$emit('apply-approval', tab)"
              @complete-work-review="$emit('complete-work-review', tab, $event)"
              @complete-work-todo="$emit('complete-work-todo', tab, $event)"
              @complete-work-cancel="$emit('complete-work-cancel', tab, $event)"
            />
          </div>
          <!-- /. 버튼 동작 -->
        </div>
      </template>
    </g-tab>
    <slot />
  </div>
</template>

<script>
import TaskEc2 from '@/views/Task/AWS/Resources/TaskEc2.vue'
import TaskEfs from '@/views/Task/AWS/Resources/TaskEfs.vue'
import TaskSg from '@/views/Task/AWS/Resources/TaskSecurityGroup.vue'
import TaskNlb from '@/views/Task/AWS/Resources/TaskNlb.vue'
import TaskTgw from '@/views/Task/AWS/Resources/TaskTgw.vue'
import TaskTg from '@/views/Task/AWS/Resources/TaskTargetGroup.vue'
// import TaskTgwVpc from '@/views/Task/AWS/Resources/TaskTgwVpc.vue'
// import TaskTgwVpn from '@/views/Task/AWS/Resources/TaskTgwVpn.vue'
import TaskTgwPeering from '@/views/Task/AWS/Resources/TaskTgwPeering.vue'
import GFoldable from '@/components/common/g-foldable/g-foldable.vue'
import TaskCommonButtons from '@/components/TaskCommonButtons/TaskCommonButtons'
import { roleMixin } from '@/utils/work/role.js'

export default {
  mixins: [roleMixin],
  components: {
    'task-ec2': TaskEc2,
    'task-efs': TaskEfs,
    'task-sg': TaskSg,
    'task-nlb': TaskNlb,
    'task-tg': TaskTg,
    // 'task-tg-vpc': TaskTgwVpc,
    // 'task-tgw-vpn': TaskTgwVpn,
    'task-tgw-peering': TaskTgwPeering,
    GFoldable,
    TaskCommonButtons,
    TaskTgw
  },
  inject: ['$orderType'],
  provide () {
    return {
      $field_V3: () => this.type,
      $roleState: () => this.selectedRoleState
    }
  },
  computed: {
    type: (root) => (root.$route.name.replace(/(-detail|task-|-aws)/g, '').toUpperCase()),
    contents () { // 컨텐츠 명 분리
      return {
        CONFERENCE: {
          name: this.$v('사전 협의 내용'),
          guide: '- 예약 설정을 확인해주세요.<br>- 필요 시 주문변경을 통해 자원을 변경해주세요.<br>- 주문 취소한 자원에 대해서 다음 단계로 이동하기 전까지 주문 복원이 가능합니다.'
        },
        TODO: {
          name: this.$v('할 일 내용'),
          guide: '- 모든 서비스는 작업 진행이 완료되어야 합니다.<br>- 설정, 자원정보 항목에서 조회를 할 수 있습니다.<br>- 서비스가 성공인 경우 설치프로그램을 다운로드 해주세요.<br>- 작업상태 ＂성공(별도처리)＂ 상태도 ＂성공＂으로 처리하여 결재 가능합니다.'
        },
        DONE: {
          name: this.$v('한 일 내용'),
          guide: ''
        }
      }[this.taskType]
    },
    selectedRoleState () {
      return this.tabs?.find(x => x.roleIdx === this.selectedTab?.roleIdx)?.setting?.workState
    }
  },
  props: {
    data: {
      type: Array,
      default: () => []
    },
    selectedIdx: {
      type: Number,
      default: 0
    },
    taskType: {
      type: String,
      default: 'CONFERENCE'
    },
    isReviewMode: {
      type: Boolean,
      default: false
    },
    isReadOnly: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    async data (data) {
      await this.setTabs(data)
      this.clickTab(this.tabs[Object.keys(this.tabs)[0]], Object.keys(this.tabs)[0])
    }
  },
  async created () {
    await this.setTabs(this.data)
    this.clickTab(this.tabs[Object.keys(this.tabs)[0]], Object.keys(this.tabs)[0])
  },
  methods: {
    countArrays (obj) {
      let count = 0
      for (const key in obj) {
        if (Array.isArray(obj[key])) {
          count += obj[key].length
        }
      }
      return count
    },
    setTabs (workRsps) {
      // 데이터 세팅 시작
      console.log('데이터 세팅 시작')
      console.log(workRsps)
      const setTabs = {}
      const roleSetting = {} // 보고서, 결재설정 정보 분리

      workRsps.forEach(({
        workState, // CONFERENCE|TODO|DONE
        workItemRsps: source, // 자원목록
        workId, roleIdx, roleName,
        useApproval, useDoc, // 결재설정 ON/OFF, 보고서 설정 ON/OFF
        planDocument, reportDocument, // 사전협의 작업계획서, 할일 작업완료보고서
        ...workResps
      }) => {
        const services = {} // COMPUTE / NEWTORK / STORAGE / DATABASE ... 분류
        let block = false // 버튼 차단

        for (let i = 0; i < source.length; i++) {
          const { idx: srcIdx, workItemSpec, workItemConfig, autoScheduleAt, service, workItemState, resourceType, memo } = source[i]
          console.log('###source[i]')
          console.log(source[i])
          // workItemSpec   자원 스펙 데이터 :: originJson (원본 데이터 - 절대 변하지 않음), actualJson (작업대상데이터(변경된 or 변경가능한 데이터))
          // workItemConfig 자원 할당 데이터 :: configJson (자원 할당 변경된 or 변경 가능한 데이터)
          const { actualJson } = workItemSpec ?? { actualJson: null }
          const { configJson } = workItemConfig ?? { configJson: null }
          console.log('#configJson', configJson)
          const data = {
            ...source[i],
            ...JSON.parse(actualJson),
            configJson: { ...JSON.parse(actualJson) },
            autoScheduleAt,
            workItemState,
            srcIdx,
            resourceType,
            memo // 실패 사유
          }

          this.orderType = resourceType // NEW|CHANGE|DELETE
          const hasRead = this.checkServiceAuth(service, 'readPermission')
          // 자원 foldable 용으로 분류
          if (hasRead) {
            data.isExecutable = this.checkServiceAuth(service, 'executePermission')
            if (services[service] === undefined) services[service] = [data]
            else services[service].push(data)
          }

          /*
            workItemState 상태값
              INSUFFICIENT (업무 진행을 할 수 없는 경우 ex) ip 할당이 안된 network)
              INIT (신규)
              CANCELLING (취소중인 상태 (복원 가능))
              CANCELED_AT_REVIEW (사전협의에서 작업취소 (컨펌))
              CANCELED_AT_TODO (할일에서의 작업취소 (컨펌))
              READY_TO_WORK (수동작업대기)
              SCHEDULED (자동작업대기)
              SCHEDULE_PAUSED (자동작업중지)
              WORKING (작업중)
              FAILING (실패 중인 상태)
              FAIL_CONFIRMED (실패-실패처리)
              FAIL_AS_SUCCESS (실패-성공처리)
              SUCCESS (성공)
          */

          if (workItemState === 'INSUFFICIENT') block = true // 통과못하면 block 처리
        }

        const key = `${roleIdx}_${roleName}`

        // role 기반으로 데이터 분리 및 저장
        if (setTabs[key]) setTabs[key] = { ...services }
        else setTabs[key] = { ...setTabs[key], ...services }

        // [워크플로우] 결재 on/off 여부, 보고서 설정 데이터 저장
        roleSetting[key] = { useApproval, useDoc, planDocument, reportDocument, workState, block, workId }
      })

      this.tabs = [] // role 기반 분리

      // tab 설정
      for (const key in setTabs) {
        let count = 0
        for (const src in setTabs[key]) count += setTabs[key][src]?.length

        const roleName = key.split('_')[1]
        const roleIdx = key.split('_')[0]

        // console.log(key, roleSetting[key])
        const setting = roleSetting[key]
        const workId = setting.workId

        const tab = { field: key, name: roleName, roleIdx: Number(roleIdx), count, workId, setting }
        this.tabs.push(tab)
      }
      this.tabs.sort((a, b) => a.roleIdx - b.roleIdx)
      this.tabs = this.tabs.filter(tab => tab && tab.count > 0) // 역할 서비스 카운트 존재 시 탭 담기

      this.$nextTick(() => {
        this.roleData = setTabs // 자원 기반 분리
      })
    },
    setTabss (roles) {
      try {
        console.log(roles)
        this.roles = roles
        this.tabs = []
        roles.forEach(r => {
          const { useApproval, useDoc, planDocument, reportDocument, workState, workId, roleIdx, roleName } = r
          const field = `${roleIdx}_${roleName}`

          const customSetting = {
            field: field,
            name: roleName,
            roleIdx,
            count: this.countArrays(this.resources[field]), // 변경
            workId,
            setting: {
              useApproval,
              useDoc,
              planDocument,
              reportDocument,
              workState,
              workId
            }
          }

          const cRole = {
            ...customSetting
          }
          this.tabs.push(cRole)
        })

        this.tabs.sort((a, b) => a.roleIdx - b.roleIdx)
      } catch (err) {
        console.log('#ERROR : SET__TABS ', err)
        console.log(err)
      }
    },
    setResources (roles) {
      try {
        this.roleData = []
        roles.forEach(r => {
          const { roleIdx, roleName } = r
          const field = `${roleIdx}_${roleName}`
          const services = {}
          r.workItemRsps.forEach(x => {
            x.workState = r.workState
            const hasRead = this.checkServiceAuth(x.service, 'readPermission')
            if (hasRead) {
              if (services[x.service] === undefined) {
                services[x.service] = [{ ...x, ...JSON.parse(x.workItemSpec.actualJson), srcIdx: x.idx, isExecutable: this.checkServiceAuth(x.service, 'executePermission') }]
              } else {
                services[x.service].push({ ...x, ...JSON.parse(x.workItemSpec.actualJson), srcIdx: x.idx, isExecutable: this.checkServiceAuth(x.service, 'executePermission') })
              }
            }
          })

          this.roleData[field] = services
          r.workItemRsps.map(x => {
            x.data = JSON.parse(x.workItemSpec.actualJson)
          })
        })
      } catch (err) {
        console.log('#error', err)
      }
    },
    clickTab (asdasd, idx) {
      idx = Number(idx)
      this.selectedTab = asdasd
      this.$emit('click', asdasd, idx)
    }
  },
  data () {
    return {
      selectedTab: {},
      roleData: [],
      isLoading: true,
      selected: {},
      tabs: [],
      resources: [],
      setComponent (key) {
        return {
          EC2: 'task-ec2',
          EFS: 'task-efs',
          NLB_L4: 'task-nlb',
          TARGET_GROUP: 'task-tg',
          SG: 'task-sg',
          TRANSIT_GATEWAY: 'task-tgw'
        }[key]
      },
      setCount (key, length) {
        return `${key} (총 ${length}건)`
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.aws-task-tabs {
  &::v-deep {
    .foldable-title.-opened.-reverse {
      color:#fff;
      background:#070a20;
    }

    .foldable-article {
      padding:10px;
      border-top:1px solid transparent;
      background:transparent;
    }
  }
}

.view-count {
  display: inline-block;
  font-size: 12px;
  margin-left: $gap-s;
  width: 20px;
  height: 20px;
  text-align: center;
  line-height: 20px;
  color: $white;
  border-radius: 50%;
  background-color: $main-red;
}
</style>
