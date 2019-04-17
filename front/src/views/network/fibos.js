var url = require('url');
var _endpoints = {};

_endpoints['fotestnet'] = [
    { 
        "location": {
         "country": "US", 
        }, 
        "is_producer": true, 
        "p2p_endpoint": "", 
        "ssl_endpoint": "https://testnet.fibos.fo", 
        "producer": "fibos" 
    }
];


const networkList = [];

networkList.push({
    name: 'TestNet',
    key: 'fotestnet',
    chainId: '68cee14f598d88d340b50940b6ddfba28c444b46cd5f33201ace82c78896793a',
    explorer: ''
});


export default {
    getEndpoints(type) {
        if(!_endpoints[type]) return [];
        var currentPoints =  _endpoints[type];
        currentPoints.forEach((point) => {
            var ps = url.parse(point.ssl_endpoint);
            point.host = ps.host;
            point.post = ps.port;
        })
        return _endpoints[type];
    },
    getNetWorkList(){
        return networkList;
    }
}