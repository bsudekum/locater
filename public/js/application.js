$(function() {

    var userId = Math.random().toString(16).substring(2, 15);
    var icons = ['rocket', 'heliport', 'rail-light', 'bus', 'airfield', 'ferry', 'bicycle', 'park2', 'lodging', 'zoo', 'garden', 'pitch', 'soccer', 'america-football', 'tennis', 'basketball', 'baseball', 'swimming', 'skiing', 'school', 'library', 'post', 'fire-station', 'embassy'];
    var colors = ['#f1f075', '#eaf7ca', '#c5e96f', '#a3e46b', '#7ec9b1', '#b7ddf3', '#63b6e5', '#3ca0d3', '#1087bf', '#548cba', '#677da7', '#9c89cc', '#c091e6', '#d27591', '#f86767', '#e7857f', '#fa946e', '#f5c272', '#cccccc', '#6c6c6c', '#1f1f1f', '#000000'];
    var socket = io.connect('/');
    var map;
    var sentData = {};
    var connects = {};
    var markers = L.layerGroup();;
    var userMarkerLayer = L.layerGroup();
    var active = true;
    var firstTime = true;

    if (localStorage.getItem('icon') && localStorage.getItem('color')) {
        var userIcon = localStorage.getItem('icon');
        var userColor = localStorage.getItem('color');
    } else {
        var userIcon = icons[Math.floor(Math.random() * 24) + 1];
        var userColor = colors[Math.floor(Math.random() * 22) + 1];
        localStorage.setItem('icon', userIcon);
        localStorage.setItem('color', userColor);
    }

    socket.on('disconnect', function(data) {
        map.removeLayer(markers[data]);
    });

    socket.on('disconnected', function(data) {
        if (data !== localStorage.getItem('username')) {
            toggleAlertBar(data, '#333', data + ' has left the map!');
        }
    });

    socket.on('load:coords', function(data) {
        if (!(data.id in connects)) {
            toggleAlertBar(data.id, data.color, data.username + ' has joined the map!', data.coords)
        }

        setMarker(data);

        connects[data.id] = data;
        connects[data.id].updated = $.now();
    });

    var map = L.mapbox.map('map', 'examples.map-9ijuk24y', {
        tileLayer: {
            detectRetina: true
        }
    }).setView([0, 0], 2);

    var directions = L.mapbox.directions('examples.map-h4cgmpoi');
    var directionsLayer = L.mapbox.directions.layer(directions)
        .addTo(map);
    var directionsRoutesControl = L.mapbox.directions.routesControl('routes', directions)
        .addTo(map);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(setInitialLocation, positionError, {
            enableHighAccuracy: true
        });
        navigator.geolocation.watchPosition(positionSuccess, positionError, {
            enableHighAccuracy: true
        });
    } else {
        $('.map').text('Your browser is out of fashion, there\'s no geolocation!');
    }

    function setInitialLocation(position) {
        map.setView([position.coords.latitude, position.coords.longitude], 17);
    }

    function positionSuccess(position) {
        var lat = position.coords.latitude;
        var lng = position.coords.longitude;
        var acr = position.coords.accuracy;

        var icon = L.divIcon({
            className: 'location-icon',
            iconSize: [23, 23]
        });

        var userMarker = L.marker([lat, lng], {
            icon: icon
        });

        userMarkerLayer.clearLayers();
        userMarker.addTo(userMarkerLayer);
        userMarkerLayer.addTo(map);

        var emit = $.now();

        sentData = {
            id: userId,
            username: localStorage.getItem('username') || 'Someone',
            icon: userIcon,
            color: userColor,
            active: true,
            coords: [{
                lat: lat,
                lng: lng,
                // acr: acr
            }]
        };

        socket.emit('send:coords', sentData);
        emit = $.now();
    }

    function setMarker(data) {
        for (var i = 0; i < data.coords.length; i++) {

            if (markers[data.id]) {
                map.removeLayer(markers[data.id])
            }

            var marker = L.marker([data.coords[i].lat, data.coords[i].lng], {
                icon: L.mapbox.marker.icon({
                    'marker-symbol': data.username.charAt(0).toLowerCase(),
                    'marker-color': data.color
                })
            }).bindPopup(data.username).addTo(markers);
            markers.addTo(map);

            markers[data.id] = marker;
        }
    }


    function positionError(error) {
        var errors = {
            1: 'Authorization fails',
            2: 'Can\'t detect your location',
            3: 'Connection timeout'
        };
        showError('Error:' + errors[error.code]);
    }

    function showError(msg) {
        console.log(msg)
    }

    function toggleAlertBar(id, color, message, coords) {
        $('.new-user').append('<div class="contain pad1 clearfix ' + id + '" style=background:' + color + '><h3 class="fl username">' + message + '</h3><span class="icon x fr dark pencil fill-blue round pad1"></span><a href="#" class="button fr nav" data=' + JSON.stringify(coords) + '>Navigate</a><a href="#" class="button fr clear" style="display:none">Clear</a></div>');
        $('.new-user').show();

        setTimeout(function() {
            $('.new-user .' + id ).fadeOut();
        }, 8000);

        $('.nav').click(function(e) {
            e.preventDefault();

            $('.nav').hide();
            $('.clear').show();

            routeTo(JSON.parse($(this).attr('data'))[0].lat, JSON.parse($(this).attr('data'))[0].lng, userMarkerLayer.getLayers()[0].getLatLng().lat, userMarkerLayer.getLayers()[0].getLatLng().lng);
        })

        $('.clear').click(function() {
            directionsLayer.clearLayers();
            $('.nav').show();
            $('.clear').hide();
        });
    }

    function routeTo(startLat, startLng, endLat, endLng) {
        directions
            .setOrigin(L.latLng(endLat, endLng))
            .setDestination(L.latLng(startLat, startLng))
            .query();

        map.fitBounds([
            [startLat, startLng],
            [endLat, endLng]
        ]);
    }

    $('.new-user .x').click(function() {
        $('.new-user').hide();
    });

    if (!localStorage.getItem('username')) {
        $('.register-name').show();
    } else {

    }

    $('#user-name').submit(function(e) {
        e.preventDefault();
        localStorage.setItem("username", $('#user-name input').val());
        $('.register-name').fadeOut();
    })

});
