import constants from 'core/types'
import contract from 'truffle-contract'
import BinaryOptionMarket from '../../../contracts/BinaryOptionMarket.json'
import BinaryOptionMarketManager from '../../../contracts/BinaryOptionMarketManager.json'
import IERC20 from '../../../contracts/IERC20.json'
import Web3Utils from 'web3-utils'

export function claimOptions(marketAddress) {
  return async (dispatch, getState) => {
    const { web3Provider } = getState().provider
    const account = web3Provider.eth.accounts[0]

    const BOMContractConstructor = contract(BinaryOptionMarket)
    BOMContractConstructor.setProvider(web3Provider.currentProvider)
    BOMContractConstructor.defaults({ from: web3Provider.eth.defaultAccount })
    const BOMContract = BOMContractConstructor.at(marketAddress)

    await BOMContract.claimOptions({ from: account })

    const [ownLongBids, ownShortBids] = await BOMContract.bidsOf(account)
    const [ownLongClaimable, ownShortClaimable] = await BOMContract.claimableBalancesOf(account)
    const [ownLongOptions, ownShortOptions] = await BOMContract.balancesOf(account)
    const [longBids, shortBids] = await BOMContract.totalBids()
    const [longOptions, shortOptions] = await BOMContract.totalSupplies()

    return {
      type: constants.SUBMIT_CLAIM,
      bids: { long: ownLongBids, short: ownShortBids },
      totalBids: { long: longBids, short: shortBids },
      claimable: { long: ownLongClaimable, short: ownShortClaimable },
      balances: { long: ownLongOptions, short: ownShortOptions },
      totalSupplies: { long: longOptions, short: shortOptions }
    }
  }
}

export function exerciseOptions(marketAddress) {
  return async (dispatch, getState) => {
    const { web3Provider } = getState().provider
    const account = web3Provider.eth.accounts[0]

    const BOMContractConstructor = contract(BinaryOptionMarket)
    BOMContractConstructor.setProvider(web3Provider.currentProvider)
    BOMContractConstructor.defaults({ from: web3Provider.eth.defaultAccount })
    const BOMContract = BOMContractConstructor.at(marketAddress)

    await BOMContract.exerciseOptions({ from: account })

    const [ownLongBids, ownShortBids] = await BOMContract.bidsOf(account)
    const [ownLongClaimable, ownShortClaimable] = await BOMContract.claimableBalancesOf(account)
    const [ownLongOptions, ownShortOptions] = await BOMContract.balancesOf(account)
    const [longBids, shortBids] = await BOMContract.totalBids()
    const [longOptions, shortOptions] = await BOMContract.totalSupplies()

    return {
      type: constants.SUBMIT_EXERCISE,
      bids: { long: ownLongBids, short: ownShortBids },
      totalBids: { long: longBids, short: shortBids },
      claimable: { long: ownLongClaimable, short: ownShortClaimable },
      balances: { long: ownLongOptions, short: ownShortOptions },
      totalSupplies: { long: longOptions, short: shortOptions }
    }
  }
}

export function estimatePrices(marketAddress, isShort, isRefund, value) {
  return async (dispatch, getState) => {
    const { web3Provider } = getState().provider
    const BOMContractConstructor = contract(BinaryOptionMarket)
    BOMContractConstructor.setProvider(web3Provider.currentProvider)
    BOMContractConstructor.defaults({ from: web3Provider.eth.defaultAccount })
    const BOMContract = BOMContractConstructor.at(marketAddress)

    const [long, short] = await BOMContract.pricesAfterBidOrRefund(isShort ? 1 : 0, Web3Utils.toWei(value), isRefund)

    return {
      type: constants.ESTIMATE_PRICES,
      long,
      short
    }
  }
}

