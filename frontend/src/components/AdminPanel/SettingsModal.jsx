import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Image } from "react-bootstrap";
import { fetchSettings, updateSettings } from "../config/api";

function SettingsModal({ show, onHide }) {
  const [settings, setSettings] = useState({
    restaurantName: "",
    email: "",
    phoneNumber: "",
    address: "",
    thankYouMessage: "",
    file: "",       // QR image URL preview
    logo: "",       // Bill logo URL preview
    fileRaw: null,  // QR File object
    logoRaw: null,  // Logo File object
    createdAt: "",
    updatedAt: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const data = await fetchSettings();
        setSettings({
          restaurantName: data.restaurantName || "",
          email: data.email || "",
          phoneNumber: data.phoneNumber || "",
          address: data.address || "",
          thankYouMessage: data.thankYouMessage || "",
          file: data.qr || "",      // existing QR url
          logo: data.logo || "",    // existing Bill logo url
          fileRaw: null,
          logoRaw: null,
          createdAt: data.createdAt || "",
          updatedAt: data.updatedAt || "",
        });
        setErrors({});
      } catch (err) {
        console.error("Failed to load settings:", err.message);
      } finally {
        setLoading(false);
      }
    };

    if (show) {
      loadSettings();
    }
  }, [show]);

  const validate = () => {
    const newErrors = {};

    if (!settings.restaurantName.trim()) {
      newErrors.restaurantName = "Restaurant name is required";
    }

    if (!settings.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!/^\d{10}$/.test(settings.phoneNumber)) {
      newErrors.phoneNumber = "Phone number must be exactly 10 digits";
    }

    if (!settings.address.trim()) {
      newErrors.address = "Address is required";
    }

    if (!settings.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(settings.email)) {
      newErrors.email = "Invalid email format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("restaurantName", settings.restaurantName);
      formData.append("phoneNumber", settings.phoneNumber);
      formData.append("address", settings.address);
      formData.append("email", settings.email);
      formData.append("thankYouMessage", settings.thankYouMessage);

      if (settings.fileRaw) {
        formData.append("qr", settings.fileRaw);
      }

      if (settings.logoRaw) {
        formData.append("logo", settings.logoRaw);
      }

      const updated = await updateSettings(formData);

      setSettings({
        restaurantName: updated.restaurantName || "",
        email: updated.email || "",
        phoneNumber: updated.phoneNumber || "",
        address: updated.address || "",
        thankYouMessage: updated.thankYouMessage || "",
        file: updated.qr || "",
        logo: updated.logo || "",
        fileRaw: null,
        logoRaw: null,
        createdAt: updated.createdAt || "",
        updatedAt: updated.updatedAt || "",
      });

      alert("Settings updated successfully ✅");
      onHide();
    } catch (err) {
      console.error("Failed to update settings:", err.message);
      alert(err.message || "Failed to update settings ❌");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSettings({
      restaurantName: "",
      email: "",
      phoneNumber: "",
      address: "",
      thankYouMessage: "",
      file: "",
      logo: "",
      fileRaw: null,
      logoRaw: null,
      createdAt: "",
      updatedAt: "",
    });
    setErrors({});
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Restaurant Settings</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          {/* Restaurant Name */}
          <Form.Group className="mb-3">
            <Form.Label>Restaurant Name *</Form.Label>
            <Form.Control
              type="text"
              value={settings.restaurantName}
              isInvalid={!!errors.restaurantName}
              onChange={(e) =>
                setSettings({ ...settings, restaurantName: e.target.value })
              }
            />
            <Form.Control.Feedback type="invalid">
              {errors.restaurantName}
            </Form.Control.Feedback>
          </Form.Group>

          {/* Email */}
          <Form.Group className="mb-3">
            <Form.Label>Email *</Form.Label>
            <Form.Control
              type="email"
              value={settings.email}
              isInvalid={!!errors.email}
              onChange={(e) =>
                setSettings({ ...settings, email: e.target.value })
              }
            />
            <Form.Control.Feedback type="invalid">
              {errors.email}
            </Form.Control.Feedback>
          </Form.Group>

          {/* Phone Number */}
          <Form.Group className="mb-3">
            <Form.Label>Phone Number *</Form.Label>
            <Form.Control
              type="text"
              value={settings.phoneNumber}
              isInvalid={!!errors.phoneNumber}
              onChange={(e) =>
                setSettings({ ...settings, phoneNumber: e.target.value })
              }
            />
            <Form.Control.Feedback type="invalid">
              {errors.phoneNumber}
            </Form.Control.Feedback>
          </Form.Group>

          {/* Address */}
          <Form.Group className="mb-3">
            <Form.Label>Address *</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={settings.address}
              isInvalid={!!errors.address}
              onChange={(e) =>
                setSettings({ ...settings, address: e.target.value })
              }
            />
            <Form.Control.Feedback type="invalid">
              {errors.address}
            </Form.Control.Feedback>
          </Form.Group>

          {/* Thank You Message */}
          <Form.Group className="mb-3">
            <Form.Label>Thank You Message</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={settings.thankYouMessage}
              onChange={(e) =>
                setSettings({ ...settings, thankYouMessage: e.target.value })
              }
            />
          </Form.Group>

          {/* Payment QR Upload */}
          <Form.Group className="mb-3">
            <Form.Label>Payment QR</Form.Label>
            <Form.Control
              type="file"
              accept="image/*"
              onChange={(e) =>
                setSettings({
                  ...settings,
                  fileRaw: e.target.files[0],
                  file: e.target.files[0]
                    ? URL.createObjectURL(e.target.files[0])
                    : "",
                })
              }
            />
            {settings.file && (
              <div className="mt-3">
                <Image
                  src={settings.file}
                  alt="Payment QR Preview"
                  fluid
                  thumbnail
                  width={150}
                />
              </div>
            )}
          </Form.Group>

          {/* Bill Logo Upload */}
          <Form.Group className="mb-3">
            <Form.Label>Bill Logo</Form.Label>
            <Form.Control
              type="file"
              accept="image/*"
              onChange={(e) =>
                setSettings({
                  ...settings,
                  logoRaw: e.target.files[0],
                  logo: e.target.files[0]
                    ? URL.createObjectURL(e.target.files[0])
                    : "",
                })
              }
            />
            {settings.logo && (
              <div className="mt-3">
                <Image
                  src={settings.logo}
                  alt="Bill Logo Preview"
                  fluid
                  thumbnail
                  width={150}
                />
              </div>
            )}
          </Form.Group>

          {/* Bill Header Preview */}
          <hr />
          <h5>Bill Header Preview</h5>
          <div className="p-3 border rounded bg-light text-center">
            {settings.logo && (
              <Image
                src={settings.logo}
                alt="Bill Logo"
                fluid
                thumbnail
                width={100}
                className="mb-2"
              />
            )}
            <h5 className="mb-2">
              {settings.restaurantName || "Restaurant Name"}
            </h5>
            <p className="mb-1">{settings.address || "Address goes here"}</p>
            <p className="mb-1">
              {settings.phoneNumber && <span>{settings.phoneNumber}</span>}
            </p>
            <p className="mb-0">{settings.email}</p>
          </div>
        </Form>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-center">
        <Button variant="outline-danger" onClick={handleReset}>
          Reset to Defaults
        </Button>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="success" onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save Settings"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default SettingsModal;
