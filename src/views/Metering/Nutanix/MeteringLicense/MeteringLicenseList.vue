<template>
  <div class="board-sw">
    <div
      class="lst-sw"
      v-for="(data, idx) in itemsByPage"
      :key="idx"
      @click="e => selectedRowItem(e, data)"
    >
      <div class="summary">
        <h3 class="title">
          {{ data.name }}
        </h3>
        <ul class="lst-summary">
          <li>
            <b class="stitle">S/W 버전</b>
            <span class="desc">{{ data.version }}</span>
          </li>
          <li>
            <b class="stitle">카테고리</b>
            <el-tooltip
              :disabled="data.categories.length === 1"
              effect="light"
            >
              <span v-if="data.categories.length > 1">
                {{ data.categories[0] }} 외 {{ data.categories.length - 1 }}
              </span>
              <span v-else>
                {{ data.categories[0] }}
              </span>

              <div slot="content">
                <div
                  v-for="category in data.categories"
                  :key="category"
                >
                  {{ category }}
                </div>
              </div>
            </el-tooltip>
          </li>
          <li>
            <b class="stitle">운영체제 유형</b>
            <span class="desc">{{ data.osType }}</span>
          </li>
          <li>
            <b class="stitle">운영체제 구분</b>
            <span class="desc">{{ data.osSystem }}</span>
          </li>
          <li>
            <b class="stitle">운영체제 버전</b>
            <span class="desc">{{ data.osVersion }}</span>
          </li>
        </ul>
      </div>
      <div class="desc">
        <ul class="lst-desc">
          <li>
            <b class="stitle">구매 라이선스 유형</b>
            <span class="desc">{{ data.purchaseLicenseType }}</span>
          </li>
          <li>
            <b class="stitle">총 구매 수량</b>
            <span class="desc">{{ data.purchaseQuantityDisplayName }}</span>
          </li>
          <li>
            <b class="stitle">총 구매 금액</b>
            <span class="desc">{{ data.purchaseAmountDisplayName }}</span>
          </li>
          <li>
            <b class="stitle">판매 라이선스 유형</b>
            <span class="desc">{{ data.salesLicenseType }}</span>
          </li>
          <li>
            <b class="stitle">판매 수량</b>
            <span class="desc">{{ data.salesQuantity }}</span>
          </li>
          <li>
            <b class="stitle">누적 판매 금액</b>
            <span class="desc">{{ data.cumulativeSalesAmountDisplayName }}</span>
          </li>

          <li>
            <b class="stitle">라이선스 판매 현황</b>
            <span class="desc">{{ data.licenseStatusDisplayName }}</span>
          </li>
          <li>
            <b class="stitle">라이선스 사용 현황</b>
            <span class="desc">
              <button
                class="button"
                @click="setStatus({ view: true, row: data }, 'licenseStatusModal')"
              >
                {{ $v('현황보기') }}
              </button>
            </span>
          </li>
          <li>
            <b class="stitle">라이선스 이력</b>
            <span class="desc">
              <button
                class="button"
                @click.stop="setStatus({ view: true, row: data }, 'licenseHistoryModal')"
              >
                {{ $v('이력보기') }}
              </button>
            </span>
          </li>
          <li>
            <b class="stitle">자원관리</b>
            <span class="desc">
              <button
                class="button"
                @click.stop="setStatus({ view: true, row: data }, 'sourceSettingModal')"
              >
                {{ $v('자원관리') }}
              </button>
            </span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'MeteringLicenseList',
  props: {
    itemsByPage: {
      type: Array,
      default: null
    }
  },
  methods: {
    setStatus (status, key) {
      this.$emit('set-status', status, key)
    },
    selectedRowItem (evt, dataItem) {
      this.$emit('selected-row-item', evt, dataItem)
    }
  }
}
</script>

<style lang="scss" scoped>
.lst-sw{
  display: flex;
  margin-top: 24px;
  padding: 24px;
  height: 200px;
  border-radius: 6px;
  background-color: #070A20;
  border: 1px solid #070A20;
  box-sizing: border-box;

  &:first-child{
    margin-top: 0;
  }
  .summary{
    flex: 0 0 600px;
    .title{
      width: 535px;
      height: 48px;
      font-size: 18px;
      text-overflow: ellipsis;
      overflow: hidden;
      word-break: break-word;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical
    }
    .lst-summary{
      display: flex;
      flex-flow: row wrap;
      margin-top: 24px;
      li{
        display: flex;
        margin-bottom: 10px;
        width: 50%;
        .stitle{
          min-width: 90px;
          font-size: 14px;
          font-weight: 700;
          color: #8287A9;
        }
        .desc{
          border-left: 0;
          font-size: 14px;
          color: #8287A9;
        }
      }
    }
  }
  .desc{
    flex: 1;
    border-left: 1px solid #2A2D44;
    .lst-desc{
      display: flex;
      flex-flow: row wrap;
      justify-content: flex-end;
      align-items: center;
      li{
        margin-left: 30px;
        margin-bottom: 22px;
        width: 120px;
        text-align: center;
        .stitle{
          display: block;
          font-size: 14px;
          font-weight: 700;
          white-space: nowrap;
        }
        .desc{
          display: block;
          margin-top: 12px;
          height: 32px;
          border-left: 0;
          font-size: 14px;
          color: #999;
          text-overflow: ellipsis;
          overflow: hidden;
        }
      }
    }
  }

  &:hover{
    background-color: #2A2D44;
    border-color: #434765;
    .summary{
      .lst-summary{
        li{
          .stitle{
            color: #fff;
          }
          .desc{
            color: #fff;
          }
        }
      }
    }
    .desc{
      border-color: #484A5E;
      .lst-desc{
        li{
          .stitle{
            color: #fff;
          }
          .desc{
            color: #fff;
          }
        }
      }
    }
  }

  &.selected{
    background-color: rgba($color: #3E57C9, $alpha: 0.3);
    border-color: #3E57C9;
    .summary{
      .lst-summary{
        li{
          .stitle{
            color: #fff;
          }
          .desc{
            color: #fff;
          }
        }
      }
    }
    .desc{
      border-color: #474E84;
      .lst-desc{
        li{
          .stitle{
            color: #fff;
          }
          .desc{
            color: #fff;
          }
        }
      }
    }
  }
}
</style>
