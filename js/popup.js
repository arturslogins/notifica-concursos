chrome.storage.local.get('syncedTenders', function(synced) {
  synced = synced['syncedTenders'];


  chrome.storage.local.set({'syncedTenders': synced}, function() {
    chrome.storage.local.set({'notVisualizeds': 0}, function() {});
    chrome.browserAction.setIcon(
        {'path': 'images/icons/inactive-notification.png'},
        function callback() {});
    chrome.browserAction.setTitle(
        {'title': 'Notifica Concursos: Não há novos concursos.'});
  });
});
