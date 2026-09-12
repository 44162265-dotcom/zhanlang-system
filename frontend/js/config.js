/**
 * 战狼系统 - 全局配置
 * 数据源：飞书多维表格
 * 内容源：抖音开源内容
 */

const CONFIG = {
  // 系统信息
  system: {
    name: '战狼系统',
    version: '1.0.0',
    description: '市场爆款作战系统 - 选品→内容→拆解→投流全链路',
    lastUpdate: new Date().toISOString()
  },

  // 飞书多维表格配置（数据源基座）
  feishu: {
    baseToken: 'R0x4bXhTua1GZhsjLngcUuDJnIe',
    baseUrl: 'https://feishu.doubao.com/base/R0x4bXhTua1GZhsjLngcUuDJnIe',
    apiBase: '/api/feishu',
    tables: {
      // 选品相关
      建议售卖表: 'tbl26JVQjAYlDwyc',
      全平台爆款库: 'tbli1B9FTsiZ17Vl',
      搜索热度关键词: 'tblmf75Is9pLrKpd',
      // 内容相关
      内容素材方向表: 'tbliVncdqx3QJVbo',
      爆款视频拆解混剪库: 'tbl84QEKHiPNsrjd',
      // 投流相关
      投流决策测算表: 'tblKsfKvJdaCyWxP',
      // 运营相关
      战狼作战指挥室: 'tblnzbx1zcQyafzE',
      竞品监控表: 'tbltVgY3EIXOLZ1N',
      客服售后知识库: 'tblrxjyfAlF5Onej'
    },
    // 5大主营品类
    categories: ['日用百货', '家清类', '五金件', '滋补类', '茶叶类'],
    // 数据同步配置
    sync: {
      enabled: true,
      interval: 300000, // 5分钟自动同步
      autoSync: true
    }
  },

  // 抖音内容配置
  douyin: {
    apiBase: '/api/douyin',
    // 抖音开源内容接口
    endpoints: {
      hotVideos: '/hot/videos',
      search: '/search',
      videoDetail: '/video/detail',
      authorInfo: '/author/info',
      comments: '/video/comments'
    },
    // 搜索关键词模板
    searchTemplates: {
      爆款带货: '抖音爆款带货视频 {product} 高转化 短视频',
      好物推荐: '{product} 抖音短视频 好物推荐 带货',
      拆解分析: '{product} iesdouyin 分享视频 爆款'
    },
    // 视频链接格式
    videoUrlPatterns: [
      'https://www.iesdouyin.com/share/video/',
      'https://v.douyin.com/',
      'https://www.douyin.com/video/'
    ]
  },

  // 选品系统配置（内网API）
  xuanpin: {
    baseUrl: 'http://192.168.8.118:1369',
    apiBase: 'http://192.168.8.118:1369/api',
    endpoints: {
      stats: '/stats',
      products: '/products',
      userInfo: '/userInfo',
      allianceBoard: '/alliance/board'
    },
    // 2-3倍定价筛选
    pricing: {
      enabled: true,
      minPrice: 10,
      maxPrice: 200,
      multiplier: 2.5
    }
  },

  // 投流配置
  touliu: {
    platform: '微信小店',
    targetAudience: '30-50岁女性',
    // ROI阈值
    roiThreshold: 1.5,
    // 测试预算
    testBudget: 100
  },

  // UI配置
  ui: {
    theme: 'dark',
    primaryColor: '#FF4D4F',
    accentColor: '#FAAD14',
    successColor: '#52C41A',
    warningColor: '#FAAD14',
    dangerColor: '#FF4D4F',
    // 图表配置
    charts: {
      backgroundColor: 'transparent',
      textColor: '#E8E8E8',
      gridColor: 'rgba(255,255,255,0.1)'
    }
  },

  // 定时任务配置
  cron: {
    搜索热度每小时更新: '0 * * * *',
    内容素材自动填充: '0,30 * * * *',
    爆款视频自动拆解: '10,40 * * * *',
    全链路自动推进: '20 * * * *'
  }
};

// 导出配置（支持浏览器和Node.js）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}