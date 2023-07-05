<template>
  <div class="network">
    <div class="network-head">
      <h1>네트워크/보안그룹</h1>
    </div>
    <div
      v-if="!shared.isEdit"
      class="network-info"
    >
      <h1 class="required is-section">
        네트워크
      </h1>
      <div
        v-loading="isLoadingVpc"
        class="network-info-vpc"
      >
        <div class="network-info-vpc__title">
          <span>VPC</span>
          <el-tooltip
            popper-class="shade-popper"
            effect="light"
            placement="bottom-start"
            :visible-arrow="false"
          >
            <div slot="content">
              프로젝트 생성 시 설정한 VPC 망 종류에 따라<br>
              노출되는 VPC 망이 다를 수 있습니다.
            </div>
            <span>
              <i class="mdi mdi-information-outline" />
            </span>
          </el-tooltip>
        </div>
        <div class="network-info-vpc__values">
          <div
            v-for="vpc in vpcs"
            :key="vpc.name"
            class="vpc-item"
            :class="{ active: vpc.active }"
            @click="onActiveVpc(vpc)"
          >
            <i
              v-if="vpc.active"
              class="mdi mdi-check"
            />
            {{ vpc.envStr }}
          </div>
        </div>
      </div>
      <div class="network-info-subnet">
        <div class="network-info-subnet__title">
          서브넷
        </div>
        <div
          v-loading="isLoadingSubnet"
          class="network-info-subnet__values"
        >
          <custom-switch
            v-if="!isLoadingSubnet"
            ref="subnetSwitchRef"
            :subnet.sync="subnet"
            :labels="['내부', '외부']"
            class="custom-switch-parent"
          />
          <selectable-list
            class="subnet-selectable-list"
            v-if="filteredSubnets.length"
            :data="filteredSubnets"
            @selected="onSelectedSelectableItem"
          />
        </div>
      </div>
    </div>
    <div
      v-else
      class="network-info"
    >
      <h1 class="required is-section">
        네트워크
      </h1>
      <div class="network-info-edit">
        <div class="network-info-vpc">
          <div class="network-info-vpc__title">
            <span>VPC</span>
            <el-tooltip
              popper-class="shade-popper"
              effect="light"
              placement="bottom-start"
              :visible-arrow="false"
            >
              <div slot="content">
                프로젝트 생성 시 설정한 VPC 망 종류에 따라<br>
                노출되는 VPC 망이 다를 수 있습니다.
              </div>
              <span>
                <i class="mdi mdi-information-outline" />
              </span>
            </el-tooltip>
            <el-input
              :value="editVpcName"
              class="input"
              disabled
            />
          </div>
        </div>
        <div class="network-info-vpc__right">
          <span>서브넷</span>
          <el-input
            :value="editSubnetName"
            class="input"
            disabled
          />
        </div>
      </div>
    </div>
    <div class="network-security">
      <div class="network-security-head">
        <h1 class="required is-section">
          보안그룹
        </h1>
        <div class="network-security-head__filter">
          <el-input
            v-model="filterSecurityName"
            placeholder="보안그룹 이름 검색"
            class="only-bottom-border"
            @input="onSearchSecurityName"
          />
          <search-icon
            :width="18"
            :height="18"
            is-button
            @click="onSearchSecurity"
          />
          <refresh-icon
            :width="18"
            :height="18"
            is-button
            @click="onResetSecurityName"
          />
        </div>
      </div>
      <div class="network-security-list">
        <security-group-list
          ref="checkGroupList"
          :checked-items="checkedSecurity"
          :filter-name="debouncedFilterSecurityName"
          :selected-vpc="activeVpc"
          @checked-item="checkItem"
          @expand-item="expandItem"
          @change-tab-active="changeTabActive"
        />
      </div>
      <div
        v-if="shared.isEdit"
        class="network-security-checked"
      >
        <h1 style="margin-bottom: 20px;">
          선택 보안 그룹
        </h1>
        <security-group-list
          checked
          :checked-items="checkedSecurity"
          :selected-vpc="activeVpc"
          @uncheck-item="onUnCheckItem"
          @expand-item="expandItem"
          @change-tab-active="changeTabActive"
        />
      </div>
    </div>
    <section class="modal-button-area">
      <button
        class="button"
        type="is-anti"
        @click="movePrevStep"
      >
        이전
      </button>
      <button
        class="button"
        type="is-primary"
        @click="moveNextStep"
      >
        다음 단계
      </button>
    </section>
  </div>
