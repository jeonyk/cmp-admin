<!--
  * 파일명 : datastorePathSelection.vue
  * 파일 기능 : Datastre의 파일 path 선택 컴포넌트
  * 작성자 : 김예담
  * 최종 작성일 : 2022-09-01
  * License By Shinsegae I&C
 -->

<template>
  <div v-loading="isGetDatastore">
    <article class="datastore-path-wrap">
      <transition name="fade">
        <div
          class="datastore-path-add"
        >
          <div class="select-family">
            <el-select
              class="-family"
              :popper-append-to-body="false"
              placeholder="상위 경로"
              v-model="parentPath"
              @change="changeParent"
              :disabled="!!syncData"
            >
              <el-option
                v-for="item in parentPathOptions"
                :key="item.value"
                :value="item.value"
                :label="item.value"
              />
            </el-select>

            <el-select
              class="-version"
              :popper-append-to-body="false"
              placeholder="경로"
              v-model="path"
              :disabled="!!syncData"
            >
              <el-option
                v-for="item in pathOptions"
                :key="item.path"
                :value="item.path"
                :label="item.path"
              />
            </el-select>

            <button
              class="button"
              type="is-primary"
              :disabled="!parentPath || !path || !!syncData"
              @click="save"
            >
              {{ $v('적용') }}
            </button>
          </div>
        </div>
      </transition>
    </article>

    <!-- 추가된 네트워크 조직 목록 -->
    <el-tag
      v-if="syncData"
      class="datastore-path-tag"
      :closable="!disabled"
      @close="removeSyncData"
    >
      {{ syncData.full }}
    </el-tag>
  </div>
</template>

<script>
import API from '@sd-fe/cmp-core'
import { uniqBy } from 'lodash'

export default {
  name: 'GuestOSSelection',
  props: {
    hostUuid: {
      type: String,
      default: ''
    },
    syncData: { // { parentPath, path, full }
      type: Object,
      default: undefined
    },
    disabled: { // disabled 시킬건지 결정합니다
      type: Boolean,
      default: false
    },
    connectIdx: {
      type: [String, Number],
      default: null
    },
    datastoreId: {
      type: [String, Number],
      default: null
    }
  },
  watch: {
    connectIdx: {
      immediate: true,
      async handler (val) {
        await this.getDatastorePath()
      }
    },
    datastoreId: {
      immediate: true,
      async handler (val) {
        this.resetOptions()
        await this.getDatastorePath()
      }
    }
  },
  methods: {
    /**
     * Datastore 경로 조회
     */
    async getDatastorePath (connectIdx = this.connectIdx, datastoreId = this.datastoreId) {
      if (!connectIdx || !datastoreId) return

      try {
        this.isGetDatastore = true
        const data = await API.vmware.datastore.getDatastorePath({ connectIdx, datastoreId }) || []

        this.originPathList = data.filter(path => path.isFile)

        this.parentPathOptions = uniqBy(this.originPathList, 'parentPath')
          .map(item => { return { value: item.parentPath } })
      } catch (error) {
        console.error(error)
        return this.$alert('Datastore File 경로 조회에 문제가 발생했습니다.')
      } finally {
        this.isGetDatastore = false
      }
    },
    /**
     * family 변경 이벤트
     */
    changeParent (value) {
      this.path = ''
      this.pathOptions = this.originPathList?.filter(item => item.parentPath === value)
    },
    /**
     * 적용 버튼 클릭 시 emit
     */
    save () {
      if (!this.parentPath || !this.path) return

      const parentPath = this.parentPath
      const path = this.path

      const data = {
        parentPath,
        path,
        full: parentPath + path
      }

      this.$emit('save', data)
      this.resetOptions()
    },
    /**
     * 모든 데이터를 reset 합니다.
     */
    resetOptions (innerData) {
      this.parentPath = ''
      this.path = ''
      this.pathOptions = []
    },

    removeSyncData () {
      return this.$emit('save', null)
    }
  },
  data () {
    return {
      isGetDatastore: false,
      originPathList: [],
      parentPathOptions: [],
      pathOptions: [],
      parentPath: '',
      path: ''
    }
  }
}
</script>

<style lang="scss" scoped>

  .datastore-path-wrap {
    display: flex;
    flex-direction: column;
    > button { margin-right: $gap }
    .-reference {
      margin-top: 5px;
      color: $input-placeholder;
      span, &.-alert { color: $main-red; }
    }
    .datastore-path-add {
      // border: 1px solid pink;
      flex: 1 1 auto;
      display: flex;
      align-items: center;
      > h5 {
        font-size: 15px;
        height: 15px;
        margin-right: $gap;
      }
      > .select-family {
        flex: 1 1 auto;
        display: flex;
        align-items: center;
        .-family {
          width: 300px;
          margin-right: $gap-s;
        }
        .-version {
          width: 300px;
          margin-right: $gap-s;
        }
      }
    }
  }

  .datastore-path-tag { margin-top: $gap-s; }

.fade-enter-active, .fade-leave-active {
  transition: opacity .2s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
</style>
