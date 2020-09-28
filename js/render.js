const urlParams = new URLSearchParams(window.location.search);
let render = {};

render.dayColumn = function (country) {
    let html = [
        '<div class="day-title">Day</div>'
    ];
    for (let i = 0; i < country.data.length; i++) {
        // ---------------------------------
        // Set dynamic classes based on date
        // ---------------------------------
        let date = generateNewDate(country.data[i]['date']);
        const moment_date = moment(date);
        date = moment(date).format('ddd, MMM DD');
        let isSameDay = moment_date.isSame(moment(), 'day');
        const dynamicClass = i % 2 !== 0 ? 'even' : '';
        html.push('<div class="' + dynamicClass + '"> ' + (isSameDay ? 'Today' : i + 1) + ' </div>');
        if (isSameDay) break;
    }
    return html.join('');
};

render.countryColumn = function (data, idx, id) {
    let body = ['<div class="country-body">'];
    // console.log(data);

    // Build Date HTML :::::::::::::::::::::::
    // :::::::::::::::::::::::::::::::::::::::
    let date_html = [];
    date_html.push('<div class="country-date">');
    date_html.push('<div class="country-date-title date">Date</div>');
    for (let i = 0; i <= data.data.length - 1; i++) {

        // ---------------------------------
        // Set dynamic classes based on date
        // ---------------------------------
        let date = generateNewDate(data.data[i]['date']);
        const moment_date = moment(date);
        date = moment(date).format('ddd, MMM DD');
        let isSameDayClass = '';
        let isSameDay = false;
        if (moment_date.isSame(moment(), 'day')) {
            isSameDayClass = ' today';
            isSameDay = true;
        }
        const dynamicClass = i % 2 === 0 ? 'date even' + isSameDayClass : 'date' + isSameDayClass;
        date_html.push('<div class="' + dynamicClass + '"> ' + date);

        // --------------------------
        // Add days forward if needed
        // --------------------------
        const days = data.data[i]['days'];
        if (data['name'] !== 'US') {
            if (typeof days !== "undefined" || isSameDay) {
                if (isSameDayClass !== '') {
                    date_html.push('<div class="days-forward">Today</div>');
                } else {
                    date_html.push('<div class="days-forward">+ ' + days + ' days</div>');
                }
            }
        }

        date_html.push('</div>');
    }
    date_html.push('</div>');

    // Build Cases HTML ::::::::::::::::::::::
    // :::::::::::::::::::::::::::::::::::::::
    let cases_html = [];
    cases_html.push('<div class="country-date">');
    cases_html.push('<div class="country-date-title">' + (weighted ? 'Cases/1M' : 'Cases') + '</div>');
    for (let i = 0; i <= data['data'].length - 1; i++) {

        // ---------------------------------
        // Set dynamic classes based on data
        // ---------------------------------
        let matchClass = '';
        let arrow_html = '';
        if (idx && i === idx) {
            matchClass = ' match';
            if (data['name'] !== 'US') {
                arrow_html = '<div class="arrow-left"></div>';
            }
        }
        let dynamicClass = i % 2 === 0 ? 'cases total even' + matchClass : 'cases total' + matchClass;
        if (data['name'] === 'US') dynamicClass += ' us';

        // ------------------
        // Build progress bar
        // ------------------
        let progress_bar_html = '';
        if (typeof data.data[i]['total_p'] !== "undefined") {
            progress_bar_html = '<div class="progress-bar-wrapper"><div class="progress-bar" style="width: ' + data.data[i]['total_p'] + '%;"></div></div>';
        }

        if (weighted) {
            // ----------------
            // Process weighted
            // ----------------
            let weightedConfirmed = (data.data[i]['confirmed'] / data['millions']).toFixed(2);
            if (weightedConfirmed === "NaN") weightedConfirmed = '-';
            cases_html.push('<div class="' + dynamicClass + '"> ' + progress_bar_html + arrow_html + '<p>' + weightedConfirmed.toLocaleString() + '</p> </div>');
        } else {
            cases_html.push('<div class="' + dynamicClass + '"> ' + progress_bar_html + arrow_html + '<p>' + data.data[i]['confirmed'].toLocaleString() + '</p> </div>');
        }
    }
    cases_html.push('</div>');

    // Build Percentage HTML :::::::::::::::::
    // :::::::::::::::::::::::::::::::::::::::
    let percentage_html = [];
    percentage_html.push('<div class="country-date">');
    percentage_html.push('<div class="country-date-title">+ %</div>');
    for (let i = 0; i <= data['data'].length - 1; i++) {
        // -------------------------------------------
        // Display percentage change from previous day
        // -------------------------------------------
        let dynamicClass = i % 2 === 0 ? 'cases percentage even' : 'cases percentage';
        let style = '';
        let percentage_change_html = '';
        if (typeof data.data[i]['increase_p'] !== "undefined") {
            percentage_change_html = '+' + data.data[i]['increase_p'] + '%';
            style = ' style="background: ' + getIncreasePercentageColor(data.data[i]['increase_p']) + ';"';
        }
        percentage_html.push('<div class="' + dynamicClass + '"><div class="percentage-color" ' + style + '></div><p>' + percentage_change_html + '</p></div>');
    }
    percentage_html.push('</div>');

    // Build Deaths / Rec HTML :::::::::::::::
    // :::::::::::::::::::::::::::::::::::::::
    let deaths_html = [];
    let rec_html = [];
    //const urlParams = new URLSearchParams(window.location.search);
    if (expand) {
        // Render Deaths
        deaths_html.push('<div class="country-date">');
        deaths_html.push('<div class="country-date-title">' + (weighted ? 'Deaths/1M' : 'Deaths') + '</div>');
        for (let i = 0; i <= data['data'].length - 1; i++) {
            const dynamicClass = i % 2 === 0 ? 'cases deaths even ' : 'cases deaths';
            if (weighted) {
                let weightedDeaths = (data.data[i]['deaths'] / data['millions']).toFixed(2);
                if (weightedDeaths === "NaN") weightedDeaths = '-';
                deaths_html.push('<div class="' + dynamicClass + '"> ' + weightedDeaths.toLocaleString() + ' </div>');
            } else {
                deaths_html.push('<div class="' + dynamicClass + '"> ' + data.data[i]['deaths'].toLocaleString() + ' </div>');
            }
        }
        deaths_html.push('</div>');
        // Render Recovered
        rec_html.push('<div class="country-date">');
        rec_html.push('<div class="country-date-title">' + (weighted ? 'Rec/1M' : 'Rec') + '</div>');
        for (let i = 0; i <= data.data.length - 1; i++) {
            const dynamicClass = i % 2 === 0 ? 'cases rec even' : 'cases rec';
            if (weighted) {
                let weightedRecs = (data.data[i]['recovered'] / data['millions']).toFixed(2);
                if (weightedRecs === "NaN") weightedRecs = '-';
                rec_html.push('<div class="' + dynamicClass + '"> ' + weightedRecs.toLocaleString() + ' </div>');
            } else {
                rec_html.push('<div class="' + dynamicClass + '"> ' + data.data[i]['recovered'].toLocaleString() + ' </div>');
            }
        }
        rec_html.push('</div>');
    }

    // Combine components ::::::::::::::::::::
    // :::::::::::::::::::::::::::::::::::::::
    if (data['name'] === 'US') {
        body.push(date_html.join(''));
        body.push(rec_html.join(''));
        body.push(deaths_html.join(''));
        body.push(percentage_html.join(''));
        body.push(cases_html.join(''));
    } else {
        body.push(cases_html.join(''));
        body.push(percentage_html.join(''));
        body.push(deaths_html.join(''));
        body.push(rec_html.join(''));
        body.push(date_html.join(''));
    }
    body.push('</div>');

    // Image html
    let img_html = '';
    if (typeof id !== "undefined") {
        const img_src = 'img/' + id + '.png';
        img_html = '<img src="' + img_src + '" alt="' + data.name + '">';
    }

    // Days title html
    let days_title_html = '';
    if (data['name'] !== 'US') {
        days_title_html = [
            '<div class="days-total-title" style="color: ' + getDaysColor(data['days']) + '">',
            data['days'],
            '</div>'
        ].join('');
    }

    // Calculate how many times us
    let multiples_html = '<span> - </span>';
    const usPop = dataFixture.population['us'];
    const numMultiples = (data.population / usPop.full).toFixed(2);

    if (data['name'] !== 'US') {
        multiples_html = numMultiples + '<span> times USA</span>';
    }

    let html = [
        '<div class="country-title">',
        '<div class="country-title-text-wrapper">',
        '<h1>' + data.name + '</h1>',
        '<p><span>Population · </span>' + abbreviateNumber(data.population) + '<br>' + multiples_html + '</p>',
        img_html,
        days_title_html,
        '</div>',
        '</div>',
        body.join('')
    ];

    return html.join('');
};

