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
  let parsedCount = 0;

  function parseResponse(xhrResponse) {
    let tendersData = $('#concursos', xhrResponse).children();
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
              '-',
          'region': region,
          'url': tenderData.firstElementChild.href,
          'additionDate': Date.now()
        };
        tenders.push(tender);
      }
    });

    ++parsedCount;
    if (parsedCount == URLS.length) {
      storageTenders(tenders);
    }
  }

  function getXhrResponse(url, callback) {
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4 && xhr.status === 200) {
        callback(xhr.response);
      }
    };
    xhr.open('GET', url, true);
    xhr.send();
  }

  function removeOutdated(syncedTenders) {
    for (let i = syncedTenders.length - 1; i >= 0; --i) {
      let flagOutdated = true;
      for (let j = 0; j < tenders.length; ++j) {
        if (tenders[j].institution == syncedTenders[i].institution &&
            tenders[j].vacancies == syncedTenders[i].vacancies &&
            tenders[j].region == syncedTenders[i].region) {
          flagOutdated = false;
          break;
        }
      }

      if (flagOutdated == true) {
        syncedTenders.splice(i, 1);
      }
    }
  }

  function removeDuplicates(syncedTenders) {
    for (let i = tenders.length - 1; i >= 0; --i) {
      let flagDuplicate = false;
      for (let j = 0; j < syncedTenders.length; ++j) {
        if (tenders[i].institution == syncedTenders[j].institution &&
            tenders[i].vacancies == syncedTenders[j].vacancies &&
            tenders[i].region == syncedTenders[j].region) {
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

    chrome.storage.local.get('nonVisualizeds', function(nonVisualizeds) {
      nonVisualizeds = nonVisualizeds['nonVisualizeds'];

      chrome.browserAction.setTitle({
        'title': 'Notifica Concursos: Há ' + (nonVisualizeds + tenders.length) +
            ' novos concursos!'
      });
    });
  }

  function storageTenders(tenders) {
    chrome.storage.local.get('syncedTenders', function(syncedTenders) {
      syncedTenders = syncedTenders['syncedTenders'];

      removeOutdated(syncedTenders);
      removeDuplicates(syncedTenders);

      if (tenders.length > 0) {
        showNotification();

        tenders.forEach(function(tender) {
          tender['visualized'] = false;
          syncedTenders.push(tender);
        });

        updateBrowserAction();

        chrome.storage.local.set({'syncedTenders': syncedTenders}, function() {
          chrome.storage.local.get('nonVisualizeds', function(nonVisualizeds) {
            nonVisualizeds = nonVisualizeds['nonVisualizeds'];

            chrome.storage.local.set(
                {'nonVisualizeds': nonVisualizeds + tenders.length},
                function() {});
          });
        });
      }
    });
  }

  if (alarm.name == 'check-tenders') {
    URLS.forEach(function(url) {
      getXhrResponse(url, parseResponse);
    });
  }
});

chrome.runtime.onInstalled.addListener(function(details) {
  chrome.storage.local.get('syncedTenders', function(syncedTenders) {
    syncedTenders = syncedTenders['syncedTenders'];
    if (syncedTenders == undefined) {
      chrome.storage.local.set({'syncedTenders': []}, function() {
        chrome.storage.local.set({'nonVisualizeds': 0}, function() {
          chrome.alarms.create(
              'check-tenders', {'when': Date.now(), 'periodInMinutes': 60});
        });
      });
    } else {
      chrome.alarms.create(
          'check-tenders', {'when': Date.now(), 'periodInMinutes': 60});
    }
  });
});
