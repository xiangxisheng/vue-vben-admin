import { defHttp } from '@/utils/http/axios';
import { BasicColumn, BasicTableProps, FormSchema } from '@/components/Table';
import { h } from 'vue';
import { Progress, Tag } from 'ant-design-vue';

export function fTableMgrApi(urlpre: string) {
  // API-CRUD
  const url = '/panel' + urlpre;
  return {
    info: () => defHttp.get({ url: `${url}/info` }),
    add: (params: any) => defHttp.post({ url: `${url}/add`, params }),
    list: (params?: any) => defHttp.get({ url: `${url}/list`, params }),
    save: (id: number, params: any) => defHttp.post({ url: `${url}/${id}/save`, params }),
    del: (id: number) => defHttp.post({ url: `${url}/${id}/del` }),
    action: (action: string, params: any) => defHttp.post({ url: `${url}/${action}`, params }),
  };
}

const checkRecordByWhere = (record: any, where: any) => {
  for (const k in where) {
    if (record[k] !== where[k]) {
      return false;
    }
  }
  return true;
};

export async function fGetInfo(path: string) {
  const info = await fTableMgrApi(path).info();
  const props: Partial<BasicTableProps> = {};
  props.api = fTableMgrApi(path).list;
  for (const k in info.basic_table_props) {
    props[k] = info.basic_table_props[k];
  }
  if (info.basic_table_props.useSearchForm) {
    if (!props.formConfig) {
      // 提供默认的搜索设置
      props.formConfig = {
        labelWidth: 120,
        autoSubmitOnEnter: true,
      };
    }
    props.formConfig.schemas = ((columns) => {
      const schemas: FormSchema[] = [];
      for (const column of columns) {
        if (column.component) {
          const schema: FormSchema = {
            field: column.dataIndex,
            label: column.title,
            component: column.component,
          };
          if (column.componentProps) {
            schema.componentProps = column.componentProps;
          }
          schema.colProps = { span: 8 };
          if (column.colProps) {
            schema.colProps = column.colProps;
          }
          schemas.push(schema);
        }
      }
      return schemas;
    })(info.columns);
    props.useSearchForm = true;
  }
  const fGetColumns = (columns: any[]) => {
    // 从接口中返回的“列配置”中，取得列的设置
    const aRet: BasicColumn[] = [];
    for (const column of columns) {
      if (!column.width) {
        // 没有宽度的列不显示
        continue;
      }
      const mColumn: BasicColumn = {
        title: column.title,
        dataIndex: column.dataIndex,
      };
      if (column.width) {
        mColumn.width = column.width;
      }
      if (column.sorter) {
        mColumn.sorter = column.sorter;
      }
      if (column.editComponent === 'InputNumber') {
        if (0) {
          //根据输入的数字显示进度条
          mColumn.editRender = ({ text }) => {
            return h(Progress, { percent: Number(text) });
          };
        }
      }
      if (column.customRender) {
        const crlist = column.customRender;
        mColumn.customRender = ({ record }) => {
          for (const cr of crlist) {
            if (checkRecordByWhere(record, cr.where)) {
              const color = cr.color;
              const label = record[column.dataIndex];
              return h(Tag, { color }, () => label);
            }
          }
        };
      }
      aRet.push(mColumn);
    }
    return aRet;
  };
  const columns = fGetColumns(info.columns);
  // 修改永久列设置
  props.columns = columns;
  return { info, props };
}
