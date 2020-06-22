import React, { Component }     from 'react'
import { Header } from 'semantic-ui-react'

import { connect }              from 'react-redux'
import { bindActionCreators }   from 'redux'
import * as providerActionCreators from 'core/actions/actions-provider'
import * as marketActionCreators  from 'core/actions/actions-market'
import TextField                from '@material-ui/core/TextField'
import Button                   from '@material-ui/core/Button'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import ExpansionPanel from '@material-ui/core/ExpansionPanel'
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary'
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import Grid from '@material-ui/core/Grid'
import Switch from '@material-ui/core/Switch'
import CircularProgress from '@material-ui/core/CircularProgress'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import PlayArrowIcon from '@material-ui/icons/PlayArrow'
import LoopIcon from '@material-ui/icons/Loop'
import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'

import Web3Utils from 'web3-utils'

const currencies = ['SNX', 'sBTC', 'sETH', 'sBNB', 'sTRX', 'sXRP', 'sLTC',
  'sLINK', 'sEOS', 'sBCH', 'sETC', 'sDASH', 'sXMR', 'sADA', 'sCEX', 'sDEFI',
  'sEUR', 'sJPY', 'sAUD', 'sGBP', 'sCHF', 'sXAU', 'sXAG']

function formatPrice(priceString, decimals = 2) {
  const decimalPosition = priceString.indexOf('.')
  if (decimalPosition === -1) {
    return `${priceString}.${'0'.repeat(decimals)}`
  }
  const existingDecimals = (priceString.length - decimalPosition) - 1
  if (existingDecimals === priceString.length - 1) {
    return `0${priceString.slice(0, decimals + 1)}`
  }
  if (existingDecimals < decimals) {
    return priceString + '0'.repeat(decimals - existingDecimals)
  }
  return priceString.slice(0, decimalPosition + decimals + 1)
}

function mapToStrings(item, formatter = formatPrice) {
  return { long: formatter(Web3Utils.fromWei(item.long.toString())), short: formatter(Web3Utils.fromWei(item.short.toString())) }
}

class HomeView extends Component {
  constructor(props) {
    super(props)

    this.state = {
      loadingMarketInfo: false,
      loadingAllowance: false,
      loadingClaim: false,
      loadingExercise: false,
      loadingBidRefund: false,
      address: '',
      phase: '',
      result: '',
      times: { biddingEnd: '', maturity: '', expiry: '' },
      currency: '',
      strikePrice: '',
      currentPrice: '',
      deposits: '',
      prices: { long: '', short: '' },
      bids: { long: '', short: '' },
      totalBids: { long: '', short: '' },
      claimable: { long: '', short: '' },
      balances: { long: '', short: '' },
      totalSupplies: { long: '', short: '' },
      sUSDBalance: '',
      sufficientAllowance: '',
      isRefund: false,
      isShort: false,
      bidRefundValue: '0',
      isValidRefund: true,
      computedPrices: { long: '', short: '' },
      markets: [],
    }
  }

  componentDidMount() {
    const { actions } = this.props
    actions.provider.setProvider()
  }

  onClaim = async () => {
    this.setState({ loadingClaim: true })
    try {
      const { actions } = this.props
      const { address } = this.state
      const {
        bids, claimable, balances, totalBids, totalSupplies
      } = await actions.market.claimOptions(address)

      this.setState({
        bids: mapToStrings(bids),
        totalBids: mapToStrings(totalBids),
        claimable: mapToStrings(claimable),
        balances: mapToStrings(balances),
        totalSupplies: mapToStrings(totalSupplies)
      })
    } catch (err) {
      alert(err)
      console.error(err)
    }

    this.setState({ loadingClaim: false })
  }

