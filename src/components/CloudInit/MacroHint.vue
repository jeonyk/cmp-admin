<template>
  <div
    v-if="!onlyGrid"
    class="macro"
  >
    <div class="macro-hint">
      <button
        class="button"
        type="is-primary"
        @click="() => (isActiveModal = !isActiveModal)"
      >
        매크로 보기
      </button>
    </div>
    <el-dialog
      :title="$v('매크로 보기')"
      :visible.sync="isActiveModal"
      width="700px"
    >
      <div class="macro-dialog">
        <macro-hint-grid
          :columns="macroColumns"
          :items="macroList"
        />
      </div>
      <section class="modal-button-area">
        <button
          class="button"
          type="is-primary"
          @click="() => isActiveModal = false"
        >
          {{ $v('확인') }}
        </button>
      </section>
    </el-dialog>
  </div>
  <macro-hint-grid
    v-else
    :columns="macroColumns"
    :items="macroList"
  />
</template>

<script>
import Vue from 'vue'

const MacroHintGrid = Vue.extend({
  props: {
    columns: {
      type: Array,
      required: true
    },
    items: {
      type: Array,
      required: true
    }
  },
  render () {
    return (
      <cmp-grid columns={this.columns} item-source={this.items} />
    )
  }
})

export default {
  name: 'MacroHint',
  props: {
    onlyGrid: {
      type: Boolean,
      default: false
    }
  },
  components: {
    MacroHintGrid
  },
  data: () => ({
    isActiveModal: false,
    macroColumns: [
      { binding: 'name', header: '이름' },
      { binding: 'key', header: '매크로' }
    ],
    macroList: [
      { name: '호스트명', key: '{HOSTNAME}' },
      { name: 'IP', key: '{IP_ADDRESS}' },
      { name: '게이트웨이', key: '{GATEWAY}' },
      { name: '넷마스크', key: '{NETMASK}' },
      { name: 'DNS', key: '{DNS_IP}' },
      { name: 'PREFIX', key: '{PREFIX}' }
    ]
  })
}
</script>

<style lang="scss" scoped>
.macro {
  margin-bottom: $gap-s;
}
</style>
