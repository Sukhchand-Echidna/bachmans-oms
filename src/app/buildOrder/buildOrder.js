angular.module( 'orderCloud' )
	.config( buildOrderConfig )
	.factory( 'BuildOrderService', BuildOrderService)
	.controller( 'buildOrderCtrl', buildOrderController )
	.controller( 'BuildOrderTopCtrl', buildOrderTopController )
	.controller( 'BuildOrderLeftCtrl', buildOrderLeftController )
	.controller( 'BuildOrderRightCtrl', buildOrderRightController )
	.controller( 'BuildOrderDownCtrl', buildOrderDownController )
	.controller( 'BuildOrderPDPCtrl', buildOrderPDPController )
	.controller( 'BuildOrderPLPCtrl', buildOrderPLPController )
	.controller( 'BuildOrderSummaryCtrl', buildOrderSummaryController )
	.service('anchorSmoothScroll', anchorSmoothScroll)
	.directive('modal', function () {
		return {
			template: '<div class="modal fade">' + 
			'<div class="modal-dialog">' + 
			'<div class="modal-content">' + 
			'<div class="modal-header">' + 
			'<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' + 
			'<h4 class="modal-title">{{ title }}</h4>' + 
			'</div>' + 
			'<div class="modal-body" ng-transclude></div>' + 
			'</div>' + 
			'</div>' + 
			'</div>',
			restrict: 'E',
			transclude: true,
			replace:true,
			scope:true,
			link: function postLink(scope, element, attrs) {
				scope.title = attrs.title;
				scope.$watch(attrs.visible, function(value){
					if(value == true)
						$(element).modal('show');
					else
						$(element).modal('hide');
				});
				$(element).on('shown.bs.modal', function(){
					scope.$apply(function(){
						scope.$parent[attrs.visible] = true;
					});
				});
				$(element).on('hidden.bs.modal', function(){
					scope.$apply(function(){
						scope.$parent[attrs.visible] = false;
						if(scope.$parent.buildOrder){
							scope.$parent.buildOrder.guestUserModal = false;
							scope.$parent.buildOrder.AssemblyModal = false;
							if(scope.$parent.buildOrderRight)
								scope.$parent.buildOrderRight.OrderConfirmPopUp = false;
							if(scope.$parent.buildOrderPDP)	
								scope.$parent.buildOrderPDP.viewCareGuide = false;
						}
						if(scope.$parent.home){
							scope.$parent.home.showcalendarModal = false;
							scope.$parent.home.showpromotionsmodal = false;
						}
						if(scope.$parent.custInfo)
							scope.$parent.custInfo.showPOModal = false; 
					});
				});
			}
		};
	}).directive("maxLength", function() {
		return {
			restrict: "A",
			link: function(scope, elem, attrs) {
				var limit = parseInt(attrs.maxLength);
				angular.element(elem).on("keypress", function(e) {
					if (this.value.length == limit){
						e.preventDefault();
						$(this).next().focus();
					}	
					if (this.value.length == (limit-1)){
						$(this).next().focus();
					}
				});
			}
		}
	});
var impersonation = {
	"ClientID": "8836BE8D-710A-4D2D-98BF-EDBE7227E3BB",
	"Claims": ["FullAccess"]
};
function buildOrderConfig( $stateProvider ) {
	$stateProvider
	.state( 'buildOrder', {
		parent: 'base',
		url: '/buildOrder/:SearchType/:ID/:prodID/:orderID/:orderDetails/:catName',
		templateUrl:'buildOrder/templates/buildOrder.tpl.html',
		data: {
            loadingMessage: 'Loading...'
        },
		params: {
			showOrdersummary: false,
			prodID:{
				value: "",
				squash: true
			}
		},
		views: {
			'': {
				templateUrl: 'buildOrder/templates/buildOrder.tpl.html',
				controller:'buildOrderCtrl',
				controllerAs: 'buildOrder'
			},
			'buildorderpdp@buildOrder': {
				templateUrl: 'buildOrder/templates/buildOrder.pdp.tpl.html',
				controller: 'BuildOrderPDPCtrl',
				controllerAs: 'buildOrderPDP'
			},
			'buildorderplp@buildOrder': {
				templateUrl: 'buildOrder/templates/buildOrder.plp.tpl.html',
				controller: 'BuildOrderPLPCtrl',
				controllerAs: 'buildOrderPLP'
			},
			'buildordertop@buildOrder': {
				templateUrl: 'buildOrder/templates/buildOrder.top.tpl.html',
				controller: 'BuildOrderTopCtrl',
				controllerAs: 'buildOrderTop'
			},
			'buildorderdown@buildOrder': {
				templateUrl: 'buildOrder/templates/buildOrder.down.tpl.html',
				controller: 'BuildOrderDownCtrl',
				controllerAs: 'buildOrderDown'
			},
			'buildorderleft@buildOrder': {
				templateUrl: 'buildOrder/templates/buildOrder.left.tpl.html',
				controller: 'BuildOrderLeftCtrl',
				controllerAs: 'buildOrderLeft'
			},
			'buildorderright@buildOrder': {
				templateUrl: 'buildOrder/templates/buildOrder.right.tpl.html',
				controller: 'BuildOrderRightCtrl',
				controllerAs: 'buildOrderRight'
			},
			'buildordersummary@buildOrder': {
				templateUrl: 'buildOrder/templates/buildOrder.orderSummary.tpl.html',
				controller: 'BuildOrderSummaryCtrl',
				controllerAs: 'buildordersummary'
			},
			'buildorderorderhistorydetails@buildOrder': {
				templateUrl: 'buildOrder/templates/buildOrder.orderHistoryDetails.tpl.html',
				controller: 'BuildOrderSummaryCtrl',
				controllerAs: 'buildordersummary'
			}
		},
		resolve: {
			Order: function($rootScope, $q, $state, toastr, $stateParams, CurrentOrder, OrderCloud) {
				var d = $q.defer();
				if($stateParams.SearchType != 'Products' && $stateParams.SearchType != 'BuildOrder' && $stateParams.SearchType != 'PDP' && $stateParams.SearchType != 'plp' && $stateParams.SearchType!='Workshop' && !$stateParams.orderDetails){
					OrderCloud.Users.GetAccessToken($stateParams.ID, impersonation).then(function(data){
						OrderCloud.Auth.SetImpersonationToken(data['access_token']);
						OrderCloud.As().Me.ListOutgoingOrders(null, 1, 100, null, null, {"Status":"Unsubmitted"}).then(function(res){
							var temp = [], filt = _.filter(res.Items, function(row){
								if(row.xp.SavedOrder){
									if(!row.xp.SavedOrder.Flag)
										temp.push(row);
								}else{
									temp.push(row);
								}
							});
							if(temp.length != 0){
								CurrentOrder.Set(temp[0].ID);
								d.resolve(temp[0]);
							}else{
								d.resolve();
							}
						});
					});
				}else if($stateParams.orderDetails){
					OrderCloud.Orders.Get($stateParams.orderID).then(function(res){
						d.resolve(res);
					});
				}else{
					d.resolve();
				}
				return d.promise;
			},
			SearchData: function($q, $stateParams, $state, OrderCloud, Order) {
				var arr = {}, d = $q.defer();
				if($stateParams.SearchType == "User"){
					OrderCloud.Users.Get($stateParams.ID).then(function(data){
						console.log(data);
						arr["user"] = data.FirstName+" "+data.LastName;
						arr["ID"] =data.ID;
						arr["Notes"] = data.xp.Notes;
						OrderCloud.As().Me.ListAddresses().then(function(res){
							angular.forEach(res.Items, function(val, key) {
								if(val.xp != null){
									if(val.xp.IsDefault)
										arr["address"] = val;
								}
							}, true);
							d.resolve(arr);
						});
					});  
				}else{
					arr["productID"]=$stateParams.ID;
					d.resolve(arr);
				}
				return d.promise;
			},
			ProductImages: function (BuildOrderService, $q){
				var ticket = localStorage.getItem("alfrescoTicket"), dfr = $q.defer();
				BuildOrderService.GetProductImages(ticket).then(function(imgList){
					dfr.resolve(imgList.items);
				});
				return dfr.promise;
			},

			productList: function (OrderCloud, $stateParams, BuildOrderService, $q, ProductImages) {
				if($stateParams.SearchType == 'plp' || $stateParams.SearchType == 'Products'|| $stateParams.SearchType == 'BuildOrder' || $stateParams.SearchType =='Workshop' || $stateParams.SearchType =='PDP'){
					var dfr = $q.defer();
					OrderCloud.Users.GetAccessToken('gby8nYybikCZhjMcwVPAiQ', impersonation).then(function(data) {
						OrderCloud.Auth.SetImpersonationToken(data['access_token']);
						if($stateParams.SearchType == 'plp' || $stateParams.SearchType == 'Products'){
							BuildOrderService.GetAlgoliaResults($stateParams.ID).then(function(res){
						        if(res.hits.length>0){
									BuildOrderService.GetProductList(res.hits, ProductImages).then(function(catProducts){
										dfr.resolve(catProducts);
									});
						        }
						        else 
									dfr.resolve();
						    });
						}else if($stateParams.SearchType =='Workshop'){
							OrderCloud.As().Me.GetProduct($stateParams.ID).then(function(prod){
								OrderCloud.As().Me.ListProducts(null, null, null, null, null, {"xp.ProductCode":prod.xp.ProductCode}).then(function(res){
									dfr.resolve(res.Items);
								});
							});
						}else{
							dfr.resolve();
						}
					});
					return dfr.promise;
				}
			 },
			CstDateTime: function ($q, BuildOrderService){
				var dfr = $q.defer();
				BuildOrderService.CompareDate().then(function(dt){
					dfr.resolve(new Date(dt.datetime));
				});
				return dfr.promise;
			}
		}
	});
}

