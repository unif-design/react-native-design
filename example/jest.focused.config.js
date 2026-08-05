'use strict';

const productionConfig = require('./jest.config');

module.exports = {
  ...productionConfig,
  // 该配置只供显式 focused 开发入口使用，不承担 production owner attestation。
  reporters: ['default'],
};