render.summaryRow = function (data, country, isFilter) {
    // console.log('------');
    // console.log(data);
    // console.log(country);
    // console.log(data.id);

    const img_src = 'img/' + data['id'] + '.png';

    let title_html = [
        '<div class="title">',
        '<p>' + country['name'] + '</p>',
        '<img src="' + img_src + '" alt="' + country['name'] + '">',
        '</div>'
    ].join('');

    let cases_html = '';
    if (!isFilter) {
        cases_html = [
            '<div class="cases">',
            '<p>' + (weighted ? 'Cases / 1M' : 'Total Cases') + '</p>',
            '<h1>' + (weighted ? data['weighted'].toLocaleString() : data['latest'].toLocaleString()) + '</h1>',
            '</div>'
        ].join('');
    }

    let days_html = '';
    if (!isFilter) {
        days_html = [
            '<div class="days">',
            '<p>Days Behind USA</p>',
            '<h1 style="color: ' + getDaysColor(country['days']) + '">' + country['days'] + '</h1>',
            '</div>'
        ].join('');
    }

    const render_img_src = data.id === renderId ? 'img/icons/show.svg' : 'img/icons/hide.svg';
    const render_img_class = data.id === renderId ? 'render-details-flag-wrapper' : 'render-details-flag-wrapper hide';
    const render_html = [
        '<div class="' + render_img_class + '">',
        '<img src="' + render_img_src + '" alt="show/hide">',
        '</div>'].join('');

    let dynamicClass = isFilter ? 'filter-el noselect' : 'summary-el noselect';
    let html = [
        '<div class="' + dynamicClass + '" data-id="' + data['id'] + '">',
        render_html,
        title_html,
        cases_html,
        days_html,
        '</div>'
    ];

    return html.join('');
};

