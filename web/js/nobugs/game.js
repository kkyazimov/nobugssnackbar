/**
 * NoBug's Snack Bar
 *
 * Copyright 2014 Adilson Vahldick.
 * https://nobugssnackbar.googlecode.com/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * This code is based on Mazed application
 * 
 * @fileoverview Game management for NoBugs Snack Bar application.
 * @author adilsonv77@gmail.com (Adilson Vahldick)
 */
'use strict';

/**
 * Create a namespace for the application.
 */
var Game = {};

Game.runningStatus = 0;
Game.howManyRuns = 0; // in this session

var hero;
Game.mission = null;

/**
 * PID of animation task currently executing.
 */
Game.pidList = [];


Game.globalMoney = {};
Game.missionMoney = {};

Game.lastErrorData;
Game.jsInterpreter;
Game.variableBox = null;

Game.DOWN = 1;
Game.RIGHT = 2;
Game.varWindow = Game.RIGHT;

Game.counterInstruction = null;

PreloadImgs.put('fundo', 'images/fundo.png');
PreloadImgs.put('doors', 'images/doors.png');


/**
 * Initialize Blockly and SnackBar. Called on page load.
 */
Game.init = function() {
	
	Game.currTime = 0;
	
    PreloadImgs.loadImgs();

    // if there is some event added in before execution, than remove it
    window.removeEventListener('resize',  Game.resizeMainWindow);
    window.removeEventListener('keydown',  Game.keyDown);
    window.removeEventListener('keyup',  Game.keyUp);
    
    window.addEventListener('resize',  Game.resizeMainWindow);
    window.addEventListener('keydown',  Game.keyDown);
    window.addEventListener('keyup',  Game.keyUp);
    
	Game.CTRLPRESSED = false;
	Game.blocksSelected = [];

	// if the user's key is stored in cookies, then the system will not show the login dialog
    UserControl.verifyLogged(function(ret) {
		
		if (ret[0]) {
			
			Game.renderQuestionnaire(ret[1], ret[2], ret[3], ret[4], ret[5], ret[6]);
			
		} else {
			window.removeEventListener('unload', Game.unload);

  		    document.getElementById("mainBody").style.display = "none";
		    document.getElementById("initialBackground").style.display = "inline";
		    Game.resizeMainWindow();
		    
		}
	});


};

window.addEventListener('load', Game.init);

Game.resizeMainWindow = function() {
	
	var lu = document.getElementById("loginuser");
    document.getElementById("errorLogin").style.left = lu.offsetLeft + "px";
    document.getElementById("suporte").style.left = (document.getElementById("suporte").clientWidth -
    														document.getElementById("suportespan").offsetWidth - 10) + "px";

};

Game.keyDown = function(evt) {
	Game.CTRLPRESSED = evt.ctrlKey;
};

Game.keyUp = function(evt) {
	Game.CTRLPRESSED = false;
};

Game.login = function() {
	
	document.getElementById('ButtonLogin').disabled = "disabled";
	
	var user = document.getElementById('loginuser').value;
	var passw = document.getElementById('loginpassw').value;
	
    UserControl.login(user, passw, 
		  function(ret) {
    		document.getElementById('ButtonLogin').disabled = "";
			var error = document.getElementById("errorLogin");

			if (ret[0] == null) {
				
	  			document.getElementById('loginuser').value = "";
	  			document.getElementById('loginpassw').value = "";
	  			
	  			error.innerHTML = "";
	  			
  				Game.renderQuestionnaire(ret[1], ret[2], ret[3]);
	  			
	  				  			
	  		} else {
	  			error.innerHTML = BlocklyApps.getMsg(ret[0]);
	  		}
  		  }
    );
};

Game.renderQuestionnaire = function(u, missionsHistorical, leaderBoard, clazzId, levelId, missionIdx) {
	/*
	 * missionsHistorical [...][n], where n are 
	 *   0 - class name
	 *   1 - level name
	 *   2 - how many missions
	 *   3 - how many solved missions
	 *   4 - class id
	 *   5 - level id
	 *   6 - missions that can be replayed []
	 */
	/*
	 * leaderBoard [...][n], where n are
	 *   0 - userid
	 *   1 - username
	 *   2 - money
	 *   3 - time spent
	 *   4 - executions
	 *   5 - max mission accomplished 
	 *   ----
	 *   0 - null, means that the user can't see the leaderboard. Then the parameter 1 has the minimum mission accomplished for this user see it.
	 */
	Game.loginData = {userLogged: u, missionHist: missionsHistorical, leaderBoard: leaderBoard, 
					     clazzId: clazzId, levelId:levelId , missionIdx:missionIdx };
	
	try {
		UserControl.retrieveQuestionnaire(function(q) {
			if (q != null) {
				
				if (!Game.showQuestionnaire(q))
					Game.continueLoginProcess();
				
			} else {
				Game.continueLoginProcess();
			}
			
		});
	} catch (ex) {
		Game.init();
	};
};

Game.showQuestionnaire = function(q) {
	
	var formQuestionnaire = Questionnaire.createForm(q);
	if (formQuestionnaire != null) {
		
		$("#contentQuestionnaire").html("");
		$("#contentQuestionnaire").append(formQuestionnaire);
		
		MyBlocklyApps.showDialog(document.getElementById("dialogQuestionnaire"), null, false, true, true, 
				$("#questionnaire").get(0).firstChild.data, null, null);
		
	} 
	
	return formQuestionnaire != null;
};

Game.finishQuestionnaire = function() {

	var consistido = Questionnaire.consistQuestionnaire();
	
	if (consistido) {
		
		Questionnaire.handlingQuestionnaire(function(saveAnswers) {
			UserControl.saveQuestionnaire(saveAnswers);
		});
		
		BlocklyApps.hideDialog(false);

		Game.continueLoginProcess();
	}
};

Game.continueLoginProcess = function() {
	if (Game.loginData.userLogged.lastTime == null) {
		
		var userName = document.getElementById("userCompleteName");
		userName.innerHTML = Game.loginData.userLogged.name;
		
		var intro2 = BlocklyApps.getMsg("NoBugs_intro2");
		intro2 = intro2.format((Game.loginData.userLogged.sex==="M"?BlocklyApps.getMsg("King"):BlocklyApps.getMsg("Queen")));
		
		
		var intro2Span = document.getElementById("NoBugsIntro2");
		intro2Span.innerHTML = intro2;
		
		MyBlocklyApps.showDialog(document.getElementById('dialogIntro'), 
				null, false, true, true, "Intro", {width: "540px"},null);
		
	} else 
		Game.logged(Game.loginData.missionHist);
	
};

Game.finishIntro = function() {
	BlocklyApps.hideDialog(false);
	Game.logged(Game.loginData.missionHist);
};

Game.logged = function(missionsHistorical) {
	
	UserControl.updateUserLastTime();
	
	if (Game.variableBox != null)
		Game.variableBox.style.display = "none";
	
	
	if (Game.loginData.clazzId == undefined || Game.loginData.clazzId == 0) {

		// this is necessary when unloads
	    document.getElementById("mainBody").style.display = "none";
	    document.getElementById("initialBackground").style.display = "inline";
	    Game.resizeMainWindow();
	    
		var idRoot = Game.missionsRetrieved(missionsHistorical);
		
		$("#" + idRoot).css("height", "342px");
	    $("#tdSelectMission").append($("#" + idRoot));
	    
	    if (Game.loginData.leaderBoard.length > 0 && Game.loginData.leaderBoard[0][0] == null) {
	    	createNoLeaderBoardInfo();
	    } else {
		    createsLeaderBoard("#"+idRoot);
	    }
	    
	    
		MyBlocklyApps.showDialog(document.getElementById("dialogSelectMission"), 
					null, false, true, true,
					BlocklyApps.getMsg("Text_YourProgress"), null, //  
					function() { 
						$("#" + idRoot).remove();
				    	 
					});
	} else {
		Game.missionSelected(Game.loginData.clazzId, Game.loginData.levelId, Game.loginData.missionIdx);
	}
};


