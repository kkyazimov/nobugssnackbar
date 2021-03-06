'use strict';
/******************************************************************************
 *                                Utility functions
 ******************************************************************************/

function findVariable(){
	// the variable must not be initialized
	var vars = Game.jsInterpreter.variables;
	
	// always the first variable is NoBugsJavaScript.varName
	var varname = vars[0].scope.properties["NoBugsJavaScript"].properties["varName"].data;
	
	for (var i=1; i<vars.length; i++)
		if (vars[i].name === varname) {
			return vars[i].scope.properties[varname].data;
		}
	
	return null;
}

/******************************************************************************
 *                                Objective
 ******************************************************************************/

var Objective = {
	factories : []
};

Objective.init = function(elem, trata) {
	return {objective:elem.childNodes[0].nodeValue, achieved:false, trata:trata};
};

Objective.verifyObjectives = function(key, options) {
	if ((hero.allObjectivesAchieved || (hero.objective.debug && Game.runningStatus != 2)))
		return false;
	
	var dest = Objective.factory(key);

	var ret = false;
	if (hero.objective.ordered) {
		if (!hero.objective.objectives[hero.lastObjectiveAchieved + 1].objective === key)
			return false;
		
		if (dest.checkObjective(options, hero.objective.objectives[hero.lastObjectiveAchieved + 1])) {
			
			Objective.markAchieved(hero.objective.objectives[hero.lastObjectiveAchieved + 1]);
			return true;
		} 

		
	} else {
		for (var i = 0; i < hero.objective.objectives.length; i++) {
			if (hero.objective.objectives[i].objective === key && !hero.objective.objectives[i].achieved) {
				
				if (dest.checkObjective(options, hero.objective.objectives[i])) {
					
					Objective.markAchieved(hero.objective.objectives[i]);
					if (key === "deliver" && options.allCustomers) {
						ret = true;
					} else
						return true;
					
				}
			}
		}
		
	}

	return ret;
};

Objective.markAchieved = function(objective) {
	
	objective.achieved = true;
	hero.lastObjectiveAchieved++;
	
	hero.allObjectivesAchieved = (hero.lastObjectiveAchieved+1) == hero.objective.objectives.length;

	
};

Objective.factory = function(key) {
	var r = this.factories[key];
	if (r != undefined)
		return r;
	
	switch (key) {
	
	case "counter": 
		this.factories[key] = new Objective.Counter();
		break;

	case "askForFood":
		this.factories[key] = new Objective.AskForFood();
		break;

	case "pickUpFood": 
		this.factories[key] = new Objective.PickUpFood();
		break;

	case "askForDrink":
		this.factories[key] = new Objective.AskForDrink();
		break;

	case "pickUpDrink": 
		this.factories[key] = new Objective.PickUpDrink();
		break;
	
	case "deliver": 
		this.factories[key] = new Objective.Deliver();
		break;

	case "varQtd": 
		this.factories[key] = new Objective.VarQtd();
		break;

	case "commQtd": 
		this.factories[key] = new Objective.CommsQtd();
		break;
	}
	
	return this.factories[key];
};

Objective.createExplanationItemPlacePos = function(msgKey, objective) {
	var key = BlocklyApps.getMsg("_"+objective.place);
	var text = BlocklyApps.getMsg(msgKey);
	return text.format(key  + " " + objective.pos);
};

/******************************************************************************
 *                                Counter
 ******************************************************************************/

Objective.Counter = function() {};
Objective.Counter.prototype.init = function(elem) {
	var p = Objective.init(elem, this);
	p.pos = elem.getAttribute("pos");
	return p;
};

Objective.Counter.prototype.checkObjective = function(options, objective)  {
	var posObj = hero.counter[objective.pos-1];
	if (options.nx == posObj.x && options.ny == posObj.y) {
		
		return true;
	} 
	
	return false;

};

Objective.Counter.prototype.createExplanationItem = function(objective) {
	var text = BlocklyApps.getMsg("explanation_counter");
	return text.format(objective.pos);
};

/******************************************************************************
 *                                AskForFood
 ******************************************************************************/

Objective.AskForFood = function() {};
Objective.AskForFood.prototype.init = function(elem) {
	var p = Objective.init(elem, this);
	
	p.pos = elem.getAttribute("pos");
	p.place = elem.getAttribute("place");
	p.distinct = elem.getAttribute("distinct") === "true";
	
	return p;
};

Objective.AskForFood.prototype.checkObjective = function(customer, objective)  {

	if (objective.distinct) {
		
		var varData = findVariable();
		if (varData != undefined)
			return false;
		
	}
	if (objective.place === "counter") {
		if (customer.currentNode.id === CustOpt.counter[objective.pos-1]) {
	
			return true;
		}
	}
	
	return false;
};

