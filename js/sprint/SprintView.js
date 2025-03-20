(function(views)
{
    var self;

    function SprintView(presenter)
    {
        this.presenter = presenter;
    }

    Object.defineProperties(SprintView.prototype,
    {
        init : {
            value: function()
            {
                var self = this;
                
				$(document).on("setup_complete", function ()
                {    
                    self.presenter.getIssueTypes();
                });
				
				$(document).on("board", function (evt, data)
                {
					$(".playlists > h2").html("");
					$("<div/>", {class: "title", html: "not active"}).appendTo($(".playlists > h2"));
                
					$("<i/>", {class: "iconMenu fas fa-exchange-alt"}).click(function()
					{
					   self.getSprints();
					}).appendTo($(".playlists > h2"));
					
                    self.board = data;
                });
				
                $(document).on("active_sprint", function (evt, data)
                {
                    self.changeSprint(data);
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
					
					var sprint = this;
					
					clone.click(function()
					{
						self.changeSprint(sprint);
						
						self.dialog[0].close();
					}).prependTo(boards);
				});
            },
            enumerable: false
        },
        onIssues : {
            value: function(data)
            {
                $.each(data.issues, function()
                {
                    var us = $("<div/>", {class: "menu-item", "us-id": this.key, html: "<i><img src='" + this.fields.issuetype.iconUrl + "'></i> " + this.fields.summary}).appendTo($(".playlists-list"));
                
                    us.click(function()
                    {
                        $.xhrPool.abortAll();
                        
                        $(".menu-item").removeClass("active");
                        $(this).addClass("active");
                    }) 
                });
                
                $(".playlists-list").trigger("loaded", data);
            },
            enumerable: false
        },
        changeSprint : {
            value: function(sprint)
            {
                var self = this;
                
				$(".playlists > h2").html("");
				$("<div/>", {class: "title", html: sprint.name}).appendTo($(".playlists > h2"));
				$(".playlists-list").html("");
				
				$("<i/>", {class: "iconMenu fas fa-exchange-alt"}).click(function()
				{
				   self.getSprints();
				}).appendTo($(".playlists > h2"));
				
				$(document).trigger("sprint", sprint);
				
				$(".main-view").html("");
				$(".menu-item").removeClass("active");
				
				self.presenter.getIssues(this.board.id, sprint.id, self.issueTypes);
            },
            enumerable: false
        },
		getSprints : {
            value: function()
            {
				var self = this;
				
                $(".modal-dialog").load("js/sprint/template.html", function()
                {
                    self.template = $(this);
                    
                    self.boardTemplate = self.template.find(".body li").detach();
                    
                    self.dialog = $(this).find(".board-dialog");
                    
                    self.dialog.find(".mdl-button.close").click(function()
                    {
                        self.dialog[0].close();
                    });
                   
                    self.dialog[0].showModal();
					
					self.presenter.getSprints(self.board.id);
                });
            },
            enumerable: false
        },onIssueTypes : {
            value: function(data)
            {
                this.issueTypes = data;
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

    views.SprintView = SprintView;
})(viewer.views);