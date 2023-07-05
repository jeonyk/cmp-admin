<!--
  * 파일명 : NutanixElement.vue
  * 파일 기능 : 뉴타닉스 Element 리스트 노출 및 관리(테스트, 추가, 변경, 삭제)
  * 작성자 : 정재은 외 3명
  * 최종 작성일 : 2021-02-22
  * License By Shinsegae I&C
  * 2021-02-22 Update: sorting 이슈 수정 완료
 -->

<template>
  <div class="nutanix-element">
    <section class="table-top-wrap">
      <total-count :total-count="totalResultCnt" />

      <div class="button-area -right">
        <button
          class="button"
          :disabled="!selectedRow || selectedRow.isSync == -1"
          type="is-anti"
          @click="activeSync"
        >
          <!-- 동기화 -->
          {{ $t('common.BTN.ADMIN.sync') }}
        </button>
        <span class="divider" />
        <button
          class="button"
          type="is-primary"
          @click="addModalOpen"
        >
          <!-- 항목 추가 -->
          {{ $t('common.TERMS.itemAdd') }}
        </button>
        <button
          class="button"
          :disabled="!selectedRow"
          @click="updateModalOpen(selectedRow)"
        >
          <!-- 변경 -->
          {{ $t('common.BTN.change') }}
        </button>
        <button
          class="button"
          @click="applyRemove"
          :disabled="selectedRow == null"
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
        :item-source="computedTableData"
        :columns="columns"
        :header-merge="headerMergeColumns"
        selectable
        :init-custom-action="init"
        :init-auto-select-row="selectedRow"
        init-auto-select-row-key="elementIdx"
        :sort-keeping="sortedCol"
        page-keeping
        :column-data-map="columnDataMap"
        @total-count="cnt => totalResultCnt = cnt"
      >
        <template #rackNo="props">
          <span>{{ Number(props.row.rackNo) }}</span>
        </template>

        <template #centrals="props">
          <span v-if="props.row.centrals">
            <div
              v-for="(central,centralIdx) in props.row.centrals"
              :key="centralIdx"
            >
              {{ central.centralName }}
            </div>
          </span>
        </template>
        <!-- /.인증 정보 -->

        <template #intervalMin="props">
          <span v-if="props.row.intervalMin">{{ props.row.intervalMin }} {{ $t('common.TERMS.minute') }}</span>
          <span v-else />
        </template>
        <!-- /.인터벌 주기(분) -->

        <template #scUuid="props">
          <div v-if="props.row.scUuid">
            <div
              v-for="container in props.row.storageContainers"
              :key="container.scUuid"
            >
              <span v-if="props.row.scUuid === container.scUuid">
                {{ container.scName }}
              </span>
            </div>
          </div>
        </template>
        <!-- 기본 스토리지 컨테이너 -->

        <template #isManage="props">
          <div style="text-align: center">
            <span
              :class="[
                'state-icon',
                {'success' : props.row.isManage && props.row.isConnected },
                { 'error': props.row.isManage && !props.row.isConnected }
              ]"
            />
          </div>
        </template>
        <!-- 운영 여부 -->

        <template
          v-for="binding in percentBinding"
          :slot="binding"
          slot-scope="props"
        >
          <span
            v-if="props.row[binding]"
            :key="binding"
          >
            {{ props.row[binding] }} %
          </span>
        </template>

        <template #isSync="props">
          <!-- -1 동기화중, 1 성공, 0 실패 -->
          <div
            v-if="props.row.isSync !== undefined"
            class="cell-flex-wrap"
          >
            <cmp-status-tag
              v-if="props.row.isSync === -1"
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

    <section class="file-server-list-area">
      <file-server-list
        :central-list="tableData"
        v-if="tableData.length > 0"
      />
    </section>

    <!-- 모달 -->
    <!-- 항목 생성 모달 -->
    <el-dialog
      :title="showModal.type === 'create' ? $t('common.TERMS.itemAdd') : $t('common.TERMS.itemChange')"
      :visible.sync="showModal.view"
      class="new-item-modal"
      width="840px"
      top="10vh"
      @close="showModal.view = false"
    >
      <section>
        <article class="modal-body">
          <div class="edit-list">
            <register-contents
              :title="$t('admin.PREF.authInfo')"
              required
            >
              <template>
                <div class="input-form">
                  <span style="min-width: 100px">{{ $t('admin.PREF.userName') }}: </span>
                  <el-input
                    class="input-text"
                    :placeholder="$t('admin.PREF.userName')"
                    v-model.trim="newItem.connectUsername"
                    :disabled="testPassed"
                  />
                </div>
                <div class="input-form">
                  <span style="min-width: 100px">{{ $t('admin.PREF.userPw') }}: </span>
                  <el-input
                    class="input-text"
                    v-if="showModal.type === 'create' || otp"
                    :placeholder="$t('admin.PREF.userPw')"
                    v-model.trim="newItem.updateConnectPassword"
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
                  v-model.trim="newItem.connectUrl"
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
            :class="['test-btn', 'button', { 'confirm' : testPassed }]"
            @click="activeTest(showModal.type)"
            :type="testPassed ? 'is-success' : 'is-primary'"
            :disabled="(testPassed || isConnecting || !newItem.connectUsername || !newItem.updateConnectPassword || !newItem.connectUrl)? true : false"
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
            {{ testPassed?'Connected':'Test Connection' }}
          </button>
          <!-- 테스트 -->

          <!-- ------ -->
          <!-- ------ -->
          <!-- ------ -->

          <div
            v-loading="isConnecting"
            :element-loading-text="$t('common.PLACEHOLDER.testPossibility')"
            class="edit-list"
            v-if="(testPassed || showModal.type !== 'create') && showModal.view"
          >
            <register-contents
              title="Rack No"
              required
            >
              <el-input
                type="number"
                class="form-input-number"
                placeholder="Rack No"
                v-model="newItem.rackNo"
                :disabled="!testPassed"
              />
            </register-contents>
            <!-- /. Rack No -->

            <register-contents
              :title="$t('common.GRID.NUTA.elementName')"
              required
            >
              <el-input
                :placeholder="$t('common.GRID.NUTA.elementName')"
                v-model="newItem.elementName"
                :disabled="!testPassed"
              />
            </register-contents>
            <!-- /. Element 명 -->

            <register-contents
              v-if="showModal.type !== 'create'"
              :title="$t('common.GRID.NUTA.clusterName')"
              required
            >
              <el-input
                :placeholder="$t('common.GRID.NUTA.clusterName')"
                v-model="newItem.clusterName"
                :disabled="true"
              />
            </register-contents>
            <!-- /. 클러스터 명 -->

            <register-contents
              :title="$t('common.GRID.NUTA.interval')"
              required
            >
              <el-input-number
                v-model="newItem.connectInterval"
                :min="intervalMin"
                :disabled="!testPassed"
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
            </register-contents>
            <!-- 네트워크 조직 -->

            <register-contents
              required
              v-for="values in TESTobj"
              :title="`${$v(values.groupName)} (%)`"
              :key="values.groupName"
            >
              <div
                v-for="item in values.children"
                class="input-form -threshold"
                :class="{'--one-option': values.children.length <= 1}"
                :key="item.key"
              >
                <div>
                  {{ $v(item.label) }} : <!-- 1차 임계치, 2차 임계치 -->
                  <el-input-number
                    v-model="item.value"
                    :min="0"
                  />
                  <span style="margin-left: 5px">%</span>
                </div>
              </div>
            </register-contents>

            <register-contents
              :title="$t('common.GRID.NUTA.basicStorage')"
              required
            >
              <div class="input-form">
                <el-select
                  v-model="newItem.scUuid"
                  :placeholder="$t('common.GRID.NUTA.basicStorage')"
                  :popper-append-to-body="false"
                  class="form-input"
                  :disabled="!testPassed"
                >
                  <el-option
                    v-for="item in storageContainerOptions"
                    :key="item.scUuid"
                    :label="item.scName"
                    :value="item.scUuid"
                  />
                </el-select>
              </div>
            </register-contents>
            <!-- /. 기본 스토리지 컨테이너 -->

            <register-contents :title="$t('admin.PREF.isOper')">
              <div class="input-form">
                <el-radio-group
                  v-model="newItem.isManage"
                  :disabled="!testPassed"
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
            @click="confirmUpdateItem(newItem)"
            :disabled="!testPassed || isConnecting"
            type="is-primary"
          >
            <!-- 확인 -->
            {{ $t('common.BTN.confirm') }}
          </button>
        </div>
      </section>

      <otp-modal
        api-call-component-name="NutanixElement"
        required-api
        :ntx-idx="newItem.elementIdx"
        :callback-api="callbackApi"
        :active="otpModalActive"
        @close="otpModalActive = false"
        @validated-otp="validatedOTP"
      />
    </el-dialog>
  </div>
</template>

<script src="./NutanixElement.script.js"></script>

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
      }
    }
  }

  .file-server-list-area {
    margin-top: 100px;
  }
}
</style>

<style lang="scss" scoped>
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
