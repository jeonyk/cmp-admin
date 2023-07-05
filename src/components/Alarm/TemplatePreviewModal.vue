<template>
  <el-dialog
    title="이메일 템플릿 미리보기"
    width="50%"
    :visible="active"
    @close="$emit('close')"
  >
    <div
      v-if="html"
      class="preview"
    >
      <iframe :srcdoc="renderingHtml" />
    </div>
  </el-dialog>
</template>

<script>
export default {
  name: 'TemplatePreviewModal',
  props: {
    active: {
      type: Boolean,
      default: false
    },
    html: {
      type: String,
      default: ''
    }
  },
  computed: {
    renderingHtml () {
      return !this.html
        ? ''
        : `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                background-color: white;
              }
            </style>
          </head>
          <body>
            ${this.html}
          </body>
        </html>
      `
    }
  }
}
</script>

<style lang="scss" scoped>
.preview {
  padding: $gap;
  border: 1px solid $purple-gray;
  border-radius: $radius;

  &::v-deep p:empty::before {
    content: ' ';
    white-space: pre;
  }

  iframe {
    width: 100%;
    min-height: 400px;
    max-height: 700px;
    overflow-y: auto;
    border: none;
  }
}
</style>
