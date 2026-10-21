```javascript
export async function onRequestPost(context) {
  const { request, env } = context;
  const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

  try {
    // 1. 系统级前置守卫：校验 Cloudflare D1 驱动底座
    if (!env.DB) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "【D1 绑定硬缺失】：后端检测到您尚未在 Cloudflare Pages 的【设置】->【函数】中绑定名为大写 DB 的 D1 数据库变量！" 
      }), { status: 500, headers: corsHeaders });
    }

    // 🔥 2. 核心智能自愈防线：如果检测到表由于任何意外未创建，立即自动执行数据库初始化
    // 彻底根治 SQLite 抛出的 no such table: customer_orders 异常
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS customer_orders (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        channel TEXT NOT NULL,
        seller TEXT NOT NULL,
        price REAL NOT NULL,
        method TEXT NOT NULL,
        buyer_name TEXT NOT NULL
      );
    `).run();
    
    // 自动对齐并补全时间索引，强力支撑工业级高性能降序看盘需求
    await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_orders_time ON customer_orders(timestamp DESC);`).run();

    const body = await request.json();

    // ─── 业务分支 A：处理表单写入（防 SQL 注入设计） ───
    if (body.action === "write") {
      const uniqueId = `SQL_TXN_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      
      // 生成高精度的北京时间，解决节点漂移带来的时差困扰
      const beijingTime = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
      const currentChannel = "🇨🇳 Global System";

      // 严格实施参数编译绑定（Preprepared Statement），彻底隔绝经典的 SQL 注入破坏行为
      await env.DB.prepare(
        "INSERT INTO customer_orders (id, timestamp, channel, seller, price, method, buyer_name) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).bind(uniqueId, beijingTime, currentChannel, body.seller, body.price, body.method, body.name).run();

      return new Response(JSON.stringify({ success: true, id: uniqueId }), { status: 200, headers: corsHeaders });
    }

    // ─── 业务分支 B：处理控制台只读调阅（高性能索引切片） ───
    if (body.action === "read") {
      // 采用系统级环境变量进行密码隔离保护。若控制台未配置，缺省临时口令为 admin_test_123
      const correctSecret = env.SYS_ADMIN_KEY || "admin_test_123";
      
      if (!body.password || body.password !== correctSecret) {
        return new Response(JSON.stringify({ success: false, message: "控制台清算密钥校验不通过，安全熔断拦截。" }), { status: 403, headers: corsHeaders });
      }

      // 由 D1 数据库集群底层索引进行快速排序与前50条按需切断，O(1) 单请求数据回传，零 Worker 内存负担
      const { results } = await env.DB.prepare(
        "SELECT * FROM customer_orders ORDER BY timestamp DESC LIMIT 50"
      ).all();

      return new Response(JSON.stringify({ success: true, data: results }), { status: 200, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: false, message: "非法的调用分支行为" }), { status: 400, headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: "边缘云关系计算核心抛出异常: " + err.message }), { status: 500, headers: corsHeaders });
  }
}
