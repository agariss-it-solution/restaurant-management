import React, { useState, useEffect } from "react";
import { Button, Form, Modal, Spinner, Dropdown, Card } from "react-bootstrap";
import { toast } from "react-toastify";
import { FiMenu, FiPlus } from "react-icons/fi";
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  createItem,
  updateItem,
  deleteItem,
} from "../config/api";

function ManageMenuPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryImage, setCategoryImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [showItemModal, setShowItemModal] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemSpecial, setItemSpecial] = useState(false);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchCategories();
        setCategories(data);
        if (data.length > 0) setSelectedCategory(data[0]);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch categories");
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, []);

  // CATEGORY HANDLERS
  const handleAddCategory = () => {
    setCategoryName("");
    setSelectedCategory(null);
    setPreviewUrl(null);
    setCategoryImage(null);
    setShowCategoryModal(true);
  };

  const handleEditCategory = (cat) => {
    setCategoryName(cat.category);
    setSelectedCategory(cat);
    setPreviewUrl(cat.imageUrl || "");
    setCategoryImage(null);
    setShowCategoryModal(true);
  };

  const handleDeleteCategory = async (cat) => {
    if (!window.confirm(`Delete category "${cat.category}"?`)) return;
    try {
      await deleteCategory(cat._id);
      setCategories(categories.filter((c) => c._id !== cat._id));
      toast.success("Category deleted");
      setSelectedCategory(categories[0] || null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete category");
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryName) return toast.error("Category name is required");
    try {
      const formData = new FormData();
      formData.append("category", categoryName);
      if (categoryImage) formData.append("image", categoryImage);

      let result;
      if (selectedCategory?._id) {
        result = await updateCategory(selectedCategory._id, formData, true);
        toast.success("Category updated");
      } else {
        result = await createCategory(formData, true);
        toast.success("Category created");
      }

      setCategories(
        selectedCategory?._id
          ? categories.map((c) => (c._id === result._id ? result : c))
          : [...categories, result]
      );
      setSelectedCategory(result);
      setShowCategoryModal(false);
      setCategoryName("");
      setCategoryImage(null);
      setPreviewUrl(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save category");
    }
  };

  // ITEM HANDLERS
  const handleAddItem = () => {
    if (!selectedCategory) return toast.error("Select a category first");
    setItemName("");
    setItemPrice("");
    setItemSpecial(false);
    setSelectedItem(null);
    setShowItemModal(true);
  };

  const handleEditItem = (item) => {
    setItemName(item.name);
    setItemPrice(item.Price);
    setItemSpecial(item.isSpecial);
    setSelectedItem(item);
    setShowItemModal(true);
  };

  const handleSaveItem = async () => {
    if (!selectedCategory) return toast.error("Select a category first");
    if (!itemName) return toast.error("Item name is required");
    if (!itemPrice) return toast.error("Item price is required");

    try {
      let updatedCategory;
      if (selectedItem) {
        updatedCategory = await updateItem(selectedCategory._id, selectedItem._id, {
          name: itemName,
          Price: Number(itemPrice),
          isSpecial: itemSpecial,
        });
      } else {
        updatedCategory = await createItem(selectedCategory.category, {
          name: itemName,
          Price: Number(itemPrice),
          isSpecial: itemSpecial,
        });
      }

      setCategories(
        categories.map((c) => (c._id === updatedCategory._id ? updatedCategory : c))
      );
      setSelectedCategory(updatedCategory);
      toast.success(selectedItem ? "Item updated" : "Item created");
      setShowItemModal(false);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to save item");
    }
  };

  const handleDeleteItem = async (item) => {
    if (!window.confirm(`Delete item "${item.name}"?`)) return;
    try {
      await deleteItem(selectedCategory._id, item._id);
      const updatedCategory = {
        ...selectedCategory,
        items: selectedCategory.items.filter((i) => i._id !== item._id),
      };
      setCategories(
        categories.map((c) => (c._id === updatedCategory._id ? updatedCategory : c))
      );
      setSelectedCategory(updatedCategory);
      toast.success("Item deleted");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to delete item");
    }
  };

  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" />
      </div>
    );

  return (
    <div className="container py-5" style={{ maxWidth: "1200px" }}>
      {/* HEADER */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <h3 className="fw-bold text-success mb-3 mb-md-0">🍽 Manage Menu</h3>
        <div className="d-flex flex-wrap gap-2">
          <Dropdown>
            <Dropdown.Toggle variant="outline-primary" id="dropdown-category">
              <FiMenu className="me-2" />
              {selectedCategory ? selectedCategory.category : "Select Category"}
            </Dropdown.Toggle>
            <Dropdown.Menu
              style={{
                maxHeight: "300px",
                overflowY: "auto",
                minWidth: "250px",
              }}
            >
              {categories.map((cat) => (
                <Dropdown.Item
                  key={cat._id}
                  onClick={() => setSelectedCategory(cat)}
                  className="d-flex justify-content-between align-items-center"
                >
                  <div className="d-flex align-items-center gap-2">
                    {cat.imageUrl && (
                      <img
                        src={cat.imageUrl}
                        alt={cat.category}
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                      />
                    )}
                    <span>{cat.category}</span>
                  </div>
                  <div className="d-flex gap-1">
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditCategory(cat);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(cat);
                      }}
                    >
                      Del
                    </Button>
                  </div>
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>

          <Button variant="success" onClick={handleAddCategory}>
            <FiPlus className="me-1" /> Add Category
          </Button>
          <Button
            variant="success"
            disabled={!selectedCategory}
            onClick={handleAddItem}
          >
            <FiPlus className="me-1" /> Add Item
          </Button>
        </div>
      </div>

      {/* ITEMS GRID */}
      <div className="row g-4">
        {selectedCategory?.items?.length === 0 && <p>No items available</p>}
        {selectedCategory?.items?.map((item) => (
          <div key={item._id} className="col-12 col-sm-6 col-md-4 col-lg-3">
            <Card className="shadow-sm border-0 h-100">
              <Card.Body className="d-flex flex-column">
                <Card.Title className="fw-semibold text-truncate">
                  {item.name}
                </Card.Title>
                <Card.Text>
                  ₹{item.Price}{" "}
                  {item.isSpecial && (
                    <span className="text-warning">• Chef’s Special</span>
                  )}
                </Card.Text>
                <div className="mt-auto d-flex justify-content-end gap-2">
                  <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={() => handleEditItem(item)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => handleDeleteItem(item)}
                  >
                    Delete
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </div>
        ))}
      </div>

      {/* CATEGORY MODAL */}
      <Modal show={showCategoryModal} onHide={() => setShowCategoryModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{selectedCategory ? "Edit Category" : "Add Category"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Category Name</Form.Label>
            <Form.Control
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Enter category name"
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Category Image</Form.Label>
            <Form.Control
              type="file"
              accept="image/*"
              onChange={(e) => {
                const image = e.target.files[0];
                if (image) {
                  setCategoryImage(image);
                  setPreviewUrl(URL.createObjectURL(image));
                }
              }}
            />
            {previewUrl && (
              <div className="mt-2 text-center">
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{
                    width: "90px",
                    height: "90px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid #ddd",
                  }}
                />
              </div>
            )}
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCategoryModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleSaveCategory}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ITEM MODAL */}
      <Modal show={showItemModal} onHide={() => setShowItemModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{selectedItem ? "Edit Item" : "Add Item"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Item Name</Form.Label>
            <Form.Control
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Enter item name"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Price</Form.Label>
            <Form.Control
              type="number"
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              placeholder="Enter price"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowItemModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleSaveItem}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default ManageMenuPage;
