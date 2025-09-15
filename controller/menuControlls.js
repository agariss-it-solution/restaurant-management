const MenuCategory = require("../models/MenuItem.js");
const Response = require("../helper/errHandler.js"); // ✅ same helper

// ✅ Create new category with items
const createCategory = async (req, res) => {
    try {
        const { category, items } = req.body;

        if (!category) {
            return Response.Error({
                res,
                status: 400,
                message: "Category name is required",
            });
        }

        const newCategory = new MenuCategory({ category, items });
        await newCategory.save();

        return Response.Success({
            res,
            status: 201,
            message: "Category created successfully",
            data: newCategory,
        });
    } catch (err) {
        return Response.Error({
            res,
            status: 500,
            message: "Error creating category",
            error: err.message,
        });
    }
};

// ✅ Add item to an existing category
const addItemToCategory = async (req, res) => {
    try {
    
        const  {id}  = req.params;
      
        const { name, Price, description, imageUrl, isSpecial } = req.body;
console.log('req.body', req.body)
        const category = await MenuCategory.findById(id);
        if (!category) {
            return Response.Error({
                res,
                status: 404,
                message: "Category not found",
            });
        }

        category.items.push({ name, Price, description, imageUrl, isSpecial });
        await category.save();

        return Response.Success({
            res,
            status: 201,
            message: "Item added successfully",
            data: category,
        });
    } catch (err) {
        return Response.Error({
            res,
            status: 500,
            message: "Error adding item",
            error: err.message,
        });
    }
};

// ✅ Get all categories with items
const getAllCategories = async (req, res) => {
    try {
        const menu = await MenuCategory.find();

        return Response.Success({
            res,
            status: 200,
            message: "Menu fetched successfully",
            data: menu,
        });
    } catch (err) {
        return Response.Error({
            res,
            status: 500,
            message: "Error fetching menu",
            error: err.message,
        });
    }
};

// ✅ Delete a category
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        
        const deleted = await MenuCategory.findByIdAndDelete(id);

        if (!deleted) {
            return Response.Error({
                res,
                status: 404,
                message: "Category not found",
            });
        }

        return Response.Success({
            res,
            status: 200,
            message: "Category deleted successfully",
        });
    } catch (err) {
        return Response.Error({
            res,
            status: 500,
            message: "Error deleting category",
            error: err.message,
        });
    }
};

// ✅ Delete an item from a category
const deleteItemFromCategory = async (req, res) => {
    try {
        const { id, itemId } = req.params;

        const category = await MenuCategory.findById(id);
        if (!category) {
            return Response.Error({
                res,
                status: 404,
                message: "Category not found",
            });
        }

        const item = category.items.id(itemId);
        if (!item) {
            return Response.Error({
                res,
                status: 404,
                message: "Item not found",
            });
        }

        item.remove();
        await category.save();

        return Response.Success({
            res,
            status: 200,
            message: "Item deleted successfully",
            data: category,
        });
    } catch (err) {
        return Response.Error({
            res,
            status: 500,
            message: "Error deleting item",
            error: err.message,
        });
    }
};
// ✅ Update an item's price (or other fields) inside a category
const updateItemInCategory = async (req, res) => {
    try {
        const { id, itemId } = req.params;
        const { name, price, description, imageUrl, isSpecial } = req.body;

        const category = await MenuCategory.findById(id);
        if (!category) {
            return Response.Error({
                res,
                status: 404,
                message: "Category not found",
            });
        }

        const item = category.items.id(itemId);
        if (!item) {
            return Response.Error({
                res,
                status: 404,
                message: "Item not found",
            });
        }

        // ✅ Update only the provided fields
        if (name !== undefined) item.name = name;
        if (price !== undefined) item.price = price;
        if (description !== undefined) item.description = description;
        if (imageUrl !== undefined) item.imageUrl = imageUrl;
        if (isSpecial !== undefined) item.isSpecial = isSpecial;

        await category.save();

        return Response.Success({
            res,
            status: 200,
            message: "Item updated successfully",
            data: category,
        });
    } catch (err) {
        return Response.Error({
            res,
            status: 500,
            message: "Error updating item",
            error: err.message,
        });
    }
};
module.exports = {
    createCategory,
    addItemToCategory,
    getAllCategories,
    deleteCategory,
    deleteItemFromCategory,
    updateItemInCategory,
}