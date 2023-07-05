<!--
  * 파일명 : g-input-tags.vue
  * 파일 기능 :
  * 작성자 : 김예담 외 2명
  * 최종 작성일 : 2021-02-17
  * License By Shinsegae I&C
  * 2021-02-17 [자원 이관 - Volumegroup] 데이터 세팅
 -->

<template>
  <div>
    <!-- 태그를 해당 이벤트로 입력해서 추가합니다. -->
    <ul>
      <li
        v-for="(tagName, idx) in tagData"
        :key="idx"
      >
        <!-- fixed 태그이고, 변경 불가능 이유를 툴팁으로 보여주기 위함 -->
        <el-tooltip
          :disabled="!tagName.fixed
            || (tagName.fixed && typeof tagName.fixed !== 'string')"
          :content="tagName.fixed"
          effect="light"
          placement="top"
        >
          <div class="tag-rmv-wrap">
            <span
              @click="selectTag(tagName,idx)"
              :style="!tagName.fixed && 'cursor: pointer;'"
            >
              <span
                v-if="onlyVolume"
                class="tag-name"
              >
                <!-- 예시 :: 200 GB -->
                {{ tagName.data }}
              </span>
              <span
                v-else-if="isWindow"
                class="tag-name"
              >
                <!-- 예시 :: C:/ : 200 GB -->
                {{ tagName.name }} : {{ tagName.data }}
              </span>
              <span
                v-else
                class="tag-name"
              >
                <!-- 예시 :: /app : 200 GB -->
                {{ tagName.name }} : {{ tagName.data }}
              </span>
            </span>

            <i
              v-if="!tagName.default && !tagName.fixed"
              class="tag-rmv mdi mdi-close"
              @click="removeTags(idx)"
            />
          </div>
        </el-tooltip>
      </li>
    </ul>

    <!-- </form> -->
  </div>
</template>

<script>
export default {
  props: {
    tagData: {
      type: Array,
      default: () => []
    },
    onlyVolume: {
      type: Boolean,
      default: false
    },
    isWindow: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    selectTag (tag, idx) {
      this.$emit('select-data', tag, idx)
    },
    removeTags (idx) {
      this.tagLists = [...this.tagData]
      this.tagLists.splice(idx, 1)
      this.$emit('emit-data', this.tagLists)
    }
  },
  data () {
    return {
      tagLists: []
    }
  }
}
</script>

<style lang="scss" scoped>
  ul {
    li {
      display: inline-block;
      margin-right: 15px;
      background-color: $main-gray;
      padding: 0 12px;
      height: 31px;
      line-height: 31px;
      border-radius: 20px;
      position: relative;

      .tag-rmv-wrap {
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .tag-name {
        display:block;
        float:left;
        line-height: 30px;
        font-size: 13px;
        color: $white;
      }
        .tag-rmv {
          display: block;
          float:left;
          cursor: pointer;
          margin-left: 9px;
          width: 8px;
          height: 32px;
          position: relative;
          &:before {
            display: block;
            line-height: 30px;
            color: $main-red;
            font-size: 10px;
            font-weight: bold;
          }
        }
    }
  }
</style>