export function targetPrice(marketAddress, isShort, targetShort, isRefund, price) {
  return async (dispatch, getState) => {
    const { web3Provider } = getState().provider
    const BOMContractConstructor = contract(BinaryOptionMarket)
    BOMContractConstructor.setProvider(web3Provider.currentProvider)
    BOMContractConstructor.defaults({ from: web3Provider.eth.defaultAccount })
    const BOMContract = BOMContractConstructor.at(marketAddress)

    return {
      type: constants.TARGET_PRICE,
      value: await BOMContract.bidOrRefundForPrice(
        isShort ? 1 : 0,
        targetShort ? 1 : 0,
        Web3Utils.toWei(price),
        isRefund
      )
    }
  }
}

export function approveToMax(marketAddress) {
  return async (dispatch, getState) => {
    const { web3Provider } = getState().provider
    const account = web3Provider.eth.accounts[0]

    const ERC20ContractConstructor = contract(IERC20)
    ERC20ContractConstructor.setProvider(web3Provider.currentProvider)
    ERC20ContractConstructor.defaults({ from: web3Provider.eth.defaultAccount })
    const sUSD = ERC20ContractConstructor.at('0x8E20577D62D3Eab7BA9aC1b5e480d85B1A4B1D33')
    const maxInt = `0x${'f'.repeat(64)}`
    await sUSD.approve(marketAddress, maxInt, { from: account })
    const balance = await sUSD.balanceOf(account)
    const sufficientAllowance = (await sUSD.allowance(account, marketAddress)).gt(balance)

    return {
      type: constants.UPDATE_MARKET_INFO,
      sufficientAllowance: sufficientAllowance ? 'Yes' : 'No'
    }
  }
}

export async function approveManagerToMax() {
  return approveToMax('0xA07681a27Dd4Db2b60aAc1fB6068aC3E787CB2E7')
}

export function bid(marketAddress, short, value) {
  return async (dispatch, getState) => {
    const { web3Provider } = getState().provider
    const account = web3Provider.eth.accounts[0]
    const BOMContractConstructor = contract(BinaryOptionMarket)
    BOMContractConstructor.setProvider(web3Provider.currentProvider)
    const BOMContract = BOMContractConstructor.at(Web3Utils.toChecksumAddress(marketAddress))

    const ERC20ContractConstructor = contract(IERC20)
    ERC20ContractConstructor.setProvider(web3Provider.currentProvider)
    ERC20ContractConstructor.defaults({ from: web3Provider.eth.defaultAccount })
    const sUSD = ERC20ContractConstructor.at('0x8E20577D62D3Eab7BA9aC1b5e480d85B1A4B1D33')

    const tx = await BOMContract.bid(short ? 1 : 0, Web3Utils.toWei(value), { from: account })

    console.log(tx)

    const [ownLongBids, ownShortBids] = await BOMContract.bidsOf(account)

    const [ownLongClaimable, ownShortClaimable] = await BOMContract.claimableBalancesOf(account)
    const [longBids, shortBids] = await BOMContract.totalBids()
    const deposits = await BOMContract.deposited()
    const [longPrice, shortPrice] = await BOMContract.prices()

    const sUSDBalance = await sUSD.balanceOf(account)
    const sufficientAllowance = (await sUSD.allowance(account, marketAddress)).gt(sUSDBalance)

    return {
      type: constants.SUBMIT_BIDREFUND,
      bids: { long: ownLongBids, short: ownShortBids },
      totalBids: { long: longBids, short: shortBids },
      claimable: { long: ownLongClaimable, short: ownShortClaimable },
      deposits: Web3Utils.fromWei(deposits.toString(10)),
      prices: { long: longPrice, short: shortPrice },
      sUSDBalance: Web3Utils.fromWei(sUSDBalance.toString(10)),
      sufficientAllowance: sufficientAllowance ? 'Yes' : 'No'
    }
  }
}


