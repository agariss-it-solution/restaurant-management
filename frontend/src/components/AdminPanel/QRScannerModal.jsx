import React, { useEffect, useState } from "react";
import { QrReader } from "react-qr-reader";
import { FiX } from "react-icons/fi";
import { fetchSettings } from "../config/api";

const QRScannerModal = ({
  showScanner,
  setShowScanner,
  handlePay,
  scanningBillId,
  setScanningBillId,
  amount,
  paymentMode, // <-- Added this prop
}) => {
  const [qrImage, setQrImage] = useState("");

  useEffect(() => {
    const loadQr = async () => {
      try {
        const data = await fetchSettings(); // Assume it returns { qr: "image_url" }
        setQrImage(data.qr || "");
      } catch (err) {
        console.error("Failed to load QR image:", err.message);
      }
    };

    if (showScanner) loadQr();
  }, [showScanner]);

  if (!showScanner) return null;

  const closeModal = () => {
    setShowScanner(false);
    setScanningBillId(null);
  };

  const handleDone = () => {
    if (!scanningBillId) return;
    handlePay(scanningBillId, "Online");
    closeModal();
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ zIndex: 2000, backgroundColor: "rgba(0,0,0,0.7)" }}
    >
      <div
        className="bg-white p-4 rounded-4 shadow-lg text-center position-relative"
        style={{ width: "350px", maxWidth: "90%" }}
      >
        {/* Close Button */}
        <button
          className="btn btn-outline-secondary position-absolute d-flex align-items-center"
          style={{
            top: "10px",
            right: "10px",
            fontSize: "0.8rem",
            padding: "4px 10px",
            borderRadius: "20px",
          }}
          onClick={closeModal}
        >
          <FiX className="me-1" size={16} />
          Close
        </button>

        {/* Payment Info */}
        <div className="mt-4 mb-3">
          <h5 className="mb-1">Scan to Pay</h5>
          {paymentMode === "Online" && (
            <>Amount: ₹{amount != null ? Number(amount).toFixed(2) : "0.00"}</>
          )}
        </div>

        {/* QR Scanner */}
        <div
          className="position-relative mt-3"
          style={{
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <QrReader
            constraints={{ facingMode: "environment" }}
            onResult={(result, error) => {
              if (!!result) {
                console.log("QR Code Result:", result?.text);
              }
              if (!!error) {
                console.error("QR Scanner Error:", error);
              }
            }}
            style={{ width: "100%" }}
          />

          {/* Optional overlay as a frame */}
          {qrImage && (
            <img
              src={qrImage}
              alt="QR Frame Overlay"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "contain",
                pointerEvents: "none",
              }}
            />
          )}
        </div>

        {/* Done Button */}
        <button
          className="btn btn-success mt-4 w-100 rounded-pill"
          onClick={handleDone}
        >
          Done
        </button>
      </div>
    </div>
  );
};

export default QRScannerModal;
