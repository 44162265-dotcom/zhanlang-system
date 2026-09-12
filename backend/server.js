/**
 * 战狼系统 - 后端API服务
 * 代理飞书多维表格API和抖音开源内容API
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// 配置
const CONFIG = {
  feishu: {
    baseToken: 'R0x4bXhTua1GZhsjLngcUuDJnIe',
    appId: process.env.FEISHU_APP_ID || '',
    appSecret: process.env.FEISHU_APP_SECRET || '',
    baseUrl: 'https://open.feishu.cn/open-apis'
  },
  douyin: {
    apiKey: process.env.DOUYIN_API_KEY || '',
    baseUrl: 'https://open.douyin.com'
  },
  xuanpin: {
    baseUrl: 'http://192.168.8.118:1369/api'
  }
};

// 飞书API代理
app.get('/api/feishu/base/:baseToken/tables/:tableId/records', async (req, res) => {
  try {
    const { baseToken, tableId } = req.params;
    const { page_size = 200, page_token } = req.query;
    
    // 获取tenant_access_token
    const token = await getFeishuToken();
    
    const response = await axios.get(
      `${CONFIG.feishu.baseUrl}/bitable/v1/apps/${baseToken}/tables/${tableId}/records`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: { page_size, page_token }
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('飞书API错误:', error.message);
    res.status(500).json({ error: error.message, data: { items: [] } });
  }
});

app.post('/api/feishu/base/:baseToken/tables/:tableId/records/batch_create', async (req, res) => {
  try {
    const { baseToken, tableId } = req.params;
    const token = await getFeishuToken();
    
    const response = await axios.post(
      `${CONFIG.feishu.baseUrl}/bitable/v1/apps/${baseToken}/tables/${tableId}/records/batch_create`,
      req.body,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('飞书批量创建错误:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/feishu/base/:baseToken/tables/:tableId/records/batch_update', async (req, res) => {
  try {
    const { baseToken, tableId } = req.params;
    const token = await getFeishuToken();
    
    const response = await axios.post(
      `${CONFIG.feishu.baseUrl}/bitable/v1/apps/${baseToken}/tables/${tableId}/records/batch_update`,
      req.body,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('飞书批量更新错误:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/feishu/base/:baseToken/tables/:tableId/records/:recordId', async (req, res) => {
  try {
    const { baseToken, tableId, recordId } = req.params;
    const token = await getFeishuToken();
    
    const response = await axios.delete(
      `${CONFIG.feishu.baseUrl}/bitable/v1/apps/${baseToken}/tables/${tableId}/records/${recordId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('飞书删除错误:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// 抖音API代理
app.get('/api/douyin/search', async (req, res) => {
  try {
    const { keyword, count = 20 } = req.query;
    
    // 这里可以接入抖音开放平台API或第三方数据服务
    // 目前返回示例数据
    res.json({
      data: generateMockVideos(keyword, count),
      total: count,
      keyword
    });
  } catch (error) {
    console.error('抖音搜索错误:', error.message);
    res.status(500).json({ error: error.message, data: [] });
  }
});

app.get('/api/douyin/hot/videos', async (req, res) => {
  try {
    const { category = 'all', limit = 50 } = req.query;
    
    res.json({
      data: generateMockVideos('热门', limit),
      total: limit,
      category
    });
  } catch (error) {
    console.error('抖音热门错误:', error.message);
    res.status(500).json({ error: error.message, data: [] });
  }
});

app.get('/api/douyin/video/detail', async (req, res) => {
  try {
    const { video_id } = req.query;
    
    res.json({
      data: {
        video_id,
        title: '爆款带货视频示例',
        author: '战狼系统',
        duration: 30,
        digg_count: 10000,
        comment_count: 500,
        share_count: 200,
        play_count: 100000
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 选品系统API代理
app.get('/api/xuanpin/stats', async (req, res) => {
  try {
    const response = await axios.get(`${CONFIG.xuanpin.baseUrl}/stats`);
    res.json(response.data);
  } catch (error) {
    console.error('选品系统统计错误:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/xuanpin/products', async (req, res) => {
  try {
    const { page = 1, size = 50, sort = 'pay', date } = req.query;
    
    const response = await axios.get(`${CONFIG.xuanpin.baseUrl}/products`, {
      params: { page, size, sort, date }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('选品系统商品错误:', error.message);
    res.status(500).json({ error: error.message, data: [] });
  }
});

// 系统状态
app.get('/api/status', (req, res) => {
  res.json({
    system: '战狼系统',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    services: {
      feishu: CONFIG.feishu.appId ? 'connected' : 'not_configured',
      douyin: CONFIG.douyin.apiKey ? 'connected' : 'mock_mode',
      xuanpin: 'connected'
    }
  });
});

// 获取飞书token
let feishuToken = null;
let tokenExpireTime = 0;

async function getFeishuToken() {
  if (feishuToken && Date.now() < tokenExpireTime) {
    return feishuToken;
  }
  
  try {
    const response = await axios.post(
      `${CONFIG.feishu.baseUrl}/auth/v3/tenant_access_token/internal`,
      {
        app_id: CONFIG.feishu.appId,
        app_secret: CONFIG.feishu.appSecret
      }
    );
    
    feishuToken = response.data.tenant_access_token;
    tokenExpireTime = Date.now() + (response.data.expire - 300) * 1000;
    
    return feishuToken;
  } catch (error) {
    console.error('获取飞书token失败:', error.message);
    return null;
  }
}

// 生成示例视频数据
function generateMockVideos(keyword, count) {
  const videos = [];
  for (let i = 0; i < count; i++) {
    videos.push({
      video_id: `mock_${keyword}_${i}`,
      title: `${keyword}爆款带货视频 - 第${i + 1}个`,
      author: `达人${i + 1}`,
      url: `https://www.iesdouyin.com/share/video/mock_${i}`,
      cover: `https://picsum.photos/seed/${i}/300/400`,
      duration: 20 + Math.floor(Math.random() * 20),
      digg_count: Math.floor(Math.random() * 50000),
      comment_count: Math.floor(Math.random() * 2000),
      share_count: Math.floor(Math.random() * 1000),
      play_count: Math.floor(Math.random() * 500000)
    });
  }
  return videos;
}

// 启动服务器
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                    战狼系统 v1.0.0                         ║
╠══════════════════════════════════════════════════════════╣
║  前端地址: http://localhost:${PORT}                         ║
║  API文档:  http://localhost:${PORT}/api/status              ║
║  数据源:   飞书多维表格 (R0x4bXhTua1GZhsjLngcUuDJnIe)   ║
║  内容源:   抖音开源内容                                     ║
╚══════════════════════════════════════════════════════════╝
  `);
});