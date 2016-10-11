angular.module( 'orderCloud' )

	.config( CustInfoConfig )
	.controller( 'CustInfoCtrl', CustInfoController )
;

function CustInfoConfig( $stateProvider ) {
	$stateProvider
		.state( 'custInfo', {
			parent: 'base',
			url: '/custInfo/:ID',
			templateUrl: 'custInfo/templates/custInfo.tpl.html',
			controller: 'CustInfoCtrl',
			controllerAs: 'custInfo',
            params: {
                ID:null                
            },
			data: {
				loadingMessage: 'Loading...'
			},
			resolve: {
                UserList: function( OrderCloud, $state, $q, $stateParams) {
                    var arr={};
					var dfr = $q.defer();
                    OrderCloud.As().Me.Get().then(function(data){
						console.log("dsbhsbhsb", data);
						arr["user"] = data;
						console.log("userssss", arr);
						OrderCloud.As().Me.ListUserGroups(null, 1, 100).then(function(usergrp){
							arr["userGroup"]=usergrp.Items;
						});
						OrderCloud.Addresses.ListAssignments(null, $stateParams.ID).then(function(addrList){
							var temp = [];
							angular.forEach(addrList.Items, function(val){
								temp.push(OrderCloud.Addresses.Get(val.AddressID));
							}, true);
							$q.all(temp).then(function(result){
									arr["addresses"] = result;
									if(arr["user"].xp)
									if(arr["user"].xp.ContactAddr && arr["user"].xp.ContactAddr!=''){
										arr["defaultAddr"]=_.filter(result, function(obj) {
												return _.indexOf([obj.ID], arr["user"].xp.ContactAddr) > -1
										});
										dfr.resolve(arr);
									}
									else{
										arr["defaultAddr"] = [];
										dfr.resolve(arr);
									}
							});
						});
                    });
                    return dfr.promise;
                },
				spendingAccounts:function($q, $state, $stateParams, OrderCloud){
					var dfd = $q.defer();
					var arr=[];
					var spendingAcc={};
				    OrderCloud.SpendingAccounts.ListAssignments(null, $stateParams.ID).then(function(assign){
					console.log("spending acoount iddddd:", assign);
						angular.forEach(assign.Items, function(value, key) {
							OrderCloud.SpendingAccounts.Get(value.SpendingAccountID).then(function(spendingacc){
								arr.push(spendingacc);
								var filterPurple = _.filter(arr, function(row){
									return _.indexOf(["Purple Perks"],row.Name) > -1;
								});
								var filterCharges = _.filter(arr, function(row){
									return _.indexOf(["Bachman Charges"],row.Name) > -1;
								});
								spendingAcc.purple=filterPurple[0];
								spendingAcc.charges=filterCharges[0];
							})
						});
						 console.log("spending final:", spendingAcc);
						 dfd.resolve(spendingAcc);
					  })
					  
					  return dfd.promise;
				},
				creditCard:function($q, $state, $stateParams, OrderCloud){
					var dfd=$q.defer(), TempArr = [];
					OrderCloud.As().Me.ListCreditCards(null, 1, 100).then(function (response) {
						angular.forEach(response.Items, function(value, key) {
							if(value.xp){
								if(value.xp.BillingAddressID)
									TempArr.push(OrderCloud.As().Me.GetAddress(value.xp.BillingAddressID));
							}	
						}, true);
						$q.all(TempArr).then(function(result){
							angular.forEach(response.Items, function(value, key) {
								value.billing=result[key];
							}, true);
							dfd.resolve(response);
						});
					});
					return dfd.promise;
				},
				userSubscription:function($q, ConstantContact, Underscore, OrderCloud, $stateParams ){
					var dfr=$q.defer();

						var ConstantContactId;
						 OrderCloud.Users.Get($stateParams.ID).then(function(data){
							ConstantContactId=data.xp.ConstantContact.ID;
						 })
						ConstantContact.GetListOfSubscriptions().then(function(subscriptionList){
							var params = {
								"ConstantContactId": ConstantContactId
							}
							ConstantContact.GetSpecifiedContact(params).then(function(res){
								if(res.data.lists) {
									var userSubIds = Underscore.pluck(res.data.lists, "id");
									angular.forEach(subscriptionList.data, function (subscription) {
										if (userSubIds.indexOf(subscription.id) > -1) {
											subscription.Checked = true;	
										}
										dfr.resolve(subscriptionList.data);
										console.log("subscriptionList.data", subscriptionList.data);
									})
								}else{
									dfr.resolve(subscriptionList.data);
								}
							});
						});
						return dfr.promise;
				}
			}
		})
}


