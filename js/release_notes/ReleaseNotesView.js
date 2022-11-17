(function(views)
{
    var self;

    function ReleaseNotesView(presenter)
    {
        this.presenter = presenter;
    }

    Object.defineProperties(ReleaseNotesView.prototype,
    {
        init : {
            value: function()
            {
                var self = this;

                this.issues = [];
                
                $(".playlists-list").on("loaded", function (evt, data)
                {             
                    self.issues = data.issues;
                });
                
                $(document).on("login", function ()
                {             
                    var menu = $("<div/>", {class: "menu-item", href: "", html: "<i class=\"icon icomoon-arrow-down-right\"></i>Release Notes"});
                    menu.appendTo($(".left-panel-inner .content .main-menu"));
                    menu.click(function()
                    {
                        $.xhrPool.abortAll();
                        
                        $(".menu-item").removeClass("active");
                        $(this).addClass("active");
                
                        self.presenter.getSettings();
                    });
                });
            },
            enumerable: false
        },
        onLoadSettings : {
            value: function(data)
            {
				var self = this;
				
                this.settings = data;
                
				$(".modal-dialog").load("js/worklog/projects.html", function()
				{
					self.template = $(this);
					
					self.projectsTemplate = self.template.find(".body li").detach();
					
					self.dialog = $(this).find(".project-dialog");
					
					self.dialog.find(".mdl-button.close").click(function()
					{
						self.dialog[0].close();
					});
					
					self.dialog.find(".mdl-button.confirm").click(function()
					{
						self.commit();
					});
				   
					self.dialog[0].showModal();
					
					self.presenter.getProjects();
				});
            },
            enumerable: false
        },
        onProjects : {
            value: function(data)
            {
				var self = this;
				
				var projects = this.template.find(".body");
                    
				$.each(data, function()
				{
					var clone = self.projectsTemplate.clone();
					clone.html("<img class='icon' src='" + this.avatarUrls["24x24"] + "'/><span class='status_id'>" + this.id +"</span>" + this.name);
					
					var id = this.key;
					var name = this.name;
					
					clone.click(function()
					{
						$(this).toggleClass("active");
                        var cnt = self.dialog.find(".body .context-menu-item.active").length;
						self.dialog.find(".selection").html(cnt + " elements selected");
					}).appendTo(projects);
				});
            },
            enumerable: false
        },
		commit : {
            value: function(data)
            {
				var self = this;
				
                $(".main-view").load("js/release_notes/template.html", function()
                {
					$.each($(self.dialog).find(".body .context-menu-item.active"), function()
					{
						$("<h3/>", {html: $(this).html()}).appendTo($(".uncommited-table-container"));
						
						self.presenter.getVersions($(this).find(".status_id").text());
					});
                });
				
				this.dialog[0].close();
            },
            enumerable: false
        },
		onVersions : {
            value: function(project, data)
            {
				var self = this;
				
				var ul = $("<ul/>");
				
				$.each(data.values, function(key, value)
				{
					$("<li/>", {id: "version" + value.id, html: value.name}).click(function()
					{
						self.presenter.getUserStories(project, value.name, value.id);
					}).appendTo(ul);
				});
				
				ul.appendTo($(".uncommited-table-container"));
            },
            enumerable: false
        },
		onUserStories : {
            value: function(data, versionId)
            {
				$.each(data.issues, function(key, value)
				{
					$("<div/>", {html: value.key + ": " + value.fields.summary}).appendTo($("#version" + versionId))
				});
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

    views.ReleaseNotesView = ReleaseNotesView;
})(viewer.views);