export function refund(marketAddress, short, value) {
  return async (dispatch, getState) => {
    const { web3Provider } = getState().provider
    const account = web3Provider.eth.accounts[0]
    const BOMContractConstructor = contract(BinaryOptionMarket)
    BOMContractConstructor.setProvider(web3Provider.currentProvider)
    const BOMContract = BOMContractConstructor.at(Web3Utils.toChecksumAddress(marketAddress))

    const ERC20ContractConstructor = contract(IERC20)
    ERC20ContractConstructor.setProvider(web3Provider.currentProvider)
    ERC20ContractConstructor.defaults({ from: web3Provider.eth.defaultAccount })
    const sUSD = ERC20ContractConstructor.at('0x8E20577D62D3Eab7BA9aC1b5e480d85B1A4B1D33')

    await BOMContract.refund(short ? 1 : 0, Web3Utils.toWei(value), { from: account })
    const [ownLongBids, ownShortBids] = await BOMContract.bidsOf(account)
    const [ownLongClaimable, ownShortClaimable] = await BOMContract.claimableBalancesOf(account)
    const [longBids, shortBids] = await BOMContract.totalBids()
    const deposits = await BOMContract.deposited()
    const [longPrice, shortPrice] = await BOMContract.prices()

    const sUSDBalance = await sUSD.balanceOf(account)
    const sufficientAllowance = (await sUSD.allowance(account, marketAddress)).gt(sUSDBalance)

    return {
      type: constants.SUBMIT_BIDREFUND,
      bids: { long: ownLongBids, short: ownShortBids },
      totalBids: { long: longBids, short: shortBids },
      claimable: { long: ownLongClaimable, short: ownShortClaimable },
      deposits: Web3Utils.fromWei(deposits.toString(10)),
      prices: { long: longPrice, short: shortPrice },
      sUSDBalance: Web3Utils.fromWei(sUSDBalance.toString(10)),
      sufficientAllowance: sufficientAllowance ? 'Yes' : 'No'
    }
  }
}

export function getMarkets(matured = false) {
  return async (dispatch, getState) => {
    const { web3Provider } = getState().provider
    const ManagerContractConstructor = contract(BinaryOptionMarketManager)
    ManagerContractConstructor.setProvider(web3Provider.currentProvider)
    const ManagerContract = ManagerContractConstructor.at('0xA07681a27Dd4Db2b60aAc1fB6068aC3E787CB2E7')

    const BOMContractConstructor = contract(BinaryOptionMarket)
    BOMContractConstructor.setProvider(web3Provider.currentProvider)
    BOMContractConstructor.defaults({ from: web3Provider.eth.defaultAccount })

    const func = matured ? ManagerContract.maturedMarkets : ManagerContract.activeMarkets

    const markets = (await func(0, 1000)).map(async (m) => {
      const market = BOMContractConstructor.at(m)
      const oracleDetails = await market.oracleDetails()
      const times = await market.times()
      const prices = await market.prices()
      const phase = mapPhaseString((await market.phase()).toString())

      return {
        address: m,
        currency: Web3Utils.hexToAscii(oracleDetails[0]),
        strikePrice: Web3Utils.fromWei(oracleDetails[1].toString(10)),
        phase,
        biddingEnd: new Date(parseInt(times[0].toString(10)) * 1000),
        maturity: new Date(parseInt(times[1].toString(10)) * 1000),
        expiry: new Date(parseInt(times[2].toString(10)) * 1000),
        prices: {
          long: Web3Utils.fromWei(prices[0].toString(10)),
          short: Web3Utils.fromWei(prices[1].toString(10))
        }
      }
    })

    return await Promise.all(markets)
  }
}


export function createMarket(currency, strikePrice, biddingEnd, maturity, longBid, shortBid) {
  return async (dispatch, getState) => {
    const { web3Provider } = getState().provider
    const account = web3Provider.eth.accounts[0]
    const ManagerContractConstructor = contract(BinaryOptionMarketManager)
    ManagerContractConstructor.setProvider(web3Provider.currentProvider)
    const ManagerContract = ManagerContractConstructor.at('0xA07681a27Dd4Db2b60aAc1fB6068aC3E787CB2E7')

    const BOMContractConstructor = contract(BinaryOptionMarket)
    BOMContractConstructor.setProvider(web3Provider.currentProvider)
    BOMContractConstructor.defaults({ from: web3Provider.eth.defaultAccount })

    const tx = await ManagerContract.createMarket(
      Web3Utils.stringToHex(currency),
      Web3Utils.toWei(strikePrice),
      [Math.round(biddingEnd.getTime() / 1000), Math.round(maturity.getTime() / 1000)],
      [Web3Utils.toWei(longBid), Web3Utils.toWei(shortBid)],
        {from: account}
    )

    console.log(tx)

    return tx.logs[1].args.market

  }
}

