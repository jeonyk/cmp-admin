<!--
  * 파일명 : Editor.vue
  * 파일 기능 :
  * 작성자 : 정재은 외 1명
  * 최종 작성일 : 2020-11-11
  * License By Shinsegae I&C
  * 2020-11-11 Update: 공지사항 등록일 필터링 수정
 -->

<template>
  <div
    class="cmp-editor"
    :class="{ 'is-edit': edit }"
  >
    <editor-menu-bar
      :editor="editor"
      v-slot="{ commands, isActive }"
    >
      <div
        class="editor-menubar"
        v-show="edit"
      >
        <button
          class="button menubar-button"
          :class="{ 'is-active': isActive.bold() }"
          @click="commands.bold"
        >
          <i class="mdi mdi-format-bold" />
        </button>

        <button
          class="button menubar-button"
          :class="{ 'is-active': isActive.italic() }"
          @click="commands.italic"
        >
          <i class="mdi mdi-format-italic" />
        </button>

        <button
          class="button menubar-button"
          :class="{ 'is-active': isActive.strike() }"
          @click="commands.strike"
        >
          <i class="mdi mdi-format-strikethrough" />
        </button>

        <button
          class="button menubar-button"
          :class="{ 'is-active': isActive.underline() }"
          @click="commands.underline"
        >
          <i class="mdi mdi-format-underline" />
        </button>

        <button
          class="button menubar-button"
          :class="{ 'is-active': isActive.code() }"
          @click="commands.code"
        >
          <i class="mdi mdi-code-tags" />
        </button>

        <!-- <button
          class="button menubar-button"
          :class="{ 'is-active': isActive.paragraph() }"
          @click="commands.paragraph"
        >
          <i class="mdi mdi-text" />
        </button> -->

        <button
          class="button menubar-button"
          :class="{ 'is-active': isActive.bullet_list() }"
          @click="commands.bullet_list"
        >
          <i class="mdi mdi-format-list-bulleted" />
        </button>

        <button
          class="button menubar-button"
          :class="{ 'is-active': isActive.ordered_list() }"
          @click="commands.ordered_list"
        >
          <i class="mdi mdi-format-list-numbered" />
        </button>

        <button
          class="button menubar-button"
          :class="{ 'is-active': isActive.blockquote() }"
          @click="commands.blockquote"
        >
          <i class="mdi mdi-format-quote-close" />
        </button>

        <button
          class="button menubar-button"
          @click="commands.horizontal_rule"
        >
          <i class="mdi mdi-minus" />
        </button>

        <template v-if="availableAlignment">
          <button
            class="button menubar-button"
            :class="{ 'is-active': isActive.alignment({ textAlign: 'left' }) }"
            @click="commands.alignment({ textAlign: 'left' })"
          >
            <i class="mdi mdi-format-align-left" />
          </button>

          <button
            class="button menubar-button"
            :class="{ 'is-active': isActive.alignment({ textAlign: 'center' }) }"
            @click="commands.alignment({ textAlign: 'center' })"
          >
            <i class="mdi mdi-format-align-center" />
          </button>

          <button
            class="button menubar-button"
            :class="{ 'is-active': isActive.alignment({ textAlign: 'right' }) }"
            @click="commands.alignment({ textAlign: 'right' })"
          >
            <i class="mdi mdi-format-align-right" />
          </button>
        </template>

        <el-upload
          v-if="availableImage"
          class="button menubar-button"
          action=""
          multiple
          ref="uploadImage"
          :auto-upload="false"
          :show-file-list="false"
          :on-change="changeUploadFiles"
          accept="image/jpeg, image/png, image/jpg"
        >
          <i class="mdi mdi-image" />
        </el-upload>

        <!-- <button
          class="button menubar-button"
          @click="commands.undo"
        >
          <i class="mdi mdi-undo" />
        </button>

        <button
          class="button menubar-button"
          @click="commands.redo"
        >
          <i class="mdi mdi-redo" />
        </button> -->
      </div>
    </editor-menu-bar>

    <editor-content
      :editor="editor"
      ref="editorBoby"
      :class="['editor-body', { edit }]"
    />
  </div>
</template>

<script>
import { Editor, EditorContent, EditorMenuBar } from 'tiptap'
import {
  Blockquote,
  CodeBlock,
  Focus,
  HardBreak,
  Heading,
  HorizontalRule,
  OrderedList,
  BulletList,
  ListItem,
  TodoItem,
  TodoList,
  Bold,
  Code,
  Italic,
  Link,
  Strike,
  Underline,
  History,
  Table,
  TableHeader,
  TableCell,
  TableRow,
  Image
} from 'tiptap-extensions'
import { Alignment } from './EditorExtend'