Game.missionsRetrieved = function(missions) {
	var s = [];
	
	var data = [];
	for (var i= 0; i<missions.length; i++){
		var rec = null;
		var idx = s.indexOf(missions[i][0]);
		if (idx == -1) {
			s.push(missions[i][0]);
			
			rec = {group: missions[i][0], groupId: missions[i][4], levels:[]};
			data.push(rec); 
			
		} else {
			rec = data[idx];
		}
		
		var l = {name: missions[i][1], id: missions[i][5], 
							 howManyItems: missions[i][2], 
					 howManyItemsAchieved: missions[i][3], 
					          repeateable: missions[i][6]};
		rec.levels.push(l);
	}
	
	var f1 = function (evt) {
		 
		 var itemId = this.getAttribute("idgroup");
		 var missionIdx = this.getAttribute("iditem");
		 var levelId = this.getAttribute("idlevel");
		 BlocklyApps.hideDialog(true);
  	 
		 Game.missionSelected(itemId, levelId, missionIdx);
		 
	};
	
	var f2 = function(i) {
		
    	var imgs = generateImages(i, 2);
		var html = $.each(imgs, function(i){
			   imgs[i] = "<img src='images/"+this+"'/>";
		         });
		
		return html;
	};
	
	var f3 = function(i, j, m) {
		if (data[i].levels[j].repeateable.indexOf(m) > -1) // repeateable missions never are enabled
			return false;
		
		var ma = parseInt((data[i].levels[j].lastAllAchieved?data[i].levels[j].howManyItemsAchieved:"-1"));
		var mt = ma + 1;
		
		return m < mt;
	};
	
	var f4 = function(i, j, m) {
		var idx = data[i].levels[j].repeateable.indexOf(m);
		var ma = parseInt((data[i].levels[j].lastAllAchieved?data[i].levels[j].howManyItemsAchieved:"-1"));
		var mt = ma + 1;
		return (idx == -1 && m == mt) || (idx > -1 && m <= mt);
	};

	var sel = new Selector(data, 1, 70, "unlockBack", "lockBack", "rerunBack", f1, f2, f3, f4);
	return sel.build();
	
};

Game.moveBlocksToZero = function() {
	
	var blocks = Blockly.mainWorkspace.getTopBlocks();
	for (var i=0; i<blocks.length; i++){
		blocks[i].moveBy(0, 0);
	}	
	
};


Game.missionSelected = function(clazzId, levelId, missionIdx) {
	
  document.getElementById("initialBackground").style.display = "none";
  
  document.getElementById("mainBody").style.display = "inline";
  if (Game.counterInstruction != null) {
	  mainBody.removeChild(Game.counterInstruction);
	  Game.counterInstruction = null;
  }
	  			
  Game.removeChangeListeners();

  BlocklyApps.init();
	
  NoBugsJavaScript.redefine();
  
  Game.rtl = BlocklyApps.isRtl(); // Right-To-Left language. I keep this, but it's not our initial intention
    
  Game.optResize = {
	blocklyDivW: 600,
	blocklyDivH: "90%",
	varBoxT: true,
	varBoxH: "90%"
  };
  
  // window.removeEventListener('resize',  Game.resizeMainWindow); //
  
  window.addEventListener('scroll', Game.scrollEvent);  
  window.addEventListener('resize',  Game.resizeWindow);

  Blockly.Generator.prototype.STATEMENT_PREFIX = 'highlightBlock(%1);\n';
  Blockly.JavaScript.INFINITE_LOOP_TRAP = 'highlightBlock(%1);\n';

  // Add to reserved word list: API, local variables in execution environment
  // (execute) and the infinite loop detection function.
  Blockly.JavaScript.addReservedWords('Game, code');

  window.addEventListener('unload', Game.unload);
 
  Game.slider = {};
  Game.slider.svg = document.getElementById('slider');
  Game.slider.svg.style.visibility = "hidden";
  
  if (Game.speedSlider == undefined)
	  Game.speedSlider = new Slider(10, 20, 130, Game.slider.svg);

  Game.variableBox = document.getElementById('variableBox');
  Game.blockly = document.getElementById('blockly');
  
  Game.ctxDisplay = document.getElementById('display').getContext('2d');
  Game.imgBackground = PreloadImgs.get("fundo");	

  Game.imgDoor = PreloadImgs.get("doors");
  
  Game.lastErrorData = new Object();
  Game.lastErrorData.iderror = 0;
  Game.lastErrorData.message = "";
  Game.lastErrorData.block = null;
  
  try {
	  UserControl.loadMission(clazzId, levelId, missionIdx, Game.missionLoaded);
  } catch (ex) {
	  Game.init();
  }

};

Game.unload = function(e) {

	Game.saveMission();
	
    return null;
};

Game.saveMission = function() {
	
	var answer = null;
	if (Blockly.mainWorkspace != null) 
		answer = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(Blockly.mainWorkspace));
	var timeSpent = 0;
	if (Game.currTime != 0)
		timeSpent = Math.floor(((new Date().getTime()) - Game.currTime)/1000);
	
	UserControl.saveMission(0, timeSpent, Game.howManyRuns, false, answer, 
			{callback:function() {}, async:false});
	
	Game.currTime = new Date().getTime();
	
};

Game.missionLoaded = function(ret){
	
  Game.howManyRuns = parseInt(ret[4]);
  Game.previousCode = ret[2];
	
  var xml = ret[1];
  var mission = transformStrToXml(xml);
  var t = BlocklyApps.getMsg("_mission");
  Game.missionTitle =  t.charAt(0).toUpperCase() + t.substring(1) + " " + ret[0];
	
  Game.openMission = {};
  Game.openMission.open = mission.childNodes[0].getAttribute("open") != null && mission.childNodes[0].getAttribute("open") === "true";
  Game.openMission.time = mission.childNodes[0].getAttribute("timeLimit");
  
  Game.globalMoney = new ProgressMoney(false, 298, 8);
  Game.missionMoney = new ProgressMoney(true, 200, 8);

  if (Game.openMission.open)
	  Game.timeSpent = 0;
  else
	  Game.timeSpent = ret[3];

  
  UserControl.retrieveMoney(function(ret) {
	  Game.globalMoney.amount = parseInt(ret);
  });

  Game.slider.timesBefore = 0;
  
  var slider = mission.childNodes[0].getElementsByTagName("slider");
  if (slider.length > 0) {
	  Game.slider.timesBefore = parseInt(slider[0].getAttribute("timesBefore"));
  }
  // if the slider is not loaded in the begin, then the hint show it 
  if (Game.howManyRuns >= Game.slider.timesBefore) {
	  Game.slider.svg.style.visibility = "visible";
  }
   
  
  var commands = mission.childNodes[0].getElementsByTagName("commands")[0];
  
  var toolbox = nobugspage.toolbox(null, null, 
		  {enabled: Explanation.selectCommands(commands)}); // xml definition of the available commands
  
  Game.toolbox = toolbox;
  
  var objectives = mission.childNodes[0].getElementsByTagName("objectives")[0];
  Game.verifyButtons(objectives);
  
  hero = new SnackMan(objectives, mission);
  Game.mission = mission;

  Game.installMachines(toolbox);
};