function CustInfoController($scope, $exceptionHandler, $stateParams, $state, UserList, spendingAccounts, creditCard, OrderCloud, userSubscription, Underscore, ConstantContact, BuildOrderService, AddressValidationService, $http, GoogleAPI) {
	var vm = this;
	vm.list = UserList;
	vm.subscribedList=userSubscription;
	$scope.$parent.base.list = ' ';
	if($scope.$parent.base.search){
		$scope.$parent.base.search.query = ' ';
	}
	$scope.$parent.base.selectChange('customer');
	vm.spendingAcc=spendingAccounts;
	vm.creditCard=creditCard.Items;
	  var userid = vm.list.user.ID;
	  $scope.showModal = false;
	 console.log(userid);
	 if(vm.list.user.TermsAccepted != null) {
         vm.list.TermsAccepted = true;
		 console.log(vm.list.TermsAccepted);
    }	
     vm.Submit = function(form) {
		form.$submitted = true;
		if(form.$valid){
			AddressValidationService.Validate(vm.list.defaultAddr[0]).then(function(res){
				if(res.ResponseBody.Address){
					var validatedAddress = res.ResponseBody.Address;
					var zip = validatedAddress.PostalCode.substring(0, 5);
					vm.list.defaultAddr[0].Zip = parseInt(zip);
					vm.list.defaultAddr[0].Street1 = validatedAddress.Line1;
					vm.list.defaultAddr[0].Street2 = null;
					vm.list.defaultAddr[0].City = validatedAddress.City;
					vm.list.defaultAddr[0].State = validatedAddress.Region;
					vm.list.defaultAddr[0].Country = validatedAddress.Country;
					var today = new Date();
					vm.list.user.Phone = "("+vm.list.user.contact.Phone1+") "+vm.list.user.contact.Phone2+"-"+vm.list.user.contact.Phone3;
					vm.list.user.TermsAccepted = today;
							OrderCloud.As().Me.Update(vm.list.user).then(function(){
							});
							if(vm.list.user.xp.ContactAddr && vm.list.user.xp.ContactAddr!=''){
								OrderCloud.Addresses.Update(vm.list.defaultAddr[0].ID,vm.list.defaultAddr[0]).then(function(){
									//$state.go('custInfo', {}, {reload:true});
									$scope.isEditing = !$scope.isEditing;
								});
							}
							else{
								OrderCloud.Addresses.Create(vm.list.defaultAddr[0]).then(function(addr){
									var saveassign=[{
										"AddressID": addr.ID,
										"UserID": $stateParams.ID,
										"IsShipping": true,
										"IsBilling": true
									}];
									OrderCloud.Addresses.SaveAssignment(saveassign[0]).then(function(data){
										OrderCloud.Users.Patch($stateParams.ID,{"xp":{"ContactAddr":data.AddressID}}).then(function(user){
											$scope.isEditing = !$scope.isEditing;
											console.log("vm.list.defaultAddr[0]", vm.list.defaultAddr[0]);
										})
									});
								});
							}
				}
			});
		}
     }
	vm.editAddress = function(editAddr){
		vm.list.user.contact={};
		if(vm.list.defaultAddr.length>0){
			vm.list.defaultAddr[0].Zip = parseInt(vm.list.defaultAddr[0].Zip);
			$scope.isEditing = !$scope.isEditing;
			BuildOrderService.GetPhoneNumber(editAddr).then(function(res){
				vm.list.user.contact.Phone1 = res[0];
				vm.list.user.contact.Phone2 = res[1];
				vm.list.user.contact.Phone3 = res[2];
			});
		}
		else{
				BuildOrderService.GetPhoneNumber(editAddr).then(function(res){
				vm.list.user.contact.Phone1 = res[0];
				vm.list.user.contact.Phone2 = res[1];
				vm.list.user.contact.Phone3 = res[2];
			});
			$scope.isEditing = !$scope.isEditing;
		}
	}
	vm.getLocation=function(){
		vm.GetMultipleCities(vm.list.defaultAddr[0]);
	}
	$scope.ok=function(){
		OrderCloud.Users.Update(userid, vm.list.user).then(function(){
			alert("Password changed");
		})
		.catch(function(ex) {
                 $exceptionHandler(ex)
        });
	}
	$scope.viewChangePassword = function(){
		$scope.showModal = !$scope.showModal;
	}
	vm.updateSubscription= function(){
		var SubList = Underscore.filter(vm.subscribedList, function (subscription) {
			  return  subscription.Checked  == true;
		})
		var params = {
			"id": vm.list.user.xp.ConstantContact.ID,
			"lists": SubList,
			"email_addresses": [{ "email_address": vm.list.user.Email}]
		}
		ConstantContact.UpdateContact(params).then(function(res){
			console.log("subscribedListparams", res);
		});
	};
	vm.showPOModal = false;
	vm.UpdatePONumber = function(){
		console.log(UserList);
		vm.ValidPO = true;
		if(vm.NPoNo==vm.CPoNo){
			vm.PoNotMatches = true;
			UserList.user.xp.PO.PONumber = vm.NPoNo;
			OrderCloud.Users.Update(UserList.user.ID, UserList.user).then(function(res){
				vm.showPOModal = !vm.showPOModal;
				//vm.PoNo = null;
				vm.NPoNo = null;
				vm.CPoNo = null;
			});
		}else{
			vm.PoNotMatches = false;
		}
		/*if(vm.PoNo == UserList.user.xp.PO.PONumber){
			vm.PoNo=UserList.user.xp.PO.PONumber;
			vm.ValidPO = true;
			if(vm.NPoNo==vm.CPoNo){
				vm.PoNotMatches = true;
				UserList.user.xp.PO.PONumber = vm.NPoNo;
				OrderCloud.Users.Update(UserList.user.ID, UserList.user).then(function(res){
					vm.showPOModal = !vm.showPOModal;
					//vm.PoNo = null;
					vm.NPoNo = null;
					vm.CPoNo = null;
				});
			}else{
				vm.PoNotMatches = false;
			}
		} else{
			vm.ValidPO = false;
		}*/
	};
	vm.GetMultipleCities = function(line){
		if((line.Zip.toString()).length == 5){
			$http.get(GoogleAPI+line.Zip).then(function(res){
				if(res.data.results[0].postcode_localities){
					if(res.data.results[0].postcode_localities.length > 1){
						line.MultipleCities = res.data.results[0].postcode_localities;
						if(line.Zip == 55038)
							line.MultipleCities.push("Columbus");
						if(line.Zip == 55082){
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
								line.City = component.long_name;
							}
							if(type == 'administrative_area_level_1') {
								line.State = component.short_name;
							}
						});
					}); 
				}
			});
		}
	};
}