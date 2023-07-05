<template>
  <!-- 리전 우선 순위 설정 모달 -->
  <el-dialog
    :visible="isVisible"
    @close="$emit('close')"
    title="리전 우선순위 결정"
  >
    <ul class="board-list">
      <draggable
        :list="clonedData"
      >
        <region-card-row
          v-for="(region,index) in clonedData"
          :key="region.regionName"
          :data="region"
          :index="index+1"
        />
      </draggable>
    </ul>
    <div class="button-area">
      <button
        class="button"
        type="is-anti"
        @click="cancel"
      >
        취소
      </button>
      <button
        class="button"
        type="is-primary"
        @click="save"
      >
        저장
      </button>
    </div>
  </el-dialog>
</template>

<script>
import CardRow from '@/components/ConfigAws/CardRow'
import draggable from 'vuedraggable'
import { cloneDeep } from 'lodash'
export default {
  components: {
    draggable,
    'region-card-row': CardRow
  },
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    regionList: {
      type: Array,
      default: () => {}
    }
  },
  watch: {
    regionList: {
      immediate: true,
      handler (newList) {
        this.clonedData = cloneDeep(newList)
      }
    }
  },
  methods: {
    async cancel () {
      this.regionList = await this.clonedData
      console.log('@cancle : ', this.clonedData)
      this.$emit('close')
    },
    save () {
      this.$confirm('순서를 변경하시겠습니까?').then(() => {
        this.$alert('순서가 변경되었습니다.')
        this.$emit('save-regions', this.clonedData)
      })
    }
  },
  data () {
    return {
      clonedData: []
    }
  }
}
</script>

<style lang="scss" scoped>
.button-area {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}
.board-list {
  height: 700px;
  overflow-y: scroll;
}
</style>
