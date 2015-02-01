    function initialize() {  

        gmarkers = [];   
        newBusNames = []; 
        placeObject = {};                    
        infowindow = new google.maps.InfoWindow;    
        matches = 0;
        totals = 0;         
        clicked = 0
        NewRange = (100 - 0);      
        globalCount = 0;
        gmarkersLookUp = 0;

        newStyle = [{"featureType":"water","stylers":[{"color":"#021019"}]},{"featureType":"landscape","stylers":[{"color":"#08304b"}]},{"featureType":"poi","elementType":"geometry","stylers":[{"color":"#0c4152"},{"lightness":5}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#000000"}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#0b434f"},{"lightness":25}]},{"featureType":"road.arterial","elementType":"geometry.fill","stylers":[{"color":"#000000"}]},{"featureType":"road.arterial","elementType":"geometry.stroke","stylers":[{"color":"#0b3d51"},{"lightness":16}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"color":"#000000"}]},{"elementType":"labels.text.fill","stylers":[{"color":"#ffffff"}]},{"elementType":"labels.text.stroke","stylers":[{"color":"#000000"},{"lightness":13}]},{"featureType":"transit","stylers":[{"color":"#146474"}]},{"featureType":"administrative","elementType":"geometry.fill","stylers":[{"color":"#000000"}]},{"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"color":"#144b53"},{"lightness":14},{"weight":1.4}]}]

        mapOptions = {
            zoom: 4,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            styles: newStyle
        };

        map = new google.maps.Map(document.getElementById('map_canvas'),mapOptions);

        plotFeatures(map);          
    }     

    function myclick(bname) {

        for (var i = 0; i < gmarkers.length; i++) {
            if (bname.toLowerCase() == gmarkers[i].name) {
                google.maps.event.trigger(gmarkers[i], "click");
            }          
        };
    }

    function plotFeatures(map) {

        var tocSorted = [];
     
        $.getJSON("fc.geojson", function(data) {      

            //set info window HTML to empty
            var content = "";

            //array for polygon coords
            var triangleCoords = [];

            //create loop for all features
            for(var x=0; x < data.features.length; x++) {

                //populate html content with attributes
                $.each(data.features[x].properties, function(key,value) {

                    content += '<div>' + "<b>"+ key + "</b>" + " : " + value + '</div>';  

                });

                //get feature name and push to array for sorting
                $.each(data.features[x].properties, function(key,value) {           

                    if ((key == "POLYGON_NM") || (key == "NAME1" )) {

                        tocSorted.push(value);                            
                    }
                });
        
                //if point create marker
                if (data.features[x].geometry.type === "Point") {

                    var type = "point";            

                    var myLatlng = new google.maps.LatLng(data.features[x].geometry.coordinates[1],data.features[x].geometry.coordinates[0]);

                    //convert myBusiness name to lower case, use sort field without quotes here
                    if (data.features[x].properties.NAME1 != undefined) {
                        var myBusinessName = data.features[x].properties.NAME1.toLowerCase();
                    }

                    var marker = new google.maps.Marker({
                        position: myLatlng,
                        map: map,
                        html: content,
                        name: myBusinessName,
                        icon:"http://maps.google.com/mapfiles/ms/icons/blue-dot.png"    
                    });
                
                    placeObject[myBusinessName] = myLatlng;

                    //call places Search

                    //set center for map
                    var myLatlngCenter = new google.maps.LatLng(data.features[x].geometry.coordinates[1],data.features[x].geometry.coordinates[0]);

                    //call points and polygons features for easier use
                    var feature = marker;

                    //push markers to array
                    gmarkers.push(marker);
                }

                //if polygon loop through coordinates and add to triangleCoords array
                if (data.features[x].geometry.type === "Polygon") {

                    var type = "polygon";

                    var southWestLon = data.features[x].geometry.coordinates[0][0][0];
                    var southWestLat = data.features[x].geometry.coordinates[0][0][1];
                    var northEastLon = data.features[x].geometry.coordinates[0][0][0];
                    var northEastLat = data.features[x].geometry.coordinates[0][0][1];
                    
                    for (var y = 0; y < data.features[x].geometry.coordinates[0].length; y++) {

                        triangleCoords.push(new google.maps.LatLng(data.features[x].geometry.coordinates[0][y][1], data.features[x].geometry.coordinates[0][y][0]));

                        if (data.features[x].geometry.coordinates[0][y][0] <  southWestLon) {
                            southWestLon = data.features[x].geometry.coordinates[0][y][0];                           
                        }
                        if (data.features[x].geometry.coordinates[0][y][1] < southWestLat) {
                            southWestLat = data.features[x].geometry.coordinates[0][y][1];
                        }
                        if (data.features[x].geometry.coordinates[0][y][0] > northEastLon) {
                            northEastLon = data.features[x].geometry.coordinates[0][y][0];
                        }
                        if (data.features[x].geometry.coordinates[0][y][1] > northEastLat) {
                            northEastLat = data.features[x].geometry.coordinates[0][y][1];
                        }
                    }

                    //convert myBusiness name to lower case
                    if (data.features[x].properties.NAME1 != undefined) {
                        var myBusinessName = data.features[x].properties.NAME1.toLowerCase();
                    }

                    //create polygon features with triangleCoords
                    var polyGon = new google.maps.Polygon({
                        paths: triangleCoords,
                        strokeColor: '#FF0000',
                        strokeOpacity: 0.8,
                        strokeWeight: 5,
                        fillColor: '#FF0000',
                        fillOpacity: 0.06,
                        draggable: true,
                        name: myBusinessName,     
                        position: new google.maps.LatLng(data.features[x].geometry.coordinates[0][0][1], data.features[x].geometry.coordinates[0][0][0]),
                        html: content
                      });

                    //push polygons to gmarkers array
                    gmarkers.push(polyGon);                    

                    var polyBounds = new google.maps.LatLngBounds(new google.maps.LatLng(southWestLat,southWestLon),new google.maps.LatLng(northEastLat,northEastLon));

                    placeObject[myBusinessName] = polyBounds;

                    //set center for map
                    myLatlngCenter = new google.maps.LatLng(data.features[x].geometry.coordinates[0][0][1], data.features[x].geometry.coordinates[0][0][0]);
                    var feature = polyGon;                             
                }

                //reset content
                var content = "";

                //reset coords array                
                triangleCoords = [];

                //set feature to map
                feature.setMap(map);

                //add listener object to feature
                google.maps.event.addListener(feature, "click", function () {
                    infowindow.setContent(this.html);
                    infowindow.open(map, this);
                });

                totals++;          
            }    
            compile2(feature,map,myLatlngCenter,tocSorted,type);      
        });        
    }

    function showMatches(myBusinessName,obj) {         

        if (newBusNames.indexOf(myBusinessName) == -1 ) {
            newBusNames.push(myBusinessName);
            matches++;
            var listItem = document.getElementById(myBusinessName);
            listItem.innerHTML += "<span class='glyphicon glyphicon-ok'></span>";
            h2Title = document.getElementById("matches");
            h2Title.innerHTML = "Matches Found: " + matches + " out of " + totals;
            gmarkers[gmarkersLookUp].setIcon('http://maps.google.com/mapfiles/ms/icons/green-dot.png');
        }

        else {
            return false;
        }
    }

    function callBack(myBusinessName,results) {

        var score = 0;

        //loop through all objects returned by places                                                            
        for (var key in results) {
            var obj = results[key];                
            if (myBusinessName.indexOf(obj.name.toLowerCase()) != -1) {
                showMatches(myBusinessName,obj)
            }
            // else {

            //     var mybusinessNameSplit = myBusinessName.split(" ");

            //     if (mybusinessNameSplit.length <= 2) {
            //         return false;
            //     }

            //     for (var word in mybusinessNameSplit) {
            //         if (obj.name.toLowerCase().indexOf(word) != -1) {
            //             score++;
            //         }
            //     }
            //     if (mybusinessNameSplit.length === 3) {
            //         if (score >= 2) {
            //             console.log("Partial match 2");
            //             showMatches(myBusinessName,obj);
            //         }
            //     }
            //     else if (mybusinessNameSplit.length === 4) {
            //         if (score >= 3) {
            //             console.log("Partial match 3");
            //             showMatches(myBusinessName,obj);               
            //         }
            //     }
            //     else if (mybusinessNameSplit.length === 5) {
            //         if (score >= 4) {                
            //             console.log("Partial match 4");
            //             showMatches(myBusinessName,obj);
            //         }
            //     }
            //     else if (mybusinessNameSplit.length === 6) {
            //         if (score >= 5) {                
            //             console.log("Partial match 5");
            //             showMatches(myBusinessName,obj);            
            //         }
            //     }
        }       
    }                      

    function placesSearch(myBusinessName,myLatlng,type,updateBar,OldRange,inputRadius) {

        if (type === "point") {
            //search redius
            var request = {
                location: myLatlng,
                rankBy: google.maps.places.RankBy.PROMINENCE,
                radius: inputRadius
            };
        }
        else if (type === "polygon") {
            var request = {
                bounds: myLatlng,
                rankBy: google.maps.places.RankBy.PROMINENCE
            };
        }

        var service = new google.maps.places.PlacesService(map);

        service.nearbySearch(request, function(results, status) {

            if (status == google.maps.places.PlacesServiceStatus.OK) {

                callBack(myBusinessName,results);
                console.log(status);
                console.log("Looping on count: " + globalCount++);
                var newValue = Math.floor((((globalCount - 0) * NewRange) / OldRange));
                console.log(newValue);
                updateBar.style.width = newValue.toString() + "%";
                gmarkersLookUp++;
            }

            else {
                console.log(status);
                console.log("Looping on count: " + globalCount++)
                var newValue = Math.floor((((globalCount - 0) * NewRange) / OldRange));
                updateBar.style.width = newValue.toString() + "%";
                gmarkersLookUp++;
            }
        });
    }

    function listners(type,checkBox,inputRadius) {

        if (inputRadius === undefined) {
            inputRadius = 500;
        }        

        var lengthPlaceObject = Object.keys(placeObject).length;

        var OldRange = (totals - 0); 

        if (clicked == 0) {
            clicked = 1;
            var countLoop = 1;
            checkBox.innerHTML = "Processing...";
            checkBox.className = "btn btn-warning btn-block";
            $( '<div class="col-md-12 sty myBarHolder">' +
                    '<div class="progress">' +
                        ' <div id="myBar" class="progress-bar progress-bar-success progress-bar-striped active" role="progressbar" aria-valuenow="40" aria-valuemin="0" aria-valuemax="100" style="width: 0%"></div>' +
                    '</div>' +
               '</div>').insertAfter('.myBarSpot');
            var updateBar = document.getElementById('myBar');                                   
            $.each(placeObject, function(key,value) {
                setTimeout(function() {                    
                    placesSearch(key,value,type,updateBar,OldRange,inputRadius);  
                    if (lengthPlaceObject == (globalCount + 1)) {
                        checkBox.innerHTML = "Done!";
                        checkBox.className = "btn btn-success btn-block"; 
                    }
                }, 600*countLoop);
                ++countLoop;               
            });         
        }
    }

    function popUps(idName) {

        if (idName === 'About') {
            bootbox.alert("A tool to validate geospatial feature data against Google Maps API V3. <br> The tool uses a proximity search against the users respective data to find nearby features. A match is made \
                when the feature data's name attribute matches Google's holdings.");
        }
        else if (idName === 'HSIP') {
            bootbox.alert("A tool primarly used with HSIP Data that puts an emphasis on data quality comparison between vendors.");
        }

        else if (idName === 'Contact') {
            bootbox.alert("For Questions or Comments, email me at blah@blah.com");
        }
    }

    function compile2(feature,map,myLatlngCenter,tocSorted,type) {      

        //set table of contents HTML to empty
        var contentToc = "";

        var matchHTML = "";
        
        //set center
        map.setCenter(new google.maps.LatLng(36,-97));        

        //sort array of features alphabetically
        tocSorted = tocSorted.sort();

        //add anchor tag and javascript myclick function
        for (var i = 0; i < tocSorted.length; i++) {

            contentToc += '<li><a id = "' + tocSorted[i].toLowerCase() + '" href="javascript:myclick(' + "'" + (tocSorted[i]) + "'" + ')">' + tocSorted[i] + '<\/a><br></li>';      
        }
        //get table of contents DIV
        var resultSet = document.getElementById("results");

        //populate div with contentTOC
        resultSet.innerHTML = contentToc;

        var checkBox = document.getElementById('checkBox'); 

        //creating listeners here for input form and validate button
        $('#field').keypress(function(e) {
            if(e.which == 13) {
                var inputRadius = document.getElementById("field").value;
                if (Boolean(inputRadius)) {
                    listners(type,checkBox,inputRadius);
                }
                else {
                    listners(type,checkBox);
                }
            }
        });        

        checkBox.addEventListener('click', function() {
            var inputRadius = document.getElementById("field").value;
            if (Boolean(inputRadius)) {
                listners(type,checkBox,inputRadius);
            }
            else {
                listners(type,checkBox);
            }
        }, false);

        //Click handlers for nav bar
        $('#About').click(function() { popUps(this.id); return false; });
        $('#HSIP').click(function() { popUps(this.id); return false; });
        $('#Contact').click(function() { popUps(this.id); return false; });

        $.post("http://ogre.adc4gis.com/convert?", {upload: "lakes.zip"},function( data ) {
            newdata = data;
        });
    }    

    //kickoff
    google.maps.event.addDomListener(window, 'load', initialize);