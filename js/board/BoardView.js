(function(views)
{
    var self;

    function BoardView(presenter)
    {
        this.presenter = presenter;
    }

    Object.defineProperties(BoardView.prototype,
    {
        init : {
            value: function()
            {
                var self = this;
                
                $(document).on("setup_complete", function ()
                {    
                    self.presenter.getIssueTypes();
                });
            },
            enumerable: false
        },
        load : {
            value: function(data)
            {
				var self = this;
				
				var boards = this.template.find(".body");
                    
				$.each(data.values, function()
				{
					var clone = self.boardTemplate.clone();
					clone.html(this.name);
					
					var id = this.id;
					var name = this.name;
					
					clone.click(function()
					{
						self.presenter.setSetting("board", {id: id, name: name});
					}).appendTo(boards);
				});
            },
            enumerable: false
        },
        onSprint : {
            value: function(data)
            {
                if(data.values.length > 0)
				{
					$(document).trigger("active_sprint", data.values[0]);
				}
            },
            enumerable: false
        },
        changeBoard : {
            value: function(id, name)
            {
                var self = this;
                
                $(".your-music > h2").html("");
                
                $("<i/>", {class: "iconMenu fas fa-exchange-alt"}).click(function()
                {
                   self.getBoards();
                }).appendTo($(".your-music > h2"));
                
                $("<div/>", {class: "title", html: name}).appendTo($(".your-music > h2"));
                $(".your-music-list").html("");
                
				$(".main-view").html("");
				$(".menu-item").removeClass("active");
				
				$(document).trigger("board", {id: id, name: name});
				
                this.presenter.getSprint(id);
            },
            enumerable: false
        },
		getBoards : {
            value: function()
            {
				var self = this;
				
                $(".modal-dialog").load("js/board/template.html", function()
                {
                    self.template = $(this);
                    
                    self.boardTemplate = self.template.find(".body li").detach();
                    
                    self.dialog = $(this).find(".board-dialog");
                    
                    self.dialog.find(".mdl-button.close").click(function()
                    {
                        self.dialog[0].close();
                    });
                   
                    self.dialog[0].showModal();
					
					self.presenter.getBoards();
                });
            },
            enumerable: false
        },
        onLoadSettings : {
            value: function(data)
            {
                if(data.board != undefined)
                {
                    this.changeBoard(data.board.id, data.board.name);
                }
                else
                {
                    this.getBoards();
                }
            },
            enumerable: false
        },
        onSaveSetting : {
            value: function(data)
            {
                this.changeBoard(data.board.id, data.board.name);
                this.dialog[0].close();
            },
            enumerable: false
        },
        onIssueTypes : {
            value: function(data)
            {
                this.issueTypes = data;
                this.presenter.getSettings();
            },
            enumerable: false
        },
        showError : {
            value: function(data)
            {
                showError(data);
            },
            enumerable: false
        }
    });

    views.BoardView = BoardView;
})(viewer.views);