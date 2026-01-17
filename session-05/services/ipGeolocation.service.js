const axios = require('axios');

const getIpGeolocation = async (ipAddress) => {
    try {
        const response = await axios.get(`https://api.ipgeolocation.io/v2/ipgeo`, {
            params: {
                ip: ipAddress,
                apiKey: process.env.GEO_LOCATION_API_KEY
            },
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
        })

        return response.data;
    } catch (error) {
        console.log(`An error occured while get geoLocation information: ${error}`);
        return null;
    }
}

module.exports = { getIpGeolocation }