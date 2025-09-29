const MenuCategory = require("../models/MenuCategory.js");
const Response = require("../helper/errHandler.js");
const ImgaeUrl = "https://192.168.29.36:1020/uploads/"; // Base URL for images
// ✅ Create new category with items
const createCategory = async (req, res) => {
    try {
        const { category, items = [] } = req.body;

        if (!category?.trim()) {
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
        const { category, items = [] } = req.body;

        if (!category?.trim()) {
            return Response.Error({
                res,
                status: 400,
                message: "Category name is required",
            });
        }

        // 🔍 Find category by name
        let existingCategory = await MenuCategory.findOne({ category });

        if (!existingCategory) {
            // ✅ Category not found → create new
            const newCategory = new MenuCategory({
                category,
                items,
                imageUrl: req.file?.url || `${req.protocol}://${req.get("host")}/uploads/images/default-category.webp`
            });
            await newCategory.save();

            return Response.Success({
                res,
                status: 201,
                message: "Category created successfully",
                data: newCategory,
            });
        }

        // ✅ Category found → add items (avoid duplicates)
        if (items.length > 0) {
            items.forEach((item) => {
                const duplicate = existingCategory.items.find(
                    (i) => i.name.toLowerCase() === item.name.toLowerCase()
                );
                if (!duplicate) {
                    existingCategory.items.push(item);
                }
            });

            await existingCategory.save();
        }

        return Response.Success({
            res,
            status: 200,
            message:
                items.length > 0
                    ? "Items added to existing category"
                    : "Category already exists (no new items added)",
            data: existingCategory,
        });
    } catch (err) {
        return Response.Error({
            res,
            status: 500,
            message: "Error creating/updating category",
            error: err.message,
        });
    }
};


// ✅ Get all categories with items
const getAllCategories = async (req, res) => {
    try {
        const menu = await MenuCategory.find().lean(); // Faster read-only fetch

        return Response.Success({
            res,
            status: 200,
            message: "Menu fetched successfully",
            data: menu || [],
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

        category.items.pull(itemId);
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

const updateCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { category, items: rawItems = [] } = req.body;

        const items = typeof rawItems === "string" ? JSON.parse(rawItems) : rawItems;
        const file = req.file; // multer single file upload places file in req.file, not req.files or req.file.file

        const existingCategory = await MenuCategory.findById(categoryId);
        if (!existingCategory) {
            return Response.Error({
                res,
                status: 404,
                message: "Category not found",
            });
        }

        // Update category name
        if (category?.trim()) {
            existingCategory.category = category.trim();
        }

        // Handle category image
        const defaultImageUrl = `${req.protocol}://${req.get("host")}/uploads/images/default-category.webp`;

        if (file && file.url) {
            existingCategory.imageUrl = file.url;  // Use the uploaded file's URL
        } else {
            const inputImageUrl = req.body.imageUrl?.trim();
            existingCategory.imageUrl = inputImageUrl && inputImageUrl !== "" ? inputImageUrl : (existingCategory.imageUrl || defaultImageUrl);
        }

        // Build a map of existing items by name (lowercased)
        const existingItemMap = new Map();
        existingCategory.items.forEach((item) => {
            existingItemMap.set(item.name.toLowerCase(), item);
        });

        let itemsAdded = 0;
        let itemsUpdated = 0;

        // You mentioned itemImages, but your route uses single upload, so no itemImages here.
        // If you want multiple files for items, you need to handle that differently (upload.array or upload.fields).
        // For now, just fallback to item.imageUrl.
        for (let index = 0; index < items.length; index++) {
            const item = items[index];
            const itemName = item.name?.trim();
            if (!itemName) continue;

            const key = itemName.toLowerCase();
            const existingItem = existingItemMap.get(key);

            const imageUrl = item.imageUrl?.trim() || "";

            if (existingItem) {
                if (item.price !== undefined) existingItem.Price = item.price;
                if (item.description !== undefined) existingItem.description = item.description;
                if (imageUrl) existingItem.imageUrl = imageUrl;
                if (item.isSpecial !== undefined) existingItem.isSpecial = item.isSpecial;
                itemsUpdated++;
            } else {
                existingCategory.items.push({
                    name: itemName,
                    Price: item.price ?? 0,
                    description: item.description ?? "",
                    imageUrl,
                    isSpecial: item.isSpecial ?? false,
                });
                itemsAdded++;
            }
        }

        await existingCategory.save();

        return Response.Success({
            res,
            status: 200,
            message: `${itemsAdded} item(s) added, ${itemsUpdated} item(s) updated`,
            data: existingCategory,
        });

    } catch (err) {
        console.error("Update category error:", err);
        return Response.Error({
            res,
            status: 500,
            message: "Error updating category",
            error: err.message,
        });
    }
};


// ✅ Update an item's fields inside a category
const updateItemInCategory = async (req, res) => {
    try {
        const { id, itemId } = req.params;
        const { name, Price, description, imageUrl, isSpecial } = req.body;

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

        // ✅ Dynamically update only provided fields
        if (name !== undefined) item.name = name;
        if (Price !== undefined) item.Price = Price;
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
const searchMenuitems = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return Response.Error({
                res,
                status: 400,
                message: "Search query is required",
            });
        }

        const suggestions = await MenuCategory.aggregate([
            { $unwind: "$items" },
            {
                $match: {
                    "items.name": { $regex: query, $options: "i" },
                },
            },
            {
                $addFields: {
                    matchScore: {
                        $indexOfCP: [
                            { $toLower: "$items.name" },
                            query.toLowerCase()
                        ]
                    }
                }
            },
            {
                $sort: { matchScore: 1 } // Sort by how early the match is
            },
            {
                $group: {
                    _id: "$items.name",
                },
            },
            { $limit: 10 },
            {
                $project: {
                    _id: 0,
                    name: "$_id",
                },
            },
        ]);

        return Response.Success({
            res,
            status: 200,
            message: "Suggestions fetched successfully",
            data: suggestions,
        });

    } catch (err) {
        return Response.Error({
            res,
            status: 500,
            message: "Error fetching suggestions",
            error: err.message,
        });
    }
};

module.exports = {
    // createCategory,
    addItemToCategory,
    getAllCategories,
    deleteCategory,
    deleteItemFromCategory,
    updateItemInCategory,
    updateCategory,
    searchMenuitems
};
