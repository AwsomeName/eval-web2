import { message } from 'antd';
import { Upload } from 'antd';

/**
 * 验证媒体文件类型和大小
 * @param {File} file - 待验证的文件
 * @returns {boolean|string} - 验证通过返回false（阻止自动上传），验证失败返回Upload.LIST_IGNORE
 */
export const validateMediaFile = (file) => {
  // 验证文件类型
  const isImageOrVideo = file.type.startsWith('image/') || file.type.startsWith('video/');
  if (!isImageOrVideo) {
    message.error('只能上传图片或视频文件!');
    return Upload.LIST_IGNORE;
  }
  
  // 验证文件大小 (10MB)
  const isLt10M = file.size / 1024 / 1024 < 10;
  if (!isLt10M) {
    message.error('文件必须小于10MB!');
    return Upload.LIST_IGNORE;
  }
  
  return false; // 阻止自动上传，由组件控制上传行为
};

/**
 * 获取媒体文件类型
 * @param {File} file - 媒体文件
 * @returns {string} - 'image' 或 'video'
 */
export const getMediaType = (file) => {
  return file.type.startsWith('image/') ? 'image' : 'video';
};

/**
 * 创建文件预览URL
 * @param {File} file - 媒体文件
 * @returns {string} - 预览URL
 */
export const createPreviewUrl = (file) => {
  return URL.createObjectURL(file);
};

/**
 * 释放预览URL资源
 * @param {string} previewUrl - 预览URL
 */
export const revokePreviewUrl = (previewUrl) => {
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
  }
};