function buildOrderController($scope, $rootScope, $state, buyerid, $controller, $stateParams, ProductList, LineItemHelpers, $q, BuildOrderService, $timeout, OrderCloud, SearchData, algolia, CurrentOrder, alfrescoAccessURL, Underscore, ProductImages, productList, AlfrescoFact, AddressValidationService, GoogleAPI, $http) {
	var vm = this;
	vm.upselloverlay=false;
	vm.selected = undefined;
	vm.hidePdpblock=false;
	if($stateParams.SearchType == 'Workshop'){
			vm.hidePdpblock=true;
	}
	$scope.search = {
        'query' : '',
        'hits' : []
    };
	vm.productSearchData = [];
	vm.showPDP = false;
	$scope.hideSearchBox=false;
	$scope.showOrdersummary = $stateParams.showOrdersummary;
	$scope.hideActiveSummary = true;
	$scope.showplp = true;
	$scope.gotoCheckout=function(){
		if($scope.showOrdersummary == true){
			if($stateParams.SearchType == 'Products' || $stateParams.SearchType == 'BuildOrder' || $stateParams.SearchType == 'PDP' || $stateParams.SearchType == 'plp'){
				vm.guestUserModal =! vm.guestUserModal;
			}else{
				$state.go('checkout', {ID:$stateParams.ID}, {reload:true});	
			}
		}
	};
	function displayProduct(filt){
		//vm.productDetails.individualProd = filt;
		vm.productDetails.ID = filt[0].ID;
		vm.productDetails.Name = filt[0].Name;
		vm.productDetails.Description = filt[0].Description;
		vm.productDetails.imgUrl=filt[0].imgUrl;
		vm.productDetails.prodPrice=filt[0].StandardPriceSchedule.PriceBreaks[0].Price;
	}
	$scope.OrderSummary=function(){
		angular.element(document.getElementById("oms-plp-right")).scope().buildOrderRight.OrderConfirmPopUp = false;
		$scope.ordersumry();
		$scope.hideSearchBox=true;
		$scope.showOrdersummary = true;
		vm.showPDP = false;
		$scope.showplp = false;
	};
	if($scope.showOrdersummary){
		$scope.hideSearchBox=true;
		vm.showPDP = false;
		$scope.showplp = false;
	}
	if($stateParams.orderDetails){
		$scope.hideSearchBox=true;
		$scope.orderDetails=true;
	}
	$scope.BacktoOrder = function(){
		angular.element(document.getElementById("oms-plp-right")).scope().buildOrderRight.getLineItems();
		$scope.showOrdersummary = false;
		$scope.hideSearchBox=false;
		$scope.showplp = true;
	}
	// $scope.backTocreate=function(){
		// $scope.hideSearchBox=false;
		// //$scope.orderDetails=false;
	// }
	$scope.ordersumry = function () {
		console.log($scope);
		angular.element(document.getElementById("order-summary")).scope().$parent.buildordersummary.orderSummaryShow();
	};
	console.log('stateparams', $stateParams);
	vm.productdata = function(prodID, varientOptions, line){
		$scope.pdpID = BuildOrderService.GetProductID(prodID);
		console.log($scope.pdpID);
		vm.showPDP = true;
		vm.productDetails = {};
		if(varientOptions){
			vm.productDetails.editProducts = line;
			prodID = line[0].Product.ID;
		}
		OrderCloud.Products.Get(prodID).then(function(res1){
			vm.productDetails.ID = res1.ID;
			vm.productDetails.Name = res1.Name;
			vm.productDetails.Description = res1.Description;
			OrderCloud.Products.List(null, null, null, null, null, {"xp.SequenceNumber":res1.xp.SequenceNumber}).then(function(res2){
				vm.fullProductsData = res2.Items;
				var size = [],color = [];
				angular.forEach(res2.Items, function(val, key){
					if(val.xp){
						if(val.xp.Specs_Options){
							size.push(val.xp.Specs_Options.Cont_Size);
							color.push(val.xp.Specs_Options.Color);
						}	
					}	
				},true);
				vm.productDetails.options = {"Color":_.uniq(color), "Size":_.uniq(size)};
				$timeout(function(){
					if(vm.productDetails.editProducts && vm.productDetails.editProducts[0].Product.xp.Specs_Options){
						vm.productDetails.sizeval = vm.productDetails.editProducts[0].Product.xp.Specs_Options.Cont_Size;
						vm.productDetails.colorval = vm.productDetails.editProducts[0].Product.xp.Specs_Options.Color;
					}
					$scope.selectVarients();
				},1000);
			});
		});
		vm.DeliveryType = false;
		vm.Courier = false;
		vm.DirectShip = false;
		vm.Faster = false;
		vm.GiftCard = false;
		if($stateParams.SearchType != 'Products' && $stateParams.SearchType != 'BuildOrder' && $stateParams.SearchType != 'PDP' && $stateParams.SearchType != 'plp' && $stateParams.SearchType!='Workshop'){
			OrderCloud.Categories.ListProductAssignments(null, prodID).then(function(res){
				OrderCloud.Categories.Get(res.Items[0].CategoryID).then(function(res2){
					if(res2.xp.DeliveryChargesCatWise.DeliveryMethods.DirectShip){
						vm.DirectShip = true;
					}
					if(res2.xp.DeliveryChargesCatWise.DeliveryMethods.Mixed){
						vm.Faster = true;
					}
					if(res2.Name == "Gift Cards"){
						vm.GiftCard = true;
					}
					if(res2.xp.DeliveryChargesCatWise.DeliveryMethods.Courier == true){
						vm.Courier = true;
					}
				});	
			});
		}
	};
	if($stateParams.SearchType == 'plp' || $stateParams.SearchType == 'PDP' || $stateParams.SearchType == 'BuildOrder'){
		vm.disable=true;
	}
	/*----Upsell Data----*/
	vm.upsell = true;
	vm.similar = true;
	vm.upsellToggle = function(upsell) {
		var tempArr = [];
		vm.upselloverlay=true;
		vm.upsell = vm.upsell === false ? true: false;
		vm.similar = true;
		if(!vm.Categories){
			OrderCloud.Products.Get("cat2_cat12_prod2").then(function(data) {
				var cats = [];
				vm.Categories = [];
				vm.UpsellDtls = data;
				_.filter(vm.UpsellDtls.xp.Upsell, function (row) {
					_.each(row, function( val, key ) {
						cats.push(key);
					});
				});
				angular.forEach(cats, function(line, index){
					tempArr.push(OrderCloud.Categories.Get("c1_c9_c1"));
				},true);
				$q.all(tempArr).then(function(res){
					angular.forEach(res, function(r){
						vm.Categories.push({"ID":r.ID, "Name":r.Name});
					},true);
					vm.getCategoriesItems(vm.Categories[0].ID, 0);
				});
			});
		}
	};
	
	vm.CategoryItemsUpsell = {};
	vm.getCategoriesItems = function(catID, index) {
		catID = "c1_c1";// dummy
		vm.CategoryItemsUpsell[index] = [];
		var upsel, tempArr = [];
		var catData = _.find(vm.UpsellDtls.xp.Upsell, function (row){
			if(row[catID]){
				upsel = row[catID];
				return true;
			}
		});
		angular.forEach(upsel, function(row){
			tempArr.push(OrderCloud.Products.Get(row));
		}, true);	
		$q.all(tempArr).then(function(res1){
			angular.forEach(res1, function(r){
				if(r.xp.SpecsOptions)
					vm.CategoryItemsUpsell[index].push({"ID":r.ID,"Name":r.Name,"Price":25,"Description":r.Description,"Size":r.xp.SpecsOptions.Size, "Color":r.xp.SpecsOptions.Color, "xp":r.xp});
				else
					vm.CategoryItemsUpsell[index].push({"ID":r.ID,"Name":r.Name,"Price":25,"Description":r.Description, "xp":r.xp});
			}, true);
			if((vm.Categories.length-1) > index){
				index = index+1;
				vm.getCategoriesItems(vm.Categories[0].ID, index);
			}else{
				vm.UpsellShow(0);
			}
		});
	};
	
	vm.similarToggle = function(similar) {
		if(similar)
			vm.similar = vm.similar === false ? true: false;
		vm.upsell = true;
		var tempArr = [];
		if(!vm.CategoryItemsSimilar){
			vm.CategoryItemsSimilar = [];
			OrderCloud.Products.Get("cat2_cat12_prod2").then(function(data) {
				angular.forEach(data.xp.Cross, function(row, index){
					tempArr.push(OrderCloud.Products.Get(row));
				},true);
				$q.all(tempArr).then(function(res){
					angular.forEach(res, function(r){
						if(r.xp.SpecsOptions)
							vm.CategoryItemsSimilar.push({"ID":r.ID,"Name":r.Name,"Price":30,"Description":r.Description,"Size":r.xp.SpecsOptions.Size, "Color":r.xp.SpecsOptions.Color, "xp":r.xp});
						else
							vm.CategoryItemsSimilar.push({"ID":r.ID,"Name":r.Name,"Price":30,"Description":r.Description, "xp":r.xp});
					},true);
					$('#owl-carousel-upsell').trigger('destroy.owl.carousel').removeClass('owl-carousel');
					$('#owl-carousel-upsell').find('.owl-stage-outer').children().unwrap();
					setTimeout(function(){
						$("#owl-carousel-similar").owlCarousel({
							items:4,
							center:false,
							loop: false,
							nav:true,
							navText: ['<span class="events-arrow-prev" aria-hidden="true"></span>','<span class="events-arrow-next" aria-hidden="true"></span>']
						});
					},0);
				});
			});
		}	
	};
	
	vm.UpsellShow = function(index){
		vm.UpsellIndex = index;
		setTimeout(function(){
			$("#owl-carousel-upsell"+index).owlCarousel({
				items:4,
				center:false,
				loop: false,
				nav:true,
				animateOut: 'slideOutDown',
				animateIn: 'flipInX',
				navText: ['<span class="events-arrow-prev" aria-hidden="true"></span>','<span class="events-arrow-next" aria-hidden="true"></span>'],
				onInitialized: function(data){
					console.log("====",data);
				}
			});
		},0);
	};
	
	vm.UpsellSimilar = false;
	vm.UpsellProductItem = function(obj, arr){
		vm.UpsellProdDtls = {};
		vm.UpsellProdDtls.UpsellCarousel = [];
		//vm.UpsellSimilar = true;
		//var temparr = [];
		/*angular.forEach(arr, function(row,index){
			BuildOrderService.GetProductDetails("30_30A_30BARB_575").then(function(result){
				var result = {"data":result};
				vm.UpsellProdDtls.UpsellCarousel.push(result);
				if((index+1) == 2){
					$('#pdpCarouselView').trigger('destroy.owl.carousel');
					$('#pdpCarouselView').find('.owl-stage-outer').children().unwrap();
					setTimeout(function(){
						$("#pdpCarouselView").owlCarousel({
							items:1,
							center: false,
							loop: false,
							nav: true,
							navText: ['<span class="events-arrow-prev" aria-hidden="true"></span>','<span class="events-arrow-next" aria-hidden="true"></span>']	
						});
						$('.owl-item').css('display','inline-block');
					},600);
				}
			});
		},true);*/
		/*angular.forEach(arr, function(row,index){
			temparr.push(OrderCloud.Products.Get("30_30A_30BARB_575"));
		}, true);
		$q.all(temparr).then(function(result){
			var result = {"data":result};
			vm.UpsellProdDtls.UpsellCarousel = result;
			$('#pdpCarouselView').trigger('destroy.owl.carousel');
			$('#pdpCarouselView').find('.owl-stage-outer').children().unwrap();
			setTimeout(function(){
				$("#pdpCarouselView").owlCarousel({
					items:1,
					center: false,
					loop: false,
					nav: true,
					navText: ['<span class="events-arrow-prev" aria-hidden="true"></span>','<span class="events-arrow-next" aria-hidden="true"></span>']	
				});
				$('.owl-item').css('display','inline-block');
			},600);
		});*/
		obj.ProductCode = obj.xp.ProductCode;
		vm.prouctsList(obj);
		vm.HideUpsellNCross();
	}
	
	vm.gotopdp = function(){
		vm.UpsellSimilar = false;
	}
	/*----End of Upsell Data----*/
	$scope.gotoplp = function(){
		vm.showPDP = false;
		if($stateParams.SearchType == 'PDP' && vm.seqProducts !='' && vm.searchval == ""){
			vm.searchSeqList=vm.seqProducts;
		}
		if($stateParams.SearchType == 'Workshop' && vm.hidePdpblock==true){
			vm.hidePdpblock=false;
		}
	}
	$scope.AddtoCart = function(prodID, varientsOption){
		var DeliveryMethod;
		if(vm.DeliveryType=="Faster Delivery")
			DeliveryMethod = "Faster";
		if(vm.DeliveryType=="Courier")
			DeliveryMethod = "Courier";
		vm.AddExtraList = [];
		angular.forEach(vm.AddExtra, function(val, key){
			vm.AddExtraList.push(val.ID);
		}, true);
		angular.element(document.getElementById("oms-plp-right")).scope().beforeAddToCart(prodID, DeliveryMethod);
	};
	$scope.show = false;
	$scope.showmenu = false;
	$scope.toggleMenu = function(event) {
		$scope.showmenu = !($scope.showmenu);
		event.stopPropagation();
	};
	window.onclick = function() {
		if ($scope.showmenu) {
		$scope.showmenu = false;
		$scope.$apply();
		}
	}
	$scope.oneAtATime = true;
	$scope.oneAtATimeSub = true;
	vm.createUser = function(newUser, createaddr, form){
		form.$submitted = true;
		if(form.$valid){
			$scope.showModal = !$scope.showModal;		
			var newUser={"Username":newUser.Username,"Password":newUser.Password,"FirstName":newUser.FirstName, "LastName":newUser.LastName, "Email":newUser.Email, "Phone":newUser.Phone, "Active":true, "Phone":"("+newUser.Phone1+") "+newUser.Phone2+"-"+newUser.Phone3, "xp":{"Notes":[]}};		
			OrderCloud.Users.Create(newUser).then(function(user){		
				OrderCloud.SecurityProfiles.SaveAssignment({"SecurityProfileID": "65c976de-c40a-4ff3-9472-b7b0550c47c3","BuyerID": buyerid,"UserID": user.ID}).then(function(security){
					console.log(security);
				})
				var params = {"CompanyName":createaddr.CompanyName,"FirstName":newUser.FirstName,"LastName":newUser.LastName,"Street1":createaddr.Street1,"Street2":createaddr.Street2,"City":createaddr.City,"State":createaddr.State,"Zip":createaddr.Zip,"Country":createaddr.Country,"Phone":newUser.Phone, "xp":{"IsDefault" :createaddr.IsDefault}};		
				OrderCloud.Addresses.Create(params).then(function(data){		
					data.Zip = parseInt(data.Zip);		
					console.log("address created",data);		
					var assign = {"AddressID": data.ID,"UserID": user.ID,"IsBilling": createaddr.IsBilling,"IsShipping": createaddr.IsShipping};		
					OrderCloud.Addresses.SaveAssignment(assign).then(function(res){		
						$state.go($state.current, {ID:user.ID,SearchType:'User',prodID:SearchData.productID}, {reload:true});		
						console.log("Address saved for the user....!" +res);		
					});		
				})		
			});
		}
	}
	vm.searchType=$stateParams.SearchType;
	console.log("productList", productList);
    if($stateParams.SearchType=='plp'){
        vm.catList=productList;
		vm.catName=$stateParams.catName;
        console.log("vm.catList", vm.catList);
    }
    // Function to get colors for selected size
    vm.selectVarients = function (selectedSize, $index) {
        DisplaySelectedColor(selectedSize, $index);
    };
    // function to retrieve images for selected size and color
    vm.selectColor = function ($index, color) {
        DisplaySelectedSize(color, $index);
    }
    function DisplayColors(prodcuts, IsObjectRequired) {
        console.log("All Product", prodcuts);
        var unique = {};
        var distinct = [];
        var distinctObj = [];
        for (var i in prodcuts) {
            if (typeof (prodcuts[i].xp) !== 'undefined') {
                if (typeof (unique[prodcuts[i].xp.SpecsOptions.Color]) == "undefined") {
                    distinct.push(prodcuts[i].xp.SpecsOptions.Color);
                    distinctObj.push(prodcuts[i]);
                }
                unique[prodcuts[i].xp.SpecsOptions.Color] = 0;
            }
        }
        if (IsObjectRequired)
            return distinctObj;
        else
            return distinct;
 
    }
 
    // FUnction to display all available sizes
    function DisplaySizes(prodcuts, IsObjectRequired) {
        console.log("All Product", prodcuts);
        var unique = {};
        var distinct = [];
        var distinctObj = [];
        for (var i in prodcuts) {
            if (typeof (prodcuts[i].xp) !== 'undefined') {
                if (typeof (unique[prodcuts[i].xp.SpecsOptions.Size]) == "undefined") {
                    distinct.push(prodcuts[i].xp.SpecsOptions.Size);
                    distinctObj.push(prodcuts[i]);
                }
                unique[prodcuts[i].xp.SpecsOptions.Size] = 0;
            }
        }
        if (IsObjectRequired)
            return distinctObj;
        else
            return distinct;
    }
    var availableColors, availableSizes = [];
    var activeProduct = null;
    $scope.radio = { selectedSize: -1, selectedColor: -1 };
    vm.isopen = false;
    vm.SelectExtra = function(selectedExtra, $event){
      $('.dropdown.open button p').text(selectedExtra);
    }
	GetAttributeImages();
	function GetAttributeImages() {
		var tkt = localStorage.getItem("alfrescoTicket");
		BuildOrderService.GetAttributeImages(tkt).then(function(imgList){
			vm.attributeImgs=imgList;
			console.log("vm.attributeImgs", vm.attributeImgs);
		});
	}
	vm.prouctsList = function(e){
		if($stateParams.SearchType == 'BuildOrder'){
			vm.PLPLoader = OrderCloud.Products.List(null, 1, 100, null, null, {"xp.ProductCode":e.ProductCode}).then(function(res){
				console.log(res);
				vm.PLPLoader = BuildOrderService.GetProductList(res.Items, ProductImages).then(function(prodList){
					vm.seqProducts=prodList;
					var selectedProd=_.where(vm.seqProducts, {"ID":e.ID});
					vm.showProduct(selectedProd[0]);
				 });
			});
		}else{
			vm.PLPLoader = OrderCloud.As().Me.ListProducts(null, 1, 100, null, null, {"xp.ProductCode":e.ProductCode}).then(function(res){
				vm.PLPLoader = BuildOrderService.GetProductList(res.Items, ProductImages).then(function(prodList){
					vm.seqProducts=prodList;
					var podID=e.ID;
					podID=podID.toString();
					var selectedProd=_.where(vm.seqProducts, {"ID":podID});
					vm.showProduct(selectedProd[0]);
				 });
			});
		}
	}
	vm.productsseqList=function(){
		OrderCloud.As().Me.GetProduct($stateParams.ID).then(function(e){
			vm.prodName=e.Name;
			OrderCloud.As().Me.ListProducts(null, 1, 100, null, null, {"xp.ProductCode":e.xp.ProductCode}).then(function(res){
				BuildOrderService.GetProductList(res.Items, ProductImages).then(function(prodList){
					vm.seqProducts=prodList;
					vm.showProduct(e);
				 });
			 });
		})
	}
    // Function to get selected product
    vm.showProduct=function(e){
		vm.AssemblyItems("onload");
		var alfticket = localStorage.getItem("alfrescoTicket");
		vm.selectedKey=[];
		if(vm.hidePdpblock==true){
			vm.fullEventsData=_.groupBy(productList, function(value){
				return value.xp.EventDate;
			});
			vm.PLPLoader = _.filter(productList, function(obj){
				if(obj.xp.IsBaseEvent== true && obj.xp.IsBaseEvent){
					vm.ticketInformation=obj.xp.TicketInformation;
					vm.cancellationOrPolicies=obj.xp.CancellationOrPolicies;
					var alternativeImg=[];
					angular.forEach(obj.xp.Images, function(value, key) {
						alternativeImg.push(alfrescoAccessURL+"/"+value.ContentURL+"?alf_ticket="+alfticket);
						vm.selectedalternativeImg = _.union(vm.selectedalternativeImg, alternativeImg);
						if(value.IsDefault){
							vm.selectedProductImg=alfrescoAccessURL+"/"+value.ContentURL+"?alf_ticket="+alfticket;
							console.log("vm.selectedProductImg", vm.selectedProductImg);
						}
						
					});
				}
			});
			vm.eventsLimit = Object.keys(vm.fullEventsData);
			console.log("groupName", vm.fullEventsData);
		}
		else{
			vm.fullProductsData=vm.seqProducts;
			vm.PLPLoader = _.filter(vm.fullProductsData, function(obj) {
                if(_.indexOf([obj.xp.IsBaseProduct]== true) && obj.xp.IsBaseProduct){
					vm.articles=obj.xp.Articles;
					vm.selectedSpecification=obj.xp.Attributes;
					vm.selectedWarranty=obj.xp.Warranty;
					angular.forEach(obj.xp.KeyAttributes, function(value, key) {
					var attImg=Underscore.where(vm.attributeImgs.items, {title: key});
					vm.selectedKey.push({
						url:alfrescoAccessURL+"/" + attImg[0].contentUrl + "?alf_ticket=" + alfticket,
						attribute:value
						})
					});
				}
			});
		}
		if(vm.hidePdpblock==false){
			vm.DeliveryType = false;
			vm.Assembly = false;
			vm.Courier = false;
			vm.DirectShip = false;
			vm.Placement = false;
			vm.Faster = false;
			vm.GiftCard = false;
			vm.PLPLoader = OrderCloud.Categories.ListProductAssignments(null, e.ID).then(function(res){
				if(res.Items.length > 0){
					vm.PLPLoader = OrderCloud.Categories.Get(res.Items[0].CategoryID).then(function(res2){
						if(res2.xp.DeliveryChargesCatWise.DeliveryMethods.DirectShip){
							vm.DirectShip = true;
						}
						if(res2.xp.DeliveryChargesCatWise.DeliveryMethods.Mixed){
							vm.Faster = true;
						}
						if(res2.Name == "Gift Cards"){
							vm.GiftCard = true;
						}
						if(res2.xp.DeliveryChargesCatWise.DeliveryMethods.Courier == true){
							vm.Courier = true;
						}
						if(res2.xp.Placement){
							vm.Placement = true;
						}
						if(res2.xp.Assembly){
							vm.Assembly = true;
						}
					});
				}
			});
			//vm.productExtras=extraProducts();
			
			//Get Upsell & CrossSell 
			vm.CategoryItemsSimilar;
			vm.Categories;
			vm.upsellToggle();
			vm.similarToggle();
			$scope.radio.selectedColor = e.xp.SpecsOptions.Color;
			availableColors = DisplayColors(vm.fullProductsData, true);
			vm.allColors = availableColors;
			var selectedColorHold = angular.copy(availableColors);
			DisplaySelectedSize(e.xp.SpecsOptions.Color, _.findIndex(selectedColorHold, function (item) { 
				if(e.xp.SpecsOptions.Color === null || e.xp.SpecsOptions.Color === null){
					return item.xp.SpecsOptions.Color == e.xp.SpecsOptions.Color 
				}else{
					return item.xp.SpecsOptions.Color.toLowerCase() == e.xp.SpecsOptions.Color.toLowerCase() 
				}
			})
			);
			$scope.radio.selectedSize = e.xp.SpecsOptions.Size;
			vm.productTitle = e.Name;
			vm.prodDesription = e.Description;
			availableSizes = DisplaySizes(vm.fullProductsData, true);
			vm.allSizes = availableSizes;
			var selectedSizeHold = angular.copy(availableSizes);
			DisplaySelectedColor(e.xp.SpecsOptions.Size, _.findIndex(selectedSizeHold, function (item) { 
				if(e.xp.SpecsOptions.Size === null || e.xp.SpecsOptions.Size === null){
				  return item.xp.SpecsOptions.Size == e.xp.SpecsOptions.Size 
				}else{
				 return item.xp.SpecsOptions.Size.toLowerCase() == e.xp.SpecsOptions.Size.toLowerCase() 
				}
			   })
			   );
			vm.showPDP = true;
		}
		else{
			vm.DisplayEvent(e);
			vm.showPDP = true;
		}
    }
     if($stateParams.SearchType == 'Products'){
		  vm.searchTxt=$stateParams.ID;
		  vm.disable=true;
        	vm.searchList=productList;
		}
	if($stateParams.SearchType == 'PDP')
	{
		vm.productsseqList();
	}
    function DisplaySelectedColor(selectedSize, $index) {
        vm.selectedSizeIndex = $index;
        var prodFiltered = _.filter(vm.fullProductsData, function (_obj) {
            if(_obj.xp.SpecsOptions.Size === null || selectedSize === null){
                return (_obj.xp.SpecsOptions.Size == selectedSize)
            }else{
                return (_obj.xp.SpecsOptions.Size == selectedSize || _obj.xp.SpecsOptions.Size.toLowerCase() == selectedSize)
            }
        });
        var imAvailableColors = angular.copy(availableColors);
        prodFiltered = DisplayColors(prodFiltered, false);
        prodFiltered = _.filter(imAvailableColors, function (color) {
            if (_.contains(prodFiltered, color.xp.SpecsOptions.Color)) {
                color.isNotAvailable = false;
                return color;
            }
            else {
                color.isNotAvailable = true;
                return color;
            }
        });
        vm.allColors = prodFiltered;
        if ($scope.radio.selectedSize != -1 && $scope.radio.selectedColor != -1) {
            var selectedSku = _.filter(vm.fullProductsData, function (_obj) {
                return ((_obj.xp.SpecsOptions.Size == $scope.radio.selectedSize || _obj.xp.SpecsOptions.Size.toLowerCase() == $scope.radio.selectedSize) && (_obj.xp.SpecsOptions.Color == $scope.radio.selectedColor || _obj.xp.SpecsOptions.Color.toLowerCase() == $scope.radio.selectedColor))
            });
            if (selectedSku.length == 1) {
                activeProduct = selectedSku[0];
                // if (activeProduct) {
                    // GetDeliveryMethods(activeProduct.ID);
                // }
                DisplayProduct(selectedSku[0]);
            } else {
                console.log('PDP PRODUCT ERROR :: ', selectedSku);
            }
        }
    }
    function DisplayProduct(selectedSku) {
        vm.productTitle = selectedSku.Name;
        vm.prodDesription = selectedSku.Description;
        vm.selectedProductId = selectedSku.ID;
        vm.selectedProductImg=selectedSku.baseImage;
        vm.changeImg=angular.copy(selectedSku.baseImage);
        vm.selectedalternativeImg=selectedSku.alternativeImg;
		delete vm.ProductPromotionID;
		delete vm.ProductPromotionCatID;
		if(!selectedSku.xp.couponID){
			vm.GetPromotions(selectedSku.xp);
		}
    }
	vm.DisplayEvent=function(selectedSku) {
        vm.productTitle = selectedSku.Name;
        vm.prodDesription = selectedSku.Description;
        vm.selectedProductId = selectedSku.ID;
		vm.selectedPrice=selectedSku.StandardPriceSchedule.PriceBreaks;
    }
    vm.changeImage=function(img){
        vm.changeImg=img;
    }
    function DisplaySelectedSize(color, $index) {
        var colorFiltered = _.filter(vm.fullProductsData, function (_obj) { // filters SKU with  selected color
            if(_obj.xp.SpecsOptions.Color === null || color === null){
                return (_obj.xp.SpecsOptions.Color == color)
            }else{
                return (_obj.xp.SpecsOptions.Color.toLowerCase() == color.toLowerCase())
            }
        });
        colorFiltered = DisplaySizes(colorFiltered, false); // sizes availavle for seelcted color 
        var imAvailableSizes = angular.copy(availableSizes); //copy for all available sizes
        colorFiltered = _.filter(imAvailableSizes, function (size) { // Adds isNotAvailable attribute for Sizes based on selected dolor
            if (_.contains(colorFiltered, size.xp.SpecsOptions.Size)) {
                size.isNotAvailable = false;
                return size;
            }
            else {
                size.isNotAvailable = true;
                return size;
            }
        });
        vm.allSizes = colorFiltered; // bind the sizes to DOM
        vm.selectedProductIndex = $index; // Active state for selected color
        if ($scope.radio.selectedSize != -1 && $scope.radio.selectedColor != -1) { // change prodcut if size and color is selected
            var selectedSku = _.filter(vm.fullProductsData, function (_obj) {
                return ((_obj.xp.SpecsOptions.Size == $scope.radio.selectedSize || _obj.xp.SpecsOptions.Size.toLowerCase() == $scope.radio.selectedSize) && (_obj.xp.SpecsOptions.Color == $scope.radio.selectedColor || _obj.xp.SpecsOptions.Color.toLowerCase() == $scope.radio.selectedColor))
            });
            console.log("selectedSku", selectedSku);
            if (selectedSku.length == 1) {
                activeProduct = selectedSku[0];
                DisplayProduct(selectedSku[0]); // displays selected product info
            } else {
                console.log('PDP PRODUCT ERROR ::', selectedSku);
            }
        }
    }
    function extraProducts() {
        var ticket = localStorage.getItem("alfrescoTicket");
       
        var imageData = BuildOrderService.GetExtras();
        var res = Object.keys(imageData).map(function (key) { return imageData[key] });
        //var imgcontentArray = [];
        // for (var i = 0; i < res.length; i++) {
            // for (var j = 0; j < res[i].length; j++) {
                // angular.forEach(Underscore.where(ProductImages, { title: res[i][j].Skuid }), function (node) {
                    // node.contentUrl = alfrescoAccessURL+"/"+ node.contentUrl + "?alf_ticket=" + ticket;
                    // imgcontentArray.push(node);
                // });
                // res[i][j].imgContent = imgcontentArray;
                // imgcontentArray = [];
            // }
        // }
        return res;
    }
	if($stateParams.SearchType == 'Workshop'){
		vm.showPDP = true;
		var selectedProd=_.where(productList, {"ID":$stateParams.ID});
        vm.showProduct(selectedProd[0]);
	}
	vm.cleardata=function(){
		if(vm.searchSeqList)
		vm.searchSeqList='';
		else if(vm.searchList)
		vm.searchList='';
		else if(vm.catList)
		vm.catList='';
		else if(vm.seqProducts)
		vm.seqProducts='';
	}
	vm.GetMinDays = function(zip, ProductID){
		vm.DeliveryNotAvailable = undefined;
		if((zip.toString()).length == 5){
			$http.get(GoogleAPI+zip).then(function(res){
				var city;
				if(res.data.results[0].postcode_localities){
					if(res.data.results[0].postcode_localities.length > 1){
						vm.MultipleCities = res.data.results[0].postcode_localities;
						if(zip == 55038)
							vm.MultipleCities.push("Columbus");
						if(zip == 55082){
							vm.MultipleCities.push("Grant");
							vm.MultipleCities.push("West Lakeland");
						}
					}	
				}else {
					delete vm.MultipleCities;
					angular.forEach(res.data.results[0].address_components, function(component,index){
						var types = component.types;
						angular.forEach(types, function(type,index){
							if(type == 'locality') {
								city = component.long_name;
							}
						});
					});
					vm.city = city;
					vm.CheckDeliveryAvailable(city, ProductID);
				}	
			});
		}	
	};
	vm.CheckDeliveryAvailable = function(city, ProductID){
		vm.DeliveryNotAvailable = undefined;
		vm.Mcity = city;
		var DeliveryMethod;
		if(city=="Minneapolis" || city=="Saint Paul"){
			DeliveryMethod = "LocalDelivery";
		} else {
			DeliveryMethod = "UPS";
		}
		OrderCloud.Categories.ListProductAssignments(null, ProductID).then(function(res1){
			OrderCloud.Categories.Get(res1.Items[0].CategoryID).then(function(res2){
				if(res2.xp.CategoryDeliveryCharges.DeliveryMethods[DeliveryMethod]){
					vm.DeliveryNotAvailable = false;
					if(res2.xp.CategoryDeliveryCharges.DeliveryMethods[DeliveryMethod].MinDays)
						vm.MinDate = res2.xp.CategoryDeliveryCharges.DeliveryMethods[DeliveryMethod].MinDays;
					else
						vm.MinDate = CstDateTime;
				}else{
					vm.DeliveryNotAvailable = true;
				}
			});
		});	
	};
	vm.CalendarSelect = function(date, ProductID){
		if(!_.isArray(vm.MultipleCities) || !vm.MultipleCities)
			vm.CheckDeliveryAvailable(vm.city, ProductID);
		else
			vm.CheckDeliveryAvailable(vm.Mcity, ProductID);
	};
	// Assembly & promotions critical part don't touch (Start here).....
	vm.AssemblyItems = function(param){
		var tempArr = [];
		vm.PLPLoader = OrderCloud.Products.Get("cat2_cat12_prod2").then(function(data) {
			angular.forEach(data.xp.Cross, function(row, index){
				tempArr.push(OrderCloud.Products.Get(row));
			},true);
			vm.PLPLoader = $q.all(tempArr).then(function(res){
				vm.AssemblyProducts = [];
				angular.forEach(res, function(r){
					if(r.xp.SpecsOptions)
						vm.AssemblyProducts.push({"ID":r.ID,"Name":r.Name,"Price":30,"Description":r.Description,"Size":r.xp.SpecsOptions.Size, "Color":r.xp.SpecsOptions.Color, "xp":r.xp});
					else	
						vm.AssemblyProducts.push({"ID":r.ID,"Name":r.Name,"Price":30,"Description":r.Description,"xp":r.xp});
				},true);
				if(param != "onload")
					vm.AssemblyModal = true;
				vm.ProductCouponsFunction(0);
			});
		});	
	};
	vm.AssemblyList = [];
	vm.SelectedProducts = function(){
		vm.AssemblyModal = false;
		vm.AssemblyList = [];
		_.mapObject(vm.ItemSelected, function(val, key){
			if(val == true)
				vm.AssemblyList.push(key);	
		});
	};
	vm.ProductCouponsFunction = function(index){
		//apply promotions if applicable
		var temparr = [];
		vm.ProductCoupons = {};
		vm.ProductCoupons.ListAssign = {};
		//Add extra 
		var list = angular.copy(vm.AssemblyProducts);
		_.each(vm.CategoryItemsUpsell, function(val){
			list = _.union(list, val);
		});
		list = _.uniq(list, function(x){
			return x.ID;
		});
		//------------------
		angular.forEach(list, function(val){
			if(!val.xp.couponID){
				temparr.push(OrderCloud.Categories.ListProductAssignments(null, val.ID));
				vm.ProductCoupons.ListAssign[val.ID] = temparr;
			}
		}, true);
		vm.ProductsCouponIDs = [];
		vm.ProductCouponsFunc2(index, list);
	};
	vm.ProductCouponsFunc2 = function(index, list){
		$q.all(vm.ProductCoupons.ListAssign[list[index].ID]).then(function(result1){
			var temparr = [];
			angular.forEach(result1, function(obj1){
				angular.forEach(obj1.Items, function(val1){
					temparr.push(OrderCloud.Categories.Get(val1.CategoryID));
				}, true);
			}, true);
			$q.all(temparr).then(function(result2){
				angular.forEach(result2, function(obj2){
					if(obj2.xp.couponID){
						if(obj2.xp.couponID[0].coupon){
							vm.ProductsCouponIDs.push({"ProductID": list[index].ID, "ProductPromotionID":obj2.xp.couponID[0].coupon, "ProductPromotionCatID": obj2.ID});
						}
					}	
				}, true);
				if((list.length-1) > index){
					index = index + 1;
					vm.ProductCouponsFunc2(index, list);
				}	
			});
		});
	};
	vm.HideUpsellNCross = function(){
		vm.upsell = true;
		vm.similar = true;
	};
	vm.GetPromotions = function(PDPxp){
		OrderCloud.Categories.ListProductAssignments(null, vm.selectedProductId).then(function(res1){
			angular.forEach(res1.Items, function(val){
				OrderCloud.Categories.Get(val.CategoryID).then(function(res2){
					if(res2.xp.couponID){	
						if(res2.xp.couponID[0].coupon){
							vm.ProductPromotionID = res2.xp.couponID[0].coupon;
							vm.ProductPromotionCatID = res2.ID;
						}
					}	
				});
			}, true);	
		});
	};
	// Assembly & promotions critical part don't touch (Ends here).....
}

