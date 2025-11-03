import { createVNode, render } from 'vue';

/**
 * 全屏Loading实例
 */
let fullscreenLoadingInstance: any = null;

/**
 * 创建全屏Loading组件
 */
function createLoadingComponent(text: string = '上传中...') {
  const LoadingComponent = {
    name: 'FullscreenLoading',
    setup() {
      return () =>
        createVNode(
          'div',
          {
            class: 'fullscreen-loading-mask',
            style: {
              position: 'fixed',
              top: '0',
              left: '0',
              right: '0',
              bottom: '0',
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              zIndex: '9999',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
            },
          },
          [
            createVNode('div', {
              class: 'loading-spinner',
              style: {
                width: '40px',
                height: '40px',
                border: '4px solid rgba(255, 255, 255, 0.3)',
                borderTop: '4px solid #1890ff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              },
            }),
            createVNode(
              'div',
              {
                style: {
                  marginTop: '16px',
                  color: '#fff',
                  fontSize: '14px',
                },
              },
              text,
            ),
          ],
        );
    },
  };

  return LoadingComponent;
}

/**
 * 添加旋转动画样式
 */
function injectSpinnerStyle() {
  if (!document.getElementById('fullscreen-loading-style')) {
    const style = document.createElement('style');
    style.id = 'fullscreen-loading-style';
    style.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.append(style);
  }
}

/**
 * 显示全屏Loading
 * @param text 提示文字
 */
export function showFullscreenLoading(text: string = '上传中...') {
  // 如果已经有loading实例，先关闭
  if (fullscreenLoadingInstance) {
    hideFullscreenLoading();
  }

  // 注入样式
  injectSpinnerStyle();

  // 创建容器
  const container = document.createElement('div');
  document.body.append(container);

  // 创建并渲染loading组件
  const LoadingComponent = createLoadingComponent(text);
  const vnode = createVNode(LoadingComponent);
  render(vnode, container);

  // 保存实例
  fullscreenLoadingInstance = {
    container,
    vnode,
  };

  return hideFullscreenLoading;
}

/**
 * 隐藏全屏Loading
 */
export function hideFullscreenLoading() {
  if (fullscreenLoadingInstance) {
    const { container } = fullscreenLoadingInstance;
    render(null, container);
    container.remove();
    fullscreenLoadingInstance = null;
  }
}

/**
 * 显示成功提示消息
 * @param message 提示内容
 * @param duration 显示时长（毫秒），默认3000ms
 */
export function showSuccessMessage(
  message: string = '操作成功',
  duration: number = 3000,
) {
  // 注入toast样式
  injectToastStyle();

  // 创建toast容器
  const toastContainer = document.createElement('div');
  toastContainer.className = 'success-toast-message';
  toastContainer.style.cssText = `
    position: fixed;
    top: 24px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #fff;
    color: #52c41a;
    padding: 12px 24px;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    animation: slideInDown 0.3s ease-out;
  `;

  // 创建成功图标
  const icon = document.createElement('span');
  icon.innerHTML = `
    <svg viewBox="64 64 896 896" width="16" height="16" fill="currentColor">
      <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm193.5 301.7l-210.6 292a31.8 31.8 0 01-51.7 0L318.5 484.9c-3.8-5.3 0-12.7 6.5-12.7h46.9c10.2 0 19.9 4.9 25.9 13.3l71.2 98.8 157.2-218c6-8.3 15.6-13.3 25.9-13.3H699c6.5 0 10.3 7.4 6.5 12.7z"></path>
    </svg>
  `;
  icon.style.cssText = 'display: flex; align-items: center;';

  // 创建消息文本
  const text = document.createElement('span');
  text.textContent = message;

  toastContainer.append(icon, text);
  document.body.append(toastContainer);

  // 自动移除
  setTimeout(() => {
    toastContainer.style.animation = 'slideOutUp 0.3s ease-out';
    setTimeout(() => {
      toastContainer.remove();
    }, 300);
  }, duration);
}

/**
 * 注入Toast动画样式
 */
function injectToastStyle() {
  if (!document.getElementById('success-toast-style')) {
    const style = document.createElement('style');
    style.id = 'success-toast-style';
    style.innerHTML = `
      @keyframes slideInDown {
        from {
          opacity: 0;
          transform: translate(-50%, -20px);
        }
        to {
          opacity: 1;
          transform: translate(-50%, 0);
        }
      }
      @keyframes slideOutUp {
        from {
          opacity: 1;
          transform: translate(-50%, 0);
        }
        to {
          opacity: 0;
          transform: translate(-50%, -20px);
        }
      }
    `;
    document.head.append(style);
  }
}

