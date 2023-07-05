<template>
  <div
    v-loading="loadingSecurityGroup"
    v-if="checked ? checkedItemsByPage.length : pagingItemsByPage.length"
    class="security-list"
  >
    <div
      v-for="item in checked ? checkedItemsByPage : pagingItemsByPage"
      v-loading="item.loading"
      :key="item.groupId"
      class="security-list-item"
      :class="{
        checked,
        expanded: !checked && (item.expanded || item.checked),
        'item-checked': !checked && item.checked
      }"
    >
      <div class="left">
        <el-checkbox
          v-if="!checked"
          :value="item.checked"
          @input="checked => onCheckItem(checked, item)"
        />
        <i
          v-else
          class="mdi mdi-close"
          @click="$emit('uncheck-item', item)"
        />
        <span
          v-if="item.exist"
          class="exist"
        >
          기존
        </span>
        <span class="name">{{ item.groupName | splitName }}</span>
      </div>
      <div class="right">
        <span class="inbound">
          <span class="inbound-name">인바운드 규칙</span>
          <span class="inbound-count">{{ item.inboundRuleCount }}</span>
        </span>
        <span class="outbound">
          <span class="outbound-name">아웃바운드 규칙</span>
          <span class="outbound-count">{{ item.outboundRuleCount }}</span>
        </span>
        <i
          class="mdi"
          :class="item.expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
          @click="expandItem(item)"
        />
        <!-- @click="$emit('expand-item', item)" -->
      </div>
      <div
        v-show="item.expanded"
        class="expand"
      >
        <div class="expand-tab">
          <div
            v-for="(tabName, tabIndex) in expandedTabNames"
            :key="'tab' + tabIndex"
            :class="{ active: item.tabActivated === tabIndex }"
            class="expand-tab-item"
            @click="$emit('change-tab-active', item, tabIndex)"
          >
            {{ tabName }}
            <span
              v-if="tabIndex !== 2"
              class="expand-tab-item__count"
            >
              {{
                tabIndex === 0 ? item.inboundRuleCount : item.outboundRuleCount
              }}
            </span>
          </div>
        </div>
        <div class="expand-body">
          <template v-if="item.tabActivated !== 2">
            <el-table
              :data="
                item.tabActivated === 0 ? item.inboundRules : item.outboundRules
              "
              class="expand-body-table"
            >
              <el-table-column
                prop="ruleType"
                label="유형"
              />
              <el-table-column
                prop="protocol"
                label="프로토콜"
              >
                <template slot-scope="scope">
                  {{ getProtocol(scope.row.protocol) }}
                </template>
              </el-table-column>
              <el-table-column
                prop="port"
                label="포트"
              >
                <template slot-scope="scope">
                  {{ getPort(scope.row.fromPort, scope.row.toPort) }}
                </template>
              </el-table-column>
              <el-table-column
                prop="ipv4Ranges"
                label="소스"
                width="140"
              />
              <el-table-column
                prop="explain"
                label="설명"
              >
                <template slot-scope="scope">
                  <el-tooltip
                    effect="light"
                    popper-class="shade-popper"
                    :content="scope.row.ruleDescription || '-'"
                  >
                    <span class="explain">규칙 설명</span>
                  </el-tooltip>
                </template>
              </el-table-column>
            </el-table>
          </template>
          <!-- 인/아웃바운드 규칙 탭 -->
          <template v-else>
            {{ item.description }}
          </template>
        </div>
      </div>
    </div>
    <div
      v-if="isSetFilter ? filteredItem.length : vpcItems.length"
      class="pagination-wrap"
    >
      <el-pagination
        layout="prev, pager, next"
        :current-page="currPage"
        :total="isSetFilter ? filteredItem.length : vpcItems.length"
        :page-size="perPage"
        @current-change="onChangePage"
      />
    </div>
  </div>
  <div
    v-else
    class="empty-data"
  >
    {{ selectedVpc ? $t("common.PLACEHOLDER.noData") : "VPC를 선택해주세요." }}
  </div>
</template>

