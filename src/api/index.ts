import { defHttp } from '@/utils/http/axios';
import { ErrorMessageMode } from '#/axios';

/**
 * @description: 通用API请求接口
 */
export async function Api(
  url: string,
  params: Record<string, unknown>,
  mode: ErrorMessageMode = 'modal',
) {
  return await defHttp.post(
    {
      url,
      params,
    },
    {
      errorMessageMode: 'modal',
      successMessageMode: 'modal',
    },
  );
}
