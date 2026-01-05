export const formatPrice = (price) => {
  return `₦${price.toLocaleString()}`;
};

export const truncateText = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};