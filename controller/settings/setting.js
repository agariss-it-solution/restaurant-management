const Setting = require('../../models/setting');
const Response = require('../../helper/errHandler');
// const imageUrl = "http://192.168.29.36:1020/uploads/images/";

// ✅ Create Setting
const createSetting = async (req, res) => {
  try {
    const {
      restaurantName,
      phoneNumber,
      address,
      email,
      thankYouMessage
    } = req.body;

    // ✅ Validate required fields
    if (!restaurantName || !phoneNumber || !address) {
      return Response.Error({
        res,
        status: 400,
        message: "restaurantName, phoneNumber, and address are required.",
      });
    }

     const file = req.file;
    // ✅ If a file is uploaded, construct its URL
    const filePath =  `${process.env.BaseUrl}${file.filename}`;

    // ✅ Find if setting already exists (singleton pattern)
    let setting = await Setting.findOne();

    if (!setting) {
      // ✅ Create new setting
      setting = new Setting({
        restaurantName,
        phoneNumber,
        address,
        email,
        thankYouMessage,
        qr: filePath,
      });

      await setting.save();

      return Response.Success({
        res,
        status: 201,
        message: "Settings created successfully.",
        data: setting,
      });
    } else {
      // ✅ Update existing setting
      setting.restaurantName = restaurantName;
      setting.phoneNumber = phoneNumber;
      setting.address = address;
      setting.email = email;
      setting.thankYouMessage = thankYouMessage;

      if (filePath) {
        setting.qr = filePath; // only update if new file uploaded
      }

      await setting.save();

      return Response.Success({
        res,
        status: 200,
        message: "Settings updated successfully.",
        data: setting,
      });
    }
  } catch (err) {
    console.error("Error in createSetting:", err);

    return Response.Error({
      res,
      status: 500,
      message: "Something went wrong.",
      error: err.message,
    });
  }
};


// ✅ Get All Settings
const getAllSettings = async (req, res) => {
  try {
    const settings = await Setting.find().sort({ createdAt: -1 });
    return Response.Success({ res, status: 200, data: settings });
  } catch (err) {
    return Response.Error({ res, status: 500, message: "Fetch failed", error: err.message });
  }
};

// // ✅ Get Single Setting by ID
// const getSettingById = async (req, res) => {
//   try {
//     const setting = await Setting.findById(req.params.id);
//     if (!setting) {
//       return Response.Error({ res, status: 404, message: "Setting not found" });
//     }
//     return Response.Success({ res, status: 200, data: setting });
//   } catch (err) {
//     return Response.Error({ res, status: 500, message: "Fetch failed", error: err.message });
//   }
// };

// // ✅ Update Setting
// const updateSetting = async (req, res) => {
//   try {
//     const data = req.body;

//     if (req.file) {
//       data.logo = `/uploads/logos/${req.file.filename}`;
//     }

//     const setting = await Setting.findByIdAndUpdate(req.params.id, data, {
//       new: true,
//       runValidators: true,
//     });

//     if (!setting) {
//       return Response.Error({ res, status: 404, message: "Setting not found" });
//     }

//     return Response.Success({ res, status: 200, message: "Setting updated", data: setting });
//   } catch (err) {
//     return Response.Error({ res, status: 400, message: "Update failed", error: err.message });
//   }
// };

// // ✅ Delete Setting
// const deleteSetting = async (req, res) => {
//   try {
//     const deleted = await Setting.findByIdAndDelete(req.params.id);
//     if (!deleted) {
//       return Response.Error({ res, status: 404, message: "Setting not found" });
//     }
//     return Response.Success({ res, status: 200, message: "Setting deleted", data: deleted });
//   } catch (err) {
//     return Response.Error({ res, status: 400, message: "Delete failed", error: err.message });
//   }
// };

module.exports = {
  createSetting,
  getAllSettings,
  // getSettingById,
  // updateSetting,
  // deleteSetting,
};