/**
 * 战狼系统 - 后端API服务 v1.1.0
 * 代理飞书多维表格（通过lark-cli实时获取）和内网选品系统
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

const CONFIG = {
  feishu: {
    baseToken: process.env.FEISHU_BASE_TOKEN || 'R0x4bXhTua1GZhsjLngcUuDJnIe',
    tables: {
      suggestions: 'tbl26JVQjAYlDwyc',
      content: 'tbliVncdqx3QJVbo',
      videos: 'tbl84QEKHiPNsrjd',
      touliu: 'tblKsfKvJdaCyWxP',
      zhihui: 'tblnzbx1zcQyafzE',
      hotwords: 'tblmf75Is9pLrKpd',
      baokuan: 'tbli1B9FTsiZ17Vl',
      jingpin: 'tbltVgY3EIXOLZ1N',
      kefu: 'tblrxjyfAlF5Onej'
    }
  },
  xuanpin: { baseUrl: process.env.XUANPIN_API || 'http://192.168.8.118:1369/api' }
};

const cache = { data: {}, timestamps: {}, TTL: 30000 };

function readTableByLark(tableId, pageSize = 200) {
  return new Promise((resolve, reject) => {
    const cmd = `lark-cli base +record-list --base-token ${CONFIG.feishu.baseToken} --table-id ${tableId} --page-size ${pageSize} --json`;
    exec(cmd, { encoding: 'utf8', timeout: 60000, maxBuffer: 10 * 1024 * 1024 }, (error, stdout) => {
      if (error) return reject(error);
      try {
        const data = JSON.parse(stdout);
        const records = data.data?.data || [];
        const fields = data.data?.fields || [];
        const result = records.map(rec => {
          const obj = {};
          fields.forEach((field, i) => {
            if (i < rec.length) {
              let val = rec[i];
              if (Array.isArray(val) && val.length > 0 && val.every(v => typeof v === 'string')) val = val.join(', ');
              obj[field] = val;
            }
          });
          return obj;
        });
        resolve({ fields, records: result, count: result.length });
      } catch (e) { reject(e); }
    });
  });
}

async function getTableData(tableName) {
  const tableId = CONFIG.feishu.tables[tableName];
  if (!tableId) throw new Error(`未知表名: ${tableName}`);
  const now = Date.now();
  if (cache.data[tableName] && (now - cache.timestamps[tableName]) < cache.TTL) {
    return { ...cache.data[tableName], cached: true };
  }
  const data = await readTableByLark(tableId);
  cache.data[tableName] = data;
  cache.timestamps[tableName] = now;
  return { ...data, cached: false };
}

app.get('/api/data/:tableName', async (req, res) => {
  try {
    const data = await getTableData(req.params.tableName);
    res.json({ success: true, data, tableName: req.params.tableName });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, data: { fields: [], records: [], count: 0 } });
  }
});

app.get('/api/sync/all', async (req, res) => {
  try {
    const results = {};
    for (const t of Object.keys(CONFIG.feishu.tables)) {
      try { const d = await getTableData(t); results[t] = { success: true, count: d.count }; }
      catch (e) { results[t] = { success: false, error: e.message }; }
    }
    const successCount = Object.values(results).filter(r => r.success).length;
    res.json({ success: true, results, successCount, totalCount: Object.keys(results).length, timestamp: new Date().toISOString() });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.post('/api/cache/clear', (req, res) => { cache.data = {}; cache.timestamps = {}; res.json({ success: true, message: '缓存已清除' }); });

app.get('/api/status', (req, res) => {
  res.json({
    system: '战狼系统', version: '1.1.0', status: 'running', timestamp: new Date().toISOString(),
    dataSource: '飞书多维表格 (lark-cli实时同步)', tables: Object.keys(CONFIG.feishu.tables).length,
    cachedTables: Object.keys(cache.data).length, cacheTTL: cache.TTL / 1000 + '秒'
  });
});

app.get('/api/xuanpin/stats', async (req, res) => {
  try { const axios = (await import('axios')).default; const r = await axios.get(`${CONFIG.xuanpin.baseUrl}/stats`); res.json(r.data); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/xuanpin/products', async (req, res) => {
  try {
    const axios = (await import('axios')).default;
    const { page = 1, size = 50, sort = 'pay', date } = req.query;
    const r = await axios.get(`${CONFIG.xuanpin.baseUrl}/products`, { params: { page, size, sort, date } });
    res.json(r.data);
  } catch (e) { res.status(500).json({ error: e.message, data: [] }); }
});

app.listen(PORT, () => console.log(`战狼系统 v1.1.0 运行于 http://localhost:${PORT}`));