render.filters = function () {
    let filter_elements_html = [];
    dataCount.forEach(function (el) {
        if (el.id !== 'us' && dataset[el.id] && dataset[el.id].data) {
            // Create body wrapper div
            filter_elements_html.push(render.summaryRow(el, dataset[el.id], true));
        }
    });
    return [
        '<div class="filter-header">',
        '<p>Select countries to display</p>',
        '</div>',
        filter_elements_html.join(''),
        '<div class="filter-submit"><p id="filter-submit-button">Apply</p></div>'
    ].join('');
};

function getDaysColor(days) {
    let color = '#14C758';
    if (days <= 40) {
        color = '#EB443F';
    } else if (days <= 80) {
        color = '#FA8050';
    } else if (days <= 120) {
        color = '#FBD661';
    }
    return color;
}

function getIncreasePercentageColor(p) {
    let color;
    if (p >= 30) {
        color = 'rgba(235, 68, 63, 0.45)';
    } else if (p >= 20) {
        color = 'rgba(255, 125, 0, 0.4)';
    } else if (p >= 10) {
        color = 'rgba(251, 214, 97, 0.6)';
    } else {
        color = 'rgba(20, 199, 88, 0.4)';
    }
    return color;
}

function abbreviateNumber(value) {
    let newValue = value;
    if (value >= 1000) {
        let suffixes = ["", " K", " M", " B", " T"];
        let suffixNum = Math.floor(("" + value).length / 3);
        if (suffixNum > 2) suffixNum = 2;
        let shortValue = '';
        for (let precision = 4; precision >= 1; precision--) {
            shortValue = parseFloat((suffixNum !== 0 ? (value / Math.pow(1000, suffixNum)) : value).toPrecision(precision));
            let dotLessShortValue = (shortValue + '').replace(/[^a-zA-Z 0-9]+/g, '');
            if (dotLessShortValue.length <= 4) {
                break;
            }
        }
        if (shortValue % 1 !== 0) shortValue = shortValue['toFixed'](2);
        newValue = shortValue + suffixes[suffixNum];
    }
    return newValue;
}