Game.afterInstallMachines = function() {

  var mission = Game.mission;
  var sourceXML = mission.childNodes[0].getElementsByTagName("xml")[0];
  if (Game.previousCode != null) // the user try this mission before, than load the previous code
	  Game.nextPartOfMissionLoaded(false, Game.previousCode, mission, Game.timeSpent);
  else {
      var preload = sourceXML.getAttribute("preload");
	  if (preload != null) {
		  UserControl.loadAnswer(preload, function (ret) {
			  Game.nextPartOfMissionLoaded(true, ret, mission, 0);
		  });
	  }
	  else {
		  var outerHTML = sourceXML.outerHTML || (new XMLSerializer()).serializeToString(sourceXML);
		  Game.nextPartOfMissionLoaded(true, outerHTML, mission, 0);
	  }
  }
  
  // release memory 
  Game.previousCode = null;
  Game.timeSpent = null;
};

Game.installMachines = function(toolbox) {
	UserControl.loadMachinesFromUser(function(ret) {

		for (var i = 0; i < ret.length; i++) {
			
			var m = ret[i][1].toLowerCase();
			var m2 = 'images/_' + m + '.png';
			PreloadImgs.put(m, m2, true);
			
			hero.installMachine(ret[i][0], ret[i][1], ret[i][2], ret[i][3], ret[i][4], ret[i][5], ret[i][6], ret[i][7], ret[i][8], ret[i][9]);
		}
		
		if (ret.length > 0) 
			toolbox = Game.loadToolBoxWithMachines(toolbox);

		document.getElementById('blockly').innerHTML = ""; // clean the editor
	    Blockly.inject(document.getElementById('blockly'),
		     {path: '',
		       rtl: Game.rtl,
		       toolbox: toolbox,
		       trashcan: true,
		       comments: false,
		       scrollbars: true});
	    
	    Game.afterInstallMachines();

	});	
};

Game.loadToolBoxWithMachines = function(toolbox) {
	var yourMachines = BlocklyApps.getMsg("Apps_catYourMachines");
	
	var s = '<category name="' + yourMachines + '">';
	for (var i = 0; i < hero.extendedCommands.length; i++) {
		s = s + '<block type="'+ hero.extendedCommands[i].name + '"/>';
	}
	s = s + '</category></xml>';
	
	return toolbox.replace('</xml>', s);
	
};
  
Game.buyButtonClick = function() {
	
	Game.saveMission();
    var selectMachine = Game.mission.childNodes[0].getElementsByTagName("selectMachine")[0];
    Game.selectMachine(selectMachine);
    
};

Game.selectMachine = function(selectMachineOpts) {
	
	Game.machines = [];
	Game.loadMachines(selectMachineOpts, 0);
};

Game.continueSelectMachine = function() {
	var data = [];
	var rec = {group: "", groupId: 1, levels:[]};
	data.push(rec);
	
	var l = {name: BlocklyApps.getMsg("Text_Equipments"), id: "x", howManyItems: Game.machines.length, howManyItemsAchieved:-1};
	rec.levels.push(l);
	
	var f1 = function(evt) {
		
		if (Game.selectedMachine != null) {
			Game.selectedMachine.style.backgroundColor = "#7777DD";
		}
		Game.selectedMachine = this;

		this.style.backgroundColor = "#FFB347";
		
		$('#BuyMachine').removeAttr("disabled");
	};
	
	var f2 = function(i) {
		
		i--;
		
		var m = Game.machines[i].name.toLowerCase();
		PreloadImgs.put(m, 'images/_' + m + '.png');
		
		var t = BlocklyApps.getMsg( "Text_" + Game.machines[i].name );
		
		return "<img src='images/"+m+".png'/> <br/> " + t + "<br/>"+Game.machines[i].cust+" <img style='vertical-align:middle' src='images/coin2.png'/>";
			
	};
	
	var f3 = function(i, j, m) {
		return false;
	};
	
	var f4 = function(i, j, m) {
		return Game.globalMoney.amount >= Game.machines[m-1].cust;
	};
	
	var sel = new Selector(data, 1, 180, null, null, null, f1, f2, f3, f4);
	var selBuilt = sel.build();

	var content = $("<div/>")
			.append($("#" + selBuilt))
			.append(nobugspage.buyButton(null, null, null));
			
	PreloadImgs.loadImgs();
	
	MyBlocklyApps.showDialog(content[0], null, false, true, true,
		BlocklyApps.getMsg("Text_AddNewEquipment"), null, 
		function() { 
			$("#" + selBuilt).remove();
	    	 
		});

};

Game.loadMachines = function(selectMachineOpts, idx) {
	
	var type = selectMachineOpts.children[idx].getAttribute("type");
	UserControl.loadMachine(type, function(ret){
		Game.machines.push({id: type, name: ret[0], cust: ret[1]});
		
		idx++;
		if (idx < selectMachineOpts.children.length) {
			Game.loadMachines(selectMachineOpts, idx);
		} else {
			Game.selectedMachine = null;

			UserControl.listMachinesFromUser(function(ret2) {

				for (var i = Game.machines.length - 1; i>=0; i--) {
					
					if (ret2.indexOf(Game.machines[i].id) >= 0)
						Game.machines.splice(i, 1);
				}
				
				Game.continueSelectMachine();
			});

		}
	});
	
};

Game.buyMachineButtonClick = function() {
	var idmachine = Game.selectedMachine.getAttribute("iditem");
	UserControl.buyMachine(idmachine, function() {

		UserControl.loadWholeMachineData([idmachine], function(machine) {
				hero.installMachine(idmachine, machine[0][1], machine[0][2], machine[0][3], machine[0][4], machine[0][5], machine[0][6], machine[0][7], machine[0][8], machine[0][9]);
				 
				var tb = Game.loadToolBoxWithMachines(Game.toolbox);
				PreloadImgs.loadImgs();
				
				var dom = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace);
				
				document.getElementById('blockly').innerHTML = ""; // clean the editor
				Blockly.inject(document.getElementById('blockly'),
					     {path: '',
					       rtl: Game.rtl,
					       toolbox: tb,
					       trashcan: true,
					       comments: false,
					       scrollbars: true});
				
				Blockly.Xml.domToWorkspace(Blockly.mainWorkspace, dom);
				
				Game.display();
				BlocklyApps.hideDialog(false);
		});
	});
};

