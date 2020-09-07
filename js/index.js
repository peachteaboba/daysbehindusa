let dataRaw;
let dataset = {};
let dataCount = [];
let dataCountryCache = {};

let displayList = [];
const ignoreList = ['cruise_ship'];

const minTotal = 100000;
const maxTotal = 4000000;
const minTotalWeighted = 1000;
const maxTotalWeighted = 18000;

const startingCountStatic = 3000000;
let startingCount = startingCountStatic;
let startingWeighted = 10000;

let limitMax = 15;
let expand = false;
let weighted = false;

(function init() {
    $(function () {
        // Fetch display params
        displayList = [];
        let displayParams = urlParams.get('display');
        if (displayParams) {
            displayParams = decodeURIComponent(displayParams);
            displayList = displayParams.split(',');
        }
        initControls();
        initTwitter();
        getData();
    });
})();

function initControls() {

    // Expand
    if (urlParams.get('expand') && urlParams.get('expand') === '1') expand = true;

    // Weighted
    if (urlParams.get('weighted') && urlParams.get('weighted') === '1') weighted = true;

    // Limit
    if (weighted) limitMax = 30;
    if (urlParams.get('limit')) limitMax = parseInt(urlParams.get('limit'));

    // Set defaults
    if (weighted) startingCount = startingWeighted;

    // Set initial starting range from url param
    const urlStarting = urlParams.get('starting') ? parseInt(urlParams.get('starting')) : 0;
    if (urlStarting) {
        // Use url params
        if (weighted) {
            if (urlStarting >= minTotalWeighted && urlStarting <= maxTotalWeighted) {
                startingCount = urlStarting;
            } else {
                // Out of range
                startingCount = startingWeighted;
            }
        } else {
            if (urlStarting >= minTotal && urlStarting <= maxTotal) {
                startingCount = urlStarting;
            }
        }
    }

    // Bind event handlers
    $('#starting-range').on('mousemove', function () {
        startingCount = $(this).val();
        setSliders();
    }).on('change', function () {
        setTimeout(function () {
            urlGenerator('starting', startingCount);
            initProcessData();
        }, 500);
    });

    $('#expand').on('change', function () {
        expand = $(this).is(":checked");
        urlGenerator('expand', expand ? '1' : '0');
        initProcessData();
    });

    $('#weighted').on('change', function () {
        weighted = $(this).is(":checked");
        startingCount = weighted ? startingWeighted : startingCountStatic;
        setWeighedSliders();
        $('#starting-range-label').text(formatNumber(startingCount));
        $('#starting-range').val(startingCount);
        urlGenerator('weighted', weighted ? '1' : '0');
        initProcessData();
    });

    // Set initial values
    initFilters();
    setWeighedSliders();
    setSliders();
    setToggle();
}

function formatNumber(num) {
    if (typeof num !== "string") num = num.toString();
    return num.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
}

function initFilters() {
    const filterButtonEl = $('#filter-btn');
    let filter_html;
    if (displayList.length > 0) {
        const src = 'img/misc/filter-clear.svg';
        filter_html = '<p>Clear Filters</p><img src="' + src + '" alt="Clear Filter Icon">';
    } else {
        const src = 'img/misc/filter.svg';
        filter_html = '<p>Filter By Country</p><img src="' + src + '" alt="Filter Icon">';
    }
    filterButtonEl.html(filter_html);
    const filterEl = $('#filter');
    const filterBgEl = $('#filter-bg');
    filterEl.attr('data-show', '0');
    filterEl.hide();
    filterBgEl.hide();
    filterButtonEl.on('click', function () {
        toggleFilters();
    });
    filterBgEl.on('click', function () {
        toggleFilters();
    });
}

