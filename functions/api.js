export async function onRequestPost(context) {
  const { request, env } = context;
  const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

  try {
    // 1. Core Structural Protection: Ensure the Cloudflare D1 system architecture is bound
    if (!env.DB) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "【D1 数据库映射未就绪】：请前往 Cloudflare Pages 后台 -> 设置 -> 函数 -> 绑定 D1 数据库，并将其绑定变量名称指定为大写的 DB 并在完成后执行 Redeploy。" 
      }), { status: 500, headers: corsHeaders });
    }

    const body = await request.json();

    // ─── ROUTE BRANCH A: WRITE ORDER RECORD ───
    if (body.action === "write") {
      const recordId = `SQL_TXN_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      const sysTime = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
      const channelLabel = "🇨🇳 Global Edge";

      // Ultra-secure compiled SQL injection protection binding engine execution
      await env.DB.prepare(
        "INSERT INTO customer_orders (id, timestamp, channel, seller, price, method, buyer_name) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).bind(recordId, sysTime, channelLabel, body.seller, body.price, body.method, body.name).run();

      return new Response(JSON.stringify({ success: true, id: recordId }), { status: 200, headers: corsHeaders });
    }

    // ─── ROUTE BRANCH B: QUERY ADMIN RECORD看板 ───
    if (body.action === "read") {
      const adminSecret = env.SYS_ADMIN_KEY || "admin_test_123";
      if (!body.password || body.password !== adminSecret) {
        return new Response(JSON.stringify({ success: false, message: "安全鉴权中心拒绝访问。" }), { status: 403, headers: corsHeaders });
      }

      // Industrial standard: Database level high-performance descending sorting via SQLite engine indexes (O(log N))
      // Completely bypasses old KV memory sorting issues, ensuring lightning fast query execution speeds
      const { results } = await env.DB.prepare(
        "SELECT * FROM customer_orders ORDER BY timestamp DESC LIMIT 50"
      ).all();

      return new Response(JSON.stringify({ success: true, data: results }), { status: 200, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: false, message: "无匹配路由方法" }), { status: 400, headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: "D1核心计算节点运行崩溃: " + err.message }), { status: 500, headers: corsHeaders });
  }
}
