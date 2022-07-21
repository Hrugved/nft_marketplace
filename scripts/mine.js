const { moveBlocks } = require("../utils/move-block")

const BLOCKS = 2
const SLEEP_AMONT = 1000

async function mine() {
  await moveBlocks(BLOCKS, (sleepAmount = SLEEP_AMONT))
}

mine()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
