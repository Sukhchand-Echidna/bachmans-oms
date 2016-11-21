angular.module( 'orderCloud' )
	.config( OrderConfirmationConfig )
	.controller( 'OrderConfirmationCtrl', OrderConfirmationController );
function OrderConfirmationConfig( $stateProvider ) {
	$stateProvider
		.state( 'orderConfirmation', {
			parent: 'base',
			url: '/orderConfirmation/:userID/:ID/:editsubmitorder',
			templateUrl: 'orderConfirmation/templates/orderConfirmation.tpl.html',
			data: {
	            loadingMessage: 'Loading...'
	        },
			views: {
				'': {
					templateUrl: 'orderConfirmation/templates/orderConfirmation.tpl.html',
					controller: 'OrderConfirmationCtrl',
					controllerAs: 'orderConfirmation'
				},
				'orderConfirmationtop@orderConfirmation': {
					templateUrl: 'orderConfirmation/templates/orderConfirmation.top.tpl.html'
				}
			},
			resolve: {
				Order: function($rootScope, $q, $state, toastr, $stateParams, CurrentOrder, OrderCloud) {
					var d = $q.defer();
					OrderCloud.Orders.Get($stateParams.ID).then(function(res){
						console.log(res);
						d.resolve(res);
					})
					return d.promise;
				}
			}
		})
}



function OrderConfirmationController($stateParams, OrderCloud, $http, PMCStoresURL, OrderPrintURL, Order) {
	var vm = this;
	vm.order = Order;
	vm.editorderamount = vm.order.xp.oldPrice-vm.order.Total;
	//vm.order.ID = $stateParams.ID;
	vm.editsubmitorder = $stateParams.editsubmitorder;
	OrderCloud.Users.Get($stateParams.userID).then(function(user){
		vm.order.email= user.Email;
		vm.CSRStoreID = user.xp.CSRStoreID;
		vm.SelectStore = vm.CSRStoreID;
		vm.GetPMCStores();
	});
	vm.GetPMCStores = function(){
		$http.get(PMCStoresURL).success(function(res){
			vm.StoresList = res;
			vm.GetPrinters(vm.CSRStoreID);
		}).error(function(err){
			console.log(err);
		});
	};
	vm.GetCSRStore = function(){
		vm.SelectStore = vm.CSRStoreID;
		vm.GetPrinters(vm.CSRStoreID);
	};
	vm.GetPrinters = function(storeName){
		vm.SelectStore = storeName
		vm.SelectPrinter = "Select Printer";
		vm.printers = _.filter(vm.StoresList, function(row){
			return _.indexOf([storeName], row.storeName) > -1;
		});
	};
	vm.Print = function(){
		var params = [];
		OrderCloud.LineItems.List($stateParams.ID).then(function(res){
			angular.forEach(res.Items, function(val, key){
				params.push({"orderId": $stateParams.ID, "lineItem":val.ID});
			});
		});
		$http.post(OrderPrintURL+vm.SelectStore, params).success(function(res){
			console.log("Print sent to printer.."+res);
		});
	};
}