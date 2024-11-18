const item_values = {};
const convertedTimes = {};
const options = {
  floating_search: false,
  auto_select_lite_plan: false,
  highlight_auctions: false,
  auto_select_on_sale: false,
  dark_mode: false,
};

chrome.storage.sync.get(
  { floating_search: false, auto_select_lite_plan: false, highlight_auctions: false, auto_select_on_sale: false, dark_mode: false },
  (items) => {
    options.floating_search = items.floating_search;
    options.auto_select_lite_plan = items.auto_select_lite_plan;
    options.highlight_auctions = items.highlight_auctions;
    options.auto_select_on_sale = items.auto_select_on_sale;
    options.dark_mode = items.dark_mode;
    console.log(options);
  }
);



function getYen(price) {
  return parseInt(price.replace(/[^\d]/g, ''));
}

function parseTRY(price) {
  return parseFloat(price.replace(/[^\d.]/g, ''));
}

function calculateYenPrices(yen_price, other_currency_price) {
  const conversionRate = yen_price / other_currency_price;
  return parseFloat(conversionRate.toFixed(2));
}

function convertJSTtoUserTimeZone(timeString) {
  const jstDate = new Date(`${timeString} GMT+0900`);
  const current_time_zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const time_zone_formatted = new Intl.DateTimeFormat('en-GB', {
    timeZone: current_time_zone,
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(jstDate);

  return {
    time_zone_time: time_zone_formatted,
    jpnTime: timeString,
    html: `<p style="color:red;">${time_zone_formatted}</p> (${timeString} JST)`,
  };
}

function timeLeft(currentTime, closingTime) {
  const current = new Date(currentTime);
  const closing = new Date(closingTime);

  let diff = closing - current;
  if (diff <= 0) return "Time's up!";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  diff -= days * (1000 * 60 * 60 * 24);

  const hours = Math.floor(diff / (1000 * 60 * 60));
  diff -= hours * (1000 * 60 * 60);

  const minutes = Math.floor(diff / (1000 * 60));
  diff -= minutes * (1000 * 60);

  const seconds = Math.floor(diff / 1000);

  let result = '';
  if (days) result += `${days} day${days > 1 ? 's' : ''}`;
  if (hours) result += (result ? ', ' : '') + `${hours} hour${hours > 1 ? 's' : ''}`;
  if (minutes) result += (result ? ', ' : '') + `${minutes} minute${minutes > 1 ? 's' : ''}`;
  if (seconds) result += (result ? ', ' : '') + `${seconds} second${seconds > 1 ? 's' : ''}`;

  return result + ' left';
}

if (window.location.pathname.includes('/item/yahoo/auction/')) {
  console.log('yahoo auction page');
  // Description translation ---------------- START ----------------
  const item_description_elements = document.querySelector("#auction_item_description");
  const translate_link = document.querySelector("span.translate-link > a");
  if (item_description_elements && translate_link) {
    console.log('translating description');
    item_description_elements.style = 'height: 80vh; width: 100%;';
    item_description_elements.innerHTML = `<iframe src="${translate_link.href}" style="width: 100%; height: 100%; border: none;"></iframe>`;
    translate_link.remove();
  } else {
    console.log('description not found');
  }

  const auction_photos = document.querySelectorAll('ol.flex-control-nav img');


  // Description translation ---------------- END ----------------
  // Price calculation ---------------- START ----------------
  const price_elements = document.querySelectorAll('dl.current_price');
  const current_price = price_elements[price_elements.length - 1]?.querySelector('div.price:not(.price--attention):not(.side_nav__category)') || null;
  const my_bid_price = price_elements[price_elements.length - 2]?.querySelector('div.price:not(.price--attention):not(.side_nav__category)') || null;
  const buyoutPrice = document.querySelector('div.price.price--attention');
  const normalTaxPrice = document.querySelector('div.price-tax:not(.price-tax--attention)');
  const buyoutTaxPrice = document.querySelector('div.price-tax.price-tax--attention');
  const user_currency_price = document.querySelector('div.price-fx:not(.price-fx--attention)');
  const user_buyout_currency_price = document.querySelector('div.price-fx.price-fx--attention');
  var item_infos = {
    current_price: current_price ? getYen(current_price.innerText) : null,
    my_bid_price: my_bid_price ? getYen(my_bid_price.innerText) : null,
    buyoutPrice: buyoutPrice ? getYen(buyoutPrice.innerText) : null,
    normalTaxPrice: normalTaxPrice ? getYen(normalTaxPrice.innerText) : null,
    buyoutTaxPrice: buyoutTaxPrice ? getYen(buyoutTaxPrice.innerText) : null,
    user_currency_price: user_currency_price ? parseTRY(user_currency_price.innerText) : null,
    user_buyout_currency_price: user_buyout_currency_price ? parseTRY(user_buyout_currency_price.innerText) : null,
  };

  var main_infos = {
    fee_added_current_price: item_infos.current_price ? item_infos.current_price + 300 : null,
    fee_added_my_bid_price: item_infos.my_bid_price ? item_infos.my_bid_price + 300 : null,
    fee_added_buyoutPrice: item_infos.buyoutPrice ? item_infos.buyoutPrice + 300 : null,
    fee_added_normalTaxPrice: item_infos.normalTaxPrice ? item_infos.normalTaxPrice + 300 : null,
    fee_added_buyoutTaxPrice: item_infos.buyoutTaxPrice ? item_infos.buyoutTaxPrice + 300 : null,
    currency_conversion_rate: item_infos.user_currency_price ? calculateYenPrices(item_infos.current_price, item_infos.user_currency_price) : null,
    buyout_currency_conversion_rate: item_infos.user_buyout_currency_price ? calculateYenPrices(item_infos.buyoutPrice, item_infos.user_buyout_currency_price) : null,
  }
  main_infos.new_currency_price = main_infos.currency_conversion_rate ? (main_infos.fee_added_current_price / main_infos.currency_conversion_rate).toFixed(2) : null;
  main_infos.new_buyout_currency_price = main_infos.buyout_currency_conversion_rate ? (main_infos.fee_added_buyoutPrice / main_infos.buyout_currency_conversion_rate).toFixed(2) : null;
  main_infos.new_my_bid_currency_price = main_infos.currency_conversion_rate ? (main_infos.fee_added_my_bid_price / main_infos.currency_conversion_rate).toFixed(2) : null;
  item_values['item_infos'] = item_infos;
  item_values['main_infos'] = main_infos;
  // Price calculation ---------------- END ----------------

  // Time conversion ---------------- START ----------------
  const openTime = document.querySelector('#itemDetail_data > li:nth-child(5) > span');
  const closeTime = document.querySelector('#itemDetail_data > li:nth-child(6) > span');
  const nowTime = document.querySelector('#itemDetail_data > li:nth-child(7) > span');

  if (openTime && closeTime && nowTime) {
    convertedTimes.now = convertJSTtoUserTimeZone(nowTime.textContent);
    convertedTimes.open = convertJSTtoUserTimeZone(openTime.textContent);
    convertedTimes.close = convertJSTtoUserTimeZone(closeTime.textContent);

    openTime.innerHTML = convertedTimes.open.html;
    closeTime.innerHTML = convertedTimes.close.html;
    nowTime.innerHTML = convertedTimes.now.html;

    console.log(convertedTimes);
  }
  // Time conversion ---------------- END ----------------

  // Displaying the calculated info ---------------- START ----------------
  const auctionInfoHtml = document.querySelector('aside.auction_order_info');
  const info_div = document.createElement('div');
  info_div.className = 'info_div';
  info_div.style = 'background-color: white; border-bottom: 1px dotted rgba(0, 0, 0, 0.3); margin-bottom: 10px; padding-bottom: 10px;';

  if (auctionInfoHtml) {
    auctionInfoHtml.insertBefore(info_div, auctionInfoHtml.firstChild);
    info_div.innerHTML = `
    `+
      (item_values.main_infos.fee_added_current_price ? `
      <dt>Current Price</dt>\n
      <dd>
        <div style="font-size:20px;line-height:1.5;color:black;font-weight:bold;display:inline-block;">${item_values.main_infos.fee_added_current_price} Yen</div>
        <div style="font-size:14px;line-height:1.5;color:orange;display:inline-block;font-weight:bold;">(${item_values.main_infos.new_currency_price} TRY)</div>
      </dd>\n
      ` : '') +
      (item_values.main_infos.fee_added_my_bid_price ? `
      <dt>My Bid Price</dt>\n
      <dd>
        <div style="font-size:20px;line-height:1.5;color:black;font-weight:bold;display:inline-block;">${item_values.main_infos.fee_added_my_bid_price} Yen</div>
        <div style="font-size:14px;line-height:1.5;color:orange;display:inline-block;font-weight:bold;">(${item_values.main_infos.new_my_bid_currency_price} TRY)</div>
      </dd>\n
      ` : '') +
      (item_values.main_infos.fee_added_buyoutPrice ? `
      <dt>Buyout Price</dt>\n
      <dd>
        <div style="font-size:20px;line-height:1.5;color:black;font-weight:bold;display:inline-block;">${item_values.main_infos.fee_added_buyoutPrice} Yen</div>
        <div style="font-size:14px;line-height:1.5;color:orange;display:inline-block;font-weight:bold;">(${item_values.main_infos.new_buyout_currency_price} TRY)</div>
      </dd>\n
      ` : '') +
      (item_values.main_infos.fee_added_normalTaxPrice ? `
      <dt>Normal Tax Price</dt>\n
      <dd>
        <div style="font-size:20px;line-height:1.5;color:black;font-weight:bold;display:inline-block;">${item_values.main_infos.fee_added_normalTaxPrice} Yen</div>
        <div style="font-size:14px;line-height:1.5;color:orange;display:inline-block;font-weight:bold;">(${item_values.main_infos.new_currency_price} TRY)</div>
      </dd>\n
      ` : '') +
      (item_values.main_infos.fee_added_buyoutTaxPrice ? `
      <dt>Buyout Tax Price</dt>\n
      <dd>
        <div style="font-size:20px;line-height:1.5;color:black;font-weight:bold;display:inline-block;">${item_values.main_infos.fee_added_buyoutTaxPrice} Yen</div>
        <div style="font-size:14px;line-height:1.5;color:orange;display:inline-block;font-weight:bold;">(${item_values.main_infos.new_buyout_currency_price} TRY)</div>
      </dd>\n
      ` : '') +
      (convertedTimes.close ? `
      <dt>Closing Time</dt>\n
      <dd>
        <div class='info_remaing_time' style="font-size:15px;line-height:1.5;color:red;display:inline-block;">${timeLeft(new Date(), convertedTimes.close.time_zone_time)}</div>
      </dd>\n
      ` : '');
    (auction_photos ?
      info_div.innerHTML += `
      <dt>Photos</dt>\n
      <dd>
        <div class='info_photos' style="font-size:15px;line-height:1.5;color:black;display:inline-block;">${auction_photos.length}</div>
        <button class='info_photos_button' style="font-size:15px;line-height:1.5;color:black;display:inline-block;">Open Photos in new tabs</button>
      </dd>\n
      ` : '');
    document.querySelector('.info_photos_button').addEventListener('click', () => {
      auction_photos.forEach((photo) => {
        window.open(photo.src, '_blank');
      });
    });

    function updateRemainingTime() {
      const remaining = convertedTimes.close ? timeLeft(new Date(), convertedTimes.close.time_zone_time) : 'No closing time';
      document.querySelector('.info_remaing_time').innerText = remaining;
    }

    updateRemainingTime();
    setInterval(updateRemainingTime, 1000);
  }
  // Displaying the calculated info ---------------- END ----------------
  console.log(item_values);
}

if (window.location.pathname.includes('/mercari/search')) {
  console.log('mercari search page');
  var auto_select_on_sale_interval = setInterval(() => {
    if (options.auto_select_on_sale) {
      const page_query = new URLSearchParams(window.location.search);
      if (!page_query.has('status')) {
        console.log('status not found in query params adding status=on_sale');
        page_query.set('status', 'on_sale');
        console.log(page_query.toString());
        window.location.search = page_query.toString();
      } else {
        console.log('status found in query params');
      }
    }
    auto_select_on_sale_interval = clearInterval(auto_select_on_sale_interval);
  }, 500);


}

var floating_search_interval = setInterval(() => {
  if (options.floating_search) {
    const floating_search = document.querySelector("#content_inner > form > div.savedSearchFloating") || document.querySelector("div.savedSearchFloating");
    if (floating_search) {
      console.log('floating search removed');
      floating_search.remove()
    }
  }
  floating_search_interval = clearInterval(floating_search_interval);
}, 500);


var auto_select_lite_plan_interval = setInterval(() => {
  if (options.auto_select_lite_plan) {
    if (window.location.pathname.includes('buynow') || window.location.pathname.includes('bid')) {
      console.log('buynow or bid page');
      var interval = setInterval(() => {
        var btn = document.querySelector("#bidYahoo_plan");
        if (btn) {
          console.log('selecting lite plan');
          btn.value = '99'
          btn.dispatchEvent(new Event('change'));
          clearInterval(interval);
        }
      }, 1000);
    }
  }
  auto_select_lite_plan_interval = clearInterval(auto_select_lite_plan_interval);
}, 500);

function calculate_time_left(current_left_time) {
  let now = new Date();
  let timeMatch = current_left_time.match(/(\d+)\s*(day|hour|min)\(s\)/);
  if (timeMatch) {
    // Parse the number and unit
    let value = parseInt(timeMatch[1]);
    let unit = timeMatch[2];

    // Calculate milliseconds based on the unit
    let milliseconds;
    switch (unit) {
      case "day":
        milliseconds = value * 24 * 60 * 60 * 1000; // Days to milliseconds
        break;
      case "hour":
        milliseconds = value * 60 * 60 * 1000; // Hours to milliseconds
        break;
      case "min":
        milliseconds = value * 60 * 1000; // Minutes to milliseconds
        break;
      default:
        milliseconds = 0;
    }

    // Calculate future time by adding milliseconds to the current time
    let futureTime = new Date(now.getTime() + milliseconds);
    console.log("Future time:", futureTime);

    // Optionally, calculate time left in days, hours, minutes and seconds
    let timeLeftMs = futureTime - now;
    let timeLeftDays = Math.floor(timeLeftMs / (24 * 60 * 60 * 1000));
    let timeLeftHours = Math.floor((timeLeftMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    let timeLeftMinutes = Math.floor((timeLeftMs % (60 * 60 * 1000)) / (60 * 1000));
    let timeLeftSeconds = Math.floor((timeLeftMs % (60 * 1000)) / 1000);
    console.log("Time left:", timeLeftDays, "days", timeLeftHours, "hours", timeLeftMinutes, "minutes", timeLeftSeconds, "seconds");
    let result = '';
    if (timeLeftDays) result += `${timeLeftDays} day${timeLeftDays > 1 ? 's' : ''}`;
    if (timeLeftHours) result += (result ? ', ' : '') + `${timeLeftHours} hour${timeLeftHours > 1 ? 's' : ''}`;
    if (timeLeftMinutes) result += (result ? ', ' : '') + `${timeLeftMinutes} minute${timeLeftMinutes > 1 ? 's' : ''}`;
    if (timeLeftSeconds) result += (result ? ', ' : '') + `${timeLeftSeconds} second${timeLeftSeconds > 1 ? 's' : ''}`;
    return result + ' left';
  }
  return time;
}

var css = `
      .side_nav__list .cat__text {
        color: white;
        background-color: black;
      }
      .side_nav__category {
        color: white;
        background-color: black;
      }
      .side_nav__category__heading {
        color: white;
      }
      .searchTypeSelect__outer {
        color: white;
        background-color: black;
        box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.5);
      }
      .searchTypeSelect__explanation {
        color: white;
        background-color: rgba(0, 0, 0, 0.5) !important;
      }
      .grand-header .nav-area {
        background-color: #121212;
        color: white;
      }
      .grand-header .nav-area .service-nav .nav-block>.list>a {
        color: white !important;
      }
      .navAll__tab {
        color: white !important;
      }
      .side_nav__list .cat_parent span:hover {
        background-color: #121212;
      }
      .side_nav__list .side_nav__list--grandchildren .cat__text {
        color: white;
        background-color: #242424;
      }
      .side_nav__list .side_nav__list--grandchildren .cat__text:hover {
        background-color: #121212;
      }
      .grand-header {
        background-color: #121212;
      }
      .top-items__inner:hover {
        background-color: #242424;
      }
      .saved-search {
        background-color: #121212;
        color: white;
      }
      .search_options, .store_search_options {
        background-color: #121212;
        color: white;
      }
      #searchHeader h1, #store_search_header h1 {
        background-color: #121212;
        color: white;
      }
      .auctionSearchResult .itemCard__itemName a {
        color: white;
      }
      .top-items__price {
        color: white;
      }
      .top-items__price-fx {
        color: white;
      }
      .sub-footer {
        background-color: rgba(0, 0, 0, 0.5);
        color: white;
      }
      .nav-category li a {
        color: white;
      }
      .footer_inner {
        background-color: #121212;
        color: white;
      }
      .side_nav {
        background-color: #121212;
        color: white;
      }
      .auctionSearchResult .auctionSearchResult__statusList .auctionSearchResult__statusItem {
        color: #121212;
      }
      .grand-header .user-area .user-nav>.list a {
        color: white;
      }
      .guide-nav>.list a {
        color: white;
      }
      .status-area .status-nav .button {
        color: white;
      }
      .grand-header .description {
        color: white;
      }
      `;

var dark_mode_interval = setInterval(() => {
  if (options.dark_mode) {
    console.log('dark mode enabled');
    const middle = document.querySelector("#middle")
    const banner = document.querySelector("#js-hidden-on-search")
    const banner2 = document.querySelector("#service_flow")
    const banner3 = document.querySelector("#buyee_guide")
    if (middle) {
      console.log('middle found');
      middle.style = 'background-color: #121212; color: white;';
      var new_css = document.createElement('style');
      new_css.type = 'text/css';
      if (new_css.styleSheet) {
        new_css.styleSheet.cssText = css;
      }
      else {
        new_css.appendChild(document.createTextNode(css));
      }
      document.getElementsByTagName("head")[0].appendChild(new_css);
    }
    if (banner) {
      console.log('banner found');
      banner.remove();
    }
    if (banner2) {
      console.log('banner2 found');
      banner2.remove();
    }
    if (banner3) {
      console.log('banner3 found');
      banner3.remove();
    }
  }
  dark_mode_interval = clearInterval(dark_mode_interval);
}, 500);

if (window.location.pathname.includes('/item/search/')) {
  console.log('search page');
  var interval = setInterval(() => {
    var current_prices_elements = document.querySelectorAll('span.g-price:not(.g-price--attention)');
    var current_currency_elements = document.querySelectorAll('span.g-priceFx:not(.g-priceFx--attention)');
    var buyout_prices_elements = document.querySelectorAll('span.g-price.g-price--attention');
    var buyout_currency_elements = document.querySelectorAll('span.g-priceFx.g-priceFx--attention');

    var time_left_elements = document.querySelectorAll('ul.itemCard__infoList > li.itemCard__infoItem:nth-of-type(1) > span.g-text');
    var card_elements = document.querySelectorAll('div.itemCard__item');

    if (current_prices_elements.length > 0 && current_currency_elements.length > 0) {
      console.log('finding prices');
      var zipped_current_prices = Array.from(current_prices_elements).map((price, index) => {
        return {
          price: price,
          currency: current_currency_elements[index]
        }
      }
      );
      zipped_current_prices.forEach((price) => {
        const new_price = document.createElement('div');
        new_price.className = 'new_price_' + zipped_current_prices.indexOf(price);
        new_price.style = 'padding-bottom: 10px;';
        var yen_price = getYen(price.price.innerText);
        var currency_price = parseTRY(price.currency.innerText);
        var conversion_rate = calculateYenPrices(yen_price, currency_price);
        yen_price += 300;
        var new_currency_price = (yen_price / conversion_rate).toFixed(2);
        // console.log(yen_price, currency_price, conversion_rate, new_currency_price);
        new_price.innerHTML = `
        <span class="g-title">Current Price</span>\n
        <div class="new_price">
        <p style="font-size:18px;line-height:1.5;color:black;font-weight:bold;display:inline-block;">${yen_price} Yen</p> 
        <p style="font-size:14px;line-height:1.5;color:orange;font-weight:bold;display:inline-block;">(${new_currency_price} TRY)</p>
        </div>
        `;
        price.price.parentElement.parentElement.insertAdjacentElement('afterBegin', new_price);
      }
      );
    }

    if (buyout_prices_elements.length > 0 && buyout_currency_elements.length > 0) {
      console.log('finding buyout prices');
      var zipped_buyout_prices = Array.from(buyout_prices_elements).map((price, index) => {
        return {
          price: price,
          currency: buyout_currency_elements[index]
        }
      }
      );
      zipped_buyout_prices.forEach((price) => {
        const new_buyout_price = document.createElement('div');
        new_buyout_price.className = 'new_buyout_price_' + zipped_buyout_prices.indexOf(price);
        new_buyout_price.style = 'padding-bottom: 10px;';
        var yen_price = getYen(price.price.innerText);
        var currency_price = parseTRY(price.currency.innerText);
        var conversion_rate = calculateYenPrices(yen_price, currency_price);
        yen_price += 300;
        var new_currency_price = (yen_price / conversion_rate).toFixed(2);
        new_buyout_price.innerHTML = `
        <span class="g-title">Buyout Price</span>\n
        <div class="new_buyout_price">
        <p style="font-size:18px;line-height:1.5;color:black;font-weight:bold;display:inline-block;">${yen_price} Yen</p>
        <p style="font-size:14px;line-height:1.5;color:orange;font-weight:bold;display:inline-block;">(${new_currency_price} TRY)</p>
        </div>
        `;
        price.price.parentElement.parentElement.insertAdjacentElement('afterBegin', new_buyout_price);
      }
      );
    }

    if (options.highlight_auctions && time_left_elements.length > 0) {
      console.log('finding time left');
      time_left_elements.forEach((time, index) => {
        const current_left_time = time.innerText;
        if (current_left_time.includes('min')) {
          if (parseInt(current_left_time.split(' ')[0]) <= 5) {
            card_elements[index].style = 'border: 1px solid red;background-color: rgba(255, 0, 0, 0.1);';
          } else if (parseInt(current_left_time.split(' ')[0]) <= 10) {
            card_elements[index].style = 'border: 1px solid orange;background-color: rgba(255, 165, 0, 0.1);';
          } else if (parseInt(current_left_time.split(' ')[0]) <= 30) {
            card_elements[index].style = 'border: 1px solid yellow;background-color: rgba(255, 255, 0, 0.1);';
          }
        }
        if (current_left_time.includes('hour')) {
          if (parseInt(current_left_time.split(' ')[0]) <= 1 || parseInt(current_left_time.split(' ')[0]) <= 23) {
            card_elements[index].style = 'border: 1px solid blue;background-color: rgba(0, 0, 255, 0.1);';
          }
        }
        if (current_left_time.includes('day')) {
          if (parseInt(current_left_time.split(' ')[0]) <= 1 || parseInt(current_left_time.split(' ')[0]) <= 6) {
            card_elements[index].style = 'border: 1px solid green;background-color: rgba(0, 128, 0, 0.1);';
          }
        }
        if (current_left_time.includes('Finished')) {
          card_elements[index].style = 'border: 1px solid black;background-color: rgba(0, 0, 0, 0.1);filter: opacity(0.5);';
        }

      }
      );
    }

    if (current_prices_elements.length > 0 && current_currency_elements.length > 0 || buyout_prices_elements.length > 0 && buyout_currency_elements.length > 0) {
      clearInterval(interval);
    }
  }, 500);
}