function toggleFilters() {
    const filterEl = $('#filter');
    const filterBgEl = $('#filter-bg');
    if (displayList.length > 0) {
        // Clear filters
        urlGenerator('display', '');
        location.reload();
    } else {
        if (filterEl.attr('data-show') === '0') {
            filterEl.attr('data-show', '1');
            filterEl.show();
            filterBgEl.show();
            filterEl.html(render.filters());
            // Attach event handlers
            $('.filter-el').on('click', function () {
                const selectedEl = $(this);
                if (selectedEl.hasClass('selected')) {
                    selectedEl.removeClass('selected');
                } else {
                    selectedEl.addClass('selected');
                }
            });
            $('#filter-submit-button').on('click', function () {
                let selected = [];
                $('.filter-el.selected').each(function () {
                    selected.push($(this).attr('data-id'));
                });
                if (selected.length > 0) {
                    urlGenerator('display', selected.join(','));
                    setTimeout(function () {
                        location.reload()
                    }, 100);
                }
                toggleFilters();
            });
        } else {
            filterEl.attr('data-show', '0');
            filterEl.hide();
            filterBgEl.hide();
        }
    }
}

function setWeighedSliders() {
    const titleEl = $('#starting-range-title');
    const inputEl = $('#starting-range');
    if (weighted) {
        titleEl.text('Starting USA Case Number / 1M');
        inputEl.attr('min', minTotalWeighted.toString());
        inputEl.attr('max', maxTotalWeighted.toString());
        inputEl.attr('step', '1000');
    } else {
        titleEl.text('Starting USA Case Number');
        inputEl.attr('min', minTotal.toString());
        inputEl.attr('max', maxTotal.toString());
        inputEl.attr('step', '100000');
    }
    inputEl.val(startingCount);
}

function setSliders() {
    // Starting
    $('#starting-range-label').text(formatNumber(startingCount));
}

function setToggle() {
    // Expand
    $('#expand').prop('checked', expand);
    // Weighted
    $('#weighted').prop('checked', weighted);
}

function urlGenerator(field, value) {
    let searchParams = new URLSearchParams(window.location.search);
    searchParams.set(field, value);
    const newParams = searchParams.toString();
    history.pushState('', 'Days Behind USA - COVID19', location.href.split('?')[0] += '?' + newParams);
}

// ---------------------
// ------ TWITTER ------
// ---------------------
function initTwitter() {
    const twitterEl = $('#tweet-hashtag-wrapper');
    if (twitterEl) twitterEl.show();
    const twitterEmbedEl = $('#tweet-embeds');
    if (twitterEmbedEl) twitterEmbedEl.show();
}

function getData() {
    $.get("https://pomber.github.io/covid19/timeseries.json", function (data) {
        // console.log(data);
        dataRaw = data;
        initProcessData();
    }).then(function () {
        // Done
    });
}

function initProcessData() {
    // Display loading gif
    const bodyEl = $('#body');
    const img_src = 'img/gif/spinner-w.svg';
    bodyEl.html('<div class="loading-wrapper"><img src="' + img_src + '" alt="Loading"></div>');
    processData(function () {
        renderSummary();
        renderList();
    });
}

