
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

// GET ALL ORDERS
export const getAllOrders = async (req, res) => {
  try {
    // Mengambil seluruh pesanan
    const orderResult = await pool.query(
      `SELECT *
       FROM orders
       ORDER BY created_at DESC`
    );

    const orders = orderResult.rows;

    // Jika belum ada pesanan
    if (orders.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Belum ada pesanan",
        data: [],
      });
    }

    // Mengambil detail item dari seluruh pesanan
    const orderIds = orders.map((order) => order.id);

    const itemResult = await pool.query(
      `SELECT
         oi.order_id,
         oi.menu_id,
         mi.title AS menu_name,
         oi.quantity,
         oi.price
       FROM order_items oi
       LEFT JOIN menu_items mi ON oi.menu_id = mi.id
       WHERE oi.order_id = ANY($1::int[])
       ORDER BY oi.id ASC`,
      [orderIds]
    );

    // Menggabungkan pesanan dengan item masing-masing
    const data = orders.map((order) => ({
      ...order,
      items: itemResult.rows.filter(
        (item) => item.order_id === order.id
      ),
    }));

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get all orders error:", error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil data pesanan",
    });
  }
};

// GET ORDER BY ID
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID pesanan tidak valid",
      });
    }

    const orderResult = await pool.query(
      `SELECT *
       FROM orders
       WHERE id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pesanan tidak ditemukan",
      });
    }

    const itemResult = await pool.query(
      `SELECT
         oi.menu_id,
         mi.title AS menu_name,
         oi.quantity,
         oi.price
       FROM order_items oi
       LEFT JOIN menu_items mi ON oi.menu_id = mi.id
       WHERE oi.order_id = $1`,
      [id]
    );

    res.status(200).json({
      success: true,
      data: {
        ...orderResult.rows[0],
        items: itemResult.rows,
      },
    });
  } catch (error) {
    console.error("Get order detail error:", error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil detail pesanan",
    });
  }
};

// UPDATE ORDER STATUS
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatus = [
      "Pending",
      "Processing",
      "Completed",
      "Cancelled",
    ];

    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID pesanan tidak valid",
      });
    }

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status pesanan tidak valid",
      });
    }

    const result = await pool.query(
      `UPDATE orders
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pesanan tidak ditemukan",
      });
    }

    res.status(200).json({
      success: true,
      message: "Status pesanan berhasil diperbarui",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Update order status error:", error);

    res.status(500).json({
      success: false,
      message: "Gagal memperbarui status pesanan",
    });
  }
};
