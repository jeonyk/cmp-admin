<template>
  <div class="conf-change-dist-model">
    <vertical-table
      :data="ownerCompanyInfo"
      :columns="ownerCompanyColumns"
      table-type="input"
      class="-owner-comp"
      no-border
      label-align="stretch"
      :use-border-top="false"
    >
      <template #distModelName>
        <el-input
          v-model="ownerCompanyInfo.distName"
          :placeholder="$v('배부모델명')"
        />
      </template>
      <!-- 배부모델명 -->

      <template #distName>
        <el-input
          v-model="ownerCompanyInfo.distStandardName"
          :placeholder="$v('배부기준명')"
        />
      </template>
      <!-- 배부기준명 -->

      <template #distCompany_1>
        <button
          class="button select-btn"
          type="is-primary"
          @click="activeSelectAffModal = true"
        >
          {{ $v('관계사 선택') }}
        </button>
        <ul class="company-list">
          <li
            v-for="(owner, idx) in defaultDistModel_1"
            class="company-item"
            :key="`ownerCompany_${idx}`"
          >
            <el-input
              class="company-item-name"
              v-model="owner.groupName"
              disabled
            />
            <el-input-number
              v-model="owner.amount"
              :min="1"
              class="company-item-dist"
            />
            <a
              v-if="owner.groupIdx !== 0"
              class="-icon -delete-icon"
              @click="e => {
                deleteItem(testModel_1, owner, 'MODEL_1')
              }"
            />
            <!-- deleteRelatedCommon(owner.groupIdx) -->
          </li>
        </ul>
      </template>
      <!-- 1차 배부 관계사 -->

      <template #distCompany_2>
        <button
          class="button select-btn"
          type="is-primary"
          @click="activeSelectAffTwoDepModal = true"
          :disabled="!testModel_1.length"
        >
          {{ $v('관계사 선택') }}
        </button>
        <!-- v-for="(common, idx) in ownerCompanyInfo.distCompany_2" -->
        <section
          class="common-company-wrap fix-form"
          v-for="(common, idx) in test_2"
          :key="`common_${idx}`"
        >
          <div class="common-name-wrap">
            <span class="common-name">{{ common.commonAffName + `(${$v('배부기준')} : ` +(common.distributeStandardName || `${$v('고정 값')}`)+ ")" }}</span>
            <a
              class="-delete-icon"
              @click="deleteItem(ownerCompanyInfo.distCompany_2, common, 'MODEL_2')"
            />
          </div>
          <ul
            class="company-list"
          >
            <li
              class="company-item"
              :key="`commonCompany_${index}`"
              v-for="(itm, index) in common.selected"
            >
              <el-input
                class="company-item-name"
                v-model="itm.groupName"
                disabled
              />
              <el-input-number
                v-model="itm.amount"
                :min="1"
                class="company-item-dist"
              />
            </li>
          </ul>
        </section>
      </template>

      <div class="button-area">
        <button
          class="button"
          @click="clickCancel"
        >
          {{ $v('취소') }}
        </button>
        <button
          class="button"
          type="is-primary"
          @click="updateDistModel"
        >
          {{ $v('완료') }}
        </button>
      </div>
      <!-- 2차 배부 관계사 -->
    </vertical-table>

    <!-- <select-aff-modal
      :active.sync="activeSelectAffModal"
      :active-project="activeProject"
      :selected-aff="selectedOneDepthAff"
      :aff-list="affList"
      @accept="acceptAffModal"
      @close="activeSelectAffModal = false"
    /> -->

    <select-tag-modal
      :active.sync="activeSelectAffModal"
      :selected-aff="testModel_1"
      @save="acceptAffModal"
      @close="cancelSave"
    />
    <select-aff-two-dep-modal
      :active.sync="activeSelectAffTwoDepModal"
      :one-depth-aff="groupForTwoAff"
      :two-depth-aff-names="distTwoNames"
      @accept="acceptTwoDepthModal"
      @close="activeSelectAffTwoDepModal = false"
    />
    <!-- <select-aff-two-dep-modal
      :active.sync="activeSelectAffTwoDepModal"
      :one-depth-aff="testModel_1"
      @accept="acceptTwoDepthModal"
      @close="activeSelectAffTwoDepModal = false"
    /> -->
  </div>
</template>

<script>
import { cloneDeep, groupBy } from 'lodash'
import SelectTagModal from '@/components/Billing/Distribute/SelectTagModal.vue'
// import SelectAffModal from '@/components/Billing/Distribute/SelectAffModal.vue'
import SelectAffTwoDepModal from '@/components/Billing/Distribute/SelectAffTwoDepModal.vue'