Game.nextPartOfMissionLoaded = function(firstTime, answer, mission, timeSpent) {
	
  Game.speedSlider.setValue(0.5); 
		
  var xml = Blockly.Xml.textToDom(answer);
  Blockly.Xml.domToWorkspace(Blockly.mainWorkspace, xml);
  Game.moveBlocks();
  
  Game.firstTime = firstTime;
  
  var loginLoaded = function(data) {
      CustomerManager.init(Game.openMission.open,
    		  			   data.childNodes[0].getElementsByTagName("customers")[0],
    		  			   data.childNodes[0].getElementsByTagName("customersSN")[0]);
      
	  Game.reset();
	  
	  if (Game.openMission.open) {
	  
		  Game.bonusTime = Game.openMission.time;
		  Game.bonusTimeReward = "0";
			  
	  } else {
		  
		  Game.bonusTime = data.childNodes[0].getElementsByTagName("objectives")[0].getAttribute("bonusTime");
		  Game.bonusTimeReward = data.childNodes[0].getElementsByTagName("objectives")[0].getAttribute("bonusTimeReward");
		  
	  }
	  
	  
	  Game.addCronometro(Game.bonusTime , timeSpent );
	  
	  Game.showCountInstructions();
	  
	  BlocklyApps.bindClick('runButton', Game.runButtonClick);
	  BlocklyApps.bindClick('resetButton', Game.resetButtonClick);
	  BlocklyApps.bindClick('debugButton', Game.debugButtonClick);

	  //BlocklyApps.bindClick('nextMissionButton', Game.nextMissionButtonClick);
	  BlocklyApps.bindClick('buyButton', Game.buyButtonClick);
	  BlocklyApps.bindClick('goalButton', Game.goalButtonClick);
	  BlocklyApps.bindClick('logoffButton', Game.logoffButtonClick);
	  //BlocklyApps.bindClick('xmlButton', Game.xmlButtonClick);

	 // BlocklyApps.bindClick('moveDown', Game.moveDownButtonClick);
	 // BlocklyApps.bindClick('moveRight', Game.moveRightButtonClick);
	  
	  Game.unlockBlockly();
	  // Lazy-load the syntax-highlighting.
	  window.setTimeout(BlocklyApps.importPrettify, 1);
	  
	  if (Game.firstTime) {
		  Explanation.showInfo(mission.childNodes[0].getElementsByTagName("explanation")[0], true);
	  } else {
		  Hints.init(Game.mission.getElementsByTagName("hints")[0]);
		  Game.initTime();
	  }
  };
  
  window.setTimeout(function(){loginLoaded(mission);}, 1000); 
	  
	  
}; 

/* This procedure is necessary for two reasons: 
 *    1 - depends on the viewport when the user finished his session
 *    2 - some times the user put blocks in crazy positions
 */
Game.moveBlocks = function() {
	
	var blocks = Blockly.mainWorkspace.getTopBlocks();
	var minPosX = 0, minPosY = 0;
	for (var i=0; i<blocks.length; i++){
		var xy = blocks[i].getRelativeToSurfaceXY();
		if (minPosX > xy.x)
			minPosX = xy.x;
		
		if (minPosY > xy.y)
			minPosY = xy.y;
	}
	
	minPosX = Math.abs(minPosX); minPosY = Math.abs(minPosY);
		
	for (var i=0; i<blocks.length; i++){
		blocks[i].moveBy(minPosX, minPosY);
	}	
	
};

Game.verifyButtons = function(objectives) {
	Game.enabledDebug = objectives.getAttribute("buttonDebug") !== "false";
	Game.enabledRun = objectives.getAttribute("buttonRun") !== "false";
	Game.enabledVarWindow = objectives.getAttribute("variableWindow") !== "false";
	Game.enabledBuy = objectives.getAttribute("buttonBuy") === "true";
	
	if (!Game.enabledDebug)
		Game.disableButton('debugButton');
	
	if (!Game.enabledRun)
		Game.disableButton('runButton');
	
	if (!Game.enabledBuy)
		Game.disableButton('buyButton');

	Game.resetButtons();
};

Game.timesUp = function (m, s) {
	if (((m*60 + s)+30) == Game.bonusTime) {
		
		Game.changeCSSAlertCronometro();
		
	} else {
		if (((m*60 + s)) == Game.bonusTime) {
			
			Game.changeCSSOverCronometro();
			Game.finishOpenMission();
			
		} 
	}
};

Game.changeCSSAlertCronometro = function() {

	var o = $('.digit');
	o.removeClass('static');
	o.addClass('alert');


	o.css('background-color', 'rgba(230,9,40,1)');

	Game.cronometro.options.cssDigit = 'alert';
	
};

Game.changeCSSOverCronometro = function() {

	var o = $('.digit');
	o.removeClass('alert');
	o.addClass('over');
	
	o.css('background-color', '#CFCFC4');
	
	Game.cronometro.options.cssDigit = 'over';
	Game.cronometro.options.callback =  function(){}; // it's not still necessary call this method
	
};

Game.beforeFinishMission = function() {
	Game.victory = true;
	
    Game.lastErrorData.iderror = 0;
    Game.lastErrorData.message = "";
	
	Hints.stopHints();
    Game.stopCronometro();
    Game.stopAlertGoalButton();
    
	//TODO animar o cooker no final da missao

	var xml = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace);
    var answer = Blockly.Xml.domToText(xml);

	var now = new Date().getTime();
	var timeSpent = Math.floor((now - Game.currTime)/1000);
	
	return {timeSpent: timeSpent, answer: answer};
	
};

Game.showDialogVictory = function(out) {
	
	var vicText = document.getElementById("victoyText");
	vicText.innerHTML = out;

	MyBlocklyApps.showDialog(document.getElementById("dialogVictory"), null, true, true, true, null, null, 
			function(){
				Game.init();
		});

};

Game.finishOpenMission = function() {
	
	if (!Game.openMission.open) return;
	
	var r = Game.beforeFinishMission();
	Game.runningStatus = 0;
	
	UserControl.saveMission(Game.missionMoney.amount, r.timeSpent, Game.howManyRuns, true, r.answer, function(){
	
		var msg = BlocklyApps.getHtmlMsg("NoBugs_finishOpenMission");
		var coin2 = "<img style='vertical-align: middle;' src='images/coin2.png'/>";
		var out = msg.format(Game.missionMoney.amount + "&nbsp;" + coin2)+ "<br/>";
		
		Game.showDialogVictory(out);
		
	});
	
};

Game.addCronometro = function(bonusTime, timeSpent) {

	$('#timerCountUp').empty();
	Game.cronometro = null;
	
	if (bonusTime != null) {
		timeSpent = parseInt(timeSpent);
		$('#timerCountUp').append("<span></span>");;
		Game.cronometro = CountUp($('#timerCountUp span'), {start:timeSpent, stopped: true, callback:Game.timesUp});
		
		$('#timerCountUp').css("right", $('#logoffButton').width()); 
		$('#timerCountUp').css("right", $('#timerCountUp').width()); 
		var logoff = document.getElementById("logoffButton");
		var newTop = logoff.offsetTop + ((logoff.clientHeight - $('.countdownHolder').height())/2);
		$('#timerCountUp').css("top", newTop + "px");
		if (timeSpent > Game.bonusTime) {
			Game.changeCSSOverCronometro();
		}
		else
			if (timeSpent+30 >= Game.bonusTime)
				Game.changeCSSAlertCronometro();
	}
	
};

Game.initTime = function() {
	
	Game.currTime = new Date().getTime();
	Game.initCronometro();
	Game.startSaveUserProgress();

};

Game.initCronometro = function() {
	if (Game.cronometro != null)
		Game.cronometro.restart();
};

Game.cleanCronometro = function() {
	if (Game.cronometro != null) {
		Game.cronometro.stop();
		
		$('#timerCountUp').empty();
		Game.cronometro = null;
		
	}
};

Game.stopCronometro = function() {
	if (Game.cronometro != null) {
		Game.cronometro.stop();
	}
};

Game.doResizeWindow = function(style) {
	if (Game.variableBox == null)
		return; // this happens in the select mission dialog
	
	if (style != undefined) {
	  Game.variableBox.style.display = style;
	}
	Game.resizeWindow(null);
    Blockly.fireUiEvent(window, 'resize');
};

Game.scrollEvent =  function() {
	  Hints.hideHintWithTimer();
    Game.doResizeWindow();
  };
  
