<template>
  <section class="security">
    <h2>
      보안그룹
    </h2>
    <div
      v-if="securityGroupData && securityGroupData.length"
      class="security-form"
    >
      <h3>보안그룹</h3>
      <div class="security-form-list">
        <div
          v-for="item in securityGroupData"
          :key="item.groupId"
          class="group"
          :class="{ selected: item.activated }"
        >
          <el-tooltip
            v-if="item.groupName.length > 11"
            placement="left"
            effect="light"
            popper-class="shade-popper"
          >
            <span @click="onClickSecurityGroup(item)">{{
              item.groupName | splitStr
            }}</span>
            <div slot="content">
              {{ item.groupName }}
            </div>
          </el-tooltip>
          <!-- 툴팁 12자 이상 -->
          <span
            v-else
            @click="onClickSecurityGroup(item)"
          >
            {{ item.groupName }}
          </span>
        </div>
      </div>
      <div class="security-form-tab">
        <div
          v-if="selectedSecurityGroup"
          class="expand-tab"
        >
          <div
            v-for="(tabName, tabIndex) in expandedTabNames"
            :key="'tab' + tabIndex"
            :class="{
              active: selectedSecurityGroup.tabActivated === tabIndex
            }"
            class="expand-tab-item"
            @click="changeTabActive(tabIndex)"
          >
            {{ tabName }}
            <span
              v-if="tabIndex !== 2"
              class="expand-tab-item__count"
            >
              {{
                tabIndex === 0
                  ? selectedSecurityGroup.inboundRules.length
                  : selectedSecurityGroup.outboundRules.length
              }}
            </span>
          </div>
          <div class="expand-body">
            <template v-if="selectedSecurityGroup.tabActivated !== 2">
              <el-table
                :data="
                  selectedSecurityGroup.tabActivated === 0
                    ? selectedSecurityGroup.inboundRules
                    : selectedSecurityGroup.outboundRules
                "
                class="expand-body-table"
              >
                <el-table-column
                  prop="type"
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
            </template>
            <!-- 인/아웃바운드 규칙 탭 -->
            <template v-else>
              {{ selectedSecurityGroup.description }}
            </template>
            <!-- 보안그룹 설명 -->
          </div>
        </div>
      </div>
    </div>
    <div
      v-else
      class="security-form empty"
    >
      {{ $t('common.PLACEHOLDER.noData') }}
    </div>
  </section>
</template>

<script>
export default {
  name: 'SecurityGroup',
  props: {
    securityGroupData: {
      type: Array,
      default: () => []
    },
    selectedSecurityGroup: {
      type: Object,
      required: false,
      default: null
    }
  },
  filters: {
    splitStr (str) {
      return str.length > 11 ? str.slice(0, 11) + '...' : str
    }
  },
  methods: {
    changeTabActive (tabIndex) {
      const copy = { ...this.selectedSecurityGroup, tabActivated: tabIndex }
      this.$emit('update:selected-security-group', copy)
    },
    onClickSecurityGroup (group) {
      this.$emit(
        'update:security-group-data',
        this.securityGroupData.map(data => ({
          ...data,
          activated: data.groupId === group.groupId
        }))
      )
      this.$emit('update:selected-security-group', {
        ...group,
        activated: true
      })
    }
  },
  data: () => ({
    expandedTabNames: ['인바운드 규칙', '아웃바운드 규칙', '보안그룹 설명']
  })
}
</script>

<style lang="scss" scoped>
.security {
  h2 {
    font-size: 16px;
    margin: 40px 0 15px 0;
  }

  &-form {
    width: 100%;
    box-sizing: border-box;
    padding: 20px 30px;
    border: 1px solid #caced0;
    border-radius: 6px;
    display: flex;
    flex-wrap: wrap;

    h3 {
      margin-bottom: 15px;
      width: 100%;
    }

    &.empty {
      min-height: 400px;
      display: flex;
      justify-content: center;
      align-items: center;
      color: $input-placeholder;
    }

    &-list {
      width: 230px;
      height: 316px;
      overflow-y: auto;
      box-sizing: border-box;
      padding: 10px 25px;
      background-color: #fafafa;
      margin-right: 30px;

      > * + * {
        margin-top: 15px;
      }

      .group {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        color: #666666;
        cursor: pointer;

        &:hover,
        &.selected {
          color: #222;
          font-weight: bold;
        }
      }
    }

    &-tab {
      height: 316px;
      width: 100%;
      flex: 1;
      overflow: hidden;

      .expand-tab {
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
          top: 37px;
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

      .expand-body {
        padding-top: $gap-s;
        width: 100%;
        height: 270px;
        overflow-y: auto;

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
  }
}
</style>