  onExercise = async () => {
    this.setState({ loadingExercise: true })
    try {
      const { actions } = this.props
      const { address } = this.state
      const {
        bids, claimable, balances, totalBids, totalSupplies
      } = await actions.market.exerciseOptions(address)

      this.setState({
        bids: mapToStrings(bids),
        totalBids: mapToStrings(totalBids),
        claimable: mapToStrings(claimable),
        balances: mapToStrings(balances),
        totalSupplies: mapToStrings(totalSupplies)
      })
    } catch (err) {
      alert(err)
      console.error(err)
    }

    this.setState({ loadingExercise: false })
  }

  onBidRefund = async () => {
    this.setState({ loadingBidRefund: true })
    try {
      const { actions } = this.props
      const {
        address, isShort, isRefund, bidRefundValue
      } = this.state

      const func = isRefund ? actions.market.refund : actions.market.bid
      const {
        bids, claimable, totalBids, deposits, prices, sUSDBalance, sufficientAllowance
      } = await func(address, isShort, bidRefundValue)
      const formattedPrices = mapToStrings(prices)
      this.setState({
        bids: mapToStrings(bids),
        totalBids: mapToStrings(totalBids),
        claimable: mapToStrings(claimable),
        deposits: formatPrice(deposits),
        prices: formattedPrices,
        computedPrices: formattedPrices,
        sUSDBalance: formatPrice(sUSDBalance),
        sufficientAllowance
      })
    } catch (err) {
      alert(err)
      console.error(err)
    }
    this.setState({ loadingBidRefund: false })
  }

  estimatePrices = async () => {
    try {
      const { actions } = this.props
      const {
        address, isShort, isRefund, bidRefundValue
      } = this.state
      const { long, short } = await actions.market.estimatePrices(address, isShort, isRefund, bidRefundValue)
      this.setState({
        computedPrices: mapToStrings({ long, short })
      })
    } catch (err) {
      alert(err)
      console.error(err)
    }
  }

  targetPrice = async (targetShort) => {
    const {
      address, isShort, isRefund, computedPrices
    } = this.state

    const { actions } = this.props
    const price = targetShort ? computedPrices.short : computedPrices.long
    const { value } = await actions.market.targetPrice(address, isShort, targetShort, isRefund, price)

    this.setState({
      bidRefundValue: Web3Utils.fromWei(value.toString())
    })
  }

  onSubmitAllowance = async () => {
    this.setState({ loadingAllowance: true })

    try {
      const { actions } = this.props
      const { address } = this.state
      const { sufficientAllowance } = await actions.market.approveToMax(address)

      this.setState({
        sufficientAllowance
      })
    } catch (err) {
      alert(err)
      console.error(err)
    }

    this.setState({ loadingAllowance: false })
  }

  onSubmit = async () => {
    const { actions } = this.props
    const { address } = this.state

    if (!Web3Utils.isAddress(address)) {
      alert('Invalid address')
      return
    }

    this.setState({ loadingMarketInfo: true })
    const {
      phase,
      result,
      times,
      currency,
      strikePrice,
      currentPrice,
      deposits,
      prices,
      bids,
      claimable,
      balances,
      totalBids,
      totalSupplies,
      sUSDBalance,
      sufficientAllowance
    } = await actions.market.getMarketInfo(address)

    const formattedPrices = mapToStrings(prices)

    this.setState({
      phase,
      times,
      currency,
      strikePrice: formatPrice(strikePrice),
      currentPrice: formatPrice(currentPrice),
      result,
      deposits: formatPrice(deposits),
      prices: formattedPrices,
      computedPrices: formattedPrices,
      bids: mapToStrings(bids),
      totalBids: mapToStrings(totalBids),
      claimable: mapToStrings(claimable),
      balances: mapToStrings(balances),
      totalSupplies: mapToStrings(totalSupplies),
      sUSDBalance: formatPrice(sUSDBalance),
      sufficientAllowance
    })

    this.setState({ loadingMarketInfo: false })
  }

  handleLongShortSwitch = (evt) => {
    this.setState({ isShort: evt.target.checked })

    const { isRefund } = this.state
    if (isRefund) {
      const { bidRefundValue } = this.state
      this.checkRefundValidity(bidRefundValue)
    }
  }

