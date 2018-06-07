
'use strict';

angular.module('chatApp')
.factory('savePdfFactory', ['$http', '$q', '$location', function ($http, $q, $location) {
  var savePdfFactory = {};

  savePdfFactory.savePdf = function(messages){
    var convArray = [];
    var chatArray = [];
    var doc = new jsPDF({ orientation: 'portrait', unit: 'mm', lineHeight: 1.5 });

    if(messages[0].$$hashKey != undefined) {
      for(var i = 0; i < messages.length; i++){
        var user = 'User : '+ messages[i].input.text + '\n';
        convArray.push(user);
        for (var j = 0; j < messages[i].output.text.length; j++) {
          var bot = 'Bot : '+ messages[i].output.text[j]+'\n';
          convArray.push(bot);
        }
      }
    } else {
        for(var i = 0; i < messages.length; i++){
          var agentText = messages[i];
          for (var k = 0; k < agentText.length; k++) {
            if(agentText[k].source == 'system' || agentText[k].source == 'agent') {
              var agentMessage = 'Agent : '+ agentText[k].text + '\n';
              chatArray.push(agentMessage);
            }
          }
          for (var n = 0; n < agentText.length; n++) {
            if (agentText[n].source != 'system' && agentText[n].source != 'agent') {
              var user = 'User : '+ agentText[n].text + '\n';
              chatArray.push(user);
            }
          }
        }
    }

    var re = new RegExp(',Bot', 'g');
    var rek = new RegExp(',User', 'g');
    if(convArray.length != 0) {
      var splitTitle = doc.splitTextToSize(convArray.toString().replace(/<(?:.|\n)*?>/gm, '').replace(re,'Bot').replace(rek,'User'), 177);
    } else {
      var splitTitle = doc.splitTextToSize(chatArray.toString().replace(/<(?:.|\n)*?>/gm, '').replace(re,'Agent').replace(rek,'User'), 177);
    }
    var y = 20;
    var x = 20;

    if (splitTitle.length >= 32) {
      var i = 0;
      while (i < splitTitle.length) {
        var str = splitTitle.splice(i,i+32);
        doc.text(x, y, str);
        doc.addPage();
        i = i+32;
        y = 0;
      }
    } else {
      doc.text(x, y, splitTitle);
    }
    doc.output('save', 'Chat-Transcript.pdf');
  };
	return savePdfFactory;
	}
]);
