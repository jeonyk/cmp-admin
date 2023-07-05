<!--
  * 파일명 : VmwEsxi.vue
  * 파일 기능 : Vmw esxi 리스트 노출 및 관리(테스트, 추가, 변경, 삭제)
  * 작성자 : 이유준
  * 최종 작성일 : 2022-09-22
  * License By Shinsegae I&C
 -->

<template>
  <div
    class="nutanix-element"
  >
    <section class="table-top-wrap">
      <total-count :total-count="totalResultCnt" />

      <div class="button-area -right">
        <button
          class="button"
          :disabled="gridLoading || (!selectedRow || selectedRow.isSync == false)"
          type="is-anti"
          @click="handleClickRunSyncESXi"
        >
          <!-- 동기화 -->
          {{ $t('common.BTN.ADMIN.sync') }}
        </button>
        <span class="divider" />
        <button
          class="button"
          type="is-primary"
          :disabled="gridLoading"
          @click="handleClickOpenAddModal"
        >
          <!-- 항목 추가 -->
          {{ $t('common.TERMS.itemAdd') }}
        </button>
        <button
          class="button"
          :disabled="gridLoading || !selectedRow"
          @click=" handleOpenESXiUpdate(selectedRow)"
        >
          <!-- 변경 -->
          {{ $t('common.BTN.change') }}
        </button>
        <button
          class="button"
          @click="handleClickDeleteESXi"
          :disabled="gridLoading || selectedRow == null || isConnectedVC"
          type="is-anti"
        >
          <!-- 삭제 -->
          {{ $t('common.BTN.delete') }}
        </button>
      </div>
    </section>

    <section class="table-area">
      <cmp-grid
        v-loading="gridLoading"
        :item-source="itemSourceEsxiList"
        :columns="columns"
        :header-merge="headerMergeColumns"
        selectable
        :init-custom-action="init"
        :init-auto-select-row="selectedRow"
        init-auto-select-row-key="name"
        :sort-keeping="sortedCol"
        page-keeping
        :column-data-map="columnDataMap"
        @total-count="cnt => totalResultCnt = cnt"
      >
        <template #rackNo="props">
          <span>{{ Number(props.row.rackNo) }}</span>
        </template>

        <template #isManage="props">
          <div style="text-align: center">
            <span
              :class="[
                'state-icon',
                {'success' : props.row.isManage },
                { 'error': !props.row.isManage}
              ]"
            />
          </div>
        </template>
        <!-- 운영 여부 -->
        <template #syncInterval="props">
          {{ props.row.syncInterval }}분
        </template>

        <template #isSync="props">
          <!-- IN_PROGRESS 동기화중, SUCCESS 성공, FAIL 실패 -->
          <div
            v-if="props.row.isSync !== undefined"
            class="cell-flex-wrap"
          >
            <cmp-status-tag
              v-if="props.row.isSync === 'IN_PROGRESS'"
              type="is-loading"
            >
              <i class="el-icon-loading" />
              <span style="padding: 0 10px;">{{ $t('common.syncing') }}</span>
            </cmp-status-tag>

            <cmp-status-tag
              v-else
              :type="syncStatus(props.row.isSync).type"
              :contents="syncStatus(props.row.isSync).contents"
            />
          </div>
        </template>
        <!-- 마지막 동기 시간 -->
      </cmp-grid>
    </section>

    <!-- 모달 -->
    <!-- 항목 생성 모달 -->
    <el-dialog
      :title="showModal.type === 'create' ? $t('common.TERMS.itemAdd') : $t('common.TERMS.itemChange')"
      :visible.sync="showModal.view"
      class="new-item-modal"
      width="840px"
      @close="showModal.view = false"
    >
      <section>
        <article
          class="modal-body"
        >
          <div
            class="edit-list"
          >
            <register-contents
              :title="$t('admin.PREF.authInfo')"
              required
            >
              <template>
                <div

                  class="input-form"
                >
                  <span style="min-width: 100px">{{ $t('admin.PREF.userName') }}: </span>
                  <el-input
                    class="input-text"
                    :placeholder="$t('admin.PREF.userName')"
                    v-model="newItem.id"
                    :disabled="testPassed"
                  />
                </div>
                <div class="input-form">
                  <span style="min-width: 100px">{{ $t('admin.PREF.userPw') }}: </span>
                  <el-input
                    class="input-text"
                    v-if="showModal.type === 'create' || otp"
                    :placeholder="$t('admin.PREF.userPw')"
                    v-model="newItem.updateConnectPassword"
                    :disabled="testPassed"
                    show-password
                    ref="otpPasswordInput"
                  />
                  <button
                    v-else
                    @click="otpModalActive = !otpModalActive"
                    class="button -confirm"
                    type="is-primary"
                  >
                    {{ $t('common.BTN.viewPw') }}
                  </button>
                </div>
              </template>
            </register-contents>
            <!-- 인증 정보 -->

            <register-contents
              title="URL"
              required
            >
              <template>
                <el-input
                  class="input-text"
                  :placeholder="$t('admin.PREF.enterUrl')"
                  v-model="newItem.url"
                  :disabled="testPassed"
                />
              </template>
            </register-contents>
            <!-- URL -->

            <span
              v-if="testPassed || isConnecting"
              :class="['block-before-test', { 'is-connecting':isConnecting }]"
            >
              {{ !isConnecting ? $v('연결 테스트에 성공하였습니다.') : '' }}
            </span>
            <!-- /. 테스트 완료 문구 -->
          </div>
          <button
            :class="['test-btn','button', {'confirm' : testPassed }]"
            @click="handleClickToConnectionTest(showModal.type)"
            :type="testPassed ? 'is-success' : 'is-primary'"
            :disabled="(testPassed || isConnecting || !newItem.id || !newItem.updateConnectPassword || !newItem.url)? true : false"
          >
            <i class="icon">
              <i
                v-if="isConnecting"
                class="el-icon-loading"
              />
              <check-icon
                v-if="testPassed"
                class="check-icon"
              />
            </i>
            <!-- 테스트 (테스트 전 / 실패시) -->
            {{ testPassed?$v('연동 테스트 성공'):$v('연동 테스트') }}
          </button>
          <div
            v-loading="isConnecting"
            :element-loading-text="$t('common.PLACEHOLDER.testPossibility')"
            class="edit-list"
            v-if="(testPassed || showModal.type !== 'create') && showModal.view"
          >
            <register-contents
              :title="$v('ESXi(Host) 명')"
              required
            >
              <el-input
                :placeholder="$v('ESXi(Host) 명을 입력해주세요')"
                v-model="newItem.name"
                :disabled="!testPassed"
              />
            </register-contents>
            <!-- /. ESXi(Host) 명 -->

            <register-contents
              v-if="showModal.type !== 'create' && isConnectedVC"
              :title="$v('vCenter 명')"
              required
            >
              <el-input
                :placeholder="$t('vCenter 명을 입력해주세요')"
                v-model="newItem.vcenterName"
                :disabled="true"
              />
            </register-contents>
            <!-- /. 클러스터 명 -->

            <register-contents
              :title="$t('common.GRID.NUTA.interval')"
              required
            >
              <el-input-number
                v-model="newItem.syncInterval"
                :min="intervalMin"
                :disabled="(showModal.type ==='update' && isConnectedVC)"
              />
            </register-contents>
            <!-- /. 인터벌 주기 (분) -->

            <register-contents
              :title="$t('common.GRID.COMPUTE.networkOrg')"
              class="network-org-contents"
              required
            >
              <select-datacenter-cate
                v-model="newItem.networkGroup"
                @change="handleChangeDcenter"
              />
              <!-- <network-category-tree-selection-btn
                :init-data="selectedCateList"
                :cate-limit="1"
                @save="handleSaveNctSelected"
              /> -->
            </register-contents>
            <!-- 네트워크 카테고리 -->
            <register-contents
              :title="$v('데이터스토어')"
              required
            >
              <div class="input-form -datastore">
                <el-select
                  v-model="newItem.defaultDatastoreUuid"
                  :placeholder="$v('데이터스토어')"
                  :popper-append-to-body="false"
                  class="form-input"
                  :disabled="!testPassed"
                >
                  <el-option
                    v-for="item in dataStoreOptions"
                    :key="item.datastoreId"
                    :label="item.name"
                    :value="item.datastoreId"
                  />
                </el-select>
              </div>
              <span class="text-datastore-description">
                <span class="important-red-deco">*</span>
                {{ $v('초기값은 기본으로 설정된 데이터 스토어 입니다.') }}</span>
            </register-contents>

            <!-- /. 데이터 스토어 -->

            <register-contents :title="$t('admin.PREF.isOper')">
              <div class="input-form">
                <el-radio-group
                  v-model="newItem.isManage"
                  :disabled="showModal.type==='update' && isConnectedVC"
                >
                  <el-radio :label="true">
                    {{ $t('admin.PREF.oper') }}
                  </el-radio>
                  <el-radio
                    style="margin-left: 10px"
                    :label="false"
                  >
                    {{ $t('admin.PREF.noOper') }}
                  </el-radio>
                </el-radio-group>
              </div>
            </register-contents>
            <!-- 운영 여부 -->

            <span
              v-if="!testPassed"
              class="block-before-test"
            >
              <!-- 테스트를 먼저 진행해주세요. -->
              {{ !isConnecting ? $t('admin.PREF.proceedTest') : '' }}
            </span>
          </div>
        </article>

        <div class="modal-footer modal-button-area">
          <button
            class="button -modal-button"
            type="is-anti"
            @click="closeModal"
          >
            <!-- 취소 -->
            {{ $t('common.BTN.cancel') }}
          </button>
          <button
            class="button -modal-button"
            @click="handleClickUpadateESXi(newItem)"
            :disabled="!testPassed || isConnecting"
            type="is-primary"
          >
            <!-- 확인 -->
            {{ $t('common.BTN.confirm') }}
          </button>
        </div>
      </section>

      <otp-modal
        :active="otpModalActive"
        @close="otpModalActive = false"
        @validated-otp="validatedOTP"
        :required-api="true"
        :callback-api="isConnectedVC?checkTheVcenterOTP:checkTheEsxiOTP"
      />
    </el-dialog>
  </div>
