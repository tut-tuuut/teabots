$(document).ready(function () {
  var searchResultsTemplate = Handlebars.compile($('#results-template').html().trim());
  var noResultsTemplate = Handlebars.compile($('#no-results-template').html().trim());
  var searchResultActionsDropdown = Handlebars.compile($('#search-result-actions-dropdown-template').html().trim());
  var topUserTemplate = Handlebars.compile($('#top-user-template').html().trim());

  var body = $('body');
  var searchQueryInput = $("input#search-query");
  var searchResults = $(".search-results");
  var footer = $('footer');

  var dropdownMenuDisplayed = false;

  function displayResults(results) {
    if (results.length === 0) {
      searchResults.html(noResultsTemplate());
      return;
    }
    searchResults.html(searchResultsTemplate({ results: results }));
    searchResults.focus();

    $('.search-result-actions').click(function (event) {
      event.stopImmediatePropagation();
      if (dropdownMenuDisplayed === true) {
        removeDropdownMenu();
        return;
      }

      displayDropdownMenu(event);
    });
  }

  searchQueryInput.keypress(function (event) {
    if (event.which !== 13) {
      return;
    }
    event.preventDefault();

    var searchQuery = searchQueryInput.val().trim();
    if (searchQuery.length === 0) {
      return;
    }

    if (typeof HipChat === 'undefined') {
      // simulate
      displayResults([
        {
          id: 1,
          author: highlightSearchTerms(searchQuery, "Olivier Servieres"),
          room: "Dev",
          message: "MERDEUH",
          date: "20 Dec, 14:53"
        },
        {
          id: 2,
          author: highlightSearchTerms(searchQuery, "Guillaume Charmetant"),
          room: "Dev",
          message: highlightSearchTerms(searchQuery, "C'est pas le champ à utiliser mais bon… Champ ion"),
          date: "20 Dec, 15:12"
        },
        {
          id: 3,
          author: highlightSearchTerms(searchQuery, "Guillaume Charmetant"),
          room: "Dev",
          message: highlightSearchTerms(searchQuery, "Ça vaut le coup de regarder si c'est pas ce qu'ils ont fait, non ?"),
          date: "19 Dec, 09:03"
        },
        {
          id: 4,
          author: highlightSearchTerms(searchQuery, "Olivier Servieres"),
          room: "Dev",
          message: highlightSearchTerms(searchQuery, "je déploie tearex"),
          date: "19 Dec, 14:53"
        }
      ]);
      return;
    }

    HipChat.auth.withToken(function (err, token) {
      $.ajax({
        type: "POST",
        url: window.teabot.endpoint + "/history/search",
        headers: { 'authorization': 'JWT ' + token },
        data: { query: searchQuery },
        dataType: 'json',
        error: function (jqXHR, status) {
          console.error('fail', status);
        },
        success: function (data) {
          displayResults(data.map(function (result) {
            var message = result['_source'];
            message.id = result['_id'];
            message.author = highlightSearchTerms(searchQuery, message.author);
            message.message = highlightSearchTerms(searchQuery, message.message);
            return message;
          }));
        }
      });
    });
  });

  function highlightSearchTerms(query, message) {
    var enhancedMessage = message;
    var searchTerms = query.split(' ');
    searchTerms.forEach(function (term) {
      var re = new RegExp(term, "ig");
      var termResults = re.exec(enhancedMessage);
      if (termResults && termResults.length > 0) {
        enhancedMessage = enhancedMessage.replace(re, '<mark>' + termResults.pop() + '</mark>');
      }
    });
    return enhancedMessage;
  }

  function removeDropdownMenu() {
    $('#search-result-actions-dropdown').remove();
    dropdownMenuDisplayed = false;
  }

  function displayDropdownMenu(event) {
    body.append(searchResultActionsDropdown({
      id: $(event.currentTarget).data('id'),
      right: body.width() - event.currentTarget.offsetLeft - event.currentTarget.clientWidth - 4,
      top: event.currentTarget.offsetTop + 26
    }));
    dropdownMenuDisplayed = true;
  }

  body.click(removeDropdownMenu);

  // display footer
  footer.click(function () {
    window.location.assign(window.teabot.endpoint + '/sidebar-top-chatters');
  });

  function displayTopChatters() {
    HipChat.auth.withToken(function (err, token) {
      $.ajax({
        type: "GET",
        url: window.teabot.endpoint + "/history/topChatters",
        headers: { 'authorization': 'JWT ' + token },
        dataType: 'json',
        error: function (jqXHR, status) {
          console.error('fail', status);
        },
        success: function (topChatters) {
          const topUser = topChatters.shift();
          footer.html(topUserTemplate(topUser));
          window.setTimeout(displayTopChatters(), 60 * 60 * 1000); // every 60 minutes
        }
      });
    });
  }

  displayTopChatters();
});
