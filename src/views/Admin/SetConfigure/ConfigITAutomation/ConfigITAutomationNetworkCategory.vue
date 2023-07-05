<template>
  <el-dialog
    :title="$v('네트워크 카테고리 선택')"
    :visible.sync="visible"
    width="700px"
    @close="$emit('close')"
    top="15vh"
  >
    <section>
      <article class="modal-body network-category-wrap">
        <div class="sect">
          <h4>네트워크 카테고리</h4>

          <div
            class="content -tree"
            v-if="treeData.length"
          >
            <g-tree
              :data="treeData"
              class="project-tree"
              :view-line="true"
              :selectable-all-item="false"
              @selected="selectTreeItem"
            >
              <!-- :select-object.sync="selectedNetworkCategory" -->
              <template #title="{node}">
                {{ node.cateName }}
              </template>
            </g-tree>
          </div>
          <div
            v-else
            class="content -empty"
          >
            데이터가 없습니다.
          </div>
        </div>
        <div class="sect">
          <h4>등록할 네트워크 미리보기</h4>

          <div
            class="content"
            v-if="tags.length"
          >
            <el-tag
              v-for="{ name, cateKey } in tags"
              :key="cateKey"
              closable
              @close="selectTreeItem({ name, cateKey })"
            >
              {{ name }}
            </el-tag>
          </div>
          <div
            class="content -empty"
            v-else
          >
            {{ $v('네트워크 카테고리를 선택해주세요.') }}
          </div>
        </div>
      </article>

      <div class="modal-footer modal-button-area">
        <button
          class="button -modal-button"
          type="is-anti"
          @click="$emit('close')"
        >
          {{ $t('취소') }}
        </button>
        <button
          class="button -modal-button"
          type="is-primary"
          @click="save"
        >
          {{ $v('확인') }}
        </button>
      </div>
    </section>
  </el-dialog>
</template>

<script>
import API, { GTree } from '@sd-fe/cmp-core'

export default {
  name: 'ConfigITAutomationNetworkCategory',
  components: {
    'g-tree': GTree
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    visible (visible) {
      if (visible) this.setTreeData()
    }
  },
  methods: {
    async setTreeData (treeData) {
      try {
        this.treeData = await API.network.getNetworkCategoryTree()
      } catch (error) {
        console.error(error)
      }
    },
    selectTreeItem (item) {
      const name = item.cateKey.replace(/-/gi, '>')
      const idx = this.tags.findIndex(tag => tag.cateKey === item.cateKey)

      if (idx > -1) this.tags.splice(idx, 1)
      else this.tags.push({ name, cateKey: item.cateKey })
    },
    save () {
      this.$emit('save', this.tags)
      this.$emit('close')
    }
  },
  data: () => ({
    treeData: [],
    tags: []
  })
}
</script>

<style lang="scss" scoped>
.network-category-wrap {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: $gap;

  .sect {
    h4 {
      font-weight: 500;
      font-size: 13px;
      margin-bottom: 15px;
    }

    .content {
      border: 1px solid #3D435E;
      border-radius: 6px;
      height: 430px;
      padding: $gap;
      box-sizing: border-box;

      &.-tree { padding: 10px $gap; }

      > span {
        margin-bottom: $gap-s;
      }
    }

    .-empty {
      color: $input-placeholder;
      font-size: 13px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}
</style>
