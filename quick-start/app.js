
/**
 * Copyright 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Messenger Platform Quick Start Tutorial
 *
 * This is the completed code for the Messenger Platform quick start tutorial
 *
 * https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start/
 *
 * To run this code, you must do the following:
 *
 * 1. Deploy this code to a server running Node.js
 * 2. Run `npm install`
 * 3. Update the VERIFY_TOKEN
 * 4. Add your PAGE_ACCESS_TOKEN to your environment vars
 *
 */

'use strict'
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN
// Imports dependencies and set up http server
const request = require('request')
const express = require('express')
const bodyParser = require('body-parser')
const app = express().use(bodyParser.json()) // creates express http server

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'))

// Accepts POST requests at /webhook endpoint
app.post('/webhook', (req, res) => {
  // Parse the request body from the POST
  const { body } = req

  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {
    body.entry.forEach(entry => {
      // Gets the body of the webhook event
      const webhookEvent = entry.messaging[0]

      // Get the sender PSID
      const senderPsid = webhookEvent.sender.id
      console.log('Sender ID: ' + senderPsid)

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhookEvent.message) {
        handleMessage(senderPsid, webhookEvent.message)
      } else if (webhookEvent.postback) {
        handlePostback(senderPsid, webhookEvent.postback)
      }
    })

    // Return a '200 OK' response to all events
    res.status(200).send('EVENT_RECEIVED')
  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404)
  }
})

// Accepts GET requests at the /webhook endpoint
app.get('/webhook', (req, res) => {
  /** UPDATE YOUR VERIFY TOKEN **/
  const VERIFY_TOKEN = '<YOUR VERIFY TOKEN>'

  // Parse params from the webhook verification request
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      // Respond with 200 OK and challenge token from the request
      console.log('WEBHOOK_VERIFIED')
      res.status(200).send(challenge)
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403)
    }
  }
})

/**
 * Handle message events
 */
const handleMessage = (senderPsid, receivedMessage) => {
  let response

  // Checks if the message contains text
  if (receivedMessage.text) {
    // Create the payload for a basic text message, which
    // will be added to the body of our request to the Send API
    response = {
      'text': `You sent the message: "${receivedMessage.text}". Now send me an attachment!`
    }
  } else if (receivedMessage.attachments) {
    // Get the URL of the message attachment
    let attachmentUrl = receivedMessage.attachments[0].payload.url
    response = {
      'attachment': {
        'type': 'template',
        'payload': {
          'template_type': 'generic',
          'elements': [{
            'title': 'Is this the right picture?',
            'subtitle': 'Tap a button to answer.',
            'image_url': attachmentUrl,
            'buttons': [
              {
                'type': 'postback',
                'title': 'Yes!',
                'payload': 'yes'
              },
              {
                'type': 'postback',
                'title': 'No!',
                'payload': 'no'
              }
            ]
          }]
        }
      }
    }
  }

  // Send the response message
  callSendAPI(senderPsid, response)
}

const handlePostback = (senderPsid, receivedPostback) => {
  let response
  // Get the payload for the postback
  let payload = receivedPostback.payload

  // Set the response based on the postback payload
  if (payload === 'yes') {
    response = { 'text': 'Thanks!' }
  } else if (payload === 'no') {
    response = { 'text': 'Oops, try sending another image.' }
  }
  // Send the message to acknowledge the postback
  callSendAPI(senderPsid, response)
}

function callSendAPI (senderPsid, response) {
  // Construct the message body
  let requestBody = {
    'recipient': {
      'id': senderPsid
    },
    'message': response
  }

  // Send the HTTP request to the Messenger Platform
  request({
    'uri': 'https://graph.facebook.com/v2.6/me/messages',
    'qs': { 'access_token': PAGE_ACCESS_TOKEN },
    'method': 'POST',
    'json': requestBody
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error('Unable to send message:' + err)
    }
  })
}