  handleBidRefundSwitch = (evt) => {
    const isRefund = evt.target.checked
    this.setState({ isRefund })

    if (isRefund) {
      const { bidRefundValue } = this.state
      this.checkRefundValidity(bidRefundValue)
    }
  }

  checkRefundValidity(refundValue) {
    const { isShort, bids } = this.state

    let bidValue = isShort ? bids.short : bids.long
    bidValue = bidValue === '' ? '0' : bidValue

    const refundWei = new Web3Utils.BN(Web3Utils.toWei(refundValue === '' ? '0' : refundValue))
    const bidWei = new Web3Utils.BN(Web3Utils.toWei(bidValue))

    this.setState({
      isValidRefund: refundWei.lte(bidWei)
    })
  }

  handleBidRefundValueChange = (evt) => {
    this.setState({
      bidRefundValue: evt.target.value
    })
    const { isRefund } = this.state
    if (isRefund) {
      this.checkRefundValidity(evt.target.value)
    }
  }

  handlePriceEstimateChangeLong = (evt) => {
    const { computedPrices } = this.state

    this.setState({
      computedPrices: {
        long: evt.target.value,
        short: computedPrices.short
      }
    })
  }

  handlePriceEstimateChangeShort = (evt) => {
    const { computedPrices } = this.state

    this.setState({
      computedPrices: {
        long: computedPrices.long,
        short: evt.target.value
      }
    })
  }


  handleChange = (evt) => {
    const { value } = evt.currentTarget

    this.setState({
      address: value
    })
  }

  fetchActiveMarkets = async () => {
    const { actions } = this.props
    this.setState({
      markets: await actions.market.getMarkets()
    })
  }

  fetchMaturedMarkets = async () => {
    const { actions } = this.props
    this.setState({
      markets: await actions.market.getMarkets(true)
    })
  }

  handleMarketClick = async (market) => {
    await this.setState({
      address: market.address,
      phase: market.phase,
      strikePrice: formatPrice(market.strikePrice),
      currency: market.currency,
      prices: market.prices,
      times: {
        biddingEnd: market.biddingEnd.toLocaleString(),
        maturity: market.maturity.toLocaleString(),
        expiry: market.expiry.toLocaleString()
      }
    })

    await this.onSubmit()
  }

  handleCurrencySelect = async (event) => {
    this.setState({
      currency: event.target.value
    })
  }

  handleStrikePriceChange = async (event) => {
    this.setState({
      strikePrice: event.target.value
    })
  }

  handleBiddingEndChange = async (event) => {
    const { times } = this.state
    this.setState({
      times: {
        biddingEnd: new Date(event.target.value),
        maturity: times.maturity,
        expiry: times.expiry
      }
    })
  }

  handleMaturityChange = async (event) => {
    const { times } = this.state
    this.setState({
      times: {
        biddingEnd: times.biddingEnd,
        maturity: new Date(event.target.value),
        expiry: times.expiry
      }
    })
  }

  handleLongBidChange = async (event) => {
    const { bids } = this.state
    this.setState( {
      bids: {
        long: event.target.value,
        short: bids.short
      }
    })
  }

  handleShortBidChange = async (event) => {
    const { bids } = this.state
    this.setState( {
      bids: {
        long: bids.long,
        short: event.target.value,
      }
    })
  }

  approveManager = async () => {
    const { actions } = this.props
    await actions.market.approveManagerToMax()
  }

  createMarket = async () => {
    const { currency, strikePrice, times, bids } = this.state
    const { actions } = this.props
    const newMarketAddress = await actions.market.createMarket(currency, strikePrice, times.biddingEnd, times.maturity, bids.long, bids.short)
    await this.setState( {
          address: newMarketAddress
    })
    await this.onSubmit()
  }

