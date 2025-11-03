import type { RequestClient } from '../request-client';
import type { RequestClientConfig } from '../types';

import {
  hideFullscreenLoading,
  showFullscreenLoading,
  showSuccessMessage,
} from './fullscreen-loading';

class FileUploader {
  private client: RequestClient;

  constructor(client: RequestClient) {
    this.client = client;
  }

  public async upload<T = any>(
    url: string,
    data: Record<string, any> & { file: Blob | File },
    config?: RequestClientConfig,
  ): Promise<T> {
    // 显示全屏loading
    showFullscreenLoading('文件上传中...');

    try {
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            formData.append(`${key}[${index}]`, item);
          });
        } else {
          formData.append(key, value);
        }
      });

      const finalConfig: RequestClientConfig = {
        ...config,
        headers: {
          'Content-Type': 'multipart/form-data',
          ...config?.headers,
        },
      };

      const result = await this.client.post(url, formData, finalConfig);

      // 隐藏全屏loading
      hideFullscreenLoading();

      // 显示成功提示
      showSuccessMessage('文件上传成功');

      return result;
    } catch (error) {
      // 出错时也要隐藏loading
      hideFullscreenLoading();
      throw error;
    }
  }
}

export { FileUploader };
