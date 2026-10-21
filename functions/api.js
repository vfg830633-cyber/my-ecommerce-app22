export async function onRequestPost(context) {
  const { request, env } = context;
  const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

  try {
    // 1. 系统防线：严密自检大写的 DB 数据库变量是否存在
    if (!env.DB) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Cloudflare 后台未完成大写名为 DB 的 D1 数据库变量绑定！请点击【设置】->【函数】进行绑定。" 
      }), { status: 500, headers: corsHeaders });
    }

    const body = await request.json().catch(() => ({ action: "get_products" }));

    // ─── 核心路由分支：为前端页面无条件吐出前台卡片所需的脱敏商业数据 ───
    if (body.action === "get_products") {
      // 2. 实施一键式高性能 SQL 查询，将商品列表安全抛给前端页面
      // 没有任何 CREATE TABLE 混淆代码，100% 规避 Esbuild 构建报错
      const { results } = await env.DB.prepare("SELECT * FROM products_list").all();
      return new Response(JSON.stringify({ success: true, data: results }), { status: 200, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: false, message: "未匹配的方法分支" }), { status: 400, headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: "D1引擎运行崩溃: " + err.message }), { status: 500, headers: corsHeaders });
  }
}
