'use strict';

angular.module('chatApp')

.controller('LiveChatCtrl', ['$scope', '$rootScope', '$window', '$http', '$routeParams', '$location', '$sce','$timeout','$interval', 'checkAuthorization' ,'conversationSaver','savePdfFactory','printPdfFactory', function($scope, $rootScope, $window, $http, $routeParams, $location, $sce, $timeout,$interval, checkAuthorization, conversationSaver, savePdfFactory, printPdfFactory) {

  $(document).ready(function(){
      var height = $(window).height();        //Get the height of the browser window
      if (height == 580) {
        $('#chat-message-content').height(height - 120)[0].scrollHeight;  //Resize the chatContent div.
      } else {
        $('#chat-message-content').height(height - 105)[0].scrollHeight;  //Resize the chatContent div.
      }
  });

  var appKey = "721c180b09eb463d9f3191c41762bb68",
      logsStarted = false,
      engagementData = {},
      getEngagementMaxRetries = 10,
      chatWindow,
      chatContainer,
      chat,
      chatState,
      chatArea,
      logsLastChild;

    $scope.myRating;
    $scope.chatHistory = [];
    $scope.textLog = [];
    $scope.visitorMessage = "";
    $rootScope.lptag=  $routeParams.lptag;
    //$scope.site = $routeParams.site;
    $scope.site = 43953940;
    $scope.feedbackComment;
    $scope.agentParam = 43953940;
    $scope.site = $scope.agentParam;

    $scope.authDetails  = function() {
      checkAuthorization.checkAuth();
    }

    $scope.closePrintOptions = function() {
      $scope.flagPrint = false;
    }

    $scope.TrustDangerousSnippet = function(snippet) {
      return $sce.trustAsHtml(snippet);
    };

    $scope.minimize = function() {
    $scope.expand = !$scope.expand;
    }

    $scope.removeChat = function() {
    $scope.chatRoom = true;
    $scope.endSession = true;
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

    $scope.getURLParams = function(search) {
      var queryParams = {}, queryArray, singleQuery;
      queryArray = search.substr(1).split("&");
      for (var i = 0; i < queryArray.length; i++) {
        if (queryArray[i].indexOf("=") > -0) {
          singleQuery = queryArray[i].split("=");
          if (singleQuery.length == 2) {
            queryParams[decodeURIComponent(singleQuery[0])] = decodeURIComponent(singleQuery[1]);
          }
        }
      }
      return queryParams;
    }
    var site = $scope.getURLParams($window.location.search).site;
    var lptag = $rootScope.lptag;
    var tagd = $scope.getURLParams($window.location.search).tagd;

    if (tagd) {
        window.lpTag = window.lpTag || {};
        lpTag.ovr = lpTag.ovr || {};
        lpTag.ovr.domain = tagd;
    }
    lpTag.sdes = lpTag.sdes || [];
  	setTimeout(function(){
                 lpTag.sdes.push(
         {

          "type": "personal",  //MANDATORY
              "personal": {
                  "firstname": $rootScope.visitorName,  // FIRST NAME
                  "lastname": $rootScope.visitorName,  // SURNAME
                  "contacts": [{
                      "email": $rootScope.visitorEmail,  // EMAIL
                  }]
              }
          }
      );
      },0);

    $scope.initDemo = function() {
       $scope.chatHistory = [];
        if ($rootScope.lptag === "true") {
            $scope.initChat($scope.getEngagement);
            //createExternalJsMethodName();
        }
        else {
            $scope.initChat($scope.getEngagement);
        }
    }

    $scope.createExternalJsMethodName =function () {
        window.externalJsMethodName = function(data) {
            engagementData = data;
            $scope.initChat($scope.createWindow);
        }
    }

    $scope.createWindow = function () {
        chatWindow = $.window({
            onShow: function(){
                startChat();
            }
        });
        chatContainer = chatWindow.getContainer();
    }

    $scope.initChat = function(onInit) {
      var chatConfig = {
          lpNumber: $scope.site,
          appKey: appKey,
          onInit: [onInit, function (data) {
              $scope.writeLog("onInit", data);
          }],
          onInfo: [ $scope.setVisitorName, function (data) {
              //console.log("data::", data);
              $scope.writeLog("onInfo", data);
          }],
          onLine: [$scope.addLines, function (data) {
              $scope.writeLog("onLine", data);
          }],
          onState: [ $scope.updateChatState, function(data) {
              $scope.writeLog("onState", data);
          }],
          onStart: [$scope.updateChatState, $scope.bindEvents, $scope.bindInputForChat, function (data) {
              // $scope.writeLog("onStart", data);
              // $scope.writeLog("Chat connected here we should send the bot conversation to the Rep.");
              $scope.sendBotTranscriptLine();

          }],
          onStop: [$scope.updateChatState, $scope.unBindInputForChat],
          onAddLine: function (data) {
              $scope.writeLog("onAddLine", data);
          },

          onAgentTyping: [$scope.agentTyping, function (data) {
              $scope.writeLog("onAgentTyping", data);
          }],
          onRequestChat: function (data) {
            //console.log("status data:::::::", data);
              $scope.availabilityStatus = data.error.internalCode;
              $scope.agentAvailability = data.error.reason;
              if(data.error) {
                var err = data.error
                if(err.reason == "no-available-agents"){
                  document.getElementById("inputTextBox").disabled = true;
                  document.getElementById("endChat").disabled = true;
                }
              }
              $scope.writeLog("onRequestChat", data);
          },
          onEngagement: function (data) {
              // document.getElementById("inputTextBox").disabled = false;
              // document.getElementById("endChat").disabled = false;

              if ("Available" === data.status) {
                  createEngagement(data);
                  $scope.writeLog("onEngagement", data);
              }
              else if ("NotAvailable" === data.status) {
                  $scope.writeLog("Agent is not available", data);
              }
              else {
                  if (getEngagementMaxRetries > 0) {
                      $scope.writeLog("Failed to get engagement. Retry number " + getEngagementMaxRetries, data);
                      $scope.getEngagement();
                      getEngagementMaxRetries--;
                  }
              }
          },
          onHandleExitSurvey: function (data) {
              $scope.writeLog("Exit survey", data);
          }
        };
        chat = new lpTag.taglets.ChatOverRestAPI(chatConfig);
    }

    $scope.getVisitorDetails = function() {
      var serviceURI = "https://w3-dev.api.ibm.com/learning/test/v1/person/profile";
      $http({
        method: 'GET',
        url: serviceURI,
        headers:  {
          'Access-Control-Allow-Origin': '*',
          "X-IBM-Client-Id": '71dfb756-a868-4ed2-aa3a-12bf86352b74',
          "X-IBM-Client-Secret": "yB8lB6jB8hH4mY3pO6pN2uL7tR1tJ3vV3cT0nP0jQ7hH1aX1kF"
        }
      }).then(function(data){
          console.log("person data::", data);
      }, function(failedReason){
        console.log("failedReason---", failedReason.data);
      });
    }

    if ($rootScope.visitorName != undefined && $rootScope.visitorName != '') {
      var visitorFirstName = $rootScope.visitorName.split(' ')[0];
      var visitorLastName = $rootScope.visitorName.split(' ')[1];
      var visitorEmail = $rootScope.visitorEmail;
      var visitorCompany = $rootScope.visitorId;
    }

    // "appType": "EXTERNAL",
    // "vid": "123",
    // "sid": "456",
    // "appDetails": {
    //     "os": "MAC_OSX",
    //     "osVersion": "1.2",
    //     "appVersion": "1.0",
    //     "deviceFamily": "MOBILE",
    //     "ipAddress": "192.168.5.2"
    // },
    // "consumerSections": [
    //     "Support",
    //     "English",
    //     "Other"
    // ],
    // "engagementAttributes": [
    //     {
    //         "type": "personal",
    //         "personal": {
    //             "contacts": [{"email": visitorEmail, "phone": phone}],
    //             "firstname": visitorFirstName,
    //             "lastname": visitorLastName,
    //             "gender": "FEMALE",
    //             "company": visitorCompany
    //         }
    //     }
    // ]

    $scope.getEngagement = function() {
      chat.getEngagement({
        "appType": "EXTERNAL",
         "consumerSections": [
             "Support",
             "English",
             "Other"
         ],
         "engagementAttributes": [
             {
                 "type": "personal",
                 "personal": {
                     "contacts": [{"email": visitorEmail, "phone": "12345678"}],
                     "firstname": visitorFirstName,
                     "lastname": visitorLastName,
                     "company": visitorCompany
                 }
             }
         ]
      });
    }

    var skillRequest = {
        skill: "Test", //The skill we want
    };

    $scope.waitTime = -1;
    $scope.getEstimatedAgentTime = function() {
      var stat = chat.getEstimatedWaitTime({
        skillRequest: skillRequest,
        success: function(success){
          console.log("success==========", success.estimatedWaitTime);
          if(success.estimatedWaitTime == -1) {
             $scope.waitTime = success.estimatedWaitTime;
          } else {
            $scope.waitTime =  success.estimatedWaitTime;
          }
        },
        error: function(error) {
          console.log("error:::::::", error);
        }
      });
    }

    $scope.createEngagement = function(data) {
      var $engagement;
      $engagement.click(function(){
        engagementData = data;
        createWindow();
      });
    }

    //------------Start the engagement -----------------//
    $scope.startChat = function() {
      engagementData = engagementData || {};
      engagementData.engagementDetails = engagementData.engagementDetails || {};
      var chatRequest = {
        LETagVisitorId: engagementData.visitorId || engagementData.svid,
        LETagSessionId: engagementData.sessionId || engagementData.ssid,
        LETagContextId: engagementData.engagementDetails.contextId || engagementData.scid,
       // skill: engagementData.engagementDetails.skillId,
        skill: "yl-general",
        //skill: "Test",
        //engagementId: engagementData.engagementDetails.engagementId || engagementData.eid,
        engagementId: "154027714",
        //engagementId: "248827514",
        campaignId: engagementData.engagementDetails.campaignId || engagementData.cid,
        language: engagementData.engagementDetails.language || engagementData.lang
      };
      chat.requestChat(chatRequest);
    }

    //---------scroll to the bottom of the div-------------//
    $scope.scrollToBtm = function() {
      var container = $('#chat-message-content');
      var height = container[0].scrollHeight;
      container.scrollTop(height);
    }

    // ----------get agent text -----------------------//
    $scope.addLines = function(data) {
      if(data){
        $scope.connectionStatus = data.lines[0].systemMessageId;
        //console.log("agent data::",data ,'---->',$scope.connectionStatus);
        if(data.lines[0].source != "visitor"){
          if (data.lines[0].systemMessageId == 3) {
            document.getElementById("inputTextBox").disabled = false;
            document.getElementById("endChat").disabled = false;
          }
          $scope.chatHistory.push(data.lines);
          $timeout(function(){
            $scope.scrollToBtm();
          }, 1000);
        }
      }
      if (data.lines[0].text === 'Thank you for chatting with us.') {
       $scope.agentEndsChat =  true;
        $scope.endChat();
      }
    }

    //----------------Sends chat input -------------------//
    $scope.sendLine = function(event, visitorMessage) {
      if(event.keyCode == 13 && visitorMessage) {
        var text = visitorMessage;
        if (text && chat) {
          var line = $scope.createLine({
            by: chat.getVisitorName(),
            text: text,
            source: 'visitor'
          });
          $scope.chatHistory.push([{
            text: text,
            source: 'visitor'
          }]);
          chat.addLine({
            text: text,
            error: function () {
              line.className = "error";
            }
          });
          $timeout(function(){
            $scope.scrollToBtm();
          }, 1);
          $scope.addLineToDom(line); //response
          document.getElementById('inputTextBox').value = "";
        }
      }
    }

    //--------Add lines to the chat from events------//
    $interval(function(){
      var unregister = $scope.$watch('chatHistory', function (newVal, oldVal) {
        unregister();
      });
    },1000)

    // ------save the transcript to the machine ------------//
    $scope.saveTranscriptAgent = function() {
      savePdfFactory.savePdf($scope.chatHistory);
    }

    // print out the transcript on paper -------------------//
    $scope.printOutTranscriptAgent = function() {
      printPdfFactory.printPdf($scope.chatHistory);
    }

    //Create a chat line
    $scope.createLine = function() {}

    //Add a line to the chat view DOM
    $scope.addLineToDom = function() {}

    // Send the bot conversation to the agent when connected ------//
    $scope.sendBotTranscriptLine = function() {
      if (conversationSaver.chatLog.length != undefined) {
        var textLog = [];
        var messages = conversationSaver.chatLog;
        var parentUrl = (window.location != window.parent.location)
            ? document.referrer
            : document.location.href;
        var visitedUrl = 'URL : '+ parentUrl + '\n';
        textLog.push(visitedUrl);

        if (messages != undefined) {
          for(var i = 0; i < messages.length; i++){
            var user = $rootScope.visitorName+ ' : '+ messages[i].input.text + '\n';
            textLog.push(user);
            for (var j = 0; j < messages[i].output.text.length; j++) {
              var bot = 'Bot : '+ messages[i].output.text[j]+'\n';
              textLog.push(bot);
            }
          }
        }

        var re = new RegExp(',Bot', 'g');
        var rek = new RegExp(',$rootScope.visitorName', 'g');
        var text = textLog.toString().replace(re,'Bot').replace(rek,'$rootScope.visitorName').replace(/(<([^>]+)>)/g, "");

      }
      if (text && chat) {
        var line = $scope.createLine({
          by: chat.getVisitorName(),
          text: text,
          source: 'visitor'
        });
        chat.addLine({
          text: text,
          error: function () {
            line.className = "error";
          }
        });
        $scope.scrollToBtm();
      }
    }

    //--------Listener for enter events in the text area
    $scope.keyChanges = function(e) {
      e = e || window.event;
      var key = e.keyCode || e.which;
      if (key == 13) {
        if (e.type == "keyup") {
          $scope.sendLine();
          $scope.setVisitorTyping(false);
        }
        return false;
      } else {
        $scope.setVisitorTyping(true);
      }
    }

    //-------Set the visitor typing state--------//
    // $scope.setVisitorTyping = function(typing) {
    //   if (chat) {
    //     chat.setVisitorTyping({typing: typing});
    //     // not reflecting on the live engage side
    //
    //   }
    // }

    $scope.setVisitorTyping = function(typing) {
      console.log("typing::::::::");
      var failedRequest = chat.setVisitorTyping({
        success: function(success){
          typing: true,
          success = chat.typingUpdated
        },
        error: function(error) {
          error: chat.typingUpdateFailed
        },
        context: chat
      });
    }


    //----Set the visitor name------------//
    $scope.setVisitorName = function() {
      var name = $rootScope.visitorName + ' - ' + $rootScope.visitorEmail;
      if (chat && name) {
        chat.setVisitorName({visitorName: name});
      }
    }
    //----Set the visitor Email------------//
    $scope.setVisitorMail = function() {
      var mail = $rootScope.visitorEmail;
      if (chat && mail) {
        chat.setVisitorMail({visitorName: mail});
      }
    }

    $scope.chatUrl = function(url) {
      var pageUrl = top.window.href;
      if (chat) {
        chat.chatReferrer({url: pageUrl});
        // not reflecting on the live engage side

      }
    }

    //-------Exit survey questions --------//
    $scope.exitSurveyMethod = function() {
      $scope.chatContent = false;
      $scope.endSession = false;
      $scope.survey = true;
      $scope.surveyRating  = true;
      //document.getElementById("watsonChatBtn").disabled = true;
      document.getElementById("endChat").disabled = true;
      document.getElementById("chat-advisor-input-div").style.display = "none"; // hide input field upon clicking 'End Chat' button
      var failedRequest = chat.getExitSurvey({
        success: function(data){
          $scope.exitSurvey = data;
        },
        error: function(error) {
          //console.log("exit survey error", error);
        },
        context: chat
      });
      if (failedRequest && failedRequest.error) {
        alert(failedRequest.error);
      }
    }

    //--------Ends the chat------------------//
    $scope.endChatWithoutSurvey = function() {
      $scope.endSession = true;
      $scope.agentIsTyping = false;
      document.getElementById("chat-advisor-input-div").style.display = "none"; // hide input field upon clicking 'End Chat' button
      if (chat) {
        chat.endChat({
          disposeVisitor: true,
          success: function () {
            // chatWindow.close();
          }
        });
      }
      $scope.flagPrint = false; // hide print/save div (if displayed) upon clicking 'End Chat' button
    }

    //--------Ends the chat with a survey------------------//
    $scope.endChat = function() {
      $scope.endChatWithoutSurvey();
      $scope.exitSurveyMethod();
    }

    //---------------------Submit the rating-------------------------//
    $scope.submitSurvey = {};
    $scope.submitSurvey.survey = {};
    $scope.submitSurvey.survey.id = {};
    $scope.submitSurvey.survey.question = [];
    $scope.userRating = {};
    $scope.highNpsRating = {};
    $scope.lowNpsRating = {};
    $scope.npsFeedbackQuestion;

    $scope.selectRating = function(rating, logicId) {
      $scope.myRating = rating;
      var npsQuestions = $scope.exitSurvey.survey.questions.question;
      angular.forEach(npsQuestions, function (val) {
        if (val.logicId == logicId) {
          $scope.npsFeedbackQuestion = val;
        }
      })
    }

    $scope.npsRating = function(rating) {
      if(rating != undefined && rating != null) {
        $scope.submitSurvey.survey.id = $scope.exitSurvey.survey.id;
        $scope.userRating.id = $scope.exitSurvey.survey.questions.question[0].id;
        $scope.userRating.answer = rating;
        $scope.submitSurvey.survey.question.push($scope.userRating);
        $scope.highNpsRating.id = $scope.npsFeedbackQuestion.id;
        if($scope.feedbackComment != undefined && $scope.feedbackComment != null) {
           $scope.highNpsRating.answer = $scope.feedbackComment;
        }
        $scope.submitSurvey.survey.question.push($scope.highNpsRating);
        var objDiv = document.getElementById("surveyRating");
        $('#surveyRating').scrollTop($('#surveyRating')[0].scrollHeight);
      }
    }

    $scope.surveyFeedback = function(rating) {
      $scope.npsRating($scope.myRating);
      //var sendExitSurveyResult = delete $scope.submitSurvey.chatReferrer;
      var failedRequest = chat.submitExitSurvey({
        survey: $scope.submitSurvey,
        success: function(success){
          $scope.surveySucess = "Thank you for taking the survey";
          $location.path('/chat');
        },
        error: function(error) {
        //  console.log("error::", error);
          $location.path('/chat');
        },
        context: chat
      });
    }

    //-------Sends an email of the transcript when the chat has ended -------//
    $scope.sendEmail = function() {}  //needs to implement this

    //-----Sets the local chat state----//
    $scope.updateChatState = function(data){
        chatState = data.state;
    }

    //----- Shows the user that agent is typing-----//
    $scope.agentTyping = function(data) {
      if (data.agentTyping) {
        $scope.agentIsTyping = true;
      } else {
          $scope.agentIsTyping = false;
      }
    }

    $scope.bindInputForChat = function() {}
    $scope.unBindInputForChat = function() {}
    $scope.bindEvents = function() {}

    var messages = [];
    $scope.logText = function() {
      $rootScope.convLog = [];
      var messages = conversationSaver.chatLog;
      if (messages != undefined) {
        for(var i = 0; i < messages.length; i++){
          var user = $rootScope.visitorName + messages[i].input.text + '\n';
          $rootScope.convLog.push(user);
          for (var j = 0; j < messages[i].output.text.length; j++) {
            var bot = 'Bot : '+ messages[i].output.text[j]+'\n';
            $rootScope.convLog.push(bot);
          }
        }
      }
    }

    $scope.backBtn = function () {
       $scope.$on('$routeChangeStart', function($event, next, current) {
         $('#myModal').modal('hide');
       });
        if($scope.exitSurvey != null || $scope.exitSurvey != undefined){
            $location.path('/chat');
        }
        if ($scope.availabilityStatus == 32) {
            $location.path('/chat');
        } else if($scope.connectionStatus == 3 || $scope.connectionStatus == undefined) {
            $('#myModal').modal('show');
            $scope.transferToWatson = function() {
              $scope.endChat();
            }
        } else if($scope.connectionStatus == 4 || $scope.connectionStatus == 14) {
            $('#myModal').modal('show');
            $scope.transferToWatson = function() {
                $scope.endChatWithoutSurvey();
                $location.path('/chat');
            }
        }
     }

    //------Initialize the page --------//
    $scope.init = function() {
      $scope.authDetails();
      $scope.logText();
      $scope.chatAdvisorInput = true;
      $scope.agentEndsChat =  false;
      $scope.chatHistory = [];
      $scope.textLog = [];
      $scope.expand = true;
      $scope.endSession = false;
      $scope.chatContent = true;
      $scope.flagPrint = false;
      $scope.survey = false;
      $scope.highNps = false;
      $scope.lowNps = false;
      $scope.agentIsTyping = false;
      $scope.initDemo();
      $scope.startChat();
      //$scope.getVisitorDetails();
    }

    $scope.$on('$routeChangeSuccess', function () {
      $scope.init();
    });
}]);
