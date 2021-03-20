(function preventTranslateBody() {
  const $body = document.body;
  $body.classList.add("notranslate");
})();

function detectionSearchPageType() {

  const currentUrl = new URL(window.location.href);
  let searchParams = new URLSearchParams(currentUrl.search.slice(1));
  pageSearchCodeHandler(searchParams);

}

detectionSearchPageType();

function pageSearchCodeHandler(searchParams, limitPages=6) {
  removeDefaultResultsContainer();
  const allResultsElems = [];

  findResultsFromAllPages(searchParams, 0, limitPages, allResultsElemsHandler);

  function removeDefaultResultsContainer() {
    const defaultResultsContainer = document.querySelector('.code-list');
    if( defaultResultsContainer ) defaultResultsContainer.remove();
  }

  function findResultsFromAllPages(searchParams, currNumberPage, limitPages, allResultsElemsHandler) {
    if(currNumberPage > limitPages) return;

    const newNumberPage = currNumberPage+1;

    if( !searchParams.has('p') ) {
      searchParams.set('p', newNumberPage.toString());
    }
    else {
      searchParams.set('p', newNumberPage.toString());
    }

    const requestUrl = `https://github.com/search?${searchParams.toString()}`;

    let stopQueries = false;

    makeRequest(requestUrl, currNumberPage, limitPages);

    function makeRequest(requestUrl, currNumberPage, limitPages) {
      
      if (stopQueries) {
        return;
      }
      
      fetch(requestUrl)
        .then(function(response) {
          if (response.status !== 200) {
            stopQueries = true;
            return;
          }
          return response.text();
        })
        .then(function(html) {
          const parser = new DOMParser();
          const responseDocument = parser.parseFromString(html, "text/html");
          return responseDocument;
        })
        .then(doc => {
          const resultElems = [...doc.getElementsByClassName('code-list-item')];
          resultElems.forEach(resultElem => allResultsElems.push(resultElem));
          if( currNumberPage >= limitPages) allResultsElemsHandler(allResultsElems);
        })
        .catch(function(err) {
          console.error('Failed to fetch page: ', err);
        });
    }

    findResultsFromAllPages(searchParams, newNumberPage, limitPages, allResultsElemsHandler);

  }

  function allResultsElemsHandler(allResultsElems) {

    const allResultsObjs = allResultsElems.map(createResultObject);

    const uniqueResultsObjsByHrefsProjects = getUniqueObjsByField(allResultsObjs, "projectHref");
    const uniqueResultsObjsBySnippetText = getUniqueObjsByField(uniqueResultsObjsByHrefsProjects, "snippetText");
    const uniqueResultsElems = uniqueResultsObjsBySnippetText.map(resultObj => resultObj.$domRef);

    stylizedResults(uniqueResultsElems);

    renderResults(uniqueResultsElems);

    function createResultObject(result) {

      const projectHref = getProjectHref(result);
      const snippetText = getSnippetText(result);
      return {
        $domRef: result,
        projectHref,
        snippetText
      };


      function getProjectHref(resultElem){
        const projectHref = resultElem.querySelector('.flex-shrink-0').src;
        return projectHref;
      }

      function getSnippetText(resultElem){
        const $tbody = resultElem.querySelector('tbody');
        const snippetText = $tbody.innerText;
        return snippetText;
      }
    }

    function stylizedResults(results) {
        results.forEach(result => {
          const table = result.querySelector('table')
          if (table) {
          table.style.border = '1px solid cyan'
          }
        })
    }

    function getUniqueObjsByField(Objs, field) {
      const uniqueFields = [...new Set(Objs.map(Obj => Obj[field]))];
      const uniqueObjs = [];

      Objs.forEach(Obj => {
        const index = uniqueFields.indexOf(Obj[field]);
        if( index > 0 ) {
          uniqueObjs.push(Obj);
          uniqueFields.splice(index, 1);
        }
      });

      return uniqueObjs;
    }

    function renderResults(resultsElems) {
      const newResultsContainer = document.createElement('DIV');
      newResultsContainer.className = 'code-list';

      for (let i = 0; i < resultsElems.length; i++) {
        newResultsContainer.appendChild(resultsElems[i]);
      }

      const code_search_results = document.getElementById("code_search_results");
      code_search_results.appendChild(newResultsContainer);
    }

    function stylizedMatchWords() {
      const matches = document.querySelectorAll('.hx_keyword-hl');
      if (matches.length > 0) {
        for (let i = 0; i < matches.length; i++){
          matches[i].style.color = 'yellow'
        }
      }
    }

    stylizedMatchWords();

  }
}