</template>

<script>
import SearchIcon from '@/components/Icons/SearchIcon.vue'
import RefreshIcon from '@/components/Icons/RefreshIcon.vue'
import CustomSwitch from './CustomSwitch.vue'
import SecurityGroupList from './SecurityGroupList.vue'
import { debounce, cloneDeep, isEqual, pick } from 'lodash'
import SelectableList from '../Util/SelectableList.vue'
import { getSubnet, getVpc } from '@/components/Apis/AWS'
// import { mapGetters } from 'vuex'

export default {
  components: {
    CustomSwitch,
    SearchIcon,
    RefreshIcon,
    SecurityGroupList,
    SelectableList
  },
  name: 'AWSNetworkSecurity',
  inject: ['shared'],
  props: {
    steps: {
      type: Array,
      required: true
    },
    editSecurityGroup: {
      type: Array,
      default: () => []
    }
  },
  watch: {
    activeVpc: {
      deep: true,
      immediate: true,
      handler (vpc) {
        this.$emit('update:vpc', vpc)
        if (!this.shared.isEdit) this.checkedSecurity = []
        this.$emit('update:subnet-az', null)
        this.subnets.forEach(subnet => (subnet.selected = false))
      }
    },
    'shared.active': {
      immediate: true,
      handler (visible) {
        if (visible) {
          this.getVpc()
            .then(() => this.getSubnet())

          if (this.shared.isEdit) this.bindEditData()
        } else {
          this.checkedSecurity = []
          this.filterSecurityName = ''
          this.debouncedFilterSecurityName = ''
        }
      }
    },
    subnet: {
      immediate: true,
      handler (_public) {
        if (this.subnets && this.subnets.length) {
          this.subnets.forEach(subnet => (subnet.selected = false))
        }
        this.$emit('sync-subnet', _public)
      }
    },
    checkedSecurity: {
      deep: true,
      handler (security) {
        this.$emit('sync-security', security)
        if (this.shared.isEdit) this.checkChanges()
      }
    },
    selectedSubnet (subnet) {
      this.$emit('update:subnet-az', subnet)
    },
    vpcs (vpcs) {
      if (vpcs && vpcs.length && this.shared.isEdit) {
        const findVpc = this.vpcs.find(
          vpc =>
            vpc.environment ===
            (!this.shared.basketEdit
              ? this.shared.editData.environment
              : this.shared.basketData.orderData.environment)
        )
        if (findVpc) findVpc.active = true
      }
    }
  },
  computed: {
    // ...mapGetters({
    //   selectedProject: 'project/getSelectedProject'
    // }),
    selectedProject () {
      return {
        project: {
          projectIdx: this.shared.basketData.orderData.projectIdx
        }
      }
    },
    activeVpc () {
      return this.vpcs.find(vpc => vpc.active)
    },
    filteredSubnets () {
      if (!this.activeVpc) return []
      const filteredSubnet = this.subnet
        ? this.subnets.filter(subnet => !subnet.isPublic && this.activeVpc.vpcId === subnet.vpcId)
        : this.subnets.filter(subnet => subnet.isPublic && this.activeVpc.vpcId === subnet.vpcId)
      return filteredSubnet
    },
    selectedSubnet () {
      return this.subnets.find(subnet => subnet.selected)
    },
    // 수정시 노출할 VPC (운영, 개발, 스테이징 등)
    editVpcName () {
      if (!this.shared.isEdit) return ''
      return this.vpcEnvMap[this.shared.editData.orderData.vpcDto.environment]
    },
    // 수정시 노출할 서브넷 (내부 (가용 영역))
    editSubnetName () {
      if (!this.shared.isEdit) return ''
      const where = this.subnet ? '외부' : '내부'
      return `${where} (${this.shared.editData.orderData.subnetDto.availabilityZone})`
    }
  },
  created () {
    // if (this.shared.active) {
    //   this.getVpc()
    //   this.getSubnet()

    //   if (this.shared.isEdit) this.bindEditData()
    // }
  },
  methods: {
    /**
     * 보안그룹 변경사항을 체크한다.
     */
    checkChanges () {
      const convert = sg => {
        let inbound
        let outbound
        let groupName

        if (sg.securityGroupRuleDtoList) {
          inbound = sg.securityGroupRuleDtoList.filter(_sg => !_sg.isEgress)
            .length
          outbound = sg.securityGroupRuleDtoList.filter(_sg => _sg.isEgress)
            .length
          groupName = sg.groupName
        } else {
          inbound = sg.inboundRuleCount
          outbound = sg.outboundRuleCount
          groupName = sg.groupName
        }

        return [
          groupName,
          `(인바운드 규칙: ${inbound} | 아웃바운드 규칙: ${outbound})`
        ]
      }
      const pickOf = sg => {
        return pick(sg, [
          'groupId',
          'groupName'
        ])
      }

      const copyChecked = this.checkedSecurity.slice(0)
      const copyOrigin = this.editOriginSecurityGroup.slice(0)

      const sortOf = (a, b) => b.groupName > a.groupName ? -1 : 1

      copyChecked.sort(sortOf)
      copyOrigin.sort(sortOf)

      const checked = copyChecked.map(pickOf)
      const origin = copyOrigin.map(pickOf)

      if (isEqual(checked, origin)) {
        return this.$emit('network-change', [])
      }

      const beforeChanges = copyOrigin.map(convert)
      const afterChanges = copyChecked.map(convert)

      this.sgChanges = [
        {
          id: 'ec2-edit-network-security',
          title: '변경',
          type: 'change-network',
          items: [
            {
              title: '변경 전',
              changeValue: beforeChanges
            },
            {
              title: '변경 후',
              changeValue: afterChanges
            }
          ]
        }
      ]

      this.$emit('network-change', this.sgChanges)
    },
    bindEditData () {
      const transform = item => {
        this.$set(
          item,
          'inboundRules',
          item.securityGroupRuleDtoList.filter(r => !r.isEgress)
        )
        this.$set(
          item,
          'outboundRules',
          item.securityGroupRuleDtoList.filter(r => r.isEgress)
        )
        this.$set(item, 'inboundRuleCount', item.inboundRules.length)
        this.$set(item, 'outboundRuleCount', item.outboundRules.length)
        this.$set(item, 'expanded', false)
        this.$set(item, 'exist', true)
        this.$set(item, 'checked', true)
        this.$set(item, 'tabActivated', 0)
        return item
      }

      // 체크된 보안 그룹
      if (!this.shared.basketEdit) {
      //   this.checkedSecurity = cloneDeep(this.editSecurityGroup).map(transform)
        this.editOriginSecurityGroup = cloneDeep(this.shared.editData.orderData.securityGroupDtoList)
      }

      if (this.shared.basketEdit) {
        this.editOriginSecurityGroup = this.shared.basketData.orderData.beforeData.securityGroupList.map(
          transform
        )
      }

      this.$emit('origin-security-group', this.editOriginSecurityGroup)
    },
    /**
     * getVpc
     * 해당 프로젝트의 VPC를 조회한다.
     * environment - DEV, STG, PRD (개발, 스테이징, 상용)
     */
    async getVpc () {
      this.isLoadingVpc = true

      try {
        const { data } = await getVpc({
          pageSize: 100,
          pageNum: 1,
          projectIdx: this.selectedProject.project.projectIdx
        })
        this.vpcs = data.map(d => ({
          ...d,
          active: false,
          envStr: this.vpcEnvMap[d.environment]
        }))

        if (this.shared.basketEdit) {
          const vpc = this.vpcs.find(
            vpc =>
              vpc.environment ===
              this.shared.basketData.orderData.vpcDto.environment
          )

          if (vpc) vpc.active = true
        } else if (this.shared.isEdit) {
          const vpc = this.vpcs.find(
            vpc =>
              vpc.environment ===
              this.shared.editData.orderData.vpcDto.environment
          )

          if (vpc) vpc.active = true
        }
      } catch (error) {
        console.log('VPC 조회 에러', error)
      } finally {
        this.isLoadingVpc = false
      }
    },
    /**
     * getSubnet
     */
    async getSubnet () {
      this.isLoadingSubnet = true

      try {
        const { data } = await getSubnet({
          projectIdx: this.selectedProject.project.projectIdx,
          pageNum: 1,
          pageSize: 100
        })
        this.subnets = data.map(d => ({
          ...d,
          selected: false,
          disabled: false,
          content: d.availabilityZone
        }))

        this.subnets.sort((a, b) => b.availabilityZone > a.availabilityZone ? -1 : 1)

        if (this.shared.basketEdit) {
          const subnet = this.subnets.find(
            subnet =>
              subnet.subnetId ===
              this.shared.basketData.orderData.subnetDto.subnetId
          )

          if (subnet) {
            this.subnet = !subnet.isPublic
            // subnet.selected = true
            setTimeout(() => (subnet.selected = true), 0)
          }
        }
      } catch (error) {
        console.log('Subnet 조회 에러', error)
      } finally {
        this.isLoadingSubnet = false
      }
    },
    onSelectedSelectableItem (item, index) {
      // 비활성화된 경우
      if (item.disabled) return
      // 이미 선택된 상태에서 또 선택된 경우
      if (item.selected) {
        item.selected = false
        return
      }
      this.subnets.forEach(subnet => (subnet.selected = false))
      item.selected = !item.selected
    },
    onSearchSecurityName: debounce(function (value) {
      if (!this.filterSecurityName) {
        this.debouncedFilterSecurityName = ''
        return
      }
      this.debouncedFilterSecurityName = value
    }, 250),
    onChangeSubnet (bool) {
      this.subnet = bool
    },
    onActiveVpc (vpc) {
      if (vpc.active) {
        vpc.active = false
        return
      }
      this.vpcs.forEach(item => (item.active = false))
      vpc.active = true
    },
    onResetSecurityName () {
      this.filterSecurityName = ''
      this.debouncedFilterSecurityName = ''
    },
    onSearchSecurity () {},
    checkItem (item) {
      item.checked = !item.checked
      if (item.checked) {
        item.expanded = false
        this.checkedSecurity.push(cloneDeep(item))
        this.$refs.checkGroupList.expandItem(item)
      } else {
        this.checkedSecurity = this.checkedSecurity.filter(
          checked => checked.groupId !== item.groupId
        )
      }
    },
    onUnCheckItem (item) {
      this.checkedSecurity = this.checkedSecurity.filter(
        inner => inner.groupId !== item.groupId
      )
      const compItem = this.$refs.checkGroupList.items.find(
        compItem => compItem.groupId === item.groupId
      )
      compItem.checked = false
    },
    expandItem (item) {
      item.expanded = !item.expanded
    },
    changeTabActive (item, tabIndex) {
      if (item.tabActivated === tabIndex) return
      item.tabActivated = tabIndex
    },
    /**
     * 데이터 초기화
     */
    initData () {
      this.filterSecurityName = ''
      this.debouncedFilterSecurityName = ''
      if (!this.shared.isEdit) {
        this.subnet = true
        this.vpcs.forEach(vpc => (vpc.active = false))
        this.checkedSecurity = []
      } else {
        this.subnet = this.editData.isPublic

        const findVpc = this.vpcs.find(
          vpc => vpc.environment === this.shared.editData.environment
        )
        if (findVpc) findVpc.active = true
      }
    },
    /**
     * 이전 단계
     */
    movePrevStep () {
      if (!this.steps[2].visited) {
        this.$confirm(
          '인스턴스 기본정보 단계로<br>이동 하시겠습니까?<br><span style="font-size: 12px; color: #d95252;">* 이 단계의 수정내용이 초기화 될 수 있습니다.</span>',
          { dangerouslyUseHTMLString: true }
        )
          .then(() => {
            this.$emit('move-to-prev')
            if (this.shared.basketEdit) return
            this.initData()
            this.sgChanges = []
          })
          .catch(() => false)
      } else {
        this.$emit('move-to-prev')
      }
    },
    /**
     * 다음 단계
     */
    moveNextStep () {
      const vpc = this.vpcs.find(vpc => vpc.active)

      if (!this.shared.isEdit) {
        if (!vpc) {
          return this.$alert('VPC를 선택해주세요.')
        }

        if (!this.selectedSubnet) {
          return this.$alert('서브넷을 선택해주세요.')
        }
      }

      if (!this.checkedSecurity.length) {
        return this.$alert('보안그룹을 선택해주세요.')
      }

      this.$emit('move-to-next')
    }
  },
  data: () => ({
    sgChanges: [],
    subnet: true, // true일 경우 내부, false일 경우 외부
    vpcs: [
      // { name: '운영', value: 0, active: false },
      // { name: '개발', value: 1, active: false },
      // { name: '스테이징', value: 2, active: false }
    ],
    filterSecurityName: '',
    debouncedFilterSecurityName: '',
    networkGroups: [],
    checkedSecurity: [],
    isLoadingVpc: false, // VPC 로딩 상태
    isLoadingSubnet: false, // 서브넷 로딩 상태
    subnets: [],
    vpcEnvMap: {
      DEV: '개발',
      STG: '스테이징',
      PRD: '운영'
    },
    editOriginSecurityGroup: []
  })
}
</script>

