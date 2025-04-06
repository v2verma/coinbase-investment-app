const WebSocket = require('ws');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const wss = new WebSocket.Server({ server: http });

const coinbaseProURL = 'wss://ws-feed.exchange.coinbase.com';
let wsCoinbasePro = null;

// Store user subscriptions
const userSubscriptions = {};

// Function to send a subscribe/unsubscribe message to the Coinbase WebSocket
const sendMessage = (message) => {
  if (wsCoinbasePro && wsCoinbasePro.readyState === WebSocket.OPEN) {
    wsCoinbasePro.send(JSON.stringify(message));
  }
};

// WebSocket message handler for client-server communication
wss.on('connection', (wsClient) => {
  console.log('User connected');
  
  // Client communication handler
  wsClient.on('message', (message) => {
    const { action, product } = JSON.parse(message);
    console.log("SERVER", action, product, userSubscriptions[wsClient])
    if (action === 'subscribe') {
      if (!userSubscriptions[wsClient]) {
        userSubscriptions[wsClient] = [];
      }
      if (!userSubscriptions[wsClient]?.includes(product)) {
        userSubscriptions[wsClient].push(product);
        sendMessage({
          type: 'subscribe',
          channels: [
              { name: 'matches', product_ids: [product] },
              { name: 'ticker', product_ids: [product] },
            { name: 'level2', product_ids: [product] },
            { name: 'auctionfeed', product_ids: [product] },
          ]
        });
      }
    } else if (action === 'unsubscribe') {
      if (userSubscriptions[wsClient]) {
        userSubscriptions[wsClient] = userSubscriptions[wsClient].filter(p => p !== product);
        sendMessage({
          type: 'unsubscribe',
          channels: [
            { name: 'level2', product_ids: [product] },
            { name: 'ticker', product_ids: [product] },
            { name: 'matches', product_ids: [product] },
            { name: 'auctionfeed', product_ids: [product] },
          ]
        });
      }
    }
  });

  // WebSocket close handler
  wsClient.on('close', () => {
    console.log('User disconnected');
    // Remove subscriptions on disconnect
    delete userSubscriptions[wsClient];
  });
});

// Coinbase Pro WebSocket Feed Connection
wsCoinbasePro = new WebSocket(coinbaseProURL);

wsCoinbasePro.on('open', () => {
  console.log('Connected to Coinbase WebSocket feed');
});

wsCoinbasePro.on('message', (data) => {
  // Process incoming messages from Coinbase Pro
  const message = JSON.parse(data);
  
  // Broadcast the updates to the subscribed clients
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      const userSubscribedProducts = userSubscriptions[client] || [];
      if (userSubscribedProducts.includes(message.product_id)) {
        client.send(JSON.stringify(message));
      }
    }
  });
});

wsCoinbasePro.on('close', () => {
  console.log('Disconnected from Coinbase WebSocket feed');
});

// Start the server
http.listen(5000, () => {
  console.log('Server is running on http://localhost:5000');
});