</template>

<script src="./VmwEsxi.script.js"></script>

<style lang="scss">
.nutanix-element {
  // 모달
  .new-item-modal {
    .modal-body {
      overflow-y: auto;
      max-height: 75vh;
      .edit-list {
        border-top: 1px solid $border-color;
        position: relative;
        & + .edit-list { margin-top: $gap-m; }

          .block-before-test {
            background: rgba(0, 0, 0, 0.8);
            position: absolute;
            top: 0; left: 0; bottom: 0; right: 0;
            z-index: 10;
            display: flex;
            align-items: center;
            justify-content: center;
            color: $light-gray;
            transition: background 0.2s ease-in-out;
            &.is-connecting {
              background: rgba(0, 0, 0, 0.2);
            }
          }

        .register-contents {
          .contents-title {
            min-width: 200px;
          }
        }

        .input-form {
          display: flex;
          align-items: center;
          position: relative;
          > .button {
            width: 100%;
          }
          & + .input-form {
            margin-top: 5px;
          }

          &.-threshold {
            // border: 1px solid red;
            justify-content: flex-start;
            align-items: flex-start;
            flex-direction: column;
            > div:first-child { margin-bottom: $gap-s; }
          }

          &.-network-org {
            position: relative;
            padding-right: 60px;
            .add-item {
              position: absolute;
              top: 50%;
              right: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 45px;
              transform: translateY(-50%);
              > .icon-button {
                color: $primary;
              }
            }
          }
        }
        .text-datastore-description {
          color: $gray;
          font-size: 12px;
          .important-red-deco {
            color: #FA5657;
          }
        }
      }
    }
  }
}
  .test-btn {
   width: 100%;
   margin-top:4px;
   margin-bottom: 20px;
   display: flex;
   align-items: center;
   justify-content: center;

     &.confirm {
       background-color: $success;
       &:disabled {
         background: $success;
         opacity: 1;
       }
     }
   .icon {
     margin-right: 4px;
     display: flex;
     align-items: center;
     justify-content: center;
     width: 15px;
     height: 15px;
     .check-icon {
       height: 12px;
     }
   }
 }
</style>
