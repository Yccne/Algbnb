const buildPaginatedResponse = ({ items, total, limit, offset }) => ({
  items,
  total,
  limit,
  offset,
  has_more: offset + limit < total,
});

module.exports = {
  buildPaginatedResponse,
};
