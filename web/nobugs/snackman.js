
SnackMan = function() {
	this.path = {n2:{n1:1, n3:1}, n3:{n2:1, n4:1}, n4:{n3:1, n5:1}, n5:{n4:1, n6:1}, n6:{n5:1, n7:1}, n7:{n6:1, n8:1}, n8:{n7:1, n9:1}, n9:{n8:1, n10:1}, n10:{n9:1, n11:1}, n12:{n11:1, n13:1}, n13:{n12:1, n14:1}, n14:{n13:1, n15:1}, n15:{n14:1, n16:1}, n16:{n15:1, n17:1}, n17:{n16:1, n18:1}, n18:{n17:1, n19:1}, n19:{n18:1, n20:1}, n20:{n19:1, n21:1}, n22:{n21:1, n23:1}, n23:{n22:1, n24:1}, n24:{n23:1, n25:1}, n25:{n24:1, n26:1}, n26:{n25:1, n27:1}, n27:{n26:1, n28:1}, n28:{n27:1, n29:1}, n29:{n28:1, n30:1}, n30:{n29:1, n31:1}, n32:{n31:1, n33:1}, n33:{n32:1, n34:1}, n34:{n33:1, n35:1}, n35:{n34:1, n36:1}, n36:{n35:1, n37:1}, n37:{n36:1, n38:1}, n38:{n37:1, n39:1}, n39:{n38:1, n40:1}, n40:{n39:1, n11:1}, n41:{n31:0.5, n42:0.5}, n42:{n41:0.5, n43:0.5}, n43:{n42:0.5, n44:0.5}, n44:{n43:0.5, n45:0.5}, n45:{n44:0.5, n46:0.5}, n46:{n45:0.5, n47:0.5}, n47:{n46:0.5, n48:0.5}, n48:{n47:0.5, n49:0.5}, n49:{n48:0.5, n50:0.5}, n50:{n49:0.5, n51:0.5}, n51:{n50:0.5, n52:0.5}, n52:{n51:0.5, n53:0.5}, n53:{n52:0.5, n54:0.5}, n54:{n53:0.5, n55:0.5}, n55:{n54:0.5, n56:0.5}, n56:{n55:0.5, n57:0.5}, n57:{n56:0.5, n58:0.5}, n58:{n57:0.5, n59:0.5}, n59:{n58:0.5, n1:0.5}, n60:{n1:1, n61:1}, n61:{n60:1, n62:1}, n62:{n61:1, n63:1}, n63:{n62:1, n64:1}, n64:{n63:1, n65:1}, n65:{n64:1, n66:1}, n66:{n65:1, n67:1}, n67:{n66:1, n68:1}, n68:{n67:1, n69:1}, n1:{n2:1, n59:1, n60:1}, n11:{n10:1, n12:1, n40:1 }, n21:{n20:1, n22:1}, n31:{n30:1, n32:1, n41:1}, n69:{n68:1}, };
	this.nodes = {n1:{id: 'n1', x:260, y: 390}, n2:{id: 'n2', x:251, y: 387}, n3:{id: 'n3', x:242, y: 384}, n4:{id: 'n4', x:233, y: 381}, n5:{id: 'n5', x:224, y: 378}, n6:{id: 'n6', x:215, y: 375}, n7:{id: 'n7', x:206, y: 372}, n8:{id: 'n8', x:197, y: 369}, n9:{id: 'n9', x:188, y: 366}, n10:{id: 'n10', x:179, y: 363}, n11:{id: 'n11', x:170, y: 360}, n12:{id: 'n12', x:163, y: 361}, n13:{id: 'n13', x:156, y: 362}, n14:{id: 'n14', x:149, y: 363}, n15:{id: 'n15', x:142, y: 364}, n16:{id: 'n16', x:135, y: 365}, n17:{id: 'n17', x:128, y: 366}, n18:{id: 'n18', x:121, y: 367}, n19:{id: 'n19', x:114, y: 368}, n20:{id: 'n20', x:107, y: 369}, n21:{id: 'n21', x:100, y: 370}, n22:{id: 'n22', x:100, y: 374}, n23:{id: 'n23', x:100, y: 378}, n24:{id: 'n24', x:100, y: 382}, n25:{id: 'n25', x:100, y: 386}, n26:{id: 'n26', x:100, y: 390}, n27:{id: 'n27', x:100, y: 394}, n28:{id: 'n28', x:100, y: 398}, n29:{id: 'n29', x:100, y: 402}, n30:{id: 'n30', x:100, y: 406}, n31:{id: 'n31', x:100, y: 410}, n32:{id: 'n32', x:107, y: 405}, n33:{id: 'n33', x:114, y: 400}, n34:{id: 'n34', x:121, y: 395}, n35:{id: 'n35', x:128, y: 390}, n36:{id: 'n36', x:135, y: 385}, n37:{id: 'n37', x:142, y: 380}, n38:{id: 'n38', x:149, y: 375}, n39:{id: 'n39', x:156, y: 370}, n40:{id: 'n40', x:163, y: 365}, n41:{id: 'n41', x:108, y: 409}, n42:{id: 'n42', x:116, y: 408}, n43:{id: 'n43', x:124, y: 407}, n44:{id: 'n44', x:132, y: 406}, n45:{id: 'n45', x:140, y: 405}, n46:{id: 'n46', x:148, y: 404}, n47:{id: 'n47', x:156, y: 403}, n48:{id: 'n48', x:164, y: 402}, n49:{id: 'n49', x:172, y: 401}, n50:{id: 'n50', x:180, y: 400}, n51:{id: 'n51', x:188, y: 399}, n52:{id: 'n52', x:196, y: 398}, n53:{id: 'n53', x:204, y: 397}, n54:{id: 'n54', x:212, y: 396}, n55:{id: 'n55', x:220, y: 395}, n56:{id: 'n56', x:228, y: 394}, n57:{id: 'n57', x:236, y: 393}, n58:{id: 'n58', x:244, y: 392}, n59:{id: 'n59', x:252, y: 391}, n60:{id: 'n60', x:264, y: 394}, n61:{id: 'n61', x:268, y: 398}, n62:{id: 'n62', x:272, y: 402}, n63:{id: 'n63', x:276, y: 406}, n64:{id: 'n64', x:280, y: 410}, n65:{id: 'n65', x:284, y: 414}, n66:{id: 'n66', x:288, y: 418}, n67:{id: 'n67', x:292, y: 422}, n68:{id: 'n68', x:296, y: 426}, n69:{id: 'n69', x:300, y: 430}, };
	this.keynodes = ['n1', 'n11', 'n21', 'n31', 'n69' ];
	this.snackManFinalPath = new Array();
	this.mapGraph = {};
	
	this.createGraph();
	
	this.currentNode = this.snackManFinalPath[0];

	  
	this.img = new Image();
	this.img.src = 'images/snackman.png';

};