<script>
import {
  getSecurityGroups,
  getDetailSecurityGroup
} from '@/components/Apis/AWS'
import Fuse from 'fuse.js'
// import { mapGetters } from 'vuex'
// 2개의 타입, 단순 리스트, 체크된 리스트

export default {
  name: 'SecurityGroupList',
  inject: ['shared'],
  props: {
    checkedItems: {
      type: Array,
      default: () => []
    },
    filterName: {
      type: String,
      default: ''
    },
    checked: {
      type: Boolean,
      default: false
    },
    filterText: {
      type: String,
      default: ''
    },
    selectedVpc: {
      type: Object,
      default: null
    }
  },
  filters: {
    splitName (value) {
      if (value && value.length > 25) return value.slice(0, 25) + '...'
      return value
    }
  },
  watch: {
    filterName (name) {
      // this.getSecurityGroups()
      this.currPage = 1
    },
    'shared.active' (active) {
      if (active) {
        this.getSecurityGroups()
      }
    },
    selectedVpc (vpc) {
      if (!this.shared.isEdit) { this.items.forEach(item => (item.checked = false)) }
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
    vpcItems () {
      if (!this.selectedVpc) return []

      const items = this.items.filter(item => item.vpcId === this.selectedVpc.vpcId)

      items.sort((a, b) => b.groupName > a.groupName ? -1 : 1)
      items.sort((a, b) => {
        if (a.exist) return -1
        else if (b.exist) return 1
        else return 0
      })
      return items
    },
    isSetFilter () {
      return !!this.filterName
    },
    filteredItem () {
      const fuse = new Fuse(
        this.vpcItems.filter(item => item.vpcId === this.selectedVpc.vpcId),
        {
          threshold: 0.2,
          keys: ['groupName']
        }
      )

      const searchResult = fuse.search(this.filterName)
      return searchResult.map(v => v.item)
    },
    checkedItemsByPage () {
      return this.checkedItems
    },
    pagingItemsByPage () {
      if (!this.selectedVpc) return []

      const filterItems = this.vpcItems.filter(
        item => item.vpcId === this.selectedVpc.vpcId
      )

      const start = (this.currPage - 1) * this.perPage
      const end = start + this.perPage

      if (this.filterName) {
        return this.filteredItem.slice(start, end)
      }

      return filterItems.slice(start, end)
    },
    editCheckedData () {
      if (!this.shared.isEdit) return []
      return this.checkedItems.filter(item => item.exist)
    },
    pagingItems () {
      if (!this.shared.isEdit) return this.vpcItems
      const existIds = this.checkedItems
        .filter(item => item.exist)
        .map(item => item.groupId)
      const existGroups = this.vpcItems.filter(item =>
        existIds.includes(item.groupId)
      )
      const exposeItems = existGroups.concat(
        this.vpcItems.filter(item => !existIds.includes(item.groupId))
      )

      exposeItems.sort((a, b) => {
        if (a.exist) return -1
        else if (b.exist) return 1
        else return 0
      })

      const start = (this.currPage - 1) * this.perPage
      const end = start + this.perPage

      return exposeItems.slice(start, end)
    }
  },
  created () {
    console.log('123312321312', this.shared.isEdit)
    // 최초 한번 모달이 열릴 때 프로젝트의 모든 보안그룹을 조회한다.
    if (this.shared.active) {
      this.getSecurityGroups()
    }
  },
  methods: {
    /**
     * 보안그룹 리스트에서 아이템을 체크/체크해제할 때 이벤트
     * 체크한 아이템을 열린 상태로 유지하고
     * 체크해제한 아이템의 열린 상태를 닫힌 상태로 변경시킨다.
     * 선택된 보안 그룹 리스트에 노출시키기 위해
     * 체크/체크해제한 아이템을 부모 컴포넌트로 보낸다.
     */
    onCheckItem (checked, item) {
      console.log('#onCheckItem', item)
      if (checked) item.expanded = true
      else item.expanded = false
      this.$emit('checked-item', item)
    },
    getProtocol (protocol) {
      return protocol === '-1' ? '모두' : protocol.toUpperCase()
    },
    getPort (from, to) {
      if (from === to) {
        if (from === -1 && to === -1) return '0-65535'
        else return from
      } else {
        return `${from}-${to}`
      }
    },
    async expandItem (item) {
      if (!item.expanded) {
        if (item.securityDetail) {
          item.expanded = true
        } else {
          try {
            this.$set(item, 'loading', true)
            const group = await this.getDetailSecurityGroup(item)
            this.$set(item, 'securityDetail', group)
            this.$set(
              item,
              'inboundRules',
              item.securityDetail.securityGroupRuleDtoList.filter(
                r => !r.isEgress
              )
            )
            this.$set(
              item,
              'outboundRules',
              item.securityDetail.securityGroupRuleDtoList.filter(
                r => r.isEgress
              )
            )
            this.$set(item, 'expanded', true)
          } catch (error) {
            console.log(error)
          } finally {
            item.loading = false
          }
        }
      } else {
        item.expanded = false
      }
    },
    onChangePage (page) {
      this.currPage = page
      // this.getSecurityGroups()
    },
    /**
     * 보안그룹 상세 조회
     */
    async getDetailSecurityGroup (group) {
      const { data } = await getDetailSecurityGroup(group.groupId)
      return data
    },
    /**
     * 보안그룹 조회
     */
    async getSecurityGroups () {
      if (this.checked) return

      this.loadingSecurityGroup = true

      try {
        const { data } = await getSecurityGroups({
          projectIdx: this.selectedProject.project.projectIdx
        })
        /**
         * API에서 받아온 보안그룹 정보에서 인바운드/아웃바운드 규칙을 나누고
         * 갯수 파악, UI 상태값을 초기 값으로 정의하는 함수
         */
        const transform = item => {
          console.log('#transform', item)

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
          this.$set(item, 'inboundRuleCount', item.inboundRules.length) // 인바운드 규칙 갯수
          this.$set(item, 'outboundRuleCount', item.outboundRules.length) // 아웃바운드 규칙 갯수
          this.$set(item, 'expanded', false) // 펼침/닫힘 상태
          this.$set(item, 'exist', true) // 수정시 기존에 존재하였던 보안그룹인지
          this.$set(item, 'checked', true) // 체크여부
          this.$set(item, 'tabActivated', 0) // 보안그룹이 펼침 상태일 때 아래 인바운드/아웃바운드 규칙별 탭
          return item
        }
        console.log(transform)

        if (!this.shared.isEdit && this.shared.basketEdit) {
          // 장바구니에서 수정하는 경우 장바구니의 데이터를 변형시키고
          // 등록된 보안그룹을 모두 체크 표시한다.

          // .map((security) => transform(security.securityDetail))
          this.shared.basketData.orderData.securityGroupDtoList
            // .map(transform)
            .forEach(sg => {
              this.$parent.checkedSecurity.push(sg)
            })
        } else if (this.shared.isEdit) {
          // 자원을 변경 신청하는 경우 보안그룹 데이터를 변형시키고
          // 등록된 보안그룹을 모두 체크 표시한다.
          this.shared.editData.orderData.securityGroupDtoList
            // .map(transform)
            .forEach(sg => {
              this.$parent.checkedSecurity.push(sg)
            })
        }

        const allIdsChecked = this.checkedItems.map(item => item.groupId)
        this.items = data.map((group, index) => {
          let exist = false

          // 자원 변경 신청 건을 장바구니에서 수정하는 경우
          // 자원에 이미 붙어있는 보안그룹을 리스트에서 '기존'으로 노출
          if (this.shared.basketEdit && this.shared.isEdit) {
            exist = this.shared.basketData.orderData.beforeData.securityGroupList
              .map(r => r.groupId)
              .includes(group.groupId)
          }

          return {
            ...group,
            checked: allIdsChecked.includes(group.groupId),
            expanded: false,
            tabActivated: 0,
            exist
          }
        })

        if (this.shared.isEdit) {
          this.items.forEach(item => {
            const existIds = this.checkedItems
              .filter(item => item.exist)
              .map(item => item.groupId)
            if (existIds.includes(item.groupId)) {
              this.$set(item, 'exist', true)
              this.$set(item, 'checked', true)
            }
          })
        }
      } catch (error) {
        console.log(error)
        this.$alert('보안그룹 조회에 실패하였습니다.')
      } finally {
        this.loadingSecurityGroup = false
      }
    }
  },
  data: () => ({
    expandedTabNames: ['인바운드 규칙', '아웃바운드 규칙', '보안그룹 설명'],
    currPage: 1,
    perPage: 5,
    items: [],
    loadingSecurityGroup: false
  })
}
</script>

<style lang="scss" scoped>
.security-list {
  margin: $gap-s 0;

  &-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-sizing: border-box;
    padding: 20px;
    background-color: #232642;
    border-radius: 6px;
    flex-wrap: wrap;
    transition: background-color 350ms ease, box-shadow 350ms ease;
    margin-bottom: $gap-s;

    &.expanded {
      background-color: #232642;
      box-shadow: 6px 6px 20px rgba(11, 1, 1, 0.15);
    }

    &.checked {
      // background-color: $white;
      border: 1px solid #caced0;

      .name {
        color: $white;
      }
    }

    &.item-checked {
      .left {
        .name {
          color: $white;
        }
      }
    }

    .left,
    .right {
      > * + * {
        margin-left: $gap-s;
      }
    }

    .left {
      .name {
        font-size: 14px;
        font-weight: bold;
      }

      .exist {
        border-radius: 50px;
        padding: 3px;
        border: 1px solid $primary;
      }

      .mdi-close {
        font-size: 18px;
        vertical-align: middle;
        position: relative;
        top: -1px;
        cursor: pointer;
        display:inline;
      }
    }

    .right {
      .inbound,
      .outbound {
        &-name {
          color: $text-lighter-gray;
          margin-right: $gap-s;
        }

        &-count {
          font-size: 15px;
          font-weight: bold;
        }
      }

      .inbound {
        &::after {
          content: "";
          display: inline-block;
          width: 2px;
          height: 12px;
          position: relative;
          top: 1px;
          background-color: #727797;
          margin: 0 5px 0 15px;
        }
      }

      .mdi {
        display: inline-block;
        color: $white;
        position: relative;
        top: 1px;
        margin-left: $gap;
        cursor: pointer;
      }
    }

    .expand {
      width: 100%;
      margin-top: $gap;

      &-tab {
        width: 100%;
        display: flex;
        flex-wrap: wrap;
        position: relative;

        &::after {
          content: "";
          width: 100%;
          height: 1px;
          background-color: $input-placeholder;
          position: absolute;
          bottom: 0;
        }

        &-item {
          &.active {
            border: 1px solid $input-placeholder;
            border-bottom-color: #232642;
            background-color: #232642;
            color: $white;
            z-index: 1;

            .expand-tab-item__count {
              background-color: #0A0C20;
            }
          }

          background-color: #232642;
          border-bottom-color: transparent;
          border-top-left-radius: 5px;
          border-top-right-radius: 5px;
          color: #c8c8c8;
          cursor: pointer;
          padding: $gap-s;
          margin-right: 2px;

          &__count {
            background-color: #0A0C20;
            color: $white;
            border-radius: 50px;
            padding: 3px 7px;
            margin-left: 3px;
          }
        }
      }

      &-body {
        padding-top: $gap-s;

        &-table {
          &::before {
            background-color: $input-placeholder;
          }

          .explain {
            color: $blue;
            text-decoration: underline;
            cursor: pointer;
            display: inline-block;
          }

          &::v-deep {
            td, th {
              background-color: #232642;
              border-color: $input-placeholder;
            }

            tr:hover td {
              background: #0A0C20;
            }

            td {
              padding: 6px 0;
            }

            th {
              font-weight: normal;
            }

            tbody td {
              color: $white;
            }
          }
        }
      }
    }
  }
}
</style>
