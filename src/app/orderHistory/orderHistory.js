angular.module( 'orderCloud' )

	.config( OrderHistoryConfig )
	.controller( 'OrderHistoryCtrl', OrderHistoryController );
	
var impersonation = {
	"ClientID": "8836BE8D-710A-4D2D-98BF-EDBE7227E3BB",
	"Claims": ["FullAccess"]
};
function OrderHistoryConfig( $stateProvider ) {
	$stateProvider
		.state( 'orderHistory', {
			parent: 'base',
			url: '/orderHistory/:userID/:orderId',
			templateUrl: 'orderHistory/templates/orderHistory.tpl.html',
			controller: 'OrderHistoryCtrl',
			controllerAs: 'orderHistory',
			resolve:{
				Order:function($q, $stateParams, OrderCloud){
					console.log("dddd", $stateParams);
					var d=$q.defer();
					OrderCloud.Users.GetAccessToken($stateParams.userID, impersonation)
					.then(function(data) {
							var completedOdr=[];
							var completeshipment=[];
							var orderHistorydetails={};
							OrderCloud.Auth.SetImpersonationToken(data['access_token']);
							if($stateParams.orderId!=""){
								console.log("trueeeeeeeeee");
								OrderCloud.As().Me.GetOrder($stateParams.orderId).then(function(res){
									completedOdr.push(res);
									d.resolve(completedOdr);
								})
							}
							else{
								OrderCloud.As().Me.ListOutgoingOrders().then(function(assignOrders){
									completedOdr=_.reject(assignOrders.Items,function(obj){
										return _.indexOf([obj.Status],'Unsubmitted') > -1
									});
									console.log("completedOrders", completedOdr);
									angular.forEach(completedOdr,function(val){
										OrderCloud.Shipments.List(val.ID).then(function(res){
											console.log(res);
											angular.forEach(res.Items,function(val1){
												OrderCloud.As().LineItems.Get(val1.Items[0].OrderID,val1.Items[0].LineItemID).then(function(resitem){
													console.log("resitem",resitem);
													orderHistorydetails.DestinationCode=resitem.xp.addressType;
													orderHistorydetails.FirstName=resitem.ShippingAddress.FirstName;
													orderHistorydetails.LastName=resitem.ShippingAddress.LastName;
												})
												console.log(val1);
												orderHistorydetails.userID=completedOdr.FromUserID;
												orderHistorydetails.shipmentID=val1.ID;
												orderHistorydetails.Total=val.Total;
												orderHistorydetails.DateCreated=val.DateCreated;
												orderHistorydetails.Status=val1.xp.Status;
												completeshipment.push(orderHistorydetails);
											})
										})
									})
									d.resolve(completeshipment);
								})
							}
					})	
					return d.promise;
				}
			}
		})
}
function OrderHistoryController($scope, $stateParams, Order) {
	var vm = this;
	vm.order=Order;
	console.log(vm.order);
	$scope.$parent.base.list = ' ';
	if($scope.$parent.base.search){
		$scope.$parent.base.search.query = ' ';
	}
	$scope.$parent.base.selectChange('customer');
	if(vm.order.length>0){
		console.log("oredr", vm.order);
		$scope.uname=vm.order[0].FromUserFirstName + " " + vm.order[0].FromUserLastName;
		console.log("vm.uname", vm.uname);
		$scope.userID=$stateParams.userID;
		$scope.searchType='User';
		$scope.dateFormat="dd/MM/yyyy";
		$scope.gridHistory = {
			data: 'orderHistory.order',
			enableSorting: true,
			columnDefs: [
				{ name: 'ID', displayName:'Shipment Number', cellTemplate: '<div class="data_cell" ui-sref="buildOrder({ID:grid.appScope.userID,SearchType:grid.appScope.searchType,orderID:row.entity.ID,orderDetails:true})">{{row.entity.shipmentID}}</div>', width:"14.28%"},
				{ name: 'DateCreated', displayName:'Order Placed On', cellTemplate: '<div class="data_cell">{{row.entity.DateCreated | date:grid.appScope.dateFormat}}</div>', width:"14.28%"},
				{ name: 'DestinationCode', displayName:'Destination Code', cellTemplate: '<div class="data_cell">{{row.entity.DestinationCode}}</div>', width:"14.28%"},
				{ name: '', displayName:'Recipient Name', cellTemplate: '<div class="data_cell">{{row.entity.FirstName}} {{row.entity.LastName}}</div>', width:"14.28%"},
				{ name: 'Total', displayName:'Total', cellTemplate: '<div class="data_cell">{{row.entity.Total | currency:$}}</div>', width:"14.28%"},
				{ name: 'Status', displayName:'Order Status', width:"14.28%"},
				{ name: 'orderClaim', displayName:'', cellTemplate: '<div class="data_cell"><button ui-sref="orderClaim({userID:grid.appScope.userID, name:grid.appScope.uname, orderID:row.entity.ID})">Create Order Claim</button></div>', width:"14.28%"}
		]
	}
	}
}