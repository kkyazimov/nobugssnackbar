'use strict';
/**
 * Modification of some basic functions
 **/
var MyBlocklyApps = {};

MyBlocklyApps.showDialog = function(content, origin, animate, modal, centered, title, style,
                                  disposeFunc) {
  if (BlocklyApps.isDialogVisible_) {
	  MyBlocklyApps.hideDialog(false);
  }
  BlocklyApps.isDialogVisible_ = true;
  BlocklyApps.dialogOrigin_ = origin;
  BlocklyApps.dialogDispose_ = disposeFunc;
  
  var dialog = document.getElementById('dialog');
  dialog.style["width"] = "auto";
  dialog.style["height"] = "auto";

  var shadow = document.getElementById('dialogShadow');
  var border = document.getElementById('dialogBorder');

  // Copy all the specified styles to the dialog.
  for (var name in style) {
    dialog.style[name] = style[name];
  }
  if (modal) {
    shadow.style.visibility = 'visible';
    shadow.style.opacity = 0.3;
    var header = document.createElement('div');
    header.id = 'dialogHeader';
    if (title != null)
    	header.innerHTML = "<b>" + title + "</b>";
    
    dialog.appendChild(header);
    BlocklyApps.dialogMouseDownWrapper_ =
        Blockly.bindEvent_(header, 'mousedown', null,
                           BlocklyApps.dialogMouseDown_);
  }
  
  dialog.appendChild(content);
  content.className = content.className.replace('dialogHiddenContent', '');
  
  if (centered) {
	  dialog.style['top'] =
	     Math.max(0, ((window.innerHeight - dialog.clientHeight) / 2)) + "px";
	  
	  dialog.style['left'] =
		  Math.max(0, ((window.innerWidth - dialog.clientWidth) / 2)) + "px";
  }

  function endResult() {
    // Check that the dialog wasn't closed during opening.
    if (BlocklyApps.isDialogVisible_) {
      dialog.style.visibility = 'visible';
      dialog.style.zIndex = 1;
      border.style.visibility = 'hidden';
    }
  }
  if (animate && origin) {
    BlocklyApps.matchBorder_(origin, false, 0.2);
    BlocklyApps.matchBorder_(dialog, true, 0.8);
    // In 175ms show the dialog and hide the animated border.
    window.setTimeout(endResult, 175);
  } else {
    // No animation.  Just set the final state.
    endResult();
  }
};

// the difference instead the original is, that here the disposeFunc is called at the end, after hidden the whole dialog
MyBlocklyApps.hideDialog = function(opt_animate) {
	  if (!BlocklyApps.isDialogVisible_) {
	    return;
	  }
	  BlocklyApps.dialogUnbindDragEvents_();
	  if (BlocklyApps.dialogMouseDownWrapper_) {
	    Blockly.unbindEvent_(BlocklyApps.dialogMouseDownWrapper_);
	    BlocklyApps.dialogMouseDownWrapper_ = null;
	  }

	  BlocklyApps.isDialogVisible_ = false;
	  var origin = (opt_animate === false) ? null : BlocklyApps.dialogOrigin_;
	  var dialog = document.getElementById('dialog');
	  var shadow = document.getElementById('dialogShadow');
	  var border = document.getElementById('dialogBorder');

	  shadow.style.opacity = 0;

	  function endResult() {
	    shadow.style.visibility = 'hidden';
	    border.style.visibility = 'hidden';
	  }
	  if (origin) {
	    BlocklyApps.matchBorder_(dialog, false, 0.8);
	    BlocklyApps.matchBorder_(origin, true, 0.2);
	    // In 175ms hide both the shadow and the animated border.
	    window.setTimeout(endResult, 175);
	  } else {
	    // No animation.  Just set the final state.
	    endResult();
	  }
	  dialog.style.visibility = 'hidden';
	  dialog.style.zIndex = -1;
	  var header = document.getElementById('dialogHeader');
	  if (header) {
	    header.parentNode.removeChild(header);
	  }
	  while (dialog.firstChild) {
	    var content = dialog.firstChild;
	    content.className += ' dialogHiddenContent';
	    document.body.appendChild(content);
	  }
	  BlocklyApps.dialogDispose_ && BlocklyApps.dialogDispose_();
	  BlocklyApps.dialogDispose_ = null;
	};

MyBlocklyApps.unbindClick = function(el, func) {
	  if (typeof el == 'string') {
	    el = document.getElementById(el);
	  }
	  el.removeEventListener('click', func);
	  el.removeEventListener('touchend', func);
	};

	