function buildOrderTopController($scope, $stateParams,$rootScope, AlfrescoFact) {
	var vm = this;
	vm.logo=AlfrescoFact.logo;
	$scope.showmenu = false;
	$scope.toggleMenu = function(event) {
		$scope.showmenu = !($scope.showmenu);
		event.stopPropagation();
	};
	window.onclick = function() {
		if ($scope.showmenu) {
			$scope.showmenu = false;
			$scope.$apply();
		}
	}
	$scope.clickevent= function(){
		$rootScope.fff = "iuoistgosi";
	}
}

function buildOrderDownController($scope, $stateParams, $state, $q, OrderCloud) {
	var vm = this;
	vm.buildorderfooter=false;
	if($stateParams.orderDetails){
		vm.orderdetails= $stateParams.orderDetails;
		vm.orderhistorydetails=!$stateParams.orderDetails;
	}
	else if($stateParams.SearchType=="Products" || $stateParams.SearchType == 'BuildOrder' || $stateParams.SearchType == 'PDP' || $stateParams.SearchType == 'plp'){
		vm.buildorderfooter=true;
	}
	else
		vm.orderdetails=false;
		vm.orderhistorydetails=false;
	vm.ToolTip = {
		templateUrl: 'CancelOrderToolTip.html'
	};
	vm.closePopover = function () {
		vm.ShowCancelOrderToolTip = false;
	};
	vm.CancelToolTip = function(){
		vm.ShowCancelOrderToolTip = true;
	};
	vm.cancelOrder = function () {
		angular.element(document.getElementById("oms-plp-right")).scope().cancelOrder();
	};
	$scope.saveLaterPopup = function () {
		$scope.showModal = !$scope.showModal;
	};
	$scope.saveForLater = function (note) {
		angular.element(document.getElementById("oms-plp-right")).scope().saveForLater(note);
		$scope.showModal = !$scope.showModal;
	};
	vm.SaveAllLineItems = function(){
		angular.element(document.getElementById("oms-plp-right")).scope().buildOrderRight.SaveAllLineItems();
	};
	$scope.showModal = false;
	vm.ReOrder = function(){
		var obj = {"ID": $stateParams.ID, "SearchType":"User","showOrdersummary": false}, tempArr = [], tempArr2 = [], delChrgs = 0, CapTotalDiscount = 0;
		OrderCloud.LineItems.List($stateParams.orderID).then(function(res1){
			BuildOrderService.GetUnsubmittedOrder().then(function(res2){
				if(res2 != 0){
					angular.forEach(res1.Items, function(val){
						delChrgs += val.xp.deliveryCharges;
						tempArr.push(OrderCloud.As().LineItems.Update(res2.ID, val.ID, val));
						tempArr2.push(OrderCloud.As().LineItems.SetShippingAddress(res2.ID, val.ID, val.ShippingAddress));
					}, true);
					$q.all(tempArr).then(function(result){
						$q.all(tempArr2).then(function(result2){
							console.log("Success");
							delChrgs = delChrgs+res2.ShippingCost
							if(delChrgs > 250){
								CapTotalDiscount = delChrgs - 250;
								delChrgs = 250;
							}	
							OrderCloud.As().Orders.Patch(res2.ID, {"ShippingCost": delChrgs, "xp":{"CapTotalDiscount": CapTotalDiscount}}).then(function(res){
								$state.go('buildOrder', {ID: $stateParams.ID, SearchType:"User",showOrdersummary: false}, {reload:true});
							}).catch(function(){
								$state.go('buildOrder', {ID: $stateParams.ID, SearchType:"User",showOrdersummary: false}, {reload:true});
							});
						});	
					});
				}else{
					var orderParams = {"Type":"Standard","xp":{"OrderSource":"OMS","CSRID":$cookieStore.get('OMS.CSRID')}};
					OrderCloud.As().Orders.Create(orderParams).then(function(res3){
						angular.forEach(res1.Items, function(val){
							delChrgs += val.xp.deliveryCharges;
							tempArr.push(OrderCloud.As().LineItems.Update(res3.ID, val.ID, val));
							tempArr2.push(OrderCloud.As().LineItems.SetShippingAddress(res3.ID, val.ID, val.ShippingAddress));
						}, true);
						$q.all(tempArr).then(function(result){
							$q.all(tempArr2).then(function(result2){
								console.log("Success");
								delChrgs = delChrgs+res3.ShippingCost
								if(delChrgs > 250){
									CapTotalDiscount = delChrgs - 250;
									delChrgs = 250;
								}
								OrderCloud.As().Orders.Patch(res3.ID, {"ShippingCost": delChrgs, "xp":{"CapTotalDiscount": CapTotalDiscount}}).then(function(res){
									$state.go('buildOrder', {ID: $stateParams.ID, SearchType:"User",showOrdersummary: false}, {reload:true});
								}).catch(function(){
									$state.go('buildOrder', {ID: $stateParams.ID, SearchType:"User",showOrdersummary: false}, {reload:true});
								});
							});	
						});
					});
				}
			});
		});
	};
}

function buildOrderLeftController($scope, $stateParams, SearchData, OrderCloud, $q, $state) {
	var vm = this, Arr = [], spendingAcc = {};
	$scope.showpayment = false;
	vm.list = SearchData;
	if($stateParams.SearchType != 'Products' && $stateParams.SearchType != 'BuildOrder' && $stateParams.SearchType != 'PDP' && $stateParams.SearchType != 'plp' && $stateParams.SearchType != 'Workshop'){
		vm.guest=false;
		OrderCloud.SpendingAccounts.ListAssignments(null, $stateParams.ID).then(function(assign){
			angular.forEach(assign.Items, function(value, key){
				Arr.push(OrderCloud.SpendingAccounts.Get(value.SpendingAccountID));
			}, true);
			$q.all(Arr).then(function(result){
				vm.spendingAccounts = _.filter(result, function(row){
					return _.indexOf(["Purple Perks"],row.Name) > -1;
				});
			});
		});
	}
	else{
		vm.guest=true;
	}
	$scope.notedata = vm.list.Notes;
	OrderCloud.As().Me.Get().then(function (user) {
		vm.CurrentUser=user;
        vm.defaultUserCardID = user.xp.CreditCardDefaultId;
    });
	vm.paymentmodal = function(){
		$scope.showpayment= !$scope.showpayment;
		OrderCloud.As().Me.ListCreditCards(null, 1, 100).then(function (response) {
	        vm.cclist = response.Items;
	    });
	}
	vm.makedefaultcard = function (cardID) {
        vm.cards = vm.cclist;
        var filt = _.findWhere(vm.cclist, {
            ID: cardID
        });
        vm.cclist = _.without(vm.list, _.findWhere(vm.cclist, {
            ID: cardID
        }));
        vm.cclist.unshift(filt);
        vm.CurrentUser.xp.CreditCardDefaultId=cardID;
        OrderCloud.Users.Update(vm.CurrentUser.ID, vm.CurrentUser);
    }
	$scope.addNote= function(){
		$scope.show = !($scope.show);
		$scope.notedata.unshift({ Date: new Date(), Description:$scope.note.descp});
		$scope.notel = {"Notes":$scope.notedata};
		OrderCloud.Users.Patch($stateParams.ID,{"xp":$scope.notel});
	}
	$scope.remove = function(index){
		$scope.notedata.splice(index, 1);
		$scope.note2 = {"Notes":$scope.notedata};
		OrderCloud.Users.Patch($stateParams.ID,{"xp":$scope.note2});
		vm['showDeliveryToolTip'+index] = false;
	};
	vm.showDeleteToolTip = function(index){
		vm['showDeliveryToolTip'+index] = true;
	};
	$scope.noteinput = function(){
		$scope.show = true;
		setTimeout(function(){ $('#addNote').focus(); }, 0);
	};
	$scope.note = {
		date: new Date(),
		descp:""
	};
	$scope.show = false;
	$scope.status = {
		isFirstOpen: false
	};
	$scope.deleteNote = {
		templateUrl: 'deleteNote.html',
	};
	$scope.closePopover = function (index) {
		vm['showDeliveryToolTip'+index] = false;
	};
	$scope.cancelPopUp = function (index) {
		vm['showDeliveryToolTip'+index] = false;
	};
}