  render() {
    const {
      loadingMarketInfo,
      loadingAllowance,
      loadingClaim,
      loadingExercise,
      loadingBidRefund,
      address,
      times,
      phase,
      currency,
      deposits,
      strikePrice,
      currentPrice,
      result,
      prices,
      bids,
      balances,
      claimable,
      totalBids,
      totalSupplies,
      sUSDBalance,
      sufficientAllowance,
      isRefund,
      isShort,
      bidRefundValue,
      isValidRefund,
      computedPrices,
      markets,
    } = this.state

    return (
      <div className="container">
        {!window.ethereum && <Header as="h1">Metamask not detected!</Header>}

        <br />
        <br />
        <ExpansionPanel>
          <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
            Select Existing Market
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
            <Grid container spacing={16}>
              <Grid item xs={6}>
                <List>
                  { markets.map(m =>
                    (<ListItem button key={m.address} onClick={() => this.handleMarketClick(m)}>
                      <ListItemText>
                        {m.phase === 'Bidding' ? <PlayArrowIcon /> : <LoopIcon />} {m.phase}: {m.currency} &gt; ${formatPrice(m.strikePrice)} @ {m.maturity.toLocaleDateString()} - (${formatPrice(m.prices.long)} / ${formatPrice(m.prices.short)})
                      </ListItemText>
                     </ListItem>)) }
                  { markets.length === 0 && <ListItem>No markets!</ListItem> }
                </List>
              </Grid>
              <Grid item xs={3}>
                <Button variant="outlined" onClick={() => this.fetchActiveMarkets(false)}>Fetch Active Markets</Button>
              </Grid>
              <Grid item xs={3}>
                <Button variant="outlined" onClick={() => this.fetchMaturedMarkets(true)}>Fetch Matured Markets</Button>
              </Grid>
            </Grid>
          </ExpansionPanelDetails>
        </ExpansionPanel>
        <br />
        <ExpansionPanel>
          <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
            Create New Market
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
            <Grid container spacing={16}>
              <Grid item xs={6}>
                <Table>
                  <TableHead>
                    <TableCell>Variable</TableCell>
                    <TableCell>Value</TableCell>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Currency</TableCell>
                      <TableCell>
                        <Select
                          labelId="select-currency-label"
                          id="select-currency"
                          value={currency}
                          onChange={this.handleCurrencySelect}
                        >
                          {currencies.map(c => <MenuItem value={c}>{c}</MenuItem>)}
                        </Select>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Strike Price</TableCell>
                      <TableCell>
                        <TextField
                          id="strike-price"
                          label="Strike Price"
                          variant="outlined"
                          value={strikePrice}
                          onChange={this.handleStrikePriceChange}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Bidding End Date</TableCell>
                      <TableCell>
                        <TextField
                          id="datetime-local-biddingend"
                          label="Bidding End Date"
                          type="datetime-local"
                          InputLabelProps={{ shrink: true }}
                          onChange={this.handleBiddingEndChange}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Maturity Date</TableCell>
                      <TableCell>
                        <TextField
                          id="datetime-local-maturity"
                          label="Maturity Date"
                          type="datetime-local"
                          InputLabelProps={{ shrink: true }}
                          onChange={this.handleMaturityChange}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Initial Bids</TableCell>
                      <TableCell>
                        <TextField
                          id="initial-bid-long"
                          label="Long Bid"
                          variant="outlined"
                          value={bids.long}
                          onChange={this.handleLongBidChange}
                        />
                        <TextField
                          id="initial-bid-short"
                          label="Short Bid"
                          variant="outlined"
                          value={bids.short}
                          onChange={this.handleShortBidChange}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={2} align="center">
                        <Button variant="outlined" onClick={this.approveManager}>Approve Manager</Button>
                        <Button variant="outlined" onClick={this.createMarket}>Create Market</Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Grid>
            </Grid>

          </ExpansionPanelDetails>
        </ExpansionPanel>
        <br />

        <div><Header as="h2">Binary Option Market</Header> <Header as="h5">{address}</Header></div>
        <div><Header as="h3">{currency} &gt; ${strikePrice} @ {times.maturity.toLocaleString()} (L: ${formatPrice(prices.long)} / S: ${formatPrice(prices.short)})</Header></div>
        <br />
        <div>
          <Grid container spacing={32}>
            <Grid item xs={3}>
              {!loadingMarketInfo && Web3Utils.isAddress(address) && <Button variant="outlined" onClick={this.onSubmit}>Refresh Market Data</Button>}
              {loadingMarketInfo && <CircularProgress />}
            </Grid>
          </Grid>
        </div>
        <br />
        <br />
        <Grid container spacing={8}>
          <Grid item xs={6}>
            <div>Details</div>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Detail</TableCell>
                  <TableCell>Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow><TableCell>Currency</TableCell><TableCell>{currency}</TableCell></TableRow>
                <TableRow><TableCell>Strike Price</TableCell><TableCell>${strikePrice}</TableCell></TableRow>
                <TableRow><TableCell>Phase</TableCell><TableCell>{phase}</TableCell></TableRow>
                <TableRow><TableCell>Bidding End</TableCell><TableCell>{times.biddingEnd.toLocaleString()}</TableCell></TableRow>
                <TableRow><TableCell>Maturity</TableCell><TableCell>{times.maturity.toLocaleString()}</TableCell></TableRow>
                <TableRow><TableCell>Expiry</TableCell><TableCell>{times.expiry.toLocaleString()}</TableCell></TableRow>
              </TableBody>
            </Table>
          </Grid>
          <Grid item xs={6}>
            <div>Market Overview</div>
            <Table aria-label="market data">
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>Long</TableCell>
                  <TableCell>Short</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Option Prices</TableCell>
                  <TableCell>${prices.long}</TableCell>
                  <TableCell>${prices.short}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Total Outstanding Bids</TableCell>
                  <TableCell>${totalBids.long}</TableCell>
                  <TableCell>${totalBids.short}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Total Outstanding Options</TableCell>
                  <TableCell>{totalSupplies.long}</TableCell>
                  <TableCell>{totalSupplies.short}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Deposited sUSD</TableCell>
                  <TableCell colSpan={2}>${deposits}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Current {currency} Price</TableCell>
                  <TableCell colSpan={2}>${currentPrice}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Current Result</TableCell>
                  <TableCell colSpan={2}>{result}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Grid>

        </Grid>
        <br />
        <br />
        <Grid container spacing={8}>
          <Grid item xs={6}>
            <div>Your Position</div>
            <Table aria-label="market data">
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>Long</TableCell>
                  <TableCell>Short</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Bids</TableCell>
                  <TableCell>${bids.long}</TableCell>
                  <TableCell>${bids.short}</TableCell>
                </TableRow>
                <TableRow>
                  {phase === 'Bidding' && <TableCell>Current Claim</TableCell>}
                  {phase !== 'Bidding' && <TableCell>Claimable</TableCell>}
                  <TableCell>{claimable.long}</TableCell>
                  <TableCell>{claimable.short}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Options</TableCell>
                  <TableCell>{balances.long}</TableCell>
                  <TableCell>{balances.short}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell />
                  {!loadingClaim && <TableCell><Button variant="outlined" onClick={() => this.onClaim(address)}>Claim</Button></TableCell>}
                  {loadingClaim && <TableCell><CircularProgress /></TableCell>}
                  {!loadingExercise && <TableCell><Button variant="outlined" onClick={() => this.onExercise(address)}>Exercise</Button></TableCell>}
                  {loadingExercise && <TableCell><CircularProgress /></TableCell>}
                </TableRow>
              </TableBody>
            </Table>
          </Grid>
          <Grid item xs={6}>
            <div>Available Funds</div>
            <Table aria-label="market data">
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell />
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>sUSD Balance</TableCell>
                  <TableCell colSpan={2}>${sUSDBalance}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>sUSD Allowance?</TableCell>
                  <TableCell>{sufficientAllowance}</TableCell>
                  <TableCell>
                    {!loadingAllowance && (sufficientAllowance === 'No') && <Button variant="outlined" onClick={() => this.onSubmitAllowance(address)}>Approve</Button>}
                    {!loadingAllowance && (sufficientAllowance !== 'No') && <Button variant="outlined" disabled>Approve</Button>}
                    {loadingAllowance && <CircularProgress />}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Grid>
        </Grid>
        <br />
        <br />
        <br />
        <br />
        <Grid container spacing={8}>
          <Grid item xs={12} align="left">
            <div>Place Bid / Refund</div>
            <Table>
              <TableHead>
                <TableRow><TableCell colSpan={2}>Parameters</TableCell><TableCell colSpan={4}>Price Effect</TableCell></TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={2}>
                    {!(isRefund && !isValidRefund) && <TextField id="bid-value" label="Value" variant="outlined" value={bidRefundValue} onChange={this.handleBidRefundValueChange} />}
                    {isRefund && !isValidRefund && <TextField id="bid-value" label="Value" variant="outlined" value={bidRefundValue} onChange={this.handleBidRefundValueChange} error />}
                  </TableCell>
                  <TableCell colSpan={2}><TextField id="long-price" label="Long Price" variant="outlined" value={computedPrices.long} onChange={this.handlePriceEstimateChangeLong} /></TableCell>
                  <TableCell colSpan={2}><TextField id="short-price" label="Short Price" variant="outlined" value={computedPrices.short} onChange={this.handlePriceEstimateChangeShort} /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div>
                      Bid / Refund
                      <Switch checked={isRefund} onChange={this.handleBidRefundSwitch} name="switch-bid-refund" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      Long / Short
                      <Switch checked={isShort} onChange={this.handleLongShortSwitch} name="switch-long-short" />
                    </div>
                  </TableCell>
                  <TableCell colspan={2}>
                    <Button variant="outlined" onClick={() => this.targetPrice(false)}>Target Long Price</Button>
                  </TableCell>
                  <TableCell colSpan={2}>
                    <Button variant="outlined" onClick={() => this.targetPrice(true)}>Target Short Price</Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Summary: {isRefund ? 'Refund' : 'Bid'} ({isShort ? 'Short' : 'Long'}): ${bidRefundValue}</TableCell>
                  <TableCell>
                    {!(isRefund && !isValidRefund) && <Button variant="outlined" onClick={this.estimatePrices}>Estimate Prices</Button>}
                    {isRefund && !isValidRefund && <Button variant="outlined" disabled>Refund Too Large</Button>}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={2}>
                    {!(isRefund && !isValidRefund) && !loadingBidRefund && <Button variant="outlined" onClick={this.onBidRefund}>Place Order</Button>}
                    {isRefund && !isValidRefund && !loadingBidRefund && <Button variant="outlined" disabled>Refund Too Large</Button>}
                    {loadingBidRefund && <CircularProgress />}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Grid>
        </Grid>
        <br />
        <br />
        <br />
        <br />
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    loadingMarketInfo: state.loadingMarketInfo,
    loadingAllowance: state.loadingAllowance,
    loadingClaim: state.loadingClaim,
    loadingExercise: state.loadingExercise,
    loadingBidRefund: state.loadingBidRefund,
    address: state.address,
    currency: state.currency,
    strikePrice: state.strikePrice,
    currentPrice: state.currentPrice,
    result: state.result,
    deposits: state.deposits,
    phase: state.phase,
    times: state.times,
    prices: state.prices,
    bids: state.bids,
    totalBids: state.totalBids,
    claimable: state.claimable,
    balances: state.balances,
    totalSupplies: state.totalSupplies,
    sUSDBalance: state.sUSDBalance,
    sufficientAllowance: state.sufficientAllowance,
    isRefund: state.isRefund,
    isShort: state.isShort,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    actions: {
      market: bindActionCreators(marketActionCreators, dispatch),
      provider: bindActionCreators(providerActionCreators, dispatch)
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(HomeView)
