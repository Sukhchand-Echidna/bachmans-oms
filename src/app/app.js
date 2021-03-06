angular.module( 'orderCloud', [
        'ngSanitize',
        'ngAnimate',
        'ngMessages',
        'ngTouch',
        'cgBusy',
        'ui.tree',
        'ui.router',
        'ui.bootstrap',
        'orderCloud.sdk',
	    'LocalForageModule',
        'toastr',
        'jcs-autoValidate',
        'ordercloud-infinite-scroll',
        'ordercloud-buyer-select',
        'ordercloud-search',
        'ordercloud-assignment-helpers',
        'ordercloud-paging-helpers',
        'ordercloud-auto-id',
        'ordercloud-credit-card',
        'ordercloud-address-validation',
        'ordercloud-current-order',
        'ordercloud-address',
        'ordercloud-tax',
        'ordercloud-lineitems',
        'ordercloud-geography',
		'ui.bootstrap.typeahead',
        'ui.grid',
        'ui.grid.infiniteScroll',
        'ui.grid.edit',
		'algoliasearch',
		'ui.calendar'
    ])

    .run( SetBuyerID )
    .run( SetCatalogID )
    .config( Routing )
    .config( ErrorHandling )
    .config( Interceptor )
    .controller( 'AppCtrl', AppCtrl )
    .config(DatePickerConfig)
    .constant('urls', {
        constantContactBaseUrl:"https://Four51TRIAL104401.jitterbit.net/Bachmans_Dev/"
    })
;

function SetCatalogID(OrderCloud, catalogid) {
    catalogid ? OrderCloud.CatalogID.Set(catalogid) : OrderCloud.CatalogID.Set(OrderCloud.BuyerID.Get())
}


function DatePickerConfig(uibDatepickerConfig, uibDatepickerPopupConfig){
    uibDatepickerConfig.showWeeks = false;
    uibDatepickerPopupConfig.showButtonBar = false;
}

function SetBuyerID( OrderCloud, buyerid ) {
    OrderCloud.BuyerID.Get() ? angular.noop() : OrderCloud.BuyerID.Set(buyerid);
}

function Routing( $urlRouterProvider, $urlMatcherFactoryProvider, $locationProvider ) {
    $urlMatcherFactoryProvider.strictMode(false);
    $urlRouterProvider.otherwise( '/home' );
    $locationProvider.html5Mode(true);
}

function ErrorHandling( $provide ) {
    $provide.decorator('$exceptionHandler', handler);

    function handler( $delegate, $injector ) {
        return function( ex, cause ) {
            $delegate(ex, cause);
            //$injector.get('toastr').error(ex.data ? (ex.data.error || (ex.data.Errors ? ex.data.Errors[0].Message : ex.data)) : ex.message, 'Error');
        };
    }
}

function AppCtrl($q, $rootScope, $state, $http, appname, LoginService, toastr, $ocMedia ) {
    var vm = this;
    vm.name = appname;
    vm.title = appname;
    vm.showLeftNav = true;
    vm.$state = $state;
    vm.$ocMedia = $ocMedia;
    vm.contentLoading = undefined;

    function cleanLoadingIndicators() {
        if (vm.contentLoading && vm.contentLoading.promise && !vm.contentLoading.promise.$cgBusyFulfilled) vm.contentLoading.resolve(); //resolve leftover loading promises
    }

    $rootScope.$on('$stateChangeStart', function(e, toState) {
        cleanLoadingIndicators();
        var defer = $q.defer();
        defer.wrapperClass = 'indicator-container';
        (toState.data && toState.data.loadingMessage) ? defer.message = toState.data.loadingMessage : defer.message = 'Loading...';
        defer.templateUrl = 'common/loading-indicators/templates/view.loading.tpl.html';
        vm.contentLoading = defer;
    });

    $rootScope.$on('$stateChangeSuccess', function(e, toState) {
        cleanLoadingIndicators();
        if (toState.data && toState.data.componentName) {
            vm.title = toState.data.componentName + ' | ' + appname;
        } else {
            vm.title = appname;
        }

        if(toState.name == 'buildOrder'){
            vm.headerstat = true;
            vm.footerstat = true;
            vm.orderclaimfooterstat = true;
        } else if(toState.name == 'checkout'){
            vm.headerstat = true;
            vm.footerstat = true;
            vm.orderclaimfooterstat = true;
        } else if(toState.name == 'orderClaim'){
            vm.headerstat = false;
            vm.footerstat = true;
            vm.orderclaimfooterstat = false;
        } else if(toState.name == 'orderConfirmation'){
            vm.headerstat = true;
            vm.footerstat = true;
            vm.orderclaimfooterstat = true;
        } else{
            vm.headerstat = false;
			vm.footerstat = false;
            vm.orderclaimfooterstat = true;
        }
    });

    vm.datepickerOptions = {
        showWeeks: false,
        showButtonBar: false
    }

    vm.toggleLeftNav = function() {
        vm.showLeftNav = !vm.showLeftNav;
    };

    vm.logout = function() {
        LoginService.Logout();
    };

    //$rootScope.$on('$stateChangeSuccess', function(e, toState) {
    //
		//if (toState.data && toState.data.componentName) {
		//	vm.title = appname + ' - ' + toState.data.componentName
		//} else {
		//	vm.title = appname;
		//}
    //});

    $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
        cleanLoadingIndicators();
        console.log(error);
    });

    $rootScope.$on('OC:AccessInvalidOrExpired', function() {
        LoginService.RememberMe();
    });
    $rootScope.$on('OC:AccessForbidden', function(){
        //toastr.warning("I'm sorry, it doesn't look like you have permission to access this page.", 'Warning:');
    })
	/*$.ajax({
	    method:"GET",
		dataType:"json",
		contentType: "application/json",
		url:localdeliverytimeurl
		}).success(function(data){
			console.log(data);
			vm.cstTime = new Date(data.datetime);
		}).error(function(data){
			console.log(data);
		})*/
}

function Interceptor( $httpProvider ) {
    $httpProvider.interceptors.push(function($q, $rootScope) {
        return {
            'responseError': function(rejection) {
                if (rejection.config.url.indexOf('ordercloud.io') > -1 && rejection.status == 401) {
                    $rootScope.$broadcast('OC:AccessInvalidOrExpired');
                }
                if (rejection.config.url.indexOf('ordercloud.io') > -1 && rejection.status == 403){
                    $rootScope.$broadcast('OC:AccessForbidden');
                }
                return $q.reject(rejection);
            }
        };
    });
}
