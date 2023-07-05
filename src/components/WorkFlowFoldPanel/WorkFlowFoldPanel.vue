<!--
  * 파일명 : WorkFlowFoldPanel.vue
  * 파일 기능 : 워크플로우 체크리스트 foldable 패널
  * 작성자 : 김예담 외 1명
  * 최종 작성일 : 2021-02-19
  * License By Shinsegae I&C
  * 2021-02-19 업무 > 확인사항 수정
 -->

<template>
  <div
    :class="['workflow-fold-panel', {'-reverse': showFoldBody}]"
    :id="customId"
  >
    <!-- 편집모드 -->
    <label
      class="fold-header"
      v-if="data.edit"
    >
      <el-input
        :placeholder="data.title ? data.title : $t('common.ALERT.BASE.054')"
        v-model="data.title"
        @keydown.native="e => {
          if(e.key === 'Enter') toggleListEdit(data, false)
        }"
        @click.native="(e) => { e.stopPropagation() }"
      />
      <!-- @change="data.edit = false" -->
    </label>

    <label
      v-else
      :class="['fold-header', {'-active': data.isActive}, {'-with-tag': useTag && data.roleName}]"
      @click.stop="clickHeader"
    >
      <span
        :class="['role-name-tag', roleName(data.roleName)]"
        v-if="useTag && data.roleName"
      >{{ data.roleName }}</span>

      <div class="header-left">
        <a
          v-if="draggable"
          class="-draggable-icon"
          :class="[draggableIconClass]"
        />
        <slot name="header-prefix" />

        <el-tooltip
          v-if="foldable ? data.title.length > 12 : data.title.length > 15"
          :content="data.title"
          placement="top"
          effect="light"
        >
          <span
            class="header-title ellipsis-wrap"
            :class="{'-wide': !foldable}"
          >
            {{ data.title }}
          </span>
        </el-tooltip>
        <b
          v-else
          class="header-title"
        >
          {{ data.title }}
        </b>
      </div>
      <!-- /.header-left -->

      <div
        class="header-right"
        v-if="deletable || foldable"
      >
        <!-- <slot name="header-suffix" /> -->
        <a
          v-if="deletable"
          class="-delete-icon"
          @click.stop="clickDelete(data)"
        />
        <a
          v-if="foldable"
          :class="['header-arrow', showFoldBody? '-reverse' : '']"
        />
      </div>
      <!-- /.header-right -->
    </label>
    <!--///////////////////// /.fold-header ///////////////////////////-->

    <transition name="slide">
      <!-- 편집 모드 -->
      <section
        class="fold-body -edit -reverse"
        v-if="data.edit"
      >
        <div
          :class="['new-item-wrap', data.type]"
          v-for="(item,idx) in data.setList"
          :key="idx"
        >
          <el-input
            v-if="data.type==='text'"
            type="textarea"
            :placeholder="$t('common.ALERT.BASE.027')"
            v-model="data.setList[0].value"
            @keydown.native="e => {
              if(e.key === 'Enter') toggleListEdit(data)
            }"
            @click.native="(e) => { e.stopPropagation() }"
          />
          <!-- 편집: 텍스트 -->

          <div
            class="new-item-left"
            style="width: 100%;"
            v-else
          >
            <el-checkbox
              v-model="item.value"
              v-if="data.type==='checkbox'"
              @click.native="(e) => { e.stopPropagation() }"
            >
              <el-input
                v-model="item.title"
                style="width: calc(100% - 40px);"
                :placeholder="item.title? item.title : `option${idx + 1}`"
                @keydown.native="e => {
                  if (e.key === 'Enter') toggleListEdit(data)
                }"
                @click.native="(e) => { e.stopPropagation() }"
              />
            </el-checkbox>
            <!-- 편집: 체크박스 -->

            <!-- <el-radio-group
              v-model="item.value"
              v-else-if="data.type==='radio'"
            >
              <el-radio
                v-for="(child, index) in item.children"
                :key="index"
                :label="item.value"
                @click.native="(e) => { e.stopPropagation() }"
              >
                <el-input
                  class="edit-input"
                  v-model="child.title"
                  :placeholder="child.title? child.title : '옵션'"
                  @keydown.native="e => {
                    if(e.key === 'Enter') toggleListEdit(data, false)
                  }"
                  @click.native="(e) => { e.stopPropagation() }"
                />
              </el-radio>
            </el-radio-group> -->

            <template v-else-if="data.type==='radio'">
              <el-radio
                v-model="data.radioVal"
                @click.native="e => e.stopPropagation()"
                :label="idx + 1"
              >
                <el-input
                  class="edit-input"
                  v-model="item.value"
                  style="width: calc(100% - 20px);"
                  :placeholder="item.value? item.value : `option${idx + 1}`"
                  @keydown.native="e => {
                    if(e.key === 'Enter') toggleListEdit(data, false)
                  }"
                  @click.native="(e) => { e.stopPropagation() }"
                />
              </el-radio>
            </template>
            <!-- 편집: 라디오박스 -->

            <div v-else-if="data.type==='dropdown'">
              <div class="sub-list-header">
                <el-input
                  v-model="item.title"
                  :placeholder="item.title? item.title : 'Title'"
                  @keydown.native="e => {
                    if(e.key === 'Enter') toggleListEdit(data, false)
                  }"
                  @click.native="(e) => { e.stopPropagation() }"
                />
                <!-- <el-checkbox v-model="item.required">
                  필수
                </el-checkbox> -->
              </div>
              <ul class="check-sub-list">
                <li
                  class="sub-item"
                  v-for="(localItem, index) in item.children"
                  :key="index"
                >
                  <span style="min-width: 15px;">{{ index + 1 }}.&ensp;</span>
                  <el-input
                    class="sub-input"
                    v-model="localItem.title"
                    :placeholder="localItem.title? localItem.title : `option${index + 1}`"
                    @keydown.native="e => {
                      if(e.key === 'Enter') toggleListEdit(data, false)
                    }"
                    @click.native="(e) => { e.stopPropagation() }"
                  />
                  <button
                    class="button sub-add-btn -minus"
                    type="is-icon"
                    @click.stop="deleteDropdownOption(index, item.children)"
                  >
                    <i class="mdi mdi-minus" />
                  </button>
                  <button
                    class="button sub-add-btn -plus"
                    v-if="index === item.children.length - 1"
                    type="is-icon"
                    @click.stop="addCheckList(item.children, data.type)"
                  >
                    <i class="mdi mdi-plus-circle-outline" />
                  </button>
                </li>
                <!-- <a
                  v-if="data.edit && data.type !== 'text' && data.type !== 'file'"
                  class="new-item-right -delete"
                  @click.stop="deleteDropdownOption(idx, data)"
                /> -->
              </ul>
            </div>
            <!-- 편집: 드롭다운 -->

            <div v-else-if="data.type==='inputbox'">
              <div class="sub-list-header">
                <el-input
                  v-model="item.title"
                  style="width: calc(100% - 5px);"
                  :placeholder="item.title ? item.title : 'Title'"
                  @keydown.native="e => {
                    if(e.key === 'Enter') toggleListEdit()
                  }"
                  @click.native="(e) => { e.stopPropagation() }"
                />
                <!-- <el-checkbox v-model="item.required">
                  필수
                </el-checkbox> -->
              </div>
              <el-input
                v-model="item.value"
                placeholder="Text Box"
                style="margin-top: 5px;"
                @keydown.native="e => {
                  if(e.key === 'Enter') toggleListEdit()
                }"
                @click.native="(e) => { e.stopPropagation() }"
              />
            </div>
            <!-- 편집: 인풋박스 -->
          </div>
          <!-- /.new-item-left -->

          <button
            v-if="data.type == 'dropdown' ||
              data.type === 'inputbox' ||
              data.type === 'checkbox' ||
              data.type === 'radio'"
            class="button delete-btn"
            type="is-icon"
            @click.stop="deleteSetList(data, idx)"
          >
            <i class="delete-icon" />
          </button>
          <!-- type === 인풋박스 || 드롭다운 일 때만 노출되는 제거 버튼 -->
        </div>

        <a
          v-if="data.type !== 'text'"
          class="add-button"
          @click.stop="addCheckList(data.setList, data.type)"
        >
          <!-- 항목 추가 -->
          + {{ $t('common.BTN.addItem') }}
        </a>

        <el-upload
          v-else-if="data.type === 'file'"
          class="file-uploader"
          action=""
          accept=""
          :auto-upload="false"
          :multiple="true"
          :file-list="fileList"
        >
          <a
            class="add-button"
          >
            <!-- @click.stop="addCheckList(data.setList)" -->
            + {{ $t('common.BTN.addItem') }}
          </a>
        </el-upload>
      </section>

      <!-- 일반 -->
      <section
        v-else
        class="fold-body"
        v-show="showFoldBody"
      >
        <slot>
          <el-radio
            v-if="data.type==='radio'"
            style="margin-bottom: 10px;"
            v-model="data.radioVal"
            label=""
            @click.native="(e) => { e.stopPropagation() }"
          >
            선택 안 함
          </el-radio>
          <ul
            class="fold-check-list"
            v-if="isCheckList"
          >
            <li
              class="fold-check-item"
              v-for="(item, idx) in data.setList"
              :key="idx"
              style="width: 100%;"
            >
              <template v-if="data.type==='checkbox'">
                <!-- v-if="!item.writable" -->
                <el-checkbox
                  v-model="item.value"
                  @click.native="(e) => { e.stopPropagation() }"
                >
                  {{ item.title }}
                </el-checkbox>

                <!-- <el-checkbox
                  v-else
                  v-model="item.value"
                  @click.native="(e) => { e.stopPropagation() }"
                >
                  <el-input
                    v-model="item.title"
                    :placeholder="item.title? item.title : 'option'"
                    @click.native="(e) => { e.stopPropagation() }"
                  />
                </el-checkbox> -->
              </template>
              <!-- 체크박스 -->

              <template v-else-if="data.type==='radio'">
                <el-radio
                  v-model="data.radioVal"
                  @click.native="e => e.stopPropagation()"
                  :label="idx + 1"
                >
                  {{ item.value }}
                </el-radio>
              </template>
              <!-- 라디오 -->

              <div
                v-else-if="data.type==='dropdown'"
                style="width: 100%;"
              >
                <p style="margin-bottom: 5px; font-weight: bold;">
                  {{ item.title }}
                </p>
                <el-select
                  v-model="item.radioVal"
                  style="width: 100%;"
                  :placeholder="$t('common.BTN.select')"
                >
                  <el-option
                    label="선택"
                    value=""
                  />
                  <el-option
                    v-for="option in item.children"
                    :key="option.title"
                    :label="option.title"
                    :value="option.title"
                  />
                </el-select>
              </div>
              <!-- 드롭다운 -->

              <div
                v-else-if="data.type==='inputbox'"
                style="width: 100%;"
              >
                <p style="margin-bottom: 5px; font-weight: bold;">
                  {{ item.title }}
                </p>
                <el-input
                  v-model="item.value"
                  :disabled="!data.edit && !item.writable"
                  placeholder="Text Box"
                  style="width: 100%;"
                  @keydown.native="e => {
                    if(e.key === 'Enter') toggleListEdit()
                  }"
                  @click.native="(e) => { e.stopPropagation() }"
                />
              </div>
              <!-- inputbox -->

              <el-input
                v-else-if="data.type==='text'"
                v-model="item.value"
                type="textarea"
                :placeholder="$t('common.ALERT.BASE.027')"
                :disabled="!data.edit && !item.writable"
                @keydown.native="e => {
                  if(e.key === 'Enter') toggleListEdit()
                }"
                @click.native="(e) => { e.stopPropagation() }"
              />
              <!-- 텍스트 -->
            </li>
          </ul>
          <work-flow-auth-tree
            v-else-if="data.setList"
            :data="data.setList"
            :work-flow-task-execute-perm="data.workFlowTaskExecutePerm"
            @workFlowTaskExecutePerm="toggleAllReadable"
            :is-clicked="data.isClicked"
            :is-check-list="data.isCheckList"
          />
        </slot>
      </section>
    </transition>
  </div>
