

const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Converts a month name (e.g., "January") to a 1-indexed number (1-12).
 * @param {string} monthName - The month name (case-insensitive, can be full or three-letter abbr).
 * @returns {number|null} - The month number (1 to 12) or null if invalid.
 */
exports.getMonthNumber = (monthName) => {
    if (!monthName) return null;

    const name = monthName.toLowerCase();
    
    const index = monthNames.findIndex(m => m.toLowerCase() === name);
    if (index !== -1) {
        return index + 1; 
    }
    
   
    const abbrIndex = monthNames.findIndex(m => m.toLowerCase().startsWith(name.substring(0, 3)));
    if (abbrIndex !== -1) {
        return abbrIndex + 1; 
    }

    return null;
};