chrome.alarms.onAlarm.addListener(function(alarm) {
  const URLS = [
    'https://www.pciconcursos.com.br/concursos/nacional/',
    'https://www.pciconcursos.com.br/concursos/sudeste/',
    'https://www.pciconcursos.com.br/concursos/sul/',
    'https://www.pciconcursos.com.br/concursos/centrooeste/',
    'https://www.pciconcursos.com.br/concursos/norte/',
    'https://www.pciconcursos.com.br/concursos/nordeste/',
  ];

  var tenders = [];

  function parseData(data) {
    var tendersData = $('#concursos', data).children();
    var region;

    tendersData.each(function(index, tenderData) {
      if (tenderData.className == 'ua') {
        region = tenderData.id;
      } else if (
          tenderData.firstElementChild != null &&
          tenderData.firstElementChild.className == 'ca') {
        tenderData = tenderData.firstElementChild;
        var tender = {
          'title': tenderData.firstElementChild.text,
          'vacancies': parseInt(tenderData.getElementsByClassName('cd')[0]
                                    .firstChild.textContent.match(/\d+ vaga/)),
          'region': region,
          'url': tenderData.firstElementChild.href
        };
        tenders.push(tender);
      }
    });
  }

  function getData(url) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4 && xhr.status === 200) {
        parseData(xhr.response);
      }
    };
    xhr.open('GET', url, true);
    xhr.send();
  }

  if (alarm.name == 'check-tenders') {
    URLS.forEach(function(url) {
      getData(url);
    });
  }
});

chrome.alarms.create(
    'check-tenders', {'when': Date.now(), 'periodInMinutes': 60});