export default {
  name: 'Editor',
  components: {
    EditorMenuBar,
    EditorContent
  },
  props: {
    setContent: {
      type: String,
      default: undefined
    },
    edit: {
      type: Boolean,
      default: true
    },
    // 이미지 추가 기능
    availableImage: {
      type: Boolean,
      required: false,
      default: false
    },
    // 정렬 기능
    availableAlignment: {
      type: Boolean,
      required: false,
      default: false
    },
    // 이미지 업로드를 부모애서 처리
    customImageUpload: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  watch: {
    json (conts) {
      // json으로 내보냅니다.
      this.$emit('edited-contents', conts)
    },
    edit (isEditing) {
      this.editor.setOptions({ editable: isEditing })
      this.$forceUpdate()
    },
    setContent (cont) {
      if (cont) {
        this.editor.setContent(JSON.parse(this.setContent))
        this.$emit('edited-contents', JSON.parse(this.setContent))
      }
    }
  },
  created () {
    if (this.setContent) {
      this.json = JSON.parse(this.setContent)
      this.html = this.editor.getHTML()
      this.editor.setContent(JSON.parse(this.setContent))
      this.$emit('edited-contents', JSON.parse(this.setContent))
    }
  },
  mounted () {
    this.editor.setOptions({ editable: this.edit })
  },
  beforeDestroy () {
    this.editor.destroy()
  },
  methods: {
    changeUploadFiles (file, fileList) {
      if (file.size > (1024 * 1024 * 100)) { // 100Mb 이하 파일만 업로드 가능
        return this.$alert(this.$t('common.ALERT.PROJECT.059', { size: '100Mb' }))
      }

      if (this.customImageUpload) {
        this.$emit('upload-image', file, fileList, this.editor)
        return
      }
      // 업로드된 이미지를 base64로 변환하여 에디터에 넣는다.
      // 큰 이미지를 포함하는 게시글의 경우 base64를 포함한 데이터를
      // 응답받기까지 그 용량만큼의 매우 긴 시간이 걸리기 때문에
      // 서버에 이미지 파일을 업로드하고 업로드된 파일 이름으로 src를 지정해야 될 것으로 보임
      if (!this.availableImage) return
      const reader = new FileReader()
      reader.readAsDataURL(file.raw)
      reader.onload = () => {
        this.editor.commands.image({ src: reader.result })
      }
    }
  },
  data () {
    return {
      contents: undefined,
      html: '',
      json: '',
      editor: new Editor({
        extensions: [
          new Blockquote(),
          new BulletList(),
          new CodeBlock(),
          new Focus({
            className: 'has-focus',
            nested: true
          }),
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
          new Image(),
          new Alignment()
        ],
        content: this.setContent ? JSON.parse(this.setContent) : undefined,
        onUpdate: ({ getJSON, getHTML }) => {
          this.html = getHTML()
          this.json = getJSON()
        }
      })
    }
  }
}
</script>

<style lang="scss">
.cmp-editor {
  width: 100%;
  box-sizing: border-box;
  .editor-menubar {
    display: flex;
    flex-wrap: wrap;
    padding: 0 0 $gap-s 0;
    .menubar-button {
      padding: 0;
      height: 35px;
      margin-left: -1px;
      min-width: 40px;
      background-color: transparent;
      color: $white;
      border: 1px solid $input-stroke;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: $radius-s;
      cursor: pointer;

      &:hover {
        background-color: $input-stroke;
      }
      &.is-active {
        background: $input-placeholder;
      }
    }
  }
  .editor-body {
    overflow: auto;
    margin-bottom: $gap-s;
    list-style: auto;
    border-radius: $radius-s;
    cursor: auto;

    > .ProseMirror {
      min-height: 50vh;
       *::-webkit-resizer {
        display: block;
      }
    }

    &.edit {
      border: 1px solid $input-stroke;

      .ProseMirror {
        padding: $gap;
        min-height: 500px;
        &:focus {
          outline: none;
          background: $white;
          color: $text-black;

          hr { background: $color-ticket-cont; }
          blockquote { background: $light-blue; }
          code { background: $color-ticket-cont; }
        }
      }
    }

  }

  .ProseMirror {
    min-height: 100px;
    box-sizing: border-box;
    display: block;
    outline: none;
    cursor: auto;
    font-size: 14px;
    font-weight: normal;

    & [contenteditable="false"] {
      white-space: normal;
    }

    & [contenteditable="true"] {
      white-space: pre-wrap;
    }

    hr {
      margin: $gap-m 50px;
      border:none;
      height: 1px;
      background: $main-gray;
    }
    blockquote {
      padding: $gap;
      margin: $gap;
      background: $dark-slate;
      border-radius: $radius-m;
    }
    code {
      line-height: 1.8;
      padding: 0 $gap-s;
      border-radius: $radius-r;
      background: $main-gray;
      display: inline-block;
    }

    ol {
      padding-left: $gap;
      margin: $gap-s;
      line-height: 2;
      > li {
        padding-left: $gap-s;
        list-style-type: decimal;
      }
    }
    ul {
      padding-left: $gap;
      margin: $gap-s;
      line-height: 2;
      > li {
        padding-left: $gap-s;
        list-style-type: initial;
      }
    }
  }
}

</style>
