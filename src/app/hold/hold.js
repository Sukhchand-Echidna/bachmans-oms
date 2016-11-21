angular.module( 'orderCloud' )

	.config( HoldConfig )
	.controller( 'HoldCtrl', HoldController );

function HoldConfig( $stateProvider ) {
	$stateProvider
		.state( 'hold', {
			parent: 'base',
			url: '/hold/:ID/:OrderID/:LineItemID',
			templateUrl: 'hold/templates/hold.tpl.html',
			controller: 'HoldCtrl',
			controllerAs: 'hold',
			resolve:{
				Order: function(OrderCloud, $q, $stateParams, LineItemHelpers){
					var dd=$q.defer();
					var arr=[];
					console.log($stateParams);
					OrderCloud.LineItems.Get($stateParams.OrderID,$stateParams.LineItemID).then(function(data){
						console.log(data);
						arr.push(data);
						LineItemHelpers.GetProductInfo(arr).then(function(data1){
							dd.resolve(data);
							console.log("vvvvvvvvvvv",data);
						})
					})
					/*OrderCloud.Orders.ListOutgoing(null, null, $stateParams.orderID).then(function(res){
						console.log(res);
						OrderCloud.LineItems.List(res.Items[0].ID, null, null, null, null, null, {"xp.Status":'OnHold'}).then(function(data){
							console.log(data);
							LineItemHelpers.GetProductInfo(data.Items).then(function(data1){
								dd.resolve(data);
							})
							//dd.resolve(data);
						})
					})*/
					return dd.promise;
				},
				WiredProduct: function(OrderCloud, $q){
					var dd=$q.defer();
					OrderCloud.Products.List(null, null, null, null, null, {"xp.WireService": true}).then(function(res){
						console.log(res);
						/*OrderCloud.LineItems.List(res.Items[0].ID, null, null, null, null, null, {"xp.Status":'OnHold'}).then(function(data){
							console.log(data);
							LineItemHelpers.GetProductInfo(data.Items).then(function(data1){
								dd.resolve(data);
							})
							//dd.resolve(data);
						})*/
						dd.resolve(res);
						console.log("WiredProductWiredProduct", res);
					})
					return dd.promise;
				}
			}
		})
}


