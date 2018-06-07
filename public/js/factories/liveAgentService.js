
'use strict';

angular.module('chatApp')
.factory('liveAgentFactory', ['$http', '$q', '$scope', '$location', function ($http, $q, $scope, $location) {

  var agent = {};
  agent.agentStatus = function() {

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

      $scope.initDemo = function() {
          if ($scope.lptag === "true") {
              $scope.initChat($scope.getEngagement);
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
            onInfo: function (data) {
                $scope.writeLog("onInfo", data);
            },
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

      $scope.getEngagement = function() {
        chat.getEngagement();
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
          //skill: "yl-general",
          skill: "Test",
          //engagementId: engagementData.engagementDetails.engagementId || engagementData.eid,
          //engagementId: "154027714",
          engagementId: "248827514",
          campaignId: engagementData.engagementDetails.campaignId || engagementData.cid,
          language: engagementData.engagementDetails.language || engagementData.lang
        };
        chat.requestChat(chatRequest);
      }

      //Create a chat line
      $scope.createLine = function() {}

      //Add a line to the chat view DOM
      $scope.addLineToDom = function() {}



      //-----Sets the local chat state----//
      $scope.updateChatState = function(data){
          chatState = data.state;
      }



      //------Initialize the page --------//
      $scope.init = function() {
        $scope.initDemo();
        $scope.startChat();
      }

  }
	return agent;
	}
]);
