var _ = require('lodash');
var React = require("react");

var ModalTrigger = require('react-bootstrap/lib/ModalTrigger');
var ConfirmModal = require('./ConfirmModal');

var Table = require("react-bootstrap/lib/Table");
var Button = require("react-bootstrap/lib/Button");
var Glyphicon = require("react-bootstrap/lib/Glyphicon");

var utils = require("../js/utils");

var TradeRow = React.createClass({

    getInitialState: function() {
        return {
            payload: {}
        };
    },

    render: function() {
        var isOwn = (this.props.trade.owner == this.props.user.id);
        return (
            <tr className={"trade-" + (!this.props.review ? this.props.trade.status : "review") + ((isOwn && !this.props.user.own) ? " disabled" : "")} onMouseEnter={this.handleHover} onMouseLeave={this.handleHoverOut} onClick={this.handleClick}>
                <td>
                    <div className="text-right">
                        {utils.numeral(this.props.trade.amount, this.props.market.decimals)}
                    </div>
                </td>
                <td>
                    <div className="text-center">
                        {this.props.trade.market.name}
                    </div>
                </td>
                <td>
                    <div className="text-right">
                        {utils.numeral(this.props.trade.price, this.props.precision)}
                    </div>
                </td>
                <td>
                    <div className="text-right">
                        {utils.numeral(this.props.trade.total, 4)} ETH
                    </div>
                </td>
                <td>
                    <div className="center-block ellipsis">
                        {this.props.trade.owner}
                    </div>
                </td>
                {!this.props.review &&
                <td className="trade-op">
                    <div className="pull-right">{
                    (this.props.trade.owner == this.props.user.id) ?
                        <ModalTrigger modal={
                                <ConfirmModal
                                    type="cancel"
                                    message="Are you sure you want to cancel this trade?"
                                    trade={this.props.trade}
                                    onSubmit={this.handleCancelTrade}
                                />
                            }>
                            <Button className="btn-xs" key="cancel"><Glyphicon glyph="remove" /></Button>
                        </ModalTrigger> :

                        <ModalTrigger modal={
                                <ConfirmModal
                                    type="fill"
                                    message={
                                        "Are you sure you want to " + (this.props.trade.type == "buys" ? "sell" : "buy") +
                                        " " + this.props.trade.amount + " " + this.props.trade.market.name +
                                        " at " + this.props.trade.price + " " + this.props.trade.market.name + "/ETH" +
                                        " for " + (this.props.trade.amount * this.props.trade.price) + " ETH"
                                    }
                                    onSubmit={this.handleFillTrade}
                                />
                            }>
                            <Button className="btn-xs" key="fill"><Glyphicon glyph="screenshot" /></Button>
                        </ModalTrigger>
                    }</div>
                </td>}
            </tr>
        );
    },

    handleFillTrade: function(e) {
        e.preventDefault();
        this.props.flux.actions.trade.fillTrade(this.props.trade);
    },

    handleCancelTrade: function(e) {
        e.preventDefault();
        this.props.flux.actions.trade.cancelTrade(this.props.trade);
    },

    handleHover: function(e) {
        e.preventDefault();
        if (this.props.review)
            return;

        if (!this.props.trade.price || !this.props.trade.amount || !this.props.trade.total)
            return;

        // Select previous trades
        var trades = _.filter(this.props.tradeList, function(trade, i) {
            return (
                this.props.user.id != trade.owner &&
                trade.status != "filling" &&
                trade.status != "pending" &&
                trade.status != "new" &&
                // ((trade.type == "buys" && this.props.trade.price <= trade.price) ||
                //  (trade.type == "sells" && this.props.trade.price >= trade.price)) &&
                i <= this.props.count
            );
        }.bind(this));

        if (!trades.length)
            return;

        var totalAmount = 0;
        var totalValue = 0;

        totalAmount = _.reduce(_.pluck(trades, 'amount'), function(sum, num) {
            return parseFloat(sum) + parseFloat(num);
        });
        if (!totalAmount)
            return;

        totalValue = _.reduce(_.pluck(trades, 'total'), function(sum, num) {
            return parseFloat(sum) + parseFloat(num);
        });
        if (!totalValue)
            return;

        _.forEach(this.props.tradeList, function(trade) {
            // if (trade.status == "filling" && _.find(trades, {'id': trade.id}))
            //     trade.status = "mined";
            if (trade.status == "mined" && _.find(trades, {'id': trade.id}))
                trade.status = "filling";
        });

        this.setState({
            payload: {
                type: (this.props.trade.type == "buys" ? 1 : 2),
                fills: trades.length,
                price: this.props.trade.price,
                amount: totalAmount,
                total: totalValue,
                market: this.props.trade.market,
                user: this.props.user
            }
        });
    },

    handleHoverOut: function(e) {
        e.preventDefault();
        if (!this.props.trades)
            return;

        this.props.flux.actions.trade.highlightFilling({
            type: (this.props.trade.type == "buys" ? 2 : 1),
            price: this.props.trades.price,
            amount: this.props.trades.amount,
            total: this.props.trades.total,
            market: this.props.market,
            user: this.props.user
        });
    },

    handleClick: function(e) {
        e.preventDefault();
        if (this.state.payload)
            this.props.flux.actions.trade.clickFill(this.state.payload);
    }
});

var TradeTable = React.createClass({
    getInitialState: function() {
        return {
            tradeRows: null
        };
    },

    componentDidMount: function() {
        this.componentWillReceiveProps(this.props);
    },

    componentWillReceiveProps: function(nextProps) {
        var index = _.findIndex(nextProps.market.markets, {'id': nextProps.market.market.id});
        var market = nextProps.market.markets[index];
        var precision = 0;
        if (market)
            precision = String(market.precision).length - 1;

        var tradeRows = <tr></tr>;
        if (nextProps.tradeList)
            tradeRows = nextProps.tradeList.map(function (trade, i) {
            return (
                <TradeRow flux={this.props.flux} key={trade.id} count={i} user={this.props.user} trade={trade} trades={this.props.trades} tradeList={this.props.tradeList} market={market} precision={precision} review={this.props.review} />
            );
          }.bind(this));

        this.setState({
          tradeRows: tradeRows
        });
    },

    render: function() {
        return (
            <div>
                <h4>{this.props.title}</h4>
                <Table condensed hover responsive striped>
                    <thead>
                        <tr>
                            <th className="text-right">Amount</th>
                            <th className="text-center">Market</th>
                            <th className="text-right">Price</th>
                            <th className="text-right">Total</th>
                            <th className="text-center">By</th>
                            {!this.props.review &&
                            <th className="text-center trade-op"></th>}
                        </tr>
                    </thead>
                    <tbody>
                        {this.state.tradeRows}
                    </tbody>
                </Table>
            </div>
        );
    }
});

module.exports = TradeTable;