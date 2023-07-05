<!--
  * 파일명 : MemoWriterModal.vue
  * 파일 기능 : 메모를 작성할 수 있는 모달입니다. [사전협의 상세]에서는 사용되지 않습니다.
  * 작성자 : 정재은 외 1명
  * 최종 작성일 : 2021-02-17
  * License By Shinsegae I&C
  * 2021-02-17 Add: 메모이력에 메모 등록시 스크롤 top 이동하도록 추가
 -->

<template>
  <div
    v-if="isActive"
    :class="['memo-writable-section', `-${size}`]"
  >
    <a
      :class="[size === 'mini' ? '' : 'closebtn mdi mdi-window-close']"
      @click="close"
    />
    <i
      class="icon-bubble"
      v-if="size === 'mini'"
    />

    <p
      class="memo-title"
      v-else
    >
      <!-- 메모 {{ modifyType === 'write' ? '쓰기' : '수정' }} -->
      {{ $t('task.TODO.DETAIL.writeNote') }}
    </p>

    <!-- <section class="memo-section"> -->
    <article class="memo-area">
      <h6 class="skip-article-header">
        메모 입력 영역
      </h6>

      <el-input
        v-model="memoContents"
        class="memo-textarea"
        @keyup.native.enter="confirm"
        ref="textarea"
      />
      <!-- 👀 @mention 기능이 있을 경우 사용합니다. (아직은 기능이 없어요)-->
      <editor-content
        v-if="false"
        :editor="editor"
        ref="editorBoby"
        class="memo-textarea"
      />
      <!-- /. 👀 @mention 기능이 있을 경우 사용합니다. (아직은 기능이 없어요)-->
      <button
        class="register-comment button"
        type="is-primary"
        style="margin-left: 10px;"
        @click="confirm"
      >
        {{ $t('task.STATE.confirm') }}
        <!-- 확인 -->
      </button>
    </article>
    <!-- /.memo-area -->

    <div
      class="suggestion-list"
      v-show="showSuggestions"
      ref="suggestions"
    >
      <template v-if="hasResults">
        <div
          v-for="(user, index) in filteredUsers"
          :key="user.id"
          class="suggestion-list__item"
          :class="{ 'is-selected': navigatedUserIndex === index }"
          @click="selectUser(user)"
        >
          {{ user.name }}
        </div>
      </template>
      <div
        v-else
        class="suggestion-list__item is-empty"
      >
        {{ $t('task.PRIOR.DETAIL.noResult') }}
      </div>
    </div>

    <!-- </section> -->
  </div>
</template>

<script>

import Fuse from 'fuse.js' // License - available to use in Commercial Project
import tippy, { sticky } from 'tippy.js'
import 'tippy.js/dist/tippy.css'
import 'tippy.js/animations/scale-subtle.css'
import { Editor, EditorContent } from 'tiptap'
import { Placeholder, Blockquote, Mention, CodeBlock, HardBreak, Heading, HorizontalRule, OrderedList, BulletList, ListItem, TodoItem, TodoList, Bold, Code, Italic, Link, Strike, Underline, History, Table, TableHeader, TableCell, TableRow } from 'tiptap-extensions'

