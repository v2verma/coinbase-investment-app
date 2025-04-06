import React, { useState, useEffect } from 'react';

type PriceUpdate = {
  product_id: string;
  bids: string;
  asks: string;
};

type MatchUpdate = {
  time: string;
  product_id: string;
  size: string;
  price: string;
  side: 'buy' | 'sell';
};

const App: React.FC = () => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const [prices, setPrices] = useState<Record<string, PriceUpdate>>({});
  const [matches, setMatches] = useState<MatchUpdate[]>([]);

  const productList = ['BTC-USD', 'ETH-USD', 'XRP-USD', 'LTC-USD'];

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:5000');
    setWs(socket);

    socket.onmessage = (e) => {
      const message = JSON.parse(e.data);
      if (message.type === 'level2') {
        const priceUpdate: PriceUpdate = message;
        setPrices((prevPrices) => ({
          ...prevPrices,
          [priceUpdate.product_id]: priceUpdate,
        }));
      } else if (message.type === 'match') {
        const matchUpdate: MatchUpdate = message;
        setMatches((prevMatches) => [matchUpdate, ...prevMatches].slice(0, 10));
      }
    };

    return () => socket.close();
  }, []);

  const handleSubscription = (e: any, product: string) => {
    if (ws && e?.target?.id === 'Sub') {
      ws.send(JSON.stringify({ action: 'subscribe', product }));
      setSubscriptions([...subscriptions, product]);
    }
    if(ws && e?.target?.id === 'Unsub'){
      ws.send(JSON.stringify({ action: 'unsubscribe', product }));
      setSubscriptions(subscriptions.filter((p) => p !== product));
    }
  };

  const isSubscribed = (product: string) => {
    return subscriptions.includes(product) ? true : false
  }

  return (
    <>
      <nav className="navbar navbar-dark bg-primary pl-2">
        <a className="navbar-brand" href="#" style={{paddingLeft: '1%'}}>
        <img src="./public/vite.svg" width="30" height="30" className="d-inline-block align-top" alt="logo" />Coinbase Investmant</a>
      </nav>
    <div className='container'>
      <div className='row mt-3'>
        <h3>Subscribe/Unsubscribe</h3>
        {productList.map((product) => (
          <div key={product} className='col-md-3' >
            <button id={isSubscribed(product) ? 'Unsub': 'Sub'} className={isSubscribed(product) ? 'btn btn-success' : 'btn btn-secondary'}
              onClick={(e) => handleSubscription(e, product)}>
              {isSubscribed(product) ? 'Subscribed' : 'Unsubscribed'} to {product}
            </button>
          </div>
        ))}
      </div>
      <div className='col-md-12 mt-5'>
        <h3>System Status</h3>
        {subscriptions?.length ? <p className="text text-success text-strong"><b>{subscriptions.join(', ')}</b></p>
        : 
        <i>No Subscription Found, Please sunscribe to a product</i>}
      </div>

      <div className='row mt-5'>
        <div className='col-md-6'>
          <h3>Price View</h3>
          <table className="table table-striped table-dark">
            <thead>
              <tr>
                <th>Product</th>
                <th>Bids</th>
                <th>Asks</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(prices).map((product, index) => {
                return (<tr key={index}>
                  <td>{product[1]?.product_id}</td>
                  <td>{product[1]?.bids}</td>
                  <td>{product[1]?.asks}</td>
                </tr>)
              })}
            </tbody>
          </table>
        </div>
        <div className='col-md-6'>
          <h3>Match View</h3>
          <table className="table table-striped table-dark">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Product</th>
                <th>Trade Size</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match, index) => {
                const textColor = { color: match.side === 'buy' ? 'green' : 'red' }
                return (<tr key={index}>
                  <td style={textColor}>{match.time}</td>
                  <td style={textColor}>{match.product_id}</td>
                  <td style={textColor}>{match.size}</td>
                  <td style={textColor}>{match.price}</td>
                </tr>)
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </>
  );
};

export default App;
