/* Katong Diaries — categories (the legend) and line icons. */
(function () {
  'use strict';
  var KD = (window.KD = window.KD || {});

  var P = KD.ICON_PATHS = {
    // categories
    cup: 'M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z M16 10h2a2 2 0 0 1 0 4h-2 M8 4v2 M11 4v2 M14 4v2',
    eat: 'M7 3v8 M5 3v4a2 2 0 0 0 4 0V3 M7 11v10 M16 3c-2 2-2 6 0 8v10',
    bowl: 'M4 11h16a8 8 0 0 1-16 0z M8 21h8 M9 7c0-1.5 1.5-1.5 1.5-3 M13 7c0-1.5 1.5-1.5 1.5-3',
    cone: 'M7 10a5 5 0 0 1 10 0z M7.5 10l4.5 11 4.5-11',
    glass: 'M5 4h14l-7 8z M12 12v8 M8 20h8',
    fit: 'M3 9v6 M6 7v10 M18 7v10 M21 9v6 M6 12h12',
    sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z M18.5 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z',
    bag: 'M6 8h12l1 12H5z M9 8V6a3 3 0 0 1 6 0v2',
    mall: 'M4 21V8l8-5 8 5v13 M9 21v-6h6v6 M4 12h16',
    star: 'M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-3-5.4 3 1.1-6L3.2 9.4l6.1-.8z',
    temple: 'M3 9l9-5 9 5z M6 10v8 M10 10v8 M14 10v8 M18 10v8 M4 21h16 M4 18h16',
    palm: 'M12 21v-8 M12 13c-5 0-7-3-7-6 3-1 6 0 7 3 1-3 4-4 7-3 0 3-2 6-7 6z',
    camera: 'M4 8h3l2-3h6l2 3h3v11H4z M12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
    bed: 'M3 18v-8 M3 14h18v4 M21 14v-2a3 3 0 0 0-3-3h-7v5',
    train: 'M7 4h10a2 2 0 0 1 2 2v9a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V6a2 2 0 0 1 2-2z M5 11h14 M8.5 15h.01 M15.5 15h.01 M8 18l-2 3 M16 18l2 3',
    basket: 'M4 9h16l-2 10H6z M9 9l3-5 3 5',
    // interface
    search: 'M11 4a7 7 0 1 0 0 14a7 7 0 0 0 0-14z M20 20l-4-4',
    map: 'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z M9 4v14 M15 6v14',
    walk: 'M13 5a1.5 1.5 0 1 0 0-.01 M9 21l2.5-6-2-2.5 1.5-5 3 .5 2 3h3 M11.5 15l3 2 1 4 M10.5 8L7 9.5 6 13',
    eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    hanger: 'M12 7a2 2 0 1 0-2-2 M12 7v2l9 6.5c.8.6.4 1.5-.5 1.5H3.5c-.9 0-1.3-.9-.5-1.5L12 9',
    sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M12 2v2 M12 20v2 M4.9 4.9l1.4 1.4 M17.7 17.7l1.4 1.4 M2 12h2 M20 12h2 M4.9 19.1l1.4-1.4 M17.7 6.3l1.4-1.4',
    moon: 'M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z',
    layers: 'M12 3l9 5-9 5-9-5z M3 13l9 5 9-5 M3 17.5l9 5 9-5',
    plus: 'M12 5v14 M5 12h14', minus: 'M5 12h14',
    home: 'M4 11l8-7 8 7 M6 10v10h12V10 M10 20v-6h4v6',
    compass: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 6l2.5 6L12 18l-2.5-6z',
    bolt: 'M13 2L4 14h7l-1 8 9-12h-7z',
    heart: 'M12 20.5l-7.6-7.4a4.8 4.8 0 0 1 6.8-6.8l.8.8.8-.8a4.8 4.8 0 0 1 6.8 6.8z',
    check: 'M5 12.5l4.5 4.5L19 7.5',
    x: 'M6 6l12 12 M18 6L6 18',
    pin: 'M12 21s7-6.3 7-12a7 7 0 0 0-14 0c0 5.7 7 12 7 12z M12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
    clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 7v5l3 2',
    ext: 'M14 4h6v6 M20 4l-9 9 M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
    route: 'M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M8 17h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7',
    play: 'M7 4l13 8-13 8z',
    chevL: 'M15 5l-7 7 7 7', chevR: 'M9 5l7 7-7 7',
    book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z M4 21a2 2 0 0 1 2-2h13 M8 7h7',
    trash: 'M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13',
    edit: 'M4 20h4L19 9l-4-4L4 16z M13.5 6.5l4 4',
    info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 11v6 M12 7.5h.01'
  };

  /* The legend: every kind of place, its colour and icon. Order = display order. */
  KD.CATS = [
    { id: 'cafe', name: 'Cafés & brunch', color: '#a5633a', icon: 'cup' },
    { id: 'dessert', name: 'Bakeries & sweets', color: '#e2679a', icon: 'cone' },
    { id: 'eat', name: 'Restaurants', color: '#e0552d', icon: 'eat' },
    { id: 'hawker', name: 'Hawker & local eats', color: '#ee8a00', icon: 'bowl' },
    { id: 'bar', name: 'Bars', color: '#7a4ab5', icon: 'glass' },
    { id: 'fit', name: 'Pilates & fitness', color: '#1a9c88', icon: 'fit' },
    { id: 'beauty', name: 'Beauty & wellness', color: '#c04bb0', icon: 'sparkle' },
    { id: 'shop', name: 'Shops', color: '#2d6de0', icon: 'bag' },
    { id: 'mall', name: 'Malls', color: '#31508a', icon: 'mall' },
    { id: 'do', name: 'Things to do', color: '#cf9700', icon: 'star' },
    { id: 'heritage', name: 'Heritage & culture', color: '#b23647', icon: 'temple' },
    { id: 'photo', name: 'Photo spots', color: '#0a9fc0', icon: 'camera' },
    { id: 'park', name: 'Parks & beach', color: '#3b9a49', icon: 'palm' },
    { id: 'stay', name: 'Stays', color: '#6f7d92', icon: 'bed' },
    { id: 'mrt', name: 'MRT stations', color: '#454c58', icon: 'train' },
    { id: 'ess', name: 'Everyday essentials', color: '#8a8f93', icon: 'basket' }
  ];
  KD.CAT = {}; KD.CATS.forEach(function (c, i) { c.i = i; KD.CAT[c.id] = c; });

  KD.icon = function (name, cls) { return '<svg class="i' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24"><use href="#i-' + name + '"/></svg>'; };
  KD.badge = function (cat) { var c = KD.CAT[cat] || KD.CAT.shop; return '<span class="badge" style="--c:' + c.color + '">' + KD.icon(c.icon) + '</span>'; };

  KD.installIcons = function () {
    var defs = document.getElementById('iconDefs'); if (!defs) return;
    var s = '';
    for (var k in P) s += '<symbol id="i-' + k + '" viewBox="0 0 24 24"><path d="' + P[k] + '"/></symbol>';
    defs.innerHTML = s;
  };
})();
