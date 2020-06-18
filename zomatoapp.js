$(document).ready(function () {

    const apiKey = 'ef5b1abf524ce5d1f47b5b0f797a9d72',
        citySearchURL = 'https://developers.zomato.com/api/v2.1/cities',
        cuisineSearchURL = 'https://developers.zomato.com/api/v2.1/cuisines',
        searchURL = 'https://developers.zomato.com/api/v2.1/search';
    let cityId = null,
        cityName = null,
        cuisineId = null,
        cuisineName = null;

    // Clear City Datalist
    const clearCityDatalist = () => {

        $('#cities').empty();
        let cities = $('#cities').children().length
        if (cities) return false
        else return true;

    };

    const clearSearchResults = () => {

        $('#search-header').empty();
        $('#search-data').empty();
        let searchHeader = $('#search-header').children().length,
            searchData = $('#search-data').children().length;
        if (searchHeader && searchData) return false
        else return true;

    }

    // Reset Search Tool Data
    const clearSearchToolData = (event) => {

        $('#api-cuisine-search').css('display', 'unset');
        $('#cities').empty();
        $('#city-input').attr('readonly', false).css('color', 'inherit').val('');
        $('#cuisine-selection').css('display', 'none');
        $('#cuisines').empty().val('');
        $('datalist').css('display', 'none');
        $('#search-header').empty();
        $('#search-data').empty();
        $('#search-tool-reset').css('display', 'none');

    }

    // Zomato API - City Search
    const handleCitySearch = (event) => {

        if (event.key != undefined) {            
            let cityInput = $('#city-input').val().trim();
            $.ajax({
                type: 'GET',
                headers: { 'X-Zomato-API-Key': apiKey },
                url: citySearchURL,
                dataType: 'json',
                data: { q: cityInput },
                processData: true, // Converts data to query string
                success: (data) => {
                    console.log('Zomato - City Data', data);
                    let cities = data.location_suggestions;
                    cities.sort((a, b) => (a.name > b.name) ? 1 : -1)
                    if (clearCityDatalist())
                        for (let i = 0; i < cities.length; i++) {
                            let option = $('<option>');
                            option.val(cities[i].name);
                            option.text(cities[i].name);
                            option.attr('data-cityid', cities[i].id);
                            $('#cities').append(option);
                        }
                }
            });
        };

    };

    // Zomato API - Cuisine Search
    const handleCuisineSearch = (event) => {

        cityName = $('#city-input').val();
        let cityDataList = $('datalist#cities').children();
        for (let i = 0; i < cityDataList.length; i++) {
            let optionVal = $(cityDataList[i]).val();
            if (optionVal === cityName) {
                cityId = $(cityDataList[i]).attr('data-cityid');
                break;
            };
        };
        $.ajax({
            type: 'GET',
            headers: { 'X-Zomato-API-Key': apiKey }, //only allowed non-standard header
            url: cuisineSearchURL,
            dataType: 'json',
            data: { city_id: cityId },
            processData: true, // Converts data to query string
            success: function (data) {
                console.log('Zomato - Cuisine Data', data);
                if (data.cuisines.length === 0)
                    $('#search-data').html(`<p>Unable to locate restaurants in this area. Please try a neighboring city.</p>`);
                else {
                    for (let i = 0; i < data.cuisines.length; i++) {
                        let cuisine = data.cuisines[i].cuisine.cuisine_name,
                            id = data.cuisines[i].cuisine.cuisine_id,
                            option = $('<option>');
                        option.val(cuisine).text(cuisine);
                        option.attr('data-cuisineId', id);
                        $('#cuisines').append(option);
                    }
                    $('#api-cuisine-search').css('display', 'none');
                    $('#city-input').attr('readonly', true).css('color', 'gray');
                    $('#cuisine-selection').css('display', 'block');
                    $('#search-tool-reset').css('display', 'block');
                };
            }
        });

    };

    // Zomato API - Restaurant Search
    const handleRestaurantSearch = (event) => {

        cuisineName = $('#cuisines option:selected').val();
        cuisineId = $('#cuisines option:selected').attr('data-cuisineId');
        let restaurantSearchUrl = `${searchURL}?entity_id=${cityId}&entity_type=city&cuisines=${cuisineId}`;
        $.ajax({
            type: 'GET',
            headers: { 'user-key': apiKey },
            url: restaurantSearchUrl,
            dataType: 'json',
            success: function (data) {
                console.log('Zomato - Restaurant Data', data);
                let results = data.restaurants,
                    resultsCleared = clearSearchResults();
                // $('#search-data #search-header').empty();
                if (results.length === 0)
                    $('#search-data').html(`<p>Unable to locate restaurants serving ${cuisineName}. Please try a different cuisine and/or city.</p>`);
                else if (cuisineName === 'null' || cuisineName === '')
                    $('#search-data').html(`<p>Please select a cuisine.</p>`);
                else {
                    // Display Restaurant Data (e.g. Venue Name, City, Address, etc.)
                    let message = $('<span>').text(`${cuisineName} Restaurants in ${cityName}`);
                    $('#search-header').html(message);
                    for (let i = 0; i < results.length; i++) {
                        var anchor = $('<a>');
                        var mainDiv = $('<div>');
                        var p = $('<p>');
                        var priceRange = results[i].restaurant.price_range;
                        var span = $('<span>');
                        var subDiv1 = $('<div>');
                        var subDiv2 = $('<div>');
                        var subDiv3 = $('<div>');
                        subDiv1.append(results[i].restaurant.name);
                        subDiv1.addClass('venueName');
                        subDiv2.append(results[i].restaurant.location.city);
                        subDiv2.addClass('venueCity');
                        subDiv3.append(results[i].restaurant.location.address + '<hr>');
                        p.append('Cuisines: ' + results[i].restaurant.cuisines + '<br>');
                        span.addClass('venueCost');
                        for (var cost = 0; cost < priceRange; cost++) span.append('$');
                        p.append('Cost: ', span);
                        anchor.attr('href', results[i].restaurant.url);
                        anchor.attr('target', '_blank');
                        anchor.text('Visit Zomato Restaurant Page');
                        p.append('<br>');
                        p.append(anchor);
                        subDiv3.append(p);
                        mainDiv.append(subDiv1);
                        mainDiv.append(subDiv2);
                        mainDiv.append(subDiv3);
                        mainDiv.addClass('venues');
                        $('#search-data').append(mainDiv);
                    };
                    // $('#search-tool-reset').css('display', 'block');
                }
            }
        });

    };

    // Event Handlers
    $('#city-input').keyup(handleCitySearch);
    $('#api-cuisine-search').click(handleCuisineSearch);
    $('#api-restaurant-search').click(handleRestaurantSearch);
    $('#clear-search-data').click(clearSearchToolData);

});