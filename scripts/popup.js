chrome.storage.local.get('syncedTenders', function(synced) {
  $('body').on('click', 'a', function() {
    chrome.tabs.create({'url': $(this).attr('href'), 'active': false});
    return false;
  });

  synced = synced['syncedTenders'];

  let tender;
  let tr;

  for (let i = synced.length - 1; i >= 0; --i) {
    tender = synced[i];
    tr = document.createElement('tr');

    if (tender['visualzed']) {
      tr.innerHTML = '<td><a href="' + tender['url'] + '">' + tender['title'] +
          '</a></td><td>' + tender['vacancies'] + '</td><td>' +
          tender['region'] + '</td><td>' +
          Math.floor((Date.now() - tender['additionDate']) / 86400000) +
          '</td>';
    } else {
      tr.innerHTML = '<td><a href="' + tender['url'] + '">' + tender['title'] +
          '</a></td><td>' + tender['vacancies'] + '</td><td>' +
          tender['region'] + '</td><td>' +
          Math.floor((Date.now() - tender['additionDate']) / 86400000) +
          '</td>';
      tr.className = 'success';
      tender['visualzed'] = true;
    }

    document.getElementsByTagName('tbody')[0].appendChild(tr);
  }

  chrome.storage.local.set({'syncedTenders': synced}, function() {
    chrome.storage.local.set({'notVisualizeds': 0}, function() {});
    chrome.browserAction.setIcon(
        {'path': 'images/icons/inactive-notification.png'},
        function callback() {});
    chrome.browserAction.setTitle(
        {'title': 'Notifica Concursos: Não há novos concursos.'});
  });
});
