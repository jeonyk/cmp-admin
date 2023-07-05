<template>
  <div class="task-common-project">
    <h2 class="conference-section-title">
      <span>{{ $t('common.TERMS.orderInfo') }}</span>
    </h2>
    <vertical-table
      v-if="tabs"
      :columns="[
        { binding: 'distributeStandardName', header: '배부모델명' },
        { binding: 'distributeGroups', header: '배부관계사' },
      ]"
      type="horizontal"
    >
      <!-- :data="tabs" -->
      <template #distributeStandardName>
        {{ distModelName }}
      </template>
      <template #distributeGroups>
        <span
          v-for="(g, index) in distCompanyNames"
          :key="g.groupName"
        >
          {{ g.groupName }}{{ index !== distCompanyNames.length-1 ? ', ' : '' }}
        </span>
      </template>
    </vertical-table>

    <distribute-tabs
      style="margin-top: 70px"
      v-if="projectData"
      :detail-model="projectData"
      use-memo
    >
      <!-- :tabs="tabs" -->
      <template #memo>
        <div class="memo-wrap">
          <task-memo
            :data="memoLists || []"
            @change-memo="changeMemo"
            @refresh-memp="refreshMemo"
          />
        </div>
      </template>
    </distribute-tabs>
    <slot />
  </div>
</template>

<script>
import DistributeTabs from '@/components/Billing/Distribute/DistributeTabs.vue'
import TaskMemo from '../TaskMemo/TaskMemo'
import VerticalTable from '@sd-fe/cmp-core'

export default {
  name: 'TaskCommonProject',
  components: {
    DistributeTabs,
    TaskMemo,
    VerticalTable
  },
  props: {
    data: {
      type: Object,
      default: undefined
    },
    memoLists: {
      type: [Object],
      default: () => {}
    }
  },
  computed: {
    distCompanyNames () {
      // 2차 제외 && 1차 중복제거
      return this.projectData?.distributeGroups?.filter(
        (arr, index, self) => index === self.findIndex(t => t.groupName === arr.groupName && t.groupIdx !== 0)
      ) || []
    }
  },
  watch: {
    data: {
      immediate: true,
      handler (newVal) {
        this.projectData = newVal
        this.distModelName = newVal?.name
      }
    }
  },
  methods: {
    changeMemo () {
      this.$emit('change-memo')
    },
    refreshMemo (params) {
      this.$emit('refresh-memo', params)
    }
  },
  data () {
    return {
      distModelName: '',
      projectData: {},
      tabs: [
        { field: 'all', name: '총 비율' },
        { field: 'depth-1', name: '1차 배부관계사 비율' },
        { field: 'depth-2', name: '2차 배부관계사 비율' },
        { field: 'memo', name: '메모' }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>

.conference-section-title {
  margin-bottom: 20px;
}

.memo-wrap {
  padding: $gap $gap-m $gap-m;
  border: 1px solid $border2A;
  border-radius: $radius;

}
</style>
