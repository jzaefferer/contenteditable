/**
 * Content editable widget.
 * 
 * Based on http://github.com/valums/editable
 */
(function( $ ) {
	
$.widget( "zeit.editable", {
	options: {
		newlinesEnabled : true
	},
	_create: function() {
        var options = this.options,
        	editable = this.element,
			self = this;
		
		this._trigger("create");
		
		editable
		.bind("click.editable", function() {
			if (!self.hasFocus) {
				self.hasFocus = true;
				self._startEditing();
			}
			self._updateToolbar();
		})
		.bind("blur.editable", function() {
			self._stopEditing();
		})
		.bind("keyup.editable", function() {
			self._cleanup();
			self._updateToolbar();
		})
		.bind("keydown.editable", function(event) {
			var range = getSelection().getRangeAt(0);
			var container = $(range.commonAncestorContainer);
			var lastNode = container[0].nodeType == 3 && container.parent().index() == container.parent().siblings().length;
			if (event.keyCode == $.ui.keyCode.DOWN && lastNode && $(range.commonAncestorContainer).text().length == range.endOffset) {
				var match = editable.parent().nextAll().find(":zeit-editable").filter(":first").click().focus();
				if (match.length) {
					var contents = match.children(":first").contents().filter(function() {
						return this.nodeType == 3;
					});
					if (contents.length) {
						var newParent = contents[0];
						range = getSelection().getRangeAt(0);
						range.setStart(newParent, 0);
						range.setEnd(newParent, 0);
					}
					self._stopEditing();
				}
				return false;
			}
			var firstNode = container[0].nodeType == 3 && container.parent().index() == 0;
			if (event.keyCode == $.ui.keyCode.UP && firstNode && range.startOffset == 0) {
				var match = editable.parent().prevAll().find(":zeit-editable").filter(":first").click().focus();
				if (match.length) {
					var contents = match.children(":last").contents().filter(function() {
						return this.nodeType == 3;
					});
					if (contents.length) {
						var newParent = contents[contents.length - 1];
						var offset = $(newParent).text().length;
						range = getSelection().getRangeAt(0);
						range.setStart(newParent, offset);
						range.setEnd(newParent, offset);
					}
					self._stopEditing();
				}
				return false;
			}
		})
		
		if (!options.newlinesEnabled){
			// Prevents user from adding newlines to headers, links, etc.
			editable.bind("keypress.editable", function(event){
				// event is cancelled if enter is pressed
				return event.which != 13;
			});
		}
		
		var tb = self.toolbar = $("<div class='rte-toolbar'><div>\
            <a href='#' tabindex='-1' class='rteButton bold'><span class='rte_bold'></span></a>\
            <a href='#' tabindex='-1' class='rteButton italic'><span class='rte_italic'></span></a>\
            <a href='#' tabindex='-1' class='rteButton unorderedlist'><span class='rte_insertunorderedlist'></span></a>\
            <a href='#' tabindex='-1' class='rteButton orderedlist'><span class='rte_insertorderedlist'></span></a>\
            <a href='#' tabindex='-1' class='rteButton intertitle'>T</a>\
            <a href='#' tabindex='-1' class='rteButton paragraph'>p</a>\
            <a href='#' tabindex='-1' class='rteButton link'>link</a>\
        </div></div>").appendTo(editable.prev()).hide();
		
        $('.bold', tb).click(function(){ self._command('bold'); return false; });
        $('.italic', tb).click(function(){ self._command('italic'); return false; });
        $('.unorderedlist', tb).click(function(){ self._command('insertunorderedlist'); return false; });
        $('.orderedlist', tb).click(function(){ self._command('insertorderedlist'); return false; });
        $('.intertitle', tb).click(function(){ self._command('formatBlock', 'h1'); return false; });
        $('.paragraph', tb).click(function(){ self._command('formatBlock', 'p'); return false; });
        $('.link', tb).click(function() {
			self.keepAlive = true;
			var url = prompt("Link?")
			self.keepAlive = false;
			self._command('createLink', url);
			return false;
		});
		
    },
	
	_command: function(command, option) {
        try {
            document.execCommand(command, false, option);
        } catch(e) {
			window.console && console.log(e)
		}
		this._updateToolbar();
	},
	
	_updateToolbar: function() {
		var range = getSelection().getRangeAt(0);
		var container = range.commonAncestorContainer;
		if (container.nodeType == 3) {
			var element = $(container).parent();
			if (element.is("h1")) {
				this.toolbar.find("a.intertitle").hide()
				this.toolbar.find("a.paragraph").show();
			} else {
				this.toolbar.find("a.intertitle").show()
				this.toolbar.find("a.paragraph").hide();
				if (element.is("b")) {
					this.toolbar.find("a.bold").addClass("active");
				} else {
					this.toolbar.find("a.bold").removeClass("active");
				}
			}
		}
	},
	
	_cleanup: function() {
		this.element.find("br").remove();
	},
	
	_startEditing: function() {
		var self = this;
		var contents = self.element.children(":first").contents().filter(function() {
			return this.nodeType == 3;
		})

		function merge(direction, modifier) {
			self.element
				.parent()
				[direction](":not(:has(.editable))")
				.find(":zeit-editable")
				.children()
				[modifier](self.element)
				.end()
				.end()
				.parent()
				.remove();
		}
		merge("nextUntil", "appendTo");
		merge("prevUntil", "prependTo");
		
		this.toolbar.show();       
        this.element.addClass("editing").attr('contentEditable', true).focus();
		this._command("styleWithCSS", false);

		if (contents.length) {
			var newParent = contents[0];
			range = getSelection().getRangeAt(0);
			range.setStart(newParent, 0);
			range.setEnd(newParent, 0);
		}
		
		this._updateToolbar();
	},
	
	_stopEditing: function() {
		if (this.keepAlive) {
			return;
		}
		var editable = this.element;
		this.destroy();
		editable
			.children()
			.wrap('<div><div class="editable"></div></div>')
			.parent()
			.editable(this.options)
			.parent()
			.insertAfter(editable.parent());
		editable.parent().remove();
	}
});

})( jQuery );