// extracts some important information and creates the graph
SnackMan.prototype.createGraph = function() {

	for (var key = 0; key < this.keynodes.length; key++)
		this.snackManFinalPath[key] = this.nodes[this.keynodes[key]];
	
	this.graph = new Graph(this.path);
};


SnackMan.prototype.reset = function() {
	this.currentNode = this.snackManFinalPath[0];
};

SnackMan.prototype.draw = function(ctx) {
	ctx.drawImage( this.img, this.currentNode.x , this.currentNode.y - 32);
};

/**********************************************************/
/**          creates the commands to evaluate             */
/**********************************************************/
SnackMan.prototype.goToCustomer = function(consumer, id) {
  BlocklyApps.log.push(['GTC', consumer, id]);
};

SnackMan.prototype.goToDisplay = function(id) {
  BlocklyApps.log.push(['GTD', id]);
};

SnackMan.prototype.goToCooler = function(id) {
	  BlocklyApps.log.push(['GTCO', id]);
};

/**********************************************************/
/**              execute the commands                     */
/**********************************************************/
SnackMan.prototype.animateGoToConsumer = function(values) {
	
	var cust = values[0];
	// TODO precisa antes fazer a consistencia
	return this.animateSnackMan( this.snackManFinalPath[cust+1] );
	
};

SnackMan.prototype.animateGoToDisplay = function() {
	return this.animateSnackMan( this.snackManFinalPath[1] );
};

SnackMan.prototype.animateGoToCooler = function() {
	return this.animateSnackMan( this.snackManFinalPath[4] );
};

SnackMan.prototype.animateSnackMan = function(dest) {

	var solution = this.graph.findShortestPath(this.currentNode.id, dest.id);
	var that = this;
	for (var i=0;i<solution.length;i++) {
		
		Game.pidList.push( window.setTimeout( function(i, solution){
			that.changeSnackManPosition(that.nodes[solution[i]]);
			}.bind(this, i, solution), Game.stepSpeed*(i+1)) );
		
	}

	return solution.length;

};

SnackMan.prototype.changeSnackManPosition = function(node) {
	this.currentNode = node;
	Game.display();
};