export default {
  props: {
    active: {
      type: Boolean,
      default: false
    },
    modifyType: {
      type: String,
      default: 'write',
      validator (value) {
        return ['write', 'reply'].includes(value) // 수정은 없습니다..
      }
    },
    size: { // 'mini' - 컴포넌트 하단에 표시합니다
      type: String,
      default: undefined // 기본적으로 fixed 입니다.
    },
    commentData: {
      type: Object,
      default: () => {}
    }
  },
  watch: {
    active (newVal) {
      this.isActive = newVal
      if (!newVal) this.memoContents = ''
      else this.focusOn()
      // console.log(this.modifyType, '----')
    },
    isActive (newVal) {
      this.active = newVal
    },
    json (conts) {
      // json으로 내보냅니다.
      // console.log(conts)
      // this.$emit('edited-contents', conts)
    }
  },
  components: {
    'editor-content': EditorContent
    // 'editor-menu-bar': EditorMenuBar
  },
  created () {
    if (typeof window !== 'undefined') {
      document.addEventListener('keyup', this.keyPress)
    }
  },
  beforeDestroy () {
    this.destroyPopup()
    this.editor.destroy()

    if (typeof window !== 'undefined') {
      document.removeEventListener('keyup', this.keyPress)
    }
  },
  computed: {
    hasResults () {
      return this.filteredUsers.length
    },
    showSuggestions () {
      return this.query || this.hasResults
    }
  },
  methods: {
    confirm () {
      if (!this.timeout) {
        this.timeout = true
        this.$emit('save-memo', this.memoContents)

        this.timeout = setTimeout(() => {
          this.timeout = false
        }, 500)
      }
    },
    close () {
      this.editor.content = ''
      this.$emit('closeMemoWriter')
    },

    // -----
    // -----
    // -----
    // -----

    /**
     * @function
     * suggestion시 popup이 입력됩니다.
     */
    suggestionPopUp (node) {
      if (this.popup) return

      // this.popup = tippy('.mention', { // 뒤에 append..
      return tippy('.memo-textarea', {
        getReferenceClientRect: node.getBoundingClientRect,
        interactive: true,
        sticky: true,
        plugins: [sticky],
        content: this.$refs.suggestions,
        trigger: 'focusin',
        showOnCreate: true,
        theme: 'dark',
        placement: 'top-start',
        inertia: true,
        duration: [200, 200],
        animation: 'scale-subtle',
        arrow: false,
        appendTo: 'parent'
        // appendTo: () => document.body
      })
    },
    suggestionUpHandler () {
      this.navigatedUserIndex = ((this.navigatedUserIndex + this.filteredUsers.length) - 1) % this.filteredUsers.length
    },
    suggestionDownHandler () {
      this.navigatedUserIndex = (this.navigatedUserIndex + 1) % this.filteredUsers.length
    },
    suggestionEnterHandler () {
      const user = this.filteredUsers[this.navigatedUserIndex]
      if (user) this.selectUser(user)
    },
    /**
     * @function - suggestion 사용시 해당 유저 선택
     * @param {Object} - 유저 정보
     */
    selectUser (user) {
      this.insertMention({
        range: this.suggestionRange,
        attrs: {
          id: user.id,
          label: user.name
        }
      })
      this.editor.focus()
    },
    destroyPopup () {
      if (this.popup) {
        this.popup[0].destroy()
        this.popup = null
      }
    },
    keyPress (e) {
      if (e.keyCode === 27) this.close()
    },
    focusOn () {
      setTimeout(() => {
        const memoWrap = this.$refs.textarea.$el
        const input = memoWrap.querySelector('input')
        input.focus()
      }, 10)
    }
  },
  data () {
    return {
      // html: 'Update content to see changes', // HTML으로 내보낼때 사용하세요.
      timeout: false,
      isActive: this.active || false,
      json: '',
      query: null,
      suggestionRange: null,
      filteredUsers: [],
      navigatedUserIndex: 0,
      popup: null,
      memoContents: '',
      insertMention: () => {},
      editor: new Editor({
        content: '',
        extensions: [
          new Blockquote(),
          new BulletList(),
          new CodeBlock(),
          new HardBreak(),
          new Heading({ levels: [1, 2, 3] }),
          new HorizontalRule(),
          new ListItem(),
          new OrderedList(),
          new TodoItem(),
          new TodoList(),
          new Link(),
          new Bold(),
          new Code(),
          new Italic(),
          new Strike(),
          new Underline(),
          new History(),
          new Table({ resizable: true }),
          new TableHeader(),
          new TableCell(),
          new TableRow(),
          new Placeholder({
            emptyEditorClass: 'is-editor-empty',
            emptyNodeClass: 'is-empty',
            emptyNodeText: this.$t('common.ALERT.BASE.027'),
            showOnlyWhenEditable: true,
            showOnlyCurrent: true
          }),
          // new Image(),
          new Mention({
            // 관리자들의 데이터입니다.
            items: () => [
              { id: 1, name: '김네네' },
              { id: 2, name: '박서버' },
              { id: 3, name: '최동동' },
              { id: 4, name: '이봉봉' },
              { id: 5, name: '김오오' },
              { id: 6, name: '최염염' },
              { id: 7, name: '조냠냠' }
            ],
            // suggestion이 실행되고있을 때, enter 클릭시 일어납니다.
            onEnter: ({ items, query, range, command, virtualNode }) => {
              this.query = query
              this.filteredUsers = items
              this.suggestionRange = range
              this.suggestionPopUp(virtualNode)
              this.insertMention = command
            },
            // suggestion이 변경될때 일어납니다.
            onChange: ({ items, query, range, virtualNode }) => {
              this.query = query
              this.filteredUsers = items
              this.suggestionRange = range
              this.navigatedUserIndex = 0
              this.suggestionPopUp(virtualNode)
            },
            // suggestion 사용을 끝낼때 일어납니다.
            onExit: () => {
              this.query = null
              this.filteredUsers = []
              this.suggestionRange = null
              this.navigatedUserIndex = 0
              // this.destroyPopup()
            },
            // suggestion을 사용할 때 keyDown event가일어날때 호출됩니다.
            onKeyDown: ({ event }) => {
              // 키보드 ▲ 를 눌렀을 때 발생
              if (event.key === 'ArrowUp') {
                this.suggestionUpHandler()
                return true
              }
              // 키보드 ▼ 를 눌렀을 때 발생
              if (event.key === 'ArrowDown') {
                this.suggestionDownHandler()
                return true
              }
              if (event.key === 'Enter') {
                this.suggestionEnterHandler()
                return true
              }
              return false
            },
            // suggestion 실행시 필터링시 동작합니다.
            onFilter: (items, query) => {
              if (!query) return items

              const fuse = new Fuse(items, {
                threshold: 0.2,
                keys: ['name']
              })

              // console.log(fuse.search(query).map(item => item.item), '---필터링된 결과')
              return fuse.search(query).map(item => item.item)
            }
          })
        ],
        onUpdate: ({ getJSON, getHTML }) => {
          // this.html = getHTML() // html로 내보낼 경우 사용하세요.
          this.json = getJSON()
        }
      })
    }
  }
}
</script>

