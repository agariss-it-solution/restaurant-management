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
        console.log('data', data)

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

  // ---------------- EXPORT EXCEL ----------------
  const exportExcel = () => {
    const mergedOrders = mergeOrdersById(getFilteredOrders());
    if (!mergedOrders.length) return alert("No orders to export!");

    const rows = [];

    mergedOrders.forEach((order) => {
      // Header per order
      rows.push({
        "Order ID": `#${order.orderId}`,
        Table: `Table ${order.tableNumber}`,
        Item: "",
        Quantity: "",
        Price: "",
        "Food Type": "",
        Status: order.status,
        "Ordered Time": order.createdAt
          ? new Date(order.createdAt).toLocaleString("en-IN")
          : "",
        Total: "",
      });

      // Order items
      (order.items || []).forEach((item) => {
        rows.push({
          "Order ID": "",
          Table: "",
          Item: item.name || item.menuItem,
          Quantity: item.quantity,
          Price: (Number(item.Price ?? item.price) || 0).toFixed(2),
          "Food Type": item.foodType,
          Status: "",
          "Ordered Time": "",
          Total: ((Number(item.Price ?? item.price) || 0) * item.quantity).toFixed(2),
        });
      });

      // Bill total
      rows.push({
        "Order ID": "",
        Table: "",
        Item: "➡ BILL TOTAL",
        Quantity: "",
        Price: "",
        "Food Type": "",
        Status: "",
        "Ordered Time": "",
        Total: order.Price.toFixed(2),
      });

      rows.push({}); // spacing line
    });

    const grandTotal = mergedOrders.reduce((sum, o) => sum + o.Price, 0);
    rows.push({ Item: "🧾 GRAND TOTAL", Total: grandTotal.toFixed(2) });

    // Generate Excel
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();

    // Auto fit columns
    const maxWidths = [];
    rows.forEach((row) => {
      Object.keys(row).forEach((key, i) => {
        const len = String(row[key] ?? "").length;
        maxWidths[i] = Math.max(maxWidths[i] || 10, len + 2);
      });
    });
    worksheet["!cols"] = maxWidths.map((w) => ({ wch: w }));

    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
    XLSX.writeFile(workbook, `Orders_Report_${new Date().toLocaleDateString("en-GB")}.xlsx`);
  };

  const exportPDF = () => {
    const mergedOrders = mergeOrdersById(getFilteredOrders());
    if (!mergedOrders.length) return alert("No orders to export!");

    const doc = new jsPDF();
    let currentY = 25;
    let grandTotal = 0;

    // ---------------- HEADER ----------------
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Restaurant Daily Orders Report", 105, 15, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    // doc.text(`Generated on: ${new Date().toLocaleString("en-IN")}`, 14, 22);
    // doc.line(14, 24, 196, 24);

    // ---------------- ORDERS LOOP ----------------
    mergedOrders.forEach((order, index) => {
      const tableData = (order.items || []).map((item, i) => [
        i + 1,
        item.name || item.menuItem || "-",
        item.quantity || 0,
        // Number(item.Price ?? item.price || 0).toFixed(2),
        Number((item.Price ?? item.price) || 0).toFixed(2),
        ((Number(item.Price ?? item.price) || 0) * (item.quantity || 0)).toFixed(2),
      ]);

      const billTotal =
        order.Price ??
        order.items?.reduce(
          (sum, item) => sum + (Number(item.Price ?? item.price) || 0) * (item.quantity || 0),
          0
        ) ?? 0;

      grandTotal += billTotal;

      // Add Bill Total as the last row
      tableData.push(["", "", "", "Bill Total", billTotal.toFixed(2)]);

      // Section Header
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(40, 40, 40);
      doc.text(
        `Table: ${order.tableNumber || "-"}    |    Order ID: ${order.orderId || "-"}    |    Status: ${order.status || "-"}`,
        14,
        currentY
      );

      currentY += 5;

      // Order Table
      autoTable(doc, {
        head: [["#", "Item Name", "Qty", "Price ", "Total"]],
        body: tableData,
        startY: currentY,
        theme: "grid",
        headStyles: {
          fillColor: [52, 73, 94],
          textColor: 255,
          fontStyle: "bold",
          halign: "center",
        },
        bodyStyles: {
          textColor: [33, 33, 33],
          fontSize: 10,
        },
        styles: { cellPadding: 3, valign: "middle" },
        columnStyles: {
          0: { cellWidth: 10, halign: "center" },
          1: { cellWidth: 70 },
          2: { cellWidth: 20, halign: "center" },
          3: { cellWidth: 25, halign: "right" },
          4: { cellWidth: 25, halign: "right" },
        },
      });

      currentY = doc.lastAutoTable.finalY + 6;

      // Divider between orders
      doc.setDrawColor(200);
      doc.line(14, currentY, 196, currentY);
      currentY += 10;

      // Page break
      if (currentY > 260 && index < mergedOrders.length - 1) {
        doc.addPage();
        currentY = 25;
      }
    });

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 150);
    doc.text(`Grand Total:  ${grandTotal.toFixed(2)}`, 14, currentY); // start from left

    doc.line(14, currentY + 2, 196, currentY + 2);

    doc.save(`Orders_Report_${new Date().toLocaleDateString("en-GB")}.pdf`);
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

    // Fetch restaurant settings
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

    // Remove any existing overlay
    const existing = document.getElementById("order-preview-overlay");
    if (existing) existing.remove();

    // Create print overlay
    const overlay = document.createElement("div");
    overlay.id = "order-preview-overlay";
    Object.assign(overlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      background: "#fff",
      overflowY: "auto",
      zIndex: "9999",
      padding: "10px",
      fontFamily: "'Courier New', monospace",
    });

    const itemsRows = (order.items || []).map(i => `
    <tr>
      <td>${i.name || i.menuItem}</td>
      <td style="text-align:center;">${i.quantity}</td>
      <td style="text-align:right;">₹${((i.Price || i.price) * i.quantity).toFixed(2)}</td>
    </tr>
  `).join("");

    // Calculate subtotal
    const subtotal = order.items?.reduce((sum, i) => sum + ((i.Price || i.price) * i.quantity), 0) || 0;
    const discountValue = order.discountValue || 0;
    const finalTotal = subtotal - discountValue;

    // Payment method section
    let paymentSection = '';
    if (order.paymentMethod?.toLowerCase() === 'split' && order.paymentAmounts) {
      paymentSection = `
        <div style="margin-top:10px; padding:10px; border:1px dashed #333;">
          <strong>Payment Details (Split):</strong><br>
          ${order.paymentAmounts.cash > 0 ? `<span style="margin-left:10px;">💵 Cash: ₹${order.paymentAmounts.cash.toFixed(2)}</span><br>` : ''}
          ${order.paymentAmounts.online > 0 ? `<span style="margin-left:10px;">💳 Online: ₹${order.paymentAmounts.online.toFixed(2)}</span><br>` : ''}
        </div>
      `;
    } else {
      paymentSection = `
        <div style="margin-top:10px;">
          <strong>Payment Method:</strong> ${order.paymentMethod || 'Cash'}
        </div>
      `;
    }

    overlay.innerHTML = `
    <div style="max-width:400px; margin:auto;">
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
        <strong>₹${subtotal.toFixed(2)}</strong>
      </div>
      ${discountValue > 0 ? `
        <div style="display:flex; justify-content:space-between; margin-bottom:5px; color:#dc3545;">
          <span>Discount:</span> 
          <span>- ₹${discountValue.toFixed(2)}</span>
        </div>
      ` : ''}
      <hr style="border-top:2px solid #000;">
      <div style="display:flex; justify-content:space-between; font-size:18px; margin-bottom:10px;">
        <strong>Total:</strong> 
        <strong>₹${finalTotal.toFixed(2)}</strong>
      </div>
      ${paymentSection}
      <div style="text-align:center; margin-top:15px; border-top:1px dashed #333; padding-top:10px;">
        <strong>Thank you for visiting!</strong><br>
        Please come again.
      </div>
    </div>
  `;

    document.body.appendChild(overlay);

    // Wait for all images in overlay to load before printing
    const allImages = overlay.querySelectorAll("img");
    let imagesLoaded = 0;

    if (allImages.length === 0) {
      triggerPrint();
    } else {
      allImages.forEach((img) => {
        img.onload = img.onerror = () => {
          imagesLoaded++;
          if (imagesLoaded === allImages.length) {
            triggerPrint();
          }
        };
      });

      // Fallback: if images don't load in 3 seconds, still try printing
      setTimeout(() => {
        if (imagesLoaded < allImages.length) {
          console.warn("Images took too long to load. Proceeding to print anyway.");
          triggerPrint();
        }
      }, 3000);
    }

    // Print function
    function triggerPrint() {
      const bodyChildren = [...document.body.children].filter(c => c !== overlay);
      bodyChildren.forEach(c => (c.style.display = "none"));

      window.print();

      bodyChildren.forEach(c => (c.style.display = ""));
      overlay.remove();
    }
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
          // console.log('order.paymentAmounts', order)

          return (
            <div key={index} className="col-12 col-sm-6 col-md-4 col-lg-3 mb-4">
              <div className="border rounded shadow-sm p-3 bg-white h-100 d-flex flex-column justify-content-between">

                {/* Card Header */}
                <div className="mb-2">
                  <div className="d-flex justify-content-between align-items-center flex-wrap">
                    <strong className="fs-6 mb-0">
                      Table {order.tableNumber || order.table}
                    </strong>
                    <div className="d-flex align-items-center gap-3">
                      <Badge
                        bg="success"
                        className="px-2 py-1 rounded-pill text-capitalize"
                      >
                        {order.status || "New"}
                        {/* {order.paymentMethod || "New"} */}
                      </Badge>
                       {order.paymentMethod?.toLowerCase() === "split" && order.paymentAmounts ? (
                        <div className="d-flex flex-column align-items-end gap-1">
                          <Badge bg="primary" className="px-2 py-1 rounded-pill">
                            Split Payment
                          </Badge>
                          <div className="d-flex flex-column gap-1">
                            {order.paymentAmounts.cash > 0 && (
                              <Badge bg="warning" className="px-2 py-1 rounded-pill text-dark">
                                Cash: ₹{order.paymentAmounts.cash.toFixed(2)}
                              </Badge>
                            )}
                            {order.paymentAmounts.online > 0 && (
                              <Badge bg="info" className="px-2 py-1 rounded-pill">
                                Online: ₹{order.paymentAmounts.online.toFixed(2)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ) : (
                        <Badge bg="secondary" className="px-2 py-1 rounded-pill text-capitalize">
                          {order.paymentMethod || "Cash"}
                        </Badge>
                      )}



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

                {/* Total + Discount Edit */}
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

                  <div className="d-flex justify-content-between fw-bold border-top pt-2 mt-1">
                    <span>Final:</span>
                    <span className="text-primary">
                      ₹{((order.totalAmount || calculateOrderTotal(order)) - (order.discountValue || 0)).toFixed(2)}
                    </span>
                  </div>

                  {/* Edit Discount Section */}
                  {!order.isEditing ? (
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      className="mt-2 w-100"
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
                    <div className="mt-2">
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