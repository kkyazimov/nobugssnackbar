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
 * @fileoverview Customer life's management.
 * @author adilsonv77@gmail.com (Adilson Vahldick)
 */
'use strict';

var CustomerManager = {};
var customers = [];

PreloadImgs.put('banco', 'images/banco.png');

CustomerManager.init = function(openMission, customers, sn) {
	
    this.banco = PreloadImgs.get("banco");

    this.openMission = openMission;
	this.optCustomers = customers;
	
	this.randomization = [];

	if (sn != undefined)
		this.parseSN(sn);
};

CustomerManager.parseSN = function(sn) {
	
	var randoms = sn.getElementsByTagName("randomization");
	for (var i=0; i<randoms.length; i++) {
		
		var random = randoms[i];
		var r = {};
		r.qtd = random.getAttribute("qtd");
		r.type = random.textContent.toString();
		r.set = random.getAttribute("set");
		if (r.set == null)
			r.set = "new";
		
		this.randomization[i] = r;
	}

};

// TODO need to improve this function. There is not neccessary load the configuration each time this function is called
CustomerManager.reset = function() {
	this.patterns = [];
	
	customers = [];

	var customer = this.optCustomers.firstElementChild;
	while (customer != null) {
		var init = customer.getElementsByTagName("init")[0].textContent.toString();
		
		if (init === "door") {
			init = CustOpt.door;
		} else {
			if (init.indexOf("counter") == 0) {
				init = CustOpt.counter[parseInt(init.substring(7)) - 1];
			}
		}
		
		var dest = customer.getElementsByTagName("dest")[0];
		if (dest != null) {
			dest = dest.textContent.toString();
			if (dest.indexOf("counter") == 0) {
				dest = {id : CustOpt.counter[parseInt(dest.substring(7)) - 1], type : "counter"};
			}
		}
		
		var id = customer.getElementsByTagName("id")[0].textContent.toString();
		
		var pattern = customer.getElementsByTagName("pattern")[0];
		if (pattern == null) {
			
			var _foods = customer.getElementsByTagName("foods")[0];
			var _drinks = customer.getElementsByTagName("drinks")[0];
			var foods = CustomerManager.extractItems("food", _foods);
			var drinks =  CustomerManager.extractItems("drink", _drinks , customer.getAttribute("randomType"), foods.length);
			
			var hasRandom = (customer.getAttribute("randomType") != null) || (_foods.getAttribute("randomMin") != null) || (_drinks.getAttribute("randomMin") != null);
			
			customers.push(new Customer({init: init, place: dest, id: id, hasRandom: hasRandom, foods: foods, drinks: drinks, openMission: this.openMission}));
			
		} else {
			
			// this means the customers go away and will come new customers at same place
			var orders = pattern.getElementsByTagName("order");
			
			var custPattern = [];
			
			for (var i = 0; i < orders.length; i++) {

				var foods = CustomerManager.extractItems("food", orders[i].getElementsByTagName("foods")[0]);
				var drinks =  CustomerManager.extractItems("drink", orders[i].getElementsByTagName("drinks")[0], orders[i].getAttribute("randomType"), foods.length);
			
				
				if (foods.length > 0 || drinks.length > 0)
					custPattern.push({ hasRandom: orders[i].getAttribute("randomType")!=null, foods: foods, drinks: drinks});
			}
			
			if (custPattern.length > 0)
				this.patterns.push({init: init, place: dest, id: id, pattern: custPattern, idxCustPattern: 0});
			
		}
		
		customer = customer.nextElementSibling;
	}
	
	this.createCustomersBasedOnPattern();
	this.transformSN(); // this doesnt work with pattern options
};

/**
 * This method deletes some customer wishes.
 */
CustomerManager.transformSN = function() {
	
	if (this.randomization.length > 0) {
		
		var custSelected = null;
		for (var j=0; j<this.randomization.length; j++) {
			
			switch (this.randomization[j].set) {
				case "new":
					custSelected = this.selectCustomers(customers.length - this.randomization[j].qtd, []);
					break;
				case "notTheSame":
					custSelected = this.selectCustomers(customers.length - this.randomization[j].qtd, custSelected);
					break;
					
			}
			
			switch (this.randomization[j].type) {
				case "thirsty":
					
					// how many will not have thirsty
					for (var i=0; i < custSelected.length; i++) {
						customers[custSelected[i]].drinks = [];
					}
					break;
				case "hungry":
					
					// how many will not have hungry
					for (var i=0; i < custSelected.length; i++) {
						customers[custSelected[i]].foods = [];
					}
					break;
			}
		}
		
	}
	
};

CustomerManager.createCustomersBasedOnPattern = function() {
	
	for (var i = 0; i < this.patterns.length; i++) {
		var place = this.patterns[i].place;
		var found = false;
		for (var i = 0; i < customers.length; i++)
			if (customers[i].id === place.id && customers[i].type === place.type) {
				found = true;
				break;
			}
		
		if (!found) {
			
			CustomerManager.createCustomerByPattern(i, this.patterns[i].init);
		}
	}
	
};

