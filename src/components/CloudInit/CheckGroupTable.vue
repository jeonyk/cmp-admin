<template>
  <div class="group-table">
    <div
      v-for="row in transformedData"
      :key="row.id"
      class="row"
    >
      <div class="cell">
        <el-checkbox
          v-model="row.checked"
          :disabled="isViewState"
          @change="val => onChangeRow(val, row)"
        >
          <!-- :indeterminate="checkIsIndeterminate(row)" -->
          <span class="cell-title">{{ row.title }}</span>
        </el-checkbox>
      </div>
      <div
        v-for="cell in row.children"
        class="cell"
        :key="cell.id"
      >
        <el-checkbox
          v-model="cell.checked"
          :disabled="isViewState"
          @change="val => onChangeChildren(val, row)"
        >
          <span class="cell-title">{{ cell.title }}</span>
        </el-checkbox>
        <template v-if="getUploadStatus(cell)">
          <div class="cell-status">
            <cmp-status-tag :type="getTagStatus(cell.cluster.uploadStatus)">
              <i :class="getTagIconClass(cell.cluster.uploadStatus)" />
              <span>{{ getTagText(cell.cluster.uploadStatus) }}</span>
            </cmp-status-tag>
          </div>
          <div
            v-if="cell.cluster.uploadStatus === STATE_MAP.FAIL"
            class="cell-upload"
          >
            <button
              class="button"
              type="is-primary"
              size="is-mini"
              @click="reUpload(cell)"
            >
              {{ $v('재업로드') }}
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import { cloneDeep } from 'lodash'

/**
 * row
 * [
 *  {
 *    ...,
 *    title: '',
 *    children: [
 *      {
 *        ...,
 *        title: ''
 *      }
 *    ]
 *  }
 * ]
 */
