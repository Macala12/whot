const players = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  name: `Player ${i + 1}`
}));

module.exports = players;