Game.resizeWindow = function(e) {
	
	var visualization = document.getElementById('visualization'); // the animation area
	var top = visualization.offsetTop;

	Game.blockly.style.top = Math.max(10, top - window.pageYOffset) + 'px';
	Game.blockly.style.left = Game.rtl ? '10px' : '380px';
    var w = window.innerWidth;
    if (Game.variableBox.style.display === "none") {
    	//Game.blockly.style.height = "90%";
        w -= 400;
    	
    } else {
    	Game.blockly.style.height = Game.optResize.blocklyDivH;
        w -= Game.optResize.blocklyDivW;
    	
        Game.variableBox.style.top = (Game.optResize.varBoxT?Game.blockly.style.top:(Game.blockly.offsetTop+Game.blockly.offsetHeight+10)+"px");
        if (Game.optResize.varBoxT) {
        	Game.variableBox.style.left = ((Game.rtl ? 10 : 380) + w + 5) + 'px';
        	Game.variableBox.style.width = "200px";
        }
        else {
        	Game.variableBox.style.left = Game.blockly.style.left;
        	Game.variableBox.style.width =  Game.blockly.style.width;
        }
        Game.variableBox.style.height = Game.optResize.varBoxH;
        
    }
    Game.blockly.style.width = (w) + 'px';
    
    var blocklyLock = document.getElementById("blocklyLock");
	
	if (blocklyLock !== null && blocklyLock !== "undefined" && blocklyLock !== undefined) {
	    blocklyLock.style.cssText = Game.blockly.style.cssText;
	    blocklyLock.style.height = Game.blockly.clientHeight  + "px";;
	    blocklyLock.style.position = "fixed";
	    blocklyLock.style.backgroundColor = "grey";
	    blocklyLock.style.opacity = "0.3";
	}
    
    if (Game.counterInstruction != null)
    	Game.counterInstruction.style.left = (Game.blockly.offsetLeft + Game.blockly.offsetWidth - Game.counterInstruction.clientWidth - 15) + "px";

  };


Game.moveDownButtonClick = function() {
	Hints.hideHintWithTimer();
	
	Game.varWindow = Game.DOWN;
	document.getElementById("moveDown").style.display = 'none';
	document.getElementById("moveRight").style.display = 'inline-block';
	
	  Game.optResize = {
		blocklyDivW: 400,
		blocklyDivH: "70%",
		varBoxT: false,
		varBoxH: "20%"
	  };
			  
     Game.doResizeWindow();
};

Game.moveRightButtonClick = function() {
	  Hints.hideHintWithTimer();

	  Game.varWindow = Game.RIGHT;
      document.getElementById("moveRight").style.display = 'none';
	  document.getElementById("moveDown").style.display = 'inline-block';
	
	  Game.optResize = {
				blocklyDivW: 600,
				blocklyDivH: "90%",
				varBoxT: true,
				varBoxH: "90%"
			  };
			  
	  Game.doResizeWindow();
};
	
/**
 * Reset the game to the start position, clear the display, and kill any
 * pending tasks.
 */
Game.reset = function() {
  
  Game.victory = false;
  Game.stopAlertGoalButton();
  hero.reset();
  CustomerManager.reset();
  Game.missionMoney.amount = 0;

  Game.display();

  Game.killAll();
};

Game.killAll = function() {
  // Kill any task.
  // Kill all tasks.
  for (var x = 0; x < Game.pidList.length; x++) {
    window.clearTimeout(Game.pidList[x]);
  }
  Game.pidList = [];

};

/**
 * Just draw the states of objects. Other of this function happens the events that changes
 *     the states.
 */
Game.display = function() {

	CustomerManager.animation();

	Game.ctxDisplay.drawImage( Game.imgBackground, 0 , 0, 352, 448 );

	if (Game.openMission.open)
		Game.missionMoney.draw(Game.ctxDisplay);
	
	Game.globalMoney.draw(Game.ctxDisplay);
	
	hero.draw(Game.ctxDisplay);
	CustomerManager.draw(Game.ctxDisplay);
	
};

Game.exitCountInstructions;

Game.countInstructions = function(c, f) {
	
	Game.exitCountInstructions = false;
	var conta = 0;
	for (var i = 0; i < c.length; i++) {
		var block = c[i];
		if (block.nextConnection != null) { // we dont count the blocks that are into other blocks, as parameter, for instance 
			conta++;
		} 	
		if (f != undefined)
			if (!f(block)) {
				Game.exitCountInstructions = true;
				return conta;
			}
		conta += Game.countInstructions(block.childBlocks_, f);
		if (Game.exitCountInstructions)
			return conta;
	}
	
	return conta;
	
};

Game.goalButtonClick = function() {
	
	Hints.stopHints();
	Blockly.WidgetDiv.hide();
	Game.stopAlertGoalButton();
	
	Explanation.showInfo(Game.mission.childNodes[0].getElementsByTagName("explanation")[0], false);
	
};

Game.logoffButtonClick = function() {
	
	Hints.stopHints();
	Game.stopAlertGoalButton();
	BlocklyApps.hideDialog(false);
	window.removeEventListener('unload', Game.unload);
	
	var now = new Date().getTime();
	Game.cleanCronometro();

	$('#vars').datagrid('loadData', {
		"total": 0, "rows": []
	});
    Game.doResizeWindow("none");
    Game.killAll();
    Game.runningStatus = 0;
	
    var answer = null;
    var timeSpent = 0;
    if (Game.currTime != 0) {
        answer = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(Blockly.mainWorkspace));
    	timeSpent = Math.floor((now - Game.currTime)/1000);
    	
    }

    document.getElementById('blockly').innerHTML = ""; // clean the editor
    window.removeEventListener('scroll', Game.scrollEvent);  
    window.removeEventListener('resize',  Game.resizeWindow);
    
	UserControl.logoff(timeSpent, Game.howManyRuns, answer, function(){
		// because is synchronous, we need wait to finish the last request 
		Game.init();
		
	});
};

/**
 * Click the run button.  Start the program.
 */
Game.runButtonClick = function() {

  Game.disableButton("runButton");
  Game.enableButton("resetButton");
  Game.disableButton("debugButton");
  Game.disableButton("buyButton");
  
  Game.doResizeWindow("none");
  
  Blockly.mainWorkspace.traceOn(true);
  Game.execute(1);
};

/**
 * Click the reset button.  Reset the Game.
 */
Game.resetButtonClick = function() {

   Game.lastErrorData.iderror = 0;
   Game.lastErrorData.message = "";
   Game.lastErrorData.block = null;

   Hints.stopHints();
	
  Game.resetButtons();
  Game.reset();
  
  Game.doResizeWindow("none");
  
  Hints.startHints();
  Game.unlockBlockly();
  Game.stopAlertGoalButton();
};

Game.enableButton = function(buttonName) {

	if ((buttonName === "debugButton" && !Game.enabledDebug) ||
		(buttonName === "runButton" && !Game.enabledRun) ||
		(buttonName == "buyButton" && !Game.enabledBuy))
		return;
	
   var button = document.getElementById(buttonName);
   button.disabled = "";
   button.className = "primary";
};

Game.disableButton = function(buttonName) {
   var button = document.getElementById(buttonName);
   button.disabled = "disabled";
   button.className = "notEnabled";
};

Game.firstClick = true;

/**
 * Click the debug button.  Start the program/go to next line.
 */
Game.debugButtonClick = function() {
	 
	Game.disableButton('debugButton');
	if (Game.runningStatus === 0) {
		
		Game.enableButton('resetButton');

		if (Game.enabledVarWindow) {
			Game.doResizeWindow("inline");
			$('#vars').datagrid('resize');
		}
		
		Blockly.mainWorkspace.traceOn(true);
		Game.firstClick = true;
		
	} else {
		
		Hints.stopHints();
		Game.firstClick = false;
		if (!Blockly.mainWorkspace.traceOn_) // the second complete debug didn't show the highlight on the blocks 
			Blockly.mainWorkspace.traceOn(true);
		
	}
	
	Game.execute(2);
};

