<template>
  <section class="additional-dropdown">
    <article>
      <button
        v-if="!readOnly"
        class="button set-selected-group"
        @click="setAdditionalTeam"
      >
        {{ $t('common.BTN.addDepartment') }}
      </button>

      <div
        class="selected-group-lists"
        v-if="additionalGroups.length"
      >
        <p
          v-for="(g, index) in additionalGroups"
          :key="index"
          class="selected-tags"
        >
          <span
            v-if="g.manageType !== undefined"
            class="-tag"
          >{{ g.manageType === 0 ? $v('정') :$v('부') }}</span>
          {{ g.group }} <i /> {{ g.groupName }}
        </p>
      </div>
    </article>

    <!-- 모달 -->
    <el-dialog
      title="추가부서 설정"
      :visible="showModal"
      width="880px"
      @close="cancel"
    >
      <section class="team-lists-wrapper">
        <div class="team-lists-wrappers">
          <article>
            <drop-down-temp
              :visible="showModal"
              :group-tree="groupTree"
              class="group-dropdown"
              @selected-group="selectedGroup"
            />
            <!-- /. 관계사 설정 -->

            <div
              class="team-list-scroller"
              :style="teamData.length < 6 ? 'padding-right: 5px' : ''"
              v-if="teamData.length"
              v-loading="loading"
            >
              <transition-team-tree
                :visible="showModal"
                :data="teamData"
                :group="group"
                @selectedGroups="selectedGroups"
                :default-selected="tempGroups"
                :included-group-info="includedGroupInfo"
              />
            </div>
            <!-- /. 조직 설정 스크롤 -->

            <span
              v-else
              class="team-list-scroller empty-data"
            >
              <!-- 데이터가 없습니다 -->
              {{ $t('common.PLACEHOLDER.noData') }}
            </span>
          </article>
          <!-- /. 관계사/조직 선택 -->

          <span class="arrow">
            <i /><i />
          </span>

          <article>
            <div
              class="overflow-wrapper"
              v-if="tempGroups.length"
            >
              <span
                v-for="(item, idx) in tempGroups"
                :key="`${item.groupIdx}_${idx}`"
                :class="['-tags', { 'manage-type' : item.manageType !== undefined }]"
                closable
              >
                <span>
                  {{ item.group }} <i class="arr" /> {{ item.groupName }}
                  <i
                    v-if="item.manageType === undefined"
                    class="mdi mdi-close"
                    @click="deleteAdditionalGroups(idx)"
                  />
                </span>
              </span>
            </div>

            <span
              v-else
              class="-empty"
            >{{ $t('common.PLACEHOLDER.noData') }}</span>
          </article>
          <!-- /. 선택된 조직 리스트 -->
        </div>

        <div class="modal-button-area">
          <button
            class="button"
            @click="cancel"
          >
            취소
          </button>
          <button
            class="button"
            type="is-primary"
            @click="apply"
          >
            등록
          </button>
        </div>
      </section>
    </el-dialog>
  </section>
</template>

<script>
import DropdownTemp from './Dropdown.vue'
import TransitionTeamTree from './TransitionTeamTree.vue'

export default {
  name: 'AdditionalTeam',
  components: {
    'transition-team-tree': TransitionTeamTree,
    'drop-down-temp': DropdownTemp
  },
  props: {
    groupTree: { // 관계사 Tree
      type: Array,
      default: () => []
    },
    readOnly: {
      type: Boolean,
      default: false
    },
    defaultData: {
      type: Array,
      default: () => []
    },
    includedGroupInfo: {
      type: Object,
      default: () => {}
    }
  },
  mounted () {
    if (this.defaultData.length) {
      this.tempGroups = [...this.defaultData]
      this.additionalGroups = [...this.tempGroups]
    }

    this.$emit('selected-groups', this.additionalGroups)
  },
  methods: {
    setAdditionalTeam () {
      // 조직이 선택된 경우에만 추가부서를 설정할 수 있습니다.
      // (추가부서 선택할 때 선택한 조직과 중복선택 불가능 하도록 하기 위해서)
      if (this.includedGroupInfo.group) {
        this.showModal = true
      } else {
        this.$alert('조직을 먼저 선택해주세요.')
      }
    },
    toggleTeam (idx) {
      this.teamData.forEach((t, i) => {
        if (idx === i) t._open = !t._open
        else t._open = false
      })
      this.$forceUpdate()
    },
    /**
     * 관계사 설정시 하단 조직 (children) 설정
     */
    selectedGroup (team) {
      this.loading = true
      this.group = team.groupName
      this.teamData = JSON.parse(JSON.stringify(team.children))
      this.loading = false
    },
    selectedGroups (groups) {
      this.tempGroups = groups
    },
    deleteAdditionalGroups (idx) {
      this.tempGroups.splice(idx, 1)
    },
    apply () {
      this.showModal = false
      this.additionalGroups = [...this.tempGroups]
      this.$emit('selected-groups', this.additionalGroups)
    },
    cancel () {
      this.showModal = false
      this.tempGroups = [...this.additionalGroups]
      // this.$emit('selected-groups', this.additionalGroups)
    },
    resetItems () {
      this.tempGroups = []
      this.additionalGroups = []
      this.$emit('selected-groups', this.additionalGroups)
    }
  },
  data: () => ({
    loading: false,
    showModal: false,
    teamData: [],
    tempGroups: [],
    additionalGroups: []
  })
}
</script>

