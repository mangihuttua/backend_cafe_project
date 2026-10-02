
import pool from "../config/database.js";

export const createOrder = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      customer_name,
      phone,
      order_type,
      table_number,
      note,
      items,
    } = req.body;

    // 1. Validasi data pemesan
    if (
      !customer_name?.trim() ||
      !phone?.trim() ||
      !["Dine In", "Take Away"].includes(order_type) ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Data pesanan belum lengkap atau tidak valid",
      });
    }

    // 2. Validasi setiap item
    for (const item of items) {
      if (
        !Number.isInteger(Number(item.menu_id)) ||
        Number(item.menu_id) <= 0 ||
        !Number.isInteger(Number(item.quantity)) ||
        Number(item.quantity) <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Menu atau jumlah pesanan tidak valid",
        });
      }
    }

    // 3. Ambil harga menu dari database
    const menuIds = [...new Set(
      items.map((item) => Number(item.menu_id))
    )];

    await client.query("BEGIN");

    const menuResult = await client.query(
      `SELECT id, price
       FROM menu_items
       WHERE id = ANY($1::int[])`,
      [menuIds]
    );

    if (menuResult.rows.length !== menuIds.length) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Ada menu yang tidak ditemukan",
      });
    }

    const menuPrices = new Map(
      menuResult.rows.map((menu) => [
        menu.id,
        Number(menu.price),
      ])
    );

    // 4. Hitung total harga
    const total_price = items.reduce((total, item) => {
      const price = menuPrices.get(Number(item.menu_id));
      return total + price * Number(item.quantity);
    }, 0);

    // 5. Simpan data utama pesanan
    const orderResult = await client.query(
      `INSERT INTO orders (
        customer_name,
        phone,
        order_type,
        table_number,
        note,
        total_price
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        customer_name.trim(),
        phone.trim(),
        order_type,
        order_type === "Dine In" ? table_number : null,
        note || "",
        total_price,
      ]
    );

    const order = orderResult.rows[0];

    // 6. Simpan setiap item pesanan
    for (const item of items) {
      const menuId = Number(item.menu_id);
      const quantity = Number(item.quantity);
      const price = menuPrices.get(menuId);

      await client.query(
        `INSERT INTO order_items (
          order_id,
          menu_id,
          quantity,
          price
        )
        VALUES ($1, $2, $3, $4)`,
        [order.id, menuId, quantity, price]
      );
    }

    // 7. Simpan seluruh transaksi
    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Order berhasil dibuat",
      data: {
        ...order,
        items,
      },
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create order error:", error);

    res.status(500).json({
      success: false,
      message: "Gagal membuat order",
    });
  } finally {
    client.release();
  }
};