Game.resetButtons = function(hideVars) {
	
	Game.disableButton('resetButton');
	
	Game.enableButton('debugButton');
	
	Game.enableButton('runButton');
	
	Game.enableButton('buyButton');
	
	if (Blockly.mainWorkspace != null)
		Blockly.mainWorkspace.traceOn(false); 
	
	Game.runningStatus = 0;
	
	if (hideVars == undefined || hideVars == true)
		$('#vars').datagrid('loadData', {
			"total": 0, "rows": []
		});
};


/**
 * Execute the user's code.  Heaven help us...
 */
Game.execute = function(debug) {
	
  if (Game.runningStatus === 0) {
	  
	  Game.highlightPause = false;
	  
	  Blockly.hideChaff();
	  Hints.stopHints();
	  Blockly.WidgetDiv.hide();
	  
	  BlocklyApps.log = [];
	  BlocklyApps.ticks = 10000; // how many loops are acceptable before the system define it is in infinite loop ? 
		
		$('#vars').datagrid('loadData', {
			"total": 0, "rows": []
		});

	  // Reset the graphic.
	  Game.reset();

	  
	  try {
		  
		var js = Blockly.JavaScript;
		
		Game.howManyRuns++;

		Game.saveMission();
		
		if (Blockly.selected != null) {
			
			myIsTargetSvg = true; // defined in blockly.js 
			Blockly.selected.unselect();
			myIsTargetSvg = false;
			
		}
		
		Game.countInstructions(Blockly.mainWorkspace.getTopBlocks(), Game.semanticAnalysis);
		
  	    var code = "var NoBugsJavaScript = {};\n";
  	    if (Game.openMission.open) {
  	    	code += "NoBugsJavaScript.stop = false; \n while (!NoBugsJavaScript.stop) { \n " + js.workspaceToCode() + "\n } ";
  	    } else 
  	    	code += js.workspaceToCode();
  	    
      //  alert(code);
	    Game.jsInterpreter = new NoBugsInterpreter(code, Game.initApi);

		// BlocklyApps.log now contains a transcript of all the user's actions.
        Game.stepSpeed = 1000 * Math.pow(0.5, 3);
	    
        Game.lockBlockly();
        
	  } catch (e) {
		  
		  if (e == Infinity) { 
			  Game.showError(["Error_infinityLoopDetected"]);
		      Game.resetButtons();
		      return;
		  } else
			  if (e.isNoBugs) {
				  Blockly.mainWorkspace.highlightBlock(Blockly.selected.id);
				  Game.showError([e.msg]);
			      Game.resetButtons();
			      return;
			  }
		  
		  console.log(e);
		  
	  };
  }

  Game.runningStatus = debug;
  Game.pidList.push( window.setTimeout(function(){Game.nextStep();},2 )); // nothing in callstack
};

Game.semanticAnalysis  = function(block) {
	
	if (Game.hasEmptyInputs(block)) {
		
		Blockly.selected = block;
		throw {isNoBugs: true, msg : "Hints_EmptyInputError"};
		
	}
	return true;
};

Game.hasEmptyInputs = function (activeBlock) {
	var input = activeBlock.inputList;
	for (var i=0; i<input.length; i++) {
		if (input[i].connection != null) {
			if (input[i].sourceBlock_.type !== "controls_if" && input[i].connection.targetConnection == null)
			  return true;
			if (input[i].connection.targetConnection != null) {
				if (Game.hasEmptyInputs(input[i].connection.targetConnection.sourceBlock_))
					return true;
			}
		} 
	}
	
	return false;

};

Game.showCountInstructions = function() {

	if (hero.hasCommQtd || hero.objective.maxCommands > 0) {

		var ci = document.createElement("div");
		ci.id = "countInstruction";
		ci.style.position = "absolute";
		ci.style.top = blockly.offsetTop + "px";
		ci.style.backgroundColor = "rgba(153, 152, 152, 0.28)";
		ci.style.opacity = "0.3";
		
		ci.innerHTML = Game.countInstructions(Blockly.mainWorkspace.getTopBlocks()) + " blocks";
		document.getElementById("mainBody").appendChild(ci);

		ci.style.left = (Game.blockly.offsetLeft + Game.blockly.offsetWidth - ci.clientWidth - 15) + "px";
		
		
		Game.counterInstruction = ci;
	} else
		Game.counterInstruction = null;
	
};

Game.updateCounterInstructions = function(howMany) {
	if (Game.counterInstruction == null)
		return;
	
	Game.counterInstruction.innerHTML = howMany + " blocks";
	Game.counterInstruction.style.left = (Game.blockly.offsetLeft + Game.blockly.offsetWidth - Game.clientWidth - 15) + "px";
};

/**
 * Lock block panel during running
 */
Game.lockBlockly = function() {
	
    var blocklyLock = document.createElement("div");
    
    blocklyLock.id = "blocklyLock";
    blocklyLock.style.cssText = Game.blockly.style.cssText;
    blocklyLock.style.height = Game.blockly.clientHeight + "px";
    blocklyLock.style.position = "fixed";
    blocklyLock.style.backgroundColor = "grey";
    blocklyLock.style.opacity = "0.3";
    
    
	var mainBody = document.getElementById("mainBody");
	mainBody.appendChild(blocklyLock);
	
};

/**
 * Unlock block panel after run
 */
Game.unlockBlockly = function() {
	var blocklyLock = document.getElementById("blocklyLock");
	
	if (blocklyLock !== null && blocklyLock !== "undefined" && blocklyLock !== undefined) {
		var mainBody = document.getElementById("mainBody");
		mainBody.removeChild(blocklyLock);
	}
	
};

Game.updateVariables = function() {
	
	var totalrows = Game.jsInterpreter.variables.length;
	var rows = [];
	
	Game.jsInterpreter.variables.forEach(function(entry) {
		var data = entry.scope.properties[entry.name].data;
		if (data != undefined) {
			if (data.type != undefined) {
				data = "<div>" + 
						"<p style='margin: 0px' class="+data.type+"><img src='images/"+ data.descr + ".png'/></p>"+
						"<p style='margin: 0px'>"+BlocklyApps.getMsg("__" + data.sourceType)+" "+CustomerManager.getCustomerPosition(data.source)+"</p>" +  
						"</div>";
			}
				
			rows.push({"name":entry.name, "value": data});
		}
	});
	
	$('#vars').datagrid('loadData', {
		"total": totalrows, "rows": rows
	});
};