Objective.AskForFood.prototype.createExplanationItem = function(objective) {
	if (objective.distinct) {
		return Objective.createExplanationItemPlacePos("explanation_askForFoodDistinctVar", objective);
	}
	
	return Objective.createExplanationItemPlacePos("explanation_askForFood", objective);
};

/******************************************************************************
 *                                Catch... Something
 ******************************************************************************/

Objective.CatchSomething = function(explanationKey) {
	this.key = explanationKey;
}; 

Objective.CatchSomething.prototype.init = function(elem) {
	var p = Objective.init(elem, this);
	
	p.pos = elem.getAttribute("pos");
	p.place = elem.getAttribute("place");
	
	return p;
};

Objective.CatchSomething.prototype.checkObjective = function(itemCatched, objective)  {
	
	var cust = null;
	if (objective.place === "counter") {
		cust = CustomerManager.getCustomerCounter(objective.pos);
	}
	if (cust == null)
		return false;
	

	var something = this.askSomething(cust);
	return itemCatched.descr === something.descr;
		
	
};

Objective.CatchSomething.prototype.createExplanationItem = function(objective) {
	return Objective.createExplanationItemPlacePos(this.key, objective);
};

Objective.CatchSomething.prototype.askSomething = function(cust) {
	// the child class must implement this method
	
	return {descr: "nothing"};
};


/******************************************************************************
 *                                PickUpFood
 ******************************************************************************/
Objective.PickUpFood = function() {
	Objective.CatchSomething.call(this, "explanation_catchFood");
}; 

inherits(Objective.CatchSomething, Objective.PickUpFood);

Objective.PickUpFood.prototype.askSomething = function(cust) {
		
	return cust.askForFood();
};

/******************************************************************************
 *                                PickUpDrink
 ******************************************************************************/
Objective.PickUpDrink = function() {
	Objective.CatchSomething.call(this, "explanation_catchDrink");
}; 

inherits(Objective.CatchSomething, Objective.PickUpDrink);

Objective.PickUpDrink.prototype.askSomething = function(cust) {
		
	return cust.askForDrink();
};

/******************************************************************************
 *                                AskForDrink
 ******************************************************************************/

Objective.AskForDrink = function() {
	Objective.AskForFood.call(this);
};

inherits(Objective.AskForFood, Objective.AskForDrink);

Objective.AskForDrink.prototype.createExplanationItem = function(objective) {
	return Objective.createExplanationItemPlacePos("explanation_askForDrink", objective);
};

/******************************************************************************
 *                                 Deliver
 ******************************************************************************/

Objective.Deliver = function() {};

Objective.Deliver.prototype.init = function(elem) {
	var p = Objective.init(elem, this);
	
	p.pos = elem.getAttribute("pos");
	p.place = elem.getAttribute("place");
	
	return p;
};

Objective.Deliver.prototype.checkObjective = function(options, objective)  {
	var cust = null;
	if (objective.place === "counter") {
		
		if (options.allCustomers)
			cust = CustomerManager.getCustomerCounter(objective.pos);
		else {
			
			if (options.customer.currentNode.id === CustOpt.counter[objective.pos-1]) 
				cust = options.customer;
		}
	}
	if (cust == null)
		return false;
	
	return !(cust.hasThirsty() || cust.hasHunger());
};

Objective.Deliver.prototype.createExplanationItem = function(objective) {
	return Objective.createExplanationItemPlacePos("explanation_deliver", objective);
};

/******************************************************************************
 *                          Quantity of Variables
 ******************************************************************************/

Objective.VarQtd = function() {};
Objective.VarQtd.prototype.init = function(qtd) {
	var p = {objective:"varQtd", achieved:false, trata:this};
	
	p.qtd = qtd;
	
	return p;
};

Objective.VarQtd.prototype.checkObjective = function(options, objective)  {
	// -1 because there is a special variable
	return (Game.jsInterpreter.variables.length-1) <= objective.qtd;
};

Objective.VarQtd.prototype.createExplanationItem = function(objective) {
	
	var text = BlocklyApps.getMsg("explanation_varQtd");
	return text.format(objective.qtd);
	
};


/******************************************************************************
 *                          Quantity of Commands
 ******************************************************************************/

Objective.CommsQtd = function() {};
Objective.CommsQtd.prototype.init = function(qtd) {
	var p = {objective:"commQtd", achieved:false, trata:this};
	
	p.qtd = qtd;
	
	return p;
};

Objective.CommsQtd.prototype.checkObjective = function(options, objective)  {

	var count = Game.countInstructions(Blockly.mainWorkspace.getTopBlocks());

	return count <= objective.qtd;
};

Objective.CommsQtd.prototype.createExplanationItem = function(objective) {
	
	var text = BlocklyApps.getMsg("explanation_commsQtd");
	return text.format(objective.qtd);
	
};