MyBlocklyApps.newShowModalDialog = function(content) {
	
	var dialog = $('<div />')
			.css({width: "800px", height: "600px", zIndex: "1"})
			.addClass("dialog");
	
	dialog.css("visibility", "visible");
	dialog.html(content);
	
	var top_ = Math.max(0, ((window.innerHeight - dialog.height()) / 2));
	var left_ = Math.max(0, ((window.innerWidth - dialog.width()) / 2));
	dialog.offset({ top: top_, left: left_ });
	
	$( "body" ).append( dialog );
	

	
};

/**
 * Multiple blocks selection then CTRL+C and CTRL+V.
 * I modified some methods.
 */ 

var afterMyMouseDown = Blockly.onMouseDown_;
var afterMyPaste = Blockly.WorkspaceSvg.prototype.paste;
var beforeMyKeyDown = Blockly.onKeyDown_;
var afterMyMouseMove = Blockly.onMouseMove_;

var myIsTargetSvg = false;

Blockly.onMouseDown_ = function(e) {
	myIsTargetSvg = e.target && e.target.nodeName &&
    					e.target.nodeName.toLowerCase() == 'svg';
	afterMyMouseDown(e);
	myIsTargetSvg = false;
};

Blockly.BlockSvg.prototype.checkBlocks = function(base, typeAction, compare) {
	var notNull = base.nextConnection.targetConnection != null;
	for (var i = 0; i < base.childBlocks_.length; i++) {
		var testBlock = base.childBlocks_[i];
		if ((notNull && testBlock != base.nextConnection.targetConnection.sourceBlock_) || !notNull)
			while (testBlock != null) {
				
				if (typeAction == 1) {
	
					var idx = Game.blocksSelected.indexOf(testBlock);
					if (idx != -1) {
						Game.blocksSelected[idx].unselect();
						Game.blocksSelected.splice(idx, 1);
					} else 
						if (testBlock.type === "controls_if") {
							this.checkBlocks(testBlock, 1);
						}
					
					
				} else {
					
					if (testBlock == compare)
						return false;
				}
				
				if (testBlock.nextConnection != null && testBlock.nextConnection.targetConnection != null)
					testBlock = testBlock.nextConnection.targetConnection.sourceBlock_;
				else
					testBlock = null;
			}
	}
	
	return true;

};

Blockly.BlockSvg.prototype.select = function() {
	myIsTargetSvg = false;
    // Unselect any previously selected block.
	if (!Game.CTRLPRESSED) {
		Game.blocksSelected.forEach(function(block) {block.unselect(); });
		Game.blocksSelected = [];
		if (Blockly.selected)
			Blockly.selected.unselect();
	} else {
		if (Blockly.selected && Blockly.selected != this && Game.blocksSelected.length == 0)
			Game.blocksSelected.push(Blockly.selected);
		else {
			var idx = Game.blocksSelected.indexOf(this);
			if (idx != -1) {
				
				Game.blocksSelected.splice(idx, 1);
				this.unselect();
				
				return;
			}
			
		}
	    if (Game.blocksSelected.length > 0) {
	  		// if there are blocks that have this block as child, then doesnt add the current block
	  		var testBlock = this.parentBlock_;
	  		var compare = this;
	  		
	  		while (testBlock != null) {
	  			
	  			if (testBlock.type === "controls_if") {
	  				if (Game.blocksSelected.indexOf(testBlock) == -1)
	  					compare = testBlock;
	  				else 
	      				if (!this.checkBlocks(testBlock, 2, compare)) {
	      					return;
	      				}
	  			}
	  			
	  			testBlock = testBlock.parentBlock_;
	  		}

	  		if (this.type === "controls_if") {
	    		
	    		// if there are blocks selected which belongs to the current block, then unselects them 
	    		
	    		this.checkBlocks(this, 1);
	    		
	      	}
	    	
	    	// put together the blocks that are connected... Afterwards, when they are copying, the elements get together too
	  		var found = false;
	    	for (var i = 0; i < Game.blocksSelected.length; i++) {
	    		
	    		var block = Game.blocksSelected[i];
	    		var tb = null;
	    		if (i < Game.blocksSelected.length - 1)
	    			tb = Game.blocksSelected[i+1];
	    		
	    		while (block != null && block.nextConnection != null && block != tb) {
	    			var targetBlock = block.nextConnection.targetConnection;
	        		if (targetBlock != null && targetBlock.sourceBlock_.id === this.id) {
	        			Game.blocksSelected.splice(i+1, 0, this);
	        			found = true;
	        			break;
	        		}
	        		if (targetBlock == null)
	        			block = null;
	        		else
	        			block = targetBlock.sourceBlock_;
	    		}
	    		if (found)
	    			break;
	    		
	    	}

	  		/*
	  		var found = false;
	    	for (var i = 0; i < Game.blocksSelected.length; i++) {
	    		var block = Game.blocksSelected[i];
	    		if (block.nextConnection != null) {
	        		var targetBlock = block.nextConnection.targetConnection;
	        		if (targetBlock != null && targetBlock.sourceBlock_.id === this.id) {
	        			Game.blocksSelected.splice(i+1, 0, this);
	        			found = true;
	        			break;
	        		} else {
	        			targetBlock = this.nextConnection.targetConnection;
	        			if (targetBlock != null && targetBlock.sourceBlock_.id === block.id) {
	            			Game.blocksSelected.splice(i, 0, this);
	            			found = true;
	            			break;
	       				
	        			}
	        		}
	    		}
	    	}
	    	*/
	    	if (!found)
	    		Game.blocksSelected.splice(0,0,this);
	    }
	    
	}
	
    	
    Blockly.selected = this;
    this.addSelect();

    Blockly.fireUiEvent(this.workspace.getCanvas(), 'blocklySelectChange');
};