function HoldController($scope, $state, $stateParams, $http, $cookieStore, Order, WiredProduct, OrderCloud, LineItemHelpers, Underscore, buyerid, Teleflora, FTD) {
	var vm = this;
	vm.onholdlineitems=[];
	vm.hideEdit=false;
	vm.dataDisplay={};
	vm.dataDisplay["shipId"]=$stateParams.ID;
	vm.disableRelease=true;
	if($scope.$parent.base.search){
		$scope.$parent.base.search.query = ' ';
	}
	$scope.$parent.base.selectChange('customer');
	vm.onholdlineitems.push(Order);
	vm.florist=function(florist){
		console.log(florist);
		if(florist=="Teleflora"){
			//alert("Teleflora");
			vm.wireservice=florist;
			OrderCloud.Buyers.Get('Bachmans').then(function(res){
				console.log(res);
				vm.floristdata=res.xp.Floristdetails;
			})
		}
		else{
			//alert("Select Wired Service Method");
			vm.floristdata=[];
		}
	}
	if(vm.onholdlineitems[0].xp.OnHold){
		if(vm.onholdlineitems[0].xp.OnHold!="" && vm.onholdlineitems[0].xp.OnHold.lineitem){
			vm.onholdlineitems1=[vm.onholdlineitems[0].xp.OnHold.lineitem];
			vm.deliveryinfo=vm.onholdlineitems1;
			vm.deliveryinfo=[vm.onholdlineitems[0].xp.OnHold.lineitem];
			vm.deliveryinfo[0].xp.DeliveryDate=new Date(vm.deliveryinfo[0].xp.DeliveryDate);
		}
		if(vm.onholdlineitems[0].xp.OnHold!="" && vm.onholdlineitems[0].xp.OnHold.selectedflorist){
			vm.selectedflorist=vm.onholdlineitems[0].xp.OnHold.selectedflorist;
		}
		if(vm.onholdlineitems[0].xp.OnHold!="" && vm.onholdlineitems[0].xp.OnHold.holdNote){
			vm.holdNote=vm.onholdlineitems[0].xp.OnHold.holdNote;
		}
		if(vm.onholdlineitems[0].xp.OnHold!="" && vm.onholdlineitems[0].xp.OnHold.wired){
			vm.wireserviceopt=vm.onholdlineitems[0].xp.OnHold.wired;
			vm.florist(vm.wireserviceopt);
		}
		if(vm.onholdlineitems[0].xp.OnHold=="") {
			vm.onholdlineitems1=vm.onholdlineitems;
			vm.deliveryinfo=vm.onholdlineitems1;
			vm.deliveryinfo[0].xp.DeliveryDate=new Date(vm.deliveryinfo[0].xp.DeliveryDate);
		}
	}
	else{
		vm.onholdlineitems1=vm.onholdlineitems;
		vm.deliveryinfo=vm.onholdlineitems1;
		vm.deliveryinfo[0].xp.DeliveryDate=new Date(vm.deliveryinfo[0].xp.DeliveryDate);
		console.log("vm.deliveryinfo[0]", vm.deliveryinfo[0].xp.DeliveryDate);
		vm.wireserviceopt=null;
	}
	
	vm.wiredproducts=WiredProduct.Items;
	console.log("WiredProduct", vm.wiredproducts);
	console.log("testttt",vm.deliveryinfo);
	// vm.addItem=function(){
		// vm.selectSKU =! vm.selectSKU;
		// $scope.gridOptions.columnDefs[0].visible=true;
		// $scope.gridApi.core.refresh();
		// console.log("test",$scope.gridOptions);
		// //$scope.gridOptions.gridApi.core.refresh();
	// }
	// vm.removeItem=function(){
		// if(vm.deliveryinfo==null/* || vm.wireserviceopt==null*/){
			// alert("Please select a lineitem or wireservice Option");
		// }
		// else{
			// console.log(vm.deliveryinfo);
			// console.log(vm.onholdlineitems);
			// var prod= Underscore.filter(vm.onholdlineitems,function(item){return item.ID!=vm.deliveryinfo.ID});
			// console.log(prod);
			// vm.onholdlineitems=prod;
		// }
	// }
	var deliveryTime;
	OrderCloud.Orders.Get($stateParams.OrderID).then(function(order){	
		vm.order=order;
		console.log("orders", order);
		vm.dataDisplay["payment"]=order.xp.SpendingAccounts;
		vm.dataDisplay["discount"]=order.PromotionDiscount;
		OrderCloud.Users.Get(order.FromUserID).then(function(user){
			vm.dataDisplay["user"]=user;
			OrderCloud.Addresses.Get(user.xp.ContactAddr).then(function(addr){
				vm.dataDisplay["addr"]=addr;
				console.log("dataDisplay",vm.dataDisplay);
			});
		});
	})
	OrderCloud.Buyers.Get(buyerid).then(function(res){
		vm.dataDisplay["deliveryTime"]=res.xp.DeliveryRuns[0];
		console.log("vm.dataDisplay deliveryTime", vm.dataDisplay["deliveryTime"]);
		//vm.floristdata=res.xp.Floristdetails;
	})

	/*OrderCloud.Orders.ListOutgoing(null, null, $stateParams.orderID, null, null, 'ID').then(function(res){
		console.log(res);
		OrderCloud.LineItems.List(res.Items[0].ID, null, null, null, null, null, {"xp.Status":'OnHold'}).then(function(data){
			console.log(data);
			LineItemHelpers.GetProductInfo(data.Items).then(function(data1){
				console.log('1234567890',data);
				$scope.gridOptions.data=data.Items;
			})
			//dd.resolve(data);
		})
	})*/
	vm.selectFlorist=function(){
		//alert("hi");
		if(vm.floristdata){
			vm.selectFloristshow =! vm.selectFloristshow;
		}
	}
	// $scope.gridOptions = {
		// data: 'hold.onholdlineitems1',
		// enableSorting: true,
		// enableCellEditOnFocus: true,
		// columnDefs: [
			// { name: 'ProductID', displayName:'SKU Code', enableCellEdit:true,width:"12%"},
			// { name: 'Product.Name', displayName:'Product Name',width:"17.5%"},
			// { name: 'BillingAddress', displayName:'SKU Option',width:"12%"},
			// { name: 'Price', displayName:'List Price',cellTemplate: '<div class="data_cell">{{row.entity.LineTotal|currency}}</div>',width:"12%"},
			// { name: 'Quantity', displayName:'Qty.',width:"6%"},
			// { name: 'xp.TotalCost', displayName:'Invoice Price',width:"12%"},
			// { name: 'ShippingCost', displayName:'Item Discount',width:"12%"},
			// { name: 'Product.Description', displayName:'Additional Item Information',width:"17.2%"}
		// ]
	// };
	 // $scope.gridOptions.onRegisterApi = function(gridApi){
	 	// console.log(gridApi);
          // //set gridApi on scope
          // $scope.gridApi = gridApi;
          // gridApi.edit.on.afterCellEdit($scope,function(rowEntity, colDef, newValue, oldValue){
            // //$scope.msg.lastCellEdited = 'edited row id:' + rowEntity.id + ' Column:' + colDef.name + ' newValue:' + newValue + ' oldValue:' + oldValue ;
            // //alert('Column: ' + colDef.name + ' ID: ' + rowEntity.id + ' Name: ' + rowEntity.name + ' Age: ' + rowEntity.age)
            // $scope.$apply();
          // });
        // };
	// $scope.gridskuopt = {
		// data: 'hold.wiredproducts.Items',
		// enableSorting: true,
		// enableRowSelection:true,
		// columnDefs: [
			// { name: 'checkbox', displayName:'', cellTemplate: '<div class="data_cell"><input type="radio" name="dummyprod" ng-click="grid.appScope.dummyprod(row.entity)" /></div>', width:"10%"},
			// { name: 'ID', displayName:'SKU Code',enableCellEdit:true},
			// { name: 'Name', displayName:'Product Name',enableCellEdit:true},
			// { name: 'LineTotal', displayName:'List Price',enableCellEdit:true}
		// ]
	// };
	/*$scope.gridskuopt.onRegisterApi = function(gridApi){
	 	console.log("gridskuopt",gridApi);
          //set gridApi on scope
          $scope.gridApi = gridApi;
          gridApi.edit.on.afterCellEdit($scope,function(rowEntity, colDef, newValue, oldValue){
            //$scope.msg.lastCellEdited = 'edited row id:' + rowEntity.id + ' Column:' + colDef.name + ' newValue:' + newValue + ' oldValue:' + oldValue ;
            alert('Column: ' + colDef.name + ' ID: ' + rowEntity.id + ' Name: ' + rowEntity.name + ' Age: ' + rowEntity.age)
            $scope.$apply();
          });
        };*/
        console.log("floristdata",vm.floristdata);
	$scope.gridfloristopt = {
		data: 'hold.floristdata',
		enableSorting: true,
		columnDefs: [
			{ name: 'checkbox', displayName:'Select Florist', cellTemplate: '<div class="data_cell"><input type="radio" name="dummyprod" ng-click="grid.appScope.addflorist(row.entity)" /></div>',width:"14.2%"},
			{ name: 'floristStatus', displayName:'Florist Status',cellTooltip: true,width:"14.2%"},
			{ name: 'floristCode', displayName:'Florist Code', cellTooltip: true,width:"14.2%"},
			{ name: 'floristName', displayName:'Florist Name', cellTooltip: true,width:"14.2%"},
			{ name: 'Address', displayName:'Address', cellTooltip: true,width:"14.2%"},
			{ name: 'zipCode', displayName:'Zip code',cellTooltip: true,width:"14.2%"},
			{ name: 'Notes', displayName:'Notes',cellTooltip: true,width:"14.2%"}
		]
	};

	$scope.addflorist=function(data){
		console.log(data);
		vm.selectedflorist=data;
	}

	$scope.showlineitem=function(lineitem){
		console.log("lineitem", lineitem);
		vm.deliveryinfo=lineitem;
	}

	$scope.dummyprod=function(prod){
		console.log("prod", prod);
		vm.dummyproduct=prod;
	}
	vm.adddummy = function(){
		if(vm.dummyproduct!=null){
			vm.selectSKU =! vm.selectSKU;
			console.log(vm.dummyproduct);
			console.log(vm.onholdlineitems);
			vm.onholdlineitems1.push(vm.dummyproduct);
			console.log("zxczxc",vm.onholdlineitems1);
			//$state.reload();
			$scope.gridApi.core.refresh();
		}
		else{
			//alert("enter");
		}
	}
	vm.saveData=function(product, selectedflorist, holdNote, wired){
		console.log("product", product);
		var onHold={};
		onHold["lineitem"]=product[0];
		onHold["selectedflorist"]=selectedflorist;
		onHold["holdNote"]=holdNote;
		onHold["wired"]=wired;
		console.log("onHold", onHold);
		// var data="xp":{"CapTotalDiscount": CapTotalDiscount}
		OrderCloud.LineItems.Patch($stateParams.OrderID, $stateParams.LineItemID, {"xp":{"OnHold":onHold}}).then(function(data){
			vm.disableRelease=false;
		});
	}
	vm.unhold=function(){
		//alert("unhold");
		// OrderCloud.LineItems.Get($stateParams.orderID,vm.onholdlineitems[0].ID).then(function(res){
			// console.log(res);
			// var oldxp=res.xp;
			// var newxp={"florist":vm.selectedflorist,"wireservice":vm.wireservice};
			// var finalxp=angular.extend({},oldxp,newxp);
			// console.log(finalxp);
			// OrderCloud.LineItems.Patch($stateParams.orderID,res.ID,{"xp":finalxp}).then(function(res1){
				// console.log(res1);
			// })
		// })
		   FTData.RouteParams.orderID = $stateParams.OrderID;
		   FTData.UserToken = $cookieStore.get('OMS.Admintoken');
		   var wiredSer;
		   if(vm.wireserviceopt=="Teleflora"){
				wiredSer=Teleflora;
		   }
		   else wiredSer=FTD;
		   OrderCloud.Shipments.Get($stateParams.ID).then(function(res){
				var line=_.filter(res.Items, function(row){
					return _.indexOf([$stateParams.LineItemID],row.LineItemID) > -1;
				});
				console.log("lineeeeeeee", line);
				res.Items=line;
				delete res.xp;
				FTData.Response.Body = _.extend(res,vm.order);
				FTData.Request.Body = _.extend(res,vm.order);
				$http.post(wiredSer, FTData).success(function(res1){
					console.log("Success"+JSON.stringify(res1));
				}).error(function(err){
					console.log("----->"+err);
				});
		   });
	}
	vm.selectedWired=function(ID){
		vm.selected=ID;
	}
}
var FTData = {
  "Route": "v1/buyers/{buyerID}/shipments",
  "RouteParams": {
    "buyerID": "Bachmans",
    "orderID": ""
  },
  "Verb": "POST",
  "Date": "2016-06-28T20:29:08.5416472Z",
  "LogID": "a38f85f1-7914-491e-b878-c1d40aaa73b0",
  "UserToken": "",
  "Request": {
    "Body": {
    },
    "Headers": "Origin: https://testdevcenter.ordercloud.io\r\nConsoleLog: true\r\nConnection: keep-alive\r\nContent-Length: 279\r\nContent-Type: application/json;charset=UTF-8\r\nAccept: application/json, text/plain, */*\r\nAccept-Encoding: gzip, deflate, br\r\nAccept-Language: en-US,en;q=0.8\r\ntokenClaims(from authorization): usr: 39a0cb4a-6767-4e48-ba55-74dc41b4c292,cid: 4e217d27-48c4-4f3c-aed3-41873af1d216,imp: 1061,usrtype: admin,http://schemas.microsoft.com/ws/2008/06/identity/claims/role: FullAccess,iss: https://testauth.ordercloud.io,aud: https://testapi.ordercloud.io,exp: 1467174523,nbf: 1467145723\r\nHost: testapi.ordercloud.io\r\nReferer: https://testdevcenter.ordercloud.io/console\r\nUser-Agent: Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.106 Safari/537.36\r\n"
  },
  "Response": {
    "Body": {
    },
    "Headers": "Content-Length: 218\r\nAccess-Control-Allow-Origin: *\r\nLocation: https://testapi.ordercloud.io/v1/buyers/12345/1235\r\nContent-Type: application/json; charset=utf-8\r\nX-oc-logid: a38f85f1-7914-491e-b878-c1d40aaa73b0\r\nContent-Length: 218\r\n"
  }
};