function processData(cb) {
    dataCount = [];
    dataset = [];
    dataCountryCache = {};
    let obj = dataRaw;
    let processed = {};
    for (let prop in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, prop)) {
            const id = prop.replace(/\s+/g, '_').toLowerCase().replace(/[^\w\s]/gi, '');
            if ((displayList.length > 0 && displayList.indexOf(id) === -1 && id !== 'us') || !dataFixture.population[id]) {
                // console.log('[ processData ] skipping this country:', id + (!dataFixture.population[id] ? ' (missing population data)' : ''));
            } else {
                // Add to list
                let arr = [];
                let latest = 0;
                if (obj[prop] && obj[prop].length > 0) {
                    dataCountryCache[id] = {};
                    dataFixture.population[id].millions = Number(dataFixture.population[id].full / 1000000);
                    for (let i = 0; i < obj[prop].length; i++) {
                        if (weighted) {
                            // Calculate weighted
                            obj[prop][i]['weighted'] = Number((obj[prop][i]['confirmed'] / dataFixture.population[id].millions).toFixed(2));
                            if (obj[prop][i]['weighted'] >= startingCount) {
                                arr.push(obj[prop][i]);
                                if (i === obj[prop].length - 1) {
                                    latest = obj[prop][i]['confirmed'];
                                }
                            }
                        } else {
                            if (obj[prop][i]['confirmed'] >= startingCount) {
                                arr.push(obj[prop][i]);
                                if (i === obj[prop].length - 1) {
                                    latest = obj[prop][i]['confirmed'];
                                }
                            }
                        }
                        // Add to country cache
                        dataCountryCache[id][obj[prop][i]['date']] = obj[prop][i];
                    }
                }
                if (arr.length > 0 && latest >= minTotal) {
                    if (displayList.length > 0 && displayList.indexOf(id) === -1 && id !== 'us') {
                        // Skip this
                    } else if (ignoreList.indexOf(id) === -1) {
                        // Calculate weighted
                        let weightedLatest;
                        if (weighted) weightedLatest = Number((latest / dataFixture.population[id].millions).toFixed(2));
                        processed[id] = {
                            name: prop,
                            data: arr,
                            count: arr.length,
                            latest: latest,
                            population: dataFixture.population[id].full,
                            id: id,
                            millions: dataFixture.population[id].millions,
                            weighted: weightedLatest
                        };
                        dataCount.push({
                            id: id,
                            latest: latest,
                            weighted: weightedLatest
                        });
                    }
                }
            }
        }
    }
    if (weighted) {
        dataCount.sort((a, b) => (a.weighted < b.weighted) ? 1 : -1);
    } else {
        dataCount.sort((a, b) => (a.latest < b.latest) ? 1 : -1);
    }
    dataCount = dataCount.slice(0, limitMax + 1);

    // -------------------------------------------------
    // ------------- Shift To Match USA ----------------
    // -------------------------------------------------
    let delta = {};
    const usData = processed['us']['data'];
    for (let prop in processed) {
        if (Object.prototype.hasOwnProperty.call(processed, prop)) {
            let country = processed[prop];
            if (country['id'] !== 'us') {
                let countryData = country['data'];
                // Get max for country
                const countryMax = weighted ? country['weighted'] : country['latest'];
                const targetProp = weighted ? 'weighted' : 'confirmed';
                // Find index of lowest delta
                delta = {};
                let value;
                for (let i = 0; i < usData.length; i++) {
                    // Record lowest delta
                    value = Math.abs(usData[i][targetProp] - countryMax);
                    if (typeof delta.value === "undefined" || delta.value > value) {
                        delta.value = value;
                        delta.idx = i;
                    }
                }
                country['idx'] = delta.idx;
                // Make sure idx in delta obj matches with length of countryData
                if (countryData.length > delta.idx) {
                    // Need to Trim
                    country['data'] = countryData.slice(-1 * (delta.idx + 1));
                } else {
                    // Need to Add
                    let daysBehind = 0;
                    const earliestDate = countryData[0]['date'];
                    while (countryData.length !== (delta.idx + 1)) {
                        daysBehind++;
                        let d = generateNewDate(earliestDate);
                        d.setDate(d.getDate() - daysBehind);
                        // Get formatted date
                        const formattedDate = moment(d).format('YYYY-M-D');
                        const countryDataRaw = dataCountryCache[prop][formattedDate] || {};
                        countryData.unshift({
                            date: d,
                            confirmed: countryDataRaw['confirmed'] || '-',
                            deaths: countryDataRaw['deaths'] || '-',
                            recovered: countryDataRaw['recovered'] || '-',
                            weighted: Number((countryDataRaw['confirmed'] / dataFixture.population[country['id']].millions).toFixed(2)) || '-'
                        });
                    }
                    country['data'] = countryData;
                }
                // ----------------------------------------------------
                // ------------ Populate Remaining Days ---------------
                // ----------------------------------------------------
                countryData = country['data'];
                let daysForward = 0;
                const latestDate = countryData[countryData.length - 1]['date'];
                while (countryData.length !== usData.length) {
                    let d = generateNewDate(latestDate);
                    d.setDate(d.getDate() + daysForward + 1);
                    countryData.push({
                        date: d,
                        confirmed: '-',
                        deaths: '-',
                        recovered: '-',
                        days: daysForward
                    });
                    daysForward++;
                }
                country['days'] = daysForward - 1;
            }
        }
    }

    // Fix Italy data bug
    // processed['italy']['data'].forEach(function (el) {
    //     if (el['date'] === '2020-3-12') {
    //         el['confirmed'] = 15113;
    //     }
    // });

    // Add end buffer date to Italy
    // let lastItalyDate = generateNewDate(processed['italy']['data'][processed['italy']['data'].length - 1]['date']);
    // lastItalyDate.setDate(lastItalyDate.getDate() + 1);
    // processed['italy']['data'].push({
    //     date: lastItalyDate,
    //     confirmed: '-',
    //     deaths: '-',
    //     recovered: '-'
    // });

    // -------------------------------------------------
    // ------------ Calculate Percentages --------------
    // -------------------------------------------------
    for (let prop in processed) {
        if (Object.prototype.hasOwnProperty.call(processed, prop)) {
            let country = processed[prop];
            let data = {};
            let dataPrev = {};
            const targetProp = weighted ? 'weighted' : 'confirmed';
            const max = weighted ? country['weighted'] : country['latest'];
            for (let i = 0; i < country['data'].length; i++) {
                data = country['data'][i];
                // Calculate daily percentage increase
                dataPrev = country['data'][i - 1];
                if (data && dataPrev && typeof data[targetProp] === "number" && typeof dataPrev[targetProp] === "number") {
                    // Calculate percentage increase from previous day
                    country['data'][i]['increase_p'] = Math.round(((data[targetProp] - dataPrev[targetProp]) / data[targetProp]) * 100);
                }
                // Calculate percentage of total
                if (data && typeof data[targetProp] === "number") {
                    country['data'][i]['total_p'] = (100 - (((max - data[targetProp]) / max) * 100)).toFixed(2);
                }
            }
        }
    }

    // Proceed to render
    dataset = processed;
    cb();
}