Game.nextStep = function() {
	if (Game.runningStatus == 0)
		return;
	
	while (true) {
		try {
			if (Game.jsInterpreter.step()) {
				
				if (BlocklyApps.log.length > 0 || Game.highlightPause) {
					
					if (Game.runningStatus != 2  || Game.highlightPause === false) {
						BlocklyApps.log.push(['nextStep']);
					}
					else {

						Game.highlightPause = false;
						if (Game.firstClick && Game.runningStatus == 2) {
							BlocklyApps.log.push(['nextStep']);
							Game.firstClick = false;
						}
					}
					
					Game.pidList.push( window.setTimeout(function(){Game.animate();},10) ); // nothing in callstack 
					
					return;
				}
				
			} else {
				
				// if there isn't more lines to evaluate
				Game.resetButtons();
				
			    Blockly.mainWorkspace.highlightBlock(null);
			    
			    hero.verifyObjectives("deliver", {allCustomers:true});
			    hero.verifyObjectives("varQtd", null);
			    hero.verifyObjectives("commQtd", null);
			    
			    Game.lastErrorData.block = null;
			    if (hero.allObjectivesAchieved) {
			    	
			    	var r = Game.beforeFinishMission();
			    	
			    	var count = Game.countInstructions(Blockly.mainWorkspace.getTopBlocks());
			    	var reward = hero.addReward(count, (Game.cronometro == null?0:Game.cronometro.passed), Game.bonusTime, Game.bonusTimeReward);
			    	Game.globalMoney.amount = parseInt(Game.globalMoney.amount) + reward.total;
			    	Game.display();

			    	UserControl.saveMission(reward.total, r.timeSpent, Game.howManyRuns, true, r.answer, function(){
			    		
			    		var msg = BlocklyApps.getMsg("NoBugs_goalAchievedVictory");
			    		var coin2 = "<img style='vertical-align: middle;' src='images/coin2.png'/>";
			    		var out = msg.format(reward.total + coin2)+ "<br/>";
			    		
			    		if (reward.base != reward.total) {
			    			
				    		var out2 =  "<table class='tableVictory' ><tr style='font-weight:bold'><td>" + BlocklyApps.getMsg("Victory_BaseValue") + " </td><td align='right' style='width: 50px;'> " + reward.base + "</td></tr>";
				    		out2 = out2 + "<tr style='font-weight:bold'><td colspan='2'>" + BlocklyApps.getMsg("Victory_Bonus") + "</td></tr>" ;
				    		for (var i=0; i < reward.bonus.length; i++) {
				    			var b = BlocklyApps.getMsg(reward.bonus[i].name);
				    			var s = b.format(reward.bonus[i].extraInfo);
				    			out2 = out2 + "<tr><td> <img src='images/goal_ok.png'/>&nbsp;" + s + "</td> <td align='right' style='width: 50px;'>" + reward.bonus[i].value + "</td></tr>";   
				    		}
				    		out = out + out2 + "</table>";
				    		
			    		}
			    		
			    		Game.showDialogVictory(out);
			    	});
			    	
			    } else {
			    	
			    	var objs = [];
					var os = hero.objective.objectives;
					for (var i=0; i<os.length; i++) {
						
						objs[i] = [Objective.factory(os[i].objective).createExplanationItem(os[i]), os[i].achieved];
					}
					UserControl.missionFail(Game.howManyRuns, objs);

				    
			    	
		    	    Game.lastErrorData.iderror = "missionFail";
		    	    Game.lastErrorData.message = document.getElementById("dialogFailText");

			    	
			    	MyBlocklyApps.showDialog(document.getElementById("dialogFail"), null, true, true, true, null, null,
			    			function() {
				    			Hints.showErrorHint();
			    			}
			    	);
			    }
			    
			    Game.unlockBlockly();
			    
			    return;
				
			}
		} catch (ex) {
			  console.log(ex);
			// when was something wrong in the command execution, as wrong parameter value, or invalid moment of the command use
			  Game.animate();
			  
			  Game.unlockBlockly();
			  Game.stopAlertGoalButton();
			  Hints.startHints();

		      return;
			
		}
	}
};

/**********************************************************************
 *  Block of function and variables to save the progress of the user  *
 **********************************************************************/

Game.logEvent = null;

Game.startSaveUserProgress = function() {
	
	if (Game.logEvent == null)
		Game.logEvent = Blockly.addChangeListener(function() {
			
			if (Blockly.Block.dragMode_ != 0)
				return;
			
			var now = new Date().getTime();
			var timeSpent = 0;
			if (Game.currTime != 0)
				timeSpent = Math.floor(((now) - Game.currTime) / 1000);
			
			if (timeSpent < 10) // the minimum interval to log the actions is 10 seconds
				return; 
			
			var answer = "<xml></xml>";
			if (Blockly.mainWorkspace != null) 
				answer = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(Blockly.mainWorkspace));
			

			
			UserControl.saveMission(0, timeSpent, Game.howManyRuns, false, answer);

			Game.currTime = now;
		});
};

// because there are some events from the last mission, and the canvas instance 
// ... changed, then we need renovate the listeners  
Game.removeChangeListeners = function() {
  if (Game.scrollEvent != undefined) {
	  
	  window.removeEventListener("scroll", Game.scrollEvent);
	  //window.removeEventListener("resize", Game.resizeWindow); // not enable this line
	  window.removeEventListener('unload', Game.unload);
	  
	  MyBlocklyApps.unbindClick('runButton', Game.runButtonClick);
	  MyBlocklyApps.unbindClick('resetButton', Game.resetButtonClick);
	  MyBlocklyApps.unbindClick('debugButton', Game.debugButtonClick);

	  MyBlocklyApps.unbindClick('goalButton', Game.goalButtonClick);
	  MyBlocklyApps.unbindClick('logoffButton', Game.logoffButtonClick);
	  
  }
	
  if (Game.logEvent != null) {

	  Blockly.removeChangeListener(Game.logEvent);
	  Game.logEvent = null;
  }
  
  if (Hints.evtChangeListener != null) {

	  Blockly.removeChangeListener(Hints.evtChangeListener);
	  Hints.evtChangeListener = null;
  }
};


/**********************************************************************
 *                          Finish block                              *
 **********************************************************************/

Game.initApi = function(interpreter, scope) {
    // utilities commands
	var wrapper = function() {
        return interpreter.createPrimitive(Game.updateVariables());
      };
    
    interpreter.setProperty(scope, 'updateVariables',
          interpreter.createNativeFunction(wrapper));

    var wrapper = function(id) {
        id = id ? id.toString() : '';
        return interpreter.createPrimitive(Game.highlightBlock(id));
      };
    
    interpreter.setProperty(scope, 'highlightBlock',
          interpreter.createNativeFunction(wrapper));

	var wrapper = function(a0, a1, op) {
        return interpreter.createPrimitive(nobugsComparison(a0, a1, op));
      };
    
    interpreter.setProperty(scope, 'nobugsComparison',
          interpreter.createNativeFunction(wrapper));

    // Move commands
	wrapper = function(n) {
      return interpreter.createPrimitive(hero.goToBarCounter(n));
    };
    
    interpreter.setProperty(scope, 'goToBarCounter',
        interpreter.createNativeFunction(wrapper));

	wrapper = function() {
	      return interpreter.createPrimitive(hero.goToDisplay());
	    };
	    
    interpreter.setProperty(scope, 'goToDisplay',
        interpreter.createNativeFunction(wrapper));

    wrapper = function() {
	      return interpreter.createPrimitive(hero.goToCooler());
	    };
	    
    interpreter.setProperty(scope, 'goToCooler',
      interpreter.createNativeFunction(wrapper));
    
    wrapper = function() {
	      return interpreter.createPrimitive(hero.isThereACustomer());
	    };
	    
	// see commands
    interpreter.setProperty(scope, 'isThereACustomer',
      interpreter.createNativeFunction(wrapper));
    
    wrapper = function() {
	      return interpreter.createPrimitive(hero.hasHunger());
	    };
		  
  // ask the customer commands
  interpreter.setProperty(scope, 'hasHunger',
	      interpreter.createNativeFunction(wrapper));
  
  wrapper = function() {
      return interpreter.createPrimitive(hero.askForFood());
    };
    
   interpreter.setProperty(scope, 'askForFood',
     interpreter.createNativeFunction(wrapper));

    wrapper = function() {
	      return interpreter.createPrimitive(hero.hasThirsty());
	    };
		    
    interpreter.setProperty(scope, 'hasThirsty',
  	      interpreter.createNativeFunction(wrapper));
    
    wrapper = function() {
	      return interpreter.createPrimitive(hero.askForDrink());
	    };
	    
    interpreter.setProperty(scope, 'askForDrink',
      interpreter.createNativeFunction(wrapper));
    
    // about juice
    wrapper = function() {
	      return interpreter.createPrimitive(hero.goToBoxOfFruits());
	    };

	interpreter.setProperty(scope, 'goToBoxOfFruits',
		  interpreter.createNativeFunction(wrapper));
	
    wrapper = function() {
	      return interpreter.createPrimitive(hero.goToJuiceMachine());
	    };

	interpreter.setProperty(scope, 'goToJuiceMachine',
		  interpreter.createNativeFunction(wrapper));
	    
    wrapper = function(o) {
	      return interpreter.createPrimitive(hero.pickUpFruits(o));
	    };

	interpreter.setProperty(scope, 'pickUpFruits',
		  interpreter.createNativeFunction(wrapper));
    
    wrapper = function(o) {
	      return interpreter.createPrimitive(hero.prepareAndPickUpJuice(o));
	    };

	interpreter.setProperty(scope, 'prepareAndPickUpJuice',
		  interpreter.createNativeFunction(wrapper));
	
	
	
	// other commands
    wrapper = function(o) {
	      return interpreter.createPrimitive(hero.pickUpHotDog(o));
	    };

	interpreter.setProperty(scope, 'pickUpHotDog',
		  interpreter.createNativeFunction(wrapper));
	
    wrapper = function(o) {
	      return interpreter.createPrimitive(hero.pickUpDrink(o));
	    };
	    
    interpreter.setProperty(scope, 'pickUpDrink',
	  interpreter.createNativeFunction(wrapper));

    wrapper = function(o) {
	      return interpreter.createPrimitive(hero.deliver(o));
	    };
	    
    interpreter.setProperty(scope, 'deliver',
      interpreter.createNativeFunction(wrapper));
    
    // extended commands
    for (var i=0; i<hero.extendedCommands.length; i++) {
    	wrapper = function(o) {
    	  var ex = interpreter.stateStack[0].func_.ex;
    	  return interpreter.createPrimitive(ex.run(ex.machine, o));
  	      //return interpreter.createPrimitive(ex.run(o));
  	    };
  	    
  	  var nf = interpreter.createNativeFunction(wrapper);
  	  nf.ex = hero.extendedCommands[i];
  	  interpreter.setProperty(scope, nf.ex.nameLang, nf);
    }
  
};

