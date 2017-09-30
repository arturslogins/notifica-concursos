chrome.alarms.onAlarm.addListener(function(alarm) {
  const URLS = [
    'https://www.pciconcursos.com.br/concursos/nacional/',
    'https://www.pciconcursos.com.br/concursos/sudeste/',
    'https://www.pciconcursos.com.br/concursos/sul/',
    'https://www.pciconcursos.com.br/concursos/centrooeste/',
    'https://www.pciconcursos.com.br/concursos/norte/',
    'https://www.pciconcursos.com.br/concursos/nordeste/',
  ];

  function getData(url) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4 && xhr.status === 200) {
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
