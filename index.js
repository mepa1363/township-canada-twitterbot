var Twit = require('twit')
var axios = require('axios')

var T = new Twit({
    consumer_key: '4ZuGwKlVEktaHGNP3dXF3gMeX',
    consumer_secret: 'SQGsU9AtBNctsbWmIznUWa6HTGx77qtrn8jmkJH57LwU2l1h8e',
    access_token: '931631276297031680-mt8tGxhs5or9oDOSaK3ZThxhByJI0Nd',
    access_token_secret: 'Nwhap5zNgdbMPxiUI6xfoVANqa5MpOkfleUMQOiqgnelP'
})

var stream = T.stream('statuses/filter', {
    track: ['townshipcanada, #townshipcanada']
})

stream.on('tweet', function(tweet) {
    // regex: https://regex101.com/
    // regex for twp-rge-mer -> ^[1-9]{1}[0-9]{0,2}-[1-9]{1}[0-9]{0,1}-(w|W)[4-5]$

    var dls = tweet.text.replace('@', '').replace('#', '').replace('townshipcanada', '').replace(/\s/g, '').toUpperCase()

    var wfsParams = {
        service: 'WFS',
        version: '2.0.0',
        request: 'GetFeature',
        typeName: '	townshipcanada:bot_lookup',
        outputFormat: 'application/json',
        srsname: 'EPSG:4326',
        viewparams: 'query:' + dls
    }

    axios.get('https://townshipcanada.com/geoserver/ows', {
            params: wfsParams
        })
        .then(function(response) {
            var reply = " Sorry, that didn't work. Please try again.\nTip: use this template @townshipcanada 2-16-23-W4"
            var url = ""
            if (response.data !== undefined && response.data.features.length > 0) {
                var coordinates = response.data.features[0].geometry.coordinates
                var longitude = coordinates[1]
                var latitude = coordinates[0]
                reply = ' 📍 ' + longitude + ', ' + latitude
                url = 'https://townshipcanada.com/#10/' + longitude + '/' + latitude
            }

            T.post('statuses/update', {
                status: '@' + tweet.user.screen_name + reply + ' ' + url,
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
})