Game.highlightPause = false;

Game.highlightBlock = function(id) {
	
	if (!Blockly.mainWorkspace.traceOn_) // this happens when there was a previous block selected
		Blockly.mainWorkspace.traceOn(true);
	
	BlocklyApps.log.push(['IM', 0]);
	CustomerManager.update();
	
    Blockly.mainWorkspace.highlightBlock(id);
	if (Game.runningStatus === 2) { // if runs, doesnt need to update the variables
		Game.updateVariables();	
	}
    Game.highlightPause = true;
};

/**
 * Iterate through the recorded path and animate the actions.
 */
Game.animate = function() {
 
  var tuple = BlocklyApps.log.shift();
  if (!tuple) {
	if (Game.runningStatus == 2) {
		Game.enableButton('debugButton');
        Hints.startHints();
	}
    return;
  }
  var command = tuple.shift();
  
  if (command === "nextStep") {
	  Game.pidList.push( window.setTimeout(Game.nextStep, 1) );
	  return;
  }
  
  if (Game.step(command, tuple)) {

	  // call the next animate when the animation of the last command has finished
	  //if (Game.runningStatus === 1) 
	  Game.stepSpeed = 1000 * Math.pow(1 - Game.speedSlider.getValue(), 3);

	  Game.pidList.push( window.setTimeout(function() {Game.animate();}, Game.stepSpeed) );
   } else {
	   // TODO ???
	  Game.resetButtons(false);
	  Blockly.mainWorkspace.highlightBlock(null);
	  
  }
};

/**
 * Execute one step in the solution. Returns amount of time consumed by this step
 * @param {string} command 
 * @param {!Array} values List of arguments for the command.
 */
Game.step = function(command, values) {
  switch (command) {
    case 'AL' :
    	hero.alertRun(values);
    	break;
    	
    case 'CO':
    	hero.checkObjectives();
  	case 'IM' :
  		hero.changeSnackManImage(values);
  		break;
  
  	case 'MS' :
  		hero.changeSnackManPosition(values.shift(), values.shift(), values.shift(), values.shift());
  		break;
  		
  	case 'OC' :
  		hero.nextOpenCoolerImage();
  		break;
  		
  	case 'CC' :
  		hero.nextCloseCoolerImage();
  		break;
  		
  	case 'OD' :
  		hero.nextOpenDisplayImage();
  		break;
  		
  	case 'CD' :
  		hero.nextCloseDisplayImage();
  		break;
  		
 	case 'IP' :
  		hero.changeImagePlatter();
  		break;
  		
  	case 'IO' :
  		var value = values.shift();
  		if (value != null)
  			Game.missionMoney.amount += value;
  		
  		value = values.shift();
  		if (value == 0)
  			hero.changeImageOriginal();
  		break;

 	case 'SF' :
  		hero.nextShowFruitImage();
  		break;
  		
 	case 'HF' :
  		hero.nextHideFruitImage();
  		break;
  		
 	case 'MJ':
 		hero.nextShowJuiceMachineImage();
 		break;
  		
 	case 'HJ':
 		hero.nextHideJuiceMachineImage();
 		break;
  		
  	case 'fail':
  		Game.showError(values);
  		return false;
  }
  
  return true;
};

Game.showError = function(iderror) {
	
	Hints.stopHintsEx();
	Game.lastErrorData.iderror = iderror[0];
	
	var content = document.getElementById('dialogError');
	var container = document.getElementById('dialogErrorText');
	container.innerHTML = BlocklyApps.getMsg(iderror[0]);
	Game.lastErrorData.block = Blockly.selected;
	Game.lastErrorData.message = container.textContent;
	
	UserControl.missionError(Game.howManyRuns, iderror[0], Blockly.selected.id, container.textContent);
	
    var style = {top: '120px'}; // };//{width: '370px', 
	style[Blockly.RTL ? 'right' : 'left'] = '215px';
	var origin = Blockly.mainWorkspace.topBlocks_[Blockly.mainWorkspace.topBlocks_.length-1].getSvgRoot();
	
	BlocklyApps.showDialog(content, origin, true, true, style, 
			function() { 
				Hints.startHintsEx(); 
			});

};

Game.lastErrorHas = function(blockName) {
	
	if (Game.lastErrorData.block == null) return;
	
	var input = Game.lastErrorData.block.inputList;
	
	for (var i=0; i<input.length; i++) {
		if (input[i].connection != null) {
			if (input[i].connection.targetConnection != null) {
				if (input[i].connection.targetConnection.sourceBlock_.type === blockName)
					return true;
			}
		} 
	}
	
	return false;
};

Game.alertColor = ["#DD4B39", "#E07c70", "#edcdc9", "#E07c70"];
Game.handleAlertTimer = 0;

Game.alertGoalButton = function() {
	
	if (Game.handleAlertTimer != 0)
		return;
	
	Game.alertControl = 0;	
	
	Game.handleAlertTimer = 
		window.setInterval(function() {
			var gb = document.getElementById("goalButton");
			Game.alertControl = (Game.alertControl + 1) % 4;
			gb.style.backgroundColor = Game.alertColor[Game.alertControl];
		}, 300);
};

Game.stopAlertGoalButton = function() {
	
	if (Game.handleAlertTimer == 0)
		return;
	
	window.clearInterval(Game.handleAlertTimer);
	Game.handleAlertTimer = 0;
	
	var gb = document.getElementById("goalButton");
	gb.style.backgroundColor = "#DD4B39";
	
};