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
			template: '<div class="modal fade" >' + 
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
					      }
					      if(scope.$parent.buildOrderRight)
					       scope.$parent.buildOrderRight.OrderConfirmPopUp = false;
					      if(scope.$parent.buildOrderPDP) 
					       scope.$parent.buildOrderPDP.viewCareGuide = false;
					      if(scope.$parent.buildordersummary){
					       scope.$parent.buildordersummary.showUser=false;
					       scope.$parent.buildordersummary.userEdit=false;
					       scope.$parent.buildordersummary.qeueryLength=0;
					       scope.$parent.buildordersummary.searchval='';
					       scope.$parent.buildordersummary.clearData();
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
	}).run(function($cookieStore){
		//$cookieStore.put('OnLoadOMS', true);
	});
var impersonation = {
	"ClientID": "8836BE8D-710A-4D2D-98BF-EDBE7227E3BB",
	"Claims": ["FullAccess"]
};
function buildOrderConfig( $stateProvider ) {
	$stateProvider
	.state( 'buildOrder', {
		parent: 'base',
		url: '/buildOrder/:SearchType/:ID/:prodID/:orderID/:orderDetails/:catName/:nonOrderClaim/:editsubmitorder',
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
				if($stateParams.SearchType != 'Products' && $stateParams.SearchType != 'BuildOrder' && $stateParams.SearchType != 'PDP' && $stateParams.SearchType != 'plp' && $stateParams.SearchType!='Workshop' && !$stateParams.orderDetails && $stateParams.SearchType != 'elp' && $stateParams.SearchType!='GiftCard' && $stateParams.nonOrderClaim!='true' && $stateParams.editsubmitorder!='true'){
					OrderCloud.Auth.RemoveImpersonationToken();
					OrderCloud.Users.GetAccessToken($stateParams.ID, impersonation).then(function(data){
						OrderCloud.Auth.SetImpersonationToken(data['access_token']);
						OrderCloud.As().Me.ListOutgoingOrders(null, 1, 100, null, null, {"Status":"Unsubmitted"}).then(function(res){
							var temp = [], temp2 = [], filt = _.filter(res.Items, function(row){
								if(row.xp != null){
									if(row.xp.SavedOrder){
										if(!row.xp.SavedOrder.Flag)
											temp.push(row);
									}else{
										temp.push(row);
									}
								}else{
									temp.push(row);
								}
							});
							if(temp.length != 0){
								CurrentOrder.Set(temp[0].ID);
								if(temp[0].PromotionDiscount > 0){
									//Remove promotions for the order
									OrderCloud.As().Orders.ListPromotions(temp[0].ID).then(function(res1){
										angular.forEach(res1.Items, function(val){
											temp2.push(OrderCloud.As().Orders.RemovePromotion(temp[0].ID, val.Code));
										});
										$q.all(temp2).then(function(result1){
											OrderCloud.As().Orders.Get(temp[0].ID).then(function(res3){
												d.resolve(res3);
											});
										});
									});
								}else{
									d.resolve(temp[0]);
								}
							}else{
								d.resolve();
							}
						});
					});
				}else if($stateParams.orderDetails){
					OrderCloud.Orders.Get($stateParams.orderID).then(function(res){
						d.resolve(res);
					});
				}else if($stateParams.editsubmitorder=='true'){
					OrderCloud.Orders.Get($stateParams.orderID).then(function(res){
						var oldval=res.xp;
						var patchval={"oldPrice":res.Total}
						var newval= _.extend(oldval,patchval);
						console.log("newval",newval);
						OrderCloud.Orders.Patch(res.ID,{"xp":newval}).then(function(patch){
							console.log(res);
							d.resolve(res);
						})
					});
				}else{
					d.resolve();
				}
				return d.promise;
			},
			LocalDeliveryCities:function(BuildOrderService){
				BuildOrderService.GetLocalCities().then(function(data){
					return data;
				});
			},
			SearchData: function($q, $stateParams, $state, OrderCloud, Order) {
				var arr = {}, d = $q.defer();
				if($stateParams.SearchType == "User"){
					OrderCloud.Users.Get($stateParams.ID).then(function(data){
						arr["user"] = data.FirstName+" "+data.LastName;
						arr["ID"] = data.ID;
						arr["xp"] = data.xp;
						if(data.xp != null){
							arr["Notes"] = data.xp.Notes;
						}else{
							arr["Notes"] =[];
						}
						if(data.xp != null){
							if(data.xp.ContactAddr && data.xp.ContactAddr!=''){
								OrderCloud.Addresses.Get(data.xp.ContactAddr).then(function(val){
									arr["address"] = val;
									d.resolve(arr);
								});
							}
							else{d.resolve(arr);}
						}
						else{d.resolve(arr);}
						// OrderCloud.As().Me.ListAddresses().then(function(res){
							// angular.forEach(res.Items, function(val, key) {
								// if(val.xp != null){
									// if(val.xp.IsDefault)
										// arr["address"] = val;
								// }
							// }, true);
							// d.resolve(arr);
						// });
					});  
				}else{
					arr["productID"]=$stateParams.ID;
					d.resolve(arr);
				}
				return d.promise;
			},
			// ProductImages: function (BuildOrderService, $q){
				// var ticket = localStorage.getItem("alfrescoTicket"), dfr = $q.defer();
				// BuildOrderService.GetProductImages(ticket).then(function(imgList){
					// dfr.resolve(imgList.items);
				// });
				// return dfr.promise;
			// },
			productList: function (OrderCloud, $stateParams, BuildOrderService, $q) {
				if($stateParams.SearchType == 'plp' || $stateParams.SearchType == 'Products'|| $stateParams.SearchType == 'BuildOrder' || $stateParams.SearchType =='Workshop' || $stateParams.SearchType =='PDP' || $stateParams.SearchType == 'elp' || $stateParams.SearchType=='GiftCard'){
					var dfr = $q.defer();
					OrderCloud.Users.GetAccessToken('gby8nYybikCZhjMcwVPAiQ', impersonation).then(function(data) {
						OrderCloud.Auth.SetImpersonationToken(data['access_token']);
						if($stateParams.SearchType == 'plp' || $stateParams.SearchType == 'Products'){
							var hitsPerPage=50;
							BuildOrderService.GetAlgoliaResults($stateParams.ID, 0, hitsPerPage).then(function(res){
						        // if(res.hits.length>0){
									// BuildOrderService.GetProductList(res.hits, ProductImages).then(function(catProducts){
										// dfr.resolve(catProducts);
									// });
						        // }
						        // else 
								var totalHits=res.nbPages*hitsPerPage;
									dfr.resolve([res.hits, totalHits]);
						    });
						}
						else{
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

function buildOrderController($scope, $rootScope, $state, buyerid, $controller, $stateParams, LineItemHelpers, $q, BuildOrderService, $timeout, OrderCloud, SearchData, algolia, CurrentOrder, alfrescoAccessURL, Underscore, productList, AlfrescoFact,LocalDeliveryCities, AddressValidationService, GoogleAPI, $http, CstDateTime) {
	var vm = this;
	vm.upselloverlay=false;
	vm.selected = undefined;
	$scope.$parent.base.list = ' ';
	if($scope.$parent.base.search){
		$scope.$parent.base.search.query = ' ';
	}
	vm.nonOrderClaim=$stateParams.nonOrderClaim;
	$scope.$parent.base.selectChange('customer');
	// $scope.search = {
        // 'query' : '',
        // 'hits' : []
    // };
	vm.productSearchData = [];
	vm.showPDP = false;
	$scope.hideSearchBox=false;
	$scope.showOrdersummary = $stateParams.showOrdersummary;
	$scope.hideActiveSummary = true;
	$scope.showplp = true;
	vm.MinDate = CstDateTime;
	$scope.gotoCheckout=function(){
		vm.checkoutpopup=angular.element(document.getElementById("order-summary")).scope().$parent.buildordersummary.guestcheckout;
		if($scope.showOrdersummary == true){
			//vm.guestcheckout=true;
			console.log(angular.element(document.getElementById("order-summary")).scope().$parent.buildordersummary.guestcheckout);
			if(($stateParams.SearchType == 'Products' || $stateParams.SearchType == 'BuildOrder' || $stateParams.SearchType == 'PDP' || $stateParams.SearchType == 'plp' || $stateParams.SearchType =='elp' || $stateParams.SearchType=='GiftCard') && !vm.checkoutpopup){
				vm.guestUserModal =! vm.guestUserModal;
			}else{
				//$state.go('checkout', {ID:$stateParams.ID}, {reload:true});	
				$state.go('checkout', {ID:$stateParams.ID});	
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
		if($stateParams.SearchType != 'Products' && $stateParams.SearchType != 'BuildOrder' && $stateParams.SearchType != 'PDP' && $stateParams.SearchType != 'plp' && $stateParams.SearchType!='Workshop' && $stateParams.SearchType !='elp' && $stateParams.SearchType!='GiftCard'){
			OrderCloud.Categories.ListProductAssignments(null, prodID).then(function(res){
				OrderCloud.Categories.Get(res.Items[0].CategoryID).then(function(res2){
					if(res2.xp.DeliveryChargesCatWise.DeliveryMethods.DirectShip){
						vm.DirectShip = true;
					}
					if(res2.xp.DeliveryChargesCatWise.DeliveryMethods.Mixed){
						vm.Faster = true;
					}
					if(res2.Name == "GiftCards"){
						vm.GiftCard = true;
					}
					if(res2.xp.DeliveryChargesCatWise.DeliveryMethods.Courier == true){
						vm.Courier = true;
					}
				});	
			});
		}
	};
	if($stateParams.SearchType == 'plp' || $stateParams.SearchType == 'PDP' || $stateParams.SearchType == 'BuildOrder' || $stateParams.SearchType=='Workshop' || $stateParams.SearchType =='elp' || $stateParams.SearchType=='GiftCard'){
		vm.disable=true;
	}
	/*----Upsell Data----*/
	vm.upsell = true;
	vm.similar = true;
	vm.upsellToggle = function(upsell, product) {
		var tempArr = [];
		vm.upselloverlay=true;
		vm.upsell = vm.upsell === false ? true: false;
		vm.similar = true;
		if(vm.ProdUpsellID != product.ID){
			vm.CategoryItemsUpsell = {};
			OrderCloud.Products.Get(product.ID).then(function(data) {
				var cats = [];
				vm.Categories = [];
				vm.ProdUpsellID = product.ID;
				vm.UpsellDtls = data;
				_.filter(vm.UpsellDtls.xp.Upsell, function (row, key) {
					if(key!="Generic" && row.length > 0)
						cats.push(key);
				});
				angular.forEach(cats, function(line, index){
					tempArr.push(OrderCloud.Categories.Get(line));
				},true);
				$q.all(tempArr).then(function(res){
					angular.forEach(res, function(r){
						vm.Categories.push({"ID":r.ID, "Name":r.Name});
					},true);
					if(vm.Categories[0])
						vm.getCategoriesItems(vm.Categories[0].ID, 0);
				});
			});
		}	
	};
	
	vm.CategoryItemsUpsell = {};
	vm.getCategoriesItems = function(catID, index) {
		//catID = "c1_c1";// dummy
		vm.CategoryItemsUpsell[index] = [];
		var upsel, tempArr = [];
		var catData = _.find(vm.UpsellDtls.xp.Upsell, function (row, key){
			if(key!="Generic"&& row.length > 0){
				upsel = row;
				return true;
			}
		});
		angular.forEach(upsel, function(row){
			if(row)
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
	
	vm.similarToggle = function(similar, product) {
		if(similar)
			vm.similar = vm.similar === false ? true: false;
		vm.upsell = true;
		var tempArr = [];
		if(vm.ProdCrossID != product.ID){
			vm.CategoryItemsSimilar = [];
			OrderCloud.Products.Get(product.ID).then(function(data) {
				vm.ProdCrossID = product.ID;
				angular.forEach(data.xp.Cross, function(row, index){
					if(row)
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
	vm.UpsellProductItem = function(obj, arr, index){
		vm.PDPCarousel = arr;
		vm.UpsellSimilar = true;
		$('#pdpCarouselView').trigger('destroy.owl.carousel');
		$('#pdpCarouselView').find('.owl-stage-outer').children().unwrap();
		setTimeout(function(){
			$("#pdpCarouselView").owlCarousel({
				items:1,
				startPosition: index,
				center: false,
				loop: false,
				nav: true,
				navText: ['<span class="events-arrow-prev" aria-hidden="true"></span>','<span class="events-arrow-next" aria-hidden="true"></span>']	
			});
			$('.owl-item').css('display','inline-block');
		},200);
		vm.HideUpsellNCross();
	}
	
	vm.gotopdp = function(){
		vm.UpsellSimilar = false;
	}
	/*----End of Upsell Data----*/
	$scope.gotoplp = function(){
		vm.showPDP = false;
		if($stateParams.SearchType == 'PDP' && vm.seqProducts !='' && vm.searchval == undefined){
			vm.searchSeqList=vm.seqProducts;
		}
	}
	$scope.AddtoCart = function(prodID, isEvent, ProductXp){
		var DeliveryMethod;
		if(vm.DeliveryType=="Faster Delivery")
			DeliveryMethod = "Faster";
		if(vm.DeliveryType=="Courier")
			DeliveryMethod = "Courier";
		vm.AddExtraList = [];
		angular.forEach(vm.AddExtra, function(val, key){
			if(val.ID)
				vm.AddExtraList.push(val.ID);
		}, true);
		angular.element(document.getElementById("oms-plp-right")).scope().beforeAddToCart(prodID, DeliveryMethod, isEvent, ProductXp);
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
	vm.createUser = function(newUser, form){
		form.$submitted = true;
		vm.guesterror='';
		if(form.$valid){
			$scope.showModal = !$scope.showModal;
		    /*OrderCloud.Users.List(null, null, 1, 100, null, '!ID', { "ID": '30000*' }).then(function (res) {
		     console.log("shyam == ", res);
		            var id = Number(res.Items[0].ID) + 1;*/
			var newUser1={"Username":newUser.Username,"Password":"Welcome@1","FirstName":newUser.FirstName, "LastName":newUser.LastName, "Email":newUser.Email, "Phone":newUser.Phone, "Active":true, "Phone":"("+newUser.Phone1+") "+newUser.Phone2+"-"+newUser.Phone3, "xp":{"Eid":null,"AlternatePhone":null,"ResaleCode":null,"CategoryPlan":null,"LoyaltyID":null,"AcctCode1":null,"AcctCode2":null,"AcctCode3":null,"AcctCode4":null,"OMSAcctNumber":null,"Charge":null,"AvailCredit":null,"Contact":newUser.FirstName+" "+newUser.LastName,"CustType":null,"SecurityQuestion":{"Question":null,"Answer":null},"ContactAddr":"","CorporateDiscount":null,"Notes":[],"ConstantContact":{"ID":null},"PurplePerks":{"SpendingAccountID":null},"CSRStoreID":null,"PO":{"PONumber":null,"PORequired":false},"TaxExemption":{"Enabled":false,"TaxExemptionID":null},"WishList":[]}};		
			OrderCloud.Users.Create(newUser1).then(function(user){
				OrderCloud.SecurityProfiles.SaveAssignment({"SecurityProfileID": "65c976de-c40a-4ff3-9472-b7b0550c47c3","BuyerID": buyerid,"UserID": user.ID}).then(function(security){
					console.log(security);
					angular.element(document.getElementById("buildorder")).scope().$parent.buildOrder.guestUserModal=false;
					$state.go($state.current, {ID:user.ID,SearchType:'User',prodID:SearchData.productID}, {reload:true});
				})

				/*var params = {"CompanyName":createaddr.CompanyName,"FirstName":newUser.FirstName,"LastName":newUser.LastName,"Street1":createaddr.Street1,"Street2":createaddr.Street2,"City":createaddr.City,"State":createaddr.State,"Zip":createaddr.Zip,"Country":createaddr.Country,"Phone":newUser.Phone, "xp":{"IsDefault" :createaddr.IsDefault}};		
				OrderCloud.Addresses.Create(params).then(function(data){		
					data.Zip = parseInt(data.Zip);
					OrderCloud.Users.Patch(user.ID,{"xp":{"Notes":[],"ContactAddr":data.ID}});
					console.log("address created",data);		
					var assign = {"AddressID": data.ID,"UserID": user.ID,"IsBilling": createaddr.IsBilling,"IsShipping": createaddr.IsShipping};		
					OrderCloud.Addresses.SaveAssignment(assign).then(function(res){
						angular.element(document.getElementById("buildorder")).scope().$parent.buildOrder.guestUserModal=false;
						$state.go($state.current, {ID:user.ID,SearchType:'User',prodID:SearchData.productID}, {reload:true});		
						console.log("Address saved for the user....!" +res);		
					});		
				})*/		
			}).catch(function(err){
				console.log(err);
				if(err.data.Errors[0].ErrorCode=="User.UsernameMustBeUnique")
					vm.guesterror="Username is already exist";
				//$state.go('buildOrder', {ID: $stateParams.ID, SearchType:"User",showOrdersummary: false}, {reload:true});
			});
		//});
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
            if (typeof (prodcuts[i].xp) !== 'undefined' && prodcuts[i].xp.SpecsOptions) {
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
            if (typeof (prodcuts[i].xp) !== 'undefined' && prodcuts[i].xp.SpecsOptions) {
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
		var rootnode="workspace://SpacesStore/8da76ddf-f808-4390-aa3e-1f2c39fc8d90";
		if($stateParams.SearchType == 'BuildOrder'){
			vm.PLPLoader = OrderCloud.Products.List(null, 1, 100, null, null, {"xp.ProductCode":e.ProductCode}).then(function(res){
				console.log(res);
				vm.PLPLoader = BuildOrderService.GetProductList(res.Items, rootnode).then(function(prodList){
					vm.seqProducts=prodList;
					var selectedProd=_.where(vm.seqProducts, {"ID":e.ID});
					vm.showProduct(selectedProd[0]);
				 });
			});
		}else{
			vm.PLPLoader = OrderCloud.As().Me.ListProducts(null, 1, 100, null, null, {"xp.ProductCode":e.ProductCode}).then(function(res){
				vm.PLPLoader = BuildOrderService.GetProductList(res.Items, rootnode).then(function(prodList){
					vm.seqProducts=prodList;
					var podID=e.ID;
					podID=podID.toString();
					if(e.IsWorkShopEvent){
						var selectedProd = _.filter(vm.seqProducts, function(row){
							return _.indexOf([true],row.xp.IsDefaultProduct) > -1;
						});
						vm.fullEventsData=_.groupBy(vm.seqProducts, function(value){
							return value.xp.EventDate;
						});
					}
					else{
						var selectedProd=_.where(vm.seqProducts, {"ID":podID});
					}
					vm.showProduct(selectedProd[0]);
				 });
			});
		}
	}
	vm.productsseqList=function(){
		var rootnode="workspace://SpacesStore/8da76ddf-f808-4390-aa3e-1f2c39fc8d90";
		OrderCloud.As().Me.GetProduct($stateParams.ID).then(function(e){
			vm.prodName=e.Name;
			OrderCloud.As().Me.ListProducts(null, 1, 100, null, null, {"xp.ProductCode":e.xp.ProductCode}).then(function(res){
				BuildOrderService.GetProductList(res.Items, rootnode).then(function(prodList){
					vm.seqProducts=prodList;
					var size = [],color = [];
					angular.forEach(prodList, function(val, key){
						if(val.xp){
							if(val.xp.Specs_Options){
								val.xp.Specs_Options = val.xp.Specs_Options;
								val.xp.Specs_Options.Size = val.xp.Specs_Options.Cont_Size;
								size.push(val.xp.Specs_Options.Cont_Size);
								color.push(val.xp.Specs_Options.Color);
							}	
						}	
					},true);
					//e.options = {"Color":_.uniq(color), "Size":_.uniq(size)};
					vm.showProduct(e);
				 });
			 });
		})
	}
    // Function to get selected product
    vm.showProduct=function(e){
		// if(e.xp.Specs_Options && !e.xp.SpecsOptions)
		// 	e.xp.SpecsOptions = e.xp.Specs_Options;
		vm.AssemblyItems("onload", e.ID);
		var alfticket = localStorage.getItem("alfrescoTicket"), rootnode="workspace://SpacesStore/8da76ddf-f808-4390-aa3e-1f2c39fc8d90";
		vm.selectedKey=[];
		if(e.xp.IsWorkShopEvent==true){
			rootnode="workspace://SpacesStore/599a6c21-dd7f-405a-95ec-054e6c3777fc";
			vm.IsWorkShopEvent=true;
			// vm.fullEventsData=_.groupBy(productList, function(value){
				// return value.xp.EventDate;
			// });
			// vm.PLPLoader = _.filter(productList, function(obj){
				// if(obj.xp.IsBaseEvent== true && obj.xp.IsBaseEvent){
					// vm.ticketInformation=obj.xp.TicketInformation;
					// vm.cancellationOrPolicies=obj.xp.CancellationOrPolicies;
					// var alternativeImg=[];
					// angular.forEach(obj.xp.Images, function(value, key) {
						// alternativeImg.push(alfrescoAccessURL+"/"+value.ContentURL+"?alf_ticket="+alfticket);
						// vm.selectedalternativeImg = _.union(vm.selectedalternativeImg, alternativeImg);
						// if(value.IsDefault){
							// vm.selectedProductImg=alfrescoAccessURL+"/"+value.ContentURL+"?alf_ticket="+alfticket;
							// console.log("vm.selectedProductImg", vm.selectedProductImg);
						// }
						
					// });
				// }
			// });
			
			//vm.eventsLimit = Object.keys(vm.fullEventsData);
			vm.ticketInformation=e.xp.TicketInformation;
			vm.cancellationOrPolicies=e.xp.CancellationOrPolicies;
			vm.noOfSeats=e.xp.NoOfSeats;
			vm.location=e.xp.Location;
			vm.room=e.xp.Room;
			vm.prodDesription = e.Description;
			var dataArr = [];
			dataArr[0]=e;
			vm.PLPLoader = BuildOrderService.GetProductList(dataArr, rootnode).then(function(baseEvnt){
				vm.selectedProductImg=baseEvnt[0].baseImage;
				vm.changeImg=angular.copy(baseEvnt[0].baseImage);
				vm.selectedalternativeImg=baseEvnt[0].alternativeImg;
				vm.DisplayEvent(e);
			});
		}
		else{
			vm.fullProductsData=vm.seqProducts;
			vm.IsWorkShopEvent=false;
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
		if(e.xp.IsWorkShopEvent==undefined || e.xp.IsWorkShopEvent==false){
			vm.DeliveryType = false;
			//vm.Assembly = false;
			vm.Courier = false;
			vm.DirectShip = false;
			//vm.Placement = false;
			vm.Faster = false;
			vm.GiftCard = false;
			vm.PLPLoader = OrderCloud.Categories.ListProductAssignments(null, e.ID).then(function(res){
				if(res.Items.length > 0){
					vm.PLPLoader = OrderCloud.Categories.Get(res.Items[0].CategoryID).then(function(res2){
						/*if(res2.xp.DeliveryChargesCatWise.DeliveryMethods.DirectShip){
							vm.DirectShip = true;
						}
						if(res2.xp.CategoryDeliveryCharges.DeliveryMethods.Faster){
							vm.Faster = true;
						}
						if(res2.Name == "GiftCards"){
							vm.GiftCard = true;
						}
						if(res2.xp.DeliveryChargesCatWise.DeliveryMethods.Courier == true){
							vm.Courier = true;
						}*/
						if(res2.xp.CategoryDeliveryCharges && res2.xp.CategoryDeliveryCharges.DeliveryMethods.Courier){
							vm.Courier = true;
						}
						/*if(res2.xp.Placement){
							vm.Placement = true;
						}
						if(res2.xp.Assembly){
							vm.Assembly = true;
						}*/
					});
				}
			});
			//vm.productExtras=extraProducts();
			
			//Get Upsell & CrossSell 
			vm.CategoryItemsSimilar;
			vm.Categories;
			var Dummy;
			vm.upsellToggle(Dummy, e);
			vm.similarToggle(Dummy, e);
			if(e.xp.SpecsOptions && e.xp.SpecsOptions.Color)
				$scope.radio.selectedColor = e.xp.SpecsOptions.Color;
			availableColors = DisplayColors(vm.fullProductsData, true);
			vm.allColors = availableColors;
			var selectedColorHold = angular.copy(availableColors);
			if(e.xp.SpecsOptions){
				DisplaySelectedSize(e.xp.SpecsOptions.Color, _.findIndex(selectedColorHold, function (item) {
						var testSize, testColor, ItemTestColor;
						if(e.xp.SpecsOptions.Size!=null)
							testSize = e.xp.SpecsOptions.Size.toLowerCase();
						else
							testSize = e.xp.SpecsOptions.Size;
						if(e.xp.SpecsOptions.Color!=null)
							testColor = e.xp.SpecsOptions.Color.toLowerCase();
						else
							testColor = e.xp.SpecsOptions.Color;
						if(e.xp.SpecsOptions.Color!=null)
							ItemTestColor = item.xp.SpecsOptions.Color.toLowerCase();
						else
							ItemTestColor = item.xp.SpecsOptions.Color;	
						if(e.xp.SpecsOptions.Color === null || e.xp.SpecsOptions.Color === null){
							return item.xp.SpecsOptions.Color == e.xp.SpecsOptions.Color;
						}else{
							return ItemTestColor == testColor; 
						}
				}));
			}
			if(e.xp.SpecsOptions && e.xp.SpecsOptions.Size)
				$scope.radio.selectedSize = e.xp.SpecsOptions.Size;
			vm.productTitle = e.Name;
			vm.prodDesription = e.Description;
			availableSizes = DisplaySizes(vm.fullProductsData, true);
			vm.allSizes = availableSizes;
			var selectedSizeHold = angular.copy(availableSizes);
			if(e.xp.SpecsOptions){
				DisplaySelectedColor(e.xp.SpecsOptions.Size, _.findIndex(selectedSizeHold, function (item) { 
					if(e.xp.SpecsOptions.Size === null || e.xp.SpecsOptions.Size === null){
					return item.xp.SpecsOptions.Size == e.xp.SpecsOptions.Size 
					}else{
						var testSize, ItemTestSize;
						if(e.xp.SpecsOptions.Size!=null)
							testSize = e.xp.SpecsOptions.Size.toLowerCase();
						else
							testSize = e.xp.SpecsOptions.Size;
						if(e.xp.SpecsOptions.Size!=null)
							ItemTestSize = item.xp.SpecsOptions.Size.toLowerCase();
						else
							ItemTestSize = item.xp.SpecsOptions.Size;
						return ItemTestSize == testSize;
					}
			   }));
			}
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
			if(_obj.xp.SpecsOptions && _obj.xp.SpecsOptions.Size){
				if(_obj.xp.SpecsOptions.Size === null || selectedSize === null){
                	return (_obj.xp.SpecsOptions.Size == selectedSize)
				}else{
					var testSize;
					if(_obj.xp.SpecsOptions.Size!=null)
						testSize = _obj.xp.SpecsOptions.Size.toLowerCase();
					else
						testSize = _obj.xp.SpecsOptions.Size;
					return (_obj.xp.SpecsOptions.Size == selectedSize || testSize == selectedSize)
				}
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
				var testSize, testColor;
				if(_obj.xp.SpecsOptions.Size!=null)
					testSize = _obj.xp.SpecsOptions.Size.toLowerCase();
				else
					testSize = _obj.xp.SpecsOptions.Size;
				if(_obj.xp.SpecsOptions.Color!=null)
					testColor = _obj.xp.SpecsOptions.Color.toLowerCase();
				else
					testColor = _obj.xp.SpecsOptions.Color;
                return ((_obj.xp.SpecsOptions.Size == $scope.radio.selectedSize || testSize == $scope.radio.selectedSize) && (_obj.xp.SpecsOptions.Color == $scope.radio.selectedColor || testColor == $scope.radio.selectedColor))
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
		vm.selectedSkuXp = selectedSku.xp;
		delete vm.ProductPromotionID;
		delete vm.ProductPromotionCatID;
		if(!selectedSku.xp.couponID){
			vm.GetPromotions(selectedSku.xp);
		}
		BuildOrderService.GetInventory(vm.selectedProductId).then(function(res){
			if(res==0)
				vm.OutOfStock = true;
			else
				vm.OutOfStock = false;
		});
    }
	vm.DisplayEvent=function(selectedSku) {
        vm.productTitle = selectedSku.Name;
        //vm.prodDesription = selectedSku.Description;
        vm.selectedProductId = selectedSku.ID;
		vm.selectedSkuXp = selectedSku.xp;
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
				var testColor2, testColor;
				if(_obj.xp.SpecsOptions.Color!=null)
					testColor2 = _obj.xp.SpecsOptions.Color.toLowerCase();
				else
					testColor2 = _obj.xp.SpecsOptions.Color;
				if(color!=null)
					testColor = color.toLowerCase();
				else
					testColor = color;
                return (testColor2 == testColor)
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
				var testSize, testColor;
				if(_obj.xp.SpecsOptions.Size!=null)
					testSize = _obj.xp.SpecsOptions.Size.toLowerCase();
				else
					testSize = _obj.xp.SpecsOptions.Size;
				if(_obj.xp.SpecsOptions.Color!=null)
					testColor = _obj.xp.SpecsOptions.Color.toLowerCase();
				else
					testColor = _obj.xp.SpecsOptions.Color;
                return ((_obj.xp.SpecsOptions.Size == $scope.radio.selectedSize || testSize == $scope.radio.selectedSize) && (_obj.xp.SpecsOptions.Color == $scope.radio.selectedColor || testColor == $scope.radio.selectedColor))
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
		OrderCloud.As().Me.GetProduct($stateParams.ID).then(function(prod){
			vm.eventDate=prod.xp.EventDate;
			vm.GetSkuevents(prod.xp.ProductCode,$stateParams.ID);
		});
	}
	if($stateParams.SearchType =='elp'){
		OrderCloud.As().Me.ListProducts(null, 1, 100, null, null,{"xp.IsDefaultProduct":true}, $stateParams.ID).then(function(res){
				vm.elpLists=[res.Items, res.Meta.TotalCount];
				$scope.showplp = true;
				vm.catName=$stateParams.catName;
		});
	}
	if($stateParams.SearchType=='GiftCard'){
		vm.showPDP = true;

	}
	if($stateParams.nonOrderClaim=="true" && $stateParams.SearchType=='User'){
		vm.showPDP = true;
	}
	vm.GetSkuevents = function(prodCode, defaultEvnt){
		vm.PLPLoader = OrderCloud.As().Me.ListProducts(null, null, null, null, null, {"xp.ProductCode":prodCode}).then(function(res){
			vm.fullEventsData=_.groupBy(res.Items, function(value){
				return value.xp.EventDate;
			});
			console.log("vm.fullEventsData", vm.fullEventsData);
			var selectedProd=_.where(res.Items, {"ID":defaultEvnt});
			vm.showProduct(selectedProd[0]);
			vm.showPDP = true;
		});
	}
	vm.cleardata=function(){
		if(vm.searchSeqList)
		vm.searchSeqList='';
		else if(vm.searchList)
		vm.searchList[0]='';
		else if(vm.catList)
		vm.catList[0]='';
		else if(vm.seqProducts)
		vm.seqProducts='';
		else if(vm.elpLists)
		vm.elpLists='';
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
	vm.RemoveZipBlur = function(ProductID){
		$('#ZipCodeCheck').blur();
		if((vm.city || vm.Mcity) && vm.Mcity!="Select City" && vm.ZipCodeCheck && vm.checkDate){
			if(vm.city)
				vm.GetMinDays(vm.ZipCodeCheck, ProductID);
			if(vm.Mcity)
				vm.GetMinDays(vm.ZipCodeCheck, ProductID);	
		}
	};
	vm.CheckDeliveryAvailable = function(city, ProductID){
		vm.DeliveryNotAvailable = undefined;
		vm.Mcity = city;
		var DeliveryMethod, IsLocal =  _.contains(LocalDeliveryCities, city);
		if(IsLocal){
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
		if((vm.city || vm.Mcity) && vm.Mcity!="Select City" && vm.ZipCodeCheck){
			if(!_.isArray(vm.MultipleCities) || !vm.MultipleCities)
				vm.CheckDeliveryAvailable(vm.city, ProductID);
			else
				vm.CheckDeliveryAvailable(vm.Mcity, ProductID);
		}		
	};
	vm.disabledDates = function (data) {
		return (data.mode === 'day' && (data.date.getDay() === 0));
	};
	// Assembly & promotions critical part don't touch (Start here).....
	vm.AssemblyItems = function(param, productID){
		var tempArr = [];
		vm.PLPLoader = OrderCloud.Products.Get(productID).then(function(data) {
			angular.forEach(data.xp.AssemblyProduct, function(row, index){
				if(row)
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
		if(list.length > 0 && !_.isEmpty(vm.ProductCoupons.ListAssign)){
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
		}	
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
	if($stateParams.SearchType == 'Products' || $stateParams.SearchType == 'plp'){
		$scope.totalItems = productList[1];
	}
		$scope.currentPage = 1;
		//vm.noOfHits=50;
		//$scope.itemsPerPage = vm.noOfHits;
		$scope.itemsPerPage = 50;
		console.log("$scope.itemsPerPage ", $scope.itemsPerPage );
		$scope.maxSize = 5;
    vm.setPagingData=function(page) {
		//$scope.itemsPerPage = vm.noOfHits;
		$(".oms_main_container").animate({ scrollTop: 0 }, "fast");
		if($scope.buildOrder.searchval){
			vm.searchTxt=$scope.buildOrder.searchval;
		}
		else{
			vm.searchTxt=$stateParams.ID;
		}
		BuildOrderService.GetAlgoliaResults(vm.searchTxt, page, $scope.itemsPerPage).then(function(res){
			if($stateParams.SearchType == 'Products' && vm.searchList[0].length>0){
				vm.searchList[0]=[];
				vm.searchList[0]=_.union(vm.searchList[0], res.hits);
			}
			else if($stateParams.SearchType == 'plp' && vm.catList[0].length>0){
				vm.catList[0]=[];
				vm.catList[0]=_.union(vm.catList[0], res.hits);
			}
			else{
				$scope.buildOrder.buildorderSearch[0]=[];
				$scope.buildOrder.buildorderSearch[0]=_.union($scope.buildOrder.buildorderSearch[0], res.hits);
			}
			vm.page=page;
		});
    }
}

function buildOrderTopController($scope, $stateParams,$rootScope, AlfrescoFact) {
	var vm = this;
	vm.logo=AlfrescoFact.logo;
	setTimeout(function(){ $('.form-control').focus(); }, 0);
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

function buildOrderDownController($scope, $stateParams, $state, $q, OrderCloud, BuildOrderService, $cookieStore) {
	var vm = this;
	vm.buildorderfooter=false;
	vm.editsubmitorder=$stateParams.editsubmitorder;
	if($stateParams.orderDetails){
		vm.orderdetails= $stateParams.orderDetails;
		vm.orderhistorydetails=!$stateParams.orderDetails;
	}
	else if($stateParams.SearchType=="Products" || $stateParams.SearchType == 'BuildOrder' || $stateParams.SearchType == 'PDP' || $stateParams.SearchType == 'plp' || $stateParams.SearchType =='elp' || $stateParams.SearchType=='GiftCard'){
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
					angular.element(document.getElementById("order-summary")).scope().$parent.buildordersummary.cartmerge=true;
					angular.element(document.getElementById("buildorder")).scope().$parent.buildOrder.guestUserModal=false;
					angular.element(document.getElementById("order-summary")).scope().$parent.buildordersummary.guestcartdata.push(res1);					
				}else{
					var orderParams = {"Type":"Standard","xp":{"OrderSource":"OMS","CSRID":$cookieStore.get('OMS.CSRID')}};
					OrderCloud.As().Orders.Create(orderParams).then(function(res3){
						angular.forEach(res1.Items, function(val){
							delChrgs += val.xp.deliveryCharges;
							tempArr.push(OrderCloud.LineItems.Update(res3.ID, val.ID, val));
						}, true);
						$q.all(tempArr).then(function(result){
							angular.forEach(res1.Items, function(val){
								if(val.ShippingAddress!=null)
									tempArr2.push(OrderCloud.LineItems.SetShippingAddress(res3.ID, val.ID, val.ShippingAddress));
							}, true);
							$q.all(tempArr2).then(function(result2){
								console.log("Success");
								delChrgs = delChrgs+res3.ShippingCost
								if(delChrgs > 250){
									CapTotalDiscount = delChrgs - 250;
									delChrgs = 250;
								}
								angular.element(document.getElementById("buildorder")).scope().$parent.buildOrder.guestUserModal=false;
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
	vm.mergeanonorder = function(res1){
		var obj = {"ID": $stateParams.ID, "SearchType":"User","showOrdersummary": false}, tempArr = [], tempArr2 = [], delChrgs = 0, CapTotalDiscount = 0;
		BuildOrderService.GetUnsubmittedOrder().then(function(res2){
				if(res2 != 0){
					angular.forEach(res1[0].Items, function(val){
						delChrgs += val.xp.deliveryCharges;
						tempArr.push(OrderCloud.LineItems.Update(res2.ID, val.ID, val));
					}, true);
					$q.all(tempArr).then(function(result){
						angular.forEach(res1.Items, function(val){
							if(val.ShippingAddress!=null)
								tempArr2.push(OrderCloud.LineItems.SetShippingAddress(res2.ID, val.ID, val.ShippingAddress));

						}, true);
						$q.all(tempArr2).then(function(result2){
							console.log("Success");
							if(res2.ShippingCost==null)
								res2.ShippingCost=0;
							delChrgs = delChrgs+res2.ShippingCost;
							if(delChrgs > 250){
								CapTotalDiscount = delChrgs - 250;
								delChrgs = 250;
							}
							angular.element(document.getElementById("order-summary")).scope().$parent.buildordersummary.cartmerge=false;
							//angular.element(document.getElementById("buildorder")).scope().$parent.buildOrder.guestUserModal=false;	
							OrderCloud.As().Orders.Patch(res2.ID, {"ShippingCost": delChrgs, "xp":{"CapTotalDiscount": CapTotalDiscount}}).then(function(res){
								$state.go('buildOrder', {ID: $stateParams.ID, SearchType:"User",orderDetails:null,showOrdersummary: false,orderID:null}, {reload:true});
							}).catch(function(){
								$state.go('buildOrder', {ID: $stateParams.ID, SearchType:"User",orderDetails:null,showOrdersummary: false, orderID:null}, {reload:true});
							});
						});	
					}).catch(function(err){
						console.log(JSON.stringify(err));
					});
				}
			});
		
	}
}

function buildOrderLeftController($scope, $stateParams, SearchData, OrderCloud, $q, $state,LocalDeliveryCities) {
	var vm = this, Arr = [], spendingAcc = {};
	$scope.showpayment = false;
	vm.list = SearchData;
	if($stateParams.SearchType != 'Products' && $stateParams.SearchType != 'BuildOrder' && $stateParams.SearchType != 'PDP' && $stateParams.SearchType != 'plp' && $stateParams.SearchType != 'Workshop' && $stateParams.SearchType !='elp' && $stateParams.SearchType!='GiftCard'){
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

function buildOrderRightController($scope, $q, $state, $stateParams, OrderCloud, Order, LineItemHelpers, TaxService, AddressValidationService, CurrentOrder, BuildOrderService, $cookieStore, CstDateTime, $http,$location,$anchorScroll, anchorSmoothScroll, SearchData,LocalDeliveryCities) {
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
		var DeliveryMethod;
		vm.ActiveOrderCartLoader = OrderCloud.Categories.ListProductAssignments(null, prodID).then(function(res1){
			vm.ActiveOrderCartLoader = OrderCloud.Categories.Get(res1.Items[0].CategoryID).then(function(res2){
				/*if(res2.xp.CategoryDeliveryCharges.DeliveryMethods.Faster){
					vm.Faster = true;
					vm['showDeliveryToolTip'+index] = true;
				}*/
				if(res2.xp.CategoryDeliveryCharges.DeliveryMethods.Courier){
					vm.Courier = true;
					vm['showDeliveryToolTip'+index] = true;
				}
				if(!vm.Courier){
					$scope.createListItem(prodID, DeliveryMethod);
				}	
			});
		});	
	};
	$scope.beforeAddToCart = function(prodID, DeliveryMethod, isEvent, ProductXp){
		if(!vm.order){
			var orderParams = {"Type":"Standard","xp":{"OrderSource":"OMS","CSRID":$cookieStore.get('OMS.CSRID')}};
			if($stateParams.SearchType == 'Products'  || $stateParams.SearchType == 'BuildOrder' || $stateParams.SearchType == 'PDP' || $stateParams.SearchType == 'plp' || $stateParams.SearchType =='elp' || $stateParams.SearchType=='GiftCard' || $stateParams.nonOrderClaim=='true'){
				vm.ActiveOrderCartLoader = BuildOrderService.AdminLogin().then(function(res){
					angular.element(document.getElementById("order-summary")).scope().$parent.buildordersummary.token = res.access_token;
					vm.ActiveOrderCartLoader = OrderCloud.As().Orders.Create(orderParams).then(function(res1){
						CurrentOrder.Set(res1.ID);
						vm.order = res1;
						if($stateParams.SearchType == 'Products' || $stateParams.SearchType == 'PDP' || $stateParams.SearchType == 'BuildOrder' || $stateParams.SearchType == 'plp' || $stateParams.SearchType =='elp' || $stateParams.SearchType=='GiftCard'){
							angular.element(document.getElementById("order-summary")).scope().$parent.buildordersummary.order = res1;	
						}
						$scope.createListItem(prodID, DeliveryMethod, isEvent, ProductXp);
					});
				});
			}
			else{
				vm.ActiveOrderCartLoader = BuildOrderService.GetUnsubmittedOrder().then(function(res){
					if(res != 0){
						CurrentOrder.Set(res.ID);
						vm.order = res;
						$scope.createListItem(prodID, DeliveryMethod, isEvent, ProductXp);
					}
					else{
						vm.ActiveOrderCartLoader = OrderCloud.As().Orders.Create(orderParams).then(function(res){
							CurrentOrder.Set(res.ID);
							vm.order = res;
							$scope.createListItem(prodID, DeliveryMethod, isEvent, ProductXp);
						});
					}
				});
			}
			/*vm.ActiveOrderCartLoader = BuildOrderService.GetUnsubmittedOrder().then(function(res){
				if(res != 0){
					CurrentOrder.Set(res.ID);
					vm.order = res;
					$scope.createListItem(prodID, DeliveryMethod, isEvent, ProductXp);
				}else{
					var orderParams = {"Type":"Standard","xp":{"OrderSource":"OMS","CSRID":$cookieStore.get('OMS.CSRID')}};
					if($stateParams.SearchType == 'Products'  || $stateParams.SearchType == 'BuildOrder' || $stateParams.SearchType == 'PDP' || $stateParams.SearchType == 'plp' || $stateParams.SearchType =='elp' || $stateParams.SearchType=='GiftCard'){
						vm.ActiveOrderCartLoader = BuildOrderService.AdminLogin().then(function(res){
    						angular.element(document.getElementById("order-summary")).scope().$parent.buildordersummary.token = res.access_token;
    						vm.ActiveOrderCartLoader = OrderCloud.As().Orders.Create(orderParams).then(function(res1){
    							CurrentOrder.Set(res1.ID);
								vm.order = res1;
								if($stateParams.SearchType == 'Products' || $stateParams.SearchType == 'PDP' || $stateParams.SearchType == 'BuildOrder' || $stateParams.SearchType == 'plp' || $stateParams.SearchType =='elp' || $stateParams.SearchType=='GiftCard'){
									angular.element(document.getElementById("order-summary")).scope().$parent.buildordersummary.order = res1;	
								}
								$scope.createListItem(prodID, DeliveryMethod, isEvent, ProductXp);
							});
						});
					}else{
						vm.ActiveOrderCartLoader = OrderCloud.As().Orders.Create(orderParams).then(function(res){
							CurrentOrder.Set(res.ID);
							vm.order = res;
							$scope.createListItem(prodID, DeliveryMethod, isEvent, ProductXp);
						});
					}
				}
			});*/
		}else{
			$scope.createListItem(prodID, DeliveryMethod, isEvent, ProductXp);
		}
	};
	$scope.createListItem = function(prodID, DeliveryMethod, isEvent, ProductXp){
	// Data clear Starts
	vm.DuplicateActiveOrders = angular.copy(vm.activeOrders);
	// Data clear ends
	var giftcardchange;
	var lineItemParams = {"ProductID": prodID,"Quantity": 1,"xp":{"TotalCost":0}}, buildorderVM = angular.element(document.getElementById("buildOrder-pdp-container")).scope().$parent.$parent.$parent.buildOrder, TempArr = [];
	if(buildorderVM.ProductPromotionCatID){
		lineItemParams.xp.PromoId = buildorderVM.ProductPromotionCatID;
		lineItemParams.xp.PromoCode = buildorderVM.ProductPromotionID;
	}
	if(DeliveryMethod)
		lineItemParams.xp.DeliveryMethod = DeliveryMethod;
	if(!isEvent){
		vm.ActiveOrderCartLoader = OrderCloud.Categories.ListProductAssignments(null, prodID).then(function(res1){
			vm.ActiveOrderCartLoader = OrderCloud.Categories.Get(res1.Items[0].CategoryID).then(function(res2){
				var MinDate = {}, ApplicableDeliveryMethods = {};
				_.each(res2.xp.CategoryDeliveryCharges.DeliveryMethods, function (v, k) {
					if (v.MinDays){
						MinDate[k] = v.MinDays;
					}
					if(k == "InStorePickUp")
						ApplicableDeliveryMethods['InStorePickUp'] = true;
					if(k == "LocalDelivery" || k == "UPS")
						ApplicableDeliveryMethods['OtherType'] = true;	
				});
				lineItemParams.xp.MinDate = MinDate;
				lineItemParams.xp.ApplicableDeliveryMethods = ApplicableDeliveryMethods;
				lineItemParams.ShippingAddressID = null;
				if($stateParams.SearchType=='Products' || $stateParams.SearchType == 'PDP' || $stateParams.SearchType == 'BuildOrder' || $stateParams.SearchType == 'plp' || $stateParams.SearchType=='GiftCard'){
					vm.ActiveOrderCartLoader = OrderCloud.LineItems.Create(vm.order.ID, lineItemParams).then(function(res){
						angular.element(document.getElementById("build-order-footer")).scope().buildOrderDown.buildorderfooter = false;
						lineItemParams.xp.TotalCost = lineItemParams.xp.TotalCost + (res.UnitPrice * res.Quantity);
						if(buildorderVM.IsPlacement=="Placed"){
							lineItemParams.xp.deliveryFeesDtls = {"Placement Charges": vm.buyerXp.AdditionalCharges.PlacementCharges};
							lineItemParams.xp.TotalCost = lineItemParams.xp.TotalCost + parseFloat(vm.buyerXp.AdditionalCharges.PlacementCharges);
							lineItemParams.xp.deliveryCharges = vm.buyerXp.AdditionalCharges.PlacementCharges;
							lineItemParams.xp.PlacementInstruction = buildorderVM.PlacementInstruction;
						}
						if(prodID=="Gift_Card_Product"){
							OrderCloud.SpendingAccounts.List('Gift Card', null, null, 'Name', '!ID', {'xp.Claimed':false,'xp.IsAssigned':false}).then(function(resultdata){
								var giftcardamount=angular.element(document.getElementById("buildOrder-pdp-container")).scope().$parent.buildOrderPDP.giftcardamount;
								giftcardchange={"Balance":giftcardamount,"xp":{"IsAssigned":true}};
								lineItemParams.xp.SpendingAccountsID=resultdata.Items[0].ID;
								lineItemParams.UnitPrice=giftcardamount;
								vm.ActiveOrderCartLoader = OrderCloud.LineItems.Patch(vm.order.ID, res.ID, lineItemParams).then(function(res2){
									OrderCloud.SpendingAccounts.Patch(lineItemParams.xp.SpendingAccountsID,giftcardchange).then(function(patchdata){
										console.log(patchdata);
									});
									if(buildorderVM.AssemblyList.length == 0 || buildorderVM.IsAssembly == 'Not Assembled'){
										vm.getLineItems();
									}else{
										vm.CreateAssemblyItems(buildorderVM, res2.ID);
									}
									if(buildorderVM.AddExtraList){
										buildorderVM.AddExtraList = _.compact(buildorderVM.AddExtraList);
										if(buildorderVM.AddExtraList.length > 0)
											vm.AddExtraProducts(buildorderVM, res2.ID, res2.xp);
									} 
									vm.isOpen[res.ID] = true;
								});
							});
						}else{
							vm.ActiveOrderCartLoader = OrderCloud.LineItems.Patch(vm.order.ID, res.ID, lineItemParams).then(function(res2){
								if(buildorderVM.AssemblyList.length == 0 || buildorderVM.IsAssembly == 'Not Assembled'){
									vm.getLineItems();
								}else{
									vm.CreateAssemblyItems(buildorderVM, res2.ID);
								}
								if(buildorderVM.AddExtraList){
									buildorderVM.AddExtraList = _.compact(buildorderVM.AddExtraList);
									if(buildorderVM.AddExtraList.length > 0)
										vm.AddExtraProducts(buildorderVM, res2.ID, res2.xp);
								} 
								vm.isOpen[res.ID] = true;
							});
						}
					});
				}else{
					vm.ActiveOrderCartLoader = OrderCloud.LineItems.Create(vm.order.ID, lineItemParams).then(function(res){
						angular.element(document.getElementById("build-order-footer")).scope().buildOrderDown.buildorderfooter = false;
						lineItemParams.xp.TotalCost = lineItemParams.xp.TotalCost + (res.UnitPrice * res.Quantity);
						if(prodID=="Gift_Card_Product"){
							OrderCloud.SpendingAccounts.List('Gift Card', null, null, 'Name', '!ID', {'xp.Claimed':false,'xp.IsAssigned':false}).then(function(resultdata){
								var giftcardamount=angular.element(document.getElementById("buildOrder-pdp-container")).scope().$parent.buildOrderPDP.giftcardamount;
								giftcardchange={"Balance":giftcardamount,"xp":{"IsAssigned":true}};
								lineItemParams.xp.SpendingAccountsID=resultdata.Items[0].ID;
								lineItemParams.UnitPrice=giftcardamount;
								vm.ActiveOrderCartLoader = OrderCloud.LineItems.Patch(vm.order.ID, res.ID, lineItemParams).then(function(res2){
									if(buildorderVM.AssemblyList.length == 0 || buildorderVM.IsAssembly == 'Not Assembled'){
										vm.getLineItems();
									}else{
										vm.CreateAssemblyItems(buildorderVM, res2.ID);
									}
									if(buildorderVM.AddExtraList){
										buildorderVM.AddExtraList = _.compact(buildorderVM.AddExtraList);
										if(buildorderVM.AddExtraList.length > 0)
											vm.AddExtraProducts(buildorderVM, res2.ID, res2.xp);
									} 
									vm.isOpen[res.ID] = true;
								});
							});
						}else{
							if(buildorderVM.IsPlacement=="Placed"){
								lineItemParams.xp.deliveryFeesDtls = {"Placement Charges": vm.buyerXp.AdditionalCharges.PlacementCharges};
								lineItemParams.xp.TotalCost = lineItemParams.xp.TotalCost + parseFloat(vm.buyerXp.AdditionalCharges.PlacementCharges);
								lineItemParams.xp.deliveryCharges = vm.buyerXp.AdditionalCharges.PlacementCharges;
								lineItemParams.xp.PlacementInstruction = buildorderVM.PlacementInstruction;
							}
							vm.ActiveOrderCartLoader = OrderCloud.LineItems.Patch(vm.order.ID, res.ID, lineItemParams).then(function(res2){
								if(buildorderVM.AssemblyList.length == 0 || buildorderVM.IsAssembly == 'Not Assembled'){
									vm.getLineItems();
								}else{
									vm.CreateAssemblyItems(buildorderVM, res2.ID);
								}
								if(buildorderVM.AddExtraList){
									buildorderVM.AddExtraList = _.compact(buildorderVM.AddExtraList);
									if(buildorderVM.AddExtraList.length > 0)
										vm.AddExtraProducts(buildorderVM, res2.ID, res2.xp);
								}
								vm.isOpen[res.ID] = true;
							});
						}
					});
				}
			});
		});
	}else{
		var lineItemParams = {"ProductID": prodID,"Quantity": 1,"xp":{"TotalCost":0}};
		vm.ActiveOrderCartLoader = OrderCloud.LineItems.Create(vm.order.ID, lineItemParams).then(function(res){
			angular.element(document.getElementById("build-order-footer")).scope().buildOrderDown.buildorderfooter = false;
			lineItemParams.xp.TotalCost = lineItemParams.xp.TotalCost + (res.UnitPrice * res.Quantity);
			lineItemParams.xp.deliveryDate = new Date(ProductXp.EventDate);
			lineItemParams.xp.IsWorkShopEvent = true;
			vm.ActiveOrderCartLoader = OrderCloud.LineItems.SetShippingAddress(vm.order.ID, res.ID, ProductXp.Location);
			vm.ActiveOrderCartLoader = OrderCloud.LineItems.Patch(vm.order.ID, res.ID, lineItemParams).then(function(res2){
				vm.getLineItems();
				vm.isOpen[res.ID] = true;
			});
		});
	}	
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
			TempArr.unshift(OrderCloud.LineItems.Patch(vm.order.ID, BaseLineItemID, {"xp":{"AssemblyLineItemsList":AssemblyLineItems}}));
			vm.ActiveOrderCartLoader = $q.all(TempArr).then(function(result2){
				vm.getLineItems();
			}).catch(function(){
				vm.getLineItems();
			});
		});
	};
	vm.AddExtraProducts = function(buildorderVM, BaseLineItemID, BaseProductxp){
		var TempArr = [], lineItemParams, AddExtraLineItems = [];
		angular.forEach(buildorderVM.AddExtraList, function(val){
			lineItemParams = {"ProductID": "","Quantity": 1,"xp":{"TotalCost":0, "ApplicableDeliveryMethods": BaseProductxp.ApplicableDeliveryMethods}};
			lineItemParams.ProductID = val;
			lineItemParams.xp.BaseLineItemID = BaseLineItemID;
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
				AddExtraLineItems.push(val.ID);
			}, true);
			TempArr.unshift(OrderCloud.LineItems.Patch(vm.order.ID, BaseLineItemID, {"xp":{"AddExtraLineItemsList":AddExtraLineItems}}));
			vm.ActiveOrderCartLoader = $q.all(TempArr).then(function(result2){
				vm.getLineItems();
			}).catch(function(){
				vm.getLineItems();
			});
		});
	};
	vm.deleteListItem = function(e, listItem){
		e.preventDefault();
		e.stopPropagation();
		vm.CancelDeleteToolTip[listItem.ID] = false;
		if(!listItem.xp.AssemblyLineItemsList){
			vm.ActiveOrderCartLoader = OrderCloud.LineItems.Delete(vm.order.ID, listItem.ID).then(function(res){
				delete vm.lineItemForm[listItem.ID];
				// Data clear Starts
				vm.DuplicateActiveOrders = angular.copy(vm.activeOrders);
				angular.forEach(vm.DuplicateActiveOrders, function(val, key){
					vm.DuplicateActiveOrders[key] = _.without(val, _.findWhere(val, {ID: listItem.ID}));
					if(vm.DuplicateActiveOrders[key].length == 0)
						delete vm.DuplicateActiveOrders[key];
				}, true);
				// Data clear ends
				//Assembly/addextra multiple lineitems in base item remove
				if(listItem.xp.BaseLineItemID){
					var obj;
					vm.ActiveOrderCartLoader = OrderCloud.LineItems.Get(vm.order.ID, listItem.xp.BaseLineItemID).then(function(res){
						if(res.xp.AssemblyLineItemsList){
							var dat = _.without(res.xp.AssemblyLineItemsList, res.ID);
							res.xp.AssemblyLineItemsList = dat;
							obj = {"xp":{"AssemblyLineItemsList": dat}};
						}
						if(res.xp.AddExtraLineItemsList){
							var dat = _.without(res.xp.AddExtraLineItemsList, res.ID);
							res.xp.AddExtraLineItemsList = dat;
							obj = {"xp":{"AddExtraLineItemsList": dat}};
						}
						vm.ActiveOrderCartLoader = OrderCloud.LineItems.Patch(vm.order.ID, res.ID, obj).then(function(res){
							vm.getLineItems();
							//vm.lineItemForm[listItem.ID].$setPristine();
						});
					}).catch(function(err){
						vm.getLineItems();
					});	
				}else{
					vm.getLineItems();
					//vm.lineItemForm[listItem.ID].$setPristine();
				}
			}).catch(function(){
				vm.getLineItems();
			});
		}else{
			var TempArr = [];
			angular.forEach(listItem.xp.AssemblyLineItemsList, function(val){
				TempArr.push(OrderCloud.LineItems.Delete(vm.order.ID, val));
				delete vm.lineItemForm[val];
				// Data clear Starts
				vm.DuplicateActiveOrders = angular.copy(vm.activeOrders);
				angular.forEach(vm.DuplicateActiveOrders, function(val, key){
					vm.DuplicateActiveOrders[key] = _.without(val, _.findWhere(val, {ID: listItem.ID}));
					if(vm.DuplicateActiveOrders[key].length == 0)
						delete vm.DuplicateActiveOrders[key];
				}, true);
				// Data clear ends
			}, true);
			TempArr.push(OrderCloud.LineItems.Delete(vm.order.ID, listItem.ID));
			delete vm.lineItemForm[listItem.ID];
			// Data clear Starts
			angular.forEach(vm.DuplicateActiveOrders, function(val, key){
				vm.DuplicateActiveOrders[key] = _.without(val, _.findWhere(val, {ID: listItem.ID}));
			}, true);
			// Data clear ends
			vm.ActiveOrderCartLoader = $q.all(TempArr).then(function(result){
				vm.getLineItems();
			}).catch(function(){
				vm.getLineItems();
			});
		}
		//Clear date of other lineitems, if this lineitem has delivery rules for same recipient 
		var arr = [], groupData;
		angular.forEach(vm.activeOrders, function(val, key){
			arr = _.union(val, arr);
		});
		groupData = _.groupBy(arr, function(value){
			if(value.ShippingAddress!=null)
				return value.ShippingAddress.FirstName + ' ' + value.ShippingAddress.LastName + ' ' + value.ShippingAddress.Zip + ' ' + (value.ShippingAddress.Street1).split(/(\d+)/g)[1] + ' ' + value.xp.DeliveryMethod + ' ' + value.xp.deliveryDate;
		});
		angular.forEach(groupData, function(val, key){
			angular.forEach(val, function(val1, key1){
				if(listItem.xp.deliveryFeesDtls){
					if(val1.ID == listItem.ID && listItem.xp.deliveryFeesDtls['Standard Delivery']){
						for(var i=0; i<=val.length-1; i++){
							val[i].xp.deliveryDate = null;
						}
					}
				}	
			}, true);
		}, true);
	};
	vm.removePromotions = function(list){
		//Remove promotions for the product
		var temp = [];
		OrderCloud.As().Orders.ListPromotions(vm.order.ID).then(function(res1){
			angular.forEach(res1.Items, function(val){
				temp.push(OrderCloud.As().Orders.RemovePromotion(vm.order.ID, val.Code));
			});
			if(temp.length > 0){
				$q.all(temp).then(function(result1){
					OrderCloud.As().Orders.Get(temp[0].ID).then(function(res3){
						//d.resolve(res3);
					});
				});
			}else{
				//d.resolve(0);
			}
		});
	};
	vm.getLineItems = function(){
		if(vm.order){
			if(vm.order.Status == "Unsubmitted" || (vm.order.Status == "Open" && $stateParams.editsubmitorder=="true")){
				if($stateParams.SearchType=="Products" || $stateParams.SearchType == 'BuildOrder' || $stateParams.SearchType == 'PDP' || $stateParams.SearchType == 'plp' || $stateParams.SearchType =='elp' || $stateParams.SearchType=='GiftCard'){
					vm.addressbook = false;
					vm.ActiveOrderCartLoader = OrderCloud.LineItems.List(vm.order.ID).then(function(res){
						if(res.Items.length==0)
							angular.element(document.getElementById("build-order-footer")).scope().buildOrderDown.buildorderfooter=true;
						vm.AvoidMultipleDelryChrgs = [];	
						if(res.Items.length==0 && (vm.order.TaxCost != 0 || vm.order.ShippingCost != 0)){
							OrderCloud.Orders.Patch(vm.order.ID, {"ShippingCost": 0, "TaxCost": 0, "xp":{"CapTotalDiscount": 0}}).then(function(res){
								vm.order = res;
							}).catch(function(){
								OrderCloud.Orders.Get(vm.order.ID).then(function(res){
									vm.order = res;
								});
							});
						}
						vm.LinItemsCount = res.Items;
						vm.ActiveOrderCartLoader = LineItemHelpers.GetProductInfo(res.Items).then(function(data) {
							vm.OrderConfirmGrouping = _.groupBy(angular.copy(data), function(value){
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
							// Data clear Starts
							if(vm.DuplicateActiveOrders){
								angular.forEach(data, function(val, key){
									angular.forEach(vm.DuplicateActiveOrders, function(val1, key1){
										if(val.length == val1.length && key==key1){
											data[key] = val1;
										}
										if(val.length > val1.length && key==key1){
											var diff = val.filter(function(item1){
												for (var i in val1) {
													if (item1.ID === val1[i].ID) { return false; }
												};
												return true;
											});
											angular.forEach(diff, function(val2, key2){
												if(!vm.DuplicateActiveOrders[val2.ProductID])
													vm.DuplicateActiveOrders[val2.ProductID] = [];
												vm.DuplicateActiveOrders[val2.ProductID].push(val2);
												data[val2.ProductID] = vm.DuplicateActiveOrders[val2.ProductID];
											});
										}
									}, true);
									//vm.DuplicateActiveOrders[key] = _.without(val, _.findWhere(val, {ID: listItem.ID}));
								}, true);
								angular.forEach(vm.lineItemForm, function(val, key){
									if(!vm.lineItemForm[key])
										delete vm.lineItemForm[key];
									else{
										if(!vm.lineItemForm[key].$$success)
											delete vm.lineItemForm[key];
									}	
								});
							}
							// Data clear ends
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
										val.ShippingAddress.deliveryFeesDtls = val.xp.deliveryFeesDtls;
										vm.AvoidMultipleDelryChrgs.push(val.ShippingAddress);
									}
									var dt;
									val.xp.MinDays = {};
									if(val.xp.deliveryDate){
										var dat = angular.copy(CstDateTime);
										dat.setHours(0, 0, 0, 0);
										if($stateParams.editsubmitorder!="true"){
											if(new Date(val.xp.deliveryDate) < dat)
												delete val.xp.deliveryDate;
											else
												val.xp.deliveryDate = new Date(val.xp.deliveryDate);
										}
										else
											val.xp.deliveryDate = new Date(val.xp.deliveryDate);
									}
									if(val.xp.MinDate){
										angular.forEach(val.xp.MinDate, function(val1, key1){
											dt = angular.copy(CstDateTime);
											dt = dt.setDate(dt.getDate() + val1);
											val.xp.MinDays[key1] = new Date(dt);
										}, true);
										if(vm.buyerXp.Shippers.LocalDelivery){
											if(!vm.buyerXp.Shippers.LocalDelivery.SameDayDelivery)
											val.xp.MinDays['MinToday'] = new Date(angular.copy(CstDateTime).setDate(angular.copy(CstDateTime).getDate() + 1));
										}else
											val.xp.MinDays['MinToday'] = new Date(angular.copy(CstDateTime));
										if(val.xp.MinDate.LocalDelivery){
											dt = angular.copy(CstDateTime);
											if(dt.getHours() >= (vm.buyerXp.Shippers.LocalDelivery.SameDayDeliveryCountDownTimer).substring(0,2))
												dt = dt.setDate(dt.getDate() + val.xp.MinDate.LocalDelivery + 1);
											else
												dt = dt.setDate(dt.getDate() + val.xp.MinDate.LocalDelivery);
											val.xp.MinDays['MinToday'] = new Date(dt);
										}
									}else{
										dt = angular.copy(CstDateTime);
										val.xp.MinDate = {};
										if(dt.getHours() >= (vm.buyerXp.Shippers.LocalDelivery.SameDayDeliveryCountDownTimer).substring(0,2))
											val.xp.MinDays['MinToday'] = dt.setDate(dt.getDate() + 1);
										else
											val.xp.MinDays['MinToday'] = dt;
									}
									/*val.varientsOptions = {};
									if(val.Product.xp != null && val.Product.xp.Specs_Options){
										val.varientsOptions.Size = val.Product.xp.Specs_Options.Cont_Size;
										val.varientsOptions.Color = val.Product.xp.Specs_Options.Color;
									}*/
									if(val.ShippingAddress!=null){
										BuildOrderService.GetPhoneNumber(val.ShippingAddress.Phone).then(function(res){
											if(res){
												val.ShippingAddress.Phone1 = res[0];
												val.ShippingAddress.Phone2 = res[1];
												val.ShippingAddress.Phone3 = res[2];
											}	
										});
										val.ShippingAddress.Zip = parseInt(val.ShippingAddress.Zip);
									}
									if(val.xp.ShippingAddress){
										BuildOrderService.GetPhoneNumber(val.xp.ShippingAddress.Phone).then(function(res){
											if(res){
												val.xp.ShippingAddress.Phone1 = res[0];
												val.xp.ShippingAddress.Phone2 = res[1];
												val.xp.ShippingAddress.Phone3 = res[2];
											}	
										});
									}	
									if(!val.xp.BaseLineItemID && val.xp.ApplicableDeliveryMethods){
										if(!val.xp.addressType && !val.xp.ApplicableDeliveryMethods.OtherType && val.xp.ApplicableDeliveryMethods.InStorePickUp)
											val.xp.addressType = "InStorePickUp";
										else{
											if(!val.xp.addressType){
												val.xp.addressType = "Residence";
												val.LocalOrUPSMinDate = val.xp.MinDays['MinToday'];
											}
										}
									}else{
										val.xp.addressType = "Residence";
										val.LocalOrUPSMinDate = val.xp.MinDays['MinToday'];
									}
									if(val.xp.addressType=="InStorePickUp"){
										val.xp.pickupDate = new Date(val.xp.pickupDate);
										val.willSearch = val.ShippingAddress.CompanyName;
									}
								});
							});
							vm.GetAboveAddresses(null, true);
							if(res.Items.length == 0)
								vm.removePromotions();
						});
						vm.ActiveOrderCartLoader = BuildOrderService.PatchOrder(vm.order, res, SearchData.xp).then(function(data){
							angular.element(document.getElementById("order-checkout")).scope().orderTotal = data.Total;
							vm.orderTotal = data.Total;
							vm.order = data;
							angular.element(document.getElementById("order-summary")).scope().$parent.buildordersummary.order = data;
						});
					});
				}
				else{
					vm.ActiveOrderCartLoader = OrderCloud.LineItems.List(vm.order.ID).then(function(res){
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
						vm.LinItemsCount = res.Items;
						vm.ActiveOrderCartLoader = LineItemHelpers.GetProductInfo(res.Items).then(function(data){
							vm.OrderConfirmGrouping = _.groupBy(angular.copy(data), function(value){
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
							// Data clear Starts
							if(vm.DuplicateActiveOrders){
								angular.forEach(data, function(val, key){
									angular.forEach(vm.DuplicateActiveOrders, function(val1, key1){
										if(val.length == val1.length && key==key1){
											data[key] = val1;
										}
										if(val.length > val1.length && key==key1){
											var diff = val.filter(function(item1){
												for (var i in val1) {
													if (item1.ID === val1[i].ID) { return false; }
												};
												return true;
											});
											angular.forEach(diff, function(val2, key2){
												if(!vm.DuplicateActiveOrders[val2.ProductID])
													vm.DuplicateActiveOrders[val2.ProductID] = [];
												vm.DuplicateActiveOrders[val2.ProductID].push(val2);
												data[val2.ProductID] = vm.DuplicateActiveOrders[val2.ProductID];
											});
										}
									}, true);
									//vm.DuplicateActiveOrders[key] = _.without(val, _.findWhere(val, {ID: listItem.ID}));
								}, true);
								//vm.TemplineItemForm = angular.copy(vm.lineItemForm);
								angular.forEach(vm.lineItemForm, function(val, key){
									if(!vm.lineItemForm[key])
										delete vm.lineItemForm[key];
									else{
										if(!vm.lineItemForm[key].$$success)
											delete vm.lineItemForm[key];
									}	
								});
							}
							// Data clear ends
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
										val.ShippingAddress.deliveryFeesDtls = val.xp.deliveryFeesDtls;
										vm.AvoidMultipleDelryChrgs.push(val.ShippingAddress);
									}
									var dt;
									val.xp.MinDays = {};
									if(val.xp.deliveryDate){
										var dat = angular.copy(CstDateTime);
										dat.setHours(0, 0, 0, 0);
										if($stateParams.editsubmitorder!="true"){
											if(new Date(val.xp.deliveryDate) < dat)
												delete val.xp.deliveryDate;
											else
												val.xp.deliveryDate = new Date(val.xp.deliveryDate);
										}
										else
											val.xp.deliveryDate = new Date(val.xp.deliveryDate);	
									}
									if(val.xp.MinDate){
										angular.forEach(val.xp.MinDate, function(val1, key1){
											dt = angular.copy(CstDateTime);
											dt = dt.setDate(dt.getDate() + val1);
											val.xp.MinDays[key1] = new Date(dt);
										}, true);
										if(vm.buyerXp.Shippers.LocalDelivery){
											if(!vm.buyerXp.Shippers.LocalDelivery.SameDayDelivery)
											val.xp.MinDays['MinToday'] = new Date(angular.copy(CstDateTime).setDate(angular.copy(CstDateTime).getDate() + 1));
										}else
											val.xp.MinDays['MinToday'] = new Date(angular.copy(CstDateTime));
										if(val.xp.MinDate.LocalDelivery){
											dt = angular.copy(CstDateTime);
											if(dt.getHours() >= (vm.buyerXp.Shippers.LocalDelivery.SameDayDeliveryCountDownTimer).substring(0,2))
												dt = dt.setDate(dt.getDate() + val.xp.MinDate.LocalDelivery + 1);
											else
												dt = dt.setDate(dt.getDate() + val.xp.MinDate.LocalDelivery);
											val.xp.MinDays['MinToday'] = new Date(dt);
										}	
									}else{
										dt = angular.copy(CstDateTime);
										val.xp.MinDate = {};
										if(dt.getHours() >= (vm.buyerXp.Shippers.LocalDelivery.SameDayDeliveryCountDownTimer).substring(0,2))
											val.xp.MinDays['MinToday'] = dt.setDate(dt.getDate() + 1);
										else
											val.xp.MinDays['MinToday'] = dt;
									}
									/*val.varientsOptions = {};
									if(val.Product.xp != null && val.Product.xp.Specs_Options){
										val.varientsOptions.Size = val.Product.xp.Specs_Options.Cont_Size;
										val.varientsOptions.Color = val.Product.xp.Specs_Options.Color;
									}*/
									if(val.ShippingAddress!=null){
										BuildOrderService.GetPhoneNumber(val.ShippingAddress.Phone).then(function(res){
											if(res){
												val.ShippingAddress.Phone1 = res[0];
												val.ShippingAddress.Phone2 = res[1];
												val.ShippingAddress.Phone3 = res[2];
											}
										});
										val.ShippingAddress.Zip = parseInt(val.ShippingAddress.Zip);
									}
									if(val.xp.ShippingAddress){
										BuildOrderService.GetPhoneNumber(val.xp.ShippingAddress.Phone).then(function(res){
											if(res){
												val.xp.ShippingAddress.Phone1 = res[0];
												val.xp.ShippingAddress.Phone2 = res[1];
												val.xp.ShippingAddress.Phone3 = res[2];
											}	
										});
									}
									if(!val.xp.BaseLineItemID && val.xp.ApplicableDeliveryMethods){
										if(!val.xp.addressType && !val.xp.ApplicableDeliveryMethods.OtherType && val.xp.ApplicableDeliveryMethods.InStorePickUp)
											val.xp.addressType = "InStorePickUp";
										else{
											if(!val.xp.addressType){
												val.xp.addressType = "Residence";
												val.LocalOrUPSMinDate = val.xp.MinDays['MinToday'];
											}	
										}
									}else{
										val.xp.addressType = "Residence";
										val.LocalOrUPSMinDate = val.xp.MinDays['MinToday'];
									}
									if(val.xp.addressType=="InStorePickUp"){
										val.xp.pickupDate = new Date(val.xp.pickupDate);
										val.willSearch = val.ShippingAddress.CompanyName;
									}
								});
							});
							vm.GetAboveAddresses(null, true);
							if(res.Items.length == 0)
								vm.removePromotions();
						});
						vm.ActiveOrderCartLoader = BuildOrderService.PatchOrder(vm.order, res, SearchData.xp).then(function(data){
							angular.element(document.getElementById("order-checkout")).scope().orderTotal = data.Total;
							vm.orderTotal = data.Total;
							vm.order = data;
							angular.element(document.getElementById("order-summary")).scope().$parent.buildordersummary.order = data;
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
	if($stateParams.SearchType!="Products" && $stateParams.SearchType != 'plp' && $stateParams.SearchType != 'BuildOrder' && $stateParams.SearchType != 'PDP' && $stateParams.SearchType != 'Workshop' && $stateParams.SearchType !='elp' && $stateParams.SearchType!='GiftCard')
		vm.getLineItems();
	$scope.cancelOrder = function(){
		OrderCloud.As().Orders.Cancel(vm.order.ID).then(function(data){
			vm.order = data;
			delete vm.order;
			CurrentOrder.Remove();
			$state.reload($state.current);
			angular.element(document.getElementById("build-order-footer")).scope().buildOrderDown.closePopover();
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
			if(row.xp.ShippingAddress){
				row.xp.ShippingAddress.Phone = "("+row.xp.ShippingAddress.Phone1+") "+row.xp.ShippingAddress.Phone2+"-"+row.xp.ShippingAddress.Phone3;
				delete row.xp.ShippingAddress.Phone1;
				delete row.xp.ShippingAddress.Phone2;
				delete row.xp.ShippingAddress.Phone3;
				row.xp.deliveryDate = row.Product.xp.EventDate;
			}	
			delete row.xp.MinDays;
			if(row.xp.addressType != "Hospital" && row.xp.addressType != "Funeral" && row.xp.addressType != "Church"){
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
			if(row.xp.notifyMe || row.xp.notifyMe=="true")
				row.xp.notifyMe = "true";
			if(!row.xp.notifyMe || row.xp.notifyMe=="false")
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
						var row = _.findWhere(res1, {ID: val.LineNo}), tax = 0;
						if(SearchData.xp && SearchData.xp.TaxExemption){// Tax exemption for user
							if(!SearchData.xp.TaxExemption.Enabled)
								tax = val.Tax;
						}else{
							tax = val.Tax;
						}
						tempArr.push(OrderCloud.LineItems.Patch(vm.order.ID, val.LineNo, {"xp":{"Tax":tax, "TotalCost": Math.floor((row.xp.deliveryCharges+row.LineTotal+val.Tax) * 100) / 100 }}));
					}, true);
					vm.ActiveOrderCartLoader = $q.all(tempArr).then(function(res4){
						delete vm.DuplicateActiveOrders;
						vm.getLineItems();
						setTimeout(function(){
							vm.OrderConfirmPopUp = !vm.OrderConfirmPopUp;
						},1000);	
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
			OrderCloud.Addresses.ListAssignments(null, $stateParams.ID, null, null, true, null, 1, 100).then(function(res){
				var tempArr = [];
				angular.forEach(res.Items, function(val, key){
					tempArr.push(OrderCloud.Addresses.Get(val.AddressID));
				}, true);
				$q.all(tempArr).then(function(result){
					vm.addressesList = result;
				});
			});
		}	
	};
	vm.viewAddrBook();
	vm.GetAboveAddresses = function(line, NoModal){
		vm.TempAddressBook = [];
		angular.forEach(angular.copy(vm.activeOrders), function(val, key){
			angular.forEach(val, function(val1, key1){
				if(val1.ShippingAddress != null){
					if(val1.ShippingAddress.Street1 && val1.ShippingAddress.Zip && val1.ShippingAddress.FirstName)
						vm.TempAddressBook.push(val1.ShippingAddress);
				}		
			}, true);
		}, true);
		vm.TempAddressBook = _.uniq(vm.TempAddressBook, function(item, key, a){
			if(item!=null)
				return item.Street1;
		});
		if(!NoModal){
			vm.recipFields = line;
			$scope.showAboveRecipientModal = !$scope.showAboveRecipientModal;
		}	
	};
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
			return _.indexOf([item],row.CompanyNameAddress) > -1;
		});
		if(line.ShippingAddress == null)
			line.ShippingAddress = {};
		line.ShippingAddress.CompanyName = filt[0].CompanyName;	
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
	vm.changeAddrType = function(addressType, line, form, onload, index){
		if(vm.TempAddrType != addressType && vm.TempAddrType && onload != "onload"){
			var txt = angular.copy(line.ShippingAddress);
			line.ShippingAddress = {};
			if(txt){
				line.ShippingAddress.FirstName = txt.FirstName;
				line.ShippingAddress.LastName = txt.LastName;
			}
			line.PatientFName = null;
			line.PatientLName = null;
			line.xp.deliveryDate = null;
			line.xp.pickupDate = null;
			vm.TempAddrType = addressType;
			vm.MultipleCities = [];
		}
		vm.TempAddrType = angular.copy(addressType);
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
		if(addressType == "Hospital" && onload != "onload")
			vm.ShowHospitalToolTip(index);
		if(addressType == "Church" && onload != "onload")
			vm.ShowChurchToolTip(index);	
		if(addressType == "School" && !vm.SchoolNames){
			vm.GetAllList("School");
		}
		if(addressType == "Cemetery" && !vm.CemeteryNames){
			vm.GetAllList("Cemetery");
		}
		if((addressType != "InStorePickUp" || line.willSearch) && onload != "onload"){
			vm.GetDeliveryFees(line, form);
		}
	};
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
			/*if(value){
				if(!value.$$success && vm.TemplineItemForm){
					vm.lineItemForm[key] = angular.copy(vm.TemplineItemForm)[key];
				}
			}else*/
				return _.isUndefined(value);
		});
		//delete vm.TemplineItemForm;
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
			vm.DtlsAutoPopulate(line);
			vm.ActiveOrderCartLoader = BuildOrderService.DeliveryFeesService(line, form, vm, CstDateTime).then(function(res){
				console.log(res);
			});
		}
		vm.GetAboveAddresses(null, true);
	};
	vm.disabledDates = function (data) {
		return (data.mode === 'day' && (data.date.getDay() === 0));
	};
	vm.SelectedCity = function(city, line, form){
		line.ShippingAddress.City = city;
		vm.DtlsAutoPopulate(line);
		vm.GetDeliveryFees(line, form);
	};
	vm.DtlsAutoPopulate = function(lineitem){
		_.filter(vm.activeOrders, function(arr){
			_.each(arr, function(obj){
				_.each(lineitem.xp.AssemblyLineItemsList, function(val){
					if(val==obj.ID){
						var temp = angular.copy(lineitem);
						obj.ShippingAddress = temp.ShippingAddress;
						obj.xp.deliveryCharges = 0;
						obj.xp.TotalCost = obj.LineTotal;
						obj.xp.deliveryDate = temp.xp.deliveryDate;
						obj.xp.CardMessage = temp.xp.CardMessage;
						obj.xp.addressType = temp.xp.addressType;
						obj.xp.productNote = temp.xp.productNote;
						obj.xp.deliveryNote = temp.xp.deliveryNote;
						obj.xp.DeliveryMethod = temp.xp.DeliveryMethod;
						obj.xp.PatientFName = temp.xp.PatientFName;
						obj.xp.PatientLName = temp.xp.PatientLName;
						if(vm.lineItemForm[obj.ID].$valid){
							var id = $('#lineItemForm_' + obj.ID).parent().parent().attr('id');
							$('#'+id.replace('panel','tab')).css({'border': 'none'});
							if(vm.HighLightErrors)
								delete vm.HighLightErrors[obj.ID];
						}
					}
				});
				_.each(lineitem.xp.AddExtraLineItemsList, function(val){
					if(val==obj.ID){
						var temp = angular.copy(lineitem);
						obj.ShippingAddress = temp.ShippingAddress;
						obj.xp.deliveryCharges = 0;
						obj.xp.TotalCost = obj.LineTotal;
						obj.xp.deliveryDate = temp.xp.deliveryDate;
						obj.xp.CardMessage = temp.xp.CardMessage;
						obj.xp.addressType = temp.xp.addressType;
						obj.xp.productNote = temp.xp.productNote;
						obj.xp.deliveryNote = temp.xp.deliveryNote;
						obj.xp.DeliveryMethod = temp.xp.DeliveryMethod;
						obj.xp.PatientFName = temp.xp.PatientFName;
						obj.xp.PatientLName = temp.xp.PatientLName;
						if(vm.lineItemForm[obj.ID].$valid){
							var id = $('#lineItemForm_' + obj.ID).parent().parent().attr('id');
							$('#'+id.replace('panel','tab')).css({'border': 'none'});
							if(vm.HighLightErrors)
								delete vm.HighLightErrors[obj.ID];
						}
					}
				});
			});
		});
	};
	vm.HospitalTemplate = {
		templateUrl: 'HospitalOptions.html',
	};
	vm.CloseHospitalToolTip = function (index) {
		vm['HospitalToolTip'+index] = false;
	};
	vm.ShowHospitalToolTip = function (index) {
		vm['HospitalToolTip'+index] = true;
	};
	vm.HospitalSelect = function (option, index, lineitem) {
		vm['HospitalToolTip'+index] = false;
		if(option=="Patient")
			lineitem.Patient = true;
		else
			lineitem.Patient = false;
	};
	vm.ChurchTemplate = {
		templateUrl: 'ChurchOptions.html',
	};
	vm.CloseChurchToolTip = function (index) {
		vm['ChurchToolTip'+index] = false;
	};
	vm.ShowChurchToolTip = function (index) {
		vm['ChurchToolTip'+index] = true;
	};
	vm.ChurchSelect = function (option, index, lineitem) {
		vm['ChurchToolTip'+index] = false;
		if(option=="InMemoryOf")
			lineitem.InMemoryOf = true;
		else
			lineitem.InMemoryOf = false;
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

function buildOrderPLPController(productList, alfrescoAccessURL) {
	var vm = this;
	vm.alfrecoTct=localStorage.getItem("alfrescoTicket");
	vm.alfrescoAccessURL=alfrescoAccessURL;
}

function buildOrderPDPController($scope, $sce, $stateParams, alfrescoAccessURL, buyerid, OrderCloud,LocalDeliveryCities) {
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
	if($stateParams.SearchType=='GiftCard' || ($stateParams.SearchType=='User' && $stateParams.nonOrderClaim=="true")){
		OrderCloud.Buyers.List(buyerid, 1, 1, 'ID').then(function(res){
			vm.giftCard=res.Items[0].xp.GiftCardSettings;
			console.log("vm.giftCard", vm.giftCard);
			vm.giftcardamount=vm.giftCard.PurchaseSetting.MinPurchaseAmt;
			OrderCloud.Products.Get('Gift_Card_Product').then(function(result){
				vm.giftCard.data=result;
			});
		});
	}

}
  
function buildOrderSummaryController($scope, $state, ocscope, buyerid, $cookieStore, $stateParams, $exceptionHandler, Order, CurrentOrder, AddressValidationService, LineItemHelpers, OrderCloud, $http, BuildOrderService, $q, SearchData, $sce, CstDateTime, TaxService, alfrescoAccessURL) {
    var vm = this;
    vm.cartmerge=false;
    vm.guestcheckout=false;
    vm.guestcartdata=[];
	vm.alfticket = localStorage.getItem("alfrescoTicket");
	vm.alfrescoAccessURL=alfrescoAccessURL;
	/*vm.showUser=false;
	vm.userEdit=false;*/
	vm.ShowRemoveTool = {};
	vm.removeProd = function(id){
		//vm.ShowRemoveTool = true;
		vm.ShowRemoveTool[id] = true;
	};
	vm.clearData= function(){
		angular.element('.searchtpl').scope().$$childTail.clearData();
	}
	vm.ToolTip = {
		templateUrl: 'removeProd.html'
	};
	vm.closePopover = function (id) {
		vm.ShowRemoveTool[id] = false;
	};
	vm.mergeanonorder = function(){
		angular.element(document.getElementById("build-order-footer")).scope().buildOrderDown.mergeanonorder(vm.guestcartdata);
	}
	console.log("buildOrderSummaryController alfticket:",vm.alfticket);
	console.log("buildOrderSummaryController alfrescoAccessURL:",vm.alfrescoAccessURL);
    if($stateParams.SearchType != 'Products' && $stateParams.SearchType != 'PDP' && $stateParams.SearchType != 'BuildOrder' && $stateParams.SearchType != 'plp' && $stateParams.SearchType!='Workshop' && $stateParams.SearchType !='elp' && $stateParams.SearchType!='GiftCard'){
		vm.order = Order;
	}
	else if($stateParams.SearchType == 'Products' || $stateParams.SearchType == 'PDP' || $stateParams.SearchType == 'BuildOrder' || $stateParams.SearchType == 'plp' || $stateParams.SearchType =='elp' || $stateParams.SearchType=='GiftCard'){
		vm.order=angular.element(document.getElementById("BuildOrderRightNav")).scope().buildOrderRight.order;
	}
	vm.selectUser = function(user){	
		vm.showDetails=user;
		vm.userEdit=false;
		vm.showUser=true;
	}
	vm.openUser=function(data){
        var tokenrequest={
			"ClientID": "8836BE8D-710A-4D2D-98BF-EDBE7227E3BB",
			"Claims": [
				ocscope
			]
		}
		var anonymoustoken=$cookieStore.get("OMS.impersonation.token");
		OrderCloud.Auth.RemoveImpersonationToken();
        OrderCloud.Users.GetAccessToken(data.ID, tokenrequest).then(function(buyertoken){
        	console.log("buyertoken",buyertoken);
        	OrderCloud.Auth.SetImpersonationToken(buyertoken['access_token']);
        	$stateParams.orderID=vm.order.ID;
        	OrderCloud.As().Me.Get().then(function(loginuser){
        		$stateParams.ID=loginuser.ID;
        		angular.element(document.getElementById("build-order-footer")).scope().buildOrderDown.ReOrder();
        	})
        	//angular.element(document.getElementById("build-order-footer")).scope().buildOrderDown.ReOrder();
        	
        });
	};
	vm.ordertransfer = function(anonymoustoken, buyertoken){
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
			console.log("alfresco error",data);
        });
	}
	vm.statechange = function(){
		angular.element(document.getElementById("buildorder")).scope().$parent.buildOrder.guestUserModal=false;
		vm.guestcheckout=true;
		if(vm.order){
			//vm.guestcheckout=true;
			vm.ordersummary1=angular.element(document.getElementById("buildorder")).scope().$parent.showOrdersummary;
			$stateParams.ID=vm.order.FromUserID;
			if(($stateParams.SearchType == 'Products' || $stateParams.SearchType == 'BuildOrder' || $stateParams.SearchType == 'PDP' || $stateParams.SearchType == 'plp' || $stateParams.SearchType =='elp' || $stateParams.SearchType=='GiftCard') && vm.ordersummary1){
				$state.go('checkout', {ID:$stateParams.ID}, {reload:true});
			}
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
					value.xp.deliveryCharges += Math.floor(parseFloat(val) * 100) / 100;
				});
				value.ShippingAddress.deliveryDate = value.xp.deliveryDate;
				value.ShippingAddress.lineID = value.ID;
				value.ShippingAddress.DeliveryMethod = value.xp.DeliveryMethod;
				value.ShippingAddress.deliveryFeesDtls = value.xp.deliveryFeesDtls;
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
			data[n][0].TempDeliveryCharges = 0;
			data[n][0].TempCharges = {};
			data[n][0].TempChargesTypeCount = {};
			_.each(data[n], function(val,index){
				if(val.xp.Tax)
					vm.TotalCost[n] += val.xp.deliveryCharges+val.xp.Tax+val.LineTotal;
				else
					vm.TotalCost[n] += val.xp.deliveryCharges+val.LineTotal;
				vm.TotalTax[n] += Math.floor(parseFloat(val.xp.Tax) * 100) / 100;
				if(val.xp.deliveryFeesDtls){
					//data[n] = _.reject(data[n], val);
					//data[n].unshift(val);
					//data[n][0].xp.deliveryFeesDtls = 
					angular.forEach(val.xp.deliveryFeesDtls, function(val1, key1){
						data[n][0].TempDeliveryCharges += parseFloat(val1);
						if(!data[n][0].TempCharges[key1]){
							data[n][0].TempCharges[key1] = 0;
							data[n][0].TempChargesTypeCount[key1+'Count'] = 0;
						}
						data[n][0].TempCharges[key1] += Math.floor(parseFloat(val1) * 100) / 100;;
						data[n][0].TempChargesTypeCount[key1+'Count'] += 1;
						//if(index != 0){
							//data[n][index].xp.deliveryFeesDtls[key1] = Math.floor(parseFloat(data[n][index].xp.deliveryFeesDtls[key1])* 100) / 100;
							//if(data[n][index].xp.deliveryFeesDtls[key1])
								//data[n][index].xp.deliveryFeesDtls[key1] = Math.floor(parseFloat(data[n][index].xp.deliveryFeesDtls[key1])* 100) / 100;
							//data[n][0].xp.deliveryFeesDtls[key1] = Math.floor(parseFloat(data[n][index].xp.deliveryFeesDtls[key1])* 100) / 100;
							//if(!data[n][0].xp.deliveryFeesDtls[key1])
								//data[n][0].xp.deliveryFeesDtls[key1] = 0;
								//data[n][0].xp.deliveryFeesDtls[key1] = Math.floor(data[n][0].xp.deliveryFeesDtls[key1] * 100) / 100;
							//if(data[n][0].ID != val.ID)
								//data[n][0].xp.deliveryFeesDtls[key1] += Math.floor(parseFloat(val1) * 100) / 100;
						//}	
					}, true);
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
			vm.OrderSummaryLoader = OrderCloud.LineItems.List(vm.order.ID).then(function(res){
				vm.OrderSummaryLoader = LineItemHelpers.GetProductInfo(res.Items).then(function(data){
					vm.grouping(data);
				});
				BuildOrderService.PatchOrder(vm.order, res, SearchData.xp).then(function(data){
					angular.element(document.getElementById("order-checkout")).scope().orderTotal = data.Total;
				});
			});
		}else{
			if($stateParams.SearchType != 'Products' && $stateParams.SearchType != 'BuildOrder' && $stateParams.SearchType != 'PDP' && $stateParams.SearchType != 'plp' && $stateParams.SearchType!='Workshop' && !$stateParams.orderDetails && $stateParams.SearchType != 'elp' && $stateParams.SearchType!='GiftCard'){
				vm.OrderSummaryLoader = BuildOrderService.GetUnsubmittedOrder().then(function(res2){
					if(res2 != 0){
						vm.order = res2;
						CurrentOrder.Set(res2.ID);
						vm.orderSummaryShow();
					}
				});
			}	
		}
	};
	vm.orderSummaryShow();
    vm.deleteProduct = function(lineitem) {
		vm.OrderSummaryLoader = OrderCloud.LineItems.Delete(vm.order.ID, lineitem.ID).then(function() {
			vm.orderSummaryShow();
			vm.ShowRemoveTool[lineitem.ID] = false;
		}).catch(function(ex) {
			$exceptionHandler(ex);
		});
    };
	var deliveryCharges;
	BuildOrderService.GetBuyerDtls().then(function(res){
		deliveryCharges = res.xp.ZipCodes;
		vm.buyerXp = res.xp;
		vm.buyerXp.deliveryChargeAdjReasons.unshift("---select---");
	});
	
	vm.lineDtlsSubmit = function(recipient, index){
		var deliverySum = 0, TempArr = [];
		angular.forEach(recipient, function(val, key){
			angular.forEach(val.xp.deliveryFeesDtls, function(val1, key1){//Divide delivery charges if edited...
				var amt = recipient[0].TempCharges[key1]/recipient[0].TempChargesTypeCount[key1+'Count'];
				val.xp.deliveryFeesDtls[key1] = amt;
				val1 = amt;
				deliverySum += Math.floor(parseFloat(val1) * 100) / 100;
			});
			delete val.xp.Discount;
			val.ShipFromAddressID = "testShipFrom";
			if(val.xp.deliveryChargeAdjReason == "---select---")
				delete val.xp.deliveryChargeAdjReason;
			val.ShippingAddress = recipient[0].ShippingAddress;
			TempArr.push(OrderCloud.LineItems.Update(vm.order.ID, val.ID, val));
		}, true);
		vm.OrderSummaryLoader = $q.all(TempArr).then(function(result){
			TempArr = [];
			angular.forEach(recipient, function(val, key){
				TempArr.push(OrderCloud.LineItems.SetShippingAddress(vm.order.ID, val.ID, val.ShippingAddress));
			}, true);
			vm.OrderSummaryLoader = $q.all(TempArr).then(function(result2){
				vm.OrderSummaryLoader = TaxService.GetTax(vm.order.ID).then(function(res3){
					TempArr = [];
					angular.forEach(res3.ResponseBody.TaxLines, function(val, key){
						var row = _.findWhere(result2, {ID: val.LineNo}), tax = 0;
						if(SearchData.xp.TaxExemption){// Tax exemption for user
							if(!SearchData.xp.TaxExemption.Enabled)
								tax = val.Tax;
						}else{
							tax = val.Tax;
						}
						if(row){
							row.xp.deliveryCharges = 0;
							_.filter(row.xp.deliveryFeesDtls, function(val){
								row.xp.deliveryCharges += Math.floor(parseFloat(val) * 100) / 100;
							});
							TempArr.push(OrderCloud.LineItems.Patch(vm.order.ID, val.LineNo, {"xp":{"Tax":tax, "TotalCost":Math.floor((row.xp.deliveryCharges+row.LineTotal+val.Tax) * 100) / 100}}));
						}	
					}, true);
					vm.OrderSummaryLoader = $q.all(TempArr).then(function(res4){
						var temp = {"Items":res4};
						BuildOrderService.PatchOrder(vm.order, temp, SearchData.xp).then(function(){
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
	vm.CheckDeliveryEmpty = function(data){
		if(!_.isEmpty(data))
			return true;
	};
}

function BuildOrderService( $q, $window, $stateParams, ocscope, buyerid, OrderCloud, $http, alfrescoDocsUrl, alfrescoAccessURL, Underscore, $cookieStore, GetCstTime, algolia, AddressValidationService, GoogleAPI, Alfresco) {
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
		GetLocalCities: _GetLocalCities,
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
		GetUnsubmittedOrder: _getUnsubmittedOrder,
		GetInventory: _getInventory
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
		if(phn){
			var arr = [];
			var init = phn.indexOf('(');
			var fin = phn.indexOf(')');
			arr.push(parseInt(phn.substr(init+1,fin-init-1)));
			if(isNaN(arr) && phn.length==10){
				arr = [];
				arr.push(parseInt(phn.substring(0, 3)));
				arr.push(parseInt(phn.substring(3, 6)));
				arr.push(parseInt(phn.substring(6, 10)));
			}else{
				init = phn.indexOf(')');
				fin = phn.indexOf('-');
				arr.push(parseInt(phn.substr(init+1,fin-init-1)));
				init = phn.indexOf('-');
				arr.push(parseInt(phn.substr(init+1,phn.length)));
			}
			d.resolve(arr);
		}else{
			d.resolve();
		}	
		return d.promise;
	}
	function _GetBuyerDtls(){
		var d = $q.defer();
		OrderCloud.Buyers.Get('Bachmans').then(function(res){
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
		OrderCloud.Addresses.List(null,1, 100,null,null,{"ID":type+"-*"}).then(function(res){
			var TotalPages=res.Meta.TotalPages;
			var destinationdata=[];
			for (var i = 0; i <= TotalPages-1; i++) {
				destinationdata.push(OrderCloud.Addresses.List(null,i+1, 100,null,null,{"ID":type+"-*"}));
			}
			if(TotalPages > 1){
				$q.all(destinationdata).then(function(result){
					destinationdata=[];
					angular.forEach(result, function(val){
						destinationdata = _.union(destinationdata, val.Items);
					});
					destinationdata = _.filter(destinationdata, function(row){
						return row.CompanyNameAddress = row.CompanyName+' ('+row.Street1+', '+row.City+')';
					});
					var dtls = _.pluck(destinationdata, 'CompanyNameAddress');
					d.resolve({"data": {"Names": dtls, "List": destinationdata}});
				});
			}else{
				res.Items = _.filter(res.Items, function(row){
					return row.CompanyNameAddress = row.CompanyName+' ('+row.Street1+', '+row.City+')';
				});
				var dtls = _.pluck(res.Items, 'CompanyNameAddress');
				d.resolve({"data": {"Names": dtls, "List": res.Items}});
			}	
		});
		return d.promise;
	}
	function _GetStores(){
		var d = $q.defer();
		OrderCloud.Addresses.List(null, 1, 100, null, null, {"ID":"Store-*"}).then(function(res){
			var filt = _.filter(res.Items, function(row){
				if(row.CompanyName)
					return row.CompanyName.indexOf("Lunds & Byerlys") == -1;
			});
			d.resolve(filt);
		});
		return d.promise;
	}
	function _GetLocalCities(){
		var d = $q.defer();
		OrderCloud.Addresses.List(null, 1, 100, null, null, {"ID":"LDCity-*"}).then(function(res){
			var filt = _.pluck(res.Items, 'City');
			service.LocalCities = filt;
			d.resolve(filt);
		});
		return d.promise;
	}
	function _OrderOnHoldRemove(data, ID){
		var d = $q.defer(), OrderOnHold = _.pluck(data, 'xp');
		OrderOnHold = _.pluck(OrderOnHold, 'Status');
		if(OrderOnHold.indexOf("OnHold") == -1){
			if($stateParams.SearchType == 'Products' || $stateParams.SearchType == 'PDP' || $stateParams.SearchType == 'BuildOrder' ||  $stateParams.SearchType == 'plp' || $stateParams.SearchType =='elp' || $stateParams.SearchType=='GiftCard'){
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
	function _PatchOrder(order, data, xp){
		var d = $q.defer(), delChrgs = 0, CapTotalDiscount = 0;
		angular.forEach(data.Items, function(val, key){
			angular.forEach(val.xp.deliveryFeesDtls, function(val1, key1){
				delChrgs += Math.floor(parseFloat(val1) * 100) / 100;;
			},true);
		},true);
		if(delChrgs > 250){
			CapTotalDiscount = delChrgs - 250;
			delChrgs = 250;
		}
		var obj = {"ShippingCost": delChrgs, "xp":{"CapTotalDiscount": CapTotalDiscount}};
		if(xp){
			if(xp.TaxExemption){
				if(xp.TaxExemption.Enabled){
					obj.TaxCost = 0;
				}
			}
		}	
		if($stateParams.SearchType == 'Products' || $stateParams.SearchType == 'PDP' || $stateParams.SearchType == 'BuildOrder' || $stateParams.SearchType == 'plp' || $stateParams.SearchType =='elp' || $stateParams.SearchType=='GiftCard'){
			OrderCloud.Orders.Patch(order.ID, obj).then(function(res){
				d.resolve(res);
			}).catch(function(){
				OrderCloud.Orders.Get(order.ID).then(function(res){
					d.resolve(res);
				});
			});
		}else{
			OrderCloud.As().Orders.Patch(order.ID, obj).then(function(res){
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
	function _getProductList(res, rootnode){
		// var d = $q.defer(), ticket = localStorage.getItem("alfrescoTicket"), data, imgUrl;   
		// data = Underscore.filter(res, function(row){
			// var podID=row.ID;
			// podID=podID.toString();
			// imgUrl = Underscore.filter(productImages, function(row1){
				// var str=row1.displayName;
				// str=str.replace(/.jpg/g, "");
				// return str.indexOf(podID) != -1;
			// });
			// if(imgUrl.length > 0){
				// var baseImage;
				// Underscore.filter(imgUrl, function(row1){
					// var str=row1.displayName;
					// str=str.replace(/.jpg/g, "");
					// if(str==podID)
					// {
						// row.baseImage = alfrescoAccessURL+"/"+ row1.contentUrl + "?alf_ticket=" + ticket;
					// }
				// });
				// row.alternativeImg = [];
				// angular.forEach(imgUrl, function(value, key) {
					// row.alternativeImg.push(alfrescoAccessURL+"/" + value.contentUrl + "?alf_ticket=" + ticket);;
				// });
				// return row.alternativeImg;
			// }else
				// return row;
		// });
		// d.resolve(data);
		// return d.promise;
		 var d = $q.defer(), ticket = localStorage.getItem("alfrescoTicket"), data, count=1;   
			angular.forEach(res, function (row) {
			var params={
				GetItems:'Search',
				searchTerm:row.ID,
				rootNode:rootnode
			}
			Alfresco.Search(params).then(function(response){
				var podID=row.ID;
				podID=podID.toString();
				if(response.data.items.length > 0){
					var baseImage;
					Underscore.filter(response.data.items, function(row1){
						var str=row1.displayName;
						str=str.replace(/.jpg/g, "");
						if(str==podID)
						{
							//row1.displayName = row1.name;
							var nodeID = row1.nodeRef.split("/")[3];
							row1.contentUrl = "api/node/content/workspace/SpacesStore/" + nodeID + "/" + row1.name;
							row.baseImage = alfrescoAccessURL+"/"+ row1.contentUrl + "?alf_ticket=" + ticket;
						}
					});
					row.alternativeImg = [];
					angular.forEach(response.data.items, function(value, key) {
						//row1.displayName = value.name;
						var nodeID = value.nodeRef.split("/")[3];
						var contentUrl = "api/node/content/workspace/SpacesStore/" + nodeID + "/" + value.name;
						row.alternativeImg.push(alfrescoAccessURL+"/" + contentUrl + "?alf_ticket=" + ticket);;
					});
					//return row.alternativeImg;
					if(count==res.length){
						d.resolve(res);
					}
					count++;
				}
				else{
					if(count==res.length){
						d.resolve(res);
					}
				 count++;
				 }
				
			});
		})
		
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
		if($stateParams.SearchType != 'Products' && $stateParams.SearchType != 'PDP' && $stateParams.SearchType != 'BuildOrder' && $stateParams.SearchType!=undefined && $stateParams.SearchType!='Workshop' && $stateParams.SearchType !='elp' && $stateParams.SearchType!='GiftCard'){
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
		if(line.ShippingAddress.Zip){
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
					}else{
						delete line.MultipleCities;
						angular.forEach(res.data.results[0].address_components, function(component,index){
							var types = component.types;
							angular.forEach(types, function(type,index){
								if(type == 'locality') {
									line.ShippingAddress.City = component.long_name;
								}
								if(type == 'administrative_area_level_1') {
									line.ShippingAddress.State = component.short_name;
								}
							});
						});
					}	
				});
			}
		}
		if((line.xp.deliveryDate || line.xp.pickupDate) && line.ShippingAddress.Zip && line.ShippingAddress.Street1 && line.ShippingAddress.FirstName && line.ShippingAddress.LastName){
			AddressValidationService.Validate(line.ShippingAddress).then(function(res){
				delete vm.AddressError;
				if(res.ResponseBody.ResultCode == 'Success'){
					if(form)
						form.invalidAddress = false;
					validatedAddress = res.ResponseBody.Address;
					zip = validatedAddress.PostalCode.substring(0, 5);
					if(!line.MultipleCities)
						line.ShippingAddress.Zip = parseInt(zip);
					line.ShippingAddress.Street1 = validatedAddress.Line1;
					line.ShippingAddress.Street2 = validatedAddress.Line2;
					if(!line.MultipleCities)
						line.ShippingAddress.City = validatedAddress.City;
					line.ShippingAddress.State = validatedAddress.Region;
					line.ShippingAddress.Country = validatedAddress.Country;
					IsLocal =  _.contains(service.LocalCities, line.ShippingAddress.City);
					if(line.xp.DeliveryMethod!="Courier"){
						delete line.xp.DeliveryMethod;
						if(!line.xp.DeliveryMethod){
							if(IsLocal){
								line.xp.DeliveryMethod = "LocalDelivery";
								if(line.xp.MinDays){
									if(line.xp.MinDays.MinToday){
										if(line.LocalOrUPSMinDate!=line.xp.MinDays.MinToday && line.LocalOrUPSMinDate){
											line.xp.deliveryDate = null;
											if(line.dateVal){
												line.dateVal.Date = null;
												line.dateVal.Month = null;
												line.dateVal.Year = null;
											}
										}
										line.LocalOrUPSMinDate = line.xp.MinDays.MinToday;
									}	
								}
							}else{
								line.xp.DeliveryMethod = "UPS";
								if(line.xp.MinDays){
									if(line.LocalOrUPSMinDate!=line.xp.MinDays.UPS && line.LocalOrUPSMinDate){
										line.xp.deliveryDate = null;
										if(line.dateVal){
											line.dateVal.Date = null;
											line.dateVal.Month = null;
											line.dateVal.Year = null;
										}
									}	
									if(line.xp.MinDays.UPS)
										line.LocalOrUPSMinDate = line.xp.MinDays.UPS;
									else
										line.LocalOrUPSMinDate = line.xp.MinDays.MinToday;
								}
							}
						}
					}
					if(line.xp.addressType=="InStorePickUp"){
						line.xp.DeliveryMethod = "InStorePickUp";
					}
					OrderCloud.Categories.ListProductAssignments(null, line.ProductID).then(function(res1){
						OrderCloud.Categories.Get(res1.Items[0].CategoryID).then(function(res2){
							dlvryMethods = res2.xp.CategoryDeliveryCharges.DeliveryMethods;
							if(dlvryMethods[line.xp.DeliveryMethod]){
								delete line.xp.Destination;
								line.xp.Status = null;
								line.DeliveryNotAvailable = false;
								if(line.xp.DeliveryMethod=="LocalDelivery"){
									obj['Standard Delivery'] = vm.buyerXp.Shippers.LocalDelivery.StandardDeliveryFees;
									if(line.Quantity >= vm.buyerXp.Shippers.Global.Quantity){
										if(line.Product.xp.Handling)
											obj['Handling Charges'] = line.Product.xp.Handling;
										//Faster delivery checking same day or next day 
										var CstToday = new Date(angular.copy(CstDateTime));
										CstToday = CstToday.getMonth()+1 +'/'+ CstToday.getDate() +'/'+ CstToday.getFullYear();
										var CstTom = new Date(angular.copy(CstDateTime));
										CstTom = new Date(CstTom.setDate(CstTom.getDate() + 1));
										CstTom = CstTom.getMonth()+1 +'/'+ CstTom.getDate() +'/'+ CstTom.getFullYear();
										var lineDt = new Date(angular.copy(line.xp.deliveryDate));
										lineDt = lineDt.getMonth()+1 +'/'+ lineDt.getDate() +'/'+ lineDt.getFullYear();
										if(dlvryMethods.Faster && ((new Date(CstDateTime).getHours() < 10 && CstToday == lineDt) || new Date(lineDt) >= new Date(CstTom))){
											//line.xp.DeliveryMethod = "Faster";
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
								if(res2.Name=="GiftCards"){
									obj = {};
									obj['USPS Charges'] = vm.buyerXp.Shippers.USPS.USPSCharges;
								}
								if(res2.xp.PalletCharge)
									obj['Pallet Charge'] = res2.xp.PalletCharge;
								if(line.xp.deliveryFeesDtls && line.xp.addressType != "InStorePickUp"){
									if(line.xp.deliveryFeesDtls['Placement Charges'])
										obj['Placement Charges'] = line.xp.deliveryFeesDtls['Placement Charges'];
								}
								dt = angular.copy(new Date(CstDateTime));
								dt = dt.getMonth()+1+'/'+dt.getDate()+'/'+dt.getFullYear();
								var dttest = new Date(line.xp.deliveryDate);
								if(dttest){
									dttest = dttest.getMonth()+1+'/'+dttest.getDate()+'/'+dttest.getFullYear();
									if(angular.copy(new Date(CstDateTime)).getHours() < 10 && dt == dttest && line.xp.DeliveryMethod=="LocalDelivery"){
										if(line.xp.addressType == "Funeral" || line.xp.addressType == "Church"){
											if(vm.buyerXp.Shippers.LocalDelivery.SameDayDeliveryFees > 0){
												obj = {};
												obj['Same Day Delivery'] = vm.buyerXp.Shippers.LocalDelivery.SameDayDeliveryFees;
											}else{
												obj[line.xp.addressType+" Charges"] = vm.buyerXp.Shippers.LocalDelivery.Funeral_ChurchFees;
											}
										}
									}
								}	
								line.xp.deliveryFeesDtls = obj;
								line.xp.TotalCost = 0;
								line.xp.deliveryCharges = 0;
								angular.forEach(vm.AvoidMultipleDelryChrgs, function(val, key){
									val.deliveryDate = new Date(val.deliveryDate);
									var dt2, dt1;
									dt1 = (("0" + (val.deliveryDate.getMonth()+1)).slice(-2))+"-"+(("0" + val.deliveryDate.getDate()).slice(-2))+"-"+val.deliveryDate.getFullYear();
									if(line.xp.deliveryDate){
										line.xp.deliveryDate = new Date(line.xp.deliveryDate);
										dt2 = (("0" + (line.xp.deliveryDate.getMonth()+1)).slice(-2))+"-"+(("0" + line.xp.deliveryDate.getDate()).slice(-2))+"-"+line.xp.deliveryDate.getFullYear();
									}
									if(val.deliveryFeesDtls){
										if(dt1 == dt2 && val.FirstName == line.ShippingAddress.FirstName && val.LastName == line.ShippingAddress.LastName && val.Zip == line.ShippingAddress.Zip && (val.Street1).split(/(\d+)/g)[1] == (line.ShippingAddress.Street1).split(/(\d+)/g)[1] && val.lineID != line.ID && val.DeliveryMethod == line.xp.DeliveryMethod && val.deliveryFeesDtls['Standard Delivery']){
											vm.NoDeliveryFees = true;
										}
									}	
								}, true);
								if(vm.NoDeliveryFees == true || line.xp.addressType=="InStorePickUp"){
									delete line.xp.deliveryFeesDtls['Standard Delivery'];
									delete line.xp.deliveryFeesDtls['Courier Charges'];
									if(_.keys(line.xp.deliveryFeesDtls).length == 0){
										delete line.xp.deliveryFeesDtls;
										line.xp.deliveryCharges = 0;
									}
									angular.forEach(line.xp.deliveryFeesDtls, function(val, key){
										line.xp.deliveryCharges += Math.floor(parseFloat(val) * 100) / 100;
									}, true);
									if(line.xp.Tax)
										line.xp.TotalCost = line.xp.deliveryCharges + line.xp.TotalCost + line.xp.Tax + (line.Quantity * line.UnitPrice);
									else
										line.xp.TotalCost = line.xp.deliveryCharges + line.xp.TotalCost + (line.Quantity * line.UnitPrice);
								}else{
									angular.forEach(line.xp.deliveryFeesDtls, function(val, key){
										line.xp.deliveryCharges += Math.floor(parseFloat(val) * 100) / 100;
									}, true);
									line.xp.TotalCost = line.xp.deliveryCharges + (line.Quantity * line.UnitPrice);
									if(line.xp.Tax)
										line.xp.TotalCost = line.xp.TotalCost + line.xp.Tax;
								}
								vm.AvoidMultipleDelryChrgs = [];
								//vm.AvoidMultipleDelryChrgs = _.without(vm.AvoidMultipleDelryChrgs, _.findWhere(vm.AvoidMultipleDelryChrgs, {lineID: line.ShippingAddress.lineID}));
								//vm.lineItemProducts = [];
								angular.forEach(vm.activeOrders,function(val1, key1){
									//vm.lineItemProducts.push(key1);
									angular.forEach(vm.activeOrders[key1],function(val, key){
										if(val.ShippingAddress && val.xp.deliveryFeesDtls){
											val.ShippingAddress.deliveryDate = val.xp.deliveryDate;
											val.ShippingAddress.lineID = val.ID;
											val.ShippingAddress.DeliveryMethod = val.xp.DeliveryMethod;
											val.ShippingAddress.deliveryFeesDtls = angular.copy(val.xp.deliveryFeesDtls);//angular.copy for checkout issue added
											vm.AvoidMultipleDelryChrgs.push(val.ShippingAddress);
										}
									}, true);
								}, true);
								if((line.Product.xp['CodeB4'] == "F" || line.Product.xp['CodeB4'] == "T" || line.Product.xp['CodeB4'] == "E") && line.xp.DeliveryMethod!="LocalDelivery"){
									if(!line.xp.deliveryCharges)
										line.xp.deliveryCharges = 0;
									if(line.Product.xp['CodeB4']== "F")
										line.xp.Destination = "FTD";
									if(line.Product.xp['CodeB4']== "T")
										line.xp.Destination = "TFE";
									line.xp.Status = "OnHold";
									line.DeliveryNotAvailable = false;
								}else if(!line.Product.xp['CodeB4'] && line.xp.DeliveryMethod!="LocalDelivery"){
									if(line.xp.AssemblyLineItemsList){
										if(line.xp.AssemblyLineItemsList.length > 0)
											line.DeliveryNotAvailable = true;
									}
								}else{
									delete line.xp.Destination;
									line.xp.Status = null;
									//line.DeliveryNotAvailable = true;
								}
								d.resolve();
							}else{
								if((line.Product.xp['CodeB4'] == "F" || line.Product.xp['CodeB4'] == "T" || line.Product.xp['CodeB4'] == "E") && line.xp.DeliveryMethod!="LocalDelivery"){
									if(!line.xp.deliveryCharges)
										line.xp.deliveryCharges = 0;
									if(line.Product.xp['CodeB4']== "F")
										line.xp.Destination = "FTD";
									if(line.Product.xp['CodeB4']== "T")
										line.xp.Destination = "TFE";
									line.xp.Status = "OnHold";
									line.DeliveryNotAvailable = false;
								}else if(!line.Product.xp['CodeB4'] && line.xp.DeliveryMethod!="LocalDelivery"){
									//if(line.xp.AssemblyLineItemsList)
										//if(line.xp.AssemblyLineItemsList.length > 0)
											line.DeliveryNotAvailable = true;
								}else{
									delete line.xp.Destination;
									line.xp.Status = null;
									line.DeliveryNotAvailable = true;
								}
								if(line.xp.Tax)
									line.xp.TotalCost = line.xp.deliveryCharges + line.xp.Tax + (line.Quantity * line.UnitPrice);
								else
									line.xp.TotalCost = line.xp.deliveryCharges + (line.Quantity * line.UnitPrice);
								d.resolve();
							}
						});
					});	
				}else{
					if(form)
						form.invalidAddress = true;
					d.resolve();
				}
			}).catch(function(err){
				vm.AddressError = err.Errors[0].Message;
			});
		}else{
			d.resolve();
		}
		return d.promise;
	}
	function _getAlgoliaResults(data, page, noOfHits){
		//var client = algolia.Client('31LAEMRXWG', '600b3cc15477fd21c5931d1bfbb36b3d');
		var client = algolia.Client('B1FOQ7SZ6T', 'f946a36f8e496d36a7366f0140355575');
		var index = client.initIndex('products');
		var search = {
			'query' : '',
			'hits' : []
		};
		search.query=data;
		return index.search(search.query, {hitsPerPage: noOfHits, page:page});
	}
	function _getUnsubmittedOrder(){
		var temp = [], filt, d = $q.defer();
		if($stateParams.ID != 'gby8nYybikCZhjMcwVPAiQ'){
			OrderCloud.As().Me.ListOutgoingOrders(null, 1, 100, null, null, {"Status":"Unsubmitted"}).then(function(res){
				filt = _.filter(res.Items, function(row){
					if(row.xp != null){
						if(row.xp.SavedOrder){
							if(!row.xp.SavedOrder.Flag)
								temp.push(row);
						}else{
							temp.push(row);
						}
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
		}
		else if($stateParams.ID == 'gby8nYybikCZhjMcwVPAiQ'){
			d.resolve(0);
		}else{
			d.resolve(0);
		}
		return d.promise;
	}
	
	function _getInventory(ProductID){
		var d = $q.defer();
		OrderCloud.Products.GetInventory(ProductID).then(function(res){
			if(res.Available!=null && res.Available > 0)
				d.resolve(res.Available);
			else
				d.resolve(0);
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