function buildOrderRightController($scope, $q, $stateParams, OrderCloud, Order, LineItemHelpers, TaxService, AddressValidationService, CurrentOrder, BuildOrderService, $cookieStore, CstDateTime, $http,$location,$anchorScroll, anchorSmoothScroll) {
	var vm = this;
	vm.isOpen = {};
	vm.addressbook=true;
	vm.CancelDeleteToolTip = {};
	if(Order)
		vm.order = Order;
	$scope.showDeliveryMethods = {
		templateUrl: 'AddRecipientDelMethods.html'
	};
	$scope.closePopover = function (index) {
		vm.DeliveryType = undefined;
		_.find(vm, function(v, k) {
			if (k.indexOf('showDeliveryToolTip') > -1) {
				vm[k] = false;
			}
		});
	};
	/*$scope.clearAllContent= function($event) {
       $event.target.value = "";
    };*/
	$scope.cancelPopUp = function (prodID, DeliveryMethod, index) {
		vm['showDeliveryToolTip'+index] = false;
		vm.DeliveryType = undefined;
		if(DeliveryMethod=='Default')
			DeliveryMethod = undefined;
		$scope.createListItem(prodID, DeliveryMethod);
	};
	vm.GetDeliveryMethods = function(prodID, index){
		vm.Faster = false;
		vm.Courier = false;
		vm.ActiveOrderCartLoader = OrderCloud.Categories.ListProductAssignments(null, prodID).then(function(res1){
			vm.ActiveOrderCartLoader = OrderCloud.Categories.Get(res1.Items[0].CategoryID).then(function(res2){
				if(res2.xp.CategoryDeliveryCharges.DeliveryMethods.Faster){
					vm.Faster = true;
					vm['showDeliveryToolTip'+index] = true;
				}
				if(res2.xp.CategoryDeliveryCharges.DeliveryMethods.Courier){
					vm.Courier = true;
					vm['showDeliveryToolTip'+index] = true;
				}
				if(!vm.Courier && !vm.Faster){
					$scope.createListItem(prodID, DeliveryMethod);
				}	
			});
		});	
	};
	$scope.beforeAddToCart = function(prodID, DeliveryMethod){
		if(!vm.order){
			vm.ActiveOrderCartLoader = BuildOrderService.GetUnsubmittedOrder().then(function(res){
				if(res != 0){
					CurrentOrder.Set(res.ID);
					vm.order = res;
					$scope.createListItem(prodID, DeliveryMethod);
				}else{
					var orderParams = {"Type":"Standard","xp":{"OrderSource":"OMS","CSRID":$cookieStore.get('OMS.CSRID')}};
					if($stateParams.SearchType == 'Products'  || $stateParams.SearchType == 'BuildOrder' || $stateParams.SearchType == 'PDP' || $stateParams.SearchType == 'plp'){
						vm.ActiveOrderCartLoader = BuildOrderService.AdminLogin().then(function(res){
    						angular.element(document.getElementById("order-summary")).scope().$parent.buildordersummary.token = res.access_token;
    						vm.ActiveOrderCartLoader = OrderCloud.As().Orders.Create(orderParams).then(function(res1){
    							CurrentOrder.Set(res1.ID);
								vm.order = res1;
								if($stateParams.SearchType == 'Products' || $stateParams.SearchType == 'PDP' || $stateParams.SearchType == 'BuildOrder' || $stateParams.SearchType == 'plp'){
									angular.element(document.getElementById("order-summary")).scope().$parent.buildordersummary.order = res1;	
								}
								$scope.createListItem(prodID, DeliveryMethod);
							});
						});
					}else{
						vm.ActiveOrderCartLoader = OrderCloud.As().Orders.Create(orderParams).then(function(res){
							CurrentOrder.Set(res.ID);
							vm.order = res;
							$scope.createListItem(prodID, DeliveryMethod);
						});
					}
				}
			});
		}else{
			$scope.createListItem(prodID, DeliveryMethod);
		}
	};
	$scope.createListItem = function(prodID, DeliveryMethod){
		var lineItemParams = {"ProductID": prodID,"Quantity": 1,"xp":{"TotalCost":0}}, buildorderVM = angular.element(document.getElementById("buildOrder-pdp-container")).scope().$parent.$parent.$parent.buildOrder, TempArr = [];
		if(buildorderVM.ProductPromotionCatID){
			lineItemParams.xp.PromoId = buildorderVM.ProductPromotionCatID;
			lineItemParams.xp.PromoCode = buildorderVM.ProductPromotionID;
		}
		if(DeliveryMethod)
			lineItemParams.xp.DeliveryMethod = DeliveryMethod;
		vm.ActiveOrderCartLoader = OrderCloud.Categories.ListProductAssignments(null, prodID).then(function(res1){
			vm.ActiveOrderCartLoader = OrderCloud.Categories.Get(res1.Items[0].CategoryID).then(function(res2){
				var MinDate = {};
				_.each(res2.xp.CategoryDeliveryCharges.DeliveryMethods, function (v, k) {
					if (v.MinDays){
						MinDate[k] = v.MinDays;
					}
				});
				lineItemParams.xp.MinDate = MinDate;
				if($stateParams.SearchType=='Products' || $stateParams.SearchType == 'PDP' || $stateParams.SearchType == 'BuildOrder' || $stateParams.SearchType == 'plp'){
					vm.ActiveOrderCartLoader = OrderCloud.LineItems.Create(vm.order.ID, lineItemParams).then(function(res){
						angular.element(document.getElementById("build-order-footer")).scope().buildOrderDown.buildorderfooter = false;
						lineItemParams.xp.TotalCost = lineItemParams.xp.TotalCost + (res.UnitPrice * res.Quantity);
						if(buildorderVM.IsPlacement=="Placed"){
							lineItemParams.xp.deliveryFeesDtls = {"Placement Charges": vm.buyerXp.AdditionalCharges.PlacementCharges};
							lineItemParams.xp.TotalCost = lineItemParams.xp.TotalCost + parseInt(vm.buyerXp.AdditionalCharges.PlacementCharges);
							lineItemParams.xp.deliveryCharges = vm.buyerXp.AdditionalCharges.PlacementCharges;
							lineItemParams.xp.PlacementInstruction = buildorderVM.PlacementInstruction;
						}
						vm.ActiveOrderCartLoader = OrderCloud.LineItems.Patch(vm.order.ID, res.ID, lineItemParams).then(function(res2){
							if(buildorderVM.AssemblyList.length == 0 || buildorderVM.IsAssembly == 'Not Assembled'){
								//vm.getLineItems();
								//---------------Data clear work around starts here-----------
								var arr = [];
								arr.push(res2);
								if(!vm.activeOrders)
									vm.activeOrders = {};
								vm.ActiveOrderCartLoader = LineItemHelpers.GetProductInfo(arr).then(function(data){
									if(vm.activeOrders[data[0].ProductID]){
										angular.forEach(vm.activeOrders, function(val, key){
											if(key == data[0].ProductID){
												val.push(data[0]);
											}
										}, true);
										if(!_.contains(vm.lineItemProducts, data[0].ProductID))
											vm.lineItemProducts.push(data[0].ProductID);
									}else{
										vm.lineItemProducts = _.without(vm.lineItemProducts, data[0].ProductID);
										vm.lineItemProducts.push(data[0].ProductID);
										vm.activeOrders[data[0].ProductID] = [data[0]];
									}
									angular.forEach(vm.activeOrders, function(val, key){
										$scope.prodQty[key] = _.reduce(_.pluck(vm.activeOrders[key], 'Quantity'), function(memo, num){ return memo + num; }, 0);
									});
								});	
								//---------------Data clear work around ends here------------
							}else{
								vm.CreateAssemblyItems(buildorderVM, res2.ID);
							}
							if(buildorderVM.AddExtraList){
								buildorderVM.AddExtraList = _.compact(buildorderVM.AddExtraList);
								if(buildorderVM.AddExtraList.length > 0)
									vm.AddExtraProducts(buildorderVM);
							}	
							vm.isOpen[res.ID] = true;
						});
					});
				}else{
					vm.ActiveOrderCartLoader = OrderCloud.As().LineItems.Create(vm.order.ID, lineItemParams).then(function(res){
						angular.element(document.getElementById("build-order-footer")).scope().buildOrderDown.buildorderfooter = false;
						lineItemParams.xp.TotalCost = lineItemParams.xp.TotalCost + (res.UnitPrice * res.Quantity);
						if(buildorderVM.IsPlacement=="Placed"){
							lineItemParams.xp.deliveryFeesDtls = {"Placement Charges": vm.buyerXp.AdditionalCharges.PlacementCharges};
							lineItemParams.xp.TotalCost = lineItemParams.xp.TotalCost + parseInt(vm.buyerXp.AdditionalCharges.PlacementCharges);
							lineItemParams.xp.deliveryCharges = vm.buyerXp.AdditionalCharges.PlacementCharges;
							lineItemParams.xp.PlacementInstruction = buildorderVM.PlacementInstruction;
						}
						vm.ActiveOrderCartLoader = OrderCloud.As().LineItems.Patch(vm.order.ID, res.ID, lineItemParams).then(function(res2){
							if(buildorderVM.AssemblyList.length == 0 || buildorderVM.IsAssembly == 'Not Assembled'){
								//vm.getLineItems();
								//---------------Data clear work around starts here-----------
								var arr = [];
								arr.push(res2);
								if(!vm.activeOrders)
									vm.activeOrders = {};
								vm.ActiveOrderCartLoader = LineItemHelpers.GetProductInfo(arr).then(function(data){
									if(vm.activeOrders[data[0].ProductID]){
										angular.forEach(vm.activeOrders, function(val, key){
											if(key == data[0].ProductID){
												val.push(data[0]);
											}
										}, true);
										if(!_.contains(vm.lineItemProducts, data[0].ProductID))
											vm.lineItemProducts.push(data[0].ProductID);
									}else{
										vm.lineItemProducts = _.without(vm.lineItemProducts, data[0].ProductID);
										vm.lineItemProducts.push(data[0].ProductID);
										vm.activeOrders[data[0].ProductID] = [data[0]];
									}
									angular.forEach(vm.activeOrders, function(val, key){
										$scope.prodQty[key] = _.reduce(_.pluck(vm.activeOrders[key], 'Quantity'), function(memo, num){ return memo + num; }, 0);
									});
								});
								//---------------Data clear work around ends here------------
							}else{
								vm.CreateAssemblyItems(buildorderVM, res2.ID);
							}
							if(buildorderVM.AddExtraList){
								buildorderVM.AddExtraList = _.compact(buildorderVM.AddExtraList);
								if(buildorderVM.AddExtraList.length > 0)
									vm.AddExtraProducts(buildorderVM);
							}	
							vm.isOpen[res.ID] = true;
						});
					});
				}
			});
		});
	};
	vm.CreateAssemblyItems = function(buildorderVM, BaseLineItemID){
		var TempArr = [], AssemblyLineItems = [], lineItemParams;
		angular.forEach(buildorderVM.AssemblyList, function(val, key){
			lineItemParams = {"ProductID": "","Quantity": 1,"xp":{"TotalCost":0}};
			lineItemParams.ProductID = val;
			lineItemParams.xp.BaseLineItemID = BaseLineItemID;
			lineItemParams.xp.deliveryCharges = 0;
			if(buildorderVM.ProductsCouponIDs){
				if(buildorderVM.ProductsCouponIDs.length > 0){
					var obj = _.findWhere(buildorderVM.ProductsCouponIDs, {ProductID: val});
					if(!_.isEmpty(obj)){
						lineItemParams.xp.PromoId = obj.ProductPromotionCatID;
						lineItemParams.xp.PromoCode = obj.ProductPromotionID;
					}
				}
			}	
			TempArr.push(OrderCloud.LineItems.Create(vm.order.ID, lineItemParams));
		}, true);
		vm.ActiveOrderCartLoader = $q.all(TempArr).then(function(result1){
			TempArr = [];
			angular.forEach(result1, function(val, key){
				TempArr.push(OrderCloud.LineItems.Patch(vm.order.ID, val.ID, {"xp":{"TotalCost":val.LineTotal}}));
				AssemblyLineItems.push(val.ID);
			}, true);
			TempArr.push(OrderCloud.LineItems.Patch(vm.order.ID, BaseLineItemID, {"xp":{"AssemblyLineItemsList":AssemblyLineItems}}));
			vm.ActiveOrderCartLoader = $q.all(TempArr).then(function(result2){
				//vm.getLineItems();
				//---------------Data clear work around starts here-----------
				vm.ActiveOrderCartLoader = LineItemHelpers.GetProductInfo(result2).then(function(data){
					angular.forEach(data, function(val1, key1){
						if(vm.activeOrders[val1.ProductID]){
							angular.forEach(vm.activeOrders, function(val, key){
								if(key == val1.ProductID){
									val.push(val1);
								}
							}, true);
							if(!_.contains(vm.lineItemProducts, val1.ProductID))
								vm.lineItemProducts.push(val1.ProductID);
						}else{
							vm.lineItemProducts = _.without(vm.lineItemProducts, val1.ProductID);
							vm.lineItemProducts.push(val1.ProductID);
							vm.activeOrders[val1.ProductID] = [val1];
						}
					}, true);
					angular.forEach(vm.activeOrders, function(val, key){
						$scope.prodQty[key] = _.reduce(_.pluck(vm.activeOrders[key], 'Quantity'), function(memo, num){ return memo + num; }, 0);
					});
				});
				//---------------Data clear work around ends here------------
			});
		});
	};
	vm.AddExtraProducts = function(buildorderVM){
		var TempArr = [], lineItemParams;
		angular.forEach(buildorderVM.AddExtraList, function(val){
			lineItemParams = {"ProductID": "","Quantity": 1,"xp":{"TotalCost":0}};
			lineItemParams.ProductID = val;
			if(buildorderVM.ProductsCouponIDs){
				if(buildorderVM.ProductsCouponIDs.length > 0){
					var obj = _.findWhere(buildorderVM.ProductsCouponIDs, {ProductID: val});
					if(!_.isEmpty(obj)){
						lineItemParams.xp.PromoId = obj.ProductPromotionCatID;
						lineItemParams.xp.PromoCode = obj.ProductPromotionID;
					}
				}
			}
			TempArr.push(OrderCloud.LineItems.Create(vm.order.ID, lineItemParams));
		}, true);
		vm.ActiveOrderCartLoader = $q.all(TempArr).then(function(result1){
			TempArr = [];
			angular.forEach(result1, function(val, key){
				TempArr.push(OrderCloud.LineItems.Patch(vm.order.ID, val.ID, {"xp":{"TotalCost":val.LineTotal}}));
			}, true);
			vm.ActiveOrderCartLoader = $q.all(TempArr).then(function(result2){
				//vm.getLineItems();
				//---------------Data clear work around starts here-----------
				vm.ActiveOrderCartLoader = LineItemHelpers.GetProductInfo(result2).then(function(data){
					angular.forEach(data, function(val1, key1){
						if(vm.activeOrders[val1.ProductID]){
							angular.forEach(vm.activeOrders, function(val, key){
								if(key == val1.ProductID){
									val.push(val1);
								}
							}, true);
							if(!_.contains(vm.lineItemProducts, val1.ProductID))
								vm.lineItemProducts.push(val1.ProductID);
						}else{
							if(!_.contains(vm.lineItemProducts, val1.ProductID))
								vm.lineItemProducts.push(val1.ProductID);
							vm.activeOrders[val1.ProductID] = [val1];
						}
					}, true);
					angular.forEach(vm.activeOrders, function(val, key){
						$scope.prodQty[key] = _.reduce(_.pluck(vm.activeOrders[key], 'Quantity'), function(memo, num){ return memo + num; }, 0);
					});					
				});
				//---------------Data clear work around ends here------------
			});
		});
	};
	vm.deleteListItem = function(e, listItem){
		e.preventDefault();
		e.stopPropagation();
		vm.CancelDeleteToolTip[listItem.ID] = false;
		if(!listItem.xp.AssemblyLineItemsList){
			vm.ActiveOrderCartLoader = OrderCloud.As().LineItems.Delete(vm.order.ID, listItem.ID).then(function(res){
				//---------------Data clear work around starts here------------
				angular.forEach(vm.activeOrders, function(val, key){
					if(key == listItem.ProductID){
						val = _.without(val, _.findWhere(val, {ID: listItem.ID}));
						if(val.length == 0){
							vm.lineItemProducts = _.without(vm.lineItemProducts, key);
							delete vm.activeOrders[key];
						}	
						else
							vm.activeOrders[key] = val;
					}
					$scope.prodQty[key] = _.reduce(_.pluck(vm.activeOrders[key], 'Quantity'), function(memo, num){ return memo + num; }, 0);
				}, true);
				//---------------Data clear work around ends here--------------
				//Assembly multiple lineitems in base item remove
				delete vm.lineItemForm[listItem.ID];
				if(listItem.xp.BaseLineItemID){
					var dat = _.without(listItem.xp.AssemblyLineItemsList, listItem.ID);
					vm.ActiveOrderCartLoader = OrderCloud.As().LineItems.Patch(vm.order.ID, listItem.ID, {"xp":{"AssemblyLineItemsList": dat}}).then(function(res){
						//vm.getLineItems();
						if(vm.lineItemForm[listItem.ID])
							vm.lineItemForm[listItem.ID].$setPristine();
						vm.ActiveOrderCartLoader = OrderCloud.LineItems.List(vm.order.ID).then(function(res){
							if(res.Items.length == 0)
								angular.element(document.getElementById("build-order-footer")).scope().buildOrderDown.buildorderfooter = true;
							vm.ActiveOrderCartLoader = LineItemHelpers.GetProductInfo(res.Items).then(function(data){
								vm.OrderConfirmFunction(data);
							});
						});	
					});
				}else{
					//vm.getLineItems();
					if(vm.lineItemForm[listItem.ID])
						vm.lineItemForm[listItem.ID].$setPristine();
					vm.ActiveOrderCartLoader = OrderCloud.LineItems.List(vm.order.ID).then(function(res){
						if(res.Items.length == 0)
							angular.element(document.getElementById("build-order-footer")).scope().buildOrderDown.buildorderfooter = true;
						vm.ActiveOrderCartLoader = LineItemHelpers.GetProductInfo(res.Items).then(function(data){
							vm.OrderConfirmFunction(data);
						});
					});	
				}
			}).catch(function(errMsg){
				if(errMsg.status==404){
					angular.forEach(vm.activeOrders, function(val, key){
						if(key == listItem.ProductID){
							val = _.without(val, _.findWhere(val, {ID: listItem.ID}));
							if(val.length == 0){
								vm.lineItemProducts = _.without(vm.lineItemProducts, key);
								delete vm.activeOrders[key];
							}	
							else
								vm.activeOrders[key] = val;
						}
						$scope.prodQty[key] = _.reduce(_.pluck(vm.activeOrders[key], 'Quantity'), function(memo, num){ return memo + num; }, 0);
					}, true);
				}	
			});
		}else{
			var TempArr = [];
			angular.forEach(listItem.xp.AssemblyLineItemsList, function(val){
				delete vm.lineItemForm[val];
				TempArr.push(OrderCloud.As().LineItems.Delete(vm.order.ID, val));
				angular.forEach(vm.activeOrders, function(val1, key1){
					val1 = _.without(val1, _.findWhere(val1, {ID: val}));
					vm.activeOrders[key1] = val1;
					if(vm.activeOrders[key1].length == 0)
						vm.lineItemProducts = _.without(vm.lineItemProducts, key1);
				}, true);
			}, true);
			TempArr.push(OrderCloud.As().LineItems.Delete(vm.order.ID, listItem.ID));
			delete vm.lineItemForm[listItem.ID];
			vm.ActiveOrderCartLoader = $q.all(TempArr).then(function(result){
				//vm.getLineItems();
				//---------------Data clear work around starts here------------	
				angular.forEach(vm.activeOrders, function(val, key){
					if(key == listItem.ProductID){
						val = _.without(val, _.findWhere(val, {ID: listItem.ID}));
						if(val.length == 0){
							vm.lineItemProducts = _.without(vm.lineItemProducts, key);
							delete vm.activeOrders[key];
						}	
						else
							vm.activeOrders[key] = val;
					}
					$scope.prodQty[key] = _.reduce(_.pluck(vm.activeOrders[key], 'Quantity'), function(memo, num){ return memo + num; }, 0);
				}, true);
				//---------------Data clear work around ends here--------------
				vm.ActiveOrderCartLoader = OrderCloud.LineItems.List(vm.order.ID).then(function(res){
					if(res.Items.length == 0)
						angular.element(document.getElementById("build-order-footer")).scope().buildOrderDown.buildorderfooter = true;
					vm.ActiveOrderCartLoader = LineItemHelpers.GetProductInfo(res.Items).then(function(data){
						vm.OrderConfirmFunction(data);
					});
				});
				console.log("succces");
			}).catch(function(errMsg){
				if(errMsg.status==404){
					angular.forEach(vm.activeOrders, function(val, key){
						if(key == listItem.ProductID){
							val = _.without(val, _.findWhere(val, {ID: listItem.ID}));
							if(val.length == 0){
								vm.lineItemProducts = _.without(vm.lineItemProducts, key);
								delete vm.activeOrders[key];
							}	
							else
								vm.activeOrders[key] = val;
						}
						$scope.prodQty[key] = _.reduce(_.pluck(vm.activeOrders[key], 'Quantity'), function(memo, num){ return memo + num; }, 0);
					}, true);
				}	
			});
		}
	};
	vm.OrderConfirmFunction = function(data){
		vm.OrderConfirmGrouping = _.groupBy(data, function(value){
			if(value.ShippingAddress!=null)
				return value.ShippingAddress.FirstName + ' ' + value.ShippingAddress.LastName + ' ' + value.ShippingAddress.Zip + ' ' + (value.ShippingAddress.Street1).split(/(\d+)/g)[1] + ' ' + value.xp.DeliveryMethod + ' ' + value.xp.deliveryDate;
		});
		angular.forEach(vm.OrderConfirmGrouping, function(val, key){
			if(val[0].ShippingAddress!=null){
				val[0].LineTotal = _.reduce(_.pluck(val, 'LineTotal'), function(memo, num){ return memo + num; }, 0);
				val[0].xp.deliveryCharges = _.reduce(_.map(val, function(item){return item.xp.deliveryCharges;}), function(memo, num){ return memo + num; }, 0);
				val[0].xp.Tax = _.reduce(_.map(val, function(item){return item.xp.Tax;}), function(memo, num){ return memo + num; }, 0);
				val[0].xp.TotalCost = _.reduce(_.map(val, function(item){return item.xp.TotalCost;}), function(memo, num){ return memo + num; }, 0);
			}	
		}, true);
	};
	vm.getLineItems = function(){
		 if(vm.order){
			if(vm.order.Status == "Unsubmitted"){
				if($stateParams.SearchType=="Products" || $stateParams.SearchType == 'BuildOrder' || $stateParams.SearchType == 'PDP' || $stateParams.SearchType == 'plp'){
					vm.addressbook = false;
					vm.ActiveOrderCartLoader = OrderCloud.LineItems.List(vm.order.ID).then(function(res){
						if(res.Items.length==0)
							angular.element(document.getElementById("build-order-footer")).scope().buildOrderDown.buildorderfooter=true;
						vm.AvoidMultipleDelryChrgs = [];	
						if(res.Items.length==0 && vm.order.TaxCost != 0){
							OrderCloud.Orders.Patch(vm.order.ID, {"ShippingCost": 0, "TaxCost": 0, "xp":{"CapTotalDiscount": 0}}).then(function(res){
								vm.order = res;
							}).catch(function(){
								OrderCloud.Orders.Get(vm.order.ID).then(function(res){
									vm.order = res;
								});
							});
						}
						vm.ActiveOrderCartLoader = LineItemHelpers.GetProductInfo(res.Items).then(function(data) {
							vm.OrderConfirmGrouping = _.groupBy(data, function(value){
								if(value.ShippingAddress!=null)
									return value.ShippingAddress.FirstName + ' ' + value.ShippingAddress.LastName + ' ' + value.ShippingAddress.Zip + ' ' + (value.ShippingAddress.Street1).split(/(\d+)/g)[1] + ' ' + value.xp.DeliveryMethod + ' ' + value.xp.deliveryDate;
							});
							angular.forEach(vm.OrderConfirmGrouping, function(val, key){
								if(val[0].ShippingAddress!=null){
									val[0].LineTotal = _.reduce(_.pluck(val, 'LineTotal'), function(memo, num){ return memo + num; }, 0);
									val[0].xp.deliveryCharges = _.reduce(_.map(val, function(item){return item.xp.deliveryCharges;}), function(memo, num){ return memo + num; }, 0);
									val[0].xp.Tax = _.reduce(_.map(val, function(item){return item.xp.Tax;}), function(memo, num){ return memo + num; }, 0);
									val[0].xp.TotalCost = _.reduce(_.map(val, function(item){return item.xp.TotalCost;}), function(memo, num){ return memo + num; }, 0);
								}	
							}, true);
							data = _.groupBy(data, function(obj){
								return obj.ProductID;
							});
							BuildOrderService.OrderOnHoldRemove(res.Items, vm.order.ID).then(function(dt){
								console.log("Order OnHold Removed....");
							});
							vm.lineItemProducts = [];
							vm.activeOrders = data;
							$scope.prodQty = {};
							angular.forEach(data,function(val1, key1){
								vm.lineItemProducts.push(key1);
								$scope.prodQty[key1] = _.reduce(_.pluck(data[key1], 'Quantity'), function(memo, num){ return memo + num; }, 0);
								angular.forEach(vm.activeOrders[key1],function(val, key){
									if(val.ShippingAddress && val.xp.deliveryFeesDtls){
										val.ShippingAddress.deliveryDate = val.xp.deliveryDate;
										val.ShippingAddress.lineID = val.ID;
										val.ShippingAddress.DeliveryMethod = val.xp.DeliveryMethod;
										vm.AvoidMultipleDelryChrgs.push(val.ShippingAddress);
									}
									var dt;
									val.xp.MinDays = {};
									if(val.xp.deliveryDate){
										var dat = angular.copy(CstDateTime);
										dat.setHours(0, 0, 0, 0);
										if(new Date(val.xp.deliveryDate) < dat)
											delete val.xp.deliveryDate;
										else
											val.xp.deliveryDate = new Date(val.xp.deliveryDate);
									}
									if(val.xp.MinDate){
										angular.forEach(val.xp.MinDate, function(val1, key1){
											dt = angular.copy(CstDateTime);
											dt = dt.setDate(dt.getDate() + val1);
											val.xp.MinDays[key1] = new Date(dt);
										}, true);
										val.xp.MinDays['MinToday'] = new Date(angular.copy(CstDateTime));
										if(val.xp.MinDate.LocalDelivery){
											dt = angular.copy(CstDateTime);
											//dt.setHours(0, 0, 0, 0);
											if(dt.getHours() >= 12)
												dt = dt.setDate(dt.getDate() + val.xp.MinDate.LocalDelivery + 1);
											else
												dt = dt.setDate(dt.getDate() + val.xp.MinDate.LocalDelivery);
											val.xp.MinDays['MinToday'] = new Date(dt);
										}	
									}else{
										dt = angular.copy(CstDateTime);
										val.xp.MinDate = {};
										if(dt.getHours() >= 12)
												val.xp.MinDays['MinToday'] = dt.setDate(dt.getDate() + 1);
										else
											val.xp.MinDays['MinToday'] = dt;
									}
									val.varientsOptions = {};
									if(val.Product.xp != null && val.Product.xp.Specs_Options){
										val.varientsOptions.Size = val.Product.xp.Specs_Options.Cont_Size;
										val.varientsOptions.Color = val.Product.xp.Specs_Options.Color;
									}
									if(val.ShippingAddress!=null){
										BuildOrderService.GetPhoneNumber(val.ShippingAddress.Phone).then(function(res){
											val.ShippingAddress.Phone1 = res[0];
											val.ShippingAddress.Phone2 = res[1];
											val.ShippingAddress.Phone3 = res[2];
										});
										val.ShippingAddress.Zip = parseInt(val.ShippingAddress.Zip);
									}
									if(!val.xp.addressType)
										val.xp.addressType = "Residence";
									if(val.xp.addressType=="InStorePickUp"){
										val.xp.pickupDate = new Date(val.xp.pickupDate);
										val.willSearch = val.ShippingAddress.CompanyName;
									}
								});
							});
							});
						vm.ActiveOrderCartLoader = BuildOrderService.PatchOrder(vm.order, res).then(function(data){
							angular.element(document.getElementById("order-checkout")).scope().orderTotal = data.Total;
							vm.orderTotal = data.Total;
							vm.order = data;
						});
					});
				}
				else{
					vm.ActiveOrderCartLoader = OrderCloud.As().LineItems.List(vm.order.ID).then(function(res){
						if(res.Items.length==0)
							angular.element(document.getElementById("build-order-footer")).scope().buildOrderDown.buildorderfooter=true;
						vm.AvoidMultipleDelryChrgs = [];
						if(res.Items.length==0 && vm.order.TaxCost != 0){
							OrderCloud.Orders.Patch(vm.order.ID, {"ShippingCost": 0, "TaxCost": 0}).then(function(res){
								vm.order = res;
							}).catch(function(){
								OrderCloud.Orders.Get(vm.order.ID).then(function(res){
									vm.order = res;
								});
							});
						}
						vm.ActiveOrderCartLoader = LineItemHelpers.GetProductInfo(res.Items).then(function(data){
							vm.OrderConfirmGrouping = _.groupBy(data, function(value){
								if(value.ShippingAddress!=null)
									return value.ShippingAddress.FirstName + ' ' + value.ShippingAddress.LastName + ' ' + value.ShippingAddress.Zip + ' ' + (value.ShippingAddress.Street1).split(/(\d+)/g)[1] + ' ' + value.xp.DeliveryMethod + ' ' + value.xp.deliveryDate;
							});
							angular.forEach(vm.OrderConfirmGrouping, function(val, key){
								if(val[0].ShippingAddress!=null){
									val[0].LineTotal = _.reduce(_.pluck(val, 'LineTotal'), function(memo, num){ return memo + num; }, 0);
									val[0].xp.deliveryCharges = _.reduce(_.map(val, function(item){return item.xp.deliveryCharges;}), function(memo, num){ return memo + num; }, 0);
									val[0].xp.Tax = _.reduce(_.map(val, function(item){return item.xp.Tax;}), function(memo, num){ return memo + num; }, 0);
									val[0].xp.TotalCost = _.reduce(_.map(val, function(item){return item.xp.TotalCost;}), function(memo, num){ return memo + num; }, 0);
								}	
							}, true);
							data = _.groupBy(data, function(obj){
								return obj.ProductID;
							});
							BuildOrderService.OrderOnHoldRemove(res.Items, vm.order.ID).then(function(dt){
								console.log("Order OnHold Removed....");
							});
							vm.lineItemProducts = [];
							vm.activeOrders = data;
							$scope.prodQty = {};
							angular.forEach(data,function(val1, key1){
								vm.lineItemProducts.push(key1);
								$scope.prodQty[key1] = _.reduce(_.pluck(data[key1], 'Quantity'), function(memo, num){ return memo + num; }, 0);
								angular.forEach(vm.activeOrders[key1],function(val, key){
									if(val.ShippingAddress && val.xp.deliveryFeesDtls){
										val.ShippingAddress.deliveryDate = val.xp.deliveryDate;
										val.ShippingAddress.lineID = val.ID;
										val.ShippingAddress.DeliveryMethod = val.xp.DeliveryMethod;
										vm.AvoidMultipleDelryChrgs.push(val.ShippingAddress);
									}
									var dt;
									val.xp.MinDays = {};
									if(val.xp.deliveryDate){
										var dat = angular.copy(CstDateTime);
										dat.setHours(0, 0, 0, 0);
										if(new Date(val.xp.deliveryDate) < dat)
											delete val.xp.deliveryDate;
										else
											val.xp.deliveryDate = new Date(val.xp.deliveryDate);
									}
									if(val.xp.MinDate){
										angular.forEach(val.xp.MinDate, function(val1, key1){
											dt = angular.copy(CstDateTime);
											dt = dt.setDate(dt.getDate() + val1);
											val.xp.MinDays[key1] = new Date(dt);
										}, true);
										val.xp.MinDays['MinToday'] = new Date(angular.copy(CstDateTime));
										if(val.xp.MinDate.LocalDelivery){
											dt = angular.copy(CstDateTime);
											//dt.setHours(0, 0, 0, 0);
											if(dt.getHours() >= 12)
												dt = dt.setDate(dt.getDate() + val.xp.MinDate.LocalDelivery + 1);
											else
												dt = dt.setDate(dt.getDate() + val.xp.MinDate.LocalDelivery);
											val.xp.MinDays['MinToday'] = new Date(dt);
										}	
									}else{
										dt = angular.copy(CstDateTime);
										val.xp.MinDate = {};
										if(dt.getHours() >= 12)
												val.xp.MinDays['MinToday'] = dt.setDate(dt.getDate() + 1);
										else
											val.xp.MinDays['MinToday'] = dt;
									}
									val.varientsOptions = {};
									if(val.Product.xp != null && val.Product.xp.Specs_Options){
										val.varientsOptions.Size = val.Product.xp.Specs_Options.Cont_Size;
										val.varientsOptions.Color = val.Product.xp.Specs_Options.Color;
									}
									if(val.ShippingAddress!=null){
										BuildOrderService.GetPhoneNumber(val.ShippingAddress.Phone).then(function(res){
											val.ShippingAddress.Phone1 = res[0];
											val.ShippingAddress.Phone2 = res[1];
											val.ShippingAddress.Phone3 = res[2];
										});
										val.ShippingAddress.Zip = parseInt(val.ShippingAddress.Zip);
									}
									if(!val.xp.addressType)
										val.xp.addressType = "Residence";
									if(val.xp.addressType=="InStorePickUp"){
										val.xp.pickupDate = new Date(val.xp.pickupDate);
										val.willSearch = val.ShippingAddress.CompanyName;
									}
								});
							});
						});
						vm.ActiveOrderCartLoader = BuildOrderService.PatchOrder(vm.order, res).then(function(data){
							angular.element(document.getElementById("order-checkout")).scope().orderTotal = data.Total;
							vm.orderTotal = data.Total;
							vm.order = data;
						});
					});
				}
			}
		}else{
			vm.lineItemProducts = [];
			setTimeout(function(){
				angular.element(document.getElementById("build-order-footer")).scope().buildOrderDown.buildorderfooter = true;
			}, 0);
		}
	};
	if($stateParams.SearchType!="Products" && $stateParams.SearchType != 'plp' && $stateParams.SearchType != 'BuildOrder' && $stateParams.SearchType != 'PDP' && $stateParams.SearchType != 'Workshop')
		vm.getLineItems();
	$scope.cancelOrder = function(){
		OrderCloud.As().Orders.Cancel(vm.order.ID).then(function(data){
			vm.order = data;
			vm.getLineItems();
		}).catch(function(){
			vm.getLineItems();
		});
	};
	$scope.saveForLater = function(note){
		/*OrderCloud.As().Me.ListOutgoingOrders(null, 1, 100, null, null, {"Status":"Unsubmitted"}).then(function(res){
			angular.forEach(res.Items,function(val, key){
				if(val.FromUserID == $stateParams.ID && val.ID == vm.order.ID){
					OrderCloud.As().Orders.Patch(vm.order.ID,{"xp":{"SavedOrder":{"Name":note,"Flag":true}}}).then(function(res1){
						console.log("saved order successfully/removed");
					});
				}else if(val.FromUserID == $stateParams.ID && val.ID != vm.order.ID && val.xp.SavedOrder){
					OrderCloud.As().Orders.Patch(val.ID,{"xp":{"SavedOrder":{"Flag":false}}}).then(function(res2){
						console.log("saved order successfully/removed");
					});
				}
			});
		});*/
		OrderCloud.As().Orders.Patch(vm.order.ID, {"xp":{"SavedOrder":{"Name":note,"Flag":true}}}).then(function(res1){
			console.log("saved order successfully/removed");
		}).catch(function(){
			
		});
	};
	vm.lineDtlsSubmit = function(LineItemLists, index){
		angular.forEach(vm.isOpen, function(val, key){
			vm.isOpen[key] = false;
		}, true);
		var deliverySum, tempArr = [], OrderOnHold;
		angular.forEach(LineItemLists, function(row, key){
			//deliverySum = 0;
			vm.lineItemForm[row.ID].$setPristine();
			angular.forEach(vm.HighLightErrors, function(val, key){
				if(key==row.ID){
					//val.formError = false;
					$('#'+val).css({'border': 'none'});
					delete vm.HighLightErrors[key];
				}
			}, true);
			if(row.visible == true)
				delete row.xp.CardMessage;
			row.ShippingAddress.Phone = "("+row.ShippingAddress.Phone1+") "+row.ShippingAddress.Phone2+"-"+row.ShippingAddress.Phone3;
			delete row.xp.MinDays;
			if(row.xp.addressType != "Hospital" && row.xp.addressType != "Funeral"){
				delete row.xp.PatientFName;
				delete row.xp.PatientLName;
			}
			if(row.xp.addressType=="InStorePickUp"){
				delete row.xp.deliveryDate;
				row.ShippingAddress.CompanyName = row.willSearch;
				row.xp.DeliveryMethod = "InStorePickUp";
				delete row.xp.deliveryFeesDtls;
				row.xp.deliveryCharges = 0;
			}else{
				delete row.xp.pickupDate;
			}
			if(row.Product.xp.notifyMe==true && row.xp.notifyMe)
				row.xp.notifyMe = "true";
			if(row.Product.xp.notifyMe==true && !row.xp.notifyMe)
				row.xp.notifyMe = "false";
			row.ShipFromAddressID = "testShipFrom";
			tempArr.push(OrderCloud.LineItems.Update(vm.order.ID, row.ID, row));
		}, true);
		vm.ActiveOrderCartLoader = $q.all(tempArr).then(function(res1){
			tempArr = [];
			angular.forEach(res1, function(val, key){
				var row1 = _.findWhere(LineItemLists, {ID: val.ID});
				tempArr.push(OrderCloud.LineItems.SetShippingAddress(vm.order.ID, val.ID, row1.ShippingAddress));
				if(val.xp.Status || val.OutgoingWire){
					OrderOnHold = val.xp.Status;
				}
			}, true);
			if(OrderOnHold){
				OrderCloud.As().Orders.Patch(vm.order.ID, {"xp": {"Status": "OnHold","CSRID":$cookieStore.get('OMS.CSRID'),"OrderDestination":OrderOnHold}});
			}	
			vm.ActiveOrderCartLoader = $q.all(tempArr).then(function(res2){
				vm.ActiveOrderCartLoader = TaxService.GetTax(vm.order.ID).then(function(res3){
					tempArr = [];
					angular.forEach(res3.ResponseBody.TaxLines, function(val, key){
						var row = _.findWhere(res1, {ID: val.LineNo});
						tempArr.push(OrderCloud.LineItems.Patch(vm.order.ID, val.LineNo, {"xp":{"Tax":val.Tax, "TotalCost":row.xp.deliveryCharges+row.LineTotal+val.Tax}}));
					}, true);
					vm.ActiveOrderCartLoader = $q.all(tempArr).then(function(res4){
						vm.getLineItems();
						vm.OrderConfirmPopUp = !vm.OrderConfirmPopUp;
					});
				});
			});
		});
	};
	vm.updateProdNote = function(index,note,prodID,line,parent){
		parent.activeOrders[line][0].Product.xp.productNote = note;
		parent['readOnly'+index] = false;
		parent['prodNoteShow'+index] = false;
		OrderCloud.Products.Patch(prodID,{"xp":{"productNote":note}}).then(function(data){
			
		});
	};
	vm.showNoteField = function(index){
		vm['prodNoteShow'+index] = true;
		vm['readOnly'+index] = true;
		setTimeout(function(){
			$('#prodNotes' + index).focus();
		},300);
	};
	vm.viewAddrBook = function(line){
		if(line)
			vm.recipFields = line;
		$scope.showModal = !$scope.showModal;
		if(!vm.addressesList){
			OrderCloud.As().Me.ListAddresses().then(function(res){
				vm.addressesList = res.Items;
			});
		}	
	};
	vm.viewAddrBook();
	vm.GetAboveAddresses = function(line){
		vm.TempAddressBook = [];
		angular.forEach(angular.copy(vm.activeOrders), function(val, key){
			angular.forEach(val, function(val1, key1){
				vm.TempAddressBook.push(val1.ShippingAddress);
			}, true);
		}, true);
		vm.TempAddressBook = _.uniq(vm.TempAddressBook, function(item, key, a){
			if(item!=null)
				return item.Street1;
		});
		vm.recipFields = line;
		$scope.showAboveRecipientModal = !$scope.showAboveRecipientModal;
	}
	vm.getBookAddress = function(addressData, TempAddr){
		if(vm.recipFields.ShippingAddress==null)
			vm.recipFields.ShippingAddress = {};
		vm.recipFields.ShippingAddress = addressData;
		vm.recipFields.ShippingAddress.Zip = parseInt(addressData.Zip);
		if(TempAddr=="TempAddr")
			$scope.showAboveRecipientModal = !$scope.showAboveRecipientModal;
		else	
			$scope.showModal = !$scope.showModal;
		if(addressData.Phone){
			BuildOrderService.GetPhoneNumber(addressData.Phone).then(function(res){
				vm.recipFields.ShippingAddress.Phone1 = res[0];
				vm.recipFields.ShippingAddress.Phone2 = res[1];
				vm.recipFields.ShippingAddress.Phone3 = res[2];
			});
		}
		vm.GetDeliveryFees(vm.recipFields, vm.lineItemForm[vm.recipFields.ID]);
	};
	$scope.showModal = false;
	$scope.showAboveRecipientModal = false;
	var storesData;
	BuildOrderService.GetStores().then(function(res){
		storesData = res;
		vm.storeNames = _.pluck(res, 'CompanyName');
	});
	
	$scope.storesDtls = function(item, line){
		var filt = _.filter(storesData, function(row){
			return _.indexOf([item],row.CompanyName) > -1;
		});
		if(line.ShippingAddress == null)
			line.ShippingAddress = {};
		filt[0].FirstName = line.ShippingAddress.FirstName;
		filt[0].LastName = line.ShippingAddress.LastName;
		line.ShippingAddress = filt[0];
		line.ShippingAddress.Zip = parseInt(filt[0].Zip);
		BuildOrderService.GetPhoneNumber(line.ShippingAddress.Phone).then(function(res){
			line.ShippingAddress.Phone1 = res[0];
			line.ShippingAddress.Phone2 = res[1];
			line.ShippingAddress.Phone3 = res[2];
		});
		vm.GetDeliveryFees(line, vm.lineItemForm[line.ID]);
	};
	vm.AllDtls = function(item, line, form){
		var list;
		if(line.xp.addressType=="Hospital")
			list = vm.HospitalsList;
		if(line.xp.addressType=="School")
			list = vm.SchoolsList;
		if(line.xp.addressType=="Funeral"){
			list = vm.FuneralsList;
			delete line.churchSearch;
		}	
		if(line.xp.addressType=="Church"){
			list = vm.ChurchsList;
			delete line.funeralSearch;
		}
		if(line.xp.addressType=="Cemetery"){
			list = vm.CemeterysList;
		}
		var filt = _.filter(list, function(row){
			return _.indexOf([item],row.CompanyName) > -1;
		});
		if(line.ShippingAddress==null)
			line.ShippingAddress={};
		line.ShippingAddress.Street1 = filt[0].Street1;
		line.ShippingAddress.Street2 = filt[0].Street2;
		line.ShippingAddress.City = filt[0].City;
		line.ShippingAddress.State = filt[0].State;
		line.ShippingAddress.Zip = parseInt(filt[0].Zip);
		line.ShippingAddress.Country = filt[0].Country;
		BuildOrderService.GetPhoneNumber(filt[0].Phone).then(function(res){
			line.ShippingAddress.Phone1 = res[0];
			line.ShippingAddress.Phone2 = res[1];
			line.ShippingAddress.Phone3 = res[2];
		});
		vm.GetDeliveryFees(line, form);
	};
	var deliveryCharges, SameDate;
	BuildOrderService.GetBuyerDtls().then(function(res){
		deliveryCharges = res.xp.ZipCodes;
		vm.buyerXp = res.xp;
	});
	vm.changeAddrType = function(addressType, line, form, onload){
		if(vm.TempAddrType != addressType && vm.TempAddrType){
			line.ShippingAddress = null;
			vm.TempAddrType = addressType;
		}	
		vm.lineItemForm[line.ID].$setPristine();
		if(addressType == "Hospital" && !vm.HospitalNames){
			vm.GetAllList("Hospitals");
		}
		if(addressType == "Funeral" && !vm.FuneralNames){
			vm.GetAllList("FuneralHome");
		}
		if(addressType == "Church" && !vm.ChurchNames){
			vm.GetAllList("Church");
		}
		if(addressType == "School" && !vm.SchoolNames){
			vm.GetAllList("School");
		}
		if(addressType == "Cemetery" && !vm.CemeteryNames){
			vm.GetAllList("Cemetery");
		}
		if((addressType != "InStorePickUp" || line.willSearch) && onload != "onload"){
			vm.GetDeliveryFees(line, form);
		}
	}
	vm.GetAllList = function(AddrType){
		BuildOrderService.GetHosChurchFuneral(AddrType).then(function(res){
			console.log(res);
			if(AddrType=="Hospital"  || AddrType=="Hospitals"){
				vm.HospitalNames = res.data.Names;
				vm.HospitalsList = res.data.List;
			}
			if(AddrType=="FuneralHome" || AddrType=="Funeral"){
				vm.FuneralNames = res.data.Names;
				vm.FuneralsList = res.data.List;
			}
			if(AddrType=="Church"){
				vm.ChurchNames = res.data.Names;
				vm.ChurchsList = res.data.List;
			}
			if(AddrType=="School"){
				vm.SchoolNames = res.data.Names;
				vm.SchoolsList = res.data.List;
			}
			if(AddrType=="Cemetery"){
				vm.CemeteryNames = res.data.Names;
				vm.CemeterysList = res.data.List;
			}
		});
	}
	
	vm.DateSelected = function(line){
		if(line.xp.deliveryDate){
			if(line.xp.deliveryDate != SameDate){
				SameDate = line.xp.deliveryDate;
				vm.GetDeliveryFees(line, vm.lineItemForm[line.ID]);
			}
		}	
	}
	$scope.editProduct = function(line){
		angular.element(document.getElementById("buildOrder-pdp-container")).scope().$parent.$parent.$parent.buildOrder.productdata(line[0].ProductID, line[0].varientsOptions, line);
	};
	vm.SaveAllLineItems = function(){
		var LineItemLists = [], arr = [], arr2 = [], arr3 = [], DeliveryNotAvailable, id, obj = {};
		angular.forEach(vm.activeOrders, function(val, key){
			LineItemLists = _.union(LineItemLists, val);
		});
		vm.HighLightErrors = {};
		vm.lineItemForm = _.omit(vm.lineItemForm, function(value, key) {
			return _.isUndefined(value);
		});
		angular.forEach(vm.lineItemForm, function(val, key){
			if(val!=undefined){
				val.$submitted = true;
				arr.push(val.$valid);
				arr2.push(val.$pristine);
				arr3.push(val.invalidAddress);
				if(!val.$valid || val.invalidAddress || val.DeliveryNotAvailable){
					//val.formError = true;
					id = $('#lineItemForm_' + key).parent().parent().attr('id');
					$('#'+id.replace('panel','tab')).css({'border':'1px solid #f32929','border-bottom':'2px solid #f32929'});
					obj[key] = id.replace('panel','tab');
					vm.HighLightErrors[key] = id.replace('panel','tab');
					DeliveryNotAvailable = true;
				}else{
					//val.formError = false;
					DeliveryNotAvailable = false;
					id = $('#lineItemForm_' + key).parent().parent().attr('id');
					if(id)
						$('#'+id.replace('panel','tab')).css({'border': 'none'});
					delete vm.HighLightErrors[key];
				}
			}
		},true);
		if(!_.contains(arr, false) && _.contains(arr2, false) && !_.contains(arr3, true) && !DeliveryNotAvailable && vm.lineItemProducts.length != 0){
			vm.lineDtlsSubmit(LineItemLists, 0);
		}
		if(!_.contains(arr2, false) && !_.contains(arr, false) && !_.contains(arr3, true) && !DeliveryNotAvailable && vm.lineItemProducts.length != 0){
			vm.OrderConfirmPopUp = !vm.OrderConfirmPopUp;
		}
	};
	vm.DeleteToolTip = {
		templateUrl: 'DeleteToolTip.html'
	};
	vm.closeDeletePopover = function (e, lineID) {
		e.preventDefault();
		e.stopPropagation();
		vm.CancelDeleteToolTip[lineID] = false;
	};
	vm.closeOusideClick = function () {
		vm.CancelDeleteToolTip[vm.OutsideClickToolTipIndex] = false;
	};
	vm.DeleteToolTipPopOver = function(e, lineID){
		e.preventDefault();
		e.stopPropagation();
		vm.closeOusideClick();
		vm.CancelDeleteToolTip[lineID] = true;
		vm.OutsideClickToolTipIndex = lineID;
	};
	vm.GetDeliveryFees = function(line, form){
		if(form.$valid){
			var id = $('#lineItemForm_' + line.ID).parent().parent().attr('id');
			$('#'+id.replace('panel','tab')).css({'border': 'none'});
			if(vm.HighLightErrors)
				delete vm.HighLightErrors[line.ID];
		}
		if(line.ShippingAddress.City != "Select City" && !line.xp.BaseLineItemID){
			vm.AssemblyDtlsAutoPopulate(line);
			vm.ActiveOrderCartLoader = BuildOrderService.DeliveryFeesService(line, form, vm, CstDateTime).then(function(res){
				console.log(res);
			});
		}	
	};
	vm.disabledDates = function (data) {
		return (data.mode === 'day' && (data.date.getDay() === 0));
	};
	vm.SelectedCity = function(city, line, form){
		line.ShippingAddress.City = city;
		vm.AssemblyDtlsAutoPopulate(line);
		vm.GetDeliveryFees(line, form);
	};
	vm.AssemblyDtlsAutoPopulate = function(lineitem){
		_.filter(vm.activeOrders, function(arr){
			_.each(arr, function(obj){
				_.each(lineitem.xp.AssemblyLineItemsList, function(val){
					if(val==obj.ID){
						obj.ShippingAddress = lineitem.ShippingAddress;
						obj.xp.deliveryDate = lineitem.xp.deliveryDate;
						obj.xp.CardMessage = lineitem.xp.CardMessage;
						obj.xp.addressType = lineitem.xp.addressType;
						obj.xp.productNote = lineitem.xp.productNote;
						obj.xp.deliveryNote = lineitem.xp.deliveryNote;
						obj.xp.DeliveryMethod = lineitem.xp.DeliveryMethod;
						obj.xp.PatientFName = lineitem.xp.PatientFName;
						obj.xp.PatientLName = lineitem.xp.PatientLName;
					}
				});	
			});
		});
	};

	vm.scrollUp = function(id) {
		 // $location.hash('bottom');

		 //anchorSmoothScroll.ScrollTo(id);
		/*var old = $location.hash();
     
      $location.hash('scrollTop');

     
      $location.hash(old);*/
      $anchorScroll(id);
    };
}

