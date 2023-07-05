<template>
  <div class="consingment">
    <main
      class="flex-wrap"
      style="justify-content: space-between"
    >
      <section>
        <h2>
          {{ $v("수탁사 정보") }}
          <span class="small-title">{{ $v('수탁사 조직을 선택하세요.') }}</span>
        </h2>
        <g-tree-test
          v-loading="isLoading"
          :title="$v('조직정보 - 수탁사')"
          view-line
          :data="treeData"
          use-checkbox
          unique-key="groupIdx"
          :select-object="selectedSenderGroup ? selectedSenderGroup : {}"
          ref="receiverTree"
          @check="
            (e) => {
              this.clickCheckbox(e, 'leftList');
            }
          "
          :height="600"
          :placeholder="$v('관계사 또는 조직명을 입력해주세요.')"
          style="margin-right: 30px; width:380px;"
        />
      </section>
      <section>
        <h2>
          {{ $v("위탁사 정보") }}
          <span class="small-title">{{ $v('위탁사 조직을 선택하세요.') }}</span>
        </h2>
        <g-tree-test
          v-loading="isLoading"
          :title="$v('조직정보 - 위탁사')"
          view-line
          :data="treeData"
          use-checkbox
          unique-key="groupIdx"
          :select-object="selectedSenderGroup ? selectedSenderGroup : {}"
          ref="senderTree"
          @check="
            (e) => {
              this.clickCheckbox(e, 'rightList');
            }
          "
          :height="600"
          :placeholder="$v('관계사 또는 조직명을 입력해주세요.')"
          style="width:380px;"
        />
      </section>
      <section style="width: 107px;">
        <div>
          <div
            @click="register"
            class="arrow-button"
          >
            <div
              class="position-center square"
            >
              반영
            </div>
            <div
              class="position-center triangle"
            />
          </div>
        </div>
      </section>
      <section class="dashboard dashboard--right">
        <h2>{{ $v("위탁 • 수탁 관계 정보") }}</h2>
        <div
          v-loading="isConsignmentLoading"
          class="dashboard__contents dashboard__contents--border"
        >
          <div>
            <div style="padding:10px;">
              <el-input
                class="search-input"
                v-model="searchText"
                :placeholder="$v('관계사 또는 조직명을 입력해주세요.')"
                style="width:95%;"
              />
              <i
                class="el-icon-search el-input__icon"
                slot="suffix"
              />
            </div>
            <div
              v-if="cTagList && cTagList.length"
              class="wrapper wrapper--tag"
            >
              <bi-tag
                v-for="(data, idx) in cTagList"
                :key="idx"
                :data="data"
                @click="removeTag(data)"
                :index="idx + 1"
              />
            </div>
            <div
              v-else
              class="empty-data"
            >
              {{ $v("데이터가 없습니다.") }}
            </div>
          </div>
        </div>
      </section>
    </main>
    <footer class="buttons-footer">
      <button
        class="button"
        type="is-primary"
        @click="addContracts"
      >
        {{ $v("저장") }}
      </button>
    </footer>
  </div>
</template>

