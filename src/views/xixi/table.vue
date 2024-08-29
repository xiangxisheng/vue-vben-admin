<template>
  <div>
    <BasicTable
      @register="registerTable"
      @edit-end="handleEditEnd"
      @edit-cancel="handleEditCancel"
      :beforeEditSubmit="beforeEditSubmit"
      :searchInfo="tplConf.BasicTable.searchInfo"
    >
      <template #tableTitle>
        <TableTitle
          :helpMessage="tplConf.TableTitle.helpMessage"
          :title="tplConf.TableTitle.title"
        />
      </template>
      <template #toolbar>
        <a-button
          v-for="item of tplConf.toolbars"
          :key="item.title"
          type="primary"
          @click="item.click"
          >{{ item.title }}</a-button
        >
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction :actions="tplConf.actions(record)" />
        </template>
      </template>
    </BasicTable>
    <XixiDrawer @register="registerDrawer" @success="handleSuccess" />
    <XixiModal @register="registerModal" @success="handleSuccess" />
    <ExpExcelModal
      @register="tplConf.ExpExcelModal.register"
      @success="tplConf.ExpExcelModal.success"
    />
  </div>
</template>
<script lang="ts">
  // 1: 导入vue内置组件
  import { defineComponent, h, ref, reactive } from 'vue';
  import { useRouter } from 'vue-router';

  // 2: 导入Vben组件
  import {
    BasicTable,
    useTable,
    BasicColumn,
    BasicTableProps,
    FormSchema,
    TableAction,
  } from '/@/components/Table';
  import TableTitle from '/@/components/Table/src/components/TableTitle.vue';
  import { useModal } from '/@/components/Modal';
  import XixiModal from './modal.vue';
  import { jsonToSheetXlsx, ExpExcelModal, ExportModalResult } from '/@/components/Excel';
  import { useDrawer } from '@/components/Drawer';
  import XixiDrawer from './drawer.vue';

  // 3: 导入Vben其他
  import { useMessage } from '/@/hooks/web/useMessage';
  import { deepMerge } from '/@/utils';
  import { fGetInfo, fTableMgrApi } from './table.ts';

  // 4: 自定义类型
  interface TableConfigToolbar {
    title: string;
    click: Function;
  }

  // 6: 最后导出组件
  export default defineComponent({
    components: {
      BasicTable,
      TableTitle,
      TableAction,
      XixiDrawer,
      XixiModal,
      ExpExcelModal,
    },
    setup() {
      // 1: const
      const toolbars: TableConfigToolbar[] = [];
      const { currentRoute } = useRouter();
      const path = currentRoute.value.path;
      //console.log(path);
      const { createMessage } = useMessage();

      const [registerModal, { openModal: openModal_Import }] = useModal();
      const [registerTable, { reload, getColumns, setColumns, setProps, setLoading }] = useTable({
        handleSearchInfoFn(info) {
          console.log('handleSearchInfoFn', info);
          tplConf.LastSearchInfo = info;
          return info;
        },
      });
      const [tplConf_ExpExcelModal_register, { openModal: openModal_ExpExcel }] = useModal();

      function handleEditEnd({ record, index, key, value }: Recordable) {
        console.log(record, index, key, value);
        return false;
      }

      // 模拟将指定数据保存
      function feakSave({ value, key, id }) {
        createMessage.loading({
          content: `正在模拟保存${key}`,
          key: '_save_fake_data',
          duration: 0,
        });
        return new Promise((resolve) => {
          setTimeout(() => {
            if (value === '') {
              createMessage.error({
                content: '保存失败：不能为空',
                key: '_save_fake_data',
                duration: 2,
              });
              resolve(false);
            } else {
              createMessage.success({
                content: `记录${id}的${key}已保存`,
                key: '_save_fake_data',
                duration: 2,
              });
              resolve(true);
            }
          }, 2000);
        });
      }

      async function beforeEditSubmit({ record, index, key, value }) {
        console.log('单元格数据正在准备提交', { record, index, key, value });
        return await feakSave({ id: record.id, key, value });
      }

      function handleEditCancel() {
        console.log('cancel');
      }

      function clickToolbar(data: any) {
        if (data.click === 'fLoadInfo') {
          fLoadInfo();
          return;
        }
        if (data.click === 'openModal_Import') {
          openModal_Import(true, data);
          return;
        }
        if (data.click === 'openModal_ExpExcel') {
          openModal_ExpExcel();
          return;
        }
        if (data.click === 'toolbar_request') {
          toolbar_request(data);
          return;
        }
      }

      function sleep(timeout: number) {
        return new Promise((resolve) => {
          setTimeout(resolve, timeout);
        });
      }

      const toolbar_request = async (data: any) => {
        // 工具栏上面的API
        const params = {
          confirm: 0,
          search: tplConf.LastSearchInfo,
        };
        setLoading(true);
        const body = await fTableMgrApi(path).action(data.action, params);
        setLoading(false);
        await sleep(1);
        if (body.popConfirm) {
          if (confirm(body.popConfirm.title)) {
            params.confirm = 1;
            setLoading(true);
            await fTableMgrApi(path).action(data.action, params);
            setLoading(false);
            reload();
          }
        }
      };

      function handleSuccess() {
        reload();
      }

      const fGetVisibleColumns = () => {
        // 取得可见的列名
        const columns = getColumns();
        const ret: BasicColumn[] = [];
        for (const column of columns) {
          if (column.hasOwnProperty('defaultHidden')) {
            if (column.defaultHidden) {
              continue;
            }
          }
          if (column.hasOwnProperty('flag')) {
            if (column.flag === 'ACTION') {
              continue;
            }
          }
          if (!column.hasOwnProperty('dataIndex')) {
            continue;
          }
          ret.push(column);
        }
        return ret;
      };

      const fGetItemsByColumns = (items: any[], aField: string[]) => {
        const aRet: any[] = [];
        for (const item of items) {
          const mRow = {};
          for (const sField of aField) {
            if (item.hasOwnProperty(sField)) {
              mRow[sField] = item[sField];
            }
          }
          aRet.push(mRow);
        }
        return aRet;
      };

      const [registerDrawer, { openDrawer }] = useDrawer();

      const tplConf = {
        LastSearchInfo: {},
        BasicTable: { searchInfo: reactive<Recordable>({}) },
        TableTitle: { title: '', helpMessage: '' },
        toolbars: toolbars,
        ExpExcelModal: {
          register: tplConf_ExpExcelModal_register,
          success: async function defaultHeader({ filename, bookType }: ExportModalResult) {
            // 默认Object.keys(data[0])作为header
            const mParam = deepMerge(tplConf.LastSearchInfo, { page: 1, pageSize: 10000 });
            const mResult = await fTableMgrApi(path).list(mParam);
            const columns = fGetVisibleColumns();
            const mHeader = {};
            const aHeader: string[] = [];
            for (const column of columns) {
              if (column.dataIndex) {
                const s = column.dataIndex.toString();
                mHeader[s] = column.title;
                aHeader.push(s);
              }
            }
            jsonToSheetXlsx({
              data: fGetItemsByColumns(mResult.items, aHeader),
              header: mHeader,
              filename,
              write2excelOpts: {
                bookType,
              },
              json2sheetOpts: {
                // 指定顺序
                header: aHeader,
              },
            });
          },
        },
        actions(record: Recordable) {
          const actions = [];
          for (const oAction of tplConf.TableAction.actions) {
            actions.push({
              icon: oAction.icon,
              onClick: () => {
                if (oAction.action === 'view') {
                  openDrawer(true, {
                    record,
                    isUpdate: true,
                  });
                  return;
                }
                alert(`action=${oAction.action}`);
              },
            });
          }
          return actions;
        },
      };

      // 加载表格信息
      async function fLoadInfo() {
        createMessage.loading({
          content: `正在加载Info`,
          key: 'fLoadInfo',
          duration: 0,
        });
        const { info, props } = await fGetInfo(path);
        setProps(props);
        if (0) {
          // 临时修改（重置列的时候会被还原）
          setColumns(columns);
        }
        //tplConf.TableTitle.title = info.title;
        for (const k in info.tplConf) {
          tplConf[k] = deepMerge(tplConf[k], info.tplConf[k]);
        }
        tplConf.toolbars = (() => {
          const aRet: any[] = [];
          for (const toolbar of info.toolbars) {
            aRet.push({
              title: toolbar.title,
              click: () => {
                clickToolbar(toolbar);
              },
            });
          }
          return aRet;
        })();
        createMessage.success({
          content: `Info加载完成`,
          key: 'fLoadInfo',
          duration: 0.1,
        });

        reload();
      }

      fLoadInfo();

      return {
        registerModal,
        registerTable,
        registerDrawer,
        handleEditEnd,
        handleEditCancel,
        beforeEditSubmit,
        handleSuccess,
        tplConf: ref(tplConf),
      };
    },
  });
</script>
