<template>
  <div class="modal-vmw-cluster-thres-set">
    <el-dialog
      :title="$v('임계치 설정') + ' : ' + (selectedRow? selectedRow.name :'')"
      :visible="modalStatus.isOpen"
      @close="handleCloseModal"
      width="600px"
    >
      <div class="border-top" />
      <section
        v-loading="isLoadingModal"
        class="modal-body"
      >
        <register-contents
          required
          v-for="values in TESTobj"
          :title="`${$v(values.groupName)} (%)`"
          :key="values.groupName"
        >
          <div
            v-for="item in values.children"
            class="input-form -threshold"
            :class="{'--one-option': values.children.length <= 1}"
            :key="item.key"
          >
            <div>
              {{ $v(item.label) }} : <!-- 1차 임계치, 2차 임계치 -->
              <el-input-number
                v-model="item.value"
                :min="0"
              />
              <span style="margin-left: 5px">%</span>
            </div>
          </div>
        </register-contents>
      </section>
      <CommonModalFooter
        @close="handleCloseModal"
        @confirm="handleConfirmModal"
      />
    </el-dialog>
  </div>
</template>

<script>
import API, { CommonModalFooter } from '@sd-fe/cmp-core'
import { cloneDeep } from 'lodash'
// import RegisterContentsThres from './components/RegisterContentsThres.vue'
export default {
  components: { CommonModalFooter },
  watch: {
    'modalStatus.isOpen': {
      handler (isOpen) {
        if (isOpen) {
          this.TESTobj = cloneDeep(this.convertThresholdsToObject(this.selectedRow))
          console.log('this.TESTobj', this.TESTobj)
        }
      }
    }
  },
  props: {
    modalStatus: {
      type: Object,
      default () {
        return {
          isOpen: false,
          selectedRow: null
        }
      }
    },
    selectedRow: {
      type: Object,
      default () {
        return null
      }
    }
  },
  methods: {
    // 그리드 값(객체)를 받아서 DOM에 뿌려줄 수 있는 데이터(객체배열)로 반환
    convertThresholdsToObject (thresholds) {
      return [
        {
          groupName: '가상화율 임계치',
          children: [
            { label: '관리 지표', key: 'cpuManageIndicator', value: thresholds.cpuManageIndicator || 0 },
            { label: '1차 임계치', key: 'firstCpuPercent', value: thresholds.firstCpuPercent || 0 },
            { label: '2차 임계치', key: 'secondCpuPercent', value: thresholds.secondCpuPercent || 0 }
          ]
        },
        {
          groupName: '메모리 임계치',
          children: [
            { label: '관리 지표', key: 'memoryManageIndicator', value: thresholds.memoryManageIndicator || 0 },
            { label: '1차 임계치', key: 'firstMemoryPercent', value: thresholds.firstMemoryPercent || 0 },
            { label: '2차 임계치', key: 'secondMemoryPercent', value: thresholds.secondMemoryPercent || 0 }
          ]
        },
        {
          groupName: '디스크 임계치',
          children: [
            { label: '관리 지표', key: 'diskManageIndicator', value: thresholds.diskManageIndicator || 0 },
            { label: '1차 임계치', key: 'firstDiskPercent', value: thresholds.firstDiskPercent || 0 },
            { label: '2차 임계치', key: 'secondDiskPercent', value: thresholds.secondDiskPercent || 0 }
          ]
        }
      ]
    },
    // API 호출전 DOM에 뿌리는 데이터 -> 객체값으로 임계치 반환
    convertThresholdsToObj (thresholdsArr) {
      const thresholdsObj = {}

      thresholdsArr.forEach(group => {
        group.children.forEach(item => {
          thresholdsObj[item.key] = item.value
        })
      })
      return thresholdsObj
    },
    handleCloseModal () {
      this.$emit('close')
    },
    async checkComparison (newItem) {
      const comparison = ['Cpu', 'Memory', 'Disk']
      let success = true; let message = ''
      comparison.every((cond) => {
        const [indicator, condition1, condition2] = [newItem[`${cond.toLocaleLowerCase()}ManageIndicator`], newItem[`first${cond}Percent`], newItem[`second${cond}Percent`]]
        if ([indicator, condition1, condition2].includes(null) || [condition1, condition2].includes(undefined) || [condition1, condition2].includes(0)) {
          message = `${cond} 값이 올바르지 않습니다.`
          success = false
          return false // break every loop
        }
        if (condition1 >= indicator) {
          message = `1차 ${cond} 임계치는 ${cond} 관리 지표보다 작아야 합니다.`
          success = false
          return false
        }
        if (condition2 <= condition1 || condition2 >= indicator) {
          message = `2차 ${cond} 임계치는 1차 임계치보다 커야하고, ${cond} 관리 지표보다 작아야 합니다.`
          success = false
          return false
        }
        return true // continue every loop
      })
      return { success, message }
    },
    async handleConfirmModal () {
      try {
        let result = false
        let convertedThres = {}
        this.isLoadingModal = true
        convertedThres = this.convertThresholdsToObj(this.TESTobj)
        const successValid = await this.checkComparison(convertedThres)
        if (successValid.success) {
          result = await this.updateClusterThres(convertedThres)
        } else {
          this.$alert(this.$v(successValid.message), '알림', { dangerouslyUseHTMLString: true })
          return false
        }

        const isConfirmed = await this.$confirm(this.$v('수정하시겠습니까?')).then(() => {
          return true
        }).catch(() => false)

        if (isConfirmed) {
          console.log(convertedThres)

          if (result) {
            this.$alert(this.$v('임계치를 수정하였습니다.'))
            this.$emit('beforeUpdated')
          }
        }
      } catch (error) {
        console.log(error)
      } finally {
        this.isLoadingModal = false
      }
    },
    // API_HANDLER (PUT) 클러스터 임계치 수정
    async updateClusterThres (payload) {
      try {
        const { connectIdx, clusterId, name } = this.selectedRow
        const reqData = { ...payload, connectIdx, clusterId, name }
        const res = await API.vmware.cluster.updateVmwClusterThres(reqData)
        return res
      } catch (error) {
        this.$alert(this.$v('임계값 수정을 실패했습니다.'))
      }
    }
  },
  data () {
    return {
      TESTobj: [],
      isLoadingModal: false
    }
  }
}
</script>

<style lang="scss" scoped>
.border-top {
  border-top: 1px solid #2A2D44;
}
.input-form {
  display: flex;
  align-items: center;
  position: relative;
  > .button {
    width: 100%;
  }
  & + .input-form {
    margin-top: 5px;
  }

  &.-threshold {
    // border: 1px solid red;
    justify-content: flex-start;
    align-items: flex-start;
    flex-direction: column;
    &:first-child { margin-bottom: 10px;}
    &.--one-option {
      margin-bottom: 0px;
    }
  }
}
</style>
