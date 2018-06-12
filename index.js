require('dotenv').config()
var Twit = require('twit')
var axios = require('axios')

var T = new Twit({
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token: process.env.ACCESS_TOKEN,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET
})

var stream = T.stream('statuses/filter', {
    track: ['townshipcanada, #townshipcanada']
})

stream.on('tweet', function(tweet) {
    var coordinatesRegex = /[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?),\s*[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)/g
    var legalLocationDlsRegex = /((nw|ne|sw|se)|([1-9]|[1][0-6]))[-]([1-9]|[1-2][0-9]|[1-3][0-6])[-]([1-9]|[1-9][0-9]|[1][0-2][0-7])[-]([1-9]|[0-2][0-9]|[3][0])[-]((W|w)[1-6])/ig
    var legalLocationNtsRegex = /[abcd][-]([1-9]|[1-9][0-9]|(100))[-][abcdrfghijkl][/]([8][2-9]|[9][0-9]|[1][0][0-9]|[1][1][0-4])[-][abcdefghijklmnop][-]([1-9]|[1][0-6])/ig

    var dls = tweet.text.match(legalLocationDlsRegex) || tweet.text.match(legalLocationNtsRegex)
    var coordinates = tweet.text.match(coordinatesRegex)
    if (dls !== null && dls.length > 0) {
        axios.get(`https://beta.townshipcanada.com/api/bot/search/legal_location?q=${dls}`)
            .then(function(response) {
                var reply = ` Sorry, that didn't work. Please try again.`
                if (response.data.length > 0) {
                    var coordinates = response.data[0].centroid.coordinates
                    reply = ` 📍 ${coordinates[0]}, ${coordinates[1]}`
                }

                T.post('statuses/update', {
                    status: '@' + tweet.user.screen_name + reply,
                    in_reply_to_status_id: tweet.id_str
                }, function(err, data, response) {
                    if (err) {
                        // console.log(err);
                    } else {
                        // console.log('worked!')
                    }
                })
            })
            .catch(function(error) {
                // console.log(error)
            })
    } else if (coordinates !== null && coordinates.length > 0) {
        coords = coordinates[0].split(',')
        axios.get(`https://beta.townshipcanada.com/api/bot/search/coordinates?q=${coords[0]},${coords[1]}`)
            .then(function(response) {
                var reply = ` Sorry, that didn't work. Please try again.`
                if (response.data.length > 0) {
                    var legal_location = response.data[0].legal_location
                    var address = response.data[0].address
                    reply = ` 📍 ${legal_location} \n`
                    if (address !== null) {
                        reply += `🏠 ${address}`
                    }
                }

                T.post('statuses/update', {
                    status: '@' + tweet.user.screen_name + reply,
                    in_reply_to_status_id: tweet.id_str
                }, function(err, data, response) {
                    if (err) {
                        // console.log(err);
                    } else {
                        // console.log('worked!')
                    }
                })
            })
            .catch(function(error) {
                // console.log(error)
            })
    }
})
