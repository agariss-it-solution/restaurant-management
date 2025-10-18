import React, { useEffect, useState } from "react";
import { getAllPaidBills, fetchSettings, updateBill } from "../config/api";
import { Badge, Button, Form, Dropdown, DropdownButton } from "react-bootstrap";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import autoTable from "jspdf-autotable";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const OrderCard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrders, setExpandedOrders] = useState({});
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await getAllPaidBills();
        setOrders(data);


      } catch (err) {
        setError("Failed to fetch paid orders.");
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, []);

  const getFilteredOrders = () => {
    if (!startDate || !endDate) return orders;
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= start && orderDate <= end;
    });
  };

  // Helper function to calculate cash amount for any payment type
  const getCashAmount = (order) => {
    if (order.paymentAmounts && (order.paymentAmounts.cash > 0 || order.paymentAmounts.online > 0)) {
      // Split payment - return the cash portion
      return order.paymentAmounts.cash || 0;
    } else if (order.paymentMethod?.toLowerCase() === "cash") {
      // Pure cash payment - return full amount
      return order.totalAmount || calculateOrderTotal(order);
    } else {
      // Online or other payment methods - cash is 0
      return 0;
    }
  };

  // Helper function to calculate online amount for any payment type
  const getOnlineAmount = (order) => {
    if (order.paymentAmounts && (order.paymentAmounts.cash > 0 || order.paymentAmounts.online > 0)) {
      // Split payment - return the online portion
      return order.paymentAmounts.online || 0;
    } else if (order.paymentMethod?.toLowerCase() === "online") {
      // Pure online payment - return full amount
      return order.totalAmount || calculateOrderTotal(order);
    } else {
      // Cash or other payment methods - online is 0
      return 0;
    }
  };

  // ---------------- EXPORT EXCEL ----------------
