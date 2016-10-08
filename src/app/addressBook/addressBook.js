angular.module( 'orderCloud' )

	.config( AddressBookConfig )
	.controller( 'AddressBookCtrl', AddressBookController )

function AddressBookConfig( $stateProvider ) {
	$stateProvider
		.state( 'addressBook', {
			parent: 'base',
			url: '/addressBook/:ID',
			templateUrl: 'addressBook/templates/addressBook.tpl.html',
			controller: 'AddressBookCtrl',
			controllerAs: 'addressBook',
			params: {
                ID:null                
            },
			resolve: {
                AddressBook: function(OrderCloud, $stateParams, $state, $q) {
                    var arr={};
					var dfr = $q.defer();
					OrderCloud.As().Me.ListAddresses(null, 1, 100).then(function(addrList){
						dfr.resolve(addrList);
						console.log("addrList", addrList);
					});
					return dfr.promise;
                }
			}
		})
}


function AddressBookController($scope, $http, $state, $stateParams, $location, $anchorScroll, AddressBook, OrderCloud, BuildOrderService, AddressValidationService, GoogleAPI) {
	var vm=this;
	vm.list=AddressBook.Items;
	vm.searchedAddr;
	var prevIndex;
	vm.defaultEdit=false;
	vm.defaultAddr=_.filter(vm.list, function(obj) {
		if(obj.xp)
		return _.indexOf([obj.xp.IsDefault], true) > -1
	});
	console.log("vm.defaultAddr", vm.defaultAddr);
	vm.getLocation=function(addr){
		vm.GetMultipleCities(addr);
	}
	vm.GetMultipleCities = function(addr){
		if((addr.Zip.toString()).length == 5){
			$http.get(GoogleAPI+addr.Zip).then(function(res){
				if(res.data.results[0].postcode_localities){
					if(res.data.results[0].postcode_localities.length > 1){
						addr.MultipleCities = res.data.results[0].postcode_localities;
						if(addr.Zip == 55038)
							addr.MultipleCities.push("Columbus");
						if(addr.Zip == 55082){
							addr.MultipleCities.push("Grant");
							addr.MultipleCities.push("West Lakeland");
						}
					}	
				}else{
					delete addr.MultipleCities;
					angular.forEach(res.data.results[0].address_components, function(component,index){
						var types = component.types;
						angular.forEach(types, function(type,index){
							if(type == 'locality') {
								addr.City = component.long_name;
							}
							if(type == 'administrative_area_level_1') {
								addr.State = component.short_name;
							}
						});
					}); 
				}
			});
		}
	};
	vm.getLoactionEdit=function(addr){
		vm.GetMultipleCities(addr);
	}
	$scope.CreateAddress = function(line, form){
		form.$submitted = true;
		vm.newaddrerror={};
		if(form.$valid && line.City != "Select City"){
			var $this = this;
			if(line.xp==null)
				line.xp = {};
				line.xp.IsDefault=false;
			line.Phone = "("+line.Phone1+") "+line.Phone2+"-"+line.Phone3;
			line.xp.NickName = line.NickName;
				AddressValidationService.Validate(line).then(function(res){
					var validatedAddress = res.ResponseBody.Address;
					var zip = validatedAddress.PostalCode.substring(0, 5);
					line.Zip = parseInt(zip);
					line.Street1 = validatedAddress.Line1;
					line.Street2 = null;
					line.City = validatedAddress.City;
					line.State = validatedAddress.Region;
					line.Country = validatedAddress.Country;
					if(res.ResponseBody.ResultCode == 'Success') {
						OrderCloud.As().Me.CreateAddress(line).then(function(addrList){
								$scope.addAddr=!$scope.addAddr;
								vm.newaddrerror={};
								vm.list.push(addrList);
						}).catch(function(ex){
							console.log(ex);
							vm.newaddrerror=ex;
						});
						}else{
							alert("enter valid address to save..");
						}
				});
		}
	}
	vm.makeDefault=function(address){
		_.filter(vm.list, function(row){
			if(!row.xp)
				row.xp = {};
			if(row.xp.IsDefault){
				var	data =false;
				row.xp.IsDefault = !row.xp.IsDefault; 
				vm.default(row,data);
			}
		});
		var	dataNew = true;
		address.xp.IsDefault = true;
		vm.default(address, dataNew);
	}
	vm.default= function(row, obj){
		OrderCloud.As().Me.PatchAddress(row.ID, {"xp":{"IsDefault" :obj}}).then(function(res){
			if(row.xp.IsDefault){
				vm.defaultAddr[0]=row;
			}
		});
	}
	vm.editAddress = function(editAddr, index){
		vm.defaultEdit=true;
		if(index != null){
			vm.defaultEdit=false;
		}
		vm['showedit' + vm.prevIndex] = false;
		vm.prevIndex=angular.copy(index);
		vm['showedit' + index] = true;
		vm.editAddr=angular.copy(editAddr);
		$scope.showedit=false;
		vm.stateData=vm.editAddr.State;
		vm.contact={};
		var phn = vm.editAddr.Phone;
		BuildOrderService.GetPhoneNumber(vm.editAddr.Phone).then(function(res){
			vm.contact.Phone1 = res[0];
			vm.contact.Phone2 = res[1];
			vm.contact.Phone3 = res[2];
		});
	}
	vm.closeShowedit=function(index){
		vm['showedit'+index]=false;
	}
	vm.saveAddress = function(saveAddr, contact, form){
		form.$submitted = true;
		if(searchedAddress.$valid && saveAddr.City != "Select City"){
			saveAddr.Phone = "("+contact.Phone1+") "+contact.Phone2+"-"+contact.Phone3;
			console.log("saveAddr.Phone", saveAddr.Phone);
			AddressValidationService.Validate(saveAddr).then(function(res){
				var validatedAddress = res.Address;
				var zip = validatedAddress.PostalCode.substring(0, 5);
				saveAddr.Zip = parseInt(zip);
				saveAddr.Street1 = validatedAddress.Line1;
				saveAddr.Street2 = null;
				saveAddr.City = validatedAddress.City;
				saveAddr.State = validatedAddress.Region;
				saveAddr.Country = validatedAddress.Country;
				if(res.ResultCode == "Success"){
					OrderCloud.As().Me.UpdateAddress(saveAddr.ID, saveAddr).then(function(addrList){
						$state.go('addressBook', {}, {reload:true});
					});
				}
				else{
					alert("address not found");
				}
			});
		}
	}
	vm.deleteAddr =function(addrID){
		OrderCloud.Addresses.Delete(addrID).then(function(){
		   $state.go('addressBook', {}, {reload:true});
		});
	}
	$scope.deleteAddress = {
        templateUrl: 'deleteAddress.html',
    }
    $scope.closePopover = function () {
        $scope.showDeliveryToolTip = false;
    };
    $scope.cancelPopUp = function () {
        this.$parent.showDeliveryToolTip = false;
    };
};
