<template>
  <el-dialog
    :visible="active"
    :width="modalWidth"
    class="select-receiver"
    title="수신자 추가"
    @closed="tabRenderKey = Date.now()"
    @close="$emit('close')"
  >
    <div class="receiver">
      <g-tab
        :data="tabData"
        @click="onSelectTab"
        is-keep-alive
      >
        <template #group>
          <group-receiver
            :modal-active="active"
            :select-data="groupSelectData"
            @expose="onExposeData"
          />
        </template>
        <template #user>
          <user-receiver
            key="select-user-receiver"
            user-type="user"
            :modal-active="active"
            :init-select="userSelectData"
            @expose="onExposeData"
          />
        </template>
        <template #admin>
          <user-receiver
            key="select-admin-receiver"
            user-type="admin"
            :modal-active="active"
            :init-select="adminSelectData"
            @expose="onExposeData"
          />
        </template>
      </g-tab>
    </div>
    <section
      class="modal-button-area"
      style="margin-top: 40px;"
    >
      <button
        class="button"
        type="is-anti"
        @click="$emit('close')"
      >
        취소
      </button>
      <button
        v-if="!isTest"
        class="button"
        type="is-primary"
        @click="onSaveReceivers"
      >
        적용
      </button>
      <button
        v-else
        class="button"
        type="is-primary"
        @click="onClickTestSend"
      >
        발송
      </button>
    </section>
  </el-dialog>
</template>

<script>
/**
 * 그룹, 사용자, 관리자 탭별 선택한 수신 대상을 부모 컴포넌트에게 전달한다.
 * 조건에 따라 관리자 탭 1개만 존재하는 경우도 있다.
 */
import GroupReceiver from './GroupReceiver.vue'
import UserReceiver from './UserReceiver.vue'
import ReceiverBus from './ReceiverBus'

const defaultTabData = [
  { field: 'group', name: '역할 분류' },
  { field: 'user', name: '사용자' },
  { field: 'admin', name: '관리자' }
]

// 각 expose 되는 데이터의 규격을 맞춰 다시 모달을 여는 경우
// expose 된 데이터를 기준으로 모달이 기본 세팅값을 설정한다.

// 편집인 경우 API에서 받아온 데이터를 기준으로 expose 타입을 맞춰
// 설정해주는 것이 필요하다. 편집시 수신자 대상 선택 모달을 오픈할 때에
// 기존에 선택된 대상들을 체크된 상태로 노출시켜야 한다.

// UserRecevier 컴포넌트에서 expose 하는 데이터 타입은 아래와 같다.
// const expose = {
//   receiverType: 'user',
//   componentType,
//   groups: groups.map(convertGroup),
//   users: users.map(convertUser)
// }
// receiverType - 유저 대상이 어느 페이지에 포함되어있는 유저인지를 결정한다.
// componentType - 컴포넌트가 유저 타입인지, 그룹 타입인지를 결정한다.
// groups - 선택된 모든 그룹을 반환한다.
// users - 선택된 모든 유저를 반환한다.
export default {
  name: 'SelectReceiver',
  components: {
    GroupReceiver,
    UserReceiver
  },
  props: {
    /**
     * 테스트 발송 케이스 있음
     */
    isTest: {
      type: Boolean,
      default: false
    },
    active: {
      type: Boolean,
      default: false
    },
    selectData: {
      type: Object,
      default: () => null
    }
  },
  watch: {
    active: {
      handler (active) {
        if (active) {
          if (this.isTest) this.tabData.splice(0, 2)
          this.activeTab = this.tabData[0]
        } else {
          this.tabData = [...defaultTabData]
        }
      },
      immediate: true
    }
  },
  created () {
    this.activeTab = this.tabData[0]
  },
  computed: {
    modalWidth () {
      return this.activeTab && this.activeTab.field === 'group'
        ? '900px'
        : '80%'
    },
    groupSelectData () {
      return this.selectData ? this.selectData.group : null
    },
    userSelectData () {
      return this.selectData ? this.selectData.user : null
    },
    adminSelectData () {
      return this.selectData ? this.selectData.admin : null
    }
  },
  methods: {
    /**
     * 리시버에서 방출하는 데이터를 핸들링한다.
     */
    onExposeData (expose) {
      if (!expose) return

      if (expose.receiverType === 'group') this.exposeData.group = expose
      else if (expose.receiverType === 'user') { this.exposeData[expose.componentType] = expose }
    },
    onSelectTab (tab) {
      this.activeTab = tab
    },
    /**
     * 테스트 발송
     */
    onClickTestSend () {
      ReceiverBus.$emit('expose-data')

      this.$confirm('테스트 발송하시겠습니까?')
        .then(() => {
          this.$emit('expose-test', this.exposeData)
        })
        .catch(() => false)
    },
    /**
     * 수신자 저장
     */
    onSaveReceivers () {
      ReceiverBus.$emit('expose-data')

      this.$confirm('수신자를 적용하시겠습니까?')
        .then(() => {
          this.$emit('expose', this.exposeData)
          this.$emit('close')
        })
        .catch(() => false)
    }
  },
  data: () => ({
    tabData: [...defaultTabData],
    activeTab: null,
    tabRenderKey: Date.now(),
    exposeData: {
      group: null,
      user: null,
      admin: null
    }
  })
}
</script>

<style lang="scss" scoped>
.select-receiver {
  &::v-deep {
    .el-dialog {
      max-height: 85%;
      overflow-y: auto;
    }
  }
}
</style>
