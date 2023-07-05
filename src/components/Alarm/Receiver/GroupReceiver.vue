<template>
  <div
    v-loading="isLoadingRoleData"
    class="group-receiver"
  >
    <div class="group-receiver-wrapper">
      <dashboard-panel
        v-for="panel in panelIter"
        :key="panel.panelTitle"
        :title="panel.panelTitle"
        :padding-top="0"
      >
        <div
          class="group"
          v-for="group in panel.groupItems"
          :key="group.label"
        >
          <el-checkbox
            v-model="group.value"
            @change="val => onChangeCheck(val, group)"
            :indeterminate="getIndeterminate(group)"
          >
            {{ group.label }}
          </el-checkbox>
          <div
            class="group-children"
            v-if="group.children"
          >
            <el-checkbox
              v-for="child in group.children"
              :key="child.label"
              v-model="child.value"
              @change="val => onChangeCheck(val, child)"
            >
              {{ child.label }}
            </el-checkbox>
          </div>
        </div>
      </dashboard-panel>
    </div>

    <double-right-arrow class="director" />
    <dashboard-panel
      title="수신 대상"
      :padding-top="0"
    >
      <span />
      <div class="receivers">
        <clearable-tag
          v-for="receiver in groupReceivers"
          :key="receiver.uq"
          :content="getReceiverLabel(receiver)"
          :content-raw="receiver"
          :unique-key="receiver.uq || receiver[receiver.uqRef]"
          @clear-raw="(key, raw) => removeReceiver(raw)"
        />
      </div>
    </dashboard-panel>
  </div>
</template>

<script>
import API, { DashboardPanel, ClearableTag } from '@sd-fe/cmp-core'
import DoubleRightArrow from './DoubleRightArrow.vue'
import ReceiverBus from './ReceiverBus'

// Expose Type
// receiverType: 'group'
// checked: []

