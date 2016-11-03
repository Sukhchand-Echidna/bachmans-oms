angular.module('orderCloud')
    .factory('Alfresco', Alfresco)
;

function Alfresco($q, $http, urls, alfrescoServiceUrl) {
    var service = {
        GetListOfImages: _getListOfImages,
        Search: _search,
        SearchAlfresco: _searchAlfresco,
        CreateContact: _createContact,
        UpdateContact: _updateContact,
        SetSubscription: _settingSubscriptions
    };

    var uri = {
        "GetProductImages": "/Media/Products",
        "WorkshopsAndEvents": "/Media/WorkshopsAndEvents",
        "GetServices": "/Bachmans Quick Start/Bachmans Editorial/root/services",
        "SearchAlfresco": "/live-search-docs",
        "Search": "/search",
        "US": "updateContact",
        "SS": "updateConstantContactList"
    }

    var alfrescoToken = localStorage.getItem('alfSiteTicket');

    function makeAPICall(method, url, params) {
        var deffer = $q.defer();
        $http({
            method: method,
            url: url,
            data: params
        }).then(function successCallback(response) {
            deffer.resolve(response);
			console.log("response", response);
        }, function errorCallback(response) {
            deffer.reject(response);
        });
        return deffer.promise;
    }

    function _getListOfImages(params) {
        var url = urls.alfrescoSiteFolderUrl + uri[params.GetItems] + "?size=" + params.size +
            "&pos=" + params.pos + "&sortField=" + params.sortField + "&sortAsc=" +
            params.sortAsc + "&alf_ticket=" + alfrescoToken;
        return makeAPICall('GET', url, null);
    };

    function _searchAlfresco(params) {
        var url = alfrescoServiceUrl + uri[params.GetItems] + "?t=" + params.searchTerm +
            "&maxResults=" + params.pageSize + "&startIndex=" + params.page + "&alf_ticket=" + alfrescoToken;
        ;
        return makeAPICall('GET', url, params);
    };

    function _search(params) {
        params = {
            GetItems:params.GetItems,
            facetFields: "cm:creator,cm:content.mimetype",
            //filters: "cm:creator|admin,cm:content.mimetype|image/jpeg",
			filters: "cm:content.mimetype|image/jpeg",
            term: params.searchTerm,
            tag: "",
            startIndex: 0,
            sort: "",
            site: "",
            //rootNode: "workspace://SpacesStore/8da76ddf-f808-4390-aa3e-1f2c39fc8d90",
            rootNode: params.rootNode,
            repo: "",
            query: "",
            pageSize: 100,
            maxResults: 0,
            spellcheck: true,
            repo:true
        }
		var alfrescoToken = localStorage.getItem("alfrescoTicket");
        var url = alfrescoServiceUrl + uri[params.GetItems] + "?facetFields=" + params.facetFields +
            "&filters=" + params.filters + "&term=" + params.term + "&tag=" + params.tag +
            "&startIndex=" + params.startIndex + "&sort=" + params.sort +
            "&site=" + params.site + "&rootNode=" + params.rootNode + "&repo=" + params.repo +
            "&query=" + params.query + "&pageSize=" + params.pageSize + "&maxResults=" + params.maxResults +
            "&spellcheck=" + params.spellcheck + "&alf_ticket=" + alfrescoToken;

        return makeAPICall('GET', url, params);
    }

    function _createContact(params) {
        return makeAPICall('POST', uri.CS, params);
    };

    function _updateContact(params) {
        return makeAPICall('PUT', uri.US, params);
    };

    function _settingSubscriptions(params) {
        return makeAPICall('PUT', uri.SS, params);
    };

    return service;
}
