// src/config/api.js
import axios from "axios";
const API_URL = "http://localhost:1020/v1/auth"; // Base URL for auth and tables

// 🔹 Helper to get token
const getToken = () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");
  return token;
};

// 🔹 Login
export const loginUser = async (userData) => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    return result; // { message, data: { token, email, role } }
  } catch (error) {
    console.error("❌ Error during login:", error);
    throw error;
  }
};
export const logout = async () => {
  const token = getToken(); // get the token from wherever you store it

  try {
    if (!token) throw new Error("No token found");

    const response = await fetch(`${API_URL}/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    // Clear token & expiry
    localStorage.removeItem("token");
    localStorage.removeItem("tokenExpiry");

    return result; // e.g., { message: "Logout successful", data: null }
  } catch (error) {
    console.error("❌ Error logging out:", error);

    // Ensure logout on failure
    localStorage.removeItem("token");
    localStorage.removeItem("tokenExpiry");

    // Optionally return a failure object
    return { success: false, error: error.message };
  }
};
// 🔹 Register
export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("❌ Error during register:", error);
    throw error;
  }
};



// 🔹 Fetch tables
export const fetchTables = async () => {
  try {
    const token = getToken();
    const response = await fetch(`${API_URL}/table`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error("❌ Error fetching tables:", error);
    throw error;
  }
};

export const fetchAvailableTables = async () => {
  const token = getToken();
  if (!token) throw new Error("No token found");

  const response = await fetch(`${API_URL}/table/available?status=Available`, { // You may want to filter only available tables in your backend
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch available tables");
  }

  const data = await response.json();
  return data.data || data; // depends on your response structure
};



// 🔹 Create table
export const createTable = async (tableData) => {
  try {
    const token = getToken();
    const response = await fetch(`${API_URL}/table`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(tableData),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error("❌ Error creating table:", error);
    throw error;
  }
};

// 🔹 Update table
export const updateTable = async (id, updateData) => {
  try {
    const token = getToken();
    const response = await fetch(`${API_URL}/table/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error("❌ Error updating table:", error);
    throw error;
  }
};

// 🔹 Delete table
export const deleteTable = async (id) => {
  try {
    const token = getToken();
    const response = await fetch(`${API_URL}/table/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error("❌ Error deleting table:", error);
    throw error;
  }
};
//table mobe 
export const moveTable = async (fromTableId, toTableId) => {
  try {
    const token = getToken();
    if (!token) throw new Error("No token found");

    const response = await fetch(`${API_URL}/tablemove`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ fromTableId, toTableId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to move table");
    }

    const data = await response.json();
    return data; // Usually returns updated table info or confirmation
  } catch (error) {
    console.error("❌ Error moving table:", error);
    throw error; // Let the caller handle the error as needed
  }
};


export const fetchCategories = async () => {
  try {
    const token = getToken();
    if (!token) throw new Error("No token found");

    const response = await fetch(`${API_URL}/categories`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error("❌ Error fetching categories:", error);
    throw error;
  }
};


// Fetch table info by ID (to get the table number)
export const fetchTableById = async (tableId) => {
  try {
    const token = getToken();
    if (!token) throw new Error("No token found");

    const response = await fetch(`${API_URL}/table/${tableId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to fetch table ${tableId}`);
    }

    const result = await response.json();
    return result.data; // Assuming API returns { data: { _id, number, ... } }
  } catch (error) {
    console.error(`❌ Error fetching table ${tableId}:`, error);
    throw error;
  }
};


export const submitOrder = async (orderData) => {
  try {
    const token = getToken();
    if (!token) throw new Error("No token found");

    const response = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(orderData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to submit order");
    }

    // 🧠 Return order data only — no bill ID
    return result.data?.order || result;
  } catch (error) {
    console.error("❌ Error submitting order:", error);
    throw error;
  }
};



// Fetch kitchen orders
export const fetchKitchenOrders = async () => {
  try {
    const token = getToken();
    if (!token) throw new Error("No token found");



    const response = await fetch(`${API_URL}/orders`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch orders");
    }

    const data = await response.json();
    return data; // Make sure backend returns a usable array of orders
  } catch (error) {
    console.error("❌ Error fetching kitchen orders:", error);
    return []; // Return empty array on failure
  }
};

export const fetchOrders = async () => {
  const token = getToken();
  if (!token) throw new Error("No token found");


  try {
    const response = await fetch(`${API_URL}/orders`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data; // Should be an array of orders
  } catch (error) {
    console.error("Fetch orders failed:", error);
    throw error;
  }
};

export const createCategory = async (categoryData) => {
  const token = getToken();
  if (!token) throw new Error("No token found");

  try {
    const isFormData = categoryData instanceof FormData;

    const res = await axios.post(`${API_URL}/categories`, categoryData, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
      },
    });

    return res.data.data; // returns the created category
  } catch (err) {
    console.error("Failed to create category:", err.response?.data || err.message);
    throw new Error(err.response?.data?.message || "Failed to create category");
  }
};

// Update existing category
export const updateCategory = async (categoryId, categoryData) => {
  const token = getToken();
  if (!token) throw new Error("No token found");

  try {
    const isFormData = categoryData instanceof FormData;

    const res = await axios.put(`${API_URL}/categories/${categoryId}`, categoryData, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
      },
    });

    return res.data.data; // returns the updated category
  } catch (err) {
    console.error("Failed to update category:", err.response?.data || err.message);
    throw new Error(err.response?.data?.message || "Failed to update category");
  }
};

export const deleteCategory = async (categoryId) => {
  const token = getToken();
  if (!token) throw new Error("No token found");

  try {
    const res = await axios.delete(`${API_URL}/categories/${categoryId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data; // returns { message, data } or similar
  } catch (err) {
    console.error("Failed to delete category:", err.response?.data || err.message);
    throw new Error(err.response?.data?.message || "Failed to delete category");
  }
};
// Add a new item to a category
export const createItem = async (categoryName, itemData) => {
  const token = getToken();
  if (!token) throw new Error("No token found");

  const payload = {
    category: categoryName,
    items: [itemData], // Wrap single item in array
  };

  const res = await fetch(`${API_URL}/categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create item");
  return data.data;
};


export const updateItem = async (categoryId, itemId, itemData) => {
  const token = getToken();
  if (!token) throw new Error("No token found");

  try {
    // itemData must directly have { name, Price, isSpecial }
    const res = await axios.put(
      `${API_URL}/categories/${categoryId}/items/${itemId}`,
      itemData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return res.data.data; // Updated item/category returned
  } catch (err) {
    console.error("Failed to update item:", err.response?.data || err.message);
    throw new Error(err.response?.data?.message || "Failed to update item");
  }
};
export const deleteItem = async (categoryId, itemId) => {
  const token = getToken();
  if (!token) throw new Error("No token found");

  try {
    const res = await axios.delete(
      `${API_URL}/categories/${categoryId}/items/${itemId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  } catch (err) {
    console.error("Failed to delete item:", err.response?.data || err.message);
    throw new Error(err.response?.data?.message || "Failed to delete item");
  }
};

// src/config/api.js
export const getAllBills = async () => {
  const token = getToken();
  if (!token) throw new Error("No token found");

  try {
    const res = await fetch(`${API_URL}/bills/unpaid`, { // endpoint to get all bills
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch bills (Status ${res.status})`);
    }

    return await res.json(); // returns { message: "...", data: [...] }
  } catch (err) {
    console.error("⚠️ Failed to fetch all bills:", err.message);
    throw err;
  }
};
// Pay bill (cash or online) via POST
export const payBill = async (billId, payment) => {
  if (!billId) throw new Error("Bill ID is required");
  const token = getToken();
  if (!token) throw new Error("No token found");

  let bodyPayload;

  if (typeof payment === "string") {
    bodyPayload = { paymentMethod: payment.toLowerCase() };
  } else if (typeof payment === "object" && payment !== null) {
    // Here payment is the whole payload {paymentMethod: "split", paymentAmounts: { cash, online }}
    bodyPayload = {
      paymentMethod: payment.paymentMethod ?? "split",
      paymentAmounts: {
        cash: payment.paymentAmounts?.cash ?? 0,
        online: payment.paymentAmounts?.online ?? 0,
      },
    };
  } else {
    throw new Error("Invalid payment format");
  }

  // console.log("payBill bodyPayload:", bodyPayload);

  const res = await fetch(`${API_URL}/bills/${billId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bodyPayload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to pay bill (Status ${res.status})`);
  }

  return await res.json();
};
export const updateBill = async (billId, payload) => {
  if (!billId) throw new Error("Bill ID required");

  const token = getToken(); // if you're using auth
  const res = await fetch(`${API_URL}/bills/update/${billId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });


  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to update bill");
  }

  return res.json();
};





export const getAnalytics = async (params = {}) => {
  const token = getToken();
  if (!token) throw new Error("No token found");

  try {
    // Build query string dynamically (e.g., ?month=09&year=2025)
    const query = new URLSearchParams(params).toString();
    const url = `${API_URL}/analytics${query ? `?${query}` : ""}`;
    // console.log("url", url);

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      // Try parsing error JSON if possible
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch analytics (Status ${res.status})`);
    }

    const data = await res.json();
    return data; // Expect format: { success, message, data }
  } catch (error) {
    console.error("Error fetching analytics:", error);
    throw error;
  }
};
export const getAnalyticsfilter = async (params = {}) => {
  const token = getToken();
  if (!token) throw new Error("No token found");

  try {
    // Build query string dynamically (e.g., ?month=09&year=2025)
    const query = new URLSearchParams(params).toString();
    const url = `${API_URL}/analyticsfilter${query ? `?${query}` : ""}`;
    ;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      // Try parsing error JSON if possible
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch analytics (Status ${res.status})`);
    }

    const data = await res.json();
    return data; // Expect format: { success, message, data }
  } catch (error) {
    console.error("Error fetching analytics:", error);
    throw error;
  }
};


export const fetchSettings = async () => {
  const token = getToken();
  if (!token) throw new Error("No token found");

  const res = await fetch(`${API_URL}/settings`, {
    method: "GET", // ✅ fixed to match backend
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const result = await res.json().catch(() => {
    throw new Error("Invalid JSON in response");
  });

  // console.log("Fetched settings result:", result);

  if (!res.ok) {
    throw new Error(result.message || `Failed to fetch settings (Status ${res.status})`);
  }

  // ✅ Use first item from result.data array
  if (Array.isArray(result.data) && result.data.length > 0) {
    return result.data[0];
  } else {
    throw new Error("No settings data found");
  }
};


export const updateSettings = async (formData) => {
  const token = getToken();
  if (!token) throw new Error("No token found");

  const res = await fetch(`${API_URL}/settings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      // ⚠️ DO NOT set 'Content-Type' manually for FormData!
      // The browser will automatically set the correct boundary.
    },
    body: formData,
  });

  const result = await res.json().catch(() => {
    throw new Error("Invalid JSON in response");
  });

  if (!res.ok) {
    throw new Error(result.message || `Failed to save settings (Status ${res.status})`);
  }

  return result.data || {};
};


export const resetrequst = async (email) => {
  if (!email) throw new Error("Email is required");

  try {
    const res = await fetch(`${API_URL}/resetrequst`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await res.json().catch(() => {
      throw new Error("Invalid JSON in response");
    });

    if (!res.ok) {
      throw new Error(data.message || `Failed (Status ${res.status})`);
    }

    return data; // { message: "...", data: resetLink }
  } catch (err) {
    console.error("🔴 resetrequst error:", err);
    throw new Error(err.message || "Something went wrong");
  }
};





//order remove and update
export const cancelOrderItem = async ({ orderId, itemId }) => {
  const token = getToken();
  if (!token) throw new Error("No auth token");

  try {
    const res = await axios.post(
      `${API_URL}/orders/cancel`,
      { orderId, itemId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  } catch (err) {
    console.error("Cancel API error:", err.response || err.message);
    throw new Error("Failed to cancel order item");
  }
};
export const updateOrderItem = async ({ orderId, itemId, newQuantity }) => {

  try {
    const token = getToken(); // get token from localStorage/session/etc
    // console.log(token);

    if (!token) {
      throw new Error("No auth token found");
    }

    const payload = { orderId, itemId, newQuantity };
    // console.log("📤 Sending payload:", payload);

    const response = await fetch(`${API_URL}/ordersupdate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // ⚡ crucial
      },
      body: JSON.stringify(payload),
    });

    // console.log("📡 Response status:", response.status);
    const data = await response.json().catch(() => ({}));
    // console.log("📥 Response data:", data);

    if (!response.ok) {
      throw new Error(data.message || `Failed to update order item (status ${response.status})`);
    }

    return data;
  } catch (err) {
    console.error("⚠️ updateOrderItem error:", err);
    throw new Error(err.message || "Error updating order item");
  }
};

// src/config/api.js


export const resetPassword = async (email, token, newPassword) => {
  if (!email || !token || !newPassword) {
    throw new Error("Email, token, and new password are required");
  }

  try {
    const res = await fetch(`${API_URL}/reset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, token, newPassword }),
    });

    const data = await res.json().catch(() => {
      throw new Error("Invalid JSON in response");
    });

    if (!res.ok) {
      throw new Error(data.message || `Failed to reset password (Status ${res.status})`);
    }

    return data;
  } catch (err) {
    console.error("🔴 Reset password error:", err);
    throw new Error(err.message || "Failed to reset password");
  }
};

export const updateOrderStatus = async (orderId, status = "Ready") => {
  const token = getToken();
  if (!token) throw new Error("No token found");

  try {
    const response = await fetch(`${API_URL}/kitchen/orders/${orderId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // token included
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data; // Updated order data
  } catch (error) {
    console.error("Update order status failed:", error);
    throw error;
  }
};



export const getAllPaidBills = async () => {
  const token = getToken();
  if (!token) throw new Error("No token found");

  try {
    const response = await fetch(`${API_URL}/bills`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json(); // <-- parse JSON
    const paidBills = data.data.filter(bill => bill.status === "Paid");

    // Flatten orders and exclude cancelled items
    const paidOrders = paidBills.flatMap(bill =>
      bill.orders?.map(order => ({
        ...order,
        tableNumber: bill.table?.number || bill.tableNumber,
        createdAt: bill.createdAt,
        status: bill.status,
        orderId: bill._id,
        discountValue: bill.discountValue || 0,
        paymentMethod: bill.paymentMethod,
        paymentAmounts: bill.paymentAmounts, // ✅ ADD THIS LINE
        customerName: bill.customerName,
        _id: bill._id, // ✅ Also add this for consistency
        totalAmount: bill.totalAmount, // ✅ Add this too
        items: (order.items || []).filter(item => !item.isCancelled)
      })) || []
    );

    return paidOrders;
  } catch (error) {
    console.error("Error fetching bills:", error);
    throw error;
  }
};