export default {
  name: 'CheckGroupTable',
  props: {
    data: {
      type: Array,
      default: () => []
    },
    initUniqueKey: {
      type: String,
      default: 'id'
    },
    initUniqueValues: {
      type: Array,
      default: () => []
    },
    requiredInitCheck: {
      type: Boolean,
      default: false
    },
    /**
     * 이미지 상태 노출 여부
     */
    isViewState: {
      type: Boolean,
      default: false
    },
    /**
     * 업데이트시 이미지 상세 정보
     */
    updateImageDetailData: {
      type: Object,
      default: null
    }
  },
  watch: {
    data: {
      immediate: true,
      deep: true,
      handler (data) {
        if (data && data.length) {
          this.transformData(
            data.map(central => ({
              ...central,
              title: central.centralName,
              children: central.elements.map(element => ({
                ...element,
                title: element.elementName
              }))
            }))
          )
        }
      }
    },
    transformedData: {
      immediate: true,
      deep: true,
      handler (data) {
        const checked = data.filter(row => {
          return row.children.some(cell => cell.checked)
        })
        this.$emit('checked', checked.map(check => ({ ...check, children: check.children.filter(cell => cell.checked) })))
      }
    }
  },
  computed: {
    updateImages () {
      if (!this.updateImageDetailData) return null
      return this.updateImageDetailData.clusterImages
    }
  },
  methods: {
    /**
     * 재업로드한다.
     */
    reUpload (cell) {
      this.$emit('re-upload', cell)
    },
    /**
     * 태그 아이콘
     */
    getTagIconClass (status) {
      return {
        FAILED: 'el-icon-close',
        SUCCEEDED: 'el-icon-check',
        RUNNING: 'el-icon-loading'
      }[status]
    },
    /**
     * 태그 타입
     */
    getTagStatus (status) {
      return {
        FAILED: 'is-fail',
        SUCCEEDED: 'is-complete',
        RUNNING: 'is-loading'
      }[status]
    },
    /**
     * 태그 텍스트
     */
    getTagText (status) {
      return {
        FAILED: this.$v('실패'),
        SUCCEEDED: this.$v('성공'),
        RUNNING: this.$v('업로드 중')
      }[status]
    },
    /**
     * 클러스터에 이미지 업로드 상태를
     * 상세 정보에서 찾는다.
     */
    getUploadStatus (img) {
      if (!this.updateImages) return null
      const findCluster = this.updateImages.find(image => image.clusterUuid === img.clusterUuid)
      if (findCluster) {
        this.$set(img, 'cluster', findCluster)
        // img.cluster.uploadStatus = 'SUCCESS'
        return findCluster
      }
      return null
    },
    onChangeRow (rowChecked, row) {
      // 셀의 모든 체크 상태를 부모 상태와 일치시킨다.
      row.children.forEach(cell => (cell.checked = rowChecked))
    },
    onChangeChildren (cellChecked, row) {
      // 셀의 체크 상태가 변화할 때, 모두 체크되어있는지 체크하여
      // 부모 체크 상태를 업데이트한다.
      if (row.children.every(cell => cell.checked)) row.checked = true
      else if (row.children.every(cell => !cell.checked)) row.checked = false
    },
    checkIsIndeterminate (row) {
      // 부모의 체크 상태가 indeterminate 상태인지 아닌지 체크한다.
      return row.children.some(cell => cell.checked) && !row.children.every(cell => cell.checked)
    },
    /**
     * checked 값을 초기화한다.
     */
    deepMarkChecked (item) {
      let checked = false

      // 초기 상태를 지정할 필요가 있는 경우
      if (this.requiredInitCheck) {
        // Unique Key가 Unique Values 안에 존재하는지 판단하고
        // 체크 상태를 업데이트한다.
        if (this.initUniqueValues.includes(item[this.initUniqueKey])) {
          checked = true
        }
      }

      return { ...item, checked }
    },
    /**
     * 데이터를 템플릿에 표현할 수 있는 형태로 변환한다.
     */
    transformData (data) {
      // 원본 데이터가 바뀌면 watch에서 무한 루프에 빠지므로
      // 복사한다.
      const copyData = cloneDeep(data)
      this.transformedData = copyData.map(central => {
        if (central.children && central.children.length) {
          central.children = central.children.map(this.deepMarkChecked)
        }
        return this.deepMarkChecked(central)
      })

      // 초기 상태를 임의로 지정할 경우
      // 각 cell에 대해 이벤트를 실행 처리한다.
      if (this.requiredInitCheck) {
        this.transformedData.forEach(row => {
          if (row.children && row.children.length) {
            row.children.forEach(cell => {
              this.onChangeChildren(cell.checked, row)
            })
          }
        })
      }
    },
    /**
     * 체크된 아이템을 반환한다.
     */
    getAllCheckedItem () {
      const checked = []
      const pushChecked = (item) => {
        if (item.checked) checked.push(item)
      }

      this.transformedData.forEach(central => {
        pushChecked(central)
        if (central.children && central.children.length) central.children.forEach(child => pushChecked(child))
      })

      return checked
    }
  },
  data: () => ({
    transformedData: [],
    STATE_MAP: {
      FAIL: 'FAILED',
      SUCCESS: 'SUCCEEDED',
      RUN: 'RUNNING'
    }
  })
}
</script>

<style lang="scss" scoped>
.group-table {
  display: table;
  border-collapse: collapse;

  .row {
    display: table-row;
    /* flex-wrap: nowrap; */

    .cell {
      display: table-cell;
      padding: $gap $gap-m;
      border: 1px solid $purple-gray;
      border-collapse: separate;
      vertical-align: middle;

      &:first-of-type {
        background-color: $dark-slate;
      }

      &-title {
        margin-left: $gap-s;
        color: $white;
      }

      &-status {
        margin: $gap-s auto 0 auto;
        text-align: center;

        i {
          width: auto;
          height: auto;

          &::before {
            font-size: 13px;
            color: inherit;
          }
        }
      }

      &-upload {
        margin-top: $gap-s;
        text-align: center;
      }
    }
  }
}
</style>
