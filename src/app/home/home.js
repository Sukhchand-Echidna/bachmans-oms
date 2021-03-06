angular.module( 'orderCloud' )

	.config( HomeConfig )
	.controller( 'HomeCtrl', HomeController )
	.controller('eventCalenderModalCtrl',eventCalenderModalController);

function HomeConfig( $stateProvider ) {
	$stateProvider
		.state( 'home', {
			parent: 'base',
			url: '/home',
			templateUrl: 'home/templates/home.tpl.html',
			data: {
				loadingMessage: 'Loading...'
			},
			params: { 
               event: null
            },
			controller: 'HomeCtrl',
			controllerAs: 'home',
			resolve: {
				PromotionsList:function(OrderCloud, $q, Underscore){
					return OrderCloud.Promotions.List(null,1, 100, null, null, {"xp.Active":true}).then(function(promo){
					var totalCount = promo.Meta.TotalCount;
						var result=_.sortBy(promo.Items, function(data){ return data.xp.DateCreated; });
						return [result.reverse(), totalCount];
					});
				},
				RemoveImpersonatedUser: function(OrderCloud){
					return OrderCloud.Auth.RemoveImpersonationToken();
				}
            }
		});
}

function HomeController($sce, $rootScope, $state, $compile, $uibModal,$log, $stateParams, Underscore, $scope, OrderCloud,$q, $http, PromotionsList,$filter, ShippingRateURL, $cookieStore) {
	var vm = this;
	vm.showcalendarModal = false;
	vm.showpromotionsmodal = false;
	$scope.$parent.base.list = ' ';
	if($scope.$parent.base.search){
		$scope.$parent.base.search.query = ' ';
	}
	$scope.$parent.base.selectChange('customer');
	//$scope.events=[];
    //$scope.events = EventList.events;
	vm.promoList=[];
	vm.promotionsList=PromotionsList;
	angular.copy(vm.promotionsList, vm.promoList);
	//console.log("dataaaaaaaaaa", $scope.events);
	var log = [];
	$scope.dateFormat="MM/dd/yyyy";
	//holdorders = ShipmentList.Items;
	/*
	console.log('LineItemList', LineItemList);*/
	/*angular.forEach(holdorders, function(value, key) {
	  this.push(key + ': ' + value);
	  console.log(ShipmentList);
	}, log);*/
	/*angular.forEach(Underscore.where(LineItems.Get, { ParentID: null}), function(node) {
        tree.push(_getnode(node));
    });*/
    $scope.deleteOrder = function(row){
		OrderCloud.Orders.Delete(row.entity.ID).then(function(data){
			$state.reload();
		});
	};
	/*angular.forEach(Underscore.where(ShipmentList.Items, 'Mallik_ship'), function() {
        console.log(this);
    });
    angular.forEach(ShipmentList.Items, function(lineitem, index) {
        console.log(lineitem);
    });*/
	var onholdorders = [];
	OrderCloud.Shipments.List(null, null, 1, 50, null, null, {"xp.Status":"OnHold"}).then(function(res){
		angular.forEach(res.Items, function(res, key){
			angular.forEach(res.Items, function(res1, key1){
				OrderCloud.Orders.Get(res1.OrderID).then(function(res2){
					console.log(res2);
					OrderCloud.LineItems.Get(res1.OrderID,res1.LineItemID).then(function(res3){
						if(!res3.xp)
							res3.xp = {};
						if(!res2.xp)
							res2.xp = {};
						if(res3.ShippingAddress==null){
							res3.ShippingAddress={};
							res3.ShippingAddress.FirstName='';
							res3.ShippingAddress.LastName='';
						}
						if(res3.xp.Destination==null)
							res3.xp.Destination='';
						var dummy="Outgoing";
						if(res2.Comments=="TFEIncomingOrder" || res2.Comments=="FTDIncomingOrder")
							dummy = "Incoming"
						onholdorders.push({"ID":res.ID,"DeliveryDate":res3.xp.DeliveryDate,"FromUserID":res2.FromUserID,"RecipientName":res3.ShippingAddress.FirstName+" "+res3.ShippingAddress.LastName,"OrderID":res1.OrderID,"LineItemID":res1.LineItemID,"DatePlaced":res2.DateSubmitted,"FromUserFirstName":res2.FromUserFirstName,"Destination":res3.xp.addressType,"WireStatusCode":res2.xp.TransactionId,"TypeOfHold":dummy,"CSRID":res2.xp.CSRID});
					})
				})
				//onholdorders.push(OrderCloud.Orders.Get(res1.OrderID));
			},true);
		},true);
		vm.onHold = onholdorders;
		console.log(vm.onHold);
	});
	
	$scope.gridOptions = {
	  data: 'home.onHold',
	  enableSorting: true,
	  columnDefs: [
		{ name: 'LineItemID', displayName:'Line Item',width:"9.09%"},
	   { name: 'ID', displayName:'Shipment',width:"9.09%"},
	   { name: 'DatePlaced', displayName:'Order Placed On', cellTemplate: '<div class="data_cell">{{row.entity.DatePlaced | date:grid.appScope.dateFormat}}</div>',width:"9.09%"},
	   { name: 'FromUserFirstName', displayName:'Sender Name',width:"9.09%"},
	   { name: 'DeliveryDate', displayName:'Delivery Date', cellTemplate: '<div class="data_cell">{{row.entity.DeliveryDate | date:grid.appScope.dateFormat}}</div>',width:"9.09%"},
	   { name: 'RecipientName', displayName:'Recipient Name',width:"9.09%"},
	   { name: 'Destination', displayName:'Destination',width:"9.09%"},
	   { name: 'TypeOfHold', displayName:'OnHold Type',width:"9.09%"},
	   { name: 'WireStatusCode', displayName:'Wire Status Code',width:"8%"},
	   { name: 'CSRID', displayName:'CSR ID',width:"9.09%"},
	   { name: 'ShippingCost', displayName:'', cellTemplate: '<div class="data_cell" ng-click="grid.appScope.home.onholdfunc(row.entity)"><a> <i class="fa fa-upload"></i> Open Order</a></div>',width:"10.09%"}
	  ]
	 };
	//vm.saved = OrderList.saved;
	OrderCloud.Orders.ListOutgoing(null, null, null, null, null, null, null, {"xp.SavedOrder.Flag":true,"Status":"Unsubmitted"}).then(function(data){
		vm.oldSaved = data.Items;
		vm.saved = angular.copy(vm.oldSaved);
	});
	$scope.user='User';
	$scope.CSRAdminData = {
		data: 'home.saved',
	    enableSorting: false,
	  columnDefs: [ 
		{ name: 'xp.SavedOrder.Name', displayName:'Order Name'},
		{ name: 'DateCreated', displayName:'Date Created', cellTemplate: '<div class="data_cell">{{row.entity.DateCreated | date:grid.appScope.dateFormat}}</div>', width:"15%"},
		{ name: 'FromUserFirstName', displayName:'Customer'},
		{ name: 'Delete', displayName:'', enableFiltering:false, cellTemplate: '<div class="data_cell"><a popover-trigger="none" popover-is-open="grid.appScope.showDeliveryToolTip[row.entity.ID]" ng-click="grid.appScope.showDeliveryToolTip[row.entity.ID] = !grid.appScope.showDeliveryToolTip[row.entity.ID]" uib-popover-template="grid.appScope.deleteAddress.templateUrl" popover-placement="bottom"><img src="../assets/images/icons-svg/cancel.svg">Delete</a></div><script type="text/ng-template" id="deleteAddress.html"><div click-outside="grid.appScope.closePopover()"><h2>Delete this Order</h2><button type="button" ng-click="grid.appScope.deleteOrder(row)">Yes</button><button type="button" ng-click="grid.appScope.cancelPopUp()">No</button></div></script>', width: "15%"},
		{ name: 'openOrder', displayName:'', enableFiltering:false, cellTemplate: '<div class="data_cell" ui-sref="buildOrder({ID:row.entity.FromUserID,SearchType:grid.appScope.user,orderID:row.entity.ID})"><a> <i class="fa fa-upload"></i> Open Order</a></div>', width: "15.2%"}
	  ]
	};
	
	vm.GetUPSCharges = function(){
		var data = {
			"BuyerID": "Bachmans",
		 	"TransactionType": "GetRates",
			"OrderID": "Wixz7z6bvUqZp02QiU6htw"
		};
		$http({
			method: 'POST',
			dataType: "json",
			url: ShippingRateURL,
			data: data,
			headers: {
				'Authorization': 'Bearer '+$cookieStore.get('OMS.Admintoken'),
				'Content-Type': 'application/json'
			}
		}).success(function (res, status, headers, config) {
			console.log("Success-->"+res);
		}).error(function (err, status, headers, config) {
			console.log("Error-->"+err);
		});
	};
	vm.GetUPSCharges();
	
	vm.onholdfunc=function(data){
		console.log(data);
		if(data.WireStatusCode==''){
			$state.go('buildOrder',{ID:data.FromUserID,SearchType:'User',orderID:data.OrderID,editsubmitorder:"true"});
		}
		else{
			$state.go('hold',{ID:data.ID,LineItemID:data.LineItemID,OrderID:data.OrderID});
		}
		//ui-sref="hold({ID:row.entity.ID,LineItemID:row.entity.LineItemID,OrderID:row.entity.OrderID})";
	}
	$scope.$watch(angular.bind(this, function () {
        return this.searchText;
    }), function (newVal, oldVal) {
        if (newVal) {
        	vm.saved = $filter('filter')(vm.oldSaved, newVal, undefined);
        }
    });

	//var ticket = localStorage.getItem("alfrescoTicket");
	// HomeService.GetPromoInfo(ticket).then(function(res){
		// vm.PromoInformation=[];
		// for(var i=3;i<res.items.length;i++){
			// vm.PromoInfo = $sce.trustAsResourceUrl(alfrescoURL+res.items[i].contentUrl+"?alf_ticket="+ticket);
			// vm.PromoInformation.push(vm.PromoInfo);

		// }
	// });
	
	$scope.deleteAddress = {
        templateUrl: 'deleteAddress.html',
    }
	$scope.closePopover = function () {
        this.showDeliveryToolTip = false;
    };
    $scope.cancelPopUp = function () {
		console.log("dataaaaaaaaaaaaaa");
        this.showDeliveryToolTip = false;
    };
	$scope.dayClick = function( date, allDay, jsEvent, view ){
    	alert("with date selction");
    };
    //with this you can handle the click on the events
    $scope.eventClick = function(event){  
      // console.log(event);
		$state.go('buildOrder',{ID:event.id,SearchType:'Workshop'});
    };
    $scope.renderView = function(view){  
        var monthArr = ["January","February","March", "April","May","June","July","August", "September","October","November","December"];  
        var prevMonth = new Date(view.calendar.getDate()).getMonth()-1;
        var nxtMonth =  new Date(view.calendar.getDate()).getMonth()+1;

        $('.fc-icon-right-single-arrow').text(monthArr[nxtMonth >= 12 ? 0: nxtMonth]);
        $('.fc-icon-left-single-arrow').text(monthArr[prevMonth <= -1 ? 11: prevMonth]);

       //  $('.fc-event-container').closest('table').find('thead tr td').eq($('.fc-event-container').);
    };
	$scope.eventRender = function( event, element, view ) { 
        element.attr({'tooltip': event.title,
                     'tooltip-append-to-body': true});
        $compile(element)($scope);
    };
	$scope.events=[];
	$scope.saveCalendar = function(){
		$uibModal.open({
                animation: true,
                windowClass: 'quickViewModal',
                templateUrl: 'home/templates/calender.tpl.html',
                controller: 'eventCalenderModalCtrl',
                controllerAs: 'eventCalenderModal',
                resolve: {
                    events: function() {
                        return $scope.saveCalendarData().then(function(catList) {
                            return catList;
                        });

                    }
                }
            });

	}
	$scope.saveCalendarData=function(){
		var events=[], dfr = $q.defer(), count=0;
		// OrderCloud.Categories.ListProductAssignments('WorkshopsEvents', null, 1 ,100).then(function(assign){
			// angular.forEach(assign.Items, function(res, key){
				// events.push(OrderCloud.Products.Get(res.ProductID));
			// },true);
			// $q.all(events).then(function(result){
				// var count=0,events = [];
				// angular.forEach(result, function(data, key){
					// if(!_.isEmpty(data.xp)){
						// if(data.xp.EventDate!=null){
							// events.push({
								// id: data.ID,
								// title: data.Name,
								// start: new Date(data.xp.EventDate),
								// //end : new Date(cat.xp.EndDate) // Uncomment if we have date range 
								// productcode : data.xp.ProductCode?data.xp.ProductCode:"",
								// description: data.Description,
								// startTime:data.xp.Slot?data.xp.Slot.StartTime:null,
								// endTime:data.xp.Slot?data.xp.Slot.EndTime:null
							// })
						// }
					// }
					// count++;
				// },true);
				// if(count==assign.Items.length){
						// var groupName=_.groupBy(events, function(value){
							// return value.start;
						// });
						// var data;
						// var result=[];
						// var cont=1;
						// var keys = Object.keys(groupName);
						// angular.forEach(groupName, function(val){
							// data=_.uniq(val, function(item){
								// return item.productcode;
							// });
							// result = _.union(result, data);
							// if(cont==keys.length){
								// dfr.resolve(result);
							// }
							// cont++;
							// console.log("result", result);
						// });
					// }
					// vm.showcalendarModal = !vm.showcalendarModal;
			// });
	// });
		OrderCloud.Products.List(null,1,100,null,null,{"xp.IsDefaultProduct":true, "xp.IsWorkShopEvent":true}).then(function(defaultprod){
			console.log("defaultprod", defaultprod);
				angular.forEach(defaultprod.Items, function(data, key){
					if(!_.isEmpty(data.xp)){
						events.push({
							id: data.ID,
							title: data.Name,
							start: new Date(data.xp.EventDate),
							 //end : new Date(cat.xp.EndDate) // Uncomment if we have date range 
							//productcode : data.xp.ProductCode?data.xp.ProductCode:"",
							//description: data.Description,
							//startTime:data.xp.Slot?data.xp.Slot.StartTime:null,
							//endTime:data.xp.Slot?data.xp.Slot.EndTime:null
						})
					}
				count++;
			},true);
			if(count==defaultprod.Items.length){
				dfr.resolve(events);
			}
		}).catch(function(err){
			console.log("Products API error......");
		});
		return dfr.promise;
	}
	$scope.viewpromotions=function(){
		vm.page = 1;
		vm.showpromotionsmodal = !vm.showpromotionsmodal;
	}
		$scope.totalItems = vm.promoList[1];
		$scope.currentPage = 1;
		$scope.itemsPerPage = 100;
		 $scope.maxSize = 5;
    vm.setPagingData=function(page) {
		OrderCloud.Promotions.List(null,page, 100, null, null, {"xp.Active":true}).then(function(promo){
			vm.promoList[0]=[];
			vm.promoList[0]=_.union(vm.promoList[0], promo.Items);
			vm.page=page;
		});
    }
	if($stateParams.event!=null){
        $scope.saveCalendar();
	}

	}


