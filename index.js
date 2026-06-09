/**
 * BudgetUsage Widget for Monday.com
 * Calculates: Total Paid Payment, Total Budget(JPY), and Percentage Used
 */

// Monday.com API Configuration
const MONDAY_API_URL = 'https://api.monday.com/v2';
const MONDAY_TOKEN = process.env.MONDAY_TOKEN; // Set this in your environment

// Column IDs
const PAID_PAYMENT_COLUMN_ID = 'numeric_mm3rtdam';
const BUDGET_JPY_COLUMN_ID = 'numeric_mm3jte2p';

/**
 * Fetch board items and their values for the specified columns
 * @param {string} boardId - Monday.com board ID
 * @returns {Promise<Array>} Array of items with column values
 */
async function fetchBoardItems(boardId) {
  const query = `
    query {
      boards(ids: ${boardId}) {
        items {
          id
          name
          column_values(ids: ["${PAID_PAYMENT_COLUMN_ID}", "${BUDGET_JPY_COLUMN_ID}"]) {
            id
            text
            value
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(MONDAY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MONDAY_TOKEN}`,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
      throw new Error(`GraphQL error: ${data.errors.map(e => e.message).join(', ')}`);
    }

    return data.data.boards[0]?.items || [];
  } catch (error) {
    console.error('Error fetching board items:', error);
    throw error;
  }
}

/**
 * Extract numeric value from column value
 * @param {string} value - Raw column value
 * @returns {number} Parsed numeric value
 */
function parseColumnValue(value) {
  if (!value) return 0;
  const parsed = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Calculate budget usage statistics
 * @param {Array} items - Array of items with column values
 * @returns {Object} Calculation results
 */
function calculateBudgetStats(items) {
  let totalPaidPayment = 0;
  let totalBudget = 0;

  items.forEach(item => {
    item.column_values.forEach(column => {
      if (column.id === PAID_PAYMENT_COLUMN_ID) {
        totalPaidPayment += parseColumnValue(column.value);
      } else if (column.id === BUDGET_JPY_COLUMN_ID) {
        totalBudget += parseColumnValue(column.value);
      }
    });
  });

  const percentage = totalBudget > 0 ? (totalPaidPayment / totalBudget) * 100 : 0;

  return {
    totalPaidPayment: Math.round(totalPaidPayment * 100) / 100,
    totalBudget: Math.round(totalBudget * 100) / 100,
    percentage: Math.round(percentage * 100) / 100,
  };
}

/**
 * Format currency value in JPY
 * @param {number} value - Numeric value
 * @returns {string} Formatted string
 */
function formatCurrency(value) {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Main function to get budget usage data
 * @param {string} boardId - Monday.com board ID
 * @returns {Promise<Object>} Budget statistics with formatted values
 */
async function getBudgetUsage(boardId) {
  try {
    const items = await fetchBoardItems(boardId);
    const stats = calculateBudgetStats(items);

    return {
      success: true,
      data: {
        totalPaidPayment: stats.totalPaidPayment,
        totalPaidPaymentFormatted: formatCurrency(stats.totalPaidPayment),
        totalBudget: stats.totalBudget,
        totalBudgetFormatted: formatCurrency(stats.totalBudget),
        percentage: stats.percentage,
        percentageFormatted: `${stats.percentage.toFixed(2)}%`,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

// Export for use in other modules
module.exports = {
  getBudgetUsage,
  calculateBudgetStats,
  parseColumnValue,
  formatCurrency,
  fetchBoardItems,
};

// Example usage (if running directly)
if (require.main === module) {
  const boardId = process.argv[2];
  if (!boardId) {
    console.error('Usage: node index.js <boardId>');
    process.exit(1);
  }

  getBudgetUsage(boardId)
    .then(result => console.log(JSON.stringify(result, null, 2)))
    .catch(error => console.error('Error:', error));
}
