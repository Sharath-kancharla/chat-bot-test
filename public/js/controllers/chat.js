'use strict';

angular.module('chatApp')

.controller('ChatCtrl', ['$scope', '$rootScope', '$http', '$interval', '$location', '$sce', '$window', 'checkAuthorization', 'conversationSaver', 'savePdfFactory', 'printPdfFactory','$timeout', function($scope, $rootScope, $http, $interval, $location, $sce, $window, checkAuthorization, conversationSaver, savePdfFactory, printPdfFactory, $timeout) {

  $(document).ready(function(){
      var height = $(window).height();        //Get the height of the browser window
      if (height == 580) {
        $('#chat-message-content').height(height - 115)[0].scrollHeight;  //Resize the chatContent div.
      } else {
        $('#chat-message-content').height(height - 105)[0].scrollHeight;  //Resize the chatContent div.
      }
  });

  $scope.scrollToBtm = function() {
    var container = $('#chat-message-content');
    var height = container[0].scrollHeight;
    container.scrollTop(height);
  }

  $scope.closePrintOptions = function() {
    $scope.flagPrint = false;
  }

  $scope.closeTransferQuestion = function() {
    $scope.transferToAgent = false;
  }

  $scope.showChat = function() {
    $scope.chatRoom = true;
    $scope.showBtn = false;
  }

  $scope.sendMessageToWatson = function(data) {
    $http.post('/api/message', data).then(function(res) {
      $rootScope.conversationContext = res.data.context;
      $scope.messages.push(res.data)
      conversationSaver.chatLog = $scope.messages;
      $scope.input.text = '';
      $timeout(function(){
        $scope.scrollToBtm();
      }, 1);
    })
  }

  $scope.helpTxtWcs = function(message) {
    userInputArray.push(message);
    var data = {
      input:  {
        text: message
      },
      alternate_intents: true,
      context: $rootScope.conversationContext
    }
    $scope.sendMessageToWatson(data);
  }

  $scope.context = {};
  $scope.context.conversation_id = {};
  var userInputArray = [];

  $scope.sendMessage = function(event, message) {
    if(event.keyCode == 13 && message) {
      userInputArray.push(message);
      var data = {
        input:  {
          text: message
        },
        alternate_intents: true,
        context: $rootScope.conversationContext
      }
      $scope.sendMessageToWatson(data);

      var evaluateSessionId;
      if ($rootScope.conversationContext == undefined) {
        evaluateSessionId = "";
      } else {
        evaluateSessionId = $rootScope.conversationContext.conversation_id;
      }

      // var evaluateInput = {
      //   sessionId: evaluateSessionId,
      //   conversation: userInputArray
      // }
      //
      // var serviceURI = "https://yl-human-transfer.w3bmix.ibm.com/HumanTransfer/Evaluate";
      // $http({
      //   method: 'POST',
      //   url: serviceURI,
      //   headers:  {
      //     'Access-Control-Allow-Origin': '*'
      //   },
      //   data: evaluateInput
      // }).then(function(data){
      //   if (data.data.toTransfer) {
      //     $scope.transferToAgent = true;
      //     if ($scope.transferToAgent) {
      //       $timeout(function(){
      //         $scope.scrollToBtm();
      //       }, 1);
      //     }
      //   }
      // }, function(failedReason){
      //   console.log("failedReason---", failedReason.data);
      // });
    }
  }

  $scope.quickQuestion = function(number) {
    if (number == 1) {
      var message = "Where are my completed courses?";
      var data = {
        input:  {
          text: message
        },
        alternate_intents: true,
        context: $rootScope.conversationContext
      }
      $scope.sendMessageToWatson(data);
    } else if (number == 2) {
      var message = "Why haven't I received my badge yet?";
      var data = {
        input:  {
          text: message
        },
        alternate_intents: true,
        context: $rootScope.conversationContext
      }
      $scope.sendMessageToWatson(data);
    } else {
      var message = "Show me courses about Blockchain";
      var data = {
        input:  {
          text: message
        },
        alternate_intents: true,
        context: $rootScope.conversationContext
      }
      $scope.sendMessageToWatson(data);
    }
  }

  $scope.liveChat = function() {
    var data = {
      input:  {
        text: 'Transferred to agent'
      },
      alternate_intents: true,
      context: $rootScope.conversationContext
    }
    $scope.sendMessageToWatson(data);
    $location.path('liveChat/43953940/true');

  }

  $scope.TrustDangerousSnippet = function(snippet) {
    return $sce.trustAsHtml(snippet);
  };

  $scope.removeChat = function() {
    $scope.chatRoom = false;
    $scope.showBtn = true;
  }

  $scope.minimize = function() {
    $("#chat-advisor-iframe").width;
    $scope.expand = !$scope.expand;
  }

  $scope.resize = function() {
    $scope.resizeFlag = !$scope.resizeFlag;
    var height = $window.innerHeight - 250;
    if($scope.resizeFlag)
      document.getElementById('chat-message-content').style.height = height+'px';
    else
      document.getElementById('chat-message-content').style.height = 400+'px';

    $timeout(function(){
      $scope.scrollToBtm();
    }, 1);
  }

  $scope.printTranscript = function() {
    $scope.flagPrint = !$scope.flagPrint
  }

  // ------save the transcript to the machine ------------//
   $scope.saveTranscript = function() {
    savePdfFactory.savePdf($scope.messages);
  }

  // print out the transcript on paper -------------------//
  $scope.printOutTranscript = function() {
    printPdfFactory.printPdf($scope.messages);
  }

  this.ButtonChoice = $window.ButtonChoice;
  this.helpTxtWcs2 = $window.helpTxtWcs2;
  //console.log("$window.helpTxtWcs2:::::", $window.helpTxtWcs2, $window.ButtonChoice);

  // this.helpTxtWcs2 = function(text) {
  //   console.log("helpppppppppppp", text);
  //   return true;
  //   $scope.helpTxtWcs();
  // }

  $window.ButtonChoice = function(id) {
    var message = {
      input:  {
        text: id
      },
      context: $rootScope.conversationContext
    }
    $scope.sendMessageToWatson(message);
  }

  //-------------Check authorization ---------------//
  $scope.authDetails  = function() {
    checkAuthorization.checkAuth();
  }


  $scope.init = function() {
    $scope.authDetails();
    $scope.messages = [];
    $scope.chatMessages = true;
    $scope.minusHide = true;
    $scope.expand = true;
    $scope.chatRoom = true;
    $scope.showBtn = true;
    $scope.resizeFlag = false;
    $scope.flagPrint = false;
    $scope.input = {
      text: ''
    };
  }

  $scope.init()

}])