function eventCalenderModalController($scope , $http, events, $state, $uibModalInstance,$compile, $stateParams, uiCalendarConfig){
     $scope.events=[] 
     $scope.events = events;
 
     
    //with this you can handle the events that generated by clicking the day(empty spot) in the calendar
    $scope.dayClick = function( date, allDay, jsEvent, view ){
    	//alert("with date selction");
	};

    //with this you can handle the click on the events
 	$scope.eventClick = function(event) {
        // console.log(event);   
        $uibModalInstance.dismiss('cancel');
        $state.go('buildOrder',{ID:event.id,SearchType:'Workshop'});
    };

    $scope.renderView = function(view) {
        var monthArr = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        var prevMonth = new Date(view.calendar.getDate()).getMonth() - 1;
        var nxtMonth = new Date(view.calendar.getDate()).getMonth() + 1;

        $('.fc-icon-right-single-arrow').text(monthArr[nxtMonth >= 12 ? 0 : nxtMonth]);
        $('.fc-icon-left-single-arrow').text(monthArr[prevMonth <= -1 ? 11 : prevMonth]);

        //  $('.fc-event-container').closest('table').find('thead tr td').eq($('.fc-event-container').);
    };

	$scope.eventRender = function( event, element, view ) { 
        element.attr({'tooltip': event.title,
                     'tooltip-append-to-body': true});
        $compile(element)($scope);
    };
	if($stateParams.event!=''){
        var date=$stateParams.event;
	}
    else{
		var today = new Date();
		var dd = today.getDate();
		var mm = today.getMonth()+1; //January is 0!
		var yyyy = today.getFullYear();
		today = yyyy+'-'+mm+'-'+dd; 
		var date=today;
    }
		$scope.eventsF = function (start, end, timezone, callback) {
		var s = new Date(start).getTime() / 1000;
		var e = new Date(end).getTime() / 1000;
		var m = new Date(start).getMonth();
		var events = [{title: 'Feed Me ' + m,start: s + (50000),end: s + (100000),allDay: false, className: ['customFeed']}];
		callback(events);
    };
    /* config object */
    $scope.uiConfig = {
		calendar:{
			height: 550,
			editable: false,
			header:{
			  left: 'prev',
			  center: 'title',
			  right: 'next',
			  buttonIcons: false
			},
			defaultDate:date,
			//dayClick: $scope.dayClick,
			eventClick: $scope.eventClick,
			eventRender: $scope.eventRender,
			viewRender: $scope.renderView,
			eventLimit: 4, // If you set a number it will hide the itens
			eventLimitText: "Events available",
			columnFormat: {
			   month: 'dddd'
			} 
		}    
	};

    /* event sources array*/
	$scope.eventSources = [$scope.events];
	$stateParams.event='';
}
/*
function HomeService( $q, $http, alfrescoURL) {
	var service = {		
		GetPromoInfo:_getPromoInfo
	};

	function _getPromoInfo(ticket) {
		var defferred = $q.defer();
		var ticket = localStorage.getItem("alf_ticket"); 
		$http({
			method: 'GET',
			dataType:"json",
			url: alfrescoURL+"slingshot/doclib/doclist/documents/site/bachmans-storefront/documentLibrary/HomePage/Promotions?alf_ticket="+ticket,
			headers: {
				'Content-Type': 'application/json'
			}
		}).success(function (data, status, headers, config) {              
			defferred.resolve(data);
		}).error(function (data, status, headers, config) {
			defferred.reject(data);
		});
		return defferred.promise;
	}
	return service;
}
*/
