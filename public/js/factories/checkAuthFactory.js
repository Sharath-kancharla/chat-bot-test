
'use strict';

angular.module('chatApp')
.factory('checkAuthorization', ['$http', '$q', '$location', '$rootScope', function ($http, $q, $location, $rootScope) {

  var checkAuthorization = {};
  checkAuthorization.checkAuth = function() {
    var host = window.location.hostname;
    var login = "https://yourlearning.w3bmix.ibm.com/setToken.jsp?redirect=";
    var eapim_client_id = "9a220ec8-985d-4e13-b64b-65fa869bf395";//"71dfb756-a868-4ed2-aa3a-12bf86352b74";
    var eapim_client_secret = "A1lT2pY8dR0eR1kT3dS8xF0cY7gF2vX3tW5vN5cD8bK8uH6mQ5";//"yB8lB6jB8hH4mY3pO6pN2uL7tR1tJ3vV3cT0nP0jQ7hH1aX1kF";
    var check_url = 'https://w3.api.ibm.com/learning/run/v1/jwt/validatetoken';//"https://w3-dev.api.ibm.com/learning/test/v1/jwt/validatetoken";
    var eapim = "https://w3.api.ibm.com/learning/run"; //"https://w3-dev.api.ibm.com/learning/test";
    var type = "IBM Prod";
    var getConfig = "https://w3.api.ibm.com/learning/run/v1/config/";//"https://w3-dev.api.ibm.com/learning/test/v1/config/";
    var mapping = {};
    var cookieUrl = "https://w3.api.ibm.com/learning/run/v1/jwt/settokencookie";

    var SLOW_RESPONSE = 5000;
    var SERVICE_TIMEOUT = 10000;

    var method = "GET";
    var url = check_url;
    var xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function() {
      if (xhttp.readyState == 4) {
      try {
        var visitorData = JSON.parse(xhttp.responseText);
        //console.info("authenticated factoryyyyyyyyyyyy::::::",visitorData);
        $rootScope.visitorName = visitorData.name;
        $rootScope.visitorId = visitorData.tenantId;
        $rootScope.visitorEmail = visitorData.mail;
      }
      catch(err) {
        $location.path('/error');
        console.log(err);
        var visitorData = {};
        visitorData["message"] = xhttp.responseText;
      }
       if (xhttp.status === 401) {
            var str = login + window.location.href + "%3Ftype=" +  'dev';
            window.location.href = str;

       } else if (xhttp.status === 200) {
            // set cookie to current domain
            var expDate = new Date(visitorData.expirationDate);
            var cookie = "LearningToken=" + visitorData.token + "; expires=" + expDate.toUTCString();
            document.cookie = cookie;
            console.debug(cookie);
            var str = '';
       } else {
            $location.path('/error');
            //console.log("Not authenticated::::::");
            if (json && json.message) {
              document.getElementById("authStatus").innerHTML = "Not authenticated / error: " + json.message;
            } else {
              document.getElementById("authStatus").innerHTML = "Not authenticated / error";
            }
          }
        }
     };
    xhttp.open(method, url, true);
    xhttp.setRequestHeader("X-IBM-Client-Id", eapim_client_id);
    xhttp.setRequestHeader("X-IBM-Client-Secret", eapim_client_secret);
    xhttp.withCredentials = true;
    xhttp.timeout = SERVICE_TIMEOUT; // Set timeout
    xhttp.ontimeout = function () {
      console.debug('timeout');
    };
    xhttp.send();
  }
	return checkAuthorization;
	}
]);
