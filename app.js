    'use strict';

    const Hapi=require('hapi');
    const StarValidation = require('./star');
    const Blockchain = require('./simpleChain');
    const bitcoin = require('bitcoinjs-lib');
    const bitcoinMessage = require('bitcoinjs-message')
    let blockchain = new Blockchain();
    let starValidation = new StarValidation();


    // Create a server with a host and port
    const server = Hapi.server({
        host:'localhost',
        port:8000
    });

    // Add the route
    server.route({
        method:'GET',
        path:'/hello',
        handler: async function(request,reply) {

            return'hello world';
        }
    });

    // Requirement 3: validate user request
    server.route({
        method: 'POST',
        path: '/requestValidation',

        handler: async function (request, reply) {
            const address = request.payload.address;
            try {
                const data = await starValidation.awaitRequest(address);
                return(data)
            } 
            catch (error) {

                if (!request.payload.address) {
                    const body = { 
                        message: "You have not filled in your address. Please make sure to fill in your address", 
                    }
                    return(body.message)
                }
                else{
                    const  data = await starValidation.registerRequest(address);
                    return(data);
                }
            }
        }});


    // Requirement 4: Allow User Message Signature
    server.route({
        method: 'POST',
        path: '/message-signature/validate',         
        handler: async function(request, reply) {
            try {
                const { address, signature } = request.payload;
                const validaterequest = await starValidation.validateRequest(address, signature);

                if (!request.payload.signature) {
                    const body = { 
                       message: "You have not filled in your signature", 
                   }
                   return(body.message)
               }          


                if (validaterequest.registerStar) {

                  return(validaterequest);
              } else {

                  return(validaterequest);
              }
          } catch (err) {
             if (!request.payload.address) {
                const body = { 
                   message: "You have not filled in your address.", 
               }
               return(body.message)
               }
            throw err;
        }
    }})

    //Step 2: Configure Star Registration Endpoint
    server.route({
        method: 'POST',
        path: '/block',         
        handler: async function(request, reply) {
            const address = request.payload;
            const signature = request.payload
            const MaxStorySize = 500;
            const { star } = request.payload;
            const { dec, ra, story} = star; 
            const ascii = ((str) => /^[\x00-\x7F]*$/.test(str))
            try {

                if (address.messageSignature ==! 'valid') {
                    const body = { 
                        message: "Your signature is not valid", 
                    }
                    return(body.message)
                }

                if (!request.payload.address || !request.payload.star) {
                    const body = { 
                        message: "Please fill in address and star coordinates correctly.", 
                    }
                    return(body.message)
                }

                const body = { address, star }
                const story = star.story;

                body.address = address.address;
                body.star = {
                    dec: star.dec,
                    ra: star.ra,
                    story: new Buffer(story).toString('hex')
                }


                if (new Buffer(story).length > MaxStorySize) {
                    const body = { 
                        message: "Your story is too long. Please you have a limit of 250 words.", 
                    }
                    return(body.message)
                }

                if (!ascii(story)) {
                    const body = { 
                        message: "Your story is not in ascii, please use only ascii text. ", 
                    }
                    return(body.message)
                }

                if (!star.dec || !star.ra || !star.story){
                    const body = { 
                        message: "Please, you have not filled the star coordinates correctly. ", 
                    }
                    return(body.message)
                }


                const addblock = await blockchain.addBlock(body);
                const height = await blockchain.getBlockHeight();
                const blockHeight = await blockchain.getBlock(height);
                await starValidation.delAddress(address);
                return (blockHeight);
            } 
            catch (err) {
                throw err
            }

        }})

    server.route({
        method: 'GET',
        path: '/stars/address:{address}',
        handler: async function (request, reply) {
            try {
                const blockAdress = await blockchain.getBlockAddress(request.params.address);
                return (blockAdress);
            } catch (err) {
             throw err;

         }
     }});


    server.route({
        method: 'GET',
        path: '/stars/hash:{hash}',
        handler: async function(request, reply) {
            try {
                const blockHash = await blockchain.getBlockHash(request.params.hash);
                return (blockHash);
            } catch (err) {
             throw err;
         }
     }});


    server.route({
        method: 'GET',
        path: '/block/{height}',
        handler: async function(request, reply) {
            try {
                const blockHeight = await blockchain.getHeight(request.params.height);
                return (blockHeight);
            // reply(blockHeight);
        } 
        catch (err) {
            console.log(err);
        }
    }});


    // Start the server
    async function start() {

        try {
            await server.start();
        }
        catch (err) {
            console.log(err);
            process.exit(1);
        }

        console.log('Server running at:', server.info.uri);
    };

    start();