Blockly.BlockSvg.prototype.unselect = function() {
	if (Game.blocksSelected.length > 0 && myIsTargetSvg) {
		Game.blocksSelected.forEach(function(block) { block.removeSelect(); });
		Game.blocksSelected = [];
	} else {
		this.removeSelect();
	}
	  
	
	if (Game.blocksSelected.length > 0) {
		Blockly.selected = Game.blocksSelected[Game.blocksSelected.length-1];
	} else
		Blockly.selected = null;
	
	Blockly.fireUiEvent(this.workspace.getCanvas(), 'blocklySelectChange');
};

Blockly.copy_ = function(block) {
	if (Game.blocksSelected.length > 0) {

		Blockly.clipboard_ = [];
		var beforeBlock = null;
		var beforeCopyBlock = null;
		Game.blocksSelected.forEach(function(_block){
			
			var xmlCopy = Blockly.littleCopy_(_block);
			var previousBlock = null;
			if (beforeBlock != null) {
				if (beforeBlock.nextConnection.targetConnection != null && 
						beforeBlock.nextConnection.targetConnection.sourceBlock_.id === _block.id) {
					previousBlock = beforeCopyBlock;
				}
			}
			
			Blockly.clipboard_.push({xml: xmlCopy, previous: previousBlock});
			beforeCopyBlock = xmlCopy;
			beforeBlock = _block;
		});
		
	} else 
		
		Blockly.clipboard_ = [{xml: Blockly.littleCopy_(block), previous: null}];

};

Blockly.littleCopy_ = function(block) {
	
	var xmlBlock = Blockly.Xml.blockToDom_(block);
	Blockly.Xml.deleteNext(xmlBlock);
	// Encode start position in XML.
	var xy = block.getRelativeToSurfaceXY();
	xmlBlock.setAttribute('x', Blockly.RTL ? -xy.x : xy.x);
	xmlBlock.setAttribute('y', xy.y);
	return xmlBlock;
};

Blockly.WorkspaceSvg.prototype.paste = function(xmlBlock) {
	var workspaceSvg = this;
	var pastedBlocks = [];
	var lastBlock = null;
	
	if (Blockly.selected != null)
		Blockly.selected.unselect();
	
	Blockly.clipboard_.forEach(function(_xmlBlock) { 
		var m = afterMyPaste.bind(workspaceSvg, _xmlBlock.xml);
		m();
		var newBlock = Blockly.mainWorkspace.getBlockById( _xmlBlock.xml.id );
		if (_xmlBlock.previous != null) {
			pastedBlocks[pastedBlocks.length-1].nextConnection.connect(Blockly.selected.previousConnection);
		}
		pastedBlocks.push(Blockly.selected);
		lastBlock = newBlock;
	});
	
	Game.blocksSelected = pastedBlocks;
	Game.blocksSelected.forEach( function(block) { block.addSelect(); } );
};

Blockly.onKeyDown_ = function (e) {
   if (Blockly.isTargetInput_(e)) {
	    // When focused on an HTML text input widget, don't trap any keys.
	    return;
    }
	
	beforeMyKeyDown(e);
	
	if (e.ctrlKey && e.keyCode == 88) {
		
		Game.blocksSelected.forEach(function(block) {
			if (block.isDeletable() && block.isMovable())
				block.dispose(true, true);
		});
		
	} else {
		if (e.keyCode == 8 || e.keyCode == 46) {
			
			 try {
				Game.blocksSelected.forEach(function(block) { 
					
					if (block.isDeletable()) {
					
						block.dispose(true, true);
					}
				});

				Game.blocksSelected = [];
			 } finally {
			      // Stop the browser from going back to the previous page.
			      // Use a finally so that any error in delete code above doesn't disappear
			      // from the console when the page rolls back.
			      e.preventDefault();
			 }
		}
	}
};

Blockly.onMouseMove_ = function(e) {
	
	Game.blocksSelected.forEach(function(block) {

		if (block != Blockly.selected)
			block.removeSelect(); 
	});
	Game.blocksSelected = [];
	
	afterMyMouseMove(e);
	
};