export default {
  name: 'GroupReceiver',
  components: {
    ClearableTag,
    DashboardPanel,
    DoubleRightArrow
  },
  props: {
    /**
     * 부모 컴포넌트의 모달 상태
     */
    modalActive: {
      type: Boolean,
      required: true
    },
    selectData: {
      type: Object,
      default: () => null
    }
  },
  watch: {
    modalActive: {
      immediate: true,
      handler (visible) {
        if (visible) {
          if (this.roleList.length && this.selectData && this.selectData.checked) {
            this.autoCheck()
          }
        } else {
          this.groupReceivers = []
          this.unActiveAllItems()
        }
        // if (visible) this.getRoles()
        // else {
        //   this.groupReceivers = []
        // }
      }
    }
  },
  computed: {
    panelIter () {
      return [
        {
          panelTitle: '관리자',
          groupItems: this.groupItems.filter(
            group => group.isAdmin
          )
        },
        {
          panelTitle: '사용자',
          groupItems: this.groupItems.filter(
            group => !group.isAdmin
          )
        }
      ]
    }
  },
  created () {
    this.getRoles()
    ReceiverBus.$on('expose-data', this.getCheckedItems)
  },
  methods: {
    autoCheck () {
      if (this.selectData) {
        let checked = []
        // if (this.selectData.checked.find(c => c.uq === 'OPERATIONS_OFFICER')) {
        //   checked = this.selectData.checked.filter(c => !c.hasParent)
        // } else {
        //   checked = this.selectData.checked
        // }
        checked = this.selectData.checked
        checked.forEach(item => this.onChangeCheck(true, item))
        this.syncCheckState()
      }
    },
    /**
     * 관리자-사용자 그룹핑별 라벨 반환
     */
    getReceiverLabel (receiver) {
      return receiver.isAdmin || receiver.parentUq
        ? `관리자-${receiver.label}`
        : `사용자-${receiver.label}`
    },
    /**
     * 현재 체크되어 있는 아이템 항목과
     * UI에 노출되는 체크박스의 상태를 동기화한다.
     */
    syncCheckState () {
      this.groupReceivers.forEach(receiver => {
        // 그룹 객체 찾고
        const fGroup = this.findGroup(receiver)
        // 찾으면, 체크 상태를 활성화
        if (fGroup) fGroup.value = true
        if (fGroup.children && fGroup.children.length) {
          fGroup.children.forEach(group => (group.value = true))
        }
      })
    },
    /**
     * 체크된 아이템을 가공해서 반환한다.
     */
    getCheckedItems () {
      const expose = {
        receiverType: 'group',
        checked: this.groupReceivers
      }

      this.$emit('expose', expose)
    },
    /**
     * 수신 대상에 추가된 아이템을 그룹 목록에서 찾는다.
     */
    findGroup (receiver) {
      const target = receiver.hasParent
        ? this.groupItems.find(group => group.children && group.uq === receiver.parentUq)
        : this.groupItems.find(group => group.uq === receiver.uq)

      if (target) {
        return receiver.hasParent
          ? target.children.find(child => child[receiver.uqRef] === receiver[receiver.uqRef])
          : target
      }
    },
    /**
     * 수신 대상 목록에 추가한다.
     */
    addReceiver (group) {
      const compareKey = group.hasParent ? group.uqRef : 'uq'
      if (!this.groupReceivers.find(receiver => receiver[compareKey] === group[compareKey])) { this.groupReceivers.push(group) }
    },
    /**
     * 수신 대상 목록에서 제거한다.
     */
    removeReceiver (group, noCheck = false) {
      if (group.hasParent) {
        this.groupReceivers = this.groupReceivers.filter(receiver => receiver[group.uqRef] !== group[group.uqRef])
      } else this.groupReceivers = this.groupReceivers.filter(receiver => receiver.uq !== group.uq)

      if (noCheck) return

      const fGroup = this.findGroup(group)
      if (fGroup) {
        fGroup.value = false
        if (fGroup.children && fGroup.children.length) {
          fGroup.children.forEach(child => this.removeReceiver(child))
        } else if (fGroup.hasParent) {
          const parent = this.groupItems.find(group => group.uq === fGroup.parentUq)
          if (parent && parent.children.every(child => !child.value)) {
            this.removeReceiver(parent, true)
            parent.value = false
          }
        }
      }
    },
    getIndeterminate (group) {
      if (!group.children || !group.children.length) return false
      return group.children.some(child => child.value) && !group.children.every(child => child.value)
    },
    /**
     * 그룹 체크 이벤트
     * 그룹이 체크되면 수신 목록에 집어넣고 체크 해제되면 수신 목록에서 삭제한다.
     * 체크한 항목이 "운영 담당자" 부모 항목인 경우 모든 하위 항목을 수신 목록에 추가한다.
     * 운영 담당자 체크 해제시 모든 역할을 수신 목록에서 삭제한다.
     * 체크한 항목이 "운영 담당자 하위 역할" 항목인 경우 선택한 역할만 수신 목록에 추가한다.
     * 이 때, 모든 역할이 체크된 경우 "운영 담당자" 부모 항목을 수신 목록에 추가한다.
     */
    onChangeCheck (val, group) {
      if (group.hasParent) {
        // 부모의 모든 하위 항목이 체크되어 있는지 확인한다.
        const appendTarget = this.groupItems.find(
          fGroup => fGroup.uq === group.parentUq
        )
        if (!appendTarget || !appendTarget.children.length) return

        appendTarget.value = appendTarget.children.every(child => child.value)
        if (appendTarget.value) {
          // 부모의 하위 항목이 전부 체크되었을 경우
          // 부모 항목도 체크된 영역으로 추가한다.
          this.addReceiver(appendTarget)
        }

        if (!val && !appendTarget.value) {
          // 부모의 하위 항목이 전부 체크되어있지 않은 경우
          // 부모 항목을 제거한다.
          // 하위 항목을 검사하지 않는 옵션으로 제거한다.
          this.removeReceiver(appendTarget, true)
        }
      } else {
        if (group.children && group.children.length) {
          group.children.forEach(child => {
            child.value = val
            this.onChangeCheck(val, child)
          })
        }
      }

      if (val) this.addReceiver(group)
      else this.removeReceiver(group)
    },
    /**
     * 모든 그룹 아이템의 항목을 체크 해제한다.
     */
    unActiveAllItems () {
      const unactive = item =>
        item.children ? item.children.forEach(unactive) : (item.value = false)
      this.groupItems.forEach(group => unactive(group))
    },
    /**
     * 역할을 조회해서 운영 담당자 하위 항목에 매핑한다.
     */
    async getRoles () {
      this.isLoadingRoleData = true

      try {
        const uqKey = 'OPERATIONS_OFFICER'
        const appendTarget = this.groupItems.find(group => group.uq === uqKey)
        const res = await API.iam.getRoleList({ upperRoleIdxList: 0 })
        if (appendTarget) {
          appendTarget.children = res.map(role => ({
            label: role.roleName,
            roleIdx: role.roleIdx,
            roleName: role.roleName,
            hasParent: true,
            uqRef: 'roleIdx',
            parentUq: 'OPERATIONS_OFFICER'
          }))
        }
        this.roleList = res
        this.autoCheck()
      } catch (error) {
        console.log(error)
        this.$alert(this.$v('역할 조회에 실패하였습니다.'))
      } finally {
        this.isLoadingRoleData = false
      }

      // if (appendTarget && appendTarget.children) {
      //   appendTarget.children = [
      //     {
      //       label: '서버 1',
      //       value: false,
      //       roleIdx: 155,
      //       hasParent: true,
      //       parentUq: 'OPERATIONS_OFFICER',
      //       uqRef: 'roleIdx'
      //     },
      //     {
      //       label: '서버 2',
      //       value: false,
      //       roleIdx: 156,
      //       hasParent: true,
      //       parentUq: 'OPERATIONS_OFFICER',
      //       uqRef: 'roleIdx'
      //     }
      //   ]
      // }
    }
  },
  data: () => ({
    isLoadingRoleData: false,
    // adminGroupItems: [
    //   { label: '모든 관리자', uq: 'allAdmin', value: false },
    //   { label: '최고 관리자', uq: 'CHIEF_MANAGER', value: false },
    //   {
    //     label: '운영 관리자',
    //     value: false,
    //     uq: 'OPERATIONS_OFFICER',
    //     children: [
    //       /** API에서 채워야할 데이터 (역할 리스트) */
    //     ]
    //   }
    // ],
    // userGroupItems: [
    //   { label: '모든 사용자', value: false, uq: 'allUser' },
    //   { label: '중간 관리자', uq: 'MIDDLE_MANAGER', value: false },
    //   {
    //     label: '빌링 관리자',
    //     uq: 'BILLING_MANAGER',
    //     value: false
    //   }
    // ],
    /** uq: 식별자 */
    groupItems: [
      ...[
        { label: '모든 사용자', value: false, uq: 'allUser' },
        { label: '중간 관리자', uq: 'MIDDLE_MANAGER', value: false, userPermLevel: 2 },
        {
          label: '빌링 관리자',
          uq: 'BILLING_MANAGER',
          userPermLevel: 3,
          value: false
        }
      ].map(item => ({ ...item, isAdmin: false })),
      ...[
        { label: '모든 관리자', uq: 'allAdmin', value: false },
        { label: '최고 관리자', uq: 'CHIEF_MANAGER', value: false, userPermLevel: 0 },
        {
          label: '운영 관리자',
          value: false,
          uq: 'OPERATIONS_OFFICER',
          userPermLevel: 1,
          children: [
            /** API에서 채워야할 데이터 (역할 리스트) */
          ]
        }
      ].map(item => ({ ...item, isAdmin: true }))
      // { label: '모든 사용자', value: false, uq: 'allUser' },
      // {
      //   label: '운영 담당자(역할)',
      //   value: false,
      //   uq: 'OPERATIONS_OFFICER',
      //   children: [
      //     /** API에서 채워야할 데이터 (역할 리스트) */
      //   ]
      // },
      // // { label: '운영 관리자', uq: 'OPERATIONS_MANAGER', value: false },
      // { label: '최고 관리자', uq: 'CHIEF_MANAGER', value: false },
      // // { label: 'Admin 모든 개인', uq: 'allAdmin', value: false },
      // { label: '중간 관리자', uq: 'MIDDLE_MANAGER', value: false },
      // {
      //   label: '빌링 관리자',
      //   uq: 'BILLING_MANAGER',
      //   value: false
      // }
    ],
    groupReceivers: [],
    roleList: []
  })
}
</script>

<style lang="scss" scoped>
.group-receiver {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: center;

  &-wrapper {
    > * {
      min-height: 250px;
      max-height: 250px;
      /* overflow-y: auto; */
    }
  }

  > *:not(.double-arrow) {
    flex: 1 1 50%;
    min-height: 500px;
    max-height: 500px;

    &::v-deep .panel-body {
      border-radius: $radius;
      border: 1px solid $purple-gray;
      padding: $gap !important;
      overflow-y: auto;
    }
  }

  .director {
    margin: 0 20px;
  }

  .group + .group {
    margin-top: $gap-s;
  }

  &::v-deep {
    .el-checkbox {
      &__label {
        font-size: unset;
      }

      &__input.is-indeterminate.is-checked .el-checkbox__inner {
        background-color: transparent;
        border-color: $border-color;

        &::before {
          background-color: white;
        }
      }

      &__input.is-indeterminate + .el-checkbox__label {
        color: #e1e1e1;
      }
    }
  }

  .group {
    &-children {
      padding-left: $gap-m;
      margin-top: 15px;

      &::v-deep {
        .el-checkbox {
          padding-right: $gap-s;
        }
      }

      > * + * {
        margin-bottom: 5px;
      }
    }
  }

  .receivers {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
  }
}
</style>
