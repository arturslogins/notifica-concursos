chrome.alarms.onAlarm.addListener(function(alarm) {
  const URLS = [
    'https://www.pciconcursos.com.br/concursos/nacional/',
    'https://www.pciconcursos.com.br/concursos/sudeste/',
    'https://www.pciconcursos.com.br/concursos/sul/',
    'https://www.pciconcursos.com.br/concursos/centrooeste/',
    'https://www.pciconcursos.com.br/concursos/norte/',
    'https://www.pciconcursos.com.br/concursos/nordeste/',
  ];

  let tenders = [];
  let xhrCount = 0;

  function parseData(data) {
    let tendersData = $('#concursos', data).children();
    let region;

    tendersData.each(function(index, tenderData) {
      if (tenderData.className == 'ua') {
        region = tenderData.id;
      } else if (
          tenderData.className != 'ea' &&
          tenderData.firstElementChild != null &&
          tenderData.firstElementChild.className == 'ca') {
        tenderData = tenderData.firstElementChild;
        let tender = {
          'institution': tenderData.firstElementChild.text,
          'vacancies':
              parseInt(tenderData.getElementsByClassName('cd')[0]
                           .firstChild.textContent.match(/\d+ vaga/)) ||
              -1,
          'region': region,
          'url': tenderData.firstElementChild.href,
          'additionDate': Date.now()
        };
        tenders.push(tender);
      }
    });
  }

  function getData(url) {
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4 && xhr.status === 200) {
        parseData(xhr.response);

        ++xhrCount;
        if (xhrCount == URLS.length) {
          storageTenders(tenders);
        }
      }
    };
    xhr.open('GET', url, true);
    xhr.send();
  }

  function removeOutdated(synced) {
    for (let i = synced.length - 1; i >= 0; --i) {
      let flagOutdated = true;
      for (let j = 0; j < tenders.length; ++j) {
        if (tenders[j].institution == synced[i].institution &&
            tenders[j].vacancies == synced[i].vacancies &&
            tenders[j].region == synced[i].region) {
          flagOutdated = false;
          break;
        }
      }

      if (flagOutdated == true) {
        synced.splice(i, 1);
      }
    }
  }

  function removeDuplicates(synced) {
    for (let i = tenders.length - 1; i >= 0; --i) {
      let flagDuplicate = false;
      for (let j = 0; j < synced.length; ++j) {
        if (tenders[i].institution == synced[j].institution &&
            tenders[i].vacancies == synced[j].vacancies &&
            tenders[i].region == synced[j].region) {
          flagDuplicate = true;
          break;
        }
      }

      if (flagDuplicate == true) {
        tenders.splice(i, 1);
      }
    }
  }

  function showNotification() {
    chrome.notifications.create(
        {
          'type': 'list',
          'iconUrl': 'images/icons/active-notification.png',
          'title': tenders.length + ' novos concursos foram encontrados!',
          'message': tenders.length + ' novos concursos foram encontrados!',
          'items': tenders.map(function callback(tender, index, tenders) {
            return {'title': tender['institution'], 'message': ''};
          })
        },
        function callback() {});
  }

  function updateBrowserAction() {
    chrome.browserAction.setIcon(
        {'path': 'images/icons/active-notification.png'},
        function callback() {});

    chrome.storage.local.get('notVisualizeds', function(syncedValue) {
      syncedValue = syncedValue['notVisualizeds'];

      chrome.browserAction.setTitle({
        'title': 'Notifica Concursos: Há ' + (syncedValue + tenders.length) +
            ' novos concursos!'
      });
    });
  }

  function storageTenders(tenders) {
    chrome.storage.local.get('syncedTenders', function(synced) {
      synced = synced['syncedTenders'];

      removeOutdated(synced);
      removeDuplicates(synced);

      if (tenders.length > 0) {
        showNotification();

        tenders.forEach(function(tender) {
          tender['visualized'] = false;
          synced.push(tender);
        });

        updateBrowserAction();

        chrome.storage.local.set({'syncedTenders': synced}, function() {
          chrome.storage.local.get('notVisualizeds', function(syncedValue) {
            syncedValue = syncedValue['notVisualizeds'];

            chrome.storage.local.set(
                {'notVisualizeds': syncedValue + tenders.length},
                function() {});
          });
        });
      }
    });
  }

  if (alarm.name == 'check-tenders') {
    URLS.forEach(function(url) {
      getData(url);
    });
  }
});

chrome.runtime.onInstalled.addListener(function(details) {
  chrome.storage.local.set({'syncedTenders': []}, function() {
    chrome.storage.local.set({'notVisualizeds': 0}, function() {
      chrome.alarms.create(
          'check-tenders', {'when': Date.now(), 'periodInMinutes': 60});
    });
  });
});