<template>
  <div class="wrapper">
    <div class="central">
      <g-tab
        class="central-tab tab"
        :data="centralTabs"
        @click="onChangeCentral"
      />
      <cmp-grid
        :columns="centralColumns"
        :item-source="activeCentralUnregisterImages"
        :paging-size="pagingSize"
        :changing-page-reset="false"
        use-checkbox
        :header-checkbox="false"
        @checkedRowsData="onCheckCentralImage"
      >
        <template #sizeBytes="{ row, column }">
          {{ column.formatter(null, row, column.binding) }}
        </template>
      </cmp-grid>
    </div>
    <div class="element">
      <g-tab
        class="element-tab tab"
        :data="elementTabs"
        @click="onChangeElement"
      />
      <cmp-grid
        :columns="elementColumns"
        :item-source="activeElementUnregisterImages"
        :paging-size="pagingSize"
        :changing-page-reset="false"
        use-checkbox
        :header-checkbox="false"
        @checkedRowsData="onCheckElementImage"
      >
        <template #vmDiskSize="{ row, column }">
          {{ column.formatter(null, row, column.binding) }}
        </template>
      </cmp-grid>
    </div>
  </div>
</template>

<script>
/**
 * central: [{ id: '', title: '', centralIdx: 0, children: [Element] }]
 * element: [{ id: '', title: '', centralIdx: 0 }]
 */
export default {
  name: 'TabWithGrid',
  props: {
    centrals: {
      type: Array,
      default: () => []
    },
    elements: {
      type: Array,
      default: () => []
    },
    centralUnregisterImagesMap: {
      type: [Map, Object],
      required: true
    },
    elementUnregisterImagesMap: {
      type: [Map, Object],
      required: true
    },
    centralLoading: {
      type: Boolean,
      default: false
    },
    elementLoading: {
      type: Boolean,
      default: false
    },
    /**
     * 모달 추가/수정 상태
     */
    updateMode: {
      type: String,
      default: 'new'
    }
  },
  computed: {
    activeCentralUnregisterImages () {
      if (!this.centralUnregisterImagesMap || !this.activeCentralTab || this.centralLoading) return []

      return this.centralUnregisterImagesMap.get(this.activeCentralTab.centralIdx)
    },
    activeElementUnregisterImages () {
      if (!this.elementUnregisterImagesMap || !this.activeElementTab || this.elementLoading) return []

      return this.elementUnregisterImagesMap.get(this.activeElementTab.elementIdx)
    }
  },
  watch: {
    activeCentralTab (tab) {
      this.onSelectCentral(this.centrals.find(central => central.centralIdx === tab.centralIdx))
    },
    activeElementTab (tab) {
      this.onSelectElement(this.elements.find(element => element.elementIdx === tab.elementIdx))
    }
  },
  created () {
    this.genCentralTabs()
  },
  methods: {
    /**
     * 센트럴 이미지 그리드 체크 이벤트
     */
    onCheckCentralImage (rows, row) {
      this.$emit('central-checked-rows', rows, row)
    },
    /**
     * 엘리먼트 이미지 그리드 체크 이벤트
     */
    onCheckElementImage (rows, row) {
      this.$emit('element-checked-rows', rows, row)
    },
    /**
     * Central 탭 Active
     */
    onChangeCentral (tab) {
      this.activeCentralTab = tab
      this.genElementTabs()
    },
    /**
     * Element 탭 Active
     */
    onChangeElement (tab) {
      this.activeElementTab = tab
    },
    /**
     * Central 탭 생성
     */
    genCentralTabs () {
      this.centralTabs = this.centrals.map(this.convertToTabData)
      this.onChangeCentral(this.centralTabs[0])
    },
    /**
     * Element 탭 생성
     */
    genElementTabs () {
      if (this.centrals.length && this.elements.length && this.activeCentralTab) {
        this.elementTabs = this.elements
          .filter(element => element.centralIdx === this.activeCentralTab.centralIdx)
          .map(this.convertToTabData)
        this.elementTabs.forEach(tab => this.$emit('select-element', tab))
        this.onChangeElement(this.elementTabs[0])
      }
    },
    /**
     * Central, Element 데이터를 탭 형태의 데이터로 변형해서 반환한다.
     */
    convertToTabData (item) {
      const type = typeof item.elementIdx === 'undefined' ? 'central' : 'element'

      return type === 'central'
        ? {
          field: item.centralIdx,
          name: item.centralName,
          centralIdx: item.centralIdx
        }
        : {
          field: item.elementIdx,
          name: item.elementName,
          elementIdx: item.elementIdx,
          centralIdx: item.centralIdx
        }
    },
    /**
     * 센트럴 선택 이벤트
     */
    onSelectCentral (central) {
      this.$emit('select-central', central)
    },
    /**
     * 엘리먼트 선택 이벤트
     */
    onSelectElement (element) {
      this.$emit('select-element', element)
    }
  },
  data: (root) => ({
    centralColumns: [
      { binding: 'imageName', header: '이미지 이름' },
      {
        binding: 'sizeBytes',
        header: '사이즈',
        customHtml: true,
        formatter: (args, item, binding) => {
          return root.$options.filters.byte(item[binding])
        }
      },
      { binding: 'imageUuid', header: 'Image uuid' }
      // { binding: 'imageType', header: 'Type' }
    ],
    elementColumns: [
      { binding: 'imageName', header: '이미지 이름' },
      {
        binding: 'vmDiskSize',
        header: '사이즈',
        customHtml: true,
        formatter: (args, item, binding) => {
          return root.$options.filters.byte(item[binding])
        }
      },
      { binding: 'imageUuid', header: 'Image uuid' }
      // { binding: 'imageType', header: 'Type' }
    ],
    centralTabs: [],
    elementTabs: [],
    pagingSize: 5,
    activeCentralTab: null,
    activeElementTab: null
  })
}
</script>

<style lang="scss" scoped>
.wrapper {
  display: flex;
  flex-wrap: nowrap;
  margin: $gap 0;

  & > * {
    flex: 0 0 calc(50% - 20px);
  }

  & > * + * {
    margin-left: 20px;
  }

  .tab {
    margin-bottom: $gap-s;
    overflow-x: auto;

    &::v-deep {
      .tab-contents-area {
        /* display: none; */
        padding-top: $gap-s !important;
      }
    }
  }
}
</style>
