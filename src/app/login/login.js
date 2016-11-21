angular.module( 'orderCloud' )

    .config( LoginConfig )
    .factory( 'LoginService', LoginService )
    .controller( 'LoginCtrl', LoginController )
    .controller('resetPasswordCtrl', resetPasswordController)

;

function LoginConfig( $stateProvider, $locationProvider ) {
    $stateProvider
        .state( 'login', {
            url: '/login/:token',
            templateUrl:'login/templates/login.tpl.html',
            controller:'LoginCtrl',
            controllerAs: 'login',
			data: {
				loadingMessage: 'Loading...'
			},
			resolve: {
				AlfrescoCommon: function ($sce, $q, AlfrescoFact, alfrescoAccessURL) {
					var df = $q.defer();
					AlfrescoFact.Get().then(function (data) {
                        console.log(data);
                        var ticket = data.data.ticket;
                        localStorage.setItem("alfrescoTicket", ticket);
						var homePath="OMS/Home?alf_ticket=";
						AlfrescoFact.GetHome(homePath).then(function (data) {
							AlfrescoFact.logo=$sce.trustAsResourceUrl(alfrescoAccessURL+"/"+data.items[0].contentUrl+"?alf_ticket="+ ticket);
							df.resolve(AlfrescoFact.logo);
						 console.log("logoooooooooooooo", AlfrescoFact.logo);
						 });
                    });
					 return df.promise;
                }
            }
        })
        .state('resetPassword', {
            parent: 'base',
            url: '/resetPassword',
            templateUrl: 'login/templates/resetPassword.tpl.html',
            controller: 'resetPasswordCtrl',
            controllerAs: 'reset'
        });
		$locationProvider.html5Mode(true);
}

function LoginService( $q, $window, toastr, $state,OrderCloud, clientid, buyerid, TokenRefresh ,$location) {
    return {
        SendVerificationCode: _sendVerificationCode,
        ResetPassword: _resetPassword,
        RememberMe: _rememberMe,
        Logout: _logout
    };

    function _sendVerificationCode(email) {
        var deferred = $q.defer();

        var passwordResetRequest = {
            Email: email,
            ClientID: clientid,
            URL: $window.location.origin + '/resetPassword',
            Username: email
        };

        OrderCloud.PasswordResets.SendVerificationCode(passwordResetRequest)
            .then(function() {
                deferred.resolve();
            })
            .catch(function(ex) {
                deferred.reject(ex);
            });

        return deferred.promise;
    }

    function _resetPassword(resetPasswordCredentials, verificationCode) {
        var deferred = $q.defer();

        var passwordReset = {
            ClientID: clientid,
            Username: resetPasswordCredentials.ResetUsername,
            Password: resetPasswordCredentials.NewPassword
        };

        OrderCloud.PasswordResets.ResetPassword(verificationCode, passwordReset).
            then(function() {
                deferred.resolve();
            })
            .catch(function(ex) {
                deferred.reject(ex);
            });

        return deferred.promise;
    }

    function _logout(){
        OrderCloud.Auth.RemoveToken();
        OrderCloud.Auth.RemoveImpersonationToken();
        OrderCloud.BuyerID.Set(null);
        TokenRefresh.RemoveToken();
        $state.go('login');
    }

    function _rememberMe() {
        TokenRefresh.GetToken()
            .then(function (refreshToken) {
                if (refreshToken) {
                    TokenRefresh.Refresh(refreshToken)
                        .then(function (token) {
                            OrderCloud.BuyerID.Set(buyerid);
                            OrderCloud.Auth.SetToken(token.access_token);
                            if($location.path().indexOf('resetPassword') < 0){
                                $state.go('home');
                            }
                        })
                        .catch(function () {
                            //toastr.error("Your token has expired, please log in again.")
                        });
                }else{
                    if ($location.path().indexOf('resetPassword') < 0) {
                        _logout();
                     }
                    
                }
            })
    }
}

function LoginController( $state, $stateParams, $exceptionHandler, OrderCloud, LoginService, buyerid, TokenRefresh, AlfrescoCommon, $cookieStore) {
    var vm = this;
	vm.logo=AlfrescoCommon;
    vm.credentials = {
        Username: null,
        Password: null
    };
    vm.token = $stateParams.token;
    vm.form = vm.token ? 'reset' : 'login';
    vm.setForm = function(form) {
        vm.form = form;
    };
    vm.rememberStatus = false;
    vm.submit = function() {
        vm.LoginSubmit = OrderCloud.Auth.GetToken(vm.credentials)
            .then(function(data) {
                vm.rememberStatus ? TokenRefresh.SetToken(data['refresh_token']) : 'angular-noop';
                vm.LoginSubmit = OrderCloud.BuyerID.Set(buyerid);
                vm.LoginSubmit = OrderCloud.Auth.SetToken(data['access_token']);
                console.log($cookieStore);
                $cookieStore.put('OMS.Admintoken',data['access_token']);
				console.log("===>Token"+data['access_token']);
                $state.go('home');
				vm.LoginSubmit = OrderCloud.AdminUsers.List(null, 1, 100, null, null, {"Username":vm.credentials.Username, "Password":vm.credentials.Password}).then(function(res){
					$cookieStore.put('OMS.CSRID', res.Items[0].ID);
				});
            })
            .catch(function(ex) {
                console.log(ex.data);
				vm.LoginForm.error = ex.data.error;
            })
    };

    vm.forgotPassword = function() {
        OrderCloud.AdminUsers.List(vm.credentials.Email, null, null, "Username", null, null).then(function(){
            LoginService.SendVerificationCode(vm.credentials.Email)
            .then(function() {
                vm.setForm('verificationCodeSuccess');
                vm.credentials.Email = null;
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
        });
    };

    vm.resetPassword = function() {
        LoginService.ResetPassword(vm.credentials, vm.token)
            .then(function() {
                vm.setForm('resetSuccess');
                vm.token = null;
                vm.credentials.ResetUsername = null;
                vm.credentials.NewPassword = null;
                vm.credentials.ConfirmPassword = null;
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
                vm.credentials.ResetUsername = null;
                vm.credentials.NewPassword = null;
                vm.credentials.ConfirmPassword = null;
            });
    };
}

function resetPasswordController( $state, $stateParams, $exceptionHandler, OrderCloud, LoginService, buyerid, TokenRefresh, AlfrescoCommon, $cookieStore) {
    var vm = this;
}
$(document).ready(function () {
  $("#tab1").click(function () {
    $(".login-header").text("Login to your account");
  });

  $("#tab2").click(function () {
    $(".login-header").text("Forgot your password?");
  });
});