<style lang="scss" scoped>
.set-selected-group {
  margin-bottom: $gap-s;
}
.selected-group-lists {

  .selected-tags {
    display: flex;
    align-items: center;
    font-size: 13px;
    line-height: 2;

    .-tag {
      padding: 0 7px;
      display: block;
      font-size: 12px;
      line-height: 20px;
      height: 18px;
      border-radius: 25px;
      background: rgba(118, 129, 255, 0.2);
      border: 1px solid #7681FF;
      color: #7681FF;
      margin-right: 5px;
    }

    i {
      display: block;
      margin: 0 7px 0 5px;
      width: 5px; height: 5px;
      border-bottom: 1px solid $input-placeholder;
      border-right: 1px solid $input-placeholder;
      transform: rotate(-45deg);
    }
  }
}

.team-lists-wrapper {
  height: 490px;

  .team-lists-wrappers {
    height: calc(100% - 60px);
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-sizing: border-box;

    > article {
      flex: 0 0 370px;
      height: 100%;
      box-sizing: border-box;

      &:last-child {
        flex: 0 0 390px;
        border: 1px solid $purple-gray;
        border-radius: 6px;
        padding-right: $gap-s;
        .overflow-wrapper {
          padding: $gap $gap-s $gap-s $gap;
          overflow-y: auto;
          height: calc(100% - 30px);
        }

        .-empty {
          height: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          color: $input-placeholder
        }
      }
    }

    .group-dropdown {
      margin-right: 5px;
    }

    .team-list-scroller {
      height: calc(100% - 70px);
      margin-top: $gap-s;
      overflow-y: auto;

      .team-item {
        margin-bottom: $gap-s;
        .-name {
          cursor: pointer;
          line-height: 50px;
          border: 1px solid $purple-gray;
          box-sizing: border-box;
          border-radius: 6px;
          padding: 0 $gap;
          margin-right: $gap-s;
          display: flex;
          align-items: center;

          .-collapse-button {
            display: block;
            width: 20px; height: 20px;
            border: 1px solid #727793;
            border-radius: $radius-s;
            margin-right: $gap-s;
            position: relative;

            &::before,
            &::after {
              content: '';
              position: absolute;
              background-color: #727793;
              width: 12px; height: 1px;
              top: 9.5px; left: 4px;
              transition: transform .5s ease;
            }
            &::before { transform: rotate(90deg) }

            &.-open {
              &::before { transform: rotate(0) }
            }
          }
        }

        .child-team {
          border: 1px solid pink;
          overflow: hidden;
        }
      }
    }

    > .arrow {
      width: 20px;
      height: 20px;
      display: flex;

      i {
        position: relative;
        display: block;
        width: 50%;

        &::before,
        &::after {
          content: '';
          position: absolute;
          display: block;
          height: 14px;
          width: 3px;
          border-radius: 25px;
          background: white;
          left: 3px;
        }

        &::before {
          transform: rotate(-40deg);
          top: -2px;
        }
        &::after {
          transform: rotate(40deg);
          bottom: -2px;
        }
      }
    }

    .-tags {
      background-color: $main-gray;
      line-height: $gap-m;
      padding: 0 10px 0 15px;
      border-radius: 25px;
      margin-bottom: $gap-s;
      margin-right: $gap-s;
      display: inline-block;

      &.manage-type {
        padding: 0 15px;
      }

      > span {
        display: flex;
        align-items: center;
        color: $light-gray;

        .arr {
          position: relative;
          margin: 7px;
          width: 10px; height: 10px;
          &::before,
          &::after {
            content: '';
            position: absolute;
            top: 3px; left: 3px;
            display: block;
            width: 4px; height: 4px;
            border-top: 1px solid $input-placeholder;
            border-left: 1px solid $input-placeholder;
            transform: rotate(135deg);
          }
        }

        .mdi-close {
          margin-left: 5px;
          width: 20px;
          text-align: center;
          cursor: pointer;
          color: $white;
          &::before {
            font-size: 15px;
            width: 100%;
          }
        }
      }

    }
  }

  .modal-button-area {
    > button { width: 80px; }
  }
}
</style>