<style lang="scss">
.memo-writable-section {
  position: fixed;
  bottom: $gap;
  left: $gap * 2;
  right: $gap * 2;
  margin: 0 auto;
  z-index: $alert-z-index;
  max-width: 1400px;
  background-color: $dark-gray;
  padding: $gap-m $gap*2;
  border-radius: $radius-m;
  border: 2px solid $border-color;

  &.-mini {
    display: flex;
    align-items: center;
    position: initial;
    margin-left: 0;
    width: 100%;
    height: 100%;
    padding: $gap;
    box-sizing: border-box;
    border-radius: $radius-s;
  }

  .memo-title {
    display: block;
    font-size: 14px;
    font-weight: bold;
    margin-bottom: $gap;
  }

   > .closebtn {
    position: absolute;
    top: $gap;
    right: $gap;
    cursor: pointer;
    &::before {
      // color: $color-black;
      font-size: 25px;
    }
  }

  > .icon-bubble {
    display: inline-block;
    margin-right: $gap-s;
    width: 22px;
    height: 21px;
    background-position: center;
    background-size: contain;
    background-repeat: no-repeat;
    background-image: url('../../../../assets/images/icon-bubble@3x.png');
  }

  .memo-area {
    display: flex;
    align-items: center;
    position: relative;
    width: 100%;
    height: 100%;
    .memo-textarea {
      overflow-y: auto;
      box-sizing: border-box;
      color: $white;
      // text-indent: 10px;
      background-color: $white;
      border-radius: $radius-s;
      border: 1px solid $input-stroke;
      width: calc(100% - 20px);
      max-height: 80px;

      // TIPTAP -----------------
      .ProseMirror {
        // height: px;
        overflow-y: auto;
        // width: 200px;
        line-height: 1.5;
        padding: 5px;
        background: $white;
        color: $text-black;

        &:focus {
          outline: none;
          background: $white;
        }

        code,
        .mention {
          background: rgba(#333, 0.1);
          color: #333;
          font-size: 0.8rem;
          font-weight: bold;
          border-radius: 5px;
          padding: 0.2rem 0.5rem;
          white-space: nowrap;
        }

        .mention-suggestion {
          color: rgba(#333, 0.6);
        }
      }
    }
    .editor-menubar {
      display: flex;
      flex-wrap: wrap;
      margin-bottom: $gap-s;
      background-color: $black;

      .menubar-button {
        padding: 0;
        height: 35px;
        margin-left: -1px;
        min-width: 40px;
        &.is-active {
          background-color: #eee;
        }
      }
    }
  }

  // .memo-section {
  //   height: 80px;
  //   display: flex;

  //   .memo-area {
  //     position: relative;
  //     height: 100%;
  //     .editor-menubar {
  //       display: flex;
  //       flex-wrap: wrap;
  //       margin-bottom: $gap-s;

  //       .menubar-button {
  //         padding: 0;
  //         height: 35px;
  //         margin-left: -1px;
  //         min-width: 40px;
  //         &.is-active {
  //           background-color: #eee;
  //         }
  //       }
  //     }
  //   }

  //   > .register-comment {
  //     border: none;
  //     flex: 0 0 13.8%;
  //     margin-left: $gap-s;
  //     height: 95px;
  //     cursor: pointer;
  //     border-radius: $radius-m;
  //     background-color: $primary;
  //   }
  // }
}

.is-editor-empty:first-child::before {
  content: attr(data-empty-text);
  float: left;
  color: #aaa;
  pointer-events: none;
  height: 0;
}
</style>

<style lang="scss">
  .memo-textarea {
    &.el-input {
      border: 1px solid red;
      box-sizing: border-box;
      resize: none;
      background-color: $background-color;
      border-radius: $radius;
      overflow: hidden;
      width: calc(100% - 100px);

      > .el-input__inner {
        border: none;
        color: $color-black;
        height: 32px;
        // &::placeholder {
        //   color: $input-placeholder;
        //   line-height: $gap;
        // }
      }
    }

    // TIPTAP -----------------
    .ProseMirror {
      // height: px;
      overflow-y: auto;
      width: 100%;
      line-height: 1.5;
      padding: 5px;

      &:focus {
        outline: none;
        background: $white;
        color: $text-black;
      }

      code,
      .mention {
        background: rgba(#333, 0.1);
        color: #333;
        font-size: 0.8rem;
        font-weight: bold;
        border-radius: 5px;
        padding: 0.2rem 0.5rem;
        white-space: nowrap;
      }

      .mention-suggestion {
        color: rgba(#333, 0.6);
      }
    }
  }

// Tiptap suggestion
$color-black: #333;

.suggestion-list {
  padding: 0.2rem;
  font-size: 0.8rem;
  font-weight: bold;
  color: $color-black;
  &__no-results {
    padding: 0.2rem 0.5rem;
  }
  &__item {
    border-radius: 5px;
    padding: 0.2rem 0.5rem;
    margin-bottom: 0.2rem;
    cursor: pointer;
    &:last-child {
      margin-bottom: 0;
    }
    &.is-selected,
    &:hover {
      color: $white;
      background-color: #444;
    }
    &.is-empty {
      opacity: 0.5;
    }
  }
}

.tippy-box[data-theme~=dark] {
  background-color: #dfdfdf;
  padding: 0;
  font-size: 1rem;
  text-align: inherit;
  color: $white;
  border-radius: 5px;
}

</style>
