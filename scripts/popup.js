chrome.storage.local.get('syncedTenders', function(synced) {
  synced = synced['syncedTenders'];

  synced.forEach(function(tender) {
    $('table tbody')
        .append(
            '<tr><td><a href="' + tender['url'] + '">' + tender['title'] +
            '</a></td><td>' + tender['vacancies'] + '</td><td>' +
            tender['region'] + '</td></tr>');
  });
});
