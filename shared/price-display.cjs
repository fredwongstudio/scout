/**
 * Presentation-only price formatting for SCOUT's user-facing USD amounts.
 * The caller retains the exact numeric amount for all commercial logic.
 */
function formatDisplayPrice(currency, value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.ceil(amount));
}

module.exports = {
  formatDisplayPrice,
};