function renderList() {

    setTimeout(function () {
        $('#body .loading-wrapper').html('');
        $('#body-content-wrapper').removeClass('hide').addClass('show');
    }, 500);

    const bodyEl = $('#body');

    let html_arr = [];
    dataCount.forEach(function (el) {
        if (el.id !== 'us' && dataset[el.id] && dataset[el.id].data) {
            // Create body wrapper div
            html_arr.push([
                '<div class="body-wrapper" data-id="' + el.id + '">',
                // Render day element
                '<div class="day-wrapper">',
                render.dayColumn(dataset['us']),
                '</div>',
                // Render us element
                '<div class="us-wrapper">',
                render.countryColumn(dataset['us'], dataset[el.id]['idx']),
                '</div>',
                // Render country element
                '<div class="country-wrapper">',
                render.countryColumn(dataset[el.id], dataset[el.id]['idx'], el.id),
                '</div>',
                '</div>'
            ].join(''));
        }
    });
    bodyEl.append([
        '<div id="body-content-wrapper" class="hide">',
        html_arr.join(''),
        '</div>'
    ].join(''));
}

function renderSummary() {
    // console.log(dataCount);

    // Reset div
    const summaryEl = $('#summary-wrapper');
    summaryEl.html('');

    let html_arr = [];
    dataCount.forEach(function (el) {
        if (el.id !== 'us' && dataset[el.id] && dataset[el.id].data) {
            // Create body wrapper div
            html_arr.push([
                render.summaryRow(el, dataset[el.id], false)
            ].join(''));
        }
    });
    summaryEl.html(html_arr.join(''));

    // Assign event handlers
    $('.summary-el').on('click', function () {
        const id = $(this).attr('data-id');
        const targetEl = $('.body-wrapper[data-id="' + id + '"]');
        if (id && targetEl) {
            $([document.documentElement, document.body]).animate({
                scrollTop: targetEl.offset().top - 40
            }, 1000);
        }
    });
}

function generateNewDate(dateStr) {
    let date = new Date(dateStr);
    if (Number.isNaN(date.getMonth())) {
        let arr = dateStr.split(/[- :]/);
        date = new Date(arr[0], arr[1] - 1, arr[2], arr[3], arr[4], arr[5]);
    }
    return date;
}


// end
