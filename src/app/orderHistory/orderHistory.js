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
									d.resolve(completedOdr);
								})
							}
					})	
					return d.promise;
				}
			}
		})
}
function OrderHistoryController($scope, $stateParams, Order, OrderCloud, $filter, $q) {
	var vm = this;
	vm.order=Order;
	$scope.$parent.base.list = ' ';
	if($scope.$parent.base.search){
		$scope.$parent.base.search.query = ' ';
	}
	$scope.$parent.base.selectChange('customer');
	if(vm.order.length>0){
		console.log("oredr", vm.order);
		var completedOdr=[];
		vm.completeshipment=[];
		vm.completeshipmentold=[];
		/*angular.forEach(vm.order,function(val){
			OrderCloud.Shipments.List(val.ID).then(function(res){
				console.log(res);
				if(res.Items.length>0){
					angular.forEach(res.Items,function(val1){
						var first = _.first(val1.Items);
						//OrderCloud.As().LineItems.Get(first.OrderID,first.LineItemID);
						OrderCloud.LineItems.Get(val1.Items[0].OrderID,val1.Items[0].LineItemID).then(function(resitem){
							console.log("resitem",resitem);
							orderHistorydetails.DestinationCode=resitem.xp.addressType;
							orderHistorydetails.uname=resitem.ShippingAddress.FirstName+" "+resitem.ShippingAddress.LastName;
							orderHistorydetails.userID=val.FromUserID;
							orderHistorydetails.shipmentID=val1.ID;
							orderHistorydetails.Total=val.Total;
							orderHistorydetails.DateCreated=val.DateCreated;
							orderHistorydetails.Status=val1.xp.Status;
							orderHistorydetails.SearchType='User';
							orderHistorydetails.ID=val.ID;
						})
						console.log(orderHistorydetails);
						vm.completeshipment.push(orderHistorydetails);
					});
				}
			})
		})*/
		var temp = [], TempArr = {"OrderArr1":[], "OrderArr2":[], "ShipmentArr":[]};
		angular.forEach(vm.order, function(val){
			temp.push(OrderCloud.Shipments.List(val.ID));
			TempArr.OrderArr1.push(val);
		}, true);
		$q.all(temp).then(function(result){
			temp = [];
			angular.forEach(result, function(val){
				angular.forEach(val.Items, function(val1, key1){
					angular.forEach(val1.Items, function(val2, key2){
						//if(val2.Items.length > 0){
						temp.push(OrderCloud.LineItems.Get(val2.OrderID,val2.LineItemID));
						TempArr.ShipmentArr.push(val1);
						//TempArr.OrderArr2 = _.union(TempArr.OrderArr2,);
						TempArr.OrderArr2 = (TempArr.OrderArr2).concat(_.where(TempArr.OrderArr1, {ID: val2.OrderID}));
						//}
					})
				}, true);
			}, true);
			$q.all(temp).then(function(result){
				angular.forEach(result, function(val, key){
					var orderHistorydetails={};
					orderHistorydetails.DestinationCode=val.xp.addressType;
					orderHistorydetails.uname=val.ShippingAddress.FirstName+" "+val.ShippingAddress.LastName;
					orderHistorydetails.userID=TempArr.OrderArr2[key].FromUserID;
					orderHistorydetails.Total=TempArr.OrderArr2[key].Total;
					orderHistorydetails.DateCreated=TempArr.OrderArr2[key].DateCreated;
					orderHistorydetails.Status=TempArr.ShipmentArr[key].xp.Status;
					orderHistorydetails.SearchType='User';
					orderHistorydetails.ID = TempArr.OrderArr2[key].ID;
					orderHistorydetails.shipmentID = TempArr.ShipmentArr[key].ID;
					if(TempArr.ShipmentArr[key].xp.deliveryDate==''){
						orderHistorydetails.DeliveryDate = "--";
					}
					else
						orderHistorydetails.DeliveryDate = TempArr.ShipmentArr[key].xp.deliveryDate;
					vm.completeshipmentold.push(orderHistorydetails);
					vm.completeshipment = angular.copy(vm.completeshipmentold);
				}, true);
			});
		});
		$scope.uname=vm.order[0].FromUserFirstName + " " + vm.order[0].FromUserLastName;
		console.log("vm.uname", vm.completeshipment);
		vm.userID=$stateParams.userID;
		vm.searchType='User';
		$scope.dateFormat="dd/MM/yyyy";
		$scope.gridHistory = {
			data: 'orderHistory.completeshipment',
			enableSorting: true,
			columnDefs: [
				{ name: 'shipmentID', displayName:'Shipment Number', cellTemplate: '<div class="data_cell" ui-sref="buildOrder({ID:row.entity.userID,SearchType:row.entity.SearchType,orderID:row.entity.ID,orderDetails:true})">{{row.entity.shipmentID}}</div>', width:"12.5%"},
				{ name: 'DateCreated', displayName:'Order Placed On', cellTemplate: '<div class="data_cell">{{row.entity.DateCreated | date:grid.appScope.dateFormat}}</div>', width:"12.5%"},
				{ name: 'DestinationCode', displayName:'Destination Code', width:"12.5%"},
				{ name: 'uname', displayName:'Recipient Name', cellTemplate: '<div class="data_cell">{{row.entity.uname}}</div>', width:"12.5%"},
				{ name: 'DeliveryDate', displayName:'Delivery Date', cellTemplate: '<div class="data_cell">{{row.entity.DeliveryDate | date:grid.appScope.dateFormat}}</div>', width:"12.5%"},
				{ name: 'Total', displayName:'Total', cellTemplate: '<div class="data_cell">{{row.entity.Total | currency:$}}</div>', width:"12.5%"},
				{ name: 'Status', displayName:'Order Status', width:"12.5%"},
				{ name: 'orderClaim', displayName:'', cellTemplate: '<div class="data_cell"><button ui-sref="orderClaim({userID:row.entity.userID, name:row.entity.uname, orderID:row.entity.ID})">Create Order Claim</button></div>', width:"12.5%"}
			]
		}
	}
	$scope.$watch(angular.bind(this, function () {
        return this.searchText;
    }), function (newVal, oldVal) {
		if (newVal) {
			var temp = [];
			angular.forEach(vm.completeshipmentold, function(shipment){
 				var filterColumns = [shipment.uname];
				filterColumns.push(shipment.Status);
				var filteredData = $filter('filter')(filterColumns, newVal, undefined);
				if(filteredData.length > 0) {
 					temp.push(shipment);
 				}			
 			})
			vm.completeshipment = temp;
		}
 		else{
			vm.completeshipment = vm.completeshipmentold;
 		}
        
    });
}