export default {
  name: 'ConfChangeDistModel',
  components: {
    SelectTagModal,
    // SelectAffModal,
    SelectAffTwoDepModal
  },
  props: {
    data: {
      type: Object,
      default: () => {}
    }
  },
  computed: {
    defaultDistModel_1 () {
      return this.testModel_1 || []
    },
    unselectedDistModel () {
      // const result = this.testModel_1.filter(g => !g.isSelected).map(g => { return g.groupName })
      const result = this.testModel_1.map(g => { return g.groupName })
      return result
    },
    distOneNames () {
      return this.testModel_1.map(g => g.groupName)
    },
    distTwoNames () {
      const result = this.test_2.map(g => { return g.commonAffName })
      return result
    },
    groupForTwoAff () {
      return this.testModel_1.filter(g => g.groupIdx !== 0)
    }
  },
  watch: {
    data: {
      deep: true,
      immediate: true,
      handler (newVal, oldVal) {
        this.activeProject = newVal
        this.ownerCompanyInfo.distName = newVal.name // 배부모델명 맵핑
        this.ownerCompanyInfo.distStandardName = newVal.distributeStandardName
        this.fetchData(newVal.distributeGroups, newVal.distributeStandardName)
        this.clonedData = cloneDeep(newVal)
      }
    }
  },
  mounted () {
    // this.activeProject = this.data
    // this.ownerCompanyInfo.distName = this.data.name // 배부모델명 맵핑
    // this.ownerCompanyInfo.distStandardName = this.data.distributeStandardName
    // this.fetchData(this.data.distributeGroups, this.data.distributeStandardName)
    // this.clonedData = cloneDeep(this.data)
  },
  methods: {
    cancelSave () {
      // this.testModel_1 = []
      // setTimeout(() => {
      //   this.testModel_1 = this.fetchDistModel_1(this.clonedData.distributeGroups)
      //   this.test_2 = this.fetchDistModel_2(this.clonedData.distributeGroups)
      // }, 0)
      this.activeSelectAffModal = false
    },
    acceptAffModal (selected) {
      this.testModel_1 = []
      setTimeout(() => {
        this.testModel_1 = selected

        // 매칭 안 되는 2차 제거
        // this.test_2 = this.test_2.filter(prop => {
        //   // const isMatched = prop.selected.some(company => company.groupName === group.groupName)
        //   // 2차 제거 기준 2차에 포함된 관계사의 이름이 1차에 없으면 삭제
        //   const isMatched = prop.selected.some(company => !this.unselectedDistModel.includes(company.groupName))
        //   return !isMatched
        // })

        // 2차 제거 프로세스 제거기준 필터 true, false
        // 객체 하위 배열이
        this.test_2 = this.test_2.filter(prop => {
          //  prop.selected = prop.selected.filter(c => c.groupName !== group.groupName)
          prop.selected = prop.selected.filter(c => this.unselectedDistModel.includes(c.groupName))
          if (prop.selected.length === 0) return false
          return true
        })

        // 매칭 안 되는 1차 제거
        const twoNames = this.getDistNames(this.test_2)
        this.testModel_1 = this.testModel_1.filter(g => {
          if (g.groupIdx === 0 && !twoNames.includes(g.groupName)) {
            return false
          }
          return true
        })

        this.activeSelectAffModal = false
      }, 0)
    },
    update (newVal) {
      // this.testModel_1 = newVal
    },
    fetchData (groups, name) {
      this.testModel_1 = this.fetchDistModel_1(groups)
      this.test_2 = this.fetchDistModel_2(groups)
      // this.setInitCommonData(groups, name)
    },
    setInitCommonData (groups, name) {
      const distGroups = groups
      // 배부기준명
      this.ownerCompanyInfo.distName = name

      // 소유관계사
      // this.ownerCompanyInfo.ownerCompany = distGroups
      this.testModel_1 = distGroups

      // 공통관계사
      const isParentGroupNameData = distGroups.filter(group => group.parentGroupName)
      const commonDist = groupBy(isParentGroupNameData, 'parentGroupName')
      const box = []
      for (const key in commonDist) {
        box.push({
          name: key,
          children: [...commonDist[key]]
        })
      }
      this.test_2 = box
    },
    getStandardName (name = 'NO DATA') {
      return name
    },
    fetchDistModel_2 (data = [], key = 'parentGroupName') {
      // const distGroups = data
      const result = []
      const isParentGroupNameData = data.filter(group => group.parentGroupName)
      const standardIncludedGroups = data.filter(group => group.distributeStandardName) // 이놈의 그룹내임과 같으면 distributeStandardName
      const commonDist = groupBy(isParentGroupNameData, 'parentGroupName')
      for (const key in commonDist) {
        console.log(data)
        const standardFound = standardIncludedGroups?.find(group => group.groupName === key)?.distributeStandardName // 2차 기준명을 맵핑합니다
        console.log(standardFound)
        result.push({
          commonAffName: key,
          selected: [...commonDist[key]],
          distributeStandardName: standardFound || ''
        })
      }
      return result
    },
    /**
     * 배부 모델 매핑 (1차 배부 기준)
     */
    fetchDistModel_1 (data = []) {
      data = data.map(d => ({
        ...d
      }))
      // 2차가 아닌 것
      const noCommonGroup = data?.filter(
        group => !group.parentGroupName // 예정 from Mr.lee KH
        // group => group.groupIdx !== 0 // 기존
        // group => !group.parentGroupName && group.groupIdx !== 0
        // group => group.groupIdx !== 0 && group.isSelected
      )
      // if (!noCommonGroup) return
      const isCommonGroupNames = [
        ...new Set(
          data
            .filter(group => group.parentGroupName)
            .map(group => group.parentGroupName)
        )
      ]
      const isCommonGroup = []

      isCommonGroupNames.forEach(groupName => {
        const filteredGroups = data.filter(
          group => group.parentGroupName === groupName
        )
        const obj = { ...filteredGroups[0] }
        const amountSum = filteredGroups
          .map(group => group.amount)
          .reduce((a, b) => a + b, 0)

        obj.amount = amountSum
        obj.groupName = filteredGroups[0].parentGroupName
        obj.groupIdx = 0
        isCommonGroup.push(obj)
      })
      let allGroups = []
        .concat(noCommonGroup, isCommonGroup)
        .map(g => ({ ...g, groupName: g.groupName }))

      const result = allGroups = allGroups.filter(
        (arr, index, self) => index === self.findIndex(t => t.groupName === arr.groupName)
      )

      return result
    },
    /**
     * 퍼센트 구하기
     */
    getPercent (unit, total) {
      const percent = (unit / total) * 100
      return Number.isNaN(percent)
        ? null
        : percent.toString().indexOf('.') === -1
          ? percent
          : percent.toFixed(2)
    },
    clickCancel () {
      this.$emit('close')
    },
    updateDistModel () {
      const commonGroups = []
      const commonGroupsIdx = []
      this.test_2.forEach(group => {
        group.selected.forEach(item => {
          commonGroups.push({
            amount: item.amount,
            groupIdx: item.groupIdx,
            groupName: item.groupName,
            parentGroupName: group.commonAffName,
            distributeStandardName: item.distributeStandardName
          })
          commonGroupsIdx.push(item.groupIdx)
        })
      })

      // const ownerGroups = this.defaultDistModel_1.filter(group => !commonGroupsIdx.includes(group.groupIdx))
      const ownerGroups = this.testModel_1
      // const ownerGroups = this.testModel_1.filter(group => !commonGroupsIdx.includes(group.groupIdx))

      const combinedGroups = ownerGroups.concat(commonGroups)
      const param = {
        // name: this.ownerCompanyInfo.distName, // 후에 빌링쪽에서 [관리자] 사용자 받을 예정
        distributeStandardName: this.ownerCompanyInfo.distStandardName,
        distributeGroups: this.createDistributeGroups(combinedGroups),
        name: this.ownerCompanyInfo.distName,
        id: this.activeProject.id
      }
      this.$emit('update', param)
    },
    createDistributeGroups (groups) {
      const result = groups.map(item => {
        if (item.groupIdx === 0) {
          delete item.parentGroupName
        }
        // if (item.groupIdx !== 0) {
        //   delete item.distributeStandardName
        // }

        return {
          amount: item.amount,
          groupIdx: item.groupIdx,
          groupName: item.groupName,
          parentGroupName: item.parentGroupName || undefined,
          distributeStandardName: item.distributeStandardName || undefined
        }
      })

      // *******  임시 필수 대입값임
      // result.map(r => {
      //   if (r.groupIdx === 0) {
      //     r.distributeStandardName = 'testName'
      //   }
      // })
      return result
    },
    /**
     * 2차 배부 관계사 선택
     * @param {array} selected 선택한 관계사
     * @param {string} commonAffName 배부모델명
     * @param {string} distName 배부기준명
     */
    acceptTwoDepthModal (selected, commonAffName, distName) {
      const settedDistData = selected.map(item => {
        return {
          ...item,
          groupName: item.companyName,
          amount: 1
        }
      })
      this.test_2.push({
        distributeStandardName: distName,
        commonAffName: commonAffName,
        selected: settedDistData
      })

      this.testModel_1.push({
        groupIdx: 0,
        amount: 1,
        groupName: commonAffName,
        distributeStandardName: distName,
        companyName: commonAffName
      })
      this.activeSelectAffTwoDepModal = false
    },
    deleteItem (all, group, type) {
      if (type === 'MODEL_1') {
        this.testModel_1 = this.testModel_1.filter(test => test.groupName !== group.groupName)

        // 1차 제거 시 1차 목록을 포함하고 있으면 2차삭제
        // this.test_2 = this.test_2.filter(prop => {
        //   const isMatched = prop.selected.some(company => !this.distOneNames.includes(company.groupName))
        //   return !isMatched
        // })

        // 1차 제거 시 1차 목록을 포함하고 있으면 2차 안에 있는 1차 목록 삭제
        this.test_2 = this.test_2.filter(prop => {
          prop.selected = prop.selected.filter(c => c.groupName !== group.groupName)
          if (prop.selected.length === 0) return false
          return true
        })

        // 매칭 안 되는 1차 제거
        const twoNames = this.getDistNames(this.test_2) // 공통관계사명 추출
        this.testModel_1 = this.testModel_1.filter(g => {
          if (g.groupIdx === 0 && !twoNames.includes(g.groupName)) {
            return false
          }
          return true
        })
      }
      if (type === 'MODEL_2') {
        this.test_2 = this.test_2.filter(company => company.commonAffName !== group.commonAffName)
        this.testModel_1 = this.testModel_1.filter(company => company.groupName !== group.commonAffName)
      }
    },
    getDistNames (twoList = []) {
      const result = []
      twoList.forEach(group => result.push(group.commonAffName))

      return result
    }
  },
  data () {
    return {
      test_2: [],
      testModel_1: [],
      activeProject: null,
      selectedTwoDepthAff: [],
      activeSelectAffModal: false,
      activeSelectAffTwoDepModal: false,

      // 소유 관계사 및 배부 모델
      ownerCompanyInfo: {
        distName: '',
        distStandardName: '',
        name: '',
        distCompany_1: [], // 1차 배부관계사
        distCompany_2: [ // 2차 배부관계사
          // { name: '', children: [] }
        ],
        edit: true
      },
      ownerCompanyColumns: [
        { binding: 'distModelName', header: this.$v('배부모델명'), customHtml: true, required: true },
        { binding: 'distName', header: this.$v('배부기준명'), customHtml: true, required: true },
        { binding: 'distCompany_1', header: this.$v('1차 배부 관계사'), customHtml: true, required: true },
        { binding: 'distCompany_2', header: this.$v('2차 배부 관계사'), subTitle: '(1차 배부 관계사 중 선택 가능)', customHtml: true }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
.company-list {
  margin-top: 10px;
  .company-item {
    display: flex;
    align-items: center;
    gap: 10px;
    & + .company-item {
      margin-top: 10px;
    }
    &-name {
      width:300px;
      // width: 300px;
    }
    &-dist {
      width: 170px;
    }

  }
}

.fix-form {
  margin-right: $gap-s;
  width: 500px;
}

.common-company-wrap { // 2차 배부 모델
  &:first-of-type { margin-top: 15px; }
  & + .common-company-wrap { margin-top: 30px; }
  .common-name-wrap {
    display: flex;
    justify-content: space-between;
    margin-bottom: $gap-s;
    padding-bottom: $gap-s;
    border-bottom: 1px solid $border-color;
  }
}

.button-area {
  display:flex;
  justify-content:center;
  margin-top:20px;
  padding-top:30px;
  border-top:1px solid #3D435E;
}
</style>

<style lang="scss">
.conf-change-dist-model {
  overflow-y:scroll;
  height:80vh;
  .vertical-table.-owner-comp { margin-top: 20px; }
  .table-contents-wrap { display: block; }
  >.vertical-table-row {
    border: none;
    .contents-title {
      padding-top: 7px;
      align-items: flex-start;
      width: 100px;
    }
    .contents {
      padding: 7px 0;
    }
  }
}
</style>
