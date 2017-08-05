function TMain() {
	
	var main = this;
	main.logFile = [];
	
	main.players = [];
	main.playerTemplate = {
		"name"		 : "",
		"answers"	 : [],
	};
	main.answerTemplate = {
		"date"		: "",
		"question"	: "",
		"answer"	: "",
		"other"		: "",
		"comment"	: "",
	};

	main.currentPlayerIndex = 0;

	var textFile = new TLangEng();
	main.texts = textFile.texts;
	main.questions = textFile.questions;
	main.discardedQuestions = [];
	main.answeredQuestions = [];
	main.currentQuestion = [];
	
	main.init = function () {
		main.enableLoading();
		main.displayMessage(main.texts["Greetings"]);
		main.displayMessage(main.texts["InstructionsQuestion"]);
		main.addChoice("instructionChoice", ["Yes", "No"], "#log-holder");
	};

	main.enableLoading = function() {
		var loadButton = $('<input type="button" class="button info" id="loadButton" value="' + main.texts["LoadFromFile"] + '">')
		loadButton.click(function(e) {
			$('input[type=file]').trigger('click');
		});
		$('#info-holder').append(loadButton);
		var inputFile = $('<input type="file" id="loadFile" style="position: fixed; top: -100em">')
		inputFile.change(function(e) {
			if (!window.FileReader) {
				alert('Your browser is not supported')
			}
			var input = $('#loadFile').get(0);
			var reader = new FileReader();
			var textFile = input.files[0];
			reader.readAsText(textFile);
			$(reader).on('load', function(e){
				var file = e.target.result,
					results;
				if (file && file.length) {
					main.logFile = file.split("\n");
					main.loadFromLog();
					main.refreshInfo();
				};
			});
		});
		$('#info-holder').append(inputFile)
	}
	
	main.loadFromLog = function() {
		$("#log-holder").html("");
		$("#actions-holder").html("");
		main.answeredQuestions = [];
		main.players = [];
		main.playerNames = main.logFile[1].substring(9).split(",");
		for (var i = 0; i < main.playerNames.length; i++) {
			var player = clone(main.playerTemplate);
			player.name = main.playerNames[i];
			main.players.push(player);
		}
		
		main.players[main.players.length-1].name = main.players[main.players.length-1].name.substring(0, main.players[main.players.length-1].name.length-1)
		main.displayMessage(main.texts["Welcome"] + " " + main.playerNames.join(","));
		
		var lastQuestion = [];
		for (var i = 3; i < main.logFile.length; i++) {
			$("#log-holder").append(main.logFile[i] + "<br>");
			if (main.logFile[i].indexOf(main.texts["DoYouPrefer"]) == 0) {
				lastQuestion = [
				main.logFile[i].substring(main.texts["DoYouPrefer"].length + 1, main.logFile[i].indexOf(main.texts["Or"]) - 1),  
				main.logFile[i].substring(main.logFile[i].indexOf(main.texts["Or"]) + main.texts["Or"].length + 1, main.logFile[i].length - 3 )];
				main.answeredQuestions.push(lastQuestion)
			}
			else {
				for (var j = 0; j < main.players.length; j++) {
					if (main.players[j].name == main.logFile[i].substring(0, main.logFile[i].indexOf(":"))) {
						if (main.logFile[i].indexOf(main.texts["OptionComment"]) == -1)
							main.players[j].answers.push(clone(lastQuestion))
					}
				}
			}
		}
		main.unansweredQuestions = main.getQuestions();
		main.nextQuestion();
	}
	
	
	main.handleAction = function(actionName){
		console.log("handleAction", actionName)
		if (actionName == "instructionChoiceYes") {
			main.displayMessage(main.texts["Instructions"]);
			main.addChoice("FAQChoice", ["Yes", "No"], "#log-holder");
		}
		if (actionName == "FAQChoiceYes")
			main.displayMessage(main.texts["FAQ"]);

		if (actionName == "FAQChoiceYes" || actionName == "FAQChoiceNo" || actionName == "instructionChoiceNo") {
			main.displayMessage(main.texts["ChoosePlayer"]);
			main.addField("playerName", "playerString", "#log-holder");
		}
		if (actionName == "playerName") {
			$("#log-holder").html("");
			var playerNames = main.playerString.split(',');
			for (var i = 0; i < playerNames.length; i++) {
				if (playerNames[i][0] == " " && playerNames[i].length > 1) {
					playerNames[i] = playerNames[i].substring(1);
				}
				var player = clone(main.playerTemplate);
				player.name = playerNames[i];
				main.players.push(player)
			}
			if (playerNames.length == 0 || (playerNames.length == 1 && playerNames[0] == "")) {
				alert ("Please enter at least one player name");
				main.displayMessage(main.texts["ChoosePlayer"]);
				main.addField("playerName", "playerString", "#log-holder");
				main.players = [];
				return;
			}
			main.displayMessage(main.texts["Welcome"] + " " + main.playerString + ".");
			main.refreshInfo();
			main.unansweredQuestions = main.getQuestions();
			main.nextQuestion();
		}
		if (actionName == main.texts["OptionOther"]) {
			main.logFile.push(["A", [main.players[main.currentPlayerIndex].name, main.texts["OptionOther"] + ": " + main.tempText]])
			main.answer(main.tempText);
		}
	}

	main.refreshInfo = function() {
		$('#info-holder').html("");
		for (var i = 0; i < main.players.length; i++) {
			var s = main.players[i].name + ":" + main.players[i].answers.length + "/" + main.questions.length + " ";
			$('#info-holder').append(s);
			var changeButton = $('<input type="button" class="button info" id="changePlayerName' + i + '" value="' + main.texts["ChangePlayerName"] + '">')
			changeButton.click(function(e) {
				var field = $('<input type="text" class="field">');
				$("#" + e.currentTarget.id).before(field)
				$("#" + e.currentTarget.id).prop('value', main.texts["Submit"])
				$("#" + e.currentTarget.id).unbind();
				$("#" + e.currentTarget.id).click(function(e) {
					main.players[parseInt(e.currentTarget.id.substring(16))].name = field[0].value;
					main.refreshInfo();
				})
			});
			$('#info-holder').append(changeButton);
			var removeButton = $('<input type="button" class="button info" id="removePlayer' + i + '" value="' + main.texts["RemovePlayer"] + '"><br>')
			removeButton.click(function(e) {
				main.players.splice([parseInt(e.currentTarget.id.substring(16))], 1);
				main.refreshInfo();
			});
			$('#info-holder').append(removeButton);
		};
		$('#info-holder').append("<br>")
		addButton = $('<input type="button" class="button info" id="addButton" value="' + main.texts["AddPlayer"] + '">')
		addButton.click(function(e) {
			var field = $('<input type="text" class="field">');
			$("#" + e.currentTarget.id).before(field)
			$("#" + e.currentTarget.id).prop('value', main.texts["Submit"])
			$("#" + e.currentTarget.id).unbind();
			$("#" + e.currentTarget.id).click(function(e) {
				var player = clone(main.playerTemplate)
				player.name = field[0].value;
				main.players.push(player);
				main.refreshInfo();
			})
		})
		$('#info-holder').append(addButton);
		saveButton = $('<input type="button" class="button info" id="saveButton" value="' + main.texts["SaveToFile"] + '">')
		saveButton.click(function(e) {
			var text = main.makeLogString(false);
			var filename = "TulDevelopGameSave"
			var blob = new Blob([text], {type: "text/plain;charset=utf-8"});
			saveAs(blob, filename+".txt");
			alert(main.texts["SavedAlert"])
		});
		$('#info-holder').append(saveButton);
		main.enableLoading();
	}
	
	main.addChoice = function(choiceName, actionNames, where) {
		for (var i = 0; i < actionNames.length; i++) {
			var button = $('<input type="button" class="button choice" id="' + choiceName + actionNames[i] + '" value="' + main.texts[actionNames[i]] + '">');
			button.click(function(e) {
				$(".choice").remove()
				main.handleAction(e.currentTarget.id)
			});
			$(where).append(button);
		}
	}
	
	main.addField = function(fieldName, varName, where) {
		var field = $('<input type="text" class="field" id="' + fieldName + 'Field">');
		var button = $('<input type="button" class="button" id="' + fieldName + '" value="' + main.texts["Submit"] + '">');
			button.click(function(e) {
				$("#" + e.currentTarget.id).remove()
				var field = $("#" + e.currentTarget.id + "Field");
				main[varName] = field[0].value;
				field.remove();
				main.handleAction(e.currentTarget.id)
				}
			);
			
		field.keyup(function(event){
			if(event.keyCode == 13){
				button.click();
			}
		});
		$(where).append(field);
		$(where).append(button);
	}

	main.getQuestions = function() {
		var a = [];
		for (var i = 0; i < main.questions.length; i++) {
			var found = false;
			for (var j = 0; j < main.answeredQuestions.length; j++) {
				if (main.questions[i][0] == main.answeredQuestions[j][0] || main.questions[i][1] == main.answeredQuestions[j][1]) {
					found = true;
				}
			}
			if (found == false)
				a.push(main.questions[i]);
		}
			// shuffle array
		var j, x, i;
		for (i = a.length; i; i--) {
			j = Math.floor(Math.random() * i);
			x = a[i - 1];
			a[i - 1] = a[j];
			a[j] = x;
		}
		return a;
	}
	
	
	main.nextQuestion = function() {
		if (main.unansweredQuestions.length == 0) {
			alert ("No more questions left, sorry!")
			return;
		}
		main.currentQuestion = main.unansweredQuestions.pop();
		var qtext = main.texts["DoYouPrefer"] + " " + main.currentQuestion[0] + " " + main.texts["Or"] + " " + main.currentQuestion[1] + "?";
		main.displayMessage(qtext);
		main.logFile.push(["Q", main.currentQuestion]);
		main.currentPlayerIndex = 0;
		main.askPlayer(main.currentPlayerIndex);
	}
	
	main.askPlayer = function(i) {
		if (i >= main.players.length) {
			main.nextQuestion();
			return;
		}
		main.displayMessage(main.players[i].name + ": ", true);
		var options = [main.currentQuestion[0], main.currentQuestion[1], main.texts["OptionOther"]];
		for (var i = 0; i < options.length; i++) {	
			var button = $('<input type="button" class="button choice" id="' + main.currentQuestion[0] + main.texts["Or"] + main.currentQuestion[1] + options[i] + '" value="' + options[i] + '">');
			button.click(function(e) {
				$(".choice").remove()
				if (e.currentTarget.value == main.texts["OptionOther"]) {
					main.displayMessage(main.texts["OptionOther"] + ": ", true);
					main.addField(e.currentTarget.value, "tempText", "#actions-holder");	
				}
				else {
					main.logFile.push(["A", [main.players[main.currentPlayerIndex].name, e.currentTarget.value]])
					main.answer(e.currentTarget.value)
				}
			});
		$("#actions-holder").append(button);
		}
	}
	
	main.answer = function (choice) {
		main.displayMessage(choice);
		main.answeredQuestions.push(main.currentQuestion);
		main.players[main.currentPlayerIndex].answers.push(main.currentQuestion);
		main.refreshInfo();
		main.askPlayer(++main.currentPlayerIndex);
	}

	main.makeLogString = function(isHtml) {
		console.log(main.logFile)
		var text = [];
		for (var i = 0; i < main.logFile.length; i++) {
			if (main.logFile[i][0] == "Q")
				text[i] = main.texts["DoYouPrefer"] + " " + main.logFile[i][1][0] + " " + main.texts["Or"] + " " + main.logFile[i][1][1] + "? ";
			if (main.logFile[i][0] == "A")
				text[i] = main.logFile[i][1][0] + ": " + main.logFile[i][1][1] + ((main.logFile[i][1][2] != undefined) ? ": " + main.logFile[i][1][2] : "");
		};
		if (main.logFile[main.logFile.length-1][0] == "Q")
			text.pop();
		
		var newLine = (isHtml)? "<br>" : "\r\n";
		var playerNames = [];
		for (var i = 0; i < main.players.length; i++) {
			playerNames.push(main.players[i].name);
		}
		text.unshift("Players: " + playerNames.join() + newLine);
		text.unshift("Date: " + new Date());
		text = text.join(newLine);
		return text;
	}
	
	main.displayMessage = function(message, noBreak) {
		var logHolder = $("#log-holder")
		if (!noBreak)
			message = message + "<br>";
		logHolder.append(message);
		logHolder.scrollTop(logHolder[0].scrollHeight);
	}
}