function mapPhaseString(enumVal) {
  switch (enumVal) {
    case '0':
      return 'Bidding'
    case '1':
      return 'Trading'
    case '2':
      return 'Maturity'
    default:
      return 'Expiry'
  }
}

export function getMarketInfo(marketAddress) {
  return async (dispatch, getState) => {
    const { web3Provider } = getState().provider
    const account = web3Provider.eth.accounts[0]

    const BOMContractConstructor = contract(BinaryOptionMarket)
    BOMContractConstructor.setProvider(web3Provider.currentProvider)
    BOMContractConstructor.defaults({ from: web3Provider.eth.defaultAccount })
    const BOMContract = BOMContractConstructor.at(marketAddress)

    const ERC20ContractConstructor = contract(IERC20)
    ERC20ContractConstructor.setProvider(web3Provider.currentProvider)
    ERC20ContractConstructor.defaults({ from: web3Provider.eth.defaultAccount })
    const sUSD = ERC20ContractConstructor.at('0x8E20577D62D3Eab7BA9aC1b5e480d85B1A4B1D33')

    const phase = mapPhaseString((await BOMContract.phase()).toString())

    let result = ''
    switch ((await BOMContract.result()).toString()) {
      case '0':
        result = 'Long'
        break
      default:
        result = 'Short'
    }

    const [oraclePrice, updatedAt] = await BOMContract.oraclePriceAndTimestamp()
    const [biddingEnd, maturity, expiry] = await BOMContract.times()
    const [oracleKey, strikePrice, finalPrice] = await BOMContract.oracleDetails()
    const [longPrice, shortPrice] = await BOMContract.prices()
    const [longBids, shortBids] = await BOMContract.totalBids()
    const [longOptions, shortOptions] = await BOMContract.totalSupplies()
    const deposits = await BOMContract.deposited()

    const [ownLongBids, ownShortBids] = await BOMContract.bidsOf(account)
    const [ownLongClaimable, ownShortClaimable] = await BOMContract.claimableBalancesOf(account)
    const [ownLongOptions, ownShortOptions] = await BOMContract.balancesOf(account)

    const sUSDBalance = await sUSD.balanceOf(account)
    const sufficientAllowance = (await sUSD.allowance(account, marketAddress)).gt(sUSDBalance)

    return {
      type: constants.UPDATE_MARKET_INFO,
      currency: Web3Utils.hexToAscii(oracleKey),
      strikePrice: Web3Utils.fromWei(strikePrice.toString(10)),
      currentPrice: Web3Utils.fromWei(finalPrice.toString(10)) !== '0' ? Web3Utils.fromWei(finalPrice.toString()) : Web3Utils.fromWei(oraclePrice.toString(10)),
      phase,
      times: {
        biddingEnd: new Date(parseInt(biddingEnd.toString(10)) * 1000),
        maturity: new Date(parseInt(maturity.toString(10)) * 1000),
        expiry: new Date(parseInt(expiry.toString(10)) * 1000)
      },
      prices: { long: longPrice, short: shortPrice },
      deposits: Web3Utils.fromWei(deposits.toString(10)),
      result,
      bids: { long: ownLongBids, short: ownShortBids },
      totalBids: { long: longBids, short: shortBids },
      claimable: { long: ownLongClaimable, short: ownShortClaimable },
      balances: { long: ownLongOptions, short: ownShortOptions },
      totalSupplies: { long: longOptions, short: shortOptions },
      sufficientAllowance: sufficientAllowance ? 'Yes' : 'No',
      sUSDBalance: Web3Utils.fromWei(sUSDBalance.toString(10))
    }
  }
}