function buildOrderPLPController(productList, $stateParams, alfrescoAccessURL) {
	var vm = this;
	vm.alfrecoTct=localStorage.getItem("alfrescoTicket");
	vm.alfrescoAccessURL=alfrescoAccessURL;
}

function buildOrderPDPController($scope, $sce, alfrescoAccessURL) {
	var vm = this; vm.alfticket = localStorage.getItem("alfrescoTicket");
	vm.upselloverlay=false;
	vm.alfrescoAccessURL=alfrescoAccessURL;
	vm.viewCareGuide = false;
	$scope.viewCareGuide=function(){
		vm.viewCareGuide = !vm.viewCareGuide;
	}
	vm.getArticle=function(data){
		vm.articleURL="", vm.articleImgURL="";
		vm.articleURL=$sce.trustAsResourceUrl(vm.alfrescoAccessURL+data+"?alf_ticket="+vm.alfticket);
		var str=data.substring(data.lastIndexOf("/") + 1, data.length);
		var articleID=str.substring(0, str.lastIndexOf(".") + 0);
		vm.articleImgURL=vm.alfrescoAccessURL+"/imagefinder/"+articleID+"?alf_ticket="+vm.alfticket;
	}
}
  
function buildOrderSummaryController($scope, $state, ocscope, buyerid, $cookieStore, $stateParams, $exceptionHandler, Order, CurrentOrder, AddressValidationService, LineItemHelpers, OrderCloud, $http, BuildOrderService, $q, SearchData, $sce, CstDateTime, TaxService, alfrescoAccessURL) {
    var vm = this;
	vm.alfticket = localStorage.getItem("alfrescoTicket");
	vm.alfrescoAccessURL=alfrescoAccessURL;
	console.log("buildOrderSummaryController alfticket:",vm.alfticket);
	console.log("buildOrderSummaryController alfrescoAccessURL:",vm.alfrescoAccessURL);
    if($stateParams.SearchType != 'Products' && $stateParams.SearchType != 'PDP' && $stateParams.SearchType != 'BuildOrder' && $stateParams.SearchType != 'plp' && $stateParams.SearchType!='Workshop'){
		vm.order = Order;
	}
	else if($stateParams.SearchType == 'Products' || $stateParams.SearchType == 'PDP' || $stateParams.SearchType == 'BuildOrder' || $stateParams.SearchType == 'plp'){
		vm.order=angular.element(document.getElementById("BuildOrderRightNav")).scope().buildOrderRight.order;
	}
	vm.selectUser = function(user){	
		vm.showDetails=user;		
		$scope.showUser=true;
	}
	vm.openUser=function(data){
        var tokenrequest={
			"ClientID": "8836BE8D-710A-4D2D-98BF-EDBE7227E3BB",
			"Claims": [
				ocscope
			]
		}
		var anonymoustoken=$cookieStore.get("OMS.impersonation.token");
        OrderCloud.Users.GetAccessToken(data.ID, tokenrequest).then(function(buyertoken){
        	console.log("buyertoken",buyertoken);
        	$http({
	            method: 'PUT',
	            dataType: "json",
	            url: "https://api.ordercloud.io/v1/buyers/"+buyerid+"/orders?tempUserToken="+anonymoustoken,
	            headers: {
	            	'Authorization':'Bearer '+ buyertoken.access_token,
	                'Content-Type': 'application/json'
	            }
	        }).success(function (data3, status, headers, config) {
	        	angular.element(document.getElementById("buildorder")).scope().$parent.buildOrder.guestUserModal=false;
				var anonymoustoken=$cookieStore.get("OMS.impersonation.token");
				OrderCloud.Orders.Get(vm.order.ID).then(function(resp){
					console.log(resp);
					$state.go('checkout', {ID:$stateParams.ID, FromUserID:resp.FromUserID}, {reload:true});
				});
	        }).error(function (data, status, headers, config) {
				console.log("alfresco error",data3);
	        });
        });
	};
	vm.statechange = function(){
		angular.element(document.getElementById("buildorder")).scope().$parent.buildOrder.guestUserModal=false;
		$stateParams.ID=vm.order.FromUserID;
		if($stateParams.SearchType == 'Products' || $stateParams.SearchType == 'BuildOrder' || $stateParams.SearchType == 'PDP' || $stateParams.SearchType == 'plp'){
			$state.go('checkout', {ID:$stateParams.ID}, {reload:true});
		}
	};
	vm.grouping = function(data){
		var totalCost = 0;
		vm.AvoidMultipleDelryChrgs = [];
		BuildOrderService.OrderOnHoldRemove(data, vm.order.ID).then(function(dt){
			console.log("Order OnHold Removed....");
		});
		data = _.groupBy(data, function(value){
			if(value.ShippingAddress != null){
				totalCost += value.xp.TotalCost;
				value.xp.deliveryCharges = 0;
				angular.forEach(value.xp.deliveryFeesDtls, function(val, key){
					value.xp.deliveryCharges += parseFloat(val);
				});
				value.ShippingAddress.deliveryDate = value.xp.deliveryDate;
				value.ShippingAddress.lineID = value.ID;
				value.ShippingAddress.DeliveryMethod = value.xp.DeliveryMethod;
				value.xp.ProductImageUrl = value.xp.ProductImageUrl;
				if(value.xp.deliveryFeesDtls)
					value.ShippingAddress.deliveryPresent = true;
				vm.AvoidMultipleDelryChrgs.push(value.ShippingAddress);
				return value.ShippingAddress.FirstName + ' ' + value.ShippingAddress.LastName + ' ' + value.ShippingAddress.Zip + ' ' + (value.ShippingAddress.Street1).split(/(\d+)/g)[1] + ' ' + value.xp.DeliveryMethod + ' ' + value.xp.deliveryDate;
			}
		});
		delete data.undefined;
		$scope.lineVal = [];
		$scope.lineTotal = {};
		vm.TotalCost = {};
		vm.TotalTax = {};
		for(var n in data){
			$scope.lineVal.push(n);
			$scope.lineTotal[n] = _.reduce(_.pluck(data[n], 'LineTotal'), function(memo, num){ return memo + num; }, 0);
			vm.TotalCost[n] = 0;
			vm.TotalTax[n] = 0;
			var totalcost = 0;
			_.each(data[n], function(val,index){
				vm.TotalCost[n] += val.xp.deliveryCharges+val.xp.Tax+val.LineTotal;
				vm.TotalTax[n] += parseFloat(val.xp.Tax);
				if(val.xp.deliveryFeesDtls){
					data[n] = _.reject(data[n], val);
					data[n].unshift(val);
				}
			});
			data[n][0].TotalCost = vm.TotalCost[n];
			data[n][0].TotalTax = vm.TotalTax[n];
		}
		vm.activeOrders = _.toArray(data);
	};
	vm.orderSummaryShow = function(order){
		if(vm.order){
			console.log(vm.order);
			vm.OrderSummaryLoader = OrderCloud.As().LineItems.List(vm.order.ID).then(function(res){
				vm.OrderSummaryLoader = LineItemHelpers.GetProductInfo(res.Items).then(function(data){
					vm.grouping(data);
				});
				BuildOrderService.PatchOrder(vm.order, res).then(function(data){
					angular.element(document.getElementById("order-checkout")).scope().orderTotal = data.Total;
				});
			});
		}else{
			vm.OrderSummaryLoader = BuildOrderService.GetUnsubmittedOrder().then(function(res2){
				if(res2 != 0){
					vm.order = res2;
					vm.orderSummaryShow();
				}
			});
		}
	};
	vm.orderSummaryShow();
    vm.deleteProduct = function(lineitem) {
		vm.OrderSummaryLoader = OrderCloud.As().LineItems.Delete(vm.order.ID, lineitem.ID).then(function() {
			vm.orderSummaryShow();
		}).catch(function(ex) {
			$exceptionHandler(ex);
		});
    };
	var deliveryCharges;
	BuildOrderService.GetBuyerDtls().then(function(res){
		deliveryCharges = res.xp.ZipCodes;
		vm.buyerXp = res.xp;
	});
	
	vm.lineDtlsSubmit = function(recipient, index){
		var deliverySum = 0, TempArr = [];
		angular.forEach(recipient, function(val, key){
			angular.forEach(val.xp.deliveryFeesDtls, function(val1, key1){
				deliverySum += parseFloat(val1);
			});
			delete val.xp.Discount;
			val.ShipFromAddressID = "testShipFrom";
			TempArr.push(OrderCloud.As().LineItems.Update(vm.order.ID, val.ID, val));
		}, true);
		vm.OrderSummaryLoader = $q.all(TempArr).then(function(result){
			TempArr = [];
			angular.forEach(recipient, function(val, key){
				TempArr.push(OrderCloud.As().LineItems.SetShippingAddress(vm.order.ID, val.ID, val.ShippingAddress));
			}, true);
			vm.OrderSummaryLoader = $q.all(TempArr).then(function(result2){
				vm.OrderSummaryLoader = TaxService.GetTax(vm.order.ID).then(function(res3){
					TempArr = [];
					angular.forEach(res3.ResponseBody.TaxLines, function(val, key){
						var row = _.findWhere(result2, {ID: val.LineNo});
						row.xp.deliveryCharges = 0;
						_.filter(row.xp.deliveryFeesDtls, function(val){
							row.xp.deliveryCharges += parseFloat(val);
						});
						TempArr.push(OrderCloud.As().LineItems.Patch(vm.order.ID, val.LineNo, {"xp":{"Tax":val.Tax, "TotalCost":row.xp.deliveryCharges+row.LineTotal+val.Tax}}));
					}, true);
					vm.OrderSummaryLoader = $q.all(TempArr).then(function(res4){
						var temp = {"Items":res4};
						BuildOrderService.PatchOrder(vm.order, temp).then(function(){
							vm.orderSummaryShow();
						});
					});
				});
			});
		});
	};
	vm.EditSaveCharges = function(array){
		var line = array[0];
		line.EditCharges = !line.EditCharges;
		if(!line.EditCharges)
			vm.lineDtlsSubmit(array, 0);
	};
	vm.GetDeliveryFees = function(array, index){
		var line = array[index], arr = [];
		angular.forEach(array, function(val, key){
			val.ShippingAddress = array[0].ShippingAddress;
		}, true);
		if(line.ShippingAddress.City != "Select City" && !line.xp.BaseLineItemID){
			vm.OrderSummaryLoader = BuildOrderService.DeliveryFeesService(line, vm, vm, CstDateTime).then(function(res){
				console.log(res);
			});
		}
	};
	vm.SelectedCity = function(city, line){
		line[0].ShippingAddress.City = city;
		vm.GetDeliveryFees(line, 0);
	};
}

