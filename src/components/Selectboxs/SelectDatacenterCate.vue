<template>
  <div class="select-dcenter">
    <el-select
      class="select-dcenter--selectbox"
      :class="{ '-long': $i18n.locale !== 'ko' }"
      :popper-append-to-body="false"
      :placeholder="$v('데이터센터 선택')"
      v-model="selectedDcenter"
      value-key="cateIdx"
      @change="handleChangeDcenter"
      :disabled="disabled"
    >
      <el-option
        v-for="item in options"
        :key="item.cateIdx"
        :value="item"
        :label="item.cateName"
      />
    </el-select>
  </div>
</template>

<script>
import API from '@sd-fe/cmp-core'
export default {
  model: {
    prop: 'modelValue',
    event: 'change'
  },
  props: {
    modelValue: {
      type: Array,
      default () {
        return []
      }
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    modelValue: {
      deep: true,
      immediate: true,
      handler (val) {
        if (val?.length > 0) {
          this.selectedDcenter = val[0]
        }
      }
    }
  },
  created () {
    this.setDcenterOptions()
  },
  methods: {
    handleChangeDcenter (data) {
      console.log(data, this.selectedDcenter)
      this.$emit('change', [data])
    },
    async setDcenterOptions () {
      this.options = await API.network.getNetworkCategoryTree()
    }
  },
  data () {
    return {
      selectedDcenter: {},
      options: []
    }
  }
}
</script>

<style lang="scss">
</style>