</template>
<script>
import WorkFlowAuthTree from '@/components/WorkFlowAuthTree/WorkFlowAuthTree'

export default {
  name: 'WorkFlowFoldPanel',
  components: {
    'work-flow-auth-tree': WorkFlowAuthTree
  },
  props: {
    data: {
      type: Object,
      default: () => {}
    },
    foldable: {
      type: Boolean,
      default: true
    },
    foldState: { // 'on', 'close'
      type: String,
      default: 'close'
    },
    deletable: { // 삭제 가능한지?
      type: Boolean,
      default: true
    },
    draggable: {
      type: Boolean,
      default: true
    },
    useTag: {
      type: Boolean,
      default: false
    },
    customId: { // id를 지정
      type: String,
      default: null
    },
    draggableIconClass: { // 드래그 아이콘에 클래스 추가하려면 사용합니다.
      type: String,
      default: ''
    },
    isCheckList: { // 체크리스트인지 확인
      type: Boolean,
      default: false
    }
  },
  watch: {
    foldState: {
      handler (newVal, oldVal) {
        if (newVal === 'on') this.showFoldBody = true
        else this.showFoldBody = false
      },
      deep: true,
      immediate: true
    },
    data (newVal) {
      // this.panelData = JSON.parse(JSON.stringify(newVal))
    }
  },
  created () {
    if (typeof window !== 'undefined' && this.customId) {
      // document.addEventListener('click', this.clickElements)
    }
    this.setInitData()
    // this.panelData = JSON.parse(JSON.stringify(newVal))
  },
  beforeDestroy () {
    if (typeof window !== 'undefined' && this.customId) {
      // document.removeEventListener('click', this.clickElements)
    }
  },
  // mounted () {
  //   if (this.foldState === 'on') this.showFoldBody = true
  //   else this.showFoldBody = false
  // },

  methods: {
    setInitData () {
      this.$set(this.data, 'isActive', false)
    },
    clickDelete () {
      this.$emit('delete')
    },
    clickHeader () {
      if (this.foldable) this.showFoldBody = !this.showFoldBody
      else {
        this.data.isActive = !this.data.isActive
        this.$emit('click', this.data.isActive)
        this.$forceUpdate()
      }
    },
    /**
     * [항목 추가] 시, 체크리스트 추가
     */
    addCheckList (list, type) {
      // if (type === 'radio') {
      // list[0].children.push({ value: '', title: '' })
      // } else {
      const children = (type === 'dropdown') ? [{ title: '' }] : undefined
      // const radioVal = (type === 'radio') ? '' : null
      const item = {
        // value: (type === 'radio') ? 0 : '',
        value: '',
        title: '',
        // radioVal: radioVal,
        children: children
      }
      this.$nextTick(() => { list.push(item) })
      // }
    },
    /**
     * 확인사항에 해당 아이템을 삭제합니다.
     * @param {Number} idx 지우려는 아이템의 인덱스
     * @param {data} Array 총 데이터
     */
    deleteDropdownOption (idx, list) {
      if (list?.length <= 1) return this.$alert(this.$t('common.ALERT.APPROVAL.013')) // 항목은 1개 이상 필요합니다.
      else {
        this.$confirm(this.$t('common.CONFIRM.BASE.032')) // 해당 항목을 삭제하시겠습니까?
          .then(() => {
            list.splice(idx, 1)
          }).catch(() => {
            return false
          })
      }
    },
    /**
     * 편집 상태를 설정합니다.
     * @param {Object} data 편집 상태 토글 할 대상
     * @param {Boolean} state 편집 상태
     */
    toggleListEdit (data = this.data, state) {
      if (data.edit) {
        if (this.isEmptyData(data)) return this.$alert(this.$t('common.ALERT.BASE.037')) // 빈 칸을 채워주세요.
      }
      if (typeof state === 'boolean') data.edit = state
      else data.edit = !data.edit
    },
    /**
     * 편집 완료 전, 빈 값이 있는지 확인합니다.
     * @return {Boolean} true: 빈 값이 있음
     */
    isEmptyData (data) {
      if (!data.title) return true

      for (let i = 0; i < data.setList.length; i++) {
        if (data.type === 'text') continue

        if (data.type !== 'radio' && (!data.setList[i].title || !data.setList[i].value)) return true

        if (!['text', 'checkbox', 'dropdown', 'inputbox'].includes(data.type) && !data.setList[i].value) return true

        if (data.setList[i].children?.length &&
          !data.setList[i].children.every(item => item.title)) return true
      }

      return false
    },
    roleName (name = '미정') {
      return {
        서버: 'server',
        네트워크: 'network',
        보안: 'security',
        미정: 'undefined'
      }[name]
    },
    toggleAllReadable (paramState) {
      this.$set(this.data, 'workFlowTaskExecutePerm', paramState)
      this.$emit('workFlowTaskExecutePerm', this.data, paramState)
    },
    clickElements (e) {
      e.stopPropagation()
      if (!this.isInArea(e.target)) this.toggleListEdit(this.data, false)
    },
    isInArea (el) {
      const elCustomId = document.querySelector(`#${this.customId}`)
      if (el === elCustomId) return true
      if (elCustomId) {
        const children = elCustomId.querySelector('*')
        for (const child of children) {
          if (el === child) return true
        }
      }
      return false
    },
    /**
     * setList에 항목을 삭제합니다.
     */
    deleteSetList (data, idx) {
      console.log('@@@@@@@@@@@@', data)

      if (data.type === 'radio' && data.setList?.length <= 2) return this.$alert(this.$t('common.ALERT.APPROVAL.011')) // 라디오항목은 최소 2개가 필요합니다.

      else if (data.setList.length === 1) {
        return this.$alert(this.$t('common.ALERT.APPROVAL.013')) // 항목은 1개 이상 필요합니다.
      } else {
        this.$confirm(this.$t('common.CONFIRM.BASE.032')) // 해당 항목을 삭제하시겠습니까?
          .then(() => {
            data.setList.splice(idx, 1)
          }).catch(() => {
            return false
          })
      }
    },
    alert (message, callback) {
      this.$alert(message, '', {
        callback: callback,
        dangerouslyUseHTMLString: true
      })
    }

  },
  data () {
    return {
      showFoldBody: undefined,
      dragItem: '',
      newTitle: '',
      // newCheckList: [{ value: 'checkList_1', title: '' }],
      radio: '',
      fileList: []
    }
  }
}
</script>
<style lang="scss" src="./WorkFlowFoldPanel.scss" />
