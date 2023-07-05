<template>
  <div class="audit-detail">
    <div class="audit-detail-top">
      <div class="columns three">
        <register-contents :title="$t('common.GRID.pressure')">
          {{ auditData.userId || "" | maskingName }}
        </register-contents>
        <register-contents :title="$t('common.REGCON.name')">
          {{ !auditData.userName ? '' : decodeURIComponent(auditData.userName) }}
        </register-contents>
        <register-contents title="IP">
          {{ auditData.ip }}
        </register-contents>
      </div>
      <div class="columns three">
        <register-contents
          ref="uriContent"
          class="uri-content"
          title="URI"
        >
          <el-tooltip
            v-if="isOverflowed"
            effect="light"
            :content="auditData.uri"
          >
            <span>{{ auditData.uri }}</span>
          </el-tooltip>
          <template v-else>
            {{ auditData.uri }}
          </template>
        </register-contents>
        <register-contents title="HTTP Method">
          {{ auditData.httpMethod }}
        </register-contents>
        <register-contents :title="$t('common.REGCON.dateInfo')">
          {{ auditData.createTime | date("YYYY-MM-DD HH:mm:ss") }}
        </register-contents>
      </div>
      <register-contents :title="$t('common.REGCON.content')">
        {{ auditData.comment }}
      </register-contents>
    </div>
    <div class="audit-detail-bottom">
      <h2>{{ $t("common.PLACEHOLDER.reqResInfo") }}</h2>
      <div
        v-if="auditData.requestBody"
        class="item"
      >
        <div class="title">
          <h3>Request Body</h3>
          <span>
            <el-tooltip
              effect="light"
              placement="top"
            >
              <i
                class="mdi mdi-content-copy"
                @click="copyClipboard(auditData.requestBody)"
              />
              <div slot="content">
                {{ $t("common.BTN.clipboard") }}
              </div>
            </el-tooltip>
          </span>
        </div>
        <pre
          v-html="prettierJSON(auditData.requestBody)"
          class="content"
        />
      </div>
      <div class="item">
        <div class="title">
          <h3>Response Body</h3>
          <span>
            <el-tooltip
              effect="light"
              placement="top"
            >
              <i
                class="mdi mdi-content-copy"
                @click="copyClipboard(auditData.responseBody)"
              />
              <div slot="content">
                {{ $t("common.BTN.clipboard") }}
              </div>
            </el-tooltip>
          </span>
        </div>
        <pre
          v-html="prettierJSON(auditData.responseBody)"
          class="content"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { getAuditDetail } from '@/components/Apis/Audit'

export default {
  name: 'CMPAuditDetail',
  created () {
    this.getAuditDetail()
  },
  methods: {
    async getAuditDetail () {
      try {
        const { data } = await getAuditDetail(this.$route.params.auditId)
        this.$store.commit('common/ADD_PARAMETERS', {
          label: data.auditId.slice(0, 20) + '...'
        })
        this.auditData = data
      } catch (error) {
        console.log(error)
        this.$alert('접근 기록 조회를 실패하였습니다.', {
          callback: () => this.$router.push({ name: 'cmp-audit' })
        })
      }
    },
    prettierJSON (json) {
      try {
        const copy = JSON.stringify(JSON.parse(json), null, 2)
        return copy
      } catch (error) {
        return json
      }
    },
    copyClipboard (text) {
      const t = document.createElement('textarea')
      document.body.appendChild(t)
      t.value = text
      t.select()
      document.execCommand('copy')
      document.body.removeChild(t)
    }
    // isJSON (text) {
    //   text = typeof text !== 'string'
    //     ? JSON.stringify(text)
    //     : text

    //   try {
    //     text = JSON.parse(text)
    //   } catch (e) {
    //     return false
    //   }

    //   if (typeof text === 'object' && text !== null) {
    //     return true
    //   }

    //   return false
    // }
  },
  mounted () {
    this.$nextTick(() => {
      setTimeout(() => {
        const contentUri = this.$refs.uriContent.$el
        const contents = contentUri.querySelector('.contents')

        if (contents && (contents.scrollWidth > contents.offsetWidth)) {
          this.isOverflowed = true
        }
      }, 500)
    })
  },
  data: () => ({
    auditData: {},
    isOverflowed: false
  })
}
</script>

<style lang="scss" scoped>
.audit-detail {
  border-top: 1px solid $purple-gray;

  &-top {
    .columns {
      display: flex;
      flex-direction: wrap;

      &.two > * {
        flex: 0 0 50%;
      }

      &.three > * {
        flex: 0 0 33%;
      }
    }

    .register-contents {
      overflow: hidden;

      &::v-deep {
        .contents-title {
          border-color: $dark-gray !important;
        }

        .contents {
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }
  }

  &-bottom {
    margin-top: $gap-m;

    & h2 {
      margin-bottom: $gap;
    }

    .item {
      border-top: 1px solid $purple-gray;
      padding-top: $gap;
      margin-top: $gap-s;

      .title {
        display: flex;
        align-items: center;

        h3 {
          display: inline-block;
        }

        span {
          margin-left: $gap-s;

          i.mdi {
            display: inline-block;
            color: rgba($white, 0.5);
            cursor: pointer;
            transition: color 500ms ease;

            &:hover {
              color: $white;
            }
          }
        }
      }

      &:last-child {
        margin-top: $gap;
      }

      .content {
        margin-top: $gap;
        padding: $gap;
        border-radius: $radius-m;
        background-color: $dark-navy;
        white-space: pre-wrap;
        word-break: break-all;
      }
    }
  }
}
</style>