function BuildOrderService( $q, $window, $stateParams, ocscope, buyerid, OrderCloud, $http, alfrescoDocsUrl, alfrescoAccessURL, Underscore, $cookieStore, GetCstTime, algolia, AddressValidationService, GoogleAPI) {
    var upselldata = [];
    var crossdata = [];
    var productdetail = [];
    var optionvalues = [];
    var productID;
    var service = {
		//GetProductDetails: _getProductDetails,
		GetUpsellDetails: _getUpsellDetails,
		GetCrossDetails: _getCrossDetails,
		GetProductID: _getProductID,
		GetSpendingAccount: _getSpendingAccount,
		GetPhoneNumber: _GetPhoneNumber,
		GetBuyerDtls: _GetBuyerDtls,
		CompareDate: _CompareDate,
		GetPreceedingZeroDate: _GetPreceedingZeroDate,
		GetHosChurchFuneral: _GetHosChurchFuneral,
		GetStores: _GetStores,
		OrderOnHoldRemove: _OrderOnHoldRemove,
		PatchOrder: _PatchOrder,
		GetProductImages: _getProductImages,
		GetProductList:_getProductList,
		GetSeqProd:_getSeqProd,
		GetExtras:_getExtras,
		AdminLogin: _adminLogin,
		GetAttributeImages:_getAttributeImages,
		DeliveryFeesService:_deliveryFeesService,
		GetAlgoliaResults:_getAlgoliaResults,
		GetUnsubmittedOrder: _getUnsubmittedOrder
    }
    function _adminLogin(){
    	var data = $.param({
            grant_type: 'client_credentials',
            scope: ocscope,
            client_id: '8836BE8D-710A-4D2D-98BF-EDBE7227E3BB'

        });
        var defferred = $q.defer();
        $http({
                method: 'POST',
                dataType:"json",
                url:  "https://auth.ordercloud.io/oauth/token",
                data: data,
                headers: {
                    'Content-Type': 'application/json'
                }
            }).success(function (data, status, headers, config) {
				OrderCloud.Auth.SetImpersonationToken(data.access_token);
                defferred.resolve(data);
            }).error(function (data, status, headers, config) {
                defferred.reject(data);
            });
            return defferred.promise;
    }
	/*function _getProductDetails(data) {
		var deferred = $q.defer();
		OrderCloud.Products.Get(data).then(function(list) {
			console.log('pdp',list);
			productdetail = list;
			if(productdetail.Type == "VariableText"){
				OrderCloud.Specs.ListProductAssignments(null, list.ID).then(function(data){
					productdetail.specID = data.Items[0].SpecID;
					OrderCloud.Specs.ListOptions(data.Items[0].SpecID).then(function(res){
						productdetail.listOptions = res.Items;
						var size = data.Items[0].SpecID.split('_');
						var len = size.length,obj2 = {}, options = [];
						var  w = [];
						for (var i=0;i<len;i++){
							w[size[i+1]] = [];
						}
						var filt = _.filter(res.Items, function(row,index){
							_.each(row.Value.split('_'), function(val,index){
								w[size[index+1]].push(val);
							});
						}); 
						for (var i=1;i<len;i++){
							var obj = {};
							obj.Type = size[i];
							obj.Option = _.uniq(w[size[i]]);
							options.push(obj);
						}
						productdetail.options = options;
						console.log(JSON.stringify(productdetail));
						productdetail.varientsOption = options[0].Option[0]+"_"+options[1].Option[0];
						var filt = _.findWhere(productdetail.listOptions, {ID: productdetail.varientsOption});
						productdetail.prodPrice = filt.PriceMarkup;
						deferred.resolve(productdetail);
					});
				});
			}
		});
		return deferred.promise;
	}*/
	
    function _getProductID(ID) {
		productID = ID;
		console.log(productID);
		return productID;
    }
	
    function _getSpendingAccount(data) {
		var deferred = $q.defer();
		OrderCloud.SpendingAccounts.ListAssignments(null, data).then(function(list) {
			deferred.resolve(list);
		});
		return deferred.promise;
    }

    function _getUpsellDetails(prodID) {
		var deferred = $q.defer();
		OrderCloud.Products.Get(prodID).then(function(data) {
			var upsellproddata = [];
			angular.forEach(data.xp.Upsell, function(cat1, key1){
				for(var i = 0;i< Object.keys(cat1).length;i++){
					var catQue = [];
					catQue.push((function () {
						var d = $q.defer();
						OrderCloud.Categories.Get(Object.keys(cat1)).then(function(catdata){
							d.resolve(catdata);
						})
						return d.promise;
					})());
					$q.all(catQue).then(function(res){
					});
				}
			})
			deferred.resolve(upsellproddata);
		});
		return deferred.promise;
    }

    function _getCrossDetails(prodID){
		var deferred = $q.defer();
		OrderCloud.Products.Get(prodID).then(function(data){
			var crossdata = [];
			angular.forEach(data.xp.Cross, function(cat1, key1){
				OrderCloud.Products.Get(cat1).then(function(data){
					crossdata.push(data);
				})
			})
			deferred.resolve(crossdata);
		});
		return deferred.promise;
    }
	
	function _GetPhoneNumber(phn){
		var d = $q.defer();
		var arr = [];
		var init = phn.indexOf('(');
		var fin = phn.indexOf(')');
		arr.push(parseInt(phn.substr(init+1,fin-init-1)));
		init = phn.indexOf(')');
		fin = phn.indexOf('-');
		arr.push(parseInt(phn.substr(init+1,fin-init-1)));
		init = phn.indexOf('-');
		arr.push(parseInt(phn.substr(init+1,phn.length)));
		d.resolve(arr);
		return d.promise;
	}
	function _GetBuyerDtls(){
		var d = $q.defer();
		OrderCloud.Buyers.Get().then(function(res){
			d.resolve(res);
		});
		return d.promise;
	}
	function _CompareDate(endDate){
		var d = $q.defer();
		$.ajax({
			method:"GET",
			dataType:"json",
			contentType: "application/json",
			url:GetCstTime
		}).success(function(res){
			if(endDate == res.date)
				d.resolve("1");
			else
				d.resolve(res);
		}).error(function(err){
			console.log("err"+err);
		});
		return d.promise;
	}
	function _GetPreceedingZeroDate(dt){
		var d = $q.defer(), date;
		dt = new Date(dt);
		dt = (("0" + (dt.getMonth()+1)).slice(-2))+"-"+(("0" + dt.getDate()).slice(-2))+"-"+dt.getFullYear();
		d.resolve(dt);
		return d.promise;
	}
	function _GetHosChurchFuneral(type){
		var d = $q.defer();
		OrderCloud.Addresses.List(null,null,null,null,null,{"ID":type+"-*"}).then(function(res){
			var dtls = _.pluck(res.Items, 'CompanyName');
			d.resolve({"data": {"Names": dtls, "List": res.Items}});
		});
		return d.promise;
	}
	function _GetStores(){
		var d = $q.defer();
		OrderCloud.Addresses.List(null, 1, 100, null, null, {"ID":"Store-*"}).then(function(res){
			d.resolve(res.Items);
		});
		return d.promise;
	}
	function _OrderOnHoldRemove(data, ID){
		var d = $q.defer(), OrderOnHold = _.pluck(data, 'xp');
		OrderOnHold = _.pluck(OrderOnHold, 'Status');
		if(OrderOnHold.indexOf("OnHold") == -1){
			if($stateParams.SearchType == 'Products' || $stateParams.SearchType == 'PDP' || $stateParams.SearchType == 'BuildOrder' ||  $stateParams.SearchType == 'plp'){
				OrderCloud.Orders.Patch(ID, {"xp": {"Status": null,"CSRID":$cookieStore.get('OMS.CSRID')}}).then(function(res){
					d.resolve(res);
				}).catch(function(){
					OrderCloud.Orders.Get(ID).then(function(res){
						d.resolve(res);
					});
				});
			}
			else{
				OrderCloud.As().Orders.Patch(ID, {"xp": {"Status": null,"CSRID":$cookieStore.get('OMS.CSRID')}}).then(function(res){
					d.resolve(res);
				}).catch(function(){
					OrderCloud.Orders.Get(ID).then(function(res){
						d.resolve(res);
					});
				});
			}
		}else{
			d.resolve();
		}
		return d.promise;
	}
	function _PatchOrder(order, data){
		var d = $q.defer(), delChrgs = 0, CapTotalDiscount = 0;
		angular.forEach(data.Items, function(val, key){
			angular.forEach(val.xp.deliveryFeesDtls, function(val1, key1){
				delChrgs += parseFloat(val1);
			},true);
		},true);
		if(delChrgs > 250){
			CapTotalDiscount = delChrgs - 250;
			delChrgs = 250;
		}
		if($stateParams.SearchType == 'Products' || $stateParams.SearchType == 'PDP' || $stateParams.SearchType == 'BuildOrder' || $stateParams.SearchType == 'plp'){
			OrderCloud.Orders.Patch(order.ID, {"ShippingCost": delChrgs, "xp":{"CapTotalDiscount": CapTotalDiscount}}).then(function(res){
				d.resolve(res);
			}).catch(function(){
				OrderCloud.Orders.Get(order.ID).then(function(res){
					d.resolve(res);
				});
			});
		}else{
			OrderCloud.As().Orders.Patch(order.ID, {"ShippingCost": delChrgs, "xp":{"CapTotalDiscount": CapTotalDiscount}}).then(function(res){
				d.resolve(res);
			}).catch(function(){
				OrderCloud.Orders.Get(order.ID).then(function(res){
					d.resolve(res);
				});
			});
		}
		return d.promise;
	}
	function _getProductImages(ticket) {
        var d = $q.defer();
		//console.log("ticket" + ticket + "alfrescoOmsUrl:" + alfrescoOmsUrl );
        $http({
            method: 'GET',
            dataType: "json",
            url: alfrescoDocsUrl + "Media/ProductOld?alf_ticket=" + ticket,
            headers: {
                'Content-Type': 'application/json'
            }
        }).success(function (data, status, headers, config) {
            d.resolve(data);
        }).error(function (data, status, headers, config) {
            d.reject(data);
        });
        return d.promise;
    }
	function _getAttributeImages(ticket) {
        var d = $q.defer();
		//console.log("ticket" + ticket + "alfrescoOmsUrl:" + alfrescoOmsUrl );
        $http({
            method: 'GET',
            dataType: "json",
            url: alfrescoDocsUrl + "Attributes?alf_ticket=" + ticket,
            headers: {
                'Content-Type': 'application/json'
            }
        }).success(function (data, status, headers, config) {
            d.resolve(data);
        }).error(function (data, status, headers, config) {
            d.reject(data);
        });
        return d.promise;
    }
	function _getProductList(res, productImages){
		var d = $q.defer(), ticket = localStorage.getItem("alfrescoTicket"), data, imgUrl;   
		data = Underscore.filter(res, function(row){
			var podID=row.ID;
			podID=podID.toString();
			imgUrl = Underscore.filter(productImages, function(row1){
				var str=row1.displayName;
				str=str.replace(/.jpg/g, "");
				return str.indexOf(podID) != -1;
			});
			if(imgUrl.length > 0){
				var baseImage;
				Underscore.filter(imgUrl, function(row1){
					var str=row1.displayName;
					str=str.replace(/.jpg/g, "");
					if(str==podID)
					{
						row.baseImage = alfrescoAccessURL+"/"+ row1.contentUrl + "?alf_ticket=" + ticket;
					}
				});
				row.alternativeImg = [];
				angular.forEach(imgUrl, function(value, key) {
					row.alternativeImg.push(alfrescoAccessURL+"/" + value.contentUrl + "?alf_ticket=" + ticket);;
				});
				return row.alternativeImg;
			}else
				return row;
		});
		d.resolve(data);
		return d.promise;
	}
	function _getSeqProd(sequence) {
		var vs = this, d = $q.defer(), arr = [];
		vs.listAllProducts = function(){
			angular.forEach(sequence, function(seqId, key){
				arr.push(OrderCloud.As().Me.ListProducts(null, 1, 100, null, null, {"xp.ProductCode":seqId}));
			},true);
			$q.all(arr).then(function(result){
				arr = [];
				angular.forEach(result, function(res){
					arr = _.union(arr, res.Items);
				},true);
				d.resolve(arr);
			});
		};
		if($stateParams.SearchType != 'Products' && $stateParams.SearchType != 'PDP' && $stateParams.SearchType != 'BuildOrder' && $stateParams.SearchType!=undefined && $stateParams.SearchType!='Workshop'){
				vs.listAllProducts();
		}else{
			OrderCloud.Users.GetAccessToken('gby8nYybikCZhjMcwVPAiQ', impersonation)
			.then(function(data) {
				OrderCloud.Auth.SetImpersonationToken(data['access_token']);
				vs.listAllProducts();
			});
		}
		return d.promise;
	}
	function _getExtras() {
		var data = {
			"Balloons": [
				{
					"Skuid": "bal_1",
					"Title": "Balloon Orange",
					"Price": "$4.99",
					"CategoryName": "Balloons"
				},
				{
					"Skuid": "bal_2",
					"Title": "Balloon Red",
					"Price": "$5.99",
					"CategoryName": "Balloons"
				},
				{
					"Skuid": "bal_3",
					"Title": "Balloon Blue",
					"Price": "$6.99",
					"CategoryName": "Balloons"
				},
				{
					"Skuid": "bal_4",
					"Title": "Balloon Pink",
					"Price": "$7.99",
					"CategoryName": "Balloons"
				}
			],
			"Plush": [
				{
					"Skuid": "plush_1",
					"Title": "Flora Frog 12'",
					"Price": "$5.99",
					"CategoryName": "Plush"
				},
				{
					"Skuid": "plush_2",
					"Title": " Stuffed Animal- FTD",
					"Price": "$5.99",
					"CategoryName": "Plush"
				},
				{
					"Skuid": "plush_3",
					"Title": " Baabsy Lamb",
					"Price": "$5.99",
					"CategoryName": "Plush"
				},
				{
					"Skuid": "plush_4",
					"Title": " Lin Lin Panda",
					"Price": "$5.99",
					"CategoryName": "Plush"
				}
			],
			"Sweets": [
				{
					"Skuid": "sweet_1",
					"Title": " Chocolate Stars",
					"Price": "$4.99",
					"CategoryName": "Sweets"
				},
				{
					"Skuid": "sweet_2",
					"Title": "Bittersweet chocolate",
					"Price": "$4.99",
					"CategoryName": "Sweets"
				},
				{
					"Skuid": "sweet_3",
					"Title": "Milk chocolate",
					"Price": "$4.99",
					"CategoryName": "Sweets"
				},
				{
					"Skuid": "sweet_4",
					"Title": "Chocolate Daisies",
					"Price": "$4.99",
					"CategoryName": "Sweets"
				}
			]
		}
		return data;
	}
	function _deliveryFeesService(line, form, vm, CstDateTime){
		var validatedAddress, zip, obj = {}, dlvryMethods, d = $q.defer(), dt, IsLocal;
		vm.NoDeliveryFees = false;
		angular.forEach(vm.AvoidMultipleDelryChrgs, function(val, key){
			val.deliveryDate = new Date(val.deliveryDate);
			var dt2, dt1;
			dt1 = (("0" + (val.deliveryDate.getMonth()+1)).slice(-2))+"-"+(("0" + val.deliveryDate.getDate()).slice(-2))+"-"+val.deliveryDate.getFullYear();
			if(line.xp.deliveryDate){
				line.xp.deliveryDate = new Date(line.xp.deliveryDate);
				dt2 = (("0" + (line.xp.deliveryDate.getMonth()+1)).slice(-2))+"-"+(("0" + line.xp.deliveryDate.getDate()).slice(-2))+"-"+line.xp.deliveryDate.getFullYear();
			}
			if(dt1 == dt2 && val.FirstName == line.ShippingAddress.FirstName && val.LastName == line.ShippingAddress.LastName && val.Zip == line.ShippingAddress.Zip && (val.Street1).split(/(\d+)/g)[1] == (line.ShippingAddress.Street1).split(/(\d+)/g)[1] && val.lineID != line.ID && val.DeliveryMethod == line.xp.DeliveryMethod){
				vm.NoDeliveryFees = true;
			}
		}, true);
		if((line.ShippingAddress.Zip.toString()).length == 5){
			$http.get(GoogleAPI+line.ShippingAddress.Zip).then(function(res){
				if(res.data.results[0].postcode_localities){
					if(res.data.results[0].postcode_localities.length > 1){
						line.MultipleCities = res.data.results[0].postcode_localities;
						if(line.ShippingAddress.Zip == 55038)
							line.MultipleCities.push("Columbus");
						if(line.ShippingAddress.Zip == 55082){
							line.MultipleCities.push("Grant");
							line.MultipleCities.push("West Lakeland");
						}
					}	
				}
				else
					delete line.MultipleCities;
			});
		}
		if((line.xp.deliveryDate || line.xp.pickupDate) && line.ShippingAddress.Zip && line.ShippingAddress.Street1 && line.ShippingAddress.FirstName && line.ShippingAddress.LastName){
			AddressValidationService.Validate(line.ShippingAddress).then(function(res){
				if(res.ResponseBody.ResultCode == 'Success'){
					if(form)
						form.invalidAddress = false;
					validatedAddress = res.ResponseBody.Address;
					zip = validatedAddress.PostalCode.substring(0, 5);
					line.ShippingAddress.Zip = parseInt(zip);
					line.ShippingAddress.Street1 = validatedAddress.Line1;
					line.ShippingAddress.Street2 = null;
					if(!line.MultipleCities)
						line.ShippingAddress.City = validatedAddress.City;
					line.ShippingAddress.State = validatedAddress.Region;
					line.ShippingAddress.Country = validatedAddress.Country;
					IsLocal =  _.contains(["Minneapolis", "Saint Paul", "Medina", "Anoka", "Centerville", "Stillwater", "Grant"], line.ShippingAddress.City);
					if(line.xp.DeliveryMethod!="Courier" && line.xp.DeliveryMethod!="Faster"){
						delete line.xp.DeliveryMethod;
						if(!line.xp.DeliveryMethod){
							if(IsLocal){
								line.xp.DeliveryMethod = "LocalDelivery";
							}else{
								line.xp.DeliveryMethod = "UPS";
							}
						}
					}
					OrderCloud.Categories.ListProductAssignments(null, line.ProductID).then(function(res1){
						OrderCloud.Categories.Get(res1.Items[0].CategoryID).then(function(res2){
							dlvryMethods = res2.xp.CategoryDeliveryCharges.DeliveryMethods;
							if(dlvryMethods[line.xp.DeliveryMethod]){
								delete line.xp.Destination;
								line.xp.Status = null;
								line.DeliveryNotAvailable = false;
								if(line.xp.DeliveryMethod=="LocalDelivery" || line.xp.DeliveryMethod=="Faster"){
									obj['Standard Delivery'] = vm.buyerXp.Shippers.LocalDelivery.StandardDeliveryFees;
									if(line.Quantity >= 50){
										if(line.Product.xp.Handling)
											obj['Handling Charges'] = line.Product.xp.Handling;
										if(line.xp.DeliveryMethod=="Faster"){
											if(IsLocal)
												obj['Service Fees'] = vm.buyerXp.AdditionalCharges.ServiceFees;
											else
												line.DeliveryNotAvailable = true;
										}
									}
								}
								if(line.xp.DeliveryMethod=="UPS"){
									obj['UPS Charges'] = vm.buyerXp.Shippers.UPS.UPSCharges;
								}
								if(line.xp.DeliveryMethod=="Courier"){
									obj = {};
									obj['Courier Charges'] = vm.buyerXp.Shippers.Courier.OMS;
								}
								if(res2.Name=="Gift Cards"){
									obj = {};
									obj['USPS Charges'] = vm.buyerXp.Shippers.USPS.USPSCharges;
								}
								if(res2.xp.PalletCharge)
									obj['Pallet Charge'] = res2.xp.PalletCharge;
								if(line.xp.deliveryFeesDtls && line.xp.addressType != "InStorePickUp"){
									if(line.xp.deliveryFeesDtls['Placement Charges'])
										obj['Placement Charges'] = line.xp.deliveryFeesDtls['Placement Charges'];
								}
								dt = angular.copy(CstDateTime).setHours(0, 0, 0, 0);
								if(angular.copy(CstDateTime).getHours() < 10 && dt == new Date(line.deliveryDate) && (line.xp.DeliveryMethod=="LocalDelivery" || line.xp.DeliveryMethod=="Faster")){
									obj['Same Day Delivery'] = vm.buyerXp.Shippers.LocalDelivery.StandardDeliveryFees;
									if(line.xp.addressType == "Funeral" || line.xp.addressType == "Church"){
										if(vm.buyerXp.Shippers.LocalDelivery.StandardDeliveryFees > 0){
											obj = {};
											obj['Same Day Delivery'] = vm.buyerXp.Shippers.LocalDelivery.StandardDeliveryFees;
										}else{
											obj[line.xp.addressType+" Charges"] = vm.buyerXp.Shippers.LocalDelivery.Funeral_ChurchFees;
										}
									}
								}
								line.xp.deliveryFeesDtls = obj;
								line.xp.TotalCost = 0;
								line.xp.deliveryCharges = 0;
								angular.forEach(line.xp.deliveryFeesDtls, function(val, key){
									line.xp.deliveryCharges += parseFloat(val);
								}, true);
								if(vm.NoDeliveryFees == true || line.xp.addressType=="InStorePickUp"){
									if(line.xp.deliveryFeesDtls['Placement Charges']){
										line.xp.deliveryFeesDtls = {"Placement Charges": line.xp.deliveryFeesDtls['Placement Charges']};
										line.xp.deliveryCharges = line.xp.deliveryFeesDtls['Placement Charges'];
										line.xp.TotalCost = parseInt(line.xp.deliveryFeesDtls['Placement Charges']);
									}else{
										delete line.xp.deliveryFeesDtls;
										line.xp.deliveryCharges = 0;
									}
									if(line.xp.Tax)
										line.xp.TotalCost = line.xp.TotalCost + line.xp.Tax + (line.Quantity * line.UnitPrice);
									else
										line.xp.TotalCost = line.xp.TotalCost + line.Quantity * line.UnitPrice;
								}else{
									line.xp.TotalCost = line.xp.deliveryCharges + (line.Quantity * line.UnitPrice);
									if(line.xp.Tax)
										line.xp.TotalCost = line.xp.TotalCost + line.xp.Tax;
								}
								//vm.AvoidMultipleDelryChrgs = [];
								vm.AvoidMultipleDelryChrgs = _.without(vm.AvoidMultipleDelryChrgs, _.findWhere(vm.AvoidMultipleDelryChrgs, {lineID: line.ShippingAddress.lineID}));
								vm.lineItemProducts = [];
								angular.forEach(vm.activeOrders,function(val1, key1){
									vm.lineItemProducts.push(key1);
									angular.forEach(vm.activeOrders[key1],function(val, key){
										if(val.ShippingAddress && val.xp.deliveryFeesDtls){
											val.ShippingAddress.deliveryDate = val.xp.deliveryDate;
											val.ShippingAddress.lineID = val.ID;
											val.ShippingAddress.DeliveryMethod = val.xp.DeliveryMethod;
											vm.AvoidMultipleDelryChrgs.push(val.ShippingAddress);
										}
									}, true);
								}, true);
								if((line.Product.xp['Code B4'] == "F" || line.Product.xp['Code B4'] == "T" || line.Product.xp['Code B4'] == "E") && line.xp.DeliveryMethod!="LocalDelivery"){
									if(!line.xp.deliveryCharges)
										line.xp.deliveryCharges = 0;
									if(line.Product.xp['Code B4']== "F")
										line.xp.Destination = "FTD";
									if(line.Product.xp['Code B4']== "T")
										line.xp.Destination = "TFE";
									line.xp.Status = "OnHold";
									line.DeliveryNotAvailable = false;
								}else if(!line.Product.xp['Code B4'] && line.xp.DeliveryMethod!="LocalDelivery"){
									if(line.xp.AssemblyLineItemsList)
										if(line.xp.AssemblyLineItemsList.length > 0)
											line.DeliveryNotAvailable = true;
								}else{
									delete line.xp.Destination;
									line.xp.Status = null;
									//line.DeliveryNotAvailable = true;
								}
								d.resolve();
							}else{
								if((line.Product.xp['Code B4'] == "F" || line.Product.xp['Code B4'] == "T" || line.Product.xp['Code B4'] == "E") && line.xp.DeliveryMethod!="LocalDelivery"){
									if(!line.xp.deliveryCharges)
										line.xp.deliveryCharges = 0;
									if(line.Product.xp['Code B4']== "F")
										line.xp.Destination = "FTD";
									if(line.Product.xp['Code B4']== "T")
										line.xp.Destination = "TFE";
									line.xp.Status = "OnHold";
									line.DeliveryNotAvailable = false;
								}else if(!line.Product.xp['Code B4'] && line.xp.DeliveryMethod!="LocalDelivery"){
									//if(line.xp.AssemblyLineItemsList)
										//if(line.xp.AssemblyLineItemsList.length > 0)
											line.DeliveryNotAvailable = true;
								}else{
									delete line.xp.Destination;
									line.xp.Status = null;
									line.DeliveryNotAvailable = true;
								}
								d.resolve();
							}
						});
					});	
				}else{
					if(form)
						form.invalidAddress = true;
					d.resolve();
				}
			});
		}else{
			d.resolve();
		}
		return d.promise;
	}
	function _getAlgoliaResults(data){
		var client = algolia.Client('31LAEMRXWG', '600b3cc15477fd21c5931d1bfbb36b3d');
		var index = client.initIndex('products');
		var search = {
			'query' : '',
			'hits' : []
		};
		search.query=data;
		return index.search(search.query);
	}
	function _getUnsubmittedOrder(){
		var temp = [], filt, d = $q.defer();
		OrderCloud.As().Me.ListOutgoingOrders(null, 1, 100, null, null, {"Status":"Unsubmitted"}).then(function(res){
			filt = _.filter(res.Items, function(row){
				if(row.xp.SavedOrder){
					if(!row.xp.SavedOrder.Flag)
						temp.push(row);
				}else{
					temp.push(row);
				}
			});
			if(temp.length != 0){
				d.resolve(temp[0]);
			}else{
				d.resolve(0);
			}
		});
		return d.promise;
	}
    return service;
}

