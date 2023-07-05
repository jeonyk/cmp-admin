<!--
  * 파일명 : CMPGrid.vue
  * 파일 기능 :
  * 작성자 : 염창윤 외 3명
  * 최종 작성일 : 2021-02-03
  * License By Shinsegae I&C
  * 2021-02-03 Wijmo Grid 엑셀 다운로드 추가
 -->

<template>
  <div :class="['cmp-grid-wrapper', { 'clickable': routable || selectable }]">
    <!-- 검색 기능 사용시 해당 검색창을 등록하세요 -->
    <!-- <wj-flex-grid-search
      ref="theSearch"
      placeholder="Grid Search processing"
    /> -->
    <template v-if="!data.length && !itemSource.length && !loading && !forceRenderGrid">
      <div class="empty-data">
        {{ $t('common.PLACEHOLDER.noData') }}
      </div>
    </template>
    <template v-else-if="loading">
      <div class="empty-data" />
    </template>
    <div
      v-else
      v-loading="isLoading"
      class="cmp-grid-inner"
    >
      <!-- 기본 그리드 -->
      <wj-flex-grid
        :id="gridId"
        ref="cmpGrid"
        :initialized="init"
        :items-source="data"
        :headers-visibility="headerVisibility"
        allow-dragging="None"
        selection-mode="None"
        :allow-delete="false"
        allow-resizing="1"
        :new-row-at-top="true"
        :show-selected-headers="'All'"
        :sticky-headers="false"
        :alternating-row-step="0"
        :style="`max-height: ${height}px`"
        :read-only="true"
        :allow-merging="setAllowMerging()"
        :loaded-rows="loadedRows"
        :auto-row-heights="autoRowHeights"
      >
        <!-- :item-formatter="itemFormatter" -->
        <wj-flex-grid-filter
          v-if="useColumnFilter"
          :filter-columns="filterColumns"
          :initialized="initializeFilter"
        />

        <!-- :style="height ? `height: ${height}px;` : 'height: auto;'" -->
        <!-- :show-marquee="false" -->
        <!-- :auto-generate-columns="false" -->
        <wj-flex-grid-column
          v-for="column in columns"
          :key="column.field"
          :header="$t(column.keyPath, column.keyObj || {}) || column.header"
          :binding="column.binding"
          :width="column.width ? column.width : '*'"
          :format="column.format"
          :allow-sorting="column.sorting === false ? false : true"
          :is-read-only="true"
          :allow-merging="column.cellMerge ? true : false"
          :css-class="column.cssClass ? column.cssClass : ''"
          :aggregate="column.aggregate"
          :align="column.align ? column.align : 'justify'"
          :word-wrap="column.wordWrap || false"
        >
          <!-- format https://www.grapecity.com/wijmo/demos/Core/Globalization/Formatting -->

          <!-- 커스텀 checkbox - 체크박스를 사용할 경우 -->
          <wj-flex-grid-cell-template
            v-if="column.checkbox"
            cell-type="Cell"
            v-slot="cell"
          >
            <el-checkbox
              style="z-index: 0;"
              :disabled="cell.item.disable"
              v-model="cell.item.checked"
              @change.native.stop="changedCheckbox"
              @click.native="(e) => {
                e.stopPropagation()
                if(cell.item.disable) $emit('clickDisabledCheckbox', cell.item)
              }"
            />
            <!-- <label
              class="wj-grid-checkbox"
              @click="(e) => {
                e.stopPropagation()
                if(cell.item.disable) {
                  debugger
                  $emit('clickDisabledCheckbox', cell.item)
                }
              }"
            >

              <input
                style="display: none"
                type="checkbox"
                :checked="cell.item.checked"
                v-model="cell.item.checked"
                :disabled="cell.item.disable"
                @change="changedCheckbox"
              >
            </label> -->
          </wj-flex-grid-cell-template>
          <!-- /. 커스텀 checkbox -->

          <!-- 커스텀 html을 사용해야할 경우 -->
          <wj-flex-grid-cell-template
            cell-type="Cell"
            v-if="column.customHtml"
            v-slot="cell"
            class="test-cell"
          >
            <!-- {{ cell.edit }} -->
            <slot
              :row="cell.item"
              :cell="cell.row"
              :name="column.field"
            >
              {{ cell.item[column.field] }}
            </slot>
          </wj-flex-grid-cell-template>
          <wj-flex-grid-cell-template
            cell-type="Cell"
            v-slot="cell"
            v-else-if="!column.customHtml && !column.checkbox"
          >
            {{ cell.item[column.field] || '-' }}
          </wj-flex-grid-cell-template>
        <!-- /. 커스텀 html -->
        </wj-flex-grid-column>
      </wj-flex-grid>

      <!-- 헤더 병합 시 - column-group -->
      <!-- 사용할 일이 없을것 같습니다.. -->
      <wj-flex-grid
        v-if="columnGroup"
        :initialized="init"
        :items-source="data"
        read-only="true"
        selection-mode="None"
        :auto-generate-columns="true"
        :column-groups="columns"
        height="100vh"
        allow-dragging="None"
        headers-visibility="Column"
        show-selected-headers="All"
        :show-marquee="true"
        :sticky-headers="false"
      />
      <!-- :item-formatter="itemFormatter" -->

      <!-- [더보기] 버튼 기능 :: @@@ 기능 삭제됨 - 필요시 수정 필요 -->
      <!-- <table-more-btn
        v-if="pagingType === 'append' && (tableCountDefault !== itemSource.length) && itemSource.length >= 10"
        :total-data-len="itemSource.length"
        :table-data-len="tableCountDefault"
        @click="appendData"
      /> -->
    </div>
    <excel-download
      v-if="useExcelDownload && itemSource.length"
      class="excel-download"
      :wijmo-grid="grid"
      :custom-grid-for-export="customGridForExport"
      :custom-before-for-export="customBeforeForExport"
      @set-now-exporting="setNowExporting"
    />
    <!-- 페이지네이션 -->
    <div
      class="pagination-wrap"
      v-if="itemSource.length && pagingType === 'pagination' && page.total > pagingSize"
    >
      <!-- {{ page }} -->
      <el-pagination
        layout="prev, pager, next"
        :total="page.total"
        :page-size="this.pagingSize"
        :current-page.sync="page.currPage"
        @current-change="changingPage"
      />
    </div>
  </div>
</template>

<script src="./CMPGrid.script.js" />

<style lang="scss">
.cmp-grid-wrapper {
  resize: both;
  width: 100%;
  .empty-data {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: $disable;
    padding: 80px 0;
  }
  .cmp-grid-inner {
    position: relative;
  }
  .-required {
    color: $main-red;
    font-style: normal;
  }
}
// checkbox / radio 기본
.header-checkbox {
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
}
.wj-grid-checkbox {
  @include cmp-checkbox()
}
</style>
