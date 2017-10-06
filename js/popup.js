chrome.storage.local.get('syncedTenders', function(synced) {
  $('body').on('click', 'a', function() {
    chrome.tabs.create({'url': $(this).attr('href'), 'active': false});
    return false;
  });

  synced = synced['syncedTenders'];

  $('#tendersTable').DataTable({
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
        render: function(data) {
          return moment(data, 'x').format('DD/MM/YYYY');
        }
      }
    ],
    'language':
        {'url': 'vendors/DataTables-1.10.16/locale/Portuguese-Brasil.json'},
    'initComplete': function() {
      this.api().columns([2]).every(function() {
        let column = this;
        let div =
            $('<div id="selectRegion"><label id="selectRegionLabel">Região</label></div>')
                .appendTo($('#tendersTable_wrapper > div:nth-child(1)'));
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