<style lang="scss" scoped>
.subnet-selectable-list {
  &::v-deep {
    .selectable-item.selected {
      background:#fff;
    }
  }
}
.network {
  &-head {
    margin-bottom: $gap-m;
  }

  h1 {
    font-size: 18px;

    &.is-section {
      margin-bottom: $gap;
    }
  }

  h2 {
    font-size: 15px;
    margin-top: 12px;
  }

  h1,
  h2 {
    &.required {
      position: relative;

      &::after {
        position: absolute;
        content: "*";
        color: $main-blue;
        display: inline-block;
        top: -2px;
        margin-left: 5px;
      }
    }
  }

  &-info {
    &-vpc,
    &-subnet {
      display: flex;
      align-items: flex-start;
      flex-wrap: nowrap;
      margin-bottom: $gap;

      &__title {
        margin-right: $gap-m;

        .mdi {
          display: inline-block;
          margin-left: 5px;

          &::before {
            font-size: 16px;
            color: $primary;
          }
        }
      }
    }

    &-edit {
      display: flex;
      justify-content: space-between;
      overflow: hidden;

      .network-info-vpc {
        display: flex;
        align-items: center;

        &__title,
        &__right {
          white-space: nowrap;

          .input {
            margin-left: $gap-m;

            &::v-deep {
              .el-input__inner {
                width: 220px;
              }
            }
          }
        }
      }
    }

    &-vpc {
      &__values {
        .vpc-item {
          display: inline-block;
          margin-right: $gap-s;
          width: 90px;
          box-sizing: border-box;
          border-radius: 50px;
          border: 1px solid $input-placeholder;
          color: $input-placeholder;
          cursor: pointer;
          text-align: center;
          line-height: 32px;
          transition: all 300ms;
          will-change: box-shadow, border;

          &.active {
            border: none;
            box-shadow: 4px 4px 20px rgba(11, 1, 1, 0.1);
            color: $primary;
            background-color: $white;

            .mdi {
              font-size: 16px;
              display: inline-block;
            }
          }
        }
      }
    }

    &-subnet {
      align-items: flex-start;

      &__title {
        margin-top: $gap-s;
      }

      &__values {
        padding-left: $gap-s;
      }
    }
  }

  &-security {
    &-head {
      display: flex;
      flex-wrap: nowrap;
      align-items: center;
      justify-content: space-between;

      &__filter {
        display: inline-flex;
        align-items: center;

        > * + * {
          margin-left: $gap-s;
        }
      }

      .only-bottom-border {
        &::v-deep {
          .el-input__inner {
            border-top: none;
            border-left: none;
            border-right: none;
          }
        }
      }
    }

    &-list {
      padding-bottom: $gap;
      margin-bottom: 50px;
      border-bottom: 1px solid #3D435E;
    }
  }
}
</style>
