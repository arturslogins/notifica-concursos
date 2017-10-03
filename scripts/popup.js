chrome.storage.local.get('syncedTenders', function(synced) {
  synced = synced['syncedTenders'];

  synced.forEach(function(tender) {
    if (tender['visualzed']) {
      $('table tbody')
          .append(
              '<tr><td><a href="' + tender['url'] + '">' + tender['title'] +
              '</a></td><td>' + tender['vacancies'] + '</td><td>' +
              tender['region'] + '</td><td>' +
              Math.floor((Date.now() - tender['additionDate']) / 86400000) +
              '</td></tr>');
    } else {
      $('table tbody')
          .append(
              '<tr class="success"><td><a href="' + tender['url'] + '">' +
              tender['title'] + '</a></td><td>' + tender['vacancies'] +
              '</td><td>' + tender['region'] + '</td><td>' +
              Math.floor((Date.now() - tender['additionDate']) / 86400000) +
              '</td></tr>');
      tender['visualzed'] = true;
    }
  });

  chrome.storage.local.set({'syncedTenders': synced}, function() {
    chrome.storage.local.set({'notVisualizeds': 0}, function() {});
    chrome.browserAction.setIcon(
        {'path': 'images/icons/inactive-notification.png'},
        function callback() {});
    chrome.browserAction.setTitle(
        {'title': 'Notifica Concursos: Não há novos concursos.'});
  });
});