CustomerManager.createCustomerByPattern = function(idxPattern, initPlace) {
	
	var i = idxPattern;
	var custPattern = this.patterns[i].pattern[this.patterns[i].idxCustPattern];
	
	this.patterns[i].idxCustPattern = (this.patterns[i].idxCustPattern + 1) %  this.patterns[i].pattern.length;
		
	var foods = custPattern.foods;
	var drinks = custPattern.drinks;
	
	customers.push(new Customer({
							init: initPlace, 
							place: this.patterns[i].place, 
							id: this.patterns[i].id, 
							hasRandom: this.patterns[i].hasRandom, 
							foods: foods, drinks: drinks,
							openMission: this.openMission, idxPattern: i}));
	
	// TODO thinking this method using the transformSN method
	
};

CustomerManager.selectCustomers = function(howMany, previous) {
	var available = [];
	var j=0;
	for (var i=0; i < customers.length; i++) {
		if (previous.indexOf(i) == -1) {
			available[j] = i;
			j++;
		}
	}
	
	var ret = [];
	for (var i=0; i < howMany; i++) {
		var selected = Math.floor((Math.random() * (available.length)));
		ret[i] = available[selected];
		available.splice(selected, 1);
	}
	
	return ret;
	
};

CustomerManager.extractItems = function(key, list, randomType, foodsLen) {
	
	var randomMin = list.getAttribute("randomMin");
	var differentFromPrevious = list.getAttribute("differentFromPrevious") === "true";
	
	var isDrinkList = foodsLen != undefined;
	var children = list.getElementsByTagName(key);
	
	var selected = [];
	for(var j=0; j < children.length; j++) {
		selected[j] = j;
	}
	
	if (randomMin != null) {
		randomMin = parseInt(randomMin);
		var randomMax = parseInt(list.getAttribute("randomMax"));
		
		var howMany = Math.floor((Math.random() * ((randomMax-randomMin)+1))) + randomMin;
		
		if (foodsLen == 0 && howMany == 0 && randomType === "atLeastOne")
			howMany = 1;
		
		if (differentFromPrevious) {
			for (var i = 0; i < customers.length; i++) {

				var destList;
				if (isDrinkList)
					destList = customers[i].drinks;
				else 
					destList = customers[i].foods;
				
				destList.forEach(function(item) {
					
					for (var j = children.length-1; j >= 0; j--)
						if (children[j].childNodes[0].nodeValue === item.item) {
							selected.splice(j, 1);
							break;
						}
				});
			}
		}
		
		while (selected.length > howMany) {
			var s = Math.floor((Math.random() * (selected.length)));
			selected.splice(s, 1);
		}
	}
	
	var items = [];
	for (var j=0; j < selected.length; j++) {
		
		var item = children[selected[j]];
		
		var theItem = item.childNodes[0].nodeValue;
		
		if (hero.hasMachineFor(theItem)) {
			var thePrice = parseInt(item.getAttribute("price"));
			items.push({item: theItem, price: thePrice});
		}
		
	} 
	
	return items;
	
};

CustomerManager.removeCustomer = function(customer) {
	var start = customers.indexOf(customer);
	customers.splice(start, 1);
};

CustomerManager.update = function() {
	for (var i = 0; i < customers.length; i++)
		customers[i].update();
	
};

CustomerManager.animation = function() {
	
	for (var i = 0; i < customers.length; i++)
		customers[i].animate();
	
};

CustomerManager.draw = function(ctx) {
	
	var counters = [true, true, true, true];
	
	for (var i=0; i<customers.length; i++) {
		customers[i].draw(ctx);
		var nId = customers[i].currentNode.id;
		for (var j=0; j<CustOpt.counter.length; j++) {
			if (nId === CustOpt.counter[j]) {
				counters[j] = false;
				break;
			}
		}
		
	}
	
	CustomerManager.drawCounters(ctx, counters);
	
};

CustomerManager.drawCounters = function(ctx, counters) {
	
	for (var i= 0; i < counters.length; i++) {
		if (counters[i]) {
			var n = CustOpt.nodes[CustOpt.counter[i]];
			ctx.drawImage(this.banco, n.x, n.y-32);
		}
	}
	
};

CustomerManager.getCustomerCounter = function(id) {
	
	id = id - 1;
	
	for (var i=0; i<customers.length; i++)
	  if (customers[i].currentNode.id === CustOpt.counter[id])
		return customers[i];
	
	return null;
};

CustomerManager.getCustomerPosition = function(id) {
	
	for (var i=0; i<CustOpt.counter.length; i++)
		  if (id === CustOpt.counter[i])
			return i+1 + " ";
	
	// in future, test the tables
	return "0";
};

