chrome.storage.local.get('syncedTenders', function(synced) {
  $('body').on('click', 'a', function() {
    chrome.tabs.create({'url': $(this).attr('href'), 'active': false});
    return false;
  });

  synced = synced['syncedTenders'];

  let hidePrefecturesFilter = function() {};
  let careerFilter = function() {};

  let table = $('#tendersTable').DataTable({
    data: synced,
    'order': [3, 'desc'],
    columns: [
      {
        'data': null,
        'title': 'Instituição',
        render: function(data) {
          return '<a href="' + data['url'] + '">' + data['institution'] +
              '</a>';
        }
      },
      {'data': 'vacancies', 'title': 'Vagas'},
      {'data': 'region', 'title': 'Região'}, {
        'data': 'additionDate',
        'title': 'Adicionado em',
        render: function(data, type, row) {
          if (type == 'display' || type == 'filter') {
            return moment(data, 'x').format('DD/MM/YYYY');
          } else {
            return data;
          }
        }
      }
    ],
    'language':
        {'url': 'vendors/DataTables-1.10.16/locale/Portuguese-Brasil.json'},
    'createdRow': function(row, data, dataIndex) {
      if (data['visualized'] == false) {
        $(row).addClass('highlightRow');
        data['visualized'] = true;
      }
    },
    'dom':
        '<"grid-x"<"small-3 cell"><"#selectRegion.small-1 cell"><"#selectCareer.small-4 cell"><"auto cell"f>r>' +
        't' +
        '<"grid-x"<"auto cell"l><"#contact.auto cell"><"small-6 cell"p>>',
    'initComplete': function() {
      insertRegionsSelect(this);
      insertHidePrefectures(this);
      insertCareerSelect(this);
      insertContactLink();
    }
  });

  function insertRegionsSelect(tableOnInit) {
    tableOnInit.api().columns([2]).every(function() {
      let column = this;
      let select =
          $('<select id="selectRegionSelect"><option value=""></option><option value="" hidden> Região</option></select>')
              .appendTo($('#selectRegion'))
              .on('change', function() {
                let val = $.fn.dataTable.util.escapeRegex($(this).val());

                column.search(val ? '^' + val + '$' : '', true, false).draw();

                if (val == '') {
                  select.get(0).selectedIndex = 1;
                }
              });

      column.data().unique().sort().each(function(d, j) {
        select.append('<option value="' + d + '">' + d + '</option>')
      });

      select.get(0).selectedIndex = 1;
    });
  }

  function insertHidePrefectures(tableOnInit) {
    $('<label id="hidePrefecturesLabel">Ocultar prefeituras?</label><div class="switch" id="hidePrefectures"><input class="switch-input" id="hidePrefecturesInput" type="checkbox"><label class="switch-paddle" for="hidePrefecturesInput"></label></div>')
        .appendTo(
            $('#tendersTable_wrapper > div:nth-child(1) > div:nth-child(1)'));
    $('#hidePrefecturesInput').on('change', function() {
      if (this.checked == true) {
        hidePrefecturesFilter = function(settings, data, dataIndex) {
          return data[0].startsWith('Prefeitura') == false;
        };

        $.fn.dataTable.ext.search.push(hidePrefecturesFilter);
      } else {
        $.fn.dataTable.ext.search.splice(
            $.fn.dataTable.ext.search.indexOf(hidePrefecturesFilter), 1);
      }
      table.draw();
    });
  }

  function insertCareerSelect(tableOnInit) {
    let selectCareer =
        $('<select id="selectCareerSelect"><option value=""></option><option value="" hidden> Cargo</option></select>')
            .appendTo($('#selectCareer'))
            .on('change', function() {
              let val = $(this).val();
              $(this).attr('disabled', 'disabled');
              if (val != '') {
                getXhrResponse(val, parseCareer);
              } else {
                if ($.fn.dataTable.ext.search.indexOf(careerFilter) != -1) {
                  $.fn.dataTable.ext.search.splice(
                      $.fn.dataTable.ext.search.indexOf(careerFilter), 1);
                  table.draw();
                }
                $('#selectCareerSelect').removeAttr('disabled');
              }
            });
    getXhrResponse('https://www.pciconcursos.com.br/vagas/', parseCareerList);
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

  function parseCareerList(xhrResponse) {
    let careersData = $('.linkb', xhrResponse).children();
    let selectCareer = $('#selectCareerSelect');

    careersData.each(function(index, careerData) {
      let careerTitle = careerData.firstElementChild.textContent;
      selectCareer.append(
          '<option value="' + careerData.firstElementChild.href + '">' +
          careerTitle.substr(careerTitle.indexOf(' ') + 1) + '</option>');
    });
    sortSelect(selectCareer);
  }

  function sortSelect(selectCareer) {
    selectCareer.html(selectCareer.children().sort(function(x, y) {
      return $(x).text().toUpperCase() < $(y).text().toUpperCase() ? -1 : 1;
    }));

    selectCareer.get(0).selectedIndex = 1;
  }

  function parseCareer(xhrResponse) {
    let tendersData = $('.lista_concursos', xhrResponse).children();
    let tenders = [];
    let region;

    tendersData.each(function(index, tenderData) {
      if (tenderData.className != 'ea' && tenderData.className != 'ua') {
        if (tenderData.firstElementChild != null &&
            tenderData.firstElementChild.className == 'ca') {
          tenderData = tenderData.firstElementChild;

          tenders.push({
            'institution': tenderData.firstElementChild.text,
            'vacancies':
                parseInt(tenderData.getElementsByClassName('cd')[0]
                             .firstChild.textContent.match(/\d+ vaga/)) ||
                -1,
            'region': tenderData.getElementsByClassName('cc')[0].textContent,
          });
        }
      }
    });

    applyCareerFilter(tenders);
  }

  function applyCareerFilter(tenders) {
    if ($.fn.dataTable.ext.search.indexOf(careerFilter) != -1) {
      $.fn.dataTable.ext.search.splice(
          $.fn.dataTable.ext.search.indexOf(careerFilter), 1);
    }

    careerFilter = function(settings, data, dataIndex) {
      for (var i = 0; i < tenders.length; i++) {
        if (tenders[i]['institution'] == data[0] &&
            tenders[i]['vacancies'] == data[1] &&
            tenders[i]['region'] == data[2]) {
          return true;
        }
      }
      return false;
    };

    $.fn.dataTable.ext.search.push(careerFilter);
    table.draw();
    $('#selectCareerSelect').removeAttr('disabled');
  }

  function insertContactLink() {
    $('<a href="maito:contact@mildo.me">contact@mildo.me</a>')
        .appendTo($('#contact'));
  }

  chrome.storage.local.set({'syncedTenders': synced}, function() {
    chrome.storage.local.set({'nonVisualizeds': 0}, function() {});
    chrome.browserAction.setIcon(
        {'path': 'images/icons/inactive-notification.png'},
        function callback() {});
    chrome.browserAction.setTitle(
        {'title': 'Notifica Concursos: Não há novos concursos.'});
  });
});