function anchorSmoothScroll() {
	var service = {
		ScrollTo: scrollTo

	}
	   function scrollTo(eID) {

        // This scrolling function 
        // is from http://www.itnewb.com/tutorial/Creating-the-Smooth-Scroll-Effect-with-JavaScript
        
        var startY = currentYPosition();
        var stopY = elmYPosition(eID);
        var distance = stopY > startY ? stopY - startY : startY - stopY;
        if (distance < 100) {
            scrollTo(0, stopY); return;
        }
        var speed = 200;
        if (speed >= 20) speed = 20;
        var step = Math.round(distance / 25);
        var leapY = stopY > startY ? startY + step : startY - step;
        var timer = 0;
        if (stopY > startY) {
            for ( var i=startY; i<stopY; i+=step ) {
                setTimeout("window.scrollTo(0, "+leapY+")", timer * speed);
                leapY += step; if (leapY > stopY) leapY = stopY; timer++;
            } return;
        }
        for ( var i=startY; i>stopY; i-=step ) {
            setTimeout("window.scrollTo(0, "+leapY+")", timer * speed);
            leapY -= step; if (leapY < stopY) leapY = stopY; timer++;
        }
        
        function currentYPosition() {
            // Firefox, Chrome, Opera, Safari
            if (self.pageYOffset) return self.pageYOffset;
            // Internet Explorer 6 - standards mode
            if (document.documentElement && document.documentElement.scrollTop)
                return document.documentElement.scrollTop;
            // Internet Explorer 6, 7 and 8
            if (document.body.scrollTop) return document.body.scrollTop;
            return 0;
        }
        
        function elmYPosition(eID) {
            var elm = document.getElementById(eID);
            var y = elm.offsetTop;
            var node = elm;
            while (node.offsetParent && node.offsetParent != document.body) {
                node = node.offsetParent;
                y += node.offsetTop;
            } return y;
        }

    };

    return service;
}