const { network } = require("hardhat")
const { devChains } = require("../helper-hardhat-config")
const {verify} = require('../utils/verfiy')

module.exports = async ({getNamedAccounts,deployments}) => {
  const {deploy,log} = deployments;
  const {deployer} = await getNamedAccounts();
  const args=[];
  const basicNft = await deploy('BasicNft', {
    from:deployer,
    args:args,
    log:true,
    waitConfimations: network.config.blockConfirmations || 1
  });
  if(!devChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    log('verifying on Etherscan...')
    await verify(basicNft.address,args);
  }
  log('--------------------------------------------')
}

module.exports.tags = ['all','basicnft']