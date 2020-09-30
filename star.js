const bitcoin = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message')
const db = require('level')('./data');


class StarValidation {
  constructor (request) {
    this.request = request
    this.body = request
  }

  validateRequest(address, signature) {
    return new Promise(function(resolve, reject){
      db.get(address, function(err, value){
        if (err) {
        	reject(err);
          	return console.log('Could not validate request');
        } 
        value = JSON.parse(value)

        if (value.messageSignature === 'valid') {
          return resolve({
            registerStar: true,
            status: value
        }) 
        } else {
          const reducedTime = Date.now() - (4 * 60 * 1000)
          const expired = value.requestuestTimeStamp < reducedTime
          let isValid = false
  
          if (expired) {
              value.validationWindow = 0
              value.messageSignature = 'Validation window has expired already'
          } else {
              value.validationWindow = Math.floor((value.requestuestTimeStamp - reducedTime) / 1000) 
              try {
                isValid = bitcoinMessage.verify(value.message, address, signature)
              } catch (err) {
                isValid = false
              }
              value.messageSignature = isValid ? 'valid' : 'invalid'
          }
          db.put(address, JSON.stringify(value))
  
          return resolve({
              registerStar: !expired && isValid,
              status: value
          }) 
        }
      })
    })
  }

    
  delAddress(address) {
    db.del(address)
  }

  registerRequest (address) {
    const timestamp = Date.now()
    const message = `${address}:${timestamp}:starRegistry`
    const validationWindow = 300
  
    const data = {
      address: address,
      message: message,
      requestuestTimeStamp: timestamp,
      validationWindow: validationWindow
    }
    db.put(data.address, JSON.stringify(data))

    return data
  }

  awaitRequest(address) {
    return new Promise(function(resolve, reject){
      db.get(address, function(err, value){
        if (err) {
        	reject(err)
          return console.log('Request not found')
        } 
        value = JSON.parse(value)

        const reducedTime = Date.now() - (4 * 60 * 1000)
        const expired = value.requestuestTimeStamp < reducedTime

        if (expired) {
            resolve(this.registerRequest(address))
        } else {
          const data = {
            address: address,
            message: value.message,
            requestuestTimeStamp: value.requestuestTimeStamp,
            validationWindow: Math.floor((value.requestuestTimeStamp - reducedTime) / 1000)
          }

          resolve(data)
        }
      })
    })
  }
}
  
module.exports = StarValidation
