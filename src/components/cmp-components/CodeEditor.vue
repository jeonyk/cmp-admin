<template>
  <codemirror
    class="cmp-code-editor"
    ref="editor"
    v-model="proxyCode"
    :options="options"
    @input="input"
  />
</template>

<script>

import 'codemirror/mode/javascript/javascript'
import 'codemirror/mode/yaml/yaml'

export default {
  name: 'CodeEditor',
  props: {
    readOnly: {
      type: Boolean,
      default: false
    },
    values: {
      type: String,
      default: undefined
    }
  },
  computed: {
    proxyCode: {
      get () { return this.values },
      set (val) { return val }
    }
  },
  watch: {
    values (value) {
      this.input(value)
    }
  },
  mounted () {
    // this.input(this.proxyCode)
  },
  methods: {
    input (values) {
      this.$forceUpdate()
      return this.$emit('input', values)
    }
  },
  data () {
    return {
      // proxyCode: this.values,
      options: {
        theme: 'cobalt',
        lineNumbers: !this.readOnly,
        // mode: 'javascript',
        mode: { name: 'javascript', json: true },
        readOnly: this.readOnly ? 'nocursor' : false,
        styleActiveLine: true,
        line: true,
        foldGutter: true,
        styleSelectedText: true,
        matchBrackets: true,
        showCursorWhenSelecting: true,
        extraKeys: { Ctrl: 'autocomplete' },
        hintOptions: { completeSingle: false }
      }
    }
  }
}
</script>

<style lang="scss">
.cmp-code-editor {
  height: inherit;
  border-radius: $radius-s;
  overflow: hidden;
  background: $dark-navy;
  box-sizing: border-box;

  .CodeMirror {
    height: inherit;
    background: transparent;
    line-height: 1.8;

    .CodeMirror-line  {
      padding-left: $gap;
    }
  }
  .CodeMirror-gutters {
    background: transparent;
    border-right: 1px solid $dark-slate;
  }
  .CodeMirror-linenumbers {
    background: $dark-navy;
  }
  .CodeMirror-linenumber {
    font-family: Noto Sans Korean;
    text-align: center;
  }
  .CodeMirror-lines {
    color: $text-lighter-gray;
    margin: $gap-s 0;
  }

  .CodeMirror-cursor {
    border-left: 3px solid #a09797;
  }
  .CodeMirror-selected {
    background: $dark-gray;
  }
  .CodeMirror-matchingbracket,
  .CodeMirror-nonmatchingbracket {
    color: red;
  }
  .CodeMirror-scrollbar-filler, .CodeMirror-gutter-filler {
    background-color: transparent;
  }

  span.cm-comment { color: #6b6b6b; }
  span.cm-atom { color: #845dc4; }
  span.cm-number, .cm-s-cobalt span.cm-attribute { color: #ff80e1; }
  span.cm-keyword { color: $main-blue; }
  span.cm-string { color: $success; }
  span.cm-meta { color: $yellow; }
  span.cm-variable-2, .cm-s-cobalt span.cm-tag { color: #9effff; }
  span.cm-variable-3, .cm-s-cobalt span.cm-def, .cm-s-cobalt .cm-type { color: white; }
  span.cm-bracket { color: #d8d8d8; }
  span.cm-builtin, .cm-s-cobalt span.cm-special { color: #ff9e59; }
  span.cm-link { color: #845dc4; }
  span.cm-error { color: #9d1e15; }

  .CodeMirror-activeline-background { background: #002D57; }
  .CodeMirror-matchingbracket { outline:1px solid grey;color:white !important; }
}

// ===

</style>
