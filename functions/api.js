export async function onRequestPost(context) {
  const { request, env } = context;
  const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

  try {
    // 1. 系统防线：严密自检大写的 DB 数据库变量是否存在
    if (!env.DB) {
      return new Response(JSON.stringify({ success: false, message: "Cloudflare 后台未完成大写名为 DB 的 D1 数据库变量绑定！" }), { status: 500, headers: corsHeaders });
    }

    // ⚡ 2. 强效自愈建表：如果检测到没有商品表，全自动在底层的 ecommerce_db 内初始化标准安全的表结构
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS products_list (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        stock_status TEXT NOT NULL,
        reviews_count INTEGER NOT NULL,
        tag_1 TEXT,
        tag_2 TEXT,
        tag_3 TEXT,
        title_heading TEXT NOT NULL,
        description_text TEXT NOT NULL,
        price REAL NOT NULL
      );
    `).run();

    const body = await request.json().catch(() => ({ action: "get_products" }));

    // ─── 核心路由分支：为前端页面无条件吐出前台卡片所需的脱敏商业数据 ───
    if (body.action === "get_products") {
      
      // 3. 如果表内完全真空，全自动安全填充两条高级示例卡片数据，确保页面刷新就能立刻看到效果
      const checkEmpty = await env.DB.prepare("SELECT COUNT(*) as count FROM products_list").first();
      if (checkEmpty.count === 0) {
        await env.DB.prepare(`
          INSERT INTO products_list (id, name, stock_status, reviews_count, tag_1, tag_2, tag_3, title_heading, description_text, price) 
          VALUES 
          ('P001', 'Kiracat', '有现货', 12, '31 - 35', '欧洲人', '极速处理', 'Sexy Pünktchenstring', '本系统经过安全脱敏核验，不经手、不截留任何用户的银行卡隐私数据要素，完全符合全球云平台的合规规范。', 22.00),
          ('P002', 'Mila Deluxe', '有现货', 19, '36 - 40', '运动型', '双层保护', 'MONDAY MOOD', '结合边缘计算节点设计的解耦数据流体系，采用参数化预编译防御机制，彻底隔绝经典的注入式攻击破坏风险。', 25.00)
        `).run();
      }

      // 4. 实施一键式高性能 SQL 查询，将商品列表安全抛给前端页面
      const { results } = await env.DB.prepare("SELECT * FROM products_list").all();
      return new Response(JSON.stringify({ success: true, data: results }), { status: 200, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: false, message: "未匹配的方法分支" }), { status: 400, headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: "D1引擎运行崩溃: " + err.message }), { status: 500, headers: corsHeaders });
  }
}
