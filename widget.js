/**
 * BudgetUsage Widget Frontend
 * Displays budget calculation results with real-time updates
 */

const API_ENDPOINT = '/api/budget';

/**
 * Format timestamp to readable format
 * @param {string} iso - ISO 8601 timestamp
 * @returns {string} Formatted time
 */
function formatTimestamp(iso) {
  const date = new Date(iso);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Determine progress bar color based on percentage
 * @param {number} percentage - Budget usage percentage
 * @returns {string} CSS class name
 */
function getPercentageClass(percentage) {
  if (percentage <= 50) return 'progress-safe';
  if (percentage <= 80) return 'progress-warning';
  return 'progress-danger';
}

/**
 * Update widget display with budget data
 * @param {Object} data - Budget statistics
 */
function updateWidget(data) {
  const { totalPaidPaymentFormatted, totalBudgetFormatted, percentage, percentageFormatted, timestamp } = data;

  // Update values
  document.getElementById('paidPaymentValue').textContent = totalPaidPaymentFormatted;
  document.getElementById('totalBudgetValue').textContent = totalBudgetFormatted;
  document.getElementById('percentageValue').textContent = percentageFormatted;
  document.getElementById('timestamp').textContent = formatTimestamp(timestamp);

  // Update progress bar
  const progressFill = document.getElementById('progressFill');
  const capped = Math.min(percentage, 100);
  progressFill.style.width = `${capped}%`;
  progressFill.className = `progress-fill ${getPercentageClass(percentage)}`;

  // Show content, hide loading/error
  document.getElementById('content').style.display = 'block';
  document.getElementById('loading').style.display = 'none';
  document.getElementById('error').style.display = 'none';
}

/**
 * Display error message
 * @param {string} message - Error message
 */
function showError(message) {
  document.getElementById('errorText').textContent = message;
  document.getElementById('error').style.display = 'block';
  document.getElementById('loading').style.display = 'none';
  document.getElementById('content').style.display = 'none';
}

/**
 * Fetch budget data from API
 */
async function fetchBudgetData() {
  try {
    // Show loading state
    document.getElementById('loading').style.display = 'block';
    document.getElementById('content').style.display = 'none';
    document.getElementById('error').style.display = 'none';

    // Get board ID from URL or localStorage
    const boardId = new URLSearchParams(window.location.search).get('boardId') ||
                   localStorage.getItem('budgetBoardId');

    if (!boardId) {
      throw new Error('Board ID not specified. Add ?boardId=YOUR_BOARD_ID to URL or configure in settings.');
    }

    // Fetch data
    const response = await fetch(`${API_ENDPOINT}?boardId=${boardId}`);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch budget data');
    }

    updateWidget(result.data);
  } catch (error) {
    console.error('Error fetching budget data:', error);
    showError(error.message);
  }
}

/**
 * Initialize widget
 */
function initWidget() {
  // Initial fetch
  fetchBudgetData();

  // Refresh button
  document.getElementById('refreshBtn').addEventListener('click', fetchBudgetData);

  // Auto-refresh every 5 minutes (300000 ms)
  setInterval(fetchBudgetData, 300000);
}

// Start widget when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWidget);
} else {
  initWidget();
}
