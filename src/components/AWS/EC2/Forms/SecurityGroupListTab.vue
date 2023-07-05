<template>
  <div class="expand">
    <div class="expand-tab">
      <div
        v-for="(tabName, tabIndex) in expandedTabNames"
        :key="'tab' + tabIndex"
        :class="{ active: copyItem.tabActivated === tabIndex }"
        class="expand-tab-item"
        @click="changeTabActive(tabIndex)"
      >
        {{ tabName }}
        <span
          v-if="tabIndex !== 2"
          class="expand-tab-item__count"
        >
          {{ tabIndex === 0 ? inboundRuleCount : outboundRuleCount }}
        </span>
      </div>
    </div>

    <div class="expand-body">
      <template v-if="copyItem.tabActivated !== 2">
        <el-table
          :data="filterWith(copyItem.tabActivated)"
          class="expand-body-table"
        >
          <el-table-column
            prop="ruleType"
            label="유형"
          />
          <el-table-column
            prop="protocol"
            label="프로토콜"
          />
          <el-table-column label="포트">
            <template slot-scope="scope">
              {{ scope.row.fromPort }}-{{ scope.row.toPort }}
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
                v-if="scope.row.ruleDescription"
                effect="light"
                popper-class="shade-popper"
                placement="bottom"
              >
                <span class="explain">규칙 설명</span>
                <div slot="content">
                  {{ scope.row.ruleDescription }}
                </div>
              </el-tooltip>
              <span
                v-else
                class="explain"
              >
                규칙 설명
              </span>
            </template>
          </el-table-column>
        </el-table>
        <!-- /. 인바운드 규칙 -->

        <div class="pagination-wrap">
          <el-pagination
            layout="prev, pager, next"
            :current-page="filterOption[copyItem.tabActivated].currPage"
            :total="
              copyItem.tabActivated === 0 ? inboundRuleCount : outboundRuleCount
            "
            :page-size="perPage"
            @current-change="onChangePage"
          />
        </div>
      </template>
      <!-- 인/아웃바운드 규칙 탭 -->

      <template v-else>
        {{ copyItem.description }}
      </template>
      <!-- /. 보안그룹 설명 탭 -->
    </div>
  </div>
</template>

<script>
import { cloneDeep } from 'lodash'

export default {
  name: 'SecurityGroupListTab',
  props: {
    item: {
      // 단일 아이템
      type: Object,
      required: true
    }
  },
  computed: {
    inboundRuleCount () {
      return this.copyItem.inboundRuleCount
    },
    outboundRuleCount () {
      return this.copyItem.outboundRuleCount
    }
  },
  watch: {
    item () {
      this.copyItem = cloneDeep(this.item)
      this.$set(this.copyItem, 'tabActivated', 0)
    }
  },
  created () {
    this.copyItem = cloneDeep(this.item)
    this.$set(this.copyItem, 'tabActivated', 0)
  },
  methods: {
    changeTabActive (tabIndex) {
      if (this.copyItem.tabActivated === tabIndex) return
      this.copyItem.tabActivated = tabIndex
    },
    onChangePage (page) {
      this.filterOption[this.copyItem.tabActivated].currPage = page
    },
    /**
     * 탭 보안그룹 인바운드/아웃바운드 페이징
     */
    filterWith (tab) {
      const start = (this.filterOption[tab].currPage - 1) * 5
      const end = start + this.perPage

      // 로드되지 않은경우
      if (!this.copyItem.inboundRules || !this.copyItem.outboundRules) return []

      return tab === 0
        ? this.copyItem.inboundRules.slice(start, end)
        : this.copyItem.outboundRules.slice(start, end)
    }
  },
  data: () => ({
    expandedTabNames: ['인바운드 규칙', '아웃바운드 규칙', '보안그룹 설명'],
    perPage: 5,
    copyItem: null,
    filterOption: [
      {
        currPage: 1
      },
      {
        currPage: 1
      }
    ]
  })
}
</script>

<style lang="scss" scoped>
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
      background-color: $text-dark-gray;
      position: absolute;
      bottom: 0;
    }

    &-item {
      &.active {
        border: 1px solid $text-dark-gray;
        border-bottom-color: $white;
        background-color: $white;
        color: $text-dark-gray;
        z-index: 1;

        .expand-tab-item__count {
          background-color: #333;
        }
      }

      background-color: #f3f3f3;
      border-bottom-color: transparent;
      border-top-left-radius: 5px;
      border-top-right-radius: 5px;
      color: #c8c8c8;
      cursor: pointer;
      padding: $gap-s;
      margin-right: 2px;

      &__count {
        background-color: #999;
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
      .explain {
        color: $blue;
        text-decoration: underline;
        cursor: pointer;
        display: inline-block;
      }

      &::v-deep {
        td {
          padding: 6px 0;
        }

        th {
          font-weight: normal;
        }
      }
    }
  }
}
</style>
