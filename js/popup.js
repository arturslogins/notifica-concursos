chrome.storage.local.get('syncedTenders', function(synced) {
  $('body').on('click', 'a', function() {
    chrome.tabs.create({'url': $(this).attr('href'), 'active': false});
    return false;
  });

  synced = synced['syncedTenders'];

  let hidePrefecturesFilter = function() {};

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
    'dom': '<"grid-x"<"auto cell"><"auto cell"><"auto cell"f>r>' +
        't' +
        '<"grid-x"<"auto cell"l><"auto cell"p>>',
    'initComplete': function() {
      insertRegionsSelect(this);
      insertHidePrefectures(this);
    }
  });

  function insertRegionsSelect(tableOnInit) {
    tableOnInit.api().columns([2]).every(function() {
      let column = this;
      let div =
          $('<div id="selectRegion"><label id="selectRegionLabel">Região</label></div>')
              .appendTo($(
                  '#tendersTable_wrapper > div:nth-child(1) > div:nth-child(2)'));
      let select =
          $('<select id="selectRegionSelect"><option value=""></option></select>')
              .appendTo($('#selectRegionLabel'))
              .on('change', function() {
                let val = $.fn.dataTable.util.escapeRegex($(this).val());

                column.search(val ? '^' + val + '$' : '', true, false).draw();
              });
      column.data().unique().sort().each(function(d, j) {
        select.append('<option value="' + d + '">' + d + '</option>')
      });
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

  chrome.storage.local.set({'syncedTenders': synced}, function() {
    chrome.storage.local.set({'nonVisualizeds': 0}, function() {});
    chrome.browserAction.setIcon(
        {'path': 'images/icons/inactive-notification.png'},
        function callback() {});
    chrome.browserAction.setTitle(
        {'title': 'Notifica Concursos: Não há novos concursos.'});
  });
});