<script>
import API, { GTreeCustom } from '@sd-fe/cmp-core'
import BiTag from '@/components/Tag/BiTag'
import { mapState } from 'vuex'
export default {
  components: {
    BiTag,
    'g-tree-test': GTreeCustom
  },
  wacth: { },
  computed: {
    ...mapState({
      user: state => state.auth.user
    }),
    cTagList () {
      return this.addedList.length > 0 && this.addedList?.filter(x => {
        const array = [(x.receiverCompanyName || x.receiverGroupName), x.receiverGroupName, (x.senderCompanyName || x.senderGroupName), (x.senderGroupName)]
        return array.some(x => x.includes(this.searchText))
      })
    }
  },
  async mounted () {
    await this.getConsignments() // 위수탁 데이터 리스트 호춣
    this.treeData = await this.getGroupTrees()
    // this.treeData = []
  },
  methods: {
    async getConsignments () {
      try {
        this.isConsignmentLoading = true
        const conList = await API.iam.getConsignments()
        this.addedList = conList
      } catch (error) {
        console.log(error)
      } finally {
        this.isConsignmentLoading = false
      }
    },
    clickCheckbox (item, list) {
      if (item.isChecked) {
        this[list].push(item)
      } else {
        this[list] = this[list].filter((x) => x.groupIdx !== item.groupIdx)
      }

      console.log(this[list])
    },
    register () {
      const left = this.leftList?.length
      const right = this.rightList?.length
      if (!left > 0 || !right > 0) {
        this.$alert('위/수탁 조직을 1개 이상 선택해주세요.')
      } else {
        const result = []
        for (let i = 0; i < left; i++) {
          for (let j = 0; j < right; j++) {
            result.push({
              isNew: true,
              consignmentIdx: Math.random().toFixed(2) * 10000,
              receiverGroupIdx: this.leftList[i].groupIdx,
              receiverGroupName: this.leftList[i].groupName,
              receiverCompanyName: this.leftList[i].rootName,
              senderGroupIdx: this.rightList[j].groupIdx,
              senderGroupName: this.rightList[j].groupName,
              senderCompanyName: this.rightList[j].rootName
            })
          }
        }

        // this.addedList = this.addedList.concat(result)
        this.addedList = result.concat(this.addedList) // 새로운 반영건 먼저 노출
        this.removeDuplicateObject('addedList')

        this.leftList = []
        this.rightList = []
        const _ = undefined
        this.$alert(
          '완전히 등록하기 위해서 위탁조직 등록 버튼을 눌러주세요.'
        ).then(async () => {
          await this.$refs.receiverTree.checkAllNodes(_, false)
          await this.$refs.senderTree.checkAllNodes(_, false)
        })
      }
    },
    removeDuplicateObject (list) {
      this[list] = this[list].filter(
        (item, index, self) =>
          index ===
          self.findIndex(
            (t) =>
              t.senderGroupIdx === item.senderGroupIdx &&
              t.receiverGroupIdx === item.receiverGroupIdx
          )
      )
    },
    async getGroupTrees () {
      try {
        this.isLoading = true
        const res = await API.iam.getGroupManageTree()
        return res
      } catch (error) {
        console.log(error)
      } finally {
        this.isLoading = false
      }
    },
    async addContracts () {
      const newSelectedList = []
      this.addedList.forEach((x, idx) => {
        newSelectedList.push({
          order: idx + 1,
          senderIdx: x.senderGroupIdx,
          receiverIdx: x.receiverGroupIdx
        })
      })

      try {
        await API.iam.createConsingmentContracts(newSelectedList)
        this.$alert('성공적으로 등록했습니다.')
        this.addedList = []
        await this.getConsignments()
      } catch (error) {
        // {"code":"IAM1401","message":"A trustee cannot have the same organization as a consignee."}
        // {"code":"IAM424","message":"The consignment organization and the consignment organization have the same affiliates. Please check again."}
        const {
          response: {
            data: { code }
          }
        } = error
        if (code === 'IAM424') return this.$alert(this.$v('수탁사는 위탁사와 조직이 같을 수 없습니다.'))
        if (code === 'IAM1401') return this.$alert(this.$v('수탁사는 위탁사와 조직이 같을 수 없습니다.'))
        else this.$alert('위/수탁 등록을 실패했습니다.')
      }
    },
    removeTag (data) {
      const { consignmentIdx } = data
      this.addedList = this.addedList.filter(
        (data) => data.consignmentIdx !== consignmentIdx
      )

      // 반영 후 체크 리스트 해제 필요
    }
  },
  data () {
    return {
      searchText: '',
      leftList: [],
      rightList: [],
      selectedSenderGroup: {},
      selectedReceiverGroup: {},
      addedList: [],
      isLoading: false,
      isConsignmentLoading: false,
      treeData: []
    }
  }
}
</script>

<style lang="scss" scoped>
$margin: 15px;

.dashboard {
  &::v-deep {
    .el-input__icon {
      color:#fff !important;
    }
    .el-input__inner {
      border:none;
      border-bottom: 1px solid #3d435e;
      color: #999999;
      &:focus {
        color: #999999;
        background:transparent;
        border-bottom: 1px solid #3d435e;
      }
    }
  }
  &--right {
    width: 703px;
    box-sizing: border-box;
  }

  &__contents {
    overflow-y: auto;
    height: 600px;
    border-radius: 6px;
    &--border {
      border: 1px solid #3d435e;
    }
  }
}

.wrapper--tag {
  display: flex;
  flex-wrap: wrap;
  padding: 15px;
  gap: 15px;
}

h2 {
  font-size: 16px;
  margin-bottom: 10px;
  text-indent: 10px;
}

.small-title {
  display:inline;
  margin-left:5px;
  font-size:12px;
  font-weight:400;
  color:#999999;
}

.arrow-button {
  position:relative;
  height:42px;
  overflow: hidden;
  width:90px;
  &:hover {
    .square, .triangle {
      background-color: #344cba;
    }
  }

  .position-center {
    position:absolute;
    top: 50%;
    left:50%;
    transform: translate(-50%, -50%);
  }
  .square {
    width:50px;
    height:42px;
    line-height: 42px;
    text-indent: 15px;
    background: #3E57C9;
    z-index:1;
  }
  .triangle {
    background: #3E57C9;
    width: 34px;
    height: 34px;
    top: 50%;
    left: 55%;
    transform: translateY(-50%) rotate(45deg);
  }
}

.buttons-footer {
  margin-top:70px;
  display:flex;
  justify-content: center;
  gap:10px;
}
</style>
