let nextUserNumber = 1;

function generateUserId() {
  const userId =
    `USR${String(nextUserNumber).padStart(4, "0")}`;

  nextUserNumber += 1;

  return userId;
}

module.exports = generateUserId;