const exportExcel = () => {
  const orders = getFilteredOrders();
  if (!orders.length) return alert("No orders to export!");

  const rows = orders.map(order => {
    const method = order.paymentMethod?.toLowerCase() || "";

    const cash = (order.paymentAmounts?.cash ?? (method === "cash" ? order.Price : 0)) || 0;
    const online = (order.paymentAmounts?.online ?? (method === "online" ? order.Price : 0)) || 0;
    const total = cash + online;

    const items = (order.items || [])
      .map(item => `${item.quantity}x ${item.name || item.menuItem}`)
      .join(", ");

    return {
      "Bill ID": order.orderId,
      "Date": new Date(order.createdAt).toISOString().split("T")[0],
      "Payment Type": method.charAt(0).toUpperCase() + method.slice(1),
      "Cash Amount (₹)": `${cash.toFixed(2)}`,
      "Online Amount (₹)": `${online.toFixed(2)}`,
      "Total Amount (₹)": `${total.toFixed(2)}`,
      "Items Ordered": items
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  worksheet["!cols"] = Object.keys(rows[0]).map(key => ({ wch: key.length + 20 }));
  XLSX.utils.book_append_sheet(workbook, worksheet, "Billing Details");

  XLSX.writeFile(workbook, `Billing_Report_${new Date().toLocaleDateString("en-GB")}.xlsx`);
};



const exportPDF = () => {
  const orders = getFilteredOrders();
  if (!orders.length) return alert("No orders to export!");

  const doc = new jsPDF("landscape");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Sheet 1 – Billing Details", 10, 15);

  const tableData = orders.map(order => {
    const method = order.paymentMethod?.toLowerCase() || "";

    const cash = (order.paymentAmounts?.cash ?? (method === "cash" ? order.Price : 0)) || 0;
    const online = (order.paymentAmounts?.online ?? (method === "online" ? order.Price : 0)) || 0;
    const total = cash + online;

    const items = (order.items || [])
      .map(item => `${item.quantity}x ${item.name || item.menuItem}`)
      .join(", ");

    return [
      order.orderId,
      new Date(order.createdAt).toISOString().split("T")[0],
      method.charAt(0).toUpperCase() + method.slice(1),
      `${cash.toFixed(2)}`,
      `${online.toFixed(2)}`,
      `${total.toFixed(2)}`,
      items
    ];
  });

  autoTable(doc, {
    startY: 20,
    head: [["Bill ID", "Date", "Payment Type", "Cash Amount", "Online Amount", "Total Amount", "Items Ordered"]],
    body: tableData,
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: {
      fillColor: [34, 45, 50],
      textColor: 255,
      fontStyle: "bold"
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 30 },
      2: { cellWidth: 30 },
      3: { cellWidth: 35 },
      4: { cellWidth: 35 },
      5: { cellWidth: 35 },
      6: { cellWidth: 90 }
    }
  });

  doc.save(`Billing_Report_${new Date().toLocaleDateString("en-GB")}.pdf`);
};



  const handleSaveDiscount = async (bill) => {
    try {
      const originalTotal = calculateOrderTotal(bill);
      const discountValue = bill.discountValue || 0;

      if (isNaN(originalTotal)) {
        console.error("Invalid bill total calculated:", originalTotal);
        alert("Failed to update bill: Invalid bill total.");
        return;
      }

      const totalAmount = originalTotal - discountValue;

      const payload = {
        discountValue,
        totalAmount,
      };

      console.log("Updating bill with ID:", bill.orderId); // ✅ Correct ID
      console.log("Payload being sent:", payload);

      const updated = await updateBill(bill.orderId, payload); // ✅ Use bill ID

      setOrders((prev) =>
        prev.map((o) =>
          o.orderId === bill.orderId ? { ...o, ...updated, isEditing: false } : o
        )
      );

      alert("Discount updated successfully!");
    } catch (err) {
      const errorMessage =
        err?.response?.data?.message || err?.message || JSON.stringify(err);
      alert("Failed to update bill: " + errorMessage);
    }
  };

  const handlePrintOrder = async (order) => {
    let restaurant = {
      name: "MK's Food",
      address: "123 Main Street, City",
      phone: "9876543210",
      logo: "",
    };

    try {
      const settings = await fetchSettings();
      restaurant.name = settings.restaurantName || restaurant.name;
      restaurant.address = settings.address || restaurant.address;
      restaurant.phone = settings.phoneNumber || restaurant.phone;

      if (settings.logo) {
        const response = await fetch(settings.logo);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        restaurant.logo = await new Promise(resolve => {
          reader.onloadend = () => resolve(reader.result);
        });
      }
    } catch (err) {
      console.error("Failed to fetch restaurant settings:", err);
    }

    const itemsRows = (order.items || []).map(i => `
    <tr>
      <td>${i.name || i.menuItem}</td>
      <td style="text-align:center;">${i.quantity}</td>
      <td style="text-align:right;">${((i.Price || i.price) * i.quantity).toFixed(2)}</td>
    </tr>
  `).join("");

    const subtotal = order.items?.reduce((sum, i) => sum + ((i.Price || i.price) * i.quantity), 0) || 0;
    const discountValue = order.discountValue || 0;
    const finalTotal = subtotal - discountValue;

    let paymentSection = '';
    if (order.paymentMethod?.toLowerCase() === 'split' && order.paymentAmounts) {
      paymentSection = `
      <div style="margin-top:10px; padding:10px; border:1px dashed #333;">
        <strong>Payment Details (Split):</strong><br>
        ${order.paymentAmounts.cash > 0 ? `<span style="margin-left:10px;">💵 Cash: ${order.paymentAmounts.cash.toFixed(2)}</span><br>` : ''}
        ${order.paymentAmounts.online > 0 ? `<span style="margin-left:10px;">💳 Online: ${order.paymentAmounts.online.toFixed(2)}</span><br>` : ''}
      </div>
    `;
    } else {
      paymentSection = `
      <div style="margin-top:10px;">
        <strong>Payment Method:</strong> ${order.paymentMethod || 'Cash'}
      </div>
    `;
    }

    const contentHTML = `
    <div style="max-width:400px; margin:auto; font-family: 'Courier New', monospace;">
      <div style="text-align:center; margin-bottom:10px;">
        ${restaurant.logo ? `<img src="${restaurant.logo}" style="width:80px; height:auto; margin-bottom:5px;"><br>` : ""}
        <h2>${restaurant.name}</h2>
        <small>${restaurant.address}</small><br>
        <small>Phone: ${restaurant.phone}</small>
        <hr>
      </div>
      <div style="margin-bottom:10px;">
        <strong>Table:</strong> ${order.tableNumber || order.table}<br>
        <strong>Order ID:</strong> #${order.orderId}<br>
        <strong>Time:</strong> ${order.createdAt ? new Date(order.createdAt).toLocaleString() : ""}<br>
      </div>
      <table border="1" style="width:100%; border-collapse:collapse; margin-bottom:10px;">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>
      <hr>
      <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
        <strong>Subtotal:</strong> 
        <strong>${subtotal.toFixed(2)}</strong>
      </div>
      ${discountValue > 0 ? `
        <div style="display:flex; justify-content:space-between; margin-bottom:5px; color:#dc3545;">
          <span>Discount:</span> 
          <span>- ${discountValue.toFixed(2)}</span>
        </div>
      ` : ''}
      <hr style="border-top:2px solid #000;">
      <div style="display:flex; justify-content:space-between; font-size:18px; margin-bottom:10px;">
        <strong>Total:</strong> 
        <strong>${finalTotal.toFixed(2)}</strong>
      </div>
      ${paymentSection}
      <div style="text-align:center; margin-top:15px; border-top:1px dashed #333; padding-top:10px;">
        <strong>Thank you for visiting!</strong><br>
        Please come again.
      </div>
    </div>
  `;

    // Create or get the print iframe
    let iframe = document.getElementById("print-frame");
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.id = "print-frame";
      iframe.style.display = "none";
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
    <html>
      <head>
        <title>Print Order</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            box-sizing: border-box;
          }
          @page {
            size: auto;
            margin: 10mm;
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: 14px;
            margin: 0;
            padding: 10px;
            background: #fff;
            color: #000;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            padding: 6px 4px;
            border: 1px solid #333;
          }
          th {
            background: #eee;
          }
          hr {
            border: none;
            border-top: 1px solid #333;
            margin: 10px 0;
          }
          img {
            max-width: 80px;
            height: auto;
            margin-bottom: 5px;
          }
        </style>
      </head>
      <body onload="window.focus(); window.print(); window.onafterprint = () => window.close();">
        ${contentHTML}
      </body>
    </html>
  `);
    doc.close();
  };

  const calculateOrderTotal = (order) => {
    if (!order) return 0;
    // If Price exists and is a number-like value, use it
    if (order.Price != null && !isNaN(Number(order.Price))) {
      return Number(order.Price);
    }
    // Otherwise compute from items
    return (order.items || []).reduce((sum, item) => {
      const price = Number(item.Price ?? item.price) || 0;
      const qty = Number(item.quantity) || 0;
      return sum + price * qty;
    }, 0);
  };

  if (loading) return <div className="text-center py-5">Loading...</div>;
  if (error) return <div className="text-danger py-5">{error}</div>;
  if (orders.length === 0)
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
        <div className="text-dark fw-medium">No orders found.</div>
      </div>
    );
  // Merge orders that share the same orderId
  const mergeOrdersById = (orders) => {
    const merged = {};

    orders.forEach((order) => {
      if (!merged[order.orderId]) {
        merged[order.orderId] = { ...order, items: [...(order.items || [])] };
      } else {
        // append items
        merged[order.orderId].items = [
          ...(merged[order.orderId].items || []),
          ...(order.items || []),
        ];
        // optionally keep latest status, paymentMethod etc:
        merged[order.orderId].status = order.status ?? merged[order.orderId].status;
      }
    });

    Object.values(merged).forEach((order) => {
      const total = (order.items || []).reduce((sum, item) => {
        const price = Number(item.Price ?? item.price) || 0;
        const qty = Number(item.quantity) || 0;
        return sum + price * qty;
      }, 0);

      order.Price = Math.round((total + Number.EPSILON) * 100) / 100;
    });

    return Object.values(merged);
  };

  const filteredOrders = mergeOrdersById(getFilteredOrders());

  return (
    <div className="container mt-4">

      <div className="d-flex flex-column flex-md-row flex-wrap gap-2 justify-content-between align-items-start mb-3">

        <h4 className="text-capitalize mb-2 mb-md-0">Paid Bill History</h4>

        <div className="d-flex flex-column flex-md-row gap-2 align-items-start align-items-md-end   w-md-auto">

          <div className="d-flex flex-column flex-md-row gap-3 w-100 w-md-auto">

            <div className="d-flex flex-column flex-grow-1">
              <label className="small mb-0 fw-bold">Start Date</label>
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                dateFormat="dd-MM-yyyy"
                minDate={new Date()}
                maxDate={endDate || null}
                className="form-control form-control-sm"
                placeholderText="dd-mm-yyyy"
              />

            </div>

            <div className="d-flex flex-column flex-grow-1">
              <label className="small mb-0 fw-bold">End Date</label>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                dateFormat="dd-MM-yyyy"
                className="form-control form-control-sm"
                minDate={startDate}
                placeholderText="dd-mm-yyyy"
              />
            </div>
          </div>

          {/* Export Dropdown */}
          <div className="mt-2 mt-md-0">
            <DropdownButton
              id="export-dropdown"
              title="Export"
              variant="success"
              size="sm"
            >
              <Dropdown.Item onClick={exportExcel}>Export Excel</Dropdown.Item>
              <Dropdown.Item onClick={exportPDF}>Export PDF</Dropdown.Item>
            </DropdownButton>
          </div>

        </div>
      </div>

      {/* Orders grid */}
      <div className="row">
        {[...filteredOrders].slice().reverse().map((order, index) => {

          const isExpanded = expandedOrders[order.orderId] || false;
          const items = order.items || [];
          const visibleItems = isExpanded ? items : items.slice(0, 3);
          const hiddenCount = items.length - 3;

          const cashAmount = getCashAmount(order);
          const onlineAmount = getOnlineAmount(order);

          return (
            <div key={index} className="col-12 col-sm-6 col-md-4 col-lg-3 mb-4">
              <div className="border rounded shadow-sm p-3 bg-white h-100 d-flex flex-column justify-content-between">

                {/* Card Header */}
                <div className="mb-2">
                  <div className="d-flex justify-content-between align-items-center flex-wrap">
                    <strong className="fs-6">
                      {order.customerName
                        ? order.customerName
                        : `Table ${order.tableNumber || order.table}`}
                    </strong>

                    <div className="d-flex align-items-center gap-3">
                      <Badge
                        bg="success"
                        className="px-2 py-1 rounded-pill text-capitalize"
                      >
                        {order.status || "New"}
                      </Badge>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handlePrintOrder(order)}
                      >
                        Print
                      </Button>
                    </div>
                  </div>
                  <div className="text-dark fw-medium small mt-1">
                    Order ID: #{order.orderId}
                  </div>

                  {/* Created At time */}
                  <div className="text-muted small">
                    {order.createdAt ? new Date(order.createdAt).toLocaleString() : "N/A"}
                  </div>
                </div>

                {/* Items */}
                <div className="flex-grow-1">
                  {visibleItems.map((item, i) => (
                    <div
                      key={i}
                      className="d-flex justify-content-between align-items-start small mb-2"
                    >

                      <div>
                        <div className="fw-semibold">
                          {item.quantity}x {item.name || item.menuItem}
                        </div>
                        {item.foodType && (
                          <span className="badge bg-primary">{item.foodType}</span>
                        )}
                      </div>
                      <div className="fw-semibold text-success">
                        ₹{parseFloat(item.Price || item.price || 0).toFixed(2)}
                      </div>
                    </div>
                  ))}

                  {hiddenCount > 0 && !isExpanded && (
                    <div
                      className="text-primary small fw-semibold mt-1"
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        setExpandedOrders((prev) => ({
                          ...prev,
                          [order.orderId]: true,
                        }))
                      }
                    >
                      +{hiddenCount} more items
                    </div>
                  )}

                  {isExpanded && items.length > 3 && (
                    <div
                      className="text-primary small fw-semibold mt-1"
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        setExpandedOrders((prev) => ({
                          ...prev,
                          [order.orderId]: false,
                        }))
                      }
                    >
                      Show less
                    </div>
                  )}
                </div>

                {/* Total + Discount Edit + Payment Breakdown */}
                <div className="mt-3">
                  <div className="d-flex justify-content-between fw-bold">
                    <span>Total:</span>
                    <span className="text-success">
                      ₹{(order.totalAmount || calculateOrderTotal(order)).toFixed(2)}
                    </span>
                  </div>

                  {order.discountValue ? (
                    <div className="d-flex justify-content-between text-muted small mt-1">
                      <span>Discount:</span>
                      <span>- ₹{order.discountValue.toFixed(2)}</span>
                    </div>
                  ) : null}

                  <div className="d-flex justify-content-between fw-bold border-top pt-2 mt-1 mb-2">
                    <span>Final:</span>
                    <span className="text-primary">
                      ₹{((order.totalAmount || calculateOrderTotal(order)) - (order.discountValue || 0)).toFixed(2)}
                    </span>
                  </div>

                  {/* Cash Payment Breakdown Section */}
                  {order.paymentAmounts && (order.paymentAmounts.cash > 0 && order.paymentAmounts.online > 0) ? (
                    <div className="bg-light p-2 rounded mb-2 small border-start border-4 border-warning">
                      <div className="fw-semibold mb-2 text-dark">Split Payment:</div>
                      <div className="d-flex justify-content-between mb-1">
                        <span>💵 Cash:</span>
                        <span className="fw-semibold text-warning">₹{order.paymentAmounts.cash.toFixed(2)}</span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span>💳 Online:</span>
                        <span className="fw-semibold text-info">₹{order.paymentAmounts.online.toFixed(2)}</span>
                      </div>
                    </div>
                  ) : order.paymentMethod?.toLowerCase() === "cash" ? (
                    <div className="bg-light p-2 rounded mb-2 small border-start border-4 border-warning">
                      <div className="fw-semibold mb-2 text-dark">Payment:</div>
                      <div className="d-flex justify-content-between">
                        <span>💵 Cash:</span>
                        <span className="fw-semibold text-warning">₹{calculateOrderTotal(order).toFixed(2)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-light p-2 rounded mb-2 small border-start border-4 border-info">
                      <div className="fw-semibold mb-2 text-dark">Payment:</div>
                      <div className="d-flex justify-content-between">
                        <span>💳 Online:</span>
                        <span className="fw-semibold text-info">₹{calculateOrderTotal(order).toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {/* Edit Discount Section */}
                  {!order.isEditing ? (
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      className="w-100"
                      onClick={() =>
                        setOrders((prev) =>
                          prev.map((o) =>
                            o._id === order._id ? { ...o, isEditing: true } : o
                          )
                        )
                      }
                    >
                      Edit Discount
                    </Button>
                  ) : (
                    <div>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        placeholder="Enter discount amount"
                        value={order.discountValue || ""}
                        onChange={(e) =>
                          setOrders((prev) =>
                            prev.map((o) =>
                              o._id === order._id
                                ? { ...o, discountValue: Number(e.target.value) }
                                : o
                            )
                          )
                        }
                      />
                      <div className="d-flex gap-2 mt-2">
                        <Button
                          variant="success"
                          size="sm"
                          className="flex-fill"
                          onClick={() => handleSaveDiscount(order)}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="flex-fill"
                          onClick={() =>
                            setOrders((prev) =>
                              prev.map((o) =>
                                o._id === order._id ? { ...o, isEditing: false } : o
                              )
                            )
                          }
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};

export default OrderCard;